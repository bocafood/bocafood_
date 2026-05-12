// js/modules/pos.js
window.Modules = window.Modules || {};
Modules.POS = (function () {
  'use strict';

  var _data = { cfg: {}, orders: [], products: [], categories: [], promotions: [] };
  var _loading = false;
  var _saving = false;
  var _cart = [];
  var _query = '';
  var _category = 'all';
  var _paymentMethod = 'cash';
  var _cashReceived = '';
  var _lastAddedId = '';

  function render() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<section class="module-page pos-page" style="padding:24px;display:flex;flex-direction:column;gap:16px;">' +
      '<div id="pos-content" class="module-content"><div class="loading-inline">Carregando...</div></div>' +
    '</section>';
    _loading = true;
    _paint();
    _load().then(function () {
      _paymentMethod = _paymentValue(_data.cfg.defaultPaymentMethod || _paymentMethod);
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
      DB.getAll('promotions').catch(function () { return []; })
    ]).then(function (r) {
      _data.cfg = r[0] || {};
      _data.orders = Array.isArray(r[1]) ? r[1] : [];
      _data.products = Array.isArray(r[2]) ? r[2] : [];
      _data.categories = Array.isArray(r[3]) ? r[3] : [];
      _data.promotions = Array.isArray(r[4]) ? r[4] : [];
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
        '<section class="pos-recent-panel">' + _recentHtml() + '</section>' +
      '</div>';
  }

  function _styles() {
    return '<style>' +
      '.pos-root{display:flex;flex-direction:column;gap:16px;}' +
      '.pos-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,410px);gap:16px;align-items:start;}' +
      '.pos-products-panel,.pos-cart-panel,.pos-recent-panel{background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);}' +
      '.pos-cart-panel{position:sticky;top:66px;}' +
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
      '.pos-cat-bar{display:flex;gap:8px;overflow:auto;padding:2px 0 12px;margin-bottom:12px;}' +
      '.pos-cat-btn{height:34px;padding:0 12px;border:1px solid #EAE4DA;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer;font-family:inherit;}' +
      '.pos-cat-btn.active{background:#B42318;color:#fff;border-color:#B42318;box-shadow:0 8px 18px rgba(180,35,24,.12);}' +
      '.pos-pay-segment{height:36px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}' +
      '.pos-pay-segment.active{background:#1F1F1F;color:#fff;border-color:#1F1F1F;}' +
      '@media (max-width:980px){.pos-main{grid-template-columns:1fr}.pos-cart-panel{position:static}.pos-product-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));}.pos-product-img{height:104px;}}' +
    '</style>';
  }

  function _header(count, total) {
    var cashOpen = _isCashOpen();
    var operator = _operatorName();
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
      '<div style="min-width:0;">' +
        '<h1 style="font-size:22px;font-weight:700;color:#1F1F1F;line-height:1.15;margin:0 0 6px;">Venda presencial</h1>' +
        '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:760px;">TPV rápido para balcão: escolha produtos, confira o carrinho e finalize com pagamento básico.</p>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center;">' +
        _statusChip(cashOpen ? 'Caixa aberto' : 'Caixa fechado', cashOpen ? '#1F6F43' : '#B45309', cashOpen ? 'point_of_sale' : 'lock') +
        _chip('Operador: ' + operator) +
        _chip(count + ' venda(s) hoje') +
        _chip(_fmtMoney(total) + ' vendido hoje') +
        '<button type="button" onclick="Modules.POS._toggleCash()" style="height:36px;padding:0 12px;border:none;border-radius:10px;background:' + (cashOpen ? '#1F1F1F' : '#B42318') + ';color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">' + (cashOpen ? 'Fechar caixa' : 'Abrir caixa') + '</button>' +
        '<button type="button" onclick="Modules.POS._clearCart()" style="height:36px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Limpar carrinho</button>' +
      '</div>' +
    '</div>';
  }

  function _catalogHtml() {
    var products = _filteredProducts();
    return '<div style="position:sticky;top:50px;z-index:4;background:#fff;padding-bottom:10px;margin-bottom:4px;border-bottom:1px solid #F2EDED;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">' +
        '<div><h2 style="font-size:16px;font-weight:700;color:#1F1F1F;margin:0 0 4px;">Produtos</h2><p style="font-size:13px;color:#6F6860;margin:0;">Filtre por categoria ou busque por nome, categoria e descrição.</p></div>' +
        '<div style="position:relative;width:min(100%,340px);"><span class="mi" style="position:absolute;left:11px;top:9px;font-size:18px;color:#8A7E7C;">search</span><input type="search" value="' + _esc(_query) + '" oninput="Modules.POS._setSearch(this.value)" placeholder="Buscar produto" style="width:100%;height:38px;padding:0 12px 0 36px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-family:inherit;outline:none;"></div>' +
      '</div>' +
      _categoryBar() +
    '</div>' +
    '<div id="pos-product-grid" class="pos-product-grid">' +
      (products.length ? products.map(_productCard).join('') : _emptyProductsHtml()) +
    '</div>';
  }

  function _categoryBar() {
    var cats = _categoryOptions();
    return '<div class="pos-cat-bar">' + cats.map(function (cat) {
      return '<button type="button" class="pos-cat-btn' + (_category === cat.key ? ' active' : '') + '" onclick="Modules.POS._setCategory(\'' + _esc(cat.key) + '\')">' + _esc(cat.label) + '</button>';
    }).join('') + '</div>';
  }

  function _productCard(product) {
    var id = String(product.id || '');
    var cat = _productCategoryLabel(product);
    var tone = _categoryTone(cat);
    var price = _productPrice(product);
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
        '<span style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;"><b style="font-size:17px;color:#B42318;">' + _fmtMoney(price) + '</b><span class="pos-add-btn" style="min-width:82px;">' + (available ? '<span class="mi" style="font-size:17px;">add</span>Adicionar' : 'Bloqueado') + '</span></span>' +
      '</div>' +
    '</button>';
  }

  function _cartHtml() {
    var totals = _cartTotals();
    var hasItems = _cart.length > 0;
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
        '<div style="display:flex;gap:7px;flex-wrap:wrap;">' + _paymentSegments() + '</div>' +
        (_paymentMethod === 'cash' && hasItems ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;"><label><span style="' + _smallLabelStyle() + '">Recebido</span><input type="number" step="0.01" value="' + _esc(_cashReceived) + '" oninput="Modules.POS._setCashReceived(this.value)" placeholder="0,00" style="' + _smallInputStyle() + '"></label><div><span style="' + _smallLabelStyle() + '">Troco</span><div id="pos-cash-change" style="' + _smallInputStyle() + 'background:#FAF8F4;display:flex;align-items:center;font-weight:800;">' + _fmtMoney(change) + '</div></div></div>' : '') +
      '</div>' +
      '<div style="display:grid;gap:6px;border-top:1px solid #F2EDED;padding-top:12px;">' +
        _totalRow('Subtotal', totals.subtotal, false) +
        _totalRow('Total', totals.total, true) +
      '</div>' +
      '<button type="button" onclick="Modules.POS._finishSale()" ' + (!hasItems || _saving || !_isCashOpen() ? 'disabled' : '') + ' style="height:44px;border:none;border-radius:10px;background:' + (hasItems && !_saving && _isCashOpen() ? '#B42318' : '#D8CEC2') + ';color:#fff;font-size:13px;font-weight:800;cursor:' + (hasItems && !_saving && _isCashOpen() ? 'pointer' : 'not-allowed') + ';font-family:inherit;box-shadow:' + (hasItems && !_saving && _isCashOpen() ? '0 10px 22px rgba(180,35,24,.16)' : 'none') + ';">' + (_saving ? 'Salvando...' : (hasItems ? 'Finalizar venda — ' + _fmtMoney(totals.total) : 'Finalizar venda')) + '</button>' +
      (!_isCashOpen() ? '<div style="font-size:11px;color:#B45309;text-align:center;">Abra o caixa para finalizar vendas.</div>' : '') +
    '</div>';
  }

  function _cartRow(item) {
    var subtotal = _num(item.finalPrice) * _num(item.quantity || 1);
    return '<div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start;border:1px solid #EAE4DA;border-radius:12px;padding:10px;background:#fff;">' +
      '<div style="min-width:0;"><strong style="display:block;font-size:13px;color:#1F1F1F;line-height:1.25;">' + _esc(item.name) + '</strong><span style="display:block;font-size:11px;color:#6F6860;margin-top:3px;">Unitário ' + _fmtMoney(item.finalPrice) + ' · subtotal ' + _fmtMoney(subtotal) + '</span>' + (item.note ? '<span style="display:block;font-size:11px;color:#8A7E7C;margin-top:3px;">Obs.: ' + _esc(item.note) + '</span>' : '') + '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<button type="button" onclick="Modules.POS._changeQty(\'' + _esc(item.productId) + '\',-1)" title="Diminuir" style="' + _qtyBtnStyle() + '">−</button>' +
        '<strong style="min-width:22px;text-align:center;font-size:13px;color:#1F1F1F;">' + item.quantity + '</strong>' +
        '<button type="button" onclick="Modules.POS._changeQty(\'' + _esc(item.productId) + '\',1)" title="Adicionar" style="' + _qtyBtnStyle() + 'background:#B42318;color:#fff;border-color:#B42318;">+</button>' +
        '<button type="button" onclick="Modules.POS._removeItem(\'' + _esc(item.productId) + '\')" title="Remover" style="' + _qtyBtnStyle() + 'color:#B42318;">×</button>' +
      '</div>' +
    '</div>';
  }

  function _recentHtml() {
    var list = _tpvOrders().slice(0, 6);
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">' +
      '<div><h2 style="font-size:16px;font-weight:700;color:#1F1F1F;margin:0 0 4px;">Últimas vendas presenciais</h2><p style="font-size:13px;color:#6F6860;margin:0;">Pedidos registrados com canal TPV.</p></div>' +
      '<button type="button" onclick="Router.navigate(\'pedidos/lista\')" style="height:36px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Ver pedidos</button>' +
    '</div>' + _ordersTable(list);
  }

  function _addProduct(id) {
    var product = _data.products.find(function (p) { return String(p.id || '') === String(id || ''); });
    if (!product || !_isProductAvailable(product)) return;
    var existing = _cart.find(function (item) { return item.productId === String(id); });
    if (existing) existing.quantity += 1;
    else _cart.push({ productId: String(id), name: _productName(product), category: _productCategoryLabel(product), quantity: 1, originalPrice: _productPrice(product), finalPrice: _productPrice(product), priceOrigin: 'manual', manualAdjustment: 0 });
    _lastAddedId = String(id);
    _paint();
    window.setTimeout(function () {
      if (_lastAddedId === String(id)) {
        _lastAddedId = '';
        var card = document.querySelector('[data-pos-product-id="' + String(id).replace(/"/g, '\\"') + '"]');
        if (card) card.classList.remove('added');
      }
    }, 450);
  }

  function _changeQty(id, delta) {
    var item = _cart.find(function (x) { return x.productId === String(id || ''); });
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) _cart = _cart.filter(function (x) { return x !== item; });
    _paint();
  }

  function _removeItem(id) {
    _cart = _cart.filter(function (item) { return item.productId !== String(id || ''); });
    _paint();
  }

  function _setSearch(value) {
    _query = String(value || '');
    _refreshProductGrid();
  }

  function _setCategory(value) {
    _category = String(value || 'all');
    _paint();
  }

  function _setPayment(value) {
    _paymentMethod = _paymentValue(value || 'cash');
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
    var nextOpen = !_isCashOpen();
    var patch = { cashOpen: nextOpen, cashStatus: nextOpen ? 'open' : 'closed', cashUpdatedAt: new Date().toISOString() };
    _data.cfg = Object.assign({}, _data.cfg || {}, patch);
    _paint();
    DB.setDocRoot('config', 'tpv', patch).then(function () {
      if (window.UI && UI.toast) UI.toast(nextOpen ? 'Caixa aberto.' : 'Caixa fechado.', 'success');
    }).catch(function (err) {
      if (window.UI && UI.toast) UI.toast('Erro ao atualizar caixa: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _finishSale() {
    if (_saving || !_cart.length || !_isCashOpen()) return;
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
      items: _cart.map(function (item) { return Object.assign({}, item); }),
      subtotalOriginal: totals.subtotal,
      subtotal: totals.subtotal,
      subtotalFinal: totals.subtotal,
      total: totals.total,
      paymentMethod: _paymentMethod,
      paymentStatus: 'pago',
      customerName: 'Cliente balcão',
      note: _paymentMethod === 'cash' && _cashReceived ? ('Recebido: ' + _fmtMoney(_num(_cashReceived)) + ' · Troco: ' + _fmtMoney(Math.max(0, _num(_cashReceived) - totals.total))) : ''
    }).then(function (order) {
      _data.orders.unshift(order);
      _cart = [];
      _cashReceived = '';
      if (window.UI && UI.toast) UI.toast('Venda TPV registrada.', 'success');
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
        '<div style="min-width:0;"><h1 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;">TPV desativado</h1>' +
        '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0 0 14px;">Ative o TPV nas configurações da loja para liberar a tela Venda presencial no menu.</p>' +
        '<button type="button" onclick="Router.navigate(\'configuracoes/tpv\')" style="height:40px;padding:0 15px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Abrir configurações</button></div>' +
      '</div>' +
    '</section>';
  }

  function _permissionHtml() {
    return '<section style="' + _cardStyle() + 'max-width:820px;color:#1F1F1F;">' +
      '<div style="display:flex;align-items:flex-start;gap:14px;">' +
        '<span class="mi" style="width:42px;height:42px;border-radius:13px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;font-size:23px;flex:0 0 auto;">lock</span>' +
        '<div style="min-width:0;"><h1 style="font-size:22px;font-weight:700;margin:0 0 6px;">Sem permissão para TPV</h1>' +
        '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">Este acesso está restrito a dono da loja, equipe da loja ou master admin.</p></div>' +
      '</div>' +
    '</section>';
  }

  function _paintError(err) {
    var content = document.getElementById('pos-content');
    if (!content) return;
    content.innerHTML = '<section style="' + _cardStyle() + 'color:#B42318;font-size:13px;">Erro ao carregar TPV: ' + _esc((err && err.message) || err || 'desconhecido') + '</section>';
  }

  function _categoryOptions() {
    var out = [{ key: 'all', label: 'Todos' }, { key: 'best', label: 'Mais vendidos' }];
    var preferred = ['Menus', 'Salgados', 'Doces', 'Bebidas', 'Combos', 'Promoções'];
    var real = _realCategoryNames();
    preferred.forEach(function (label) {
      var found = real.find(function (name) { return _categoryGroup(name) === _categoryGroup(label) || _fold(name) === _fold(label); });
      var key = label === 'Promoções' ? 'promo' : ('cat:' + (found || label));
      out.push({ key: key, label: found || label });
    });
    real.forEach(function (name) {
      if (!out.some(function (c) { return _fold(c.label) === _fold(name); })) out.push({ key: 'cat:' + name, label: name });
    });
    return out;
  }

  function _realCategoryNames() {
    var names = [];
    (_data.categories || []).forEach(function (c) {
      var name = c && (c.name || c.label || c.title || c.slug || c.id);
      if (name && !names.some(function (x) { return _fold(x) === _fold(name); })) names.push(String(name));
    });
    (_data.products || []).forEach(function (p) {
      var name = _productCategoryLabel(p);
      if (name && name !== 'Produto' && !names.some(function (x) { return _fold(x) === _fold(name); })) names.push(name);
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
      return p && p.deleted !== true && p.archived !== true && p.hide !== true && _productPrice(p) > 0;
    }).sort(function (a, b) {
      return (_num(a.order) - _num(b.order)) || String(_productName(a)).localeCompare(String(_productName(b)));
    });
  }

  function _isProductAvailable(product) {
    if (!product) return false;
    if (product.available === false || product.disponivel === false || product.unavailable === true || product.indisponivel === true) return false;
    if (product.active === false || product.menuVisible === false || product.visible === false) return false;
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

  function _paymentSegments() {
    var options = [['cash', 'Dinheiro'], ['card', 'Cartão'], ['pix', 'Pix']];
    return options.map(function (opt) {
      return '<button type="button" class="pos-pay-segment' + (_paymentMethod === opt[0] ? ' active' : '') + '" onclick="Modules.POS._setPayment(\'' + opt[0] + '\')">' + opt[1] + '</button>';
    }).join('');
  }

  function _isCashOpen() {
    return _data.cfg.cashOpen !== false && _data.cfg.cashStatus !== 'closed';
  }

  function _operatorName() {
    var profile = window.Auth && Auth.getAdminProfile ? Auth.getAdminProfile() : null;
    var user = window.Auth && Auth.getUser ? Auth.getUser() : null;
    return String((profile && (profile.displayName || profile.name || profile.email)) || (user && (user.displayName || user.email)) || 'Operador');
  }

  function _canUseTpv() {
    var profile = window.Auth && Auth.getAdminProfile ? Auth.getAdminProfile() : null;
    var role = String((profile && profile.role) || '').trim();
    return role === 'master_admin' || role === 'master' || role === 'store_owner' || role === 'tenant_owner' || role === 'store_staff';
  }

  function _isEnabled(cfg) {
    return !!(cfg && (cfg.enabled === true || cfg.tpvEnabled === true || cfg.active === true));
  }

  function _cartTotals() {
    var subtotal = _sum(_cart, function (item) { return _num(item.finalPrice) * _num(item.quantity || 1); });
    return { subtotal: subtotal, total: subtotal };
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

  function _ordersTable(list) {
    if (!list.length) return '<div style="padding:28px 16px;text-align:center;color:#6F6860;font-size:13px;border:1px dashed #EAE4DA;border-radius:14px;background:#FAF8F4;">Nenhuma venda presencial registrada ainda.</div>';
    return '<div style="display:grid;gap:8px;">' + list.map(function (o) {
      return '<div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;border:1px solid #EAE4DA;border-radius:12px;padding:10px 12px;background:#fff;">' +
        '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(o.orderNumber || o.numero || o.id || 'Venda TPV') + '</div><div style="font-size:12px;color:#6F6860;margin-top:2px;">' + _esc(_dateLabel(o.createdAt || o.date || o.data)) + '</div></div>' +
        '<span style="font-size:12px;color:#6F6860;">' + _esc(o.status || 'Pendente') + '</span>' +
        '<strong style="font-size:13px;color:#1F1F1F;">' + _fmtMoney(_orderTotal(o)) + '</strong>' +
      '</div>';
    }).join('') + '</div>';
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

  function _paymentValue(value) {
    var key = _fold(value || '');
    var map = { dinheiro: 'cash', cash: 'cash', cartao: 'card', cartão: 'card', card: 'card', pix: 'pix' };
    return map[key] || 'cash';
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

  return {
    render: render,
    destroy: destroy,
    _addProduct: _addProduct,
    _changeQty: _changeQty,
    _removeItem: _removeItem,
    _setSearch: _setSearch,
    _setCategory: _setCategory,
    _setPayment: _setPayment,
    _setCashReceived: _setCashReceived,
    _clearCart: _clearCart,
    _toggleCash: _toggleCash,
    _finishSale: _finishSale
  };
})();
