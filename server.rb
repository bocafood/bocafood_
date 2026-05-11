require 'webrick'
require 'json'
require 'net/http'
require 'uri'
require 'base64'
require 'time'
require 'open3'
require 'tempfile'
require 'fileutils'
require 'shellwords'
require 'openssl'
require 'securerandom'
require 'cgi'
require_relative 'tools/generate-product-pages'

ROOT = File.dirname(File.expand_path(__FILE__))
STORE_FILE = File.join(ROOT, '.master-store.json')
LOG_FILE = File.join(ROOT, '.master.log')
BACKUP_CONFIG_KEY = 'system_backup'

PUBLIC_FILES = %w[
  index.html
  logo.png
  review.html
  track.html
  produtos.json
  sitemap.xml
  robots.txt
].freeze

PUBLIC_DIRS = %w[
  assets
  js
  produtos
].freeze

INTERNAL_FILES = %w[
  admin.html
  master.html
  financeiro.html
  firestore.rules
  server.rb
  server.js
].freeze

INTERNAL_DIRS = %w[
  tools
  data
].freeze

def json_response(res, status, body)
  res.status = status
  res['Content-Type'] = 'application/json; charset=utf-8'
  res.body = JSON.pretty_generate(body)
end

def allowed_cors_origin?(origin)
  allowed = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://bocado-brasil.web.app',
    'https://bocado-brasil.firebaseapp.com'
  ]
  allowed.include?(origin.to_s.strip)
end

def apply_cors_headers(res, origin)
  return unless allowed_cors_origin?(origin)
  res['Access-Control-Allow-Origin'] = origin.to_s.strip
  res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
  res['Access-Control-Max-Age'] = '3600'
  res['Vary'] = 'Origin'
end

def json_response_cors(req, res, status, body)
  apply_cors_headers(res, req['Origin'] || req['origin'])
  json_response(res, status, body)
end

def read_json(req)
  JSON.parse(req.body.to_s.empty? ? '{}' : req.body.to_s)
rescue JSON::ParserError
  {}
end

def master_store
  return { 'tenants' => [], 'deleted_tenants' => [], 'templates' => [], 'global_config' => {}, 'publications' => [] } unless File.exist?(STORE_FILE)
  JSON.parse(File.read(STORE_FILE))
rescue JSON::ParserError
  { 'tenants' => [], 'deleted_tenants' => [], 'templates' => [], 'global_config' => {}, 'publications' => [] }
end

def save_store(data)
  File.write(STORE_FILE, JSON.pretty_generate(data))
end

def log_master(message)
  File.open(LOG_FILE, 'a') { |f| f.puts("[#{Time.now.utc.iso8601}] #{message}") }
end

def tenant_from_body(body, existing = {})
  now = Time.now.utc.iso8601
  id = body['id'].to_s.strip
  raise WEBrick::HTTPStatus::BadRequest, 'ID do usuário obrigatório' if id.empty?
  # Se já existe um tenant com esse id, o id final é sempre o original — impede alteração acidental
  final_id = existing['id'].to_s.strip.empty? ? id : existing['id'].to_s.strip
  github_token = body.key?('githubToken') ? body['githubToken'].to_s.strip : existing['githubToken'].to_s
  role = body['role'].to_s.strip
  role = existing['role'].to_s.strip if role.empty? && !existing['role'].to_s.strip.empty?
  role = 'store_owner' if role.empty?
  role = firebase_normalize_role(role)

  existing.merge({
    'id' => final_id,
    'name' => body['name'].to_s.strip,
    'email' => body['email'].to_s.strip,
    'ownerName' => body['ownerName'].to_s.strip,
    'phone' => body['phone'].to_s.strip,
    'whatsapp' => body.key?('whatsapp') ? body['whatsapp'].to_s.strip : existing['whatsapp'].to_s,
    'businessName' => body['businessName'].to_s.strip,
    'document' => body['document'].to_s.strip,
    'plan' => body['plan'].to_s.strip.empty? ? 'starter' : body['plan'].to_s.strip,
    'status' => body['status'].to_s.strip.empty? ? 'active' : body['status'].to_s.strip,
    'role' => role,
    'fiscalCountry' => body['fiscalCountry'].to_s.strip.empty? ? (existing['fiscalCountry'] || 'ES') : body['fiscalCountry'].to_s.strip,
    'domain' => body['domain'].to_s.strip,
    'storeUrl' => body['storeUrl'].to_s.strip,
    'adminUrl' => body['adminUrl'].to_s.strip,
    'seedFile' => body['seedFile'].to_s.strip,
    'source' => body['source'].to_s.strip,
    'notes' => body['notes'].to_s.strip,
    'githubRepo' => body['githubRepo'].to_s.strip,
    'githubBranch' => body['githubBranch'].to_s.strip.empty? ? 'main' : body['githubBranch'].to_s.strip,
    'githubToken' => github_token,
    'publicFile' => body['publicFile'].to_s.strip.empty? ? 'index.html' : body['publicFile'].to_s.strip,
    'createdAt' => existing['createdAt'] || now,
    'updatedAt' => now
  })
end

