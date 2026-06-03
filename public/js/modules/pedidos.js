// js/modules/pedidos.js
window.Modules = window.Modules || {};
Modules.Pedidos = (function () {
  'use strict';

  var _unsubscribe = null;
  var _orders = [];
  var _customers = [];
  var _reviews = [];
  var _products = [];
  var _variantGroups = [];
  var _stockRecipes = [];
  var _promotions = [];
  var _generalConfig = {};
  var _templateConfig = {};
  var _operationConfig = {};
  var _domainConfig = {};
  var _financeConfig = {};
  var _tpvConfig = {};
  var _zones = [];
  var _canais = [];
  var _activeTab = 'cozinha';
  var _reviewsHostId = '';
  var _alarmOn = _readAlarmPreference();
  var _audioCtx = null;
  var _knownIds = null;
  var _financeScaleRepairIds = {};
  var _kitchenModeOverlay = null;
  var _kitchenDetailId = null;
  var _detailChecklistDirty = {};
  var _manualOrderCustomerListOpen = false;
  var _reviewUi = {
    query: '',
    status: 'all',
    period: 'all',
    stars: 'all',
    periodStart: '',
    periodEnd: '',
    page: 1,
    pageSize: 10
  };

  function _adminPanelStyle(extra) {
    return 'background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.055);font-family:Manrope,Inter,sans-serif;' + (extra || '');
  }

  function _adminInputStyle(extra) {
    return 'width:100%;height:40px;border:0;background:transparent;outline:none;font-size:14px;font-weight:400;font-family:Manrope,Inter,sans-serif;color:#1F1F1F;box-sizing:border-box;' + (extra || '');
  }

  function _adminSelectStyle(extra) {
    return _adminInputStyle('appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:30px;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 4px center;background-size:14px;' + (extra || ''));
  }

  function _adminFilterField(label, html) {
    return '<label style="display:block;min-width:0;"><span style="font-size:11px;font-weight:650;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;display:block;">' + _esc(label) + '</span><div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;" onfocusin="this.style.background=\'#fff\';this.style.borderColor=\'#D9AAA1\';this.style.boxShadow=\'0 0 0 3px rgba(180,35,24,.08)\'" onfocusout="this.style.background=\'#FFFCF8\';this.style.borderColor=\'#E8DCD7\';this.style.boxShadow=\'none\'">' + html + '</div></label>';
  }
  var _ui = {
    q: '',
    status: 'all',
    channel: 'all',
    kitchenDate: '',
    kitchenPeriod: 'all'
  };
  var _clientPage = 1;
  var _clientPageSize = 10;
  var _ordersPage = 1;
  var _ordersPageSize = 10;
  var _kitchenPage = 1;
  var _kitchenPageSize = 10;
  var _manualOrderState = {
    customerQuery: '',
    productQuery: '',
    productFilter: 'all',
    productCategory: '',
    items: [],
    selectedCustomerId: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerAddressNumber: '',
    customerAddressComplement: '',
    customerNeighborhood: '',
    customerCity: '',
    customerProvince: '',
    customerCountry: '',
    customerPostalCode: '',
    customerZone: '',
    selectedDeliveryAddressId: '',
    customerPreferences: '',
    customerNotes: '',
    type: 'delivery',
    channel: 'manual',
    source: 'manual',
    paymentMethod: '',
    paymentStatus: 'previsto',
    paidAmount: 0,
    orderTime: '',
    deliveryDate: '',
    deliveryTime: '',
    madeToOrder: false,
    productionLeadDays: 0,
    adjustment: 0,
    shippingFee: 0,
    priceOrigin: 'manual'
  };

  var COLUMNS = [
    { key: 'Pendente', label: 'Pendente', color: '#D97706', bg: '#FFF7ED' },
    { key: 'Confirmado', label: 'Confirmado', color: '#2563EB', bg: '#EFF6FF' },
    { key: 'Em preparação', label: 'Em preparação', color: '#7C3AED', bg: '#F5F3FF' },
    { key: 'Em camino', label: 'Em caminho', color: '#0891B2', bg: '#ECFEFF' },
    { key: 'Listo para recoger', label: 'Pronto para retirada', color: '#059669', bg: '#ECFDF5' },
    { key: 'Entregado', label: 'Entregue', color: '#1A9E5A', bg: '#EDFAF3' },
    { key: 'Cancelado', label: 'Cancelado', color: '#C4362A', bg: '#FFF0EE' }
  ];

  function _statusMeta(status) {
    var key = String(status || 'Pendente');
    return COLUMNS.find(function (c) { return c.key === key; }) || COLUMNS[0];
  }

  var WA_MSGS = {
    'Pendente': function (o) { return _orderStatusWhatsappMessage(o, 'Pendente'); },
    'Confirmado': function (o) { return _orderStatusWhatsappMessage(o, 'Confirmado'); },
    'Em preparação': function (o) { return _orderStatusWhatsappMessage(o, 'Em preparação'); },
    'Em camino': function (o) { return _orderStatusWhatsappMessage(o, 'Em camino'); },
    'Listo para recoger': function (o) { return _orderStatusWhatsappMessage(o, 'Listo para recoger'); },
    'Entregado': function (o) { return _orderStatusWhatsappMessage(o, 'Entregado'); },
    'Cancelado': function (o) { return _orderStatusWhatsappMessage(o, 'Cancelado'); }
  };

  function render(sub) {
    _activeTab = _normalizeTab(sub || 'cozinha');
    _reviewsHostId = '';
    if (_activeTab === 'avaliacoes' && window.Router && typeof Router.navigate === 'function') {
      Router.navigate('loja-online/avaliacoes');
      return;
    }
    var app = document.getElementById('app');
    try {
      app.innerHTML = '<div id="pedidos-root" style="display:flex;flex-direction:column;height:100%;">' +
        '<div id="pedidos-content" style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:auto;background:#fff;"></div>' +
        '</div>';

      _bootstrapSchema();
      _subscribe();
      _loadMeta();
      _paintActive();
    } catch (err) {
      console.error('Pedidos render error', err);
      app.innerHTML = '<div style="padding:24px;background:#fff;color:#C4362A;font-family:inherit;">Erro ao carregar Pedidos: ' + _esc(err && err.message ? err.message : 'falha ao montar a tela') + '</div>';
    }
  }

  function _switchTab(key) {
    var route = _tabRoute(key);
    if (window.Router && typeof Router.navigate === 'function') {
      Router.navigate(route);
      return;
    }
    _activeTab = _normalizeTab(key);
    _paintActive();
  }

  function _normalizeTab(key) {
    key = String(key || 'demanda');
    if (key === 'demanda') return 'cozinha';
    if (key === 'todos' || key === 'lista' || key === 'pedidos') return 'lista';
    if (key === 'clientes') return 'clientes';
    if (key === 'avaliacoes' || key === 'review' || key === 'reviews') return 'avaliacoes';
    if (key === 'cozinha') return 'cozinha';
    return 'cozinha';
  }

  function _tabRoute(key) {
    var tab = _normalizeTab(key);
    if (tab === 'lista') return 'pedidos/lista';
    if (tab === 'clientes') return 'pedidos/clientes';
    if (tab === 'avaliacoes') return 'loja-online/avaliacoes';
    return 'pedidos/cozinha';
  }

  function _loadMeta() {
    return Promise.all([
      DB.getAll('store_customers').catch(function () { return []; }),
      DB.getAll('reviews').catch(function () { return []; }),
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('promotions').catch(function () { return []; }),
      DB.getAll('promocoes').catch(function () { return []; }),
      DB.getAll('variantGroups').catch(function () { return []; }),
      DB.getDocRoot ? DB.getDocRoot('config', 'geral').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'financeiro').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'zonas').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'template').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'canais_venda').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'dominio').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'tpv').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'operacao').catch(function () { return null; }) : Promise.resolve(null)
    ]).then(function (res) {
      _customers = res[0] || [];
      _reviews = res[1] || [];
      _products = (res[2] || []).slice();
      _stockRecipes = (res[3] || []).slice();
      _promotions = _mergeManualPromotions(res[4], res[5]);
      _variantGroups = (res[6] || []).slice();
      _generalConfig = res[7] || {};
      _financeConfig = res[8] || {};
      _zones = _normalizeZones(res[9]);
      if (!_zones.length) _zones = _normalizeZones(res[10]);
      _templateConfig = res[10] || {};
      _tpvConfig = res[13] || {};
      _operationConfig = res[14] || {};
      _canais = _normalizeCanais(res[11]);
      _domainConfig = res[12] || {};
      _syncOrderCustomerLinks(_orders);
      if (!_paintReviewsHost()) _paintActive();
    }).catch(function () {
      _customers = [];
      _reviews = [];
      _products = [];
      _variantGroups = [];
      _templateConfig = {};
      _operationConfig = {};
      _domainConfig = {};
      _stockRecipes = [];
      _promotions = [];
      _generalConfig = {};
      _financeConfig = {};
      _tpvConfig = {};
      _zones = [];
      _canais = _normalizeCanais(null);
      _syncOrderCustomerLinks(_orders);
      if (!_paintReviewsHost()) _paintActive();
    });
  }

  function _mergeManualPromotions(primary, legacy) {
    var out = [];
    var seen = {};
    [primary || [], legacy || []].forEach(function (group) {
      (group || []).forEach(function (promo) {
        if (!promo) return;
        var key = String(promo.id || promo._id || promo.promoId || promo.code || promo.slug || [
          promo.name || promo.title || '',
          promo.type || promo.tipo || '',
          promo.startDate || promo.startsAt || '',
          promo.endDate || promo.endsAt || ''
        ].join('|'));
        if (key && seen[key]) return;
        if (key) seen[key] = true;
        out.push(promo);
      });
    });
    return out;
  }

  function _renderCatalogoAvaliacoes(targetId) {
    _activeTab = 'avaliacoes';
    _reviewsHostId = targetId || 'catalogo-content';
    var content = document.getElementById(_reviewsHostId);
    if (!content) return;
    content.innerHTML = '<div style="padding:24px 18px;">' +
      '<div style="max-width:1180px;margin:0 auto;background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);padding:22px;text-align:center;color:#6F6860;font-family:Manrope,Inter,sans-serif;font-size:14px;">Carregando avaliações...</div>' +
    '</div>';
    _loadMeta().then(function () {
      _paintReviewsHost();
    });
  }

  function _paintReviewsHost() {
    if (!_reviewsHostId) return false;
    var content = document.getElementById(_reviewsHostId);
    if (!content) return false;
    content.innerHTML = _renderAvaliacoesPage();
    _renderAvaliacoesTab();
    return true;
  }

  function _bootstrapSchema() {
    if (!DB || !DB.ensureSchemaDoc) return;
    DB.ensureSchemaDoc('pedidos').catch(function () {});
  }

  function _subscribe() {
    if (_unsubscribe) _unsubscribe();
    _unsubscribe = DB.listen('orders', function (orders) {
      // Check for new orders
      if (_knownIds !== null) {
        orders.forEach(function (o) {
          if (!_knownIds.has(o.id) && o.status === 'Pendente') {
            _playAlarm();
          }
        });
      }
      _knownIds = new Set(orders.map(function (o) { return o.id; }));
      _orders = (orders || []).map(_ensureOrderFiscalDefaults);
      _syncOrderCustomerLinks(_orders);
      _repairInflatedFinanceMovements(_orders);
      _paintActive();
    });
  }

  function _paintActive() {
    var content = document.getElementById('pedidos-content');
    if (!content) return;
    try {
      if (_activeTab === 'lista') {
        content.innerHTML = _renderPedidosPage();
        _renderOrdersList();
        return;
      }
      if (_activeTab === 'clientes') {
        content.innerHTML = _renderClientesPage();
        _renderClientesTab();
        return;
      }
      if (_activeTab === 'avaliacoes') {
        content.innerHTML = _renderAvaliacoesPage();
        _renderAvaliacoesTab();
        return;
      }
      content.innerHTML = _renderCozinhaPage();
      _paintKitchenList();
    } catch (err) {
      console.error('Pedidos paint error', err);
      content.innerHTML = '<div style="padding:20px;background:#fff;color:#C4362A;border-radius:14px;margin:18px;">Erro ao montar a tela de pedidos: ' + _esc(err && err.message ? err.message : 'falha interna') + '</div>';
    }
  }

  function _renderCozinhaPage() {
    var baseOrders = _baseKitchenOrders();
    var orders = _activeKitchenOrders();
    var total = baseOrders.reduce(function (sum, o) { return sum + _num(o.total || o.amount || o.grandTotal); }, 0);
    var pending = baseOrders.filter(function (o) { return String(o.status || 'Pendente') === 'Pendente'; }).length;
    var preparing = baseOrders.filter(function (o) { return String(o.status || '') === 'Em preparação'; }).length;
    var active = baseOrders.length;
    return '<div class="bf-page" style="padding:24px;display:flex;flex-direction:column;gap:16px;min-height:0;flex:1;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Cozinha</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Acompanhe pedidos ativos, avance status e opere a produção com leitura rápida.</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button id="alarm-btn" onclick="Modules.Pedidos._toggleAlarm()" title="Ligar ou desligar alarme" style="height:38px;padding:0 12px;border:1px solid ' + (_alarmOn ? '#E4CFC8' : '#E6E1D8') + ';border-radius:10px;background:' + (_alarmOn ? '#FFF7F5' : '#fff') + ';color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;display:inline-flex;align-items:center;gap:6px;"><span class="mi" style="font-size:17px;color:' + (_alarmOn ? '#B42318' : '#8A7E7C') + ';">notifications</span>Alarme: ' + (_alarmOn ? 'ON' : 'OFF') + '</button>' +
          '<button onclick="Modules.Pedidos._testAlarm()" style="height:38px;padding:0 12px;border:1px solid #E6E1D8;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Testar</button>' +
          '<button onclick="Modules.Pedidos._openKitchenMode()" style="height:38px;padding:0 14px;border:1px solid #E6E1D8;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Modo cozinha</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
        _kitchenKpiCard('Pedidos ativos', active, 'somente pedidos do cardápio', 'receipt_long', '#8A6F5A') +
        _kitchenKpiCard('Pendentes', pending, 'aguardando confirmação', 'pending_actions', '#B45309') +
        _kitchenKpiCard('Em preparo', preparing, 'produção em andamento', 'skillet', '#7C3AED') +
        _kitchenKpiCard('Faturamento ativo', active ? UI.fmt(total) : '—', 'pedidos ainda não finalizados', 'payments', '#B42318') +
      '</div>' +
      '<div style="' + _adminPanelStyle() + '">' +
        '<div style="display:grid;grid-template-columns:minmax(260px,1fr) minmax(180px,240px) minmax(150px,190px) minmax(160px,220px);gap:11px 12px;align-items:end;">' +
          _adminFilterField('Buscar', '<input id="pedidos-kitchen-search" type="search" value="' + _esc(_ui.q || '') + '" oninput="Modules.Pedidos._setUi(\'q\', this.value)" placeholder="Pedido, cliente, telefone ou item" autocomplete="off" style="' + _adminInputStyle() + '">') +
          _adminFilterField('Status', '<select onchange="Modules.Pedidos._setUi(\'status\', this.value)" style="' + _adminSelectStyle() + '">' +
              _orderFilterOptions(['all', 'Pendente', 'Confirmado', 'Em preparação', 'Em camino', 'Listo para recoger'], _ui.status, 'Todos os status') +
            '</select>') +
          _adminFilterField('Data', '<input type="date" value="' + _esc(_ui.kitchenDate || '') + '" onchange="Modules.Pedidos._setUi(\'kitchenDate\', this.value)" style="' + _adminInputStyle() + '">') +
          _adminFilterField('Período', '<select onchange="Modules.Pedidos._setUi(\'kitchenPeriod\', this.value)" style="' + _adminSelectStyle() + '">' +
              _kitchenPeriodOptions(_ui.kitchenPeriod) +
            '</select>') +
        '</div>' +
        ((_ui.q || _ui.status !== 'all' || _ui.kitchenDate || _ui.kitchenPeriod !== 'all') ? '<div style="display:flex;justify-content:flex-start;margin-top:11px;"><button type="button" onclick="Modules.Pedidos._clearKitchenFilters()" style="height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>' : '') +
      '</div>' +
      '<section style="display:flex;flex-direction:column;gap:10px;min-height:0;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Pedidos ativos</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Lista operacional da cozinha com ações rápidas de status.</div></div>' +
        '<div id="kitchen-list" style="display:flex;flex-direction:column;gap:10px;"></div>' +
      '</section>' +
    '</div>';
  }

  function _renderPedidosPage() {
    var orders = _filteredOrders();
    var stats = _allOrdersStats(orders);
    return '<div class="bf-page" style="padding:24px;display:flex;flex-direction:column;gap:16px;min-height:0;flex:1;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Pedidos</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Acompanhe o histórico de pedidos, clientes vinculados, avaliações e canais de venda.</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button onclick="Modules.Pedidos._openNewOrder()" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">+ Novo pedido</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
        _kitchenKpiCard('Pedidos filtrados', stats.totalOrders, 'resultado da busca atual', 'receipt_long', '#8A6F5A') +
        _kitchenKpiCard('Clientes ligados', stats.customerHits, 'pedidos com cliente reconhecido', 'person_search', '#6C8777') +
        _kitchenKpiCard('Com avaliação', stats.reviewedOrders, 'vinculados a reviews', 'reviews', '#B45309') +
        _kitchenKpiCard('Ticket médio', stats.ticketOrders ? UI.fmt(stats.avgTicket) : '—', 'pedidos válidos filtrados', 'payments', '#B42318') +
      '</div>' +
      '<div style="' + _adminPanelStyle() + '">' +
        '<div style="display:grid;grid-template-columns:minmax(260px,1fr) minmax(180px,240px) minmax(190px,260px);gap:11px 12px;align-items:end;">' +
          _adminFilterField('Buscar', '<input id="pedidos-search" type="search" value="' + _esc(_ui.q) + '" oninput="Modules.Pedidos._setUi(\'q\', this.value)" placeholder="Pedido, cliente, telefone ou item" autocomplete="off" style="' + _adminInputStyle() + '">') +
          _adminFilterField('Status', '<select onchange="Modules.Pedidos._setUi(\'status\', this.value)" style="' + _adminSelectStyle() + '">' +
              _orderFilterOptions(['all'].concat(COLUMNS.map(function (c) { return c.key; })), _ui.status, 'Todos os status') +
            '</select>') +
          _adminFilterField('Canal', '<select onchange="Modules.Pedidos._setUi(\'channel\', this.value)" style="' + _adminSelectStyle() + '">' +
              _orderFilterOptions(['all', 'cardapio', 'template', 'store', 'whatsapp', 'delivery', 'pickup'], _ui.channel, 'Todos os canais') +
            '</select>') +
        '</div>' +
        ((_ui.q || _ui.status !== 'all' || _ui.channel !== 'all') ? '<div style="display:flex;justify-content:flex-start;margin-top:11px;"><button type="button" onclick="Modules.Pedidos._clearOrderFilters()" style="height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>' : '') +
      '</div>' +
      '<section style="display:flex;flex-direction:column;gap:10px;min-height:0;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Lista de pedidos</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Histórico operacional com acesso aos detalhes, cliente e comunicação.</div></div>' +
        '<div id="orders-list" style="display:flex;flex-direction:column;gap:10px;min-height:0;"></div>' +
      '</section>' +
    '</div>';
  }

  function _paintTodosPanels() {
    var list = document.getElementById('orders-list');
    if (list) list.innerHTML = _renderOrdersListHTML();
  }

  function _paintKitchenList() {
    var wrap = document.getElementById('kitchen-list');
    if (!wrap) return;
    var orders = _activeKitchenOrders();
    if (!orders.length) {
      wrap.innerHTML = '<div style="background:#fff;border:1px dashed #E4D7D4;border-radius:16px;padding:28px;text-align:center;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum pedido ativo na cozinha</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Quando houver pedidos em aberto, eles aparecerão aqui para acompanhamento e mudança de status.</div></div>';
      return;
    }
    var totalPages = Math.max(1, Math.ceil(orders.length / _kitchenPageSize));
    if (_kitchenPage > totalPages) _kitchenPage = totalPages;
    if (_kitchenPage < 1) _kitchenPage = 1;
    var start = (_kitchenPage - 1) * _kitchenPageSize;
    var pageItems = orders.slice(start, start + _kitchenPageSize);
    var rows = pageItems.map(function (o) {
      var phoneHref = _orderPhoneHref(o);
      var statusMeta = _statusMeta(o.status);
      var typeTone = o.type === 'pickup' ? '#059669' : '#2563EB';
      var typeLabel = o.type === 'pickup' ? 'Retirada' : 'Entrega';
      var customerLabel = o.customerName || o.clientName || o.name || 'Pedido';
      return '<tr onclick="Modules.Pedidos._openDetail(\'' + _esc(o.id) + '\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
        '<td style="padding:12px 16px;vertical-align:middle;min-width:260px;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(customerLabel) + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">' + _esc(_orderDisplayId(o) || _orderScheduleInfo(o).text || 'Pedido') + '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:' + statusMeta.color + ';font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:' + statusMeta.color + ';display:inline-block;"></span>' + _esc(_orderStatusLabel(o.status)) + '</span>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:' + typeTone + ';font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:' + typeTone + ';display:inline-block;"></span>' + _esc(typeLabel) + '</span>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;"><div style="font-size:14px;font-weight:600;color:#1F1F1F;">' + _esc(_orderScheduleInfo(o).text) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + (o.address ? _esc(o.address) : 'Sem endereço') + '</div></td>' +
        '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + UI.fmt(_num(o.total || o.amount || o.grandTotal)) + '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;text-align:right;white-space:nowrap;">' +
          '<div style="display:inline-flex;align-items:center;gap:6px;" onclick="event.stopPropagation();">' +
            (phoneHref ? '<a href="' + _esc(phoneHref) + '" target="_blank" rel="noopener" title="WhatsApp" onclick="event.stopPropagation();" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#1A9E5A;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);text-decoration:none;"><span class="mi" style="font-size:14px;">chat</span></a>' : '') +
            '<button type="button" title="Preparar" onclick="event.stopPropagation();Modules.Pedidos._quickStatus(\'' + _esc(o.id) + '\', \'Em preparação\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#7C3AED;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">restaurant</span></button>' +
            '<button type="button" title="Pronto" onclick="event.stopPropagation();Modules.Pedidos._quickStatus(\'' + _esc(o.id) + '\', \'Listo para recoger\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#059669;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">done</span></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
    wrap.innerHTML = '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="overflow:auto;">' +
        '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:980px;">' +
          '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Pedido</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Status</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Tipo</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Horário / endereço</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Total</th>' +
            '<th style="text-align:right;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Ações</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>' +
      _paginationHtml(orders.length, _kitchenPage, _kitchenPageSize, '_setKitchenPage', '_setKitchenPageSize') +
    '</div>';
  }

  function _baseKitchenOrders() {
    return _cardapioOrders().filter(function (o) {
      var st = String(o.status || 'Pendente');
      return st !== 'Entregado' && st !== 'Cancelado';
    });
  }

  function _activeKitchenOrders() {
    return _baseKitchenOrders().filter(_kitchenOrderMatchesFilters).filter(_kitchenDateMatches);
  }

  function _renderOrdersList() {
    _paintTodosPanels();
  }

  function _paginationHtml(total, page, pageSize, pageFn, pageSizeFn) {
    if (!total) return '';
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var start = total ? ((page - 1) * pageSize) + 1 : 0;
    var end = Math.min(start + pageSize - 1, total);
    var pageSizeOptions = [10, 12, 24, 48].map(function (n) {
      return '<option value="' + n + '"' + (Number(pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
    }).join('');
    return '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<select onchange="Modules.Pedidos.' + pageSizeFn + '(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">' + pageSizeOptions + '</select>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Pedidos.' + pageFn + '(' + (page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (page > 1 ? '1' : '.45') + ';"' + (page > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Pedidos.' + pageFn + '(' + (page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (page < totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (page < totalPages ? '1' : '.45') + ';"' + (page < totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _renderClientesPage() {
    var stats = _allCustomersStats();
    var filtered = _filteredCustomers();
    var marketing = (_customers || []).filter(function (c) { return c.acceptsMarketing === true; }).length;
    var totalPages = Math.max(1, Math.ceil(filtered.length / _clientPageSize));
    var currentPage = Math.min(Math.max(1, _clientPage), totalPages);
    var cardStyle = 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
    var fieldStyle = 'padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;width:100%;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;';
    var chipStyle = 'display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);';
    return '<div class="bf-page" style="padding:0;display:flex;flex-direction:column;gap:16px;min-height:0;flex:1;font-family:Manrope,Inter,sans-serif;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Clientes</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0 0 10px;max-width:760px;">Clientes identificados a partir dos pedidos, com histórico, ticket, segmentos e avaliações vinculadas.</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<span style="' + chipStyle + '">' + stats.total + ' clientes</span>' +
            '<span style="' + chipStyle + '">' + filtered.length + ' exibidos</span>' +
            '<span style="' + chipStyle + '">' + stats.withOrders + ' com pedidos</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 8px 18px rgba(180,35,24,.20)\';" onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(180,35,24,.18)\';" onclick="event.stopPropagation();Modules.Pedidos._openClientEdit(null)" class="bf-btn-primary" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Adicionar cliente</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
        _kitchenKpiCard('Clientes', stats.total, 'base vinculada aos pedidos', 'groups', '#8A6F5A') +
        _kitchenKpiCard('Com pedidos', stats.withOrders, 'clientes reconhecidos', 'receipt_long', '#6C8777') +
        _kitchenKpiCard('Com avaliações', stats.withReviews, 'clientes com review', 'reviews', '#B45309') +
        _kitchenKpiCard('Ticket médio', stats.avgTicket ? UI.fmt(stats.avgTicket) : '—', 'base total de pedidos', 'payments', '#B42318') +
      '</div>' +
      '<div style="' + cardStyle + '">' +
        '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end;">' +
          '<div style="display:grid;grid-template-columns:minmax(320px,1.6fr) minmax(180px,.8fr) minmax(160px,.7fr) minmax(150px,.7fr) auto;gap:10px 12px;flex:1;align-items:end;">' +
            '<div><input id="pedidos-clientes-search" type="search" value="' + _esc(_ui.q) + '" oninput="Modules.Pedidos._setUi(\'q\', this.value)" placeholder="Buscar cliente, telefone, email ou pedido..." autocomplete="off" style="' + fieldStyle + 'height:40px;"></div>' +
            '<div><select onchange="Modules.Pedidos._setUi(\'status\', this.value)" style="' + fieldStyle + 'height:40px;">' +
              _orderFilterOptions(['all', 'ativo', 'recorrente', 'inativo', 'bloqueado'], _ui.status, 'Todos os status') +
            '</select></div>' +
            '<div><select onchange="Modules.Pedidos._setUi(\'segment\', this.value)" style="' + fieldStyle + 'height:40px;">' +
              _filterOptions(['', 'novo', 'recorrente', 'vip', 'inativo', 'sem_pedido'], _ui.segment, 'Segmento') +
            '</select></div>' +
            '<div><select onchange="Modules.Pedidos._setUi(\'origin\', this.value)" style="' + fieldStyle + 'height:40px;">' +
              _originOptions(_ui.origin) +
            '</select></div>' +
            ((_ui.q || _ui.status !== 'all' || _ui.segment || _ui.origin) ? '<button type="button" onclick="Modules.Pedidos._clearClientFilters()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Limpar filtros</button>' : '') +
          '</div>' +
        '</div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
          '<span style="' + chipStyle + '">' + filtered.length + ' clientes exibidos</span>' +
          '<span style="' + chipStyle + '">' + stats.withReviews + ' com avaliações</span>' +
          '<span style="' + chipStyle + '">' + marketing + ' aceitam marketing</span>' +
          '<span style="' + chipStyle + '">Página ' + currentPage + ' de ' + totalPages + '</span>' +
        '</div>' +
      '</div>' +
      '<section style="display:flex;flex-direction:column;gap:10px;min-height:0;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Lista de clientes</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Histórico consolidado dos clientes reconhecidos a partir dos pedidos.</div></div>' +
        '<div id="clientes-tab-list"></div>' +
      '</section>' +
    '</div>';
  }

  function _renderClientesTab() {
    var wrap = document.getElementById('clientes-tab-list');
    if (!wrap) return;
    var list = _filteredCustomers();
    var totalPages = Math.max(1, Math.ceil(list.length / _clientPageSize));
    if (_clientPage > totalPages) _clientPage = totalPages;
    if (_clientPage < 1) _clientPage = 1;
    var start = (_clientPage - 1) * _clientPageSize;
    var pageItems = list.slice(start, start + _clientPageSize);
    var paginationHtml = _paginationHtml(list.length, _clientPage, _clientPageSize, '_setClientPage', '_setClientPageSize');
    var table = pageItems.length ? pageItems.map(function (c) {
      var cid = _customerRecordId(c);
      var s = _customerStats(c);
      var reviews = _customerReviewStats(c);
      var avatar = '<div style="width:48px;height:48px;border-radius:12px;background:' + _avatarColor(c.name) + ';color:#fff;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.03);">' + _esc(_initials(c.name)) + '</div>';
      var segmentTone = s.segment === 'vip' ? '#B45309' : s.segment === 'recorrente' ? '#1A9E5A' : s.segment === 'inativo' ? '#6F6860' : '#2563EB';
      return '<tr onclick="event.stopPropagation();Modules.Pedidos._openClientProfile(\'' + _esc(cid) + '\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
        '<td style="padding:14px 16px;vertical-align:middle;"><input type="checkbox" onclick="event.stopPropagation()" style="width:16px;height:16px;accent-color:#B42318;"></td>' +
        '<td style="padding:12px 16px;vertical-align:middle;min-width:280px;">' +
          '<div style="display:flex;align-items:center;gap:12px;min-width:0;">' + avatar +
            '<div style="min-width:0;">' +
              '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;">' + _esc(c.name || 'Cliente') + '</div>' +
              '<div style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;max-width:300px;">' + _esc(c.email || 'Sem e-mail') + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + _esc(c.phone || c.whatsapp || 'Sem telefone') + '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;"><span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:' + segmentTone + ';font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:' + segmentTone + ';display:inline-block;"></span>' + _esc(_segmentLabel(s.segment)) + '</span></td>' +
        '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + s.ordersCount + ' pedido(s)</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;text-align:left;white-space:nowrap;"><div style="font-size:14px;font-weight:600;color:#1F1F1F;">' + UI.fmt(s.totalSpent) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc(s.lastOrderLabel || 'Sem pedido') + '</div></td>' +
        '<td style="padding:13px 16px;vertical-align:middle;">' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;" onclick="event.stopPropagation();">' +
            (reviews.count ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#B45309;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span class="mi" style="font-size:14px;color:#B6925E;">star</span>' + reviews.avg.toFixed(1) + '</span>' : '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:#A39B90;font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span class="mi" style="font-size:14px;">star_border</span>Sem review</span>') +
          '</div>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;text-align:right;white-space:nowrap;">' +
          '<div style="display:inline-flex;align-items:center;gap:6px;" onclick="event.stopPropagation();">' +
            '<button type="button" title="Ver" onclick="event.stopPropagation();Modules.Pedidos._openClientProfile(\'' + _esc(cid) + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">visibility</span></button>' +
            '<button type="button" title="Histórico" onclick="event.stopPropagation();Modules.Pedidos._openClientHistory(\'' + _esc(cid) + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">history</span></button>' +
            '<button type="button" title="Editar" onclick="event.stopPropagation();Modules.Pedidos._openClientEdit(\'' + _esc(cid) + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#B42318;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">edit</span></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('') : '';
    wrap.innerHTML = list.length ? '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="overflow:auto;">' +
        '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:920px;font-family:Manrope,Inter,sans-serif;">' +
          '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
              '<th style="width:44px;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;"><input type="checkbox" disabled style="width:16px;height:16px;accent-color:#B42318;"></th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Cliente</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Telefone</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Segmento</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Pedidos</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Total</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Avaliação</th>' +
              '<th style="text-align:right;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Ações</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + table + '</tbody>' +
        '</table>' +
      '</div>' +
      paginationHtml +
    '</div>' : '<section style="background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);text-align:center;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum cliente encontrado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Tente ajustar a busca, os filtros ou a ordenação.</div></section>';
  }

  function _filteredCustomers() {
    var q = String(_ui.q || '').trim().toLowerCase();
    var status = String(_ui.status || 'all').toLowerCase();
    var segment = String(_ui.segment || '').toLowerCase();
    var origin = String(_ui.origin || '').toLowerCase();
    return (_customers || []).slice().sort(function (a, b) {
      var sa = _customerStats(a);
      var sb = _customerStats(b);
      return (sb.totalSpent || 0) - (sa.totalSpent || 0) || String(a.name || '').localeCompare(String(b.name || ''));
    }).filter(function (c) {
      var s = _customerStats(c);
      if (status !== 'all' && String(c.status || s.segment || '').toLowerCase() !== status) return false;
      if (segment && String(s.segment || '').toLowerCase() !== segment) return false;
      if (origin && String(c.mainChannel || c.channelName || c.channel || c.origin || '').toLowerCase() !== origin) return false;
      if (!q) return true;
      var orders = _ordersForClient(c);
      var hay = [
        c.name, c.phone, c.email, c.origin, c.mainChannel, c.channelName, c.address, c.neighborhood, c.zone, c.postalCode, c.preferences, c.allergies,
        orders.map(function (o) { return [o.customerName, o.clientName, o.name, _orderChannelLabel(o), o.status].join(' '); }).join(' ')
      ].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function _renderAvaliacoesPage() {
    var filtered = _reviewFilteredList();
    var stats = _reviewSummary(filtered);
    var periodLabel = _reviewPeriodLabel(_reviewUi.period);
    var catalogoMode = !!_reviewsHostId;
    var sectionHint = catalogoMode
      ? 'Aprove comentários confiáveis para aparecerem na loja pública e responda quando quiser reforçar o atendimento.'
      : 'Acompanhe comentários ligados aos pedidos e use as avaliações para melhorar o atendimento.';
    return '<div class="bf-page" style="padding:0;display:flex;flex-direction:column;gap:16px;min-height:0;flex:1;font-family:Manrope,Inter,sans-serif;">' +
      '<div class="bf-page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;">Avaliações da loja</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0 0 10px;max-width:760px;">' + sectionHint + '</p>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
      _reviewKpiCard('Avaliações', stats.total, periodLabel, 'reviews', '#8A6F5A') +
      _reviewKpiCard('Aprovadas', stats.approved, 'visíveis na loja pública', 'verified', '#6C8777') +
      _reviewKpiCard('Pendentes', stats.pending, 'aguardando moderação', 'pending_actions', '#A18362') +
      _reviewKpiCard('Nota média', stats.avg ? stats.avg.toFixed(1) + '/5' : '—', 'todas as avaliações', 'star', '#B42318') +
      '</div>' +
      _reviewToolbarHtml(stats) +
      '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><div style="font-size:14px;font-weight:650;color:#1F1F1F;">Comentários recebidos</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Abra uma avaliação para conferir os detalhes antes de moderar.</div></div><div style="font-size:12px;color:#6F6860;">' + filtered.length + ' exibida' + (filtered.length === 1 ? '' : 's') + '</div></div>' +
        '<div id="reviews-tab-list" style="display:flex;flex-direction:column;gap:12px;"></div>' +
      '</section>' +
      '</div>';
  }

  function _renderAvaliacoesTab() {
    var wrap = document.getElementById('reviews-tab-list');
    if (!wrap) return;
    var list = _reviewFilteredList();
    var paging = _reviewPaging(list);
    var pageSizeOptions = [10, 12, 24, 48].map(function (n) {
      return '<option value="' + n + '"' + (Number(_reviewUi.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
    }).join('');
    var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px 2px 0;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<select onchange="Modules.Pedidos._setReviewPageSize(this.value)" style="' + _reviewAdminSelectStyle('min-width:110px;max-width:110px;height:34px;padding:0 30px 0 10px;font-size:12px;background-color:#fff;color:#6F6860;') + '">' + pageSizeOptions + '</select>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Pedidos._setReviewPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Pedidos._setReviewPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>' : '';
    wrap.innerHTML = list.length ? paging.items.map(function (r) {
      var statusInfo = _reviewStatusLabel(r);
      var stars = Number(r.stars || r.rating || 0) || 0;
      var dateTs = _reviewDateTs(r);
      var summaryText = String(r.comment || r.text || '').trim();
      var sourceLabel = _reviewSourceLabel(r);
      return '<div onclick="Modules.Pedidos._openReview(\'' + _esc(String(r.id || '')) + '\')" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 14px 30px rgba(31,31,31,.075)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 10px 24px rgba(31,31,31,.045)\'" style="cursor:pointer;background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:15px 16px;box-shadow:0 10px 24px rgba(31,31,31,.045);display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;align-items:center;transition:transform .16s ease,box-shadow .16s ease;font-family:Manrope,Inter,sans-serif;">' +
        '<div style="min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
            '<span style="font-size:11px;font-weight:600;padding:5px 9px;border-radius:999px;background:' + statusInfo.bg + ';color:' + statusInfo.tone + ';border:1px solid #EAE4DA;">' + _esc(statusInfo.label) + '</span>' +
            (sourceLabel ? '<span style="font-size:11px;font-weight:500;padding:5px 9px;border-radius:999px;background:#FAF8F4;color:#6F6860;border:1px solid #EAE4DA;">' + _esc(sourceLabel) + '</span>' : '') +
          '</div>' +
          '<div style="font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(r.name || r.customerName || 'Cliente') + '</div>' +
          '<div style="margin-top:5px;color:#B42318;font-size:13px;letter-spacing:.8px;line-height:1;">' + _esc('★'.repeat(stars) + '☆'.repeat(5 - stars)) + ' <span style="font-size:12px;color:#6F6860;font-weight:500;">(' + stars + '/5)</span></div>' +
          (summaryText ? '<div style="margin-top:8px;font-size:13px;color:#3F3430;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + _esc(summaryText) + '</div>' : '') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0;">' +
          '<div style="min-width:0;"><div style="font-size:11px;color:#6F6860;margin-bottom:3px;">Produto</div><div style="font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(r.productName || '—') + '</div></div>' +
          '<div style="min-width:0;"><div style="font-size:11px;color:#6F6860;margin-bottom:3px;">Data</div><div style="font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;">' + _esc(dateTs ? UI.fmtDate(new Date(dateTs)) : '—') + '</div></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;align-items:center;">' + _reviewActionButtons(r, 'list') + '</div>' +
      '</div>';
    }).join('') + paginationHtml : '<section style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);text-align:center;padding:48px 20px;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma avaliação encontrada</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Tente ajustar a busca, os filtros ou o período.</div></section>';
  }

  function _allCustomersStats() {
    var total = (_customers || []).length;
    var withOrders = 0;
    var withReviews = 0;
    var totalSpent = 0;
    (_customers || []).forEach(function (c) {
      var s = _customerStats(c);
      if (s.ordersCount) withOrders += 1;
      totalSpent += s.totalSpent || 0;
      if (_customerReviewStats(c).count) withReviews += 1;
    });
    return {
      total: total,
      withOrders: withOrders,
      withReviews: withReviews,
      avgTicket: total && (_orders || []).length ? totalSpent / (_orders || []).length : 0
    };
  }

  function _allReviewStats() {
    var list = _reviews || [];
    var approved = list.filter(function (r) { return _reviewStatusLabel(r).key === 'approved'; }).length;
    var pending = list.filter(function (r) { return _reviewStatusLabel(r).key === 'pending'; }).length;
    var avg = list.length ? list.reduce(function (s, r) { return s + (Number(r.stars || r.rating || 0) || 0); }, 0) / list.length : 0;
    return { total: list.length, approved: approved, pending: pending, avg: avg };
  }

  function _customerRecordId(customer) {
    return String(customer && (customer.id || customer._id || customer.customerId || customer.clientId || customer.uid || customer.customerUid || customer.docId || '') || '').trim();
  }

  function _withCustomerRecordId(customer) {
    if (!customer || typeof customer !== 'object') return customer;
    var id = _customerRecordId(customer);
    return id && !customer.id ? Object.assign({}, customer, { id: id }) : customer;
  }

  function _findCustomerByRecordId(id) {
    var wanted = String(id || '').trim();
    if (!wanted) return null;
    return (_customers || []).map(_withCustomerRecordId).find(function (x) {
      return _customerRecordId(x) === wanted;
    }) || null;
  }

  function _openClientProfile(id) {
    var c = _findCustomerByRecordId(id);
    if (!c && window.DB && DB.getAll) {
      DB.getAll('store_customers').then(function (rows) {
        _customers = (rows || []).map(_withCustomerRecordId);
        var found = _findCustomerByRecordId(id);
        if (found) _openClientProfile(id);
        else UI.toast('Cliente não encontrado no cadastro.', 'error');
      }).catch(function () {
        UI.toast('Não foi possível carregar o cadastro do cliente.', 'error');
      });
      return;
    }
    if (!c) {
      UI.toast('Cliente não encontrado no cadastro.', 'error');
      return;
    }
    c = _withCustomerRecordId(c);
    var cid = _customerRecordId(c);
    var s = _customerStats(c);
    var reviews = _customerReviewStats(c);
    var orders = _ordersForClient(c);
    var contact = _firstText(c.phone, c.whatsapp, c.email, '');
    var segmentTone = s.segment === 'vip' ? '#B45309' : s.segment === 'recorrente' ? '#1A9E5A' : s.segment === 'inativo' ? '#6F6860' : '#2563EB';
    var segmentBg = s.segment === 'vip' ? '#FFF7ED' : s.segment === 'recorrente' ? '#EDFAF3' : s.segment === 'inativo' ? '#F2EDED' : '#EEF4FF';
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">' +
          '<div style="display:flex;gap:14px;align-items:center;min-width:0;flex:1;">' +
            '<div style="width:58px;height:58px;border-radius:16px;background:' + _avatarColor(c.name) + ';color:#fff;font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 12px 24px rgba(31,31,31,.10);">' + _esc(_initials(c.name)) + '</div>' +
            '<div style="min-width:0;">' +
              '<div style="font-size:11px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Cadastro do cliente</div>' +
              '<div style="font-size:24px;font-weight:800;line-height:1.1;color:#1F1F1F;">' + _esc(c.name || 'Cliente') + '</div>' +
              '<div style="margin-top:7px;display:flex;gap:7px;flex-wrap:wrap;align-items:center;">' +
                '<span style="display:inline-flex;align-items:center;height:26px;padding:0 9px;border-radius:999px;background:' + segmentBg + ';color:' + segmentTone + ';font-size:11px;font-weight:800;">' + _esc(_segmentLabel(s.segment)) + '</span>' +
                (reviews.count ? '<span style="display:inline-flex;align-items:center;height:26px;padding:0 9px;border-radius:999px;background:#FFF7ED;color:#B45309;font-size:11px;font-weight:800;">' + reviews.avg.toFixed(1) + '★</span>' : '<span style="display:inline-flex;align-items:center;height:26px;padding:0 9px;border-radius:999px;background:#F2EDED;color:#6F6860;font-size:11px;font-weight:800;">Sem review</span>') +
              '</div>' +
              '<div style="margin-top:7px;font-size:13px;color:#6F6860;line-height:1.45;">' + _esc(contact || 'Sem telefone registrado') + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end;">' +
            (contact ? '<a href="' + _whatsUrl(contact, 'Hola ' + (c.name || '') + ', temos uma novidade para você.') + '" target="_blank" rel="noopener" style="height:36px;display:inline-flex;align-items:center;padding:0 12px;border:none;background:#E8FFF1;color:#1A9E5A;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;">WhatsApp</a>' : '<span style="height:36px;display:inline-flex;align-items:center;padding:0 12px;border:none;background:#F2EDED;color:#8A7E7C;border-radius:10px;font-size:12px;font-weight:700;">Sem telefone</span>') +
            '<button onclick="event.stopPropagation();Modules.Pedidos._openClientHistory(\'' + _esc(cid) + '\')" style="height:36px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Histórico</button>' +
            '<button onclick="event.stopPropagation();Modules.Pedidos._openClientEdit(\'' + _esc(cid) + '\')" style="height:36px;border:none;background:#B42318;color:#fff;border-radius:10px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Editar</button>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">' +
        _kitchenKpiCard('Pedidos', s.ordersCount, 'histórico', 'receipt_long', '#6C8777') +
        _kitchenKpiCard('Total', UI.fmt(s.totalSpent), 'comprado', 'payments', '#B42318') +
        _kitchenKpiCard('Avaliações', reviews.count, 'vínculos', 'reviews', '#B45309') +
        _kitchenKpiCard('Nota média', reviews.count ? reviews.avg.toFixed(1) + '/5' : '—', 'reviews', '#8A6F5A') +
      '</section>' +
      '<section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="font-size:11px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;">Contato e perfil</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div style="background:#FAF8F5;border:1px solid #EAE4DA;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:800;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Telefone / WhatsApp</div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">' + _esc(c.phone || c.whatsapp || 'Sem telefone') + '</div></div>' +
          '<div style="background:#FAF8F5;border:1px solid #EAE4DA;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:800;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">E-mail</div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">' + _esc(c.email || '-') + '</div></div>' +
          '<div style="background:#FAF8F5;border:1px solid #EAE4DA;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:800;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Endereço</div><div style="font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.4;">' + _esc(_clientAddress(c) || '-') + '</div></div>' +
          '<div style="background:#FAF8F5;border:1px solid #EAE4DA;border-radius:14px;padding:12px;"><div style="font-size:10px;font-weight:800;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Cidade / Região</div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">' + _esc(_firstText(c.city, c.region, c.zone, '-')) + '</div></div>' +
        '</div>' +
      '</section>' +
      '<section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="font-size:11px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;">Pedidos vinculados</div>' +
        (orders.length ? orders.slice(0, 8).map(function (o) {
          return '<div onclick="Modules.Pedidos._openDetail(\'' + _esc(o.id) + '\')" style="display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid #F1ECE4;cursor:pointer;"><span style="font-size:13px;color:#1F1F1F;">' + _esc(_orderScheduleInfo(o).text) + ' · ' + _esc(_orderChannelLabel(o)) + '</span><strong style="font-size:13px;color:#B42318;">' + UI.fmt(_num(o.total || o.amount || o.grandTotal)) + '</strong></div>';
        }).join('') : '<div style="font-size:13px;color:#8A7E7C;">Sem pedidos vinculados.</div>') +
      '</section>' +
      '</div>';
    window._orderClientProfileModal = UI.modal({
      title: 'Cliente',
      body: body,
      maxWidth: '760px'
    });
    if (window._orderClientProfileModal && window._orderClientProfileModal.el) {
      window._orderClientProfileModal.el.style.setProperty('z-index', _isKitchenModeOpen() ? '20040' : '20040', 'important');
    }
  }

  function _openClientHistory(id) {
    var c = _findCustomerByRecordId(id);
    if (!c) return;
    c = _withCustomerRecordId(c);
    var orders = _ordersForClient(c);
    var s = _customerStats(c);
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">' +
        _kitchenKpiCard('Pedidos', orders.length, 'do cliente', 'receipt_long', '#6C8777') +
        _kitchenKpiCard('Total', orders.length ? UI.fmt(s.totalSpent) : '—', 'comprado', 'payments', '#B42318') +
        _kitchenKpiCard('Ticket médio', orders.length ? UI.fmt(s.avgTicket) : '—', 'por pedido', 'analytics', '#8A6F5A') +
      '</section>' +
      '<section style="background:#fff;border:none;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);overflow:hidden;">' +
        '<div style="padding:14px 16px;border-bottom:1px solid #EAE4DA;"><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Histórico de pedidos</div><div style="font-size:13px;color:#6F6860;margin-top:2px;">Pedidos vinculados a este cliente.</div></div>' +
        (orders.length ? orders.map(function (o) {
          return '<div onclick="Modules.Pedidos._openDetail(\'' + _esc(o.id) + '\')" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:13px 16px;border-bottom:1px solid #F1ECE4;cursor:pointer;">' +
            '<div style="min-width:0;"><div style="font-size:13px;font-weight:800;color:#1F1F1F;">' + _esc(_orderScheduleInfo(o).text) + '</div><div style="font-size:12px;color:#6F6860;margin-top:3px;">' + _esc(_orderChannelLabel(o)) + ' · ' + _esc(_orderStatusLabel(o.status)) + '</div></div>' +
            '<div style="text-align:right;"><div style="font-size:14px;font-weight:800;color:#B42318;">' + UI.fmt(_num(o.total || o.amount || o.grandTotal)) + '</div><div style="font-size:11px;color:#8A7E7C;margin-top:3px;">Ver pedido</div></div>' +
          '</div>';
        }).join('') : '<div style="padding:28px;text-align:center;color:#6F6860;font-size:13px;">Nenhum pedido vinculado.</div>') +
      '</section>' +
    '</div>';
    UI.modal({ title: 'Histórico - ' + (c.name || 'Cliente'), body: body, maxWidth: '760px' });
  }

  function _openClientEdit(id) {
    if (window.Modules && Modules.Clientes && typeof Modules.Clientes._openModal === 'function') {
      Modules.Clientes._openModal(id);
      return;
    }
    UI.toast('Editor de cliente indisponível no momento.', 'error');
  }

  function _openReview(id) {
    var r = (_reviews || []).find(function (x) { return String(x.id || '') === String(id || ''); });
    if (!r) return;
    var stars = Number(r.stars || r.rating || 0) || 0;
    var status = _reviewStatusLabel(r);
    var ts = _reviewDateTs(r);
    var sourceLabel = _reviewSourceLabel(r);
    var cardStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:15px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);';
    var tileStyle = 'background:#FFFCF8;border:1px solid #E8DCD7;border-radius:11px;padding:9px 10px;min-width:0;box-sizing:border-box;';
    var labelStyle = 'font-size:10px;font-weight:500;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;margin-bottom:4px;';
    var valueStyle = 'font-size:13px;font-weight:500;color:#1F1F1F;line-height:1.3;overflow-wrap:anywhere;';
    var starsText = _esc('★'.repeat(Math.max(0, Math.min(5, stars))) + '☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, stars)))));
    UI.modal({
      title: 'Detalhes da avaliação',
      body: '<div style="display:flex;flex-direction:column;gap:9px;max-width:720px;margin:0 auto;font-family:Manrope,Inter,sans-serif;">' +
        '<section style="' + cardStyle + '">' +
          '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start;">' +
            '<div style="min-width:0;">' +
              '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">' +
                '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#FFF7ED;color:#B45309;display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;overflow:hidden;flex:0 0 auto;">star</span>' +
                '<span style="font-size:11px;font-weight:600;color:#7A746B;text-transform:uppercase;letter-spacing:.02em;">Avaliação</span>' +
              '</div>' +
              '<div style="font-size:19px;font-weight:650;line-height:1.15;color:#1F1F1F;overflow-wrap:anywhere;">' + _esc(r.name || r.customerName || 'Cliente') + '</div>' +
              '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:7px;">' +
                '<span style="color:#B6925E;font-size:13px;letter-spacing:.25px;line-height:1;">' + starsText + '</span>' +
                '<span style="font-size:12px;color:#6F6860;font-weight:500;">' + stars + '/5</span>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:flex-start;max-width:220px;">' +
              '<span style="font-size:11px;font-weight:600;padding:5px 9px;border-radius:999px;background:' + status.bg + ';color:' + status.tone + ';border:1px solid rgba(180,35,24,.12);">' + _esc(status.label) + '</span>' +
              (sourceLabel ? '<span style="font-size:11px;font-weight:500;padding:5px 9px;border-radius:999px;background:#FAF8F4;color:#6F6860;border:1px solid #EAE4DA;">' + _esc(sourceLabel) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:10px;">' +
            '<div style="' + tileStyle + '"><div style="' + labelStyle + '">Produto</div><div style="' + valueStyle + '">' + _esc(r.productName || '—') + '</div></div>' +
            '<div style="' + tileStyle + '"><div style="' + labelStyle + '">Data</div><div style="' + valueStyle + 'white-space:nowrap;">' + _esc(ts ? UI.fmtDate(new Date(ts)) : '—') + '</div></div>' +
            (sourceLabel ? '<div style="' + tileStyle + '"><div style="' + labelStyle + '">Origem</div><div style="' + valueStyle + '">' + _esc(sourceLabel) + '</div></div>' : '') +
          '</div>' +
        '</section>' +
        '<section style="' + cardStyle + '">' +
          '<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;">' +
            '<span class="mi" style="width:24px;height:24px;border-radius:8px;background:#FAF8F4;color:#7A746B;display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;overflow:hidden;">format_quote</span>' +
            '<div style="font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.25;">Comentário</div>' +
          '</div>' +
          '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:11px 12px;font-size:14px;color:#1F1F1F;line-height:1.5;">' + _esc(r.comment || r.text || '—') + '</div>' +
        '</section>' +
      '</div>',
      footer: _reviewActionButtons(r, 'modal'),
      maxWidth: '760px'
    });
  }

  function _setUi(key, value) {
    _ui[key] = value || '';
    if (_activeTab === 'clientes') _clientPage = 1;
    if (_activeTab === 'lista') _ordersPage = 1;
    if (_activeTab === 'cozinha') _kitchenPage = 1;
    _paintActive();
  }

  function _setOrdersPage(page) {
    _ordersPage = Math.max(1, parseInt(page, 10) || 1);
    _paintTodosPanels();
  }

  function _setOrdersPageSize(value) {
    _ordersPageSize = Math.max(1, parseInt(value, 10) || 10);
    _ordersPage = 1;
    _paintTodosPanels();
  }

  function _setKitchenPage(page) {
    _kitchenPage = Math.max(1, parseInt(page, 10) || 1);
    _paintKitchenList();
  }

  function _setKitchenPageSize(value) {
    _kitchenPageSize = Math.max(1, parseInt(value, 10) || 10);
    _kitchenPage = 1;
    _paintKitchenList();
  }

  function _setClientPage(page) {
    _clientPage = Math.max(1, parseInt(page, 10) || 1);
    _renderClientesTab();
  }

  function _setClientPageSize(value) {
    _clientPageSize = Math.max(1, parseInt(value, 10) || 10);
    _clientPage = 1;
    _renderClientesTab();
  }

  function _clearKitchenFilters() {
    _ui.q = '';
    _ui.status = 'all';
    _ui.channel = 'all';
    _ui.kitchenDate = '';
    _ui.kitchenPeriod = 'all';
    _kitchenPage = 1;
    _paintActive();
  }

  function _clearOrderFilters() {
    _ui.q = '';
    _ui.status = 'all';
    _ui.channel = 'all';
    _ordersPage = 1;
    _paintActive();
  }

  function _clearClientFilters() {
    _ui.q = '';
    _ui.status = 'all';
    _ui.segment = '';
    _ui.origin = '';
    _clientPage = 1;
    _paintActive();
  }

  function _setReviewUi(key, value) {
    _reviewUi[key] = value || '';
    _reviewUi.page = 1;
    _paintActive();
  }

  function _setReviewPage(page) {
    _reviewUi.page = parseInt(page, 10) || 1;
    _paintActive();
  }

  function _setReviewPageSize(size) {
    _reviewUi.pageSize = parseInt(size, 10) || 10;
    _reviewUi.page = 1;
    _paintActive();
  }

  function _resetReviewFilters() {
    _reviewUi.query = '';
    _reviewUi.status = 'all';
    _reviewUi.period = 'all';
    _reviewUi.periodStart = '';
    _reviewUi.periodEnd = '';
    _reviewUi.stars = 'all';
    _reviewUi.page = 1;
    _paintActive();
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
      start = _reviewUi.periodStart ? new Date(_reviewUi.periodStart + 'T00:00:00').getTime() : 0;
      end = _reviewUi.periodEnd ? new Date(_reviewUi.periodEnd + 'T23:59:59.999').getTime() : 0;
    }
    return { key: key, start: start, end: end };
  }

  function _reviewPeriodLabel(key) {
    var map = {
      all: 'Todas as avaliações',
      today: 'Hoje',
      yesterday: 'Ontem',
      last7: 'Últimos 7 dias',
      last30: 'Últimos 30 dias',
      thismonth: 'Este mês',
      lastmonth: 'Mês passado',
      custom: 'Período personalizado'
    };
    return map[String(key || 'all').toLowerCase()] || 'Todas as avaliações';
  }

  function _reviewMatchesFilters(review) {
    var q = String(_reviewUi.query || '').trim().toLowerCase();
    var status = String(_reviewUi.status || 'all');
    var stars = String(_reviewUi.stars || 'all');
    var ts = _reviewDateTs(review);
    var range = _reviewPeriodRange(_reviewUi.period);
    var reviewStatus = _reviewStatusLabel(review).key;
    var starValue = Number(review.stars || review.rating || 0) || 0;
    if (q) {
      var text = [
        review.name || '',
        review.customerName || '',
        review.productName || '',
        review.comment || '',
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
      return _reviewDateTs(b) - _reviewDateTs(a);
    });
  }

  function _reviewPaging(list) {
    var total = (list || []).length;
    var pageSize = parseInt(_reviewUi.pageSize, 10) || 10;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(parseInt(_reviewUi.page, 10) || 1, 1), totalPages);
    _reviewUi.page = page;
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

  function _reviewSummary(list) {
    var reviews = Array.isArray(list) ? list : [];
    var approved = reviews.filter(function (r) { return _reviewStatusLabel(r).key === 'approved'; }).length;
    var pending = reviews.filter(function (r) { return _reviewStatusLabel(r).key === 'pending'; }).length;
    var avg = reviews.length ? reviews.reduce(function (sum, r) { return sum + (Number(r.stars || r.rating || 0) || 0); }, 0) / reviews.length : 0;
    return {
      total: reviews.length,
      approved: approved,
      pending: pending,
      avg: avg,
    };
  }

  function _reviewAdminPanelStyle(extra) {
    return 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:14px 16px;box-shadow:0 10px 24px rgba(31,31,31,.055);font-family:Manrope,Inter,sans-serif;' + (extra || '');
  }

  function _reviewAdminInputStyle(extra) {
    return 'width:100%;height:42px;box-sizing:border-box;padding:10px 13px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:13px;font-weight:400;font-family:Manrope,Inter,sans-serif;outline:none;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;' + (extra || '');
  }

  function _reviewAdminSelectStyle(extra) {
    return _reviewAdminInputStyle('appearance:none;-webkit-appearance:none;padding-right:38px;background-color:#FFFCF8;background-image:linear-gradient(45deg,transparent 50%,#7A6F6B 50%),linear-gradient(135deg,#7A6F6B 50%,transparent 50%);background-position:calc(100% - 20px) 18px,calc(100% - 14px) 18px;background-size:6px 6px,6px 6px;background-repeat:no-repeat;' + (extra || ''));
  }

  function _reviewAdminField(label, html) {
    return '<label style="display:block;font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.01em;"><span style="display:block;margin-bottom:6px;">' + _esc(label) + '</span>' + html + '</label>';
  }

  function _reviewHasActiveFilters() {
    return !!String(_reviewUi.query || '').trim() ||
      String(_reviewUi.status || 'all') !== 'all' ||
      String(_reviewUi.period || 'all') !== 'all' ||
      !!String(_reviewUi.periodStart || '').trim() ||
      !!String(_reviewUi.periodEnd || '').trim() ||
      String(_reviewUi.stars || 'all') !== 'all';
  }

  function _reviewToolbarHtml(summary) {
    var customHtml = _reviewUi.period === 'custom'
      ? '<div style="grid-column:1 / -1;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,220px));gap:10px;margin-top:-2px;">' +
          _reviewAdminField('Data inicial', '<input type="date" value="' + _esc(_reviewUi.periodStart || '') + '" onchange="Modules.Pedidos._setReviewUi(\'periodStart\', this.value)" style="' + _reviewAdminInputStyle() + '">') +
          _reviewAdminField('Data final', '<input type="date" value="' + _esc(_reviewUi.periodEnd || '') + '" onchange="Modules.Pedidos._setReviewUi(\'periodEnd\', this.value)" style="' + _reviewAdminInputStyle() + '">') +
        '</div>'
      : '';
    var clearHtml = _reviewHasActiveFilters()
      ? '<div style="grid-column:1 / -1;display:flex;justify-content:flex-start;margin-top:2px;"><button onclick="Modules.Pedidos._resetReviewFilters()" style="height:36px;border:1px solid #E8DCD7;background:#fff;color:#6F6860;border-radius:10px;padding:0 12px;font-size:12px;font-weight:500;cursor:pointer;font-family:Manrope,Inter,sans-serif;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>'
      : '';
    return '<div style="' + _reviewAdminPanelStyle('border-radius:18px;padding:16px 18px;') + '">' +
      '<div style="display:grid;grid-template-columns:minmax(260px,1.35fr) minmax(150px,180px) minmax(160px,190px) minmax(130px,160px);gap:10px;align-items:end;">' +
        '<div>' + _reviewAdminField('Buscar', '<input id="rev-search" type="search" value="' + _esc(_reviewUi.query || '') + '" oninput="Modules.Pedidos._setReviewUi(\'query\', this.value)" placeholder="Cliente, produto ou comentário" style="' + _reviewAdminInputStyle() + '">') + '</div>' +
        _reviewAdminField('Status', '<select onchange="Modules.Pedidos._setReviewUi(\'status\', this.value)" style="' + _reviewAdminSelectStyle() + '"><option value="all"' + (_reviewUi.status === 'all' ? ' selected' : '') + '>Todas</option><option value="pending"' + (_reviewUi.status === 'pending' ? ' selected' : '') + '>Pendentes</option><option value="approved"' + (_reviewUi.status === 'approved' ? ' selected' : '') + '>Aprovadas</option><option value="rejected"' + (_reviewUi.status === 'rejected' ? ' selected' : '') + '>Rejeitadas</option></select>') +
        _reviewAdminField('Período', '<select onchange="Modules.Pedidos._setReviewUi(\'period\', this.value)" style="' + _reviewAdminSelectStyle() + '"><option value="all"' + (_reviewUi.period === 'all' ? ' selected' : '') + '>Todos</option><option value="today"' + (_reviewUi.period === 'today' ? ' selected' : '') + '>Hoje</option><option value="yesterday"' + (_reviewUi.period === 'yesterday' ? ' selected' : '') + '>Ontem</option><option value="last7"' + (_reviewUi.period === 'last7' ? ' selected' : '') + '>Últimos 7 dias</option><option value="last30"' + (_reviewUi.period === 'last30' ? ' selected' : '') + '>Últimos 30 dias</option><option value="thismonth"' + (_reviewUi.period === 'thismonth' ? ' selected' : '') + '>Este mês</option><option value="lastmonth"' + (_reviewUi.period === 'lastmonth' ? ' selected' : '') + '>Mês passado</option><option value="custom"' + (_reviewUi.period === 'custom' ? ' selected' : '') + '>Personalizado</option></select>') +
        _reviewAdminField('Nota', '<select onchange="Modules.Pedidos._setReviewUi(\'stars\', this.value)" style="' + _reviewAdminSelectStyle() + '"><option value="all"' + (_reviewUi.stars === 'all' ? ' selected' : '') + '>Todas</option><option value="5"' + (_reviewUi.stars === '5' ? ' selected' : '') + '>5 estrelas</option><option value="4"' + (_reviewUi.stars === '4' ? ' selected' : '') + '>4 estrelas</option><option value="3"' + (_reviewUi.stars === '3' ? ' selected' : '') + '>3 estrelas</option><option value="2"' + (_reviewUi.stars === '2' ? ' selected' : '') + '>2 estrelas</option><option value="1"' + (_reviewUi.stars === '1' ? ' selected' : '') + '>1 estrela</option></select>') +
        customHtml +
        clearHtml +
      '</div>' +
    '</div>';
  }

  function _reviewActionButtons(review, context) {
    var id = _esc(String((review && review.id) || ''));
    if (!id) return '';
    var status = _reviewStatusLabel(review).key;
    var isModal = context === 'modal';
    var wrapStyle = isModal
      ? 'display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;'
      : 'display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;';
    var baseStyle = isModal
      ? 'min-width:118px;padding:11px 16px;border:none;border-radius:11px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:Manrope,Inter,sans-serif;'
      : 'padding:9px 13px;border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:Manrope,Inter,sans-serif;';
    var buttons = [];
    if (status !== 'approved') {
      buttons.push('<button onclick="Modules.Pedidos._approveReview(\'' + id + '\')" style="' + baseStyle + 'background:#1A9E5A;box-shadow:0 8px 18px rgba(26,158,90,.16);">Aprovar</button>');
    }
    if (status !== 'rejected') {
      buttons.push('<button onclick="Modules.Pedidos._rejectReview(\'' + id + '\')" style="' + baseStyle + 'background:#B42318;box-shadow:0 8px 18px rgba(180,35,24,.16);">Rejeitar</button>');
    }
    return '<div style="' + wrapStyle + '"' + (isModal ? '' : ' onclick="event.stopPropagation()"') + '>' + buttons.join('') + '</div>';
  }

  function _approveReview(id) {
    DB.update('reviews', id, { approved: true, rejected: false, status: 'approved' }).then(function () {
      UI.toast('Avaliação aprovada', 'success');
      _loadMeta();
    }).catch(function (err) {
      UI.toast('Erro ao aprovar: ' + err.message, 'error');
    });
  }

  function _rejectReview(id) {
    DB.update('reviews', id, { rejected: true, approved: false, status: 'rejected' }).then(function () {
      UI.toast('Avaliação rejeitada', 'info');
      _loadMeta();
    }).catch(function (err) {
      UI.toast('Erro ao rejeitar: ' + err.message, 'error');
    });
  }

  function _reviewFilterOptions(values, selected, emptyLabel) {
    return values.map(function (v) {
      var label = v === 'all' ? emptyLabel : _reviewFilterLabel(v);
      return '<option value="' + _esc(v) + '"' + (String(selected || 'all') === String(v) ? ' selected' : '') + '>' + _esc(label) + '</option>';
    }).join('');
  }

  function _filterOptions(values, selected, emptyLabel) {
    return values.map(function (v, idx) {
      var label = idx === 0 ? emptyLabel : _segmentLabel(v);
      return '<option value="' + _esc(v) + '"' + (String(selected || '') === String(v) ? ' selected' : '') + '>' + _esc(label) + '</option>';
    }).join('');
  }

  function _originOptions(selected) {
    return '<option value="">Canal principal</option>' + _channelNames().map(function (name) {
      return '<option value="' + _esc(name) + '"' + (String(selected || '') === String(name) ? ' selected' : '') + '>' + _esc(_title(name)) + '</option>';
    }).join('');
  }

  function _channelNames() {
    var names = [];
    (_canais || []).forEach(function (c) {
      var name = c && (c.name || c.nome || c.label);
      if (name && names.indexOf(name) < 0) names.push(name);
    });
    if (names.length) return names;
    return _isTpvEnabledForChannels() ? ['Cardápio', 'Venda presencial'] : ['Cardápio'];
  }

  function _reviewFilterLabel(v) {
    var key = String(v || '').toLowerCase();
    if (key === 'approved') return 'Aprovadas';
    if (key === 'pending') return 'Pendentes';
    if (key === 'rejected') return 'Rejeitadas';
    return _title(v);
  }

  function _orderFilterOptions(values, selected, emptyLabel) {
    return values.map(function (v) {
      var label = v === 'all' ? emptyLabel : _orderStatusOrChannelLabel(v);
      return '<option value="' + _esc(v) + '"' + (String(selected || 'all') === String(v) ? ' selected' : '') + '>' + _esc(label) + '</option>';
    }).join('');
  }

  function _kitchenPeriodOptions(selected) {
    var rows = [
      ['all', 'Todo o período'],
      ['today', 'Hoje'],
      ['tomorrow', 'Amanhã'],
      ['next7', 'Próximos 7 dias']
    ];
    return rows.map(function (row) {
      return '<option value="' + row[0] + '"' + (String(selected || 'all') === row[0] ? ' selected' : '') + '>' + row[1] + '</option>';
    }).join('');
  }

  function _orderStatusOrChannelLabel(v) {
    var key = String(v || '').toLowerCase();
    if (key === 'all') return 'Todos';
    if (key === 'cardapio') return 'Cardápio';
    if (key === 'template') return 'Template';
    if (key === 'store') return 'Loja';
    if (key === 'whatsapp') return 'WhatsApp';
    if (key === 'delivery') return 'Entrega';
    if (key === 'pickup') return 'Retirada';
    var found = COLUMNS.find(function (c) { return String(c.key).toLowerCase() === key; });
    return found ? found.label : _title(v);
  }

  function _orderChannelKey(order) {
    return String(order && (order.channel || order.source || '')).trim().toLowerCase();
  }

  function _orderChannelLabel(order) {
    var key = _orderChannelKey(order);
    if (key === 'cardapio') return 'Cardápio';
    if (key === 'template') return 'Template';
    if (key === 'store') return 'Loja';
    if (key === 'whatsapp') return 'WhatsApp';
    if (key === 'pickup') return 'Retirada';
    if (key === 'delivery') return 'Entrega';
    if (!key) return '—';
    return _title(key);
  }

  function _orderStatusLabel(status) {
    var key = String(status || 'Pendente');
    var found = COLUMNS.find(function (c) { return c.key === key; });
    return found ? found.label : key;
  }

  function _isCardapioOrder(order) {
    if (!order) return false;
    if (order.kitchenQueue === true || order.showInKitchen === true) return true;
    var channel = String(order.channel || '').trim().toLowerCase();
    var source = String(order.source || '').trim().toLowerCase();
    var originChannel = String(order.originChannel || '').trim().toLowerCase();
    var originSource = String(order.originSource || '').trim().toLowerCase();
    var keys = [channel, source, originChannel, originSource];
    return keys.some(function (key) {
      return key === 'cardapio' || key === 'template' || key === 'store' || key === 'storefront';
    });
  }

  function _cardapioOrders() {
    return (_orders || []).filter(_isCardapioOrder).sort(function (a, b) { return _dateTs(b) - _dateTs(a); });
  }

  function _matchedCustomer(order) {
    if (!order) return null;
    var id = String(order.customerId || order.clientId || order.customerUid || order.uid || '').trim();
    var phone = _phoneMatchKey(order.phone || order.customerPhone || order.whatsapp);
    var email = _clean(order.email || order.customerEmail);
    var name = _clean(order.customerName || order.clientName || order.name);
    if (id) return _findCustomerByRecordId(id);
    return (_customers || []).find(function (c) {
      if (phone && _customerPhoneMatchIsUnique(phone, _customerRecordId(c)) && _phoneMatchKey(c.phone || c.whatsapp) === phone) return true;
      if (email && _clean(c.email || '') === email) return true;
      if (name && _clean(c.name || '') === name) return true;
      return false;
    }) || null;
  }

  function _matchedCustomerByPhone(order) {
    if (!order) return null;
    var phone = _phoneMatchKey(order.phone || order.customerPhone || order.whatsapp);
    if (!phone) return null;
    if (!_customerPhoneMatchIsUnique(phone)) return null;
    return (_customers || []).find(function (c) {
      return _phoneMatchKey(c.phone || c.whatsapp || '') === phone;
    }) || null;
  }

  function _syncOrderCustomerLinks(list) {
    var rows = Array.isArray(list) ? list : (_orders || []);
    if (!_customers || !_customers.length || !rows.length) return;
    rows.forEach(function (order) {
      if (!order) return;
      if (String(order.customerId || order.clientId || order.customerUid || '').trim()) return;
      var customer = _matchedCustomerByPhone(order);
      var cid = _customerRecordId(customer);
      if (!customer || !cid) return;
      var update = {
        customerId: cid,
        clientId: cid,
        customerName: customer.name || order.customerName || order.clientName || order.name || '',
        clientName: customer.name || order.customerName || order.clientName || order.name || '',
        name: customer.name || order.customerName || order.clientName || order.name || '',
        phone: customer.phone || order.phone || '',
        customerPhone: customer.phone || order.customerPhone || '',
        whatsapp: customer.whatsapp || customer.phone || order.whatsapp || '',
        email: customer.email || order.email || '',
        customerEmail: customer.email || order.customerEmail || ''
      };
      DB.update('orders', order.id, update).then(function () {
        _orders = _orders.map(function (o) {
          if (String(o.id || '') !== String(order.id || '')) return o;
          return Object.assign({}, o, update);
        });
        if (String(_detailModalOrderId || '') === String(order.id || '') && typeof _refreshDetailView === 'function') _refreshDetailView(order.id);
        if (order.status === 'Entregado' && Modules.Marketing && typeof Modules.Marketing._pointsGrantForOrder === 'function') {
          Modules.Marketing._pointsGrantForOrder(order.id, Object.assign({}, order, update), customer).catch(function () {});
        }
      }).catch(function (err) {
        console.warn('[Pedidos] auto link order customer failed', err);
      });
    });
  }

  function _reviewsForCustomer(customer, order) {
    var cid = customer ? _customerRecordId(customer) : '';
    var name = customer ? _clean(customer.name || '') : _clean((order || {}).customerName || (order || {}).clientName || (order || {}).name || '');
    return (_reviews || []).filter(function (r) {
      if (cid && String(r.customerId || '') === cid) return true;
      if (name && _clean(r.customerName || r.name || '') === name) return true;
      return false;
    }).sort(function (a, b) { return _reviewDateTs(b) - _reviewDateTs(a); });
  }

  function _reviewDateTs(review) {
    if (!review) return 0;
    var raw = review.createdAt || review.approvedAt || review.updatedAt || review.date || '';
    if (raw && typeof raw.toDate === 'function') return raw.toDate().getTime();
    var d = new Date(raw);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function _orderReviewSummary(order) {
    var customer = _matchedCustomer(order);
    var reviews = _reviewsForCustomer(customer, order);
    var avg = reviews.length ? reviews.reduce(function (sum, r) { return sum + (Number(r.stars || r.rating || 0) || 0); }, 0) / reviews.length : 0;
    return { customer: customer, reviews: reviews, avg: avg };
  }

  function _orderSearchHaystack(order) {
    var customer = _matchedCustomer(order);
    var reviewSummary = _orderReviewSummary(order);
    var reviewTexts = (reviewSummary.reviews || []).slice(0, 2).map(function (r) {
      return [r.comment, r.text].filter(Boolean).join(' ');
    }).join(' ');
    return [
      order.id,
      order.customerName,
      order.clientName,
      order.name,
      order.phone,
      order.customerPhone,
      order.whatsapp,
      order.address,
      _orderScheduleInfo(order).text,
      order.note,
      order.status,
      _orderChannelLabel(order),
      customer ? customer.name : '',
      customer ? customer.phone : '',
      customer ? customer.email : '',
      reviewTexts
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function _orderMatchesFilters(order) {
    var q = String(_ui.q || '').trim().toLowerCase();
    var status = String(_ui.status || 'all').toLowerCase();
    var channel = String(_ui.channel || 'all').toLowerCase();
    var orderStatus = String(order.status || 'Pendente').toLowerCase();
    var orderChannel = _orderChannelKey(order);
    if (q && _orderSearchHaystack(order).indexOf(q) < 0) return false;
    if (status === 'all' && _statusCancelsStockMovement(order.status)) return false;
    if (status !== 'all' && orderStatus !== status.toLowerCase()) return false;
    if (channel !== 'all' && orderChannel !== channel) return false;
    return true;
  }

  function _kitchenOrderMatchesFilters(order) {
    var q = String(_ui.q || '').trim().toLowerCase();
    var status = String(_ui.status || 'all').toLowerCase();
    var orderStatus = String(order.status || 'Pendente').toLowerCase();
    if (q && _orderSearchHaystack(order).indexOf(q) < 0) return false;
    if (status !== 'all' && orderStatus !== status.toLowerCase()) return false;
    return true;
  }

  function _kitchenDateMatches(order) {
    var exact = String(_ui.kitchenDate || '').trim();
    var period = String(_ui.kitchenPeriod || 'all').toLowerCase();
    var ts = _orderOperationalDateTs(order);
    if (exact) {
      var exactStart = new Date(exact + 'T00:00:00').getTime();
      var exactEnd = new Date(exact + 'T23:59:59.999').getTime();
      if (!ts || ts < exactStart || ts > exactEnd) return false;
    }
    if (period === 'all') return true;
    var range = _kitchenPeriodRange(period);
    if (!range.start && !range.end) return true;
    return !!ts && ts >= range.start && ts <= range.end;
  }

  function _orderOperationalDateTs(order) {
    order = order || {};
    var raw = order.type === 'pickup'
      ? _firstText(order.pickupDate, order.scheduleDate, order.deliveryDate, order.deliveryDateISO, '')
      : _firstText(order.deliveryDate, order.deliveryDateISO, order.scheduleDate, order.pickupDate, '');
    var time = order.type === 'pickup'
      ? _firstText(order.pickupTime, order.scheduleTime, order.deliveryTime, '')
      : _firstText(order.deliveryTime, order.scheduleTime, order.pickupTime, '');
    if (raw) {
      var d = new Date(String(raw).slice(0, 10) + (time ? 'T' + String(time).slice(0, 5) + ':00' : 'T12:00:00'));
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return _dateTs(order);
  }

  function _kitchenPeriodRange(period) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var start = 0;
    var end = 0;
    if (period === 'today') {
      start = today.getTime();
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    } else if (period === 'tomorrow') {
      var tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      start = tomorrow.getTime();
      end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999).getTime();
    } else if (period === 'next7') {
      start = today.getTime();
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 23, 59, 59, 999).getTime();
    }
    return { start: start, end: end };
  }

  function _filteredOrders() {
    return (_orders || []).slice().filter(_orderMatchesFilters).sort(function (a, b) { return _dateTs(b) - _dateTs(a); });
  }

  function _allOrdersStats(orders) {
    var list = Array.isArray(orders) ? orders : [];
    var ticketList = list.filter(function (o) { return !_statusCancelsStockMovement(o && o.status); });
    var matched = 0;
    var reviewed = 0;
    var total = 0;
    ticketList.forEach(function (o) {
      total += _num(o.total || o.amount || o.grandTotal);
    });
    list.forEach(function (o) {
      var customer = _matchedCustomer(o);
      if (customer) matched += 1;
      if (_reviewsForCustomer(customer, o).length) reviewed += 1;
    });
    return {
      totalOrders: list.length,
      ticketOrders: ticketList.length,
      customerHits: matched,
      reviewedOrders: reviewed,
      avgTicket: ticketList.length ? total / ticketList.length : 0
    };
  }

  function _reviewKpiCard(label, value, sub, icon, color) {
    return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;font-family:Manrope,Inter,sans-serif;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">' +
      '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + (color || '#6F6860') + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'reviews') + '</span></div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
        '<span style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
        '<strong style="font-size:34px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;letter-spacing:0;">' + _esc(value == null ? '0' : value) + '</strong>' +
      '</div>' +
    '</div>';
  }

  function _kpiCard(label, value, sub) {
    return '<div style="background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:14px 16px;min-height:94px;display:flex;flex-direction:column;justify-content:space-between;">' +
      '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.5px;">' + _esc(label) + '</div>' +
      '<div style="font-family:\'League Spartan\',sans-serif;font-size:24px;font-weight:900;line-height:1;color:#1A1A1A;">' + _esc(value == null ? '0' : value) + '</div>' +
      '<div style="font-size:12px;color:#8A7E7C;line-height:1.35;">' + _esc(sub || '') + '</div>' +
    '</div>';
  }

  function _kitchenKpiCard(label, value, sub, icon, color) {
    return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">' +
      '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + (color || '#6F6860') + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'analytics') + '</span></div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
        '<span style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
        '<strong style="font-size:30px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;letter-spacing:0;">' + _esc(String(value == null ? '0' : value)) + '</strong>' +
        '<span style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(sub || '') + '</span>' +
      '</div>' +
    '</div>';
  }

  function _renderOrdersListHTML() {
    var orders = _filteredOrders();
    if (!orders.length) {
      return '<section style="background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);text-align:center;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum pedido encontrado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Tente ajustar a busca, os filtros ou a ordenação.</div></section>';
    }
    var totalPages = Math.max(1, Math.ceil(orders.length / _ordersPageSize));
    if (_ordersPage > totalPages) _ordersPage = totalPages;
    if (_ordersPage < 1) _ordersPage = 1;
    var start = (_ordersPage - 1) * _ordersPageSize;
    var pageItems = orders.slice(start, start + _ordersPageSize);
    var rows = pageItems.map(function (o) {
      var review = _orderReviewSummary(o);
      var customer = review.customer;
      var customerStats = customer ? _customerStats(customer) : { ordersCount: 0, totalSpent: 0 };
      var stars = review.avg ? Math.round(review.avg) : 0;
      var customerLabel = customer ? customer.name : (o.customerName || o.clientName || o.name || 'Cliente');
      var reviewLabel = review.reviews.length ? (review.avg ? review.avg.toFixed(1) + '/5' : review.reviews.length + ' avaliação(ões)') : 'Sem avaliações';
      var phoneHref = _orderPhoneHref(o);
      var statusMeta = _statusMeta(o.status);
      var typeTone = o.type === 'pickup' ? '#059669' : '#2563EB';
      var typeLabel = o.type === 'pickup' ? 'Retirada' : 'Entrega';
      return '<tr onclick="Modules.Pedidos._openDetail(\'' + _esc(o.id) + '\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
        '<td style="padding:12px 16px;vertical-align:middle;min-width:280px;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(customerLabel) + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">' + _esc(_orderDisplayId(o) || _orderScheduleInfo(o).text || 'Pedido') + '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;">' +
          '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;border:1px solid #EAE4DA;">' + _esc(_orderChannelLabel(o)) + '</span>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:' + statusMeta.color + ';font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:' + statusMeta.color + ';display:inline-block;"></span>' + _esc(_orderStatusLabel(o.status)) + '</span>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:' + typeTone + ';font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:' + typeTone + ';display:inline-block;"></span>' + _esc(typeLabel) + '</span>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;"><div style="font-size:14px;font-weight:600;color:#1F1F1F;">' + _esc(_orderScheduleInfo(o).text) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + (customer ? 'Cliente cadastrado' : 'Cliente novo') + (customerStats.ordersCount ? ' · ' + customerStats.ordersCount + ' pedido(s)' : '') + '</div></td>' +
        '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + UI.fmt(_num(o.total || o.amount || o.grandTotal)) + '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:' + (review.reviews.length ? '#B45309' : '#A39B90') + ';font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span class="mi" style="font-size:14px;color:' + (review.reviews.length ? '#B6925E' : '#A39B90') + ';">' + (review.reviews.length ? 'star' : 'star_border') + '</span>' + _esc(reviewLabel) + '</span>' +
        '</td>' +
        '<td style="padding:13px 16px;vertical-align:middle;text-align:right;white-space:nowrap;">' +
          '<div style="display:inline-flex;align-items:center;gap:6px;" onclick="event.stopPropagation();">' +
            (phoneHref ? '<a href="' + _esc(phoneHref) + '" target="_blank" rel="noopener" title="WhatsApp" onclick="event.stopPropagation();" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#1A9E5A;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);text-decoration:none;"><span class="mi" style="font-size:14px;">chat</span></a>' : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="overflow:auto;">' +
        '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:1060px;">' +
          '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Pedido</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Canal</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Status</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Tipo</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Data / cliente</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Total</th>' +
            '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Avaliação</th>' +
            '<th style="text-align:right;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Ações</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>' +
      _paginationHtml(orders.length, _ordersPage, _ordersPageSize, '_setOrdersPage', '_setOrdersPageSize') +
    '</div>';
  }

  function _renderCustomersPanel() {
    var list = (_customers || []).slice().sort(function (a, b) {
      var sa = _customerStats(a);
      var sb = _customerStats(b);
      return (sb.totalSpent || 0) - (sa.totalSpent || 0) || (sb.ordersCount || 0) - (sa.ordersCount || 0) || String(a.name || '').localeCompare(String(b.name || ''));
    }).slice(0, 5);
    if (!list.length) return '<div style="font-size:13px;color:#8A7E7C;line-height:1.5;">Nenhum cliente cadastrado.</div>';
    return '<div style="display:flex;flex-direction:column;gap:10px;">' + list.map(function (c) {
      var s = _customerStats(c);
      var reviewSummary = _customerReviewStats(c);
      return '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
          '<strong style="font-size:14px;">' + _esc(c.name || 'Cliente') + '</strong>' +
          (reviewSummary.count ? UI.badge(reviewSummary.avg.toFixed(1) + '★', 'orange') : UI.badge('Sem review', 'gray')) +
        '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">' + s.ordersCount + ' pedido(s) · ' + UI.fmt(s.totalSpent) + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;">' + (c.phone ? _esc(c.phone) : 'Sem telefone') + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _renderReviewsPanel() {
    var list = (_reviews || []).slice().sort(function (a, b) { return _reviewDateTs(b) - _reviewDateTs(a); }).slice(0, 5);
    if (!list.length) return '<div style="font-size:13px;color:#8A7E7C;line-height:1.5;">Nenhuma avaliação encontrada.</div>';
    return '<div style="display:flex;flex-direction:column;gap:10px;">' + list.map(function (r) {
      var stars = Number(r.stars || r.rating || 0) || 0;
      var approved = String(r.approved || r.status || '').toLowerCase() === 'approved';
      var customerName = r.customerName || r.name || 'Cliente';
      var ts = _reviewDateTs(r);
      return '<div style="background:#FAF8F8;border:1px solid #EEE6E4;border-radius:12px;padding:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
          '<strong style="font-size:14px;">' + _esc(customerName) + '</strong>' +
          UI.badge(approved ? 'Aprovada' : 'Pendente', approved ? 'green' : 'orange') +
        '</div>' +
        '<div style="font-size:13px;color:#FFD166;margin-top:5px;letter-spacing:1px;">' + _esc('★'.repeat(stars) + '☆'.repeat(5 - stars)) + '</div>' +
        '<div style="font-size:12px;color:#8A7E7C;margin-top:5px;line-height:1.45;">' + _esc(r.comment || r.text || '') + '</div>' +
        '<div style="font-size:11px;color:#8A7E7C;margin-top:6px;">' + _esc(_reviewSourceLabel(r)) + (ts ? ' · ' + _esc(UI.fmtDate(new Date(ts))) : '') + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _customerStats(c) {
    var orders = _ordersForClient(c);
    var valid = orders.filter(function (o) {
      var st = String(o.status || '').toLowerCase();
      return st !== 'cancelado' && st !== 'canceled' && st !== 'cancelled';
    });
    var total = valid.reduce(function (s, o) { return s + _num(o.total || o.amount || o.grandTotal); }, 0);
    var lastOrder = valid.slice().sort(function (a, b) { return _dateTs(b) - _dateTs(a); })[0] || null;
    var lastTs = lastOrder ? _dateTs(lastOrder) : 0;
    var days = lastTs ? Math.floor((Date.now() - lastTs) / 86400000) : null;
    var segment = 'sem_pedido';
    if (valid.length) {
      segment = (valid.length >= 5 || total >= 100) ? 'vip' : valid.length >= 2 ? 'recorrente' : 'novo';
      if (days != null && days > 60) segment = 'inativo';
    }
    if (String(c.status || '').toLowerCase() === 'bloqueado') segment = 'bloqueado';
    return {
      ordersCount: valid.length,
      totalSpent: total,
      avgTicket: valid.length ? total / valid.length : 0,
      lastOrderTs: lastTs,
      lastOrderLabel: lastTs ? UI.fmtDate(new Date(lastTs)) : '',
      segment: segment
    };
  }

  function _customerReviewStats(c) {
    var cid = _customerRecordId(c);
    var rows = (_reviews || []).filter(function (r) {
      return (cid && String(r.customerId || r.clientId || r.customerUid || '') === cid) || _clean(r.customerName || r.name || '') === _clean(c.name || '');
    });
    var avg = rows.length ? rows.reduce(function (sum, r) { return sum + (Number(r.stars || r.rating || 0) || 0); }, 0) / rows.length : 0;
    return { count: rows.length, avg: avg };
  }

  function _renderKanban(orders) {
    var wrap = document.getElementById('kanban-wrap');
    if (!wrap) return;
    _renderKanbanInto(wrap, orders);
  }

  function _renderKanbanInto(wrap, orders) {
    if (!wrap) return;
    wrap.innerHTML = COLUMNS.map(function (col) {
      var colOrders = orders.filter(function (o) { return (o.status || 'Pendente') === col.key; });
      var total = colOrders.reduce(function (sum, o) { return sum + _num(o.total || o.amount || o.grandTotal); }, 0);
      return '<div class="kb-col" data-col="' + col.key + '" style="flex:0 0 286px;background:#fff;border:1px solid #EAE4DA;border-radius:18px;display:flex;flex-direction:column;max-height:calc(100vh - 166px);box-shadow:0 14px 34px rgba(31,31,31,.065);overflow:hidden;">' +
        '<div style="padding:14px 14px 12px;background:linear-gradient(135deg,' + col.bg + ' 0%,#fff 78%);border-bottom:1px solid #EAE4DA;">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
            '<div style="min-width:0;">' +
              '<span style="display:block;font-size:12px;font-weight:800;color:' + col.color + ';line-height:1.2;text-transform:uppercase;letter-spacing:.03em;">' + col.label + '</span>' +
              '<span style="display:block;margin-top:4px;font-size:11px;color:#6F6860;font-weight:600;">' + (colOrders.length ? UI.fmt(total) : 'Sem pedidos') + '</span>' +
            '</div>' +
            '<span style="background:#fff;border:1px solid rgba(31,31,31,.06);box-shadow:0 8px 16px rgba(31,31,31,.05);font-size:11px;font-weight:800;padding:5px 9px;border-radius:999px;color:' + col.color + ';">' + colOrders.length + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="kb-cards" data-col="' + col.key + '" style="padding:12px;flex:1;overflow-y:auto;min-height:80px;display:flex;flex-direction:column;gap:11px;background:linear-gradient(180deg,#fff 0%,' + col.bg + ' 180%);" ' +
        'ondragover="event.preventDefault();this.style.background=\'' + col.bg + '\'" ' +
        'ondragleave="this.style.background=\'linear-gradient(180deg,#fff 0%,' + col.bg + ' 180%)\'" ' +
        'ondrop="Modules.Pedidos._onDrop(event,\'' + col.key + '\')">' +
        (colOrders.length ? colOrders.map(function (o) { return _cardHTML(o); }).join('') : '<div style="border:1px dashed #EAE4DA;border-radius:14px;padding:16px;text-align:center;background:rgba(255,255,255,.72);color:#8A7E7C;font-size:12px;line-height:1.45;">Nenhum pedido nesta etapa.</div>') +
        '</div></div>';
    }).join('');
  }

  function _quickStatus(id, status) {
    _updateOrderStatus(id, status, { toast: 'Status atualizado!', prompt: true });
  }

  function _openKitchenMode() {
    if (_kitchenModeOverlay) return;
    var active = _activeKitchenOrders();
    var overlay = document.createElement('div');
    overlay.id = 'pedidos-kitchen-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:20000;background:#fff;display:flex;flex-direction:column;font-family:Manrope,Inter,sans-serif;';
    overlay.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 24px;border-bottom:1px solid #EAE4DA;background:#fff;box-shadow:0 1px 2px rgba(31,31,31,.02);">' +
        '<div style="min-width:0;">' +
          '<div style="font-size:22px;font-weight:800;color:#1F1F1F;line-height:1.2;margin:0;">Modo cozinha</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          '<button onclick="Modules.Pedidos._testAlarm()" style="height:38px;padding:0 14px;border:1px solid #E6E1D8;background:#fff;color:#1F1F1F;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Testar alarme</button>' +
          '<button onclick="Modules.Pedidos._closeKitchenMode()" style="height:38px;padding:0 14px;border:none;background:#B42318;color:#fff;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Voltar</button>' +
        '</div>' +
      '</div>' +
      '<div style="flex:1;min-height:0;padding:18px 24px 24px;overflow:hidden;background:#fff;">' +
        '<div id="kitchen-full-board" style="display:flex;gap:14px;overflow-x:auto;flex:1;min-height:0;padding-bottom:8px;height:100%;"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    _kitchenModeOverlay = overlay;
    _renderKanbanInto(document.getElementById('kitchen-full-board'), active);
  }

  function _isKitchenModeOpen() {
    return !!_kitchenModeOverlay;
  }

  function _closeKitchenMode() {
    if (!_kitchenModeOverlay) return;
    document.body.style.overflow = '';
    _kitchenModeOverlay.remove();
    _kitchenModeOverlay = null;
    _kitchenDetailId = null;
  }

  function _closeDetailModal() {
    var existing = document.getElementById('pedidos-detail-overlay');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    document.body.style.overflow = '';
    _detailModalOrderId = null;
    _detailWhatsappPromptVisible = false;
  }

  function _refreshDetailView(id) {
    var current = _orders.find(function (x) { return String(x.id || '') === String(id || ''); });
    if (!current) return;
    var kitchenOpen = _isKitchenModeOpen();
    if (kitchenOpen) {
      _renderKitchenDetailPanel(current);
      return;
    }
    _closeDetailModal();
    _openDetail(id);
  }

  var _detailModalOrderId = null;
  var _detailWhatsappPromptVisible = false;

  function _detailOrderCustomer(order) {
    var customer = _matchedCustomer(order);
    var linked = !!(customer || String(order && (order.customerId || order.clientId || '')).trim());
    return { customer: customer, linked: linked };
  }

  function _detailPaymentInfo(order) {
    var total = _num(order && (order.total != null ? order.total : order.finalSubtotal != null ? order.finalSubtotal : order.subtotal != null ? order.subtotal : 0));
    var paid = _num(order && (order.paidAmount != null ? order.paidAmount : order.amountPaid != null ? order.amountPaid : order.valuePaid != null ? order.valuePaid : order.paid != null ? order.paid : 0));
    if (!paid && String(order && order.paymentStatus || '').toLowerCase().indexOf('pago') >= 0) paid = total;
    var pending = Math.max(0, total - paid);
    var method = _firstText(order && order.paymentMethod, order && order.payMethod, order && order.payment, order && order.formaPagamento, order && order.paymentType, '');
    var status = _firstText(order && order.paymentStatus, order && order.payStatus, order && order.statusPayment, order && order.paymentState, '');
    var subtotal = _num(order && (order.subtotal != null ? order.subtotal : order.itemsSubtotal != null ? order.itemsSubtotal : 0));
    var originalSubtotal = _num(order && (order.originalSubtotal != null ? order.originalSubtotal : order.subtotalOriginal != null ? order.subtotalOriginal : subtotal));
    var promoDiscount = _num(order && (order.promoDiscountTotal != null ? order.promoDiscountTotal : order.promoDiscount != null ? order.promoDiscount : 0));
    var couponDiscount = _num(order && (order.couponDiscountTotal != null ? order.couponDiscountTotal : order.couponDiscount != null ? order.couponDiscount : 0));
    var pointsDiscount = _num(order && (order.pointsDiscountTotal != null ? order.pointsDiscountTotal : order.pointsDiscount != null ? order.pointsDiscount : 0));
    var deliveryFee = _num(order && (order.deliveryFee != null ? order.deliveryFee : order.shippingFee != null ? order.shippingFee : order.fee != null ? order.fee : 0));
    var originalDeliveryFee = _num(order && (order.originalDeliveryFee != null ? order.originalDeliveryFee : order.shippingOriginalFee != null ? order.shippingOriginalFee : deliveryFee));
    var freeShippingApplied = !!(order && (order.freeShippingApplied || order.freeShippingPromotionId || order.freeShippingPromotion));
    var freeShippingPromotionName = _firstText(order && order.freeShippingPromotionName, order && order.freeShippingPromotion && order.freeShippingPromotion.name, '');
    var discountTotal = _num(order && (order.discountTotal != null ? order.discountTotal : promoDiscount + couponDiscount + pointsDiscount));
    var couponCode = order && order.coupon ? _firstText(order.coupon.code, order.coupon.couponCode, order.coupon.name, '') : _firstText(order && order.couponCode, order && order.discountCode, '');
    var channelCosts = _orderChannelFinancialPatch(order || {}, total);
    return { total: total, paid: paid, pending: pending, method: method, status: status, subtotal: subtotal, originalSubtotal: originalSubtotal, promoDiscount: promoDiscount, couponDiscount: couponDiscount, pointsDiscount: pointsDiscount, deliveryFee: deliveryFee, originalDeliveryFee: originalDeliveryFee, freeShippingApplied: freeShippingApplied, freeShippingPromotionName: freeShippingPromotionName, discountTotal: discountTotal, couponCode: couponCode, channelCosts: channelCosts };
  }

  function _detailSmallLine(label, value) {
    if (value === undefined || value === null || value === '') return '';
    return '<div style="display:grid;grid-template-columns:minmax(88px,.46fr) minmax(0,1fr);gap:10px;align-items:flex-start;font-size:12px;line-height:1.35;color:#1F1F1F;min-width:0;">' +
      '<span style="color:#6F6860;min-width:0;">' + _esc(label) + '</span>' +
      '<span style="text-align:right;min-width:0;overflow-wrap:anywhere;">' + _esc(value) + '</span>' +
    '</div>';
  }

  function _detailOriginSelectLine(order) {
    return '<div style="display:grid;grid-template-columns:minmax(88px,.46fr) minmax(0,1fr);gap:10px;align-items:center;font-size:12px;line-height:1.35;color:#1F1F1F;min-width:0;">' +
      '<label for="detail-sales-channel" style="color:#6F6860;min-width:0;">Origem</label>' +
      '<div class="order-detail-field-control" style="padding:3px;border-radius:9px;"><select id="detail-sales-channel" aria-label="Origem do pedido" style="min-height:28px;font-size:12px;text-align:right;">' + _manualOrderChannelOptions(_firstText(order && order.channel, order && order.source, order && order.originChannel, order && order.originSource, 'manual')) + '</select></div>' +
    '</div>';
  }

  function _detailOrderMetaHTML(order) {
    var lines = [
      _detailSmallLine('Código público', _firstText(order && order.publicOrderCode, order && order.orderRef, order && order.orderNumber, '')),
      _detailOriginSelectLine(order),
      _detailSmallLine('Itens', order && order.itemCount ? String(order.itemCount) : ((order && order.items && order.items.length) ? String(order.items.length) : '')),
      _detailSmallLine('Estoque', _orderStockStatusText(order))
    ].filter(Boolean);
    return lines.length ? '<div style="margin-top:10px;display:grid;gap:5px;max-width:360px;">' + lines.join('') + '</div>' : '';
  }

  function _orderStockStatusText(order) {
    if (!order) return '';
    if (order.stockRegularizationPending) {
      var pending = _num(order.stockRegularizationPendingCount);
      return 'Regularização pendente' + (pending ? ' · ' + pending + ' item' + (pending === 1 ? '' : 's') : '');
    }
    if (order.stockResolutionCount) {
      var returned = _num(order.stockReturnedQuantity);
      var lost = _num(order.stockLossQuantity);
      var parts = [];
      if (returned) parts.push('retorno ' + returned);
      if (lost) parts.push('perda ' + lost);
      return 'Tratado pós-pedido' + (parts.length ? ' · ' + parts.join(' · ') : '');
    }
    if (order.stockMovementCreated) {
      var count = _num(order.stockMovementCount);
      return 'Baixa gerada' + (count ? ' · ' + count + ' item' + (count === 1 ? '' : 's') : '');
    }
    var skipped = _num(order.stockMovementSkippedCount);
    if (skipped > 0) return skipped + ' item' + (skipped === 1 ? '' : 's') + ' sem vínculo de estoque';
    if (_statusTriggersStockMovement(order.status)) return 'Aguardando baixa de estoque';
    return '';
  }

  function _detailStockTraceHTML(order) {
    order = order || {};
    var statusText = _orderStockStatusText(order);
    var created = !!order.stockMovementCreated;
    var reversed = !!order.stockMovementReversed;
    var count = _num(order.stockMovementCount);
    var skippedCount = _num(order.stockMovementSkippedCount);
    var skipped = Array.isArray(order.stockMovementSkippedItems) ? order.stockMovementSkippedItems : [];
    var regularizationPending = !!order.stockRegularizationPending;
    var regularizationCount = _num(order.stockRegularizationPendingCount);
    var regularizationItems = Array.isArray(order.stockRegularizationPendingItems) ? order.stockRegularizationPendingItems : [];
    if (!statusText && !created && !skippedCount && !reversed && !_statusTriggersStockMovement(order.status)) return '';
    var tone = regularizationPending ? '#9A3412' : (created ? '#146C43' : (skippedCount ? '#9A3412' : '#6F6860'));
    var bg = regularizationPending ? '#FFF6ED' : (created ? '#EEF8F1' : (skippedCount ? '#FFF6ED' : '#F6F1EA'));
    var border = regularizationPending ? '#FED7AA' : (created ? '#CFE9D8' : (skippedCount ? '#FED7AA' : '#E8DCD7'));
    var headline = created
      ? 'O estoque já foi movimentado por este pedido.'
      : (skippedCount ? 'Alguns itens ainda não baixaram do estoque.' : 'A baixa de estoque será criada quando o pedido entrar em preparo ou for confirmado.');
    if (regularizationPending) headline = 'Este pedido gerou saída com saldo insuficiente.';
    if (reversed) headline = 'A baixa deste pedido já teve estorno registrado.';
    var details = [];
    if (count) details.push(count + ' registro' + (count === 1 ? '' : 's') + ' de estoque criado' + (count === 1 ? '' : 's'));
    if (regularizationCount) details.push(regularizationCount + ' regularização' + (regularizationCount === 1 ? '' : 'ões') + ' pendente' + (regularizationCount === 1 ? '' : 's'));
    if (skippedCount) details.push(skippedCount + ' item' + (skippedCount === 1 ? '' : 's') + ' sem vínculo');
    if (reversed) details.push('estorno registrado');
    var skippedHtml = skipped.length ? '<div style="margin-top:9px;display:flex;flex-wrap:wrap;gap:6px;">' + skipped.map(function (name) {
      return '<span style="display:inline-flex;align-items:center;min-height:26px;padding:0 9px;border-radius:999px;background:#fff;border:1px solid #F3D6C2;color:#8A3A12;font-size:11px;font-weight:700;">' + _esc(name) + '</span>';
    }).join('') + '</div>' : '';
    var regularizationHtml = regularizationItems.length ? '<div style="margin-top:9px;display:grid;gap:6px;">' + regularizationItems.slice(0, 8).map(function (item) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:12px;background:#fff;border:1px solid #F3D6C2;font-size:12px;color:#1F1F1F;">' +
        '<span style="font-weight:750;min-width:0;overflow-wrap:anywhere;">' + _esc(item.itemName || 'Item') + '</span>' +
        '<span style="font-weight:800;color:#9A3412;white-space:nowrap;">Falta ' + _esc(_fmtQty(item.shortageQuantity || 0)) + ' ' + _esc(item.unit || '') + '</span>' +
      '</div>';
    }).join('') + '</div>' : '';
    var help = regularizationPending
      ? 'A saída foi registrada para preservar o histórico. Nenhuma entrada automática foi criada; a regularização manual entra na próxima fase.'
      : (skippedCount
      ? 'Confira se esses produtos têm receita, produto pronto ou montagem interna configurada no cardápio.'
      : (created ? 'Esses registros aparecem em Estoque > Movimentações e entram no saldo dos itens envolvidos.' : 'Enquanto o pedido ainda não chegou nessa etapa, o estoque fica sem alteração.'));
    return '<div class="order-detail-card">' +
      '<div class="order-detail-head"><span class="mi">inventory_2</span><div><div class="order-detail-title">Estoque do pedido</div></div></div>' +
      '<div style="border:1px solid ' + border + ';background:' + bg + ';border-radius:14px;padding:12px;display:grid;gap:7px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:0;flex:1 1 260px;">' +
            '<div style="font-size:13px;font-weight:800;color:' + tone + ';line-height:1.35;">' + _esc(headline) + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.45;margin-top:3px;">' + _esc(help) + '</div>' +
          '</div>' +
          (details.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' + details.map(function (part) { return '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#fff;border:1px solid rgba(31,31,31,.07);color:#1F1F1F;font-size:11px;font-weight:750;">' + _esc(part) + '</span>'; }).join('') + '</div>' : '') +
        '</div>' +
        skippedHtml +
        regularizationHtml +
      '</div>' +
    '</div>';
  }

  function _detailCustomerMetaHTML(order, customer) {
    var lines = [
      _detailSmallLine('WhatsApp', _firstText(order && order.customerPhone, order && order.phone, order && order.whatsapp, customer && (customer.phone || customer.whatsapp), '')),
      _detailSmallLine('E-mail', _firstText(order && order.customerEmail, order && order.email, customer && customer.email, ''))
    ].filter(Boolean);
    return lines.length ? '<div style="margin-top:10px;display:grid;gap:5px;">' + lines.join('') + '</div>' : '';
  }

  function _detailAddressMetaHTML(order) {
    order = order || {};
    if (order.type === 'pickup') return '';
    var deliveryAddress = order.deliveryAddress && typeof order.deliveryAddress === 'object' ? order.deliveryAddress : {};
    var number = _firstText(order.addressNumber, deliveryAddress.number, '');
    var complement = _firstText(order.addressComplement, deliveryAddress.complement, '');
    var city = _firstText(order.addressCity, deliveryAddress.city, deliveryAddress.locality, '');
    var province = _firstText(order.addressProvince, deliveryAddress.province, deliveryAddress.state, '');
    var country = _firstText(order.addressCountry, deliveryAddress.country, deliveryAddress.countryCode, '');
    var zone = _firstText(order.deliveryZoneName, order.zone, deliveryAddress.zone, '');
    var lines = [
      _detailSmallLine('Número', number),
      _detailSmallLine('Complemento', complement),
      _detailSmallLine('Zona de entrega', zone),
      _detailSmallLine('Localidade', [city, province].filter(Boolean).join(' · ')),
      _detailSmallLine('País', country)
    ].filter(Boolean);
    return lines.length ? '<div style="margin-top:8px;display:grid;gap:5px;">' + lines.join('') + '</div>' : '';
  }

  function _detailPaymentBreakdownHTML(payment) {
    var rows = [];
    if (payment.originalSubtotal && payment.originalSubtotal !== payment.subtotal) rows.push(_detailSmallLine('Subtotal original', UI.fmt(payment.originalSubtotal)));
    if (payment.subtotal) rows.push(_detailSmallLine('Subtotal', UI.fmt(payment.subtotal)));
    if (payment.promoDiscount) rows.push(_detailSmallLine('Promoções', '-' + UI.fmt(payment.promoDiscount)));
    if (payment.couponDiscount) rows.push(_detailSmallLine('Cupom' + (payment.couponCode ? ' ' + payment.couponCode : ''), '-' + UI.fmt(payment.couponDiscount)));
    if (payment.pointsDiscount) rows.push(_detailSmallLine('Pontos', '-' + UI.fmt(payment.pointsDiscount)));
    if (payment.freeShippingApplied) rows.push(_detailSmallLine('Frete grátis' + (payment.freeShippingPromotionName ? ' · ' + payment.freeShippingPromotionName : ''), payment.originalDeliveryFee ? UI.fmt(payment.originalDeliveryFee) + ' → ' + UI.fmt(0) : UI.fmt(0)));
    if (payment.deliveryFee) rows.push(_detailSmallLine('Entrega', UI.fmt(payment.deliveryFee)));
    if (payment.discountTotal && !rows.some(function (line) { return line.indexOf('Promoções') >= 0 || line.indexOf('Cupom') >= 0 || line.indexOf('Pontos') >= 0; })) rows.push(_detailSmallLine('Descontos', '-' + UI.fmt(payment.discountTotal)));
    var channelCosts = payment.channelCosts || {};
    if (_num(channelCosts.channelFeeTotal) > 0) {
      if (_num(channelCosts.channelCommissionAmount) > 0) rows.push(_detailSmallLine('Comissão do canal', '-' + UI.fmt(channelCosts.channelCommissionAmount)));
      if (_num(channelCosts.channelCommissionTaxAmount) > 0) rows.push(_detailSmallLine('Imposto sobre comissão', '-' + UI.fmt(channelCosts.channelCommissionTaxAmount)));
      if (_num(channelCosts.channelFixedFeeAmount) > 0) rows.push(_detailSmallLine('Taxa fixa do canal', '-' + UI.fmt(channelCosts.channelFixedFeeAmount)));
      rows.push(_detailSmallLine('Líquido a receber', UI.fmt(channelCosts.netReceivable)));
    }
    return rows.length ? '<div style="margin:10px 0 12px;padding:10px 0;border-top:1px solid #F2EDED;border-bottom:1px solid #F2EDED;display:grid;gap:6px;">' + rows.join('') + '</div>' : '';
  }

  function _detailChoiceText(choices) {
    if (!choices) return '';
    if (Array.isArray(choices)) {
      return choices.map(function (choice) {
        if (choice === null || choice === undefined) return '';
        if (typeof choice === 'object') {
          var label = _firstText(choice.group, choice.groupName, choice.label, choice.name, '');
          var value = _firstText(choice.option, choice.optionName, choice.value, choice.text, '');
          var qty = _num(choice.qty != null ? choice.qty : choice.quantity != null ? choice.quantity : choice.count != null ? choice.count : 0);
          return [label, value].filter(Boolean).join(': ') + (qty > 1 ? ' x' + qty : '');
        }
        return String(choice || '').replace(/\s+/g, ' ').trim();
      }).filter(Boolean).join(' / ');
    }
    if (typeof choices === 'object') {
      return Object.keys(choices).map(function (key) {
        var value = choices[key];
        if (Array.isArray(value)) value = value.join(', ');
        return key + ': ' + value;
      }).filter(Boolean).join(' / ');
    }
    return String(choices || '').trim();
  }

  function _detailItemPricing(item) {
    item = item || {};
    var qty = Math.max(1, _num(item.qty != null ? item.qty : item.quantity != null ? item.quantity : item.count != null ? item.count : 1) || 1);
    var originalUnit = _num(item.originalUnitPrice != null ? item.originalUnitPrice : item.originalPrice != null ? item.originalPrice : item.priceOriginal != null ? item.priceOriginal : item.price != null ? item.price : 0);
    var finalUnit = _num(item.promoUnitPrice != null ? item.promoUnitPrice : item.finalPrice != null ? item.finalPrice : item.finalUpsellPrice != null ? item.finalUpsellPrice : item.unitPrice != null ? item.unitPrice : 0);
    var originalSubtotal = _num(item.originalTotal != null ? item.originalTotal : item.originalSubtotal != null ? item.originalSubtotal : 0);
    var subtotal = _num(item.promoTotal != null ? item.promoTotal : item.total != null ? item.total : item.subtotal != null ? item.subtotal : 0);
    if (!originalSubtotal && originalUnit) originalSubtotal = +(originalUnit * qty).toFixed(2);
    if (!subtotal && finalUnit) subtotal = +(finalUnit * qty).toFixed(2);
    if (!subtotal && originalSubtotal) subtotal = originalSubtotal;
    if (!finalUnit && subtotal && qty) finalUnit = +(subtotal / qty).toFixed(2);
    if (!originalUnit && originalSubtotal && qty) originalUnit = +(originalSubtotal / qty).toFixed(2);
    var discount = Math.max(0, originalSubtotal - subtotal);
    return {
      qty: qty,
      originalUnit: originalUnit,
      finalUnit: finalUnit,
      originalSubtotal: originalSubtotal,
      subtotal: subtotal,
      discount: discount,
      variants: _detailChoiceText(item.choices) || _detailChoiceText(item.variants) || _detailChoiceText(item.selections) || _detailChoiceText(item.options),
      note: item.note || item.observation || item.observations || item.comment || '',
      internalNote: _firstText(item.internalNote, item.productInternalNote, item.internalNotes, item.kitchenNote, '')
    };
  }

  function _detailChoiceOptionPrice(option) {
    var raw = option && (option.priceExtra != null ? option.priceExtra : option.extraPrice != null ? option.extraPrice : option.price != null ? option.price : option.valorExtra != null ? option.valorExtra : option.valor != null ? option.valor : 0);
    return _num(raw);
  }

  function _detailChoiceOptionLabel(option) {
    return _firstText(option && option.label, option && option.name, option && option.title, option && option.text, option && option.nome, option && option.value, '');
  }

  function _detailChoiceOptionImage(option) {
    var raw = _firstText(option && option.img, option && option.imageUrl, option && option.imageCardUrl, option && option.cardImageUrl, option && option.imageThumbUrl, option && option.thumbnailUrl, option && option.thumbUrl, option && option.photoUrl, option && option.image, option && option.url, '');
    if (!raw || raw === 'undefined' || raw === 'null' || raw === '#') return '';
    return raw;
  }

  function _normalizeDetailChoiceGroup(group, idx) {
    if (!group) return null;
    var options = (group.options || group.opcoes || group.choices || group.items || []).map(function (option, optionIdx) {
      var label = _detailChoiceOptionLabel(option);
      if (!label) return null;
      var id = _firstText(option.id, option.ref, option.value, option.key, label);
      return {
        id: id,
        ref: _firstText(option.ref, option.productId, option.sourceItemId, ''),
        label: label,
        priceExtra: _detailChoiceOptionPrice(option),
        img: _detailChoiceOptionImage(option),
        stockRef: _firstText(option.stockRef, option.stockItemRef, option.stockItem, ''),
        stockItemId: _firstText(option.stockItemId, option.itemId, ''),
        stockItemName: _firstText(option.stockItemName, option.itemName, ''),
        stockItemType: _firstText(option.stockItemType, option.itemClass, option.classe, ''),
        itemClass: _firstText(option.itemClass, option.stockItemType, option.classe, ''),
        classe: _firstText(option.classe, option.stockItemType, option.itemClass, ''),
        stockQuantity: _num(option.stockQuantity != null ? option.stockQuantity : option.stockQty),
        stockQuantityPerChoice: _num(option.stockQuantityPerChoice != null ? option.stockQuantityPerChoice : option.stockQuantity),
        stockUnit: _firstText(option.stockUnit, option.unit, ''),
        stockUnitCost: _num(option.stockUnitCost != null ? option.stockUnitCost : option.unitCost),
        order: optionIdx
      };
    }).filter(Boolean);
    if (!options.length) return null;
    var max = parseInt(group.maxPerUnit != null ? group.maxPerUnit : group.max != null ? group.max : group.qty != null ? group.qty : (group.multiSelect ? options.length : 1), 10);
    var min = parseInt(group.minPerUnit != null ? group.minPerUnit : group.min != null ? group.min : (group.required ? 1 : 0), 10);
    if (!isFinite(max) || max < 1) max = 1;
    if (!isFinite(min) || min < 0) min = 0;
    if (min > max) min = max;
    return {
      id: _firstText(group.id, group.key, 'group_' + idx),
      title: _firstText(group.title, group.name, group.label, 'Escolha'),
      min: min,
      max: max,
      required: group.required === true || min > 0,
      options: options
    };
  }

  function _detailProductChoiceGroups(product) {
    product = product || {};
    var source = [];
    if (Array.isArray(product.variants) && product.variants.length) source = product.variants;
    else if (Array.isArray(product.variantGroupIds) && product.variantGroupIds.length) {
      source = product.variantGroupIds.map(function (id) {
        return (_variantGroups || []).find(function (group) { return String(group.id || group._id || '') === String(id || ''); });
      }).filter(Boolean);
    }
    else if (Array.isArray(product.menuChoiceGroups) && product.menuChoiceGroups.length) source = product.menuChoiceGroups;
    else if (Array.isArray(product.menuItems) && product.menuItems.length) {
      source = product.menuItems.map(function (item, idx) {
        var label = _firstText(item.label, item.name, item.title, item.ref, 'Opção ' + (idx + 1));
        return { title: 'Escolha ' + (idx + 1), min: _num(item.qty || 1) || 1, max: _num(item.qty || 1) || 1, options: [{ id: _firstText(item.ref, label), ref: item.ref || '', label: label, priceExtra: 0 }] };
      });
    }
    return source.map(_normalizeDetailChoiceGroup).filter(Boolean);
  }

  function _detailChoiceKey(group, option) {
    return String((group && group.id) || '') + '::' + String((option && (option.id || option.ref || option.label)) || '');
  }

  function _detailExistingChoiceKeys(item) {
    var keys = {};
    var choices = [];
    ['choices', 'variants', 'selections', 'options', 'selectedOptions'].forEach(function (field) {
      if (Array.isArray(item && item[field])) choices = choices.concat(item[field]);
    });
    choices.forEach(function (choice) {
      if (!choice || typeof choice !== 'object') return;
      var groupId = _firstText(choice.groupId, choice.groupKey, choice.group, choice.groupName, '');
      var optionId = _firstText(choice.optionId, choice.id, choice.ref, choice.value, choice.option, choice.optionName, choice.label, choice.name, '');
      if (groupId && optionId) keys[String(groupId) + '::' + String(optionId)] = true;
    });
    return keys;
  }

  function _detailChoiceExtraTotal(choices) {
    if (!Array.isArray(choices)) return 0;
    return choices.reduce(function (sum, choice) {
      return sum + _num(choice && (choice.priceExtra != null ? choice.priceExtra : choice.extraPrice != null ? choice.extraPrice : choice.price || 0));
    }, 0);
  }

  function _detailItemChoiceList(item) {
    var fields = ['choices', 'variants', 'selectedOptions', 'selections', 'options'];
    for (var i = 0; i < fields.length; i++) {
      var list = item && item[fields[i]];
      if (Array.isArray(list) && list.length) return list;
    }
    return [];
  }

  function _openDetailChoicesModal(orderId, idx) {
    var order = (_orders || []).find(function (x) { return String(x.id || '') === String(orderId || ''); });
    var item = order && Array.isArray(order.items) ? order.items[idx] : null;
    var product = item ? _findProductForOrderItem(item) : null;
    var groups = _detailProductChoiceGroups(product);
    if (!order || !item || !groups.length) {
      UI.toast('Este item não tem escolhas cadastradas para editar.', 'info');
      return;
    }
    var existing = _detailExistingChoiceKeys(item);
    var body = '<style>' +
      '.order-choice-editor{display:grid;gap:12px;font-family:Manrope,Inter,sans-serif;}' +
      '.order-choice-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:14px;box-shadow:0 10px 22px rgba(31,31,31,.045);}' +
      '.order-choice-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;}' +
      '.order-choice-title{font-size:13px;font-weight:760;color:#1F1F1F;line-height:1.25;}' +
      '.order-choice-help{font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;}' +
      '.order-choice-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;}' +
      '.order-choice-option{min-width:0;display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #EADFD8;border-radius:12px;background:#FFFCF8;cursor:pointer;box-sizing:border-box;}' +
      '.order-choice-option input{width:16px;height:16px;accent-color:#B42318;flex:0 0 auto;}' +
      '.order-choice-thumb{width:34px;height:34px;border-radius:9px;object-fit:cover;flex:0 0 auto;background:#F7F1EE;}' +
      '.order-choice-option-name{font-size:12px;color:#1F1F1F;line-height:1.25;}' +
      '.order-choice-option-price{font-size:11px;color:#6F6860;line-height:1.25;margin-top:2px;}' +
      '@media(max-width:720px){.order-choice-options{grid-template-columns:1fr;}}' +
    '</style>' +
    '<div class="order-choice-editor">' +
      '<div style="font-size:12px;color:#6F6860;line-height:1.45;">Ajuste somente as escolhas deste item no pedido. O cadastro do produto não será alterado.</div>' +
      groups.map(function (group, groupIdx) {
        var inputType = group.max === 1 && group.min > 0 ? 'radio' : 'checkbox';
        var rule = group.min > 0 ? ('Escolha ' + group.min + (group.max !== group.min ? ' a ' + group.max : '') + '.') : ('Escolha até ' + group.max + '.');
        return '<div class="order-choice-card" data-choice-group="' + groupIdx + '" data-min="' + _esc(String(group.min)) + '" data-max="' + _esc(String(group.max)) + '">' +
          '<div class="order-choice-head"><span class="mi" style="font-size:18px;color:#8A7E7C;">tune</span><div><div class="order-choice-title">' + _esc(group.title) + '</div><div class="order-choice-help">' + _esc(rule) + '</div></div></div>' +
          '<div class="order-choice-options">' +
            group.options.map(function (option, optionIdx) {
              var key = _detailChoiceKey(group, option);
              var checked = existing[key] || existing[String(group.title) + '::' + String(option.label)] || existing[String(group.id) + '::' + String(option.label)] ? ' checked' : '';
              return '<label class="order-choice-option">' +
                '<input type="' + inputType + '" name="order-choice-' + groupIdx + '" data-group-index="' + groupIdx + '" data-option-index="' + optionIdx + '"' + checked + '>' +
                (option.img ? '<img class="order-choice-thumb" src="' + _esc(option.img) + '" alt="">' : '') +
                '<span style="min-width:0;"><span class="order-choice-option-name">' + _esc(option.label) + '</span>' +
                (option.priceExtra ? '<span class="order-choice-option-price">' + (option.priceExtra > 0 ? '+' : '') + UI.fmt(option.priceExtra) + '</span>' : '') +
                '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
    window._orderDetailChoicesState = { orderId: orderId, index: idx, groups: groups };
    window._orderDetailChoicesModal = UI.modal({
      title: 'Editar escolhas',
      body: body,
      footer: '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;"><button type="button" onclick="Modules.Pedidos._closeDetailChoicesModal()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button><button type="button" onclick="Modules.Pedidos._saveDetailChoices()" style="height:40px;padding:0 16px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Salvar escolhas</button></div>',
      maxWidth: '760px'
    });
    if (window._orderDetailChoicesModal && window._orderDetailChoicesModal.el) {
      window._orderDetailChoicesModal.el.style.zIndex = _isKitchenModeOpen() ? '20030' : '9100';
    }
  }

  function _closeDetailChoicesModal() {
    if (window._orderDetailChoicesModal && window._orderDetailChoicesModal.close) window._orderDetailChoicesModal.close();
    window._orderDetailChoicesModal = null;
    window._orderDetailChoicesState = null;
  }

  function _saveDetailChoices() {
    var state = window._orderDetailChoicesState || {};
    var order = (_orders || []).find(function (x) { return String(x.id || '') === String(state.orderId || ''); });
    var item = order && Array.isArray(order.items) ? order.items[state.index] : null;
    if (!order || !item) return;
    var choices = [];
    var invalid = '';
    (state.groups || []).forEach(function (group, groupIdx) {
      var checked = Array.prototype.slice.call(document.querySelectorAll('input[data-group-index="' + groupIdx + '"]:checked'));
      if (checked.length < group.min) invalid = 'Complete "' + group.title + '" antes de salvar.';
      if (!invalid && checked.length > group.max) invalid = 'Em "' + group.title + '", escolha no máximo ' + group.max + '.';
      checked.forEach(function (input) {
        var option = group.options[parseInt(input.getAttribute('data-option-index'), 10)] || {};
        choices.push({
          groupId: group.id,
          group: group.title,
          groupName: group.title,
          optionId: option.id,
          ref: option.ref || '',
          option: option.label,
          optionName: option.label,
          label: option.label,
          name: option.label,
          value: option.label,
          priceExtra: _num(option.priceExtra),
          img: option.img || '',
          stockRef: option.stockRef || '',
          stockItemId: option.stockItemId || '',
          stockItemName: option.stockItemName || '',
          stockItemType: option.stockItemType || '',
          itemClass: option.itemClass || option.stockItemType || '',
          classe: option.classe || option.stockItemType || '',
          stockQuantityPerChoice: _num(option.stockQuantityPerChoice || option.stockQuantity),
          stockQuantity: _num(option.stockQuantity || option.stockQuantityPerChoice),
          stockUnit: option.stockUnit || option.unit || '',
          stockUnitCost: _num(option.stockUnitCost),
          qty: 1
        });
      });
    });
    if (invalid) {
      UI.toast(invalid, 'error');
      return;
    }
    var product = _findProductForOrderItem(item) || {};
    var items = _detailEditedItems(order);
    var edited = Object.assign({}, items[state.index] || item);
    var oldPricing = _detailItemPricing(item);
    var oldExtra = _detailChoiceExtraTotal(_detailItemChoiceList(item));
    var newExtra = _detailChoiceExtraTotal(choices);
    var productBase = _num(product.price != null ? product.price : product.salePrice != null ? product.salePrice : product.preco != null ? product.preco : 0);
    var finalBase = Math.max(0, (oldPricing.finalUnit || productBase || 0) - oldExtra);
    var originalBase = Math.max(0, (oldPricing.originalUnit || productBase || finalBase || 0) - oldExtra);
    var finalUnit = Math.max(0, finalBase + newExtra);
    var originalUnit = Math.max(finalUnit, originalBase + newExtra);
    var qty = Math.max(_num(edited.qty || edited.quantity || oldPricing.qty), 0.01);
    var total = +(qty * finalUnit).toFixed(2);
    edited = Object.assign({}, edited, {
      choices: choices,
      selectedOptions: choices,
      variants: choices,
      options: choices,
      basePrice: finalBase,
      originalUnitPrice: originalUnit,
      originalPrice: originalUnit,
      price: finalUnit,
      unitPrice: finalUnit,
      finalPrice: finalUnit,
      total: total,
      subtotal: total,
      lineTotal: total,
      originalTotal: +(qty * originalUnit).toFixed(2),
      originalSubtotal: +(qty * originalUnit).toFixed(2)
    });
    items[state.index] = edited;
    var payload = _orderItemTotalsPayload(order, items);
    payload.updatedAt = _nowIso();
    DB.update('orders', order.id, payload).then(function () {
      Object.assign(order, payload);
      _closeDetailChoicesModal();
      _syncOrderFinanceMovement(order.id, order);
      _refreshDetailView(order.id);
      UI.toast('Escolhas do item atualizadas.', 'success');
    }).catch(function (err) {
      UI.toast('Erro ao salvar escolhas: ' + (err && err.message ? err.message : 'falha'), 'error');
    });
  }

  function _detailItemHTML(item, idx, order) {
    var p = _detailItemPricing(item);
    var product = _findProductForOrderItem(item);
    var hasChoiceEditor = _detailProductChoiceGroups(product).length > 0;
    var extra = [];
    if (p.variants) extra.push('<div style="font-size:11px;color:#8A7E7C;line-height:1.45;">' + _esc(p.variants) + '</div>');
    if (p.internalNote) extra.push('<div style="margin-top:4px;font-size:11px;color:#6F6860;line-height:1.4;"><span style="font-weight:650;color:#1A1A1A;">Observação interna:</span> ' + _esc(p.internalNote) + '</div>');
    return '<div class="pm-check-item' + (item.checked ? ' checked' : '') + '" data-detail-item-index="' + idx + '" style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;background:transparent;border:0;border-bottom:1px solid #F2EDED;border-radius:0;transition:background .15s;">' +
      '<input type="checkbox"' + (item.checked ? ' checked' : '') + ' onclick="event.stopPropagation();Modules.Pedidos._toggleItem(\'' + _esc(order.id) + '\',' + idx + ',this.parentNode)" style="margin-top:10px;width:16px;height:16px;accent-color:#1A9E5A;flex-shrink:0;cursor:pointer;">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(130px,150px) auto;gap:10px;align-items:start;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:13px;font-weight:700;line-height:1.25;color:#1F1F1F;">' + _esc(item.name || item.productName || 'Item') + '</div>' +
            extra.join('') +
          '</div>' +
          '<div style="display:grid;gap:6px;align-items:start;justify-content:stretch;">' +
            '<div style="display:grid;grid-template-columns:38px minmax(0,1fr);gap:7px;align-items:center;"><label class="order-detail-label" style="margin-bottom:0;">Qtd.</label><div class="order-detail-field-control order-detail-field-control-sm"><input id="detail-item-qty-' + idx + '" type="number" min="0.01" step="0.01" value="' + _esc(String(p.qty || 1)) + '" onclick="event.stopPropagation()"></div></div>' +
            '<div><label class="order-detail-label">Valor unitário</label><div class="order-detail-field-control order-detail-field-control-sm"><input id="detail-item-price-' + idx + '" type="text" inputmode="decimal" value="' + _esc(UI.fmt(p.finalUnit || 0)) + '" onclick="event.stopPropagation()" onblur="Modules.Pedidos._formatDetailMoneyField(this)"></div></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:1px;"><span style="font-size:10px;color:#8A7E7C;">Subtotal</span><span style="font-size:13px;font-weight:750;color:#B42318;">' + UI.fmt(p.subtotal) + '</span></div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;white-space:nowrap;text-align:right;">' +
            '<div style="display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap;">' +
              (hasChoiceEditor ? '<button type="button" onclick="event.stopPropagation();Modules.Pedidos._openDetailChoicesModal(\'' + _esc(order.id) + '\',' + idx + ')" style="height:30px;padding:0 9px;border:1px solid #EADFD8;border-radius:9px;background:#FFFCF8;color:#1F1F1F;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;"><span class="mi" style="font-size:14px;">tune</span>Editar escolhas</button>' : '') +
              '<button type="button" onclick="event.stopPropagation();Modules.Pedidos._removeDetailItem(\'' + _esc(order.id) + '\',' + idx + ')" style="height:30px;padding:0 9px;border:1px solid #F3D6D2;border-radius:9px;background:#FFF7F5;color:#B42318;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;"><span class="mi" style="font-size:14px;">delete</span>Remover</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _canResolveOrderStock(order) {
    if (!order || !order.id || !order.stockMovementCreated) return false;
    return !_statusCancelsStockMovement(order.status);
  }

  function _openOrderStockResolution(orderId) {
    var order = (_orders || []).find(function (x) { return String(x.id || '') === String(orderId || ''); });
    if (!order) return;
    if (!_canResolveOrderStock(order)) {
      UI.toast('Este pedido ainda não tem baixa de estoque para tratar.', 'info');
      return;
    }
    DB.getAll('stock_movements').catch(function () { return []; }).then(function (rows) {
      var movements = (rows || []).filter(function (movement) {
        return movement && (movement.type === 'saida_venda' || movement.type === 'saida_base_venda') && String(movement.orderId || '') === String(orderId || '');
      });
      if (!movements.length) {
        UI.toast('Nenhuma baixa de estoque foi encontrada para este pedido.', 'info');
        return;
      }
      var related = (rows || []).filter(function (movement) {
        return movement && String(movement.orderId || '') === String(orderId || '') && (movement.type === 'retorno_venda' || movement.type === 'perda_venda');
      });
      var handled = {};
      related.forEach(function (movement) {
        var key = String(movement.sourceSaleMovementId || movement.reversalOf || '');
        if (!key) return;
        handled[key] = (handled[key] || 0) + _num(movement.quantity);
      });
      var rowsHtml = movements.map(function (movement, idx) {
        var key = String(movement.id || _stockMovementOrderId(orderId, idx));
        var originalQty = _num(movement.quantity);
        var doneQty = _num(handled[key] || 0);
        var available = Math.max(0, originalQty - doneQty);
        var disabled = available <= 0 ? ' disabled' : '';
        return '<div class="order-stock-resolution-row" data-movement="' + _esc(key) + '" data-max="' + _esc(String(available)) + '">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.3;">' + _esc(movement.productName || movement.itemName || movement.fichaTecnicaNome || movement.baseProductionName || 'Item') + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">Saiu do estoque: ' + _esc(String(originalQty)) + ' ' + _esc(movement.unit || '') + (doneQty ? ' · já tratado: ' + _esc(String(doneQty)) : '') + '</div>' +
          '</div>' +
          '<div class="order-stock-resolution-controls">' +
            '<label><span>Ação</span><select id="stock-resolution-action-' + idx + '"' + disabled + '><option value="">Nada por enquanto</option><option value="return">Voltou para o estoque</option><option value="loss">Virou perda</option></select></label>' +
            '<label><span>Quantidade</span><input id="stock-resolution-qty-' + idx + '" type="number" min="0" max="' + _esc(String(available)) + '" step="0.001" value="0"' + disabled + '></label>' +
          '</div>' +
        '</div>';
      }).join('');
      var body = '<style>' +
        '.order-stock-resolution{display:flex;flex-direction:column;gap:12px;font-family:Manrope,Inter,sans-serif;}' +
        '.order-stock-resolution-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:14px;box-shadow:0 8px 18px rgba(31,31,31,.035);}' +
        '.order-stock-resolution-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.64fr);gap:12px;align-items:end;padding:11px 0;border-bottom:1px solid #F2EDED;}' +
        '.order-stock-resolution-row:last-child{border-bottom:0;padding-bottom:0;}' +
        '.order-stock-resolution-controls{display:grid;grid-template-columns:minmax(160px,.72fr) minmax(96px,.36fr);gap:9px;align-items:end;}' +
        '.order-stock-resolution label span{font-size:10px;font-weight:650;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;}' +
        '.order-stock-resolution input,.order-stock-resolution select{width:100%;height:38px;border:1px solid #E8DCD7;border-radius:11px;padding:0 11px;background:#FFFCF8;color:#1F1F1F;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;}' +
        '.order-stock-resolution select{padding-right:34px;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 13px center;background-size:14px;}' +
        '.order-stock-resolution textarea{width:100%;min-height:74px;border:1px solid #E8DCD7;border-radius:12px;padding:10px 12px;background:#FFFCF8;color:#1F1F1F;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;resize:vertical;line-height:1.45;}' +
        '@media(max-width:760px){.order-stock-resolution-row,.order-stock-resolution-controls{grid-template-columns:1fr;}}' +
      '</style>' +
      '<div class="order-stock-resolution">' +
        '<div class="order-stock-resolution-card">' +
          '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;"><span class="mi" style="font-size:18px;color:#6F6860;">inventory_2</span><div><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Retorno ou perda do pedido</div><p style="font-size:12px;color:#6F6860;line-height:1.45;margin:3px 0 0;">Use quando algum item já saiu do estoque, mas depois voltou ou precisou ser descartado.</p></div></div>' +
          rowsHtml +
        '</div>' +
        '<div class="order-stock-resolution-card">' +
          '<label><span style="font-size:10px;font-weight:650;color:#6F6860;display:block;margin-bottom:5px;">Motivo ou observação</span><textarea id="stock-resolution-note" placeholder="Ex.: cliente não retirou o pedido, refrigerante voltou fechado e salgado foi descartado."></textarea></label>' +
        '</div>' +
      '</div>';
      window._orderStockResolutionModal = UI.modal({
        title: 'Retorno e perda do pedido',
        body: body,
        footer: '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;"><button onclick="if(window._orderStockResolutionModal){window._orderStockResolutionModal.close();}" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button><button onclick="Modules.Pedidos._saveOrderStockResolution(\'' + _esc(orderId) + '\')" style="height:40px;padding:0 16px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Salvar tratamento</button></div>',
        maxWidth: '860px'
      });
      window._orderStockResolutionData = { orderId: orderId, movements: movements, handled: handled };
    }).catch(function (err) {
      UI.toast('Erro ao carregar movimentações: ' + (err && err.message ? err.message : 'falha'), 'error');
    });
  }

  function _saveOrderStockResolution(orderId) {
    var state = window._orderStockResolutionData || {};
    var order = (_orders || []).find(function (x) { return String(x.id || '') === String(orderId || ''); });
    if (!order || String(state.orderId || '') !== String(orderId || '')) return;
    var note = String((document.getElementById('stock-resolution-note') || {}).value || '').trim();
    var now = _nowIso();
    var ops = [];
    var invalidMessage = '';
    var returnedQty = 0;
    var lossQty = 0;
    (state.movements || []).forEach(function (movement, idx) {
      var action = String((document.getElementById('stock-resolution-action-' + idx) || {}).value || '');
      var qty = _num((document.getElementById('stock-resolution-qty-' + idx) || {}).value || 0);
      if (!action || qty <= 0) return;
      var movementId = String(movement.id || _stockMovementOrderId(orderId, idx));
      var available = Math.max(0, _num(movement.quantity) - _num((state.handled || {})[movementId] || 0));
      if (qty - available > 0.0001) {
        invalidMessage = 'A quantidade informada para ' + (movement.productName || movement.itemName || 'um item') + ' passa do que saiu do estoque.';
        return;
      }
      var type = action === 'return' ? 'retorno_venda' : 'perda_venda';
      var id = String(orderId || 'pedido').replace(/[^\w-]/g, '_') + '_' + movementId.replace(/[^\w-]/g, '_') + '_' + type + '_' + Date.now() + '_' + idx;
      if (action === 'return') returnedQty += qty;
      if (action === 'loss') lossQty += qty;
      ops.push(DB.col('stock_movements').doc(id).set(Object.assign({}, movement, {
        id: id,
        type: type,
        movementGroup: 'order_resolution',
        resolutionAction: action,
        sourceSaleMovementId: movementId,
        reversalOf: action === 'return' ? movementId : '',
        stockEffect: action === 'return' ? 'entry' : 'none',
        quantity: qty,
        totalCost: _num(movement.unitCost) > 0 ? qty * _num(movement.unitCost) : 0,
        resolutionReason: note,
        lossReason: action === 'loss' ? note : '',
        returnReason: action === 'return' ? note : '',
        movementDate: _today(),
        createdAt: now,
        updatedAt: now
      }, { merge: true })));
    });
    if (invalidMessage) {
      UI.toast(invalidMessage, 'error');
      return;
    }
    if (!ops.length) {
      UI.toast('Escolha pelo menos um item para devolver ou registrar como perda.', 'info');
      return;
    }
    Promise.all(ops).then(function () {
      var patch = {
        stockResolutionCreated: true,
        stockResolutionUpdatedAt: now,
        stockResolutionCount: _num(order.stockResolutionCount || 0) + ops.length,
        stockReturnedQuantity: _num(order.stockReturnedQuantity || 0) + returnedQty,
        stockLossQuantity: _num(order.stockLossQuantity || 0) + lossQty
      };
      return DB.update('orders', orderId, patch).then(function () {
        Object.assign(order, patch);
        if (window._orderStockResolutionModal) window._orderStockResolutionModal.close();
        UI.toast('Estoque do pedido atualizado.', 'success');
        _refreshDetailView(orderId);
      });
    }).catch(function (err) {
      UI.toast('Erro ao salvar: ' + (err && err.message ? err.message : 'falha'), 'error');
    });
  }

  function _detailObservationBlocks(order) {
    var blocks = [];
    if (order.note) blocks.push({ label: 'Observación del cliente', text: order.note, color: '#FFF7ED' });
    if (order.kitchenNote) blocks.push({ label: 'Observación da cozinha', text: order.kitchenNote, color: '#F5F3FF' });
    if (order.internalNote) blocks.push({ label: 'Observación interna', text: order.internalNote, color: '#FAF8F8' });
    if (!blocks.length) return '<div style="font-size:13px;color:#8A7E7C;">Sin observaciones</div>';
    return blocks.map(function (b) {
      return '<div style="background:' + b.color + ';border-radius:12px;padding:12px;border:1px solid #F2EDED;">' +
        '<div style="font-size:10px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:5px;">' + _esc(b.label) + '</div>' +
        '<div style="font-size:13px;color:#1A1A1A;line-height:1.5;">' + _esc(b.text) + '</div>' +
      '</div>';
    }).join('');
  }

  function _detailWhatsappMsg(order, statusLabel) {
    return _orderStatusWhatsappMessage(order, statusLabel || order.status || 'Pendente');
  }

  function _showDetailWhatsappPrompt(order, status) {
    _detailWhatsappPromptVisible = true;
    var el = document.getElementById('detail-whatsapp-prompt');
    if (!el) return;
    var phone = _orderPhoneDigits(order);
    var msg = _detailWhatsappMsg(order, _orderStatusLabel(status || order.status));
    el.style.display = 'block';
    el.innerHTML = '<div style="margin-top:12px;border:1px solid #EAE4DA;border-radius:16px;padding:14px;background:#fff;box-shadow:0 12px 30px rgba(31,31,31,.06);display:flex;flex-direction:column;gap:10px;">' +
      '<div style="font-size:11px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.04em;">Atualização do pedido</div>' +
      '<div style="font-size:14px;font-weight:800;color:#1F1F1F;">Quer avisar a cliente pelo WhatsApp?</div>' +
      '<div style="font-size:13px;color:#6F6860;line-height:1.45;">' + (phone ? 'A mensagem já está pronta para enviar.' : 'Este pedido não tem telefone cadastrado.') + '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        (phone ? '<button onclick="Modules.Pedidos._sendDetailWhatsapp(\'' + _esc(order.id) + '\', \'' + _esc(status || order.status || '') + '\')" style="height:38px;border:none;background:#1A9E5A;color:#fff;border-radius:10px;padding:0 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(26,158,90,.14);">Enviar WhatsApp</button>' : '<button disabled style="height:38px;border:none;background:#E5E7EB;color:#9CA3AF;border-radius:10px;padding:0 14px;font-size:13px;font-weight:700;cursor:not-allowed;font-family:inherit;">Enviar WhatsApp</button>') +
        '<button onclick="Modules.Pedidos._hideDetailWhatsappPrompt()" style="height:38px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;padding:0 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Agora não</button>' +
      '</div>' +
      '<div style="display:none" data-detail-whatsapp-msg>' + _esc(msg) + '</div>' +
    '</div>';
  }

  function _hideDetailWhatsappPrompt() {
    _detailWhatsappPromptVisible = false;
    var el = document.getElementById('detail-whatsapp-prompt');
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
  }

  function _sendDetailWhatsapp(orderId, status) {
    var order = _orders.find(function (x) { return String(x.id || '') === String(orderId || ''); });
    if (!order) return;
    var phone = _orderPhoneDigits(order);
    if (!phone) {
      UI.toast('Sin teléfono registrado para avisar por WhatsApp.', 'info');
      return;
    }
    var msg = _detailWhatsappMsg(order, _orderStatusLabel(status || order.status));
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function _orderClientActions(order, customer) {
    var phone = _orderPhoneDigits(order);
    var cid = _customerRecordId(customer);
    if (customer && cid) {
      return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">' +
        '<button type="button" onclick="event.stopPropagation();Modules.Pedidos._openClientProfile(\'' + _esc(cid) + '\');return false;" style="height:34px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(31,31,31,.05);">Ver cliente</button>' +
        (phone ? '<button onclick="Modules.Pedidos._waFromDetail(\'' + _esc(order.id) + '\');event.stopPropagation();" style="height:34px;border:1px solid rgba(26,158,90,.18);background:#E8FFF1;color:#1A9E5A;border-radius:10px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">WhatsApp</button>' : '<span style="font-size:12px;color:#8A7E7C;">Sem telefone registrado</span>') +
      '</div>';
    }
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">' +
      '<button onclick="event.stopPropagation();Modules.Pedidos._openOrderCustomerModal(\'' + _esc(order.id) + '\');" style="height:34px;border:none;background:#B42318;color:#fff;border-radius:10px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Cadastrar cliente</button>' +
      (phone ? '<button onclick="Modules.Pedidos._waFromDetail(\'' + _esc(order.id) + '\');event.stopPropagation();" style="height:34px;border:1px solid rgba(26,158,90,.18);background:#E8FFF1;color:#1A9E5A;border-radius:10px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">WhatsApp</button>' : '<span style="font-size:12px;color:#8A7E7C;">Sem telefone registrado</span>') +
    '</div>';
  }

  function _orderPickupText(order) {
    return _firstText(order.pickupAddress, order.deliveryLocation, _generalConfig.pickupAddress, _generalConfig.pickupArea, 'Retirada no local');
  }

  function _orderAddressText(order) {
    order = order || {};
    var deliveryAddress = order.deliveryAddress && typeof order.deliveryAddress === 'object' ? order.deliveryAddress : {};
    var street = _firstText(order.address, order.streetAddress, deliveryAddress.address, deliveryAddress.street, '');
    var number = _firstText(order.addressNumber, deliveryAddress.number, '');
    var complement = _firstText(order.addressComplement, order.complement, deliveryAddress.complement, '');
    var neighborhood = _firstText(order.neighborhood, deliveryAddress.neighborhood, order.deliveryZoneName, order.zone, '');
    var postal = _firstText(order.postalCode, order.postal, deliveryAddress.postalCode, deliveryAddress.zip, '');
    var parts = [[street, number].filter(Boolean).join(', '), complement, neighborhood, postal].filter(Boolean);
    return parts.join(' · ');
  }

  function _openOrderCustomerModal(order) {
    if (order && typeof order !== 'object') {
      var wantedOrderId = String(order || '');
      order = (_orders || []).find(function (x) { return String(x.id || '') === wantedOrderId; }) || {};
    }
    order = order || {};
    if (!order.id) {
      UI.toast('Pedido não encontrado para vincular cliente.', 'error');
      return;
    }
    var matched = _matchedCustomer(order);
    var name = matched ? matched.name : (order.customerName || order.clientName || order.name || '');
    var phone = matched ? (matched.phone || matched.whatsapp || '') : _firstText(order.phone, order.customerPhone, order.whatsapp, '');
    var email = matched ? (matched.email || '') : _firstText(order.email, order.customerEmail, '');
    var address = matched ? (matched.address || '') : _firstText(order.address, order.deliveryAddress, '');
    var notes = matched ? (matched.notes || matched.internalNotes || '') : _firstText(order.note, order.kitchenNote, order.internalNote, '');
    var footer = '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
      '<button type="button" onclick="Modules.Pedidos._closeCustomerModal()" style="height:40px;padding:0 15px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button>' +
      '<button type="button" onclick="Modules.Pedidos._saveOrderCustomer(\'' + _esc(order.id || '') + '\')" style="height:40px;padding:0 16px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Salvar cliente</button>' +
    '</div>';
    var body = '<div style="display:grid;gap:12px;">' +
      '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="font-size:11px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;">Dados do cliente</div>' +
        '<div style="display:grid;grid-template-columns:1.2fr .8fr;gap:12px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#6F6860;display:block;margin-bottom:5px;">Nome</label><input id="oc-name" value="' + _esc(name) + '" style="width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#1F1F1F;"></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#6F6860;display:block;margin-bottom:5px;">Telefone / WhatsApp</label><input id="oc-phone" value="' + _esc(phone) + '" placeholder="Telefone / WhatsApp" style="width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#1F1F1F;"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">' +
          '<div><label style="font-size:11px;font-weight:700;color:#6F6860;display:block;margin-bottom:5px;">E-mail</label><input id="oc-email" value="' + _esc(email) + '" style="width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#1F1F1F;"></div>' +
          '<div><label style="font-size:11px;font-weight:700;color:#6F6860;display:block;margin-bottom:5px;">Endereço</label><input id="oc-address" value="' + _esc(address) + '" style="width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#1F1F1F;"></div>' +
        '</div>' +
        '<div style="margin-top:12px;"><label style="font-size:11px;font-weight:700;color:#6F6860;display:block;margin-bottom:5px;">Observações</label><textarea id="oc-notes" style="width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#1F1F1F;min-height:84px;resize:vertical;">' + _esc(notes) + '</textarea></div>' +
      '</div>' +
      '<div style="font-size:13px;color:#6F6860;line-height:1.45;">O cliente será vinculado ao pedido atual após salvar.</div>' +
    '</div>';
    var overlay = document.createElement('div');
    overlay.id = 'pedidos-customer-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;background:rgba(31,31,31,.42);display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = '<div style="background:#fff;width:100%;max-width:760px;max-height:90vh;border-radius:18px;box-shadow:0 24px 70px rgba(31,31,31,.22);display:flex;flex-direction:column;overflow:hidden;">' +
      '<div style="padding:18px 20px;border-bottom:1px solid #EAE4DA;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">' +
        '<div>' +
          '<div style="font-size:11px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Cliente</div>' +
          '<h2 style="font-size:22px;font-weight:800;line-height:1.1;margin:0;color:#1F1F1F;">Cadastrar cliente</h2>' +
        '</div>' +
        '<button onclick="Modules.Pedidos._closeCustomerModal()" style="width:34px;height:34px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;cursor:pointer;font-size:16px;flex-shrink:0;font-family:inherit;">✕</button>' +
      '</div>' +
      '<div style="padding:16px 20px 18px;overflow:auto;flex:1;min-height:0;background:#FAF8F5;">' + body + '</div>' +
      '<div style="padding:16px 20px;border-top:1px solid #EAE4DA;background:#fff;flex:0 0 auto;">' + footer + '</div>' +
    '</div>';
    document.body.appendChild(overlay);
    window._orderCustomerModal = { el: overlay, close: _closeCustomerModal };
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('oc-address'); }, 200);
  }

  function _closeCustomerModal() {
    var el = document.getElementById('pedidos-customer-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    window._orderCustomerModal = null;
  }

  function _saveOrderCustomer(orderId) {
    var order = _orders.find(function (x) { return String(x.id || '') === String(orderId || ''); });
    if (!order) return;
    var name = String((document.getElementById('oc-name') || {}).value || '').trim();
    var phone = String((document.getElementById('oc-phone') || {}).value || '').trim();
    var email = String((document.getElementById('oc-email') || {}).value || '').trim();
    var address = String((document.getElementById('oc-address') || {}).value || '').trim();
    var notes = String((document.getElementById('oc-notes') || {}).value || '').trim();
    if (!name) { UI.toast('Informe o nome do cliente.', 'error'); return; }
    var match = _customers.find(function (c) {
      if (order.customerId && _customerRecordId(c) === String(order.customerId)) return true;
      var opPhone = _phone(phone);
      if (opPhone && _phone(c.phone || c.whatsapp || '') === opPhone) return true;
      return _clean(c.name || '') === _clean(name);
    });
    var data = {
      name: name,
      phone: phone,
      whatsapp: phone,
      email: email,
      address: address,
      notes: notes,
      internalNotes: notes,
      origin: 'pedido',
      mainChannel: _orderChannelLabel(order),
      channelName: _orderChannelLabel(order),
      status: 'ativo',
      acceptsMarketing: false,
      totalOrders: match && match.totalOrders ? match.totalOrders : 0,
      totalSpent: match && match.totalSpent ? match.totalSpent : 0
    };
    var matchId = _customerRecordId(match);
    var op = matchId ? DB.update('store_customers', matchId, data) : DB.add('store_customers', data);
    op.then(function (ref) {
      var customerId = matchId || (ref && ref.id ? ref.id : ref);
      return DB.update('orders', orderId, {
        customerId: customerId,
        clientId: customerId,
        customerName: name,
        clientName: name,
        name: name,
        phone: phone,
        customerPhone: phone,
        whatsapp: phone,
        email: email,
        customerEmail: email,
        address: address || order.address || '',
        note: notes || order.note || '',
        internalNote: notes || order.internalNote || '',
        fiscal: _ensureOrderFiscalDefaults(Object.assign({}, order, {
          customerId: customerId,
          clientId: customerId,
          customerName: name,
          clientName: name,
          name: name,
          phone: phone,
          customerPhone: phone,
          whatsapp: phone,
          email: email,
          customerEmail: email,
          address: address || order.address || '',
          customerFiscal: match && match.fiscal ? match.fiscal : {},
          fiscal: Object.assign({}, order.fiscal || {}, { customerSnapshot: null })
        })).fiscal
      }).then(function () {
        _orders = _orders.map(function (o) {
          if (String(o.id || '') !== String(orderId || '')) return o;
          return Object.assign({}, o, {
            customerId: customerId,
            clientId: customerId,
            customerName: name,
            clientName: name,
            name: name,
            phone: phone,
            customerPhone: phone,
            whatsapp: phone,
            email: email,
            customerEmail: email,
            address: address || o.address || '',
            note: notes || o.note || '',
            internalNote: notes || o.internalNote || ''
          });
        });
        _closeCustomerModal();
        _closeDetailModal();
        _openDetail(orderId);
        if (String(order.status || '') === 'Entregado' && Modules.Marketing && typeof Modules.Marketing._pointsGrantForOrder === 'function') {
          Modules.Marketing._pointsGrantForOrder(orderId, Object.assign({}, order, {
            customerId: customerId,
            clientId: customerId,
            customerName: name,
            clientName: name,
            name: name,
            phone: phone,
            customerPhone: phone,
            whatsapp: phone,
            email: email,
            customerEmail: email,
            address: address || order.address || '',
            note: notes || order.note || '',
            internalNote: notes || order.internalNote || ''
          }), { id: customerId, name: name, phone: phone, whatsapp: phone }).then(function () {
            if (typeof Modules.Marketing._pointsRefresh === 'function') Modules.Marketing._pointsRefresh();
          }).catch(function () {});
        }
        UI.toast('Cliente vinculado ao pedido.', 'success');
      });
    }).catch(function (err) {
      UI.toast('Erro ao vincular cliente: ' + err.message, 'error');
    });
  }

  function _clearKitchenPrompt() {
    var existing = document.getElementById('kitchen-whatsapp-prompt');
    if (existing) existing.remove();
  }

  function _showKitchenWhatsappPrompt(order, status, msg) {
    if (!_kitchenModeOverlay) return false;
    _clearKitchenPrompt();
    var phone = _orderPhoneDigits(order);
    var prompt = document.createElement('div');
    prompt.id = 'kitchen-whatsapp-prompt';
    prompt.style.cssText = 'position:absolute;left:24px;bottom:24px;z-index:20020;width:min(430px,calc(100vw - 48px));background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 18px 46px rgba(31,31,31,.18);padding:16px;display:flex;flex-direction:column;gap:12px;font-family:Manrope,Inter,sans-serif;';

    var title = 'Quer avisar a cliente pelo WhatsApp?';
    var subtitle = phone ? (msg || '') : 'Este pedido não tem telefone cadastrado.';
    prompt.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
        '<div style="min-width:0;">' +
          '<div style="font-size:11px;font-weight:700;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Atualização do pedido</div>' +
          '<div style="font-size:15px;font-weight:800;line-height:1.35;color:#1F1F1F;">' + _esc(title) + '</div>' +
          '<div style="margin-top:6px;font-size:13px;line-height:1.45;color:#6F6860;">' + _esc(subtitle) + '</div>' +
        '</div>' +
        '<button onclick="Modules.Pedidos._closeKitchenWhatsappPrompt()" aria-label="Fechar" style="border:1px solid #EAE4DA;background:#fff;color:#6F6860;width:30px;height:30px;border-radius:10px;font-size:18px;font-weight:700;cursor:pointer;flex:0 0 auto;line-height:1;">×</button>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
        '<button onclick="Modules.Pedidos._closeKitchenWhatsappPrompt()" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Agora não</button>' +
        (phone ? '<button onclick="Modules.Pedidos._sendKitchenWhatsapp(\'' + _esc(order.id) + '\', \'' + _esc(status) + '\')" style="height:38px;padding:0 14px;border:none;background:#1A9E5A;color:#fff;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(26,158,90,.16);">Enviar WhatsApp</button>' : '<button disabled style="height:38px;padding:0 14px;border:none;background:#E5E7EB;color:#9CA3AF;border-radius:10px;font-size:13px;font-weight:700;cursor:not-allowed;font-family:inherit;">Enviar WhatsApp</button>') +
      '</div>';

    _kitchenModeOverlay.style.position = 'fixed';
    _kitchenModeOverlay.appendChild(prompt);
    if (!phone) {
      UI.toast('Este pedido não tem telefone cadastrado.', 'info');
    }
    return true;
  }

  function _closeKitchenWhatsappPrompt() {
    _clearKitchenPrompt();
  }

  function _sendKitchenWhatsapp(orderId, status) {
    var order = _orders.find(function (x) { return String(x.id || '') === String(orderId || ''); });
    if (!order) return;
    var phone = _orderPhoneDigits(order);
    if (!phone) {
      UI.toast('Este pedido no tiene teléfono registrado.', 'info');
      return;
    }
    var statusKey = String(status || order.status || 'Pendente');
    var fn = WA_MSGS[statusKey] || WA_MSGS[_orderStatusLabel(statusKey)];
    var msg = fn ? fn(order) : _orderStatusWhatsappMessage(order, statusKey);
    _clearKitchenPrompt();
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function _closeKitchenDetailPanel() {
    _kitchenDetailId = null;
    var existing = document.getElementById('kitchen-detail-panel');
    if (existing) existing.remove();
    var backdrop = document.getElementById('kitchen-detail-backdrop');
    if (backdrop) backdrop.remove();
  }

  function _renderKitchenDetailPanel(order) {
    if (!_kitchenModeOverlay || !order) return;
    _kitchenDetailId = order.id;
    _closeKitchenDetailPanel();

    var meta = _statusMeta(order.status);
    var itemCount = (order.items || []).length;
    var checkedCount = (order.items || []).filter(function (item) { return !!item.checked; }).length;
    var progress = itemCount ? Math.round((checkedCount / itemCount) * 100) : 0;
    var customerName = _firstText(order.customerName, order.clientName, order.name, 'Cliente');
    var payment = _detailPaymentInfo(order);
    var phoneText = _firstText(order.customerPhone, order.phone, order.whatsapp, '');
    var addressText = order.type === 'pickup' ? _orderPickupText(order) : _orderAddressText(order);
    var addressLabel = order.type === 'pickup' ? 'Endereço de retirada' : 'Endereço de entrega';
    var noteText = _firstText(order.note, order.customerNote, order.observation, order.observations, '');
    var kitchenNoteText = _firstText(order.kitchenNote, order.internalNote, order.notes, '');
    var backdrop = document.createElement('div');
    backdrop.id = 'kitchen-detail-backdrop';
    backdrop.onclick = _closeKitchenDetailPanel;
    backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(31,31,31,.34);backdrop-filter:blur(2px);z-index:20011;';

    var panel = document.createElement('aside');
    panel.id = 'kitchen-detail-panel';
    panel.style.cssText = 'position:absolute;top:12px;right:12px;bottom:12px;width:min(520px,calc(100vw - 24px));background:#fff;border:1px solid #EAE4DA;border-radius:18px;box-shadow:-18px 0 56px rgba(31,31,31,.20);z-index:20012;display:flex;flex-direction:column;font-family:Manrope,Inter,sans-serif;overflow:hidden;';

    var phoneHref = _orderPhoneHref(order);
    var statusOptions = COLUMNS.map(function (c) {
      return '<option value="' + c.key + '"' + (String(order.status || '') === c.key ? ' selected' : '') + '>' + c.label + '</option>';
    }).join('');
    var itemsHTML = (order.items || []).map(function (item, i) {
      var pricing = _detailItemPricing(item);
      var itemName = _firstText(item.name, item.productName, 'Item');
      return '<label style="display:flex;align-items:flex-start;gap:10px;padding:11px 12px;border:1px solid ' + (item.checked ? '#D9F2E3' : '#EAE4DA') + ';border-radius:12px;background:' + (item.checked ? '#F4FBF6' : '#fff') + ';cursor:pointer;box-shadow:0 6px 14px rgba(31,31,31,.035);">' +
        '<input type="checkbox" ' + (item.checked ? 'checked' : '') + ' onclick="event.stopPropagation();Modules.Pedidos._toggleItem(\'' + _esc(order.id) + '\',' + i + ',this.parentNode)" style="margin-top:2px;width:18px;height:18px;accent-color:#1A9E5A;cursor:pointer;">' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:800;line-height:1.25;">' + _esc(String(pricing.qty || item.qty || 1)) + 'x ' + _esc(itemName) + '</div>' +
          (pricing.variants ? '<div style="margin-top:3px;font-size:11px;color:#8A7E7C;line-height:1.35;">' + _esc(pricing.variants) + '</div>' : '') +
          (pricing.note ? '<div style="margin-top:3px;font-size:11px;color:#8A7E7C;line-height:1.35;">' + _esc(pricing.note) + '</div>' : '') +
          (pricing.internalNote ? '<div style="margin-top:3px;font-size:11px;color:#6F6860;line-height:1.35;">Obs. interna: ' + _esc(pricing.internalNote) + '</div>' : '') +
        '</div>' +
      '</label>';
    }).join('');
    if (!itemsHTML) {
      itemsHTML = '<div style="border:1px dashed #EAE4DA;border-radius:12px;padding:14px;text-align:center;color:#8A7E7C;font-size:12px;background:#fff;">Nenhum item registrado neste pedido.</div>';
    }

    panel.innerHTML =
      '<div style="padding:18px 20px;border-bottom:1px solid #EAE4DA;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;background:#fff;">' +
        '<div style="min-width:0;">' +
          '<div style="font-size:11px;font-weight:700;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Detalhes do pedido</div>' +
          '<div style="font-size:23px;font-weight:800;color:#1F1F1F;line-height:1.12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:390px;">' + _esc(customerName) + '</div>' +
          '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;">' +
            '<span style="display:inline-flex;align-items:center;height:26px;padding:0 9px;border-radius:999px;background:#fff;color:' + meta.color + ';border:1px solid rgba(31,31,31,.05);font-size:11px;font-weight:800;box-shadow:0 5px 12px rgba(31,31,31,.04);">' + _esc(meta.label) + '</span>' +
            '<span style="display:inline-flex;align-items:center;height:26px;padding:0 9px;border-radius:999px;background:' + (order.type === 'pickup' ? '#ECFDF5' : '#EFF6FF') + ';color:' + (order.type === 'pickup' ? '#059669' : '#2563EB') + ';border:1px solid rgba(31,31,31,.04);font-size:11px;font-weight:800;">' + _esc(order.type === 'pickup' ? 'Retirada' : 'Entrega') + '</span>' +
          '</div>' +
          '<div style="margin-top:8px;font-size:12px;color:#6F6860;">' + _esc(_orderScheduleInfo(order).text) + '</div>' +
        '</div>' +
        '<button onclick="Modules.Pedidos._closeKitchenDetailPanel()" style="border:1px solid #EAE4DA;background:#fff;color:#6F6860;width:34px;height:34px;border-radius:10px;font-size:18px;font-weight:700;cursor:pointer;line-height:1;box-shadow:0 8px 18px rgba(31,31,31,.06);">×</button>' +
      '</div>' +
      '<div style="flex:1;min-height:0;overflow:auto;padding:16px 18px 18px;display:flex;flex-direction:column;gap:14px;background:#fff;">' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);">' +
            '<div style="font-size:10px;font-weight:700;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Telefone</div>' +
            (phoneHref ? '<a href="' + _esc(phoneHref) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="font-size:13px;font-weight:800;color:#1A9E5A;text-decoration:none;">' + _esc(phoneText || 'WhatsApp') + '</a>' : '<div style="font-size:13px;font-weight:800;color:#8A7E7C;">Sem telefone</div>') +
          '</div>' +
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);">' +
            '<div style="font-size:10px;font-weight:700;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Canal</div>' +
            '<div style="font-size:13px;font-weight:800;">' + _esc(_orderChannelLabel(order)) + '</div>' +
          '</div>' +
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);">' +
            '<div style="font-size:10px;font-weight:700;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Pagamento</div>' +
            '<div style="font-size:13px;font-weight:800;">' + _esc(payment.method ? _paymentMethodLabel(payment.method) : 'Sem forma definida') + '</div>' +
            (payment.status ? '<div style="margin-top:3px;font-size:11px;color:#6F6860;">' + _esc(_paymentStatusLabel(payment.status)) + '</div>' : '') +
          '</div>' +
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);">' +
            '<div style="font-size:10px;font-weight:700;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Total</div>' +
            '<div style="font-size:16px;font-weight:800;color:#B42318;">' + UI.fmt(payment.total || order.total || 0) + '</div>' +
          '</div>' +
        '</div>' +
        (addressText ? '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);"><div style="font-size:10px;font-weight:700;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">' + _esc(addressLabel) + '</div><div style="font-size:13px;line-height:1.45;color:#1F1F1F;">' + _esc(addressText) + '</div></div>' : '') +
        ((noteText || kitchenNoteText) ? '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);"><div style="font-size:10px;font-weight:700;color:#6F6860;text-transform:uppercase;margin-bottom:4px;">Observações</div>' + (noteText ? '<div style="font-size:13px;line-height:1.45;color:#1F1F1F;">Cliente: ' + _esc(noteText) + '</div>' : '') + (kitchenNoteText ? '<div style="margin-top:' + (noteText ? '6px' : '0') + ';font-size:13px;line-height:1.45;color:#1F1F1F;">Cozinha: ' + _esc(kitchenNoteText) + '</div>' : '') + '</div>' : '') +
        '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 8px 20px rgba(31,31,31,.035);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">' +
            '<div style="font-size:11px;font-weight:800;color:#1F1F1F;">Checklist</div>' +
            '<div style="font-size:11px;font-weight:800;color:' + meta.color + ';">' + checkedCount + '/' + itemCount + '</div>' +
          '</div>' +
          '<div style="height:7px;border-radius:999px;background:#F2EDED;overflow:hidden;margin-bottom:10px;"><div style="height:100%;width:' + progress + '%;background:' + meta.color + ';border-radius:999px;"></div></div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' + itemsHTML + '</div>' +
        '</div>' +
        '<div style="margin-top:auto;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 20px rgba(31,31,31,.035);">' +
          '<label style="font-size:11px;font-weight:700;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;">Status</label>' +
          '<select id="kitchen-detail-status" style="width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;background:#fff;outline:none;color:#1F1F1F;">' + statusOptions + '</select>' +
          '<div style="display:flex;gap:10px;">' +
            '<button onclick="Modules.Pedidos._saveKitchenDetail(\'' + _esc(order.id) + '\')" style="flex:1;height:40px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Fechar</button>' +
            (phoneHref ? '<button onclick="Modules.Pedidos._waFromKitchenDetail(\'' + _esc(order.id) + '\')" style="height:40px;padding:0 14px;border:none;border-radius:10px;background:#1A9E5A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(26,158,90,.16);">WhatsApp</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>';

    _kitchenModeOverlay.appendChild(backdrop);
    _kitchenModeOverlay.appendChild(panel);
  }

  function _cardHTML(o) {
    var phoneHref = _orderPhoneHref(o);
    var meta = _statusMeta(o.status);
    var itemCount = (o.items || []).length;
    var checked = (o.items || []).filter(function (i) { return !!i.checked; }).length;
    var progress = itemCount ? Math.round((checked / itemCount) * 100) : 0;
    var schedule = _orderScheduleInfo(o).text;
    var addressText = o.type === 'pickup' ? _orderPickupText(o) : _orderAddressText(o);
    return '<div class="kcard" draggable="true" data-id="' + o.id + '" ' +
      'ondragstart="Modules.Pedidos._onDragStart(event,\'' + o.id + '\')" ' +
      'ondragend="Modules.Pedidos._onDragEnd(event)" ' +
      'onclick="Modules.Pedidos._openDetail(\'' + o.id + '\')" ' +
      'onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 18px 34px rgba(31,31,31,.11)\'" ' +
      'onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 10px 24px rgba(31,31,31,.075)\'" ' +
      'style="position:relative;background:linear-gradient(135deg,#fff 0%,' + meta.bg + ' 100%);border-radius:16px;padding:13px;border:1px solid ' + meta.bg + ';box-shadow:0 10px 24px rgba(31,31,31,.075);cursor:pointer;transition:transform .16s ease,box-shadow .16s ease;user-select:none;overflow:hidden;">' +
      '<div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:' + meta.color + ';"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px;padding-left:2px;">' +
        '<div style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:800;padding:4px 8px;border-radius:999px;background:#fff;color:' + meta.color + ';border:1px solid rgba(31,31,31,.05);box-shadow:0 5px 12px rgba(31,31,31,.04);">' + _esc(meta.label) + '</div>' +
        '<div style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:800;padding:4px 8px;border-radius:999px;background:' + (o.type === 'pickup' ? '#ECFDF5' : '#EFF6FF') + ';color:' + (o.type === 'pickup' ? '#059669' : '#2563EB') + ';">' + (o.type === 'pickup' ? 'Retirada' : 'Entrega') + '</div>' +
      '</div>' +
      '<div style="font-size:15px;font-weight:800;color:#1F1F1F;line-height:1.2;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(o.customerName || 'Cliente') + '</div>' +
      '<div style="font-size:11px;color:#6F6860;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;line-height:1.35;">' +
        '<span style="display:inline-flex;align-items:center;gap:4px;"><span class="mi" style="font-size:14px;color:' + meta.color + ';">schedule</span>' + _esc(schedule) + '</span>' +
        (phoneHref ? '<a href="' + _esc(phoneHref) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:#1A9E5A;text-decoration:none;font-weight:800;">WhatsApp</a>' : '') +
      '</div>' +
      (addressText ? '<div style="font-size:11px;color:#1F1F1F;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.78);border-radius:11px;padding:7px 8px;margin-bottom:8px;line-height:1.35;display:flex;align-items:flex-start;gap:6px;box-shadow:0 5px 12px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;color:' + meta.color + ';line-height:1.25;">place</span><span style="min-width:0;overflow-wrap:anywhere;">' + _esc(addressText) + '</span></div>' : '') +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">' +
        UI.badge(_orderChannelLabel(o), 'gray') +
        _orderPaymentBadge(o) +
      '</div>' +
      (itemCount ? '<div style="margin-bottom:9px;"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:5px;"><span style="font-size:10px;font-weight:800;color:#6F6860;text-transform:uppercase;">Checklist</span><span style="font-size:10px;font-weight:800;color:' + meta.color + ';">' + checked + '/' + itemCount + '</span></div><div style="height:6px;border-radius:999px;background:rgba(255,255,255,.78);overflow:hidden;border:1px solid rgba(31,31,31,.04);"><div style="height:100%;width:' + progress + '%;background:' + meta.color + ';border-radius:999px;"></div></div></div>' : '') +
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
      '<span style="font-size:14px;font-weight:800;color:#B42318;">' + UI.fmt(o.total || 0) + '</span>' +
      '<div style="display:flex;gap:4px;" onclick="event.stopPropagation()">' +
      (phoneHref ? '<button onclick="Modules.Pedidos._whatsapp(\'' + o.id + '\')" title="WhatsApp" style="width:28px;height:28px;border:none;border-radius:9px;cursor:pointer;background:#E8FFF1;color:#1A9E5A;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:15px;">chat</span></button>' : '') +
      '<button onclick="Modules.Pedidos._openDetail(\'' + o.id + '\')" title="Detalhes" style="width:28px;height:28px;border:1px solid #EAE4DA;border-radius:9px;cursor:pointer;background:#fff;color:#1F1F1F;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:15px;">visibility</span></button>' +
      '<button onclick="Modules.Pedidos._cancelOrder(\'' + o.id + '\')" title="Cancelar" style="width:28px;height:28px;border:none;border-radius:9px;cursor:pointer;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:15px;">close</span></button>' +
      '</div></div></div>';
  }

  var _draggingId = null;

  function _onDragStart(e, id) {
    _draggingId = id;
    e.dataTransfer.effectAllowed = 'move';
    var el = document.querySelector('.kcard[data-id="' + id + '"]');
    if (el) el.style.opacity = '.35';
  }

  function _onDragEnd(e) {
    var el = document.querySelector('.kcard[data-id="' + _draggingId + '"]');
    if (el) el.style.opacity = '1';
    document.querySelectorAll('.kb-cards').forEach(function (c) {
      var meta = _statusMeta(c.getAttribute('data-col'));
      c.style.background = 'linear-gradient(180deg,#fff 0%,' + meta.bg + ' 180%)';
    });
  }

  function _onDrop(e, newStatus) {
    e.preventDefault();
    document.querySelectorAll('.kb-cards').forEach(function (c) {
      var meta = _statusMeta(c.getAttribute('data-col'));
      c.style.background = 'linear-gradient(180deg,#fff 0%,' + meta.bg + ' 180%)';
    });
    if (!_draggingId) return;
    _updateOrderStatus(_draggingId, newStatus, { toast: 'Status atualizado: ' + newStatus, prompt: true });
    _draggingId = null;
  }

  function _openDetail(id) {
    var o = _orders.find(function (x) { return x.id === id; });
    if (!o) return;
    if (_isKitchenModeOpen()) {
      _renderKitchenDetailPanel(o);
      return;
    }
    try {
      var detailCustomer = _detailOrderCustomer(o);
      var customer = detailCustomer.customer;
      var payment = _detailPaymentInfo(o);
      var phoneHref = _orderPhoneHref(o);
      var topName = _firstText(o.customerName, o.clientName, o.name, customer && customer.name, 'Cliente');
      var topDate = _orderScheduleInfo(o).text;
      var statusOptions = COLUMNS.map(function (c) {
        return '<option value="' + c.key + '"' + (String(o.status || 'Pendente') === c.key ? ' selected' : '') + '>' + c.label + '</option>';
      }).join('');
      var itemsHTML = (o.items || []).map(function (item, i) { return _detailItemHTML(item, i, o); }).join('');
      var addressText = o.type === 'pickup' ? _orderPickupText(o) : _orderAddressText(o);
      var deliveryLabel = o.type === 'pickup' ? 'Retirada' : 'Entrega';
      var detailDateValue = o.type === 'pickup' ? _firstText(o.pickupDate, o.scheduleDate, o.deliveryDate, '') : _firstText(o.deliveryDate, o.scheduleDate, o.pickupDate, '');
      var detailTimeValue = o.type === 'pickup' ? _firstText(o.pickupTime, o.scheduleTime, o.deliveryTime, '') : _firstText(o.deliveryTime, o.scheduleTime, o.pickupTime, '');
      var customerStateLabel = detailCustomer.linked ? 'Cliente vinculado' : 'Sem vínculo';
      var customerStatusTone = detailCustomer.linked ? '#1A9E5A' : '#8A7E7C';
      var customerStatusBg = detailCustomer.linked ? '#EDFAF3' : '#F2EDED';
      var orderMetaHTML = _detailOrderMetaHTML(o);
      var customerMetaHTML = _detailCustomerMetaHTML(o, customer);
      var addressMetaHTML = _detailAddressMetaHTML(o);
      var paymentBreakdownHTML = _detailPaymentBreakdownHTML(payment);
      var pointsHtml = Modules.Marketing && typeof Modules.Marketing._pointsOrderBlockHtml === 'function'
        ? Modules.Marketing._pointsOrderBlockHtml(o, customer)
        : '';
      var detailCss = '<style>' +
        '.order-detail-modal-body{display:flex;flex-direction:column;gap:9px;font-family:Manrope,Inter,sans-serif;}' +
        '.order-detail-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:11px 12px;box-shadow:0 8px 18px rgba(31,31,31,.035);min-width:0;}' +
        '.order-detail-head{display:flex;align-items:flex-start;gap:8px;margin-bottom:9px;}' +
        '.order-detail-head .mi{font-size:17px;color:#6F6860;line-height:1.2;}' +
        '.order-detail-title{font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:3px;}' +
        '.order-detail-hint{font-size:11px;color:#8A7E7C;line-height:1.35;margin-bottom:0;}' +
        '.order-detail-grid{display:grid;gap:9px 10px;align-items:start;min-width:0;}' +
        '.order-detail-top-grid{display:grid;grid-template-columns:minmax(185px,.34fr) minmax(360px,.82fr) minmax(260px,.58fr);gap:9px;align-items:start;}' +
        '.order-detail-main-grid{grid-template-columns:minmax(0,1fr);align-items:center;}' +
        '.order-detail-service-grid{grid-template-columns:minmax(0,1fr);}' +
        '.order-detail-service-row{display:grid;grid-template-columns:minmax(180px,.62fr) minmax(260px,1fr);gap:9px 10px;align-items:start;}' +
        '.order-detail-schedule-grid{grid-template-columns:minmax(135px,.34fr) minmax(135px,.34fr);align-items:end;justify-content:start;max-width:320px;}' +
        '.order-detail-schedule-grid .order-detail-status-field{grid-column:1/-1;}' +
        '.order-detail-payment-grid{grid-template-columns:minmax(0,1fr);align-items:end;justify-content:start;}' +
        '.order-detail-summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px;justify-content:start;}' +
        '.order-detail-field-control{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:11px;padding:5px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;min-width:0;}' +
        '.order-detail-field-control:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
        '.order-detail-field-control input,.order-detail-field-control select{width:100%;min-width:0;min-height:32px;border:0;border-radius:8px;padding:0 8px;font-size:13px;font-family:inherit;outline:none;background:transparent;box-sizing:border-box;color:#1F1F1F;box-shadow:none;}' +
        '.order-detail-field-control-sm{padding:3px;border-radius:9px;}' +
        '.order-detail-field-control-sm input{min-height:26px;font-size:12px;padding:0 7px;}' +
        '.order-detail-field-control select{padding-right:42px;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 16px center;background-size:14px;}' +
        '.order-detail-label{font-size:10px;font-weight:600;color:#6F6860;display:block;margin-bottom:4px;letter-spacing:.02em;}' +
        '.order-detail-tile{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:8px 10px;box-shadow:0 1px 2px rgba(31,31,31,.02);min-width:0;}' +
        '.order-detail-soft-box{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:13px;padding:10px;min-width:0;}' +
        '.order-detail-soft-title{font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;margin-bottom:5px;}' +
        '.order-detail-soft-value{font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.35;overflow-wrap:anywhere;}' +
        '.pm-check-item:last-child{border-bottom:0!important;}' +
        '@media(max-width:1120px){.order-detail-top-grid{grid-template-columns:minmax(190px,.38fr) minmax(0,1fr)}.order-detail-payment-card{grid-column:1/-1}.order-detail-payment-grid{grid-template-columns:minmax(180px,.64fr) minmax(180px,.64fr) minmax(120px,.36fr);max-width:650px}.order-detail-summary-grid{grid-template-columns:repeat(3,minmax(105px,150px))}}' +
        '@media(max-width:980px){.order-detail-top-grid,.order-detail-service-grid,.order-detail-service-row{grid-template-columns:1fr}.order-detail-schedule-grid,.order-detail-payment-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-width:none}.order-detail-payment-grid .order-detail-paid-field,.order-detail-schedule-grid .order-detail-status-field{grid-column:1/-1}.order-detail-summary-grid{grid-template-columns:repeat(3,minmax(105px,1fr))}}' +
        '@media(max-width:640px){.order-detail-card{padding:11px}.order-detail-top-grid,.order-detail-main-grid,.order-detail-service-grid,.order-detail-service-row,.order-detail-schedule-grid,.order-detail-payment-grid,.order-detail-summary-grid,.pm-check-item [style*="grid-template-columns"]{grid-template-columns:1fr!important}.order-detail-head{margin-bottom:8px}}' +
        '</style>';

      var body = detailCss + '<div class="order-detail-modal-body">' +
        '<div class="order-detail-top-grid">' +
        '<section class="order-detail-card">' +
          '<div class="order-detail-grid order-detail-main-grid">' +
            '<div style="min-width:0;">' +
              '<div class="order-detail-head"><span class="mi">receipt_long</span><div><div class="order-detail-title">Resumo do pedido</div></div></div>' +
              '<div style="font-size:24px;font-weight:800;line-height:1;color:#B42318;">' + UI.fmt(payment.total) + '</div>' +
              '<div style="margin-top:6px;font-size:13px;color:#1A1A1A;font-weight:600;line-height:1.35;">' + _esc(topName) + '</div>' +
              '<div style="margin-top:3px;font-size:12px;color:#8A7E7C;">' + _esc(topDate) + '</div>' +
              orderMetaHTML +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="order-detail-card">' +
          '<div class="order-detail-head"><span class="mi">local_shipping</span><div><div class="order-detail-title">Cliente e entrega</div></div></div>' +
          '<div class="order-detail-soft-box">' +
            '<div class="order-detail-service-row">' +
              '<div style="min-width:0;">' +
                '<div class="order-detail-soft-title">Cliente</div>' +
                '<div class="order-detail-soft-value">' + _esc(topName) + '</div>' +
                '<div style="margin-top:5px;display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:' + customerStatusBg + ';color:' + customerStatusTone + ';font-size:10px;font-weight:700;">' + _esc(customerStateLabel) + '</div>' +
                customerMetaHTML +
                (_orderClientActions(o, customer) || '') +
              '</div>' +
              '<div style="min-width:0;">' +
                '<div class="order-detail-soft-title">' + _esc(deliveryLabel) + '</div>' +
                '<div class="order-detail-soft-value">' + _esc(addressText || (o.type === 'pickup' ? 'Retirada no local' : 'Sem endereço')) + '</div>' +
                (o.type === 'delivery' && o.zone ? '<div style="margin-top:6px;font-size:12px;color:#6F6860;">Zona: ' + _esc(o.zone) + '</div>' : '') +
                (o.type === 'delivery' && o.postalCode ? '<div style="margin-top:4px;font-size:12px;color:#6F6860;">CP: ' + _esc(o.postalCode) + '</div>' : '') +
                addressMetaHTML +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="order-detail-grid order-detail-schedule-grid" style="margin-top:9px;">' +
            '<div><label class="order-detail-label">Dia</label><div class="order-detail-field-control"><input id="detail-delivery-date" type="date" value="' + _esc(detailDateValue) + '"></div></div>' +
            '<div><label class="order-detail-label">Horário</label><div class="order-detail-field-control"><input id="detail-delivery-time" type="time" value="' + _esc(detailTimeValue) + '"></div></div>' +
            '<div class="order-detail-status-field"><label class="order-detail-label">Status do pedido</label><div class="order-detail-field-control"><select id="detail-status">' + statusOptions + '</select></div><div id="detail-whatsapp-prompt" style="display:none;"></div></div>' +
          '</div>' +
        '</section>' +

        '<section class="order-detail-card order-detail-payment-card">' +
            '<div class="order-detail-head"><span class="mi">payments</span><div><div class="order-detail-title">Pagamento</div></div></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">' +
              (payment.method ? UI.badge(_paymentMethodLabel(payment.method), 'gray') : UI.badge('Sem forma definida', 'gray')) +
              (payment.status ? UI.badge(_paymentStatusLabel(payment.status), 'blue') : UI.badge('Sem status', 'gray')) +
            '</div>' +
            paymentBreakdownHTML +
            '<div class="order-detail-payment-grid">' +
              '<div><label class="order-detail-label">Forma de pagamento</label><div class="order-detail-field-control"><select id="detail-payment-method">' + _paymentMethodOptions(payment.method) + '</select></div></div>' +
              '<div><label class="order-detail-label">Status do pagamento</label><div class="order-detail-field-control"><select id="detail-payment-status" onchange="Modules.Pedidos._detailPaymentSync()">' + _paymentStatusOptions(payment.status || (payment.paid >= payment.total && payment.total > 0 ? 'pago' : payment.paid > 0 ? 'parcial' : 'previsto')) + '</select></div></div>' +
              '<div id="detail-paid-amount-box" class="order-detail-paid-field" style="display:' + (((payment.status || '').toLowerCase() === 'parcial') ? 'block' : 'none') + ';">' +
                '<label class="order-detail-label">Valor pago</label><div class="order-detail-field-control"><input id="detail-paid-amount" type="number" step="0.01" value="' + _esc(String(payment.paid || 0)) + '" placeholder="0,00"></div>' +
              '</div>' +
            '</div>' +
            _detailChannelFeeInputsHTML(o, payment) +
            '<div class="order-detail-summary-grid">' +
              '<div class="order-detail-tile"><div style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Valor total</div><div style="font-size:14px;font-weight:700;color:#1A1A1A;">' + UI.fmt(payment.total) + '</div></div>' +
              '<div class="order-detail-tile"><div style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Valor pago</div><div style="font-size:14px;font-weight:700;color:#1A1A1A;">' + UI.fmt(payment.paid) + '</div></div>' +
              '<div class="order-detail-tile"><div style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Pendente</div><div style="font-size:14px;font-weight:700;color:#C4362A;">' + UI.fmt(payment.pending) + '</div></div>' +
            '</div>' +
        '</section>' +
        '</div>' +

        (pointsHtml ? '<section style="display:grid;grid-template-columns:1fr;gap:12px;">' + pointsHtml + '</section>' : '') +
        '<section class="order-detail-grid" style="grid-template-columns:1fr;">' +
          _detailStockTraceHTML(o) +
        '</section>' +

        '<section class="order-detail-grid" style="grid-template-columns:1fr;">' +
          '<div class="order-detail-card">' +
            '<div class="order-detail-head"><span class="mi">notes</span><div><div class="order-detail-title">Observações</div></div></div>' +
            _detailObservationBlocks(o) +
          '</div>' +
          '<div class="order-detail-card">' +
            '<div class="order-detail-head"><span class="mi">restaurant_menu</span><div><div class="order-detail-title">Itens do pedido</div></div></div>' +
            (itemsHTML || '<div style="font-size:13px;color:#8A7E7C;">Sem itens neste pedido.</div>') +
          '</div>' +
        '</section>' +
      '</div>';

      var stockResolutionButton = _canResolveOrderStock(o)
        ? '<button onclick="Modules.Pedidos._openOrderStockResolution(\'' + _esc(id) + '\')" style="height:40px;padding:0 14px;border:1px solid #EADFD8;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Retorno/perda</button>'
        : '';
      var footer = '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<button onclick="Modules.Pedidos._closeDetailModal()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Fechar</button>' +
        stockResolutionButton +
        '<button onclick="Modules.Pedidos._sendDetailWhatsapp(\'' + _esc(id) + '\')" style="height:40px;padding:0 14px;border:none;border-radius:10px;background:#1A9E5A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(26,158,90,.16);">Enviar WhatsApp</button>' +
        '<button onclick="Modules.Pedidos._saveDetail(\'' + _esc(id) + '\')" style="height:40px;padding:0 16px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Salvar</button>' +
      '</div>';

      var overlay = document.createElement('div');
      overlay.id = 'pedidos-detail-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(31,31,31,.42);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Manrope,Inter,sans-serif;';
      overlay.innerHTML = '<div style="background:#fff;width:100%;max-width:1120px;max-height:90vh;border-radius:18px;box-shadow:0 24px 70px rgba(31,31,31,.26);display:flex;flex-direction:column;overflow:hidden;">' +
        '<div style="padding:18px 22px;border-bottom:1px solid #EAE4DA;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex:0 0 auto;background:#fff;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:11px;font-weight:700;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Pedido</div>' +
            '<h2 style="font-size:22px;font-weight:800;color:#1F1F1F;line-height:1.15;margin:0;">Detalhes do pedido</h2>' +
          '</div>' +
          '<button onclick="Modules.Pedidos._closeDetailModal()" style="width:34px;height:34px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;font-size:16px;flex-shrink:0;">✕</button>' +
        '</div>' +
        '<div id="pedidos-detail-body" style="padding:16px 20px 20px;overflow:auto;flex:1;min-height:0;background:#FAFAF8;">' + body + '</div>' +
        '<div style="padding:14px 22px;border-top:1px solid #EAE4DA;background:#fff;flex:0 0 auto;display:flex;justify-content:flex-end;align-items:center;gap:16px;flex-wrap:wrap;">' +
          footer +
        '</div>' +
      '</div>';
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      window._currentDetailModal = { close: _closeDetailModal, el: overlay };
      window._currentDetailOrderId = id;
    } catch (err) {
      console.error('Pedidos detail modal error', err);
      var fallbackCustomer = o.customerName || o.clientName || o.name || 'Cliente';
      UI.modal({
        title: 'Pedido — ' + fallbackCustomer,
        body: '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div style="background:#fff;border:1px solid #F2EDED;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);">' +
            '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;margin-bottom:6px;">Resumo do pedido</div>' +
            '<div style="font-family:\'League Spartan\',sans-serif;font-size:28px;font-weight:900;line-height:1;color:#C4362A;">' + UI.fmt(_num(o.total || o.amount || o.grandTotal)) + '</div>' +
            '<div style="margin-top:8px;font-size:13px;font-weight:700;">' + _esc(fallbackCustomer) + '</div>' +
            '<div style="margin-top:4px;font-size:12px;color:#8A7E7C;">' + _esc(_orderScheduleInfo(o).text) + '</div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">' +
              UI.badge(_orderStatusLabel(o.status), 'blue') +
              UI.badge(_orderChannelLabel(o), 'gray') +
              UI.badge(o.type === 'pickup' ? 'Retirada' : 'Entrega', o.type === 'pickup' ? 'green' : 'orange') +
            '</div>' +
          '</div>' +
          '<div style="font-size:13px;color:#8A7E7C;line-height:1.5;">Não foi possível carregar o detalhe completo deste pedido agora. Os dados principais seguem disponíveis.</div>' +
        '</div>',
        footer: '<div style="display:flex;gap:10px;"><button onclick="Modules.Pedidos._saveDetail(\'' + id + '\')" style="flex:1;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">💾 Salvar</button></div>',
        maxWidth: '760px'
      });
    }
  }

  function _toggleItem(orderId, idx, el) {
    var o = _orders.find(function (x) { return x.id === orderId; });
    if (!o || !o.items) return;
    var items = o.items.slice();
    items[idx] = Object.assign({}, items[idx], { checked: !items[idx].checked });
    o.items = items;
    _detailChecklistDirty[String(orderId || '')] = true;
    DB.update('orders', orderId, { items: items }).catch(function (err) {
      UI.toast('Não foi possível salvar o checklist: ' + (err && err.message ? err.message : 'erro'), 'error');
    });
    el.style.background = items[idx].checked ? '#EDFAF3' : '#F2EDED';
    var cb = el.querySelector('input[type=checkbox]');
    if (cb) cb.checked = items[idx].checked;
  }

  function _detailEditedItems(order) {
    var source = Array.isArray(order && order.items) ? order.items : [];
    return source.map(function (item, idx) {
      var qtyEl = document.getElementById('detail-item-qty-' + idx);
      var priceEl = document.getElementById('detail-item-price-' + idx);
      var pricing = _detailItemPricing(item);
      var name = String(item.name || item.productName || 'Item').trim() || 'Item';
      var qty = Math.max(_num(qtyEl ? qtyEl.value : pricing.qty), 0.01);
      var unit = Math.max(_num(priceEl ? priceEl.value : pricing.finalUnit), 0);
      var total = qty * unit;
      return Object.assign({}, item, {
        name: name,
        productName: name,
        qty: qty,
        quantity: qty,
        price: unit,
        unitPrice: unit,
        finalPrice: unit,
        total: total,
        subtotal: total,
        lineTotal: total
      });
    });
  }

  function _formatDetailMoneyField(el) {
    if (!el) return;
    el.value = UI.fmt(_num(el.value));
  }

  function _orderItemTotalsPayload(order, items) {
    order = order || {};
    items = Array.isArray(items) ? items : [];
    var subtotal = items.reduce(function (sum, item) {
      return sum + _num(item.total != null ? item.total : item.subtotal != null ? item.subtotal : (_num(item.price || item.finalPrice || item.unitPrice) * _num(item.qty || item.quantity || 1)));
    }, 0);
    var originalSubtotal = items.reduce(function (sum, item) {
      var qty = _num(item.qty || item.quantity || 1) || 1;
      var originalUnit = _num(item.originalUnitPrice != null ? item.originalUnitPrice : item.originalPrice != null ? item.originalPrice : item.priceOriginal != null ? item.priceOriginal : item.price != null ? item.price : item.finalPrice != null ? item.finalPrice : item.unitPrice || 0);
      var originalTotal = _num(item.originalTotal != null ? item.originalTotal : item.originalSubtotal != null ? item.originalSubtotal : 0);
      return sum + (originalTotal || originalUnit * qty);
    }, 0);
    if (!originalSubtotal) originalSubtotal = subtotal;
    var promoDiscount = Math.max(originalSubtotal - subtotal, 0);
    var deliveryFee = _num(order.deliveryFee != null ? order.deliveryFee : order.shippingFee != null ? order.shippingFee : order.fee || 0);
    var couponDiscount = _num(order.couponDiscountTotal != null ? order.couponDiscountTotal : order.couponDiscount || 0);
    var pointsDiscount = _num(order.pointsDiscountTotal != null ? order.pointsDiscountTotal : order.pointsDiscount || 0);
    var adjustment = _num(order.adjustment || order.manualAdjustment || 0);
    var total = Math.max(subtotal + deliveryFee + adjustment - couponDiscount - pointsDiscount, 0);
    return {
      items: items,
      itemCount: items.length,
      itemsCount: items.length,
      subtotal: subtotal,
      itemsSubtotal: subtotal,
      finalSubtotal: subtotal,
      originalSubtotal: originalSubtotal,
      subtotalOriginal: originalSubtotal,
      promoDiscountTotal: promoDiscount,
      promoDiscount: promoDiscount,
      discountTotal: promoDiscount + couponDiscount + pointsDiscount,
      total: total,
      amount: total,
      grandTotal: total
    };
  }

  function _removeDetailItem(orderId, idx) {
    var order = _orders.find(function (x) { return String(x.id || '') === String(orderId || ''); });
    if (!order || !Array.isArray(order.items)) return;
    var items = _detailEditedItems(order);
    if (idx < 0 || idx >= items.length) return;
    if (items.length <= 1) {
      UI.toast('O pedido precisa ter pelo menos um item.', 'error');
      return;
    }
    items.splice(idx, 1);
    var payload = _orderItemTotalsPayload(order, items);
    DB.update('orders', orderId, payload).then(function () {
      Object.assign(order, payload);
      _syncOrderFinanceMovement(orderId, order);
      _refreshDetailView(orderId);
      UI.toast('Item removido do pedido.', 'success');
    }).catch(function (err) {
      UI.toast('Erro ao remover item: ' + (err && err.message ? err.message : 'falha ao salvar'), 'error');
    });
  }

  function _saveDetail(id) {
    var sel = document.getElementById('detail-status');
    var channelSel = document.getElementById('detail-sales-channel');
    var paymentSel = document.getElementById('detail-payment-method');
    var paymentStatusSel = document.getElementById('detail-payment-status');
    var paidAmountInput = document.getElementById('detail-paid-amount');
    var channelCommissionInput = document.getElementById('detail-channel-commission-pct');
    var channelTaxInput = document.getElementById('detail-channel-tax-pct');
    var channelFixedInput = document.getElementById('detail-channel-fixed-fee');
    var scheduleDateSel = document.getElementById('detail-delivery-date');
    var scheduleTimeSel = document.getElementById('detail-delivery-time');
    if (!sel) return;
    _hideDetailWhatsappPrompt();
    var order = _orders.find(function (x) { return String(x.id || '') === String(id || ''); });
    var nextStatus = String(sel.value || 'Pendente');
    var nextChannel = String((channelSel && channelSel.value) || _firstText(order && order.channel, order && order.source, 'manual')).trim() || 'manual';
    var nextChannelSource = _manualOrderChannelSource(nextChannel);
    var nextChannelMeta = _salesChannelByName(nextChannel) || {};
    var nextChannelCategory = _channelIncomeCategoryMeta(nextChannelMeta);
    var nextPaymentMethod = String((paymentSel && paymentSel.value) || (order && order.paymentMethod) || '').trim();
    var nextPaymentStatus = String((paymentStatusSel && paymentStatusSel.value) || (order && order.paymentStatus) || 'previsto').trim() || 'previsto';
    var nextPaidAmount = _num((paidAmountInput && paidAmountInput.value) || (order && order.paidAmount) || 0);
    var isPickup = order && order.type === 'pickup';
    var nextScheduleDate = String((scheduleDateSel && scheduleDateSel.value) || (isPickup ? (order && order.pickupDate) : (order && order.deliveryDate)) || (order && order.scheduleDate) || '').trim();
    var nextScheduleTime = String((scheduleTimeSel && scheduleTimeSel.value) || (isPickup ? (order && order.pickupTime) : (order && order.deliveryTime)) || (order && order.scheduleTime) || '').trim();
    if (_paymentStatusIsPaid(nextPaymentStatus)) nextPaidAmount = _detailPaymentInfo(order || {}).total;
    if (!_paymentStatusIsPartial(nextPaymentStatus)) nextPaidAmount = _paymentStatusIsPaid(nextPaymentStatus) ? nextPaidAmount : 0;
    var currentStatus = String(order && order.status || 'Pendente');
    var currentChannel = _firstText(order && order.channel, order && order.source, order && order.originChannel, order && order.originSource, 'manual');
    var currentPaymentMethod = String(order && order.paymentMethod || '').trim();
    var currentPaymentStatus = String(order && order.paymentStatus || '').trim();
    var currentPaidAmount = _num(order && order.paidAmount);
    var currentScheduleDate = String((isPickup ? (order && order.pickupDate) : (order && order.deliveryDate)) || (order && order.scheduleDate) || '').trim();
    var currentScheduleTime = String((isPickup ? (order && order.pickupTime) : (order && order.deliveryTime)) || (order && order.scheduleTime) || '').trim();
    var statusChanged = nextStatus !== currentStatus;
    var channelChanged = _channelAliasKey(nextChannel) !== _channelAliasKey(currentChannel);
    var paymentChanged = nextPaymentMethod !== currentPaymentMethod;
    var scheduleChanged = nextScheduleDate !== currentScheduleDate || nextScheduleTime !== currentScheduleTime;
    var channelFeePatch = null;
    var channelFeeChanged = false;
    if (channelCommissionInput || channelTaxInput || channelFixedInput) {
      var currentChannelCosts = _orderChannelFinancialPatch(order || {}, _detailPaymentInfo(order || {}).total);
      var nextCommissionPct = _num(channelCommissionInput ? channelCommissionInput.value : currentChannelCosts.channelCommissionPct);
      var nextTaxPct = _num(channelTaxInput ? channelTaxInput.value : currentChannelCosts.channelCommissionTaxPct);
      var nextFixedFee = _num(channelFixedInput ? channelFixedInput.value : currentChannelCosts.channelFixedFee);
      channelFeeChanged = Math.abs(nextCommissionPct - _num(currentChannelCosts.channelCommissionPct)) > 0.001 ||
        Math.abs(nextTaxPct - _num(currentChannelCosts.channelCommissionTaxPct)) > 0.001 ||
        Math.abs(nextFixedFee - _num(currentChannelCosts.channelFixedFee)) > 0.001;
      if (channelFeeChanged) {
        channelFeePatch = {
          channelFeesManual: true,
          channelFeeManual: true,
          channelFeesEdited: true,
          channelCommissionPct: nextCommissionPct,
          channelCommissionTaxPct: nextTaxPct,
          channelFixedFee: nextFixedFee,
          channelFeesEditedAt: _nowIso()
        };
      }
    }
    var channelPatch = null;
    if (channelChanged) {
      channelPatch = {
        channel: nextChannel,
        source: nextChannelSource,
        originChannel: nextChannel,
        originSource: nextChannelSource,
        channelName: _salesChannelDisplayName(nextChannel),
        salesChannel: _salesChannelDisplayName(nextChannel),
        canalVenda: _salesChannelDisplayName(nextChannel),
        channelFeesManual: false,
        channelFeeManual: false,
        channelFeesEdited: false,
        channelCommissionPct: _num(nextChannelMeta.commissionPct),
        channelCommissionTaxPct: _num(nextChannelMeta.taxPct),
        channelFixedFee: _num(nextChannelMeta.fixedFee),
        channelChangedAt: _nowIso()
      };
      if (nextChannelCategory.id || nextChannelCategory.name) {
        channelPatch.entradaCategoriaId = nextChannelCategory.id;
        channelPatch.entradaCategoriaNome = nextChannelCategory.name;
        channelPatch.incomeCategoryId = nextChannelCategory.id;
        channelPatch.incomeCategoryName = nextChannelCategory.name;
        channelPatch.categoriaEntradaId = nextChannelCategory.id;
        channelPatch.categoriaEntradaNome = nextChannelCategory.name;
        channelPatch.financialCategoryId = nextChannelCategory.id;
        channelPatch.financialCategoryName = nextChannelCategory.name;
        channelPatch.categoriaFinanceiraId = nextChannelCategory.id;
        channelPatch.categoriaFinanceiraNome = nextChannelCategory.name;
      }
    }
    var editedItems = _detailEditedItems(order || {});
    var itemTotalsPayload = _orderItemTotalsPayload(order || {}, editedItems);
    var currentItemsJson = JSON.stringify(Array.isArray(order && order.items) ? order.items.map(function (item) {
      var p = _detailItemPricing(item);
      return {
        name: item.name || item.productName || '',
        qty: _num(p.qty),
        unit: _num(p.finalUnit)
      };
    }) : []);
    var editedItemsJson = JSON.stringify(editedItems.map(function (item) {
      return {
        name: item.name || item.productName || '',
        qty: _num(item.qty || item.quantity),
        unit: _num(item.finalPrice || item.price || item.unitPrice)
      };
    }));
    var checklistChanged = !!_detailChecklistDirty[String(id || '')];
    var itemsChanged = currentItemsJson !== editedItemsJson || checklistChanged;
    if (itemsChanged && _paymentStatusIsPaid(nextPaymentStatus)) nextPaidAmount = itemTotalsPayload.total;
    var paymentMetaChanged = nextPaymentStatus !== currentPaymentStatus || Math.abs(nextPaidAmount - currentPaidAmount) > 0.001;
    var tasks = [];

    if (statusChanged) {
      tasks.push(_updateOrderStatus(id, nextStatus, { toast: 'Pedido atualizado!', prompt: false }));
    }
    if (paymentChanged) {
      tasks.push(DB.update('orders', id, { paymentMethod: nextPaymentMethod }).then(function () {
        if (order) order.paymentMethod = nextPaymentMethod;
      }));
    }
    if (channelPatch) {
      tasks.push(DB.update('orders', id, channelPatch).then(function () {
        if (order) Object.assign(order, channelPatch);
      }));
    }
    if (paymentMetaChanged) {
      tasks.push(DB.update('orders', id, {
        paymentStatus: nextPaymentStatus,
        paymentState: nextPaymentStatus,
        paidAmount: nextPaidAmount,
        amountPaid: nextPaidAmount,
        valuePaid: nextPaidAmount,
        paid: _paymentStatusIsPaid(nextPaymentStatus) ? true : (_paymentStatusIsPartial(nextPaymentStatus) ? nextPaidAmount : false),
        payment: nextPaymentStatus
      }).then(function () {
        if (order) {
          order.paymentStatus = nextPaymentStatus;
          order.paymentState = nextPaymentStatus;
          order.paidAmount = nextPaidAmount;
          order.amountPaid = nextPaidAmount;
          order.valuePaid = nextPaidAmount;
          order.paid = _paymentStatusIsPaid(nextPaymentStatus) ? true : (_paymentStatusIsPartial(nextPaymentStatus) ? nextPaidAmount : false);
          order.payment = nextPaymentStatus;
        }
      }));
    }
    if (channelFeePatch) {
      tasks.push(DB.update('orders', id, channelFeePatch).then(function () {
        if (order) Object.assign(order, channelFeePatch);
      }));
    }
    if (scheduleChanged) {
      var schedulePayload = {
        scheduleDate: nextScheduleDate,
        scheduleTime: nextScheduleTime,
        slot: [nextScheduleDate, nextScheduleTime].filter(Boolean).join(' ').trim()
      };
      if (isPickup) {
        schedulePayload.pickupDate = nextScheduleDate;
        schedulePayload.pickupTime = nextScheduleTime;
      } else {
        schedulePayload.deliveryDate = nextScheduleDate;
        schedulePayload.deliveryTime = nextScheduleTime;
      }
      tasks.push(DB.update('orders', id, schedulePayload).then(function () {
        if (order) {
          order.scheduleDate = nextScheduleDate;
          order.scheduleTime = nextScheduleTime;
          if (isPickup) {
            order.pickupDate = nextScheduleDate;
            order.pickupTime = nextScheduleTime;
          } else {
            order.deliveryDate = nextScheduleDate;
            order.deliveryTime = nextScheduleTime;
          }
          order.slot = [nextScheduleDate, nextScheduleTime].filter(Boolean).join(' ').trim();
        }
      }));
    }
    if (itemsChanged) {
      tasks.push(DB.update('orders', id, itemTotalsPayload).then(function () {
        if (order) Object.assign(order, itemTotalsPayload);
        delete _detailChecklistDirty[String(id || '')];
      }));
    }
    if (!tasks.length) {
      UI.toast('Nenhuma alteração para salvar.', 'info');
      return;
    }

    Promise.all(tasks).then(function () {
      var fresh = _orders.find(function (x) { return String(x.id || '') === String(id || ''); }) || order;
      if (fresh) {
        fresh.paymentMethod = nextPaymentMethod;
        if (channelPatch) Object.assign(fresh, channelPatch);
        fresh.paymentStatus = nextPaymentStatus;
        fresh.paymentState = nextPaymentStatus;
        fresh.paidAmount = nextPaidAmount;
        fresh.amountPaid = nextPaidAmount;
        fresh.valuePaid = nextPaidAmount;
        fresh.paid = _paymentStatusIsPaid(nextPaymentStatus) ? true : (_paymentStatusIsPartial(nextPaymentStatus) ? nextPaidAmount : false);
        fresh.payment = nextPaymentStatus;
        fresh.scheduleDate = nextScheduleDate;
        fresh.scheduleTime = nextScheduleTime;
        if (isPickup) {
          fresh.pickupDate = nextScheduleDate;
          fresh.pickupTime = nextScheduleTime;
        } else {
          fresh.deliveryDate = nextScheduleDate;
          fresh.deliveryTime = nextScheduleTime;
        }
        fresh.slot = [nextScheduleDate, nextScheduleTime].filter(Boolean).join(' ').trim();
        if (itemsChanged) Object.assign(fresh, itemTotalsPayload);
      }
      _syncOrderFinanceMovement(id, fresh || order || {});
      _refreshDetailView(id);
      if (statusChanged && fresh) _showDetailWhatsappPrompt(fresh, nextStatus);
    }).catch(function (err) {
      UI.toast('Não foi possível atualizar o pedido: ' + (err && err.message ? err.message : 'erro'), 'error');
    });
  }

  function _detailPaymentSync() {
    var statusSel = document.getElementById('detail-payment-status');
    var paidBox = document.getElementById('detail-paid-amount-box');
    var paidInput = document.getElementById('detail-paid-amount');
    if (!statusSel) return;
    var status = String(statusSel.value || 'previsto');
    if (paidBox) paidBox.style.display = _paymentStatusIsPartial(status) ? 'block' : 'none';
    if (paidInput) {
      if (_paymentStatusIsPaid(status)) {
        var order = _orders.find(function (x) { return String(x.id || '') === String(_currentDetailOrderId || ''); });
        var payment = _detailPaymentInfo(order || {});
        paidInput.value = String(payment.total || 0);
      }
      if (!_paymentStatusIsPartial(status) && !_paymentStatusIsPaid(status)) paidInput.value = '0';
    }
  }

  function _applyPointsDiscount(id) {
    var order = _orders.find(function (x) { return String(x.id || '') === String(id || ''); });
    if (!order) return;
    var customer = _matchedCustomer(order);
    if (!Modules.Marketing || typeof Modules.Marketing._pointsApplyDiscount !== 'function') {
      UI.toast('Programa de pontos indisponível no momento.', 'error');
      return;
    }
    Modules.Marketing._pointsApplyDiscount(id, order, customer).then(function () {
      UI.toast('Desconto com pontos aplicado.', 'success');
      _refreshDetailView(id);
    }).catch(function (err) {
      UI.toast(err && err.message ? err.message : 'Não foi possível aplicar os pontos.', 'error');
    });
  }

  function _saveKitchenDetail(id) {
    var sel = document.getElementById('kitchen-detail-status');
    if (!sel) return;
    _updateOrderStatus(id, sel.value, { toast: 'Status atualizado!', prompt: true, noChangeToast: false }).then(function () {
      _closeKitchenDetailPanel();
    });
  }

  function _waFromKitchenDetail(id) {
    var o = _orders.find(function (x) { return x.id === id; });
    if (!o) return;
    var status = (document.getElementById('kitchen-detail-status') || {}).value || o.status;
    var fn = WA_MSGS[status] || WA_MSGS[_orderStatusLabel(status)];
    var msg = fn ? fn(o) : _orderStatusWhatsappMessage(o, status);
    var phone = _orderPhoneDigits(o);
    if (!phone) {
      UI.toast('Este pedido no tiene teléfono registrado para avisar por WhatsApp.', 'info');
      return;
    }
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function _orderBusinessName() {
    return _firstText(_templateConfig.publicName, _templateConfig.businessName, _templateConfig.storeName, _templateConfig.name, _templateConfig.title, _generalConfig.businessName, _generalConfig.storeName, _generalConfig.name, _generalConfig.title, '');
  }

  function _orderDisplayId(order) {
    if (!order) return '';
    var raw = _firstText(order.orderNumber, order.number, order.code, order.reference, '');
    if (raw) return raw;
    var id = String(order.id || '').trim();
    return id ? ('#' + id.slice(-6).toUpperCase()) : '';
  }

  function _orderPhoneDigits(order) {
    return _phone(_firstText(order && order.phone, order && order.customerPhone, order && order.whatsapp, ''));
  }

  function _orderPhoneHref(order) {
    var phone = _orderPhoneDigits(order);
    return phone ? 'https://wa.me/' + phone : '';
  }

  function _orderScheduleInfo(order) {
    order = order || {};
    var dateRaw = order.type === 'pickup'
      ? _firstText(order.pickupDate, order.scheduleDate, order.deliveryDate, order.deliveryDateISO, '')
      : _firstText(order.deliveryDate, order.deliveryDateISO, order.scheduleDate, order.pickupDate, '');
    var timeRaw = order.type === 'pickup'
      ? _firstText(order.pickupTime, order.scheduleTime, order.deliveryTime, '')
      : _firstText(order.deliveryTime, order.scheduleTime, order.pickupTime, '');
    var slotRaw = _firstText(order.slot, order.schedule, '');
    var dateLabel = '';
    var timeLabel = '';
    if (dateRaw) {
      var d = new Date(dateRaw);
      dateLabel = isNaN(d.getTime()) ? String(dateRaw) : UI.fmtDate(d);
    }
    if (timeRaw) {
      timeLabel = String(timeRaw).trim();
    } else if (slotRaw && /^\d{1,2}:\d{2}$/.test(String(slotRaw).trim())) {
      timeLabel = String(slotRaw).trim();
    }
    var text = '';
    if (dateLabel && timeLabel) text = dateLabel + ' · ' + timeLabel;
    else if (dateLabel) text = dateLabel;
    else if (timeLabel) text = timeLabel;
    else if (slotRaw) text = String(slotRaw).trim();
    else text = _fmtDate(order);
    return { date: dateLabel, time: timeLabel, text: text };
  }

  function _orderPaymentBadge(order) {
    if (!order) return '';
    var raw = _firstText(order.paymentStatus, order.payStatus, order.statusPayment, order.payment, '');
    var paid = String(order.paid || order.isPaid || '').toLowerCase();
    var key = _fold(raw);
    if (!key && paid !== 'false' && paid !== '0' && paid) key = 'pago';
    if (!key) return '';
    if (key.indexOf('pago') >= 0 || key.indexOf('paid') >= 0 || key.indexOf('quit') >= 0) return UI.badge('Pago', 'green');
    if (key.indexOf('parc') >= 0 || key.indexOf('part') >= 0) return UI.badge('Parcial', 'orange');
    return UI.badge(_title(raw), 'gray');
  }

  function _orderWhatsappLanguage() {
    var raw = _firstText(_templateConfig.language, _templateConfig.defaultLanguage, _templateConfig.mainLanguage, _templateConfig.storeLanguage, _generalConfig.language, _generalConfig.defaultLanguage, 'es');
    raw = String(raw || '').toLowerCase();
    if (raw.indexOf('pt') === 0) return 'pt';
    if (raw.indexOf('en') === 0) return 'en';
    return 'es';
  }

  function _waStatusKey(status) {
    var key = _fold(status || '');
    if (key.indexOf('confirm') >= 0) return 'confirmed';
    if (key.indexOf('prepar') >= 0) return 'preparing';
    if (key.indexOf('camino') >= 0 || key.indexOf('caminho') >= 0 || key.indexOf('entrega') >= 0 && key.indexOf('entregad') < 0) return 'onway';
    if (key.indexOf('recoger') >= 0 || key.indexOf('retirada') >= 0 || key.indexOf('retirar') >= 0 || key.indexOf('listo') >= 0 || key.indexOf('pronto') >= 0) return 'ready';
    if (key.indexOf('entregad') >= 0 || key.indexOf('entregue') >= 0 || key.indexOf('delivered') >= 0) return 'delivered';
    if (key.indexOf('cancel') >= 0) return 'cancelled';
    return 'pending';
  }

  function _waText(key) {
    var lang = _orderWhatsappLanguage();
    var texts = {
      es: {
        greeting: 'Hola',
        pending: 'Recibimos tu pedido y ya lo estamos revisando. Te avisaremos en cuanto esté confirmado.',
        confirmed: 'Tu pedido está confirmado. En breve empezamos a prepararlo.',
        preparing: 'Tu pedido ya está en preparación.',
        onway: 'Tu pedido ya salió para entrega.',
        ready: 'Tu pedido está listo para retirar.',
        delivered: 'Tu pedido fue entregado. Gracias por comprar con nosotros.',
        reviewCta: 'Tu reseña ayuda a otras personas a animarse a probar también. Y si crees que podemos mejorar algo, cuéntanos: queremos escucharte.',
        cancelled: 'Tu pedido fue cancelado. Si necesitas ayuda, responde a este mensaje.',
        order: 'Pedido',
        store: 'Equipo'
      },
      pt: {
        greeting: 'Olá',
        pending: 'Recebemos seu pedido e já estamos conferindo tudo. Avisaremos assim que ele for confirmado.',
        confirmed: 'Seu pedido está confirmado. Em breve começaremos o preparo.',
        preparing: 'Seu pedido já está em preparo.',
        onway: 'Seu pedido já saiu para entrega.',
        ready: 'Seu pedido está pronto para retirada.',
        delivered: 'Seu pedido foi entregue. Obrigado por comprar com a gente.',
        reviewCta: 'Sua avaliação ajuda outras pessoas a se animarem a provar também. E se você acha que podemos melhorar algo, conte pra gente: queremos te ouvir.',
        cancelled: 'Seu pedido foi cancelado. Se precisar de ajuda, responda esta mensagem.',
        order: 'Pedido',
        store: 'Equipe'
      },
      en: {
        greeting: 'Hi',
        pending: 'We received your order and are checking it now. We will let you know as soon as it is confirmed.',
        confirmed: 'Your order is confirmed. We will start preparing it soon.',
        preparing: 'Your order is now being prepared.',
        onway: 'Your order is on its way.',
        ready: 'Your order is ready for pickup.',
        delivered: 'Your order was delivered. Thank you for ordering with us.',
        reviewCta: 'Your review helps other people feel confident to try it too. And if you think we can improve anything, tell us: we want to hear from you.',
        cancelled: 'Your order was cancelled. If you need help, reply to this message.',
        order: 'Order',
        store: 'Team'
      }
    };
    return (texts[lang] || texts.es)[key] || (texts[lang] || texts.es).pending;
  }

  function _orderStatusWhatsappMessage(order, status) {
    var key = _waStatusKey(status || (order && order.status));
    var customer = _firstText(order && order.customerName, order && order.clientName, order && order.name, '');
    var firstName = customer ? String(customer).trim().split(/\s+/)[0] : '';
    var orderLabel = _orderDisplayId(order);
    var business = _orderBusinessName();
    var pieces = [];
    pieces.push(_waText('greeting') + (firstName ? ', ' + firstName : '') + '.');
    pieces.push(_waText(key));
    if (orderLabel) pieces.push(_waText('order') + ' ' + orderLabel + '.');
    if (key === 'delivered') {
      var reviewUrl = _orderReviewUrl();
      if (reviewUrl) pieces.push(_waText('reviewCta') + ' ' + reviewUrl);
    }
    if (business) pieces.push(business + '.');
    return pieces.join(' ');
  }

  function _orderReviewUrl() {
    var publicUrl = _firstText(_domainConfig.publicUrl, _domainConfig.siteUrl, _templateConfig.publicUrl, _templateConfig.siteUrl, '');
    var slug = _firstText(_domainConfig.storeSlug, _domainConfig.slug, _domainConfig.subdomain, _templateConfig.storeSlug, _templateConfig.slug, _templateConfig.subdomain, '');
    if (!slug && publicUrl) {
      var match = String(publicUrl).match(/bocafood\.app\/([^/?#]+)/i);
      if (match) slug = match[1];
    }
    slug = String(slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (slug) return 'https://bocafood.app/' + encodeURIComponent(slug) + '/review';
    if (publicUrl) return String(publicUrl).replace(/\/+$/, '') + '/review';
    return '';
  }

  function _orderWhatsappMessage(order, statusLabel, baseText) {
    return _orderStatusWhatsappMessage(order, statusLabel || baseText || (order && order.status));
  }

  function _promptOrderWhatsapp(orderOrId, status) {
    var order = typeof orderOrId === 'object' ? orderOrId : _orders.find(function (x) { return String(x.id || '') === String(orderOrId || ''); });
    if (!order) return Promise.resolve(false);
    var phone = _orderPhoneDigits(order);
    if (!phone) {
      UI.toast('Cliente sem telefone cadastrado.', 'info');
      return Promise.resolve(false);
    }
    var statusKey = String(status || order.status || 'Pendente');
    var fn = WA_MSGS[statusKey] || WA_MSGS[_orderStatusLabel(statusKey)];
    var msg = fn ? fn(order) : _orderStatusWhatsappMessage(order, statusKey);
    if (_isKitchenModeOpen() && _showKitchenWhatsappPrompt(order, statusKey, msg)) return Promise.resolve(true);
    var ask = function (text) {
      if (UI && typeof UI.confirm === 'function') return UI.confirm(text);
      return Promise.resolve(window.confirm(text));
    };
    return ask('Quer avisar a cliente pelo WhatsApp?').then(function (yes) {
      if (!yes) return false;
      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
      return true;
    });
  }

  function _updateOrderStatus(orderId, status, opts) {
    opts = opts || {};
    var nextStatus = String(status || 'Pendente');
    var currentOrder = _orders.find(function (x) { return String(x.id || '') === String(orderId || ''); });
    var currentStatus = String(currentOrder && currentOrder.status || 'Pendente');
    if (currentOrder && currentStatus === nextStatus) {
      if (opts.toast !== false && opts.noChangeToast !== false) UI.toast('Status já estava atualizado.', 'info');
      return Promise.resolve(currentOrder);
    }
    return DB.update('orders', orderId, { status: nextStatus }).then(function () {
      var order = _orders.find(function (x) { return String(x.id || '') === String(orderId || ''); });
      if (order) order.status = nextStatus;
      return _syncOrderStockMovement(orderId, order, nextStatus).then(function () {
        return order;
      });
    }).then(function (order) {
      if (typeof _paintActive === 'function') _paintActive();
      if (_kitchenModeOverlay) {
        var board = document.getElementById('kitchen-full-board');
        if (board) _renderKanbanInto(board, _activeKitchenOrders());
      }
      if (nextStatus === 'Entregado' && Modules.Marketing && typeof Modules.Marketing._pointsGrantForOrder === 'function') {
        Modules.Marketing._pointsGrantForOrder(orderId, order || null, _matchedCustomer(order)).then(function () {
          if (typeof Modules.Marketing._pointsRefresh === 'function') Modules.Marketing._pointsRefresh();
        }).catch(function () {});
      }
      if (order) {
        _syncOrderFinanceMovement(orderId, order).catch(function () {});
      }
      if (opts.toast !== false) UI.toast(opts.toast || 'Status atualizado!', 'success');
      if (opts.prompt) return _promptOrderWhatsapp(orderId, nextStatus);
      return true;
    }).catch(function (err) {
      UI.toast('Erro ao atualizar: ' + err.message, 'error');
      return false;
    });
  }

  function _syncOrderStockMovement(orderId, order, status) {
    if (_statusCancelsStockMovement(status)) return _reverseOrderStockMovements(orderId, order);
    if (!_statusTriggersStockMovement(status)) return Promise.resolve(null);
    if (!order || !orderId) return Promise.resolve(null);
    return _createOrderStockMovements(orderId, order).then(function (patch) {
      if (!patch || !Object.keys(patch).length) return null;
      Object.keys(patch).forEach(function (key) { order[key] = patch[key]; });
      return DB.update('orders', orderId, patch).then(function () {
        return patch;
      });
    }).catch(function (err) {
      console.warn('Erro ao gerar baixa de estoque do pedido', err);
      return null;
    });
  }

  function _statusTriggersStockMovement(status) {
    var key = _fold(status || '');
    return ['confirmado', 'em preparacao', 'em camino', 'listo para recoger', 'entregado', 'entregue', 'concluido', 'finalizado'].indexOf(key) >= 0;
  }

  function _statusCancelsStockMovement(status) {
    var key = _fold(status || '');
    return ['cancelado', 'cancelada', 'canceled', 'cancelled'].indexOf(key) >= 0;
  }

  function _createOrderStockMovements(orderId, order) {
    if (order && order.stockMovementCreated) return Promise.resolve({});
    return _ensureProductsLoadedForStock().then(function () {
      return Promise.all([
        DB.getAll('stock_movements').catch(function () { return []; }),
        DB.getDocRoot ? DB.getDocRoot('config', 'estoque').catch(function () { return {}; }) : Promise.resolve({})
      ]);
    }).then(function (results) {
      var existing = results[0] || [];
      var regularizationMode = _stockRegularizationMode(results[1] || {});
      var existingMatches = (existing || []).filter(function (movement) {
        return movement && (movement.type === 'saida_venda' || movement.type === 'saida_base_venda') && String(movement.orderId || '') === String(orderId || '');
      });
      if (existingMatches.length) {
        return {
          stockMovementCreated: true,
          stockMovementCreatedAt: order.stockMovementCreatedAt || _nowIso(),
          stockMovementCount: existingMatches.length,
          stockMovementSkippedCount: _num(order.stockMovementSkippedCount || 0)
        };
      }

      var now = _nowIso();
      var items = Array.isArray(order.items) ? order.items : [];
      var ops = [];
      var saleMovementCount = 0;
      var skipped = [];
      var balances = _stockBalancesByKey(existing || []);
      var regularizationItems = [];
      items.forEach(function (item, idx) {
        var product = _findProductForOrderItem(item) || {};
        var refs = _orderItemStockRefs(item, product);
        if (!refs.length) {
          skipped.push(_firstText(item && item.name, item && item.productName, product.name, product.title, 'Item sem nome'));
          return;
        }
        refs.forEach(function (ref, refIdx) {
          var quantity = _num(ref.quantity);
          if (quantity <= 0) return;
          var movementId = _stockMovementOrderId(orderId, idx + '_' + refIdx);
          var isBase = ref.stockItemType === 'base_producao';
          var stockKey = _stockRefBalanceKey(ref);
          var balanceBefore = _roundStockQty(_num(balances[stockKey]));
          var balanceAfter = _roundStockQty(balanceBefore - quantity);
          var shortage = balanceAfter < 0 ? _roundStockQty(Math.abs(balanceAfter)) : 0;
          balances[stockKey] = balanceAfter;
          var regularizationMovementId = shortage > 0 ? _stockRegularizationMovementId(orderId, idx, refIdx, ref) : '';
          var regularizationItem = null;
          if (shortage > 0 && regularizationMode !== 'desligado') {
            regularizationItem = _stockRegularizationPendingItem(ref, item, product, {
              stockKey: stockKey,
              balanceBefore: balanceBefore,
              balanceAfter: balanceAfter,
              shortage: shortage,
              movementId: movementId
            });
            if (regularizationMode === 'automatico') {
              regularizationItem.status = 'aplicada';
              regularizationItem.appliedAt = now;
              regularizationItem.regularizationMovementId = regularizationMovementId;
              regularizationItem.regularizationAppliedQuantity = shortage;
            }
            regularizationItems.push(regularizationItem);
          }
          ops.push(DB.col('stock_movements').doc(movementId).set({
            id: movementId,
            type: isBase ? 'saida_base_venda' : 'saida_venda',
            movementGroup: 'order',
            orderId: orderId,
            orderNumber: _orderDisplayId(order),
            orderStatus: order.status || '',
            productId: ref.productId || '',
            productName: ref.productName || 'Produto',
            fichaTecnicaId: ref.fichaId || '',
            fichaTecnicaNome: ref.fichaNome || '',
            baseProductionId: ref.baseProductionId || '',
            baseProductionName: ref.baseProductionName || '',
            componentName: ref.componentName || '',
            sourceItemId: ref.readyItemId || '',
            produtoProntoId: ref.readyItemId || '',
            stockItemId: ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.productId || '',
            stockItemType: ref.stockItemType || (ref.fichaId ? 'produto_produzido' : 'produto_pronto'),
            itemClass: ref.stockItemType || (ref.fichaId ? 'produto_produzido' : 'produto_pronto'),
            classe: ref.stockItemType || (ref.fichaId ? 'produto_produzido' : 'produto_pronto'),
            quantity: quantity,
            unit: ref.unit || 'unidades',
            unitCost: _num(ref.unitCost),
            totalCost: _num(ref.unitCost) > 0 ? quantity * _num(ref.unitCost) : 0,
            parentOrderItemId: _firstText(item && item.productId, item && item.id, product.id, ''),
            parentOrderItemName: _firstText(item && item.name, item && item.productName, product.name, product.title, ''),
            stockSource: ref.source || 'item',
            stockBalanceKey: stockKey,
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            regularizationPending: shortage > 0 && regularizationMode === 'pendencia',
            regularizationShortage: shortage,
            regularizationStatus: shortage > 0 && regularizationMode !== 'desligado' ? (regularizationMode === 'automatico' ? 'aplicada' : 'pendente') : '',
            regularizationOrigin: shortage > 0 ? 'saldo_negativo_venda' : '',
            regularizationMovementId: shortage > 0 && regularizationMode === 'automatico' ? regularizationMovementId : '',
            movementDate: _firstText(order.deliveryDate, order.pickupDate, order.scheduleDate, order.createdAt, now).slice(0, 10),
            createdAt: now,
            updatedAt: now
          }, { merge: true }));
          saleMovementCount += 1;
          if (regularizationItem && regularizationMode === 'automatico') {
            ops.push(DB.col('stock_movements').doc(regularizationMovementId).set(_stockRegularizationMovementPayload(regularizationItem, order, regularizationMovementId, now), { merge: true }));
          }
        });
      });

      if (!ops.length) {
        if (!skipped.length) return {};
        return {
          stockMovementSkippedCount: skipped.length,
          stockMovementSkippedItems: skipped.slice(0, 12),
          stockMovementWarning: 'Itens sem vínculo com ficha técnica, base de produção ou produto pronto.'
        };
      }

      return Promise.all(ops).then(function () {
        var patch = {
          stockMovementCreated: true,
          stockMovementCreatedAt: order.stockMovementCreatedAt || now,
          stockMovementUpdatedAt: now,
          stockMovementCount: saleMovementCount,
          stockMovementSkippedCount: skipped.length
        };
        if (regularizationItems.length) {
          var pendingRegularizations = regularizationItems.filter(function (item) { return String(item && item.status || 'pendente') === 'pendente'; }).length;
          patch.stockRegularizationPending = pendingRegularizations > 0;
          patch.stockRegularizationStatus = pendingRegularizations > 0 ? 'pendente' : 'aplicada';
          patch.stockRegularizationOrigin = 'saldo_negativo_venda';
          patch.stockRegularizationDetectedAt = now;
          patch.stockRegularizationPendingCount = pendingRegularizations;
          patch.stockRegularizationPendingItems = regularizationItems.slice(0, 50);
          patch.stockRegularizationWarning = pendingRegularizations > 0
            ? 'Pedido gerou saída com saldo insuficiente. Revise a regularização em Estoque.'
            : 'Pedido gerou saída com saldo insuficiente e recebeu entrada automática de regularização.';
          if (!pendingRegularizations) patch.stockRegularizationAppliedAt = now;
        } else {
          patch.stockRegularizationPending = false;
          patch.stockRegularizationStatus = '';
          patch.stockRegularizationPendingCount = 0;
          patch.stockRegularizationPendingItems = [];
          patch.stockRegularizationWarning = '';
        }
        if (skipped.length) {
          patch.stockMovementSkippedItems = skipped.slice(0, 12);
          patch.stockMovementWarning = 'Itens sem vínculo com ficha técnica, base de produção ou produto pronto.';
        } else {
          patch.stockMovementSkippedItems = [];
          patch.stockMovementWarning = '';
        }
        return patch;
      });
    });
  }

  function _stockBalancesByKey(movements) {
    var balances = {};
    (movements || []).forEach(function (movement) {
      var entry = _stockMovementBalanceEntry(movement);
      if (!entry || !entry.key) return;
      balances[entry.key] = _roundStockQty(_num(balances[entry.key]) + entry.direction * entry.quantity);
    });
    return balances;
  }

  function _stockMovementBalanceEntry(movement) {
    if (!movement || typeof movement !== 'object') return null;
    var type = movement.type || '';
    var isPurchaseEntry = type === 'entrada_compra';
    var isProductionEntry = type === 'entrada_producao';
    var isBaseProductionEntry = type === 'entrada_base_producao';
    var isBaseSaleExit = type === 'saida_base_venda';
    var isSaleExit = type === 'saida_venda' || isBaseSaleExit;
    var isSaleReturn = type === 'retorno_venda';
    var isPurchaseReversal = type === 'estorno_compra';
    var isSaleReversal = type === 'estorno_venda';
    var isProductionIngredientReversal = type === 'estorno_producao_ingrediente';
    var isProductionProductReversal = type === 'estorno_producao_produto';
    var isBaseProductionReversal = type === 'estorno_base_producao';
    var isAdjustmentEntry = type === 'ajuste_entrada';
    var isAdjustmentExit = type === 'ajuste_saida';
    var isRegularizationEntry = type === 'entrada_regularizacao';
    var isEntry = isProductionEntry || isBaseProductionEntry || isPurchaseEntry || isSaleReversal || isSaleReturn || isProductionIngredientReversal || isAdjustmentEntry || isRegularizationEntry;
    var isExit = type === 'saida_producao' || isSaleExit || isPurchaseReversal || isProductionProductReversal || isBaseProductionReversal || isAdjustmentExit;
    if (!isEntry && !isExit) return null;
    var directType = _normalizeStockItemType(movement.stockItemType || movement.itemClass || movement.classe || '');
    var isBase = isBaseProductionEntry || isBaseProductionReversal || isBaseSaleExit || !!movement.baseProductionId;
    var readyId = movement.sourceItemId || movement.produtoProntoId || '';
    var itemId = isBase
      ? (movement.baseProductionId || movement.stockItemId || movement.componentName || '')
      : ((isProductionEntry || isProductionProductReversal)
        ? (movement.fichaTecnicaId || movement.stockItemId || '')
        : (isSaleExit || isSaleReversal || isSaleReturn)
          ? (movement.fichaTecnicaId || readyId || movement.stockItemId || movement.productId || '')
          : (isRegularizationEntry)
            ? (movement.itemId || movement.stockItemId || movement.fichaTecnicaId || readyId || movement.productId || '')
          : ((isAdjustmentEntry || isAdjustmentExit)
            ? (movement.itemId || movement.stockItemId || '')
            : ((isPurchaseEntry || isPurchaseReversal)
              ? (movement.itemId || movement.stockItemId || '')
              : (movement.ingredientId || movement.stockItemId || ''))));
    var fallbackName = isBase
      ? (movement.baseProductionName || movement.componentName || 'Base de produção')
      : (movement.fichaTecnicaNome || movement.productName || movement.itemName || movement.ingredientName || 'Item');
    var stockType = directType || (isBase ? 'base_producao' : ((isProductionEntry || isProductionProductReversal || movement.fichaTecnicaId) ? 'produto_produzido' : (readyId ? 'produto_pronto' : 'insumo')));
    var quantity = (isProductionEntry || isProductionProductReversal || isBaseProductionEntry || isBaseProductionReversal) ? _num(movement.quantityProduced || movement.quantity) : _num(movement.quantity);
    if (quantity <= 0) return null;
    return {
      key: stockType + ':' + (itemId || fallbackName),
      direction: isEntry ? 1 : -1,
      quantity: Math.abs(quantity)
    };
  }

  function _stockRefBalanceKey(ref) {
    var stockType = _normalizeStockItemType(ref && (ref.stockItemType || ref.itemClass || ref.classe || '') || (ref && ref.fichaId ? 'produto_produzido' : 'produto_pronto'));
    var itemId = ref && (ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.stockItemId || ref.productId || '');
    var name = ref && (ref.baseProductionName || ref.fichaNome || ref.productName || 'Item');
    return stockType + ':' + (itemId || name);
  }

  function _stockRegularizationPendingItem(ref, orderItem, product, data) {
    data = data || {};
    var stockType = _normalizeStockItemType(ref && (ref.stockItemType || ref.itemClass || ref.classe || '') || (ref && ref.fichaId ? 'produto_produzido' : 'produto_pronto'));
    var itemId = ref && (ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.stockItemId || ref.productId || '');
    var itemName = ref && (ref.baseProductionName || ref.fichaNome || ref.productName || '') || _firstText(orderItem && orderItem.name, orderItem && orderItem.productName, product && product.name, product && product.title, 'Item');
    return {
      status: 'pendente',
      origin: 'saldo_negativo_venda',
      stockKey: data.stockKey || _stockRefBalanceKey(ref),
      stockItemId: itemId,
      stockItemType: stockType,
      itemClass: stockType,
      classe: stockType,
      itemName: itemName,
      productId: ref && ref.productId || _firstText(orderItem && orderItem.productId, orderItem && orderItem.id, product && product.id, ''),
      productName: _firstText(orderItem && orderItem.name, orderItem && orderItem.productName, product && product.name, product && product.title, itemName),
      stockSource: ref && ref.source || 'item',
      movementId: data.movementId || '',
      requiredQuantity: _roundStockQty(_num(ref && ref.quantity)),
      shortageQuantity: _roundStockQty(_num(data.shortage)),
      balanceBefore: _roundStockQty(_num(data.balanceBefore)),
      balanceAfter: _roundStockQty(_num(data.balanceAfter)),
      unit: ref && ref.unit || 'un',
      unitCost: _num(ref && ref.unitCost),
      estimatedTotalCost: _num(ref && ref.unitCost) > 0 ? _roundStockQty(_num(data.shortage) * _num(ref && ref.unitCost)) : 0
    };
  }

  function _stockRegularizationMode(config) {
    var mode = String(config && (config.regularizationMode || config.stockRegularizationMode) || 'pendencia').trim().toLowerCase();
    if (mode === 'auto') mode = 'automatico';
    if (mode === 'off') mode = 'desligado';
    return ['pendencia', 'automatico', 'desligado'].indexOf(mode) >= 0 ? mode : 'pendencia';
  }

  function _stockRegularizationMovementId(orderId, itemIdx, refIdx, ref) {
    return 'regularizacao_' + String(orderId || 'pedido').replace(/[^\w-]/g, '_') + '_' + itemIdx + '_' + refIdx + '_' + String(ref && (ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.productId) || 'item').replace(/[^\w-]/g, '_');
  }

  function _stockRegularizationMovementPayload(item, order, movementId, now) {
    var stockType = _normalizeStockItemType(item.stockItemType || item.itemClass || item.classe || '');
    var qty = _roundStockQty(item.shortageQuantity);
    var unitCost = _num(item.unitCost);
    var payload = {
      id: movementId,
      type: 'entrada_regularizacao',
      movementGroup: 'stock_regularization',
      regularizationOrigin: 'saldo_negativo_venda',
      regularizationStatus: 'aplicada',
      regularizationEntry: true,
      regularizationSourceMovementId: item.movementId || '',
      orderId: order && order.id || '',
      orderNumber: _orderDisplayId(order || {}),
      itemId: item.stockItemId || '',
      itemName: item.itemName || '',
      productId: item.productId || '',
      productName: item.productName || item.itemName || '',
      stockItemId: item.stockItemId || '',
      stockItemType: stockType,
      itemClass: stockType,
      classe: stockType,
      quantity: qty,
      unit: item.unit || 'un',
      unitCost: unitCost,
      totalCost: unitCost > 0 ? qty * unitCost : 0,
      previousBalance: _num(item.balanceAfter),
      balanceBefore: _num(item.balanceAfter),
      balanceAfter: _roundStockQty(_num(item.balanceAfter) + qty),
      reason: 'Regularização automática de venda sem saldo',
      notes: 'Entrada criada automaticamente conforme configuração do estoque.',
      movementDate: _today(),
      createdAt: now,
      updatedAt: now
    };
    if (stockType === 'base_producao') {
      payload.baseProductionId = item.stockItemId || '';
      payload.baseProductionName = item.itemName || '';
    } else if (stockType === 'produto_produzido') {
      payload.fichaTecnicaId = item.stockItemId || '';
      payload.fichaTecnicaNome = item.itemName || '';
    } else if (stockType === 'produto_pronto') {
      payload.sourceItemId = item.stockItemId || '';
      payload.produtoProntoId = item.stockItemId || '';
    }
    return payload;
  }

  function _reverseOrderStockMovements(orderId, order) {
    if (!order || !orderId || !order.stockMovementCreated || order.stockMovementReversed) return Promise.resolve(null);
    return DB.getAll('stock_movements').catch(function () { return []; }).then(function (existing) {
      var exits = (existing || []).filter(function (movement) {
        return movement && (movement.type === 'saida_venda' || movement.type === 'saida_base_venda') && String(movement.orderId || '') === String(orderId || '');
      });
      if (!exits.length) return {};
      var already = (existing || []).some(function (movement) {
        return movement && movement.type === 'estorno_venda' && String(movement.orderId || '') === String(orderId || '');
      });
      if (already) return {
        stockMovementReversed: true,
        stockMovementReversedAt: order.stockMovementReversedAt || _nowIso()
      };
      var now = _nowIso();
      var ops = exits.map(function (movement, idx) {
        var id = _stockMovementOrderId(orderId, idx + '_estorno').replace('_saida_venda', '_estorno_venda');
        return DB.col('stock_movements').doc(id).set(Object.assign({}, movement, {
          id: id,
          type: 'estorno_venda',
          movementGroup: 'order',
          reversalOf: movement.id || '',
          reversalReason: 'cancelamento_pedido',
          movementDate: now.slice(0, 10),
          createdAt: now,
          updatedAt: now
        }), { merge: true });
      });
      return Promise.all(ops).then(function () {
        return {
          stockMovementReversed: true,
          stockMovementReversedAt: now,
          stockMovementReversalCount: ops.length
        };
      });
    }).then(function (patch) {
      if (!patch || !Object.keys(patch).length) return null;
      Object.keys(patch).forEach(function (key) { order[key] = patch[key]; });
      return DB.update('orders', orderId, patch).then(function () { return patch; });
    }).catch(function (err) {
      console.warn('Erro ao estornar baixa de estoque do pedido', err);
      return null;
    });
  }

  function _orderItemStockRefs(item, product) {
    var mainQty = _orderItemStockQuantity(item);
    var internalRefs = _internalCompositionStockRefs(item, product, mainQty);
    if (internalRefs.length) return internalRefs;
    var direct = _stockRefFromProductLike(item, product, mainQty, 'item');
    var choices = _extractStockChoiceRefs(item, product, mainQty);
    if (choices.length) return choices;
    if (Array.isArray(direct)) return direct;
    return direct ? [direct] : [];
  }

  function _internalCompositionStockRefs(item, product, mainQty) {
    var composition = Array.isArray(product && product.internalComposition)
      ? product.internalComposition
      : (Array.isArray(product && product.internalCompositionItems) ? product.internalCompositionItems : (Array.isArray(product && product.composicaoInterna) ? product.composicaoInterna : (Array.isArray(product && product.stockComposition) ? product.stockComposition : [])));
    if (!composition.length) return [];
    return composition.map(function (part) {
      if (!part || typeof part !== 'object') return null;
      var ref = String(part.ref || '').trim();
      var refParts = ref.split(':');
      var refType = refParts[0] || '';
      var refId = refParts.slice(1).join(':');
      var stockType = String(part.stockItemType || part.itemClass || part.classe || '').trim();
      if (!stockType && refType === 'receita') stockType = 'produto_produzido';
      if (!stockType && refType === 'ficha') stockType = 'produto_produzido';
      if (!stockType && refType === 'produto_pronto') stockType = 'produto_pronto';
      if (!stockType && refType === 'embalagem') stockType = 'embalagem';
      if (!stockType && (refType === 'insumo' || refType === 'ingrediente')) stockType = 'insumo';
      if (!stockType) stockType = 'produto_pronto';
      stockType = _normalizeStockItemType(stockType);
      var itemId = String(part.itemId || refId || part.fichaTecnicaId || part.fichaId || part.sourceItemId || part.produtoProntoId || '').trim();
      var qty = _roundStockQty((_num(part.quantity != null ? part.quantity : part.qty != null ? part.qty : 1) || 1) * (_num(mainQty) || 1));
      if (!itemId || qty <= 0) return null;
      var isProduced = stockType === 'produto_produzido' || refType === 'ficha' || refType === 'receita';
      var stockName = _firstText(part.itemName, part.name, part.label, isProduced ? 'Produto produzido' : 'Item interno');
      return {
        fichaId: isProduced ? itemId : '',
        fichaNome: isProduced ? stockName : '',
        readyItemId: isProduced ? '' : itemId,
        productId: itemId,
        productName: stockName,
        quantity: qty,
        unit: part.unit || 'un',
        unitCost: _num(part.unitCost),
        stockItemType: stockType,
        source: 'composicao_interna'
      };
    }).filter(Boolean);
  }

  function _normalizeStockItemType(value) {
    var type = String(value || '').trim().toLowerCase();
    if (type === 'ingrediente' || type === 'ingredientes') return 'insumo';
    if (type === 'produto' || type === 'produto pronto' || type === 'compras_produto') return 'produto_pronto';
    if (type === 'receita' || type === 'ficha') return 'produto_produzido';
    if (type === 'base' || type === 'base_producao') return 'base_producao';
    if (type === 'embalagens') return 'embalagem';
    return type || 'insumo';
  }

  function _extractStockChoiceRefs(item, product, mainQty) {
    var sources = [];
    ['stockChoices', 'choiceStockRefs', 'choices', 'variants', 'selections', 'options', 'selectedOptions', 'comboItems', 'comboSelections', 'items'].forEach(function (key) {
      var value = item && item[key];
      if (Array.isArray(value)) sources = sources.concat(value);
    });
    if (!sources.length && product) {
      ['comboItems', 'menuItems', 'itemsIncluded', 'components'].forEach(function (key) {
        var value = product[key];
        if (Array.isArray(value)) sources = sources.concat(value);
      });
    }
    var refs = [];
    sources.forEach(function (choice) {
      if (!choice || typeof choice !== 'object') return;
      var boundRef = _stockRefFromChoiceBinding(choice, mainQty);
      if (Array.isArray(boundRef) && boundRef.length) {
        refs = refs.concat(boundRef);
        return;
      }
      if (boundRef) {
        refs.push(boundRef);
        return;
      }
      var choiceProduct = _findProductForOrderItem(choice) || _findProductByAnyId(_firstText(choice.productId, choice.id, choice.itemId, choice.value, choice.optionId, '')) || {};
      var qty = _num(choice.quantity != null ? choice.quantity : choice.qty != null ? choice.qty : choice.count != null ? choice.count : choice.amount);
      if (qty <= 0) qty = 1;
      var ref = _stockRefFromProductLike(choice, choiceProduct, mainQty * qty, 'combo');
      if (Array.isArray(ref)) refs = refs.concat(ref);
      else if (ref) refs.push(ref);
    });
    return refs;
  }

  function _stockRefFromChoiceBinding(choice, mainQty) {
    if (!choice || typeof choice !== 'object') return null;
    var ref = String(_firstText(choice.stockRef, choice.stockItemRef, choice.stockItem, '') || '').trim();
    var refParts = ref ? ref.split(':') : [];
    var refType = refParts[0] || '';
    var refId = refParts.slice(1).join(':');
    var stockType = _firstText(choice.stockItemType, choice.itemClass, choice.classe, '');
    if (!stockType && (refType === 'ficha' || refType === 'receita')) stockType = 'produto_produzido';
    if (!stockType && refType === 'produto_pronto') stockType = 'produto_pronto';
    if (!stockType && refType === 'embalagem') stockType = 'embalagem';
    if (!stockType && (refType === 'insumo' || refType === 'ingrediente')) stockType = 'insumo';
    if (!stockType && refType === 'base_producao') stockType = 'base_producao';
    stockType = _normalizeStockItemType(stockType);
    var itemId = _firstText(choice.stockItemId, choice.itemId, refId, choice.fichaTecnicaId, choice.fichaId, choice.sourceItemId, choice.produtoProntoId, '');
    if (!itemId) return null;
    var absoluteQty = _num(choice.stockAbsoluteQuantity != null ? choice.stockAbsoluteQuantity : choice.stockQuantityTotal);
    var perChoice = _num(choice.stockQuantityPerChoice != null ? choice.stockQuantityPerChoice : choice.stockQuantity != null ? choice.stockQuantity : choice.stockQty);
    if (perChoice <= 0) perChoice = 1;
    var selectedQty = _num(choice.quantity != null ? choice.quantity : choice.qty != null ? choice.qty : choice.count != null ? choice.count : choice.amount);
    if (selectedQty <= 0) selectedQty = 1;
    var qty = absoluteQty > 0 ? absoluteQty : (_num(mainQty) || 1) * selectedQty * perChoice;
    qty = _roundStockQty(qty);
    if (qty <= 0) return null;
    if (stockType === 'produto_produzido') {
      var baseRefs = _baseStockRefsFromRecipe(choice, {}, qty, 'combo_opcao', itemId);
      if (baseRefs.length) return baseRefs;
    }
    var stockName = _firstText(choice.stockItemName, choice.itemName, choice.optionName, choice.name, choice.label, stockType === 'produto_produzido' ? 'Produto produzido' : 'Item da escolha');
    return {
      fichaId: stockType === 'produto_produzido' ? itemId : '',
      fichaNome: stockType === 'produto_produzido' ? stockName : '',
      readyItemId: (stockType === 'produto_produzido' || stockType === 'base_producao') ? '' : itemId,
      baseProductionId: stockType === 'base_producao' ? itemId : '',
      baseProductionName: stockType === 'base_producao' ? stockName : '',
      productId: itemId,
      productName: stockName,
      quantity: qty,
      unit: _firstText(choice.stockUnit, choice.unit, 'un'),
      unitCost: _num(choice.stockUnitCost != null ? choice.stockUnitCost : choice.unitCost),
      stockItemType: stockType,
      source: 'combo_opcao'
    };
  }

  function _stockRefFromProductLike(item, product, quantity, source) {
    var fichaId = _firstText(item && item.fichaTecnicaId, item && item.fichaId, item && item.recipeId, product && product.fichaTecnicaId, product && product.fichaId, product && product.recipeId, '');
    var baseRefs = fichaId ? _baseStockRefsFromRecipe(item, product, quantity, source, fichaId) : [];
    if (baseRefs.length) return baseRefs;
    var readyItemId = fichaId ? '' : _firstText(item && item.sourceItemId, item && item.produtoProntoId, item && item.readyProductId, product && product.sourceItemId, product && product.produtoProntoId, product && product.readyProductId, '');
    if (!fichaId && !readyItemId) return null;
    return {
      fichaId: fichaId,
      fichaNome: '',
      readyItemId: readyItemId,
      productId: _firstText(item && item.productId, item && item.id, product && product.id, ''),
      productName: _firstText(item && item.name, item && item.productName, product && product.name, product && product.title, 'Produto'),
      quantity: quantity,
      unit: _firstText(item && item.unit, product && product.stockUnit, product && product.yieldUnit, product && product.unit, 'unidades'),
      unitCost: _orderItemStockUnitCost(item, product),
      stockItemType: fichaId ? 'produto_produzido' : 'produto_pronto',
      source: source
    };
  }

  function _baseStockRefsFromRecipe(item, product, quantity, source, fichaId) {
    var recipe = _findStockRecipeById(fichaId);
    var components = recipe && Array.isArray(recipe.components) ? recipe.components : [];
    var baseComponents = components.filter(function (comp) { return comp && (comp.stockControl || comp.controlsStock); });
    if (!baseComponents.length) return [];
    var recipeYield = _num(recipe.yieldQuantity || recipe.yield || recipe.rendimento || product && (product.yieldQuantity || product.yield)) || 1;
    var soldQty = _num(quantity) || 1;
    return baseComponents.map(function (comp, idx) {
      var baseYield = _num(comp.stageYieldQuantity || comp.baseYieldQuantity || comp.stockYieldQuantity);
      if (baseYield <= 0) baseYield = recipeYield;
      var qty = _roundStockQty((baseYield / Math.max(1, recipeYield)) * soldQty);
      var totalCost = _componentStockCost(comp);
      var unitCost = baseYield > 0 ? totalCost / baseYield : 0;
      return {
        fichaId: fichaId,
        fichaNome: recipe.name || recipe.title || '',
        readyItemId: '',
        productId: _firstText(item && item.productId, item && item.id, product && product.id, ''),
        productName: _firstText(item && item.name, item && item.productName, product && product.name, product && product.title, 'Produto'),
        baseProductionId: _baseProductionIdForOrder(recipe, comp, idx),
        baseProductionName: comp.name || 'Base de produção',
        componentName: comp.name || '',
        quantity: qty,
        unit: comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || recipe.yieldUnit || 'unidades',
        unitCost: unitCost,
        stockItemType: 'base_producao',
        source: source === 'combo' ? 'combo_base_producao' : 'base_producao'
      };
    }).filter(function (ref) { return _num(ref.quantity) > 0; });
  }

  function _baseProductionIdForOrder(recipe, comp, idx) {
    comp = comp || {};
    var existing = String(comp.baseProductionId || '').trim();
    if (existing) return existing;
    var shared = String(comp.sharedBaseId || '').trim();
    if (shared) return shared;
    var componentId = String(comp.componentId || comp.recipeComponentId || '').trim();
    if (componentId) return componentId.indexOf('base_component:') === 0 ? componentId : 'base_component:' + componentId;
    return (recipe && recipe.id ? recipe.id : 'receita') + ':' + (comp.name || ('etapa_' + (idx || 0)));
  }

  function _findStockRecipeById(id) {
    var wanted = String(id || '').trim();
    if (!wanted) return null;
    return (_stockRecipes || []).find(function (recipe) {
      return String(recipe.id || '') === wanted || String(recipe.fichaTecnicaId || '') === wanted || String(recipe.recipeId || '') === wanted;
    }) || null;
  }

  function _componentStockCost(comp) {
    return (comp && Array.isArray(comp.ingredients) ? comp.ingredients : []).reduce(function (sum, ing) {
      return sum + _num(ing.totalCost || ing.plannedTotalCost || ing.costTotal || ing.custoTotal);
    }, 0);
  }

  function _roundStockQty(value) {
    return Math.round((_num(value) + Number.EPSILON) * 10000) / 10000;
  }

  function _findProductByAnyId(id) {
    var wanted = String(id || '').trim();
    if (!wanted) return null;
    return (_products || []).find(function (p) {
      return String(p.id || '') === wanted || String(p.productId || '') === wanted || String(p.sourceItemId || '') === wanted || String(p.produtoProntoId || '') === wanted || String(p.fichaId || p.fichaTecnicaId || '') === wanted;
    }) || null;
  }

  function _ensureProductsLoadedForStock() {
    if ((_products || []).length && (_stockRecipes || []).length) return Promise.resolve(_products);
    return Promise.all([
      (_products || []).length ? Promise.resolve(_products) : DB.getAll('products').catch(function () { return []; }),
      (_stockRecipes || []).length ? Promise.resolve(_stockRecipes) : DB.getAll('fichasTecnicas').catch(function () { return []; })
    ]).then(function (res) {
      _products = (res[0] || []).slice();
      _stockRecipes = (res[1] || []).slice();
      return _products;
    });
  }

  function _orderItemStockQuantity(item) {
    return _num(item && (item.quantity != null ? item.quantity : item.qty != null ? item.qty : item.qtd != null ? item.qtd : item.amount)) || 1;
  }

  function _orderItemStockUnitCost(item, product) {
    return _num(
      _firstText(
        item && item.stockUnitCost,
        item && item.unitCost,
        product && product.stockUnitCost,
        product && product.costPerYield,
        product && product.custoUnitario,
        product && product.custoAtual,
        product && product.custo,
        product && product.cost,
        ''
      )
    );
  }

  function _stockMovementOrderId(orderId, idx) {
    return String(orderId || 'pedido').replace(/[^\w-]/g, '_') + '_' + idx + '_saida_venda';
  }

  function _nowIso() {
    return new Date().toISOString();
  }
  function _today() {
    return new Date().toISOString().slice(0, 10);
  }
  function _waFromDetail(id) {
    var o = _orders.find(function (x) { return x.id === id; });
    if (!o) return;
    var status = (document.getElementById('detail-status') || {}).value || o.status;
    var phone = _orderPhoneDigits(o);
    if (!phone) { UI.toast('Cliente sem telefone cadastrado.', 'info'); return; }
    var msg = _detailWhatsappMsg(o, _orderStatusLabel(status));
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function _whatsapp(id) {
    var o = _orders.find(function (x) { return x.id === id; });
    if (!o) return;
    var fn = WA_MSGS[o.status];
    var msg = fn ? fn(o) : _orderStatusWhatsappMessage(o, o.status);
    var phone = _orderPhoneDigits(o);
    if (!phone) { UI.toast('Cliente sem telefone cadastrado.', 'info'); return; }
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function _cancelOrder(id) {
    UI.confirm('Cancelar este pedido?').then(function (yes) {
      if (!yes) return;
      _updateOrderStatus(id, 'Cancelado', { toast: 'Pedido cancelado', prompt: false });
    });
  }

  function _openNewOrderLegacy() {
    var context = _orderContext();
    _manualOrderReset(context);

    var overlay = document.createElement('div');
    overlay.id = 'manual-order-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';

    var modal = document.createElement('div');
    modal.style.cssText = 'width:100%;max-width:1240px;max-height:90vh;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden;';

    var header = document.createElement('div');
    header.style.cssText = 'padding:20px 24px;border-bottom:1px solid #F2EDED;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex:0 0 auto;background:#fff;';
    header.innerHTML = '<div style="min-width:0;">' +
      '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Pedido manual</div>' +
      '<h2 style="font-family:\'League Spartan\',sans-serif;font-size:22px;font-weight:800;line-height:1.1;margin:0;">Criar pedido manual</h2>' +
      '<div id="mo-header-channel" style="margin-top:8px;display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:#FAF8F8;border:1px solid #EEE6E4;font-size:11px;font-weight:800;color:#8A7E7C;">Canal herdado: ' + _esc(_manualOrderDisplayChannel(_manualOrderState.channel)) + '</div>' +
    '</div>' +
    '<button type="button" onclick="Modules.Pedidos._closeManualOrderModal()" style="width:34px;height:34px;border-radius:50%;border:none;background:#F2EDED;cursor:pointer;font-size:16px;flex-shrink:0;">✕</button>';

    var content = document.createElement('div');
    content.style.cssText = 'padding:16px 20px 20px;overflow:auto;flex:1;min-height:0;background:#FBF5F3;';
    content.innerHTML =
      '<div id="manual-order-shell" style="display:grid;grid-template-columns:minmax(0,1.45fr) minmax(340px,.95fr);gap:16px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:14px;">' +
          '<section style="background:#fff;border:1px solid #F2EDED;border-radius:14px;padding:14px 14px 12px;display:flex;flex-direction:column;gap:12px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
              '<div>' +
                '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Cliente</div>' +
                '<div style="font-size:16px;font-weight:800;color:#1A1A1A;">Selecionar ou criar cliente</div>' +
              '</div>' +
              '<div id="mo-customer-pill" style="font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;background:#F2EDED;color:#8A7E7C;">Nenhum cliente selecionado</div>' +
            '</div>' +
            '<div>' +
              '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Buscar cliente existente</label>' +
              '<input id="mo-customer-search" type="search" list="mo-customer-datalist" value="' + _esc(_manualOrderState.customerQuery) + '" oninput="Modules.Pedidos._manualOrderSearchCustomers(this.value)" placeholder="Buscar por nome, telefone, e-mail ou zona" style="width:100%;padding:11px 14px;border:1.5px solid #D4C8C6;border-radius:999px;font-size:13px;font-family:inherit;outline:none;background:#fff;">' +
              '<datalist id="mo-customer-datalist"></datalist>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Nome do cliente</label><input id="mo-name" type="text" value="' + _esc(_manualOrderState.customerName) + '" placeholder="Nome" oninput="Modules.Pedidos._manualOrderField(\'customerName\', this.value)" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Telefone / WhatsApp</label><input id="mo-phone" type="text" value="' + _esc(_manualOrderState.customerPhone) + '" placeholder="' + _esc(_manualOrderPhonePlaceholder()) + '" oninput="Modules.Pedidos._manualOrderField(\'customerPhone\', this.value)" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">E-mail</label><input id="mo-email" type="email" value="' + _esc(_manualOrderState.customerEmail) + '" placeholder="E-mail" oninput="Modules.Pedidos._manualOrderField(\'customerEmail\', this.value)" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Tipo</label><select id="mo-type" onchange="Modules.Pedidos._manualOrderSetType(this.value)" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"><option value="delivery">🛵 Entrega</option><option value="pickup">🏪 Retirada</option></select></div>' +
            '</div>' +
          '</section>' +
          '<section style="background:#fff;border:1px solid #F2EDED;border-radius:14px;padding:14px 14px 12px;display:flex;flex-direction:column;gap:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
              '<div>' +
                '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Entrega / Retirada</div>' +
                '<div style="font-size:16px;font-weight:800;color:#1A1A1A;">Definir forma de entrega</div>' +
              '</div>' +
            '</div>' +
            '<div id="mo-delivery-block" style="display:grid;grid-template-columns:2fr 1fr;gap:10px;">' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Endereço</label><input id="mo-address" type="text" value="' + _esc(_manualOrderState.customerAddress) + '" placeholder="Endereço de entrega" oninput="Modules.Pedidos._manualOrderField(\'customerAddress\', this.value)" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Zona / CEP</label><input id="mo-zone" type="text" value="' + _esc(_manualOrderState.customerZone) + '" placeholder="Zona ou CEP" oninput="Modules.Pedidos._manualOrderField(\'customerZone\', this.value);Modules.Pedidos._manualOrderMaybeSyncShipping();" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
              '<div style="grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Dia</label><input id="mo-delivery-date" type="date" value="' + _esc(_manualOrderState.deliveryDate || '') + '" oninput="Modules.Pedidos._manualOrderSetDeliveryDate(this.value)" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Horário</label><input id="mo-delivery-time" type="time" value="' + _esc(_manualOrderState.deliveryTime || '') + '" oninput="Modules.Pedidos._manualOrderSetDeliveryTime(this.value)" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
              '</div>' +
              '<div id="mo-delivery-fee-block"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Taxa de entrega</label><input id="mo-shipping" type="number" step="0.01" value="' + _esc(String(_manualOrderState.shippingFee || 0)) + '" oninput="Modules.Pedidos._manualOrderSetShippingFee(this.value)" placeholder="0,00" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;"></div>' +
            '</div>' +
            '<div id="mo-pickup-block" style="display:none;"></div>' +
          '</section>' +
          '<section style="background:#fff;border:1px solid #F2EDED;border-radius:14px;padding:14px 14px 12px;display:flex;flex-direction:column;gap:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
              '<div>' +
                '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Produtos</div>' +
                '<div style="font-size:16px;font-weight:800;color:#1A1A1A;">Adicionar itens ao pedido</div>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Buscar produto</label>' +
              '<input id="mo-product-search" type="search" value="' + _esc(_manualOrderState.productQuery) + '" oninput="Modules.Pedidos._manualOrderSearchItems(this.value)" placeholder="Buscar por produto, categoria ou tag" style="width:100%;padding:11px 14px;border:1.5px solid #D4C8C6;border-radius:999px;font-size:13px;font-family:inherit;outline:none;background:#fff;">' +
            '</div>' +
            '<div id="mo-product-results"></div>' +
          '</section>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:14px;position:sticky;top:0;align-self:start;">' +
          '<section style="background:#fff;border:1px solid #F2EDED;border-radius:14px;padding:14px 14px 12px;display:flex;flex-direction:column;gap:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
              '<div>' +
                '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Resumo</div>' +
                '<div style="font-size:16px;font-weight:800;color:#1A1A1A;">Itens selecionados</div>' +
              '</div>' +
              '<div id="mo-price-origin" style="font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;background:#FFF0EE;color:#C4362A;">Origem: manual</div>' +
            '</div>' +
            '<div id="mo-selected-items"></div>' +
            '<div id="mo-summary" style="display:grid;grid-template-columns:1fr;gap:10px;"></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end;">' +
              '<div>' +
                '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Ajuste manual</label>' +
                '<input id="mo-adjustment" type="number" step="0.01" value="' + _esc(String(_manualOrderState.adjustment || 0)) + '" oninput="Modules.Pedidos._manualOrderSetAdjustment(this.value)" placeholder="0,00" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' +
                '<div id="mo-adjustment-note" style="font-size:11px;color:#8A7E7C;margin-top:6px;line-height:1.4;"></div>' +
              '</div>' +
              '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Total final</label><div id="mo-total-final" style="width:100%;padding:12px 12px;border:1.5px solid #E6DDDB;border-radius:10px;background:#F8F6F5;font-size:18px;font-weight:900;color:#1A1A1A;">€0,00</div></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr;gap:8px;">' +
              '<div>' +
                '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Forma de pagamento</label>' +
                '<select id="mo-payment-method" onchange="Modules.Pedidos._manualOrderSetPaymentMethod(this.value)" style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' + _paymentMethodOptions(_manualOrderState.paymentMethod) + '</select>' +
              '</div>' +
              '<div>' +
                '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Status do pagamento</label>' +
                '<select id="mo-payment-status" onchange="Modules.Pedidos._manualOrderSetPaymentStatus(this.value)" style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' + _paymentStatusOptions(_manualOrderState.paymentStatus) + '</select>' +
              '</div>' +
              '<div id="mo-paid-amount-box" style="display:' + (_paymentStatusIsPartial(_manualOrderState.paymentStatus) ? 'block' : 'none') + ';">' +
                '<label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Valor pago</label>' +
                '<input id="mo-paid-amount" type="number" step="0.01" value="' + _esc(String(_manualOrderState.paidAmount || 0)) + '" oninput="Modules.Pedidos._manualOrderSetPaidAmount(this.value)" placeholder="0,00" style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

    var footer = '<div style="display:flex;gap:10px;justify-content:flex-end;width:100%;">' +
      '<button type="button" onclick="Modules.Pedidos._closeManualOrderModal()" style="padding:11px 16px;border-radius:12px;border:1.5px solid #D4C8C6;background:#fff;color:#1A1A1A;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Cancelar</button>' +
      '<button id="mo-submit-btn" type="button" onclick="Modules.Pedidos._saveNewOrder()" style="padding:11px 18px;border-radius:12px;border:none;background:#C4362A;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Criar pedido</button>' +
    '</div>';

    var overlay = document.createElement('div');
    overlay.id = 'manual-order-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';

    var modal = document.createElement('div');
    modal.style.cssText = 'width:100%;max-width:1240px;max-height:90vh;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden;';

    var header = document.createElement('div');
    header.style.cssText = 'padding:20px 24px;border-bottom:1px solid #F2EDED;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex:0 0 auto;background:#fff;';
    header.innerHTML = '<div style="min-width:0;">' +
      '<div style="font-size:11px;font-weight:900;color:#8A7E7C;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Pedido manual</div>' +
      '<h2 style="font-family:\'League Spartan\',sans-serif;font-size:22px;font-weight:800;line-height:1.1;margin:0;">Criar pedido manual</h2>' +
      '<div id="mo-header-channel" style="margin-top:8px;display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:#FAF8F8;border:1px solid #EEE6E4;font-size:11px;font-weight:800;color:#8A7E7C;">Canal herdado: ' + _esc(_manualOrderDisplayChannel(_manualOrderState.channel)) + '</div>' +
    '</div>' +
    '<button type="button" onclick="Modules.Pedidos._closeManualOrderModal()" style="width:34px;height:34px;border-radius:50%;border:none;background:#F2EDED;cursor:pointer;font-size:16px;flex-shrink:0;">✕</button>';

    var content = document.createElement('div');
    content.style.cssText = 'padding:16px 20px 20px;overflow:auto;flex:1;min-height:0;background:#FBF5F3;';
    content.innerHTML = body;

    var footerWrap = document.createElement('div');
    footerWrap.style.cssText = 'padding:16px 24px;border-top:1px solid #F2EDED;background:#fff;flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;gap:16px;';
    footerWrap.innerHTML = '<div style="font-size:12px;color:#8A7E7C;line-height:1.4;">O canal é herdado automaticamente. O pedido calcula promoções e totais ao vivo.</div>' + footer;

    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footerWrap);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.onclick = function (e) { if (e.target === overlay) _closeManualOrderModal(); };

    window._newOrderModal = {
      close: _closeManualOrderModal,
      el: overlay
    };

    _manualOrderRefresh();
    setTimeout(function () {
      if (window.BocaPlaces) {
        BocaPlaces.init('mo-address', { onPlace: function (data) { _manualOrderApplyPlace('mo-', data, true); } });
      }
    }, 300);
  }

  function _saveNewOrder() {
    var name = String(_manualOrderState.customerName || (document.getElementById('mo-name') || {}).value || '').trim();
    var phone = String(_manualOrderState.customerPhone || _manualPhoneFull((document.getElementById('mo-phone-prefix') || {}).value, (document.getElementById('mo-phone-number') || {}).value) || '').trim();
    var email = String(_manualOrderState.customerEmail || (document.getElementById('mo-email') || {}).value || '').trim();
    var address = String(_manualOrderState.customerAddress || (document.getElementById('mo-address') || {}).value || '').trim();
    var addressNumber = String(_manualOrderState.customerAddressNumber || (document.getElementById('mo-address-number') || {}).value || '').trim();
    var addressComplement = String(_manualOrderState.customerAddressComplement || (document.getElementById('mo-address-complement') || {}).value || '').trim();
    var neighborhood = String(_manualOrderState.customerNeighborhood || (document.getElementById('mo-neighborhood') || {}).value || '').trim();
    var city = String(_manualOrderState.customerCity || (document.getElementById('mo-city') || {}).value || '').trim();
    var province = String(_manualOrderState.customerProvince || (document.getElementById('mo-province') || {}).value || '').trim();
    var country = String(_manualOrderState.customerCountry || (document.getElementById('mo-country') || {}).value || '').trim();
    var postalCode = String(_manualOrderState.customerPostalCode || (document.getElementById('mo-postal-code') || {}).value || '').trim();
    var zone = String(neighborhood || postalCode || _manualOrderState.customerZone || '').trim();
    var type = String((document.getElementById('mo-type') || {}).value || _manualOrderState.type || 'delivery');
    var deliveryDate = String((document.getElementById('mo-delivery-date') || {}).value || _manualOrderState.deliveryDate || '').trim();
    var deliveryTime = String((document.getElementById('mo-delivery-time') || {}).value || _manualOrderState.deliveryTime || '').trim();
    var orderTime = _normalizeTimeValue(String((document.getElementById('mo-order-time') || {}).value || _manualOrderState.orderTime || _currentTimeValue()).trim());
    _manualOrderState.orderTime = orderTime;
    var madeToOrder = !!((document.getElementById('mo-made-to-order') || {}).checked || _manualOrderState.madeToOrder);
    var productionLeadDays = madeToOrder ? Math.max(0, Math.floor(_num((document.getElementById('mo-production-lead-days') || {}).value || _manualOrderState.productionLeadDays || 0))) : 0;
    var slot = [deliveryDate, deliveryTime].filter(Boolean).join(' ').trim();
    var note = String((document.getElementById('mo-note') || {}).value || '').trim();
    var paymentStatus = String((document.getElementById('mo-payment-status') || {}).value || _manualOrderState.paymentStatus || 'previsto').trim() || 'previsto';
    var paidAmount = _num((document.getElementById('mo-paid-amount') || {}).value || _manualOrderState.paidAmount || 0);
    var adjustment = _num((document.getElementById('mo-adjustment') || {}).value || _manualOrderState.adjustment || 0);
    var shippingFee = type === 'delivery' ? _num(_manualOrderState.shippingFee || (document.getElementById('mo-shipping') || {}).value || 0) : 0;
    var context = _orderContext();
    var channel = _manualOrderState.channel || context.channel || 'manual';
    var source = _manualOrderState.source || context.source || channel || 'manual';
    var channelCategory = _channelIncomeCategoryMeta(_salesChannelByName(channel) || _salesChannelByName(source) || {});
    var selectedCustomer = _manualOrderSelectedCustomer();
    var customerFiscal = Object.assign({}, (selectedCustomer && selectedCustomer.fiscal) || {});
    var customerDocument = _firstText(
      selectedCustomer && selectedCustomer.nifCif,
      selectedCustomer && selectedCustomer.fiscalId,
      selectedCustomer && selectedCustomer.document,
      selectedCustomer && selectedCustomer.documento,
      customerFiscal && customerFiscal.fiscalId,
      ''
    );
    var customerPreferences = _firstText(selectedCustomer && selectedCustomer.preferences, _manualOrderState.customerPreferences, '');
    var customerAllergies = _firstText(selectedCustomer && selectedCustomer.allergies, '');
    var customerNotes = _firstText(selectedCustomer && (selectedCustomer.notes || selectedCustomer.internalNotes), _manualOrderState.customerNotes, '');
    var deliveryAddress = type === 'delivery' ? {
      address: address,
      number: addressNumber,
      complement: addressComplement,
      formattedAddress: address,
      city: city,
      province: province,
      country: country,
      zone: zone,
      neighborhood: neighborhood || zone,
      postalCode: postalCode
    } : null;
    var showInKitchen = _isCardapioOrder({ channel: channel, source: source, originChannel: channel, originSource: source });
    var items = (_manualOrderState.items || []).map(function (item) {
      var product = (_products || []).find(function (p) { return String(p.id || '') === String(item.productId || ''); }) || {};
      var calc = _manualOrderState.channel === 'cardapio' ? _manualOrderBestPromoForProduct(product) : null;
      var originalPrice = _num(item.originalPrice != null ? item.originalPrice : (_manualOrderProductBasePrice(product) + _num(item.choiceExtraTotal || 0)));
      var quantity = item.quantity || 1;
      var finalPrice = calc && !_num(item.choiceExtraTotal || 0) ? calc.calc.final : _num(item.finalPrice || originalPrice);
      return {
        id: item.productId,
        productId: item.productId,
        name: item.name || _firstText(product.name, product.title, 'Produto'),
        category: item.category || _firstText(product.category, product.categoria, ''),
        quantity: quantity,
        qty: quantity,
        originalPrice: originalPrice,
        price: finalPrice,
        finalPrice: finalPrice,
        unitPrice: finalPrice,
        basePrice: _num(item.basePrice || _manualOrderProductBasePrice(product)),
        choiceExtraTotal: _num(item.choiceExtraTotal || 0),
        choices: Array.isArray(item.choices) ? item.choices : [],
        selectedOptions: Array.isArray(item.selectedOptions) ? item.selectedOptions : (Array.isArray(item.choices) ? item.choices : []),
        variants: Array.isArray(item.variants) ? item.variants : (Array.isArray(item.choices) ? item.choices : []),
        options: Array.isArray(item.options) ? item.options : (Array.isArray(item.choices) ? item.choices : []),
        stockChoices: Array.isArray(item.stockChoices) ? item.stockChoices : [],
        total: finalPrice * quantity,
        fichaTecnicaId: _firstText(product.fichaTecnicaId, product.fichaId, product.recipeId, ''),
        fichaId: _firstText(product.fichaId, product.fichaTecnicaId, product.recipeId, ''),
        sourceItemId: _firstText(product.sourceItemId, product.produtoProntoId, product.readyProductId, ''),
        produtoProntoId: _firstText(product.produtoProntoId, product.sourceItemId, product.readyProductId, ''),
        stockUnitCost: _num(_firstText(product.stockUnitCost, product.costPerYield, product.custoUnitario, product.custoAtual, product.custo, product.cost, '')),
        fiscal: Object.assign({}, product.fiscal || {}),
        internalNote: _firstText(item.internalNote, item.productInternalNote, product.internalNote, product.internalNotes, product.kitchenNote, ''),
        productInternalNote: _firstText(item.productInternalNote, item.internalNote, product.internalNote, product.internalNotes, product.kitchenNote, ''),
        promoId: calc && calc.promo ? String(calc.promo.id || calc.promo._id || calc.promo.slug || '') : (item.promoId || ''),
        promoName: calc && calc.promo ? _firstText(calc.promo.name, calc.promo.title, 'Promoção') : (item.promoName || ''),
        promoType: calc && calc.promo ? String(calc.promo.type || '') : (item.promoType || ''),
        promoLeve: calc && calc.calc ? _num(calc.calc.leve || 0) : _num(item.promoLeve || 0),
        promoPague: calc && calc.calc ? _num(calc.calc.pague || 0) : _num(item.promoPague || 0),
        promoMinOrder: calc && calc.promo ? _manualOrderPromoMinOrder(calc.promo) : _num(item.promoMinOrder || 0),
        addAlsoDiscount: 0,
        upsellRuleId: '',
        upsellRuleName: '',
        upsellBenefitType: '',
        relatedToProductId: '',
        relatedToProductName: '',
        priceOrigin: calc && calc.calc.discount > 0 ? 'promo' : (_manualOrderState.channel === 'cardapio' ? 'automático' : 'manual'),
        manualAdjustment: item.manualAdjustment || 0
      };
    });
    var subtotalOriginal = items.reduce(function (sum, item) { return sum + (_num(item.originalPrice) * (item.quantity || 1)); }, 0);
    items = items.map(function (item) {
      if (item.promoId && item.promoMinOrder && subtotalOriginal < item.promoMinOrder) {
        return Object.assign({}, item, {
          finalPrice: item.originalPrice,
          promoId: '',
          promoName: '',
          promoType: '',
          priceOrigin: _manualOrderState.channel === 'cardapio' ? 'automático' : 'manual'
        });
      }
      if (item.promoType === 'add1' && item.promoLeve > 0 && item.promoPague > 0 && item.promoLeve > item.promoPague) {
        var qty = Math.max(1, item.quantity || 1);
        var bundles = Math.floor(qty / item.promoLeve);
        var remainder = qty % item.promoLeve;
        var totalAdd = ((bundles * item.promoPague) + remainder) * _num(item.originalPrice);
        return Object.assign({}, item, { finalPrice: totalAdd / qty });
      }
      return item;
    });
    var subtotalFinal = items.reduce(function (sum, item) { return sum + (_num(item.finalPrice) * (item.quantity || 1)); }, 0);
    var promoDiscountTotal = Math.max(subtotalOriginal - subtotalFinal, 0);
    var total = Math.max(subtotalFinal + shippingFee + adjustment, 0);
    var hasPromo = promoDiscountTotal > 0;
    if (_paymentStatusIsPaid(paymentStatus)) paidAmount = total;
    if (!_paymentStatusIsPartial(paymentStatus)) paidAmount = _paymentStatusIsPaid(paymentStatus) ? total : 0;

    if (!(name || phone) && _fold(_manualOrderState.channel) === 'tpv') name = 'Cliente balcão';
    if (!(name || phone)) { UI.toast('Informe o nome ou telefone do cliente', 'error'); return; }
    if (!type) { UI.toast('Tipo do pedido obrigatório', 'error'); return; }
    if (!items.length) { UI.toast('Selecione ao menos um produto', 'error'); return; }
    if (!(total > 0)) { UI.toast('O total final precisa ser maior que zero', 'error'); return; }
    if (madeToOrder) {
      var maxAdvance = _manualOrderMaxAdvanceDays();
      var daysUntil = _manualOrderDaysUntil(deliveryDate);
      if (productionLeadDays <= 0) {
        UI.toast('Informe o prazo de produção da encomenda.', 'error');
        return;
      }
      if (productionLeadDays > maxAdvance) {
        UI.toast('O prazo de produção precisa ficar dentro da antecedência configurada em Operação: até ' + maxAdvance + ' dia(s).', 'error');
        return;
      }
      if (daysUntil == null) {
        UI.toast('Informe a data de entrega ou retirada para pedido sob encomenda.', 'error');
        return;
      }
      if (daysUntil > maxAdvance) {
        UI.toast('A data escolhida precisa ficar dentro da antecedência configurada em Operação: até ' + maxAdvance + ' dia(s).', 'error');
        return;
      }
      if (daysUntil < productionLeadDays) {
        UI.toast('A data escolhida não respeita o prazo de produção de ' + productionLeadDays + ' dia(s).', 'error');
        return;
      }
    }

    var saveOrder = function () {
      _ensureManualOrderCustomer({
        customerId: _manualOrderState.selectedCustomerId || _manualOrderState.customerId || '',
        name: name,
        phone: phone,
        email: email,
        address: address,
        number: addressNumber,
        complement: addressComplement,
        neighborhood: neighborhood,
        city: city,
        province: province,
        country: country,
        postalCode: postalCode,
        zone: zone,
        channel: channel,
        note: note
      }).then(function (customerId) {
      var payload = {
        customerId: String(customerId || ''),
        clientId: String(customerId || ''),
        customerName: name,
        clientName: name,
        name: name,
        customerPhone: phone,
        phone: phone,
        whatsapp: phone,
        customerEmail: email,
        email: email,
        customerFiscal: customerFiscal,
        customerDocument: customerDocument,
        customerBirthday: _firstText(selectedCustomer && selectedCustomer.birthday, ''),
        customerPreferences: customerPreferences,
        customerAllergies: customerAllergies,
        customerNotes: customerNotes,
        customerAcceptsMarketing: !!(selectedCustomer && selectedCustomer.acceptsMarketing),
        address: address,
        deliveryAddress: deliveryAddress,
        streetAddress: address,
        addressNumber: addressNumber,
        complement: addressComplement,
        neighborhood: neighborhood,
        city: city,
        province: province,
        country: country,
        postalCode: postalCode,
        deliveryZoneName: zone,
        zone: zone,
        type: type,
        slot: slot,
        note: note,
        status: 'Pendente',
        items: items,
        subtotalOriginal: subtotalOriginal,
        subtotal: subtotalOriginal,
        subtotalFinal: subtotalFinal,
        promoDiscountTotal: promoDiscountTotal,
        discountTotal: promoDiscountTotal,
        couponDiscountTotal: 0,
        pointsDiscountTotal: 0,
        pointsRedemption: { used: false, pointsUsed: 0, discount: 0 },
        upsellDiscountTotal: 0,
        upsellBenefits: { discount: 0, lines: [], gifts: [], appliedRuleIds: [], appliedRuleNames: [] },
        shippingFee: shippingFee,
        originalDeliveryFee: shippingFee,
        freeShippingApplied: false,
        freeShippingPromotionId: '',
        freeShippingPromotionName: '',
        freeShippingSource: '',
        manualAdjustmentValue: adjustment,
        total: total,
        paymentMethod: String(_manualOrderState.paymentMethod || ''),
        paymentStatus: paymentStatus,
        paymentState: paymentStatus,
        paidAmount: paidAmount,
        amountPaid: paidAmount,
        valuePaid: paidAmount,
        paid: _paymentStatusIsPaid(paymentStatus) ? true : (_paymentStatusIsPartial(paymentStatus) ? paidAmount : false),
        deliveryDate: deliveryDate,
        deliveryTime: deliveryTime,
        madeToOrder: madeToOrder,
        productMadeToOrder: madeToOrder,
        sobEncomenda: madeToOrder,
        productionLeadDays: productionLeadDays,
        productionLeadTimeDays: productionLeadDays,
        productionDeadlineDate: madeToOrder && productionLeadDays > 0 ? deliveryDate : '',
        productionDeadlineType: madeToOrder ? 'sob_encomenda' : '',
        orderTime: orderTime,
        saleTime: orderTime,
        createdTime: orderTime,
        analyticsTime: orderTime,
        analyticsHour: _timeHour(orderTime),
        orderHour: _timeHour(orderTime),
        slot: [deliveryDate, deliveryTime].filter(Boolean).join(' ').trim(),
        channel: channel,
        source: source,
        originChannel: channel,
        originSource: source,
        entradaCategoriaId: channelCategory.id,
        entradaCategoriaNome: channelCategory.name,
        incomeCategoryId: channelCategory.id,
        incomeCategoryName: channelCategory.name,
        categoriaEntradaId: channelCategory.id,
        categoriaEntradaNome: channelCategory.name,
        financialCategoryId: channelCategory.id,
        financialCategoryName: channelCategory.name,
        categoriaFinanceiraId: channelCategory.id,
        categoriaFinanceiraNome: channelCategory.name,
        kitchenQueue: showInKitchen,
        showInKitchen: showInKitchen,
        kitchenStatus: showInKitchen ? 'Pendente' : '',
        priceOrigin: hasPromo ? 'promo' : (_manualOrderState.channel === 'cardapio' ? 'automático' : 'manual'),
        manualAdjustment: channel !== 'cardapio' || adjustment !== 0,
        createdAt: _manualOrderCreatedAt(orderTime)
      };
      Object.assign(payload, _orderChannelFinancialPatch(payload, total));
      payload.fiscal = _ensureOrderFiscalDefaults(payload).fiscal;

      DB.add('orders', payload).then(function (ref) {
        var createdId = (ref && ref.id) ? String(ref.id) : '';
        if (createdId) payload.id = createdId;
        return _syncOrderFinanceMovement(createdId || '', payload);
      }).then(function () {
        UI.toast('Pedido criado!', 'success');
        if (window._newOrderModal) window._newOrderModal.close();
      }).catch(function (err) {
        UI.toast('Erro: ' + (err && err.message ? err.message : 'falha ao salvar'), 'error');
      });
      });
    };

    if (_manualOrderState.channel === 'cardapio' && hasPromo && Math.abs(adjustment) > 0) {
      UI.confirm('Há promoções automáticas e ajuste manual no pedido. Deseja continuar?').then(function (yes) {
        if (!yes) return;
        saveOrder();
      });
      return;
    }
    saveOrder();
  }

  function _orderContext() {
    var route = String((window.Router && typeof Router.current === 'function' && Router.current()) || location.hash.replace(/^#/, '') || '').toLowerCase();
    if (route.indexOf('venda-presencial') === 0 || route.indexOf('tpv') === 0) {
      return { channel: 'TPV', source: 'TPV', type: 'pickup', paymentStatus: 'pago' };
    }
    if (route.indexOf('pedidos/cozinha') === 0 || route.indexOf('pedidos/lista') === 0) {
      return { channel: 'cardapio', source: 'cardapio' };
    }
    if (route.indexOf('marketing') === 0) {
      return { channel: 'cardapio', source: 'cardapio' };
    }
    if (route.indexOf('whatsapp') >= 0) return { channel: 'whatsapp', source: 'whatsapp' };
    if (route.indexOf('marketplace') >= 0) return { channel: 'marketplace', source: 'marketplace' };
    if (route.indexOf('balcao') >= 0 || route.indexOf('telefone') >= 0) return { channel: 'balcao', source: 'balcao' };
    return { channel: 'manual', source: 'manual' };
  }

  function _manualOrderReset(context) {
    context = context || _orderContext();
    _manualOrderState.customerQuery = '';
    _manualOrderState.productQuery = '';
    _manualOrderState.items = [];
    _manualOrderState.selectedCustomerId = '';
    _manualOrderState.customerId = '';
    _manualOrderState.customerName = '';
    _manualOrderState.customerPhone = '';
    _manualOrderState.customerEmail = '';
    _manualOrderState.customerAddress = '';
    _manualOrderState.customerAddressNumber = '';
    _manualOrderState.customerAddressComplement = '';
    _manualOrderState.customerNeighborhood = '';
    _manualOrderState.customerCity = '';
    _manualOrderState.customerProvince = '';
    _manualOrderState.customerCountry = '';
    _manualOrderState.customerPostalCode = '';
    _manualOrderState.customerZone = '';
    _manualOrderState.selectedDeliveryAddressId = '';
    _manualOrderState.customerPreferences = '';
    _manualOrderState.customerNotes = '';
    _manualOrderState.type = context.type || 'delivery';
    _manualOrderState.channel = context.channel || 'manual';
    _manualOrderState.source = context.source || 'manual';
    _manualOrderState.paymentMethod = '';
    _manualOrderState.paymentStatus = context.paymentStatus || 'previsto';
    _manualOrderState.paidAmount = 0;
    _manualOrderState.orderTime = _currentTimeValue();
    _manualOrderState.deliveryDate = '';
    _manualOrderState.deliveryTime = '';
    _manualOrderState.madeToOrder = false;
    _manualOrderState.productionLeadDays = 0;
    _manualOrderState.productFilter = 'all';
    _manualOrderState.productCategory = '';
    _manualOrderState.adjustment = 0;
    _manualOrderState.shippingFee = 0;
    _manualOrderState.priceOrigin = _manualOrderState.channel === 'cardapio' ? 'automático' : 'manual';
  }

  function _manualOrderSelectedCustomer() {
    var id = String(_manualOrderState.selectedCustomerId || _manualOrderState.customerId || '').trim();
    if (id) {
      var byId = _findCustomerByRecordId(id);
      if (byId) return byId;
    }
    var phone = _phone(_manualOrderState.customerPhone || '');
    if (phone) {
      var byPhone = (_customers || []).find(function (c) { return _phone(c.phone || c.whatsapp || '') === phone; });
      if (byPhone) return byPhone;
    }
    var email = _clean(_manualOrderState.customerEmail || '');
    if (email) {
      var byEmail = (_customers || []).find(function (c) { return _clean(c.email || '') === email; });
      if (byEmail) return byEmail;
    }
    return null;
  }

  function _manualOrderCustomerAddresses(customer) {
    if (!customer) return [];
    var list = [];
    var source = Array.isArray(customer.deliveryAddresses) ? customer.deliveryAddresses : (Array.isArray(customer.savedDeliveryAddresses) ? customer.savedDeliveryAddresses : (Array.isArray(customer.addresses) ? customer.addresses : []));
    source.forEach(function (addr, index) {
      if (!addr) return;
      var address = _firstText(addr.address, addr.street, addr.streetAddress, addr.route, addr.addressLine, addr.line1, addr.formattedAddress, addr.fullAddress, addr.endereco, '');
      var postalCode = _firstText(addr.postalCode, addr.zip, addr.codigoPostal, addr.postcode, '');
      var neighborhood = _firstText(addr.neighborhood, addr.zone, addr.bairro, addr.area, addr.district, '');
      if (!(address || postalCode || neighborhood)) return;
      list.push({
        id: String(addr.id || addr.key || ('addr-' + index)),
        label: _firstText(addr.label, addr.name, addr.nome, index === 0 ? 'Endereço principal' : ('Endereço ' + (index + 1))),
        address: address,
        number: _firstText(addr.number, addr.numero, addr.portal, addr.addressNumber, ''),
        complement: _firstText(addr.complement, addr.piso, addr.floor, addr.reference, addr.addressComplement, ''),
        neighborhood: neighborhood,
        city: _firstText(addr.city, addr.locality, addr.cidade, ''),
        province: _firstText(addr.province, addr.state, addr.estado, addr.region, ''),
        country: _firstText(addr.country, addr.countryCode, addr.pais, ''),
        postalCode: postalCode
      });
    });
    if (!list.length) {
      var legacyAddress = _firstText(customer.address, customer.streetAddress, customer.fullAddress, customer.street, customer.addressLine, customer.formattedAddress, customer.endereco, '');
      var legacyPostal = _firstText(customer.postalCode, customer.zip, customer.codigoPostal, customer.postcode, '');
      var legacyZone = _firstText(customer.neighborhood, customer.zone, customer.bairro, customer.area, customer.district, '');
      if (legacyAddress || legacyPostal || legacyZone) {
        list.push({
          id: 'legacy',
          label: 'Endereço principal',
          address: legacyAddress,
          number: _firstText(customer.number, customer.numero, ''),
          complement: _firstText(customer.complement, customer.reference, customer.piso, ''),
          neighborhood: legacyZone,
          city: _firstText(customer.city, customer.cidade, ''),
          province: _firstText(customer.province, customer.state, customer.estado, ''),
          country: _firstText(customer.country, customer.pais, ''),
          postalCode: legacyPostal
        });
      }
    }
    return list;
  }

  function _manualOrderAddressLabel(addr) {
    if (!addr) return '';
    return [addr.label, [addr.address, addr.number].filter(Boolean).join(' '), addr.neighborhood, addr.postalCode].filter(Boolean).join(' · ');
  }

  function _manualOrderApplyPlace(prefix, data, syncState) {
    data = data || {};
    var values = {
      number: data.number || '',
      neighborhood: data.neighborhood || '',
      city: data.city || '',
      province: data.province || '',
      country: data.country || data.countryCode || '',
      postalCode: data.postalCode || ''
    };
    var ids = {
      number: prefix + 'number',
      neighborhood: prefix + 'neighborhood',
      city: prefix + 'city',
      province: prefix + 'province',
      country: prefix + 'country',
      postalCode: prefix + 'postal-code'
    };
    Object.keys(ids).forEach(function (key) {
      var el = document.getElementById(ids[key]);
      if (el && values[key]) {
        el.value = values[key];
        try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
      }
    });
    if (syncState) {
      if (values.number) _manualOrderState.customerAddressNumber = values.number;
      if (values.neighborhood) {
        _manualOrderState.customerNeighborhood = values.neighborhood;
        _manualOrderState.customerZone = values.neighborhood;
      }
      if (values.city) _manualOrderState.customerCity = values.city;
      if (values.province) _manualOrderState.customerProvince = values.province;
      if (values.country) _manualOrderState.customerCountry = values.country;
      if (values.postalCode) _manualOrderState.customerPostalCode = values.postalCode;
      _manualOrderMaybeSyncShipping();
      _manualOrderRefreshSummary();
    }
  }

  function _manualOrderField(field, value) {
    if (!field) return;
    _manualOrderState[field] = value;
    if (field === 'customerName' || field === 'customerPhone' || field === 'customerEmail' || field === 'customerAddress' || field === 'customerAddressNumber' || field === 'customerAddressComplement' || field === 'customerNeighborhood' || field === 'customerCity' || field === 'customerProvince' || field === 'customerCountry' || field === 'customerPostalCode' || field === 'customerZone') {
      _manualOrderState.selectedCustomerId = '';
      _manualOrderState.customerId = '';
      var map = { customerName: 'mo-name', customerPhone: 'mo-phone-number', customerEmail: 'mo-email', customerAddress: 'mo-address', customerAddressNumber: 'mo-address-number', customerAddressComplement: 'mo-address-complement', customerNeighborhood: 'mo-neighborhood', customerCity: 'mo-city', customerProvince: 'mo-province', customerCountry: 'mo-country', customerPostalCode: 'mo-postal-code', customerZone: 'mo-neighborhood' };
      var el = document.getElementById(map[field]);
      if (el && el.value !== String(value == null ? '' : value)) el.value = value == null ? '' : value;
    }
    if (field === 'customerZone' || field === 'customerPostalCode' || field === 'customerNeighborhood') _manualOrderMaybeSyncShipping();
    _manualOrderRefresh();
  }

  function _manualOrderSearchCustomers(value) {
    _manualOrderState.customerQuery = String(value == null ? '' : value);
    _manualOrderCustomerListOpen = true;
    _manualOrderRefreshCustomers();
  }

  function _manualOrderFocusCustomers() {
    _manualOrderCustomerListOpen = true;
    _manualOrderRefreshCustomers();
  }

  function _manualOrderChooseCustomer(id) {
    _manualOrderCustomerListOpen = false;
    _manualOrderState.customerQuery = '';
    _manualOrderSelectCustomer(id);
    var search = document.getElementById('mo-customer-search');
    if (search) search.value = '';
  }

  function _manualOrderSyncPhoneFromParts(prefixId, phoneId, targetField) {
    var prefix = String((document.getElementById(prefixId) || {}).value || '').trim();
    var number = String((document.getElementById(phoneId) || {}).value || '').trim();
    var full = _manualPhoneFull(prefix, number);
    if (targetField === 'quick') return full;
    _manualOrderField(targetField || 'customerPhone', full);
  }

  function _manualPhoneFull(prefix, number) {
    var p = String(prefix || '').trim();
    var n = String(number || '').trim();
    if (!_phone(n)) return '';
    return [p, n].filter(Boolean).join(' ').trim();
  }

  function _manualOrderPhoneParts(value) {
    var raw = String(value || '').trim();
    var match = raw.match(/^(\+\d{1,4})\s*(.*)$/);
    return {
      prefix: match ? match[1] : '+34',
      number: match ? String(match[2] || '').trim() : raw.replace(/^\+/, '')
    };
  }

  function _manualOrderPhonePrefixOptions(selected) {
    var current = String(selected || '+34');
    var labels = {
      '+34': '🇪🇸 +34',
      '+351': '🇵🇹 +351',
      '+55': '🇧🇷 +55',
      '+33': '🇫🇷 +33',
      '+39': '🇮🇹 +39'
    };
    var options = ['+34', '+351', '+55', '+33', '+39'];
    if (options.indexOf(current) < 0) options.unshift(current);
    return options.map(function (value) {
      return '<option value="' + _esc(value) + '"' + (value === current ? ' selected' : '') + '>' + _esc(labels[value] || value) + '</option>';
    }).join('');
  }

  function _manualOrderSearchItems(value) {
    _manualOrderState.productQuery = String(value == null ? '' : value);
    _manualOrderRefreshProducts();
  }

  function _manualOrderSetType(value) {
    _manualOrderState.type = String(value || 'delivery');
    if (_manualOrderState.type !== 'delivery') _manualOrderState.shippingFee = 0;
    _manualOrderSyncTypeUI();
    _manualOrderMaybeSyncShipping();
    _manualOrderRefresh();
  }

  function _manualOrderSetDeliveryAddress(id) {
    var value = String(id || '');
    _manualOrderState.selectedDeliveryAddressId = value;
    if (!value || value === 'new') {
      if (value === 'new') {
        _manualOrderState.customerAddress = '';
        _manualOrderState.customerAddressNumber = '';
        _manualOrderState.customerAddressComplement = '';
        _manualOrderState.customerNeighborhood = '';
        _manualOrderState.customerCity = '';
        _manualOrderState.customerProvince = '';
        _manualOrderState.customerCountry = '';
        _manualOrderState.customerPostalCode = '';
        _manualOrderState.customerZone = '';
        _manualOrderState.shippingFee = 0;
      }
      _manualOrderRefresh();
      _manualOrderSyncAddressFields();
      setTimeout(function () {
        if (window.BocaPlaces) {
          BocaPlaces.init('mo-address', { onPlace: function (data) { _manualOrderApplyPlace('mo-', data, true); } });
        }
      }, 80);
      return;
    }
    var customer = _manualOrderSelectedCustomer();
    var addr = _manualOrderCustomerAddresses(customer).find(function (item) { return String(item.id || '') === value; });
    if (!addr) return;
    _manualOrderState.customerAddress = addr.address || '';
    _manualOrderState.customerAddressNumber = addr.number || '';
    _manualOrderState.customerAddressComplement = addr.complement || '';
    _manualOrderState.customerNeighborhood = addr.neighborhood || '';
    _manualOrderState.customerCity = addr.city || '';
    _manualOrderState.customerProvince = addr.province || '';
    _manualOrderState.customerCountry = addr.country || '';
    _manualOrderState.customerPostalCode = addr.postalCode || '';
    _manualOrderState.customerZone = addr.neighborhood || addr.postalCode || '';
    _manualOrderMaybeSyncShipping();
    _manualOrderRefresh();
    _manualOrderSyncAddressFields();
  }

  function _manualOrderSyncAddressFields() {
    var fields = {
      'mo-address': _manualOrderState.customerAddress,
      'mo-address-number': _manualOrderState.customerAddressNumber,
      'mo-address-complement': _manualOrderState.customerAddressComplement,
      'mo-neighborhood': _manualOrderState.customerNeighborhood,
      'mo-city': _manualOrderState.customerCity,
      'mo-province': _manualOrderState.customerProvince,
      'mo-country': _manualOrderState.customerCountry,
      'mo-postal-code': _manualOrderState.customerPostalCode
    };
    Object.keys(fields).forEach(function (key) {
      var el = document.getElementById(key);
      if (el) el.value = fields[key] || '';
    });
    var feeEl = document.getElementById('mo-shipping');
    if (feeEl) feeEl.value = UI.fmt(_manualOrderState.shippingFee || 0);
    var feeInfo = document.getElementById('mo-shipping-info');
    if (feeInfo) feeInfo.textContent = '';
  }

  function _manualOrderSetAdjustment(value) {
    _manualOrderState.adjustment = _num(value);
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetShippingFee(value) {
    _manualOrderState.shippingFee = _num(value);
    var feeEl = document.getElementById('mo-shipping');
    if (feeEl) feeEl.value = UI.fmt(_manualOrderState.shippingFee || 0);
    var feeInfo = document.getElementById('mo-shipping-info');
    if (feeInfo) feeInfo.textContent = '';
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetPaymentMethod(value) {
    _manualOrderState.paymentMethod = String(value || '');
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetChannel(value) {
    var raw = String(value || 'manual').trim() || 'manual';
    _manualOrderState.channel = raw;
    _manualOrderState.source = _manualOrderChannelSource(raw);
    _manualOrderState.priceOrigin = _fold(raw) === 'cardapio' ? 'automático' : 'manual';
    _manualOrderRefreshProducts();
    _manualOrderRefreshSelected();
    _manualOrderRefreshSummary();
    _manualOrderSyncInheritedPills();
  }

  function _manualOrderSetPaymentStatus(value) {
    _manualOrderState.paymentStatus = String(value || 'previsto');
    if (_paymentStatusIsPaid(_manualOrderState.paymentStatus)) {
      _manualOrderState.paidAmount = _manualOrderTotals().total || 0;
    } else if (!_paymentStatusIsPartial(_manualOrderState.paymentStatus)) {
      _manualOrderState.paidAmount = 0;
    }
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetPaidAmount(value) {
    _manualOrderState.paidAmount = _num(value);
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetDeliveryDate(value) {
    _manualOrderState.deliveryDate = String(value || '');
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetDeliveryTime(value) {
    _manualOrderState.deliveryTime = String(value || '');
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetMadeToOrder(value) {
    _manualOrderState.madeToOrder = value === true || value === 'true';
    if (!_manualOrderState.madeToOrder) _manualOrderState.productionLeadDays = 0;
    _manualOrderSyncMadeToOrderUI();
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetProductionLeadDays(value) {
    _manualOrderState.productionLeadDays = Math.max(0, Math.floor(_num(value)));
    _manualOrderSyncMadeToOrderUI();
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetOrderTime(value) {
    _manualOrderState.orderTime = _normalizeTimeValue(value || _currentTimeValue());
    var el = document.getElementById('mo-order-time');
    if (el && el.value !== _manualOrderState.orderTime) el.value = _manualOrderState.orderTime;
    _manualOrderRefreshSummary();
  }

  function _manualOrderSetProductFilter(value) {
    _manualOrderState.productFilter = String(value || 'all');
    if (_manualOrderState.productFilter !== 'category') _manualOrderState.productCategory = '';
    _manualOrderRefreshProducts();
  }

  function _manualOrderSetCategoryFilter(value) {
    _manualOrderState.productCategory = String(value || '');
    _manualOrderRefreshProducts();
  }

  function _manualOrderMaybeSyncShipping() {
    if ((_manualOrderState.type || 'delivery') !== 'delivery') return;
    var zone = _manualOrderZoneForText(_manualOrderState.customerPostalCode || _manualOrderState.customerNeighborhood || _manualOrderState.customerZone || _manualOrderState.customerAddress || '');
    if (!zone) {
      _manualOrderState.shippingFee = 0;
      var emptyFeeEl = document.getElementById('mo-shipping');
      if (emptyFeeEl) emptyFeeEl.value = UI.fmt(0);
      var emptyInfo = document.getElementById('mo-shipping-info');
      if (emptyInfo) emptyInfo.textContent = '';
      return;
    }
    _manualOrderState.shippingFee = _num(zone.fee);
    var feeEl = document.getElementById('mo-shipping');
    if (feeEl) feeEl.value = UI.fmt(_manualOrderState.shippingFee || 0);
    var feeInfo = document.getElementById('mo-shipping-info');
    if (feeInfo) feeInfo.textContent = '';
  }

  function _manualOrderSelectCustomer(id) {
    var customer = _findCustomerByRecordId(id);
    if (!customer) return;
    var cid = _customerRecordId(customer);
    _manualOrderState.selectedCustomerId = cid;
    _manualOrderState.customerId = cid;
    _manualOrderState.customerName = _firstText(customer.name, customer.customerName, customer.fullName, customer.nome) || '';
    _manualOrderState.customerPhone = _firstText(customer.phone, customer.whatsapp, customer.mobile) || '';
    _manualOrderState.customerEmail = _firstText(customer.email, customer.mail) || '';
    var addresses = _manualOrderCustomerAddresses(customer);
    var primaryAddress = addresses[0] || {};
    _manualOrderState.selectedDeliveryAddressId = primaryAddress.id || '';
    _manualOrderState.customerAddress = _firstText(primaryAddress.address, customer.address, customer.fullAddress, customer.street, customer.endereco) || '';
    _manualOrderState.customerAddressNumber = _firstText(primaryAddress.number, customer.number, customer.numero, '') || '';
    _manualOrderState.customerAddressComplement = _firstText(primaryAddress.complement, customer.complement, customer.reference, '') || '';
    _manualOrderState.customerNeighborhood = _firstText(primaryAddress.neighborhood, customer.neighborhood, customer.zone, customer.bairro, customer.area) || '';
    _manualOrderState.customerCity = _firstText(primaryAddress.city, customer.city, customer.cidade, '') || '';
    _manualOrderState.customerProvince = _firstText(primaryAddress.province, customer.province, customer.state, customer.estado, '') || '';
    _manualOrderState.customerCountry = _firstText(primaryAddress.country, customer.country, customer.pais, '') || '';
    _manualOrderState.customerPostalCode = _firstText(primaryAddress.postalCode, customer.postalCode, customer.zip, customer.codigoPostal, '') || '';
    _manualOrderState.customerZone = _manualOrderState.customerNeighborhood || _manualOrderState.customerPostalCode;
    _manualOrderState.customerPreferences = _firstText(customer.preferences, customer.preference, customer.notes, customer.notesDelivery) || '';
    _manualOrderState.customerNotes = _firstText(customer.notes, customer.obs, customer.observations) || '';
    var fields = {
      'mo-name': _manualOrderState.customerName,
      'mo-email': _manualOrderState.customerEmail,
      'mo-address': _manualOrderState.customerAddress,
      'mo-address-number': _manualOrderState.customerAddressNumber,
      'mo-address-complement': _manualOrderState.customerAddressComplement,
      'mo-neighborhood': _manualOrderState.customerNeighborhood,
      'mo-city': _manualOrderState.customerCity,
      'mo-province': _manualOrderState.customerProvince,
      'mo-country': _manualOrderState.customerCountry,
      'mo-postal-code': _manualOrderState.customerPostalCode
    };
    Object.keys(fields).forEach(function (key) {
      var el = document.getElementById(key);
      if (el) el.value = fields[key] || '';
    });
    var noteEl = document.getElementById('mo-note');
    if (noteEl && !String(noteEl.value || '').trim() && _manualOrderState.customerNotes) {
      noteEl.value = _manualOrderState.customerNotes;
    }
    var phoneParts = _manualOrderPhoneParts(_manualOrderState.customerPhone);
    var phonePrefix = document.getElementById('mo-phone-prefix');
    var phoneNumber = document.getElementById('mo-phone-number');
    if (phonePrefix) phonePrefix.value = phoneParts.prefix;
    if (phoneNumber) phoneNumber.value = phoneParts.number;
    _manualOrderMaybeSyncShipping();
    _manualOrderRefresh();
  }

  function _manualOrderAddProduct(id) {
    var product = (_products || []).find(function (p) { return String(p.id || '') === String(id || ''); });
    if (!product) return;
    if (_detailProductChoiceGroups(product).length) {
      _openManualOrderChoicesModal(id);
      return;
    }
    _manualOrderAddConfiguredProduct(product, []);
  }

  function _manualOrderChoiceKey(productId, choices) {
    var choiceKey = (Array.isArray(choices) ? choices : []).map(function (choice) {
      return [_firstText(choice.groupId, choice.group, ''), _firstText(choice.optionId, choice.ref, choice.option, choice.label, '')].join(':');
    }).sort().join('|');
    return String(productId || '') + '::' + choiceKey;
  }

  function _manualOrderAddConfiguredProduct(product, choices) {
    choices = Array.isArray(choices) ? choices : [];
    var id = String(product && product.id || '');
    if (!id) return;
    var itemKey = _manualOrderChoiceKey(id, choices);
    var idx = _manualOrderState.items.findIndex(function (it) { return String(it.itemKey || it.productId || '') === itemKey; });
    if (idx >= 0) {
      _manualOrderState.items[idx].quantity += 1;
    } else {
      var calc = _manualOrderBestPromoForProduct(product);
      var basePrice = _manualOrderProductBasePrice(product);
      var finalBasePrice = calc && calc.calc && calc.calc.final != null ? _num(calc.calc.final) : basePrice;
      var extra = _detailChoiceExtraTotal(choices);
      _manualOrderState.items.push({
        itemKey: itemKey,
        productId: id,
        name: _firstText(product.name, product.title, product.nome, 'Produto'),
        category: _firstText(product.category, product.categoria, ''),
        quantity: 1,
        choiceExtraTotal: extra,
        basePrice: basePrice,
        originalPrice: basePrice + extra,
        finalPrice: finalBasePrice + extra,
        price: finalBasePrice + extra,
        unitPrice: finalBasePrice + extra,
        choices: choices,
        selectedOptions: choices,
        variants: choices,
        options: choices,
        stockChoices: _manualOrderStockChoicesFromChoices(choices),
        internalNote: _firstText(product.internalNote, product.internalNotes, product.kitchenNote, ''),
        productInternalNote: _firstText(product.internalNote, product.internalNotes, product.kitchenNote, ''),
        promoId: calc && calc.promo ? String(calc.promo.id || calc.promo._id || calc.promo.slug || '') : '',
        promoName: calc && calc.promo ? _firstText(calc.promo.name, calc.promo.title, 'Promoção') : '',
        promoType: calc && calc.promo ? String(calc.promo.type || '') : '',
        priceOrigin: calc ? (calc.promo ? 'promo' : 'automático') : (_manualOrderState.channel === 'cardapio' ? 'automático' : 'manual'),
        manualAdjustment: 0
      });
    }
    _manualOrderRefresh();
  }

  function _manualOrderStockChoicesFromChoices(choices) {
    return (Array.isArray(choices) ? choices : []).filter(function (choice) {
      return choice && (_firstText(choice.stockRef, choice.stockItemRef, '') || _firstText(choice.stockItemId, choice.itemId, ''));
    }).map(function (choice) {
      var perChoice = _num(choice.stockQuantityPerChoice != null ? choice.stockQuantityPerChoice : choice.stockQuantity != null ? choice.stockQuantity : choice.stockQty);
      if (perChoice <= 0) perChoice = 1;
      return Object.assign({}, choice, {
        quantity: _num(choice.quantity || choice.qty || 1) || 1,
        stockQuantityPerChoice: perChoice,
        stockQuantityTotal: perChoice,
        stockAbsoluteQuantity: perChoice
      });
    });
  }

  function _openManualOrderChoicesModal(id) {
    var product = (_products || []).find(function (p) { return String(p.id || '') === String(id || ''); });
    if (!product) return;
    var groups = _detailProductChoiceGroups(product);
    if (!groups.length) {
      _manualOrderAddConfiguredProduct(product, []);
      return;
    }
    var body = '<style>' +
      '.manual-choice-editor{display:grid;gap:12px;font-family:Manrope,Inter,sans-serif;}' +
      '.manual-choice-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:14px;box-shadow:0 10px 22px rgba(31,31,31,.045);}' +
      '.manual-choice-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;}' +
      '.manual-choice-title{font-size:13px;font-weight:760;color:#1F1F1F;line-height:1.25;}' +
      '.manual-choice-help{font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;}' +
      '.manual-choice-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;}' +
      '.manual-choice-option{min-width:0;display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #EADFD8;border-radius:12px;background:#FFFCF8;cursor:pointer;box-sizing:border-box;}' +
      '.manual-choice-option input{width:16px;height:16px;accent-color:#B42318;flex:0 0 auto;}' +
      '.manual-choice-thumb{width:34px;height:34px;border-radius:9px;object-fit:cover;flex:0 0 auto;background:#F7F1EE;}' +
      '.manual-choice-option-name{font-size:12px;color:#1F1F1F;line-height:1.25;}' +
      '.manual-choice-option-price{font-size:11px;color:#6F6860;line-height:1.25;margin-top:2px;}' +
      '@media(max-width:720px){.manual-choice-options{grid-template-columns:1fr;}}' +
    '</style>' +
    '<div class="manual-choice-editor">' +
      '<div class="manual-choice-card"><div class="manual-choice-head"><span class="mi" style="font-size:18px;color:#8A7E7C;">tune</span><div><div class="manual-choice-title">' + _esc(_firstText(product.name, product.title, product.nome, 'Produto')) + '</div><div class="manual-choice-help">Escolha as opções antes de adicionar ao pedido manual.</div></div></div></div>' +
      groups.map(function (group, groupIdx) {
        var inputType = group.max === 1 ? 'radio' : 'checkbox';
        var rule = group.min > 0 ? ('Escolha ' + group.min + (group.max !== group.min ? ' a ' + group.max : '') + '.') : ('Escolha até ' + group.max + '.');
        return '<div class="manual-choice-card" data-manual-choice-group="' + groupIdx + '" data-min="' + _esc(String(group.min)) + '" data-max="' + _esc(String(group.max)) + '">' +
          '<div class="manual-choice-head"><span class="mi" style="font-size:18px;color:#8A7E7C;">radio_button_checked</span><div><div class="manual-choice-title">' + _esc(group.title) + '</div><div class="manual-choice-help">' + _esc(rule) + '</div></div></div>' +
          '<div class="manual-choice-options">' +
            group.options.map(function (option, optionIdx) {
              return '<label class="manual-choice-option">' +
                '<input type="' + inputType + '" name="manual-choice-' + groupIdx + '" data-manual-group-index="' + groupIdx + '" data-manual-option-index="' + optionIdx + '" onchange="Modules.Pedidos._manualOrderSyncChoiceGroup(' + groupIdx + ')">' +
                (option.img ? '<img class="manual-choice-thumb" src="' + _esc(option.img) + '" alt="">' : '') +
                '<span style="min-width:0;"><span class="manual-choice-option-name">' + _esc(option.label) + '</span>' +
                (option.priceExtra ? '<span class="manual-choice-option-price">' + (option.priceExtra > 0 ? '+' : '') + UI.fmt(option.priceExtra) + '</span>' : '') +
                '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
    window._manualOrderChoicesState = { productId: String(id || ''), groups: groups };
    window._manualOrderChoicesModal = UI.modal({
      title: 'Opções do produto',
      body: body,
      footer: '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;"><button type="button" onclick="Modules.Pedidos._closeManualOrderChoicesModal()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button><button type="button" onclick="Modules.Pedidos._saveManualOrderChoices()" style="height:40px;padding:0 16px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Adicionar ao pedido</button></div>',
      maxWidth: '760px'
    });
    if (window._manualOrderChoicesModal && window._manualOrderChoicesModal.el) window._manualOrderChoicesModal.el.style.zIndex = '9200';
  }

  function _manualOrderSyncChoiceGroup(index) {
    var group = document.querySelector('[data-manual-choice-group="' + index + '"]');
    if (!group) return;
    var max = parseInt(group.getAttribute('data-max'), 10) || 1;
    if (max <= 1) return;
    var checked = Array.prototype.slice.call(group.querySelectorAll('input:checked'));
    if (checked.length <= max) return;
    checked[checked.length - 1].checked = false;
    UI.toast('Escolha no máximo ' + max + ' opção(ões).', 'warning');
  }

  function _saveManualOrderChoices() {
    var state = window._manualOrderChoicesState || {};
    var product = (_products || []).find(function (p) { return String(p.id || '') === String(state.productId || ''); });
    if (!product) return;
    var choices = [];
    var invalid = '';
    (state.groups || []).forEach(function (group, groupIdx) {
      if (invalid) return;
      var checked = Array.prototype.slice.call(document.querySelectorAll('input[data-manual-group-index="' + groupIdx + '"]:checked'));
      if (checked.length < group.min) invalid = 'Complete "' + group.title + '" antes de adicionar.';
      if (!invalid && checked.length > group.max) invalid = 'Em "' + group.title + '", escolha no máximo ' + group.max + '.';
      checked.forEach(function (input) {
        var option = group.options[parseInt(input.getAttribute('data-manual-option-index'), 10)] || {};
        choices.push({
          groupId: group.id,
          group: group.title,
          groupName: group.title,
          optionId: option.id,
          ref: option.ref || '',
          option: option.label,
          optionName: option.label,
          label: option.label,
          name: option.label,
          value: option.label,
          priceExtra: _num(option.priceExtra),
          price: _num(option.priceExtra),
          img: option.img || '',
          stockRef: option.stockRef || '',
          stockItemId: option.stockItemId || '',
          stockItemName: option.stockItemName || '',
          stockItemType: option.stockItemType || '',
          itemClass: option.itemClass || option.stockItemType || '',
          classe: option.classe || option.stockItemType || '',
          stockQuantityPerChoice: _num(option.stockQuantityPerChoice || option.stockQuantity),
          stockQuantity: _num(option.stockQuantity || option.stockQuantityPerChoice),
          stockUnit: option.stockUnit || option.unit || '',
          stockUnitCost: _num(option.stockUnitCost),
          qty: 1
        });
      });
    });
    if (invalid) {
      UI.toast(invalid, 'error');
      return;
    }
    _manualOrderAddConfiguredProduct(product, choices);
    _closeManualOrderChoicesModal();
  }

  function _closeManualOrderChoicesModal() {
    if (window._manualOrderChoicesModal && window._manualOrderChoicesModal.close) window._manualOrderChoicesModal.close();
    window._manualOrderChoicesModal = null;
    window._manualOrderChoicesState = null;
  }

  function _manualOrderChangeQty(id, delta) {
    var idx = _manualOrderState.items.findIndex(function (it) { return String(it.itemKey || it.productId || '') === String(id || ''); });
    if (idx < 0) return;
    _manualOrderState.items[idx].quantity = Math.max(1, (_manualOrderState.items[idx].quantity || 1) + (parseInt(delta, 10) || 0));
    _manualOrderRefresh();
  }

  function _manualOrderRemoveProduct(id) {
    _manualOrderState.items = _manualOrderState.items.filter(function (it) { return String(it.itemKey || it.productId || '') !== String(id || ''); });
    _manualOrderRefresh();
  }

  function _manualOrderRefresh() {
    _manualOrderSyncTypeUI();
    _manualOrderRefreshCustomers();
    _manualOrderRefreshProducts();
    _manualOrderRefreshSelected();
    _manualOrderRefreshSummary();
    _manualOrderSyncInheritedPills();
    _manualOrderSyncPaymentUI();
  }

  function _manualOrderRefreshCustomers() {
    var el = document.getElementById('mo-customer-results');
    if (el) {
      el.innerHTML = _manualOrderRenderCustomers();
    }
    var pill = document.getElementById('mo-customer-pill');
    if (pill) {
      pill.textContent = _manualOrderState.selectedCustomerId ? ('Cliente: ' + (_manualOrderState.customerName || 'Selecionado')) : 'Nenhum cliente selecionado';
      pill.style.background = _manualOrderState.selectedCustomerId ? '#EDFAF3' : '#F2EDED';
      pill.style.color = _manualOrderState.selectedCustomerId ? '#1A9E5A' : '#8A7E7C';
    }
    var addressSelect = document.getElementById('mo-delivery-address');
    if (addressSelect) {
      var current = String(addressSelect.value || '');
      addressSelect.innerHTML = _manualOrderDeliveryAddressOptions();
      if (current && Array.prototype.some.call(addressSelect.options, function (opt) { return opt.value === current; })) addressSelect.value = current;
    }
  }

  function _manualOrderRefreshProducts() {
    var el = document.getElementById('mo-product-results');
    if (!el) return;
    el.innerHTML = _manualOrderRenderProducts();
    var count = document.getElementById('mo-product-count');
    if (count) {
      var qty = (_manualOrderState.items || []).reduce(function (sum, item) { return sum + (item.quantity || 1); }, 0);
      count.textContent = qty > 0 ? (qty + ' itens no pedido') : '';
      count.style.display = qty > 0 ? 'inline-flex' : 'none';
    }
  }

  function _manualOrderRefreshSelected() {
    var el = document.getElementById('mo-selected-items');
    if (!el) return;
    el.innerHTML = _manualOrderRenderSelected();
  }

  function _manualOrderRefreshSummary() {
    var el = document.getElementById('mo-summary');
    if (el) el.innerHTML = _manualOrderRenderSummary();
    var totalEl = document.getElementById('mo-total-final');
    if (totalEl) totalEl.textContent = _manualOrderTotalLabel();
    var priceOrigin = document.getElementById('mo-price-origin');
    if (priceOrigin) {
      priceOrigin.textContent = 'Origem: ' + (_manualOrderState.priceOrigin || (_manualOrderState.channel === 'cardapio' ? 'automático' : 'manual'));
    }
    var adjNote = document.getElementById('mo-adjustment-note');
    if (adjNote) {
      adjNote.textContent = _num(_manualOrderState.adjustment || 0) !== 0 ? 'Este ajuste será registrado como alteração manual no pedido.' : '';
    }
    _manualOrderUpdateSubmitState();
    _manualOrderSyncMadeToOrderUI();
    _manualOrderSyncPaymentUI();
  }

  function _manualOrderMaxAdvanceDays() {
    var raw = _firstText(
      _operationConfig && _operationConfig.maxAdvanceDays,
      _operationConfig && _operationConfig.advanceDaysLimit,
      _operationConfig && _operationConfig.advanceDays,
      _templateConfig && _templateConfig.maxAdvanceDays,
      _templateConfig && _templateConfig.advanceDaysLimit,
      _templateConfig && _templateConfig.advanceDays,
      0
    );
    return Math.max(0, Math.floor(_num(raw)));
  }

  function _manualOrderProductionLeadHelp() {
    var max = _manualOrderMaxAdvanceDays();
    return max > 0
      ? 'Pode usar até ' + max + ' dia' + (max === 1 ? '' : 's') + ', conforme Prazos e capacidade.'
      : 'Operação permite apenas pedidos para hoje; ajuste Prazos e capacidade para usar encomenda.';
  }

  function _manualOrderLocalDate(value) {
    var parts = String(value || '').slice(0, 10).split('-').map(function (n) { return parseInt(n, 10); });
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function _manualOrderDaysUntil(dateValue) {
    var target = _manualOrderLocalDate(dateValue);
    if (!target) return null;
    var today = _manualOrderLocalDate(_today());
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }

  function _manualOrderSyncMadeToOrderUI() {
    var checkbox = document.getElementById('mo-made-to-order');
    var lead = document.getElementById('mo-production-lead-days');
    var help = document.getElementById('mo-production-lead-help');
    if (checkbox) checkbox.checked = !!_manualOrderState.madeToOrder;
    if (lead) {
      lead.disabled = !_manualOrderState.madeToOrder;
      if (String(lead.value || '') !== String(_manualOrderState.productionLeadDays || '')) lead.value = _manualOrderState.productionLeadDays || '';
    }
    if (help) help.textContent = _manualOrderProductionLeadHelp();
  }

  function _manualOrderSyncPaymentUI() {
    var method = document.getElementById('mo-payment-method');
    if (method && String(method.value || '') !== String(_manualOrderState.paymentMethod || '')) {
      method.value = String(_manualOrderState.paymentMethod || '');
    }
    var status = document.getElementById('mo-payment-status');
    if (status && String(status.value || '') !== String(_manualOrderState.paymentStatus || 'previsto')) {
      status.value = String(_manualOrderState.paymentStatus || 'previsto');
    }
    var box = document.getElementById('mo-paid-amount-box');
    if (box) box.style.display = _paymentStatusIsPartial(_manualOrderState.paymentStatus || 'previsto') ? 'block' : 'none';
    var paid = document.getElementById('mo-paid-amount');
    if (paid && String(paid.value || '') !== String(_manualOrderState.paidAmount || 0)) {
      paid.value = String(_manualOrderState.paidAmount || 0);
    }
  }

  function _manualOrderSyncInheritedPills() {
    var channel = document.getElementById('mo-header-channel');
    if (channel) channel.textContent = 'Canal de venda: ' + _manualOrderDisplayChannel(_manualOrderState.channel || 'manual');
    var channelField = document.getElementById('mo-channel');
    if (channelField && String(channelField.value || '') !== String(_manualOrderState.channel || 'manual')) {
      channelField.value = String(_manualOrderState.channel || 'manual');
    }
  }

  function _manualOrderSyncTypeUI() {
    var type = document.getElementById('mo-type');
    if (type && type.value !== (_manualOrderState.type || 'delivery')) type.value = _manualOrderState.type || 'delivery';
    var delivery = document.getElementById('mo-delivery-block');
    var pickup = document.getElementById('mo-pickup-block');
    var feeBlock = document.getElementById('mo-delivery-fee-block');
    if (delivery && pickup) {
      var isDelivery = (_manualOrderState.type || 'delivery') === 'delivery';
      delivery.style.display = 'grid';
      pickup.style.display = 'none';
      if (feeBlock) feeBlock.style.display = isDelivery ? 'block' : 'none';
      Array.prototype.slice.call(document.querySelectorAll('.mo-delivery-only')).forEach(function (node) {
        node.style.display = isDelivery ? '' : 'none';
      });
    }
    var shipping = document.getElementById('mo-shipping');
    if (shipping && (_manualOrderState.type || 'delivery') !== 'delivery') shipping.value = '0';
  }

  function _manualOrderZoneForText(text) {
    var t = _fold(text || '');
    if (!t) return null;
    var clean = String(text || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^0-9A-Z*:-]/g, '');
    var matched = (_zones || []).find(function (z) {
      var name = _fold(z.name || '');
      var zip = _fold(z.postalCode || z.zip || z.code || '');
      var codes = Array.isArray(z.postalCodes) ? z.postalCodes : [];
      var codeMatch = codes.some(function (entry) {
        var raw = String(entry || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^0-9A-Z*:-]/g, '');
        if (!raw || !clean) return false;
        var range = raw.split(/[:-]/);
        if (range.length === 2 && /^\d+$/.test(clean) && /^\d+$/.test(range[0]) && /^\d+$/.test(range[1])) {
          var number = Number(clean);
          return number >= Number(range[0]) && number <= Number(range[1]);
        }
        if (raw.indexOf('*') >= 0) return clean.indexOf(raw.replace(/\*/g, '')) === 0;
        if (/^\d+$/.test(raw) && raw.length < clean.length) return clean.indexOf(raw) === 0;
        return clean === raw || clean.indexOf(raw) === 0 || clean.replace(/[-:]/g, '') === raw.replace(/[-:]/g, '');
      });
      if (codeMatch) return true;
      return name === t || zip === t || name.indexOf(t) >= 0 || zip.indexOf(t) >= 0 || t.indexOf(name) >= 0;
    }) || null;
    if (matched) return matched;
    return (_zones || []).find(function (z) { return z.isDefault || !(Array.isArray(z.postalCodes) && z.postalCodes.length) && !z.postalCode; }) || ((_zones || []).length === 1 ? _zones[0] : null);
  }

  function _manualOrderPromoNormalizeType(type) {
    var t = _fold(type || '');
    if (t === 'pct' || t === 'percent' || t === 'percentual' || t === 'desconto_percentual') return 'pct';
    if (t === 'eur' || t === 'money' || t === 'valor' || t === 'desconto_valor') return 'eur';
    if (t === 'fixed' || t === 'preco_fixo' || t === 'fixed_price' || t === 'oferta_dia') return 'fixed';
    if (t === '2x1' || t === '2por1' || t === 'two_for_one' || t === 'b2x1') return 'add1';
    if (t === 'add1' || t === 'leve_mais' || t === 'combo_sugerido' || t === 'combo' || t === 'bundle_less_pay_more') return 'add1';
    if (t === 'frete' || t === 'frete_gratis') return 'frete';
    return 'pct';
  }

  function _manualOrderPromoNumber(value) {
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

  function _manualOrderPromoIsActive(promo) {
    if (!promo) return false;
    if (promo.active === false) return false;
    var status = _fold(promo.status || '');
    if (status === 'pausada' || status === 'pausado' || status === 'expirada' || status === 'expirado' || status === 'finalizada' || status === 'inativa') return false;
    var now = new Date();
    var startRaw = promo.startDate || promo.startsAt || promo.startsAtDate || promo.from || '';
    var endRaw = promo.endDate || promo.endsAt || promo.endsAtDate || promo.to || '';
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

  function _manualOrderPromoChannels(promo) {
    var channels = Array.isArray(promo && promo.channels) ? promo.channels.slice() : String(promo && (promo.channelsText || promo.channel || '')).split(',').map(function (s) { return String(s || '').trim(); }).filter(Boolean);
    return channels.map(function (s) { return _fold(s); }).filter(Boolean);
  }

  function _manualOrderPromoApplies(promo, product) {
    if (!_manualOrderPromoIsActive(promo) || !product) return false;
    var channel = _fold(_manualOrderState.channel || 'manual');
    var channels = _manualOrderPromoChannels(promo);
    if (channels.length && channels.indexOf(channel) < 0 && channels.indexOf('todos') < 0 && channels.indexOf('all') < 0 && channels.indexOf('template') < 0) {
      return false;
    }
    var productId = String(product.id || '');
    var ids = [];
    if (Array.isArray(promo.productIds)) ids = ids.concat(promo.productIds);
    if (Array.isArray(promo.productsSelected)) ids = ids.concat(promo.productsSelected);
    if (Array.isArray(promo.suggestedProductIds)) ids = ids.concat(promo.suggestedProductIds);
    ids = ids.map(String).filter(Boolean);
    if (promo.applyTo === 'all' || promo.scope === 'todos_produtos') return true;
    if (ids.indexOf(productId) >= 0) return true;
    if (promo.productId && String(promo.productId) === productId) return true;
    if (promo.suggestedProductId && String(promo.suggestedProductId) === productId) return true;
    return false;
  }

  function _manualOrderProductBasePrice(product) {
    return _num(_firstText(product && product.price, product && product.salePrice, product && product.valor, product && product.preco, product && product.precoVenda, 0));
  }

  function _manualOrderProductCost(product) {
    return _num(_firstText(product && product.cost, product && product.custo, product && product.purchasePrice, product && product.custoAtual, product && product.custo_atual, product && product.preco_compra, product && product.precoCompra, product && product.custoCompra, 0));
  }

  function _manualOrderPromoCalc(product, promo) {
    if (!product || !promo) return null;
    var original = _manualOrderProductBasePrice(product);
    if (!(original > 0)) return null;
    var type = _manualOrderPromoNormalizeType(promo.type || promo.tipo || promo.discountType || promo.benefitType || '');
    var value = _manualOrderPromoNumber(promo.valuePercentual != null ? promo.valuePercentual : (promo.discountPct != null ? promo.discountPct : (promo.valueDesconto != null ? promo.valueDesconto : (promo.value != null ? promo.value : 0))));
    var fixedPrice = _manualOrderPromoNumber(promo.fixedPrice != null ? promo.fixedPrice : (promo.finalPrice != null ? promo.finalPrice : (promo.offerPrice != null ? promo.offerPrice : promo.priceFixed)));
    var final = original;
    var legacyQtyPromo = /^(2x1|2por1|two_for_one|b2x1)$/i.test(String(promo.type || promo.tipo || promo.discountType || promo.benefitType || ''));
    var leve = parseInt(promo.leveQtd != null ? promo.leveQtd : (promo.bundleQty != null ? promo.bundleQty : (legacyQtyPromo ? 2 : 0)), 10) || 0;
    var pague = parseInt(promo.pagueQtd != null ? promo.pagueQtd : (promo.bundlePay != null ? promo.bundlePay : (legacyQtyPromo ? 1 : 0)), 10) || 0;
    if (type === 'pct') final = Math.max(original - (original * value / 100), 0);
    else if (type === 'eur') final = Math.max(original - value, 0);
    else if (type === 'fixed' && fixedPrice > 0) final = Math.max(Math.min(fixedPrice, original), 0);
    else if (type === 'add1' && leve > 0 && leve > pague) final = Math.max((original * pague) / leve, 0);
    else if (type === 'frete') final = original;
    var cost = _manualOrderProductCost(product);
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
      margin: cost > 0 && final > 0 ? ((final - cost) / final) * 100 : null,
      promo: promo
    };
  }

  function _manualOrderPromoMinOrder(promo) {
    return _num(promo && (promo.minOrder || promo.minimumOrder || promo.minCartValue || promo.minCart || promo.minValue || promo.orderMin || promo.valorMinimo || promo.minimumValue));
  }

  function _manualOrderPromoLineTotal(original, qty, calc) {
    original = _num(original);
    qty = Math.max(1, _num(qty || 1));
    if (!calc || !calc.calc) return original * qty;
    if (calc.calc.type === 'add1') {
      var leve = parseInt(calc.calc.leve || 0, 10) || 0;
      var pague = parseInt(calc.calc.pague || 0, 10) || 0;
      if (leve > 0 && pague > 0 && leve > pague) {
        var bundles = Math.floor(qty / leve);
        var remainder = qty % leve;
        return ((bundles * pague) + remainder) * original;
      }
    }
    return _num(calc.calc.final) * qty;
  }

  function _manualOrderLineTotal(original, qty, calc, item) {
    qty = Math.max(1, _num(qty || 1));
    if (!calc) return _num(item && item.finalPrice != null ? item.finalPrice : original) * qty;
    if (calc.calc && calc.calc.type === 'add1') return _manualOrderPromoLineTotal(original, qty, calc);
    return _num(item && item.finalPrice != null ? item.finalPrice : (calc.calc && calc.calc.final != null ? calc.calc.final : original)) * qty;
  }

  function _manualOrderBestPromoForProduct(product) {
    if (!product) return null;
    if (_manualOrderState.channel !== 'cardapio') return null;
    var candidates = [];
    if (product.promo && typeof product.promo === 'object') candidates.push(product.promo);
    (_promotions || []).forEach(function (promo) {
      if (_manualOrderPromoApplies(promo, product)) candidates.push(promo);
    });
    var best = null;
    candidates.forEach(function (promo) {
      var calc = _manualOrderPromoCalc(product, promo);
      if (!calc) return;
      var priority = _num(promo.priority || promo.order || 0);
      if (!best) {
        best = { promo: promo, calc: calc, priority: priority };
        return;
      }
      var bestPriority = best.priority || 0;
      var bestDiscount = best.calc.discount || 0;
      if (priority > bestPriority || (priority === bestPriority && calc.discount > bestDiscount)) {
        best = { promo: promo, calc: calc, priority: priority };
      }
    });
    return best ? { promo: best.promo, calc: best.calc } : null;
  }

  function _manualOrderCustomerMatches() {
    var q = _fold(_manualOrderState.customerQuery || '');
    var list = (_customers || []).slice().filter(function (c) {
      if (!q) return true;
      var text = [
        c.name, c.customerName, c.fullName, c.phone, c.whatsapp, c.email, c.zone, c.neighborhood, c.address, c.city, c.note
      ].map(_fold).join(' ');
      return text.indexOf(q) >= 0;
    });
    return list.sort(function (a, b) {
      var ao = _ordersForClient(a).length;
      var bo = _ordersForClient(b).length;
      if (bo !== ao) return bo - ao;
      return _title(a.name || '').localeCompare(_title(b.name || ''));
    }).slice(0, 8);
  }

  function _manualOrderProductMatches() {
    var q = _fold(_manualOrderState.productQuery || '');
    var list = (_products || []).slice().filter(function (p) {
      var filter = String(_manualOrderState.productFilter || 'all');
      if (filter === 'promo') {
        if (!(_manualOrderBestPromoForProduct(p) || p.promo)) return false;
      } else if (filter === 'popular') {
        if (!p.popular && !_fold(p.badgeText || '').includes('top')) return false;
      } else if (filter === 'category' && _manualOrderState.productCategory) {
        var pc = _fold(_firstText(p.category, p.categoria, ''));
        if (pc !== _fold(_manualOrderState.productCategory)) return false;
      }
      if (!q) return true;
      var text = [
        p.name, p.title, p.desc, p.shortDesc, p.fullDesc, p.category, p.categoria, p.microcopy, p.badgeText, p.tags
      ].map(function (v) { return Array.isArray(v) ? v.join(' ') : String(v == null ? '' : v); }).join(' ');
      return _fold(text).indexOf(q) >= 0;
    });
    return list.slice(0, 24);
  }

  function _manualOrderRenderCustomers() {
    if (!_manualOrderCustomerListOpen) return '';
    var list = _manualOrderCustomerMatches();
    var query = String(_manualOrderState.customerQuery || '').trim();
    if (!query) return '';
    if (!list.length) return '<div style="margin-top:8px;padding:10px 12px;border:1px dashed #E6DDDB;border-radius:12px;color:#8A7E7C;font-size:12px;background:#FCFBFB;">Nenhum cliente encontrado.</div>';
    return '<div style="margin-top:8px;border:1px solid #E8DCD7;border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 8px 18px rgba(31,31,31,.04);">' + list.map(function (c, index) {
      var name = c.name || c.customerName || c.fullName || 'Cliente';
      var phone = _firstText(c.phone, c.whatsapp, c.mobile, '');
      var email = _firstText(c.email, c.mail, '');
      var address = _firstText(c.address, c.neighborhood, c.zone, '');
      return '<button type="button" onclick="Modules.Pedidos._manualOrderChooseCustomer(\'' + _esc(_customerRecordId(c)) + '\')" style="width:100%;border:0;border-bottom:' + (index === list.length - 1 ? '0' : '1px solid #F0E8E3') + ';background:#fff;padding:10px 11px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;cursor:pointer;font-family:inherit;">' +
        '<span style="min-width:0;display:grid;gap:3px;">' +
          '<span style="font-size:13px;font-weight:650;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(name) + '</span>' +
          '<span style="font-size:11px;color:#8A7E7C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc([phone, email, address].filter(Boolean).join(' · ')) + '</span>' +
        '</span>' +
        '<span class="mi" style="font-size:18px;color:#B42318;">arrow_forward</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  function _manualOrderRenderProducts() {
    var list = _manualOrderProductMatches();
    var query = String(_manualOrderState.productQuery || '').trim();
    if (!query) return '';
    if (!list.length) return '<div style="margin-top:8px;padding:10px 12px;border:1px dashed #E6DDDB;border-radius:12px;color:#8A7E7C;font-size:12px;background:#FCFBFB;">Nenhum produto encontrado.</div>';
    var selectedMap = {};
    (_manualOrderState.items || []).forEach(function (item) {
      var productId = String(item.productId || '');
      if (!productId) return;
      selectedMap[productId] = (selectedMap[productId] || 0) + (item.quantity || 1);
    });
    var visible = list.slice(0, 12);
    return '<div style="margin-top:8px;border:1px solid #E8DCD7;border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 8px 18px rgba(31,31,31,.04);">' + visible.map(function (p, index) {
      var calc = _manualOrderBestPromoForProduct(p);
      var original = _manualOrderProductBasePrice(p);
      var final = calc ? calc.calc.final : original;
      var selectedQty = selectedMap[String(p.id || '')] || 0;
      var promoText = calc ? (calc.calc.type === 'pct' ? ('-' + Math.round(calc.calc.value) + '%') : calc.calc.type === 'eur' ? ('- ' + UI.fmt(calc.calc.value)) : calc.calc.type === 'add1' ? ('Leve ' + calc.calc.leve + ' pague ' + calc.calc.pague) : 'Oferta') : '';
      return '<button type="button" onclick="Modules.Pedidos._manualOrderAddProduct(\'' + _esc(String(p.id || '')) + '\')" style="width:100%;border:0;border-bottom:' + (index === visible.length - 1 ? '0' : '1px solid #F0E8E3') + ';background:#fff;padding:10px 11px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;cursor:pointer;font-family:inherit;">' +
        '<span style="min-width:0;display:grid;gap:3px;">' +
          '<span style="display:flex;align-items:center;gap:7px;min-width:0;">' +
            '<span style="font-size:13px;font-weight:650;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(p.name || p.title || 'Produto') + '</span>' +
            (selectedQty ? '<span style="font-size:10px;color:#B42318;background:#FFF0EE;border-radius:999px;padding:3px 7px;white-space:nowrap;">' + selectedQty + ' no pedido</span>' : '') +
          '</span>' +
          '<span style="font-size:11px;color:#8A7E7C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(_firstText(p.category, p.categoria, 'Sem categoria')) + (promoText ? ' · ' + _esc(promoText) : '') + '</span>' +
        '</span>' +
        '<span style="display:flex;align-items:center;gap:9px;justify-content:flex-end;white-space:nowrap;">' +
          (calc && calc.calc.discount > 0 ? '<span style="font-size:11px;color:#8A7E7C;text-decoration:line-through;">' + UI.fmt(original) + '</span>' : '') +
          '<span style="font-size:13px;font-weight:650;color:#1A1A1A;">' + UI.fmt(final) + '</span>' +
          '<span style="width:26px;height:26px;border-radius:9px;background:#B42318;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;">+</span>' +
        '</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  function _manualOrderAvailableCategories() {
    var seen = {};
    (_products || []).forEach(function (p) {
      var cat = _firstText(p.category, p.categoria, '');
      if (cat) seen[cat] = true;
    });
    return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });
  }

  function _manualOrderRenderSelected() {
    var items = _manualOrderState.items || [];
    if (!items.length) {
      return '<div style="padding:14px;border:1px dashed #E6DDDB;border-radius:12px;color:#8A7E7C;font-size:13px;background:#FCFBFB;">Nenhum item selecionado ainda.</div>';
    }
    var selectedOriginalSubtotal = items.reduce(function (sum, item) {
      var product = (_products || []).find(function (p) { return String(p.id || '') === String(item.productId || ''); }) || {};
      var original = _num(item.originalPrice != null ? item.originalPrice : (_manualOrderProductBasePrice(product) + _num(item.choiceExtraTotal || 0)));
      return sum + original * (item.quantity || 1);
    }, 0);
    return '<div style="display:flex;flex-direction:column;gap:8px;">' + items.map(function (item) {
      var product = (_products || []).find(function (p) { return String(p.id || '') === String(item.productId || ''); }) || {};
      var calc = _manualOrderState.channel === 'cardapio' ? _manualOrderBestPromoForProduct(product) : null;
      var original = _num(item.originalPrice != null ? item.originalPrice : (_manualOrderProductBasePrice(product) + _num(item.choiceExtraTotal || 0)));
      var minOrder = calc && calc.promo ? _manualOrderPromoMinOrder(calc.promo) : 0;
      var calcApplies = calc && (!minOrder || selectedOriginalSubtotal >= minOrder);
      var qty = item.quantity || 1;
      var lineTotal = calcApplies ? _manualOrderLineTotal(original, qty, calc, item) : (calc ? original * qty : _num(item.finalPrice || original) * qty);
      var final = lineTotal / Math.max(1, qty);
      var discount = Math.max((original * qty) - lineTotal, 0);
      var choiceText = _detailChoiceText(item.choices || item.selectedOptions || item.variants || item.options);
      var itemKey = String(item.itemKey || item.productId || '');
      return '<div style="border:1.5px solid #E6DDDB;border-radius:12px;padding:10px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;background:#fff;">' +
        '<div style="min-width:0;">' +
          '<div style="font-size:13px;font-weight:800;color:#1A1A1A;">' + _esc(item.name || 'Produto') + '</div>' +
          '<div style="font-size:11px;color:#8A7E7C;margin-top:3px;">' + _esc(_firstText(product.category, item.category, '')) + '</div>' +
          (choiceText ? '<div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(choiceText) + '</div>' : '') +
          (calcApplies ? '<div style="font-size:11px;font-weight:700;color:#C4362A;margin-top:4px;">' + _esc(calc.calc.type === 'pct' ? ('-' + Math.round(calc.calc.value) + '%') : calc.calc.type === 'eur' ? ('- ' + UI.fmt(calc.calc.value)) : calc.calc.type === 'add1' ? ('Leve ' + calc.calc.leve + ' pague ' + calc.calc.pague) : 'Oferta') + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right;min-width:110px;">' +
          '<div style="font-size:11px;color:#8A7E7C;">' + qty + 'x</div>' +
          '<div style="font-size:12px;color:#8A7E7C;text-decoration:line-through;">' + UI.fmt(original) + '</div>' +
          '<div style="font-size:14px;font-weight:900;color:#1A1A1A;">' + UI.fmt(final) + '</div>' +
          '<div style="font-size:11px;color:#8A7E7C;">Economia: ' + UI.fmt(discount * qty) + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
          '<button type="button" onclick="Modules.Pedidos._manualOrderChangeQty(\'' + _esc(itemKey) + '\',-1)" style="width:28px;height:28px;border-radius:8px;border:1px solid #D4C8C6;background:#fff;cursor:pointer;">−</button>' +
          '<button type="button" onclick="Modules.Pedidos._manualOrderChangeQty(\'' + _esc(itemKey) + '\',1)" style="width:28px;height:28px;border-radius:8px;border:none;background:#C4362A;color:#fff;cursor:pointer;font-weight:900;">+</button>' +
          '<button type="button" onclick="Modules.Pedidos._manualOrderRemoveProduct(\'' + _esc(itemKey) + '\')" style="width:28px;height:28px;border-radius:8px;border:none;background:#FFF0EE;color:#C4362A;cursor:pointer;">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _manualOrderTotals() {
    var items = _manualOrderState.items || [];
    var subtotalOriginal = 0;
    var subtotalFinal = 0;
    var promoDiscount = 0;
    var hasPromo = false;
    var prepared = items.map(function (item) {
      var product = (_products || []).find(function (p) { return String(p.id || '') === String(item.productId || ''); }) || {};
      var calc = _manualOrderState.channel === 'cardapio' ? _manualOrderBestPromoForProduct(product) : null;
      var original = _num(item.originalPrice != null ? item.originalPrice : (_manualOrderProductBasePrice(product) + _num(item.choiceExtraTotal || 0)));
      var qty = item.quantity || 1;
      subtotalOriginal += original * qty;
      return { item: item, calc: calc, original: original, qty: qty };
    });
    prepared.forEach(function (entry) {
      var minOrder = entry.calc && entry.calc.promo ? _manualOrderPromoMinOrder(entry.calc.promo) : 0;
      var calcApplies = entry.calc && (!minOrder || subtotalOriginal >= minOrder);
      var lineTotal = calcApplies ? _manualOrderLineTotal(entry.original, entry.qty, entry.calc, entry.item) : (entry.calc ? entry.original * entry.qty : _num(entry.item.finalPrice || entry.original) * entry.qty);
      var qty = entry.qty;
      subtotalFinal += lineTotal;
      promoDiscount += Math.max((entry.original * qty) - lineTotal, 0);
      if (calcApplies && entry.calc.calc.discount > 0) hasPromo = true;
    });
    var shippingFee = (_manualOrderState.type || 'delivery') === 'delivery' ? _num(_manualOrderState.shippingFee || 0) : 0;
    var adjustment = _num(_manualOrderState.adjustment || 0);
    var total = Math.max(subtotalFinal + shippingFee + adjustment, 0);
    return {
      subtotalOriginal: subtotalOriginal,
      subtotalFinal: subtotalFinal,
      promoDiscount: promoDiscount,
      shippingFee: shippingFee,
      adjustment: adjustment,
      total: total,
      hasPromo: hasPromo
    };
  }

  function _manualOrderTotalLabel() {
    return UI.fmt(_manualOrderTotals().total || 0);
  }

  function _manualOrderRenderSummary() {
    var t = _manualOrderTotals();
    _manualOrderState.priceOrigin = t.hasPromo ? 'promo' : (_manualOrderState.channel === 'cardapio' ? 'automático' : 'manual');
    var conflict = _manualOrderState.channel === 'cardapio' && t.hasPromo && Math.abs(t.adjustment) > 0;
    return [
      '<div style="border:1px solid #F2EDED;border-radius:12px;padding:10px 12px;background:#FAF8F8;">',
        '<div style="font-size:11px;color:#8A7E7C;margin-bottom:3px;">Subtotal original</div>',
        '<div style="font-size:15px;font-weight:900;color:#1A1A1A;">' + UI.fmt(t.subtotalOriginal) + '</div>',
      '</div>',
      '<div style="border:1px solid #F2EDED;border-radius:12px;padding:10px 12px;background:#FAF8F8;">',
        '<div style="font-size:11px;color:#8A7E7C;margin-bottom:3px;">Desconto promoções</div>',
        '<div style="font-size:15px;font-weight:900;color:#1A9E5A;">-' + UI.fmt(t.promoDiscount) + '</div>',
      '</div>',
      '<div style="border:1px solid #F2EDED;border-radius:12px;padding:10px 12px;background:#FAF8F8;">',
        '<div style="font-size:11px;color:#8A7E7C;margin-bottom:3px;">Entrega</div>',
        '<div style="font-size:15px;font-weight:900;color:#1A1A1A;">' + UI.fmt(t.shippingFee) + '</div>',
      '</div>',
      '<div style="border:1px solid ' + (Math.abs(t.adjustment) > 0 ? '#E8CFCC' : '#F2EDED') + ';border-radius:12px;padding:10px 12px;background:' + (Math.abs(t.adjustment) > 0 ? '#FFF8F7' : '#FAF8F8') + ';">',
        '<div style="font-size:11px;color:#8A7E7C;margin-bottom:3px;">Ajuste manual</div>',
        '<div style="font-size:15px;font-weight:900;color:' + (t.adjustment >= 0 ? '#C4362A' : '#1A9E5A') + ';">' + (t.adjustment >= 0 ? '+' : '-') + UI.fmt(Math.abs(t.adjustment)) + '</div>',
      '</div>',
      '<div style="grid-column:1/-1;border:1px solid #F2EDED;border-radius:12px;padding:10px 12px;background:#FAF8F8;">',
        '<div style="font-size:11px;color:#8A7E7C;margin-bottom:3px;">Forma de pagamento</div>',
        '<select id="mo-payment-method" onchange="Modules.Pedidos._manualOrderSetPaymentMethod(this.value)" style="' + _adminSelectStyle('height:40px;font-size:13px;') + '">' + _paymentMethodOptions(_manualOrderState.paymentMethod) + '</select>',
      '</div>',
      '<div style="grid-column:1/-1;border:1px solid #F2EDED;border-radius:12px;padding:10px 12px;background:#FAF8F8;">',
        '<div style="font-size:11px;color:#8A7E7C;margin-bottom:3px;">Status do pagamento</div>',
        '<select id="mo-payment-status" onchange="Modules.Pedidos._manualOrderSetPaymentStatus(this.value)" style="' + _adminSelectStyle('height:40px;font-size:13px;') + '">' + _paymentStatusOptions(_manualOrderState.paymentStatus) + '</select>',
      '</div>',
      '<div id="mo-paid-amount-box" style="grid-column:1/-1;border:1px solid #F2EDED;border-radius:12px;padding:10px 12px;background:#FAF8F8;display:' + (_paymentStatusIsPartial(_manualOrderState.paymentStatus) ? 'block' : 'none') + ';">',
        '<div style="font-size:11px;color:#8A7E7C;margin-bottom:3px;">Valor pago</div>',
        '<input id="mo-paid-amount" type="number" step="0.01" value="' + _esc(String(_manualOrderState.paidAmount || 0)) + '" oninput="Modules.Pedidos._manualOrderSetPaidAmount(this.value)" placeholder="0,00" style="width:100%;padding:10px 12px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:13px;font-family:inherit;outline:none;background:#fff;">',
      '</div>',
      (conflict ? '<div style="grid-column:1/-1;padding:10px 12px;border-radius:12px;background:#FFF7ED;border:1px solid #F59E0B;color:#92400E;font-size:12px;font-weight:700;">Promoções automáticas e ajuste manual estão atuando ao mesmo tempo. Revise antes de salvar.</div>' : '')
    ].join('');
  }

  function _normalizeZones(raw) {
    var list = [];
    if (raw && Array.isArray(raw.list)) list = raw.list;
    else if (raw && Array.isArray(raw.deliveryZones)) list = raw.deliveryZones;
    else if (raw && Array.isArray(raw.zones)) list = raw.zones;
    else if (Array.isArray(raw)) list = raw;
    else if (raw && typeof raw === 'object') list = Object.keys(raw.zones || raw.deliveryZones || {}).map(function (key) {
      return Object.assign({ id: key }, (raw.zones || raw.deliveryZones || {})[key]);
    });
    return list.filter(Boolean).map(function (z, idx) {
      var postal = z.postalCodes || z.ceps || z.codes || z.zipCodes || z.postcodes || z.postalCode || z.cep || z.zip || z.code || '';
      if (!Array.isArray(postal)) postal = String(postal || '').split(/[,;\s]+/).filter(Boolean);
      return {
        id: String(z.id || z.slug || idx),
        postalCode: z.postalCode || z.zip || z.code || z.cep || '',
        postalCodes: postal,
        name: z.name || z.nome || z.zone || z.label || '',
        fee: _num(z.fee != null ? z.fee : z.price != null ? z.price : z.deliveryFee != null ? z.deliveryFee : z.taxa != null ? z.taxa : z.valor),
        minOrder: _num(z.minOrder != null ? z.minOrder : z.minimumOrder != null ? z.minimumOrder : z.orderMin != null ? z.orderMin : z.minimo),
        active: z.active !== false && z.enabled !== false,
        isDefault: z.default === true || z.isDefault === true || z.primary === true
      };
    }).filter(function (z) { return z.active; });
  }

  function _ensureOrderFiscalDefaults(order) {
    order = Object.assign({}, order || {});
    var current = Object.assign({}, order.fiscal || {});
    var fiscal = {
      invoiceType: current.invoiceType || 'simplified',
      fiscalStatus: current.fiscalStatus || 'not_issued',
      issueMode: current.issueMode || 'automatic',
      provider: current.provider || '',
      providerInvoiceId: current.providerInvoiceId || '',
      facturaDirectaInvoiceId: current.facturaDirectaInvoiceId || '',
      invoiceNumber: current.invoiceNumber || '',
      invoiceSeries: current.invoiceSeries || '',
      invoicePdfUrl: current.invoicePdfUrl || '',
      invoiceQrUrl: current.invoiceQrUrl || '',
      issuedAt: current.issuedAt || null,
      cancelledAt: current.cancelledAt || null,
      errorCode: current.errorCode || '',
      errorMessage: current.errorMessage || '',
      retryCount: _num(current.retryCount || 0),
      lastAttemptAt: current.lastAttemptAt || null,
      customerSnapshot: current.customerSnapshot && Object.keys(current.customerSnapshot).length ? current.customerSnapshot : _buildFiscalCustomerSnapshot(order),
      itemsSnapshot: Array.isArray(current.itemsSnapshot) && current.itemsSnapshot.length ? current.itemsSnapshot : _buildFiscalItemsSnapshot(order),
      totalsSnapshot: current.totalsSnapshot && Object.keys(current.totalsSnapshot).length ? current.totalsSnapshot : _buildFiscalTotalsSnapshot(order)
    };
    order.fiscal = fiscal;
    return order;
  }

  function _buildFiscalCustomerSnapshot(order) {
    order = order || {};
    var customer = _findCustomerForOrder(order);
    return {
      name: _firstText(order.customerName, order.clientName, order.name, customer && customer.name, ''),
      phone: _firstText(order.customerPhone, order.phone, order.whatsapp, customer && (customer.phone || customer.whatsapp), ''),
      email: _firstText(order.customerEmail, order.email, customer && customer.email, ''),
      fiscal: Object.assign({}, (customer && customer.fiscal) || order.customerFiscal || {})
    };
  }

  function _buildFiscalItemsSnapshot(order) {
    var items = Array.isArray(order && order.items) ? order.items : [];
    return items.map(function (item) {
      var product = _findProductForOrderItem(item);
      var fiscal = _orderItemFiscal(product, item);
      var qty = _num(item.quantity != null ? item.quantity : item.qty != null ? item.qty : 1) || 1;
      var price = _num(item.finalPrice != null ? item.finalPrice : item.price != null ? item.price : item.originalPrice || 0);
      var total = _num(item.total != null ? item.total : item.subtotal != null ? item.subtotal : item.lineTotal != null ? item.lineTotal : price * qty);
      return {
        id: String(item.productId || item.id || ''),
        name: _firstText(item.name, item.productName, product && product.name, 'Produto'),
        quantity: qty,
        price: price,
        total: total,
        fiscal: fiscal
      };
    });
  }

  function _buildFiscalTotalsSnapshot(order) {
    order = order || {};
    return {
      subtotal: _num(order.subtotalFinal != null ? order.subtotalFinal : order.subtotal != null ? order.subtotal : order.subtotalOriginal),
      taxTotal: _num(order.taxTotal || order.ivaTotal || order.vatTotal || 0),
      total: _num(order.total != null ? order.total : order.grandTotal != null ? order.grandTotal : order.amount),
      currency: _firstText(order.currency, _generalConfig.currency, _generalConfig.defaultCurrency, 'EUR')
    };
  }

  function _findCustomerForOrder(order) {
    order = order || {};
    var wantedId = String(order.customerId || order.clientId || order.customerUid || '').trim();
    if (wantedId) {
      var byId = _findCustomerByRecordId(wantedId);
      if (byId) return byId;
    }
    var phone = _phone(order.customerPhone || order.phone || order.whatsapp || '');
    if (phone) {
      var byPhone = (_customers || []).find(function (c) { return _phone(c.phone || c.whatsapp || '') === phone; });
      if (byPhone) return byPhone;
    }
    var email = _clean(order.customerEmail || order.email || '');
    if (email) {
      var byEmail = (_customers || []).find(function (c) { return _clean(c.email || '') === email; });
      if (byEmail) return byEmail;
    }
    return null;
  }

  function _findProductForOrderItem(item) {
    var wantedId = String((item && (item.productId || item.id)) || '').trim();
    if (wantedId) {
      var byId = (_products || []).find(function (p) { return String(p.id || '') === wantedId; });
      if (byId) return byId;
    }
    var name = _clean(item && (item.name || item.productName));
    if (!name) return null;
    return (_products || []).find(function (p) { return _clean(p.name || p.title || '') === name; }) || null;
  }

  function _orderItemFiscal(product, item) {
    var current = Object.assign({}, (item && item.fiscal) || (product && product.fiscal) || {});
    var iva = current.ivaRate == null || current.ivaRate === '' ? 10 : _num(current.ivaRate);
    return {
      sku: _firstText(current.sku, product && (product.sku || product.codigo), ''),
      fiscalName: _firstText(current.fiscalName, product && product.fiscalName, item && item.name, product && product.name, 'Produto'),
      ivaRate: isFinite(iva) ? iva : 10,
      ivaIncluded: current.ivaIncluded !== false,
      unitCode: _firstText(current.unitCode, 'unit'),
      taxCategory: _firstText(current.taxCategory, 'prepared_food'),
      externalFiscalProductId: _firstText(current.externalFiscalProductId, ''),
      facturaDirectaProductId: _firstText(current.facturaDirectaProductId, '')
    };
  }

  function _firstText() {
    for (var i = 0; i < arguments.length; i++) {
      var v = arguments[i];
      if (v == null) continue;
      var s = String(v).trim();
      if (s) return s;
    }
    return '';
  }

  function _fold(v) {
    return String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function _manualOrderDisplayChannel(v) {
    var key = _fold(v || '');
    if (key === 'cardapio') return 'Cardápio';
    if (key === 'whatsapp') return 'WhatsApp';
    if (key === 'marketplace') return 'Marketplace';
    if (key === 'balcao') return 'Balcão';
    if (key === 'telefone') return 'Telefone';
    if (key === 'tpv' || key === 'venda presencial') return 'Venda presencial';
    if (key === 'manual') return 'Manual';
    return _title(v || 'Manual');
  }

  function _manualOrderChannelSource(value) {
    var key = _fold(value || '');
    if (key === 'cardapio') return 'cardapio';
    if (key === 'venda presencial' || key === 'tpv') return 'TPV';
    if (key === 'whatsapp') return 'whatsapp';
    if (key === 'marketplace') return 'marketplace';
    if (key === 'balcao') return 'balcao';
    if (key === 'telefone') return 'telefone';
    if (key === 'manual') return 'manual';
    return String(value || 'manual').trim() || 'manual';
  }

  function _manualOrderChannelOptions(selected) {
    var seen = {};
    var options = [];
    (_canais || []).forEach(function (c) {
      if (!c || c.active === false || c.ativo === false || c.enabled === false) return;
      var name = _firstText(c.name, c.nome, c.label, c.title, '');
      if (!name) return;
      var key = _channelAliasKey(name);
      if (seen[key]) return;
      seen[key] = true;
      options.push({ value: key === 'cardapio' ? 'cardapio' : (key === 'venda-presencial' ? 'Venda presencial' : name), label: _salesChannelDisplayName(name) });
    });
    if (!options.length) {
      options = [{ value: 'cardapio', label: 'Cardápio' }];
      if (_isTpvEnabledForChannels()) options.push({ value: 'Venda presencial', label: 'Venda presencial' });
    }
    var selectedKey = _channelAliasKey(selected || '');
    if (selectedKey && !options.some(function (item) { return _channelAliasKey(item.value || item.label || '') === selectedKey; })) {
      options.push({ value: String(selected || ''), label: _salesChannelDisplayName(selected) || String(selected || '') });
    }
    return options.map(function (item) {
      var value = String(item.value || '');
      return '<option value="' + _esc(value) + '"' + (selectedKey === _channelAliasKey(value) ? ' selected' : '') + '>' + _esc(item.label || value) + '</option>';
    }).join('');
  }

  function _manualOrderDeliveryAddressOptions() {
    var customer = _manualOrderSelectedCustomer();
    var list = _manualOrderCustomerAddresses(customer);
    var selected = String(_manualOrderState.selectedDeliveryAddressId || '');
    var html = '';
    if (list.length) {
      html += list.map(function (addr) {
        var id = String(addr.id || '');
        return '<option value="' + _esc(id) + '"' + (selected === id ? ' selected' : '') + '>' + _esc(_manualOrderAddressLabel(addr)) + '</option>';
      }).join('');
    }
    html += '<option value="new"' + (!selected || selected === 'new' ? ' selected' : '') + '>' + (list.length ? 'Usar novo endereço' : 'Preencher novo endereço') + '</option>';
    return html;
  }

  function _openNewOrder() {
    var context = _orderContext();
    _manualOrderReset(context);

    var overlay = document.createElement('div');
    overlay.id = 'manual-order-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;background:rgba(31,31,31,.42);display:flex;align-items:center;justify-content:center;padding:16px;';

    var modal = document.createElement('div');
    modal.style.cssText = 'width:100%;max-width:1240px;max-height:90vh;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(31,31,31,.22);display:flex;flex-direction:column;overflow:hidden;';

    var header = document.createElement('div');
    header.style.cssText = 'padding:18px 20px;border-bottom:1px solid #EAE4DA;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex:0 0 auto;background:#fff;';
    header.innerHTML = '<div style="min-width:0;">' +
      '<div style="font-size:11px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Pedido manual</div>' +
      '<h2 style="font-size:22px;font-weight:800;line-height:1.1;margin:0;color:#1F1F1F;">Criar pedido manual</h2>' +
      '<div id="mo-header-channel" style="margin-top:8px;display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:#FFF7F5;border:1px solid rgba(180,35,24,.16);font-size:11px;font-weight:750;color:#B42318;">Canal de venda: ' + _esc(_manualOrderDisplayChannel(_manualOrderState.channel)) + '</div>' +
    '</div>' +
    '<button type="button" onclick="Modules.Pedidos._closeManualOrderModal()" style="width:34px;height:34px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;cursor:pointer;font-size:16px;flex-shrink:0;font-family:inherit;">✕</button>';

    var body = document.createElement('div');
    body.style.cssText = 'padding:16px 20px 20px;overflow:auto;flex:1;min-height:0;background:#FAF8F5;';
    var phoneParts = _manualOrderPhoneParts(_manualOrderState.customerPhone || '');
    var modalCss = '<style>' +
      '.manual-order-body{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(340px,.95fr);gap:14px;align-items:start;font-family:Manrope,Inter,sans-serif;}' +
      '.manual-order-stack{display:flex;flex-direction:column;gap:12px;}' +
      '.manual-order-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%)!important;border:1px solid #EADFD8!important;border-radius:18px!important;padding:14px!important;box-shadow:0 10px 24px rgba(31,31,31,.04)!important;display:flex;flex-direction:column;gap:11px;min-width:0;}' +
      '.manual-order-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:1px;}' +
      '.manual-order-card-title{display:flex;align-items:flex-start;gap:9px;min-width:0;}' +
      '.manual-order-card-title .mi{font-size:18px;color:#6F6860;line-height:1.2;}' +
      '.manual-order-title{font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:3px;}' +
      '.manual-order-hint{font-size:12px;color:#8A7E7C;line-height:1.4;margin:0;}' +
      '.manual-order-grid{display:grid;gap:11px 12px;align-items:end;min-width:0;}' +
      '.manual-order-customer-grid{grid-template-columns:minmax(240px,1fr) minmax(320px,1.15fr);}' +
      '.manual-order-email-field{grid-column:1/-1;max-width:420px;}' +
      '.manual-order-service-grid{grid-template-columns:repeat(12,minmax(0,1fr));align-items:end;}' +
      '.manual-order-delivery-grid{padding-left:27px;}' +
      '.mo-service-type{grid-column:span 3;}' +
      '.mo-service-address-select{grid-column:span 6;}' +
      '.mo-service-postal{grid-column:span 3;}' +
      '.mo-service-street{grid-column:span 6;}' +
      '.mo-service-number{grid-column:span 2;}' +
      '.mo-service-complement{grid-column:span 4;}' +
      '.mo-service-quarter{grid-column:span 3;}' +
      '.mo-service-time{grid-column:span 3;}' +
      '.mo-service-fee{grid-column:span 3;}' +
      '.mo-service-order-time{grid-column:span 3;}' +
      '.mo-service-custom-order{grid-column:1/-1;}' +
      '.manual-order-products-grid{grid-template-columns:minmax(0,1fr);}' +
      '.manual-order-summary-grid{grid-template-columns:minmax(120px,.45fr) minmax(150px,.55fr);}' +
      '.manual-order-body label{font-size:11px!important;font-weight:650!important;color:#8A7E7C!important;display:block!important;margin-bottom:5px!important;letter-spacing:.02em!important;}' +
      '.manual-order-body input:not([type=checkbox]),.manual-order-body select,.manual-order-body textarea{width:100%!important;min-height:36px!important;border:1px solid #E8DCD7!important;border-radius:12px!important;padding:0 12px!important;font-size:14px!important;font-family:inherit!important;outline:none!important;background:#FFFCF8!important;color:#1F1F1F!important;box-shadow:none!important;box-sizing:border-box!important;}' +
      '.manual-order-field-control{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;min-width:0;}' +
      '.manual-order-field-control:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.manual-order-field-control input:not([type=checkbox]),.manual-order-field-control select,.manual-order-field-control textarea{border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;padding:0 8px!important;min-height:34px!important;}' +
      '.manual-order-phone-box{display:grid;grid-template-columns:124px minmax(190px,1fr);gap:8px;align-items:center;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.manual-order-phone-box:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.manual-order-phone-box select,.manual-order-phone-box input{border:0!important;background:transparent!important;box-shadow:none!important;min-height:34px!important;border-radius:8px!important;padding:0 8px!important;}' +
      '.manual-order-phone-box select{border-right:1px solid #E8DCD7!important;border-radius:8px 0 0 8px!important;}' +
      '.manual-order-field-control textarea{padding-top:8px!important;padding-bottom:8px!important;}' +
      '.manual-order-body textarea{min-height:72px!important;padding:10px 12px!important;resize:vertical!important;line-height:1.45!important;}' +
      '.manual-order-body input:not([type=checkbox]):focus,.manual-order-body select:focus,.manual-order-body textarea:focus{background:#fff!important;border-color:#D9AAA1!important;box-shadow:0 0 0 3px rgba(180,35,24,.08)!important;}' +
      '.manual-order-body select{padding-right:42px!important;appearance:none!important;-webkit-appearance:none!important;-moz-appearance:none!important;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E)!important;background-repeat:no-repeat!important;background-position:right 16px center!important;background-size:14px!important;}' +
      '.manual-order-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;}' +
      '.manual-order-channel-row{display:grid;grid-template-columns:minmax(180px,260px);gap:10px;align-items:end;}' +
      '.manual-order-channel-panel{display:grid;grid-template-columns:minmax(180px,260px);gap:10px;align-items:end;padding:0 2px;}' +
      '.manual-order-secondary-btn{height:40px;padding:0 13px;border:1px solid #EADFD8;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);white-space:nowrap;}' +
      '.manual-order-pill{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:#FFF7F5;border:1px solid rgba(180,35,24,.16);font-size:11px;font-weight:700;color:#B42318;}' +
      '.manual-order-muted-pill{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:#F8F4F1;border:1px solid #EADFD8;font-size:11px;font-weight:650;color:#6F6860;}' +
      '.manual-order-filter-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center;}' +
      '.manual-order-filter-row button{padding:7px 12px!important;border-radius:999px!important;font-size:12px!important;font-weight:650!important;font-family:inherit!important;cursor:pointer!important;}' +
      '.manual-order-sticky{display:flex;flex-direction:column;gap:12px;position:sticky;top:0;align-self:start;}' +
      '@media(max-width:1120px){.manual-order-body{grid-template-columns:1fr}.manual-order-sticky{position:static}.manual-order-service-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.mo-service-type,.mo-service-postal,.mo-service-number,.mo-service-complement,.mo-service-quarter,.mo-service-time,.mo-service-fee,.mo-service-order-time{grid-column:span 3}.mo-service-address-select,.mo-service-street,.mo-service-custom-order{grid-column:1/-1}}' +
      '@media(max-width:760px){.manual-order-customer-grid,.manual-order-service-grid,.manual-order-summary-grid,.manual-order-search-row,.manual-order-channel-row,.manual-order-channel-panel{grid-template-columns:1fr}.manual-order-delivery-grid{padding-left:0}.manual-order-email-field{grid-column:auto;max-width:none}.manual-order-phone-box{grid-template-columns:118px minmax(0,1fr)}.mo-service-type,.mo-service-address-select,.mo-service-postal,.mo-service-street,.mo-service-number,.mo-service-complement,.mo-service-quarter,.mo-service-time,.mo-service-fee,.mo-service-order-time,.mo-service-custom-order{grid-column:auto}.manual-order-secondary-btn{width:100%;}}' +
      '</style>';
    body.innerHTML = modalCss +
      '<div class="manual-order-body">' +
        '<div style="display:flex;flex-direction:column;gap:14px;">' +
          '<div class="manual-order-channel-panel">' +
            '<div><label>Canal de venda</label><div class="manual-order-field-control"><select id="mo-channel" onchange="Modules.Pedidos._manualOrderSetChannel(this.value)">' + _manualOrderChannelOptions(_manualOrderState.channel) + '</select></div></div>' +
          '</div>' +
          '<section class="manual-order-card">' +
            '<div class="manual-order-card-head">' +
              '<div class="manual-order-card-title"><span class="mi">person_search</span><div><div class="manual-order-title">Cliente</div><p class="manual-order-hint">Busque um cliente já cadastrado ou preencha os dados para este pedido.</p></div></div>' +
              '<div id="mo-customer-pill" class="manual-order-muted-pill">Nenhum cliente selecionado</div>' +
            '</div>' +
            '<div class="manual-order-search-row">' +
              '<div style="min-width:0;">' +
                '<label>Buscar cliente existente</label>' +
                '<div class="manual-order-field-control"><input id="mo-customer-search" type="search" value="' + _esc(_manualOrderState.customerQuery) + '" onfocus="Modules.Pedidos._manualOrderFocusCustomers()" oninput="Modules.Pedidos._manualOrderSearchCustomers(this.value)" placeholder="Buscar por nome, telefone, e-mail ou endereço"></div>' +
                '<div id="mo-customer-results"></div>' +
              '</div>' +
              '<button type="button" class="manual-order-secondary-btn" onclick="Modules.Pedidos._openManualOrderQuickCustomer()">+ Cliente rápido</button>' +
            '</div>' +
            '<div class="manual-order-grid manual-order-customer-grid">' +
              '<div><label>Nome do cliente</label><div class="manual-order-field-control"><input id="mo-name" type="text" value="' + _esc(_manualOrderState.customerName) + '" placeholder="Nome" oninput="Modules.Pedidos._manualOrderField(\'customerName\', this.value)"></div></div>' +
              '<div><label>Telefone / WhatsApp</label><div class="manual-order-phone-box"><select id="mo-phone-prefix" onchange="Modules.Pedidos._manualOrderSyncPhoneFromParts(\'mo-phone-prefix\',\'mo-phone-number\',\'customerPhone\')">' + _manualOrderPhonePrefixOptions(phoneParts.prefix) + '</select><input id="mo-phone-number" type="text" value="' + _esc(phoneParts.number) + '" placeholder="' + _esc(_manualOrderPhonePlaceholder()) + '" oninput="Modules.Pedidos._manualOrderSyncPhoneFromParts(\'mo-phone-prefix\',\'mo-phone-number\',\'customerPhone\')"></div></div>' +
              '<div class="manual-order-email-field"><label>E-mail</label><div class="manual-order-field-control"><input id="mo-email" type="email" value="' + _esc(_manualOrderState.customerEmail) + '" placeholder="E-mail" oninput="Modules.Pedidos._manualOrderField(\'customerEmail\', this.value)"></div></div>' +
            '</div>' +
          '</section>' +
          '<section class="manual-order-card">' +
            '<div class="manual-order-card-head">' +
              '<div class="manual-order-card-title"><span class="mi">local_shipping</span><div><div class="manual-order-title">Entrega e horário</div><p class="manual-order-hint">Defina como a cliente vai receber o pedido e quando ele deve ser preparado.</p></div></div>' +
            '</div>' +
            '<div class="manual-order-grid manual-order-service-grid manual-order-delivery-grid" id="mo-delivery-block">' +
              '<div class="mo-service-type"><label>Tipo</label><div class="manual-order-field-control"><select id="mo-type" onchange="Modules.Pedidos._manualOrderSetType(this.value)"><option value="delivery">Entrega</option><option value="pickup">Retirada</option></select></div></div>' +
              '<div class="mo-delivery-only mo-service-address-select"><label>Endereço de entrega</label><div class="manual-order-field-control"><select id="mo-delivery-address" onchange="Modules.Pedidos._manualOrderSetDeliveryAddress(this.value)">' + _manualOrderDeliveryAddressOptions() + '</select></div></div>' +
              '<div class="mo-delivery-only mo-service-postal"><label>Código postal</label><div class="manual-order-field-control"><input id="mo-postal-code" type="text" value="' + _esc(_manualOrderState.customerPostalCode || '') + '" placeholder="CP" oninput="Modules.Pedidos._manualOrderField(\'customerPostalCode\', this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-street"><label>Rua</label><div class="manual-order-field-control"><input id="mo-address" type="text" value="' + _esc(_manualOrderState.customerAddress) + '" placeholder="Endereço de entrega" oninput="Modules.Pedidos._manualOrderField(\'customerAddress\', this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-number"><label>Número / portal</label><div class="manual-order-field-control"><input id="mo-address-number" type="text" value="' + _esc(_manualOrderState.customerAddressNumber || '') + '" placeholder="Nº" oninput="Modules.Pedidos._manualOrderField(\'customerAddressNumber\', this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-complement"><label>Piso / referência</label><div class="manual-order-field-control"><input id="mo-address-complement" type="text" value="' + _esc(_manualOrderState.customerAddressComplement || '') + '" placeholder="Piso, porta ou referência" oninput="Modules.Pedidos._manualOrderField(\'customerAddressComplement\', this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-quarter"><label>Bairro</label><div class="manual-order-field-control"><input id="mo-neighborhood" type="text" value="' + _esc(_manualOrderState.customerNeighborhood || '') + '" placeholder="Bairro" oninput="Modules.Pedidos._manualOrderField(\'customerNeighborhood\', this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-quarter"><label>Localidade</label><div class="manual-order-field-control"><input id="mo-city" type="text" value="' + _esc(_manualOrderState.customerCity || '') + '" placeholder="Cidade" oninput="Modules.Pedidos._manualOrderField(\'customerCity\', this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-quarter"><label>Província</label><div class="manual-order-field-control"><input id="mo-province" type="text" value="' + _esc(_manualOrderState.customerProvince || '') + '" placeholder="Província" oninput="Modules.Pedidos._manualOrderField(\'customerProvince\', this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-quarter"><label>País</label><div class="manual-order-field-control"><input id="mo-country" type="text" value="' + _esc(_manualOrderState.customerCountry || '') + '" placeholder="País" oninput="Modules.Pedidos._manualOrderField(\'customerCountry\', this.value)"></div></div>' +
              '<div class="mo-service-time"><label>Dia</label><div class="manual-order-field-control"><input id="mo-delivery-date" type="date" value="' + _esc(_manualOrderState.deliveryDate || '') + '" oninput="Modules.Pedidos._manualOrderSetDeliveryDate(this.value)"></div></div>' +
              '<div class="mo-service-time"><label>Horário</label><div class="manual-order-field-control"><input id="mo-delivery-time" type="time" value="' + _esc(_manualOrderState.deliveryTime || '') + '" oninput="Modules.Pedidos._manualOrderSetDeliveryTime(this.value)"></div></div>' +
              '<div class="mo-delivery-only mo-service-fee" id="mo-delivery-fee-block"><label>Taxa de entrega</label><div class="manual-order-field-control"><input id="mo-shipping" type="text" inputmode="decimal" value="' + _esc(UI.fmt(_manualOrderState.shippingFee || 0)) + '" readonly placeholder="€0,00"></div><div id="mo-shipping-info" style="display:none;"></div></div>' +
              '<div class="mo-service-order-time"><label>Hora do pedido</label><div class="manual-order-field-control"><input id="mo-order-time" type="time" value="' + _esc(_manualOrderState.orderTime || _currentTimeValue()) + '" oninput="Modules.Pedidos._manualOrderSetOrderTime(this.value)"></div></div>' +
              '<div class="mo-service-custom-order"><div style="border:1px solid #E8DCD7;border-radius:13px;background:#FFFCF8;padding:10px 12px;display:grid;grid-template-columns:minmax(220px,1fr) minmax(120px,160px);gap:10px;align-items:end;">' +
                '<label style="display:flex!important;align-items:flex-start;gap:9px;margin:0!important;color:#1F1F1F!important;font-size:12px!important;line-height:1.35!important;"><input id="mo-made-to-order" type="checkbox" onchange="Modules.Pedidos._manualOrderSetMadeToOrder(this.checked)" style="width:16px;height:16px;accent-color:#B42318;margin-top:2px;"' + (_manualOrderState.madeToOrder ? ' checked' : '') + '><span><strong style="display:block;color:#1F1F1F;font-size:12px;">Produto sob encomenda</strong><span id="mo-production-lead-help" style="display:block;color:#6F6860;font-size:11px;margin-top:2px;">' + _esc(_manualOrderProductionLeadHelp()) + '</span></span></label>' +
                '<div><label>Prazo produção</label><div class="manual-order-field-control"><input id="mo-production-lead-days" type="number" min="0" step="1" value="' + _esc(String(_manualOrderState.productionLeadDays || '')) + '" placeholder="Dias" oninput="Modules.Pedidos._manualOrderSetProductionLeadDays(this.value)"' + (_manualOrderState.madeToOrder ? '' : ' disabled') + '></div></div>' +
              '</div></div>' +
            '</div>' +
            '<div id="mo-pickup-block" style="display:none;"></div>' +
          '</section>' +
          '<section class="manual-order-card">' +
            '<div class="manual-order-card-head">' +
              '<div class="manual-order-card-title"><span class="mi">restaurant_menu</span><div><div class="manual-order-title">Produtos</div><p class="manual-order-hint">Busque os itens e adicione ao pedido. Promoções do cardápio continuam sendo calculadas automaticamente.</p></div></div>' +
            '</div>' +
            '<div>' +
              '<label>Buscar produto</label>' +
              '<div class="manual-order-field-control"><input id="mo-product-search" type="search" value="' + _esc(_manualOrderState.productQuery) + '" oninput="Modules.Pedidos._manualOrderSearchItems(this.value)" placeholder="Buscar por produto, categoria ou tag"></div>' +
            '</div>' +
            '<div id="mo-product-results"></div>' +
          '</section>' +
        '</div>' +
        '<div class="manual-order-sticky">' +
          '<section class="manual-order-card">' +
            '<div class="manual-order-card-head">' +
              '<div class="manual-order-card-title"><span class="mi">receipt_long</span><div><div class="manual-order-title">Resumo</div><p class="manual-order-hint">Revise itens, pagamento e total antes de criar o pedido.</p></div></div>' +
              '<div id="mo-price-origin" style="font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;background:#FFF0EE;color:#C4362A;">Origem: manual</div>' +
            '</div>' +
            '<div id="mo-selected-items"></div>' +
            '<div id="mo-summary" style="display:grid;grid-template-columns:1fr;gap:10px;"></div>' +
            '<div class="manual-order-grid manual-order-summary-grid">' +
              '<div>' +
                '<label>Ajuste manual</label>' +
                '<input id="mo-adjustment" type="number" step="0.01" value="' + _esc(String(_manualOrderState.adjustment || 0)) + '" oninput="Modules.Pedidos._manualOrderSetAdjustment(this.value)" placeholder="0,00" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;">' +
                '<div id="mo-adjustment-note" style="font-size:11px;color:#8A7E7C;margin-top:6px;line-height:1.4;"></div>' +
              '</div>' +
              '<div><label>Total final</label><div id="mo-total-final" style="width:100%;padding:10px 12px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;font-size:18px;font-weight:800;color:#1A1A1A;box-sizing:border-box;">€0,00</div></div>' +
              '<div style="grid-column:1/-1;"><label>Observação do pedido</label><textarea id="mo-note" placeholder="Alguma observação para a cozinha ou atendimento">' + _esc(_manualOrderState.customerNotes || '') + '</textarea></div>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

    var footer = '<div style="display:flex;gap:10px;justify-content:flex-end;width:100%;">' +
      '<button type="button" onclick="Modules.Pedidos._closeManualOrderModal()" style="height:40px;padding:0 15px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button>' +
      '<button id="mo-submit-btn" type="button" onclick="Modules.Pedidos._saveNewOrder()" style="height:40px;padding:0 16px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Criar pedido</button>' +
    '</div>';

    var footerWrap = document.createElement('div');
    footerWrap.style.cssText = 'padding:16px 20px;border-top:1px solid #EAE4DA;background:#fff;flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;gap:16px;';
    footerWrap.innerHTML = '<div style="font-size:12px;color:#6F6860;line-height:1.4;">Revise cliente, canal, entrega e itens antes de criar o pedido.</div>' + footer;

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footerWrap);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.onclick = function (e) { if (e.target === overlay) _closeManualOrderModal(); };

    window._newOrderModal = { close: _closeManualOrderModal, el: overlay };
    _manualOrderRefresh();
    setTimeout(function () {
      if (window.BocaPlaces) {
        BocaPlaces.init('mo-address', { onPlace: function (data) { _manualOrderApplyPlace('mo-', data, true); } });
      }
    }, 300);
  }

  function _openTpvOrder() {
    return _loadMeta().then(function () {
      _openNewOrder();
    }).catch(function () {
      _openNewOrder();
    });
  }

  function _createTpvOrder(data) {
    data = data || {};
    var items = Array.isArray(data.items) ? data.items : [];
    var total = _num(data.total);
    if (!items.length) return Promise.reject(new Error('Selecione ao menos um produto'));
    if (!(total > 0)) return Promise.reject(new Error('O total final precisa ser maior que zero'));
    var orderTime = _normalizeTimeValue(data.orderTime || _currentTimeValue());
    var paymentStatus = String(data.paymentStatus || 'pago');
    var paymentMethod = String(data.paymentMethod || '');
    var paidAmount = _paymentStatusIsPaid(paymentStatus) ? total : _num(data.paidAmount || 0);
    var channelCategory = _channelIncomeCategoryMeta(_salesChannelByName('Venda presencial') || _salesChannelByName('TPV') || {});
    var payload = {
      customerId: String(data.customerId || ''),
      customerName: String(data.customerName || 'Cliente balcão'),
      customerPhone: String(data.customerPhone || ''),
      customerEmail: String(data.customerEmail || ''),
      address: '',
      zone: '',
      type: 'pickup',
      slot: '',
      note: String(data.note || ''),
      status: String(data.status || 'Entregado'),
      items: items,
      subtotalOriginal: _num(data.subtotalOriginal != null ? data.subtotalOriginal : data.subtotal),
      subtotal: _num(data.subtotal != null ? data.subtotal : data.subtotalOriginal),
      subtotalFinal: _num(data.subtotalFinal != null ? data.subtotalFinal : data.subtotal),
      promoDiscountTotal: _num(data.promoDiscountTotal || 0),
      discountTotal: _num(data.discountTotal || data.promoDiscountTotal || 0),
      shippingFee: 0,
      manualAdjustmentValue: _num(data.manualAdjustmentValue || 0),
      total: total,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      paymentState: paymentStatus,
      paidAmount: paidAmount,
      amountPaid: paidAmount,
      valuePaid: paidAmount,
      paid: _paymentStatusIsPaid(paymentStatus) ? true : (_paymentStatusIsPartial(paymentStatus) ? paidAmount : false),
      deliveryDate: '',
      deliveryTime: '',
      orderTime: orderTime,
      saleTime: orderTime,
      createdTime: orderTime,
      analyticsTime: orderTime,
      analyticsHour: _timeHour(orderTime),
      orderHour: _timeHour(orderTime),
      channel: 'TPV',
      source: 'TPV',
      originChannel: 'TPV',
      originSource: 'TPV',
      entradaCategoriaId: channelCategory.id,
      entradaCategoriaNome: channelCategory.name,
      incomeCategoryId: channelCategory.id,
      incomeCategoryName: channelCategory.name,
      categoriaEntradaId: channelCategory.id,
      categoriaEntradaNome: channelCategory.name,
      financialCategoryId: channelCategory.id,
      financialCategoryName: channelCategory.name,
      categoriaFinanceiraId: channelCategory.id,
      categoriaFinanceiraNome: channelCategory.name,
      cashSessionId: String(data.cashSessionId || ''),
      caixaId: String(data.cashSessionId || ''),
      cashAccountId: String(data.cashAccountId || (_tpvConfig && _tpvConfig.cashAccountId) || ''),
      cashAccountName: String(data.cashAccountName || (_tpvConfig && _tpvConfig.cashAccountName) || ''),
      priceOrigin: _num(data.promoDiscountTotal || 0) > 0 ? 'promo' : 'manual',
      manualAdjustment: _num(data.manualAdjustmentValue || 0) !== 0,
      completedAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      createdAt: _manualOrderCreatedAt(orderTime)
    };
    Object.assign(payload, _orderChannelFinancialPatch(payload, total));
    payload.fiscal = _ensureOrderFiscalDefaults(payload).fiscal;
    return DB.add('orders', payload).then(function (ref) {
      var createdId = (ref && ref.id) ? String(ref.id) : '';
      if (createdId) payload.id = createdId;
      return _syncOrderFinanceMovement(createdId || '', payload).then(function () {
        return _syncOrderStockMovement(createdId || '', payload, payload.status);
      }).then(function (stockPatch) {
        if (stockPatch && typeof stockPatch === 'object') Object.assign(payload, stockPatch);
        return payload;
      });
    });
  }

  function _manualOrderPhonePlaceholder() {
    var country = _fold(_firstText(_generalConfig.country, _generalConfig.pais, _generalConfig.countryName, ''));
    if (country.indexOf('espa') >= 0) return '+34...';
    if (country.indexOf('port') >= 0) return '+351...';
    if (country.indexOf('brasil') >= 0) return '+55...';
    return 'Telefone / WhatsApp';
  }

  function _currentTimeValue() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function _normalizeTimeValue(value) {
    var raw = String(value || '').trim();
    var m = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return _currentTimeValue();
    var h = Math.max(0, Math.min(23, parseInt(m[1], 10) || 0));
    var min = Math.max(0, Math.min(59, parseInt(m[2], 10) || 0));
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  }

  function _timeHour(value) {
    var time = _normalizeTimeValue(value);
    return parseInt(time.slice(0, 2), 10) || 0;
  }

  function _manualOrderCreatedAt(orderTime) {
    var time = _normalizeTimeValue(orderTime);
    var d = new Date();
    d.setHours(_timeHour(time), parseInt(time.slice(3, 5), 10) || 0, 0, 0);
    return d.toISOString();
  }

  function _ensureManualOrderCustomer(data) {
    data = data || {};
    var selectedId = String(data.customerId || '').trim();
    var name = String(data.name || '').trim();
    var phone = String(data.phone || '').trim();
    var email = String(data.email || '').trim();
    var address = String(data.address || '').trim();
    var number = String(data.number || '').trim();
    var complement = String(data.complement || '').trim();
    var neighborhood = String(data.neighborhood || data.zone || '').trim();
    var city = String(data.city || '').trim();
    var province = String(data.province || '').trim();
    var country = String(data.country || '').trim();
    var postalCode = String(data.postalCode || '').trim();
    var zone = String(data.zone || '').trim();
    var channel = String(data.channel || 'manual').trim() || 'manual';
    var note = String(data.note || '').trim();
    var phoneKey = _phoneMatchKey(phone);
    var emailKey = _clean(email);

    if (selectedId) return Promise.resolve(selectedId);
    if (!(name || phone || email)) return Promise.resolve('');

    return DB.getAll('store_customers').catch(function () { return _customers || []; }).then(function (rows) {
      var list = Array.isArray(rows) ? rows : [];
      var match = list.find(function (c) {
        if (phoneKey && _phoneMatchKey(c.phone || c.whatsapp || '') === phoneKey) return true;
        if (!phoneKey && emailKey && _clean(c.email || '') === emailKey) return true;
        return false;
      }) || null;
      var payload = {
        name: name || (match && match.name) || phone || email || 'Cliente',
        phone: phone || (match && (match.phone || match.whatsapp)) || '',
        whatsapp: phone || (match && (match.whatsapp || match.phone)) || '',
        email: email || (match && match.email) || '',
        address: address || (match && match.address) || '',
        number: number || (match && (match.number || match.numero)) || '',
        complement: complement || (match && (match.complement || match.reference)) || '',
        neighborhood: neighborhood || (match && (match.neighborhood || match.zone)) || '',
        city: city || (match && (match.city || match.cidade)) || '',
        province: province || (match && (match.province || match.state || match.estado)) || '',
        country: country || (match && (match.country || match.pais)) || '',
        postalCode: postalCode || (match && (match.postalCode || match.zip || match.codigoPostal)) || '',
        zone: zone || neighborhood || postalCode || (match && (match.zone || match.neighborhood)) || '',
        deliveryAddresses: (match && Array.isArray(match.deliveryAddresses) && match.deliveryAddresses.length) ? match.deliveryAddresses : (address || postalCode || neighborhood ? [{
          id: 'principal',
          label: 'Endereço principal',
          address: address,
          number: number,
          complement: complement,
          neighborhood: neighborhood,
          city: city,
          province: province,
          country: country,
          postalCode: postalCode
        }] : []),
        status: (match && match.status) || 'ativo',
        origin: (match && match.origin) || channel,
        mainChannel: (match && (match.mainChannel || match.channelName || match.channel)) || channel,
        channelName: (match && (match.channelName || match.mainChannel || match.channel)) || channel,
        acceptsMarketing: match ? !!match.acceptsMarketing : false,
        preferences: (match && match.preferences) || '',
        allergies: (match && match.allergies) || '',
        notes: (match && (match.notes || match.internalNotes)) || note,
        internalNotes: (match && (match.internalNotes || match.notes)) || note,
        points: match && match.points ? match.points : 0,
        ordersCount: match && match.ordersCount ? match.ordersCount : 0,
        totalSpent: match && match.totalSpent ? match.totalSpent : 0,
        totalOrders: match && match.totalOrders ? match.totalOrders : 0
      };
      var matchId = _customerRecordId(match);
      var op = matchId ? DB.update('store_customers', matchId, payload).then(function () { return matchId; }) : DB.add('store_customers', payload).then(function (ref) {
        return ref && ref.id ? ref.id : ref;
      });
      return op.then(function (customerId) {
        customerId = String(customerId || '');
        if (customerId) {
          var next = Object.assign({}, payload, { id: customerId });
          var idx = (_customers || []).findIndex(function (c) { return _customerRecordId(c) === customerId; });
          if (idx >= 0) _customers[idx] = Object.assign({}, _customers[idx], next);
          else _customers.push(next);
        }
        return customerId;
      });
    }).catch(function (err) {
      console.warn('Manual order customer sync skipped', err);
      return '';
    });
  }

  function _openManualOrderQuickCustomer() {
    var existing = document.getElementById('manual-order-quick-customer');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var phoneParts = _manualOrderPhoneParts(_manualOrderState.customerPhone || '');
    var overlay = document.createElement('div');
    overlay.id = 'manual-order-quick-customer';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:7200;background:rgba(31,31,31,.38);display:flex;align-items:center;justify-content:center;padding:16px;';
    var modal = document.createElement('div');
    modal.style.cssText = 'width:100%;max-width:760px;max-height:min(90vh,900px);max-height:min(90dvh,900px);background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(31,31,31,.22);overflow:hidden;font-family:Manrope,Inter,sans-serif;display:flex;flex-direction:column;';
    modal.innerHTML =
      '<style>' +
        '.quick-client-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:14px;box-shadow:0 10px 24px rgba(31,31,31,.04);display:flex;flex-direction:column;gap:12px;}' +
        '.quick-client-grid{display:grid;grid-template-columns:minmax(220px,.85fr) minmax(320px,1.15fr);gap:12px;align-items:end;}' +
        '.quick-client-grid .wide{grid-column:1/-1;}' +
        '.quick-client-field span{font-size:11px;font-weight:650;color:#8A7E7C;display:block;margin-bottom:5px;letter-spacing:.02em;}' +
        '.quick-client-control{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
        '.quick-client-control:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
        '.quick-client-control input{width:100%;height:34px;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;padding:0 8px;box-sizing:border-box;}' +
        '.quick-client-phone{display:grid;grid-template-columns:124px minmax(220px,1fr);gap:8px;align-items:center;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px;}' +
        '.quick-client-phone:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
        '.quick-client-phone select,.quick-client-phone input{width:100%;height:34px;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;padding:0 8px;box-sizing:border-box;}' +
        '.quick-client-phone select{border-right:1px solid #E8DCD7;}' +
        '.quick-client-scroll{scrollbar-width:none;-ms-overflow-style:none;}' +
        '.quick-client-scroll::-webkit-scrollbar{display:none;}' +
        '@media(max-width:760px){.quick-client-grid{grid-template-columns:1fr;}.quick-client-grid .wide{grid-column:auto;}.quick-client-phone{grid-template-columns:118px minmax(0,1fr);}}' +
      '</style>' +
      '<div style="padding:16px 20px;border-bottom:1px solid #F0E8E3;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex:0 0 auto;background:#fff;">' +
        '<div><div style="font-size:11px;font-weight:750;color:#B42318;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Cliente rápido</div><h3 style="margin:0;font-size:20px;line-height:1.15;color:#1F1F1F;">Cadastrar cliente</h3></div>' +
        '<button type="button" onclick="Modules.Pedidos._closeManualOrderQuickCustomer()" style="width:34px;height:34px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;cursor:pointer;font-family:inherit;">×</button>' +
      '</div>' +
      '<div class="quick-client-scroll" style="padding:14px 16px;background:#FAF8F5;overflow:auto;flex:1 1 auto;min-height:0;">' +
        '<section class="quick-client-card">' +
          '<div class="quick-client-grid">' +
            '<label class="quick-client-field"><span>Nome do cliente</span><div class="quick-client-control"><input id="mo-qc-name" type="text" value="' + _esc(_manualOrderState.customerName || '') + '" placeholder="Nome"></div></label>' +
            '<label class="quick-client-field"><span>WhatsApp</span><div class="quick-client-phone"><select id="mo-qc-phone-prefix">' + _manualOrderPhonePrefixOptions(phoneParts.prefix) + '</select><input id="mo-qc-phone" type="text" value="' + _esc(phoneParts.number) + '" placeholder="' + _esc(_manualOrderPhonePlaceholder()) + '"></div></label>' +
            '<label class="quick-client-field wide"><span>E-mail</span><div class="quick-client-control"><input id="mo-qc-email" type="email" value="' + _esc(_manualOrderState.customerEmail || '') + '" placeholder="E-mail"></div></label>' +
            '<label class="quick-client-field"><span>Código postal</span><div class="quick-client-control"><input id="mo-qc-postal-code" type="text" value="' + _esc(_manualOrderState.customerPostalCode || '') + '" placeholder="CP"></div></label>' +
            '<label class="quick-client-field wide"><span>Rua</span><div class="quick-client-control"><input id="mo-qc-address" type="text" value="' + _esc(_manualOrderState.customerAddress || '') + '" placeholder="Endereço de entrega"></div></label>' +
            '<label class="quick-client-field"><span>Número / portal</span><div class="quick-client-control"><input id="mo-qc-number" type="text" value="' + _esc(_manualOrderState.customerAddressNumber || '') + '" placeholder="Nº"></div></label>' +
            '<label class="quick-client-field"><span>Piso / referência</span><div class="quick-client-control"><input id="mo-qc-complement" type="text" value="' + _esc(_manualOrderState.customerAddressComplement || '') + '" placeholder="Piso, porta ou referência"></div></label>' +
            '<label class="quick-client-field"><span>Bairro</span><div class="quick-client-control"><input id="mo-qc-neighborhood" type="text" value="' + _esc(_manualOrderState.customerNeighborhood || '') + '" placeholder="Bairro"></div></label>' +
            '<label class="quick-client-field"><span>Localidade</span><div class="quick-client-control"><input id="mo-qc-city" type="text" value="' + _esc(_manualOrderState.customerCity || '') + '" placeholder="Cidade"></div></label>' +
            '<label class="quick-client-field"><span>Província</span><div class="quick-client-control"><input id="mo-qc-province" type="text" value="' + _esc(_manualOrderState.customerProvince || '') + '" placeholder="Província"></div></label>' +
            '<label class="quick-client-field"><span>País</span><div class="quick-client-control"><input id="mo-qc-country" type="text" value="' + _esc(_manualOrderState.customerCountry || '') + '" placeholder="País"></div></label>' +
          '</div>' +
        '</section>' +
      '</div>' +
      '<div style="padding:13px 20px;border-top:1px solid #F0E8E3;background:#fff;display:flex;justify-content:flex-end;align-items:center;gap:12px;flex:0 0 auto;">' +
        '<div style="display:flex;gap:10px;"><button type="button" onclick="Modules.Pedidos._closeManualOrderQuickCustomer()" style="height:40px;padding:0 14px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;">Cancelar</button><button type="button" onclick="Modules.Pedidos._saveManualOrderQuickCustomer()" style="height:40px;padding:0 16px;border-radius:10px;border:0;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">Salvar cliente</button></div>' +
      '</div>';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.onclick = function (event) { if (event.target === overlay) _closeManualOrderQuickCustomer(); };
    setTimeout(function () {
      if (window.BocaPlaces) {
        BocaPlaces.init('mo-qc-address', { onPlace: function (data) { _manualOrderApplyPlace('mo-qc-', data, false); } });
      }
    }, 200);
  }

  function _closeManualOrderQuickCustomer() {
    var el = document.getElementById('manual-order-quick-customer');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function _saveManualOrderQuickCustomer() {
    var name = String((document.getElementById('mo-qc-name') || {}).value || '').trim();
    var phone = _manualPhoneFull(String((document.getElementById('mo-qc-phone-prefix') || {}).value || '').trim(), String((document.getElementById('mo-qc-phone') || {}).value || '').trim());
    var email = String((document.getElementById('mo-qc-email') || {}).value || '').trim();
    var address = String((document.getElementById('mo-qc-address') || {}).value || '').trim();
    var number = String((document.getElementById('mo-qc-number') || {}).value || '').trim();
    var complement = String((document.getElementById('mo-qc-complement') || {}).value || '').trim();
    var neighborhood = String((document.getElementById('mo-qc-neighborhood') || {}).value || '').trim();
    var city = String((document.getElementById('mo-qc-city') || {}).value || '').trim();
    var province = String((document.getElementById('mo-qc-province') || {}).value || '').trim();
    var country = String((document.getElementById('mo-qc-country') || {}).value || '').trim();
    var postalCode = String((document.getElementById('mo-qc-postal-code') || {}).value || '').trim();
    var zone = neighborhood || postalCode;
    if (!(name || phone || email)) {
      UI.toast('Informe nome, WhatsApp ou e-mail para cadastrar o cliente.', 'error');
      return;
    }
    var channel = String(_manualOrderState.channel || 'manual');
    var payload = {
      name: name || phone || email || 'Cliente',
      phone: phone,
      whatsapp: phone,
      email: email,
      address: address,
      number: number,
      complement: complement,
      neighborhood: neighborhood,
      city: city,
      province: province,
      country: country,
      postalCode: postalCode,
      zone: zone,
      deliveryAddresses: (address || postalCode || neighborhood) ? [{
        id: 'principal',
        label: 'Endereço principal',
        address: address,
        number: number,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        province: province,
        country: country,
        postalCode: postalCode
      }] : [],
      status: 'ativo',
      origin: channel,
      mainChannel: channel,
      channelName: channel,
      acceptsMarketing: false,
      preferences: '',
      allergies: '',
      notes: '',
      internalNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    DB.add('store_customers', payload).then(function (ref) {
      var id = String((ref && ref.id) || ref || '');
      var customer = Object.assign({}, payload, { id: id });
      _customers.push(customer);
      _manualOrderState.customerQuery = '';
      _manualOrderSelectCustomer(id);
      _closeManualOrderQuickCustomer();
      UI.toast('Cliente cadastrado e selecionado.', 'success');
    }).catch(function (err) {
      UI.toast('Erro ao cadastrar cliente: ' + (err && err.message ? err.message : 'falha ao salvar'), 'error');
    });
  }

  function _manualOrderCanSubmit() {
    var name = String(_manualOrderState.customerName || '').trim();
    var phone = String(_manualOrderState.customerPhone || '').trim();
    var type = String(_manualOrderState.type || 'delivery').trim();
    var total = _manualOrderTotals().total || 0;
    return (!!name || !!phone) && !!type && (_manualOrderState.items || []).length > 0 && total > 0;
  }

  function _manualOrderUpdateSubmitState() {
    var btn = document.getElementById('mo-submit-btn');
    if (!btn) return;
    var can = _manualOrderCanSubmit();
    btn.disabled = !can;
    btn.style.opacity = can ? '1' : '.5';
    btn.style.cursor = can ? 'pointer' : 'not-allowed';
  }

  function _closeManualOrderModal() {
    var el = document.getElementById('manual-order-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    window._newOrderModal = null;
  }

  function _toggleAlarm() {
    _alarmOn = !_alarmOn;
    _saveAlarmPreference();
    _paintAlarmButton();
    if (_alarmOn && !_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    UI.toast('Alarme ' + (_alarmOn ? 'ativado' : 'desativado'), 'info');
  }

  function _testAlarm() {
    _playAlarm(true);
  }

  function _readAlarmPreference() {
    try {
      return window.localStorage && localStorage.getItem('bocafood:kitchenAlarm') === 'on';
    } catch (e) {
      return false;
    }
  }

  function _saveAlarmPreference() {
    try {
      if (window.localStorage) localStorage.setItem('bocafood:kitchenAlarm', _alarmOn ? 'on' : 'off');
    } catch (e) {}
  }

  function _paintAlarmButton() {
    var btn = document.getElementById('alarm-btn');
    if (!btn) return;
    btn.innerHTML = '<span class="mi" style="font-size:17px;color:' + (_alarmOn ? '#B42318' : '#8A7E7C') + ';">notifications</span>Alarme: ' + (_alarmOn ? 'ON' : 'OFF');
    btn.style.background = _alarmOn ? '#FFF7F5' : '#fff';
    btn.style.borderColor = _alarmOn ? '#E4CFC8' : '#E6E1D8';
  }

  function _playAlarm(force) {
    if (!_alarmOn && !force) return;
    try {
      if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (_audioCtx.state === 'suspended' && _audioCtx.resume) _audioCtx.resume();
      var start = _audioCtx.currentTime + 0.02;
      for (var i = 0; i < 7; i++) {
        _alarmTone(start + i * 0.34, 0.22, i % 2 ? 740 : 980);
      }
    } catch (e) { console.warn('Audio not available'); }
  }

  function _alarmTone(start, duration, frequency) {
    var osc = _audioCtx.createOscillator();
    var gain = _audioCtx.createGain();
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.setValueAtTime(frequency * 0.82, start + duration * 0.52);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.55, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function _num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var str = String(v == null ? '' : v).trim();
    if (!str) return 0;
    var cleaned = str.replace(/[^\d,.-]/g, '');
    if (!cleaned) return 0;
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    else cleaned = cleaned.replace(/,/g, '');
    var n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function _itemMoneyTotal(item) {
    item = item || {};
    var qty = _num(item.qty != null ? item.qty : item.quantity != null ? item.quantity : 1) || 1;
    var direct = _num(item.total != null ? item.total : item.subtotal != null ? item.subtotal : item.lineTotal != null ? item.lineTotal : 0);
    if (direct > 0) return direct;
    var unit = _num(item.finalPrice != null ? item.finalPrice : item.price != null ? item.price : item.unitPrice != null ? item.unitPrice : item.promoUnitPrice != null ? item.promoUnitPrice : 0);
    return unit * qty;
  }

  function _normalizeMoneyAgainstExpected(rawValue, expected) {
    var raw = _num(rawValue);
    expected = _num(expected);
    if (!(raw > 0) || !(expected > 0)) return raw;
    var divided = raw / 100;
    if (raw > expected * 50 && Math.abs(divided - expected) <= Math.max(0.05, expected * 0.03)) return +divided.toFixed(2);
    return raw;
  }

  function _orderItemsSubtotalForMoney(order) {
    var items = Array.isArray(order && order.items) ? order.items : [];
    return items.reduce(function (sum, item) { return sum + _itemMoneyTotal(item); }, 0);
  }

  function _orderFinanceTotal(order) {
    order = order || {};
    var raw = order.total != null ? order.total : order.finalSubtotal != null ? order.finalSubtotal : order.subtotal != null ? order.subtotal : 0;
    var itemsSubtotal = _orderItemsSubtotalForMoney(order);
    var deliveryFee = _num(order.deliveryFee != null ? order.deliveryFee : order.shippingFee != null ? order.shippingFee : order.fee || 0);
    var couponDiscount = _num(order.couponDiscountTotal != null ? order.couponDiscountTotal : order.couponDiscount || 0);
    var pointsDiscount = _num(order.pointsDiscountTotal != null ? order.pointsDiscountTotal : order.pointsDiscount || 0);
    var expected = itemsSubtotal > 0 ? Math.max(0, itemsSubtotal + deliveryFee - couponDiscount - pointsDiscount) : 0;
    return _normalizeMoneyAgainstExpected(raw, expected || itemsSubtotal);
  }

  function _orderHasInflatedMoneyScale(order) {
    order = order || {};
    var raw = _num(order.total != null ? order.total : order.finalSubtotal != null ? order.finalSubtotal : order.subtotal != null ? order.subtotal : 0);
    var normalized = _orderFinanceTotal(order);
    return raw > 0 && normalized > 0 && raw > normalized * 50 && Math.abs((raw / 100) - normalized) <= Math.max(0.05, normalized * 0.03);
  }

  function _repairInflatedFinanceMovements(list) {
    (list || []).forEach(function (order) {
      var id = String(order && order.id || '');
      if (!id || _financeScaleRepairIds[id]) return;
      if (!_orderHasInflatedMoneyScale(order)) return;
      _financeScaleRepairIds[id] = true;
      _syncOrderFinanceMovement(id, order).catch(function () {});
    });
  }

  function _clean(v) {
    return String(v == null ? '' : v).trim().toLowerCase();
  }

  function _phone(v) {
    return String(v == null ? '' : v).replace(/\D/g, '');
  }

  function _phoneMatchKey(v) {
    var digits = _phone(v);
    return digits.length >= 6 ? digits : '';
  }

  function _customerPhoneMatchIsUnique(phone, customerId) {
    var key = _phoneMatchKey(phone);
    if (!key) return false;
    var matches = (_customers || []).filter(function (c) {
      return _phoneMatchKey(c.phone || c.whatsapp || '') === key;
    });
    if (matches.length !== 1) return false;
    if (!customerId) return true;
    return _customerRecordId(matches[0]) === String(customerId || '');
  }

  function _dateTs(o) {
    if (!o) return 0;
    var raw = o.createdAt || o.date || o.data || o.updatedAt || o.paidAt || o.timestamp || '';
    if (raw && typeof raw.toDate === 'function') return raw.toDate().getTime();
    var d = new Date(raw);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function _fmtDate(o) {
    var ts = _dateTs(o);
    return ts ? UI.fmtDate(new Date(ts)) : '-';
  }

  function _ordersForClient(c) {
    var id = _customerRecordId(c);
    var name = _clean(c && c.name || '');
    var phone = _phoneMatchKey(c && (c.phone || c.whatsapp) || '');
    var email = _clean(c && c.email || '');
    var uniquePhone = phone && _customerPhoneMatchIsUnique(phone, id);
    return (_orders || []).filter(function (o) {
      var orderCustomerId = String(o.customerId || o.clientId || o.customerUid || '').trim();
      if (orderCustomerId) return !!id && orderCustomerId === id;
      if (uniquePhone && _phoneMatchKey(o.phone || o.customerPhone || o.whatsapp) === phone) return true;
      if (email && _clean(o.email || o.customerEmail) === email) return true;
      if (name && _clean(o.customerName || o.clientName || o.name) === name) return true;
      return false;
    }).sort(function (a, b) { return _dateTs(b) - _dateTs(a); });
  }

  function _reviewStatusLabel(review) {
    if (review && (review.approved || String(review.status || '').toLowerCase() === 'approved')) {
      return { key: 'approved', label: 'Aprovada', tone: '#1A9E5A', bg: '#EDFAF3' };
    }
    if (review && (review.rejected || String(review.status || '').toLowerCase() === 'rejected')) {
      return { key: 'rejected', label: 'Rejeitada', tone: '#C4362A', bg: '#FFF0EE' };
    }
    return { key: 'pending', label: 'Pendente', tone: '#D97706', bg: '#FFF8E8' };
  }

  function _reviewSourceLabel(review) {
    var raw = String((review && (review.source || review.origin || review.channel || review.from || review.createdFrom)) || '').trim().toLowerCase();
    if (!raw) return '';
    if (raw === 'store' || raw === 'storefront' || raw === 'public' || raw === 'template' || raw === 'public-review' || raw === 'review-public') return 'Cardápio';
    if (raw === 'admin' || raw === 'manual') return 'Admin';
    if (raw === 'whatsapp') return 'WhatsApp';
    if (raw === 'order' || raw === 'pedido') return 'Pedido';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function _tags(raw) {
    if (Array.isArray(raw)) {
      return raw.map(function (x) { return String(x).trim(); }).filter(Boolean);
    }
    return String(raw || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function _normalizeCanais(raw) {
    var list = raw && Array.isArray(raw.list) ? raw.list : [];
    var items = [
      { name: 'Cardápio', locked: true }
    ];
    if (_isTpvEnabledForChannels()) items.push({ name: 'Venda presencial', locked: true });
    var seen = {};
    items.forEach(function (item) { seen[_channelAliasKey(item.name)] = true; });
    list.forEach(function (c) {
      var name = c && (c.name || c.nome || c.label);
      if (!name || c.active === false || c.ativo === false || c.enabled === false) return;
      var key = _channelAliasKey(name);
      var normalized = Object.assign({}, c, { name: _salesChannelDisplayName(name) });
      var existingIdx = items.findIndex(function (item) { return _channelAliasKey(item.name) === key; });
      if (existingIdx >= 0) items[existingIdx] = Object.assign({}, normalized, { name: items[existingIdx].name, locked: items[existingIdx].locked || !!c.locked });
      else if (!seen[key]) {
        seen[key] = true;
        items.push(normalized);
      }
    });
    return items;
  }

  function _channelAliasKey(value) {
    var key = _fold(value || '').replace(/\s+/g, ' ').trim();
    if (key === 'tpv' || key === 'venda presencial' || key === 'venda-presencial') return 'venda-presencial';
    if (key === 'cardapio' || key === 'cardápio' || key === 'template' || key === 'store' || key === 'storefront' || key === 'loja online' || key === 'loja-online' || key === 'public') return 'cardapio';
    return key;
  }

  function _salesChannelDisplayName(value) {
    var key = _channelAliasKey(value);
    if (key === 'cardapio') return 'Cardápio';
    if (key === 'venda-presencial') return 'Venda presencial';
    return _firstText(value && value.name, value && value.nome, value && value.label, value, '');
  }

  function _isTpvEnabledForChannels() {
    var tpv = _tpvConfig || {};
    return tpv.enabled === true || tpv.tpvEnabled === true || tpv.active === true;
  }

  function _salesChannelByName(value) {
    var key = _channelAliasKey(value);
    return (_canais || []).find(function (ch) {
      return _channelAliasKey(_firstText(ch.name, ch.nome, ch.label, ch.key, '')) === key;
    }) || null;
  }

  function _channelIncomeCategoryMeta(channel) {
    channel = channel || {};
    var id = _firstText(channel.entradaCategoriaId, channel.incomeCategoryId, channel.categoriaEntradaId, channel.financialCategoryId, channel.categoriaFinanceiraId, channel.categoryId, '');
    var name = _firstText(channel.entradaCategoriaNome, channel.incomeCategoryName, channel.categoriaEntradaNome, channel.financialCategoryName, channel.categoriaFinanceiraNome, channel.categoryName, '');
    return { id: String(id || '').trim(), name: String(name || '').trim() };
  }

  function _orderIncomeCategoryMeta(order) {
    order = order || {};
    var direct = _channelIncomeCategoryMeta(order);
    if (direct.id || direct.name) return direct;
    var channel = _salesChannelByName(_firstText(order.channel, order.source, order.originChannel, order.originSource, ''));
    return _channelIncomeCategoryMeta(channel || {});
  }

  function _orderChannelMeta(order) {
    order = order || {};
    var raw = _firstText(order.channel, order.source, order.originChannel, order.originSource, '');
    var channel = _salesChannelByName(raw) || {};
    var label = _salesChannelDisplayName(_firstText(channel.name, raw, ''));
    return { raw: raw, label: label, channel: channel };
  }

  function _paymentMethodLabel(value) {
    var raw = _paymentMethodRaw(value);
    var key = _fold(raw || '');
    var labels = {
      cash: 'Dinheiro',
      dinheiro: 'Dinheiro',
      card: 'Cartão',
      cartao: 'Cartão',
      cartao_de_credito: 'Cartão',
      cartão: 'Cartão',
      pix: 'PIX',
      mbway: 'MB Way',
      mb_way: 'MB Way',
      transfer: 'Transferência',
      transferencia: 'Transferência',
      transferência: 'Transferência',
      other: 'Outro',
      outro: 'Outro'
    };
    return labels[key] || _title(raw || '');
  }

  function _paymentMethodOptions(selected) {
    var source = [];
    if (_financeConfig && Array.isArray(_financeConfig.formas_pagamento)) source = _financeConfig.formas_pagamento.slice();
    if (!source.length) source = ['Dinheiro', 'Cartão', 'PIX', 'MB Way', 'Transferência', 'Outro'];
    var selectedRaw = _paymentMethodRaw(selected);
    var selectedValue = _paymentMethodValue(selected);
    var options = [{ value: '', label: 'Sem forma definida' }].concat(source.filter(function (item) {
      if (!item || typeof item !== 'object') return true;
      var raw = _paymentMethodRaw(item);
      return item.ativo !== false || _fold(raw) === _fold(selectedRaw) || _fold(_paymentMethodValue(item)) === _fold(selectedValue);
    }).map(function (item) {
      return { value: _paymentMethodValue(item), label: _paymentMethodLabel(item) };
    }));
    if (selectedValue && !options.some(function (opt) { return _fold(opt.value) === _fold(selectedValue); })) {
      options.push({ value: selectedValue, label: _paymentMethodLabel(selectedRaw || selectedValue) });
    }
    var current = _fold(selectedValue || '');
    return options.map(function (opt) {
      var value = String(opt.value || '');
      var sel = current === _fold(value) || (!current && !value) ? ' selected' : '';
      return '<option value="' + _esc(value) + '"' + sel + '>' + _esc(opt.label) + '</option>';
    }).join('');
  }

  function _paymentMethodValue(value) {
    var raw = _paymentMethodRaw(value);
    var key = _fold(raw || '');
    var map = {
      dinheiro: 'cash',
      cash: 'cash',
      cartao: 'card',
      cartão: 'card',
      card: 'card',
      pix: 'pix',
      mbway: 'mbway',
      'mb-way': 'mbway',
      transfer: 'transfer',
      transferencia: 'transfer',
      transferência: 'transfer',
      outro: 'other',
      other: 'other'
    };
    return map[key] || key;
  }

  function _paymentMethodRaw(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      return _firstText(value.nome, value.name, value.label, value.title, value.id, value.slug, '');
    }
    return String(value || '');
  }

  function _paymentStatusOptions(selected) {
    var options = [
      { value: 'previsto', label: 'A pagar na entrega' },
      { value: 'pending', label: 'Aguardando pagamento online' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'pago', label: 'Já pago integral' },
      { value: 'paid', label: 'Pago online confirmado' },
      { value: 'failed', label: 'Pagamento falhou' },
      { value: 'canceled', label: 'Pagamento cancelado' }
    ];
    var current = _fold(selected || '');
    return options.map(function (opt) {
      var value = String(opt.value || '');
      var sel = current === _fold(value) ? ' selected' : '';
      return '<option value="' + _esc(value) + '"' + sel + '>' + _esc(opt.label) + '</option>';
    }).join('');
  }

  function _paymentStatusLabel(value) {
    var key = _fold(value || '');
    var labels = {
      pago: 'Já pago integral',
      paid: 'Pago online confirmado',
      parcial: 'Parcial',
      previsto: 'A pagar na entrega',
      pending: 'Aguardando pagamento online',
      failed: 'Pagamento falhou',
      canceled: 'Pagamento cancelado',
      cancelado: 'Pagamento cancelado'
    };
    return labels[key] || _title(value || '');
  }

  function _paymentStatusIsPaid(value) {
    var key = _fold(value || '');
    return key === 'pago' || key === 'paid' || key === 'quitado' || key === 'quitada';
  }

  function _paymentStatusIsPartial(value) {
    var key = _fold(value || '');
    return key === 'parcial' || key === 'partial' || key === 'partially_paid';
  }

  function _paymentStatusFinanceStatus(value) {
    var key = _fold(value || '');
    if (_paymentStatusIsPaid(key)) return 'efetivado';
    if (_paymentStatusIsPartial(key)) return 'parcial';
    return 'previsto';
  }

  function _orderChannelFinancialPatch(order, grossTotal) {
    order = order || {};
    grossTotal = _num(grossTotal);
    var meta = _orderChannelMeta(order);
    var channel = meta.channel || {};
    var manual = order.channelFeesManual === true || order.channelFeeManual === true || order.channelFeesEdited === true;
    var commissionPct = _num(manual && order.channelCommissionPct != null ? order.channelCommissionPct : (channel.commissionPct != null ? channel.commissionPct : order.channelCommissionPct));
    var taxPct = _num(manual && order.channelCommissionTaxPct != null ? order.channelCommissionTaxPct : (channel.taxPct != null ? channel.taxPct : order.channelCommissionTaxPct));
    var fixedFee = _num(manual && order.channelFixedFee != null ? order.channelFixedFee : (channel.fixedFee != null ? channel.fixedFee : order.channelFixedFee));
    var commissionAmount = grossTotal > 0 && commissionPct > 0 ? +(grossTotal * commissionPct / 100).toFixed(2) : 0;
    var commissionTaxAmount = commissionAmount > 0 && taxPct > 0 ? +(commissionAmount * taxPct / 100).toFixed(2) : 0;
    var fixedFeeAmount = grossTotal > 0 && fixedFee > 0 ? +fixedFee.toFixed(2) : 0;
    var feeTotal = +(commissionAmount + commissionTaxAmount + fixedFeeAmount).toFixed(2);
    var net = Math.max(0, +(grossTotal - feeTotal).toFixed(2));
    var effectivePct = commissionPct + (commissionPct > 0 && taxPct > 0 ? (commissionPct * taxPct / 100) : 0);
    return {
      grossOrderTotal: grossTotal,
      grossAmount: grossTotal,
      channelFeeTotal: feeTotal,
      channelFeesTotal: feeTotal,
      channelCommissionPct: commissionPct,
      channelCommissionTaxPct: taxPct,
      channelEffectiveCommissionPct: +effectivePct.toFixed(4),
      channelFixedFee: fixedFee,
      channelCommissionAmount: commissionAmount,
      channelCommissionTaxAmount: commissionTaxAmount,
      channelFixedFeeAmount: fixedFeeAmount,
      channelFeeDiscountTotal: feeTotal,
      financialDiscountTotal: feeTotal,
      netReceivable: net,
      liquidReceivable: net,
      financialNetAmount: net,
      channelFeesManual: manual,
      channelFeesEdited: manual,
      channelFeeBreakdown: {
        channel: String(meta.raw || ''),
        channelName: String(meta.label || ''),
        commissionPct: commissionPct,
        taxPct: taxPct,
        effectiveCommissionPct: +effectivePct.toFixed(4),
        fixedFee: fixedFee,
        commissionAmount: commissionAmount,
        commissionTaxAmount: commissionTaxAmount,
        fixedFeeAmount: fixedFeeAmount,
        totalFees: feeTotal,
        grossTotal: grossTotal,
        netReceivable: net,
        manual: manual
      }
    };
  }

  function _detailChannelFeeInputsHTML(order, payment) {
    var costs = (payment && payment.channelCosts) || _orderChannelFinancialPatch(order || {}, _num(payment && payment.total));
    var channelName = _firstText(costs.channelFeeBreakdown && costs.channelFeeBreakdown.channelName, order && order.channel, order && order.source, 'Canal');
    var hasRule = _num(costs.channelCommissionPct) > 0 || _num(costs.channelCommissionTaxPct) > 0 || _num(costs.channelFixedFee) > 0 || _num(costs.channelFeeTotal) > 0;
    if (!hasRule) return '';
    return '<div style="margin-top:9px;border:1px solid #EFE4DC;border-radius:13px;background:#FFFCF8;padding:10px;display:grid;gap:8px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
        '<div style="min-width:0;"><div style="font-size:11px;font-weight:800;color:#1F1F1F;">Taxas do canal de venda</div><div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc(channelName) + ' · abatem do pedido para calcular o saldo que entra no Financeiro.</div></div>' +
        '<span style="font-size:10px;font-weight:800;color:' + (costs.channelFeesManual ? '#9A3412' : '#2F6B57') + ';background:#fff;border:1px solid #EADFD8;border-radius:999px;padding:5px 8px;">' + (costs.channelFeesManual ? 'Editado manualmente' : 'Automático') + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">' +
        '<div><label class="order-detail-label">Comissão %</label><div class="order-detail-field-control order-detail-field-control-sm"><input id="detail-channel-commission-pct" type="number" step="0.01" value="' + _esc(String(_num(costs.channelCommissionPct))) + '"></div></div>' +
        '<div><label class="order-detail-label">Imposto comissão %</label><div class="order-detail-field-control order-detail-field-control-sm"><input id="detail-channel-tax-pct" type="number" step="0.01" value="' + _esc(String(_num(costs.channelCommissionTaxPct))) + '"></div></div>' +
        '<div><label class="order-detail-label">Taxa fixa</label><div class="order-detail-field-control order-detail-field-control-sm"><input id="detail-channel-fixed-fee" type="number" step="0.01" value="' + _esc(String(_num(costs.channelFixedFee))) + '"></div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-size:11px;color:#6F6860;">' +
        '<div style="background:#fff;border:1px solid #EFE4DC;border-radius:10px;padding:8px;">Taxas calculadas: <strong style="color:#1F1F1F;">' + _esc(UI.fmt(costs.channelFeeTotal || 0)) + '</strong></div>' +
        '<div style="background:#fff;border:1px solid #EFE4DC;border-radius:10px;padding:8px;">Entrada no Financeiro: <strong style="color:#1F1F1F;">' + _esc(UI.fmt(costs.netReceivable || 0)) + '</strong></div>' +
      '</div>' +
    '</div>';
  }

  function _orderPaymentStatus(order) {
    order = order || {};
    var direct = _firstText(order.paymentStatus, order.paymentState, order.statusPayment, order.payStatus, '');
    if (direct) return String(direct).trim();
    var legacy = String(order.payment || '').trim();
    var key = _fold(legacy);
    if (key === 'pago' || key === 'parcial' || key === 'previsto') return legacy;
    return 'previsto';
  }

  function _orderFinanceAccountId(order) {
    order = order || {};
    if (_isTpvOrder(order)) return String(order.cashAccountId || order.tpvCashAccountId || (_tpvConfig && _tpvConfig.cashAccountId) || '');
    return String(order.conta_id || order.contaBancariaId || order.accountId || '');
  }

  function _isTpvOrder(order) {
    var channel = _fold(_firstText(order && order.channel, order && order.source, order && order.originChannel, order && order.originSource, ''));
    return channel === 'tpv' || channel === 'venda presencial';
  }

  function _syncOrderFinanceMovement(orderId, order) {
    orderId = String(orderId || '');
    if (!orderId) return Promise.resolve(false);
    order = order || {};
    var grossTotal = _orderFinanceTotal(order);
    var channelFinancial = _orderChannelFinancialPatch(order, grossTotal);
    Object.assign(order, channelFinancial);
    var total = _num(channelFinancial.netReceivable != null ? channelFinancial.netReceivable : grossTotal);
    var paymentStatus = _orderPaymentStatus(order);
    var grossPaidAmount = _normalizeMoneyAgainstExpected(order.paidAmount != null ? order.paidAmount : order.amountPaid != null ? order.amountPaid : order.valuePaid != null ? order.valuePaid : 0, grossTotal);
    var paidAmount = grossTotal > 0 && total > 0 ? +(grossPaidAmount * (total / grossTotal)).toFixed(2) : grossPaidAmount;
    if (_paymentStatusIsPaid(paymentStatus)) paidAmount = total;
    if (!_paymentStatusIsPartial(paymentStatus)) paidAmount = _paymentStatusIsPaid(paymentStatus) ? total : 0;
    var finStatus = _paymentStatusFinanceStatus(paymentStatus);
    var data = (finStatus === 'previsto'
      ? (_firstText(order.deliveryDate, order.deliveryDateISO, order.scheduleDate, order.createdAt, _today()))
      : (_firstText(order.paidAt, order.updatedAt, order.createdAt, _today())));
    var financeAccountId = _orderFinanceAccountId(order);
    var channelMeta = _orderChannelMeta(order);
    var incomeCategory = _orderIncomeCategoryMeta(order);
    var payload = {
      origem: 'pedido',
      pedidoId: orderId,
      pedidoNumero: _orderDisplayId(order) || orderId,
      tipo: 'entrada',
      descricao: 'Pedido ' + (_orderDisplayId(order) || orderId),
      data: data && String(data).slice(0, 10) ? String(data).slice(0, 10) : _today(),
      status: finStatus,
      valor: total,
      valorTotalOriginal: total,
      valorParcela: total,
      valorRecebido: paidAmount,
      saldoRestante: Math.max(0, total - paidAmount),
      valorBrutoPedido: grossTotal,
      grossOrderTotal: grossTotal,
      valorLiquidoReceber: total,
      netReceivable: total,
      liquidReceivable: total,
      channelFeeTotal: _num(channelFinancial.channelFeeTotal),
      channelFeesTotal: _num(channelFinancial.channelFeeTotal),
      channelCommissionPct: _num(channelFinancial.channelCommissionPct),
      channelCommissionTaxPct: _num(channelFinancial.channelCommissionTaxPct),
      channelEffectiveCommissionPct: _num(channelFinancial.channelEffectiveCommissionPct),
      channelFixedFee: _num(channelFinancial.channelFixedFee),
      channelCommissionAmount: _num(channelFinancial.channelCommissionAmount),
      channelCommissionTaxAmount: _num(channelFinancial.channelCommissionTaxAmount),
      channelFixedFeeAmount: _num(channelFinancial.channelFixedFeeAmount),
      channelFeeBreakdown: channelFinancial.channelFeeBreakdown || {},
      forma_pagamento: _paymentMethodLabel(order.paymentMethod || ''),
      paymentMethod: String(order.paymentMethod || ''),
      paymentStatus: paymentStatus,
      channel: String(channelMeta.raw || ''),
      salesChannel: String(channelMeta.label || ''),
      canalVenda: String(channelMeta.label || ''),
      customerId: String(order.customerId || order.clientId || ''),
      pessoaId: String(order.customerId || order.clientId || ''),
      pessoaNome: String(order.customerName || order.clientName || order.name || ''),
      customerName: String(order.customerName || order.clientName || order.name || ''),
      phone: String(order.customerPhone || order.phone || order.whatsapp || ''),
      updatedAt: new Date().toISOString()
    };
    if (financeAccountId) {
      payload.conta_id = financeAccountId;
      payload.contaBancariaId = financeAccountId;
    }
    if (incomeCategory.id || incomeCategory.name) {
      payload.categoria = String(incomeCategory.name || '');
      payload.categoriaId = String(incomeCategory.id || '');
      payload.categoriaFinanceiraId = String(incomeCategory.id || '');
      payload.categoriaFinanceiraNome = String(incomeCategory.name || '');
      payload.categoriaFinanceiraTipo = 'entrada';
      payload.categoriaFinanceiraNatureza = 'receita';
      payload.financialNature = 'receita';
    }
    function persistOrderFinancialPatch(extra) {
      var patch = Object.assign({}, channelFinancial, extra || {}, {
        financeMovementSyncedAt: _nowIso()
      });
      Object.assign(order, patch);
      return DB.update('orders', orderId, patch).then(function () { return true; }).catch(function () { return true; });
    }
    if (order.financeMovementId) {
      return DB.update('movimentacoes', order.financeMovementId, payload).then(function () {
        return persistOrderFinancialPatch({ financeMovementId: order.financeMovementId });
      }).catch(function () { return false; });
    }
    return DB.getAll('movimentacoes').then(function (list) {
      var found = (list || []).find(function (m) { return String(m.pedidoId || m.orderId || m.origemPedidoId || '') === orderId; });
      if (found && found.id) {
        order.financeMovementId = found.id;
        return DB.update('movimentacoes', found.id, payload).then(function () {
          return persistOrderFinancialPatch({ financeMovementId: found.id });
        });
      }
      return DB.add('movimentacoes', payload).then(function (ref) {
        var refId = String((ref && ref.id) || '');
        if (refId) order.financeMovementId = refId;
        return persistOrderFinancialPatch(refId ? { financeMovementId: refId } : {});
      });
    }).catch(function () { return false; });
  }

  function _segmentLabel(v) {
    return ({
      novo: 'Novo',
      recorrente: 'Recorrente',
      vip: 'VIP',
      inativo: 'Inativo',
      sem_pedido: 'Sem pedido',
      ativo: 'Ativo',
      bloqueado: 'Bloqueado'
    })[v] || _title(v || '');
  }

  function _title(v) {
    return String(v || '').replace(/_/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function _smallSelect() {
    return 'padding:11px 14px;border:1.5px solid #D4C8C6;border-radius:20px;background:#fff;font-size:13px;font-weight:800;font-family:inherit;outline:none;';
  }

  function _esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }

  function destroy() {
    _closeKitchenMode();
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    _orders = [];
    _customers = [];
    _reviews = [];
    _knownIds = null;
  }

  return {
    render: render, destroy: destroy,
    _switchTab: _switchTab, _setUi: _setUi,
    _setOrdersPage: _setOrdersPage, _setOrdersPageSize: _setOrdersPageSize,
    _setKitchenPage: _setKitchenPage, _setKitchenPageSize: _setKitchenPageSize,
    _setClientPage: _setClientPage, _setClientPageSize: _setClientPageSize,
    _clearKitchenFilters: _clearKitchenFilters, _clearOrderFilters: _clearOrderFilters, _clearClientFilters: _clearClientFilters,
    _setReviewUi: _setReviewUi, _setReviewPage: _setReviewPage, _setReviewPageSize: _setReviewPageSize,
    _onDragStart: _onDragStart, _onDragEnd: _onDragEnd, _onDrop: _onDrop,
    _openDetail: _openDetail, _toggleItem: _toggleItem, _removeDetailItem: _removeDetailItem, _openDetailChoicesModal: _openDetailChoicesModal, _saveDetailChoices: _saveDetailChoices, _closeDetailChoicesModal: _closeDetailChoicesModal, _formatDetailMoneyField: _formatDetailMoneyField, _saveDetail: _saveDetail,
    _saveOrderCustomer: _saveOrderCustomer, _openOrderCustomerModal: _openOrderCustomerModal,
    _closeCustomerModal: _closeCustomerModal, _closeDetailModal: _closeDetailModal,
    _showDetailWhatsappPrompt: _showDetailWhatsappPrompt, _hideDetailWhatsappPrompt: _hideDetailWhatsappPrompt,
    _sendDetailWhatsapp: _sendDetailWhatsapp,
    _saveKitchenDetail: _saveKitchenDetail, _waFromDetail: _waFromDetail, _waFromKitchenDetail: _waFromKitchenDetail, _whatsapp: _whatsapp, _cancelOrder: _cancelOrder,
    _openNewOrder: _openNewOrder, _openTpvOrder: _openTpvOrder, _createTpvOrder: _createTpvOrder, _saveNewOrder: _saveNewOrder,
    _manualOrderSearchCustomers: _manualOrderSearchCustomers,
    _manualOrderFocusCustomers: _manualOrderFocusCustomers,
    _manualOrderChooseCustomer: _manualOrderChooseCustomer,
    _manualOrderSyncPhoneFromParts: _manualOrderSyncPhoneFromParts,
    _manualOrderSearchItems: _manualOrderSearchItems,
    _manualOrderField: _manualOrderField,
    _manualOrderSetType: _manualOrderSetType,
    _manualOrderSetDeliveryAddress: _manualOrderSetDeliveryAddress,
    _manualOrderSetAdjustment: _manualOrderSetAdjustment,
    _manualOrderSetShippingFee: _manualOrderSetShippingFee,
    _manualOrderSetPaymentMethod: _manualOrderSetPaymentMethod,
    _manualOrderSetChannel: _manualOrderSetChannel,
    _manualOrderSetPaymentStatus: _manualOrderSetPaymentStatus,
    _manualOrderSetPaidAmount: _manualOrderSetPaidAmount,
    _manualOrderSetOrderTime: _manualOrderSetOrderTime,
    _manualOrderSetDeliveryDate: _manualOrderSetDeliveryDate,
    _manualOrderSetDeliveryTime: _manualOrderSetDeliveryTime,
    _manualOrderSetMadeToOrder: _manualOrderSetMadeToOrder,
    _manualOrderSetProductionLeadDays: _manualOrderSetProductionLeadDays,
    _manualOrderSetProductFilter: _manualOrderSetProductFilter,
    _manualOrderSetCategoryFilter: _manualOrderSetCategoryFilter,
    _manualOrderSelectCustomer: _manualOrderSelectCustomer,
    _manualOrderAddProduct: _manualOrderAddProduct,
    _manualOrderSyncChoiceGroup: _manualOrderSyncChoiceGroup,
    _saveManualOrderChoices: _saveManualOrderChoices,
    _closeManualOrderChoicesModal: _closeManualOrderChoicesModal,
    _manualOrderChangeQty: _manualOrderChangeQty,
    _manualOrderRemoveProduct: _manualOrderRemoveProduct,
    _manualOrderMaybeSyncShipping: _manualOrderMaybeSyncShipping,
    _openManualOrderQuickCustomer: _openManualOrderQuickCustomer,
    _closeManualOrderQuickCustomer: _closeManualOrderQuickCustomer,
    _saveManualOrderQuickCustomer: _saveManualOrderQuickCustomer,
    _closeManualOrderModal: _closeManualOrderModal,
    _openClientProfile: _openClientProfile, _openClientHistory: _openClientHistory, _openClientEdit: _openClientEdit, _openReview: _openReview,
    _renderCatalogoAvaliacoes: _renderCatalogoAvaliacoes,
    _approveReview: _approveReview, _rejectReview: _rejectReview, _resetReviewFilters: _resetReviewFilters,
    _toggleAlarm: _toggleAlarm, _testAlarm: _testAlarm,
    _openKitchenMode: _openKitchenMode, _closeKitchenMode: _closeKitchenMode,
    _closeKitchenDetailPanel: _closeKitchenDetailPanel,
    _showKitchenWhatsappPrompt: _showKitchenWhatsappPrompt,
    _closeKitchenWhatsappPrompt: _closeKitchenWhatsappPrompt,
    _sendKitchenWhatsapp: _sendKitchenWhatsapp,
	    _detailPaymentSync: _detailPaymentSync,
	    _refreshDetailView: _refreshDetailView,
	    _openOrderStockResolution: _openOrderStockResolution,
	    _saveOrderStockResolution: _saveOrderStockResolution,
	    _applyPointsDiscount: _applyPointsDiscount,
	    _quickStatus: _quickStatus
	  };
})();
