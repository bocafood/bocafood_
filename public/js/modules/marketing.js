// js/modules/marketing.js
window.Modules = window.Modules || {};
Modules.Marketing = (function () {
  'use strict';

  var _activeSub = 'promocoes';
  var _promos = [];
  var _cupons = [];
  var _upsells = [];
  var _customers = [];
  var _reviews = [];
  var _products = [];
  var _orders = [];
  var _events = [];
  var _pointsConfig = null;
  var _pointsMovements = [];
  var _editingId = null;
  var _moneyConfig = { desiredMarginPct: 60, minMarginPct: 40 };
  var _reviewUi = {
    query: '',
    status: 'all',
    period: 'all',
    stars: 'all',
    periodStart: '',
    periodEnd: ''
  };
  var _upsellPerfUi = {
    period: 'last30',
    periodStart: '',
    periodEnd: ''
  };
  var _pointsPerfUi = {
    period: 'last30',
    periodStart: '',
    periodEnd: ''
  };
  var _upsellTab = 'desempenho';
  var _pointsTab = 'desempenho';
  var _pointsUi = {
    query: '',
    balance: 'all',
    movement: 'all'
  };
  var _upsellUi = {
    query: '',
    status: 'all',
    types: [],
    benefits: [],
    period: 'all',
    periodStart: '',
    periodEnd: '',
    productQuery: '',
    page: 1,
    pageSize: 10
  };
  var _promoUi = {
    query: '',
    status: 'all',
    type: 'all',
    period: 'all',
    periodStart: '',
    periodEnd: '',
    page: 1,
    pageSize: 10
  };
  var _couponUi = {
    query: '',
    status: 'all',
    type: 'all',
    page: 1,
    pageSize: 10
  };
  var firstText = window.firstText || function () {
    for (var i = 0; i < arguments.length; i += 1) {
      var v = arguments[i];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return '';
  };

  var TABS = [
    { key: 'promocoes', title: 'Vender mais rápido', subtitle: 'Promoções' },
    { key: 'upsell', title: 'Aumentar valor do pedido', subtitle: 'Upsell' },
    { key: 'cupons', title: 'Atrair clientes', subtitle: 'Cupons' },
    { key: 'pontos', title: 'Fidelizar clientes', subtitle: 'Programa de Pontos' }
  ];

  var PROMO_TYPES = [
    { key: 'pct', label: 'Desconto (%)', hint: 'Mais volume de vendas', icon: '%' },
    { key: 'eur', label: 'Desconto (€)', hint: 'Controle direto do valor', icon: '€' },
    { key: 'add1', label: 'Leve X, pague Y', hint: 'Inclui 2 por 1, leve 3 pague 2 e outras combinações', icon: '+' },
    { key: 'frete', label: 'Frete grátis', hint: 'Libera frete ao atingir valor mínimo', icon: 'local_shipping' }
  ];

  var PROMO_TYPE_FALLBACKS = {
    extra_combo: { key: 'add1', label: 'Combo extra', hint: 'Oferta combinada', icon: '+' },
    upgrade: { key: 'add1', label: 'Upgrade', hint: 'Oferta superior', icon: '↑' },
    pack: { key: 'add1', label: 'Leve X, pague Y', hint: 'Pacote promocional', icon: '+' },
    fixed: { key: 'fixed', label: 'Preço fixo', hint: 'Oferta do dia', icon: '€' }
  };

  function render(sub) {
    _activeSub = sub || 'promocoes';
    var app = document.getElementById('app');
    app.innerHTML = '<div id="marketing-root" style="display:flex;flex-direction:column;height:100%;">' +
      '<div id="marketing-content" style="flex:1;overflow-y:auto;padding:24px;"></div>' +
      '</div>';

    _loadSub(_activeSub);
  }

  function _renderTabs() {
    var el = document.getElementById('marketing-tabs');
    if (!el) return;
    el.innerHTML = TABS.map(function (t) {
      var active = t.key === _activeSub;
      return '<button data-key="' + t.key + '" onclick="Modules.Marketing._switchSub(\'' + t.key + '\')" style="padding:12px 18px 11px;border:none;background:transparent;cursor:pointer;border-bottom:3px solid ' + (active ? '#C4362A' : 'transparent') + ';color:' + (active ? '#C4362A' : '#8A7E7C') + ';font-family:inherit;transition:all .15s;white-space:nowrap;text-align:left;display:flex;flex-direction:column;align-items:flex-start;gap:2px;">' +
        '<span style="font-size:13px;font-weight:800;line-height:1.15;">' + t.title + '</span>' +
        '<span style="font-size:11px;font-weight:700;line-height:1.1;color:' + (active ? '#C4362A' : '#9A8F8D') + ';">' + t.subtitle + '</span>' +
      '</button>';
    }).join('');
  }

  function _subActionLabel() {
    if (_activeSub === 'promocoes') return '+ Nova Promoção';
    if (_activeSub === 'upsell') return '+ Novo Upsell';
    if (_activeSub === 'cupons') return '+ Novo Cupom';
    if (_activeSub === 'pontos') return '+ Configurar Programa';
    return 'Configurar Avaliações';
  }

  function _reviewAction() {
    _reviewPublicUrl().then(function (url) {
      if (url) {
        window.open(url, '_blank');
        return;
      }
      UI.toast('Configure o link da loja para abrir a página pública de avaliações.', 'info');
    }).catch(function () {
      UI.toast('Não foi possível abrir o link de avaliações agora.', 'error');
    });
  }

  function _reviewPublicUrl() {
    return _safeGetDocRoot('config', 'dominio').then(function (dominio) {
      dominio = dominio || {};
      if (dominio.reviewUrl) return dominio.reviewUrl;
      var publicUrl = String(dominio.publicUrl || dominio.siteUrl || '').replace(/\/+$/, '');
      if (publicUrl) return publicUrl + '/review';
      var slug = String(dominio.storeSlug || dominio.slug || dominio.subdomain || '').trim();
      return slug ? ('https://bocafood.app/' + encodeURIComponent(slug) + '/review') : '';
    });
  }

  function _storePublicUrl() {
    return _safeGetDocRoot('config', 'dominio').then(function (dominio) {
      dominio = dominio || {};
      var publicUrl = String(dominio.publicUrl || dominio.siteUrl || '').replace(/\/+$/, '');
      if (publicUrl) return publicUrl;
      var slug = String(dominio.storeSlug || dominio.slug || dominio.subdomain || '').trim();
      return slug ? ('https://bocafood.app/' + encodeURIComponent(slug)) : '';
    });
  }

  function _couponCodeText(coupon) {
    return String(coupon && (coupon.code || coupon.codigo || coupon.name || coupon.id) || '').trim().toUpperCase();
  }

  function _couponAutoLink(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return Promise.resolve('');
    return _storePublicUrl().then(function (url) {
      if (!url) return '';
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
      var finalUrl = new URL(url);
      finalUrl.searchParams.set('cupom', code);
      return finalUrl.toString();
    }).catch(function () { return ''; });
  }

  function _couponLinkSectionHtml(coupon) {
    var code = _couponCodeText(coupon);
    var cardStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:15px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);';
    var fieldStyle = _marketingInputStyle() + 'background:#FFFCF8;border-color:#E8DCD7;border-radius:12px;max-width:100%;box-sizing:border-box;min-width:0;';
    return '<section style="' + cardStyle + '">' +
      '<div style="display:flex;align-items:flex-start;gap:9px;">' +
        '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1;overflow:hidden;flex:0 0 auto;">link</span>' +
        '<div><div style="font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.25;">Link com desconto automático</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">Divulgue o cupom já aplicado na loja.</div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;margin-top:10px;">' +
        '<input id="cup-auto-link" readonly value="' + (code ? 'Gerando link...' : 'Salve o código do cupom para gerar o link.') + '" style="' + fieldStyle + 'color:#1F1F1F;">' +
        '<button type="button" onclick="Modules.Marketing._copyCouponLink()" style="height:38px;padding:0 13px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.14);">Copiar</button>' +
      '</div>' +
    '</section>';
  }

  function _renderCouponLink(coupon) {
    var input = document.getElementById('cup-auto-link');
    if (!input) return;
    var code = _couponCodeText(coupon);
    if (!code) {
      input.value = 'Salve o código do cupom para gerar o link.';
      return;
    }
    _couponAutoLink(code).then(function (url) {
      input.value = url || 'Configure o link da loja para gerar o link do cupom.';
    });
  }

  function _copyCouponLink() {
    var input = document.getElementById('cup-auto-link');
    var value = input ? String(input.value || '') : '';
    if (!value || value.indexOf('http') !== 0) {
      UI.toast('Link do cupom ainda não disponível.', 'info');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        UI.toast('Link do cupom copiado.', 'success');
      }).catch(function () {
        input.select();
        document.execCommand('copy');
        UI.toast('Link do cupom copiado.', 'success');
      });
      return;
    }
    input.select();
    document.execCommand('copy');
    UI.toast('Link do cupom copiado.', 'success');
  }

  function _normalizeMoneyConfig(c) {
    c = c || {};
    return {
      desiredMarginPct: _promoNumber(c.desiredMarginPct != null ? c.desiredMarginPct : c.margemDesejadaPct != null ? c.margemDesejadaPct : 60),
      minMarginPct: _promoNumber(c.minMarginPct != null ? c.minMarginPct : c.margemMinimaPct != null ? c.margemMinimaPct : 40)
    };
  }

  function _safeGetAll(col) {
    return Promise.resolve().then(function () {
      return DB.getAll(col);
    }).catch(function () {
      return [];
    });
  }

  function _safeGetDocRoot(col, id) {
    return Promise.resolve().then(function () {
      return DB.getDocRoot(col, id);
    }).catch(function () {
      return null;
    });
  }

  function _pointsDefaultConfig() {
    return {
      earnPerEuro: 1,
      redeemRate: 10,
      minimumPointsToUse: 50,
      maxDiscountPct: 20,
      pointsExpire: false,
      pointsExpirationDays: 0,
      autoApply: false,
      active: true,
      programName: 'Programa de Pontos',
      storeText: 'Acumule pontos a cada pedido finalizado e use como desconto em compras futuras.'
    };
  }

  function _pointsNumber(value) {
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

  function _normalizePointsConfig(raw) {
    raw = raw || {};
    var defaults = _pointsDefaultConfig();
    return {
      earnPerEuro: Math.max(1, Math.round(_pointsNumber(raw.earnPerEuro != null ? raw.earnPerEuro : raw.pointsPerEuro != null ? raw.pointsPerEuro : raw.earnRate != null ? raw.earnRate : defaults.earnPerEuro) || defaults.earnPerEuro)),
      redeemRate: Math.max(1, Math.round(_pointsNumber(raw.redeemRate != null ? raw.redeemRate : raw.pointsPerDiscountEuro != null ? raw.pointsPerDiscountEuro : raw.redeemPointsRate != null ? raw.redeemPointsRate : defaults.redeemRate) || defaults.redeemRate)),
      minimumPointsToUse: Math.max(0, Math.round(_pointsNumber(raw.minimumPointsToUse != null ? raw.minimumPointsToUse : raw.minPointsToUse != null ? raw.minPointsToUse : defaults.minimumPointsToUse) || defaults.minimumPointsToUse)),
      maxDiscountPct: Math.max(0, Math.min(100, _pointsNumber(raw.maxDiscountPct != null ? raw.maxDiscountPct : raw.maxDiscountPercent != null ? raw.maxDiscountPercent : defaults.maxDiscountPct) || defaults.maxDiscountPct)),
      pointsExpire: raw.pointsExpire === true || raw.pointsExpire === 'true',
      pointsExpirationDays: Math.max(0, Math.round(_pointsNumber(raw.pointsExpirationDays != null ? raw.pointsExpirationDays : raw.expirationDays != null ? raw.expirationDays : raw.pointsExpireDays != null ? raw.pointsExpireDays : defaults.pointsExpirationDays) || defaults.pointsExpirationDays)),
      autoApply: raw.autoApply === true || raw.autoApply === 'true',
      active: raw.active !== false,
      programName: firstText(raw.programName, raw.name, 'Programa de Pontos'),
      storeText: firstText(raw.storeText, raw.description, 'Acumule pontos a cada pedido finalizado e use como desconto em compras futuras.')
    };
  }

  function _pointsConfigData() {
    return _pointsConfig ? Object.assign({}, _pointsConfig) : _pointsDefaultConfig();
  }

  function _pointsCustomerBalance(customer) {
    var stored = Math.max(0, Math.floor(_pointsNumber(customer && (customer.points != null ? customer.points : customer.pointsBalance != null ? customer.pointsBalance : 0))));
    var cfg = _pointsConfigData();
    if (!customer || !cfg.pointsExpire || !(cfg.pointsExpirationDays > 0)) return stored;
    var movements = _pointsCustomerMovements(customer.id);
    if (!movements.length) return stored;
    var now = Date.now();
    var earnedWithDate = 0;
    var used = 0;
    movements.forEach(function (m) {
      var type = String(m.type || '');
      if (type === 'used') {
        used += Math.max(0, _pointsNumber(m.pointsUsed != null ? m.pointsUsed : m.points || 0));
        return;
      }
      if (type !== 'earned') return;
      var created = _pointsDateValue(m.createdAt || m.date || m.updatedAt);
      if (!created) return;
      earnedWithDate += Math.max(0, _pointsNumber(m.pointsEarned != null ? m.pointsEarned : m.points || 0));
    });
    if (!(earnedWithDate > 0)) return stored;
    var availableEarned = movements.reduce(function (sum, m) {
      if (String(m.type || '') !== 'earned') return sum;
      var created = _pointsDateValue(m.createdAt || m.date || m.updatedAt);
      if (!created) return sum;
      var expiresAt = _pointsDateValue(m.expiresAt || m.expirationAt || m.pointsExpireAt) || (created + cfg.pointsExpirationDays * 24 * 60 * 60 * 1000);
      if (expiresAt <= now) return sum;
      return sum + Math.max(0, _pointsNumber(m.pointsEarned != null ? m.pointsEarned : m.points || 0));
    }, 0);
    var calculated = Math.max(0, availableEarned - used);
    return stored > 0 ? Math.min(stored, calculated) : calculated;
  }

  function _pointsOrderSubtotal(order) {
    if (!order) return 0;
    var subtotal = _pointsNumber(order.subtotal != null ? order.subtotal : order.originalSubtotal != null ? order.originalSubtotal : order.finalSubtotal != null ? order.finalSubtotal : order.total != null ? order.total : 0);
    if (subtotal > 0) return subtotal;
    var items = Array.isArray(order.items) ? order.items : [];
    return items.reduce(function (sum, item) {
      var qty = Math.max(1, Math.floor(_pointsNumber(item.qty != null ? item.qty : item.quantity != null ? item.quantity : 1) || 1));
      var original = _pointsNumber(item.originalUnitPrice != null ? item.originalUnitPrice : item.originalPrice != null ? item.originalPrice : item.priceOriginal != null ? item.priceOriginal : item.price != null ? item.price : item.unitPrice != null ? item.unitPrice : 0);
      var subtotalItem = _pointsNumber(item.originalTotal != null ? item.originalTotal : item.originalSubtotal != null ? item.originalSubtotal : item.total != null ? item.total : item.subtotal != null ? item.subtotal : 0);
      if (!subtotalItem && original) subtotalItem = original * qty;
      return sum + subtotalItem;
    }, 0);
  }

  function _pointsOrderFinalValue(order) {
    if (!order) return 0;
    return Math.max(0, _pointsNumber(order.total != null ? order.total : order.finalSubtotal != null ? order.finalSubtotal : order.subtotal != null ? order.subtotal : 0));
  }

  function _pointsDiscountByBalance(balance, subtotal) {
    var cfg = _pointsConfigData();
    var maxByPoints = Math.floor(balance / cfg.redeemRate);
    var maxBySubtotal = Math.floor((_pointsNumber(subtotal) * cfg.maxDiscountPct) / 100);
    var discount = Math.min(maxByPoints, maxBySubtotal);
    return {
      discount: Math.max(0, discount),
      pointsUsed: Math.max(0, discount * cfg.redeemRate)
    };
  }

  function _pointsMovementLabel(type) {
    if (type === 'used') return 'Uso de pontos';
    if (type === 'earned') return 'Ganho de pontos';
    return _title(type || 'Movimento');
  }

  function _pointsOrderContext(order, customer) {
    order = order || {};
    customer = customer || null;
    var cfg = _pointsConfigData();
    var balance = _pointsCustomerBalance(customer);
    var subtotal = _pointsOrderSubtotal(order);
    var generated = Math.max(0, Math.floor(_pointsOrderFinalValue(order) * cfg.earnPerEuro));
    var usage = _pointsDiscountByBalance(balance, subtotal);
    var used = Math.max(0, _pointsNumber(order.pointsUsed || order.pointsDiscountPoints || 0));
    var discountApplied = Math.max(0, _pointsNumber(order.pointsDiscountTotal || order.pointsDiscount || 0));
    var before = _pointsNumber(order.pointsBalanceBefore || balance);
    var after = _pointsNumber(order.pointsBalanceAfter != null ? order.pointsBalanceAfter : Math.max(0, balance - used));
    var eligible = !!(customer && balance >= cfg.minimumPointsToUse && usage.discount > 0);
    return {
      cfg: cfg,
      linked: !!customer,
      balance: balance,
      subtotal: subtotal,
      generated: generated,
      pointsUsed: used,
      discountApplied: discountApplied,
      availableDiscount: usage.discount,
      pointsNeeded: usage.pointsUsed,
      before: before,
      after: after,
      eligible: eligible,
      enough: balance >= cfg.minimumPointsToUse
    };
  }

  function _pointsFindCustomerByPhone(order) {
    var phone = String(order && (order.phone || order.customerPhone || order.whatsapp || '')).replace(/\D/g, '');
    if (!phone) return null;
    return (_customers || []).find(function (c) {
      return String(c.phone || c.whatsapp || '').replace(/\D/g, '') === phone;
    }) || null;
  }

  function _pointsCustomerMovements(customerId) {
    var id = String(customerId || '').trim();
    if (!id) return [];
    return (_pointsMovements || []).filter(function (m) {
      return String(m.customerId || m.clientId || '') === id;
    }).sort(function (a, b) {
      return _pointsDateValue(b.createdAt || b.date || b.updatedAt) - _pointsDateValue(a.createdAt || a.date || a.updatedAt);
    });
  }

  function _pointsDateValue(v) {
    if (!v) return 0;
    try {
      if (v && typeof v.toDate === 'function') return v.toDate().getTime();
      if (typeof v === 'number' && isFinite(v)) return v;
      if (v && typeof v.seconds === 'number') return (v.seconds * 1000) + Math.floor((v.nanoseconds || 0) / 1000000);
      var d = new Date(v);
      return isFinite(d.getTime()) ? d.getTime() : 0;
    } catch (e) {
      return 0;
    }
  }

  function _pointsLoad() {
    return Promise.all([
      _safeGetDocRoot('config', 'pontos_program'),
      _safeGetAll('store_customers'),
      _safeGetAll('orders'),
      _safeGetAll('points_movements')
    ]).then(function (res) {
      _pointsConfig = _normalizePointsConfig(res[0] || {});
      _customers = Array.isArray(res[1]) ? res[1] : [];
      _orders = Array.isArray(res[2]) ? res[2] : [];
      _pointsMovements = Array.isArray(res[3]) ? res[3] : [];
      return { config: _pointsConfig, customers: _customers, orders: _orders, movements: _pointsMovements };
    }).catch(function (err) {
      console.error('[Marketing] points load failed', err);
      _pointsConfig = _normalizePointsConfig({});
      _customers = [];
      _orders = [];
      _pointsMovements = [];
      return { config: _pointsConfig, customers: _customers, orders: _orders, movements: _pointsMovements };
    });
  }

  function _pointsRefresh() {
    if (_activeSub !== 'pontos') return Promise.resolve(false);
    return _pointsLoad().then(function () {
      _paintPontos();
      return true;
    });
  }

  function _pointsSummary(list) {
    var customers = Array.isArray(list) ? list : (_customers || []);
    var positive = customers.filter(function (c) { return _pointsCustomerBalance(c) > 0; });
    var totalBalance = positive.reduce(function (sum, c) { return sum + _pointsCustomerBalance(c); }, 0);
    var totalMovements = (_pointsMovements || []).length;
    var earned = (_pointsMovements || []).filter(function (m) { return String(m.type || '') === 'earned'; }).reduce(function (sum, m) { return sum + Math.max(0, _pointsNumber(m.pointsEarned != null ? m.pointsEarned : m.points || 0)); }, 0);
    var used = (_pointsMovements || []).filter(function (m) { return String(m.type || '') === 'used'; }).reduce(function (sum, m) { return sum + Math.max(0, _pointsNumber(m.pointsUsed != null ? m.pointsUsed : m.points || 0)); }, 0);
    var customersReady = customers.filter(function (c) {
      return _pointsCustomerBalance(c) >= _pointsConfigData().minimumPointsToUse;
    }).length;
    return {
      customers: customers.length,
      activeCustomers: positive.length,
      totalBalance: totalBalance,
      movements: totalMovements,
      earned: earned,
      used: used,
      ready: customersReady
    };
  }

  function _pointsSetTab(value) {
    _pointsTab = value === 'configuracao' || value === 'clientes' ? value : 'desempenho';
    _paintPontos();
  }

  function _pointsSetSearch(value) { _pointsUi.query = String(value || ''); _paintPontos(); }
  function _pointsSetBalance(value) { _pointsUi.balance = value || 'all'; _paintPontos(); }
  function _pointsSetMovement(value) { _pointsUi.movement = value || 'all'; _paintPontos(); }
  function _pointsClearFilters() { _pointsUi.query = ''; _pointsUi.balance = 'all'; _pointsUi.movement = 'all'; _paintPontos(); }
  function _setPointsPerfPeriod(value) { _pointsPerfUi.period = value || 'last30'; _paintPontos(); }
  function _setPointsPerfStart(value) { _pointsPerfUi.periodStart = value || ''; _paintPontos(); }
  function _setPointsPerfEnd(value) { _pointsPerfUi.periodEnd = value || ''; _paintPontos(); }

  function _pointsPerfRange() {
    var period = _pointsPerfUi.period || 'last30';
    var now = new Date();
    var start = null;
    var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    var label = 'Últimos 30 dias';
    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      label = 'Hoje';
    } else if (period === 'yesterday') {
      var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start = y.getTime();
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999).getTime();
      label = 'Ontem';
    } else if (period === 'last7') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
      label = 'Últimos 7 dias';
    } else if (period === 'thismonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      label = 'Este mês';
    } else if (period === 'lastmonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
      label = 'Mês passado';
    } else if (period === 'custom') {
      start = _promoDateValue(_pointsPerfUi.periodStart);
      end = _promoDateValue(_pointsPerfUi.periodEnd);
      if (end) end += 24 * 60 * 60 * 1000 - 1;
      if (start && end && start > end) {
        var swap = start;
        start = end - (24 * 60 * 60 * 1000) + 1;
        end = swap + (24 * 60 * 60 * 1000) - 1;
      }
      label = 'Período personalizado';
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).getTime();
    }
    return { key: period, start: start || 0, end: end || Date.now(), label: label };
  }

  function _pointsPerformanceSummary(summary, range) {
    range = range || _pointsPerfRange();
    var list = (_pointsMovements || []).filter(function (m) {
      var ts = _pointsDateValue(m.createdAt || m.date || m.updatedAt);
      return ts >= range.start && ts <= range.end;
    });
    var earnedMovements = list.filter(function (m) { return String(m.type || '') === 'earned'; });
    var usedMovements = list.filter(function (m) { return String(m.type || '') === 'used'; });
    var earned = earnedMovements.reduce(function (sum, m) { return sum + Math.max(0, _pointsNumber(m.pointsEarned != null ? m.pointsEarned : m.points || 0)); }, 0);
    var used = usedMovements.reduce(function (sum, m) { return sum + Math.max(0, _pointsNumber(m.pointsUsed != null ? m.pointsUsed : m.points || 0)); }, 0);
    var customersTouched = {};
    list.forEach(function (m) {
      var id = String(m.customerId || m.clientId || m.phone || m.customerName || '').trim();
      if (id) customersTouched[id] = true;
    });
    return Object.assign({}, summary || _pointsSummary(_customers), {
      rangeMovements: list.length,
      rangeEarnedMovements: earnedMovements.length,
      rangeUsedMovements: usedMovements.length,
      rangeEarned: earned,
      rangeUsed: used,
      rangeCustomers: Object.keys(customersTouched).length
    });
  }

  function _pointsPerformanceSectionHtml() {
    var range = _pointsPerfRange();
    var perf = _pointsPerformanceSummary(_pointsSummary(_customers), range);
    var cfg = _pointsConfigData();
    var inputStyle = _marketingInputStyle();
    var labelStyle = _marketingLabelStyle() + 'margin-bottom:4px;';
    function catalogAccent(tone) {
      if (tone === 'category') return '#A18362';
      if (tone === 'visible') return '#6C8777';
      if (tone === 'accent') return '#B42318';
      if (tone === 'product') return '#8A6F5A';
      return '#6F6860';
    }
    function mainKpi(label, value, icon, tone) {
      var color = catalogAccent(tone || 'neutral');
      return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\'">' +
        '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + color + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'analytics') + '</span></div>' +
        '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
          '<span style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
          '<strong style="font-size:34px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;letter-spacing:0;">' + _esc(String(value)) + '</strong>' +
        '</div>' +
      '</div>';
    }
    function flowStep(value, label, index) {
      return '<div style="position:relative;z-index:1;flex:1;min-width:150px;text-align:center;">' +
        '<div style="width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid #EAE4DA;color:#1F1F1F;box-shadow:0 8px 20px rgba(31,31,31,.06);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:12px;font-weight:700;">' + index + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;">' + _esc(String(value)) + '</div>' +
        '<div style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.25;margin-top:6px;min-height:30px;">' + _esc(label) + '</div>' +
      '</div>';
    }
    function flowRate(label) {
      return '<div style="position:relative;z-index:2;align-self:flex-start;margin-top:8px;flex:0 0 64px;text-align:center;">' +
        '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:50px;min-height:22px;padding:0 8px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:11px;font-weight:600;box-shadow:0 6px 16px rgba(31,31,31,.04);">' + _esc(label) + '</span>' +
      '</div>';
    }
    function resultCard(title, value, sub, icon, tone) {
      var color = catalogAccent(tone || 'neutral');
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:106px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\'">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
          '<span style="width:34px;height:34px;border-radius:12px;background:#FAF8F4;color:' + color + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:20px;">' + _esc(icon || 'insights') + '</span></span>' +
          '<span style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.2;">' + _esc(title) + '</span>' +
        '</div>' +
        '<div style="font-size:17px;font-weight:700;color:#1F1F1F;line-height:1.25;overflow-wrap:normal;word-break:normal;">' + _esc(value) + '</div>' +
        '<div style="font-size:12px;color:#756F67;line-height:1.4;margin-top:5px;">' + _esc(sub || '') + '</div>' +
      '</div>';
    }
    function passageRate(next, current) {
      if (!(current > 0)) return '—';
      return Math.max(0, (next / current) * 100).toFixed(0).replace('.', ',') + '%';
    }
    function insightText() {
      if (perf.rangeMovements < 10) return 'Ainda não há dados suficientes para recomendações inteligentes. Continue usando o programa para gerar histórico.';
      if (perf.ready > 0) return perf.ready + ' cliente(s) já podem usar pontos. Reforce o resgate no atendimento e na loja.';
      if (perf.rangeEarned > perf.rangeUsed) return 'Há mais pontos gerados do que usados no período. Vale destacar o benefício de resgate para acelerar recompra.';
      if (perf.rangeUsed > 0) return 'O programa já registra uso de pontos. Acompanhe os clientes que resgatam para medir impacto em recorrência.';
      return 'Continue acompanhando o histórico para identificar padrões de ganho, resgate e elegibilidade.';
    }
    return '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div style="min-width:0;"><div style="font-size:13px;color:#6F6860;line-height:1.45;">' + _esc(range.label) + '</div></div>' +
        '<label style="' + labelStyle + '"><span style="display:block;margin-bottom:4px;">Período</span><select onchange="Modules.Marketing._setPointsPerfPeriod(this.value)" style="min-width:180px;' + _marketingSelectStyle() + '"><option value="today"' + (range.key === 'today' ? ' selected' : '') + '>Hoje</option><option value="yesterday"' + (range.key === 'yesterday' ? ' selected' : '') + '>Ontem</option><option value="last7"' + (range.key === 'last7' ? ' selected' : '') + '>Últimos 7 dias</option><option value="last30"' + (range.key === 'last30' ? ' selected' : '') + '>Últimos 30 dias</option><option value="thismonth"' + (range.key === 'thismonth' ? ' selected' : '') + '>Este mês</option><option value="lastmonth"' + (range.key === 'lastmonth' ? ' selected' : '') + '>Mês passado</option><option value="custom"' + (range.key === 'custom' ? ' selected' : '') + '>Personalizado</option></select></label>' +
      '</div>' +
      (range.key === 'custom'
        ? '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px;">' +
            '<label style="' + labelStyle + '"><span style="display:block;margin-bottom:4px;">Data inicial</span><input type="date" value="' + _esc(_pointsPerfUi.periodStart || '') + '" onchange="Modules.Marketing._setPointsPerfStart(this.value)" style="' + inputStyle + '"></label>' +
            '<label style="' + labelStyle + '"><span style="display:block;margin-bottom:4px;">Data final</span><input type="date" value="' + _esc(_pointsPerfUi.periodEnd || '') + '" onchange="Modules.Marketing._setPointsPerfEnd(this.value)" style="' + inputStyle + '"></label>' +
          '</div>'
        : '') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
        mainKpi('Clientes com pontos', perf.activeCustomers, 'groups', 'product') +
        mainKpi('Pontos em circulação', perf.totalBalance, 'account_balance_wallet', 'category') +
        mainKpi('Pontos gerados', perf.rangeEarned, 'add_circle', 'visible') +
        mainKpi('Pontos usados', perf.rangeUsed, 'redeem', 'accent') +
        mainKpi('Clientes elegíveis', perf.ready, 'verified', 'visible') +
      '</div>' +
      '<div style="' + _marketingCardStyle() + 'padding:16px 18px;">' +
        _marketingSectionTitle('Evolução do programa', 'Acompanhe o caminho dos pontos gerados até a elegibilidade para resgate.') +
        '<div style="position:relative;display:flex;align-items:flex-start;gap:10px;flex-wrap:nowrap;overflow:auto;padding:8px 2px 2px;">' +
          '<div style="position:absolute;left:7%;right:7%;top:25px;height:2px;background:linear-gradient(90deg,#8A6F5A 0%,#A18362 35%,#6C8777 70%,#B42318 100%);opacity:.28;border-radius:999px;"></div>' +
          flowStep(perf.rangeEarnedMovements, 'Ganhos registrados', 1) + flowRate(passageRate(perf.rangeUsedMovements, perf.rangeEarnedMovements)) +
          flowStep(perf.rangeUsedMovements, 'Resgates registrados', 2) + flowRate(passageRate(perf.ready, perf.activeCustomers)) +
          flowStep(perf.ready, 'Clientes elegíveis', 3) + flowRate(passageRate(perf.rangeCustomers, Math.max(perf.activeCustomers, 1))) +
          flowStep(perf.rangeCustomers, 'Clientes movimentados', 4) +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">' +
        resultCard('Resumo do programa', cfg.earnPerEuro + ' ponto(s) a cada €1', cfg.redeemRate + ' pontos = €1 de desconto', 'loyalty', 'product') +
        resultCard('Mínimo para usar', cfg.minimumPointsToUse + ' pontos', 'Limite por pedido: ' + cfg.maxDiscountPct + '% do subtotal', 'payments', 'category') +
        resultCard('Aplicação', cfg.autoApply ? 'Automática' : 'Manual', cfg.pointsExpire ? 'Pontos com expiração' : 'Pontos não expiram', 'tune', 'visible') +
      '</div>' +
      '<div style="' + _marketingCardStyle() + 'padding:16px 18px;">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<div style="width:40px;height:40px;border-radius:14px;background:#FAF8F4;color:#8A6F5A;display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:22px;">tips_and_updates</span></div>' +
          '<div style="min-width:0;">' +
            '<div style="font-size:14px;font-weight:600;color:#1F1F1F;margin-bottom:4px;">Oportunidades</div>' +
            '<div style="font-size:13px;color:#6F6860;line-height:1.5;">' + _esc(insightText()) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _pointsSubtabsHtml() {
    function tab(key, label, icon) {
      var active = _pointsTab === key;
      return '<button onclick="Modules.Marketing._pointsSetTab(\'' + key + '\')" style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:none;border-radius:999px;background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#6F6860') + ';font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:' + (active ? '0 10px 24px rgba(180,35,24,.18)' : 'inset 0 0 0 1px #EAE4DA') + ';transition:background .15s ease,color .15s ease,box-shadow .15s ease;">' +
        '<span class="mi" style="font-size:17px;">' + _esc(icon) + '</span>' + _esc(label) +
      '</button>';
    }
    return '<div style="display:inline-flex;align-items:center;gap:6px;background:#FAF8F4;border-radius:999px;padding:4px;box-shadow:inset 0 0 0 1px #EAE4DA;max-width:100%;overflow:auto;">' +
      tab('desempenho', 'Desempenho', 'monitoring') +
      tab('configuracao', 'Configuração', 'tune') +
      tab('clientes', 'Clientes e movimentos', 'groups') +
    '</div>';
  }

  function _pointsKpisHtml(summary) {
    var items = [
      { label: 'Clientes com pontos', value: summary.activeCustomers, icon: 'groups', color: '#8A6F5A' },
      { label: 'Pontos em circulação', value: summary.totalBalance, icon: 'account_balance_wallet', color: '#A18362' },
      { label: 'Pontos gerados', value: summary.earned, icon: 'add_circle', color: '#6C8777' },
      { label: 'Pontos usados', value: summary.used, icon: 'redeem', color: '#B42318' },
      { label: 'Clientes elegíveis', value: summary.ready, icon: 'verified', color: '#6C8777' }
    ];
    return '<div class="growth-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' + items.map(function (m) {
      return '<div class="kpi-tile" style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:18px 18px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="width:54px;height:54px;border-radius:16px;background:transparent;color:' + m.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="mi" style="font-size:28px;">' + _esc(m.icon) + '</span></div>' +
        '<div style="min-width:0;display:flex;flex-direction:column;gap:2px;"><span style="display:block;font-size:13px;font-weight:500;color:#6F6860;line-height:1.1;">' + _esc(m.label) + '</span><strong style="display:block;font-family:inherit;font-size:38px;font-weight:700;color:#1F1F1F;line-height:1;">' + _esc(String(m.value)) + '</strong></div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _pointsRuleSummaryHtml() {
    var cfg = _pointsConfigData();
    return '<section style="' + _marketingCardStyle() + '">' +
      _marketingSectionTitle('Resumo do programa', 'Regras principais que o cliente usa para ganhar e resgatar pontos.') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">' +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px 14px;"><div style="font-size:12px;font-weight:500;color:#6F6860;">Ganho</div><div style="font-size:16px;font-weight:700;color:#1F1F1F;margin-top:4px;">' + cfg.earnPerEuro + ' ponto(s) a cada €1 finalizado</div></div>' +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px 14px;"><div style="font-size:12px;font-weight:500;color:#6F6860;">Resgate</div><div style="font-size:16px;font-weight:700;color:#1F1F1F;margin-top:4px;">' + cfg.redeemRate + ' pontos = €1</div></div>' +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px 14px;"><div style="font-size:12px;font-weight:500;color:#6F6860;">Mínimo para usar</div><div style="font-size:16px;font-weight:700;color:#1F1F1F;margin-top:4px;">' + cfg.minimumPointsToUse + ' pontos</div></div>' +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px 14px;"><div style="font-size:12px;font-weight:500;color:#6F6860;">Limite por pedido</div><div style="font-size:16px;font-weight:700;color:#1F1F1F;margin-top:4px;">' + cfg.maxDiscountPct + '% do subtotal</div></div>' +
      '</div>' +
    '</section>';
  }

  function _pointsOpportunitiesHtml(summary) {
    var text = 'Ainda não há dados suficientes para recomendações. Continue usando o programa para gerar histórico.';
    if (summary.movements >= 10) {
      if (summary.ready > 0) text = summary.ready + ' cliente(s) já podem usar pontos. Vale lembrar esses clientes no atendimento.';
      else if (summary.earned > summary.used) text = 'Há mais pontos gerados do que usados. Reforce a comunicação do resgate no pedido.';
      else text = 'O programa já tem histórico. Acompanhe pontos usados para medir impacto em recompra.';
    }
    return '<section style="' + _marketingCardStyle() + '"><div style="display:flex;align-items:flex-start;gap:12px;"><div style="width:40px;height:40px;border-radius:14px;background:#FAF8F4;color:#8A6F5A;display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:22px;">tips_and_updates</span></div><div><div style="font-size:14px;font-weight:600;color:#1F1F1F;margin-bottom:4px;">Oportunidades</div><div style="font-size:13px;color:#6F6860;line-height:1.5;">' + _esc(text) + '</div></div></div></section>';
  }

  function _pointsConfigurationHtml() {
    var cfg = _pointsConfigData();
    var input = _marketingInputStyle() + 'height:38px;background:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var selectInput = _marketingSelectStyle() + 'height:38px;background-color:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var label = 'display:block;font-size:11px;font-weight:600;color:#6F6860;margin-bottom:6px;';
    var help = 'font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;';
    function changeAttr() { return ' oninput="Modules.Marketing._pointsMarkConfigDirty();Modules.Marketing._pointsRefreshConfigPreview()" onchange="Modules.Marketing._pointsMarkConfigDirty();Modules.Marketing._pointsRefreshConfigPreview()"'; }
    function field(id, title, value, type, suffix, note, width) {
      return '<div class="points-field" style="min-width:0;max-width:' + _esc(width || '100%') + ';">' +
        '<label style="' + label + '">' + _esc(title) + '</label>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value) + '"' + changeAttr() + ' style="' + input + '">' +
          (suffix ? '<span style="font-size:12px;font-weight:500;color:#6F6860;white-space:nowrap;">' + _esc(suffix) + '</span>' : '') +
        '</div>' +
        (note ? '<div style="' + help + '">' + _esc(note) + '</div>' : '') +
      '</div>';
    }
    function select(id, title, html, extra, note, width) {
      return '<div class="points-field" style="min-width:0;max-width:' + _esc(width || '100%') + ';">' +
        '<label style="' + label + '">' + _esc(title) + '</label>' +
        '<select id="' + id + '"' + (extra || changeAttr()) + ' style="' + selectInput + '">' + html + '</select>' +
        (note ? '<div style="' + help + '">' + _esc(note) + '</div>' : '') +
      '</div>';
    }
    function earnField() {
      return '<div class="points-field" style="min-width:0;max-width:260px;">' +
        '<label style="' + label + '">Pontos por €1 gasto</label>' +
        '<div style="display:grid;grid-template-columns:auto minmax(82px,110px) auto;align-items:center;gap:8px;">' +
          '<span style="height:38px;min-width:44px;padding:0 10px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#6F6860;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;">€1</span>' +
          '<input id="pp-earn" type="number" value="' + _esc(cfg.earnPerEuro) + '"' + changeAttr() + ' style="' + input + '">' +
          '<span style="font-size:12px;font-weight:500;color:#6F6860;white-space:nowrap;">ponto(s)</span>' +
        '</div>' +
      '</div>';
    }
    function block(title, subtitle, inner, first) {
      return '<div style="' + (first ? '' : 'border-top:1px solid #F1E7E3;padding-top:12px;') + 'display:flex;flex-direction:column;gap:9px;">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">' + _esc(title) + '</div>' +
          (subtitle ? '<div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">' + _esc(subtitle) + '</div>' : '') +
        '</div>' +
        inner +
      '</div>';
    }
    var previewCard =
      '<div style="grid-column:1/-1;background:#FFFCF8;border:1px solid #EADFD8;border-radius:14px;padding:11px 12px;">' +
        '<div style="font-size:11px;font-weight:600;color:#8A7E7C;margin-bottom:6px;">Prévia na loja</div>' +
        '<div id="pp-preview-name" style="font-size:16px;font-weight:700;color:#1F1F1F;line-height:1.2;">' + _esc(cfg.programName || 'Programa de Pontos') + '</div>' +
        '<div id="pp-preview-text" style="font-size:13px;color:#3F3430;line-height:1.45;margin-top:6px;">' + _esc(cfg.storeText || 'Acumule pontos a cada pedido finalizado e use como desconto em compras futuras.') + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">' +
          '<div id="pp-preview-earn" style="font-size:12px;color:#1F1F1F;line-height:1.45;">A cada €1,00 em pedidos finalizados, o cliente ganha ' + _esc(cfg.earnPerEuro) + ' ponto.</div>' +
          '<div id="pp-preview-redeem" style="font-size:12px;color:#1F1F1F;line-height:1.45;">' + _esc(cfg.redeemRate) + ' pontos = €1,00 de desconto.</div>' +
          '<div id="pp-preview-expire" style="font-size:12px;color:#6F6860;line-height:1.45;' + (cfg.pointsExpire && cfg.pointsExpirationDays > 0 ? '' : 'display:none;') + '">Os pontos expiram em ' + _esc(cfg.pointsExpirationDays || 90) + ' dias.</div>' +
        '</div>' +
      '</div>';
    var identity = block('Identidade do programa', 'Nome, status e texto que aparecem para a cliente.',
      '<div class="points-grid points-grid-identity" style="display:grid;grid-template-columns:minmax(150px,190px) minmax(220px,1fr);gap:12px;align-items:start;">' +
        select('pp-active', 'Status do programa', '<option value="true"' + (cfg.active !== false ? ' selected' : '') + '>Ativo</option><option value="false"' + (cfg.active === false ? ' selected' : '') + '>Inativo</option>', null, '', '190px') +
        field('pp-name', 'Nome do programa', cfg.programName || 'Programa de Pontos', 'text', '', '', '460px') +
        '<div style="grid-column:1/-1;"><label style="' + label + '">Texto exibido na loja</label><input id="pp-text" type="text" value="' + _esc(cfg.storeText || '') + '"' + changeAttr() + ' style="' + input + '"><div style="' + help + '">Use uma frase curta para explicar o benefício do programa.</div></div>' +
        previewCard +
      '</div>', true);
    var earn = block('Ganho de pontos', 'Defina quantos pontos a cliente ganha em pedidos finalizados.',
      '<div class="points-grid" style="display:grid;grid-template-columns:minmax(150px,190px);gap:12px;">' +
        earnField() +
      '</div>');
    var redeem = block('Resgate', 'Configure como os pontos viram desconto no pedido.',
      '<div class="points-grid points-grid-compact" style="display:grid;grid-template-columns:minmax(190px,240px) minmax(180px,220px) minmax(180px,220px);gap:12px;align-items:start;">' +
        field('pp-redeem', 'Pontos para gerar €1 de desconto', cfg.redeemRate, 'number', '', '', '240px') +
        field('pp-min', 'Mínimo de pontos para resgate', cfg.minimumPointsToUse, 'number', '', '', '220px') +
        field('pp-maxpct', 'Limite por pedido', cfg.maxDiscountPct, 'number', '%', '', '220px') +
      '</div>');
    var validity = block('Validade e aplicação', 'Defina por quanto tempo os pontos valem e como o desconto é usado.',
      '<div class="points-grid points-grid-compact" style="display:grid;grid-template-columns:minmax(170px,210px) minmax(170px,210px) minmax(170px,230px);gap:12px;align-items:start;">' +
        select('pp-expire', 'Validade dos pontos', '<option value="false"' + (!cfg.pointsExpire ? ' selected' : '') + '>Não expiram</option><option value="true"' + (cfg.pointsExpire ? ' selected' : '') + '>Expiram</option>', ' onchange="Modules.Marketing._pointsToggleExpirationField();Modules.Marketing._pointsMarkConfigDirty();Modules.Marketing._pointsRefreshConfigPreview()"', '', '210px') +
        '<div id="pp-expire-days-wrap" style="' + (cfg.pointsExpire ? '' : 'display:none;') + '">' + field('pp-expire-days', 'Prazo para expirar', cfg.pointsExpirationDays || 90, 'number', 'dias', '', '210px') + '</div>' +
        select('pp-auto', 'Aplicação do desconto', '<option value="false"' + (!cfg.autoApply ? ' selected' : '') + '>Manual</option><option value="true"' + (cfg.autoApply ? ' selected' : '') + '>Automática</option>', null, '', '230px') +
      '</div>');
    return '<style>' +
      '.points-settings input:focus,.points-settings select:focus{background:#fff!important;border-color:#D9AAA1!important;box-shadow:0 0 0 3px rgba(180,35,24,.08)!important;outline:none!important;}' +
      '.points-settings input[type=number]{max-width:100%;}' +
      '@media(max-width:760px){.points-settings .points-grid,.points-settings .points-grid-identity,.points-settings .points-grid-compact{grid-template-columns:1fr!important;}.points-settings .points-field{max-width:100%!important;}.points-settings .points-actions{align-items:stretch!important;flex-direction:column!important;}.points-settings .points-actions button{width:100%;}}' +
    '</style>' +
    '<div class="points-settings config-wrap" style="display:grid;grid-template-columns:minmax(0,1fr);gap:12px;align-items:start;">' +
      '<section class="bf-card bf-section account-settings" style="padding:18px 20px;">' +
        '<div class="bf-section-header" style="margin-bottom:14px;">' +
          '<div><h3 class="bf-section-title">Configuração</h3><p class="bf-section-subtitle">Defina como o programa aparece na loja e como os pontos são gerados e usados.</p></div>' +
        '</div>' +
        '<div class="bf-panel" style="background:#fff;padding:14px;border:1px solid #EADFD8;border-radius:16px;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
          '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;">' +
            '<span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;">loyalty</span>' +
            '<div><div style="font-size:13px;font-weight:700;color:#1F1F1F;">Programa de pontos</div><div style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Mantenha as regras claras para a cliente entender o benefício antes de comprar.</div></div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:12px;">' + identity + earn + redeem + validity + '</div>' +
        '</div>' +
      '</section>' +
      '<section class="bf-card bf-actions-row points-actions" style="padding:14px 16px;position:sticky;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
        '<div id="pp-config-dirty" style="font-size:13px;color:#6F6860;line-height:1.45;">Revise as regras antes de salvar.</div>' +
        '<button id="pp-save-btn" onclick="Modules.Marketing._savePointsConfig()" class="bf-btn bf-btn-primary" style="cursor:pointer;">Salvar alterações</button>' +
      '</section>' +
    '</div>';
  }

  function _pointsCustomerRows() {
    var q = String(_pointsUi.query || '').trim().toLowerCase();
    var cfg = _pointsConfigData();
    return (_customers || []).filter(function (c) {
      var balance = _pointsCustomerBalance(c);
      if (_pointsUi.balance === 'with_balance' && !(balance > 0)) return false;
      if (_pointsUi.balance === 'eligible' && balance < cfg.minimumPointsToUse) return false;
      if (q) {
        var text = [c.name || '', c.phone || '', c.whatsapp || '', c.email || ''].join(' ').toLowerCase();
        if (text.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) {
      return _pointsCustomerBalance(b) - _pointsCustomerBalance(a) || String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  function _pointsInitials(name) {
    var parts = String(name || 'Cliente').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'CL';
    return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(1) || '')).toUpperCase();
  }

  function _pointsRelatedOrders(customer) {
    customer = customer || {};
    var id = String(customer.id || '');
    var phone = String(customer.phone || customer.whatsapp || '').replace(/\D/g, '');
    return (_orders || []).filter(function (o) {
      var orderPhone = String(o.phone || o.customerPhone || o.whatsapp || '').replace(/\D/g, '');
      return (id && (String(o.customerId || '') === id || String(o.clientId || '') === id)) || (phone && orderPhone === phone);
    }).sort(function (a, b) {
      return _pointsDateValue(b.createdAt || b.date || b.updatedAt) - _pointsDateValue(a.createdAt || a.date || a.updatedAt);
    }).slice(0, 8);
  }

  function _openPointsCustomerModal(id) {
    var customer = (_customers || []).find(function (c) { return String(c.id || '') === String(id || ''); });
    if (!customer) return;
    var cfg = _pointsConfigData();
    var balance = _pointsCustomerBalance(customer);
    var discount = Math.floor(balance / cfg.redeemRate);
    var movements = _pointsCustomerMovements(customer.id).slice(0, 12);
    var orders = _pointsRelatedOrders(customer);
    function metric(label, value, tone) {
      var c = _marketingTone(tone || 'neutral');
      return '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:11px 12px;"><div style="font-size:11px;font-weight:600;color:#6F6860;">' + _esc(label) + '</div><div style="font-size:20px;font-weight:650;color:' + c.color + ';line-height:1;margin-top:7px;">' + _esc(value) + '</div></div>';
    }
    function cardTitle(icon, title, subtitle) {
      return '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:12px;">' +
        '<span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;">' + _esc(icon) + '</span>' +
        '<div><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">' + _esc(title) + '</div>' +
        (subtitle ? '<div style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">' + _esc(subtitle) + '</div>' : '') +
        '</div>' +
      '</div>';
    }
    function row(left, middle, right) {
      return '<div style="display:grid;grid-template-columns:104px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #F1E7E3;">' +
        '<div style="font-size:12px;color:#6F6860;">' + left + '</div>' +
        '<div style="min-width:0;">' + middle + '</div>' +
        '<div style="font-size:13px;font-weight:650;color:#1F1F1F;text-align:right;">' + right + '</div>' +
      '</div>';
    }
    var movementsHtml = movements.length ? movements.map(function (m) {
      var type = String(m.type || '');
      var tone = type === 'used' ? _marketingTone('danger') : type === 'earned' ? _marketingTone('success') : _marketingTone('neutral');
      var ts = _pointsDateValue(m.createdAt || m.date || m.updatedAt);
      var points = _pointsNumber(m.pointsUsed != null ? m.pointsUsed : m.pointsEarned != null ? m.pointsEarned : m.points || 0);
      return row(
        ts ? _esc(UI.fmtDate(new Date(ts))) : '—',
        '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:' + tone.bg + ';border:1px solid ' + tone.border + ';color:' + tone.color + ';font-size:12px;font-weight:600;">' + _esc(_pointsMovementLabel(type)) + '</span><div style="font-size:12px;color:#6F6860;margin-top:4px;">Pedido: ' + _esc(m.orderDisplay || m.orderLabel || m.orderId || '—') + '</div>',
        '<span style="color:' + (type === 'used' ? '#B42318' : '#1F6F43') + ';">' + (type === 'used' ? '-' : '+') + points + '</span>'
      );
    }).join('') : '<div style="font-size:13px;color:#6F6860;padding:12px 0;border-top:1px solid #F1E7E3;">Sem movimentos registrados para este cliente.</div>';
    var ordersHtml = orders.length ? orders.map(function (o) {
      var ts = _pointsDateValue(o.createdAt || o.date || o.updatedAt);
      return row(
        ts ? _esc(UI.fmtDate(new Date(ts))) : '—',
        '<div style="font-size:13px;font-weight:600;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(o.orderNumber || o.number || o.reference || o.id || 'Pedido') + '</div>',
        UI.fmt(_pointsOrderFinalValue(o))
      );
    }).join('') : '<div style="font-size:13px;color:#6F6860;padding:12px 0;border-top:1px solid #F1E7E3;">Sem pedidos relacionados encontrados.</div>';
    var tabSuffix = String(customer.id || id || 'cliente').replace(/[^a-zA-Z0-9_-]/g, '');
    var tabButtonStyle = 'height:34px;padding:0 12px;border:none;border-radius:999px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .15s ease,color .15s ease,box-shadow .15s ease;';
    var tabsHtml =
      '<section style="background:#fff;border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">' +
          '<div><div id="pp-client-tab-title-' + _esc(tabSuffix) + '" style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">Histórico recente</div><div id="pp-client-tab-subtitle-' + _esc(tabSuffix) + '" style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Entradas, usos e expirações vinculadas ao cliente.</div></div>' +
          '<div style="display:inline-flex;align-items:center;gap:6px;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:999px;padding:4px;">' +
            '<button id="pp-client-tab-movements-' + _esc(tabSuffix) + '" type="button" onclick="Modules.Marketing._pointsSwitchCustomerTab(\'' + _esc(tabSuffix) + '\', \'movements\')" style="' + tabButtonStyle + 'background:#B42318;color:#fff;box-shadow:0 8px 18px rgba(180,35,24,.14);">Histórico</button>' +
            '<button id="pp-client-tab-orders-' + _esc(tabSuffix) + '" type="button" onclick="Modules.Marketing._pointsSwitchCustomerTab(\'' + _esc(tabSuffix) + '\', \'orders\')" style="' + tabButtonStyle + 'background:transparent;color:#6F6860;box-shadow:none;">Pedidos</button>' +
          '</div>' +
        '</div>' +
        '<div id="pp-client-pane-movements-' + _esc(tabSuffix) + '">' + movementsHtml + '</div>' +
        '<div id="pp-client-pane-orders-' + _esc(tabSuffix) + '" style="display:none;">' + ordersHtml + '</div>' +
      '</section>';
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<section style="background:linear-gradient(135deg,#fff 0%,#FFFCF8 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span style="width:46px;height:46px;border-radius:15px;background:#fff;border:1px solid #EADFD8;color:#8A6F5A;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex:0 0 auto;">' + _esc(_pointsInitials(customer.name || customer.email || 'Cliente')) + '</span>' +
          '<div style="min-width:0;"><div style="font-size:18px;font-weight:700;color:#1F1F1F;line-height:1.2;">' + _esc(customer.name || 'Cliente') + '</div><div style="font-size:13px;color:#6F6860;margin-top:4px;line-height:1.4;">' + _esc(customer.phone || customer.whatsapp || 'Sem telefone') + ' · ' + _esc(customer.email || 'Sem e-mail') + '</div></div>' +
        '</div>' +
      '</section>' +
      '<section style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">' +
        metric('Pontos disponíveis', balance + ' pts', balance > 0 ? 'success' : 'neutral') +
        metric('Desconto estimado', UI.fmt(discount), discount > 0 ? 'product' : 'neutral') +
        metric('Movimentos', String(movements.length), movements.length ? 'info' : 'neutral') +
      '</section>' +
      tabsHtml +
    '</div>';
    var footer = '<div style="display:flex;justify-content:flex-end;"><button onclick="if(window._pointsCustomerModal)window._pointsCustomerModal.close()" style="height:38px;padding:0 14px;border:1px solid #EADFD8;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Fechar</button></div>';
    window._pointsCustomerModal = UI.modal({ title: 'Detalhe do cliente', body: body, footer: footer, maxWidth: '920px' });
  }

  function _pointsSwitchCustomerTab(suffix, tab) {
    suffix = String(suffix || '').replace(/[^a-zA-Z0-9_-]/g, '');
    tab = tab === 'orders' ? 'orders' : 'movements';
    var movementsPane = _doc('pp-client-pane-movements-' + suffix);
    var ordersPane = _doc('pp-client-pane-orders-' + suffix);
    var movementsBtn = _doc('pp-client-tab-movements-' + suffix);
    var ordersBtn = _doc('pp-client-tab-orders-' + suffix);
    var title = _doc('pp-client-tab-title-' + suffix);
    var subtitle = _doc('pp-client-tab-subtitle-' + suffix);
    if (movementsPane) movementsPane.style.display = tab === 'movements' ? '' : 'none';
    if (ordersPane) ordersPane.style.display = tab === 'orders' ? '' : 'none';
    if (movementsBtn) {
      movementsBtn.style.background = tab === 'movements' ? '#B42318' : 'transparent';
      movementsBtn.style.color = tab === 'movements' ? '#fff' : '#6F6860';
      movementsBtn.style.boxShadow = tab === 'movements' ? '0 8px 18px rgba(180,35,24,.14)' : 'none';
    }
    if (ordersBtn) {
      ordersBtn.style.background = tab === 'orders' ? '#B42318' : 'transparent';
      ordersBtn.style.color = tab === 'orders' ? '#fff' : '#6F6860';
      ordersBtn.style.boxShadow = tab === 'orders' ? '0 8px 18px rgba(180,35,24,.14)' : 'none';
    }
    if (title) title.textContent = tab === 'orders' ? 'Pedidos relacionados' : 'Histórico recente';
    if (subtitle) subtitle.textContent = tab === 'orders' ? 'Pedidos encontrados pelo cliente, vínculo ou telefone.' : 'Entradas, usos e expirações vinculadas ao cliente.';
  }

  function _pointsCustomersTableHtml() {
    var rows = _pointsCustomerRows();
    var tableCard = 'background:#fff;border:1px solid #EADFD8;border-radius:18px;overflow:hidden;box-shadow:0 10px 24px rgba(31,31,31,.04);';
    if (!rows.length) return '<section style="' + tableCard + 'text-align:center;padding:22px 18px;"><div style="font-size:15px;font-weight:600;color:#1F1F1F;margin-bottom:4px;">Nenhum cliente encontrado</div><div style="font-size:13px;color:#6F6860;">Ajuste a busca ou os filtros para ver clientes do programa.</div></section>';
    return '<div style="' + tableCard + '"><div style="overflow:auto;"><table style="width:100%;border-collapse:separate;border-spacing:0;min-width:920px;"><thead><tr style="background:#fff;">' +
      _marketingTh('Cliente') + _marketingTh('Telefone') + _marketingTh('Pontos', 'center') + _marketingTh('Desconto estimado') + _marketingTh('Último movimento') + _marketingTh('Ações', 'right') +
      '</tr></thead><tbody>' + rows.map(function (c) {
        var balance = _pointsCustomerBalance(c);
        var mov = _pointsCustomerMovements(c.id)[0] || null;
        var ts = mov ? _pointsDateValue(mov.createdAt || mov.date || mov.updatedAt) : 0;
        var initials = _pointsInitials(c.name || c.email || 'Cliente');
        var pointsChip = balance > 0
          ? '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:26px;padding:0 10px;border-radius:999px;background:#F0FAF4;border:1px solid #D9F2E3;color:#1F6F43;font-size:12px;font-weight:700;">' + balance + '</span>'
          : '<span style="font-size:13px;font-weight:600;color:#A39B90;">0</span>';
        return '<tr onmouseenter="this.style.background=\'#FFFCF8\'" onmouseleave="this.style.background=\'#fff\'" style="background:#fff;transition:background .15s ease;">' +
          _marketingTd('<div style="display:flex;align-items:center;gap:10px;min-width:0;"><span style="width:36px;height:36px;border-radius:12px;background:#FAF8F4;border:1px solid #EAE4DA;color:#8A6F5A;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:0 0 auto;">' + _esc(initials) + '</span><div style="min-width:0;"><div style="font-size:14px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(c.name || 'Cliente') + '</div><div style="font-size:12px;color:#6F6860;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(c.email || 'Sem e-mail') + '</div></div></div>') +
          _marketingTd('<span style="font-size:13px;color:#1F1F1F;">' + _esc(c.phone || c.whatsapp || '—') + '</span>') +
          _marketingTd(pointsChip, 'center') +
          _marketingTd('<span style="font-size:13px;font-weight:600;color:#1F1F1F;">' + UI.fmt(Math.floor(balance / _pointsConfigData().redeemRate)) + '</span>') +
          _marketingTd('<span style="font-size:13px;color:#6F6860;">' + (ts ? _esc(UI.fmtDate(new Date(ts))) : '—') + '</span>') +
          _marketingTd('<button onclick="Modules.Marketing._openPointsCustomerModal(\'' + _esc(String(c.id || '')) + '\')" style="height:32px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Ver</button>', 'right') +
        '</tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function _pointsMovementsTableHtml() {
    var filter = String(_pointsUi.movement || 'all');
    var list = (_pointsMovements || []).filter(function (m) {
      return filter === 'all' || String(m.type || '') === filter;
    }).sort(function (a, b) {
      return _pointsDateValue(b.createdAt || b.date || b.updatedAt) - _pointsDateValue(a.createdAt || a.date || a.updatedAt);
    }).slice(0, 20);
    var tableCard = 'background:#fff;border:1px solid #EADFD8;border-radius:18px;overflow:hidden;box-shadow:0 10px 24px rgba(31,31,31,.04);';
    if (!list.length) return '<section style="' + tableCard + 'text-align:center;padding:22px 18px;"><div style="font-size:15px;font-weight:600;color:#1F1F1F;margin-bottom:4px;">Sem movimentos registrados</div><div style="font-size:13px;color:#6F6860;">Entradas, usos e expirações aparecerão aqui quando houver histórico.</div></section>';
    return '<div style="' + tableCard + '"><div style="overflow:auto;"><table style="width:100%;border-collapse:separate;border-spacing:0;min-width:820px;"><thead><tr>' +
      _marketingTh('Data') + _marketingTh('Cliente') + _marketingTh('Tipo') + _marketingTh('Pedido') + _marketingTh('Pontos', 'center') + _marketingTh('Saldo', 'center') +
      '</tr></thead><tbody>' + list.map(function (m) {
        var ts = _pointsDateValue(m.createdAt || m.date || m.updatedAt);
        var type = String(m.type || '');
        var points = _pointsNumber(m.pointsUsed != null ? m.pointsUsed : m.pointsEarned != null ? m.pointsEarned : m.points || 0);
        var tone = type === 'used' ? _marketingTone('danger') : type === 'earned' ? _marketingTone('success') : _marketingTone('neutral');
        var orderLabel = m.orderDisplay || m.orderLabel || m.orderId || '—';
        return '<tr onmouseenter="this.style.background=\'#FFFCF8\'" onmouseleave="this.style.background=\'#fff\'" style="background:#fff;transition:background .15s ease;">' +
          _marketingTd('<span style="font-size:13px;color:#6F6860;">' + (ts ? _esc(UI.fmtDate(new Date(ts))) : '—') + '</span>') +
          _marketingTd('<span style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(m.customerName || m.name || 'Cliente') + '</span>') +
          _marketingTd('<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:' + tone.bg + ';border:1px solid ' + tone.border + ';color:' + tone.color + ';font-size:12px;font-weight:600;">' + _esc(_pointsMovementLabel(type)) + '</span>') +
          _marketingTd('<span title="' + _esc(orderLabel) + '" style="display:inline-block;max-width:180px;font-size:13px;color:#6F6860;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;">' + _esc(orderLabel) + '</span>') +
          _marketingTd('<span style="font-size:13px;font-weight:600;color:' + (type === 'used' ? '#B42318' : '#6C8777') + ';">' + (type === 'used' ? '-' : '+') + points + '</span>', 'center') +
          _marketingTd('<span style="font-size:13px;color:#1F1F1F;">' + _pointsNumber(m.balanceAfter || m.afterBalance || 0) + '</span>', 'center') +
        '</tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function _pointsClientsSectionHtml() {
    var input = _marketingInputStyle() + 'height:40px;background:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var select = _marketingSelectStyle() + 'height:40px;background-color:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var hasFilters = !!(_pointsUi.query || _pointsUi.balance !== 'all');
    return '<style>' +
      '.points-listing input:focus,.points-listing select:focus{background:#fff!important;border-color:#D9AAA1!important;box-shadow:0 0 0 3px rgba(180,35,24,.08)!important;outline:none!important;}' +
      '@media(max-width:860px){.points-listing .points-filter-grid{grid-template-columns:1fr!important}.points-listing .points-filter-actions{justify-content:flex-start!important}}' +
    '</style>' +
    '<div class="points-listing" style="display:flex;flex-direction:column;gap:16px;">' +
      '<section style="background:linear-gradient(135deg,#fff 0%,#FFFCF8 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
        '<div class="points-filter-grid" style="display:grid;grid-template-columns:minmax(280px,1.4fr) minmax(180px,220px);gap:12px;align-items:end;">' +
          '<div><label style="display:block;font-size:11px;font-weight:600;color:#6F6860;margin-bottom:6px;">Buscar cliente</label><input type="search" value="' + _esc(_pointsUi.query || '') + '" oninput="Modules.Marketing._pointsSetSearch(this.value)" placeholder="Nome, telefone ou e-mail" style="' + input + '"></div>' +
          '<div><label style="display:block;font-size:11px;font-weight:600;color:#6F6860;margin-bottom:6px;">Saldo de pontos</label><select onchange="Modules.Marketing._pointsSetBalance(this.value)" style="' + select + '"><option value="all"' + (_pointsUi.balance === 'all' ? ' selected' : '') + '>Todos os clientes</option><option value="with_balance"' + (_pointsUi.balance === 'with_balance' ? ' selected' : '') + '>Com saldo</option><option value="eligible"' + (_pointsUi.balance === 'eligible' ? ' selected' : '') + '>Elegíveis para resgate</option></select></div>' +
        '</div>' +
        (hasFilters ? '<div class="points-filter-actions" style="display:flex;justify-content:flex-start;margin-top:12px;"><button onclick="Modules.Marketing._pointsClearFilters()" style="height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:10px;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Limpar filtros</button></div>' : '') +
      '</section>' +
      '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div><div style="font-size:16px;font-weight:650;color:#1F1F1F;">Clientes</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Abra o detalhe de cada cliente para ver saldo, pedidos relacionados e movimentos de pontos.</div></div>' +
        _pointsCustomersTableHtml() +
      '</section>' +
    '</div>';
  }

  function _pointsConfigHtml() {
    var cfg = _pointsConfigData();
    return '<section style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.04);">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px;">' +
        '<div>' +
          '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Configuração do programa</div>' +
          '<div style="font-size:18px;font-weight:900;color:#1A1A1A;">Regras padrão de pontos</div>' +
          '<div style="font-size:12px;color:#8A7E7C;line-height:1.5;margin-top:4px;">O desconto nunca é aplicado automaticamente.</div>' +
        '</div>' +
        '<button onclick="Modules.Marketing._openPointsConfigModal()" style="background:#C4362A;color:#fff;border:none;padding:10px 16px;border-radius:20px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Editar configuração</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Ganho</div><div style="font-size:16px;font-weight:900;color:#1A1A1A;">' + cfg.earnPerEuro + ' ponto(s)</div><div style="font-size:11px;color:#8A7E7C;margin-top:4px;">a cada €1,00 finalizado</div></div>' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Resgate</div><div style="font-size:16px;font-weight:900;color:#1A1A1A;">10 pontos = €1,00</div><div style="font-size:11px;color:#8A7E7C;margin-top:4px;">mínimo para usar: ' + cfg.minimumPointsToUse + ' pontos</div></div>' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Limite</div><div style="font-size:16px;font-weight:900;color:#1A1A1A;">' + cfg.maxDiscountPct + '%</div><div style="font-size:11px;color:#8A7E7C;margin-top:4px;">máximo por pedido</div></div>' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Expiração</div><div style="font-size:16px;font-weight:900;color:#1A1A1A;">Não expira</div><div style="font-size:11px;color:#8A7E7C;margin-top:4px;">' + (cfg.autoApply ? 'Aplicação automática ativa' : 'Aplicação manual') + '</div></div>' +
      '</div>' +
    '</section>';
  }

  function _pointsCustomersHtml() {
    var list = (_customers || []).slice().sort(function (a, b) {
      return _pointsCustomerBalance(b) - _pointsCustomerBalance(a) || String(a.name || '').localeCompare(String(b.name || ''));
    }).filter(function (c) { return _pointsCustomerBalance(c) > 0; }).slice(0, 8);
    if (!list.length) {
      return '<section style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:14px;color:#8A7E7C;">Ainda não há clientes com saldo de pontos.</div></section>';
    }
    return '<section style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Clientes com pontos</div><div style="display:flex;flex-direction:column;gap:10px;">' + list.map(function (c) {
      var balance = _pointsCustomerBalance(c);
      return '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 12px;border:1px solid #F2EDED;border-radius:12px;background:#FAF8F8;">' +
        '<div style="min-width:0;">' +
          '<div style="font-size:14px;font-weight:900;color:#1A1A1A;">' + _esc(c.name || 'Cliente') + '</div>' +
          '<div style="font-size:11px;color:#8A7E7C;margin-top:2px;">' + (c.phone ? _esc(c.phone) : 'Sem telefone') + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:18px;font-weight:900;color:#C4362A;">' + balance + '</div>' +
          '<div style="font-size:11px;color:#8A7E7C;">' + UI.fmt(Math.floor(balance / _pointsConfigData().redeemRate)) + ' de desconto</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div></section>';
  }

  function _pointsMovementHtml(movement) {
    var ts = _pointsDateValue(movement.createdAt || movement.date || movement.updatedAt);
    var points = _pointsNumber(movement.pointsUsed != null ? movement.pointsUsed : movement.pointsEarned != null ? movement.pointsEarned : movement.points || 0);
    var sign = String(movement.type || '') === 'used' ? '-' : '+';
    var customerName = movement.customerName || movement.name || 'Cliente';
    var orderLabel = movement.orderDisplay || movement.orderLabel || movement.orderId || '—';
    return '<div style="display:grid;grid-template-columns:112px 1fr auto;gap:12px;padding:10px 0;border-top:1px solid #F2EDED;align-items:center;">' +
      '<div style="font-size:11px;color:#8A7E7C;font-weight:900;">' + _esc(ts ? UI.fmtDate(new Date(ts)) : '-') + '</div>' +
      '<div style="min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
          '<strong style="font-size:13px;">' + _esc(customerName) + '</strong>' +
          UI.badge(_pointsMovementLabel(movement.type || ''), String(movement.type || '') === 'used' ? 'orange' : 'green') +
        '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:3px;line-height:1.45;">Pedido: ' + _esc(orderLabel) + '</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
        '<div style="font-size:14px;font-weight:900;color:' + (String(movement.type || '') === 'used' ? '#C4362A' : '#1A9E5A') + ';">' + sign + points + '</div>' +
        '<div style="font-size:11px;color:#8A7E7C;">Saldo: ' + _esc(_pointsNumber(movement.balanceAfter || movement.afterBalance || 0)) + '</div>' +
      '</div>' +
    '</div>';
  }

  function _pointsMovementsHtml() {
    var list = (_pointsMovements || []).slice().sort(function (a, b) {
      return _pointsDateValue(b.createdAt || b.date || b.updatedAt) - _pointsDateValue(a.createdAt || a.date || a.updatedAt);
    }).slice(0, 12);
    if (!list.length) {
      return '<section style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:14px;color:#8A7E7C;">Sem movimentos registrados ainda.</div></section>';
    }
    return '<section style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Movimentos recentes</div>' + list.map(_pointsMovementHtml).join('') + '</section>';
  }

  function _openPointsConfigModal() {
    _pointsSetTab('configuracao');
  }

  function _pointsToggleExpirationField() {
    var expire = String((_doc('pp-expire') || {}).value || 'false') === 'true';
    var wrap = _doc('pp-expire-days-wrap');
    if (wrap) wrap.style.display = expire ? '' : 'none';
  }

  function _pointsMarkConfigDirty() {
    var note = _doc('pp-config-dirty');
    var btn = _doc('pp-save-btn');
    if (note) {
      note.textContent = 'Alterações pendentes. Salve para aplicar no programa.';
      note.style.color = '#B42318';
      note.style.fontWeight = '600';
    }
    if (btn) {
      btn.style.boxShadow = '0 10px 24px rgba(180,35,24,.24)';
      btn.style.transform = 'translateY(-1px)';
    }
  }

  function _pointsRefreshConfigPreview() {
    var name = String((_doc('pp-name') || {}).value || 'Programa de Pontos').trim() || 'Programa de Pontos';
    var text = String((_doc('pp-text') || {}).value || 'Acumule pontos a cada pedido finalizado e use como desconto em compras futuras.').trim();
    var earn = Math.max(1, Math.round(_pointsNumber((_doc('pp-earn') || {}).value || 1) || 1));
    var redeem = Math.max(1, Math.round(_pointsNumber((_doc('pp-redeem') || {}).value || 10) || 10));
    var expire = String((_doc('pp-expire') || {}).value || 'false') === 'true';
    var days = Math.max(0, Math.round(_pointsNumber((_doc('pp-expire-days') || {}).value || 0) || 0));
    var elName = _doc('pp-preview-name');
    var elText = _doc('pp-preview-text');
    var elEarn = _doc('pp-preview-earn');
    var elRedeem = _doc('pp-preview-redeem');
    var elExpire = _doc('pp-preview-expire');
    if (elName) elName.textContent = name;
    if (elText) elText.textContent = text;
    if (elEarn) elEarn.textContent = 'A cada €1,00 em pedidos finalizados, o cliente ganha ' + earn + ' ponto' + (earn === 1 ? '.' : 's.');
    if (elRedeem) elRedeem.textContent = redeem + ' pontos = €1,00 de desconto.';
    if (elExpire) {
      elExpire.style.display = expire && days > 0 ? '' : 'none';
      elExpire.textContent = 'Os pontos expiram em ' + (days || 90) + ' dias.';
    }
  }

  function _savePointsConfig() {
    var current = _pointsConfigData();
    function fieldValue(id, fallback) {
      var el = _doc(id);
      return el ? el.value : fallback;
    }
    var cfg = {
      active: String(fieldValue('pp-active', current.active === false ? 'false' : 'true')) !== 'false',
      programName: String(fieldValue('pp-name', current.programName || 'Programa de Pontos')).trim() || 'Programa de Pontos',
      storeText: String(fieldValue('pp-text', current.storeText || '')).trim(),
      earnPerEuro: Math.max(1, Math.round(_pointsNumber(fieldValue('pp-earn', current.earnPerEuro)) || current.earnPerEuro || 1)),
      redeemRate: Math.max(1, Math.round(_pointsNumber(fieldValue('pp-redeem', current.redeemRate)) || current.redeemRate || 10)),
      minimumPointsToUse: Math.max(0, Math.round(_pointsNumber(fieldValue('pp-min', current.minimumPointsToUse)) || current.minimumPointsToUse || 50)),
      maxDiscountPct: Math.max(0, Math.min(100, _pointsNumber(fieldValue('pp-maxpct', current.maxDiscountPct)) || current.maxDiscountPct || 20)),
      pointsExpire: String(fieldValue('pp-expire', current.pointsExpire ? 'true' : 'false')) === 'true',
      pointsExpirationDays: Math.max(0, Math.round(_pointsNumber(fieldValue('pp-expire-days', current.pointsExpirationDays || 0)) || 0)),
      autoApply: String(fieldValue('pp-auto', current.autoApply ? 'true' : 'false')) === 'true'
    };
    if (cfg.pointsExpire && !(cfg.pointsExpirationDays > 0)) {
      UI.toast('Informe um prazo válido para expirar os pontos.', 'error');
      return;
    }
    _pointsConfig = _normalizePointsConfig(cfg);
    DB.setDocRoot('config', 'pontos_program', _pointsConfig).then(function () {
      UI.toast('Configuração de pontos salva.', 'success');
      if (window._pointsConfigModal) window._pointsConfigModal.close();
      if (_activeSub === 'pontos') _paintPontos();
    }).catch(function (err) {
      UI.toast('Erro ao salvar pontos: ' + err.message, 'error');
    });
  }

  function _doc(id) {
    return document.getElementById(id);
  }

  function _pointsOrderBlockHtml(order, customer) {
    order = order || {};
    customer = customer || null;
    var ctx = _pointsOrderContext(order, customer);
    var customerLabel = customer && customer.name ? customer.name : '—';
    if (!ctx.linked) {
      return '<div style="background:#FFF8F1;border:1px solid #F3D9C7;border-radius:16px;padding:14px;">' +
        '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;">Programa de Pontos</div>' +
        '<div style="font-size:14px;font-weight:900;color:#1A1A1A;margin-bottom:6px;">Vincula o registra al cliente para activar el programa de puntos.</div>' +
        '<div style="font-size:13px;color:#5D514F;line-height:1.45;">Este pedido ainda não está ligado a um cliente com saldo de pontos.</div>' +
      '</div>';
    }
    var applied = ctx.pointsUsed > 0 && ctx.discountApplied > 0;
    return '<div style="background:#fff;border:1px solid #F2EDED;border-radius:16px;padding:14px;">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px;">' +
        '<div>' +
          '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;">Programa de Pontos</div>' +
          '<div style="font-size:14px;font-weight:900;color:#1A1A1A;">' + _esc(customerLabel) + '</div>' +
        '</div>' +
        UI.badge('Saldo: ' + ctx.balance + ' pts', 'blue') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:12px;padding:10px;"><div style="font-size:10px;color:#8A7E7C;font-weight:900;text-transform:uppercase;margin-bottom:4px;">Saldo atual</div><div style="font-size:16px;font-weight:900;color:#1A1A1A;">' + ctx.balance + ' pts</div></div>' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:12px;padding:10px;"><div style="font-size:10px;color:#8A7E7C;font-weight:900;text-transform:uppercase;margin-bottom:4px;">Desconto disponível</div><div style="font-size:16px;font-weight:900;color:#1A9E5A;">' + UI.fmt(ctx.availableDiscount) + '</div></div>' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:12px;padding:10px;"><div style="font-size:10px;color:#8A7E7C;font-weight:900;text-transform:uppercase;margin-bottom:4px;">Pontos que este pedido gera</div><div style="font-size:16px;font-weight:900;color:#1A1A1A;">' + ctx.generated + ' pts</div></div>' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:12px;padding:10px;"><div style="font-size:10px;color:#8A7E7C;font-weight:900;text-transform:uppercase;margin-bottom:4px;">Pontos usados</div><div style="font-size:16px;font-weight:900;color:#C4362A;">' + (ctx.pointsUsed || 0) + ' pts</div></div>' +
        '<div style="background:#FAF8F8;border:1px solid #F2EDED;border-radius:12px;padding:10px;"><div style="font-size:10px;color:#8A7E7C;font-weight:900;text-transform:uppercase;margin-bottom:4px;">Desconto por pontos</div><div style="font-size:16px;font-weight:900;color:#1A1A1A;">' + UI.fmt(ctx.discountApplied || 0) + '</div></div>' +
      '</div>' +
      '<div style="margin-top:10px;font-size:12px;color:#8A7E7C;line-height:1.45;">' + (ctx.enough ? (applied ? 'Desconto já aplicado neste pedido.' : 'Clique para aplicar o maior desconto permitido por esta regra.') : 'Este cliente aún no tiene puntos suficientes para usar descuento.') + '</div>' +
      (!applied && ctx.eligible ? '<div style="margin-top:10px;display:flex;justify-content:flex-end;"><button onclick="Modules.Pedidos._applyPointsDiscount(\'' + _esc(order.id || '') + '\')" style="border:none;background:#C4362A;color:#fff;border-radius:12px;padding:10px 14px;font-size:13px;font-weight:800;cursor:pointer;">Aplicar desconto com pontos</button></div>' : '') +
      '<div style="display:none" data-points-balance="' + ctx.balance + '"></div>' +
    '</div>';
  }

  function _pointsApplyDiscount(orderId, orderData, customerData) {
    var order = orderData || null;
    var customer = customerData || null;
    var loadOrder = order ? Promise.resolve(order) : DB.getDoc('orders', orderId);
    return loadOrder.then(function (ord) {
      if (!ord) throw new Error('Pedido não encontrado');
      var ensureCustomers = function () {
        if (_customers && _customers.length) return Promise.resolve(_customers);
        return DB.getAll('store_customers').catch(function () { return []; }).then(function (rows) {
          _customers = Array.isArray(rows) ? rows : [];
          return _customers;
        });
      };
      return ensureCustomers().then(function (customers) {
        if (!customer) {
          customer = (customers || []).find(function (c) { return String(c.id || '') === String(ord.customerId || ord.clientId || ''); }) || _pointsFindCustomerByPhone(ord) || null;
        }
        if (!customer) throw new Error('Cliente não vinculado ao pedido');
        if (_pointsNumber(ord.pointsUsed || 0) > 0 || _pointsNumber(ord.pointsDiscountTotal || 0) > 0 || ord.pointsAppliedAt) {
          throw new Error('Desconto por pontos já aplicado neste pedido.');
        }
        var cfg = _pointsConfigData();
        var balance = _pointsCustomerBalance(customer);
        if (balance < cfg.minimumPointsToUse) throw new Error('Este cliente aún no tiene puntos suficientes para usar descuento.');
        var subtotal = _pointsOrderSubtotal(ord);
        var discountData = _pointsDiscountByBalance(balance, subtotal);
        if (!discountData.discount || !discountData.pointsUsed) throw new Error('Este cliente aún no tiene puntos suficientes para usar descuento.');
        var pointsUsed = discountData.pointsUsed;
        var discountValue = discountData.discount;
        var before = balance;
        var after = Math.max(0, before - pointsUsed);
        var totalNow = Math.max(0, _pointsOrderFinalValue(ord) - discountValue);
        var customerId = String(customer.id || '');
        var movement = {
          customerId: customerId,
          customerName: customer.name || ord.customerName || ord.clientName || 'Cliente',
          orderId: String(ord.id || orderId || ''),
          orderDisplay: ord.orderNumber || ord.number || ord.reference || String(ord.id || orderId || ''),
          type: 'used',
          pointsUsed: pointsUsed,
          discountValue: discountValue,
          balanceBefore: before,
          balanceAfter: after,
          valueConsidered: subtotal,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          note: 'Aplicação de desconto por pontos'
        };
        var orderUpdate = {
          customerId: ord.customerId || ord.clientId || customerId,
          clientId: ord.customerId || ord.clientId || customerId,
          customerName: customer.name || ord.customerName || ord.clientName || 'Cliente',
          clientName: customer.name || ord.customerName || ord.clientName || 'Cliente',
          pointsUsed: pointsUsed,
          pointsDiscountTotal: discountValue,
          pointsBalanceBefore: before,
          pointsBalanceAfter: after,
          discountTotal: _pointsNumber(ord.discountTotal || 0) + discountValue,
          total: totalNow,
          finalSubtotal: Math.max(0, _pointsOrderSubtotal(ord) - (_pointsNumber(ord.discountTotal || 0) + discountValue)),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        var customerUpdate = {
          points: after,
          pointsBalance: after,
          pointsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        return Promise.all([
          DB.update('orders', ord.id || orderId, orderUpdate),
          DB.update('store_customers', customerId, customerUpdate),
          DB.add('points_movements', movement)
        ]).then(function () {
          if (ord.id && _orders && _orders.length) {
            _orders = _orders.map(function (o) {
              if (String(o.id || '') !== String(ord.id || orderId || '')) return o;
              return Object.assign({}, o, orderUpdate, { pointsAppliedAt: new Date().toISOString() });
            });
          }
          if (_customers && _customers.length) {
            _customers = _customers.map(function (c) {
              if (String(c.id || '') !== customerId) return c;
              return Object.assign({}, c, customerUpdate);
            });
          }
          if (_activeSub === 'pontos') _pointsRefresh();
          return { discount: discountValue, pointsUsed: pointsUsed, balanceBefore: before, balanceAfter: after };
        });
      });
    });
  }

  function _pointsGrantForOrder(orderId, orderData, customerData) {
    var order = orderData || null;
    var customer = customerData || null;
    var loadOrder = order ? Promise.resolve(order) : DB.getDoc('orders', orderId);
    return loadOrder.then(function (ord) {
      if (!ord) return false;
      var status = String(ord.status || '').trim();
      if (status !== 'Entregado') return false;
      if (ord.pointsAwardedAt || _pointsNumber(ord.pointsEarned || 0) > 0) return false;
      var ensureCustomers = function () {
        if (_customers && _customers.length) return Promise.resolve(_customers);
        return DB.getAll('store_customers').catch(function () { return []; }).then(function (rows) {
          _customers = Array.isArray(rows) ? rows : [];
          return _customers;
        });
      };
      return ensureCustomers().then(function (customers) {
        if (!customer) {
          customer = (customers || []).find(function (c) { return String(c.id || '') === String(ord.customerId || ord.clientId || ''); }) || _pointsFindCustomerByPhone(ord) || null;
        }
        if (!customer) return false;
        var cfg = _pointsConfigData();
        var earned = Math.max(0, Math.floor(_pointsOrderFinalValue(ord) * cfg.earnPerEuro));
        if (!(earned > 0)) return false;
        var before = _pointsCustomerBalance(customer);
        var after = before + earned;
        var customerId = String(customer.id || '');
        var expirationDate = cfg.pointsExpire && cfg.pointsExpirationDays > 0 ? new Date(Date.now() + cfg.pointsExpirationDays * 24 * 60 * 60 * 1000) : null;
        var movement = {
          customerId: customerId,
          customerName: customer.name || ord.customerName || ord.clientName || 'Cliente',
          orderId: String(ord.id || orderId || ''),
          orderDisplay: ord.orderNumber || ord.number || ord.reference || String(ord.id || orderId || ''),
          type: 'earned',
          pointsEarned: earned,
          balanceBefore: before,
          balanceAfter: after,
          valueConsidered: _pointsOrderFinalValue(ord),
          pointsExpirationDays: expirationDate ? cfg.pointsExpirationDays : 0,
          expiresAt: expirationDate && firebase.firestore.Timestamp && firebase.firestore.Timestamp.fromDate ? firebase.firestore.Timestamp.fromDate(expirationDate) : null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          note: 'Ganho automático ao marcar como entregue'
        };
        return Promise.all([
          DB.update('store_customers', customerId, {
            points: after,
            pointsBalance: after,
            pointsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }),
          DB.update('orders', ord.id || orderId, {
            customerId: ord.customerId || ord.clientId || customerId,
            clientId: ord.customerId || ord.clientId || customerId,
            customerName: customer.name || ord.customerName || ord.clientName || 'Cliente',
            clientName: customer.name || ord.customerName || ord.clientName || 'Cliente',
            pointsEarned: earned,
            pointsAwardedAt: firebase.firestore.FieldValue.serverTimestamp(),
            pointsBalanceBefore: before,
            pointsBalanceAfter: after,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }),
          DB.add('points_movements', movement)
        ]).then(function () {
          if (_customers && _customers.length) {
            _customers = _customers.map(function (c) {
              if (String(c.id || '') !== customerId) return c;
              return Object.assign({}, c, { points: after, pointsBalance: after });
            });
          }
          if (_orders && _orders.length) {
            _orders = _orders.map(function (o) {
              if (String(o.id || '') !== String(ord.id || orderId || '')) return o;
              return Object.assign({}, o, {
                pointsEarned: earned,
                pointsAwardedAt: new Date().toISOString(),
                pointsBalanceBefore: before,
                pointsBalanceAfter: after
              });
            });
          }
          if (_activeSub === 'pontos') _pointsRefresh();
          return true;
        });
      });
    }).catch(function (err) {
      console.warn('[Marketing] points grant failed', err);
      return false;
    });
  }

  function _setReviewSearch(value) { _reviewUi.query = String(value || ''); _paintAvaliacoes(); }
  function _setReviewStatus(value) { _reviewUi.status = value || 'all'; _paintAvaliacoes(); }
  function _setReviewPeriod(value) { _reviewUi.period = value || 'all'; _paintAvaliacoes(); }
  function _setReviewStars(value) { _reviewUi.stars = value || 'all'; _paintAvaliacoes(); }
  function _setReviewPeriodStart(value) { _reviewUi.periodStart = value || ''; _paintAvaliacoes(); }
  function _setReviewPeriodEnd(value) { _reviewUi.periodEnd = value || ''; _paintAvaliacoes(); }

  function _reviewDateValue(v) {
    if (!v) return 0;
    try {
      if (v && typeof v.toDate === 'function') return v.toDate().getTime();
      var d = new Date(v);
      return isFinite(d.getTime()) ? d.getTime() : 0;
    } catch (e) {
      return 0;
    }
  }

  function _reviewTodayBase() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function _reviewPeriodRange(period) {
    var key = String(period || 'all').toLowerCase();
    var today = _reviewTodayBase();
    var start = 0;
    var end = 0;
    if (key === 'today') {
      start = new Date(today.getTime()).getTime();
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    } else if (key === 'yesterday') {
      start = new Date(today.getTime() - 86400000).setHours(0, 0, 0, 0);
      end = new Date(today.getTime() - 1).setHours(23, 59, 59, 999);
    } else if (key === 'last7') {
      start = new Date(today.getTime() - 6 * 86400000).getTime();
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    } else if (key === 'last30') {
      start = new Date(today.getTime() - 29 * 86400000).getTime();
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    } else if (key === 'thismonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    } else if (key === 'lastmonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
      end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).getTime();
    } else if (key === 'custom') {
      start = _reviewDateValue(_reviewUi.periodStart);
      end = _reviewDateValue(_reviewUi.periodEnd);
      if (start) start = new Date(start).setHours(0, 0, 0, 0);
      if (end) end = new Date(end).setHours(23, 59, 59, 999);
    }
    return { key: key, start: start, end: end };
  }

  function _reviewStatusLabel(review) {
    var rawStatus = String((review && review.status) || '').trim().toLowerCase();
    if (review && (review.approved || rawStatus === 'approved')) return { key: 'approved', label: 'Aprovada', tone: '#1A9E5A', bg: '#EDFAF3' };
    if (review && (review.rejected || rawStatus === 'rejected')) return { key: 'rejected', label: 'Rejeitada', tone: '#C4362A', bg: '#FFF0EE' };
    return { key: 'pending', label: 'Pendente', tone: '#D97706', bg: '#FFF8E8' };
  }

  function _reviewSourceLabel(review) {
    var src = String((review && (review.source || review.origin || review.channel || review.from || review.createdFrom)) || '').trim().toLowerCase();
    if (!src) return 'Cardápio';
    if (src === 'public-review' || src === 'review-public' || src === 'store' || src === 'storefront' || src === 'public' || src === 'template') return 'Cardápio';
    if (src === 'form') return 'Formulário';
    if (src === 'admin') return 'Admin';
    return '—';
  }

  function _reviewModerationButtons(review, context) {
    var id = _esc(String((review && review.id) || ''));
    if (!id) return '';
    var status = _reviewStatusLabel(review).key;
    var isModal = context === 'modal';
    var wrapAttrs = isModal ? '' : ' onclick="event.stopPropagation()"';
    var wrapStyle = isModal ? 'display:flex;gap:10px;flex-wrap:wrap;' : 'display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;';
    var approveStyle = isModal
      ? 'flex:1;min-width:130px;padding:13px;border:none;border-radius:11px;background:#EDFAF3;color:#1A9E5A;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;'
      : 'padding:7px 12px;border:none;border-radius:12px;background:#EDFAF3;color:#1A9E5A;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;';
    var rejectStyle = isModal
      ? 'flex:1;min-width:130px;padding:13px;border:none;border-radius:11px;background:#FFF0EE;color:#C4362A;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;'
      : 'padding:7px 12px;border:none;border-radius:12px;background:#FFF0EE;color:#C4362A;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;';
    var html = [];
    if (status !== 'approved') {
      html.push('<button onclick="Modules.Marketing._approveReview(\'' + id + '\')" style="' + approveStyle + '">Aprovar</button>');
    }
    if (status !== 'rejected') {
      html.push('<button onclick="Modules.Marketing._rejectReview(\'' + id + '\')" style="' + rejectStyle + '">Rejeitar</button>');
    }
    return '<div style="' + wrapStyle + '"' + wrapAttrs + '>' + html.join('') + '</div>';
  }

  function _reviewMatchesFilters(review) {
    var q = String(_reviewUi.query || '').trim().toLowerCase();
    var status = String(_reviewUi.status || 'all');
    var stars = String(_reviewUi.stars || 'all');
    var ts = _reviewDateValue(review.createdAt || review.approvedAt || review.updatedAt);
    var range = _reviewPeriodRange(_reviewUi.period);
    var reviewStatus = _reviewStatusLabel(review).key;
    var starValue = Number(review.stars || review.rating || 0) || 0;
    if (q) {
      var text = [
        review.name || '',
        review.customerName || '',
        review.productName || '',
        review.comment || '',
        review.reply || '',
        reviewStatus,
        _reviewSourceLabel(review)
      ].join(' ').toLowerCase();
      if (text.indexOf(q) < 0) return false;
    }
    if (status !== 'all' && reviewStatus !== status) return false;
    if (stars !== 'all' && starValue !== Number(stars)) return false;
    if (range.key !== 'all') {
      if (!ts) return false;
      if (range.start && ts < range.start) return false;
      if (range.end && ts > range.end) return false;
    }
    return true;
  }

  function _reviewFilteredList() {
    return (_reviews || []).filter(_reviewMatchesFilters).sort(function (a, b) {
      return _reviewDateValue(b.createdAt || b.approvedAt || b.updatedAt) - _reviewDateValue(a.createdAt || a.approvedAt || a.updatedAt);
    });
  }

  function _reviewSummary(list) {
    var reviews = Array.isArray(list) ? list : [];
    var approved = reviews.filter(function (r) { return _reviewStatusLabel(r).key === 'approved'; }).length;
    var pending = reviews.filter(function (r) { return _reviewStatusLabel(r).key === 'pending'; }).length;
    var replied = reviews.filter(function (r) { return !!(r.reply && String(r.reply).trim()); }).length;
    var avg = reviews.length ? reviews.reduce(function (sum, r) { return sum + (Number(r.stars || r.rating || 0) || 0); }, 0) / reviews.length : 0;
    return {
      total: reviews.length,
      approved: approved,
      pending: pending,
      replied: replied,
      avg: avg,
      replyRate: reviews.length ? (replied / reviews.length) * 100 : 0
    };
  }

  function _reviewToolbarHtml(summary) {
    var customHtml = _reviewUi.period === 'custom'
      ? '<div style="grid-column:1 / -1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:-2px;">' +
          '<label style="font-size:11px;font-weight:800;color:#8A7E7C;display:block;"><span style="display:block;margin-bottom:4px;">Data inicial</span><input type="date" value="' + _esc(_reviewUi.periodStart || '') + '" onchange="Modules.Marketing._setReviewPeriodStart(this.value)" style="width:100%;padding:11px 12px;border:1.5px solid #D4C8C6;border-radius:12px;background:#fff;font-size:13px;font-family:inherit;outline:none;"></label>' +
          '<label style="font-size:11px;font-weight:800;color:#8A7E7C;display:block;"><span style="display:block;margin-bottom:4px;">Data final</span><input type="date" value="' + _esc(_reviewUi.periodEnd || '') + '" onchange="Modules.Marketing._setReviewPeriodEnd(this.value)" style="width:100%;padding:11px 12px;border:1.5px solid #D4C8C6;border-radius:12px;background:#fff;font-size:13px;font-family:inherit;outline:none;"></label>' +
        '</div>'
      : '';
    return '<div style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:14px 16px;margin-bottom:14px;">' +
      '<div style="display:grid;grid-template-columns:1.4fr .9fr .9fr 1fr;gap:10px;align-items:end;">' +
        '<div><label style="font-size:11px;font-weight:800;color:#8A7E7C;display:block;margin-bottom:4px;">Buscar por cliente, produto, comentário ou status</label><input id="rev-search" type="search" value="' + _esc(_reviewUi.query || '') + '" oninput="Modules.Marketing._setReviewSearch(this.value)" placeholder="Buscar por cliente, produto, comentário ou status" style="width:100%;padding:11px 14px;border:1.5px solid #D4C8C6;border-radius:999px;background:#fff;font-size:13px;font-family:inherit;outline:none;"></div>' +
        '<label style="font-size:11px;font-weight:800;color:#8A7E7C;display:block;"><span style="display:block;margin-bottom:4px;">Status</span><select onchange="Modules.Marketing._setReviewStatus(this.value)" style="width:100%;padding:11px 12px;border:1.5px solid #D4C8C6;border-radius:12px;background:#fff;font-size:13px;font-family:inherit;outline:none;"><option value="all"' + (_reviewUi.status === 'all' ? ' selected' : '') + '>Todas</option><option value="pending"' + (_reviewUi.status === 'pending' ? ' selected' : '') + '>Pendentes</option><option value="approved"' + (_reviewUi.status === 'approved' ? ' selected' : '') + '>Aprovadas</option><option value="rejected"' + (_reviewUi.status === 'rejected' ? ' selected' : '') + '>Rejeitadas</option></select></label>' +
        '<label style="font-size:11px;font-weight:800;color:#8A7E7C;display:block;"><span style="display:block;margin-bottom:4px;">Período</span><select onchange="Modules.Marketing._setReviewPeriod(this.value)" style="width:100%;padding:11px 12px;border:1.5px solid #D4C8C6;border-radius:12px;background:#fff;font-size:13px;font-family:inherit;outline:none;"><option value="all"' + (_reviewUi.period === 'all' ? ' selected' : '') + '>Todos</option><option value="today"' + (_reviewUi.period === 'today' ? ' selected' : '') + '>Hoje</option><option value="yesterday"' + (_reviewUi.period === 'yesterday' ? ' selected' : '') + '>Ontem</option><option value="last7"' + (_reviewUi.period === 'last7' ? ' selected' : '') + '>Últimos 7 dias</option><option value="last30"' + (_reviewUi.period === 'last30' ? ' selected' : '') + '>Últimos 30 dias</option><option value="thismonth"' + (_reviewUi.period === 'thismonth' ? ' selected' : '') + '>Este mês</option><option value="lastmonth"' + (_reviewUi.period === 'lastmonth' ? ' selected' : '') + '>Mês passado</option><option value="custom"' + (_reviewUi.period === 'custom' ? ' selected' : '') + '>Personalizado</option></select></label>' +
        '<label style="font-size:11px;font-weight:800;color:#8A7E7C;display:block;"><span style="display:block;margin-bottom:4px;">Nota</span><select onchange="Modules.Marketing._setReviewStars(this.value)" style="width:100%;padding:11px 12px;border:1.5px solid #D4C8C6;border-radius:12px;background:#fff;font-size:13px;font-family:inherit;outline:none;"><option value="all"' + (_reviewUi.stars === 'all' ? ' selected' : '') + '>Todas</option><option value="5"' + (_reviewUi.stars === '5' ? ' selected' : '') + '>5 estrelas</option><option value="4"' + (_reviewUi.stars === '4' ? ' selected' : '') + '>4 estrelas</option><option value="3"' + (_reviewUi.stars === '3' ? ' selected' : '') + '>3 estrelas</option><option value="2"' + (_reviewUi.stars === '2' ? ' selected' : '') + '>2 estrelas</option><option value="1"' + (_reviewUi.stars === '1' ? ' selected' : '') + '>1 estrela</option></select></label>' +
        customHtml +
      '</div>' +
    '</div>';
  }

  function _reviewCardHtml(review) {
    var status = _reviewStatusLabel(review);
    var stars = '★'.repeat(review.stars || review.rating || 0) + '☆'.repeat(5 - (review.stars || review.rating || 0));
    var text = String(review.comment || '').trim();
    var reply = String(review.reply || '').trim();
    var source = _reviewSourceLabel(review);
    var dateText = UI.fmtDate(review.createdAt || review.approvedAt || review.updatedAt || '');
    return '<div class="review-card" onclick="Modules.Marketing._openReviewModal(\'' + _esc(String(review.id || '')) + '\', \'view\')" style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.05);cursor:pointer;display:flex;flex-direction:column;gap:12px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
        '<div style="min-width:0;flex:1;">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">' +
            '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:' + status.bg + ';color:' + status.tone + ';">' + _esc(status.label) + '</span>' +
            '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:#F2EDED;color:#8A7E7C;">' + _esc(source) + '</span>' +
          '</div>' +
          '<div style="font-size:14px;font-weight:800;color:#1A1A1A;line-height:1.25;">' + _esc(review.name || review.customerName || 'Cliente') + '</div>' +
          '<div style="margin-top:4px;color:#D97706;font-size:16px;">' + _esc(stars) + ' <span style="font-size:12px;color:#8A7E7C;font-weight:600;">(' + (review.stars || review.rating || 0) + '/5)</span></div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">' + _esc(dateText || '—') + '</div>' +
          '<div style="font-size:11px;color:#8A7E7C;margin-top:4px;">' + _esc(review.productName || 'Sem produto') + '</div>' +
        '</div>' +
      '</div>' +
      (text ? '<div style="font-size:13px;color:#1A1A1A;line-height:1.55;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">"' + _esc(text) + '"</div>' : '') +
      (reply ? '<div style="background:#F8F5F5;border:1px solid #EEE6E4;border-radius:12px;padding:10px 12px;font-size:12px;color:#1A1A1A;line-height:1.5;">' +
        '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Resposta</div>' +
        _esc(reply) +
      '</div>' : '') +
      _reviewModerationButtons(review, 'list') +
    '</div>';
  }

  function _openReviewModal(id, mode) {
    var review = _reviews.find(function (x) { return String(x.id) === String(id); });
    if (!review) return;
    var status = _reviewStatusLabel(review);
    var stars = '★'.repeat(review.stars || review.rating || 0) + '☆'.repeat(5 - (review.stars || review.rating || 0));
    var dateText = UI.fmtDate(review.createdAt || review.approvedAt || review.updatedAt || '');
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<section style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:16px;padding:16px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div>' +
            '<div style="font-size:24px;font-weight:900;line-height:1.1;color:#1A1A1A;">' + _esc(review.name || review.customerName || 'Cliente') + '</div>' +
            '<div style="margin-top:8px;color:#D97706;font-size:18px;">' + _esc(stars) + ' <span style="font-size:12px;color:#8A7E7C;font-weight:600;">(' + (review.stars || review.rating || 0) + '/5)</span></div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
            '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:' + status.bg + ';color:' + status.tone + ';">' + _esc(status.label) + '</span>' +
            '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:#F2EDED;color:#8A7E7C;">' + _esc(_reviewSourceLabel(review)) + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px;">' +
          '<div><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Produto</div><div style="font-size:12px;font-weight:700;color:#1A1A1A;">' + _esc(review.productName || '—') + '</div></div>' +
          '<div><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Data</div><div style="font-size:12px;font-weight:700;color:#1A1A1A;">' + _esc(dateText || '—') + '</div></div>' +
          '<div><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Status</div><div style="font-size:12px;font-weight:700;color:#1A1A1A;">' + _esc(status.label) + '</div></div>' +
        '</div>' +
      '</section>' +
      '<section style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;">' +
        '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Comentário</div>' +
        '<div style="font-size:13px;color:#1A1A1A;line-height:1.65;">' + _esc(review.comment || '—') + '</div>' +
      '</section>' +
      '<section style="background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:16px;">' +
        '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Resposta</div>' +
        '<div style="font-size:13px;color:#1A1A1A;line-height:1.65;">' + (review.reply ? _esc(review.reply) : 'Sem resposta ainda.') + '</div>' +
      '</section>' +
    '</div>';
    var footer = '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      _reviewModerationButtons(review, 'modal') +
      '<button onclick="if(window._reviewModal)window._reviewModal.close()" style="flex:1;min-width:120px;padding:13px;border-radius:11px;border:1.5px solid #D4C8C6;background:#fff;color:#1A1A1A;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Fechar</button>' +
    '</div>';
    if (window._reviewModal && typeof window._reviewModal.close === 'function') window._reviewModal.close();
    window._reviewModal = UI.modal({
      title: mode === 'edit' ? 'Editar Avaliação' : 'Resumo da Avaliação',
      body: body,
      footer: footer
    });
  }

  function _uniqueList(list) {
    var seen = {};
    return (list || []).map(String).filter(function (id) {
      if (!id) return false;
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function _marketingCostRaw(raw) {
    raw = raw || {};
    return raw.cost != null ? raw.cost :
      (raw.custo != null ? raw.custo :
      (raw.purchasePrice != null ? raw.purchasePrice :
      (raw.preco_compra != null ? raw.preco_compra :
      (raw.custo_atual != null ? raw.custo_atual :
      (raw.custoAtual != null ? raw.custoAtual :
      (raw.precoCompra != null ? raw.precoCompra :
      (raw.custoCompra != null ? raw.custoCompra :
      (raw.purchase_price != null ? raw.purchase_price : 0))))))));
  }

  function _normalizeMarketingProduct(raw, source, fallbackIndex) {
    raw = raw || {};
    var id = raw.id != null && raw.id !== '' ? raw.id :
      (raw._id != null && raw._id !== '' ? raw._id :
      (raw.productId != null && raw.productId !== '' ? raw.productId :
      (raw.product_id != null && raw.product_id !== '' ? raw.product_id :
      (raw.code != null && raw.code !== '' ? raw.code :
      (raw.slug != null && raw.slug !== '' ? raw.slug :
      (raw.sku != null && raw.sku !== '' ? raw.sku :
      (source ? (source + '_' + fallbackIndex) : '')))))));
    var name = firstText(raw.name, raw.title, raw.productName, raw.nome, raw.label, raw.description, raw.shortDesc, raw.desc, 'Produto');
    var category = firstText(raw.category, raw.categoryName, raw.categoryLabel, raw.categoryTitle, raw.categoryId, raw.categoria, '');
    var tags = Array.isArray(raw.tags) ? raw.tags : [];
    var cost = _marketingCostRaw(raw);
    return {
      id: id,
      name: name,
      title: firstText(raw.title, name),
      price: raw.price != null ? raw.price : (raw.salePrice != null ? raw.salePrice : (raw.valor != null ? raw.valor : (raw.preco != null ? raw.preco : 0))),
      cost: cost,
      purchasePrice: raw.purchasePrice != null ? raw.purchasePrice : cost,
      preco_compra: raw.preco_compra != null ? raw.preco_compra : cost,
      custo_atual: raw.custo_atual != null ? raw.custo_atual : cost,
      custo: raw.custo != null ? raw.custo : cost,
      custoAtual: raw.custoAtual != null ? raw.custoAtual : cost,
      category: category,
      categoryId: raw.categoryId || raw.categoriaId || raw.category || '',
      stock: raw.stock != null ? raw.stock : (raw.estoque != null ? raw.estoque : null),
      tags: tags,
      imageBase64: raw.imageBase64 || raw.imageUrl || raw.image || raw.img || '',
      promo: raw.promo && typeof raw.promo === 'object' ? raw.promo : null,
      source: source || '',
      raw: raw
    };
  }

  function _mergeMarketingProducts(groups) {
    var out = [];
    var seen = {};
    (groups || []).forEach(function (group, idx) {
      (group || []).forEach(function (item, itemIdx) {
        var normalized = _normalizeMarketingProduct(item, 'src' + idx, itemIdx);
        if (!normalized.id) return;
        if (seen[normalized.id]) return;
        seen[normalized.id] = true;
        out.push(normalized);
      });
    });
    return out;
  }

  function _loadMarketingProducts() {
    return Promise.all([
      _safeGetAll('products'),
      _safeGetAll('produtos'),
      _safeGetAll('produtos_prontos'),
      _safeGetAll('fichasTecnicas')
    ]).then(function (groups) {
      return _mergeMarketingProducts(groups);
    }).catch(function () {
      return [];
    });
  }

  function _derivePromoFromProduct(product, index) {
    if (!product || !product.promo || typeof product.promo !== 'object') return null;
    var promo = product.promo;
    var normalized = null;
    try {
      normalized = _normalizePromoRecord(promo, promo.id || promo._id || promo.promoId || ('product_' + String(product.id || index)));
    } catch (err) {
      console.warn('[Marketing] promo derivation failed', err);
      return null;
    }
    normalized.applyTo = normalized.applyTo || 'selected';
    normalized.scope = normalized.scope || 'produtos_selecionados';
    normalized.productIds = _uniqueList((normalized.productIds || []).concat([String(product.id || '')]));
    normalized.productId = normalized.productId || String(product.id || '');
    normalized.productName = normalized.productName || product.name || product.title || '';
    normalized.active = normalized.active !== false;
    return normalized;
  }

  function _mergePromoLists(groups, derivedFromProducts) {
    var out = [];
    var seen = {};
    function addPromo(item) {
      if (!item) return;
      var normalized;
      try {
        normalized = _normalizePromoRecord(item, item.id || item._id || item.promoId || '');
      } catch (err) {
        console.warn('[Marketing] promo normalization failed', err);
        return;
      }
      var id = String(normalized.id || '');
      var key = id || (normalized.name || '') + '|' + (normalized.type || '') + '|' + (normalized.startDate || '') + '|' + (normalized.endDate || '') + '|' + (normalized.valuePercentual != null ? normalized.valuePercentual : normalized.valueDesconto != null ? normalized.valueDesconto : normalized.value || '');
      if (seen[key]) {
        var existing = seen[key];
        existing.productIds = _uniqueList((existing.productIds || []).concat(normalized.productIds || []));
        if (!existing.productId && normalized.productId) existing.productId = normalized.productId;
        if (!existing.productName && normalized.productName) existing.productName = normalized.productName;
        return;
      }
      seen[key] = normalized;
      out.push(normalized);
    }

    (groups || []).forEach(function (group) {
      (group || []).forEach(addPromo);
    });
    (derivedFromProducts || []).forEach(addPromo);
    return out;
  }

  function _normalizePromoRecord(promo, idFallback) {
    promo = promo || {};
    var rawType = promo.type != null ? promo.type : (promo.tipo != null ? promo.tipo : promo.discountType);
    var productIds = [];
    if (Array.isArray(promo.productIds)) productIds = productIds.concat(promo.productIds);
    if (promo.productId != null && promo.productId !== '') productIds.push(promo.productId);
    if (Array.isArray(promo.productsSelected)) productIds = productIds.concat(promo.productsSelected);
    if (Array.isArray(promo.selectedProductIds)) productIds = productIds.concat(promo.selectedProductIds);
    if (Array.isArray(promo.suggestedProductIds)) productIds = productIds.concat(promo.suggestedProductIds);
    if (Array.isArray(promo.suggestedIds)) productIds = productIds.concat(promo.suggestedIds);
    if (Array.isArray(promo.products)) productIds = productIds.concat(promo.products.map(function (item) { return item && typeof item === 'object' ? item.id || item.productId || item.uid : item; }));
    if (Array.isArray(promo.items)) productIds = productIds.concat(promo.items.map(function (item) { return item && typeof item === 'object' ? item.id || item.productId || item.uid : item; }));
    productIds = productIds.map(String).filter(Boolean);
    var seen = {};
    productIds = productIds.filter(function (id) { if (seen[id]) return false; seen[id] = true; return true; });

    var active = promo.active;
    if (active == null) {
      if (promo.status != null) {
        var st = String(promo.status).toLowerCase();
        active = !(st === 'pausada' || st === 'paused' || st === 'inativa' || st === 'inactive' || st === 'finalizada' || st === 'expired');
      } else {
        active = true;
      }
    }

    return Object.assign({}, promo, {
      id: promo.id || promo._id || idFallback || '',
      name: firstText(promo.name, promo.title, promo.nome, promo.label, promo.description),
      type: _normalizePromoType(rawType || promo.type),
      active: active !== false,
      startDate: promo.startDate || promo.startsAt || promo.dataInicio || promo.inicio || '',
      endDate: promo.endDate || promo.endsAt || promo.dataFim || promo.fim || '',
      applyTo: promo.applyTo || (promo.scope === 'produtos_selecionados' ? 'selected' : 'all'),
      scope: promo.scope || (productIds.length ? 'produtos_selecionados' : 'todos_produtos'),
      productIds: productIds,
      productId: promo.productId || (productIds[0] || ''),
      productName: firstText(promo.productName, promo.product || promo.produto || ''),
      valuePercentual: promo.valuePercentual != null ? promo.valuePercentual : promo.discountPct != null ? promo.discountPct : promo.pctValue != null ? promo.pctValue : promo.value,
      valueDesconto: promo.valueDesconto != null ? promo.valueDesconto : promo.eurValue != null ? promo.eurValue : promo.fixedDiscount != null ? promo.fixedDiscount : promo.value,
      fixedPrice: promo.fixedPrice != null ? promo.fixedPrice : promo.finalPrice != null ? promo.finalPrice : promo.offerPrice != null ? promo.offerPrice : promo.priceFixed != null ? promo.priceFixed : '',
      leveQtd: promo.leveQtd != null ? promo.leveQtd : promo.leve != null ? promo.leve : (_normalizePromoType(rawType || promo.type) === 'add1' && /^(2x1|2por1|two_for_one|b2x1|pack)$/i.test(String(rawType || promo.type || '')) ? 2 : ''),
      pagueQtd: promo.pagueQtd != null ? promo.pagueQtd : promo.pague != null ? promo.pague : (_normalizePromoType(rawType || promo.type) === 'add1' && /^(2x1|2por1|two_for_one|b2x1|pack)$/i.test(String(rawType || promo.type || '')) ? 1 : '')
    });
  }

  function _promoAutoTags(promo) {
    var type = _normalizePromoType(promo && promo.type);
    if (type === 'pct') return [{ key: 'promo_desconto_percentual', label: 'promo_desconto_percentual' }, { key: 'oferta', label: 'oferta' }];
    if (type === 'eur') return [{ key: 'promo_desconto_valor', label: 'promo_desconto_valor' }, { key: 'oferta', label: 'oferta' }];
    if (type === 'add1') return [{ key: 'promo_leve_mais', label: 'promo_leve_mais' }, { key: 'ticket_medio', label: 'ticket_medio' }];
    if (type === 'fixed') return [{ key: 'promo_oferta_dia', label: 'promo_oferta_dia' }, { key: 'oferta', label: 'oferta' }];
    if (type === 'frete') return [{ key: 'promo_frete_gratis', label: 'promo_frete_gratis' }, { key: 'oferta', label: 'oferta' }];
    return [{ key: 'oferta', label: 'oferta' }];
  }

  function _marketingCardStyle() {
    return 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
  }

  function _marketingInputStyle() {
    return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;';
  }

  function _marketingSelectStyle() {
    return _marketingInputStyle() + 'appearance:none;-webkit-appearance:none;background-image:linear-gradient(45deg,transparent 50%,#6F6860 50%),linear-gradient(135deg,#6F6860 50%,transparent 50%);background-position:calc(100% - 19px) 50%,calc(100% - 14px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:34px;';
  }

  function _marketingLabelStyle() {
    return 'display:block;font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;';
  }

  function _marketingChip(text) {
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(text) + '</span>';
  }

  function _marketingSectionTitle(title, desc) {
    return '<div style="margin-bottom:14px;">' +
      '<h3 style="font-size:14px;font-weight:600;margin:0 0 4px;color:#1F1F1F;">' + _esc(title) + '</h3>' +
      '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">' + _esc(desc || '') + '</p>' +
    '</div>';
  }

  function _marketingTone(tone) {
    if (tone === 'success') return { bg: '#F0FAF4', color: '#1F6F43', border: '#D9F2E3' };
    if (tone === 'danger') return { bg: '#FFF0EE', color: '#B42318', border: '#F8D1CC' };
    if (tone === 'warning') return { bg: '#FFF7ED', color: '#B45309', border: '#FEDF89' };
    if (tone === 'info') return { bg: '#F2F7FF', color: '#2F5F93', border: '#D6E6FF' };
    if (tone === 'product') return { bg: '#FAF8F4', color: '#8A6F5A', border: '#E6DDD3' };
    return { bg: '#FAF8F4', color: '#6F6860', border: '#EAE4DA' };
  }

  function _marketingKpi(label, value, icon, tone) {
    var c = _marketingTone(tone);
    return '<div class="kpi-tile" style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">' +
      '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + c.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<span class="mi" style="font-size:24px;">' + _esc(icon || 'analytics') + '</span>' +
      '</div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
        '<span style="display:block;font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
        '<strong style="display:block;font-family:inherit;font-size:34px;font-weight:700;color:#1F1F1F;line-height:1;word-break:break-word;letter-spacing:0;">' + _esc(value) + '</strong>' +
      '</div>' +
    '</div>';
  }

  function _marketingTh(label, align) {
    return '<th style="text-align:' + (align || 'left') + ';padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">' + _esc(label) + '</th>';
  }

  function _marketingTd(html, align) {
    return '<td style="padding:12px 16px;border-bottom:1px solid #EAE4DA;text-align:' + (align || 'left') + ';vertical-align:middle;">' + html + '</td>';
  }

  function _marketingModalSectionStyle() {
    return 'background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
  }

  function _marketingModalLabelStyle() {
    return 'font-size:11px;font-weight:600;color:#7A746B;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.02em;';
  }

  function _promoTypeLabel(type) {
    var t = _normalizePromoType(type);
    if (t === 'pct') return 'Desconto (%)';
    if (t === 'eur') return 'Desconto (€)';
    if (t === 'add1') return 'Leve X, pague Y';
    if (t === 'fixed') return 'Preço fixo';
    if (t === 'frete') return 'Frete grátis';
    return 'Promoção';
  }

  function _promoStatusInfo(promo) {
    var now = Date.now();
    var start = _promoDateValue(promo && (promo.startDate || promo.startsAt));
    var end = _promoDateValue(promo && (promo.endDate || promo.endsAt));
    if (end) end = _promoEndOfDay(end);
    var active = promo && promo.active !== false;
    if (start && start > now) return { key: 'scheduled', label: 'Agendada', tone: '#3B82F6', bg: '#EEF4FF' };
    if (end && end < now) return { key: active ? 'expired' : 'finalized', label: active ? 'Expirada' : 'Finalizada', tone: '#8A7E7C', bg: '#F2EDED' };
    if (!active) return { key: 'paused', label: 'Pausada', tone: '#D97706', bg: '#FFF8E8' };
    return { key: 'active', label: 'Ativa', tone: '#1A9E5A', bg: '#EDFAF3' };
  }

  function _promoDateValue(v) {
    if (!v) return 0;
    if (typeof v === 'number' && isFinite(v)) return v;
    if (v && typeof v.toDate === 'function') {
      try { return v.toDate().getTime(); } catch (e) { return 0; }
    }
    var d = new Date(v);
    return isFinite(d.getTime()) ? d.getTime() : 0;
  }

  function _promoTodayIso() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function _promoStartOfDay(ts) {
    var d = ts ? new Date(ts) : new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function _promoStartOfWeek(ts) {
    var d = ts ? new Date(ts) : new Date();
    d.setHours(0, 0, 0, 0);
    var day = d.getDay() || 7;
    d.setDate(d.getDate() - (day - 1));
    return d.getTime();
  }

  function _promoStartOfMonth(ts) {
    var d = ts ? new Date(ts) : new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d.getTime();
  }

  function _promoEndOfDay(ts) {
    var d = ts ? new Date(ts) : new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }

  function _promoResolvedTypeLabel(p) {
    return _promoTypeLabel(p && p.type);
  }

  function _promoEndTs(promo) {
    return _promoDateValue(promo && (promo.endDate || promo.endsAt));
  }

  function _promoStartTs(promo) {
    return _promoDateValue(promo && (promo.startDate || promo.startsAt));
  }

  function _promoProductIds(promo) {
    if (!promo) return [];
    var ids = [];
    if (Array.isArray(promo.productIds)) ids = ids.concat(promo.productIds);
    if (promo.productId != null && promo.productId !== '') ids.push(promo.productId);
    if (Array.isArray(promo.productsSelected)) ids = ids.concat(promo.productsSelected);
    if (Array.isArray(promo.selectedProductIds)) ids = ids.concat(promo.selectedProductIds);
    if (Array.isArray(promo.suggestedProductIds)) ids = ids.concat(promo.suggestedProductIds);
    if (Array.isArray(promo.suggestedIds)) ids = ids.concat(promo.suggestedIds);
    if (Array.isArray(promo.products)) ids = ids.concat(promo.products.map(function (item) { return item && typeof item === 'object' ? item.id || item.productId || item.uid : item; }));
    if (Array.isArray(promo.items)) ids = ids.concat(promo.items.map(function (item) { return item && typeof item === 'object' ? item.id || item.productId || item.uid : item; }));
    var seen = {};
    return ids.map(String).filter(function (id) {
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function _promoAppliesToAllProducts(promo) {
    if (!promo) return true;
    var ids = _promoProductIds(promo);
    if (ids.length && (promo.applyTo === 'selected' || promo.scope === 'produtos_selecionados' || !promo.scope)) return false;
    if (promo.applyTo === 'all' || promo.scope === 'todos_produtos') return true;
    return !ids.length;
  }

  function _promoIsProductOffer(promo) {
    var type = _normalizePromoType(promo && promo.type);
    return type === 'pct' || type === 'eur' || type === 'add1' || type === 'fixed';
  }

  function _promoDateRange(startDate, endDate) {
    var start = _promoDateValue(startDate);
    var end = _promoDateValue(endDate);
    return {
      start: start ? _promoStartOfDay(start) : 0,
      end: end ? _promoEndOfDay(end) : Number.MAX_SAFE_INTEGER
    };
  }

  function _promoRangesOverlap(aStart, aEnd, bStart, bEnd) {
    var a = _promoDateRange(aStart, aEnd);
    var b = _promoDateRange(bStart, bEnd);
    return a.start <= b.end && b.start <= a.end;
  }

  function _promoSameProductConflict(data, editingId) {
    if (!data || data.active === false || !_promoIsProductOffer(data)) return null;
    var currentAll = _promoAppliesToAllProducts(data);
    var currentIds = _promoProductIds(data);
    var currentSet = {};
    currentIds.forEach(function (id) { currentSet[String(id)] = true; });

    var conflict = (_promos || []).find(function (promo) {
      if (!promo || promo.active === false || !_promoIsProductOffer(promo)) return false;
      if (editingId && String(promo.id) === String(editingId)) return false;
      if (!_promoRangesOverlap(data.startDate || data.startsAt, data.endDate || data.endsAt, promo.startDate || promo.startsAt, promo.endDate || promo.endsAt)) return false;
      var promoAll = _promoAppliesToAllProducts(promo);
      if (currentAll || promoAll) return true;
      return _promoProductIds(promo).some(function (id) { return !!currentSet[String(id)]; });
    });

    if (!conflict) return null;
    if (_promoAppliesToAllProducts(conflict)) {
      return 'Já existe uma promoção para todos os produtos nesse mesmo período: ' + (conflict.name || 'promoção sem nome') + '.';
    }
    return 'Um dos produtos selecionados já está em outra promoção no mesmo período: ' + (conflict.name || 'promoção sem nome') + '.';
  }

  function _validatePromoSchedule(data, editingId) {
    var todayIso = _promoTodayIso();
    var startDate = data && (data.startDate || data.startsAt) || '';
    var endDate = data && (data.endDate || data.endsAt) || '';
    if (!startDate || !endDate) return 'Informe a data de início e a data de fim da promoção.';
    if (startDate < todayIso) return 'A data de início não pode ser anterior a hoje.';
    if (endDate < todayIso) return 'A data de fim não pode ser anterior a hoje.';
    if (endDate < startDate) return 'A data de fim deve ser igual ou posterior à data de início.';
    return _promoSameProductConflict(data, editingId);
  }

  function _promoProductsForPromo(promo) {
    var ids = _promoProductIds(promo);
    if (!ids.length) return [];
    var set = {};
    ids.forEach(function (id) { set[String(id)] = true; });
    return (_products || []).filter(function (prod) { return set[String(prod.id)]; });
  }

  function _promoMatchesProduct(promo, product) {
    if (!promo || !product) return false;
    var active = promo.active !== false;
    var now = Date.now();
    var start = _promoStartTs(promo);
    var end = _promoEndTs(promo);
    if (start && start > now) return false;
    if (end && end < now) return false;
    if (promo.applyTo === 'all' || promo.scope === 'todos_produtos') return true;
    var ids = _promoProductIds(promo);
    return ids.indexOf(String(product.id)) >= 0;
  }

  function _promoVisibleStatus(promo) {
    return _promoStatusInfo(promo).key;
  }

  function _promoSearchText(promo) {
    var tags = _promoAutoTags(promo).map(function (t) { return t.label; }).join(' ');
    var products = _promoProductsForPromo(promo).slice(0, 4).map(function (p) { return p.name || ''; }).join(' ');
    return [
      promo.name || '',
      _promoResolvedTypeLabel(promo),
      promo.valuePercentual != null ? String(promo.valuePercentual) : '',
      promo.valueDesconto != null ? String(promo.valueDesconto) : '',
      promo.discountPct != null ? String(promo.discountPct) : '',
      promo.fixedPrice != null ? String(promo.fixedPrice) : '',
      promo.value != null ? String(promo.value) : '',
      promo.active !== false ? 'ativa' : 'pausada',
      _promoStatusInfo(promo).label,
      tags,
      products,
      promo.productName || '',
      promo.startDate || promo.startsAt || '',
      promo.endDate || promo.endsAt || ''
    ].join(' ').toLowerCase();
  }

  function _promoMatchesSearch(promo) {
    var q = (_promoUi.query || '').trim().toLowerCase();
    if (!q) return true;
    return _promoSearchText(promo).indexOf(q) >= 0;
  }

  function _promoMatchesStatus(promo) {
    var filter = _promoUi.status || 'all';
    if (filter === 'all') return true;
    return _promoVisibleStatus(promo) === filter;
  }

  function _promoMatchesType(promo) {
    var filter = _promoUi.type || 'all';
    if (filter === 'all') return true;
    return _normalizePromoType(promo && promo.type) === filter;
  }

  function _promoMatchesPeriod(promo) {
    var filter = _promoUi.period || 'all';
    if (filter === 'all') return true;
    var now = Date.now();
    var start = _promoStartTs(promo);
    var end = _promoEndTs(promo);
    if (filter === 'today') {
      var startDay = _promoStartOfDay(now);
      var endDay = _promoEndOfDay(now);
      return (start && start >= startDay && start <= endDay) || (end && end >= startDay && end <= endDay);
    }
    if (filter === 'week') {
      return (start && start >= _promoStartOfWeek(now)) || (end && end >= _promoStartOfWeek(now));
    }
    if (filter === 'month') {
      return (start && start >= _promoStartOfMonth(now)) || (end && end >= _promoStartOfMonth(now));
    }
    if (filter === 'scheduled') return _promoStatusInfo(promo).key === 'scheduled';
    if (filter === 'expired') return _promoStatusInfo(promo).key === 'expired' || _promoStatusInfo(promo).key === 'finalized';
    if (filter === 'custom') {
      var rangeStart = _promoDateValue(_promoUi.periodStart);
      var rangeEnd = _promoDateValue(_promoUi.periodEnd);
      if (!rangeStart && !rangeEnd) return true;
      if (!rangeStart) rangeStart = 0;
      if (!rangeEnd) rangeEnd = now;
      if (rangeStart > rangeEnd) {
        var swap = rangeStart;
        rangeStart = rangeEnd;
        rangeEnd = swap;
      }
      var promoStart = start || 0;
      var promoEnd = end || now;
      if (!start && !end) return _promoStatusInfo(promo).key === 'active' || _promoStatusInfo(promo).key === 'scheduled' || _promoStatusInfo(promo).key === 'paused';
      return promoEnd >= rangeStart && promoStart <= rangeEnd;
    }
    return true;
  }

  function _promoFilteredList() {
    return (_promos || []).slice().sort(function (a, b) {
      return _promoDateValue(b.updatedAt || b.createdAt || b.startDate || 0) - _promoDateValue(a.updatedAt || a.createdAt || a.startDate || 0);
    }).filter(function (promo) {
      return _promoMatchesSearch(promo) && _promoMatchesStatus(promo) && _promoMatchesType(promo) && _promoMatchesPeriod(promo);
    });
  }

  function _promoHasActiveFilters() {
    return !!((_promoUi.query || '').trim() || _promoUi.status !== 'all' || _promoUi.type !== 'all' || _promoUi.period !== 'all' || _promoUi.periodStart || _promoUi.periodEnd);
  }

  function _promoPaging(list) {
    var total = (list || []).length;
    var pageSize = parseInt(_promoUi.pageSize, 10) || 10;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(parseInt(_promoUi.page, 10) || 1, 1), totalPages);
    _promoUi.page = page;
    var startIdx = (page - 1) * pageSize;
    var endIdx = Math.min(startIdx + pageSize, total);
    return {
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? startIdx + 1 : 0,
      end: endIdx,
      items: (list || []).slice(startIdx, endIdx)
    };
  }

  function _promoSummary(list) {
    var promos = list || _promoFilteredList();
    var active = promos.filter(function (p) { return _promoStatusInfo(p).key === 'active'; }).length;
    var scheduled = promos.filter(function (p) { return _promoStatusInfo(p).key === 'scheduled'; }).length;
    var expired = promos.filter(function (p) { return _promoStatusInfo(p).key === 'expired' || _promoStatusInfo(p).key === 'finalized'; }).length;
    var products = {};
    promos.forEach(function (promo) {
      _promoProductsForPromo(promo).forEach(function (p) { products[String(p.id)] = true; });
    });
    return {
      active: active,
      products: Object.keys(products).length,
      scheduled: scheduled,
      expired: expired
    };
  }

  function _promoSummaryHtml(summary) {
    summary = summary || _promoSummary();
    return '<div class="growth-grid" style="margin-bottom:0;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' +
      _marketingKpi('Promoções ativas', summary.active, 'campaign', summary.active ? 'success' : 'neutral') +
      _marketingKpi('Produtos em promoção', summary.products, 'sell', summary.products ? 'product' : 'neutral') +
      _marketingKpi('Agendadas', summary.scheduled, 'event', summary.scheduled ? 'info' : 'neutral') +
      _marketingKpi('Expiradas', summary.expired, 'schedule', summary.expired ? 'danger' : 'neutral') +
    '</div>';
  }

  function _promoToolbarHtml() {
    var customHtml = _promoUi.period === 'custom'
      ? '<div style="grid-column:1 / -1;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,220px));gap:10px;align-items:end;">' +
          '<label style="' + _marketingLabelStyle() + '">Data inicial<input type="date" value="' + _esc(_promoUi.periodStart || '') + '" onchange="Modules.Marketing._setPromoPeriodStart(this.value)" style="' + _marketingInputStyle() + 'height:40px;margin-top:5px;background:#FFFCF8;"></label>' +
          '<label style="' + _marketingLabelStyle() + '">Data final<input type="date" value="' + _esc(_promoUi.periodEnd || '') + '" onchange="Modules.Marketing._setPromoPeriodEnd(this.value)" style="' + _marketingInputStyle() + 'height:40px;margin-top:5px;background:#FFFCF8;"></label>' +
        '</div>'
      : '';
    var clearHtml = _promoHasActiveFilters()
      ? '<div style="grid-column:1 / -1;display:flex;justify-content:flex-start;"><button type="button" onclick="Modules.Marketing._clearPromoFilters()" style="height:36px;padding:0 13px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>'
      : '';
    return '<div style="' + _marketingCardStyle() + 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px 18px;box-shadow:0 10px 24px rgba(31,31,31,.055);">' +
      '<div style="display:grid;grid-template-columns:minmax(260px,1.35fr) minmax(150px,180px) minmax(150px,180px) minmax(160px,190px);gap:10px;align-items:end;">' +
        '<label style="' + _marketingLabelStyle() + '">Buscar<input id="prm-search" type="search" value="' + _esc(_promoUi.query || '') + '" oninput="Modules.Marketing._setPromoSearch(this.value)" placeholder="Promoção, produto, tipo ou tag" autocomplete="off" style="' + _marketingInputStyle() + 'height:40px;margin-top:5px;background:#FFFCF8;"></label>' +
        '<label style="' + _marketingLabelStyle() + '">Status<select onchange="Modules.Marketing._setPromoStatus(this.value)" style="' + _marketingSelectStyle() + 'height:40px;margin-top:5px;background-color:#FFFCF8;"><option value="all"' + (_promoUi.status === 'all' ? ' selected' : '') + '>Todas</option><option value="active"' + (_promoUi.status === 'active' ? ' selected' : '') + '>Ativas</option><option value="scheduled"' + (_promoUi.status === 'scheduled' ? ' selected' : '') + '>Agendadas</option><option value="paused"' + (_promoUi.status === 'paused' ? ' selected' : '') + '>Pausadas</option><option value="finalized"' + (_promoUi.status === 'finalized' ? ' selected' : '') + '>Finalizadas</option><option value="expired"' + (_promoUi.status === 'expired' ? ' selected' : '') + '>Expiradas</option></select></label>' +
        '<label style="' + _marketingLabelStyle() + '">Tipo<select onchange="Modules.Marketing._setPromoTypeFilter(this.value)" style="' + _marketingSelectStyle() + 'height:40px;margin-top:5px;background-color:#FFFCF8;"><option value="all"' + (_promoUi.type === 'all' ? ' selected' : '') + '>Todos</option><option value="pct"' + (_promoUi.type === 'pct' ? ' selected' : '') + '>Desconto (%)</option><option value="eur"' + (_promoUi.type === 'eur' ? ' selected' : '') + '>Desconto (€)</option><option value="add1"' + (_promoUi.type === 'add1' ? ' selected' : '') + '>Leve X, pague Y</option><option value="frete"' + (_promoUi.type === 'frete' ? ' selected' : '') + '>Frete grátis</option></select></label>' +
        '<label style="' + _marketingLabelStyle() + '">Período<select onchange="Modules.Marketing._setPromoPeriod(this.value)" style="' + _marketingSelectStyle() + 'height:40px;margin-top:5px;background-color:#FFFCF8;"><option value="all"' + (_promoUi.period === 'all' ? ' selected' : '') + '>Todos</option><option value="today"' + (_promoUi.period === 'today' ? ' selected' : '') + '>Hoje</option><option value="week"' + (_promoUi.period === 'week' ? ' selected' : '') + '>Esta semana</option><option value="month"' + (_promoUi.period === 'month' ? ' selected' : '') + '>Este mês</option><option value="scheduled"' + (_promoUi.period === 'scheduled' ? ' selected' : '') + '>Agendadas</option><option value="expired"' + (_promoUi.period === 'expired' ? ' selected' : '') + '>Expiradas</option><option value="custom"' + (_promoUi.period === 'custom' ? ' selected' : '') + '>Personalizado</option></select></label>' +
        customHtml +
        clearHtml +
      '</div>' +
    '</div>';
  }

  function _promoEmptyStateHtml() {
    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="text-align:center;padding:60px 20px;color:#7A746B;">' +
        '<div style="width:54px;height:54px;border-radius:16px;background:#FAF8F4;border:1px solid #EAE4DA;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span class="mi" style="font-size:26px;color:#A39B90;">campaign</span></div>' +
        '<p style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 6px;">Nenhuma promoção encontrada</p>' +
        '<p style="font-size:13px;color:#7A746B;margin:0 0 16px;">Crie promoções para destacar produtos, aumentar pedidos e testar ofertas.</p>' +
        '<button onclick="Modules.Marketing._openPromoModal(null, \'edit\')" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);">Criar promoção</button>' +
      '</div>' +
    '</div>';
  }

  function _promoSetFilter(key, value) {
    _promoUi[key] = value;
    _promoUi.page = 1;
    _paintPromos();
  }

  function _setPromoSearch(value) {
    _promoSetFilter('query', value || '');
    setTimeout(function () {
      var input = document.getElementById('prm-search');
      if (!input) return;
      var pos = String(_promoUi.query || '').length;
      input.focus();
      if (input.setSelectionRange) input.setSelectionRange(pos, pos);
    }, 0);
  }
  function _setPromoStatus(value) { _promoSetFilter('status', value || 'all'); }
  function _setPromoTypeFilter(value) { _promoSetFilter('type', value || 'all'); }
  function _setPromoPeriod(value) { _promoSetFilter('period', value || 'all'); }
  function _setPromoPeriodStart(value) { _promoUi.periodStart = value || ''; _promoUi.page = 1; _paintPromos(); }
  function _setPromoPeriodEnd(value) { _promoUi.periodEnd = value || ''; _promoUi.page = 1; _paintPromos(); }
  function _setPromoPage(page) { _promoUi.page = parseInt(page, 10) || 1; _paintPromos(); }
  function _setPromoPageSize(size) { _promoUi.pageSize = parseInt(size, 10) || 10; _promoUi.page = 1; _paintPromos(); }
  function _clearPromoFilters() {
    _promoUi.query = '';
    _promoUi.status = 'all';
    _promoUi.type = 'all';
    _promoUi.period = 'all';
    _promoUi.periodStart = '';
    _promoUi.periodEnd = '';
    _promoUi.page = 1;
    _paintPromos();
  }

  function _promoStatusTone(statusKey) {
    if (statusKey === 'active') return { bg: '#EDFAF3', color: '#1A9E5A' };
    if (statusKey === 'scheduled') return { bg: '#EEF4FF', color: '#3B82F6' };
    if (statusKey === 'paused') return { bg: '#FFF8E8', color: '#D97706' };
    if (statusKey === 'expired') return { bg: '#FFF0EE', color: '#B42318' };
    return { bg: '#F2EDED', color: '#8A7E7C' };
  }

  function _promoCardMetaTagHtml(promo) {
    return _promoAutoTags(promo).map(function (tag) {
      return '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#FFF0EE;color:#B42318;">' + _esc(tag.label) + '</span>';
    }).join('');
  }

  function _promoCardAlertList(promo) {
    return _promoAlerts(promo).slice(0, 2).map(function (a) {
      return '<div style="font-size:11px;color:' + a.color + ';font-weight:700;">' + _esc(a.text) + '</div>';
    }).join('');
  }

  function _promoMainProductsHtml(promo) {
    var ids = _promoProductsForPromo(promo);
    if (!ids.length) return '<span style="font-size:11px;color:#8A7E7C;">Sem produto vinculado</span>';
    var first = ids.slice(0, 3).map(function (p) { return _esc(p.name || 'Produto'); }).join(' · ');
    return '<span style="font-size:11px;color:#8A7E7C;">' + first + (ids.length > 3 ? ' +' + (ids.length - 3) : '') + '</span>';
  }

  function _promoCardHTML(promo) {
    var status = _promoStatusInfo(promo);
    var tone = _promoStatusTone(status.key);
    var typeLabel = _promoTypeLabel(promo.type);
    var normalizedType = _normalizePromoType(promo.type);
    var valueLabel = normalizedType === 'pct'
      ? (_promoLegacyPct(promo) > 0 ? _promoLegacyPct(promo) + '%' : '—')
      : normalizedType === 'eur'
        ? (_promoLegacyEur(promo) > 0 ? UI.fmt(_promoLegacyEur(promo)) : '—')
        : normalizedType === 'fixed'
          ? (_promoLegacyFixedPrice(promo) > 0 ? UI.fmt(_promoLegacyFixedPrice(promo)) : '—')
          : normalizedType === 'add1'
              ? ('Leve ' + (promo.leveQtd || 0) + ', pague ' + (promo.pagueQtd || 0))
              : normalizedType === 'frete'
                ? (promo.minOrder > 0 ? 'Frete grátis a partir de ' + UI.fmt(promo.minOrder) : 'Frete grátis')
              : '—';
    var dates = [
      promo.startDate || promo.startsAt ? 'Início: ' + UI.fmtDate(new Date(promo.startDate || promo.startsAt)) : 'Início: —',
      promo.endDate || promo.endsAt ? 'Fim: ' + UI.fmtDate(new Date(promo.endDate || promo.endsAt)) : 'Fim: —'
    ];
    var productCount = _promoProductsForPromo(promo).length;
    var mainProducts = _promoMainProductsHtml(promo);
    var alerts = _promoCardAlertList(promo);
    var insight = _promoInsight(promo);
    var promoIdArg = _esc(String(promo.id));
    var activeLabel = status.key === 'active' || status.key === 'scheduled' ? 'Pausar' : 'Ativar';
    return '<div class="promo-card" onclick="Modules.Marketing._openPromoModal(\'' + promoIdArg + '\', \'view\')" style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:14px 16px;box-shadow:0 1px 2px rgba(31,31,31,.03);cursor:pointer;display:flex;gap:14px;align-items:flex-start;">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.25;">' + _esc(promo.name || 'Promoção') + '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;">' +
              '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:' + (normalizedType === 'pct' ? '#F0FAF4' : normalizedType === 'eur' ? '#F2F7FF' : normalizedType === 'fixed' ? '#FFF7ED' : '#FFF7ED') + ';color:' + (normalizedType === 'pct' ? '#1F6F43' : normalizedType === 'eur' ? '#2F5F93' : normalizedType === 'fixed' ? '#B45309' : '#B45309') + ';">' + _esc(typeLabel) + '</span>' +
              '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:' + tone.bg + ';color:' + tone.color + ';">' + _esc(status.label) + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:160px;">' +
            '<div style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(valueLabel) + '</div>' +
            '<div style="font-size:12px;color:#6F6860;text-align:right;">' + productCount + ' produto' + (productCount === 1 ? '' : 's') + ' vinculado' + (productCount === 1 ? '' : 's') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px;">' +
          '<div><div style="font-size:10px;font-weight:600;color:#A39B90;text-transform:uppercase;">Início</div><div style="font-size:12px;font-weight:500;color:#1F1F1F;">' + dates[0].replace('Início: ', '') + '</div></div>' +
          '<div><div style="font-size:10px;font-weight:600;color:#A39B90;text-transform:uppercase;">Fim</div><div style="font-size:12px;font-weight:500;color:#1F1F1F;">' + dates[1].replace('Fim: ', '') + '</div></div>' +
          '<div><div style="font-size:10px;font-weight:600;color:#A39B90;text-transform:uppercase;">Produto principal</div><div style="font-size:12px;font-weight:500;color:#1F1F1F;">' + mainProducts + '</div></div>' +
        '</div>' +
        (alerts ? '<div style="margin-top:10px;display:flex;flex-direction:column;gap:4px;">' + alerts + '</div>' : '') +
        (insight ? '<div style="margin-top:10px;font-size:12px;font-weight:600;color:' + insight.color + ';">' + _esc(insight.text) + '</div>' : '') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;min-width:180px;">' +
        '<button onclick="event.stopPropagation();Modules.Marketing._openPromoModal(\'' + promoIdArg + '\', \'view\')" style="height:32px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;">Ver detalhes</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._openPromoModal(\'' + promoIdArg + '\', \'edit\')" style="height:32px;padding:0 12px;border:1px solid #D6E6FF;border-radius:10px;background:#F2F7FF;color:#2F5F93;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;">Editar</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._togglePromoStatus(\'' + promoIdArg + '\')" style="height:32px;padding:0 12px;border:1px solid ' + (promo.active !== false ? '#FEDF89' : '#D9F2E3') + ';border-radius:10px;background:' + (promo.active !== false ? '#FFF7ED' : '#F0FAF4') + ';color:' + (promo.active !== false ? '#B45309' : '#1F6F43') + ';font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;">' + activeLabel + '</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._duplicatePromo(\'' + promoIdArg + '\')" style="height:32px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#FAF8F4;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;">Duplicar</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._deletePromo(\'' + promoIdArg + '\')" style="height:32px;padding:0 12px;border:1px solid #F8D1CC;border-radius:10px;background:#FFF0EE;color:#B42318;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;">Excluir</button>' +
      '</div>' +
    '</div>';
  }

  function _promoTableRowHTML(promo) {
    var status = _promoStatusInfo(promo);
    var tone = _promoStatusTone(status.key);
    var typeLabel = _promoTypeLabel(promo.type);
    var normalizedType = _normalizePromoType(promo.type);
    var valueLabel = normalizedType === 'pct'
      ? (_promoLegacyPct(promo) > 0 ? _promoLegacyPct(promo) + '%' : '—')
      : normalizedType === 'eur'
        ? (_promoLegacyEur(promo) > 0 ? UI.fmt(_promoLegacyEur(promo)) : '—')
        : normalizedType === 'fixed'
          ? (_promoLegacyFixedPrice(promo) > 0 ? UI.fmt(_promoLegacyFixedPrice(promo)) : '—')
          : normalizedType === 'add1'
              ? ('Leve ' + (promo.leveQtd || 0) + ', pague ' + (promo.pagueQtd || 0))
              : normalizedType === 'frete'
                ? (promo.minOrder > 0 ? 'A partir de ' + UI.fmt(promo.minOrder) : 'Frete grátis')
                : '—';
    var typeBg = normalizedType === 'pct' ? '#F0FAF4' : normalizedType === 'eur' ? '#F2F7FF' : normalizedType === 'fixed' ? '#FFF7ED' : '#FFF7ED';
    var typeColor = normalizedType === 'pct' ? '#1F6F43' : normalizedType === 'eur' ? '#2F5F93' : normalizedType === 'fixed' ? '#B45309' : '#B45309';
    var start = promo.startDate || promo.startsAt ? _esc(UI.fmtDate(new Date(promo.startDate || promo.startsAt))) : '—';
    var end = promo.endDate || promo.endsAt ? _esc(UI.fmtDate(new Date(promo.endDate || promo.endsAt))) : '—';
    var promoIdArg = _esc(String(promo.id));
    var productCount = _promoProductsForPromo(promo).length;
    var activeLabel = status.key === 'active' || status.key === 'scheduled' ? 'Pausar' : 'Ativar';
    return '<tr onclick="Modules.Marketing._openPromoModal(\'' + promoIdArg + '\', \'view\')" onmouseenter="this.style.background=\'#FFFDFC\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #F2EDED;transition:background .15s ease;">' +
      _marketingTd('<div style="display:flex;flex-direction:column;gap:4px;min-width:0;"><div style="font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.25;">' + _esc(promo.name || 'Promoção') + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px;">' + _promoMainProductsHtml(promo) + '</div></div>') +
      _marketingTd('<span style="display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:' + typeBg + ';color:' + typeColor + ';font-size:11px;font-weight:600;">' + _esc(typeLabel) + '</span>') +
      _marketingTd('<span style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(valueLabel) + '</span>') +
      _marketingTd('<div style="font-size:12px;color:#1F1F1F;font-weight:500;">' + start + '</div><div style="font-size:12px;color:#6F6860;margin-top:2px;">até ' + end + '</div>') +
      _marketingTd('<span style="display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:' + tone.bg + ';color:' + tone.color + ';font-size:11px;font-weight:600;">' + _esc(status.label) + '</span>') +
      _marketingTd('<span style="font-size:13px;color:#6F6860;">' + productCount + '</span>') +
      _marketingTd('<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">' +
        '<button type="button" title="Ver detalhes" onclick="event.stopPropagation();Modules.Marketing._openPromoModal(\'' + promoIdArg + '\', \'view\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">visibility</span></button>' +
        '<button type="button" title="Editar" onclick="event.stopPropagation();Modules.Marketing._openPromoModal(\'' + promoIdArg + '\', \'edit\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">edit</span></button>' +
        '<button type="button" title="' + activeLabel + '" onclick="event.stopPropagation();Modules.Marketing._togglePromoStatus(\'' + promoIdArg + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">' + (promo.active !== false ? 'pause' : 'play_arrow') + '</span></button>' +
        '<button type="button" title="Excluir" onclick="event.stopPropagation();Modules.Marketing._deletePromo(\'' + promoIdArg + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #F8D1CC;background:#FFF0EE;color:#B42318;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">delete</span></button>' +
      '</div>', 'right') +
    '</tr>';
  }

  function _promoAlertScore(promo) {
    var alerts = _promoAlerts(promo);
    var score = 0;
    alerts.forEach(function (a) {
      if (a.level === 'danger') score += 3;
      else if (a.level === 'warning') score += 1;
    });
    return score;
  }

  function _orderTs(order) {
    if (!order) return 0;
    var raw = order.createdAt || order.updatedAt || order.date || order.data || 0;
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw.toDate === 'function') {
      try { return raw.toDate().getTime(); } catch (e) { return 0; }
    }
    var d = new Date(raw);
    return isFinite(d.getTime()) ? d.getTime() : 0;
  }

  function _orderItems(order) {
    return Array.isArray(order && order.items) ? order.items : [];
  }

  function _promoIdText(promo) {
    return String(promo && (promo.id || promo._id || promo.slug || promo.code || '') || '');
  }

  function _orderMatchesPromo(order, promo) {
    if (!order || !promo) return false;
    var promoId = _promoIdText(promo);
    var promoName = String(firstText(promo.name, promo.title, _promoTypeLabel(promo.type)) || '').toLowerCase();
    var orderPromoIds = Array.isArray(order.promoIds) ? order.promoIds.map(String) : [];
    if (!orderPromoIds.length && order.promoSummary && Array.isArray(order.promoSummary.ids)) {
      orderPromoIds = order.promoSummary.ids.map(String);
    }
    if (promoId && orderPromoIds.indexOf(promoId) >= 0) return true;
    return _orderItems(order).some(function (item) {
      var itemPromoId = String(item && (item.promoId || item.promo_id || item.promo || ''));
      var itemPromoName = String(firstText(item && item.promoName, item && item.promo_name, item && item.promoTitle, '')).toLowerCase();
      return (promoId && itemPromoId === promoId) || (promoName && itemPromoName && itemPromoName.indexOf(promoName) >= 0);
    });
  }

  function _orderPromoRevenue(order, promo) {
    var total = 0;
    var promoId = _promoIdText(promo);
    var promoName = String(firstText(promo.name, promo.title, _promoTypeLabel(promo.type)) || '').toLowerCase();
    _orderItems(order).forEach(function (item) {
      var itemPromoId = String(item && (item.promoId || item.promo_id || item.promo || ''));
      var itemPromoName = String(firstText(item && item.promoName, item && item.promo_name, item && item.promoTitle, '')).toLowerCase();
      var matches = (promoId && itemPromoId === promoId) || (promoName && itemPromoName && itemPromoName.indexOf(promoName) >= 0);
      if (!matches) return;
      var v = item && (item.promoTotal != null ? item.promoTotal : item.total != null ? item.total : item.price != null ? (item.price * (_promoNumber(item.qty || 1) || 1)) : 0);
      total += _promoNumber(v);
    });
    return total;
  }

  function _promoSalesStats(promo) {
    var now = Date.now();
    var day = 24 * 60 * 60 * 1000;
    var currentStart = now - (30 * day);
    var prevStart = now - (60 * day);
    var currentOrders = 0;
    var prevOrders = 0;
    var currentRevenue = 0;
    var prevRevenue = 0;
    var currentItems = 0;
    var prevItems = 0;

    (_orders || []).forEach(function (order) {
      if (!_orderMatchesPromo(order, promo)) return;
      var ts = _orderTs(order);
      var revenue = _orderPromoRevenue(order, promo);
      var items = _orderItems(order).reduce(function (sum, item) {
        var itemPromoId = String(item && (item.promoId || item.promo_id || item.promo || ''));
        var itemPromoName = String(firstText(item && item.promoName, item && item.promo_name, item && item.promoTitle, '')).toLowerCase();
        var promoId = _promoIdText(promo);
        var promoName = String(firstText(promo.name, promo.title, _promoTypeLabel(promo.type)) || '').toLowerCase();
        var matches = (promoId && itemPromoId === promoId) || (promoName && itemPromoName && itemPromoName.indexOf(promoName) >= 0);
        return sum + (matches ? (_promoNumber(item && item.qty != null ? item.qty : 1) || 1) : 0);
      }, 0);

      if (ts >= currentStart) {
        currentOrders += 1;
        currentRevenue += revenue;
        currentItems += items;
      } else if (ts >= prevStart && ts < currentStart) {
        prevOrders += 1;
        prevRevenue += revenue;
        prevItems += items;
      }
    });

    return {
      currentOrders: currentOrders,
      prevOrders: prevOrders,
      currentRevenue: currentRevenue,
      prevRevenue: prevRevenue,
      currentItems: currentItems,
      prevItems: prevItems
    };
  }

  function _promoSalesSummaryHtml(promo) {
    var stats = _promoSalesStats(promo);
    var growth = stats.prevRevenue > 0 ? ((stats.currentRevenue - stats.prevRevenue) / stats.prevRevenue) * 100 : null;
    var growthLabel = growth == null
      ? 'Sem base anterior'
      : (growth >= 0 ? '+' : '') + growth.toFixed(0) + '% vs. período anterior';
    var growthColor = growth == null ? '#8A7E7C' : growth >= 0 ? '#1A9E5A' : '#C4362A';
    var badgeBg = growth == null ? '#F2EDED' : growth >= 0 ? '#EDFAF3' : '#FFF0EE';
    return '<section style="' + _marketingModalSectionStyle() + '">' +
      '<div style="' + _marketingModalLabelStyle() + 'margin-bottom:8px;">Resumo de vendas</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;">' +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
          '<div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Pedidos</div>' +
          '<div style="font-size:22px;font-weight:700;color:#1F1F1F;margin-top:4px;">' + stats.currentOrders + '</div>' +
          '<div style="font-size:11px;color:#6F6860;margin-top:3px;">' + stats.prevOrders + ' no período anterior</div>' +
        '</div>' +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
          '<div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Faturamento</div>' +
          '<div style="font-size:22px;font-weight:700;color:#1F1F1F;margin-top:4px;">' + UI.fmt(stats.currentRevenue) + '</div>' +
          '<div style="font-size:11px;color:#6F6860;margin-top:3px;">' + UI.fmt(stats.prevRevenue) + ' no período anterior</div>' +
        '</div>' +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
          '<div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Desconto total</div>' +
          '<div style="font-size:22px;font-weight:700;color:#B42318;margin-top:4px;">-' + UI.fmt(stats.currentRevenue > 0 ? _promoSalesDiscount(promo) : 0) + '</div>' +
          '<div style="font-size:11px;color:#6F6860;margin-top:3px;">Somando descontos dos pedidos vinculados</div>' +
        '</div>' +
        '<div style="background:' + badgeBg + ';border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
          '<div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Variação</div>' +
          '<div style="font-size:18px;font-weight:700;color:' + growthColor + ';margin-top:6px;">' + growthLabel + '</div>' +
          '<div style="font-size:11px;color:#6F6860;margin-top:3px;">Últimos 30 dias vs. 30 dias anteriores</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _promoInfoTile(label, value) {
    return '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:11px;padding:9px 10px;min-width:0;max-width:100%;box-sizing:border-box;">' +
      '<div style="font-size:10px;font-weight:500;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">' + _esc(label) + '</div>' +
      '<div style="font-size:13px;font-weight:500;color:#1F1F1F;line-height:1.3;margin-top:4px;overflow-wrap:anywhere;">' + _esc(value || '—') + '</div>' +
    '</div>';
  }

  function _promoSalesDiscount(promo) {
    var total = 0;
    (_orders || []).forEach(function (order) {
      if (!_orderMatchesPromo(order, promo)) return;
      _orderItems(order).forEach(function (item) {
        var itemPromoId = String(item && (item.promoId || item.promo_id || item.promo || ''));
        var itemPromoName = String(firstText(item && item.promoName, item && item.promo_name, item && item.promoTitle, '')).toLowerCase();
        var promoId = _promoIdText(promo);
        var promoName = String(firstText(promo.name, promo.title, _promoTypeLabel(promo.type)) || '').toLowerCase();
        var matches = (promoId && itemPromoId === promoId) || (promoName && itemPromoName && itemPromoName.indexOf(promoName) >= 0);
        if (!matches) return;
        total += _promoNumber(item && item.discount != null ? item.discount : 0);
      });
    });
    return total > 0 ? total : 0;
  }

  function _promoSalesInsight(promo) {
    var stats = _promoSalesStats(promo);
    var growth = stats.prevRevenue > 0 ? ((stats.currentRevenue - stats.prevRevenue) / stats.prevRevenue) * 100 : null;
    var statusKey = _promoStatusInfo(promo).key;

    if (!stats.currentOrders && !stats.prevOrders) {
      if (statusKey === 'active') {
        return { text: 'Ainda sem pedidos nesta promoção. A análise de vendas aparece quando entrar base suficiente.', color: '#8A7E7C' };
      }
      return { text: 'Sem pedidos suficientes para analisar vendas nesta promoção.', color: '#8A7E7C' };
    }

    if (growth != null && growth >= 15 && stats.currentOrders >= 3) {
      return { text: 'Promoção em alta: ' + stats.currentOrders + ' pedidos nos últimos 30 dias, +' + growth.toFixed(0) + '% vs. o período anterior.', color: '#1A9E5A' };
    }
    if (growth != null && growth <= -15 && stats.prevOrders > 0) {
      return { text: 'Promoção em queda: ' + stats.currentOrders + ' pedidos nos últimos 30 dias, ' + growth.toFixed(0) + '% vs. o período anterior.', color: '#C4362A' };
    }
    if (stats.currentOrders > 0) {
      return { text: 'Vendas recentes: ' + stats.currentOrders + ' pedidos e ' + stats.currentItems + ' itens em 30 dias. Ainda sem variação forte.', color: '#D97706' };
    }
    return { text: 'Sem vendas recentes nesta promoção. Vale revisar destaque, preço ou visibilidade.', color: '#D97706' };
  }

  function _promoInsight(promo, alerts) {
    alerts = alerts || _promoAlerts(promo);
    var score = _promoAlertScore(promo);
    if (score >= 4) return { text: 'Sugestão: tire essa promoção do ar ou reduza o desconto. Ela pode estar prejudicando a margem.', color: '#C4362A' };
    if (score >= 2) return { text: 'Sugestão: essa promoção precisa de atenção. Verifique margem e validade.', color: '#D97706' };
    return _promoSalesInsight(promo);
  }

  function _promoAlerts(promo) {
    var list = [];
    var status = _promoStatusInfo(promo);
    if (!promo.endDate && !promo.endsAt) list.push({ level: 'warning', color: '#D97706', text: 'Promoção sem data de término.' });
    if (status.key === 'scheduled') list.push({ level: 'warning', color: '#3B82F6', text: 'Promoção agendada.' });
    if (status.key === 'paused') list.push({ level: 'warning', color: '#D97706', text: 'Promoção pausada.' });
    if (status.key === 'expired' || status.key === 'finalized') list.push({ level: 'danger', color: '#C4362A', text: 'Promoção expirada.' });

    (_promoProductsForPromo(promo) || []).forEach(function (product) {
      var cost = _promoCostForProduct(product);
      var price = _promoBasePrice(product);
      var hasPrice = price > 0;
      var hasStock = product.stock != null ? product.stock : (product.estoque != null ? product.estoque : null);
      var calc = _promoDiscountForProduct(product, {
        type: _normalizePromoType(promo.type),
        value: promo.valuePercentual != null ? promo.valuePercentual : promo.valueDesconto != null ? promo.valueDesconto : promo.discountPct != null ? promo.discountPct : promo.fixedPrice != null ? promo.fixedPrice : promo.value,
        pctValue: promo.valuePercentual != null ? promo.valuePercentual : promo.discountPct != null ? promo.discountPct : promo.value,
        eurValue: promo.valueDesconto != null ? promo.valueDesconto : promo.value,
        fixedPrice: promo.fixedPrice != null ? promo.fixedPrice : promo.finalPrice != null ? promo.finalPrice : '',
        leveQtd: promo.leveQtd,
        pagueQtd: promo.pagueQtd
      });
      if (!hasPrice) list.push({ level: 'warning', color: '#D97706', text: 'Produto sem preço configurado.' });
      if (hasStock === 0) list.push({ level: 'warning', color: '#D97706', text: 'Produto sem estoque.' });
      if (calc.original > 0 && cost > 0) {
        var marginAfter = calc.final > 0 ? ((calc.final - cost) / calc.final) * 100 : -100;
        var marginBefore = ((calc.original - cost) / calc.original) * 100;
        var minMargin = _moneyConfig.minMarginPct;
        var desiredMargin = _moneyConfig.desiredMarginPct;
        if (calc.final < cost) {
          list.push({ level: 'danger', color: '#C4362A', text: 'Atenção: essa promoção pode dar prejuízo.' });
        } else if (marginAfter < minMargin) {
          list.push({ level: 'danger', color: '#C4362A', text: 'Margem abaixo da regra mínima.' });
        } else if (marginAfter < desiredMargin) {
          list.push({ level: 'warning', color: '#D97706', text: 'Margem perto do limite desejado.' });
        }
        if (marginBefore >= desiredMargin && marginAfter < desiredMargin) {
          list.push({ level: 'warning', color: '#D97706', text: 'Promoção reduz a margem de um produto saudável.' });
        }
      } else if (price > 0 && cost <= 0) {
        list.push({ level: 'warning', color: '#8A7E7C', text: 'Custo não informado. Não foi possível calcular margem.' });
      }
    });

    var uniq = [];
    list.forEach(function (item) {
      var key = item.text;
      if (!uniq.some(function (x) { return x.text === key; })) uniq.push(item);
    });
    return uniq;
  }

  function _promoImpactByProductHtml(promo) {
    var products = _promoProductsForPromo(promo);
    if (!products.length) {
      return '<div style="font-size:13px;color:#8A7E7C;">Sem produtos vinculados para calcular impacto.</div>';
    }
    return '<div style="display:flex;flex-direction:column;gap:10px;">' + products.map(function (product) {
      var calc = _promoDiscountForProduct(product, {
        type: _normalizePromoType(promo.type),
        value: promo.valuePercentual != null ? promo.valuePercentual : promo.valueDesconto != null ? promo.valueDesconto : promo.discountPct != null ? promo.discountPct : promo.fixedPrice != null ? promo.fixedPrice : promo.value,
        pctValue: promo.valuePercentual != null ? promo.valuePercentual : promo.discountPct != null ? promo.discountPct : promo.value,
        eurValue: promo.valueDesconto != null ? promo.valueDesconto : promo.value,
        fixedPrice: promo.fixedPrice != null ? promo.fixedPrice : promo.finalPrice != null ? promo.finalPrice : '',
        leveQtd: promo.leveQtd,
        pagueQtd: promo.pagueQtd
      });
      var cost = _promoCostForProduct(product);
      var price = _promoBasePrice(product);
      var noCost = cost <= 0;
      var profitBefore = noCost ? null : (price - cost);
      var profitAfter = noCost ? null : (calc.final - cost);
      var marginBefore = noCost || price <= 0 ? null : (profitBefore / price) * 100;
      var marginAfter = noCost || calc.final <= 0 ? null : (profitAfter / calc.final) * 100;
      var alertTxt = noCost ? 'Custo não informado. Não foi possível calcular margem.' : '';
      return '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:13px;padding:10px 12px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.3;">' + _esc(product.name || 'Produto') + '</div>' +
            '<div style="font-size:12px;color:#6F6860;margin-top:4px;line-height:1.35;">Preço atual ' + UI.fmt(price) + ' · com promoção ' + UI.fmt(calc.final) + '</div>' +
          '</div>' +
          '<div style="font-size:12px;font-weight:600;color:#B42318;background:#FFF0EE;border-radius:999px;padding:5px 9px;white-space:nowrap;">-' + UI.fmt(calc.discount) + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;margin-top:10px;min-width:0;">' +
          _promoInfoTile('Custo', noCost ? '—' : UI.fmt(cost)) +
          _promoInfoTile('Lucro antes', profitBefore == null ? '—' : UI.fmt(profitBefore)) +
          _promoInfoTile('Lucro depois', profitAfter == null ? '—' : UI.fmt(profitAfter)) +
          _promoInfoTile('Margem', (marginAfter == null ? '—' : marginAfter.toFixed(1).replace('.', ',') + '%')) +
        '</div>' +
        (alertTxt ? '<div style="font-size:12px;color:#B45309;font-weight:500;margin-top:9px;line-height:1.4;">' + _esc(alertTxt) + '</div>' : '') +
      '</div>';
    }).join('') + '</div>';
  }

  function _promoHistoryHtml(promo) {
    var history = promo && (promo.history || promo.logs || promo.events || promo.audit);
    if (!Array.isArray(history) || !history.length) {
      return '<div style="font-size:13px;color:#8A7E7C;">Sem histórico simples registrado.</div>';
    }
    return '<div style="display:flex;flex-direction:column;gap:8px;">' + history.slice(0, 5).map(function (item) {
      var label = typeof item === 'string' ? item : (item.action || item.label || item.text || 'Evento');
      var date = item && (item.date || item.createdAt || item.at) ? UI.fmtDate(new Date(item.date || item.createdAt || item.at)) : '';
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:10px;padding:10px 12px;"><div style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(label) + '</div>' + (date ? '<div style="font-size:11px;color:#6F6860;margin-top:3px;">' + _esc(date) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function _promoViewModalHtml(promo) {
    var status = _promoStatusInfo(promo);
    var cardStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:15px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);';
    var sectionTitle = 'font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.25;margin:0;';
    var sectionHelp = 'font-size:11px;color:#6F6860;line-height:1.35;margin:2px 0 0;';
    var typeLabel = _promoTypeLabel(promo.type);
    var valueLabel = promo.type === 'pct'
      ? (promo.valuePercentual != null ? promo.valuePercentual + '%' : (promo.value != null ? promo.value + '%' : '—'))
      : promo.type === 'eur'
        ? (promo.valueDesconto != null ? UI.fmt(promo.valueDesconto) : (promo.value != null ? UI.fmt(promo.value) : '—'))
        : _normalizePromoType(promo.type) === 'add1'
            ? ('Leve ' + (promo.leveQtd || 0) + ', pague ' + (promo.pagueQtd || 0))
            : _normalizePromoType(promo.type) === 'frete'
              ? 'Frete grátis'
            : '—';
    var products = _promoProductsForPromo(promo);
    var productScope = _promoAppliesToAllProducts(promo) ? 'Todos os produtos' : (products.length + ' produto' + (products.length === 1 ? '' : 's'));
    var startLabel = promo.startDate || promo.startsAt ? _esc(UI.fmtDate(new Date(promo.startDate || promo.startsAt))) : '—';
    var endLabel = promo.endDate || promo.endsAt ? _esc(UI.fmtDate(new Date(promo.endDate || promo.endsAt))) : '—';
    var minOrderLabel = promo.minOrder ? UI.fmt(promo.minOrder) : 'Sem mínimo';
    var tone = _promoStatusTone(status.key);
    var alerts = _promoAlerts(promo);
    var alertHtml = alerts.length ? alerts.slice(0, 3).map(function (a) {
      return '<div style="padding:9px 11px;border-radius:11px;background:' + (a.level === 'danger' ? '#FFF0EE' : a.level === 'warning' ? '#FFF7ED' : '#FFFCFA') + ';color:' + a.color + ';font-size:12px;font-weight:500;line-height:1.4;">' + _esc(a.text) + '</div>';
    }).join('') : '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Sem alertas relevantes para esta promoção.</div>';
    return '<div style="display:flex;flex-direction:column;gap:9px;max-width:920px;margin:0 auto;">' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(130px,180px);gap:12px;align-items:center;min-width:0;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">' +
              '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex:0 0 auto;">campaign</span>' +
              '<span style="font-size:11px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Promoção</span>' +
            '</div>' +
            '<div style="font-size:19px;font-weight:650;color:#1F1F1F;line-height:1.15;overflow-wrap:anywhere;">' + _esc(promo.name || 'Promoção') + '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;">' +
              '<span style="font-size:11px;font-weight:500;padding:5px 9px;border-radius:999px;background:' + tone.bg + ';color:' + tone.color + ';">' + _esc(status.label) + '</span>' +
              '<span style="font-size:11px;font-weight:500;padding:5px 9px;border-radius:999px;background:#FFFCF8;border:1px solid #E8DCD7;color:#6F6860;">' + _esc(typeLabel) + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="background:#FFF0EE;border:1px solid #F8D1CC;border-radius:12px;padding:9px 11px;text-align:left;min-width:0;max-width:100%;box-sizing:border-box;">' +
            '<div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Benefício</div>' +
            '<div style="font-size:18px;font-weight:650;color:#B42318;line-height:1.15;margin-top:3px;">' + _esc(valueLabel) + '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:9px;align-items:start;">' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;">' +
          '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#FAF8F4;color:#7A746B;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto;">tune</span>' +
          '<div><div style="' + sectionTitle + '">Detalhes da regra</div><div style="' + sectionHelp + '">Período, alcance e valor mínimo para a promoção entrar no pedido.</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;min-width:0;">' +
          _promoInfoTile('Início', startLabel) +
          _promoInfoTile('Fim', endLabel) +
          _promoInfoTile('Produtos', productScope) +
          _promoInfoTile('Pedido mínimo', minOrderLabel) +
        '</div>' +
      '</section>' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;">' +
          '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#FFF7ED;color:#B45309;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto;">info</span>' +
          '<div><div style="' + sectionTitle + '">Alertas</div><div style="' + sectionHelp + '">Pontos que merecem atenção antes de deixar a campanha rodando.</div></div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:7px;">' + alertHtml + '</div>' +
      '</section>' +
      '</div>' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;">' +
          '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#F0FAF4;color:#1F6F43;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1;overflow:hidden;flex:0 0 auto;">bar_chart</span>' +
          '<div><div style="' + sectionTitle + '">Impacto por produto</div><div style="' + sectionHelp + '">Veja preço, desconto e margem estimada nos produtos vinculados.</div></div>' +
        '</div>' +
        _promoImpactByProductHtml(promo) +
      '</section>' +
    '</div>';
  }

  function _promoEditModalHtml(promo) {
    var normalizedType = _normalizePromoType(promo.type || 'pct');
    var todayIso = _promoTodayIso();
    var sectionStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:13px;box-shadow:0 10px 24px rgba(31,31,31,.04);';
    var softSectionStyle = sectionStyle;
    var fieldStyle = _marketingInputStyle() + 'background:#FFFCF8;border-color:#E8DCD7;border-radius:12px;max-width:100%;box-sizing:border-box;min-width:0;';
    var labelStyle = _marketingModalLabelStyle();
    var selectedIds = _promoProductIds(promo);
    var selectedSet = {};
    selectedIds.forEach(function (id) { selectedSet[String(id)] = true; });
    var prodListHtml = _products.length === 0
      ? '<p style="font-size:12px;color:#8A7E7C;margin:0;">Nenhum produto cadastrado.</p>'
      : _products.map(function (prod) {
          var checked = selectedSet[String(prod.id)] || false;
          return '<label data-product-name="' + _esc(String(prod.name || '').toLowerCase()) + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;cursor:pointer;min-width:0;max-width:100%;box-sizing:border-box;">' +
            '<input type="checkbox" class="prm-product-check" data-product-id="' + prod.id + '" data-product-name="' + _esc(prod.name) + '" ' + (checked ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:#B42318;">' +
            '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:13px;font-weight:500;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(prod.name) + '</div>' +
            '<div style="font-size:11px;color:#6F6860;">Produto incluído na oferta</div>' +
            '</div>' +
            '</label>';
        }).join('');

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start;min-width:0;">
        <div style="display:flex;flex-direction:column;gap:10px;min-width:0;">
          <section style="${sectionStyle}">
            <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;">
              <span class="mi" style="width:27px;height:27px;border-radius:9px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:15px;flex:0 0 auto;">campaign</span>
              <div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Identificação da promoção</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Dê um nome claro e defina se existe valor mínimo para ela entrar no pedido.</div></div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;align-items:end;min-width:0;">
              <div>
                <label style="${labelStyle}">Nome da promoção</label>
                <input id="prm-name" type="text" value="${_esc(promo.name || '')}" placeholder="Ex: Oferta de fim de semana" style="${fieldStyle}">
              </div>
              <div style="max-width:190px;">
                <label style="${labelStyle}">Pedido mínimo</label>
                <div style="display:grid;grid-template-columns:auto minmax(88px,1fr);gap:8px;align-items:center;min-width:0;">
                  <span style="font-size:13px;font-weight:600;color:#6F6860;">€</span>
                  <input id="prm-min" type="text" inputmode="decimal" value="${promo.minOrder || ''}" placeholder="20,00" oninput="Modules.Marketing._refreshPromoPreview()" style="${fieldStyle}">
                </div>
              </div>
            </div>
          </section>

          <section style="${softSectionStyle}">
            <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;">
              <span class="mi" style="width:27px;height:27px;border-radius:9px;background:#FFF7ED;color:#B45309;display:inline-flex;align-items:center;justify-content:center;font-size:15px;flex:0 0 auto;">sell</span>
              <div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Tipo de oferta</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Escolha como o desconto será aplicado no cardápio.</div></div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;min-width:0;">
              ${PROMO_TYPES.map(function (t) {
                var active = normalizedType === t.key;
                return `<button type="button" data-ptype="${t.key}" onclick="Modules.Marketing._selectPromoType('${t.key}');Modules.Marketing._refreshPromoPreview();" style="min-height:64px;padding:10px;border:1px solid ${active ? '#B42318' : '#EAE4DA'};border-radius:13px;background:${active ? '#FFF0EE' : '#FFFDFC'};color:${active ? '#B42318' : '#1F1F1F'};font-family:inherit;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:5px;justify-content:center;box-shadow:${active ? '0 8px 18px rgba(180,35,24,.07)' : 'none'};">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="${active ? 'icon-active' : 'icon-inactive'}" data-promo-icon="${t.key}">${t.key === 'frete' ? '<span class="mi" style="font-size:16px;line-height:1;">local_shipping</span>' : _esc(t.icon)}</span>
                    <span style="font-size:13px;font-weight:600;">${_esc(t.label)}</span>
                  </div>
                  <div style="font-size:11px;color:#6F6860;line-height:1.35;">${_esc(t.hint)}</div>
                </button>`;
              }).join('')}
            </div>
          </section>

          <section style="${softSectionStyle}">
            <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;">
              <span class="mi" style="width:27px;height:27px;border-radius:9px;background:#F2F7FF;color:#2F5F93;display:inline-flex;align-items:center;justify-content:center;font-size:15px;flex:0 0 auto;">event</span>
              <div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Oferta e período</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Informe o benefício e quando a promoção deve ficar disponível.</div></div>
            </div>
            <div id="prm-offer-fields"></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,155px));gap:10px;margin-top:10px;min-width:0;">
              <div>
                <label style="${labelStyle}">Início</label>
                <input id="prm-start" type="date" min="${todayIso}" value="${promo.startDate || promo.startsAt || ''}" style="${fieldStyle}">
              </div>
              <div>
                <label style="${labelStyle}">Fim</label>
                <input id="prm-end" type="date" min="${todayIso}" value="${promo.endDate || promo.endsAt || ''}" style="${fieldStyle}">
              </div>
            </div>
          </section>

          <section style="${softSectionStyle}">
            <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;">
              <span class="mi" style="width:27px;height:27px;border-radius:9px;background:#F0FAF4;color:#1F6F43;display:inline-flex;align-items:center;justify-content:center;font-size:15px;flex:0 0 auto;">restaurant_menu</span>
              <div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Produtos da promoção</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Use em todos os produtos ou escolha itens específicos.</div></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
              <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px;font-weight:500;color:#1F1F1F;"><input type="radio" name="prm-apply" value="all"${(promo.applyTo || !promo.productIds || !promo.productIds.length) !== 'selected' ? ' checked' : ''} onchange="Modules.Marketing._refreshPromoPreview()" style="accent-color:#B42318;"> Todos os produtos</label>
              <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px;font-weight:500;color:#1F1F1F;"><input type="radio" name="prm-apply" value="selected"${(promo.applyTo === 'selected' || (promo.productIds && promo.productIds.length)) ? ' checked' : ''} onchange="Modules.Marketing._refreshPromoPreview()" style="accent-color:#B42318;"> Selecionar produtos</label>
            </div>
            <div id="prm-products-panel" style="display:${(promo.applyTo === 'selected' || (promo.productIds && promo.productIds.length)) ? 'block' : 'none'};">
              <input id="prm-product-search" type="text" placeholder="Buscar produto..." oninput="Modules.Marketing._filterPromoProducts()" style="${fieldStyle}margin-bottom:10px;">
              <div id="prm-products-count" style="font-size:11px;font-weight:500;color:#6F6860;margin:0 0 10px;">0 produtos selecionados</div>
              <div id="prm-product-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;max-height:190px;overflow:auto;min-width:0;">${prodListHtml}</div>
            </div>
          </section>

          <section style="${softSectionStyle}">
            <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;">
              <span class="mi" style="width:27px;height:27px;border-radius:9px;background:#FAF8F4;color:#7A746B;display:inline-flex;align-items:center;justify-content:center;font-size:15px;flex:0 0 auto;">notes</span>
              <div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Regras adicionais</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Use apenas se precisar deixar alguma orientação interna para a promoção.</div></div>
            </div>
            <textarea id="prm-rules" style="${fieldStyle}min-height:70px;resize:vertical;" placeholder="Ex: aplicar só à noite, não combinar com cupom, etc.">${_esc(promo.rulesText || promo.rules || '')}</textarea>
          </section>
        </div>

        <aside style="position:sticky;top:12px;display:flex;flex-direction:column;gap:10px;min-width:0;">
          <section style="${sectionStyle}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-size:14px;font-weight:650;color:#1F1F1F;line-height:1.25;">Status da promoção</div>
                <div style="font-size:12px;color:#6F6860;margin-top:2px;">Controle se ela aparece para clientes.</div>
              </div>
              <button type="button" id="prm-active-toggle" onclick="Modules.Marketing._togglePromoActive()" style="width:42px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background .2s;background:${promo.active !== false ? '#B42318' : '#D8CEC2'};"><span style="position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform .2s;display:block;transform:translateX(${promo.active !== false ? '18px' : '0'});box-shadow:0 1px 4px rgba(31,31,31,.12);"></span></button>
            </div>
          </section>

          <section style="${sectionStyle}">
            <div style="font-size:14px;font-weight:650;color:#1F1F1F;line-height:1.25;margin-bottom:10px;">Prévia da promoção</div>
            <div id="prm-preview"></div>
          </section>

          <section style="${sectionStyle}">
            <div style="font-size:14px;font-weight:650;color:#1F1F1F;line-height:1.25;">Impacto da promoção</div>
            <div id="prm-impact" style="margin-top:10px;font-size:13px;line-height:1.55;color:#1F1F1F;"></div>
          </section>
        </aside>
      </div>`;
  }

  function _switchSub(key) {
    _activeSub = key;
    _loadSub(key);
    Router.navigate('marketing/' + key);
  }

  function _loadSub(key) {
    var content = document.getElementById('marketing-content');
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#8A7E7C;">Carregando...</div>';
    if (key === 'promocoes') _renderPromos();
    else if (key === 'cupons') _renderCupons();
    else if (key === 'upsell') _renderUpsell();
    else if (key === 'pontos') _renderPontos();
    else if (key === 'avaliacoes') _renderAvaliacoes();
  }

  function _seasonActionDraftFor(type) {
    try {
      var raw = window.sessionStorage ? window.sessionStorage.getItem('bocafoodSeasonActionDraft') : '';
      var draft = raw ? JSON.parse(raw) : null;
      if (!draft || !draft.seasonId || !draft.seasonActionId) return null;
      if (type && String(draft.type || '') !== String(type || '')) return null;
      return draft;
    } catch (err) {
      return null;
    }
  }

  function _markSeasonActionDraftOpened(type) {
    var draft = _seasonActionDraftFor(type);
    if (!draft || draft.openedAt) return null;
    draft.openedAt = new Date().toISOString();
    try { window.sessionStorage.setItem('bocafoodSeasonActionDraft', JSON.stringify(draft)); } catch (err) {}
    return draft;
  }

  function _clearSeasonActionDraft(type) {
    var draft = _seasonActionDraftFor(type);
    if (!draft) return;
    try { window.sessionStorage.removeItem('bocafoodSeasonActionDraft'); } catch (err) {}
  }

  function _consumeSeasonActionDraftFor(type) {
    var draft = _markSeasonActionDraftOpened(type);
    if (!draft) return;
    setTimeout(function () {
      if (type === 'promotion') _openPromoModal(null, 'edit');
      else if (type === 'coupon') _openCuponModal(null, 'edit');
      else if (type === 'upsell') {
        _upsellTab = 'sugestoes';
        _paintUpsell();
        setTimeout(function () { _openUpsellModal(null, 'edit'); }, 80);
      }
      UI.toast('Jogada da temporada vinculada. Ao salvar, o BocaFood guarda essa ação no histórico da Temporada.', 'info');
    }, 120);
  }

  function _decorateSeasonActionPayload(data, type) {
    var draft = _seasonActionDraftFor(type);
    if (!draft) return data;
    return Object.assign({}, data, {
      createdFromSeasonAction: true,
      seasonId: draft.seasonId || '',
      seasonActionId: draft.seasonActionId || '',
      seasonActionType: type || '',
      seasonActionTitle: draft.title || '',
      seasonActionSource: draft.source || '',
      seasonActionProductKey: draft.productKey || '',
      seasonActionFocusKey: draft.focusKey || ''
    });
  }

  function _linkSeasonActionDraft(type, ref, collection, label) {
    var draft = _seasonActionDraftFor(type);
    var id = ref && (ref.id || ref._key || ref.path && ref.path.split('/').pop && ref.path.split('/').pop()) || '';
    if (!draft || !draft.seasonId || !draft.seasonActionId || !id || !window.DB || typeof DB.get !== 'function' || typeof DB.update !== 'function') {
      _clearSeasonActionDraft(type);
      return Promise.resolve(null);
    }
    return DB.get('seasons', draft.seasonId).then(function (season) {
      if (!season) return null;
      var tasks = Array.isArray(season.actionTasks) ? season.actionTasks.slice() : [];
      var changed = false;
      tasks = tasks.map(function (task) {
        if (!task || String(task.actionId || '') !== String(draft.seasonActionId || '')) return task;
        changed = true;
        var evidenceList = Array.isArray(task.executionEvidence) ? task.executionEvidence.slice() : [];
        evidenceList.push({
          type: type + '_created',
          collection: collection,
          actionId: id,
          label: label || draft.title || '',
          createdAt: new Date().toISOString()
        });
        return Object.assign({}, task, {
          expectedActionType: type,
          expectedActionId: id,
          expectedActionCollection: collection,
          executionEvidence: evidenceList,
          executionStatus: 'created_waiting_result'
        });
      });
      if (!changed) return null;
      return DB.update('seasons', draft.seasonId, { actionTasks: tasks });
    }).then(function () {
      _clearSeasonActionDraft(type);
      return id;
    }).catch(function (err) {
      console.warn('[Marketing] season action link failed', err);
      _clearSeasonActionDraft(type);
      return null;
    });
  }

  function _applySeasonDraftToPromoForm() {
    var draft = _seasonActionDraftFor('promotion');
    if (!draft) return;
    var name = document.getElementById('prm-name');
    var rules = document.getElementById('prm-rules');
    if (name && !String(name.value || '').trim()) name.value = draft.title || 'Promoção da Temporada';
    if (rules && !String(rules.value || '').trim()) rules.value = 'Criada a partir da jogada da Temporada: ' + (draft.title || draft.seasonActionId || '');
  }

  function _applySeasonDraftToCouponForm() {
    var draft = _seasonActionDraftFor('coupon');
    if (!draft) return;
    var code = document.getElementById('cup-code');
    if (code && !String(code.value || '').trim()) code.value = _seasonDraftCode(draft);
  }

  function _applySeasonDraftToUpsellForm() {
    var draft = _seasonActionDraftFor('upsell');
    if (!draft) return;
    var name = document.getElementById('ups-name');
    var message = document.getElementById('ups-message');
    if (name && !String(name.value || '').trim()) name.value = draft.title || 'Upsell da Temporada';
    if (message && !String(message.value || '').trim()) message.value = 'También te puede gustar';
  }

  function _seasonDraftCode(draft) {
    var base = String(draft && draft.title || draft && draft.seasonActionId || 'TEMPORADA').toUpperCase();
    base = base.normalize ? base.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : base;
    base = base.replace(/[^A-Z0-9]+/g, '').slice(0, 10);
    return base || 'TEMPORADA';
  }

  function _renderPontos() {
    _pointsLoad().then(function () {
      _paintPontos();
    });
  }

  function _paintPontos() {
    var content = document.getElementById('marketing-content');
    if (!content) return;
    var summary = _pointsSummary(_customers);
    var body = '';
    if (_pointsTab === 'configuracao') {
      body = _pointsConfigurationHtml();
    } else if (_pointsTab === 'clientes') {
      body = _pointsClientsSectionHtml();
    } else {
      body = _pointsPerformanceSectionHtml();
    }
    content.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Programa de Pontos</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:760px;">Fidelize clientes com pontos por pedido e acompanhe resgates sem complicar a operação.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          _pointsSubtabsHtml() +
        '</div>' +
      '</div>' +
      body +
    '</div>';
  }

  // ── PROMOÇÕES ─────────────────────────────────────────────────────────────
  function _renderPromos() {
    Promise.all([
      _safeGetAll('promotions'),
      _safeGetAll('promocoes'),
      _loadMarketingProducts(),
      _safeGetDocRoot('config', 'dinheiro')
    ]).then(function (r) {
      var promosA = Array.isArray(r[0]) ? r[0] : [];
      var promosB = Array.isArray(r[1]) ? r[1] : [];
      _products = Array.isArray(r[2]) ? r[2] : [];
      _promos = _mergePromoLists([promosA, promosB], _products.map(function (product, idx) {
        return _derivePromoFromProduct(product, idx);
      }));
      _moneyConfig = _normalizeMoneyConfig(r[3] || {});
      _orders = [];
      try {
        _paintPromos();
      } catch (paintErr) {
        console.error('[Marketing] _paintPromos failed', paintErr);
        var content = document.getElementById('marketing-content');
        if (content) {
          content.innerHTML = '<div style="background:#fff;border:1px solid #F2EDED;border-radius:14px;padding:16px;color:#C4362A;font-size:13px;">Erro ao renderizar promoções. Verifique a base de dados no console.</div>';
        }
      }
      _safeGetAll('orders').then(function (orders) {
        _orders = orders || [];
        try { _paintPromos(); } catch (e) { console.error('[Marketing] repaint promos after orders failed', e); }
      });
    }).catch(function (err) {
      console.error('[Marketing] _renderPromos failed', err);
      _promos = [];
      _products = [];
      _orders = [];
      _moneyConfig = _normalizeMoneyConfig({});
      _paintPromos();
    });
  }

  function _paintPromos() {
    var content = document.getElementById('marketing-content');
    if (!content) return;
    var filtered = _promoFilteredList();
    var paging = _promoPaging(filtered);
    var summary = _promoSummary(_promos);
    var pageSizeOptions = [10, 12, 24, 48].map(function (n) {
      return '<option value="' + n + '"' + (Number(_promoUi.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
    }).join('');
    var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<select onchange="Modules.Marketing._setPromoPageSize(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">' + pageSizeOptions + '</select>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Marketing._setPromoPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Marketing._setPromoPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>' : '';
    content.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.2;margin:0 0 6px;color:#1F1F1F;">Promoções</h2>' +
          '<p style="font-size:13px;font-weight:400;color:#6F6860;line-height:1.45;max-width:760px;margin:0;">Crie, acompanhe e ajuste ofertas sem perder a margem.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Marketing._openPromoModal(null, \'edit\')" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 8px 18px rgba(180,35,24,.20)\';" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(180,35,24,.18)\';" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);transition:transform .15s ease,box-shadow .15s ease;">' + _subActionLabel() + '</button>' +
        '</div>' +
      '</div>' +
      _promoSummaryHtml(summary) +
      _promoToolbarHtml() +
      (filtered.length === 0 ? _promoEmptyStateHtml() :
        '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Promoções cadastradas</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Gerencie ofertas, status, período e produtos vinculados.</div></div>' +
        '<div style="background:#fff;border:1px solid #EADFD8;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.055);">' +
          '<div style="overflow:auto;">' +
            '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:980px;">' +
              '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
                _marketingTh('Promoção') +
                _marketingTh('Tipo') +
                _marketingTh('Valor') +
                _marketingTh('Período') +
                _marketingTh('Status') +
                _marketingTh('Produtos') +
                _marketingTh('Ações', 'right') +
              '</tr></thead>' +
              '<tbody id="promos-list">' + paging.items.map(function (p) { return _promoTableRowHTML(p); }).join('') + '</tbody>' +
            '</table>' +
          '</div>' +
          paginationHtml +
        '</div></section>') +
      '</div>';
    _consumeSeasonActionDraftFor('promotion');
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }

  function _promoTypeInfo(type) {
    var t = _normalizePromoType(type);
    var base = PROMO_TYPES.find(function (x) { return x.key === t; }) || PROMO_TYPE_FALLBACKS[type];
    if (base) return base;
    return { key: t || 'pct', label: 'Promoção', hint: 'Oferta ativa', icon: '•' };
  }

  function _normalizePromoType(type) {
    if (type === 'pct' || type === 'eur' || type === 'add1' || type === 'frete') return type;
    if (type === '2x1' || type === '2por1' || type === 'two_for_one' || type === 'b2x1') return 'add1';
    if (type === 'fixed' || type === 'oferta_dia' || type === 'preco_fixo' || type === 'price_fixed') return 'fixed';
    if (type === 'desconto_percentual' || type === 'percentual' || type === 'percent') return 'pct';
    if (type === 'desconto_valor' || type === 'valor_fixo' || type === 'valor' || type === 'fixed_discount') return 'eur';
    if (type === 'leve_mais' || type === 'promo_leve_mais' || type === 'combo_extra' || type === 'combo_sugerido') return 'add1';
    if (type === 'extra_combo' || type === 'upgrade') return 'add1';
    if (type === 'pack') return 'add1';
    if (type === 'frete_gratis' || type === 'free_shipping' || type === 'shipping_free') return 'frete';
    return 'pct';
  }

  function _promoLegacyPct(promo) {
    if (!promo) return 0;
    return _promoNumber(
      promo.discountPct != null ? promo.discountPct :
      promo.pctValue != null ? promo.pctValue :
      promo.valuePercentual != null ? promo.valuePercentual :
      (promo.type === 'pct' && promo.value != null ? promo.value : 0)
    );
  }

  function _promoLegacyEur(promo) {
    if (!promo) return 0;
    return _promoNumber(
      promo.valueDesconto != null ? promo.valueDesconto :
      promo.eurValue != null ? promo.eurValue :
      (promo.type === 'eur' && promo.value != null ? promo.value : 0)
    );
  }

  function _promoLegacyFixedPrice(promo) {
    if (!promo) return 0;
    return _promoNumber(
      promo.fixedPrice != null ? promo.fixedPrice :
      promo.finalPrice != null ? promo.finalPrice :
      promo.offerPrice != null ? promo.offerPrice :
      promo.priceFixed != null ? promo.priceFixed : 0
    );
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

  function _promoBasePrice(product) {
    if (!product) return 0;
    var raw = product.price != null ? product.price :
      (product.salePrice != null ? product.salePrice :
      (product.valor != null ? product.valor :
      (product.preco != null ? product.preco :
      (product.precoVenda != null ? product.precoVenda :
      (product.sale_price != null ? product.sale_price : 0)))));
    return _promoNumber(raw);
  }

  function _promoSelectedProductIds() {
    return Array.prototype.slice.call(document.querySelectorAll('.prm-product-check:checked'))
      .map(function (input) { return String(input.dataset.productId || input.value || ''); })
      .filter(Boolean);
  }

  function _promoSelectedProducts() {
    var ids = _promoSelectedProductIds();
    if (!ids.length) return [];
    var set = {};
    ids.forEach(function (id) { set[id] = true; });
    return (_products || []).filter(function (prod) { return set[String(prod.id)]; });
  }

  function _promoState() {
    var type = _normalizePromoType(window._promoType || 'pct');
    var value = _promoNumber((document.getElementById('prm-value') || {}).value);
    var pctValue = _promoNumber((document.getElementById('prm-pct') || {}).value);
    var eurValue = _promoNumber((document.getElementById('prm-eur') || {}).value);
    var leveQtd = parseInt((document.getElementById('prm-leve') || {}).value, 10) || 0;
    var pagueQtd = parseInt((document.getElementById('prm-pague') || {}).value, 10) || 0;
    var minOrder = _promoNumber((document.getElementById('prm-min') || {}).value);
    var applyRadio = document.querySelector('input[name="prm-apply"]:checked');
    var applyTo = applyRadio ? applyRadio.value : 'all';
    var selectedProducts = _promoSelectedProducts();
    var reference = null;
    if (applyTo === 'selected') {
      reference = selectedProducts[0] || null;
    } else if (window._promoBase && window._promoBase.productId) {
      reference = (_products || []).find(function (p) { return String(p.id) === String(window._promoBase.productId); }) || null;
    }
    if (!reference && applyTo !== 'selected') reference = (_products || [])[0] || null;
    var basePrice = _promoBasePrice(reference);
    var newPrice = basePrice;
    var discount = 0;
    if (type === 'pct') {
      value = pctValue;
      discount = basePrice * (value / 100);
      newPrice = Math.max(basePrice - discount, 0);
    } else if (type === 'eur') {
      value = eurValue;
      discount = value;
      newPrice = Math.max(basePrice - value, 0);
    } else if (type === 'add1') {
      discount = leveQtd > pagueQtd && basePrice > 0 ? basePrice * ((leveQtd - pagueQtd) / leveQtd) : 0;
      newPrice = Math.max(basePrice - discount, 0);
    } else if (type === 'frete') {
      discount = 0;
      newPrice = basePrice;
    }
    return {
      type: type,
      info: _promoTypeInfo(type),
      value: value,
      pctValue: pctValue,
      eurValue: eurValue,
      leveQtd: leveQtd,
      pagueQtd: pagueQtd,
      minOrder: minOrder,
      applyTo: applyTo,
      selectedProducts: selectedProducts,
      reference: reference,
      basePrice: basePrice,
      newPrice: newPrice,
      discount: discount
    };
  }

  function _promoPreviewHtml(state) {
    if (state.type === 'frete') {
      var minText = state.minOrder > 0 ? 'Frete grátis a partir de ' + UI.fmt(state.minOrder) : 'Frete grátis';
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:14px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="display:flex;gap:12px;align-items:flex-start;">' +
          '<div style="width:74px;height:74px;border-radius:14px;background:#FAF8F4;border:1px solid #EAE4DA;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:#6F6860;font-size:11px;font-weight:600;">Frete</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' +
              '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#FFF0EE;color:#B42318;">Oferta</span>' +
              '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#FAF8F4;color:#6F6860;">Frete grátis</span>' +
              (window._promoActive !== false ? '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#F0FAF4;color:#1F6F43;">Ativa</span>' : '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#FAF8F4;color:#6F6860;">Inativa</span>') +
            '</div>' +
            '<div style="font-size:16px;font-weight:600;line-height:1.25;color:#1F1F1F;">Frete grátis</div>' +
            '<div style="font-size:12px;color:#6F6860;margin-top:4px;line-height:1.45;">O frete fica grátis quando o pedido atinge o valor mínimo configurado.</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:12px;display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;">' +
          '<div style="font-size:13px;color:#6F6860;text-decoration:line-through;">' + (state.minOrder > 0 ? UI.fmt(state.minOrder) : '—') + '</div>' +
          '<div style="font-size:28px;font-weight:700;line-height:1;color:#B42318;">€0,00</div>' +
          '<div style="font-size:12px;color:#6F6860;">Frete zerado no pedido</div>' +
        '</div>' +
        (state.minOrder > 0 ? '<div style="margin-top:8px;font-size:11px;color:#6F6860;">Pedido mínimo: ' + UI.fmt(state.minOrder) + '</div>' : '') +
      '</div>';
    }
    if (!state.reference) {
      return '<div style="background:#fff;border:1px dashed #E4D7D4;border-radius:14px;padding:14px;color:#8A7E7C;font-size:13px;line-height:1.5;">' +
        (state.applyTo === 'selected' ? 'Selecione um produto para ver o preview.' : 'Escolha um produto para calcular a promoção.') +
        '</div>';
    }

    var ref = state.reference;
    var name = ref.name || ref.title || 'Produto';
    var img = ref.imageBase64 || ref.imageUrl || ref.image || ref.picture || '';
    var kindLabel = state.type === 'pct'
      ? (state.value + '% OFF')
      : state.type === 'eur'
        ? (UI.fmt(state.value) + ' de desconto')
        : ('Leve ' + (state.leveQtd || 0) + ', pague ' + (state.pagueQtd || 0));
    var offerLabel = 'Oferta';
    var priceText = UI.fmt(state.newPrice || 0);
    var originalText = UI.fmt(state.basePrice || 0);

    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:14px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="display:flex;gap:12px;align-items:flex-start;">' +
        '<div style="width:74px;height:74px;border-radius:14px;background:#FAF8F4;border:1px solid #EAE4DA;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:#6F6860;font-size:11px;font-weight:600;">' +
          (img ? '<img src="' + _esc(img) + '" alt="" style="width:100%;height:100%;object-fit:cover;">' : 'Sem imagem') +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' +
            '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#FFF0EE;color:#B42318;">' + offerLabel + '</span>' +
            '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#FAF8F4;color:#6F6860;">' + (state.applyTo === 'selected' ? 'Selecionados' : 'Todos') + '</span>' +
            (window._promoActive !== false ? '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#F0FAF4;color:#1F6F43;">Ativa</span>' : '<span style="font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;background:#FAF8F4;color:#6F6860;">Inativa</span>') +
          '</div>' +
          '<div style="font-size:16px;font-weight:600;line-height:1.25;color:#1F1F1F;">' + _esc(name) + '</div>' +
          '<div style="font-size:12px;color:#6F6860;margin-top:4px;line-height:1.45;">' + _esc(state.info.hint) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:12px;display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;">' +
        '<div style="font-size:13px;color:#6F6860;text-decoration:line-through;">' + originalText + '</div>' +
        '<div style="font-size:28px;font-weight:700;line-height:1;color:#B42318;">' + priceText + '</div>' +
        '<div style="font-size:12px;color:#6F6860;">' + kindLabel + '</div>' +
      '</div>' +
      (state.minOrder > 0 ? '<div style="margin-top:8px;font-size:11px;color:#6F6860;">Pedido mínimo: ' + UI.fmt(state.minOrder) + '</div>' : '') +
    '</div>';
  }

  function _promoCostForProduct(product) {
    if (!product) return 0;
    var raw = _marketingCostRaw(product);
    return _promoNumber(raw);
  }

  function _promoDiscountForProduct(product, state) {
    var base = _promoBasePrice(product);
    if (!(base > 0)) return { original: 0, final: 0, discount: 0, unitText: '' };
    var final = base;
    var discount = 0;

    if (state.type === 'pct') {
      discount = base * ((_promoNumber(state.pctValue != null ? state.pctValue : state.value) || 0) / 100);
      final = Math.max(base - discount, 0);
    } else if (state.type === 'eur') {
      discount = _promoNumber(state.eurValue != null ? state.eurValue : state.value) || 0;
      final = Math.max(base - discount, 0);
    } else if (state.type === 'fixed') {
      final = Math.max(Math.min(_promoNumber(state.fixedPrice != null ? state.fixedPrice : state.value) || base, base), 0);
      discount = Math.max(base - final, 0);
    } else if (state.type === 'add1') {
      var leve = parseInt(state.leveQtd || 0, 10) || 0;
      var pague = parseInt(state.pagueQtd || 0, 10) || 0;
      if (leve > 0 && leve > pague && pague > 0) {
        final = base * (pague / leve);
        discount = base - final;
      }
    }

    return {
      original: base,
      final: final,
      discount: discount,
      cost: _promoCostForProduct(product),
      margin: _promoCostForProduct(product) > 0 ? final - _promoCostForProduct(product) : null
    };
  }

  function _promoTargetProducts(state) {
    if (state.applyTo === 'selected') return state.selectedProducts || [];
    return (_products || []).slice(0, 3);
  }

  function _promoItemImpactHtml(product, state) {
    var calc = _promoDiscountForProduct(product, state);
    var name = product.name || product.title || 'Produto';
    if (!(calc.original > 0)) {
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(name) + '</div>' +
        '<div style="font-size:12px;color:#6F6860;margin-top:4px;">Sem preço definido para calcular o impacto.</div>' +
      '</div>';
    }

    if (state.type === 'frete') {
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(name) + '</div>' +
        '<div style="font-size:12px;color:#6F6860;margin-top:4px;">Frete grátis quando o pedido atingir o valor mínimo configurado.</div>' +
        (state.minOrder > 0 ? '<div style="font-size:12px;color:#6F6860;margin-top:4px;">Pedido mínimo: ' + UI.fmt(state.minOrder) + '</div>' : '') +
      '</div>';
    }

    var priceLine = UI.fmt(calc.original) + ' → ' + UI.fmt(calc.final);
    var discountLine = calc.discount > 0 ? 'Desconto: ' + UI.fmt(calc.discount) : 'Sem desconto aplicado';
    var marginLine = calc.margin != null
      ? 'Margem estimada: ' + UI.fmt(calc.margin)
      : '';

    if (state.type === 'add1') {
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(name) + '</div>' +
        '<div style="font-size:12px;color:#6F6860;margin-top:4px;">' + priceLine + '</div>' +
        '<div style="font-size:12px;color:#B42318;font-weight:600;margin-top:4px;">Leve ' + (state.leveQtd || 0) + ', pague ' + (state.pagueQtd || 0) + '</div>' +
        (marginLine ? '<div style="font-size:12px;color:#6F6860;margin-top:4px;">' + marginLine + '</div>' : '') +
      '</div>';
    }

    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;padding:12px 14px;">' +
      '<div style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(name) + '</div>' +
      '<div style="font-size:12px;color:#6F6860;margin-top:4px;">Preço: ' + priceLine + '</div>' +
      '<div style="font-size:12px;color:#B42318;font-weight:600;margin-top:4px;">' + discountLine + '</div>' +
      (marginLine ? '<div style="font-size:12px;color:#6F6860;margin-top:4px;">' + marginLine + '</div>' : '') +
    '</div>';
  }

  function _promoImpactHtml(state) {
    var targets = _promoTargetProducts(state);
    if (!targets.length) {
      return '<div style="color:#8A7E7C;font-size:13px;line-height:1.5;">Selecione um produto para calcular o impacto.</div>';
    }
    var header = state.applyTo === 'selected'
      ? 'Impacto por produto selecionado'
      : 'Impacto estimado nos principais produtos';
    return '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div style="font-size:12px;color:#6F6860;margin-bottom:2px;">' + header + '</div>' +
      targets.map(function (product) {
        return _promoItemImpactHtml(product, state);
      }).join('') +
    '</div>';
  }

  function _refreshPromoPreview() {
    var panel = document.getElementById('prm-products-panel');
    var applyRadio = document.querySelector('input[name="prm-apply"]:checked');
    var applyTo = applyRadio ? applyRadio.value : 'all';
    if (panel) panel.style.display = applyTo === 'selected' ? 'block' : 'none';

    var state = _promoState();
    var preview = document.getElementById('prm-preview');
    var impact = document.getElementById('prm-impact');
    var count = document.getElementById('prm-products-count');
    if (count) count.textContent = _promoSelectedProductIds().length + ' produtos selecionados';
    if (preview) preview.innerHTML = _promoPreviewHtml(state);
    if (impact) impact.innerHTML = _promoImpactHtml(state);
  }

  function _filterPromoProducts() {
    var search = ((document.getElementById('prm-product-search') || {}).value || '').trim().toLowerCase();
    var rows = document.querySelectorAll('#prm-product-list label');
    Array.prototype.forEach.call(rows, function (row) {
      var text = String(row.dataset.productName || row.textContent || '').toLowerCase();
      row.style.display = !search || text.indexOf(search) !== -1 ? 'flex' : 'none';
    });
  }

  function _renderPromoOfferFields() {
    var host = document.getElementById('prm-offer-fields');
    if (!host) return;
    var fieldStyle = _marketingInputStyle() + 'background:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var labelStyle = _marketingModalLabelStyle();
    var type = _normalizePromoType(window._promoType || 'pct');
    var base = window._promoBase || {};
    var pctEl = document.getElementById('prm-pct');
    var eurEl = document.getElementById('prm-eur');
    var leveEl = document.getElementById('prm-leve');
    var pagueEl = document.getElementById('prm-pague');
    var pctValue = pctEl ? pctEl.value : (base.valuePercentual != null ? base.valuePercentual : (type === 'pct' ? (base.value || '') : ''));
    var eurValue = eurEl ? eurEl.value : (base.valueDesconto != null ? base.valueDesconto : (type === 'eur' ? (base.value || '') : ''));
    var leveQtd = leveEl ? leveEl.value : (base.leveQtd != null ? base.leveQtd : '');
    var pagueQtd = pagueEl ? pagueEl.value : (base.pagueQtd != null ? base.pagueQtd : '');

    if (type === 'pct') {
      host.innerHTML = '<div style="display:grid;grid-template-columns:minmax(100px,145px) auto;gap:8px;align-items:end;min-width:0;">' +
        '<div><label style="' + labelStyle + '">Percentual de desconto</label>' +
        '<input id="prm-pct" type="number" step="0.01" value="' + (pctValue || '') + '" placeholder="Ex: 10" oninput="Modules.Marketing._refreshPromoPreview()" style="' + fieldStyle + '">' +
        '</div><div style="height:38px;padding:0 2px;font-size:13px;font-weight:600;color:#6F6860;display:flex;align-items:center;">%</div></div>';
      return;
    }

    if (type === 'eur') {
      host.innerHTML = '<div style="display:grid;grid-template-columns:minmax(100px,145px) auto;gap:8px;align-items:end;min-width:0;">' +
        '<div><label style="' + labelStyle + '">Valor do desconto</label>' +
        '<input id="prm-eur" type="text" inputmode="decimal" value="' + (eurValue || '') + '" placeholder="Ex: 2,00" oninput="Modules.Marketing._refreshPromoPreview()" style="' + fieldStyle + '">' +
        '</div><div style="height:38px;padding:0 2px;font-size:13px;font-weight:600;color:#6F6860;display:flex;align-items:center;">€</div></div>';
      return;
    }

    if (type === 'add1') {
      host.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,132px));gap:10px;min-width:0;">' +
        '<div><label style="' + labelStyle + '">Leve</label>' +
        '<input id="prm-leve" type="number" min="2" step="1" value="' + (leveQtd || '') + '" placeholder="Ex: 3" oninput="Modules.Marketing._refreshPromoPreview()" style="' + fieldStyle + '">' +
        '</div><div><label style="' + labelStyle + '">Pague</label>' +
        '<input id="prm-pague" type="number" min="0" step="1" value="' + (pagueQtd || '') + '" placeholder="Ex: 2" oninput="Modules.Marketing._refreshPromoPreview()" style="' + fieldStyle + '">' +
        '</div></div>' +
        '<div style="margin-top:7px;color:#6F6860;font-size:12px;line-height:1.35;">Exemplo: Leve 3, pague 2. Pague precisa ser menor que Leve.</div>';
      return;
    }

    if (type === 'frete') {
      host.innerHTML = '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:10px 12px;color:#1F1F1F;font-size:13px;line-height:1.4;">Configure o valor mínimo acima. Quando o pedido atingir esse valor, a entrega fica grátis no cardápio.</div>';
      return;
    }

    host.innerHTML = '';
  }

  function _openPromoModal(id, mode) {
    _editingId = id;
    var promo = id ? (_promos.find(function (x) { return String(x.id) === String(id); }) || {}) : { type: 'pct', active: true };
    var editMode = mode === 'edit' || mode == null || (!id && mode !== 'view');
    var title = editMode ? (id ? 'Editar promoção' : 'Criar promoção para vender mais rápido') : 'Detalhes da promoção';
    var body = editMode ? _promoEditModalHtml(promo) : _promoViewModalHtml(promo);
    var footer = editMode
      ? '<div style="display:flex;flex-direction:column;gap:6px;align-items:stretch;">' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button onclick="Modules.Marketing._savePromo()" style="flex:1;min-width:180px;padding:13px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.18);">Salvar alterações</button>' +
            '<button onclick="if(window._promoModal)window._promoModal.close()" style="min-width:120px;padding:13px 18px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>' +
            (id ? '<button onclick="Modules.Marketing._deletePromo(\'' + (id || '') + '\')" style="min-width:140px;padding:13px 18px;border-radius:12px;border:1px solid #F8D1CC;background:#FFF0EE;color:#B42318;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Excluir promoção</button>' : '') +
          '</div>' +
          '<div style="font-size:11px;color:#7A746B;text-align:center;">As alterações ficarão visíveis nas regras de promoção aplicadas ao cardápio.</div>' +
        '</div>'
      : '<div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button onclick="Modules.Marketing._openPromoModal(\'' + (id || '') + '\', \'edit\')" style="min-width:120px;padding:11px 18px;border-radius:11px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);">Editar</button>' +
          '<button onclick="Modules.Marketing._duplicatePromo(\'' + (id || '') + '\')" style="min-width:112px;padding:11px 16px;border-radius:11px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Duplicar</button>' +
          '<button onclick="Modules.Marketing._togglePromoStatus(\'' + (id || '') + '\')" style="min-width:108px;padding:11px 16px;border-radius:11px;border:1px solid ' + (promo.active !== false ? '#FEDF89' : '#D9F2E3') + ';background:' + (promo.active !== false ? '#FFF7ED' : '#F0FAF4') + ';color:' + (promo.active !== false ? '#B45309' : '#1F6F43') + ';font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">' + (promo.active !== false ? 'Pausar' : 'Ativar') + '</button>' +
          '<button onclick="if(window._promoModal)window._promoModal.close()" style="min-width:106px;padding:11px 16px;border-radius:11px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Fechar</button>' +
        '</div>';

    if (window._promoModal) window._promoModal.close();
    window._promoType = _normalizePromoType(promo.type || 'pct');
    window._promoActive = promo.active !== false;
    window._promoBase = promo;
    window._promoModal = UI.modal({ title: title, body: body, footer: footer, maxWidth: editMode ? '1120px' : '980px' });
    if (editMode) {
      _renderPromoOfferFields();
      _applySeasonDraftToPromoForm();
      setTimeout(function () { _refreshPromoPreview(); }, 80);
    }
  }

  function _selectPromoType(type) {
    window._promoType = _normalizePromoType(type);
    document.querySelectorAll('[data-ptype]').forEach(function (btn) {
      var active = btn.dataset.ptype === window._promoType;
      btn.style.borderColor = active ? '#B42318' : '#EAE4DA';
      btn.style.background = active ? '#FFF0EE' : '#fff';
      btn.style.color = active ? '#B42318' : '#1F1F1F';
    });
    document.querySelectorAll('[data-promo-icon]').forEach(function (icon) {
      var active = icon.dataset.promoIcon === window._promoType;
      icon.className = active ? 'icon-active' : 'icon-inactive';
    });
    _renderPromoOfferFields();
    _refreshPromoPreview();
  }

  function _togglePromoActive() {
    window._promoActive = !window._promoActive;
    var btn = document.getElementById('prm-active-toggle');
    if (btn) {
      btn.style.background = window._promoActive ? '#B42318' : '#D8CEC2';
      var span = btn.querySelector('span');
      if (span) span.style.transform = 'translateX(' + (window._promoActive ? '18px' : '0') + ')';
    }
    _refreshPromoPreview();
  }

  function _togglePromoStatus(id) {
    var p = (_promos || []).find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    var nextActive = p.active === false;
    var data = { active: nextActive };
    if (nextActive) {
      var validation = _validatePromoSchedule(Object.assign({}, p, data), id);
      if (validation) { UI.toast(validation, 'error'); return; }
      var endTs = _promoEndTs(p);
      if (endTs && endTs < Date.now()) data.endDate = '';
    }
    DB.update('promotions', id, data).then(function () {
      _renderPromos();
      if (Modules.Catalogo && typeof Modules.Catalogo._refreshProductPromotions === 'function') Modules.Catalogo._refreshProductPromotions();
    });
  }

  function _duplicatePromo(id) {
    var p = (_promos || []).find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    var copy = {};
    Object.keys(p).forEach(function (key) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return;
      copy[key] = p[key];
    });
    copy.name = (p.name || 'Promoção') + ' (cópia)';
    copy.active = false;
    copy.startDate = '';
    copy.endDate = '';
    copy.applyTo = p.applyTo || 'all';
    copy.scope = p.scope || (copy.applyTo === 'selected' ? 'produtos_selecionados' : 'todos_produtos');
    copy.rulesText = p.rulesText || p.rules || '';
    copy.autoTags = _promoAutoTags(copy).map(function (t) { return t.key; });
    DB.add('promotions', copy).then(function () {
      UI.toast('Promoção duplicada', 'success');
      _renderPromos();
      if (Modules.Catalogo && typeof Modules.Catalogo._refreshProductPromotions === 'function') Modules.Catalogo._refreshProductPromotions();
    });
  }

  function _savePromo() {
    var name = (document.getElementById('prm-name') || {}).value || '';
    if (!name) { UI.toast('Nome é obrigatório', 'error'); return; }
    var type = _normalizePromoType(window._promoType || 'pct');
    var applyEl = document.querySelector('input[name="prm-apply"]:checked');
    var applyTo = applyEl ? applyEl.value : 'all';
    var productIds = applyTo === 'selected' ? _promoSelectedProductIds() : [];
    if (applyTo === 'selected' && productIds.length === 0) {
      UI.toast('Selecione ao menos um produto', 'error');
      return;
    }
    var pctValue = _promoNumber((document.getElementById('prm-pct') || {}).value);
    var eurValue = _promoNumber((document.getElementById('prm-eur') || {}).value);
    var leveQtd = parseInt((document.getElementById('prm-leve') || {}).value, 10) || 0;
    var pagueQtd = parseInt((document.getElementById('prm-pague') || {}).value, 10) || 0;
    var startDate = (document.getElementById('prm-start') || {}).value || '';
    var endDate = (document.getElementById('prm-end') || {}).value || '';
    if (type === 'pct' && !(pctValue > 0)) { UI.toast('Informe o percentual de desconto', 'error'); return; }
    if (type === 'eur' && !(eurValue > 0)) { UI.toast('Informe o valor do desconto', 'error'); return; }
    if (type === 'add1' && !(leveQtd > 0 && leveQtd > pagueQtd)) { UI.toast('Leve deve ser maior que pague', 'error'); return; }
    if (type === 'frete' && !(parseFloat((document.getElementById('prm-min') || {}).value) > 0)) { UI.toast('Informe o valor mínimo para frete grátis', 'error'); return; }
    var product = productIds.length ? _products.find(function (p) { return String(p.id) === String(productIds[0]); }) : null;
    var minOrder = parseFloat((document.getElementById('prm-min') || {}).value) || 0;
    var data = {
      name: name,
      type: type,
      value: type === 'pct' ? pctValue : type === 'eur' ? eurValue : (type === 'add1' ? leveQtd : (type === 'frete' ? minOrder : 0)),
      valuePercentual: type === 'pct' ? pctValue : 0,
      valueDesconto: type === 'eur' ? eurValue : 0,
      leveQtd: type === 'add1' ? leveQtd : 0,
      pagueQtd: type === 'add1' ? pagueQtd : 0,
      minOrder: minOrder,
      startDate: startDate,
      endDate: endDate,
      scope: applyTo === 'selected' ? 'produtos_selecionados' : 'todos_produtos',
      applyTo: applyTo,
      productIds: productIds,
      productId: product ? product.id : '',
      productName: product ? product.name : '',
      rulesText: (document.getElementById('prm-rules') || {}).value || '',
      autoTags: _promoAutoTags({ type: type }).map(function (t) { return t.key; }),
      active: window._promoActive !== false
    };
    data = _decorateSeasonActionPayload(data, 'promotion');
    var validation = _validatePromoSchedule(data, _editingId);
    if (validation) { UI.toast(validation, 'error'); return; }
    var op = _editingId ? DB.update('promotions', _editingId, data) : DB.add('promotions', data);
    op.then(function (ref) {
      return _editingId ? Promise.resolve(_editingId) : _linkSeasonActionDraft('promotion', ref, 'promotions', data.name);
    }).then(function () {
      UI.toast('Promoção salva!', 'success');
      if (window._promoModal) window._promoModal.close();
      _renderPromos();
      if (Modules.Catalogo && typeof Modules.Catalogo._refreshProductPromotions === 'function') Modules.Catalogo._refreshProductPromotions();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _togglePromo(id) {
    _togglePromoStatus(id);
  }

  function _deletePromo(id) {
    UI.confirm('Eliminar esta promoção?').then(function (yes) {
      if (!yes) return;
      DB.remove('promotions', id).then(function () {
        UI.toast('Eliminado', 'info');
        _renderPromos();
        if (Modules.Catalogo && typeof Modules.Catalogo._refreshProductPromotions === 'function') Modules.Catalogo._refreshProductPromotions();
      });
    });
  }

  // ── CUPONS ────────────────────────────────────────────────────────────────
  function _renderCupons() {
    DB.getAll('coupons').then(function (data) {
      _cupons = data || [];
      _paintCupons();
    });
  }

  function _couponDateValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (value && typeof value.toDate === 'function') {
      try { return value.toDate().getTime(); } catch (e) { return 0; }
    }
    var d = new Date(value);
    return isFinite(d.getTime()) ? d.getTime() : 0;
  }

  function _couponStatusInfo(coupon) {
    var expiry = _couponDateValue(coupon && coupon.expiry);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var uses = parseInt(coupon && coupon.usesCount, 10) || 0;
    var max = parseInt(coupon && coupon.maxUses, 10) || 0;
    if (expiry && expiry < today.getTime()) return { key: 'expired', label: 'Expirado', bg: '#FFF0EE', color: '#B42318' };
    if (max && uses >= max) return { key: 'used', label: 'Esgotado', bg: '#FFF7ED', color: '#B45309' };
    return { key: 'active', label: 'Ativo', bg: '#F0FAF4', color: '#1F6F43' };
  }

  function _couponTypeLabel(type) {
    return String(type || 'pct') === 'eur' ? 'Valor fixo' : 'Percentual';
  }

  function _couponValueLabel(coupon) {
    return String(coupon && coupon.type || 'pct') === 'eur' ? UI.fmt(coupon.value || 0) : ((coupon && coupon.value != null ? coupon.value : 0) + '%');
  }

  function _couponFilteredList() {
    var query = String(_couponUi.query || '').trim().toLowerCase();
    return (_cupons || []).slice().sort(function (a, b) {
      return _couponDateValue(b.updatedAt || b.createdAt || b.expiry || 0) - _couponDateValue(a.updatedAt || a.createdAt || a.expiry || 0);
    }).filter(function (coupon) {
      var status = _couponStatusInfo(coupon).key;
      var type = String(coupon.type || 'pct');
      var haystack = [
        coupon.code,
        _couponTypeLabel(type),
        _couponValueLabel(coupon),
        coupon.minOrder,
        coupon.maxUses,
        coupon.usesCount,
        coupon.expiry
      ].join(' ').toLowerCase();
      if (query && haystack.indexOf(query) < 0) return false;
      if (_couponUi.status !== 'all' && status !== _couponUi.status) return false;
      if (_couponUi.type !== 'all' && type !== _couponUi.type) return false;
      return true;
    });
  }

  function _couponSummary(list) {
    var rows = list || _cupons || [];
    var active = rows.filter(function (c) { return _couponStatusInfo(c).key === 'active'; }).length;
    var expired = rows.filter(function (c) { return _couponStatusInfo(c).key === 'expired'; }).length;
    var used = rows.reduce(function (sum, c) { return sum + (parseInt(c.usesCount, 10) || 0); }, 0);
    return { total: rows.length, active: active, expired: expired, used: used };
  }

  function _couponSummaryHtml(summary) {
    summary = summary || _couponSummary();
    return '<div class="growth-grid" style="margin-bottom:0;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' +
      _marketingKpi('Total de cupons', summary.total, 'confirmation_number', summary.total ? 'product' : 'neutral') +
      _marketingKpi('Cupons ativos', summary.active, 'verified', summary.active ? 'success' : 'neutral') +
      _marketingKpi('Usos registrados', summary.used, 'shopping_bag', summary.used ? 'info' : 'neutral') +
      _marketingKpi('Expirados', summary.expired, 'event_busy', summary.expired ? 'danger' : 'neutral') +
    '</div>';
  }

  function _couponPaging(list) {
    var total = (list || []).length;
    var pageSize = parseInt(_couponUi.pageSize, 10) || 10;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(parseInt(_couponUi.page, 10) || 1, 1), totalPages);
    _couponUi.page = page;
    var startIdx = (page - 1) * pageSize;
    var endIdx = Math.min(startIdx + pageSize, total);
    return {
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? startIdx + 1 : 0,
      end: endIdx,
      items: (list || []).slice(startIdx, endIdx)
    };
  }

  function _couponToolbarHtml(total, filtered) {
    var hasFilters = !!String(_couponUi.query || '').trim() || _couponUi.status !== 'all' || _couponUi.type !== 'all';
    var clearHtml = hasFilters
      ? '<div style="grid-column:1 / -1;display:flex;justify-content:flex-start;"><button type="button" onclick="Modules.Marketing._clearCouponFilters()" style="height:36px;padding:0 13px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>'
      : '';
    return '<div style="' + _marketingCardStyle() + 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px 18px;box-shadow:0 10px 24px rgba(31,31,31,.055);">' +
      '<div style="display:grid;grid-template-columns:minmax(260px,1.35fr) minmax(150px,180px) minmax(150px,180px);gap:10px;align-items:end;">' +
        '<label style="' + _marketingLabelStyle() + '">Buscar<input id="cup-search" type="search" value="' + _esc(_couponUi.query || '') + '" oninput="Modules.Marketing._setCouponSearch(this.value)" placeholder="Código, tipo ou valor" autocomplete="off" style="' + _marketingInputStyle() + 'height:40px;margin-top:5px;background:#FFFCF8;"></label>' +
        '<label style="' + _marketingLabelStyle() + '">Status<select onchange="Modules.Marketing._setCouponStatus(this.value)" style="' + _marketingSelectStyle() + 'height:40px;margin-top:5px;background-color:#FFFCF8;"><option value="all"' + (_couponUi.status === 'all' ? ' selected' : '') + '>Todos</option><option value="active"' + (_couponUi.status === 'active' ? ' selected' : '') + '>Ativos</option><option value="expired"' + (_couponUi.status === 'expired' ? ' selected' : '') + '>Expirados</option><option value="used"' + (_couponUi.status === 'used' ? ' selected' : '') + '>Esgotados</option></select></label>' +
        '<label style="' + _marketingLabelStyle() + '">Tipo<select onchange="Modules.Marketing._setCouponType(this.value)" style="' + _marketingSelectStyle() + 'height:40px;margin-top:5px;background-color:#FFFCF8;"><option value="all"' + (_couponUi.type === 'all' ? ' selected' : '') + '>Todos</option><option value="pct"' + (_couponUi.type === 'pct' ? ' selected' : '') + '>Percentual</option><option value="eur"' + (_couponUi.type === 'eur' ? ' selected' : '') + '>Valor fixo</option></select></label>' +
        clearHtml +
      '</div>' +
    '</div>';
  }

  function _couponEmptyStateHtml(filtered) {
    var title = filtered ? 'Nenhum cupom encontrado' : 'Nenhum cupom ainda';
    var desc = filtered ? 'Ajuste busca, status ou tipo para encontrar cupons.' : 'Crie cupons para atrair clientes e acompanhar usos.';
    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="text-align:center;padding:60px 20px;color:#7A746B;">' +
        '<div style="width:54px;height:54px;border-radius:16px;background:#FAF8F4;border:1px solid #EAE4DA;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span class="mi" style="font-size:26px;color:#A39B90;">confirmation_number</span></div>' +
        '<p style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 6px;">' + _esc(title) + '</p>' +
        '<p style="font-size:13px;color:#7A746B;margin:0 0 16px;">' + _esc(desc) + '</p>' +
        (!filtered ? '<button onclick="Modules.Marketing._openCuponModal(null, \'edit\')" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);">Criar cupom</button>' : '') +
      '</div>' +
    '</div>';
  }

  function _couponTableRowHTML(coupon) {
    var status = _couponStatusInfo(coupon);
    var type = String(coupon.type || 'pct');
    var typeBg = type === 'eur' ? '#F2F7FF' : '#F0FAF4';
    var typeColor = type === 'eur' ? '#2F5F93' : '#1F6F43';
    var couponId = _esc(String(coupon.id || ''));
    return '<tr onclick="Modules.Marketing._openCuponModal(\'' + couponId + '\', \'view\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
      _marketingTd('<div style="display:flex;flex-direction:column;gap:4px;min-width:0;"><div style="font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.25;font-family:\'Courier New\',monospace;letter-spacing:.06em;">' + _esc(coupon.code || 'CUPOM') + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;">' + (coupon.minOrder ? 'Pedido mínimo ' + UI.fmt(coupon.minOrder) : 'Sem pedido mínimo') + '</div></div>') +
      _marketingTd('<span style="display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:' + typeBg + ';color:' + typeColor + ';font-size:11px;font-weight:600;">' + _esc(_couponTypeLabel(type)) + '</span>') +
      _marketingTd('<span style="font-size:13px;font-weight:600;color:#1F1F1F;">' + _esc(_couponValueLabel(coupon)) + '</span>') +
      _marketingTd('<span style="font-size:13px;color:#6F6860;">' + (coupon.maxUses ? _esc(coupon.maxUses) : 'Ilimitado') + '</span>') +
      _marketingTd('<span style="font-size:13px;color:#6F6860;">' + (coupon.expiry ? _esc(UI.fmtDate(new Date(coupon.expiry))) : '—') + '</span>') +
      _marketingTd('<span style="display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:' + status.bg + ';color:' + status.color + ';font-size:11px;font-weight:600;">' + _esc(status.label) + '</span>') +
      _marketingTd('<span style="font-size:13px;color:#6F6860;">' + (coupon.usesCount || 0) + '</span>') +
      _marketingTd('<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">' +
        '<button type="button" title="Ver detalhes" onclick="event.stopPropagation();Modules.Marketing._openCuponModal(\'' + couponId + '\', \'view\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">visibility</span></button>' +
        '<button type="button" title="Editar" onclick="event.stopPropagation();Modules.Marketing._openCuponModal(\'' + couponId + '\', \'edit\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">edit</span></button>' +
        '<button type="button" title="Excluir" onclick="event.stopPropagation();Modules.Marketing._deleteCupon(\'' + couponId + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #F8D1CC;background:#FFF0EE;color:#B42318;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">delete</span></button>' +
      '</div>', 'right') +
    '</tr>';
  }

  function _paintCupons() {
    var content = document.getElementById('marketing-content');
    if (!content) return;
    var filtered = _couponFilteredList();
    var paging = _couponPaging(filtered);
    var summary = _couponSummary(_cupons);
    var pageSizeOptions = [10, 12, 24, 48].map(function (n) {
      return '<option value="' + n + '"' + (Number(_couponUi.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
    }).join('');
    var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<select onchange="Modules.Marketing._setCouponPageSize(this.value)" style="' + _marketingSelectStyle() + 'min-width:110px;max-width:110px;height:34px;padding:0 30px 0 10px;font-size:12px;background-color:#fff;color:#6F6860;">' + pageSizeOptions + '</select>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Marketing._setCouponPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Marketing._setCouponPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>' : '';
    content.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.2;margin:0 0 6px;color:#1F1F1F;">Cupons</h2>' +
          '<p style="font-size:13px;font-weight:400;color:#6F6860;line-height:1.45;max-width:760px;margin:0;">Crie códigos de desconto, acompanhe validade e controle usos.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Marketing._openCuponModal(null, \'edit\')" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 8px 18px rgba(180,35,24,.20)\';" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(180,35,24,.18)\';" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);transition:transform .15s ease,box-shadow .15s ease;">' + _subActionLabel() + '</button>' +
        '</div>' +
      '</div>' +
      _couponSummaryHtml(summary) +
      _couponToolbarHtml(_cupons.length, filtered.length) +
      (filtered.length === 0 ? _couponEmptyStateHtml(_cupons.length > 0) :
        '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><div style="font-size:14px;font-weight:650;color:#1F1F1F;">Cupons cadastrados</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Gerencie códigos, validade, limites e uso em pedidos.</div></div><div style="font-size:12px;color:#6F6860;">' + filtered.length + ' exibido' + (filtered.length === 1 ? '' : 's') + '</div></div>' +
        '<div style="background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;overflow:hidden;box-shadow:0 10px 24px rgba(31,31,31,.045);">' +
          '<div style="overflow:auto;">' +
            '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:980px;">' +
              '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
                _marketingTh('Código') +
                _marketingTh('Tipo') +
                _marketingTh('Valor') +
                _marketingTh('Máx. usos') +
                _marketingTh('Validade') +
                _marketingTh('Status') +
                _marketingTh('Usos') +
                _marketingTh('Ações', 'right') +
              '</tr></thead>' +
              '<tbody id="coupons-list">' + paging.items.map(function (c) { return _couponTableRowHTML(c); }).join('') + '</tbody>' +
            '</table>' +
          '</div>' +
          paginationHtml +
        '</div></section>') +
      '</div>';
    _consumeSeasonActionDraftFor('coupon');
  }

  function _couponViewModalHtml(coupon) {
    var status = _couponStatusInfo(coupon);
    var cardStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:15px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);';
    var sectionTitle = 'font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.25;margin:0;';
    var sectionHelp = 'font-size:11px;color:#6F6860;line-height:1.35;margin:2px 0 0;';
    return '<div style="display:flex;flex-direction:column;gap:9px;max-width:760px;margin:0 auto;">' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(120px,160px);gap:12px;align-items:center;min-width:0;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">' +
              '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;overflow:hidden;flex:0 0 auto;">confirmation_number</span>' +
              '<span style="font-size:11px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Código do cupom</span>' +
            '</div>' +
            '<div style="font-size:19px;font-weight:650;line-height:1.15;color:#1F1F1F;font-family:\'Courier New\',monospace;letter-spacing:.06em;overflow-wrap:anywhere;">' + _esc(coupon.code || 'CUPOM') + '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;"><span style="font-size:11px;font-weight:500;padding:5px 9px;border-radius:999px;background:' + status.bg + ';color:' + status.color + ';">' + _esc(status.label) + '</span><span style="font-size:11px;font-weight:500;padding:5px 9px;border-radius:999px;background:#FFFCF8;color:#6F6860;border:1px solid #E8DCD7;">' + _esc(_couponTypeLabel(coupon.type)) + '</span></div>' +
          '</div>' +
          '<div style="background:#FFF0EE;border:1px solid #F8D1CC;border-radius:12px;padding:9px 11px;text-align:left;min-width:0;max-width:100%;box-sizing:border-box;">' +
            '<div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Desconto</div>' +
            '<div style="font-size:18px;font-weight:650;color:#B42318;line-height:1.15;margin-top:3px;">' + _esc(_couponValueLabel(coupon)) + '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:9px;align-items:start;">' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;">' +
          '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#F2F7FF;color:#2F5F93;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1;overflow:hidden;flex:0 0 auto;">rule</span>' +
          '<div><div style="' + sectionTitle + '">Condições de uso</div><div style="' + sectionHelp + '">Valor mínimo, validade e limite de uso.</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;align-items:start;">' +
          _promoInfoTile('Pedido mínimo', coupon.minOrder ? UI.fmt(coupon.minOrder) : 'Sem mínimo') +
          _promoInfoTile('Máx. usos', coupon.maxUses || 'Ilimitado') +
          _promoInfoTile('Validade', coupon.expiry ? _esc(UI.fmtDate(new Date(coupon.expiry))) : '—') +
        '</div>' +
      '</section>' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;">' +
          '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#F0FAF4;color:#1F6F43;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1;overflow:hidden;flex:0 0 auto;">bar_chart</span>' +
          '<div><div style="' + sectionTitle + '">Uso do cupom</div><div style="' + sectionHelp + '">Acompanhe uso e disponibilidade.</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(105px,1fr));gap:8px;">' +
          _promoInfoTile('Usos registrados', coupon.usesCount || 0) +
          _promoInfoTile('Disponibilidade', status.label) +
        '</div>' +
      '</section>' +
      '</div>' +
      _couponLinkSectionHtml(coupon) +
    '</div>';
  }

  function _couponEditModalHtml(coupon) {
    var fieldStyle = _marketingInputStyle() + 'background:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var selectStyle = _marketingSelectStyle() + 'background-color:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var labelStyle = _marketingModalLabelStyle();
    var cardStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.045);';
    var valueSymbol = String(coupon.type || 'pct') === 'eur' ? '€' : '%';
    var valuePlaceholder = String(coupon.type || 'pct') === 'eur' ? '2,00' : '10';
    return '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">' +
          '<span class="mi" style="width:30px;height:30px;border-radius:10px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;">confirmation_number</span>' +
          '<div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Código do cupom</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Crie um código fácil de divulgar para aplicar desconto no carrinho.</div></div>' +
        '</div>' +
        '<div style="max-width:320px;"><label style="' + labelStyle + '">Código *</label><input id="cup-code" type="text" value="' + _esc(coupon.code || '') + '" placeholder="BRASIL10" style="' + fieldStyle + 'text-transform:uppercase;font-family:\'Courier New\',monospace;letter-spacing:.06em;font-weight:650;" oninput="this.value=this.value.toUpperCase()"></div>' +
      '</section>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;align-items:start;">' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">' +
          '<span class="mi" style="width:30px;height:30px;border-radius:10px;background:#FFF7ED;color:#B45309;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;">sell</span>' +
          '<div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Desconto</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Defina se o cupom reduz uma porcentagem ou um valor fixo do pedido.</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:minmax(150px,190px) minmax(110px,150px);gap:12px;align-items:end;">' +
          '<div><label style="' + labelStyle + '">Tipo</label><select id="cup-type" onchange="Modules.Marketing._refreshCouponValueAdornment()" style="' + selectStyle + '"><option value="pct"' + (coupon.type === 'pct' ? ' selected' : '') + '>Percentual (%)</option><option value="eur"' + (coupon.type === 'eur' ? ' selected' : '') + '>Valor fixo (€)</option></select></div>' +
          '<div><label style="' + labelStyle + '">Valor</label><div style="display:grid;grid-template-columns:auto minmax(80px,1fr);gap:8px;align-items:center;"><span id="cup-value-symbol" style="font-size:13px;font-weight:600;color:#6F6860;">' + valueSymbol + '</span><input id="cup-value" type="text" inputmode="decimal" value="' + _esc(coupon.value || '') + '" placeholder="' + valuePlaceholder + '" style="' + fieldStyle + '"></div></div>' +
        '</div>' +
      '</section>' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">' +
          '<span class="mi" style="width:30px;height:30px;border-radius:10px;background:#F2F7FF;color:#2F5F93;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;">rule</span>' +
          '<div><div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.25;">Condições</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Controle valor mínimo, limite de uso e validade do cupom.</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:minmax(130px,160px) minmax(110px,140px) minmax(135px,165px);gap:12px;align-items:end;">' +
          '<div><label style="' + labelStyle + '">Pedido mínimo</label><div style="display:grid;grid-template-columns:auto minmax(88px,1fr);gap:8px;align-items:center;"><span style="font-size:13px;font-weight:600;color:#6F6860;">€</span><input id="cup-min" type="text" inputmode="decimal" value="' + _esc(coupon.minOrder || '') + '" placeholder="20,00" style="' + fieldStyle + '"></div></div>' +
          '<div><label style="' + labelStyle + '">Máx. usos</label><input id="cup-max" type="number" value="' + _esc(coupon.maxUses || '') + '" placeholder="Ilimitado" style="' + fieldStyle + '"></div>' +
          '<div><label style="' + labelStyle + '">Validade</label><input id="cup-expiry" type="date" value="' + _esc(coupon.expiry || '') + '" style="' + fieldStyle + '"></div>' +
        '</div>' +
      '</section>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;align-items:start;">' +
      '<section style="' + cardStyle + '">' +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;">' +
          '<div><div style="font-size:14px;font-weight:650;color:#1F1F1F;line-height:1.25;">Usos registrados</div><div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">Mostra quantas vezes este cupom já entrou em pedidos.</div></div>' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:34px;padding:0 12px;border-radius:11px;background:#FFFCF8;border:1px solid #E8DCD7;color:#1F1F1F;font-size:13px;font-weight:600;">' + (coupon.usesCount || 0) + '</span>' +
        '</div>' +
      '</section>' +
      _couponLinkSectionHtml(coupon) +
      '</div>' +
    '</div>';
  }

  function _refreshCouponValueAdornment() {
    var type = (document.getElementById('cup-type') || {}).value || 'pct';
    var symbol = document.getElementById('cup-value-symbol');
    var value = document.getElementById('cup-value');
    if (symbol) symbol.textContent = type === 'eur' ? '€' : '%';
    if (value) value.placeholder = type === 'eur' ? '2,00' : '10';
  }

  function _openCuponModal(id, mode) {
    _editingId = id;
    var c = id ? (_cupons.find(function (x) { return x.id === id; }) || {}) : { type: 'pct' };
    var editMode = mode === 'edit' || mode == null || (!id && mode !== 'view');
    var body = editMode ? _couponEditModalHtml(c) : _couponViewModalHtml(c);
    var footer = editMode
      ? '<div style="display:flex;flex-direction:column;gap:6px;align-items:stretch;">' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button onclick="Modules.Marketing._saveCupon()" style="flex:1;min-width:180px;padding:13px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.18);">' + (id ? 'Atualizar cupom' : 'Criar cupom') + '</button>' +
            '<button onclick="if(window._cupomModal)window._cupomModal.close()" style="min-width:120px;padding:13px 18px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>' +
            (id ? '<button onclick="Modules.Marketing._deleteCupon(\'' + _esc(id || '') + '\')" style="min-width:130px;padding:13px 18px;border-radius:12px;border:1px solid #F8D1CC;background:#FFF0EE;color:#B42318;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Excluir cupom</button>' : '') +
          '</div>' +
          '<div style="font-size:11px;color:#7A746B;text-align:center;">O código ficará disponível conforme validade e limite de uso configurados.</div>' +
        '</div>'
      : '<div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button onclick="Modules.Marketing._openCuponModal(\'' + _esc(id || '') + '\', \'edit\')" style="min-width:118px;padding:11px 18px;border-radius:11px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);">Editar</button>' +
          '<button onclick="if(window._cupomModal)window._cupomModal.close()" style="min-width:106px;padding:11px 16px;border-radius:11px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Fechar</button>' +
        '</div>';
    if (window._cupomModal) window._cupomModal.close();
    window._cupomModal = UI.modal({ title: editMode ? (id ? 'Editar Cupom' : 'Novo Cupom') : 'Detalhes do cupom', body: body, footer: footer, maxWidth: editMode ? '1120px' : '820px' });
    if (editMode) {
      _applySeasonDraftToCouponForm();
      setTimeout(_refreshCouponValueAdornment, 50);
    }
    setTimeout(function () { _renderCouponLink(c); }, 80);
  }

  function _couponSetFilter(key, value) {
    _couponUi[key] = value || (key === 'query' ? '' : 'all');
    _couponUi.page = 1;
    _paintCupons();
  }

  function _setCouponSearch(value) { _couponSetFilter('query', value || ''); }
  function _setCouponStatus(value) { _couponSetFilter('status', value || 'all'); }
  function _setCouponType(value) { _couponSetFilter('type', value || 'all'); }
  function _setCouponPage(page) { _couponUi.page = parseInt(page, 10) || 1; _paintCupons(); }
  function _setCouponPageSize(size) { _couponUi.pageSize = parseInt(size, 10) || 10; _couponUi.page = 1; _paintCupons(); }
  function _clearCouponFilters() {
    _couponUi.query = '';
    _couponUi.status = 'all';
    _couponUi.type = 'all';
    _couponUi.page = 1;
    _paintCupons();
  }

  function _saveCupon() {
    var code = (document.getElementById('cup-code') || {}).value || '';
    if (!code) { UI.toast('Código é obrigatório', 'error'); return; }
    var data = {
      code: code.toUpperCase(),
      type: (document.getElementById('cup-type') || {}).value || 'pct',
      value: _promoNumber((document.getElementById('cup-value') || {}).value) || 0,
      minOrder: _promoNumber((document.getElementById('cup-min') || {}).value) || 0,
      maxUses: parseInt((document.getElementById('cup-max') || {}).value) || null,
      expiry: (document.getElementById('cup-expiry') || {}).value || null,
      usesCount: _editingId ? ((_cupons.find(function (c) { return c.id === _editingId; }) || {}).usesCount || 0) : 0
    };
    data = _decorateSeasonActionPayload(data, 'coupon');
    var op = _editingId ? DB.update('coupons', _editingId, data) : DB.add('coupons', data);
    op.then(function (ref) {
      return _editingId ? Promise.resolve(_editingId) : _linkSeasonActionDraft('coupon', ref, 'coupons', data.code);
    }).then(function () {
      UI.toast('Cupom salvo!', 'success');
      if (window._cupomModal) window._cupomModal.close();
      _renderCupons();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteCupon(id) {
    UI.confirm('Eliminar este cupom?').then(function (yes) {
      if (!yes) return;
      DB.remove('coupons', id).then(function () { UI.toast('Eliminado', 'info'); _renderCupons(); });
    });
  }

  // ── UPSELL ────────────────────────────────────────────────────────────────
  function _upsellTypeInfo(type) {
    var t = String(type || '').toLowerCase();
    var map = {
      complemento: {
        key: 'complemento',
        label: 'Complemento',
        tag: 'upsell_complemento',
        tone: '#1A9E5A',
        desc: 'Sugere um produto complementar quando o cliente escolhe determinado produto.',
        example: 'Coxinha → Guaraná.'
      },
      upgrade: {
        key: 'upgrade',
        label: 'Upgrade',
        tag: 'upsell_upgrade',
        tone: '#3B82F6',
        desc: 'Sugere uma versão maior, melhor ou mais completa do produto.',
        example: 'Coxinha normal → Coxinha XL.'
      },
      combo_sugerido: {
        key: 'combo_sugerido',
        label: 'Combo sugerido',
        tag: 'upsell_combo_sugerido',
        tone: '#C4362A',
        desc: 'Sugere montar uma combinação com outros produtos.',
        example: 'Adicionar bebida + sobremesa.'
      },
      carrinho: {
        key: 'carrinho',
        label: 'Carrinho',
        tag: 'upsell_carrinho',
        tone: '#D97706',
        desc: 'Sugere produtos adicionais quando o cliente está no carrinho.',
        example: 'Sugerir sobremesa antes de finalizar.'
      },
      valor_minimo: {
        key: 'valor_minimo',
        label: 'Completar valor mínimo',
        tag: 'upsell_valor_minimo',
        tone: '#8A7E7C',
        desc: 'Sugere produtos para o cliente alcançar um valor mínimo configurado.',
        example: 'Faltan 3,50 € para completar tu pedido.'
      }
    };
    return map[t] || map.complemento;
  }

  function _upsellBenefitInfo(type) {
    var t = String(type || '').toLowerCase();
    var map = {
      none: {
        key: 'none',
        label: 'Sem benefício',
        desc: 'Sem incentivo para o cliente.',
        example: 'También te puede gustar',
        tag: 'upsell_sem_beneficio'
      },
      special_price: {
        key: 'special_price',
        label: 'Preço especial (legado)',
        desc: 'Regra antiga. Revise e converta para um benefício compatível.',
        example: 'Versão antiga que precisa de revisão',
        tag: 'upsell_preco_especial'
      },
      pct: {
        key: 'pct',
        label: 'Desconto em %',
        desc: 'Aplica desconto percentual no produto sugerido.',
        example: 'Añade brigadeiro con 20% de descuento',
        tag: 'upsell_desconto_pct'
      },
      eur: {
        key: 'eur',
        label: 'Desconto em €',
        desc: 'Aplica desconto fixo no produto sugerido.',
        example: 'Añade una bebida y ahorra 0,50 €',
        tag: 'upsell_desconto_valor'
      },
      combo_fixed: {
        key: 'combo_fixed',
        label: 'Combo com preço fechado',
        desc: 'Aplica preço fechado ao conjunto.',
        example: 'Coxinha + Guaraná por 6,90 €',
        tag: 'upsell_combo_fechado'
      },
      bundle_less_pay_more: {
        key: 'bundle_less_pay_more',
        label: 'Leve mais pagando menos',
        desc: 'Sugere mais unidades com preço melhor.',
        example: 'Añade 2 unidades más por solo 3,00 €',
        tag: 'upsell_leve_mais_paga_menos'
      },
      gift: {
        key: 'gift',
        label: 'Brinde condicionado',
        desc: 'Entrega um brinde quando a condição for atendida.',
        example: 'Añade una bebida y llévate un brigadeiro gratis',
        tag: 'upsell_brinde_condicionado'
      },
      cart_goal: {
        key: 'cart_goal',
        label: 'Completar valor para ganhar benefício',
        desc: 'Incentiva completar o carrinho para liberar um benefício.',
        example: 'Faltan 3,50 € para ganar entrega gratis',
        tag: 'upsell_completar_valor'
      },
      frete: {
        key: 'frete',
        label: 'Frete grátis',
        desc: 'Entrega grátis ao atingir o valor mínimo configurado.',
        example: 'Faltan 3,50 € para ganar entrega gratis',
        tag: 'upsell_frete_gratis'
      }
    };
    return map[t] || map.none;
  }

  function _upsellLocationInfo() {
    return [
      { key: 'detail', label: 'Popup do produto' },
      { key: 'cart', label: 'Carrinho' }
    ];
  }

  function _upsellLocationKey(value) {
    var v = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!v) return '';
    if (v === 'detail' || v === 'product' || v === 'produto' || v === 'modaldoproduto' || v === 'modal') return 'detail';
    if (v === 'popup' || v === 'pop-up' || v === 'popupdoproduto') return 'detail';
    if (v === 'cart' || v === 'carrinho' || v === 'basket' || v === 'bag') return 'cart';
    if (v === 'checkout' || v === 'finalizar' || v === 'finalizacao' || v === 'finalização') return 'checkout';
    if (v === 'todos' || v === 'all') return 'all';
    return v;
  }

  function _upsellLocationsNormalize(list) {
    var seen = {};
    return (list || []).map(_upsellLocationKey).filter(function (v) {
      if (!v) return false;
      if (seen[v]) return false;
      seen[v] = true;
      return true;
    });
  }

  function _upsellLocationLabel(value) {
    var key = _upsellLocationKey(value);
    var info = _upsellLocationInfo().find(function (x) { return x.key === key; });
    return info ? info.label : String(value || '').trim() || '—';
  }

  function _upsellLocationLabels(list) {
    var labels = _upsellLocationsNormalize(list).map(_upsellLocationLabel).filter(Boolean);
    return labels.length ? labels.join(' · ') : 'Popup do produto';
  }

  function _upsellLocationChooserHtml(rule) {
    rule = _upsellRule(rule || {});
    var current = _upsellLocationsNormalize(rule.locations || []);
    var selected = current[0] || 'detail';
    return '<div style="grid-column:1 / -1;">' +
      '<div style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Locais de exibição</div>' +
      '<select id="ups-location" onchange="Modules.Marketing._syncUpsellMomentByLocations();Modules.Marketing._refreshUpsellAnalysis()" style="' + _marketingSelectStyle() + 'max-width:280px;background-color:#fff;">' + _upsellLocationInfo().map(function (loc) {
        return '<option value="' + loc.key + '"' + (selected === loc.key ? ' selected' : '') + '>' + _esc(loc.label) + '</option>';
      }).join('') + '</select>' +
    '</div>';
  }

  function _openUpsellShell(opts) {
    opts = opts || {};
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(31,31,31,.42);backdrop-filter:blur(3px);z-index:7000;display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;transition:opacity .22s ease;';
    var maxWidth = opts.maxWidth || '1120px';
    var title = opts.title || '';
    var body = opts.body || '';
    var footer = opts.footer || '';
    overlay.innerHTML = '<div style="background:#fff;width:100%;max-width:' + maxWidth + ';max-height:calc(100dvh - 36px);display:flex;flex-direction:column;overflow:hidden;border-radius:20px;border:1px solid rgba(234,223,216,.88);box-shadow:0 24px 70px rgba(31,31,31,.22);transform:scale(.98);transition:transform .22s ease;">' +
      '<div style="flex:0 0 auto;padding:20px 24px 16px;border-bottom:1px solid #EAE4DA;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);">' +
        '<div style="min-width:0;">' +
          '<div style="font-size:22px;font-weight:650;line-height:1.16;color:#1F1F1F;">' + _esc(title) + '</div>' +
          '<div style="font-size:13px;color:#6F6860;margin-top:5px;line-height:1.45;max-width:720px;">' + _esc(opts.subtitle || '') + '</div>' +
        '</div>' +
        '<button class="ui-upsell-close" style="background:#fff;border:1px solid #EAE4DA;border-radius:12px;width:36px;height:36px;font-size:18px;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(31,31,31,.06);">×</button>' +
      '</div>' +
      '<div class="ui-upsell-scroll" style="flex:1 1 auto;overflow-y:auto;padding:20px 24px;background:#FFFCFA;">' + body + '</div>' +
      (footer ? '<div style="flex:0 0 auto;padding:16px 24px 20px;border-top:1px solid #EAE4DA;background:#fff;">' + footer + '</div>' : '') +
    '</div>';
    document.body.appendChild(overlay);

    var inner = overlay.firstElementChild;
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
      inner.style.transform = 'scale(1)';
    });

    function close() {
      overlay.style.opacity = '0';
      inner.style.transform = 'scale(.98)';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 220);
    }

    overlay.querySelector('.ui-upsell-close').onclick = close;
    overlay.onclick = function (e) {
      if (e.target === overlay) close();
    };

    return { close: close, el: overlay };
  }

  function _upsellBenefitHelpText(key) {
    var texts = {
      none: 'Apenas uma recomendação simples, sem incentivo para o cliente.',
      special_price: 'Preço especial legado. Revise esta regra antes de ativar.',
      pct: 'Desconto percentual aplicado só neste upsell.',
      eur: 'Desconto fixo aplicado só neste upsell.',
      combo_fixed: 'Os produtos entram juntos com preço fechado.',
      bundle_less_pay_more: 'O cliente leva mais unidades por um valor melhor.',
      gift: 'O cliente recebe um brinde ao cumprir a condição.',
      cart_goal: 'O cliente recebe um incentivo ao atingir o valor mínimo.',
      frete: 'O pedido ganha frete grátis ao atingir o valor mínimo.'
    };
    return texts[key] || texts.none;
  }

  function _upsellBenefitOptionsForType(type) {
    var t = String(type || '').toLowerCase();
    if (t === 'complemento') return ['none', 'pct', 'eur', 'combo_fixed'];
    if (t === 'upgrade') return ['pct', 'eur', 'bundle_less_pay_more'];
    if (t === 'combo_sugerido') return ['combo_fixed', 'pct', 'eur', 'gift'];
    if (t === 'carrinho') return ['none', 'pct', 'eur', 'combo_fixed'];
    if (t === 'valor_minimo') return ['cart_goal', 'gift', 'eur', 'frete'];
    return [];
  }

  function _upsellBenefitAllowedForType(type, benefit) {
    var list = _upsellBenefitOptionsForType(type);
    return list.indexOf(String(benefit || '').toLowerCase()) >= 0;
  }

  function _upsellBenefitSelectorHtml(rule) {
    rule = _upsellRule(rule || {});
    var type = String(window._upsellType || rule.type || '').trim();
    var current = typeof window._upsellBenefit === 'string' ? String(window._upsellBenefit).trim() : String(rule.benefitType || '').trim();
    var allowed = _upsellBenefitOptionsForType(type);
    var legacyBenefit = rule.benefitType === 'special_price' || current === 'special_price';
    if (current === 'special_price' || (current && allowed.indexOf(current) < 0)) current = '';
    if (!type) {
      return '<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:8px;">' +
        '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;">Benefício</label>' +
        '<input id="ups-benefit-type" type="hidden" value="">' +
        '<div style="font-size:12px;color:#8A7E7C;line-height:1.5;background:#F8F5F5;border:1px dashed #E4D7D4;border-radius:12px;padding:12px 14px;">Selecione primeiro o tipo de upsell.</div>' +
      '</div>';
    }
    return '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div style="font-size:11px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Benefício</div>' +
      '<input id="ups-benefit-type" type="hidden" value="' + _esc(current) + '">' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + allowed.map(function (b) {
        var bi = _upsellBenefitInfo(b);
        var active = bi.key === current;
        return '<button type="button" data-benefit-pick="1" data-benefit-key="' + bi.key + '" onclick="Modules.Marketing._pickUpsellBenefit(\'' + bi.key + '\', event)" style="padding:9px 12px;border-radius:999px;border:1px solid ' + (active ? '#C4362A' : '#E8DCD7') + ';background:' + (active ? '#FFF0EE' : '#FFFCF8') + ';color:' + (active ? '#C4362A' : '#1A1A1A') + ';font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;box-shadow:' + (active ? '0 6px 14px rgba(196,54,42,.10)' : 'none') + ';">' + _esc(bi.label) + '</button>';
      }).join('') + '</div>' +
      (current ? '<div style="font-size:12px;color:#8A7E7C;line-height:1.5;">A opção escolhida define os campos abaixo.</div>' : '<div style="font-size:12px;color:#8A7E7C;line-height:1.5;background:#F8F5F5;border:1px dashed #E4D7D4;border-radius:12px;padding:12px 14px;">Escolha uma opção para configurar os campos da regra.</div>') +
      (legacyBenefit ? '<div style="font-size:12px;color:#8A7E7C;line-height:1.5;background:#FFF8E8;border:1px solid #F2D9A6;border-radius:12px;padding:12px 14px;">Regra legada detectada. Revise antes de ativar.</div>' : '') +
    '</div>';
  }

  function _upsellBenefitSectionHtml(rule) {
    return '<div style="display:flex;flex-direction:column;gap:12px;">' +
      _upsellBenefitSelectorHtml(rule) +
      '<div id="ups-benefit-fields">' + _upsellBenefitFieldsHtml(rule) + '</div>' +
    '</div>';
  }

  function _syncUpsellBenefitUI() {
    var type = String(window._upsellType || '').trim();
    var current = String(window._upsellBenefit || '').trim();
    var allowed = _upsellBenefitOptionsForType(type);
    if (current === 'special_price' || (current && allowed.indexOf(current) < 0)) current = '';
    var hidden = document.getElementById('ups-benefit-type');
    if (hidden) hidden.value = current;

    document.querySelectorAll('[data-benefit-pick]').forEach(function (btn) {
      var active = btn.dataset.benefitKey === current;
      btn.style.borderColor = active ? '#C4362A' : '#EEE6E4';
      btn.style.background = active ? '#FFF0EE' : '#fff';
      btn.style.color = active ? '#C4362A' : '#1A1A1A';
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    document.querySelectorAll('[data-ups-benefit-section]').forEach(function (section) {
      var key = section.getAttribute('data-ups-benefit-section') || '';
      section.style.display = current === key ? 'block' : 'none';
    });
  }

  function _upsellItemProductId(item) {
    return String(item && (item.id || item.productId || item.product_id || item.productID || item.product || item.suggestedProductId || item.sku || '') || '');
  }

  function _orderExplicitUpsellRuleIds(order) {
    var ids = [];
    var benefits = order && order.upsellBenefits || {};
    if (Array.isArray(benefits.appliedRuleIds)) ids = ids.concat(benefits.appliedRuleIds);
    if (Array.isArray(order && order.upsellRuleIds)) ids = ids.concat(order.upsellRuleIds);
    _orderItems(order).forEach(function (item) {
      if (item && item.upsellRuleId) ids.push(item.upsellRuleId);
    });
    return ids.map(String).filter(Boolean).filter(function (id, pos, arr) { return arr.indexOf(id) === pos; });
  }

  function _orderHasExplicitUpsellRule(order, rule) {
    var ruleId = String(rule && rule.id || '');
    return !!ruleId && _orderExplicitUpsellRuleIds(order).indexOf(ruleId) >= 0;
  }

  function _upsellOrderMatchesRule(order, rule) {
    if (_orderHasExplicitUpsellRule(order, rule)) return true;
    var ids = _upsellRuleProducts(rule).map(function (p) { return String(p.id); }).filter(Boolean);
    if (!ids.length) return false;
    return _orderItems(order).some(function (item) {
      return ids.indexOf(_upsellItemProductId(item)) >= 0;
    });
  }

  function _upsellOrderValueForRule(order, rule) {
    var ruleId = String(rule && rule.id || '');
    var explicitItems = _orderItems(order).filter(function (item) { return ruleId && String(item && item.upsellRuleId || '') === ruleId; });
    var items = explicitItems.length ? explicitItems : (_orderHasExplicitUpsellRule(order, rule) ? _orderItems(order).filter(function (item) {
      var ids = _upsellRuleProducts(rule).map(function (p) { return String(p.id); }).filter(Boolean);
      return ids.indexOf(_upsellItemProductId(item)) >= 0;
    }) : []);
    return items.reduce(function (sum, item) {
      var qty = _promoNumber(item && (item.qty != null ? item.qty : item.quantity != null ? item.quantity : 1)) || 1;
      var total = item && (item.total != null ? item.total : item.lineTotal != null ? item.lineTotal : item.price != null ? item.price * qty : 0);
      return sum + _promoNumber(total);
    }, 0);
  }

  function _upsellOrderQtyForRule(order, rule) {
    var ruleId = String(rule && rule.id || '');
    var ids = _upsellRuleProducts(rule).map(function (p) { return String(p.id); }).filter(Boolean);
    return _orderItems(order).reduce(function (sum, item) {
      var itemRule = String(item && item.upsellRuleId || '');
      var byRule = ruleId && itemRule === ruleId;
      var byProduct = !itemRule && ids.indexOf(_upsellItemProductId(item)) >= 0;
      return sum + (byRule || byProduct ? (_promoNumber(item && (item.qty != null ? item.qty : item.quantity != null ? item.quantity : 1)) || 1) : 0);
    }, 0);
  }

  function _upsellSalesStats(rule) {
    var perf = _upsellRulePerformance(rule);
    return {
      currentOrders: perf.conversoes,
      prevOrders: perf.prev.conversoes,
      currentRevenue: perf.receita,
      prevRevenue: perf.prev.revenue,
      currentItems: perf.adicionados,
      prevItems: perf.prev.carrinho,
      growth: perf.revenueDelta,
      clickRate: perf.clickRate,
      addRate: perf.addRate,
      convRate: perf.convRate,
      prevClickRate: perf.prevClickRate,
      prevAddRate: perf.prevAddRate,
      prevConvRate: perf.prevConvRate
    };
  }

  function _upsellSalesSummaryHtml(rule) {
    var sales = _upsellSalesStats(rule);
    var growth = sales.growth;
    var growthLabel = growth == null
      ? 'Sem base anterior'
      : (growth >= 0 ? '+' : '') + growth.toFixed(0) + '% vs. período anterior';
    var growthColor = growth == null ? '#8A7E7C' : growth >= 0 ? '#1A9E5A' : '#C4362A';
    var badgeBg = growth == null ? '#F2EDED' : growth >= 0 ? '#EDFAF3' : '#FFF0EE';
    return '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;">' +
      '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Pedidos</div>' +
        '<div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + sales.currentOrders + '</div>' +
        '<div style="font-size:11px;color:#8A7E7C;margin-top:3px;">' + sales.prevOrders + ' no período anterior</div>' +
      '</div>' +
      '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Faturamento</div>' +
        '<div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + UI.fmt(sales.currentRevenue) + '</div>' +
        '<div style="font-size:11px;color:#8A7E7C;margin-top:3px;">' + UI.fmt(sales.prevRevenue) + ' no período anterior</div>' +
      '</div>' +
      '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Itens</div>' +
        '<div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + sales.currentItems + '</div>' +
        '<div style="font-size:11px;color:#8A7E7C;margin-top:3px;">' + sales.prevItems + ' no período anterior</div>' +
      '</div>' +
      '<div style="background:' + badgeBg + ';border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Variação</div>' +
        '<div style="font-size:18px;font-weight:900;color:' + growthColor + ';margin-top:6px;">' + growthLabel + '</div>' +
        '<div style="font-size:11px;color:#8A7E7C;margin-top:3px;">Últimos 30 dias vs. 30 dias anteriores</div>' +
      '</div>' +
    '</div>';
  }

  function _upsellImpactSummary(rule) {
    var products = _upsellRuleProducts(rule);
    var totals = {
      original: 0,
      final: 0,
      discount: 0,
      cost: 0,
      profitBefore: 0,
      profitAfter: 0,
      costCount: 0,
      missingCost: 0
    };
    products.forEach(function (p) {
      var calc = _upsellBenefitCalcForProduct(p, rule);
      if (!calc) return;
      totals.original += calc.original;
      totals.final += calc.final;
      totals.discount += calc.discount;
      if (calc.cost > 0) {
        totals.cost += calc.cost;
        totals.costCount += 1;
        if (calc.profitBefore != null) totals.profitBefore += calc.profitBefore;
        if (calc.profitAfter != null) totals.profitAfter += calc.profitAfter;
      } else {
        totals.missingCost += 1;
      }
    });
    var marginBefore = totals.costCount > 0 && totals.original > 0 ? ((totals.original - totals.cost) / totals.original) * 100 : null;
    var marginAfter = totals.costCount > 0 && totals.final > 0 ? ((totals.final - totals.cost) / totals.final) * 100 : null;
    return {
      original: totals.original,
      final: totals.final,
      discount: totals.discount,
      cost: totals.cost,
      profitBefore: totals.costCount > 0 ? totals.profitBefore : null,
      profitAfter: totals.costCount > 0 ? totals.profitAfter : null,
      marginBefore: marginBefore,
      marginAfter: marginAfter,
      costCount: totals.costCount,
      missingCost: totals.missingCost,
      hasCost: totals.costCount > 0,
      productsCount: products.length
    };
  }

  function _upsellAnalysisStatus(rule, sales, impact) {
    var status = _upsellStatusInfo(rule).key;
    var minMargin = parseFloat(rule.minMarginPct || _moneyConfig.minMarginPct || 40) || 0;
    if (status === 'scheduled') return { key: 'scheduled', label: 'Agendada', text: 'Upsell agendado.', color: '#3B82F6' };
    if (status === 'paused') return { key: 'paused', label: 'Pausada', text: 'Upsell pausado.', color: '#D97706' };
    if (status === 'expired') return { key: 'expired', label: 'Expirada', text: 'Upsell expirado.', color: '#C4362A' };
    if (rule.benefitType === 'special_price') return { key: 'legacy', label: 'Regra legada', text: 'Regra legada: revise antes de ativar.', color: '#D97706' };
    if (!impact.productsCount) return { key: 'incomplete', label: 'Regra incompleta', text: 'Regra incompleta: revise antes de ativar.', color: '#D97706' };
    if (rule.benefitType === 'none') return { key: 'none', label: 'Sem benefício', text: 'Sem benefício: essa regra é apenas um upsell sem incentivo.', color: '#8A7E7C' };
    if (!impact.hasCost) return { key: 'incomplete', label: 'Regra incompleta', text: 'Custo não informado. Margem não calculada.', color: '#D97706' };
    if (impact.marginAfter != null && impact.marginAfter < minMargin) return { key: 'risk', label: 'Risco de prejuízo', text: 'Risco de prejuízo: não recomendado ativar.', color: '#C4362A' };
    if (impact.marginAfter != null && impact.marginAfter < minMargin + 5) return { key: 'tight', label: 'Margem apertada', text: 'Margem apertada: benefício reduz a margem. Revise.', color: '#D97706' };
    if (!sales.currentOrders && !sales.prevOrders) return { key: 'incomplete', label: 'Regra incompleta', text: 'Sem base suficiente para analisar vendas.', color: '#8A7E7C' };
    if (sales.growth != null && sales.growth < -10) return { key: 'weak', label: 'Benefício fraco', text: 'Benefício fraco: o cliente pode não perceber vantagem suficiente.', color: '#8A7E7C' };
    if (sales.growth != null && sales.growth >= 15 && sales.currentOrders >= 3) return { key: 'good', label: 'Bom upsell', text: 'Bom upsell: benefício atrativo e margem segura.', color: '#1A9E5A' };
    if (sales.currentOrders > 0) return { key: 'attention', label: 'Atenção', text: 'Atenção: revise margem ou configuração.', color: '#D97706' };
    return { key: 'attention', label: 'Atenção', text: 'Atenção: revise margem ou configuração.', color: '#D97706' };
  }

  function _upsellOrderImpactText(rule, impact) {
    if (rule.benefitType === 'cart_goal') {
      return rule.minCartValue > 0 ? ('Faltan ' + UI.fmt(Math.max(rule.minCartValue - _upsellCartSubtotal(), 0)) + ' para completar tu pedido.') : 'Completa tu pedido para ganhar o benefício.';
    }
    if (rule.benefitType === 'gift') return 'Añade y gana un regalo condicionado.';
    if (impact.productsCount <= 0) return 'Impacto estimado: selecione produtos do upsell';
    return 'Impacto estimado: +' + UI.fmt(Math.max(impact.final, 0)) + ' no pedido';
  }

  function _upsellBenefitLine(rule, impact) {
    if (rule.benefitType === 'none') return 'Recomendação simples';
    if (rule.benefitType === 'special_price' && impact.original > 0) return 'De ' + UI.fmt(impact.original) + ' por ' + UI.fmt(impact.final);
    if (rule.benefitType === 'pct' && impact.original > 0) return String(Math.round(rule.benefitValue || 0)) + '% de descuento';
    if (rule.benefitType === 'eur' && impact.original > 0) return 'Ahorra ' + UI.fmt(impact.discount);
    if (rule.benefitType === 'combo_fixed' && impact.original > 0) return 'De ' + UI.fmt(impact.original) + ' por ' + UI.fmt(impact.final);
    if (rule.benefitType === 'bundle_less_pay_more') {
      var qty = Math.max(2, parseInt(rule.bundleQty || rule.leveQtd || 2, 10) || 2);
      var pay = Math.max(1, parseInt(rule.bundlePay || rule.pagueQtd || qty - 1, 10) || Math.max(1, qty - 1));
      return 'Leve ' + qty + ', pague ' + pay;
    }
    if (rule.benefitType === 'gift') return 'Añade y gana un ' + (_upsellRuleProducts(rule)[0] ? _upsellRuleProducts(rule)[0].name : 'brinde');
    if (rule.benefitType === 'cart_goal' && rule.minCartValue > 0) return 'Faltan ' + UI.fmt(Math.max(rule.minCartValue - _upsellCartSubtotal(), 0)) + ' para ganar beneficio';
    return 'Sem benefício';
  }

  function _upsellSearchText(rule) {
    var sales = _upsellSalesStats(rule);
    var impact = _upsellImpactSummary(rule);
    var status = _upsellAnalysisStatus(rule, sales, impact);
    var tags = [rule.autoTag, rule.benefitTag, rule.tag, status.label].filter(Boolean).join(' ');
    var products = _upsellRuleProducts(rule).slice(0, 5).map(function (p) { return p.name || ''; }).join(' ');
    return [
      rule.name || '',
      rule.typeLabel || '',
      rule.benefitLabel || '',
      _upsellRuleTriggerText(rule) || '',
      rule.triggerCategory || '',
      products || '',
      rule.message || '',
      _upsellRuleLocationText(rule) || '',
      _upsellRulePeriodText(rule) || '',
      tags
    ].join(' ').toLowerCase();
  }

  function _upsellMatchesSearch(rule) {
    var q = String(_upsellUi.query || '').trim().toLowerCase();
    if (!q) return true;
    return _upsellSearchText(rule).indexOf(q) >= 0;
  }

  function _upsellMatchesStatus(rule) {
    var filter = _upsellUi.status || 'all';
    if (filter === 'all') return true;
    return _upsellStatusInfo(rule).key === filter;
  }

  function _upsellMatchesTypes(rule) {
    var list = Array.isArray(_upsellUi.types) ? _upsellUi.types.slice() : [];
    if (!list.length) return true;
    return list.indexOf(rule.type) >= 0;
  }

  function _upsellMatchesBenefits(rule) {
    var list = Array.isArray(_upsellUi.benefits) ? _upsellUi.benefits.slice() : [];
    if (!list.length) return true;
    return list.indexOf(rule.benefitType || 'none') >= 0;
  }

  function _upsellMatchesPeriod(rule) {
    var filter = _upsellUi.period || 'all';
    if (filter === 'all') return true;
    var now = Date.now();
    var start = _promoDateValue(rule.startDate || rule.startsAt);
    var end = _promoDateValue(rule.endDate || rule.endsAt);
    if (filter === 'today') {
      var startDay = _promoStartOfDay(now);
      var endDay = _promoEndOfDay(now);
      return (start && start >= startDay && start <= endDay) || (end && end >= startDay && end <= endDay);
    }
    if (filter === 'week') {
      return (start && start >= _promoStartOfWeek(now)) || (end && end >= _promoStartOfWeek(now));
    }
    if (filter === 'month') {
      return (start && start >= _promoStartOfMonth(now)) || (end && end >= _promoStartOfMonth(now));
    }
    if (filter === 'scheduled') return _upsellStatusInfo(rule).key === 'scheduled';
    if (filter === 'expired') return _upsellStatusInfo(rule).key === 'expired';
    if (filter === 'custom') {
      var rangeStart = _promoDateValue(_upsellUi.periodStart);
      var rangeEnd = _promoDateValue(_upsellUi.periodEnd);
      if (!rangeStart && !rangeEnd) return true;
      if (!rangeStart) rangeStart = 0;
      if (!rangeEnd) rangeEnd = now;
      if (rangeStart > rangeEnd) {
        var swap = rangeStart;
        rangeStart = rangeEnd;
        rangeEnd = swap;
      }
      var ruleStart = start || 0;
      var ruleEnd = end || now;
      return ruleEnd >= rangeStart && ruleStart <= rangeEnd;
    }
    return true;
  }

  function _upsellFilteredList() {
    return (_upsells || []).slice().sort(function (a, b) {
      return _promoDateValue(b.updatedAt || b.createdAt || b.startDate || 0) - _promoDateValue(a.updatedAt || a.createdAt || a.startDate || 0);
    }).filter(function (rule) {
      return _upsellMatchesSearch(rule) && _upsellMatchesStatus(rule) && _upsellMatchesTypes(rule) && _upsellMatchesBenefits(rule) && _upsellMatchesPeriod(rule);
    });
  }

  function _upsellPaging(list) {
    var total = (list || []).length;
    var pageSize = parseInt(_upsellUi.pageSize, 10) || 10;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(parseInt(_upsellUi.page, 10) || 1, 1), totalPages);
    _upsellUi.page = page;
    var startIdx = (page - 1) * pageSize;
    var endIdx = Math.min(startIdx + pageSize, total);
    return {
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? startIdx + 1 : 0,
      end: endIdx,
      items: (list || []).slice(startIdx, endIdx)
    };
  }

  function _upsellSummary(list) {
    var rules = list || _upsells || [];
    var active = 0;
    var scheduled = 0;
    var pausedExpired = 0;
    var productIds = {};
    rules.forEach(function (rule) {
      var st = _upsellStatusInfo(rule).key;
      if (st === 'active') active += 1;
      if (st === 'scheduled') scheduled += 1;
      if (st === 'paused' || st === 'expired') pausedExpired += 1;
      _upsellRuleProducts(rule).forEach(function (p) { productIds[String(p.id)] = true; });
      _upsellRule(rule).triggerProductIds.forEach(function (id) { productIds[String(id)] = true; });
    });
    return {
      active: active,
      products: Object.keys(productIds).length,
      scheduled: scheduled,
      pausedExpired: pausedExpired
    };
  }

  function _upsellSummaryHtml(summary) {
    summary = summary || _upsellSummary();
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:14px;">' +
      _marketingKpi('Upsells ativos', summary.active, 'trending_up', summary.active ? 'success' : 'neutral') +
      _marketingKpi('Produtos com upsell', summary.products, 'sell', summary.products ? 'product' : 'neutral') +
      _marketingKpi('Agendados', summary.scheduled, 'event', summary.scheduled ? 'info' : 'neutral') +
      _marketingKpi('Pausados/expirados', summary.pausedExpired, 'pause_circle', summary.pausedExpired ? 'danger' : 'neutral') +
    '</div>';
  }

  function _upsellPerfRange() {
    var period = _upsellPerfUi.period || 'last30';
    var now = Date.now();
    var day = 24 * 60 * 60 * 1000;
    var start = 0;
    var end = now;
    var prevStart = 0;
    var prevEnd = 0;
    var compare = true;
    var label = 'Últimos 30 dias';

    function startOfMonth(ts) {
      var d = new Date(ts || now);
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      return d.getTime();
    }
    function endOfMonth(ts) {
      var d = new Date(ts || now);
      d.setHours(23, 59, 59, 999);
      d.setMonth(d.getMonth() + 1, 0);
      return d.getTime();
    }
    function firstDayPrevMonth(ts) {
      var d = new Date(ts || now);
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      return d.getTime();
    }
    function lastDayPrevMonth(ts) {
      var d = new Date(ts || now);
      d.setHours(23, 59, 59, 999);
      d.setDate(0);
      return d.getTime();
    }

    if (period === 'today') {
      start = _promoStartOfDay(now);
      end = _promoEndOfDay(now);
      prevStart = _promoStartOfDay(now - day);
      prevEnd = _promoEndOfDay(now - day);
      label = 'Hoje';
    } else if (period === 'yesterday') {
      start = _promoStartOfDay(now - day);
      end = _promoEndOfDay(now - day);
      prevStart = _promoStartOfDay(now - (2 * day));
      prevEnd = _promoEndOfDay(now - (2 * day));
      label = 'Ontem';
    } else if (period === 'last7') {
      start = _promoStartOfDay(now - (6 * day));
      end = _promoEndOfDay(now);
      prevStart = _promoStartOfDay(now - (13 * day));
      prevEnd = _promoEndOfDay(now - (7 * day));
      label = 'Últimos 7 dias';
    } else if (period === 'last30') {
      start = _promoStartOfDay(now - (29 * day));
      end = _promoEndOfDay(now);
      prevStart = _promoStartOfDay(now - (59 * day));
      prevEnd = _promoEndOfDay(now - (30 * day));
      label = 'Últimos 30 dias';
    } else if (period === 'thismonth') {
      start = startOfMonth(now);
      end = _promoEndOfDay(now);
      prevStart = firstDayPrevMonth(now);
      prevEnd = lastDayPrevMonth(now);
      label = 'Este mês';
    } else if (period === 'lastmonth') {
      start = firstDayPrevMonth(now);
      end = lastDayPrevMonth(now);
      prevStart = startOfMonth(firstDayPrevMonth(now));
      prevEnd = lastDayPrevMonth(start);
      label = 'Mês passado';
    } else if (period === 'custom') {
      start = _promoDateValue(_upsellPerfUi.periodStart);
      end = _promoDateValue(_upsellPerfUi.periodEnd);
      label = 'Personalizado';
      if (!start && !end) {
        compare = false;
        start = 0;
        end = now;
      } else {
        if (!start) start = end;
        if (!end) end = start;
        if (start > end) {
          var swap = start;
          start = end;
          end = swap;
        }
        var span = Math.max(1, end - start);
        prevEnd = start - 1;
        prevStart = Math.max(0, prevEnd - span);
      }
    } else {
      compare = false;
      label = 'Todos';
    }

    return {
      key: period,
      label: label,
      start: start,
      end: end,
      prevStart: prevStart,
      prevEnd: prevEnd,
      compare: compare && prevEnd > prevStart
    };
  }

  function _upsellEventTs(ev) {
    if (!ev) return 0;
    if (typeof ev.timestamp === 'number' && isFinite(ev.timestamp)) return ev.timestamp;
    if (typeof ev.ts === 'number' && isFinite(ev.ts)) return ev.ts;
    if (ev.createdAt && typeof ev.createdAt.toDate === 'function') {
      try { return ev.createdAt.toDate().getTime(); } catch (e) {}
    }
    if (typeof ev.createdAt === 'number' && isFinite(ev.createdAt)) return ev.createdAt;
    return _promoDateValue(ev.createdAt || ev.date || ev.time || ev.when || 0);
  }

  function _upsellEventRuleId(ev) {
    return String(ev && (ev.ruleId || ev.upsellRuleId || ev.id || ev.rule || '') || '');
  }

  function _upsellEventLocation(ev) {
    return String(ev && (ev.location || ev.displayLocation || ev.place || ev.context || '') || '').toLowerCase();
  }

  function _upsellEventType(ev) {
    return String(ev && (ev.eventType || ev.type || ev.name || '') || '').toLowerCase();
  }

  function _upsellEventProductValue(ev) {
    return _promoNumber(ev && (ev.value != null ? ev.value : ev.finalPrice != null ? ev.finalPrice : ev.finalUpsellPrice != null ? ev.finalUpsellPrice : ev.productValue != null ? ev.productValue : ev.originalPrice != null ? ev.originalPrice : 0));
  }

  function _upsellOrderEventKey(source) {
    return String(source && (source.orderId || source.orderRef || source.orderNumber || source.publicOrderCode || source.pedido || source.id || '') || '').trim();
  }

  function _upsellEventMatchesRange(ev, range) {
    var ts = _upsellEventTs(ev);
    return ts >= (range && range.start || 0) && ts <= (range && range.end || Date.now());
  }

  function _upsellEventMatchesPrevRange(ev, range) {
    if (!range || !range.compare) return false;
    var ts = _upsellEventTs(ev);
    return ts >= range.prevStart && ts <= range.prevEnd;
  }

  function _upsellRulePerfBuckets(rule, range) {
    rule = _upsellRule(rule || {});
    range = range || _upsellPerfRange();
    var buckets = {
      current: { disparados: 0, clicados: 0, carrinho: 0, conversoes: 0, revenue: 0, margem: 0, margemCount: 0, products: {}, locations: {}, channels: {}, gatilhos: {}, clicksByLocation: {}, addByLocation: {}, convByLocation: {}, revenueByLocation: {}, marginByLocation: {} },
      prev: { disparados: 0, clicados: 0, carrinho: 0, conversoes: 0, revenue: 0, margem: 0, margemCount: 0, products: {}, locations: {}, channels: {}, gatilhos: {}, clicksByLocation: {}, addByLocation: {}, convByLocation: {}, revenueByLocation: {}, marginByLocation: {} }
    };
    var convertedOrderKeys = { current: {}, prev: {} };
    var hasUnkeyedConversion = { current: false, prev: false };

    function touch(bucket, ev) {
      var eventType = _upsellEventType(ev);
      var location = _upsellEventLocation(ev) || 'detail';
      var productId = String(ev && (ev.productId || ev.suggestedProductId || ev.product || ev.itemId || '') || '');
      var triggerId = String(ev && (ev.triggerProductId || ev.triggerId || ev.gatilhoId || '') || '');
      var channel = String(ev && (ev.channel || ev.canal || '') || '').toLowerCase();
      var value = _upsellEventProductValue(ev);
      var savings = _promoNumber(ev && (ev.savings != null ? ev.savings : ev.economy != null ? ev.economy : ev.benefitValue != null ? ev.benefitValue : 0));
      var margin = _promoNumber(ev && (ev.margin != null ? ev.margin : ev.marginValue != null ? ev.marginValue : 0));

      bucket.products[productId] = true;
      bucket.locations[location] = true;
      if (channel) bucket.channels[channel] = true;
      if (triggerId) bucket.gatilhos[triggerId] = true;

      if (eventType === 'upsell_disparado') {
        bucket.disparados += 1;
      } else if (eventType === 'upsell_clicado') {
        bucket.clicados += 1;
        bucket.clicksByLocation[location] = (bucket.clicksByLocation[location] || 0) + 1;
      } else if (eventType === 'upsell_adicionado_carrinho') {
        bucket.carrinho += 1;
        bucket.addByLocation[location] = (bucket.addByLocation[location] || 0) + 1;
      } else if (eventType === 'upsell_convertido') {
        bucket.conversoes += 1;
        bucket.revenue += value;
        bucket.convByLocation[location] = (bucket.convByLocation[location] || 0) + 1;
        bucket.revenueByLocation[location] = (bucket.revenueByLocation[location] || 0) + value;
        if (margin > 0) {
          bucket.margem += margin;
          bucket.margemCount += 1;
          bucket.marginByLocation[location] = (bucket.marginByLocation[location] || 0) + margin;
        } else if (savings > 0) {
          bucket.margem += savings;
        }
      }
    }

    (_events || []).forEach(function (ev) {
      if (_upsellEventRuleId(ev) !== String(rule.id || '')) return;
      if (_upsellEventMatchesRange(ev, range)) {
        touch(buckets.current, ev);
        if (_upsellEventType(ev) === 'upsell_convertido') {
          var currentKey = _upsellOrderEventKey(ev);
          if (currentKey) convertedOrderKeys.current[currentKey] = true;
          else hasUnkeyedConversion.current = true;
        }
      }
      if (_upsellEventMatchesPrevRange(ev, range)) {
        touch(buckets.prev, ev);
        if (_upsellEventType(ev) === 'upsell_convertido') {
          var prevKey = _upsellOrderEventKey(ev);
          if (prevKey) convertedOrderKeys.prev[prevKey] = true;
          else hasUnkeyedConversion.prev = true;
        }
      }
    });

    (_orders || []).forEach(function (order) {
      if (!_orderHasExplicitUpsellRule(order, rule)) return;
      var ts = _orderTs(order);
      var bucket = null;
      var bucketKey = '';
      if (ts >= (range && range.start || 0) && ts <= (range && range.end || Date.now())) {
        bucket = buckets.current;
        bucketKey = 'current';
      } else if (range && range.compare && ts >= range.prevStart && ts <= range.prevEnd) {
        bucket = buckets.prev;
        bucketKey = 'prev';
      }
      if (!bucket || !bucketKey) return;
      var orderKey = _upsellOrderEventKey(order);
      if (orderKey && convertedOrderKeys[bucketKey][orderKey]) return;
      if (!orderKey && hasUnkeyedConversion[bucketKey]) return;
      var orderValue = _upsellOrderValueForRule(order, rule);
      var qty = _upsellOrderQtyForRule(order, rule);
      bucket.conversoes += 1;
      bucket.carrinho += qty || 1;
      bucket.revenue += orderValue;
      bucket.convByLocation.order = (bucket.convByLocation.order || 0) + 1;
      bucket.revenueByLocation.order = (bucket.revenueByLocation.order || 0) + orderValue;
      _upsellRuleProducts(rule).forEach(function (p) { if (p && p.id) bucket.products[String(p.id)] = true; });
    });

    buckets.current.disparoSet = Object.keys(buckets.current.products).length;
    buckets.prev.disparoSet = Object.keys(buckets.prev.products).length;
    return buckets;
  }

  function _upsellRulePerformance(rule, range) {
    rule = _upsellRule(rule || {});
    range = range || _upsellPerfRange();
    var buckets = _upsellRulePerfBuckets(rule, range);
    var cur = buckets.current;
    var prev = buckets.prev;
    var disparos = cur.disparados;
    var cliques = cur.clicados;
    var adicionados = cur.carrinho;
    var conversoes = cur.conversoes;
    var receita = cur.revenue;
    var margem = cur.margem;
    var margemCount = cur.margemCount;
    var clickRate = disparos > 0 ? (cliques / disparos) * 100 : null;
    var addRate = disparos > 0 ? (adicionados / disparos) * 100 : null;
    var convRate = disparos > 0 ? (conversoes / disparos) * 100 : null;
    var prevClickRate = prev.disparados > 0 ? (prev.clicados / prev.disparados) * 100 : null;
    var prevAddRate = prev.disparados > 0 ? (prev.carrinho / prev.disparados) * 100 : null;
    var prevConvRate = prev.disparados > 0 ? (prev.conversoes / prev.disparados) * 100 : null;
    var revenueDelta = prev.revenue > 0 ? ((receita - prev.revenue) / prev.revenue) * 100 : null;
    var conversionDelta = prevConvRate != null && convRate != null ? convRate - prevConvRate : null;
    var bestLocation = Object.keys(cur.convByLocation).sort(function (a, b) { return cur.convByLocation[b] - cur.convByLocation[a]; })[0] || '';
    var bestChannel = Object.keys(cur.channels).sort(function (a, b) { return cur.channels[b] - cur.channels[a]; })[0] || '';
    var bestTrigger = Object.keys(cur.gatilhos).sort(function (a, b) { return cur.gatilhos[b] - cur.gatilhos[a]; })[0] || '';
    return {
      range: range,
      current: cur,
      prev: prev,
      disparos: disparos,
      cliques: cliques,
      adicionados: adicionados,
      conversoes: conversoes,
      receita: receita,
      margem: margem,
      margemCount: margemCount,
      clickRate: clickRate,
      addRate: addRate,
      convRate: convRate,
      prevClickRate: prevClickRate,
      prevAddRate: prevAddRate,
      prevConvRate: prevConvRate,
      revenueDelta: revenueDelta,
      conversionDelta: conversionDelta,
      bestLocation: bestLocation,
      bestChannel: bestChannel,
      bestTrigger: bestTrigger,
      hasPrevious: range.compare && (prev.disparados > 0 || prev.clicados > 0 || prev.carrinho > 0 || prev.conversoes > 0 || prev.revenue > 0)
    };
  }

  function _upsellPerfTrendText(current, previous) {
    if (previous == null || previous === 0 || current == null) return 'Sem dados anteriores';
    var delta = ((current - previous) / previous) * 100;
    if (!isFinite(delta)) return 'Sem dados anteriores';
    var prefix = delta >= 0 ? '+' : '';
    return prefix + delta.toFixed(0) + '% vs período anterior';
  }

  function _upsellPerfStatus(metric) {
    if (!metric) return { text: 'Sem dados suficientes', tone: '#8A7E7C', bg: '#F2EDED' };
    if (metric.disparos < 10 && metric.conversoes <= 0 && metric.receita <= 0) return { text: 'Sem dados suficientes', tone: '#8A7E7C', bg: '#F2EDED' };
    if (metric.conversoes === 0 && metric.cliques > 0) return { text: 'Clientes demonstram interesse, mas não finalizam com esse upsell.', tone: '#D97706', bg: '#FFF8E8' };
    if (metric.conversoes > 0 && metric.convRate != null && metric.convRate < 6) return { text: 'Baixa conversão', tone: '#D97706', bg: '#FFF8E8' };
    if (metric.conversoes > 0 && metric.disparos <= 0) return { text: 'Vendas registradas. Eventos de exibição ainda não estão completos.', tone: '#1A9E5A', bg: '#EDFAF3' };
    if (metric.margem > 0 && metric.convRate != null && metric.convRate >= 10) return { text: 'Bom desempenho', tone: '#1A9E5A', bg: '#EDFAF3' };
    if (metric.margemCount > 0 && metric.margem < (metric.receita * 0.15)) return { text: 'Margem baixa', tone: '#C4362A', bg: '#FFF0EE' };
    return { text: 'Bom desempenho', tone: '#1A9E5A', bg: '#EDFAF3' };
  }

  function _upsellPerformanceSummary(list) {
    var rules = list || _upsells || [];
    var totals = {
      disparos: 0,
      cliques: 0,
      adicionados: 0,
      conversoes: 0,
      receita: 0,
      margem: 0,
      margemCount: 0,
      prev: { disparados: 0, clicados: 0, carrinho: 0, conversoes: 0, revenue: 0, margem: 0 },
      locations: {},
      channels: {},
      gatilhos: {}
    };
    var best = null;
    rules.forEach(function (rule) {
      var perf = _upsellRulePerformance(rule);
      totals.disparos += perf.disparos;
      totals.cliques += perf.cliques;
      totals.adicionados += perf.adicionados;
      totals.conversoes += perf.conversoes;
      totals.receita += perf.receita;
      totals.margem += perf.margem;
      totals.margemCount += perf.margemCount;
      totals.prev.disparados += perf.prev.disparados || 0;
      totals.prev.clicados += perf.prev.clicados || 0;
      totals.prev.carrinho += perf.prev.carrinho || 0;
      totals.prev.conversoes += perf.prev.conversoes || 0;
      totals.prev.revenue += perf.prev.revenue || 0;
      totals.prev.margem += perf.prev.margem || 0;
      Object.keys((perf.current && perf.current.convByLocation) || {}).forEach(function (key) { totals.locations[key] = (totals.locations[key] || 0) + perf.current.convByLocation[key]; });
      Object.keys((perf.current && perf.current.channels) || {}).forEach(function (key) { totals.channels[key] = (totals.channels[key] || 0) + perf.current.channels[key]; });
      Object.keys((perf.current && perf.current.gatilhos) || {}).forEach(function (key) { totals.gatilhos[key] = (totals.gatilhos[key] || 0) + perf.current.gatilhos[key]; });
      if (!best || perf.conversoes > best.conversoes || (perf.conversoes === best.conversoes && perf.convRate != null && (best.convRate == null || perf.convRate > best.convRate))) {
        best = {
          id: rule.id,
          name: rule.name || 'Upsell',
          typeLabel: rule.typeLabel || _upsellTypeInfo(rule.type).label,
          conversoes: perf.conversoes,
          convRate: perf.convRate,
          revenue: perf.receita,
          rule: rule
        };
      }
    });
    totals.convRate = totals.disparos > 0 ? (totals.conversoes / totals.disparos) * 100 : null;
    totals.prevConvRate = totals.prev.disparados > 0 ? (totals.prev.conversoes / totals.prev.disparados) * 100 : null;
    totals.marginRate = totals.receita > 0 ? (totals.margem / totals.receita) * 100 : null;
    totals.best = best;
    totals.bestLocation = Object.keys(totals.locations).sort(function (a, b) { return totals.locations[b] - totals.locations[a]; })[0] || '';
    totals.bestChannel = Object.keys(totals.channels).sort(function (a, b) { return totals.channels[b] - totals.channels[a]; })[0] || '';
    totals.bestTrigger = Object.keys(totals.gatilhos).sort(function (a, b) { return totals.gatilhos[b] - totals.gatilhos[a]; })[0] || '';
    totals.alert = _upsellPerfStatus(totals);
    return totals;
  }

  function _upsellMetricDeltaHtml(current, previous) {
    if (previous == null || previous === 0 || current == null) return '<div style="font-size:11px;color:#8A7E7C;margin-top:4px;">Sem dados anteriores</div>';
    var delta = ((current - previous) / previous) * 100;
    if (!isFinite(delta)) return '<div style="font-size:11px;color:#8A7E7C;margin-top:4px;">Sem dados anteriores</div>';
    var color = delta >= 0 ? '#1A9E5A' : '#C4362A';
    return '<div style="font-size:11px;font-weight:700;color:' + color + ';margin-top:4px;">' + (delta >= 0 ? '+' : '') + delta.toFixed(0) + '% vs período anterior</div>';
  }

  function _upsellPerformanceCard(title, value, sub, current, previous, tone, extra) {
    var c = _marketingTone(tone || 'neutral');
    return '<div style="background:#FAF8F4;border:none;border-radius:16px;padding:16px 18px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:118px;">' +
      '<div style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.2;">' + _esc(title) + '</div>' +
      '<div style="font-size:30px;font-weight:700;color:#1F1F1F;line-height:1;margin-top:8px;word-break:break-word;">' + _esc(value) + '</div>' +
      '<div style="font-size:12px;color:#6F6860;margin-top:6px;line-height:1.45;">' + _esc(sub) + '</div>' +
      _upsellMetricDeltaHtml(current, previous) +
      (extra ? '<div style="font-size:11px;font-weight:600;color:' + c.color + ';margin-top:6px;">' + _esc(extra) + '</div>' : '') +
    '</div>';
  }

  function _upsellPerformanceSectionHtml() {
    var range = _upsellPerfRange();
    var perf = _upsellPerformanceSummary(_upsells);
    var inputStyle = _marketingInputStyle();
    var labelStyle = _marketingLabelStyle() + 'margin-bottom:4px;';
    function cleanBestName(name) {
      var value = String(name || '').replace(/\s+/g, ' ').trim();
      var normalized = value.toLowerCase().normalize ? value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : value.toLowerCase();
      if (!value || normalized === 'upsell' || normalized === 'sugestion' || normalized === 'sugestao' || normalized === 'sugestio n') return '';
      return value;
    }
    var bestName = cleanBestName(perf.best && perf.best.name);
    var hasBestUpsell = !!(perf.best && perf.best.conversoes > 0 && bestName);
    var bestUpsell = hasBestUpsell ? bestName : 'Sem dados suficientes';
    var bestUpsellSub = hasBestUpsell ? ((perf.best.conversoes || 0) + ' pedidos finalizados') : 'Continue exibindo upsells para gerar histórico';
    var bestLocation = perf.bestLocation ? _upsellLocationLabel(perf.bestLocation) : 'Sem dados suficientes';
    var bestTriggerProduct = perf.bestTrigger ? ((_products || []).find(function (p) { return String(p.id) === String(perf.bestTrigger); }) || null) : null;
    var bestTrigger = bestTriggerProduct ? (bestTriggerProduct.name || 'Produto') : (perf.bestTrigger || 'Sem dados suficientes');
    function passageRate(next, current) {
      if (!(current > 0)) return '—';
      return Math.max(0, (next / current) * 100).toFixed(0).replace('.', ',') + '%';
    }
    function catalogAccent(tone) {
      if (tone === 'category') return '#A18362';
      if (tone === 'visible') return '#6C8777';
      if (tone === 'accent') return '#B42318';
      if (tone === 'product') return '#8A6F5A';
      return '#6F6860';
    }
    function mainKpi(label, value, icon, tone, compact) {
      var color = catalogAccent(tone || 'neutral');
      return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\'">' +
        '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + color + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'analytics') + '</span></div>' +
        '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
          '<span style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
          '<strong style="font-size:' + (compact ? '30px' : '34px') + ';font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;letter-spacing:0;">' + _esc(value) + '</strong>' +
        '</div>' +
      '</div>';
    }
    function funnelStep(value, label, index) {
      return '<div style="position:relative;z-index:1;flex:1;min-width:150px;text-align:center;">' +
        '<div style="width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid #EAE4DA;color:#1F1F1F;box-shadow:0 8px 20px rgba(31,31,31,.06);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:12px;font-weight:700;">' + index + '</div>' +
        '<div style="font-size:24px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;">' + _esc(value) + '</div>' +
        '<div style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.25;margin-top:6px;min-height:30px;">' + _esc(label) + '</div>' +
      '</div>';
    }
    function funnelRate(label) {
      return '<div style="position:relative;z-index:2;align-self:flex-start;margin-top:8px;flex:0 0 64px;text-align:center;">' +
        '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:50px;min-height:22px;padding:0 8px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:11px;font-weight:600;box-shadow:0 6px 16px rgba(31,31,31,.04);">' + _esc(label) + '</span>' +
      '</div>';
    }
    function resultCard(title, value, sub, icon, tone) {
      var color = catalogAccent(tone || 'neutral');
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:106px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\'">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
          '<span style="width:34px;height:34px;border-radius:12px;background:#FAF8F4;color:' + color + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:20px;">' + _esc(icon || 'insights') + '</span></span>' +
          '<span style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.2;">' + _esc(title) + '</span>' +
        '</div>' +
        '<div style="font-size:17px;font-weight:700;color:#1F1F1F;line-height:1.25;overflow-wrap:normal;word-break:normal;">' + _esc(value) + '</div>' +
        '<div style="font-size:12px;color:#756F67;line-height:1.4;margin-top:5px;">' + _esc(sub || '') + '</div>' +
      '</div>';
    }
    function insightText() {
      if (perf.disparos < 10 && perf.conversoes <= 0 && perf.receita <= 0) return 'Ainda não há dados suficientes para recomendações inteligentes. Continue exibindo upsells para gerar histórico.';
      if (perf.disparos <= 0 && perf.conversoes > 0) return 'Há pedidos com upsell registrados. Para completar a leitura do funil, acompanhe também exibições e cliques quando esses eventos estiverem disponíveis.';
      if (perf.convRate != null && perf.convRate >= 10) return 'O funil está convertendo bem. Priorize os upsells com melhor resposta e mantenha o acompanhamento por período.';
      if (perf.cliques > 0 && perf.conversoes === 0) return 'Há interesse nos upsells, mas ainda sem pedidos finalizados. Revise benefício, preço e momento de exibição.';
      if (perf.adicionados > 0 && perf.conversoes === 0) return 'Clientes adicionam upsells ao carrinho, mas não finalizam. Avalie preço final, frete e clareza do benefício.';
      if (perf.bestLocation) return 'O melhor local de exibição até agora é ' + _upsellLocationLabel(perf.bestLocation) + '. Use esse sinal para priorizar novas regras.';
      return 'Continue exibindo upsells para gerar histórico e identificar padrões de aceitação.';
    }
    var html = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div style="min-width:0;">' +
          '<div style="font-size:13px;color:#6F6860;line-height:1.45;">' + _esc(range.label) + '</div>' +
        '</div>' +
        '<label style="' + labelStyle + '"><span style="display:block;margin-bottom:4px;">Período</span><select onchange="Modules.Marketing._setUpsellPerfPeriod(this.value)" style="min-width:180px;' + _marketingSelectStyle() + '"><option value="today"' + (range.key === 'today' ? ' selected' : '') + '>Hoje</option><option value="yesterday"' + (range.key === 'yesterday' ? ' selected' : '') + '>Ontem</option><option value="last7"' + (range.key === 'last7' ? ' selected' : '') + '>Últimos 7 dias</option><option value="last30"' + (range.key === 'last30' ? ' selected' : '') + '>Últimos 30 dias</option><option value="thismonth"' + (range.key === 'thismonth' ? ' selected' : '') + '>Este mês</option><option value="lastmonth"' + (range.key === 'lastmonth' ? ' selected' : '') + '>Mês passado</option><option value="custom"' + (range.key === 'custom' ? ' selected' : '') + '>Personalizado</option></select></label>' +
      '</div>' +
      (range.key === 'custom'
        ? '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px;">' +
            '<label style="' + labelStyle + '"><span style="display:block;margin-bottom:4px;">Data inicial</span><input type="date" value="' + _esc(_upsellPerfUi.periodStart || '') + '" onchange="Modules.Marketing._setUpsellPerfStart(this.value)" style="' + inputStyle + '"></label>' +
            '<label style="' + labelStyle + '"><span style="display:block;margin-bottom:4px;">Data final</span><input type="date" value="' + _esc(_upsellPerfUi.periodEnd || '') + '" onchange="Modules.Marketing._setUpsellPerfEnd(this.value)" style="' + inputStyle + '"></label>' +
          '</div>'
        : '') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
        mainKpi('Upsells exibidos', perf.disparos, 'visibility', 'product') +
        mainKpi('Cliques', perf.cliques, 'touch_app', 'category') +
        mainKpi('Adicionados ao carrinho', perf.adicionados, 'add_shopping_cart', 'visible') +
        mainKpi('Receita extra', UI.fmt(perf.receita), 'payments', 'accent', true) +
      '</div>' +
      '<div style="' + _marketingCardStyle() + 'padding:16px 18px;">' +
        _marketingSectionTitle('Funil do upsell', 'Acompanhe a evolução dos upsells até o pedido finalizado.') +
        '<div style="position:relative;display:flex;align-items:flex-start;gap:10px;flex-wrap:nowrap;overflow:auto;padding:8px 2px 2px;">' +
          '<div style="position:absolute;left:7%;right:7%;top:25px;height:2px;background:linear-gradient(90deg,#8A6F5A 0%,#A18362 35%,#6C8777 70%,#B42318 100%);opacity:.28;border-radius:999px;"></div>' +
          funnelStep(perf.disparos, 'Exibidos', 1) + funnelRate(passageRate(perf.cliques, perf.disparos)) +
          funnelStep(perf.cliques, 'Cliques', 2) + funnelRate(passageRate(perf.adicionados, perf.cliques)) +
          funnelStep(perf.adicionados, 'Adicionados ao carrinho', 3) + funnelRate(passageRate(perf.conversoes, perf.adicionados)) +
          funnelStep(perf.conversoes, 'Pedidos finalizados', 4) +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">' +
        resultCard('Melhor upsell', bestUpsell, bestUpsellSub, 'emoji_events', hasBestUpsell ? 'visible' : 'neutral') +
        resultCard('Melhor local de exibição', bestLocation, perf.bestLocation ? 'Local com maior conversão' : 'Sem histórico suficiente', 'place', perf.bestLocation ? 'product' : 'neutral') +
        resultCard('Melhor gatilho', bestTrigger, perf.bestTrigger ? 'Gatilho com melhor resposta' : 'Sem histórico suficiente', 'bolt', perf.bestTrigger ? 'category' : 'neutral') +
      '</div>' +
      '<div style="' + _marketingCardStyle() + 'padding:16px 18px;">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<div style="width:40px;height:40px;border-radius:14px;background:#FAF8F4;color:#8A6F5A;display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:22px;">tips_and_updates</span></div>' +
          '<div style="min-width:0;">' +
            '<div style="font-size:14px;font-weight:600;color:#1F1F1F;margin-bottom:4px;">Alertas e oportunidades</div>' +
            '<div style="font-size:13px;color:#6F6860;line-height:1.5;">' + _esc(insightText()) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
    return html;
  }

  function _upsellToggleArrayFilter(key, value, checked) {
    var list = Array.isArray(_upsellUi[key]) ? _upsellUi[key].slice() : [];
    if (String(value) === 'all') {
      _upsellUi[key] = [];
      _upsellUi.page = 1;
      _paintUpsell();
      return;
    }
    if (checked) {
      list = list.filter(function (x) { return String(x) !== 'all'; });
      if (list.indexOf(value) < 0) list.push(value);
    } else {
      list = list.filter(function (x) { return String(x) !== String(value); });
    }
    _upsellUi[key] = list;
    _upsellUi.page = 1;
    _paintUpsell();
  }

  function _setUpsellSearch(value) { _upsellUi.query = value || ''; _upsellUi.page = 1; _paintUpsell(); }
  function _setUpsellStatus(value) { _upsellUi.status = value || 'all'; _upsellUi.page = 1; _paintUpsell(); }
  function _setUpsellPeriod(value) { _upsellUi.period = value || 'all'; _upsellUi.page = 1; _paintUpsell(); }
  function _setUpsellPeriodStart(value) { _upsellUi.periodStart = value || ''; _upsellUi.page = 1; _paintUpsell(); }
  function _setUpsellPeriodEnd(value) { _upsellUi.periodEnd = value || ''; _upsellUi.page = 1; _paintUpsell(); }
  function _setUpsellPage(page) { _upsellUi.page = parseInt(page, 10) || 1; _paintUpsell(); }
  function _setUpsellPageSize(size) { _upsellUi.pageSize = parseInt(size, 10) || 10; _upsellUi.page = 1; _paintUpsell(); }
  function _setUpsellPerfPeriod(value) { _upsellPerfUi.period = value || 'last30'; _paintUpsell(); }
  function _setUpsellPerfStart(value) { _upsellPerfUi.periodStart = value || ''; _paintUpsell(); }
  function _setUpsellPerfEnd(value) { _upsellPerfUi.periodEnd = value || ''; _paintUpsell(); }
  function _setUpsellTab(value) {
    _upsellTab = value === 'sugestoes' ? 'sugestoes' : 'desempenho';
    _paintUpsell();
  }
  function _clearUpsellFilters() {
    _upsellUi.query = '';
    _upsellUi.status = 'all';
    _upsellUi.types = [];
    _upsellUi.benefits = [];
    _upsellUi.period = 'all';
    _upsellUi.periodStart = '';
    _upsellUi.periodEnd = '';
    _upsellUi.productQuery = '';
    _upsellUi.page = 1;
    _paintUpsell();
  }

  function _upsellSubtabsHtml() {
    function tab(key, label, icon) {
      var active = _upsellTab === key;
      return '<button onclick="Modules.Marketing._setUpsellTab(\'' + key + '\')" style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:none;border-radius:999px;background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#6F6860') + ';font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:' + (active ? '0 10px 24px rgba(180,35,24,.18)' : 'inset 0 0 0 1px #EAE4DA') + ';transition:background .15s ease,color .15s ease,box-shadow .15s ease;">' +
        '<span class="mi" style="font-size:17px;">' + _esc(icon) + '</span>' +
        _esc(label) +
      '</button>';
    }
    return '<div style="display:inline-flex;align-items:center;gap:6px;background:#FAF8F4;border-radius:999px;padding:4px;box-shadow:inset 0 0 0 1px #EAE4DA;width:max-content;max-width:100%;overflow:auto;">' +
      tab('desempenho', 'Desempenho', 'monitoring') +
      tab('sugestoes', 'Upsells', 'format_list_bulleted') +
    '</div>';
  }

  function _upsellToolbarHtml() {
    var customHtml = _upsellUi.period === 'custom'
      ? '<div style="grid-column:1 / -1;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,220px));gap:10px;align-items:end;">' +
          '<label style="' + _marketingLabelStyle() + '">Data inicial<input type="date" value="' + _esc(_upsellUi.periodStart || '') + '" onchange="Modules.Marketing._setUpsellPeriodStart(this.value)" style="' + _marketingInputStyle() + 'height:40px;margin-top:5px;background:#FFFCF8;"></label>' +
          '<label style="' + _marketingLabelStyle() + '">Data final<input type="date" value="' + _esc(_upsellUi.periodEnd || '') + '" onchange="Modules.Marketing._setUpsellPeriodEnd(this.value)" style="' + _marketingInputStyle() + 'height:40px;margin-top:5px;background:#FFFCF8;"></label>' +
        '</div>'
      : '';
    var hasFilters = !!(_upsellUi.query || _upsellUi.status !== 'all' || _upsellUi.period !== 'all' || _upsellUi.periodStart || _upsellUi.periodEnd || (_upsellUi.types || []).length || (_upsellUi.benefits || []).length);
    var clearHtml = hasFilters
      ? '<div style="grid-column:1 / -1;display:flex;justify-content:flex-start;"><button type="button" onclick="Modules.Marketing._clearUpsellFilters()" style="height:36px;padding:0 13px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>'
      : '';
    return '<div style="' + _marketingCardStyle() + 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px 18px;box-shadow:0 10px 24px rgba(31,31,31,.055);">' +
      '<div style="display:grid;grid-template-columns:minmax(260px,1.35fr) minmax(150px,180px) minmax(160px,190px);gap:10px;align-items:end;">' +
        '<label style="' + _marketingLabelStyle() + '">Buscar<input id="ups-search" type="search" value="' + _esc(_upsellUi.query || '') + '" oninput="Modules.Marketing._setUpsellSearch(this.value)" placeholder="Nome, produto, benefício ou tag" autocomplete="off" autocapitalize="off" spellcheck="false" style="' + _marketingInputStyle() + 'height:40px;margin-top:5px;background:#FFFCF8;"></label>' +
        '<label style="' + _marketingLabelStyle() + '">Status<select onchange="Modules.Marketing._setUpsellStatus(this.value)" style="' + _marketingSelectStyle() + 'height:40px;margin-top:5px;background-color:#FFFCF8;"><option value="all"' + (_upsellUi.status === 'all' ? ' selected' : '') + '>Todas</option><option value="active"' + (_upsellUi.status === 'active' ? ' selected' : '') + '>Ativas</option><option value="scheduled"' + (_upsellUi.status === 'scheduled' ? ' selected' : '') + '>Agendadas</option><option value="paused"' + (_upsellUi.status === 'paused' ? ' selected' : '') + '>Pausadas</option><option value="expired"' + (_upsellUi.status === 'expired' ? ' selected' : '') + '>Expiradas</option></select></label>' +
        '<label style="' + _marketingLabelStyle() + '">Período<select onchange="Modules.Marketing._setUpsellPeriod(this.value)" style="' + _marketingSelectStyle() + 'height:40px;margin-top:5px;background-color:#FFFCF8;"><option value="all"' + (_upsellUi.period === 'all' ? ' selected' : '') + '>Todos</option><option value="today"' + (_upsellUi.period === 'today' ? ' selected' : '') + '>Hoje</option><option value="week"' + (_upsellUi.period === 'week' ? ' selected' : '') + '>Esta semana</option><option value="month"' + (_upsellUi.period === 'month' ? ' selected' : '') + '>Este mês</option><option value="scheduled"' + (_upsellUi.period === 'scheduled' ? ' selected' : '') + '>Agendadas</option><option value="expired"' + (_upsellUi.period === 'expired' ? ' selected' : '') + '>Expiradas</option><option value="custom"' + (_upsellUi.period === 'custom' ? ' selected' : '') + '>Personalizado</option></select></label>' +
        customHtml +
        clearHtml +
      '</div>' +
    '</div>';
  }

  function _upsellBenefitFieldsHtml(rule) {
    rule = _upsellRule(rule || {});
    var type = String(window._upsellType || rule.type || '').trim();
    var current = typeof window._upsellBenefit === 'string' ? String(window._upsellBenefit).trim() : String(rule.benefitType || '').trim();
    var allowed = _upsellBenefitOptionsForType(type);
    var legacyBenefit = rule.benefitType === 'special_price';
    var invalidBenefit = !!current && allowed.indexOf(current) < 0;
    if (current === 'special_price' || invalidBenefit) current = '';
    var selected = Array.prototype.slice.call(document.querySelectorAll('.ups-prod-check:checked')).map(function (i) {
      return (_products || []).find(function (p) { return String(p.id) === String(i.dataset.id); }) || null;
    }).filter(Boolean);
    if (!selected.length) selected = _upsellRuleProducts(rule);
    var ref = selected[0] || null;
    var selectedBenefit = current;
    var refCalc = ref ? _upsellBenefitCalcForProduct(ref, Object.assign({}, rule, { type: type, benefitType: selectedBenefit || rule.benefitType })) : null;
    var hasType = !!type;
    function section(title, key, content, note, isWide) {
      var active = hasType && current === key;
      var visible = active;
      return '<div data-ups-benefit-section="' + key + '" style="grid-column:' + (isWide ? '1 / -1' : 'auto') + ';display:' + (visible ? 'block' : 'none') + ';background:#fff;border:1px solid #C4362A;border-radius:12px;padding:12px 14px;">' +
        '<div style="margin-bottom:10px;">' +
          '<div style="font-size:11px;font-weight:900;color:#C4362A;text-transform:uppercase;">' + _esc(title) + '</div>' +
          '<div style="font-size:12px;color:#8A7E7C;line-height:1.45;margin-top:4px;">' + _esc(note || '') + '</div>' +
        '</div>' +
        content(false, active) +
      '</div>';
    }
    var html = [];
    if (legacyBenefit) {
      html.push('<div style="grid-column:1 / -1;background:#FFF8E8;border:1px solid #F2D9A6;border-radius:12px;padding:12px 14px;font-size:12px;color:#8A7E7C;line-height:1.5;">Regra legada detectada. Escolha outro benefício para salvar ou ativar este upsell.</div>');
    }
    if (invalidBenefit || (current && !allowed.length)) {
      html.push('<div style="grid-column:1 / -1;background:#FFF0EE;border:1px solid #F5C2B7;border-radius:12px;padding:12px 14px;font-size:12px;color:#C4362A;line-height:1.5;">Benefício incompatível com o tipo de upsell selecionado.</div>');
    }
    if (!hasType) {
      html.push('<div style="grid-column:1 / -1;background:#F2EDED;border:1px dashed #D4C8C6;border-radius:12px;padding:12px 14px;font-size:12px;color:#8A7E7C;line-height:1.5;">Selecione primeiro o tipo de upsell.</div>');
    }
    html.push(
      section('Sem benefício', 'none', function (locked) {
        return '<div style="font-size:12px;line-height:1.5;color:#8A7E7C;">Essa regra será apenas uma recomendação simples, sem incentivo para o cliente.</div>' +
          '<div style="margin-top:10px;">' +
            '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Mensagem ao cliente</label>' +
            '<input id="ups-msg-none" type="text" value="' + _esc(rule.message || 'También te puede gustar') + '" ' + (locked ? 'disabled' : '') + ' placeholder="También te puede gustar" style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;">' +
          '</div>';
      }, _upsellBenefitHelpText('none'), true)
    );
    html.push(
      section('Desconto em %', 'pct', function (locked) {
        return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Percentual de desconto</label><input id="ups-benefit-value" type="text" inputmode="decimal" value="' + (rule.benefitValue || '') + '" placeholder="Ex: 10" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Mensagem ao cliente</label><input id="ups-msg-pct" type="text" value="' + _esc(rule.message || 'También te puede gustar') + '" placeholder="También te puede gustar" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
        '</div>';
      }, _upsellBenefitHelpText('pct'))
    );
    html.push(
      section('Desconto em €', 'eur', function (locked) {
        return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Valor do desconto</label><div style="display:flex;align-items:center;width:100%;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';overflow:hidden;"><span style="width:38px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;color:#6F6860;font-size:13px;border-right:1px solid #E8DCD7;background:#FFFCF8;">€</span><input id="ups-benefit-value" type="text" inputmode="decimal" value="' + (rule.benefitValue || '') + '" placeholder="Ex: 0,50" ' + (locked ? 'disabled' : '') + ' style="width:100%;min-width:0;padding:10px 12px;border:0;background:transparent;font-size:13px;font-family:inherit;outline:none;"></div></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Mensagem ao cliente</label><input id="ups-msg-eur" type="text" value="' + _esc(rule.message || 'También te puede gustar') + '" placeholder="También te puede gustar" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
        '</div>';
      }, _upsellBenefitHelpText('eur'))
    );
    html.push(
      section('Combo com preço fechado', 'combo_fixed', function (locked) {
        var totalNormal = selected.length ? selected.reduce(function (sum, p) { return sum + _promoBasePrice(p); }, 0) : 0;
        return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Preço fechado do combo</label><input id="ups-final-price" type="text" inputmode="decimal" value="' + (rule.finalUpsellPrice || '') + '" placeholder="Ex: 6,90" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Mensagem ao cliente</label><input id="ups-msg-combo" type="text" value="' + _esc(rule.message || 'También te puede gustar') + '" placeholder="También te puede gustar" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
        '</div>' +
        '<div style="margin-top:10px;background:#fff;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;font-size:12px;color:#1A1A1A;line-height:1.55;">' +
          '<div><strong>Total normal dos produtos:</strong> ' + (selected.length ? UI.fmt(totalNormal) : 'Selecione produtos do upsell') + '</div>' +
          '<div><strong>Preço final:</strong> ' + (rule.finalUpsellPrice > 0 ? UI.fmt(rule.finalUpsellPrice) : '—') + '</div>' +
          '<div><strong>Diferença do combo:</strong> ' + (selected.length && rule.finalUpsellPrice > 0 ? UI.fmt(Math.max(totalNormal - _promoNumber(rule.finalUpsellPrice || 0), 0)) : '—') + '</div>' +
          '<div style="margin-top:4px;color:#8A7E7C;">Produtos oferecidos juntos com preço fechado.</div>' +
        '</div>';
      }, _upsellBenefitHelpText('combo_fixed'))
    );
    html.push(
      section('Leve mais pagando menos', 'bundle_less_pay_more', function (locked) {
        return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Quantidade adicional</label><input id="ups-bundle-qty" type="number" step="1" min="1" value="' + (rule.bundleQty || rule.leveQtd || '') + '" placeholder="Ex: 3" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Preço especial da quantidade adicional</label><input id="ups-bundle-pay" type="number" step="1" min="1" value="' + (rule.bundlePay || rule.pagueQtd || '') + '" placeholder="Ex: 2" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
        '</div>' +
        '<div style="margin-top:10px;background:#fff;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;font-size:12px;color:#1A1A1A;line-height:1.55;">' +
          '<div style="color:#8A7E7C;">' + _esc(_upsellBenefitHelpText('bundle_less_pay_more')) + '</div>' +
          '<div style="margin-top:4px;color:#8A7E7C;">Exemplo: Leve 3, pague 2.</div>' +
        '</div>';
      }, _upsellBenefitHelpText('bundle_less_pay_more'))
    );
    html.push(
      section('Brinde condicionado', 'gift', function (locked) {
        var giftKind = String(rule.giftConditionType || rule.giftCondition || 'trigger').trim() || 'trigger';
        var giftQty = parseInt(rule.giftQty || rule.giftQuantity || 0, 10) || 0;
        var giftMin = _promoNumber(rule.giftMinCartValue || rule.giftMinValue || 0);
        return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Produto brinde</label><select id="ups-gift-product" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"><option value="">—</option>' + _products.map(function (p) { return '<option value="' + _esc(String(p.id)) + '"' + (String(rule.giftProductId || '') === String(p.id) ? ' selected' : '') + '>' + _esc(p.name || 'Produto') + '</option>'; }).join('') + '</select></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Condição para liberar o brinde</label><select id="ups-gift-condition-type" onchange="Modules.Marketing._syncUpsellBenefitDetails()" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;">' +
            '<option value="trigger"' + (giftKind === 'trigger' ? ' selected' : '') + '>Ao comprar o produto gatilho</option>' +
            '<option value="selected"' + (giftKind === 'selected' ? ' selected' : '') + '>Ao levar o produto sugerido</option>' +
            '<option value="qty"' + (giftKind === 'qty' ? ' selected' : '') + '>Ao comprar quantidade mínima</option>' +
            '<option value="mincart"' + (giftKind === 'mincart' ? ' selected' : '') + '>Ao atingir valor mínimo</option>' +
          '</select></div>' +
          '<div data-ups-gift-extra="qty" style="display:' + (giftKind === 'qty' ? 'block' : 'none') + ';"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Quantidade mínima</label><input id="ups-gift-qty" type="number" min="1" step="1" value="' + giftQty + '" placeholder="Ex: 2" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div data-ups-gift-extra="mincart" style="display:' + (giftKind === 'mincart' ? 'block' : 'none') + ';"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Valor mínimo do carrinho</label><input id="ups-gift-min-cart" type="text" inputmode="decimal" value="' + (giftMin || '') + '" placeholder="Ex: 20,00" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div data-ups-gift-extra="note" style="grid-column:1 / -1;background:#fff;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;font-size:12px;color:#1A1A1A;line-height:1.55;">' +
            '<div style="color:#8A7E7C;">' + _esc(_upsellBenefitHelpText('gift')) + '</div>' +
          '</div>' +
        '</div>';
      }, _upsellBenefitHelpText('gift'))
    );
    html.push(
      section('Completar valor para ganhar benefício', 'cart_goal', function (locked) {
        var cartKind = String(rule.cartGoalBenefitType || rule.cartGoalBenefit || 'frete').trim() || 'frete';
        var cartValue = _promoNumber(rule.cartGoalBenefitValue || rule.benefitValue || 0);
        return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Valor mínimo do carrinho</label><input id="ups-cart-min" type="text" inputmode="decimal" value="' + (rule.minCartValue || '') + '" placeholder="Ex: 20,00" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Benefício concedido</label><select id="ups-cart-benefit" onchange="Modules.Marketing._syncUpsellBenefitDetails()" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;">' +
            '<option value="frete"' + (cartKind === 'frete' ? ' selected' : '') + '>Frete grátis</option>' +
            '<option value="pct"' + (cartKind === 'pct' ? ' selected' : '') + '>Desconto em %</option>' +
            '<option value="eur"' + (cartKind === 'eur' ? ' selected' : '') + '>Desconto em €</option>' +
            '<option value="gift"' + (cartKind === 'gift' ? ' selected' : '') + '>Brinde</option>' +
          '</select></div>' +
          '<div data-ups-cart-extra="value" style="display:' + ((cartKind === 'pct' || cartKind === 'eur') ? 'block' : 'none') + ';"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Valor do benefício</label><input id="ups-cart-benefit-value" type="text" inputmode="decimal" value="' + (cartValue || '') + '" placeholder="' + (cartKind === 'pct' ? 'Ex: 10' : 'Ex: 0,50') + '" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div data-ups-cart-extra="gift" style="display:' + (cartKind === 'gift' ? 'block' : 'none') + ';"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Produto brinde</label><select id="ups-cart-gift-product" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"><option value="">—</option>' + _products.map(function (p) { return '<option value="' + _esc(String(p.id)) + '"' + (String(rule.cartGoalGiftProductId || '') === String(p.id) ? ' selected' : '') + '>' + _esc(p.name || 'Produto') + '</option>'; }).join('') + '</select></div>' +
          '<div style="grid-column:1 / -1;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Mensagem exibida ao cliente</label><input id="ups-cart-message" type="text" value="' + _esc(rule.cartGoalMessage || rule.message || 'También te puede gustar') + '" placeholder="También te puede gustar" ' + (locked ? 'disabled' : '') + ' style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:' + (locked ? '#F7F4F4' : '#fff') + ';font-size:13px;font-family:inherit;outline:none;"></div>' +
          '<div style="grid-column:1 / -1;background:#fff;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;font-size:12px;color:#1A1A1A;line-height:1.55;">' +
            '<div style="color:#8A7E7C;">' + _esc(_upsellBenefitHelpText('cart_goal')) + '</div>' +
          '</div>' +
        '</div>';
      }, _upsellBenefitHelpText('cart_goal'))
    );
    html.push('<div id="ups-benefit-reference" style="grid-column:1 / -1;">' + _upsellBenefitReferenceHtml(rule, selected, current) + '</div>');
    return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">' + html.join('') + '</div>';
  }

  function _upsellStatusInfo(rule) {
    var now = Date.now();
    var start = _promoDateValue(rule && (rule.startDate || rule.startsAt));
    var end = _promoDateValue(rule && (rule.endDate || rule.endsAt));
    if (start && start > now) return { key: 'scheduled', label: 'Agendada', color: '#3B82F6', bg: '#EEF4FF' };
    if (end && end < now) return { key: 'expired', label: 'Expirada', color: '#C4362A', bg: '#FFF0EE' };
    if (rule && rule.active === false) return { key: 'paused', label: 'Pausada', color: '#D97706', bg: '#FFF8E8' };
    return { key: 'active', label: 'Ativa', color: '#1A9E5A', bg: '#EDFAF3' };
  }

  function _upsellRule(rule) {
    rule = rule || {};
    var typeInfo = _upsellTypeInfo(rule.type || rule.upsellType || 'complemento');
    var benefitInfo = _upsellBenefitInfo(rule.benefitType || rule.benefit || 'none');
    var productIds = [];
    if (Array.isArray(rule.productIds) && rule.productIds.length) productIds = productIds.concat(rule.productIds);
    if (!productIds.length && rule.productId != null && rule.productId !== '') productIds.push(rule.productId);
    if (!productIds.length && Array.isArray(rule.suggestedProductIds) && rule.suggestedProductIds.length) productIds = productIds.concat(rule.suggestedProductIds);
    if (!productIds.length && Array.isArray(rule.suggestedIds) && rule.suggestedIds.length) productIds = productIds.concat(rule.suggestedIds);
    productIds = productIds.map(String).filter(Boolean);
    var seen = {};
    productIds = productIds.filter(function (id) { if (seen[id]) return false; seen[id] = true; return true; });
    var triggerProductIds = [];
    if (rule.triggerProductId != null && rule.triggerProductId !== '') triggerProductIds.push(String(rule.triggerProductId));
    if (Array.isArray(rule.triggerProductIds)) triggerProductIds = triggerProductIds.concat(rule.triggerProductIds.map(String));
    var channels = Array.isArray(rule.channels) ? rule.channels : String(rule.channelsText || rule.channel || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var locations = Array.isArray(rule.locations) ? rule.locations : String(rule.displayLocations || rule.locationsText || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    locations = _upsellLocationsNormalize(locations);
    var displayMoment = String(rule.displayMoment || rule.moment || rule.showMoment || '').trim().toLowerCase();
    if (displayMoment !== 'whatsapp') displayMoment = locations.indexOf('cart') >= 0 ? 'whatsapp' : 'trigger';
    var message = String(rule.message || rule.customerMessage || '').trim() || 'También te puede gustar';
    return {
      raw: rule,
      id: rule.id,
      name: String(rule.name || rule.title || 'Upsell').trim(),
      type: typeInfo.key,
      typeLabel: typeInfo.label,
      typeDesc: typeInfo.desc,
      typeExample: typeInfo.example,
      tag: typeInfo.tag,
      tagLabel: typeInfo.tag,
      tone: typeInfo.tone,
      benefitType: benefitInfo.key,
      benefitLabel: benefitInfo.label,
      benefitDesc: benefitInfo.desc,
      benefitExample: benefitInfo.example,
      benefitTag: benefitInfo.tag,
      active: rule.active !== false,
      status: rule.status || '',
      triggerProductIds: triggerProductIds,
      triggerCategory: String(rule.triggerCategory || rule.trigger_category || rule.categoryTrigger || '').trim(),
      productIds: productIds,
      locations: locations,
      displayMoment: displayMoment,
      message: message,
      startDate: rule.startDate || rule.startsAt || '',
      endDate: rule.endDate || rule.endsAt || '',
      priority: parseInt(rule.priority || 0, 10) || 0,
      displayLimit: parseInt(rule.displayLimit || rule.limit || 0, 10) || 0,
      minMarginPct: parseFloat(rule.minMarginPct || rule.marginMinPct || 0) || 0,
      benefitValue: parseFloat(rule.benefitValue || rule.discountValue || rule.value || 0) || 0,
      specialPrice: rule.specialPrice != null ? _promoNumber(rule.specialPrice) : (rule.fixedPrice != null ? _promoNumber(rule.fixedPrice) : 0),
      originalPrice: rule.originalPrice != null ? _promoNumber(rule.originalPrice) : 0,
      finalUpsellPrice: rule.finalUpsellPrice != null ? _promoNumber(rule.finalUpsellPrice) : 0,
      giftProductId: rule.giftProductId || rule.giftId || '',
      giftCondition: String(rule.giftCondition || rule.giftConditionText || '').trim(),
      minCartValue: parseFloat(rule.minCartValue || rule.cartMinValue || rule.cartMin || 0) || 0,
      cartGoalBenefit: String(rule.cartGoalBenefit || rule.cartBenefit || '').trim(),
      cartGoalMessage: String(rule.cartGoalMessage || rule.message || '').trim(),
      benefitContextOnly: rule.benefitContextOnly !== false,
      promotionId: rule.promotionId || rule.promoId || '',
      autoTag: rule.autoTag || typeInfo.tag,
      triggerLabel: String(rule.triggerLabel || '').trim(),
      extraProducts: productIds.slice(1)
    };
  }

  function _upsellRuleProducts(rule) {
    rule = _upsellRule(rule);
    return rule.productIds.map(function (id) { return (_products || []).find(function (p) { return String(p.id) === String(id); }); }).filter(Boolean);
  }

  function _upsellBenefitCalcForProduct(product, rule) {
    rule = _upsellRule(rule);
    var original = _promoBasePrice(product);
    if (!(original > 0)) return null;
    var cost = _promoCostForProduct(product);
    var benefit = _upsellBenefitInfo(rule.benefitType || 'none');
    var final = original;
    var discount = 0;
    var note = benefit.example || '';

    if (benefit.key === 'special_price') {
      final = rule.specialPrice > 0 ? rule.specialPrice : original;
      discount = Math.max(original - final, 0);
    } else if (benefit.key === 'pct') {
      discount = original * (Math.max(rule.benefitValue || 0, 0) / 100);
      final = Math.max(original - discount, 0);
    } else if (benefit.key === 'eur') {
      discount = Math.max(rule.benefitValue || 0, 0);
      final = Math.max(original - discount, 0);
    } else if (benefit.key === 'combo_fixed') {
      var comboProducts = _upsellRuleProducts(rule);
      var comboTotal = comboProducts.reduce(function (sum, p) { return sum + _promoBasePrice(p); }, 0);
      if (comboTotal > 0 && rule.finalUpsellPrice > 0) {
        var comboRatio = rule.finalUpsellPrice / comboTotal;
        final = Math.max(original * comboRatio, 0);
        discount = Math.max(original - final, 0);
      } else {
        final = rule.finalUpsellPrice > 0 ? rule.finalUpsellPrice : original;
        discount = Math.max(original - final, 0);
      }
    } else if (benefit.key === 'bundle_less_pay_more') {
      var qty = Math.max(2, parseInt(rule.bundleQty || rule.leveQtd || 2, 10) || 2);
      var pay = Math.max(1, parseInt(rule.bundlePay || rule.pagueQtd || qty - 1, 10) || (qty - 1));
      if (qty > pay) {
        final = Math.max((original * pay) / qty, 0);
        discount = Math.max(original - final, 0);
        note = 'Leve ' + qty + ', pague ' + pay;
      }
    } else if (benefit.key === 'gift' || benefit.key === 'cart_goal' || benefit.key === 'none') {
      final = original;
      discount = 0;
    }

    var profitBefore = cost > 0 ? Math.max(original - cost, 0) : null;
    var profitAfter = cost > 0 ? Math.max(final - cost, 0) : null;
    var marginBefore = cost > 0 ? ((original - cost) / original) * 100 : null;
    var marginAfter = cost > 0 && final > 0 ? ((final - cost) / final) * 100 : null;
    return {
      original: original,
      final: Math.max(final, 0),
      discount: Math.max(discount, 0),
      cost: cost,
      profitBefore: profitBefore,
      profitAfter: profitAfter,
      marginBefore: marginBefore,
      marginAfter: marginAfter,
      note: note,
      benefit: benefit
    };
  }

  function _upsellRuleActive(rule) {
    return _upsellStatusInfo(rule).key === 'active';
  }

  function _upsellRuleChannelOk(rule, context) {
    var channels = (rule.channels || []).map(function (s) { return String(s).toLowerCase(); });
    if (!channels.length) return true;
    var current = String(context || 'site').toLowerCase();
    if (current === 'detail' || current === 'product') current = 'site';
    if (current === 'checkout') current = 'checkout';
    if (current === 'cart') current = 'carrinho';
    return channels.indexOf(current) >= 0 || channels.indexOf('todos') >= 0 || channels.indexOf('all') >= 0;
  }

  function _upsellRuleLocationOk(rule, context) {
    var locations = _upsellLocationsNormalize(rule.locations || []);
    if (!locations.length) return true;
    var current = _upsellLocationKey(context || 'detail');
    return locations.indexOf(current) >= 0 || locations.indexOf('todos') >= 0 || locations.indexOf('all') >= 0;
  }

  function _upsellRuleMatchesTrigger(rule, context, triggerProduct) {
    if (!rule) return false;
    var active = _upsellRuleActive(rule);
    if (!active) return false;
    if (!_upsellRuleChannelOk(rule, context)) return false;
    if (!_upsellRuleLocationOk(rule, context)) return false;
    var st = _upsellStatusInfo(rule).key;
    if (st === 'scheduled' || st === 'expired' || st === 'paused') return false;
    if (rule.triggerProductIds && rule.triggerProductIds.length) {
      if (!triggerProduct) return false;
      if (rule.triggerProductIds.indexOf(String(triggerProduct.id)) < 0) return false;
    }
    if (rule.triggerCategory && triggerProduct) {
      var c = String(triggerProduct.category || triggerProduct.categoryId || '').toLowerCase();
      if (c !== String(rule.triggerCategory).toLowerCase()) return false;
    }
    return true;
  }

  function _upsellRuleImpact(rule) {
    var products = _upsellRuleProducts(rule);
    if (!products.length) return { text: 'Regra incompleta: revise antes de ativar.', color: '#D97706' };
    if (rule.benefitType === 'none') return { text: 'Sem benefício: essa regra é apenas um upsell sem incentivo.', color: '#8A7E7C' };
    var minMargin = parseFloat(rule.minMarginPct || _moneyConfig.minMarginPct || 40) || 0;
    var risky = false;
    var attention = false;
    var incomplete = false;
    products.forEach(function (p) {
      var calc = _upsellBenefitCalcForProduct(p, rule);
      if (!calc || !(calc.original > 0)) { incomplete = true; return; }
      if (calc.cost > 0 && calc.final > 0) {
        var margin = calc.marginAfter;
        if (minMargin > 0 && margin < minMargin) risky = true;
        else if (minMargin > 0 && margin < minMargin + 5) attention = true;
      }
    });
    if (incomplete) return { text: 'Regra incompleta: revise antes de ativar.', color: '#D97706' };
    if (risky) return { text: 'Risco: esse upsell pode reduzir demais a margem.', color: '#C4362A' };
    if (attention) return { text: 'Atenção: revise margem ou configuração.', color: '#D97706' };
    return { text: 'Bom upsell: benefício atrativo e margem segura.', color: '#1A9E5A' };
  }

  function _upsellRuleEstimate(rule) {
    var products = _upsellRuleProducts(rule);
    if (!products.length) return '';
    var sum = products.reduce(function (acc, p) {
      var calc = _upsellBenefitCalcForProduct(p, rule);
      var price = calc ? calc.final : _promoBasePrice(p);
      var cost = calc ? calc.cost : _promoCostForProduct(p);
      acc.total += price;
      acc.cost += cost > 0 ? cost : 0;
      return acc;
    }, { total: 0, cost: 0 });
    var profit = sum.cost > 0 ? Math.max(sum.total - sum.cost, 0) : null;
    return profit != null ? '+ ' + UI.fmt(profit) + ' no pedido' : 'Impacto estimado: depende do produto';
  }

  function _upsellRuleTriggerText(rule) {
    var parts = [];
    if (rule.triggerLabel) parts.push(rule.triggerLabel);
    else if (rule.triggerProductIds && rule.triggerProductIds.length) {
      parts.push(rule.triggerProductIds.map(function (id) { var p = (_products || []).find(function (x) { return String(x.id) === String(id); }); return p ? p.name : ''; }).filter(Boolean).join(' · '));
    }
    if (!parts.length) parts.push('Carrinho');
    return parts.join(' · ');
  }

  function _upsellRuleLocationText(rule) {
    return _upsellLocationLabels(rule.locations || []);
  }

  function _upsellRuleMomentText(rule) {
    rule = _upsellRule(rule || {});
    return rule.displayMoment === 'whatsapp' ? 'Ao clicar em enviar pelo WhatsApp' : 'Ao acionar o gatilho';
  }

  function _upsellRulePeriodText(rule) {
    var s = rule.startDate ? UI.fmtDate(new Date(rule.startDate)) : '—';
    var e = rule.endDate ? UI.fmtDate(new Date(rule.endDate)) : '—';
    return s + ' → ' + e;
  }

  function _upsellTableChip(text, tone) {
    var c = _marketingTone(tone || 'neutral');
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:' + c.bg + ';border:1px solid ' + c.border + ';color:' + c.color + ';font-size:12px;font-weight:600;white-space:nowrap;">' + _esc(text) + '</span>';
  }

  function _upsellTypeTone(type) {
    type = String(type || '').toLowerCase();
    if (type === 'complemento') return 'success';
    if (type === 'upgrade') return 'info';
    if (type === 'combo_sugerido') return 'product';
    if (type === 'carrinho') return 'warning';
    if (type === 'valor_minimo') return 'danger';
    return 'neutral';
  }

  function _upsellBenefitTone(type) {
    type = String(type || '').toLowerCase();
    if (type === 'none') return 'neutral';
    if (type === 'gift') return 'success';
    if (type === 'frete' || type === 'cart_goal') return 'info';
    if (type === 'combo_fixed' || type === 'bundle_less_pay_more') return 'product';
    return 'warning';
  }

  function _upsellDisplayName(rule) {
    var value = String(rule && (rule.name || rule.title || '') || '').replace(/\s+/g, ' ').trim();
    var normalized = value.toLowerCase().normalize ? value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : value.toLowerCase();
    if (!value || normalized === 'upsell' || normalized === 'sugestion' || normalized === 'sugestao' || normalized === 'sugestio n') return 'Sem nome';
    return value;
  }

  function _upsellTableRowHtml(raw) {
    var rule = _upsellRule(raw);
    var status = _upsellStatusInfo(rule);
    var products = _upsellRuleProducts(rule);
    var trigger = _upsellRuleTriggerText(rule);
    var suggested = products.length ? products.slice(0, 2).map(function (p) { return p.name || 'Produto'; }).join(' · ') + (products.length > 2 ? ' +' + (products.length - 2) : '') : '—';
    var statusTone = status.key === 'active' ? 'success' : (status.key === 'scheduled' ? 'info' : (status.key === 'paused' ? 'warning' : 'danger'));
    var benefit = rule.benefitLabel || 'Sem benefício';
    var impact = _upsellRuleImpact(rule);
    return '<tr onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="background:#fff;cursor:pointer;transition:background .15s ease;border-bottom:1px solid #EAE4DA;" onclick="Modules.Marketing._openUpsellModal(\'' + _esc(String(rule.id)) + '\', \'view\')">' +
      _marketingTd('<div style="min-width:220px;"><div style="font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.3;">' + _esc(_upsellDisplayName(rule)) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:3px;">Gatilho: ' + _esc(trigger) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.4;">Upsell: ' + _esc(suggested) + '</div></div>') +
      _marketingTd(_upsellTableChip(rule.typeLabel || 'Upsell', _upsellTypeTone(rule.type))) +
      _marketingTd(_upsellTableChip(benefit, _upsellBenefitTone(rule.benefitType))) +
      _marketingTd(_upsellTableChip(status.label, statusTone)) +
      _marketingTd('<div style="font-size:13px;color:#1F1F1F;white-space:nowrap;">' + _esc(_upsellRulePeriodText(rule)) + '</div><div style="font-size:11px;font-weight:600;color:' + impact.color + ';line-height:1.35;margin-top:4px;">' + _esc(impact.text) + '</div>') +
      _marketingTd('<div style="font-size:13px;font-weight:600;color:#1F1F1F;text-align:center;">' + products.length + '</div>', 'center') +
      _marketingTd('<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">' +
        '<button title="Visualizar" onclick="event.stopPropagation();Modules.Marketing._openUpsellModal(\'' + _esc(String(rule.id)) + '\', \'view\')" style="width:32px;height:32px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:18px;">visibility</span></button>' +
        '<button title="Editar" onclick="event.stopPropagation();Modules.Marketing._openUpsellModal(\'' + _esc(String(rule.id)) + '\', \'edit\')" style="width:32px;height:32px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:18px;">edit</span></button>' +
        '<button title="' + (status.key === 'active' ? 'Pausar' : 'Ativar') + '" onclick="event.stopPropagation();Modules.Marketing._toggleUpsellStatus(\'' + _esc(String(rule.id)) + '\')" style="width:32px;height:32px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:' + (status.key === 'active' ? '#D97706' : '#1F6F43') + ';display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:18px;">' + (status.key === 'active' ? 'pause' : 'play_arrow') + '</span></button>' +
        '<button title="Duplicar" onclick="event.stopPropagation();Modules.Marketing._duplicateUpsell(\'' + _esc(String(rule.id)) + '\')" style="width:32px;height:32px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:18px;">content_copy</span></button>' +
        '<button title="Excluir" onclick="event.stopPropagation();Modules.Marketing._deleteUpsell(\'' + _esc(String(rule.id)) + '\')" style="width:32px;height:32px;border:1px solid #F8D1CC;border-radius:10px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><span class="mi" style="font-size:18px;">delete</span></button>' +
      '</div>', 'right') +
    '</tr>';
  }

  function _upsellCardHtml(raw) {
    var rule = _upsellRule(raw);
    var status = _upsellStatusInfo(rule);
    var perf = _upsellRulePerformance(rule);
    var sales = _upsellSalesStats(rule);
    var impact = _upsellImpactSummary(rule);
    var quality = _upsellAnalysisStatus(rule, sales, impact);
    var perfAlert = _upsellPerfStatus(perf);
    var products = _upsellRuleProducts(rule);
    var trigger = _upsellRuleTriggerText(rule);
    var productText = products.length ? products.slice(0, 2).map(function (p) { return p.name; }).join(' · ') + (products.length > 2 ? ' +' + (products.length - 2) : '') : '—';
    var benefitText = rule.benefitLabel || 'Sem benefício';
    var benefitLine = _upsellBenefitLine(rule, impact);
    var alert = quality.text;
    var analysisTone = quality.color;
    var periodText = _upsellRulePeriodText(rule);
    var salesGrowth = sales.growth == null ? 'Sem base anterior' : (sales.growth >= 0 ? '+' : '') + sales.growth.toFixed(0) + '% vs. 30 dias anteriores';
    var marginText = impact.hasCost && impact.marginAfter != null ? impact.marginAfter.toFixed(1).replace('.', ',') + '%' : '—';
    var impactText = _upsellOrderImpactText(rule, impact);
    var savingsText = impact.discount > 0 ? UI.fmt(impact.discount) : '—';
    var priceLine = impact.productsCount ? ('De ' + UI.fmt(impact.original) + ' por ' + UI.fmt(impact.final)) : '—';
    return '<div class="upsell-card" onclick="Modules.Marketing._openUpsellModal(\'' + _esc(String(rule.id)) + '\', \'view\')" style="display:flex;gap:14px;align-items:flex-start;background:#fff;border:1px solid #EEE6E4;border-radius:16px;padding:14px 16px;box-shadow:0 2px 8px rgba(0,0,0,.05);cursor:pointer;">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:15px;font-weight:800;color:#1A1A1A;line-height:1.25;">' + _esc(rule.name) + '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">' +
              '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:' + status.bg + ';color:' + status.color + ';">' + _esc(status.label) + '</span>' +
              '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:#EEF4FF;color:#3B82F6;">' + _esc(rule.typeLabel) + '</span>' +
              '<span style="font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;background:#FFF0EE;color:#C4362A;">' + _esc(benefitText) + '</span>' +
            '</div>' +
            '<div style="margin-top:8px;font-size:12px;font-weight:800;color:' + analysisTone + ';line-height:1.45;">' + _esc(alert) + '</div>' +
            '<div style="margin-top:4px;font-size:12px;color:#8A7E7C;line-height:1.45;">' + _esc(sales.currentOrders > 0 ? ('Vendas vinculadas: ' + sales.currentOrders + ' pedidos · ' + sales.currentItems + ' itens · ' + salesGrowth) : 'Sem base suficiente para analisar vendas.') + '</div>' +
          '</div>' +
          '<div style="text-align:right;min-width:150px;">' +
            '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Benefício</div>' +
            '<div style="font-size:13px;font-weight:800;color:#1A1A1A;">' + _esc(rule.benefitLabel || 'Sem benefício') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:12px;">' +
          '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:10px 12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Disparos</div><div style="font-size:18px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + perf.disparos + '</div><div style="font-size:11px;color:#8A7E7C;">' + _esc(_upsellPerfTrendText(perf.disparos, perf.prev.disparados)) + '</div></div>' +
          '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:10px 12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Cliques</div><div style="font-size:18px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + perf.cliques + '</div><div style="font-size:11px;color:#8A7E7C;">' + _esc(_upsellPerfTrendText(perf.cliques, perf.prev.clicados)) + '</div></div>' +
          '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:10px 12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Carrinho</div><div style="font-size:18px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + perf.adicionados + '</div><div style="font-size:11px;color:#8A7E7C;">' + _esc(_upsellPerfTrendText(perf.adicionados, perf.prev.carrinho)) + '</div></div>' +
          '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:10px 12px;"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Conversões</div><div style="font-size:18px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + perf.conversoes + '</div><div style="font-size:11px;color:#8A7E7C;">' + _esc(_upsellPerfTrendText(perf.conversoes, perf.prev.conversoes)) + '</div></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:10px;padding:10px 12px;border-radius:12px;background:' + perfAlert.bg + ';border:1px solid #EEE6E4;">' +
          '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Status do upsell</div>' +
          '<div style="font-size:13px;font-weight:800;color:' + perfAlert.tone + ';">' + _esc(perfAlert.text) + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px;">' +
          '<div><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Período</div><div style="font-size:12px;font-weight:700;color:#1A1A1A;">' + _esc(periodText) + '</div></div>' +
          '<div><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Gatilho</div><div style="font-size:12px;font-weight:700;color:#1A1A1A;">' + _esc(trigger) + '</div></div>' +
          '<div><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Upsell</div><div style="font-size:12px;font-weight:700;color:#1A1A1A;">' + _esc(productText) + '</div></div>' +
          '<div><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Preço / benefício</div><div style="font-size:12px;font-weight:700;color:#1A1A1A;">' + _esc(benefitLine) + '</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px;">' +
          '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
            '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Impacto estimado</div>' +
            '<div style="font-size:13px;font-weight:800;color:#1A1A1A;margin-top:4px;">' + _esc(impactText) + '</div>' +
          '</div>' +
          '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
            '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Cliente economiza</div>' +
            '<div style="font-size:13px;font-weight:800;color:#1A1A1A;margin-top:4px;">' + _esc(savingsText) + '</div>' +
          '</div>' +
          '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
            '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Margem após benefício</div>' +
            '<div style="font-size:13px;font-weight:800;color:#1A1A1A;margin-top:4px;">' + _esc(marginText) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;min-width:180px;">' +
        '<button onclick="event.stopPropagation();Modules.Marketing._openUpsellModal(\'' + _esc(String(rule.id)) + '\', \'view\')" style="padding:7px 12px;border:none;border-radius:12px;background:#F2EDED;color:#1A1A1A;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Ver detalhes</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._openUpsellModal(\'' + _esc(String(rule.id)) + '\', \'edit\')" style="padding:7px 12px;border:none;border-radius:12px;background:#EEF4FF;color:#3B82F6;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Editar</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._toggleUpsellStatus(\'' + _esc(String(rule.id)) + '\')" style="padding:7px 12px;border:none;border-radius:12px;background:' + (status.key === 'active' ? '#FFF8E8' : '#EDFAF3') + ';color:' + (status.key === 'active' ? '#D97706' : '#1A9E5A') + ';font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">' + (status.key === 'active' ? 'Pausar' : 'Ativar') + '</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._duplicateUpsell(\'' + _esc(String(rule.id)) + '\')" style="padding:7px 12px;border:none;border-radius:12px;background:#F2EDED;color:#8A7E7C;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Duplicar</button>' +
        '<button onclick="event.stopPropagation();Modules.Marketing._deleteUpsell(\'' + _esc(String(rule.id)) + '\')" style="padding:7px 12px;border:none;border-radius:12px;background:#FFF0EE;color:#C4362A;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Excluir</button>' +
      '</div>' +
    '</div>';
  }

  function _upsellEmptyStateHtml() {
    var hasAny = (_upsells || []).length > 0;
    return '<div style="' + _marketingCardStyle() + 'text-align:center;padding:32px 24px;">' +
      '<div style="width:52px;height:52px;border-radius:16px;background:#FAF8F4;color:#6F6860;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;"><span class="mi" style="font-size:28px;">trending_up</span></div>' +
      '<div style="font-size:18px;font-weight:600;color:#1F1F1F;margin-bottom:6px;">' + (hasAny ? 'Nenhum upsell encontrado' : 'Nenhum upsell criado ainda') + '</div>' +
      '<div style="font-size:13px;color:#6F6860;line-height:1.5;margin:0 auto 18px;max-width:430px;">' + (hasAny ? 'Ajuste busca, status ou período para ver outras regras.' : 'Crie upsells com benefício para aumentar o valor médio dos pedidos.') + '</div>' +
      (hasAny ? '<button onclick="Modules.Marketing._clearUpsellFilters()" style="background:#fff;color:#1F1F1F;border:1px solid #EAE4DA;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Limpar filtros</button>' : '<button onclick="Modules.Marketing._openUpsellModal(null, \'edit\')" style="background:#C4362A;color:#fff;border:none;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Criar upsell</button>') +
    '</div>';
  }

  function _upsellSuggestionsMetricsHtml(summary) {
    summary = summary || _upsellSummary(_upsells);
    var metrics = [
      { label: 'Total de upsells', value: (_upsells || []).length, icon: 'inventory_2', color: '#8A6F5A' },
      { label: 'Upsells ativos', value: summary.active || 0, icon: 'visibility', color: '#6C8777' },
      { label: 'Agendados', value: summary.scheduled || 0, icon: 'event', color: '#A18362' },
      { label: 'Pausados/expirados', value: summary.pausedExpired || 0, icon: 'pause_circle', color: '#B42318' }
    ];
    return '<div class="growth-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' + metrics.map(function (m) {
      return '<div class="kpi-tile" style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:18px 18px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="width:54px;height:54px;border-radius:16px;background:transparent;color:' + m.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="mi" style="font-size:28px;">' + _esc(m.icon) + '</span></div>' +
        '<div style="min-width:0;display:flex;flex-direction:column;gap:2px;">' +
          '<span style="display:block;font-size:13px;font-weight:500;color:#6F6860;line-height:1.1;">' + _esc(m.label) + '</span>' +
          '<strong style="display:block;font-family:inherit;font-size:38px;font-weight:700;color:#1F1F1F;line-height:1;">' + _esc(String(m.value)) + '</strong>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _renderUpsell() {
    Promise.all([DB.getAll('upsellRules'), _loadMarketingProducts(), DB.getDocRoot('config', 'dinheiro'), _safeGetAll('orders'), _safeGetAll('upsellEvents')]).then(function (r) {
      try {
        _upsells = (r[0] || []).map(_upsellRule);
        _products = Array.isArray(r[1]) ? r[1] : [];
        _moneyConfig = _normalizeMoneyConfig(r[2] || {});
        _orders = Array.isArray(r[3]) ? r[3] : [];
        _events = Array.isArray(r[4]) ? r[4] : [];
        _paintUpsell();
      } catch (err) {
        console.error('[Marketing] _renderUpsell paint failed', err);
        _upsells = Array.isArray(r[0]) ? r[0].map(_upsellRule) : [];
        _products = Array.isArray(r[1]) ? r[1] : [];
        _moneyConfig = _normalizeMoneyConfig(r[2] || {});
        _orders = Array.isArray(r[3]) ? r[3] : [];
        _events = Array.isArray(r[4]) ? r[4] : [];
        _paintUpsell();
      }
    }).catch(function (err) {
      console.error('[Marketing] _renderUpsell failed', err);
      _upsells = [];
      _products = [];
      _orders = [];
      _events = [];
      _moneyConfig = _normalizeMoneyConfig({});
      _paintUpsell();
    });
  }

  function _paintUpsell() {
    var content = document.getElementById('marketing-content');
    if (!content) return;
    try {
      var filtered = _upsellFilteredList();
      var paging = _upsellPaging(filtered);
      var summary = _upsellSummary(_upsells);
      var perfHtml = '';
      var toolbarHtml = '';
      var tableHtml = '';
      var suggestionsHtml = '';
      var activeContent = '';
      var pageSizeOptions = [10, 12, 24, 48].map(function (n) {
        return '<option value="' + n + '"' + (Number(_upsellUi.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
      }).join('');
      var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
        '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<select onchange="Modules.Marketing._setUpsellPageSize(this.value)" style="' + _marketingSelectStyle() + 'min-width:110px;max-width:110px;height:34px;padding:0 30px 0 10px;font-size:12px;background-color:#fff;color:#6F6860;">' + pageSizeOptions + '</select>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<button type="button" onclick="Modules.Marketing._setUpsellPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
            '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div>' +
            '<button type="button" onclick="Modules.Marketing._setUpsellPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
          '</div>' +
        '</div>' +
      '</div>' : '';
      try { perfHtml = _upsellPerformanceSectionHtml(); } catch (e1) { console.error('[Marketing] upsell perf block failed', e1); perfHtml = ''; }
      try { toolbarHtml = _upsellToolbarHtml(); } catch (e3) { console.error('[Marketing] upsell toolbar block failed', e3); toolbarHtml = ''; }
      try {
        tableHtml = filtered.length === 0 ? _upsellEmptyStateHtml() :
          '<section style="display:flex;flex-direction:column;gap:10px;">' +
            '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
              '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Upsells cadastrados</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Gerencie regras, benefícios, período e produtos oferecidos.</div></div>' +
              '<div style="font-size:12px;color:#6F6860;">' + filtered.length + ' exibido' + (filtered.length === 1 ? '' : 's') + '</div>' +
            '</div>' +
            '<div style="background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;overflow:hidden;box-shadow:0 10px 24px rgba(31,31,31,.045);">' +
              '<div style="overflow:auto;">' +
                '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:920px;">' +
                  '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
                    _marketingTh('Regra') +
                    _marketingTh('Tipo') +
                    _marketingTh('Benefício') +
                    _marketingTh('Status') +
                    _marketingTh('Período') +
                    _marketingTh('Produtos', 'center') +
                    _marketingTh('Ações', 'right') +
                  '</tr></thead>' +
                  '<tbody>' +
                    paging.items.map(function (u) {
                      try {
                        return _upsellTableRowHtml(u);
                      } catch (cardErr) {
                        console.error('[Marketing] upsell row failed', u && u.id, cardErr);
                        return '<tr>' + _marketingTd(_esc(_upsellDisplayName(u)) + ' com erro ao renderizar.') + '</tr>';
                      }
                    }).join('') +
                  '</tbody>' +
                '</table>' +
              '</div>' +
              paginationHtml +
            '</div>' +
          '</section>';
      } catch (e4) {
        console.error('[Marketing] upsell table block failed', e4);
        tableHtml = _upsellEmptyStateHtml();
      }
      suggestionsHtml = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
        '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
          '<div style="min-width:0;flex:1 1 420px;">' +
            '<h2 style="font-size:22px;font-weight:700;line-height:1.2;margin:0 0 6px;color:#1F1F1F;">Upsells</h2>' +
            '<p style="font-size:13px;font-weight:400;color:#6F6860;line-height:1.45;max-width:760px;margin:0;">Configure ofertas complementares para aumentar o valor médio dos pedidos.</p>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
            '<button onclick="Modules.Marketing._openUpsellModal(null, \'edit\')" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 8px 18px rgba(180,35,24,.20)\';" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(180,35,24,.18)\';" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);transition:transform .15s ease,box-shadow .15s ease,background .15s ease;"><span class="mi" style="font-size:16px;vertical-align:-3px;margin-right:6px;">add</span>Novo upsell</button>' +
          '</div>' +
        '</div>' +
        _upsellSuggestionsMetricsHtml(summary) +
        toolbarHtml +
        tableHtml +
      '</div>';
      activeContent = _upsellTab === 'sugestoes' ? suggestionsHtml : perfHtml;
      content.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
          '<div style="min-width:0;">' +
            '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Upsell</h2>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0 0 10px;">Crie upsells inteligentes para aumentar o valor médio dos pedidos.</p>' +
          '</div>' +
          _upsellSubtabsHtml() +
        '</div>' +
        activeContent +
      '</div>';
      _consumeSeasonActionDraftFor('upsell');
    } catch (err) {
      console.error('[Marketing] _paintUpsell failed', err);
      content.innerHTML = '<div style="' + _marketingCardStyle() + '">' +
        '<div style="font-size:18px;font-weight:600;color:#1F1F1F;margin-bottom:6px;">Upsell carregado com aviso</div>' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.5;margin-bottom:14px;">Houve um erro ao montar a lista completa, mas os dados ainda podem ser exibidos parcialmente.</div>' +
        '<button onclick="Modules.Marketing._renderUpsell()" style="background:#C4362A;color:#fff;border:none;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Recarregar</button>' +
      '</div>';
    }
  }

  function _upsellProductOptions(selectedIds, triggerOnly) {
    selectedIds = (selectedIds || []).map(String);
    return (_products || []).map(function (p) {
      var selected = selectedIds.indexOf(String(p.id)) >= 0;
      var disabled = triggerOnly && selectedIds.length && !selected;
      var text = [
        p.name || '',
        p.category || p.categoryName || p.categoryLabel || '',
        p.desc || p.shortDesc || '',
        UI.fmt(_promoBasePrice(p))
      ].join(' ').toLowerCase();
      return '<label data-ups-product-text="' + _esc(text) + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #EEE6E4;border-radius:12px;background:' + (selected ? '#FFF0EE' : '#fff') + ';cursor:pointer;">' +
        '<input type="checkbox" class="ups-prod-check" data-id="' + _esc(String(p.id)) + '" ' + (selected ? 'checked' : '') + ' onchange="Modules.Marketing._refreshUpsellAnalysis();Modules.Marketing._syncUpsellProductSearch()" style="width:16px;height:16px;accent-color:#C4362A;"' + (disabled ? ' disabled' : '') + '>' +
        '<div style="min-width:0;flex:1;">' +
          '<div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(p.name || 'Produto') + '</div>' +
          '<div style="font-size:11px;color:#8A7E7C;">' + UI.fmt(_promoBasePrice(p)) + '</div>' +
        '</div>' +
      '</label>';
    }).join('');
  }

  function _upsellModalAnalysis(ruleOrType, selectedIds, minMarginPct) {
    var rule = typeof ruleOrType === 'object' ? ruleOrType : { type: ruleOrType };
    rule = _upsellRule(rule);
    var ids = (selectedIds || []).map(String);
    if (!ids.length) return '<div style="font-size:13px;color:#8A7E7C;">Selecione produtos do upsell para calcular a margem.</div>';
    var items = ids.map(function (id) { return (_products || []).find(function (p) { return String(p.id) === String(id); }); }).filter(Boolean);
    if (!items.length) return '<div style="font-size:13px;color:#8A7E7C;">Selecione produtos do upsell para calcular a margem.</div>';
    var msg = items.map(function (p) {
      var calc = _upsellBenefitCalcForProduct(p, rule);
      var price = calc ? calc.original : _promoBasePrice(p);
      var final = calc ? calc.final : price;
      var discount = calc ? calc.discount : 0;
      var cost = calc ? calc.cost : _promoCostForProduct(p);
      if (!(price > 0)) return '<div style="background:#fff;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;"><div style="font-size:13px;font-weight:800;color:#1A1A1A;">' + _esc(p.name || 'Produto') + '</div><div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Produto sem preço configurado. Não foi possível calcular a margem.</div></div>';
      var profit = cost > 0 ? price - cost : null;
      var profitAfter = cost > 0 ? final - cost : null;
      var margin = cost > 0 ? ((price - cost) / price) * 100 : null;
      var marginAfter = cost > 0 && final > 0 ? ((final - cost) / final) * 100 : null;
      var status = cost <= 0 ? 'Margem não calculada' : marginAfter < minMarginPct ? 'Esse upsell pode gerar prejuízo ou ficar abaixo da margem mínima.' : marginAfter < minMarginPct + 5 ? 'Esse upsell está próximo da margem mínima. Revise antes de ativar.' : 'Esse upsell mantém a margem mínima configurada.';
      return '<div style="background:#fff;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
        '<div style="font-size:13px;font-weight:800;color:#1A1A1A;">' + _esc(p.name || 'Produto') + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Preço original: ' + UI.fmt(price) + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Preço com benefício: ' + UI.fmt(final) + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Desconto aplicado: ' + UI.fmt(discount) + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Custo: ' + (cost > 0 ? UI.fmt(cost) : '—') + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Lucro estimado antes: ' + (profit != null ? UI.fmt(profit) : '—') + ' · depois: ' + (profitAfter != null ? UI.fmt(profitAfter) : '—') + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Margem estimada antes: ' + (margin != null ? margin.toFixed(1).replace('.', ',') + '%' : '—') + ' · depois: ' + (marginAfter != null ? marginAfter.toFixed(1).replace('.', ',') + '%' : '—') + '</div>' +
        '<div style="font-size:12px;color:' + (marginAfter != null && marginAfter < minMarginPct ? '#C4362A' : '#1A9E5A') + ';font-weight:700;margin-top:6px;">' + _esc(status) + '</div>' +
      '</div>';
    }).join('');
    return '<div style="display:flex;flex-direction:column;gap:8px;">' + msg + '</div>';
  }

  function _openUpsellModal(id, mode) {
    _editingId = id;
    var rule = id ? (_upsells.find(function (x) { return String(x.id) === String(id); }) || {}) : { type: 'complemento', active: true, productIds: [], locations: ['detail'], priority: 1, displayLimit: 2, message: 'También te puede gustar' };
    rule = _upsellRule(rule);
    var editMode = mode === 'edit' || (!id && mode !== 'view');
    var selectedIds = rule.productIds.slice();
    var sectionStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.045);overflow:hidden;';
    var inputStyle = _marketingInputStyle() + 'background:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var selectStyle = _marketingSelectStyle() + 'background-color:#FFFCF8;border-color:#E8DCD7;border-radius:12px;';
    var labelStyle = _marketingModalLabelStyle();
    var sectionTitleStyle = 'font-size:15px;font-weight:650;color:#1F1F1F;margin-bottom:5px;line-height:1.25;';
    var sectionDescStyle = 'font-size:12px;color:#6F6860;line-height:1.45;margin:0 0 12px;';
    function cardHeader(icon, title, desc) {
      return '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:13px;">' +
        '<span class="mi" style="width:30px;height:30px;max-width:30px;max-height:30px;border-radius:10px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:16px;line-height:1;flex:0 0 30px;overflow:hidden;white-space:nowrap;">' + _esc(icon || 'sell') + '</span>' +
        '<div style="min-width:0;"><div style="' + sectionTitleStyle + '">' + _esc(title || '') + '</div>' +
        (desc ? '<p style="' + sectionDescStyle + 'margin-bottom:0;">' + _esc(desc) + '</p>' : '') + '</div>' +
      '</div>';
    }
    function fieldWrap(width, html) {
      return '<div style="flex:1 1 ' + width + ';max-width:' + width + ';min-width:min(100%,' + width + ');">' + html + '</div>';
    }
    var body;
    if (editMode) {
      body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<section style="' + sectionStyle + '">' +
          cardHeader('edit_note', 'Dados principais', 'Nomeie o upsell e escolha como ele será apresentado ao cliente.') +
          '<div style="max-width:460px;"><label style="' + labelStyle + '">Nome do upsell</label><input id="ups-name" type="text" value="' + _esc(rule.name) + '" placeholder="Ex: Completar pedido com bebida" style="' + inputStyle + '"></div>' +
        '</section>' +
        '<section style="' + sectionStyle + '">' +
          cardHeader('account_tree', 'Tipo de upsell', 'Escolha o momento em que o BocaFood deve oferecer o item adicional.') +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">' + ['complemento','upgrade','combo_sugerido','carrinho','valor_minimo'].map(function (t) {
            var info = _upsellTypeInfo(t);
            var active = info.key === rule.type;
            return '<button type="button" data-upstype="' + info.key + '" onclick="Modules.Marketing._selectUpsellType(\'' + info.key + '\')" style="padding:12px 13px;border:1px solid ' + (active ? '#C4362A' : '#E8DCD7') + ';border-radius:14px;background:' + (active ? '#FFF0EE' : '#FFFCF8') + ';text-align:left;font-family:inherit;cursor:pointer;box-shadow:' + (active ? '0 8px 18px rgba(196,54,42,.10)' : 'none') + ';">' +
              '<div style="font-size:13px;font-weight:650;color:' + (active ? '#C4362A' : '#1F1F1F') + ';line-height:1.25;">' + _esc(info.label) + '</div>' +
              '<div style="font-size:12px;color:#6F6860;margin-top:5px;line-height:1.35;">' + _esc(info.desc) + '</div>' +
            '</button>';
          }).join('') + '</div>' +
        '</section>' +
        '<section style="' + sectionStyle + '">' +
          cardHeader('local_offer', 'Benefício do upsell', 'Defina o incentivo que aparece para a cliente quando esse upsell for oferecido.') +
          '<div id="ups-benefit-block">' + _upsellBenefitSectionHtml(rule) + '</div>' +
        '</section>' +
        '<section style="' + sectionStyle + '">' +
          cardHeader('tune', 'Configurações da regra', 'Escolha o produto que dispara o upsell, onde ele aparece e por quanto tempo fica ativo.') +
          '<div style="display:flex;align-items:center;justify-content:flex-start;margin:-2px 0 12px;"><button type="button" onclick="Modules.Marketing._toggleUpsellRuleHelp()" style="border:none;background:transparent;color:#C4362A;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;padding:0;">Como preencher?</button></div>' +
          '<div id="ups-rule-help" style="display:none;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:12px 14px;margin:0 0 14px;font-size:12px;color:#4A403C;line-height:1.55;">' +
            'Use esta área para definir quando o upsell será oferecido ao cliente.<br><br>' +
            '<strong>Produto gatilho</strong><br>' +
            'Escolha o produto que faz a oferta aparecer. Exemplo: quando a cliente abre ou adiciona uma coxinha, você pode oferecer uma bebida junto.<br><br>' +
            '<strong>Momento da exibição</strong><br>' +
            'Escolha se a oferta aparece quando o produto gatilho for acionado ou antes do pedido ser enviado pelo WhatsApp.<br><br>' +
            '<strong>Datas</strong><br>' +
            'Use início e fim para campanhas com prazo definido. A data final precisa ser igual ou posterior à data de início.' +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;">' +
            fieldWrap('420px', '<label style="' + labelStyle + '">Produto gatilho</label><select id="ups-trigger-product" style="' + selectStyle + '"><option value="">—</option>' + _products.map(function (p) { return '<option value="' + _esc(String(p.id)) + '"' + (rule.triggerProductIds.indexOf(String(p.id)) >= 0 ? ' selected' : '') + '>' + _esc(p.name || 'Produto') + '</option>'; }).join('') + '</select>') +
            fieldWrap('270px', '<div id="ups-moment-wrap"><label style="' + labelStyle + '">Momento da exibição</label><select id="ups-moment" style="' + selectStyle + '"><option value="trigger"' + (String(rule.displayMoment || '').toLowerCase() !== 'whatsapp' ? ' selected' : '') + '>Ao acionar o gatilho</option><option value="whatsapp"' + (String(rule.displayMoment || '').toLowerCase() === 'whatsapp' ? ' selected' : '') + '>Ao clicar em enviar pelo WhatsApp</option></select></div>') +
            fieldWrap('120px', '<label style="' + labelStyle + '">Prioridade</label><input id="ups-priority" type="number" step="1" min="0" value="' + rule.priority + '" style="' + inputStyle + '">') +
            fieldWrap('150px', '<label style="' + labelStyle + '">Limite</label><input id="ups-limit" type="number" step="1" min="0" value="' + rule.displayLimit + '" style="' + inputStyle + '">') +
            fieldWrap('210px', '<label style="' + labelStyle + '">Data de início</label><input id="ups-start" type="date" min="' + _promoTodayIso() + '" value="' + (rule.startDate || '') + '" onchange="Modules.Marketing._syncUpsellDateRules()" style="' + inputStyle + '">') +
            fieldWrap('210px', '<label style="' + labelStyle + '">Data de fim</label><input id="ups-end" type="date" min="' + _esc(rule.startDate || _promoTodayIso()) + '" value="' + (rule.endDate || '') + '" onchange="Modules.Marketing._syncUpsellDateRules()" style="' + inputStyle + '">') +
            '<div style="flex:1 1 520px;min-width:min(100%,360px);"><label style="' + labelStyle + '">Mensagem ao cliente</label><input id="ups-message" type="text" value="' + _esc(rule.message) + '" placeholder="También te puede gustar" style="' + inputStyle + '"></div>' +
            '<div style="flex:1 1 100%;min-width:0;"><label style="' + labelStyle + '">Produtos do upsell</label><input id="ups-product-search" type="search" placeholder="Buscar produto do upsell..." oninput="Modules.Marketing._setUpsellProductSearch(this.value)" style="' + inputStyle + 'margin-bottom:10px;"><div id="ups-product-count" style="font-size:12px;font-weight:600;color:#6F6860;margin:0 0 10px;">' + selectedIds.length + ' produtos selecionados</div><div id="ups-product-list" style="max-height:220px;overflow:auto;border:1px solid #E8DCD7;border-radius:14px;padding:10px;background:#FFFCF8;">' + _upsellProductOptions(selectedIds) + '</div></div>' +
          '</div>' +
        '</section>' +
        '<section style="' + sectionStyle + '">' +
          cardHeader('analytics', 'Produtos selecionados para upsell', 'Confira se o benefício continua saudável antes de salvar.') +
          '<div style="font-size:13px;color:#6F6860;line-height:1.55;margin-bottom:10px;">' + _esc((rule.benefitDesc || '') + ' ' + (rule.benefitExample || '')) + '</div>' +
          '<div id="ups-analysis" style="display:flex;flex-direction:column;gap:8px;">' + _upsellModalAnalysis(rule, selectedIds, parseFloat(rule.minMarginPct || _moneyConfig.minMarginPct || 40) || 40) + '</div>' +
        '</section>' +
      '</div>';
    } else {
      var sales = _upsellSalesStats(rule);
      var impact = _upsellImpactSummary(rule);
      var quality = _upsellAnalysisStatus(rule, sales, impact);
      var productList = _upsellRuleProducts(rule);
      var productText = productList.length ? productList.slice(0, 3).map(function (p) { return p.name; }).join(' · ') + (productList.length > 3 ? ' +' + (productList.length - 3) : '') : '—';
      var benefitLine = _upsellBenefitLine(rule, impact);
      var salesLine = sales.currentOrders > 0
        ? (sales.currentOrders + ' pedidos · ' + sales.currentItems + ' itens · ' + (sales.growth == null ? 'Sem base anterior' : (sales.growth >= 0 ? '+' : '') + sales.growth.toFixed(0) + '% vs. 30 dias anteriores'))
        : 'Sem base suficiente para analisar vendas.';
      var marginText = impact.hasCost && impact.marginAfter != null ? impact.marginAfter.toFixed(1).replace('.', ',') + '%' : '—';
      var impactText = _upsellOrderImpactText(rule, impact);
      var savingsText = impact.discount > 0 ? UI.fmt(impact.discount) : '—';
      function detailTile(label, value, tone) {
        var bg = tone === 'red' ? '#FFF0EE' : tone === 'blue' ? '#F2F7FF' : tone === 'green' ? '#F0FAF4' : '#FFFCF8';
        var color = tone === 'red' ? '#B42318' : tone === 'blue' ? '#2F5F93' : tone === 'green' ? '#1F6F43' : '#1F1F1F';
        return '<div style="background:' + bg + ';border:1px solid #E8DCD7;border-radius:13px;padding:10px 12px;min-width:0;">' +
          '<div style="font-size:10px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;line-height:1.2;">' + _esc(label) + '</div>' +
          '<div style="font-size:13px;font-weight:600;color:' + color + ';line-height:1.35;margin-top:5px;overflow-wrap:anywhere;">' + _esc(value || '—') + '</div>' +
        '</div>';
      }
      body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<section style="' + sectionStyle + '">' +
          '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start;">' +
            '<div style="min-width:0;">' +
              '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span class="mi" style="width:30px;height:30px;border-radius:10px;background:#FFF0EE;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;">sell</span><div style="font-size:22px;font-weight:650;line-height:1.15;color:#1F1F1F;">' + _esc(rule.name) + '</div></div>' +
              '<div style="font-size:13px;color:#6F6860;line-height:1.45;">' + _esc(quality.text) + '</div>' +
              '<div style="margin-top:4px;font-size:13px;color:#6F6860;">' + _esc(salesLine) + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
              '<span style="font-size:11px;font-weight:600;padding:5px 9px;border-radius:999px;background:' + _upsellStatusInfo(rule).bg + ';color:' + _upsellStatusInfo(rule).color + ';">' + _esc(_upsellStatusInfo(rule).label) + '</span>' +
              '<span style="font-size:11px;font-weight:600;padding:5px 9px;border-radius:999px;background:#EEF4FF;color:#3B82F6;">' + _esc(rule.typeLabel) + '</span>' +
              '<span style="font-size:11px;font-weight:600;padding:5px 9px;border-radius:999px;background:#FFF0EE;color:#C4362A;">' + _esc(rule.benefitLabel || 'Sem benefício') + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:14px;">' +
            detailTile('Tipo de upsell', rule.typeLabel, 'blue') +
            detailTile('Benefício', rule.benefitLabel || 'Sem benefício', 'red') +
            detailTile('Produto gatilho', _upsellRuleTriggerText(rule), '') +
            detailTile('Produto do upsell', productText, '') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:minmax(170px,240px) minmax(240px,1fr);gap:10px;margin-top:10px;">' +
            detailTile('Período', _upsellRulePeriodText(rule), '') +
            detailTile('Momento da exibição', _upsellRuleMomentText(rule), '') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:10px;">' +
            detailTile('Preço / benefício', benefitLine, '') +
            detailTile('Impacto estimado', impactText, 'blue') +
            detailTile('Cliente economiza', savingsText, savingsText !== '—' ? 'green' : '') +
            detailTile('Margem após benefício', marginText, impact.marginAfter != null && impact.marginAfter < (parseFloat(rule.minMarginPct || _moneyConfig.minMarginPct || 40) || 0) ? 'red' : 'green') +
          '</div>' +
          '<div style="margin-top:12px;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:13px;padding:10px 12px;font-size:12px;color:#6F6860;line-height:1.45;"><span style="font-weight:600;color:#1F1F1F;">Mensagem ao cliente:</span> ' + _esc(rule.message || 'También te puede gustar') + '</div>' +
        '</section>' +
        '<section style="' + sectionStyle + '">' +
          cardHeader('bar_chart', 'Resumo de vendas', 'Acompanhe os sinais de uso e conversão desse upsell.') +
          _upsellSalesSummaryHtml(rule) +
        '</section>' +
        '<section style="' + sectionStyle + '">' +
          cardHeader('analytics', 'Impacto por produto', 'Confira o preço, o benefício e a margem estimada dos itens selecionados.') +
          _upsellModalAnalysis(rule, rule.productIds, rule.minMarginPct || _moneyConfig.minMarginPct || 40) +
        '</section>' +
      '</div>';
    }

    var footer = editMode
      ? '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;"><button onclick="if(window._upsellModal)window._upsellModal.close()" style="padding:10px 16px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>' + (id ? '<button onclick="Modules.Marketing._deleteUpsell(\'' + (id || '') + '\')" style="padding:10px 16px;border-radius:10px;border:1px solid #F8D1CC;background:#FFF0EE;color:#B42318;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Excluir</button>' : '') + '<button onclick="Modules.Marketing._saveUpsell()" style="padding:10px 16px;border-radius:10px;border:none;background:#C4362A;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 24px rgba(196,54,42,.18);">Salvar alterações</button></div>'
      : '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;"><button onclick="if(window._upsellModal)window._upsellModal.close()" style="padding:10px 16px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Fechar</button><button onclick="Modules.Marketing._duplicateUpsell(\'' + (id || '') + '\')" style="padding:10px 16px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Duplicar</button><button onclick="Modules.Marketing._toggleUpsellStatus(\'' + (id || '') + '\')" style="padding:10px 16px;border-radius:10px;border:1px solid ' + (_upsellStatusInfo(rule).key === 'active' ? '#FEDF89' : '#D9F2E3') + ';background:' + (_upsellStatusInfo(rule).key === 'active' ? '#FFF7ED' : '#F0FAF4') + ';color:' + (_upsellStatusInfo(rule).key === 'active' ? '#B45309' : '#1F6F43') + ';font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">' + (_upsellStatusInfo(rule).key === 'active' ? 'Pausar' : 'Ativar') + '</button><button onclick="Modules.Marketing._openUpsellModal(\'' + (id || '') + '\', \'edit\')" style="padding:10px 16px;border-radius:10px;border:none;background:#C4362A;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 24px rgba(196,54,42,.18);">Editar</button></div>';

    if (window._upsellModal && typeof window._upsellModal.close === 'function') window._upsellModal.close();
    window._upsellType = rule.type;
    window._upsellBenefit = rule.benefitType || 'none';
    window._upsellActive = rule.active !== false;
    window._upsellBase = rule;
    window._upsellModal = _openUpsellShell({
      title: editMode ? (id ? 'Editar Upsell' : 'Novo Upsell') : 'Resumo do Upsell',
      subtitle: editMode ? 'Ajuste a lógica do upsell e o benefício mostrado ao cliente.' : 'Visualize o desempenho, o benefício e a configuração da regra.',
      body: body,
      footer: footer,
      maxWidth: '1120px'
    });
    if (editMode) _applySeasonDraftToUpsellForm();
    if (editMode) {
      setTimeout(function () { _syncUpsellDateRules(); _syncUpsellBenefitUI(); _refreshUpsellAnalysis(); }, 100);
    }
  }

  function _currentUpsellLocationSelection() {
    var moment = document.getElementById('ups-moment');
    return moment && String(moment.value || '').trim().toLowerCase() === 'whatsapp' ? ['cart'] : ['detail'];
  }

  function _syncUpsellMomentByLocations() {
    var moment = document.getElementById('ups-moment');
    if (!moment) return;
    moment.disabled = false;
    moment.style.opacity = '1';
    moment.style.cursor = 'pointer';
    moment.style.background = '#fff';
  }

  function _toggleUpsellRuleHelp() {
    var el = document.getElementById('ups-rule-help');
    if (!el) return;
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }

  function _syncUpsellDateRules() {
    var today = _promoTodayIso();
    var start = document.getElementById('ups-start');
    var end = document.getElementById('ups-end');
    if (start) start.min = today;
    if (end) {
      end.min = start && start.value ? start.value : today;
      if (end.value && end.value < end.min) end.value = end.min;
    }
  }

  function _selectUpsellType(type) {
    window._upsellType = _upsellTypeInfo(type).key;
    window._upsellBenefit = '';
    document.querySelectorAll('[data-upstype]').forEach(function (btn) {
      var active = btn.dataset.upstype === window._upsellType;
      btn.style.borderColor = active ? '#C4362A' : '#D4C8C6';
      btn.style.background = active ? '#FFF0EE' : '#FFFCF8';
      btn.style.color = active ? '#C4362A' : '#1A1A1A';
      btn.style.boxShadow = active ? '0 8px 18px rgba(196,54,42,.10)' : 'none';
      var title = btn.querySelector('div');
      if (title) title.style.color = active ? '#C4362A' : '#1F1F1F';
    });
    _syncUpsellBenefitUI();
    _refreshUpsellAnalysis();
  }

  function _selectUpsellBenefit(type) {
    var currentType = String(window._upsellType || '').trim();
    var key = _upsellBenefitInfo(type).key;
    if (!currentType) {
      window._upsellBenefit = '';
      UI.toast('Selecione primeiro o tipo de upsell', 'error');
      return;
    }
    if (key === 'special_price') {
      window._upsellBenefit = '';
      UI.toast('Preço especial é legado. Revise a regra.', 'error');
      _syncUpsellBenefitUI();
      _refreshUpsellAnalysis();
      return;
    }
    if (!_upsellBenefitAllowedForType(currentType, key)) {
      window._upsellBenefit = '';
      UI.toast('Benefício incompatível com o tipo de upsell', 'error');
      _syncUpsellBenefitUI();
      _refreshUpsellAnalysis();
      return;
    }
    window._upsellBenefit = key;
    _syncUpsellBenefitUI();
    _refreshUpsellAnalysis();
  }

  function _pickUpsellBenefit(type, ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
    _selectUpsellBenefit(type);
    return false;
  }

  function _refreshUpsellAnalysis() {
    var type = window._upsellType || 'complemento';
    var selected = Array.prototype.slice.call(document.querySelectorAll('.ups-prod-check:checked')).map(function (i) { return i.dataset.id; });
    var host = document.getElementById('ups-analysis');
    if (host) host.innerHTML = _upsellModalAnalysis(window._upsellBase || { type: type, benefitType: window._upsellBenefit || 'none' }, selected, parseFloat((window._upsellBase && window._upsellBase.minMarginPct) || _moneyConfig.minMarginPct || 40) || 40);
    _syncUpsellProductSearch();
    _syncUpsellBenefitDetails();
    _syncUpsellBenefitReference();
  }

  function _setUpsellProductSearch(value) {
    _upsellUi.productQuery = String(value || '');
    _syncUpsellProductSearch();
  }

  function _syncUpsellProductSearch() {
    var query = String(_upsellUi.productQuery || '').trim().toLowerCase();
    var rows = document.querySelectorAll('#ups-product-list label');
    Array.prototype.forEach.call(rows, function (row) {
      var text = String(row.dataset.upsProductText || row.textContent || '').toLowerCase();
      row.style.display = !query || text.indexOf(query) >= 0 ? 'flex' : 'none';
    });
    var count = document.getElementById('ups-product-count');
    if (count) count.textContent = Array.prototype.slice.call(document.querySelectorAll('.ups-prod-check:checked')).length + ' produtos selecionados';
  }

  function _upsellBenefitReferenceHtml(rule, selectedProducts, currentBenefit) {
    rule = _upsellRule(rule || {});
    var current = typeof currentBenefit === 'string' ? currentBenefit.trim() : String(window._upsellBenefit || rule.benefitType || '').trim();
    var selected = Array.isArray(selectedProducts) && selectedProducts.length ? selectedProducts : _upsellRuleProducts(rule);
    if (selected.length) {
      return '<div style="grid-column:1 / -1;background:#fff;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;font-size:12px;color:#1A1A1A;line-height:1.55;">' +
        '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:8px;">Produtos selecionados para upsell</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' + selected.map(function (p) {
          var calc = _upsellBenefitCalcForProduct(p, Object.assign({}, rule, { benefitType: current || rule.benefitType }));
          if (!calc) {
            return '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;"><div style="font-size:13px;font-weight:800;color:#1A1A1A;">' + _esc(p.name || 'Produto') + '</div><div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Produto sem preço configurado. Não foi possível calcular a margem.</div></div>';
          }
          return '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px 14px;">' +
            '<div style="font-size:13px;font-weight:800;color:#1A1A1A;">' + _esc(p.name || 'Produto') + '</div>' +
            '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Preço original: ' + UI.fmt(calc.original) + '</div>' +
            '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Preço com benefício: ' + UI.fmt(calc.final) + '</div>' +
            '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Economia do cliente: ' + UI.fmt(calc.discount) + '</div>' +
            '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">Margem estimada: ' + (calc.marginAfter != null ? calc.marginAfter.toFixed(1).replace('.', ',') + '%' : '—') + '</div>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>';
    }
    if (current && current !== 'none') {
      return '<div style="grid-column:1 / -1;background:#FFF8F6;border:1px dashed #E4D7D4;border-radius:12px;padding:12px 14px;font-size:12px;color:#8A7E7C;line-height:1.5;">Selecione produtos do upsell para calcular o impacto por item.</div>';
    }
    return '';
  }

  function _syncUpsellBenefitReference() {
    var host = document.getElementById('ups-benefit-reference');
    if (!host) return;
    var selected = Array.prototype.slice.call(document.querySelectorAll('.ups-prod-check:checked')).map(function (i) {
      return (_products || []).find(function (p) { return String(p.id) === String(i.dataset.id); }) || null;
    }).filter(Boolean);
    host.innerHTML = _upsellBenefitReferenceHtml(window._upsellBase || {}, selected, window._upsellBenefit || '');
  }

  function _syncUpsellBenefitDetails() {
    var giftKind = String((document.getElementById('ups-gift-condition-type') || {}).value || '').trim();
    document.querySelectorAll('[data-ups-gift-extra]').forEach(function (el) {
      var key = el.getAttribute('data-ups-gift-extra');
      if (key === 'note') return;
      el.style.display = giftKind === key ? 'block' : 'none';
    });
    var cartKind = String((document.getElementById('ups-cart-benefit') || {}).value || '').trim();
    document.querySelectorAll('[data-ups-cart-extra]').forEach(function (el) {
      var key = el.getAttribute('data-ups-cart-extra');
      if (key === 'value') {
        el.style.display = (cartKind === 'pct' || cartKind === 'eur') ? 'block' : 'none';
      } else if (key === 'gift') {
        el.style.display = cartKind === 'gift' ? 'block' : 'none';
      }
    });
    _syncUpsellBenefitReference();
  }

  function _saveUpsell() {
    var name = (document.getElementById('ups-name') || {}).value || '';
    if (!name) { UI.toast('Nome é obrigatório', 'error'); return; }
    var upsellType = String(window._upsellType || 'complemento').trim();
    var selected = Array.prototype.slice.call(document.querySelectorAll('.ups-prod-check:checked')).map(function (i) { return i.dataset.id; }).filter(Boolean);
    var triggerProductId = (document.getElementById('ups-trigger-product') || {}).value || '';
    var benefitType = String(window._upsellBenefit || ((document.getElementById('ups-benefit-type') || {}).value || '')).trim();
    var benefitValue = _promoNumber((document.getElementById('ups-benefit-value') || {}).value) || 0;
    var specialPrice = _promoNumber((document.getElementById('ups-special-price') || {}).value);
    var finalUpsellPrice = _promoNumber((document.getElementById('ups-final-price') || {}).value);
    var giftProductId = (document.getElementById('ups-gift-product') || {}).value || '';
    var giftConditionType = (document.getElementById('ups-gift-condition-type') || {}).value || 'trigger';
    var giftQty = parseInt((document.getElementById('ups-gift-qty') || {}).value, 10) || 0;
    var giftMinCartValue = _promoNumber((document.getElementById('ups-gift-min-cart') || {}).value) || 0;
    var minCartValue = _promoNumber((document.getElementById('ups-cart-min') || {}).value) || 0;
    var cartGoalBenefit = (document.getElementById('ups-cart-benefit') || {}).value || '';
    var cartGoalBenefitValue = _promoNumber((document.getElementById('ups-cart-benefit-value') || {}).value) || 0;
    var cartGoalGiftProductId = (document.getElementById('ups-cart-gift-product') || {}).value || '';
    var cartGoalMessage = (document.getElementById('ups-cart-message') || {}).value || '';
    var displayMoment = (document.getElementById('ups-moment') || {}).value || 'trigger';
    var bundleQty = parseInt((document.getElementById('ups-bundle-qty') || {}).value, 10) || 0;
    var bundlePay = parseInt((document.getElementById('ups-bundle-pay') || {}).value, 10) || 0;
    var locations = _currentUpsellLocationSelection();
    locations = displayMoment === 'whatsapp' ? ['cart'] : ['detail'];
    if (!upsellType) { UI.toast('Tipo de upsell é obrigatório', 'error'); return; }
    if (!benefitType) { UI.toast('Tipo de benefício é obrigatório', 'error'); return; }
    if (benefitType === 'special_price' || !_upsellBenefitAllowedForType(upsellType, benefitType)) { UI.toast('Benefício incompatível com o tipo de upsell', 'error'); return; }
    if (benefitType === 'gift' && !giftProductId && selected[0]) giftProductId = selected[0];
    if (benefitType === 'pct' && !(benefitValue > 0)) { UI.toast('Informe o desconto em %', 'error'); return; }
    if (benefitType === 'eur' && !(benefitValue > 0)) { UI.toast('Informe o desconto em €', 'error'); return; }
    if (benefitType === 'combo_fixed' && !(finalUpsellPrice > 0)) { UI.toast('Informe o preço final do combo', 'error'); return; }
    if (benefitType === 'bundle_less_pay_more' && !(bundleQty > bundlePay && bundlePay > 0)) { UI.toast('Leve precisa ser maior que Pague', 'error'); return; }
    if (benefitType === 'gift' && !giftProductId && !selected.length) { UI.toast('Selecione o produto do brinde', 'error'); return; }
    if (benefitType === 'gift' && giftConditionType === 'qty' && !(giftQty > 0)) { UI.toast('Informe a quantidade mínima', 'error'); return; }
    if (benefitType === 'gift' && giftConditionType === 'mincart' && !(giftMinCartValue > 0)) { UI.toast('Informe o valor mínimo para o brinde', 'error'); return; }
    if ((benefitType === 'cart_goal' || benefitType === 'frete') && !(minCartValue > 0)) { UI.toast('Informe o valor mínimo do carrinho', 'error'); return; }
    if (benefitType === 'cart_goal' && cartGoalBenefit === 'gift' && !cartGoalGiftProductId && !selected.length) { UI.toast('Selecione o produto do brinde', 'error'); return; }
    if (benefitType === 'cart_goal' && (cartGoalBenefit === 'pct' || cartGoalBenefit === 'eur') && !(cartGoalBenefitValue > 0)) { UI.toast('Informe o valor do benefício', 'error'); return; }
    var legacyTriggerCategory = String((window._upsellBase && window._upsellBase.triggerCategory) || (window._upsellBase && window._upsellBase.trigger_category) || (window._upsellBase && window._upsellBase.categoryTrigger) || '').trim();
    if (upsellType !== 'valor_minimo' && upsellType !== 'carrinho' && !triggerProductId && !legacyTriggerCategory) { UI.toast('Selecione o produto gatilho', 'error'); return; }
    if (!selected.length) { UI.toast('Selecione ao menos um produto sugerido', 'error'); return; }
    if (!locations.length) { UI.toast('Selecione ao menos um local de exibição', 'error'); return; }
    var startDate = (document.getElementById('ups-start') || {}).value || '';
    var endDate = (document.getElementById('ups-end') || {}).value || '';
    var todayIso = _promoTodayIso();
    if (startDate && startDate < todayIso) { UI.toast('A data de início não pode ser anterior a hoje', 'error'); return; }
    if (endDate && endDate < todayIso) { UI.toast('A data de fim não pode ser anterior a hoje', 'error'); return; }
    if (startDate && endDate && endDate < startDate) { UI.toast('A data de fim deve ser igual ou posterior à data de início', 'error'); return; }
    var data = {
      name: name.trim(),
      title: name.trim(),
      type: upsellType || 'complemento',
      benefitType: benefitType,
      benefitValue: benefitValue,
      finalUpsellPrice: finalUpsellPrice,
      giftProductId: giftProductId,
      giftConditionType: giftConditionType,
      giftQty: giftQty,
      giftMinCartValue: giftMinCartValue,
      giftCondition: giftConditionType,
      bundleQty: bundleQty,
      bundlePay: bundlePay,
      minCartValue: minCartValue,
      cartGoalBenefit: cartGoalBenefit,
      cartGoalBenefitType: cartGoalBenefit,
      cartGoalBenefitValue: cartGoalBenefitValue,
      cartGoalGiftProductId: cartGoalGiftProductId,
      cartGoalMessage: cartGoalMessage || 'También te puede gustar',
      displayMoment: displayMoment,
      active: window._upsellActive !== false,
      productId: selected[0] || '',
      productIds: selected,
      suggestedProductIds: selected,
      triggerProductId: triggerProductId,
      triggerCategory: legacyTriggerCategory,
      triggerProductIds: [triggerProductId].filter(Boolean),
      displayLocations: locations.join(', '),
      locations: locations,
      message: (document.getElementById('ups-message') || {}).value || 'También te puede gustar',
      startDate: startDate,
      endDate: endDate,
      priority: parseInt((document.getElementById('ups-priority') || {}).value, 10) || 0,
      displayLimit: parseInt((document.getElementById('ups-limit') || {}).value, 10) || 0,
      minMarginPct: parseFloat((window._upsellBase && window._upsellBase.minMarginPct) || _moneyConfig.minMarginPct || 40) || 40,
      promotionId: (document.getElementById('ups-promo') || {}).value || '',
      channels: Array.isArray(window._upsellBase && window._upsellBase.channels) ? window._upsellBase.channels.slice() : [],
      autoTag: _upsellTypeInfo(window._upsellType || 'complemento').tag,
      benefitTag: _upsellBenefitInfo(benefitType).tag
    };
    data = _decorateSeasonActionPayload(data, 'upsell');
    if (data.type === 'complemento' || data.type === 'upgrade' || data.type === 'combo_sugerido' || data.type === 'carrinho' || data.type === 'valor_minimo') {
      // no extra constraint here; template handles visibility rules
    }
    var op = _editingId ? DB.update('upsellRules', _editingId, data) : DB.add('upsellRules', data);
    op.then(function (ref) {
      return _editingId ? Promise.resolve(_editingId) : _linkSeasonActionDraft('upsell', ref, 'upsellRules', data.name);
    }).then(function () {
      UI.toast('Upsell salvo!', 'success');
      if (window._upsellModal) window._upsellModal.close();
      _renderUpsell();
      if (Modules.Catalogo && typeof Modules.Catalogo._refreshProductPromotions === 'function') Modules.Catalogo._refreshProductPromotions();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _toggleUpsellStatus(id) {
    var u = (_upsells || []).find(function (x) { return String(x.id) === String(id); });
    if (!u) return;
    DB.update('upsellRules', id, { active: u.active === false }).then(function () {
      _renderUpsell();
    });
  }

  function _duplicateUpsell(id) {
    var u = (_upsells || []).find(function (x) { return String(x.id) === String(id); });
    if (!u) return;
    var copy = {};
    Object.keys(u).forEach(function (k) {
      if (k === 'id' || k === 'createdAt' || k === 'updatedAt') return;
      copy[k] = u[k];
    });
    copy.name = (u.name || 'Upsell') + ' (cópia)';
    copy.active = false;
    DB.add('upsellRules', copy).then(function () {
      UI.toast('Upsell duplicado', 'success');
      _renderUpsell();
    });
  }

  function _deleteUpsell(id) {
    UI.confirm('Eliminar este upsell?').then(function (yes) {
      if (!yes) return;
      DB.remove('upsellRules', id).then(function () {
        UI.toast('Eliminado', 'info');
        _renderUpsell();
      });
    });
  }

  // ── AVALIAÇÕES ────────────────────────────────────────────────────────────
  function _renderAvaliacoes() {
    DB.getAll('reviews').then(function (data) {
      _reviews = (data || []).sort(function (a, b) {
        var ta = _reviewDateValue(a.createdAt || a.approvedAt || a.updatedAt);
        var tb = _reviewDateValue(b.createdAt || b.approvedAt || b.updatedAt);
        return tb - ta;
      });
      _paintAvaliacoes();
    });
  }

  function _paintAvaliacoes() {
    var content = document.getElementById('marketing-content');
    if (!content) return;
    var filtered = _reviewFilteredList();
    var summary = _reviewSummary(filtered);
    var pending = summary.pending;
    var avg = summary.avg ? summary.avg.toFixed(1) : '0.0';
    var reviewNote = summary.total ? (summary.approved + ' aprovadas no template · ' + summary.replied + ' com resposta') : 'As avaliações aprovadas aparecem na página pública.';
    var toolbar = _reviewToolbarHtml(summary);
    var statsHtml = '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px;">' +
      '<div style="background:#fff;border:1px solid #EEE6E4;border-radius:14px;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Total</div><div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + summary.total + '</div><div style="font-size:11px;color:#8A7E7C;margin-top:3px;">Avaliações no período</div></div>' +
      '<div style="background:#fff;border:1px solid #EEE6E4;border-radius:14px;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Aprovadas</div><div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + summary.approved + '</div><div style="font-size:11px;color:#8A7E7C;margin-top:3px;">Visíveis no template</div></div>' +
      '<div style="background:#fff;border:1px solid #EEE6E4;border-radius:14px;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Pendentes</div><div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + pending + '</div><div style="font-size:11px;color:#8A7E7C;margin-top:3px;">Aguardando análise</div></div>' +
      '<div style="background:' + (summary.total ? '#EDFAF3' : '#F2EDED') + ';border:1px solid #EEE6E4;border-radius:14px;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,.04);"><div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;">Média</div><div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:4px;">' + avg + '</div><div style="font-size:11px;color:#8A7E7C;margin-top:3px;">' + summary.replied + ' respondidas</div></div>' +
    '</div>';
    var header = '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;">' +
      '<div><h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">Gerar confiança (' + _reviews.length + ')</h2><p style="font-size:12px;color:#8A7E7C;line-height:1.5;">Modere avaliações, responda comentários e mantenha no template apenas o que passa confiança.</p></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button onclick="Modules.Marketing._reviewAction()" style="background:#C4362A;color:#fff;border:none;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Abrir página pública</button>' +
      '</div>' +
    '</div>';
    var body = _reviews.length === 0
      ? '<div style="background:#fff;border:1px dashed #E4D7D4;border-radius:16px;padding:28px;text-align:center;">' +
          '<div style="font-size:18px;font-weight:900;color:#1A1A1A;margin-bottom:6px;">Nenhuma avaliação ainda</div>' +
          '<div style="font-size:13px;color:#8A7E7C;line-height:1.5;margin-bottom:16px;">As avaliações aprovadas aparecem no template e ajudam a gerar confiança.</div>' +
          '<button onclick="Modules.Marketing._reviewAction()" style="background:#C4362A;color:#fff;border:none;padding:11px 18px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Abrir página pública</button>' +
        '</div>'
      : (filtered.length === 0
        ? '<div style="background:#fff;border:1px dashed #E4D7D4;border-radius:16px;padding:28px;text-align:center;"><div style="font-size:18px;font-weight:900;color:#1A1A1A;margin-bottom:6px;">Nenhum resultado para este filtro</div><div style="font-size:13px;color:#8A7E7C;line-height:1.5;">Ajuste busca, status ou período para ver avaliações.</div></div>'
        : '<div style="display:flex;flex-direction:column;gap:12px;">' + filtered.map(_reviewCardHtml).join('') + '</div>');
    content.innerHTML = header + statsHtml + toolbar + body;
  }

  function _approveReview(id) {
    DB.update('reviews', id, { approved: true, rejected: false, status: 'approved' }).then(function () {
      UI.toast('Avaliação aprovada', 'success'); _renderAvaliacoes();
    });
  }

  function _rejectReview(id) {
    DB.update('reviews', id, { rejected: true, approved: false, status: 'rejected' }).then(function () {
      UI.toast('Avaliação rejeitada', 'info'); _renderAvaliacoes();
    });
  }

  function _replyReview(id) {
    var r = _reviews.find(function (x) { return x.id === id; });
    var body = '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Resposta</label>' +
      '<textarea id="rev-reply" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;min-height:100px;resize:vertical;">' + (r ? (r.reply || '') : '') + '</textarea></div>';
    var footer = '<button onclick="Modules.Marketing._saveReply(\'' + id + '\')" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Salvar Resposta</button>';
    window._replyModal = UI.modal({ title: 'Responder Avaliação', body: body, footer: footer });
  }

  function _saveReply(id) {
    var reply = (document.getElementById('rev-reply') || {}).value || '';
    DB.update('reviews', id, { reply: reply }).then(function () {
      UI.toast('Resposta salva!', 'success');
      if (window._replyModal) window._replyModal.close();
      _renderAvaliacoes();
    });
  }

  function destroy() {}

  return {
    render: render, destroy: destroy,
    _switchSub: _switchSub,
    _openPromoModal: _openPromoModal, _selectPromoType: _selectPromoType, _togglePromoActive: _togglePromoActive, _togglePromoStatus: _togglePromoStatus, _duplicatePromo: _duplicatePromo, _savePromo: _savePromo, _togglePromo: _togglePromo, _deletePromo: _deletePromo,
    _refreshPromoPreview: _refreshPromoPreview, _filterPromoProducts: _filterPromoProducts, _setPromoSearch: _setPromoSearch, _setPromoStatus: _setPromoStatus, _setPromoTypeFilter: _setPromoTypeFilter, _setPromoPeriod: _setPromoPeriod, _setPromoPeriodStart: _setPromoPeriodStart, _setPromoPeriodEnd: _setPromoPeriodEnd, _setPromoPage: _setPromoPage, _setPromoPageSize: _setPromoPageSize, _clearPromoFilters: _clearPromoFilters,
    _openCuponModal: _openCuponModal, _saveCupon: _saveCupon, _deleteCupon: _deleteCupon, _copyCouponLink: _copyCouponLink, _refreshCouponValueAdornment: _refreshCouponValueAdornment, _setCouponSearch: _setCouponSearch, _setCouponStatus: _setCouponStatus, _setCouponType: _setCouponType, _setCouponPage: _setCouponPage, _setCouponPageSize: _setCouponPageSize, _clearCouponFilters: _clearCouponFilters,
    _renderUpsell: _renderUpsell, _openUpsellModal: _openUpsellModal, _saveUpsell: _saveUpsell, _deleteUpsell: _deleteUpsell, _toggleUpsellStatus: _toggleUpsellStatus, _duplicateUpsell: _duplicateUpsell, _refreshUpsellAnalysis: _refreshUpsellAnalysis, _selectUpsellType: _selectUpsellType,
    _setUpsellSearch: _setUpsellSearch, _setUpsellStatus: _setUpsellStatus, _setUpsellPeriod: _setUpsellPeriod, _setUpsellPeriodStart: _setUpsellPeriodStart, _setUpsellPeriodEnd: _setUpsellPeriodEnd, _setUpsellPage: _setUpsellPage, _setUpsellPageSize: _setUpsellPageSize, _setUpsellPerfPeriod: _setUpsellPerfPeriod, _setUpsellPerfStart: _setUpsellPerfStart, _setUpsellPerfEnd: _setUpsellPerfEnd, _setUpsellTab: _setUpsellTab, _clearUpsellFilters: _clearUpsellFilters,
    _setUpsellProductSearch: _setUpsellProductSearch, _syncUpsellProductSearch: _syncUpsellProductSearch, _syncUpsellMomentByLocations: _syncUpsellMomentByLocations, _syncUpsellDateRules: _syncUpsellDateRules, _toggleUpsellRuleHelp: _toggleUpsellRuleHelp,
    _selectUpsellBenefit: _selectUpsellBenefit, _pickUpsellBenefit: _pickUpsellBenefit, _approveReview: _approveReview, _rejectReview: _rejectReview, _replyReview: _replyReview, _saveReply: _saveReply, _reviewAction: _reviewAction,
    _pointsConfigData: _pointsConfigData, _pointsRefresh: _pointsRefresh, _pointsOrderBlockHtml: _pointsOrderBlockHtml, _pointsApplyDiscount: _pointsApplyDiscount, _pointsGrantForOrder: _pointsGrantForOrder, _openPointsConfigModal: _openPointsConfigModal, _savePointsConfig: _savePointsConfig,
    _pointsSetTab: _pointsSetTab, _pointsSetSearch: _pointsSetSearch, _pointsSetBalance: _pointsSetBalance, _pointsSetMovement: _pointsSetMovement, _pointsClearFilters: _pointsClearFilters, _openPointsCustomerModal: _openPointsCustomerModal, _pointsSwitchCustomerTab: _pointsSwitchCustomerTab,
    _setPointsPerfPeriod: _setPointsPerfPeriod, _setPointsPerfStart: _setPointsPerfStart, _setPointsPerfEnd: _setPointsPerfEnd,
    _pointsToggleExpirationField: _pointsToggleExpirationField, _pointsMarkConfigDirty: _pointsMarkConfigDirty, _pointsRefreshConfigPreview: _pointsRefreshConfigPreview
  };
})();