def publication_base_url(repo, tenant_cfg = {})
  domain = tenant_cfg['domain'].to_s.strip
  domain = tenant_cfg['storeUrl'].to_s.strip if domain.empty?
  if domain.empty?
    owner, name = repo.to_s.split('/', 2)
    return "https://#{owner}.github.io/#{name}" if owner && name
    return ''
  end
  domain = "https://#{domain}" unless domain.match?(%r{\Ahttps?://}i)
  domain.sub(%r{/\z}, '')
end

def publication_store_name(tenant_cfg = {})
  tenant_cfg['businessName'].to_s.strip.empty? ? tenant_cfg['name'].to_s.strip : tenant_cfg['businessName'].to_s.strip
end

def publication_whatsapp(tenant_cfg = {})
  whatsapp = tenant_cfg['whatsapp'].to_s.strip
  whatsapp = tenant_cfg['phone'].to_s.strip if whatsapp.empty?
  whatsapp
end

def tenant_config_data(tenant_id, doc_id)
  doc = firestore_get_document("tenants/#{tenant_id}/config", doc_id)
  doc ? firestore_fields_to_hash(doc['fields'] || {}) : {}
rescue => e
  log_master("tenant config read error tenant=#{tenant_id} doc=#{doc_id} #{e.class}: #{e.message}")
  {}
end

def publication_seo_title(tenant_id)
  seo = tenant_config_data(tenant_id, 'seo')
  seo['title'].to_s.strip
end

def tenant_image_repo_config(tenant_cfg = {})
  raw_repo = tenant_cfg['githubRepo'].to_s.strip
  owner = tenant_cfg['repoOwner'].to_s.strip
  name = tenant_cfg['repoName'].to_s.strip

  if raw_repo.include?('/')
    raw_owner, raw_name = raw_repo.split('/', 2)
    owner = raw_owner.to_s.strip if owner.empty?
    name = raw_name.to_s.strip if name.empty?
  end

  repo = if !owner.empty? && !name.empty?
    "#{owner}/#{name}"
  else
    raw_repo
  end

  branch = tenant_cfg['branch'].to_s.strip
  branch = tenant_cfg['githubBranch'].to_s.strip if branch.empty?
  branch = 'main' if branch.empty?

  image_path = tenant_cfg['imagePath'].to_s.strip
  image_path = 'images/produtos' if image_path.empty?
  image_path = clean_rel_path(image_path)
  image_path = image_path.sub(%r{/+\z}, '')
  image_path = 'images/produtos' if image_path.empty?

  {
    'repoOwner' => owner,
    'repoName' => name,
    'repo' => repo,
    'branch' => branch,
    'imagePath' => image_path
  }
end

def append_publication_record(store, record)
  store['publications'] ||= []
  store['publications'] << record
  store['publications'] = store['publications'].last(100)
  save_store(store)
end

def backup_config(store)
  cfg = (store['global_config'] || {})[BACKUP_CONFIG_KEY] || {}
  {
    'repo' => cfg['repo'].to_s.strip,
    'branch' => cfg['branch'].to_s.strip.empty? ? 'main' : cfg['branch'].to_s.strip,
    'updatedAt' => cfg['updatedAt'].to_s
  }
end

def save_backup_config(store, repo, branch)
  store['global_config'] ||= {}
  store['global_config'][BACKUP_CONFIG_KEY] = {
    'repo' => repo.to_s.strip,
    'branch' => branch.to_s.strip.empty? ? 'main' : branch.to_s.strip,
    'updatedAt' => Time.now.utc.iso8601
  }
  save_store(store)
end

def firebase_project_id
  env = ENV['FIREBASE_PROJECT_ID'].to_s.strip
  env.empty? ? 'bocado-brasil' : env
end

def firebase_web_api_key
  env = ENV['FIREBASE_WEB_API_KEY'].to_s.strip
  env.empty? ? 'AIzaSyAZk2mEPXR-VQOOEJWfcdhqoJOhHWjzda4' : env
end

def firebase_service_account_raw
  raw = ENV['FIREBASE_SERVICE_ACCOUNT_JSON'].to_s.strip
  if raw.empty?
    path = ENV['FIREBASE_SERVICE_ACCOUNT_FILE'].to_s.strip
    path = ENV['GOOGLE_APPLICATION_CREDENTIALS'].to_s.strip if path.empty?
    raw = File.read(path) if !path.empty? && File.file?(path)
  end
  raw
end

def firebase_service_account_data
  raw = firebase_service_account_raw
  return nil if raw.to_s.strip.empty?
  JSON.parse(raw)
rescue JSON::ParserError => e
  raise "Service account Firebase inválida: #{e.message}"
end

def firebase_scopes
  ['https://www.googleapis.com/auth/cloud-platform']
end

def base64url(str)
  Base64.urlsafe_encode64(str).delete('=')
end

def google_http_json(method, url, body = nil, headers = {})
  uri = URI(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == 'https'
  request = case method.to_s.upcase
  when 'GET' then Net::HTTP::Get.new(uri.request_uri)
  when 'POST' then Net::HTTP::Post.new(uri.request_uri)
  when 'PATCH' then Net::HTTP::Patch.new(uri.request_uri)
  when 'PUT' then Net::HTTP::Put.new(uri.request_uri)
  when 'DELETE' then Net::HTTP::Delete.new(uri.request_uri)
  else raise ArgumentError, "Método HTTP não suportado: #{method}"
  end
  headers.each { |k, v| request[k] = v }
  if body
    request.body = body.is_a?(String) ? body : JSON.generate(body)
    request['Content-Type'] ||= 'application/json'
  end
  response = http.request(request)
  parsed = JSON.parse(response.body.to_s) rescue {}
  [response, parsed]
end

def google_oauth_access_token(scopes = firebase_scopes)
  sa = firebase_service_account_data
  raise 'Service account Firebase não configurada no servidor.' unless sa

  @google_oauth_cache ||= {}
  cache_key = scopes.join(' ')
  cached = @google_oauth_cache[cache_key]
  now = Time.now.to_i
  if cached && cached[:access_token] && cached[:expires_at].to_i > now + 60
    return cached[:access_token]
  end

  token_uri = sa['token_uri'].to_s.strip.empty? ? 'https://oauth2.googleapis.com/token' : sa['token_uri'].to_s.strip
  audience = token_uri
  issued_at = now
  expires_at = now + 3600
  header = base64url(JSON.generate({ alg: 'RS256', typ: 'JWT' }))
  payload = base64url(JSON.generate({
    iss: sa['client_email'],
    scope: scopes.join(' '),
    aud: audience,
    iat: issued_at,
    exp: expires_at
  }))
  unsigned = "#{header}.#{payload}"
  key = OpenSSL::PKey::RSA.new(sa['private_key'])
  signature = base64url(key.sign(OpenSSL::Digest::SHA256.new, unsigned))
  assertion = "#{unsigned}.#{signature}"

  # Rebuild the request with form data to keep the implementation local and avoid extra deps.
  uri = URI(token_uri)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == 'https'
  form = Net::HTTP::Post.new(uri.request_uri)
  form.set_form_data({
    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion' => assertion
  })
  token_response = http.request(form)
  token_data = JSON.parse(token_response.body.to_s) rescue {}
  unless token_response.is_a?(Net::HTTPSuccess)
    raise "Falha ao obter token OAuth do service account: #{token_data['error_description'] || token_data['error'] || token_response.body.to_s}"
  end

  @google_oauth_cache[cache_key] = {
    access_token: token_data['access_token'],
    expires_at: now + token_data['expires_in'].to_i
  }
  token_data['access_token']
rescue => e
  raise "Falha ao autenticar service account: #{e.message}"
end

def google_auth_headers
  {
    'Authorization' => "Bearer #{google_oauth_access_token}",
    'Accept' => 'application/json'
  }
end

def firebase_normalize_role(role)
  r = role.to_s.strip
  return 'store_owner' if r.empty? || r == 'tenant_owner'
  return 'master_admin' if r == 'master'
  return 'store_staff' if r == 'manager'
  r
end

def firebase_role_label(role)
  case firebase_normalize_role(role)
  when 'master_admin' then 'Master admin'
  when 'store_owner' then 'Dono da loja'
  when 'store_staff' then 'Equipe da loja'
  when 'store_customer' then 'Cliente da loja'
  when 'pending_classification' then 'Pendente de classificação'
  when 'disabled' then 'Bloqueado'
  else firebase_normalize_role(role)
  end
end

def firebase_role_authorized_for_admin?(role)
  %w[master_admin store_owner store_staff tenant_owner manager master].include?(firebase_normalize_role(role))
end

def firebase_auth_users_list
  users = []
  page_token = nil
  loop do
    query = { 'maxResults' => '1000' }
    query['nextPageToken'] = page_token if page_token && !page_token.to_s.empty?
    url = "https://identitytoolkit.googleapis.com/v1/projects/#{firebase_project_id}/accounts:batchGet?#{URI.encode_www_form(query)}"
    response, parsed = google_http_json('GET', url, nil, google_auth_headers)
    unless response.is_a?(Net::HTTPSuccess)
      raise "Falha ao listar Firebase Auth: #{parsed['error'] || response.body.to_s}"
    end
    batch = parsed['users'] || parsed['userInfo'] || []
    users.concat(batch.map do |u|
      {
        'uid' => u['localId'] || u['uid'],
        'email' => u['email'].to_s.strip,
        'displayName' => u['displayName'].to_s.strip,
        'photoUrl' => u['photoUrl'].to_s.strip,
        'disabled' => !!u['disabled'],
        'emailVerified' => !!u['emailVerified'],
        'createdAt' => u['createdAt'].to_s,
        'lastLoginAt' => u['lastLoginAt'].to_s,
        'raw' => u
      }
    end)
    page_token = parsed['nextPageToken'].to_s.strip
    break if page_token.empty?
  end
  users
end

def firestore_field_value(value)
  case value
  when nil
    { 'nullValue' => nil }
  when true, false
    { 'booleanValue' => !!value }
  when Integer
    { 'integerValue' => value.to_s }
  when Float
    { 'doubleValue' => value }
  when Time
    { 'timestampValue' => value.utc.iso8601 }
  when String
    { 'stringValue' => value }
  when Array
    { 'arrayValue' => { 'values' => value.map { |item| firestore_field_value(item) } } }
  when Hash
    { 'mapValue' => { 'fields' => firestore_fields_from_hash(value) } }
  else
    { 'stringValue' => value.to_s }
  end
end

def firestore_fields_from_hash(hash)
  out = {}
  hash.each do |key, value|
    next if key.to_s.empty?
    out[key.to_s] = firestore_field_value(value)
  end
  out
end

def firestore_value_to_ruby(value)
  return nil unless value.is_a?(Hash)
  if value.key?('stringValue')
    value['stringValue']
  elsif value.key?('booleanValue')
    !!value['booleanValue']
  elsif value.key?('integerValue')
    value['integerValue'].to_i
  elsif value.key?('doubleValue')
    value['doubleValue'].to_f
  elsif value.key?('timestampValue')
    value['timestampValue']
  elsif value.key?('nullValue')
    nil
  elsif value.key?('arrayValue')
    (value.dig('arrayValue', 'values') || []).map { |item| firestore_value_to_ruby(item) }
  elsif value.key?('mapValue')
    firestore_fields_to_hash(value.dig('mapValue', 'fields') || {})
  else
    value
  end
end

def firestore_fields_to_hash(fields)
  out = {}
  (fields || {}).each do |key, value|
    out[key] = firestore_value_to_ruby(value)
  end
  out
end

def firestore_list_documents(collection_id)
  docs = []
  page_token = nil
  loop do
    query = { 'pageSize' => '1000' }
    query['pageToken'] = page_token if page_token && !page_token.to_s.empty?
    url = "https://firestore.googleapis.com/v1/projects/#{firebase_project_id}/databases/(default)/documents/#{collection_id}?#{URI.encode_www_form(query)}"
    response, parsed = google_http_json('GET', url, nil, google_auth_headers)
    unless response.is_a?(Net::HTTPSuccess)
      raise "Falha ao listar Firestore #{collection_id}: #{parsed['error'] || response.body.to_s}"
    end
    docs.concat(parsed['documents'] || [])
    page_token = parsed['nextPageToken'].to_s.strip
    break if page_token.empty?
  end
  docs
end

def firestore_get_document(collection_id, doc_id)
  url = "https://firestore.googleapis.com/v1/projects/#{firebase_project_id}/databases/(default)/documents/#{collection_id}/#{CGI.escape(doc_id.to_s)}"
  response, parsed = google_http_json('GET', url, nil, google_auth_headers)
  return nil if response.code.to_i == 404
  raise "Falha ao ler Firestore #{collection_id}/#{doc_id}: #{parsed['error'] || response.body.to_s}" unless response.is_a?(Net::HTTPSuccess)
  parsed
end

def firestore_upsert_document(collection_id, doc_id, fields)
  now = Time.now.utc.iso8601
  existing = firestore_get_document(collection_id, doc_id)
  merged = fields.dup
  merged['createdAt'] ||= existing ? firestore_value_to_ruby(existing.dig('fields', 'createdAt')) : now
  merged['updatedAt'] = now
  body = {
    'name' => "projects/#{firebase_project_id}/databases/(default)/documents/#{collection_id}/#{doc_id}",
    'fields' => firestore_fields_from_hash(merged)
  }
  query = { 'updateMask.fieldPaths' => merged.keys.map(&:to_s) }
  url = "https://firestore.googleapis.com/v1/projects/#{firebase_project_id}/databases/(default)/documents/#{collection_id}/#{doc_id}?#{URI.encode_www_form(query)}"
  response, parsed = google_http_json('PATCH', url, body, google_auth_headers)
  unless response.is_a?(Net::HTTPSuccess)
    raise "Falha ao gravar Firestore #{collection_id}/#{doc_id}: #{parsed['error'] || response.body.to_s}"
  end
  parsed
end

def firestore_delete_document(collection_id, doc_id)
  url = "https://firestore.googleapis.com/v1/projects/#{firebase_project_id}/databases/(default)/documents/#{collection_id}/#{doc_id}"
  response, parsed = google_http_json('DELETE', url, nil, google_auth_headers)
  return true if response.is_a?(Net::HTTPSuccess) || response.code.to_i == 404
  raise "Falha ao apagar Firestore #{collection_id}/#{doc_id}: #{parsed['error'] || response.body.to_s}"
end

def firebase_customer_uids
  customers = {}
  tenant_docs = firestore_list_documents('tenants')
  tenant_docs.each do |doc|
    tenant_id = doc['name'].to_s.split('/').last.to_s
    next if tenant_id.to_s.empty?
    %w[store_customers customers].each do |collection|
      begin
        docs = firestore_list_documents("tenants/#{tenant_id}/#{collection}")
        docs.each do |customer_doc|
          uid = customer_doc['name'].to_s.split('/').last.to_s
          next if uid.to_s.empty?
          customers[uid] = { 'tenantId' => tenant_id, 'collection' => collection }
        end
      rescue => e
        log_master("firebase customer scan error tenant=#{tenant_id} collection=#{collection} #{e.class}: #{e.message}")
      end
    end
  end
  customers
end

def firebase_customer_marker?(data)
  role = firebase_normalize_role(data['role'])
  source = data['source'].to_s.strip
  role == 'store_customer' || source == 'store_template'
end

def firebase_find_auth_user(uid: nil, email: nil, users: nil)
  users ||= firebase_auth_users_list
  uid = uid.to_s.strip
  email = email.to_s.strip.downcase
  found = nil
  if !uid.empty?
    found = users.find { |u| u['uid'].to_s == uid }
  end
  if found.nil? && !email.empty?
    found = users.find { |u| u['email'].to_s.strip.downcase == email }
  end
  found
end

def firebase_create_or_update_auth_user(tenant)
  email = tenant['email'].to_s.strip
  raise 'E-mail obrigatório para criar usuário no Firebase Auth.' if email.empty?

  users = firebase_auth_users_list
  existing = firebase_find_auth_user(uid: tenant['id'], email: email, users: users)
  final_uid = existing ? existing['uid'] : tenant['id'].to_s.strip
  final_uid = SecureRandom.urlsafe_base64(12).delete('=') if final_uid.empty?
  final_uid = existing['uid'] if existing && !existing['uid'].to_s.strip.empty?
  desired_display_name = tenant['name'].to_s.strip.empty? ? tenant['businessName'].to_s.strip : tenant['name'].to_s.strip
  desired_display_name = tenant['ownerName'].to_s.strip if desired_display_name.empty?
  disabled = tenant['status'].to_s.strip == 'disabled'
  api_key = firebase_web_api_key
  auth_headers = google_auth_headers.merge('Content-Type' => 'application/json')

  if existing
    body = {
      'localId' => existing['uid'],
      'displayName' => desired_display_name.empty? ? nil : desired_display_name,
      'email' => email,
      'disableUser' => disabled
    }.compact
    update_url = "https://identitytoolkit.googleapis.com/v1/accounts:update"
    response, parsed = google_http_json('POST', update_url, body, auth_headers)
    unless response.is_a?(Net::HTTPSuccess)
      raise "Falha ao atualizar Firebase Auth: #{parsed['error'] || response.body.to_s}"
    end
    return {
      'created' => false,
      'uid' => existing['uid'],
      'auth' => parsed,
      'passwordResetSent' => false
    }
  end

  temp_password = SecureRandom.hex(12)
  create_body = {
    'sanityCheck' => true,
    'allowOverwrite' => false,
    'users' => [{
      'localId' => final_uid,
      'email' => email,
      'displayName' => desired_display_name.empty? ? nil : desired_display_name,
      'rawPassword' => temp_password,
      'disabled' => disabled,
      'emailVerified' => false
    }.compact]
  }
  response, parsed = google_http_json('POST', "https://identitytoolkit.googleapis.com/v1/projects/#{firebase_project_id}/accounts:batchCreate", create_body, auth_headers)
  unless response.is_a?(Net::HTTPSuccess)
    raise "Falha ao criar Firebase Auth: #{parsed['error'] || response.body.to_s}"
  end
  uid = final_uid
  created_users = parsed['users'] || parsed['errors'] || []
  password_reset_sent = false
  begin
    reset_url = "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=#{api_key}"
    reset_body = { 'requestType' => 'PASSWORD_RESET', 'email' => email }
    reset_response, reset_parsed = google_http_json('POST', reset_url, reset_body, { 'Content-Type' => 'application/json' })
    password_reset_sent = reset_response.is_a?(Net::HTTPSuccess)
    unless password_reset_sent
      log_master("firebase auth reset email error email=#{email} uid=#{uid} error=#{reset_parsed['error'] || reset_response.body.to_s}")
    end
  rescue => e
    log_master("firebase auth reset email exception email=#{email} uid=#{uid} error=#{e.message}")
  end
  {
    'created' => true,
    'uid' => uid,
    'auth' => parsed.merge('createdUsers' => created_users),
    'passwordResetSent' => password_reset_sent
  }
rescue => e
  raise e
end

def master_tenant_from_auth_user(user, existing = {})
  now = Time.now.utc.iso8601
  email = user['email'].to_s.strip
  display = user['displayName'].to_s.strip
  {
    'id' => user['uid'].to_s.strip,
    'name' => existing['name'].to_s.strip.empty? ? (display.empty? ? email.split('@').first.to_s : display) : existing['name'].to_s.strip,
    'email' => email.empty? ? existing['email'].to_s.strip : email,
    'ownerName' => existing['ownerName'].to_s.strip,
    'phone' => existing['phone'].to_s.strip,
    'whatsapp' => existing['whatsapp'].to_s.strip,
    'businessName' => existing['businessName'].to_s.strip.empty? ? (display.empty? ? existing['name'].to_s.strip : display) : existing['businessName'].to_s.strip,
    'document' => existing['document'].to_s.strip,
    'plan' => existing['plan'].to_s.strip.empty? ? 'starter' : existing['plan'].to_s.strip,
    'status' => existing['status'].to_s.strip.empty? ? 'pending' : existing['status'].to_s.strip,
    'role' => firebase_normalize_role(existing['role'].to_s.strip.empty? ? 'pending_classification' : existing['role']),
    'fiscalCountry' => existing['fiscalCountry'].to_s.strip.empty? ? 'ES' : existing['fiscalCountry'].to_s.strip,
    'domain' => existing['domain'].to_s.strip,
    'storeUrl' => existing['storeUrl'].to_s.strip,
    'adminUrl' => existing['adminUrl'].to_s.strip.empty? ? 'admin.html' : existing['adminUrl'].to_s.strip,
    'seedFile' => existing['seedFile'].to_s.strip,
    'source' => 'firebase_auth',
    'notes' => existing['notes'].to_s.strip,
    'githubRepo' => existing['githubRepo'].to_s.strip,
    'githubBranch' => existing['githubBranch'].to_s.strip.empty? ? 'main' : existing['githubBranch'].to_s.strip,
    'githubToken' => existing['githubToken'].to_s,
    'publicFile' => existing['publicFile'].to_s.strip.empty? ? 'index.html' : existing['publicFile'].to_s.strip,
    'createdAt' => existing['createdAt'] || now,
    'updatedAt' => now
  }
end

def sync_store_from_auth_user!(store, auth_user, existing = {})
  tenant = master_tenant_from_auth_user(auth_user, existing)
  store['tenants'] ||= []
  store['tenants'] = store['tenants'].reject { |t| t['id'].to_s == tenant['id'].to_s || (!tenant['email'].to_s.empty? && t['email'].to_s.strip.downcase == tenant['email'].to_s.strip.downcase && t['id'].to_s != tenant['id'].to_s) }
  store['tenants'] << tenant
  save_store(store)
  tenant
end

def sync_system_tenant!(tenant, auth_user = nil, force: false)
  role = firebase_normalize_role(tenant['role'])
  status = tenant['status'].to_s.strip.empty? ? 'active' : tenant['status'].to_s.strip
  should_write = status == 'active' && firebase_role_authorized_for_admin?(role)
  return { 'ok' => false, 'skipped' => true, 'reason' => 'user_not_authorized' } unless should_write

  doc = {
    'uid' => tenant['id'].to_s.strip,
    'tenantId' => tenant['id'].to_s.strip,
    'email' => (auth_user && auth_user['email'].to_s.strip) || tenant['email'].to_s.strip,
    'name' => tenant['name'].to_s.strip.empty? ? tenant['businessName'].to_s.strip : tenant['name'].to_s.strip,
    'businessName' => tenant['businessName'].to_s.strip,
    'ownerName' => tenant['ownerName'].to_s.strip,
    'phone' => tenant['phone'].to_s.strip,
    'document' => tenant['document'].to_s.strip,
    'status' => status,
    'role' => role,
    'plan' => tenant['plan'].to_s.strip.empty? ? 'starter' : tenant['plan'].to_s.strip,
    'billingStatus' => tenant['billingStatus'].to_s.strip,
    'billingCycle' => tenant['billingCycle'].to_s.strip,
    'renewalDate' => tenant['renewalDate'].to_s.strip,
    'nextBillingAt' => tenant['nextBillingAt'].to_s.strip,
    'trialEndsAt' => tenant['trialEndsAt'].to_s.strip,
    'features' => tenant['features'].is_a?(Array) ? tenant['features'] : [],
    'planFeatures' => tenant['planFeatures'].is_a?(Array) ? tenant['planFeatures'] : [],
    'planLimits' => tenant['planLimits'].is_a?(Hash) ? tenant['planLimits'] : {},
    'fiscalCountry' => tenant['fiscalCountry'].to_s.strip.empty? ? 'ES' : tenant['fiscalCountry'].to_s.strip,
    'domain' => tenant['domain'].to_s.strip,
    'storeUrl' => tenant['storeUrl'].to_s.strip,
    'adminUrl' => tenant['adminUrl'].to_s.strip.empty? ? 'admin.html' : tenant['adminUrl'].to_s.strip,
    'source' => tenant['source'].to_s.strip.empty? ? 'master_local' : tenant['source'].to_s.strip,
    'origin' => tenant['source'].to_s.strip.empty? ? 'master_local' : tenant['source'].to_s.strip
  }
  firestore_upsert_document('system_tenants', tenant['id'].to_s.strip, doc)
  { 'ok' => true, 'skipped' => false, 'doc' => doc }
rescue => e
  { 'ok' => false, 'skipped' => false, 'error' => e.message }
end

def import_firebase_user_to_master!(auth_user)
  store = master_store
  existing = (store['tenants'] || []).find do |tenant|
    tenant['id'].to_s == auth_user['uid'].to_s || tenant['email'].to_s.strip.downcase == auth_user['email'].to_s.strip.downcase
  end || {}
  tenant = master_tenant_from_auth_user(auth_user, existing)
  store['tenants'] ||= []
  store['tenants'] = store['tenants'].reject { |t| t['id'].to_s == tenant['id'].to_s || (!tenant['email'].to_s.empty? && t['email'].to_s.strip.downcase == tenant['email'].to_s.strip.downcase && t['id'].to_s != tenant['id'].to_s) }
  store['tenants'] << tenant
  save_store(store)
  tenant
end

def master_merged_overview
  store = master_store
  local_tenants = store['tenants'] || []
  auth_users = firebase_auth_users_list
  system_docs = firestore_list_documents('system_tenants')
  customer_uids = firebase_customer_uids
  deleted_uids = master_deleted_tenant_ids(store)
  system_map = {}
  system_docs.each do |doc|
    uid = doc['name'].to_s.split('/').last.to_s
    data = firestore_fields_to_hash(doc['fields'] || {})
    data['uid'] ||= uid
    data['tenantId'] ||= uid
    data['id'] ||= uid
    next if firebase_customer_marker?(data)
    next if deleted_uids.include?(uid)
    system_map[uid] = data
  end

  auth_map = {}
  auth_users.each do |u|
    auth_map[u['uid']] = u.merge('id' => u['uid'], 'uid' => u['uid'], 'source' => 'firebase_auth')
  end

  local_map = {}
  local_tenants.each do |tenant|
    next if tenant['id'].to_s.strip.empty?
    next if firebase_customer_marker?(tenant)
    next if deleted_uids.include?(tenant['id'].to_s)
    local_map[tenant['id'].to_s] = tenant.merge('source' => tenant['source'].to_s.strip.empty? ? 'master_local' : tenant['source'].to_s.strip)
  end

  ids = (local_map.keys + auth_map.keys + system_map.keys).uniq
  users = ids.map do |uid|
    next if customer_uids.key?(uid)
    next if deleted_uids.include?(uid)
    local = local_map[uid] || {}
    auth = auth_map[uid] || {}
    system = system_map[uid] || {}
    next if firebase_customer_marker?(local) || firebase_customer_marker?(system)
    base = {}
    [system, local, auth].each do |src|
      src.each do |key, value|
        next if value.nil?
        next if value.respond_to?(:empty?) && value.empty?
        base[key] = value if base[key].to_s.strip.empty? || key == 'id' || key == 'uid'
      end
    end
    base['id'] = uid
    base['uid'] = uid
    base['email'] = auth['email'].to_s.strip.empty? ? local['email'].to_s.strip : auth['email'].to_s.strip
    base['name'] = local['name'].to_s.strip.empty? ? (auth['displayName'].to_s.strip.empty? ? base['email'].split('@').first.to_s : auth['displayName'].to_s.strip) : local['name'].to_s.strip
    base['businessName'] = local['businessName'].to_s.strip.empty? ? base['name'] : local['businessName'].to_s.strip
    base['status'] = local['status'].to_s.strip.empty? ? (system['status'].to_s.strip.empty? ? (auth['disabled'] ? 'disabled' : 'pending') : system['status'].to_s.strip) : local['status'].to_s.strip
    base['role'] = firebase_normalize_role(local['role'].to_s.strip.empty? ? (system['role'].to_s.strip.empty? ? 'pending_classification' : system['role'].to_s.strip) : local['role'])
    base['plan'] = local['plan'].to_s.strip.empty? ? (system['plan'].to_s.strip.empty? ? 'starter' : system['plan'].to_s.strip) : local['plan'].to_s.strip
    base['fiscalCountry'] = local['fiscalCountry'].to_s.strip.empty? ? (system['fiscalCountry'].to_s.strip.empty? ? 'ES' : system['fiscalCountry'].to_s.strip) : local['fiscalCountry'].to_s.strip
    base['domain'] = local['domain'].to_s.strip
    base['storeUrl'] = local['storeUrl'].to_s.strip
    base['adminUrl'] = local['adminUrl'].to_s.strip.empty? ? 'admin.html' : local['adminUrl'].to_s.strip
    base['seedFile'] = local['seedFile'].to_s.strip
    base['source'] = local['source'].to_s.strip.empty? ? (auth['uid'] ? 'firebase_auth' : 'master_local') : local['source'].to_s.strip
    base['notes'] = local['notes'].to_s.strip
    base['githubRepo'] = local['githubRepo'].to_s.strip
    base['githubBranch'] = local['githubBranch'].to_s.strip.empty? ? 'main' : local['githubBranch'].to_s.strip
    base['githubToken'] = local['githubToken'].to_s
    base['publicFile'] = local['publicFile'].to_s.strip.empty? ? 'index.html' : local['publicFile'].to_s.strip
    base['localExists'] = !local.empty?
    base['authExists'] = !auth.empty?
    base['systemExists'] = !system.empty?
    base['authDisabled'] = !!auth['disabled']
    base['systemStatus'] = system['status'].to_s.strip
    base['systemRole'] = system['role'].to_s.strip.empty? ? base['role'] : firebase_normalize_role(system['role'])
    base['origin'] = if base['localExists'] && base['authExists'] && base['systemExists']
      'Sincronizado'
    elsif base['localExists'] && !base['authExists'] && !base['systemExists']
      'Local'
    elsif base['authExists'] && !base['localExists'] && !base['systemExists']
      'Firebase Auth'
    elsif base['systemExists'] && !base['localExists'] && !base['authExists']
      'Firestore'
    elsif base['localExists'] && base['authExists']
      'Local'
    elsif base['localExists'] && base['systemExists']
      'Local'
    elsif base['authExists'] && base['systemExists']
      'Firebase Auth'
    else
      'Local'
    end
    base['syncStatus'] = if base['localExists'] && base['authExists'] && base['systemExists']
      'Sincronizado'
    elsif base['localExists'] && !base['authExists']
      'Falta Firebase Auth'
    elsif !base['localExists'] && base['authExists'] && !base['systemExists']
      'Falta Master local'
    elsif base['localExists'] && base['authExists'] && !base['systemExists']
      'Falta system_tenants'
    elsif base['systemExists'] && !base['localExists'] && !base['authExists']
      'Falta Master local'
    else
      'Sincronização parcial'
    end
    base['storeStatus'] = if base['domain'].to_s.strip.empty? && base['storeUrl'].to_s.strip.empty? && base['githubRepo'].to_s.strip.empty?
      'Loja não configurada'
    elsif !base['domain'].to_s.strip.empty? || !base['storeUrl'].to_s.strip.empty?
      base['githubRepo'].to_s.strip.empty? ? 'Loja parcialmente configurada' : 'Loja configurada'
    else
      'Loja parcialmente configurada'
    end
    base['seedStatus'] = base['seedFile'].to_s.strip.empty? ? 'Seed pendente' : 'Seed vinculada'
    base['canCreateAuth'] = base['localExists'] && !base['authExists']
    base['canImportToMaster'] = base['authExists'] && !base['localExists']
    base['canReleaseAccess'] = base['localExists'] && base['authExists'] && !base['systemExists'] && base['status'].to_s == 'active' && firebase_role_authorized_for_admin?(base['role'])
    base
  end.compact

  users.sort_by { |u| String(u['name'] || u['businessName'] || u['id']) }
end

def master_find_tenant(store, uid: nil, email: nil)
  tenants = store['tenants'] || []
  uid = uid.to_s.strip
  email = email.to_s.strip.downcase
  found = nil
  found = tenants.find { |t| t['id'].to_s == uid } if !uid.empty?
  found ||= tenants.find { |t| t['email'].to_s.strip.downcase == email } if !email.empty?
  found
end

def master_deleted_tenant_ids(store)
  Array(store['deleted_tenants']).map { |id| id.to_s.strip }.reject(&:empty?).uniq
end

def master_tenant_deleted?(store, uid)
  master_deleted_tenant_ids(store).include?(uid.to_s.strip)
end

def master_mark_tenant_deleted!(store, uid)
  ids = master_deleted_tenant_ids(store)
  id = uid.to_s.strip
  ids << id unless id.empty? || ids.include?(id)
  store['deleted_tenants'] = ids
end

def master_restore_tenant!(store, uid)
  id = uid.to_s.strip
  return if id.empty?
  store['deleted_tenants'] = master_deleted_tenant_ids(store).reject { |deleted_id| deleted_id == id }
end

def master_replace_tenant(store, tenant)
  store['tenants'] ||= []
  store['tenants'] = store['tenants'].reject do |t|
    t['id'].to_s == tenant['id'].to_s || (!tenant['email'].to_s.empty? && t['email'].to_s.strip.downcase == tenant['email'].to_s.strip.downcase && t['id'].to_s != tenant['id'].to_s)
  end
  store['tenants'] << tenant
  save_store(store)
  tenant
end

def firebase_auto_sync_master_from_auth!
  auth_users = firebase_auth_users_list
  system_docs = firestore_list_documents('system_tenants')
  customer_uids = firebase_customer_uids
  store = master_store
  deleted_uids = master_deleted_tenant_ids(store)

  system_map = {}
  system_docs.each do |doc|
    uid = doc['name'].to_s.split('/').last.to_s
    next if uid.to_s.empty?
    system_map[uid] = firestore_fields_to_hash(doc['fields'] || {})
  end

  counts = {
    'auth_total' => auth_users.length,
    'already_synced' => 0,
    'imported_master' => 0,
    'created_system' => 0,
    'ignored_customers' => 0,
    'ignored_deleted' => 0,
    'updated_system' => 0
  }
  imported = []
  synced = []
  ignored = []

  auth_users.each do |auth_user|
    uid = auth_user['uid'].to_s.strip
    email = auth_user['email'].to_s.strip
    next if uid.empty?

    if deleted_uids.include?(uid)
      counts['ignored_deleted'] += 1
      log_master("firebase auto sync skipped deleted uid=#{uid} email=#{email}")
      next
    end

    if customer_uids.key?(uid)
      counts['ignored_customers'] += 1
      ignored << { 'uid' => uid, 'email' => email, 'tenantId' => customer_uids[uid]['tenantId'], 'collection' => customer_uids[uid]['collection'] }
      log_master("firebase auto sync ignored customer uid=#{uid} email=#{email} tenant=#{customer_uids[uid]['tenantId']} collection=#{customer_uids[uid]['collection']}")
      next
    end

    existing_local = master_find_tenant(store, uid: uid, email: email) || {}
    system_doc = system_map[uid] || {}
    now = Time.now.utc.iso8601
    created_local = false

    if firebase_customer_marker?(existing_local) || firebase_customer_marker?(system_doc)
      counts['ignored_customers'] += 1
      ignored << { 'uid' => uid, 'email' => email, 'tenantId' => (system_doc['tenantId'] || existing_local['tenantId'] || '').to_s, 'collection' => (existing_local['source'].to_s == 'store_template' ? 'master_local' : 'system_tenants') }
      log_master("firebase auto sync ignored marker uid=#{uid} email=#{email} source=#{existing_local['source']} role=#{existing_local['role']} system_source=#{system_doc['source']} system_role=#{system_doc['role']}")
      next
    end

    if existing_local.empty?
      display = auth_user['displayName'].to_s.strip
      fallback_name = display.empty? ? (email.split('@').first.to_s.empty? ? uid : email.split('@').first.to_s) : display
      tenant = {
        'id' => uid,
        'uid' => uid,
        'name' => fallback_name,
        'email' => email,
        'ownerName' => display.empty? ? fallback_name : display,
        'phone' => '',
        'whatsapp' => '',
        'businessName' => display.empty? ? fallback_name : display,
        'document' => '',
        'plan' => 'starter',
        'status' => 'active',
        'role' => 'store_owner',
        'fiscalCountry' => system_doc['fiscalCountry'].to_s.strip.empty? ? 'ES' : system_doc['fiscalCountry'].to_s.strip,
        'domain' => '',
        'storeUrl' => '',
        'adminUrl' => 'admin.html',
        'seedFile' => '',
        'source' => 'firebase_auth_auto_import',
        'notes' => '',
        'githubRepo' => '',
        'githubBranch' => 'main',
        'githubToken' => '',
        'publicFile' => 'index.html',
        'createdAt' => now,
        'updatedAt' => now
      }
      master_replace_tenant(store, tenant)
      existing_local = tenant
      created_local = true
      counts['imported_master'] += 1
      imported << tenant
    else
      existing_local['uid'] = uid
      existing_local['email'] = email if !email.empty?
      existing_local['name'] = existing_local['name'].to_s.strip.empty? ? (auth_user['displayName'].to_s.strip.empty? ? email.split('@').first.to_s : auth_user['displayName'].to_s.strip) : existing_local['name'].to_s.strip
      existing_local['businessName'] = existing_local['businessName'].to_s.strip.empty? ? existing_local['name'].to_s.strip : existing_local['businessName'].to_s.strip
      existing_local['status'] = 'active' if existing_local['status'].to_s.strip.empty? || existing_local['status'].to_s == 'pending'
      existing_local['role'] = firebase_normalize_role(existing_local['role'].to_s.strip.empty? ? 'store_owner' : existing_local['role'])
      existing_local['plan'] = existing_local['plan'].to_s.strip.empty? ? 'starter' : existing_local['plan'].to_s.strip
      existing_local['source'] = existing_local['source'].to_s.strip.empty? ? 'firebase_auth_auto_import' : existing_local['source'].to_s.strip
      existing_local['updatedAt'] = now
      master_replace_tenant(store, existing_local)
    end

    desired_system = {
      'uid' => uid,
      'tenantId' => uid,
      'email' => email,
      'name' => existing_local['name'].to_s.strip.empty? ? (auth_user['displayName'].to_s.strip.empty? ? email.split('@').first.to_s : auth_user['displayName'].to_s.strip) : existing_local['name'].to_s.strip,
      'status' => existing_local['status'].to_s == 'disabled' ? 'disabled' : 'active',
      'role' => firebase_normalize_role(existing_local['role'].to_s.strip.empty? ? 'store_owner' : existing_local['role']),
      'plan' => existing_local['plan'].to_s.strip.empty? ? 'starter' : existing_local['plan'].to_s.strip,
      'fiscalCountry' => existing_local['fiscalCountry'].to_s.strip.empty? ? (system_doc['fiscalCountry'].to_s.strip.empty? ? 'ES' : system_doc['fiscalCountry'].to_s.strip) : existing_local['fiscalCountry'].to_s.strip,
      'source' => 'firebase_auth_auto_import',
      'createdAt' => system_doc['createdAt'].to_s.strip.empty? ? now : system_doc['createdAt'].to_s,
      'updatedAt' => now
    }
    sync_result = firestore_upsert_document('system_tenants', uid, desired_system)
    if system_doc && !system_doc.empty?
      counts['updated_system'] += 1
    else
      counts['created_system'] += 1
    end
    counts['already_synced'] += 1 if !created_local && !system_doc.empty?
    synced << {
      'uid' => uid,
      'email' => email,
      'createdLocal' => created_local,
      'systemCreatedOrUpdated' => true
    }
    log_master("firebase auto sync ok uid=#{uid} email=#{email} created_local=#{created_local} system_tenants=ok")
  end

  log_master(
    "firebase auto sync summary auth=#{counts['auth_total']} synced=#{counts['already_synced']} imported=#{counts['imported_master']} system_created=#{counts['created_system']} system_updated=#{counts['updated_system']} ignored_customers=#{counts['ignored_customers']} ignored_deleted=#{counts['ignored_deleted']}"
  )

  {
    'ok' => true,
    'counts' => counts,
    'imported' => imported,
    'synced' => synced,
    'ignored' => ignored
  }
rescue => e
  log_master("firebase auto sync error #{e.class}: #{e.message}")
  {
    'ok' => false,
    'error' => e.message,
    'counts' => {
      'auth_total' => 0,
      'already_synced' => 0,
      'imported_master' => 0,
      'created_system' => 0,
      'ignored_customers' => 0,
      'updated_system' => 0
    },
    'imported' => [],
    'synced' => [],
    'ignored' => []
  }
end

def git_repo_ready?
  Dir.exist?(File.join(ROOT, '.git'))
end

def git_run(*args, env: {})
  stdout, stderr, status = Open3.capture3(env, *args, chdir: ROOT)
  {
    'ok' => status.success?,
    'stdout' => stdout.to_s,
    'stderr' => stderr.to_s,
    'status' => status.exitstatus
  }
end

def ensure_git_repo!
  return if git_repo_ready?
  result = git_run('git', 'init', '-b', 'main')
  unless result['ok']
    result = git_run('git', 'init')
    raise "Falha ao inicializar git: #{result['stderr'].to_s.strip.empty? ? result['stdout'].to_s.strip : result['stderr'].to_s.strip}" unless result['ok']
    git_run('git', 'branch', '-M', 'main')
  end
end

def ensure_gitignore!
  required = [
    '.env',
    '.env.local',
    '.env.production',
    'firebase-service-account.json',
    'serviceAccountKey.json',
    '*.key',
    '*.pem',
    'node_modules/',
    '.DS_Store',
    '*.log',
    'dist/',
    '.cache/',
    '.master-store.json',
    '.master.log',
    'data/'
  ]
  path = File.join(ROOT, '.gitignore')
  existing = File.exist?(path) ? File.read(path, encoding: 'UTF-8').split(/\r?\n/) : []
  merged = existing.dup
  required.each { |line| merged << line unless merged.include?(line) }
  merged = merged.reject { |line| line.nil? }
  merged_text = merged.join("\n")
  merged_text << "\n" unless merged_text.end_with?("\n")
  File.write(path, merged_text, encoding: 'UTF-8')
  true
end

def git_status_snapshot
  ensure_git_repo!
  status = git_run('git', 'status', '--short')
  branch = git_run('git', 'branch', '--show-current')
  log = git_run('git', 'log', '-1', '--oneline')

  modified = []
  added = []
  removed = []
  untracked = []

  status['stdout'].to_s.split(/\r?\n/).each do |line|
    next if line.to_s.strip.empty?
    code = line[0, 2].to_s
    path = line[3..-1].to_s.strip
    next if path.empty?
    case code
    when '??'
      untracked << path
      added << path
    when /^A/
      added << path
    when /^D/, ' D', 'D '
      removed << path
    else
      modified << path
    end
  end

  current_branch = branch['stdout'].to_s.strip
  current_branch = 'main' if current_branch.empty?

  {
    'initialized' => true,
    'branch' => current_branch,
    'lastCommit' => log['stdout'].to_s.strip,
    'modifiedFiles' => modified.uniq,
    'newFiles' => added.uniq,
    'removedFiles' => removed.uniq,
    'untrackedFiles' => untracked.uniq,
    'clean' => modified.empty? && added.empty? && removed.empty? && untracked.empty?,
    'rawStatus' => status['stdout'].to_s
  }
end

def backup_remote_url(repo)
  "https://github.com/#{repo}.git"
end

def backup_push(repo:, branch:, token:)
  raise 'Configure o repositório GitHub privado antes de enviar o backup.' if repo.to_s.strip.empty?
  raise 'Token do backup não configurado no servidor.' if token.to_s.strip.empty?

  ensure_git_repo!
  ensure_gitignore!

  branch = branch.to_s.strip.empty? ? 'main' : branch.to_s.strip
  git_run('git', 'branch', '-M', branch)

  status = git_status_snapshot
  return { 'ok' => true, 'skipped' => true, 'message' => 'Nenhuma alteração de código para enviar.', 'git' => status } if status['clean']

  add = git_run('git', 'add', '.')
  raise "Falha ao adicionar arquivos: #{add['stderr'].to_s.strip.empty? ? add['stdout'].to_s.strip : add['stderr'].to_s.strip}" unless add['ok']

  staged = git_run('git', 'status', '--short')
  if staged['stdout'].to_s.strip.empty?
    return { 'ok' => true, 'skipped' => true, 'message' => 'Nenhuma alteração de código para enviar.', 'git' => status }
  end

  commit_msg = "backup: #{Time.now.strftime('%Y-%m-%d %H:%M')}"
  commit_env = {
    'GIT_AUTHOR_NAME' => 'Boca Food Master',
    'GIT_AUTHOR_EMAIL' => 'master@bocafood.local',
    'GIT_COMMITTER_NAME' => 'Boca Food Master',
    'GIT_COMMITTER_EMAIL' => 'master@bocafood.local'
  }
  commit = git_run('git', 'commit', '-m', commit_msg, env: commit_env)
  unless commit['ok']
    text = "#{commit['stdout']} #{commit['stderr']}".strip
    return { 'ok' => true, 'skipped' => true, 'message' => 'Nenhuma alteração de código para enviar.', 'git' => status } if text.match?(/nothing to commit/i)
    raise "Falha ao criar commit: #{text.empty? ? 'erro desconhecido' : text}"
  end

  remote_url = backup_remote_url(repo)
  remote = git_run('git', 'remote', 'get-url', 'origin')
  if !remote['ok'] || remote['stdout'].to_s.strip.empty?
    add_remote = git_run('git', 'remote', 'add', 'origin', remote_url)
    raise "Falha ao configurar origin: #{add_remote['stderr'].to_s.strip.empty? ? add_remote['stdout'].to_s.strip : add_remote['stderr'].to_s.strip}" unless add_remote['ok']
  elsif remote['stdout'].to_s.strip != remote_url
    set_remote = git_run('git', 'remote', 'set-url', 'origin', remote_url)
    raise "Falha ao atualizar origin: #{set_remote['stderr'].to_s.strip.empty? ? set_remote['stdout'].to_s.strip : set_remote['stderr'].to_s.strip}" unless set_remote['ok']
  end

  askpass = Tempfile.new(['boca-food-askpass', '.sh'])
  askpass.write(<<~SH)
    #!/bin/sh
    case "$1" in
      *Username*) echo "x-access-token" ;;
      *) printf '%s' "$BACKUP_GIT_TOKEN" ;;
    esac
  SH
  askpass.close
  File.chmod(0700, askpass.path)

  push_env = {
    'GIT_TERMINAL_PROMPT' => '0',
    'GIT_ASKPASS' => askpass.path,
    'BACKUP_GIT_TOKEN' => token.to_s
  }
  push = git_run('git', 'push', 'origin', branch, env: push_env)
  unless push['ok']
    raise "Falha ao enviar backup: #{push['stderr'].to_s.strip.empty? ? push['stdout'].to_s.strip : push['stderr'].to_s.strip}"
  end

  {
    'ok' => true,
    'message' => 'Backup do código enviado para GitHub com sucesso.',
    'git' => git_status_snapshot,
    'commitMessage' => commit_msg,
    'pushOutput' => push['stdout'].to_s.strip
  }
ensure
  askpass.unlink if askpass
end

def github_put(path, content, branch, repo, token)
  raise 'Repositório GitHub obrigatório (usuario/repo)' if repo.to_s.strip.empty?
  raise 'GitHub Token obrigatório' if token.to_s.strip.empty?

  api = URI("https://api.github.com/repos/#{repo}/contents/#{path}")
  headers = {
    'Authorization' => "Bearer #{token}",
    'Accept' => 'application/vnd.github+json',
    'X-GitHub-Api-Version' => '2022-11-28',
    'Content-Type' => 'application/json',
    'User-Agent' => 'bb-master-local'
  }

  # Get existing file SHA (needed for update)
  existing_sha = nil
  get_uri = api.dup
  get_uri.query = URI.encode_www_form('ref' => branch)
  get_res = Net::HTTP.start(get_uri.host, get_uri.port, use_ssl: true) do |http|
    http.get(get_uri.request_uri, headers)
  end
  existing_sha = JSON.parse(get_res.body)['sha'] if get_res.code.to_i == 200

  body = {
    message: "Master publish #{path} [tenant auto]",
    content: Base64.strict_encode64(content),
    branch: branch
  }
  body[:sha] = existing_sha if existing_sha

  put_res = Net::HTTP.start(api.host, api.port, use_ssl: true) do |http|
    http.put(api.request_uri, JSON.generate(body), headers)
  end
  raise "GitHub respondeu #{put_res.code}: #{JSON.parse(put_res.body)['message'] rescue put_res.body}" unless put_res.code.to_i.between?(200, 299)

  result = JSON.parse(put_res.body)
  # Return GitHub Pages URL if available
  url = "https://#{repo.split('/')[0]}.github.io/#{repo.split('/')[1]}/#{path}"
  { 'sha' => result.dig('content', 'sha'), 'url' => url }
end

def github_raw_url(repo, branch, path)
  owner, name = repo.to_s.split('/', 2)
  return '' if owner.to_s.empty? || name.to_s.empty?
  "https://raw.githubusercontent.com/#{owner}/#{name}/#{branch}/#{path}"
end

def decode_data_url(data_url)
  raw = data_url.to_s.strip
  raise 'Arquivo de imagem obrigatório' if raw.empty?
  if raw.start_with?('data:')
    _, encoded = raw.split(',', 2)
    raise 'Arquivo de imagem inválido' if encoded.to_s.empty?
    return Base64.decode64(encoded)
  end
  Base64.decode64(raw)
end

def product_image_filename(product_id, original_name, mime_type)
  ext_from_mime = {
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp'
  }[mime_type.to_s.strip.downcase]

  ext = File.extname(original_name.to_s.strip).downcase.sub(/^\./, '')
  ext = ext_from_mime if ext.to_s.empty? && !ext_from_mime.to_s.empty?
  ext = 'jpg' if ext == 'jpeg'
  ext = 'png' if ext.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Formato não permitido. Envie JPG, JPEG, PNG ou WebP.' unless %w[jpg jpeg png webp].include?(ext)

  base = File.basename(original_name.to_s.strip, File.extname(original_name.to_s.strip))
  base = product_id.to_s.strip if base.to_s.strip.empty?
  base = base.gsub(/[^A-Za-z0-9_-]+/, '_').gsub(/_+/, '_').gsub(/^_+|_+$/, '')
  base = product_id.to_s.strip.gsub(/[^A-Za-z0-9_-]+/, '_').gsub(/_+/, '_').gsub(/^_+|_+$/, '') if base.empty?
  base = 'produto' if base.empty?
  "#{base}_#{Time.now.utc.strftime('%Y%m%d%H%M%S')}_#{rand(1000..9999)}.#{ext}"
end

def allow_product_image_upload(req, res)
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    return true
  end
  false
end

def handle_product_image_upload(req, res)
  origin = req['Origin'] || req['origin']
  apply_cors_headers(res, origin)

  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    return
  end

  unless req.request_method == 'POST'
    return json_response_cors(req, res, 405, { ok: false, error: 'POST required' })
  end

  log_master("product image upload request path=#{req.path} origin=#{origin.to_s.strip} content_type=#{req.content_type.to_s.strip}")

  tenant_id = ''
  product_id = ''
  file_name = ''
  mime_type = ''
  content = nil
  upload_mode = 'json'

  if req.content_type.to_s.downcase.include?('multipart/form-data')
    params = req.query || {}
    tenant_id = params['tenantId'].to_s.strip
    product_id = params['productId'].to_s.strip
    upload = params['file'] || params['image'] || params['upload']
    if upload && upload.respond_to?(:tempfile)
      file_name = upload.respond_to?(:filename) ? upload.filename.to_s : ''
      mime_type = upload.respond_to?(:content_type) ? upload.content_type.to_s : ''
      tempfile = upload.tempfile
      tempfile.rewind if tempfile.respond_to?(:rewind)
      content = tempfile.read
      upload_mode = 'multipart'
    elsif upload && upload.respond_to?(:read)
      file_name = upload.respond_to?(:filename) ? upload.filename.to_s : ''
      mime_type = upload.respond_to?(:content_type) ? upload.content_type.to_s : ''
      content = upload.read
      upload_mode = 'multipart'
    elsif upload && upload.respond_to?(:filename) && !upload.filename.to_s.empty?
      # WEBrick::HTTPUtils::FormData (String subclass — no :tempfile, no :read)
      file_name = upload.filename.to_s
      begin; raw_ct = upload['content-type'].to_s; rescue; raw_ct = ''; end
      mime_type = raw_ct =~ /\Aimage\// ? raw_ct : ''
      content = upload.to_s
      upload_mode = 'multipart'
    else
      file_name = params['fileName'].to_s.strip
      mime_type = params['mimeType'].to_s.strip
      data_url = params['dataUrl'].to_s.strip
      content = decode_data_url(data_url)
    end
  else
    body = read_json(req)
    tenant_id = body['tenantId'].to_s.strip
    product_id = body['productId'].to_s.strip
    data_url = body['dataUrl'].to_s.strip
    file_name = body['fileName'].to_s.strip
    mime_type = body['mimeType'].to_s.strip
    content = decode_data_url(data_url)
  end

  return json_response_cors(req, res, 400, { ok: false, error: 'Tenant obrigatório' }) if tenant_id.empty?
  return json_response_cors(req, res, 400, { ok: false, error: 'Produto obrigatório' }) if product_id.empty?
  return json_response_cors(req, res, 400, { ok: false, error: 'Arquivo de imagem obrigatório' }) if content.to_s.empty?

  log_master("product image upload payload tenant=#{tenant_id} product=#{product_id} file=#{file_name.to_s.strip.empty? ? 'sem-nome' : file_name} mime=#{mime_type.to_s.strip.empty? ? 'indefinido' : mime_type} bytes=#{content.to_s.bytesize}")

  store = master_store
  tenant_cfg = (store['tenants'] || []).find { |t| t['id'].to_s == tenant_id } || {}
  repo_info = tenant_image_repo_config(tenant_cfg)
  repo = repo_info['repo'].to_s.strip
  token = tenant_cfg['githubToken'].to_s.strip
  branch = repo_info['branch'].to_s.strip
  image_path = repo_info['imagePath'].to_s.strip

  log_master("product image upload resolved tenant=#{tenant_id} product=#{product_id} repo=#{repo} branch=#{branch} imagePath=#{image_path} mode=#{upload_mode}")

  return json_response_cors(req, res, 400, { ok: false, error: 'Repositório da loja não configurado no Master.' }) if repo.empty?
  return json_response_cors(req, res, 400, { ok: false, error: 'GitHub Token não configurado' }) if token.empty?

  safe_name = product_image_filename(product_id, file_name, mime_type)
  rel_path = File.join(image_path, safe_name).tr('\\', '/')
  log_master("product image upload local_path=#{rel_path} file=#{safe_name}")
  github_put(rel_path, content, branch, repo, token)
  raw_url = github_raw_url(repo, branch, rel_path)
  log_master("product image upload published repo=#{repo} branch=#{branch} raw_url=#{raw_url}")

  json_response_cors(req, res, 200, {
    ok: true,
    message: 'Imagem publicada com sucesso.',
    tenantId: tenant_id,
    productId: product_id,
    imageUrl: raw_url,
    imageCardUrl: raw_url,
    imageThumbUrl: raw_url,
    imageStoragePath: rel_path,
    fileName: safe_name,
    branch: branch,
    repo: repo
  })
rescue => e
  log_master("product image upload error #{e.class}: #{e.message}")
  json_response_cors(req, res, 400, { ok: false, error: e.message })
end

def clean_rel_path(path)
  path.to_s.tr('\\', '/').sub(%r{\A/+}, '')
end

def internal_path?(rel)
  rel = clean_rel_path(rel)
  return true if rel.empty? || rel.include?('..') || rel.split('/').any? { |part| part.start_with?('.') }
  return true if INTERNAL_FILES.include?(rel)
  INTERNAL_DIRS.any? { |dir| rel == dir || rel.start_with?("#{dir}/") }
end

def public_path?(rel)
  rel = clean_rel_path(rel)
  return false if internal_path?(rel)
  return true if PUBLIC_FILES.include?(rel)
  PUBLIC_DIRS.any? { |dir| rel.start_with?("#{dir}/") }
end

def active_template_file(store)
  templates = store['templates'] || []
  template = templates.find { |t| t['name'].to_s == 'default' } || templates.first || {}
  file = clean_rel_path(template['file'].to_s.empty? ? 'index.html' : template['file'])
  raise "Template interno não pode ser publicado: #{file}" if internal_path?(file)
  raise "Template base não encontrado: #{file}" unless File.file?(File.join(ROOT, file))
  file
end

def public_site_files(template_file = 'index.html')
  files = PUBLIC_FILES.select { |rel| File.file?(File.join(ROOT, rel)) }
  files << 'index.html' unless files.include?('index.html')

  PUBLIC_DIRS.each do |dir|
    base = File.join(ROOT, dir)
    next unless Dir.exist?(base)
    Dir.glob(File.join(base, '**', '*')).each do |path|
      next unless File.file?(path)
      rel = path.sub("#{ROOT}/", '')
      files << rel if public_path?(rel)
    end
  end

  files.uniq.sort
end

def public_file_content(rel, tenant_id, template_file = 'index.html')
  source_rel = rel == 'index.html' ? clean_rel_path(template_file) : rel
  path = File.expand_path(source_rel, ROOT)
  raise "Arquivo fora da pasta do projeto: #{rel}" unless path.start_with?(ROOT)
  raise "Arquivo interno não pode ser publicado: #{source_rel}" if internal_path?(source_rel)
  raise "Arquivo público não encontrado: #{source_rel}" unless File.file?(path)

  return File.binread(path) unless File.extname(path).downcase == '.html'

  html = File.read(path, encoding: 'utf-8')
  injected = %Q(var PUBLISHED_TENANT_ID="#{tenant_id}";)
  if rel == 'index.html'
    title = publication_seo_title(tenant_id)
    escaped_title = CGI.escapeHTML(title)
    if html.match?(%r{<title>[\s\S]*?</title>}i)
      html = html.sub(%r{<title>[\s\S]*?</title>}i, "<title>#{escaped_title}</title>")
    else
      html = html.sub(%r{</head>}i, "<title>#{escaped_title}</title>\n</head>")
    end
  end

  if html.match?(/(?:const|var)\s+PUBLISHED_TENANT_ID\s*=\s*['"][^'"]*['"]\s*;/)
    html = html.sub(/(?:const|var)\s+PUBLISHED_TENANT_ID\s*=\s*['"][^'"]*['"]\s*;/, injected)
  elsif html.match?(/function\s+tenantIdFromUrl\s*\(\)\s*\{[\s\S]*?\n\}/)
    html = html.sub(/function\s+tenantIdFromUrl\s*\(\)\s*\{[\s\S]*?\n\}/, %Q(function tenantIdFromUrl(){return "#{tenant_id}";}))
  end

  if rel == 'index.html' || html.include?('tenantIdFromUrl')
    raise "Falha ao injetar tenant UID em #{rel}" unless html.include?(tenant_id)
  end
  html
end

def publish_public_site(tenant_id:, repo:, token:, branch:, template_file: 'index.html')
  store = master_store
  tenant_cfg = (store['tenants'] || []).find { |t| t['id'].to_s == tenant_id.to_s } || {}
  base_url = publication_base_url(repo, tenant_cfg)
  store_name = publication_store_name(tenant_cfg)
  whatsapp = publication_whatsapp(tenant_cfg)

  generation = ProductPageGenerator.generate(
    root: ROOT,
    output_root: ROOT,
    products_path: File.join(ROOT, 'produtos.json'),
    index_path: File.join(ROOT, 'index.html'),
    tenant_id: tenant_id,
    base_url: base_url,
    store_name: store_name,
    whatsapp: whatsapp
  )

  files = public_site_files(template_file)
  raise 'Nenhum arquivo público encontrado para publicação' if files.empty?

  published = []
  files.each do |rel|
    content = public_file_content(rel, tenant_id, template_file)
    result = github_put(rel, content, branch, repo, token)
    published << { 'file' => rel, 'sha' => result['sha'] }
  end

  owner, name = repo.split('/', 2)
  {
    'url' => base_url.empty? ? "https://#{owner}.github.io/#{name}/" : "#{base_url}/",
    'files' => published,
    'baseUrl' => base_url,
    'generation' => generation
  }
end

server = WEBrick::HTTPServer.new(
  BindAddress: '127.0.0.1',
  Port: (ENV['PORT'] || 3000).to_i,
  DocumentRoot: ROOT,
  Logger: WEBrick::Log.new($stderr, WEBrick::BasicLog::ERROR),
  AccessLog: []
)

server.mount_proc '/api/master/firebase/overview' do |_req, res|
  begin
    json_response(res, 200, {
      ok: true,
      users: master_merged_overview,
      generatedAt: Time.now.utc.iso8601
    })
  rescue => e
    json_response(res, 400, { ok: false, error: e.message, users: [] })
  end
end

server.mount_proc '/api/master/firebase/sync-users' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'POST required' }) unless req.request_method == 'POST'
    result = firebase_auto_sync_master_from_auth!
    json_response(res, result['ok'] ? 200 : 400, result)
  rescue => e
    log_master("firebase sync-users fatal #{e.class}: #{e.message}")
    json_response(res, 400, { ok: false, error: e.message, counts: { 'auth_total' => 0, 'already_synced' => 0, 'imported_master' => 0, 'created_system' => 0, 'ignored_customers' => 0, 'ignored_deleted' => 0, 'updated_system' => 0 }, imported: [], synced: [], ignored: [] })
  end
