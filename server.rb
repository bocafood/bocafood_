require 'webrick'
require 'json'
require 'net/http'
require 'net/smtp'
require 'uri'
require 'base64'
require 'time'
require 'timeout'
require 'open3'
require 'tempfile'
require 'fileutils'
require 'shellwords'
require 'openssl'
require 'securerandom'
require 'cgi'
require 'digest'
require_relative 'tools/generate-product-pages'

ROOT = File.dirname(File.expand_path(__FILE__))
PUBLIC_ROOT = File.join(ROOT, 'public')
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

def log_email_settings(message)
  line = "[EMAIL SETTINGS] #{message}"
  puts line
  log_master(line)
end

def log_email_test(message)
  line = "[EMAIL TEST] #{message}"
  puts line
  log_master(line)
end

def smtp_test_error(code, message)
  { ok: false, code: code, message: message, error: message }
end

def normalize_smtp_secure(value)
  secure = value.to_s.strip.downcase
  return secure if %w[tls ssl none].include?(secure)
  'tls'
end

def smtp_error_payload(error)
  case error
  when SocketError
    smtp_test_error('INVALID_CONFIG', 'Host SMTP inválido ou DNS não resolvido.')
  when Net::SMTPAuthenticationError
    smtp_test_error('AUTH_FAILED', 'Credenciais SMTP inválidas.')
  when Net::SMTPFatalError
    msg = error.message.to_s
    if msg.match?(/auth|authentication|535|534|530/i)
      smtp_test_error('AUTH_FAILED', 'Autenticação SMTP recusada. Verifique se o usuário/senha estão corretos e se a autenticação SMTP está ativada no Microsoft 365/GoDaddy.')
    else
      smtp_test_error('CONNECTION_FAILED', "Servidor SMTP recusou a conexão: #{msg}")
    end
  when Net::SMTPServerBusy, Net::SMTPUnknownError
    smtp_test_error('CONNECTION_FAILED', "Servidor SMTP indisponível ou bloqueado: #{error.message}")
  when OpenSSL::SSL::SSLError
    smtp_test_error('INVALID_CONFIG', "TLS/SSL incompatível. Para smtp.office365.com na porta 587 use TLS/STARTTLS, não SSL direto.")
  when Timeout::Error, Errno::ETIMEDOUT
    smtp_test_error('CONNECTION_FAILED', 'Timeout de conexão. O SMTP pode estar bloqueado pela rede, firewall ou provedor.')
  when Errno::ECONNREFUSED, Errno::EHOSTUNREACH, Errno::ENETUNREACH
    smtp_test_error('CONNECTION_FAILED', 'Conexão recusada ou rede indisponível. Verifique host, porta e bloqueio do provedor.')
  else
    smtp_test_error('CONNECTION_FAILED', "Erro SMTP: #{error.message}")
  end
end

def test_smtp_connection!(body)
  host = body['smtpHost'].to_s.strip
  port = body['smtpPort'].to_i
  secure = normalize_smtp_secure(body['smtpSecure'])
  user = body['smtpUser'].to_s.strip
  password = body['smtpPassword'].to_s
  from_email = body['fromEmail'].to_s.strip
  reply_to = body['replyTo'].to_s.strip

  raise WEBrick::HTTPStatus::BadRequest, 'Host SMTP obrigatório.' if host.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Porta SMTP inválida.' if port <= 0 || port > 65_535
  raise WEBrick::HTTPStatus::BadRequest, 'Usuário SMTP obrigatório.' if user.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Senha SMTP obrigatória para testar autenticação. A senha salva não é exibida nem reutilizada pelo teste local.' if password.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'E-mail do remetente inválido.' if !from_email.empty? && !from_email.include?('@')
  raise WEBrick::HTTPStatus::BadRequest, 'E-mail de resposta inválido.' if !reply_to.empty? && !reply_to.include?('@')
  if secure == 'ssl' && port == 587
    raise WEBrick::HTTPStatus::BadRequest, 'Configuração inválida: porta 587 usa TLS/STARTTLS. Não use SSL direto nessa porta.'
  end

  smtp = Net::SMTP.new(host, port)
  smtp.open_timeout = 10
  smtp.read_timeout = 10
  ssl_context = OpenSSL::SSL::SSLContext.new
  ssl_context.verify_mode = OpenSSL::SSL::VERIFY_NONE
  smtp.enable_ssl(ssl_context) if secure == 'ssl'
  smtp.enable_starttls_auto(ssl_context) if secure == 'tls'

  auth_type = :plain
  smtp.start('localhost', user, password, auth_type) { true }

  {
    ok: true,
    code: 'OK',
    message: 'Conexão SMTP validada com sucesso.'
  }
ensure
  begin
    smtp&.finish if smtp&.started?
  rescue
  end
end

def email_settings_error(message = 'Não foi possível salvar a configuração SMTP.', debug = nil)
  payload = {
    ok: false,
    code: 'SAVE_FAILED',
    message: message.to_s.strip.empty? ? 'Não foi possível salvar a configuração SMTP.' : message.to_s
  }
  payload[:debug] = debug.to_s.gsub(/smtpPassword["']?\s*[:=]\s*["']?[^"',}\s]+/i, 'smtpPassword=[REMOVIDO]') if debug && !debug.to_s.strip.empty?
  payload
end

def email_master_credential_message
  'Credencial Firebase do Master não configurada. Inicie pelo start-bocafood-local.sh.'
end

def email_master_credential_error?(error)
  error.message.to_s.match?(/Service account Firebase não configurada|FIREBASE_SERVICE_ACCOUNT|GOOGLE_APPLICATION_CREDENTIALS|credencial/i)
end

def email_read_error(message = 'Não foi possível carregar os dados de e-mail.', debug = nil)
  payload = {
    ok: false,
    code: 'LOAD_FAILED',
    message: message.to_s.strip.empty? ? 'Não foi possível carregar os dados de e-mail.' : message.to_s
  }
  payload[:debug] = debug.to_s if debug && !debug.to_s.strip.empty?
  payload
end

def email_settings_received_fields(body)
  {
    'fromName' => !body['fromName'].to_s.strip.empty?,
    'fromEmail' => !body['fromEmail'].to_s.strip.empty?,
    'replyTo' => !body['replyTo'].to_s.strip.empty?,
    'supportEmail' => !body['supportEmail'].to_s.strip.empty?,
    'appBaseUrl' => !body['appBaseUrl'].to_s.strip.empty?,
    'brandName' => !body['brandName'].to_s.strip.empty?,
    'smtpHost' => body['smtpHost'].to_s.strip,
    'smtpPort' => body['smtpPort'].to_i,
    'smtpSecure' => normalize_smtp_secure(body['smtpSecure']),
    'smtpUser' => !body['smtpUser'].to_s.strip.empty?,
    'smtpPassword' => body['smtpPassword'].to_s.empty? ? 'empty' : 'present',
    'enabled' => body['enabled'] == true
  }
end

def email_settings_debug(error)
  {
    'class' => error.class.to_s,
    'message' => error.message.to_s
  }.to_json
end

def email_public_settings_from_body(body)
  smtp_port = body['smtpPort'].to_i
  smtp_secure = normalize_smtp_secure(body['smtpSecure'])
  from_email = body['fromEmail'].to_s.strip
  reply_to = body['replyTo'].to_s.strip
  support_email = body['supportEmail'].to_s.strip

  raise WEBrick::HTTPStatus::BadRequest, 'Nome do remetente obrigatório.' if body['fromName'].to_s.strip.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'E-mail do remetente obrigatório.' if from_email.empty? || !from_email.include?('@')
  raise WEBrick::HTTPStatus::BadRequest, 'E-mail de resposta inválido.' if !reply_to.empty? && !reply_to.include?('@')
  raise WEBrick::HTTPStatus::BadRequest, 'E-mail de suporte inválido.' if !support_email.empty? && !support_email.include?('@')
  raise WEBrick::HTTPStatus::BadRequest, 'Host SMTP obrigatório.' if body['smtpHost'].to_s.strip.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Porta SMTP inválida.' if smtp_port <= 0 || smtp_port > 65_535
  raise WEBrick::HTTPStatus::BadRequest, 'Usuário SMTP obrigatório.' if body['smtpUser'].to_s.strip.empty?

  {
    'fromName' => body['fromName'].to_s.strip,
    'fromEmail' => from_email,
    'replyTo' => reply_to,
    'supportEmail' => support_email.empty? ? reply_to : support_email,
    'appBaseUrl' => body['appBaseUrl'].to_s.strip,
    'brandName' => body['brandName'].to_s.strip.empty? ? 'BocaFood' : body['brandName'].to_s.strip,
    'brandLogoUrl' => normalize_bocafood_brand_logo_url(body['brandLogoUrl']),
    'termsUrl' => body['termsUrl'].to_s.strip,
    'privacyUrl' => body['privacyUrl'].to_s.strip,
    'securityText' => body['securityText'].to_s.strip.empty? ? 'o BocaFood nunca solicita senha por e-mail.' : body['securityText'].to_s.strip,
    'footerReasonDefault' => body['footerReasonDefault'].to_s.strip.empty? ? 'esta mensagem faz parte do seu relacionamento com o BocaFood' : body['footerReasonDefault'].to_s.strip,
    'smtpHost' => body['smtpHost'].to_s.strip,
    'smtpPort' => smtp_port,
    'smtpSecure' => smtp_secure,
    'smtpUser' => body['smtpUser'].to_s.strip,
    'enabled' => body['enabled'] == true,
    'provider' => 'smtp'
  }
end

def bocafood_brand_logo_url
  'https://bocafood.app/assets/boca-food-logo.png'
end

def normalize_bocafood_brand_logo_url(value)
  url = value.to_s.strip
  return bocafood_brand_logo_url if url.empty? || url.include?('logo%20BocaFood.png') || url.include?('logo BocaFood.png')
  url
end

def email_secret_configured?
  secret_doc = firestore_get_document('system_private_email_secrets', 'default')
  fields = secret_doc ? firestore_fields_to_hash(secret_doc['fields'] || {}) : {}
  fields['smtpPasswordConfigured'] == true || !fields['smtpPassword'].to_s.empty?
rescue
  false
end

def email_settings_payload(settings_doc = nil)
  settings_doc ||= firestore_get_document('system_email_settings', 'default')
  settings = settings_doc ? default_email_settings.merge(firestore_fields_to_hash(settings_doc['fields'] || {})) : default_email_settings
  settings.delete('smtpPassword')
  settings['smtpPasswordConfigured'] = email_secret_configured?
  settings
end

def default_email_settings
  {
    'fromName' => 'BocaFood',
    'fromEmail' => 'no-reply@bocafood.com',
    'replyTo' => 'teajudo@bocafood.app',
    'supportEmail' => 'teajudo@bocafood.app',
    'appBaseUrl' => 'https://app.bocafood.com',
    'brandName' => 'BocaFood',
    'termsUrl' => 'https://bocafood.app/termos',
    'privacyUrl' => 'https://bocafood.app/privacidade',
    'securityText' => 'o BocaFood nunca solicita senha por e-mail.',
    'footerReasonDefault' => 'esta mensagem faz parte do seu relacionamento com o BocaFood',
    'brandLogoUrl' => bocafood_brand_logo_url,
    'smtpHost' => '',
    'smtpPort' => 587,
    'smtpSecure' => 'tls',
    'smtpUser' => '',
    'smtpPasswordConfigured' => false,
    'enabled' => false,
    'provider' => 'smtp'
  }
end

def save_email_settings!(body)
  public_settings = email_public_settings_from_body(body)
  log_email_settings('salvando system_email_settings/default')
  settings_doc = firestore_upsert_document('system_email_settings', 'default', public_settings)
  log_email_settings('sucesso ao salvar system_email_settings/default')
  password = body['smtpPassword'].to_s
  password_present = !password.empty?

  if password_present
    log_email_settings('salvando system_private_email_secrets/default smtpPassword=present')
    firestore_upsert_document('system_private_email_secrets', 'default', {
      'smtpPassword' => password,
      'smtpPasswordConfigured' => true
    })
    log_email_settings('sucesso ao salvar system_private_email_secrets/default')
  else
    log_email_settings('system_private_email_secrets/default preservado smtpPassword=empty')
  end

  log_email_settings("salvo host=#{public_settings['smtpHost']} port=#{public_settings['smtpPort']} secure=#{public_settings['smtpSecure']} user_present=#{!public_settings['smtpUser'].empty?} password_updated=#{password_present}")

  {
    ok: true,
    message: 'Configuração SMTP salva com sucesso.',
    settings: email_settings_payload(settings_doc)
  }
end

def email_send_error(message = 'Não foi possível enviar o e-mail de teste.', debug = nil)
  payload = {
    ok: false,
    code: 'SEND_FAILED',
    message: message.to_s.strip.empty? ? 'Não foi possível enviar o e-mail de teste.' : message.to_s
  }
  if debug && !debug.to_s.strip.empty?
    payload[:debug] = debug.to_s
      .gsub(/smtpPassword["']?\s*[:=]\s*["']?[^"',}\s]+/i, 'smtpPassword=[REMOVIDO]')
      .gsub(/password["']?\s*[:=]\s*["']?[^"',}\s]+/i, 'password=[REMOVIDO]')
      .gsub(/token["']?\s*[:=]\s*["']?[^"',}\s]+/i, 'token=[REMOVIDO]')
  end
  payload
end

def email_send_debug(error)
  {
    'class' => error.class.to_s,
    'message' => error.message.to_s
  }.to_json
end

def valid_email_address?(value)
  value.to_s.strip.match?(/\A[^@\s]+@[^@\s]+\.[^@\s]+\z/)
end

def email_replace_variables(text, variables)
  text.to_s.gsub(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/) do
    key = Regexp.last_match(1)
    variables.key?(key) ? variables[key].to_s : ''
  end
end

def default_test_email_template
  {
    'key' => 'test_email',
    'name' => 'Teste de envio',
    'description' => 'Usado pelo Master para validar envio SMTP.',
    'subject' => 'Teste de envio BocaFood',
    'preheader' => 'Se voce recebeu esta mensagem, o SMTP do BocaFood esta funcionando.',
    'body' => '<p>Ola {{buyerName}},</p><p>Este e um e-mail de teste enviado pelo Master do BocaFood.</p><p>A configuracao SMTP foi carregada e usada pelo backend local.</p>',
    'ctaLabel' => 'Abrir BocaFood',
    'ctaUrl' => '{{appBaseUrl}}',
    'enabled' => true,
    'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'appBaseUrl', 'brandName']
  }
end

def default_email_templates
  [
    {
      'key' => 'welcome_hotmart',
      'name' => 'Boas-vindas após compra Hotmart',
      'description' => 'Enviado quando uma compra Hotmart é aprovada ou uma assinatura fica ativa.',
      'subject' => 'Bem-vinda ao {{productName}}, {{buyerName}}',
      'preheader' => 'Seu acesso ao {{productName}} ja esta pronto.',
      'body' => '<p>Ola {{buyerName}},</p><p>Obrigada por comprar o {{productName}}. Seu plano {{planName}} esta pronto para comecar.</p><p>Clique no botao para criar seu acesso e entrar no BocaFood.</p>',
      'ctaLabel' => 'Criar meu acesso',
      'ctaUrl' => '{{signupUrl}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'signupUrl', 'supportEmail', 'planName', 'productName', 'appBaseUrl', 'brandName']
    },
    {
      'key' => 'password_reset',
      'name' => 'Esqueci minha senha',
      'description' => 'Enviado quando a usuária solicita redefinição de senha no login.',
      'subject' => 'Redefina sua senha do {{brandName}}',
      'preheader' => 'Use este link para criar uma nova senha.',
      'body' => '<p>Ola {{buyerName}},</p><p>Recebemos uma solicitacao para redefinir a senha da sua conta.</p><p>Se foi voce, use o botao abaixo. Se nao solicitou essa alteracao, ignore este e-mail.</p>',
      'ctaLabel' => 'Redefinir senha',
      'ctaUrl' => '{{resetPasswordUrl}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'resetPasswordUrl', 'supportEmail', 'appBaseUrl', 'brandName']
    },
    {
      'key' => 'verify_email',
      'name' => 'Confirmação de e-mail',
      'description' => 'Confirma o endereço de e-mail da conta BocaFood.',
      'subject' => 'Confirme seu e-mail no {{brandName}}',
      'preheader' => 'Falta apenas confirmar seu e-mail para continuar.',
      'body' => '<p>Ola {{buyerName}},</p><p>Confirme seu endereco de e-mail para proteger sua conta e receber avisos importantes.</p>',
      'ctaLabel' => 'Confirmar e-mail',
      'ctaUrl' => '{{appBaseUrl}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'appBaseUrl', 'brandName']
    },
    {
      'key' => 'subscription_active',
      'name' => 'Assinatura ativada',
      'description' => 'Confirma que a assinatura está ativa.',
      'subject' => 'Sua assinatura esta ativa',
      'preheader' => 'Voce ja pode usar o {{productName}} com o plano {{planName}}.',
      'body' => '<p>Ola {{buyerName}},</p><p>Sua assinatura do {{productName}} esta ativa. Voce ja pode entrar no painel e continuar configurando sua loja.</p>',
      'ctaLabel' => 'Abrir BocaFood',
      'ctaUrl' => '{{appBaseUrl}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'planName', 'productName', 'appBaseUrl', 'brandName']
    },
    {
      'key' => 'payment_pending',
      'name' => 'Pagamento pendente',
      'description' => 'Avisa que o pagamento ainda está pendente.',
      'subject' => 'Seu pagamento esta pendente',
      'preheader' => 'Avisaremos quando o pagamento tiver confirmação.',
      'body' => '<p>Ola {{buyerName}},</p><p>Seu pagamento do {{productName}} ainda esta pendente. Quando ele for confirmado, enviaremos as instrucoes de acesso.</p>',
      'ctaLabel' => 'Ver status',
      'ctaUrl' => '{{appBaseUrl}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'planName', 'productName', 'appBaseUrl', 'brandName']
    },
    {
      'key' => 'access_blocked',
      'name' => 'Acesso bloqueado',
      'description' => 'Avisa que o acesso foi bloqueado por cancelamento, reembolso ou chargeback.',
      'subject' => 'Seu acesso ao {{brandName}} foi bloqueado',
      'preheader' => 'Identificamos uma alteração na sua assinatura Hotmart.',
      'body' => '<p>Ola {{buyerName}},</p><p>Identificamos uma alteração na sua assinatura do {{productName}} e o acesso ao Centro de Controle foi bloqueado.</p><p>Motivo: {{blockedReason}}.</p><p>Se acredita que houve um erro ou precisa regularizar o acesso, fale com o suporte BocaFood.</p>',
      'ctaLabel' => 'Falar com suporte',
      'ctaUrl' => 'mailto:{{supportEmail}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'planName', 'productName', 'appBaseUrl', 'brandName', 'billingStatus', 'blockedReason', 'canceledAt', 'hotmartTransaction', 'hotmartOfferCode']
    },
    {
      'key' => 'trial_ending',
      'name' => 'Trial acabando',
      'description' => 'Aviso enviado quando o periodo de teste esta perto do fim.',
      'subject' => 'Seu teste do {{brandName}} acaba em breve',
      'preheader' => 'Faltam poucos dias para terminar seu periodo de teste.',
      'body' => '<p>Ola {{buyerName}},</p><p>Seu periodo de teste do {{brandName}} esta acabando em breve.</p><p>Entre no Centro de Controle para revisar sua loja e manter o acesso ativo.</p>',
      'ctaLabel' => 'Abrir BocaFood',
      'ctaUrl' => '{{appBaseUrl}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'appBaseUrl', 'brandName', 'trialEndsAt', 'planName']
    },
    {
      'key' => 'trial_ends_today',
      'name' => 'Trial acaba hoje',
      'description' => 'Aviso enviado no dia final do periodo de teste.',
      'subject' => 'Seu teste do {{brandName}} acaba hoje',
      'preheader' => 'Hoje e o ultimo dia do seu periodo de teste.',
      'body' => '<p>Ola {{buyerName}},</p><p>Seu teste do {{brandName}} acaba hoje.</p><p>Se precisar de ajuda para continuar, fale com o suporte.</p>',
      'ctaLabel' => 'Abrir BocaFood',
      'ctaUrl' => '{{appBaseUrl}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'appBaseUrl', 'brandName', 'trialEndsAt', 'planName']
    },
    {
      'key' => 'trial_expired',
      'name' => 'Trial expirado',
      'description' => 'Aviso enviado quando o periodo de teste terminou.',
      'subject' => 'Seu teste do {{brandName}} terminou',
      'preheader' => 'Seu periodo de teste chegou ao fim.',
      'body' => '<p>Ola {{buyerName}},</p><p>Seu periodo de teste terminou. Para continuar usando o BocaFood, regularize seu acesso ou fale com o suporte.</p>',
      'ctaLabel' => 'Falar com suporte',
      'ctaUrl' => 'mailto:{{supportEmail}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'appBaseUrl', 'brandName', 'trialEndsAt', 'planName']
    },
    {
      'key' => 'store_not_published',
      'name' => 'Loja não publicada',
      'description' => 'Lembrete para contas que ainda nao publicaram a loja.',
      'subject' => 'Sua loja ainda nao esta publicada',
      'preheader' => 'Complete a publicacao para seus clientes encontrarem sua loja.',
      'body' => '<p>Ola {{buyerName}},</p><p>Sua loja publica ainda nao foi publicada.</p><p>Entre no Centro de Controle, revise a configuracao e publique sua loja quando estiver pronta.</p>',
      'ctaLabel' => 'Abrir Centro de Controle',
      'ctaUrl' => '{{appBaseUrl}}',
      'enabled' => false,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'appBaseUrl', 'brandName', 'storeName']
    },
    {
      'key' => 'subscription_canceled',
      'name' => 'Assinatura cancelada',
      'description' => 'Avisa sobre cancelamento da assinatura.',
      'subject' => 'Sua assinatura foi cancelada',
      'preheader' => 'Seu acesso pode ficar limitado conforme o ciclo de cobranca.',
      'body' => '<p>Ola {{buyerName}},</p><p>Registramos o cancelamento da sua assinatura. Se foi um erro ou se voce precisa de ajuda, fale com o suporte.</p>',
      'ctaLabel' => 'Falar com suporte',
      'ctaUrl' => 'mailto:{{supportEmail}}',
      'enabled' => true,
      'availableVariables' => ['buyerName', 'buyerEmail', 'supportEmail', 'planName', 'productName', 'appBaseUrl', 'brandName']
    },
    default_test_email_template
  ]
