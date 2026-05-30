// js/modules/dashboard.js
window.Modules = window.Modules || {};
Modules.Dashboard = (function () {
  'use strict';

  var _loading = false;
  var _loaded = false;
  var _loadPromise = null;
  var _onboardingRemote = { loaded: false, loading: false, docId: '', data: null };
  var _onboardingLocalSeq = 0;
  var _onboardingPersistTimer = null;
  var _onboardingLastAction = '';
  var _onboardingDataHooksInstalled = false;
  var _onboardingRefreshTimer = null;
  var _data = {
    orders: [],
    products: [],
    entries: [],
    exits: [],
    accounts: [],
    snapshots: [],
    monthScenarios: [],
    monthScenario: null,
    channels: {},
    moneyConfig: {},
    purchaseItems: [],
    recipes: [],
    purchases: [],
    stockMovements: [],
    seasons: [],
    geral: {},
    template: {},
    operacao: {}
  };
  var ONBOARDING_VERSION = '2026-05-28-v10';

  function render() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '' +
      '<div class="module-page dash-root" style="padding:24px;display:flex;flex-direction:column;gap:18px;">' +
        '<style>' +
          '.dash-card{background:#fff;border:none;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);}' +
          '.dash-kpi{transition:transform .16s ease,box-shadow .16s ease,background .16s ease;}' +
          '.dash-kpi:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(31,31,31,.09);background:#fff;}' +
          '.dash-action{transition:transform .15s ease,box-shadow .15s ease,background .15s ease;}' +
          '.dash-action:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(31,31,31,.08);background:#FFFEFC;}' +
          '.dash-soft-btn{transition:transform .15s ease,box-shadow .15s ease,background .15s ease;}' +
          '.dash-soft-btn:hover{transform:translateY(-1px);box-shadow:0 10px 20px rgba(31,31,31,.08);}' +
          '.dash-routine-card{transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease;}' +
          '.dash-routine-card:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(31,31,31,.08);border-color:#E1D7C8;}' +
          '.dash-onboarding-float{position:fixed;right:22px;bottom:22px;width:min(360px,calc(100vw - 32px));z-index:80;box-shadow:0 22px 54px rgba(31,31,31,.18);}' +
          '.dash-onboarding-pill{position:fixed;right:22px;bottom:22px;z-index:80;box-shadow:0 14px 30px rgba(31,31,31,.16);}' +
          '.dash-tour-backdrop{position:fixed;inset:0;background:rgba(31,31,31,.06);z-index:90;padding:20px;}' +
          '.dash-tour-modal{width:min(480px,calc(100vw - 28px));background:linear-gradient(180deg,#fff 0%,#FFFEFB 100%);border-radius:24px;box-shadow:0 26px 70px rgba(31,31,31,.22);overflow:hidden;border:1px solid rgba(234,228,218,.95);position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:96;}' +
          '.dash-tour-spotlight{position:fixed;z-index:94;border:2px solid #B6925E;border-radius:14px;box-shadow:0 0 0 9999px rgba(31,31,31,.16),0 14px 34px rgba(31,31,31,.16);pointer-events:none;transition:all .18s ease;}' +
          '.dash-welcome-backdrop{position:fixed;inset:0;background:rgba(31,31,31,.34);z-index:95;display:flex;align-items:center;justify-content:center;padding:20px;}' +
          '.dash-welcome-modal{width:min(720px,100%);background:radial-gradient(circle at 8% 0%,rgba(180,35,24,.10),transparent 34%),linear-gradient(145deg,#fff 0%,#FFFDF9 58%,#FAF6EF 100%);border-radius:26px;box-shadow:0 30px 80px rgba(31,31,31,.24);overflow:hidden;border:1px solid #EAE4DA;position:relative;}' +
          '.dash-welcome-modal:before{content:"";position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(90deg,#B42318,#B6925E);}' +
          '.dash-welcome-point{border:1px solid rgba(234,228,218,.92);background:rgba(255,255,255,.76);border-radius:16px;padding:12px;display:flex;gap:10px;align-items:flex-start;box-shadow:0 10px 22px rgba(31,31,31,.035);}' +
          '.dash-tour-tag{display:inline-flex;align-items:center;gap:7px;min-height:25px;padding:0 10px;border-radius:999px;background:#FFF7EC;border:1px solid #EFE1D0;color:#8A6F5A;font-size:11px;font-weight:750;letter-spacing:.03em;text-transform:uppercase;}' +
          '.dash-tour-detail{display:grid;grid-template-columns:minmax(98px,128px) 1fr;gap:8px;align-items:start;font-size:12px;line-height:1.38;border-radius:11px;padding:7px 8px;background:#FFFEFC;}' +
          '.dash-tour-modal,.dash-welcome-modal,.dash-checklist-modal{scrollbar-width:none;-ms-overflow-style:none;}' +
          '.dash-tour-modal::-webkit-scrollbar,.dash-welcome-modal::-webkit-scrollbar,.dash-checklist-modal::-webkit-scrollbar{display:none;width:0;height:0;}' +
          '@media(max-width:760px){.dash-onboarding-float{right:12px;bottom:12px;width:calc(100vw - 24px);}.dash-onboarding-pill{right:12px;bottom:12px;}.dash-tour-backdrop,.dash-welcome-backdrop{align-items:flex-end;padding:12px;}.dash-tour-modal,.dash-welcome-modal{border-radius:22px;max-height:calc(100dvh - 24px);overflow:auto;}}' +
        '</style>' +
        '<div id="dashboard-content" style="display:flex;flex-direction:column;gap:16px;"><div class="loading-inline">Carregando...</div></div>' +
      '</div>';

    _paint();
    _load().then(function () {
      _paint();
    }).catch(function (err) {
      console.error('Dashboard load error', err);
      _paintError(err);
    });
  }

  function destroy() {}

  function _load() {
    if (_loading && _loadPromise) return _loadPromise;
    _loading = true;
    _loadPromise = Promise.all([
      _safeAll('orders'),
      _safeAll('products'),
      _safeAll('movimentacoes'),
      _safeAll('financeiro_entradas'),
      _safeAll('financeiro_saidas'),
      _safeAll('financeiro_apagar'),
      _safeAll('contas_bancarias'),
      _safeAll('flight_plans'),
      _safeAll('flight_plan_month_scenarios'),
      _safeDoc('flight_plan_month_scenarios', _currentMonthKey()),
      _safeDocRoot('config', 'geral'),
      _safeDocRoot('config', 'template'),
      _safeDocRoot('config', 'operacao'),
      _safeDocRoot('config', 'canais_venda'),
      _safeDocRoot('config', 'dinheiro'),
      _safeAll('itens_custo'),
      _safeAll('fichasTecnicas'),
      _safeAll('compras'),
      _safeAll('seasons'),
      _safeAll('stock_movements')
    ]).then(function (r) {
      _data.orders = Array.isArray(r[0]) ? r[0] : [];
      _data.products = Array.isArray(r[1]) ? r[1] : [];
      _data.entries = _normalizeEntries(r[2], r[3]);
      _data.exits = _normalizeExits(r[4], r[5], r[2]);
      _data.accounts = Array.isArray(r[6]) ? r[6] : [];
      _data.snapshots = Array.isArray(r[7]) ? r[7] : [];
      _data.monthScenarios = Array.isArray(r[8]) ? r[8].filter(Boolean) : [];
      _data.monthScenario = _resolveMonthScenario(_currentMonthKey(), r[9] || null, _data.monthScenarios);
      _data.geral = r[10] || {};
      _data.template = r[11] || {};
      _data.operacao = r[12] || {};
      _data.channels = r[13] || {};
      _data.moneyConfig = r[14] || {};
      _data.purchaseItems = Array.isArray(r[15]) ? r[15] : [];
      _data.recipes = Array.isArray(r[16]) ? r[16] : [];
      _data.purchases = Array.isArray(r[17]) ? r[17] : [];
      _data.seasons = Array.isArray(r[18]) ? r[18] : [];
      _data.stockMovements = Array.isArray(r[19]) ? r[19] : [];
      _loading = false;
      _loaded = true;
    }).catch(function (err) {
      _loading = false;
      _loadPromise = null;
      throw err;
    });
    return _loadPromise;
  }

  function _paint() {
    var content = document.getElementById('dashboard-content');
    if (!content) return;
    if (_loading) {
      content.innerHTML = '<div class="loading-inline">Carregando...</div>';
      return;
    }
    var vm = _buildModel();
    content.innerHTML = _safeHtml('' +
      _header(vm) +
      _quickActions(vm) +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr));gap:16px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          _operationToday(vm) +
          _routineMap(vm) +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          _nextStepCard(vm) +
          _growthCard(vm) +
        '</div>' +
      '</div>');
    _renderGlobalOnboarding();
  }

  function _paintError(err) {
    var content = document.getElementById('dashboard-content');
    if (!content) return;
    content.innerHTML = _safeHtml('<section class="dash-card" style="padding:18px;color:#B42318;font-size:13px;">Erro ao carregar a tela inicial: ' + _esc((err && err.message) || err || 'desconhecido') + '</section>');
  }

  function _ensureGlobalOnboardingStyles() {
    if (document.getElementById('dash-global-onboarding-styles')) return;
    var style = document.createElement('style');
    style.id = 'dash-global-onboarding-styles';
    style.textContent =
      '.dash-card{background:#fff;border:none;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);}' +
      '.dash-action{transition:transform .15s ease,box-shadow .15s ease,background .15s ease;}' +
      '.dash-action:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(31,31,31,.08);background:#FFFEFC;}' +
      '.dash-soft-btn{transition:transform .15s ease,box-shadow .15s ease,background .15s ease;}' +
      '.dash-soft-btn:hover{transform:translateY(-1px);box-shadow:0 10px 20px rgba(31,31,31,.08);}' +
      '.dash-onboarding-float{position:fixed;right:22px;bottom:22px;width:min(360px,calc(100vw - 32px));z-index:80;box-shadow:0 22px 54px rgba(31,31,31,.18);}' +
      '.dash-onboarding-pill{position:fixed;right:22px;bottom:22px;z-index:80;box-shadow:0 14px 30px rgba(31,31,31,.16);}' +
      '.dash-tour-backdrop{position:fixed;inset:0;background:rgba(31,31,31,.06);z-index:90;padding:20px;}' +
      '.dash-tour-modal{width:min(480px,calc(100vw - 28px));background:linear-gradient(180deg,#fff 0%,#FFFEFB 100%);border-radius:24px;box-shadow:0 26px 70px rgba(31,31,31,.22);overflow:hidden;border:1px solid rgba(234,228,218,.95);position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:96;}' +
      '.dash-tour-spotlight{position:fixed;z-index:94;border:2px solid #B6925E;border-radius:14px;box-shadow:0 0 0 9999px rgba(31,31,31,.16),0 14px 34px rgba(31,31,31,.16);pointer-events:none;transition:all .18s ease;}' +
      '.dash-welcome-backdrop{position:fixed;inset:0;background:rgba(31,31,31,.34);z-index:95;display:flex;align-items:center;justify-content:center;padding:20px;}' +
      '.dash-welcome-modal{width:min(720px,100%);background:radial-gradient(circle at 8% 0%,rgba(180,35,24,.10),transparent 34%),linear-gradient(145deg,#fff 0%,#FFFDF9 58%,#FAF6EF 100%);border-radius:26px;box-shadow:0 30px 80px rgba(31,31,31,.24);overflow:hidden;border:1px solid #EAE4DA;position:relative;}' +
      '.dash-welcome-modal:before{content:"";position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(90deg,#B42318,#B6925E);}' +
      '.dash-welcome-point{border:1px solid rgba(234,228,218,.92);background:rgba(255,255,255,.76);border-radius:16px;padding:12px;display:flex;gap:10px;align-items:flex-start;box-shadow:0 10px 22px rgba(31,31,31,.035);}' +
      '.dash-tour-tag{display:inline-flex;align-items:center;gap:7px;min-height:25px;padding:0 10px;border-radius:999px;background:#FFF7EC;border:1px solid #EFE1D0;color:#8A6F5A;font-size:11px;font-weight:750;letter-spacing:.03em;text-transform:uppercase;}' +
      '.dash-tour-detail{display:grid;grid-template-columns:minmax(98px,128px) 1fr;gap:8px;align-items:start;font-size:12px;line-height:1.38;border-radius:11px;padding:7px 8px;background:#FFFEFC;}' +
      '.dash-checklist-backdrop{position:fixed;inset:0;background:rgba(31,31,31,.18);z-index:92;display:flex;align-items:center;justify-content:center;padding:18px;}' +
      '.dash-checklist-modal{width:min(560px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:auto;background:linear-gradient(180deg,#fff 0%,#FFFEFB 100%);border:1px solid rgba(234,228,218,.95);border-radius:24px;box-shadow:0 26px 70px rgba(31,31,31,.22);}' +
      '.dash-tour-modal,.dash-welcome-modal,.dash-checklist-modal{scrollbar-width:none;-ms-overflow-style:none;}' +
      '.dash-tour-modal::-webkit-scrollbar,.dash-welcome-modal::-webkit-scrollbar,.dash-checklist-modal::-webkit-scrollbar{display:none;width:0;height:0;}' +
      '.dash-checklist-detail{display:grid;grid-template-columns:minmax(108px,140px) 1fr;gap:8px;align-items:start;font-size:12.4px;line-height:1.42;border-radius:12px;padding:8px 9px;background:#FFFEFC;border:1px solid #F1ECE4;}' +
      '@media(max-width:760px){.dash-onboarding-float{right:12px;bottom:12px;width:calc(100vw - 24px);}.dash-onboarding-pill{right:12px;bottom:12px;}.dash-tour-backdrop,.dash-welcome-backdrop,.dash-checklist-backdrop{align-items:flex-end;padding:12px;}.dash-tour-modal,.dash-welcome-modal,.dash-checklist-modal{border-radius:22px;max-height:calc(100dvh - 24px);overflow:auto;}.dash-checklist-detail{grid-template-columns:1fr;gap:3px;}}';
    document.head.appendChild(style);
  }

  function _removeGlobalOnboarding() {
    _setTourScrollLock(false);
    var root = document.getElementById('dash-global-onboarding-root');
    if (root) root.remove();
  }

  function _setTourScrollLock(lock) {
    var body = document.body;
    if (!body) return;
    if (lock) {
      if (!body.dataset.bocaTourOverflow) body.dataset.bocaTourOverflow = body.style.overflow || '';
      body.style.overflow = 'hidden';
      return;
    }
    if (body.dataset && Object.prototype.hasOwnProperty.call(body.dataset, 'bocaTourOverflow')) {
      body.style.overflow = body.dataset.bocaTourOverflow || '';
      delete body.dataset.bocaTourOverflow;
    }
  }

  function _onboardingDocId() {
    var user = null;
    try { user = window.Auth && Auth.getUser ? Auth.getUser() : null; } catch (err) {}
    var uid = String((user && user.uid) || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    return 'onboarding_dashboard_' + uid;
  }

  function _readLocalOnboardingState() {
    var state = {
      version: '',
      welcomeSeen: false,
      tourOpen: false,
      tourDone: false,
      tourStep: 0,
      collapsed: false
    };
    try {
      if (!window.localStorage) return state;
      state.version = localStorage.getItem('boca_dashboard_onboarding_version') || '';
      state.welcomeSeen = localStorage.getItem('boca_dashboard_welcome_seen') === '1';
      state.tourOpen = localStorage.getItem('boca_dashboard_tour_open') === '1';
      state.tourDone = localStorage.getItem('boca_dashboard_tour_done') === '1';
      state.tourStep = parseInt(localStorage.getItem('boca_dashboard_tour_step') || '0', 10) || 0;
      state.collapsed = localStorage.getItem('boca_dashboard_onboarding_collapsed') === '1';
    } catch (err) {}
    return state;
  }

  function _writeLocalOnboardingState(patch, options) {
    patch = patch || {};
    options = options || {};
    if (options.action) _onboardingLastAction = String(options.action || '');
    try {
      if (window.localStorage) {
        if (Object.prototype.hasOwnProperty.call(patch, 'version')) localStorage.setItem('boca_dashboard_onboarding_version', patch.version || '');
        if (Object.prototype.hasOwnProperty.call(patch, 'welcomeSeen')) localStorage.setItem('boca_dashboard_welcome_seen', patch.welcomeSeen ? '1' : '0');
        if (Object.prototype.hasOwnProperty.call(patch, 'tourOpen')) localStorage.setItem('boca_dashboard_tour_open', patch.tourOpen ? '1' : '0');
        if (Object.prototype.hasOwnProperty.call(patch, 'tourDone')) localStorage.setItem('boca_dashboard_tour_done', patch.tourDone ? '1' : '0');
        if (Object.prototype.hasOwnProperty.call(patch, 'tourStep')) localStorage.setItem('boca_dashboard_tour_step', String(Math.max(0, parseInt(patch.tourStep || 0, 10) || 0)));
        if (Object.prototype.hasOwnProperty.call(patch, 'collapsed')) localStorage.setItem('boca_dashboard_onboarding_collapsed', patch.collapsed ? '1' : '0');
      }
    } catch (err) {}
    if (!options.fromRemote) _onboardingLocalSeq += 1;
    if (options.persist !== false && !options.fromRemote) _scheduleOnboardingPersist();
  }

  function _currentOnboardingPersistPayload() {
    var state = _readLocalOnboardingState();
    var user = null;
    var tenantId = '';
    try { user = window.Auth && Auth.getUser ? Auth.getUser() : null; } catch (err) {}
    try { tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : ''; } catch (err2) {}
    var payload = {
      version: state.version || ONBOARDING_VERSION,
      welcomeSeen: !!state.welcomeSeen,
      tourOpen: !!state.tourOpen,
      tourDone: !!state.tourDone,
      tourStep: Math.max(0, parseInt(state.tourStep || 0, 10) || 0),
      collapsed: !!state.collapsed,
      progressSummary: _onboardingProgressSummary(),
      lastRoute: _currentRoute(),
      lastAction: _onboardingLastAction || '',
      userId: (user && user.uid) || '',
      tenantId: tenantId || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (_onboardingLastAction) payload.lastActionAt = firebase.firestore.FieldValue.serverTimestamp();
    return payload;
  }

  function _scheduleOnboardingPersist() {
    if (_onboardingPersistTimer) window.clearTimeout(_onboardingPersistTimer);
    _onboardingPersistTimer = window.setTimeout(function () {
      _onboardingPersistTimer = null;
      _persistOnboardingState();
    }, 350);
  }

  function _persistOnboardingState() {
    try {
      if (!window.DB || !window.Auth || !Auth.getUser || !Auth.getUser() || !window.firebase || !firebase.firestore) return;
      var docId = _onboardingDocId();
      DB.setDocRoot('config', docId, _currentOnboardingPersistPayload()).catch(function (err) {
        console.warn('Dashboard onboarding persist skipped', err && err.message ? err.message : err);
      });
    } catch (err2) {
      console.warn('Dashboard onboarding persist error', err2 && err2.message ? err2.message : err2);
    }
  }

  function _ensureOnboardingRemoteLoaded() {
    if (!window.DB || !window.Auth || !Auth.getUser || !Auth.getUser()) return;
    var docId = _onboardingDocId();
    if (_onboardingRemote.loaded && _onboardingRemote.docId === docId) return;
    if (_onboardingRemote.loading && _onboardingRemote.docId === docId) return;
    var startSeq = _onboardingLocalSeq;
    _onboardingRemote = { loaded: false, loading: true, docId: docId, data: null };
    DB.getDocRoot('config', docId).then(function (data) {
      _onboardingRemote = { loaded: true, loading: false, docId: docId, data: data || null };
      if (!data || startSeq !== _onboardingLocalSeq) return;
      _applyRemoteOnboardingState(data);
      _renderGlobalOnboarding();
    }).catch(function (err) {
      _onboardingRemote = { loaded: true, loading: false, docId: docId, data: null };
      console.warn('Dashboard onboarding remote load skipped', err && err.message ? err.message : err);
    });
  }

  function _applyRemoteOnboardingState(data) {
    if (!data || data.version !== ONBOARDING_VERSION) return;
    _writeLocalOnboardingState({
      version: data.version,
      welcomeSeen: !!data.welcomeSeen,
      tourOpen: !!data.tourOpen,
      tourDone: !!data.tourDone,
      tourStep: data.tourStep || 0,
      collapsed: !!data.collapsed
    }, { fromRemote: true, persist: false });
  }

  function _renderGlobalOnboarding() {
    if (!window.Auth || !Auth.getUser || !Auth.getUser()) {
      _removeGlobalOnboarding();
      return;
    }
    _installOnboardingDataRefreshHooks();
    if (!_loaded) {
      _load().then(_renderGlobalOnboarding).catch(function (err) {
        console.warn('Dashboard onboarding load error', err);
      });
      return;
    }
    _ensureOnboardingRemoteLoaded();
    _ensureGlobalOnboardingStyles();
    var vm = _buildModel();
    var html = _welcomeModal(vm) + _onboarding(vm) + _checklistGuideModal();
    _setTourScrollLock(false);
    if (!html) {
      _setTourScrollLock(false);
      _removeGlobalOnboarding();
      return;
    }
    var root = document.getElementById('dash-global-onboarding-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'dash-global-onboarding-root';
      document.body.appendChild(root);
    }
    root.innerHTML = _safeHtml(html);
    _setTourScrollLock(!!_activeChecklistGuide());
    _applyTourHighlight();
  }

  function _installOnboardingDataRefreshHooks() {
    if (_onboardingDataHooksInstalled || !window.DB) return;
    _onboardingDataHooksInstalled = true;
    ['add', 'set', 'update', 'remove', 'setDocRoot'].forEach(function (method) {
      if (!DB[method] || DB[method].__bocaOnboardingWrapped) return;
      var original = DB[method];
      var wrapped = function () {
        var args = Array.prototype.slice.call(arguments);
        var result = original.apply(DB, args);
        if (result && typeof result.then === 'function') {
          return result.then(function (value) {
            if (!_isOnboardingOwnWrite(method, args)) _scheduleOnboardingDataRefresh();
            return value;
          });
        }
        if (!_isOnboardingOwnWrite(method, args)) _scheduleOnboardingDataRefresh();
        return result;
      };
      wrapped.__bocaOnboardingWrapped = true;
      wrapped.__bocaOriginal = original;
      DB[method] = wrapped;
    });
  }

  function _isOnboardingOwnWrite(method, args) {
    if (method !== 'setDocRoot') return false;
    var col = String((args && args[0]) || '');
    var id = String((args && args[1]) || '');
    return col === 'config' && id.indexOf('onboarding_dashboard_') === 0;
  }

  function _scheduleOnboardingDataRefresh() {
    if (_onboardingRefreshTimer) window.clearTimeout(_onboardingRefreshTimer);
    _onboardingRefreshTimer = window.setTimeout(function () {
      _onboardingRefreshTimer = null;
      _refreshOnboardingData();
    }, 550);
  }

  function _refreshOnboardingData() {
    if (!window.Auth || !Auth.getUser || !Auth.getUser()) return;
    if (_loading) return;
    _loaded = false;
    _loadPromise = null;
    _loading = false;
    _load().then(function () {
      _renderGlobalOnboarding();
      if ((window.Router && Router.current && Router.current() === 'dashboard') || (window.location.hash || '').replace('#', '') === 'dashboard') {
        _paint();
      }
    }).catch(function (err) {
      console.warn('Dashboard onboarding refresh skipped', err && err.message ? err.message : err);
    });
  }

  function _buildModel() {
    var now = new Date();
    var todayKey = _dateKey(now);
    var month = _monthRange(now);
    var ordersMonth = _ordersInRange(month.start, month.end);
    var ordersToday = _ordersInRange(todayKey, todayKey);
    var openOrders = (_data.orders || []).filter(_isOpenOrder);
    var revenueMonth = _sum(ordersMonth, function (o) { return _orderRevenue(o); });
    var revenueToday = _sum(ordersToday, function (o) { return _orderRevenue(o); });
    var avgTicket = ordersMonth.length ? revenueMonth / ordersMonth.length : 0;
    var entriesMonth = _itemsInRange(_data.entries, month.start, month.end);
    var exitsMonth = _itemsInRange(_data.exits, month.start, month.end);
    var entradas = _sum(entriesMonth, function (x) { return _num(x.value); });
    var saidas = _sum(exitsMonth, function (x) { return _num(x.value); });
    var saldoContas = _sum(_data.accounts || [], function (x) { return _num(x.balance != null ? x.balance : x.saldo != null ? x.saldo : x.currentBalance); });
    var saldoMes = entradas - saidas;
    var target = _monthTarget();
    var progress = target.revenue ? (revenueMonth / target.revenue) * 100 : 0;
    var daysElapsed = Math.max(1, now.getDate());
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var expectedNow = target.revenue ? (target.revenue / daysInMonth) * daysElapsed : 0;
    var paceDiff = revenueMonth - expectedNow;
    var needPerDay = target.revenue ? Math.max(0, target.revenue - revenueMonth) / Math.max(1, daysInMonth - daysElapsed + 1) : 0;
    var storeName = _data.template.publicStoreName || _data.template.publicName || _data.geral.businessName || _data.geral.tradeName || 'sua loja';
    var online = _isStoreOnline(_data.template, _data.operacao);
    var onboarding = _onboardingSteps();
    var onboardingFlat = _flattenOnboarding(onboarding);
    return {
      now: now,
      storeName: storeName,
      greeting: _greeting(now),
      monthLabel: _monthLabel(now),
      ordersMonth: ordersMonth,
      ordersToday: ordersToday,
      openOrders: openOrders,
      revenueMonth: revenueMonth,
      revenueToday: revenueToday,
      avgTicket: avgTicket,
      entriesMonth: entradas,
      exitsMonth: saidas,
      monthBalance: saldoMes,
      accountBalance: saldoContas,
      target: target,
      progress: progress,
      expectedNow: expectedNow,
      paceDiff: paceDiff,
      needPerDay: needPerDay,
      online: online,
      bestChannel: _bestChannel(ordersMonth),
      latestOrders: ordersToday.slice().sort(function (a, b) { return _ts(b.createdAt || b.date || b.data) - _ts(a.createdAt || a.date || a.data); }).slice(0, 5),
      onboarding: onboarding,
      onboardingDone: onboardingFlat.length ? onboardingFlat.every(function (s) { return s.done; }) : true,
      nextRoutine: _nextContinuousRoutine({
        hasOpenOrder: openOrders.length > 0,
        hasOrderToday: ordersToday.length > 0,
        hasPurchase: (_data.purchases || []).length > 0,
        hasStockMovement: (_data.stockMovements || []).length > 0,
        hasPlan: !!target.revenue,
        paceDiff: paceDiff,
        hasEntry: entradas > 0
      })
    };
  }

  function _header(vm) {
    return '<div class="dash-card" style="padding:20px 22px;background:linear-gradient(135deg,#FFFDF8 0%,#FAF4EA 62%,#F7EFE2 100%);box-shadow:0 16px 38px rgba(31,31,31,.06);">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
      '<div style="min-width:0;max-width:780px;">' +
        '<div style="font-size:12px;color:#8A6F5A;letter-spacing:.02em;text-transform:uppercase;margin-bottom:6px;">Início da rotina</div>' +
        '<h1 style="font-size:24px;font-weight:750;color:#1F1F1F;line-height:1.12;margin:0 0 7px;">' + _esc(vm.greeting) + ', ' + _esc(vm.storeName) + '</h1>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
        _chip(vm.monthLabel) +
        _chip((vm.openOrders || []).length + ' em andamento') +
        _chip(vm.online ? 'Loja ligada' : 'Loja fechada', vm.online ? '#1F6F43' : '#B42318') +
      '</div>' +
      '</div>' +
    '</div>';
  }

  function _quickActions(vm) {
    return '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
      _actionTile('Vender agora', 'Abrir venda presencial', 'point_of_sale', 'venda-presencial', '#1F6F43', true) +
      _actionTile('Novo pedido', 'Registrar ou acompanhar pedido', 'add_shopping_cart', 'pedidos/lista', '#B42318', false) +
      _actionTile('Entrada financeira', 'Registrar dinheiro que entrou', 'south_west', 'financeiro/movimentacoes', '#0F6B8F', false) +
      _actionTile('Compra ou estoque', 'Receber compra e revisar saldo', 'inventory_2', 'compras/registros', '#8A6F5A', false) +
    '</section>';
  }

  function _operationToday(vm) {
    var targetText = vm.target.revenue ? (vm.progress.toFixed(0) + '% da meta do mês') : 'sem rota ativa';
    var targetTone = !vm.target.revenue ? '#B45309' : (vm.paceDiff >= 0 ? '#1F6F43' : '#B42318');
    return '<section class="dash-card" style="padding:18px 20px;">' +
      _sectionHead('Hoje para cuidar', 'O que precisa aparecer primeiro quando você abre o painel.', 'pedidos/cozinha', 'Abrir cozinha') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:14px;">' +
        _mini('Pedidos em andamento', String(vm.openOrders.length)) +
        _mini('Vendido hoje', _fmtMoney(vm.revenueToday)) +
        _mini('Ticket médio do mês', _fmtMoney(vm.avgTicket)) +
        _mini('Rota do mês', targetText) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:12px;margin-top:14px;">' +
        '<div style="border:1px solid #EAE4DA;border-radius:14px;background:#FFFEFC;overflow:hidden;">' +
          '<div style="padding:12px 13px;border-bottom:1px solid #F0E8DC;display:flex;align-items:center;justify-content:space-between;gap:10px;"><span style="font-size:13px;color:#1F1F1F;font-weight:750;">Últimos pedidos de hoje</span><span style="font-size:12px;color:#6F6860;">' + vm.ordersToday.length + ' pedido(s)</span></div>' +
          (vm.latestOrders.length ? vm.latestOrders.map(function (o, idx) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;' + (idx + 1 < vm.latestOrders.length ? 'border-bottom:1px solid #F4EEE6;' : '') + '">' +
              '<div style="min-width:0;"><div style="font-size:13px;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(o.customerName || o.cliente || o.name || 'Cliente sem nome') + '</div><div style="font-size:12px;color:#6F6860;margin-top:2px;">' + _esc(_orderStatusLabel(o.status || 'Pedido')) + '</div></div>' +
              '<span style="font-size:13px;color:#1F1F1F;white-space:nowrap;">' + _fmtMoney(_orderRevenue(o)) + '</span>' +
            '</div>';
          }).join('') : _empty('Ainda não entrou pedido hoje.')) +
        '</div>' +
        '<div style="border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;padding:14px;display:flex;flex-direction:column;gap:11px;">' +
          '<div style="display:flex;align-items:center;gap:9px;"><span class="mi" style="font-size:20px;color:' + targetTone + ';">route</span><div style="font-size:13px;color:#1F1F1F;font-weight:750;">Direção do mês</div></div>' +
          '<div style="font-size:12px;color:#5F5752;line-height:1.45;">' + _esc(_routeReading(vm)) + '</div>' +
          '<button type="button" onclick="Router.navigate(\'crescimento/performance\')" class="dash-soft-btn" style="height:36px;border:1px solid #E7DED0;background:#fff;border-radius:11px;color:#1F1F1F;font-size:12px;cursor:pointer;font-family:inherit;">Ver performance</button>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _routineMap(vm) {
    return '<section class="dash-card" style="padding:18px 20px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div><div style="font-size:15px;font-weight:750;color:#1F1F1F;">Rotina do dia</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Atalhos para vender, registrar dinheiro, cuidar de compras e acompanhar estoque.</div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:12px;margin-top:14px;">' +
        _routineColumn('Venda', 'Receber pedido, preparar, entregar e acompanhar cliente.', 'local_mall', [
          ['Venda presencial', 'venda-presencial'],
          ['Pedidos', 'pedidos/lista'],
          ['Cozinha', 'pedidos/cozinha'],
          ['Clientes', 'pedidos/clientes']
        ]) +
        _routineColumn('Dinheiro', 'Registrar entradas, saídas e entender o caixa.', 'payments', [
          ['Visão geral', 'financeiro/visao-geral'],
          ['Entradas', 'financeiro/movimentacoes'],
          ['Saídas', 'financeiro/contas-pagar'],
          ['Fluxo de caixa', 'financeiro/fluxo-caixa']
        ]) +
        _routineColumn('Compra e estoque', 'Cuidar do que entra, do que sai e do que precisa repor.', 'inventory_2', [
          ['Registrar compra', 'compras/registros'],
          ['Itens em estoque', 'estoque/itens'],
          ['Movimentações', 'estoque/movimentacoes'],
          ['Produção', 'receitas/ordens']
        ]) +
      '</div>' +
    '</section>';
  }

  function _nextStepCard(vm) {
    var step = _nextStep(vm);
    return '<section class="dash-card" style="padding:18px 20px;background:linear-gradient(180deg,#FFFFFF 0%,#FFFBF6 100%);">' +
      '<div style="display:flex;align-items:flex-start;gap:12px;">' +
        '<span class="mi" style="width:38px;height:38px;border-radius:14px;background:#FAF1E6;color:' + _esc(step.color) + ';font-size:21px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">' + _esc(step.icon) + '</span>' +
        '<div style="min-width:0;flex:1;">' +
          '<div style="font-size:12px;color:#8A6F5A;text-transform:uppercase;letter-spacing:.02em;">Próximo passo</div>' +
          '<div style="font-size:17px;color:#1F1F1F;font-weight:750;line-height:1.2;margin-top:4px;">' + _esc(step.title) + '</div>' +
          '<div style="font-size:13px;color:#5F5752;line-height:1.45;margin-top:8px;">' + _esc(step.text) + '</div>' +
          '<button type="button" onclick="Router.navigate(\'' + _esc(step.route) + '\')" class="dash-soft-btn" style="margin-top:13px;height:38px;padding:0 14px;border:none;background:' + _esc(step.color) + ';color:#fff;border-radius:12px;font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;">' + _esc(step.cta) + '</button>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _growthCard(vm) {
    return '<section class="dash-card" style="padding:18px 20px;">' +
      '<div style="font-size:15px;font-weight:750;color:#1F1F1F;">Crescimento</div>' +
      '<div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Quando a operação estiver andando, estes blocos ajudam a decidir o próximo movimento.</div>' +
      '<div style="display:flex;flex-direction:column;gap:9px;margin-top:14px;">' +
        _growthLink('Plano de Voo', 'Criar ou revisar a rota do ano.', 'flight_takeoff', 'crescimento/plano-de-voo') +
        _growthLink('Temporadas', 'Transformar a rota em jogadas práticas.', 'event_available', 'crescimento/temporadas') +
        _growthLink('Performance', 'Ver se o mês acompanha a rota.', 'analytics', 'crescimento/performance') +
        _growthLink('Maturidade', 'Entender a evolução real do negócio.', 'diamond', 'crescimento/maturidade') +
      '</div>' +
    '</section>';
  }

  function _onboarding(vm) {
    var intro = _onboardingIntroState();
    if (!intro.welcomeSeen) return '';
    if (vm.onboardingDone) return _continuousOnboarding(vm);
    var flat = _flattenOnboarding(vm.onboarding);
    var done = flat.filter(function (s) { return s.done; }).length;
    var total = flat.length || 1;
    var phase = _currentOnboardingPhase(vm.onboarding);
    var phaseSteps = (phase && phase.steps) || flat;
    var phaseDone = phaseSteps.filter(function (s) { return s.done; }).length;
    var pct = Math.round((done / total) * 100);
    var collapsed = _readLocalOnboardingState().collapsed;
    return '<div id="dash-onboarding-panel" class="dash-card dash-onboarding-float" style="display:' + (collapsed ? 'none' : 'block') + ';overflow:hidden;border:1px solid rgba(234,228,218,.9);">' +
      '<div style="padding:15px 16px;background:linear-gradient(135deg,#fff 0%,#FFF7EC 100%);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
            '<span class="mi" style="width:36px;height:36px;border-radius:13px;background:#B42318;color:#fff;font-size:20px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">rocket_launch</span>' +
            '<div style="min-width:0;"><div style="font-size:15px;font-weight:750;color:#1F1F1F;line-height:1.2;">' + _esc((phase && phase.title) || 'Primeiros passos') + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc((phase && phase.text) || 'Finalize a base para começar a operar com mais segurança.') + '</div></div>' +
          '</div>' +
          '<button type="button" onclick="Modules.Dashboard._collapseOnboarding()" style="width:30px;height:30px;border:none;background:rgba(255,255,255,.7);border-radius:10px;color:#6F6860;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:18px;">expand_more</span></button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;margin-top:13px;"><div style="height:8px;border-radius:999px;background:#F1ECE4;overflow:hidden;flex:1;"><div style="height:100%;width:' + pct + '%;background:#B42318;border-radius:999px;"></div></div><span style="font-size:12px;color:#1F1F1F;white-space:nowrap;">' + done + '/' + total + '</span></div>' +
        '<div style="margin-top:10px;border:1px solid #E8DCD7;background:#fff;border-radius:12px;padding:9px 10px;color:#5F5750;font-size:11.5px;line-height:1.35;">Vá etapa por etapa. A lista abaixo mostra seu progresso, a sequência do que precisa ser feito e onde continuar.</div>' +
      '</div>' +
      '<div style="padding:10px;background:#fff;display:flex;flex-direction:column;gap:7px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px 3px;"><span style="font-size:11px;color:#8A6F5A;text-transform:uppercase;letter-spacing:.03em;">Etapa atual</span><span style="font-size:11px;color:#6F6860;">' + phaseDone + '/' + phaseSteps.length + '</span></div>' +
          phaseSteps.map(function (step, idx) {
            return '<button type="button" onclick="Modules.Dashboard._openChecklistGuide(\'' + _esc((phase && phase.key) || '') + '\',' + idx + ')" class="dash-action" style="text-align:left;border:1px solid ' + (step.done ? '#D9F2E3' : '#EAE4DA') + ';background:' + (step.done ? '#F4FBF6' : '#fff') + ';border-radius:13px;padding:10px;display:flex;gap:9px;align-items:flex-start;cursor:pointer;font-family:inherit;min-width:0;">' +
              '<span class="mi" style="width:28px;height:28px;border-radius:10px;background:' + (step.done ? '#E8F7EE' : '#FAF8F4') + ';color:' + (step.done ? '#1F6F43' : '#B42318') + ';font-size:17px;flex:0 0 auto;">' + (step.done ? 'check_circle' : step.icon) + '</span>' +
              '<span style="min-width:0;"><strong style="display:block;font-size:12px;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(step.title) + '</strong><span style="display:block;font-size:11px;color:#6F6860;line-height:1.3;margin-top:2px;">' + _esc(step.text) + '</span></span>' +
            '</button>';
          }).join('') +
          '<div style="border-top:1px solid #F1ECE4;margin-top:3px;padding-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +
            vm.onboarding.map(function (p, idx) {
              var pDone = (p.steps || []).every(function (s) { return s.done; });
              var active = phase && p.key === phase.key;
              return '<span title="' + _esc(p.title) + '" style="width:8px;height:8px;border-radius:999px;background:' + (pDone ? '#1F6F43' : active ? '#B42318' : '#D8CEC3') + ';display:inline-block;"></span>';
            }).join('') +
          '</div>' +
      '</div>' +
    '</div>' +
    '<button id="dash-onboarding-pill" type="button" class="dash-onboarding-pill" onclick="Modules.Dashboard._expandOnboarding()" style="display:' + (collapsed ? 'inline-flex' : 'none') + ';align-items:center;gap:8px;height:42px;padding:0 14px;border:none;background:#B42318;color:#fff;border-radius:999px;font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;"><span class="mi" style="font-size:18px;">rocket_launch</span>' + _esc((phase && phase.shortTitle) || 'Primeiros passos') + ' ' + done + '/' + total + '</button>';
  }

  function _continuousOnboarding(vm) {
    var collapsed = _readLocalOnboardingState().collapsed;
    var item = vm.nextRoutine || {};
    return '<div id="dash-onboarding-panel" class="dash-card dash-onboarding-float" style="display:' + (collapsed ? 'none' : 'block') + ';overflow:hidden;border:1px solid rgba(234,228,218,.9);">' +
      '<div style="padding:15px 16px;background:linear-gradient(135deg,#fff 0%,#FFF7EC 100%);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
            '<span class="mi" style="width:36px;height:36px;border-radius:13px;background:#1F6F43;color:#fff;font-size:20px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">check_circle</span>' +
            '<div style="min-width:0;"><div style="font-size:15px;font-weight:750;color:#1F1F1F;line-height:1.2;">Negócio em movimento</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">A base já começou. Agora o importante é manter a rotina alimentando sua leitura.</div></div>' +
          '</div>' +
          '<button type="button" onclick="Modules.Dashboard._collapseOnboarding()" style="width:30px;height:30px;border:none;background:rgba(255,255,255,.7);border-radius:10px;color:#6F6860;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:18px;">expand_more</span></button>' +
        '</div>' +
      '</div>' +
      '<div style="padding:10px;background:#fff;display:flex;flex-direction:column;gap:8px;">' +
        '<button type="button" onclick="Router.navigate(\'' + _esc(item.route || 'dashboard') + '\')" class="dash-action" style="text-align:left;border:1px solid #EAE4DA;background:#fff;border-radius:14px;padding:12px;display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-family:inherit;min-width:0;">' +
          '<span class="mi" style="width:30px;height:30px;border-radius:11px;background:#FAF8F4;color:#B42318;font-size:18px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">' + _esc(item.icon || 'arrow_forward') + '</span>' +
          '<span style="min-width:0;"><strong style="display:block;font-size:13px;color:#1F1F1F;line-height:1.25;">' + _esc(item.title || 'Olhar a rotina de hoje') + '</strong><span style="display:block;font-size:11.5px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(item.text || 'Abra a tela que mais ajuda a decidir o próximo passo de hoje.') + '</span></span>' +
        '</button>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">' +
          '<button type="button" onclick="Router.navigate(\'suporte/documentacao\')" class="dash-soft-btn" style="height:34px;border:1px solid #E8DCD7;background:#fff;border-radius:11px;color:#1F1F1F;font-size:12px;cursor:pointer;font-family:inherit;">Documentação</button>' +
          '<button type="button" onclick="Router.navigate(\'crescimento/maturidade\')" class="dash-soft-btn" style="height:34px;border:1px solid #E8DCD7;background:#fff;border-radius:11px;color:#1F1F1F;font-size:12px;cursor:pointer;font-family:inherit;">Ver maturidade</button>' +
        '</div>' +
        '<button type="button" onclick="Modules.Dashboard._resetOnboardingProgress()" class="dash-soft-btn" style="height:34px;border:1px solid #E8DCD7;background:#FFFEFC;border-radius:11px;color:#6F6860;font-size:12px;cursor:pointer;font-family:inherit;">Refazer primeiros passos</button>' +
      '</div>' +
    '</div>' +
    '<button id="dash-onboarding-pill" type="button" class="dash-onboarding-pill" onclick="Modules.Dashboard._expandOnboarding()" style="display:' + (collapsed ? 'inline-flex' : 'none') + ';align-items:center;gap:8px;height:42px;padding:0 14px;border:none;background:#1F6F43;color:#fff;border-radius:999px;font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;"><span class="mi" style="font-size:18px;">check_circle</span>Rotina</button>';
  }

  function _nextContinuousRoutine(ctx) {
    ctx = ctx || {};
    if (ctx.hasOpenOrder) return { icon: 'room_service', title: 'Acompanhar pedidos em andamento', text: 'Tem pedido aberto. Veja preparo, entrega ou retirada antes de olhar relatórios.', route: 'pedidos/cozinha' };
    if (!ctx.hasOrderToday) return { icon: 'point_of_sale', title: 'Registrar a venda de hoje', text: 'Se vendeu hoje, registre o pedido ou use venda presencial para a rotina não ficar invisível.', route: 'venda-presencial' };
    if (!ctx.hasEntry) return { icon: 'payments', title: 'Conferir se o dinheiro entrou', text: 'Depois da venda, veja se o financeiro recebeu a entrada certa.', route: 'financeiro/visao-geral' };
    if (!ctx.hasStockMovement) return { icon: 'inventory_2', title: 'Conferir estoque depois da operação', text: 'Veja se compras, produção ou vendas já movimentaram os itens certos.', route: 'estoque/itens' };
    if (ctx.hasPlan && ctx.paceDiff < 0) return { icon: 'event_available', title: 'Escolher a próxima jogada', text: 'O mês está abaixo do ritmo. Abra Temporadas para decidir uma ação prática.', route: 'crescimento/temporadas' };
    return { icon: 'analytics', title: 'Olhar como a semana está andando', text: 'A rotina já começou. Veja Performance para entender se o negócio está no ritmo.', route: 'crescimento/performance' };
  }

  function _kpis(vm) {
    return '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;">' +
      _kpi('Vendas no mês', _fmtMoney(vm.revenueMonth), vm.ordersMonth.length + ' pedido(s) · ticket ' + _fmtMoney(vm.avgTicket), 'payments', '#8A6F5A') +
      _kpi('Pedidos hoje', String(vm.ordersToday.length), _fmtMoney(vm.revenueToday) + ' vendidos hoje', 'today', '#B42318') +
      _kpi('Meta do mês', vm.target.revenue ? vm.progress.toFixed(1) + '%' : 'Sem meta', vm.target.revenue ? 'Meta ' + _fmtMoney(vm.target.revenue) : 'Defina no Plano de Voo', 'flag', vm.progress >= 100 ? '#1F6F43' : '#B45309') +
      _kpi('Saldo do mês', _fmtMoney(vm.monthBalance), 'Entradas ' + _fmtMoney(vm.entriesMonth) + ' · saídas ' + _fmtMoney(vm.exitsMonth), 'account_balance_wallet', vm.monthBalance >= 0 ? '#1F6F43' : '#B42318') +
    '</section>';
  }

  function _planCard(vm) {
    var progress = Math.max(0, Math.min(100, vm.progress || 0));
    var tone = !vm.target.revenue ? '#B45309' : (vm.paceDiff >= 0 ? '#1F6F43' : '#B42318');
    var title = !vm.target.revenue ? 'Sem cenário do mês definido' : (vm.paceDiff >= 0 ? 'Ritmo acima do esperado' : 'Ritmo abaixo do esperado');
    var text = !vm.target.revenue ? 'Escolha uma previsão salva no Plano de Voo para o dashboard comparar o mês real com a meta.' : (vm.paceDiff >= 0 ? 'Você está ' + _fmtMoney(vm.paceDiff) + ' acima do ritmo esperado para hoje.' : 'Faltam ' + _fmtMoney(Math.abs(vm.paceDiff)) + ' para acompanhar o ritmo esperado até hoje.');
    return '<section class="dash-card" style="padding:18px 20px;">' +
      _sectionHead('Plano de Voo e Performance', 'Leitura do mês atual contra o cenário selecionado.', 'crescimento/performance', 'Abrir performance') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:16px;align-items:center;margin-top:14px;">' +
        '<div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;"><strong style="font-size:13px;color:#1F1F1F;">Atingimento da meta</strong><span style="font-size:13px;font-weight:800;color:' + tone + ';">' + (vm.target.revenue ? vm.progress.toFixed(1) + '%' : '—') + '</span></div>' +
          '<div style="height:10px;border-radius:999px;background:#F1ECE4;overflow:hidden;"><div style="height:100%;width:' + progress.toFixed(2) + '%;border-radius:999px;background:' + tone + ';"></div></div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:14px;">' +
            _mini('Realizado', _fmtMoney(vm.revenueMonth)) +
            _mini('Meta', vm.target.revenue ? _fmtMoney(vm.target.revenue) : '—') +
            _mini('Necessário/dia', vm.target.revenue ? _fmtMoney(vm.needPerDay) : '—') +
          '</div>' +
        '</div>' +
        '<div style="border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;padding:14px;">' +
          '<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;"><span class="mi" style="font-size:20px;color:' + tone + ';">' + (vm.target.revenue ? 'speed' : 'info') + '</span><strong style="font-size:13px;color:#1F1F1F;">' + _esc(title) + '</strong></div>' +
          '<div style="font-size:12px;color:#6F6860;line-height:1.45;">' + _esc(text) + '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _todayCard(vm) {
    return '<section class="dash-card" style="padding:18px 20px;">' +
      _sectionHead('Hoje na operação', 'Pedidos e vendas registradas no dia.', 'pedidos/cozinha', 'Abrir cozinha') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px;">' +
        _mini('Pedidos em andamento', String(vm.openOrders.length)) +
        _mini('Pedidos de hoje', String(vm.ordersToday.length)) +
        _mini('Vendido hoje', _fmtMoney(vm.revenueToday)) +
        _mini('Melhor canal', vm.bestChannel.label || 'Sem dados') +
      '</div>' +
      '<div style="margin-top:14px;border:1px solid #EAE4DA;border-radius:14px;overflow:hidden;background:#fff;">' +
        (vm.latestOrders.length ? vm.latestOrders.map(function (o) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border-bottom:1px solid #EAE4DA;">' +
            '<div style="min-width:0;"><div style="font-size:13px;font-weight:800;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(o.customerName || o.cliente || o.name || 'Cliente sem nome') + '</div><div style="font-size:12px;color:#6F6860;margin-top:2px;">' + _esc(o.status || 'Pedido') + '</div></div>' +
            '<strong style="font-size:13px;color:#1F1F1F;white-space:nowrap;">' + _fmtMoney(_orderRevenue(o)) + '</strong>' +
          '</div>';
        }).join('').replace(/border-bottom:1px solid #EAE4DA;">$/, '">') : _empty('Nenhum pedido registrado hoje.')) +
      '</div>' +
    '</section>';
  }

  function _financeCard(vm) {
    return '<section class="dash-card" style="padding:18px 20px;">' +
      _sectionHead('Financeiro rápido', 'Entradas, saídas e saldo do mês.', 'financeiro/visao-geral', 'Abrir financeiro') +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px;">' +
        _mini('Entradas', _fmtMoney(vm.entriesMonth)) +
        _mini('Saídas', _fmtMoney(vm.exitsMonth)) +
        _mini('Saldo do mês', _fmtMoney(vm.monthBalance)) +
        _mini('Saldo em contas', vm.accountBalance ? _fmtMoney(vm.accountBalance) : '—') +
      '</div>' +
    '</section>';
  }

  function _actionsCard(vm) {
    var actions = [];
    if (!vm.target.revenue) actions.push({ icon: 'flag', title: 'Definir cenário do mês', text: 'Escolha uma previsão no Plano de Voo.', route: 'crescimento/plano-de-voo/snapshots' });
    if (!vm.online) actions.push({ icon: 'power_settings_new', title: 'Loja fechada', text: 'Revise se a loja deve voltar a vender online.', route: 'loja-online/template' });
    if (!vm.ordersToday.length) actions.push({ icon: 'today', title: 'Sem pedidos hoje', text: 'Acompanhe canais e ações de venda.', route: 'marketing/promocoes' });
    if (vm.monthBalance < 0) actions.push({ icon: 'payments', title: 'Saldo do mês negativo', text: 'Revise saídas e contas a pagar.', route: 'financeiro/fluxo-caixa' });
    if (!actions.length) actions.push({ icon: 'check_circle', title: 'Operação em dia', text: 'Não há alertas principais neste momento.', route: 'crescimento/performance' });
    return '<section class="dash-card" style="padding:18px 20px;">' +
      '<div style="font-size:15px;font-weight:800;color:#1F1F1F;">Próximas ações</div>' +
      '<div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Sugestões simples a partir dos dados atuais.</div>' +
      '<div style="display:flex;flex-direction:column;gap:9px;margin-top:14px;">' +
        actions.slice(0, 4).map(function (a) {
          return '<button type="button" onclick="Router.navigate(\'' + _esc(a.route) + '\')" class="dash-action" style="border:1px solid #EAE4DA;background:#fff;border-radius:13px;padding:11px;text-align:left;display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-family:inherit;">' +
            '<span class="mi" style="width:30px;height:30px;border-radius:11px;background:#FAF8F4;color:#B42318;font-size:18px;flex:0 0 auto;">' + _esc(a.icon) + '</span>' +
            '<span style="min-width:0;"><strong style="display:block;font-size:13px;color:#1F1F1F;line-height:1.25;">' + _esc(a.title) + '</strong><span style="display:block;font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc(a.text) + '</span></span>' +
          '</button>';
        }).join('') +
      '</div>' +
    '</section>';
  }

  function _actionTile(title, text, icon, route, color, primary) {
    return '<button type="button" onclick="Router.navigate(\'' + _esc(route) + '\')" class="dash-action" style="border:1px solid ' + (primary ? 'transparent' : '#EAE4DA') + ';background:' + (primary ? color : '#fff') + ';color:' + (primary ? '#fff' : '#1F1F1F') + ';border-radius:16px;padding:15px 16px;text-align:left;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:inherit;min-height:86px;">' +
      '<span class="mi" style="width:40px;height:40px;border-radius:14px;background:' + (primary ? 'rgba(255,255,255,.18)' : '#FAF8F4') + ';color:' + (primary ? '#fff' : color) + ';font-size:22px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">' + _esc(icon) + '</span>' +
      '<span style="min-width:0;"><span style="display:block;font-size:14px;font-weight:750;line-height:1.2;">' + _esc(title) + '</span><span style="display:block;font-size:12px;line-height:1.35;margin-top:4px;color:' + (primary ? 'rgba(255,255,255,.86)' : '#6F6860') + ';">' + _esc(text) + '</span></span>' +
    '</button>';
  }

  function _routineColumn(title, text, icon, links) {
    return '<article class="dash-routine-card" style="border:1px solid #EAE4DA;border-radius:15px;background:#FFFEFC;padding:14px;min-width:0;">' +
      '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">' +
        '<span class="mi" style="width:34px;height:34px;border-radius:12px;background:#FAF8F4;color:#B42318;font-size:20px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">' + _esc(icon) + '</span>' +
        '<div style="min-width:0;"><div style="font-size:14px;color:#1F1F1F;font-weight:750;line-height:1.2;">' + _esc(title) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:3px;">' + _esc(text) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:7px;">' +
        (links || []).map(function (link) {
          return '<button type="button" onclick="Router.navigate(\'' + _esc(link[1]) + '\')" class="dash-soft-btn" style="height:31px;padding:0 10px;border:1px solid #EAE4DA;background:#fff;border-radius:10px;color:#1F1F1F;font-size:12px;cursor:pointer;font-family:inherit;">' + _esc(link[0]) + '</button>';
        }).join('') +
      '</div>' +
    '</article>';
  }

  function _growthLink(title, text, icon, route) {
    return '<button type="button" onclick="Router.navigate(\'' + _esc(route) + '\')" class="dash-action" style="border:1px solid #EAE4DA;background:#fff;border-radius:13px;padding:11px 12px;text-align:left;display:flex;align-items:center;gap:10px;cursor:pointer;font-family:inherit;">' +
      '<span class="mi" style="width:31px;height:31px;border-radius:11px;background:#FAF8F4;color:#8A6F5A;font-size:18px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">' + _esc(icon) + '</span>' +
      '<span style="min-width:0;flex:1;"><span style="display:block;font-size:13px;color:#1F1F1F;font-weight:750;line-height:1.2;">' + _esc(title) + '</span><span style="display:block;font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc(text) + '</span></span>' +
      '<span class="mi" style="font-size:18px;color:#B8ADA1;">chevron_right</span>' +
    '</button>';
  }

  function _nextStep(vm) {
    if ((vm.openOrders || []).length) {
      return {
        icon: 'room_service',
        color: '#B42318',
        title: 'Comece pelos pedidos em andamento',
        text: 'Antes de olhar relatórios, veja o que precisa ser preparado, entregue ou finalizado agora.',
        cta: 'Abrir cozinha',
        route: 'pedidos/cozinha'
      };
    }
    if (!vm.target.revenue) {
      return {
        icon: 'flight_takeoff',
        color: '#8A6F5A',
        title: 'Crie a rota do negócio',
        text: 'Com uma rota no Plano de Voo, a Performance consegue mostrar se o mês está no ritmo certo.',
        cta: 'Abrir Plano de Voo',
        route: 'crescimento/plano-de-voo'
      };
    }
    if (vm.monthBalance < 0) {
      return {
        icon: 'account_balance_wallet',
        color: '#B45309',
        title: 'Olhe o dinheiro antes de crescer',
        text: 'O mês está com mais saída do que entrada. Vale revisar contas, compras e próximos recebimentos.',
        cta: 'Ver financeiro',
        route: 'financeiro/visao-geral'
      };
    }
    if (!vm.ordersToday.length) {
      return {
        icon: 'campaign',
        color: '#0F6B8F',
        title: 'Puxe uma venda para hoje',
        text: 'Ainda não entrou pedido hoje. Veja produtos, promoções ou uma ação simples para movimentar o dia.',
        cta: 'Abrir ações',
        route: 'marketing/promocoes'
      };
    }
    return {
      icon: 'analytics',
      color: '#1F6F43',
      title: 'Acompanhe o ritmo do mês',
      text: 'A operação já tem movimento. Agora vale ver se as vendas acompanham a rota escolhida.',
      cta: 'Ver performance',
      route: 'crescimento/performance'
    };
  }

  function _routeReading(vm) {
    if (!vm.target.revenue) return 'Ainda não há uma rota ativa para comparar o mês. Crie uma rota para saber o quanto precisa vender e quantos pedidos precisa buscar.';
    if (vm.paceDiff >= 0) return 'O mês está acompanhando a rota. Continue olhando pedidos, ticket médio e caixa para não perder ritmo.';
    return 'O mês está abaixo do ritmo combinado. O ideal agora é olhar Performance e escolher a próxima ação com mais foco.';
  }

  function _orderStatusLabel(status) {
    var s = String(status || '').toLowerCase();
    var map = {
      pending: 'Pendente',
      pendente: 'Pendente',
      preparando: 'Em preparo',
      preparation: 'Em preparo',
      ready: 'Pronto',
      pronto: 'Pronto',
      delivered: 'Entregue',
      entregado: 'Entregue',
      finalizado: 'Finalizado',
      cancelled: 'Cancelado',
      cancelado: 'Cancelado'
    };
    return map[s] || status || 'Pedido';
  }

  function _flattenOnboarding(phases) {
    var out = [];
    (phases || []).forEach(function (phase) {
      (phase.steps || []).forEach(function (step) {
        out.push(step);
      });
    });
    return out;
  }

  function _currentOnboardingPhase(phases) {
    return (phases || []).find(function (phase) {
      return !(phase.steps || []).every(function (step) { return step.done; });
    }) || (phases || [])[0] || null;
  }

  function _onboardingProgressSummary() {
    if (!_loaded) {
      return {
        completed: false,
        completedSteps: 0,
        totalSteps: 0,
        progressPercent: 0,
        currentPhaseKey: 'loading',
        currentPhaseTitle: 'Carregando',
        currentStepTitle: '',
        nextRoute: ''
      };
    }
    var phases = _onboardingSteps();
    var flat = _flattenOnboarding(phases);
    var total = flat.length;
    var completedSteps = flat.filter(function (step) { return !!step.done; }).length;
    var completed = total ? completedSteps >= total : true;
    var phase = _currentOnboardingPhase(phases);
    var nextStep = null;
    if (!completed) {
      var phaseSteps = (phase && phase.steps) || [];
      nextStep = phaseSteps.find(function (step) { return !step.done; }) || flat.find(function (step) { return !step.done; }) || null;
    }
    if (completed) {
      var now = new Date();
      var todayKey = _dateKey(now);
      var month = _monthRange(now);
      var ordersToday = _ordersInRange(todayKey, todayKey);
      var entriesMonth = _itemsInRange(_data.entries, month.start, month.end);
      var target = _monthTarget();
      var revenueMonth = _sum(_ordersInRange(month.start, month.end), function (o) { return _orderRevenue(o); });
      var daysElapsed = Math.max(1, now.getDate());
      var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      var expectedNow = target.revenue ? (target.revenue / daysInMonth) * daysElapsed : 0;
      var routine = _nextContinuousRoutine({
        hasOpenOrder: (_data.orders || []).filter(_isOpenOrder).length > 0,
        hasOrderToday: ordersToday.length > 0,
        hasPurchase: (_data.purchases || []).length > 0,
        hasStockMovement: (_data.stockMovements || []).length > 0,
        hasPlan: !!target.revenue,
        paceDiff: revenueMonth - expectedNow,
        hasEntry: _sum(entriesMonth, function (x) { return _num(x.value); }) > 0
      });
      return {
        completed: true,
        completedSteps: completedSteps,
        totalSteps: total,
        progressPercent: 100,
        currentPhaseKey: 'continuous',
        currentPhaseTitle: 'Negócio em movimento',
        currentStepTitle: routine.title || '',
        nextRoute: routine.route || '',
        nextRoutineTitle: routine.title || ''
      };
    }
    return {
      completed: false,
      completedSteps: completedSteps,
      totalSteps: total,
      progressPercent: total ? Math.round((completedSteps / total) * 100) : 0,
      currentPhaseKey: (phase && phase.key) || '',
      currentPhaseTitle: (phase && phase.title) || 'Primeiros passos',
      currentStepTitle: (nextStep && nextStep.title) || '',
      nextRoute: (nextStep && nextStep.route) || ''
    };
  }

  function _currentRoute() {
    try {
      if (window.Router && Router.current) return String(Router.current() || 'dashboard');
    } catch (err) {}
    return String((window.location.hash || '').replace('#', '') || 'dashboard');
  }

  function _onboardingIntroState() {
    var state = { welcomeSeen: false, tourOpen: false, tourDone: false };
    try {
      var local = _readLocalOnboardingState();
      var currentVersion = local.version || '';
      var sameVersion = currentVersion === ONBOARDING_VERSION;
      state.welcomeSeen = sameVersion && !!local.welcomeSeen;
      state.tourOpen = false;
      state.tourDone = sameVersion ? !!local.tourDone : false;
    } catch (err) {}
    return state;
  }

  function _ownerFirstName() {
    var profile = {};
    var user = {};
    try { profile = window.Auth && Auth.getAdminProfile ? (Auth.getAdminProfile() || {}) : {}; } catch (err) {}
    try { user = window.Auth && Auth.getUser ? (Auth.getUser() || {}) : {}; } catch (err2) {}
    var raw = profile.preferredName || profile.socialName || profile.ownerName || profile.name ||
      _data.geral.ownerName || _data.geral.responsibleName || user.displayName || user.email || '';
    raw = String(raw || '').trim();
    if (!raw) return '';
    if (raw.indexOf('@') > -1) raw = raw.split('@')[0];
    return raw.split(/\s+/)[0];
  }

  function _welcomeModal(vm) {
    if (vm.onboardingDone) return '';
    var state = _onboardingIntroState();
    if (state.welcomeSeen) return '';
    var name = _ownerFirstName();
    var title = name ? name + ', bora construir seu império de comida na Europa?' : 'Bora construir seu império de comida na Europa?';
    return '<div id="dash-welcome" class="dash-welcome-backdrop">' +
      '<section class="dash-welcome-modal">' +
        '<div style="padding:24px 24px 18px;position:relative;">' +
          '<button type="button" onclick="Modules.Dashboard._startWelcomeTour()" aria-label="Fechar" style="position:absolute;right:14px;top:14px;width:34px;height:34px;border:none;background:rgba(255,255,255,.72);border-radius:12px;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(31,31,31,.05);"><span class="mi" style="font-size:19px;">close</span></button>' +
          '<div style="display:flex;align-items:flex-start;gap:16px;padding-right:34px;">' +
            '<span class="mi" style="width:58px;height:58px;border-radius:18px;background:linear-gradient(145deg,#fff,#FFF4F1);border:1px solid #F2D7D2;color:#B42318;box-shadow:inset 0 1px 0 rgba(255,255,255,.92),0 16px 32px rgba(180,35,24,.12);font-size:28px;flex:0 0 auto;">diamond</span>' +
            '<div style="min-width:0;">' +
              '<div style="display:inline-flex;align-items:center;gap:8px;color:#B42318;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:9px;"><span aria-hidden="true" style="width:7px;height:7px;border-radius:999px;background:#B6925E;box-shadow:0 0 0 4px rgba(182,146,94,.16);display:inline-flex;flex:0 0 auto;"></span>Primeiros passos do negócio</div>' +
              '<h2 style="font-size:30px;color:#1F1F1F;line-height:1.08;margin:0;max-width:560px;font-weight:780;">' + _esc(title) + '</h2>' +
              '<p style="font-size:15px;color:#5F5750;line-height:1.55;margin:9px 0 0;max-width:620px;">A gente vai montar a base do seu negócio por partes. O checklist fica no canto da tela e te guia pelo que preencher primeiro, sem um passeio separado antes de começar.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:0 24px 24px;display:flex;flex-direction:column;gap:14px;">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(170px,100%),1fr));gap:10px;">' +
            _welcomePoint('checklist', 'Seguir por etapas', 'Cada item abre a tela certa e explica o que precisa ficar pronto naquela parte.') +
            _welcomePoint('settings', 'Montar a base', 'Produtos, canais, custos e dados do negócio entram antes das decisões de crescimento.') +
            _welcomePoint('route', 'Escolher a rota', 'Com a base pronta, o Plano de Voo mostra quanto vender e a Temporada mostra o que fazer agora.') +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid rgba(234,228,218,.8);padding-top:14px;">' +
            '<span style="font-size:12px;color:#6F6860;line-height:1.45;max-width:390px;">Você pode seguir no seu ritmo. O checklist fica disponível em todas as telas.</span>' +
            '<button type="button" onclick="Modules.Dashboard._startWelcomeTour()" class="dash-soft-btn" style="height:42px;border:none;background:#B42318;color:#fff;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;padding:0 16px;box-shadow:0 12px 24px rgba(180,35,24,.16);">Abrir checklist</button>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  }

  function _welcomePoint(icon, title, text) {
    return '<div class="dash-welcome-point">' +
      '<span class="mi" style="width:34px;height:34px;border-radius:12px;background:#F5EFE6;color:#8A6F5A;display:flex;align-items:center;justify-content:center;font-size:19px;flex:0 0 auto;">' + _esc(icon) + '</span>' +
      '<div style="min-width:0;"><div style="font-size:13px;color:#1F1F1F;font-weight:780;line-height:1.2;">' + _esc(title) + '</div><div style="font-size:12px;color:#5F5750;line-height:1.42;margin-top:4px;">' + _esc(text) + '</div></div>' +
    '</div>';
  }

  function _activeChecklistGuide() {
    var raw = '';
    try { raw = window.localStorage ? localStorage.getItem('boca_dashboard_checklist_guide') : ''; } catch (err) {}
    if (!raw) return null;
    var parts = String(raw).split(':');
    var phaseKey = parts[0] || '';
    var index = parseInt(parts[1] || '0', 10);
    var phases = _onboardingSteps();
    var phase = phases.filter(function (p) { return p && p.key === phaseKey; })[0] || null;
    if (!phase || !Array.isArray(phase.steps)) return null;
    var step = phase.steps[index] || null;
    if (!step) return null;
    return { phase: phase, step: step, index: index, guide: _checklistGuideForStep(step, phase) };
  }

  function _checklistGuideModal() {
    var active = _activeChecklistGuide();
    if (!active || !active.guide) return '';
    var guide = active.guide;
    var fields = Array.isArray(guide.fields) ? guide.fields : [];
    var actions = Array.isArray(guide.actions) ? guide.actions : [];
    return '<div id="dash-checklist-guide" class="dash-checklist-backdrop">' +
      '<section class="dash-checklist-modal">' +
        '<div style="padding:18px 20px;background:linear-gradient(135deg,#FFFDF8 0%,#FAF1E6 100%);display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border-bottom:1px solid rgba(234,228,218,.72);">' +
          '<div style="min-width:0;">' +
            '<div class="dash-tour-tag"><span aria-hidden="true" style="width:6px;height:6px;border-radius:999px;background:#B6925E;display:inline-block;"></span>Como preencher</div>' +
            '<h2 style="font-size:22px;color:#1F1F1F;line-height:1.15;margin:8px 0 0;font-weight:780;">' + _esc(guide.title || active.step.title) + '</h2>' +
            '<p style="font-size:12.5px;color:#5F5750;line-height:1.45;margin:6px 0 0;">' + _esc(guide.path || '') + '</p>' +
          '</div>' +
          '<button type="button" onclick="Modules.Dashboard._closeChecklistGuide()" aria-label="Fechar" style="width:34px;height:34px;border:none;background:#fff;border-radius:12px;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:19px;">close</span></button>' +
        '</div>' +
        '<div style="padding:17px 20px 18px;display:flex;flex-direction:column;gap:13px;">' +
          '<div style="display:flex;gap:11px;align-items:flex-start;border:1px solid #EFE6DA;background:#FFFEFC;border-radius:16px;padding:13px;">' +
            '<span class="mi" style="width:38px;height:38px;border-radius:14px;background:#F5EFE6;color:#8A6F5A;display:flex;align-items:center;justify-content:center;font-size:21px;flex:0 0 auto;">' + _esc(guide.icon || active.step.icon || 'checklist') + '</span>' +
            '<div style="min-width:0;"><div style="font-size:13px;color:#1F1F1F;font-weight:780;line-height:1.25;">O que fazer nesta tela</div><div style="font-size:12.5px;color:#5F5750;line-height:1.5;margin-top:4px;">' + _esc(guide.intro || '') + '</div></div>' +
          '</div>' +
          '<div style="border:1px solid #EFE6DA;background:#fff;border-radius:16px;padding:12px 13px;">' +
            '<strong style="display:block;color:#1F1F1F;font-size:12px;margin-bottom:8px;">O que preencher ou conferir</strong>' +
            '<div style="display:flex;flex-direction:column;gap:7px;">' + fields.map(function (detail) {
              return '<div class="dash-checklist-detail"><span style="color:#1F1F1F;font-weight:760;">' + _esc(detail[0]) + '</span><span style="color:#5F5750;">' + _esc(detail[1]) + '</span></div>';
            }).join('') + '</div>' +
          '</div>' +
          '<div style="border:1px solid #EFE6DA;background:#FFFEFC;border-radius:16px;padding:12px 13px;">' +
            '<strong style="display:block;color:#1F1F1F;font-size:12px;margin-bottom:8px;">Como fazer sem se perder</strong>' +
            '<div style="display:flex;flex-direction:column;gap:7px;">' + actions.map(function (item) {
              return '<div style="display:flex;gap:8px;align-items:flex-start;color:#4F4741;font-size:12.5px;line-height:1.42;"><span class="mi" style="font-size:16px;color:#B6925E;flex:0 0 auto;margin-top:1px;">check_circle</span><span>' + _esc(item) + '</span></div>';
            }).join('') + '</div>' +
          '</div>' +
          '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:12px 13px;color:#4F4741;font-size:12.5px;line-height:1.45;">' +
            '<strong style="display:block;color:#1F1F1F;font-size:12px;margin-bottom:3px;">Quando este passo está pronto</strong>' + _esc(guide.ready || 'Quando as principais informações estiverem salvas e fizerem sentido para a rotina do negócio.') +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" onclick="Modules.Dashboard._closeChecklistGuide()" class="dash-soft-btn" style="height:38px;padding:0 13px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:12px;font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;">Fechar</button>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  }

  function _openChecklistGuide(phaseKey, index) {
    try {
      if (window.localStorage) localStorage.setItem('boca_dashboard_checklist_guide', String(phaseKey || '') + ':' + String(index || 0));
    } catch (err) {}
    _writeLocalOnboardingState({ version: ONBOARDING_VERSION, welcomeSeen: true, tourOpen: false, tourDone: true, collapsed: false }, { action: 'checklist_guide_opened' });
    var active = _activeChecklistGuide();
    var route = active && active.step ? active.step.route : '';
    if (route) _navigateChecklistRoute(route);
    _renderGlobalOnboarding();
    window.setTimeout(function () { _renderGlobalOnboarding(); }, 180);
  }

  function _closeChecklistGuide() {
    try { if (window.localStorage) localStorage.removeItem('boca_dashboard_checklist_guide'); } catch (err) {}
    _setTourScrollLock(false);
    _renderGlobalOnboarding();
  }

  function _openChecklistGuideRoute() {
    var active = _activeChecklistGuide();
    var route = active && active.step ? active.step.route : '';
    if (!route) return;
    _navigateChecklistRoute(route);
    window.setTimeout(function () { _renderGlobalOnboarding(); }, 180);
  }

  function _navigateChecklistRoute(route) {
    if (window.Router && typeof Router.navigate === 'function') {
      Router.navigate(route);
    } else {
      window.location.hash = '#' + route;
    }
  }

  function _checklistGuideForStep(step, phase) {
    var title = String(step && step.title || '');
    var base = {
      title: title,
      icon: step && step.icon,
      path: 'Caminho: ' + ((phase && phase.title) || 'Primeiros passos'),
      intro: 'Abra esta tela para deixar uma parte importante do negócio pronta antes de avançar.',
      fields: [['Informações principais', 'Preencha os campos que descrevem esta parte do negócio.'], ['Salvar', 'Depois de revisar, salve e volte ao checklist para seguir.']],
      actions: ['Leia os campos de cima para baixo.', 'Preencha apenas com informações reais do negócio.', 'Se algo ainda não existir, deixe para voltar depois em vez de inventar.'],
      ready: 'Quando a tela estiver salva com informações reais e úteis para a operação.'
    };
    var guides = {
      'Preencher dados do negócio': {
        icon: 'badge',
        path: 'Caminho: Configurações > Geral',
        intro: 'Aqui você coloca os dados que identificam o negócio e aparecem em partes importantes do Painel BocaFood e da loja online.',
        fields: [
          ['Nome do negócio', 'Use o nome que a cliente reconhece. Ele precisa bater com a marca que aparece no cardápio online.'],
          ['Contato', 'Informe WhatsApp, telefone e e-mail que realmente são usados no atendimento.'],
          ['Endereço', 'Busque o endereço. O que vier automático fica preenchido; complete número, bairro, referência ou o que faltar.'],
          ['Dados fiscais', 'Preencha apenas o que o negócio já usa hoje. Se ainda não tiver, volte depois.']
        ],
        actions: ['Comece pelo nome e contato.', 'Depois confira o endereço com calma, porque ele alimenta retirada, entrega e informações da loja.', 'Salve e veja se o nome aparece certo no topo do painel.'],
        ready: 'Está pronto quando nome, contato e endereço principal estão salvos e representam o negócio corretamente.'
      },
      'Criar canais de venda': {
        icon: 'storefront',
        path: 'Caminho: Configurações > Canais de venda',
        intro: 'Canais mostram por onde o pedido chega. Isso ajuda a entender onde vale vender mais e onde a taxa está pesando.',
        fields: [
          ['Nome do canal', 'Use nomes fáceis de reconhecer, como Cardápio, Instagram, WhatsApp, Balcão ou Marketplace.'],
          ['Categoria financeira', 'Escolha onde o dinheiro desse canal aparece no financeiro. Se ainda não existir uma categoria boa, crie ali mesmo no campo. Exemplo: Vendas Cardápio ou Vendas Instagram.'],
          ['Comissão', 'Preencha só se o canal cobra uma porcentagem. Se não cobra, deixe zerado.'],
          ['Taxa fixa', 'Use quando existe um valor fixo por venda ou pedido. Se não existe, deixe zerado.'],
          ['Imposto comissão %', 'Use quando existe imposto sobre a comissão cobrada pelo canal. Se não existe ou você ainda não controla isso, deixe zerado.']
        ],
        actions: ['Mantenha apenas canais que o negócio realmente usa.', 'Se precisar organizar melhor o financeiro, crie a categoria de entrada no próprio campo de categoria.', 'Não invente taxa para preencher campo.', 'A forma de pagamento será escolhida em cada venda ou pedido, porque pode mudar de cliente para cliente.', 'Salve e depois use esses canais ao criar pedidos e analisar performance.'],
        ready: 'Está pronto quando os canais reais estão salvos com taxas corretas ou zeradas.'
      },
      'Definir preço e margem': {
        icon: 'calculate',
        path: 'Caminho: Preço e margem > Regras',
        intro: 'Essa tela ajuda o BocaFood a sugerir preços sem depender do achismo. Você informa a porcentagem de sobra que quer buscar, o mínimo que aceita e como prefere arredondar os preços.',
        fields: [
          ['Margem desejada padrão %', 'Informe, em porcentagem, quanto quer que sobre em cada venda depois de pagar os custos do produto. Exemplo: se colocar 60%, em uma venda de €10,00 o ideal é sobrar €6,00 para o negócio.'],
          ['Margem mínima aceitável %', 'Informe o menor percentual de sobra que ainda aceita antes de o produto virar alerta. Exemplo: se colocar 40%, em uma venda de €10,00 você não quer que sobre menos de €4,00.'],
          ['Markup padrão', 'Informe um número multiplicador para ajudar a formar preço. Exemplo: se colocar 3 e o produto custa €1,00, a referência de preço fica perto de €3,00. Markup ajuda a chegar no preço; margem mostra quanto sobra.'],
          ['Arredondamento de preço', 'Escolha como o preço final deve aparecer. Se escolher terminar em ,90, um preço calculado em €4,83 pode virar €4,90 para ficar mais fácil de usar no cardápio.']
        ],
        actions: ['Comece com uma margem desejada realista para a maioria dos produtos.', 'Defina uma margem mínima para o BocaFood sinalizar produtos que deixam pouca sobra.', 'Use markup como apoio, principalmente enquanto ainda está organizando custos e receitas.', 'Escolha um arredondamento que deixe os preços claros para a cliente.'],
        ready: 'Está pronto quando a regra mostra quanto você quer que sobre, qual é o mínimo aceitável e como os preços devem ser arredondados.'
      },
      'Cadastrar insumos e produtos comprados': {
        icon: 'inventory_2',
        path: 'Caminho: Compras > Produtos / Insumos',
        intro: 'Aqui entram os ingredientes, materiais de embalagem e produtos prontos que o negócio compra. Nesta primeira etapa, não precisa cadastrar tudo: comece pelos itens dos produtos que mais vendem e pelos insumos necessários para montar 2 ou 3 receitas principais.',
        fields: [
          ['Classe do item', 'Escolha Insumo para ingredientes, caixas, potes, sacos, etiquetas e outros itens usados no preparo, montagem ou entrega. Escolha Produto quando o item já chega pronto para vender, como bebida, doce de fornecedor ou produto revendido.'],
          ['Nome', 'Use um nome simples de procurar depois. Exemplos: Farinha de trigo, Caixa para bolo, Guaraná lata ou Brigadeiro fornecedor.'],
          ['Categoria', 'Pense na categoria como uma pasta para encontrar o item depois. Use nomes do dia a dia do negócio, como Bebidas, Carnes, Ingredientes secos, Embalagens, Descartáveis ou Congelados.'],
          ['Unidade base', 'Escolha a unidade em que você compra e controla o custo desse item, como kg, g, litro, ml ou unidade. Se você compra batata por kg, use kg; se compra refrigerante por unidade, use unidade.'],
          ['Fornecedor padrão', 'Preencha com o fornecedor de quem você compra esse item com mais frequência. Isso deixa o registro de compra mais rápido depois.'],
          ['Preço de compra base', 'Preencha uma primeira base de custo quando ainda não existe compra registrada. Depois que houver compras, esse campo vira custo médio automático e não deve ser alterado pelo cadastro do item.'],
          ['Embalagem de compra padrão', 'Informe como você costuma comprar esse item: saco, caixa, pacote, garrafa, bandeja ou unidade.'],
          ['Conteúdo por embalagem (×)', 'Preencha quanto vem dentro da embalagem usando a mesma unidade base. Se a unidade base é kg e vem 400 g, preencha 0,400. Se a unidade base é g e vem 400 g, preencha 400. Se a caixa tem 12 unidades, preencha 12.'],
          ['Estoque mínimo e máximo', 'Estoque mínimo é a quantidade que acende o alerta para comprar mais. Estoque máximo é a quantidade limite que vale a pena manter guardada para não comprar além do necessário.'],
          ['Cadastro ativo', 'Deixe ativo enquanto o item ainda é usado. Quando parar de usar, desative para manter o histórico organizado.'],
          ['Custo atual e última compra', 'Esses campos são atualizados automaticamente pelo BocaFood quando você registra compras. O custo atual passa a usar a média das compras do item.'],
          ['Pode ser usado em receitas', 'Marque quando o item entra nas receitas. Assim ele aparece como ingrediente e entra no custo de produção.'],
          ['Aproveitamento (%)', 'Use 100% quando tudo entra na receita. Se uma parte se perde, pese antes e depois de preparar. Exemplo: comprou 1 kg e aproveitou 800 g; 800 g é 80% de 1 kg, então preencha 80%.']
        ],
        actions: ['Comece pelos ingredientes e materiais de embalagem mais usados.', 'Cadastre também produtos comprados prontos, se você vende ou usa algum item já pronto.', 'Depois use esses itens para montar receitas com custo mais confiável.'],
        ready: 'Está pronto quando os principais insumos, materiais de embalagem e produtos comprados estão cadastrados com unidade e custo.'
      },
      'Cadastrar receitas': {
        icon: 'receipt_long',
        path: 'Caminho: Produção > Receitas',
        intro: 'Receitas mostram o que cada produção usa. Isso ajuda a entender custo, rendimento, compras, produção e estoque.',
        fields: [
          ['Produto ou base produzida', 'Escolha o que será produzido: massa, recheio, combo, produto pronto ou etapa de receita.'],
          ['Rendimento', 'Informe quanto essa receita rende no final.'],
          ['Ingredientes', 'Adicione o que entra na produção com quantidade e unidade.'],
          ['Custo', 'Confira se os insumos têm custo para o cálculo fazer sentido.']
        ],
        actions: ['Cadastre primeiro as receitas que mais impactam a venda.', 'Use quantidades reais do preparo.', 'Salve e confira se o custo previsto parece próximo da realidade.'],
        ready: 'Está pronto quando as receitas principais têm rendimento e ingredientes cadastrados.'
      },
      'Cadastrar produtos do cardápio': {
        icon: 'restaurant_menu',
        path: 'Caminho: Cardápio > Produtos',
        intro: 'Depois dos insumos e receitas, cadastre o que a cliente realmente compra no cardápio. Aqui o produto ganha preço, imagem, opções e visibilidade para venda.',
        fields: [
          ['Nome e categoria', 'Use nomes claros e coloque cada produto no grupo certo.'],
          ['Preço de venda', 'Informe o valor que a cliente vai pagar.'],
          ['Vínculo com receita ou item pronto', 'Quando existir, ligue o produto ao que foi cadastrado na produção ou nas compras. Isso melhora estoque, custo e margem.'],
          ['Imagem e opções', 'Use foto quando tiver e cadastre sabores, tamanhos, adicionais ou combos quando existirem.'],
          ['Visibilidade', 'Deixe marcado apenas o que deve aparecer para venda.']
        ],
        actions: ['Comece pelos produtos que a cliente mais pede.', 'Confira se produto produzido tem receita e se produto comprado pronto tem custo.', 'Depois abra o cardápio online para ver se a compra ficou fácil.'],
        ready: 'Está pronto quando os principais produtos de venda aparecem com nome, preço, categoria e vínculo correto quando existir.'
      },
      'Registrar custos fixos': {
        icon: 'payments',
        path: 'Caminho: Financeiro > Saídas',
        intro: 'Aqui entram contas e compromissos que o negócio precisa pagar. Esses valores ajudam o Plano de Voo a mostrar quanto vender para fechar bem.',
        fields: [
          ['Descrição', 'Escreva o nome da conta de um jeito fácil de reconhecer.'],
          ['Valor', 'Informe o valor real em moeda.'],
          ['Vencimento', 'Coloque a data em que precisa pagar.'],
          ['Categoria', 'Separe despesa, custo direto ou custo indireto conforme a natureza do gasto.'],
          ['Recorrência', 'Marque quando a conta se repete todo mês.']
        ],
        actions: ['Comece pelas contas que não podem faltar, como aluguel, energia, internet e serviços.', 'Confira se o valor está em moeda e não em centavos.', 'Salve para que a rota anual use uma base mais real.'],
        ready: 'Está pronto quando os principais compromissos do período estão registrados.'
      },
      'Criar Plano de Voo': {
        icon: 'flight_takeoff',
        path: 'Caminho: Crescimento > Plano de Voo',
        intro: 'O Plano de Voo transforma a base do negócio em uma rota para o ano. Ele ajuda a escolher quanto vender, quantos pedidos buscar e qual esforço a rota pede.',
        fields: [
          ['Ticket médio', 'Confira o valor médio dos pedidos. Se ainda tiver poucos pedidos, use uma estimativa realista.'],
          ['Vendas por canal', 'Use o desempenho atual como ponto de partida para a rota.'],
          ['Custos e despesas', 'Confira se os valores que saem todo mês estão aparecendo corretamente.'],
          ['Meses fortes e fracos', 'Ajuste os meses que vendem mais, vendem menos ou não serão trabalhados.'],
          ['Cenário', 'Escolha a realidade que quer buscar: sobrevivência, segurança, crescimento ou lucro forte.']
        ],
        actions: ['Confira a base antes de escolher o cenário.', 'Selecione a rota que parece possível para o momento do negócio.', 'Salve e ative a rota para acompanhar depois.'],
        ready: 'Está pronto quando existe uma rota ativa para guiar o ano ou o restante do ano.'
      },
      'Criar primeira Temporada': {
        icon: 'event_available',
        path: 'Caminho: Crescimento > Temporadas',
        intro: 'A Temporada transforma a rota em jogadas de curto prazo. É aqui que o negócio decide o que fazer agora para avançar.',
        fields: [
          ['Objetivo', 'Escolha se a temporada vai vender mais, aumentar ticket, fidelizar ou melhorar consistência.'],
          ['Estratégia', 'Escolha o caminho que combina com o objetivo.'],
          ['Ritmo', 'Defina quantas jogadas o negócio consegue executar ao mesmo tempo.'],
          ['Período', 'Use um período curto o bastante para acompanhar e corrigir.']
        ],
        actions: ['Escolha um objetivo que conversa com a rota ativa.', 'Não coloque mais ações do que consegue executar.', 'Depois acompanhe a aba Próxima Jogada.'],
        ready: 'Está pronto quando existe uma temporada ativa com jogadas claras.'
      },
      'Organizar cardápio': {
        icon: 'menu_book',
        path: 'Caminho: Cardápio > Produtos',
        intro: 'Organizar o cardápio deixa a compra mais fácil. A cliente precisa encontrar rápido o que quer pedir.',
        fields: [
          ['Categorias', 'Agrupe produtos de um jeito natural para a cliente.'],
          ['Destaques', 'Use destaque em produtos importantes, sem transformar tudo em destaque.'],
          ['Produtos ocultos', 'Confira se produtos indisponíveis não aparecem para venda.'],
          ['Preços e opções', 'Veja se variações, combos e adicionais estão claros.']
        ],
        actions: ['Abra as categorias como se fosse uma cliente comprando.', 'Deixe os produtos mais importantes fáceis de encontrar.', 'Corrija nomes longos, preço errado ou opções confusas.'],
        ready: 'Está pronto quando o cardápio está fácil de navegar e comprar.'
      },
      'Configurar cardápio online': {
        icon: 'store',
        path: 'Caminho: Loja online > Template da loja',
        intro: 'Essa tela cuida da vitrine pública. Ela precisa passar confiança e explicar bem como comprar.',
        fields: [
          ['Identidade', 'Confira nome da loja, logo, capa, cores e apresentação curta.'],
          ['Vitrine', 'Revise card principal, promoções, programa de pontos e avaliações.'],
          ['Textos', 'Preencha sobre a loja, política de entrega, cancelamento e aviso importante quando existir.'],
          ['Publicação', 'Confira o link e publique quando tudo estiver pronto.']
        ],
        actions: ['Use a cor da marca com leveza.', 'Revise no celular, porque muitas clientes vão comprar por lá.', 'Publique só depois de conferir produtos, entrega e pagamento.'],
        ready: 'Está pronto quando a loja online mostra a marca, os produtos e as informações principais sem confundir.'
      },
      'Conferir entrega e retirada': {
        icon: 'local_shipping',
        path: 'Caminho: Loja online > Operação e Checkout',
        intro: 'Entrega e retirada precisam deixar claro como a cliente recebe o pedido e quanto isso custa.',
        fields: [
          ['Modos de atendimento', 'Ative entrega, retirada ou os dois, conforme o negócio atende.'],
          ['Endereço de retirada', 'Confira rua, número, bairro e referência quando houver.'],
          ['Zonas e valores', 'Cadastre onde entrega, a partir de quanto e o valor da entrega.'],
          ['Horários', 'Defina dias, períodos e antecedência para pedidos.'],
          ['Pedido mínimo', 'Use quando precisa de valor mínimo para aceitar entrega.']
        ],
        actions: ['Teste como cliente: escolha entrega, depois retirada.', 'Confira se o carrinho mostra os campos certos em cada caso.', 'Ajuste horários antes de publicar.'],
        ready: 'Está pronto quando a cliente consegue escolher entrega ou retirada sem dúvida.'
      },
      'Registrar primeira compra': {
        icon: 'shopping_cart',
        path: 'Caminho: Compras > Registros',
        intro: 'Registrar compra mostra o que entrou, quanto custou e ajuda a alimentar estoque e custo.',
        fields: [
          ['Fornecedor', 'Informe de quem comprou quando souber.'],
          ['Itens', 'Adicione insumos ou produtos comprados com quantidade, unidade e valor.'],
          ['Pagamento', 'Informe forma, conta e vencimento quando fizer sentido.'],
          ['Status', 'Marque se está comprado, recebido ou pendente.']
        ],
        actions: ['Registre a compra do jeito que ela veio na nota ou recibo.', 'Confira quantidade e valor antes de salvar.', 'Depois confirme o recebimento quando os itens entrarem de verdade.'],
        ready: 'Está pronto quando a primeira compra está salva com itens e valores corretos.'
      },
      'Receber a compra no estoque': {
        icon: 'inventory_2',
        path: 'Caminho: Compras > Registros',
        intro: 'Receber a compra confirma que os itens realmente chegaram. Isso separa compra planejada de item disponível.',
        fields: [
          ['Itens recebidos', 'Confira se chegou tudo ou se algum item veio diferente.'],
          ['Quantidade recebida', 'Ajuste a quantidade real quando for diferente da compra.'],
          ['Valor recebido', 'Confirme o valor em moeda.'],
          ['Data do recebimento', 'Use a data em que os itens entraram.']
        ],
        actions: ['Abra a compra cadastrada.', 'Clique em confirmar recebimento.', 'Revise item por item antes de salvar.'],
        ready: 'Está pronto quando a compra gerou entrada de estoque sem duplicar.'
      },
      'Receber primeiro pedido': {
        icon: 'receipt_long',
        path: 'Caminho: Pedidos > Lista ou Venda presencial',
        intro: 'O pedido é o registro da venda. Ele alimenta cozinha, financeiro, cliente, estoque e leituras de crescimento.',
        fields: [
          ['Canal de venda', 'Escolha por onde o pedido chegou.'],
          ['Cliente', 'Selecione cliente existente ou cadastre rápido quando precisar.'],
          ['Produtos', 'Busque e adicione os itens vendidos, com variações e escolhas quando existirem.'],
          ['Entrega ou retirada', 'Informe endereço, horário e taxa quando for entrega.'],
          ['Pagamento', 'Escolha a forma de pagamento correta.']
        ],
        actions: ['Comece pelo canal e cliente.', 'Adicione produtos pela busca.', 'Confira total, entrega, descontos e forma de pagamento antes de salvar.'],
        ready: 'Está pronto quando o primeiro pedido aparece na listagem com total e status corretos.'
      },
      'Acompanhar na cozinha': {
        icon: 'room_service',
        path: 'Caminho: Pedidos > Modo cozinha',
        intro: 'A cozinha ajuda a acompanhar o preparo sem perder horário, endereço, observações e status.',
        fields: [
          ['Status', 'Avance o pedido conforme ele anda: pendente, preparo, saída, entregue ou retirado.'],
          ['Itens', 'Confira produtos, quantidades, variações e observações.'],
          ['Entrega ou retirada', 'Veja endereço, horário e contato quando precisar.'],
          ['Checklist', 'Marque etapas internas para não esquecer nada.']
        ],
        actions: ['Abra o pedido no modo cozinha.', 'Confira itens antes de preparar.', 'Mude status só quando a etapa realmente acontecer.'],
        ready: 'Está pronto quando os pedidos em andamento estão acompanhados até finalizar.'
      },
      'Conferir dinheiro da venda': {
        icon: 'payments',
        path: 'Caminho: Financeiro > Visão geral',
        intro: 'Depois da venda, confira se o dinheiro entrou na conta certa e se taxas foram consideradas.',
        fields: [
          ['Entrada financeira', 'Veja se a venda criou entrada no financeiro.'],
          ['Conta', 'Confira onde o dinheiro entrou: caixa, banco, Stripe ou venda presencial.'],
          ['Forma de pagamento', 'Veja se dinheiro, cartão, PIX ou Stripe estão corretos.'],
          ['Taxas', 'Confira se comissão ou taxa do canal foi registrada quando existir.']
        ],
        actions: ['Compare o total do pedido com a entrada financeira.', 'Corrija a forma de pagamento se estiver errada.', 'Use essa conferência para evitar caixa bagunçado.'],
        ready: 'Está pronto quando a venda aparece no financeiro com valor e conta corretos.'
      },
      'Conferir estoque depois da venda': {
        icon: 'inventory',
        path: 'Caminho: Estoque > Itens',
        intro: 'Essa conferência mostra se a venda, compra ou produção mexeu nos itens certos.',
        fields: [
          ['Saldo atual', 'Veja quanto ficou de cada item.'],
          ['Movimentações', 'Confira entradas, saídas, ajustes e origem.'],
          ['Produto produzido', 'Produtos ligados à produção baixam pelo vínculo correto.'],
          ['Perdas ou estornos', 'Use quando um item precisa voltar ao estoque ou virar perda.']
        ],
        actions: ['Abra o item vendido.', 'Confira se a movimentação apareceu uma vez só.', 'Se faltar vínculo, ajuste o cadastro antes das próximas vendas.'],
        ready: 'Está pronto quando as movimentações recentes explicam o saldo que aparece.'
      },
      'Olhar o crescimento da semana': {
        icon: 'analytics',
        path: 'Caminho: Crescimento > Performance',
        intro: 'Performance mostra se o mês está seguindo a rota e quais sinais merecem atenção agora.',
        fields: [
          ['Rota ativa', 'Veja se existe Plano de Voo ativo para comparar o mês.'],
          ['Vendas do mês', 'Confira vendido, ticket médio e pedidos por dia.'],
          ['Temporadas', 'Veja se há uma jogada em andamento para melhorar o resultado.'],
          ['Maturidade', 'Observe se o negócio está evoluindo de verdade, não só usando o sistema.']
        ],
        actions: ['Abra Performance no fim da semana.', 'Veja se o mês está dentro da rota.', 'Se estiver abaixo, abra Temporadas para escolher a próxima jogada.'],
        ready: 'Está pronto quando a rotina já alimenta uma leitura clara de crescimento.'
      }
    };
    return Object.assign(base, guides[title] || {});
  }

  function _tourModal() {
    var open = false;
    try { open = window.localStorage && localStorage.getItem('boca_dashboard_tour_open') === '1'; } catch (err) {}
    if (!open) return '';
    var steps = _tourSteps();
    var index = _tourStepIndex(steps.length);
    var step = steps[index] || steps[0];
    var guidedActive = _isTourStepRouteActive(step) && !!step.actionFocus;
    return '<div id="dash-tour" class="dash-tour-backdrop">' +
      '<div id="dash-tour-spotlight" class="dash-tour-spotlight" style="display:none;"></div>' +
      '<section id="dash-tour-modal" class="dash-tour-modal">' +
        '<div style="padding:18px 20px;background:linear-gradient(135deg,#FFFDF8 0%,#FAF1E6 100%);display:flex;align-items:flex-start;justify-content:space-between;gap:14px;border-bottom:1px solid rgba(234,228,218,.72);">' +
          '<div style="min-width:0;"><div class="dash-tour-tag"><span aria-hidden="true" style="width:6px;height:6px;border-radius:999px;background:#B6925E;display:inline-block;"></span>' + _esc(step.chapter || 'Passeio guiado') + ' · passo ' + (index + 1) + ' de ' + steps.length + '</div><h2 style="font-size:21px;color:#1F1F1F;line-height:1.15;margin:8px 0 0;font-weight:780;">' + _esc(step.title) + '</h2></div>' +
          '<button type="button" onclick="Modules.Dashboard._closeTour()" style="width:34px;height:34px;border:none;background:#fff;border-radius:12px;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:19px;">close</span></button>' +
        '</div>' +
        '<div style="padding:17px 20px 18px;display:flex;flex-direction:column;gap:13px;">' +
          '<div style="display:flex;gap:11px;align-items:flex-start;border:1px solid #EFE6DA;background:#FFFEFC;border-radius:16px;padding:13px;">' +
            '<span class="mi" style="width:36px;height:36px;border-radius:13px;background:#F5EFE6;color:#8A6F5A;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto;">' + _esc(step.icon || 'touch_app') + '</span>' +
            '<div style="min-width:0;"><div style="font-size:13px;color:#1F1F1F;font-weight:780;line-height:1.25;">' + _esc(step.where) + '</div><div style="font-size:12.5px;color:#5F5750;line-height:1.5;margin-top:4px;">' + _esc(step.text) + '</div></div>' +
          '</div>' +
          '<div style="border:1px solid #EFE6DA;background:#fff;border-radius:16px;padding:12px 13px;">' +
            '<strong style="display:block;color:#1F1F1F;font-size:12px;margin-bottom:8px;">' + _esc(step.detailTitle || 'O que tem dentro') + '</strong>' +
            '<div style="display:flex;flex-direction:column;gap:7px;">' + (step.details || []).map(function (detail) {
              return '<div class="dash-tour-detail"><span style="color:#1F1F1F;font-weight:760;">' + _esc(detail[0]) + '</span><span style="color:#5F5750;">' + _esc(detail[1]) + '</span></div>';
            }).join('') + '</div>' +
          '</div>' +
          '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:12px 13px;color:#4F4741;font-size:12.5px;line-height:1.45;">' +
            '<strong style="display:block;color:#1F1F1F;font-size:12px;margin-bottom:3px;">' + _esc(step.actionTitle || 'O que fazer aqui') + '</strong>' + _esc(step.action) +
          '</div>' +
          (guidedActive ? '<div style="background:#FFF8F1;border:1px solid #ECD6BE;border-radius:14px;padding:12px 13px;color:#4F4741;font-size:12.5px;line-height:1.45;box-shadow:0 8px 18px rgba(182,146,94,.08);">' +
            '<strong style="display:flex;align-items:center;gap:7px;color:#1F1F1F;font-size:12px;margin-bottom:4px;"><span class="mi" style="font-size:17px;color:#B6925E;">touch_app</span>' + _esc(step.actionFocusTitle || 'Agora faça isso') + '</strong>' + _esc(step.actionFocus || '') +
          '</div>' : '') +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
            '<div style="display:flex;gap:5px;">' + steps.map(function (_, i) { return '<span style="width:7px;height:7px;border-radius:999px;background:' + (i === index ? '#B42318' : '#D8CEC3') + ';display:inline-block;"></span>'; }).join('') + '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              (index > 0 ? '<button type="button" onclick="Modules.Dashboard._prevTourStep()" class="dash-soft-btn" style="height:38px;padding:0 13px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:12px;font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;">Voltar</button>' : '') +
              (step.route ? '<button type="button" onclick="Modules.Dashboard._openGuidedRoute(' + index + ')" class="dash-soft-btn" style="height:38px;padding:0 13px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:12px;font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;">' + _esc(step.routeCta || 'Abrir área') + '</button>' : '') +
              '<button type="button" onclick="' + (index + 1 >= steps.length ? 'Modules.Dashboard._closeTour()' : 'Modules.Dashboard._nextTourStep()') + '" class="dash-soft-btn" style="height:38px;padding:0 14px;border:none;background:#B42318;color:#fff;border-radius:12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">' + (index + 1 >= steps.length ? 'Abrir checklist' : 'Próximo') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  }

  function _tourSteps() {
    return [
      {
        selector: '.sidebar',
        route: '',
        icon: 'view_sidebar',
        chapter: 'Como se orientar',
        title: 'Primeiro entenda a casa',
        where: 'Menu lateral',
        text: 'O menu e o mapa da casa. Ele separa a rotina, a configuracao e o crescimento para voce nao precisar procurar tudo no mesmo lugar.',
        detailTitle: 'Como ler',
        details: [
          ['Topo', 'Maturidade e Performance ficam em destaque porque mostram direcao e evolucao.'],
          ['Rotina', 'Pedidos, venda presencial, financeiro, compras, estoque e producao ajudam no dia a dia.'],
          ['Crescimento', 'Plano de Voo, Temporadas, Performance e Maturidade ajudam a decidir para onde ir.'],
          ['Configuracoes', 'Dados que alimentam as outras telas ficam aqui.']
        ],
        actionTitle: 'Como usar',
        action: 'Quando estiver perdida, volte para o menu. Pense nele como a divisao entre operar hoje e decidir o futuro do negocio.'
      },
      {
        selector: '[data-route="dashboard"]',
        route: 'dashboard',
        routeCta: 'Abrir Início',
        icon: 'home',
        chapter: 'Como se orientar',
        title: 'O Início é seu atalho do dia',
        where: 'Tela Início',
        text: 'A tela inicial nao substitui os modulos. Ela junta os caminhos curtos para voce vender, registrar dinheiro, cuidar de compra e olhar a direcao.',
        detailTitle: 'O que observar',
        details: [
          ['Hoje', 'mostra pedidos, venda do dia, ticket e sinais rapidos.'],
          ['Rotina', 'atalhos para venda, dinheiro, compra e estoque.'],
          ['Proximo passo', 'sugere o que olhar primeiro com base no que ja existe.'],
          ['Crescimento', 'leva para rota, temporadas, performance e maturidade.']
        ],
        actionTitle: 'Como usar',
        action: 'Abra o Início quando quiser saber por onde começar o dia sem entrar em todas as telas.'
      },
      {
        selector: '.dash-card',
        route: '',
        icon: 'dashboard_customize',
        chapter: 'Como se orientar',
        title: 'Cards mostram leitura, nao enfeite',
        where: 'Cards e blocos',
        text: 'Cada card deve responder uma pergunta: o que esta acontecendo, o que falta ou qual acao faz sentido agora.',
        detailTitle: 'Como diferenciar',
        details: [
          ['Resumo', 'traz uma leitura rapida, como vendido hoje ou saldo do mes.'],
          ['Acao', 'tem botao para abrir uma tela ou criar algo.'],
          ['Alerta', 'usa cor e texto curto quando algo precisa de atencao.'],
          ['Detalhe', 'aparece quando voce clica em um item ou abre um modal.']
        ],
        actionTitle: 'Como usar',
        action: 'Leia primeiro o titulo e o numero principal. Depois veja se existe um botao para agir ou abrir o detalhe.'
      },
      {
        selector: 'button',
        route: '',
        icon: 'smart_button',
        chapter: 'Como se orientar',
        title: 'Botões são decisões ou caminhos',
        where: 'Botões',
        text: 'No BocaFood, botao principal geralmente cria, salva ou leva para a proxima etapa. Botao claro costuma ser apoio, filtro ou detalhe.',
        detailTitle: 'Regra simples',
        details: [
          ['Botao forte', 'normalmente cria, salva, confirma ou abre a acao mais importante.'],
          ['Botao claro', 'abre detalhe, cancela, filtra ou ajuda sem mudar tudo.'],
          ['Icone', 'representa a acao quando o texto seria pesado.'],
          ['Salvar', 'quando muda dado importante, procure o botao de salvar no modal ou no card.']
        ],
        actionTitle: 'Como usar',
        action: 'Antes de clicar, olhe se o botao esta pedindo uma decisao ou apenas abrindo uma area.'
      },
      {
        selector: '.content, main, #app',
        route: '',
        icon: 'filter_alt',
        chapter: 'Como se orientar',
        title: 'Filtros e listas não mudam seus dados',
        where: 'Filtros, listas e abas',
        text: 'Filtros servem para encontrar informacao. Listas mostram o que ja foi criado. Abas separam partes da mesma area.',
        detailTitle: 'Como funciona',
        details: [
          ['Filtro', 'muda apenas o que voce esta vendo na tela.'],
          ['Lista', 'mostra registros, como produtos, pedidos, clientes ou entradas.'],
          ['Aba', 'separa assuntos dentro do mesmo modulo.'],
          ['Clique no item', 'normalmente abre detalhe ou edicao.']
        ],
        actionTitle: 'Como usar',
        action: 'Se voce quer encontrar algo, use filtro. Se quer mudar algo, abra o item ou use o botao de editar.'
      },
      {
        selector: '#app',
        route: '',
        icon: 'open_in_new',
        chapter: 'Como se orientar',
        title: 'Janelas ajudam a criar sem sair da tela',
        where: 'Modais e detalhes',
        text: 'As janelas que abrem por cima da tela servem para criar, editar ou conferir informacoes sem perder o lugar onde voce estava.',
        detailTitle: 'O que esperar',
        details: [
          ['Criar', 'campos principais aparecem agrupados em cards.'],
          ['Editar', 'os dados atuais aparecem preenchidos para ajustar.'],
          ['Detalhes', 'mostram o que aconteceu sem precisar mudar nada.'],
          ['Fechar', 'fecha a janela; salvar fica separado quando existe alteracao.']
        ],
        actionTitle: 'Como usar',
        action: 'Preencha so o que faz sentido naquele momento. Campos pequenos ocupam pouco espaco porque cada campo deve ter o tamanho do conteudo.'
      },
      {
        selector: '#app',
        route: '',
        icon: 'palette',
        chapter: 'Como se orientar',
        title: 'Cores e selos mostram situação',
        where: 'Status, badges e cores',
        text: 'As cores ajudam a ler rapido: verde indica caminho bom, amarelo pede atencao, vermelho suave mostra problema e neutro indica informacao.',
        detailTitle: 'Leitura rápida',
        details: [
          ['Verde', 'andando bem, concluido ou com resultado.'],
          ['Amarelo', 'precisa olhar antes de decidir.'],
          ['Vermelho', 'abaixo do ritmo, vencido, erro ou risco.'],
          ['Neutro', 'informacao de apoio, filtro ou detalhe.']
        ],
        actionTitle: 'Como usar',
        action: 'Quando vir uma cor forte, leia o texto ao lado. A cor chama atencao, mas a decisao vem da frase.'
      },
      {
        selector: '[data-route="configuracoes"]',
        route: 'configuracoes/geral',
        routeCta: 'Abrir Configurações',
        icon: 'settings',
        chapter: 'Base do negócio',
        title: 'Agora sim: comece arrumando a casa',
        where: 'Configurações',
        text: 'Aqui ficam as informações que fazem o sistema entender o negócio antes de falar de venda, pedido ou crescimento.',
        detailTitle: 'O que tem dentro',
        details: [
          ['Geral', 'nome, contato, endereco e dados principais do negocio.'],
          ['Canais', 'por onde voce vende: cardapio, balcao, Instagram, delivery ou outro canal.'],
          ['Integracoes', 'pagamentos, WhatsApp e conexoes que ajudam a vender e receber.'],
          ['Usuario', 'dados de acesso e ajustes da conta.']
        ],
        actionTitle: 'O que fazer aqui',
        action: 'Comece pelo Geral e depois crie os canais de venda. Isso evita planejar em cima de informacao incompleta.',
        actionSelector: '#config-save',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Preencha nome, contato e endereço do negócio. Depois use Salvar alterações para essa base alimentar as outras telas.'
      },
      {
        selector: '[data-route="configuracoes"]',
        route: 'configuracoes/canais_venda',
        routeCta: 'Abrir Canais',
        icon: 'hub',
        chapter: 'Base do negócio',
        title: 'Canais explicam de onde vem cada venda',
        where: 'Configurações · Canais de venda',
        text: 'Antes de vender, diga por onde o pedido chega. Isso ajuda pedidos, financeiro, performance e Plano de Voo a lerem o negocio com mais clareza.',
        detailTitle: 'O que preencher',
        details: [
          ['Nome', 'Cardapio, Instagram, balcao, marketplace ou outro canal real.'],
          ['Margem', 'se o canal cobra taxa, ela precisa entrar na leitura.'],
          ['Financeiro', 'cada canal pode apontar para uma categoria de entrada.'],
          ['Uso', 'depois cada pedido carrega esse canal para o sistema comparar resultado.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Crie apenas os canais que voce realmente usa hoje. Canais fantasmas deixam a leitura mais confusa.',
        actionSelector: 'button[onclick*="_addCanalVenda"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Clique em Adicionar canal para criar somente os canais que existem no seu negócio hoje.'
      },
      {
        selector: '[data-route="catalogo"]',
        route: 'catalogo/produtos',
        routeCta: 'Abrir Produtos',
        icon: 'restaurant_menu',
        chapter: 'Cardápio',
        title: 'Produtos são o centro da venda',
        where: 'Cardápio · Produtos',
        text: 'Aqui fica tudo que a cliente pode comprar. Produto bem cadastrado ajuda o cardapio, o pedido, o estoque, as promocoes e a margem.',
        detailTitle: 'O que olhar',
        details: [
          ['Nome e foto', 'a cliente precisa entender rapido o que esta comprando.'],
          ['Preco', 'valor de venda usado no cardapio, pedidos e calculos.'],
          ['Variacoes', 'sabores, tamanhos, adicionais e combos quando existirem.'],
          ['Visibilidade', 'produto oculto nao aparece para vender.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Cadastre primeiro os produtos que mais vendem ou que voce quer vender melhor. Depois organize o restante.',
        actionSelector: 'button[onclick*="_openProductModal(null)"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Abra Adicionar produto e cadastre nome, foto, preço e categoria do item que você mais quer vender.'
      },
      {
        selector: '[data-route="catalogo"]',
        route: 'catalogo/configuracoes',
        routeCta: 'Abrir Configurações',
        icon: 'category',
        chapter: 'Cardápio',
        title: 'Categorias deixam a compra mais facil',
        where: 'Cardápio · Categorias e regras',
        text: 'Categoria nao e so organizacao interna. Ela ajuda a cliente a encontrar rapido e ajuda o template a montar a vitrine.',
        detailTitle: 'O que tem aqui',
        details: [
          ['Categorias', 'grupos como salgados, doces, bebidas ou combos.'],
          ['Ordem', 'define o que aparece primeiro no cardapio publico.'],
          ['Tags', 'selos visuais cadastrados para chamar atencao sem baguncar.'],
          ['Visibilidade', 'controle do que entra ou sai da venda.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Crie poucas categorias boas. Melhor uma vitrine simples e clara do que muitos grupos vazios.',
        actionSelector: 'button[onclick*="_openCatModal(null)"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Crie a primeira categoria pensando em como a cliente procura seus produtos, não em organização interna.'
      },
      {
        selector: '[data-route="receitas"]',
        route: 'receitas/receitas',
        routeCta: 'Abrir Receitas',
        icon: 'receipt_long',
        chapter: 'Produção',
        title: 'Receitas mostram o custo por trás do produto',
        where: 'Produção · Receitas',
        text: 'Receita e ficha tecnica. Ela mostra ingredientes, rendimento e custo previsto para voce nao vender no escuro.',
        detailTitle: 'O que preencher',
        details: [
          ['Rendimento', 'quantas unidades, porcoes ou peso aquela receita entrega.'],
          ['Ingredientes', 'o que entra e quanto entra em cada preparo.'],
          ['Custo', 'quanto aquela receita deve custar antes da venda.'],
          ['Produto ligado', 'quando a receita vira item vendido ou etapa de producao.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Comece pelas receitas dos produtos principais. Elas alimentam custo, producao, estoque e lista de compras.',
        actionSelector: 'button[onclick*="_openFichaModal(null)"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Adicione a primeira receita do produto principal para o sistema entender rendimento, ingredientes e custo.'
      },
      {
        selector: '[data-route="receitas"]',
        route: 'receitas/ordens',
        routeCta: 'Abrir Ordens',
        icon: 'assignment',
        chapter: 'Produção',
        title: 'Ordens organizam o que vai ser produzido',
        where: 'Produção · Ordens',
        text: 'Quando voce sabe o que precisa preparar, a ordem registra planejamento, lote produzido, rendimento real e movimentacoes.',
        detailTitle: 'Como usar',
        details: [
          ['Planejar', 'escolha a receita e a quantidade que pretende fazer.'],
          ['Finalizar', 'registre quanto realmente saiu do lote.'],
          ['Comparar', 'veja diferenca entre planejado e produzido.'],
          ['Movimentar', 'quando concluida, gera base de entrada e saida no estoque.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Use ordens para produtos que voce prepara antes ou em lote. Para producao sob encomenda, registre as bases que fazem sentido controlar.',
        actionSelector: 'button[onclick*="_openProductionOrderModal"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Clique em Nova ordem para planejar o que será produzido, com receita, quantidade e data.'
      },
      {
        selector: '[data-route="receitas"]',
        route: 'receitas/lista-compras',
        routeCta: 'Abrir Lista',
        icon: 'shopping_cart',
        chapter: 'Produção',
        title: 'Lista de compras nasce do que voce pretende produzir',
        where: 'Produção · Lista de compras',
        text: 'A lista ajuda a transformar planejamento de producao em itens para comprar, sem ainda obrigar voce a usar o modulo Compras.',
        detailTitle: 'O que ela mostra',
        details: [
          ['Origem', 'pode nascer do planejamento de producao ou necessidade minima.'],
          ['Classe', 'separa insumos, produtos prontos e produtos produzidos.'],
          ['Status', 'ajuda a controlar se ja comprou ou ainda esta pendente.'],
          ['Impressao', 'lista simples com checkbox para usar fora da tela.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Gere uma lista pequena quando tiver producao planejada. Depois marque o status para nao perder controle.',
        actionSelector: 'button[onclick*="_generatePurchaseList"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Escolha como quer montar a lista e clique em Gerar lista para salvar uma lista de compra acompanhável.'
      },
      {
        selector: '[data-route="financeiro"]',
        route: 'financeiro/visao-geral',
        routeCta: 'Abrir Financeiro',
        icon: 'payments',
        chapter: 'Financeiro',
        title: 'Financeiro mostra se a venda esta sobrando',
        where: 'Financeiro · Visão geral',
        text: 'Essa tela nao e para assustar. Ela mostra dinheiro entrando, dinheiro saindo e se o negocio esta com saude para continuar.',
        detailTitle: 'O que acompanhar',
        details: [
          ['Entradas', 'vendas, recebimentos e dinheiro que entrou.'],
          ['Saidas', 'despesas, custos, compras e pagamentos.'],
          ['Saldo', 'o que fica depois de entradas e saidas.'],
          ['Aviso', 'sinais simples para olhar antes de tomar decisao.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Registre as despesas e custos fixos. Sem isso, o Plano de Voo pode sugerir uma meta menor do que o negocio precisa.',
        actionSelector: 'button[onclick*="_openEntradaModal"], button[onclick*="_openEntryModal"], button[onclick*="_openMovModal"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Use esta área para conferir saúde financeira. Para criar entradas ou saídas, vá para a aba específica do financeiro.'
      },
      {
        selector: '[data-route="financeiro"]',
        route: 'financeiro/movimentacoes',
        routeCta: 'Abrir Entradas',
        icon: 'south_west',
        chapter: 'Financeiro',
        title: 'Entradas registram o dinheiro que chegou',
        where: 'Financeiro · Entradas',
        text: 'Entrada pode vir de pedido, venda presencial, pagamento online ou lançamento manual.',
        detailTitle: 'O que conferir',
        details: [
          ['Valor', 'quanto entrou ou deve entrar.'],
          ['Conta', 'onde esse dinheiro caiu ou vai cair.'],
          ['Forma', 'dinheiro, cartao, transferencia, Stripe ou outra.'],
          ['Canal', 'quando vem de venda, mostra de onde aquele pedido chegou.']
        ],
        actionTitle: 'Como usar',
        action: 'Quando o pedido ja gera entrada, evite duplicar manualmente. Use entrada manual para dinheiro que nao nasceu de pedido.',
        actionSelector: 'button[onclick*="_openEntrada"], button[onclick*="_openEntry"], button[onclick*="_openMovModal"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Crie entrada manual apenas para dinheiro que não nasceu de pedido, para não duplicar faturamento.'
      },
      {
        selector: '[data-route="venda-presencial"]',
        route: 'venda-presencial',
        routeCta: 'Abrir Venda',
        icon: 'point_of_sale',
        chapter: 'Venda',
        title: 'Venda presencial é para vender rápido no balcão',
        where: 'Venda presencial',
        text: 'Use quando a cliente compra direto com voce. A venda ja nasce como pedido entregue, alimenta financeiro e pode movimentar estoque.',
        detailTitle: 'O que acontece',
        details: [
          ['Produtos', 'busca apenas itens visiveis e prontos para vender.'],
          ['Escolhas', 'produto com variante, combo ou adicional pede as escolhas antes de entrar no carrinho.'],
          ['Pagamento', 'usa as formas cadastradas no Financeiro.'],
          ['Caixa', 'dinheiro, sangria e reforco ajudam a separar o que esta fisico do que esta na conta.']
        ],
        actionTitle: 'Como usar',
        action: 'Para venda rapida, comece pelo produto. Depois confira pagamento e finalize para registrar pedido, entrada financeira e baixa quando existir estoque ligado.',
        actionSelector: 'input[type="search"], input[placeholder*="Buscar"], button[onclick*="final"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Comece buscando o produto vendido. Depois escolha as variações quando houver, forma de pagamento e finalize.'
      },
      {
        selector: '[data-route="financeiro"]',
        route: 'financeiro/contas-pagar',
        routeCta: 'Abrir Saídas',
        icon: 'north_east',
        chapter: 'Financeiro',
        title: 'Saídas mostram o que precisa sair do caixa',
        where: 'Financeiro · Saídas',
        text: 'Aqui entram despesas, custos, contas a pagar e compromissos que precisam ser considerados na rota.',
        detailTitle: 'O que separar',
        details: [
          ['Despesa', 'gasto para manter o negocio funcionando.'],
          ['Custo', 'gasto mais ligado ao que voce vende ou produz.'],
          ['Direto', 'relacionado ao produto, pedido ou producao.'],
          ['Indireto', 'apoia o negocio, mas nao pertence a uma unidade vendida.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Cadastre aluguel, taxas, energia, marketing e custos recorrentes. Isso deixa o Plano de Voo mais real.',
        actionSelector: 'button[onclick*="_openSaida"], button[onclick*="_openExit"], button[onclick*="_openApagar"], button[onclick*="_openContaPagar"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Cadastre uma saída recorrente importante, como aluguel, taxa, energia ou marketing.'
      },
      {
        selector: '[data-route="compras"]',
        route: 'compras/registros',
        routeCta: 'Abrir Compras',
        icon: 'shopping_cart',
        chapter: 'Compras',
        title: 'Compras mostram o que entrou para produzir e vender',
        where: 'Compras · Registro de compras',
        text: 'Aqui voce registra compra de insumo, produto pronto ou item usado na operacao. Quando recebido, isso pode alimentar o estoque.',
        detailTitle: 'O que conferir',
        details: [
          ['Fornecedor', 'de quem voce comprou.'],
          ['Itens', 'produto, quantidade, unidade, custo e valor total.'],
          ['Recebimento', 'confirma quando aquilo realmente entrou.'],
          ['Financeiro', 'forma de pagamento, conta e status quando a compra gera compromisso.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Registre compras importantes com quantidade e custo corretos. Isso melhora estoque, custo de produto e leitura financeira.',
        actionSelector: 'button[onclick*="_openCompraModal(null)"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Clique em Nova compra e registre fornecedor, itens, quantidades e custo real.'
      },
      {
        selector: '[data-route="estoque"]',
        route: 'estoque/itens',
        routeCta: 'Abrir Estoque',
        icon: 'inventory_2',
        chapter: 'Estoque',
        title: 'Estoque mostra o que existe pelo movimento real',
        where: 'Estoque · Itens',
        text: 'O saldo nasce das entradas e saidas registradas. Ele separa insumos, produtos prontos e produtos produzidos para nao misturar tudo.',
        detailTitle: 'O que observar',
        details: [
          ['Insumos', 'ingredientes e materiais usados na producao.'],
          ['Produto pronto', 'item comprado para revender ou usar sem produzir.'],
          ['Produto produzido', 'item que entrou a partir de ordem de producao.'],
          ['Minimo e maximo', 'ajuda a saber quando precisa repor ou evitar excesso.']
        ],
        actionTitle: 'Como usar',
        action: 'Use Estoque para conferir saldo e movimentos. Ajustes manuais devem ser usados com cuidado, quando a contagem real for diferente.',
        actionSelector: 'button[onclick*="_openInventoryModal"], button[onclick*="_openAdjustmentModal"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Abra Inventário em lote ou um item específico quando precisar conferir a contagem real.'
      },
      {
        selector: '[data-route="marketing"]',
        route: 'marketing/promocoes',
        routeCta: 'Abrir Ações',
        icon: 'campaign',
        chapter: 'Ações de venda',
        title: 'Ações de venda precisam virar pedido',
        where: 'Ações de Vendas',
        text: 'Promoção, cupom, upsell e pontos nao existem para enfeitar. Eles precisam ajudar a vender mais, aumentar ticket ou trazer cliente de volta.',
        detailTitle: 'O que tem dentro',
        details: [
          ['Promoções', 'desconto ou beneficio ligado a produtos e periodo.'],
          ['Cupons', 'codigo que pode entrar no checkout e no link com desconto.'],
          ['Upsell', 'oferta complementar para aumentar o pedido, especialmente no cardapio.'],
          ['Pontos', 'recompensa para incentivar recompra.']
        ],
        actionTitle: 'Como usar',
        action: 'Crie uma acao com objetivo claro. Depois acompanhe em Temporadas e Performance se ela realmente virou venda.',
        actionSelector: 'button[onclick*="Promo"], button[onclick*="Promotion"], button[onclick*="_openPromotion"], button[onclick*="_openPromo"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Crie uma ação de venda com objetivo simples: vender mais, aumentar ticket ou trazer cliente de volta.'
      },
      {
        selector: '[data-route="crescimento"]',
        route: 'crescimento/plano-de-voo',
        routeCta: 'Abrir Plano de Voo',
        icon: 'flight_takeoff',
        chapter: 'Crescimento',
        title: 'Plano de Voo escolhe a rota do negocio',
        where: 'Crescimento · Plano de Voo',
        text: 'Aqui voce escolhe a realidade que quer buscar no periodo: quanto vender, quantos pedidos por dia e quanto pode sobrar.',
        detailTitle: 'Como pensar',
        details: [
          ['Base', 'usa ticket, custos, despesas, canais e dias de trabalho.'],
          ['Cenarios', 'Sobrevivencia, Seguranca, Crescimento e Lucro forte.'],
          ['Rota ativa', 'depois de escolhida, vira acompanhamento e nao fica mudando toda hora.'],
          ['Historico', 'rotas anteriores ficam como memoria de decisao.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Crie uma rota depois de cadastrar produtos, canais e despesas. Assim o numero nasce mais perto da realidade.',
        actionSelector: 'button[onclick*="_openCreateRouteModal"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Clique em Criar nova rota quando a base já tiver produtos, canais, custos e despesas principais.'
      },
      {
        selector: '[data-route="crescimento"]',
        route: 'crescimento/temporadas',
        routeCta: 'Abrir Temporadas',
        icon: 'event_available',
        chapter: 'Crescimento',
        title: 'Temporada transforma rota em jogadas',
        where: 'Crescimento · Temporadas',
        text: 'A Temporada nao cria uma meta solta. Ela pega o Plano de Voo e pergunta: o que vamos fazer agora para chegar la?',
        detailTitle: 'O que existe',
        details: [
          ['Ativa', 'mostra a temporada em andamento, ritmo, risco e progresso.'],
          ['Proxima jogada', 'traz acoes especificas para colocar em pratica.'],
          ['Programadas', 'temporadas que vao começar depois.'],
          ['Historico', 'temporadas finalizadas e aprendizados.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Depois do Plano de Voo, crie uma Temporada curta. Ela deve guiar as acoes dos proximos dias.',
        actionSelector: 'button[onclick*="openCreateFlow"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Clique em Nova Temporada para transformar a rota em jogadas práticas com prazo.'
      },
      {
        selector: '[data-route="crescimento"]',
        route: 'crescimento/performance',
        routeCta: 'Abrir Performance',
        icon: 'analytics',
        chapter: 'Crescimento',
        title: 'Performance mostra se o mes acompanha a rota',
        where: 'Crescimento · Performance',
        text: 'Performance e a leitura do caminho. Ela mostra se o mes esta acima, dentro, em atencao ou abaixo do ritmo.',
        detailTitle: 'O que observar',
        details: [
          ['Este mes', 'venda atual, ticket medio e pedidos por dia.'],
          ['Rota', 'meta mensal herdada do Plano de Voo.'],
          ['Sinais', 'canal, pedido, caixa e ritmo.'],
          ['Leitura', 'o que precisa de atencao antes da proxima decisao.']
        ],
        actionTitle: 'Como usar',
        action: 'Olhe Performance durante o mes. Se estiver fora da rota, volte para Temporadas e escolha uma jogada.',
        actionSelector: '.performance-route-card, .performance-card, .module-page',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Leia primeiro o status do mês. Se estiver em atenção ou abaixo, a próxima decisão nasce em Temporadas.'
      },
      {
        selector: '[data-route="crescimento/maturidade"]',
        route: 'crescimento/maturidade',
        routeCta: 'Abrir Maturidade',
        icon: 'diamond',
        chapter: 'Crescimento',
        title: 'Maturidade mostra se o negocio esta ficando mais forte',
        where: 'Maturidade do Negócio',
        text: 'Essa tela nao mede se voce clicou bastante. Ela mede sinais reais: venda com ritmo, cliente voltando, controle e evolucao.',
        detailTitle: 'Como ler',
        details: [
          ['Pedra', 'fase atual do negocio.'],
          ['Marcos', 'conquistas reais que sustentam a evolucao.'],
          ['Pontos fortes', 'o que ja ajuda sua Pedra.'],
          ['Limitadores', 'o que ainda segura o avanco.']
        ],
        actionTitle: 'Como usar',
        action: 'Veja Maturidade como uma leitura de negocio. Ela fica melhor conforme pedidos, temporadas, clientes e financeiro ganham historico.',
        actionSelector: '.seasons-stone-card, .maturity-card, .module-page',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Leia a Pedra atual e os marcos. Eles mostram o que já sustenta o negócio e o que ainda limita a evolução.'
      },
      {
        selector: '[data-route="loja-online"]',
        route: 'loja-online/template',
        routeCta: 'Abrir Template',
        icon: 'storefront',
        chapter: 'Loja Online',
        title: 'Template e a vitrine que a cliente ve',
        where: 'Loja Online · Template',
        text: 'Aqui voce ajusta identidade, card principal, categorias, checkout, entrega, retirada, rodape e informacoes importantes.',
        detailTitle: 'O que conferir',
        details: [
          ['Identidade', 'logo, cores, capa e apresentacao.'],
          ['Vitrine', 'card principal, categorias, pontos, resenhas e produtos.'],
          ['Checkout', 'entrega, retirada, pagamento, cupom e WhatsApp.'],
          ['Rodape', 'endereco, horarios, contatos e redes.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Configure primeiro identidade, entrega/retirada e pagamento. Depois olhe detalhes visuais.',
        actionSelector: '#tpl-store-name, #config-save, button[onclick*="_saveTemplate"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Comece por identidade, entrega/retirada e pagamento. Depois ajuste beleza e detalhes da vitrine.'
      },
      {
        selector: '[data-route="loja-online"]',
        route: 'loja-online/links',
        routeCta: 'Abrir Link',
        icon: 'link',
        chapter: 'Loja Online',
        title: 'Link da loja precisa estar pronto para divulgar',
        where: 'Loja Online · Link e publicação',
        text: 'O link e o caminho publico da loja. Quando ele estiver certo e publicado, voce pode divulgar para a cliente pedir.',
        detailTitle: 'O que validar',
        details: [
          ['Nome do link', 'deve parecer com o nome da loja e ser facil de falar.'],
          ['Status', 'rascunho nao aparece como loja publicada.'],
          ['Ver loja', 'abre a loja do jeito que a cliente vai ver.'],
          ['Publicar', 'so aparece quando ainda precisa publicar.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Defina o nome do link e publique apenas depois de conferir produtos, checkout e informacoes.',
        actionSelector: '#store-slug, #config-save, button[onclick*="_publishStore"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Escolha um nome de link parecido com o nome da loja e publique só depois de conferir a vitrine.'
      },
      {
        selector: '[data-route="pedidos"]',
        route: 'pedidos/cozinha',
        routeCta: 'Abrir Cozinha',
        icon: 'room_service',
        chapter: 'Pedidos',
        title: 'Cozinha e a tela da operacao acontecendo',
        where: 'Pedidos · Modo Cozinha',
        text: 'Use essa tela quando os pedidos estao entrando. Ela ajuda a ver o que esta pendente, em preparo, pronto, entregue ou retirado.',
        detailTitle: 'O que aparece',
        details: [
          ['Card do pedido', 'cliente, endereco, horario e status principal.'],
          ['Detalhe', 'itens, escolhas, pagamento, observacoes e checklist.'],
          ['Status', 'mudar status guia preparo e comunicacao.'],
          ['Alarme', 'ajuda a nao perder pedido novo.']
        ],
        actionTitle: 'Como usar',
        action: 'No dia a dia, fique mais na Cozinha. Abra detalhes so quando precisar ver itens, endereco ou observacao.',
        actionSelector: '.kitchen-order-card, .order-card, button[onclick*="_toggleKitchenAlarm"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'No atendimento, acompanhe primeiro os cards de pedido e o alarme. Abra detalhe só quando precisar conferir itens ou endereço.'
      },
      {
        selector: '[data-route="pedidos"]',
        route: 'pedidos/lista',
        routeCta: 'Abrir Pedidos',
        icon: 'receipt_long',
        chapter: 'Pedidos',
        title: 'Lista de pedidos guarda o historico da venda',
        where: 'Pedidos · Lista',
        text: 'Aqui voce encontra pedidos antigos, abre detalhes, edita escolhas quando permitido e acompanha status.',
        detailTitle: 'O que conferir',
        details: [
          ['Canal', 'de onde veio a venda.'],
          ['Cliente', 'quem comprou e como falar.'],
          ['Itens', 'produtos, variantes, combos, descontos e observacoes.'],
          ['Financeiro', 'pagamento, entrada e status de recebimento.']
        ],
        actionTitle: 'Como usar',
        action: 'Use filtros para encontrar pedidos. Entre no detalhe quando precisar corrigir, confirmar ou entender uma venda.',
        actionSelector: 'button[onclick*="_openNewOrder"], input[type="search"], .orders-filter-card',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Use busca e filtros para encontrar pedidos. Se precisar registrar manualmente, use Novo pedido.'
      },
      {
        selector: '[data-route="pedidos"]',
        route: 'pedidos/clientes',
        routeCta: 'Abrir Clientes',
        icon: 'groups',
        chapter: 'Clientes',
        title: 'Clientes ajudam a vender de novo',
        where: 'Pedidos · Clientes',
        text: 'Cliente nao e so contato. Aqui ficam dados, endereco, preferencia, historico, aniversario, pontos e relacao com pedidos.',
        detailTitle: 'O que guardar',
        details: [
          ['WhatsApp', 'principal contato para pedidos e comunicacao.'],
          ['Enderecos', 'casa, trabalho ou outros locais de entrega.'],
          ['Preferencias', 'gostos, alergias e observacoes importantes.'],
          ['Historico', 'o que comprou e como se relaciona com o negocio.']
        ],
        actionTitle: 'Primeiro passo',
        action: 'Cadastre cliente rapido quando precisar vender agora. Depois complete dados para melhorar recompra e fidelidade.',
        actionSelector: 'button[onclick*="_openClientEdit(null)"], button[onclick*="Adicionar cliente"], input[type="search"]',
        actionFocusTitle: 'Ação principal nesta tela',
        actionFocus: 'Comece buscando se a cliente já existe. Se não existir, cadastre com WhatsApp e endereço principal.'
      }
    ];
  }

  function _tourStepIndex(total) {
    var value = _readLocalOnboardingState().tourStep || 0;
    if (!isFinite(value) || value < 0) value = 0;
    if (value >= total) value = Math.max(0, total - 1);
    return value;
  }

  function _applyTourHighlight() {
    var open = _readLocalOnboardingState().tourOpen;
    var box = document.getElementById('dash-tour-spotlight');
    var modal = document.getElementById('dash-tour-modal');
    if (!open || !box) return;
    var steps = _tourSteps();
    var step = steps[_tourStepIndex(steps.length)] || steps[0];
    var targetSelector = _tourTargetSelector(step);
    var target = null;
    try { target = targetSelector ? document.querySelector(targetSelector) : null; } catch (selectorErr) { target = null; }
    if (!target) {
      box.style.display = 'none';
      return;
    }
    try { target.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (err2) {}
    window.setTimeout(function () {
      var rect = target.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        box.style.display = 'none';
        return;
      }
      var pad = 6;
      box.style.display = 'block';
      box.style.left = Math.max(8, rect.left - pad) + 'px';
      box.style.top = Math.max(8, rect.top - pad) + 'px';
      box.style.width = Math.min(window.innerWidth - 16, rect.width + pad * 2) + 'px';
      box.style.height = Math.min(window.innerHeight - 16, rect.height + pad * 2) + 'px';
      if (modal) _positionTourModal(modal, rect);
    }, 40);
  }

  function _isTourStepRouteActive(step) {
    if (!step || !step.route) return false;
    var current = '';
    try { current = window.Router && Router.current ? Router.current() : (window.location.hash || '').replace('#', ''); } catch (err) {}
    current = String(current || 'dashboard');
    var route = String(step.route || '');
    return current === route || current.indexOf(route + '/') === 0 || route.indexOf(current + '/') === 0;
  }

  function _tourTargetSelector(step) {
    if (!step) return '';
    if (_isTourStepRouteActive(step) && step.actionSelector) return step.actionSelector;
    return step.selector || '';
  }

  function _positionTourModal(modal, targetRect) {
    if (!modal || !targetRect) return;
    var margin = 14;
    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (vw <= 760) {
      modal.style.left = '12px';
      modal.style.right = '12px';
      modal.style.top = 'auto';
      modal.style.bottom = '12px';
      modal.style.width = 'calc(100vw - 24px)';
      modal.style.transform = 'none';
      return;
    }
    modal.style.right = 'auto';
    modal.style.bottom = 'auto';
    modal.style.width = 'min(480px, calc(100vw - 28px))';
    modal.style.transform = 'none';
    var mw = modal.offsetWidth || 480;
    var mh = modal.offsetHeight || 280;
    var left = targetRect.right + 18;
    if (left + mw + margin > vw) left = targetRect.left - mw - 18;
    if (left < margin) left = Math.min(Math.max(margin, targetRect.right + 18), vw - mw - margin);
    var top = targetRect.top + (targetRect.height / 2) - (mh / 2);
    top = Math.max(margin, Math.min(top, vh - mh - margin));
    modal.style.left = Math.round(left) + 'px';
    modal.style.top = Math.round(top) + 'px';
  }

  function _openTour() {
    _writeLocalOnboardingState({ version: ONBOARDING_VERSION, welcomeSeen: true, tourOpen: false, tourStep: 0, tourDone: true, collapsed: false }, { action: 'checklist_reopened' });
    _renderGlobalOnboarding();
  }

  function _openGuidedRoute(index) {
    var steps = _tourSteps();
    var step = steps[index] || null;
    if (!step || !step.route) return;
    _writeLocalOnboardingState({ version: ONBOARDING_VERSION, welcomeSeen: true, tourOpen: false, tourStep: index || 0, tourDone: true, collapsed: false }, { action: 'checklist_route_opened' });
    if (window.Router && typeof Router.navigate === 'function') {
      Router.navigate(step.route);
    } else {
      window.location.hash = '#' + step.route;
    }
    window.setTimeout(function () { _renderGlobalOnboarding(); }, 180);
  }

  function _nextTourStep() {
    var steps = _tourSteps();
    var index = _tourStepIndex(steps.length);
    _writeLocalOnboardingState({ version: ONBOARDING_VERSION, tourStep: Math.min(steps.length - 1, index + 1) }, { action: 'tour_next' });
    _renderGlobalOnboarding();
  }

  function _prevTourStep() {
    var steps = _tourSteps();
    var index = _tourStepIndex(steps.length);
    _writeLocalOnboardingState({ version: ONBOARDING_VERSION, tourStep: Math.max(0, index - 1) }, { action: 'tour_previous' });
    _renderGlobalOnboarding();
  }

  function _startWelcomeTour() {
    _writeLocalOnboardingState({
      version: ONBOARDING_VERSION,
      welcomeSeen: true,
      tourOpen: false,
      tourStep: 0,
      tourDone: true,
      collapsed: false
    }, { action: 'checklist_started' });
    _renderGlobalOnboarding();
  }

  function _closeTour() {
    _writeLocalOnboardingState({
      version: ONBOARDING_VERSION,
      tourOpen: false,
      tourStep: 0,
      tourDone: true,
      collapsed: false
    }, { action: 'tour_completed' });
    _setTourScrollLock(false);
    _renderGlobalOnboarding();
  }

  function _collapseOnboarding() {
    _writeLocalOnboardingState({ version: ONBOARDING_VERSION, collapsed: true }, { action: 'panel_collapsed' });
    var p = document.getElementById('dash-onboarding-panel');
    var b = document.getElementById('dash-onboarding-pill');
    if (p) p.style.display = 'none';
    if (b) b.style.display = 'inline-flex';
  }

  function _expandOnboarding() {
    _writeLocalOnboardingState({ version: ONBOARDING_VERSION, collapsed: false }, { action: 'panel_expanded' });
    var p = document.getElementById('dash-onboarding-panel');
    var b = document.getElementById('dash-onboarding-pill');
    if (p) p.style.display = 'block';
    if (b) b.style.display = 'none';
  }

  function _resetOnboardingProgress() {
    var ok = true;
    try {
      ok = window.confirm ? window.confirm('Refazer os primeiros passos deste usuário? Isso não apaga dados do negócio.') : true;
    } catch (err) {}
    if (!ok) return;
    _writeLocalOnboardingState({
      version: '',
      welcomeSeen: false,
      tourOpen: false,
      tourDone: false,
      tourStep: 0,
      collapsed: false
    }, { persist: false, action: 'progress_reset' });
    _onboardingRemote = { loaded: false, loading: false, docId: '', data: null };
    try {
      if (window.DB && DB.setDocRoot) {
        DB.setDocRoot('config', _onboardingDocId(), {
          version: '',
          welcomeSeen: false,
          tourOpen: false,
          tourDone: false,
          tourStep: 0,
          collapsed: false,
          lastAction: 'progress_reset',
          lastRoute: _currentRoute(),
          progressSummary: _onboardingProgressSummary(),
          lastActionAt: firebase.firestore.FieldValue.serverTimestamp(),
          resetAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function (err2) {
          console.warn('Dashboard onboarding reset remote skipped', err2 && err2.message ? err2.message : err2);
        });
      }
    } catch (err3) {
      console.warn('Dashboard onboarding reset error', err3 && err3.message ? err3.message : err3);
    }
    _renderGlobalOnboarding();
  }

  function _onboardingSteps() {
    var g = _data.geral || {};
    var t = _data.template || {};
    var op = _data.operacao || {};
    var channels = Array.isArray((_data.channels || {}).list) ? (_data.channels || {}).list : [];
    var hasSalesChannels = channels.filter(function (ch) { return ch && ch.name; }).length > 0;
    var money = _data.moneyConfig || {};
    var hasPriceRules = !!(money.desiredMarginPct || money.minMarginPct || money.defaultMarkup || Object.keys(money).length);
    var hasProducts = (_data.products || []).length > 0;
    var hasPurchaseItems = (_data.purchaseItems || []).length > 0;
    var hasRecipes = (_data.recipes || []).length > 0;
    var hasCosts = (_data.exits || []).length > 0;
    var hasPlan = !!_data.monthScenario || !!_snapshotForCurrentMonth() || (_data.snapshots || []).length > 0;
    var hasSeason = (_data.seasons || []).length > 0;
    var hasStorefrontIdentity = !!(t.publicStoreName || t.publicName || t.logoUrl);
    var hasCheckout = !!(op.deliveryEnabled || op.pickupEnabled || t.deliveryEnabled || t.pickupEnabled ||
      (Array.isArray(t.deliveryZones) && t.deliveryZones.length) ||
      (Array.isArray(t.hours) && t.hours.length));
    var hasPurchase = (_data.purchases || []).length > 0;
    var hasOrder = (_data.orders || []).length > 0;
    var hasOpenOrder = (_data.orders || []).some(_isOpenOrder);
    var hasEntry = (_data.entries || []).length > 0;
    var hasStockMovement = (_data.stockMovements || []).length > 0;
    var hasPurchaseStockEntry = (_data.stockMovements || []).some(function (m) { return String(m && m.type || '') === 'entrada_compra'; });
    var hasSaleStockExit = (_data.stockMovements || []).some(function (m) { return String(m && m.type || '') === 'saida_venda'; });
    return [
      {
        key: 'base',
        title: 'Base do negócio',
        shortTitle: 'Base',
        text: 'Deixe claro quem é seu negócio, por onde vende e quais itens formam sua produção.',
        steps: [
          { title: 'Preencher dados do negócio', text: 'Nome, contato e endereço para deixar tudo identificado.', icon: 'badge', route: 'configuracoes/geral', done: !!(g.businessName && (g.phone || g.whatsapp || g.email)) },
          { title: 'Criar canais de venda', text: 'Mostre de onde os pedidos chegam: cardápio, balcão, Instagram ou outro canal.', icon: 'storefront', route: 'configuracoes/canais_venda', done: hasSalesChannels },
          { title: 'Definir preço e margem', text: 'Ajude o BocaFood a proteger sua sobra em cada venda.', icon: 'calculate', route: 'dinheiro/regras', done: hasPriceRules },
          { title: 'Cadastrar insumos e produtos comprados', text: 'Cadastre ingredientes, materiais de embalagem e produtos prontos que entram na operação.', icon: 'inventory_2', route: 'compras/itens', done: hasPurchaseItems },
          { title: 'Cadastrar receitas', text: 'Monte as receitas usando os insumos e bases cadastradas.', icon: 'receipt_long', route: 'receitas/receitas', done: hasRecipes },
          { title: 'Registrar custos fixos', text: 'Inclua contas e compromissos que precisam entrar na rota.', icon: 'payments', route: 'financeiro/contas-pagar', done: hasCosts }
        ]
      },
      {
        key: 'route',
        title: 'Rota de crescimento',
        shortTitle: 'Rota',
        text: 'Com a base pronta, transforme seus números em uma direção para seguir.',
        steps: [
          { title: 'Criar Plano de Voo', text: 'Escolha a realidade que você quer buscar no ano.', icon: 'flight_takeoff', route: 'crescimento/plano-de-voo', done: hasPlan },
          { title: 'Criar primeira Temporada', text: 'Traga a rota para uma meta curta, com jogadas para colocar em prática.', icon: 'event_available', route: 'crescimento/temporadas', done: hasSeason }
        ]
      },
      {
        key: 'storefront',
        title: 'Loja pronta para vender',
        shortTitle: 'Venda',
        text: 'Deixe a experiência pronta para a cliente entender, escolher e pedir.',
        steps: [
          { title: 'Cadastrar produtos do cardápio', text: 'Agora coloque para venda os produtos que a cliente vai comprar.', icon: 'restaurant_menu', route: 'catalogo/produtos', done: hasProducts },
          { title: 'Organizar cardápio', text: 'Deixe produtos, categorias e destaques fáceis de comprar.', icon: 'menu_book', route: 'catalogo/produtos', done: hasProducts },
          { title: 'Configurar cardápio online', text: 'Use sua identidade, capa, logo e informações para vender com confiança.', icon: 'store', route: 'loja-online/template', done: hasStorefrontIdentity },
          { title: 'Conferir entrega e retirada', text: 'Garanta que a cliente saiba como e quando vai receber o pedido.', icon: 'local_shipping', route: 'loja-online/template', done: hasCheckout }
        ]
      },
      {
        key: 'routine',
        title: 'Primeira rotina de venda',
        shortTitle: 'Rotina',
        text: 'Com a loja pronta, registre o primeiro ciclo real: comprar, vender, acompanhar e conferir o resultado.',
        steps: [
          { title: 'Registrar primeira compra', text: 'Mostre o que entrou para acompanhar custo e reposição.', icon: 'shopping_cart', route: 'compras/registros', done: hasPurchase },
          { title: 'Receber a compra no estoque', text: 'Confirme a entrada quando os itens realmente chegarem.', icon: 'inventory_2', route: 'compras/registros', done: hasPurchaseStockEntry || hasStockMovement },
          { title: 'Receber primeiro pedido', text: 'Registre ou acompanhe o pedido que a cliente fez.', icon: 'receipt_long', route: 'pedidos/lista', done: hasOrder },
          { title: 'Acompanhar na cozinha', text: 'Veja preparo, entrega ou retirada sem perder observações.', icon: 'room_service', route: 'pedidos/cozinha', done: hasOpenOrder || hasOrder },
          { title: 'Conferir dinheiro da venda', text: 'Veja se a venda entrou no financeiro e em qual conta caiu.', icon: 'payments', route: 'financeiro/visao-geral', done: hasEntry || hasOrder },
          { title: 'Conferir estoque depois da venda', text: 'Veja se houve entrada, saída ou ajuste ligado à operação.', icon: 'inventory', route: 'estoque/itens', done: hasSaleStockExit || hasStockMovement },
          { title: 'Olhar o crescimento da semana', text: 'Confira se a rotina começou a alimentar Performance e Temporadas.', icon: 'analytics', route: 'crescimento/performance', done: hasPlan && hasOrder }
        ]
      }
    ];
  }

  function _kpi(label, value, hint, icon, color) {
    return '<article class="dash-card dash-kpi" style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;min-height:78px;overflow:hidden;">' +
      '<div style="width:42px;height:42px;border-radius:14px;background:transparent;color:' + (color || '#B42318') + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'insights') + '</span></div>' +
      '<div style="min-width:0;"><div style="font-size:12px;color:#6F6860;font-weight:600;line-height:1.15;">' + _esc(label) + '</div><div style="font-size:19px;color:#1F1F1F;font-weight:800;line-height:1.12;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(value) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(hint || '') + '</div></div>' +
    '</article>';
  }

  function _sectionHead(title, text, route, action) {
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
      '<div><div style="font-size:15px;font-weight:800;color:#1F1F1F;">' + _esc(title) + '</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">' + _esc(text) + '</div></div>' +
      (route ? '<button type="button" onclick="Router.navigate(\'' + _esc(route) + '\')" style="height:34px;padding:0 12px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">' + _esc(action || 'Abrir') + '</button>' : '') +
    '</div>';
  }

  function _mini(label, value) {
    return '<div style="border:1px solid #EAE4DA;border-radius:13px;background:#FAF8F4;padding:11px 12px;min-width:0;">' +
      '<div style="font-size:11px;color:#6F6860;font-weight:700;line-height:1.2;">' + _esc(label) + '</div>' +
      '<div style="font-size:15px;color:#1F1F1F;font-weight:800;line-height:1.2;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(value || '—') + '</div>' +
    '</div>';
  }

  function _chip(text, color) {
    return '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:' + (color || '#6F6860') + ';font-size:12px;font-weight:800;white-space:nowrap;">' + _esc(text) + '</span>';
  }

  function _empty(text) {
    return '<div style="padding:18px;text-align:center;color:#8A7E7C;font-size:13px;line-height:1.45;background:#FAF8F4;">' + _esc(text) + '</div>';
  }

  function _monthTarget() {
    var m = _data.monthScenario || {};
    var snap = null;
    var snapId = String(m.snapshotId || '').trim();
    if (snapId) {
      snap = (_data.snapshots || []).find(function (x) { return String(x.id || '') === snapId; }) || null;
    }
    if (!snap) snap = _snapshotForCurrentMonth();
    var summary = (m.summary && Object.keys(m.summary).length ? m.summary : null) || (snap && snap.summary) || {};
    return {
      revenue: _num(summary.revenue != null ? summary.revenue : summary.forecastRevenue),
      profit: _num(summary.profit),
      cashFinal: _num(summary.cashFinal)
    };
  }

  function _resolveMonthScenario(selectedMonthKey, currentDoc, allDocs) {
    var monthKey = String(selectedMonthKey || _currentMonthKey());
    var candidates = [];
    if (currentDoc) candidates.push(currentDoc);
    (Array.isArray(allDocs) ? allDocs : []).forEach(function (doc) {
      if (doc) candidates.push(doc);
    });

    var direct = candidates.find(function (doc) {
      return String(doc.monthKey || doc.month || doc.key || doc.id || '') === monthKey;
    });
    if (direct) return direct;

    var bySnapshotMonth = candidates.find(function (doc) {
      var snap = _snapshotById(doc.snapshotId || doc.id || '');
      return snap && String(snap.targetMonthKey || '') === monthKey;
    });
    if (bySnapshotMonth) return bySnapshotMonth;

    var snap = _snapshotForCurrentMonth();
    if (snap) {
      return {
        id: snap.id,
        snapshotId: snap.id,
        snapshotName: snap.name,
        name: snap.name,
        monthKey: snap.targetMonthKey || monthKey,
        monthLabel: snap.targetMonthLabel || '',
        scenario: snap.scenario,
        summary: snap.summary || {},
        updatedAt: snap.updatedAt || snap.createdAt
      };
    }

    return candidates.slice().sort(function (a, b) {
      return _ts(b.updatedAt || b.selectedAt || b.createdAt) - _ts(a.updatedAt || a.selectedAt || a.createdAt);
    })[0] || null;
  }

  function _snapshotById(id) {
    id = String(id || '').trim();
    if (!id) return null;
    return (_data.snapshots || []).find(function (x) { return String(x.id || '') === id; }) || null;
  }

  function _snapshotForCurrentMonth() {
    var monthKey = _currentMonthKey();
    var candidates = (_data.snapshots || []).filter(function (s) {
      return String(s.targetMonthKey || '') === monthKey && s.summary;
    });
    return candidates.slice().sort(function (a, b) {
      return _ts(b.updatedAt || b.selectedAt || b.createdAt) - _ts(a.updatedAt || a.selectedAt || a.createdAt);
    })[0] || null;
  }

  function _bestChannel(orders) {
    var map = {};
    (orders || []).forEach(function (o) {
      var key = String(o.channel || o.source || o.type || 'Sem canal');
      if (!map[key]) map[key] = { label: key, value: 0, count: 0 };
      map[key].value += _orderRevenue(o);
      map[key].count += 1;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; })[0] || { label: '' };
  }

  function _ordersInRange(start, end) {
    return (_data.orders || []).filter(function (o) {
      if (_isCancelled(o)) return false;
      var key = _dateKey(_dateOf(o.createdAt || o.updatedAt || o.date || o.data || o.paidAt));
      return key && key >= start && key <= end;
    });
  }

  function _itemsInRange(items, start, end) {
    return (items || []).filter(function (x) {
      var key = _dateKey(_dateOf(x.date || x.data || x.paidAt || x.vencimento || x.dueDate || x.createdAt || x.updatedAt));
      return key && key >= start && key <= end;
    });
  }

  function _normalizeEntries(movements, entradas) {
    var out = [];
    (movements || []).forEach(function (x) {
      var type = String(x.type || x.tipo || x.kind || '').toLowerCase();
      if (type === 'entrada' || type === 'receita' || type === 'income') out.push(_moneyItem(x));
    });
    (entradas || []).forEach(function (x) { out.push(_moneyItem(x)); });
    return out;
  }

  function _normalizeExits(saidas, apagar, movements) {
    var out = [];
    (saidas || []).forEach(function (x) { out.push(_moneyItem(x)); });
    (apagar || []).forEach(function (x) { out.push(_moneyItem(x)); });
    (movements || []).forEach(function (x) {
      var type = String(x.type || x.tipo || x.kind || '').toLowerCase();
      if (type === 'saida' || type === 'despesa' || type === 'expense') out.push(_moneyItem(x));
    });
    return out;
  }

  function _moneyItem(x) {
    x = x || {};
    return Object.assign({}, x, {
      value: _num(x.value != null ? x.value : x.valor != null ? x.valor : x.amount != null ? x.amount : x.total)
    });
  }

  function _orderRevenue(o) {
    o = o || {};
    return _num(o.total != null ? o.total : o.value != null ? o.value : o.finalSubtotal != null ? o.finalSubtotal : o.subtotal);
  }

  function _isOpenOrder(o) {
    var status = String((o && o.status) || '').toLowerCase();
    return status && status !== 'entregado' && status !== 'cancelado' && status !== 'cancelled' && status !== 'finalizado';
  }

  function _isCancelled(o) {
    var status = String((o && o.status) || '').toLowerCase();
    return status === 'cancelado' || status === 'cancelled';
  }

  function _isStoreOnline(template, operacao) {
    template = template || {};
    operacao = operacao || {};
    if (template.statusMode === 'manual_closed' || template.manualClosed === true) return false;
    if (template.statusMode === 'manual_open' || template.manualOpen === true) return true;
    if (operacao.isOpen === false) return false;
    return true;
  }

  function _monthRange(date) {
    var y = date.getFullYear();
    var m = date.getMonth();
    return { start: _dateKey(new Date(y, m, 1)), end: _dateKey(new Date(y, m + 1, 0)) };
  }

  function _currentMonthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function _monthLabel(date) {
    var months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return months[date.getMonth()] + ' de ' + date.getFullYear();
  }

  function _greeting(date) {
    var h = date.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 19) return 'Boa tarde';
    return 'Boa noite';
  }

  function _dateOf(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (v && typeof v.toDate === 'function') return v.toDate();
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') {
      var d = new Date(v);
      if (!isNaN(d.getTime())) return d;
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00');
    }
    return null;
  }

  function _dateKey(d) {
    d = _dateOf(d);
    if (!d || isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _ts(v) {
    var d = _dateOf(v);
    return d ? d.getTime() : 0;
  }

  function _sum(list, fn) {
    return (list || []).reduce(function (s, x) { return s + _num(fn ? fn(x) : x); }, 0);
  }

  function _num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function _fmtMoney(v) {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(_num(v));
  }

  function _safeAll(col) {
    return (window.DB && DB.getAll ? DB.getAll(col) : Promise.resolve([])).catch(function () { return []; });
  }

  function _safeDoc(col, id) {
    return (window.DB && DB.getDoc ? DB.getDoc(col, id) : Promise.resolve(null)).catch(function () { return null; });
  }

  function _safeDocRoot(col, id) {
    return (window.DB && DB.getDocRoot ? DB.getDocRoot(col, id) : Promise.resolve(null)).catch(function () { return null; });
  }

  function _esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function _safeHtml(html) {
    return html;
  }

  return {
    render: render,
    destroy: destroy,
    renderGlobalOnboarding: _renderGlobalOnboarding,
    destroyGlobalOnboarding: _removeGlobalOnboarding,
    _startWelcomeTour: _startWelcomeTour,
    _openTour: _openTour,
    _openGuidedRoute: _openGuidedRoute,
    _openChecklistGuide: _openChecklistGuide,
    _closeChecklistGuide: _closeChecklistGuide,
    _openChecklistGuideRoute: _openChecklistGuideRoute,
    _nextTourStep: _nextTourStep,
    _prevTourStep: _prevTourStep,
    _closeTour: _closeTour,
    _collapseOnboarding: _collapseOnboarding,
    _expandOnboarding: _expandOnboarding,
    _resetOnboardingProgress: _resetOnboardingProgress
  };
})();