end

server.mount_proc '/api/master/firebase/provision' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'POST required' }) unless req.request_method == 'POST'

    body = read_json(req)
    email = body['email'].to_s.strip
    uid_hint = body['id'].to_s.strip
    store = master_store
    existing_local = master_find_tenant(store, uid: uid_hint, email: email) || {}
    tenant = tenant_from_body(body, existing_local)
    tenant['source'] = existing_local['source'].to_s.strip.empty? ? 'master_local' : existing_local['source'].to_s.strip
    tenant['email'] = email.empty? ? tenant['email'] : email
    tenant['status'] = body['status'].to_s.strip.empty? ? (existing_local['status'].to_s.strip.empty? ? 'active' : existing_local['status'].to_s.strip) : body['status'].to_s.strip
    tenant['role'] = firebase_normalize_role(body['role'].to_s.strip.empty? ? (existing_local['role'].to_s.strip.empty? ? 'store_owner' : existing_local['role']) : body['role'])
    master_restore_tenant!(store, tenant['id'])

    auth_result = firebase_create_or_update_auth_user(tenant)
    final_uid = auth_result['uid'].to_s.strip
    tenant['id'] = final_uid if !final_uid.empty?
    tenant['email'] = email if !email.empty?
    tenant['updatedAt'] = Time.now.utc.iso8601
    tenant['createdAt'] = existing_local['createdAt'] || tenant['createdAt']
    tenant['source'] = existing_local['source'].to_s.strip.empty? ? 'master_local' : existing_local['source'].to_s.strip

    store = master_store
    master_restore_tenant!(store, tenant['id'])
    master_replace_tenant(store, tenant)

    sync_result = sync_system_tenant!(tenant, { 'email' => tenant['email'] })

    log_master(
      "firebase provision email=#{tenant['email']} uid=#{tenant['id']} origin=#{tenant['source']} created_auth=#{auth_result['created']} saved_master=true system_tenants=#{sync_result['ok'] ? 'ok' : (sync_result['skipped'] ? 'skipped' : 'error')}"
    )

    json_response(res, 200, {
      ok: true,
      action: auth_result['created'] ? 'created_auth' : 'updated_auth',
      uid: tenant['id'],
      tenant: tenant,
      auth: auth_result,
      systemTenant: sync_result
    })
  rescue => e
    log_master("firebase provision error #{e.class}: #{e.message}")
    json_response(res, 400, { ok: false, error: e.message })
  end