end

def ensure_email_template_defaults!
  default_email_templates.each do |template|
    key = template['key'].to_s
    next if key.empty?
    existing = firestore_get_document('system_email_templates', key)
    firestore_upsert_document('system_email_templates', key, template) unless existing
  end
end

def default_email_triggers
  [
    {
      'triggerKey' => 'welcome_hotmart_email',
      'tagKey' => 'hotmart_pending_access',
      'templateKey' => 'welcome_hotmart',
      'name' => 'Boas-vindas Hotmart',
      'description' => 'Envia boas-vindas quando existir pendência de acesso Hotmart marcada por etiqueta.',
      'enabled' => false,
      'delayHours' => 0,
      'dedupeWindowDays' => 30,
      'source' => 'system'
    },
    {
      'triggerKey' => 'trial_ending_email',
      'tagKey' => 'trial_ending',
      'templateKey' => 'trial_ending',
      'name' => 'Trial acabando',
      'description' => 'Envia aviso quando o trial estiver perto de acabar.',
      'enabled' => true,
      'delayHours' => 0,
      'dedupeWindowDays' => 30,
      'source' => 'system'
    },
    {
      'triggerKey' => 'trial_ends_today_email',
      'tagKey' => 'trial_ends_today',
      'templateKey' => 'trial_ends_today',
      'name' => 'Trial acaba hoje',
      'description' => 'Envia aviso no dia em que o trial termina.',
      'enabled' => true,
      'delayHours' => 0,
      'dedupeWindowDays' => 30,
      'source' => 'system'
    },
    {
      'triggerKey' => 'trial_expired_email',
      'tagKey' => 'trial_expired',
      'templateKey' => 'trial_expired',
      'name' => 'Trial expirado',
      'description' => 'Envia aviso quando o trial terminou sem assinatura ativa.',
      'enabled' => true,
      'delayHours' => 0,
      'dedupeWindowDays' => 30,
      'source' => 'system'
    },
    {
      'triggerKey' => 'payment_pending_email',
      'tagKey' => 'payment_pending',
      'templateKey' => 'payment_pending',
      'name' => 'Pagamento pendente',
      'description' => 'Envia aviso quando a cobrança estiver pendente.',
      'enabled' => true,
      'delayHours' => 0,
      'dedupeWindowDays' => 7,
      'source' => 'system'
    },
    {
      'triggerKey' => 'subscription_active_email',
      'tagKey' => 'subscription_active',
      'templateKey' => 'subscription_active',
      'name' => 'Assinatura ativa',
      'description' => 'Gatilho preparado para contas marcadas com assinatura ativa.',
      'enabled' => false,
      'delayHours' => 0,
      'dedupeWindowDays' => 30,
      'source' => 'system'
    },
    {
      'triggerKey' => 'subscription_canceled_email',
      'tagKey' => 'subscription_canceled',
      'templateKey' => 'access_blocked',
      'name' => 'Acesso bloqueado',
      'description' => 'Envia aviso quando cancelamento, reembolso ou chargeback bloqueia o acesso.',
      'enabled' => true,
      'delayHours' => 0,
      'dedupeWindowDays' => 30,
      'source' => 'system'
    },
    {
      'triggerKey' => 'store_not_published_email',
      'tagKey' => 'store_not_published',
      'templateKey' => 'store_not_published',
      'name' => 'Loja não publicada',
      'description' => 'Envia lembrete quando a loja ainda não foi publicada.',
      'enabled' => false,
      'delayHours' => 24,
      'dedupeWindowDays' => 7,
      'source' => 'system'
    }
  ]
end

def ensure_email_trigger_defaults!
  default_email_triggers.each do |trigger|
    key = trigger['triggerKey']
    existing = firestore_get_document('system_email_triggers', key)
    if existing
      if key == 'subscription_canceled_email' &&
         existing['source'].to_s == 'system' &&
         existing['tagKey'].to_s == 'subscription_canceled' &&
         existing['templateKey'].to_s == 'subscription_canceled'
        firestore_upsert_document('system_email_triggers', key, {
          'templateKey' => 'access_blocked',
          'name' => 'Acesso bloqueado',
          'description' => 'Envia aviso quando cancelamento, reembolso ou chargeback bloqueia o acesso.',
          'updatedAt' => Time.now.utc.iso8601
        })
      end
    else
      firestore_upsert_document('system_email_triggers', key, trigger)
    end
  end
end

def load_email_triggers_payload
  ensure_email_trigger_defaults!
  docs = firestore_list_documents('system_email_triggers')
  triggers = docs.map do |doc|
    fields = firestore_fields_to_hash(doc['fields'] || {})
    fields['id'] = File.basename(doc['name'].to_s)
    fields['triggerKey'] ||= fields['id']
    fields
  end
  triggers.sort_by { |item| item['name'].to_s.downcase }
end

def save_email_trigger_payload!(body)
  trigger_key = body['triggerKey'].to_s.strip
  tag_key = body['tagKey'].to_s.strip
  template_key = body['templateKey'].to_s.strip
  raise WEBrick::HTTPStatus::BadRequest, 'triggerKey obrigatório.' if trigger_key.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Etiqueta obrigatória.' if tag_key.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Template obrigatório.' if template_key.empty?
  payload = {
    'triggerKey' => trigger_key,
    'tagKey' => tag_key,
    'templateKey' => template_key,
    'name' => body['name'].to_s.strip.empty? ? trigger_key : body['name'].to_s.strip,
    'description' => body['description'].to_s.strip,
    'enabled' => body['enabled'] == true,
    'delayHours' => [body['delayHours'].to_i, 0].max,
    'dedupeWindowDays' => [body['dedupeWindowDays'].to_i, 1].max,
    'source' => body['source'].to_s.strip.empty? ? 'master' : body['source'].to_s.strip
  }
  firestore_upsert_document('system_email_triggers', trigger_key, payload)
  payload
end

def normalize_system_page_url(value)
  value.to_s.strip.sub(%r{/\z}, '').downcase
end

