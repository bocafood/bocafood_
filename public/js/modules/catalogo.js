// js/modules/catalogo.js
window.Modules = window.Modules || {};
Modules.Catalogo = (function () {
  'use strict';

  var _activeSub = 'produtos';
  var _products = [];
  var _categories = [];
  var _variants = [];
  var _fichas = [];
  var _produtosProntos = [];
  var _stockCompositionItems = [];
  var _baseCompositionItems = [];
  var _tags = [];
  var _promotions = [];
  var _coupons = [];
  var _orders = [];
  var _recipeCategories = [];
  var _recipeComponents = [];
  var _recipeUnits = [];
  var _fichaPag = { page: 1, perPage: 10 };
  var _fichaFilters = { q: '' };
  var _editingId = null;
  var _deliveryZonesDraft = [];
  var _deliveryZonesDraftDirty = false;
  var _templateActiveTab = 'identidade';
  var _productFilters = { category: 'todas', visibility: 'todos', type: 'todos', promo: 'todos' };
  var _productView = { page: 1, pageSize: 12, sort: 'order', mode: 'list' };
  var _salesFilters = { q: '', period: '90', channel: 'todos', type: 'todos' };
  var _salesView = { page: 1, pageSize: 25 };
  var _salesSearchTimer = null;
  var _salesChannels = [];
  var _performanceTab = 'resumo';
  var _catalogForecastData = { products: [], recipes: [], movements: [], variantGroups: [], readyItems: [], categories: [] };
  var _catalogForecastFilters = { q: '', status: 'todos' };
  var _catalogForecastView = { page: 1, pageSize: 25 };
  var _catalogForecastSearchTimer = null;
  var _productSearchQuery = '';
  var _productSearchTimer = null;
  var _cfgSub = 'categorias';
  var _storeConfig = {};
  var _recipeConfig = { indirectCostPercent: 0 };
  var _fiscalConfig = {};
  var _financeSaidas = [];
  var _financeApagar = [];
  var _stockMovements = [];
  var USE_FIREBASE_STORAGE_UPLOAD = true;

  function _newEntityId(prefix) {
    var safePrefix = prefix || 'entity';
    return safePrefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function firstText() {
    for (var i = 0; i < arguments.length; i += 1) {
      if (typeof arguments[i] === 'string' && arguments[i].trim()) return arguments[i].trim();
      if (arguments[i] !== null && arguments[i] !== undefined && typeof arguments[i] !== 'object' && String(arguments[i]).trim()) return String(arguments[i]).trim();
    }
    return '';
  }

  function _metricIconSVG(name) {
    var stroke = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"';
    var baseStyle = 'width:26px;height:26px;display:block;';
    if (name === 'inventory_2') {
      return '<svg viewBox="0 0 24 24" style="' + baseStyle + '" aria-hidden="true"><path d="M4 7.5 12 4l8 3.5v8L12 19l-8-3.5z" ' + stroke + '></path><path d="M4 7.5 12 11l8-3.5"></path><path d="M12 11v8"></path></svg>';
    }
    if (name === 'category') {
      return '<svg viewBox="0 0 24 24" style="' + baseStyle + '" aria-hidden="true"><rect x="5" y="5" width="5" height="5" rx="1.5" ' + stroke + '></rect><rect x="14" y="5" width="5" height="5" rx="1.5" ' + stroke + '></rect><rect x="5" y="14" width="5" height="5" rx="1.5" ' + stroke + '></rect><path d="M14 14h5v5h-5z" ' + stroke + '></path></svg>';
    }
    if (name === 'visibility') {
      return '<svg viewBox="0 0 24 24" style="' + baseStyle + '" aria-hidden="true"><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" ' + stroke + '></path><circle cx="12" cy="12" r="2.5" ' + stroke + '></circle></svg>';
    }
    if (name === 'receipt_long') {
      return '<svg viewBox="0 0 24 24" style="' + baseStyle + '" aria-hidden="true"><rect x="4.5" y="5" width="15" height="14" rx="3" ' + stroke + '></rect><path d="M8 5V3.5"></path><path d="M16 5V3.5"></path><path d="M8 10h8"></path><path d="M8 14h5"></path><circle cx="16.5" cy="16.5" r="2" ' + stroke + '></circle></svg>';
    }
    return '<svg viewBox="0 0 24 24" style="' + baseStyle + ';opacity:.85" aria-hidden="true"><circle cx="12" cy="12" r="8" ' + stroke + '></circle></svg>';
  }

  function _imageUrlFor(p, kind) {
    p = p || {};
    if (kind === 'thumb') return p.imageThumbUrl || p.thumbnailUrl || p.imageCardUrl || p.cardImageUrl || p.imageUrl || p.imageBase64 || p.img || p.photoUrl || p.image || '';
    if (kind === 'card') return p.imageCardUrl || p.cardImageUrl || p.imageUrl || p.imageBase64 || p.img || p.photoUrl || p.image || '';
    return p.imageUrl || p.imageMainUrl || p.imageCardUrl || p.cardImageUrl || p.imageThumbUrl || p.imageBase64 || p.img || p.photoUrl || p.image || '';
  }

  function _imageUploadTip(kind) {
    if (kind === 'logo') {
      return 'Aceita JPG, JPEG, PNG ou WebP. O sistema ajusta para 500x500 px e otimiza em WebP. Se não subir, o motivo aparece na mensagem do sistema.';
    }
    if (kind === 'banner') {
      return 'Aceita JPG, JPEG, PNG ou WebP. O sistema ajusta para 1200x600 px e otimiza em WebP. Se não subir, o motivo aparece na mensagem do sistema.';
    }
    return 'Aceita JPG, JPEG, PNG ou WebP. O sistema otimiza automaticamente em WebP e gera 800x800, 500x500 e 150x150 px. Se não subir, o motivo aparece na mensagem do sistema.';
  }

  function _productImageErrorMessage(err) {
    var raw = String((err && err.message) || err || '').toLowerCase();
    if (raw.indexOf('timeout') >= 0 || raw.indexOf('tempo') >= 0 || raw.indexOf('expir') >= 0) {
      return 'Não conseguimos enviar a foto. Tente novamente.';
    }
    if (raw.indexOf('formato') >= 0 || raw.indexOf('arquivo') >= 0 || raw.indexOf('pesada') >= 0 || raw.indexOf('tamanho') >= 0) {
      return 'Não conseguimos usar essa imagem. Envie uma foto em JPG, PNG ou WebP.';
    }
    return 'Erro ao enviar imagem. Tente novamente.';
  }

  function _legacyImageUploadBaseUrl() {
    var host = (window.location && window.location.hostname) || 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://' + host + ':3000';
    return (window.location && window.location.origin) || '';
  }

  function _legacyImageUploadPaths() {
    return [
      '/api/master/product-image/upload',
      '/api/master/upload-product-image',
      '/api/product-image/upload'
    ];
  }

  function _uploadProductImageLegacy(file, meta) {
    var tenantId = meta && meta.tenantId ? String(meta.tenantId) : '';
    var productId = meta && meta.productId ? String(meta.productId) : '';
    if (!tenantId) throw new Error('Tenant não encontrado.');
    if (!productId) throw new Error('Produto não encontrado.');

    var name = String(file && file.name || '').trim().toLowerCase();
    var mime = String(file && file.type || '').toLowerCase();
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mime) && !/\.(jpe?g|png|webp)$/.test(name)) {
      throw new Error('Não conseguimos usar essa imagem. Envie uma foto em JPG, PNG ou WebP.');
    }

    var baseUrl = _legacyImageUploadBaseUrl();
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = null;
    var route = _legacyImageUploadPaths()[0];
    var form = new FormData();
    form.append('tenantId', tenantId);
    form.append('productId', productId);
    form.append('file', file, file.name || ('produto-' + Date.now() + '.png'));

    console.info('[Catalogo] legacy product image upload start', {
      tenantId: tenantId,
      productId: productId,
      fileName: file.name || '',
      fileType: file.type || '',
      route: baseUrl + route
    });

    var req = fetch(baseUrl + route, {
      method: 'POST',
      mode: 'cors',
      body: form,
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      return res.text().then(function (txt) {
        var data = {};
        try { data = txt ? JSON.parse(txt) : {}; } catch (e) {}
        console.info('[Catalogo] legacy product image upload response', {
          status: res.status,
          ok: res.ok,
          body: data
        });
        if (!res.ok || !data.ok) {
          throw new Error((data && data.error) || 'Não conseguimos publicar a imagem. Tente novamente.');
        }
        return data;
      });
    });

    var timed = new Promise(function (_, reject) {
      timeoutId = setTimeout(function () {
        if (controller) {
          try { controller.abort(); } catch (e) {}
        }
        reject(new Error('Não conseguimos publicar a imagem. Tente novamente.'));
      }, 60000);
    });

    return Promise.race([req, timed]).then(function (result) {
      if (timeoutId) clearTimeout(timeoutId);
      console.info('[Catalogo] legacy product image url received', {
        productId: productId,
        imageUrl: result && result.imageUrl ? result.imageUrl : ''
      });
      return {
        imageUrl: result.imageUrl || '',
        imagePath: result.imageStoragePath || '',
        imageCardUrl: result.imageCardUrl || result.imageUrl || '',
        imageThumbUrl: result.imageThumbUrl || result.imageCardUrl || result.imageUrl || '',
        imageStoragePath: result.imageStoragePath || '',
        imageWidth: null,
        imageHeight: null,
        imageSizeKb: null,
        imageFormat: 'raw',
        storageMode: 'github'
      };
    }, function (err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    });
  }

  var TABS = [
    { key: 'produtos', label: 'Produtos' },
    { key: 'vendas', label: 'Desempenho' },
    { key: 'previsao', label: 'Previsão' },
    { key: 'configuracoes', label: 'Configurações' }
  ];

  function render(sub) {
    _activeSub = sub || 'produtos';
    var app = document.getElementById('app');
    app.innerHTML = '<div id="catalogo-root" style="display:flex;flex-direction:column;height:100%;">' +
      '<div id="catalogo-content" style="flex:1;overflow-y:auto;padding:24px;"></div>' +
      '</div>';

    _bindCatalogRootActions();
    _loadSub(_activeSub);
  }

  function _bindCatalogRootActions() {
    var root = document.getElementById('catalogo-root');
    if (!root || root.__bfActionsBound) return;
    root.__bfActionsBound = true;
    root.addEventListener('click', function (ev) {
      var target = ev.target && ev.target.closest ? ev.target.closest('[data-save-template-loja="1"],[data-save-seo-loja="1"],[data-delivery-zone-add="1"],[data-delivery-zone-remove]') : null;
      if (!target) return;
      ev.preventDefault();
      if (target.hasAttribute('data-save-template-loja')) _saveTemplateLoja();
      if (target.hasAttribute('data-save-seo-loja')) _saveSeoLoja();
      if (target.hasAttribute('data-delivery-zone-add')) _addDeliveryZoneRow();
      if (target.hasAttribute('data-delivery-zone-remove')) _removeDeliveryZoneRow(target.getAttribute('data-delivery-zone-remove'));
    });
  }

  function _renderTabs() {
    var el = document.getElementById('catalogo-tabs');
    if (!el) return;
    el.innerHTML = TABS.map(function (t) {
      if (t.section) {
        return '<span style="align-self:center;margin:0 8px 0 18px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#B9AAA6;">' + t.section + '</span>';
      }
      var active = t.key === _activeSub;
      return '<button data-key="' + t.key + '" onclick="Modules.Catalogo._switchSub(\'' + t.key + '\')" style="padding:12px 18px;border:none;background:transparent;font-size:13px;font-weight:700;cursor:pointer;border-bottom:3px solid ' + (active ? '#B42318' : 'transparent') + ';color:' + (active ? '#B42318' : '#8A7E7C') + ';font-family:inherit;transition:all .15s;white-space:nowrap;">' + t.label + '</button>';
    }).join('');
  }

  function _switchSub(key) {
    _activeSub = key;
    _renderTabs();
    _loadSub(key);
    Router.navigate('catalogo/' + key);
  }

  function _loadSub(key) {
    var content = document.getElementById('catalogo-content');
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7E7C;">Carregando...</div>';
    if (key === 'produtos') _renderProdutos();
    else if (key === 'vendas') _renderVendasCardapio();
    else if (key === 'previsao') _renderPrevisaoCardapio();
    else if (key === 'avaliacoes') _renderAvaliacoes();
    else if (key === 'template') { _deliveryZonesDraftDirty = false; _renderTemplateLoja(); }
    else if (key === 'seo') _renderSeoLoja();
    else if (key === 'configuracoes') _renderCatalogoConfiguracoes();
    else if (key === 'categorias') { _activeSub = 'configuracoes'; _cfgSub = 'categorias'; _renderTabs(); Router.navigate('catalogo/configuracoes'); _renderCatalogoConfiguracoes(); }
    else if (key === 'fichas') Router.navigate('receitas/receitas');
    else if (key === 'produtos_prontos') Router.navigate('compras/itens');
    else if (key === 'variantes') { _activeSub = 'configuracoes'; _cfgSub = 'variantes'; _renderTabs(); Router.navigate('catalogo/configuracoes'); _renderCatalogoConfiguracoes(); }
    else if (key === 'extras') Router.navigate('catalogo/variantes');
    else if (key === 'itens_custo') Router.navigate('compras/itens');
    else if (key === 'fichas') _renderFichas();
    else if (key === 'tags') { _activeSub = 'configuracoes'; _cfgSub = 'tags'; _renderTabs(); Router.navigate('catalogo/configuracoes'); _renderCatalogoConfiguracoes(); }
    else _renderProdutos();
  }

  function _renderAvaliacoes() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    if (window.Modules && Modules.Pedidos && typeof Modules.Pedidos._renderCatalogoAvaliacoes === 'function') {
      return Modules.Pedidos._renderCatalogoAvaliacoes('catalogo-content');
    }
    content.innerHTML = UI.emptyState('Avaliações indisponíveis', 'Não foi possível carregar a moderação de avaliações.');
  }

  // ── DRAG-TO-REORDER (Change K) ────────────────────────────────────────────
  function makeSortable(listEl, onReorder) {
    var dragging = null;
    [].slice.call(listEl.children).filter(function (child) {
      return child && child.matches && child.matches('[draggable]');
    }).forEach(function (el) {
      el.addEventListener('dragstart', function () { dragging = el; el.style.opacity = '.4'; });
      el.addEventListener('dragend', function () {
        el.style.opacity = '1';
        dragging = null;
        onReorder([].slice.call(listEl.children).filter(function (child) {
          return child && child.dataset && child.dataset.id;
        }).map(function (x, i) {
          return { id: x.dataset.id, order: i };
        }));
      });
      el.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (!dragging || dragging === el) return;
        var r = el.getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) listEl.insertBefore(dragging, el);
        else listEl.insertBefore(dragging, el.nextSibling);
      });
      el.addEventListener('drop', function (e) {
        e.preventDefault();
        onReorder([].slice.call(listEl.children).filter(function (child) {
          return child && child.dataset && child.dataset.id;
        }).map(function (x, i) {
          return { id: x.dataset.id, order: i };
        }));
      });
    });
  }

  // ── SLUG HELPER (Change E) ────────────────────────────────────────────────
  function _toSlug(str) {
    return String(str).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');
  }

  function _uniqueProductSlug(seed, editingId) {
    var base = _toSlug(seed || 'produto') || 'produto';
    var used = {};
    (_products || []).forEach(function (p) {
      if (editingId != null && String(p.id) === String(editingId)) return;
      var slug = String(p && p.slug ? p.slug : '').trim().toLowerCase();
      if (slug) used[slug] = true;
    });
    var slug = base;
    var n = 2;
    while (used[String(slug).toLowerCase()]) {
      slug = base + '-' + n;
      n += 1;
    }
    return slug;
  }

  // ── PRODUTOS ──────────────────────────────────────────────────────────────
  function _renderProdutos() {
    Promise.all([
      _loadStoreConfig().catch(function () { return {}; }),
      DB.getAll('products'),
      DB.getAll('categories'),
      DB.getAll('promotions'),
      DB.getAll('orders').catch(function () { return []; })
    ]).then(function (r) {
      _products = (r[1] || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      _categories = r[2] || [];
      _promotions = r[3] || [];
      _orders = r[4] || [];
      _paintProdutos();
    });
  }

  function _refreshProductPromotions() {
    if (_activeSub === 'produtos') {
      _renderProdutos();
      if (window._productModal) _refreshProductPreview();
      return;
    }
    DB.getAll('promotions').then(function (data) {
      _promotions = data || [];
      if (window._productModal) _refreshProductPreview();
    });
  }

  function _paintProdutos() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    var searchInput = document.getElementById('catalogo-product-search');
    var query = String(_productSearchQuery || '').trim();
    if (searchInput && searchInput.value !== _productSearchQuery) searchInput.value = _productSearchQuery;
    var visibleProducts = _filterProductList(query);
    var paging = _productPaging(visibleProducts);
    var listMode = (_productView.mode || 'list') !== 'grid';
    var filterCardStyle = 'background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.055);';
    var fieldStyle = 'padding:10px 12px;border:1px solid #E8DCD7;border-radius:12px;font-size:14px;font-family:inherit;outline:none;background:#FFFCF8;width:100%;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.82);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;';
    var selectFieldStyle = fieldStyle + 'appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:40px;';
    var selectArrowHtml = '<span class="mi" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:19px;color:#8A7E7C;pointer-events:none;">expand_more</span>';
    var labelStyle = 'font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;';
    var sortOptions = [
      { value: 'order', label: 'Ordem da loja pública' },
      { value: 'name-asc', label: 'Nome A-Z' },
      { value: 'name-desc', label: 'Nome Z-A' },
      { value: 'price-asc', label: 'Menor preço' },
      { value: 'price-desc', label: 'Maior preço' },
      { value: 'visible-first', label: 'Visíveis primeiro' }
    ].map(function (opt) { return '<option value="' + opt.value + '"' + (_productView.sort === opt.value ? ' selected' : '') + '>' + _esc(opt.label) + '</option>'; }).join('');
    var pageSizeOptions = [10, 12, 24, 48].map(function (n) { return '<option value="' + n + '"' + (Number(_productView.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('');
    var categoryOptions = '<option value="todas"' + (_productFilters.category === 'todas' ? ' selected' : '') + '>Todas as categorias</option>' +
      (_categories || []).slice().sort(function (a, b) { return String(a.name || a.label || '').localeCompare(String(b.name || b.label || '')); }).map(function (c) {
        var value = c.id || c.slug || c.name || '';
        return '<option value="' + _esc(value) + '"' + (_productFilters.category === String(value) ? ' selected' : '') + '>' + _esc(c.name || c.label || value || 'Categoria') + '</option>';
      }).join('');
    var clearFiltersHtml = (query || _hasActiveProductFilters() || _productView.sort !== 'order') ? '<div style="display:flex;justify-content:flex-start;margin-top:11px;"><button type="button" onclick="Modules.Catalogo._clearProductFilters()" style="height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>' : '';
    var filtersHtml = '<div style="' + filterCardStyle + '">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:11px 12px;align-items:end;">' +
          '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Buscar</span><input id="catalogo-product-search" type="search" value="' + _esc(query) + '" placeholder="Nome, descrição, tag ou categoria" autocomplete="off" autocapitalize="off" spellcheck="false" oninput="Modules.Catalogo._filterProdutos(this.value)" style="' + fieldStyle + 'height:42px;"></label>' +
          '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Categoria</span><span style="position:relative;display:block;"><select onchange="Modules.Catalogo._setProductFilter(\'category\',this.value)" style="' + selectFieldStyle + 'height:42px;">' + categoryOptions + '</select>' + selectArrowHtml + '</span></label>' +
          '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Visibilidade</span><span style="position:relative;display:block;"><select onchange="Modules.Catalogo._setProductFilter(\'visibility\',this.value)" style="' + selectFieldStyle + 'height:42px;">' +
            '<option value="todos"' + (_productFilters.visibility === 'todos' ? ' selected' : '') + '>Status: Todos</option><option value="visiveis"' + (_productFilters.visibility === 'visiveis' ? ' selected' : '') + '>Status: Visíveis</option><option value="ocultos"' + (_productFilters.visibility === 'ocultos' ? ' selected' : '') + '>Status: Ocultos</option></select>' + selectArrowHtml + '</span></label>' +
          '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Ordenar por</span><span style="position:relative;display:block;"><select onchange="Modules.Catalogo._setProductSort(this.value)" style="' + selectFieldStyle + 'height:42px;">' + sortOptions + '</select>' + selectArrowHtml + '</span></label>' +
          '<button type="button" onclick="Modules.Catalogo._openProductsMoreFilters()" style="height:42px;padding:0 14px;border:1px solid #EADFD8;border-radius:12px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;white-space:nowrap;">Mais filtros</button>' +
      '</div>' +
      clearFiltersHtml +
    '</div>';
    var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<span style="position:relative;display:inline-block;min-width:110px;max-width:110px;"><select onchange="Modules.Catalogo._setProductPageSize(this.value)" style="width:110px;height:34px;padding:0 34px 0 10px;border:1px solid #E8DCD7;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#FFFCF8;color:#6F6860;box-sizing:border-box;appearance:none;-webkit-appearance:none;-moz-appearance:none;">' + pageSizeOptions + '</select><span class="mi" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:18px;color:#8A7E7C;pointer-events:none;">expand_more</span></span>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Catalogo._setProductPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Catalogo._setProductPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>' : '';
    var bodyHtml = '';
    if (!visibleProducts.length) {
      bodyHtml = '<section style="' + filterCardStyle + 'text-align:center;padding:28px 18px;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:5px;">Nenhum produto encontrado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;max-width:420px;margin:0 auto 14px;">Ajuste a busca, limpe os filtros ou cadastre um novo produto para aparecer no cardápio.</div><button type="button" onclick="Modules.Catalogo._openProductModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);">Adicionar produto</button></section>';
    } else if (listMode) {
      bodyHtml = _productGroupedListHTML(visibleProducts, true);
    } else {
      bodyHtml = _productGroupedListHTML(visibleProducts, false);
    }
    content.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
      '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Produtos</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:720px;">Cadastre e organize os itens que aparecem no cardápio público da sua loja.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Catalogo._openImportProducts()" class="bf-btn-secondary" style="height:38px;padding:0 14px;border:1px solid #E6E1D8;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);">Importar produtos</button>' +
          '<button type="button" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 8px 18px rgba(180,35,24,.20)\';" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(180,35,24,.18)\';" onclick="Modules.Catalogo._openProductModal(null)" class="bf-btn-primary" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);">Adicionar produto</button>' +
        '</div>' +
      '</div>' +
      filtersHtml +
      bodyHtml +
    '</div>';

    _bindProductCategoryOrdering();
  }

  function _categoryLabel(cat) {
    return cat && (cat.name || cat.label || cat.nome) || 'Sem categoria';
  }

  function _categoryKey(cat) {
    return String(cat && (cat.id || cat.slug || cat.name || cat.label) || '');
  }

  function _productCategoryValue(product) {
    product = _normalizeProduct(product || {});
    return String(product.categoryId || product.category || product.categoria || '');
  }

  function _productCategory(product) {
    var value = _productCategoryValue(product);
    return (_categories || []).find(function (cat) {
      return value && [cat.id, cat.slug, cat.name, cat.label].map(function (v) { return String(v || ''); }).indexOf(value) >= 0;
    }) || null;
  }

  function _orderedProductCategoryGroups(list) {
    var products = _sortProductsForView(list || []);
    var groupsByKey = {};
    var orderedCats = (_categories || []).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0) || String(_categoryLabel(a)).localeCompare(String(_categoryLabel(b)));
    });
    orderedCats.forEach(function (cat) {
      var key = _categoryKey(cat);
      if (key) groupsByKey[key] = { key: key, category: cat, title: _categoryLabel(cat), products: [] };
    });
    var uncategorized = { key: '__sem_categoria', category: null, title: 'Sem categoria', products: [] };
    products.forEach(function (product) {
      var cat = _productCategory(product);
      var key = cat ? _categoryKey(cat) : '';
      if (key && groupsByKey[key]) groupsByKey[key].products.push(product);
      else uncategorized.products.push(product);
    });
    var groups = orderedCats.map(function (cat) { return groupsByKey[_categoryKey(cat)]; }).filter(function (group) {
      return group && group.products.length;
    });
    if (uncategorized.products.length) groups.push(uncategorized);
    return groups;
  }

  function _productGroupedListHTML(list, listMode) {
    var groups = _orderedProductCategoryGroups(list || []);
    var manual = (_productView.sort || 'order') === 'order';
    var intro = manual
      ? 'A ordem abaixo segue a vitrine pública: primeiro a ordem das categorias, depois a ordem dos produtos dentro de cada categoria.'
      : 'Produtos separados por categoria. A ordenação escolhida é aplicada dentro de cada categoria.';
    return '<section style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Produtos por categoria</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">' + _esc(intro) + '</div></div>' +
      groups.map(function (group) {
        var categoryNote = group.category
          ? 'Ordem definida em Configurações > Categorias'
          : 'Itens sem categoria aparecem depois das categorias configuradas';
        var countText = group.products.length === 1 ? '1 produto' : group.products.length + ' produtos';
        var orderHint = manual ? '<span style="font-size:11px;color:#8A7E7C;">Use as setas ou arraste para ordenar dentro desta categoria.</span>' : '';
        var content = listMode
          ? '<div style="overflow:auto;">' +
              '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:920px;">' +
                '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
                  '<th style="width:92px;text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Ordem</th>' +
                  '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Produto</th>' +
                  '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Categoria</th>' +
                  '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Preço</th>' +
                  '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Status</th>' +
                  '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Destaque</th>' +
                  '<th style="text-align:right;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Ações</th>' +
                '</tr></thead>' +
                '<tbody data-product-category-list="' + _esc(group.key) + '">' + group.products.map(function (p) { return _productTableRowHTML(p, manual); }).join('') + '</tbody>' +
              '</table>' +
            '</div>'
          : '<div data-product-category-list="' + _esc(group.key) + '" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">' + group.products.map(function (p) { return _productCardHTML(p, manual); }).join('') + '</div>';
        return '<div style="background:#fff;border:1px solid #EADFD8;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.055);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid #EAE4DA;background:#FFFCF8;">' +
            '<div style="min-width:0;"><div style="font-size:15px;font-weight:800;color:#1F1F1F;line-height:1.25;">' + _esc(group.title) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc(countText + ' · ' + categoryNote) + '</div></div>' +
            orderHint +
          '</div>' +
          content +
        '</div>';
      }).join('') +
    '</section>';
  }

  function _saveProductCategoryOrder(productIds) {
    var ids = (productIds || []).map(String).filter(Boolean);
    if (!ids.length) return Promise.resolve();
    _products = (_products || []).map(function (product) {
      var index = ids.indexOf(String(product.id));
      return index >= 0 ? Object.assign({}, product, { order: index }) : product;
    });
    return Promise.all(ids.map(function (id, index) { return DB.update('products', id, { order: index }); }))
      .then(function () { UI.toast('Ordem dos produtos salva.', 'success'); })
      .catch(function (err) { UI.toast('Erro ao salvar ordem: ' + err.message, 'error'); _renderProdutos(); });
  }

  function _productCategoryOrderIdsByProduct(productId) {
    var product = (_products || []).find(function (p) { return String(p.id) === String(productId); });
    if (!product) return [];
    var cat = _productCategory(product);
    var value = cat ? _categoryKey(cat) : '';
    return _sortProductsForView((_products || []).filter(function (item) {
      var itemCat = _productCategory(item);
      return value ? itemCat && _categoryKey(itemCat) === value : !itemCat;
    })).map(function (item) { return String(item.id); });
  }

  function _moveProductInCategory(id, direction) {
    var ids = _productCategoryOrderIdsByProduct(id);
    var index = ids.indexOf(String(id));
    var next = index + (Number(direction) || 0);
    if (index < 0 || next < 0 || next >= ids.length) return;
    var moved = ids.splice(index, 1)[0];
    ids.splice(next, 0, moved);
    _saveProductCategoryOrder(ids).then(function () { _paintProdutos(); });
  }

  function _bindProductCategoryOrdering() {
    if ((_productView.sort || 'order') !== 'order') return;
    [].slice.call(document.querySelectorAll('[data-product-category-list]')).forEach(function (listEl) {
      makeSortable(listEl, function (orders) {
        _saveProductCategoryOrder(orders.map(function (o) { return o.id; })).then(function () { _paintProdutos(); });
      });
    });
  }

  function _filterProductList(query) {
    var q = String(query || '').toLowerCase();
    return _products.filter(function (p) {
      p = _normalizeProduct(p);
      var cat = _categories.find(function (c) { return c.id === p.categoryId || c.slug === p.categoryId || c.name === p.categoryId; });
      if (_productFilters.category !== 'todas') {
        var catValues = [p.categoryId, p.category, cat && cat.id, cat && cat.slug, cat && cat.name].map(function (v) { return String(v || ''); });
        if (catValues.indexOf(String(_productFilters.category)) < 0) return false;
      }
      if (_productFilters.visibility === 'visiveis' && p.menuVisible === false) return false;
      if (_productFilters.visibility === 'ocultos' && p.menuVisible !== false) return false;
      if (_productFilters.type !== 'todos') {
        var productType = _productFilterType(p);
        if (_productFilters.type === 'unico') {
          if (productType === 'combo') return false;
        } else if (productType !== _productFilters.type) {
          return false;
        }
      }
      var hasPromo = !!_promoStateForProduct(p);
      if (_productFilters.promo === 'com' && !hasPromo) return false;
      if (_productFilters.promo === 'sem' && hasPromo) return false;
      if (!q) return true;
      var tagText = (p.tags || []).map(function (tag) { return tag.text || tag.name || ''; }).join(' ');
      var haystack = [
        p.name,
        p.shortDesc,
        p.description,
        p.fullDesc,
        p.microcopy,
        p.price,
        cat ? cat.name : '',
        tagText
      ].join(' ').toLowerCase();
      return haystack.indexOf(q) >= 0;
    });
  }

  function _filterProdutos() {
    var value = arguments.length > 0 ? arguments[0] : '';
    _productSearchQuery = String(value == null ? '' : value);
    _productView.page = 1;
    if (_productSearchTimer) clearTimeout(_productSearchTimer);
    _productSearchTimer = setTimeout(function () {
      _paintProdutos();
      var input = document.getElementById('catalogo-product-search');
      if (input) {
        try {
          input.focus();
          var len = String(_productSearchQuery || '').length;
          if (input.setSelectionRange) input.setSelectionRange(len, len);
        } catch (e) {}
      }
    }, 140);
  }

  function _setProductFilter(key, value) {
    _productFilters[key] = value || 'todos';
    if (key === 'category' && !value) _productFilters[key] = 'todas';
    _productView.page = 1;
    _paintProdutos();
  }

  function _setProductSort(value) {
    _productView.sort = value || 'order';
    _productView.page = 1;
    _paintProdutos();
  }

  function _setProductPage(page) {
    var next = parseInt(page, 10);
    if (!isFinite(next)) return;
    _productView.page = Math.max(1, next);
    _paintProdutos();
  }

  function _setProductPageSize(value) {
    var size = parseInt(value, 10);
    if (!isFinite(size) || size <= 0) return;
    _productView.pageSize = size;
    _productView.page = 1;
    _paintProdutos();
  }

  function _setProductViewMode(mode) {
    _productView.mode = mode === 'grid' ? 'grid' : 'list';
    _paintProdutos();
  }

  function _clearProductFilters() {
    _productFilters = { category: 'todas', visibility: 'todos', type: 'todos', promo: 'todos' };
    _productSearchQuery = '';
    if (_productSearchTimer) clearTimeout(_productSearchTimer);
    _productSearchTimer = null;
    _productView.page = 1;
    var input = document.getElementById('catalogo-product-search');
    if (input) input.value = '';
    _paintProdutos();
  }

  function _openProductsMoreFilters() {
    var body = '' +
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<div style="font-size:13px;color:#6B7280;line-height:1.5;">Use estes filtros para refinar a lista sem mudar a navegação principal.</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">' +
          '<div><div style="' + _labelStyle() + '">Tipo</div><select onchange="Modules.Catalogo._setProductFilter(\'type\',this.value)" style="' + _inputStyle() + '">' +
            '<option value="todos"' + (_productFilters.type === 'todos' ? ' selected' : '') + '>Todos</option>' +
            '<option value="unico"' + (_productFilters.type === 'unico' ? ' selected' : '') + '>Produto único</option>' +
            '<option value="combo"' + (_productFilters.type === 'combo' ? ' selected' : '') + '>Combo/Menu</option>' +
            '<option value="receita"' + (_productFilters.type === 'receita' ? ' selected' : '') + '>Receita vinculada</option>' +
            '<option value="pronto"' + (_productFilters.type === 'pronto' ? ' selected' : '') + '>Produto pronto</option>' +
          '</select></div>' +
          '<div><div style="' + _labelStyle() + '">Promoção</div><select onchange="Modules.Catalogo._setProductFilter(\'promo\',this.value)" style="' + _inputStyle() + '">' +
            '<option value="todos"' + (_productFilters.promo === 'todos' ? ' selected' : '') + '>Todos</option>' +
            '<option value="com"' + (_productFilters.promo === 'com' ? ' selected' : '') + '>Com promoção</option>' +
            '<option value="sem"' + (_productFilters.promo === 'sem' ? ' selected' : '') + '>Sem promoção</option>' +
          '</select></div>' +
        '</div>' +
      '</div>';
    var footer = '' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;">' +
        '<button type="button" onclick="if(window._catalogoMoreFiltersModal) window._catalogoMoreFiltersModal.close()" style="height:38px;padding:0 14px;border:1px solid #E5E7EB;border-radius:10px;background:#fff;color:#171717;font-size:13px;font-weight:500;cursor:pointer;">Fechar</button>' +
      '</div>';
    window._catalogoMoreFiltersModal = UI.modal({ title: 'Mais filtros', body: body, footer: footer, maxWidth: '560px' });
  }

  function _hasActiveProductFilters() {
    return _productFilters.category !== 'todas' || _productFilters.visibility !== 'todos' || _productFilters.type !== 'todos' || _productFilters.promo !== 'todos';
  }

  function _productFilterType(p) {
    p = _normalizeProduct(p || {});
    if (p.type === 'menu' || p.productType === 'combo') return 'combo';
    if (p.fichaId) return 'receita';
    if (p.produtoProntoId || p.sourceItemId) return 'pronto';
    return 'unico';
  }

  function _fmtMoneyDisplay(value) {
    var n = _moneyLike(value || 0);
    return '€' + n.toFixed(2).replace('.', ',');
  }

  function _countOpenOrders(orders) {
    var openStatuses = {
      'Pendente': true,
      'Confirmado': true,
      'Em preparação': true,
      'Em camino': true,
      'Listo para recoger': true
    };
    return (orders || []).filter(function (o) {
      return openStatuses[String(o && o.status || 'Pendente')] && String(o.status || '') !== 'Entregado' && String(o.status || '') !== 'Cancelado';
    }).length;
  }

  function _toDateSafe(value) {
    if (!value) return null;
    if (value && typeof value.toDate === 'function') {
      try { return value.toDate(); } catch (e) {}
    }
    if (value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function _countOrdersSinceDays(orders, days) {
    var limit = Date.now() - (Math.max(0, Number(days) || 0) * 86400000);
    return (orders || []).filter(function (o) {
      var d = _toDateSafe(o && (o.createdAt || o.updatedAt || o.date || o.dateTime));
      return d && d.getTime() >= limit;
    }).length;
  }

  function _orderItemName(item) {
    return String(item && (item.name || item.productName || item.nome || item.title || item.label || '') || '').trim();
  }

  function _orderItemTotalValue(item, qty, product) {
    var rawTotal = item && (item.total != null ? item.total :
      (item.subtotal != null ? item.subtotal :
      (item.lineTotal != null ? item.lineTotal :
      (item.finalTotal != null ? item.finalTotal : null))));
    var total = _moneyLike(rawTotal);
    if (total > 0) return total;
    var price = _moneyLike(item && (item.finalPrice != null ? item.finalPrice :
      (item.price != null ? item.price :
      (item.unitPrice != null ? item.unitPrice :
      (item.valorUnitario != null ? item.valorUnitario : null)))));
    if (!(price > 0)) price = _moneyLike(product && (product.price != null ? product.price : product.preco));
    return price > 0 ? price * Math.max(1, qty || 1) : 0;
  }

  function _productSavedCost(product) {
    var base = _normalizeProduct(product || {});
    var fallbackCost = _moneyLike(base.cost != null ? base.cost :
      (base.custo != null ? base.custo :
      (base.purchasePrice != null ? base.purchasePrice :
      (base.custoAtual != null ? base.custoAtual :
      (base.custo_atual != null ? base.custo_atual : 0)))));
    var menuGroups = _normalizeMenuGroups(base);
    var isMenu = base.type === 'menu' || menuGroups.length > 0;
    if (isMenu) {
      var total = 0;
      menuGroups.forEach(function (group) {
        var groupCosts = [];
        (group.options || []).forEach(function (opt) {
          var c = _menuRefCost(opt.ref);
          if (c > 0) groupCosts.push(c);
        });
        if (groupCosts.length) total += Math.min.apply(Math, groupCosts);
      });
      return total > 0 ? total : fallbackCost;
    }
    var src = base.unicoSource || ((base.produtoProntoId || base.sourceItemId) ? 'pronto' : 'receita');
    if (src === 'receita') {
      var fichaId = String(base.fichaId || '').trim();
      var ficha = _fichas.find(function (f) { return String(f.id) === String(fichaId); });
      if (ficha && typeof _calcFichaCosts === 'function') {
        var calc = _calcFichaCosts(ficha);
        if (calc && calc.costPerYield > 0) return _moneyLike(calc.costPerYield);
        if (calc && calc.totalCost > 0) return _moneyLike(calc.totalCost);
      }
    } else {
      var prontoId = String(base.produtoProntoId || base.sourceItemId || '').trim();
      var pronto = _produtosProntos.find(function (pp) { return String(pp.id) === String(prontoId); });
      if (pronto) {
        var prontoCost = pronto.purchasePrice != null ? pronto.purchasePrice :
          (pronto.preco_compra != null ? pronto.preco_compra :
          (pronto.custo_atual != null ? pronto.custo_atual : pronto.cost || 0));
        if (_moneyLike(prontoCost) > 0) return _moneyLike(prontoCost);
      }
    }
    return fallbackCost;
  }

  function _productMarginInfo(product) {
    var p = _normalizeProduct(product || {});
    var price = _moneyLike(p.price || p.preco || 0);
    var cost = _productSavedCost(p);
    if (!(price > 0) || !(cost > 0)) return { label: 'sem custo completo', margin: null, cost: cost, price: price };
    var margin = ((price - cost) / price) * 100;
    return { label: 'margem ' + margin.toFixed(0).replace('.', ',') + '%', margin: margin, cost: cost, price: price };
  }

  function _productBcgMetrics(products, orders) {
    var productList = (products || []).map(_normalizeProduct);
    var productById = {};
    var productByName = {};
    var rows = [];
    productList.forEach(function (p) {
      var id = String(p.id || '').trim();
      if (!id) return;
      productById[id] = p;
      var nameKey = String(p.name || '').trim().toLowerCase();
      if (nameKey) productByName[nameKey] = p;
      rows.push({
        id: id,
        product: p,
        currentRevenue: 0,
        previousRevenue: 0,
        currentQty: 0,
        previousQty: 0,
        orderHits: {}
      });
    });
    var rowById = {};
    rows.forEach(function (row) { rowById[row.id] = row; });
    var now = new Date();
    now.setHours(23, 59, 59, 999);
    var currentStart = now.getTime() - (30 * 86400000);
    var previousStart = now.getTime() - (60 * 86400000);

    (orders || []).filter(_validOrderForProductHistory).forEach(function (order) {
      var d = _toDateSafe(order && (order.createdAt || order.updatedAt || order.date || order.dateTime || order.created_at));
      if (!d) return;
      var ts = d.getTime();
      if (ts < previousStart || ts > now.getTime()) return;
      var bucket = ts >= currentStart ? 'current' : 'previous';
      _orderProductItems(order).forEach(function (item) {
        var id = _orderItemProductId(item);
        var product = id ? productById[id] : null;
        if (!product) {
          var nameKey = _orderItemName(item).toLowerCase();
          product = nameKey ? productByName[nameKey] : null;
          id = product ? String(product.id || '') : '';
        }
        if (!product || !rowById[id]) return;
        var qty = _orderItemQty(item);
        var total = _orderItemTotalValue(item, qty, product);
        if (bucket === 'current') {
          rowById[id].currentRevenue += total;
          rowById[id].currentQty += qty;
        } else {
          rowById[id].previousRevenue += total;
          rowById[id].previousQty += qty;
        }
        if (order && order.id) rowById[id].orderHits[String(order.id)] = true;
      });
    });

    var soldRows = rows.filter(function (row) { return row.currentRevenue > 0 || row.currentQty > 0; });
    var totalCurrentRevenue = soldRows.reduce(function (sum, row) { return sum + row.currentRevenue; }, 0);
    var averageCurrentRevenue = soldRows.length ? totalCurrentRevenue / soldRows.length : 0;
    var buckets = {
      stars: [],
      cash: [],
      bets: [],
      review: []
    };

    rows.forEach(function (row) {
      var share = totalCurrentRevenue > 0 ? row.currentRevenue / totalCurrentRevenue : 0;
      var highShare = row.currentRevenue > 0 && (row.currentRevenue >= averageCurrentRevenue || share >= 0.18);
      var growthPercent = row.previousRevenue > 0 ? ((row.currentRevenue - row.previousRevenue) / row.previousRevenue) * 100 : (row.currentRevenue > 0 ? 100 : 0);
      var highGrowth = row.currentRevenue > 0 && (row.previousRevenue <= 0 || growthPercent >= 10);
      var marginInfo = _productMarginInfo(row.product);
      row.share = share;
      row.growthPercent = growthPercent;
      row.marginInfo = marginInfo;
      row.orderCount = Object.keys(row.orderHits || {}).length;
      if (highShare && highGrowth) buckets.stars.push(row);
      else if (highShare) buckets.cash.push(row);
      else if (highGrowth) buckets.bets.push(row);
      else buckets.review.push(row);
    });

    function sortByRevenue(a, b) {
      return (b.currentRevenue - a.currentRevenue) || (b.currentQty - a.currentQty) || String(a.product.name || '').localeCompare(String(b.product.name || ''));
    }
    function sortByGrowth(a, b) {
      return (b.growthPercent - a.growthPercent) || sortByRevenue(a, b);
    }
    buckets.stars.sort(sortByRevenue);
    buckets.cash.sort(sortByRevenue);
    buckets.bets.sort(sortByGrowth);
    buckets.review.sort(function (a, b) {
      return (a.currentRevenue - b.currentRevenue) || (a.currentQty - b.currentQty) || String(a.product.name || '').localeCompare(String(b.product.name || ''));
    });
    return {
      productsCount: rows.length,
      ordersCount: _countOrdersSinceDays(orders || [], 60),
      hasRecentSales: soldRows.length > 0,
      buckets: buckets
    };
  }

  function _productBcgCardHtml(cfg) {
    var hasSalesBase = cfg.hasSalesBase !== false;
    var items = hasSalesBase ? (cfg.items || []) : [];
    var top = hasSalesBase ? (items[0] || null) : null;
    var topName = top ? (top.product.name || 'Produto') : '';
    var topMeta = top
      ? _fmtMoneyDisplay(top.currentRevenue || 0) + ' nos últimos 30 dias · ' + (top.marginInfo ? top.marginInfo.label : 'margem não informada')
      : (hasSalesBase ? cfg.empty : cfg.noSalesText);
    return '<div style="display:flex;align-items:flex-start;gap:13px;background:' + cfg.bg + ';border:1px solid ' + cfg.border + ';border-radius:18px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.055);min-height:112px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.055)\';">' +
      '<div style="width:44px;height:44px;border-radius:15px;background:#fff;color:' + cfg.color + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:0 6px 16px rgba(31,31,31,.06);"><span class="mi" style="font-size:23px;">' + _esc(cfg.icon) + '</span></div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:6px;flex:1;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div style="min-width:0;"><div style="font-size:12px;font-weight:800;color:' + cfg.color + ';line-height:1.15;">' + _esc(cfg.title) + '</div><div style="font-size:11px;color:#6F6860;line-height:1.25;margin-top:2px;">' + _esc(cfg.subtitle) + '</div></div>' +
          '<strong style="font-size:32px;font-weight:800;color:#1F1F1F;line-height:.95;white-space:nowrap;letter-spacing:0;">' + items.length + '</strong>' +
        '</div>' +
        '<div style="font-size:12px;color:#1F1F1F;line-height:1.35;min-height:32px;"><strong style="font-weight:750;">' + _esc(topName || cfg.noProductTitle) + '</strong>' + (topMeta ? '<br><span style="color:#6F6860;">' + _esc(topMeta) + '</span>' : '') + '</div>' +
      '</div>' +
    '</div>';
  }

  function _productBcgMetricsHtml(data) {
    data = data || { buckets: {} };
    var buckets = data.buckets || {};
    var hasSalesBase = data.hasRecentSales !== false && data.ordersCount > 0;
    var cards = _productBcgBucketConfigs();
    return '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">' + cards.map(function (card) {
        card.items = buckets[card.key] || [];
        card.hasSalesBase = hasSalesBase;
        return _productBcgCardHtml(card);
      }).join('') + '</div>' +
    '</div>';
  }

  function _productBcgBucketConfigs() {
    return [
      { key: 'stars', title: 'Estrelas', axis: 'Vende bem + cresceu', subtitle: 'os queridinhos do cardápio', icon: 'auto_awesome', color: '#16735B', bg: '#F1FAF5', border: '#D9EFE4', empty: 'Aqui aparecem os produtos que estão chamando mais pedido.', noSalesText: 'Quando chegarem pedidos, este card vai mostrar quais produtos estão puxando a venda e merecem mais destaque.', noProductTitle: 'Vai mostrar o que está brilhando', action: 'Dê destaque, mantenha disponível e proteja margem.' },
      { key: 'cash', title: 'Caixa forte', axis: 'Vende bem + estável', subtitle: 'vendem sempre e ajudam o caixa', icon: 'payments', color: '#8A5A18', bg: '#FFF8E8', border: '#F1E1B8', empty: 'Aqui aparecem os produtos que ajudam a manter o caixa girando.', noSalesText: 'Quando chegarem pedidos, este card vai mostrar os produtos que vendem com frequência e ajudam a segurar o faturamento.', noProductTitle: 'Vai mostrar o que segura o caixa', action: 'Mantenha no cardápio, revise custo e evite desconto sem necessidade.' },
      { key: 'bets', title: 'Apostas', axis: 'Vende menos + cresceu', subtitle: 'podem merecer mais espaço', icon: 'rocket_launch', color: '#2F6F9F', bg: '#F0F7FC', border: '#D8EAF5', empty: 'Aqui aparecem produtos que começaram a dar sinal de que podem vender mais.', noSalesText: 'Quando um produto começar a responder melhor, ele aparece aqui para você decidir se vale testar mais destaque.', noProductTitle: 'Vai mostrar chances para testar', action: 'Teste vitrine, combo, foto ou comunicação por alguns dias.' },
      { key: 'review', title: 'Revisar', axis: 'Vende pouco + perdeu força', subtitle: 'precisam de um olhar antes de insistir', icon: 'manage_search', color: '#B42318', bg: '#FFF5F3', border: '#F0D2CC', empty: 'Aqui aparecem produtos que talvez precisem de ajuste no preço, custo ou destaque.', noSalesText: 'Quando houver pedidos, este card vai mostrar produtos que estão vendendo pouco ou que talvez não estejam compensando.', noProductTitle: 'Vai mostrar o que merece cuidado', action: 'Revise preço, foto, descrição, custo ou se ainda vale manter.' }
    ];
  }

  function _sortProductsForView(list) {
    var items = (list || []).slice();
    var mode = _productView.sort || 'order';
    items.sort(function (a, b) {
      var an = _normalizeProduct(a || {});
      var bn = _normalizeProduct(b || {});
      if (mode === 'name-asc') return String(an.name || '').localeCompare(String(bn.name || ''));
      if (mode === 'name-desc') return String(bn.name || '').localeCompare(String(an.name || ''));
      if (mode === 'price-asc') return _moneyLike(an.price || 0) - _moneyLike(bn.price || 0) || String(an.name || '').localeCompare(String(bn.name || ''));
      if (mode === 'price-desc') return _moneyLike(bn.price || 0) - _moneyLike(an.price || 0) || String(an.name || '').localeCompare(String(bn.name || ''));
      if (mode === 'visible-first') {
        var av = an.menuVisible === false ? 1 : 0;
        var bv = bn.menuVisible === false ? 1 : 0;
        if (av !== bv) return av - bv;
        return (an.order || 0) - (bn.order || 0) || String(an.name || '').localeCompare(String(bn.name || ''));
      }
      return (an.order || 0) - (bn.order || 0) || String(an.name || '').localeCompare(String(bn.name || ''));
    });
    return items;
  }

  function _productPaging(list) {
    var items = _sortProductsForView(list || []);
    var total = items.length;
    var pageSize = Math.max(6, parseInt(_productView.pageSize, 10) || 12);
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var currentPage = Math.min(Math.max(1, parseInt(_productView.page, 10) || 1), totalPages);
    var start = (currentPage - 1) * pageSize;
    var pageItems = items.slice(start, start + pageSize);
    return {
      items: pageItems,
      total: total,
      page: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(total, start + pageSize)
    };
  }

  function _productTypeInfo(p) {
    p = _normalizeProduct(p || {});
    var isMenu = p.type === 'menu' || p.productType === 'combo';
    var groupsCount = Array.isArray(p.menuChoiceGroups) ? p.menuChoiceGroups.length : 0;
    var variantCount = Array.isArray(p.variantGroupIds) ? p.variantGroupIds.length : (Array.isArray(p.variants) ? p.variants.length : 0);
    var groupText = groupsCount === 1 ? '1 grupo de escolha' : groupsCount + ' grupos de escolha';
    if (isMenu) return { label: 'Combo/Menu', detail: groupsCount ? groupText : 'Menu sem grupos' };
    if (p.fichaId) return { label: 'Receita vinculada', detail: 'Produto único' };
    if (variantCount > 0) return { label: 'Produto com escolhas', detail: variantCount === 1 ? '1 grupo de escolha' : variantCount + ' grupos de escolha' };
    return { label: 'Produto pronto', detail: 'Produto único' };
  }

  function _productCardHTML(p, canOrder) {
    p = _normalizeProduct(p);
    var cat = _categories.find(function (c) { return c.id === p.categoryId || c.slug === p.categoryId || c.name === p.categoryId; });
    var price = _moneyLike(p.price || 0);
    var promoState = _promoStateForProduct(p);
    var desc = p.shortDesc || p.description || '';
    var featured = p.featured === true || p.popular === true;
    var statusHtml = p.menuVisible !== false
      ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#5B7A67;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:#6C8777;display:inline-block;"></span>Visível</span>'
      : '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:#A39B90;display:inline-block;"></span>Oculto</span>';
    var imgSrc = p.imageThumbUrl || p.imageCardUrl || p.imageUrl || p.imageBase64 || p.img || '';
    var imgHtml = imgSrc
      ? '<img src="' + _esc(imgSrc) + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentNode.innerHTML=\'<span class=&quot;mi&quot; style=&quot;font-size:24px;color:#B9AAA6;&quot;>image_not_supported</span>\';">'
      : '<span class="mi" style="font-size:24px;color:#B9AAA6;">image_not_supported</span>';

    return '<div draggable="true" data-id="' + p.id + '" onclick="Modules.Catalogo._openProductModal(\'' + p.id + '\')" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\'" style="background:#fff;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);border:1px solid #EAE4DA;cursor:pointer;overflow:hidden;display:flex;flex-direction:column;min-height:100%;transition:transform .16s ease,box-shadow .16s ease;">' +
      '<div style="position:relative;background:#fff;border-bottom:1px solid #EAE4DA;">' +
        '<div style="aspect-ratio:1.45/1;display:flex;align-items:center;justify-content:center;overflow:hidden;">' + imgHtml + '</div>' +
        '<span class="mi" style="position:absolute;left:12px;top:12px;width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,.92);color:#9CA3AF;font-size:16px;display:flex;align-items:center;justify-content:center;">drag_indicator</span>' +
        (canOrder ? '<div style="position:absolute;right:12px;bottom:12px;display:flex;gap:5px;"><button type="button" title="Subir produto" onclick="event.stopPropagation();Modules.Catalogo._moveProductInCategory(\'' + _esc(p.id) + '\', -1)" style="width:28px;height:28px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;display:flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:16px;">keyboard_arrow_up</span></button><button type="button" title="Descer produto" onclick="event.stopPropagation();Modules.Catalogo._moveProductInCategory(\'' + _esc(p.id) + '\', 1)" style="width:28px;height:28px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;display:flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:16px;">keyboard_arrow_down</span></button></div>' : '') +
        (featured ? '<span style="position:absolute;left:12px;bottom:12px;display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(31,31,31,.04);border:1px solid #EAE4DA;color:#B42318;font-size:10px;font-weight:600;line-height:1;">★ Destaque</span>' : '') +
        (promoState ? '<div style="position:absolute;right:12px;top:12px;">' + _promoProductVisual(p) + '</div>' : '') +
      '</div>' +
      '<div style="padding:14px 14px 16px;display:flex;flex-direction:column;gap:10px;flex:1 1 auto;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div style="min-width:0;flex:1;">' +
            '<input value="' + _esc(p.name) + '" onclick="event.stopPropagation()" onkeydown="if(event.key===\'Enter\'){this.blur();}" onchange="Modules.Catalogo._quickUpdateProduct(event,\'' + p.id + '\',\'name\',this.value)" style="width:100%;border:none;background:transparent;padding:0;font-size:16px;font-weight:600;color:#171717;outline:none;font-family:inherit;line-height:1.25;">' +
            '<div style="margin-top:5px;font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(desc || 'Sem descrição curta') + '</div>' +
          '</div>' +
          statusHtml +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
          '<span style="font-size:24px;font-weight:600;color:#171717;line-height:1;">' + _fmtMoneyDisplay(price) + '</span>' +
          '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;border:1px solid #EAE4DA;">' + _esc(cat ? cat.name : 'Sem categoria') + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding-top:4px;">' +
          '<div style="font-size:12px;color:#6F6860;line-height:1.4;">' + (promoState ? 'Promoção ativa' : featured ? 'Selecionado para destaque' : 'Visual em lista ou grade') + '</div>' +
          '<div style="display:flex;gap:8px;flex-shrink:0;">' +
            '<button onclick="event.stopPropagation();Modules.Catalogo._openProductModal(\'' + p.id + '\')" style="width:36px;height:36px;border-radius:10px;border:1px solid #EAE4DA;cursor:pointer;background:#fff;color:#D71920;font-size:15px;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:16px;">edit</span></button>' +
            '<button onclick="event.stopPropagation();Modules.Catalogo._duplicateProduct(\'' + p.id + '\')" style="width:36px;height:36px;border-radius:10px;border:1px solid #EAE4DA;cursor:pointer;background:#fff;color:#6B7280;font-size:15px;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:16px;">content_copy</span></button>' +
            '<button onclick="event.stopPropagation();Modules.Catalogo._deleteProduct(\'' + p.id + '\')" style="width:36px;height:36px;border-radius:10px;border:1px solid #EAE4DA;cursor:pointer;background:#fff;color:#D71920;font-size:15px;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:16px;">delete</span></button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _renderVendasCardapio() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7E7C;">Carregando vendas do cardápio...</div>';
    Promise.all([
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('categories').catch(function () { return []; }),
      DB.getAll('orders').catch(function () { return []; }),
      DB.getDocRoot ? DB.getDocRoot('config', 'canais_venda').catch(function () { return null; }) : Promise.resolve(null)
    ]).then(function (r) {
      _products = r[0] || [];
      _categories = r[1] || [];
      _orders = r[2] || [];
      _salesChannels = _catalogConfiguredSalesChannels(r[3] || {});
      _paintVendasCardapio();
    }).catch(function (err) {
      content.innerHTML = UI.emptyState('Vendas indisponíveis', 'Não foi possível carregar os pedidos do cardápio agora.');
      UI.toast('Erro ao carregar vendas: ' + err.message, 'error');
    });
  }

  function _catalogSalesStyles() {
    return '<style>' +
      '.catalog-sales-page{display:flex;flex-direction:column;gap:16px;}' +
      '.catalog-sales-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.catalog-sales-title{font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;}' +
      '.catalog-sales-subtitle{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;}' +
      '.catalog-sales-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;}' +
      '.catalog-sales-card{background:#fff;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);border:1px solid #EAE4DA;padding:15px;display:flex;gap:12px;align-items:flex-start;min-width:0;transition:transform .16s ease,box-shadow .16s ease;}' +
      '.catalog-sales-card:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(31,31,31,.09);}' +
      '.catalog-sales-card-icon{width:42px;height:42px;border-radius:14px;background:#FFF5F3;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}' +
      '.catalog-sales-card-label{font-size:11px;font-weight:700;color:#6F6860;line-height:1.25;}' +
      '.catalog-sales-card-value{font-size:23px;font-weight:750;color:#1F1F1F;line-height:1.12;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.catalog-sales-card-hint{font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:4px;}' +
      '.catalog-bcg-matrix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}' +
      '.catalog-bcg-quadrant{border-radius:18px;padding:16px;border:1px solid #EADFD8;box-shadow:0 12px 30px rgba(31,31,31,.055);min-height:320px;display:flex;flex-direction:column;gap:12px;}' +
      '.catalog-bcg-item{background:rgba(255,255,255,.82);border:1px solid rgba(234,228,218,.9);border-radius:13px;padding:10px 11px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start;}' +
      '.catalog-bcg-axis{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:center;margin-bottom:4px;}' +
      '.catalog-bcg-axis-label{font-size:11px;font-weight:750;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;}' +
      '.production-orders-filter{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.055);}' +
      '.production-orders-filter-grid{display:grid;grid-template-columns:minmax(260px,1fr) minmax(180px,240px) minmax(190px,260px);gap:11px 12px;align-items:end;}' +
      '.production-orders-field{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.production-orders-field:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.production-orders-field input,.production-orders-field select{width:100%;height:40px;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;box-sizing:border-box;}' +
      '.production-orders-field select{appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:30px;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 4px center;background-size:14px;}' +
      '.production-orders-filter-actions{display:flex;justify-content:flex-start;margin-top:11px;}' +
      '.production-orders-clear{height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.production-orders-table-card{background:#fff;border:1px solid #EADFD8;border-radius:18px;box-shadow:0 12px 30px rgba(31,31,31,.055);overflow:hidden;}' +
      '.production-orders-table-wrap{overflow-x:auto;}' +
      '.production-orders-table{width:100%;border-collapse:separate;border-spacing:0;min-width:920px;}' +
      '.production-orders-table th{padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;}' +
      '.production-orders-table th:last-child{text-align:right;}' +
      '.production-orders-table td{padding:14px 16px;vertical-align:middle;border-bottom:1px solid #EADFD8;}' +
      '.production-orders-table tbody tr{cursor:pointer;background:#fff;transition:background .15s ease,box-shadow .15s ease;}' +
      '.production-orders-table tbody tr:hover{background:#FFFCF8;}' +
      '.production-orders-page-select{width:110px;height:34px;padding:0 34px 0 10px;border:1px solid #E8DCD7;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#FFFCF8;color:#6F6860;box-sizing:border-box;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 12px center;background-size:14px;}' +
      '@media(max-width:820px){.production-orders-filter-grid{grid-template-columns:1fr!important}.catalog-sales-cards,.catalog-bcg-matrix,.catalog-bcg-axis{grid-template-columns:1fr}}' +
    '</style>';
  }

  function _performanceSubtabsHtml() {
    function tab(key, label, icon) {
      var active = _performanceTab === key;
      return '<button type="button" onclick="Modules.Catalogo._setPerformanceTab(\'' + key + '\')" style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:none;border-radius:999px;background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#6F6860') + ';font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:' + (active ? '0 10px 24px rgba(180,35,24,.18)' : 'inset 0 0 0 1px #EAE4DA') + ';transition:background .15s ease,color .15s ease,box-shadow .15s ease;">' +
        '<span class="mi" style="font-size:17px;">' + _esc(icon) + '</span>' + _esc(label) +
      '</button>';
    }
    return '<div style="display:inline-flex;align-items:center;gap:6px;background:#FAF8F4;border-radius:999px;padding:4px;box-shadow:inset 0 0 0 1px #EAE4DA;max-width:100%;overflow:auto;">' +
      tab('resumo', 'Resumo', 'monitoring') +
      tab('matriz', 'Matriz', 'grid_view') +
      tab('vendas', 'Vendas', 'receipt_long') +
    '</div>';
  }

  function _setPerformanceTab(value) {
    _performanceTab = value === 'matriz' || value === 'vendas' ? value : 'resumo';
    _paintVendasCardapio();
  }

  function _catalogBcgItemHtml(row) {
    var name = row && row.product ? row.product.name || 'Produto' : 'Produto';
    var revenue = _fmtMoneyDisplay(row && row.currentRevenue || 0);
    var qty = _roundDisplay(row && row.currentQty || 0);
    var growth = row && isFinite(row.growthPercent) ? Math.round(row.growthPercent) : 0;
    var growthText = growth > 0 ? '+' + growth + '%' : growth + '%';
    var margin = row && row.marginInfo ? row.marginInfo.label : 'margem não informada';
    return '<div class="catalog-bcg-item">' +
      '<div style="min-width:0;"><div style="font-size:13px;font-weight:750;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(name) + '</div>' +
        '<div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(qty + ' vendido(s) · ' + revenue + ' · ' + margin) + '</div></div>' +
      '<span style="font-size:12px;font-weight:800;color:' + (growth >= 0 ? '#16735B' : '#B42318') + ';white-space:nowrap;">' + _esc(growthText) + '</span>' +
    '</div>';
  }

  function _catalogBcgQuadrantHtml(cfg, data) {
    var hasSalesBase = data && data.hasRecentSales !== false && data.ordersCount > 0;
    var items = hasSalesBase ? ((data.buckets || {})[cfg.key] || []) : [];
    var visible = items.slice(0, 6);
    var rest = Math.max(0, items.length - visible.length);
    var body = visible.length
      ? visible.map(_catalogBcgItemHtml).join('')
      : '<div style="background:rgba(255,255,255,.72);border:1px dashed ' + cfg.border + ';border-radius:14px;padding:18px;color:#6F6860;font-size:13px;line-height:1.45;text-align:center;">' + _esc(hasSalesBase ? cfg.empty : cfg.noSalesText) + '</div>';
    return '<section class="catalog-bcg-quadrant" style="background:' + cfg.bg + ';border-color:' + cfg.border + ';">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
        '<div style="min-width:0;"><div style="display:flex;align-items:center;gap:8px;color:' + cfg.color + ';font-size:15px;font-weight:850;"><span class="mi" style="font-size:20px;">' + _esc(cfg.icon) + '</span>' + _esc(cfg.title) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(cfg.axis) + '</div></div>' +
        '<strong style="font-size:27px;font-weight:850;color:#1F1F1F;line-height:1;">' + items.length + '</strong>' +
      '</div>' +
      '<div style="font-size:12px;color:#1F1F1F;line-height:1.45;background:rgba(255,255,255,.55);border-radius:12px;padding:9px 10px;">' + _esc(cfg.action) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;min-height:0;">' + body + '</div>' +
      (rest ? '<button type="button" onclick="Modules.Catalogo._openCatalogBcgBucket(\'' + cfg.key + '\')" style="height:34px;padding:0 12px;border:1px solid ' + cfg.border + ';border-radius:11px;background:#fff;color:' + cfg.color + ';font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;align-self:flex-start;">Ver todos +' + rest + '</button>' : '') +
    '</section>';
  }

  function _catalogBcgMatrixHtml(data) {
    var cfgs = _productBcgBucketConfigs();
    return '<section style="' + _cardStyle() + 'padding:18px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;">' +
        '<div style="min-width:0;"><h3 style="margin:0;font-size:16px;font-weight:850;color:#1F1F1F;">Matriz do cardápio</h3><p style="margin:5px 0 0;font-size:13px;color:#6F6860;line-height:1.45;max-width:780px;">Cada quadrante mostra até 6 produtos. Quando tiver mais, abra a lista completa para decidir o que destacar, proteger, testar ou revisar.</p></div>' +
        '<span style="font-size:11px;font-weight:750;color:#6F6860;background:#FAF8F4;border:1px solid #EAE4DA;border-radius:999px;padding:7px 10px;white-space:nowrap;">Últimos 30 dias x 30 anteriores</span>' +
      '</div>' +
      '<div class="catalog-bcg-axis"><div class="catalog-bcg-axis-label">Mais força de venda</div><div class="catalog-bcg-axis-label" style="text-align:right;">Mais crescimento</div></div>' +
      '<div class="catalog-bcg-matrix">' +
        _catalogBcgQuadrantHtml(cfgs[0], data) +
        _catalogBcgQuadrantHtml(cfgs[2], data) +
        _catalogBcgQuadrantHtml(cfgs[1], data) +
        _catalogBcgQuadrantHtml(cfgs[3], data) +
      '</div>' +
    '</section>';
  }

  function _openCatalogBcgBucket(key) {
    var data = _productBcgMetrics(_products || [], _orders || []);
    var cfg = _productBcgBucketConfigs().find(function (item) { return item.key === key; }) || _productBcgBucketConfigs()[0];
    var items = ((data.buckets || {})[cfg.key] || []);
    var body = '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="font-size:13px;color:#6F6860;line-height:1.45;">' + _esc(cfg.action) + '</div>' +
      (items.length ? '<div style="display:flex;flex-direction:column;gap:8px;">' + items.map(_catalogBcgItemHtml).join('') + '</div>' : '<div style="padding:22px;text-align:center;color:#8A7E7C;font-size:13px;border:1px dashed #EADFD8;border-radius:14px;background:#FFFCF8;">Ainda não há produtos neste quadrante.</div>') +
    '</div>';
    UI.modal({ title: cfg.title + ' · ' + items.length + ' produto(s)', body: body, maxWidth: '760px' });
  }

  function _paintVendasCardapio() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    var data = _catalogSalesData(_orders || [], _products || []);
    var filtered = _filterCatalogSalesRows(data.rows);
    var paging = _catalogSalesPaging(filtered);
    var summary = _catalogSalesSummary(filtered);
    var channels = _catalogSalesChannelOptions(data.rows);
    var bcgMetrics = _productBcgMetrics(_products || [], _orders || []);
    var periodOptions = [
      { value: '30', label: 'Últimos 30 dias' },
      { value: '90', label: 'Últimos 90 dias' },
      { value: '180', label: 'Últimos 180 dias' },
      { value: 'all', label: 'Todo o histórico' }
    ].map(function (opt) { return '<option value="' + opt.value + '"' + (_salesFilters.period === opt.value ? ' selected' : '') + '>' + _esc(opt.label) + '</option>'; }).join('');
    var typeOptions = [
      { value: 'todos', label: 'Todos os tipos' },
      { value: 'combo', label: 'Combos e menus' },
      { value: 'produto', label: 'Produtos avulsos' },
      { value: 'receita', label: 'Receita/produto produzido' },
      { value: 'pronto', label: 'Produto pronto' }
    ].map(function (opt) { return '<option value="' + opt.value + '"' + (_salesFilters.type === opt.value ? ' selected' : '') + '>' + _esc(opt.label) + '</option>'; }).join('');
    var channelOptions = '<option value="todos"' + (_salesFilters.channel === 'todos' ? ' selected' : '') + '>Todos os canais</option>' + channels.map(function (channel) {
      return '<option value="' + _esc(channel) + '"' + (_salesFilters.channel === channel ? ' selected' : '') + '>' + _esc(channel) + '</option>';
    }).join('');
    var hasFilters = (_salesFilters.q || '') || _salesFilters.period !== '90' || _salesFilters.channel !== 'todos' || _salesFilters.type !== 'todos';
    var cards = [
      { label: 'Dinheiro que veio do cardápio', value: _fmtMoneyDisplay(summary.revenue), icon: 'payments', hint: summary.orders + ' pedidos entram nesta leitura' },
      { label: 'Itens vendidos', value: String(_roundDisplay(summary.qty)), icon: 'shopping_bag', hint: 'quantidade vendida no período' },
      { label: 'Valor médio por item', value: _fmtMoneyDisplay(summary.avgLine), icon: 'receipt_long', hint: 'ajuda a enxergar ticket e mix' },
      { label: 'Preferido das clientes', value: summary.topName || 'Sem vendas ainda', icon: 'leaderboard', hint: summary.topQty ? _roundDisplay(summary.topQty) + ' vendidos' : 'assim que vender, aparece aqui' }
    ].map(function (card) {
      return '<div class="catalog-sales-card">' +
        '<div class="catalog-sales-card-icon"><span class="mi" style="font-size:21px;">' + _esc(card.icon) + '</span></div>' +
        '<div style="min-width:0;"><div class="catalog-sales-card-label">' + _esc(card.label) + '</div><div class="catalog-sales-card-value">' + _esc(card.value) + '</div><div class="catalog-sales-card-hint">' + _esc(card.hint) + '</div></div>' +
      '</div>';
    }).join('');
    var ranking = _catalogSalesRanking(filtered).slice(0, 8);
    var rankingHtml = ranking.length ? ranking.map(function (row, idx) {
      return '<div style="display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #F0E7E2;">' +
        '<span style="width:24px;height:24px;border-radius:9px;background:#FFF5F3;color:#B42318;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:750;">' + (idx + 1) + '</span>' +
        '<div style="min-width:0;"><div style="font-size:13px;font-weight:650;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(row.name) + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(row.typeLabel) + ' · ' + _roundDisplay(row.qty) + ' un.</div></div>' +
        '<div style="font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;">' + _fmtMoneyDisplay(row.revenue) + '</div>' +
      '</div>';
    }).join('') : '<div style="padding:18px;color:#8A7E7C;font-size:13px;text-align:center;">Sem vendas para este filtro.</div>';
    var tableRows = paging.items.map(_catalogSalesTableRowHtml).join('');
    var emptyHtml = !paging.items.length ? '<tr><td colspan="7" style="padding:28px;text-align:center;color:#8A7E7C;font-size:13px;">Nenhuma venda encontrada com esses filtros.</td></tr>' : '';
    var pageSizeOptions = [10, 25, 50, 100].map(function (n) { return '<option value="' + n + '"' + (Number(_salesView.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('');
    var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px 16px;border-top:1px solid #EAE4DA;">' +
      '<span style="font-size:12px;color:#6F6860;">Mostrando <strong style="color:#1F1F1F;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<select class="production-orders-page-select" onchange="Modules.Catalogo._setCatalogSalesPageSize(this.value)">' + pageSizeOptions + '</select>' +
        '<button type="button" onclick="Modules.Catalogo._setCatalogSalesPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
        '<span style="font-size:12px;color:#8A7E7C;">' + paging.page + ' / ' + paging.totalPages + '</span>' +
        '<button type="button" onclick="Modules.Catalogo._setCatalogSalesPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
      '</div>' +
    '</div>' : '';
    var filtersHtml = '<section class="production-orders-filter">' +
      '<div class="production-orders-filter-grid" style="grid-template-columns:minmax(260px,1fr) minmax(155px,190px) minmax(170px,230px) minmax(170px,230px);">' +
        '<label style="display:block;min-width:0;"><span style="display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;">Buscar</span><span class="production-orders-field"><input type="search" value="' + _esc(_salesFilters.q || '') + '" placeholder="Produto, pedido ou cliente" autocomplete="off" spellcheck="false" oninput="Modules.Catalogo._setCatalogSalesSearch(this.value)"></span></label>' +
        '<label style="display:block;min-width:0;"><span style="display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;">Período</span><span class="production-orders-field"><select onchange="Modules.Catalogo._setCatalogSalesFilter(\'period\',this.value)">' + periodOptions + '</select></span></label>' +
        '<label style="display:block;min-width:0;"><span style="display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;">Canal</span><span class="production-orders-field"><select onchange="Modules.Catalogo._setCatalogSalesFilter(\'channel\',this.value)">' + channelOptions + '</select></span></label>' +
        '<label style="display:block;min-width:0;"><span style="display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;">Tipo</span><span class="production-orders-field"><select onchange="Modules.Catalogo._setCatalogSalesFilter(\'type\',this.value)">' + typeOptions + '</select></span></label>' +
      '</div>' +
      (hasFilters ? '<div class="production-orders-filter-actions"><button type="button" class="production-orders-clear" onclick="Modules.Catalogo._clearCatalogSalesFilters()">Limpar filtros</button></div>' : '') +
    '</section>';
    var tableHtml = '<section class="production-orders-table-card">' +
      '<div style="padding:16px 18px;border-bottom:1px solid #EAE4DA;"><h3 style="margin:0;font-size:15px;font-weight:700;color:#1F1F1F;">Vendas item por item</h3><p style="margin:4px 0 0;font-size:12px;color:#6F6860;line-height:1.4;">Aqui dá para ver o que saiu em cada pedido e de onde veio a venda.</p></div>' +
      '<div class="production-orders-table-wrap"><table class="bf-table production-orders-table"><thead><tr>' +
        '<th>Data</th><th>Produto vendido</th><th>Pedido</th><th>Canal</th><th>Status</th><th style="text-align:right;">Qtd.</th><th>Total</th>' +
      '</tr></thead><tbody>' + tableRows + emptyHtml + '</tbody></table></div>' + paginationHtml +
    '</section>';
    var rankingSection = '<section class="production-orders-table-card" style="padding:16px 18px;"><h3 style="margin:0;font-size:15px;font-weight:700;color:#1F1F1F;">Mais vendidos</h3><p style="margin:4px 0 8px;font-size:12px;color:#6F6860;line-height:1.4;">Ajuda a enxergar o que merece destaque na vitrine e nas campanhas.</p>' + rankingHtml + '</section>';
    var bodyHtml = '';
    if (_performanceTab === 'matriz') {
      bodyHtml = _catalogBcgMatrixHtml(bcgMetrics);
    } else if (_performanceTab === 'vendas') {
      bodyHtml = filtersHtml + tableHtml;
    } else {
      bodyHtml = '<div class="catalog-sales-cards">' + cards + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;align-items:start;">' +
          rankingSection +
          '<section class="production-orders-table-card" style="padding:16px 18px;"><h3 style="margin:0;font-size:15px;font-weight:700;color:#1F1F1F;">Leitura rápida</h3><p style="margin:4px 0 12px;font-size:12px;color:#6F6860;line-height:1.4;">Para ver a matriz completa do cardápio, abra a subaba Matriz.</p>' + _productBcgMetricsHtml(bcgMetrics) + '</section>' +
        '</div>';
    }
    content.innerHTML = _catalogSalesStyles() + '<div class="bf-page catalog-sales-page">' +
      '<div class="bf-page-header catalog-sales-head">' +
        '<div style="min-width:0;flex:1 1 460px;"><h2 class="catalog-sales-title">Desempenho do cardápio</h2><p class="catalog-sales-subtitle">Veja quais produtos, menus e combinações estão trazendo dinheiro para o negócio. Use esta tela para decidir o que destacar, ajustar preço, testar promoção ou tirar de foco.</p></div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' + _performanceSubtabsHtml() + '</div>' +
      '</div>' +
      bodyHtml +
    '</div>';
  }

  function _renderPrevisaoCardapio() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7E7C;">Carregando previsão do cardápio...</div>';
    Promise.all([
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('stock_movements').catch(function () { return []; }),
      DB.getAll('variantGroups').catch(function () { return []; }),
      DB.getAll('itens_custo').catch(function () { return []; }),
      DB.getAll('categories').catch(function () { return []; })
    ]).then(function (r) {
      _catalogForecastData = {
        products: r[0] || [],
        recipes: r[1] || [],
        movements: r[2] || [],
        variantGroups: r[3] || [],
        readyItems: _normalizeProdutosCompras(r[4] || []),
        categories: r[5] || []
      };
      _paintPrevisaoCardapio();
    }).catch(function (err) {
      content.innerHTML = UI.emptyState('Previsão indisponível', 'Não foi possível carregar a previsão do cardápio agora.');
      UI.toast('Erro ao carregar previsão: ' + err.message, 'error');
    });
  }

  function _paintPrevisaoCardapio() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    var rows = _filteredCatalogForecastRows(_buildCatalogForecastRows());
    var paging = _catalogForecastPaging(rows);
    var summary = _catalogForecastSummary(rows);
    var fieldStyle = 'height:40px;width:100%;box-sizing:border-box;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:13px;font-family:inherit;outline:none;padding:0 12px;';
    var selectStyle = fieldStyle + 'appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:38px;';
    var arrow = '<span class="mi" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:18px;color:#8A7E7C;pointer-events:none;">expand_more</span>';
    var statusOptions = [
      { value: 'todos', label: 'Todos os status' },
      { value: 'ok', label: 'Pode vender' },
      { value: 'bloqueado', label: 'Limitado por estoque' },
      { value: 'sob_encomenda', label: 'Sob encomenda' },
      { value: 'sem_composicao', label: 'Sem composição clara' }
    ].map(function (opt) { return '<option value="' + opt.value + '"' + (_catalogForecastFilters.status === opt.value ? ' selected' : '') + '>' + _esc(opt.label) + '</option>'; }).join('');
    var cards = [
      { label: 'Produtos analisados', value: String(summary.total), icon: 'restaurant_menu', hint: 'itens ativos do cardápio' },
      { label: 'Disponíveis para venda', value: String(summary.ok), icon: 'shopping_bag', hint: 'com saldo calculável agora' },
      { label: 'Limitados por estoque', value: String(summary.blocked), icon: 'inventory_2', hint: 'o limitador aparece na tabela' },
      { label: 'Sem composição clara', value: String(summary.unclear), icon: 'warning_amber', hint: 'precisa de vínculo de estoque' }
    ].map(function (card) {
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:15px;box-shadow:0 10px 24px rgba(31,31,31,.045);display:flex;gap:12px;align-items:flex-start;min-width:0;">' +
        '<div style="width:38px;height:38px;border-radius:13px;background:#FFF5F3;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">' + _esc(card.icon) + '</span></div>' +
        '<div style="min-width:0;"><div style="font-size:11px;font-weight:700;color:#6F6860;line-height:1.25;">' + _esc(card.label) + '</div><div style="font-size:21px;font-weight:750;color:#1F1F1F;line-height:1.15;margin-top:4px;">' + _esc(card.value) + '</div><div style="font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:4px;">' + _esc(card.hint) + '</div></div>' +
      '</div>';
    }).join('');
    var tableRows = paging.items.map(_catalogForecastTableRowHtml).join('');
    var emptyHtml = !paging.items.length ? '<tr><td colspan="6" style="padding:28px;text-align:center;color:#8A7E7C;font-size:13px;">Nenhum produto encontrado para os filtros atuais.</td></tr>' : '';
    var pageSizeOptions = [10, 25, 50, 100].map(function (n) { return '<option value="' + n + '"' + (Number(_catalogForecastView.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('');
    var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px 16px;border-top:1px solid #EAE4DA;">' +
      '<span style="font-size:12px;color:#6F6860;">Mostrando <strong style="color:#1F1F1F;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<span style="position:relative;display:inline-block;width:110px;"><select onchange="Modules.Catalogo._setCatalogForecastPageSize(this.value)" style="width:110px;height:34px;padding:0 32px 0 10px;border:1px solid #E8DCD7;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#FFFCF8;color:#6F6860;box-sizing:border-box;appearance:none;-webkit-appearance:none;-moz-appearance:none;">' + pageSizeOptions + '</select><span class="mi" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:18px;color:#8A7E7C;pointer-events:none;">expand_more</span></span>' +
        '<button type="button" onclick="Modules.Catalogo._setCatalogForecastPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
        '<span style="font-size:12px;color:#8A7E7C;">' + paging.page + ' / ' + paging.totalPages + '</span>' +
        '<button type="button" onclick="Modules.Catalogo._setCatalogForecastPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
      '</div>' +
    '</div>' : '';
    content.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 460px;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Previsão do cardápio</h2><p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:780px;">Leitura comercial do que o cardápio consegue vender agora com o saldo atual. A previsão de receitas e bases continua em Produção → Previsão.</p></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' + cards + '</div>' +
      '<section style="' + _cardStyle() + 'padding:16px;">' +
        '<div style="display:grid;grid-template-columns:minmax(min(100%,280px),1.4fr) minmax(min(100%,190px),.8fr) auto;gap:11px;align-items:end;">' +
          '<label style="display:block;min-width:0;"><span style="display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;">Buscar</span><input type="search" value="' + _esc(_catalogForecastFilters.q || '') + '" placeholder="Produto, categoria ou vínculo" oninput="Modules.Catalogo._setCatalogForecastFilter(\'q\',this.value)" style="' + fieldStyle + '"></label>' +
          '<label style="display:block;min-width:0;"><span style="display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;">Status</span><span style="position:relative;display:block;"><select onchange="Modules.Catalogo._setCatalogForecastFilter(\'status\',this.value)" style="' + selectStyle + '">' + statusOptions + '</select>' + arrow + '</span></label>' +
          '<button type="button" onclick="Modules.Catalogo._clearCatalogForecastFilters()" style="height:40px;padding:0 14px;border:1px solid #EADFD8;border-radius:12px;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Limpar filtros</button>' +
        '</div>' +
      '</section>' +
      '<section style="' + _cardStyle() + 'padding:0;overflow:hidden;">' +
        '<div style="padding:16px 18px;border-bottom:1px solid #EAE4DA;"><h3 style="margin:0;font-size:15px;font-weight:700;color:#1F1F1F;">Disponibilidade comercial</h3><p style="margin:4px 0 0;font-size:12px;color:#6F6860;line-height:1.4;">Uma linha por item ativo do cardápio. Produtos sob encomenda ficam identificados e não entram como bloqueio por saldo.</p></div>' +
        '<div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;min-width:920px;"><thead><tr style="background:#FFFCF8;border-bottom:1px solid #EAE4DA;">' +
          '<th style="text-align:left;padding:11px 14px;font-size:11px;color:#6F6860;font-weight:750;">Produto</th>' +
          '<th style="text-align:left;padding:11px 14px;font-size:11px;color:#6F6860;font-weight:750;">Status</th>' +
          '<th style="text-align:right;padding:11px 14px;font-size:11px;color:#6F6860;font-weight:750;">Pode vender</th>' +
          '<th style="text-align:left;padding:11px 14px;font-size:11px;color:#6F6860;font-weight:750;">Limitador</th>' +
          '<th style="text-align:right;padding:11px 14px;font-size:11px;color:#6F6860;font-weight:750;">Preço</th>' +
          '<th style="text-align:left;padding:11px 14px;font-size:11px;color:#6F6860;font-weight:750;">Ações</th>' +
        '</tr></thead><tbody>' + tableRows + emptyHtml + '</tbody></table></div>' + paginationHtml +
      '</section>' +
    '</div>';
  }

  function _buildCatalogForecastRows() {
    var balances = _catalogForecastBalances(_catalogForecastData.movements || []);
    return (_catalogForecastData.products || []).filter(_isCatalogForecastProduct).map(function (product) {
      product = _normalizeProduct(product || {});
      var madeToOrder = !!(product.madeToOrder || product.productMadeToOrder || product.sobEncomenda);
      var requirements = _catalogProductForecastRequirements(product);
      var details = requirements.map(function (req) {
        var balance = _moneyLike((balances[req.key] || {}).balance);
        var possible = req.requiredPerUnit > 0 ? Math.max(0, balance) / req.requiredPerUnit : 0;
        return Object.assign({}, req, {
          balance: _catalogForecastRound(balance),
          possible: _catalogForecastRound(possible),
          balanceUnit: (balances[req.key] || {}).unit || req.unit || ''
        });
      });
      var limiter = details.reduce(function (current, req) {
        if (!current || req.possible < current.possible) return req;
        return current;
      }, null);
      var capacity = details.length && limiter ? Math.floor(Math.max(0, limiter.possible)) : null;
      var status = madeToOrder ? 'sob_encomenda' : (!details.length ? 'sem_composicao' : (limiter && limiter.possible > 0 ? 'ok' : 'bloqueado'));
      return {
        productId: product.id || '',
        name: product.name || product.title || product.nome || 'Produto sem nome',
        categoryId: product.categoryId || '',
        categoryName: _catalogForecastCategoryName(product),
        sourceLabel: _catalogForecastSourceLabel(product),
        requirements: details,
        limiter: limiter,
        capacity: capacity,
        status: status,
        madeToOrder: madeToOrder,
        price: _moneyLike(product.price != null ? product.price : product.preco != null ? product.preco : product.salePrice)
      };
    }).sort(function (a, b) {
      var order = { bloqueado: 0, sem_composicao: 1, ok: 2, sob_encomenda: 3 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  function _catalogProductForecastRequirements(product) {
    product = product || {};
    var type = String(product.productType || product.type || product.tipo || '').toLowerCase();
    var composition = _catalogProductInternalComposition(product);
    var requirements = composition.length ? _catalogInternalCompositionRequirements(composition) : [];
    if (type === 'combo' || type === 'menu') return _catalogMergeForecastRequirements(requirements.concat(_catalogComboForecastRequirements(product)));
    if (requirements.length) return requirements;
    var src = String(product.unicoSource || product.sourceType || product.source || '').toLowerCase();
    var readyId = product.produtoProntoId || product.sourceItemId || product.readyProductId || '';
    if (src === 'produto_pronto' || src === 'compras_produto' || readyId) {
      if (!readyId) return [];
      return [{
        key: 'produto_pronto:' + readyId,
        name: _catalogReadyItemName(readyId) || product.name || 'Produto pronto',
        requiredPerUnit: 1,
        unit: 'un',
        stockKind: 'produto_pronto'
      }];
    }
    var recipeId = product.fichaTecnicaId || product.fichaId || product.recipeId || '';
    if (!recipeId) return [];
    var recipe = _catalogFindRecipe(recipeId);
    if (!recipe) return [{
      key: 'produto_produzido:' + recipeId,
      name: product.name || 'Produto produzido',
      requiredPerUnit: 1,
      unit: 'un',
      stockKind: 'produto_produzido'
    }];
    var reqs = [{
      key: 'produto_produzido:' + recipeId,
      name: recipe.name || recipe.title || product.name || 'Produto produzido',
      requiredPerUnit: 1,
      unit: recipe.yieldUnit || recipe.unit || 'un',
      stockKind: 'produto_produzido'
    }];
    (recipe.packagingItems || recipe.packaging || recipe.embalagens || []).forEach(function (item) {
      var req = _catalogRequirementFromCompositionItem(Object.assign({}, item, {
        stockItemType: item.stockItemType || item.itemClass || item.classe || item.costType || 'embalagem',
        quantity: item.qty != null ? item.qty : item.quantity != null ? item.quantity : item.stockQuantity,
        itemId: item.itemId || item.insumoId || item.packagingId || item.id,
        stockItemName: item.supplyName || item.itemName || item.name || 'Embalagem'
      }));
      if (req) reqs.push(req);
    });
    return _catalogMergeForecastRequirements(reqs);
  }

  function _catalogComboForecastRequirements(product) {
    var groups = _catalogProductVariantGroups(product);
    if (!groups.length) return [];
    var requirements = [];
    var unclear = false;
    groups.forEach(function (group) {
      var min = parseInt(group.minPerUnit != null ? group.minPerUnit : group.min != null ? group.min : (group.required ? 1 : 0), 10);
      if (!isFinite(min) || min < 0) min = 0;
      if (min <= 0) return;
      var options = (group.options || []).filter(Boolean);
      if (!options.length) { unclear = true; return; }
      var optionReqs = options.map(function (option) { return _catalogOptionForecastRequirement(option, min); });
      if (optionReqs.some(function (req) { return !req; })) { unclear = true; return; }
      var worst = _catalogWorstOptionRequirement(optionReqs);
      if (worst) requirements.push(worst);
    });
    return unclear ? [] : _catalogMergeForecastRequirements(requirements);
  }

  function _catalogProductVariantGroups(product) {
    product = product || {};
    var groups = [];
    if (Array.isArray(product.variants) && product.variants.length) groups = product.variants.slice();
    if (!groups.length && Array.isArray(product.menuChoiceGroups) && product.menuChoiceGroups.length) groups = product.menuChoiceGroups.slice();
    if (!groups.length && Array.isArray(product.variantGroupIds) && product.variantGroupIds.length) {
      groups = product.variantGroupIds.map(function (id) {
        return (_catalogForecastData.variantGroups || []).find(function (group) { return String(group.id || '') === String(id || ''); });
      }).filter(Boolean);
    }
    return groups;
  }

  function _catalogOptionForecastRequirement(option, multiplier) {
    var req = _catalogRequirementFromCompositionItem({
      ref: option.stockRef || option.stockItemRef || option.stockItem || option.ref || '',
      stockRef: option.stockRef || option.stockItemRef || option.stockItem || option.ref || '',
      itemId: option.stockItemId || option.itemId || '',
      stockItemId: option.stockItemId || option.itemId || '',
      stockItemType: option.stockItemType || option.itemClass || option.classe || '',
      itemClass: option.itemClass || option.stockItemType || option.classe || '',
      classe: option.classe || option.stockItemType || option.itemClass || '',
      quantity: option.stockQuantityPerChoice != null ? option.stockQuantityPerChoice : option.stockQuantity != null ? option.stockQuantity : option.stockQty,
      stockUnit: option.stockUnit || option.unit || '',
      unit: option.stockUnit || option.unit || '',
      stockItemName: option.stockItemName || option.itemName || option.name || option.label || '',
      itemName: option.stockItemName || option.itemName || option.name || option.label || ''
    });
    if (!req) return null;
    req.requiredPerUnit = _catalogForecastRound(req.requiredPerUnit * Math.max(1, _moneyLike(multiplier) || 1));
    req.name = (option.name || option.label || 'Opção') + ' → ' + req.name;
    return req;
  }

  function _catalogWorstOptionRequirement(optionReqs) {
    var balances = _catalogForecastBalances(_catalogForecastData.movements || []);
    return optionReqs.slice().sort(function (a, b) {
      var balanceA = _moneyLike((balances[a.key] || {}).balance);
      var balanceB = _moneyLike((balances[b.key] || {}).balance);
      var possibleA = a.requiredPerUnit > 0 ? balanceA / a.requiredPerUnit : Infinity;
      var possibleB = b.requiredPerUnit > 0 ? balanceB / b.requiredPerUnit : Infinity;
      if (possibleA !== possibleB) return possibleA - possibleB;
      return _moneyLike(b.requiredPerUnit) - _moneyLike(a.requiredPerUnit);
    })[0] || null;
  }

  function _catalogProductInternalComposition(product) {
    return Array.isArray(product && product.internalComposition)
      ? product.internalComposition
      : (Array.isArray(product && product.internalCompositionItems)
        ? product.internalCompositionItems
        : (Array.isArray(product && product.composicaoInterna)
          ? product.composicaoInterna
          : (Array.isArray(product && product.stockComposition) ? product.stockComposition : [])));
  }

  function _catalogInternalCompositionRequirements(items) {
    return _catalogMergeForecastRequirements((items || []).map(_catalogRequirementFromCompositionItem).filter(Boolean));
  }

  function _catalogRequirementFromCompositionItem(item) {
    item = item || {};
    var ref = String(item.ref || item.stockRef || item.stockItemRef || '').trim();
    var parts = ref ? ref.split(':') : [];
    var refType = parts[0] || '';
    var refId = parts.slice(1).join(':');
    var stockKind = _catalogNormalizeStockKind(item.stockItemType || item.itemClass || item.classe || item.costType || '');
    if (!stockKind && (refType === 'ficha' || refType === 'receita')) stockKind = 'produto_produzido';
    if (!stockKind && refType === 'base_producao') stockKind = 'base_producao';
    if (!stockKind && (refType === 'produto_pronto' || refType === 'pronto')) stockKind = 'produto_pronto';
    if (!stockKind && refType === 'embalagem') stockKind = 'embalagem';
    if (!stockKind && (refType === 'insumo' || refType === 'ingrediente')) stockKind = 'insumo';
    if (stockKind === 'produto') stockKind = 'produto_pronto';
    if (!stockKind) stockKind = 'insumo';
    var itemId = item.itemId || item.stockItemId || refId || item.fichaTecnicaId || item.fichaId || item.sourceItemId || item.produtoProntoId || item.insumoId || item.packagingId || '';
    var qty = _moneyLike(item.quantity != null ? item.quantity : item.qty != null ? item.qty : item.stockQuantity != null ? item.stockQuantity : item.stockQuantityPerChoice);
    if (qty <= 0) qty = 1;
    if (!itemId) return null;
    return {
      key: stockKind + ':' + itemId,
      name: item.itemName || item.stockItemName || item.supplyName || item.name || item.label || 'Item interno',
      requiredPerUnit: qty,
      unit: item.unit || item.stockUnit || 'un',
      stockKind: stockKind
    };
  }

  function _catalogMergeForecastRequirements(requirements) {
    var merged = {};
    (requirements || []).forEach(function (req) {
      if (!req || !req.key || !(req.requiredPerUnit > 0)) return;
      if (!merged[req.key]) merged[req.key] = Object.assign({}, req);
      else merged[req.key].requiredPerUnit = _catalogForecastRound(_moneyLike(merged[req.key].requiredPerUnit) + _moneyLike(req.requiredPerUnit));
    });
    return Object.keys(merged).map(function (key) { return merged[key]; });
  }

  function _catalogForecastBalances(movements) {
    var map = {};
    (movements || []).forEach(function (movement) {
      var entry = _catalogForecastMovementEntry(movement || {});
      if (!entry.key || !entry.quantity) return;
      if (!map[entry.key]) map[entry.key] = { balance: 0, unit: entry.unit || '' };
      map[entry.key].balance += entry.direction * entry.quantity;
      map[entry.key].unit = map[entry.key].unit || entry.unit || '';
    });
    Object.keys(map).forEach(function (key) { map[key].balance = _catalogForecastRound(map[key].balance); });
    return map;
  }

  function _catalogForecastMovementEntry(movement) {
    var type = movement && movement.type;
    var direction = 0;
    if (type === 'entrada_compra' || type === 'entrada_producao' || type === 'entrada_base_producao' || type === 'entrada_regularizacao' || type === 'ajuste_entrada' || type === 'estorno_venda' || type === 'estorno_producao_ingrediente') direction = 1;
    if (type === 'saida_producao' || type === 'saida_venda' || type === 'saida_base_venda' || type === 'ajuste_saida' || type === 'estorno_compra' || type === 'estorno_producao_produto' || type === 'estorno_base_producao') direction = -1;
    if (!direction) return {};
    var stockKind = _catalogMovementStockKind(movement);
    var itemId = stockKind === 'produto_produzido'
      ? (movement.fichaTecnicaId || movement.recipeId || movement.productId || '')
      : (stockKind === 'base_producao'
        ? (movement.baseProductionId || movement.sharedBaseId || movement.componentName || '')
        : (stockKind === 'produto_pronto'
          ? (movement.sourceItemId || movement.produtoProntoId || movement.itemId || '')
          : (movement.ingredientId || movement.itemId || '')));
    var quantity = (stockKind === 'produto_produzido' || stockKind === 'base_producao') ? _moneyLike(movement.quantityProduced || movement.quantity) : _moneyLike(movement.quantity);
    return {
      key: stockKind + ':' + (itemId || _catalogMovementName(movement)),
      direction: direction,
      quantity: Math.abs(quantity),
      unit: (stockKind === 'produto_produzido' || stockKind === 'base_producao') ? (movement.yieldUnit || movement.unit || '') : (movement.unit || '')
    };
  }

  function _catalogMovementStockKind(movement) {
    var cls = _catalogNormalizeStockKind(movement && (movement.stockItemType || movement.itemClass || movement.classe || ''));
    if (cls === 'produto') return 'produto_pronto';
    if (cls === 'produto_produzido' || cls === 'base_producao' || cls === 'embalagem' || cls === 'insumo') return cls;
    if (movement && (movement.baseProductionId || movement.type === 'entrada_base_producao' || movement.type === 'estorno_base_producao')) return 'base_producao';
    if (movement && (movement.fichaTecnicaId || movement.recipeId)) return 'produto_produzido';
    if (movement && (movement.sourceItemId || movement.produtoProntoId)) return 'produto_pronto';
    return 'insumo';
  }

  function _catalogNormalizeStockKind(value) {
    var raw = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_');
    if (raw === 'produto' || raw === 'produto_pronto' || raw === 'compras_produto' || raw === 'pronto') return 'produto_pronto';
    if (raw === 'produto_produzido' || raw === 'receita' || raw === 'ficha' || raw === 'ficha_tecnica') return 'produto_produzido';
    if (raw === 'base_producao' || raw === 'etapa_producao' || raw === 'etapa') return 'base_producao';
    if (raw === 'embalagem') return 'embalagem';
    if (raw === 'insumo' || raw === 'ingrediente') return 'insumo';
    return '';
  }

  function _catalogMovementName(movement) {
    return firstText(movement && movement.itemName, movement && movement.productName, movement && movement.ingredientName, movement && movement.fichaNome, movement && movement.componentName, 'item');
  }

  function _catalogFindRecipe(id) {
    return (_catalogForecastData.recipes || []).find(function (item) {
      return String(item.id || '') === String(id || '') || String(item.fichaTecnicaId || '') === String(id || '');
    }) || null;
  }

  function _catalogReadyItemName(id) {
    var found = (_catalogForecastData.readyItems || []).find(function (item) { return String(item.id || '') === String(id || ''); });
    return found && found.name || '';
  }

  function _catalogForecastCategoryName(product) {
    product = product || {};
    var id = product.categoryId || product.category || '';
    var found = (_catalogForecastData.categories || []).find(function (cat) {
      return String(cat.id || '') === String(id || '') || String(cat.slug || '') === String(id || '') || String(cat.name || '') === String(id || '');
    });
    return found && found.name || firstText(product.categoryName, product.categoryLabel, id);
  }

  function _catalogForecastSourceLabel(product) {
    product = product || {};
    var type = String(product.productType || product.type || product.tipo || '').toLowerCase();
    if (type === 'combo' || type === 'menu') return 'Combo/Menu';
    if (_catalogProductInternalComposition(product).length) return 'Montagem interna';
    if (product.produtoProntoId || product.sourceItemId || product.readyProductId) return 'Produto pronto';
    if (product.fichaTecnicaId || product.fichaId || product.recipeId) return 'Produto produzido';
    return 'Sem vínculo de estoque';
  }

  function _isCatalogForecastProduct(product) {
    if (!product || !product.id) return false;
    if (product.ativo === false || product.active === false || product.deleted === true || product.isDeleted === true || product.archived === true) return false;
    return true;
  }

  function _filteredCatalogForecastRows(rows) {
    var query = String(_catalogForecastFilters.q || '').trim().toLowerCase();
    var status = String(_catalogForecastFilters.status || 'todos');
    return (rows || []).filter(function (row) {
      if (status !== 'todos' && row.status !== status) return false;
      if (!query) return true;
      var haystack = [row.name, row.categoryName, row.sourceLabel, row.status, row.limiter && row.limiter.name].concat((row.requirements || []).map(function (req) { return [req.name, req.key, req.stockKind].join(' '); })).join(' ').toLowerCase();
      return haystack.indexOf(query) >= 0;
    });
  }

  function _catalogForecastSummary(rows) {
    return {
      total: (rows || []).length,
      ok: (rows || []).filter(function (row) { return row.status === 'ok'; }).length,
      blocked: (rows || []).filter(function (row) { return row.status === 'bloqueado'; }).length,
      unclear: (rows || []).filter(function (row) { return row.status === 'sem_composicao'; }).length
    };
  }

  function _catalogForecastPaging(rows) {
    var total = (rows || []).length;
    var pageSize = Math.max(10, parseInt(_catalogForecastView.pageSize, 10) || 25);
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, parseInt(_catalogForecastView.page, 10) || 1), totalPages);
    var start = (page - 1) * pageSize;
    return {
      items: (rows || []).slice(start, start + pageSize),
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(total, start + pageSize)
    };
  }

  function _catalogForecastTableRowHtml(row) {
    var status = _catalogForecastStatus(row);
    var pillBg = status.tone === 'ok' ? '#ECFDF3' : (status.tone === 'warn' ? '#FFF7ED' : (status.tone === 'neutral' ? '#F5F3FF' : '#FEF3F2'));
    var pillColor = status.tone === 'ok' ? '#027A48' : (status.tone === 'warn' ? '#C2410C' : (status.tone === 'neutral' ? '#5B21B6' : '#B42318'));
    var capacity = row.capacity == null ? '—' : (_roundDisplay(row.capacity) + ' un.');
    var limiter = row.limiter ? '<div style="font-size:13px;font-weight:650;color:#1F1F1F;line-height:1.35;">' + _esc(row.limiter.name || 'Item') + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">Saldo ' + _esc(_roundDisplay(row.limiter.balance)) + ' ' + _esc(row.limiter.balanceUnit || row.limiter.unit || '') + ' · usa ' + _esc(_roundDisplay(row.limiter.requiredPerUnit)) + ' ' + _esc(row.limiter.unit || '') + '</div>' : '<span style="font-size:12px;color:#8A7E7C;">' + (row.status === 'sob_encomenda' ? 'Prazo definido no produto' : 'Sem limitador calculável') + '</span>';
    return '<tr style="border-bottom:1px solid #F0E7E2;background:#fff;">' +
      '<td style="padding:12px 14px;vertical-align:top;min-width:270px;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:360px;">' + _esc(row.name) + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc([row.sourceLabel, row.categoryName].filter(Boolean).join(' · ')) + '</div></td>' +
      '<td style="padding:12px 14px;vertical-align:top;white-space:nowrap;"><span style="display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:' + pillBg + ';color:' + pillColor + ';font-size:11px;font-weight:750;">' + _esc(status.label) + '</span></td>' +
      '<td style="padding:12px 14px;vertical-align:top;text-align:right;font-size:13px;font-weight:750;color:#1F1F1F;white-space:nowrap;">' + _esc(capacity) + '</td>' +
      '<td style="padding:12px 14px;vertical-align:top;min-width:230px;">' + limiter + '</td>' +
      '<td style="padding:12px 14px;vertical-align:top;text-align:right;font-size:13px;font-weight:750;color:#1F1F1F;white-space:nowrap;">' + _fmtMoneyDisplay(row.price) + '</td>' +
      '<td style="padding:12px 14px;vertical-align:top;white-space:nowrap;"><button type="button" onclick="Modules.Catalogo._openCatalogForecastDetails(\'' + _esc(row.productId) + '\')" style="height:32px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;">Ver cálculo</button></td>' +
    '</tr>';
  }

  function _catalogForecastStatus(row) {
    if (!row || row.status === 'sem_composicao') return { label: 'Sem composição clara', tone: 'warn' };
    if (row.status === 'sob_encomenda') return { label: 'Sob encomenda', tone: 'neutral' };
    if (row.status === 'bloqueado') return { label: 'Limitado por estoque', tone: 'danger' };
    return { label: 'Pode vender', tone: 'ok' };
  }

  function _openCatalogForecastDetails(productId) {
    var row = (_buildCatalogForecastRows() || []).find(function (item) { return String(item.productId || '') === String(productId || ''); });
    if (!row) { UI.toast('Previsão não encontrada.', 'error'); return; }
    var status = _catalogForecastStatus(row);
    var rowsHtml = (row.requirements || []).map(function (item) {
      var isLimiter = row.limiter && item.key === row.limiter.key;
      return '<tr style="border-bottom:1px solid #F0E7E2;">' +
        '<td style="padding:10px 12px;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(item.name || 'Item') + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(_catalogForecastRequirementSubtitle(item, isLimiter)) + '</div></td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:650;color:#1F1F1F;white-space:nowrap;">' + _esc(_roundDisplay(item.requiredPerUnit)) + ' ' + _esc(item.unit || '') + '</td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:650;color:#1F1F1F;white-space:nowrap;">' + _esc(_roundDisplay(item.balance)) + ' ' + _esc(item.balanceUnit || item.unit || '') + '</td>' +
        '<td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:650;color:#1F1F1F;white-space:nowrap;">' + _esc(_roundDisplay(item.possible)) + ' un.</td>' +
      '</tr>';
    }).join('');
    var body = '<style>' +
      '.catalog-forecast-modal{display:flex;flex-direction:column;gap:14px;}' +
      '.catalog-forecast-modal table{width:100%;min-width:0!important;table-layout:fixed;border-collapse:collapse;}' +
      '.catalog-forecast-modal th,.catalog-forecast-modal td{padding:8px 9px!important;font-size:11.5px!important;white-space:normal!important;word-break:break-word;}' +
      '.catalog-forecast-modal th:nth-child(1),.catalog-forecast-modal td:nth-child(1){width:38%;}' +
      '.catalog-forecast-modal th:nth-child(2),.catalog-forecast-modal td:nth-child(2){width:20%;}' +
      '.catalog-forecast-modal th:nth-child(3),.catalog-forecast-modal td:nth-child(3){width:20%;}' +
      '.catalog-forecast-modal th:nth-child(4),.catalog-forecast-modal td:nth-child(4){width:22%;}' +
    '</style><div class="catalog-forecast-modal">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">' +
        '<div style="border:1px solid #EAE4DA;border-radius:14px;padding:12px;background:#FFFCF8;"><div style="font-size:11px;font-weight:700;color:#6F6860;">Status</div><div style="font-size:16px;font-weight:800;color:#1F1F1F;margin-top:4px;">' + _esc(status.label) + '</div></div>' +
        '<div style="border:1px solid #EAE4DA;border-radius:14px;padding:12px;background:#FFFCF8;"><div style="font-size:11px;font-weight:700;color:#6F6860;">Pode vender</div><div style="font-size:16px;font-weight:800;color:#1F1F1F;margin-top:4px;">' + _esc(row.capacity == null ? '—' : _roundDisplay(row.capacity) + ' un.') + '</div></div>' +
        '<div style="border:1px solid #EAE4DA;border-radius:14px;padding:12px;background:#FFFCF8;"><div style="font-size:11px;font-weight:700;color:#6F6860;">Origem</div><div style="font-size:16px;font-weight:800;color:#1F1F1F;margin-top:4px;">' + _esc(row.sourceLabel || '') + '</div></div>' +
      '</div>' +
      '<div style="border:1px solid #EAE4DA;border-radius:14px;overflow:hidden;"><table><thead><tr style="background:#FFFCF8;border-bottom:1px solid #EAE4DA;"><th style="text-align:left;color:#6F6860;">Item</th><th style="text-align:right;color:#6F6860;">Consumo por venda</th><th style="text-align:right;color:#6F6860;">Saldo atual</th><th style="text-align:right;color:#6F6860;">Capacidade</th></tr></thead><tbody>' + (rowsHtml || '<tr><td colspan="4" style="padding:18px;text-align:center;color:#8A7E7C;font-size:13px;">Sem composição clara para calcular.</td></tr>') + '</tbody></table></div>' +
    '</div>';
    window._catalogForecastModal = UI.modal({ title: 'Cálculo da previsão — ' + row.name, body: body, maxWidth: '1080px' });
  }

  function _catalogForecastRequirementSubtitle(item, isLimiter) {
    item = item || {};
    var kind = _catalogForecastStockKindLabel(item.stockKind || _catalogNormalizeStockKind(String(item.key || '').split(':')[0] || ''));
    var unit = item.unit || item.balanceUnit || '';
    var parts = [];
    if (kind) parts.push(kind);
    if (unit) parts.push('unidade ' + unit);
    if (isLimiter) parts.push('limitador da previsão');
    return parts.join(' · ') || 'Item controlado no estoque';
  }

  function _catalogForecastStockKindLabel(kind) {
    kind = _catalogNormalizeStockKind(kind || '');
    if (kind === 'produto_produzido') return 'Produto produzido';
    if (kind === 'base_producao') return 'Base de produção';
    if (kind === 'produto_pronto') return 'Produto pronto';
    if (kind === 'embalagem') return 'Embalagem';
    if (kind === 'insumo') return 'Insumo';
    return '';
  }

  function _setCatalogForecastFilter(key, value) {
    _catalogForecastFilters[key] = String(value || '');
    if (key !== 'q' && !_catalogForecastFilters[key]) _catalogForecastFilters[key] = 'todos';
    _catalogForecastView.page = 1;
    if (key === 'q') {
      if (_catalogForecastSearchTimer) clearTimeout(_catalogForecastSearchTimer);
      _catalogForecastSearchTimer = setTimeout(_paintPrevisaoCardapio, 160);
      return;
    }
    _paintPrevisaoCardapio();
  }

  function _clearCatalogForecastFilters() {
    _catalogForecastFilters = { q: '', status: 'todos' };
    _catalogForecastView.page = 1;
    _paintPrevisaoCardapio();
  }

  function _setCatalogForecastPage(page) {
    _catalogForecastView.page = Math.max(1, parseInt(page, 10) || 1);
    _paintPrevisaoCardapio();
  }

  function _setCatalogForecastPageSize(size) {
    _catalogForecastView.pageSize = Math.max(10, parseInt(size, 10) || 25);
    _catalogForecastView.page = 1;
    _paintPrevisaoCardapio();
  }

  function _catalogForecastRound(value) {
    var n = _moneyLike(value || 0);
    return Math.round(n * 1000000) / 1000000;
  }

  function _catalogSalesData(orders, products) {
    var byId = {};
    var byName = {};
    (products || []).forEach(function (product) {
      var p = _normalizeProduct(product || {});
      if (p.id) byId[String(p.id)] = p;
      if (p.name) byName[String(p.name).trim().toLowerCase()] = p;
    });
    var rows = [];
    (orders || []).filter(_validOrderForProductHistory).forEach(function (order) {
      var date = _toDateSafe(order && (order.createdAt || order.orderCreatedAt || order.createdDate || order.registeredAt || order.date || order.dateTime || order.updatedAt));
      var channel = firstText(order && order.channelName, order && order.salesChannelName, order && order.channel, order && order.source, order && order.originChannel, 'Cardápio');
      var orderId = firstText(order && order.id, order && order.orderId, '');
      var orderNumber = firstText(order && order.number, order && order.orderNumber, order && order.code, orderId ? '#' + String(orderId).slice(-6).toUpperCase() : '');
      var customer = firstText(order && order.customerName, order && order.clientName, order && order.name, order && order.customer && order.customer.name, '');
      _orderProductItems(order).forEach(function (item, idx) {
        if (!item || typeof item !== 'object') return;
        var productId = _orderItemProductId(item);
        var name = _orderItemName(item);
        var product = productId ? byId[productId] : null;
        if (!product && name) product = byName[name.toLowerCase()] || null;
        var type = _catalogSaleType(item, product);
        var qty = _orderItemQty(item);
        var total = _orderItemTotalValue(item, qty, product || {});
        rows.push({
          key: [orderId || 'pedido', productId || name || idx, idx].join(':'),
          orderId: orderId,
          orderNumber: orderNumber,
          date: date,
          dateTs: date ? date.getTime() : 0,
          customer: customer,
          channel: channel,
          status: firstText(order && order.status, 'Pendente'),
          paymentStatus: firstText(order && order.paymentStatus, order && order.paymentState, ''),
          productId: productId || (product && product.id) || '',
          productName: name || (product && product.name) || 'Item do cardápio',
          productType: type.value,
          productTypeLabel: type.label,
          qty: qty,
          unitPrice: qty > 0 ? total / qty : _moneyLike(item.price || item.unitPrice || 0),
          total: total,
          choicesText: _catalogSaleChoicesText(item)
        });
      });
    });
    rows.sort(function (a, b) { return (b.dateTs - a.dateTs) || String(b.orderNumber || '').localeCompare(String(a.orderNumber || '')); });
    return { rows: rows };
  }

  function _catalogSaleType(item, product) {
    var raw = String(firstText(item && item.productType, item && item.type, product && product.productType, product && product.type, '')).toLowerCase();
    if (raw === 'menu' || raw === 'combo') return { value: 'combo', label: 'Combo/Menu' };
    if (product && (product.type === 'menu' || product.productType === 'combo')) return { value: 'combo', label: 'Combo/Menu' };
    if (product && product.fichaId) return { value: 'receita', label: 'Receita/produto produzido' };
    if (product && (product.produtoProntoId || product.sourceItemId)) return { value: 'pronto', label: 'Produto pronto' };
    return { value: 'produto', label: 'Produto avulso' };
  }

  function _catalogSaleChoicesText(item) {
    var choices = Array.isArray(item && item.choices) ? item.choices : [];
    if (!choices.length) return '';
    return choices.map(function (choice) {
      if (typeof choice === 'string') return choice;
      var group = firstText(choice.groupName, choice.group, choice.title, '');
      var label = firstText(choice.optionName, choice.name, choice.label, choice.value, '');
      return [group, label].filter(Boolean).join(': ');
    }).filter(Boolean).join(' · ');
  }

  function _filterCatalogSalesRows(rows) {
    var query = String(_salesFilters.q || '').trim().toLowerCase();
    var period = String(_salesFilters.period || '90');
    var channel = String(_salesFilters.channel || 'todos');
    var type = String(_salesFilters.type || 'todos');
    var limit = 0;
    if (period !== 'all') limit = Date.now() - ((parseInt(period, 10) || 90) * 86400000);
    return (rows || []).filter(function (row) {
      if (limit && (!row.dateTs || row.dateTs < limit)) return false;
      if (channel !== 'todos' && row.channel !== channel) return false;
      if (type !== 'todos' && row.productType !== type) return false;
      if (!query) return true;
      var haystack = [row.productName, row.orderNumber, row.customer, row.channel, row.choicesText].join(' ').toLowerCase();
      return haystack.indexOf(query) >= 0;
    });
  }

  function _catalogSalesPaging(rows) {
    var total = (rows || []).length;
    var pageSize = Math.max(10, parseInt(_salesView.pageSize, 10) || 25);
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, parseInt(_salesView.page, 10) || 1), totalPages);
    var start = (page - 1) * pageSize;
    return {
      items: (rows || []).slice(start, start + pageSize),
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(total, start + pageSize)
    };
  }

  function _catalogSalesSummary(rows) {
    var orders = {};
    var products = {};
    var qty = 0;
    var revenue = 0;
    (rows || []).forEach(function (row) {
      if (row.orderId || row.orderNumber) orders[row.orderId || row.orderNumber] = true;
      qty += _moneyLike(row.qty || 0);
      revenue += _moneyLike(row.total || 0);
      var key = row.productId || row.productName;
      if (!products[key]) products[key] = { name: row.productName, qty: 0, revenue: 0, typeLabel: row.productTypeLabel };
      products[key].qty += _moneyLike(row.qty || 0);
      products[key].revenue += _moneyLike(row.total || 0);
    });
    var ranking = Object.keys(products).map(function (key) { return products[key]; }).sort(function (a, b) {
      return (b.qty - a.qty) || (b.revenue - a.revenue) || String(a.name || '').localeCompare(String(b.name || ''));
    });
    return {
      rows: (rows || []).length,
      orders: Object.keys(orders).length,
      qty: qty,
      revenue: revenue,
      avgLine: rows && rows.length ? revenue / rows.length : 0,
      topName: ranking[0] ? ranking[0].name : '',
      topQty: ranking[0] ? ranking[0].qty : 0
    };
  }

  function _catalogSalesRanking(rows) {
    var map = {};
    (rows || []).forEach(function (row) {
      var key = row.productId || row.productName;
      if (!map[key]) map[key] = { name: row.productName, qty: 0, revenue: 0, typeLabel: row.productTypeLabel };
      map[key].qty += _moneyLike(row.qty || 0);
      map[key].revenue += _moneyLike(row.total || 0);
    });
    return Object.keys(map).map(function (key) { return map[key]; }).sort(function (a, b) {
      return (b.revenue - a.revenue) || (b.qty - a.qty) || String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  function _catalogSalesChannelOptions(rows) {
    var map = {};
    (_salesChannels || []).forEach(function (channel) { if (channel) map[channel] = true; });
    (rows || []).forEach(function (row) { if (row.channel) map[row.channel] = true; });
    return Object.keys(map).sort(function (a, b) { return a.localeCompare(b); });
  }

  function _catalogConfiguredSalesChannels(config) {
    var map = { 'Cardápio': true };
    var list = Array.isArray(config && config.list) ? config.list : [];
    list.forEach(function (channel) {
      if (!channel || channel.active === false || channel.ativo === false || channel.enabled === false) return;
      var name = firstText(channel.name, channel.nome, channel.label, channel.key, '');
      if (!name) return;
      var key = _fold(name).replace(/\s+/g, ' ').trim();
      if (key === 'cardapio' || key === 'template' || key === 'store' || key === 'storefront' || key === 'loja online') name = 'Cardápio';
      if (key === 'tpv' || key === 'venda presencial' || key === 'venda-presencial') name = 'Venda presencial';
      map[name] = true;
    });
    return Object.keys(map).sort(function (a, b) { return a.localeCompare(b); });
  }

  function _catalogSalesTableRowHtml(row) {
    var date = row.date ? row.date.toLocaleDateString('pt-PT') : 'Sem data';
    var choices = row.choicesText ? '<div style="font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px;">' + _esc(row.choicesText) + '</div>' : '';
    return '<tr>' +
      '<td style="font-size:12px;color:#6F6860;white-space:nowrap;">' + _esc(date) + '</td>' +
      '<td style="min-width:260px;"><div style="font-size:13px;font-weight:650;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:360px;">' + _esc(row.productName) + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(row.productTypeLabel) + '</div>' + choices + '</td>' +
      '<td><div style="font-size:12px;font-weight:650;color:#1F1F1F;white-space:nowrap;">' + _esc(row.orderNumber || row.orderId || 'Pedido') + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">' + _esc(row.customer || 'Cliente não informado') + '</div></td>' +
      '<td style="font-size:12px;color:#6F6860;white-space:nowrap;">' + _esc(row.channel || 'Cardápio') + '</td>' +
      '<td style="font-size:12px;color:#6F6860;white-space:nowrap;">' + _esc(row.status || '') + '</td>' +
      '<td style="text-align:right;font-size:13px;font-weight:650;color:#1F1F1F;white-space:nowrap;">' + _roundDisplay(row.qty) + '</td>' +
      '<td style="text-align:right;font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;">' + _fmtMoneyDisplay(row.total) + '</td>' +
    '</tr>';
  }

  function _setCatalogSalesSearch(value) {
    _salesFilters.q = String(value || '');
    _salesView.page = 1;
    if (_salesSearchTimer) clearTimeout(_salesSearchTimer);
    _salesSearchTimer = setTimeout(function () {
      _salesSearchTimer = null;
      _paintVendasCardapio();
    }, 160);
  }

  function _roundDisplay(value) {
    var n = _moneyLike(value || 0);
    if (Math.abs(n - Math.round(n)) < 0.000001) return String(Math.round(n));
    return n.toFixed(2).replace('.', ',');
  }

  function _setCatalogSalesFilter(key, value) {
    _salesFilters[key] = String(value || '');
    if (key !== 'q' && !_salesFilters[key]) _salesFilters[key] = 'todos';
    _salesView.page = 1;
    _paintVendasCardapio();
  }

  function _clearCatalogSalesFilters() {
    _salesFilters = { q: '', period: '90', channel: 'todos', type: 'todos' };
    _salesView.page = 1;
    _paintVendasCardapio();
  }

  function _setCatalogSalesPage(page) {
    _salesView.page = Math.max(1, parseInt(page, 10) || 1);
    _paintVendasCardapio();
  }

  function _setCatalogSalesPageSize(size) {
    _salesView.pageSize = Math.max(10, parseInt(size, 10) || 25);
    _salesView.page = 1;
    _paintVendasCardapio();
  }

  function _productTableRowHTML(p, canOrder) {
    p = _normalizeProduct(p);
    var cat = _categories.find(function (c) { return c.id === p.categoryId || c.slug === p.categoryId || c.name === p.categoryId; });
    var price = _moneyLike(p.price || 0);
    var desc = p.shortDesc || p.description || p.microcopy || '';
    var imgSrc = p.imageThumbUrl || p.imageCardUrl || p.imageUrl || p.imageBase64 || p.img || '';
    var imgHtml = imgSrc
      ? '<img src="' + _esc(imgSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentNode.innerHTML=\'<span class=&quot;mi&quot; style=&quot;font-size:18px;color:#C9BCB8;&quot;>image</span>\';">'
      : '<span class="mi" style="font-size:18px;color:#C9BCB8;">image</span>';
    var statusActive = p.menuVisible !== false;
    var featured = p.featured === true || p.popular === true;
    var statusHtml = statusActive
      ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#5B7A67;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:#6C8777;display:inline-block;"></span>Visível</span>'
      : '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:#A39B90;display:inline-block;"></span>Oculto</span>';
    var featuredHtml = featured
      ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#B42318;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span class="mi" style="font-size:14px;color:#B6925E;">star</span>Destaque</span>'
      : '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#A39B90;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span class="mi" style="font-size:14px;">star_border</span>Normal</span>';
    var categoryHtml = cat
      ? '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;border:1px solid #EAE4DA;">' + _esc(cat.name || cat.label || '') + '</span>'
      : '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#fff;color:#A39B90;font-size:12px;font-weight:500;border:1px solid #EAE4DA;">Sem categoria</span>';
    var codeLine = [p.codigo || p.sku || '', p.type === 'menu' || p.productType === 'combo' ? 'Combo/Menu' : 'Produto'].filter(Boolean).join(' · ');
    return '<tr draggable="true" data-id="' + p.id + '" onclick="Modules.Catalogo._openProductModal(\'' + p.id + '\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
      '<td style="padding:13px 16px;vertical-align:middle;">' +
        '<div style="display:flex;align-items:center;gap:5px;">' +
          '<span class="mi" title="Arrastar para ordenar" style="width:28px;height:28px;border-radius:9px;background:#FFFCF8;border:1px solid #EAE4DA;color:#A39B90;font-size:17px;display:inline-flex;align-items:center;justify-content:center;cursor:grab;">drag_indicator</span>' +
          (canOrder ? '<button type="button" title="Subir produto" onclick="event.stopPropagation();Modules.Catalogo._moveProductInCategory(\'' + _esc(p.id) + '\', -1)" style="width:28px;height:28px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:16px;">keyboard_arrow_up</span></button><button type="button" title="Descer produto" onclick="event.stopPropagation();Modules.Catalogo._moveProductInCategory(\'' + _esc(p.id) + '\', 1)" style="width:28px;height:28px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:16px;">keyboard_arrow_down</span></button>' : '') +
        '</div>' +
      '</td>' +
      '<td style="padding:12px 16px;vertical-align:middle;min-width:280px;">' +
        '<div style="display:flex;align-items:center;gap:12px;min-width:0;">' +
          '<div style="width:48px;height:48px;border-radius:12px;background:#fff;border:1px solid #EAE4DA;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;box-shadow:0 1px 2px rgba(31,31,31,.03);">' + imgHtml + '</div>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(p.name || 'Produto') + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">' + _esc(codeLine || desc || 'Sem descrição curta') + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;">' + categoryHtml + '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + _fmtMoneyDisplay(price) + '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;">' + statusHtml + '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;">' + featuredHtml + '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;text-align:right;white-space:nowrap;">' +
        '<div style="display:inline-flex;align-items:center;gap:6px;">' +
          '<button type="button" title="Editar" onclick="event.stopPropagation();Modules.Catalogo._openProductModal(\'' + p.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">edit</span></button>' +
          '<button type="button" title="Duplicar" onclick="event.stopPropagation();Modules.Catalogo._duplicateProduct(\'' + p.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">content_copy</span></button>' +
          '<button type="button" title="Excluir" onclick="event.stopPropagation();Modules.Catalogo._deleteProduct(\'' + p.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#B42318;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">delete</span></button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  function _quickUpdateProduct(event, id, field, value) {
    if (event) event.stopPropagation();
    var product = _products.find(function (p) { return String(p.id) === String(id); });
    if (!product) return;
    var data = {};
    if (field === 'name') {
      var name = String(value || '').trim();
      if (!name) {
        UI.toast('Nome obrigatório.', 'error');
        _paintProdutos();
        return;
      }
      data.name = name;
      product.name = name;
    }
    if (field === 'price') {
      var price = parseFloat(String(value || '').replace(',', '.'));
      if (!isFinite(price) || price <= 0) {
        UI.toast('Informe um preço de venda válido.', 'error');
        _paintProdutos();
        return;
      }
      data.price = price;
      product.price = price;
    }
    DB.update('products', id, data)
      .then(function () { UI.toast('Produto atualizado.', 'success'); })
      .catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); _renderProdutos(); });
  }

  function _openProductModal(id) {
    _editingId = id;
    var p = id ? (_products.find(function (x) { return x.id === id; }) || {}) : {};
    window._pmDraftId = id || _newEntityId('prod');
    window._pmImageState = null;

    // Gather data needed for modal
    Promise.all([
      DB.getAll('categories'),
      DB.getAll('fichasTecnicas'),
      DB.getAll('itens_custo'),
      DB.getAll('variantGroups'),
      DB.getAll('tags'),
      DB.getAll('promotions'),
      DB.getDocRoot ? DB.getDocRoot('config', 'fiscal').catch(function () { return {}; }) : Promise.resolve({}),
      DB.getAll('stock_movements').catch(function () { return []; }),
      DB.getAll('stock_settings').catch(function () { return []; })
    ]).then(function (r) {
      _categories = r[0] || [];
      _fichas = r[1] || [];
      _produtosProntos = _normalizeProdutosCompras(r[2] || []);
      _stockCompositionItems = _normalizeStockCompositionItems(r[2] || []);
      _variants = r[3] || [];
      _tags = r[4] || [];
      _promotions = r[5] || [];
      _fiscalConfig = r[6] || {};
      _stockMovements = r[7] || [];
      _baseCompositionItems = _normalizeBaseCompositionItems(r[8] || []);
      _buildProductModal(p, id);
    });
  }

  function _buildProductModal(p, id) {
    p = _normalizeProduct(p);
    var tipoMenu = p.type === 'menu' || p.productType === 'combo';
    var tipoUnico = !tipoMenu;
    var internalComposition = _normalizeInternalComposition(p);
    window._pmInternalCompositionQuery = '';
    var unicoSubComposicao = p.unicoSource === 'composicao_interna' || (!p.unicoSource && internalComposition.length > 0);
    var unicoSubReceita = !unicoSubComposicao && (!p.unicoSource || p.unicoSource === 'receita');
    var unicoSubPronto = !unicoSubComposicao && (p.unicoSource === 'produto_pronto' || p.unicoSource === 'compras_produto');
    var fichaOptions = _fichas.map(function (f) {
      return '<option value="' + f.id + '"' + (p.fichaId === f.id ? ' selected' : '') + '>' + _esc(f.name) + '</option>';
    }).join('');
    var prontoOptions = _produtosProntos.map(function (pp) {
      var selectedId = p.produtoProntoId || p.sourceItemId || '';
      return '<option value="' + pp.id + '"' + (String(selectedId) === String(pp.id) ? ' selected' : '') + '>' + _esc(pp.name) + '</option>';
    }).join('');
    var internalCompositionHtml = _internalCompositionRowsHtml(internalComposition);
    var menuGroups = _normalizeMenuGroups(p);
    var menuGroupsHtml = menuGroups.map(function (group, i) { return _menuGroupRowHtml(i, group); }).join('');
    var availableUpsellIds = {};
    _upsellProductPool().forEach(function (item) { availableUpsellIds[String(item.id)] = true; });
    var addAlsoIds = (p.addAlsoIds || []).map(String).filter(function (id, index, arr) {
      return availableUpsellIds[String(id)] && arr.indexOf(id) === index;
    });
    var addAlsoTitle = p.addAlsoTitle || p.upsellTitle || 'Aumentar valor do pedido';
    var addAlsoDiscount = parseFloat(String(p.addAlsoDiscount || p.upsellDiscount || 0).replace(',', '.')) || 0;
    var pairingId = firstText(p.pairing, p.pairingId, p.pairingProductId, '');
    var pricingPreview = _productPricingPreview(p);
    var promoBlockHtml = _promoBlockHtml(p);
    var pricingChipsHtml = pricingPreview
      ? '<span style="background:#fff;border:1px solid #EAE4DA;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;color:#1F1F1F;">Custo: ' + UI.fmt(pricingPreview.cost) + '</span>' +
        '<span style="background:#fff;border:1px solid #EAE4DA;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;color:' + (pricingPreview.margin < 0 ? '#B42318' : '#1A9E5A') + ';">Margem: ' + pricingPreview.margin.toFixed(1).replace('.', ',') + '%</span>' +
        '<span style="background:#fff;border:1px solid #EAE4DA;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;color:' + (pricingPreview.profit < 0 ? '#B42318' : '#1A9E5A') + ';">Lucro: ' + UI.fmt(pricingPreview.profit) + '</span>'
      : '<span style="font-size:11px;color:#7A746B;">Preencha preço e base para ver custo e margem.</span>';
    var tagsHtml = (_tags.length === 0 ? '<p style="font-size:12px;color:#8A7E7C;margin:0;">Nenhuma tag cadastrada.</p>' : _tags.map(function (tag) {
      var isSelected = (p.tags || []).some(function (t) { return (t.id || t.text) === tag.id || (t.id || t.text) === tag.text; });
      return '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin:2px 3px;">' +
        '<input type="checkbox" class="pm-tag-check" data-tag-id="' + tag.id + '" data-tag-text="' + _esc(tag.text) + '" data-tag-bg="' + _esc(tag.bgColor || '#B42318') + '" data-tag-color="' + _esc(tag.textColor || '#ffffff') + '"' + (isSelected ? ' checked' : '') + ' onchange="Modules.Catalogo._refreshProductPreview()" style="accent-color:#B42318;">' +
        '<span style="background:' + (tag.bgColor || '#F7F1F0') + ';color:' + (tag.textColor || '#5E5553') + ';padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;">' + _esc(tag.text) + '</span>' +
        '</label>';
    }).join(''));
    var variantsHtml = (_variants.length === 0 ? '<p style="font-size:12px;color:#8A7E7C;margin:0;">Nenhum grupo de variantes criado ainda.</p>' : '<div id="pm-variant-checks" style="display:grid;gap:8px;">' + _variants.map(function (vg) {
      var checked = (p.variantGroupIds || []).map(String).indexOf(String(vg.id)) >= 0;
      return '<div style="border:1px solid #EAE4DA;border-radius:12px;background:#FFFCF8;padding:9px 10px;">' +
        '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">' +
        '<input type="checkbox" class="pm-variant-check" data-vgid="' + vg.id + '"' + (checked ? ' checked' : '') + ' onchange="Modules.Catalogo._toggleProductVariantPreview(this)" style="width:15px;height:15px;accent-color:#B42318;">' +
        '<span style="font-weight:650;color:#1F1F1F;">' + _esc(vg.title) + '</span>' +
        '<span style="font-size:11px;color:#8A7E7C;">' + (vg.required ? 'Obrigatória' : 'Opcional') + ' · mín. ' + (vg.minPerUnit != null ? vg.minPerUnit : vg.min || 0) + ' · máx. ' + (vg.maxPerUnit || vg.max || 1) + '</span>' +
        '</label>' +
        _productVariantOptionsPreviewHtml(vg, checked) +
        '</div>';
    }).join('') + '</div>');
    var productFiscal = _ensureProductFiscal(p);

    window._pmMenuGroupCount = menuGroups.length;
    window._pmInternalCompositionCount = internalComposition.length;
    window._pmVisible = p.menuVisible !== false;
    window._pmImageBase64 = null;
    window._pmImagePreviewUrl = '';
    window._pmImageUploadPending = false;
    window._pmImageUploadToken = '';
    window._pmImageRemoved = false;
    window._pmSeoEdited = {};

    var body = `
      <div class="product-modal-admin" style="display:block;">
        <style>
          .product-modal-admin{font-family:Manrope,Inter,sans-serif;color:#1F1F1F;}
          .product-modal-admin section,.product-modal-admin details{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%)!important;border:1px solid #EADFD8!important;border-radius:18px!important;padding:15px!important;box-shadow:0 10px 24px rgba(31,31,31,.045)!important;}
          .product-modal-admin .pm-section-head{display:flex;align-items:flex-start;gap:10px;margin:0 0 13px;}
          .product-modal-admin .pm-section-icon{width:34px;height:34px;border-radius:12px;background:#FFF7F4;color:#B42318;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;}
          .product-modal-admin .pm-section-icon .mi{font-size:18px;}
          .product-modal-admin .pm-section-title{font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;}
          .product-modal-admin .pm-section-text{font-size:12px;font-weight:400;color:#6F6860;line-height:1.42;margin-top:3px;max-width:680px;}
          .product-modal-admin label{color:#7A746B!important;}
          .product-modal-admin input:not([type=radio]):not([type=checkbox]):not([type=file]),.product-modal-admin select,.product-modal-admin textarea{background:#FFFCF8!important;border:1px solid #E8DCD7!important;border-radius:12px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.82)!important;min-height:42px!important;padding:10px 12px!important;font-family:Manrope,Inter,sans-serif!important;font-size:14px!important;color:#1F1F1F!important;}
          .product-modal-admin textarea{line-height:1.45!important;}
          .product-modal-admin input:not([type=radio]):not([type=checkbox]):not([type=file]):focus,.product-modal-admin select:focus,.product-modal-admin textarea:focus{background:#fff!important;border-color:#D9AAA1!important;box-shadow:0 0 0 3px rgba(180,35,24,.08)!important;}
          .product-modal-admin select{appearance:none!important;-webkit-appearance:none!important;-moz-appearance:none!important;padding-right:42px!important;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E)!important;background-repeat:no-repeat!important;background-position:right 16px center!important;background-size:14px!important;}
          .product-modal-admin input[type=radio],.product-modal-admin input[type=checkbox]{accent-color:#B42318;}
          .product-modal-admin p{font-weight:400!important;}
          .product-modal-admin details summary::-webkit-details-marker{display:none;}
          .product-modal-admin details summary span{transition:transform .16s ease;}
          .product-modal-admin details[open] summary span:last-child{transform:rotate(90deg);}
          .product-modal-admin .pm-help-btn{height:30px;border:1px solid #E8DCD7;background:#fff;color:#8A6F5A;border-radius:999px;padding:0 10px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:5px;box-shadow:0 1px 2px rgba(31,31,31,.03);}
          .product-modal-admin .pm-help-btn:hover{background:#FFF8F2;border-color:#E8D1BF;}
          .product-modal-admin .pm-chain-card{border:1px solid #E8DCD7;border-radius:14px;background:#FFFCF8;padding:12px;margin-top:12px;}
          .product-modal-admin .pm-chain-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;}
          .product-modal-admin .pm-chain-title{font-size:12px;font-weight:850;color:#1F1F1F;line-height:1.25;}
          .product-modal-admin .pm-chain-text{font-size:11.5px;color:#6F6860;line-height:1.45;margin-top:3px;}
          .product-modal-admin .pm-chain-pill{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px;border-radius:999px;border:1px solid #DDE8D9;background:#F5FBF2;color:#2F6B57;font-size:11px;font-weight:850;white-space:nowrap;}
          .product-modal-admin .pm-chain-pill.warn{border-color:#F7D9A7;background:#FFF8E8;color:#9A6A2F;}
          .product-modal-admin .pm-chain-pill.danger{border-color:#F1C3BD;background:#FFF3F1;color:#B42318;}
          .product-modal-admin .pm-chain-list{display:grid;gap:7px;margin-top:10px;}
          .product-modal-admin .pm-chain-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border-top:1px solid #EFE4DC;padding-top:7px;font-size:11.5px;color:#5F5750;}
          .product-modal-admin .pm-chain-row strong{display:block;color:#1F1F1F;font-size:12px;line-height:1.25;}
          @media(max-width:760px){.product-modal-admin section:first-of-type>div:nth-child(2){grid-template-columns:1fr!important}.product-modal-admin section:first-of-type>div:nth-child(2)>div:first-child{max-width:100%;}.product-modal-admin section:first-of-type [style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}.product-modal-admin details>div{grid-template-columns:1fr!important}.product-modal-admin button{min-height:42px;}.product-modal-admin [data-menu-selected]{grid-template-columns:22px 34px minmax(120px,1fr) 108px 58px 30px!important;min-width:390px;}.product-modal-admin .pm-internal-row{grid-template-columns:1fr 1fr!important}.product-modal-admin .pm-internal-row>div:first-child{grid-column:1/-1}.product-modal-admin .pm-internal-row>button{width:100%!important;grid-column:1/-1;}}
        </style>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div id="pm-form-error" style="display:none;background:#FDEDEB;border:1px solid #F4C7BF;color:#B42318;padding:10px 12px;border-radius:12px;font-size:12px;font-weight:600;line-height:1.45;"></div>
          <section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <div class="pm-section-head"><span class="pm-section-icon"><span class="mi">restaurant_menu</span></span><div><div class="pm-section-title">Dados do produto</div><div class="pm-section-text">Defina como o item aparece no cardápio público, com nome, descrição, imagem, preço e categoria.</div></div></div>
            <div style="display:grid;grid-template-columns:160px 1fr;gap:14px;align-items:start;">
              <div>
                <label style="font-size:10px;font-weight:600;color:#7A746B;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;">Imagem</label>
                <input type="file" id="pm-img-file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Catalogo._onImgFileChange(event)" style="display:none;">
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                  <div id="pm-image-field-preview" style="width:92px;height:92px;border:1px solid #EAE4DA;border-radius:14px;background:#FFF;width:92px;height:92px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${(() => { var imageSrc = window._pmImagePreviewUrl || _imageUrlFor(p, 'card') || _imageUrlFor(p, 'main') || _imageUrlFor(p, 'thumb') || ''; return imageSrc ? '<img src="' + _esc(imageSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' : '<span class="mi" style="font-size:38px;color:#C9BCB8;">image</span>'; })()}
                  </div>
                  <div style="display:flex;flex-direction:column;gap:8px;min-width:0;">
                    <button type="button" onclick="Modules.Catalogo._openProductImagePicker()" style="padding:9px 12px;border:none;border-radius:10px;background:#F3E8D7;color:#8A6F5A;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Enviar imagem</button>
                    <button type="button" onclick="Modules.Catalogo._removeProductImage()" style="padding:9px 12px;border:1px solid #E6DDD3;border-radius:10px;background:#fff;color:#7A746B;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Remover imagem</button>
                    <div style="font-size:11px;line-height:1.45;color:#7A746B;">JPG, PNG ou WebP. A imagem é enviada automaticamente ao selecionar o arquivo.</div>
                  </div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <div><label style="${_fichaLbl()}">Nome do produto *</label><input id="pm-name" type="text" maxlength="55" value="${_esc(p.name || '')}" oninput="Modules.Catalogo._onProductNameChange();Modules.Catalogo._refreshProductPreview()" style="${_fichaInp()}"></div>
                <div><label style="${_fichaLbl()}">Frase que faz vender (microcopy)</label><input id="pm-microcopy" type="text" maxlength="72" value="${_esc(p.microcopy || '')}" placeholder="Ex: Crocante por fora, recheio que surpreende" oninput="Modules.Catalogo._refreshProductPreview()" style="${_fichaInp()}"><p style="font-size:11px;color:#6F6860;margin-top:4px;">Essa frase ajuda o cliente a decidir comprar.</p></div>
                <div><label style="${_fichaLbl()}">Descrição curta</label><textarea id="pm-short-desc" maxlength="120" oninput="Modules.Catalogo._onProductDescChange();Modules.Catalogo._refreshProductPreview()" style="${_fichaInp()}min-height:72px;resize:vertical;">${_esc(p.shortDesc || p.description || '')}</textarea></div>
                <div><label style="${_fichaLbl()}">Descrição completa</label><textarea id="pm-full-desc" maxlength="700" oninput="Modules.Catalogo._refreshProductPreview()" style="${_fichaInp()}min-height:88px;resize:vertical;">${_esc(p.fullDesc || p.fullDescription || p.seoDescription || p.shortDesc || p.description || '')}</textarea><p style="font-size:11px;color:#6F6860;margin-top:4px;">Aparece quando o cliente abre o produto para ver os detalhes.</p></div>
                <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">
                  <div style="flex:0 0 150px;max-width:100%;"><label style="${_fichaLbl()}">Preço *</label><input id="pm-price" type="text" inputmode="decimal" value="${_esc(_moneyDisplay(p.price || ''))}" onfocus="Modules.Catalogo._moneyInputFocus(this)" onblur="Modules.Catalogo._moneyInputBlur(this)" oninput="Modules.Catalogo._refreshProductPreview()" placeholder="€0,00" style="${_fichaInp()}font-size:17px;font-weight:600;color:#B42318;text-align:right;"></div>
                  <div style="flex:0 1 280px;max-width:100%;"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;"><label style="${_fichaLbl()}margin-bottom:0;">Categoria</label><button type="button" class="pm-help-btn" onclick="Modules.Catalogo._openProductCategoryCreateModal()">+ categoria</button></div><select id="pm-cat" onchange="Modules.Catalogo._refreshProductPreview()" style="${_fichaInp()}background:#fff;"><option value="">Sem categoria</option>${_categories.map(function (c) { return '<option value="' + c.id + '"' + (p.categoryId === c.id ? ' selected' : '') + '>' + _esc(c.name) + '</option>'; }).join('')}</select></div>
                </div>
                <input id="pm-cost" type="hidden" value="${pricingPreview ? pricingPreview.cost : ''}">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">${pricingChipsHtml}</div>
                ${promoBlockHtml}
                <div style="padding:12px 14px;background:#fff;border-radius:14px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
                  ${_toggleHtml('pm-featured', 'Mostrar selo de destaque', p.featured === true || p.popular === true, '')}
                </div>
                <div style="padding:12px 14px;background:#FFFCF8;border:1px solid #EADFD8;border-radius:14px;display:grid;grid-template-columns:minmax(220px,1fr) minmax(110px,160px);gap:10px;align-items:end;">
                  <label style="display:flex!important;align-items:flex-start;gap:9px;margin:0!important;color:#1F1F1F!important;font-size:12px!important;line-height:1.35!important;"><input id="pm-made-to-order" type="checkbox" onchange="Modules.Catalogo._onProductMadeToOrderChange(this.checked);Modules.Catalogo._refreshProductPreview()" style="width:16px;height:16px;accent-color:#B42318;margin-top:2px;"${(p.madeToOrder || p.productMadeToOrder || p.sobEncomenda) ? ' checked' : ''}><span><strong style="display:block;color:#1F1F1F;font-size:12px;">Produto sob encomenda</strong><span style="display:block;color:#6F6860;font-size:11px;margin-top:2px;">${_esc(_productLeadHelp())}</span></span></label>
                  <div><label style="${_fichaLbl()}">Prazo produção</label><input id="pm-production-lead-days" type="number" min="0" step="1" value="${_esc(String(p.productionLeadDays || p.productionLeadTimeDays || ''))}" placeholder="Dias" oninput="Modules.Catalogo._refreshProductPreview()" ${(p.madeToOrder || p.productMadeToOrder || p.sobEncomenda) ? '' : 'disabled'} style="${_fichaInp()}background:#fff;text-align:right;"></div>
                </div>
              </div>
            </div>
          </section>
          <section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <div class="pm-section-head"><span class="pm-section-icon"><span class="mi">tune</span></span><div style="min-width:0;flex:1;"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><div class="pm-section-title">Como a cliente compra</div><button type="button" class="pm-help-btn" onclick="Modules.Catalogo._openProductTypeHelpModal()"><span class="mi" style="font-size:15px;">help</span>Como preencher?</button></div><div class="pm-section-text">Primeiro escolha o que acontece para a cliente no cardápio: ela só adiciona o produto ou precisa escolher sabores, tamanhos, acompanhamentos ou itens do menu.</div></div></div>
            <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;">
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600;"><input type="radio" name="pm-tipo" value="unico"${tipoUnico ? ' checked' : ''} onchange="Modules.Catalogo._onTipoChange();Modules.Catalogo._refreshProductPreview()" style="accent-color:#B42318;"> Produto simples</label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600;"><input type="radio" name="pm-tipo" value="menu"${tipoMenu ? ' checked' : ''} onchange="Modules.Catalogo._onTipoChange();Modules.Catalogo._refreshProductPreview()" style="accent-color:#B42318;"> Produto com escolhas / combo</label>
            </div>
            <div id="pm-panel-unico" style="display:${tipoUnico ? 'block' : 'none'};">
              <div style="font-size:12px;font-weight:800;color:#1F1F1F;margin-bottom:8px;">De onde vem esse produto simples?</div>
              <div style="font-size:12px;color:#6F6860;line-height:1.45;margin-bottom:10px;">Escolha só uma opção. Isso evita baixar estoque duas vezes.</div>
              <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;"><input type="radio" name="pm-unico-src" value="receita"${unicoSubReceita ? ' checked' : ''} onchange="Modules.Catalogo._onUnicoSrcChange();Modules.Catalogo._refreshProductPreview()" style="accent-color:#B42318;"> Receita</label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;"><input type="radio" name="pm-unico-src" value="produto_pronto"${unicoSubPronto ? ' checked' : ''} onchange="Modules.Catalogo._onUnicoSrcChange();Modules.Catalogo._refreshProductPreview()" style="accent-color:#B42318;"> Produto pronto</label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;"><input type="radio" name="pm-unico-src" value="composicao_interna"${unicoSubComposicao ? ' checked' : ''} onchange="Modules.Catalogo._onUnicoSrcChange();Modules.Catalogo._refreshProductPreview()" style="accent-color:#B42318;"> Montagem interna</label>
              </div>
              <div id="pm-unico-receita-panel" style="display:${unicoSubReceita ? 'block' : 'none'};margin-bottom:10px;"><label style="${_fichaLbl()}">Receita</label><select id="pm-ficha-id" onchange="Modules.Catalogo._refreshProductPreview()" style="${_fichaInp()}background:#fff;"><option value="">Selecionar receita...</option>${fichaOptions}</select></div>
              <div id="pm-unico-pronto-panel" style="display:${unicoSubPronto ? 'block' : 'none'};margin-bottom:10px;"><label style="${_fichaLbl()}">Produto pronto</label><select id="pm-pronto-id" onchange="Modules.Catalogo._refreshProductPreview()" style="${_fichaInp()}background:#fff;"><option value="">Selecionar produto pronto...</option>${prontoOptions}</select></div>
              <div id="pm-unico-composicao-panel" style="display:${unicoSubComposicao ? 'block' : 'none'};margin-bottom:10px;">
                <div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:11px 12px;margin-bottom:11px;font-size:12px;color:#6F6860;line-height:1.45;">
                  Use quando a cliente compra um item simples, mas por dentro ele é montado com outras coisas do estoque. Preencha tudo que sai do estoque para <strong style="color:#1F1F1F;">1 unidade vendida</strong>, como brigadeiros produzidos e a embalagem final do kit. Isso não aparece para a cliente.
                </div>
                <div style="margin-bottom:9px;">
                  <label style="${_fichaLbl()}">Buscar item interno</label>
                  <input id="pm-internal-composition-search" type="search" placeholder="Buscar receita, ingrediente, embalagem ou produto pronto..." oninput="Modules.Catalogo._filterInternalCompositionOptions(this.value)" style="${_fichaInp()}background:#fff;">
                  <div id="pm-internal-composition-search-help" style="font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:5px;">Use a busca para reduzir a lista dos campos abaixo. O item selecionado continua salvo mesmo quando a busca muda.</div>
                </div>
                <div id="pm-internal-composition-list" style="display:flex;flex-direction:column;gap:9px;">${internalCompositionHtml}</div>
                <button type="button" onclick="Modules.Catalogo._addInternalCompositionItem()" style="width:100%;padding:10px;border-radius:10px;border:1px dashed #E3D7C9;background:transparent;font-size:13px;font-weight:700;cursor:pointer;color:#7A746B;font-family:inherit;margin-top:9px;">+ Adicionar item interno</button>
              </div>
              <div id="pm-stock-chain-preview"></div>
            </div>
          </section>
          <section id="pm-panel-menu" style="display:${tipoMenu ? 'block' : 'none'};background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <div class="pm-section-head"><span class="pm-section-icon"><span class="mi">splitscreen</span></span><div><div class="pm-section-title">Escolhas do combo</div><div class="pm-section-text">Organize as opções que a cliente escolhe antes de adicionar o produto ao pedido.</div></div></div>
            <div id="pm-menu-groups">${menuGroupsHtml}</div>
            <button type="button" onclick="Modules.Catalogo._addMenuGroup()" style="width:100%;padding:9px;border-radius:10px;border:1px dashed #E3D7C9;background:transparent;font-size:13px;font-weight:600;cursor:pointer;color:#7A746B;font-family:inherit;margin-top:6px;">+ Adicionar grupo ao menu</button>
          </section>
          <section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            ${_upsellBlockHtml('addAlso', addAlsoTitle, 'Produtos únicos extras que o cliente pode adicionar.', addAlsoIds, addAlsoDiscount)}
          </section>
          <section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <div class="pm-section-head"><span class="pm-section-icon"><span class="mi">sell</span></span><div><div class="pm-section-title">Organização e escolhas</div><div class="pm-section-text">Use tags e variantes para deixar o produto mais fácil de vender e configurar no pedido.</div></div></div>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div>
                <div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Tags</div>
                <div id="pm-tags-list" style="display:flex;flex-wrap:wrap;gap:4px;">${tagsHtml}</div>
              </div>
              <div>
                <div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Variantes</div>
                ${variantsHtml}
              </div>
            </div>
          </section>
          <section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <div class="pm-section-head"><span class="pm-section-icon"><span class="mi">notes</span></span><div><div class="pm-section-title">Observação interna</div><div class="pm-section-text">Anotação para sua equipe. Não aparece para o cliente.</div></div></div>
            <input id="pm-note" type="text" value="${_esc(p.internalNote || '')}" placeholder="Visível apenas para a equipe" style="${_fichaInp()}background:#fff;">
          </section>
          <details style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <summary style="cursor:pointer;list-style:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-size:11px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;">Dados fiscais</div>
                <div style="font-size:12px;color:#6F6860;margin-top:4px;">Informações usadas para identificar o produto em documentos e controles fiscais.</div>
              </div>
              <span style="font-size:16px;line-height:1;color:#6F6860;">▸</span>
            </summary>
            <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1.4fr .7fr 1fr 1fr;gap:10px;">
              <div><label style="${_fichaLbl()}">SKU / Código interno</label><input id="pm-fiscal-sku" type="text" maxlength="60" value="${_esc(productFiscal.sku || '')}" style="${_fichaInp()}"></div>
              <div><label style="${_fichaLbl()}">Nome fiscal</label><input id="pm-fiscal-name" type="text" maxlength="120" value="${_esc(productFiscal.fiscalName || '')}" placeholder="${_esc(p.name || '')}" style="${_fichaInp()}"></div>
              <div><label style="${_fichaLbl()}">IVA</label><input id="pm-fiscal-iva" type="number" step="0.01" min="0" value="${_esc(productFiscal.ivaRate)}" style="${_fichaInp()}"></div>
              <div><label style="${_fichaLbl()}">Categoria fiscal</label><select id="pm-fiscal-tax-category" style="${_fichaInp()}background:#fff;"><option value="prepared_food"${productFiscal.taxCategory === 'prepared_food' ? ' selected' : ''}>Comida preparada</option><option value="food"${productFiscal.taxCategory === 'food' ? ' selected' : ''}>Alimento</option><option value="beverage"${productFiscal.taxCategory === 'beverage' ? ' selected' : ''}>Bebida</option><option value="service"${productFiscal.taxCategory === 'service' ? ' selected' : ''}>Serviço</option><option value="other"${productFiscal.taxCategory === 'other' ? ' selected' : ''}>Outro</option></select></div>
              <div><label style="${_fichaLbl()}">Unidade fiscal</label><select id="pm-fiscal-unit-code" style="${_fichaInp()}background:#fff;"><option value="unit"${productFiscal.unitCode === 'unit' ? ' selected' : ''}>Unidade</option><option value="kg"${productFiscal.unitCode === 'kg' ? ' selected' : ''}>Quilo</option><option value="g"${productFiscal.unitCode === 'g' ? ' selected' : ''}>Grama</option><option value="l"${productFiscal.unitCode === 'l' ? ' selected' : ''}>Litro</option><option value="ml"${productFiscal.unitCode === 'ml' ? ' selected' : ''}>Mililitro</option></select></div>
            </div>
          </details>
          <details style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <summary style="cursor:pointer;list-style:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-size:11px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;">SEO (opcional)</div>
                <div style="font-size:12px;color:#6F6860;margin-top:4px;">Use apenas se quiser aparecer no Google</div>
              </div>
              <span style="font-size:16px;line-height:1;color:#6F6860;">▸</span>
            </summary>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
              <div><label style="${_fichaLbl()}">Título SEO</label><input id="pm-seo-title" type="text" maxlength="70" value="${_esc(p.seoTitle || p.name || '')}" oninput="Modules.Catalogo._seoEdited('title')" style="${_fichaInp()}"></div>
              <div><label style="${_fichaLbl()}">Descrição SEO</label><textarea id="pm-seo-desc" maxlength="160" oninput="Modules.Catalogo._seoEdited('desc')" style="${_fichaInp()}min-height:60px;resize:vertical;">${_esc(p.seoDescription || p.description || '')}</textarea></div>
              <div><label style="${_fichaLbl()}">URL</label><input id="pm-seo-slug" type="text" maxlength="80" value="${_esc(p.slug || _toSlug(p.name || ''))}" oninput="Modules.Catalogo._seoEdited('slug')" style="${_fichaInp()}"></div>
              <div><label style="${_fichaLbl()}">Palavra-chave principal</label><input id="pm-seo-kw" type="text" maxlength="60" value="${_esc(p.seoKeyword || '')}" style="${_fichaInp()}"></div>
              <div><label style="${_fichaLbl()}">Alt da imagem</label><input id="pm-seo-alt" type="text" maxlength="120" value="${_esc(p.imageAlt || p.name || '')}" oninput="Modules.Catalogo._seoEdited('alt')" style="${_fichaInp()}"></div>
            </div>
          </details>
          <section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;">
              <div><div style="font-size:13px;font-weight:600;">Mostrar no cardápio</div><div style="font-size:11px;color:#7A746B;">Quando desligado, o cliente não vê este produto na loja.</div></div>
              <button type="button" id="pm-visible-toggle" onclick="Modules.Catalogo._toggleVis()" style="width:42px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background .2s;background:${p.menuVisible !== false ? '#B42318' : '#D8CEC2'};"><span style="position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform .2s;display:block;transform:translateX(${p.menuVisible !== false ? '18px' : '0'});box-shadow:0 1px 4px rgba(31,31,31,.12);"></span></button>
            </div>
          </section>
        </div>
      </div>`;

    var footer = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
        <div style="font-size:11px;color:#7A746B;line-height:1.4;min-width:220px;flex:1;">Revise os dados antes de salvar. As alterações ficarão visíveis no cardápio do cliente.</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
          <button onclick="if(window._productModal)window._productModal.close()" style="min-width:116px;height:40px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Cancelar</button>
          <button onclick="Modules.Catalogo._saveProduct()" style="min-width:152px;height:40px;padding:0 17px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.18);">Salvar produto</button>
        </div>
      </div>`;

    window._productModal = UI.modal({ title: id ? 'Editar Produto' : 'Novo Produto', body: body, footer: footer, maxWidth: '1120px' });
    window._pmProductBase = p;
    setTimeout(function () {
      _refreshProductPreview();
      var menuListEl = document.getElementById('pm-menu-groups');
      if (menuListEl) makeSortable(menuListEl, function () {});
      _initMenuOptionSortables();
    }, 100);
  }

  function _normalizeProduct(p) {
    p = Object.assign({}, p || {});
    p.shortDesc = p.shortDesc || p.description || p.desc || '';
    p.fullDesc = p.fullDesc || p.fullDescription || p.seoDescription || p.seoDesc || p.shortDesc || '';
    p.description = p.shortDesc;
    p.imageUrl = p.imageUrl || p.imageMainUrl || p.img || '';
    p.imageCardUrl = p.imageCardUrl || p.cardImageUrl || '';
    p.imageThumbUrl = p.imageThumbUrl || p.thumbnailUrl || '';
    p.imageStoragePath = p.imageStoragePath || p.storagePath || '';
    p.categoryId = p.categoryId || p.category || '';
    p.seoDescription = p.seoDescription || p.seoDesc || p.fullDesc || p.shortDesc || '';
    p.type = p.type || (p.category === 'menu' ? 'menu' : 'unico');
    if (Array.isArray(p.internalComposition) || Array.isArray(p.internalCompositionItems)) {
      var hasInternal = (p.internalComposition || p.internalCompositionItems || []).some(function (item) { return item && (item.ref || item.itemId || item.fichaId || item.fichaTecnicaId); });
      if (hasInternal) p.unicoSource = 'composicao_interna';
    }
    p.featured = p.featured === true || p.popular === true;
    p.popular = p.popular === true || p.featured === true;
    p.fiscal = _ensureProductFiscal(p);
    return p;
  }

  function _defaultProductFiscal() {
    var cfg = _fiscalConfig || {};
    var fiscalEnabled = cfg.usarCalculoFiscal === true;
    var cfgIva = parseFloat(String(cfg.defaultIvaRate != null ? cfg.defaultIvaRate : cfg.ivaPadrao != null ? cfg.ivaPadrao : '').replace(',', '.'));
    return {
      sku: '',
      fiscalName: '',
      ivaRate: fiscalEnabled ? (isFinite(cfgIva) ? cfgIva : 10) : 0,
      ivaIncluded: true,
      taxCategory: 'prepared_food',
      unitCode: 'unit',
      externalFiscalProductId: '',
      facturaDirectaProductId: ''
    };
  }

  function _ensureProductFiscal(product) {
    var p = product || {};
    var current = Object.assign({}, p.fiscal || {});
    var defaults = _defaultProductFiscal();
    var iva = current.ivaRate != null && current.ivaRate !== '' ? parseFloat(current.ivaRate) : defaults.ivaRate;
    return Object.assign({}, defaults, current, {
      sku: current.sku || p.sku || p.codigo || '',
      fiscalName: current.fiscalName || p.fiscalName || '',
      ivaRate: isFinite(iva) ? iva : defaults.ivaRate,
      ivaIncluded: current.ivaIncluded !== false,
      taxCategory: current.taxCategory || defaults.taxCategory,
      unitCode: current.unitCode || defaults.unitCode,
      externalFiscalProductId: current.externalFiscalProductId || '',
      facturaDirectaProductId: current.facturaDirectaProductId || ''
    });
  }

  function _normalizeInternalComposition(product) {
    var list = Array.isArray(product && product.internalComposition)
      ? product.internalComposition
      : (Array.isArray(product && product.internalCompositionItems) ? product.internalCompositionItems : []);
    return list.map(function (item) {
      var ref = item.ref || _compositionRefFromItem(item);
      var meta = _compositionItemMeta(ref);
      return {
        ref: ref,
        itemId: item.itemId || meta.itemId || '',
        itemName: item.itemName || item.name || meta.label || '',
        stockItemType: item.stockItemType || item.itemClass || item.classe || meta.stockItemType || '',
        itemClass: item.itemClass || item.stockItemType || item.classe || meta.stockItemType || '',
        classe: item.classe || item.stockItemType || item.itemClass || meta.stockItemType || '',
        quantity: _moneyLike(item.quantity != null ? item.quantity : item.qty != null ? item.qty : 1) || 1,
        unit: item.unit || meta.unit || 'un',
        unitCost: _moneyLike(item.unitCost != null ? item.unitCost : meta.unitCost || 0)
      };
    }).filter(function (item) {
      return item.ref && _moneyLike(item.quantity) > 0;
    });
  }

  function _compositionRefFromItem(item) {
    item = item || {};
    var type = item.stockItemType || item.itemClass || item.classe || '';
    var id = item.itemId || item.fichaTecnicaId || item.fichaId || item.sourceItemId || item.produtoProntoId || '';
    if (!id) return '';
    if (type === 'produto_produzido' || item.fichaTecnicaId || item.fichaId) return 'ficha:' + id;
    if (type === 'base_producao') return 'base_producao:' + id;
    return 'item:' + id;
  }

  function _normalizeStockCompositionItems(items) {
    return (items || []).filter(function (item) {
      var classe = String((item && (item.classe || item.itemClass || item.stockItemType || item.class || item.tipoCadastro)) || '').toLowerCase();
      return item && item.ativo !== false && (classe === 'produto' || classe === 'produto_pronto' || classe === 'embalagem' || classe === 'insumo');
    }).map(function (item) {
      var classe = String(item.classe || item.itemClass || item.stockItemType || item.class || item.tipoCadastro || '').toLowerCase();
      var name = item.nome || item.name || item.title || 'Item';
      var unit = item.unidade_base || item.unidadeBase || item.unit || '';
      var cost = _moneyLike(item.custo_unitario_base != null ? item.custo_unitario_base :
        item.unitCost != null ? item.unitCost :
        item.custo_atual != null ? item.custo_atual :
        item.preco_compra != null ? item.preco_compra :
        item.purchasePrice != null ? item.purchasePrice :
        item.cost || 0);
      return {
        id: item.id,
        ref: 'item:' + item.id,
        label: name,
        unit: unit,
        unitCost: cost,
        stockItemType: classe === 'embalagem' ? 'embalagem' : (classe === 'produto' ? 'produto_pronto' : 'insumo'),
        classe: classe,
        note: classe === 'embalagem' ? 'Embalagem' : (classe === 'produto' ? 'Produto comprado pronto' : 'Ingrediente')
      };
    }).sort(function (a, b) {
      return String(a.label || '').localeCompare(String(b.label || ''));
    });
  }

  function _normalizeBaseCompositionItems(settings) {
    return (settings || []).filter(function (item) {
      var type = String((item && (item.stockItemType || item.itemType || item.type)) || '').toLowerCase();
      var key = String((item && item.stockKey) || '');
      return item && item.active !== false && item.ativo !== false && (type === 'base_producao' || key.indexOf('base_producao:') === 0);
    }).map(function (item) {
      var key = String(item.stockKey || '');
      var itemId = item.itemId || (key.indexOf(':') >= 0 ? key.split(':').slice(1).join(':') : item.id) || '';
      return {
        id: item.id || itemId,
        ref: 'base_producao:' + itemId,
        label: item.itemName || item.name || item.baseProductionName || 'Base de produção',
        unit: item.unit || item.yieldUnit || '',
        unitCost: _moneyLike(item.unitCost || 0),
        stockItemType: 'base_producao',
        classe: 'base_producao',
        note: 'Base de produção'
      };
    }).filter(function (item) {
      return item.id && item.ref !== 'base_producao:';
    }).sort(function (a, b) {
      return String(a.label || '').localeCompare(String(b.label || ''));
    });
  }

  function _compositionOptions() {
    var recipeRows = (_fichas || []).map(function (f) {
      var cost = 0;
      if (typeof _calcFichaCosts === 'function') {
        var calc = _calcFichaCosts(f);
        cost = _moneyLike(calc && calc.costPerYield != null ? calc.costPerYield : 0);
      }
      return {
        ref: 'ficha:' + f.id,
        label: f.name || f.title || 'Receita',
        unit: f.yieldUnit || f.unit || 'un',
        unitCost: cost,
        stockItemType: 'produto_produzido',
        note: 'Produto produzido'
      };
    });
    return recipeRows.concat(_baseCompositionItems || [], _stockCompositionItems || []);
  }

  function _compositionItemMeta(ref) {
    var found = _compositionOptions().find(function (item) { return String(item.ref || '') === String(ref || ''); }) || {};
    var parts = String(ref || '').split(':');
    return {
      ref: ref || '',
      itemId: parts.slice(1).join(':'),
      label: found.label || '',
      unit: found.unit || 'un',
      unitCost: _moneyLike(found.unitCost || 0),
      stockItemType: found.stockItemType || (parts[0] === 'ficha' ? 'produto_produzido' : (parts[0] === 'base_producao' ? 'base_producao' : '')),
      note: found.note || ''
    };
  }

  function _compositionSearchText(item) {
    item = item || {};
    return [
      item.label || '',
      item.note || '',
      item.unit || '',
      item.stockItemType || '',
      item.classe || ''
    ].join(' ').toLowerCase();
  }

  function _compositionFilteredOptions(selectedRef) {
    var query = String(window._pmInternalCompositionQuery || '').trim().toLowerCase();
    var options = _compositionOptions();
    if (!query) return options;
    return options.filter(function (item) {
      return String(item.ref || '') === String(selectedRef || '') || _compositionSearchText(item).indexOf(query) >= 0;
    });
  }

  function _internalCompositionRowsHtml(rows) {
    rows = rows || [];
    if (!rows.length) {
      return '<div style="font-size:12px;color:#8A7E7C;border:1px dashed #E4D8D0;border-radius:12px;padding:12px;text-align:center;">Nenhum item interno configurado. Se este produto não precisa baixar itens específicos do estoque, pode deixar vazio.</div>';
    }
    return rows.map(function (item, idx) { return _internalCompositionRowHtml(idx, item); }).join('');
  }

  function _compositionOptionsHtml(selectedRef) {
    var options = _compositionFilteredOptions(selectedRef);
    return '<option value="">Selecionar item...</option>' + options.map(function (item) {
      var text = item.label + (item.note ? ' · ' + item.note : '');
      return '<option value="' + _esc(item.ref) + '"' + (String(selectedRef || '') === String(item.ref || '') ? ' selected' : '') + '>' + _esc(text) + '</option>';
    }).join('') + (!options.length ? '<option value="" disabled>Nenhum item encontrado na busca</option>' : '');
  }

  function _compositionAllOptionsHtml(selectedRef) {
    return '<option value="">Não baixa estoque nesta opção</option>' + _compositionOptions().map(function (item) {
      var text = item.label + (item.note ? ' · ' + item.note : '');
      return '<option value="' + _esc(item.ref) + '"' + (String(selectedRef || '') === String(item.ref || '') ? ' selected' : '') + '>' + _esc(text) + '</option>';
    }).join('');
  }

  function _internalCompositionRowHtml(idx, item) {
    item = item || {};
    var meta = _compositionItemMeta(item.ref);
    var unit = item.unit || meta.unit || 'un';
    return '' +
      '<div class="pm-internal-row" data-internal-row="' + idx + '" style="display:grid;grid-template-columns:minmax(230px,1fr) 104px 82px 112px 34px;gap:9px;align-items:end;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:13px;padding:10px;">' +
        '<div><label style="' + _fichaLbl() + '">Item interno</label><select data-internal-ref="' + idx + '" onchange="Modules.Catalogo._onInternalCompositionChange(' + idx + ')" style="' + _fichaInp() + 'background:#fff;">' + _compositionOptionsHtml(item.ref) + '</select></div>' +
        '<div><label style="' + _fichaLbl() + '">Qtd.</label><input data-internal-qty="' + idx + '" type="text" inputmode="decimal" value="' + _esc(String(item.quantity || 1).replace('.', ',')) + '" oninput="Modules.Catalogo._refreshProductPreview()" style="' + _fichaInp() + 'text-align:right;"></div>' +
        '<div><label style="' + _fichaLbl() + '">Unid.</label><input data-internal-unit="' + idx + '" type="text" value="' + _esc(unit) + '" readonly style="' + _fichaInp() + 'background:#F7F2ED!important;color:#6F6860!important;"></div>' +
        '<div><label style="' + _fichaLbl() + '">Custo</label><input data-internal-cost="' + idx + '" type="text" value="' + _esc(_moneyDisplay(item.unitCost || meta.unitCost || 0)) + '" readonly style="' + _fichaInp() + 'background:#F7F2ED!important;color:#6F6860!important;text-align:right;"></div>' +
        '<button type="button" onclick="Modules.Catalogo._removeInternalCompositionItem(' + idx + ')" title="Remover" style="width:34px;height:34px;border:1px solid #F1D2CE;border-radius:10px;background:#FFF7F5;color:#B42318;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:16px;">delete</span></button>' +
      '</div>';
  }

  function _addInternalCompositionItem() {
    var host = document.getElementById('pm-internal-composition-list');
    if (!host) return;
    var rows = _collectInternalCompositionDraft();
    rows.push({ ref: '', quantity: 1 });
    window._pmInternalCompositionCount = rows.length;
    host.innerHTML = _internalCompositionRowsHtml(rows);
    _refreshProductPreview();
  }

  function _removeInternalCompositionItem(idx) {
    var host = document.getElementById('pm-internal-composition-list');
    if (!host) return;
    var rows = _collectInternalCompositionDraft().filter(function (_, i) { return i !== idx; });
    window._pmInternalCompositionCount = rows.length;
    host.innerHTML = _internalCompositionRowsHtml(rows);
    _refreshProductPreview();
  }

  function _filterInternalCompositionOptions(value) {
    window._pmInternalCompositionQuery = String(value || '');
    var host = document.getElementById('pm-internal-composition-list');
    if (!host) return;
    var rows = _collectInternalCompositionDraft();
    host.innerHTML = _internalCompositionRowsHtml(rows);
  }

  function _onInternalCompositionChange(idx) {
    var refEl = document.querySelector('[data-internal-ref="' + idx + '"]');
    var meta = _compositionItemMeta(refEl ? refEl.value : '');
    var unitEl = document.querySelector('[data-internal-unit="' + idx + '"]');
    var costEl = document.querySelector('[data-internal-cost="' + idx + '"]');
    if (unitEl) unitEl.value = meta.unit || 'un';
    if (costEl) costEl.value = _moneyDisplay(meta.unitCost || 0);
    _refreshProductPreview();
  }

  function _collectInternalComposition() {
    var rows = [];
    var host = document.getElementById('pm-internal-composition-list');
    if (!host) return [];
    host.querySelectorAll('.pm-internal-row').forEach(function (row) {
      var idx = row.dataset.internalRow;
      var ref = ((row.querySelector('[data-internal-ref="' + idx + '"]') || {}).value || '').trim();
      var qty = _moneyLike((row.querySelector('[data-internal-qty="' + idx + '"]') || {}).value || 0);
      if (!ref || qty <= 0) return;
      var meta = _compositionItemMeta(ref);
      rows.push({
        ref: ref,
        itemId: meta.itemId || '',
        itemName: meta.label || '',
        stockItemType: meta.stockItemType || '',
        itemClass: meta.stockItemType || '',
        classe: meta.stockItemType || '',
        quantity: qty,
        unit: meta.unit || 'un',
        unitCost: meta.unitCost || 0
      });
    });
    return rows;
  }

  function _collectInternalCompositionDraft() {
    var rows = [];
    var host = document.getElementById('pm-internal-composition-list');
    if (!host) return [];
    host.querySelectorAll('.pm-internal-row').forEach(function (row) {
      var idx = row.dataset.internalRow;
      var ref = ((row.querySelector('[data-internal-ref="' + idx + '"]') || {}).value || '').trim();
      var qtyRaw = ((row.querySelector('[data-internal-qty="' + idx + '"]') || {}).value || '').trim();
      var qty = qtyRaw ? _moneyLike(qtyRaw) : 1;
      var meta = _compositionItemMeta(ref);
      rows.push({
        ref: ref,
        itemId: meta.itemId || '',
        itemName: meta.label || '',
        stockItemType: meta.stockItemType || '',
        itemClass: meta.stockItemType || '',
        classe: meta.stockItemType || '',
        quantity: qty > 0 ? qty : 1,
        unit: meta.unit || ((row.querySelector('[data-internal-unit="' + idx + '"]') || {}).value || 'un'),
        unitCost: meta.unitCost || _moneyLike((row.querySelector('[data-internal-cost="' + idx + '"]') || {}).value || 0)
      });
    });
    return rows;
  }

  function _validateInternalCompositionRows() {
    var host = document.getElementById('pm-internal-composition-list');
    if (!host) return '';
    var seen = {};
    var error = '';
    host.querySelectorAll('.pm-internal-row').forEach(function (row) {
      if (error) return;
      var idx = row.dataset.internalRow;
      var ref = ((row.querySelector('[data-internal-ref="' + idx + '"]') || {}).value || '').trim();
      var qtyRaw = ((row.querySelector('[data-internal-qty="' + idx + '"]') || {}).value || '').trim();
      var qty = _moneyLike(qtyRaw);
      if (!ref && !qtyRaw) return;
      if (!ref) {
        error = 'Escolha o item interno ou remova a linha vazia da composição.';
        return;
      }
      if (!(qty > 0)) {
        error = 'A quantidade da composição interna precisa ser maior que zero.';
        return;
      }
      if (seen[ref]) {
        error = 'O mesmo item interno aparece mais de uma vez. Ajuste a quantidade em uma única linha.';
        return;
      }
      seen[ref] = true;
    });
    return error;
  }

  function _internalCompositionCost(base) {
    var items = document.getElementById('pm-internal-composition-list')
      ? _collectInternalComposition()
      : _normalizeInternalComposition(base || {});
    return items.reduce(function (sum, item) {
      return sum + (_moneyLike(item.quantity) * _moneyLike(item.unitCost));
    }, 0);
  }

  function _stockClassFromCostItem(item) {
    var raw = String((item && (item.classe || item.itemClass || item.stockItemType || item.class || item.tipoCadastro)) || '').toLowerCase();
    if (raw === 'embalagem' || raw === 'embalagens') return 'embalagem';
    if (raw === 'produto' || raw === 'produto_pronto') return 'produto_pronto';
    return 'insumo';
  }

  function _stockBalanceMapForCatalog() {
    var map = {};
    function add(key, name, unit, delta) {
      if (!key) return;
      if (!map[key]) map[key] = { key: key, name: name || '', unit: unit || '', balance: 0 };
      map[key].name = map[key].name || name || '';
      map[key].unit = map[key].unit || unit || '';
      map[key].balance += _moneyLike(delta);
    }
    (_stockMovements || []).forEach(function (m) {
      if (!m || !m.type) return;
      var type = m.type;
      var direction = 0;
      if (type === 'entrada_compra' || type === 'entrada_producao' || type === 'entrada_base_producao' || type === 'retorno_venda' || type === 'estorno_venda' || type === 'ajuste_entrada') direction = 1;
      if (type === 'saida_producao' || type === 'saida_venda' || type === 'saida_base_venda' || type === 'estorno_compra' || type === 'estorno_producao_produto' || type === 'estorno_base_producao' || type === 'ajuste_saida') direction = -1;
      if (!direction) return;
      var qty = _moneyLike(m.quantityProduced != null ? m.quantityProduced : m.quantity);
      if (!(qty > 0)) return;
      if (type === 'entrada_producao' || type === 'estorno_producao_produto') {
        add('produto_produzido:' + (m.fichaTecnicaId || ''), m.fichaTecnicaNome || 'Produto produzido', m.yieldUnit || m.unit || '', direction * qty);
        return;
      }
      if (type === 'entrada_base_producao' || type === 'saida_base_venda' || type === 'estorno_base_producao') {
        add('base_producao:' + (m.baseProductionId || m.componentName || ''), m.baseProductionName || m.componentName || 'Base de produção', m.yieldUnit || m.unit || '', direction * qty);
        return;
      }
      if (type === 'saida_venda' || type === 'retorno_venda' || type === 'estorno_venda') {
        if (m.baseProductionId) add('base_producao:' + m.baseProductionId, m.baseProductionName || m.productName || 'Base de produção', m.unit || '', direction * qty);
        else if (m.fichaTecnicaId) add('produto_produzido:' + m.fichaTecnicaId, m.fichaTecnicaNome || m.productName || 'Produto produzido', m.unit || '', direction * qty);
        else if (m.sourceItemId || m.produtoProntoId) add('produto_pronto:' + (m.sourceItemId || m.produtoProntoId), m.productName || 'Produto pronto', m.unit || '', direction * qty);
        return;
      }
      if (type === 'entrada_compra' || type === 'estorno_compra') {
        var costItem = _itensCusto.find(function (item) { return String(item.id || '') === String(m.itemId || ''); }) || {};
        var cls = _stockClassFromCostItem(costItem);
        add(cls + ':' + (m.itemId || ''), m.itemName || costItem.nome || 'Item comprado', m.unit || costItem.unidade_base || '', direction * qty);
        return;
      }
      if (type === 'saida_producao') {
        var ingItem = _itensCusto.find(function (item) { return String(item.id || '') === String(m.ingredientId || ''); }) || {};
        var ingClass = _stockClassFromCostItem(ingItem);
        add(ingClass + ':' + (m.ingredientId || ''), m.ingredientName || ingItem.nome || 'Ingrediente', m.unit || ingItem.unidade_base || '', direction * qty);
        return;
      }
      if (type === 'ajuste_entrada' || type === 'ajuste_saida') {
        var stockType = m.stockItemType || m.itemClass || m.classe || 'insumo';
        add(stockType + ':' + (m.itemId || ''), m.itemName || 'Item ajustado', m.unit || '', direction * qty);
      }
    });
    Object.keys(map).forEach(function (key) {
      map[key].balance = _roundFichaCost(map[key].balance, 4);
    });
    return map;
  }

  function _baseProductionIdForCatalog(recipe, comp, idx) {
    comp = comp || {};
    var existing = String(comp.baseProductionId || '').trim();
    if (existing) return existing;
    var shared = String(comp.sharedBaseId || '').trim();
    if (shared) return shared;
    var componentId = String(comp.componentId || comp.recipeComponentId || '').trim();
    if (componentId) return componentId.indexOf('base_component:') === 0 ? componentId : 'base_component:' + componentId;
    return (recipe && recipe.id ? recipe.id : '') + ':' + (comp.name || ('etapa_' + (idx || 0)));
  }

  function _sameYieldFamily(a, b) {
    var ka = _recipeYieldUnitKey(a);
    var kb = _recipeYieldUnitKey(b);
    if (!ka || !kb) return false;
    if (ka === kb) return true;
    if ((ka === 'g' || ka === 'kg') && (kb === 'g' || kb === 'kg')) return true;
    if ((ka === 'ml' || ka === 'l') && (kb === 'ml' || kb === 'l')) return true;
    return false;
  }

  function _baseRequirementPerYieldUnit(recipe, comp) {
    var recipeQty = _parseFichaNum(recipe && (recipe.yieldQuantity || recipe.yield || 0)) || 1;
    var recipeUnit = recipe && recipe.yieldUnit || 'unidades';
    var stageQty = _parseFichaNum(comp.stageYieldQuantity || comp.baseYieldQuantity || comp.stockYieldQuantity || 0);
    var usageQty = _parseFichaNum(comp.stageUsageQuantity || comp.usageQuantity || comp.quantityPerUnit || comp.baseUsageQuantity || 0);
    var stageUnit = comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || '';
    if (usageQty > 0) return usageQty;
    if (!(stageQty > 0)) return 1;
    if (_sameYieldFamily(stageUnit, recipeUnit) && _recipeYieldUnitKey(recipeUnit) === 'count') return 1;
    return stageQty / Math.max(1, recipeQty);
  }

  function _recipeChainRequirements(recipe) {
    recipe = recipe || {};
    var reqs = [];
    var recipeYieldQty = _parseFichaNum(recipe.yieldQuantity || recipe.yield || 0) || 1;
    var recipeYieldUnit = recipe.yieldUnit || 'unidades';
    _normalizeFichaComponents(recipe).forEach(function (comp, idx) {
      if (comp.stockControl || comp.controlsStock) {
        var baseId = _baseProductionIdForCatalog(recipe, comp, idx);
        reqs.push({
          key: 'base_producao:' + baseId,
          name: comp.name || 'Base de produção',
          unit: comp.baseYieldUnit || comp.stockYieldUnit || comp.stageYieldUnit || '',
          requiredPerUnit: _baseRequirementPerYieldUnit(recipe, comp),
          kind: 'base'
        });
        return;
      }
      var ratio = _componentUsageRatio(comp, recipeYieldQty, recipeYieldUnit).ratio;
      (comp.ingredients || []).forEach(function (ing) {
        var item = _itensCusto.find(function (x) { return String(x.id || '') === String(ing.insumoId || ''); }) || {};
        var cls = _stockClassFromCostItem(item || ing);
        var qty = _parseFichaNum(ing.appliedQty || 0);
        if (!(qty > 0)) qty = _parseFichaNum(ing.qty || 0) * ratio;
        var perUnit = qty / Math.max(1, recipeYieldQty);
        if (ing.insumoId && perUnit > 0) {
          reqs.push({
            key: cls + ':' + ing.insumoId,
            name: item.nome || ing.supplyName || 'Ingrediente',
            unit: ing.unit || item.unidade_base || '',
            requiredPerUnit: perUnit,
            kind: cls === 'embalagem' ? 'embalagem' : 'ingrediente'
          });
        }
      });
    });
    _normalizeFichaPackaging(recipe).forEach(function (pkg) {
      var item = _itensCusto.find(function (x) { return String(x.id || '') === String(pkg.insumoId || ''); }) || {};
      var qty = _parseFichaNum(pkg.qty || pkg.quantity || 0);
      var perUnit = qty / Math.max(1, recipeYieldQty);
      if (pkg.insumoId && perUnit > 0) {
        reqs.push({
          key: 'embalagem:' + pkg.insumoId,
          name: item.nome || pkg.supplyName || 'Embalagem',
          unit: pkg.unit || item.unidade_base || '',
          requiredPerUnit: perUnit,
          kind: 'embalagem'
        });
      }
    });
    return reqs;
  }

  function _mergeChainRequirements(reqs) {
    var map = {};
    (reqs || []).forEach(function (req) {
      if (!req || !req.key || !(req.requiredPerUnit > 0)) return;
      if (!map[req.key]) map[req.key] = Object.assign({}, req);
      else map[req.key].requiredPerUnit += req.requiredPerUnit;
    });
    return Object.keys(map).map(function (key) {
      map[key].requiredPerUnit = _roundFichaCost(map[key].requiredPerUnit, 6);
      return map[key];
    });
  }

  function _availabilityFromRequirements(reqs, balances) {
    reqs = _mergeChainRequirements(reqs);
    if (!reqs.length) {
      return { status: 'empty', label: 'Sem composição para conferir', available: null, rows: [], message: 'Preencha a receita, produto pronto ou montagem interna para ver a disponibilidade.' };
    }
    var missing = [];
    var limits = reqs.map(function (req) {
      var stock = balances[req.key] || {};
      var balance = _moneyLike(stock.balance || 0);
      var max = req.requiredPerUnit > 0 ? Math.floor(balance / req.requiredPerUnit) : null;
      var row = Object.assign({}, req, {
        balance: balance,
        balanceUnit: stock.unit || req.unit || '',
        availableUnits: max == null ? null : Math.max(0, max)
      });
      if (!(balance > 0)) missing.push(row);
      return row;
    });
    var finite = limits.filter(function (row) { return row.availableUnits != null; });
    var available = finite.length ? Math.min.apply(Math, finite.map(function (row) { return row.availableUnits; })) : null;
    var blocker = finite.slice().sort(function (a, b) { return a.availableUnits - b.availableUnits; })[0] || null;
    var status = missing.length ? 'danger' : (available != null && available <= 3 ? 'warn' : 'ok');
    var label = missing.length ? 'Falta item na cadeia' : (available == null ? 'Cadeia sem saldo calculado' : ('Até ' + available + ' unidade' + (available === 1 ? '' : 's')));
    var message = missing.length
      ? 'Existe item sem saldo suficiente. Nesta fase o BocaFood só mostra a leitura para conferência.'
      : (blocker ? ('O limite vem de ' + blocker.name + '.') : 'A cadeia está pronta para conferência.');
    return { status: status, label: label, available: available, rows: limits, blocker: blocker, message: message };
  }

  function _availabilityForRecipe(recipe, balances) {
    if (!recipe || !recipe.id) return { status: 'empty', label: 'Selecione uma receita', rows: [], message: 'Escolha uma receita para ver a cadeia de produção.' };
    var producedKey = 'produto_produzido:' + recipe.id;
    var produced = balances[producedKey] || {};
    var reqAvailability = _availabilityFromRequirements(_recipeChainRequirements(recipe), balances);
    reqAvailability.producedBalance = _moneyLike(produced.balance || 0);
    reqAvailability.producedUnit = produced.unit || recipe.yieldUnit || '';
    return reqAvailability;
  }

  function _productChainAvailability(base) {
    base = _normalizeProduct(base || {});
    var balances = _stockBalanceMapForCatalog();
    var tipoEl = document.querySelector('input[name="pm-tipo"]:checked');
    var tipo = (tipoEl && tipoEl.value) || base.type || 'unico';
    if (tipo !== 'unico') return { status: 'empty', label: 'Combo sem leitura nesta fase', rows: [], message: 'A leitura de combo entra depois, quando cada escolha tiver uma composição confirmada.' };
    var srcEl = document.querySelector('input[name="pm-unico-src"]:checked');
    var src = (srcEl && srcEl.value) || base.unicoSource || 'receita';
    if (src === 'receita') {
      var fichaId = ((document.getElementById('pm-ficha-id') || {}).value || base.fichaId || '').trim();
      return _availabilityForRecipe(_fichas.find(function (f) { return String(f.id) === String(fichaId); }), balances);
    }
    if (src === 'produto_pronto' || src === 'compras_produto') {
      var prontoId = ((document.getElementById('pm-pronto-id') || {}).value || base.produtoProntoId || base.sourceItemId || '').trim();
      var pronto = _produtosProntos.find(function (pp) { return String(pp.id) === String(prontoId); }) || {};
      return _availabilityFromRequirements([{ key: 'produto_pronto:' + prontoId, name: pronto.name || 'Produto pronto', unit: pronto.unit || '', requiredPerUnit: 1, kind: 'produto' }], balances);
    }
    var reqs = [];
    _collectInternalCompositionDraft().forEach(function (item) {
      var meta = _compositionItemMeta(item.ref);
      if (!meta.ref || !(item.quantity > 0)) return;
      if (meta.stockItemType === 'produto_produzido') {
        reqs.push({ key: 'produto_produzido:' + meta.itemId, name: meta.label || 'Produto produzido', unit: meta.unit || '', requiredPerUnit: item.quantity, kind: 'produto_produzido' });
      } else {
        reqs.push({ key: (meta.stockItemType || item.stockItemType || 'insumo') + ':' + meta.itemId, name: meta.label || item.itemName || 'Item interno', unit: meta.unit || item.unit || '', requiredPerUnit: item.quantity, kind: meta.stockItemType || item.stockItemType || 'item' });
      }
    });
    return _availabilityFromRequirements(reqs, balances);
  }

  function _productChainAvailabilityHtml(base) {
    var info = _productChainAvailability(base || {});
    var cls = info.status === 'danger' ? 'danger' : (info.status === 'warn' ? 'warn' : '');
    var rows = (info.rows || []).slice(0, 5).map(function (row) {
      return '<div class="pm-chain-row"><div><strong>' + _esc(row.name || 'Item') + '</strong><span>Precisa de ' + _esc(_roundFichaCost(row.requiredPerUnit, 4).toLocaleString('pt-BR', { maximumFractionDigits: 4 })) + ' ' + _esc(row.unit || '') + ' por unidade vendida</span></div><div style="text-align:right;font-weight:850;color:#1F1F1F;">' + _esc(_roundFichaCost(row.balance, 4).toLocaleString('pt-BR', { maximumFractionDigits: 4 })) + ' ' + _esc(row.balanceUnit || row.unit || '') + '</div></div>';
    }).join('');
    return '<div class="pm-chain-card">' +
      '<div class="pm-chain-head">' +
        '<div><div class="pm-chain-title">Disponibilidade em cadeia</div><div class="pm-chain-text">' + _esc(info.message || 'Confira se os itens internos têm saldo para vender este produto.') + '</div></div>' +
        '<span class="pm-chain-pill ' + cls + '">' + _esc(info.label || 'Conferir cadeia') + '</span>' +
      '</div>' +
      (info.producedBalance > 0 ? '<div class="pm-chain-text" style="margin-top:8px;">Produto produzido já em estoque: <strong style="color:#1F1F1F;">' + _esc(_roundFichaCost(info.producedBalance, 4).toLocaleString('pt-BR', { maximumFractionDigits: 4 })) + ' ' + _esc(info.producedUnit || '') + '</strong>.</div>' : '') +
      (rows ? '<div class="pm-chain-list">' + rows + '</div>' : '<div class="pm-chain-text" style="margin-top:8px;">Nenhum item interno encontrado para calcular agora.</div>') +
      ((info.rows || []).length > 5 ? '<div class="pm-chain-text" style="margin-top:8px;">+' + ((info.rows || []).length - 5) + ' item(ns) na cadeia.</div>' : '') +
    '</div>';
  }

  function _productPricingPreview(p) {
    p = _normalizeProduct(p || {});
    var price = _moneyLike(p.price || 0);
    var cost = _productCostFromState(p);

    if (!(price > 0) || !(cost > 0)) return null;

    var profit = price - cost;
    var margin = price > 0 ? (profit / price) * 100 : 0;
    return { price: price, cost: cost, profit: profit, margin: margin, source: '' };
  }

  function _moneyLike(value) {
    var str = String(value == null ? '' : value).trim();
    if (!str) return 0;
    var cleaned = str.replace(/[^\d,.-]/g, '');
    if (!cleaned) return 0;
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
    var n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }

  function _isValidMoneyLike(value) {
    var str = String(value == null ? '' : value).trim();
    if (!str) return false;
    var cleaned = str.replace(/[^\d,.-]/g, '');
    if (!cleaned || !/[0-9]/.test(cleaned)) return false;
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    else cleaned = cleaned.replace(/,/g, '');
    var n = parseFloat(cleaned);
    return isFinite(n);
  }

  function _moneyDisplay(value) {
    var n = _moneyLike(value);
    return n > 0 ? '€' + n.toFixed(2).replace('.', ',') : '';
  }

  function _moneyInputFocus(el) {
    if (!el) return;
    el.value = String(el.value || '').replace(/^\s*€\s*/, '');
    if (el.select) el.select();
  }

  function _moneyInputBlur(el) {
    if (!el) return;
    var n = _moneyLike(el.value);
    el.value = n > 0 ? '€' + n.toFixed(2).replace('.', ',') : '';
    _refreshProductPreview();
  }

  function _setProductModalError(message) {
    var box = document.getElementById('pm-form-error');
    if (!box) return;
    if (!message) {
      box.style.display = 'none';
      box.textContent = '';
      return;
    }
    box.textContent = message;
    box.style.display = 'block';
  }

  function _openProductImagePicker() {
    var input = document.getElementById('pm-img-file');
    if (input) input.click();
  }

  function _productModalImageSrc(base) {
    base = base || {};
    var imageState = window._pmImageState || {};
    var tempPreview = window._pmImagePreviewUrl || '';
    if (window._pmImageRemoved) return '';
    return tempPreview || imageState.imageCardUrl || imageState.cardUrl || imageState.mainUrl || imageState.imageUrl || base.imageCardUrl || base.cardImageUrl || base.imageUrl || base.imageBase64 || base.img || '';
  }

  function _refreshProductImageField() {
    var box = document.getElementById('pm-image-field-preview');
    if (!box) return;
    var imageSrc = _productModalImageSrc(window._pmProductBase || {});
    box.innerHTML = imageSrc
      ? '<img src="' + _esc(imageSrc) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : '<span class="mi" style="font-size:38px;color:#C9BCB8;">image</span>';
  }

  function _removeProductImage() {
    window._pmImageState = null;
    window._pmImageRemoved = true;
    window._pmImageUploadPending = false;
    if (window._pmImagePreviewUrl) {
      try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
      window._pmImagePreviewUrl = '';
    }
    var fileInput = document.getElementById('pm-img-file');
    if (fileInput) fileInput.value = '';
    var urlEl = document.getElementById('pm-img-url');
    if (urlEl) urlEl.value = '';
    _refreshProductImageField();
    _refreshProductPreview();
  }

  function _menuRefCost(ref) {
    if (!ref) return 0;
    var parts = String(ref).split(':');
    var type = parts[0];
    var id = parts.slice(1).join(':');
    if (type === 'ficha') {
      var ficha = _fichas.find(function (f) { return String(f.id) === String(id); });
      if (ficha && typeof _calcFichaCosts === 'function') {
        var calc = _calcFichaCosts(ficha);
        return _moneyLike(calc && calc.costPerYield != null ? calc.costPerYield : 0);
      }
      return 0;
    }
    if (type === 'pronto') {
      var pronto = _produtosProntos.find(function (pp) { return String(pp.id) === String(id); });
      return _moneyLike(pronto && (pronto.purchasePrice != null ? pronto.purchasePrice : pronto.preco_compra != null ? pronto.preco_compra : pronto.custo_atual != null ? pronto.custo_atual : pronto.cost || 0));
    }
    var prod = _productForId(id);
    return _moneyLike(prod && (prod.cost != null ? prod.cost : prod.custo != null ? prod.custo : prod.purchasePrice != null ? prod.purchasePrice : prod.custoAtual != null ? prod.custoAtual : prod.preco_compra != null ? prod.preco_compra : 0));
  }

  function _currentMenuGroupsFromModal(base) {
    var menuContainer = document.getElementById('pm-menu-groups');
    if (!menuContainer) return _normalizeMenuGroups(base || {});
    var groups = [];
    menuContainer.querySelectorAll('.pm-menu-group').forEach(function (groupEl) {
      var idx = groupEl.dataset.menuGroup;
      var titleEl = groupEl.querySelector('[data-menu-title="' + idx + '"]');
      var minEl = groupEl.querySelector('[data-menu-min="' + idx + '"]');
      var maxEl = groupEl.querySelector('[data-menu-max="' + idx + '"]');
      var max = parseInt(maxEl ? maxEl.value : 1, 10) || 1;
      var min = parseInt(minEl ? minEl.value : max, 10);
      if (min < 0) min = 0;
      if (max < 1) max = 1;
      if (min > max) min = max;
      var options = [];
      groupEl.querySelectorAll('[data-menu-selected="' + idx + '"]').forEach(function (opt) {
        var priceEl = opt.querySelector('[data-menu-price="' + idx + '"]');
        options.push({
          ref: opt.dataset.ref,
          label: opt.dataset.label || opt.dataset.ref,
          priceExtra: parseFloat(priceEl ? priceEl.value : 0) || 0,
          img: opt.dataset.img || ''
        });
      });
      if (options.length) {
        groups.push({ title: (titleEl ? titleEl.value : '') || 'Escolha', min: min, max: max, options: options });
      }
    });
    return groups.length ? groups : _normalizeMenuGroups(base || {});
  }

  function _productCostFromState(base) {
    base = _normalizeProduct(base || {});
    var tipoEl = document.querySelector('input[name="pm-tipo"]:checked');
    var tipo = (tipoEl && tipoEl.value) || base.type || 'unico';
    var cost = _moneyLike(base.cost != null ? base.cost :
      (base.custo != null ? base.custo :
      (base.purchasePrice != null ? base.purchasePrice :
      (base.custoAtual != null ? base.custoAtual :
      (base.custo_atual != null ? base.custo_atual : 0)))));

    if (tipo === 'unico') {
      var srcEl = document.querySelector('input[name="pm-unico-src"]:checked');
      var src = (srcEl && srcEl.value) || base.unicoSource || 'receita';
      if (src === 'composicao_interna') {
        var internalCost = _internalCompositionCost(base);
        return internalCost > 0 ? _moneyLike(internalCost) : 0;
      }
      if (src === 'receita') {
        var fichaId = ((document.getElementById('pm-ficha-id') || {}).value || base.fichaId || '').trim();
        var ficha = _fichas.find(function (f) { return String(f.id) === String(fichaId); });
        if (ficha && typeof _calcFichaCosts === 'function') {
          var calc = _calcFichaCosts(ficha);
          if (calc && calc.costPerYield > 0) return _moneyLike(calc.costPerYield);
          if (calc && calc.totalCost > 0) return _moneyLike(calc.totalCost);
        }
      } else {
        var prontoId = ((document.getElementById('pm-pronto-id') || {}).value || base.produtoProntoId || base.sourceItemId || '').trim();
        var pronto = _produtosProntos.find(function (pp) { return String(pp.id) === String(prontoId); });
        if (pronto) {
          var prontoCost = pronto.purchasePrice != null ? pronto.purchasePrice :
            (pronto.preco_compra != null ? pronto.preco_compra :
            (pronto.custo_atual != null ? pronto.custo_atual : pronto.cost || 0));
          if (_moneyLike(prontoCost) > 0) return _moneyLike(prontoCost);
        }
      }
      return cost > 0 ? cost : 0;
    }

    var groups = _currentMenuGroupsFromModal(base);
    var total = 0;
    groups.forEach(function (group) {
      var groupCosts = [];
      (group.options || []).forEach(function (opt) {
        var c = _menuRefCost(opt.ref);
        if (c > 0) groupCosts.push(c);
      });
      if (groupCosts.length) total += Math.min.apply(Math, groupCosts);
    });
    return total > 0 ? total : cost;
  }

  function _productPreviewState(base) {
    var p = _normalizeProduct(base || {});
    var nameEl = document.getElementById('pm-name');
    var microEl = document.getElementById('pm-microcopy');
    var descEl = document.getElementById('pm-short-desc');
    var priceEl = document.getElementById('pm-price');
    var catEl = document.getElementById('pm-cat');
    var tipoEl = document.querySelector('input[name="pm-tipo"]:checked');
    var promoState = _promoStateForProduct(p);
    var tags = [].slice.call(document.querySelectorAll('.pm-tag-check:checked')).map(function (cb) {
      return { text: cb.dataset.tagText || '', bgColor: cb.dataset.tagBg || '#B42318', textColor: cb.dataset.tagColor || '#fff' };
    });
    if (!tags.length && Array.isArray(p.tags)) {
      tags = p.tags.slice(0, 2).map(function (tag) {
        return { text: tag.text || tag.name || '', bgColor: tag.bgColor || '#F7F1F0', textColor: tag.textColor || '#5E5553' };
      }).filter(function (t) { return t.text; });
    }
    if (!tags.length) {
      tags = [
        { text: 'Mais pedido', bgColor: '#FFF0EE', textColor: '#B42318' },
        { text: 'Favorito', bgColor: '#EEF4FF', textColor: '#3B82F6' }
      ];
    }
    var menuGroups = _normalizeMenuGroups(p);
    var menuSummary = '';
    if ((tipoEl && tipoEl.value === 'menu') || p.type === 'menu' || menuGroups.length) {
      var optionCount = menuGroups.reduce(function (sum, g) { return sum + (g.options ? g.options.length : 0); }, 0);
      var groupBits = menuGroups.slice(0, 3).map(function (g) {
        var title = g.title || 'Grupo';
        var range = (parseInt(g.min || 1, 10) || 1) + '-' + (parseInt(g.max || 1, 10) || 1);
        var opts = (g.options || []).length;
        return title + ' • ' + range + ' • ' + opts + ' opção' + (opts === 1 ? '' : 'ões');
      });
      menuSummary = '<div style="margin-top:12px;background:#FFF8F7;border:1px solid #F2E1DE;border-radius:14px;padding:12px 14px;">' +
        '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Resumo do combo</div>' +
        '<div style="font-size:13px;font-weight:800;color:#1A1A1A;margin-bottom:6px;">' + menuGroups.length + ' grupo' + (menuGroups.length === 1 ? '' : 's') + ' • ' + optionCount + ' opção' + (optionCount === 1 ? '' : 'ões') + '</div>' +
        (groupBits.length ? '<div style="font-size:12px;line-height:1.45;color:#6E6563;">' + _esc(groupBits.join(' · ')) + '</div>' : '') +
      '</div>';
    }
    var imageSrc = _productModalImageSrc(p);
    return {
      name: ((nameEl && nameEl.value) || p.name || 'Nome do produto').trim() || 'Nome do produto',
      microcopy: ((microEl && microEl.value) || p.microcopy || 'Frase de venda curta para apoiar a decisão.').trim() || 'Frase de venda curta para apoiar a decisão.',
      shortDesc: ((descEl && descEl.value) || p.shortDesc || p.description || 'Descrição curta do produto.').trim() || 'Descrição curta do produto.',
      price: _moneyLike((priceEl && priceEl.value) || p.price || 0),
      catLabel: catEl && catEl.options && catEl.selectedIndex >= 0 ? (catEl.options[catEl.selectedIndex].text || 'Sem categoria') : (p.categoryId || 'Sem categoria'),
      tipoLabel: tipoEl && tipoEl.value === 'menu' ? 'Produto com escolhas / combo' : 'Produto simples',
      imageSrc: imageSrc,
      promoState: promoState,
      tags: tags,
      menuSummary: menuSummary
    };
  }

  function _productPreviewHtml(base) {
    var s = _productPreviewState(base || {});
    var priceText = UI.fmt(s.price || 0);
    var promoBadge = s.promoState ? '<span style="background:#FFF0EE;color:#B42318;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">' + _esc(s.promoState.badge) + '</span>' : '';
    var promoLabel = s.promoState ? '<span style="background:#EDFAF3;color:#1A9E5A;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">Promoção ativa</span>' : '';
    var promoPriceHtml = s.promoState
      ? '<div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-top:10px;"><div><div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Preço original</div><div style="font-size:18px;font-weight:600;color:#7A746B;text-decoration:line-through;">' + UI.fmt(s.promoState.calc.original) + '</div></div><div><div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Preço promocional</div><div style="font-size:30px;font-weight:700;line-height:1;color:#B42318;">' + UI.fmt(s.promoState.calc.final) + '</div></div></div>'
      : '<div><div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Preço</div><div id="pm-preview-price" style="font-size:30px;font-weight:700;line-height:1;color:#B42318;">€ ' + priceText.replace('€', '') + '</div></div>';
    var badgeHtml = [
      '<span style="background:#F7F1F0;color:#5E5553;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">' + _esc(s.tipoLabel) + '</span>',
      '<span style="background:#FFF7ED;color:#B45309;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">' + _esc(s.catLabel) + '</span>'
    ].concat((s.promoState ? [{ text: s.promoState.badge, bgColor: '#FFF0EE', textColor: '#B42318' }] : []).concat(s.tags).map(function (tag) {
      return '<span style="background:' + (tag.bgColor || '#F7F1F0') + ';color:' + (tag.textColor || '#5E5553') + ';padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">' + _esc(tag.text) + '</span>';
    })).join('');

    return '<div id="pm-preview-pane" style="position:sticky;top:12px;align-self:start;max-height:calc(100vh - 170px);overflow:auto;background:#fff;border:1px solid #EAE4DA;border-radius:18px;padding:16px;box-shadow:0 6px 20px rgba(0,0,0,.05);">' +
      '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Preview do cliente</div>' +
      '<div style="background:#FAF8F8;border:1px solid #EAE4DA;border-radius:18px;overflow:hidden;">' +
      '<div style="position:relative;aspect-ratio:1/1;background:#F2EDED;overflow:hidden;">' +
      (s.imageSrc
        ? '<img id="pm-preview-image" src="' + _esc(s.imageSrc) + '" style="width:100%;height:100%;object-fit:cover;display:block;">'
        : '<div id="pm-preview-image" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#B9AAA6;"><span class="mi" style="font-size:54px;">restaurant</span></div>') +
      '<div style="position:absolute;left:12px;top:12px;display:flex;flex-wrap:wrap;gap:6px;max-width:calc(100% - 24px);">' + badgeHtml + '</div>' +
      '</div>' +
      '<div style="padding:16px;">' +
      '<div id="pm-preview-name" style="font-size:24px;font-weight:900;line-height:1.06;color:#1A1A1A;margin-bottom:6px;">' + _esc(s.name) + '</div>' +
      '<div id="pm-preview-microcopy" style="font-size:13px;color:#A85A2D;font-style:italic;font-weight:700;line-height:1.45;margin-bottom:8px;">' + _esc(s.microcopy) + '</div>' +
      '<div id="pm-preview-desc" style="font-size:12px;color:#6E6563;line-height:1.5;margin-bottom:14px;">' + _esc(s.shortDesc) + '</div>' +
      (s.menuSummary || '') +
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;">' +
      promoPriceHtml +
      '<button type="button" style="padding:10px 14px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Adicionar</button>' +
      '</div>' +
      (s.promoState ? '<div style="margin-top:12px;background:#FFF8F7;border:1px solid #F2E1DE;border-radius:12px;padding:12px 14px;">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' + promoLabel + promoBadge + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-bottom:4px;">' + _esc(s.promoState.name) + '</div>' +
        '<div style="font-size:12px;color:#1A1A1A;font-weight:800;">Impacto por item: ' + (s.promoState.calc.impact < 0 ? '-' : '+') + UI.fmt(Math.abs(s.promoState.calc.impact)) + '</div>' +
      '</div>' : '') +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function _refreshProductPreview() {
    _refreshProductImageField();
    var el = document.getElementById('pm-preview-column');
    if (!el) return;
    var base = window._pmProductBase || {};
    var costEl = document.getElementById('pm-cost');
    if (costEl) {
      var cost = _productCostFromState(base);
      costEl.value = cost > 0 ? String(cost) : '';
    }
    var chainEl = document.getElementById('pm-stock-chain-preview');
    if (chainEl) chainEl.innerHTML = _productChainAvailabilityHtml(base);
    el.innerHTML = _productPreviewHtml(base);
  }

  function _normalizeProdutosCompras(items) {
    return (items || []).filter(function (item) {
      var classe = String((item && (item.classe || item.class || item.tipoCadastro)) || '').toLowerCase();
      return item && item.ativo !== false && classe === 'produto';
    }).map(function (item) {
      return {
        id: item.id,
        name: item.nome || item.name || 'Produto',
        unit: item.unidade_base || item.unidadeBase || '',
        purchasePrice: item.preco_compra || item.purchasePrice || item.custo_atual || 0,
        supplier: item.fornecedor_padrao_id || item.supplier || '',
        imageBase64: item.imageBase64 || '',
        imageUrl: item.imageUrl || '',
        imageCardUrl: item.imageCardUrl || '',
        imageThumbUrl: item.imageThumbUrl || '',
        sourceType: 'compras_produto'
      };
    }).sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  function _prontoSourceForId(id) {
    var item = _produtosProntos.find(function (pp) { return String(pp.id) === String(id); });
    return (item && item.sourceType) || 'produto_pronto';
  }

  function _labelForMenuRef(ref) {
    if (!ref) return '';
    var parts = String(ref).split(':');
    var type = parts[0];
    var id = parts.slice(1).join(':');
    if (type === 'ficha') {
      var ficha = _fichas.find(function (f) { return f.id === id; });
      return ficha ? ficha.name : id;
    }
    if (type === 'pronto') {
      var pronto = _produtosProntos.find(function (pp) { return pp.id === id; });
      return pronto ? pronto.name : id;
    }
    return id || ref;
  }

  function _entityForMenuRef(ref) {
    if (!ref) return null;
    var parts = String(ref).split(':');
    var type = parts[0];
    var id = parts.slice(1).join(':');
    if (type === 'ficha') return _fichas.find(function (f) { return f.id === id; }) || null;
    if (type === 'pronto') return _produtosProntos.find(function (pp) { return pp.id === id; }) || null;
    return null;
  }

  function _imgForEntity(x) {
    return (x && (x.imageThumbUrl || x.imageCardUrl || x.imageBase64 || x.imageUrl || x.img || x.photoUrl || x.image)) || '';
  }

  function _productForId(id) {
    return _products.find(function (p) { return String(p.id) === String(id); }) || null;
  }

  function _promoDateValue(v) {
    if (!v) return null;
    var d = new Date(String(v) + 'T00:00:00');
    return isFinite(d.getTime()) ? d : null;
  }

  function _promoIsActive(promo) {
    if (!promo || promo.active === false) return false;
    var now = new Date();
    var start = _promoDateValue(promo.startDate || promo.startsAt);
    var end = _promoDateValue(promo.endDate || promo.endsAt);
    if (start && now < start) return false;
    if (end) {
      end.setHours(23, 59, 59, 999);
      if (now > end) return false;
    }
    return true;
  }

  function _promoNormalizeType(type) {
    if (type === 'pct' || type === 'eur' || type === '2x1' || type === 'add1') return type;
    if (type === 'extra_combo' || type === 'upgrade') return 'add1';
    if (type === 'pack') return '2x1';
    return 'pct';
  }

  function _promoAppliesToProduct(promo, product) {
    if (!_promoIsActive(promo) || !product) return false;
    var productId = String(product.id || '');
    if (promo.applyTo === 'all' || promo.scope === 'todos_produtos') return true;
    var ids = Array.isArray(promo.productIds) ? promo.productIds.map(String) : [];
    if (ids.indexOf(productId) >= 0) return true;
    if (promo.productId && String(promo.productId) === productId) return true;
    return false;
  }

  function _promoBasePrice(product) {
    return _promoNumber(product && (product.price != null ? product.price : 0));
  }

  function _promoCostForProduct(product) {
    if (!product) return 0;
    return _promoNumber(product.cost != null ? product.cost :
      (product.custo != null ? product.custo :
      (product.purchasePrice != null ? product.purchasePrice :
      (product.custoAtual != null ? product.custoAtual :
      (product.custo_atual != null ? product.custo_atual :
      (product.preco_compra != null ? product.preco_compra :
      (product.precoCompra != null ? product.precoCompra :
      (product.custoCompra != null ? product.custoCompra : 0))))))));
  }

  function _promoNumber(value) {
    var str = String(value == null ? '' : value).trim();
    if (!str) return 0;
    var cleaned = str.replace(/[^\d,.-]/g, '');
    if (!cleaned) return 0;
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
    var n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }

  function _promoCalcForProduct(product, promo) {
    var original = _promoBasePrice(product);
    var type = _promoNormalizeType(promo && promo.type);
    var value = parseFloat(String((promo && (promo.valuePercentual != null ? promo.valuePercentual : promo.valueDesconto != null ? promo.valueDesconto : promo.value)) || 0).replace(',', '.')) || 0;
    var leve = parseInt(promo && promo.leveQtd || 0, 10) || 0;
    var pague = parseInt(promo && promo.pagueQtd || 0, 10) || 0;
    var final = original;
    if (!(original > 0)) return null;
    if (type === 'pct') {
      final = Math.max(original - (original * value / 100), 0);
    } else if (type === 'eur') {
      final = Math.max(original - value, 0);
    } else if (type === '2x1') {
      final = Math.max(original / 2, 0);
    } else if (type === 'add1' && leve > 0 && leve > pague) {
      final = Math.max((original * pague) / leve, 0);
    }
    var cost = _promoCostForProduct(product);
    var margin = cost > 0 && final > 0 ? ((final - cost) / final) * 100 : null;
    return {
      type: type,
      value: value,
      leve: leve,
      pague: pague,
      original: original,
      final: final,
      discount: Math.max(original - final, 0),
      impact: final - original,
      cost: cost,
      margin: margin,
      promo: promo
    };
  }

  function _promoLabelForState(calc) {
    if (!calc) return '';
    if (calc.type === 'pct') return '-' + calc.value + '%';
    if (calc.type === 'eur') return '-' + UI.fmt(calc.value);
    if (calc.type === '2x1') return '2x1';
    if (calc.type === 'add1') return 'Leve ' + calc.leve + ' pague ' + calc.pague;
    return 'Oferta';
  }

  function _promoStateForProduct(product) {
    var matches = (_promotions || []).filter(function (promo) { return _promoAppliesToProduct(promo, product); });
    if (!matches.length) return null;
    var promo = matches[0];
    var calc = _promoCalcForProduct(product, promo);
    if (!calc) return null;
    return {
      promo: promo,
      calc: calc,
      badge: _promoLabelForState(calc),
      status: 'Promoção ativa',
      name: promo.name || 'Promoção'
    };
  }

  function _promoBlockHtml(product) {
    var state = _promoStateForProduct(product);
    if (!state) return '';
    var c = state.calc;
    var impact = c.impact < 0 ? '-' + UI.fmt(Math.abs(c.impact)) : '+' + UI.fmt(Math.abs(c.impact));
    var promoPrice = UI.fmt(c.final || 0);
    var original = UI.fmt(c.original || 0);
    var title = state.promo.type === '2x1' ? 'Promoção ativa: 2 por 1' :
      state.promo.type === 'add1' ? ('Promoção ativa: Leve ' + (c.leve || 0) + ' pague ' + (c.pague || 0)) :
      'Promoção ativa';
    var extra = '';
    if (c.type === '2x1') extra = 'Cliente leva 2 e paga 1';
    else if (c.type === 'add1') extra = 'Preço efetivo por unidade: ' + promoPrice;
    else if (c.type === 'pct' || c.type === 'eur') extra = 'Impacto por item: ' + impact;
    return '<div style="margin-top:12px;background:#FFF8F7;border:1px solid #F2E1DE;border-radius:12px;padding:12px 14px;">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
        '<span style="font-size:11px;font-weight:800;padding:4px 9px;border-radius:999px;background:#B42318;color:#fff;">' + _esc(state.badge) + '</span>' +
        '<span style="font-size:12px;font-weight:800;color:#B42318;">' + _esc(title) + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:#8A7E7C;margin-bottom:4px;">' + _esc(state.name) + '</div>' +
      '<div style="font-size:13px;color:#1A1A1A;font-weight:800;">' + original + ' → ' + promoPrice + '</div>' +
      '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">' + _esc(extra) + '</div>' +
      (c.margin != null ? '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Margem estimada: ' + c.margin.toFixed(1).replace('.', ',') + '%</div>' : '') +
    '</div>';
  }

  function _promoProductVisual(product) {
    var state = _promoStateForProduct(product);
    if (!state) return '';
    var c = state.calc;
    var original = _fmtMoneyDisplay(c.original || 0);
    var promo = _fmtMoneyDisplay(c.final || 0);
    var impact = c.impact < 0 ? '-' + _fmtMoneyDisplay(Math.abs(c.impact)) : '+' + _fmtMoneyDisplay(Math.abs(c.impact));
    var typeText = c.type === 'pct' ? 'Desconto percentual' :
      c.type === 'eur' ? 'Desconto em valor' :
      c.type === '2x1' ? '2x1' :
      c.type === 'add1' ? ('Leve ' + (c.leve || 0) + ' pague ' + (c.pague || 0)) :
      'Oferta';
    var detail = (c.type === 'pct' || c.type === 'eur')
      ? 'Impacto: ' + impact
      : 'Preço final efetivo: ' + promo;
    return '<div>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
        '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:#B42318;color:#fff;">Promoção ativa</span>' +
        '<span style="font-size:11px;font-weight:900;color:#B42318;">' + _esc(typeText) + '</span>' +
        '<span style="font-size:11px;color:#6F6860;white-space:nowrap;">' + _esc(state.name) + '</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
        '<span style="font-size:11px;color:#6F6860;">Original <strong style="text-decoration:line-through;color:#5E5553;">' + original + '</strong></span>' +
        '<span style="font-size:11px;color:#6F6860;">Final <strong style="color:#B42318;font-size:13px;">' + promo + '</strong></span>' +
        '<span style="font-size:11px;font-weight:800;color:#1A1A1A;">' + _esc(detail) + '</span>' +
      '</div>' +
    '</div>';
  }

  function _normalizeMenuGroups(p) {
    if (Array.isArray(p.menuChoiceGroups) && p.menuChoiceGroups.length) {
      return p.menuChoiceGroups.map(function (g) {
        return {
          title: g.title || g.name || 'Escolha',
          min: parseInt(g.min || g.qty || 1, 10) || 1,
          max: parseInt(g.max || g.qty || g.min || 1, 10) || 1,
          options: (g.options || []).map(function (o) {
            var ref = o.ref || o.value || '';
            var ent = _entityForMenuRef(ref);
            return { ref: ref, label: o.label || _labelForMenuRef(ref), priceExtra: parseFloat(o.priceExtra || o.price || 0) || 0, img: o.img || _imgForEntity(ent) };
          }).filter(function (o) { return !!o.ref; })
        };
      });
    }
    return (p.menuItems || []).map(function (item, i) {
      var ref = item.ref || '';
      var qty = parseInt(item.qty || 1, 10) || 1;
      return {
        title: 'Grupo ' + (i + 1),
        min: qty,
        max: qty,
        options: ref ? [{ ref: ref, label: _labelForMenuRef(ref), priceExtra: 0, img: _imgForEntity(_entityForMenuRef(ref)) }] : []
      };
    });
  }

  function _variantGroupToPublicVariant(group) {
    if (!group) return null;
    var options = (group.options || []).map(function (option) {
      var label = _variantOptionLabel(option);
      if (!label) return null;
      var price = _variantOptionPrice(option);
      return {
        name: label,
        label: label,
        priceExtra: price,
        price: price,
        img: _variantOptionImage(option),
        stockRef: option.stockRef || option.stockItemRef || '',
        stockItemRef: option.stockItemRef || option.stockRef || '',
        stockItemId: option.stockItemId || '',
        stockItemName: option.stockItemName || '',
        stockItemType: option.stockItemType || '',
        itemClass: option.itemClass || option.stockItemType || '',
        classe: option.classe || option.stockItemType || '',
        stockQuantity: option.stockQuantity != null ? option.stockQuantity : option.stockQty,
        stockQuantityPerChoice: option.stockQuantityPerChoice != null ? option.stockQuantityPerChoice : option.stockQuantity,
        stockUnit: option.stockUnit || option.unit || '',
        stockUnitCost: option.stockUnitCost || option.unitCost || 0
      };
    }).filter(Boolean);
    if (!options.length) return null;
    var max = parseInt(group.maxPerUnit || group.max || (group.multiSelect ? options.length : 1), 10) || 1;
    var min = parseInt(group.minPerUnit != null ? group.minPerUnit : group.min != null ? group.min : (group.required ? 1 : 0), 10);
    if (min < 0) min = 0;
    if (max < 1) max = 1;
    if (min > max) min = max;
    return {
      id: group.id || ('vg_' + _toSlug(group.title || group.name || 'opcao')),
      title: group.title || group.name || 'Escolha',
      required: group.required === true || min > 0,
      minPerUnit: min,
      maxPerUnit: max,
      options: options
    };
  }

  function _menuGroupToPublicVariant(group, index) {
    if (!group) return null;
    var options = (group.options || []).map(function (option) {
      var label = _variantOptionLabel(option) || _labelForMenuRef(option.ref);
      if (!label) return null;
      var price = _variantOptionPrice(option);
      return {
        ref: option.ref || '',
        name: label,
        label: label,
        priceExtra: price,
        price: price,
        img: _variantOptionImage(option) || _imgForEntity(_entityForMenuRef(option.ref)) || '',
        stockRef: option.stockRef || option.stockItemRef || '',
        stockItemRef: option.stockItemRef || option.stockRef || '',
        stockItemId: option.stockItemId || '',
        stockItemName: option.stockItemName || '',
        stockItemType: option.stockItemType || '',
        itemClass: option.itemClass || option.stockItemType || '',
        classe: option.classe || option.stockItemType || '',
        stockQuantity: option.stockQuantity != null ? option.stockQuantity : option.stockQty,
        stockQuantityPerChoice: option.stockQuantityPerChoice != null ? option.stockQuantityPerChoice : option.stockQuantity,
        stockUnit: option.stockUnit || option.unit || '',
        stockUnitCost: option.stockUnitCost || option.unitCost || 0
      };
    }).filter(Boolean);
    if (!options.length) return null;
    var max = parseInt(group.max || group.qty || group.min || 1, 10) || 1;
    var min = parseInt(group.min == null ? max : group.min, 10);
    if (min < 0) min = 0;
    return {
      id: group.id || ('menu_' + index),
      title: group.title || group.name || 'Escolha',
      required: min > 0,
      maxPerUnit: Math.max(1, max),
      minPerUnit: min,
      options: options
    };
  }

  function _publicVariantsForProduct(menuChoiceGroups, variantGroupIds) {
    var variants = [];
    (menuChoiceGroups || []).forEach(function (group, index) {
      var mapped = _menuGroupToPublicVariant(group, index);
      if (mapped) variants.push(mapped);
    });
    (variantGroupIds || []).forEach(function (id) {
      var group = (_variants || []).find(function (item) { return String(item.id) === String(id); });
      var mapped = _variantGroupToPublicVariant(group);
      if (mapped && !variants.some(function (item) { return String(item.id) === String(mapped.id); })) variants.push(mapped);
    });
    return variants;
  }

  function _variantOptionLabel(option) {
    return option && String(option.label || option.name || option.title || option.text || option.nome || '').trim();
  }

  function _variantOptionPrice(option) {
    var raw = option && (option.priceExtra != null ? option.priceExtra : option.extraPrice != null ? option.extraPrice : option.price != null ? option.price : option.valorExtra != null ? option.valorExtra : option.valor != null ? option.valor : 0);
    var value = parseFloat(String(raw || 0).replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
  }

  function _variantOptionImage(option) {
    var raw = option && (option.img || option.imageUrl || option.imageCardUrl || option.cardImageUrl || option.imageThumbUrl || option.thumbnailUrl || option.thumbUrl || option.photoUrl || option.image || option.url || '');
    raw = String(raw || '').trim();
    if (!raw || raw === 'undefined' || raw === 'null' || raw === '#') return '';
    return raw;
  }

  function _productVariantOptionsPreviewHtml(group, visible) {
    var mapped = _variantGroupToPublicVariant(group);
    var options = Array.isArray(mapped && mapped.options) ? mapped.options : (Array.isArray(group && group.options) ? group.options : []);
    if (!options.length) {
      return '<div data-product-variant-preview data-empty="1" style="display:' + (visible ? 'block' : 'none') + ';margin:8px 0 0 23px;font-size:12px;color:#8A7E7C;">Nenhuma opção cadastrada neste grupo.</div>';
    }
    return '<div data-product-variant-preview style="display:' + (visible ? 'grid' : 'none') + ';grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin:9px 0 0 23px;gap:7px;">' +
      options.map(function (option) {
        var label = _variantOptionLabel(option);
        if (!label) return '';
        var price = _variantOptionPrice(option);
        var priceText = price > 0 ? '+' + UI.fmt(price) : price < 0 ? '-' + UI.fmt(Math.abs(price)) : 'Sem acréscimo';
        var priceColor = price > 0 ? '#7A2E22' : price < 0 ? '#1F6B45' : '#8A7E7C';
        var img = _variantOptionImage(option);
        return '<div style="display:flex;align-items:center;gap:8px;min-height:38px;padding:6px 8px;border-radius:12px;background:#fff;border:1px solid #EAE4DA;color:#1F1F1F;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
          (img ? '<img src="' + _esc(img) + '" alt="" style="width:30px;height:30px;border-radius:9px;object-fit:cover;flex-shrink:0;background:#F8F2EF;">' : '') +
          '<div style="min-width:0;display:flex;flex-direction:column;gap:2px;">' +
            '<span style="font-size:12px;font-weight:650;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(label) + '</span>' +
            '<span style="font-size:11px;font-weight:700;line-height:1.15;color:' + priceColor + ';">' + _esc(priceText) + '</span>' +
          '</div>' +
        '</div>';
      }).join('') +
      '</div>';
  }

  function _toggleProductVariantPreview(input) {
    var row = input && input.closest ? input.closest('div') : null;
    var preview = row ? row.querySelector('[data-product-variant-preview]') : null;
    if (preview) preview.style.display = input.checked ? (preview.dataset.empty ? 'block' : 'grid') : 'none';
  }

  // Change E: SEO auto-update tracking
  function _seoEdited(field) {
    window._pmSeoEdited = window._pmSeoEdited || {};
    window._pmSeoEdited[field] = true;
  }

  function _onProductNameChange() {
    var name = (document.getElementById('pm-name') || {}).value || '';
    window._pmSeoEdited = window._pmSeoEdited || {};
    if (!window._pmSeoEdited['title']) {
      var el = document.getElementById('pm-seo-title');
      if (el) el.value = name;
    }
    if (!window._pmSeoEdited['slug'] && (!window._pmProductBase || !window._pmProductBase.slug)) {
      var slugEl = document.getElementById('pm-seo-slug');
      if (slugEl) slugEl.value = _toSlug(name);
    }
    if (!window._pmSeoEdited['alt']) {
      var altEl = document.getElementById('pm-seo-alt');
      if (altEl) altEl.value = name;
    }
    _refreshProductPreview();
  }

  function _onProductDescChange() {
    var desc = (document.getElementById('pm-short-desc') || {}).value || '';
    window._pmSeoEdited = window._pmSeoEdited || {};
    if (!window._pmSeoEdited['desc']) {
      var el = document.getElementById('pm-seo-desc');
      if (el) el.value = desc;
    }
    _refreshProductPreview();
  }

  // Change B: Tipo toggles
  function _onTipoChange() {
    var val = document.querySelector('input[name="pm-tipo"]:checked');
    var isMenu = val && val.value === 'menu';
    var up = document.getElementById('pm-panel-unico');
    var mp = document.getElementById('pm-panel-menu');
    if (up) up.style.display = isMenu ? 'none' : 'block';
    if (mp) mp.style.display = isMenu ? 'block' : 'none';
    _refreshProductPreview();
  }

  function _onUnicoSrcChange() {
    var val = document.querySelector('input[name="pm-unico-src"]:checked');
    var isReceita = !val || val.value === 'receita';
    var isComposicao = val && val.value === 'composicao_interna';
    var rp = document.getElementById('pm-unico-receita-panel');
    var pp = document.getElementById('pm-unico-pronto-panel');
    var cp = document.getElementById('pm-unico-composicao-panel');
    if (rp) rp.style.display = isReceita ? 'block' : 'none';
    if (pp) pp.style.display = (!isReceita && !isComposicao) ? 'block' : 'none';
    if (cp) cp.style.display = isComposicao ? 'block' : 'none';
    _refreshProductPreview();
  }

  function _openProductTypeHelpModal() {
    var body =
      '<div style="display:flex;flex-direction:column;gap:12px;font-family:Manrope,Inter,sans-serif;color:#211815;">' +
        '<section style="border:1px solid #EADFD8;background:#FFFCF8;border-radius:16px;padding:14px;">' +
          '<div style="font-size:15px;font-weight:850;color:#1F1F1F;margin-bottom:5px;">Antes de escolher, pense em como a cliente compra esse item.</div>' +
          '<div style="font-size:13px;color:#5F5750;line-height:1.5;">Se ela só clica e adiciona, é simples. Se ela precisa escolher sabor, tamanho, bebida, acompanhamento ou montar um menu, é produto com escolhas.</div>' +
        '</section>' +
        _productTypeHelpBlock('Produto simples', 'Use quando o produto é vendido direto, sem escolha obrigatória.', ['Coxinha de frango', 'Brigadeiro', 'Guaraná lata', 'Bolo de pote já definido'], 'Depois escolha se ele vem de uma receita, de um produto pronto comprado ou de uma montagem interna.') +
        _productTypeHelpBlock('Receita', 'Use quando o produto é preparado pelo negócio.', ['Coxinha feita com massa e recheio', 'Bolo produzido na cozinha', 'Brigadeiro feito por receita'], 'Vincule a receita para o BocaFood puxar custo, rendimento e margem com mais segurança.') +
        _productTypeHelpBlock('Produto pronto', 'Use quando você compra o item já pronto e revende.', ['Bebida', 'Doce de fornecedor', 'Produto embalado comprado pronto'], 'Vincule ao produto pronto cadastrado em Compras para o custo entrar certo.') +
        _productTypeHelpBlock('Montagem interna', 'Use quando o produto vendido é um kit ou caixa montada com vários itens do estoque.', ['Caixa com 4 brigadeiros', 'Kit presente com doce e embalagem', 'Caixa mista com sabores já definidos'], 'Escolha esta opção no lugar de Receita ou Produto pronto. Assim o BocaFood baixa somente os itens internos e não duplica a saída do estoque.') +
        _productTypeHelpBlock('Produto com escolhas / combo', 'Use quando a cliente precisa escolher algo antes de adicionar ao pedido.', ['Escolher sabor', 'Escolher tamanho', 'Escolher bebida do combo', 'Escolher acompanhamento ou sobremesa'], 'Depois crie os grupos em Escolhas do combo. Cada grupo deve deixar claro o que a cliente precisa escolher.') +
        _productTypeHelpBlock('Escolhas do combo', 'Use para organizar cada pergunta feita à cliente.', ['Bebida: Coca, Guaraná ou água', 'Sabor: frango, carne ou queijo', 'Acompanhamento: batata ou salada'], 'Cada grupo pode ter quantidade mínima e máxima de escolhas. Use nomes simples para a cliente entender rápido.') +
        '<section style="border:1px solid #EADFD8;background:#fff;border-radius:16px;padding:14px;">' +
          '<div style="font-size:13px;font-weight:850;color:#1F1F1F;margin-bottom:5px;">Para esta primeira etapa</div>' +
          '<div style="font-size:13px;color:#5F5750;line-height:1.5;">Cadastre só os 3 produtos principais. Comece pelos produtos mais vendidos, mais representativos ou que vão ajudar a montar o primeiro Plano de Voo.</div>' +
        '</section>' +
      '</div>';
    var footer = '<button type="button" onclick="if(window._productTypeHelpModal)window._productTypeHelpModal.close()" style="height:40px;padding:0 15px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:750;cursor:pointer;font-family:inherit;">Entendi</button>';
    window._productTypeHelpModal = UI.modal({ title: 'Como preencher tipo de produto', body: body, footer: footer, maxWidth: '660px' });
  }

  function _productTypeHelpBlock(title, text, examples, note) {
    return '<section style="border:1px solid #EADFD8;background:#fff;border-radius:16px;padding:14px;">' +
      '<div style="font-size:14px;font-weight:850;color:#1F1F1F;margin-bottom:4px;">' + _esc(title) + '</div>' +
      '<div style="font-size:13px;color:#5F5750;line-height:1.5;">' + _esc(text) + '</div>' +
      '<div style="margin-top:9px;display:flex;flex-wrap:wrap;gap:6px;">' + (examples || []).map(function (item) {
        return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:650;">' + _esc(item) + '</span>';
      }).join('') + '</div>' +
      '<div style="font-size:12px;color:#8A7E7C;line-height:1.45;margin-top:9px;">' + _esc(note || '') + '</div>' +
    '</section>';
  }

  function _productMaxAdvanceDays() {
    var op = _storeConfig && _storeConfig.operacao || {};
    var tpl = _storeConfig && _storeConfig.template || {};
    var candidates = [op.maxAdvanceDays, op.advanceDaysLimit, op.advanceDays, tpl.maxAdvanceDays, tpl.advanceDaysLimit, tpl.advanceDays];
    var raw = 6;
    for (var i = 0; i < candidates.length; i += 1) {
      if (candidates[i] !== null && candidates[i] !== undefined && String(candidates[i]).trim() !== '') {
        raw = candidates[i];
        break;
      }
    }
    var value = _moneyLike(raw);
    return Math.max(0, Math.floor(value));
  }

  function _productLeadHelp() {
    var max = _productMaxAdvanceDays();
    return max > 0
      ? 'Prazo deste produto. Deve ficar dentro da antecedência configurada em Operação: até ' + max + ' dia' + (max === 1 ? '' : 's') + '.'
      : 'Operação permite apenas pedidos para hoje; ajuste Prazos e capacidade para usar produtos sob encomenda.';
  }

  function _onProductMadeToOrderChange(checked) {
    var lead = document.getElementById('pm-production-lead-days');
    if (lead) {
      lead.disabled = !checked;
      if (checked && !lead.value) lead.value = '1';
      if (!checked) lead.value = '';
    }
  }

  function _openProductCategoryCreateModal() {
    var body =
      '<div style="display:flex;flex-direction:column;gap:12px;font-family:Manrope,Inter,sans-serif;color:#211815;">' +
        '<section style="border:1px solid #EADFD8;background:#FFFCF8;border-radius:16px;padding:14px;">' +
          '<div style="font-size:14px;font-weight:850;color:#1F1F1F;margin-bottom:4px;">Nova categoria do cardápio</div>' +
          '<div style="font-size:12.5px;color:#5F5750;line-height:1.45;">Use um nome simples, do jeito que a cliente procura no cardápio. Exemplo: Salgados, Doces, Bebidas, Bolos ou Combos.</div>' +
        '</section>' +
        '<label style="display:block;"><span style="' + _fichaLbl() + '">Nome da categoria *</span><input id="pm-new-category-name" type="text" placeholder="Ex.: Salgados" style="' + _fichaInp() + '"></label>' +
      '</div>';
    var footer = '<button type="button" onclick="Modules.Catalogo._saveProductCategoryFromModal()" style="height:40px;padding:0 15px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:750;cursor:pointer;font-family:inherit;">Adicionar categoria</button>';
    window._productCategoryCreateModal = UI.modal({ title: 'Nova categoria', body: body, footer: footer, maxWidth: '560px' });
    window.setTimeout(function () {
      var input = document.getElementById('pm-new-category-name');
      if (input) input.focus();
    }, 80);
  }

  function _saveProductCategoryFromModal() {
    var input = document.getElementById('pm-new-category-name');
    var name = String((input && input.value) || '').trim();
    if (!name) {
      UI.toast('Informe o nome da categoria.', 'error');
      if (input) input.focus();
      return;
    }
    var id = _newEntityId('cat');
    var data = { id: id, name: name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    DB.set('categories', id, data).then(function () {
      _categories = (_categories || []).concat([data]).sort(function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
      var select = document.getElementById('pm-cat');
      if (select) {
        select.innerHTML = '<option value="">Sem categoria</option>' + _categories.map(function (c) {
          return '<option value="' + _esc(c.id) + '"' + (String(c.id) === String(id) ? ' selected' : '') + '>' + _esc(c.name) + '</option>';
        }).join('');
      }
      if (window._productCategoryCreateModal) window._productCategoryCreateModal.close();
      UI.toast('Categoria adicionada.', 'success');
      _refreshProductPreview();
    }).catch(function (err) {
      UI.toast('Erro ao criar categoria: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _menuOptionPool() {
    var rows = [];
    _fichas.forEach(function (f) { rows.push({ ref: 'ficha:' + f.id, label: f.name, img: _imgForEntity(f) }); });
    _produtosProntos.forEach(function (pp) { rows.push({ ref: 'pronto:' + pp.id, label: pp.name, img: _imgForEntity(pp) }); });
    return rows.sort(function (a, b) { return String(a.label || '').localeCompare(String(b.label || '')); });
  }

  function _menuSelectedOptionsHtml(idx, group) {
    var options = group.options || [];
    if (!options.length) return '<div data-menu-empty="' + idx + '" style="font-size:12px;color:#8A7E7C;padding:10px;border:1px dashed #D4C8C6;border-radius:9px;text-align:center;">Nenhuma opção adicionada neste grupo.</div>';
    return options.map(function (o) { return _menuSelectedOptionRowHtml(idx, o); }).join('');
  }

  function _menuSelectedOptionRowHtml(idx, option) {
    var o = option || {};
    var ent = _entityForMenuRef(o.ref);
    var img = o.img || _imgForEntity(ent);
    var label = o.label || _labelForMenuRef(o.ref);
    var price = _moneyLike(o.priceExtra != null ? o.priceExtra : o.price != null ? o.price : 0);
    var imgHtml = img ? '<img src="' + _esc(img) + '" style="width:34px;height:34px;border-radius:8px;object-fit:cover;background:#F2EDED;flex-shrink:0;" onerror="this.style.display=\'none\';">' : '<div style="width:34px;height:34px;border-radius:8px;background:#F2EDED;display:flex;align-items:center;justify-content:center;color:#B9AAA6;flex-shrink:0;"><span class="mi" style="font-size:17px;">restaurant</span></div>';
    return '<div draggable="true" data-id="menu-option-' + idx + '-' + _esc(o.ref) + '" data-menu-selected="' + idx + '" data-ref="' + _esc(o.ref) + '" data-label="' + _esc(label) + '" data-img="' + _esc(img) + '" style="display:grid;grid-template-columns:22px 34px minmax(220px,1fr) 96px 58px 26px;align-items:center;gap:8px;padding:8px 10px;border:1px solid #F2EDED;border-radius:9px;background:#fff;margin-bottom:6px;">' +
      '<span class="mi" title="Arrastar para ordenar" style="color:#D4C8C6;font-size:16px;cursor:grab;">drag_indicator</span>' +
      imgHtml +
      '<span style="font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(label) + '</span>' +
      '<label style="display:block;"><span style="display:block;font-size:9px;font-weight:800;text-transform:uppercase;color:#8A7E7C;margin-bottom:2px;">Valor extra</span><input data-menu-price="' + idx + '" type="text" inputmode="decimal" value="' + _esc(_moneyDisplay(price)) + '" placeholder="€0,00" onfocus="Modules.Catalogo._moneyInputFocus(this)" onblur="Modules.Catalogo._moneyInputBlur(this)" style="width:100%;padding:6px;border:1.5px solid #D4C8C6;border-radius:7px;font-size:12px;font-family:inherit;outline:none;text-align:right;"></label>' +
      '<div style="display:flex;gap:4px;justify-content:center;">' +
        '<button type="button" title="Subir" onclick="Modules.Catalogo._moveMenuOption(' + idx + ', \'' + _esc(o.ref) + '\', -1)" style="width:26px;height:26px;border-radius:7px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:15px;">keyboard_arrow_up</span></button>' +
        '<button type="button" title="Descer" onclick="Modules.Catalogo._moveMenuOption(' + idx + ', \'' + _esc(o.ref) + '\', 1)" style="width:26px;height:26px;border-radius:7px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:15px;">keyboard_arrow_down</span></button>' +
      '</div>' +
      '<button type="button" onclick="Modules.Catalogo._removeMenuOption(' + idx + ', \'' + _esc(o.ref) + '\')" style="width:26px;height:26px;border-radius:7px;border:none;background:#FFF0EE;color:#B42318;cursor:pointer;font-size:13px;flex-shrink:0;">x</button>' +
      '</div>';
  }

  function _menuSearchOptionsHtml(idx, group) {
    var selected = {};
    (group.options || []).forEach(function (o) { selected[o.ref] = true; });
    var rows = _menuOptionPool().filter(function (o) { return !selected[o.ref]; });
    if (!rows.length) return '<div style="font-size:12px;color:#8A7E7C;padding:10px;">Nenhuma opção disponível para adicionar.</div>';
    return rows.map(function (o) {
      var imgHtml = o.img ? '<img src="' + _esc(o.img) + '" style="width:30px;height:30px;border-radius:7px;object-fit:cover;background:#F2EDED;flex-shrink:0;" onerror="this.style.display=\'none\';">' : '<span class="mi" style="font-size:17px;color:#B9AAA6;">restaurant</span>';
      return '<button type="button" data-menu-candidate="' + idx + '" data-ref="' + _esc(o.ref) + '" data-label="' + _esc(o.label) + '" data-img="' + _esc(o.img || '') + '" onclick="Modules.Catalogo._addMenuOption(' + idx + ', \'' + _esc(o.ref) + '\', \'' + _esc(o.label) + '\', \'' + _esc(o.img || '') + '\')" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:none;border-bottom:1px solid #F2EDED;background:#fff;text-align:left;cursor:pointer;font-family:inherit;">' +
        '<span style="display:flex;align-items:center;gap:8px;min-width:0;">' + imgHtml + '<span style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(o.label) + '</span></span><span style="font-size:11px;color:#B42318;font-weight:800;">Adicionar</span></button>';
    }).join('');
  }

  function _menuGroupRowHtml(idx, group) {
    group = group || {};
    var max = parseInt(group.max || group.qty || 1, 10) || 1;
    var min = parseInt(group.min || max, 10) || max;
    return '<div class="pm-menu-group" draggable="true" data-id="menu-group-' + idx + '" data-menu-group="' + idx + '" id="pm-menu-group-' + idx + '" style="background:#fff;border:1px solid #F2EDED;border-radius:12px;padding:12px;margin-bottom:10px;">' +
      '<div style="display:grid;grid-template-columns:24px 1fr 86px 86px 32px;gap:8px;align-items:end;margin-bottom:10px;">' +
      '<span class="mi" style="color:#D4C8C6;font-size:16px;cursor:grab;margin-bottom:10px;">drag_indicator</span>' +
      '<label style="display:block;"><span style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Nome do grupo</span><input data-menu-title="' + idx + '" value="' + _esc(group.title || 'Escolha') + '" placeholder="Ex: Sabor, bebida..." style="width:100%;padding:9px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:13px;font-family:inherit;outline:none;"></label>' +
      '<label style="display:block;"><span style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Mínimo</span><input data-menu-min="' + idx + '" type="number" min="0" step="1" value="' + min + '" style="width:100%;padding:9px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:13px;font-family:inherit;outline:none;"></label>' +
      '<label style="display:block;"><span style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Máximo</span><input data-menu-max="' + idx + '" type="number" min="1" step="1" value="' + max + '" style="width:100%;padding:9px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:13px;font-family:inherit;outline:none;"></label>' +
      '<button type="button" onclick="Modules.Catalogo._removeMenuGroup(' + idx + ')" style="width:32px;height:38px;border-radius:8px;border:none;background:#FFF0EE;color:#B42318;cursor:pointer;font-size:14px;">x</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.85fr);gap:10px;">' +
      '<div>' +
      '<div style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:5px;">Opções adicionadas</div>' +
      '<div id="pm-menu-selected-' + idx + '" data-menu-selected-list="' + idx + '" style="max-height:170px;overflow:auto;padding:8px;border:1px solid #F2EDED;border-radius:9px;background:#FCFAFA;">' + _menuSelectedOptionsHtml(idx, group) + '</div>' +
      '</div>' +
      '<div>' +
      '<div style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:5px;">Buscar e adicionar opções</div>' +
      '<input data-menu-search="' + idx + '" oninput="Modules.Catalogo._filterMenuOptions(' + idx + ')" placeholder="Buscar receita ou produto..." style="width:100%;padding:9px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:12px;font-family:inherit;outline:none;margin-bottom:6px;">' +
      '<div id="pm-menu-candidates-' + idx + '" style="max-height:170px;overflow:auto;border:1px solid #F2EDED;border-radius:9px;background:#fff;">' + _menuSearchOptionsHtml(idx, group) + '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function _isSimpleUpsellProduct(p) {
    p = _normalizeProduct(p || {});
    var hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
    return p.id !== undefined && p.id !== null && p.type !== 'menu' && p.productType !== 'combo' && !hasVariants;
  }

  function _upsellProductPool() {
    return _products.filter(function (p) {
      p = _normalizeProduct(p);
      var isCurrent = _editingId && String(p.id) === String(_editingId);
      return !isCurrent && p.active !== false;
    }).map(function (p) {
      p = _normalizeProduct(p);
      return { id: String(p.id), name: p.name || 'Produto', price: p.price || 0, hiddenFromMenu: p.menuVisible === false, img: _imageUrlFor(p, 'thumb') || _imageUrlFor(p, 'card') || _imageUrlFor(p, 'main') };
    }).sort(function (a, b) { return String(a.name || '').localeCompare(String(b.name || '')); });
  }

  function _upsellSelectedHtml(kind, ids, discount) {
    ids = (ids || []).filter(Boolean).map(String);
    if (!ids.length) return '<div data-upsell-empty="' + kind + '" style="font-size:12px;color:#8A7E7C;padding:10px;border:1px dashed #D4C8C6;border-radius:9px;text-align:center;">Nenhum produto selecionado.</div>';
    return ids.map(function (id) {
      var p = _productForId(id) || {};
      var img = _imgForEntity(p);
      var imgHtml = img ? '<img src="' + _esc(img) + '" style="width:34px;height:34px;border-radius:8px;object-fit:cover;background:#F2EDED;flex-shrink:0;" onerror="this.style.display=\'none\';">' : '<div style="width:34px;height:34px;border-radius:8px;background:#F2EDED;display:flex;align-items:center;justify-content:center;color:#B9AAA6;flex-shrink:0;"><span class="mi" style="font-size:17px;">restaurant</span></div>';
      if (kind === 'pairing') {
        return '<div data-upsell-selected="' + kind + '" data-id="' + _esc(id) + '" style="display:grid;grid-template-columns:34px 1fr 26px;align-items:center;gap:9px;padding:8px 10px;border:1px solid #F2EDED;border-radius:9px;background:#fff;margin-bottom:6px;">' +
          imgHtml +
          '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(p.name || id) + '</div><div style="font-size:11px;color:#6E6563;margin-top:2px;">Aparece como sugestão no bloco Perfecto con.</div></div>' +
          '<button type="button" onclick="Modules.Catalogo._removeUpsellProduct(\'' + kind + '\', \'' + _esc(id) + '\')" style="width:26px;height:26px;border-radius:7px;border:none;background:#FFF0EE;color:#B42318;cursor:pointer;font-size:13px;flex-shrink:0;">x</button>' +
          '</div>';
      }
      var original = _moneyLike(p.price || 0);
      var disc = Math.max(_moneyLike(discount || 0), 0);
      var finalPrice = Math.max(original - disc, 0);
      return '<div data-upsell-selected="' + kind + '" data-id="' + _esc(id) + '" style="display:grid;grid-template-columns:34px 1fr 26px;align-items:center;gap:9px;padding:8px 10px;border:1px solid #F2EDED;border-radius:9px;background:#fff;margin-bottom:6px;">' +
        imgHtml +
        '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(p.name || id) + '</div><div style="font-size:11px;line-height:1.4;color:#6E6563;margin-top:2px;">Preço original: <strong style="color:#1A1A1A;">' + _esc(_moneyDisplay(original)) + '</strong><br>Desconto: <strong style="color:#B42318;">-' + _esc(_moneyDisplay(disc)) + '</strong><br>Preço final: <strong style="color:#1A9E5A;">' + _esc(_moneyDisplay(finalPrice)) + '</strong></div></div>' +
        '<button type="button" onclick="Modules.Catalogo._removeUpsellProduct(\'' + kind + '\', \'' + _esc(id) + '\')" style="width:26px;height:26px;border-radius:7px;border:none;background:#FFF0EE;color:#B42318;cursor:pointer;font-size:13px;flex-shrink:0;">x</button>' +
        '</div>';
    }).join('');
  }

  function _upsellCandidatesHtml(kind, ids) {
    var selected = {};
    (ids || []).forEach(function (id) { selected[String(id)] = true; });
    var rows = _upsellProductPool().filter(function (p) { return !selected[p.id]; }).sort(function (a, b) { return String(a.name || '').localeCompare(String(b.name || '')); });
    if (!rows.length) return '<div style="font-size:12px;color:#8A7E7C;padding:10px;">Nenhum produto disponível.</div>';
    return rows.map(function (p) {
      var imgHtml = p.img ? '<img src="' + _esc(p.img) + '" style="width:30px;height:30px;border-radius:7px;object-fit:cover;background:#F2EDED;flex-shrink:0;" onerror="this.style.display=\'none\';">' : '<span class="mi" style="font-size:17px;color:#B9AAA6;">restaurant</span>';
      return '<button type="button" data-upsell-candidate="' + kind + '" data-id="' + _esc(p.id) + '" data-name="' + _esc(p.name) + '" onclick="Modules.Catalogo._addUpsellProduct(\'' + kind + '\', \'' + _esc(p.id) + '\')" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:none;border-bottom:1px solid #F2EDED;background:#fff;text-align:left;cursor:pointer;font-family:inherit;">' +
        '<span style="display:flex;align-items:center;gap:8px;min-width:0;">' + imgHtml + '<span style="min-width:0;"><span style="display:block;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(p.name) + '</span>' + (p.hiddenFromMenu ? '<span style="display:block;font-size:10px;color:#8A7E7C;margin-top:2px;">Oculto no cardápio</span>' : '') + '</span></span><span style="font-size:11px;color:#B42318;font-weight:800;">Adicionar</span></button>';
    }).join('');
  }

  function _upsellBlockHtml(kind, title, help, ids, discount) {
    var safeDiscount = parseFloat(String(discount || 0).replace(',', '.')) || 0;
    var isPairing = kind === 'pairing';
    return '<div style="background:#fff;border:1px solid #F2EDED;border-radius:12px;padding:10px;min-width:0;">' +
      '<div style="font-size:13px;font-weight:800;margin-bottom:2px;">' + _esc(title) + '</div>' +
      '<div style="font-size:11px;color:#6F6860;line-height:1.35;margin-bottom:8px;">' + _esc(help) + '</div>' +
      (isPairing ? '' : '<div style="display:grid;grid-template-columns:minmax(0,1fr) 130px;gap:10px;margin-bottom:10px;">' +
      '<label style="display:block;min-width:0;"><span style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#8A7E7C;margin-bottom:3px;">Texto do bloco</span><input id="pm-upsell-title-' + kind + '" type="text" maxlength="42" value="' + _esc(title) + '" placeholder="Aumentar valor do pedido" style="width:100%;padding:8px;border:1.5px solid #D4C8C6;border-radius:8px;font-size:12px;font-family:inherit;outline:none;"></label>' +
      '<label style="display:block;min-width:0;"><span style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:#8A7E7C;margin-bottom:3px;">Desconto</span><input id="pm-upsell-discount-' + kind + '" type="text" inputmode="decimal" value="' + _esc(_moneyDisplay(safeDiscount || '')) + '" placeholder="€0,00" onfocus="Modules.Catalogo._moneyInputFocus(this)" onblur="Modules.Catalogo._moneyInputBlur(this)" style="width:100%;padding:8px;border:1.5px solid #D4C8C6;border-radius:8px;font-size:12px;font-family:inherit;outline:none;text-align:right;"></label>' +
      '</div>') +
      '<div style="font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">' + (isPairing ? 'Produto combinado' : 'Itens sugeridos') + '</div>' +
      '<div id="pm-upsell-selected-' + kind + '" style="max-height:170px;overflow:auto;padding:8px;border:1px solid #F2EDED;border-radius:9px;background:#FCFAFA;margin-bottom:8px;">' + _upsellSelectedHtml(kind, ids, safeDiscount) + '</div>' +
      '<input data-upsell-search="' + kind + '" oninput="Modules.Catalogo._filterUpsellProducts(\'' + kind + '\')" placeholder="Buscar produto..." style="width:100%;padding:9px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:12px;font-family:inherit;outline:none;margin-bottom:6px;">' +
      '<div id="pm-upsell-candidates-' + kind + '" style="max-height:150px;overflow:auto;border:1px solid #F2EDED;border-radius:9px;background:#fff;">' + _upsellCandidatesHtml(kind, ids) + '</div>' +
      '</div>';
  }

  function _refreshUpsellCandidates(kind) {
    var selectedBox = document.getElementById('pm-upsell-selected-' + kind);
    var candidatesBox = document.getElementById('pm-upsell-candidates-' + kind);
    if (!selectedBox || !candidatesBox) return;
    var ids = [].slice.call(selectedBox.querySelectorAll('[data-upsell-selected="' + kind + '"]')).map(function (x) { return x.dataset.id; });
    candidatesBox.innerHTML = _upsellCandidatesHtml(kind, ids);
    _filterUpsellProducts(kind);
  }

  function _addUpsellProduct(kind, id) {
    var selectedBox = document.getElementById('pm-upsell-selected-' + kind);
    if (!selectedBox) return;
    if (kind === 'pairing') selectedBox.innerHTML = '';
    if (selectedBox.querySelector('[data-id="' + String(id).replace(/"/g, '\\"') + '"]')) return;
    var empty = selectedBox.querySelector('[data-upsell-empty]');
    if (empty) empty.remove();
    selectedBox.insertAdjacentHTML('beforeend', _upsellSelectedHtml(kind, [id]));
    _refreshUpsellCandidates(kind);
  }

  function _removeUpsellProduct(kind, id) {
    var selectedBox = document.getElementById('pm-upsell-selected-' + kind);
    if (!selectedBox) return;
    var row = selectedBox.querySelector('[data-id="' + String(id).replace(/"/g, '\\"') + '"]');
    if (row) row.remove();
    if (!selectedBox.querySelector('[data-upsell-selected="' + kind + '"]')) {
      selectedBox.innerHTML = '<div data-upsell-empty="' + kind + '" style="font-size:12px;color:#8A7E7C;padding:10px;border:1px dashed #D4C8C6;border-radius:9px;text-align:center;">Nenhum produto selecionado.</div>';
    }
    _refreshUpsellCandidates(kind);
  }

  function _filterUpsellProducts(kind) {
    var input = document.querySelector('[data-upsell-search="' + kind + '"]');
    var q = ((input && input.value) || '').toLowerCase();
    var box = document.getElementById('pm-upsell-candidates-' + kind);
    if (!box) return;
    box.querySelectorAll('[data-upsell-candidate="' + kind + '"]').forEach(function (row) {
      var label = (row.dataset.name || '').toLowerCase();
      row.style.display = label.indexOf(q) >= 0 ? 'flex' : 'none';
    });
  }

  function _addMenuOption(idx, ref, label, img) {
    var selectedBox = document.getElementById('pm-menu-selected-' + idx);
    var candidatesBox = document.getElementById('pm-menu-candidates-' + idx);
    if (!selectedBox || !candidatesBox) return;
    if (selectedBox.querySelector('[data-ref="' + ref.replace(/"/g, '\\"') + '"]')) return;
    var empty = selectedBox.querySelector('[data-menu-empty]');
    if (empty) empty.remove();
    img = img || '';
    selectedBox.insertAdjacentHTML('beforeend', _menuSelectedOptionRowHtml(idx, { ref: ref, label: label, img: img, priceExtra: 0 }));
    var candidate = candidatesBox.querySelector('[data-ref="' + ref.replace(/"/g, '\\"') + '"]');
    if (candidate) candidate.remove();
    _initMenuOptionSortables(idx);
  }

  function _removeMenuOption(idx, ref) {
    var selectedBox = document.getElementById('pm-menu-selected-' + idx);
    if (!selectedBox) return;
    var row = selectedBox.querySelector('[data-ref="' + ref.replace(/"/g, '\\"') + '"]');
    if (row) row.remove();
    if (!selectedBox.querySelector('[data-menu-selected]')) {
      selectedBox.innerHTML = '<div data-menu-empty="' + idx + '" style="font-size:12px;color:#8A7E7C;padding:10px;border:1px dashed #D4C8C6;border-radius:9px;text-align:center;">Nenhuma opção adicionada neste grupo.</div>';
    }
    _refreshMenuCandidates(idx);
  }

  function _moveMenuOption(idx, ref, direction) {
    var selectedBox = document.getElementById('pm-menu-selected-' + idx);
    if (!selectedBox) return;
    var row = selectedBox.querySelector('[data-ref="' + String(ref).replace(/"/g, '\\"') + '"]');
    if (!row) return;
    if (direction < 0 && row.previousElementSibling && row.previousElementSibling.matches('[data-menu-selected]')) {
      selectedBox.insertBefore(row, row.previousElementSibling);
    } else if (direction > 0 && row.nextElementSibling && row.nextElementSibling.matches('[data-menu-selected]')) {
      selectedBox.insertBefore(row.nextElementSibling, row);
    }
  }

  function _initMenuOptionSortables(idx) {
    var selector = idx != null ? '#pm-menu-selected-' + idx : '[data-menu-selected-list]';
    [].slice.call(document.querySelectorAll(selector)).forEach(function (box) {
      makeSortable(box, function () {});
    });
  }

  function _filterMenuOptions(idx) {
    var input = document.querySelector('[data-menu-search="' + idx + '"]');
    var q = ((input && input.value) || '').toLowerCase();
    var box = document.getElementById('pm-menu-candidates-' + idx);
    if (!box) return;
    box.querySelectorAll('[data-menu-candidate]').forEach(function (row) {
      var label = (row.dataset.label || '').toLowerCase();
      row.style.display = label.indexOf(q) >= 0 ? 'flex' : 'none';
    });
  }

  function _refreshMenuCandidates(idx) {
    var box = document.getElementById('pm-menu-candidates-' + idx);
    var selectedBox = document.getElementById('pm-menu-selected-' + idx);
    if (!box || !selectedBox) return;
    var selected = {};
    selectedBox.querySelectorAll('[data-menu-selected]').forEach(function (row) { selected[row.dataset.ref] = true; });
    var rows = _menuOptionPool().filter(function (o) { return !selected[o.ref]; });
    box.innerHTML = rows.map(function (o) {
      var imgHtml = o.img ? '<img src="' + _esc(o.img) + '" style="width:30px;height:30px;border-radius:7px;object-fit:cover;background:#F2EDED;flex-shrink:0;" onerror="this.style.display=\'none\';">' : '<span class="mi" style="font-size:17px;color:#B9AAA6;">restaurant</span>';
      return '<button type="button" data-menu-candidate="' + idx + '" data-ref="' + _esc(o.ref) + '" data-label="' + _esc(o.label) + '" data-img="' + _esc(o.img || '') + '" onclick="Modules.Catalogo._addMenuOption(' + idx + ', \'' + _esc(o.ref) + '\', \'' + _esc(o.label) + '\', \'' + _esc(o.img || '') + '\')" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:none;border-bottom:1px solid #F2EDED;background:#fff;text-align:left;cursor:pointer;font-family:inherit;">' +
        '<span style="display:flex;align-items:center;gap:8px;min-width:0;">' + imgHtml + '<span style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(o.label) + '</span></span><span style="font-size:11px;color:#B42318;font-weight:800;">Adicionar</span></button>';
    }).join('') || '<div style="font-size:12px;color:#8A7E7C;padding:10px;">Nenhuma opção disponível para adicionar.</div>';
    _filterMenuOptions(idx);
  }

  function _addMenuGroup() {
    var container = document.getElementById('pm-menu-groups');
    if (!container) return;
    var idx = window._pmMenuGroupCount || 0;
    window._pmMenuGroupCount = idx + 1;
    container.insertAdjacentHTML('beforeend', _menuGroupRowHtml(idx, { title: 'Escolha', min: 1, max: 1, options: [] }));
    makeSortable(container, function () {});
    _initMenuOptionSortables(idx);
  }

  function _removeMenuGroup(idx) {
    var el = document.getElementById('pm-menu-group-' + idx);
    if (el) el.remove();
  }


  // Change F: Image file change
  function _onImgFileChange(event) {
    var file = event.target.files[0];
    if (!file) return;
    window._pmImageRemoved = false;
    var draftId = window._pmDraftId || _editingId || _newEntityId('prod');
    window._pmDraftId = draftId;
    var authUser = window.Auth && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    var tenantId = window.Auth && typeof Auth.getTenantId === 'function' ? Auth.getTenantId() : '';
    console.info('[Catalogo] product image selected', {
      authUid: authUser && authUser.uid ? authUser.uid : '',
      tenantId: tenantId,
      productId: draftId,
      fileName: file.name || '',
      fileType: file.type || '',
      fileSizeKb: Math.round((file.size || 0) / 1024)
    });
    if (authUser && tenantId && authUser.uid !== tenantId) {
      console.warn('[Catalogo] tenant mismatch during image upload', {
        authUid: authUser.uid,
        tenantId: tenantId,
        productId: draftId
      });
    }
    var token = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7);
    window._pmImageUploadToken = token;
    window._pmImageUploadPending = true;
    if (window._pmImagePreviewUrl) {
      try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
      window._pmImagePreviewUrl = '';
    }
    try {
      window._pmImagePreviewUrl = URL.createObjectURL(file);
      _refreshProductImageField();
      _refreshProductPreview();
    } catch (e) {}

    if (!USE_FIREBASE_STORAGE_UPLOAD) {
      _uploadProductImageLegacy(file, { tenantId: tenantId, productId: draftId }).then(function (result) {
        if (window._pmImageUploadToken !== token) return;
        console.info('[Catalogo] legacy product image published', {
          tenantId: tenantId,
          productId: draftId,
          imageUrl: result && result.imageUrl ? result.imageUrl : '',
          imageStoragePath: result && result.imageStoragePath ? result.imageStoragePath : ''
        });
        window._pmImageState = result;
        window._pmImageBase64 = null;
        window._pmImageUploadPending = false;
        if (window._pmImagePreviewUrl) {
          try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
          window._pmImagePreviewUrl = '';
        }
        var urlEl = document.getElementById('pm-img-url');
        if (urlEl) {
          urlEl.value = result.imageUrl || '';
          console.info('[Catalogo] legacy product image url field updated', {
            productId: draftId,
            imageUrl: urlEl.value
          });
        }
        _refreshProductPreview();
        UI.toast('Imagem publicada com sucesso.', 'success');
      }).catch(function (err) {
        if (window._pmImageUploadToken !== token) return;
        console.error('[Catalogo] legacy product image publish failed', {
          code: err && err.code,
          message: err && err.message,
          productId: draftId,
          tenantId: tenantId,
          authUid: authUser && authUser.uid ? authUser.uid : ''
        }, err);
        window._pmImageUploadPending = false;
        if (window._pmImagePreviewUrl) {
          try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
          window._pmImagePreviewUrl = '';
        }
        _refreshProductPreview();
        UI.toast('Não conseguimos publicar a imagem. Tente novamente. Imagem anterior mantida.', 'error');
        event.target.value = '';
      });
      return;
    }

    try {
      ImageTools.process(file, { kind: 'product', entityId: draftId }).then(function (result) {
        if (window._pmImageUploadToken !== token) return;
        console.info('[Catalogo] product image upload complete', {
          authUid: authUser && authUser.uid ? authUser.uid : '',
          tenantId: tenantId,
          productId: draftId,
          imageUrl: result && result.imageUrl ? result.imageUrl : '',
          imageCardUrl: result && result.imageCardUrl ? result.imageCardUrl : '',
          imageThumbUrl: result && result.imageThumbUrl ? result.imageThumbUrl : '',
          imageStoragePath: result && result.imageStoragePath ? result.imageStoragePath : ''
        });
        window._pmImageState = result;
        window._pmImageBase64 = null;
        window._pmImageUploadPending = false;
        if (window._pmImagePreviewUrl) {
          try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
          window._pmImagePreviewUrl = '';
        }
        var urlEl = document.getElementById('pm-img-url');
        if (urlEl) urlEl.value = result.imageUrl || '';
        _refreshProductPreview();
        UI.toast('Foto enviada com sucesso.', 'success');
      }).catch(function (err) {
        if (window._pmImageUploadToken !== token) return;
        console.error('[Catalogo] product image upload failed', {
          code: err && err.code,
          message: err && err.message,
          originalCode: err && err.originalCode,
          productId: draftId,
          tenantId: tenantId,
          authUid: authUser && authUser.uid ? authUser.uid : ''
        }, err);
        window._pmImageUploadPending = false;
        if (window._pmImagePreviewUrl) {
          try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
          window._pmImagePreviewUrl = '';
        }
        _refreshProductPreview();
        UI.toast(_productImageErrorMessage(err) + ' A imagem anterior foi mantida.', 'error');
        event.target.value = '';
      });
    } catch (err) {
      window._pmImageUploadPending = false;
      window._pmImageUploadToken = token + '-error';
      if (window._pmImagePreviewUrl) {
        try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
        window._pmImagePreviewUrl = '';
      }
      _refreshProductPreview();
      UI.toast(_productImageErrorMessage(err) + ' A imagem anterior foi mantida.', 'error');
      event.target.value = '';
    }
  }

  function _toggleVis() {
    window._pmVisible = !window._pmVisible;
    var btn = document.getElementById('pm-visible-toggle');
    if (btn) {
      btn.style.background = window._pmVisible ? '#B42318' : '#D4C8C6';
      var span = btn.querySelector('span');
      if (span) span.style.transform = 'translateX(' + (window._pmVisible ? '18px' : '0') + ')';
    }
  }

  function _saveProduct() {
    var base = window._pmProductBase || (_editingId ? (_products.find(function (x) { return String(x.id) === String(_editingId); }) || {}) : {});
    var name = (document.getElementById('pm-name') || {}).value || '';
    if (!name.trim()) { _setProductModalError('O nome do produto é obrigatório.'); UI.toast('O nome do produto é obrigatório.', 'error'); return; }
    if (USE_FIREBASE_STORAGE_UPLOAD && window._pmImageUploadPending) {
      _setProductModalError('A imagem ainda está sendo enviada. Aguarde um instante.');
      UI.toast('A imagem ainda está sendo enviada. Aguarde um instante.', 'info');
      return;
    }
    var priceInput = document.getElementById('pm-price');
    var rawPrice = priceInput ? String(priceInput.value || '').trim() : '';
    var salePrice = _moneyLike(rawPrice);
    if (!rawPrice || !isFinite(salePrice) || salePrice <= 0) {
      _setProductModalError('Informe o preço do produto.');
      UI.toast('Informe o preço do produto.', 'error');
      if (priceInput) priceInput.focus();
      return;
    }

    // Change B: tipo
    var tipoEl = document.querySelector('input[name="pm-tipo"]:checked');
    var tipo = tipoEl ? tipoEl.value : 'unico';

    var unicoSrcEl = document.querySelector('input[name="pm-unico-src"]:checked');
    var unicoSrc = unicoSrcEl ? unicoSrcEl.value : 'receita';
    var selectedFichaId = ((document.getElementById('pm-ficha-id') || {}).value || '').trim();
    var selectedProntoId = (document.getElementById('pm-pronto-id') || {}).value || '';
    if (tipo === 'unico' && unicoSrc === 'produto_pronto' && selectedProntoId) {
      unicoSrc = _prontoSourceForId(selectedProntoId);
    }
    if (tipo === 'unico' && unicoSrc === 'receita' && !selectedFichaId) {
      _setProductModalError('Escolha a receita usada por este produto.');
      UI.toast('Escolha a receita usada por este produto.', 'error');
      return;
    }
    if (tipo === 'unico' && (unicoSrc === 'produto_pronto' || unicoSrc === 'compras_produto') && !selectedProntoId) {
      _setProductModalError('Escolha o produto pronto usado por este item.');
      UI.toast('Escolha o produto pronto usado por este item.', 'error');
      return;
    }

    // Change C: tags — from registered tag checkboxes
    var tags = [];
    document.querySelectorAll('.pm-tag-check:checked').forEach(function (cb) {
      tags.push({ id: cb.dataset.tagId, text: cb.dataset.tagText, bgColor: cb.dataset.tagBg, textColor: cb.dataset.tagColor });
    });

    // Change D: variantGroupIds
    var variantGroupIds = [];
    document.querySelectorAll('.pm-variant-check:checked').forEach(function (cb) {
      variantGroupIds.push(cb.dataset.vgid);
    });

    // Change B: menu choice groups
    var menuChoiceGroups = [];
    var menuItems = [];
    var menuContainer = document.getElementById('pm-menu-groups');
    if (menuContainer && tipo === 'menu') {
      var menuValidationError = '';
      var invalidGroup = null;
      if (!menuContainer.querySelector('.pm-menu-group')) {
        menuValidationError = 'Adicione pelo menos um grupo ao menu/combo.';
      }
      menuContainer.querySelectorAll('.pm-menu-group').forEach(function (groupEl) {
        var idx = groupEl.dataset.menuGroup;
        var titleEl = groupEl.querySelector('[data-menu-title="' + idx + '"]');
        var minEl = groupEl.querySelector('[data-menu-min="' + idx + '"]');
        var maxEl = groupEl.querySelector('[data-menu-max="' + idx + '"]');
        var max = parseInt(maxEl ? maxEl.value : 1, 10) || 1;
        var min = parseInt(minEl ? minEl.value : max, 10);
        if (min < 0) min = 0;
        if (max < 1) max = 1;
        if (min > max) min = max;
        var options = [];
        groupEl.querySelectorAll('[data-menu-selected="' + idx + '"]').forEach(function (opt) {
          var priceEl = opt.querySelector('[data-menu-price="' + idx + '"]');
          var ref = opt.dataset.ref || '';
          var meta = _compositionItemMeta(ref);
          options.push({
            ref: ref,
            label: opt.dataset.label || ref,
            priceExtra: _moneyLike(priceEl ? priceEl.value : 0),
            img: opt.dataset.img || '',
            stockRef: ref,
            stockItemRef: ref,
            stockItemId: meta.itemId || '',
            stockItemName: meta.label || opt.dataset.label || '',
            stockItemType: meta.stockItemType || '',
            itemClass: meta.stockItemType || '',
            classe: meta.stockItemType || '',
            stockQuantity: 1,
            stockQuantityPerChoice: 1,
            stockUnit: meta.unit || 'un',
            stockUnitCost: meta.unitCost || 0
          });
        });
        var groupName = (titleEl ? titleEl.value : '').trim();
        if (!groupName && !invalidGroup) invalidGroup = 'Dê um nome para cada grupo do combo.';
        if (min > max && !invalidGroup) invalidGroup = 'No menu/combo, o mínimo não pode ser maior que o máximo.';
        if (!options.length && !invalidGroup) invalidGroup = 'Cada grupo do combo precisa ter pelo menos uma opção.';
        if (options.length) {
          menuChoiceGroups.push({ title: groupName || 'Escolha', min: min, max: max, options: options });
          if (options.length === 1) menuItems.push({ ref: options[0].ref, qty: max });
        }
      });
      if (invalidGroup || menuValidationError) {
        var msg = invalidGroup || menuValidationError;
        _setProductModalError(msg);
        UI.toast(msg, 'error');
        return;
      }
    }
    var publicVariants = _publicVariantsForProduct(menuChoiceGroups, variantGroupIds);
    var usesInternalComposition = tipo === 'unico' && unicoSrc === 'composicao_interna';
    var internalComposition = [];
    if (usesInternalComposition) {
      var internalCompositionError = _validateInternalCompositionRows();
      if (internalCompositionError) {
        _setProductModalError(internalCompositionError);
        UI.toast(internalCompositionError, 'error');
        return;
      }
      internalComposition = _collectInternalComposition();
      if (!internalComposition.length) {
        _setProductModalError('Adicione pelo menos um item na montagem interna.');
        UI.toast('Adicione pelo menos um item na montagem interna.', 'error');
        return;
      }
    }
    var selectedTags = tags.filter(function (tag) { return tag && tag.text; });
    var primaryTag = selectedTags[0] || {};
    var selectedPairing = firstText(base.pairing, base.pairingId, base.pairingProductId, '');

    // Change E: SEO
    var seoTitle = (document.getElementById('pm-seo-title') || {}).value || name;
    var seoDesc = (document.getElementById('pm-seo-desc') || {}).value || '';
    var seoSlug = (document.getElementById('pm-seo-slug') || {}).value || (base.slug || _toSlug(name));
    seoSlug = _uniqueProductSlug(seoSlug, _editingId);
    var seoKw = (document.getElementById('pm-seo-kw') || {}).value || '';
    var seoAlt = (document.getElementById('pm-seo-alt') || {}).value || name;
    var fiscalBase = _ensureProductFiscal(base);
    var fiscalIvaRaw = (document.getElementById('pm-fiscal-iva') || {}).value;
    var fiscalIva = parseFloat(String(fiscalIvaRaw == null ? '' : fiscalIvaRaw).replace(',', '.'));
    if (String(fiscalIvaRaw == null ? '' : fiscalIvaRaw).trim() && (!isFinite(fiscalIva) || fiscalIva < 0)) {
      _setProductModalError('Informe um IVA válido para o produto.');
      UI.toast('Informe um IVA válido para o produto.', 'error');
      return;
    }
    var madeToOrder = !!(document.getElementById('pm-made-to-order') && document.getElementById('pm-made-to-order').checked);
    var productionLeadDays = madeToOrder ? Math.max(0, Math.floor(_moneyLike((document.getElementById('pm-production-lead-days') || {}).value || 0))) : 0;
    var maxProductAdvance = _productMaxAdvanceDays();
    if (madeToOrder && productionLeadDays <= 0) {
      _setProductModalError('Informe o prazo de produção do produto sob encomenda.');
      UI.toast('Informe o prazo de produção do produto sob encomenda.', 'error');
      return;
    }
    if (madeToOrder && productionLeadDays > maxProductAdvance) {
      _setProductModalError('O prazo de produção precisa ficar dentro da antecedência configurada em Operação: até ' + maxProductAdvance + ' dia(s).');
      UI.toast('O prazo de produção precisa ficar dentro da antecedência configurada em Operação: até ' + maxProductAdvance + ' dia(s).', 'error');
      return;
    }
    var fiscal = Object.assign({}, fiscalBase, {
      sku: ((document.getElementById('pm-fiscal-sku') || {}).value || '').trim(),
      fiscalName: ((document.getElementById('pm-fiscal-name') || {}).value || '').trim(),
      ivaRate: isFinite(fiscalIva) ? fiscalIva : fiscalBase.ivaRate,
      ivaIncluded: true,
      taxCategory: ((document.getElementById('pm-fiscal-tax-category') || {}).value || fiscalBase.taxCategory || 'prepared_food'),
      unitCode: ((document.getElementById('pm-fiscal-unit-code') || {}).value || fiscalBase.unitCode || 'unit')
    });

    var data = {
      name: name,
      price: salePrice,
      cost: _productCostFromState(base),
      custo: _productCostFromState(base),
      microcopy: (document.getElementById('pm-microcopy') || {}).value || '',
      shortDesc: (document.getElementById('pm-short-desc') || {}).value || '',
      fullDesc: (document.getElementById('pm-full-desc') || {}).value || '',
      description: (document.getElementById('pm-short-desc') || {}).value || '',
      categoryId: (document.getElementById('pm-cat') || {}).value || '',
      internalNote: (document.getElementById('pm-note') || {}).value || '',
      menuVisible: window._pmVisible !== false,
      // Change B
      type: tipo,
      productType: tipo === 'menu' ? 'combo' : 'simple',
      unicoSource: tipo === 'unico' ? unicoSrc : null,
      fichaId: (tipo === 'unico' && unicoSrc === 'receita') ? selectedFichaId : '',
      produtoProntoId: (tipo === 'unico' && (unicoSrc === 'produto_pronto' || unicoSrc === 'compras_produto')) ? selectedProntoId : '',
      sourceItemId: (tipo === 'unico' && unicoSrc === 'compras_produto') ? selectedProntoId : '',
      menuItems: tipo === 'menu' ? menuItems : [],
      menuChoiceGroups: tipo === 'menu' ? menuChoiceGroups : [],
      internalComposition: internalComposition,
      internalCompositionItems: internalComposition,
      addAlsoIds: [].slice.call(document.querySelectorAll('[data-upsell-selected="addAlso"]')).map(function (x) { return x.dataset.id; }).filter(function (id, index, arr) { return id && arr.indexOf(id) === index; }),
      addAlsoTitle: ((document.getElementById('pm-upsell-title-addAlso') || {}).value || 'Aumentar valor do pedido').trim(),
      addAlsoDiscount: _moneyLike(((document.getElementById('pm-upsell-discount-addAlso') || {}).value || '0')) || 0,
      variants: publicVariants,
      pairing: selectedPairing || '',
      pairingId: selectedPairing || '',
      pairingProductId: selectedPairing || '',
      // Change C
      tags: tags,
      badgeText: firstText(primaryTag.text, base.badgeText, base.tag, ''),
      tag: firstText(primaryTag.text, base.tag, base.badgeText, ''),
      badgeColor: firstText(primaryTag.bgColor, base.badgeColor, ''),
      badgeTextColor: firstText(primaryTag.textColor, base.badgeTextColor, ''),
      // Change D
      variantGroupIds: variantGroupIds,
      featured: !!(document.getElementById('pm-featured') && document.getElementById('pm-featured').checked),
      popular: !!(document.getElementById('pm-featured') && document.getElementById('pm-featured').checked),
      madeToOrder: madeToOrder,
      productMadeToOrder: madeToOrder,
      sobEncomenda: madeToOrder,
      productionLeadDays: productionLeadDays,
      productionLeadTimeDays: productionLeadDays,
      // Change E
      seoTitle: seoTitle,
      seoDescription: seoDesc,
      slug: seoSlug,
      seoKeyword: seoKw,
      imageAlt: seoAlt,
      fiscal: fiscal
    };

    var imgState = window._pmImageState || null;
    if (window._pmImageRemoved) {
      data.imageUrl = '';
      data.imageCardUrl = '';
      data.imageThumbUrl = '';
      data.imagePath = '';
      data.imageStoragePath = '';
      data.imageWidth = null;
      data.imageHeight = null;
      data.imageSizeKb = null;
      data.imageFormat = '';
    } else if (imgState) {
      data.imageUrl = imgState.imageUrl || '';
      data.imagePath = imgState.imagePath || imgState.imageStoragePath || '';
      data.imageCardUrl = imgState.imageCardUrl || imgState.cardUrl || imgState.imageUrl || '';
      data.imageThumbUrl = imgState.imageThumbUrl || imgState.thumbUrl || imgState.imageCardUrl || imgState.imageUrl || '';
      data.imageStoragePath = imgState.imageStoragePath || '';
      data.imageWidth = imgState.imageWidth || null;
      data.imageHeight = imgState.imageHeight || null;
      data.imageSizeKb = imgState.imageSizeKb || null;
      data.imageFormat = imgState.imageFormat || 'webp';
    }

    var productId = _editingId || window._pmDraftId || _newEntityId('prod');
    data.id = productId;
    data.updatedAt = new Date().toISOString();
    if (!_editingId) {
      data.createdAt = new Date().toISOString();
      window._pmDraftId = productId;
    }

    var op = _editingId ? DB.update('products', _editingId, data) : DB.set('products', productId, data);
    op.then(function () {
      window._pmImageUploadPending = false;
      if (window._pmImagePreviewUrl) {
        try { URL.revokeObjectURL(window._pmImagePreviewUrl); } catch (e) {}
        window._pmImagePreviewUrl = '';
      }
      UI.toast(_editingId ? 'Produto atualizado!' : 'Produto adicionado!', 'success');
      if (window._productModal) window._productModal.close();
      _renderProdutos();
    }).catch(function (err) {
      console.error('[Catalogo] product save failed', {
        code: err && err.code,
        message: err && err.message,
        productId: productId,
        tenantId: tenantId,
        imageUrl: data.imageUrl || '',
        imageStoragePath: data.imageStoragePath || ''
      }, err);
      window._pmImageUploadPending = false;
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _deleteProduct(id) {
    UI.confirm('Eliminar este produto?').then(function (yes) {
      if (!yes) return;
      DB.remove('products', id).then(function () {
        UI.toast('Produto eliminado', 'info');
        _renderProdutos();
      });
    });
  }

  function _duplicateProduct(id) {
    var original = _products.find(function (p) { return String(p.id) === String(id); });
    if (!original) {
      UI.toast('Produto não encontrado.', 'error');
      return;
    }
    var source = JSON.parse(JSON.stringify(_normalizeProduct(original)));
    var now = new Date().toISOString();
    var nextOrder = _products.reduce(function (max, item) {
      return Math.max(max, parseFloat(item && item.order) || 0);
    }, -1) + 1;
    var cloneName = 'Cópia de ' + String(source.name || 'Produto');
    var clone = {};
    Object.keys(source).forEach(function (key) {
      clone[key] = source[key];
    });
    [
      'id', '_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
      'imageUrl', 'imageMainUrl', 'imageCardUrl', 'cardImageUrl',
      'imageThumbUrl', 'thumbnailUrl', 'thumbUrl', 'imageBase64',
      'img', 'photoUrl', 'image', 'imagePath', 'imageStoragePath', 'storagePath',
      'imageWidth', 'imageHeight', 'imageSizeKb', 'imageFormat',
      'externalFiscalProductId', 'facturaDirectaProductId'
    ].forEach(function (key) { delete clone[key]; });
    clone.id = _newEntityId('prod');
    clone.name = cloneName;
    clone.slug = _uniqueProductSlug(cloneName, null);
    clone.order = nextOrder;
    clone.createdAt = now;
    clone.updatedAt = now;
    clone.menuVisible = false;
    clone.fiscal = Object.assign({}, _ensureProductFiscal(source), {
      sku: '',
      externalFiscalProductId: '',
      facturaDirectaProductId: ''
    });
    DB.set('products', clone.id, clone).then(function () {
      UI.toast('Produto duplicado como rascunho independente.', 'success');
      _products = (_products || []).filter(function (item) { return String(item && item.id) !== String(clone.id); }).concat([clone]).sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
      _paintProdutos();
      _openProductModal(clone.id);
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _splitImportLine(line, delimiter) {
    var out = [];
    var cur = '';
    var quote = false;
    var i;
    for (i = 0; i < line.length; i += 1) {
      var ch = line[i];
      if (ch === '"') {
        if (quote && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          quote = !quote;
        }
      } else if (ch === delimiter && !quote) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(function (item) { return String(item || '').trim(); });
  }

  function _normalizeImportedProductRow(row, order, existingCategories) {
    row = row || {};
    var name = String(row.name || row.nome || row.title || row.produto || row.product || '').trim();
    if (!name) return null;
    var categoryRaw = String(row.categoryId || row.category || row.categoria || row.category_name || row.categoryName || '').trim();
    var categoryMatch = null;
    if (categoryRaw) {
      categoryMatch = (existingCategories || []).find(function (c) {
        return String(c.id || '').toLowerCase() === categoryRaw.toLowerCase() ||
          String(c.slug || '').toLowerCase() === categoryRaw.toLowerCase() ||
          String(c.name || c.label || '').toLowerCase() === categoryRaw.toLowerCase();
      });
    }
    var price = _moneyLike(row.price || row.preco || row.valor || row.salePrice || row.valorVenda || 0);
    var type = String(row.type || row.productType || row.tipo || 'unico').toLowerCase();
    if (type === 'combo') type = 'menu';
    if (type !== 'menu' && type !== 'unico') type = 'unico';
    var visibleRaw = row.menuVisible;
    if (visibleRaw == null || visibleRaw === '') visibleRaw = row.visible != null ? row.visible : row.status != null ? row.status : row.ativo;
    var visible = true;
    if (typeof visibleRaw === 'string') {
      visible = !/^(0|false|falso|nao|não|off|ocult|hidden)$/i.test(visibleRaw.trim());
    } else if (typeof visibleRaw === 'number') {
      visible = visibleRaw !== 0;
    } else if (typeof visibleRaw === 'boolean') {
      visible = visibleRaw;
    }
    return {
      id: _newEntityId('prod'),
      name: name,
      price: isFinite(price) ? price : 0,
      categoryId: categoryMatch ? (categoryMatch.id || categoryMatch.slug || categoryRaw) : categoryRaw,
      shortDesc: String(row.shortDesc || row.description || row.descricao || row.desc || '').trim(),
      description: String(row.description || row.shortDesc || row.descricao || row.desc || '').trim(),
      microcopy: String(row.microcopy || row.microCopy || '').trim(),
      menuVisible: visible,
      type: type,
      slug: _uniqueProductSlug(row.slug || name, null),
      imageUrl: String(row.imageUrl || row.image || row.img || '').trim(),
      imageCardUrl: String(row.imageCardUrl || row.imageUrl || row.image || row.img || '').trim(),
      imageThumbUrl: String(row.imageThumbUrl || row.imageCardUrl || row.imageUrl || row.image || row.img || '').trim(),
      order: isFinite(parseFloat(order)) ? parseFloat(order) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function _parseProductImportPayload(raw) {
    var text = String(raw || '').trim();
    if (!text) return [];
    var parsed = null;
    if (/^[\[{]/.test(text)) {
      try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
    }
    if (parsed) {
      var list = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || parsed.data || []);
      return (Array.isArray(list) ? list : []).filter(Boolean);
    }
    var lines = text.split(/\r?\n/).map(function (line) { return String(line || '').trim(); }).filter(Boolean);
    if (!lines.length) return [];
    var header = lines[0];
    var delimiter = header.indexOf(';') >= 0 && header.indexOf(',') >= 0 ? (header.split(';').length >= header.split(',').length ? ';' : ',') : (header.indexOf(';') >= 0 ? ';' : ',');
    var headers = _splitImportLine(header, delimiter).map(function (h) { return String(h || '').trim().toLowerCase(); });
    return lines.slice(1).map(function (line) {
      var cols = _splitImportLine(line, delimiter);
      var row = {};
      headers.forEach(function (h, idx) { row[h] = cols[idx] || ''; });
      return row;
    });
  }

  function _openImportProducts() {
    var body = '' +
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="font-size:13px;color:#6B7280;line-height:1.5;">Cole um JSON ou CSV simples com colunas como <strong>name</strong>, <strong>price</strong>, <strong>category</strong> e <strong>description</strong>. Também é possível carregar um arquivo.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 180px;gap:10px;align-items:start;">' +
          '<textarea id="catalogo-import-data" rows="10" placeholder="[{&quot;name&quot;:&quot;Hambúrguer&quot;,&quot;price&quot;:12.5}] ou CSV com cabeçalho" style="width:100%;padding:12px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;font-family:inherit;outline:none;min-height:220px;resize:vertical;box-sizing:border-box;"></textarea>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            '<input id="catalogo-import-file" type="file" accept=".json,.csv,text/csv,application/json" style="display:block;width:100%;font-size:13px;color:#6B7280;">' +
            '<div style="font-size:12px;color:#9CA3AF;line-height:1.45;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:10px;">Campos aceitos: nome, preço, categoria, descrição, visibilidade, tipo e slug.</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    var footer = '' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;">' +
        '<button type="button" id="catalogo-import-cancel" style="height:40px;padding:0 14px;border:1px solid #E5E7EB;border-radius:10px;background:#fff;color:#171717;font-size:14px;font-weight:500;cursor:pointer;">Cancelar</button>' +
        '<button type="button" id="catalogo-import-confirm" style="height:40px;padding:0 16px;border:none;border-radius:10px;background:#D71920;color:#fff;font-size:14px;font-weight:500;cursor:pointer;">Importar</button>' +
      '</div>';
    window._catalogoImportModal = UI.modal({ title: 'Importar produtos', body: body, footer: footer, maxWidth: '760px' });
    var overlay = window._catalogoImportModal && window._catalogoImportModal.el;
    if (!overlay) return;
    var fileInput = overlay.querySelector('#catalogo-import-file');
    var dataInput = overlay.querySelector('#catalogo-import-data');
    var cancelBtn = overlay.querySelector('#catalogo-import-cancel');
    var confirmBtn = overlay.querySelector('#catalogo-import-confirm');

    if (fileInput && dataInput) {
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () { dataInput.value = String(reader.result || ''); };
        reader.readAsText(file);
      });
    }
    if (cancelBtn) cancelBtn.onclick = function () { if (window._catalogoImportModal) window._catalogoImportModal.close(); };
    if (confirmBtn) confirmBtn.onclick = function () {
      var rows = _parseProductImportPayload((dataInput && dataInput.value) || '');
      if (!rows.length) {
        UI.toast('Cole um JSON ou CSV válido.', 'error');
        return;
      }
      var nextOrder = _products.reduce(function (max, item) {
        return Math.max(max, parseFloat(item && item.order) || 0);
      }, -1) + 1;
      var imported = 0;
      var tasks = rows.map(function (row, idx) {
        var data = _normalizeImportedProductRow(row, nextOrder + idx, _categories);
        if (!data) return Promise.resolve();
        imported += 1;
        return DB.set('products', data.id, data);
      });
      Promise.all(tasks).then(function () {
        UI.toast(imported + ' produto(s) importado(s).', 'success');
        if (window._catalogoImportModal) window._catalogoImportModal.close();
        _renderProdutos();
      }).catch(function (err) {
        UI.toast('Erro: ' + err.message, 'error');
      });
    };
  }

  // ── TEMPLATE / SEO / CONFIGURAÇÕES ───────────────────────────────────────
  function _catalogTarget() {
    return document.getElementById('catalogo-config-inner') || document.getElementById('catalogo-content');
  }

  function _labelStyle() { return 'font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;'; }
  function _inputStyle() { return 'width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:Manrope,Inter,sans-serif;outline:none;background:#fff;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);'; }
  function _cardStyle() { return 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);'; }
  function _ensureTemplateStyles() {
    if (document.getElementById('tpl-toggle-style')) return;
    var style = document.createElement('style');
    style.id = 'tpl-toggle-style';
    style.textContent = '' +
      '.tpl-toggle{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;background:#fff;border:1px solid #EAE4DA;border-radius:10px;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03)}' +
      '.tpl-toggle-control{position:relative;display:inline-block;width:42px;height:24px;flex:0 0 auto;margin-top:1px}' +
      '.tpl-toggle-control input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}' +
      '.tpl-toggle-track{position:absolute;inset:0;border-radius:999px;background:#D8E0EA;transition:background .2s}' +
      '.tpl-toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:transform .2s}' +
      '.tpl-toggle-control input:checked + .tpl-toggle-track{background:#B42318}' +
      '.tpl-toggle-control input:checked + .tpl-toggle-track + .tpl-toggle-thumb{transform:translateX(18px)}' +
      '.tpl-toggle-title{font-size:13px;font-weight:600;color:#1F1F1F;display:block}' +
      '.tpl-toggle-hint{display:block;color:#6F6860;font-size:11px;margin-top:2px;line-height:1.35}' +
      '.tpl-color-field{display:block}' +
      '.tpl-color-row{display:flex;gap:9px;align-items:center;flex-wrap:nowrap}' +
      '.tpl-color-swatch{position:relative;width:44px;height:42px;border-radius:11px;border:1.5px solid #D4C8C6;box-shadow:inset 0 0 0 2px rgba(255,255,255,.62),0 6px 14px rgba(31,31,31,.06);flex:0 0 44px;overflow:hidden;cursor:pointer}' +
      '.tpl-color-swatch input{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);border:0;padding:0;opacity:0;cursor:pointer}' +
      '.tpl-color-row input[type="text"]{min-width:0;flex:1}' +
      '.tpl-opacity-field{display:flex;flex-direction:column;gap:8px}' +
      '.tpl-opacity-row{display:flex;gap:10px;align-items:center}' +
      '.tpl-opacity-range{flex:1;accent-color:#B42318}' +
      '.tpl-opacity-number{width:72px}' +
      '.tpl-opacity-readout{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:#6F6860;line-height:1.35;padding:8px 10px;background:#fff;border:1px solid #EAE4DA;border-radius:10px;box-shadow:0 1px 2px rgba(31,31,31,.03)}' +
      '.tpl-opacity-chip{font-weight:600;color:#1F1F1F;background:#fff;border:1px solid #EAE4DA;border-radius:999px;padding:4px 8px;min-width:54px;text-align:center}' +
      '.tpl-featured-search{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:10px;align-items:end}' +
      '.tpl-featured-fields{grid-column:1 / -1;display:flex;flex-direction:column;gap:12px}' +
      '.tpl-featured-search-list{max-height:220px;overflow:auto}' +
      '.tpl-featured-search-note{font-size:11px;color:#6F6860;line-height:1.35;margin-top:6px}' +
      '.tpl-featured-combo{position:relative;display:block}' +
      '.tpl-featured-combo-menu{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:60;display:none;max-height:230px;overflow:auto;background:#fff;border:1px solid #EAE4DA;border-radius:12px;box-shadow:0 12px 30px rgba(31,31,31,.06);padding:5px 0}' +
      '.tpl-featured-combo-item{padding:9px 14px;cursor:pointer;border-bottom:1px solid #EAE4DA;font-size:13px;font-family:inherit;background:#fff}' +
      '.tpl-featured-combo-item:hover{background:#FBF8F2}' +
      '.tpl-featured-combo-item:last-child{border-bottom:none}' +
      '.tpl-featured-combo-title{font-weight:600;color:#1F1F1F;line-height:1.25}' +
      '.tpl-featured-combo-sub{font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px}' +
      '.tpl-featured-combo-empty{padding:10px 14px;color:#6F6860;font-size:13px;font-family:inherit}' +
      '.tpl-image-grid-media{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(220px,.85fr);gap:12px;align-items:start}' +
      '.tpl-image-card{display:flex;flex-direction:column;gap:10px;padding:14px;background:#fff;border:1px solid #EAE4DA;border-radius:14px;box-shadow:0 1px 2px rgba(31,31,31,.03)}' +
      '.tpl-image-card.tpl-image-card--logo{padding:16px 16px 18px}' +
      '.tpl-image-card.tpl-image-card--favicon{padding:12px 12px 14px}' +
      '.tpl-image-preview{margin-top:8px;border:1px solid #EAE4DA;border-radius:12px;overflow:hidden;background:#fff;height:120px;display:flex;align-items:center;justify-content:center;position:relative}' +
      '.tpl-image-preview img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}' +
      '.tpl-image-preview.tpl-image-preview--contain img{object-fit:contain}' +
      '.tpl-image-preview.tpl-image-preview--logo{min-height:180px;height:180px;padding:18px;background:#FAFAF8}' +
      '.tpl-image-preview.tpl-image-preview--favicon{width:88px;height:88px;min-height:88px;align-self:flex-start;padding:12px;background:#FAFAF8}' +
      '.tpl-image-browser-tab{display:flex;align-items:center;gap:8px;height:36px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;line-height:1;box-shadow:0 1px 2px rgba(31,31,31,.03)}' +
      '.tpl-image-browser-tab .tpl-image-browser-icon{width:20px;height:20px;border-radius:6px;background:#FBF8F2;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;flex:0 0 auto}' +
      '.tpl-image-browser-tab .tpl-image-browser-icon img{width:100%;height:100%;object-fit:contain;object-position:center;display:block}' +
      '.tpl-image-browser-tab .tpl-image-browser-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}' +
      '.tpl-image-actions{display:flex;flex-wrap:wrap;gap:8px}' +
      '.tpl-image-btn{border:none;border-radius:10px;padding:9px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}' +
      '.tpl-image-btn.primary{background:#EEF4FF;color:#3B82F6}' +
      '.tpl-image-btn.ghost{background:#fff;border:1px solid #EAE4DA;color:#6F6860}' +
      '.tpl-image-note{font-size:11px;color:#6F6860;line-height:1.35}' +
      '.tpl-delivery-zone-grid{display:grid;grid-template-columns:minmax(190px,.85fr) minmax(280px,1.35fr) minmax(140px,.55fr);gap:12px;align-items:start}' +
      '.tpl-delivery-zone-active{align-self:start}' +
      '.tpl-delivery-zone-active .tpl-toggle{padding:10px 11px;background:#fff;align-items:center;min-height:42px}' +
      '.tpl-delivery-zone-active .tpl-toggle-title{font-size:12px;font-weight:600}' +
      '.tpl-delivery-zone-active .tpl-toggle-hint{display:none}' +
      '.tpl-delivery-zone-delete{min-height:0;padding:6px 10px;border-radius:9px;font-size:11px;line-height:1;white-space:nowrap;flex:0 0 auto}' +
      '.tpl-hours-day{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px;box-shadow:0 1px 2px rgba(31,31,31,.03)}' +
      '.tpl-hours-day-main{display:grid;grid-template-columns:minmax(180px,1.2fr) minmax(140px,.82fr) minmax(128px,.95fr) minmax(128px,.95fr);gap:10px;align-items:end}' +
      '.tpl-hours-day-main--second{padding-top:8px;border-top:1px solid rgba(234,228,218,.72)}' +
      '.tpl-hours-day-name{font-size:12px;font-weight:800;color:#1A1A1A;line-height:1.25;padding:2px 0 4px;align-self:center}' +
      '.tpl-hours-day-main .tpl-toggle,.tpl-hours-day-secondary-toggle .tpl-toggle,.tpl-hours-day-closed-toggle .tpl-toggle{padding:8px 10px;background:#fff;min-height:46px;align-items:center}' +
      '.tpl-hours-day-main .tpl-toggle-control,.tpl-hours-day-secondary-toggle .tpl-toggle-control,.tpl-hours-day-closed-toggle .tpl-toggle-control{width:38px;height:22px;margin-top:0}' +
      '.tpl-hours-day-main .tpl-toggle-thumb,.tpl-hours-day-secondary-toggle .tpl-toggle-thumb,.tpl-hours-day-closed-toggle .tpl-toggle-thumb{width:16px;height:16px;top:3px;left:3px}' +
      '.tpl-hours-day-main .tpl-toggle-control input:checked + .tpl-toggle-track + .tpl-toggle-thumb,.tpl-hours-day-secondary-toggle .tpl-toggle-control input:checked + .tpl-toggle-track + .tpl-toggle-thumb,.tpl-hours-day-closed-toggle .tpl-toggle-control input:checked + .tpl-toggle-track + .tpl-toggle-thumb{transform:translateX(16px)}' +
      '.tpl-hours-day-main .tpl-toggle-title,.tpl-hours-day-secondary-toggle .tpl-toggle-title,.tpl-hours-day-closed-toggle .tpl-toggle-title{font-size:12px;line-height:1.15}' +
      '.tpl-hours-day-main .tpl-toggle-hint,.tpl-hours-day-secondary-toggle .tpl-toggle-hint,.tpl-hours-day-closed-toggle .tpl-toggle-hint{display:none}' +
      '.tpl-hours-day-field{min-width:0}' +
      '.tpl-hours-day-closed-toggle{align-self:end}' +
      '.tpl-hours-day-secondary-toggle{align-self:end}' +
      '.tpl-hours-day-secondary-inline{display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:10px;align-items:end;min-width:0}' +
      '.tpl-hours-day.is-closed [data-hours-main-field],.tpl-hours-day.is-second-closed [data-hours-secondary-fields] .tpl-hours-day-field{opacity:.42;pointer-events:none}' +
      '.tpl-hours-day.is-secondary-off .tpl-hours-day-secondary-inline{display:none !important}' +
      '.tpl-hours-day.is-closed [data-hours-main-field] input,.tpl-hours-day.is-second-closed [data-hours-secondary-fields] input{background:#F7F2EE;color:#A09692}' +
      '@media (max-width: 980px){.tpl-hours-day-main{grid-template-columns:repeat(2,minmax(0,1fr));}.tpl-hours-day-name,.tpl-hours-day-secondary-toggle,.tpl-hours-day-secondary-inline{grid-column:1 / -1}.tpl-hours-day-secondary-inline{grid-template-columns:repeat(2,minmax(0,1fr));}}' +
      '@media (max-width: 980px){.tpl-delivery-zone-grid{grid-template-columns:1fr 1fr}.tpl-delivery-zone-active{align-self:end}}' +
      '@media (max-width: 640px){.tpl-delivery-zone-grid{grid-template-columns:1fr}.tpl-delivery-zone-delete{padding:7px 10px}}' +
      '.tpl-payment-methods{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:12px;align-items:start}.tpl-payment-method-card{border:1px solid #EADFD8;border-radius:16px;background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);padding:13px;display:flex;flex-direction:column;gap:11px;box-shadow:0 10px 24px rgba(85,46,32,.045),inset 0 1px 0 rgba(255,255,255,.78)}.tpl-payment-method-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.tpl-payment-method-name{font-size:13px;font-weight:650;color:#211815;line-height:1.25}.tpl-payment-method-status{font-size:10.5px;font-weight:500;color:#8A7E7C;margin-top:3px}.tpl-payment-method-note{font-size:11px;line-height:1.35;color:#8A7E7C;margin-top:6px}' +
      '@media (max-width: 640px){.tpl-payment-methods{grid-template-columns:1fr}.tpl-payment-method-head{align-items:center}}' +
      '.tpl-config-page{gap:16px !important}' +
      '.tpl-config-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:2px 0 0}' +
      '.tpl-config-title{font-size:22px;font-weight:760;line-height:1.16;margin:0 0 6px;color:#211815;letter-spacing:-.01em}' +
      '.tpl-config-subtitle{font-size:13px;color:#756A64;line-height:1.45;margin:0;max-width:720px}' +
      '.tpl-config-status{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}' +
      '.tpl-config-chip{display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:rgba(255,255,255,.74);border:1px solid #E9DDD7;color:#6F625C;font-size:11px;font-weight:650;box-shadow:inset 0 1px 0 rgba(255,255,255,.72)}' +
      '.tpl-config-save{height:39px;padding:0 15px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;box-shadow:0 8px 18px rgba(180,35,24,.16);font-family:inherit;transition:transform .15s,box-shadow .15s,background .15s}' +
      '.tpl-config-save:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(180,35,24,.20);background:#A61F16}' +
      '.tpl-subtabs{display:flex;gap:8px;align-items:center;overflow:auto;padding:9px;background:linear-gradient(135deg,#FFFDFC 0%,#FFF7F2 58%,#F8EFE8 100%);border:1px solid #E8DDD5;border-radius:18px;box-shadow:0 10px 26px rgba(85,46,32,.055),inset 0 1px 0 rgba(255,255,255,.72)}' +
      '.tpl-subtab{height:32px;padding:0 12px;border:1px solid transparent;border-radius:999px;background:rgba(255,255,255,.72);color:#6F6860;font-family:Manrope,Inter,sans-serif;font-size:12px;font-weight:720;white-space:nowrap;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s,border-color .15s,transform .15s}' +
      '.tpl-subtab:hover{background:#fff;color:#211815;border-color:#E8DDD5;box-shadow:0 5px 14px rgba(85,46,32,.06)}' +
      '.tpl-subtab.active{background:#B42318;color:#fff;border-color:#B42318;box-shadow:0 8px 18px rgba(180,35,24,.18)}' +
      '[data-template-panel]{display:none}' +
      '[data-template-panel].active{display:block}' +
      '.tpl-config-panel{background:linear-gradient(145deg,#FFFFFF 0%,#FFFDFB 68%,#FFF8F3 100%) !important;border:1px solid #E8DDD5 !important;border-radius:20px !important;padding:16px 18px !important;box-shadow:0 10px 26px rgba(85,46,32,.052),inset 0 1px 0 rgba(255,255,255,.76) !important}' +
      '.tpl-config-panel>div:first-child{margin-bottom:14px !important;padding-bottom:12px;border-bottom:1px solid rgba(232,221,213,.82)}' +
      '.tpl-config-panel h3{font-size:15px !important;font-weight:760 !important;color:#211815 !important;letter-spacing:-.005em}' +
      '.tpl-config-panel p{font-size:12px !important;color:#82766F !important;line-height:1.42 !important;max-width:780px}' +
      '.tpl-config-page input:not([type="checkbox"]):not([type="color"]):not([type="range"]),.tpl-config-page textarea,.tpl-config-page select{background:#FFFCF7 !important;border:1px solid #E8DDD5 !important;border-radius:12px !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.78),0 1px 0 rgba(120,70,50,.03) !important;color:#211815 !important}' +
      '.tpl-config-page input:not([type="checkbox"]):not([type="color"]):not([type="range"]):focus,.tpl-config-page textarea:focus,.tpl-config-page select:focus{border-color:#D7A49C !important;background:#fff !important;box-shadow:0 0 0 3px rgba(180,35,24,.08),inset 0 1px 0 rgba(255,255,255,.78) !important}' +
      '.tpl-config-page label span[style*="letter-spacing"]{color:#5E534D !important;font-weight:750 !important}' +
      '.tpl-config-page [style*="padding:14px"][style*="border:1px solid #EAE4DA"]{background:rgba(255,255,255,.66) !important;border-color:#EADFD8 !important;border-radius:15px !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.78) !important}' +
      '.tpl-config-page [style*="font-size:12px"][style*="font-weight:700"]{font-size:12.5px !important;font-weight:780 !important;color:#2A211E !important}' +
      '.tpl-config-page [style*="font-size:11px"][style*="color:#6F6860"]{color:#8A7E7C !important;line-height:1.32 !important}' +
      '.tpl-config-page .tpl-toggle{background:#FFFDFC !important;border-color:#E8DDD5 !important;border-radius:13px !important;padding:10px 11px !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.74) !important;align-items:center !important}' +
      '.tpl-config-page .tpl-toggle-title{font-size:12.5px !important;font-weight:720 !important;color:#2A211E !important}' +
      '.tpl-config-page .tpl-toggle-hint{font-size:10.5px !important;color:#9A8E89 !important;margin-top:1px !important}' +
      '.tpl-config-page .tpl-toggle-control{width:18px !important;height:18px !important;margin-top:0 !important}' +
      '.tpl-config-page .tpl-toggle-track{background:#fff !important;border:1px solid #DCCBC4 !important;border-radius:5px !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.78) !important}' +
      '.tpl-config-page .tpl-toggle-track::after{content:"";position:absolute;left:5px;top:2px;width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(42deg);display:none}' +
      '.tpl-config-page .tpl-toggle.is-checked .tpl-toggle-track,.tpl-config-page .tpl-toggle-control input:checked + .tpl-toggle-track{background:#B42318 !important;border-color:#B42318 !important}' +
      '.tpl-config-page .tpl-toggle-control input:checked + .tpl-toggle-track::after{display:block}' +
      '.tpl-config-page .tpl-toggle.is-checked .tpl-toggle-track::after{display:block}' +
      '.tpl-config-page .tpl-toggle-thumb{display:none !important}' +
      '.tpl-premium-switch{display:inline-flex;align-items:center;justify-content:space-between;gap:14px;min-width:260px;padding:10px 12px;border:1px solid #E8DDD5;border-radius:16px;background:linear-gradient(135deg,#FFFDFC,#FFF7F2);box-shadow:0 8px 18px rgba(85,46,32,.055),inset 0 1px 0 rgba(255,255,255,.76);cursor:pointer;user-select:none}' +
      '.tpl-premium-switch input{position:absolute;opacity:0;pointer-events:none}' +
      '.tpl-premium-switch-copy{display:flex;flex-direction:column;gap:2px;min-width:0}' +
      '.tpl-premium-switch-title{font-size:12.5px;font-weight:760;color:#211815;line-height:1.2}' +
      '.tpl-premium-switch-state{font-size:10.5px;font-weight:700;color:#8A7E7C;line-height:1.2}' +
      '.tpl-premium-switch-control{width:48px;height:28px;border-radius:999px;background:#EEE5DF;border:1px solid #D8C9C0;box-shadow:inset 0 1px 2px rgba(33,27,24,.10);position:relative;flex:0 0 auto;transition:background .18s,border-color .18s,box-shadow .18s}' +
      '.tpl-premium-switch-control::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 5px 12px rgba(33,27,24,.18);transition:transform .18s}' +
      '.tpl-premium-switch input:checked ~ .tpl-premium-switch-control{background:#B42318;border-color:#B42318;box-shadow:0 7px 18px rgba(180,35,24,.20),inset 0 1px 0 rgba(255,255,255,.18)}' +
      '.tpl-premium-switch input:checked ~ .tpl-premium-switch-control::after{transform:translateX(20px)}' +
      '.tpl-premium-switch input:checked + .tpl-premium-switch-copy .tpl-premium-switch-state::before{content:"Ativada"}' +
      '.tpl-premium-switch input:not(:checked) + .tpl-premium-switch-copy .tpl-premium-switch-state::before{content:"Desativada"}' +
      '.tpl-premium-switch--plain{min-width:0;padding:0;border:0;background:transparent;box-shadow:none;border-radius:0}' +
      '.tpl-config-page .tpl-image-card,.tpl-config-page .tpl-payment-method-card,.tpl-config-page .tpl-hours-day{background:rgba(255,255,255,.68) !important;border-color:#EADFD8 !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.78) !important;border-radius:15px !important}' +
      '.tpl-config-page .tpl-image-preview{background:#FFFCF8 !important;border-color:#E8DCD7 !important}' +
      '.tpl-language-wrap{position:relative;display:block}' +
      '.tpl-language-select{appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:42px !important;background:#fff !important}' +
      '.tpl-language-arrow{position:absolute;right:15px;top:50%;transform:translateY(-50%);font-size:19px;color:#6F6860;line-height:1;pointer-events:none;z-index:2}' +
      '.tpl-section-heading{display:flex;align-items:flex-start;gap:9px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(232,221,213,.82)}' +
      '.tpl-section-heading .mi{font-size:18px;color:#8A7E7C;line-height:1.15;margin-top:1px;opacity:.9}' +
      '.tpl-section-heading h3{font-size:15px;font-weight:760;margin:0 0 4px;color:#211815;letter-spacing:-.005em}' +
      '.tpl-section-heading p{font-size:12px;color:#82766F;line-height:1.42;margin:0;max-width:780px}' +
      '.tpl-mini-title{display:flex;align-items:flex-start;gap:8px;min-width:0}' +
      '.tpl-mini-title .mi{width:18px;height:18px;color:#8A7E7C;display:inline-flex;align-items:center;justify-content:center;font-size:17px;line-height:1;flex:0 0 auto;margin-top:1px}' +
      '.tpl-mini-title strong{display:block;font-size:12.5px;font-weight:780;color:#2A211E;line-height:1.2}' +
      '.tpl-mini-title small{display:block;font-size:11px;color:#8A7E7C;line-height:1.32;margin-top:2px}' +
      '.tpl-identity-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.92fr);gap:14px;align-items:start}' +
      '.tpl-identity-stack{display:flex;flex-direction:column;gap:12px;min-width:0}' +
      '.tpl-identity-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}' +
      '.tpl-identity-fields .tpl-field-full{grid-column:1/-1}' +
      '.tpl-identity-layout{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(300px,.92fr);gap:18px;align-items:start}' +
      '.tpl-identity-workspace .tpl-identity-layout{display:block}' +
      '.tpl-identity-main{display:flex;flex-direction:column;gap:13px;min-width:0}' +
      '.tpl-identity-main-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px 14px;align-items:start}' +
      '.tpl-identity-main-grid .tpl-field-full{grid-column:1/-1}' +
      '.tpl-identity-workspace{grid-template-columns:minmax(0,1fr) minmax(300px,.46fr);gap:20px;align-items:start;overflow:visible}' +
      '.tpl-identity-workspace.active{display:grid !important}' +
      '.tpl-identity-left{display:flex;flex-direction:column;gap:14px;min-width:0}' +
      '.tpl-identity-assets{min-width:0;border-left:1px solid rgba(232,221,213,.78);padding-left:18px}' +
      '.tpl-identity-assets .tpl-image-grid-media{grid-template-columns:minmax(0,1fr) minmax(128px,150px);gap:12px;align-items:start}' +
      '.tpl-identity-assets .tpl-image-card{padding:12px !important}' +
      '.tpl-identity-assets .tpl-image-card--logo{border:0 !important;box-shadow:none !important;background:transparent !important}' +
      '.tpl-identity-assets .tpl-image-card--favicon{border:0 !important;box-shadow:none !important;background:transparent !important}' +
      '.tpl-identity-assets .tpl-image-preview--logo{min-height:154px !important;height:154px !important}' +
      '.tpl-identity-assets .tpl-image-preview--favicon{width:76px !important;height:76px !important;min-height:76px !important}' +
      '.tpl-identity-files .tpl-image-preview{border:0 !important;box-shadow:none !important;background:transparent !important}' +
      '.tpl-identity-help{display:block;font-size:10.5px;color:#8A7E7C;line-height:1.35;margin-top:5px}' +
      '.tpl-brand-preview{display:grid;grid-template-columns:58px minmax(0,1fr);gap:12px;align-items:center;padding:13px;border:1px solid #EADFD8;border-radius:16px;background:linear-gradient(145deg,#FFFFFF 0%,#FFFCF8 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.78)}' +
      '.tpl-brand-preview-logo{width:58px;height:58px;border-radius:16px;border:1px solid #E8DCD7;background:#FFFCF8;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#8A7E7C;flex:0 0 auto}' +
      '.tpl-brand-preview-logo img{width:100%;height:100%;object-fit:contain;display:block}' +
      '.tpl-brand-preview-name{font-size:15px;font-weight:800;color:#211815;line-height:1.18;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.tpl-brand-preview-text{font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.tpl-brand-preview-accent{width:48px;height:5px;border-radius:999px;margin-top:9px;background:#B42318}' +
      '.tpl-identity-files{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(180px,.75fr);gap:12px;align-items:stretch}' +
      '.tpl-identity-files .tpl-image-card{height:100%;min-height:0;justify-content:flex-start}' +
      '.tpl-identity-files .tpl-image-card--logo,.tpl-identity-files .tpl-image-card--favicon{padding:12px !important}' +
      '.tpl-identity-files .tpl-image-card--logo,.tpl-identity-files .tpl-image-card--favicon{border:0 !important;box-shadow:none !important;background:transparent !important}' +
      '.tpl-identity-files .tpl-image-preview--logo{min-height:136px !important;height:136px !important;padding:12px !important}' +
      '.tpl-identity-files .tpl-image-card--favicon{align-items:flex-start;justify-content:flex-start}' +
      '.tpl-identity-files .tpl-image-card--favicon .tpl-image-browser-tab{margin-top:0 !important;width:100%;height:42px;align-self:stretch}' +
      '.tpl-identity-files .tpl-image-preview--favicon{width:86px !important;height:86px !important;min-height:86px !important;padding:10px !important;align-self:center}' +
      '.tpl-identity-files .tpl-image-url{display:none !important}' +
      '.tpl-config-panel[data-template-panel="identidade"]{padding:18px 20px !important}' +
      '.tpl-identity-left .tpl-config-panel{padding:18px 20px !important}' +
      '.tpl-config-panel[data-template-panel="identidade"] [style*="padding:14px"][style*="border:1px solid #EAE4DA"]:not(.tpl-image-card){background:transparent !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;padding:0 0 15px !important;border-bottom:1px solid rgba(232,221,213,.78) !important}' +
      '.tpl-identity-left .tpl-config-panel [style*="padding:14px"][style*="border:1px solid #EAE4DA"]:not(.tpl-image-card){background:transparent !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;padding:0 0 15px !important;border-bottom:1px solid rgba(232,221,213,.78) !important}' +
      '.tpl-config-panel[data-template-panel="identidade"] [style*="padding:14px"][style*="border:1px solid #EAE4DA"]:not(.tpl-image-card):last-child{border-bottom:0 !important;padding-bottom:0 !important}' +
      '.tpl-identity-left .tpl-config-panel [style*="padding:14px"][style*="border:1px solid #EAE4DA"]:not(.tpl-image-card):last-child{border-bottom:0 !important;padding-bottom:0 !important}' +
      '.tpl-config-panel[data-template-panel="identidade"] .tpl-image-card{box-shadow:none !important;background:#FFFCF8 !important}' +
      '.tpl-identity-left .tpl-config-panel .tpl-image-card{box-shadow:none !important;background:#FFFCF8 !important}' +
      '.tpl-config-panel[data-template-panel="identidade"] .tpl-toggle{padding:8px 0 !important;background:transparent !important;border:0 !important;border-radius:0 !important;box-shadow:none !important}' +
      '.tpl-identity-left .tpl-config-panel .tpl-toggle{padding:8px 0 !important;background:transparent !important;border:0 !important;border-radius:0 !important;box-shadow:none !important}' +
      '.tpl-config-panel[data-template-panel="identidade"] .tpl-toggle + .tpl-toggle{border-top:1px solid rgba(232,221,213,.62) !important}' +
      '.tpl-identity-left .tpl-config-panel .tpl-toggle + .tpl-toggle{border-top:1px solid rgba(232,221,213,.62) !important}' +
      '.tpl-maincard-controls .tpl-toggle + .tpl-toggle{border-top:0 !important}' +
      '.tpl-maincard-layout{display:block}' +
      '.tpl-maincard-controls{min-width:0}' +
      '.tpl-maincard-columns{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:start}' +
      '.tpl-maincard-column{display:flex;flex-direction:column;gap:10px;min-width:0}' +
      '.tpl-maincard-column-title{font-size:10.5px;font-weight:800;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin:0 0 1px}' +
      '.tpl-maincard-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:start}' +
      '.tpl-maincard-row + .tpl-maincard-columns{margin-top:12px}' +
      '.tpl-maincard-preview-shell{position:relative !important;min-width:0;width:100%;border-left:0;padding-left:20px;align-self:stretch;z-index:8;background:transparent;overflow:visible}' +
      '.tpl-maincard-preview-label{font-size:10.5px;font-weight:800;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}' +
      '.tpl-maincard-preview-phone{position:relative;width:100%;max-height:calc(100vh - 56px);overflow:hidden;border:1px solid #E8DCD7;border-radius:26px;background:#FFFAF3;box-shadow:0 18px 46px rgba(72,48,38,.10);will-change:top,left,width}' +
      '.tpl-maincard-preview-hero{min-height:256px;padding:14px 14px 0;position:relative;background:linear-gradient(180deg,rgba(28,18,10,.20) 0%,rgba(28,18,10,.03) 54%,rgba(255,250,243,0) 100%),linear-gradient(135deg,#DAC4AF,#F7E8DB);background-position:center 22%;background-size:cover}' +
      '.tpl-maincard-preview-nav{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2}' +
      '.tpl-maincard-preview-nav-left,.tpl-maincard-preview-nav-side{display:flex;align-items:center;gap:9px}' +
      '.tpl-maincard-preview-pill,.tpl-maincard-preview-circle{background:rgba(255,255,255,.92);box-shadow:0 8px 18px rgba(33,27,24,.14);color:#211B18}' +
      '.tpl-maincard-preview-pill{height:34px;border-radius:999px;padding:4px 10px 4px 4px;display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:760}' +
      '.tpl-maincard-preview-avatar{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:#fff;background:var(--tpl-preview-brand,#B42318);font-size:9px;font-weight:820}' +
      '.tpl-maincard-preview-avatar svg{width:14px;height:14px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '.tpl-maincard-preview-circle{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:16px;font-weight:900}' +
      '.tpl-maincard-preview-card{margin:132px -14px 0;padding:0 16px 0;min-height:156px;background:#FFFAF3;border-radius:32px 32px 0 0;box-shadow:0 -18px 38px rgba(33,27,24,.10);position:relative;z-index:2}' +
      '.tpl-maincard-preview-head{display:grid;grid-template-columns:88px minmax(0,1fr);gap:12px;align-items:start}' +
      '.tpl-maincard-preview-logo{width:88px;height:88px;margin-top:-34px;border-radius:50%;background:#fff;border:6px solid #FFFAF3;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#8A7E7C;box-shadow:0 16px 28px rgba(33,27,24,.18)}' +
      '.tpl-maincard-preview-logo img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.tpl-maincard-preview-copy{min-width:0;padding-top:14px;padding-bottom:13px;position:relative}' +
      '.tpl-maincard-preview-copy::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;border-radius:999px;background:linear-gradient(90deg,rgba(33,27,24,.11),rgba(33,27,24,.035),rgba(33,27,24,0));box-shadow:0 8px 16px rgba(33,27,24,.045)}' +
      '.tpl-maincard-preview-name{margin:0;font-size:24px;font-weight:850;color:#211B18;line-height:.98;letter-spacing:-.035em;word-break:break-word}' +
      '.tpl-maincard-preview-slogan{margin:5px 0 0;max-width:228px;font-size:12px;font-weight:650;color:#6F665D;line-height:1.35;text-align:left;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.tpl-maincard-preview-facts{margin-top:8px;display:flex;align-items:center;gap:8px;color:#6C625B;font-size:11px;font-weight:720;white-space:nowrap;overflow:hidden}' +
      '.tpl-maincard-preview-star{color:#211B18;font-size:11px;line-height:1;margin-right:-4px}' +
      '.tpl-maincard-preview-facts b{color:#211B18}' +
      '.tpl-maincard-preview-dot{width:4px;height:4px;border-radius:50%;background:#B7AA9D;flex:0 0 auto}' +
      '.tpl-maincard-preview-more{margin-top:5px;display:inline-flex;align-items:center;gap:5px;color:#B42318;text-decoration:none;font-size:11px;font-weight:760}' +
      '.tpl-maincard-preview-chips{display:flex;align-items:center;gap:8px;margin-top:7px;color:#675E55;font-size:10.5px;font-weight:650;white-space:nowrap;overflow:hidden}' +
      '.tpl-maincard-preview-chip{display:inline-flex;align-items:center;min-width:0;color:inherit;font-size:inherit;font-weight:inherit;white-space:nowrap;letter-spacing:-.01em;background:transparent;padding:0;border-radius:0}' +
      '.tpl-maincard-preview-chip.open{color:#227554;font-weight:720}.tpl-maincard-preview-chip.closed{color:#9D2525;font-weight:720}' +
      '.tpl-maincard-preview-chip + .tpl-maincard-preview-chip::before{content:"";width:4px;height:4px;margin-right:8px;border-radius:50%;background:#B7AA9D;flex:0 0 auto}' +
      '@media(max-width:760px){.tpl-identity-workspace.active{display:block !important}.tpl-identity-left{gap:14px}.tpl-maincard-preview-shell{position:static !important;border-left:0;border-top:0;padding-left:0;padding-top:16px;margin-top:14px}.tpl-maincard-preview-phone{position:relative;top:auto}.tpl-maincard-columns,.tpl-maincard-row{grid-template-columns:1fr}}' +
      '.tpl-config-panel[data-template-panel="identidade"] .tpl-section-heading{margin-bottom:10px !important}' +
      '.tpl-identity-left .tpl-config-panel .tpl-section-heading{margin-bottom:10px !important}' +
      '.tpl-config-panel[data-template-panel="identidade"] [style*="display:flex;flex-direction:column;gap:12px;"]{gap:10px !important}' +
      '.tpl-identity-left .tpl-config-panel [style*="display:flex;flex-direction:column;gap:12px;"]{gap:10px !important}' +
      '@media(max-width:760px){.tpl-identity-grid,.tpl-identity-layout{grid-template-columns:1fr}.tpl-identity-fields,.tpl-identity-main-grid{grid-template-columns:1fr}.tpl-identity-assets{border-left:0;border-top:1px solid rgba(232,221,213,.78);padding-left:0;padding-top:16px}.tpl-identity-files{grid-template-columns:1fr}}' +
      '@media(max-width:760px){.tpl-config-head{align-items:flex-start}.tpl-config-save{width:100%}.tpl-subtabs{padding:8px}.tpl-config-panel{padding:14px !important}}' +
      '.tpl-image-url{width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:Manrope,Inter,sans-serif;outline:none;background:#fff;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);}';
    document.head.appendChild(style);
  }
  function _sectionTitle(title, desc, icon) {
    if (icon) {
      return '<div class="tpl-section-heading"><span class="mi">' + _esc(icon) + '</span><div><h3>' + _esc(title) + '</h3>' + (desc ? '<p>' + _esc(desc || '') + '</p>' : '') + '</div></div>';
    }
    return '<div style="margin-bottom:14px;"><h3 style="font-size:14px;font-weight:600;margin:0' + (desc ? ' 0 4px' : '') + ';color:#1F1F1F;">' + _esc(title) + '</h3>' + (desc ? '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">' + _esc(desc || '') + '</p>' : '') + '</div>';
  }
  function _templateMiniTitle(icon, title, desc) {
    return '<div class="tpl-mini-title"><span class="mi">' + _esc(icon || 'tune') + '</span><div><strong>' + _esc(title || '') + '</strong>' + (desc ? '<small>' + _esc(desc) + '</small>' : '') + '</div></div>';
  }

  function _templateSubtabsHtml(active) {
    var tabs = [
      { key: 'identidade', label: 'Identidade' },
      { key: 'vitrine', label: 'Vitrine' },
      { key: 'operacao', label: 'Operação' },
      { key: 'atendimento', label: 'Atendimento' },
      { key: 'checkout', label: 'Checkout' },
      { key: 'textos', label: 'Textos' }
    ];
    active = active || 'identidade';
    return '<div class="tpl-subtabs" data-template-subtabs="1">' + tabs.map(function (tab) {
      return '<button type="button" class="tpl-subtab' + (tab.key === active ? ' active' : '') + '" data-template-tab="' + tab.key + '" onclick="Modules.Catalogo._setTemplateTab(\'' + tab.key + '\')">' + _esc(tab.label) + '</button>';
    }).join('') + '</div>';
  }

  function _setTemplateTab(key) {
    key = key || 'identidade';
    _templateActiveTab = key;
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    [].slice.call(content.querySelectorAll('[data-template-tab]')).forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-template-tab') === key);
    });
    [].slice.call(content.querySelectorAll('[data-template-panel]')).forEach(function (panel) {
      panel.classList.toggle('active', panel.getAttribute('data-template-panel') === key);
    });
    _syncTemplatePreviewColumn();
  }
  function _syncTemplatePreviewColumn() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    var workspace = content.querySelector('.tpl-identity-workspace.active');
    var left = workspace && workspace.querySelector('.tpl-identity-left');
    var shell = workspace && workspace.querySelector('.tpl-maincard-preview-shell');
    var phone = shell && shell.querySelector('.tpl-maincard-preview-phone');
    if (!workspace || !left || !shell || !phone) return;
    if (window.innerWidth <= 760) {
      shell.style.minHeight = '';
      phone.style.position = '';
      phone.style.top = '';
      phone.style.left = '';
      phone.style.width = '';
      return;
    }
    var leftHeight = left.scrollHeight || left.offsetHeight || 0;
    shell.style.minHeight = leftHeight + 'px';
    phone.style.width = shell.clientWidth + 'px';
    var shellRect = shell.getBoundingClientRect();
    var viewportTop = 70;
    var phoneHeight = phone.offsetHeight || 0;
    var shellBottom = shellRect.top + leftHeight;
    if (shellRect.top >= viewportTop) {
      phone.style.position = 'relative';
      phone.style.top = '';
      phone.style.left = '';
      return;
    }
    if (shellBottom - phoneHeight <= viewportTop) {
      phone.style.position = 'absolute';
      phone.style.top = Math.max(0, leftHeight - phoneHeight) + 'px';
      phone.style.left = '20px';
      return;
    }
    phone.style.position = 'fixed';
    phone.style.top = viewportTop + 'px';
    phone.style.left = shellRect.left + 'px';
  }
  function _templatePanelAttrs(key) {
    return 'data-template-panel="' + key + '" class="tpl-config-panel' + (((_templateActiveTab || 'identidade') === key) ? ' active' : '') + '"';
  }

  function _fieldHtml(id, label, value, placeholder, type) {
    return '<label style="display:block;"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '" placeholder="' + _esc(placeholder || '') + '" style="' + _inputStyle() + '"></label>';
  }
  function _operationCardStyle(extra) {
    return 'background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:15px;box-shadow:0 12px 30px rgba(31,31,31,.055);display:flex;flex-direction:column;gap:13px;' + (extra || '');
  }
  function _operationFieldStyle(extra) {
    return 'width:100%;min-height:42px;padding:10px 12px;border:1px solid #E8DCD7;border-radius:12px;font-size:14px;font-family:Manrope,Inter,sans-serif;outline:none;background:#FFFCF8;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.82);' + (extra || '');
  }
  function _operationCardHead(icon, title, text) {
    return '<div style="display:flex;align-items:flex-start;min-width:0;">' +
      '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">' + _esc(title || '') + '</div>' +
      (text ? '<div style="font-size:12px;font-weight:400;color:#6F6860;line-height:1.42;margin-top:3px;">' + _esc(text) + '</div>' : '') +
      '</div>' +
    '</div>';
  }
  function _operationFieldHtml(id, label, value, placeholder, type, extraStyle, note, attrs, wrapStyle) {
    return '<label style="display:block;min-width:0;' + (wrapStyle || '') + '"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '" placeholder="' + _esc(placeholder || '') + '" ' + (attrs || '') + ' style="' + _operationFieldStyle(extraStyle || '') + '">' + (note ? '<small style="display:block;margin-top:6px;font-size:11px;font-weight:400;line-height:1.35;color:#8A7E7C;">' + _esc(note) + '</small>' : '') + '</label>';
  }
  function _operationMoneyFieldHtml(id, label, value, note, wrapStyle) {
    return '<label style="display:block;min-width:0;' + (wrapStyle || '') + '"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><input id="' + id + '" type="text" inputmode="decimal" value="' + _esc(_moneyDisplay(value || '')) + '" placeholder="€0,00" onfocus="Modules.Catalogo._moneyInputFocus(this)" onblur="Modules.Catalogo._moneyInputBlur(this);Modules.Catalogo._refreshTemplatePreview()" style="' + _operationFieldStyle('text-align:right;') + '">' + (note ? '<small style="display:block;margin-top:6px;font-size:11px;font-weight:400;line-height:1.35;color:#8A7E7C;">' + _esc(note) + '</small>' : '') + '</label>';
  }
  function _operationSelectHtml(id, label, value, options, note, wrapStyle) {
    return '<label style="display:block;min-width:0;' + (wrapStyle || '') + '"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><span style="position:relative;display:block;"><select id="' + id + '" style="' + _operationFieldStyle('appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:40px;') + '">' + options.map(function (o) {
      return '<option value="' + _esc(o.value) + '"' + (String(value || '') === String(o.value) ? ' selected' : '') + '>' + _esc(o.label) + '</option>';
    }).join('') + '</select><span class="mi" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:19px;color:#8A7E7C;pointer-events:none;">expand_more</span></span>' + (note ? '<small style="display:block;margin-top:6px;font-size:11px;font-weight:400;line-height:1.35;color:#8A7E7C;">' + _esc(note) + '</small>' : '') + '</label>';
  }
  function _operationCheckHtml(id, label, checked, hint) {
    return '<label style="display:flex;gap:9px;align-items:flex-start;padding:2px 0;cursor:pointer;"><input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + ' style="width:17px;height:17px;accent-color:#B42318;margin-top:1px;flex:0 0 auto;"><span style="min-width:0;"><strong style="font-size:13px;font-weight:500;color:#1F1F1F;line-height:1.25;">' + _esc(label) + '</strong>' + (hint ? '<small style="display:block;color:#6F6860;font-size:11px;font-weight:400;margin-top:3px;line-height:1.35;">' + _esc(hint) + '</small>' : '') + '</span></label>';
  }
  function _operationGrid(html, min) {
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,' + (min || '180px') + '),1fr));gap:12px;align-items:start;">' + html + '</div>';
  }
  function _colorFieldHtml(id, label, value, previewLabel) {
    var color = _normalizeHexColor(value) || '#B42318';
    return '<label class="tpl-color-field"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><div class="tpl-color-row"><span class="tpl-color-swatch" data-color-swatch-for="' + _esc(id) + '" style="background:' + _esc(color) + ';"><input id="' + id + '" type="color" value="' + _esc(color) + '" title="' + _esc(previewLabel || label) + '"></span><input id="' + id + '-hex" type="text" value="' + _esc(color) + '" placeholder="#B42318" maxlength="7" style="' + _inputStyle() + 'text-transform:uppercase;"></div></label>';
  }
  function _toggleHtml(id, label, checked, hint) {
    var hoursChange = String(id || '').indexOf('tpl-h-') === 0 ? ' onchange="Modules.Catalogo._onTemplateHoursChange()"' : '';
    return '<label class="tpl-toggle"><span class="tpl-toggle-control"><input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + hoursChange + '><span class="tpl-toggle-track"></span><span class="tpl-toggle-thumb"></span></span><span><span class="tpl-toggle-title">' + _esc(label) + '</span>' + (hint ? '<span class="tpl-toggle-hint">' + _esc(hint) + '</span>' : '') + '</span></label>';
  }
  function _premiumSwitchHtml(id, label, checked, hint) {
    return '<label class="tpl-premium-switch"><input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + '><span class="tpl-premium-switch-copy"><span class="tpl-premium-switch-title">' + _esc(label) + '</span><span class="tpl-premium-switch-state"></span>' + (hint ? '<span class="tpl-toggle-hint">' + _esc(hint) + '</span>' : '') + '</span><span class="tpl-premium-switch-control"></span></label>';
  }
  function _plainSwitchHtml(id, label, checked, hint) {
    return '<label class="tpl-premium-switch tpl-premium-switch--plain"><input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + '><span class="tpl-premium-switch-copy"><span class="tpl-premium-switch-title">' + _esc(label) + '</span><span class="tpl-premium-switch-state"></span>' + (hint ? '<span class="tpl-toggle-hint">' + _esc(hint) + '</span>' : '') + '</span><span class="tpl-premium-switch-control"></span></label>';
  }
  function _imageConfigHtml(kind, opts) {
    var fileId = opts.fileId;
    var urlId = opts.urlId;
    var previewId = opts.previewId;
    var placeholderId = opts.placeholderId;
    var currentUrl = _cleanPublicUrl(opts.value || '');
    var placeholder = opts.placeholder || 'Sem imagem';
    var accept = opts.accept || 'image/jpeg,image/jpg,image/png,image/webp';
    var cardClass = opts.cardClass ? ' ' + opts.cardClass : '';
    var previewClass = opts.previewClass ? ' ' + opts.previewClass : '';
    var fitClass = opts.fit === 'contain' ? ' tpl-image-preview--contain' : '';
    var extraHtml = opts.extraHtml || '';
    var urlInputType = opts.hideUrl ? 'hidden' : 'text';
    var urlInputStyle = opts.hideUrl ? 'display:none;' : 'margin-top:2px;';
    var previewHtml = opts.hidePreview ? '' : '<div class="tpl-image-preview' + previewClass + fitClass + '"><img id="' + previewId + '" src="' + _esc(currentUrl) + '" style="display:' + (currentUrl ? 'block' : 'none') + ';"><span class="tpl-image-overlay" id="' + previewId + '-overlay" style="position:absolute;inset:0;display:' + (currentUrl ? 'block' : 'none') + ';background:rgba(0,0,0,.08);pointer-events:none;"></span><span id="' + placeholderId + '" style="position:absolute;font-size:11px;color:#6F6860;' + (currentUrl ? 'display:none;' : '') + '">' + _esc(placeholder) + '</span></div>';
    return '<div class="tpl-image-card' + cardClass + '">' +
      '<div style="display:flex;flex-direction:column;gap:6px;">' +
        '<span style="' + _labelStyle() + '">' + _esc(opts.label || '') + '</span>' +
        '<div class="tpl-image-actions">' +
          '<button type="button" class="tpl-image-btn primary" onclick="document.getElementById(\'' + fileId + '\').click()">Enviar imagem</button>' +
          '<button type="button" class="tpl-image-btn ghost" onclick="Modules.Catalogo._clearStoreImage(\'' + kind + '\')">Remover imagem</button>' +
        '</div>' +
        '<input id="' + fileId + '" type="file" accept="' + _esc(accept) + '" onchange="Modules.Catalogo._uploadStoreImage(event,\'' + kind + '\')" style="display:none;">' +
        '<input id="' + urlId + '" type="' + urlInputType + '" value="' + _esc(currentUrl) + '" placeholder="https://..." class="tpl-image-url" style="' + urlInputStyle + '">' +
        '<div class="tpl-image-note">' + _esc(opts.note || '') + '</div>' +
      '</div>' +
      previewHtml +
      extraHtml +
    '</div>';
  }
  function _opacityFieldHtml(id, label, value) {
    var n = Number(value);
    if (!isFinite(n)) n = 14;
    n = Math.max(0, Math.min(100, n));
    return '<div class="tpl-opacity-field"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><div class="tpl-opacity-row"><input id="' + id + '-range" class="tpl-opacity-range" type="range" min="0" max="100" step="1" value="' + _esc(String(n)) + '"><input id="' + id + '" class="tpl-opacity-number" type="number" min="0" max="100" step="1" value="' + _esc(String(n)) + '" style="' + _inputStyle() + 'text-align:right;"></div><div class="tpl-opacity-readout"><span>Prévia aplicada na capa</span><strong class="tpl-opacity-chip tpl-opacity-value">' + _esc(n + '%') + '</strong></div></div>';
  }
  function _percentFieldValue(value, fallback) {
    var n = Number(value);
    if (isFinite(n)) return String(n);
    var f = Number(fallback);
    if (isFinite(f)) return String(f);
    return '14';
  }
  function _textareaHtml(id, label, value, placeholder, rows) {
    return '<label style="display:block;"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><textarea id="' + id + '" rows="' + (rows || 3) + '" placeholder="' + _esc(placeholder || '') + '" style="' + _inputStyle() + 'min-height:' + ((rows || 3) * 28) + 'px;resize:vertical;">' + _esc(value == null ? '' : value) + '</textarea></label>';
  }
  function _selectHtml(id, label, value, options) {
    return '<label style="display:block;"><span style="' + _labelStyle() + '">' + _esc(label) + '</span><select id="' + id + '" style="' + _inputStyle() + '">' + options.map(function (o) {
      return '<option value="' + _esc(o.value) + '"' + (String(value || '') === String(o.value) ? ' selected' : '') + '>' + _esc(o.label) + '</option>';
    }).join('') + '</select></label>';
  }
  function _templateCountryOptions() {
    return [
      { value: '', label: 'Selecionar país' },
      { value: 'ES', label: 'Espanha (ES)' },
      { value: 'PT', label: 'Portugal (PT)' },
      { value: 'BR', label: 'Brasil (BR)' },
      { value: 'FR', label: 'França (FR)' },
      { value: 'IT', label: 'Itália (IT)' },
      { value: 'DE', label: 'Alemanha (DE)' },
      { value: 'GB', label: 'Reino Unido (GB)' },
      { value: 'US', label: 'Estados Unidos (US)' },
      { value: 'OTHER', label: 'Outro' }
    ];
  }
  function _featuredProductOptionsHtml(query, selectedId) {
    var q = String(query || '').trim().toLowerCase();
    var selected = String(selectedId || '').trim();
    var all = (_products || []).filter(function (p) { return p && p.menuVisible !== false; });
    var filtered = all.filter(function (p) {
      if (!q) return true;
      var tagText = (p.tags || []).map(function (tag) { return tag.text || tag.name || ''; }).join(' ');
      var haystack = [
        p.name,
        p.title,
        p.shortDesc,
        p.description,
        p.fullDesc,
        p.microcopy,
        tagText
      ].join(' ').toLowerCase();
      return haystack.indexOf(q) >= 0;
    });
    if (selected) {
      var selectedProduct = all.find(function (p) { return String(p.id) === selected; });
      if (selectedProduct && filtered.findIndex(function (p) { return String(p.id) === selected; }) < 0) {
        filtered.unshift(selectedProduct);
      }
    }
    var options = ['<option value="">Selecionar produto</option>'];
    if (!filtered.length) {
      options.push('<option value="" disabled>Nenhum produto encontrado</option>');
    } else {
      options = options.concat(filtered.map(function (p) {
        return '<option value="' + _esc(p.id) + '"' + (String(selected) === String(p.id) ? ' selected' : '') + '>' + _esc(p.name || p.title || String(p.id)) + '</option>';
      }));
    }
    return options.join('');
  }
  function _activeProductOptions() {
    return (_products || []).filter(function (p) { return p && p.menuVisible !== false; });
  }
  function _productPickerValue(p) {
    return p.name || p.title || String(p.id || '');
  }
  function _productSearchValue(p) {
    return p.name || p.title || '';
  }
  function _sortedActiveProducts() {
    return _activeProductOptions().slice().sort(function (a, b) {
      return String(_productSearchValue(a) || '').localeCompare(String(_productSearchValue(b) || ''), undefined, { sensitivity: 'base' });
    });
  }
  function _productByPickerText(text) {
    var value = String(text || '').trim().toLowerCase();
    if (!value) return null;
    return _activeProductOptions().find(function (p) {
      return String(_productPickerValue(p)).toLowerCase() === value;
    }) || null;
  }
  function _featuredComboboxHtml(opts) {
    var disabled = !!opts.disabled;
    return '<label class="tpl-featured-combo"><span style="' + _labelStyle() + '">' + _esc(opts.label || '') + '</span>' +
      '<input id="' + _esc(opts.inputId) + '" type="text" value="' + _esc(opts.displayValue || '') + '" placeholder="' + _esc(opts.placeholder || '') + '" autocomplete="off"' + (disabled ? ' disabled' : '') + ' data-featured-combo="' + _esc(opts.kind || '') + '" style="' + _inputStyle() + '">' +
      '<input id="' + _esc(opts.hiddenId) + '" type="hidden" value="' + _esc(opts.hiddenValue || '') + '">' +
      '<div id="' + _esc(opts.dropdownId) + '" class="tpl-featured-combo-menu"></div>' +
    '</label>';
  }
  function _showcaseProductPickerHtml(index, selectedId) {
    var selected = String(selectedId || '').trim();
    var products = _sortedActiveProducts();
    var selectedProduct = products.find(function (p) { return String(p.id || '') === selected; });
    var inputId = 'tpl-showcase-product-picker-' + index;
    var hiddenId = 'tpl-showcase-product-' + index;
    var dropdownId = 'tpl-showcase-product-dropdown-' + index;
    if (!products.length) {
      return _featuredComboboxHtml({ kind: 'showcaseProduct', inputId: inputId, hiddenId: hiddenId, dropdownId: dropdownId, label: 'Produto destacado ' + index, placeholder: 'Nenhum produto disponível', disabled: true });
    }
    return _featuredComboboxHtml({
      kind: 'showcaseProduct',
      inputId: inputId,
      hiddenId: hiddenId,
      dropdownId: dropdownId,
      label: 'Produto destacado ' + index,
      displayValue: selectedProduct ? _productPickerValue(selectedProduct) : '',
      hiddenValue: selectedProduct ? String(selectedProduct.id || '') : '',
      placeholder: 'Digite o nome do produto...'
    });
  }
  function _templateCategoryVisualsHtml() {
    var cats = (_categories || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    if (!cats.length) {
      return '<div style="text-align:center;padding:28px 16px;color:#8A7E7C;font-size:13px;line-height:1.45;border:1px dashed #EAE4DA;border-radius:14px;background:#fff;">Crie categorias em Cardápio > Configurações para liberar os elementos gráficos do menu.</div>';
    }
    return '<div style="display:flex;flex-direction:column;gap:10px;">' + cats.map(function (c) {
      var id = String(c.id || '');
      var icon = c.icon || c.emoji || c.symbol || '';
      var graphic = _cleanPublicUrl(c.graphicUrl || c.imageUrl || c.iconUrl || c.categoryGraphicUrl || '');
      return '<div data-template-category-visual="' + _esc(id) + '" style="display:grid;grid-template-columns:minmax(150px,.8fr) minmax(200px,1fr) 112px;gap:10px;align-items:center;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
        '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(c.name || c.label || 'Categoria') + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">Imagem opcional no menu mobile</div></div>' +
        '<div style="display:grid;grid-template-columns:72px minmax(0,1fr);gap:8px;align-items:end;">' +
          '<label><span style="' + _labelStyle() + '">Emoji</span><input id="tpl-cat-icon-' + _esc(id) + '" value="' + _esc(icon) + '" placeholder="🍔" style="' + _inputStyle() + '"></label>' +
          '<label><span style="' + _labelStyle() + '">Imagem</span><input id="tpl-cat-graphic-' + _esc(id) + '" value="' + _esc(graphic) + '" placeholder="https://..." style="' + _inputStyle() + '"></label>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;">' +
          '<div id="tpl-cat-graphic-preview-' + _esc(id) + '" style="width:48px;height:48px;border-radius:15px;background:#FAF8F4;border:1px solid #EAE4DA;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:18px;color:#6F6860;">' + (graphic ? '<img src="' + _esc(graphic) + '" style="width:100%;height:100%;object-fit:cover;">' : _esc(icon || 'Aa')) + '</div>' +
          '<button type="button" class="tpl-image-btn primary" style="height:34px;padding:0 10px;" onclick="document.getElementById(\'tpl-cat-file-' + _esc(id) + '\').click()">Enviar</button>' +
          '<input id="tpl-cat-file-' + _esc(id) + '" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Catalogo._uploadTemplateCategoryGraphic(event,\'' + _esc(id) + '\')" style="display:none;">' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }
  function _productPickerHtml(selectedId) {
    var selected = String(selectedId || '').trim();
    var products = _activeProductOptions();
    var selectedProduct = products.find(function (p) { return String(p.id || '') === selected; });
    if (!products.length) {
      return _featuredComboboxHtml({ kind: 'product', inputId: 'tpl-featured-product-picker', hiddenId: 'tpl-featured-product', dropdownId: 'tpl-featured-product-dropdown', label: 'Selecionar produto', placeholder: 'Nenhum produto disponível', disabled: true });
    }
    return _featuredComboboxHtml({ kind: 'product', inputId: 'tpl-featured-product-picker', hiddenId: 'tpl-featured-product', dropdownId: 'tpl-featured-product-dropdown', label: 'Selecionar produto', displayValue: selectedProduct ? _productPickerValue(selectedProduct) : '', hiddenValue: selectedProduct ? String(selectedProduct.id || '') : '', placeholder: 'Digite o nome do produto...' });
  }
  function _validOrderForProductHistory(order) {
    var status = String(order && order.status || '').toLowerCase();
    return !/cancel|cancelad|recha|refus/.test(status);
  }
  function _orderProductItems(order) {
    return Array.isArray(order && order.items) ? order.items : (Array.isArray(order && order.products) ? order.products : (Array.isArray(order && order.cart) ? order.cart : []));
  }
  function _orderItemProductId(item) {
    return String(item && (item.productId || item.id || item.product_id || item.ref || '') || '').trim();
  }
  function _orderItemQty(item) {
    var qty = Number(item && (item.qty || item.quantity || item.qtd || item.count || 1));
    return isFinite(qty) && qty > 0 ? qty : 1;
  }
  function _mostOrderedProductFromOrders() {
    var allowed = {};
    _activeProductOptions().forEach(function (p) { allowed[String(p.id)] = p; });
    var counts = {};
    (_orders || []).filter(_validOrderForProductHistory).forEach(function (order) {
      _orderProductItems(order).forEach(function (item) {
        var id = _orderItemProductId(item);
        if (!id || !allowed[id]) return;
        counts[id] = (counts[id] || 0) + _orderItemQty(item);
      });
    });
    var bestId = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    })[0] || '';
    return bestId ? { product: allowed[bestId], qty: counts[bestId] || 0 } : null;
  }
  function _mostOrderedModeHtml(value) {
    return _selectHtml('tpl-most-ordered-mode', 'Modo de origem', value || 'auto', [
      { value: 'auto', label: 'Automático pelo histórico de vendas' },
      { value: 'manual', label: 'Seleção manual/personalizada' }
    ]);
  }
  function _mostOrderedManualPickerHtml(selectedId) {
    var selected = String(selectedId || '').trim();
    var products = _activeProductOptions();
    var selectedProduct = products.find(function (p) { return String(p.id || '') === selected; });
    if (!products.length) {
      return _featuredComboboxHtml({ kind: 'mostOrderedProduct', inputId: 'tpl-most-ordered-product-picker', hiddenId: 'tpl-featured-most-ordered-product', dropdownId: 'tpl-most-ordered-product-dropdown', label: 'Selecionar produto', placeholder: 'Nenhum produto disponível', disabled: true });
    }
    return _featuredComboboxHtml({ kind: 'mostOrderedProduct', inputId: 'tpl-most-ordered-product-picker', hiddenId: 'tpl-featured-most-ordered-product', dropdownId: 'tpl-most-ordered-product-dropdown', label: 'Selecionar produto', displayValue: selectedProduct ? _productPickerValue(selectedProduct) : '', hiddenValue: selectedProduct ? String(selectedProduct.id || '') : '', placeholder: 'Digite o nome do produto...' });
  }
  function _isTemplateMarketingActive(item) {
    if (!item || item.active === false) return false;
    if (item.active == null && item.enabled === false) return false;
    var status = String(item.status || item.state || '').trim().toLowerCase();
    if (['pausada', 'pausado', 'paused', 'inativa', 'inativo', 'inactive', 'finalizada', 'finalizado', 'expired', 'expirada', 'expirado', 'cancelada', 'cancelado', 'canceled'].indexOf(status) >= 0) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var start = item.startDate || item.startsAt || item.validFrom || item.dataInicio || item.inicio || '';
    var end = item.endDate || item.endsAt || item.expiry || item.validUntil || item.dataFim || item.fim || '';
    if (start) {
      var sd = new Date(start);
      if (!isNaN(sd.getTime()) && sd > today) return false;
    }
    if (end) {
      var ed = new Date(end);
      ed.setHours(23, 59, 59, 999);
      if (!isNaN(ed.getTime()) && ed < new Date()) return false;
    }
    if (item.maxUses && item.usesCount >= item.maxUses) return false;
    return true;
  }
  function _templateMarketingId(item) {
    return String(item && (item.id || item._id || item.promoId || item.promotionId || item.code || item.slug || '') || '').trim();
  }
  function _normalizeTemplatePromotionType(type) {
    var t = String(type || '').trim().toLowerCase();
    if (t === 'percentual' || t === 'percentage' || t === 'percent' || t === 'desconto_percentual') return 'pct';
    if (t === 'valor_fixo' || t === 'fixed' || t === 'fixed_amount' || t === 'desconto_valor') return 'eur';
    if (t === 'b2x1' || t === 'pack' || t === 'leve_2_pague_1') return '2x1';
    if (t === 'extra_combo' || t === 'upgrade' || t === 'leve_pague' || t === 'leve_mais') return 'add1';
    if (t === 'gratis_entrega' || t === 'frete_gratis') return 'free_shipping';
    return t || 'pct';
  }
  function _normalizeTemplatePromotion(promo, idx) {
    if (!promo) return promo;
    var id = _templateMarketingId(promo) || ('promotion-' + idx);
    var rawStatus = String(promo.status || promo.state || '').trim().toLowerCase();
    var active = promo.active;
    if (active == null && promo.enabled != null) active = promo.enabled;
    if (typeof active === 'string') active = !['false', '0', 'no', 'nao', 'não', 'inactive', 'inativo', 'inativa'].includes(active.trim().toLowerCase());
    if (active == null && rawStatus) {
      active = ['pausada', 'pausado', 'paused', 'inativa', 'inativo', 'inactive', 'finalizada', 'finalizado', 'expired', 'expirada', 'expirado', 'cancelada', 'cancelado', 'canceled'].indexOf(rawStatus) < 0;
    }
    if (active == null) active = true;
    var productIds = [];
    ['productIds', 'selectedProductIds', 'products', 'items'].forEach(function (key) {
      if (Array.isArray(promo[key])) {
        promo[key].forEach(function (item) {
          productIds.push(typeof item === 'object' ? (item.id || item.productId || item.produtoId || item.ref) : item);
        });
      }
    });
    if (promo.productId) productIds.push(promo.productId);
    if (promo.produtoId) productIds.push(promo.produtoId);
    productIds = productIds.map(String).filter(Boolean).filter(function (value, pos, arr) { return arr.indexOf(value) === pos; });
    return Object.assign({}, promo, {
      id: id,
      name: promo.name || promo.title || promo.nome || promo.label || promo.description || ('Promoção ' + (idx + 1)),
      type: _normalizeTemplatePromotionType(promo.type || promo.tipo || promo.discountType),
      active: active !== false,
      enabled: active !== false,
      startDate: promo.startDate || promo.startsAt || promo.validFrom || promo.dataInicio || promo.inicio || '',
      endDate: promo.endDate || promo.endsAt || promo.expiry || promo.validUntil || promo.dataFim || promo.fim || '',
      applyTo: promo.applyTo || (promo.scope === 'produtos_selecionados' || promo.scope === 'selected_products' || productIds.length ? 'selected' : 'all'),
      scope: promo.scope || (productIds.length ? 'produtos_selecionados' : 'todos_produtos'),
      productIds: productIds
    });
  }
  function _deriveTemplatePromotionFromProduct(product, idx) {
    if (!product || !product.promo || typeof product.promo !== 'object') return null;
    var promo = _normalizeTemplatePromotion(product.promo, idx);
    if (!promo) return null;
    var productId = String(product.id || product.productId || product._id || idx || '');
    promo.id = _templateMarketingId(promo) || ('product_' + productId);
    promo.applyTo = promo.applyTo || 'selected';
    promo.scope = promo.scope || 'produtos_selecionados';
    promo.productIds = (promo.productIds || []).concat([productId]).map(String).filter(Boolean).filter(function (value, pos, arr) { return arr.indexOf(value) === pos; });
    promo.productId = promo.productId || productId;
    promo.productName = promo.productName || product.name || product.title || product.nome || '';
    promo.active = promo.active !== false;
    promo.enabled = promo.active;
    return promo;
  }
  function _mergeTemplatePromotions(groups) {
    var out = [];
    var seen = {};
    (groups || []).forEach(function (group) {
      (group || []).forEach(function (promo) {
        var normalized = _normalizeTemplatePromotion(promo, out.length);
        if (!normalized) return;
        var id = _templateMarketingId(normalized);
        var key = id || [
          normalized.name || normalized.title || '',
          normalized.type || '',
          normalized.startDate || '',
          normalized.endDate || '',
          normalized.valuePercentual != null ? normalized.valuePercentual : '',
          normalized.valueDesconto != null ? normalized.valueDesconto : ''
        ].join('|');
        if (seen[key]) {
          var existing = seen[key];
          existing.productIds = (existing.productIds || []).concat(normalized.productIds || []).map(String).filter(Boolean).filter(function (value, pos, arr) { return arr.indexOf(value) === pos; });
          if (normalized.active !== false) {
            existing.active = true;
            existing.enabled = true;
          }
          if (!existing.name && normalized.name) existing.name = normalized.name;
          if (!existing.title && normalized.title) existing.title = normalized.title;
          if (!existing.description && normalized.description) existing.description = normalized.description;
          if (!existing.productId && normalized.productId) existing.productId = normalized.productId;
          if (!existing.productName && normalized.productName) existing.productName = normalized.productName;
          return;
        }
        seen[key] = normalized;
        out.push(normalized);
      });
    });
    return out;
  }
  function _featuredMarketingOptionsHtml(list, query, selectedId, emptyLabel, labelFn) {
    var q = String(query || '').trim().toLowerCase();
    var selected = String(selectedId || '').trim();
    var all = (list || []).filter(_isTemplateMarketingActive);
    var filtered = all.filter(function (item) {
      if (!q) return true;
      return [
        item.code,
        item.name,
        item.title,
        item.description,
        item.text,
        item.customerMessage,
        item.type
      ].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (selected) {
      var selectedItem = all.find(function (item) { return String(item.id || item.code || '') === selected; });
      if (selectedItem && filtered.findIndex(function (item) { return String(item.id || item.code || '') === selected; }) < 0) filtered.unshift(selectedItem);
    }
    var options = ['<option value="">' + _esc(emptyLabel) + '</option>'];
    if (!filtered.length) {
      options.push('<option value="" disabled>Nenhum item ativo encontrado</option>');
    } else {
      options = options.concat(filtered.map(function (item) {
        var value = String(item.id || item.code || '');
        return '<option value="' + _esc(value) + '"' + (selected === value ? ' selected' : '') + '>' + _esc(labelFn(item)) + '</option>';
      }));
    }
    return options.join('');
  }
  function _couponLabel(c) {
    var value = c.type === 'pct' ? (c.value || 0) + '%' : (c.type === 'eur' ? '€' + (c.value || 0) : '');
    return [c.code || c.name || c.title || c.id, value].filter(Boolean).join(' · ');
  }
  function _activeCouponOptions() {
    return (_coupons || []).filter(_isTemplateMarketingActive);
  }
  function _couponSearchText(c) {
    return [c && c.code, c && c.name, c && c.title].filter(Boolean).join(' ').toLowerCase();
  }
  function _couponPickerValue(c) {
    var value = c.type === 'pct' ? (c.value || 0) + '%' : (c.type === 'eur' ? '€' + (c.value || 0) : '');
    return [c.code, c.name, c.title, value].filter(Boolean).join(' · ');
  }
  function _couponByPickerText(text) {
    var value = String(text || '').trim().toLowerCase();
    if (!value) return null;
    return _activeCouponOptions().find(function (c) {
      return String(_couponPickerValue(c)).toLowerCase() === value ||
        String(c.code || '').toLowerCase() === value ||
        String(c.name || '').toLowerCase() === value ||
        String(c.title || '').toLowerCase() === value;
    }) || null;
  }
  function _couponPickerHtml(selectedId) {
    var selected = String(selectedId || '').trim();
    var coupons = _activeCouponOptions();
    var selectedCoupon = coupons.find(function (c) { return String(c.id || c.code || '') === selected; });
    if (!coupons.length) {
      return _featuredComboboxHtml({ kind: 'coupon', inputId: 'tpl-featured-coupon-picker', hiddenId: 'tpl-featured-coupon', dropdownId: 'tpl-featured-coupon-dropdown', label: 'Selecionar cupom', placeholder: 'Nenhum cupom ativo disponível', disabled: true });
    }
    return _featuredComboboxHtml({ kind: 'coupon', inputId: 'tpl-featured-coupon-picker', hiddenId: 'tpl-featured-coupon', dropdownId: 'tpl-featured-coupon-dropdown', label: 'Selecionar cupom', displayValue: selectedCoupon ? _couponPickerValue(selectedCoupon) : '', hiddenValue: selectedCoupon ? String(selectedCoupon.id || selectedCoupon.code || '') : '', placeholder: 'Digite código, nome ou título...' });
  }
  function _promotionLabel(p) {
    return p.name || p.title || p.description || p.id || 'Promoção ativa';
  }
  function _activePromotionOptions() {
    return (_promotions || []).filter(_isTemplateMarketingActive);
  }
  function _promotionPickerOptions() {
    var active = _activePromotionOptions();
    return active.length ? active : (_promotions || []);
  }
  function _promotionTypeLabel(type) {
    var t = String(type || '').toLowerCase();
    if (t === 'pct') return 'Desconto (%)';
    if (t === 'eur') return 'Desconto (€)';
    if (t === '2x1' || t === 'b2x1') return '2 por 1';
    if (t === 'add1' || t === 'leve_pague') return 'Leve mais';
    if (t === 'frete' || t === 'free_shipping') return 'Frete grátis';
    return type || '';
  }
  function _promotionBenefitText(p) {
    var type = String(p && p.type || '').toLowerCase();
    if (type === 'pct' && Number(p.valuePercentual != null ? p.valuePercentual : p.value) > 0) return String(p.valuePercentual != null ? p.valuePercentual : p.value) + '%';
    if (type === 'eur' && Number(p.valueDesconto != null ? p.valueDesconto : p.value) > 0) return '€' + String(p.valueDesconto != null ? p.valueDesconto : p.value);
    if ((type === 'add1' || type === 'leve_pague') && p.leveQtd && p.pagueQtd) return 'Leve ' + p.leveQtd + ' pague ' + p.pagueQtd;
    if (type === '2x1' || type === 'b2x1') return '2 por 1';
    if (type === 'frete' || type === 'free_shipping') return p.minOrder ? 'A partir de €' + p.minOrder : 'Frete grátis';
    return p.benefit || p.benefitText || p.customerMessage || '';
  }
  function _promotionPickerValue(p) {
    var desc = p.description || p.shortDescription || p.text || p.customerMessage || p.benefit || p.benefitText || '';
    return [p.name || p.title || _templateMarketingId(p), _promotionTypeLabel(p.type), _promotionBenefitText(p), desc].filter(Boolean).join(' · ');
  }
  function _promotionByPickerText(text) {
    var value = String(text || '').trim().toLowerCase();
    if (!value) return null;
    return _activePromotionOptions().find(function (p) {
      return String(_promotionPickerValue(p)).toLowerCase() === value ||
        String(p.name || '').toLowerCase() === value ||
        String(p.title || '').toLowerCase() === value;
    }) || null;
  }
  function _promotionProductOptionItems() {
    var seen = {};
    var items = [];
    _activePromotionOptions().forEach(function (promo) {
      _activeProductOptions().forEach(function (product) {
        if (!_promoAppliesToProduct(promo, product)) return;
        var id = String(product.id || '');
        if (!id || seen[id]) return;
        seen[id] = true;
        items.push({
          product: product,
          promotion: promo,
          label: _productPickerValue(product),
          sub: 'Vinculado a ' + _promotionLabel(promo)
        });
      });
    });
    return items.sort(function (a, b) {
      return String(a.label || '').localeCompare(String(b.label || ''), undefined, { sensitivity: 'base' });
    });
  }
  function _mobilePromoProductPickerHtml(selectedId) {
    var selected = String(selectedId || '').trim();
    var items = _promotionProductOptionItems();
    var selectedItem = items.find(function (item) { return String(item.product && item.product.id || '') === selected; });
    if (!items.length) {
      return _featuredComboboxHtml({ kind: 'mobilePromoProduct', inputId: 'tpl-mobile-promo-banner-product-picker', hiddenId: 'tpl-mobile-promo-banner-product', dropdownId: 'tpl-mobile-promo-banner-product-dropdown', label: 'Produto da promoção', placeholder: 'Nenhum produto vinculado a promoção', disabled: true });
    }
    return _featuredComboboxHtml({
      kind: 'mobilePromoProduct',
      inputId: 'tpl-mobile-promo-banner-product-picker',
      hiddenId: 'tpl-mobile-promo-banner-product',
      dropdownId: 'tpl-mobile-promo-banner-product-dropdown',
      label: 'Produto da promoção',
      displayValue: selectedItem ? selectedItem.label : '',
      hiddenValue: selectedItem ? String(selectedItem.product.id || '') : '',
      placeholder: 'Buscar produto vinculado a promoção...'
    });
  }
  function _promotionPickerHtml(selectedId) {
    var selected = String(selectedId || '').trim();
    var promotions = _promotionPickerOptions();
    var selectedPromotion = promotions.find(function (p) { return _templateMarketingId(p) === selected; });
    if (!promotions.length) {
      return _featuredComboboxHtml({ kind: 'promotion', inputId: 'tpl-featured-promotion-picker', hiddenId: 'tpl-featured-promotion', dropdownId: 'tpl-featured-promotion-dropdown', label: 'Selecionar promoção ativa', placeholder: 'Nenhuma promoção ativa disponível', disabled: true });
    }
    return _featuredComboboxHtml({ kind: 'promotion', inputId: 'tpl-featured-promotion-picker', hiddenId: 'tpl-featured-promotion', dropdownId: 'tpl-featured-promotion-dropdown', label: 'Selecionar promoção ativa', displayValue: selectedPromotion ? _promotionPickerValue(selectedPromotion) : '', hiddenValue: selectedPromotion ? _templateMarketingId(selectedPromotion) : '', placeholder: 'Digite nome, tipo, descrição ou benefício...' });
  }
  function _templateLanguage() {
    return _normalizeTemplateLanguage(_val('tpl-language') || (((_storeConfig.geral || {}).language) || ((_storeConfig.template || {}).language) || 'es-ES'));
  }
  function _normalizeTemplateLanguage(value) {
    var aliases = { 'en-US': 'en', 'ca-ES': 'es-ES' };
    var normalized = aliases[String(value || '').trim()] || String(value || '').trim();
    return ['pt-BR', 'pt-PT', 'es-ES', 'en', 'fr'].indexOf(normalized) >= 0 ? normalized : 'es-ES';
  }
  function _templateLanguageOptions() {
    return [
      { value: 'pt-BR', label: 'Português Brasil' },
      { value: 'pt-PT', label: 'Português Portugal' },
      { value: 'es-ES', label: 'Español' },
      { value: 'en', label: 'English' },
      { value: 'fr', label: 'Français' }
    ];
  }
  function _featuredButtonSuggestion(type, lang) {
    var l = _normalizeTemplateLanguage(lang || _templateLanguage());
    var map = {
      coupon: { 'pt-BR': 'Usar cupom', 'pt-PT': 'Usar cupão', 'es-ES': 'Usar cupón', fr: 'Utiliser le coupon' },
      promotion: { 'pt-BR': 'Ver promoção', 'pt-PT': 'Ver promoção', 'es-ES': 'Ver promoción', fr: 'Voir la promotion' },
      featured_product: { 'pt-BR': 'Ver produto', 'pt-PT': 'Ver produto', 'es-ES': 'Ver producto', fr: 'Voir le produit' },
      most_ordered: { 'pt-BR': 'Ver produto', 'pt-PT': 'Ver produto', 'es-ES': 'Ver producto', fr: 'Voir le produit' }
    };
    return (map[type] && (map[type][l] || map[type]['es-ES'])) || '';
  }
  function _checkHtml(id, label, checked, hint) {
    return '<label style="display:flex;gap:9px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #EAE4DA;border-radius:10px;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);"><input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:#B42318;margin-top:1px;"><span><strong style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(label) + '</strong>' + (hint ? '<small style="display:block;color:#6F6860;font-size:11px;margin-top:2px;line-height:1.35;">' + _esc(hint) + '</small>' : '') + '</span></label>';
  }
  function _grid(html, min) {
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(' + (min || '220px') + ',1fr));gap:12px;align-items:start;">' + html + '</div>';
  }
  function _paymentMethodKey(value) {
    return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pagamento';
  }
  function _paymentMethodName(item) {
    if (typeof item === 'string') return item;
    item = item || {};
    return item.nome || item.name || item.label || item.tipoGlobalNome || item.id || '';
  }
  function _paymentSavedLookup(pay, tpl) {
    var lookup = {};
    var configs = [].concat((pay && pay.paymentMethodConfigs) || [], (tpl && tpl.paymentMethodConfigs) || []);
    configs.forEach(function (cfg) {
      var name = _paymentMethodName(cfg);
      var key = cfg.key || cfg.id || _paymentMethodKey(name);
      if (key) lookup[_paymentMethodKey(key)] = cfg;
      if (name) lookup[_paymentMethodKey(name)] = cfg;
    });
    return lookup;
  }
  function _legacyPaymentActive(name, pay) {
    var key = _paymentMethodKey(name);
    if (key === 'dinheiro' || key === 'efectivo' || key === 'efetivo' || key === 'cash') return !pay || pay.cash !== false;
    if (key === 'cartao' || key === 'tarjeta' || key === 'card') return !pay || pay.card !== false;
    if (key === 'bizum') return !pay || pay.bizum !== false;
    if (key === 'mb-way' || key === 'mbway') return !pay || pay.mbway !== false;
    if (key === 'transferencia' || key === 'transferencia-bancaria' || key === 'transfer' || key === 'bank-transfer') return !pay || (pay.transfer !== false && pay.localTransfer !== false);
    if (key === 'pagamento-online' || key === 'pago-online' || key === 'online') return !!(pay && pay.online);
    return true;
  }
  function _stripePaymentAvailable(integracoes) {
    integracoes = integracoes || {};
    var accountId = String(integracoes.stripeConnectedAccountId || integracoes.stripeAccountId || '').trim();
    return integracoes.stripeEnabled === true || /^acct_/.test(accountId) || integracoes.stripeConnectStatus === 'ready';
  }
  function _stripeTemplatePaymentMethod(existing, integracoes) {
    existing = existing || {};
    integracoes = integracoes || {};
    var accountId = String(integracoes.stripeConnectedAccountId || integracoes.stripeAccountId || '').trim();
    var ready = integracoes.stripeEnabled === true && /^acct_/.test(accountId) && (!integracoes.stripeConnectStatus || integracoes.stripeConnectStatus === 'ready');
    return {
      key: 'pagamento-online-stripe',
      id: 'pagamento-online-stripe',
      name: 'Cartão online (Stripe)',
      label: 'Cartão online (Stripe)',
      active: existing.active !== undefined ? !!existing.active : ready,
      enabled: existing.enabled !== undefined ? !!existing.enabled : ready,
      financeActive: ready,
      stripe: true,
      provider: 'stripe',
      tipo: 'Cartão',
      tipoGlobalSlug: 'card',
      tipoGlobalNome: 'Cartão',
      instructions: existing.instructions || existing.instrucoes || existing.note || '',
      statusText: ready ? 'Stripe conectado' : 'Conecte o Stripe em Configurações > Integrações'
    };
  }
  function _templatePaymentMethods(financeiro, pay, tpl, integracoes) {
    pay = pay || {};
    tpl = tpl || {};
    var source = Array.isArray(financeiro && financeiro.formas_pagamento) && financeiro.formas_pagamento.length
      ? financeiro.formas_pagamento
      : (Array.isArray(pay.paymentMethodConfigs) && pay.paymentMethodConfigs.length ? pay.paymentMethodConfigs : (Array.isArray(pay.paymentMethods) ? pay.paymentMethods : ['Dinheiro', 'Cartão', 'Bizum', 'Transferência']));
    var lookup = _paymentSavedLookup(pay, tpl);
    var seen = {};
    var methods = source.map(function (item) {
      var name = _paymentMethodName(item);
      if (!name) return null;
      var key = _paymentMethodKey((item && (item.key || item.id || item.tipoGlobalSlug)) || name);
      var isStripe = !!(item && typeof item !== 'string' && (item.provider === 'stripe' || item.stripe === true || item.stripeConnected === true)) || key === 'stripe';
      if (isStripe) key = 'pagamento-online-stripe';
      var byName = lookup[_paymentMethodKey(name)] || lookup[key] || {};
      var financeActive = typeof item === 'string' ? true : item.ativo !== false;
      var stripeReady = !isStripe || ((integracoes || {}).stripeEnabled === true && /^acct_/.test(String((integracoes || {}).stripeConnectedAccountId || (integracoes || {}).stripeAccountId || '').trim()) && (!(integracoes || {}).stripeConnectStatus || (integracoes || {}).stripeConnectStatus === 'ready'));
      var savedActive = byName.active !== undefined ? byName.active : byName.enabled;
      var instructions = byName.instructions || byName.instrucoes || byName.instrucoesAdicionais || byName.note || byName.observacaoLoja || '';
      if (!instructions && item && typeof item !== 'string') instructions = item.instrucoesLoja || item.instructions || item.observacaoLoja || '';
      var method = {
        key: key,
        name: isStripe ? 'Cartão online (Stripe)' : name,
        active: isStripe ? (stripeReady && (savedActive !== undefined ? !!savedActive : true)) : (savedActive !== undefined ? !!savedActive : (financeActive && _legacyPaymentActive(name, pay))),
        financeActive: isStripe ? stripeReady : financeActive,
        instructions: instructions,
        provider: isStripe ? 'stripe' : (item && typeof item !== 'string' ? item.provider || '' : ''),
        stripe: isStripe,
        tipo: item && typeof item !== 'string' ? item.tipo || '' : '',
        tipoGlobalSlug: item && typeof item !== 'string' ? item.tipoGlobalSlug || '' : '',
        tipoGlobalNome: item && typeof item !== 'string' ? item.tipoGlobalNome || '' : '',
        statusText: isStripe ? (stripeReady ? 'Stripe conectado' : 'Conecte o Stripe em Configurações > Integrações') : ''
      };
      if (seen[method.key]) return null;
      seen[method.key] = true;
      return method;
    }).filter(Boolean);
    if (!seen['pagamento-online-stripe'] && _stripePaymentAvailable(integracoes)) {
      var savedStripe = lookup['pagamento-online-stripe'] || lookup['stripe'] || lookup['cartao-online-stripe'] || {};
      methods.push(_stripeTemplatePaymentMethod(savedStripe, integracoes));
      seen['pagamento-online-stripe'] = true;
    }
    return methods;
  }
  function _stripeFinanceMethodForTemplate(financeiro) {
    var methods = Array.isArray(financeiro && financeiro.formas_pagamento) ? financeiro.formas_pagamento : [];
    return methods.find(function (item) {
      if (!item || typeof item === 'string') return false;
      var name = String(item.nome || item.name || '').trim().toLowerCase();
      return item.provider === 'stripe' || item.stripe === true || item.stripeConnected === true || name === 'stripe';
    }) || null;
  }
  function _templateCurrency(value) {
    value = _moneyLike(value);
    try {
      return value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
    } catch (err) {
      return '€' + value.toFixed(2).replace('.', ',');
    }
  }
  function _templatePercent(value) {
    value = _moneyLike(value);
    return value.toLocaleString('pt-PT', { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: 2 }) + '%';
  }
  function _templateStripeAccountOptions(selected) {
    var current = String(selected || '').trim();
    var accounts = Array.isArray(_storeConfig.bankAccounts) ? _storeConfig.bankAccounts : [];
    var active = accounts.filter(function (account) {
      return account && (account.ativo !== false || String(account.id || '') === current);
    }).sort(function (a, b) {
      return String(a.nome || a.name || '').localeCompare(String(b.nome || b.name || ''), 'pt', { sensitivity: 'base' });
    });
    var html = '<option value="">Selecionar conta financeira...</option>';
    html += active.map(function (account) {
      var id = String(account.id || '');
      var name = account.nome || account.name || 'Conta';
      return '<option value="' + _esc(id) + '"' + (id === current ? ' selected' : '') + '>' + _esc(name) + '</option>';
    }).join('');
    if (current && !active.some(function (account) { return String(account.id || '') === current; })) {
      html += '<option value="' + _esc(current) + '" selected>Conta selecionada</option>';
    }
    return html;
  }
  function _stripeCheckoutIntegrationCard(integracoes, financeiro) {
    integracoes = integracoes || {};
    financeiro = financeiro || {};
    var accountId = String(integracoes.stripeConnectedAccountId || integracoes.stripeAccountId || '').trim();
    var status = integracoes.stripeConnectStatus || (accountId ? 'onboarding_required' : 'not_connected');
    var ready = integracoes.stripeEnabled === true && /^acct_/.test(accountId) && (!status || status === 'ready') && integracoes.stripeChargesEnabled !== false;
    var pending = /^acct_/.test(accountId) && !ready;
    var method = _stripeFinanceMethodForTemplate(financeiro) || {};
    var selectedAccount = integracoes.stripeFinanceAccountId || integracoes.stripeDefaultAccountId || method.contaPadraoId || method.defaultAccountId || '';
    var pct = _templateStripeFeeDefault(method.taxaPercentual, method.feePct, 1.5);
    var fixed = _templateStripeFeeDefault(method.taxaFixa, method.fixedFee, 0.25);
    var sample = 10;
    var sampleFee = Math.max(0, (sample * pct / 100) + fixed);
    var sampleNet = Math.max(0, sample - sampleFee);
    var hasFee = pct > 0 || fixed > 0;
    var tone = ready ? '#2F6B57' : (pending ? '#9A6A2F' : '#B42318');
    var statusText = ready ? 'Cartão online pronto' : (pending ? 'Falta concluir no Stripe' : 'Cartão online ainda não conectado');
    var btnText = ready ? 'Ver conexão do Stripe' : (pending ? 'Continuar configuração' : 'Conectar cartão online');
    var feeRule = hasFee ? (_templatePercent(pct) + (fixed > 0 ? ' + ' + _templateCurrency(fixed) : '')) : 'Taxa estimada ainda não preenchida';
    return '<div style="border:1px solid #EADFD8;border-radius:16px;background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF8 100%);padding:14px;display:grid;gap:12px;box-shadow:0 8px 22px rgba(31,31,31,.04);">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;min-width:0;max-width:640px;"><div style="width:38px;height:38px;border-radius:13px;background:#FFF3F1;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">credit_card</span></div><div style="min-width:0;"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><h3 style="margin:0;color:#1F1F1F;font-size:15px;font-weight:850;line-height:1.2;">Cartão online no checkout</h3><span style="display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:#FFF8F3;color:' + tone + ';padding:6px 9px;font-size:10.5px;font-weight:800;"><span style="width:7px;height:7px;border-radius:50%;background:currentColor;"></span>' + _esc(statusText) + '</span></div><p style="margin:6px 0 0;color:#6F6860;font-size:12px;line-height:1.45;">A cliente paga por cartão antes de confirmar o pedido. O pedido só entra como confirmado quando o pagamento for aprovado.</p></div></div>' +
        '<button id="tpl-stripe-connect" type="button" onclick="Modules.Catalogo._connectCheckoutStripe()" style="height:38px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#B42318;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);white-space:nowrap;"><span class="mi" style="font-size:15px;vertical-align:-3px;margin-right:5px;">open_in_new</span>' + _esc(btnText) + '</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(220px,360px);gap:6px;"><label style="' + _labelStyle() + '">Conta financeira para receber</label><select id="tpl-stripe-finance-account" style="' + _operationFieldStyle('') + '">' + _templateStripeAccountOptions(selectedAccount) + '</select><small style="color:#6F6860;font-size:11px;line-height:1.4;">Escolha onde o dinheiro do cartão entra no Financeiro. As taxas Stripe serão registradas nessa mesma conta.</small></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">' +
        '<div style="background:#fff;border:1px solid #EFE4DC;border-radius:12px;padding:10px;"><div style="color:#8B817B;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;">Taxa estimada</div><div style="color:#1F1F1F;font-size:14px;font-weight:850;margin-top:4px;">' + _esc(feeRule) + '</div></div>' +
        '<div style="background:#fff;border:1px solid #EFE4DC;border-radius:12px;padding:10px;"><div style="color:#8B817B;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;">Exemplo em ' + _esc(_templateCurrency(sample)) + '</div><div style="color:#1F1F1F;font-size:14px;font-weight:850;margin-top:4px;">' + _esc(_templateCurrency(sampleFee)) + ' de taxa</div></div>' +
        '<div style="background:#fff;border:1px solid #EFE4DC;border-radius:12px;padding:10px;"><div style="color:#8B817B;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;">Ficaria perto de</div><div style="color:#1F1F1F;font-size:14px;font-weight:850;margin-top:4px;">' + _esc(_templateCurrency(sampleNet)) + '</div></div>' +
      '</div>' +
      '<p style="margin:0;color:#6F6860;font-size:11.5px;line-height:1.45;">Taxa Stripe estimada: 1,5% + €0,25 por venda. Depois da venda aprovada, o BocaFood registra a taxa real informada pela Stripe.</p>' +
    '</div>';
  }
  function _connectCheckoutStripe() {
    if (!(window.Modules && Modules.Configuracoes && Modules.Configuracoes._startStripeConnect)) {
      UI.toast('Não foi possível abrir a conexão Stripe agora.', 'error');
      return;
    }
    Modules.Configuracoes._startStripeConnect({
      buttonId: 'tpl-stripe-connect',
      financeAccountId: (document.getElementById('tpl-stripe-finance-account') || {}).value || '',
      returnHash: 'catalogo/template'
    });
  }

  function _templateStripeFeeDefault(primary, fallback, defaultValue) {
    var value = _moneyLike(primary != null && primary !== '' ? primary : fallback);
    return value > 0 ? value : defaultValue;
  }
  function _refreshCheckoutStripeStatus() {
    if (!(window.Modules && Modules.Configuracoes && Modules.Configuracoes._refreshStripeConnectStatus)) return;
    Modules.Configuracoes._refreshStripeConnectStatus({
      buttonId: 'tpl-stripe-connect',
      financeAccountId: (document.getElementById('tpl-stripe-finance-account') || {}).value || '',
      renderAfter: false
    }).then(function () {
      return _loadStoreConfig();
    }).then(function () {
      _renderTemplateLoja(true);
    }).catch(function () {});
  }
  function _paymentMethodsHtml(methods) {
    if (!methods.length) {
      return '<div style="padding:18px;border:1px dashed #EAE4DA;border-radius:14px;background:#FAF8F4;color:#6F6860;font-size:13px;line-height:1.45;text-align:center;">Nenhuma forma cadastrada no Financeiro. Cadastre em Configurações > Financeiro para exibir aqui.</div>';
    }
    return '<div class="tpl-payment-methods">' + methods.map(function (m, idx) {
      return '<div class="tpl-payment-method-card" data-tpl-payment-method="1" data-payment-key="' + _esc(m.key) + '" data-payment-name="' + _esc(m.name) + '" data-payment-finance-active="' + (m.financeActive ? '1' : '0') + '" data-payment-tipo="' + _esc(m.tipo || '') + '" data-payment-tipo-global-slug="' + _esc(m.tipoGlobalSlug || '') + '" data-payment-tipo-global-nome="' + _esc(m.tipoGlobalNome || '') + '">' +
        '<div class="tpl-payment-method-head">' +
          '<div style="min-width:0;"><div class="tpl-payment-method-name">' + _esc(m.name) + '</div><div class="tpl-payment-method-status">' + _esc(m.statusText || (m.financeActive ? 'Cadastrada no Financeiro' : 'Inativa no Financeiro')) + '</div></div>' +
          _toggleHtml('tpl-pay-method-active-' + idx, 'Disponível na loja', m.active, '') +
        '</div>' +
        '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Instruções adicionais</span><textarea id="tpl-pay-method-instructions-' + idx + '" rows="3" placeholder="Ex: informe dados para pagamento na retirada ou entrega." style="' + _operationFieldStyle('min-height:78px;resize:vertical;') + '">' + _esc(m.instructions || '') + '</textarea><small class="tpl-payment-method-note">Aparece para o cliente quando essa forma de pagamento for escolhida.</small></label>' +
      '</div>';
    }).join('') + '</div>';
  }
  function _collectTemplatePaymentMethods() {
    var rows = [].slice.call(document.querySelectorAll('[data-tpl-payment-method="1"]'));
    return rows.map(function (row, idx) {
      var name = row.getAttribute('data-payment-name') || '';
      var key = row.getAttribute('data-payment-key') || _paymentMethodKey(name);
      return {
        key: key,
        id: key,
        name: name,
        label: name,
        active: _checked('tpl-pay-method-active-' + idx),
        enabled: _checked('tpl-pay-method-active-' + idx),
        instructions: _val('tpl-pay-method-instructions-' + idx),
        financeActive: row.getAttribute('data-payment-finance-active') !== '0',
        provider: key === 'pagamento-online-stripe' ? 'stripe' : '',
        stripe: key === 'pagamento-online-stripe',
        tipo: row.getAttribute('data-payment-tipo') || '',
        tipoGlobalSlug: row.getAttribute('data-payment-tipo-global-slug') || '',
        tipoGlobalNome: row.getAttribute('data-payment-tipo-global-nome') || ''
      };
    }).filter(function (m) { return m.name; });
  }
  function _val(id) { return ((document.getElementById(id) || {}).value || '').trim(); }
  function _checked(id) { return !!((document.getElementById(id) || {}).checked); }
  function _boolValue(value) {
    if (value === true || value === false) return value;
    var normalized = String(value == null ? '' : value).trim().toLowerCase();
    if (['true', '1', 'yes', 'sim', 'on'].indexOf(normalized) >= 0) return true;
    if (['false', '0', 'no', 'nao', 'não', 'off'].indexOf(normalized) >= 0) return false;
    return null;
  }
  function _numVal(id) { return _moneyLike(_val(id)); }
  function _isPublicUrl(value) {
    var v = String(value || '').trim();
    return !v || /^https?:\/\//i.test(v);
  }
  function _cleanPublicUrl(value) {
    var v = String(value || '').trim();
    if (!v || /^file:\/\//i.test(v)) return '';
    return /^https?:\/\//i.test(v) ? v : '';
  }
  function _normalizeHexColor(value) {
    var v = String(value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
    if (/^[0-9a-f]{6}$/i.test(v)) return ('#' + v).toUpperCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) return ('#' + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2) + v.charAt(3) + v.charAt(3)).toUpperCase();
    return '';
  }
  function _hexToRgb(hex) {
    hex = _normalizeHexColor(hex) || '#B42318';
    return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
  }
  function _rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }
  function _mixColor(a, b, weight) {
    var x = _hexToRgb(a), y = _hexToRgb(b), w = Math.max(0, Math.min(1, Number(weight) || 0));
    return _rgbToHex(x.r * (1 - w) + y.r * w, x.g * (1 - w) + y.g * w, x.b * (1 - w) + y.b * w);
  }
  function _contrastText(hex) {
    var c = _hexToRgb(hex);
    var yiq = ((c.r * 299) + (c.g * 587) + (c.b * 114)) / 1000;
    return yiq >= 145 ? '#1A1A1A' : '#FFFFFF';
  }
  function _deriveStorePalette(primary) {
    var base = _normalizeHexColor(primary) || '#B42318';
    return {
      primaryColor: base,
      primaryDark: _mixColor(base, '#000000', 0.24),
      primaryLight: _mixColor(base, '#FFFFFF', 0.34),
      primarySoft: _mixColor(base, '#FFFFFF', 0.90),
      primaryBorder: _mixColor(base, '#FFFFFF', 0.72),
      primaryContrast: _contrastText(base),
      primaryHover: _mixColor(base, '#000000', 0.16),
      badgeSoft: _mixColor(base, '#FFFFFF', 0.86),
      chipSoft: _mixColor(base, '#FFFFFF', 0.92)
    };
  }
  function _validatePublicUrls(items) {
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var value = _val(item.id);
      if (value && !_isPublicUrl(value)) {
        UI.toast(item.label + ' deve começar com http:// ou https://.', 'error');
        return false;
      }
    }
    return true;
  }
  function _urlFieldHtml(id, label, value, placeholder) {
    return _fieldHtml(id, label, _cleanPublicUrl(value), placeholder || 'https://...');
  }
  function _publicStoreUrl() {
    var d = _storeConfig.dominio || {};
    return _cleanPublicUrl(d.publicUrl || d.siteUrl || d.domainUrl || d.url || '');
  }
  function _fiscalInfo() {
    var code = window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES';
    var cfg = window.FiscalConfig ? FiscalConfig.get(code) : {};
    return { code: code || 'ES', cfg: cfg || {}, country: (cfg && cfg.label) || (code === 'PT' ? 'Portugal' : 'Espanha') };
  }
  function _loadStoreConfig() {
    var keys = ['geral', 'aparencia', 'template', 'pagamentos', 'endereco', 'horarios', 'zonas', 'seo', 'seoTechnical', 'dominio', 'financeiro', 'pontos_program', 'integracoes'];
    return Promise.all(keys.map(function (k) { return DB.getDocRoot('config', k).catch(function () { return {}; }); }).concat([
      DB.getAll ? DB.getAll('contas_bancarias').catch(function () { return []; }) : Promise.resolve([])
    ])).then(function (docs) {
      _storeConfig = {};
      keys.forEach(function (k, i) { _storeConfig[k] = docs[i] || {}; });
      _storeConfig.bankAccounts = docs[keys.length] || [];
      return _storeConfig;
    });
  }
  function _syncSystemTenantStoreFromTemplate(template) {
    var tenantUid = window.Auth && typeof Auth.getTenantId === 'function' ? Auth.getTenantId() : '';
    if (!tenantUid || !window.firebase || !firebase.firestore) return Promise.resolve();
    var now = new Date().toISOString();
    var area = (template && template.deliveryArea && typeof template.deliveryArea === 'object') ? template.deliveryArea : {};
    var publicAddress = {
      street: template && template.address ? String(template.address).trim() : '',
      number: template && (template.number || template.numero) ? String(template.number || template.numero).trim() : '',
      complement: template && (template.complemento || template.reference) ? String(template.complemento || template.reference).trim() : '',
      neighborhood: template && template.neighborhood ? String(template.neighborhood).trim() : '',
      city: template && template.city ? String(template.city).trim() : '',
      province: template && (template.region || template.province || template.state) ? String(template.region || template.province || template.state).trim() : '',
      postalCode: template && template.postalCode ? String(template.postalCode).trim() : '',
      country: template && template.country ? String(template.country).trim() : '',
      source: '',
      updatedAt: now
    };
    var areaHasLocation = !!(area.city || area.province || area.country || area.postalCode);
    var addressHasLocation = !!(publicAddress.street || publicAddress.number || publicAddress.neighborhood || publicAddress.city || publicAddress.province || publicAddress.country || publicAddress.postalCode);
    if (addressHasLocation) publicAddress.source = 'admin_public_address';
    var locationSource = areaHasLocation ? 'delivery_area' : (addressHasLocation ? 'public_address' : '');
    var primaryCity = areaHasLocation ? (area.city || '') : (publicAddress.city || '');
    var primaryRegion = areaHasLocation ? (area.province || '') : (publicAddress.province || '');
    var primaryCountry = areaHasLocation ? (area.country || '') : (publicAddress.country || '');
    var primaryPostalCode = areaHasLocation ? (area.postalCode || '') : (publicAddress.postalCode || '');
    var social = {
      instagram: template && template.instagram ? String(template.instagram).trim() : '',
      facebook: template && template.facebook ? String(template.facebook).trim() : '',
      tiktok: template && template.tiktok ? String(template.tiktok).trim() : ''
    };
    var storePatch = {
      deliveryArea: area,
      address: publicAddress,
      city: primaryCity,
      region: primaryRegion,
      province: primaryRegion,
      country: primaryCountry,
      postalCode: primaryPostalCode,
      locationSource: locationSource,
      social: social,
      updatedAt: now
    };
    if (template && template.publicName) storePatch.name = template.publicName;
    if (template && template.language) storePatch.language = template.language;
    console.info('[Catalogo] sync system_tenants store from template', {
      tenantUid: tenantUid,
      source: 'loja-online/template',
      path: 'system_tenants/' + tenantUid + '.store',
      locationSource: locationSource || 'empty',
      socialFields: Object.keys(social).filter(function (key) { return !!social[key]; }),
      fields: Object.keys(storePatch)
    });
    return firebase.firestore().collection('system_tenants').doc(tenantUid).set({
      store: storePatch,
      updatedAt: now
    }, { merge: true });
  }
  function _imageUploadState() {
    window._catalogStoreImageState = window._catalogStoreImageState || {};
    return window._catalogStoreImageState;
  }
  function _setImageElementsById(id, url) {
    if (!id) return;
    [].slice.call(document.querySelectorAll('#' + id)).forEach(function (img) {
      if (!img) return;
      img.src = url || '';
      img.style.display = url ? 'block' : 'none';
    });
  }
  function _setPlaceholderElementsById(id, visible) {
    if (!id) return;
    [].slice.call(document.querySelectorAll('#' + id)).forEach(function (el) {
      if (el) el.style.display = visible ? 'block' : 'none';
    });
  }
  function _syncTemplateImageDom(target, url) {
    url = _cleanPublicUrl(url || '');
    var previewMap = {
      logo: 'tpl-preview-logo',
      favicon: 'tpl-preview-favicon',
      share: 'seo-preview-share-img',
      featured: 'tpl-preview-featured-image',
      promoMobile: 'tpl-preview-mobile-promo-banner',
      promoDesktop: 'tpl-preview-desktop-promo-banner',
      bannerMobile: 'tpl-preview-banner-mobile',
      banner: 'tpl-preview-banner',
      bannerDesktop: 'tpl-preview-banner-desktop'
    };
    var placeholderMap = {
      logo: 'tpl-preview-logo-placeholder',
      favicon: 'tpl-preview-favicon-placeholder',
      featured: 'tpl-preview-featured-image-placeholder',
      promoMobile: 'tpl-preview-mobile-promo-banner-placeholder',
      promoDesktop: 'tpl-preview-desktop-promo-banner-placeholder',
      bannerMobile: 'tpl-preview-banner-mobile-placeholder',
      banner: 'tpl-preview-banner-desktop-placeholder',
      bannerDesktop: 'tpl-preview-banner-desktop-placeholder'
    };
    var previewId = previewMap[target] || previewMap.banner;
    var placeholderId = placeholderMap[target] || placeholderMap.banner;
    _setImageElementsById(previewId, url);
    _setPlaceholderElementsById(placeholderId, !url);
    var overlay = document.getElementById(previewId + '-overlay');
    if (overlay) overlay.style.display = url ? 'block' : 'none';
    if (target === 'favicon') {
      var tabIcon = document.getElementById('tpl-preview-favicon-tab-icon');
      if (tabIcon) { tabIcon.src = url || ''; tabIcon.style.display = url ? 'block' : 'none'; }
    }
    if (target === 'logo') {
      [].slice.call(document.querySelectorAll('.tpl-brand-preview-logo,.tpl-maincard-preview-logo')).forEach(function (el) {
        el.innerHTML = url ? '<img src="' + _esc(url) + '" alt="">' : '<span class="mi" style="font-size:25px;">storefront</span>';
      });
    }
  }
  function _imagePersistencePatch(target, url, result) {
    url = _cleanPublicUrl(url || '');
    result = result || {};
    if (target === 'logo') {
      return {
        template: { logoUrl: url, logoStoragePath: url ? (result.imageStoragePath || '') : '', logoImagePath: url ? (result.imagePath || result.imageStoragePath || '') : '', logoWidth: url ? (result.imageWidth || 0) : 0, logoHeight: url ? (result.imageHeight || 0) : 0, logoSizeKb: url ? (result.imageSizeKb || 0) : 0, logoFormat: url ? (result.imageFormat || 'webp') : '' },
        shared: { logoUrl: url }
      };
    }
    if (target === 'favicon') {
      return {
        template: { faviconUrl: url, faviconStoragePath: url ? (result.imageStoragePath || '') : '', faviconImagePath: url ? (result.imagePath || result.imageStoragePath || '') : '', faviconWidth: url ? (result.imageWidth || 0) : 0, faviconHeight: url ? (result.imageHeight || 0) : 0, faviconSizeKb: url ? (result.imageSizeKb || 0) : 0, faviconFormat: url ? (result.imageFormat || 'webp') : '' },
        shared: { faviconUrl: url }
      };
    }
    if (target === 'featured') {
      return {
        template: { featuredActionImageUrl: url, featuredImageUrl: url, featuredActionImageStoragePath: url ? (result.imageStoragePath || '') : '', featuredActionImagePath: url ? (result.imagePath || result.imageStoragePath || '') : '', featuredActionImageWidth: url ? (result.imageWidth || 0) : 0, featuredActionImageHeight: url ? (result.imageHeight || 0) : 0, featuredActionImageSizeKb: url ? (result.imageSizeKb || 0) : 0, featuredActionImageFormat: url ? (result.imageFormat || 'webp') : '' },
        shared: { featuredActionImageUrl: url, featuredImageUrl: url }
      };
    }
    if (target === 'promoMobile') {
      return {
        template: { mobilePromoBannerImageUrl: url, promoBannerImageUrl: url, promotionalBannerImageUrl: url, mobilePromoBannerStoragePath: url ? (result.imageStoragePath || '') : '', promoBannerImageStoragePath: url ? (result.imageStoragePath || '') : '', promoBannerImagePath: url ? (result.imagePath || result.imageStoragePath || '') : '', mobilePromoBannerWidth: url ? (result.imageWidth || 0) : 0, mobilePromoBannerHeight: url ? (result.imageHeight || 0) : 0, mobilePromoBannerSizeKb: url ? (result.imageSizeKb || 0) : 0, mobilePromoBannerFormat: url ? (result.imageFormat || 'webp') : '' },
        shared: { mobilePromoBannerImageUrl: url, promoBannerImageUrl: url }
      };
    }
    if (target === 'promoDesktop') {
      return {
        template: { desktopPromoBannerImageUrl: url, promoBannerDesktopImageUrl: url, desktopPromoBannerStoragePath: url ? (result.imageStoragePath || '') : '', promoBannerDesktopStoragePath: url ? (result.imageStoragePath || '') : '', desktopPromoBannerImagePath: url ? (result.imagePath || result.imageStoragePath || '') : '', desktopPromoBannerWidth: url ? (result.imageWidth || 0) : 0, desktopPromoBannerHeight: url ? (result.imageHeight || 0) : 0, desktopPromoBannerSizeKb: url ? (result.imageSizeKb || 0) : 0, desktopPromoBannerFormat: url ? (result.imageFormat || 'webp') : '' },
        shared: { desktopPromoBannerImageUrl: url, promoBannerDesktopImageUrl: url }
      };
    }
    if (target === 'bannerMobile') {
      return {
        template: { coverImageMobileUrl: url, mobileCoverImageUrl: url, bannerMobileUrl: url, bannerMobileStoragePath: url ? (result.imageStoragePath || '') : '', coverImageMobileStoragePath: url ? (result.imageStoragePath || '') : '', bannerMobileImagePath: url ? (result.imagePath || result.imageStoragePath || '') : '', bannerMobileWidth: url ? (result.imageWidth || 0) : 0, bannerMobileHeight: url ? (result.imageHeight || 0) : 0, bannerMobileSizeKb: url ? (result.imageSizeKb || 0) : 0, bannerMobileFormat: url ? (result.imageFormat || 'webp') : '' },
        shared: { coverImageMobileUrl: url, mobileCoverImageUrl: url, bannerMobileUrl: url }
      };
    }
    return {
      template: { coverImageUrl: url, bannerUrl: url, bannerStoragePath: url ? (result.imageStoragePath || '') : '', coverImageStoragePath: url ? (result.imageStoragePath || '') : '', bannerImagePath: url ? (result.imagePath || result.imageStoragePath || '') : '', bannerWidth: url ? (result.imageWidth || 0) : 0, bannerHeight: url ? (result.imageHeight || 0) : 0, bannerSizeKb: url ? (result.imageSizeKb || 0) : 0, bannerFormat: url ? (result.imageFormat || 'webp') : '' },
      shared: { coverImageUrl: url, bannerUrl: url }
    };
  }
  function _uploadStoreImage(event, kind) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file || !window.ImageTools) return;
    var target = kind === 'banner' || kind === 'bannerDesktop' || kind === 'bannerMobile' || kind === 'promoMobile' || kind === 'promoDesktop' || kind === 'featured' || kind === 'share' || kind === 'favicon' ? kind : 'logo';
    var imageKind = target === 'logo' || target === 'favicon' ? 'logo' : 'banner';
    var storageFolder = target === 'logo' || target === 'favicon' ? 'logos' : (target === 'promoMobile' || target === 'promoDesktop' || target === 'featured' || target === 'share' ? 'featured' : 'banners');
    ImageTools.process(file, { kind: target === 'promoMobile' || target === 'promoDesktop' || target === 'featured' || target === 'share' ? 'featured' : imageKind, folder: storageFolder, entityId: 'catalogo-' + target }).then(function (result) {
      _imageUploadState()[target] = result;
      var fieldMap = {
        logo: 'tpl-logo-url',
        favicon: 'tpl-favicon-url',
        share: 'seo-og-image',
        featured: 'tpl-featured-image-url',
        promoMobile: 'tpl-mobile-promo-banner-url',
        promoDesktop: 'tpl-desktop-promo-banner-url',
        bannerMobile: 'tpl-banner-mobile-url'
      };
      var previewMap = {
        logo: 'tpl-preview-logo',
        favicon: 'tpl-preview-favicon',
        share: 'seo-preview-share-img',
        featured: 'tpl-preview-featured-image',
        promoMobile: 'tpl-preview-mobile-promo-banner',
        promoDesktop: 'tpl-preview-desktop-promo-banner',
        bannerMobile: 'tpl-preview-banner-mobile'
      };
      var fieldId = fieldMap[target] || 'tpl-banner-url';
      var previewId = previewMap[target] || 'tpl-preview-banner';
      var field = document.getElementById(fieldId);
      var preview = document.getElementById(previewId);
      var tabIcon = target === 'favicon' ? document.getElementById('tpl-preview-favicon-tab-icon') : null;
      if (field) field.value = result.imageUrl || '';
      if (preview) preview.src = result.imageUrl || '';
      if (tabIcon) { tabIcon.src = result.imageUrl || ''; tabIcon.style.display = result.imageUrl ? 'block' : 'none'; }
      var publicUrl = _cleanPublicUrl(result.imageUrl || '');
      _syncTemplateImageDom(target, publicUrl);
      var persist = Promise.resolve();
      if (publicUrl && target !== 'share') {
        var patches = _imagePersistencePatch(target, publicUrl, result);
        var patchTemplate = patches.template;
        var patchShared = patches.shared;
        _storeConfig.template = Object.assign({}, _storeConfig.template || {}, patchTemplate);
        _storeConfig.geral = Object.assign({}, _storeConfig.geral || {}, patchShared);
        _storeConfig.aparencia = Object.assign({}, _storeConfig.aparencia || {}, patchShared);
        persist = Promise.all([
          DB.setDocRoot('config', 'template', patchTemplate),
          DB.setDocRoot('config', 'geral', patchShared),
          DB.setDocRoot('config', 'aparencia', patchShared)
        ]).then(function () {
          _storeConfig.template = Object.assign({}, _storeConfig.template || {}, patchTemplate);
          _storeConfig.geral = Object.assign({}, _storeConfig.geral || {}, patchShared);
          _storeConfig.aparencia = Object.assign({}, _storeConfig.aparencia || {}, patchShared);
        });
      }
      persist.then(function () {
        UI.toast(target === 'banner' ? 'Imagem de capa salva com sucesso.' : 'Imagem otimizada com sucesso.', 'success');
      }).catch(function (err) {
        UI.toast('Imagem enviada, mas não foi possível salvar a URL: ' + (err && err.message ? err.message : err), 'error');
      });
      if (_activeSub === 'template') _refreshTemplatePreview();
      if (_activeSub === 'seo') _refreshSeoPreview();
    }).catch(function (err) {
      UI.toast(err && err.message ? err.message : 'Erro ao otimizar imagem.', 'error');
      if (event && event.target) event.target.value = '';
    });
  }
  function _clearStoreImage(kind) {
    var target = kind === 'share' ? 'share' : (kind === 'featured' ? 'featured' : (kind === 'promoMobile' ? 'promoMobile' : (kind === 'promoDesktop' ? 'promoDesktop' : (kind === 'bannerMobile' ? 'bannerMobile' : (kind === 'bannerDesktop' ? 'bannerDesktop' : (kind === 'banner' ? 'banner' : (kind === 'favicon' ? 'favicon' : 'logo')))))));
    var fieldId = target === 'share' ? 'seo-og-image' : (target === 'logo' ? 'tpl-logo-url' : (target === 'favicon' ? 'tpl-favicon-url' : (target === 'featured' ? 'tpl-featured-image-url' : (target === 'promoMobile' ? 'tpl-mobile-promo-banner-url' : (target === 'promoDesktop' ? 'tpl-desktop-promo-banner-url' : (target === 'bannerMobile' ? 'tpl-banner-mobile-url' : 'tpl-banner-url'))))));
    var previewId = target === 'share' ? 'seo-preview-share-img' : (target === 'logo' ? 'tpl-preview-logo' : (target === 'favicon' ? 'tpl-preview-favicon' : (target === 'featured' ? 'tpl-preview-featured-image' : (target === 'promoMobile' ? 'tpl-preview-mobile-promo-banner' : (target === 'promoDesktop' ? 'tpl-preview-desktop-promo-banner' : (target === 'bannerMobile' ? 'tpl-preview-banner-mobile' : 'tpl-preview-banner-desktop'))))));
    var placeholderId = target === 'share' ? 'seo-preview-share-placeholder' : (target === 'logo' ? 'tpl-preview-logo-placeholder' : (target === 'favicon' ? 'tpl-preview-favicon-placeholder' : (target === 'featured' ? 'tpl-preview-featured-image-placeholder' : (target === 'promoMobile' ? 'tpl-preview-mobile-promo-banner-placeholder' : (target === 'promoDesktop' ? 'tpl-preview-desktop-promo-banner-placeholder' : (target === 'bannerMobile' ? 'tpl-preview-banner-mobile-placeholder' : 'tpl-preview-banner-desktop-placeholder'))))));
    var field = document.getElementById(fieldId);
    var preview = document.getElementById(previewId);
    var placeholder = document.getElementById(placeholderId);
    var tabIcon = target === 'favicon' ? document.getElementById('tpl-preview-favicon-tab-icon') : null;
    if (field) field.value = '';
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'block';
    if (tabIcon) { tabIcon.src = ''; tabIcon.style.display = 'none'; }
    var state = _imageUploadState();
    delete state[target];
    _syncTemplateImageDom(target, '');
    if (target !== 'share') {
      var patches = _imagePersistencePatch(target, '', {});
      _storeConfig.template = Object.assign({}, _storeConfig.template || {}, patches.template);
      _storeConfig.geral = Object.assign({}, _storeConfig.geral || {}, patches.shared);
      _storeConfig.aparencia = Object.assign({}, _storeConfig.aparencia || {}, patches.shared);
      Promise.all([
        DB.setDocRoot('config', 'template', patches.template),
        DB.setDocRoot('config', 'geral', patches.shared),
        DB.setDocRoot('config', 'aparencia', patches.shared)
      ]).then(function () {
        UI.toast('Imagem removida com sucesso.', 'success');
      }).catch(function (err) {
        UI.toast('Imagem removida da tela, mas não foi possível salvar: ' + (err && err.message ? err.message : err), 'error');
      });
    }
    if (target === 'share') _refreshSeoPreview();
    else _refreshTemplatePreview();
  }

  function _mainCardConfigFromTemplate(tpl) {
    tpl = tpl || {};
    var main = tpl.mainCardConfig || {};
    return {
      showLogo: main.showLogo !== undefined ? !!main.showLogo : true,
      showStoreName: main.showStoreName !== undefined ? !!main.showStoreName : false,
      showSlogan: main.showSlogan !== undefined ? !!main.showSlogan : false,
      showRating: main.showRating !== undefined ? !!main.showRating : true,
      showMoreInfoButton: main.showMoreInfoButton !== undefined ? !!main.showMoreInfoButton : (tpl.topShowMoreInfo !== false),
      showLocation: main.showLocation !== undefined ? !!main.showLocation : (tpl.topShowRegion !== false),
      showStoreStatus: main.showStoreStatus !== undefined ? !!main.showStoreStatus : (tpl.topShowRegion !== false),
      showOpeningHoursSummary: main.showOpeningHoursSummary !== undefined ? !!main.showOpeningHoursSummary : false,
      showPickup: main.showPickup !== undefined ? !!main.showPickup : (tpl.pickupEnabled !== false),
      showDelivery: main.showDelivery !== undefined ? !!main.showDelivery : (tpl.deliveryEnabled !== false),
      showPreparationTime: main.showPreparationTime !== undefined ? !!main.showPreparationTime : !!(tpl.averagePrepTime || tpl.prepTime),
      showDeliveryTime: main.showDeliveryTime !== undefined ? !!main.showDeliveryTime : false,
      showMinimumOrder: main.showMinimumOrder !== undefined ? !!main.showMinimumOrder : false,
      showAdvanceDays: main.showAdvanceDays !== undefined ? !!main.showAdvanceDays : false
    };
  }

  function _contactDisplayConfigFromTemplate(tpl) {
    tpl = tpl || {};
    var contact = tpl.contactDisplayConfig || {};
    return {
      showContactsInFooter: contact.showContactsInFooter !== undefined ? !!contact.showContactsInFooter : true,
      showWhatsappInFooter: contact.showWhatsappInFooter !== undefined ? !!contact.showWhatsappInFooter : true,
      showPhoneInFooter: contact.showPhoneInFooter !== undefined ? !!contact.showPhoneInFooter : false,
      showEmailInFooter: contact.showEmailInFooter !== undefined ? !!contact.showEmailInFooter : true,
      showInstagramInFooter: contact.showInstagramInFooter !== undefined ? !!contact.showInstagramInFooter : true,
      showFacebookInFooter: contact.showFacebookInFooter !== undefined ? !!contact.showFacebookInFooter : false,
      showTiktokInFooter: contact.showTiktokInFooter !== undefined ? !!contact.showTiktokInFooter : false
    };
  }

  function _phoneCountryList() {
    return [
      { code: 'ES', dial: '+34', label: 'Espanha', flag: '🇪🇸' },
      { code: 'PT', dial: '+351', label: 'Portugal', flag: '🇵🇹' },
      { code: 'BR', dial: '+55', label: 'Brasil', flag: '🇧🇷' },
      { code: 'FR', dial: '+33', label: 'França', flag: '🇫🇷' },
      { code: 'IT', dial: '+39', label: 'Itália', flag: '🇮🇹' },
      { code: 'DE', dial: '+49', label: 'Alemanha', flag: '🇩🇪' },
      { code: 'GB', dial: '+44', label: 'Reino Unido', flag: '🇬🇧' },
      { code: 'US', dial: '+1', label: 'Estados Unidos', flag: '🇺🇸' }
    ];
  }

  function _normalizePhoneNumberLocal(value) {
    return String(value == null ? '' : value).replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  }

  function _detectPhoneCountry(value) {
    var raw = _normalizePhoneNumberLocal(value).replace(/^\+/, '');
    if (!raw) return { country: 'ES', dial: '+34', local: '' };
    var list = _phoneCountryList();
    var best = list.slice().sort(function (a, b) { return b.dial.length - a.dial.length; }).find(function (item) {
      return raw.indexOf(item.dial.replace('+', '')) === 0;
    });
    if (!best) return { country: 'ES', dial: '+34', local: raw };
    return { country: best.code, dial: best.dial, local: raw.slice(best.dial.replace('+', '').length) };
  }

  function _phoneCompositeHtml(id, label, value, placeholder, hint) {
    var detected = _detectPhoneCountry(value);
    var countries = _phoneCountryList();
    var visibleId = id + '-local';
    var countryId = id + '-country';
    var hiddenId = id;
    var options = countries.map(function (item) {
      return '<option value="' + _esc(item.code) + '"' + (item.code === detected.country ? ' selected' : '') + '>' + _esc(item.flag + ' ' + item.label + ' ' + item.dial) + '</option>';
    }).join('');
    return '<label style="display:block;"><span style="' + _labelStyle() + '">' + _esc(label) + '</span>' +
      '<input id="' + _esc(hiddenId) + '" type="hidden" value="' + _esc(detected.dial + (detected.local || '')) + '">' +
      '<div style="display:flex;gap:10px;align-items:stretch;flex-wrap:wrap;">' +
        '<select id="' + _esc(countryId) + '" style="min-width:155px;max-width:100%;flex:0 0 155px;' + _inputStyle() + '">' + options + '</select>' +
        '<input id="' + _esc(visibleId) + '" type="text" value="' + _esc(detected.local || (_normalizePhoneNumberLocal(value).replace(/^\+/, ''))) + '" placeholder="' + _esc(placeholder || '') + '" inputmode="tel" style="flex:1 1 180px;' + _inputStyle() + '">' +
      '</div>' +
      (hint ? '<small style="display:block;margin-top:6px;font-size:11px;line-height:1.35;color:#8A7E7C;">' + _esc(hint) + '</small>' : '') +
    '</label>';
  }

  function _operationPhoneCompositeHtml(id, label, value, placeholder, hint, wrapStyle) {
    var detected = _detectPhoneCountry(value);
    var countries = _phoneCountryList();
    var visibleId = id + '-local';
    var countryId = id + '-country';
    var hiddenId = id;
    var options = countries.map(function (item) {
      return '<option value="' + _esc(item.code) + '"' + (item.code === detected.country ? ' selected' : '') + '>' + _esc(item.flag + ' ' + item.dial) + '</option>';
    }).join('');
    return '<label style="display:block;min-width:0;' + (wrapStyle || '') + '"><span style="' + _labelStyle() + '">' + _esc(label) + '</span>' +
      '<input id="' + _esc(hiddenId) + '" type="hidden" value="' + _esc(detected.dial + (detected.local || '')) + '">' +
      '<div style="display:flex;align-items:stretch;gap:8px;min-height:42px;">' +
        '<span style="position:relative;display:block;flex:0 0 92px;">' +
          '<select id="' + _esc(countryId) + '" style="' + _operationFieldStyle('height:42px;padding:0 30px 0 10px;font-size:13px;appearance:none;-webkit-appearance:none;-moz-appearance:none;') + '">' + options + '</select>' +
          '<span class="mi" style="position:absolute;right:9px;top:50%;transform:translateY(-50%);font-size:17px;color:#8A7E7C;pointer-events:none;">expand_more</span>' +
        '</span>' +
        '<input id="' + _esc(visibleId) + '" type="text" value="' + _esc(detected.local || (_normalizePhoneNumberLocal(value).replace(/^\+/, ''))) + '" placeholder="' + _esc(placeholder || '') + '" inputmode="tel" style="' + _operationFieldStyle('height:42px;min-width:0;flex:1;') + '">' +
      '</div>' +
      (hint ? '<small style="display:block;margin-top:6px;font-size:11px;font-weight:400;line-height:1.35;color:#8A7E7C;">' + _esc(hint) + '</small>' : '') +
    '</label>';
  }

  function _normalizeDeliveryZonePostal(value) {
    return String(value == null ? '' : value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
  }

  function _deliveryZonePostalList(value) {
    return String(value == null ? '' : value)
      .split(',')
      .map(function (item) { return _normalizeDeliveryZonePostal(item); })
      .filter(Boolean)
      .filter(function (item, idx, arr) { return arr.indexOf(item) === idx; });
  }

  function _normalizeDeliveryZones(list) {
    return (Array.isArray(list) ? list : []).map(function (zone, idx) {
      zone = zone || {};
      var postalList = Array.isArray(zone.postalCodes) && zone.postalCodes.length
        ? zone.postalCodes.map(_normalizeDeliveryZonePostal).filter(Boolean)
        : _deliveryZonePostalList(zone.postal || zone.postalCode || zone.code || '');
      postalList = postalList.filter(function (item, itemIdx, arr) { return arr.indexOf(item) === itemIdx; });
      return {
        id: String(zone.id || zone.zoneId || zone.key || _newEntityId('zone-' + (idx + 1))),
        name: String(zone.name || zone.label || ('Zona ' + (idx + 1))).trim(),
        postalCodes: postalList,
        deliveryFee: _moneyLike(zone.deliveryFee != null ? zone.deliveryFee : (zone.fee != null ? zone.fee : 0)),
        deliveryFeeRaw: zone.deliveryFeeRaw != null ? String(zone.deliveryFeeRaw) : String(zone.deliveryFee != null ? zone.deliveryFee : (zone.fee != null ? zone.fee : '')),
        active: zone.active !== false && zone.enabled !== false
      };
    }).filter(function (zone) { return zone.id; });
  }

  function _deliveryZoneCardHtml(zone, idx) {
    zone = zone || {};
    var postalText = Array.isArray(zone.postalCodes) ? zone.postalCodes.join(', ') : '';
    var feeText = zone.deliveryFee != null ? String(zone.deliveryFee).replace('.', ',') : '';
    var postalCount = Array.isArray(zone.postalCodes) ? zone.postalCodes.length : 0;
    var active = zone.active !== false;
    return '<div class="tpl-delivery-zone-card" data-delivery-zone-row data-zone-id="' + _esc(zone.id) + '" style="' + _operationCardStyle() + '">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:flex-start;min-width:0;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:12px;font-weight:700;color:#1F1F1F;">Zona ' + (idx + 1) + '</div>' +
            '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:6px;">' +
              '<span style="display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:11px;font-weight:500;">' + (active ? 'Ativa' : 'Inativa') + '</span>' +
              '<span style="display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:11px;font-weight:500;">' + postalCount + ' CEPs</span>' +
              '<span style="display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:11px;font-weight:500;">' + (feeText ? _esc(feeText) : 'Sem valor') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
          '<div class="tpl-delivery-zone-active">' + _toggleHtml('tpl-zone-active-' + idx, 'Ativa', active, '') + '</div>' +
          '<button type="button" class="tpl-image-btn ghost tpl-delivery-zone-delete" data-delivery-zone-remove="' + _esc(zone.id) + '">Excluir</button>' +
        '</div>' +
      '</div>' +
      '<div class="tpl-delivery-zone-grid">' +
        _operationFieldHtml('tpl-zone-name-' + idx, 'Nome da zona', zone.name || '', 'Ex: Centro, Bairro próximo, Zona 1', 'text', 'min-width:210px;') +
        '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">CEPs atendidos</span><textarea id="tpl-zone-postals-' + idx + '" rows="2" placeholder="Ex: 31001, 31002, 31003" style="' + _operationFieldStyle('min-height:72px;resize:vertical;min-width:260px;') + '">' + _esc(postalText) + '</textarea><small style="display:block;margin-top:6px;font-size:11px;font-weight:400;line-height:1.35;color:#8A7E7C;">Separe os CEPs por vírgula.</small></label>' +
        _operationMoneyFieldHtml('tpl-zone-fee-' + idx, 'Valor da entrega', feeText, 'Valor aplicado quando o CEP corresponder a esta zona.') +
      '</div>' +
    '</div>';
  }

  function _deliveryZonesHtml() {
    var zones = Array.isArray(_deliveryZonesDraft) ? _deliveryZonesDraft : [];
    var activeZones = zones.filter(function (zone) { return zone && zone.active !== false; }).length;
    var postalTotal = zones.reduce(function (sum, zone) { return sum + (Array.isArray(zone && zone.postalCodes) ? zone.postalCodes.length : 0); }, 0);
    var deliveryArea = _collectDeliveryAreaFromDom(_deliveryAreaFromConfig(_storeConfig.template || {}, _storeConfig.zonas || {}));
    var locationReady = _deliveryAreaReady(deliveryArea);
    var disabledAttr = locationReady ? '' : ' disabled aria-disabled="true"';
    var disabledStyle = locationReady ? 'background:#B42318;color:#fff;box-shadow:0 4px 12px rgba(180,35,24,.18);cursor:pointer;' : 'background:#D8CEC2;color:#fff;box-shadow:none;cursor:not-allowed;opacity:.72;';
    var body = zones.length ? zones.map(_deliveryZoneCardHtml).join('') : '<div style="border:1px dashed #EAE4DA;background:#FAF8F4;border-radius:14px;padding:18px;color:#6F6860;font-size:13px;line-height:1.45;text-align:center;">' + (locationReady ? 'Nenhuma zona cadastrada ainda. Clique em <strong>Adicionar zona</strong> para começar.' : 'Cadastre primeiro a <strong>Localização atendida</strong> acima para liberar as zonas de entrega.') + '</div>';
    return '<section ' + _templatePanelAttrs('operacao') + ' style="' + _cardStyle() + '">' + _sectionTitle('Zonas de entrega', 'Configure os CEPs atendidos e o valor de entrega de cada zona.', 'local_shipping') +
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        (!locationReady ? '<div style="border:1px solid #F1D7B8;background:#FFF8ED;border-radius:12px;padding:12px 14px;color:#7A4E13;font-size:12px;line-height:1.45;">Para cadastrar zonas, preencha antes Cidade atendida, Província / estado, País atendido e Código postal base.</div>' : '') +
        '<div style="display:none;">' +
          '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">map</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo das zonas</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">CEPs, áreas atendidas e valores por região.</div></div></div>' +
          '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + zones.length + ' zonas</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + activeZones + ' ativas</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + postalTotal + ' CEPs</span>' +
          '</div>' +
          '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">Zonas ativas com CEP duplicado não podem ser salvas.</small>' +
          '<button type="button" class="tpl-image-btn primary" data-delivery-zone-add="1"' + disabledAttr + ' style="min-height:38px;border-radius:10px;' + disabledStyle + '">+ Adicionar zona</button>' +
        '</div>' +
        '<div id="tpl-delivery-zones-list" style="display:flex;flex-direction:column;gap:12px;">' + body + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:flex-start;gap:10px;flex-wrap:wrap;">' +
          '<button type="button" class="tpl-image-btn primary" data-delivery-zone-add="1"' + disabledAttr + ' style="min-height:38px;border-radius:10px;' + disabledStyle + '">+ Adicionar zona</button>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _collectDeliveryZonesFromDom() {
    var rows = [].slice.call(document.querySelectorAll('[data-delivery-zone-row]'));
    return rows.map(function (row, idx) {
      var id = row.getAttribute('data-zone-id') || _newEntityId('zone-' + (idx + 1));
      var name = _val('tpl-zone-name-' + idx);
      var postalCodes = _deliveryZonePostalList(_val('tpl-zone-postals-' + idx));
      var deliveryFeeRaw = _val('tpl-zone-fee-' + idx);
      var deliveryFee = _moneyLike(deliveryFeeRaw);
      var active = _checked('tpl-zone-active-' + idx);
      return { id: id, name: name, postalCodes: postalCodes, deliveryFee: deliveryFee, deliveryFeeRaw: deliveryFeeRaw, active: active };
    });
  }

  function _deliveryZoneValidationError(zones) {
    var seen = {};
    for (var i = 0; i < zones.length; i += 1) {
      var zone = zones[i] || {};
      var zoneName = String(zone.name || '').trim();
      if (!zoneName) return 'Preencha o nome de todas as zonas.';
      if (!Array.isArray(zone.postalCodes) || !zone.postalCodes.length) return 'Informe pelo menos um CEP para cada zona.';
      if (!String(zone.deliveryFeeRaw || '').trim()) return 'Informe um valor de entrega válido para cada zona.';
      if (!_isValidMoneyLike(zone.deliveryFeeRaw)) return 'Informe um valor de entrega válido para cada zona.';
      if (Number(zone.deliveryFee) < 0) return 'O valor de entrega não pode ser negativo.';
      if (!zone.active) continue;
      for (var j = 0; j < zone.postalCodes.length; j += 1) {
        var postal = String(zone.postalCodes[j] || '').trim();
        if (!postal) continue;
        if (seen[postal] && seen[postal] !== zone.id) return 'O CEP ' + postal + ' já está cadastrado em outra zona ativa.';
        seen[postal] = zone.id;
      }
    }
    return '';
  }

  function _deliveryAreaMissingItems(area) {
    area = area || {};
    var missing = [];
    if (!String(area.city || '').trim()) missing.push('Cidade atendida');
    if (!String(area.province || '').trim()) missing.push('Província / estado');
    if (!_normalizeDeliveryAreaCountry(area.country || '')) missing.push('País atendido');
    if (!String(area.postalCode || '').trim()) missing.push('Código postal base');
    return missing;
  }

  function _deliveryAreaReady(area) {
    return _deliveryAreaMissingItems(area).length === 0;
  }

  function _minActiveDeliveryZoneFee(zones) {
    var fees = (Array.isArray(zones) ? zones : []).filter(function (zone) { return zone && zone.active !== false && Number(zone.deliveryFee) >= 0; }).map(function (zone) {
      return Number(zone.deliveryFee);
    }).filter(function (n) { return isFinite(n); });
    if (!fees.length) return null;
    return Math.min.apply(Math, fees);
  }

  function _deliveryZonesSummary(zones) {
    var active = (Array.isArray(zones) ? zones : []).filter(function (zone) { return zone && zone.active !== false; });
    return active.map(function (zone) {
      return zone.name || (zone.postalCodes || []).join(', ');
    }).filter(Boolean).slice(0, 8).join(', ');
  }

  function _normalizeDeliveryAreaCountry(value) {
    var v = String(value || '').trim();
    var upper = v.toUpperCase();
    var map = {
      ESPANHA: 'ES',
      ESPAÑA: 'ES',
      SPAIN: 'ES',
      ES: 'ES',
      PORTUGAL: 'PT',
      PT: 'PT',
      BRASIL: 'BR',
      BRAZIL: 'BR',
      BR: 'BR',
      FRANCA: 'FR',
      FRANÇA: 'FR',
      FRANCE: 'FR',
      FR: 'FR',
      ITALIA: 'IT',
      ITÁLIA: 'IT',
      ITALY: 'IT',
      IT: 'IT',
      ALEMANHA: 'DE',
      GERMANY: 'DE',
      DE: 'DE',
      'REINO UNIDO': 'GB',
      'UNITED KINGDOM': 'GB',
      UK: 'GB',
      GB: 'GB',
      'ESTADOS UNIDOS': 'US',
      'UNITED STATES': 'US',
      EUA: 'US',
      US: 'US',
      OTHER: 'OTHER',
      OUTRO: 'OTHER'
    };
    return map[upper] || '';
  }

  function _deliveryAreaFromConfig(tpl, zonas) {
    tpl = tpl || {};
    zonas = zonas || {};
    var area = {};
    var endereco = _storeConfig.endereco || {};
    var geral = _storeConfig.geral || {};
    var atendimentoPostal = endereco.postalCode || endereco.codigoPostal || tpl.postalCode || geral.postalCode || geral.codigoPostal || '';
    if (tpl.deliveryArea && typeof tpl.deliveryArea === 'object') area = Object.assign({}, tpl.deliveryArea);
    else if (zonas.area && typeof zonas.area === 'object') area = Object.assign({}, zonas.area);
    return {
      city: area.city || tpl.deliveryCity || zonas.deliveryCity || '',
      province: area.province || area.state || tpl.deliveryProvince || zonas.deliveryProvince || '',
      country: _normalizeDeliveryAreaCountry(area.country || tpl.deliveryCountry || zonas.deliveryCountry || ''),
      postalCode: atendimentoPostal || area.postalCode || area.zip || tpl.deliveryPostalCode || zonas.deliveryPostalCode || '',
      source: area.source || 'admin_delivery_zones'
    };
  }

  function _deliveryAreaHtml(area, end, tpl, geral, fiscal, regionLabel) {
    area = area || {};
    end = end || {};
    tpl = tpl || {};
    geral = geral || {};
    fiscal = fiscal || _fiscalInfo();
    regionLabel = regionLabel || (fiscal.cfg && fiscal.cfg.regionLabel) || 'Província/Estado';
    return '<section ' + _templatePanelAttrs('operacao') + ' style="' + _cardStyle() + '">' + _sectionTitle('Localização atendida', 'Selecione a cidade atendida antes de cadastrar as zonas de entrega. A província, país e código postal podem ser preenchidos automaticamente pela busca.', 'travel_explore') +
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="' + _operationCardStyle() + '">' +
          _operationCardHead('place', 'Localização principal', 'Preencha o endereço usado como referência da loja. O código postal daqui alimenta o Código postal base.') +
          '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
            _operationFieldHtml('tpl-address', fiscal.cfg.addressLabel || 'Endereço da loja/produção', end.address || tpl.pickupAddress || tpl.address || '', 'Rua...', 'text', '', '', '', 'width:520px;flex:1 1 420px;') +
            _operationFieldHtml('tpl-number', 'Número', end.number || end.numero || tpl.number || tpl.numero || '', 'Nº', 'text', '', '', '', 'width:110px;flex:0 0 110px;') +
            _operationFieldHtml('tpl-neighborhood', 'Bairro / Localidade', end.neighborhood || geral.neighborhood || tpl.neighborhood || '', 'Rochapea', 'text', '', '', '', 'width:220px;flex:0 0 220px;') +
            _operationFieldHtml('tpl-reference', 'Referência / complemento', end.reference || end.complemento || tpl.reference || tpl.complemento || '', 'Opcional', 'text', '', '', '', 'width:300px;flex:1 1 260px;') +
          '</div>' +
          '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
            _operationFieldHtml('tpl-city', 'Cidade', end.city || geral.city || tpl.city || '', 'Pamplona', 'text', '', '', '', 'width:220px;flex:0 0 220px;') +
            _operationFieldHtml('tpl-region', regionLabel, end.region || end.state || end.province || tpl.region || '', regionLabel, 'text', '', '', '', 'width:220px;flex:0 0 220px;') +
            _operationFieldHtml('tpl-postal', fiscal.cfg.postalCodeLabel || 'Código postal', end.postalCode || tpl.postalCode || '', '31001', 'text', '', '', '', 'width:130px;flex:0 0 130px;') +
            _operationFieldHtml('tpl-country', 'País', end.country || geral.country || tpl.country || fiscal.country, fiscal.country, 'text', '', '', '', 'width:170px;flex:0 0 170px;') +
          '</div>' +
        '</div>' +
        '<div style="' + _operationCardStyle() + '">' +
          _operationCardHead('travel_explore', 'Área atendida', 'Informe a cidade usada para organizar as zonas. Província, país e código postal vêm da localização principal.') +
          '<input id="tpl-delivery-area-province" type="hidden" value="' + _esc(area.province || end.region || end.state || end.province || tpl.region || '') + '">' +
          '<input id="tpl-delivery-area-country" type="hidden" value="' + _esc(area.country || end.country || geral.country || tpl.country || fiscal.country || '') + '">' +
          '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
            _operationFieldHtml('tpl-delivery-area-city', 'Cidade atendida', area.city || end.city || geral.city || tpl.city || '', 'Buscar cidade atendida', 'text', '', '', '', 'width:260px;flex:0 1 260px;') +
            _operationFieldHtml('tpl-delivery-area-postal', 'Código postal base', area.postalCode || end.postalCode || tpl.postalCode || '', 'Código postal', 'text', 'background:#F4F0EA;color:#6F6860;cursor:not-allowed;', 'Vem da localização principal.', 'readonly disabled aria-readonly="true"', 'width:150px;flex:0 0 150px;') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _collectDeliveryAreaFromDom(currentArea) {
    currentArea = currentArea || {};
    return {
      city: _val('tpl-delivery-area-city') || currentArea.city || '',
      province: _val('tpl-delivery-area-province') || currentArea.province || '',
      country: _normalizeDeliveryAreaCountry(_val('tpl-delivery-area-country') || currentArea.country || ''),
      postalCode: _val('tpl-delivery-area-postal') || _val('tpl-postal') || currentArea.postalCode || '',
      source: 'admin_delivery_zones',
      updatedAt: new Date().toISOString()
    };
  }

  function _addDeliveryZoneRow() {
    _templateActiveTab = 'operacao';
    var deliveryArea = _collectDeliveryAreaFromDom(_deliveryAreaFromConfig(_storeConfig.template || {}, _storeConfig.zonas || {}));
    var missing = _deliveryAreaMissingItems(deliveryArea);
    if (missing.length) {
      UI.toast('Antes de adicionar zonas, preencha: ' + missing.join(', ') + '.', 'error');
      return;
    }
    _deliveryZonesDraft = _collectDeliveryZonesFromDom();
    _deliveryZonesDraft.push({
      id: _newEntityId('zone'),
      name: '',
      postalCodes: [],
      deliveryFee: '',
      deliveryFeeRaw: '',
      active: true
    });
    _deliveryZonesDraftDirty = true;
    _renderTemplateLoja();
  }

  function _removeDeliveryZoneRow(zoneId) {
    var proceed = function (yes) {
      if (!yes) return;
      _deliveryZonesDraft = _collectDeliveryZonesFromDom().filter(function (zone) {
        return String(zone.id || '') !== String(zoneId || '');
      });
      _templateActiveTab = 'operacao';
      _deliveryZonesDraftDirty = true;
      _renderTemplateLoja();
      _saveDeliveryZonesOnly();
    };
    if (window.UI && typeof UI.confirm === 'function') UI.confirm('Excluir esta zona de entrega?').then(proceed);
    else proceed(window.confirm('Excluir esta zona de entrega?'));
  }

  function _saveDeliveryZonesOnly() {
    var deliveryArea = _collectDeliveryAreaFromDom(_deliveryAreaFromConfig(_storeConfig.template || {}, _storeConfig.zonas || {}));
    var missingArea = _deliveryAreaMissingItems(deliveryArea);
    if (missingArea.length) {
      UI.toast('Antes de salvar zonas, preencha: ' + missingArea.join(', ') + '.', 'error');
      return;
    }
    var err = _deliveryZoneValidationError(_deliveryZonesDraft);
    if (err) { UI.toast(err, 'error'); return; }
    var zones = _normalizeDeliveryZones(_deliveryZonesDraft);
    var template = Object.assign({}, _storeConfig.template || {}, {
      deliveryArea: deliveryArea,
      deliveryCity: deliveryArea.city,
      deliveryProvince: deliveryArea.province,
      deliveryCountry: deliveryArea.country,
      deliveryPostalCode: deliveryArea.postalCode,
      deliveryZones: zones,
      updatedAt: new Date().toISOString()
    });
    var zonas = Object.assign({}, _storeConfig.zonas || {}, { area: deliveryArea, list: zones, deliveryZones: zones });
    Promise.all([
      DB.setDocRoot('config', 'template', template),
      DB.setDocRoot('config', 'zonas', zonas)
    ]).then(function () {
      _storeConfig.template = template;
      _storeConfig.zonas = zonas;
      _deliveryZonesDraft = zones;
      _deliveryZonesDraftDirty = false;
      UI.toast('Zona removida e salva.', 'info');
      _refreshTemplatePreview();
    }).catch(function (err) {
      UI.toast('Erro ao salvar zonas: ' + err.message, 'error');
    });
  }

  function _renderTemplateLoja() {
    var preserveDeliveryZonesDraft = _deliveryZonesDraftDirty;
    Promise.all([
      _loadStoreConfig(),
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('produtos').catch(function () { return []; }),
      DB.getAll('produtos_prontos').catch(function () { return []; }),
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('categories').catch(function () { return []; }),
      DB.getAll('coupons').catch(function () { return []; }),
      DB.getAll('promotions').catch(function () { return []; }),
      DB.getAll('promocoes').catch(function () { return []; }),
      DB.getAll('orders').catch(function () { return []; })
    ]).then(function (results) {
      if (window.sessionStorage && sessionStorage.getItem('bf_stripe_connect_refresh') === '1') {
        _templateActiveTab = 'checkout';
      }
      var productList = results[1] || [];
      var marketingProductSources = []
        .concat(results[1] || [])
        .concat(results[2] || [])
        .concat(results[3] || [])
        .concat(results[4] || []);
      _categories = (results[5] || []).slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0) || String(a.name || a.label || '').localeCompare(String(b.name || b.label || ''));
      });
      _coupons = results[6] || [];
      _promotions = _mergeTemplatePromotions([
        results[7] || [],
        results[8] || [],
        marketingProductSources.map(_deriveTemplatePromotionFromProduct).filter(Boolean)
      ]);
      _orders = results[9] || [];
      _products = productList.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      _ensureTemplateStyles();
      var geral = _storeConfig.geral || {};
      var app = _storeConfig.aparencia || {};
      var tpl = _storeConfig.template || {};
      var integracoes = _storeConfig.integracoes || {};
      var end = _storeConfig.endereco || {};
      var pay = _storeConfig.pagamentos || {};
      var financeiro = _storeConfig.financeiro || {};
      var pointsCfg = _storeConfig.pontos_program || {};
      var pointsProgramConfigured = !!(pointsCfg && Object.keys(pointsCfg).length);
      var pointsProgramActive = pointsProgramConfigured && pointsCfg.active !== false && String(pointsCfg.active).toLowerCase() !== 'false';
      var hor = _storeConfig.horarios || {};
      var zonas = _storeConfig.zonas || {};
      var inheritedWhatsapp = tpl.whatsapp || geral.whatsapp || integracoes.whatsappFull || integracoes.whatsapp || geral.phone || '';
      var inheritedInstagram = tpl.instagram || geral.instagram || integracoes.instagram || '';
      var inheritedFacebook = tpl.facebook || geral.facebook || integracoes.facebook || '';
      var inheritedTiktok = tpl.tiktok || geral.tiktok || integracoes.tiktok || '';
      var fiscal = _fiscalInfo();
      var regionLabel = fiscal.cfg.regionLabel || (fiscal.code === 'PT' ? 'Distrito' : 'Província/Estado');
      var rawStatusMode = tpl.statusMode || (tpl.manualClosed || tpl.manualOpen ? 'manual' : 'auto');
      var statusMode = rawStatusMode === 'manual' || rawStatusMode === 'manual_closed' || rawStatusMode === 'manual_open' ? 'manual' : 'auto';
      var manualStatusClosed = rawStatusMode === 'manual_closed' || tpl.manualClosed === true;
      var days = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
      var hoursHtml = days.map(function (d, idx) {
        var row = (hor.days && hor.days[idx]) || (tpl.hours && tpl.hours[idx]) || {};
        var rowClosed = _boolValue(row.closed) === true || _boolValue(row.enabled) === false;
        var rowSecondClosed = _boolValue(row.closed2) === true;
        return '<div class="tpl-hours-day" data-hours-day="' + idx + '">' +
          '<div class="tpl-hours-day-main">' +
            '<div class="tpl-hours-day-name">' + d + '</div>' +
            '<div class="tpl-hours-day-closed-toggle">' + _toggleHtml('tpl-h-closed-' + idx, 'Fechada', rowClosed, '') + '</div>' +
            '<div class="tpl-hours-day-field" data-hours-main-field>' + _fieldHtml('tpl-h-open-' + idx, 'Abre', row.open || '', '10:00', 'time') + '</div>' +
            '<div class="tpl-hours-day-field" data-hours-main-field>' + _fieldHtml('tpl-h-close-' + idx, 'Fecha', row.close || '', '22:00', 'time') + '</div>' +
            '<input id="tpl-h-enabled2-' + idx + '" type="checkbox" style="display:none;"' + ((!rowSecondClosed && row.open2 && row.close2) ? ' checked' : '') + '>' +
          '</div>' +
          '<div class="tpl-hours-day-main tpl-hours-day-main--second" data-hours-secondary-fields>' +
            '<div class="tpl-hours-day-name">' + d + ' · 2º período</div>' +
            '<div class="tpl-hours-day-closed-toggle">' + _toggleHtml('tpl-h-closed2-' + idx, 'Fechada', rowSecondClosed, '') + '</div>' +
            '<div class="tpl-hours-day-field">' +
              _fieldHtml('tpl-h-open2-' + idx, 'Abre 2', row.open2 || '', '18:00', 'time') +
            '</div>' +
            '<div class="tpl-hours-day-field">' +
              _fieldHtml('tpl-h-close2-' + idx, 'Fecha 2', row.close2 || '', '22:00', 'time') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      var logo = app.logoUrl || geral.logoUrl || tpl.logoUrl || '';
      var banner = app.coverImageUrl || geral.coverImageUrl || tpl.coverImageUrl || app.bannerUrl || geral.bannerUrl || tpl.bannerUrl || '';
      var bannerMobile = app.coverImageMobileUrl || geral.coverImageMobileUrl || tpl.coverImageMobileUrl || app.mobileCoverImageUrl || geral.mobileCoverImageUrl || tpl.mobileCoverImageUrl || app.bannerMobileUrl || geral.bannerMobileUrl || tpl.bannerMobileUrl || '';
      var featuredType = tpl.featuredActionType === 'featured_product' ? 'none' : (tpl.featuredActionType || 'none');
      var featuredTarget = featuredType === 'custom' ? (tpl.featuredActionTarget || '') : '';
      var featuredCouponId = tpl.featuredActionCouponId || tpl.featuredCouponId || '';
      var featuredPromotionId = tpl.featuredActionPromotionId || tpl.featuredPromotionId || '';
      var featuredImageUrl = _cleanPublicUrl(tpl.featuredActionImageUrl || tpl.featuredImageUrl || '');
      var mostOrderedMode = tpl.mostOrderedMode || tpl.featuredMostOrderedMode || 'auto';
      var mobilePromoTarget = tpl.mobilePromoBannerTarget || tpl.promoBannerTarget || ((tpl.mobilePromoBannerProductId || tpl.promoBannerProductId) ? 'product' : 'promotion');
      var mobilePromoPromotionId = tpl.mobilePromoBannerPromotionId || tpl.promoBannerPromotionId || tpl.mobilePromoPromotionId || '';
      var mobilePromoProductId = tpl.mobilePromoBannerProductId || tpl.promoBannerProductId || '';
      var mostOrderedAuto = _mostOrderedProductFromOrders();
      var productOptions = [{ value: '', label: 'Selecionar produto' }].concat((_products || []).filter(function (p) { return p && p.menuVisible !== false; }).map(function (p) {
        return { value: String(p.id), label: p.name || p.title || String(p.id) };
      }));
      var showcaseIds = (Array.isArray(tpl.featuredProductIds) ? tpl.featuredProductIds : (Array.isArray(tpl.highlightProductIds) ? tpl.highlightProductIds : [])).map(function (id) { return String(id || ''); }).filter(Boolean).slice(0, 3);
      var featuredSelectedId = tpl.featuredActionProductId || tpl.featuredProductId || tpl.mostOrderedProductId || '';
      var prepTimeValue = String(tpl.prepTime || tpl.averagePrepTime || '45').replace(/\s*min$/i, '').trim();
      var deliveryTimeValue = String(tpl.deliveryTime || tpl.averageDeliveryTime || '30-45').replace(/\s*min$/i, '').trim();
      var ordersPerHourValue = String(tpl.maxOrdersPerSlot || tpl.ordersPerHour || '12').trim();
      var advanceDaysValue = String(tpl.maxAdvanceDays || tpl.advanceDaysLimit || '6').trim();
      var pickupEnabled = tpl.pickupEnabled !== false;
      var deliveryEnabled = tpl.deliveryEnabled !== false;
      var mainCard = _mainCardConfigFromTemplate(tpl);
      var contactDisplay = _contactDisplayConfigFromTemplate(tpl);
      var paymentMethods = _templatePaymentMethods(financeiro, pay, tpl, integracoes);
      var deliveryArea = _deliveryAreaFromConfig(tpl, zonas);
      if (!preserveDeliveryZonesDraft) {
        _deliveryZonesDraft = _normalizeDeliveryZones(
          Array.isArray(tpl.deliveryZones) && tpl.deliveryZones.length
            ? tpl.deliveryZones
            : (Array.isArray(zonas.list) && zonas.list.length ? zonas.list : (Array.isArray(zonas.deliveryZones) && zonas.deliveryZones.length ? zonas.deliveryZones : []))
        );
      }
      var prepTimeOptions = [
        { value: '15', label: '15 min' },
        { value: '20', label: '20 min' },
        { value: '25', label: '25 min' },
        { value: '30', label: '30 min' },
        { value: '35', label: '35 min' },
        { value: '40', label: '40 min' },
        { value: '45', label: '45 min' },
        { value: '50', label: '50 min' },
        { value: '60', label: '60 min' },
        { value: '75', label: '75 min' },
        { value: '90', label: '90 min' }
      ];
      var deliveryTimeOptions = [
        { value: '15-20', label: '15-20 min' },
        { value: '20-30', label: '20-30 min' },
        { value: '30-45', label: '30-45 min' },
        { value: '45-60', label: '45-60 min' },
        { value: '60-75', label: '60-75 min' },
        { value: '75-90', label: '75-90 min' }
      ];
      var chipStyle = 'display:inline-flex;align-items:center;min-height:25px;padding:0 10px;border-radius:999px;background:#FFFDFC;border:1px solid #E9DDD7;color:#6F625C;font-size:11px;font-weight:650;box-shadow:0 1px 2px rgba(80,42,28,.03);';
      var identityName = geral.businessName || tpl.publicName || 'Boca Food';
      var identityText = geral.slogan || tpl.slogan || 'Adicione uma apresentação curta.';
      var identityColor = _normalizeHexColor(tpl.brandColor || tpl.primaryColor || geral.primaryColor || '#B42318') || '#B42318';
      var content = document.getElementById('catalogo-content');
      content.innerHTML =
        '<div class="bf-page tpl-config-page" style="padding:0;display:flex;flex-direction:column;font-family:Manrope,Inter,sans-serif;">' +
        '<div class="tpl-config-head">' +
          '<div style="min-width:0;flex:1 1 420px;"><h2 class="tpl-config-title">Template da loja</h2><p class="tpl-config-subtitle">Organize a aparência, os canais e os textos que aparecem na página pública do seu negócio.</p><div class="tpl-config-status"><span class="tpl-config-chip" data-template-summary="logo">' + (logo ? 'Logo configurada' : 'Sem logo') + '</span><span class="tpl-config-chip" data-template-summary="cover">' + (banner ? 'Capa configurada' : 'Sem capa') + '</span><span class="tpl-config-chip" data-template-summary="delivery">' + (deliveryEnabled ? 'Entrega ativa' : 'Entrega inativa') + '</span><span class="tpl-config-chip" data-template-summary="pickup">' + (pickupEnabled ? 'Retirada ativa' : 'Retirada inativa') + '</span></div></div>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;"><button type="button" class="tpl-config-save" data-save-template-loja="1">Salvar alterações</button></div>' +
        '</div>' +
        _templateSubtabsHtml(_templateActiveTab || 'identidade') +
        '<div style="display:flex;flex-direction:column;gap:14px;">' +
            '<div data-template-panel="identidade" class="tpl-identity-workspace' + (((_templateActiveTab || 'identidade') === 'identidade') ? ' active' : '') + '">' +
            '<div class="tpl-identity-left">' +
            '<section class="tpl-config-panel" style="' + _cardStyle() + '">' + _sectionTitle('Identidade visual', '', 'palette') +
              '<input id="tpl-verified-badge" type="checkbox" style="display:none;"' + ((tpl.verifiedBadgeEnabled === true || tpl.storeVerified === true) ? ' checked' : '') + '>' +
              '<input id="tpl-public-name" type="hidden" value="' + _esc(identityName) + '">' +
              '<div class="tpl-identity-layout">' +
                '<div class="tpl-identity-main">' +
                  '<div class="tpl-brand-preview">' +
                    '<div class="tpl-brand-preview-logo">' + (logo ? '<img src="' + _esc(_cleanPublicUrl(logo)) + '" alt="">' : '<span class="mi" style="font-size:25px;">storefront</span>') + '</div>' +
                    '<div style="min-width:0;"><div class="tpl-brand-preview-name">' + _esc(identityName) + '</div><div class="tpl-brand-preview-text">' + _esc(identityText) + '</div><div class="tpl-brand-preview-accent" style="background:' + _esc(identityColor) + ';"></div></div>' +
                  '</div>' +
                  '<div class="tpl-identity-main-grid">' +
                    '<label class="tpl-field-full" style="display:block;"><span style="' + _labelStyle() + '">Apresentação curta</span><textarea id="tpl-slogan" rows="3" style="' + _inputStyle() + 'min-height:86px;resize:vertical;line-height:1.45;">' + _esc(geral.slogan || tpl.slogan || '') + '</textarea><small class="tpl-identity-help">Uma frase curta para apresentar sua loja na página pública.</small></label>' +
                    '<label style="display:block;"><span style="' + _labelStyle() + '">Idioma principal da loja</span><span class="tpl-language-wrap"><select id="tpl-language" class="tpl-language-select" style="' + _inputStyle() + 'padding-right:42px;appearance:none;-webkit-appearance:none;-moz-appearance:none;background:#fff;">' + _templateLanguageOptions().map(function (o) { return '<option value="' + _esc(o.value) + '"' + (String(_normalizeTemplateLanguage(geral.language || geral.defaultLanguage || tpl.language || 'es-ES')) === String(o.value) ? ' selected' : '') + '>' + _esc(o.label) + '</option>'; }).join('') + '</select><span class="mi tpl-language-arrow">expand_more</span></span><small class="tpl-identity-help">Idioma usado nos textos principais da loja pública.</small></label>' +
                    '<div>' + _colorFieldHtml('tpl-primary-color', 'Cor da marca', tpl.brandColor || tpl.primaryColor || geral.primaryColor || '#B42318', 'Cor da marca usada em botões e destaques.') + '<small class="tpl-identity-help">Use uma cor que combine com a identidade da sua marca.</small></div>' +
                    '<div class="tpl-field-full tpl-identity-files">' +
                      _imageConfigHtml('logo', { hideUrl: true, cardClass: 'tpl-image-card--logo', previewClass: 'tpl-image-preview--logo', fit: 'contain', fileId: 'tpl-logo-file', urlId: 'tpl-logo-url', previewId: 'tpl-preview-logo', placeholderId: 'tpl-preview-logo-placeholder', label: 'Logo da loja', value: logo, note: 'Tamanho recomendado: 500 × 500 px. Use JPG, PNG ou WebP.', accept: 'image/png,image/jpeg,image/jpg,image/webp' }) +
                      _imageConfigHtml('favicon', { hideUrl: true, hidePreview: true, cardClass: 'tpl-image-card--favicon', previewClass: 'tpl-image-preview--favicon', fit: 'contain', fileId: 'tpl-favicon-file', urlId: 'tpl-favicon-url', previewId: 'tpl-preview-favicon', placeholderId: 'tpl-preview-favicon-placeholder', label: 'Favicon', value: _cleanPublicUrl(tpl.faviconUrl || geral.faviconUrl || app.faviconUrl || ''), note: 'Favicon recomendado: 32 × 32 px. Use PNG, JPG ou WebP.', accept: 'image/png,image/jpeg,image/jpg,image/webp', extraHtml: '<div class="tpl-image-browser-tab" style="margin-top:12px;"><span class="tpl-image-browser-icon"><img id="tpl-preview-favicon-tab-icon" src="' + _esc(_cleanPublicUrl(tpl.faviconUrl || geral.faviconUrl || app.faviconUrl || '')) + '" alt="" style="display:' + (_cleanPublicUrl(tpl.faviconUrl || geral.faviconUrl || app.faviconUrl || '') ? 'block' : 'none') + ';"></span><span class="tpl-image-browser-text">Aba</span></div>' }) +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section class="tpl-config-panel" style="' + _cardStyle() + '">' + _sectionTitle('Card principal da loja', '', 'view_quilt') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">view_quilt</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo do card</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Controle o que aparece no primeiro card visto pelo cliente.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span class="tpl-config-chip" data-template-summary="maincard-identity">' + (mainCard.showLogo || mainCard.showStoreName || mainCard.showSlogan ? 'Identidade ativa' : 'Identidade oculta') + '</span>' +
                    '<span class="tpl-config-chip" data-template-summary="maincard-status">' + (mainCard.showLocation || mainCard.showStoreStatus || mainCard.showOpeningHoursSummary ? 'Status visível' : 'Status oculto') + '</span>' +
                    '<span class="tpl-config-chip" data-template-summary="maincard-channels">' + (mainCard.showPickup || mainCard.showDelivery ? 'Canais visíveis' : 'Canais ocultos') + '</span>' +
                  '</div>' +
                '</div>' +
                '<div class="tpl-maincard-layout">' +
                '<div class="tpl-maincard-controls" style="display:flex;flex-direction:column;gap:12px;">' +
                  '<div class="tpl-maincard-columns">' +
                    '<div class="tpl-maincard-column">' +
                      '<div class="tpl-maincard-column-title">Identidade</div>' +
                        _toggleHtml('tpl-maincard-show-logo', 'Logo', mainCard.showLogo, '') +
                        _toggleHtml('tpl-maincard-show-name', 'Nome da loja', mainCard.showStoreName, '') +
                        _toggleHtml('tpl-maincard-show-slogan', 'Slogan/frase curta', mainCard.showSlogan, '') +
                        _toggleHtml('tpl-maincard-show-rating', 'Nota de avaliação', mainCard.showRating, '') +
                        _toggleHtml('tpl-maincard-show-more-info', 'Botão “Mais informação”', mainCard.showMoreInfoButton, '') +
                    '</div>' +
                    '<div class="tpl-maincard-column">' +
                      '<div class="tpl-maincard-column-title">Localização</div>' +
                        _toggleHtml('tpl-maincard-show-location', 'Cidade/localização', mainCard.showLocation, '') +
                        _toggleHtml('tpl-maincard-show-status', 'Status da loja', mainCard.showStoreStatus, '') +
                        _toggleHtml('tpl-maincard-show-hours', 'Horário resumido', mainCard.showOpeningHoursSummary, '') +
                    '</div>' +
                    '<div class="tpl-maincard-column">' +
                      '<div class="tpl-maincard-column-title">Atendimento</div>' +
                        _toggleHtml('tpl-maincard-show-pickup', 'Retirada', mainCard.showPickup, '') +
                        _toggleHtml('tpl-maincard-show-delivery', 'Entrega', mainCard.showDelivery, '') +
                        _toggleHtml('tpl-maincard-show-prep', 'Tempo de preparo', mainCard.showPreparationTime, '') +
                    '</div>' +
                    '<div class="tpl-maincard-column">' +
                      '<div class="tpl-maincard-column-title">Pedido</div>' +
                        _toggleHtml('tpl-maincard-show-delivery-time', 'Tempo de entrega', mainCard.showDeliveryTime, '') +
                        _toggleHtml('tpl-maincard-show-min-order', 'Pedido mínimo', mainCard.showMinimumOrder, '') +
                        _toggleHtml('tpl-maincard-show-advance-days', 'Antecedência mínima', mainCard.showAdvanceDays, '') +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section class="tpl-config-panel" style="' + _cardStyle() + '">' + _sectionTitle('Imagem de capa', '', 'wallpaper') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div id="tpl-cover-config" style="padding:14px;border:1px solid #EAE4DA;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(31,31,31,.03);display:flex;flex-direction:column;gap:12px;">' +
                  '<div style="display:flex;align-items:flex-start;justify-content:flex-start;gap:12px;flex-wrap:wrap;">' +
                    _premiumSwitchHtml('tpl-top-use-cover', 'Mostrar imagem de capa', tpl.topUseCover !== false, '') +
                  '</div>' +
                  '<div id="tpl-cover-settings" style="display:' + (tpl.topUseCover !== false ? 'grid' : 'none') + ';grid-template-columns:minmax(260px,1.1fr) minmax(220px,.9fr);gap:12px;align-items:start;">' +
                    '<div style="display:flex;flex-direction:column;gap:12px;">' +
                      _imageConfigHtml('bannerDesktop', { hideUrl: true, fileId: 'tpl-banner-desktop-file', urlId: 'tpl-banner-url', previewId: 'tpl-preview-banner-desktop', placeholderId: 'tpl-preview-banner-desktop-placeholder', label: 'Imagem de capa desktop', value: banner, placeholder: 'Sem imagem de capa desktop', note: 'Tamanho recomendado: 1600 × 520 px. Use uma imagem horizontal para o topo da loja.' }) +
                      _imageConfigHtml('bannerMobile', { hideUrl: true, fileId: 'tpl-banner-mobile-file', urlId: 'tpl-banner-mobile-url', previewId: 'tpl-preview-banner-mobile', placeholderId: 'tpl-preview-banner-mobile-placeholder', label: 'Imagem de capa mobile', value: bannerMobile, placeholder: 'Sem imagem de capa mobile', note: 'Tamanho recomendado: 1080 × 720 px. Use uma imagem que continue bonita em tela vertical.' }) +
                    '</div>' +
                    '<div style="display:flex;flex-direction:column;gap:12px;">' +
                      _colorFieldHtml('tpl-banner-overlay-color', 'Cor da sobreposição da capa', tpl.bannerOverlayColor || tpl.coverOverlayColor || tpl.heroOverlayColor || '#000000', 'Prévia da sobreposição da capa') +
                      _opacityFieldHtml('tpl-banner-overlay-opacity', 'Opacidade da sobreposição (%)', tpl.bannerOverlayOpacity != null ? tpl.bannerOverlayOpacity : (tpl.bannerOverlayTransparency != null ? (100 - Number(tpl.bannerOverlayTransparency)) : 14)) +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<input id="tpl-top-promo-enabled" type="checkbox" style="display:none;">' +
            '<input id="tpl-mobile-promo-banner-enabled" type="checkbox" style="display:none;">' +
            '<input id="tpl-top-promo-closable" type="checkbox" style="display:none;"' + (tpl.topPromoClosable !== false ? ' checked' : '') + '>' +
            '<input id="tpl-top-promo-text" type="hidden" value="' + _esc(tpl.topPromoText || '') + '">' +
            '<input id="tpl-top-promo-color" type="hidden" value="' + _esc(tpl.topPromoColor || '#B42318') + '">' +
            '<input id="tpl-top-promo-text-color" type="hidden" value="' + _esc(tpl.topPromoTextColor || tpl.promoBannerTextColor || tpl.bannerPromoTextColor || '#FFFFFF') + '">' +
            '<input id="tpl-mobile-promo-banner-url" type="hidden" value="' + _esc(tpl.mobilePromoBannerImageUrl || tpl.promoBannerImageUrl || tpl.promotionalBannerImageUrl || '') + '">' +
            '<input id="tpl-desktop-promo-banner-url" type="hidden" value="' + _esc(tpl.desktopPromoBannerImageUrl || tpl.promoBannerDesktopImageUrl || '') + '">' +
            '<input id="tpl-mobile-promo-banner-badge" type="hidden" value="' + _esc(tpl.mobilePromoBannerBadge || tpl.promoBannerBadge || '') + '">' +
            '<input id="tpl-mobile-promo-banner-title" type="hidden" value="' + _esc(tpl.mobilePromoBannerTitle || tpl.promoBannerTitle || '') + '">' +
            '<input id="tpl-mobile-promo-banner-text" type="hidden" value="' + _esc(tpl.mobilePromoBannerText || tpl.promoBannerSubtitle || '') + '">' +
            '<input id="tpl-mobile-promo-banner-button" type="hidden" value="' + _esc(tpl.mobilePromoBannerButtonText || tpl.promoBannerButtonText || '') + '">' +
            '<input id="tpl-mobile-promo-banner-promotion" type="hidden" value="' + _esc(mobilePromoPromotionId) + '">' +
            '<input id="tpl-mobile-promo-banner-product" type="hidden" value="' + _esc(mobilePromoProductId) + '">' +
            '<input id="tpl-mobile-promo-banner-target" type="hidden" value="' + _esc(mobilePromoTarget) + '">' +
            '<input id="tpl-top-show-region" type="checkbox" style="display:none;"' + (tpl.topShowRegion !== false ? ' checked' : '') + '>' +
            '<input id="tpl-top-more-info" type="checkbox" style="display:none;"' + (tpl.topShowMoreInfo !== false ? ' checked' : '') + '>' +
            '<input id="tpl-top-chips" type="checkbox" style="display:none;"' + (tpl.topShowChips !== false ? ' checked' : '') + '>' +
            '</div>' +
            '<aside class="tpl-maincard-preview-shell">' +
              '<div class="tpl-maincard-preview-phone">' +
                '<div id="tpl-maincard-preview-hero" class="tpl-maincard-preview-hero" style="' + (bannerMobile || banner ? 'background-image:linear-gradient(180deg,rgba(28,18,10,.20) 0%,rgba(28,18,10,.03) 54%,rgba(255,250,243,0) 100%),url(&quot;' + _esc(_cleanPublicUrl(bannerMobile || banner)) + '&quot;);' : '') + '">' +
                  '<div class="tpl-maincard-preview-nav"><div class="tpl-maincard-preview-nav-left"><span class="tpl-maincard-preview-circle">‹</span><span class="tpl-maincard-preview-pill"><span id="tpl-maincard-preview-avatar" class="tpl-maincard-preview-avatar"><svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg></span>Entrar</span></div><div class="tpl-maincard-preview-nav-side"><span class="tpl-maincard-preview-circle"><span class="mi" style="font-size:15px;">search</span></span><span class="tpl-maincard-preview-circle"><span class="mi" style="font-size:15px;">shopping_bag</span></span></div></div>' +
                  '<div class="tpl-maincard-preview-card">' +
                    '<div class="tpl-maincard-preview-head">' +
                      '<div id="tpl-maincard-preview-logo" class="tpl-maincard-preview-logo">' + (logo ? '<img src="' + _esc(_cleanPublicUrl(logo)) + '" alt="">' : '<span class="mi" style="font-size:25px;">storefront</span>') + '</div>' +
                      '<div class="tpl-maincard-preview-copy">' +
                        '<div id="tpl-maincard-preview-name" class="tpl-maincard-preview-name">' + _esc(identityName) + '</div>' +
                        '<div id="tpl-maincard-preview-slogan" class="tpl-maincard-preview-slogan">' + _esc(identityText) + '</div>' +
                        '<div id="tpl-maincard-preview-facts" class="tpl-maincard-preview-facts"></div>' +
                        '<div id="tpl-maincard-preview-chips" class="tpl-maincard-preview-chips"></div>' +
                        '<span id="tpl-maincard-preview-more" class="tpl-maincard-preview-more">Mais informações ›</span>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</aside>' +
            '</div>' +
            '<section ' + _templatePanelAttrs('vitrine') + ' style="' + _cardStyle() + '">' + _sectionTitle('Ordem das categorias', 'Arraste para definir a sequência que aparece no menu e nas seções da loja pública.', 'swap_vert') +
              '<div style="display:grid;gap:12px;">' +
                _templateCategoryOrderHtml() +
              '</div>' +
            '</section>' +
            '<section ' + _templatePanelAttrs('vitrine') + ' style="' + _cardStyle() + '">' + _sectionTitle('Programa de pontos', 'O card público usa as regras configuradas em Ações de Vendas → Programa de Pontos.', 'loyalty') +
              '<div style="padding:14px;border:1px solid #EAE4DA;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(31,31,31,.03);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;">' +
                '<div style="min-width:0;">' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px;">' +
                    '<span style="' + chipStyle + '">' + (pointsProgramActive ? 'Ativo no público' : 'Oculto no público') + '</span>' +
                    '<span style="' + chipStyle + '">' + _esc(pointsCfg.programName || 'Programa de Pontos') + '</span>' +
                  '</div>' +
                  '<div style="font-size:13px;font-weight:760;color:#1F1F1F;line-height:1.25;">' + _esc(pointsCfg.programName || 'Programa de Pontos') + '</div>' +
                  '<div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:4px;">' + _esc(pointsCfg.storeText || 'Configure o texto e as regras do programa no módulo de pontos. O card da loja pública será atualizado automaticamente.') + '</div>' +
                  '<div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:8px;">' + _esc((pointsCfg.earnPerEuro || 1) + ' ponto(s) a cada €1 · ' + (pointsCfg.redeemRate || 10) + ' pontos = €1 de desconto') + '</div>' +
                '</div>' +
                '<button type="button" onclick="Router.navigate(\'marketing/pontos\')" style="height:38px;padding:0 14px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:12px;font-weight:760;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);white-space:nowrap;">Configurar pontos</button>' +
              '</div>' +
            '</section>' +
            '<input id="tpl-featured-enabled" type="checkbox" style="display:none;"' + (tpl.featuredActionEnabled ? ' checked' : '') + '>' +
            '<input id="tpl-featured-type" type="hidden" value="' + _esc(featuredType) + '">' +
            '<input id="tpl-featured-image-url" type="hidden" value="' + _esc(featuredImageUrl) + '">' +
            '<input id="tpl-featured-kicker" type="hidden" value="' + _esc(tpl.featuredActionKicker || tpl.featuredKicker || '') + '">' +
            '<input id="tpl-featured-title" type="hidden" value="' + _esc(tpl.featuredActionTitle || '') + '">' +
            '<input id="tpl-featured-text" type="hidden" value="' + _esc(tpl.featuredActionText || '') + '">' +
            '<input id="tpl-featured-button-common" type="hidden" value="' + _esc(tpl.featuredActionButtonLabel || '') + '">' +
            '<input id="tpl-featured-product" type="hidden" value="' + _esc(featuredType === 'featured_product' ? featuredSelectedId : '') + '">' +
            '<input id="tpl-featured-most-ordered-product" type="hidden" value="' + _esc(featuredType === 'most_ordered' ? featuredSelectedId : '') + '">' +
            '<input id="tpl-most-ordered-mode" type="hidden" value="' + _esc(mostOrderedMode) + '">' +
            '<input id="tpl-featured-coupon" type="hidden" value="' + _esc(featuredCouponId) + '">' +
            '<input id="tpl-featured-promotion" type="hidden" value="' + _esc(featuredPromotionId) + '">' +
            '<input id="tpl-featured-target" type="hidden" value="' + _esc(featuredTarget) + '">' +
            '<section ' + _templatePanelAttrs('operacao') + ' style="' + _cardStyle() + '">' + _sectionTitle('Entrega e retirada', 'Defina como o cliente recebe o pedido e quais prazos aparecem no checkout.', 'delivery_dining') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">local_shipping</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo operacional</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Canais e prazos que aparecem na loja.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span data-template-summary="pickup" style="' + chipStyle + '">' + (pickupEnabled ? 'Retirada ativa' : 'Retirada inativa') + '</span>' +
                    '<span data-template-summary="delivery" style="' + chipStyle + '">' + (deliveryEnabled ? 'Entrega ativa' : 'Entrega inativa') + '</span>' +
                    '<span data-template-summary="prep-time" style="' + chipStyle + '">' + (prepTimeValue || '45') + ' min preparo</span>' +
                    '<span data-template-summary="orders-hour" style="' + chipStyle + '">' + (ordersPerHourValue || '12') + ' pedidos/h</span>' +
                  '</div>' +
                  '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">Essas informações alimentam os chips e o resumo do topo da loja.</small>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                  '<div style="display:flex;gap:12px;align-items:stretch;flex-wrap:wrap;">' +
                    '<div style="width:220px;flex:0 0 220px;min-height:100%;display:flex;flex-direction:column;gap:13px;padding:4px 2px;">' +
                      _operationCardHead('room_service', 'Modos de atendimento', 'Escolha o que fica disponível para o cliente no carrinho.') +
                      '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;">' +
                        _operationCheckHtml('tpl-pickup-enabled', 'Retirada', pickupEnabled, '') +
                        _operationCheckHtml('tpl-delivery-enabled', 'Entrega', deliveryEnabled, '') +
                      '</div>' +
                    '</div>' +
                    '<div style="' + _operationCardStyle('width:455px;flex:0 1 455px;min-height:100%;') + '">' +
                      _operationCardHead('timer', 'Prazos e capacidade', 'Configure quando a loja pode receber pedidos e quanto consegue atender por horário.') +
                      '<div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;">' +
                        _operationFieldHtml('tpl-max-advance-days', 'Antecedência', advanceDaysValue, '0', 'number', '', '0 permite pedidos para hoje.', 'min="0" step="1"', 'width:110px;flex:0 0 110px;') +
                        _operationSelectHtml('tpl-prep-time', 'Tempo de preparo', prepTimeValue, prepTimeOptions, '', 'width:160px;flex:0 0 160px;') +
                        _operationFieldHtml('tpl-orders-per-hour', 'Pedidos/hora', ordersPerHourValue, '12', 'number', '', 'Limite por horário.', 'min="1" step="1"', 'width:110px;flex:0 0 110px;') +
                      '</div>' +
                    '</div>' +
                    '<div id="tpl-delivery-settings-wrap" style="' + _operationCardStyle('display:' + (deliveryEnabled ? 'flex' : 'none') + ';width:350px;flex:0 1 350px;min-height:100%;') + '">' +
                    _operationCardHead('delivery_dining', 'Entrega', 'Defina os valores e prazos usados quando a entrega estiver ativa.') +
                    '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
                      _operationMoneyFieldHtml('tpl-min-delivery', 'Pedido mínimo', tpl.minDeliveryOrder || '', 'Só para entrega.', 'width:132px;flex:0 0 132px;') +
                      _operationSelectHtml('tpl-delivery-time', 'Tempo de entrega', deliveryTimeValue, deliveryTimeOptions, '', 'width:170px;flex:0 0 170px;') +
                    '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            _deliveryAreaHtml(deliveryArea, end, tpl, geral, fiscal, regionLabel) +
            _deliveryZonesHtml() +
            '<section ' + _templatePanelAttrs('operacao') + ' style="' + _cardStyle() + '">' + _sectionTitle('Horários e status', 'Funcionamento da loja e mensagens especiais.', 'schedule') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">schedule</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo dos horários</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Defina abertura automática, fechamento manual e grade semanal.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span data-template-summary="status-mode" style="' + chipStyle + '">' + (statusMode === 'manual' ? 'Manual' : 'Automática') + '</span>' +
                    '<span data-template-summary="hours-days" style="' + chipStyle + '">7 dias</span>' +
                  '</div>' +
                  '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">O modo automático usa a grade semanal abaixo para mostrar a loja aberta ou fechada.</small>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                  '<div style="display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;max-width:560px;padding:0 2px;">' +
                    '<div style="min-width:220px;max-width:260px;flex:0 0 auto;">' +
                      _operationCardHead('toggle_on', 'Status público da loja', 'Escolha se o status segue os horários ou se será controlado manualmente.') +
                    '</div>' +
                    _operationSelectHtml('tpl-status-mode', 'Status da loja', statusMode, [{ value: 'auto', label: 'Automático pelos horários' }, { value: 'manual', label: 'Manual' }], '', 'width:240px;flex:0 0 240px;') +
                    '<input id="tpl-manual-closed" type="checkbox" style="display:none;"' + (manualStatusClosed ? ' checked' : '') + '>' +
                  '</div>' +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('schedule', 'Grade semanal', 'Configure abertura, fechamento e segundo período de cada dia.') +
                    '<div style="display:flex;flex-direction:column;gap:8px;">' + hoursHtml + '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section ' + _templatePanelAttrs('atendimento') + ' style="' + _cardStyle() + '">' + _sectionTitle('Contato', 'Configure os canais que o cliente pode usar para falar com a loja.', 'support_agent') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">support_agent</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo dos contatos</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Canais clicáveis e redes exibidos na loja.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span data-template-summary="whatsapp" style="' + chipStyle + '">' + ((geral.whatsapp || tpl.whatsapp) ? 'WhatsApp' : 'Sem WhatsApp') + '</span>' +
                    '<span data-template-summary="email" style="' + chipStyle + '">' + ((geral.email || tpl.email) ? 'E-mail' : 'Sem e-mail') + '</span>' +
                    '<span data-template-summary="contact-footer" style="' + chipStyle + '">' + (contactDisplay.showContactsInFooter ? 'Rodapé ativo' : 'Rodapé oculto') + '</span>' +
                  '</div>' +
                  '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">Esses contatos aparecem na loja pública e podem ser exibidos também no rodapé.</small>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('support_agent', 'Canais de atendimento', 'Contatos usados para o cliente falar com a loja.') +
                    '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
                      _operationPhoneCompositeHtml('tpl-whatsapp', 'WhatsApp principal', inheritedWhatsapp, '600 000 000', 'Aberto quando o cliente chama a loja pelo WhatsApp.', 'width:290px;flex:0 0 290px;') +
                      _operationPhoneCompositeHtml('tpl-phone', 'Telefone', geral.phone || tpl.phone || '', '600 000 000', 'Usado para ligação direta no celular.', 'width:270px;flex:0 0 270px;') +
                      _operationFieldHtml('tpl-email', 'E-mail de atendimento', geral.email || tpl.email || '', 'hola@loja.com', 'email', '', '', '', 'width:300px;flex:0 0 300px;') +
                    '</div>' +
                  '</div>' +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('alternate_email', 'Redes sociais', 'Informe @usuário ou link completo, conforme a rede.') +
                    '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
                      _operationFieldHtml('tpl-instagram', 'Instagram', inheritedInstagram, '@loja ou https://instagram.com/loja', 'text', '', '', '', 'width:260px;flex:0 0 260px;') +
                      _operationFieldHtml('tpl-facebook', 'Facebook', inheritedFacebook, 'https://facebook.com/sualoja', 'text', '', '', '', 'width:300px;flex:0 0 300px;') +
                      _operationFieldHtml('tpl-tiktok', 'TikTok', inheritedTiktok, '@loja ou https://tiktok.com/@loja', 'text', '', '', '', 'width:260px;flex:0 0 260px;') +
                    '</div>' +
                  '</div>' +
                  '<div id="tpl-contact-footer-wrap" style="' + _operationCardStyle() + '">' +
                    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
                      _operationCardHead('article', 'Exibição no rodapé', 'Escolha quais canais aparecem no rodapé da loja pública.') +
                      '<div style="flex:0 0 auto;">' + _plainSwitchHtml('tpl-contact-footer-show', 'Mostrar contatos', contactDisplay.showContactsInFooter, '') + '</div>' +
                    '</div>' +
                    '<div id="tpl-contact-footer-options" style="display:' + (contactDisplay.showContactsInFooter ? 'grid' : 'none') + ';grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px 14px;">' +
                      _operationCheckHtml('tpl-contact-footer-whatsapp', 'WhatsApp no rodapé', contactDisplay.showWhatsappInFooter, '') +
                      _operationCheckHtml('tpl-contact-footer-phone', 'Telefone no rodapé', contactDisplay.showPhoneInFooter, '') +
                      _operationCheckHtml('tpl-contact-footer-email', 'E-mail no rodapé', contactDisplay.showEmailInFooter, '') +
                      _operationCheckHtml('tpl-contact-footer-instagram', 'Instagram no rodapé', contactDisplay.showInstagramInFooter, '') +
                      _operationCheckHtml('tpl-contact-footer-facebook', 'Facebook no rodapé', contactDisplay.showFacebookInFooter, '') +
                      _operationCheckHtml('tpl-contact-footer-tiktok', 'TikTok no rodapé', contactDisplay.showTiktokInFooter, '') +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section ' + _templatePanelAttrs('checkout') + ' style="' + _cardStyle() + '">' + _sectionTitle('Pagamentos exibidos na loja', 'Formas cadastradas em Configurações > Financeiro. Ative apenas as que estarão disponíveis para o cliente.', 'payments') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">payments</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo dos pagamentos</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Formas de pagamento visíveis no checkout da loja.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span data-template-summary="payment-total" style="' + chipStyle + '">' + paymentMethods.length + ' cadastradas</span>' +
                    '<span data-template-summary="payment-active" style="' + chipStyle + '">' + paymentMethods.filter(function (m) { return m && m.active; }).length + ' ativas</span>' +
                    '<span data-template-summary="payment-note" style="' + chipStyle + '">' + ((pay.note || pay.paymentNote || tpl.paymentNote) ? 'Com observação' : 'Sem observação') + '</span>' +
                  '</div>' +
                  '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">As formas disponíveis vêm das configurações financeiras; aqui você escolhe o que aparece para o cliente.</small>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                  _stripeCheckoutIntegrationCard(integracoes, financeiro) +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('payments', 'Formas disponíveis', 'Ative somente as opções que o cliente poderá escolher no checkout.') +
                    _paymentMethodsHtml(paymentMethods) +
                  '</div>' +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('notes', 'Observação geral', 'Texto complementar mostrado ao cliente junto das opções de pagamento.') +
                    '<label style="display:block;min-width:0;max-width:620px;"><span style="' + _labelStyle() + '">Observação sobre pagamento</span><textarea id="tpl-payment-note" rows="3" placeholder="Pagamento na entrega ou retirada." style="' + _operationFieldStyle('min-height:86px;resize:vertical;') + '">' + _esc(pay.note || pay.paymentNote || tpl.paymentNote || '') + '</textarea></label>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section ' + _templatePanelAttrs('checkout') + ' style="' + _cardStyle() + '">' + _sectionTitle('Finalização do pedido', 'Configurações ligadas ao carrinho e checkout.', 'shopping_cart_checkout') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">shopping_cart_checkout</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo do checkout</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Controle opções simples do carrinho e finalização.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span data-template-summary="checkout-note" style="' + chipStyle + '">' + (tpl.allowCustomerNote !== false ? 'Observação ativa' : 'Sem observação') + '</span>' +
                    '<span data-template-summary="checkout-coupon" style="' + chipStyle + '">' + (tpl.allowCoupon ? 'Cupom ativo' : 'Cupom oculto') + '</span>' +
                  '</div>' +
                  '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">Essas opções aparecem no carrinho antes do cliente enviar o pedido.</small>' +
                '</div>' +
                '<div style="' + _operationCardStyle() + '">' +
                  _operationCardHead('shopping_cart_checkout', 'Opções do checkout', 'Defina quais campos extras estarão disponíveis na finalização do pedido.') +
                  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:8px 14px;align-items:start;">' +
                    _operationCheckHtml('tpl-allow-note', 'Permitir observação do cliente no pedido', tpl.allowCustomerNote !== false, '') +
                    _operationCheckHtml('tpl-allow-coupon', 'Permitir cupom', !!tpl.allowCoupon, '') +
                  '</div>' +
                  '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
                    _operationFieldHtml('tpl-cart-button', 'Texto do botão Ver pedido', tpl.cartButtonText || '', 'Ver pedido', 'text', '', '', '', 'width:260px;flex:0 0 260px;') +
                    _operationFieldHtml('tpl-main-button', 'Texto do botão final', tpl.mainButtonText || '', 'Enviar pedido pelo WhatsApp', 'text', '', '', '', 'width:330px;flex:0 0 330px;') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section ' + _templatePanelAttrs('atendimento') + ' style="' + _cardStyle() + '">' + _sectionTitle('WhatsApp da loja', 'Mensagem usada pelo botão flutuante do WhatsApp na loja pública.', 'chat') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">chat</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo do WhatsApp</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Texto do botão flutuante e mensagem inicial enviada pelo cliente.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span data-template-summary="whatsapp-tooltip" style="' + chipStyle + '">' + ((tpl.whatsappTooltip || tpl.whatsappFloatingLabel) ? 'Tooltip definido' : 'Sem tooltip') + '</span>' +
                    '<span data-template-summary="whatsapp-message" style="' + chipStyle + '">' + (tpl.whatsappMessage ? 'Mensagem definida' : 'Mensagem padrão') + '</span>' +
                  '</div>' +
                  '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">Esse conteúdo aparece quando o cliente usa o botão flutuante de WhatsApp na loja.</small>' +
                '</div>' +
                '<div style="' + _operationCardStyle() + '">' +
                  _operationCardHead('chat', 'Botão flutuante', 'Configure o texto de apoio e a mensagem inicial enviada no WhatsApp.') +
                  '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
                    _operationFieldHtml('tpl-whatsapp-tooltip', 'Texto ao passar o mouse', tpl.whatsappTooltip || tpl.whatsappFloatingLabel || '', 'Quero falar com alguém', 'text', '', '', '', 'width:320px;flex:0 0 320px;') +
                    '<label style="display:block;min-width:0;flex:1 1 420px;"><span style="' + _labelStyle() + '">Mensagem do botão flutuante do WhatsApp</span><textarea id="tpl-whatsapp-message" rows="4" placeholder="Olá, quero falar com a loja." style="' + _operationFieldStyle('min-height:112px;resize:vertical;') + '">' + _esc(tpl.whatsappMessage || '') + '</textarea></label>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section ' + _templatePanelAttrs('textos') + ' style="' + _cardStyle() + '">' + _sectionTitle('Mais informações', 'Textos exibidos quando o cliente abre o modal de informações da loja.', 'info') +
              '<div style="display:flex;flex-direction:column;gap:12px;">' +
                '<div style="display:none;">' +
                  '<div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;border:1px solid #EAE4DA;"><span class="mi" style="font-size:22px;">info</span></div><div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Resumo das informações</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Conteúdo do modal público de informações da loja.</div></div></div>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
                    '<span data-template-summary="about" style="' + chipStyle + '">' + (tpl.about ? 'Sobre preenchido' : 'Sem sobre') + '</span>' +
                    '<span data-template-summary="delivery-policy" style="' + chipStyle + '">' + (tpl.deliveryPolicy ? 'Entrega definida' : 'Sem política') + '</span>' +
                    '<span data-template-summary="cancel-policy" style="' + chipStyle + '">' + (tpl.cancelPolicy ? 'Cancelamento definido' : 'Sem cancelamento') + '</span>' +
                  '</div>' +
                  '<small style="display:block;color:#6F6860;font-size:11px;line-height:1.45;">Use textos curtos e claros para reduzir dúvidas antes do pedido.</small>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:12px;">' +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('storefront', 'Apresentação da loja', 'Texto principal exibido quando o cliente abre Mais informações.') +
                    '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Sobre a loja</span><textarea id="tpl-about" rows="4" placeholder="Conte o que sua loja vende e o que o cliente precisa saber antes de pedir." style="' + _operationFieldStyle('min-height:112px;resize:vertical;') + '">' + _esc(tpl.about || '') + '</textarea></label>' +
                  '</div>' +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('campaign', 'Aviso importante', 'Use apenas quando houver uma informação que o cliente deve ver antes de pedir.') +
                    '<label style="display:block;min-width:0;max-width:620px;"><span style="' + _labelStyle() + '">Aviso importante</span><textarea id="tpl-important" rows="3" placeholder="Ex.: pedidos sujeitos à disponibilidade." style="' + _operationFieldStyle('min-height:88px;resize:vertical;') + '">' + _esc(tpl.importantNotice || '') + '</textarea></label>' +
                  '</div>' +
                  '<div style="' + _operationCardStyle() + '">' +
                    _operationCardHead('local_shipping', 'Entrega e cancelamento', 'Explique de forma simples como funcionam entrega, retirada e alterações do pedido.') +
                    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;align-items:start;">' +
                      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Política de entrega</span><textarea id="tpl-delivery-policy" rows="4" placeholder="Explique prazos, áreas atendidas e cuidados na entrega." style="' + _operationFieldStyle('min-height:112px;resize:vertical;') + '">' + _esc(tpl.deliveryPolicy || '') + '</textarea></label>' +
                      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Política de cancelamento</span><textarea id="tpl-cancel-policy" rows="4" placeholder="Explique quando o cliente pode cancelar ou alterar o pedido." style="' + _operationFieldStyle('min-height:112px;resize:vertical;') + '">' + _esc(tpl.cancelPolicy || '') + '</textarea></label>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<input id="tpl-footer" type="hidden" value="' + _esc(tpl.footerText || '') + '">' +
            '</section>' +
            '<div style="display:flex;justify-content:flex-end;"><button type="button" class="tpl-config-save" data-save-template-loja="1">Salvar alterações</button></div>' +
        '</div></div>';
      _setTemplateTab(_templateActiveTab || 'identidade');
      setTimeout(function () {
        if (!content._tplPreviewScrollBound) {
          content._tplPreviewScrollBound = true;
          var syncPreview = function () {
            if (window.requestAnimationFrame) window.requestAnimationFrame(_syncTemplatePreviewColumn);
            else _syncTemplatePreviewColumn();
          };
          content.addEventListener('scroll', syncPreview, { passive: true });
          window.addEventListener('scroll', syncPreview, { passive: true });
          window.addEventListener('resize', syncPreview);
        }
        [].slice.call(content.querySelectorAll('input,textarea,select')).forEach(function (el) {
          el.addEventListener('input', _refreshTemplatePreview);
          el.addEventListener('change', _refreshTemplatePreview);
        });
        [].slice.call(content.querySelectorAll('[id^="tpl-h-"]')).forEach(function (el) {
          el.addEventListener('input', _syncHoursDayBlocks);
          el.addEventListener('change', _syncHoursDayBlocks);
        });
        [].slice.call(content.querySelectorAll('[data-save-template-loja="1"]')).forEach(function (btn) {
          btn.addEventListener('click', function (ev) { ev.preventDefault(); _saveTemplateLoja(); });
        });
        _bindColorField('tpl-primary-color');
        _bindOpacityField('tpl-banner-overlay-opacity');
        _bindTemplateCategoryOrder();
        _refreshTemplatePreview();
        _syncTemplatePreviewColumn();
        _syncDeliveryAreaPostalFromMain();
        if (window.sessionStorage && sessionStorage.getItem('bf_stripe_connect_refresh') === '1' && _templateActiveTab === 'checkout') {
          sessionStorage.removeItem('bf_stripe_connect_refresh');
          setTimeout(_refreshCheckoutStripeStatus, 350);
        }
        var mainPostalEl = document.getElementById('tpl-postal');
        if (mainPostalEl && !mainPostalEl._deliveryAreaPostalBound) {
          mainPostalEl._deliveryAreaPostalBound = true;
          mainPostalEl.addEventListener('input', _syncDeliveryAreaPostalFromMain);
          mainPostalEl.addEventListener('change', _syncDeliveryAreaPostalFromMain);
        }
        setTimeout(_syncTemplatePreviewColumn, 160);
        if (window.BocaPlaces) {
          BocaPlaces.init('tpl-address', {
            onPlace: function (place) {
              function setField(id, value) {
                var el = document.getElementById(id);
                if (!el || !String(value || '').trim()) return;
                el.value = value;
                if (el._bocaPlaceElement) {
                  try { el._bocaPlaceElement.value = value; } catch (e) {}
                }
                try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e2) {}
                try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e3) {}
              }
              var addressEl = document.getElementById('tpl-address');
              var streetOnly = place.street || (place.addressLine ? String(place.addressLine).split(',')[0] : '');
              if (addressEl && streetOnly) {
                addressEl.value = streetOnly;
                if (addressEl._bocaPlaceElement) {
                  try { addressEl._bocaPlaceElement.value = streetOnly; } catch (e) {}
                }
                try { addressEl.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
                try { addressEl.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
              }
              var neighborhoodEl = document.getElementById('tpl-neighborhood');
              var neighborhood = place.neighborhood || place.sublocality || place.district || '';
              if (neighborhoodEl && neighborhood) {
                neighborhoodEl.value = neighborhood;
                try { neighborhoodEl.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
                try { neighborhoodEl.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
              }
              setField('tpl-city', place.city || place.locality || '');
              setField('tpl-region', place.region || place.state || place.province || '');
              setField('tpl-country', place.country || '');
              setField('tpl-postal', place.postalCode || place.postcode || place.zip || '');
              _syncDeliveryAreaPostalFromMain();
            }
          });
          BocaPlaces.init('tpl-delivery-area-city');
        }
      }, 80);
    });
  }

  function _syncDeliveryAreaPostalFromMain() {
    var source = document.getElementById('tpl-postal');
    var target = document.getElementById('tpl-delivery-area-postal');
    if (!source || !target) return;
    var value = String(source.value || '').trim();
    if (value || !String(target.value || '').trim()) target.value = value;
  }

  function _syncDeliveryAreaHiddenFieldsFromMain() {
    var city = document.getElementById('tpl-delivery-area-city');
    var mainCity = document.getElementById('tpl-city');
    var province = document.getElementById('tpl-delivery-area-province');
    var mainProvince = document.getElementById('tpl-region');
    var country = document.getElementById('tpl-delivery-area-country');
    var mainCountry = document.getElementById('tpl-country');
    if (city && mainCity && !String(city.value || '').trim()) city.value = String(mainCity.value || '').trim();
    if (province && mainProvince) province.value = String(mainProvince.value || '').trim();
    if (country && mainCountry) country.value = String(mainCountry.value || '').trim();
    _syncDeliveryAreaPostalFromMain();
  }

  function _templatePreviewHtml(geral, app, tpl, logo, banner) {
    var name = geral.businessName || tpl.publicName || 'Nome da loja';
    var color = app.primaryColor || geral.primaryColor || tpl.primaryColor || '#B42318';
    var palette = _deriveStorePalette(color);
    return '<div style="' + _cardStyle() + 'overflow:hidden;">' +
      _sectionTitle('Preview', 'Alterações visíveis na loja.') +
      '<div style="border:1px solid #EAE4DA;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="height:44px;background:#fff;border-bottom:1px solid #EAE4DA;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:8px;"><span id="tpl-preview-logo-dot" style="width:24px;height:24px;border-radius:8px;background:#FAFAF8;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #EAE4DA;"><img id="tpl-preview-logo" src="' + _esc(_cleanPublicUrl(logo) || '') + '" style="max-width:100%;max-height:100%;object-fit:contain;display:none;"><span class="mi" style="font-size:14px;color:#A39B90;">storefront</span></span><strong id="tpl-preview-short" style="font-size:12px;color:#1F1F1F;font-weight:600;">' + _esc(geral.shortName || tpl.shortName || name) + '</strong></div><span id="tpl-preview-status-pill" style="font-size:10px;font-weight:600;color:#1A9E5A;background:#EDFAF3;border-radius:20px;padding:4px 8px;">Abierta</span><span class="mi" style="font-size:17px;color:#8A7E7C;">person</span></div>' +
        '<div id="tpl-preview-promo" style="display:none;padding:8px 12px;background:#B42318;color:#fff;font-size:12px;font-weight:600;text-align:center;"></div>' +
        '<div id="tpl-preview-cover" style="height:132px;background:#FAFAF8;position:relative;display:flex;align-items:center;justify-content:center;color:#6F6860;font-size:12px;"><img id="tpl-preview-banner" src="' + _esc(_cleanPublicUrl(banner) || '') + '" style="width:100%;height:100%;object-fit:cover;display:none;"><span id="tpl-preview-banner-overlay" style="position:absolute;inset:0;display:none;pointer-events:none;"></span><span id="tpl-preview-cover-placeholder">Sem imagem de capa</span></div>' +
        '<div id="tpl-preview-summary" style="margin:-22px 14px 0;position:relative;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:14px;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div id="tpl-preview-name" style="font-size:18px;font-weight:600;color:#1F1F1F;">' + _esc(name) + '</div><div id="tpl-preview-slogan" style="font-size:12px;color:#6F6860;margin-top:3px;">' + _esc(geral.slogan || tpl.slogan || 'Slogan da loja') + '</div><div id="tpl-preview-region" style="font-size:11px;color:#6F6860;margin-top:7px;"></div><button id="tpl-preview-more" style="margin-top:10px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:600;font-family:inherit;">Mais informações</button><div id="tpl-preview-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;"></div><div id="tpl-preview-calc" style="display:none;margin-top:10px;background:#fff;border:1px solid #EAE4DA;border-radius:10px;padding:8px;font-size:11px;color:#6F6860;">Calcular taxa e tempo de entrega</div></div>' +
        '<div id="tpl-preview-featured" style="display:none;margin:10px 14px 0;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:13px;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div id="tpl-preview-featured-title" style="font-size:15px;font-weight:600;color:#B42318;margin-bottom:4px;">Destaque comercial</div><div id="tpl-preview-featured-text" style="font-size:12px;color:#1F1F1F;line-height:1.4;margin-bottom:10px;"></div><button id="tpl-preview-featured-btn" style="border:none;border-radius:10px;padding:9px 12px;background:' + _esc(color) + ';color:' + _esc(palette.primaryContrast) + ';font-size:12px;font-weight:600;font-family:inherit;">Ver destaque</button></div>' +
        '<div style="padding:14px;"><div id="tpl-preview-palette" style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:10px;"></div><button id="tpl-preview-button" style="width:100%;border:none;border-radius:12px;padding:11px;background:' + _esc(color) + ';color:' + _esc(palette.primaryContrast) + ';font-size:13px;font-weight:600;font-family:inherit;">' + _esc(tpl.mainButtonText || 'Pedir pelo WhatsApp') + '</button><div id="tpl-preview-status" style="margin-top:10px;font-size:12px;color:#6F6860;background:#fff;border:1px solid #EAE4DA;border-radius:10px;padding:9px;">Entrega e retirada disponíveis</div></div>' +
      '</div></div>';
  }

  function _bindColorField(id) {
    var picker = document.getElementById(id);
    var hex = document.getElementById(id + '-hex');
    if (!picker || !hex || picker._boundColor) return;
    picker._boundColor = true;
    var swatch = document.querySelector('[data-color-swatch-for="' + id + '"]');
    var syncSwatch = function (value) {
      var color = _normalizeHexColor(value);
      if (color && swatch) swatch.style.background = color;
    };
    picker.addEventListener('input', function () {
      hex.value = _normalizeHexColor(picker.value) || '#B42318';
      syncSwatch(hex.value);
      _refreshTemplatePreview();
    });
    hex.addEventListener('input', function () {
      var color = _normalizeHexColor(hex.value);
      if (color) {
        picker.value = color;
        syncSwatch(color);
      }
      _refreshTemplatePreview();
    });
    syncSwatch(picker.value || hex.value);
  }
  function _bindOpacityField(id) {
    var num = document.getElementById(id);
    var range = document.getElementById(id + '-range');
    if (!num || !range || num._boundOpacity) return;
    num._boundOpacity = true;
    var sync = function (value) {
      var n = Number(value);
      if (!isFinite(n)) n = 14;
      n = Math.max(0, Math.min(100, Math.round(n)));
      num.value = String(n);
      range.value = String(n);
      var label = num.parentNode && num.parentNode.querySelector('.tpl-opacity-value');
      if (label) label.textContent = n + '%';
      _refreshTemplatePreview();
    };
    num.addEventListener('input', function () { sync(num.value); });
    range.addEventListener('input', function () { sync(range.value); });
    sync(num.value || range.value || 14);
  }
  function _bindFeaturedProductSearch() {
    var search = document.getElementById('tpl-featured-product-search');
    var select = document.getElementById('tpl-featured-product');
    if (!search || !select || search._boundFeaturedSearch) return;
    search._boundFeaturedSearch = true;
    var sync = function () {
      var selected = select.value;
      select.innerHTML = _featuredProductOptionsHtml(search.value, selected);
      if (selected) select.value = selected;
      if (!select.value && selected) select.value = selected;
    };
    search.addEventListener('input', function () {
      sync();
      _refreshTemplatePreview();
    });
    select.addEventListener('change', _refreshTemplatePreview);
    sync();
  }
  function _bindMostOrderedProductPicker() {
    _bindFeaturedCombobox('mostOrderedProduct', 'tpl-most-ordered-product-picker', 'tpl-featured-most-ordered-product', 'tpl-most-ordered-product-dropdown');
  }
  function _bindFeaturedProductPicker() {
    _bindFeaturedCombobox('product', 'tpl-featured-product-picker', 'tpl-featured-product', 'tpl-featured-product-dropdown');
  }
  function _bindFeaturedMarketingSearch(kind) {
    var search = document.getElementById('tpl-featured-' + kind + '-search');
    var select = document.getElementById('tpl-featured-' + kind);
    if (!search || !select || search._boundFeaturedSearch) return;
    search._boundFeaturedSearch = true;
    var list = kind === 'coupon' ? _coupons : _promotions;
    var empty = kind === 'coupon' ? 'Selecionar cupom' : 'Selecionar promoção';
    var labelFn = kind === 'coupon' ? _couponLabel : _promotionLabel;
    var sync = function () {
      var selected = select.value;
      select.innerHTML = _featuredMarketingOptionsHtml(list, search.value, selected, empty, labelFn);
      if (selected) select.value = selected;
      if (!select.value && selected) select.value = selected;
    };
    search.addEventListener('input', function () {
      sync();
      _refreshTemplatePreview();
    });
    select.addEventListener('change', _refreshTemplatePreview);
    sync();
  }
  function _bindFeaturedCouponPicker() {
    _bindFeaturedCombobox('coupon', 'tpl-featured-coupon-picker', 'tpl-featured-coupon', 'tpl-featured-coupon-dropdown');
  }
  function _bindFeaturedPromotionPicker() {
    _bindFeaturedCombobox('promotion', 'tpl-featured-promotion-picker', 'tpl-featured-promotion', 'tpl-featured-promotion-dropdown');
  }
  function _bindMobilePromoPromotionPicker() {
    _bindFeaturedCombobox('promotion', 'tpl-mobile-promo-banner-promotion-picker', 'tpl-mobile-promo-banner-promotion', 'tpl-mobile-promo-banner-promotion-dropdown');
  }
  function _bindMobilePromoProductPicker() {
    _bindFeaturedCombobox('mobilePromoProduct', 'tpl-mobile-promo-banner-product-picker', 'tpl-mobile-promo-banner-product', 'tpl-mobile-promo-banner-product-dropdown');
  }
  function _bindShowcaseProductPickers() {
    [1, 2, 3].forEach(function (index) {
      _bindFeaturedCombobox('showcaseProduct', 'tpl-showcase-product-picker-' + index, 'tpl-showcase-product-' + index, 'tpl-showcase-product-dropdown-' + index);
    });
  }

  function _featuredComboboxItems(kind) {
    if (kind === 'coupon') {
      return _activeCouponOptions().map(function (c) {
        return {
          value: String(c.id || c.code || ''),
          label: _couponPickerValue(c),
          sub: [c.code, c.name, c.title].filter(Boolean).join(' · '),
          search: [c.code, c.name, c.title, _couponPickerValue(c)].filter(Boolean).join(' ')
        };
      });
    }
    if (kind === 'promotion') {
      return _promotionPickerOptions().map(function (p) {
        return {
          value: _templateMarketingId(p),
          label: _promotionPickerValue(p),
          sub: [p.name || p.title, _promotionTypeLabel(p.type), _promotionBenefitText(p)].filter(Boolean).join(' · '),
          search: [p.name, p.title, p.description, p.text, p.customerMessage, p.rulesText, _promotionTypeLabel(p.type), _promotionBenefitText(p), _promotionPickerValue(p)].filter(Boolean).join(' ')
        };
      });
    }
    if (kind === 'showcaseProduct') {
      return _sortedActiveProducts().map(function (p) {
        return {
          value: String(p.id || ''),
          label: _productPickerValue(p),
          sub: p.shortDesc || p.description || p.desc || '',
          search: _productSearchValue(p)
        };
      });
    }
    if (kind === 'mobilePromoProduct') {
      return _promotionProductOptionItems().map(function (item) {
        return {
          value: String(item.product && item.product.id || ''),
          label: item.label,
          sub: item.sub,
          search: [item.label, item.sub, item.product && item.product.name, item.product && item.product.title].filter(Boolean).join(' ')
        };
      });
    }
    return _activeProductOptions().map(function (p) {
      return {
        value: String(p.id || ''),
        label: _productPickerValue(p),
        sub: p.shortDesc || p.description || p.desc || '',
        search: _productPickerValue(p)
      };
    });
  }
  function _featuredComboboxEmptyText(kind) {
    if (kind === 'coupon') return 'Nenhum cupom ativo encontrado.';
    if (kind === 'promotion') return 'Nenhuma promoção ativa encontrada.';
    if (kind === 'mobilePromoProduct') return 'Nenhum produto vinculado a promoção encontrado.';
    return 'Nenhum produto encontrado.';
  }
  function _closeFeaturedComboboxes(except) {
    [].slice.call(document.querySelectorAll('.tpl-featured-combo-menu')).forEach(function (dd) {
      if (except && dd === except) return;
      dd.style.display = 'none';
    });
  }
  function _renderFeaturedCombobox(kind, input, hidden, dropdown) {
    if (!input || !hidden || !dropdown) return;
    var q = String(input.value || '').trim().toLowerCase();
    var items = _featuredComboboxItems(kind).filter(function (item) {
      return !q || String(item.search || item.label || '').toLowerCase().indexOf(q) >= 0;
    }).slice(0, 60);
    if (!items.length) {
      dropdown.innerHTML = '<div class="tpl-featured-combo-empty">' + _esc(_featuredComboboxEmptyText(kind)) + '</div>';
    } else {
      dropdown.innerHTML = items.map(function (item) {
        return '<div class="tpl-featured-combo-item" data-value="' + _esc(item.value) + '" data-label="' + _esc(item.label) + '">' +
          '<div class="tpl-featured-combo-title">' + _esc(item.label) + '</div>' +
          (item.sub ? '<div class="tpl-featured-combo-sub">' + _esc(item.sub) + '</div>' : '') +
        '</div>';
      }).join('');
    }
    dropdown.style.display = 'block';
  }
  function _bindFeaturedCombobox(kind, inputId, hiddenId, dropdownId) {
    var input = document.getElementById(inputId);
    var hidden = document.getElementById(hiddenId);
    var dropdown = document.getElementById(dropdownId);
    if (!input || !hidden || !dropdown || input._boundFeaturedCombobox) return;
    input._boundFeaturedCombobox = true;
    input.addEventListener('focus', function () {
      _closeFeaturedComboboxes(dropdown);
      _renderFeaturedCombobox(kind, input, hidden, dropdown);
    });
    input.addEventListener('input', function () {
      hidden.value = '';
      _renderFeaturedCombobox(kind, input, hidden, dropdown);
      _refreshTemplatePreview();
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') dropdown.style.display = 'none';
    });
    dropdown.addEventListener('mousedown', function (ev) {
      var row = ev.target && ev.target.closest ? ev.target.closest('.tpl-featured-combo-item') : null;
      if (!row) return;
      ev.preventDefault();
      hidden.value = row.getAttribute('data-value') || '';
      input.value = row.getAttribute('data-label') || '';
      dropdown.style.display = 'none';
      _refreshTemplatePreview();
    });
    if (!document._tplFeaturedComboCloseBound) {
      document._tplFeaturedComboCloseBound = true;
      document.addEventListener('mousedown', function (ev) {
        var target = ev.target;
        if (target && target.closest && target.closest('.tpl-featured-combo')) return;
        _closeFeaturedComboboxes();
      });
    }
  }

  function _refreshTemplatePreview() {
    _syncDeliveryAreaHiddenFieldsFromMain();
    setTimeout(_syncTemplatePreviewColumn, 0);
    _refreshTemplateSummaryChips();
    var name = document.getElementById('tpl-preview-name');
    var slogan = document.getElementById('tpl-preview-slogan');
    var btn = document.getElementById('tpl-preview-button');
    var status = document.getElementById('tpl-preview-status');
    var logo = document.getElementById('tpl-preview-logo');
    var banner = document.getElementById('tpl-preview-banner');
    var promo = document.getElementById('tpl-preview-promo');
    var cover = document.getElementById('tpl-preview-cover');
    var coverPlaceholder = document.getElementById('tpl-preview-cover-placeholder');
    var bannerDesktop = document.getElementById('tpl-preview-banner-desktop');
    var bannerDesktopPlaceholder = document.getElementById('tpl-preview-banner-desktop-placeholder');
    var bannerMobile = document.getElementById('tpl-preview-banner-mobile');
    var bannerMobilePlaceholder = document.getElementById('tpl-preview-banner-mobile-placeholder');
    var bannerOverlay = document.getElementById('tpl-preview-banner-overlay');
    var bannerDesktopOverlay = document.getElementById('tpl-preview-banner-desktop-overlay');
    var bannerMobileOverlay = document.getElementById('tpl-preview-banner-mobile-overlay');
    var summary = document.getElementById('tpl-preview-summary');
    var region = document.getElementById('tpl-preview-region');
    var more = document.getElementById('tpl-preview-more');
    var chips = document.getElementById('tpl-preview-chips');
    var calc = document.getElementById('tpl-preview-calc');
    var featured = document.getElementById('tpl-preview-featured');
    var featuredTitle = document.getElementById('tpl-preview-featured-title');
    var featuredText = document.getElementById('tpl-preview-featured-text');
    var featuredBtn = document.getElementById('tpl-preview-featured-btn');
    var shortName = document.getElementById('tpl-preview-short');
    var logoDot = document.getElementById('tpl-preview-logo-dot');
    var statusPill = document.getElementById('tpl-preview-status-pill');
    var mainCardPreviewHero = document.getElementById('tpl-maincard-preview-hero');
    var mainCardPreviewAvatar = document.getElementById('tpl-maincard-preview-avatar');
    var mainCardPreviewLogo = document.getElementById('tpl-maincard-preview-logo');
    var mainCardPreviewName = document.getElementById('tpl-maincard-preview-name');
    var mainCardPreviewSlogan = document.getElementById('tpl-maincard-preview-slogan');
    var mainCardPreviewFacts = document.getElementById('tpl-maincard-preview-facts');
    var mainCardPreviewMore = document.getElementById('tpl-maincard-preview-more');
    var mainCardPreviewChips = document.getElementById('tpl-maincard-preview-chips');
    var promoSettings = document.getElementById('tpl-promo-settings');
    var coverSettings = document.getElementById('tpl-cover-settings');
    var coverConfig = document.getElementById('tpl-cover-config');
    var elementsConfig = document.getElementById('tpl-top-elements-config');
    var featuredSettings = document.getElementById('tpl-featured-settings');
    var featuredWrap = document.getElementById('tpl-featured-product-wrap');
    var featuredMostOrderedWrap = document.getElementById('tpl-featured-most-ordered-wrap');
    var featuredCouponWrap = document.getElementById('tpl-featured-coupon-wrap');
    var featuredPromotionWrap = document.getElementById('tpl-featured-promotion-wrap');
    var featuredCustomWrap = document.getElementById('tpl-featured-custom-wrap');
    var deliverySettingsWrap = document.getElementById('tpl-delivery-settings-wrap');
    var pickupSettingsWrap = document.getElementById('tpl-pickup-settings-wrap');
    var mobilePromoTarget = _val('tpl-mobile-promo-banner-target') || 'promotion';
    var mobilePromoPromotionWrap = document.getElementById('tpl-mobile-promo-banner-promotion-wrap');
    var mobilePromoProductWrap = document.getElementById('tpl-mobile-promo-banner-product-wrap');
    var mobilePromoAllNote = document.getElementById('tpl-mobile-promo-banner-all-note');
    var primaryInput = _normalizeHexColor(_val('tpl-primary-color-hex') || _val('tpl-primary-color')) || '#B42318';
    var palette = _deriveStorePalette(primaryInput) || _deriveStorePalette('#B42318');
    _syncPhoneCompositeFields();
    if (name) {
      name.textContent = _val('tpl-public-name') || 'Nome da loja';
      name.style.display = _checked('tpl-maincard-show-name') ? 'block' : 'none';
    }
    if (mainCardPreviewName) {
      mainCardPreviewName.textContent = _val('tpl-public-name') || 'Nome da loja';
      mainCardPreviewName.style.display = _checked('tpl-maincard-show-name') ? 'block' : 'none';
    }
    if (mainCardPreviewAvatar) {
      mainCardPreviewAvatar.style.background = palette.primaryColor;
      mainCardPreviewAvatar.style.color = palette.primaryContrast;
      mainCardPreviewAvatar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg>';
    }
    if (shortName) shortName.textContent = _val('tpl-short-name') || _val('tpl-public-name') || 'Loja';
    if (slogan) {
      slogan.textContent = _val('tpl-slogan') || 'Slogan da loja';
      slogan.style.display = _checked('tpl-maincard-show-slogan') ? 'block' : 'none';
    }
    if (mainCardPreviewSlogan) {
      mainCardPreviewSlogan.textContent = _val('tpl-slogan') || 'Apresentação curta da loja';
      mainCardPreviewSlogan.style.display = _checked('tpl-maincard-show-slogan') ? 'block' : 'none';
    }
    var colorPreview = document.getElementById('tpl-primary-color-preview');
    var palettePreview = document.getElementById('tpl-preview-palette');
    if (colorPreview) {
      colorPreview.style.background = palette.primarySoft;
      colorPreview.style.borderColor = palette.primaryBorder;
      colorPreview.style.color = palette.primaryColor;
      colorPreview.textContent = 'Principal ' + palette.primaryColor + ' · escura ' + palette.primaryDark + ' · contraste ' + palette.primaryContrast;
    }
    var promoColor = _normalizeHexColor(_val('tpl-top-promo-color')) || palette.primaryColor;
    var promoTextColor = _normalizeHexColor(_val('tpl-top-promo-text-color')) || _contrastText(promoColor);
    var bannerOverlayColor = _normalizeHexColor(_val('tpl-banner-overlay-color')) || '#000000';
    var bannerOverlayOpacityRaw = Number(_val('tpl-banner-overlay-opacity'));
    var bannerOverlayOpacity = isFinite(bannerOverlayOpacityRaw) ? bannerOverlayOpacityRaw : 14;
    var bannerOverlayRgb = _hexToRgb(bannerOverlayColor);
    var bannerOverlayRgba = 'rgba(' + bannerOverlayRgb.r + ',' + bannerOverlayRgb.g + ',' + bannerOverlayRgb.b + ',' + Math.max(0, Math.min(1, bannerOverlayOpacity / 100)) + ')';
    ['tpl-top-promo-color','tpl-top-promo-text-color','tpl-banner-overlay-color'].forEach(function (id) {
      var swatch = document.getElementById(id + '-swatch');
      var input = document.getElementById(id);
      var colorValue = id === 'tpl-top-promo-text-color' ? promoTextColor : (id === 'tpl-banner-overlay-color' ? bannerOverlayColor : promoColor);
      if (swatch) swatch.style.background = colorValue;
      if (input && input.type === 'color') input.value = colorValue;
    });
    var promoBannerPreview = document.getElementById('tpl-promo-banner-preview');
    if (promoBannerPreview) {
      var promoBannerText = _val('tpl-top-promo-text') || 'Entrega grátis acima de €30';
      promoBannerPreview.style.background = promoColor;
      promoBannerPreview.style.color = promoTextColor;
      promoBannerPreview.textContent = promoBannerText;
    }
    if (palettePreview) {
      palettePreview.innerHTML = [palette.primaryColor, palette.primaryDark, palette.primaryLight, palette.primarySoft, palette.badgeSoft].map(function (c) {
        return '<span title="' + _esc(c) + '" style="height:22px;border-radius:8px;border:1px solid #EAE4DA;background:' + _esc(c) + ';"></span>';
      }).join('');
    }
    if (btn) { btn.textContent = _val('tpl-main-button') || 'Pedir pelo WhatsApp'; btn.style.background = palette.primaryColor; btn.style.color = palette.primaryContrast; }
    var mode = _val('tpl-status-mode') || 'auto';
    var manualStatusWrap = document.getElementById('tpl-manual-status-wrap');
    if (manualStatusWrap) manualStatusWrap.style.display = mode === 'manual' ? 'block' : 'none';
    var previewOpen = mode === 'manual' ? !_checked('tpl-manual-closed') : _previewStoreOpenNow();
    var statusText = mode === 'manual' ? 'Manual' : 'Automática pelos horários';
    if (status) status.textContent = statusText + ' · ' + (_checked('tpl-delivery-enabled') ? 'Entrega ativa' : 'Entrega inativa') + ' · ' + (_checked('tpl-pickup-enabled') ? 'Retirada ativa' : 'Retirada inativa');
    if (statusPill) { statusPill.textContent = previewOpen ? 'Abierta' : 'Cerrada'; statusPill.style.color = previewOpen ? '#1A9E5A' : '#B42318'; statusPill.style.background = previewOpen ? '#EDFAF3' : '#FFF0EE'; statusPill.style.display = _checked('tpl-maincard-show-status') ? 'inline-flex' : 'none'; }
    if (mode === 'auto' && window.AdminApp && typeof AdminApp._applyStoreOnlineStatus === 'function') {
      AdminApp._applyStoreOnlineStatus(previewOpen, false, 'auto');
    }
    if (promo) {
      promo.style.display = _checked('tpl-top-promo-enabled') ? 'block' : 'none';
      promo.textContent = _val('tpl-top-promo-text') || 'Banner promocional';
      promo.style.background = promoColor;
      promo.style.color = promoTextColor;
    }
    if (summary) summary.style.display = 'block';
    if (promoSettings) promoSettings.style.display = _checked('tpl-top-promo-enabled') ? 'grid' : 'none';
    var featuredEnabled = _checked('tpl-featured-enabled');
    var featuredType = _val('tpl-featured-type') || 'none';
    var mostOrderedMode = _val('tpl-most-ordered-mode') || 'auto';
    var mostOrderedManualWrap = document.getElementById('tpl-most-ordered-manual-wrap');
    var mostOrderedAutoNote = document.getElementById('tpl-most-ordered-auto-note');
    if (featuredSettings) featuredSettings.style.display = featuredEnabled ? 'grid' : 'none';
    if (featuredWrap) featuredWrap.style.display = featuredEnabled && featuredType === 'featured_product' ? 'block' : 'none';
    if (featuredMostOrderedWrap) featuredMostOrderedWrap.style.display = featuredEnabled && featuredType === 'most_ordered' ? 'block' : 'none';
    if (mostOrderedManualWrap) mostOrderedManualWrap.style.display = featuredEnabled && featuredType === 'most_ordered' && mostOrderedMode === 'manual' ? 'block' : 'none';
    if (mostOrderedAutoNote) mostOrderedAutoNote.style.display = featuredEnabled && featuredType === 'most_ordered' && mostOrderedMode !== 'manual' ? 'block' : 'none';
    if (featuredCouponWrap) featuredCouponWrap.style.display = featuredEnabled && featuredType === 'coupon' ? 'flex' : 'none';
    if (featuredPromotionWrap) featuredPromotionWrap.style.display = featuredEnabled && featuredType === 'promotion' ? 'flex' : 'none';
    if (featuredCustomWrap) featuredCustomWrap.style.display = featuredEnabled && featuredType === 'custom' ? 'flex' : 'none';
    if (mobilePromoPromotionWrap) mobilePromoPromotionWrap.style.display = mobilePromoTarget === 'promotion' ? 'block' : 'none';
    if (mobilePromoProductWrap) mobilePromoProductWrap.style.display = mobilePromoTarget === 'product' ? 'block' : 'none';
    if (mobilePromoAllNote) mobilePromoAllNote.style.display = mobilePromoTarget === 'all_promotions' ? 'block' : 'none';
    if (deliverySettingsWrap) deliverySettingsWrap.style.display = _checked('tpl-delivery-enabled') ? 'flex' : 'none';
    if (pickupSettingsWrap) pickupSettingsWrap.style.display = _checked('tpl-pickup-enabled') ? 'flex' : 'none';
    if (document.getElementById('tpl-featured-product-picker') || document.getElementById('tpl-featured-product')) _bindFeaturedProductPicker();
    if (document.getElementById('tpl-most-ordered-product-picker') || document.getElementById('tpl-featured-most-ordered-product')) _bindMostOrderedProductPicker();
    if (document.getElementById('tpl-featured-coupon-picker') || document.getElementById('tpl-featured-coupon')) _bindFeaturedCouponPicker();
    if (document.getElementById('tpl-featured-promotion-picker') || document.getElementById('tpl-featured-promotion')) _bindFeaturedPromotionPicker();
    if (document.getElementById('tpl-mobile-promo-banner-promotion-picker') || document.getElementById('tpl-mobile-promo-banner-promotion')) _bindMobilePromoPromotionPicker();
    if (document.getElementById('tpl-mobile-promo-banner-product-picker') || document.getElementById('tpl-mobile-promo-banner-product')) _bindMobilePromoProductPicker();
    if (document.getElementById('tpl-showcase-product-picker-1') || document.getElementById('tpl-showcase-product-1')) _bindShowcaseProductPickers();
    if (region) { region.style.display = _checked('tpl-maincard-show-location') ? 'block' : 'none'; region.textContent = _val('tpl-city') || 'Cidade'; }
    if (more) more.style.display = _checked('tpl-maincard-show-more-info') ? 'inline-block' : 'none';
    if (mainCardPreviewMore) mainCardPreviewMore.style.display = _checked('tpl-maincard-show-more-info') ? 'inline-flex' : 'none';
    if (calc) calc.style.display = 'none';
    if (coverConfig) coverConfig.style.display = 'flex';
    if (coverSettings) coverSettings.style.display = _checked('tpl-top-use-cover') ? 'grid' : 'none';
    if (elementsConfig) elementsConfig.style.display = 'flex';
    if (chips) {
      var showPreviewChips = _checked('tpl-maincard-show-pickup') || _checked('tpl-maincard-show-delivery') || _checked('tpl-maincard-show-prep') || _checked('tpl-maincard-show-delivery-time') || _checked('tpl-maincard-show-min-order') || _checked('tpl-maincard-show-advance-days');
      chips.style.display = showPreviewChips ? 'flex' : 'none';
      var previewZones = _collectDeliveryZonesFromDom();
      var storedDeliveryFee = _minActiveDeliveryZoneFee(previewZones);
      if (storedDeliveryFee == null || storedDeliveryFee === '') storedDeliveryFee = _val('tpl-delivery-fee') || ((_storeConfig && _storeConfig.template && _storeConfig.template.deliveryFee) || (_storeConfig && _storeConfig.geral && _storeConfig.geral.deliveryFee) || '');
      var previewPickupNeighborhood = _val('tpl-neighborhood');
      var previewPickupLabel = previewPickupNeighborhood ? ('Retirada em ' + previewPickupNeighborhood) : 'Retirada';
      chips.innerHTML = (_checked('tpl-maincard-show-delivery') && _checked('tpl-delivery-enabled') ? '<span style="font-size:10px;font-weight:800;background:' + _esc(palette.chipSoft) + ';color:' + _esc(palette.primaryDark) + ';border-radius:999px;padding:5px 8px;">Entrega ' + (storedDeliveryFee !== '' && storedDeliveryFee != null ? _fmtMoneyDisplay(storedDeliveryFee) : '') + '</span>' : '') +
        (_checked('tpl-maincard-show-pickup') && _checked('tpl-pickup-enabled') ? '<span style="font-size:10px;font-weight:800;background:' + _esc(palette.chipSoft) + ';color:' + _esc(palette.primaryDark) + ';border-radius:999px;padding:5px 8px;">' + _esc(previewPickupLabel) + '</span>' : '') +
        (_checked('tpl-maincard-show-prep') && _val('tpl-prep-time') ? '<span style="font-size:10px;font-weight:800;background:' + _esc(palette.chipSoft) + ';color:' + _esc(palette.primaryDark) + ';border-radius:999px;padding:5px 8px;">Preparo ' + _esc(_val('tpl-prep-time')) + ' min</span>' : '') +
        (_checked('tpl-maincard-show-delivery-time') && _val('tpl-delivery-time') ? '<span style="font-size:10px;font-weight:800;background:' + _esc(palette.chipSoft) + ';color:' + _esc(palette.primaryDark) + ';border-radius:999px;padding:5px 8px;">Entrega ' + _esc(_val('tpl-delivery-time')) + '</span>' : '') +
        (_checked('tpl-maincard-show-min-order') && _val('tpl-min-delivery') ? '<span style="font-size:10px;font-weight:800;background:' + _esc(palette.chipSoft) + ';color:' + _esc(palette.primaryDark) + ';border-radius:999px;padding:5px 8px;">Pedido Mín. para Entrega ' + _fmtMoneyDisplay(_val('tpl-min-delivery')) + '</span>' : '') +
        (_checked('tpl-maincard-show-advance-days') && _val('tpl-max-advance-days') ? '<span style="font-size:10px;font-weight:800;background:' + _esc(palette.chipSoft) + ';color:' + _esc(palette.primaryDark) + ';border-radius:999px;padding:5px 8px;">Antecedência ' + _esc(_val('tpl-max-advance-days')) + ' dia(s)</span>' : '');
    }
    var bannerUrl = _cleanPublicUrl(_val('tpl-banner-url'));
    var bannerMobileUrl = _cleanPublicUrl(_val('tpl-banner-mobile-url'));
    var logoUrl = _cleanPublicUrl(_val('tpl-logo-url'));
    if (logo) { logo.style.display = logoUrl ? 'block' : 'none'; logo.src = logoUrl || ''; }
    if (logoDot) logoDot.style.display = _checked('tpl-maincard-show-logo') ? 'inline-flex' : 'none';
    if (mainCardPreviewLogo) {
      mainCardPreviewLogo.style.display = _checked('tpl-maincard-show-logo') ? 'flex' : 'none';
      mainCardPreviewLogo.innerHTML = logoUrl ? '<img src="' + _esc(logoUrl) + '" alt="">' : '<span class="mi" style="font-size:25px;">storefront</span>';
    }
    if (mainCardPreviewHero) {
      var mainPreviewCoverUrl = bannerMobileUrl || bannerUrl;
      mainCardPreviewHero.style.backgroundImage = mainPreviewCoverUrl && _checked('tpl-top-use-cover')
        ? 'linear-gradient(180deg,' + bannerOverlayRgba + ' 0%,rgba(' + bannerOverlayRgb.r + ',' + bannerOverlayRgb.g + ',' + bannerOverlayRgb.b + ',' + (Math.max(0, Math.min(1, bannerOverlayOpacity / 100)) * .45) + ') 54%,rgba(' + bannerOverlayRgb.r + ',' + bannerOverlayRgb.g + ',' + bannerOverlayRgb.b + ',0) 100%),url("' + mainPreviewCoverUrl.replace(/"/g, '\\"') + '")'
        : 'linear-gradient(180deg,rgba(28,18,10,.20) 0%,rgba(28,18,10,.03) 54%,rgba(255,250,243,0) 100%),linear-gradient(135deg,#DAC4AF,#F7E8DB)';
    }
    if (mainCardPreviewFacts) {
      var previewFacts = _checked('tpl-maincard-show-rating') ? ['<span class="tpl-maincard-preview-star">★</span><b>4,8</b>'] : [];
      var previewRegion = _val('tpl-city');
      var previewPrep = _val('tpl-prep-time');
      var previewDeliveryTime = _val('tpl-delivery-time');
      var previewMinimum = _val('tpl-min-delivery');
      var previewAdvanceDays = Number(_val('tpl-max-advance-days'));
      var previewHours = _val('tpl-opening-hours-summary') || _val('tpl-hours-summary') || '';
      if (_checked('tpl-maincard-show-location') && previewRegion) previewFacts.push('<span>' + _esc(previewRegion) + '</span>');
      if (_checked('tpl-maincard-show-prep') && previewPrep) previewFacts.push('<span>' + _esc(String(previewPrep).indexOf('min') >= 0 ? previewPrep : previewPrep + ' min') + '</span>');
      if (_checked('tpl-maincard-show-delivery-time') && previewDeliveryTime) previewFacts.push('<span>' + _esc(String(previewDeliveryTime).indexOf('min') >= 0 ? previewDeliveryTime : previewDeliveryTime + ' min') + '</span>');
      if (_checked('tpl-maincard-show-min-order') && previewMinimum) previewFacts.push('<span>Pedido Mín. para Entrega ' + _fmtMoneyDisplay(previewMinimum) + '</span>');
      if (_checked('tpl-maincard-show-advance-days') && previewAdvanceDays) previewFacts.push('<span>' + previewAdvanceDays + ' dia' + (previewAdvanceDays === 1 ? '' : 's') + ' de antecedência</span>');
      if (_checked('tpl-maincard-show-hours') && previewHours) previewFacts.push('<span>' + _esc(previewHours) + '</span>');
      mainCardPreviewFacts.style.display = previewFacts.length ? 'flex' : 'none';
      mainCardPreviewFacts.innerHTML = previewFacts.join('<span class="tpl-maincard-preview-dot"></span>');
    }
    if (mainCardPreviewChips) {
      var previewCardChips = [];
      var previewZonesForMainCard = _collectDeliveryZonesFromDom();
      var previewMainDeliveryFee = _minActiveDeliveryZoneFee(previewZonesForMainCard);
      if (previewMainDeliveryFee == null || previewMainDeliveryFee === '') previewMainDeliveryFee = _val('tpl-delivery-fee') || ((_storeConfig && _storeConfig.template && _storeConfig.template.deliveryFee) || (_storeConfig && _storeConfig.geral && _storeConfig.geral.deliveryFee) || '');
      if (_checked('tpl-maincard-show-status')) previewCardChips.push({ label: previewOpen ? 'Aberto' : 'Fechado', tone: previewOpen ? 'open' : 'closed' });
      if (_checked('tpl-maincard-show-delivery') && _checked('tpl-delivery-enabled')) previewCardChips.push({ label: 'Entrega ' + (previewMainDeliveryFee !== '' && previewMainDeliveryFee != null ? _fmtMoneyDisplay(previewMainDeliveryFee) : 'desde'), tone: '' });
      if (_checked('tpl-maincard-show-pickup') && _checked('tpl-pickup-enabled')) previewCardChips.push({ label: previewPickupLabel, tone: '' });
      mainCardPreviewChips.style.display = previewCardChips.length ? 'flex' : 'none';
      mainCardPreviewChips.innerHTML = previewCardChips.map(function (chip) { return '<span class="tpl-maincard-preview-chip ' + _esc(chip.tone || '') + '">' + _esc(chip.label) + '</span>'; }).join('');
    }
    if (banner) { banner.style.display = bannerUrl && _checked('tpl-top-use-cover') ? 'block' : 'none'; banner.src = bannerUrl || ''; }
    if (bannerDesktop) { bannerDesktop.style.display = bannerUrl && _checked('tpl-top-use-cover') ? 'block' : 'none'; bannerDesktop.src = bannerUrl || ''; }
    if (bannerDesktopPlaceholder) bannerDesktopPlaceholder.style.display = bannerUrl && _checked('tpl-top-use-cover') ? 'none' : 'block';
    if (bannerMobile) { bannerMobile.style.display = bannerMobileUrl && _checked('tpl-top-use-cover') ? 'block' : 'none'; bannerMobile.src = bannerMobileUrl || ''; }
    if (bannerMobilePlaceholder) bannerMobilePlaceholder.style.display = bannerMobileUrl && _checked('tpl-top-use-cover') ? 'none' : 'block';
    if (bannerOverlay) { bannerOverlay.style.display = _checked('tpl-top-use-cover') && bannerUrl ? 'block' : 'none'; bannerOverlay.style.background = bannerOverlayRgba; }
    if (bannerDesktopOverlay) { bannerDesktopOverlay.style.display = bannerUrl && _checked('tpl-top-use-cover') ? 'block' : 'none'; bannerDesktopOverlay.style.background = bannerOverlayRgba; }
    if (bannerMobileOverlay) { bannerMobileOverlay.style.display = bannerMobileUrl && _checked('tpl-top-use-cover') ? 'block' : 'none'; bannerMobileOverlay.style.background = bannerOverlayRgba; }
    if (coverPlaceholder) coverPlaceholder.style.display = bannerUrl && _checked('tpl-top-use-cover') ? 'none' : 'block';
    if (cover) cover.style.display = _checked('tpl-top-use-cover') ? 'flex' : 'none';
    _syncHoursDayBlocks();
    _syncContactFooterBlocks();
    if (featured) {
      var showFeatured = featuredEnabled && featuredType !== 'none';
      featured.style.display = showFeatured ? 'block' : 'none';
      if (featuredTitle) { featuredTitle.textContent = _val('tpl-featured-title') || (featuredType === 'coupon' ? 'Cupom disponível' : featuredType === 'promotion' ? 'Promoção ativa' : featuredType === 'custom' ? 'Destaque comercial' : featuredType === 'most_ordered' ? 'Produto mais pedido' : 'Produto destaque'); featuredTitle.style.color = palette.primaryColor; }
      if (featuredText) featuredText.textContent = _val('tpl-featured-text') || 'Resumo do destaque escolhido para o topo.';
      if (featuredBtn) {
        var btnText = _val('tpl-featured-button-common') || (featuredType === 'promotion' ? _val('tpl-featured-button-promotion') : (featuredType === 'custom' ? _val('tpl-featured-button-custom') : (featuredType === 'featured_product' ? _val('tpl-featured-button-product') : (featuredType === 'most_ordered' ? _val('tpl-featured-button-most') : _val('tpl-featured-button')))));
        featuredBtn.textContent = btnText || _featuredButtonSuggestion(featuredType) || 'Ver destaque';
        featuredBtn.style.background = palette.primaryColor;
        featuredBtn.style.color = palette.primaryContrast;
      }
    }
  }

  function _setTemplateSummaryText(key, text) {
    [].slice.call(document.querySelectorAll('[data-template-summary="' + key + '"]')).forEach(function (el) {
      el.textContent = text;
    });
  }

  function _refreshTemplateSummaryChips() {
    var logoUrl = _cleanPublicUrl(_val('tpl-logo-url'));
    var coverUrl = _cleanPublicUrl(_val('tpl-banner-url') || _val('tpl-banner-mobile-url'));
    var pickupEnabled = _checked('tpl-pickup-enabled');
    var deliveryEnabled = _checked('tpl-delivery-enabled');
    var paymentRows = [].slice.call(document.querySelectorAll('[data-tpl-payment-method="1"]'));
    var activePayments = paymentRows.filter(function (row, idx) {
      return _checked('tpl-pay-method-active-' + idx);
    }).length;
    _setTemplateSummaryText('logo', logoUrl ? 'Logo configurada' : 'Sem logo');
    _setTemplateSummaryText('cover', coverUrl ? 'Capa configurada' : 'Sem capa');
    _setTemplateSummaryText('pickup', pickupEnabled ? 'Retirada ativa' : 'Retirada inativa');
    _setTemplateSummaryText('delivery', deliveryEnabled ? 'Entrega ativa' : 'Entrega inativa');
    _setTemplateSummaryText('maincard-identity', (_checked('tpl-maincard-show-logo') || _checked('tpl-maincard-show-name') || _checked('tpl-maincard-show-slogan')) ? 'Identidade ativa' : 'Identidade oculta');
    _setTemplateSummaryText('maincard-status', (_checked('tpl-maincard-show-location') || _checked('tpl-maincard-show-status') || _checked('tpl-maincard-show-hours')) ? 'Status visível' : 'Status oculto');
    _setTemplateSummaryText('maincard-channels', (_checked('tpl-maincard-show-pickup') || _checked('tpl-maincard-show-delivery')) ? 'Canais visíveis' : 'Canais ocultos');
    _setTemplateSummaryText('prep-time', (_val('tpl-prep-time') || '45') + ' min preparo');
    _setTemplateSummaryText('orders-hour', (_val('tpl-orders-per-hour') || '12') + ' pedidos/h');
    _setTemplateSummaryText('status-mode', (_val('tpl-status-mode') === 'manual') ? 'Manual' : 'Automática');
    _setTemplateSummaryText('hours-days', '7 dias');
    _setTemplateSummaryText('whatsapp', (_val('tpl-whatsapp-local') || _val('tpl-whatsapp')) ? 'WhatsApp' : 'Sem WhatsApp');
    _setTemplateSummaryText('email', _val('tpl-email') ? 'E-mail' : 'Sem e-mail');
    _setTemplateSummaryText('contact-footer', _checked('tpl-contact-footer-show') ? 'Rodapé ativo' : 'Rodapé oculto');
    _setTemplateSummaryText('city', _val('tpl-city') || 'Sem cidade');
    _setTemplateSummaryText('postal', _val('tpl-postal') || 'Sem código postal');
    _setTemplateSummaryText('country', _val('tpl-country') || 'Sem país');
    _setTemplateSummaryText('payment-total', paymentRows.length + ' cadastradas');
    _setTemplateSummaryText('payment-active', activePayments + ' ativas');
    _setTemplateSummaryText('payment-note', _val('tpl-payment-note') ? 'Com observação' : 'Sem observação');
    _setTemplateSummaryText('checkout-note', _checked('tpl-allow-note') ? 'Observação ativa' : 'Sem observação');
    _setTemplateSummaryText('checkout-coupon', _checked('tpl-allow-coupon') ? 'Cupom ativo' : 'Cupom oculto');
    _setTemplateSummaryText('whatsapp-tooltip', _val('tpl-whatsapp-tooltip') ? 'Tooltip definido' : 'Sem tooltip');
    _setTemplateSummaryText('whatsapp-message', _val('tpl-whatsapp-message') ? 'Mensagem definida' : 'Mensagem padrão');
    _setTemplateSummaryText('about', _val('tpl-about') ? 'Sobre preenchido' : 'Sem sobre');
    _setTemplateSummaryText('delivery-policy', _val('tpl-delivery-policy') ? 'Entrega definida' : 'Sem política');
    _setTemplateSummaryText('cancel-policy', _val('tpl-cancel-policy') ? 'Cancelamento definido' : 'Sem cancelamento');
  }

  function _configuredDayClosed(idx) {
    var input = document.getElementById('tpl-h-closed-' + idx);
    if (!input) return false;
    return !!input.checked;
  }

  function _configuredSecondPeriodClosed(idx) {
    var input = document.getElementById('tpl-h-closed2-' + idx);
    return input ? !!input.checked : false;
  }

  function _onTemplateHoursChange() {
    _syncHoursDayBlocks();
    _refreshTemplatePreview();
  }

  function _collectHours() {
    var days = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
    return days.map(function (label, idx) {
      var closed = _configuredDayClosed(idx);
      var closed2 = _configuredSecondPeriodClosed(idx);
      var open2 = _val('tpl-h-open2-' + idx);
      var close2 = _val('tpl-h-close2-' + idx);
      var secondHasHours = !!(open2 && close2);
      return {
        day: label,
        open: _val('tpl-h-open-' + idx),
        close: _val('tpl-h-close-' + idx),
        open2: open2,
        close2: close2,
        closed: closed,
        enabled: !closed,
        closed2: closed2,
        enabled2: secondHasHours && !closed2
      };
    });
  }

  function _minutesFromTime(value) {
    var parts = String(value || '').split(':').map(Number);
    if (!isFinite(parts[0])) return null;
    return (parts[0] || 0) * 60 + (isFinite(parts[1]) ? parts[1] : 0);
  }
  function _firstTimeValue(row, keys) {
    row = row || {};
    for (var i = 0; i < keys.length; i += 1) {
      var value = row[keys[i]];
      if (value != null && String(value).trim()) return String(value).trim();
    }
    return '';
  }

  function _previewStoreOpenNow() {
    var hours = _collectHours();
    var now = new Date();
    var idx = (now.getDay() + 6) % 7;
    var row = hours[idx] || null;
    var prevRow = hours[(idx + 6) % 7] || null;
    if (!row) return false;
    var current = now.getHours() * 60 + now.getMinutes();
    function periodsFrom(sourceRow) {
      var list = [];
      sourceRow = sourceRow || {};
      var open = _firstTimeValue(sourceRow, ['open', 'start', 'from', 'abre', 'openingTime', 'startTime']);
      var close = _firstTimeValue(sourceRow, ['close', 'end', 'to', 'fecha', 'closingTime', 'endTime']);
      var open2 = _firstTimeValue(sourceRow, ['open2', 'start2', 'from2', 'abre2', 'openingTime2', 'secondOpen']);
      var close2 = _firstTimeValue(sourceRow, ['close2', 'end2', 'to2', 'fecha2', 'closingTime2', 'secondClose']);
      if (_boolValue(sourceRow.closed) !== true && _boolValue(sourceRow.enabled) !== false && open && close) list.push({ start: open, end: close });
      if (_boolValue(sourceRow.closed2) !== true && _boolValue(sourceRow.enabled2) !== false && open2 && close2) list.push({ start: open2, end: close2 });
      return list;
    }
    function periodIsOpen(period, fromPreviousDay) {
      var start = _minutesFromTime(period.start);
      var end = _minutesFromTime(period.end);
      if (start == null || end == null) return false;
      if (start === end) return false;
      if (end < start) return fromPreviousDay ? current < end : current >= start;
      if (fromPreviousDay) return false;
      return current >= start && current <= end;
    }
    return periodsFrom(row).some(function (period) { return periodIsOpen(period, false); }) ||
      periodsFrom(prevRow).some(function (period) { return periodIsOpen(period, true); });
  }

  function _hoursSummaryFromHours(hours) {
    var dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    var rows = Array.isArray(hours) ? hours : [];
    var groups = {};
    rows.slice(0, 7).forEach(function (row, index) {
      row = row || {};
      var periods = [];
      var open = _firstTimeValue(row, ['open', 'start', 'from', 'abre', 'openingTime', 'startTime']);
      var close = _firstTimeValue(row, ['close', 'end', 'to', 'fecha', 'closingTime', 'endTime']);
      var open2 = _firstTimeValue(row, ['open2', 'start2', 'from2', 'abre2', 'openingTime2', 'secondOpen']);
      var close2 = _firstTimeValue(row, ['close2', 'end2', 'to2', 'fecha2', 'closingTime2', 'secondClose']);
      if (_boolValue(row.closed) !== true && _boolValue(row.enabled) !== false && open && close) periods.push(open + '-' + close);
      if (_boolValue(row.closed2) !== true && _boolValue(row.enabled2) !== false && open2 && close2) periods.push(open2 + '-' + close2);
      if (!periods.length) return;
      var label = periods.join(' / ');
      if (!groups[label]) groups[label] = [];
      groups[label].push(index);
    });
    function compactDays(indexes) {
      var parts = [];
      var start = null;
      var prev = null;
      indexes.forEach(function (idx) {
        if (start === null) { start = idx; prev = idx; return; }
        if (idx === prev + 1) { prev = idx; return; }
        parts.push(start === prev ? dayLabels[start] : dayLabels[start] + '-' + dayLabels[prev]);
        start = idx;
        prev = idx;
      });
      if (start !== null) parts.push(start === prev ? dayLabels[start] : dayLabels[start] + '-' + dayLabels[prev]);
      return parts.join(', ');
    }
    var summary = Object.keys(groups).map(function (label) {
      return compactDays(groups[label]) + ': ' + label;
    });
    return summary.length ? summary.join(' · ') : 'Fechado na semana';
  }

  function _saveTemplateLoja() {
    if (!_validatePublicUrls([{ id: 'tpl-logo-url', label: 'Logo' }, { id: 'tpl-favicon-url', label: 'Favicon' }, { id: 'tpl-banner-url', label: 'Imagem de capa desktop' }, { id: 'tpl-banner-mobile-url', label: 'Imagem de capa mobile' }, { id: 'tpl-featured-image-url', label: 'Imagem do destaque' }, { id: 'tpl-mobile-promo-banner-url', label: 'Banner promocional mobile' }, { id: 'tpl-desktop-promo-banner-url', label: 'Banner promocional desktop' }])) return;
    var fiscal = _fiscalInfo();
    var hours = _collectHours();
    var collectedDeliveryZones = _collectDeliveryZonesFromDom();
    var images = _imageUploadState();
    var currentTpl = _storeConfig.template || {};
    var currentGeral = _storeConfig.geral || {};
    var currentApp = _storeConfig.aparencia || {};
    var currentIntegracoes = _storeConfig.integracoes || {};
    var deliveryArea = _collectDeliveryAreaFromDom(_deliveryAreaFromConfig(currentTpl, _storeConfig.zonas || {}));
    if (collectedDeliveryZones.length) {
      var missingArea = _deliveryAreaMissingItems(deliveryArea);
      if (missingArea.length) {
        UI.toast('Antes de salvar zonas, preencha: ' + missingArea.join(', ') + '.', 'error');
        return;
      }
    }
    var deliveryZonesError = _deliveryZoneValidationError(collectedDeliveryZones);
    if (deliveryZonesError) { UI.toast(deliveryZonesError, 'error'); return; }
    var deliveryZones = _normalizeDeliveryZones(collectedDeliveryZones);
    var primary = document.getElementById('tpl-primary-color') ? (_normalizeHexColor(_val('tpl-primary-color-hex') || _val('tpl-primary-color')) || '#B42318') : (currentTpl.primaryColor || currentGeral.primaryColor || currentApp.primaryColor || '#B42318');
    var palette = _deriveStorePalette(primary);
    var logoUrl = _cleanPublicUrl(_val('tpl-logo-url'));
    var faviconUrl = _cleanPublicUrl(_val('tpl-favicon-url')) || currentTpl.faviconUrl || currentGeral.faviconUrl || currentApp.faviconUrl || '';
    var coverUrl = _cleanPublicUrl(_val('tpl-banner-url'));
    var coverMobileUrl = _cleanPublicUrl(_val('tpl-banner-mobile-url'));
    var mobilePromoBannerUrl = _cleanPublicUrl(_val('tpl-mobile-promo-banner-url'));
    var desktopPromoBannerUrl = _cleanPublicUrl(_val('tpl-desktop-promo-banner-url'));
    var showcaseIds = [];
    var bannerOverlayColor = _normalizeHexColor(_val('tpl-banner-overlay-color')) || _normalizeHexColor(currentTpl.bannerOverlayColor || currentTpl.coverOverlayColor || currentTpl.heroOverlayColor) || '#000000';
    var bannerOverlayOpacityRaw = Number(_val('tpl-banner-overlay-opacity'));
    var bannerOverlayOpacity = isFinite(bannerOverlayOpacityRaw) ? bannerOverlayOpacityRaw : Number(currentTpl.bannerOverlayOpacity != null ? currentTpl.bannerOverlayOpacity : currentTpl.coverOverlayOpacity != null ? currentTpl.coverOverlayOpacity : currentTpl.heroOverlayOpacity != null ? currentTpl.heroOverlayOpacity : 14);
    if (!isFinite(bannerOverlayOpacity)) bannerOverlayOpacity = 14;
    var promoTextColor = _normalizeHexColor(_val('tpl-top-promo-text-color')) || _normalizeHexColor(currentTpl.topPromoTextColor || currentTpl.promoBannerTextColor || currentTpl.bannerPromoTextColor) || '#FFFFFF';
    var mobilePromoBannerPromotionId = String(_val('tpl-mobile-promo-banner-promotion') || '').trim();
    var mobilePromoBannerProductId = String(_val('tpl-mobile-promo-banner-product') || '').trim();
    var mobilePromoBannerTarget = _val('tpl-mobile-promo-banner-target') || 'promotion';
    var featuredType = _val('tpl-featured-type') || 'none';
    var featuredButtonLabel = _val('tpl-featured-button-common') || _val('tpl-featured-button') || _val('tpl-featured-button-promotion') || _val('tpl-featured-button-product') || _val('tpl-featured-button-most') || _val('tpl-featured-button-custom');
    var featuredImageUrl = _cleanPublicUrl(_val('tpl-featured-image-url'));
    var featuredTarget = featuredType === 'custom' ? _val('tpl-featured-target') : '';
    var mostOrderedMode = _val('tpl-most-ordered-mode') || 'auto';
    var featuredProductId = featuredType === 'featured_product' ? _val('tpl-featured-product') : (featuredType === 'most_ordered' && mostOrderedMode === 'manual' ? _val('tpl-featured-most-ordered-product') : '');
    var mainCardConfig = {
      showLogo: _checked('tpl-maincard-show-logo'),
      showStoreName: _checked('tpl-maincard-show-name'),
      showSlogan: _checked('tpl-maincard-show-slogan'),
      showRating: _checked('tpl-maincard-show-rating'),
      showMoreInfoButton: _checked('tpl-maincard-show-more-info'),
      showLocation: _checked('tpl-maincard-show-location'),
      showStoreStatus: _checked('tpl-maincard-show-status'),
      showOpeningHoursSummary: _checked('tpl-maincard-show-hours'),
      showPickup: _checked('tpl-maincard-show-pickup'),
      showDelivery: _checked('tpl-maincard-show-delivery'),
      showPreparationTime: _checked('tpl-maincard-show-prep'),
      showDeliveryTime: _checked('tpl-maincard-show-delivery-time'),
      showMinimumOrder: _checked('tpl-maincard-show-min-order'),
      showAdvanceDays: _checked('tpl-maincard-show-advance-days')
    };
    var shortNameValue = document.getElementById('tpl-short-name') ? _val('tpl-short-name') : (currentTpl.shortName || currentGeral.shortName || '');
    var fiscalCountryValue = document.getElementById('tpl-fiscal-country') ? _val('tpl-fiscal-country') : (currentTpl.fiscalCountry || currentGeral.fiscalCountry || fiscal.code || '');
    var fiscalDocValue = document.getElementById('tpl-fiscal-doc') ? _val('tpl-fiscal-doc') : (currentTpl.fiscalDocument || currentGeral.fiscalDocument || '');
    var languageValue = _normalizeTemplateLanguage(_val('tpl-language') || currentTpl.language || currentGeral.language || currentTpl.defaultLanguage || currentGeral.defaultLanguage || 'es-ES');
    var paymentMethodConfigs = _collectTemplatePaymentMethods();
    var paymentMethods = paymentMethodConfigs.filter(function (m) { return m.active; }).map(function (m) { return m.name; });
    var paymentMethodInstructions = {};
    paymentMethodConfigs.forEach(function (m) {
      if (m.instructions) paymentMethodInstructions[m.key || _paymentMethodKey(m.name)] = m.instructions;
    });
    var paymentActiveByKey = {};
    paymentMethodConfigs.forEach(function (m) {
      paymentActiveByKey[_paymentMethodKey(m.name)] = !!m.active;
      paymentActiveByKey[_paymentMethodKey(m.key)] = !!m.active;
    });
    var methodIsActive = function (keys) {
      return keys.some(function (key) { return paymentActiveByKey[_paymentMethodKey(key)] === true; });
    };
    var selectedStatusMode = _val('tpl-status-mode') === 'manual' ? 'manual' : 'auto';
    var manualClosedValue = selectedStatusMode === 'manual' ? _checked('tpl-manual-closed') : false;
    var manualOpenValue = selectedStatusMode === 'manual' ? !manualClosedValue : false;
    var template = {
      publicName: _val('tpl-public-name'), publicStoreName: _val('tpl-public-name'), shortName: shortNameValue, shortStoreName: shortNameValue, slogan: _val('tpl-slogan'), description: currentTpl.description || currentGeral.description || '', storeDescription: currentTpl.description || currentGeral.description || '', verifiedBadgeEnabled: _checked('tpl-verified-badge'), storeVerified: _checked('tpl-verified-badge'),
      logoUrl: logoUrl, faviconUrl: faviconUrl, coverImageUrl: coverUrl, bannerUrl: coverUrl, coverImageMobileUrl: coverMobileUrl, mobileCoverImageUrl: coverMobileUrl, bannerMobileUrl: coverMobileUrl, logoStoragePath: images.logo && images.logo.imageStoragePath || currentTpl.logoStoragePath || '', logoImagePath: images.logo && (images.logo.imagePath || images.logo.imageStoragePath) || currentTpl.logoImagePath || currentTpl.logoStoragePath || '', faviconStoragePath: images.favicon && images.favicon.imageStoragePath || currentTpl.faviconStoragePath || currentGeral.faviconStoragePath || '', faviconImagePath: images.favicon && (images.favicon.imagePath || images.favicon.imageStoragePath) || currentTpl.faviconImagePath || currentTpl.faviconStoragePath || currentGeral.faviconStoragePath || '', bannerStoragePath: coverUrl ? (images.banner && images.banner.imageStoragePath || currentTpl.bannerStoragePath || currentTpl.coverImageStoragePath || '') : '', bannerImagePath: coverUrl ? (images.banner && (images.banner.imagePath || images.banner.imageStoragePath) || currentTpl.bannerImagePath || currentTpl.bannerStoragePath || currentTpl.coverImageStoragePath || '') : '', coverImageStoragePath: coverUrl ? (images.banner && images.banner.imageStoragePath || currentTpl.coverImageStoragePath || currentTpl.bannerStoragePath || '') : '', bannerMobileStoragePath: coverMobileUrl ? (images.bannerMobile && images.bannerMobile.imageStoragePath || currentTpl.bannerMobileStoragePath || currentTpl.coverImageMobileStoragePath || '') : '', bannerMobileImagePath: coverMobileUrl ? (images.bannerMobile && (images.bannerMobile.imagePath || images.bannerMobile.imageStoragePath) || currentTpl.bannerMobileImagePath || currentTpl.bannerMobileStoragePath || currentTpl.coverImageMobileStoragePath || '') : '', coverImageMobileStoragePath: coverMobileUrl ? (images.bannerMobile && images.bannerMobile.imageStoragePath || currentTpl.coverImageMobileStoragePath || currentTpl.bannerMobileStoragePath || '') : '',
      topPromoEnabled: false, showPromoBanner: false, desktopPromoBannerEnabled: false, promoBannerDesktopEnabled: false, topPromoText: _val('tpl-top-promo-text'), promoBannerText: _val('tpl-top-promo-text'), topPromoColor: _val('tpl-top-promo-color') || primary, promoBannerColor: _val('tpl-top-promo-color') || primary, topPromoTextColor: promoTextColor, promoBannerTextColor: promoTextColor, bannerPromoTextColor: promoTextColor, topPromoClosable: _checked('tpl-top-promo-closable'), promoBannerDismissible: _checked('tpl-top-promo-closable'), topUseCover: _checked('tpl-top-use-cover'), useCoverImage: _checked('tpl-top-use-cover'), topShowRegion: _checked('tpl-top-show-region'), showCityRegion: _checked('tpl-top-show-region'), topShowMoreInfo: _checked('tpl-top-more-info'), showMoreInfoButton: _checked('tpl-top-more-info'), topShowChips: _checked('tpl-top-chips'), showDeliveryPickupChips: _checked('tpl-top-chips'),
      mobilePromoBannerEnabled: false, promotionalBannerEnabled: false, promoVisualBannerEnabled: false, mobilePromoBannerImageUrl: mobilePromoBannerUrl, promoBannerImageUrl: mobilePromoBannerUrl, promotionalBannerImageUrl: mobilePromoBannerUrl, desktopPromoBannerImageUrl: desktopPromoBannerUrl, promoBannerDesktopImageUrl: desktopPromoBannerUrl, mobilePromoBannerStoragePath: mobilePromoBannerUrl ? (images.promoMobile && images.promoMobile.imageStoragePath || currentTpl.mobilePromoBannerStoragePath || currentTpl.promoBannerImageStoragePath || '') : '', promoBannerImageStoragePath: mobilePromoBannerUrl ? (images.promoMobile && images.promoMobile.imageStoragePath || currentTpl.promoBannerImageStoragePath || currentTpl.mobilePromoBannerStoragePath || '') : '', promoBannerImagePath: mobilePromoBannerUrl ? (images.promoMobile && (images.promoMobile.imagePath || images.promoMobile.imageStoragePath) || currentTpl.promoBannerImagePath || currentTpl.promoBannerImageStoragePath || currentTpl.mobilePromoBannerStoragePath || '') : '', desktopPromoBannerStoragePath: desktopPromoBannerUrl ? (images.promoDesktop && images.promoDesktop.imageStoragePath || currentTpl.desktopPromoBannerStoragePath || currentTpl.promoBannerDesktopStoragePath || '') : '', promoBannerDesktopStoragePath: desktopPromoBannerUrl ? (images.promoDesktop && images.promoDesktop.imageStoragePath || currentTpl.promoBannerDesktopStoragePath || currentTpl.desktopPromoBannerStoragePath || '') : '', desktopPromoBannerImagePath: desktopPromoBannerUrl ? (images.promoDesktop && (images.promoDesktop.imagePath || images.promoDesktop.imageStoragePath) || currentTpl.desktopPromoBannerImagePath || currentTpl.promoBannerDesktopImagePath || currentTpl.desktopPromoBannerStoragePath || '') : '', mobilePromoBannerBadge: _val('tpl-mobile-promo-banner-badge'), promoBannerBadge: _val('tpl-mobile-promo-banner-badge'), mobilePromoBannerTitle: _val('tpl-mobile-promo-banner-title'), promoBannerTitle: _val('tpl-mobile-promo-banner-title'), mobilePromoBannerText: _val('tpl-mobile-promo-banner-text'), promoBannerSubtitle: _val('tpl-mobile-promo-banner-text'), mobilePromoBannerButtonText: _val('tpl-mobile-promo-banner-button'), promoBannerButtonText: _val('tpl-mobile-promo-banner-button'), mobilePromoBannerPromotionId: mobilePromoBannerPromotionId, promoBannerPromotionId: mobilePromoBannerPromotionId, mobilePromoBannerProductId: mobilePromoBannerProductId, promoBannerProductId: mobilePromoBannerProductId, mobilePromoBannerTarget: mobilePromoBannerTarget, promoBannerTarget: mobilePromoBannerTarget,
      bannerOverlayColor: bannerOverlayColor, coverOverlayColor: bannerOverlayColor, heroOverlayColor: bannerOverlayColor, topBannerOverlayColor: bannerOverlayColor,
      bannerOverlayOpacity: bannerOverlayOpacity, coverOverlayOpacity: bannerOverlayOpacity, heroOverlayOpacity: bannerOverlayOpacity, topBannerOverlayOpacity: bannerOverlayOpacity,
      mainCardConfig: mainCardConfig, topShowRegion: mainCardConfig.showLocation || mainCardConfig.showStoreStatus, showCityRegion: mainCardConfig.showLocation || mainCardConfig.showStoreStatus, topShowMoreInfo: mainCardConfig.showMoreInfoButton, showMoreInfoButton: mainCardConfig.showMoreInfoButton, topShowChips: mainCardConfig.showPickup || mainCardConfig.showDelivery || mainCardConfig.showPreparationTime || mainCardConfig.showDeliveryTime || mainCardConfig.showMinimumOrder || mainCardConfig.showAdvanceDays, showDeliveryPickupChips: mainCardConfig.showPickup || mainCardConfig.showDelivery || mainCardConfig.showPreparationTime || mainCardConfig.showDeliveryTime || mainCardConfig.showMinimumOrder || mainCardConfig.showAdvanceDays,
      featuredActionEnabled: _checked('tpl-featured-enabled'), featuredActionType: featuredType, featuredActionKicker: _val('tpl-featured-kicker'), featuredKicker: _val('tpl-featured-kicker'), featuredActionTitle: _val('tpl-featured-title'), featuredActionText: _val('tpl-featured-text'), featuredActionButtonLabel: featuredButtonLabel, featuredActionImageUrl: featuredImageUrl, featuredImageUrl: featuredImageUrl, featuredActionImageStoragePath: images.featured && images.featured.imageStoragePath || currentTpl.featuredActionImageStoragePath || '', featuredActionImagePath: images.featured && (images.featured.imagePath || images.featured.imageStoragePath) || currentTpl.featuredActionImagePath || currentTpl.featuredActionImageStoragePath || '', featuredActionTarget: featuredTarget, featuredActionProductId: featuredProductId, featuredProductId: featuredType === 'featured_product' ? featuredProductId : '', mostOrderedProductId: featuredType === 'most_ordered' ? featuredProductId : '', mostOrderedMode: featuredType === 'most_ordered' ? mostOrderedMode : '', featuredMostOrderedMode: featuredType === 'most_ordered' ? mostOrderedMode : '', featuredActionCouponId: featuredType === 'coupon' ? _val('tpl-featured-coupon') : '', featuredCouponId: featuredType === 'coupon' ? _val('tpl-featured-coupon') : '', featuredActionPromotionId: featuredType === 'promotion' ? _val('tpl-featured-promotion') : '', featuredPromotionId: featuredType === 'promotion' ? _val('tpl-featured-promotion') : '',
      showFeaturedProducts: true,
      featuredProductIds: showcaseIds, highlightProductIds: showcaseIds, showcaseProductIds: showcaseIds,
      primaryColor: primary, brandColor: primary, themeColor: primary, accentColor: primary, secondaryColor: currentTpl.secondaryColor || currentGeral.secondaryColor || currentApp.secondaryColor || palette.primaryDark, colorPalette: palette, supportColors: palette, language: languageValue, defaultLanguage: languageValue, mainLanguage: languageValue, storeLanguage: languageValue, fiscalCountry: fiscalCountryValue, fiscalDocument: fiscalDocValue,
      whatsapp: _val('tpl-whatsapp'), phone: _val('tpl-phone'), email: _val('tpl-email'), instagram: _val('tpl-instagram'), facebook: _val('tpl-facebook'), tiktok: _val('tpl-tiktok'),
      contactDisplayConfig: {
        showContactsInFooter: _checked('tpl-contact-footer-show'),
        showWhatsappInFooter: _checked('tpl-contact-footer-whatsapp'),
        showPhoneInFooter: _checked('tpl-contact-footer-phone'),
        showEmailInFooter: _checked('tpl-contact-footer-email'),
        showInstagramInFooter: _checked('tpl-contact-footer-instagram'),
        showFacebookInFooter: _checked('tpl-contact-footer-facebook'),
        showTiktokInFooter: _checked('tpl-contact-footer-tiktok')
      },
address: _val('tpl-address'), number: _val('tpl-number'), numero: _val('tpl-number'), city: _val('tpl-city'), region: _val('tpl-region'), neighborhood: _val('tpl-neighborhood') || currentTpl.neighborhood || currentGeral.neighborhood || currentApp.neighborhood || '', postalCode: _val('tpl-postal'), country: _val('tpl-country'), reference: _val('tpl-reference'), complemento: _val('tpl-reference'), showAddress: currentTpl.showAddress !== undefined ? currentTpl.showAddress : (currentGeral.showAddress !== undefined ? currentGeral.showAddress : (currentApp.showAddress !== undefined ? currentApp.showAddress : true)), mapsUrl: currentTpl.mapsUrl || currentGeral.mapsUrl || currentApp.mapsUrl || '', deliveryArea: deliveryArea, deliveryCity: deliveryArea.city, deliveryProvince: deliveryArea.province, deliveryCountry: deliveryArea.country, deliveryPostalCode: deliveryArea.postalCode, pickupNote: currentTpl.pickupNote || currentGeral.pickupNote || currentApp.pickupNote || '',      statusMode: selectedStatusMode, manualClosed: manualClosedValue, manualOpen: manualOpenValue, hours: hours, pickupHours: _val('tpl-pickup-hours'), deliveryHours: _val('tpl-delivery-hours'), openingHoursSummary: _hoursSummaryFromHours(hours), hoursSummary: _hoursSummaryFromHours(hours), todayHoursText: _hoursSummaryFromHours(hours),
      pickupEnabled: _checked('tpl-pickup-enabled'), deliveryEnabled: _checked('tpl-delivery-enabled'), minDeliveryOrder: _numVal('tpl-min-delivery'), minimumDeliveryOrder: _numVal('tpl-min-delivery'), maxOrdersPerSlot: _numVal('tpl-orders-per-hour'), ordersPerHour: _numVal('tpl-orders-per-hour'), maxAdvanceDays: _numVal('tpl-max-advance-days'), advanceDaysLimit: _numVal('tpl-max-advance-days'), scheduleDays: _numVal('tpl-max-advance-days') + 1, daysToShow: _numVal('tpl-max-advance-days') + 1, minAdvanceDays: 0, minimumAdvanceDays: 0, deliveryFee: document.getElementById('tpl-delivery-fee') ? _numVal('tpl-delivery-fee') : (currentTpl.deliveryFee || currentGeral.deliveryFee || currentApp.deliveryFee || ''), prepTime: _val('tpl-prep-time') || currentTpl.prepTime || currentGeral.prepTime || currentApp.prepTime || '', averagePrepTime: _val('tpl-prep-time') || currentTpl.averagePrepTime || currentGeral.averagePrepTime || currentApp.averagePrepTime || currentTpl.prepTime || '', deliveryTime: _val('tpl-delivery-time') || currentTpl.deliveryTime || currentGeral.deliveryTime || currentApp.deliveryTime || '', averageDeliveryTime: _val('tpl-delivery-time') || currentTpl.averageDeliveryTime || currentGeral.averageDeliveryTime || currentApp.averageDeliveryTime || currentTpl.deliveryTime || '',
      deliveryZones: deliveryZones,
      stripeEnabled: currentIntegracoes.stripeEnabled === true,
      stripeConnectedAccountId: currentIntegracoes.stripeConnectedAccountId || currentIntegracoes.stripeAccountId || '',
      stripeAccountId: currentIntegracoes.stripeAccountId || currentIntegracoes.stripeConnectedAccountId || '',
      stripeConnectStatus: currentIntegracoes.stripeConnectStatus || '',
      paymentMethods: paymentMethods, paymentMethodConfigs: paymentMethodConfigs, paymentMethodInstructions: paymentMethodInstructions, paymentNote: _val('tpl-payment-note'),
      payments: { cash: methodIsActive(['dinheiro', 'efectivo', 'efetivo', 'cash']), card: methodIsActive(['cartao', 'tarjeta', 'card']), bizum: methodIsActive(['bizum']), mbway: methodIsActive(['mb-way', 'mbway']), transfer: methodIsActive(['transferencia', 'transfer', 'bank-transfer']), localTransfer: methodIsActive(['transferencia', 'transfer', 'bank-transfer']), online: methodIsActive(['pagamento-online', 'pagamento-online-stripe', 'cartao-online-stripe', 'pago-online', 'online', 'stripe']), note: _val('tpl-payment-note'), paymentMethods: paymentMethods, paymentMethodConfigs: paymentMethodConfigs, paymentMethodInstructions: paymentMethodInstructions, paymentNote: _val('tpl-payment-note') },
      mainButtonText: _val('tpl-main-button'), cartButtonText: _val('tpl-cart-button'), whatsappMessage: _val('tpl-whatsapp-message'), whatsappTooltip: _val('tpl-whatsapp-tooltip'), whatsappFloatingLabel: _val('tpl-whatsapp-tooltip'), allowCustomerNote: _checked('tpl-allow-note'), allowFulfillmentChoice: document.getElementById('tpl-allow-mode') ? _checked('tpl-allow-mode') : (currentTpl.allowFulfillmentChoice !== false), allowCoupon: _checked('tpl-allow-coupon'), checkoutWarning: _val('tpl-checkout-warning'),
      about: _val('tpl-about'), aboutStore: _val('tpl-about'), importantNotice: _val('tpl-important'), deliveryPolicy: _val('tpl-delivery-policy'), cancelPolicy: _val('tpl-cancel-policy'), cancellationPolicy: _val('tpl-cancel-policy'), footerText: _val('tpl-footer'), updatedAt: new Date().toISOString()
    };
    var geral = Object.assign({}, currentGeral, {
      businessName: template.publicName, shortName: template.shortName, visualName: template.publicName, slogan: template.slogan, description: template.description,
      whatsapp: template.whatsapp, phone: template.phone || template.whatsapp, email: template.email, country: template.country, city: template.city, language: template.language, defaultLanguage: template.language,
      logoUrl: template.logoUrl, faviconUrl: template.faviconUrl, faviconStoragePath: template.faviconStoragePath, coverImageUrl: template.coverImageUrl, bannerUrl: template.bannerUrl, coverImageMobileUrl: template.coverImageMobileUrl, mobileCoverImageUrl: template.mobileCoverImageUrl, bannerMobileUrl: template.bannerMobileUrl, primaryColor: template.primaryColor, secondaryColor: template.secondaryColor, colorPalette: palette, supportColors: palette, fiscalDocument: template.fiscalDocument,
      instagram: template.instagram, facebook: template.facebook, tiktok: template.tiktok
    });
    var aparencia = Object.assign({}, currentApp, { logoUrl: template.logoUrl, faviconUrl: template.faviconUrl, faviconStoragePath: template.faviconStoragePath, coverImageUrl: template.coverImageUrl, bannerUrl: template.bannerUrl, coverImageMobileUrl: template.coverImageMobileUrl, mobileCoverImageUrl: template.mobileCoverImageUrl, bannerMobileUrl: template.bannerMobileUrl, primaryColor: template.primaryColor, secondaryColor: template.secondaryColor, colorPalette: palette, supportColors: palette, visualName: template.publicName });
    var endereco = Object.assign({}, _storeConfig.endereco || {}, { address: template.address, city: template.city, region: template.region, province: template.region, state: template.region, postalCode: template.postalCode, country: template.country, showAddress: template.showAddress, mapsUrl: template.mapsUrl });
    var pagamentos = Object.assign({}, _storeConfig.pagamentos || {}, template.payments, { paymentMethods: paymentMethods, paymentMethodConfigs: paymentMethodConfigs, paymentMethodInstructions: paymentMethodInstructions, paymentNote: template.paymentNote, note: template.paymentNote });
    var horarios = Object.assign({}, _storeConfig.horarios || {}, { days: hours, pickupHours: template.pickupHours, deliveryHours: template.deliveryHours, openingHoursSummary: template.openingHoursSummary, hoursSummary: template.hoursSummary, todayHoursText: template.todayHoursText });
    var templateWhatsappCountry = _val('tpl-whatsapp-country') || currentIntegracoes.whatsappCountryCode || '';
    var templateWhatsappLocal = _val('tpl-whatsapp-local') || '';
    var integracoes = Object.assign({}, currentIntegracoes, {
      whatsapp: templateWhatsappLocal || currentIntegracoes.whatsapp || '',
      whatsappCountryCode: templateWhatsappCountry,
      whatsappFull: [templateWhatsappCountry, templateWhatsappLocal].filter(Boolean).join(' ') || template.whatsapp || currentIntegracoes.whatsappFull || '',
      instagram: template.instagram,
      facebook: template.facebook,
      tiktok: template.tiktok,
      updatedAt: template.updatedAt
    });
    var operacao = Object.assign({}, _storeConfig.operacao || {}, {
      statusMode: template.statusMode,
      manualClosed: template.manualClosed,
      manualOpen: template.manualOpen,
      isOpen: template.statusMode === 'manual' ? template.manualOpen === true : _previewStoreOpenNow(),
      hours: hours,
      weeklyHours: hours,
      openingHoursSummary: template.openingHoursSummary,
      hoursSummary: template.hoursSummary,
      todayHoursText: template.todayHoursText,
      updatedAt: template.updatedAt
    });
    var zonas = Object.assign({}, _storeConfig.zonas || {}, { area: template.deliveryArea, list: deliveryZones, deliveryZones: deliveryZones });
    var categoryVisualUpdates = _collectTemplateCategoryVisualUpdates();
    for (var cv = 0; cv < categoryVisualUpdates.length; cv += 1) {
      var cvUrl = categoryVisualUpdates[cv].data.graphicUrl;
      if (cvUrl && !_isPublicUrl(cvUrl)) {
        UI.toast('Imagem da categoria deve começar com http:// ou https://.', 'error');
        return;
      }
    }
    Promise.all([
      DB.setDocRoot('config', 'template', template),
      DB.setDocRoot('config', 'geral', geral),
      DB.setDocRoot('config', 'aparencia', aparencia),
      DB.setDocRoot('config', 'endereco', endereco),
      DB.setDocRoot('config', 'pagamentos', pagamentos),
      DB.setDocRoot('config', 'horarios', horarios),
      DB.setDocRoot('config', 'integracoes', integracoes),
      DB.setDocRoot('config', 'operacao', operacao),
      DB.setDocRoot('config', 'zonas', zonas)
    ].concat(categoryVisualUpdates.map(function (item) { return DB.update('categories', item.id, item.data); }))).then(function () {
      _storeConfig.template = template; _storeConfig.geral = geral; _storeConfig.aparencia = aparencia; _storeConfig.endereco = endereco; _storeConfig.pagamentos = pagamentos; _storeConfig.horarios = horarios; _storeConfig.integracoes = integracoes; _storeConfig.operacao = operacao; _storeConfig.zonas = zonas;
      if (categoryVisualUpdates.length) {
        _categories = (_categories || []).map(function (cat) {
          var found = categoryVisualUpdates.find(function (item) { return String(item.id) === String(cat.id); });
          return found ? Object.assign({}, cat, found.data) : cat;
        });
      }
      _deliveryZonesDraft = deliveryZones;
      _deliveryZonesDraftDirty = false;
      _refreshTemplatePreview();
      return _syncSystemTenantStoreFromTemplate(template);
    }).then(function () {
      if (window.AdminApp && typeof AdminApp._applyStoreOnlineStatus === 'function') {
        AdminApp._applyStoreOnlineStatus(template.statusMode === 'manual' ? template.manualOpen === true : _previewStoreOpenNow(), false, template.statusMode === 'manual' ? 'manual' : 'auto');
      } else if (window.AdminApp && typeof AdminApp.refreshStoreOnlineStatus === 'function') {
        AdminApp.refreshStoreOnlineStatus();
      }
      UI.toast('Alterações visíveis na loja salvas.', 'success');
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _syncHoursDayBlocks() {
    var mode = _val('tpl-status-mode') || 'auto';
    var todayIndex = (new Date().getDay() + 6) % 7;
    var autoOpenNow = mode === 'auto' ? _previewStoreOpenNow() : null;
    for (var i = 0; i < 7; i += 1) {
      var row = document.querySelector('[data-hours-day="' + i + '"]');
      if (!row) continue;
      var configuredClosed = _configuredDayClosed(i);
      var runtimeClosed = mode === 'auto' && i === todayIndex && !configuredClosed && autoOpenNow === false;
      var closed = configuredClosed;
      var secondClosed = _configuredSecondPeriodClosed(i);
      var secondEnabledInput = document.getElementById('tpl-h-enabled2-' + i);
      var secondHasHours = !!(_val('tpl-h-open2-' + i) && _val('tpl-h-close2-' + i));
      if (secondEnabledInput) secondEnabledInput.checked = secondHasHours && !secondClosed;
      var secondFields = row.querySelector('[data-hours-secondary-fields]');
      var mainFields = [].slice.call(row.querySelectorAll('[data-hours-main-field]'));
      var closedToggle = row.querySelector('.tpl-hours-day-closed-toggle');
      var firstClosedToggle = document.getElementById('tpl-h-closed-' + i);
      var secondClosedToggle = document.getElementById('tpl-h-closed2-' + i);
      row.classList.toggle('is-closed', closed);
      row.classList.toggle('is-second-closed', secondClosed);
      row.classList.toggle('is-secondary-off', false);
      row.classList.toggle('is-auto-runtime-closed', runtimeClosed);
      row.classList.toggle('is-auto-runtime-open', mode === 'auto' && i === todayIndex && !configuredClosed && autoOpenNow === true);
      if (closedToggle) closedToggle.style.display = 'block';
      if (firstClosedToggle && firstClosedToggle.closest('.tpl-toggle')) firstClosedToggle.closest('.tpl-toggle').classList.toggle('is-checked', closed);
      if (secondClosedToggle && secondClosedToggle.closest('.tpl-toggle')) secondClosedToggle.closest('.tpl-toggle').classList.toggle('is-checked', secondClosed);
      mainFields.forEach(function (field) {
        field.style.display = closed ? 'none' : '';
        [].slice.call(field.querySelectorAll('input,select,textarea,button')).forEach(function (el) { el.disabled = closed; });
      });
      if (secondFields) {
        secondFields.style.display = 'grid';
        [].slice.call(secondFields.querySelectorAll('input,select,textarea,button')).forEach(function (el) {
          if (el.id === 'tpl-h-closed2-' + i) {
            el.disabled = false;
          } else {
            el.disabled = secondClosed;
          }
        });
      }
    }
  }

  function _syncContactFooterBlocks() {
    var enabled = _checked('tpl-contact-footer-show');
    var wrap = document.getElementById('tpl-contact-footer-options');
    if (wrap) wrap.style.display = enabled ? 'grid' : 'none';
  }

  function _syncPhoneCompositeFields() {
    ['tpl-whatsapp', 'tpl-phone'].forEach(function (id) {
      var hidden = document.getElementById(id);
      var local = document.getElementById(id + '-local');
      var country = document.getElementById(id + '-country');
      if (!hidden || !local || !country) return;
      var countries = _phoneCountryList();
      var selected = countries.find(function (item) { return item.code === country.value; }) || countries[0];
      var localDigits = _normalizePhoneNumberLocal(local.value).replace(/^\+/, '');
      if (!localDigits && hidden.value) {
        var detected = _detectPhoneCountry(hidden.value);
        if (detected && detected.local) {
          localDigits = detected.local;
          local.value = detected.local;
          country.value = detected.country || selected.code;
          selected = countries.find(function (item) { return item.code === country.value; }) || selected;
        }
      }
      hidden.value = (selected && selected.dial ? selected.dial : '+34') + localDigits;
    });
  }

  function _renderSeoLoja() {
    _ensureTemplateStyles();
    _loadStoreConfig().then(function () {
      var geral = _storeConfig.geral || {};
      var tpl = _storeConfig.template || {};
      var zonas = _storeConfig.zonas || {};
      var seo = _storeConfig.seo || {};
      var deliveryArea = _deliveryAreaFromConfig(tpl, zonas);
      var deliveryZones = _normalizeDeliveryZones(
        Array.isArray(tpl.deliveryZones) && tpl.deliveryZones.length
          ? tpl.deliveryZones
          : (Array.isArray(zonas.list) && zonas.list.length ? zonas.list : (Array.isArray(zonas.deliveryZones) && zonas.deliveryZones.length ? zonas.deliveryZones : []))
      );
      var zonesSummary = _deliveryZonesSummary(deliveryZones);
      var businessName = seo.businessName || geral.businessName || tpl.publicName || '';
      var city = seo.city || deliveryArea.city || geral.city || tpl.city || '';
      var category = seo.mainKeyword || 'Comida brasileira';
      var titleDefault = businessName ? (businessName + ' | ' + category + (city ? ' em ' + city : '')) : 'Título SEO da loja';
      var descDefault = seo.description || geral.description || tpl.storeDescription || tpl.aboutStore || 'Descrição SEO da loja com cidade, produto e diferencial.';
      var shareCustom = seo.shareCustomEnabled !== undefined ? !!seo.shareCustomEnabled : !!(seo.ogTitle || seo.ogDescription || seo.shareTitle || seo.shareDescription);
      var shareTitle = seo.shareTitle || seo.ogTitle || titleDefault;
      var shareDesc = seo.shareDescription || seo.ogDescription || descDefault;
      var publicAddress = seo.publicAddress || tpl.address || '';
      var publicPhone = seo.publicPhone || geral.phone || tpl.phone || '';
      var publicWhatsapp = seo.publicWhatsapp || geral.whatsapp || tpl.whatsapp || '';
      var googleMaps = seo.googleMapsUrl || tpl.mapsUrl || '';
      var googleBusiness = seo.googleBusinessUrl || '';
      var regionDefault = seo.deliveryArea || seo.neighborhoods || zonesSummary || [deliveryArea.city, deliveryArea.province].filter(Boolean).join(' · ') || tpl.neighborhood || geral.neighborhood || tpl.deliveryAreaText || '';
      var storeUrl = _publicStoreUrl();
      var published = !!storeUrl;
      var content = document.getElementById('catalogo-content');
      content.innerHTML =
        '<div class="bf-page tpl-config-page" style="padding:0;display:flex;flex-direction:column;font-family:Manrope,Inter,sans-serif;">' +
          '<div class="tpl-config-head">' +
            '<div style="min-width:0;flex:1 1 420px;"><h2 class="tpl-config-title">SEO da loja</h2><p class="tpl-config-subtitle">Preencha estas informações para ajudar sua loja a aparecer melhor no Google e para deixar os links compartilhados mais claros e profissionais.</p><div class="tpl-config-status"><span class="tpl-config-chip" data-seo-summary="title">' + (seo.title ? 'Título configurado' : 'Título pendente') + '</span><span class="tpl-config-chip" data-seo-summary="description">' + (seo.description ? 'Descrição configurada' : 'Descrição pendente') + '</span><span class="tpl-config-chip" data-seo-summary="image">' + (seo.ogImage || seo.imageUrl ? 'Imagem configurada' : 'Sem imagem') + '</span></div></div>' +
            '<button type="button" class="tpl-config-save" data-save-seo-loja="1">Salvar alterações</button>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:14px;margin-top:16px;">' +
            '<section class="tpl-config-panel" style="' + _cardStyle() + '">' + _sectionTitle('Aparência no Google', 'Use um título claro e uma descrição curta para apresentar a loja nas buscas.', 'travel_explore') +
              '<div style="display:grid;grid-template-columns:minmax(0,1.7fr) minmax(160px,.55fr);gap:12px;align-items:start;">' +
                '<div style="min-width:0;">' + _fieldHtml('seo-title', 'Título da loja no Google', seo.title || titleDefault, 'Nome da loja | categoria em cidade') + '</div>' +
                '<div style="min-width:0;">' + _fieldHtml('seo-keyword', 'Palavra-chave principal', seo.mainKeyword || '', 'comida brasileira em Pamplona') + '</div>' +
                '<div style="grid-column:1/-1;">' + _textareaHtml('seo-description', 'Descrição da loja no Google', seo.description || descDefault, 'Resumo claro com produto, cidade e diferencial.', 3) + '</div>' +
                '<div style="grid-column:1/-1;font-size:12px;color:#6F6860;line-height:1.5;">Título ideal: até 60 caracteres. Descrição ideal: até 160 caracteres.</div>' +
                '<div style="grid-column:1/-1;">' + _seoPreviewGoogleHtml(titleDefault, descDefault, storeUrl, published, seo.title, seo.description) + '</div>' +
              '</div>' +
            '</section>' +
            '<section class="tpl-config-panel" style="' + _cardStyle() + '">' + _sectionTitle('SEO local', 'Informe a região principal para dar contexto à busca da loja.', 'location_on') +
              '<div style="display:grid;grid-template-columns:minmax(180px,.45fr) minmax(260px,1fr);gap:12px;align-items:start;">' +
                _fieldHtml('seo-city', 'Cidade principal atendida', city, 'Pamplona') +
                _fieldHtml('seo-delivery-area', 'Região atendida', regionDefault, 'Centro, Rochapea, Pamplona e arredores') +
                '<input id="seo-neighborhoods" type="hidden" value="' + _esc(regionDefault) + '">' +
              '</div>' +
              '<div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;padding:13px 14px;border:1px solid #EAE4DA;border-radius:14px;background:#FFFCF8;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);">' +
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
                  '<div style="min-width:0;flex:1;">' +
                    '<div style="' + _labelStyle() + '">Resumo somente leitura</div>' +
                    '<div style="font-size:15px;line-height:1.35;color:#1F1F1F;font-weight:600;margin-top:4px;">' + _esc(businessName || 'Nome comercial') + '</div>' +
                    '<div style="font-size:12px;color:#6F6860;line-height:1.5;margin-top:8px;">' +
                      'Endereço: ' + _esc(publicAddress || '—') + '<br>' +
                      'Telefone: ' + _esc(publicPhone || '—') + '<br>' +
                      'WhatsApp: ' + _esc(publicWhatsapp || '—') +
                    '</div>' +
                  '</div>' +
                  '<button type="button" onclick="Modules.Catalogo._switchSub(\'template\')" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Editar dados da loja</button>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section class="tpl-config-panel" style="' + _cardStyle() + '">' + _sectionTitle('Compartilhamento', 'Defina como a loja aparece quando o link é enviado em WhatsApp e redes sociais.', 'ios_share') +
              '<div style="display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:12px;align-items:start;">' +
                '<div class="tpl-image-card">' +
                  '<div style="display:flex;flex-direction:column;gap:7px;">' +
                    '<span style="' + _labelStyle() + '">Imagem de compartilhamento</span>' +
                    '<div class="tpl-image-actions">' +
                      '<button type="button" class="tpl-image-btn primary" onclick="document.getElementById(\'seo-og-file\').click()">Enviar imagem</button>' +
                      '<button type="button" class="tpl-image-btn ghost" onclick="Modules.Catalogo._clearStoreImage(\'share\')">Remover imagem</button>' +
                    '</div>' +
                    '<input id="seo-og-file" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Catalogo._uploadStoreImage(event,\'share\')" style="display:none;">' +
                    '<input id="seo-og-image" type="hidden" value="' + _esc(_cleanPublicUrl(seo.ogImage || seo.imageUrl || tpl.bannerUrl || geral.bannerUrl || '')) + '">' +
                    '<div class="tpl-image-note">Imagem recomendada: 1200 × 630 px. Use JPG, PNG ou WebP.</div>' +
                  '</div>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:12px;min-width:0;">' +
                  _plainSwitchHtml('seo-share-custom-enabled', 'Usar texto próprio para compartilhamento', shareCustom, 'Quando ativado, WhatsApp e redes usam título e descrição específicos.') +
                  '<div id="seo-share-custom-fields" style="display:' + (shareCustom ? 'block' : 'none') + ';">' +
                    '<div style="display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:12px;align-items:start;">' +
                      _fieldHtml('seo-share-title', 'Título para compartilhamento', shareTitle, 'Nome da loja') +
                      _textareaHtml('seo-share-desc', 'Descrição para compartilhamento', shareDesc, 'Texto curto para redes sociais.', 3) +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div style="grid-column:1/-1;">' + _seoPreviewHtml(seo, titleDefault, descDefault, storeUrl, published, shareCustom, seo.ogImage || seo.imageUrl || tpl.bannerUrl || geral.bannerUrl || '') + '</div>' +
              '</div>' +
            '</section>' +
            '<div style="display:flex;justify-content:flex-end;"><button type="button" class="tpl-config-save" data-save-seo-loja="1">Salvar alterações</button></div>' +
          '</div>' +
        '</div>';
      setTimeout(function () {
        [
          ['seo-title', 60],
          ['seo-description', 160],
          ['seo-keyword', 60],
          ['seo-city', 80],
          ['seo-share-title', 70],
          ['seo-share-desc', 160]
        ].forEach(function (item) {
          var el = document.getElementById(item[0]);
          if (el) el.setAttribute('maxlength', String(item[1]));
        });
        [].slice.call(content.querySelectorAll('input,textarea,select')).forEach(function (el) {
          el.addEventListener('input', _refreshSeoPreview);
          el.addEventListener('change', _refreshSeoPreview);
        });
        [].slice.call(content.querySelectorAll('[data-save-seo-loja="1"]')).forEach(function (btn) {
          btn.addEventListener('click', function (ev) { ev.preventDefault(); _saveSeoLoja(); });
        });
        _refreshSeoPreview();
      }, 80);
    });
  }

  function _seoPreviewGoogleHtml(titleDefault, descDefault, urlBase, published, seoTitle, seoDesc) {
    var cleanUrl = published && _cleanPublicUrl(urlBase) ? _cleanPublicUrl(urlBase) : 'URL da loja será exibida após publicação';
    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);font-family:Arial,sans-serif;">' +
      '<div id="seo-preview-url" data-published="' + (published ? '1' : '0') + '" style="font-size:12px;color:#202124;line-height:1.35;margin-bottom:3px;">' + _esc(cleanUrl) + '</div>' +
      '<div id="seo-preview-title" style="font-size:19px;color:#1a0dab;line-height:1.3;margin-bottom:4px;font-weight:400;">' + _esc(seoTitle || titleDefault) + '</div>' +
      '<div id="seo-preview-desc" style="font-size:13px;color:#4d5156;line-height:1.5;">' + _esc(seoDesc || descDefault) + '</div>' +
    '</div>';
  }

  function _seoPreviewHtml(seo, titleDefault, descDefault, urlBase, published, shareCustom, imageUrl) {
    var img = imageUrl || seo.ogImage || seo.imageUrl || '';
    var shareTitle = shareCustom ? (seo.shareTitle || seo.ogTitle || titleDefault) : (seo.title || titleDefault);
    var shareDesc = shareCustom ? (seo.shareDescription || seo.ogDescription || descDefault) : (seo.description || descDefault);
    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="height:150px;background:#FAFAF8;display:flex;align-items:center;justify-content:center;color:#6F6860;font-size:12px;"><img id="seo-preview-share-img" src="' + _esc(_cleanPublicUrl(img) || '') + '" style="width:100%;height:100%;object-fit:cover;display:' + (_cleanPublicUrl(img) ? 'block' : 'none') + ';"><span id="seo-preview-share-placeholder"' + (_cleanPublicUrl(img) ? ' style="display:none;"' : '') + '>Sem imagem de compartilhamento</span></div>' +
      '<div style="padding:14px;"><div id="seo-preview-og-title" style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.3;">' + _esc(shareTitle) + '</div><div id="seo-preview-og-desc" style="font-size:12px;color:#6F6860;line-height:1.5;margin-top:4px;">' + _esc(shareDesc) + '</div></div></div>';
  }

  function _statusChip(label, value, tone) {
    var isGreen = tone === 'green';
    var isBlue = tone === 'blue';
    var color = isGreen ? '#1F6F43' : (isBlue ? '#2F5F93' : '#8A3B2E');
    var bg = isGreen ? '#F0FAF4' : (isBlue ? '#F2F7FF' : '#FFF2EF');
    var border = isGreen ? '#BDE7CA' : (isBlue ? '#C9DAF2' : '#F2C7BE');
    return '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:14px;padding:12px 13px;min-height:72px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
      '<div style="' + _labelStyle() + 'margin-bottom:4px;">' + _esc(label) + '</div>' +
      '<div style="font-size:14px;font-weight:600;color:' + color + ';line-height:1.2;">' + _esc(value) + '</div>' +
    '</div>';
  }

  function _refreshSeoPreview() {
    var title = _val('seo-title') || 'Título SEO da loja';
    var desc = _val('seo-description') || 'Descrição SEO da loja com cidade, produto e diferencial.';
    var titleChip = document.querySelector('[data-seo-summary="title"]');
    var descChip = document.querySelector('[data-seo-summary="description"]');
    var imageChip = document.querySelector('[data-seo-summary="image"]');
    var shareCustom = _checked('seo-share-custom-enabled');
    var shareWrap = document.getElementById('seo-share-custom-fields');
    var storeUrl = _publicStoreUrl();
    var published = !!storeUrl;
    var url = published && storeUrl ? storeUrl : 'URL da loja será exibida após publicação';
    if (document.getElementById('seo-preview-url')) document.getElementById('seo-preview-url').textContent = url;
    if (document.getElementById('seo-preview-title')) document.getElementById('seo-preview-title').textContent = title;
    if (document.getElementById('seo-preview-desc')) document.getElementById('seo-preview-desc').textContent = desc;
    if (shareWrap) shareWrap.style.display = shareCustom ? 'block' : 'none';
    if (document.getElementById('seo-preview-og-title')) document.getElementById('seo-preview-og-title').textContent = shareCustom ? (_val('seo-share-title') || title) : title;
    if (document.getElementById('seo-preview-og-desc')) document.getElementById('seo-preview-og-desc').textContent = shareCustom ? (_val('seo-share-desc') || desc) : desc;
    var imgUrl = _cleanPublicUrl(_val('seo-og-image'));
    var shareImg = document.getElementById('seo-preview-share-img');
    var sharePh = document.getElementById('seo-preview-share-placeholder');
    if (shareImg) { shareImg.src = imgUrl || ''; shareImg.style.display = imgUrl ? 'block' : 'none'; }
    if (sharePh) sharePh.style.display = imgUrl ? 'none' : 'inline';
    if (titleChip) titleChip.textContent = _val('seo-title') ? 'Título configurado' : 'Título pendente';
    if (descChip) descChip.textContent = _val('seo-description') ? 'Descrição configurada' : 'Descrição pendente';
    if (imageChip) imageChip.textContent = imgUrl ? 'Imagem configurada' : 'Sem imagem';
  }

  function _saveSeoLoja() {
    if (!_validatePublicUrls([{ id: 'seo-og-image', label: 'Imagem de compartilhamento' }])) return;
    var images = _imageUploadState();
    var currentSeo = _storeConfig.seo || {};
    var shareCustom = _checked('seo-share-custom-enabled');
    var shareTitle = shareCustom ? _val('seo-share-title') : (currentSeo.shareTitle || currentSeo.ogTitle || _val('seo-title'));
    var shareDesc = shareCustom ? _val('seo-share-desc') : (currentSeo.shareDescription || currentSeo.ogDescription || _val('seo-description'));
    var seo = {
      title: _val('seo-title'),
      description: _val('seo-description'),
      mainKeyword: _val('seo-keyword'),
      city: _val('seo-city'),
      neighborhoods: _val('seo-delivery-area'),
      deliveryArea: _val('seo-delivery-area'),
      ogTitle: shareTitle,
      ogDescription: shareDesc,
      shareCustomEnabled: shareCustom,
      shareTitle: shareTitle,
      shareDescription: shareDesc,
      ogImage: _cleanPublicUrl(_val('seo-og-image')),
      imageUrl: _cleanPublicUrl(_val('seo-og-image')),
      ogImageStoragePath: images.share && images.share.imageStoragePath || '',
      ogImagePath: images.share && (images.share.imagePath || images.share.imageStoragePath) || '',
      updatedAt: new Date().toISOString()
    };
    DB.setDocRoot('config', 'seo', seo).then(function () {
      _storeConfig.seo = seo;
      UI.toast('SEO da loja salvo.', 'success');
      _refreshSeoPreview();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _renderCatalogoConfiguracoes() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    _ensureCatalogConfigStyles();
    var subs = [{ key: 'categorias', label: 'Categorias' }, { key: 'variantes', label: 'Variantes' }, { key: 'tags', label: 'Tags' }];
    var btn = function (s) {
      var active = _cfgSub === s.key;
      return '<button class="catalog-config-tab' + (active ? ' active' : '') + '" onclick="Modules.Catalogo._setCatalogCfgSub(\'' + s.key + '\')">' + s.label + '</button>';
    };
    content.innerHTML = '<div class="catalog-config-page">' +
      '<div class="catalog-config-head">' +
        '<div><h2 class="catalog-config-title">Configurações do cardápio</h2><p class="catalog-config-subtitle">Organize categorias, variações e selos usados para montar os produtos da sua loja.</p></div>' +
      '</div>' +
      '<div class="catalog-config-tabs">' + subs.map(btn).join('') + '</div>' +
      '<div id="catalogo-config-inner"><div class="catalog-config-loading">Carregando...</div></div>' +
      '</div>';
    if (_cfgSub === 'categorias') _renderCategorias();
    else if (_cfgSub === 'variantes') _renderVariantes();
    else if (_cfgSub === 'tags') _renderTagsTab();
  }

  function _catalogConfigSectionHead(title, desc, actionHtml) {
    return '<div class="catalog-config-section-head">' +
      '<div><h3>' + _esc(title || '') + '</h3>' + (desc ? '<p>' + _esc(desc) + '</p>' : '') + '</div>' +
      (actionHtml || '') +
      '</div>';
  }

  function _catalogConfigPrimaryButton(label, onclick) {
    return '<button class="catalog-config-primary" onclick="' + onclick + '">' + _esc(label) + '</button>';
  }

  function _ensureCatalogConfigStyles() {
    if (document.getElementById('catalog-config-style')) return;
    var style = document.createElement('style');
    style.id = 'catalog-config-style';
    style.textContent = '' +
      '.catalog-config-page{display:flex;flex-direction:column;gap:16px;}' +
      '.catalog-config-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.catalog-config-title{font-size:22px;font-weight:700;line-height:1.16;margin:0 0 6px;color:#211815;letter-spacing:-.01em;}' +
      '.catalog-config-subtitle{font-size:13px;color:#756A64;line-height:1.45;margin:0;max-width:720px;}' +
      '.catalog-config-tabs{display:flex;gap:8px;align-items:center;overflow:auto;padding:8px;background:linear-gradient(135deg,#FFFDFC 0%,#FFF8F3 100%);border:1px solid #E8DDD5;border-radius:16px;box-shadow:0 10px 24px rgba(85,46,32,.045),inset 0 1px 0 rgba(255,255,255,.72);}' +
      '.catalog-config-tab{height:32px;padding:0 12px;border:1px solid transparent;border-radius:999px;background:rgba(255,255,255,.72);color:#6F6860;font-family:Manrope,Inter,sans-serif;font-size:12px;font-weight:650;white-space:nowrap;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s,border-color .15s,transform .15s;}' +
      '.catalog-config-tab:hover{background:#fff;color:#211815;border-color:#E8DDD5;box-shadow:0 5px 14px rgba(85,46,32,.06);}' +
      '.catalog-config-tab.active{background:#B42318;color:#fff;border-color:#B42318;box-shadow:0 8px 18px rgba(180,35,24,.16);}' +
      '.catalog-config-panel{background:linear-gradient(145deg,#FFFFFF 0%,#FFFDFB 68%,#FFF8F3 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px 18px;box-shadow:0 10px 24px rgba(85,46,32,.045),inset 0 1px 0 rgba(255,255,255,.76);}' +
      '.catalog-config-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(232,221,213,.82);}' +
      '.catalog-config-section-head h3{font-size:15px;font-weight:700;color:#211815;line-height:1.2;margin:0 0 4px;}' +
      '.catalog-config-section-head p{font-size:12px;color:#82766F;line-height:1.42;margin:0;max-width:760px;}' +
      '.catalog-config-primary{height:38px;padding:0 14px;border:none;border-radius:11px;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;box-shadow:0 8px 18px rgba(180,35,24,.16);font-family:Manrope,Inter,sans-serif;white-space:nowrap;transition:transform .15s,box-shadow .15s,background .15s;}' +
      '.catalog-config-primary:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(180,35,24,.20);background:#A61F16;}' +
      '.catalog-config-list{display:flex;flex-direction:column;gap:9px;}' +
      '.catalog-config-item{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:12px 13px;box-shadow:0 1px 2px rgba(31,31,31,.03);display:flex;align-items:center;gap:12px;transition:background .15s,border-color .15s,box-shadow .15s;}' +
      '.catalog-config-item:hover{background:#fff;border-color:#E1D3CB;box-shadow:0 8px 18px rgba(85,46,32,.045);}' +
      '.catalog-config-item[draggable="true"]{cursor:grab;}' +
      '.catalog-config-drag{color:#A39B90;font-size:18px;flex-shrink:0;}' +
      '.catalog-config-media{width:42px;height:42px;border-radius:13px;background:#fff;border:1px solid #E8DCD7;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:0 0 auto;font-size:18px;color:#6F6860;}' +
      '.catalog-config-media img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.catalog-config-copy{min-width:0;flex:1;}' +
      '.catalog-config-copy strong{display:block;font-size:14px;font-weight:650;color:#211815;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.catalog-config-copy small{display:block;font-size:12px;color:#756A64;line-height:1.35;margin-top:3px;}' +
      '.catalog-config-actions{display:flex;gap:6px;flex-shrink:0;}' +
      '.catalog-config-icon-btn{width:30px;height:30px;border-radius:9px;border:1px solid #E8DCD7;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.catalog-config-icon-btn.danger{color:#B42318;}' +
      '.catalog-config-icon-btn .mi{font-size:14px;}' +
      '.catalog-config-empty{text-align:center;padding:42px 20px;color:#8A7E7C;font-size:14px;line-height:1.45;font-weight:500;}' +
      '.catalog-config-loading{text-align:center;padding:28px;color:#8A7E7C;font-size:13px;}' +
      '.catalog-config-modal-card{background:linear-gradient(145deg,#FFFFFF 0%,#FFFDFB 72%,#FFF8F3 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(85,46,32,.045),inset 0 1px 0 rgba(255,255,255,.76);}' +
      '.catalog-config-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start;}' +
      '.catalog-config-grid.compact{grid-template-columns:minmax(0,1fr) 116px 116px;align-items:end;}' +
      '.catalog-config-field-full{grid-column:1/-1;}' +
      '.catalog-config-help{font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:5px;}' +
      '.catalog-config-softbox{padding:12px;border:1px solid #E8DCD7;border-radius:14px;background:#FFFCF8;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);}' +
      '.catalog-config-checkline{display:flex;align-items:center;gap:8px;min-height:40px;}' +
      '.catalog-config-checkline input{width:16px;height:16px;accent-color:#B42318;}' +
      '.catalog-config-checkline label{font-size:13px;font-weight:500;color:#211815;cursor:pointer;}' +
      '.catalog-config-option-row{display:grid;grid-template-columns:22px minmax(0,1fr) 110px minmax(0,210px) 34px 32px;gap:10px;align-items:start;padding:12px;border:1px solid #E8DCD7;border-radius:14px;background:#FFFCF8;margin-bottom:9px;max-width:100%;box-sizing:border-box;overflow:hidden;}' +
      '.catalog-config-option-row>*{min-width:0;}' +
      '.catalog-config-option-row .option-remove-btn{align-self:end;flex:0 0 auto;}' +
      '.catalog-config-image-tools{display:grid;grid-template-columns:42px minmax(0,1fr);gap:9px;align-items:center;min-width:0;}' +
      '.catalog-config-image-preview{width:42px;height:42px;border-radius:11px;border:1px solid #E8DCD7;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#C9BCB8;flex:0 0 auto;}' +
      '.catalog-config-image-preview img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.catalog-config-image-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center;}' +
      '.catalog-config-image-btn{height:32px;padding:0 10px;border-radius:10px;font-size:11px;font-weight:650;font-family:Manrope,Inter,sans-serif;cursor:pointer;white-space:nowrap;}' +
      '.catalog-config-image-btn.primary{border:none;background:#F3E8D7;color:#8A6F5A;}' +
      '.catalog-config-image-btn.ghost{border:1px solid #E6DDD3;background:#fff;color:#7A746B;}' +
      '.catalog-config-select-wrap{position:relative;display:block;}' +
      '.catalog-config-select-wrap select{appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:42px !important;background:#fff !important;}' +
      '.catalog-config-select-arrow{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:19px;color:#6F6860;line-height:1;pointer-events:none;}' +
      '.catalog-config-chip{display:inline-flex;align-items:center;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:500;line-height:1;white-space:nowrap;}' +
      '.catalog-config-tag-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 13px;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '@media(max-width:980px){.catalog-config-option-row{grid-template-columns:22px minmax(0,1fr) 110px 34px 32px;}.catalog-config-option-row>div:nth-child(4){grid-column:1/-1}.catalog-config-option-row .option-remove-btn{grid-column:5;grid-row:1;justify-self:end}}' +
      '@media(max-width:760px){.catalog-config-section-head{flex-direction:column}.catalog-config-primary{width:100%}.catalog-config-grid,.catalog-config-grid.compact,.catalog-config-option-row{grid-template-columns:1fr}.catalog-config-item,.catalog-config-tag-row{align-items:flex-start}.catalog-config-actions{align-self:flex-start}.catalog-config-option-row .option-remove-btn{grid-column:auto;grid-row:auto;justify-self:start}}';
    document.head.appendChild(style);
  }

  function _setCatalogCfgSub(key) {
    _cfgSub = key || 'categorias';
    _renderCatalogoConfiguracoes();
  }

  // ── CATEGORIAS ─────────────────────────────────────────────────────────────
  function _renderCategorias() {
    DB.getAll('categories').then(function (cats) {
      _categories = (cats || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      _paintCategorias();
    });
  }

  function _paintCategorias() {
    var content = _catalogTarget();
    if (!content) return;
    content.innerHTML =
      '<section class="catalog-config-panel">' +
        _catalogConfigSectionHead('Categorias', 'Organize os grupos que aparecem no cardápio e defina a ordem da loja pública.', _catalogConfigPrimaryButton('+ Adicionar categoria', 'Modules.Catalogo._openCatModal(null)')) +
        (_categories.length === 0 ? '<div class="catalog-config-empty">Nenhuma categoria ainda</div>' :
          '<div id="cat-list" class="catalog-config-list">' +
          _categories.map(function (c) {
            return '<div draggable="true" data-id="' + c.id + '" class="catalog-config-item">' +
              '<span class="mi catalog-config-drag">drag_indicator</span>' +
              '<div class="catalog-config-copy">' +
                '<strong>' + _esc(c.name) + '</strong>' +
                '<small>Categoria visível no cardápio da loja.</small>' +
              '</div>' +
              '<div class="catalog-config-actions">' +
                '<button class="catalog-config-icon-btn" onclick="Modules.Catalogo._openCatModal(\'' + c.id + '\')"><span class="mi">edit</span></button>' +
                '<button class="catalog-config-icon-btn danger" onclick="Modules.Catalogo._deleteCat(\'' + c.id + '\')"><span class="mi">delete</span></button>' +
              '</div>' +
            '</div>';
          }).join('') + '</div>') +
      '</section>';

    if (_categories.length > 0) {
      var listEl = document.getElementById('cat-list');
      if (listEl) {
        makeSortable(listEl, function (orders) {
          _categories = _categories.map(function (cat) {
            var found = orders.find(function (o) { return String(o.id) === String(cat.id); });
            return found ? Object.assign({}, cat, { order: found.order }) : cat;
          }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
          Promise.all(orders.map(function (o) { return DB.update('categories', o.id, { order: o.order }); }))
            .catch(function (err) { UI.toast('Erro ao salvar ordem: ' + err.message, 'error'); });
        });
      }
    }
  }

  function _openCatModal(id) {
    _editingId = id;
    var c = id ? (_categories.find(function (x) { return x.id === id; }) || {}) : {};
    window._catDraftId = id || _newEntityId('cat');
    var body = '<div class="catalog-config-modal-card">' +
      '<div class="catalog-config-grid">' +
        '<label class="catalog-config-field-full" style="display:block;"><span style="' + _labelStyle() + '">Nome da categoria *</span><input id="cat-name" type="text" value="' + _esc(c.name || '') + '" style="' + _inputStyle() + '"></label>' +
      '</div>' +
      '</div>';

    var footer = '<button onclick="Modules.Catalogo._saveCat()" style="height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:650;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">' + (id ? 'Salvar categoria' : 'Adicionar categoria') + '</button>';
    window._catModal = UI.modal({ title: id ? 'Editar categoria' : 'Nova categoria', body: body, footer: footer });
  }

  function _selectCatColor() {}

  function _uploadCategoryGraphic(event) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file || !window.ImageTools) return;
    window._catalogCategoryGraphicPending = true;
    ImageTools.process(file, { kind: 'category', folder: 'categories', entityId: _editingId || window._catDraftId || _newEntityId('cat') }).then(function (result) {
      var url = _cleanPublicUrl(result.imageUrl || '');
      var input = document.getElementById('cat-graphic-url');
      var preview = document.getElementById('cat-graphic-preview');
      if (input) input.value = url;
      if (preview) preview.innerHTML = url ? '<img src="' + _esc(url) + '" style="width:100%;height:100%;object-fit:cover;">' : 'Sem imagem';
      window._catalogCategoryGraphicState = result || {};
      window._catalogCategoryGraphicPending = false;
      UI.toast('Elemento gráfico otimizado.', 'success');
    }).catch(function (err) {
      window._catalogCategoryGraphicPending = false;
      UI.toast(err && err.message ? err.message : 'Erro ao otimizar imagem.', 'error');
      if (event && event.target) event.target.value = '';
    });
  }

  function _clearCategoryGraphic() {
    var input = document.getElementById('cat-graphic-url');
    var preview = document.getElementById('cat-graphic-preview');
    if (input) input.value = '';
    if (preview) preview.textContent = 'Sem imagem';
    window._catalogCategoryGraphicState = {};
  }

  function _templateCategoryUploadState() {
    window._catalogTemplateCategoryGraphicState = window._catalogTemplateCategoryGraphicState || {};
    return window._catalogTemplateCategoryGraphicState;
  }

  function _templateCategoryOrderHtml() {
    var cats = (_categories || []).filter(function (cat) {
      return cat && cat.active !== false && cat.visible !== false;
    }).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0) || String(a.name || a.label || '').localeCompare(String(b.name || b.label || ''));
    });
    if (!cats.length) {
      return '<div style="padding:22px;border:1px dashed #E6DAD4;border-radius:16px;background:#FFFCF8;color:#7A6F69;font-size:13px;line-height:1.45;text-align:center;">Crie categorias no cardápio para organizar a ordem que aparece na loja pública.</div>';
    }
    return '<div id="tpl-category-order-list" style="display:grid;gap:9px;">' + cats.map(function (cat) {
      var name = cat.name || cat.label || cat.nome || 'Categoria';
      var count = (_products || []).filter(function (p) {
        return String(p.categoryId || p.category || '') === String(cat.id || cat.slug || cat.name || '');
      }).length;
      return '<div draggable="true" data-id="' + _esc(cat.id) + '" data-template-category-order="1" style="display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;background:#FFFCF8;border:1px solid #EADFD8;border-radius:14px;padding:10px 12px;box-shadow:0 1px 2px rgba(31,31,31,.03);cursor:grab;">' +
        '<span class="mi" style="font-size:18px;color:#A39B90;">drag_indicator</span>' +
        '<div style="min-width:0;">' +
          '<div style="font-size:13px;font-weight:760;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(name) + '</div>' +
          '<div style="font-size:11px;color:#8A7E7C;line-height:1.3;margin-top:2px;">' + (count === 1 ? '1 produto nessa categoria' : count + ' produtos nessa categoria') + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:5px;">' +
          '<button type="button" title="Subir categoria" onclick="event.stopPropagation();Modules.Catalogo._moveTemplateCategory(\'' + _esc(cat.id) + '\', -1)" style="width:28px;height:28px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;"><span class="mi" style="font-size:16px;">keyboard_arrow_up</span></button>' +
          '<button type="button" title="Descer categoria" onclick="event.stopPropagation();Modules.Catalogo._moveTemplateCategory(\'' + _esc(cat.id) + '\', 1)" style="width:28px;height:28px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;"><span class="mi" style="font-size:16px;">keyboard_arrow_down</span></button>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _saveTemplateCategoryOrder(orders) {
    _categories = (_categories || []).map(function (cat) {
      var found = orders.find(function (o) { return String(o.id) === String(cat.id); });
      return found ? Object.assign({}, cat, { order: found.order }) : cat;
    }).sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.name || a.label || '').localeCompare(String(b.name || b.label || '')); });
    return Promise.all(orders.map(function (o) { return DB.update('categories', o.id, { order: o.order }); }))
      .then(function () { UI.toast('Ordem das categorias salva.', 'success'); })
      .catch(function (err) { UI.toast('Erro ao salvar ordem: ' + err.message, 'error'); });
  }

  function _bindTemplateCategoryOrder() {
    var listEl = document.getElementById('tpl-category-order-list');
    if (!listEl) return;
    makeSortable(listEl, function (orders) {
      _saveTemplateCategoryOrder(orders);
    });
  }

  function _moveTemplateCategory(id, direction) {
    var cats = (_categories || []).filter(function (cat) {
      return cat && cat.active !== false && cat.visible !== false;
    }).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0) || String(a.name || a.label || '').localeCompare(String(b.name || b.label || ''));
    });
    var index = cats.findIndex(function (cat) { return String(cat.id) === String(id); });
    var next = index + (Number(direction) || 0);
    if (index < 0 || next < 0 || next >= cats.length) return;
    var moved = cats.splice(index, 1)[0];
    cats.splice(next, 0, moved);
    _saveTemplateCategoryOrder(cats.map(function (cat, idx) { return { id: cat.id, order: idx }; }))
      .then(function () {
        _templateActiveTab = 'vitrine';
        _renderTemplateLoja();
      });
  }

  function _uploadTemplateCategoryGraphic(event, catId) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file || !window.ImageTools || !catId) return;
    _templateCategoryUploadState()[catId] = Object.assign({}, _templateCategoryUploadState()[catId] || {}, { pending: true });
    ImageTools.process(file, { kind: 'category', folder: 'categories', entityId: catId }).then(function (result) {
      var url = _cleanPublicUrl(result.imageUrl || '');
      var input = document.getElementById('tpl-cat-graphic-' + catId);
      var preview = document.getElementById('tpl-cat-graphic-preview-' + catId);
      if (input) input.value = url;
      if (preview) preview.innerHTML = url ? '<img src="' + _esc(url) + '" style="width:100%;height:100%;object-fit:cover;">' : 'Aa';
      _templateCategoryUploadState()[catId] = result || {};
      UI.toast('Elemento gráfico da categoria otimizado.', 'success');
    }).catch(function (err) {
      _templateCategoryUploadState()[catId] = Object.assign({}, _templateCategoryUploadState()[catId] || {}, { pending: false });
      UI.toast(err && err.message ? err.message : 'Erro ao otimizar imagem.', 'error');
      if (event && event.target) event.target.value = '';
    });
  }

  function _collectTemplateCategoryVisualUpdates() {
    var rows = [].slice.call(document.querySelectorAll('[data-template-category-visual]'));
    var uploads = _templateCategoryUploadState();
    var updates = [];
    rows.forEach(function (row) {
      var id = row.getAttribute('data-template-category-visual') || '';
      if (!id) return;
      var icon = (document.getElementById('tpl-cat-icon-' + id) || {}).value || '';
      var graphicUrl = _cleanPublicUrl((document.getElementById('tpl-cat-graphic-' + id) || {}).value || '');
      var upload = uploads[id] || {};
      var data = { icon: icon, emoji: icon, symbol: icon, graphicUrl: graphicUrl, imageUrl: graphicUrl, iconUrl: graphicUrl, categoryGraphicUrl: graphicUrl };
      if (upload.imageStoragePath) data.graphicStoragePath = upload.imageStoragePath;
      if (upload.imagePath || upload.imageStoragePath) data.imagePath = upload.imagePath || upload.imageStoragePath;
      if (upload.imageWidth) data.graphicWidth = upload.imageWidth;
      if (upload.imageHeight) data.graphicHeight = upload.imageHeight;
      if (upload.imageFormat) data.graphicFormat = upload.imageFormat;
      updates.push({ id: id, data: data });
    });
    return updates;
  }

  function _saveCat() {
    var name = (document.getElementById('cat-name') || {}).value || '';
    if (!name) { UI.toast('Nome e obrigatorio', 'error'); return; }
    var data = { name: name };
    var catId = _editingId || window._catDraftId || _newEntityId('cat');
    data.id = catId;
    var op = _editingId ? DB.update('categories', _editingId, data) : DB.set('categories', catId, data);
    op.then(function () {
      UI.toast('Categoria salva!', 'success');
      if (window._catModal) window._catModal.close();
      _renderCategorias();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteCat(id) {
    UI.confirm('Eliminar esta categoria?').then(function (yes) {
      if (!yes) return;
      DB.remove('categories', id).then(function () { UI.toast('Eliminado', 'info'); _renderCategorias(); });
    });
  }

  // ── PRODUTOS PRONTOS (Change A) ────────────────────────────────────────────
  function _renderProdutosProntos() {
    DB.getAll('produtos_prontos').then(function (items) {
      _produtosProntos = items || [];
      _paintProdutosProntos();
    });
  }

  function _paintProdutosProntos() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    content.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
      '<div><h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">Produtos Prontos (' + _produtosProntos.length + ')</h2>' +
      '<p style="font-size:12px;color:#8A7E7C;">Produtos acabados que nao precisam de receita (ex: refrigerante, sopa).</p></div>' +
      '<button onclick="Modules.Catalogo._openProntosModal(null)" style="background:#B42318;color:#fff;border:none;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">+ Adicionar</button>' +
      '</div>' +
      (_produtosProntos.length === 0 ? UI.emptyState('Nenhum produto pronto ainda', '') :
        '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">' +
        '<thead><tr style="background:#F2EDED;">' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Nome</th>' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Unidade</th>' +
        '<th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Preco compra</th>' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Fornecedor</th>' +
        '<th style="padding:12px 4px;text-align:right;"></th>' +
        '</tr></thead><tbody>' +
        _produtosProntos.map(function (pp) {
          return '<tr style="border-top:1px solid #F2EDED;">' +
            '<td style="padding:12px 16px;font-size:13px;font-weight:700;">' + _esc(pp.name) + '</td>' +
            '<td style="padding:12px 16px;font-size:13px;color:#8A7E7C;">' + _esc(pp.unit || '—') + '</td>' +
            '<td style="padding:12px 16px;font-size:13px;text-align:right;">' + UI.fmt(pp.purchasePrice || 0) + '</td>' +
            '<td style="padding:12px 16px;font-size:13px;color:#8A7E7C;">' + _esc(pp.supplier || '—') + '</td>' +
            '<td style="padding:12px 8px;text-align:right;">' +
            '<button onclick="Modules.Catalogo._openProntosModal(\'' + pp.id + '\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#EEF4FF;color:#3B82F6;cursor:pointer;margin-right:4px;"><span class="mi" style="font-size:14px;">edit</span></button>' +
            '<button onclick="Modules.Catalogo._deletePronto(\'' + pp.id + '\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#FFF0EE;color:#B42318;cursor:pointer;"><span class="mi" style="font-size:14px;">delete</span></button>' +
            '</td></tr>';
        }).join('') + '</tbody></table></div>');
  }

  function _openProntosModal(id) {
    _editingId = id;
    var pp = id ? (_produtosProntos.find(function (x) { return x.id === id; }) || {}) : {};
    window._ppDraftId = id || _newEntityId('pronto');
    window._ppImageState = null;
    Promise.all([DB.getAll('fornecedores'), DB.getAll('unidades_medida')]).then(function (r) {
      var fornecedores = r[0] || [];
      var unidades = r[1] || [];
      var supplierOpts = '<option value="">Sem fornecedor</option>' +
        fornecedores.map(function (f) {
          return '<option value="' + _esc(f.name) + '"' + (pp.supplier === f.name ? ' selected' : '') + '>' + _esc(f.name) + '</option>';
        }).join('');
      var unitOpts = '<option value="">Selecionar unidade</option>' +
        unidades.map(function (u) {
          var val = u.symbol || u.name;
          return '<option value="' + _esc(val) + '"' + (pp.unit === val ? ' selected' : '') + '>' + _esc(u.name) + ' (' + _esc(u.symbol) + ')</option>';
        }).join('');
      var imgPreview = _imageUrlFor(pp, 'card')
        ? '<img id="pp-img-preview" src="' + _imageUrlFor(pp, 'card') + '" style="max-width:100%;max-height:100px;border-radius:9px;margin-top:8px;display:block;">'
        : '<img id="pp-img-preview" style="max-width:100%;max-height:100px;border-radius:9px;margin-top:8px;display:none;">';
      var body = '<div>' +
        '<div style="margin-bottom:12px;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Nome *</label>' +
        '<input id="pp-name" type="text" value="' + _esc(pp.name || '') + '" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
        '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Unidade</label>' +
        '<select id="pp-unit" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' + unitOpts + '</select></div>' +
        '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Preco de Compra (EUR)</label>' +
        '<input id="pp-price" type="number" step="0.01" value="' + (pp.purchasePrice || '') + '" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
        '</div>' +
        '<div style="margin-bottom:12px;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Fornecedor</label>' +
        '<select id="pp-supplier" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' + supplierOpts + '</select></div>' +
        '<div style="margin-bottom:4px;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Imagem</label>' +
        '<input type="file" id="pp-img-file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Catalogo._onProntoImgChange(event)" style="width:100%;padding:8px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:13px;font-family:inherit;outline:none;">' +
        '<div style="margin-top:6px;font-size:11px;line-height:1.45;color:#8A7E7C;">' + _imageUploadTip('product') + '</div>' +
        imgPreview + '</div>' +
        '</div>';
      var footer = '<button onclick="Modules.Catalogo._savePronto()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">' + (id ? 'Atualizar' : 'Adicionar') + '</button>';
      window._prontosModal = UI.modal({ title: id ? 'Editar Produto Pronto' : 'Novo Produto Pronto', body: body, footer: footer });
    });
  }

  function _onProntoImgChange(event) {
    var file = event.target.files[0];
    if (!file) return;
    var draftId = window._ppDraftId || _editingId || _newEntityId('pronto');
    window._ppDraftId = draftId;
    ImageTools.process(file, { kind: 'product', folder: 'products', entityId: draftId }).then(function (result) {
      window._ppImageState = result;
      window._ppImageBase64 = null;
      var preview = document.getElementById('pp-img-preview');
      if (preview) { preview.src = result.imageUrl || ''; preview.style.display = 'block'; }
      UI.toast('Imagem otimizada com sucesso.', 'success');
    }).catch(function (err) {
      console.error('Imagem do produto pronto', err);
      UI.toast(err && err.message ? err.message : 'Erro ao otimizar imagem.', 'error');
      event.target.value = '';
    });
  }

  function _savePronto() {
    var name = (document.getElementById('pp-name') || {}).value || '';
    if (!name) { UI.toast('Nome e obrigatorio', 'error'); return; }
    var data = {
      name: name,
      unit: (document.getElementById('pp-unit') || {}).value || '',
      purchasePrice: parseFloat((document.getElementById('pp-price') || {}).value) || 0,
      supplier: (document.getElementById('pp-supplier') || {}).value || ''
    };
    var imgState = window._ppImageState || null;
    if (imgState) {
      data.imageUrl = imgState.imageUrl || '';
      data.imagePath = imgState.imagePath || imgState.imageStoragePath || '';
      data.imageCardUrl = imgState.imageCardUrl || imgState.cardUrl || imgState.imageUrl || '';
      data.imageThumbUrl = imgState.imageThumbUrl || imgState.thumbUrl || imgState.imageCardUrl || imgState.imageUrl || '';
      data.imageStoragePath = imgState.imageStoragePath || '';
      data.imageWidth = imgState.imageWidth || null;
      data.imageHeight = imgState.imageHeight || null;
      data.imageSizeKb = imgState.imageSizeKb || null;
      data.imageFormat = imgState.imageFormat || 'webp';
    }
    var prontoId = _editingId || window._ppDraftId || _newEntityId('pronto');
    data.id = prontoId;
    data.updatedAt = new Date().toISOString();
    if (!_editingId) {
      data.createdAt = new Date().toISOString();
      window._ppDraftId = prontoId;
    }
    var op = _editingId ? DB.update('produtos_prontos', _editingId, data) : DB.set('produtos_prontos', prontoId, data);
    op.then(function () {
      UI.toast('Produto pronto salvo!', 'success');
      if (window._prontosModal) window._prontosModal.close();
      _renderProdutosProntos();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deletePronto(id) {
    UI.confirm('Eliminar este produto pronto?').then(function (yes) {
      if (!yes) return;
      DB.remove('produtos_prontos', id).then(function () { UI.toast('Eliminado', 'info'); _renderProdutosProntos(); });
    });
  }

  // ── VARIANTES ─────────────────────────────────────────────────────────────
  function _renderVariantes(mode) {
    DB.getAll('variantGroups').then(function (vgs) {
      _variants = (vgs || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      _paintVariantes(mode);
    });
  }

  function _paintVariantes(mode) {
    var content = _catalogTarget();
    if (!content) return;
    var isExtras = mode === 'extras';
    var title = isExtras ? 'Extras' : 'Variantes';
    var addLabel = isExtras ? '+ Novo extra' : '+ Novo grupo';
    content.innerHTML =
      '<section class="catalog-config-panel">' +
        _catalogConfigSectionHead(title, 'Configure escolhas como tamanho, sabor, adicionais ou combinações que aparecem nos produtos.', _catalogConfigPrimaryButton(addLabel, 'Modules.Catalogo._openVariantModal(null)')) +
        (_variants.length === 0 ? '<div class="catalog-config-empty">Nenhum grupo de variantes ainda</div>' :
          '<div id="variants-list" class="catalog-config-list">' +
          _variants.map(function (vg) {
            return '<div draggable="true" data-id="' + vg.id + '" class="catalog-config-item" style="display:block;">' +
              '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:9px;">' +
              '<div style="display:flex;align-items:flex-start;gap:10px;min-width:0;flex:1;">' +
              '<span class="mi catalog-config-drag">drag_indicator</span>' +
              '<div class="catalog-config-copy">' +
                '<strong>' + _esc(vg.title) + '</strong>' +
              '<small>' + (vg.required ? 'Obrigatório' : 'Opcional') + ' · mínimo ' + (vg.minPerUnit != null ? vg.minPerUnit : vg.min || 0) + ' · máximo ' + (vg.maxPerUnit || vg.max || (vg.multiSelect ? 'vários' : 1)) + ' por item</small>' +
              '</div></div>' +
              '<div class="catalog-config-actions">' +
              '<button class="catalog-config-icon-btn" onclick="Modules.Catalogo._openVariantModal(\'' + vg.id + '\')"><span class="mi">edit</span></button>' +
              '<button class="catalog-config-icon-btn danger" onclick="Modules.Catalogo._deleteVariant(\'' + vg.id + '\')"><span class="mi">delete</span></button>' +
              '</div></div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              (vg.options || []).map(function (opt) {
                var price = parseFloat(opt.priceExtra != null ? opt.priceExtra : opt.price || 0) || 0;
                var priceText = price ? ' (' + (price > 0 ? '+' : '-') + UI.fmt(Math.abs(price)) + ')' : '';
                return '<span class="catalog-config-chip" style="background:#fff;border:1px solid #E8DCD7;color:#211815;">' + _esc(opt.label || opt.name || '') + priceText + '</span>';
              }).join('') +
              '</div></div>';
          }).join('') + '</div>') +
      '</section>';

    if (_variants.length > 0) {
      var listEl = document.getElementById('variants-list');
      if (listEl) {
        makeSortable(listEl, function (orders) {
          orders.forEach(function (o) { DB.update('variantGroups', o.id, { order: o.order }); });
        });
      }
    }
  }

  function _variantOptionRows(options) {
    options = options && options.length ? options : [{ label: '', price: 0, img: '' }];
    return options.map(function (option, index) {
      return _variantOptionRowHtml(option, index);
    }).join('');
  }

  function _variantOptionRowHtml(option, index) {
    option = option || {};
    var img = option.img || option.imageUrl || option.image || '';
    var price = option.priceExtra != null ? option.priceExtra : option.extraPrice != null ? option.extraPrice : option.price || '';
    var stockRef = option.stockRef || option.stockItemRef || option.stockItem || '';
    var stockQty = option.stockQuantity != null ? option.stockQuantity : option.stockQty != null ? option.stockQty : option.stockQuantityPerChoice != null ? option.stockQuantityPerChoice : '';
    var stockMeta = _compositionItemMeta(stockRef);
    var stockUnit = option.stockUnit || option.unit || stockMeta.unit || 'un';
    return '<div class="vg-option-row catalog-config-option-row" draggable="true" data-id="variant-option-' + index + '" data-option-index="' + index + '">' +
      '<span class="mi" title="Arrastar para ordenar" style="color:#D4C8C6;font-size:17px;cursor:grab;align-self:center;">drag_indicator</span>' +
      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Opção</span><input class="vg-option-label" type="text" value="' + _esc(option.label || option.name || '') + '" placeholder="Ex: Carne, queijo, grande..." style="' + _inputStyle() + '"></label>' +
      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Valor extra</span><input class="vg-option-price" type="text" inputmode="decimal" value="' + _esc(_moneyDisplay(price)) + '" placeholder="€0,00" onfocus="Modules.Catalogo._moneyInputFocus(this)" onblur="Modules.Catalogo._moneyInputBlur(this)" style="' + _inputStyle() + 'text-align:right;"></label>' +
      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Estoque</span><select class="vg-option-stock-ref" onchange="Modules.Catalogo._onVariantStockLinkChange(this)" style="' + _inputStyle() + '">' + _compositionAllOptionsHtml(stockRef) + '</select></label>' +
      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Qtd. estoque</span><input class="vg-option-stock-qty" type="text" inputmode="decimal" value="' + _esc(stockQty ? String(stockQty).replace('.', ',') : '') + '" placeholder="Ex: 1" style="' + _inputStyle() + 'text-align:right;"></label>' +
      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Unid.</span><input class="vg-option-stock-unit" type="text" value="' + _esc(stockRef ? stockUnit : '') + '" readonly style="' + _inputStyle() + 'background:#F7F2ED!important;color:#6F6860!important;"></label>' +
      '<div style="min-width:0;max-width:100%;"><span style="' + _labelStyle() + '">Imagem</span><div class="catalog-config-image-tools">' +
        '<input class="vg-option-img" type="hidden" value="' + _esc(img) + '">' +
        '<div class="vg-option-preview catalog-config-image-preview">' + (img ? '<img src="' + _esc(img) + '" alt="">' : '<span class="mi" style="font-size:20px;">image</span>') + '</div>' +
        '<div style="min-width:0;"><div class="catalog-config-image-actions">' +
          '<button type="button" class="catalog-config-image-btn primary" onclick="this.parentNode.querySelector(\'input[type=file]\').click()">Enviar imagem</button>' +
          '<button type="button" class="catalog-config-image-btn ghost" onclick="Modules.Catalogo._removeVariantOptionImage(this)">Remover imagem</button>' +
          '<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Catalogo._onVariantOptionImageChange(event)" style="display:none;">' +
        '</div><div class="catalog-config-help">JPG, PNG ou WebP. Opcional.</div></div>' +
      '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:4px;align-self:center;">' +
        '<button type="button" title="Subir" onclick="Modules.Catalogo._moveVariantOptionRow(this,-1)" style="width:30px;height:25px;border-radius:8px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:16px;">keyboard_arrow_up</span></button>' +
        '<button type="button" title="Descer" onclick="Modules.Catalogo._moveVariantOptionRow(this,1)" style="width:30px;height:25px;border-radius:8px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:16px;">keyboard_arrow_down</span></button>' +
      '</div>' +
      '<button type="button" class="option-remove-btn" onclick="Modules.Catalogo._removeVariantOptionRow(this)" style="width:32px;height:42px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#B42318;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:16px;">close</span></button>' +
      '</div>';
  }

  function _onVariantStockLinkChange(select) {
    var row = select && select.closest ? select.closest('.vg-option-row') : null;
    if (!row) return;
    var meta = _compositionItemMeta(select.value || '');
    var unit = row.querySelector('.vg-option-stock-unit');
    var qty = row.querySelector('.vg-option-stock-qty');
    if (unit) unit.value = select.value ? (meta.unit || 'un') : '';
    if (qty && select.value && !qty.value) qty.value = '1';
  }

  function _ensureVariantStockData() {
    if ((_fichas && _fichas.length) || (_stockCompositionItems && _stockCompositionItems.length) || (_baseCompositionItems && _baseCompositionItems.length)) return Promise.resolve();
    return Promise.all([
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('itens_custo').catch(function () { return []; }),
      DB.getAll('stock_settings').catch(function () { return []; })
    ]).then(function (r) {
      _fichas = r[0] || [];
      _produtosProntos = _normalizeProdutosCompras(r[1] || []);
      _stockCompositionItems = _normalizeStockCompositionItems(r[1] || []);
      _baseCompositionItems = _normalizeBaseCompositionItems(r[2] || []);
    });
  }

  function _addVariantOptionRow(option) {
    var host = document.getElementById('vg-options-list');
    if (!host) return;
    var index = host.querySelectorAll('.vg-option-row').length;
    host.insertAdjacentHTML('beforeend', _variantOptionRowHtml(option || {}, index));
    _initVariantOptionSortable();
  }

  function _moveVariantOptionRow(button, direction) {
    var row = button && button.closest ? button.closest('.vg-option-row') : null;
    var host = document.getElementById('vg-options-list');
    if (!row || !host) return;
    if (direction < 0 && row.previousElementSibling) host.insertBefore(row, row.previousElementSibling);
    else if (direction > 0 && row.nextElementSibling) host.insertBefore(row.nextElementSibling, row);
  }

  function _initVariantOptionSortable() {
    var host = document.getElementById('vg-options-list');
    if (host) makeSortable(host, function () {});
  }

  function _removeVariantOptionRow(button) {
    var row = button && button.closest ? button.closest('.vg-option-row') : null;
    var host = document.getElementById('vg-options-list');
    if (row) row.remove();
    if (host && !host.querySelector('.vg-option-row')) _addVariantOptionRow();
  }

  function _onVariantOptionImageChange(event) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    var row = event && event.target && event.target.closest ? event.target.closest('.vg-option-row') : null;
    if (!file || !row || !window.ImageTools) return;
    var draftId = _editingId || window._variantDraftId || _newEntityId('variant');
    window._variantDraftId = draftId;
    ImageTools.process(file, { kind: 'product', folder: 'variants', entityId: draftId + '-' + (row.dataset.optionIndex || 'option') }).then(function (result) {
      var url = result && (result.imageUrl || result.url || result.downloadURL) || '';
      if (!url) return;
      var input = row.querySelector('.vg-option-img');
      var preview = row.querySelector('.vg-option-preview');
      if (input) input.value = url;
      if (preview) {
        preview.innerHTML = '<img src="' + _esc(url) + '" alt="">';
      }
      UI.toast('Imagem da opção enviada.', 'success');
    }).catch(function (err) {
      UI.toast('Erro ao enviar foto: ' + err.message, 'error');
    });
  }

  function _removeVariantOptionImage(button) {
    var row = button && button.closest ? button.closest('.vg-option-row') : null;
    if (!row) return;
    var input = row.querySelector('.vg-option-img');
    var preview = row.querySelector('.vg-option-preview');
    var file = row.querySelector('input[type="file"]');
    if (input) input.value = '';
    if (file) file.value = '';
    if (preview) preview.innerHTML = '<span class="mi" style="font-size:20px;">image</span>';
  }

  function _openVariantModal(id) {
    _ensureVariantStockData().then(function () { _openVariantModalReady(id); });
  }

  function _openVariantModalReady(id) {
    _editingId = id;
    var vg = id ? (_variants.find(function (x) { return x.id === id; }) || {}) : {};
    window._variantDraftId = id || _newEntityId('variant');
    var minPerUnit = parseInt(vg.minPerUnit != null ? vg.minPerUnit : vg.min != null ? vg.min : (vg.required ? 1 : 0), 10);
    var maxPerUnit = parseInt(vg.maxPerUnit || vg.max || (vg.multiSelect ? Math.max(1, (vg.options || []).length) : 1), 10) || 1;
    if (minPerUnit < 0) minPerUnit = 0;
    if (maxPerUnit < 1) maxPerUnit = 1;
    if (minPerUnit > maxPerUnit) minPerUnit = maxPerUnit;

    var body = '<div class="catalog-config-modal-card">' +
      '<label style="display:block;margin-bottom:12px;"><span style="' + _labelStyle() + '">Nome do grupo *</span>' +
      '<input id="vg-title" type="text" value="' + _esc(vg.title || '') + '" placeholder="Ex: Tamanho, molhos..." style="' + _inputStyle() + '"></label>' +
      '<div class="catalog-config-grid compact" style="margin-bottom:12px;">' +
      '<div class="catalog-config-checkline">' +
      '<input type="checkbox" id="vg-required"' + (vg.required ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:#B42318;">' +
      '<label for="vg-required" style="font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;">Obrigatório</label></div>' +
      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Mínimo por item</span><input id="vg-min" type="number" min="0" step="1" value="' + minPerUnit + '" style="' + _inputStyle() + '"></label>' +
      '<label style="display:block;min-width:0;"><span style="' + _labelStyle() + '">Máximo por item</span><input id="vg-max" type="number" min="1" step="1" value="' + maxPerUnit + '" style="' + _inputStyle() + '"></label>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 8px;"><div><div style="font-size:13px;font-weight:650;color:#211815;">Opções</div><div class="catalog-config-help">Use valor positivo para acréscimo e negativo para desconto. A foto é opcional.</div></div><button type="button" onclick="Modules.Catalogo._addVariantOptionRow()" style="height:34px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#B42318;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;">+ Opção</button></div>' +
      '<div id="vg-options-list">' + _variantOptionRows(vg.options || []) + '</div>' +
      '</div>';

    var footer = '<button onclick="Modules.Catalogo._saveVariant()" style="height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:650;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">' + (id ? 'Salvar grupo' : 'Criar grupo') + '</button>';
    window._variantModal = UI.modal({ title: id ? 'Editar grupo' : 'Novo grupo de variantes', body: body, footer: footer, maxWidth: '1120px' });
    setTimeout(_initVariantOptionSortable, 60);
  }

  function _saveVariant() {
    var title = (document.getElementById('vg-title') || {}).value || '';
    if (!title) { UI.toast('Titulo e obrigatorio', 'error'); return; }
    var min = parseInt((document.getElementById('vg-min') || {}).value || 0, 10);
    var max = parseInt((document.getElementById('vg-max') || {}).value || 1, 10);
    if (min < 0) min = 0;
    if (max < 1) max = 1;
    if (min > max) min = max;
    var options = [].slice.call(document.querySelectorAll('.vg-option-row')).map(function (row) {
      var label = ((row.querySelector('.vg-option-label') || {}).value || '').trim();
      var price = _moneyLike((row.querySelector('.vg-option-price') || {}).value || '0');
      var img = ((row.querySelector('.vg-option-img') || {}).value || '').trim();
      var stockRef = ((row.querySelector('.vg-option-stock-ref') || {}).value || '').trim();
      var stockQty = _moneyLike((row.querySelector('.vg-option-stock-qty') || {}).value || 0);
      var meta = _compositionItemMeta(stockRef);
      var option = label ? { label: label, name: label, price: price, priceExtra: price, img: img } : null;
      if (option && stockRef && stockQty > 0) {
        option.stockRef = stockRef;
        option.stockItemRef = stockRef;
        option.stockItemId = meta.itemId || '';
        option.stockItemName = meta.label || '';
        option.stockItemType = meta.stockItemType || '';
        option.itemClass = meta.stockItemType || '';
        option.classe = meta.stockItemType || '';
        option.stockQuantity = stockQty;
        option.stockQuantityPerChoice = stockQty;
        option.stockUnit = meta.unit || 'un';
        option.stockUnitCost = meta.unitCost || 0;
      }
      return option;
    }).filter(Boolean);
    if (!options.length) { UI.toast('Adicione pelo menos uma opção.', 'error'); return; }
    var data = {
      title: title,
      required: !!(document.getElementById('vg-required') || {}).checked || min > 0,
      minPerUnit: min,
      maxPerUnit: max,
      min: min,
      max: max,
      multiSelect: max > 1,
      options: options
    };
    var op = _editingId ? DB.update('variantGroups', _editingId, data) : DB.add('variantGroups', data);
    op.then(function () {
      UI.toast('Grupo salvo!', 'success');
      if (window._variantModal) window._variantModal.close();
      _renderVariantes();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteVariant(id) {
    UI.confirm('Eliminar este grupo?').then(function (yes) {
      if (!yes) return;
      DB.remove('variantGroups', id).then(function () { UI.toast('Eliminado', 'info'); _renderVariantes(); });
    });
  }

  // ── ITENS DE CUSTO ────────────────────────────────────────────────────────
  var _itensCusto = [];
  var _itensCustoFilter = 'todos';

  var TIPO_CATEGORIAS = {
    'Ingrediente': ['Laticínios','Secos','Proteínas','Hortifruti','Temperos','Bebidas','Outros'],
    'Embalagem': ['Caixa','Saco','Etiqueta','Pote','Guardanapo','Sacola','Outros'],
    'Material operacional': ['Limpeza','Segurança','Produção','Descartável','Outros'],
    'Escritório / administrativo': ['Papelaria','Impressão','Sistema','Outros']
  };

  var UNIDADES_COMPRA_MAP = { 'L': {fator: 1000, base: 'ml'}, 'ml': {fator: 1, base: 'ml'}, 'Kg': {fator: 1000, base: 'g'}, 'g': {fator: 1, base: 'g'}, 'unidade': {fator: 1, base: 'unidade'} };

  function _renderItensCusto() {
    DB.getAll('itens_custo').then(function(items) {
      _itensCusto = (items || []).sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); });
      _paintItensCusto();
    });
  }

  function _paintItensCusto() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    var filtered = _itensCustoFilter === 'todos' ? _itensCusto : _itensCusto.filter(function(x){ return x.tipo === _itensCustoFilter; });
    var filterBtns = ['todos','Ingrediente','Embalagem','Material operacional','Escritório / administrativo'].map(function(f) {
      var label = f === 'todos' ? 'Todos' : f;
      var active = _itensCustoFilter === f;
      return '<button onclick="Modules.Catalogo._setItensCustoFilter(\''+f+'\')" style="padding:6px 14px;border-radius:20px;border:1.5px solid '+(active?'#B42318':'#D4C8C6')+';background:'+(active?'#B42318':'transparent')+';color:'+(active?'#fff':'#8A7E7C')+';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'+_esc(label)+'</button>';
    }).join('');
    content.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
      '<h2 style="font-size:20px;font-weight:800;">Itens de Custo ('+_itensCusto.length+')</h2>' +
      '<button onclick="Modules.Catalogo._openItemCustoModal(null)" style="background:#B42318;color:#fff;border:none;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">+ Adicionar Item</button>' +
      '</div>' +
      '<div style="margin-bottom:12px;"><input id="itens-custo-search" type="text" placeholder="Pesquisar item..." oninput="Modules.Catalogo._filterItensCusto()" style="width:100%;padding:10px 14px;border:1.5px solid #D4C8C6;border-radius:20px;font-size:13px;font-family:inherit;outline:none;"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">'+filterBtns+'</div>' +
      (filtered.length === 0 ? UI.emptyState('Nenhum item de custo', '') :
        '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">' +
        '<thead><tr style="background:#F2EDED;">' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Nome</th>' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Tipo</th>' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Categoria</th>' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Unidade</th>' +
        '<th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Custo atual</th>' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Fornecedor</th>' +
        '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Última compra</th>' +
        '<th style="padding:12px 4px;text-align:right;"></th>' +
        '</tr></thead><tbody id="itens-custo-tbody">' +
        filtered.map(function(item){ return _itemCustoRowHtml(item); }).join('') +
        '</tbody></table></div>');
  }

  function _itemCustoRowHtml(item) {
    var custo = item.custo_atual > 0 ? _fmtCusto(item.custo_atual, item.unidade_base) : '<span style="color:#D4C8C6;font-size:12px;">sem compra</span>';
    var ultima = item.ultima_compra_data ? UI.fmtDate(new Date(item.ultima_compra_data)) : '—';
    var ativoStyle = item.ativo === false ? 'opacity:0.5;' : '';
    return '<tr data-item-nome="'+_esc((item.nome||'').toLowerCase())+'" data-item-tipo="'+_esc(item.tipo||'')+'" style="border-top:1px solid #F2EDED;'+ativoStyle+'">' +
      '<td style="padding:12px 16px;font-size:13px;font-weight:700;">'+_esc(item.nome||'')+(item.ativo===false ? ' <span style="font-size:10px;color:#8A7E7C;">(inativo)</span>' : '')+'</td>' +
      '<td style="padding:12px 16px;font-size:12px;">'+UI.badge(item.tipo||'—','blue')+'</td>' +
      '<td style="padding:12px 16px;font-size:13px;color:#8A7E7C;">'+_esc(item.categoria||'—')+'</td>' +
      '<td style="padding:12px 16px;font-size:13px;color:#8A7E7C;">'+_esc(item.unidade_base||'—')+'</td>' +
      '<td style="padding:12px 16px;font-size:13px;text-align:right;font-weight:700;">'+custo+'</td>' +
      '<td style="padding:12px 16px;font-size:13px;color:#8A7E7C;">'+_esc(item._fornecedor_nome||'—')+'</td>' +
      '<td style="padding:12px 16px;font-size:13px;color:#8A7E7C;">'+ultima+'</td>' +
      '<td style="padding:12px 8px;text-align:right;">' +
      '<button onclick="Modules.Catalogo._openItemCustoModal(\''+item.id+'\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#EEF4FF;color:#3B82F6;cursor:pointer;margin-right:4px;"><span class="mi" style="font-size:14px;">edit</span></button>' +
      '<button onclick="Modules.Catalogo._deleteItemCusto(\''+item.id+'\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#FFF0EE;color:#B42318;cursor:pointer;"><span class="mi" style="font-size:14px;">delete</span></button>' +
      '</td></tr>';
  }

  function _fmtCusto(valor, unidade) {
    if (!valor) return '—';
    var decimais = valor < 0.01 ? 6 : valor < 0.1 ? 4 : 2;
    return '€'+valor.toFixed(decimais)+'/'+(_esc(unidade||'un'));
  }

  function _setItensCustoFilter(f) {
    _itensCustoFilter = f;
    _paintItensCusto();
  }

  function _filterItensCusto() {
    var search = ((document.getElementById('itens-custo-search')||{}).value||'').toLowerCase();
    var tbody = document.getElementById('itens-custo-tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-item-nome]').forEach(function(row){
      var nome = row.dataset.itemNome||'';
      var tipo = row.dataset.itemTipo||'';
      var matchSearch = nome.indexOf(search) >= 0;
      var matchFilter = _itensCustoFilter === 'todos' || tipo === _itensCustoFilter;
      row.style.display = (matchSearch && matchFilter) ? '' : 'none';
    });
  }

  function _openItemCustoModal(id) {
    _editingId = id;
    var item = id ? (_itensCusto.find(function(x){ return x.id === id; })||{}) : {};
    Promise.all([DB.getAll('fornecedores')]).then(function(r) {
      var fornecedores = r[0]||[];
      var tipoOptions = ['Ingrediente','Embalagem','Material operacional','Escritório / administrativo'].map(function(t){
        return '<option value="'+t+'"'+(item.tipo===t?' selected':'')+'>'+t+'</option>';
      }).join('');
      var catOptions = _buildCatOptions(item.tipo||'Ingrediente', item.categoria||'');
      var fornOptions = '<option value="">Sem fornecedor padrão</option>'+fornecedores.map(function(f){
        return '<option value="'+f.id+'"'+(item.fornecedor_padrao_id===f.id?' selected':'')+'>'+_esc(f.nome||f.name||'')+'</option>';
      }).join('');
      var histHtml = '';
      if (id && item.custo_atual) {
        histHtml = '<div style="margin-top:12px;padding:12px;background:#F2EDED;border-radius:10px;font-size:12px;">' +
          '<strong>Custo atual:</strong> '+_fmtCusto(item.custo_atual, item.unidade_base)+
          (item.ultima_compra_data ? ' &nbsp;|&nbsp; <strong>Última compra:</strong> '+UI.fmtDate(new Date(item.ultima_compra_data)) : '')+
          '<br><span style="color:#8A7E7C;font-size:11px;">O custo é atualizado automaticamente ao registrar uma compra.</span></div>';
      }
      var body = '<div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
        '<div class="full" style="grid-column:1/-1;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Nome *</label>' +
        '<input id="ic-nome" type="text" value="'+_esc(item.nome||'')+'" placeholder="ex: Leite integral" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
        '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Tipo *</label>' +
        '<select id="ic-tipo" onchange="Modules.Catalogo._onItemTipoChange()" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#fff;"><option value="">Selecionar...</option>'+tipoOptions+'</select></div>' +
        '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Categoria *</label>' +
        '<select id="ic-cat" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#fff;">'+catOptions+'</select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">' +
        '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Unidade base *</label>' +
        '<select id="ic-unidade" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' +
        ['g','ml','unidade'].map(function(u){ return '<option value="'+u+'"'+(item.unidade_base===u?' selected':'')+'>'+u+'</option>'; }).join('')+
        '</select></div>' +
        '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Aproveitamento (%)</label>' +
        '<input id="ic-aprov" type="number" min="1" max="100" value="'+(item.aproveitamento_padrao||100)+'" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
        '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Fornecedor padrão</label>' +
        '<select id="ic-fornecedor" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#fff;">'+fornOptions+'</select></div>' +
        '</div>' +
        '<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px;">' +
        '<input type="checkbox" id="ic-ativo"'+(item.ativo===false?'':' checked')+' style="width:16px;height:16px;accent-color:#B42318;">' +
        '<label for="ic-ativo" style="font-size:13px;font-weight:600;cursor:pointer;">Ativo</label></div>' +
        histHtml +
        '</div>';
      var footer = '<button onclick="Modules.Catalogo._saveItemCusto()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">'+(id?'Atualizar':'Adicionar')+'</button>';
      window._icModal = UI.modal({ title: id ? 'Editar Item de Custo' : 'Novo Item de Custo', body: body, footer: footer });
    });
  }

  function _buildCatOptions(tipo, selected) {
    var cats = TIPO_CATEGORIAS[tipo] || [];
    return '<option value="">Selecionar...</option>'+cats.map(function(c){
      return '<option value="'+c+'"'+(selected===c?' selected':'')+'>'+c+'</option>';
    }).join('');
  }

  function _onItemTipoChange() {
    var tipo = (document.getElementById('ic-tipo')||{}).value||'';
    var catSel = document.getElementById('ic-cat');
    if (catSel) catSel.innerHTML = _buildCatOptions(tipo, '');
  }

  function _saveItemCusto() {
    var nome = ((document.getElementById('ic-nome')||{}).value||'').trim();
    var tipo = (document.getElementById('ic-tipo')||{}).value||'';
    var cat  = (document.getElementById('ic-cat')||{}).value||'';
    var unidade = (document.getElementById('ic-unidade')||{}).value||'';
    if (!nome) { UI.toast('Nome obrigatório', 'error'); return; }
    if (!tipo) { UI.toast('Tipo obrigatório', 'error'); return; }
    if (!cat)  { UI.toast('Categoria obrigatória', 'error'); return; }
    if (!unidade) { UI.toast('Unidade base obrigatória', 'error'); return; }
    var aprov = parseFloat((document.getElementById('ic-aprov')||{}).value)||100;
    if (aprov < 1 || aprov > 100) { UI.toast('Aproveitamento deve ser entre 1 e 100', 'error'); return; }
    var data = {
      nome: nome, tipo: tipo, categoria: cat, unidade_base: unidade,
      aproveitamento_padrao: aprov,
      fornecedor_padrao_id: (document.getElementById('ic-fornecedor')||{}).value||'',
      ativo: (document.getElementById('ic-ativo')||{}).checked !== false,
      atualizado_em: new Date().toISOString()
    };
    if (!_editingId) data.criado_em = new Date().toISOString();
    var op = _editingId ? DB.update('itens_custo', _editingId, data) : DB.add('itens_custo', data);
    op.then(function(){
      UI.toast('Item salvo!', 'success');
      if (window._icModal) window._icModal.close();
      _renderItensCusto();
    }).catch(function(err){ UI.toast('Erro: '+err.message, 'error'); });
  }

  function _deleteItemCusto(id) {
    UI.confirm('Inativar este item? (ele continuará salvo)').then(function(yes){
      if (!yes) return;
      DB.update('itens_custo', id, { ativo: false, atualizado_em: new Date().toISOString() }).then(function(){
        UI.toast('Item inativado', 'info'); _renderItensCusto();
      });
    });
  }

  // ── FICHAS TÉCNICAS ───────────────────────────────────────────────────────
  function _renderFichas() {
    Promise.all([DB.getAll('fichasTecnicas'), DB.getAll('itens_custo'), DB.getDocRoot('config', 'geral'), DB.getAll('recipe_categories'), DB.getAll('recipe_components'), DB.getAll('financeiro_saidas'), DB.getAll('financeiro_apagar'), DB.getAll('unidades_medida')]).then(function (r) {
      _fichas = r[0] || [];
      _itensCusto = (r[1] || []).filter(function (item) {
        return item.ativo !== false && item.classe !== 'produto' && item.usar_em_fichas !== false;
      });
      _recipeConfig = r[2] || {};
      _recipeCategories = r[3] || [];
      _recipeComponents = r[4] || [];
      _financeSaidas = r[5] || [];
      _financeApagar = r[6] || [];
      _recipeUnits = r[7] || [];
      _paintFichas();
    });
  }

  function _paintFichas() {
    var content = document.getElementById('catalogo-content');
    if (!content) return;
    var totalCount = _fichas.length;
    var filtered = _filteredFichas();
    var filteredCount = filtered.length;
    var p = _fichaPag || (_fichaPag = { page: 1, perPage: 10 });
    var totalPages = Math.max(1, Math.ceil(filteredCount / p.perPage));
    var currentPage = Math.min(p.page, totalPages);
    if (p.page !== currentPage) p.page = currentPage;
    var start = filteredCount ? ((currentPage - 1) * p.perPage + 1) : 0;
    var end = filteredCount ? Math.min(currentPage * p.perPage, filteredCount) : 0;
    var pageOptions = [10, 25, 50].map(function (n) {
      return '<option value="' + n + '"' + (Number(p.perPage) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
    }).join('');
    var pageData = filtered.slice((currentPage - 1) * p.perPage, currentPage * p.perPage);
    var rows = pageData.map(function (f) {
      var ci = _calcFichaCosts(f);
      var yieldLabel = (f.yieldQuantity || f.yield || 1) + ' ' + (f.yieldUnit || 'porções');
      var costUnit = ci.costPerYield > 0 ? UI.fmt(ci.costPerYield) + '/' + (f.yieldUnit ? f.yieldUnit.replace(/s$/, '') : 'porção') : '—';
      var catChip = f.category ? '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;border:1px solid #EADFD8;background:#FFFCF8;color:#6F6860;font-size:12px;font-weight:500;line-height:1;">' + _esc(f.category) + '</span>' : '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;border:1px solid #EADFD8;background:#FAF8F4;color:#8A7E7C;font-size:12px;font-weight:500;line-height:1;">Sem categoria</span>';
      var img = f.imageThumbUrl || f.imageCardUrl || f.imageBase64 || f.imageUrl || '';
      var imgHtml = img
        ? '<img src="' + _esc(img) + '" style="width:48px;height:48px;border-radius:12px;object-fit:cover;background:#fff;border:1px solid #EADFD8;box-shadow:0 1px 2px rgba(31,31,31,.03);flex-shrink:0;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"><div style="width:48px;height:48px;border-radius:12px;background:#FFFCF8;border:1px solid #EADFD8;box-shadow:0 1px 2px rgba(31,31,31,.03);display:none;align-items:center;justify-content:center;color:#B9AAA6;flex-shrink:0;"><span class="mi" style="font-size:18px;">receipt_long</span></div>'
        : '<div style="width:48px;height:48px;border-radius:12px;background:#FFFCF8;border:1px solid #EADFD8;box-shadow:0 1px 2px rgba(31,31,31,.03);display:flex;align-items:center;justify-content:center;color:#B9AAA6;flex-shrink:0;"><span class="mi" style="font-size:18px;">receipt_long</span></div>';
      return '<tr data-ficha-name="' + _esc(((f.name || '') + ' ' + (f.category || '')).toLowerCase()) + '" onclick="Modules.Catalogo._openFichaViewModal(\'' + f.id + '\')" style="cursor:pointer;background:#fff;border-bottom:1px solid #EADFD8;transition:background .15s ease,box-shadow .15s ease;" onmouseover="this.style.background=\'#FFFCF8\'" onmouseout="this.style.background=\'#fff\'">' +
        '<td style="padding:14px 16px;vertical-align:middle;"><div style="display:flex;align-items:center;gap:12px;min-width:0;">' + imgHtml + '<div style="min-width:0;"><div style="font-size:15px;font-weight:600;line-height:1.25;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;">' + _esc(f.name || '') + '</div><div style="font-size:12px;line-height:1.4;color:#6F6860;margin-top:3px;">' + _esc(yieldLabel) + '</div></div></div></td>' +
        '<td style="padding:14px 16px;vertical-align:middle;">' + catChip + '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;font-size:14px;font-weight:600;color:#1F1F1F;">' + _esc(yieldLabel) + '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;font-size:14px;font-weight:600;color:#1F1F1F;">' + _fmtFichaMoney(ci.totalCost) + '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;font-size:14px;font-weight:600;color:#1F1F1F;">' + costUnit + '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;text-align:right;">' +
          '<div style="display:inline-flex;gap:6px;" onclick="event.stopPropagation();">' +
            '<button onclick="event.stopPropagation();Modules.Catalogo._openFichaModal(\'' + f.id + '\');" style="width:30px;height:30px;border-radius:9px;border:1px solid #EADFD8;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">edit</span></button>' +
            '<button onclick="event.stopPropagation();Modules.Catalogo._duplicateFicha(\'' + f.id + '\')" title="Duplicar" style="width:30px;height:30px;border-radius:9px;border:1px solid #EADFD8;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">content_copy</span></button>' +
            '<button onclick="event.stopPropagation();Modules.Catalogo._deleteFicha(\'' + f.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EADFD8;background:#fff;color:#B42318;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">delete</span></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
    var hasFilters = !!(_fichaFilters.q || '').trim();
    var clearFiltersHtml = hasFilters
      ? '<div class="recipes-filter-actions"><button onclick="Modules.Catalogo._clearFichasFilters()" style="height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>'
      : '';
    var recipesCss = '<style>' +
      '.recipes-page{display:flex;flex-direction:column;gap:16px;}' +
      '.recipes-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.recipes-page-title{font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;}' +
	      '.recipes-page-subtitle{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;}' +
	      '.recipes-primary-btn{height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;}' +
	      '.recipes-primary-btn:hover{background:#9F1F16;transform:translateY(-1px);box-shadow:0 8px 18px rgba(180,35,24,.22);}' +
	      '.recipes-secondary-btn{height:38px;padding:0 13px;border:1px solid #EADFD8;border-radius:10px;background:#fff;color:#5F5750;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;box-shadow:0 1px 2px rgba(31,31,31,.03);transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background .16s ease;}' +
	      '.recipes-secondary-btn:hover{background:#FFFCF8;border-color:#D9C8BA;transform:translateY(-1px);box-shadow:0 8px 18px rgba(31,31,31,.06);}' +
	      '.recipes-filter-card{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.055);}' +
      '.recipes-filter-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:11px 12px;align-items:end;}' +
      '.recipes-filter-control{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.recipes-filter-control:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.recipes-filter-control input{width:100%;height:40px;border:0;border-radius:8px;padding:0;font-size:14px;font-family:inherit;outline:none;background:transparent;box-sizing:border-box;color:#1F1F1F;box-shadow:none;}' +
      '.recipes-filter-actions{display:flex;justify-content:flex-start;margin-top:11px;}' +
      '.recipes-select{min-width:110px;max-width:110px;height:34px;padding:0 34px 0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background-color:#fff;color:#6F6860;box-sizing:border-box;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 14px center;background-size:14px;}' +
	      '@media(max-width:680px){.recipes-filter-grid{grid-template-columns:1fr}.recipes-primary-btn,.recipes-secondary-btn,.recipes-filter-actions button{width:100%;}}' +
      '</style>';
    var emptyHtml = totalCount === 0
      ? '<section style="background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:42px 20px;box-shadow:0 10px 24px rgba(31,31,31,.04);text-align:center;"><div style="width:42px;height:42px;border-radius:14px;background:#FFF3F1;color:#B42318;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span class="mi" style="font-size:20px;">receipt_long</span></div><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma receita ainda</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin:0 auto 16px;max-width:420px;">Crie a primeira ficha técnica para acompanhar rendimento, ingredientes e custo da produção.</div><button onclick="Modules.Catalogo._openFichaModal(null)" class="recipes-primary-btn">+ Nova receita</button></section>'
      : '<section style="background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:38px 20px;box-shadow:0 10px 24px rgba(31,31,31,.04);text-align:center;"><div style="width:40px;height:40px;border-radius:14px;background:#FAF8F4;color:#8A7E7C;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span class="mi" style="font-size:20px;">search_off</span></div><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma receita encontrada</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Ajuste a busca ou limpe os filtros para ver outras receitas.</div></section>';
    content.innerHTML =
      recipesCss +
      '<div class="bf-page recipes-page">' +
      '<div class="bf-page-header recipes-page-head">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 class="recipes-page-title">Receitas de produção</h2>' +
          '<p class="recipes-page-subtitle">Crie fichas técnicas para calcular rendimento, ingredientes e custo real de cada receita.</p>' +
        '</div>' +
	      '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end;">' +
	        '<button onclick="Router.navigate(\'receitas/insumos\')" class="recipes-secondary-btn"><span class="mi" style="font-size:16px;">inventory_2</span>Adicionar ingrediente</button>' +
	        '<button onclick="Modules.Catalogo._openFichaModal(null)" class="recipes-primary-btn">Adicionar receita</button>' +
	      '</div>' +
      '</div>' +
      '<div class="recipes-filter-card">' +
        '<div class="recipes-filter-grid">' +
          '<div><label style="' + _fichaLbl() + '">Buscar</label><div class="recipes-filter-control"><input id="fichas-search" type="search" placeholder="Buscar por nome ou categoria..." value="' + _esc(_fichaFilters.q || '') + '" oninput="Modules.Catalogo._filterFichas()" autocomplete="off"></div></div>' +
        '</div>' +
        clearFiltersHtml +
      '</div>' +
      (filteredCount === 0 ? emptyHtml :
        '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Lista de receitas</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Acompanhe rendimento, custo total e custo por unidade de cada ficha técnica.</div></div>' +
        '<div style="background:#fff;border:1px solid #EADFD8;border-radius:18px;box-shadow:0 12px 30px rgba(31,31,31,.055);overflow:hidden;">' +
        '<div style="overflow-x:auto;">' +
            '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:920px;">' +
              '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
                '<th style="padding:12px 16px;text-align:left;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;letter-spacing:.04em;text-transform:uppercase;">Receita</th>' +
                '<th style="padding:12px 16px;text-align:left;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;letter-spacing:.04em;text-transform:uppercase;">Categoria</th>' +
                '<th style="padding:12px 16px;text-align:left;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;letter-spacing:.04em;text-transform:uppercase;">Rendimento</th>' +
                '<th style="padding:12px 16px;text-align:left;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;letter-spacing:.04em;text-transform:uppercase;">Custo total</th>' +
                '<th style="padding:12px 16px;text-align:left;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;letter-spacing:.04em;text-transform:uppercase;">Custo/unidade</th>' +
                '<th style="padding:12px 16px;text-align:right;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;letter-spacing:.04em;text-transform:uppercase;">Ações</th>' +
              '</tr></thead>' +
              '<tbody id="fichas-list">' + rows + '</tbody>' +
            '</table>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
            '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + filteredCount + '</strong></span>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
              '<select onchange="Modules.Catalogo._setFichaPageSize(this.value)" class="recipes-select">' + pageOptions + '</select>' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                '<button type="button" onclick="Modules.Catalogo._setFichaPage(' + (currentPage - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (currentPage > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (currentPage > 1 ? '1' : '.45') + ';"' + (currentPage > 1 ? '' : ' disabled') + '>Anterior</button>' +
                '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + currentPage + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + totalPages + '</span></div>' +
                '<button type="button" onclick="Modules.Catalogo._setFichaPage(' + (currentPage + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (currentPage < totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (currentPage < totalPages ? '1' : '.45') + ';"' + (currentPage < totalPages ? '' : ' disabled') + '>Próxima</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div></section>') +
      '</div>';
  }

  function _calcFichaCosts(f) {
    var yieldQty = _parseFichaNum(f.yieldQuantity || f.yield) || 1;
    var costs = _calcFichaComponentCosts(_normalizeFichaComponents(f), yieldQty, f.yieldUnit || 'unidades', _normalizeFichaPackaging(f));
    var indirectInfo = _getIndirectCostInfo();
    var indirect = costs.direct * (indirectInfo.percent / 100);
    var totalCost = costs.direct + indirect;
    return {
      ingredientCost: _roundFichaCost(costs.ingredients, 4),
      packagingCost: _roundFichaCost(costs.packaging, 4),
      directCost: _roundFichaCost(costs.direct, 4),
      componentCostBreakdown: costs.components || [],
      indirectCostModeUsed: indirectInfo.modeUsed,
      indirectCostPercent: indirectInfo.percent,
      indirectCost: _roundFichaCost(indirect, 4),
      totalCost: _roundFichaCost(totalCost, 4),
      costPerYield: yieldQty > 0 ? _roundFichaCost(totalCost / yieldQty, 4) : 0
    };
  }

  function _filteredFichas() {
    var q = String((_fichaFilters && _fichaFilters.q) || '').trim().toLowerCase();
    if (!q) return _fichas.slice();
    return _fichas.filter(function (f) {
      var hay = [
        f.name,
        f.category,
        f.yieldUnit,
        f.internalNotes,
        f.productionNotes,
        f.preparationMode
      ].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function _filterFichas() {
    var activeId = document.activeElement ? document.activeElement.id : '';
    _fichaFilters.q = ((document.getElementById('fichas-search') || {}).value || '').trim();
    if (!_fichaPag) _fichaPag = { page: 1, perPage: 10 };
    _fichaPag.page = 1;
    _paintFichas();
    if (activeId === 'fichas-search') {
      var input = document.getElementById('fichas-search');
      if (input) {
        try {
          input.focus();
          var len = String(input.value || '').length;
          if (input.setSelectionRange) input.setSelectionRange(len, len);
        } catch (e) {}
      }
    }
  }

  function _setFichaPageSize(n) {
    var size = parseInt(n, 10) || 10;
    if (!_fichaPag) _fichaPag = { page: 1, perPage: 10 };
    _fichaPag.perPage = size;
    _fichaPag.page = 1;
    _paintFichas();
  }

  function _setFichaPage(page) {
    if (!_fichaPag) _fichaPag = { page: 1, perPage: 10 };
    _fichaPag.page = Math.max(1, page || 1);
    _paintFichas();
  }

  function _clearFichasFilters() {
    _fichaFilters.q = '';
    if (!_fichaPag) _fichaPag = { page: 1, perPage: 10 };
    _fichaPag.page = 1;
    _paintFichas();
  }

  function _parseFichaNum(val) {
    if (val == null || val === '') return 0;
    return parseFloat(String(val).replace(',', '.')) || 0;
  }
  function _roundFichaCost(value, decimals) {
    var n = _parseFichaNum(value);
    var places = decimals == null ? 4 : decimals;
    var factor = Math.pow(10, places);
    return Math.round((n + Number.EPSILON) * factor) / factor;
  }
  function _fmtFichaMoney(value) {
    return UI.fmt(_roundFichaCost(value, 2));
  }

  function _getIndirectCostPercent() {
    return _getIndirectCostInfo().percent;
  }

  function _getManualIndirectCostPercent() {
    var value = _recipeConfig.variableCostPercent != null ? _recipeConfig.variableCostPercent : _recipeConfig.percentualCustosVariaveis != null ? _recipeConfig.percentualCustosVariaveis : _recipeConfig.indirectCostPercent != null ? _recipeConfig.indirectCostPercent : _recipeConfig.percentualCustosIndiretos;
    return _parseFichaNum(value != null ? value : 0);
  }

  function _financeRecordDate(item) {
    return item ? (item.date || item.dueDate || item.paidAt || item.createdAt || '') : '';
  }

  function _financeCostClass(item) {
    if (item && item.costClass) return item.costClass;
    if (item && item.tipoSaida === 'Custo Produção') return 'direto';
    return 'despesa';
  }

  function _getIndirectCostInfo() {
    var manual = _getManualIndirectCostPercent();
    var mode = _recipeConfig.variableCostMode || _recipeConfig.custosVariaveisModo || _recipeConfig.indirectCostMode || _recipeConfig.custosIndiretosModo || 'manual';
    if (mode !== 'automatico') return { modeUsed: 'Manual', configuredMode: 'manual', percent: manual, fallback: false };

    var months = parseInt(_recipeConfig.variableCostMonths || _recipeConfig.custosVariaveisMeses || _recipeConfig.indirectCostMonths || _recipeConfig.custosIndiretosMeses, 10) || 6;
    if ([3, 6, 12].indexOf(months) < 0) months = 6;
    var start = new Date();
    start.setMonth(start.getMonth() - months);
    start.setHours(0, 0, 0, 0);

    var direct = 0;
    var indirect = 0;
    (_financeSaidas || []).concat(_financeApagar || []).forEach(function (item) {
      var rawDate = _financeRecordDate(item);
      if (!rawDate) return;
      var d = new Date(rawDate);
      if (isNaN(d.getTime()) || d < start) return;
      var value = _parseFichaNum(item.valor || item.amount || item.total);
      if (_financeCostClass(item) === 'direto') direct += value;
      if (_financeCostClass(item) === 'indireto') indirect += value;
    });

    if (direct <= 0 || indirect <= 0) {
      return { modeUsed: 'Manual', configuredMode: 'automatico', percent: manual, fallback: true, months: months };
    }
    return { modeUsed: 'Automático', configuredMode: 'automatico', percent: (indirect / direct) * 100, fallback: false, months: months };
  }

  function _insLossPercent(ins) {
    if (!ins) return 0;
    if (ins.perda_percentual != null) return Math.max(0, _parseFichaNum(ins.perda_percentual));
    if (ins.perdaPercentual != null) return Math.max(0, _parseFichaNum(ins.perdaPercentual));
    var aprov = _parseFichaNum(ins.aproveitamento_padrao || ins.aproveitamentoPadrao || 100) || 100;
    return Math.max(0, 100 - aprov);
  }

  function _calcFichaIng(ins, qty) {
    qty = _parseFichaNum(qty);
    var loss = _insLossPercent(ins);
    var factor = 1 - (loss / 100);
    if (factor <= 0) factor = 1;
    var grossQty = qty / factor;
    var unitCost = _recipeIngredientUnitCost(ins);
    return {
      lossPercent: loss,
      grossQuantity: _roundFichaCost(grossQty, 6),
      unitCost: _roundFichaCost(unitCost, 6),
      totalCost: _roundFichaCost(grossQty * unitCost, 4)
    };
  }

  function _recipeIngredientUnitCost(ins) {
    if (!ins) return 0;
    var directCost = _parseFichaNum(ins.custo_atual || ins.custoAtual || 0);
    if (_parseFichaNum(ins.preco_compra_base_embalagem || ins.basePackagePrice) > 0) return directCost;
    var hasPurchaseHistory = !!ins.ultima_compra_id || !!ins.ultima_compra_data || _parseFichaNum(ins.custo_medio_compra || 0) > 0 || _parseFichaNum(ins.custo_medio_qtd_base || 0) > 0;
    if (hasPurchaseHistory) return directCost;
    var content = _parseFichaNum(ins.conteudo_por_embalagem_padrao || ins.conteudoPorEmbalagemPadrao || 1) || 1;
    var savedPurchase = _parseFichaNum(ins.preco_compra || ins.purchasePrice || 0);
    if (content > 1 && directCost > 0 && savedPurchase > 0 && Math.abs(directCost - savedPurchase) < 0.000001) {
      return directCost / content;
    }
    return directCost;
  }

  function _isPackagingComponent(name) {
    return String(name || '').toLowerCase().indexOf('embal') >= 0;
  }

  function _isPackagingItem(item) {
    return String((item && (item.classe || item.itemClass || item.stockItemType)) || '').toLowerCase() === 'embalagem';
  }

  function _recipeCostTarget(componentName, item) {
    return _isPackagingItem(item) || _isPackagingComponent(componentName) ? 'packaging' : 'ingredients';
  }

  function _recipeYieldUnitKey(unit) {
    var value = String(unit || '').trim().toLowerCase();
    if (!value) return '';
    if (['un', 'unid', 'unidade', 'unidades', 'porção', 'porções', 'porcao', 'porcoes'].indexOf(value) >= 0) return 'count';
    if (['kg', 'quilo', 'quilos', 'quilograma', 'quilogramas'].indexOf(value) >= 0) return 'kg';
    if (['g', 'gr', 'grama', 'gramas'].indexOf(value) >= 0) return 'g';
    if (['l', 'litro', 'litros'].indexOf(value) >= 0) return 'l';
    if (['ml', 'mililitro', 'mililitros'].indexOf(value) >= 0) return 'ml';
    return value;
  }

  function _recipeResultUnitLabel(unit) {
    var key = _recipeYieldUnitKey(unit);
    if (key === 'count') return 'unidade';
    if (key === 'kg') return 'kg';
    if (key === 'g') return 'g';
    if (key === 'l') return 'L';
    if (key === 'ml') return 'ml';
    return String(unit || '').replace(/ões$/, 'ão').replace(/es$/, '').replace(/s$/, '') || 'unidade';
  }

  function _recipeCostPerBaseUnit(totalCost, yieldQty, yieldUnit, unitWeightG) {
    var key = _recipeYieldUnitKey(yieldUnit);
    var qty = _parseFichaNum(yieldQty);
    var total = _parseFichaNum(totalCost);
    var weight = _parseFichaNum(unitWeightG);
    if (!(qty > 0) || !(total > 0)) return { value: 0, label: 'kg / L', totalBaseQuantity: 0 };
    if (key === 'kg') return { value: total / qty, label: 'kg', totalBaseQuantity: qty };
    if (key === 'g') return { value: (total / qty) * 1000, label: 'kg', totalBaseQuantity: qty / 1000 };
    if (key === 'l') return { value: total / qty, label: 'L', totalBaseQuantity: qty };
    if (key === 'ml') return { value: (total / qty) * 1000, label: 'L', totalBaseQuantity: qty / 1000 };
    if (weight > 0) {
      var totalKg = (qty * weight) / 1000;
      return { value: totalKg > 0 ? total / totalKg : 0, label: 'kg', totalBaseQuantity: totalKg };
    }
    return { value: 0, label: 'kg / L', totalBaseQuantity: 0 };
  }

  function _componentYieldQuantity(comp) {
    return _parseFichaNum(comp.stageYieldQuantity || comp.baseYieldQuantity || comp.stockYieldQuantity || 0);
  }

  function _componentYieldUnit(comp) {
    return comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || '';
  }

  function _componentUsageQuantity(comp) {
    return _parseFichaNum(comp.stageUsageQuantity || comp.usageQuantity || comp.quantityPerUnit || comp.baseUsageQuantity || 0);
  }

  function _componentUsageUnit(comp) {
    return comp.stageUsageUnit || comp.usageUnit || comp.unitPerUnit || comp.baseUsageUnit || _componentYieldUnit(comp) || '';
  }

  function _componentUsageRatio(comp, recipeYieldQty, recipeYieldUnit) {
    var stageQty = _componentYieldQuantity(comp);
    var usageQty = _componentUsageQuantity(comp);
    var recipeQty = _parseFichaNum(recipeYieldQty);
    var stageUnit = _componentYieldUnit(comp);
    var usageUnit = _componentUsageUnit(comp);
    var recipeUnit = recipeYieldUnit || 'unidades';
    var usageCompatible = !!usageQty && !!stageQty && _recipeYieldUnitKey(usageUnit) && _recipeYieldUnitKey(usageUnit) === _recipeYieldUnitKey(stageUnit);
    var legacyCompatible = !!stageQty && !!recipeQty && _recipeYieldUnitKey(stageUnit) && _recipeYieldUnitKey(stageUnit) === _recipeYieldUnitKey(recipeUnit);
    var ratio = usageCompatible ? (usageQty / stageQty) : (legacyCompatible ? (recipeQty / stageQty) : 1);
    if (!isFinite(ratio) || ratio <= 0) ratio = 1;
    return {
      ratio: ratio,
      proportional: usageCompatible || legacyCompatible,
      stageYieldQuantity: stageQty,
      stageYieldUnit: stageUnit,
      stageUsageQuantity: usageQty,
      stageUsageUnit: usageUnit,
      recipeYieldQuantity: recipeQty,
      recipeYieldUnit: recipeUnit
    };
  }

  function _normalizeFichaComponents(f) {
    var comps = Array.isArray(f.components) ? f.components : [];
    if (!comps.length && Array.isArray(f.recipeComponents)) comps = f.recipeComponents;
    if (!comps.length && Array.isArray(f.ingredients) && f.ingredients.length) {
      comps = [{ name: 'Outro', note: '', ingredients: f.ingredients }];
    }
    if (!comps.length) comps = [{ name: _defaultRecipeComponentName(), note: '', ingredients: [] }];
    return comps.map(function (comp) {
      return {
        name: comp.name || comp.componentName || '',
        note: comp.note || comp.observation || comp.observacao || '',
        stageYieldQuantity: _parseFichaNum(comp.stageYieldQuantity || comp.baseYieldQuantity || comp.stockYieldQuantity || 0),
        stageYieldUnit: comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || '',
        stageUsageQuantity: _parseFichaNum(comp.stageUsageQuantity || comp.usageQuantity || comp.quantityPerUnit || comp.baseUsageQuantity || 0),
        stageUsageUnit: comp.stageUsageUnit || comp.usageUnit || comp.unitPerUnit || comp.baseUsageUnit || comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || '',
        stockControl: !!(comp.stockControl || comp.controlsStock),
        controlsStock: !!(comp.stockControl || comp.controlsStock),
        baseYieldQuantity: _parseFichaNum(comp.baseYieldQuantity || comp.stockYieldQuantity || 0),
        stockYieldQuantity: _parseFichaNum(comp.baseYieldQuantity || comp.stockYieldQuantity || 0),
        baseYieldUnit: comp.baseYieldUnit || comp.stockYieldUnit || '',
        stockYieldUnit: comp.baseYieldUnit || comp.stockYieldUnit || '',
        minStock: _parseFichaNum(comp.minStock || comp.estoque_minimo || 0),
        maxStock: _parseFichaNum(comp.maxStock || comp.estoque_maximo || 0),
        ingredients: (comp.ingredients || []).map(function (ing) {
          return {
            insumoId: ing.insumoId || ing.itemId || '',
            supplyName: ing.supplyName || ing.name || '',
            qty: _parseFichaNum(ing.qty != null ? ing.qty : ing.quantity),
            unit: ing.unit || '',
            lossPercent: _parseFichaNum(ing.lossPercent || 0),
            grossQuantityCalculated: _parseFichaNum(ing.grossQuantityCalculated || ing.grossQuantity || ing.qty || ing.quantity || 0),
            unitCost: _parseFichaNum(ing.unitCost || 0),
            totalCost: _parseFichaNum(ing.totalCost || 0),
            itemClass: ing.itemClass || ing.classe || ing.stockItemType || '',
            classe: ing.classe || ing.itemClass || ing.stockItemType || '',
            costType: ing.costType || (ing.classe === 'embalagem' || ing.itemClass === 'embalagem' ? 'embalagem' : 'insumo'),
            appliedQty: _parseFichaNum(ing.appliedQty || 0),
            appliedGrossQuantity: _parseFichaNum(ing.appliedGrossQuantity || 0),
            appliedTotalCost: _parseFichaNum(ing.appliedTotalCost || 0),
            stageUsageRatio: _parseFichaNum(ing.stageUsageRatio || 0)
          };
        })
      };
    });
  }

  function _normalizeFichaPackaging(f) {
    f = f || {};
    var list = Array.isArray(f.packagingItems) ? f.packagingItems : (Array.isArray(f.packaging) ? f.packaging : []);
    return list.map(function (item) {
      return {
        insumoId: item.insumoId || item.itemId || item.packagingId || '',
        supplyName: item.supplyName || item.name || '',
        qty: _parseFichaNum(item.qty != null ? item.qty : item.quantity),
        unit: item.unit || '',
        lossPercent: _parseFichaNum(item.lossPercent || 0),
        grossQuantityCalculated: _parseFichaNum(item.grossQuantityCalculated || item.grossQuantity || item.qty || item.quantity || 0),
        unitCost: _parseFichaNum(item.unitCost || 0),
        totalCost: _roundFichaCost(item.totalCost || 0, 4),
        itemClass: 'embalagem',
        classe: 'embalagem',
        costType: 'embalagem'
      };
    }).filter(function (item) {
      return item.insumoId || item.qty > 0 || item.supplyName;
    });
  }

  function _calcFichaComponentCosts(components, recipeYieldQty, recipeYieldUnit, packagingItems) {
    var ingredientCost = 0;
    var packagingCost = 0;
    var details = [];
    (components || []).forEach(function (comp) {
      var ratioInfo = _componentUsageRatio(comp, recipeYieldQty, recipeYieldUnit);
      var rawCost = 0;
      var rawIngredientCost = 0;
      var rawPackagingCost = 0;
      (comp.ingredients || []).forEach(function (ing) {
        var ins = _itensCusto.find(function (i) { return i.id === ing.insumoId; });
        var calc = _calcFichaIng(ins, ing.qty);
        var lineCost = calc.totalCost || _parseFichaNum(ing.totalCost || 0);
        rawCost += lineCost;
        if (_recipeCostTarget(comp.name, ins || ing) === 'packaging') rawPackagingCost += lineCost;
        else rawIngredientCost += lineCost;
      });
      var appliedIngredientCost = rawIngredientCost * ratioInfo.ratio;
      var appliedPackagingCost = rawPackagingCost * ratioInfo.ratio;
      ingredientCost += appliedIngredientCost;
      packagingCost += appliedPackagingCost;
      details.push(Object.assign({
        name: comp.name || '',
        rawCost: _roundFichaCost(rawCost, 4),
        appliedCost: _roundFichaCost(rawCost * ratioInfo.ratio, 4),
        ingredientCost: _roundFichaCost(appliedIngredientCost, 4),
        packagingCost: _roundFichaCost(appliedPackagingCost, 4)
      }, ratioInfo));
    });
    (packagingItems || []).forEach(function (item) {
      var ins = _itensCusto.find(function (i) { return String(i.id) === String(item.insumoId || item.itemId || ''); });
      var calc = _calcFichaIng(ins, item.qty);
      packagingCost += calc.totalCost || _parseFichaNum(item.totalCost || 0);
    });
    return {
      ingredients: _roundFichaCost(ingredientCost, 4),
      packaging: _roundFichaCost(packagingCost, 4),
      direct: _roundFichaCost(ingredientCost + packagingCost, 4),
      components: details
    };
  }

  function _fichaLbl() { return 'font-size:11px;font-weight:600;color:#7A746B;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.02em;'; }
  function _fichaInp() { return 'width:100%;padding:10px;border:1px solid #E6DDD3;border-radius:10px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;color:#1F1F1F;background:#fff;'; }

  function _fichaSummaryData(f) {
    f = f || {};
    var yieldQty = _parseFichaNum(f.yieldQuantity || f.yield) || 0;
    var yieldUnit = f.yieldUnit || 'unidades';
    var unitWeight = _parseFichaNum(f.unitWeightGrams || 0) || 0;
    var totalProduced = _parseFichaNum(f.totalProducedGrams || 0) || 0;
    if (!totalProduced && unitWeight > 0 && (yieldUnit === 'unidades' || yieldUnit === 'porções')) {
      totalProduced = yieldQty * unitWeight;
    }
    var costs = _calcFichaCosts(f);
    var perBase = _recipeCostPerBaseUnit(costs.totalCost, yieldQty, yieldUnit, unitWeight);
    var totalG = perBase.label === 'kg' ? perBase.totalBaseQuantity * 1000 : 0;
    return {
      yieldQty: yieldQty,
      yieldUnit: yieldUnit,
      unitWeight: unitWeight,
      totalProduced: totalProduced,
      totalG: totalG,
      costs: costs,
      costPerKg: perBase.value,
      costPerKgLabel: perBase.label
    };
  }

  function _fichaIngredientsViewHtml(f) {
    var comps = _normalizeFichaComponents(f);
    var recipeYieldQty = _parseFichaNum(f.yieldQuantity || f.yield || 0);
    var recipeYieldUnit = f.yieldUnit || 'unidades';
    if (!comps.length) {
      return '<div class="recipe-view-empty">Nenhum ingrediente cadastrado.</div>';
    }
    return comps.map(function (comp) {
      var ratioInfo = _componentUsageRatio(comp, recipeYieldQty, recipeYieldUnit);
      var list = (comp.ingredients || []).map(function (ing) {
        var ins = _itensCusto.find(function (i) { return i.id === ing.insumoId; });
        var calc = _calcFichaIng(ins, ing.qty);
        var rawCost = calc.totalCost || _parseFichaNum(ing.totalCost || 0);
        var lineCost = rawCost * ratioInfo.ratio;
        var qty = (_parseFichaNum(ing.qty || 0) * ratioInfo.ratio);
        return '<div class="recipe-view-ingredient-row">' +
          '<div class="recipe-view-ingredient-main">' +
            '<div class="recipe-view-ingredient-name">' + _esc((ins && ins.nome) || ing.supplyName || 'Ingrediente') + '</div>' +
            '<div class="recipe-view-ingredient-meta">' + _esc(qty ? qty.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : 0) + ' ' + _esc(ing.unit || (ins && ins.unidade_base) || '') + (ratioInfo.proportional ? ' usados nesta receita' : '') + '</div>' +
          '</div>' +
          '<div class="recipe-view-ingredient-cost">' + (lineCost > 0 ? _fmtFichaMoney(lineCost) : '€0,00') + '</div>' +
          '</div>';
      }).join('');
      if (!list) list = '<div class="recipe-view-empty">Sem ingredientes nesta base.</div>';
      var stepCost = _calcFichaComponentCosts([comp], recipeYieldQty, recipeYieldUnit).direct;
      var yieldNote = ratioInfo.proportional && ratioInfo.stageYieldQuantity
        ? '<div class="recipe-view-step-note">Usa ' + _esc(_roundFichaCost(ratioInfo.stageUsageQuantity || 0, 4)) + ' ' + _esc(ratioInfo.stageUsageUnit || ratioInfo.stageYieldUnit || recipeYieldUnit) + ' de uma base que rende ' + _esc(_roundFichaCost(ratioInfo.stageYieldQuantity, 4)) + ' ' + _esc(ratioInfo.stageYieldUnit || recipeYieldUnit) + '.</div>'
        : '';
      return '<div class="recipe-view-step-card">' +
        '<div class="recipe-view-step-head">' +
          '<div class="recipe-view-step-info">' +
            '<div class="recipe-view-step-title">' + _esc(comp.name || 'Base da receita') + '</div>' +
            (comp.note ? '<div class="recipe-view-step-note">' + _esc(comp.note) + '</div>' : '') +
            yieldNote +
          '</div>' +
          '<div class="recipe-view-step-cost">' + _fmtFichaMoney(stepCost) + '</div>' +
        '</div>' +
        list +
        '</div>';
    }).join('');
  }

  function _fichaPackagingViewHtml(f) {
    var list = _normalizeFichaPackaging(f);
    if (!list.length) return '<div class="recipe-view-empty">Nenhuma embalagem cadastrada para o rendimento global.</div>';
    return list.map(function (item) {
      var ins = _itensCusto.find(function (i) { return String(i.id) === String(item.insumoId || item.itemId || ''); });
      var calc = _calcFichaIng(ins, item.qty);
      var qty = _parseFichaNum(item.qty || 0);
      return '<div class="recipe-view-ingredient-row">' +
        '<div class="recipe-view-ingredient-main">' +
          '<div class="recipe-view-ingredient-name">' + _esc((ins && ins.nome) || item.supplyName || 'Embalagem') + '</div>' +
          '<div class="recipe-view-ingredient-meta">' + _esc(qty ? qty.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : 0) + ' ' + _esc(item.unit || (ins && ins.unidade_base) || '') + ' no rendimento global</div>' +
        '</div>' +
        '<div class="recipe-view-ingredient-cost">' + (calc.totalCost > 0 ? _fmtFichaMoney(calc.totalCost) : _fmtFichaMoney(_parseFichaNum(item.totalCost || 0))) + '</div>' +
        '</div>';
    }).join('');
  }

  function _openFichaViewModal(id) {
    var f = id ? (_fichas.find(function (x) { return x.id === id; }) || {}) : {};
    var summary = _fichaSummaryData(f);
    var img = f.imageThumbUrl || f.imageCardUrl || f.imageBase64 || f.imageUrl || '';
    var cat = f.category || 'Sem categoria';
    var yieldLabel = summary.yieldQty ? (summary.yieldQty + ' ' + (summary.yieldUnit || 'unidades')) : '—';
    var prodTotal = summary.totalProduced > 0
      ? (summary.totalProduced >= 1000 ? (summary.totalProduced / 1000).toFixed(2) + ' kg' : summary.totalProduced.toFixed(0) + ' g')
      : '—';
    var weightPerUnit = summary.unitWeight > 0 ? summary.unitWeight + ' g' : '—';
    var costPerKg = summary.costPerKg > 0 ? _fmtFichaMoney(summary.costPerKg) : '—';
    var costPerKgLabel = summary.costPerKgLabel || 'kg / L';
    var totalCost = _fmtFichaMoney(summary.costs.totalCost || 0);
    var costPerYield = _fmtFichaMoney(summary.costs.costPerYield || 0);
    var viewCss = '<style>' +
      '.recipe-view-wrap{display:flex;flex-direction:column;gap:14px;}' +
      '.recipe-view-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(31,31,31,.04);}' +
      '.recipe-view-head{display:grid;grid-template-columns:112px minmax(0,1fr) auto;gap:14px;align-items:center;}' +
      '.recipe-view-image{width:112px;height:112px;border-radius:16px;overflow:hidden;background:#FFFCF8;border:1px solid #EADFD8;display:flex;align-items:center;justify-content:center;color:#B9AAA6;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.recipe-view-image img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.recipe-view-eyebrow{font-size:11px;font-weight:650;color:#6F6860;letter-spacing:.02em;margin-bottom:6px;}' +
      '.recipe-view-title{font-size:26px;font-weight:700;line-height:1.08;color:#1F1F1F;margin:0 0 9px;word-break:break-word;}' +
      '.recipe-view-chip{display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;border:1px solid #EADFD8;background:#FFFCF8;color:#6F6860;font-size:12px;font-weight:500;}' +
      '.recipe-view-edit{height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;white-space:nowrap;}' +
      '.recipe-view-section-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;}' +
      '.recipe-view-section-icon{width:32px;height:32px;border-radius:12px;background:#FFF3F1;color:#B42318;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;}' +
      '.recipe-view-section-title{font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.25;}' +
      '.recipe-view-section-desc{font-size:12px;color:#6F6860;line-height:1.4;margin-top:3px;}' +
      '.recipe-view-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}' +
      '.recipe-view-tile{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:12px;min-width:0;}' +
      '.recipe-view-tile-label{font-size:10.5px;font-weight:650;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;}' +
      '.recipe-view-tile-value{font-size:18px;font-weight:650;color:#1F1F1F;line-height:1.15;overflow-wrap:anywhere;}' +
      '.recipe-view-tile-value.is-accent{color:#B42318;}' +
      '.recipe-view-tile-value.is-large{font-size:23px;}' +
      '.recipe-view-steps{display:flex;flex-direction:column;gap:10px;}' +
      '.recipe-view-step-card{background:#fff;border:1px solid #EADFD8;border-radius:14px;padding:13px 14px;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.recipe-view-step-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;}' +
      '.recipe-view-step-title{font-size:14px;font-weight:650;color:#1F1F1F;line-height:1.3;}' +
      '.recipe-view-step-note{font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;}' +
      '.recipe-view-step-cost{font-size:12px;font-weight:650;color:#B42318;white-space:nowrap;}' +
      '.recipe-view-ingredient-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid #F2E9E2;}' +
      '.recipe-view-ingredient-name{font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.recipe-view-ingredient-main{min-width:0;}' +
      '.recipe-view-ingredient-meta,.recipe-view-step-note{font-size:12px;color:#6F6860;}' +
      '.recipe-view-ingredient-cost{font-size:12px;font-weight:600;color:#1F1F1F;white-space:nowrap;}' +
      '.recipe-view-empty{padding:12px;border:1px dashed #EADFD8;border-radius:12px;color:#6F6860;font-size:12px;background:#FFFCF8;}' +
      '.recipe-view-text{font-size:13px;line-height:1.55;color:#1F1F1F;white-space:pre-wrap;}' +
      '.recipe-view-note-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;}' +
      '.recipe-view-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;width:100%;}' +
      '.recipe-view-footer-note{font-size:11.5px;color:#7A746B;line-height:1.4;}' +
      '.recipe-view-footer-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;}' +
      '.recipe-view-secondary{height:40px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.recipe-view-primary{height:40px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);}' +
      '@media(max-width:720px){.recipe-view-head{grid-template-columns:1fr}.recipe-view-image{width:100%;height:180px}.recipe-view-edit{width:100%}.recipe-view-tiles{grid-template-columns:1fr}.recipe-view-footer-actions,.recipe-view-secondary,.recipe-view-primary{width:100%;}.recipe-view-footer-actions{justify-content:stretch}}' +
      '</style>';
    var productionBlocks = [];
    if (f.preparationMode) productionBlocks.push('<div class="recipe-view-card"><div class="recipe-view-tile-label">Modo de preparo</div><div class="recipe-view-text">' + _esc(f.preparationMode) + '</div></div>');
    if (f.conservationType || f.shelfLifeValue || f.shelfLifeUnit) {
      productionBlocks.push('<div class="recipe-view-card"><div class="recipe-view-tile-label">Conservação e validade</div><div class="recipe-view-text">' + _esc(f.conservationType || '—') + (f.shelfLifeValue ? ' · ' + _esc(f.shelfLifeValue) + ' ' + _esc(f.shelfLifeUnit || 'dias') : '') + '</div></div>');
    }
    if (f.productionNotes) productionBlocks.push('<div class="recipe-view-card"><div class="recipe-view-tile-label">Observações</div><div class="recipe-view-text">' + _esc(f.productionNotes) + '</div></div>');
    var body = viewCss + '<div class="recipe-view-wrap">' +
      '<div class="recipe-view-card recipe-view-head">' +
      '<div class="recipe-view-image">' +
      (img ? '<img src="' + _esc(img) + '">' : '<span class="mi" style="font-size:34px;">receipt_long</span>') +
      '</div>' +
      '<div style="min-width:0;">' +
      '<div class="recipe-view-eyebrow">Resumo da receita</div>' +
      '<h3 class="recipe-view-title">' + _esc(f.name || 'Receita') + '</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<span class="recipe-view-chip">' + _esc(cat) + '</span>' +
      '</div>' +
      '</div>' +
      '<button type="button" onclick="Modules.Catalogo._editFichaFromView(\'' + _esc(id) + '\')" class="recipe-view-edit">Editar receita</button>' +
      '</div>' +
      '<div class="recipe-view-card">' +
        '<div class="recipe-view-section-head"><span class="mi recipe-view-section-icon">scale</span><div><div class="recipe-view-section-title">Rendimento</div><div class="recipe-view-section-desc">Quantidade prevista depois da receita pronta.</div></div></div>' +
        '<div class="recipe-view-tiles">' +
          '<div class="recipe-view-tile"><div class="recipe-view-tile-label">Rendimento</div><div class="recipe-view-tile-value">' + _esc(yieldLabel) + '</div></div>' +
          '<div class="recipe-view-tile"><div class="recipe-view-tile-label">Peso por unidade</div><div class="recipe-view-tile-value">' + _esc(weightPerUnit) + '</div></div>' +
          '<div class="recipe-view-tile"><div class="recipe-view-tile-label">Produção total</div><div class="recipe-view-tile-value">' + _esc(prodTotal) + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="recipe-view-card">' +
        '<div class="recipe-view-section-head"><span class="mi recipe-view-section-icon">payments</span><div><div class="recipe-view-section-title">Custos</div><div class="recipe-view-section-desc">Valores usados para acompanhar o custo da produção.</div></div></div>' +
        '<div class="recipe-view-tiles">' +
          '<div class="recipe-view-tile"><div class="recipe-view-tile-label">Custo total</div><div class="recipe-view-tile-value is-accent">' + totalCost + '</div></div>' +
          '<div class="recipe-view-tile"><div class="recipe-view-tile-label">Custo por unidade</div><div class="recipe-view-tile-value is-large">' + costPerYield + '</div></div>' +
          '<div class="recipe-view-tile"><div class="recipe-view-tile-label">Custo por ' + _esc(costPerKgLabel) + '</div><div class="recipe-view-tile-value">' + costPerKg + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="recipe-view-card">' +
        '<div class="recipe-view-section-head"><span class="mi recipe-view-section-icon">restaurant</span><div><div class="recipe-view-section-title">Ingredientes</div><div class="recipe-view-section-desc">Itens usados em cada base da receita.</div></div></div>' +
        '<div class="recipe-view-steps">' + _fichaIngredientsViewHtml(f) + '</div>' +
      '</div>' +
      '<div class="recipe-view-card">' +
        '<div class="recipe-view-section-head"><span class="mi recipe-view-section-icon">inventory_2</span><div><div class="recipe-view-section-title">Embalagens</div><div class="recipe-view-section-desc">Itens usados para embalar o rendimento global da receita.</div></div></div>' +
        '<div class="recipe-view-steps">' + _fichaPackagingViewHtml(f) + '</div>' +
      '</div>' +
      ((productionBlocks.length ? '<div class="recipe-view-note-grid">' + productionBlocks.join('') + '</div>' : '')) +
      '</div>';
    var footer = '<div class="recipe-view-footer">' +
      '<div class="recipe-view-footer-note">Revise os dados antes de editar a receita.</div>' +
      '<div class="recipe-view-footer-actions">' +
        '<button onclick="if(window._fichaViewModal){window._fichaViewModal.close();}" class="recipe-view-secondary">Fechar</button>' +
        '<button onclick="Modules.Catalogo._editFichaFromView(\'' + _esc(id) + '\')" class="recipe-view-primary">Editar receita</button>' +
      '</div>' +
      '</div>';
    window._fichaViewModal = UI.modal({ title: 'Detalhes da receita', body: body, footer: footer, maxWidth: '860px' });
  }

  function _editFichaFromView(id) {
    if (window._fichaViewModal) window._fichaViewModal.close();
    _openFichaModal(id);
  }

  function _openFichaModal(id) {
    _editingId = id;
    var f = id ? (_fichas.find(function (x) { return x.id === id; }) || {}) : {};
    window._fcDraftId = id || _newEntityId('receita');
    window._fcImageState = null;
    window._fichaIngCount = 0;
    window._fichaCompCount = 0;
    window._fichaPkgCount = 0;

    var YIELD_UNITS = ['unidades', 'porções', 'gramas', 'kg', 'ml', 'litros'];
    var CONSERV = ['Ambiente', 'Refrigerado', 'Congelado'];
    var SHELF_UNITS = ['horas', 'dias', 'meses'];

    var catOpts = _recipeCategoryOptionsHtml(f.category || '');
    var yieldUnitOpts = YIELD_UNITS.map(function (u) {
      return '<option value="' + u + '"' + ((f.yieldUnit || 'unidades') === u ? ' selected' : '') + '>' + u + '</option>';
    }).join('');
    var conservOpts = CONSERV.map(function (c) {
      return '<option value="' + c + '"' + (f.conservationType === c ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
    var shelfUnitOpts = SHELF_UNITS.map(function (u) {
      return '<option value="' + u + '"' + ((f.shelfLifeUnit || 'dias') === u ? ' selected' : '') + '>' + u + '</option>';
    }).join('');

    var insOptions = _itensCusto.map(function (ins) {
      return '<option value="' + ins.id + '" data-aprov="' + (ins.aproveitamento_padrao || 100) + '" data-custo="' + (ins.custo_atual || 0) + '" data-unidade="' + _esc(ins.unidade_base || 'un') + '">' + _esc(ins.nome) + ' (' + _esc(ins.unidade_base || '') + ')</option>';
    }).join('');
    window._fichaInsOptions = insOptions;

    var imgPreviewStyle = _imageUrlFor(f, 'card') ? '' : 'display:none;';
    var imgSrc = _imageUrlFor(f, 'card') || '';

    var showPeso = !f.yieldUnit || f.yieldUnit === 'unidades' || f.yieldUnit === 'porções';
    var summary = _fichaSummaryData(f);
    var costBadge = summary.costs.costPerYield > 0 ? _fmtFichaMoney(summary.costs.costPerYield) : '—';

    var sectionHead = function (icon, title, desc) {
      return '<div class="recipe-modal-head"><span class="mi">' + _esc(icon) + '</span><div><div class="recipe-modal-title">' + _esc(title) + '</div><div class="recipe-modal-desc">' + _esc(desc || '') + '</div></div></div>';
    };

    var componentRows = _normalizeFichaComponents(f).map(function (comp, i) {
      window._fichaCompCount = i + 1;
      return _fichaComponentHtml(i, comp);
    }).join('');
    var packagingRows = _normalizeFichaPackaging(f).map(function (item, i) {
      window._fichaPkgCount = i + 1;
      return _fichaPackagingRow(i, item.insumoId, item.qty || '');
    }).join('');
    if (!packagingRows) packagingRows = '';

    var modalCss = '<style>' +
      '.recipe-modal-body{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;font-family:Manrope,Inter,sans-serif;}' +
      '.recipe-modal-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:14px;box-shadow:0 10px 24px rgba(31,31,31,.04);min-width:0;}' +
      '.recipe-modal-main,.recipe-modal-ingredients,.recipe-modal-packaging,.recipe-modal-cost,.recipe-modal-production{grid-column:1/-1}.recipe-modal-yield{grid-column:1/span 6}.recipe-modal-image{grid-column:7/-1}' +
      '.recipe-modal-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:12px;}' +
      '.recipe-modal-head .mi{font-size:18px;color:#6F6860;line-height:1.2;}' +
      '.recipe-modal-title{font-size:13px;font-weight:800;line-height:1.25;color:#1F1F1F;margin-bottom:3px;}' +
      '.recipe-modal-desc{font-size:12px;line-height:1.4;color:#8A7E7C;margin:0;max-width:760px;}' +
      '.recipe-modal-grid{display:grid;gap:11px 12px;align-items:end}.recipe-modal-main-grid{grid-template-columns:minmax(280px,1fr) minmax(180px,.55fr)}.recipe-yield-grid{grid-template-columns:minmax(140px,.42fr) minmax(190px,.62fr)}.recipe-stock-grid{grid-template-columns:minmax(130px,.38fr) minmax(130px,.38fr);justify-content:start;}#fc-peso-section{grid-template-columns:minmax(150px,.5fr) minmax(190px,.65fr)!important;}.recipe-production-top{margin-bottom:12px}.recipe-production-top .recipe-modal-head{margin-bottom:0}.recipe-production-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.68fr);gap:12px;align-items:start}.recipe-production-group{background:#FFFCF8;border:1px solid #EADFD8;border-radius:16px;padding:12px;box-shadow:0 1px 2px rgba(31,31,31,.03);min-width:0}.recipe-production-group-title{font-size:11px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:9px}.recipe-production-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(112px,.42fr);gap:9px;align-items:end}.recipe-production-full{grid-column:1/-1}' +
      '.recipe-cost-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(260px,.72fr);gap:12px;align-items:stretch;}' +
      '.recipe-cost-group{background:#FFFCF8;border:1px solid #EADFD8;border-radius:16px;padding:12px;box-shadow:0 1px 2px rgba(31,31,31,.03);min-width:0;}' +
      '.recipe-cost-group-title{font-size:11px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:9px;}' +
      '.recipe-cost-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}' +
      '.recipe-cost-results{display:grid;grid-template-columns:1fr;gap:9px;}' +
      '.recipe-cost-card{background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:10px 12px;box-shadow:0 1px 2px rgba(31,31,31,.03);min-width:0;}' +
      '.recipe-cost-card.is-total{background:linear-gradient(180deg,#FFF7F5 0%,#fff 100%);border-color:#E7C6C0;}' +
      '.recipe-help-note{margin-top:10px;font-size:11px;color:#6F6860;line-height:1.45;}' +
      '.recipe-help-btn{border:0;background:transparent;color:#B42318;border-radius:8px;height:auto;padding:0;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;}' +
      '.recipe-help-box{display:none;margin:0 0 12px;padding:11px 12px;border:1px solid #EADFD8;border-radius:12px;background:#FFFCF8;color:#5A4E4C;font-size:12px;line-height:1.5;}' +
      '.recipe-help-box strong{color:#1F1F1F;font-weight:700;}' +
      '.recipe-inline-label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px;}' +
      '.recipe-inline-add{height:24px;padding:0 8px;border-radius:999px;border:1px solid #EADFD8;background:#fff;color:#B42318;font-size:11px;font-weight:700;line-height:1;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.recipe-inline-add:hover{background:#FFF3F1;border-color:#F2B8B2;}' +
      '.recipe-dashed-btn{width:100%;height:38px;padding:0 12px;border-radius:10px;border:1px dashed #D8CCC5;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#6F6860;font-family:inherit;margin-top:10px;}' +
      '.recipe-dashed-btn:hover{background:#FFFCF8;border-color:#D9AAA1;color:#B42318;}' +
      '.recipe-add-stage-btn{height:42px;border-style:solid;border-color:#E7C6C0;background:linear-gradient(180deg,#FFF7F5 0%,#fff 100%);color:#B42318;font-size:13px;font-weight:700;box-shadow:0 6px 14px rgba(180,35,24,.08);}' +
      '.recipe-add-stage-btn:hover{background:#FFF3F1;border-color:#D9AAA1;color:#9F1F16;}' +
      '.recipe-component{background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:13px;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.recipe-stage-guidance{border:1px solid #EADFD8;border-radius:14px;background:#FFFCF8;padding:11px 12px;margin-bottom:12px;color:#5F5652;font-size:12px;line-height:1.5;}' +
      '.recipe-stage-guidance strong{color:#1F1F1F;font-weight:800;}' +
      '.recipe-component-hint{margin-top:7px;color:#6F6860;font-size:11.5px;line-height:1.42;}' +
      '.recipe-base-copy{grid-column:1/-1;border-top:1px solid #EFE4DC;padding-top:9px;color:#6F6860;font-size:11.5px;line-height:1.45;}' +
      '.recipe-component-head{display:grid;grid-template-columns:minmax(220px,1fr) minmax(180px,.8fr) 34px;gap:10px;align-items:end;margin-bottom:12px;}' +
      '.recipe-component-base{display:grid;grid-template-columns:minmax(220px,1fr) minmax(130px,.4fr) minmax(180px,.58fr);gap:10px;align-items:end;background:#FFFCF8;border:1px solid #EAE4DA;border-radius:14px;padding:10px;margin-bottom:12px;}' +
      '.recipe-component-base label{display:flex;align-items:center;gap:8px;font-size:12px;color:#1F1F1F;font-weight:500;line-height:1.35;}' +
      '.recipe-ingredient-row{display:grid;grid-template-columns:minmax(210px,1.2fr) minmax(86px,.42fr) minmax(62px,.28fr) minmax(72px,.32fr) minmax(82px,.34fr) 30px;gap:8px;align-items:center;padding:9px;border:1px solid #EAE4DA;border-radius:12px;background:#FFFCF8;box-shadow:none;}' +
      '.recipe-packaging-row{display:grid;grid-template-columns:minmax(230px,1.25fr) minmax(120px,.42fr) minmax(70px,.28fr) minmax(92px,.34fr) 30px;gap:8px;align-items:center;padding:9px;border:1px solid #EAE4DA;border-radius:12px;background:#FFFCF8;box-shadow:none;}' +
      '.recipe-ingredient-picker{position:relative;}' +
      '.recipe-ingredient-dropdown{display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:10020;background:#fff;border:1px solid #EADFD8;border-radius:12px;max-height:220px;overflow-y:auto;box-shadow:0 14px 32px rgba(31,31,31,.14);}' +
      '.recipe-ingredient-option{padding:9px 11px;border-bottom:1px solid #F2E9E2;cursor:pointer;background:#fff;}' +
      '.recipe-ingredient-option:hover{background:#FFFCF8;}' +
      '.recipe-ingredient-option-name{font-size:13px;font-weight:650;color:#1F1F1F;line-height:1.25;}' +
      '.recipe-ingredient-option-meta{font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;}' +
      '.supplier-field-control{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.supplier-field-control:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08)}.supplier-field-control input,.supplier-field-control select,.supplier-field-control textarea{width:100%;min-height:36px;border:0;border-radius:8px;padding:0 8px;font-size:14px;font-family:inherit;outline:none;background:transparent;box-sizing:border-box;color:#1F1F1F;box-shadow:none}.supplier-field-control select{padding-right:42px;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 16px center;background-size:14px}.supplier-field-control textarea{min-height:72px;padding-top:8px;padding-bottom:8px;resize:vertical}.supplier-field-control input[type=file]{padding-top:7px;}' +
      '.recipe-footer{display:flex;align-items:center;gap:8px;}' +
      '.recipe-footer-note{font-size:11px;color:#6F6860;margin-right:auto;}' +
      '.recipe-cancel-btn{height:38px;padding:0 14px;border-radius:10px;border:1px solid #E6E1D8;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}' +
      '.recipe-delete-btn{height:38px;padding:0 14px;border-radius:10px;border:1px solid #F1D3CF;background:#FFF7F5;color:#B42318;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}' +
      '.recipe-save-btn{height:38px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;}' +
      '.recipe-save-btn:hover{background:#9F1F16;}' +
      '@media(max-width:900px){.recipe-modal-yield,.recipe-modal-image{grid-column:1/-1}.recipe-modal-main-grid,.recipe-yield-grid,.recipe-stock-grid,.recipe-production-grid{grid-template-columns:1fr 1fr}.recipe-production-layout,.recipe-cost-layout{grid-template-columns:1fr}.recipe-component-base{grid-template-columns:minmax(220px,1fr) minmax(130px,.4fr) minmax(180px,.58fr)}.recipe-ingredient-row{grid-template-columns:minmax(210px,1fr) 90px 62px 72px 82px 30px}.recipe-packaging-row{grid-template-columns:minmax(210px,1fr) 110px 70px 92px 30px}}@media(max-width:640px){.recipe-modal-body{grid-template-columns:1fr}.recipe-modal-card{grid-column:1/-1!important;padding:13px}.recipe-modal-main-grid,.recipe-yield-grid,.recipe-stock-grid,#fc-peso-section,.recipe-production-grid,.recipe-component-head,.recipe-component-base,.recipe-ingredient-row,.recipe-packaging-row,.recipe-cost-grid{grid-template-columns:1fr!important}.recipe-footer{align-items:stretch;flex-direction:column}.recipe-footer-note{margin-right:0;text-align:center}.recipe-save-btn,.recipe-cancel-btn,.recipe-delete-btn{width:100%;}}' +
      '</style>';

    var body = modalCss + '<div class="recipe-modal-body">' +

      '<div class="recipe-modal-card recipe-modal-main">' + sectionHead('receipt_long', 'Dados da receita', 'Dê um nome claro para encontrar esta receita depois.') +
      '<div class="recipe-modal-grid recipe-modal-main-grid">' +
      '<div><label style="' + _fichaLbl() + '">Nome da receita *</label>' +
      '<div class="supplier-field-control"><input id="fc-name" type="text" value="' + _esc(f.name || '') + '"></div></div>' +
      '<div><div class="recipe-inline-label"><label style="' + _fichaLbl() + 'margin-bottom:0;">Categoria</label><button type="button" class="recipe-inline-add" onclick="Modules.Catalogo._openRecipeCategoryCreateModal()">+ categoria</button></div>' +
      '<div class="supplier-field-control"><select id="fc-category"><option value="">Selecionar...</option>' + catOpts + '</select></div></div>' +
      '</div>' +
      '<div style="margin-top:11px;"><label style="' + _fichaLbl() + '">Anotações da receita</label>' +
      '<div class="supplier-field-control"><textarea id="fc-notes">' + _esc(f.internalNotes || '') + '</textarea></div></div>' +
      '</div>' +

      '<div class="recipe-modal-card recipe-modal-yield">' +
      '<div class="recipe-modal-head"><span class="mi">scale</span><div><div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;"><div class="recipe-modal-title">Unidade da ficha</div><button type="button" class="recipe-help-btn" onclick="Modules.Catalogo._toggleFichaYieldHelp()">Como preencher?</button></div><div class="recipe-modal-desc">Use 1 unidade quando esta ficha representa um produto vendido.</div></div></div>' +
      '<div id="fc-yield-help" class="recipe-help-box">' +
        'Para produto vendido, a ficha pode representar 1 unidade final.<br><br>' +
        '<strong>Exemplo:</strong><br>' +
        'Pastel de frango usa 80 g de recheio de frango e 1 embalagem. Coxinha usa 50 g de recheio de frango.<br><br>' +
        '<strong>Preencha assim:</strong><br>' +
        '• Quantidade base: 1<br>' +
        '• Tipo de rendimento: unidades<br>' +
        '• Peso por unidade: só preencha se cada unidade tiver um peso padrão<br><br>' +
        'O rendimento da base, como 1 kg de frango preparado, fica no cadastro da base de produção. Aqui entra só quanto a ficha consome daquela base.<br><br>' +
        '<strong>Importante:</strong><br>' +
        'se deixar vazio, o BocaFood considera 1 unidade.' +
      '</div>' +
      '<div class="recipe-modal-grid recipe-yield-grid">' +
      '<div><label style="' + _fichaLbl() + '">Quantidade base</label>' +
      '<div class="supplier-field-control"><input id="fc-yield-qty" type="text" value="' + _esc(f.yieldQuantity || f.yield || '') + '" placeholder="1" oninput="Modules.Catalogo._updateFichaPesoTotal()"></div></div>' +
      '<div><label style="' + _fichaLbl() + '">Unidade base</label>' +
      '<div class="supplier-field-control"><select id="fc-yield-unit" onchange="Modules.Catalogo._onYieldUnitChange()">' + yieldUnitOpts + '</select></div></div>' +
      '</div>' +
      '<div id="fc-peso-section" class="recipe-modal-grid" style="display:' + (showPeso ? 'grid' : 'none') + ';grid-template-columns:1fr 1fr;gap:12px;margin-top:11px;">' +
      '<div><label style="' + _fichaLbl() + '">Peso por unidade (g)</label>' +
      '<div class="supplier-field-control"><input id="fc-unit-weight" type="text" value="' + _esc(f.unitWeightGrams || '') + '" placeholder="Ex: 120" oninput="Modules.Catalogo._updateFichaPesoTotal()"></div></div>' +
      '<div><label style="' + _fichaLbl() + '">Peso total produzido</label>' +
      '<div class="supplier-field-control"><input id="fc-peso-total" type="text" readonly placeholder="Calculado automaticamente" style="color:#8A7E7C;"></div></div>' +
      '</div>' +
      '<div class="recipe-modal-grid recipe-stock-grid" style="margin-top:11px;">' +
      '<div><label style="' + _fichaLbl() + '">Estoque mínimo</label><div class="supplier-field-control"><input id="fc-stock-min" type="text" value="' + _esc(f.minStock || f.estoque_minimo || '') + '" placeholder="Ex: 20"></div></div>' +
      '<div><label style="' + _fichaLbl() + '">Estoque máximo</label><div class="supplier-field-control"><input id="fc-stock-max" type="text" value="' + _esc(f.maxStock || f.estoque_maximo || '') + '" placeholder="Ex: 80"></div></div>' +
      '</div>' +
      '<div style="margin-top:12px;background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:10px 12px;box-shadow:0 1px 2px rgba(31,31,31,.03);"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Custo por unidade</div><strong style="font-size:17px;color:#1A1A1A;">' + costBadge + '</strong></div>' +
      '</div>' +

      '<div class="recipe-modal-card recipe-modal-image">' + sectionHead('image', 'Imagem', 'Adicione uma foto para reconhecer esta receita com mais facilidade.') +
      '<label style="' + _fichaLbl() + '">Foto da receita</label>' +
      '<div class="supplier-field-control"><input type="file" id="fc-img-file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Catalogo._onFichaImgChange(event)"></div>' +
      '<div style="margin-top:6px;font-size:11px;line-height:1.45;color:#8A7E7C;">' + _imageUploadTip('product') + '</div>' +
      '<img id="fc-img-preview" src="' + imgSrc + '" style="max-width:100%;max-height:110px;border-radius:9px;margin-top:8px;' + imgPreviewStyle + '">' +
      '</div>' +

      '<div class="recipe-modal-card recipe-modal-ingredients">' +
      '<div class="recipe-modal-head"><span class="mi">restaurant</span><div><div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;"><div class="recipe-modal-title">Bases e ingredientes</div><button type="button" class="recipe-help-btn" onclick="Modules.Catalogo._toggleFichaIngredientsHelp()">Como preencher?</button></div><div class="recipe-modal-desc">Escolha uma base reaproveitável e informe os ingredientes usados nela.</div></div></div>' +
      '<div id="fc-ingredients-help" class="recipe-help-box">' +
        '<strong>Primeiro escolha a base.</strong><br>' +
        'A base é a produção reaproveitável da receita, como Massa de coxinha, Recheio de frango, Creme branco, Molho ou Cobertura.<br><br>' +
        '<strong>Use sempre a mesma base quando for a mesma produção.</strong><br>' +
        'Se o mesmo Recheio de frango entra na coxinha e no pastel, selecione Recheio de frango nas duas receitas. Assim o BocaFood consegue tratar essa base como uma coisa só na produção.<br><br>' +
        '<strong>Depois adicione os ingredientes dessa base.</strong><br>' +
        '<strong>Exemplo:</strong><br>' +
        'Na base "Massa", você pode adicionar farinha, leite, manteiga e sal.<br><br>' +
        'Preencha a quantidade que realmente entra na base ou na parte usada por esta receita.<br><br>' +
        '<strong>Controle como base de produção</strong><br>' +
        'Marque essa opção quando você produz essa base antes e guarda para usar depois. Exemplo: faz uma panela de recheio e usa em vários produtos ao longo do dia.<br><br>' +
        '<strong>Importante:</strong><br>' +
        'não informe como você compra o ingrediente.<br>' +
        'Informe quanto você usa na produção.<br><br>' +
        '<strong>Exemplo:</strong><br>' +
        'se você compra farinha em saco de 5 kg, mas usa 500 g na massa, coloque 500 g aqui.' +
      '</div>' +
      '<div id="fc-components" style="display:flex;flex-direction:column;gap:12px;">' + componentRows + '</div>' +
      '<button type="button" onclick="Modules.Catalogo._addFichaComponent()" class="recipe-dashed-btn recipe-add-stage-btn">+ Adicionar base</button>' +
      '</div>' +

      '<div class="recipe-modal-card recipe-modal-packaging">' +
      '<div class="recipe-modal-head"><span class="mi">inventory_2</span><div><div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;"><div class="recipe-modal-title">Embalagens da receita</div><button type="button" class="recipe-help-btn" onclick="Modules.Catalogo._toggleFichaPackagingHelp()">Como preencher?</button></div><div class="recipe-modal-desc">Cadastre as embalagens usadas para o rendimento global da receita pronta.</div></div></div>' +
      '<div id="fc-packaging-help" class="recipe-help-box">' +
        'Use esta parte para informar as embalagens usadas depois que a receita fica pronta.<br><br>' +
        '<strong>Ela acompanha o rendimento global da receita.</strong><br>' +
        'Se a receita rende 15 unidades e cada unidade usa 1 saquinho, preencha 15 saquinhos aqui.<br><br>' +
        'Se a receita rende 15 unidades e todas vão em 1 caixa grande, preencha 1 caixa.<br><br>' +
        'Não coloque embalagem dentro da base massa, recheio ou finalização, porque ela não depende do rendimento da base. Ela depende do rendimento final da receita.' +
      '</div>' +
      '<div id="fc-packaging-list" style="display:flex;flex-direction:column;gap:8px;">' + packagingRows + '</div>' +
      '<button type="button" onclick="Modules.Catalogo._addFichaPackaging()" class="recipe-dashed-btn">+ Adicionar embalagem</button>' +
      '</div>' +

      '<div class="recipe-modal-card recipe-modal-cost">' + sectionHead('payments', 'Custos', 'Veja quanto esta receita custa para produzir.') +
      '<div class="recipe-cost-layout">' +
      '<div class="recipe-cost-group"><div class="recipe-cost-group-title">Composição do custo</div><div class="recipe-cost-grid">' +
      '<div class="recipe-cost-card"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Ingredientes</div><div id="fc-cost-ingredients" style="font-size:18px;font-weight:600;color:#1F1F1F;">€0,00</div></div>' +
      '<div class="recipe-cost-card"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Embalagem</div><div id="fc-cost-packaging" style="font-size:18px;font-weight:600;color:#1F1F1F;">€0,00</div></div>' +
      '<div class="recipe-cost-card"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Custo direto</div><div id="fc-cost-direct" style="font-size:18px;font-weight:600;color:#1F1F1F;">€0,00</div></div>' +
      '<div class="recipe-cost-card"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Outros custos <span id="fc-indirect-pct"></span></div><div id="fc-cost-indirect" style="font-size:18px;font-weight:600;color:#B42318;">€0,00</div><div id="fc-indirect-mode" style="font-size:10px;color:#6F6860;margin-top:3px;">Critério: Manual</div></div>' +
      '</div></div>' +
      '<div class="recipe-cost-group"><div class="recipe-cost-group-title">Resultado da receita</div><div class="recipe-cost-results">' +
      '<div class="recipe-cost-card is-total"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Custo total</div><div id="fc-cost-total" style="font-size:20px;font-weight:700;color:#B42318;">€0,00</div></div>' +
      '<div class="recipe-cost-card"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Por <span id="fc-cost-unit-label">unidade</span></div><div id="fc-cost-unit" style="font-size:18px;font-weight:600;color:#1F1F1F;">€0,00</div></div>' +
      '<div class="recipe-cost-card"><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Por <span id="fc-cost-base-label">kg / L</span></div><div id="fc-cost-kg" style="font-size:18px;font-weight:600;color:#1F1F1F;">—</div></div>' +
      '</div></div>' +
      '</div>' +
      '<div class="recipe-help-note">Os custos são atualizados conforme os ingredientes e quantidades informadas nesta receita.</div>' +
      '</div>' +

      '<div class="recipe-modal-card recipe-modal-production">' +
      '<div class="recipe-production-top">' + sectionHead('restaurant_menu', 'Produção', 'Registre orientações de preparo, armazenamento e validade.') + '</div>' +
      '<div class="recipe-production-layout">' +
      '<div class="recipe-production-group"><div class="recipe-production-group-title">Preparo</div>' +
      '<div style="margin-bottom:10px;"><label style="' + _fichaLbl() + '">Modo de preparo</label>' +
      '<div class="supplier-field-control"><textarea id="fc-prep" placeholder="Descreva o passo a passo da produção desta receita." style="min-height:104px;">' + _esc(f.preparationMode || '') + '</textarea></div></div>' +
      '<div><label style="' + _fichaLbl() + '">Cuidados no preparo</label>' +
      '<div class="supplier-field-control"><textarea id="fc-prod-notes" placeholder="Ex: ponto da massa, cuidado no forno, embalagem final.">' + _esc(f.productionNotes || '') + '</textarea></div></div>' +
      '</div>' +
      '<div class="recipe-production-group"><div class="recipe-production-group-title">Conservação e validade</div>' +
      '<div class="recipe-production-grid">' +
      '<div class="recipe-production-full"><label style="' + _fichaLbl() + '">Conservação</label>' +
      '<div class="supplier-field-control"><select id="fc-conserv"><option value="">Selecionar...</option>' + conservOpts + '</select></div></div>' +
      '<div><label style="' + _fichaLbl() + '">Validade</label>' +
      '<div class="supplier-field-control"><input id="fc-shelf-val" type="text" value="' + _esc(f.shelfLifeValue || '') + '" placeholder="Ex: 30"></div></div>' +
      '<div><label style="' + _fichaLbl() + '">Unidade</label>' +
      '<div class="supplier-field-control"><select id="fc-shelf-unit">' + shelfUnitOpts + '</select></div></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#6F6860;line-height:1.45;margin-top:9px;">Use esta parte para registrar como a receita deve ser guardada e por quanto tempo pode ser usada.</div>' +
      '</div>' +
      '</div>' +
      '</div>' +

      '</div>';

    var footer = id
      ? '<div class="recipe-footer">' +
        '<button onclick="Modules.Catalogo._deleteFicha(\'' + id + '\')" class="recipe-delete-btn">Excluir</button>' +
        '<span style="flex:1;"></span>' +
        '<button onclick="window._fichaModal&&window._fichaModal.close()" class="recipe-cancel-btn">Cancelar</button>' +
        '<button onclick="Modules.Catalogo._saveFicha()" class="recipe-save-btn">Atualizar receita</button>' +
        '</div>'
      : '<div class="recipe-footer" style="justify-content:flex-end;">' +
        '<button onclick="window._fichaModal&&window._fichaModal.close()" class="recipe-cancel-btn">Cancelar</button>' +
        '<button onclick="Modules.Catalogo._saveFicha()" class="recipe-save-btn">Adicionar receita</button>' +
        '</div>';
    window._fichaModal = UI.modal({ title: id ? 'Editar Receita' : 'Nova Receita', body: body, footer: footer, maxWidth: '1120px' });
    setTimeout(function () { _updateFichaCost(); _updateFichaPesoTotal(); }, 80);
  }

  function _recipeComponentNames(selected) {
    var seen = {};
    var names = [];
    (_recipeComponents || []).forEach(function (c) {
      var name = (c.name || c.label || '').trim();
      var key = name.toLowerCase();
      if (!name || seen[key]) return;
      seen[key] = true;
      names.push(name);
    });
    if (selected && !seen[String(selected).toLowerCase()]) names.push(selected);
    return names;
  }

  function _recipeComponentByName(name) {
    var wanted = String(name || '').trim().toLowerCase();
    if (!wanted) return null;
    return (_recipeComponents || []).find(function (c) {
      return String(c.name || c.label || '').trim().toLowerCase() === wanted;
    }) || null;
  }

  function _recipeComponentTemplateIngredients(name) {
    var component = _recipeComponentByName(name);
    var ingredients = component && Array.isArray(component.ingredients) ? component.ingredients : [];
    return ingredients.map(function (ing) {
      var itemId = String(ing && (ing.insumoId || ing.itemId || ing.ingredientId || ing.supplyId || ing.packagingId) || '').trim();
      var qty = _moneyLike(ing && (ing.qty != null ? ing.qty : ing.quantity != null ? ing.quantity : ing.amount));
      return itemId && qty > 0 ? { insumoId: itemId, qty: qty, stageManaged: true } : null;
    }).filter(Boolean);
  }

  function _recipeComponentStageDefaults(name) {
    var component = _recipeComponentByName(name) || {};
    return {
      stageYieldQuantity: component.stageYieldQuantity != null ? component.stageYieldQuantity : component.yieldQuantity != null ? component.yieldQuantity : component.baseYieldQuantity != null ? component.baseYieldQuantity : component.stockYieldQuantity,
      stageYieldUnit: component.stageYieldUnit || component.yieldUnit || component.baseYieldUnit || component.stockYieldUnit || ''
    };
  }

  function _componentHasRealIngredients(compIdx) {
    var compEl = document.getElementById('fc-comp-' + compIdx);
    if (!compEl) return false;
    return [].slice.call(compEl.querySelectorAll('[data-ing-idx]')).some(function (hidden) {
      var idx = hidden.getAttribute('data-ing-idx');
      var qtyEl = compEl.querySelector('[data-ing-qty="' + idx + '"]');
      return String(hidden.value || '').trim() || _moneyLike(qtyEl && qtyEl.value) > 0;
    });
  }

  function _setSelectValueWithFallback(select, value) {
    if (!select || !value) return;
    var wanted = String(value);
    var exists = [].slice.call(select.options || []).some(function (option) { return String(option.value) === wanted; });
    if (!exists) {
      select.insertAdjacentHTML('afterbegin', '<option value="' + _esc(wanted) + '">' + _esc(wanted) + '</option>');
    }
    select.value = wanted;
  }

  function _syncRecipeComponentUsageUnit(compIdx) {
    var select = document.querySelector('[data-comp-name="' + compIdx + '"]');
    var name = select ? String(select.value || '').trim() : '';
    var defaults = _recipeComponentStageDefaults(name);
    var unitEl = document.querySelector('[data-comp-stock-unit="' + compIdx + '"]');
    if (!unitEl) return;
    if (defaults.stageYieldUnit) {
      _setSelectValueWithFallback(unitEl, defaults.stageYieldUnit);
      unitEl.disabled = true;
      unitEl.setAttribute('aria-readonly', 'true');
    } else {
      unitEl.disabled = false;
      unitEl.removeAttribute('aria-readonly');
    }
  }

  function _modalComponentUsageRatio(compIdx) {
    var container = document.getElementById('fc-components') || document;
    var nameEl = container.querySelector('[data-comp-name="' + compIdx + '"]');
    var name = nameEl ? String(nameEl.value || '').trim() : '';
    var defaults = _recipeComponentStageDefaults(name);
    var yieldQty = _parseFichaNum((document.getElementById('fc-yield-qty') || {}).value) || 1;
    var yieldUnit = ((document.getElementById('fc-yield-unit') || {}).value) || 'unidades';
    var usageUnitEl = container.querySelector('[data-comp-stock-unit="' + compIdx + '"]');
    var usageUnit = (defaults.stageYieldUnit || (usageUnitEl && usageUnitEl.value) || '').trim();
    return _componentUsageRatio({
      stageYieldQuantity: _parseFichaNum(defaults.stageYieldQuantity || 0),
      stageYieldUnit: defaults.stageYieldUnit || usageUnit,
      stageUsageQuantity: _parseFichaNum((container.querySelector('[data-comp-stock-qty="' + compIdx + '"]') || {}).value),
      stageUsageUnit: usageUnit
    }, yieldQty, yieldUnit);
  }

  function _displayFichaQty(value) {
    var n = _roundFichaCost(value, 4);
    if (!n) return '';
    return String(n).replace('.', ',');
  }

  function _applyRecipeComponentTemplate(compIdx, force) {
    var select = document.querySelector('[data-comp-name="' + compIdx + '"]');
    var name = select ? String(select.value || '').trim() : '';
    var templateIngredients = _recipeComponentTemplateIngredients(name);
    var defaults = _recipeComponentStageDefaults(name);
    var qtyEl = document.querySelector('[data-comp-stock-qty="' + compIdx + '"]');
    var unitEl = document.querySelector('[data-comp-stock-unit="' + compIdx + '"]');
    _syncRecipeComponentUsageUnit(compIdx);
    if (!templateIngredients.length) {
      _updateFichaCost();
      return;
    }
    if (!force && _componentHasRealIngredients(compIdx)) {
      UI.toast('A base já tem ingredientes nesta receita. Mantive a edição manual.', 'info');
      _updateFichaCost();
      return;
    }
    var container = document.getElementById('fc-comp-ings-' + compIdx);
    if (!container) {
      _updateFichaCost();
      return;
    }
    container.innerHTML = templateIngredients.map(function (ing) {
      var idx = window._fichaIngCount || 0;
      window._fichaIngCount = idx + 1;
      return _fichaIngRow(idx, compIdx, ing.insumoId, ing.qty, { stageManaged: true });
    }).join('');
    _updateFichaCost();
  }

  function _recipeComponentSharedBaseId(name, componentId) {
    var id = String(componentId || '').trim();
    if (id.indexOf('base_component:') === 0) return id;
    if (id) return 'base_component:' + id;
    var slug = String(name || 'base').trim().toLowerCase();
    if (slug.normalize) slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    slug = slug.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'base';
    return 'base_name:' + slug;
  }

  function _recipeCategoryNames(selected) {
    var seen = {};
    var names = [];
    (_recipeCategories || []).forEach(function (c) {
      var name = (c.name || c.label || '').trim();
      var key = name.toLowerCase();
      if (!name || seen[key]) return;
      seen[key] = true;
      names.push(name);
    });
    if (selected && !seen[String(selected).toLowerCase()]) names.unshift(selected);
    return names;
  }

  function _recipeCategoryOptionsHtml(selected) {
    return _recipeCategoryNames(selected).map(function (name) {
      return '<option value="' + _esc(name) + '"' + (name === selected ? ' selected' : '') + '>' + _esc(name) + '</option>';
    }).join('');
  }

  function _recipeComponentOptionsHtml(selected) {
    var names = _recipeComponentNames(selected);
    if (!names.length) {
      return '<option value="">Cadastre bases em Produção > Bases de produção</option>';
    }
    return '<option value="">Selecionar base...</option>' + names.map(function (name) {
      return '<option value="' + _esc(name) + '"' + (name === selected ? ' selected' : '') + '>' + _esc(name) + '</option>';
    }).join('');
  }

  function _recipeUnitOptionsHtml(selected) {
    var fallback = [
      { name: 'Quilograma', symbol: 'kg' },
      { name: 'Grama', symbol: 'g' },
      { name: 'Litro', symbol: 'L' },
      { name: 'Mililitro', symbol: 'ml' },
      { name: 'Unidade', symbol: 'unidade' }
    ];
    var units = (_recipeUnits && _recipeUnits.length ? _recipeUnits : fallback).slice().sort(function (a, b) {
      return String(a.name || a.label || a.symbol || '').localeCompare(String(b.name || b.label || b.symbol || ''));
    });
    var seen = {};
    var options = units.map(function (u) {
      var value = String(u.symbol || u.value || u.name || '').trim();
      if (!value) return '';
      var key = value.toLowerCase();
      if (seen[key]) return '';
      seen[key] = true;
      var label = String(u.name || u.label || value).trim();
      var text = label && label !== value ? label + ' (' + value + ')' : value;
      return '<option value="' + _esc(value) + '"' + (String(selected || '') === value ? ' selected' : '') + '>' + _esc(text) + '</option>';
    }).filter(Boolean).join('');
    if (selected && !seen[String(selected).toLowerCase()]) {
      options = '<option value="' + _esc(selected) + '" selected>' + _esc(selected) + '</option>' + options;
    }
    return '<option value="">Selecionar...</option>' + options;
  }

  function _defaultRecipeComponentName() {
    var first = (_recipeComponents || []).find(function (c) { return (c.name || c.label || '').trim(); });
    return first ? (first.name || first.label || '').trim() : '';
  }

  function _toggleFichaYieldHelp() {
    var el = document.getElementById('fc-yield-help');
    if (!el) return;
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }

  function _toggleFichaIngredientsHelp() {
    var el = document.getElementById('fc-ingredients-help');
    if (!el) return;
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }

  function _toggleFichaPackagingHelp() {
    var el = document.getElementById('fc-packaging-help');
    if (!el) return;
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }

  function _recipeQuickCreateCss() {
    return '<style>' +
      '.recipe-quick-modal{font-family:Manrope,Inter,sans-serif;}' +
      '.recipe-quick-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:14px;box-shadow:0 10px 24px rgba(31,31,31,.04);}' +
      '.recipe-quick-field label{display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;letter-spacing:.02em;}' +
      '.recipe-quick-field input{width:100%;height:40px;border:1px solid #E8DCD7;border-radius:12px;padding:0 11px;font-size:14px;font-family:inherit;outline:none;background:#FFFCF8;color:#1F1F1F;box-sizing:border-box;}' +
      '.recipe-quick-field input:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.recipe-quick-hint{font-size:12px;line-height:1.45;color:#6F6860;margin-top:9px;}' +
      '</style>';
  }

  function _openRecipeCategoryCreateModal() {
    var body = _recipeQuickCreateCss() +
      '<div class="recipe-quick-modal"><div class="recipe-quick-card">' +
        '<div class="recipe-quick-field"><label>Nome da categoria *</label><input id="recipe-new-category-name" type="text" placeholder="Ex.: Massas, Recheios ou Doces"></div>' +
        '<div class="recipe-quick-hint">Use uma categoria simples para encontrar receitas parecidas depois.</div>' +
      '</div></div>';
    var footer = '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
      '<button type="button" onclick="window._recipeCategoryModal&&window._recipeCategoryModal.close()" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid #E6E1D8;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Cancelar</button>' +
      '<button type="button" onclick="Modules.Catalogo._saveRecipeCategoryFromModal()" style="height:38px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Adicionar categoria</button>' +
      '</div>';
    window._recipeCategoryModal = UI.modal({ title: 'Nova categoria de receita', body: body, footer: footer, maxWidth: '560px' });
    setTimeout(function () { var el = document.getElementById('recipe-new-category-name'); if (el) el.focus(); }, 80);
  }

  function _saveRecipeCategoryFromModal() {
    var name = ((document.getElementById('recipe-new-category-name') || {}).value || '').trim().replace(/\s+/g, ' ');
    if (!name) { UI.toast('Nome obrigatório', 'error'); return; }
    var existing = (_recipeCategories || []).find(function (c) {
      return String(c.name || c.label || '').trim().toLowerCase() === name.toLowerCase();
    });
    if (existing) {
      _selectRecipeCategory(existing.name || existing.label || name);
      if (window._recipeCategoryModal) window._recipeCategoryModal.close();
      UI.toast('Categoria selecionada.', 'success');
      return;
    }
    var id = _newEntityId('recipe-cat');
    var data = { id: id, name: name, label: name, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    DB.set('recipe_categories', id, data).then(function () {
      return DB.getAll('recipe_categories');
    }).then(function (rows) {
      _recipeCategories = rows || [];
      _selectRecipeCategory(name);
      if (window._recipeCategoryModal) window._recipeCategoryModal.close();
      UI.toast('Categoria cadastrada!', 'success');
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _selectRecipeCategory(name) {
    var select = document.getElementById('fc-category');
    if (!select) return;
    select.innerHTML = '<option value="">Selecionar...</option>' + _recipeCategoryOptionsHtml(name);
    select.value = name;
  }

  function _openRecipeComponentCreateModal(compIdx) {
    window._recipeComponentTargetIdx = compIdx;
    var body = _recipeQuickCreateCss() +
      '<div class="recipe-quick-modal"><div class="recipe-quick-card">' +
        '<div class="recipe-quick-field"><label>Nome da base *</label><input id="recipe-new-component-name" type="text" placeholder="Ex.: Recheio de frango"></div>' +
        '<div class="recipe-quick-hint">Crie uma nova base só quando ela ainda não existe. Se for a mesma massa, recheio, creme ou molho usado em outra receita, escolha a base já cadastrada.</div>' +
      '</div></div>';
    var footer = '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
      '<button type="button" onclick="window._recipeComponentModal&&window._recipeComponentModal.close()" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid #E6E1D8;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Cancelar</button>' +
      '<button type="button" onclick="Modules.Catalogo._saveRecipeComponentFromModal()" style="height:38px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Adicionar base</button>' +
      '</div>';
    window._recipeComponentModal = UI.modal({ title: 'Nova base de produção', body: body, footer: footer, maxWidth: '560px' });
    setTimeout(function () { var el = document.getElementById('recipe-new-component-name'); if (el) el.focus(); }, 80);
  }

  function _saveRecipeComponentFromModal() {
    var name = ((document.getElementById('recipe-new-component-name') || {}).value || '').trim().replace(/\s+/g, ' ');
    if (!name) { UI.toast('Nome obrigatório', 'error'); return; }
    var existing = (_recipeComponents || []).find(function (c) {
      return String(c.name || c.label || '').trim().toLowerCase() === name.toLowerCase();
    });
    if (existing) {
      _refreshRecipeComponentSelects(existing.name || existing.label || name, window._recipeComponentTargetIdx);
      if (window._recipeComponentModal) window._recipeComponentModal.close();
      UI.toast('Base selecionada.', 'success');
      return;
    }
    var id = _newEntityId('recipe-comp');
    var data = { id: id, name: name, label: name, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    DB.set('recipe_components', id, data).then(function () {
      return DB.getAll('recipe_components');
    }).then(function (rows) {
      _recipeComponents = rows || [];
      _refreshRecipeComponentSelects(name, window._recipeComponentTargetIdx);
      if (window._recipeComponentModal) window._recipeComponentModal.close();
      UI.toast('Base cadastrada!', 'success');
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _refreshRecipeComponentSelects(selectedName, targetIdx) {
    var selects = [].slice.call(document.querySelectorAll('[data-comp-name]'));
    selects.forEach(function (select) {
      var current = select.value || '';
      var compIdx = select.getAttribute('data-comp-name');
      var nextValue = String(compIdx) === String(targetIdx) ? selectedName : current;
      select.innerHTML = _recipeComponentOptionsHtml(nextValue);
      select.value = nextValue;
    });
    if (targetIdx != null && targetIdx !== undefined) _applyRecipeComponentTemplate(targetIdx, false);
    else _updateFichaCost();
  }

  function _fichaComponentHtml(compIdx, comp) {
    comp = comp || { name: _defaultRecipeComponentName(), note: '', ingredients: [] };
    var hasStageTemplate = !!_recipeComponentByName((comp.name || '').trim());
    var rows = (comp.ingredients || []).map(function (ing) {
      var idx = window._fichaIngCount || 0;
      window._fichaIngCount = idx + 1;
      return _fichaIngRow(idx, compIdx, ing.insumoId, ing.rawQty || ing.qty || 0, { stageManaged: hasStageTemplate || ing.stageManaged || ing.stageUsageRatio > 0 });
    }).join('');
    if (!rows) {
      var blankIdx = window._fichaIngCount || 0;
      window._fichaIngCount = blankIdx + 1;
      rows = _fichaIngRow(blankIdx, compIdx, '', 0);
    }
    var usageQty = comp.stageUsageQuantity != null ? comp.stageUsageQuantity : comp.usageQuantity != null ? comp.usageQuantity : comp.quantityPerUnit != null ? comp.quantityPerUnit : comp.baseUsageQuantity != null ? comp.baseUsageQuantity : (comp.stageYieldQuantity || comp.baseYieldQuantity || comp.stockYieldQuantity || '');
    var componentDefaults = _recipeComponentStageDefaults((comp.name || '').trim());
    var lockedUsageUnit = componentDefaults.stageYieldUnit || '';
    var usageUnit = lockedUsageUnit || comp.stageUsageUnit || comp.usageUnit || comp.unitPerUnit || comp.baseUsageUnit || comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || '';
    return '<div id="fc-comp-' + compIdx + '" class="fc-component recipe-component" data-comp-idx="' + compIdx + '">' +
      '<div class="recipe-stage-guidance"><strong>Escolha uma base já cadastrada.</strong> Se essa mesma base aparece em outras receitas, use exatamente a mesma base para manter a produção conectada.</div>' +
      '<div class="recipe-component-head">' +
      '<div><div class="recipe-inline-label"><label style="' + _fichaLbl() + 'margin-bottom:0;">Base reutilizável *</label><button type="button" class="recipe-inline-add" onclick="Modules.Catalogo._openRecipeComponentCreateModal(' + compIdx + ')">+ base</button></div><div class="supplier-field-control"><select data-comp-name="' + compIdx + '" onchange="Modules.Catalogo._applyRecipeComponentTemplate(' + compIdx + ', false)">' + _recipeComponentOptionsHtml((comp.name || '').trim()) + '</select></div><div class="recipe-component-hint">Exemplo: Recheio de frango, Massa de coxinha, Creme branco ou Molho especial.</div></div>' +
      '<div><label style="' + _fichaLbl() + '">Anotação desta receita</label><div class="supplier-field-control"><input data-comp-note="' + compIdx + '" value="' + _esc(comp.note || '') + '" placeholder="Ex: usar fria ou bater antes de misturar"></div><div class="recipe-component-hint">Use só para orientação desta receita. Não altera a base reaproveitada.</div></div>' +
      '<button type="button" onclick="Modules.Catalogo._removeFichaComponent(' + compIdx + ')" title="Remover base desta receita" style="width:34px;height:34px;border-radius:9px;border:1px solid #E6E1D8;background:#fff;color:#B42318;cursor:pointer;font-size:14px;box-shadow:0 1px 2px rgba(31,31,31,.03);">✕</button>' +
      '</div>' +
      '<div class="recipe-component-base">' +
        '<label><input type="checkbox" data-comp-stock="' + compIdx + '"' + (comp.stockControl || comp.controlsStock ? ' checked' : '') + ' style="accent-color:#B42318;width:15px;height:15px;"> Controlar como base produzida antes</label>' +
        '<div><label style="' + _fichaLbl() + '">Qtd. usada por unidade</label><div class="supplier-field-control"><input type="text" data-comp-stock-qty="' + compIdx + '" value="' + _esc(usageQty) + '" placeholder="Ex: 80" oninput="Modules.Catalogo._updateFichaCost()"></div></div>' +
        '<div><label style="' + _fichaLbl() + '">Unidade</label><div class="supplier-field-control"><select data-comp-stock-unit="' + compIdx + '" onchange="Modules.Catalogo._updateFichaCost()" ' + (lockedUsageUnit ? 'disabled aria-readonly="true"' : '') + '>' + _recipeUnitOptionsHtml(usageUnit) + '</select></div></div>' +
        '<div class="recipe-base-copy"><strong style="color:#1F1F1F;">Marque apenas se essa base vira estoque próprio.</strong> Exemplo: cadastre a base Recheio de frango com rendimento próprio e, nesta ficha, informe 80 g no pastel ou 50 g na coxinha. A venda baixa essa quantidade da base pronta.</div>' +
      '</div>' +
      '<div id="fc-comp-ings-' + compIdx + '" style="display:flex;flex-direction:column;gap:8px;">' + rows + '</div>' +
      '<button type="button" onclick="Modules.Catalogo._addFichaIng(' + compIdx + ')" class="recipe-dashed-btn">+ Adicionar ingrediente nesta base</button>' +
      '</div>';
  }

  function _fichaIngRow(idx, compIdx, selectedId, qty, options) {
    options = options || {};
    var ins = selectedId ? _itensCusto.find(function (i) { return i.id === selectedId; }) : null;
    var unidade = ins ? (ins.unidade_base || 'un') : '—';
    var rawQty = _parseFichaNum(qty || 0);
    var ratioInfo = options.stageManaged ? _modalComponentUsageRatio(compIdx) : { ratio: 1 };
    var displayQty = options.stageManaged ? rawQty * (_parseFichaNum(ratioInfo.ratio) || 1) : rawQty;
    var calc = _calcFichaIng(ins, rawQty);
    var perda = calc.lossPercent;
    var costVal = calc.totalCost * (_parseFichaNum(ratioInfo.ratio) || 1);
    var perdaHtml = perda > 0
      ? '<span style="background:#FFF7ED;color:#D97706;padding:2px 7px;border-radius:12px;font-size:11px;font-weight:700;">' + perda + '%</span>'
      : '<span style="color:#D4C8C6;font-size:11px;">—</span>';
    var costHtml = costVal > 0 ? _fmtFichaMoney(costVal) : '—';
    var displayAttrs = options.stageManaged
      ? 'readonly aria-readonly="true" title="Ingrediente herdado da base de produção."'
      : 'oninput="Modules.Catalogo._filterFichaIngredientOptions(\'' + idx + '\', this.value)" onfocus="Modules.Catalogo._filterFichaIngredientOptions(\'' + idx + '\', this.value)" onblur="setTimeout(function(){var d=document.getElementById(\'fc-ing-dropdown-' + idx + '\');if(d)d.style.display=\'none\';},180)"';
    var removeHtml = options.stageManaged
      ? '<span style="display:inline-flex;width:26px;height:26px;align-items:center;justify-content:center;color:#D4C8C6;font-size:12px;">—</span>'
      : '<button type="button" onclick="Modules.Catalogo._removeFichaIng(' + idx + ')" style="width:26px;height:26px;border-radius:7px;border:1px solid #E6E1D8;background:#fff;color:#B42318;cursor:pointer;font-size:12px;box-shadow:0 1px 2px rgba(31,31,31,.03);">✕</button>';

    return '<div id="fc-ing-' + idx + '" class="recipe-ingredient-row" data-comp-row="' + compIdx + '">' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Ingrediente</div>' +
      '<div class="recipe-ingredient-picker">' +
        '<div class="supplier-field-control"><input id="fc-ing-display-' + idx + '" type="text" autocomplete="off" value="' + _esc(_fichaIngredientDisplayName(ins)) + '" placeholder="Buscar ingrediente..." ' + displayAttrs + '></div>' +
        '<input type="hidden" data-ing-idx="' + idx + '" value="' + _esc(selectedId || '') + '">' +
        (options.stageManaged ? '<input type="hidden" data-ing-raw-qty="' + idx + '" value="' + _esc(rawQty || '') + '">' : '') +
        '<div id="fc-ing-dropdown-' + idx + '" class="recipe-ingredient-dropdown"></div>' +
      '</div></div>' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Quantidade</div>' +
      '<div class="supplier-field-control"><input type="text" data-ing-qty="' + idx + '" value="' + _esc(_displayFichaQty(displayQty)) + '" placeholder="0" ' + (options.stageManaged ? 'readonly aria-readonly="true" title="Calculada pela quantidade usada da base nesta ficha."' : 'oninput="Modules.Catalogo._updateFichaCost()"') + '></div></div>' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Unidade</div><div id="fc-ing-unit-' + idx + '" style="font-size:12px;color:#1F1F1F;font-weight:600;">' + _esc(unidade) + '</div></div>' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Perda</div><div id="fc-ing-loss-' + idx + '" style="white-space:nowrap;">' + perdaHtml + '</div></div>' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Custo</div><div id="fc-ing-cost-' + idx + '" style="font-size:12px;color:#1F1F1F;font-weight:600;white-space:nowrap;">' + costHtml + '</div></div>' +
      '<div style="text-align:right;">' + removeHtml + '</div>' +
      '</div>';
  }

  function _onFichaIngChange(idx) {
    var sel = document.querySelector('[data-ing-idx="' + idx + '"]');
    if (!sel) return;
    var insId = sel.value;
    var ins = insId ? _itensCusto.find(function (i) { return i.id === insId; }) : null;
    var unidade = ins ? (ins.unidade_base || 'un') : '—';
    var perda = _insLossPercent(ins);
    var unitEl = document.getElementById('fc-ing-unit-' + idx);
    var lossEl = document.getElementById('fc-ing-loss-' + idx);
    if (unitEl) unitEl.textContent = unidade;
    if (lossEl) lossEl.innerHTML = perda > 0
      ? '<span style="background:#FFF7ED;color:#D97706;padding:2px 7px;border-radius:12px;font-size:11px;font-weight:700;">' + perda + '%</span>'
      : '<span style="color:#D4C8C6;font-size:11px;">—</span>';
    if (ins && !ins.custo_atual) {
      UI.toast('⚠️ ' + _esc(ins.nome || 'Ingrediente') + ' não tem preço cadastrado. Custo pode ficar incorreto.', 'warning');
    }
    _updateFichaCost();
  }

  function _fichaIngredientDisplayName(ins) {
    if (!ins) return '';
    var name = ins.nome || ins.name || '';
    var unit = ins.unidade_base || ins.unidadeBase || '';
    return name ? (name + (unit ? ' (' + unit + ')' : '')) : '';
  }

  function _fichaIngredientMeta(ins) {
    if (!ins) return '';
    var unit = ins.unidade_base || ins.unidadeBase || '';
    var cls = _isPackagingItem(ins) ? 'Embalagem' : 'Ingrediente';
    var cost = ins.custo_atual ? _fmtFichaMoney(ins.custo_atual) + (unit ? '/' + unit : '') : 'sem custo';
    return [cls, ins.categoria || '', unit ? 'Unidade: ' + unit : '', cost].filter(Boolean).join(' · ');
  }

  function _filterFichaIngredientOptions(idx, query) {
    var hidden = document.querySelector('[data-ing-idx="' + idx + '"]');
    var dropdown = document.getElementById('fc-ing-dropdown-' + idx);
    if (!hidden || !dropdown) return;
    var current = hidden.value || '';
    var q = String(query || '').trim().toLowerCase();
    var matches = _itensCusto.filter(function (ins) {
      if (_isPackagingItem(ins) && String(ins.id) !== current) return false;
      var hay = [ins.nome, ins.name, ins.categoria, ins.unidade_base, ins.unidadeBase].join(' ').toLowerCase();
      return !q || hay.indexOf(q) >= 0 || String(ins.id) === current;
    }).slice(0, 30);
    dropdown.innerHTML = matches.length ? matches.map(function (ins) {
      return '<div class="recipe-ingredient-option" onmousedown="Modules.Catalogo._selectFichaIngredient(\'' + idx + '\',\'' + _esc(ins.id) + '\')">' +
        '<div class="recipe-ingredient-option-name">' + _esc(ins.nome || ins.name || 'Ingrediente') + '</div>' +
        '<div class="recipe-ingredient-option-meta">' + _esc(_fichaIngredientMeta(ins)) + '</div>' +
      '</div>';
    }).join('') : '<div class="recipe-ingredient-option"><div class="recipe-ingredient-option-name">Nenhum ingrediente encontrado</div><div class="recipe-ingredient-option-meta">Cadastre o item em Compras > Ingredientes, Embalagens e Produtos.</div></div>';
    dropdown.style.display = 'block';
  }

  function _selectFichaIngredient(idx, id) {
    var hidden = document.querySelector('[data-ing-idx="' + idx + '"]');
    var display = document.getElementById('fc-ing-display-' + idx);
    var dropdown = document.getElementById('fc-ing-dropdown-' + idx);
    var ins = _itensCusto.find(function (i) { return String(i.id) === String(id); });
    if (hidden) hidden.value = id || '';
    if (display) display.value = _fichaIngredientDisplayName(ins);
    if (dropdown) dropdown.style.display = 'none';
    _onFichaIngChange(idx);
  }

  function _fichaPackagingRow(idx, selectedId, qty) {
    var item = selectedId ? _itensCusto.find(function (i) { return String(i.id) === String(selectedId); }) : null;
    var unidade = item ? (item.unidade_base || 'un') : '—';
    var calc = _calcFichaIng(item, qty);
    var costHtml = calc.totalCost > 0 ? _fmtFichaMoney(calc.totalCost) : '—';
    return '<div id="fc-pkg-' + idx + '" class="recipe-packaging-row">' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Embalagem</div>' +
      '<div class="recipe-ingredient-picker">' +
        '<div class="supplier-field-control"><input id="fc-pkg-display-' + idx + '" type="text" autocomplete="off" value="' + _esc(_fichaIngredientDisplayName(item)) + '" placeholder="Buscar embalagem..." oninput="Modules.Catalogo._filterFichaPackagingOptions(\'' + idx + '\', this.value)" onfocus="Modules.Catalogo._filterFichaPackagingOptions(\'' + idx + '\', this.value)" onblur="setTimeout(function(){var d=document.getElementById(\'fc-pkg-dropdown-' + idx + '\');if(d)d.style.display=\'none\';},180)"></div>' +
        '<input type="hidden" data-pkg-idx="' + idx + '" value="' + _esc(selectedId || '') + '">' +
        '<div id="fc-pkg-dropdown-' + idx + '" class="recipe-ingredient-dropdown"></div>' +
      '</div></div>' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Qtd. no rendimento</div>' +
      '<div class="supplier-field-control"><input type="text" data-pkg-qty="' + idx + '" value="' + (qty || '') + '" placeholder="Ex: 15" oninput="Modules.Catalogo._updateFichaCost()"></div></div>' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Unidade</div><div id="fc-pkg-unit-' + idx + '" style="font-size:12px;color:#1F1F1F;font-weight:600;">' + _esc(unidade) + '</div></div>' +
      '<div><div style="font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Custo</div><div id="fc-pkg-cost-' + idx + '" style="font-size:12px;color:#1F1F1F;font-weight:600;white-space:nowrap;">' + costHtml + '</div></div>' +
      '<div style="text-align:right;"><button type="button" onclick="Modules.Catalogo._removeFichaPackaging(' + idx + ')" style="width:26px;height:26px;border-radius:7px;border:1px solid #E6E1D8;background:#fff;color:#B42318;cursor:pointer;font-size:12px;box-shadow:0 1px 2px rgba(31,31,31,.03);">✕</button></div>' +
      '</div>';
  }

  function _filterFichaPackagingOptions(idx, query) {
    var hidden = document.querySelector('[data-pkg-idx="' + idx + '"]');
    var dropdown = document.getElementById('fc-pkg-dropdown-' + idx);
    if (!hidden || !dropdown) return;
    var current = hidden.value || '';
    var q = String(query || '').trim().toLowerCase();
    var matches = _itensCusto.filter(function (item) {
      if (!_isPackagingItem(item)) return false;
      var hay = [item.nome, item.name, item.categoria, item.unidade_base, item.unidadeBase].join(' ').toLowerCase();
      return !q || hay.indexOf(q) >= 0 || String(item.id) === current;
    }).slice(0, 30);
    dropdown.innerHTML = matches.length ? matches.map(function (item) {
      return '<div class="recipe-ingredient-option" onmousedown="Modules.Catalogo._selectFichaPackaging(\'' + idx + '\',\'' + _esc(item.id) + '\')">' +
        '<div class="recipe-ingredient-option-name">' + _esc(item.nome || item.name || 'Embalagem') + '</div>' +
        '<div class="recipe-ingredient-option-meta">' + _esc(_fichaIngredientMeta(item)) + '</div>' +
      '</div>';
    }).join('') : '<div class="recipe-ingredient-option"><div class="recipe-ingredient-option-name">Nenhuma embalagem encontrada</div><div class="recipe-ingredient-option-meta">Cadastre a embalagem em Compras > Ingredientes, Embalagens e Produtos.</div></div>';
    dropdown.style.display = 'block';
  }

  function _selectFichaPackaging(idx, id) {
    var hidden = document.querySelector('[data-pkg-idx="' + idx + '"]');
    var display = document.getElementById('fc-pkg-display-' + idx);
    var dropdown = document.getElementById('fc-pkg-dropdown-' + idx);
    var item = _itensCusto.find(function (i) { return String(i.id) === String(id); });
    if (hidden) hidden.value = id || '';
    if (display) display.value = _fichaIngredientDisplayName(item);
    if (dropdown) dropdown.style.display = 'none';
    _onFichaPackagingChange(idx);
  }

  function _onFichaPackagingChange(idx) {
    var hidden = document.querySelector('[data-pkg-idx="' + idx + '"]');
    if (!hidden) return;
    var item = hidden.value ? _itensCusto.find(function (i) { return String(i.id) === String(hidden.value); }) : null;
    var unitEl = document.getElementById('fc-pkg-unit-' + idx);
    if (unitEl) unitEl.textContent = item ? (item.unidade_base || 'un') : '—';
    if (item && !item.custo_atual) UI.toast('⚠️ ' + _esc(item.nome || 'Embalagem') + ' não tem preço cadastrado. Custo pode ficar incorreto.', 'warning');
    _updateFichaCost();
  }

  function _addFichaPackaging() {
    var container = document.getElementById('fc-packaging-list');
    if (!container) return;
    var idx = window._fichaPkgCount || 0;
    window._fichaPkgCount = idx + 1;
    container.insertAdjacentHTML('beforeend', _fichaPackagingRow(idx, '', ''));
    _updateFichaCost();
  }

  function _removeFichaPackaging(idx) {
    var el = document.getElementById('fc-pkg-' + idx);
    if (el) el.remove();
    _updateFichaCost();
  }

  function _addFichaComponent() {
    var container = document.getElementById('fc-components');
    if (!container) return;
    var compIdx = window._fichaCompCount || 0;
    window._fichaCompCount = compIdx + 1;
    container.insertAdjacentHTML('beforeend', _fichaComponentHtml(compIdx, { name: _defaultRecipeComponentName(), note: '', ingredients: [] }));
    _applyRecipeComponentTemplate(compIdx, true);
  }

  function _removeFichaComponent(compIdx) {
    var el = document.getElementById('fc-comp-' + compIdx);
    if (el) el.remove();
    _updateFichaCost();
  }

  function _addFichaIng(compIdx) {
    var container = document.getElementById('fc-comp-ings-' + compIdx);
    if (!container) return;
    var idx = window._fichaIngCount || 0;
    window._fichaIngCount = idx + 1;
    container.insertAdjacentHTML('beforeend', _fichaIngRow(idx, compIdx, '', 0));
    _updateFichaCost();
  }

  function _removeFichaIng(idx) {
    var el = document.getElementById('fc-ing-' + idx);
    if (el) el.remove();
    _updateFichaCost();
  }

  function _updateFichaCost() {
    var container = document.getElementById('fc-components');
    if (!container) return;
    var yieldQty = _parseFichaNum((document.getElementById('fc-yield-qty') || {}).value) || 1;
    var yieldUnit = ((document.getElementById('fc-yield-unit') || {}).value) || 'unidades';
    var ingredientCost = 0;
    var packagingCost = 0;
    container.querySelectorAll('.fc-component').forEach(function (compEl) {
      var compIdx = compEl.dataset.compIdx;
      var nameEl = container.querySelector('[data-comp-name="' + compIdx + '"]');
      var comp = {
        name: nameEl ? nameEl.value : '',
        stageYieldQuantity: _parseFichaNum(_recipeComponentStageDefaults(nameEl ? nameEl.value : '').stageYieldQuantity || 0),
        stageYieldUnit: ((container.querySelector('[data-comp-stock-unit="' + compIdx + '"]') || {}).value || '').trim(),
        stageUsageQuantity: _parseFichaNum((container.querySelector('[data-comp-stock-qty="' + compIdx + '"]') || {}).value),
        stageUsageUnit: ((container.querySelector('[data-comp-stock-unit="' + compIdx + '"]') || {}).value || '').trim()
      };
      var ratioInfo = _componentUsageRatio(comp, yieldQty, yieldUnit);
      compEl.querySelectorAll('[data-ing-idx]').forEach(function (sel) {
        var idx = sel.dataset.ingIdx;
        var insId = sel.value;
        var qtyEl = container.querySelector('[data-ing-qty="' + idx + '"]');
        var rawQtyEl = container.querySelector('[data-ing-raw-qty="' + idx + '"]');
        var qty = _parseFichaNum(rawQtyEl && rawQtyEl.value ? rawQtyEl.value : (qtyEl ? qtyEl.value : 0));
        var ins = insId ? _itensCusto.find(function (i) { return i.id === insId; }) : null;
        var costEl = document.getElementById('fc-ing-cost-' + idx);
        var ratio = _parseFichaNum(ratioInfo.ratio || 1) || 1;
        if (rawQtyEl && qtyEl) qtyEl.value = _displayFichaQty(qty * ratio);
        if (!ins || !qty) { if (costEl) costEl.textContent = '—'; return; }
        var calc = _calcFichaIng(ins, qty);
        var cost = calc.totalCost * ratio;
        var target = _recipeCostTarget(comp.name, ins);
        if (target === 'packaging') packagingCost += cost;
        else ingredientCost += cost;
        if (costEl) {
          costEl.textContent = cost > 0 ? _fmtFichaMoney(cost) : '—';
          costEl.title = ratioInfo.proportional ? 'Custo proporcional usado nesta receita.' : '';
        }
      });
    });
    var packagingContainer = document.getElementById('fc-packaging-list');
    (packagingContainer || document).querySelectorAll('[data-pkg-idx]').forEach(function (hidden) {
      var idx = hidden.dataset.pkgIdx;
      var itemId = hidden.value;
      var qtyEl = (packagingContainer || document).querySelector('[data-pkg-qty="' + idx + '"]');
      var qty = _parseFichaNum(qtyEl ? qtyEl.value : 0);
      var item = itemId ? _itensCusto.find(function (i) { return String(i.id) === String(itemId); }) : null;
      var costEl = document.getElementById('fc-pkg-cost-' + idx);
      if (!item || !qty) { if (costEl) costEl.textContent = '—'; return; }
      var calc = _calcFichaIng(item, qty);
      packagingCost += calc.totalCost;
      if (costEl) costEl.textContent = calc.totalCost > 0 ? _fmtFichaMoney(calc.totalCost) : '—';
    });

    var directCost = ingredientCost + packagingCost;
    var indirectInfo = _getIndirectCostInfo();
    var indirect = directCost * (indirectInfo.percent / 100);
    var total = directCost + indirect;
    var costPerUnit = yieldQty > 0 ? total / yieldQty : 0;

    var totalEl = document.getElementById('fc-cost-total');
    var ingredientsEl = document.getElementById('fc-cost-ingredients');
    var packagingEl = document.getElementById('fc-cost-packaging');
    var directEl = document.getElementById('fc-cost-direct');
    var indirectEl = document.getElementById('fc-cost-indirect');
    var indirectPctEl = document.getElementById('fc-indirect-pct');
    var indirectModeEl = document.getElementById('fc-indirect-mode');
    var unitEl = document.getElementById('fc-cost-unit');
    var labelEl = document.getElementById('fc-cost-unit-label');
    var kgEl = document.getElementById('fc-cost-kg');
    var baseLabelEl = document.getElementById('fc-cost-base-label');

    if (ingredientsEl) ingredientsEl.textContent = _fmtFichaMoney(ingredientCost);
    if (packagingEl) packagingEl.textContent = _fmtFichaMoney(packagingCost);
    if (directEl) directEl.textContent = _fmtFichaMoney(directCost);
    if (indirectEl) indirectEl.textContent = _fmtFichaMoney(indirect);
    if (indirectPctEl) indirectPctEl.textContent = '(' + (indirectInfo.percent || 0).toFixed(2).replace('.', ',') + '%)';
    if (indirectModeEl) indirectModeEl.textContent = 'Modo: ' + indirectInfo.modeUsed + (indirectInfo.fallback ? ' (fallback)' : '');
    if (totalEl) totalEl.textContent = _fmtFichaMoney(total);
    if (unitEl) unitEl.textContent = _fmtFichaMoney(costPerUnit);
    if (labelEl) labelEl.textContent = _recipeResultUnitLabel(yieldUnit);

    var unitWeightG = _parseFichaNum((document.getElementById('fc-unit-weight') || {}).value);
    var perBase = _recipeCostPerBaseUnit(total, yieldQty, yieldUnit, unitWeightG);
    if (baseLabelEl) baseLabelEl.textContent = perBase.label || 'kg / L';

    if (kgEl) {
      if (perBase.value > 0) {
        kgEl.textContent = _fmtFichaMoney(perBase.value);
      } else {
        kgEl.textContent = '—';
      }
    }
  }

  function _updateFichaPesoTotal() {
    var qty = _parseFichaNum((document.getElementById('fc-yield-qty') || {}).value);
    var unitWeight = _parseFichaNum((document.getElementById('fc-unit-weight') || {}).value);
    var pesoEl = document.getElementById('fc-peso-total');
    if (pesoEl) {
      if (qty > 0 && unitWeight > 0) {
        var t = qty * unitWeight;
        pesoEl.value = t >= 1000 ? (t / 1000).toFixed(2) + ' kg' : t.toFixed(0) + ' g';
      } else {
        pesoEl.value = '';
      }
    }
    _updateFichaCost();
  }

  function _onYieldUnitChange() {
    var unit = ((document.getElementById('fc-yield-unit') || {}).value) || 'unidades';
    var pesoSection = document.getElementById('fc-peso-section');
    if (pesoSection) pesoSection.style.display = (unit === 'unidades' || unit === 'porções') ? 'grid' : 'none';
    _updateFichaCost();
  }

  function _onFichaImgChange(event) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    var draftId = window._fcDraftId || _editingId || _newEntityId('receita');
    window._fcDraftId = draftId;
    ImageTools.process(file, { kind: 'product', folder: 'products', entityId: draftId }).then(function (result) {
      window._fcImageState = result;
      window._fcImageBase64 = null;
      var preview = document.getElementById('fc-img-preview');
      if (preview) { preview.src = result.imageUrl || ''; preview.style.display = 'block'; }
      UI.toast('Imagem otimizada com sucesso.', 'success');
    }).catch(function (err) {
      console.error('Imagem da receita', err);
      UI.toast(err && err.message ? err.message : 'Erro ao otimizar imagem.', 'error');
      event.target.value = '';
    });
  }

  function _saveFicha() {
    var name = ((document.getElementById('fc-name') || {}).value || '').trim();
    if (!name) { UI.toast('Nome é obrigatório', 'error'); return; }
    var yieldQty = _parseFichaNum((document.getElementById('fc-yield-qty') || {}).value) || 1;
    var yieldUnit = ((document.getElementById('fc-yield-unit') || {}).value) || 'unidades';
    var container = document.getElementById('fc-components');
    var ingredients = [];
    var packagingItems = [];
    var components = [];
    var missingComponentName = false;
    var invalidIngredientRow = false;
    var invalidPackagingRow = false;
    if (container) {
      container.querySelectorAll('.fc-component').forEach(function (compEl) {
        var compIdx = compEl.dataset.compIdx;
        var compName = ((container.querySelector('[data-comp-name="' + compIdx + '"]') || {}).value || '').trim();
        var compRef = _recipeComponentByName(compName);
        var compRefId = compRef ? String(compRef.id || '') : '';
        var compNote = ((container.querySelector('[data-comp-note="' + compIdx + '"]') || {}).value || '').trim();
        var compStockControl = !!((container.querySelector('[data-comp-stock="' + compIdx + '"]') || {}).checked);
        var compUsageQuantity = _parseFichaNum((container.querySelector('[data-comp-stock-qty="' + compIdx + '"]') || {}).value);
        var stageDefaults = _recipeComponentStageDefaults(compName);
        var compUsageUnit = (stageDefaults.stageYieldUnit || ((container.querySelector('[data-comp-stock-unit="' + compIdx + '"]') || {}).value || '')).trim();
        var compBaseYieldQuantity = _parseFichaNum(stageDefaults.stageYieldQuantity || compUsageQuantity);
        var compBaseYieldUnit = stageDefaults.stageYieldUnit || compUsageUnit;
        var compIngredients = [];
        compEl.querySelectorAll('[data-ing-idx]').forEach(function (sel) {
          var idx = sel.dataset.ingIdx;
          var insumoId = sel.value;
          var qtyEl = container.querySelector('[data-ing-qty="' + idx + '"]');
          var rawQtyEl = container.querySelector('[data-ing-raw-qty="' + idx + '"]');
          var qty = _parseFichaNum(rawQtyEl && rawQtyEl.value ? rawQtyEl.value : (qtyEl ? qtyEl.value : 0));
          if (!insumoId && qty > 0) { invalidIngredientRow = true; return; }
          if (insumoId && qty <= 0) { invalidIngredientRow = true; return; }
          if (!insumoId) return;
          var ins = _itensCusto.find(function (i) { return i.id === insumoId; });
          var calc = _calcFichaIng(ins, qty);
          var itemClass = ins ? (ins.classe || ins.itemClass || '') : '';
          var ingData = {
            insumoId: insumoId,
            supplyName: ins ? ins.nome : '',
            itemClass: itemClass || 'insumo',
            classe: itemClass || 'insumo',
            costType: itemClass === 'embalagem' ? 'embalagem' : 'insumo',
            qty: qty,
            unit: ins ? (ins.unidade_base || '') : '',
            lossPercent: calc.lossPercent,
            grossQuantityCalculated: calc.grossQuantity,
            unitCost: _roundFichaCost(calc.unitCost, 6),
            totalCost: _roundFichaCost(calc.totalCost, 4),
            rawQty: qty,
            rawGrossQuantity: calc.grossQuantity,
            rawTotalCost: _roundFichaCost(calc.totalCost, 4)
          };
          compIngredients.push(ingData);
        });
        if (compIngredients.length) {
          if (!compName) missingComponentName = true;
          var compRatio = _componentUsageRatio({
            stageYieldQuantity: compBaseYieldQuantity,
            stageYieldUnit: compBaseYieldUnit,
            stageUsageQuantity: compUsageQuantity,
            stageUsageUnit: compUsageUnit
          }, yieldQty, yieldUnit);
          var compRawCost = compIngredients.reduce(function (sum, ing) { return sum + _parseFichaNum(ing.totalCost); }, 0);
          components.push({
            name: compName,
            componentId: compRefId,
            recipeComponentId: compRefId,
            sharedBaseId: compStockControl ? _recipeComponentSharedBaseId(compName, compRefId) : '',
            note: compNote,
            ingredients: compIngredients.map(function (ing) {
              return Object.assign({}, ing, {
                stageUsageRatio: compRatio.ratio,
                appliedQty: _parseFichaNum(ing.qty) * compRatio.ratio,
                appliedGrossQuantity: _parseFichaNum(ing.grossQuantityCalculated) * compRatio.ratio,
                appliedTotalCost: _parseFichaNum(ing.totalCost) * compRatio.ratio,
                recipeYieldQuantity: yieldQty,
                recipeYieldUnit: yieldUnit,
                stageYieldQuantity: compBaseYieldQuantity || null,
                stageYieldUnit: compBaseYieldUnit || '',
                stageUsageQuantity: compUsageQuantity || null,
                stageUsageUnit: compUsageUnit || ''
              });
            }),
            stockControl: compStockControl,
            controlsStock: compStockControl,
            stockItemType: compStockControl ? 'base_producao' : '',
            itemClass: compStockControl ? 'base_producao' : '',
            classe: compStockControl ? 'base_producao' : '',
            stageYieldQuantity: compBaseYieldQuantity || null,
            stageYieldUnit: compBaseYieldUnit || '',
            stageUsageQuantity: compUsageQuantity || null,
            stageUsageUnit: compUsageUnit || '',
            usageQuantity: compUsageQuantity || null,
            usageUnit: compUsageUnit || '',
            quantityPerUnit: compUsageQuantity || null,
            unitPerUnit: compUsageUnit || '',
            stageUsageRatio: compRatio.ratio,
            proportionalCostApplied: compRatio.proportional,
            rawCost: compRawCost,
            appliedCost: compRawCost * compRatio.ratio,
            baseYieldQuantity: compStockControl ? compBaseYieldQuantity : null,
            stockYieldQuantity: compStockControl ? compBaseYieldQuantity : null,
            baseYieldUnit: compStockControl ? compBaseYieldUnit : '',
            stockYieldUnit: compStockControl ? compBaseYieldUnit : '',
            minStock: 0,
            maxStock: 0,
            estoque_minimo: 0,
            estoque_maximo: 0
          });
        }
      });
    }
    var packagingContainer = document.getElementById('fc-packaging-list');
    (packagingContainer || document).querySelectorAll('[data-pkg-idx]').forEach(function (hidden) {
      var idx = hidden.dataset.pkgIdx;
      var itemId = hidden.value;
      var qtyEl = (packagingContainer || document).querySelector('[data-pkg-qty="' + idx + '"]');
      var qty = _parseFichaNum(qtyEl ? qtyEl.value : 0);
      if (!itemId && qty > 0) { invalidPackagingRow = true; return; }
      if (itemId && qty <= 0) { invalidPackagingRow = true; return; }
      if (!itemId) return;
      var item = _itensCusto.find(function (i) { return String(i.id) === String(itemId); });
      var calc = _calcFichaIng(item, qty);
      var packData = {
        insumoId: itemId,
        supplyName: item ? item.nome : '',
        itemClass: 'embalagem',
        classe: 'embalagem',
        costType: 'embalagem',
        qty: qty,
        unit: item ? (item.unidade_base || '') : '',
        lossPercent: calc.lossPercent,
        grossQuantityCalculated: calc.grossQuantity,
        unitCost: _roundFichaCost(calc.unitCost, 6),
        totalCost: _roundFichaCost(calc.totalCost, 4),
        rawQty: qty,
        rawGrossQuantity: calc.grossQuantity,
        rawTotalCost: _roundFichaCost(calc.totalCost, 4),
        recipeYieldQuantity: yieldQty,
        recipeYieldUnit: yieldUnit
      };
      packagingItems.push(packData);
    });
    if (missingComponentName) { UI.toast('Selecione o componente da receita', 'error'); return; }
    if (invalidIngredientRow) { UI.toast('Complete o ingrediente e a quantidade, ou remova a linha vazia.', 'error'); return; }
    if (invalidPackagingRow) { UI.toast('Complete a embalagem e a quantidade, ou remova a linha vazia.', 'error'); return; }
    components.forEach(function (comp) {
      var ratio = _parseFichaNum(comp.stageUsageRatio || 1) || 1;
      (comp.ingredients || []).forEach(function (ing) {
        ingredients.push(Object.assign({ componentName: comp.name || '' }, ing, {
          qty: _parseFichaNum(ing.qty) * ratio,
          grossQuantityCalculated: _parseFichaNum(ing.grossQuantityCalculated) * ratio,
          totalCost: _roundFichaCost(_parseFichaNum(ing.totalCost) * ratio, 4),
          rawQty: _parseFichaNum(ing.qty),
          rawGrossQuantity: _parseFichaNum(ing.grossQuantityCalculated),
          rawTotalCost: _roundFichaCost(ing.totalCost, 4)
        }));
      });
    });
    packagingItems.forEach(function (item) {
      ingredients.push(Object.assign({ componentName: 'Embalagens da receita' }, item));
    });
    if (ingredients.length === 0) { UI.toast('Adicione pelo menos 1 ingrediente ou embalagem', 'error'); return; }
    var componentCosts = _calcFichaComponentCosts(components, yieldQty, yieldUnit, packagingItems);
    var indirectCostInfo = _getIndirectCostInfo();
    var indirectCostPercent = indirectCostInfo.percent;
    var indirectCost = componentCosts.direct * (indirectCostPercent / 100);
    var totalCost = componentCosts.direct + indirectCost;
    var unitWeightG = _parseFichaNum((document.getElementById('fc-unit-weight') || {}).value);
    var minStock = _parseFichaNum((document.getElementById('fc-stock-min') || {}).value);
    var maxStock = _parseFichaNum((document.getElementById('fc-stock-max') || {}).value);
    if (minStock > 0 && maxStock > 0 && maxStock < minStock) { UI.toast('O estoque máximo não pode ser menor que o mínimo.', 'error'); return; }
    var data = {
      name: name,
      category: ((document.getElementById('fc-category') || {}).value) || '',
      recipeType: 'receita_base',
      yieldQuantity: yieldQty, yieldUnit: yieldUnit,
      unitWeightGrams: unitWeightG || null,
      totalProducedGrams: (unitWeightG && (yieldUnit === 'unidades' || yieldUnit === 'porções')) ? yieldQty * unitWeightG : null,
      components: components,
      packagingItems: packagingItems,
      packaging: packagingItems,
      ingredients: ingredients,
      ingredientCost: _roundFichaCost(componentCosts.ingredients, 4),
      packagingCost: _roundFichaCost(componentCosts.packaging, 4),
      directCost: _roundFichaCost(componentCosts.direct, 4),
      componentCostBreakdown: componentCosts.components || [],
      indirectCostModeUsed: indirectCostInfo.modeUsed,
      indirectCostModeConfigured: indirectCostInfo.configuredMode,
      indirectCostFallback: !!indirectCostInfo.fallback,
      indirectCostPercent: indirectCostPercent,
      indirectCost: _roundFichaCost(indirectCost, 4),
      totalCost: _roundFichaCost(totalCost, 4),
      costPerYield: yieldQty > 0 ? _roundFichaCost(totalCost / yieldQty, 4) : 0,
      minStock: minStock,
      maxStock: maxStock,
      estoque_minimo: minStock,
      estoque_maximo: maxStock,
      internalNotes: ((document.getElementById('fc-notes') || {}).value) || '',
      preparationMode: ((document.getElementById('fc-prep') || {}).value) || '',
      conservationType: ((document.getElementById('fc-conserv') || {}).value) || '',
      shelfLifeValue: _parseFichaNum((document.getElementById('fc-shelf-val') || {}).value) || null,
      shelfLifeUnit: ((document.getElementById('fc-shelf-unit') || {}).value) || 'dias',
      productionNotes: ((document.getElementById('fc-prod-notes') || {}).value) || '',
      updatedAt: new Date().toISOString(),
      yield: yieldQty
    };
    var imgState = window._fcImageState || null;
    if (imgState) {
      data.imageUrl = imgState.imageUrl || '';
      data.imagePath = imgState.imagePath || imgState.imageStoragePath || '';
      data.imageCardUrl = imgState.imageCardUrl || imgState.cardUrl || imgState.imageUrl || '';
      data.imageThumbUrl = imgState.imageThumbUrl || imgState.thumbUrl || imgState.imageCardUrl || imgState.imageUrl || '';
      data.imageStoragePath = imgState.imageStoragePath || '';
      data.imageWidth = imgState.imageWidth || null;
      data.imageHeight = imgState.imageHeight || null;
      data.imageSizeKb = imgState.imageSizeKb || null;
      data.imageFormat = imgState.imageFormat || 'webp';
    }
    var fichaId = _editingId || window._fcDraftId || _newEntityId('receita');
    data.id = fichaId;
    data.updatedAt = new Date().toISOString();
    if (!_editingId) {
      data.createdAt = new Date().toISOString();
      window._fcDraftId = fichaId;
    }
    var op = _editingId ? DB.update('fichasTecnicas', _editingId, data) : DB.set('fichasTecnicas', fichaId, data);
    op.then(function () {
      return _syncRecipeStockSettings(fichaId, data);
    }).then(function () {
      UI.toast('Receita salva!', 'success');
      if (window._fichaModal) window._fichaModal.close();
      _renderFichas();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _stockSettingId(key) {
    return String(key || 'item').replace(/[^\w-]/g, '_').slice(0, 140);
  }

  function _syncRecipeStockSettings(fichaId, ficha) {
    if (!fichaId) return Promise.resolve();
    var now = new Date().toISOString();
    var recipeKey = 'produto_produzido:' + fichaId;
    var productOp = DB.col('stock_settings').doc(_stockSettingId(recipeKey)).set({
      id: _stockSettingId(recipeKey),
      stockKey: recipeKey,
      itemId: fichaId,
      itemName: ficha.name || '',
      itemType: 'produto',
      stockItemType: 'produto_produzido',
      unit: ficha.yieldUnit || '',
      minStock: _parseFichaNum(ficha.minStock),
      maxStock: _parseFichaNum(ficha.maxStock),
      updatedAt: now,
      createdAt: now
    }, { merge: true });
    return DB.getAll('fichasTecnicas').catch(function () { return []; }).then(function (recipes) {
      var byId = {};
      (recipes || []).forEach(function (item) { if (item && item.id) byId[String(item.id)] = item; });
      byId[String(fichaId)] = ficha;
      var aggregate = _aggregateRecipeBaseStockSettings(Object.keys(byId).map(function (id) { return byId[id]; }));
      var ingredientAggregate = _aggregateRecipeIngredientStockSettings(aggregate);
      var ops = [productOp];
      Object.keys(aggregate).forEach(function (baseKey) {
        var item = aggregate[baseKey];
        ops.push(DB.col('stock_settings').doc(_stockSettingId(baseKey)).set({
          id: _stockSettingId(baseKey),
          stockKey: baseKey,
          itemId: item.itemId,
          itemName: item.itemName,
          itemType: 'base_producao',
          stockItemType: 'base_producao',
          sourceRecipeId: '',
          sourceRecipeName: '',
          componentId: item.componentId || '',
          sharedBaseId: item.itemId,
          unit: item.unit || '',
          minStock: _roundFichaCost(item.minStock, 4),
          maxStock: _roundFichaCost(item.maxStock, 4),
          autoCalculated: true,
          recipeBreakdown: item.recipes,
          updatedAt: now,
          createdAt: now
        }, { merge: true }));
      });
      Object.keys(ingredientAggregate).forEach(function (stockKey) {
        var item = ingredientAggregate[stockKey];
        ops.push(DB.col('stock_settings').doc(_stockSettingId(stockKey)).set({
          id: _stockSettingId(stockKey),
          stockKey: stockKey,
          itemId: item.itemId,
          itemName: item.itemName,
          itemType: item.itemType,
          stockItemType: item.stockItemType,
          unit: item.unit || '',
          suggestedMinStock: _roundFichaCost(item.minStock, 4),
          suggestedMaxStock: _roundFichaCost(item.maxStock, 4),
          autoSuggested: true,
          autoSuggestionSource: 'receitas_etapas',
          recipeBreakdown: item.recipes,
          updatedAt: now,
          createdAt: now
        }, { merge: true }));
      });
      return _removeRecipeBaseStockSettings(fichaId).then(function () {
        return _clearStaleRecipeIngredientStockSuggestions(ingredientAggregate, now);
      }).then(function () {
        return Promise.all(ops);
      });
    });
  }

  function _aggregateRecipeBaseStockSettings(recipes) {
    var map = {};
    (recipes || []).forEach(function (recipe) {
      var recipeMin = _parseFichaNum(recipe && (recipe.minStock || recipe.estoque_minimo || 0));
      var recipeMax = _parseFichaNum(recipe && (recipe.maxStock || recipe.estoque_maximo || 0));
      if (!(recipeMin > 0) && !(recipeMax > 0)) return;
      (recipe.components || []).forEach(function (comp, idx) {
        if (!comp || !(comp.stockControl || comp.controlsStock)) return;
        var usageQty = _parseFichaNum(comp.stageUsageQuantity || comp.usageQuantity || comp.quantityPerUnit || comp.baseUsageQuantity || 0);
        if (!(usageQty > 0)) return;
        var sharedBaseId = _recipeComponentSharedBaseId(comp.name || ('etapa_' + idx), comp.componentId || comp.recipeComponentId || comp.sharedBaseId || '');
        var baseKey = 'base_producao:' + sharedBaseId;
        if (!map[baseKey]) {
          map[baseKey] = {
            itemId: sharedBaseId,
            itemName: comp.name || 'Base de produção',
            componentId: comp.componentId || comp.recipeComponentId || '',
            unit: comp.stageUsageUnit || comp.usageUnit || comp.unitPerUnit || comp.baseUsageUnit || comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || '',
            minStock: 0,
            maxStock: 0,
            recipes: []
          };
        }
        var minQty = recipeMin > 0 ? recipeMin * usageQty : 0;
        var maxQty = recipeMax > 0 ? recipeMax * usageQty : 0;
        map[baseKey].minStock += minQty;
        map[baseKey].maxStock += maxQty;
        map[baseKey].recipes.push({
          recipeId: recipe.id || '',
          recipeName: recipe.name || 'Receita sem nome',
          recipeMinStock: recipeMin,
          recipeMaxStock: recipeMax,
          usageQuantity: usageQty,
          usageUnit: map[baseKey].unit,
          minStock: _roundFichaCost(minQty, 4),
          maxStock: _roundFichaCost(maxQty, 4)
        });
      });
    });
    return map;
  }

  function _aggregateRecipeIngredientStockSettings(baseAggregate) {
    var map = {};
    var componentsByKey = {};
    (_recipeComponents || []).forEach(function (comp) {
      var key = 'base_producao:' + _recipeComponentSharedBaseId(comp.name || '', comp.id || comp.componentId || comp.recipeComponentId || comp.sharedBaseId || '');
      componentsByKey[key] = comp;
    });
    Object.keys(baseAggregate || {}).forEach(function (baseKey) {
      var base = baseAggregate[baseKey] || {};
      var component = componentsByKey[baseKey] || _recipeComponentByName(base.itemName || '') || {};
      var stageYield = _parseFichaNum(component.stageYieldQuantity || component.yieldQuantity || component.baseYieldQuantity || component.stockYieldQuantity || 0);
      if (!(stageYield > 0)) return;
      (component.ingredients || []).forEach(function (ing) {
        var itemId = ing.insumoId || ing.itemId || ing.supplyId || '';
        if (!itemId) return;
        var ingQty = _parseFichaNum(ing.qty != null ? ing.qty : ing.quantity);
        if (!(ingQty > 0)) return;
        var cls = ing.itemClass || ing.classe || ing.stockItemType || 'insumo';
        var stockType = cls === 'embalagem' ? 'embalagem' : 'insumo';
        var stockKey = stockType + ':' + itemId;
        if (!map[stockKey]) {
          map[stockKey] = {
            itemId: itemId,
            itemName: ing.supplyName || ing.name || 'Ingrediente',
            itemType: stockType,
            stockItemType: stockType,
            unit: ing.unit || '',
            minStock: 0,
            maxStock: 0,
            recipes: []
          };
        }
        (base.recipes || []).forEach(function (line) {
          var minQty = _parseFichaNum(line.minStock) * ingQty / stageYield;
          var maxQty = _parseFichaNum(line.maxStock) * ingQty / stageYield;
          map[stockKey].minStock += minQty;
          map[stockKey].maxStock += maxQty;
          map[stockKey].recipes.push({
            recipeId: line.recipeId || '',
            recipeName: line.recipeName || 'Receita sem nome',
            baseName: base.itemName || '',
            baseMinStock: _parseFichaNum(line.minStock),
            baseMaxStock: _parseFichaNum(line.maxStock),
            ingredientQuantityInStage: ingQty,
            stageYieldQuantity: stageYield,
            minStock: _roundFichaCost(minQty, 4),
            maxStock: _roundFichaCost(maxQty, 4),
            unit: ing.unit || ''
          });
        });
      });
    });
    return map;
  }

  function _clearStaleRecipeIngredientStockSuggestions(validAggregate, now) {
    var validKeys = {};
    Object.keys(validAggregate || {}).forEach(function (key) { validKeys[key] = true; });
    return DB.getAll('stock_settings').catch(function () { return []; }).then(function (settings) {
      var clears = (settings || []).filter(function (setting) {
        var key = String(setting.stockKey || '');
        return setting && setting.autoSuggestionSource === 'receitas_etapas' && !validKeys[key];
      }).map(function (setting) {
        var key = String(setting.stockKey || '');
        return DB.col('stock_settings').doc(_stockSettingId(key)).set({
          id: _stockSettingId(key),
          stockKey: key,
          suggestedMinStock: 0,
          suggestedMaxStock: 0,
          autoSuggested: false,
          autoSuggestionSource: '',
          recipeBreakdown: [],
          updatedAt: now
        }, { merge: true }).catch(function () { return null; });
      });
      return Promise.all(clears);
    });
  }

  function _removeRecipeBaseStockSettings(fichaId) {
    return DB.getAll('stock_settings').catch(function () { return []; }).then(function (settings) {
      var prefix = 'base_producao:' + fichaId + ':';
      var removals = (settings || []).filter(function (setting) {
        return String(setting.stockKey || '').indexOf(prefix) === 0 || String(setting.itemId || '').indexOf(fichaId + ':') === 0;
      }).map(function (setting) {
        return DB.remove('stock_settings', setting.id).catch(function () { return null; });
      });
      return Promise.all(removals);
    });
  }

  function _removeRecipeStockSettings(fichaId) {
    return DB.getAll('stock_settings').catch(function () { return []; }).then(function (settings) {
      var productKey = 'produto_produzido:' + fichaId;
      var basePrefix = 'base_producao:' + fichaId + ':';
      var removals = (settings || []).filter(function (setting) {
        var key = String(setting.stockKey || '');
        var itemId = String(setting.itemId || '');
        return key === productKey || key.indexOf(basePrefix) === 0 || itemId === fichaId || itemId.indexOf(fichaId + ':') === 0;
      }).map(function (setting) {
        return DB.remove('stock_settings', setting.id).catch(function () { return null; });
      });
      return Promise.all(removals);
    });
  }

  function _deleteFicha(id) {
    UI.confirm('Eliminar esta receita?').then(function (yes) {
      if (!yes) return;
      DB.remove('fichasTecnicas', id).then(function () {
        return _removeRecipeStockSettings(id);
      }).then(function () { UI.toast('Eliminado', 'info'); _renderFichas(); });
    });
  }

  function _uniqueFichaName(seed) {
    var base = String(seed || 'Receita').trim() || 'Receita';
    var used = {};
    (_fichas || []).forEach(function (f) {
      var name = String(f && f.name || '').trim().toLowerCase();
      if (name) used[name] = true;
    });
    var name = base;
    var n = 2;
    while (used[String(name).toLowerCase()]) {
      name = base + ' ' + n;
      n += 1;
    }
    return name;
  }

  function _duplicateFichaIngredientsForSave(comp, yieldQty, yieldUnit) {
    var stageQty = _componentYieldQuantity(comp);
    var stageUnit = _componentYieldUnit(comp);
    var ratioInfo = _componentUsageRatio({
      stageYieldQuantity: stageQty,
      stageYieldUnit: stageUnit,
      stageUsageQuantity: _componentUsageQuantity(comp),
      stageUsageUnit: _componentUsageUnit(comp)
    }, yieldQty, yieldUnit);
    var rawCost = 0;
    var ingredients = (comp.ingredients || []).map(function (ing) {
      var ins = _itensCusto.find(function (item) { return String(item.id) === String(ing.insumoId || ing.itemId || ''); });
      var qty = _parseFichaNum(ing.rawQty || ing.qty || ing.quantity || 0);
      var calc = ins ? _calcFichaIng(ins, qty) : null;
      var unit = (ins && (ins.unidade_base || ins.unidadeBase)) || ing.unit || '';
      var gross = calc ? calc.grossQuantity : _parseFichaNum(ing.rawGrossQuantity || ing.grossQuantityCalculated || ing.grossQuantity || qty);
      var unitCost = calc ? calc.unitCost : _parseFichaNum(ing.unitCost || 0);
      var totalCost = calc ? calc.totalCost : _parseFichaNum(ing.rawTotalCost || ing.totalCost || 0);
      rawCost += totalCost;
      return {
        insumoId: ing.insumoId || ing.itemId || '',
        supplyName: (ins && ins.nome) || ing.supplyName || ing.name || '',
        itemClass: (ins && (ins.classe || ins.itemClass)) || ing.itemClass || ing.classe || 'insumo',
        classe: (ins && (ins.classe || ins.itemClass)) || ing.classe || ing.itemClass || 'insumo',
        costType: ((ins && (ins.classe || ins.itemClass)) || ing.classe || ing.itemClass) === 'embalagem' ? 'embalagem' : 'insumo',
        qty: qty,
        unit: unit,
        lossPercent: calc ? calc.lossPercent : _parseFichaNum(ing.lossPercent || 0),
        grossQuantityCalculated: gross,
        unitCost: unitCost,
        totalCost: totalCost,
        rawQty: qty,
        rawGrossQuantity: gross,
        rawTotalCost: totalCost,
        stageUsageRatio: ratioInfo.ratio,
        appliedQty: qty * ratioInfo.ratio,
        appliedGrossQuantity: gross * ratioInfo.ratio,
        appliedTotalCost: totalCost * ratioInfo.ratio,
        recipeYieldQuantity: yieldQty,
        recipeYieldUnit: yieldUnit,
        stageYieldQuantity: stageQty || null,
        stageYieldUnit: stageUnit || ''
      };
    });
    return {
      ingredients: ingredients,
      ratioInfo: ratioInfo,
      rawCost: rawCost,
      appliedCost: rawCost * ratioInfo.ratio
    };
  }

  function _duplicateFicha(id) {
    var original = (_fichas || []).find(function (f) { return String(f.id) === String(id); });
    if (!original) {
      UI.toast('Receita não encontrada.', 'error');
      return;
    }
    var source = JSON.parse(JSON.stringify(original || {}));
    var now = new Date().toISOString();
    var cloneId = _newEntityId('receita');
    var cloneName = _uniqueFichaName('Cópia de ' + String(source.name || 'Receita'));
    var yieldQty = _parseFichaNum(source.yieldQuantity || source.yield || 0) || 1;
    var yieldUnit = source.yieldUnit || 'unidades';
    var components = _normalizeFichaComponents(source).map(function (comp) {
      var built = _duplicateFichaIngredientsForSave(comp, yieldQty, yieldUnit);
      var controls = !!(comp.stockControl || comp.controlsStock);
      var compRef = _recipeComponentByName(comp.name || '');
      var compRefId = comp.componentId || comp.recipeComponentId || (compRef && compRef.id) || '';
      return {
        name: comp.name || '',
        componentId: compRefId,
        recipeComponentId: compRefId,
        sharedBaseId: controls ? _recipeComponentSharedBaseId(comp.name || '', compRefId || comp.sharedBaseId || '') : '',
        note: comp.note || '',
        ingredients: built.ingredients,
        stockControl: controls,
        controlsStock: controls,
        stockItemType: controls ? 'base_producao' : '',
        itemClass: controls ? 'base_producao' : '',
        classe: controls ? 'base_producao' : '',
        stageYieldQuantity: built.ratioInfo.stageYieldQuantity || null,
        stageYieldUnit: built.ratioInfo.stageYieldUnit || '',
        stageUsageQuantity: built.ratioInfo.stageUsageQuantity || null,
        stageUsageUnit: built.ratioInfo.stageUsageUnit || '',
        usageQuantity: built.ratioInfo.stageUsageQuantity || null,
        usageUnit: built.ratioInfo.stageUsageUnit || '',
        quantityPerUnit: built.ratioInfo.stageUsageQuantity || null,
        unitPerUnit: built.ratioInfo.stageUsageUnit || '',
        stageUsageRatio: built.ratioInfo.ratio,
        proportionalCostApplied: built.ratioInfo.proportional,
        rawCost: built.rawCost,
        appliedCost: built.appliedCost,
        baseYieldQuantity: controls ? built.ratioInfo.stageYieldQuantity : null,
        stockYieldQuantity: controls ? built.ratioInfo.stageYieldQuantity : null,
        baseYieldUnit: controls ? built.ratioInfo.stageYieldUnit : '',
        stockYieldUnit: controls ? built.ratioInfo.stageYieldUnit : '',
        minStock: controls ? _parseFichaNum(comp.minStock || comp.estoque_minimo || 0) : 0,
        maxStock: controls ? _parseFichaNum(comp.maxStock || comp.estoque_maximo || 0) : 0,
        estoque_minimo: controls ? _parseFichaNum(comp.minStock || comp.estoque_minimo || 0) : 0,
        estoque_maximo: controls ? _parseFichaNum(comp.maxStock || comp.estoque_maximo || 0) : 0
      };
    });
    var packagingItems = _normalizeFichaPackaging(source).map(function (item) {
      var ins = _itensCusto.find(function (stockItem) { return String(stockItem.id) === String(item.insumoId || item.itemId || ''); });
      var qty = _parseFichaNum(item.qty || item.quantity || 0);
      var calc = ins ? _calcFichaIng(ins, qty) : null;
      return {
        insumoId: item.insumoId || item.itemId || '',
        supplyName: (ins && ins.nome) || item.supplyName || item.name || '',
        itemClass: 'embalagem',
        classe: 'embalagem',
        costType: 'embalagem',
        qty: qty,
        unit: (ins && (ins.unidade_base || ins.unidadeBase)) || item.unit || '',
        lossPercent: calc ? calc.lossPercent : _parseFichaNum(item.lossPercent || 0),
        grossQuantityCalculated: calc ? calc.grossQuantity : _parseFichaNum(item.grossQuantityCalculated || item.grossQuantity || qty),
        unitCost: calc ? calc.unitCost : _parseFichaNum(item.unitCost || 0),
        totalCost: calc ? calc.totalCost : _parseFichaNum(item.totalCost || 0),
        rawQty: qty,
        rawGrossQuantity: calc ? calc.grossQuantity : _parseFichaNum(item.grossQuantityCalculated || item.grossQuantity || qty),
        rawTotalCost: calc ? calc.totalCost : _parseFichaNum(item.totalCost || 0),
        recipeYieldQuantity: yieldQty,
        recipeYieldUnit: yieldUnit
      };
    });
    var ingredients = [];
    components.forEach(function (comp) {
      var ratio = _parseFichaNum(comp.stageUsageRatio || 1) || 1;
      (comp.ingredients || []).forEach(function (ing) {
        ingredients.push(Object.assign({ componentName: comp.name || '' }, ing, {
          qty: _parseFichaNum(ing.qty) * ratio,
          grossQuantityCalculated: _parseFichaNum(ing.grossQuantityCalculated) * ratio,
          totalCost: _roundFichaCost(_parseFichaNum(ing.totalCost) * ratio, 4),
          rawQty: _parseFichaNum(ing.qty),
          rawGrossQuantity: _parseFichaNum(ing.grossQuantityCalculated),
          rawTotalCost: _roundFichaCost(ing.totalCost, 4)
        }));
      });
    });
    packagingItems.forEach(function (item) {
      ingredients.push(Object.assign({ componentName: 'Embalagens da receita' }, item));
    });
    var componentCosts = _calcFichaComponentCosts(components, yieldQty, yieldUnit, packagingItems);
    var indirectCostInfo = _getIndirectCostInfo();
    var indirectCostPercent = indirectCostInfo.percent;
    var indirectCost = componentCosts.direct * (indirectCostPercent / 100);
    var totalCost = componentCosts.direct + indirectCost;
    var clone = {};
    Object.keys(source).forEach(function (key) { clone[key] = source[key]; });
    [
      'id', '_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
      'imageUrl', 'imageMainUrl', 'imageCardUrl', 'cardImageUrl',
      'imageThumbUrl', 'thumbnailUrl', 'thumbUrl', 'imageBase64',
      'img', 'photoUrl', 'image', 'imagePath', 'imageStoragePath', 'storagePath',
      'imageWidth', 'imageHeight', 'imageSizeKb', 'imageFormat',
      'productId', 'produtoId', 'linkedProductId', 'linkedProductName',
      'cardapioProductId', 'menuProductId', 'sourceProductId', 'publishedProductId'
    ].forEach(function (key) { delete clone[key]; });
    clone.id = cloneId;
    clone.name = cloneName;
    clone.components = components;
    clone.packagingItems = packagingItems;
    clone.packaging = packagingItems;
    clone.ingredients = ingredients;
    clone.ingredientCost = componentCosts.ingredients;
    clone.packagingCost = componentCosts.packaging;
    clone.directCost = componentCosts.direct;
    clone.componentCostBreakdown = componentCosts.components || [];
    clone.indirectCostModeUsed = indirectCostInfo.modeUsed;
    clone.indirectCostModeConfigured = indirectCostInfo.configuredMode;
    clone.indirectCostFallback = !!indirectCostInfo.fallback;
    clone.indirectCostPercent = indirectCostPercent;
    clone.indirectCost = indirectCost;
    clone.totalCost = totalCost;
    clone.costPerYield = yieldQty > 0 ? totalCost / yieldQty : 0;
    clone.createdAt = now;
    clone.updatedAt = now;
    DB.set('fichasTecnicas', cloneId, clone).then(function () {
      return _syncRecipeStockSettings(cloneId, clone);
    }).then(function () {
      UI.toast('Receita duplicada como cópia independente.', 'success');
      _fichas = (_fichas || []).filter(function (item) { return String(item && item.id) !== String(cloneId); }).concat([clone]);
      _paintFichas();
      _openFichaModal(cloneId);
    }).catch(function (err) {
      UI.toast('Erro: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  // ── TAGS TAB ─────────────────────────────────────────────────────────────
  function _renderTagsTab() {
    DB.getAll('tags').then(function (items) {
      _tags = items || [];
      _paintTagsTab();
    });
  }

  function _paintTagsTab() {
    var content = _catalogTarget();
    if (!content) return;
    content.innerHTML =
      '<section class="catalog-config-panel">' +
        _catalogConfigSectionHead('Tags', 'Crie selos visuais para destacar produtos no cardápio.', _catalogConfigPrimaryButton('+ Adicionar tag', 'Modules.Catalogo._openTagModal(null)')) +
        (_tags.length === 0 ? '<div class="catalog-config-empty">Nenhuma tag ainda</div>' :
          '<div class="catalog-config-list">' +
          _tags.map(function (tag) {
            return '<div class="catalog-config-tag-row">' +
              '<div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">' +
                '<span class="catalog-config-chip" style="background:' + (tag.bgColor || '#B42318') + ';color:' + (tag.textColor || '#fff') + ';">' + _esc(tag.text) + '</span>' +
                '<div style="font-size:12px;color:#6F6860;line-height:1.35;">Chip usado para filtros, promoções e destaques visuais.</div>' +
              '</div>' +
              '<div class="catalog-config-actions">' +
                '<button class="catalog-config-icon-btn" onclick="Modules.Catalogo._openTagModal(\'' + tag.id + '\')"><span class="mi">edit</span></button>' +
                '<button class="catalog-config-icon-btn danger" onclick="Modules.Catalogo._deleteTag(\'' + tag.id + '\')"><span class="mi">delete</span></button>' +
              '</div>' +
            '</div>';
          }).join('') + '</div>') +
      '</section>';
  }

  function _openTagModal(id) {
    _editingId = id;
    var tag = id ? (_tags.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div class="catalog-config-modal-card">' +
      '<label style="display:block;margin-bottom:12px;"><span style="' + _labelStyle() + '">Texto da tag *</span>' +
      '<input id="tag-text" type="text" value="' + _esc(tag.text || '') + '" placeholder="ex: Novo, Promoção..." style="' + _inputStyle() + '"></label>' +
      '<div class="catalog-config-grid" style="margin-bottom:12px;">' +
      '<div><label style="' + _labelStyle() + '">Cor de fundo</label>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<input type="color" id="tag-bg" value="' + (tag.bgColor || '#B42318') + '" onchange="Modules.Catalogo._updateTagModalPreview()" style="width:40px;height:40px;border:1px solid #EAE4DA;border-radius:10px;cursor:pointer;padding:2px;background:#fff;">' +
      '<input type="text" id="tag-bg-hex" value="' + (tag.bgColor || '#B42318') + '" oninput="document.getElementById(\'tag-bg\').value=this.value;Modules.Catalogo._updateTagModalPreview()" style="flex:1;' + _inputStyle() + '">' +
      '</div></div>' +
      '<div><label style="' + _labelStyle() + '">Cor do texto</label>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<input type="color" id="tag-color" value="' + (tag.textColor || '#ffffff') + '" onchange="Modules.Catalogo._updateTagModalPreview()" style="width:40px;height:40px;border:1px solid #EAE4DA;border-radius:10px;cursor:pointer;padding:2px;background:#fff;">' +
      '<input type="text" id="tag-color-hex" value="' + (tag.textColor || '#ffffff') + '" oninput="document.getElementById(\'tag-color\').value=this.value;Modules.Catalogo._updateTagModalPreview()" style="flex:1;' + _inputStyle() + '">' +
      '</div></div>' +
      '</div>' +
      '<div class="catalog-config-softbox" style="text-align:center;">' +
      '<span id="tag-modal-preview" class="catalog-config-chip" style="background:' + (tag.bgColor || '#B42318') + ';color:' + (tag.textColor || '#fff') + ';font-size:13px;">' + _esc(tag.text || 'Prévia') + '</span>' +
      '</div></div>';
    var footer = '<button onclick="Modules.Catalogo._saveTag()" style="height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:650;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">' + (id ? 'Salvar tag' : 'Criar tag') + '</button>';
    window._tagModal = UI.modal({ title: id ? 'Editar tag' : 'Nova tag', body: body, footer: footer });
  }

  function _updateTagModalPreview() {
    var text = (document.getElementById('tag-text') || {}).value || 'Prévia';
    var bg = (document.getElementById('tag-bg') || {}).value || '#B42318';
    var color = (document.getElementById('tag-color') || {}).value || '#fff';
    var bgHex = document.getElementById('tag-bg-hex');
    var colorHex = document.getElementById('tag-color-hex');
    if (bgHex) bgHex.value = bg;
    if (colorHex) colorHex.value = color;
    var preview = document.getElementById('tag-modal-preview');
    if (preview) { preview.textContent = text; preview.style.background = bg; preview.style.color = color; }
  }

  function _saveTag() {
    var text = ((document.getElementById('tag-text') || {}).value || '').trim();
    if (!text) { UI.toast('Texto obrigatorio', 'error'); return; }
    var data = {
      text: text,
      bgColor: (document.getElementById('tag-bg') || {}).value || '#B42318',
      textColor: (document.getElementById('tag-color') || {}).value || '#ffffff'
    };
    var op = _editingId ? DB.update('tags', _editingId, data) : DB.add('tags', data);
    op.then(function () {
      UI.toast('Tag salva!', 'success');
      if (window._tagModal) window._tagModal.close();
      _renderTagsTab();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteTag(id) {
    UI.confirm('Eliminar esta tag?').then(function (yes) {
      if (!yes) return;
      DB.remove('tags', id).then(function () { UI.toast('Eliminado', 'info'); _renderTagsTab(); });
    });
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function destroy() {}

  return {
    render: render, destroy: destroy,
    _switchSub: _switchSub, _setTemplateTab: _setTemplateTab,
    _refreshProductPromotions: _refreshProductPromotions,
    _setCatalogCfgSub: _setCatalogCfgSub,
    _refreshTemplatePreview: _refreshTemplatePreview,
    _onTemplateHoursChange: _onTemplateHoursChange,
    _uploadStoreImage: _uploadStoreImage, _saveTemplateLoja: _saveTemplateLoja, _saveSeoLoja: _saveSeoLoja,
    _connectCheckoutStripe: _connectCheckoutStripe,
    _clearStoreImage: _clearStoreImage,
    _openProductModal: _openProductModal, _toggleVis: _toggleVis, _saveProduct: _saveProduct, _deleteProduct: _deleteProduct, _duplicateProduct: _duplicateProduct, _openImportProducts: _openImportProducts, _filterProdutos: _filterProdutos, _setProductFilter: _setProductFilter, _setProductSort: _setProductSort, _setProductPage: _setProductPage, _setProductPageSize: _setProductPageSize, _clearProductFilters: _clearProductFilters, _quickUpdateProduct: _quickUpdateProduct, _moveProductInCategory: _moveProductInCategory,
    _setCatalogSalesFilter: _setCatalogSalesFilter, _setCatalogSalesSearch: _setCatalogSalesSearch, _clearCatalogSalesFilters: _clearCatalogSalesFilters, _setCatalogSalesPage: _setCatalogSalesPage, _setCatalogSalesPageSize: _setCatalogSalesPageSize, _setPerformanceTab: _setPerformanceTab, _openCatalogBcgBucket: _openCatalogBcgBucket,
    _setCatalogForecastFilter: _setCatalogForecastFilter, _clearCatalogForecastFilters: _clearCatalogForecastFilters, _setCatalogForecastPage: _setCatalogForecastPage, _setCatalogForecastPageSize: _setCatalogForecastPageSize, _openCatalogForecastDetails: _openCatalogForecastDetails,
    _openProductsMoreFilters: _openProductsMoreFilters,
    _onProductNameChange: _onProductNameChange, _onProductDescChange: _onProductDescChange, _onProductMadeToOrderChange: _onProductMadeToOrderChange, _refreshProductPreview: _refreshProductPreview, _moneyInputFocus: _moneyInputFocus, _moneyInputBlur: _moneyInputBlur,
    _seoEdited: _seoEdited, _onTipoChange: _onTipoChange, _onUnicoSrcChange: _onUnicoSrcChange, _openProductTypeHelpModal: _openProductTypeHelpModal, _openProductCategoryCreateModal: _openProductCategoryCreateModal, _saveProductCategoryFromModal: _saveProductCategoryFromModal,
    _addInternalCompositionItem: _addInternalCompositionItem, _removeInternalCompositionItem: _removeInternalCompositionItem, _onInternalCompositionChange: _onInternalCompositionChange, _filterInternalCompositionOptions: _filterInternalCompositionOptions,
    _addMenuGroup: _addMenuGroup, _removeMenuGroup: _removeMenuGroup,
    _addMenuOption: _addMenuOption, _removeMenuOption: _removeMenuOption, _moveMenuOption: _moveMenuOption, _filterMenuOptions: _filterMenuOptions,
    _addUpsellProduct: _addUpsellProduct, _removeUpsellProduct: _removeUpsellProduct, _filterUpsellProducts: _filterUpsellProducts,
    _onImgFileChange: _onImgFileChange, _openProductImagePicker: _openProductImagePicker, _removeProductImage: _removeProductImage,
    _onProntoImgChange: _onProntoImgChange, _onFichaImgChange: _onFichaImgChange,
    _openCatModal: _openCatModal, _selectCatColor: _selectCatColor, _uploadCategoryGraphic: _uploadCategoryGraphic, _clearCategoryGraphic: _clearCategoryGraphic, _uploadTemplateCategoryGraphic: _uploadTemplateCategoryGraphic, _moveTemplateCategory: _moveTemplateCategory, _saveCat: _saveCat, _deleteCat: _deleteCat,
    _openProntosModal: _openProntosModal, _savePronto: _savePronto, _deletePronto: _deletePronto,
    _openVariantModal: _openVariantModal, _addVariantOptionRow: _addVariantOptionRow, _removeVariantOptionRow: _removeVariantOptionRow, _moveVariantOptionRow: _moveVariantOptionRow, _onVariantOptionImageChange: _onVariantOptionImageChange, _removeVariantOptionImage: _removeVariantOptionImage, _onVariantStockLinkChange: _onVariantStockLinkChange, _toggleProductVariantPreview: _toggleProductVariantPreview, _saveVariant: _saveVariant, _deleteVariant: _deleteVariant,
    _openItemCustoModal: _openItemCustoModal, _saveItemCusto: _saveItemCusto, _deleteItemCusto: _deleteItemCusto,
    _filterItensCusto: _filterItensCusto, _setItensCustoFilter: _setItensCustoFilter, _onItemTipoChange: _onItemTipoChange,
    _openFichaViewModal: _openFichaViewModal, _editFichaFromView: _editFichaFromView,
    _openFichaModal: _openFichaModal, _addFichaComponent: _addFichaComponent, _removeFichaComponent: _removeFichaComponent, _addFichaIng: _addFichaIng, _removeFichaIng: _removeFichaIng,
    _addFichaPackaging: _addFichaPackaging, _removeFichaPackaging: _removeFichaPackaging,
    _toggleFichaYieldHelp: _toggleFichaYieldHelp, _toggleFichaIngredientsHelp: _toggleFichaIngredientsHelp, _toggleFichaPackagingHelp: _toggleFichaPackagingHelp,
    _openRecipeCategoryCreateModal: _openRecipeCategoryCreateModal, _saveRecipeCategoryFromModal: _saveRecipeCategoryFromModal,
    _openRecipeComponentCreateModal: _openRecipeComponentCreateModal, _saveRecipeComponentFromModal: _saveRecipeComponentFromModal, _applyRecipeComponentTemplate: _applyRecipeComponentTemplate,
    _updateFichaCost: _updateFichaCost, _updateFichaPesoTotal: _updateFichaPesoTotal, _onYieldUnitChange: _onYieldUnitChange,
    _onFichaIngChange: _onFichaIngChange, _filterFichaIngredientOptions: _filterFichaIngredientOptions, _selectFichaIngredient: _selectFichaIngredient,
    _filterFichaPackagingOptions: _filterFichaPackagingOptions, _selectFichaPackaging: _selectFichaPackaging, _onFichaPackagingChange: _onFichaPackagingChange,
    _onFichaImgChange: _onFichaImgChange,
    _saveFicha: _saveFicha, _deleteFicha: _deleteFicha, _duplicateFicha: _duplicateFicha,
    _filterFichas: _filterFichas, _renderFichas: _renderFichas, _setFichaPageSize: _setFichaPageSize, _setFichaPage: _setFichaPage, _clearFichasFilters: _clearFichasFilters,
    _openTagModal: _openTagModal, _saveTag: _saveTag, _deleteTag: _deleteTag, _updateTagModalPreview: _updateTagModalPreview
  };
})();