end

server.mount_proc '/api/master/firebase/import-users' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'POST required' }) unless req.request_method == 'POST'

    body = read_json(req)
    wanted_uids = Array(body['uids'] || body['uid']).map { |v| v.to_s.strip }.reject(&:empty?)
    wanted_emails = Array(body['emails'] || body['email']).map { |v| v.to_s.strip.downcase }.reject(&:empty?)
    auth_users = firebase_auth_users_list
    targets = if wanted_uids.empty? && wanted_emails.empty?
      auth_users
    else
      auth_users.select do |u|
        wanted_uids.include?(u['uid'].to_s) || wanted_emails.include?(u['email'].to_s.strip.downcase)
      end
    end

    store = master_store
    imported = []
    skipped = []

    targets.each do |auth_user|
      existing = master_find_tenant(store, uid: auth_user['uid'], email: auth_user['email']) || {}
      if existing && !existing.empty?
        skipped << {
          'uid' => auth_user['uid'],
          'email' => auth_user['email'],
          'reason' => 'já existe no Master'
        }
        next
      end

      tenant = master_tenant_from_auth_user(auth_user, {})
      tenant['status'] = 'pending'
      tenant['role'] = 'pending_classification'
      tenant['source'] = 'firebase_auth'
      tenant['id'] = auth_user['uid'].to_s.strip
      tenant['email'] = auth_user['email'].to_s.strip
      tenant['createdAt'] = tenant['createdAt'] || Time.now.utc.iso8601
      tenant['updatedAt'] = Time.now.utc.iso8601

      master_restore_tenant!(store, tenant['id'])
      master_replace_tenant(store, tenant)
      imported << tenant
    end

    log_master("firebase import users count=#{imported.length} skipped=#{skipped.length} wanted=#{wanted_uids.join(',')}#{wanted_emails.empty? ? '' : " emails=#{wanted_emails.join(',')}" }")

    json_response(res, 200, {
      ok: true,
      imported: imported,
      skipped: skipped,
      totalAuthUsers: auth_users.length
    })
  rescue => e
    log_master("firebase import users error #{e.class}: #{e.message}")
    json_response(res, 400, { ok: false, error: e.message, imported: [], skipped: [] })
  end
end

server.mount_proc '/api/master/firebase/release-access' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'POST required' }) unless req.request_method == 'POST'

    body = read_json(req)
    uid = body['uid'].to_s.strip
    uid = body['id'].to_s.strip if uid.empty?
    email = body['email'].to_s.strip
    store = master_store
    tenant = master_find_tenant(store, uid: uid, email: email)
    raise WEBrick::HTTPStatus::NotFound, 'Usuário não encontrado no Master.' unless tenant

    auth_user = firebase_find_auth_user(uid: tenant['id'], email: tenant['email'])
    raise WEBrick::HTTPStatus::BadRequest, 'Usuário não existe no Firebase Auth.' unless auth_user
    raise WEBrick::HTTPStatus::Forbidden, 'Esta conta é de cliente da loja e não tem acesso ao Centro de Control.' if firebase_normalize_role(tenant['role']) == 'store_customer'
    raise WEBrick::HTTPStatus::Forbidden, 'Usuário sem autorização para o Centro de Control.' unless tenant['status'].to_s == 'active' && firebase_role_authorized_for_admin?(tenant['role'])

    sync_result = sync_system_tenant!(tenant, auth_user)
    raise WEBrick::HTTPStatus::BadRequest, sync_result['error'] if sync_result['error']
    raise WEBrick::HTTPStatus::BadRequest, 'Usuário não liberado para o Centro de Control.' if sync_result['skipped']

    log_master("firebase release access email=#{tenant['email']} uid=#{tenant['id']} role=#{tenant['role']} status=#{tenant['status']}")
    json_response(res, 200, { ok: true, tenantId: tenant['id'], systemTenant: sync_result['doc'] })
  rescue WEBrick::HTTPStatus::NotFound => e
    json_response(res, 404, { ok: false, error: e.message })
  rescue WEBrick::HTTPStatus::Forbidden => e
    json_response(res, 403, { ok: false, error: e.message })
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response(res, 400, { ok: false, error: e.message })
  rescue => e
    log_master("firebase release access error #{e.class}: #{e.message}")
    json_response(res, 400, { ok: false, error: e.message })
  end
