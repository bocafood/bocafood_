// js/modules/pos.js
window.Modules = window.Modules || {};
Modules.POS = (function () {
  'use strict';

  var _data = { cfg: {}, finance: {}, cashSessions: [], orders: [], products: [], categories: [], promotions: [], variantGroups: [] };
  var _loading = false;
  var _saving = false;
  var _cart = [];
  var _query = '';
  var _category = 'all';
  var _paymentMethod = 'cash';
  var _cashReceived = '';
  var _lastAddedId = '';
  var _cashModal = null;
  var _choiceModal = null;
  var _choiceState = null;
  var _recentPage = { page: 1, perPage: 8 };

  function render() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<section class="module-page pos-page" style="padding:24px;display:flex;flex-direction:column;gap:16px;">' +
      '<div id="pos-content" class="module-content"><div class="loading-inline">Carregando...</div></div>' +
    '</section>';
    _loading = true;
    _paint();
    _load().then(function () {
      _paymentMethod = _defaultPaymentValue(_data.cfg.defaultPaymentMethod || _paymentMethod);
      _loading = false;
      _paint();
    }).catch(function (err) {
      _loading = false;
      _paintError(err);
    });
  }

  function destroy() {}

  function _load() {
    return Promise.all([
      DB.getDocRoot('config', 'tpv').catch(function () { return {}; }),
      DB.getAll('orders').catch(function () { return []; }),
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('categories').catch(function () { return []; }),
      DB.getAll('variantGroups').catch(function () { return []; }),
      DB.getAll('promotions').catch(function () { return []; }),
      DB.getAll('promocoes').catch(function () { return []; }),
      DB.getDocRoot('config', 'financeiro').catch(function () { return {}; }),
      DB.getAll('cash_sessions').catch(function () { return []; })
    ]).then(function (r) {
      _data.cfg = r[0] || {};
      _data.orders = Array.isArray(r[1]) ? r[1] : [];
      _data.products = Array.isArray(r[2]) ? r[2] : [];
      _data.categories = Array.isArray(r[3]) ? r[3] : [];
      _data.variantGroups = Array.isArray(r[4]) ? r[4] : [];
      _data.promotions = _mergePromotions(r[5], r[6]);
      _data.finance = r[7] || {};
      _data.cashSessions = Array.isArray(r[8]) ? r[8] : [];
    });
  }

  function _paint() {
    var content = document.getElementById('pos-content');
    if (!content) return;
    if (_loading) { content.innerHTML = '<div class="loading-inline">Carregando...</div>'; return; }
    if (!_canUseTpv()) { content.innerHTML = _permissionHtml(); return; }
    if (!_isEnabled(_data.cfg)) { content.innerHTML = _disabledHtml(); return; }

    var today = _todayTpvOrders();
    var total = _sum(today, function (o) { return _orderTotal(o); });
    content.innerHTML = _styles() +
      '<div class="pos-root">' +
        _header(today.length, total) +
        '<div class="pos-main">' +
          '<section class="pos-products-panel">' + _catalogHtml() + '</section>' +
          '<aside class="pos-cart-panel">' + _cartHtml() + '</aside>' +
        '</div>' +
        _cashPanelHtml() +
        '<section class="pos-recent-panel">' + _recentHtml() + '</section>' +
      '</div>';
  }

  function _styles() {
    return '<style>' +
      '.pos-root{display:flex;flex-direction:column;gap:16px;max-width:1280px;margin:0 auto;width:100%;}' +
      '.pos-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.pos-title{font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;}' +
      '.pos-subtitle{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;}' +
      '.pos-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,410px);gap:16px;align-items:start;}' +
      '.pos-products-panel{display:flex;flex-direction:column;gap:12px;min-width:0;}' +
      '.pos-cart-panel,.pos-recent-panel,.pos-filter-card,.pos-list-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.055);}' +
      '.pos-cart-panel{position:sticky;top:66px;}' +
      '.pos-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;}' +
      '.pos-section-title{font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.3;}' +
      '.pos-section-desc{font-size:13px;color:#6F6860;line-height:1.45;margin-top:4px;}' +
      '.pos-filter-grid{display:grid;grid-template-columns:minmax(260px,1fr);gap:11px 12px;align-items:end;}' +
      '.pos-field{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.pos-field:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.pos-field input,.pos-field select{width:100%;height:40px;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;box-sizing:border-box;}' +
      '.pos-field-label{display:block;font-size:10px;font-weight:650;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;}' +
      '.pos-product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;}' +
      '.pos-product-card{position:relative;text-align:left;border:1px solid #EAE4DA;border-radius:14px;background:#fff;min-height:238px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 1px 2px rgba(31,31,31,.03);transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease;}' +
      '.pos-product-card:hover{transform:translateY(-2px);box-shadow:0 14px 28px rgba(31,31,31,.08);}' +
      '.pos-product-card.added{border-color:#B42318;box-shadow:0 0 0 2px rgba(180,35,24,.10),0 14px 28px rgba(31,31,31,.08);}' +
      '.pos-product-card.unavailable{opacity:.54;cursor:not-allowed;}' +
      '.pos-product-img{height:118px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-bottom:1px solid #EAE4DA;}' +
      '.pos-product-img img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.pos-product-body{padding:12px;display:flex;flex-direction:column;gap:9px;flex:1;}' +
      '.pos-add-btn{height:36px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:12px;font-weight:700;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;}' +
      '.pos-add-btn:disabled{background:#D8CEC2;color:#fff;}' +
      '.pos-cat-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;overflow:visible;padding:7px;background:#FFFCF8;border:1px solid #EADFD8;border-radius:16px;box-shadow:0 8px 18px rgba(31,31,31,.035);}' +
      '.pos-cat-btn{height:34px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#6F6860;font-size:12px;font-weight:650;white-space:nowrap;cursor:pointer;font-family:inherit;transition:background .16s ease,color .16s ease,box-shadow .16s ease;}' +
      '.pos-cat-btn:hover{background:#fff;color:#B42318;}' +
      '.pos-cat-btn.active{background:#B42318;color:#fff;box-shadow:0 8px 18px rgba(180,35,24,.14);}' +
      '.pos-pay-segment{height:36px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}' +
      '.pos-pay-segment.active{background:#B42318;color:#fff;border-color:#B42318;box-shadow:0 8px 18px rgba(180,35,24,.14);}' +
      '.pos-choice-card{background:#fff;border:1px solid #EADFD8;border-radius:16px;padding:14px;box-shadow:0 10px 24px rgba(31,31,31,.05);}' +
      '.pos-choice-title{font-size:13px;font-weight:750;color:#1F1F1F;margin:0 0 4px;}' +
      '.pos-choice-hint{font-size:12px;color:#6F6860;margin:0 0 10px;line-height:1.35;}' +
      '.pos-choice-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;}' +
      '.pos-choice-option{min-height:44px;border:1px solid #EAE4DA;border-radius:12px;background:#FFFCF8;padding:8px 10px;display:flex;align-items:center;gap:9px;cursor:pointer;transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;}' +
      '.pos-choice-option:hover{background:#fff;border-color:#D9AAA1;box-shadow:0 8px 18px rgba(180,35,24,.08);}' +
      '.pos-choice-option input{width:16px;height:16px;accent-color:#B42318;flex:0 0 auto;}' +
      '.pos-choice-img{width:34px;height:34px;border-radius:9px;object-fit:cover;flex:0 0 auto;background:#F3EEE8;}' +
      '.pos-choice-name{font-size:12px;font-weight:650;color:#1F1F1F;line-height:1.25;}' +
      '.pos-choice-price{font-size:11px;color:#6F6860;margin-top:2px;}' +
      '.pos-table-card{background:#fff;border:1px solid #EADFD8;border-radius:18px;box-shadow:0 12px 30px rgba(31,31,31,.055);overflow:hidden;}' +
      '.pos-table-wrap{overflow-x:auto;}' +
      '.pos-table{width:100%;border-collapse:separate;border-spacing:0;min-width:780px;}' +
      '.pos-table th{padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;}' +
      '.pos-table th:last-child,.pos-table td:last-child{text-align:right;}' +
      '.pos-table td{padding:14px 16px;vertical-align:middle;border-bottom:1px solid #EADFD8;font-size:13px;color:#1F1F1F;}' +
      '.pos-table tbody tr{background:#fff;transition:background .15s ease;}' +
      '.pos-table tbody tr:hover{background:#FFFCF8;}' +
      '.pos-table-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;}' +
      '.pos-page-select{width:110px;height:34px;padding:0 34px 0 10px;border:1px solid #E8DCD7;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#FFFCF8;color:#6F6860;box-sizing:border-box;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 12px center;background-size:14px;}' +
      '.pos-secondary{height:34px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.pos-secondary:disabled{opacity:.45;cursor:not-allowed;}' +
      '.pos-page-indicator{display:inline-flex;align-items:center;gap:6px;color:#6F6860;font-size:12px;}' +
      '.pos-page-indicator span:first-child{min-width:28px;height:28px;border-radius:9px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-weight:700;}' +
      '.pos-page-indicator i{width:16px;height:1px;background:#D8C9C5;display:inline-block;}' +
      '.pos-modal-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:14px;box-shadow:0 10px 24px rgba(31,31,31,.04);}' +
      '.pos-modal-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:12px;}' +
      '.pos-modal-head .mi{font-size:18px;color:#6F6860;line-height:1.2;flex:0 0 auto;}' +
      '.pos-modal-title{font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;}' +
      '.pos-modal-desc{font-size:12px;color:#6F6860;line-height:1.4;margin-top:2px;}' +
      '.pos-primary{height:42px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);display:inline-flex;align-items:center;justify-content:center;}' +
      '@media (max-width:980px){.pos-main{grid-template-columns:1fr}.pos-cart-panel{position:static}.pos-product-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));}.pos-product-img{height:104px;}}' +
    '</style>';
  }

  function _header(count, total) {
    var cashOpen = _isCashOpen();
    var session = _activeCashSession();
    return '<div class="pos-head">' +
      '<div style="min-width:0;">' +
        '<h1 class="pos-title">Venda presencial</h1>' +
        '<p class="pos-subtitle">Venda rápida para balcão: escolha produtos, confira o carrinho e finalize o pagamento no caixa.</p>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center;">' +
        _statusChip(cashOpen ? 'Caixa aberto' : 'Caixa fechado', cashOpen ? '#1F6F43' : '#B45309', cashOpen ? 'point_of_sale' : 'lock') +
        (session ? _chip('Aberto em ' + _dateLabel(session.openedAt || session.createdAt)) : '') +
        _chip(count + ' venda(s) hoje') +
        _chip(_fmtMoney(total) + ' vendido hoje') +
        (cashOpen ? '<button type="button" onclick="Modules.POS._openCashMovementModal(\'reforco\')" class="pos-secondary">Reforço</button>' : '') +
        (cashOpen ? '<button type="button" onclick="Modules.POS._openCashMovementModal(\'sangria\')" class="pos-secondary">Sangria</button>' : '') +
        '<button type="button" onclick="' + (cashOpen ? 'Modules.POS._openCloseCashModal()' : 'Modules.POS._openCashModal()') + '" class="pos-primary" style="height:36px;border-radius:10px;">' + (cashOpen ? 'Fechar caixa' : 'Abrir caixa') + '</button>' +
        '<button type="button" onclick="Modules.POS._clearCart()" class="pos-secondary">Limpar carrinho</button>' +
      '</div>' +
    '</div>';
  }

  function _catalogHtml() {
    var products = _filteredProducts();
    return _categoryBar() +
      '<section class="pos-filter-card">' +
        '<div class="pos-filter-grid">' +
          '<label style="display:block;min-width:0;"><span class="pos-field-label">Buscar</span><div class="pos-field"><span class="mi" style="font-size:18px;color:#8A7E7C;margin-right:8px;">search</span><input type="search" value="' + _esc(_query) + '" oninput="Modules.POS._setSearch(this.value)" placeholder="Buscar produto" autocomplete="off"></div></label>' +
        '</div>' +
      '</section>' +
      '<section class="pos-list-card">' +
        '<div class="pos-section-head">' +
          '<div><div class="pos-section-title">Produtos disponíveis</div><div class="pos-section-desc">Clique no item para adicionar ao carrinho da venda presencial.</div></div>' +
          '<span style="font-size:12px;color:#6F6860;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:999px;padding:6px 10px;">' + products.length + ' item(ns)</span>' +
        '</div>' +
        '<div id="pos-product-grid" class="pos-product-grid">' +
          (products.length ? products.map(_productCard).join('') : _emptyProductsHtml()) +
        '</div>' +
      '</section>';
  }

  function _categoryBar() {
    var cats = _categoryOptions();
    if (!cats.length) return '';
    return '<div class="pos-cat-bar">' + cats.map(function (cat) {
      return '<button type="button" class="pos-cat-btn' + (_category === cat.key ? ' active' : '') + '" onclick="Modules.POS._setCategory(\'' + _esc(cat.key) + '\')">' + _esc(cat.label) + '</button>';
    }).join('') + '</div>';
  }

  function _productCard(product) {
    var id = String(product.id || '');
    var cat = _productCategoryLabel(product);
    var tone = _categoryTone(cat);
    var price = _productPrice(product);
    var promoCalc = _bestPromoForProduct(product);
    var finalPrice = promoCalc && !(promoCalc.type === 'add1' && promoCalc.bundleMatchMode === 'any_participant') ? promoCalc.finalPrice : price;
    var available = _isProductAvailable(product);
    var image = _productImage(product);
    var promo = _isPromoProduct(product);
    var added = _lastAddedId && _lastAddedId === id;
    return '<button type="button" data-pos-product-id="' + _esc(id) + '" class="pos-product-card' + (available ? '' : ' unavailable') + (added ? ' added' : '') + '" onclick="Modules.POS._addProduct(\'' + _esc(id) + '\')" ' + (available ? '' : 'disabled') + '>' +
      '<div class="pos-product-img" style="background:' + tone.bg + ';">' +
        (image ? '<img src="' + _esc(image) + '" alt="" onerror="this.parentNode.innerHTML=\'<span class=&quot;mi&quot; style=&quot;font-size:34px;color:' + tone.fg + ';&quot;>restaurant</span>\';">' : '<span class="mi" style="font-size:34px;color:' + tone.fg + ';">restaurant</span>') +
        (promo ? '<span style="position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:999px;background:#FFF7CC;color:#8A6400;font-size:10px;font-weight:800;border:1px solid rgba(138,100,0,.12);">Promo</span>' : '') +
        (!available ? '<span style="position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:999px;background:#fff;color:#B42318;font-size:10px;font-weight:800;border:1px solid #F0D3D0;">Indisponível</span>' : '') +
      '</div>' +
      '<div class="pos-product-body">' +
        '<span style="display:inline-flex;align-items:center;align-self:flex-start;min-height:22px;padding:0 8px;border-radius:999px;background:' + tone.bg + ';color:' + tone.fg + ';font-size:10px;font-weight:800;">' + _esc(cat) + '</span>' +
        '<strong style="display:block;font-size:14px;color:#1F1F1F;line-height:1.22;min-height:34px;">' + _esc(_productName(product)) + '</strong>' +
        (promoCalc && finalPrice < price ? '<span style="font-size:11px;color:#6F6860;"><span style="text-decoration:line-through;">' + _fmtMoney(price) + '</span> · ' + _esc(_promoBenefitLabel(promoCalc)) + '</span>' : '') +
        '<span style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;"><b style="font-size:17px;color:#B42318;">' + _fmtMoney(finalPrice) + '</b><span class="pos-add-btn" style="min-width:82px;">' + (available ? '<span class="mi" style="font-size:17px;">add</span>Adicionar' : 'Bloqueado') + '</span></span>' +
      '</div>' +
    '</button>';
  }

  function _cartHtml() {
    var totals = _cartTotals();
    var hasItems = _cart.length > 0;
    var hasPaymentMethods = _paymentOptions().length > 0;
    var cash = _num(_cashReceived);
    var change = Math.max(0, cash - totals.total);
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">' +
      '<div><h2 style="font-size:16px;font-weight:700;color:#1F1F1F;margin:0 0 4px;">Carrinho</h2><p style="font-size:13px;color:#6F6860;margin:0;">' + _cart.length + ' item(ns)</p></div>' +
      '<span class="mi" style="color:#B42318;font-size:23px;">shopping_cart_checkout</span>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;min-height:140px;">' +
      (hasItems ? _cart.map(_cartRow).join('') : '<div style="padding:32px 16px;text-align:center;color:#6F6860;border:1px dashed #EAE4DA;border-radius:14px;background:#FAF8F4;font-size:13px;">Adicione produtos para iniciar uma venda.</div>') +
    '</div>' +
    '<div style="border-top:1px solid #EAE4DA;margin-top:14px;padding-top:14px;display:flex;flex-direction:column;gap:12px;">' +
      '<div style="opacity:' + (hasItems ? '1' : '.48') + ';">' +
        '<div style="font-size:11px;font-weight:800;color:#6F6860;margin-bottom:7px;text-transform:uppercase;letter-spacing:.04em;">Pagamento</div>' +
        _paymentControl() +
        (_paymentMethod === 'cash' && hasItems ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;"><label><span style="' + _smallLabelStyle() + '">Recebido</span><input type="number" step="0.01" value="' + _esc(_cashReceived) + '" oninput="Modules.POS._setCashReceived(this.value)" placeholder="0,00" style="' + _smallInputStyle() + '"></label><div><span style="' + _smallLabelStyle() + '">Troco</span><div id="pos-cash-change" style="' + _smallInputStyle() + 'background:#FAF8F4;display:flex;align-items:center;font-weight:800;">' + _fmtMoney(change) + '</div></div></div>' : '') +
      '</div>' +
      '<div style="display:grid;gap:6px;border-top:1px solid #F2EDED;padding-top:12px;">' +
        _totalRow('Subtotal', totals.subtotal, false) +
        (totals.discount > 0 ? _totalRow('Promoções', -totals.discount, false) : '') +
        _totalRow('Total', totals.total, true) +
      '</div>' +
      '<button type="button" onclick="Modules.POS._finishSale()" ' + (!hasItems || _saving || !_isCashOpen() || !hasPaymentMethods ? 'disabled' : '') + ' style="height:44px;border:none;border-radius:10px;background:' + (hasItems && !_saving && _isCashOpen() && hasPaymentMethods ? '#B42318' : '#D8CEC2') + ';color:#fff;font-size:13px;font-weight:800;cursor:' + (hasItems && !_saving && _isCashOpen() && hasPaymentMethods ? 'pointer' : 'not-allowed') + ';font-family:inherit;box-shadow:' + (hasItems && !_saving && _isCashOpen() && hasPaymentMethods ? '0 10px 22px rgba(180,35,24,.16)' : 'none') + ';">' + (_saving ? 'Salvando...' : (hasItems ? 'Finalizar venda — ' + _fmtMoney(totals.total) : 'Finalizar venda')) + '</button>' +
      (!_isCashOpen() ? '<div style="font-size:11px;color:#B45309;text-align:center;">Abra o caixa para finalizar vendas.</div>' : '') +
      (!hasPaymentMethods ? '<div style="font-size:11px;color:#B45309;text-align:center;line-height:1.4;">Cadastre uma forma de pagamento em Financeiro &gt; Configurações antes de finalizar vendas presenciais.</div>' : '') +
    '</div>';
  }

  function _cartRow(item) {
    var subtotal = _cartLineTotal(item);
    var originalSubtotal = _num(item.originalPrice) * _num(item.quantity || 1);
    var displayUnit = subtotal / Math.max(1, _num(item.quantity || 1));
    var key = item.cartKey || item.productId;
    var choices = _choiceSummary(item.choices || item.selectedOptions || item.variants || []);
    return '<div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start;border:1px solid #EAE4DA;border-radius:12px;padding:10px;background:#fff;">' +
      '<div style="min-width:0;"><strong style="display:block;font-size:13px;color:#1F1F1F;line-height:1.25;">' + _esc(item.name) + '</strong>' + (choices ? '<span style="display:block;font-size:11px;color:#5F5752;margin-top:3px;line-height:1.35;">' + _esc(choices) + '</span>' : '') + '<span style="display:block;font-size:11px;color:#6F6860;margin-top:3px;">Unitário ' + (item.promoId ? '<span style="text-decoration:line-through;">' + _fmtMoney(item.originalPrice) + '</span> ' : '') + _fmtMoney(displayUnit) + ' · subtotal ' + (item.promoId ? '<span style="text-decoration:line-through;">' + _fmtMoney(originalSubtotal) + '</span> ' : '') + _fmtMoney(subtotal) + '</span>' + (item.promoName ? '<span style="display:block;font-size:11px;color:#B45309;margin-top:3px;">' + _esc(item.promoName) + '</span>' : '') + (item.note ? '<span style="display:block;font-size:11px;color:#8A7E7C;margin-top:3px;">Obs.: ' + _esc(item.note) + '</span>' : '') + '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<button type="button" onclick="Modules.POS._changeQty(' + _jsArg(key) + ',-1)" title="Diminuir" style="' + _qtyBtnStyle() + '">−</button>' +
        '<strong style="min-width:22px;text-align:center;font-size:13px;color:#1F1F1F;">' + item.quantity + '</strong>' +
        '<button type="button" onclick="Modules.POS._changeQty(' + _jsArg(key) + ',1)" title="Adicionar" style="' + _qtyBtnStyle() + 'background:#B42318;color:#fff;border-color:#B42318;">+</button>' +
        '<button type="button" onclick="Modules.POS._removeItem(' + _jsArg(key) + ')" title="Remover" style="' + _qtyBtnStyle() + 'color:#B42318;">×</button>' +
      '</div>' +
    '</div>';
  }

  function _recentHtml() {
    var list = _tpvOrders();
    var perPage = Number(_recentPage.perPage) || 8;
    var totalPages = Math.max(1, Math.ceil(list.length / perPage));
    if (_recentPage.page > totalPages) _recentPage.page = totalPages;
    if (_recentPage.page < 1) _recentPage.page = 1;
    var start = (_recentPage.page - 1) * perPage;
    var pageItems = list.slice(start, start + perPage);
    var showingStart = list.length ? start + 1 : 0;
    var showingEnd = list.length ? Math.min(start + pageItems.length, list.length) : 0;
    var pageOptions = [8, 16, 32].map(function (size) {
      return '<option value="' + size + '"' + (perPage === size ? ' selected' : '') + '>' + size + ' por página</option>';
    }).join('');
    var footer = '<div class="pos-table-footer">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + showingStart + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + showingEnd + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + list.length + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<select class="pos-page-select" onchange="Modules.POS._setRecentPageSize(this.value)">' + pageOptions + '</select>' +
        '<button type="button" class="pos-secondary" ' + (_recentPage.page <= 1 ? 'disabled' : '') + ' onclick="Modules.POS._setRecentPage(' + (_recentPage.page - 1) + ')">Anterior</button>' +
        '<div class="pos-page-indicator"><span>' + _recentPage.page + '</span><i></i><span>' + totalPages + '</span></div>' +
        '<button type="button" class="pos-secondary" ' + (_recentPage.page >= totalPages ? 'disabled' : '') + ' onclick="Modules.POS._setRecentPage(' + (_recentPage.page + 1) + ')">Próxima</button>' +
      '</div>' +
    '</div>';
    return '<div class="pos-section-head">' +
      '<div><div class="pos-section-title">Vendas registradas</div><div class="pos-section-desc">Histórico das vendas presenciais enviadas para Pedidos e Financeiro.</div></div>' +
      '<button type="button" onclick="Router.navigate(\'pedidos/lista\')" class="pos-secondary">Ver pedidos</button>' +
    '</div>' +
    (list.length ? _ordersTable(pageItems, footer) : '<div style="padding:34px 16px;text-align:center;color:#6F6860;font-size:13px;border:1px dashed #EADFD8;border-radius:14px;background:#FFFCF8;">Nenhuma venda presencial registrada ainda.</div>');
  }

  function _addProduct(id) {
    var product = _data.products.find(function (p) { return String(p.id || '') === String(id || ''); });
    if (!product || !_isProductAvailable(product)) return;
    if (_productChoiceGroups(product).length) {
      _openProductChoicesModal(id);
      return;
    }
    _addConfiguredProduct(product, []);
  }

  function _addConfiguredProduct(product, choices) {
    choices = Array.isArray(choices) ? choices : [];
    var id = String(product.id || '');
    var key = _cartKey(id, choices);
    var existing = _cart.find(function (item) { return String(item.cartKey || item.productId || '') === key; });
    if (existing) {
      existing.quantity += 1;
      existing.qty = existing.quantity;
      _applyCartItemPromo(existing, product);
    } else {
      var basePrice = _productPrice(product);
      var extra = _choiceExtraTotal(choices);
      var item = {
        cartKey: key,
        productId: id,
        id: id,
        name: _productName(product),
        category: _productCategoryLabel(product),
        quantity: 1,
        qty: 1,
        basePrice: basePrice,
        choiceExtraTotal: extra,
        originalPrice: basePrice + extra,
        finalPrice: basePrice + extra,
        price: basePrice + extra,
        unitPrice: basePrice + extra,
        priceOrigin: 'manual',
        manualAdjustment: 0,
        choices: choices,
        selectedOptions: choices,
        variants: choices,
        options: choices
      };
      _applyCartItemPromo(item, product);
      _cart.push(item);
    }
    _lastAddedId = id;
    _paint();
    window.setTimeout(function () {
      if (_lastAddedId === id) {
        _lastAddedId = '';
        var card = document.querySelector('[data-pos-product-id="' + id.replace(/"/g, '\\"') + '"]');
        if (card) card.classList.remove('added');
      }
    }, 450);
  }

  function _changeQty(key, delta) {
    var item = _cart.find(function (x) { return String(x.cartKey || x.productId || '') === String(key || ''); });
    if (!item) return;
    item.quantity += delta;
    item.qty = item.quantity;
    if (item.quantity <= 0) _cart = _cart.filter(function (x) { return x !== item; });
    else _applyCartItemPromo(item, _data.products.find(function (p) { return String(p.id || '') === String(item.productId || ''); }));
    _paint();
  }

  function _removeItem(key) {
    _cart = _cart.filter(function (item) { return String(item.cartKey || item.productId || '') !== String(key || ''); });
    _paint();
  }

  function _openProductChoicesModal(id) {
    var product = _data.products.find(function (p) { return String(p.id || '') === String(id || ''); });
    if (!product) return;
    var groups = _productChoiceGroups(product);
    if (!groups.length) { _addConfiguredProduct(product, []); return; }
    _choiceState = { productId: String(id), groups: groups };
    var body = '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div class="pos-modal-card">' +
        '<div class="pos-modal-head"><span class="mi">tune</span><div><div class="pos-modal-title">' + _esc(_productName(product)) + '</div><div class="pos-modal-desc">Escolha as opções do produto antes de adicionar ao carrinho.</div></div></div>' +
      '</div>' +
      groups.map(function (group, gi) {
        var min = _choiceMin(group);
        var max = _choiceMax(group);
        var inputType = max === 1 ? 'radio' : 'checkbox';
        var hint = min > 0 ? 'Escolha ' + (min === max ? min : ('de ' + min + ' a ' + max)) + ' opção' + (max > 1 ? 'ões' : '') + '.' : 'Opcional.';
        return '<div class="pos-choice-card" data-pos-choice-group="' + gi + '" data-min="' + min + '" data-max="' + max + '">' +
          '<div class="pos-choice-title">' + _esc(group.title) + '</div>' +
          '<p class="pos-choice-hint">' + _esc(hint) + '</p>' +
          '<div class="pos-choice-options">' +
            group.options.map(function (option, oi) {
              var img = option.img ? '<img class="pos-choice-img" src="' + _esc(option.img) + '" alt="">' : '';
              var price = _num(option.priceExtra);
              var priceText = price > 0 ? '+ ' + _fmtMoney(price) : price < 0 ? '- ' + _fmtMoney(Math.abs(price)) : '';
              return '<label class="pos-choice-option">' +
                '<input type="' + inputType + '" name="pos-choice-' + gi + '" value="' + oi + '" onchange="Modules.POS._syncChoiceGroup(' + gi + ')">' +
                img +
                '<span style="min-width:0;"><span class="pos-choice-name">' + _esc(option.label) + '</span>' + (priceText ? '<span class="pos-choice-price">' + _esc(priceText) + '</span>' : '') + '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
    _choiceModal = UI.modal({
      title: 'Adicionar ao carrinho',
      maxWidth: '720px',
      body: body,
      footer: '<button type="button" onclick="Modules.POS._closeChoiceModal()" class="pos-secondary">Cancelar</button><button type="button" onclick="Modules.POS._saveProductChoices()" class="pos-primary">Adicionar ao carrinho</button>'
    });
  }

  function _syncChoiceGroup(index) {
    var group = document.querySelector('[data-pos-choice-group="' + index + '"]');
    if (!group) return;
    var max = Number(group.getAttribute('data-max')) || 1;
    if (max <= 1) return;
    var checked = Array.prototype.slice.call(group.querySelectorAll('input:checked'));
    if (checked.length <= max) return;
    checked[checked.length - 1].checked = false;
    if (window.UI && UI.toast) UI.toast('Você pode escolher até ' + max + ' opções.', 'warning');
  }

  function _saveProductChoices() {
    if (!_choiceState) return;
    var product = _data.products.find(function (p) { return String(p.id || '') === String(_choiceState.productId || ''); });
    if (!product) return;
    var choices = [];
    var valid = true;
    (_choiceState.groups || []).forEach(function (group, gi) {
      if (!valid) return;
      var box = document.querySelector('[data-pos-choice-group="' + gi + '"]');
      var selected = box ? Array.prototype.slice.call(box.querySelectorAll('input:checked')).map(function (input) {
        return group.options[Number(input.value)];
      }).filter(Boolean) : [];
      var min = _choiceMin(group);
      var max = _choiceMax(group);
      if (selected.length < min) {
        valid = false;
        if (window.UI && UI.toast) UI.toast('Complete a escolha em "' + group.title + '".', 'warning');
        return;
      }
      if (selected.length > max) {
        valid = false;
        if (window.UI && UI.toast) UI.toast('Escolha no máximo ' + max + ' opções em "' + group.title + '".', 'warning');
        return;
      }
      selected.forEach(function (option) {
        choices.push({
          groupId: group.id,
          group: group.title,
          groupName: group.title,
          optionId: option.id || option.ref || option.label,
          ref: option.ref || '',
          productId: option.productId || option.ref || '',
          option: option.label,
          optionName: option.label,
          label: option.label,
          name: option.label,
          value: option.label,
          priceExtra: _num(option.priceExtra),
          price: _num(option.priceExtra),
          img: option.img || '',
          qty: 1
        });
      });
    });
    if (!valid) return;
    _addConfiguredProduct(product, choices);
    _closeChoiceModal();
  }

  function _closeChoiceModal() {
    if (_choiceModal && typeof _choiceModal.close === 'function') _choiceModal.close();
    _choiceModal = null;
    _choiceState = null;
  }

  function _setSearch(value) {
    _query = String(value || '');
    _refreshProductGrid();
  }

  function _setCategory(value) {
    _category = String(value || 'all');
    _paint();
  }

  function _setRecentPage(page) {
    _recentPage.page = Math.max(1, Number(page) || 1);
    _paint();
  }

  function _setRecentPageSize(value) {
    _recentPage.perPage = Number(value) || 8;
    _recentPage.page = 1;
    _paint();
  }

  function _setPayment(value) {
    _paymentMethod = _paymentValue(value || '');
    if (_paymentMethod !== 'cash') _cashReceived = '';
    _paint();
  }

  function _setCashReceived(value) {
    _cashReceived = String(value || '');
    var change = document.getElementById('pos-cash-change');
    if (change) change.textContent = _fmtMoney(Math.max(0, _num(_cashReceived) - _cartTotals().total));
  }

  function _clearCart() {
    if (!_cart.length) return;
    var clear = function () {
      _cart = [];
      _cashReceived = '';
      _paint();
    };
    if (window.UI && UI.confirm) {
      UI.confirm('Limpar o carrinho atual?').then(function (yes) { if (yes) clear(); });
    } else if (window.confirm('Limpar o carrinho atual?')) {
      clear();
    }
  }

  function _toggleCash() {
    if (_isCashOpen()) _openCloseCashModal();
    else _openCashModal();
  }

  function _cashPanelHtml() {
    var session = _activeCashSession();
    var expected = session ? _cashExpected(session) : null;
    var recent = (_data.cashSessions || []).slice().sort(function (a, b) {
      return _ts(b.closedAt || b.openedAt || b.createdAt) - _ts(a.closedAt || a.openedAt || a.createdAt);
    }).slice(0, 5);
    var activeHtml = session
      ? '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;">' +
          _cashMetric('Inicial', _fmtMoney(_num(session.openingAmount)), 'savings') +
          _cashMetric('Vendas', _fmtMoney(expected.salesTotal), 'point_of_sale') +
          _cashMetric('Dinheiro esperado', _fmtMoney(expected.expectedCash), 'payments') +
          _cashMetric('Movimentos', _fmtMoney(expected.reinforcementTotal - expected.withdrawalTotal), 'swap_vert') +
        '</div>'
      : '<div style="padding:18px;border:1px dashed #EAE4DA;border-radius:14px;background:#FAF8F4;color:#6F6860;font-size:13px;line-height:1.45;">Abra o caixa para começar a registrar vendas presenciais.</div>';
    var history = recent.length ? recent.map(function (s) {
      var closed = String(s.status || '') === 'closed';
      return '<div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #F2EDED;">' +
        '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;">' + (closed ? 'Caixa fechado' : 'Caixa aberto') + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(_dateLabel(s.openedAt || s.createdAt)) + (s.closedAt ? ' até ' + _esc(_dateLabel(s.closedAt)) : '') + '</div></div>' +
        '<span style="font-size:12px;color:#6F6860;">' + _fmtMoney(_num(s.expectedTotal || s.salesTotal || 0)) + '</span>' +
        '<strong style="font-size:12px;color:' + (_num(s.difference) === 0 ? '#1F1F1F' : (_num(s.difference) > 0 ? '#1F6F43' : '#B42318')) + ';">' + (closed ? _fmtMoney(_num(s.difference || 0)) : 'Aberto') + '</strong>' +
      '</div>';
    }).join('') : '<div style="font-size:13px;color:#6F6860;padding:10px 0;">Nenhum fechamento registrado ainda.</div>';
    return '<section class="pos-recent-panel">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">' +
        '<div><h2 style="font-size:16px;font-weight:700;color:#1F1F1F;margin:0 0 4px;">Controle de caixa</h2><p style="font-size:13px;color:#6F6860;margin:0;">Acompanhe abertura, movimentos e fechamento da venda presencial.</p></div>' +
        (session ? '<button type="button" onclick="Modules.POS._openCloseCashModal()" class="pos-primary" style="height:36px;border-radius:10px;">Fechar caixa</button>' : '<button type="button" onclick="Modules.POS._openCashModal()" class="pos-primary" style="height:36px;border-radius:10px;">Abrir caixa</button>') +
      '</div>' +
      activeHtml +
      '<div style="margin-top:14px;"><div style="font-size:11px;font-weight:800;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">Histórico recente</div>' + history + '</div>' +
    '</section>';
  }

  function _cashMetric(label, value, icon) {
    return '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:12px;min-width:0;">' +
      '<span class="mi" style="font-size:18px;color:#B42318;display:block;margin-bottom:7px;">' + icon + '</span>' +
      '<div style="font-size:11px;color:#6F6860;font-weight:700;margin-bottom:4px;">' + _esc(label) + '</div>' +
      '<strong style="font-size:18px;color:#1F1F1F;line-height:1;">' + _esc(value) + '</strong>' +
    '</div>';
  }

  function _openCashModal() {
    _cashModal = UI.modal({
      title: 'Abrir caixa',
      maxWidth: '460px',
      body: '<div class="pos-modal-card">' +
        '<div class="pos-modal-head"><span class="mi">point_of_sale</span><div><div class="pos-modal-title">Início do caixa</div><div class="pos-modal-desc">Informe apenas o dinheiro físico separado para começar o atendimento.</div></div></div>' +
        '<div style="display:grid;grid-template-columns:minmax(120px,180px);gap:12px;margin-top:14px;">' +
          '<label><span style="' + _smallLabelStyle() + '">Valor inicial</span><input id="pos-cash-open-amount" type="number" step="0.01" min="0" placeholder="0,00" style="' + _smallInputStyle() + '"></label>' +
        '</div>' +
      '</div>',
      footer: '<button type="button" onclick="Modules.POS._saveOpenCash()" class="pos-primary" style="width:100%;justify-content:center;">Abrir caixa</button>'
    });
  }

  function _saveOpenCash() {
    if (_isCashOpen()) { UI.toast('Já existe um caixa aberto.', 'info'); return; }
    var amount = _num((document.getElementById('pos-cash-open-amount') || {}).value);
    var now = new Date().toISOString();
    var payload = {
      status: 'open',
      openingAmount: amount,
      openedAt: now,
      movements: [],
      salesTotal: 0,
      expectedTotal: amount,
      expectedCash: amount
    };
    DB.add('cash_sessions', payload).then(function (ref) {
      var id = String((ref && ref.id) || '');
      payload.id = id;
      _data.cashSessions.unshift(payload);
      var patch = { cashOpen: true, cashStatus: 'open', activeCashSessionId: id, cashUpdatedAt: now };
      _data.cfg = Object.assign({}, _data.cfg || {}, patch);
      return DB.setDocRoot('config', 'tpv', patch).then(function () {
        return _recordCashAccountMovement('abertura', amount, 'Valor inicial do caixa físico.', id);
      });
    }).then(function () {
      _closeOpenModal();
      UI.toast('Caixa aberto.', 'success');
      _paint();
    }).catch(function (err) {
      UI.toast('Erro ao abrir caixa: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _openCashMovementModal(type) {
    var session = _activeCashSession();
    if (!session) { UI.toast('Abra o caixa antes de registrar movimento.', 'warning'); return; }
    var isOut = type === 'sangria';
    _cashModal = UI.modal({
      title: isOut ? 'Registrar sangria' : 'Registrar reforço',
      maxWidth: '480px',
      body: '<div class="pos-modal-card">' +
        '<div class="pos-modal-head"><span class="mi">' + (isOut ? 'south_west' : 'north_east') + '</span><div><div class="pos-modal-title">' + (isOut ? 'Dinheiro retirado do caixa' : 'Dinheiro colocado no caixa') + '</div><div class="pos-modal-desc">' + (isOut ? 'Registre quando retirar dinheiro do caixa físico e devolver para a conta.' : 'Registre quando separar dinheiro da conta para colocar no caixa físico.') + '</div></div></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;align-items:end;margin-top:14px;">' +
          '<label><span style="' + _smallLabelStyle() + '">Valor</span><input id="pos-cash-movement-amount" type="number" step="0.01" min="0" placeholder="0,00" style="' + _smallInputStyle() + '"></label>' +
          '<label><span style="' + _smallLabelStyle() + '">Observação</span><input id="pos-cash-movement-note" placeholder="Opcional" style="' + _smallInputStyle() + '"></label>' +
        '</div>' +
      '</div>',
      footer: '<button type="button" onclick="Modules.POS._saveCashMovement(' + _jsArg(type) + ')" class="pos-primary" style="width:100%;justify-content:center;">Salvar movimento</button>'
    });
  }

  function _saveCashMovement(type) {
    var session = _activeCashSession();
    if (!session || !session.id) return;
    var amount = _num((document.getElementById('pos-cash-movement-amount') || {}).value);
    if (!(amount > 0)) { UI.toast('Informe um valor maior que zero.', 'error'); return; }
    var movement = {
      type: type === 'sangria' ? 'sangria' : 'reforco',
      amount: amount,
      note: String((document.getElementById('pos-cash-movement-note') || {}).value || '').trim(),
      createdAt: new Date().toISOString()
    };
    var movements = Array.isArray(session.movements) ? session.movements.slice() : [];
    movements.push(movement);
    var expected = _cashExpected(Object.assign({}, session, { movements: movements }));
    var patch = { movements: movements, expectedCash: expected.expectedCash, expectedTotal: expected.expectedTotal, salesTotal: expected.salesTotal };
    DB.update('cash_sessions', session.id, patch).then(function () {
      return _recordCashAccountMovement(movement.type, amount, movement.note, session.id);
    }).then(function () {
      Object.assign(session, patch);
      _closeOpenModal();
      UI.toast('Movimento registrado.', 'success');
      _paint();
    }).catch(function (err) {
      UI.toast('Erro ao salvar movimento: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _openCloseCashModal() {
    var session = _activeCashSession();
    if (!session) { UI.toast('Nenhum caixa aberto.', 'info'); return; }
    var expected = _cashExpected(session);
    var payments = _paymentOptions();
    var fields = payments.map(function (opt) {
      var expectedValue = opt.value === 'cash' ? _num(expected.expectedCash || 0) : _num(expected.byPayment[opt.value] || 0);
      return '<label><span style="' + _smallLabelStyle() + '">' + _esc(opt.label) + ' esperado: ' + _fmtMoney(expectedValue) + '</span><input id="pos-close-' + _safeId(opt.value) + '" type="number" step="0.01" min="0" value="' + expectedValue.toFixed(2) + '" oninput="Modules.POS._refreshCloseCashDiff()" style="' + _smallInputStyle() + '"></label>';
    }).join('');
    var fieldsHtml = fields || '<div style="grid-column:1/-1;padding:14px;border-radius:12px;background:#FFFCF8;border:1px dashed #EADFD8;color:#B45309;font-size:12px;line-height:1.45;">Nenhuma forma de pagamento cadastrada. Cadastre em Financeiro &gt; Configurações para conferir o caixa por forma de pagamento.</div>';
    _cashModal = UI.modal({
      title: 'Fechar caixa',
      maxWidth: '620px',
      body: '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<div class="pos-modal-card">' +
          '<div class="pos-modal-head"><span class="mi">fact_check</span><div><div class="pos-modal-title">Conferência do caixa</div><div class="pos-modal-desc">Confira os valores antes de encerrar a venda presencial do período.</div></div></div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px;">' +
            _cashMetric('Vendas', _fmtMoney(expected.salesTotal), 'point_of_sale') +
            _cashMetric('Esperado', _fmtMoney(expected.expectedTotal), 'payments') +
            _cashMetric('Dinheiro no caixa', _fmtMoney(expected.expectedCash), 'savings') +
          '</div>' +
        '</div>' +
        '<div class="pos-modal-card">' +
          '<div class="pos-modal-head"><span class="mi">payments</span><div><div class="pos-modal-title">Valores contados</div><div class="pos-modal-desc">Preencha somente o que foi conferido no fechamento.</div></div></div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;align-items:end;margin-top:14px;">' + fieldsHtml + '</div>' +
          '<div id="pos-close-diff" style="margin-top:12px;padding:12px;border-radius:12px;background:#FAF8F4;border:1px solid #EAE4DA;font-size:13px;color:#1F1F1F;">Diferença: ' + _fmtMoney(0) + '</div>' +
          '<label style="display:block;margin-top:12px;"><span style="' + _smallLabelStyle() + '">Observação do fechamento</span><input id="pos-close-note" placeholder="Opcional" style="' + _smallInputStyle() + '"></label>' +
        '</div>' +
      '</div>',
      footer: '<button type="button" onclick="Modules.POS._saveCloseCash()" class="pos-primary" style="width:100%;justify-content:center;">Fechar caixa</button>'
    });
  }

  function _refreshCloseCashDiff() {
    var session = _activeCashSession();
    var el = document.getElementById('pos-close-diff');
    if (!session || !el) return;
    var expected = _cashExpected(session);
    var counted = _collectCloseAmounts();
    var diff = counted.total - expected.expectedTotal;
    el.textContent = 'Diferença: ' + _fmtMoney(diff);
    el.style.color = diff === 0 ? '#1F1F1F' : (diff > 0 ? '#1F6F43' : '#B42318');
  }

  function _saveCloseCash() {
    var session = _activeCashSession();
    if (!session || !session.id) return;
    var expected = _cashExpected(session);
    var counted = _collectCloseAmounts();
    var now = new Date().toISOString();
    var patch = {
      status: 'closed',
      closedAt: now,
      expectedByPayment: expected.byPayment,
      countedByPayment: counted.byPayment,
      openingAmount: expected.openingAmount,
      reinforcementTotal: expected.reinforcementTotal,
      withdrawalTotal: expected.withdrawalTotal,
      salesTotal: expected.salesTotal,
      expectedCash: expected.expectedCash,
      expectedTotal: expected.expectedTotal,
      countedTotal: counted.total,
      difference: counted.total - expected.expectedTotal,
      closingNote: String((document.getElementById('pos-close-note') || {}).value || '').trim()
    };
    DB.update('cash_sessions', session.id, patch).then(function () {
      Object.assign(session, patch);
      var cfgPatch = { cashOpen: false, cashStatus: 'closed', activeCashSessionId: '', cashUpdatedAt: now };
      _data.cfg = Object.assign({}, _data.cfg || {}, cfgPatch);
      return DB.setDocRoot('config', 'tpv', cfgPatch);
    }).then(function () {
      _closeOpenModal();
      UI.toast('Caixa fechado.', 'success');
      _paint();
    }).catch(function (err) {
      UI.toast('Erro ao fechar caixa: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _collectCloseAmounts() {
    var byPayment = {};
    var total = 0;
    _paymentOptions().forEach(function (opt) {
      var value = _num((document.getElementById('pos-close-' + _safeId(opt.value)) || {}).value);
      byPayment[opt.value] = value;
      total += value;
    });
    return { byPayment: byPayment, total: total };
  }

  function _refreshCashSessionAfterSale(order) {
    var session = _activeCashSession();
    if (!session || !session.id) return Promise.resolve(false);
    var expected = _cashExpected(session);
    var patch = { salesTotal: expected.salesTotal, expectedCash: expected.expectedCash, expectedTotal: expected.expectedTotal, expectedByPayment: expected.byPayment, lastSaleAt: new Date().toISOString() };
    return DB.update('cash_sessions', session.id, patch).then(function () {
      Object.assign(session, patch);
      return true;
    }).catch(function () { return false; });
  }

  function _activeCashSession() {
    var sessions = (_data.cashSessions || []).filter(function (session) {
      return session && String(session.status || 'open') !== 'closed';
    });
    var activeId = String((_data.cfg && _data.cfg.activeCashSessionId) || '');
    if (activeId) {
      var byId = sessions.find(function (session) { return String(session.id || '') === activeId; });
      if (byId) return byId;
    }
    sessions.sort(function (a, b) { return _ts(b.openedAt || b.createdAt) - _ts(a.openedAt || a.createdAt); });
    return sessions[0] || null;
  }

  function _activeCashSessionId() {
    var session = _activeCashSession();
    return session && session.id ? String(session.id) : '';
  }

  function _cashExpected(session) {
    session = session || {};
    var sessionId = String(session.id || '');
    var sessionOrders = sessionId ? _tpvOrders().filter(function (order) {
      return String(order.cashSessionId || order.caixaId || '') === sessionId;
    }) : [];
    var byPayment = {};
    var salesTotal = 0;
    sessionOrders.forEach(function (order) {
      var payment = _paymentValue(order.paymentMethod || order.formaPagamento || order.payment || 'cash');
      var total = _orderTotal(order);
      byPayment[payment] = _num(byPayment[payment]) + total;
      salesTotal += total;
    });
    var movements = Array.isArray(session.movements) ? session.movements : [];
    var reinforcementTotal = _sum(movements.filter(function (m) { return String(m.type || '') === 'reforco'; }), function (m) { return m.amount; });
    var withdrawalTotal = _sum(movements.filter(function (m) { return String(m.type || '') === 'sangria'; }), function (m) { return m.amount; });
    var openingAmount = _num(session.openingAmount);
    var expectedCash = openingAmount + _num(byPayment.cash) + reinforcementTotal - withdrawalTotal;
    var expectedTotal = salesTotal + openingAmount + reinforcementTotal - withdrawalTotal;
    return {
      byPayment: byPayment,
      salesTotal: salesTotal,
      openingAmount: openingAmount,
      reinforcementTotal: reinforcementTotal,
      withdrawalTotal: withdrawalTotal,
      expectedCash: expectedCash,
      expectedTotal: expectedTotal
    };
  }

  function _closeOpenModal() {
    if (_cashModal && typeof _cashModal.close === 'function') _cashModal.close();
    _cashModal = null;
  }

  function _recordCashAccountMovement(type, amount, note, sessionId) {
    amount = _num(amount);
    if (!(amount > 0)) return Promise.resolve(false);
    var accountId = _cashAccountId();
    if (!accountId) return Promise.resolve(false);
    var now = new Date().toISOString();
    var direction = type === 'sangria' ? 'out' : 'in';
    var labels = {
      abertura: 'Abertura de caixa físico',
      reforco: 'Reforço no caixa físico',
      sangria: 'Sangria do caixa físico'
    };
    var descriptions = {
      abertura: 'Valor separado da conta da Venda presencial para começar o caixa físico.',
      reforco: 'Dinheiro retirado da conta da Venda presencial e colocado no caixa físico.',
      sangria: 'Dinheiro retirado do caixa físico e devolvido para a conta da Venda presencial.'
    };
    return DB.add('movimentacoes', {
      tipo: 'caixa_fisico',
      status: 'efetivado',
      origem: 'venda_presencial_caixa',
      descricao: labels[type] || 'Movimento do caixa físico',
      observacoes: note || descriptions[type] || '',
      valor: amount,
      data: _dateKey(now),
      conta_id: accountId,
      contaBancariaId: accountId,
      contaNome: _cashAccountName(),
      cashSessionId: String(sessionId || ''),
      cashMovementType: type,
      cashMovementDirection: direction,
      neutral: true,
      affectsFinancialResult: false,
      createdAt: now,
      updatedAt: now
    }).catch(function () { return false; });
  }

  function _cashAccountId() {
    return String((_data.cfg && (_data.cfg.cashAccountId || _data.cfg.tpvCashAccountId)) || '');
  }

  function _cashAccountName() {
    return String((_data.cfg && (_data.cfg.cashAccountName || _data.cfg.tpvCashAccountName)) || 'Caixa venda presencial');
  }

  function _finishSale() {
    if (_saving || !_cart.length || !_isCashOpen()) return;
    if (!_paymentOptions().length) {
      if (window.UI && UI.toast) UI.toast('Cadastre uma forma de pagamento em Financeiro > Configurações antes de finalizar a venda.', 'warning');
      return;
    }
    if (!window.Modules || !Modules.Pedidos || typeof Modules.Pedidos._createTpvOrder !== 'function') {
      if (window.UI && UI.toast) UI.toast('Módulo de pedidos indisponível.', 'error');
      return;
    }
    var totals = _cartTotals();
    if (_paymentMethod === 'cash' && _cashReceived && _num(_cashReceived) < totals.total) {
      if (window.UI && UI.toast) UI.toast('Valor recebido menor que o total.', 'error');
      return;
    }
    _saving = true;
    _paint();
    Modules.Pedidos._createTpvOrder({
      items: _cart.map(function (item) {
        var qty = Math.max(1, _num(item.quantity || 1));
        var lineTotal = _cartLineTotal(item);
        var unit = lineTotal / qty;
        return Object.assign({}, item, {
          finalPrice: unit,
          price: unit,
          unitPrice: unit,
          total: lineTotal,
          lineTotal: lineTotal,
          subtotal: lineTotal
        });
      }),
      subtotalOriginal: totals.originalSubtotal,
      subtotal: totals.originalSubtotal,
      subtotalFinal: totals.subtotal,
      promoDiscountTotal: totals.discount,
      discountTotal: totals.discount,
      total: totals.total,
      paymentMethod: _paymentMethod,
      paymentStatus: 'pago',
      status: 'Entregado',
      cashSessionId: _activeCashSessionId(),
      cashAccountId: String((_data.cfg && _data.cfg.cashAccountId) || ''),
      cashAccountName: String((_data.cfg && _data.cfg.cashAccountName) || ''),
      customerName: 'Cliente balcão',
      note: _paymentMethod === 'cash' && _cashReceived ? ('Recebido: ' + _fmtMoney(_num(_cashReceived)) + ' · Troco: ' + _fmtMoney(Math.max(0, _num(_cashReceived) - totals.total))) : ''
    }).then(function (order) {
      _data.orders.unshift(order);
      return _refreshCashSessionAfterSale(order).then(function () { return order; });
    }).then(function () {
      _cart = [];
      _cashReceived = '';
      if (window.UI && UI.toast) UI.toast('Venda presencial registrada.', 'success');
    }).catch(function (err) {
      if (window.UI && UI.toast) UI.toast('Erro: ' + ((err && err.message) || 'falha ao salvar'), 'error');
    }).then(function () {
      _saving = false;
      _paint();
    });
  }

  function _refreshProductGrid() {
    var grid = document.getElementById('pos-product-grid');
    if (!grid) return;
    var products = _filteredProducts();
    grid.innerHTML = products.length ? products.map(_productCard).join('') : _emptyProductsHtml();
  }

  function _disabledHtml() {
    return '<section style="' + _cardStyle() + 'max-width:820px;">' +
      '<div style="display:flex;align-items:flex-start;gap:14px;">' +
        '<span class="mi" style="width:42px;height:42px;border-radius:13px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;font-size:23px;flex:0 0 auto;">point_of_sale</span>' +
        '<div style="min-width:0;"><h1 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;">Venda presencial desativada</h1>' +
        '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0 0 14px;">Ative a venda presencial nas configurações da loja para liberar essa tela no menu.</p>' +
        '<button type="button" onclick="Router.navigate(\'configuracoes/tpv\')" style="height:40px;padding:0 15px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Abrir configurações</button></div>' +
      '</div>' +
    '</section>';
  }

  function _permissionHtml() {
    return '<section style="' + _cardStyle() + 'max-width:820px;color:#1F1F1F;">' +
      '<div style="display:flex;align-items:flex-start;gap:14px;">' +
        '<span class="mi" style="width:42px;height:42px;border-radius:13px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;font-size:23px;flex:0 0 auto;">lock</span>' +
        '<div style="min-width:0;"><h1 style="font-size:22px;font-weight:700;margin:0 0 6px;">Sem permissão para Venda presencial</h1>' +
        '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">Este acesso está restrito a dono da loja, equipe da loja ou master admin.</p></div>' +
      '</div>' +
    '</section>';
  }

  function _paintError(err) {
    var content = document.getElementById('pos-content');
    if (!content) return;
    content.innerHTML = '<section style="' + _cardStyle() + 'color:#B42318;font-size:13px;">Erro ao carregar Venda presencial: ' + _esc((err && err.message) || err || 'desconhecido') + '</section>';
  }

  function _categoryOptions() {
    return _realCategoryNames().map(function (name) {
      return { key: 'cat:' + name, label: name };
    });
  }

  function _realCategoryNames() {
    var names = [];
    (_data.categories || []).forEach(function (c) {
      var name = c && (c.name || c.label || c.title || c.slug || c.id);
      if (name && !names.some(function (x) { return _fold(x) === _fold(name); })) names.push(String(name));
    });
    return names.slice(0, 18);
  }

  function _filteredProducts() {
    var q = _fold(_query);
    return _productsForCategory().filter(function (p) {
      if (!q) return true;
      return _fold([_productName(p), _productCategoryLabel(p), p.description, p.shortDesc, p.fullDesc, p.desc, p.sku].join(' ')).indexOf(q) >= 0;
    }).slice(0, 100);
  }

  function _productsForCategory() {
    var list = _productsForSale();
    if (_category === 'best') return _bestProducts(list);
    if (_category === 'promo') return list.filter(_isPromoProduct);
    if (_category.indexOf('cat:') === 0) {
      var selected = _category.slice(4);
      var selectedGroup = _categoryGroup(selected);
      return list.filter(function (p) {
        var cat = _productCategoryLabel(p);
        return _fold(cat) === _fold(selected) || _categoryGroup(cat) === selectedGroup;
      });
    }
    return list;
  }

  function _bestProducts(list) {
    var counts = {};
    (_data.orders || []).forEach(function (order) {
      (order.items || []).forEach(function (item) {
        var id = String(item.productId || item.id || '');
        if (id) counts[id] = (counts[id] || 0) + _num(item.quantity || item.qty || 1);
      });
    });
    var ranked = list.slice().sort(function (a, b) {
      var ba = _num(counts[String(b.id || '')]) + (_truthy(b.favorite || b.favorito || b.featured || b.popular) ? 1000 : 0);
      var aa = _num(counts[String(a.id || '')]) + (_truthy(a.favorite || a.favorito || a.featured || a.popular) ? 1000 : 0);
      return ba - aa || (_num(a.order) - _num(b.order)) || String(_productName(a)).localeCompare(String(_productName(b)));
    });
    return ranked.slice(0, Math.min(18, ranked.length || 0));
  }

  function _productsForSale() {
    return (_data.products || []).filter(function (p) {
      return p && p.deleted !== true && p.archived !== true && !_isProductHidden(p) && _productPrice(p) > 0;
    }).sort(function (a, b) {
      return (_num(a.order) - _num(b.order)) || String(_productName(a)).localeCompare(String(_productName(b)));
    });
  }

  function _isProductHidden(product) {
    if (!product) return true;
    return product.hide === true ||
      product.hidden === true ||
      product.oculto === true ||
      product.menuVisible === false ||
      product.visible === false ||
      product.showInMenu === false ||
      product.showOnMenu === false ||
      product.mostrarNoCardapio === false;
  }

  function _isProductAvailable(product) {
    if (!product) return false;
    if (product.available === false || product.disponivel === false || product.unavailable === true || product.indisponivel === true) return false;
    if (product.active === false) return false;
    var stock = product.stock != null ? product.stock : (product.estoque != null ? product.estoque : product.qty);
    if (stock != null && stock !== '' && _num(stock) <= 0) return false;
    return true;
  }

  function _isPromoProduct(product) {
    if (_truthy(product.promo || product.promocao || product.promotion || product.onSale)) return true;
    var id = String(product.id || '');
    return (_data.promotions || []).some(function (promo) {
      if (promo && promo.active === false) return false;
      var ids = promo.productIds || promo.products || promo.items || promo.productId || [];
      if (!Array.isArray(ids)) ids = String(ids || '').split(',');
      return ids.map(function (x) { return String(x && (x.id || x.productId) || x).trim(); }).indexOf(id) >= 0;
    });
  }

  function _productCategoryLabel(product) {
    var raw = product && (product.categoryId || product.category || product.categoria || product.categoryName || '');
    var cat = (_data.categories || []).find(function (c) {
      return String(c.id || '') === String(raw || '') || String(c.slug || '') === String(raw || '') || _fold(c.name || c.label || '') === _fold(raw || '');
    });
    return String((cat && (cat.name || cat.label)) || product.category || product.categoria || raw || 'Produto');
  }

  function _categoryGroup(value) {
    var v = _fold(value);
    if (/combo/.test(v)) return 'combos';
    if (/menu/.test(v)) return 'menus';
    if (/salg|pastel|coxinha|kibe|pao de queijo|snack/.test(v)) return 'salgados';
    if (/doce|sobremesa|brigadeiro|beijinho|bolo|bizcocho/.test(v)) return 'doces';
    if (/beb|drink|sumo|suco|zumo|guarana|agua|refri/.test(v)) return 'bebidas';
    if (/promo|oferta/.test(v)) return 'promocoes';
    return v;
  }

  function _categoryTone(category) {
    var group = _categoryGroup(category);
    if (group === 'menus' || group === 'combos') return { bg: '#FFF1E8', fg: '#A34112' };
    if (group === 'salgados') return { bg: '#FFF7D8', fg: '#8A6400' };
    if (group === 'doces') return { bg: '#FCEBF5', fg: '#9D356B' };
    if (group === 'bebidas') return { bg: '#EAF4FF', fg: '#245D8F' };
    if (group === 'promocoes') return { bg: '#FFF7CC', fg: '#8A6400' };
    return { bg: '#FAF8F4', fg: '#6F6860' };
  }

  function _paymentControl() {
    var options = _paymentOptions();
    if (!options.length) {
      return '<div style="width:100%;padding:12px;border-radius:12px;background:#FFFCF8;border:1px dashed #EADFD8;color:#B45309;font-size:12px;line-height:1.45;">Nenhuma forma de pagamento cadastrada. Vá em Financeiro &gt; Configurações e cadastre pelo menos uma forma para usar a Venda presencial.</div>';
    }
    if (!options.some(function (opt) { return opt.value === _paymentMethod; })) _paymentMethod = options[0].value;
    return '<div class="pos-field" style="max-width:260px;background:#fff;"><select onchange="Modules.POS._setPayment(this.value)" style="cursor:pointer;">' +
      options.map(function (opt) {
        return '<option value="' + _esc(opt.value) + '"' + (_paymentMethod === opt.value ? ' selected' : '') + '>' + _esc(opt.label) + '</option>';
      }).join('') +
    '</select></div>';
  }

  function _isCashOpen() {
    return !!_activeCashSession();
  }

  function _canUseTpv() {
    var profile = window.Auth && Auth.getAdminProfile ? Auth.getAdminProfile() : null;
    var role = String((profile && profile.role) || '').trim();
    return role === 'master_admin' || role === 'master' || role === 'store_owner' || role === 'tenant_owner' || role === 'store_staff';
  }

  function _isEnabled(cfg) {
    return !!(cfg && (cfg.enabled === true || cfg.tpvEnabled === true || cfg.active === true));
  }

  function _mergePromotions() {
    var out = [];
    var seen = {};
    Array.prototype.slice.call(arguments).forEach(function (group) {
      (Array.isArray(group) ? group : []).forEach(function (promo) {
        if (!promo) return;
        var key = String(promo.id || promo._id || promo.promoId || promo.code || promo.slug || [
          promo.name || promo.title || '',
          promo.type || promo.tipo || promo.discountType || promo.benefitType || '',
          promo.startDate || promo.startsAt || '',
          promo.endDate || promo.endsAt || ''
        ].join('|'));
        if (seen[key]) return;
        seen[key] = true;
        out.push(promo);
      });
    });
    return out;
  }

  function _cartTotals() {
    var originalSubtotal = _sum(_cart, function (item) { return _num(item.originalPrice) * _num(item.quantity || 1); });
    var subtotal = _sum(_cart, function (item) { return _cartLineTotal(item); });
    var discount = Math.max(originalSubtotal - subtotal, 0);
    return { originalSubtotal: originalSubtotal, subtotal: subtotal, discount: discount, total: subtotal };
  }

  function _cartPromoGroupKey(item) {
    return item && item.promoId ? String(item.promoId || '') : '';
  }

  function _cartAnyParticipantLineTotal(item) {
    if (!item || item.promoType !== 'add1' || item.promoBundleMatchMode !== 'any_participant') return null;
    var groupKey = _cartPromoGroupKey(item);
    if (!groupKey) return null;
    var leve = parseInt(item.promoLeve || 0, 10) || 0;
    var pague = parseInt(item.promoPague || 0, 10) || 0;
    if (!(leve > 0 && pague > 0 && leve > pague)) return null;
    var units = [];
    _cart.forEach(function (line) {
      if (!line || line.promoType !== 'add1' || line.promoBundleMatchMode !== 'any_participant' || _cartPromoGroupKey(line) !== groupKey) return;
      var qty = Math.max(1, _num(line.quantity || 1));
      var price = _num(line.originalPrice);
      for (var i = 0; i < qty; i += 1) units.push({ key: line.cartKey || line.productId, price: price });
    });
    var freeCount = Math.floor(units.length / leve) * Math.max(0, leve - pague);
    if (!(freeCount > 0)) return null;
    units.sort(function (a, b) { return a.price - b.price; });
    var freeByKey = {};
    units.slice(0, freeCount).forEach(function (unit) {
      freeByKey[unit.key] = _num(freeByKey[unit.key]) + _num(unit.price);
    });
    var key = item.cartKey || item.productId;
    var original = _num(item.originalPrice) * Math.max(1, _num(item.quantity || 1));
    return Math.max(original - _num(freeByKey[key] || 0), 0);
  }

  function _cartLineTotal(item) {
    if (!item) return 0;
    var grouped = _cartAnyParticipantLineTotal(item);
    if (grouped != null) return grouped;
    return _num(item.finalPrice) * _num(item.quantity || 1);
  }

  function _tpvOrders() {
    return (_data.orders || []).filter(function (o) {
      var channel = String(o && (o.channel || o.canal || o.source || o.origem) || '').toLowerCase();
      return channel === 'tpv';
    }).sort(function (a, b) { return _ts(b.createdAt || b.date || b.data) - _ts(a.createdAt || a.date || a.data); });
  }

  function _todayTpvOrders() {
    var key = _dateKey(new Date());
    return _tpvOrders().filter(function (o) { return _dateKey(o.createdAt || o.date || o.data) === key; });
  }

  function _ordersTable(list, footer) {
    if (!list.length) return '';
    var rows = list.map(function (o) {
      return '<tr>' +
        '<td><div style="font-size:13px;font-weight:650;color:#1F1F1F;">' + _esc(o.orderNumber || o.numero || o.id || 'Venda presencial') + '</div><div style="font-size:12px;color:#6F6860;margin-top:2px;">' + _esc(_dateLabel(o.createdAt || o.date || o.data)) + '</div></td>' +
        '<td>' + _esc(_paymentLabel(o.paymentMethod || o.formaPagamento || '')) + '</td>' +
        '<td><span style="display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border-radius:999px;border:1px solid #EADFD8;background:#F5FBF2;color:#3F7A3D;font-size:11px;font-weight:650;">' + _esc(o.status || 'Entregado') + '</span></td>' +
        '<td><strong style="font-weight:650;">' + _fmtMoney(_orderTotal(o)) + '</strong></td>' +
      '</tr>';
    }).join('');
    return '<div class="pos-table-card"><div class="pos-table-wrap"><table class="pos-table"><thead><tr><th>Pedido</th><th>Pagamento</th><th>Status</th><th>Total</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + (footer || '') + '</div>';
  }

  function _productName(product) {
    return String(product.name || product.title || product.nome || 'Produto');
  }

  function _productPrice(product) {
    return _num(product.price != null ? product.price : product.preco != null ? product.preco : product.preco_venda != null ? product.preco_venda : product.salePrice);
  }

  function _productImage(product) {
    return product.imageThumbUrl || product.imageCardUrl || product.cardImageUrl || product.imageUrl || product.imageBase64 || product.img || product.photoUrl || product.image || '';
  }

  function _productChoiceGroups(product) {
    var groups = [];
    if (Array.isArray(product.variants) && product.variants.length) {
      groups = groups.concat(product.variants.map(_normalizeChoiceGroup).filter(Boolean));
    } else if (Array.isArray(product.menuChoiceGroups) && product.menuChoiceGroups.length) {
      groups = groups.concat(product.menuChoiceGroups.map(_normalizeChoiceGroup).filter(Boolean));
    }
    if (!groups.length && Array.isArray(product.menuItems) && product.menuItems.length) {
      groups = groups.concat(product.menuItems.map(function (item, index) {
        var qty = parseInt(item.qty || 1, 10) || 1;
        var label = item.label || item.name || item.nome || item.title || item.ref || ('Item ' + (index + 1));
        return _normalizeChoiceGroup({
          id: 'menu_item_' + index,
          title: item.title || 'Escolha do combo',
          min: qty,
          max: qty,
          options: [{ ref: item.ref || item.productId || '', label: label, priceExtra: item.priceExtra || item.price || 0, img: item.img || item.imageUrl || '' }]
        });
      }).filter(Boolean));
    }
    (product.variantGroupIds || []).forEach(function (id) {
      var group = (_data.variantGroups || []).find(function (item) { return String(item.id || '') === String(id || ''); });
      var normalized = _normalizeChoiceGroup(group);
      if (normalized && !groups.some(function (g) { return String(g.id) === String(normalized.id); })) groups.push(normalized);
    });
    return groups;
  }

  function _normalizeChoiceGroup(group, index) {
    if (!group) return null;
    var options = (group.options || group.items || group.choices || []).map(function (option, oi) {
      var label = _choiceOptionLabel(option);
      if (!label) return null;
      return {
        id: option.id || option.optionId || option.ref || ('opt_' + oi),
        ref: option.ref || option.productId || option.value || '',
        productId: option.productId || option.ref || '',
        label: label,
        priceExtra: _choiceOptionPrice(option),
        img: _choiceOptionImage(option)
      };
    }).filter(Boolean);
    if (!options.length) return null;
    var max = parseInt(group.maxPerUnit != null ? group.maxPerUnit : group.max != null ? group.max : (group.multiSelect ? options.length : 1), 10) || 1;
    var min = parseInt(group.minPerUnit != null ? group.minPerUnit : group.min != null ? group.min : (group.required ? 1 : 0), 10);
    if (min < 0) min = 0;
    if (max < 1) max = 1;
    if (min > max) min = max;
    return {
      id: group.id || group.groupId || ('choice_' + (index || _safeId(group.title || group.name || 'opcao'))),
      title: group.title || group.name || group.label || 'Escolha',
      minPerUnit: min,
      maxPerUnit: max,
      required: group.required === true || min > 0,
      options: options
    };
  }

  function _choiceOptionLabel(option) {
    return String(option && (option.label || option.name || option.title || option.text || option.nome || option.value) || '').trim();
  }

  function _choiceOptionPrice(option) {
    var raw = option && (option.priceExtra != null ? option.priceExtra : option.extraPrice != null ? option.extraPrice : option.price != null ? option.price : option.valorExtra != null ? option.valorExtra : option.valor != null ? option.valor : 0);
    return _num(raw);
  }

  function _choiceOptionImage(option) {
    var raw = option && (option.img || option.imageUrl || option.imageCardUrl || option.cardImageUrl || option.imageThumbUrl || option.thumbnailUrl || option.thumbUrl || option.photoUrl || option.image || option.url || '');
    raw = String(raw || '').trim();
    return (!raw || raw === 'undefined' || raw === 'null' || raw === '#') ? '' : raw;
  }

  function _choiceMin(group) {
    return Math.max(0, parseInt(group && (group.minPerUnit != null ? group.minPerUnit : group.min), 10) || 0);
  }

  function _choiceMax(group) {
    return Math.max(1, parseInt(group && (group.maxPerUnit != null ? group.maxPerUnit : group.max), 10) || 1);
  }

  function _choiceExtraTotal(choices) {
    return _sum(choices || [], function (choice) { return _num(choice.priceExtra || choice.price); });
  }

  function _choiceSummary(choices) {
    if (!Array.isArray(choices) || !choices.length) return '';
    var byGroup = {};
    choices.forEach(function (choice) {
      var group = choice.groupName || choice.group || 'Escolha';
      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push(choice.optionName || choice.option || choice.label || choice.name || choice.value || '');
    });
    return Object.keys(byGroup).map(function (group) {
      return group + ': ' + byGroup[group].filter(Boolean).join(', ');
    }).join(' · ');
  }

  function _cartKey(productId, choices) {
    var suffix = (choices || []).map(function (choice) {
      return [choice.groupId || choice.groupName || choice.group || '', choice.optionId || choice.ref || choice.label || choice.name || ''].join(':');
    }).join('|');
    return String(productId || '') + '::' + (suffix || 'simple');
  }

  function _applyCartItemPromo(item, product) {
    if (!item) return item;
    product = product || _data.products.find(function (p) { return String(p.id || '') === String(item.productId || ''); }) || {};
    var calc = _bestPromoForProduct(product);
    var basePrice = _productPrice(product) || _num(item.basePrice || item.originalPrice || item.finalPrice);
    var extra = _choiceExtraTotal(item.choices || item.selectedOptions || item.variants || []);
    item.basePrice = basePrice;
    item.choiceExtraTotal = extra;
    item.originalPrice = basePrice + extra;
    if (!calc) {
      item.finalPrice = item.originalPrice;
      item.price = item.finalPrice;
      item.unitPrice = item.finalPrice;
      item.promoId = '';
      item.promoName = '';
      item.promoType = '';
      item.promoLeve = 0;
      item.promoPague = 0;
      item.promoBundleMatchMode = 'same_product';
      item.priceOrigin = 'manual';
      return item;
    }
    item.finalPrice = (calc.bundleMatchMode === 'any_participant' && calc.type === 'add1' ? calc.originalPrice : calc.finalPrice) + extra;
    item.price = item.finalPrice;
    item.unitPrice = item.finalPrice;
    item.promoId = String(calc.promo.id || '');
    item.promoName = String(calc.promo.name || calc.promo.title || _promoBenefitLabel(calc));
    item.promoType = calc.type;
    item.promoLeve = calc.leve || 0;
    item.promoPague = calc.pague || 0;
    item.promoBundleMatchMode = calc.bundleMatchMode || 'same_product';
    item.priceOrigin = 'promo';
    return item;
  }

  function _bestPromoForProduct(product) {
    if (!product || !product.id) return null;
    var candidates = [];
    if (product.promo && typeof product.promo === 'object') candidates.push(product.promo);
    (_data.promotions || []).forEach(function (promo) {
      if (_promoActiveNow(promo) && _promoHasProduct(promo, product.id) && _promoAllowsTpv(promo)) candidates.push(promo);
    });
    candidates = candidates.map(function (promo) {
      return _promoCalc(product, promo);
    }).filter(Boolean).sort(function (a, b) {
      var pa = _num(a.promo && (a.promo.priority || a.promo.order || 0));
      var pb = _num(b.promo && (b.promo.priority || b.promo.order || 0));
      if (pa !== pb) return pb - pa;
      return _num(b.discount) - _num(a.discount);
    });
    return candidates[0] || null;
  }

  function _promoCalc(product, promo) {
    var original = _productPrice(product);
    if (!(original > 0)) return null;
    var type = _promoType(promo.type || promo.tipo || promo.discountType || promo.benefitType || '');
    var value = _promoNumber(promo.valuePercentual != null ? promo.valuePercentual : promo.percentual != null ? promo.percentual : promo.discountPct != null ? promo.discountPct : promo.pctValue != null ? promo.pctValue : promo.value);
    var eur = _promoNumber(promo.valueDesconto != null ? promo.valueDesconto : promo.eurValue != null ? promo.eurValue : promo.fixedDiscount != null ? promo.fixedDiscount : promo.discountValue != null ? promo.discountValue : promo.valorDesconto);
    var fixedPrice = _promoNumber(promo.fixedPrice != null ? promo.fixedPrice : promo.finalPrice != null ? promo.finalPrice : promo.offerPrice != null ? promo.offerPrice : promo.priceFixed);
    var legacyQtyPromo = /^(2x1|2por1|two_for_one|b2x1)$/i.test(String(promo.type || promo.tipo || promo.discountType || promo.benefitType || ''));
    var leve = parseInt(promo.leveQtd != null ? promo.leveQtd : (promo.bundleQty != null ? promo.bundleQty : (legacyQtyPromo ? 2 : 0)), 10) || 0;
    var pague = parseInt(promo.pagueQtd != null ? promo.pagueQtd : (promo.bundlePay != null ? promo.bundlePay : (legacyQtyPromo ? 1 : 0)), 10) || 0;
    var final = original;
    if (type === 'pct' && value > 0) final = original * (1 - Math.min(value, 100) / 100);
    else if (type === 'eur' && eur > 0) final = Math.max(original - eur, 0);
    else if (type === 'fixed' && fixedPrice > 0) final = Math.max(Math.min(fixedPrice, original), 0);
    else if (type === 'add1' && leve > 0 && pague > 0 && leve > pague) final = Math.max((original * pague) / leve, 0);
    var discount = Math.max(original - final, 0);
    if (!(discount > 0)) return null;
    return { promo: promo, type: type, value: value || eur || fixedPrice, leve: leve, pague: pague, bundleMatchMode: _promoBundleMatchMode(promo), originalPrice: original, finalPrice: final, discount: discount };
  }

  function _promoBenefitLabel(calc) {
    if (!calc) return 'Promoção';
    if (calc.type === 'pct') return '-' + Math.round(calc.value || 0) + '%';
    if (calc.type === 'eur') return '- ' + _fmtMoney(calc.value || 0);
    if (calc.type === 'fixed') return 'Preço especial';
    if (calc.type === 'add1') return 'Leve ' + calc.leve + ', pague ' + calc.pague;
    return 'Promoção';
  }

  function _promoType(value) {
    var t = _fold(value || '');
    if (t === 'pct' || t === 'percent' || t === 'percentual' || t === 'desconto_percentual') return 'pct';
    if (t === 'eur' || t === 'money' || t === 'valor' || t === 'valor_fixo' || t === 'desconto_valor' || t === 'fixed_discount') return 'eur';
    if (t === 'fixed' || t === 'preco_fixo' || t === 'fixed_price' || t === 'price_fixed' || t === 'oferta_dia') return 'fixed';
    if (t === '2x1' || t === '2por1' || t === 'two_for_one' || t === 'b2x1' || t === 'add1' || t === 'leve_mais' || t === 'promo_leve_mais' || t === 'combo_extra' || t === 'combo_sugerido' || t === 'extra_combo' || t === 'upgrade' || t === 'bundle_less_pay_more' || t === 'pack') return 'add1';
    if (t === 'frete' || t === 'frete_gratis' || t === 'free_shipping' || t === 'shipping_free') return 'frete';
    return t;
  }

  function _promoBundleMatchMode(promo) {
    var t = _fold(promo && (promo.bundleMatchMode || promo.bundleScope || promo.benefitProductRule || promo.matchMode || '') || '');
    return t === 'any_participant' || t === 'any' || t === 'mixed' || t === 'mix' || t === 'todos_participantes' || t === 'qualquer_participante'
      ? 'any_participant'
      : 'same_product';
  }

  function _promoNumber(value) {
    var str = String(value == null ? '' : value).trim();
    if (!str) return 0;
    var cleaned = str.replace(/[^\d,.-]/g, '');
    if (!cleaned) return 0;
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    else cleaned = cleaned.replace(/,/g, '');
    var n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }

  function _promoActiveNow(promo) {
    if (!promo || promo.active === false || promo.enabled === false) return false;
    var status = _fold(promo.status || '');
    if (status === 'paused' || status === 'pausada' || status === 'pausado' || status === 'expirada' || status === 'expirado' || status === 'finalizada' || status === 'inativa') return false;
    var now = new Date();
    var startRaw = promo.startDate || promo.startsAt || promo.startsAtDate || promo.from || promo.start || '';
    var endRaw = promo.endDate || promo.endsAt || promo.endsAtDate || promo.to || promo.end || '';
    if (startRaw) {
      var start = new Date(startRaw);
      if (!isNaN(start.getTime()) && now < start) return false;
    }
    if (endRaw) {
      var end = new Date(endRaw);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        if (now > end) return false;
      }
    }
    return true;
  }

  function _promoHasProduct(promo, productId) {
    if (!promo) return false;
    if (promo.applyTo === 'all' || promo.scope === 'todos_produtos') return true;
    var ids = [];
    if (Array.isArray(promo.productIds)) ids = ids.concat(promo.productIds);
    if (Array.isArray(promo.productsSelected)) ids = ids.concat(promo.productsSelected);
    if (Array.isArray(promo.suggestedProductIds)) ids = ids.concat(promo.suggestedProductIds);
    if (Array.isArray(promo.products)) ids = ids.concat(promo.products);
    if (Array.isArray(promo.items)) ids = ids.concat(promo.items);
    if (promo.productId) ids.push(promo.productId);
    if (promo.suggestedProductId) ids.push(promo.suggestedProductId);
    return ids.map(function (x) { return String(x && (x.id || x.productId || x.value) || x).trim(); }).indexOf(String(productId || '')) >= 0;
  }

  function _promoAllowsTpv(promo) {
    var channels = promo.channels || promo.canais || promo.salesChannels || promo.channelsText || promo.channel || '';
    if (!Array.isArray(channels)) channels = String(channels || '').split(/[,;]/).filter(Boolean);
    if (!channels.length) return true;
    return channels.some(function (ch) {
      var key = _fold(ch && (ch.name || ch.label || ch.value) || ch);
      return key === 'tpv' || key === 'venda presencial' || key === 'venda_presencial' || key === 'presencial' || key === 'todos' || key === 'all';
    });
  }

  function _paymentOptions() {
    var source = [];
    var finance = _data.finance || {};
    if (Array.isArray(finance.formas_pagamento)) source = finance.formas_pagamento.slice();
    else if (Array.isArray(finance.paymentMethodConfigs)) source = finance.paymentMethodConfigs.slice();
    else if (Array.isArray(finance.paymentMethods)) source = finance.paymentMethods.slice();
    else if (Array.isArray(finance.formasPagamento)) source = finance.formasPagamento.slice();
    var seen = {};
    var list = source.map(function (item) {
      var raw = _paymentRaw(item);
      var inactive = item && typeof item === 'object' && (item.ativo === false || item.active === false || item.enabled === false);
      return { value: _paymentValue(raw), label: _paymentLabel(raw), active: !inactive };
    }).filter(function (item) {
      if (!item.value || item.active === false) return false;
      if (seen[item.value]) return false;
      seen[item.value] = true;
      return true;
    });
    return list;
  }

  function _defaultPaymentValue(value) {
    var desired = _paymentValue(value || '');
    var options = _paymentOptions();
    if (options.some(function (opt) { return opt.value === desired; })) return desired;
    return options[0] ? options[0].value : '';
  }

  function _paymentValue(value) {
    var key = _fold(value || '');
    var map = { dinheiro: 'cash', efectivo: 'cash', efetivo: 'cash', dinero: 'cash', cash: 'cash', cartao: 'card', cartão: 'card', tarjeta: 'card', card: 'card', pix: 'pix', bizum: 'bizum', mbway: 'mbway', 'mb way': 'mbway', transferencia: 'transfer', transferência: 'transfer', transfer: 'transfer', 'transferencia bancaria': 'transfer', multibanco: 'multibanco', cheque: 'cheque', outro: 'other', other: 'other', otro: 'other' };
    return map[key] || key || 'cash';
  }

  function _paymentRaw(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return value.nome || value.name || value.label || value.title || value.text || value.value || value.tipoGlobalNome || value.typeName || value.id || value.slug || '';
  }

  function _paymentLabel(value) {
    var raw = _paymentRaw(value);
    var key = _fold(raw || '');
    var labels = { cash: 'Dinheiro', dinheiro: 'Dinheiro', efectivo: 'Dinheiro', efetivo: 'Dinheiro', dinero: 'Dinheiro', card: 'Cartão', cartao: 'Cartão', cartão: 'Cartão', tarjeta: 'Cartão', pix: 'PIX', bizum: 'Bizum', mbway: 'MB Way', 'mb way': 'MB Way', transfer: 'Transferência', transferencia: 'Transferência', transferência: 'Transferência', 'transferencia bancaria': 'Transferência', multibanco: 'Multibanco', cheque: 'Cheque', other: 'Outro', outro: 'Outro', otro: 'Outro' };
    return labels[key] || raw || 'Forma de pagamento';
  }

  function _orderTotal(o) {
    return _num(o.total != null ? o.total : o.totalAmount != null ? o.totalAmount : o.amount);
  }

  function _sum(list, fn) {
    return (list || []).reduce(function (acc, item) { return acc + _num(fn(item)); }, 0);
  }

  function _num(v) {
    var n = parseFloat(String(v == null ? 0 : v).replace(',', '.'));
    return isFinite(n) ? n : 0;
  }

  function _truthy(v) {
    return v === true || v === 1 || String(v || '').toLowerCase() === 'true' || String(v || '').toLowerCase() === 'sim';
  }

  function _dateKey(v) {
    var d = v instanceof Date ? v : new Date(v || Date.now());
    if (isNaN(d.getTime())) d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function _dateLabel(v) {
    var d = new Date(v || Date.now());
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function _ts(v) {
    var d = new Date(v || 0);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function _fmtMoney(v) {
    try { return Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }); }
    catch (e) { return 'EUR ' + Number(v || 0).toFixed(2); }
  }

  function _fold(v) {
    return String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function _chip(text) {
    return '<span style="display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:600;">' + _esc(text) + '</span>';
  }

  function _statusChip(text, color, icon) {
    return '<span style="display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:1px solid rgba(31,31,31,.06);border-radius:10px;background:#fff;color:' + color + ';font-size:12px;font-weight:800;"><span class="mi" style="font-size:16px;">' + icon + '</span>' + _esc(text) + '</span>';
  }

  function _totalRow(label, value, strong) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;"><span style="font-size:' + (strong ? '14px' : '12px') + ';color:#6F6860;font-weight:' + (strong ? '800' : '500') + ';">' + _esc(label) + '</span><strong style="font-size:' + (strong ? '24px' : '13px') + ';color:#1F1F1F;">' + _fmtMoney(value) + '</strong></div>';
  }

  function _emptyProductsHtml() {
    return '<div style="grid-column:1/-1;padding:34px 16px;text-align:center;color:#6F6860;border:1px dashed #EAE4DA;border-radius:14px;background:#FAF8F4;font-size:13px;">Nenhum produto encontrado.</div>';
  }

  function _qtyBtnStyle() {
    return 'width:30px;height:30px;border-radius:8px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;cursor:pointer;font-size:15px;font-weight:800;font-family:inherit;';
  }

  function _smallLabelStyle() {
    return 'display:block;font-size:11px;font-weight:700;color:#6F6860;margin-bottom:5px;';
  }

  function _smallInputStyle() {
    return 'width:100%;height:38px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;';
  }

  function _cardStyle() {
    return 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }

  function _jsArg(value) {
    return JSON.stringify(String(value == null ? '' : value)).replace(/</g, '\\u003C');
  }

  function _safeId(value) {
    return String(value == null ? '' : value).replace(/[^\w-]/g, '_');
  }

  return {
    render: render,
    destroy: destroy,
    _addProduct: _addProduct,
    _changeQty: _changeQty,
    _removeItem: _removeItem,
    _setSearch: _setSearch,
    _setCategory: _setCategory,
    _setRecentPage: _setRecentPage,
    _setRecentPageSize: _setRecentPageSize,
    _setPayment: _setPayment,
    _syncChoiceGroup: _syncChoiceGroup,
    _saveProductChoices: _saveProductChoices,
    _closeChoiceModal: _closeChoiceModal,
    _setCashReceived: _setCashReceived,
    _clearCart: _clearCart,
    _toggleCash: _toggleCash,
    _openCashModal: _openCashModal,
    _saveOpenCash: _saveOpenCash,
    _openCashMovementModal: _openCashMovementModal,
    _saveCashMovement: _saveCashMovement,
    _openCloseCashModal: _openCloseCashModal,
    _refreshCloseCashDiff: _refreshCloseCashDiff,
    _saveCloseCash: _saveCloseCash,
    _finishSale: _finishSale
  };
})();
