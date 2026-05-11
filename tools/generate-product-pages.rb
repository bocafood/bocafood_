require 'cgi'
require 'fileutils'
require 'json'
require 'optparse'
require 'time'
require 'uri'

module ProductPageGenerator
  module_function

  def read_json(path, fallback)
    return fallback unless File.file?(path)
    JSON.parse(File.read(path, encoding: 'UTF-8'))
  rescue StandardError
    fallback
  end

  def extract_embedded_json(html, start_marker, end_marker, fallback)
    match = html.match(/#{Regexp.escape(start_marker)}(.*?)#{Regexp.escape(end_marker)}/m)
    return fallback unless match
    JSON.parse(match[1])
  rescue StandardError
    fallback
  end

  def normalize_text(value)
    CGI.escapeHTML(value.to_s)
  end

  def normalize_slug(value)
    text = value.to_s.strip
    return 'produto' if text.empty?
    text = text.unicode_normalize(:nfkd) if text.respond_to?(:unicode_normalize)
    text = text.to_s.downcase.gsub(/[\u0300-\u036f]/, '')
    text = text.gsub(/[^a-z0-9\s-]/, '')
    text = text.strip.gsub(/\s+/, '-').gsub(/-+/, '-')
    text.empty? ? 'produto' : text
  end

  def euro(value)
    num = value.to_f
    format('€ %.2f', num).gsub('.', ',')
  end

  def money_to_f(value)
    str = value.to_s.strip
    return 0.0 if str.empty?
    cleaned = str.gsub(/[^\d,.\-]/, '')
    return 0.0 if cleaned.empty?
    if cleaned.include?(',') && cleaned.rindex(',') && (!cleaned.rindex('.') || cleaned.rindex(',') > cleaned.rindex('.'))
      cleaned = cleaned.tr('.', '').tr(',', '.')
    else
      cleaned = cleaned.tr(',', '')
    end
    cleaned.to_f
  end

  def category_map(categories)
    map = {}
    Array(categories).each do |cat|
      next unless cat.is_a?(Hash)
      label = cat['name'].to_s.strip
      label = cat['title'].to_s.strip if label.empty?
      label = cat['label'].to_s.strip if label.empty?
      key = cat['slug'].to_s.strip
      map[key.downcase] = label unless key.empty?
      key = cat['id'].to_s.strip
      map[key.downcase] = label unless key.empty?
      key = cat['name'].to_s.strip
      map[key.downcase] = label unless key.empty?
      key = normalize_slug(label)
      map[key.downcase] = label unless key.empty?
    end
    map
  end

  def category_label(product, categories)
    map = category_map(categories)
    raw = product['categoryId'] || product['categorySlug'] || product['category']
    key = raw.to_s.strip.downcase
    return map[key] if map[key]
    label = raw.to_s.strip
    return '' if label.empty?
    label.tr('-', ' ').split.map(&:capitalize).join(' ')
  end

  def product_image_url(product, base_url, kind = :main)
    sources = case kind.to_sym
    when :card
      ['imageCardUrl', 'cardImageUrl', 'imageUrl', 'imageMainUrl', 'imageThumbUrl', 'thumbUrl', 'img', 'image', 'photoUrl', 'imageBase64']
    when :thumb
      ['imageThumbUrl', 'thumbUrl', 'imageCardUrl', 'cardImageUrl', 'imageUrl', 'imageMainUrl', 'img', 'image', 'photoUrl', 'imageBase64']
    else
      ['imageUrl', 'imageMainUrl', 'imageCardUrl', 'cardImageUrl', 'imageThumbUrl', 'thumbUrl', 'img', 'image', 'photoUrl', 'imageBase64']
    end
    img = ''
    sources.each do |key|
      img = product[key].to_s.strip
      next if img.empty?
      break
    end
    return '' if img.empty?
    return img if img.start_with?('data:', 'http://', 'https://')
    return "#{base_url}#{img}" if img.start_with?('/')
    base_url.empty? ? img : "#{base_url}/#{img}"
  end

  def preferred_share_image(product, base_url, logo_url)
    img = product_image_url(product, base_url)
    return img unless img.start_with?('data:')
    return logo_url.to_s.strip unless logo_url.to_s.strip.empty?
    img
  end

  def product_description(product)
    [
      product['seoDesc'],
      product['seoDescription'],
      product['fullDesc'],
      product['description'],
      product['shortDesc'],
      product['desc']
    ].map { |v| v.to_s.strip }.find { |v| !v.empty? } || ''
  end

  def product_name(product)
    product['name'].to_s.strip
  end

  def product_price(product)
    money_to_f(product['price'])
  end

  def public_product?(product)
    return false if product.nil?
    return false if product['menuVisible'] == false || product['visible'] == false || product['hidden'] == true
    return false if product['draft'] == true || product['isDraft'] == true || product['test'] == true || product['isTest'] == true
    status = product['status'].to_s.downcase.strip
    return false if %w[inactive inativo oculto archived archive draft test rascunho].include?(status)
    return false if product_price(product) <= 0
    img = product_image_url(product, '', :main)
    return false if img.to_s.strip.empty?
    true
  end

  def filter_for_tenant(products, tenant_id)
    return Array(products) if tenant_id.to_s.strip.empty?
    tenant_key = tenant_id.to_s.strip
    scoped = Array(products).select do |product|
      [product['tenantId'], product['lojaId'], product['tenant_id']].compact.map(&:to_s).include?(tenant_key)
    end
    scoped.empty? ? Array(products) : scoped
  end

  def uniquify_products(products)
    seen = {}
    Array(products).map do |product|
      item = product.is_a?(Hash) ? product.dup : {}
      raw_slug = item['slug'].to_s.strip
      raw_slug = normalize_slug(item['name']) if raw_slug.empty?
      slug = raw_slug.empty? ? 'produto' : raw_slug
      base = slug
      seq = 2
      while seen[slug.downcase]
        slug = "#{base}-#{seq}"
        seq += 1
      end
      seen[slug.downcase] = true
      item['slug'] = slug
      item
    end
  end

  def whatsapp_digits(value)
    value.to_s.gsub(/\D/, '')
  end

  def whatsapp_url(number, message)
    digits = whatsapp_digits(number)
    return '' if digits.empty?
    "https://wa.me/#{digits}?text=#{URI.encode_www_form_component(message)}"
  end

  def build_page_url(base_url, slug)
    "#{base_url}/produtos/#{slug}/"
  end

  def sanitize_public_url(value)
    url = value.to_s.strip
    return '' if url.empty?
    return '' if url.start_with?('file:')
    return '' if url =~ %r{\Ahttps?://localhost}i
    url
  end

  def tenant_fallback(root, tenant_id)
    store_path = File.join(root, '.master-store.json')
    store = read_json(store_path, { 'tenants' => [] })
    tenants = Array(store['tenants'])
    return {} if tenants.empty?
    tenant = if tenant_id.to_s.strip.empty?
      tenants.first
    else
      tenants.find { |row| row.is_a?(Hash) && row['id'].to_s == tenant_id.to_s } || tenants.first
    end
    tenant.is_a?(Hash) ? tenant : {}
  end

  def tenant_base_url(tenant, repo_fallback = '')
    domain = sanitize_public_url(tenant['domain'])
    domain = sanitize_public_url(tenant['storeUrl']) if domain.empty?
    return domain.sub(%r{/\z}, '') unless domain.empty?
    repo = tenant['githubRepo'].to_s.strip
    repo = repo_fallback.to_s.strip if repo.empty?
    return '' if repo.empty? || !repo.include?('/')
    owner, name = repo.split('/', 2)
    "https://#{owner}.github.io/#{name}"
  end

  def render_product_page(product, context)
    base_url = context[:base_url].to_s.sub(%r{/\z}, '')
    store_name = context[:store_name]
    home_url = "#{base_url}/"
    product_name_text = product_name(product)
    description = product_description(product)
    category = category_label(product, context[:categories])
    image_url = product_image_url(product, base_url, :main)
    share_image = preferred_share_image(product, base_url, context[:logo_url])
    price = product_price(product)
    price_text = euro(price)
    page_url = build_page_url(base_url, product['slug'])
    availability_url = 'https://schema.org/InStock'
    title = "#{product_name_text} | #{store_name}"
    meta_desc = description.empty? ? "#{product_name_text} disponível na loja #{store_name}." : description
    wa_message = "Hola, quiero pedir #{product_name_text} en #{store_name}. Vi la página: #{page_url}"
    wa_link = whatsapp_url(context[:whatsapp], wa_message)
    back_link = context[:home_url].to_s.strip.empty? ? home_url : context[:home_url]
    image_block = if image_url.empty?
      '<div style="width:100%;min-height:320px;border-radius:28px;background:linear-gradient(180deg,#FFF6F4,#FFF);display:flex;align-items:center;justify-content:center;color:#C4362A;font-weight:800;">Sin imagen</div>'
    else
      '<img src="' + normalize_text(image_url) + '" alt="' + normalize_text("#{product_name_text} - #{store_name}") + '" style="width:100%;height:100%;object-fit:cover;display:block;">'
    end
    json_ld = {
      '@context' => 'https://schema.org',
      '@type' => 'Product',
      'name' => product_name_text,
      'image' => [share_image].reject { |v| v.to_s.strip.empty? },
      'description' => description.empty? ? meta_desc : description,
      'offers' => {
        '@type' => 'Offer',
        'price' => format('%.2f', price),
        'priceCurrency' => 'EUR',
        'availability' => availability_url,
        'url' => page_url
      },
      'seller' => {
        '@type' => 'Organization',
        'name' => store_name
      }
    }

    <<~HTML
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>#{normalize_text(title)}</title>
        <meta name="description" content="#{normalize_text(meta_desc)}">
        <meta name="robots" content="index,follow">
        <link rel="canonical" href="#{normalize_text(page_url)}">
        <meta property="og:type" content="product">
        <meta property="og:title" content="#{normalize_text(title)}">
        <meta property="og:description" content="#{normalize_text(meta_desc)}">
        #{"<meta property=\"og:image\" content=\"#{normalize_text(share_image)}\">" unless share_image.to_s.strip.empty?}
        <meta property="og:url" content="#{normalize_text(page_url)}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="#{normalize_text(title)}">
        <meta name="twitter:description" content="#{normalize_text(meta_desc)}">
        #{"<meta name=\"twitter:image\" content=\"#{normalize_text(share_image)}\">" unless share_image.to_s.strip.empty?}
        <script type="application/ld+json">#{JSON.generate(json_ld)}</script>
        <style>
          :root{--brand:#C4362A;--ink:#251E1D;--muted:#7A6E6C;--line:#E8E1DE;--bg:#FCFBFA}
          *{box-sizing:border-box}
          html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
          a{color:inherit;text-decoration:none}
          .wrap{max-width:1120px;margin:0 auto;padding:24px}
          .topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:28px}
          .brand{display:flex;align-items:center;gap:12px;min-width:0}
          .brand-badge{width:44px;height:44px;border-radius:14px;background:#FFF0EE;color:var(--brand);display:flex;align-items:center;justify-content:center;font-weight:900}
          .eyebrow{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
          .title{margin:4px 0 0;font-size:28px;line-height:1.08}
          .home{padding:12px 16px;border:1px solid var(--line);border-radius:999px;font-size:13px;font-weight:700;background:#fff}
          .hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:28px;align-items:start}
          .image-card{border-radius:30px;overflow:hidden;min-height:420px;background:#fff;border:1px solid var(--line);box-shadow:0 18px 40px rgba(28,18,16,.08)}
          .info{padding:6px 0}
          .chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
          .chip{padding:7px 11px;border-radius:999px;background:#F8F1EF;color:var(--brand);font-size:12px;font-weight:800}
          .chip.gray{background:#F2F0EF;color:#5E5654}
          h1{margin:0 0 10px;font-size:40px;line-height:1.03}
          .price{font-size:36px;font-weight:900;color:var(--brand);margin:0 0 14px}
          .desc{font-size:17px;line-height:1.6;color:var(--muted);margin:0 0 22px}
          .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:22px}
          .meta-card{padding:14px 16px;border:1px solid var(--line);border-radius:18px;background:#fff}
          .meta-card .k{display:block;font-size:11px;font-weight:800;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
          .meta-card .v{font-size:15px;font-weight:800}
          .actions{display:flex;flex-wrap:wrap;gap:12px}
          .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 18px;border-radius:14px;font-weight:800;font-size:14px}
          .btn.primary{background:var(--brand);color:#fff}
          .btn.secondary{background:#fff;border:1px solid var(--line);color:var(--ink)}
          .footer{margin-top:28px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:16px;align-items:center;color:var(--muted);font-size:13px}
          @media (max-width:960px){.hero{grid-template-columns:1fr}.image-card{min-height:320px}h1{font-size:32px}.price{font-size:30px}}
          @media (max-width:640px){.wrap{padding:16px}.topbar{flex-direction:column;align-items:flex-start}.meta{grid-template-columns:1fr}.actions{flex-direction:column}.btn{width:100%}}
        </style>
      </head>
      <body>
        <div class="wrap">
          <header class="topbar">
            <div class="brand">
              <div class="brand-badge">#{normalize_text(store_name.to_s[0, 1].to_s.upcase.empty? ? '•' : store_name.to_s[0, 1].to_s.upcase)}</div>
              <div style="min-width:0">
                <div class="eyebrow">#{normalize_text(store_name)}</div>
                <div style="font-size:13px;color:var(--muted);font-weight:700;margin-top:4px">Página pública del producto</div>
              </div>
            </div>
            <a class="home" href="#{normalize_text(back_link)}">Volver al menú</a>
          </header>

          <main class="hero">
            <section class="image-card">#{image_block}</section>
            <section class="info">
              <div class="chips">
                <span class="chip">#{normalize_text(category.empty? ? 'Producto' : category)}</span>
                <span class="chip gray">Disponible</span>
              </div>
              <h1>#{normalize_text(product_name_text)}</h1>
              <div class="price">#{normalize_text(price_text)}</div>
              <p class="desc">#{normalize_text(meta_desc)}</p>

              <div class="meta">
                <div class="meta-card"><span class="k">Disponibilidad</span><span class="v">Disponible</span></div>
                <div class="meta-card"><span class="k">Categoría</span><span class="v">#{normalize_text(category.empty? ? 'Sin categoría' : category)}</span></div>
                <div class="meta-card"><span class="k">Tienda</span><span class="v">#{normalize_text(store_name)}</span></div>
                <div class="meta-card"><span class="k">URL</span><span class="v" style="word-break:break-all">#{normalize_text(page_url)}</span></div>
              </div>

              <div class="actions">
                #{"<a class=\"btn primary\" href=\"#{normalize_text(wa_link)}\" target=\"_blank\" rel=\"noopener\">Pedir por WhatsApp</a>" unless wa_link.empty?}
                <a class="btn secondary" href="#{normalize_text(back_link)}">Volver al cardápio</a>
              </div>
            </section>
          </main>

          <footer class="footer">
            <span>#{normalize_text(store_name)}</span>
            <span>#{normalize_text(product_name_text)}</span>
          </footer>
        </div>
      </body>
      </html>
    HTML
  end

  def write_file(path, content)
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, content, encoding: 'UTF-8')
  end

  def generate(root:, output_root: nil, products_path: nil, index_path: nil, tenant_id: nil, base_url: nil, store_name: nil, whatsapp: nil)
    root = File.expand_path(root)
    output_root = File.expand_path(output_root || root)
    products_path = File.expand_path(products_path || File.join(root, 'produtos.json'))
    index_path = File.expand_path(index_path || File.join(root, 'index.html'))

    index_html = File.file?(index_path) ? File.read(index_path, encoding: 'UTF-8') : ''
    cfg = extract_embedded_json(index_html, '/*[[BOCA_CFG_START]]*/', '/*[[BOCA_CFG_END]]*/', {})
    source_products = if File.file?(products_path)
      read_json(products_path, [])
    else
      extract_embedded_json(index_html, '/*[[BOCA_PROD_START]]*/', '/*[[BOCA_PROD_END]]*/', [])
    end

    categories = Array(cfg['categories'])
    logo_url = cfg['logoUrl'].to_s.strip
    tenant_cfg = tenant_fallback(root, tenant_id)
    whatsapp = whatsapp.to_s.strip.empty? ? cfg['whatsapp'].to_s.strip : whatsapp.to_s.strip
    whatsapp = whatsapp.empty? ? cfg['integracoes'].to_h.fetch('whatsapp', '').to_s.strip : whatsapp
    whatsapp = whatsapp.empty? ? tenant_cfg['whatsapp'].to_s.strip : whatsapp
    whatsapp = whatsapp.empty? ? tenant_cfg['phone'].to_s.strip : whatsapp
    whatsapp = whatsapp.empty? ? index_html[/PHONE='([^']+)'/, 1].to_s.gsub(/\D/, '') : whatsapp
    store_name = store_name.to_s.strip.empty? ? (
      tenant_cfg['businessName'].to_s.strip.empty? ? (
        tenant_cfg['name'].to_s.strip.empty? ? (cfg['storeName'].to_s.strip.empty? ? 'Loja' : cfg['storeName'].to_s.strip) : tenant_cfg['name'].to_s.strip
      ) : tenant_cfg['businessName'].to_s.strip
    ) : store_name.to_s.strip
    base_url = base_url.to_s.strip
    base_url = sanitize_public_url(cfg['siteUrl']) if base_url.empty?
    base_url = tenant_base_url(tenant_cfg, tenant_cfg['githubRepo'].to_s.strip) if base_url.empty?
    base_url = base_url.sub(%r{/\z}, '') unless base_url.empty?
    base_url = "https://#{base_url}" if !base_url.empty? && !base_url.match?(%r{\Ahttps?://}i)
    base_url = 'http://localhost' if base_url.empty?

    filtered_products = filter_for_tenant(source_products, tenant_id)
    normalized_products = uniquify_products(filtered_products)
    FileUtils.mkdir_p(output_root)
    write_file(products_path, JSON.pretty_generate(normalized_products))

    products_dir = File.join(output_root, 'produtos')
    FileUtils.rm_rf(products_dir)
    FileUtils.mkdir_p(products_dir)

    public_pages = 0
    public_urls = []

    normalized_products.each do |product|
      next unless public_product?(product)
      slug = product['slug'].to_s.strip
      next if slug.empty?
      page_path = File.join(products_dir, slug, 'index.html')
      write_file(page_path, render_product_page(product, {
        base_url: base_url,
        store_name: store_name,
        whatsapp: whatsapp,
        categories: categories,
        logo_url: logo_url,
        home_url: "#{base_url}/"
      }))
      public_pages += 1
      public_urls << build_page_url(base_url, slug)
    end

    sitemap = []
    sitemap << "#{base_url}/"
    public_urls.each { |url| sitemap << url }
    sitemap_xml = +"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
    sitemap_xml << "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
    sitemap.uniq.each do |url|
      sitemap_xml << "  <url>\n"
      sitemap_xml << "    <loc>#{CGI.escapeHTML(url)}</loc>\n"
      sitemap_xml << "    <changefreq>weekly</changefreq>\n"
      sitemap_xml << "    <priority>#{url.end_with?('/') && url == "#{base_url}/" ? '1.0' : '0.8'}</priority>\n"
      sitemap_xml << "  </url>\n"
    end
    sitemap_xml << "</urlset>\n"
    write_file(File.join(output_root, 'sitemap.xml'), sitemap_xml)

    robots = +"User-agent: *\nAllow: /\nSitemap: #{base_url}/sitemap.xml\n"
    write_file(File.join(output_root, 'robots.txt'), robots)

    {
      'ok' => true,
      'root' => root,
      'outputRoot' => output_root,
      'baseUrl' => base_url,
      'storeName' => store_name,
      'tenantId' => tenant_id,
      'productsCount' => normalized_products.length,
      'publicProductsCount' => normalized_products.count { |product| public_product?(product) },
      'pagesCount' => public_pages,
      'sitemapUrlsCount' => sitemap.uniq.length,
      'productsFile' => products_path,
      'sitemapFile' => File.join(output_root, 'sitemap.xml'),
      'robotsFile' => File.join(output_root, 'robots.txt')
    }
  end
end

if __FILE__ == $0
  options = {
    root: File.expand_path(File.join(__dir__, '..')),
    output_root: nil,
    products_path: nil,
    index_path: nil,
    tenant_id: nil,
    base_url: nil,
    store_name: nil,
    whatsapp: nil
  }

  OptionParser.new do |opts|
    opts.banner = 'Usage: ruby tools/generate-product-pages.rb [options]'
    opts.on('--root PATH', 'Project root') { |v| options[:root] = File.expand_path(v) }
    opts.on('--output-root PATH', 'Output root') { |v| options[:output_root] = File.expand_path(v) }
    opts.on('--products PATH', 'Products JSON path') { |v| options[:products_path] = File.expand_path(v) }
    opts.on('--index PATH', 'Index HTML path') { |v| options[:index_path] = File.expand_path(v) }
    opts.on('--tenant-id ID', 'Tenant/loja ID') { |v| options[:tenant_id] = v }
    opts.on('--base-url URL', 'Base public URL') { |v| options[:base_url] = v }
    opts.on('--store-name NAME', 'Store name') { |v| options[:store_name] = v }
    opts.on('--whatsapp PHONE', 'Store WhatsApp phone') { |v| options[:whatsapp] = v }
  end.parse!

  result = ProductPageGenerator.generate(
    root: options[:root],
    output_root: options[:output_root] || options[:root],
    products_path: options[:products_path] || File.join(options[:root], 'produtos.json'),
    index_path: options[:index_path] || File.join(options[:root], 'index.html'),
    tenant_id: options[:tenant_id],
    base_url: options[:base_url],
    store_name: options[:store_name],
    whatsapp: options[:whatsapp]
  )

  puts JSON.pretty_generate(result)
end