end

server.mount_proc '/api/master/status' do |req, res|
  json_response(res, 200, {
    ok: true,
    host: req.host,
    local: req.host == '127.0.0.1' || req.host == 'localhost',
    note: 'GitHub Token e Repo são informados por publicação no formulário'
  })
end

server.mount_proc '/api/master/tenants' do |req, res|
  store = master_store
  if req.request_method == 'POST'
    body = read_json(req)
    id = body['id'].to_s.strip
    existing = (store['tenants'] || []).find { |t| t['id'] == id } || {}
    tenant = tenant_from_body(body, existing)
    master_restore_tenant!(store, tenant['id'])
    store['tenants'] = (store['tenants'] || []).reject { |t| t['id'] == tenant['id'] }
    store['tenants'] << tenant
    save_store(store)
    log_master("user saved #{tenant['id']}")
  end
  json_response(res, 200, { tenants: store['tenants'] || [] })
rescue => e
  json_response(res, 400, { error: e.message })
end

server.mount_proc '/api/master/tenants/delete' do |req, res|
  raise WEBrick::HTTPStatus::MethodNotAllowed, 'POST required' unless req.request_method == 'POST'
  store = master_store
  body = read_json(req)
  id = body['id'].to_s.strip
  raise WEBrick::HTTPStatus::BadRequest, 'ID do usuário obrigatório' if id.empty?
  store['tenants'] = (store['tenants'] || []).reject { |t| t['id'].to_s == id }
  master_mark_tenant_deleted!(store, id)
  save_store(store)
  deleted_system = false
  begin
    deleted_system = firestore_delete_document('system_tenants', id)
  rescue => e
    log_master("user delete system_tenant error uid=#{id} #{e.class}: #{e.message}")
  end
  log_master("user deleted #{id} local=true system_tenant_deleted=#{deleted_system}")
  json_response(res, 200, { tenants: store['tenants'] || [], deletedSystemTenant: deleted_system })