def system_page_possible_urls(page)
  slug = page['slug'].to_s.strip
  key = page['key'].to_s.strip
  values = []
  values << slug unless slug.empty?
  values << "/#{key}" unless key.empty?
  values += values.map { |path| path.start_with?('http') ? path : "https://bocafood.app#{path.start_with?('/') ? path : "/#{path}"}" }
  values.map { |value| normalize_system_page_url(value) }.reject(&:empty?).uniq
end

def system_page_link_usages(page, email_settings)
  urls = system_page_possible_urls(page)
  usages = []
  terms_url = normalize_system_page_url(email_settings['termsUrl'])
  privacy_url = normalize_system_page_url(email_settings['privacyUrl'])
  if !terms_url.empty? && urls.include?(terms_url)
    usages << {
      'title' => 'Rodapé dos e-mails transacionais',
      'description' => 'Usada no campo Termos de uso das configurações globais de e-mail.',
      'field' => 'system_email_settings/default.termsUrl'
    }
  end
  if !privacy_url.empty? && urls.include?(privacy_url)
    usages << {
      'title' => 'Rodapé dos e-mails transacionais',
      'description' => 'Usada no campo Política de privacidade das configurações globais de e-mail.',
      'field' => 'system_email_settings/default.privacyUrl'
    }
  end
  if urls.include?('https://bocafood.app/termosdeuso') || urls.include?('https://bocafood.app/termos')
    usages << {
      'title' => 'Cadastro / primeiro acesso',
      'description' => 'Pode aparecer como link de Termos de Uso no aceite do onboarding, conforme URL configurada no cadastro publicado.',
      'field' => 'public/cadastro.html'
    }
  end
  if urls.include?('https://bocafood.app/privacidade')
    usages << {
      'title' => 'Cadastro / primeiro acesso',
      'description' => 'Pode aparecer como link de Política de Privacidade no aceite do onboarding, conforme URL configurada no cadastro publicado.',
      'field' => 'public/cadastro.html'
    }
  end
  usages.uniq { |usage| [usage['title'], usage['field'], usage['description']] }
end

def load_system_pages_payload
  docs = firestore_list_documents('system_pages')
  settings_doc = firestore_get_document('system_email_settings', 'default')
  email_settings = settings_doc ? default_email_settings.merge(firestore_fields_to_hash(settings_doc['fields'] || {})) : default_email_settings
  pages = docs.map do |doc|
    fields = firestore_fields_to_hash(doc['fields'] || {})
    fields['id'] = File.basename(doc['name'].to_s)
    fields['key'] ||= fields['id']
    fields['linkedIn'] = system_page_link_usages(fields, email_settings)
    fields
  end
  pages.sort_by { |page| [page['order'].to_i, page['title'].to_s.downcase] }
end

def system_page_key(value)
  value.to_s.strip.downcase
       .gsub(/[áàãâä]/, 'a')
       .gsub(/[éèêë]/, 'e')
       .gsub(/[íìîï]/, 'i')
       .gsub(/[óòõôö]/, 'o')
       .gsub(/[úùûü]/, 'u')
       .gsub(/[ç]/, 'c')
       .gsub(/[^a-z0-9]+/, '-')
       .gsub(/^-+|-+$/, '')
end

def sanitize_system_page_html(value)
  value.to_s
       .gsub(%r{<script\b[^>]*>.*?</script>}im, '')
       .gsub(%r{<iframe\b[^>]*>.*?</iframe>}im, '')
       .gsub(/\son[a-z]+\s*=\s*(['"]).*?\1/im, '')
       .gsub(/\sjavascript:/i, '')
end

def save_system_page_payload!(body)
  title = body['title'].to_s.strip
  key = system_page_key(body['key'].to_s.empty? ? title : body['key'])
  raise WEBrick::HTTPStatus::BadRequest, 'Chave da página obrigatória.' if key.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Título da página obrigatório.' if title.empty?

  slug = body['slug'].to_s.strip
  slug = "/#{system_page_key(title)}" if slug.empty?
  slug = "/#{slug}" unless slug.start_with?('/')
  status = body['status'].to_s.strip
  status = 'draft' unless %w[draft published archived].include?(status)

  payload = {
    'key' => key,
    'title' => title,
    'slug' => slug,
    'status' => status,
    'summary' => body['summary'].to_s.strip,
    'category' => body['category'].to_s.strip.empty? ? 'legal' : body['category'].to_s.strip,
    'order' => body['order'].to_i,
    'seoTitle' => body['seoTitle'].to_s.strip,
    'seoDescription' => body['seoDescription'].to_s.strip,
    'contentHtml' => sanitize_system_page_html(body['contentHtml']),
    'source' => 'master_local'
  }
  firestore_upsert_document('system_pages', key, payload)
  payload
end

def delete_system_page_payload!(body)
  key = system_page_key(body['key'])
  raise WEBrick::HTTPStatus::BadRequest, 'Chave da página obrigatória.' if key.empty?

  firestore_delete_document('system_pages', key)
  { 'key' => key }
end

def crm_tag_defaults
  [
    { 'key' => 'trial_sem_cardapio', 'name' => 'Trial sem cardápio', 'description' => 'Conta em trial que ainda não iniciou o cardápio.', 'color' => '#F59E0B', 'enabled' => true, 'createdBy' => 'system' },
    { 'key' => 'usuario_inativo', 'name' => 'Usuário inativo', 'description' => 'Conta com pouca atividade recente.', 'color' => '#6B7280', 'enabled' => true, 'createdBy' => 'system' },
    { 'key' => 'potencial_upgrade', 'name' => 'Potencial upgrade', 'description' => 'Conta com sinais de maturidade para plano superior.', 'color' => '#2563EB', 'enabled' => true, 'createdBy' => 'system' },
    { 'key' => 'cardapio_iniciado', 'name' => 'Cardápio iniciado', 'description' => 'Conta que já iniciou cadastro de produtos/cardápio.', 'color' => '#16A34A', 'enabled' => true, 'createdBy' => 'system' },
    { 'key' => 'loja_publicada', 'name' => 'Loja publicada', 'description' => 'Conta com loja pública publicada.', 'color' => '#059669', 'enabled' => true, 'createdBy' => 'system' },
    { 'key' => 'risco_cancelamento', 'name' => 'Risco de cancelamento', 'description' => 'Conta com sinais de risco comercial ou cobrança crítica.', 'color' => '#DC2626', 'enabled' => true, 'createdBy' => 'system' },
    { 'key' => 'cliente_avancada', 'name' => 'Cliente avançada', 'description' => 'Conta com uso avançado do BocaFood.', 'color' => '#7C3AED', 'enabled' => true, 'createdBy' => 'system' }
  ]
end

def crm_rule_defaults
  [
    {
      'ruleId' => 'trial_sem_cardapio_rule',
      'name' => 'Marcar trial sem cardápio',
      'description' => 'Aplica tag CRM quando a conta está em trial há mais de 5 dias e ainda não tem produtos.',
      'enabled' => false,
      'audience' => 'tenants',
      'conditions' => [
        { 'field' => 'billing.status', 'operator' => 'equals', 'value' => 'trial' },
        { 'field' => 'createdAt', 'operator' => 'older_than_days', 'value' => 5 },
        { 'field' => 'stats.productsCount', 'operator' => 'equals', 'value' => 0 }
      ],
      'actions' => [{ 'type' => 'add_tag', 'tagKey' => 'trial_sem_cardapio' }],
      'runFrequency' => 'daily',
      'createdBy' => 'system'
    },
    {
      'ruleId' => 'cardapio_iniciado_rule',
      'name' => 'Marcar cardápio iniciado',
      'description' => 'Remove trial sem cardápio e marca cardápio iniciado quando a conta tem produtos.',
      'enabled' => false,
      'audience' => 'tenants',
      'conditions' => [{ 'field' => 'stats.productsCount', 'operator' => 'greater_than', 'value' => 0 }],
      'actions' => [{ 'type' => 'remove_tag', 'tagKey' => 'trial_sem_cardapio' }, { 'type' => 'add_tag', 'tagKey' => 'cardapio_iniciado' }],
      'runFrequency' => 'daily',
      'createdBy' => 'system'
    }
  ]
end

def clean_crm_tag_key(value)
  value.to_s.strip.downcase.gsub(/[^a-z0-9_]+/, '_').gsub(/^_+|_+$/, '')[0, 64].to_s
end

def ensure_crm_tag_defaults!
  crm_tag_defaults.each do |tag|
    key = tag['key']
    existing = firestore_get_document('system_crm_tags', key)
    firestore_upsert_document('system_crm_tags', key, tag) unless existing
  end
end

def ensure_crm_rule_defaults!
  crm_rule_defaults.each do |rule|
    key = rule['ruleId']
    existing = firestore_get_document('system_crm_tag_rules', key)
    firestore_upsert_document('system_crm_tag_rules', key, rule) unless existing
  end
end

def load_crm_tags_payload
  ensure_crm_tag_defaults!
  firestore_list_documents('system_crm_tags').map do |doc|
    fields = firestore_fields_to_hash(doc['fields'] || {})
    fields['id'] = File.basename(doc['name'].to_s)
    fields['key'] ||= fields['id']
    fields
  end.sort_by { |item| item['name'].to_s.downcase }
end

def save_crm_tag_payload!(body)
  key = clean_crm_tag_key(body['key'])
  raise WEBrick::HTTPStatus::BadRequest, 'Chave da tag CRM obrigatória.' if key.empty?
  payload = {
    'key' => key,
    'name' => body['name'].to_s.strip.empty? ? key : body['name'].to_s.strip,
    'description' => body['description'].to_s.strip,
    'color' => body['color'].to_s.strip.empty? ? '#6B7280' : body['color'].to_s.strip,
    'enabled' => body['enabled'] != false,
    'createdBy' => body['createdBy'].to_s.strip.empty? ? 'master' : body['createdBy'].to_s.strip
  }
  firestore_upsert_document('system_crm_tags', key, payload)
  payload
end

def normalize_crm_rule_items(items)
  Array(items).map do |item|
    next nil unless item.is_a?(Hash)
    normalized = {}
    item.each { |k, v| normalized[k.to_s] = v }
    normalized
  end.compact
end

def load_crm_rules_payload
  ensure_crm_rule_defaults!
  firestore_list_documents('system_crm_tag_rules').map do |doc|
    fields = firestore_fields_to_hash(doc['fields'] || {})
    fields['id'] = File.basename(doc['name'].to_s)
    fields['ruleId'] ||= fields['id']
    fields
  end.sort_by { |item| item['name'].to_s.downcase }
end

def save_crm_rule_payload!(body)
  rule_id = clean_crm_tag_key(body['ruleId'])
  raise WEBrick::HTTPStatus::BadRequest, 'ruleId obrigatório.' if rule_id.empty?
  payload = {
    'ruleId' => rule_id,
    'name' => body['name'].to_s.strip.empty? ? rule_id : body['name'].to_s.strip,
    'description' => body['description'].to_s.strip,
    'enabled' => body['enabled'] == true,
    'audience' => body['audience'].to_s.strip.empty? ? 'tenants' : body['audience'].to_s.strip,
    'conditions' => normalize_crm_rule_items(body['conditions']),
    'actions' => normalize_crm_rule_items(body['actions']),
    'runFrequency' => body['runFrequency'].to_s.strip.empty? ? 'daily' : body['runFrequency'].to_s.strip,
    'createdBy' => body['createdBy'].to_s.strip.empty? ? 'master' : body['createdBy'].to_s.strip
  }
  firestore_upsert_document('system_crm_tag_rules', rule_id, payload)
  payload
end

def apply_crm_tag_to_tenant!(body)
  uid = body['tenantUid'].to_s.strip
  tag_key = clean_crm_tag_key(body['tagKey'])
  action = body['action'].to_s.strip == 'remove_tag' ? 'remove_tag' : 'add_tag'
  raise WEBrick::HTTPStatus::BadRequest, 'tenantUid obrigatório.' if uid.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'tagKey obrigatório.' if tag_key.empty?
  doc = firestore_get_document('system_tenants', uid)
  raise WEBrick::HTTPStatus::BadRequest, 'Conta não encontrada em system_tenants.' unless doc
  tenant = firestore_fields_to_hash(doc['fields'] || {})
  crm_tags = tenant['crmTags'].is_a?(Hash) ? tenant['crmTags'] : {}
  crm_meta = tenant['crmTagMeta'].is_a?(Hash) ? tenant['crmTagMeta'] : {}
  crm_tags[tag_key] = action == 'add_tag'
  if action == 'add_tag'
    crm_meta[tag_key] = {
      'addedAt' => Time.now.utc.iso8601,
      'addedBy' => body['addedBy'].to_s.strip.empty? ? 'master' : body['addedBy'].to_s.strip,
      'source' => 'manual'
    }
  end
  firestore_upsert_document('system_tenants', uid, {
    'crmTags' => crm_tags,
    'crmTagMeta' => crm_meta
  })
  firestore_upsert_document('system_crm_tag_logs', SecureRandom.uuid, {
    'tenantUid' => uid,
    'action' => action,
    'tagKey' => tag_key,
    'matched' => true,
    'reason' => 'manual_master'
  })
  { 'tenantUid' => uid, 'tagKey' => tag_key, 'action' => action }
end

def crm_nested_value(source, path)
  current = source
  path.to_s.split('.').each do |part|
    return nil unless current.is_a?(Hash)
    return nil unless current.key?(part)
    current = current[part]
  end
  current
end

def crm_value_present?(value)
  return false if value.nil?
  return !value.strip.empty? if value.is_a?(String)
  return !value.empty? if value.respond_to?(:empty?)
  true
end

def crm_number(value)
  return value.to_f if value.is_a?(Numeric)
  Float(value.to_s)
rescue
  nil
end

def crm_time(value)
  return value if value.is_a?(Time)
  return nil if value.nil? || value.to_s.strip.empty?
  Time.parse(value.to_s)
rescue
  nil
end

def crm_condition_matches?(tenant, condition)
  return false unless condition.is_a?(Hash)
  field = condition['field'].to_s.strip
  operator = condition['operator'].to_s.strip
  expected = condition['value']
  actual = crm_nested_value(tenant, field)

  case operator
  when 'equals'
    actual.to_s == expected.to_s
  when 'not_equals'
    actual.to_s != expected.to_s
  when 'greater_than', 'greater_or_equal', 'less_than', 'less_or_equal'
    left = crm_number(actual)
    right = crm_number(expected)
    return false if left.nil? || right.nil?
    case operator
    when 'greater_than' then left > right
    when 'greater_or_equal' then left >= right
    when 'less_than' then left < right
    else left <= right
    end
  when 'exists'
    crm_value_present?(actual)
  when 'not_exists'
    !crm_value_present?(actual)
  when 'older_than_days', 'newer_than_days'
    date = crm_time(actual)
    days = crm_number(expected)
    return false if date.nil? || days.nil?
    threshold = Time.now.utc - (days * 86_400)
    operator == 'older_than_days' ? date < threshold : date >= threshold
  else
    false
  end
end

def crm_rule_matches?(tenant, rule)
  conditions = normalize_crm_rule_items(rule['conditions'])
  return false if conditions.empty?
  conditions.all? { |condition| crm_condition_matches?(tenant, condition) }
end

def apply_crm_rule_action_to_tenant!(uid, action, rule_id, added_by)
  tag_key = clean_crm_tag_key(action['tagKey'])
  type = action['type'].to_s.strip == 'remove_tag' ? 'remove_tag' : 'add_tag'
  raise WEBrick::HTTPStatus::BadRequest, 'tagKey da ação obrigatório.' if tag_key.empty?

  doc = firestore_get_document('system_tenants', uid)
  raise WEBrick::HTTPStatus::BadRequest, 'Conta não encontrada em system_tenants.' unless doc
  tenant = firestore_fields_to_hash(doc['fields'] || {})
  crm_tags = tenant['crmTags'].is_a?(Hash) ? tenant['crmTags'] : {}
  crm_meta = tenant['crmTagMeta'].is_a?(Hash) ? tenant['crmTagMeta'] : {}
  crm_tags[tag_key] = type == 'add_tag'
  if type == 'add_tag'
    crm_meta[tag_key] = {
      'addedAt' => Time.now.utc.iso8601,
      'addedBy' => added_by.to_s.strip.empty? ? 'crm_rule' : added_by.to_s.strip,
      'source' => 'rule',
      'ruleId' => rule_id
    }
  end
  firestore_upsert_document('system_tenants', uid, {
    'crmTags' => crm_tags,
    'crmTagMeta' => crm_meta
  })
  firestore_upsert_document('system_crm_tag_logs', SecureRandom.uuid, {
    'ruleId' => rule_id,
    'tenantUid' => uid,
    'action' => type,
    'tagKey' => tag_key,
    'matched' => true,
    'reason' => 'manual_rule_validation'
  })
  { 'tenantUid' => uid, 'action' => type, 'tagKey' => tag_key, 'ruleId' => rule_id }
end

def run_crm_tag_rules_payload!(body)
  ensure_crm_tag_defaults!
  ensure_crm_rule_defaults!
  tenant_uid_filter = body['tenantUid'].to_s.strip
  rule_id_filter = clean_crm_tag_key(body['ruleId'])
  added_by = body['addedBy'].to_s.strip.empty? ? 'crm_rule_validation' : body['addedBy'].to_s.strip

  rules = load_crm_rules_payload.select { |rule| rule['enabled'] == true }
  rules = rules.select { |rule| rule['ruleId'].to_s == rule_id_filter } unless rule_id_filter.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Nenhuma regra CRM ativa encontrada para executar.' if rules.empty?

  tenant_docs = if tenant_uid_filter.empty?
                  firestore_list_documents('system_tenants')
                else
                  doc = firestore_get_document('system_tenants', tenant_uid_filter)
                  raise WEBrick::HTTPStatus::BadRequest, 'Conta não encontrada em system_tenants.' unless doc
                  [doc]
                end

  processed = []
  rules.each do |rule|
    tenant_docs.each do |tenant_doc|
      uid = File.basename(tenant_doc['name'].to_s)
      tenant = firestore_fields_to_hash(tenant_doc['fields'] || {})
      tenant['id'] = uid
      tenant['uid'] = uid
      tenant['tenantUid'] = uid
      matched = crm_rule_matches?(tenant, rule)
      unless matched
        firestore_upsert_document('system_crm_tag_logs', SecureRandom.uuid, {
          'ruleId' => rule['ruleId'],
          'tenantUid' => uid,
          'action' => 'skipped',
          'matched' => false,
          'reason' => 'conditions_not_matched'
        }) unless tenant_uid_filter.empty? || rule_id_filter.empty?
        processed << { 'tenantUid' => uid, 'ruleId' => rule['ruleId'], 'matched' => false, 'actions' => [] }
        next
      end

      actions = normalize_crm_rule_items(rule['actions']).map do |action|
        apply_crm_rule_action_to_tenant!(uid, action, rule['ruleId'], added_by)
      end
      processed << { 'tenantUid' => uid, 'ruleId' => rule['ruleId'], 'matched' => true, 'actions' => actions }
    end
  end

  { 'processed' => processed }
end

def load_email_templates_payload
  ensure_email_template_defaults!
  docs = firestore_list_documents('system_email_templates')
  saved_templates = docs.map do |doc|
    key = doc['name'].to_s.split('/').last.to_s
    firestore_fields_to_hash(doc['fields'] || {}).merge('key' => key)
  end
  by_key = {}
  default_email_templates.each do |template|
    key = template['key'].to_s
    by_key[key] = template if !key.empty?
  end
  saved_templates.each do |template|
    key = template['key'].to_s
    by_key[key] = (by_key[key] || {}).merge(template) if !key.empty?
  end
  templates = by_key.values
  templates.sort_by { |tpl| tpl['name'].to_s.downcase }
end

def save_email_template_payload!(body)
  key = body['key'].to_s.strip
  raise WEBrick::HTTPStatus::BadRequest, 'Template inválido.' if key.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Nome e assunto são obrigatórios.' if body['name'].to_s.strip.empty? || body['subject'].to_s.strip.empty?
  existing_doc = firestore_get_document('system_email_templates', key)
  existing = existing_doc ? firestore_fields_to_hash(existing_doc['fields'] || {}) : {}
  default = default_email_templates.find { |template| template['key'].to_s == key } || {}
  available_variables = Array(body.key?('availableVariables') ? body['availableVariables'] : (existing['availableVariables'] || default['availableVariables']))
  cta_url = body['ctaUrl'].to_s.strip
  cta_url = '{{resetPasswordUrl}}' if cta_url.empty? && key == 'password_reset'
  cta_url = default['ctaUrl'].to_s if cta_url.empty? && !default['ctaUrl'].to_s.empty?

  payload = {
    'key' => key,
    'name' => body['name'].to_s.strip,
    'description' => body['description'].to_s,
    'subject' => body['subject'].to_s,
    'preheader' => body['preheader'].to_s,
    'body' => body['body'].to_s,
    'html' => body['html'].to_s.empty? ? body['body'].to_s : body['html'].to_s,
    'ctaLabel' => body['ctaLabel'].to_s,
    'ctaUrl' => cta_url,
    'footerReason' => body['footerReason'].to_s,
    'enabled' => body['enabled'] != false,
    'availableVariables' => available_variables
  }
  firestore_upsert_document('system_email_templates', key, payload)
  payload
end

def load_email_logs_payload
  docs = firestore_list_documents('email_logs')
  logs = docs.map do |doc|
    id = doc['name'].to_s.split('/').last.to_s
    firestore_fields_to_hash(doc['fields'] || {}).merge('id' => id)
  end
  logs.sort_by { |log| log['createdAt'].to_s }.reverse.first(30)
end

def load_email_template_for_test(template_key)
  key = template_key.to_s.strip.empty? ? 'test_email' : template_key.to_s.strip
  doc = firestore_get_document('system_email_templates', key)
  if !doc && key == 'test_email'
    firestore_upsert_document('system_email_templates', 'test_email', default_test_email_template)
    doc = firestore_get_document('system_email_templates', 'test_email')
  end
  raise WEBrick::HTTPStatus::NotFound, 'Template não encontrado.' unless doc
  firestore_fields_to_hash(doc['fields'] || {}).merge('key' => key)
end

def build_test_email_layout(settings, template, variables)
  brand_name = variables['brandName'].to_s.empty? ? 'BocaFood' : variables['brandName'].to_s
  support_email = variables['supportEmail'].to_s
  logo_url = normalize_bocafood_brand_logo_url(variables['brandLogoUrl'])
  terms_url = variables['termsUrl'].to_s
  privacy_url = variables['privacyUrl'].to_s
  security_text = email_replace_variables(variables['securityText'].to_s.empty? ? 'o BocaFood nunca solicita senha por e-mail.' : variables['securityText'].to_s, variables)
  reason_source = template['footerReason'].to_s.strip.empty? ? variables['footerReasonDefault'].to_s : template['footerReason'].to_s
  email_reason = email_replace_variables(reason_source.empty? ? 'esta mensagem faz parte do seu relacionamento com o BocaFood' : reason_source, variables)
  title = CGI.escapeHTML(email_replace_variables(template['subject'] || 'Teste de envio BocaFood', variables))
  preheader = CGI.escapeHTML(email_replace_variables(template['preheader'] || '', variables))
  body = email_replace_variables(template['body'] || template['html'] || default_test_email_template['body'], variables)
  cta_label = CGI.escapeHTML(email_replace_variables(template['ctaLabel'] || '', variables))
  cta_url = CGI.escapeHTML(email_replace_variables(template['ctaUrl'] || '', variables))
  cta_html = cta_label.empty? || cta_url.empty? ? '' : %Q(<div style="margin-top:20px;text-align:left;"><a href="#{cta_url}" style="display:inline-block;background:linear-gradient(135deg,#C4362A 0%,#A92F25 100%);color:#ffffff;text-decoration:none;border-radius:12px;padding:0 19px;height:44px;line-height:44px;font-size:14px;font-weight:700;min-width:158px;text-align:center;border:1px solid rgba(126,31,24,.16);box-shadow:0 10px 20px rgba(196,54,42,.14),inset 0 1px 0 rgba(255,255,255,.20);">#{cta_label}</a></div>)
  terms_link = terms_url.empty? ? 'Termos de uso' : %Q(<a href="#{CGI.escapeHTML(terms_url)}" style="color:#8A7E7C;text-decoration:none;">Termos de uso</a>)
  privacy_link = privacy_url.empty? ? 'Política de privacidade' : %Q(<a href="#{CGI.escapeHTML(privacy_url)}" style="color:#8A7E7C;text-decoration:none;">Política de privacidade</a>)
  footer_html = %Q(<div style="font-size:11px;line-height:1.55;color:#8A7E7C;"><strong style="font-weight:700;color:#5F5552;">Segurança:</strong> #{CGI.escapeHTML(security_text)}<br>Precisa de ajuda? Escreva para <a href="mailto:#{CGI.escapeHTML(support_email)}" style="color:#B42318;text-decoration:none;font-weight:700;">#{CGI.escapeHTML(support_email)}</a><br>Você recebeu este e-mail porque #{CGI.escapeHTML(email_reason)}.<br>#{CGI.escapeHTML(brand_name)}<br>#{terms_link} &middot; #{privacy_link}</div>)

  %Q(<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>#{title}</title></head><body style="margin:0;padding:0;background:#FAF8F4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Arial,sans-serif;color:#1F1F1F;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">#{preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:radial-gradient(circle at 12% 0%,rgba(196,54,42,.085),transparent 30%),linear-gradient(135deg,#FFFCFB 0%,#FAF8F4 55%,#FFF8F6 100%);padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:linear-gradient(145deg,#FFFFFF 0%,#FFFDFB 42%,#FFF8F6 78%,#FAF8F4 100%);border-radius:20px;box-shadow:0 20px 44px rgba(63,38,35,.085),0 2px 8px rgba(31,31,31,.035);overflow:hidden;border:1px solid #EDE6E3;"><tr><td style="height:4px;background:linear-gradient(90deg,#B42318,#B6925E);font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:18px 28px 13px;text-align:left;border-bottom:1px solid rgba(242,237,237,.75);"><img src="#{CGI.escapeHTML(logo_url)}" alt="#{CGI.escapeHTML(brand_name)}" width="76" style="display:block;width:76px;max-width:34%;height:auto;border:0;outline:none;text-decoration:none;"></td></tr><tr><td style="padding:20px 28px 0;text-align:left;"><div style="font-size:23px;line-height:1.25;font-weight:700;color:#191514;">#{title}</div>#{preheader.empty? ? '' : %Q(<div style="margin-top:8px;max-width:500px;font-size:14.5px;line-height:1.55;color:#6B615F;">#{preheader}</div>)}<div style="margin-top:18px;font-size:15.5px;line-height:1.68;color:#3F3430;">#{body}#{cta_html}</div><div style="margin-top:18px;color:#756966;font-size:11.5px;line-height:1.5;"><strong>Segurança:</strong> #{CGI.escapeHTML(security_text)}</div></td></tr><tr><td style="padding:18px 28px 28px;background:linear-gradient(135deg,#FFFFFF 0%,#FFF8F6 62%,#FDF1EF 100%);border-top:1px solid rgba(242,237,237,.82);">#{footer_html}</td></tr></table></td></tr></table></body></html>)
end

def encoded_email_subject(value)
  "=?UTF-8?B?#{Base64.strict_encode64(value.to_s)}?="
end

def clean_email_header(value)
  value.to_s.gsub(/[\r\n]+/, ' ').strip
end

def smtp_close_warning_error?(error)
  msg = error.message.to_s
  return true if error.is_a?(EOFError)
  return true if msg.match?(/SSL_read.*Connection reset by peer/i)
  return true if msg.match?(/connection reset.*(after DATA|closing|quit|peer)/i)
  return true if msg.match?(/end of file reached/i)
  false
end

def send_html_email_via_smtp!(settings, password, to, subject, html)
  host = settings['smtpHost'].to_s.strip
  port = settings['smtpPort'].to_i
  secure = normalize_smtp_secure(settings['smtpSecure'])
  user = settings['smtpUser'].to_s.strip
  from_email = settings['fromEmail'].to_s.strip
  from_name = settings['fromName'].to_s.strip.empty? ? settings['brandName'].to_s.strip : settings['fromName'].to_s.strip
  reply_to = settings['replyTo'].to_s.strip

  raise WEBrick::HTTPStatus::BadRequest, 'Configuração SMTP não encontrada.' if host.empty? || port <= 0 || from_email.empty? || user.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Senha SMTP não configurada.' if password.to_s.empty?
  raise WEBrick::HTTPStatus::BadRequest, 'Remetente inválido.' unless valid_email_address?(from_email)
  raise WEBrick::HTTPStatus::BadRequest, 'Destinatário inválido.' unless valid_email_address?(to)

  boundary = "bocafood-#{SecureRandom.hex(12)}"
  headers = []
  headers << %(From: #{encoded_email_subject(clean_email_header(from_name))} <#{from_email}>)
  headers << %(To: <#{to}>)
  headers << %(Reply-To: <#{reply_to}>) if valid_email_address?(reply_to)
  headers << %(Subject: #{encoded_email_subject(subject)})
  headers << 'MIME-Version: 1.0'
  headers << %(Content-Type: multipart/alternative; boundary="#{boundary}")
  headers << 'X-BocaFood-Origin: master-email-test'
  message = headers.join("\r\n") +
    "\r\n\r\n--#{boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n#{html}\r\n--#{boundary}--\r\n"

  smtp = Net::SMTP.new(host, port)
  smtp.open_timeout = 15
  smtp.read_timeout = 20
  ssl_context = OpenSSL::SSL::SSLContext.new
  ssl_context.verify_mode = OpenSSL::SSL::VERIFY_NONE
  smtp.enable_ssl(ssl_context) if secure == 'ssl'
  smtp.enable_starttls_auto(ssl_context) if secure == 'tls'

  sent = false
  close_warning = nil
  begin
    smtp.start('localhost', user, password.to_s, :plain)
    smtp.send_message(message, from_email, to)
    sent = true
  rescue => e
    if sent && smtp_close_warning_error?(e)
      close_warning = e
      log_email_test("warning apos envio SMTP class=#{e.class} message=#{e.message}")
    else
      raise
    end
  ensure
    if smtp&.started?
      begin
        smtp.finish
      rescue => e
        if sent && smtp_close_warning_error?(e)
          close_warning ||= e
          log_email_test("warning ao fechar SMTP class=#{e.class} message=#{e.message}")
        else
          raise
        end
      end
    end
  end

  {
    sent: sent,
    closeWarning: close_warning ? "#{close_warning.class}: #{close_warning.message}" : nil
  }
end

def log_email_test_result(to:, template_key:, subject:, status:, error: nil)
  firestore_upsert_document('email_logs', SecureRandom.uuid, {
    'to' => to,
    'templateKey' => template_key,
    'subject' => subject.to_s,
    'status' => status,
    'origin' => 'teste',
    'error' => error.to_s,
    'createdAt' => Time.now.utc.iso8601
  })
rescue => e
  log_email_test("erro ao registrar email_logs #{email_send_debug(e)}")
end

def send_test_email!(body)
  to = body['to'].to_s.strip.downcase
  template_key = body['templateKey'].to_s.strip.empty? ? 'test_email' : body['templateKey'].to_s.strip
  raise WEBrick::HTTPStatus::BadRequest, 'Destinatário inválido.' unless valid_email_address?(to)

  settings_doc = firestore_get_document('system_email_settings', 'default')
  log_email_test("settings encontrados=#{!!settings_doc}")
  raise WEBrick::HTTPStatus::BadRequest, 'Configuração SMTP não encontrada.' unless settings_doc
  settings = firestore_fields_to_hash(settings_doc['fields'] || {})

  secret_doc = firestore_get_document('system_private_email_secrets', 'default')
  log_email_test("secret SMTP encontrado=#{!!secret_doc}")
  secret = secret_doc ? firestore_fields_to_hash(secret_doc['fields'] || {}) : {}
  password = secret['smtpPassword'].to_s
  raise WEBrick::HTTPStatus::BadRequest, 'Senha SMTP não configurada.' if password.empty?

  template = load_email_template_for_test(template_key)
  raise WEBrick::HTTPStatus::BadRequest, 'Template desativado.' if template['enabled'] == false
  log_email_test("template carregado key=#{template_key}")

  variables = {
    'buyerName' => 'Patrícia',
    'buyerEmail' => to,
    'signupUrl' => 'https://app.bocafood.com/cadastro',
    'supportEmail' => settings['supportEmail'].to_s.empty? ? settings['replyTo'].to_s : settings['supportEmail'].to_s,
    'planName' => 'Plano Essencial',
    'productName' => 'BocaFood',
    'resetPasswordUrl' => 'https://app.bocafood.com/redefinir-senha',
    'appBaseUrl' => settings['appBaseUrl'].to_s.empty? ? 'https://app.bocafood.com' : settings['appBaseUrl'].to_s,
    'brandName' => settings['brandName'].to_s.empty? ? 'BocaFood' : settings['brandName'].to_s,
    'brandLogoUrl' => normalize_bocafood_brand_logo_url(settings['brandLogoUrl']),
    'termsUrl' => settings['termsUrl'].to_s,
    'privacyUrl' => settings['privacyUrl'].to_s,
    'securityText' => settings['securityText'].to_s.empty? ? 'o BocaFood nunca solicita senha por e-mail.' : settings['securityText'].to_s,
    'footerReasonDefault' => settings['footerReasonDefault'].to_s.empty? ? 'esta mensagem faz parte do seu relacionamento com o BocaFood' : settings['footerReasonDefault'].to_s
  }
  subject = email_replace_variables(template['subject'] || 'Teste de envio BocaFood', variables)
  html = build_test_email_layout(settings, template, variables)
  smtp_result = send_html_email_via_smtp!(settings, password, to, subject, html)
  status = smtp_result[:closeWarning] ? 'warning' : 'success'
  log_email_test_result(to: to, template_key: template_key, subject: subject, status: status, error: smtp_result[:closeWarning])

  {
    ok: true,
    message: 'E-mail de teste enviado com sucesso.'
  }
rescue => e
  begin
    log_email_test_result(to: body['to'].to_s.strip.downcase, template_key: body['templateKey'].to_s.strip.empty? ? 'test_email' : body['templateKey'].to_s.strip, subject: '', status: 'error', error: e.message)
  rescue
  end
  raise
end

def local_master_request?(req)
  host = req.host.to_s
  host == '127.0.0.1' || host == 'localhost' || host == '::1'
end

def public_store_slug(value)
  value.to_s.downcase.unicode_normalize(:nfkd).encode('ASCII', replace: '', undef: :replace, invalid: :replace)
       .gsub(/[^a-z0-9]+/, '-').gsub(/\A-+|-+\z/, '').gsub(/-{2,}/, '-')
end

def public_store_url(slug)
  slug.to_s.empty? ? '' : "https://bocafood.app/loja/#{slug}"
end

def public_store_name(tenant)
  name = tenant['businessName'].to_s.strip
  name.empty? ? tenant['name'].to_s.strip : name
end

def ensure_unique_public_slug!(store, slug, tenant_id)
  duplicate = (store['tenants'] || []).find do |tenant|
    tenant['id'].to_s != tenant_id.to_s && public_store_slug(tenant['slug']) == slug
  end
  raise WEBrick::HTTPStatus::BadRequest, 'Slug público já está em uso por outra loja.' if duplicate

  public_doc = firestore_get_document('public_stores', slug)
  return unless public_doc

  data = firestore_fields_to_hash(public_doc['fields'] || {})
  owner = data['tenantId'].to_s.strip
  raise WEBrick::HTTPStatus::BadRequest, 'Slug público já está cadastrado no Firebase.' if !owner.empty? && owner != tenant_id.to_s
end

def sync_public_store!(tenant, previous_slug = '')
  slug = public_store_slug(tenant['slug'])
  raise WEBrick::HTTPStatus::BadRequest, 'Slug público obrigatório' if slug.empty?

  old_slug = public_store_slug(previous_slug)
  firestore_delete_document('public_stores', old_slug) if !old_slug.empty? && old_slug != slug
  existing = firestore_get_document('public_stores', slug)
  created_at = existing ? firestore_value_to_ruby(existing.dig('fields', 'createdAt')) : Time.now.utc.iso8601

  firestore_replace_document('public_stores', slug, {
    'tenantId' => tenant['id'].to_s.strip,
    'slug' => slug,
    'storeName' => public_store_name(tenant),
    'status' => tenant['status'].to_s.strip.empty? ? 'active' : tenant['status'].to_s.strip,
    'publicUrl' => public_store_url(slug),
    'createdAt' => created_at,
    'updatedAt' => Time.now.utc.iso8601
  })
end

def billing_provider_from_hash(tenant)
  tenant ||= {}
  billing = tenant['billing'].is_a?(Hash) ? tenant['billing'] : {}
  provider = billing['provider'].to_s.strip
  return provider unless provider.empty?
  return 'hotmart' if !billing['hotmartSubscriberCode'].to_s.strip.empty? || !billing['hotmartTransaction'].to_s.strip.empty? || !billing['hotmartOfferCode'].to_s.strip.empty? || !tenant['hotmartSubscriberCode'].to_s.strip.empty? || !tenant['hotmartTransaction'].to_s.strip.empty? || !tenant['hotmartOfferCode'].to_s.strip.empty?
  origin = tenant['origin'].to_s.strip.empty? ? tenant['source'].to_s.strip : tenant['origin'].to_s.strip
  return 'manual' if %w[manual master master_local].include?(origin)
  'none'
end

def billing_plan_slug_value(billing, tenant)
  value = billing['planSlug'].to_s.strip
  value = tenant['plan'].to_s.strip if value.empty?
  value == 'starter' ? 'essencial' : value
end

def billing_cycle_value(billing, tenant)
  value = billing['billingCycle'].to_s.strip
  value = tenant['billingCycle'].to_s.strip if value.empty?
  value = billing['cycle'].to_s.strip if value.empty?
  value
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
	  store_body = body['store'].is_a?(Hash) ? body['store'] : {}
	  account_address_body = body['accountAddress'].is_a?(Hash) ? body['accountAddress'] : {}
	  billing_body = body['billing'].is_a?(Hash) ? body['billing'] : {}
	  auth_body = body['auth'].is_a?(Hash) ? body['auth'] : {}
	  seo_body = body['seo'].is_a?(Hash) ? body['seo'] : {}
	  support_mode = body['supportMode'] == true || existing.empty?
	  keep_unless_support = ->(new_value, old_value) { support_mode ? new_value : old_value }
	  existing_store = existing['store'].is_a?(Hash) ? existing['store'] : {}
	  existing_store_address = existing_store['address'].is_a?(Hash) ? existing_store['address'] : {}
	  existing_account_address = existing['accountAddress'].is_a?(Hash) ? existing['accountAddress'] : {}
	  slug = public_store_slug(body['slug'].to_s.strip.empty? ? existing['slug'].to_s.strip : body['slug'])
	  public_url = slug.empty? ? '' : public_store_url(slug)
  plan_slug = billing_body['planSlug'].to_s.strip.empty? ? (body['plan'].to_s.strip.empty? ? 'essencial' : body['plan'].to_s.strip) : billing_body['planSlug'].to_s.strip
  plan_slug = 'essencial' if plan_slug == 'starter'
  billing_cycle_body = billing_body['billingCycle'].to_s.strip
  billing_cycle_body = billing_body['cycle'].to_s.strip if billing_cycle_body.empty?
  billing_cycle_body = body['billingCycle'].to_s.strip if billing_cycle_body.empty?
  billing_cycle_body = 'monthly' if billing_cycle_body.empty?
  account_status = body['accountStatus'].to_s.strip.empty? ? (body['status'].to_s.strip.empty? ? 'pending' : body['status'].to_s.strip) : body['accountStatus'].to_s.strip
  origin = body['origin'].to_s.strip.empty? ? (body['source'].to_s.strip.empty? ? 'manual' : body['source'].to_s.strip) : body['origin'].to_s.strip
  existing_billing = existing['billing'].is_a?(Hash) ? existing['billing'] : {}
  existing_provider = billing_provider_from_hash(existing)
  incoming_provider = billing_body['provider'].to_s.strip.empty? ? (existing.empty? && %w[manual master master_local].include?(origin) ? 'manual' : existing_provider) : billing_body['provider'].to_s.strip
  incoming_provider = 'none' unless %w[none hotmart manual].include?(incoming_provider)
  incoming_provider = existing_provider == 'manual' ? 'manual' : 'none' if incoming_provider == 'hotmart' && existing_provider != 'hotmart'
  manual_override = billing_body['manualOverride'] == true
  hotmart_manual_override = existing_provider == 'hotmart' && incoming_provider == 'manual' && manual_override
  fiscal_country_value = body['fiscalCountry'].to_s.strip
  fiscal_country_value = account_address_body['fiscalCountry'].to_s.strip if fiscal_country_value.empty?
  fiscal_country_value = store_body['fiscalCountry'].to_s.strip if fiscal_country_value.empty?
  fiscal_country_value = existing['fiscalCountry'].to_s.strip if !support_mode && !existing['fiscalCountry'].to_s.strip.empty?
  fiscal_country_value = existing_account_address['fiscalCountry'].to_s.strip if !support_mode && fiscal_country_value.empty? && !existing_account_address['fiscalCountry'].to_s.strip.empty?
  fiscal_country_value = existing_store['fiscalCountry'].to_s.strip if !support_mode && fiscal_country_value.empty? && !existing_store['fiscalCountry'].to_s.strip.empty?
  account_address_hash = {
    'street' => account_address_body['street'].to_s.strip,
    'number' => account_address_body['number'].to_s.strip,
    'complement' => account_address_body['complement'].to_s.strip,
    'neighborhood' => account_address_body['neighborhood'].to_s.strip,
    'city' => account_address_body['city'].to_s.strip,
    'province' => account_address_body['province'].to_s.strip,
    'postalCode' => account_address_body['postalCode'].to_s.strip,
    'country' => account_address_body['country'].to_s.strip.empty? ? body['country'].to_s.strip : account_address_body['country'].to_s.strip,
    'fiscalCountry' => fiscal_country_value,
    'source' => account_address_body['source'].to_s.strip.empty? ? 'setup' : account_address_body['source'].to_s.strip
  }
  account_address_hash = existing_account_address.merge(account_address_hash) if support_mode && !existing_account_address.empty?
  account_address_hash = existing_account_address unless support_mode || existing_account_address.empty?
  store_address_body = store_body['address'].is_a?(Hash) ? store_body['address'] : {}
  store_address_hash = existing_store_address.merge({
    'street' => store_address_body['street'].to_s.strip,
    'number' => store_address_body['number'].to_s.strip,
    'complement' => store_address_body['complement'].to_s.strip,
    'neighborhood' => store_address_body['neighborhood'].to_s.strip,
    'city' => store_address_body['city'].to_s.strip,
    'province' => store_address_body['province'].to_s.strip,
    'postalCode' => store_address_body['postalCode'].to_s.strip,
    'country' => store_address_body['country'].to_s.strip,
    'source' => store_address_body['source'].to_s.strip,
    'updatedAt' => store_address_body['updatedAt'].to_s.strip
  })
  store_address_hash = existing_store_address unless support_mode || existing_store_address.empty?
  store_region = store_body['region'].to_s.strip.empty? ? store_body['province'].to_s.strip : store_body['region'].to_s.strip
  store_hash = {
	    'name' => store_body['name'].to_s.strip.empty? ? body['businessName'].to_s.strip : store_body['name'].to_s.strip,
	    'slug' => slug,
	    'domain' => existing_store['domain'].to_s.strip,
	    'publicUrl' => store_body['publicUrl'].to_s.strip.empty? ? public_url : store_body['publicUrl'].to_s.strip,
	    'city' => store_body['city'].to_s.strip,
    'region' => store_region,
    'province' => store_body['province'].to_s.strip.empty? ? store_region : store_body['province'].to_s.strip,
    'country' => store_body['country'].to_s.strip.empty? ? body['country'].to_s.strip : store_body['country'].to_s.strip,
    'fiscalCountry' => fiscal_country_value,
    'language' => store_body['language'].to_s.strip.empty? ? body['language'].to_s.strip : store_body['language'].to_s.strip,
    'status' => store_body['status'].to_s.strip.empty? ? 'draft' : store_body['status'].to_s.strip,
    'postalCode' => store_body['postalCode'].to_s.strip,
    'address' => store_address_hash,
    'locationSource' => store_body['locationSource'].to_s.strip.empty? ? existing_store['locationSource'].to_s.strip : store_body['locationSource'].to_s.strip,
    'deliveryArea' => store_body['deliveryArea'].is_a?(Hash) ? store_body['deliveryArea'] : (existing_store['deliveryArea'].is_a?(Hash) ? existing_store['deliveryArea'] : {}),
    'social' => store_body['social'].is_a?(Hash) ? store_body['social'] : (existing_store['social'].is_a?(Hash) ? existing_store['social'] : {}),
    'publishedAt' => store_body['publishedAt'].to_s.strip,
    'lastPublishedAt' => store_body['lastPublishedAt'].to_s.strip,
    'unpublishedAt' => store_body['unpublishedAt'].to_s.strip,
    'lastPublicationError' => store_body['lastPublicationError'].to_s.strip
  }
  billing_hash = {
    'provider' => incoming_provider,
    'status' => billing_body['status'].to_s.strip.empty? ? (incoming_provider == 'manual' && account_status == 'active' ? 'active' : 'inactive') : billing_body['status'].to_s.strip,
    'planSlug' => incoming_provider == 'manual' ? plan_slug : '',
    'billingCycle' => incoming_provider == 'manual' ? billing_cycle_body : '',
    'trialEndsAt' => incoming_provider == 'manual' ? billing_body['trialEndsAt'].to_s.strip : '',
    'activatedAt' => incoming_provider == 'manual' ? billing_body['activatedAt'].to_s.strip : '',
    'canceledAt' => incoming_provider == 'manual' ? billing_body['canceledAt'].to_s.strip : '',
	    'hotmartSubscriberCode' => billing_body['hotmartSubscriberCode'].to_s.strip,
	    'hotmartTransaction' => billing_body['hotmartTransaction'].to_s.strip,
	    'hotmartProductId' => billing_body['hotmartProductId'].to_s.strip,
	    'hotmartOfferCode' => billing_body['hotmartOfferCode'].to_s.strip,
	    'purchaseStatus' => billing_body['purchaseStatus'].to_s.strip,
	    'subscriptionStatus' => billing_body['subscriptionStatus'].to_s.strip,
	    'lastHotmartEventAt' => billing_body['lastHotmartEventAt'].to_s.strip
	  }
	  auth_hash = {
	    'uid' => auth_body['uid'].to_s.strip.empty? ? final_id : auth_body['uid'].to_s.strip,
	    'emailVerified' => auth_body['emailVerified'] == true,
	    'lastLoginAt' => auth_body['lastLoginAt'].to_s.strip
	  }
	  existing_auth = existing['auth'].is_a?(Hash) ? existing['auth'] : {}
	  if existing_provider == 'hotmart' && !hotmart_manual_override
	    billing_hash['provider'] = 'hotmart'
	    billing_hash['status'] = existing_billing['status'].to_s.strip.empty? ? existing['billingStatus'].to_s : existing_billing['status'].to_s
	    billing_hash['planSlug'] = billing_plan_slug_value(existing_billing, existing)
	    billing_hash['billingCycle'] = billing_cycle_value(existing_billing, existing)
	    billing_hash['trialEndsAt'] = existing_billing['trialEndsAt'].to_s.strip.empty? ? existing['trialEndsAt'].to_s : existing_billing['trialEndsAt'].to_s
	    billing_hash['activatedAt'] = existing_billing['activatedAt'].to_s.strip.empty? ? existing['activatedAt'].to_s : existing_billing['activatedAt'].to_s
	    billing_hash['canceledAt'] = existing_billing['canceledAt'].to_s.strip.empty? ? existing['canceledAt'].to_s : existing_billing['canceledAt'].to_s
	  elsif incoming_provider == 'none'
	    %w[status planSlug billingCycle trialEndsAt activatedAt canceledAt].each { |key| billing_hash[key] = '' }
	    billing_hash['status'] = 'inactive'
	  elsif hotmart_manual_override
	    billing_hash['metadata'] = existing_billing['metadata'].is_a?(Hash) ? existing_billing['metadata'].merge('manualOverride' => true) : { 'manualOverride' => true }
	  end
	  unless support_mode
	    store_hash['name'] = existing_store['name'].to_s unless existing_store['name'].to_s.strip.empty?
	    store_hash['domain'] = existing_store['domain'].to_s unless existing_store['domain'].to_s.strip.empty?
	    store_hash['city'] = existing_store['city'].to_s unless existing_store['city'].to_s.strip.empty?
	    store_hash['region'] = existing_store['region'].to_s unless existing_store['region'].to_s.strip.empty?
	    store_hash['province'] = existing_store['province'].to_s unless existing_store['province'].to_s.strip.empty?
	    store_hash['country'] = existing_store['country'].to_s unless existing_store['country'].to_s.strip.empty?
	    store_hash['language'] = existing_store['language'].to_s unless existing_store['language'].to_s.strip.empty?
	    store_hash['status'] = existing_store['status'].to_s unless existing_store['status'].to_s.strip.empty?
	  end
	  %w[postalCode publishedAt lastPublishedAt unpublishedAt lastPublicationError].each do |key|
	    store_hash[key] = existing_store[key].to_s unless existing_store[key].to_s.strip.empty?
	  end
	  store_hash['address'] = existing_store['address'] if existing_store['address'].is_a?(Hash) && !existing_store['address'].empty?
	  store_hash['locationSource'] = existing_store['locationSource'].to_s unless existing_store['locationSource'].to_s.strip.empty?
	  store_hash['deliveryArea'] = existing_store['deliveryArea'] if existing_store['deliveryArea'].is_a?(Hash) && !existing_store['deliveryArea'].empty?
	  %w[hotmartSubscriberCode hotmartTransaction hotmartProductId hotmartOfferCode purchaseStatus subscriptionStatus lastHotmartEventAt].each do |key|
	    billing_hash[key] = existing_billing[key].to_s unless existing_billing[key].to_s.strip.empty?
	  end
	  auth_hash['uid'] = existing_auth['uid'].to_s unless existing_auth['uid'].to_s.strip.empty?
	  auth_hash['emailVerified'] = existing_auth['emailVerified'] == true if existing_auth.key?('emailVerified')
	  auth_hash['lastLoginAt'] = existing_auth['lastLoginAt'].to_s unless existing_auth['lastLoginAt'].to_s.strip.empty?
	  seo_hash = {
	    'allowIndexing' => seo_body.key?('allowIndexing') ? seo_body['allowIndexing'] == true : true,
	    'metaRobots' => %w[index,follow noindex,nofollow noindex,follow].include?(seo_body['metaRobots'].to_s.strip) ? seo_body['metaRobots'].to_s.strip : 'index,follow',
	    'schemaType' => seo_body['schemaType'].to_s.strip.empty? ? 'FoodEstablishment' : seo_body['schemaType'].to_s.strip,
	    'schemaCategory' => seo_body['schemaCategory'].to_s.strip.empty? ? 'Restaurant / FastFoodRestaurant' : seo_body['schemaCategory'].to_s.strip,
	    'sitemapEnabled' => seo_body.key?('sitemapEnabled') ? seo_body['sitemapEnabled'] == true : true,
	    'robotsEnabled' => seo_body.key?('robotsEnabled') ? seo_body['robotsEnabled'] == true : true,
	    'searchConsoleLinked' => seo_body['searchConsoleLinked'] == true,
	    'lastSeoPublishedAt' => seo_body['lastSeoPublishedAt'].to_s.strip
	  }

  existing.merge({
	    'id' => final_id,
	    'fullName' => keep_unless_support.call(body['fullName'].to_s.strip, existing['fullName'].to_s.strip),
	    'name' => body['name'].to_s.strip,
	    'email' => keep_unless_support.call(body['email'].to_s.strip, existing['email'].to_s.strip),
	    'ownerName' => keep_unless_support.call(body['fullName'].to_s.strip.empty? ? body['ownerName'].to_s.strip : body['fullName'].to_s.strip, existing['ownerName'].to_s.strip),
	    'responsibleName' => keep_unless_support.call(body['ownerName'].to_s.strip, existing['responsibleName'].to_s.strip),
	    'phone' => keep_unless_support.call(body['phone'].to_s.strip, existing['phone'].to_s.strip),
	    'phoneCountryCode' => keep_unless_support.call(body['phoneCountryCode'].to_s.strip, existing['phoneCountryCode'].to_s.strip),
	    'phoneNumber' => keep_unless_support.call(body['phoneNumber'].to_s.strip, existing['phoneNumber'].to_s.strip),
	    'phoneFull' => keep_unless_support.call(body['phoneFull'].to_s.strip.empty? ? body['phone'].to_s.strip : body['phoneFull'].to_s.strip, existing['phoneFull'].to_s.strip),
	    'whatsapp' => keep_unless_support.call((body.key?('whatsapp') ? body['whatsapp'].to_s.strip : existing['whatsapp'].to_s), existing['whatsapp'].to_s.strip),
	    'whatsappCountryCode' => keep_unless_support.call(body['whatsappCountryCode'].to_s.strip, existing['whatsappCountryCode'].to_s.strip),
	    'whatsappNumber' => keep_unless_support.call(body['whatsappNumber'].to_s.strip, existing['whatsappNumber'].to_s.strip),
	    'whatsappFull' => keep_unless_support.call(body['whatsappFull'].to_s.strip.empty? ? body['whatsapp'].to_s.strip : body['whatsappFull'].to_s.strip, existing['whatsappFull'].to_s.strip),
	    'country' => keep_unless_support.call(body['country'].to_s.strip, existing['country'].to_s.strip),
	    'language' => keep_unless_support.call(body['language'].to_s.strip, existing['language'].to_s.strip),
    'businessName' => body['businessName'].to_s.strip,
	    'document' => keep_unless_support.call(body['document'].to_s.strip, existing['document'].to_s.strip),
    'plan' => billing_hash['provider'] == 'none' ? '' : billing_plan_slug_value(billing_hash, { 'plan' => plan_slug }),
    'status' => account_status,
    'accountStatus' => account_status,
    'role' => role,
    'fiscalCountry' => fiscal_country_value,
    'domain' => store_hash['domain'],
    'slug' => slug,
    'publicUrl' => public_url,
    'storeUrl' => body['storeUrl'].to_s.strip.empty? ? public_url : body['storeUrl'].to_s.strip,
    'adminUrl' => body.key?('adminUrl') ? body['adminUrl'].to_s.strip : (existing['adminUrl'].to_s.strip.empty? ? 'admin.html' : existing['adminUrl'].to_s.strip),
    'seedFile' => body.key?('seedFile') ? body['seedFile'].to_s.strip : existing['seedFile'].to_s.strip,
    'source' => origin,
    'origin' => origin,
    'accountAddress' => account_address_hash,
    'store' => store_hash,
    'billing' => billing_hash,
    'billingStatus' => billing_hash['status'],
    'billingCycle' => billing_hash['billingCycle'],
    'trialEndsAt' => billing_hash['trialEndsAt'],
    'activatedAt' => billing_hash['activatedAt'],
    'canceledAt' => billing_hash['canceledAt'],
	    'auth' => auth_hash,
	    'seo' => seo_hash,
    'emailVerified' => auth_hash['emailVerified'],
    'lastLoginAt' => auth_hash['lastLoginAt'],
    'notes' => body['notes'].to_s.strip,
    'githubRepo' => body.key?('githubRepo') ? body['githubRepo'].to_s.strip : existing['githubRepo'].to_s.strip,
    'githubBranch' => body.key?('githubBranch') ? (body['githubBranch'].to_s.strip.empty? ? 'main' : body['githubBranch'].to_s.strip) : (existing['githubBranch'].to_s.strip.empty? ? 'main' : existing['githubBranch'].to_s.strip),
    'githubToken' => github_token,
    'publicFile' => body.key?('publicFile') ? (body['publicFile'].to_s.strip.empty? ? 'index.html' : body['publicFile'].to_s.strip) : (existing['publicFile'].to_s.strip.empty? ? 'index.html' : existing['publicFile'].to_s.strip),
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
  return 'store_owner' if r == 'owner'
  return 'store_staff' if r == 'admin' || r == 'support'
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

def firestore_replace_document(collection_id, doc_id, fields)
  body = {
    'name' => "projects/#{firebase_project_id}/databases/(default)/documents/#{collection_id}/#{doc_id}",
    'fields' => firestore_fields_from_hash(fields)
  }
  url = "https://firestore.googleapis.com/v1/projects/#{firebase_project_id}/databases/(default)/documents/#{collection_id}/#{doc_id}"
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
  disabled = %w[disabled blocked canceled].include?(tenant['status'].to_s.strip)
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
    'plan' => existing['plan'].to_s.strip.empty? || existing['plan'].to_s.strip == 'starter' ? 'essencial' : existing['plan'].to_s.strip,
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
  status = tenant['accountStatus'].to_s.strip.empty? ? (tenant['status'].to_s.strip.empty? ? 'active' : tenant['status'].to_s.strip) : tenant['accountStatus'].to_s.strip
  should_write = force || (status == 'active' && firebase_role_authorized_for_admin?(role))
  return { 'ok' => false, 'skipped' => true, 'reason' => 'user_not_authorized' } unless should_write
  store_hash = tenant['store'].is_a?(Hash) ? tenant['store'] : {}
  account_address_hash = tenant['accountAddress'].is_a?(Hash) ? tenant['accountAddress'] : {}
  billing_hash = tenant['billing'].is_a?(Hash) ? tenant['billing'] : {}
  auth_hash = tenant['auth'].is_a?(Hash) ? tenant['auth'] : {}
  seo_hash = tenant['seo'].is_a?(Hash) ? tenant['seo'] : {}
  plan_slug = billing_hash['planSlug'].to_s.strip.empty? ? (tenant['plan'].to_s.strip.empty? ? 'essencial' : tenant['plan'].to_s.strip) : billing_hash['planSlug'].to_s.strip
  plan_slug = 'essencial' if plan_slug == 'starter'
  billing_cycle = billing_hash['billingCycle'].to_s.strip
  billing_cycle = tenant['billingCycle'].to_s.strip if billing_cycle.empty?
  billing_cycle = billing_hash['cycle'].to_s.strip if billing_cycle.empty?
  slug = store_hash['slug'].to_s.strip.empty? ? tenant['slug'].to_s.strip : store_hash['slug'].to_s.strip
  domain = store_hash['domain'].to_s.strip.empty? ? tenant['domain'].to_s.strip : store_hash['domain'].to_s.strip
  public_url = store_hash['publicUrl'].to_s.strip
  public_url = domain.match?(%r{\Ahttps?://}) ? domain : "https://#{domain}" if public_url.empty? && !domain.empty?
  public_url = public_store_url(slug) if public_url.empty?
  fiscal_country = tenant['fiscalCountry'].to_s.strip
  fiscal_country = account_address_hash['fiscalCountry'].to_s.strip if fiscal_country.empty?
  fiscal_country = store_hash['fiscalCountry'].to_s.strip if fiscal_country.empty?

  doc = {
    'ownerName' => tenant['ownerName'].to_s.strip,
    'responsibleName' => tenant['responsibleName'].to_s.strip,
    'email' => tenant['email'].to_s.strip,
    'phone' => tenant['phone'].to_s.strip,
    'phoneCountryCode' => tenant['phoneCountryCode'].to_s.strip,
    'phoneNumber' => tenant['phoneNumber'].to_s.strip,
    'phoneFull' => tenant['phoneFull'].to_s.strip.empty? ? tenant['phone'].to_s.strip : tenant['phoneFull'].to_s.strip,
    'whatsapp' => tenant['whatsapp'].to_s.strip,
    'whatsappCountryCode' => tenant['whatsappCountryCode'].to_s.strip,
    'whatsappNumber' => tenant['whatsappNumber'].to_s.strip,
    'whatsappFull' => tenant['whatsappFull'].to_s.strip.empty? ? tenant['whatsapp'].to_s.strip : tenant['whatsappFull'].to_s.strip,
    'country' => tenant['country'].to_s.strip,
    'language' => tenant['language'].to_s.strip,
    'document' => tenant['document'].to_s.strip,
    'accountAddress' => {
      'street' => account_address_hash['street'].to_s.strip,
      'number' => account_address_hash['number'].to_s.strip,
      'complement' => account_address_hash['complement'].to_s.strip,
      'neighborhood' => account_address_hash['neighborhood'].to_s.strip,
      'city' => account_address_hash['city'].to_s.strip,
      'province' => account_address_hash['province'].to_s.strip,
      'postalCode' => account_address_hash['postalCode'].to_s.strip,
      'country' => account_address_hash['country'].to_s.strip,
      'fiscalCountry' => fiscal_country,
      'source' => account_address_hash['source'].to_s.strip.empty? ? 'setup' : account_address_hash['source'].to_s.strip
    },
    'accountStatus' => status,
    'origin' => tenant['origin'].to_s.strip.empty? ? tenant['source'].to_s.strip : tenant['origin'].to_s.strip,
    'role' => role,
    'notes' => tenant['notes'].to_s.strip,
    'store' => {
      'name' => store_hash['name'].to_s.strip.empty? ? tenant['businessName'].to_s.strip : store_hash['name'].to_s.strip,
      'slug' => slug,
      'domain' => domain,
      'publicUrl' => public_url,
      'city' => store_hash['city'].to_s.strip,
      'region' => store_hash['region'].to_s.strip.empty? ? store_hash['province'].to_s.strip : store_hash['region'].to_s.strip,
      'province' => store_hash['province'].to_s.strip.empty? ? store_hash['region'].to_s.strip : store_hash['province'].to_s.strip,
      'country' => store_hash['country'].to_s.strip.empty? ? tenant['country'].to_s.strip : store_hash['country'].to_s.strip,
      'fiscalCountry' => fiscal_country,
      'language' => store_hash['language'].to_s.strip.empty? ? tenant['language'].to_s.strip : store_hash['language'].to_s.strip,
      'status' => store_hash['status'].to_s.strip.empty? ? 'draft' : store_hash['status'].to_s.strip,
      'postalCode' => store_hash['postalCode'].to_s.strip,
      'address' => store_hash['address'].is_a?(Hash) ? store_hash['address'] : {},
      'locationSource' => store_hash['locationSource'].to_s.strip,
      'deliveryArea' => store_hash['deliveryArea'].is_a?(Hash) ? store_hash['deliveryArea'] : {},
      'social' => store_hash['social'].is_a?(Hash) ? store_hash['social'] : {},
      'publishedAt' => store_hash['publishedAt'].to_s.strip,
      'lastPublishedAt' => store_hash['lastPublishedAt'].to_s.strip,
      'unpublishedAt' => store_hash['unpublishedAt'].to_s.strip,
      'lastPublicationError' => store_hash['lastPublicationError'].to_s.strip
    },
    'billing' => {
      'provider' => billing_hash['provider'].to_s.strip.empty? ? 'none' : billing_hash['provider'].to_s.strip,
      'status' => billing_hash['status'].to_s.strip.empty? ? tenant['billingStatus'].to_s.strip : billing_hash['status'].to_s.strip,
      'planSlug' => plan_slug,
      'billingCycle' => billing_cycle,
      'trialEndsAt' => billing_hash['trialEndsAt'].to_s.strip.empty? ? tenant['trialEndsAt'].to_s.strip : billing_hash['trialEndsAt'].to_s.strip,
      'activatedAt' => billing_hash['activatedAt'].to_s.strip,
      'canceledAt' => billing_hash['canceledAt'].to_s.strip,
      'hotmartSubscriberCode' => billing_hash['hotmartSubscriberCode'].to_s.strip,
      'hotmartTransaction' => billing_hash['hotmartTransaction'].to_s.strip,
      'hotmartProductId' => billing_hash['hotmartProductId'].to_s.strip,
      'hotmartOfferCode' => billing_hash['hotmartOfferCode'].to_s.strip,
      'purchaseStatus' => billing_hash['purchaseStatus'].to_s.strip,
      'subscriptionStatus' => billing_hash['subscriptionStatus'].to_s.strip,
      'lastHotmartEventAt' => billing_hash['lastHotmartEventAt'].to_s.strip
    },
    'auth' => {
      'uid' => auth_hash['uid'].to_s.strip.empty? ? tenant['id'].to_s.strip : auth_hash['uid'].to_s.strip,
      'emailVerified' => auth_hash['emailVerified'] == true || (auth_user && auth_user['emailVerified'] == true),
      'lastLoginAt' => auth_hash['lastLoginAt'].to_s.strip.empty? ? (auth_user && auth_user['lastLoginAt'].to_s) : auth_hash['lastLoginAt'].to_s.strip
    },
    'seo' => {
      'allowIndexing' => seo_hash.key?('allowIndexing') ? seo_hash['allowIndexing'] == true : true,
      'metaRobots' => %w[index,follow noindex,nofollow noindex,follow].include?(seo_hash['metaRobots'].to_s.strip) ? seo_hash['metaRobots'].to_s.strip : 'index,follow',
      'schemaType' => seo_hash['schemaType'].to_s.strip.empty? ? 'FoodEstablishment' : seo_hash['schemaType'].to_s.strip,
      'schemaCategory' => seo_hash['schemaCategory'].to_s.strip.empty? ? 'Restaurant / FastFoodRestaurant' : seo_hash['schemaCategory'].to_s.strip,
      'sitemapEnabled' => seo_hash.key?('sitemapEnabled') ? seo_hash['sitemapEnabled'] == true : (seo_hash['sitemapActive'] != false),
      'robotsEnabled' => seo_hash.key?('robotsEnabled') ? seo_hash['robotsEnabled'] == true : (seo_hash['robotsActive'] != false),
      'searchConsoleLinked' => seo_hash['searchConsoleLinked'] == true,
      'lastSeoPublishedAt' => seo_hash['lastSeoPublishedAt'].to_s.strip.empty? ? seo_hash['lastPublishedAt'].to_s.strip : seo_hash['lastSeoPublishedAt'].to_s.strip
    },
    'fiscalCountry' => fiscal_country,
    'plan' => plan_slug,
    'billingStatus' => billing_hash['status'].to_s.strip.empty? ? tenant['billingStatus'].to_s.strip : billing_hash['status'].to_s.strip,
    'billingCycle' => billing_cycle,
    'trialEndsAt' => billing_hash['trialEndsAt'].to_s.strip.empty? ? tenant['trialEndsAt'].to_s.strip : billing_hash['trialEndsAt'].to_s.strip,
    'activatedAt' => billing_hash['activatedAt'].to_s.strip.empty? ? tenant['activatedAt'].to_s.strip : billing_hash['activatedAt'].to_s.strip,
    'canceledAt' => billing_hash['canceledAt'].to_s.strip.empty? ? tenant['canceledAt'].to_s.strip : billing_hash['canceledAt'].to_s.strip,
    'createdAt' => tenant['createdAt'].to_s.strip,
    'updatedAt' => Time.now.utc.iso8601
  }
  firestore_upsert_document('system_tenants', tenant['id'].to_s.strip, doc)
  auth_uid = ''
  auth_uid = auth_user['uid'].to_s.strip if auth_user.is_a?(Hash)
  auth_uid = auth_hash['uid'].to_s.strip if auth_uid.empty?
  if !auth_uid.empty? && auth_uid != tenant['id'].to_s.strip
    fiscal_country = doc['fiscalCountry'].to_s.strip
    fiscal_country = doc['accountAddress']['fiscalCountry'].to_s.strip if fiscal_country.empty? && doc['accountAddress'].is_a?(Hash)
    fiscal_country = doc['store']['fiscalCountry'].to_s.strip if fiscal_country.empty? && doc['store'].is_a?(Hash)
    firestore_upsert_document('system_tenants', auth_uid, {
      'fiscalCountry' => fiscal_country,
      'accountAddress' => { 'fiscalCountry' => fiscal_country },
      'store' => { 'fiscalCountry' => fiscal_country },
      'masterTenantId' => tenant['id'].to_s.strip,
      'email' => doc['email'].to_s.strip,
      'role' => doc['role'].to_s.strip,
      'accountStatus' => doc['accountStatus'].to_s.strip,
      'updatedAt' => doc['updatedAt'].to_s.strip
    })
    log_master("system_tenants fiscal mirror auth_uid=#{auth_uid} master_tenant=#{tenant['id']} fiscalCountry=#{fiscal_country}")
  end
  mirror_fiscal_country_for_email!(
    email: doc['email'],
    canonical_uid: tenant['id'],
    fiscal_country: doc['fiscalCountry'],
    doc: doc
  )
  { 'ok' => true, 'skipped' => false, 'doc' => doc }
rescue => e
  { 'ok' => false, 'skipped' => false, 'error' => e.message }
end

def tenant_access_change_logs!(before, after)
  before ||= {}
  after ||= {}
  uid = after['id'].to_s.strip.empty? ? after['uid'].to_s.strip : after['id'].to_s.strip
  email = after['email'].to_s.strip
  before_billing = before['billing'].is_a?(Hash) ? before['billing'] : {}
  after_billing = after['billing'].is_a?(Hash) ? after['billing'] : {}
  before_store = before['store'].is_a?(Hash) ? before['store'] : {}
  after_store = after['store'].is_a?(Hash) ? after['store'] : {}
  before_address = before['accountAddress'].is_a?(Hash) ? before['accountAddress'] : {}
  after_address = after['accountAddress'].is_a?(Hash) ? after['accountAddress'] : {}
  changes = [
    ['email_changed', before['email'].to_s.strip, after['email'].to_s.strip, 'E-mail de acesso alterado pelo Master.'],
    ['phone_changed', (before['phoneFull'].to_s.strip.empty? ? before['phone'].to_s.strip : before['phoneFull'].to_s.strip), (after['phoneFull'].to_s.strip.empty? ? after['phone'].to_s.strip : after['phoneFull'].to_s.strip), 'Telefone alterado pelo Master em modo suporte.'],
    ['whatsapp_changed', (before['whatsappFull'].to_s.strip.empty? ? before['whatsapp'].to_s.strip : before['whatsappFull'].to_s.strip), (after['whatsappFull'].to_s.strip.empty? ? after['whatsapp'].to_s.strip : after['whatsappFull'].to_s.strip), 'WhatsApp alterado pelo Master em modo suporte.'],
    ['document_changed', before['document'].to_s.strip, after['document'].to_s.strip, 'Documento alterado pelo Master em modo suporte.'],
    ['account_address_country_changed', before_address['country'].to_s.strip, after_address['country'].to_s.strip, 'País do endereço fiscal/contato alterado pelo Master em modo suporte.'],
    ['account_address_city_changed', before_address['city'].to_s.strip, after_address['city'].to_s.strip, 'Cidade do endereço fiscal/contato alterada pelo Master em modo suporte.'],
    ['account_address_postal_code_changed', before_address['postalCode'].to_s.strip, after_address['postalCode'].to_s.strip, 'Código postal do endereço fiscal/contato alterado pelo Master em modo suporte.'],
    ['domain_changed', (before_store['domain'].to_s.strip.empty? ? before['domain'].to_s.strip : before_store['domain'].to_s.strip), (after_store['domain'].to_s.strip.empty? ? after['domain'].to_s.strip : after_store['domain'].to_s.strip), 'Domínio alterado pelo Master em modo suporte.'],
    ['fiscal_country_changed', (before_address['fiscalCountry'].to_s.strip.empty? ? (before_store['fiscalCountry'].to_s.strip.empty? ? before['fiscalCountry'].to_s.strip : before_store['fiscalCountry'].to_s.strip) : before_address['fiscalCountry'].to_s.strip), (after_address['fiscalCountry'].to_s.strip.empty? ? (after_store['fiscalCountry'].to_s.strip.empty? ? after['fiscalCountry'].to_s.strip : after_store['fiscalCountry'].to_s.strip) : after_address['fiscalCountry'].to_s.strip), 'País fiscal alterado pelo Master em modo suporte.'],
    ['store_status_changed', before_store['status'].to_s.strip, after_store['status'].to_s.strip, 'Status da loja alterado pelo Master.'],
    ['account_status_changed', (before['accountStatus'].to_s.strip.empty? ? before['status'].to_s.strip : before['accountStatus'].to_s.strip), (after['accountStatus'].to_s.strip.empty? ? after['status'].to_s.strip : after['accountStatus'].to_s.strip), 'Status da conta alterado pelo Master.'],
    ['billing_plan_changed', billing_plan_slug_value(before_billing, before), billing_plan_slug_value(after_billing, after), 'Plano alterado pelo Master.'],
    ['billing_cycle_changed', (before_billing['billingCycle'].to_s.strip.empty? ? (before['billingCycle'].to_s.strip.empty? ? before_billing['cycle'].to_s.strip : before['billingCycle'].to_s.strip) : before_billing['billingCycle'].to_s.strip), (after_billing['billingCycle'].to_s.strip.empty? ? (after['billingCycle'].to_s.strip.empty? ? after_billing['cycle'].to_s.strip : after['billingCycle'].to_s.strip) : after_billing['billingCycle'].to_s.strip), 'Ciclo de cobrança alterado pelo Master.'],
    ['billing_provider_changed', before_billing['provider'].to_s.strip, after_billing['provider'].to_s.strip, 'Provedor de cobrança alterado pelo Master.'],
    ['billing_status_changed', (before_billing['status'].to_s.strip.empty? ? before['billingStatus'].to_s.strip : before_billing['status'].to_s.strip), (after_billing['status'].to_s.strip.empty? ? after['billingStatus'].to_s.strip : after_billing['status'].to_s.strip), 'Status de assinatura alterado pelo Master.'],
    ['billing_trial_changed', (before_billing['trialEndsAt'].to_s.strip.empty? ? before['trialEndsAt'].to_s.strip : before_billing['trialEndsAt'].to_s.strip), (after_billing['trialEndsAt'].to_s.strip.empty? ? after['trialEndsAt'].to_s.strip : after_billing['trialEndsAt'].to_s.strip), 'Fim do trial alterado pelo Master.'],
    ['billing_activation_date_changed', (before_billing['activatedAt'].to_s.strip.empty? ? before['activatedAt'].to_s.strip : before_billing['activatedAt'].to_s.strip), (after_billing['activatedAt'].to_s.strip.empty? ? after['activatedAt'].to_s.strip : after_billing['activatedAt'].to_s.strip), 'Data de ativação alterada pelo Master.'],
    ['billing_cancellation_date_changed', (before_billing['canceledAt'].to_s.strip.empty? ? before['canceledAt'].to_s.strip : before_billing['canceledAt'].to_s.strip), (after_billing['canceledAt'].to_s.strip.empty? ? after['canceledAt'].to_s.strip : after_billing['canceledAt'].to_s.strip), 'Data de cancelamento alterada pelo Master.']
  ]
  changes.each do |action, old_value, new_value, message|
    next if old_value.to_s == new_value.to_s
    next if old_value.to_s.empty? && new_value.to_s.empty?
    system_access_log!(
      action: action,
      uid: uid,
      email: email,
      message: message,
      details: { 'from' => old_value.to_s, 'to' => new_value.to_s }
    )
  end
  if before_store['status'].to_s != 'suspended' && after_store['status'].to_s == 'suspended'
    system_access_log!(
      action: 'store_suspended',
      uid: uid,
      email: email,
      message: 'Loja suspensa pelo Master em modo suporte.',
      details: { 'from' => before_store['status'].to_s, 'to' => 'suspended' }
    )
  end
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
    base['plan'] = local['plan'].to_s.strip.empty? ? (system['plan'].to_s.strip.empty? ? 'essencial' : system['plan'].to_s.strip) : local['plan'].to_s.strip
    base['plan'] = 'essencial' if base['plan'].to_s.strip == 'starter'
    base['fiscalCountry'] = local['fiscalCountry'].to_s.strip.empty? ? (system['fiscalCountry'].to_s.strip.empty? ? 'ES' : system['fiscalCountry'].to_s.strip) : local['fiscalCountry'].to_s.strip
    base['store'] = local['store'].is_a?(Hash) ? local['store'] : (system['store'].is_a?(Hash) ? system['store'] : {})
    base['billing'] = local['billing'].is_a?(Hash) ? local['billing'] : (system['billing'].is_a?(Hash) ? system['billing'] : {})
    base['auth'] = local['auth'].is_a?(Hash) ? local['auth'] : (system['auth'].is_a?(Hash) ? system['auth'] : {})
    base['accountStatus'] = local['accountStatus'].to_s.strip.empty? ? base['status'] : local['accountStatus'].to_s.strip
    base['domain'] = local['domain'].to_s.strip.empty? ? base['store']['domain'].to_s.strip : local['domain'].to_s.strip
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
    base['storeStatus'] = if base['domain'].to_s.strip.empty? && base['storeUrl'].to_s.strip.empty? && base['githubRepo'].to_s.strip.empty? && base['store']['name'].to_s.strip.empty?
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

def system_access_log!(action:, uid: '', email: '', message: '', details: {}, source: 'master', mod: 'master', entity_type: 'tenant', entity_id: '', severity: 'info')
  safe_metadata = details.is_a?(Hash) ? details.each_with_object({}) do |(key, value), acc|
    next if key.to_s.match?(/password|senha|token|secret|credential|authorization|payload|html|image|customer|cliente/i)
    text = value.is_a?(Hash) || value.is_a?(Array) ? value.to_json : value.to_s
    acc[key.to_s] = text.length > 180 ? text[0, 180] : text
  end : {}
  firestore_upsert_document('system_access_logs', SecureRandom.uuid, {
    'tenantUid' => uid.to_s,
    'action' => action.to_s,
    'uid' => uid.to_s,
    'email' => email.to_s,
    'message' => message.to_s,
    'module' => mod.to_s,
    'entityType' => entity_type.to_s,
    'entityId' => entity_id.to_s.empty? ? uid.to_s : entity_id.to_s,
    'summary' => message.to_s,
    'source' => source.to_s.empty? ? 'master' : source.to_s,
    'severity' => %w[info warning critical].include?(severity.to_s) ? severity.to_s : 'info',
    'metadata' => safe_metadata,
    'details' => safe_metadata,
    'createdAt' => Time.now.utc.iso8601
  })
rescue => e
  log_master("system access log error action=#{action} uid=#{uid} #{e.class}: #{e.message}")
end

def pending_hotmart_docs
  firestore_list_documents('pending_hotmart_access').map do |doc|
    id = doc['name'].to_s.split('/').last.to_s
    firestore_fields_to_hash(doc['fields'] || {}).merge('id' => id)
  end.reject { |item| item['status'].to_s == 'archived' }
end

def pending_hotmart_requires_manual_action?(item)
  status = item['status'].to_s.strip.downcase
  reason = [item['reason'], item['pendingReason'], item['error'], item['linkError']].join(' ').downcase
  return false if %w[linked auto_linked completed resolved archived ignored].include?(status)
  return true if status.empty? || %w[pending pending_manual manual_review error failed incomplete pending_payment approved_without_tenant canceled_without_tenant email_mismatch].include?(status)
  return true if reason.match?(/sem tenant|without tenant|email diferente|email mismatch|erro|incomplet|manual|pendente|pending|cancelad/)
  false
end

def pending_hotmart_reason(item)
  return item['pendingReason'].to_s unless item['pendingReason'].to_s.strip.empty?
  return item['reason'].to_s unless item['reason'].to_s.strip.empty?
  status = item['status'].to_s.strip.downcase
  return 'compra aprovada sem tenant cadastrado' if status.empty? || status == 'pending'
  return 'pagamento pendente para acompanhamento' if status == 'pending_payment'
  return 'evento Hotmart com erro de vínculo' if %w[error failed].include?(status)
  return 'evento Hotmart com dados incompletos' if status == 'incomplete'
  return 'assinatura cancelada sem tenant localizado' if status == 'canceled_without_tenant'
  return 'e-mail diferente do cadastro' if status == 'email_mismatch'
  'ação manual necessária'
end

def system_tenants_users
  auth_by_uid = {}
  auth_by_email = {}
  begin
    firebase_auth_users_list.each do |auth_user|
      uid_key = auth_user['uid'].to_s.strip
      email_key = auth_user['email'].to_s.strip.downcase
      auth_by_uid[uid_key] = auth_user unless uid_key.empty?
      auth_by_email[email_key] = auth_user unless email_key.empty?
    end
  rescue => e
    log_master("system_tenants_users firebase auth warning #{e.class}: #{e.message}")
  end
  last_access_by_uid = {}
  last_access_by_email = {}
  begin
    firestore_list_documents('system_access_logs').each do |doc|
      log = firestore_fields_to_hash(doc['fields'] || {})
      next unless log['action'].to_s == 'admin_login'
      created_at = log['createdAt'].to_s
      next if created_at.empty?
      uid_key = log['uid'].to_s.strip.empty? ? log['tenantUid'].to_s.strip : log['uid'].to_s.strip
      metadata = log['metadata'].is_a?(Hash) ? log['metadata'] : (log['details'].is_a?(Hash) ? log['details'] : {})
      email_key = log['email'].to_s.strip.downcase
      email_key = metadata['email'].to_s.strip.downcase if email_key.empty?
      last_access_by_uid[uid_key] = created_at if !uid_key.empty? && (last_access_by_uid[uid_key].to_s.empty? || created_at > last_access_by_uid[uid_key].to_s)
      last_access_by_email[email_key] = created_at if !email_key.empty? && (last_access_by_email[email_key].to_s.empty? || created_at > last_access_by_email[email_key].to_s)
    end
  rescue => e
    log_master("system_tenants_users access logs warning #{e.class}: #{e.message}")
  end
  users = firestore_list_documents('system_tenants').map do |doc|
    uid = doc['name'].to_s.split('/').last.to_s
    data = firestore_fields_to_hash(doc['fields'] || {})
    next if firebase_customer_marker?(data)
    store = data['store'].is_a?(Hash) ? data['store'] : {}
    store = store.merge('publicUrl' => public_store_url(store['slug'].to_s.strip)) unless store['slug'].to_s.strip.empty?
    billing = data['billing'].is_a?(Hash) ? data['billing'] : {}
    auth = data['auth'].is_a?(Hash) ? data['auth'] : {}
    source = data['source'].to_s.strip
    origin = data['origin'].to_s.strip.empty? ? source : data['origin'].to_s.strip
    role = data['role'].to_s.strip
    account_status = data['accountStatus'].to_s.strip.empty? ? data['status'].to_s.strip : data['accountStatus'].to_s.strip
    store_configured = !store['name'].to_s.strip.empty? || !store['slug'].to_s.strip.empty?
    billing_configured = !billing.empty? && (
      !billing['provider'].to_s.strip.empty? ||
      !billing['status'].to_s.strip.empty? ||
      !billing['planSlug'].to_s.strip.empty? ||
      !billing['hotmartSubscriberCode'].to_s.strip.empty? ||
      !billing['hotmartTransaction'].to_s.strip.empty?
    )
    saas_status = %w[pending active blocked canceled archived].include?(account_status)
    allowed_origin = %w[hotmart manual test referral master master_local].include?(origin)
    allowed_role = %w[owner admin store_owner master_admin].include?(role)
    firebase_auto_import = origin.start_with?('firebase_auth') || source.start_with?('firebase_auth')
    next if firebase_auto_import && !store_configured && !billing_configured
    next unless allowed_role || store_configured || billing_configured || saas_status || allowed_origin
    next if !store_configured && !billing_configured && !saas_status && !allowed_origin
    email_key = data['email'].to_s.strip.downcase
    auth_user = auth_by_uid[uid] || auth_by_email[email_key] || {}
    auth['uid'] = auth_user['uid'].to_s if auth['uid'].to_s.strip.empty? && !auth_user['uid'].to_s.strip.empty?
    auth['emailVerified'] = auth_user['emailVerified'] if !auth.key?('emailVerified') && auth_user.key?('emailVerified')
    auth['createdAt'] = auth_user['createdAt'].to_s if auth['createdAt'].to_s.strip.empty? && !auth_user['createdAt'].to_s.strip.empty?
    auth['lastLoginAt'] = auth_user['lastLoginAt'].to_s if auth['lastLoginAt'].to_s.strip.empty? && !auth_user['lastLoginAt'].to_s.strip.empty?
    access_at = last_access_by_uid[uid].to_s
    access_at = last_access_by_email[email_key].to_s if access_at.empty?
    auth['lastLoginAt'] = access_at if !access_at.empty? && (auth['lastLoginAt'].to_s.empty? || access_at > auth['lastLoginAt'].to_s)
    data.merge(
      'id' => data['id'].to_s.strip.empty? ? uid : data['id'].to_s,
      'uid' => data['uid'].to_s.strip.empty? ? uid : data['uid'].to_s,
      'businessName' => data['businessName'].to_s.strip.empty? ? store['name'].to_s : data['businessName'].to_s,
      'accountStatus' => account_status,
      'plan' => billing['planSlug'].to_s.strip.empty? ? data['plan'].to_s : billing['planSlug'].to_s,
      'billingStatus' => billing['status'].to_s.strip.empty? ? data['billingStatus'].to_s : billing['status'].to_s,
      'origin' => origin,
      'store' => store,
      'billing' => billing,
      'auth' => auth,
      'lastAccessAt' => access_at.empty? ? auth['lastLoginAt'].to_s : access_at,
      'localExists' => true,
      'systemExists' => true,
      'authExists' => !auth['uid'].to_s.strip.empty?,
      'syncStatus' => 'system_tenants',
      'storeStatus' => store_configured ? (store['status'].to_s.strip.empty? ? 'active' : store['status'].to_s) : 'Loja não configurada'
    )
  end.compact
  grouped = {}
  users.each do |user|
    email_key = user['email'].to_s.strip.downcase
    key = email_key.empty? ? "uid:#{user['id']}" : "email:#{email_key}"
    current = grouped[key]
    grouped[key] = user if current.nil? || system_tenant_user_rank(user) > system_tenant_user_rank(current)
  end
  grouped.values.sort_by { |user| String(user['ownerName'] || user['name'] || user['businessName'] || user['email'] || user['id']).downcase }
end

def system_tenant_user_rank(user)
  store = user['store'].is_a?(Hash) ? user['store'] : {}
  billing = user['billing'].is_a?(Hash) ? user['billing'] : {}
  score = 0
  score += 100 if !store['slug'].to_s.strip.empty?
  score += 80 if !store['name'].to_s.strip.empty?
  score += 60 if !store['publicUrl'].to_s.strip.empty?
  score += 40 if !billing['planSlug'].to_s.strip.empty? || !billing['provider'].to_s.strip.empty?
  score += 20 if user['accountStatus'].to_s == 'active' || user['status'].to_s == 'active'
  updated_at = Time.parse(user['updatedAt'].to_s).to_i rescue 0
  score + [updated_at, 9_999_999_999].min / 1_000_000_000.0
end

def system_tenant_by_uid(uid)
  id = uid.to_s.strip
  return nil if id.empty?
  doc = firestore_get_document('system_tenants', id)
  return nil unless doc
  data = firestore_fields_to_hash(doc['fields'] || {})
  data['id'] ||= id
  data['uid'] ||= id
  data
end

def mirror_fiscal_country_for_email!(email:, canonical_uid:, fiscal_country:, doc:)
  email_key = email.to_s.strip.downcase
  fiscal = fiscal_country.to_s.strip
  canonical = canonical_uid.to_s.strip
  return if email_key.empty? || fiscal.empty?

  firestore_list_documents('system_tenants').each do |item|
    uid = item['name'].to_s.split('/').last.to_s
    next if uid.empty? || uid == canonical
    data = firestore_fields_to_hash(item['fields'] || {})
    next unless data['email'].to_s.strip.downcase == email_key

    firestore_upsert_document('system_tenants', uid, {
      'fiscalCountry' => fiscal,
      'accountAddress' => { 'fiscalCountry' => fiscal },
      'store' => { 'fiscalCountry' => fiscal },
      'masterTenantId' => canonical,
      'email' => doc['email'].to_s.strip,
      'role' => doc['role'].to_s.strip,
      'accountStatus' => doc['accountStatus'].to_s.strip,
      'updatedAt' => doc['updatedAt'].to_s.strip
    })
    log_master("system_tenants fiscal mirror email=#{email_key} uid=#{uid} master_tenant=#{canonical} fiscalCountry=#{fiscal}")
  end
end

def find_pending_hotmart(id_or_tx)
  key = id_or_tx.to_s.strip
  raise WEBrick::HTTPStatus::BadRequest, 'Pendência Hotmart obrigatória.' if key.empty?
  pending_hotmart_docs.find do |item|
    item['id'].to_s == key ||
      item['hotmartTransaction'].to_s == key ||
      item['transaction'].to_s == key ||
      item['buyerEmail'].to_s.strip.downcase == key.downcase
  end
end

HOTMART_OFFER_PLANS = {
  'u7wyvsyn' => { 'planSlug' => 'essencial', 'billingCycle' => 'monthly', 'trialDays' => 15 },
  'kah1d2ne' => { 'planSlug' => 'compromisso_anual', 'billingCycle' => 'annual', 'trialDays' => 15 },
  'woavlwrh' => { 'planSlug' => 'fundadoras', 'billingCycle' => 'monthly', 'trialDays' => 0 }
}.freeze

def hotmart_offer_plan_from_pending(pending)
  code = pending['hotmartOfferCode'].to_s.strip.downcase
  code = pending['offerCode'].to_s.strip.downcase if code.empty?
  HOTMART_OFFER_PLANS[code]
end

def hotmart_billing_cycle_from_pending(pending)
  offer_plan = hotmart_offer_plan_from_pending(pending)
  return [offer_plan['billingCycle'], false] if offer_plan
  raw = pending['billingCycle'].to_s.strip
  raw = pending['cycle'].to_s.strip if raw.empty?
  raw = pending['billing_cycle'].to_s.strip if raw.empty?
  raw = pending['recurrence'].to_s.strip if raw.empty?
  value = raw.downcase
  return ['annual', false] if %w[annual annually yearly year anual ano].include?(value) || value.include?('annual') || value.include?('year') || value.include?('anual')
  return ['monthly', false] if %w[monthly month mensal mes mês].include?(value) || value.include?('month') || value.include?('mensal')
  reference = [pending['planSlug'], pending['planName'], pending['offerCode'], pending['hotmartOfferCode']].map(&:to_s).join(' ').downcase
  return ['annual', false] if reference.include?('annual') || reference.include?('anual') || reference.include?('year')
  return ['monthly', false] if reference.include?('monthly') || reference.include?('mensal') || reference.include?('month')
  ['monthly', true]
end

def hotmart_status_from_pending(pending)
  raw = pending['internalStatus'].to_s.strip
  raw = pending['billingStatus'].to_s.strip if raw.empty?
  raw = pending['status'].to_s.strip if raw.empty? && %w[active canceled refunded chargeback pending_payment past_due].include?(pending['status'].to_s)
  event = pending['eventType'].to_s.upcase
  return raw unless raw.empty?
  return 'chargeback' if event.include?('CHARGEBACK')
  return 'refunded' if event.include?('REFUND') || event.include?('REIMBURSE')
  return 'canceled' if event.include?('CANCEL')
  return 'past_due' if event.include?('OVERDUE') || event.include?('PAST_DUE') || event.include?('DELAYED')
  return 'pending_payment' if event.include?('BILLET') || event.include?('BOLETO') || event.include?('PENDING') || event.include?('WAITING')
  'active'
end

def hotmart_event_time_from_pending(pending)
  value = pending['activatedAt'].to_s.strip
  value = pending['canceledAt'].to_s.strip if value.empty?
  value = pending['updatedAt'].to_s.strip if value.empty?
  value = pending['createdAt'].to_s.strip if value.empty?
  value.empty? ? Time.now.utc.iso8601 : value
end

def hotmart_log_action_for_status(status)
  {
    'active' => 'hotmart_subscription_activated',
    'canceled' => 'hotmart_subscription_canceled',
    'pending_payment' => 'hotmart_payment_pending',
    'past_due' => 'hotmart_payment_past_due',
    'refunded' => 'hotmart_refunded',
    'chargeback' => 'hotmart_chargeback'
  }[status.to_s] || 'hotmart_event_received'
end

def tenant_from_hotmart_pending(pending)
  email = pending['buyerEmail'].to_s.strip.downcase
  raise WEBrick::HTTPStatus::BadRequest, 'Compra Hotmart sem buyerEmail.' if email.empty?
  now = Time.now.utc.iso8601
  uid = "hotmart_#{Digest::SHA1.hexdigest(email)[0,16]}"
  name = pending['buyerName'].to_s.strip.empty? ? email.split('@').first.to_s : pending['buyerName'].to_s.strip
  offer_plan = hotmart_offer_plan_from_pending(pending)
  plan = offer_plan ? offer_plan['planSlug'] : (pending['planSlug'].to_s.strip.empty? ? 'essencial' : pending['planSlug'].to_s.strip)
  plan = 'essencial' if plan == 'starter'
  billing_cycle, cycle_fallback = hotmart_billing_cycle_from_pending(pending)
  billing_status = hotmart_status_from_pending(pending)
  event_time = hotmart_event_time_from_pending(pending)
  trial_days = offer_plan ? offer_plan['trialDays'].to_i : pending['trialDays'].to_i
  trial_ends_at = pending['trialEndsAt'].to_s.strip
  trial_ends_at = (Time.parse(event_time) + trial_days * 86_400).utc.iso8601 if trial_ends_at.empty? && trial_days.positive?
  canceled_at = %w[canceled refunded chargeback].include?(billing_status) ? event_time : pending['canceledAt'].to_s.strip
  if cycle_fallback
    log_master("hotmart billingCycle fallback monthly pending=#{pending['id']} email=#{email} plan=#{plan}")
    system_access_log!(action: 'hotmart_billing_cycle_fallback', email: email, message: 'Ciclo Hotmart ausente; usando monthly.', details: { 'pendingId' => pending['id'], 'planSlug' => plan, 'billingCycle' => billing_cycle }, source: 'hotmart', mod: 'hotmart', severity: 'warning')
  end
  slug = public_store_slug(pending['storeName'].to_s.strip.empty? ? name : pending['storeName'])
  buyer_address = pending['buyerAddress'].is_a?(Hash) ? pending['buyerAddress'] : (pending['address'].is_a?(Hash) ? pending['address'] : {})
  buyer_country = buyer_address['country_iso'].to_s.strip.empty? ? pending['buyerCountry'].to_s.strip : buyer_address['country_iso'].to_s.strip
  tenant_doc = {
    'id' => uid,
    'uid' => uid,
    'fullName' => name,
    'name' => name,
    'ownerName' => name,
    'email' => email,
    'phone' => pending['buyerPhone'].to_s,
    'whatsapp' => pending['buyerPhone'].to_s,
    'country' => buyer_country,
    'language' => 'es-ES',
    'businessName' => pending['storeName'].to_s.strip.empty? ? name : pending['storeName'].to_s.strip,
    'plan' => plan,
    'billingStatus' => billing_status,
    'billingCycle' => billing_cycle,
    'trialEndsAt' => trial_ends_at,
    'activatedAt' => billing_status == 'active' ? event_time : '',
    'canceledAt' => canceled_at,
    'status' => 'pending',
    'accountStatus' => 'pending',
    'role' => 'owner',
    'fiscalCountry' => buyer_country.empty? ? 'ES' : buyer_country,
    'domain' => '',
    'slug' => slug,
    'publicUrl' => public_store_url(slug),
    'storeUrl' => public_store_url(slug),
    'adminUrl' => 'admin.html',
    'source' => 'hotmart',
    'origin' => 'hotmart',
    'notes' => 'Criado a partir de compra Hotmart pendente.',
    'githubRepo' => '',
    'githubBranch' => 'main',
    'githubToken' => '',
    'publicFile' => 'index.html',
    'store' => {
      'name' => pending['storeName'].to_s.strip.empty? ? name : pending['storeName'].to_s.strip,
      'slug' => slug,
      'domain' => '',
      'city' => '',
      'country' => buyer_country,
      'fiscalCountry' => buyer_country.empty? ? 'ES' : buyer_country,
      'language' => 'es-ES',
      'status' => 'draft'
    },
    'accountAddress' => {
      'street' => buyer_address['address'].to_s,
      'number' => buyer_address['number'].to_s,
      'complement' => buyer_address['complement'].to_s,
      'neighborhood' => buyer_address['neighborhood'].to_s,
      'city' => buyer_address['city'].to_s,
      'province' => buyer_address['state'].to_s,
      'postalCode' => buyer_address['zipcode'].to_s,
      'country' => buyer_country,
      'fiscalCountry' => buyer_country.empty? ? 'ES' : buyer_country,
      'source' => buyer_address.empty? ? 'setup' : 'hotmart'
    },
    'billing' => {
      'provider' => 'hotmart',
      'status' => billing_status,
      'planSlug' => plan,
      'billingCycle' => billing_cycle,
      'trialEndsAt' => trial_ends_at,
      'activatedAt' => billing_status == 'active' ? event_time : '',
      'canceledAt' => canceled_at,
      'hotmartSubscriberCode' => pending['hotmartSubscriberCode'].to_s,
      'hotmartTransaction' => pending['hotmartTransaction'].to_s.empty? ? pending['transaction'].to_s : pending['hotmartTransaction'].to_s,
      'hotmartProductId' => pending['hotmartProductId'].to_s,
      'hotmartOfferCode' => pending['offerCode'].to_s.empty? ? pending['hotmartOfferCode'].to_s : pending['offerCode'].to_s,
      'purchaseStatus' => pending['purchaseStatus'].to_s,
      'subscriptionStatus' => pending['subscriptionStatus'].to_s.empty? ? billing_status : pending['subscriptionStatus'].to_s,
      'lastHotmartEventAt' => event_time
    },
    'auth' => { 'uid' => uid, 'emailVerified' => false, 'lastLoginAt' => '' },
    'createdAt' => now,
    'updatedAt' => now
  }
  if trial_ends_at.empty?
    tenant_doc.delete('trialEndsAt')
    tenant_doc['billing'].delete('trialEndsAt') if tenant_doc['billing'].is_a?(Hash)
  end
  tenant_doc
end

def link_hotmart_pending_to_tenant!(pending, tenant, manual: false)
  now = Time.now.utc.iso8601
  billing = tenant['billing'].is_a?(Hash) ? tenant['billing'] : {}
  offer_plan = hotmart_offer_plan_from_pending(pending)
  billing_cycle, cycle_fallback = hotmart_billing_cycle_from_pending(pending)
  billing_status = hotmart_status_from_pending(pending)
  event_time = hotmart_event_time_from_pending(pending)
  trial_days = offer_plan ? offer_plan['trialDays'].to_i : pending['trialDays'].to_i
  trial_ends_at = pending['trialEndsAt'].to_s.strip
  trial_ends_at = (Time.parse(event_time) + trial_days * 86_400).utc.iso8601 if trial_ends_at.empty? && trial_days.positive?
  canceled_at = %w[canceled refunded chargeback].include?(billing_status) ? event_time : pending['canceledAt'].to_s.strip
  if cycle_fallback
    fallback_email = tenant['email'].to_s.empty? ? pending['buyerEmail'].to_s : tenant['email'].to_s
    log_master("hotmart billingCycle fallback monthly pending=#{pending['id']} email=#{fallback_email} tenant=#{tenant['id']}")
    system_access_log!(action: 'hotmart_billing_cycle_fallback', uid: tenant['id'], email: fallback_email, message: 'Ciclo Hotmart ausente; usando monthly.', details: { 'pendingId' => pending['id'], 'planSlug' => pending['planSlug'], 'billingCycle' => billing_cycle }, source: 'hotmart', mod: 'hotmart', severity: 'warning')
  end
  billing['provider'] = 'hotmart'
  billing['status'] = billing_status
  billing['planSlug'] = offer_plan ? offer_plan['planSlug'] : (pending['planSlug'].to_s.strip.empty? ? (billing['planSlug'].to_s.strip.empty? ? tenant['plan'].to_s : billing['planSlug'].to_s) : pending['planSlug'].to_s.strip)
  billing['planSlug'] = 'essencial' if billing['planSlug'].to_s.strip == 'starter'
  billing['billingCycle'] = billing_cycle
  if trial_ends_at.empty?
    billing.delete('trialEndsAt')
  else
    billing['trialEndsAt'] = trial_ends_at
  end
  billing['activatedAt'] = event_time if billing_status == 'active'
  billing['canceledAt'] = canceled_at
  billing['hotmartSubscriberCode'] = pending['hotmartSubscriberCode'].to_s
  billing['hotmartTransaction'] = pending['hotmartTransaction'].to_s.empty? ? pending['transaction'].to_s : pending['hotmartTransaction'].to_s
  billing['hotmartProductId'] = pending['hotmartProductId'].to_s
  billing['hotmartOfferCode'] = pending['offerCode'].to_s.empty? ? pending['hotmartOfferCode'].to_s : pending['offerCode'].to_s
  billing['purchaseStatus'] = pending['purchaseStatus'].to_s
  billing['subscriptionStatus'] = pending['subscriptionStatus'].to_s.empty? ? billing_status : pending['subscriptionStatus'].to_s
  billing['lastHotmartEventAt'] = event_time
  tenant['billing'] = billing
  account_address = tenant['accountAddress'].is_a?(Hash) ? tenant['accountAddress'] : {}
  buyer_address = pending['buyerAddress'].is_a?(Hash) ? pending['buyerAddress'] : (pending['address'].is_a?(Hash) ? pending['address'] : {})
  if account_address.empty? && !buyer_address.empty?
    buyer_country = buyer_address['country_iso'].to_s.strip.empty? ? pending['buyerCountry'].to_s.strip : buyer_address['country_iso'].to_s.strip
    tenant['accountAddress'] = {
      'street' => buyer_address['address'].to_s,
      'number' => buyer_address['number'].to_s,
      'complement' => buyer_address['complement'].to_s,
      'neighborhood' => buyer_address['neighborhood'].to_s,
      'city' => buyer_address['city'].to_s,
      'province' => buyer_address['state'].to_s,
      'postalCode' => buyer_address['zipcode'].to_s,
      'country' => buyer_country,
      'fiscalCountry' => buyer_country.empty? ? 'ES' : buyer_country,
      'source' => 'hotmart'
    }
  end
  tenant['plan'] = billing['planSlug'].to_s.strip.empty? ? tenant['plan'] : billing['planSlug']
  tenant['billingCycle'] = billing['billingCycle']
  if trial_ends_at.empty?
    tenant.delete('trialEndsAt')
  else
    tenant['trialEndsAt'] = billing['trialEndsAt']
  end
  tenant['activatedAt'] = billing['activatedAt'] if billing_status == 'active'
  tenant['canceledAt'] = billing['canceledAt']
  tenant['billingStatus'] = billing['status']
  tenant['source'] = tenant['source'].to_s.strip.empty? ? 'hotmart' : tenant['source']
  tenant['origin'] = tenant['origin'].to_s.strip.empty? ? 'hotmart' : tenant['origin']
  tenant['updatedAt'] = now
  firestore_upsert_document('pending_hotmart_access', pending['id'], {
    'status' => 'linked',
    'linkedTenantId' => tenant['id'].to_s,
    'linkedEmail' => tenant['email'].to_s,
    'manualLink' => manual,
    'updatedAt' => now
  })
  system_access_log!(
    action: manual ? 'hotmart_manual_link' : 'hotmart_purchase_linked',
    uid: tenant['id'],
    email: tenant['email'],
    message: manual ? 'Compra Hotmart vinculada manualmente com e-mail diferente.' : 'Compra Hotmart vinculada por e-mail.',
    details: { 'pendingId' => pending['id'], 'buyerEmail' => pending['buyerEmail'], 'transaction' => billing['hotmartTransaction'] }
  )
  system_access_log!(
    action: hotmart_log_action_for_status(billing_status),
    uid: tenant['id'],
    email: tenant['email'],
    message: "Status Hotmart aplicado ao tenant: #{billing_status}.",
    details: { 'pendingId' => pending['id'], 'billingStatus' => billing_status, 'planSlug' => billing['planSlug'], 'billingCycle' => billing['billingCycle'] },
    source: 'hotmart',
    mod: 'hotmart',
    severity: %w[chargeback past_due].include?(billing_status) ? 'warning' : 'info'
  )
  system_access_log!(
    action: 'hotmart_linked_to_tenant',
    uid: tenant['id'],
    email: tenant['email'],
    message: 'Evento Hotmart vinculado ao tenant.',
    details: { 'pendingId' => pending['id'], 'billingStatus' => billing_status },
    source: 'hotmart',
    mod: 'hotmart'
  )
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
        'plan' => 'essencial',
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
      existing_local['plan'] = existing_local['plan'].to_s.strip.empty? || existing_local['plan'].to_s.strip == 'starter' ? 'essencial' : existing_local['plan'].to_s.strip
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
      'plan' => existing_local['plan'].to_s.strip.empty? || existing_local['plan'].to_s.strip == 'starter' ? 'essencial' : existing_local['plan'].to_s.strip,
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
  DocumentRoot: PUBLIC_ROOT,
  Logger: WEBrick::Log.new($stderr, WEBrick::BasicLog::ERROR),
  AccessLog: []
)

server.mount_proc '/master.html' do |_req, res|
  res['Content-Type'] = 'text/html; charset=utf-8'
  res.body = File.read(File.join(ROOT, 'master.html'))
end

server.mount_proc '/cadastro' do |_req, res|
  res['Content-Type'] = 'text/html; charset=utf-8'
  res.body = File.read(File.join(PUBLIC_ROOT, 'cadastro.html'))
end

server.mount_proc '/login' do |_req, res|
  res['Content-Type'] = 'text/html; charset=utf-8'
  res.body = File.read(File.join(PUBLIC_ROOT, 'admin.html'))
end

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
	    existing_for_logs = existing_local.empty? ? (system_tenant_by_uid(uid_hint) || {}) : existing_local
	    tenant = tenant_from_body(body, existing_for_logs)
    tenant['source'] = body['source'].to_s.strip.empty? ? (existing_local['source'].to_s.strip.empty? ? 'master_local' : existing_local['source'].to_s.strip) : body['source'].to_s.strip
    tenant['origin'] = body['origin'].to_s.strip.empty? ? tenant['source'] : body['origin'].to_s.strip
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
    tenant['source'] = body['source'].to_s.strip.empty? ? (existing_local['source'].to_s.strip.empty? ? 'master_local' : existing_local['source'].to_s.strip) : body['source'].to_s.strip
    tenant['origin'] = body['origin'].to_s.strip.empty? ? tenant['source'] : body['origin'].to_s.strip

    store = master_store
    ensure_unique_public_slug!(store, tenant['slug'], tenant['id'])
    master_restore_tenant!(store, tenant['id'])
    master_replace_tenant(store, tenant)

	    sync_result = sync_system_tenant!(tenant, { 'email' => tenant['email'], 'uid' => final_uid }, force: true)
	    public_store_result = tenant['slug'].to_s.strip.empty? ? { 'ok' => true, 'skipped' => true, 'reason' => 'slug_not_configured' } : sync_public_store!(tenant, existing_local['slug'])
	    tenant_access_change_logs!(existing_for_logs, tenant) unless existing_for_logs.empty?
	    if body['supportMode'] == true && !existing_for_logs.empty?
	      system_access_log!(
	        action: 'master_tenant_updated',
	        uid: tenant['id'],
	        email: tenant['email'],
	        message: 'Dados alterados pelo Master em modo suporte.',
	        details: { 'supportMode' => true },
	        mod: 'master/users'
	      )
	    end
	    system_access_log!(
      action: existing_local.empty? ? 'manual_user_created' : 'manual_user_updated',
      uid: tenant['id'],
      email: tenant['email'],
      message: existing_local.empty? ? 'Usuário criado manualmente no Master.' : 'Usuário atualizado no Master.',
      details: { 'origin' => tenant['origin'] || tenant['source'], 'plan' => tenant['plan'], 'billingStatus' => tenant['billingStatus'] }
    )

    log_master(
      "firebase provision email=#{tenant['email']} uid=#{tenant['id']} origin=#{tenant['source']} created_auth=#{auth_result['created']} saved_master=true system_tenants=#{sync_result['ok'] ? 'ok' : (sync_result['skipped'] ? 'skipped' : 'error')}"
    )

    json_response(res, 200, {
      ok: true,
      action: auth_result['created'] ? 'created_auth' : 'updated_auth',
      uid: tenant['id'],
      tenant: tenant,
      auth: auth_result,
      systemTenant: sync_result,
      publicStore: public_store_result
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

    system_access_log!(action: 'master_account_activated', uid: tenant['id'], email: tenant['email'], message: 'Conta liberada pelo Master.', details: { 'role' => tenant['role'], 'status' => tenant['status'] }, mod: 'master/users')
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

server.mount_proc '/api/master/users' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'GET required', users: [] }) unless req.request_method == 'GET'
    users = system_tenants_users
    log_master("master users read path=system_tenants count=#{users.length} tenantUids=#{users.first(20).map { |u| u['id'].to_s }.join(',')}")
    json_response(res, 200, { ok: true, users: users })
  rescue => e
    json_response(res, 400, { ok: false, error: e.message, users: [] })
  end
end

server.mount_proc '/api/master/tenants/action' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'POST required' }) unless req.request_method == 'POST'
    body = read_json(req)
    action = body['action'].to_s
    uid = body['uid'].to_s.strip
    store = master_store
    tenant = master_find_tenant(store, uid: uid, email: body['email'])
    tenant ||= system_tenant_by_uid(uid)
    raise WEBrick::HTTPStatus::NotFound, 'Usuário não encontrado.' unless tenant

    case action
    when 'activate_access'
      billing = tenant['billing'].is_a?(Hash) ? tenant['billing'] : {}
      billing['status'] = 'active' if billing['status'].to_s.strip.empty? || billing['status'].to_s == 'inactive' || billing['status'].to_s == 'pending_payment'
      tenant['status'] = 'active'
      tenant['accountStatus'] = 'active'
      tenant['billing'] = billing
      tenant['billingStatus'] = billing['status']
      tenant['updatedAt'] = Time.now.utc.iso8601
      master_replace_tenant(store, tenant) if master_find_tenant(store, uid: uid, email: body['email'])
      firestore_upsert_document('system_tenants', tenant['id'] || uid, {
        'accountStatus' => 'active',
        'status' => 'active',
        'billing' => billing,
        'billingStatus' => billing['status'],
        'updatedAt' => tenant['updatedAt']
      })
      system_access_log!(action: 'master_account_activated', uid: tenant['id'] || uid, email: tenant['email'], message: 'Conta liberada pelo Master.', details: { 'billingStatus' => billing['status'] }, mod: 'master/users')
      json_response(res, 200, { ok: true, tenant: tenant })
    when 'block_access'
      tenant['status'] = 'blocked'
      tenant['accountStatus'] = 'blocked'
      tenant['updatedAt'] = Time.now.utc.iso8601
      master_replace_tenant(store, tenant) if master_find_tenant(store, uid: uid, email: body['email'])
      begin
        firebase_create_or_update_auth_user(tenant)
      rescue => e
        log_master("block access firebase auth warning uid=#{tenant['id']} #{e.class}: #{e.message}")
      end
      begin
        firestore_upsert_document('system_tenants', tenant['id'] || uid, { 'accountStatus' => 'blocked', 'status' => 'blocked', 'updatedAt' => tenant['updatedAt'] })
      rescue => e
        log_master("block access system_tenants warning uid=#{tenant['id']} #{e.class}: #{e.message}")
      end
      system_access_log!(action: 'master_account_blocked', uid: tenant['id'], email: tenant['email'], message: 'Conta bloqueada pelo Master.', mod: 'master/users', severity: 'warning')
      json_response(res, 200, { ok: true, tenant: tenant })
    when 'change_plan'
      plan = body['planSlug'].to_s.strip
      raise WEBrick::HTTPStatus::BadRequest, 'Plano obrigatório.' if plan.empty?
      cycle = body['billingCycle'].to_s.strip
      billing = tenant['billing'].is_a?(Hash) ? tenant['billing'] : {}
      provider = billing_provider_from_hash(tenant)
      raise WEBrick::HTTPStatus::BadRequest, 'Plano controlado pela Hotmart. Use vínculo/reprocessamento Hotmart.' if provider == 'hotmart'
      billing['provider'] = 'manual' if provider == 'none'
      cycle = billing['billingCycle'].to_s.strip if cycle.empty?
      cycle = tenant['billingCycle'].to_s.strip if cycle.empty?
      cycle = billing['cycle'].to_s.strip if cycle.empty?
      cycle = 'monthly' if cycle.empty?
      billing['planSlug'] = plan
      billing['billingCycle'] = cycle
      tenant['plan'] = plan
      tenant['billing'] = billing
      tenant['billingCycle'] = billing['billingCycle']
      tenant['updatedAt'] = Time.now.utc.iso8601
      master_replace_tenant(store, tenant) if master_find_tenant(store, uid: uid, email: body['email'])
      firestore_upsert_document('system_tenants', tenant['id'] || uid, {
        'plan' => plan,
        'billing' => billing,
        'billingCycle' => billing['billingCycle'].to_s,
        'updatedAt' => tenant['updatedAt']
      })
      system_access_log!(action: 'billing_plan_changed', uid: tenant['id'] || uid, email: tenant['email'], message: "Plano alterado para #{plan}.", details: { 'planSlug' => plan, 'billingCycle' => billing['billingCycle'].to_s })
      json_response(res, 200, { ok: true, tenant: tenant })
    when 'archive'
      tenant['status'] = 'archived'
      tenant['accountStatus'] = 'archived'
      tenant['archivedAt'] = Time.now.utc.iso8601
      tenant['updatedAt'] = tenant['archivedAt']
      master_replace_tenant(store, tenant) if master_find_tenant(store, uid: uid, email: body['email'])
      firestore_upsert_document('system_tenants', tenant['id'] || uid, {
        'accountStatus' => 'archived',
        'status' => 'archived',
        'archivedAt' => tenant['archivedAt'],
        'updatedAt' => tenant['updatedAt']
      })
      system_access_log!(action: 'tenant_archived', uid: tenant['id'] || uid, email: tenant['email'], message: 'Tenant arquivado pelo Master.')
      json_response(res, 200, { ok: true, tenant: tenant })
    else
      raise WEBrick::HTTPStatus::BadRequest, 'Ação inválida.'
    end
  rescue WEBrick::HTTPStatus::NotFound => e
    json_response(res, 404, { ok: false, error: e.message })
  rescue => e
    json_response(res, 400, { ok: false, error: e.message })
  end
end

server.mount_proc '/api/master/hotmart/pending' do |_req, res|
  begin
    items = pending_hotmart_docs
      .select { |item| pending_hotmart_requires_manual_action?(item) }
      .map { |item| item.merge('pendingReason' => pending_hotmart_reason(item)) }
      .sort_by { |item| item['updatedAt'].to_s.empty? ? item['createdAt'].to_s : item['updatedAt'].to_s }
      .reverse
    json_response(res, 200, { ok: true, items: items })
  rescue => e
    json_response(res, 400, { ok: false, error: e.message, items: [] })
  end
end

server.mount_proc '/api/master/hotmart/pending/action' do |req, res|
  begin
    next json_response(res, 405, { ok: false, error: 'POST required' }) unless req.request_method == 'POST'
    body = read_json(req)
    action = body['action'].to_s
    pending = find_pending_hotmart(body['pendingId'].to_s.strip.empty? ? body['transaction'] : body['pendingId'])
    raise WEBrick::HTTPStatus::NotFound, 'Pendência Hotmart não encontrada.' unless pending
    store = master_store
    now = Time.now.utc.iso8601

    case action
    when 'archive'
      firestore_upsert_document('pending_hotmart_access', pending['id'], { 'status' => 'archived', 'updatedAt' => now })
      system_access_log!(action: 'hotmart_pending_archived', email: pending['buyerEmail'], message: 'Pendência Hotmart arquivada.', details: { 'pendingId' => pending['id'] })
      json_response(res, 200, { ok: true })
    when 'create_tenant'
      tenant = tenant_from_hotmart_pending(pending)
      existing = master_find_tenant(store, uid: tenant['id'], email: tenant['email']) || {}
      raise WEBrick::HTTPStatus::BadRequest, 'Já existe tenant com este e-mail. Use vincular compra Hotmart.' unless existing.empty?
      master_replace_tenant(store, tenant)
      linked = link_hotmart_pending_to_tenant!(pending, tenant, manual: false)
      sync_system_tenant!(linked, nil, force: true)
      system_access_log!(action: 'manual_user_created', uid: tenant['id'], email: tenant['email'], message: 'Tenant criado a partir de compra Hotmart pendente.', details: { 'pendingId' => pending['id'] })
      json_response(res, 200, { ok: true, tenant: linked })
    when 'link_existing'
      tenant = master_find_tenant(store, uid: body['uid'], email: body['email'])
      tenant ||= system_tenant_by_uid(body['uid'])
      raise WEBrick::HTTPStatus::NotFound, 'Usuário/tenant não encontrado para vínculo.' unless tenant
      same_email = tenant['email'].to_s.strip.downcase == pending['buyerEmail'].to_s.strip.downcase
      manual = !same_email
      linked = link_hotmart_pending_to_tenant!(pending, tenant, manual: manual)
      master_replace_tenant(store, linked) if master_find_tenant(store, uid: linked['id'], email: linked['email'])
      tenant_hotmart_update = {
        'billing' => linked['billing'],
        'billingStatus' => linked['billingStatus'],
        'billingCycle' => linked['billingCycle'],
        'activatedAt' => linked['activatedAt'],
        'canceledAt' => linked['canceledAt'],
        'plan' => linked['plan'],
        'origin' => linked['origin'],
        'source' => linked['source'],
        'updatedAt' => linked['updatedAt']
      }
      tenant_hotmart_update['trialEndsAt'] = linked['trialEndsAt'] if linked.key?('trialEndsAt')
      firestore_upsert_document('system_tenants', linked['id'], tenant_hotmart_update)
      json_response(res, 200, { ok: true, tenant: linked, manualLink: manual })
    else
      raise WEBrick::HTTPStatus::BadRequest, 'Ação inválida.'
    end
  rescue WEBrick::HTTPStatus::NotFound => e
    json_response(res, 404, { ok: false, error: e.message })
  rescue => e
    json_response(res, 400, { ok: false, error: e.message })
  end
end

server.mount_proc '/api/master/access/logs' do |req, res|
  begin
    params = URI.decode_www_form(req.query_string.to_s).to_h
    uid = params['uid'].to_s.strip
    email = params['email'].to_s.strip.downcase
    action = params['action'].to_s.strip
    docs = firestore_list_documents('system_access_logs')
    logs = docs.map { |doc| firestore_fields_to_hash(doc['fields'] || {}).merge('id' => doc['name'].to_s.split('/').last.to_s) }
    logs = logs.select do |log|
      uid_match = uid.empty? || log['uid'].to_s == uid || log['tenantUid'].to_s == uid
      details = log['details'].is_a?(Hash) ? log['details'] : {}
      email_value = log['email'].to_s.strip.downcase
      email_value = details['email'].to_s.strip.downcase if email_value.empty?
      email_match = email.empty? || email_value == email
      action_match = action.empty? || log['action'].to_s == action
      uid_match && email_match && action_match
    end
    logs = logs.sort_by { |log| log['createdAt'].to_s }.reverse.first(50)
    json_response(res, 200, { ok: true, logs: logs })
  rescue => e
    json_response(res, 400, { ok: false, error: e.message, logs: [] })
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
    ensure_unique_public_slug!(store, tenant['slug'], tenant['id'])
    master_restore_tenant!(store, tenant['id'])
    store['tenants'] = (store['tenants'] || []).reject { |t| t['id'] == tenant['id'] }
    store['tenants'] << tenant
    save_store(store)
    sync_public_store!(tenant, existing['slug']) unless tenant['slug'].to_s.strip.empty?
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
  existing = (store['tenants'] || []).find { |t| t['id'].to_s == id } || {}
  store['tenants'] = (store['tenants'] || []).reject { |t| t['id'].to_s == id }
  master_mark_tenant_deleted!(store, id)
  save_store(store)
  firestore_delete_document('public_stores', public_store_slug(existing['slug'])) if !public_store_slug(existing['slug']).empty?
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

email_test_smtp_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, smtp_test_error('ENDPOINT_ERROR', 'Endpoint restrito ao Master local. Abra pelo servidor local autorizado.'))
    end
    unless req.request_method == 'POST'
      next json_response_cors(req, res, 405, smtp_test_error('ENDPOINT_ERROR', 'Endpoint existe, mas exige método POST.'))
    end

    body = read_json(req)
    host = body['smtpHost'].to_s.strip
    port = body['smtpPort'].to_i
    secure = normalize_smtp_secure(body['smtpSecure'])
    user_present = !body['smtpUser'].to_s.strip.empty?
    password_present = !body['smtpPassword'].to_s.empty?
    log_master("email smtp test start host=#{host} port=#{port} secure=#{secure} user_present=#{user_present} password_present=#{password_present}")
    result = test_smtp_connection!(body)
    log_master("email smtp test ok host=#{host} port=#{port} secure=#{secure} user_present=#{user_present}")
    json_response_cors(req, res, 200, result)
  rescue WEBrick::HTTPStatus::BadRequest => e
    payload = smtp_test_error('INVALID_CONFIG', e.message)
    log_master("email smtp test validation_error #{payload[:code]} #{e.message}")
    json_response_cors(req, res, 400, payload)
  rescue => e
    payload = smtp_error_payload(e)
    log_master("email smtp test error code=#{payload[:code]} class=#{e.class} message=#{e.message}")
    json_response_cors(req, res, 400, payload)
  end
end

server.mount_proc '/api/master/email/test-smtp', &email_test_smtp_handler
server.mount_proc '/api/master/email/test-smtp/', &email_test_smtp_handler

email_settings_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  log_email_settings("rota chamada method=#{req.request_method} path=#{req.path} host=#{req.host}")
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_settings_error('Endpoint restrito ao Master local.'))
    end

    case req.request_method
    when 'GET'
      log_email_settings('carregando system_email_settings/default')
      json_response_cors(req, res, 200, {
        ok: true,
        settings: email_settings_payload
      })
    when 'POST'
      body = read_json(req)
      log_email_settings("campos recebidos #{email_settings_received_fields(body).to_json}")
      json_response_cors(req, res, 200, save_email_settings!(body))
    else
      json_response_cors(req, res, 405, email_settings_error('Endpoint existe, mas exige método POST.'))
    end
  rescue WEBrick::HTTPStatus::BadRequest => e
    debug = email_settings_debug(e)
    log_email_settings("erro validacao #{debug}")
    json_response_cors(req, res, 400, email_settings_error(e.message, debug))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível salvar a configuração SMTP.'
    payload = req.request_method == 'GET' ? email_read_error(message, debug) : email_settings_error(message, debug)
    json_response_cors(req, res, 400, payload)
  end
end

server.mount_proc '/api/master/email/settings', &email_settings_handler
server.mount_proc '/api/master/email/settings/', &email_settings_handler

email_templates_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end

    case req.request_method
    when 'GET'
      json_response_cors(req, res, 200, {
        ok: true,
        templates: load_email_templates_payload
      })
    when 'POST'
      template = save_email_template_payload!(read_json(req))
      json_response_cors(req, res, 200, {
        ok: true,
        message: 'Template salvo.',
        template: template
      })
    else
      json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método GET ou POST.'))
    end
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, email_read_error(e.message))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("templates erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível carregar os templates de e-mail.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/email/templates', &email_templates_handler
server.mount_proc '/api/master/email/templates/', &email_templates_handler

system_pages_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end

    case req.request_method
    when 'GET'
      json_response_cors(req, res, 200, {
        ok: true,
        pages: load_system_pages_payload
      })
    when 'POST'
      body = read_json(req)
      if body['action'].to_s == 'delete'
        deleted = delete_system_page_payload!(body)
        json_response_cors(req, res, 200, {
          ok: true,
          message: 'Página excluída.',
          page: deleted
        })
      else
        page = save_system_page_payload!(body)
        json_response_cors(req, res, 200, {
          ok: true,
          message: 'Página salva.',
          page: page
        })
      end
    else
      json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método GET ou POST.'))
    end
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, email_read_error(e.message))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("system pages erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível salvar ou carregar páginas do sistema.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/system-pages', &system_pages_handler
server.mount_proc '/api/master/system-pages/', &system_pages_handler

email_triggers_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end

    case req.request_method
    when 'GET'
      json_response_cors(req, res, 200, {
        ok: true,
        triggers: load_email_triggers_payload
      })
    when 'POST'
      trigger = save_email_trigger_payload!(read_json(req))
      json_response_cors(req, res, 200, {
        ok: true,
        message: 'Gatilho salvo.',
        trigger: trigger
      })
    else
      json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método GET ou POST.'))
    end
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, email_read_error(e.message))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("triggers erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível carregar os gatilhos de e-mail.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/email/triggers', &email_triggers_handler
server.mount_proc '/api/master/email/triggers/', &email_triggers_handler

crm_tags_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end

    case req.request_method
    when 'GET'
      json_response_cors(req, res, 200, { ok: true, tags: load_crm_tags_payload })
    when 'POST'
      tag = save_crm_tag_payload!(read_json(req))
      json_response_cors(req, res, 200, { ok: true, message: 'Tag CRM salva.', tag: tag })
    else
      json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método GET ou POST.'))
    end
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, email_read_error(e.message))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("crm tags erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível carregar as tags CRM.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/crm/tags', &crm_tags_handler
server.mount_proc '/api/master/crm/tags/', &crm_tags_handler

crm_rules_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end

    case req.request_method
    when 'GET'
      json_response_cors(req, res, 200, { ok: true, rules: load_crm_rules_payload })
    when 'POST'
      rule = save_crm_rule_payload!(read_json(req))
      json_response_cors(req, res, 200, { ok: true, message: 'Regra CRM salva.', rule: rule })
    else
      json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método GET ou POST.'))
    end
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, email_read_error(e.message))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("crm rules erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível carregar as regras CRM.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/crm/tag-rules', &crm_rules_handler
server.mount_proc '/api/master/crm/tag-rules/', &crm_rules_handler

crm_tenant_tags_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end
    next json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método POST.')) unless req.request_method == 'POST'
    result = apply_crm_tag_to_tenant!(read_json(req))
    json_response_cors(req, res, 200, { ok: true, message: 'Tag CRM aplicada à conta.', result: result })
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, email_read_error(e.message))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("crm tenant tag erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível aplicar a tag CRM.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/crm/tenant-tags', &crm_tenant_tags_handler
server.mount_proc '/api/master/crm/tenant-tags/', &crm_tenant_tags_handler

crm_run_tag_rules_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end
    next json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método POST.')) unless req.request_method == 'POST'
    result = run_crm_tag_rules_payload!(read_json(req))
    json_response_cors(req, res, 200, { ok: true, message: 'Regras CRM executadas para validação local.', result: result })
  rescue WEBrick::HTTPStatus::BadRequest => e
    json_response_cors(req, res, 400, email_read_error(e.message))
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("crm run tag rules erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível executar as regras CRM.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/crm/run-tag-rules', &crm_run_tag_rules_handler
server.mount_proc '/api/master/crm/run-tag-rules/', &crm_run_tag_rules_handler

email_logs_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_read_error('Endpoint restrito ao Master local.'))
    end
    unless req.request_method == 'GET'
      next json_response_cors(req, res, 405, email_read_error('Endpoint existe, mas exige método GET.'))
    end

    json_response_cors(req, res, 200, {
      ok: true,
      logs: load_email_logs_payload
    })
  rescue => e
    debug = email_settings_debug(e)
    log_email_settings("logs erro tecnico #{debug}")
    message = email_master_credential_error?(e) ? email_master_credential_message : 'Não foi possível carregar os logs de e-mail.'
    json_response_cors(req, res, 400, email_read_error(message, debug))
  end
end

server.mount_proc '/api/master/email/logs', &email_logs_handler
server.mount_proc '/api/master/email/logs/', &email_logs_handler

email_send_test_handler = proc do |req, res|
  apply_cors_headers(res, req['Origin'] || req['origin'])
  log_email_test("rota chamada method=#{req.request_method} path=#{req.path} host=#{req.host}")
  if req.request_method == 'OPTIONS'
    res.status = 204
    res.body = ''
    next
  end

  begin
    unless local_master_request?(req)
      next json_response_cors(req, res, 403, email_send_error('Endpoint restrito ao Master local.'))
    end
    unless req.request_method == 'POST'
      next json_response_cors(req, res, 405, email_send_error('Endpoint existe, mas exige método POST.'))
    end

    body = read_json(req)
    to = body['to'].to_s.strip.downcase
    template_key = body['templateKey'].to_s.strip.empty? ? 'test_email' : body['templateKey'].to_s.strip
    log_email_test("destinatario=#{to} templateKey=#{template_key}")
    json_response_cors(req, res, 200, send_test_email!(body))
  rescue WEBrick::HTTPStatus::BadRequest, WEBrick::HTTPStatus::NotFound => e
    debug = email_send_debug(e)
    log_email_test("erro validacao #{debug}")
    json_response_cors(req, res, 400, email_send_error('Não foi possível enviar o e-mail de teste.', e.message))
  rescue => e
    debug = email_send_debug(e)
    log_email_test("erro tecnico #{debug}")
    json_response_cors(req, res, 400, email_send_error('Não foi possível enviar o e-mail de teste.', debug))
  end
end

server.mount_proc '/api/master/email/send-test', &email_send_test_handler
server.mount_proc '/api/master/email/send-test/', &email_send_test_handler

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