rescue => e
  json_response(res, 400, { error: e.message })
end

server.mount_proc '/api/master/templates' do |req, res|
  store = master_store
  if req.request_method == 'POST'
    body = read_json(req)
    name = body['name'].to_s.strip
    raise WEBrick::HTTPStatus::BadRequest, 'Nome obrigatório' if name.empty?
    tpl = { 'name' => name, 'file' => body['file'].to_s, 'updatedAt' => Time.now.utc.iso8601 }
    store['templates'] = (store['templates'] || []).reject { |t| t['name'] == name }
    store['templates'] << tpl
    save_store(store)
    log_master("template saved #{name}")
  end
  json_response(res, 200, { templates: store['templates'] || [] })
rescue => e
  json_response(res, 400, { error: e.message })
end

server.mount_proc '/api/master/global_config' do |req, res|
  store = master_store
  if req.request_method == 'POST'
    store['global_config'] = read_json(req)
    save_store(store)
    log_master('global config saved')
  end
  json_response(res, 200, { config: store['global_config'] || {} })
rescue => e
  json_response(res, 400, { error: e.message })
end

server.mount_proc '/api/master/logs' do |_req, res|
  logs = File.exist?(LOG_FILE) ? File.readlines(LOG_FILE).last(200).map(&:chomp) : []
  json_response(res, 200, { logs: logs })
end

server.mount_proc '/api/master/backup/config' do |req, res|
  store = master_store
  if req.request_method == 'POST'
    body = read_json(req)
    repo = body['repo'].to_s.strip
    branch = body['branch'].to_s.strip.empty? ? 'main' : body['branch'].to_s.strip
    save_backup_config(store, repo, branch)
    log_master("backup config saved repo=#{repo} branch=#{branch}")
  end
  json_response(res, 200, { ok: true, config: backup_config(master_store) })
rescue => e
  json_response(res, 400, { ok: false, error: e.message, config: backup_config(master_store) })
end

server.mount_proc '/api/master/backup/status' do |req, res|
  begin
    body = req.request_method == 'POST' ? read_json(req) : {}
    cfg = backup_config(master_store)
    repo = body['repo'].to_s.strip.empty? ? cfg['repo'] : body['repo'].to_s.strip
    branch = body['branch'].to_s.strip.empty? ? cfg['branch'] : body['branch'].to_s.strip
    git = git_status_snapshot
    json_response(res, 200, { ok: true, config: { 'repo' => repo, 'branch' => branch }, git: git })
  rescue => e
    json_response(res, 400, { ok: false, error: e.message, config: backup_config(master_store), git: {} })
  end
end

server.mount_proc '/api/master/backup/send' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'POST required' }) unless req.request_method == 'POST'
    body = read_json(req)
    cfg = backup_config(master_store)
    repo = body['repo'].to_s.strip.empty? ? cfg['repo'] : body['repo'].to_s.strip
    branch = body['branch'].to_s.strip.empty? ? cfg['branch'] : body['branch'].to_s.strip
    token = ENV['BACKUP_GITHUB_TOKEN'].to_s.strip
    token = ENV['MASTER_BACKUP_GITHUB_TOKEN'].to_s.strip if token.empty?
    token = ENV['GITHUB_TOKEN_BACKUP'].to_s.strip if token.empty?
    result = backup_push(repo: repo, branch: branch, token: token)
    log_master("backup sent repo=#{repo} branch=#{branch} status=#{result['skipped'] ? 'skipped' : 'ok'}")
    json_response(res, 200, result)
  rescue => e
    log_master("backup send error #{e.message}")
    json_response(res, 400, { ok: false, error: e.message })
  end
end

['/api/master/product-image/upload', '/api/master/product-image/upload/', '/api/master/upload-product-image', '/api/product-image/upload'].each do |path|
  server.mount_proc path do |req, res|
    handle_product_image_upload(req, res)
  end
end

server.mount_proc '/api/master/publish' do |req, res|
  begin
    unless req.request_method == 'POST'
      next json_response(res, 405, { error: 'POST required' })
    end

    body   = read_json(req)
    branch = body['branch'].to_s.empty?   ? 'main'       : body['branch'].to_s
    repo   = body['repo'].to_s.strip
    token  = body['token'].to_s.strip
    tenant = body['tenantId'].to_s.strip

    store = master_store
    template_file = active_template_file(store)
    tenant_cfg = (store['tenants'] || []).find { |t| t['id'].to_s == tenant }
    repo  = ENV['GITHUB_REPO'].to_s  if repo.empty?
    repo  = tenant_cfg['githubRepo'].to_s.strip if repo.empty? && tenant_cfg
    token = ENV['GITHUB_TOKEN'].to_s if token.empty?
    token = tenant_cfg['githubToken'].to_s.strip if token.empty? && tenant_cfg

    next json_response(res, 400, { error: 'ID do usuário (Firebase UID) obrigatório' }) if tenant.empty?
    next json_response(res, 400, { error: 'Repositório GitHub obrigatório' })           if repo.empty?
    next json_response(res, 400, { error: 'GitHub Token obrigatório' })                 if token.empty?

    result = publish_public_site(tenant_id: tenant, repo: repo, token: token, branch: branch, template_file: template_file)
    log_master("published public site repo=#{repo} branch=#{branch} tenant=#{tenant} template=#{template_file} files=#{result['files'].length}")
    append_publication_record(store, {
      'tenantId' => tenant,
      'repo' => repo,
      'domain' => result['baseUrl'].to_s,
      'publishedAt' => Time.now.utc.iso8601,
      'productsCount' => result.dig('generation', 'productsCount') || 0,
      'pagesCount' => result.dig('generation', 'pagesCount') || 0,
      'status' => 'ok',
      'errors' => []
    })
    json_response(res, 200, {
      ok: true,
      message: "Publicado! #{result['files'].length} arquivos enviados usando #{template_file}. Acesse: #{result['url']}",
      url: result['url'],
      files: result['files'],
      generation: result['generation']
    })
  rescue => e
    begin
      append_publication_record(master_store, {
        'tenantId' => tenant,
        'repo' => repo,
        'domain' => '',
        'publishedAt' => Time.now.utc.iso8601,
        'productsCount' => 0,
        'pagesCount' => 0,
        'status' => 'error',
        'errors' => [e.message]
      }) if tenant && !tenant.empty?
    rescue
    end
    log_master("publish error #{e.message}")
    json_response(res, 500, { ok: false, error: e.message })
  end
end

server.mount_proc '/api/master/publish-all' do |req, res|
  begin
    unless req.request_method == 'POST'
      next json_response(res, 405, { ok: false, error: 'POST required', published: [], skipped: [], errors: [] })
    end

    body  = read_json(req)
    token = body['token'].to_s.strip
    token = ENV['GITHUB_TOKEN'].to_s if token.empty?

    store   = master_store
    template_file = active_template_file(store)
    tenants = (store['tenants'] || []).select { |t| t['status'] == 'active' }

    published = []
    skipped   = []
    errors    = []

    tenants.each do |tenant|
      tid    = tenant['id'].to_s
      repo   = tenant['githubRepo'].to_s.strip
      tenant_token = token.empty? ? tenant['githubToken'].to_s.strip : token
      branch = tenant['githubBranch'].to_s.strip.empty? ? 'main'       : tenant['githubBranch'].to_s.strip
      unless tid.length > 4 && !repo.empty? && repo.include?('/') && !tenant_token.empty?
        reason = repo.empty? || !repo.include?('/') ? 'Sem repositório GitHub configurado' : 'Sem GitHub Token salvo'
        skipped << { 'tenantId' => tid, 'reason' => reason }
        log_master("publish-all skip tenant=#{tid} reason=#{reason}")
        next
      end

      begin
        result = publish_public_site(tenant_id: tid, repo: repo, token: tenant_token, branch: branch, template_file: template_file)
        log_master("publish-all ok tenant=#{tid} repo=#{repo} branch=#{branch} template=#{template_file} files=#{result['files'].length}")
        append_publication_record(store, {
          'tenantId' => tid,
          'repo' => repo,
          'domain' => result['baseUrl'].to_s,
          'publishedAt' => Time.now.utc.iso8601,
          'productsCount' => result.dig('generation', 'productsCount') || 0,
          'pagesCount' => result.dig('generation', 'pagesCount') || 0,
          'status' => 'ok',
          'errors' => []
        })
        published << {
          'tenantId' => tid,
          'ok' => true,
          'message' => "Publicado #{result['files'].length} arquivos usando #{template_file} → #{result['url']}",
          'url' => result['url'],
          'files' => result['files'],
          'generation' => result['generation']
        }
      rescue => e
        begin
          append_publication_record(store, {
            'tenantId' => tid,
            'repo' => repo,
            'domain' => '',
            'publishedAt' => Time.now.utc.iso8601,
            'productsCount' => 0,
            'pagesCount' => 0,
            'status' => 'error',
            'errors' => [e.message]
          })
        rescue
        end
        log_master("publish-all error tenant=#{tid} #{e.message}")
        errors << { 'tenantId' => tid, 'ok' => false, 'error' => e.message }
      end
    end

    results = published + errors + skipped.map { |s| { 'tenantId' => s['tenantId'], 'ok' => false, 'error' => s['reason'] } }

    json_response(res, 200, {
      ok:        errors.empty?,
      ok_count:  published.length,
      err_count: errors.length,
      total:     tenants.length,
      published: published,
      skipped:   skipped,
      errors:    errors,
      results:   results
    })
  rescue => e
    log_master("publish-all fatal #{e.message}")
    json_response(res, 500, { ok: false, error: e.message, published: [], skipped: [], errors: [] })
  end
end

server.mount_proc '/api/seasons/ai-recommendation' do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    raise WEBrick::HTTPStatus::MethodNotAllowed, 'POST required' unless req.request_method == 'POST'
    body = read_json(req)
    context = body['context'] || {}
    raise WEBrick::HTTPStatus::BadRequest, 'context obrigatório' unless context.is_a?(Hash) && !context.empty?

    # Integração futura:
    # - OPENAI_API_KEY deve ficar somente no ambiente do servidor.
    # - O frontend nunca deve enviar ou conhecer a chave.
    # - A resposta da OpenAI deve ser validada como JSON antes de voltar ao admin.
    # - Se a chamada falhar, o frontend usa fallback local e registra erro técnico no snapshot.
    if ENV['OPENAI_API_KEY'].to_s.strip.empty?
      json_response_cors(req, res, 503, {
        ok: false,
        status: 'not_configured',
        error: 'OpenAI não configurada no servidor. Defina OPENAI_API_KEY para habilitar a recomendação por IA.'
      })
      next
    end

    json_response_cors(req, res, 501, {
      ok: false,
      status: 'prepared',
      error: 'Endpoint preparado. Implementar chamada server-side para OpenAI e validação do JSON de recomendação.'
    })
  rescue WEBrick::HTTPStatus::MethodNotAllowed => e
    json_response_cors(req, res, 405, { ok: false, error: e.message })
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, { ok: false, error: e.message })
  rescue => e
    log_master("seasons ai recommendation error #{e.class}: #{e.message}")
    json_response_cors(req, res, 500, { ok: false, error: e.message })
  end
end

# Catch-all for unknown /api/ routes — always return JSON, never HTML
server.mount_proc '/api/' do |req, res|
  json_response(res, 404, { error: "Rota não encontrada: #{req.path}" })
end

trap('INT') { server.shutdown }
server.start
