// js/modules/temporadas.js
window.Modules = window.Modules || {};
Modules.Temporadas = (function () {
  'use strict';

  var _tenantId = '';
  var _loading = false;
  var _error = null;
  var _state = {
    seasons: [],
    activeSeason: null,
    activeConflict: false,
    scheduledStartConflict: false,
    pageMode: 'seasons',
    moduleTab: 'current',
    activeTab: 'overview',
    businessMaturity: null,
    businessMaturityLoading: false,
    businessMaturityError: null,
    businessMaturityEvents: [],
    businessMaturitySnapshots: [],
    businessHistory: null,
    businessHistorySnapshots: [],
    pendingStoneCelebration: null,
    actionContext: {
      products: [],
      promotions: [],
      coupons: [],
      upsells: [],
      salesChannels: [],
      recipes: [],
      costItems: [],
      pointsConfig: null,
      pointsMovements: [],
      customers: []
    },
    snapshots: {
      daily: null,
      weekly: null
    }
  };

  var _wizard = null;
  var _celebratedFinalResults = {};
  var _goalCelebrationsInMemory = {};
  var _goalCelebrationCheckRunning = false;
  var _lastGoalCelebrationCheckAt = 0;

  var ALLOWED_STATUS = {
    draft: true,
    scheduled: true,
    active: true,
    finished: true,
    abandoned: true
  };

  var STONES_ORDER = ['Pedra Bruta', 'Quartzo', 'Ametista', 'Safira', 'Esmeralda', 'Rubi', 'Diamante', 'Ônix'];

  var STONE_DESCRIPTIONS = {
    'Pedra Bruta': 'Seu negócio está em fase de construção. O foco agora é sobreviver, organizar e criar base.',
    Quartzo: 'Seu negócio começou a criar mais consistência.',
    Ametista: 'Sua operação já mostra sinais de estabilidade.',
    Safira: 'Sua base está ficando mais confiável para crescer com controle.',
    Esmeralda: 'Seu crescimento começa a aparecer com mais saúde.',
    Rubi: 'Sua operação demonstra maturidade sólida.',
    Diamante: 'Seu negócio combina resultado, consistência e controle.',
    'Ônix': 'Sua evolução mostra excelência sustentável.'
  };

  var OBJECTIVES = [
    { value: 'sell_more', label: 'Vender Mais', text: 'Foco em faturamento, pedidos e dias com venda.', metric: 'revenue' },
    { value: 'increase_ticket', label: 'Aumentar Ticket', text: 'Foco em ticket médio, valor por pedido e adicionais.', metric: 'averageTicket' },
    { value: 'retain_customers', label: 'Fidelizar Clientes', text: 'Foco em recorrência, recompra e frequência.', metric: 'recurringCustomers' },
    { value: 'improve_consistency', label: 'Melhorar Consistência', text: 'Foco em dias ativos, regularidade e redução de dias fracos.', metric: 'activeDays' }
  ];

  var DURATIONS = [
    { value: 'sprint', label: 'Sprint', text: '30 dias', days: 30 },
    { value: 'season', label: 'Temporada', text: '90 dias', days: 90 }
  ];

  var DIFFICULTIES = [
    { value: 'safe', label: 'Seguro', text: 'Exigência conservadora e menor pressão operacional.' },
    { value: 'balanced', label: 'Equilibrado', text: 'Ritmo intermediário para evolução consistente.' },
    { value: 'aggressive', label: 'Agressivo', text: 'Meta mais exigente e menor tolerância a desvio.' }
  ];

  var BUILDS = [
    { value: 'volume', label: 'Mais movimento', text: 'Dá mais peso para produto forte, canal, horário e volume de pedidos.' },
    { value: 'margin', label: 'Melhor sobra', text: 'Dá mais peso para ticket, margem e produtos que vendem melhor.' },
    { value: 'retention', label: 'Clientes voltando', text: 'Dá mais peso para recompra, pontos e clientes conhecidos.' }
  ];

  function render(sub) {
    _tenantId = (window.Auth && typeof Auth.getTenantId === 'function') ? (Auth.getTenantId() || '') : '';
    var isMaturityPage = sub === 'maturidade';
    _state.pageMode = isMaturityPage ? 'maturity' : 'seasons';
    _state.moduleTab = isMaturityPage ? 'maturity' : _validModuleTab(_state.moduleTab);

    var app = document.getElementById('app');
    if (!app) return;

    var heroAction = '<button class="seasons-primary-action" type="button" onclick="Modules.Temporadas.openCreateFlow()">' +
      _icon('add') +
      '<span>Nova Temporada</span>' +
    '</button>';
    var heroHtml = isMaturityPage ? '' : '<div class="seasons-hero">' +
      '<div class="seasons-hero-main">' +
        '<div class="seasons-hero-symbol">' + _icon('assistant_direction') + '</div>' +
        '<div class="seasons-hero-copy">' +
          '<div class="seasons-kicker">' + _icon('track_changes') + ' Missões Operacionais</div>' +
          '<h1>Temporadas</h1>' +
          '<p>Use a rota do Plano de Voo para definir as próximas ações da temporada.</p>' +
          '<div class="seasons-hero-chips">' +
            '<span>Rota em ação</span>' +
            '<span>Jogadas práticas</span>' +
            '<span>Leitura por pedidos reais</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      heroAction +
    '</div>';

    app.innerHTML = '' +
      '<section class="module-page seasons-page ' + (isMaturityPage ? 'seasons-page-maturity' : 'seasons-page-temporadas') + '">' +
        heroHtml +
        '<div id="seasons-module-tabs">' + (isMaturityPage ? '' : _moduleTabs()) + '</div>' +
        '<div class="seasons-shell seasons-shell-single">' +
          '<div id="seasons-maturity-slot" class="seasons-maturity-panel">' + _maturityLoadingCard() + '</div>' +
          '<div id="seasons-active-slot">' + _loadingCard() + '</div>' +
          '<div id="seasons-scheduled-slot">' + _scheduledLoadingCard() + '</div>' +
          '<div id="seasons-history-slot">' + _historyLoadingCard() + '</div>' +
        '</div>' +
      '</section>';

    _loadSeasons();
  }

  function _loadSeasons() {
    _loading = true;
    _error = null;
    _paint();

    if (!_tenantId || !window.DB || typeof DB.getAll !== 'function') {
      _loading = false;
      _error = new Error('Tenant não identificado ou DB indisponível.');
      _state.seasons = [];
      _state.activeSeason = null;
      _state.activeConflict = false;
      _state.scheduledStartConflict = false;
      _state.businessMaturity = _initialMaturity();
      _state.businessMaturityLoading = false;
      _state.businessMaturityError = null;
      _state.businessMaturityEvents = [];
      _state.businessMaturitySnapshots = [];
      _state.businessHistory = null;
      _state.actionContext = { products: [], promotions: [], coupons: [], upsells: [], salesChannels: [], recipes: [], costItems: [], variantGroups: [], pointsConfig: null, pointsMovements: [], customers: [] };
      _state.pendingStoneCelebration = null;
      _state.snapshots = { daily: null, weekly: null };
      _paint();
      return;
    }

    DB.getAll('seasons').then(function (seasons) {
      _state.seasons = _normalizeSeasons(seasons || []);
      return _promoteDueScheduledSeasons(_state.seasons);
    }).then(function (seasons) {
      _state.seasons = _normalizeSeasons(seasons || _state.seasons || []);
      _refreshSeasonStateFlags();
      if (!_state.activeSeason) return null;
      return _loadSeasonActionContext().then(function (actionContext) {
        _state.actionContext = actionContext || _state.actionContext;
        return _refreshActiveSeasonMetrics(_state.activeSeason, _state.actionContext);
      }).then(function (season) {
        if (season) {
          _state.activeSeason = season;
          _state.seasons = _state.seasons.map(function (item) {
            return item.id === season.id ? season : item;
          });
        }
        return season;
      });
    }).then(function () {
      return _loadBusinessMaturity({
        persist: _state.pageMode === 'maturity',
        source: _state.pageMode === 'maturity' ? 'maturity_screen' : 'season_screen_read'
      });
    }).then(function () {
      _loading = false;
      _paint();
    }).catch(function (err) {
      console.error('Temporadas load error', err);
      _loading = false;
      _error = err;
      _state.seasons = [];
      _state.activeSeason = null;
      _state.activeConflict = false;
      _state.scheduledStartConflict = false;
      _state.businessMaturity = _initialMaturity();
      _state.businessMaturityLoading = false;
      _state.businessMaturityError = err;
      _state.businessMaturityEvents = [];
      _state.businessMaturitySnapshots = [];
      _state.businessHistory = null;
      _state.actionContext = { products: [], promotions: [], coupons: [], upsells: [], salesChannels: [], recipes: [], costItems: [], variantGroups: [], pointsConfig: null, pointsMovements: [], customers: [] };
      _state.pendingStoneCelebration = null;
      _state.snapshots = { daily: null, weekly: null };
      _paint();
    });
  }

  function _loadSeasonActionContext() {
    if (!window.DB || typeof DB.getAll !== 'function') {
      return Promise.resolve({ products: [], promotions: [], coupons: [], upsells: [], salesChannels: [], recipes: [], costItems: [], variantGroups: [], pointsConfig: null, pointsMovements: [], customers: [] });
    }
    return Promise.all([
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('promotions').catch(function () { return []; }),
      DB.getAll('promocoes').catch(function () { return []; }),
      DB.getAll('coupons').catch(function () { return []; }),
      DB.getAll('upsellRules').catch(function () { return []; }),
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('itens_custo').catch(function () { return []; }),
      DB.getAll('variantGroups').catch(function () { return []; }),
      (typeof DB.getDocRoot === 'function' ? DB.getDocRoot('config', 'canais_venda') : Promise.resolve(null)).catch(function () { return null; }),
      (typeof DB.getDocRoot === 'function' ? DB.getDocRoot('config', 'pontos_program') : Promise.resolve(null)).catch(function () { return null; }),
      DB.getAll('points_movements').catch(function () { return []; }),
      DB.getAll('store_customers').catch(function () { return []; })
    ]).then(function (res) {
      return {
        products: res[0] || [],
        promotions: _mergePromotionLists(res[1] || [], res[2] || []),
        coupons: res[3] || [],
        upsells: res[4] || [],
        recipes: res[5] || [],
        costItems: res[6] || [],
        variantGroups: res[7] || [],
        salesChannels: _normalizeSalesChannelsConfig(res[8] || {}),
        pointsConfig: res[9] || null,
        pointsMovements: res[10] || [],
        customers: res[11] || []
      };
    });
  }

  function _normalizeSalesChannelsConfig(config) {
    var list = Array.isArray(config && config.list) ? config.list : [];
    var fixed = [
      { name: 'Cardápio', key: 'cardapio', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true },
      { name: 'Venda presencial', key: 'venda_presencial', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true }
    ];
    var out = [];
    fixed.concat(list || []).forEach(function (channel) {
      if (!channel) return;
      var name = String(channel.name || channel.label || channel.title || '').trim();
      if (!name) return;
      var key = _normalizeChannel(channel.key || channel.value || name);
      if (out.some(function (item) { return item.key === key || _foldText(item.name) === _foldText(name); })) return;
      out.push({
        id: channel.id || channel._id || '',
        key: key,
        name: name,
        commissionPct: _number(channel.commissionPct || channel.comissaoPct || channel.feePct, 0),
        fixedFee: _money(channel.fixedFee || channel.taxaFixa || channel.feeFixed || 0),
        taxPct: _number(channel.taxPct || channel.commissionTaxPct || channel.impostoPct, 0),
        minMarginPct: _number(channel.minMarginPct || channel.margemMinimaPct, 0),
        locked: channel.locked === true
      });
    });
    return out;
  }

  function _mergePromotionLists(a, b) {
    var seen = {};
    var out = [];
    (a || []).concat(b || []).forEach(function (promo) {
      if (!promo) return;
      var key = String(promo.id || promo._id || promo.slug || promo.code || promo.codigo || [
        promo.name || promo.title || '',
        promo.type || promo.tipo || '',
        promo.startDate || promo.startsAt || '',
        promo.endDate || promo.endsAt || ''
      ].join('|'));
      if (key && seen[key]) return;
      if (key) seen[key] = true;
      out.push(promo);
    });
    return out;
  }

  function _paint() {
    var activeSlot = document.getElementById('seasons-active-slot');
    var scheduledSlot = document.getElementById('seasons-scheduled-slot');
    var historySlot = document.getElementById('seasons-history-slot');
    var tabsSlot = document.getElementById('seasons-module-tabs');
    var maturitySlot = document.getElementById('seasons-maturity-slot');
    if (!activeSlot || !scheduledSlot || !historySlot || !maturitySlot) return;
    var shell = activeSlot.parentNode;
    var isMaturityPage = _state.pageMode === 'maturity';
    var activeModuleTab = isMaturityPage ? 'maturity' : _validModuleTab(_state.moduleTab);
    _state.moduleTab = activeModuleTab;
    if (tabsSlot) tabsSlot.innerHTML = isMaturityPage ? '' : _moduleTabs();
    if (maturitySlot) maturitySlot.innerHTML = _maturityCard(_state.businessMaturity, _state.businessMaturityLoading, _state.businessMaturityError);

    if (_loading) {
      if (shell) shell.classList.add('seasons-shell-single');
      maturitySlot.style.display = activeModuleTab === 'maturity' ? '' : 'none';
      activeSlot.style.display = activeModuleTab === 'current' ? '' : 'none';
      scheduledSlot.style.display = activeModuleTab === 'scheduled' ? '' : 'none';
      historySlot.style.display = activeModuleTab === 'history' ? '' : 'none';
      activeSlot.innerHTML = _loadingCard();
      scheduledSlot.innerHTML = _scheduledLoadingCard();
      historySlot.innerHTML = _historyLoadingCard();
      return;
    }

    if (_error) {
      if (shell) shell.classList.add('seasons-shell-single');
      maturitySlot.style.display = activeModuleTab === 'maturity' ? '' : 'none';
      activeSlot.style.display = activeModuleTab === 'current' ? '' : 'none';
      scheduledSlot.style.display = activeModuleTab === 'scheduled' ? '' : 'none';
      historySlot.style.display = activeModuleTab === 'history' ? '' : 'none';
      activeSlot.innerHTML = _errorCard(_error);
      scheduledSlot.innerHTML = _scheduledCard([]);
      historySlot.innerHTML = _historyCard([]);
      return;
    }

    if (shell) shell.classList.add('seasons-shell-single');
    activeSlot.innerHTML = _state.activeSeason ? _activeSeasonCard(_state.activeSeason) : _emptyActiveCard();
    scheduledSlot.innerHTML = _scheduledCard(_scheduledSeasons());
    historySlot.innerHTML = _historyCard(_historySeasons());

    if (activeModuleTab === 'maturity') {
      maturitySlot.style.display = '';
      activeSlot.style.display = 'none';
      scheduledSlot.style.display = 'none';
      historySlot.style.display = 'none';
    } else if (activeModuleTab === 'scheduled') {
      maturitySlot.style.display = 'none';
      activeSlot.style.display = 'none';
      scheduledSlot.style.display = '';
      historySlot.style.display = 'none';
    } else if (activeModuleTab === 'history') {
      maturitySlot.style.display = 'none';
      activeSlot.style.display = 'none';
      scheduledSlot.style.display = 'none';
      historySlot.style.display = '';
    } else {
      maturitySlot.style.display = 'none';
      activeSlot.style.display = '';
      scheduledSlot.style.display = 'none';
      historySlot.style.display = 'none';
    }
  }

  function _moduleTabs() {
    var tab = _validModuleTab(_state.moduleTab);
    var items = [
      { key: 'current', label: 'Ativa', icon: 'track_changes' },
      { key: 'scheduled', label: 'Programadas', icon: 'event_upcoming' },
      { key: 'history', label: 'Histórico', icon: 'history' }
    ];
    return '<nav class="seasons-module-tabs" aria-label="Seções de Temporadas">' + items.map(function (item) {
      return '<button type="button" class="' + (tab === item.key ? 'active' : '') + '" onclick="Modules.Temporadas._setModuleTab(\'' + item.key + '\')">' + _icon(item.icon) + _esc(item.label) + '</button>';
    }).join('') + '</nav>';
  }

  function _validModuleTab(tab) {
    return ({ current: true, scheduled: true, history: true })[tab] ? tab : 'current';
  }

  function _setModuleTab(tab) {
    _state.moduleTab = _validModuleTab(tab);
    _paint();
  }

  function _loadBusinessMaturity(opts) {
    opts = opts || {};
    _state.businessMaturityLoading = true;
    _state.businessMaturityError = null;
    _paint();

    if (!_tenantId || !window.DB || typeof DB.getAll !== 'function') {
      _state.businessMaturity = _initialMaturity();
      _state.businessHistory = _emptyBusinessHistory();
      _state.businessHistorySnapshots = [];
      _state.businessMaturityLoading = false;
      return Promise.resolve(_state.businessMaturity);
    }

    var monthKey = _maturityMonthKey();
    return Promise.all([
      DB.getAll('orders').catch(function () { return []; }),
      DB.getAll('store_customers').catch(function () { return []; }),
      DB.getAll('flight_plans').catch(function () { return []; }),
      (DB.getDoc ? DB.getDoc('flight_plan_month_scenarios', monthKey).catch(function () { return null; }) : Promise.resolve(null)),
      (DB.getDoc ? DB.getDoc('business_maturity', 'current').catch(function () { return null; }) : Promise.resolve(null)),
      DB.getAll('stone_upgrade_events').catch(function () { return []; }),
      DB.getAll('business_maturity_snapshots').catch(function () { return []; }),
      DB.getAll('reviews').catch(function () { return []; }),
      DB.getAll('points_movements').catch(function () { return []; }),
      DB.getAll('promotions').catch(function () { return []; }),
      DB.getAll('promocoes').catch(function () { return []; }),
      DB.getAll('coupons').catch(function () { return []; }),
      DB.getAll('upsellRules').catch(function () { return []; }),
      DB.getAll('stock_movements').catch(function () { return []; }),
      DB.getAll('production_orders').catch(function () { return []; }),
      DB.getAll('compras').catch(function () { return []; }),
      DB.getAll('movimentacoes').catch(function () { return []; }),
      DB.getAll('financeiro_entradas').catch(function () { return []; }),
      DB.getAll('financeiro_saidas').catch(function () { return []; }),
      DB.getAll('financeiro_apagar').catch(function () { return []; }),
      DB.getAll('contas_pagar').catch(function () { return []; }),
      DB.getAll('business_history_snapshots').catch(function () { return []; })
    ]).then(function (r) {
      var events = _normalizeStoneUpgradeEvents(r[5] || []);
      var snapshots = _normalizeMaturitySnapshots(r[6] || []);
      var historySnapshots = _normalizeBusinessHistorySnapshots(r[21] || []);
      var maturity = _calculateBusinessMaturity({
        seasons: _state.seasons || [],
        orders: r[0] || [],
        customers: r[1] || [],
        flightPlans: r[2] || [],
        monthScenario: r[3] || null,
        existing: r[4] || null,
        reviews: r[7] || [],
        pointsMovements: r[8] || [],
        promotions: (r[9] || []).concat(r[10] || []),
        coupons: r[11] || [],
        upsellRules: r[12] || [],
        stockMovements: r[13] || [],
        productionOrders: r[14] || [],
        purchases: r[15] || [],
        cashMovements: r[16] || [],
        financeEntries: r[17] || [],
        financeExits: r[18] || [],
        financePayablesLegacy: r[19] || [],
        payables: r[20] || []
      });
      _state.businessMaturity = maturity;
      _state.businessHistory = maturity.businessHistory || _emptyBusinessHistory();
      _state.businessMaturityEvents = events;
      _state.businessMaturitySnapshots = snapshots;
      _state.businessHistorySnapshots = historySnapshots;
      _state.businessMaturityLoading = false;
      if (opts.persist === false) {
        _paint();
        return maturity;
      }

      return _saveBusinessMaturity(maturity, r[4] || null).then(function (savedMaturity) {
        if (savedMaturity && savedMaturity.recentUpgradeEvent) {
          _state.businessMaturityEvents = _normalizeStoneUpgradeEvents([savedMaturity.recentUpgradeEvent].concat(_state.businessMaturityEvents || []));
          _state.pendingStoneCelebration = savedMaturity.recentUpgradeEvent;
        } else {
          _state.pendingStoneCelebration = _nextPendingStoneCelebration(_state.businessMaturityEvents);
        }
        _state.businessMaturity = savedMaturity || maturity;
        return _ensureBusinessMaturitySnapshots(_state.businessMaturity, _state.businessMaturitySnapshots, opts).then(function (updatedSnapshots) {
          _state.businessMaturitySnapshots = updatedSnapshots;
          return _ensureBusinessHistorySnapshots(_state.businessMaturity.businessHistory, _state.businessHistorySnapshots, opts).then(function (updatedHistorySnapshots) {
            _state.businessHistorySnapshots = updatedHistorySnapshots;
            _paint();
            _triggerStoneUpgradeCelebration(_state.pendingStoneCelebration);
            return _state.businessMaturity;
          });
        });
      });
    }).catch(function (err) {
      console.warn('Business maturity calculation skipped', err);
      _state.businessMaturity = _initialMaturity();
      _state.businessHistory = _emptyBusinessHistory();
      _state.businessMaturityLoading = false;
      _state.businessMaturityError = err;
      _state.businessMaturitySnapshots = [];
      _state.businessHistorySnapshots = [];
      return _state.businessMaturity;
    });
  }

  function _saveBusinessMaturity(maturity, existing) {
    if (!maturity || !window.DB || typeof DB.set !== 'function') return Promise.resolve(maturity);
    var now = _maturityTimestamp();
    var clientNow = new Date().toISOString();
    var upgradeEvent = maturity.pendingUpgradeEvent || null;
    var payload = Object.assign({}, maturity, {
      tenantId: _tenantId,
      id: undefined,
      createdAt: existing && existing.createdAt ? existing.createdAt : now,
      updatedAt: now,
      lastCalculatedAt: now,
      lastUpgradeAt: upgradeEvent ? now : (existing && existing.lastUpgradeAt ? existing.lastUpgradeAt : null)
    });
    delete payload.id;
    delete payload.pendingUpgradeEvent;
    delete payload.recentUpgradeEvent;
    return DB.set('business_maturity', 'current', payload).then(function () {
      return true;
    }).catch(function (err) {
      console.warn('Business maturity save skipped', err);
      return false;
    }).then(function (saved) {
      if (!saved || !upgradeEvent || typeof DB.add !== 'function') return maturity;
      return DB.add('stone_upgrade_events', Object.assign({}, upgradeEvent, {
        tenantId: _tenantId,
        upgradedAt: now,
        celebrationPending: true,
        celebrationShownAt: null
      })).then(function (ref) {
        maturity.recentUpgradeEvent = Object.assign({}, upgradeEvent, {
          id: ref && ref.id ? ref.id : '',
          tenantId: _tenantId,
          createdAt: clientNow,
          upgradedAt: clientNow,
          celebrationPending: true,
          celebrationShownAt: null
        });
        return maturity;
      }).catch(function (err) {
        console.warn('Stone upgrade event save skipped', err);
        return maturity;
      });
    });
  }

  function _registerSeasonMaturityImpact(season, source) {
    if (!season || (season.status !== 'finished' && season.status !== 'abandoned')) return Promise.resolve(null);
    if (season.id) {
      var found = false;
      _state.seasons = (_state.seasons || []).map(function (item) {
        if (item.id !== season.id) return item;
        found = true;
        return Object.assign({}, item, season);
      });
      if (!found) _state.seasons = [season].concat(_state.seasons || []);
    }
    return _loadBusinessMaturity({
      persist: true,
      snapshotType: 'season_final',
      source: source || (season.status === 'abandoned' ? 'season_abandoned' : 'season_final'),
      relatedSeasonId: season.id || '',
      season: season
    });
  }

  function _calculateBusinessMaturity(input) {
    input = input || {};
    var existing = input.existing || {};
    var seasons = _normalizeSeasons(input.seasons || []);
    var orders = _maturityValidOrders(input.orders || []);
    var customers = input.customers || [];
    var monthScenario = input.monthScenario || null;
    var flightPlans = input.flightPlans || [];
    var currentStone = _validStone(existing.currentStone) || 'Pedra Bruta';
    var nextStone = _nextStone(currentStone);
    var seasonStats = _maturitySeasonStats(seasons);
    var orderStats = _maturityOrderStats(orders);
    var loyaltyStats = _maturityLoyaltyStats(orders, customers);
    var scenario = _maturityScenario(monthScenario, flightPlans, input.monthKey || _maturityMonthKey());
    var dataSignals = _maturityDataSignals(input, orders);
    var businessHistory = _businessHistoryContext(input, orders);
    var indexes = _maturityIndexes(seasonStats, orderStats, loyaltyStats, scenario, dataSignals, businessHistory);
    var maturityScore = _maturityScore(indexes);
    var hasEnoughData = seasonStats.finishedWithResult > 0 || orderStats.totalOrders >= 3;
    var previousProgress = _clamp(_number(existing.stoneProgressPercent, 0), 0, 100);
    var progress = hasEnoughData ? _clamp(Math.round((maturityScore * 0.68) + seasonStats.totalImpact), 0, 100) : 0;
    var strengths = _maturityStrengths(seasonStats, orderStats, loyaltyStats, indexes, scenario, dataSignals);
    var weaknesses = _maturityWeaknesses(seasonStats, orderStats, loyaltyStats, indexes, scenario, dataSignals);
    var lastImpact = seasonStats.lastImpact || _emptySeasonImpact();
    var checklist = _maturityChecklist(currentStone, nextStone, seasonStats, orderStats, loyaltyStats, indexes, scenario);
    var blockers = _stoneUpgradeBlockers(seasonStats, orderStats, indexes, checklist, hasEnoughData);
    var signature = _maturityCalculationSignature(seasonStats, orderStats, loyaltyStats, scenario);
    var upgrade = _stoneUpgradeDecision(existing, {
      currentStone: currentStone,
      nextStone: nextStone,
      progress: progress,
      previousProgress: previousProgress,
      maturityScore: maturityScore,
      indexes: indexes,
      checklist: checklist,
      blockers: blockers,
      signature: signature,
      seasonStats: seasonStats,
      orderStats: orderStats,
      loyaltyStats: loyaltyStats,
      scenario: scenario
    });
    if (upgrade.upgraded) {
      currentStone = upgrade.currentStone;
      nextStone = upgrade.nextStone;
      progress = upgrade.progress;
      checklist = _maturityChecklist(currentStone, nextStone, seasonStats, orderStats, loyaltyStats, indexes, scenario);
      strengths = _maturityStrengths(seasonStats, orderStats, loyaltyStats, indexes, scenario, dataSignals);
      weaknesses = _maturityWeaknesses(seasonStats, orderStats, loyaltyStats, indexes, scenario, dataSignals);
    } else if (upgrade.progress !== undefined) {
      progress = upgrade.progress;
    }

    return {
      tenantId: _tenantId,
      currentStone: currentStone,
      nextStone: nextStone,
      stoneProgressPercent: progress,
      previousStoneProgressPercent: previousProgress,
      maturityScore: hasEnoughData ? Math.round(maturityScore) : 0,
      indexes: indexes,
      dataSignals: dataSignals,
      businessHistory: businessHistory,
      orderSummary: {
        totalOrders: orderStats.totalOrders,
        revenue: orderStats.revenue,
        activeDays: orderStats.activeDays,
        activeWeeks: orderStats.activeWeeks,
        averageTicket: orderStats.averageTicket
      },
      strengths: strengths,
      weaknesses: weaknesses,
      checklist: checklist,
      checklistSummary: _maturityChecklistSummary(checklist),
      blockers: blockers,
      lastSeasonImpact: lastImpact,
      lastSeasonImpactPercent: lastImpact.impactPercent || 0,
      lastSeasonImpactReason: lastImpact.reason || '',
      seasonContributionSummary: seasonStats.summary,
      lastUpgradeSignature: upgrade.lastUpgradeSignature || existing.lastUpgradeSignature || '',
      lastUpgradeReason: upgrade.reason || existing.lastUpgradeReason || '',
      lastUpgradeFrom: upgrade.fromStone || existing.lastUpgradeFrom || '',
      lastUpgradeTo: upgrade.toStone || existing.lastUpgradeTo || '',
      pendingUpgradeEvent: upgrade.event || null,
      recentUpgradeEvent: null,
      lastCalculatedAt: existing.lastCalculatedAt || null,
      lastUpgradeAt: upgrade.upgraded ? null : (existing.lastUpgradeAt || null),
      createdAt: existing.createdAt || null,
      updatedAt: existing.updatedAt || null,
      calculationVersion: 'stones_phase_4',
      calculationNotes: [
        'Fase 4: upgrade automatico de uma Pedra quando progresso chega a 100 sem bloqueios graves.',
        'Eventos de evolucao sao salvos em stone_upgrade_events para auditoria.'
      ]
    };
  }

  function _initialMaturity() {
    return {
      tenantId: _tenantId,
      currentStone: 'Pedra Bruta',
      nextStone: 'Quartzo',
      stoneProgressPercent: 0,
      maturityScore: 0,
      indexes: _emptyMaturityIndexes(),
      dataSignals: _emptyMaturityDataSignals(),
      businessHistory: _emptyBusinessHistory(),
      orderSummary: { totalOrders: 0, revenue: 0, activeDays: 0, activeWeeks: 0, averageTicket: 0 },
      strengths: ['Comeco da organizacao do negocio.'],
      weaknesses: ['Ainda faltam dados suficientes para medir evolucao.'],
      lastCalculatedAt: null,
      lastUpgradeAt: null,
      createdAt: null,
      updatedAt: null,
      checklist: _initialChecklist(),
      checklistSummary: { completed: 0, pending: 4, limited: 0, total: 4 },
      blockers: [],
      lastSeasonImpact: _emptySeasonImpact(),
      lastSeasonImpactPercent: 0,
      lastSeasonImpactReason: '',
      seasonContributionSummary: _emptySeasonContributionSummary(),
      lastUpgradeSignature: '',
      lastUpgradeReason: '',
      lastUpgradeFrom: '',
      lastUpgradeTo: '',
      recentUpgradeEvent: null,
      calculationVersion: 'stones_phase_4'
    };
  }

  function _emptyMaturityIndexes() {
    return {
      healthyGrowth: _maturityIndex(0, 'low', ['Sem dados suficientes de pedidos.']),
      consistency: _maturityIndex(0, 'low', ['Sem historico suficiente de vendas ou temporadas.']),
      financialHealth: _maturityIndex(0, 'low', ['Financeiro avancado ainda fora desta fase.']),
      controlledRisk: _maturityIndex(0, 'low', ['Sem temporadas suficientes para medir risco.']),
      loyalty: _maturityIndex(0, 'low', ['Sem recorrencia suficiente para medir fidelizacao.']),
      execution: _maturityIndex(0, 'low', ['Sem temporadas finalizadas para medir execução.'])
    };
  }

  function _emptyMaturityDataSignals() {
    return {
      finance: { hasData: false, entries: 0, exits: 0, net: 0, marginPct: 0, pendingPayables: 0, overduePayables: 0, confidence: 'low' },
      marketing: { hasData: false, activePromotions: 0, activeCoupons: 0, activeUpsells: 0, configuredActions: 0, actionOrders: 0, couponOrders: 0, promotionOrders: 0, upsellOrders: 0, grossRevenue: 0, netRevenue: 0, discountTotal: 0, discountRate: 0, upsellRevenue: 0, impactStatus: 'empty', confidence: 'low' },
      loyaltyProgram: { hasData: false, movements: 0, generated: 0, redeemed: 0, customers: 0, redemptionOrders: 0, redemptionValue: 0, repeatCustomersWithPoints: 0, impactStatus: 'empty', confidence: 'low' },
      reviews: { hasData: false, total: 0, approved: 0, averageRating: 0, productMentions: 0, lowRatings: 0, trustStatus: 'empty', confidence: 'low' },
      operations: { hasData: false, stockMovements: 0, stockEntries: 0, stockExits: 0, productionOrders: 0, plannedProductions: 0, completedProductions: 0, purchases: 0, completedPurchases: 0, operationStatus: 'empty', limiterScore: 0, confidence: 'low' }
    };
  }

  function _maturityDataSignals(input, validOrders) {
    input = input || {};
    return {
      finance: _maturityFinanceStats(input),
      marketing: _maturityMarketingStats(validOrders || [], input),
      loyaltyProgram: _maturityPointsStats(validOrders || [], input.pointsMovements || []),
      reviews: _maturityReviewStats(input.reviews || []),
      operations: _maturityOperationsStats(input)
    };
  }

  function _maturityFinanceStats(input) {
    input = input || {};
    var movements = (input.cashMovements || []).map(function (item) { return _maturityFinanceRow(item, 'movimentacoes'); });
    var entries = movements.filter(function (row) { return row.kind === 'entrada'; })
      .concat((input.financeEntries || []).map(function (item) { return _maturityFinanceRow(item, 'financeiro_entradas', 'entrada'); }));
    var exits = movements.filter(function (row) { return row.kind === 'saida'; })
      .concat((input.financeExits || []).map(function (item) { return _maturityFinanceRow(item, 'financeiro_saidas', 'saida'); }));
    var payables = (input.payables || []).concat(input.financePayablesLegacy || []);
    var received = _sumRecentFinance(entries, true);
    var paid = _sumRecentFinance(exits, true);
    var pending = 0;
    var overdue = 0;
    var pendingCount = 0;
    var overdueCount = 0;
    var today = _dayStart(new Date());

    payables.forEach(function (item) {
      item = item || {};
      var status = _normalizeText(item.status || item.state || '');
      if (_maturityFinanceStatusCanceled(status) || _maturityFinanceStatusPaid(status)) return;
      var total = _money(item.valorParcela != null ? item.valorParcela : item.valor_parcela != null ? item.valor_parcela : item.valorTotalOriginal != null ? item.valorTotalOriginal : item.valor_total_original != null ? item.valor_total_original : item.valor || item.value || 0);
      var paidValue = _money(item.valorPago != null ? item.valorPago : item.valor_pago_total || 0);
      var value = _money(item.saldoRestante != null ? item.saldoRestante : item.saldo_restante != null ? item.saldo_restante : item.valorRestante != null ? item.valorRestante : Math.max(0, total - paidValue));
      if (!value && total && !_maturityFinanceStatusPaid(status)) value = total;
      pending += value;
      if (value > 0) pendingCount++;
      var due = _toDate(item.vencimento || item.dueDate || item.dataVencimento || item.data || item.date);
      if ((status === 'vencido' || (due && due < today)) && value > 0) {
        overdue += value;
        overdueCount++;
      }
    });

    var net = received - paid;
    var marginPct = received > 0 ? (net / received) * 100 : 0;
    var hasData = entries.length > 0 || exits.length > 0 || payables.length > 0;
    var rowCount = entries.length + exits.length + payables.length;
    var cashStatus = !hasData ? 'empty' : (overdue > 0 ? 'critical' : (net < 0 || marginPct < 10 ? 'attention' : 'healthy'));
    return {
      hasData: hasData,
      entries: Math.round(received * 100) / 100,
      exits: Math.round(paid * 100) / 100,
      net: Math.round(net * 100) / 100,
      marginPct: Math.round(marginPct * 10) / 10,
      pendingPayables: Math.round(pending * 100) / 100,
      overduePayables: Math.round(overdue * 100) / 100,
      pendingPayablesCount: pendingCount,
      overduePayablesCount: overdueCount,
      cashStatus: cashStatus,
      confidence: rowCount >= 12 ? 'high' : (rowCount >= 5 ? 'medium' : (hasData ? 'low' : 'low'))
    };
  }

  function _maturityFinanceRow(item, source, fallbackKind) {
    item = item || {};
    var kind = _normalizeText(item.tipo || item.kind || item.type || fallbackKind || '');
    if (kind !== 'saida' && kind !== 'entrada') {
      kind = _money(item.valorPago || item.valor_pago_total || 0) > 0 && source !== 'financeiro_entradas' ? 'saida' : 'entrada';
    }
    var status = _normalizeText(item.status || item.state || '');
    var total = _money(item.valorParcela != null ? item.valorParcela : item.valor_parcela != null ? item.valor_parcela : item.valorTotalOriginal != null ? item.valorTotalOriginal : item.valor_total_original != null ? item.valor_total_original : item.valor != null ? item.valor : item.value);
    var received = _money(item.valorRecebido != null ? item.valorRecebido : item.valor_recebido_total || 0);
    var paid = _money(item.valorPago != null ? item.valorPago : item.valor_pago_total || 0);
    var remaining = _money(item.saldoRestante != null ? item.saldoRestante : item.saldo_restante || 0);
    var value = kind === 'saida'
      ? _maturityFinanceEffectiveValue(status, total, paid, remaining, 'saida')
      : _maturityFinanceEffectiveValue(status, total, received, remaining, 'entrada');
    return {
      kind: kind,
      source: source || '',
      status: status,
      value: value,
      date: _toDate(item.data_recebimento || item.dataPagamento || item.paidAt || item.receivedAt || item.data || item.date || item.createdAt)
    };
  }

  function _maturityFinanceEffectiveValue(status, total, paidValue, remaining, kind) {
    status = _normalizeText(status || '');
    total = _money(total);
    paidValue = _money(paidValue);
    remaining = _money(remaining);
    if (_maturityFinanceStatusCanceled(status)) return 0;
    if (status === 'parcial') return paidValue || Math.max(0, total - remaining);
    if (_maturityFinanceStatusPaid(status)) return paidValue || total;
    if (status === 'previsto' || status === 'pendente' || status === 'vencido' || status === 'em_aberto' || status === 'a_pagar') return 0;
    return paidValue || total;
  }

  function _maturityFinanceStatusPaid(status) {
    status = _normalizeText(status || '');
    return ['pago', 'paga', 'efetivado', 'efetivada', 'recebido', 'recebida', 'liquidado', 'liquidada', 'concluido', 'concluida'].indexOf(status) >= 0;
  }

  function _maturityFinanceStatusCanceled(status) {
    status = _normalizeText(status || '');
    return ['cancelado', 'cancelada', 'estornado', 'estornada', 'excluido', 'excluida'].indexOf(status) >= 0;
  }

  function _sumRecentFinance(rows, onlyEffective) {
    var start = new Date();
    start.setDate(start.getDate() - 30);
    start = _dayStart(start);
    return (rows || []).reduce(function (sum, row) {
      if (!row || !row.date || row.date < start) return sum;
      if (onlyEffective && row.status && ['previsto', 'pendente', 'vencido', 'cancelado'].indexOf(row.status) >= 0) return sum;
      return sum + _money(row.value);
    }, 0);
  }

  function _maturityMarketingStats(validOrders, input) {
    input = input || {};
    var promotions = input.promotions || [];
    var coupons = input.coupons || [];
    var upsells = input.upsellRules || [];
    var couponOrders = 0;
    var promotionOrders = 0;
    var upsellOrders = 0;
    var discountTotal = 0;
    var upsellRevenue = 0;
    var grossRevenue = 0;

    (validOrders || []).forEach(function (order) {
      var couponDiscount = _money(order.couponDiscount);
      var promotionDiscount = _money(order.promotionDiscount);
      var upsellDiscount = _money(order.upsellDiscount);
      var addedRevenue = _money(order.upsellAddedRevenue);
      var hasCoupon = !!order.couponCode || couponDiscount > 0;
      var hasPromotion = !!order.promotionName || promotionDiscount > 0;
      var hasUpsell = !!order.upsellAccepted || addedRevenue > 0;
      if (hasCoupon) couponOrders++;
      if (hasPromotion) promotionOrders++;
      if (hasUpsell) upsellOrders++;
      if (hasCoupon || hasPromotion || hasUpsell) {
        grossRevenue += _money(order.total || order.revenue || 0);
      }
      discountTotal += couponDiscount + promotionDiscount + upsellDiscount;
      upsellRevenue += addedRevenue;
    });

    var activePromotions = promotions.filter(_maturityActiveRecord).length;
    var activeCoupons = coupons.filter(_maturityActiveRecord).length;
    var activeUpsells = upsells.filter(_maturityActiveRecord).length;
    var configuredActions = activePromotions + activeCoupons + activeUpsells;
    var actionOrders = couponOrders + promotionOrders + upsellOrders;
    var netRevenue = Math.max(0, grossRevenue - discountTotal);
    var discountRate = grossRevenue > 0 ? (discountTotal / grossRevenue) * 100 : 0;
    var impactStatus = !actionOrders ? (configuredActions ? 'configured_only' : 'empty') : (discountRate > 30 ? 'heavy_discount' : (netRevenue > 0 ? 'positive' : 'weak'));
    var hasData = configuredActions + actionOrders > 0;
    return {
      hasData: hasData,
      activePromotions: activePromotions,
      activeCoupons: activeCoupons,
      activeUpsells: activeUpsells,
      configuredActions: configuredActions,
      actionOrders: actionOrders,
      couponOrders: couponOrders,
      promotionOrders: promotionOrders,
      upsellOrders: upsellOrders,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      discountRate: Math.round(discountRate * 10) / 10,
      upsellRevenue: Math.round(upsellRevenue * 100) / 100,
      impactStatus: impactStatus,
      confidence: actionOrders >= 5 ? 'high' : (actionOrders >= 2 ? 'medium' : (hasData ? 'low' : 'low'))
    };
  }

  function _maturityPointsStats(validOrders, movements) {
    var generated = 0;
    var redeemed = 0;
    var customers = {};
    var redemptionCustomers = {};
    (movements || []).forEach(function (item) {
      item = item || {};
      var points = Math.abs(_number(item.points != null ? item.points : item.amount != null ? item.amount : item.pontos, 0));
      var type = _normalizeText(item.type || item.tipo || item.kind || '');
      var key = String(item.customerId || item.clientId || item.userId || item.phone || item.email || '').trim();
      if (key) customers[key] = true;
      if (type.indexOf('redeem') >= 0 || type.indexOf('resgat') >= 0 || type.indexOf('uso') >= 0) {
        redeemed += points;
        if (key) redemptionCustomers[key] = true;
      } else {
        generated += points;
      }
    });
    var redemptionValue = 0;
    var orderCustomerCounts = {};
    (validOrders || []).forEach(function (order) {
      var key = _customerKey(order);
      if (key) orderCustomerCounts[key] = (orderCustomerCounts[key] || 0) + 1;
    });
    var redemptionOrders = (validOrders || []).filter(function (order) {
      var used = _number(order.pointsRedemption, 0) > 0 || _number(order.pointsDiscount, 0) > 0;
      if (used) {
        redemptionValue += _money(order.pointsDiscount);
        var key = _customerKey(order);
        if (key) redemptionCustomers[key] = true;
      }
      return used;
    }).length;
    var repeatCustomersWithPoints = Object.keys(redemptionCustomers).filter(function (key) {
      return _number(orderCustomerCounts[key], 0) >= 2;
    }).length;
    var hasData = movements.length > 0 || redemptionOrders > 0;
    var impactStatus = !hasData ? 'empty' : (redemptionOrders > 0 ? 'redeemed' : 'generated_only');
    return {
      hasData: hasData,
      movements: movements.length,
      generated: Math.round(generated),
      redeemed: Math.round(redeemed),
      customers: Object.keys(customers).length,
      redemptionOrders: redemptionOrders,
      redemptionValue: Math.round(redemptionValue * 100) / 100,
      repeatCustomersWithPoints: repeatCustomersWithPoints,
      impactStatus: impactStatus,
      confidence: redemptionOrders >= 2 || repeatCustomersWithPoints > 0 ? 'medium' : (hasData ? 'low' : 'low')
    };
  }

  function _maturityReviewStats(reviews) {
    var approved = 0;
    var totalRating = 0;
    var rated = 0;
    var productMentions = 0;
    var lowRatings = 0;
    var attentionRatings = 0;
    (reviews || []).forEach(function (review) {
      review = review || {};
      var status = _normalizeText(review.status || '');
      var isApproved = review.approved === true || status === 'approved' || status === 'aprovado';
      if (!isApproved) return;
      approved++;
      var rating = _number(review.rating != null ? review.rating : review.nota != null ? review.nota : review.stars, 0);
      if (rating > 0) {
        totalRating += rating;
        rated++;
        if (rating <= 2) lowRatings++;
        else if (rating === 3) attentionRatings++;
      }
      if (review.productId || review.productName || review.produtoId || review.produtoNome) productMentions++;
    });
    var averageRating = rated ? Math.round((totalRating / rated) * 10) / 10 : 0;
    var trustStatus = !approved ? 'empty' : (averageRating >= 4.5 && approved >= 3 ? 'strong' : (averageRating >= 4 ? 'positive' : 'attention'));
    return {
      hasData: approved > 0,
      total: (reviews || []).length,
      approved: approved,
      averageRating: averageRating,
      productMentions: productMentions,
      lowRatings: lowRatings,
      attentionRatings: attentionRatings,
      trustStatus: trustStatus,
      confidence: approved >= 5 ? 'medium' : (approved ? 'low' : 'low')
    };
  }

  function _maturityOperationsStats(input) {
    input = input || {};
    var productionOrders = input.productionOrders || [];
    var plannedProductions = productionOrders.filter(function (item) {
      var status = _normalizeText(item && item.status);
      return status === 'planejada' || status === 'planned' || status === 'em_producao';
    }).length;
    var completedProductions = productionOrders.filter(function (item) {
      return _normalizeText(item && item.status) === 'concluida' || _normalizeText(item && item.status) === 'completed';
    }).length;
    var stockMovements = input.stockMovements || [];
    var stockEntries = stockMovements.filter(function (item) {
      var type = _normalizeText(item && (item.type || item.tipo || item.kind || ''));
      return type.indexOf('entrada') >= 0;
    }).length;
    var stockExits = stockMovements.filter(function (item) {
      var type = _normalizeText(item && (item.type || item.tipo || item.kind || ''));
      return type.indexOf('saida') >= 0 || type.indexOf('baixa') >= 0;
    }).length;
    var purchases = input.purchases || [];
    var completedPurchases = purchases.filter(function (item) {
      var status = _normalizeText(item && (item.status || item.state || ''));
      return status === 'recebida' || status === 'recebido' || status === 'concluida' || status === 'completed' || status === 'paga' || status === 'pago';
    }).length;
    var hasData = stockMovements.length > 0 || productionOrders.length > 0 || purchases.length > 0;
    var confidence = completedProductions >= 2 || stockMovements.length >= 8 || completedPurchases >= 3 ? 'medium' : (hasData ? 'low' : 'low');
    var limiterScore = 0;
    if (hasData && confidence === 'low') limiterScore += 8;
    if (productionOrders.length > 0 && !completedProductions) limiterScore += 6;
    if (purchases.length > 0 && !completedPurchases) limiterScore += 4;
    if (stockExits > stockEntries * 2 && stockEntries > 0) limiterScore += 4;
    var operationStatus = !hasData ? 'empty' : (confidence === 'medium' && completedProductions + completedPurchases > 0 ? 'supporting' : 'needs_history');
    return {
      hasData: hasData,
      stockMovements: stockMovements.length,
      stockEntries: stockEntries,
      stockExits: stockExits,
      productionOrders: productionOrders.length,
      plannedProductions: plannedProductions,
      completedProductions: completedProductions,
      purchases: purchases.length,
      completedPurchases: completedPurchases,
      operationStatus: operationStatus,
      limiterScore: Math.round(_clamp(limiterScore, 0, 20)),
      confidence: confidence
    };
  }

  function _maturityActiveRecord(item) {
    if (!item || item.active === false || item.ativo === false) return false;
    var status = _normalizeText(item.status || item.state || '');
    if (status && ['inactive', 'inativo', 'cancelado', 'expired', 'expirado'].indexOf(status) >= 0) return false;
    var start = _toDate(item.startDate || item.startsAt || item.from || item.inicio);
    var end = _toDate(item.endDate || item.endsAt || item.expiry || item.to || item.fim);
    var now = new Date();
    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  }

  function _emptyBusinessHistory() {
    return {
      calculationVersion: 'business_history_v1',
      generatedAt: null,
      availableMonths: 0,
      hasFullYear: false,
      periods: {},
      monthly: [],
      sameMonthLastYear: null,
      notes: ['Histórico ainda sem base suficiente.']
    };
  }

  function _businessHistoryContext(input, validOrders) {
    input = input || {};
    var now = new Date();
    var orders = (validOrders || []).map(_normalizeSeasonOrder).filter(_isValidSeasonOrder);
    var financeRows = _businessHistoryFinanceRows(input);
    var periods = _businessHistoryPeriods(now);
    var result = {
      calculationVersion: 'business_history_v1',
      generatedAt: now.toISOString(),
      availableMonths: 0,
      hasFullYear: false,
      periods: {},
      monthly: [],
      sameMonthLastYear: null,
      notes: []
    };

    Object.keys(periods).forEach(function (key) {
      var range = periods[key];
      result.periods[key] = _businessHistoryMetrics(range.start, range.end, orders, financeRows, input);
    });

    result.monthly = _businessHistoryMonthly(now, orders, financeRows, input);
    result.availableMonths = result.monthly.filter(function (month) {
      return _number(month.ordersCount, 0) > 0 || _number(month.revenue, 0) > 0 || _number(month.financialEntries, 0) > 0 || _number(month.financialExits, 0) > 0;
    }).length;
    result.hasFullYear = result.availableMonths >= 12;
    result.sameMonthLastYear = _businessHistorySameMonthLastYear(now, orders, financeRows, input);
    result.notes = _businessHistoryNotes(result);
    return result;
  }

  function _businessHistoryPeriods(now) {
    var end = _dayEnd(now);
    var start30 = _addDays(_dayStart(now), -29);
    var prev30End = _addDays(start30, -1);
    var prev30Start = _addDays(prev30End, -29);
    return {
      rolling_30: { start: start30, end: end },
      previous_30: { start: prev30Start, end: _dayEnd(prev30End) },
      rolling_90: { start: _addDays(_dayStart(now), -89), end: end },
      rolling_180: { start: _addDays(_dayStart(now), -179), end: end },
      rolling_365: { start: _addDays(_dayStart(now), -364), end: end }
    };
  }

  function _businessHistoryMetrics(start, end, orders, financeRows, input) {
    var periodOrders = (orders || []).filter(function (order) {
      return order.createdAt && order.createdAt >= start && order.createdAt <= end;
    });
    var periodFinance = (financeRows || []).filter(function (row) {
      return row.date && row.date >= start && row.date <= end;
    });
    var orderRevenue = periodOrders.reduce(function (sum, order) { return sum + _money(order.total); }, 0);
    var activeDays = {};
    var activeWeeks = {};
    var customers = {};
    var productMap = {};
    var channelMap = {};
    var discountTotal = 0;
    var couponOrders = 0;
    var promotionOrders = 0;
    var upsellOrders = 0;

    periodOrders.forEach(function (order) {
      var day = _dateKey(order.createdAt);
      if (day) activeDays[day] = true;
      var week = _weekKey(order.createdAt);
      if (week) activeWeeks[week] = true;
      var customer = _customerKey(order);
      if (customer) customers[customer] = (customers[customer] || 0) + 1;
      var channel = order.channel || 'desconhecido';
      if (!channelMap[channel]) channelMap[channel] = { key: channel, orders: 0, revenue: 0 };
      channelMap[channel].orders++;
      channelMap[channel].revenue += _money(order.total);
      if (order.couponCode || _money(order.couponDiscount) > 0) couponOrders++;
      if (order.promotionName || _money(order.promotionDiscount) > 0) promotionOrders++;
      if (order.upsellAccepted || _money(order.upsellAddedRevenue) > 0) upsellOrders++;
      discountTotal += _money(order.couponDiscount) + _money(order.promotionDiscount) + _money(order.upsellDiscount);
      (order.items || []).forEach(function (item) {
        var id = item.productId || item.id || item.name || item.nome || 'produto';
        var name = item.name || item.nome || item.productName || 'Produto';
        var qty = _number(item.quantity != null ? item.quantity : item.qty != null ? item.qty : item.quantidade, 1);
        var total = _money(item.total != null ? item.total : item.subtotal != null ? item.subtotal : item.price != null ? item.price * qty : 0);
        if (!productMap[id]) productMap[id] = { id: id, name: name, quantity: 0, revenue: 0 };
        productMap[id].quantity += qty;
        productMap[id].revenue += total;
      });
    });

    var entries = 0;
    var exits = 0;
    periodFinance.forEach(function (row) {
      if (row.kind === 'entrada') entries += _money(row.value);
      if (row.kind === 'saida') exits += _money(row.value);
    });
    var recurringCustomers = Object.keys(customers).filter(function (key) { return customers[key] >= 2; }).length;
    var stockMovements = (input.stockMovements || []).filter(function (item) {
      var d = _toDate(item.movementDate || item.createdAt || item.date || item.data);
      return d && d >= start && d <= end;
    }).length;
    var productionCompleted = (input.productionOrders || []).filter(function (item) {
      var status = _normalizeText(item && item.status);
      var d = _toDate(item.completedAt || item.actualDate || item.updatedAt || item.createdAt);
      return (status === 'concluida' || status === 'completed') && d && d >= start && d <= end;
    }).length;
    var reviewsApproved = (input.reviews || []).filter(function (review) {
      var status = _normalizeText(review && review.status);
      var d = _toDate(review.createdAt || review.updatedAt || review.date || review.data);
      var approved = review && (review.approved === true || status === 'approved' || status === 'aprovado');
      return approved && d && d >= start && d <= end;
    });
    var reviewRatingSum = reviewsApproved.reduce(function (sum, review) {
      return sum + _number(review.rating != null ? review.rating : review.nota != null ? review.nota : review.stars, 0);
    }, 0);

    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      revenue: Math.round(orderRevenue * 100) / 100,
      ordersCount: periodOrders.length,
      averageTicket: periodOrders.length ? Math.round((orderRevenue / periodOrders.length) * 100) / 100 : 0,
      activeDays: Object.keys(activeDays).length,
      activeWeeks: Object.keys(activeWeeks).length,
      recurringCustomers: recurringCustomers,
      repurchaseRate: Object.keys(customers).length ? Math.round((recurringCustomers / Object.keys(customers).length) * 1000) / 10 : 0,
      topProducts: _businessHistoryTopList(productMap, 'quantity', 5),
      topChannels: _businessHistoryTopList(channelMap, 'revenue', 5),
      discountTotal: Math.round(discountTotal * 100) / 100,
      couponOrders: couponOrders,
      promotionOrders: promotionOrders,
      upsellOrders: upsellOrders,
      financialEntries: Math.round(entries * 100) / 100,
      financialExits: Math.round(exits * 100) / 100,
      financialNet: Math.round((entries - exits) * 100) / 100,
      financialMarginPct: entries > 0 ? Math.round(((entries - exits) / entries) * 1000) / 10 : 0,
      reviewsAverage: reviewsApproved.length ? Math.round((reviewRatingSum / reviewsApproved.length) * 10) / 10 : 0,
      reviewsCount: reviewsApproved.length,
      productionCompleted: productionCompleted,
      stockMovements: stockMovements
    };
  }

  function _businessHistoryFinanceRows(input) {
    input = input || {};
    var movements = (input.cashMovements || []).map(function (item) { return _maturityFinanceRow(item, 'movimentacoes'); });
    return movements
      .concat((input.financeEntries || []).map(function (item) { return _maturityFinanceRow(item, 'financeiro_entradas', 'entrada'); }))
      .concat((input.financeExits || []).map(function (item) { return _maturityFinanceRow(item, 'financeiro_saidas', 'saida'); }));
  }

  function _businessHistoryMonthly(now, orders, financeRows, input) {
    var months = [];
    var cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    for (var i = 0; i < 12; i++) {
      var start = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
      var end = _dayEnd(new Date(start.getFullYear(), start.getMonth() + 1, 0));
      var metrics = _businessHistoryMetrics(start, end, orders, financeRows, input);
      metrics.monthKey = start.toISOString().slice(0, 7);
      months.push(metrics);
    }
    return months.reverse();
  }

  function _businessHistorySameMonthLastYear(now, orders, financeRows, input) {
    var start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    var end = _dayEnd(new Date(start.getFullYear(), start.getMonth() + 1, 0));
    var metrics = _businessHistoryMetrics(start, end, orders, financeRows, input);
    metrics.monthKey = start.toISOString().slice(0, 7);
    return metrics.ordersCount || metrics.revenue || metrics.financialEntries || metrics.financialExits ? metrics : null;
  }

  function _businessHistoryTopList(map, sortKey, limit) {
    return Object.keys(map || {}).map(function (key) {
      var item = map[key] || {};
      return Object.assign({}, item, {
        revenue: Math.round(_money(item.revenue) * 100) / 100,
        quantity: Math.round(_number(item.quantity, _number(item.orders, 0)) * 100) / 100
      });
    }).sort(function (a, b) {
      return _number(b[sortKey], 0) - _number(a[sortKey], 0);
    }).slice(0, limit || 5);
  }

  function _businessHistoryNotes(history) {
    history = history || {};
    var notes = [];
    if (history.hasFullYear) notes.push('Já existe base de 12 meses para comparação anual.');
    else notes.push('Histórico anual ainda em formação.');
    if (history.sameMonthLastYear) notes.push('Existe comparação com o mesmo mês do ano anterior.');
    var rolling90 = history.periods && history.periods.rolling_90 || {};
    if (_number(rolling90.ordersCount, 0) > 0) notes.push('Últimos 90 dias já podem apoiar leitura de tendência.');
    return notes;
  }

  function _maturityIndexes(seasonStats, orderStats, loyaltyStats, scenario, dataSignals, businessHistory) {
    dataSignals = dataSignals || _emptyMaturityDataSignals();
    var financeSignal = dataSignals.finance || {};
    var marketingSignal = dataSignals.marketing || {};
    var pointsSignal = dataSignals.loyaltyProgram || {};
    var reviewsSignal = dataSignals.reviews || {};
    var operationsSignal = dataSignals.operations || {};
    var successfulSeasons = _number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0));
    var historyContext = _maturityHistoricalIndexContext(businessHistory);
    var rolling30 = historyContext.rolling30;
    var previous30 = historyContext.previous30;
    var rolling90 = historyContext.rolling90;
    var currentSeasonMonth = historyContext.projectedCurrentMonth;
    var sameMonthLastYear = historyContext.sameMonthLastYear;
    var healthyGrowth = historyContext.hasSeasonality
      ? 38 + _historyComparisonScore(currentSeasonMonth.revenue, sameMonthLastYear.revenue, 24, 18) + _historyComparisonScore(currentSeasonMonth.ordersCount, sameMonthLastYear.ordersCount, 16, 12) + _historyComparisonScore(currentSeasonMonth.averageTicket, sameMonthLastYear.averageTicket, 10, 8)
      : historyContext.hasRecentComparison
      ? 34 + _historyComparisonScore(rolling30.revenue, previous30.revenue, 24, 18) + _historyComparisonScore(rolling30.ordersCount, previous30.ordersCount, 16, 12) + _historyComparisonScore(rolling30.averageTicket, previous30.averageTicket, 10, 8)
      : 0;
    if (!historyContext.hasRecentComparison && !historyContext.hasSeasonality) {
      if (orderStats.totalOrders > 0) healthyGrowth += Math.min(34, orderStats.totalOrders * 3);
      if (orderStats.revenue > 0) healthyGrowth += Math.min(18, orderStats.revenue / 120);
      if (orderStats.growthPct > 0) healthyGrowth += Math.min(18, orderStats.growthPct * 0.35);
      if (orderStats.averageTicket > 0) healthyGrowth += Math.min(14, orderStats.averageTicket / 4);
    }
    if (scenario === 'growth' || scenario === 'expansion') healthyGrowth += Math.min(6, seasonStats.avgRiskScore <= 55 ? 6 : 2);
    if (marketingSignal.actionOrders > 0 && marketingSignal.netRevenue > 0) healthyGrowth += Math.min(8, marketingSignal.actionOrders * 1.4);
    if (marketingSignal.upsellOrders > 0) healthyGrowth += Math.min(5, marketingSignal.upsellOrders * 1.2);
    if (marketingSignal.impactStatus === 'configured_only') healthyGrowth += 0;
    if (marketingSignal.impactStatus === 'heavy_discount' || (marketingSignal.discountTotal > orderStats.revenue * .25 && orderStats.revenue > 0)) healthyGrowth -= 6;

    var consistency = historyContext.hasSeasonality
      ? 30 + _historyComparisonScore(currentSeasonMonth.activeDays, sameMonthLastYear.activeDays, 18, 14) + _historyComparisonScore(currentSeasonMonth.activeWeeks, sameMonthLastYear.activeWeeks, 10, 8) + Math.min(18, _number(rolling90.activeWeeks, 0) * 3)
      : historyContext.hasTrend
      ? 28 + Math.min(24, _number(rolling90.activeDays, 0) * 1.5) + Math.min(16, _number(rolling90.activeWeeks, 0) * 3) + _historyComparisonScore(rolling30.activeDays, previous30.activeDays, 14, 12)
      : Math.min(42, orderStats.activeDays * 5) + Math.min(18, orderStats.activeWeeks * 6);
    if (historyContext.hasFullYear) consistency += 6;
    else if (historyContext.availableMonths >= 3) consistency += 3;
    if (successfulSeasons > 0) consistency += Math.min(22, successfulSeasons * 9);
    else if (seasonStats.unstable > 0) consistency += Math.min(6, seasonStats.unstable);
    if (seasonStats.avgScore > 0) consistency += Math.min(18, seasonStats.avgScore * 0.22);
    consistency += Math.min(10, seasonStats.totalImpact * 0.25);
    consistency -= seasonStats.abandoned * 10;

    var historicalFinance = historyContext.hasTrend && (_number(rolling90.financialEntries, 0) > 0 || _number(rolling90.financialExits, 0) > 0);
    var seasonalFinance = historyContext.hasSeasonality && (_number(sameMonthLastYear.financialEntries, 0) > 0 || _number(sameMonthLastYear.financialExits, 0) > 0);
    var financialHealth = seasonalFinance
      ? 44 + _historyComparisonScore(currentSeasonMonth.financialNet, sameMonthLastYear.financialNet, 16, 18) + _historyComparisonScore(currentSeasonMonth.financialEntries, sameMonthLastYear.financialEntries, 10, 8) + _clamp(_number(currentSeasonMonth.financialMarginPct, 0), -60, 60) * .22
      : historicalFinance
      ? 44 + _clamp(_number(rolling90.financialMarginPct, 0), -60, 60) * .34 + _historyComparisonScore(rolling30.financialNet, previous30.financialNet, 12, 16)
      : financeSignal.hasData
      ? 46 + (financeSignal.net >= 0 ? 12 : -12) + _clamp(financeSignal.marginPct, -60, 60) * .32
      : (orderStats.totalOrders > 0 ? 42 : 0);
    if (financeSignal.hasData && financeSignal.entries > 0 && financeSignal.exits <= financeSignal.entries) financialHealth += 6;
    if (financeSignal.hasData && financeSignal.entries <= 0 && financeSignal.exits > 0) financialHealth -= 8;
    if (!financeSignal.hasData && orderStats.averageTicket > 0) financialHealth += Math.min(18, orderStats.averageTicket / 3);
    if (financeSignal.pendingPayables > 0) financialHealth -= Math.min(12, financeSignal.pendingPayables / 90);
    if (financeSignal.overduePayables > 0) financialHealth -= Math.min(20, financeSignal.overduePayables / 55);
    if (scenario === 'survival') financialHealth += 6;
    if (scenario === 'equilibrium') financialHealth += 8;
    if ((scenario === 'growth' || scenario === 'expansion') && seasonStats.avgRiskScore > 70) financialHealth -= 12;

    var controlledRisk = seasonStats.total ? Math.max(0, 100 - seasonStats.avgRiskScore) : (orderStats.totalOrders >= 3 ? 45 : 0);
    controlledRisk += Math.min(14, successfulSeasons * 5);
    controlledRisk -= seasonStats.abandoned * 16;
    if (operationsSignal.operationStatus === 'supporting') controlledRisk += 4;
    if (operationsSignal.limiterScore > 0) controlledRisk -= Math.min(14, operationsSignal.limiterScore);

    var historicalLoyalty = historyContext.hasTrend && (_number(rolling90.recurringCustomers, 0) > 0 || _number(rolling90.repurchaseRate, 0) > 0);
    var seasonalLoyalty = historyContext.hasSeasonality && (_number(sameMonthLastYear.recurringCustomers, 0) > 0 || _number(sameMonthLastYear.repurchaseRate, 0) > 0);
    var loyalty = seasonalLoyalty
      ? Math.min(54, _number(currentSeasonMonth.repurchaseRate, 0) * .65) + Math.min(18, _number(currentSeasonMonth.recurringCustomers, 0) * 5) + _historyComparisonScore(currentSeasonMonth.recurringCustomers, sameMonthLastYear.recurringCustomers, 12, 7)
      : historicalLoyalty
      ? Math.min(58, _number(rolling90.repurchaseRate, 0) * .72) + Math.min(20, _number(rolling90.recurringCustomers, 0) * 5) + _historyComparisonScore(rolling30.recurringCustomers, previous30.recurringCustomers, 10, 6)
      : (loyaltyStats.uniqueCustomers ? Math.min(70, loyaltyStats.recurringRate * 100) : 0);
    if (!historicalLoyalty && !seasonalLoyalty) loyalty += Math.min(20, loyaltyStats.recurringCustomers * 6);
    if (loyaltyStats.uniqueCustomers >= 5 || _number(rolling90.recurringCustomers, 0) >= 3) loyalty += 8;
    if (pointsSignal.redemptionOrders > 0) loyalty += Math.min(10, pointsSignal.redemptionOrders * 2.5);
    if (pointsSignal.repeatCustomersWithPoints > 0) loyalty += Math.min(8, pointsSignal.repeatCustomersWithPoints * 4);
    if (pointsSignal.hasData && !pointsSignal.redemptionOrders) loyalty += 0;
    if (reviewsSignal.averageRating >= 4 && reviewsSignal.approved >= 2) loyalty += Math.min(8, reviewsSignal.approved * 1.5);
    if (reviewsSignal.productMentions > 0) loyalty += Math.min(4, reviewsSignal.productMentions);
    if (reviewsSignal.lowRatings > 0 || reviewsSignal.trustStatus === 'attention') loyalty -= Math.min(8, (_number(reviewsSignal.lowRatings, 0) * 2) + (reviewsSignal.trustStatus === 'attention' ? 2 : 0));

    var execution = successfulSeasons * 16 + seasonStats.totalVictories * 15 + seasonStats.partialVictories * 9 + Math.min(12, seasonStats.unstable * 3);
    if (seasonStats.avgScore > 0) execution += Math.min(25, seasonStats.avgScore * 0.28);
    execution += Math.min(24, seasonStats.totalImpact * 0.45);
    if (operationsSignal.completedProductions > 0 || operationsSignal.completedPurchases > 0) execution += Math.min(6, operationsSignal.completedProductions + operationsSignal.completedPurchases);
    if (operationsSignal.operationStatus === 'needs_history') execution -= 4;
    execution -= seasonStats.abandoned * 18;

    return {
      healthyGrowth: _maturityIndex(healthyGrowth, historyContext.hasSeasonality ? 'high' : (historyContext.hasRecentComparison ? 'medium' : (orderStats.totalOrders >= 6 ? 'medium' : 'low')), _growthNotes(orderStats, scenario, historyContext)),
      consistency: _maturityIndex(consistency, historyContext.hasSeasonality ? 'high' : (historyContext.hasTrend || orderStats.totalOrders >= 6 || seasonStats.total >= 2 ? 'medium' : 'low'), _consistencyNotes(seasonStats, orderStats, historyContext)),
      financialHealth: _maturityIndex(financialHealth, seasonalFinance ? 'high' : (historicalFinance || financeSignal.hasData ? 'medium' : (orderStats.totalOrders ? 'low' : 'low')), _financialNotes(orderStats, financeSignal, historyContext)),
      controlledRisk: _maturityIndex(controlledRisk, seasonStats.total ? 'medium' : 'low', _riskNotes(seasonStats, operationsSignal)),
      loyalty: _maturityIndex(loyalty, seasonalLoyalty ? 'high' : (historicalLoyalty || loyaltyStats.uniqueCustomers >= 5 || pointsSignal.hasData || reviewsSignal.hasData ? 'medium' : 'low'), _loyaltyNotes(loyaltyStats, pointsSignal, reviewsSignal, historyContext)),
      execution: _maturityIndex(execution, seasonStats.total ? 'high' : 'low', _executionNotes(seasonStats, operationsSignal))
    };
  }

  function _maturityHistoricalIndexContext(history) {
    history = history || _emptyBusinessHistory();
    var periods = history.periods || {};
    var rolling30 = periods.rolling_30 || {};
    var previous30 = periods.previous_30 || {};
    var rolling90 = periods.rolling_90 || {};
    var currentMonth = _businessHistoryCurrentMonth(history);
    var sameMonthLastYear = history.sameMonthLastYear || {};
    var monthProgress = _currentMonthProgressRatio();
    var projectedCurrentMonth = _projectBusinessHistoryMonth(currentMonth, monthProgress);
    var hasRecent = _number(rolling30.ordersCount, 0) > 0 || _number(rolling30.revenue, 0) > 0;
    var hasPrevious = _number(previous30.ordersCount, 0) > 0 || _number(previous30.revenue, 0) > 0;
    var hasTrend = _number(rolling90.ordersCount, 0) > 0 || _number(rolling90.revenue, 0) > 0 || _number(rolling90.financialEntries, 0) > 0 || _number(rolling90.financialExits, 0) > 0;
    var hasSameMonthLastYear = _number(sameMonthLastYear.ordersCount, 0) > 0 || _number(sameMonthLastYear.revenue, 0) > 0 || _number(sameMonthLastYear.financialEntries, 0) > 0 || _number(sameMonthLastYear.financialExits, 0) > 0;
    var completedMonths = _businessHistoryCompletedMonths(history);
    return {
      rolling30: rolling30,
      previous30: previous30,
      rolling90: rolling90,
      rolling365: periods.rolling_365 || {},
      currentMonth: currentMonth,
      projectedCurrentMonth: projectedCurrentMonth,
      sameMonthLastYear: sameMonthLastYear,
      monthProgress: monthProgress,
      availableMonths: _number(history.availableMonths, 0),
      completedMonths: completedMonths,
      hasFullYear: !!history.hasFullYear,
      hasSameMonthLastYear: hasSameMonthLastYear,
      hasSeasonality: completedMonths >= 12 && hasSameMonthLastYear,
      hasRecent: hasRecent,
      hasPrevious: hasPrevious,
      hasRecentComparison: hasRecent && hasPrevious,
      hasTrend: hasTrend
    };
  }

  function _businessHistoryCurrentMonth(history) {
    var monthKey = _maturityMonthKey();
    var list = history && history.monthly || [];
    return list.filter(function (month) {
      return month && month.monthKey === monthKey;
    })[0] || list[list.length - 1] || {};
  }

  function _businessHistoryCompletedMonths(history) {
    var currentKey = _maturityMonthKey();
    var count = (history && history.monthly || []).filter(function (month) {
      if (!month || !month.monthKey || month.monthKey >= currentKey) return false;
      return _number(month.ordersCount, 0) > 0 || _number(month.revenue, 0) > 0 || _number(month.financialEntries, 0) > 0 || _number(month.financialExits, 0) > 0;
    }).length;
    var same = history && history.sameMonthLastYear;
    if (same && (_number(same.ordersCount, 0) > 0 || _number(same.revenue, 0) > 0 || _number(same.financialEntries, 0) > 0 || _number(same.financialExits, 0) > 0)) count++;
    return count;
  }

  function _currentMonthProgressRatio() {
    var now = new Date();
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return _clamp(now.getDate() / Math.max(daysInMonth, 1), 0.05, 1);
  }

  function _projectBusinessHistoryMonth(month, progress) {
    month = month || {};
    progress = _clamp(_number(progress, 1), 0.05, 1);
    var projected = Object.assign({}, month);
    ['revenue', 'ordersCount', 'activeDays', 'activeWeeks', 'recurringCustomers', 'financialEntries', 'financialExits', 'financialNet', 'discountTotal', 'couponOrders', 'promotionOrders', 'upsellOrders', 'productionCompleted', 'stockMovements'].forEach(function (key) {
      projected[key] = Math.round((_number(month[key], 0) / progress) * 100) / 100;
    });
    projected.activeDays = Math.min(projected.activeDays, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate());
    projected.activeWeeks = Math.min(projected.activeWeeks, 6);
    projected.averageTicket = _number(month.ordersCount, 0) ? _number(month.revenue, 0) / Math.max(_number(month.ordersCount, 0), 1) : _number(month.averageTicket, 0);
    projected.repurchaseRate = _number(month.repurchaseRate, 0);
    projected.financialMarginPct = _number(projected.financialEntries, 0) > 0 ? Math.round(((_number(projected.financialNet, 0) / _number(projected.financialEntries, 1)) * 100) * 10) / 10 : _number(month.financialMarginPct, 0);
    return projected;
  }

  function _historyComparisonScore(current, previous, maxBonus, maxPenalty) {
    current = _number(current, 0);
    previous = _number(previous, 0);
    maxBonus = _number(maxBonus, 0);
    maxPenalty = _number(maxPenalty, 0);
    if (!previous && current > 0) return Math.min(maxBonus * .45, maxBonus);
    if (!previous) return 0;
    var pct = ((current - previous) / Math.max(Math.abs(previous), 1)) * 100;
    return _clamp(pct * .28, -maxPenalty, maxBonus);
  }

  function _maturityIndex(score, confidence, notes) {
    return {
      score: Math.round(_clamp(score, 0, 100)),
      confidence: confidence || 'low',
      notes: notes || []
    };
  }

  function _maturityScore(indexes) {
    return (
      indexes.healthyGrowth.score * 0.20 +
      indexes.consistency.score * 0.25 +
      indexes.financialHealth.score * 0.20 +
      indexes.controlledRisk.score * 0.15 +
      indexes.loyalty.score * 0.10 +
      indexes.execution.score * 0.10
    );
  }

  function _maturitySeasonStats(seasons) {
    var closed = (seasons || []).filter(function (season) {
      return season && (season.status === 'finished' || season.status === 'abandoned');
    });
    var finished = 0;
    var finishedWithResult = 0;
    var abandoned = 0;
    var totalVictories = 0;
    var partialVictories = 0;
    var unstable = 0;
    var failed = 0;
    var scoreSum = 0;
    var scoreCount = 0;
    var riskSum = 0;
    var riskCount = 0;
    var totalImpact = 0;
    var impacts = [];

    closed.forEach(function (season) {
      if (!season) return;
      if (season.status === 'finished') finished++;
      if (season.status === 'abandoned') abandoned++;
      if (season.status === 'finished' && _seasonHasBusinessResult(season.finalResult)) finishedWithResult++;
      if (season.finalResult === 'Vitória Total') totalVictories++;
      if (season.finalResult === 'Vitória Parcial') partialVictories++;
      if (season.finalResult === 'Temporada Instável') unstable++;
      if (season.finalResult === 'Falha Operacional') failed++;
      var score = _number(season.finalScore, _number(season.currentScore, null));
      if (score !== null && isFinite(score) && score > 0) {
        scoreSum += score;
        scoreCount++;
      }
      if (season.riskLevel || season.initialRiskLevel) {
        riskSum += _riskScore(season.riskLevel || season.initialRiskLevel);
        riskCount++;
      }
      var impact = _seasonMaturityImpact(season);
      totalImpact += impact.impactPercent;
      impacts.push(impact);
    });
    impacts.sort(function (a, b) {
      return _dateValue(b.seasonDate || '') - _dateValue(a.seasonDate || '');
    });

    return {
      total: closed.length,
      finished: finished,
      finishedWithResult: finishedWithResult,
      successfulSeasons: totalVictories + partialVictories,
      abandoned: abandoned,
      totalVictories: totalVictories,
      partialVictories: partialVictories,
      unstable: unstable,
      failed: failed,
      avgScore: scoreCount ? scoreSum / scoreCount : 0,
      avgRiskScore: riskCount ? riskSum / riskCount : 55,
      totalImpact: _clamp(totalImpact, 0, 42),
      lastImpact: impacts[0] || _emptySeasonImpact(),
      impacts: impacts,
      summary: {
        closedSeasons: closed.length,
        finished: finished,
        finishedWithResult: finishedWithResult,
        successfulSeasons: totalVictories + partialVictories,
        abandoned: abandoned,
        totalVictories: totalVictories,
        partialVictories: partialVictories,
        unstable: unstable,
        failed: failed,
        totalImpactPercent: Math.round(_clamp(totalImpact, 0, 42)),
        averageScore: scoreCount ? Math.round(scoreSum / scoreCount) : 0,
        averageRiskScore: riskCount ? Math.round(riskSum / riskCount) : 55
      }
    };
  }

  function _seasonHasBusinessResult(result) {
    return ['Vitória Total', 'Vitória Parcial'].indexOf(result || '') >= 0;
  }

  function _seasonMaturityImpact(season) {
    season = season || {};
    var result = season.status === 'abandoned' ? 'Abandono' : (season.finalResult || 'Resultado não calculado');
    var score = _number(season.finalScore, _number(season.currentScore, 0));
    var risk = season.riskLevel || season.initialRiskLevel || 'unknown';
    var difficulty = season.difficulty || season.targetDifficulty || 'balanced';
    var impact = 0;
    var reasons = [];
    var limiters = [];
    var hasBusinessResult = _seasonHasBusinessResult(result);

    if (result === 'Vitória Total') {
      impact += 13;
      reasons.push('Vitória Total fortaleceu a execução.');
    } else if (result === 'Vitória Parcial') {
      impact += 8;
      reasons.push('Vitória Parcial gerou avanço moderado.');
    } else if (result === 'Temporada Instável') {
      impact += 3;
      reasons.push('Houve avanço, mas com instabilidade.');
    } else if (result === 'Falha Operacional') {
      limiters.push('Falha Operacional não avança a Pedra porque ainda não mostrou resultado real do negócio.');
    } else if (result === 'Abandono') {
      impact -= 7;
      limiters.push('Temporada abandonada limita a evolução.');
    }

    if (result === 'Temporada Instável') {
      limiters.push('Temporada instável trouxe aprendizado, mas ainda não conta como vitória.');
    } else if (!hasBusinessResult && result !== 'Abandono' && result !== 'Falha Operacional') {
      limiters.push('Temporada finalizada sem resultado claro não acelera a Pedra.');
    }

    if (hasBusinessResult && score >= 85) {
      impact += 5;
      reasons.push('Score final alto aumentou a qualidade do avanço.');
    } else if (hasBusinessResult && score >= 65) {
      impact += 3;
      reasons.push('Score final saudável contribuiu para maturidade.');
    } else if (score > 0 && score < 40) {
      impact -= 3;
      limiters.push('Score final baixo reduziu o impacto.');
    }

    if (hasBusinessResult && risk === 'low') {
      impact += 3;
      reasons.push('Risco baixo deixou o avanço mais saudável.');
    } else if (hasBusinessResult && risk === 'medium') {
      impact += 1;
      reasons.push('Risco médio manteve o avanço controlado.');
    } else if (risk === 'high' || risk === 'very_high') {
      impact -= risk === 'very_high' ? 7 : 5;
      limiters.push('Chance de falha elevada limitou o avanço.');
    }

    if (hasBusinessResult && difficulty === 'aggressive') {
      if (risk === 'low' || risk === 'medium') {
        impact += 4;
        reasons.push('Dificuldade agressiva bem controlada aumentou a contribuição.');
      } else {
        limiters.push('Dificuldade agressiva com risco alto não acelera a Pedra.');
      }
    } else if (hasBusinessResult && difficulty === 'balanced') {
      impact += 2;
    } else if (hasBusinessResult && difficulty === 'safe') {
      impact += 1;
    }

    impact = _clamp(Math.round(impact), -8, 22);
    var reason = _seasonImpactReason(result, difficulty, risk, impact, reasons, limiters);
    return {
      seasonId: season.id || '',
      seasonTitle: season.title || '',
      seasonDate: season.finishedAt || season.abandonedAt || season.updatedAt || season.endDate || season.createdAt || '',
      finalResult: result,
      finalScore: Math.round(score || 0),
      riskLevel: risk,
      difficulty: difficulty,
      impactPercent: impact,
      reason: reason,
      limiters: limiters,
      positives: reasons
    };
  }

  function _seasonImpactReason(result, difficulty, risk, impact, reasons, limiters) {
    if (result === 'Abandono') return 'Esta temporada limitou sua evolução porque foi abandonada antes de consolidar resultado.';
    if (result === 'Falha Operacional') return 'Esta temporada não avançou sua Pedra porque terminou sem resultado real suficiente.';
    if (!_seasonHasBusinessResult(result)) return 'Esta temporada foi encerrada, mas ainda não trouxe resultado claro para acelerar a Pedra.';
    if (result === 'Vitória Total' && difficulty === 'aggressive' && (risk === 'high' || risk === 'very_high')) {
      return 'Vitória Total em dificuldade agressiva aumentou seu progresso, mas o avanço foi limitado por chance de falha elevada.';
    }
    if (impact >= 15) return 'Esta temporada fortaleceu sua evolução porque foi concluída com boa consistência.';
    if (impact >= 7) return 'Esta temporada contribuiu de forma moderada para sua Pedra.';
    if (impact > 0) return 'Esta temporada avançou pouco sua Pedra porque ainda houve instabilidade ou risco relevante.';
    if (limiters.length) return limiters[0];
    return reasons[0] || 'Impacto calculado a partir do resultado final, score, risco e dificuldade.';
  }

  function _emptySeasonImpact() {
    return {
      seasonId: '',
      seasonTitle: '',
      seasonDate: '',
      finalResult: '',
      finalScore: 0,
      riskLevel: 'unknown',
      difficulty: '',
      impactPercent: 0,
      reason: 'Nenhuma temporada finalizada analisada ainda.',
      limiters: [],
      positives: []
    };
  }

  function _emptySeasonContributionSummary() {
    return {
      closedSeasons: 0,
      finished: 0,
      abandoned: 0,
      successfulSeasons: 0,
      totalVictories: 0,
      partialVictories: 0,
      unstable: 0,
      failed: 0,
      totalImpactPercent: 0,
      averageScore: 0,
      averageRiskScore: 55
    };
  }

  function _maturityOrderStats(orders) {
    var now = new Date();
    var currentStart = new Date(now.getTime() - 30 * 86400000);
    var previousStart = new Date(now.getTime() - 60 * 86400000);
    var revenue = 0;
    var currentRevenue = 0;
    var previousRevenue = 0;
    var currentOrders = 0;
    var previousOrders = 0;
    var days = {};
    var weeks = {};

    (orders || []).forEach(function (order) {
      var value = _maturityOrderValue(order);
      var date = _maturityOrderDate(order);
      revenue += value;
      if (date) {
        days[_dateKey(date)] = true;
        weeks[_weekKey(date)] = true;
        if (date >= currentStart) {
          currentRevenue += value;
          currentOrders++;
        } else if (date >= previousStart) {
          previousRevenue += value;
          previousOrders++;
        }
      }
    });

    var growthPct = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : (currentRevenue > 0 ? 8 : 0);
    var currentAverageTicket = currentOrders ? currentRevenue / currentOrders : 0;
    var previousAverageTicket = previousOrders ? previousRevenue / previousOrders : 0;
    return {
      totalOrders: (orders || []).length,
      revenue: revenue,
      averageTicket: orders.length ? revenue / orders.length : 0,
      activeDays: Object.keys(days).length,
      activeWeeks: Object.keys(weeks).length,
      currentRevenue: currentRevenue,
      previousRevenue: previousRevenue,
      currentOrders: currentOrders,
      previousOrders: previousOrders,
      currentAverageTicket: currentAverageTicket,
      previousAverageTicket: previousAverageTicket,
      growthPct: growthPct
    };
  }

  function _maturityLoyaltyStats(orders, customers) {
    var map = {};
    (orders || []).forEach(function (order) {
      var key = String(order.customerId || order.clientId || order.customerPhone || order.phone || order.customerEmail || order.email || order.customerName || order.name || '').trim().toLowerCase();
      if (!key) key = 'order:' + (order.id || Math.random());
      map[key] = (map[key] || 0) + 1;
    });
    (customers || []).forEach(function (customer) {
      var key = String(customer.id || customer.phone || customer.email || customer.name || '').trim().toLowerCase();
      if (!key || map[key]) return;
      map[key] = _number(customer.ordersCount, _number(customer.totalOrders, 0));
    });
    var keys = Object.keys(map);
    var recurring = keys.filter(function (key) { return map[key] >= 2; }).length;
    return {
      uniqueCustomers: keys.length,
      recurringCustomers: recurring,
      recurringRate: keys.length ? recurring / keys.length : 0
    };
  }

  function _maturityScenario(monthScenario, flightPlans, monthKey) {
    var direct = monthScenario && (monthScenario.scenario || monthScenario.selectedScenario);
    if (direct) return String(direct).toLowerCase();
    var plans = (flightPlans || []).filter(function (plan) {
      return _isUsableFlightPlanForMonth(plan, monthKey);
    }).sort(function (a, b) {
      return _dateValue(b.updatedAt || b.createdAt || b.periodStart) - _dateValue(a.updatedAt || a.createdAt || a.periodStart);
    });
    return plans[0] && plans[0].scenario ? String(plans[0].scenario).toLowerCase() : '';
  }

  function _isDraftFlightPlan(plan) {
    if (!plan) return true;
    return !!(plan.savedForLater || plan.activationStatus === 'saved_for_later' || plan.routeStatus === 'draft');
  }

  function _isActivatedFlightPlan(plan) {
    if (!plan || _isDraftFlightPlan(plan)) return false;
    return plan.activationStatus === 'activated' || plan.routeStatus === 'active_candidate' || plan.routeStatus === 'active' || plan.active === true;
  }

  function _flightPlanMatchesMonth(plan, monthKey) {
    if (!plan || !monthKey) return false;
    var targetMonthKey = String(plan.targetMonthKey || '').trim();
    if (targetMonthKey) return targetMonthKey === String(monthKey || '');
    var start = _toDate(plan.periodStart || plan.routePeriodStart || '');
    var end = _toDate(plan.periodEnd || plan.routePeriodEnd || '');
    if (!start || !end) return false;
    var monthStart = _monthStartFromKey(monthKey);
    var monthEnd = _monthEndFromKey(monthKey);
    if (!monthStart || !monthEnd) return false;
    return start <= monthEnd && end >= monthStart;
  }

  function _isUsableFlightPlanForMonth(plan, monthKey) {
    return !!(plan && plan.summary && _isActivatedFlightPlan(plan) && _flightPlanMatchesMonth(plan, monthKey));
  }

  function _monthStartFromKey(monthKey) {
    var parts = String(monthKey || '').split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    if (!year || !month) return null;
    return new Date(year, month - 1, 1, 0, 0, 0, 0);
  }

  function _monthEndFromKey(monthKey) {
    var start = _monthStartFromKey(monthKey);
    if (!start) return null;
    return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  function _maturityValidOrders(orders) {
    return (orders || []).filter(function (order) {
      var normalized = _normalizeSeasonOrder(order);
      if (!normalized) return false;
      if (normalized.status === 'canceled') return false;
      return normalized.total >= 0;
    });
  }

  function _maturityOrderValue(order) {
    var normalized = _normalizeSeasonOrder(order);
    return normalized ? normalized.total : 0;
  }

  function _maturityOrderDate(order) {
    var normalized = _normalizeSeasonOrder(order);
    return normalized ? normalized.createdAt : null;
  }

  function _maturityStrengths(seasonStats, orderStats, loyaltyStats, indexes, scenario, dataSignals) {
    dataSignals = dataSignals || _emptyMaturityDataSignals();
    var list = [];
    if (seasonStats.totalVictories > 0 || seasonStats.partialVictories > 0) list.push('Temporadas com vitória mostram que o negócio já conseguiu transformar foco em resultado.');
    if (seasonStats.totalVictories > 0 || seasonStats.partialVictories > 0) list.push('Há vitórias totais ou parciais em temporadas.');
    if (orderStats.activeDays >= 4) list.push('O negócio vendeu em mais dias, sinal de consistência.');
    if (loyaltyStats.recurringCustomers > 0) list.push('Já existem sinais básicos de recorrência de clientes.');
    if (indexes.controlledRisk.score >= 60) list.push('O risco operacional está mais controlado.');
    if (dataSignals.finance && dataSignals.finance.hasData && dataSignals.finance.net >= 0) list.push('O financeiro já mostra saldo positivo no período recente.');
    if (dataSignals.marketing && dataSignals.marketing.actionOrders > 0 && dataSignals.marketing.netRevenue > 0) list.push('Ações de venda apareceram em pedidos reais e geraram venda líquida.');
    if (dataSignals.marketing && dataSignals.marketing.upsellOrders > 0) list.push('Upsell aceito em pedidos reais ajuda a leitura comercial.');
    if (dataSignals.loyaltyProgram && dataSignals.loyaltyProgram.redemptionOrders > 0) list.push('Pontos usados em pedidos reais reforçam fidelização.');
    if (dataSignals.reviews && dataSignals.reviews.averageRating >= 4) list.push('Avaliações aprovadas reforçam confiança no negócio.');
    if (dataSignals.operations && dataSignals.operations.operationStatus === 'supporting') list.push('Produção, compras ou estoque já aparecem como apoio operacional.');
    if (scenario === 'survival') list.push('Meta Survival conta como construção válida nesta fase.');
    if (!list.length) list.push('Começo da organização do negócio registrado.');
    return list;
  }

  function _maturityWeaknesses(seasonStats, orderStats, loyaltyStats, indexes, scenario, dataSignals) {
    dataSignals = dataSignals || _emptyMaturityDataSignals();
    var list = [];
    if (!seasonStats.totalVictories && !seasonStats.partialVictories) list.push('Ainda falta uma temporada com vitória para confirmar avanço real.');
    if (seasonStats.unstable > 0) list.push('Temporadas instáveis mostram tentativa e aprendizado, mas ainda não contam como vitória.');
    if (seasonStats.failed > 0) list.push('Falha operacional quase não contribui para a evolução da Pedra.');
    if (seasonStats.abandoned > 0) list.push('Temporadas abandonadas reduzem a velocidade de evolução.');
    if (seasonStats.avgRiskScore >= 70) list.push('Risco alto recorrente limita o avanço.');
    if (orderStats.activeDays < 3) list.push('Poucos dias com venda limitam a leitura de consistência.');
    if (!loyaltyStats.recurringCustomers) list.push('Baixa recorrência ainda limita a maturidade.');
    if (dataSignals.loyaltyProgram && dataSignals.loyaltyProgram.hasData && !dataSignals.loyaltyProgram.redemptionOrders) list.push('Pontos gerados sem resgate ainda são só sinal inicial de fidelização.');
    if (dataSignals.reviews && (dataSignals.reviews.lowRatings > 0 || dataSignals.reviews.trustStatus === 'attention')) list.push('Algumas avaliações mostram que a experiência ainda precisa melhorar para virar confiança forte.');
    if (indexes.financialHealth.confidence === 'low') list.push('Saúde financeira ainda tem leitura básica nesta fase.');
    if (dataSignals.finance && dataSignals.finance.overduePayables > 0) list.push('Contas vencidas aparecem como ponto de atenção financeiro.');
    if (dataSignals.marketing && dataSignals.marketing.impactStatus === 'configured_only') list.push('Há ações de venda cadastradas, mas ainda sem pedido real ligado a elas.');
    if (dataSignals.marketing && (dataSignals.marketing.impactStatus === 'heavy_discount' || (dataSignals.marketing.discountTotal > orderStats.revenue * .25 && orderStats.revenue > 0))) list.push('Descontos altos podem estar pesando no crescimento saudável.');
    if (dataSignals.operations && dataSignals.operations.hasData && dataSignals.operations.operationStatus === 'needs_history') list.push('Estoque, compras ou produção ainda têm pouco histórico para sustentar a evolução.');
    return list;
  }

  function _growthNotes(orderStats, scenario, historyContext) {
    historyContext = historyContext || {};
    var notes = [];
    if (historyContext.hasSeasonality) {
      notes.push('A leitura compara o mês atual com o mesmo mês do ano anterior.');
      notes.push('Mês atual projetado: ' + _fmtMoney(historyContext.projectedCurrentMonth && historyContext.projectedCurrentMonth.revenue || 0) + '; mesmo mês anterior: ' + _fmtMoney(historyContext.sameMonthLastYear && historyContext.sameMonthLastYear.revenue || 0) + '.');
    } else if (historyContext.hasRecentComparison) {
      notes.push('A leitura compara os últimos 30 dias com os 30 dias anteriores.');
      notes.push('Últimos 30 dias: ' + _fmtMoney(historyContext.rolling30 && historyContext.rolling30.revenue || 0) + ' em ' + _number(historyContext.rolling30 && historyContext.rolling30.ordersCount, 0) + ' pedido(s).');
    }
    if (orderStats.totalOrders) notes.push(orderStats.totalOrders + ' pedido(s) válidos analisados.');
    if (orderStats.growthPct > 0) notes.push('Receita recente acima do período anterior.');
    if (scenario) notes.push('Cenário do Plano de Voo usado como contexto: ' + scenario + '.');
    if (!notes.length) notes.push('Ainda há poucos pedidos para medir crescimento.');
    return notes;
  }

  function _marketingNotes(marketingStats) {
    marketingStats = marketingStats || {};
    if (!marketingStats.hasData) return ['Sem ação de venda com resultado real ainda.'];
    var notes = [];
    if (marketingStats.actionOrders > 0) {
      notes.push(marketingStats.actionOrders + ' pedido(s) tiveram cupom, promoção ou upsell.');
      notes.push('Venda líquida dessas ações: ' + _fmtMoney(marketingStats.netRevenue) + '.');
      if (marketingStats.discountRate > 0) notes.push('Desconto médio sobre essas vendas: ' + _number(marketingStats.discountRate, 0).toFixed(1).replace('.', ',') + '%.');
      if (marketingStats.impactStatus === 'heavy_discount') notes.push('O desconto ficou alto para o volume gerado.');
      return notes;
    }
    notes.push('Existem ações cadastradas, mas nenhuma apareceu em pedido válido ainda.');
    notes.push('Cadastro sozinho não melhora a Pedra.');
    return notes;
  }

  function _consistencyNotes(seasonStats, orderStats, historyContext) {
    historyContext = historyContext || {};
    var notes = [];
    if (historyContext.hasSeasonality) {
      notes.push('Com 12 meses completos, a consistência compara este mês com o mesmo mês do ano anterior.');
      notes.push('Projeção do mês atual: ' + _number(historyContext.projectedCurrentMonth && historyContext.projectedCurrentMonth.activeDays, 0).toFixed(0) + ' dia(s) com venda.');
    } else if (historyContext.hasTrend) {
      notes.push('A consistência usa a tendência dos últimos 90 dias como base principal.');
      notes.push(_number(historyContext.rolling90 && historyContext.rolling90.activeDays, 0) + ' dia(s) com venda nos últimos 90 dias.');
    }
    if (historyContext.hasFullYear) notes.push('Já existe memória anual para dar mais segurança à leitura.');
    if (orderStats.activeDays) notes.push(orderStats.activeDays + ' dia(s) com venda detectados.');
    if (seasonStats.finished) notes.push(seasonStats.finished + ' temporada(s) concluída(s).');
    if (seasonStats.abandoned) notes.push(seasonStats.abandoned + ' temporada(s) abandonada(s) reduziram o índice.');
    if (!notes.length) notes.push('Sem histórico suficiente para medir consistência.');
    return notes;
  }

  function _riskNotes(seasonStats, operationsSignal) {
    operationsSignal = operationsSignal || {};
    if (!seasonStats.total) {
      var initial = ['Sem temporadas suficientes para medir risco com confiança.'];
      if (operationsSignal.operationStatus === 'needs_history') initial.push('Operação já tem dados, mas ainda precisa de histórico para reduzir risco.');
      return initial;
    }
    var notes = ['Risco médio calculado a partir das temporadas disponíveis.'];
    if (operationsSignal.operationStatus === 'supporting') notes.push('Produção, compras ou estoque ajudam a sustentar a operação.');
    if (operationsSignal.limiterScore > 0) notes.push('Histórico operacional ainda limita a redução de risco.');
    return notes;
  }

  function _financialNotes(orderStats, financeStats, historyContext) {
    financeStats = financeStats || {};
    historyContext = historyContext || {};
    var rolling90 = historyContext.rolling90 || {};
    if (historyContext.hasSeasonality && (_number(historyContext.sameMonthLastYear && historyContext.sameMonthLastYear.financialEntries, 0) > 0 || _number(historyContext.sameMonthLastYear && historyContext.sameMonthLastYear.financialExits, 0) > 0)) {
      var seasonalNotes = ['Com 12 meses completos, o financeiro compara o mês atual com o mesmo mês do ano anterior.'];
      seasonalNotes.push('Mês atual projetado: entrou ' + _fmtMoney(historyContext.projectedCurrentMonth && historyContext.projectedCurrentMonth.financialEntries || 0) + ' e saiu ' + _fmtMoney(historyContext.projectedCurrentMonth && historyContext.projectedCurrentMonth.financialExits || 0) + '.');
      if (financeStats.overduePayables > 0) seasonalNotes.push('Contas vencidas continuam segurando a evolução.');
      return seasonalNotes;
    }
    if (historyContext.hasTrend && (_number(rolling90.financialEntries, 0) > 0 || _number(rolling90.financialExits, 0) > 0)) {
      var historyNotes = ['A leitura financeira usa o movimento dos últimos 90 dias quando há histórico suficiente.'];
      historyNotes.push('Entrou ' + _fmtMoney(rolling90.financialEntries || 0) + ' e saiu ' + _fmtMoney(rolling90.financialExits || 0) + ' nesse período.');
      if (_number(rolling90.financialMarginPct, 0)) historyNotes.push('Margem aproximada no período: ' + _number(rolling90.financialMarginPct, 0).toFixed(1).replace('.', ',') + '%.');
      if (financeStats.overduePayables > 0) historyNotes.push('Contas vencidas continuam segurando a evolução.');
      return historyNotes;
    }
    if (financeStats.hasData) {
      var notes = ['A leitura financeira considera dinheiro recebido, dinheiro pago e contas em aberto.'];
      if (financeStats.net >= 0) notes.push('Nos últimos lançamentos, entrou mais dinheiro do que saiu.');
      else notes.push('Nos últimos lançamentos, saiu mais dinheiro do que entrou.');
      if (financeStats.marginPct) notes.push('Margem recente aproximada: ' + _number(financeStats.marginPct, 0).toFixed(1).replace('.', ',') + '%.');
      if (financeStats.overduePayables > 0) notes.push('Existem contas vencidas que seguram a evolução.');
      else if (financeStats.pendingPayables > 0) notes.push('Há contas em aberto para acompanhar.');
      return notes;
    }
    if (orderStats.totalOrders) return ['Sem financeiro suficiente; pedidos e ticket continuam como sinal leve.'];
    return ['Sem dados financeiros suficientes para medir saúde financeira.'];
  }

  function _loyaltyNotes(loyaltyStats, pointsSignal, reviewsSignal, historyContext) {
    historyContext = historyContext || {};
    var notes = [];
    var rolling90 = historyContext.rolling90 || {};
    if (historyContext.hasSeasonality && (_number(historyContext.sameMonthLastYear && historyContext.sameMonthLastYear.recurringCustomers, 0) > 0 || _number(historyContext.sameMonthLastYear && historyContext.sameMonthLastYear.repurchaseRate, 0) > 0)) {
      notes.push('A fidelização compara recompra deste mês com o mesmo mês do ano anterior.');
      notes.push('Projeção atual: ' + _number(historyContext.projectedCurrentMonth && historyContext.projectedCurrentMonth.recurringCustomers, 0).toFixed(0) + ' cliente(s) recorrente(s).');
    } else if (historyContext.hasTrend && (_number(rolling90.recurringCustomers, 0) > 0 || _number(rolling90.repurchaseRate, 0) > 0)) {
      notes.push('A fidelização olha a recompra observada nos últimos 90 dias.');
      notes.push(_number(rolling90.recurringCustomers, 0) + ' cliente(s) recorrente(s), com recompra de ' + _number(rolling90.repurchaseRate, 0).toFixed(1).replace('.', ',') + '%.');
    }
    if (loyaltyStats.uniqueCustomers) notes.push(loyaltyStats.recurringCustomers + ' cliente(s) recorrente(s) entre ' + loyaltyStats.uniqueCustomers + ' identificado(s).');
    else notes.push('Sem clientes suficientes para medir recorrência.');
    if (pointsSignal && pointsSignal.redemptionOrders > 0) notes.push('Pontos foram usados em ' + pointsSignal.redemptionOrders + ' pedido(s) real(is).');
    else if (pointsSignal && pointsSignal.hasData) notes.push('Pontos foram gerados, mas ainda falta resgate em recompra.');
    if (reviewsSignal && reviewsSignal.approved > 0) notes.push(reviewsSignal.approved + ' avaliação(ões) aprovada(s), nota média ' + _number(reviewsSignal.averageRating, 0).toFixed(1).replace('.', ',') + '.');
    if (reviewsSignal && reviewsSignal.productMentions > 0) notes.push('Há avaliação citando produto, o que ajuda a entender confiança e desejo.');
    return notes;
  }

  function _executionNotes(seasonStats, operationsSignal) {
    operationsSignal = operationsSignal || {};
    var notes = [];
    if (!seasonStats.total) notes.push('Sem temporadas para medir execução.');
    else notes.push(seasonStats.finished + ' concluída(s), ' + seasonStats.abandoned + ' abandonada(s).');
    if (operationsSignal.completedProductions > 0) notes.push(operationsSignal.completedProductions + ' produção(ões) concluída(s) entram como apoio.');
    if (operationsSignal.completedPurchases > 0) notes.push(operationsSignal.completedPurchases + ' compra(s) recebida(s) entram como apoio.');
    if (operationsSignal.operationStatus === 'needs_history') notes.push('Operação cadastrada ainda precisa virar rotina consistente.');
    return notes;
  }

  function _stoneUpgradeDecision(existing, ctx) {
    existing = existing || {};
    ctx = ctx || {};
    var currentStone = ctx.currentStone || 'Pedra Bruta';
    var nextStone = ctx.nextStone || _nextStone(currentStone);
    var progress = _clamp(_number(ctx.progress, 0), 0, 100);
    var blockers = ctx.blockers || [];
    var signature = ctx.signature || '';
    var reason = _stoneUpgradeReason(ctx);
    var blocked = blockers.some(function (blocker) {
      return blocker && blocker.effect === 'block_upgrade';
    });
    var alreadyUsedSignature = signature && existing.lastUpgradeSignature === signature;
    if (currentStone === nextStone || progress < 100 || blocked || alreadyUsedSignature) {
      return {
        upgraded: false,
        currentStone: currentStone,
        nextStone: nextStone,
        progress: alreadyUsedSignature ? _clamp(_number(existing.stoneProgressPercent, 0), 0, 100) : progress,
        reason: blocked ? _blockerReason(blockers) : ''
      };
    }

    var targetStone = nextStone;
    return {
      upgraded: true,
      currentStone: targetStone,
      nextStone: _nextStone(targetStone),
      progress: 0,
      fromStone: currentStone,
      toStone: targetStone,
      reason: reason,
      lastUpgradeSignature: signature,
      event: {
        fromStone: currentStone,
        toStone: targetStone,
        previousProgress: _clamp(_number(ctx.previousProgress, 0), 0, 100),
        newProgress: 0,
        maturityScore: Math.round(_number(ctx.maturityScore, 0)),
        reason: reason,
        indicatorsUsed: _stoneUpgradeIndicators(ctx),
        snapshotId: '',
        calculationSignature: signature
      }
    };
  }

  function _stoneUpgradeBlockers(seasonStats, orderStats, indexes, checklist, hasEnoughData) {
    var blockers = [];
    if (!hasEnoughData) {
      blockers.push(_stoneBlocker('insufficient_data', 'Dados insuficientes para subir Pedra.', 'data', 'block_upgrade'));
    }
    if (seasonStats.abandoned >= 2) {
      blockers.push(_stoneBlocker('recurring_abandonment', 'Abandono recorrente de temporadas trava a subida.', 'execution', 'block_upgrade'));
    }
    if (seasonStats.avgRiskScore >= 82 && seasonStats.total > 0) {
      blockers.push(_stoneBlocker('extreme_risk', 'Risco muito alto recorrente trava a subida.', 'risk', 'block_upgrade'));
    }
    if (seasonStats.failed >= 2) {
      blockers.push(_stoneBlocker('recurring_failure', 'Falhas operacionais recorrentes travam a subida.', 'execution', 'block_upgrade'));
    }
    if (orderStats.growthPct > 25 && seasonStats.avgRiskScore >= 75) {
      blockers.push(_stoneBlocker('chaotic_growth', 'Crescimento com risco alto não deve subir Pedra.', 'growth', 'block_upgrade'));
    }
    if (indexes.controlledRisk && indexes.controlledRisk.score < 20) {
      blockers.push(_stoneBlocker('critical_limiters', 'Limitadores críticos de risco ou execução impedem a subida agora.', 'risk', 'block_upgrade'));
    }
    return blockers;
  }

  function _stoneBlocker(id, title, category, effect) {
    return {
      id: id,
      title: title,
      category: category,
      effect: effect || 'slow_progress'
    };
  }

  function _blockerReason(blockers) {
    var blocker = (blockers || []).filter(function (item) {
      return item && item.effect === 'block_upgrade';
    })[0];
    return blocker ? blocker.title : '';
  }

  function _stoneUpgradeReason(ctx) {
    var checklist = ctx.checklist || [];
    var completed = checklist.filter(function (item) { return item.status === 'completed'; }).length;
    var parts = [];
    parts.push('Progresso da Pedra chegou a 100% com maturidade acumulada.');
    if (ctx.seasonStats && ctx.seasonStats.totalVictories) parts.push('Vitórias totais em temporadas fortaleceram a execução.');
    else if (ctx.seasonStats && ctx.seasonStats.partialVictories) parts.push('Vitórias parciais mostraram avanço operacional.');
    if (ctx.seasonStats && ctx.seasonStats.avgRiskScore <= 60) parts.push('Risco médio permaneceu controlado.');
    if (completed) parts.push(completed + ' marco(s) do Caminho da Pedra foram detectados automaticamente.');
    return parts.join(' ');
  }

  function _stoneUpgradeIndicators(ctx) {
    ctx = ctx || {};
    return {
      maturityScore: Math.round(_number(ctx.maturityScore, 0)),
      stoneProgressPercent: Math.round(_number(ctx.progress, 0)),
      indexes: ctx.indexes || {},
      checklistSummary: _maturityChecklistSummary(ctx.checklist || []),
      seasonContributionSummary: ctx.seasonStats && ctx.seasonStats.summary ? ctx.seasonStats.summary : _emptySeasonContributionSummary(),
      orderSummary: {
        totalOrders: ctx.orderStats ? ctx.orderStats.totalOrders : 0,
        activeDays: ctx.orderStats ? ctx.orderStats.activeDays : 0,
        activeWeeks: ctx.orderStats ? ctx.orderStats.activeWeeks : 0,
        growthPct: ctx.orderStats ? Math.round(ctx.orderStats.growthPct) : 0
      },
      loyaltySummary: {
        uniqueCustomers: ctx.loyaltyStats ? ctx.loyaltyStats.uniqueCustomers : 0,
        recurringCustomers: ctx.loyaltyStats ? ctx.loyaltyStats.recurringCustomers : 0,
        recurringRate: ctx.loyaltyStats ? Math.round(ctx.loyaltyStats.recurringRate * 100) : 0
      },
      scenario: ctx.scenario || ''
    };
  }

  function _maturityCalculationSignature(seasonStats, orderStats, loyaltyStats, scenario) {
    var summary = seasonStats && seasonStats.summary ? seasonStats.summary : _emptySeasonContributionSummary();
    return [
      summary.closedSeasons || 0,
      summary.finished || 0,
      summary.abandoned || 0,
      summary.totalVictories || 0,
      summary.partialVictories || 0,
      summary.averageScore || 0,
      summary.averageRiskScore || 0,
      orderStats.totalOrders || 0,
      Math.round(orderStats.currentRevenue || 0),
      Math.round(orderStats.previousRevenue || 0),
      orderStats.activeDays || 0,
      orderStats.activeWeeks || 0,
      loyaltyStats.recurringCustomers || 0,
      Math.round((loyaltyStats.recurringRate || 0) * 100),
      scenario || ''
    ].join('|');
  }

  function _maturityChecklist(currentStone, nextStone, seasonStats, orderStats, loyaltyStats, indexes, scenario) {
    var transition = (currentStone || 'Pedra Bruta') + '->' + (nextStone || _nextStone(currentStone));
    var factories = _checklistFactories();
    var ids = _checklistIdsForTransition(transition);
    var items = ids.map(function (id) {
      return factories[id] ? factories[id](seasonStats, orderStats, loyaltyStats, indexes, scenario) : null;
    }).filter(Boolean);

    if (seasonStats.abandoned > 0 && !items.some(function (item) { return item.id === 'avoid_abandonment'; })) {
      items.push(factories.avoid_abandonment(seasonStats, orderStats, loyaltyStats, indexes, scenario));
    }
    if (seasonStats.avgRiskScore >= 70 && !items.some(function (item) { return item.id === 'reduce_operation_risk'; })) {
      items.push(factories.reduce_operation_risk(seasonStats, orderStats, loyaltyStats, indexes, scenario));
    }
    return items;
  }

  function _checklistFactories() {
    return {
      sell_more_days: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'sell_more_days',
          title: 'Manter vendas em mais dias da semana',
          description: 'O negócio fica mais forte quando vende em mais dias, não só em um pico isolado.',
          category: 'consistency',
          completed: orderStats.activeDays >= 4,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays },
          completedEvidence: 'Já houve venda em dias suficientes para mostrar mais ritmo.',
          pendingEvidence: 'Ainda faltam mais dias com venda para mostrar que o movimento está ficando constante.'
        });
      },
      finish_season: function (seasonStats) {
        var victories = _number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0);
        return _checklistItem({
          id: 'finish_season',
          title: 'Concluir uma temporada com vitória',
          description: 'A temporada precisa terminar com avanço real para mostrar que o foco escolhido funcionou.',
          category: 'execution',
          completed: victories > 0,
          limited: !victories && (_number(seasonStats.unstable, 0) > 0 || _number(seasonStats.failed, 0) > 0),
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { finishedSeasons: seasonStats.finished, victories: victories, unstable: seasonStats.unstable, failed: seasonStats.failed },
          completedEvidence: 'Já existe temporada finalizada com vitória total ou parcial.',
          pendingEvidence: 'Ainda falta fechar uma temporada com vitória total ou parcial.',
          limitedEvidence: 'As temporadas trouxeram aprendizado, mas ainda não confirmaram uma vitória.'
        });
      },
      reduce_initial_instability: function (seasonStats, orderStats) {
        var limited = seasonStats.abandoned > 0 || seasonStats.failed > 0 || seasonStats.avgRiskScore >= 70;
        return _checklistItem({
          id: 'reduce_initial_instability',
          title: 'Reduzir instabilidade inicial',
          description: 'O negócio evolui melhor quando consegue terminar os ciclos sem abandono, falha ou risco alto.',
          category: 'risk',
          completed: seasonStats.total > 0 && !limited && orderStats.activeDays >= 3,
          limited: limited,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { abandoned: seasonStats.abandoned, failed: seasonStats.failed, averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'As últimas temporadas não mostram sinais fortes de desorganização.',
          pendingEvidence: 'Ainda falta fechar mais ciclos para confirmar que a rotina está mais estável.',
          limitedEvidence: 'Abandono, falha ou risco alto ainda mostram que a rotina precisa ficar mais firme.'
        });
      },
      minimum_order_base: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'minimum_order_base',
          title: 'Criar base mínima de pedidos',
          description: 'Antes de tirar conclusões, o negócio precisa ter uma base mínima de pedidos reais.',
          category: 'growth',
          completed: orderStats.totalOrders >= 5,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalOrders: orderStats.totalOrders },
          completedEvidence: 'Já existe uma base inicial de pedidos para começar a ler o negócio.',
          pendingEvidence: 'Ainda há poucos pedidos para entender o comportamento real das vendas.'
        });
      },
      stable_weeks: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'stable_weeks',
          title: 'Manter semanas mais estáveis',
          description: 'Vender em semanas diferentes mostra que o movimento não depende de um único momento bom.',
          category: 'consistency',
          completed: orderStats.activeWeeks >= 2 && orderStats.activeDays >= 5,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeWeeks: orderStats.activeWeeks, activeDays: orderStats.activeDays },
          completedEvidence: 'As vendas já aparecem distribuídas em mais de uma semana.',
          pendingEvidence: 'Ainda falta repetir vendas em mais semanas para mostrar estabilidade.'
        });
      },
      reduce_oscillation: function (seasonStats, orderStats) {
        var limited = orderStats.previousRevenue > 0 && orderStats.growthPct < -25;
        return _checklistItem({
          id: 'reduce_oscillation',
          title: 'Reduzir oscilações fortes',
          description: 'O negócio fica mais previsível quando as vendas não caem de forma brusca de um período para outro.',
          category: 'consistency',
          completed: orderStats.previousRevenue > 0 && orderStats.growthPct >= -10,
          limited: limited,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), previousRevenue: Math.round(orderStats.previousRevenue), currentRevenue: Math.round(orderStats.currentRevenue) },
          completedEvidence: 'As vendas recentes não mostram uma queda forte.',
          pendingEvidence: 'Ainda falta histórico para comparar se as vendas estão oscilando muito.',
          limitedEvidence: 'A queda recente foi forte e ainda pesa na evolução.'
        });
      },
      improve_average_score: function (seasonStats) {
        return _checklistItem({
          id: 'improve_average_score',
          title: 'Fechar temporadas mais fortes',
          description: 'As temporadas precisam terminar com uma leitura mais saudável para mostrar que o foco está virando resultado.',
          category: 'execution',
          completed: seasonStats.avgScore >= 65,
          limited: seasonStats.total > 0 && seasonStats.avgScore > 0 && seasonStats.avgScore < 45,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageScore: Math.round(seasonStats.avgScore) },
          completedEvidence: 'As temporadas recentes terminaram com uma leitura saudável.',
          pendingEvidence: 'As temporadas ainda precisam terminar com mais força.',
          limitedEvidence: 'As temporadas terminaram fracas e isso limita a evolução.'
        });
      },
      reduce_recurring_risk: function (seasonStats) {
        return _checklistItem({
          id: 'reduce_recurring_risk',
          title: 'Reduzir risco recorrente',
          description: 'Crescer só ajuda de verdade quando o negócio consegue manter o risco sob controle.',
          category: 'risk',
          completed: seasonStats.total > 0 && seasonStats.avgRiskScore <= 55,
          limited: seasonStats.avgRiskScore >= 70,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'As temporadas mostram um risco mais controlado.',
          pendingEvidence: 'Ainda falta reduzir a chance de a temporada sair do rumo.',
          limitedEvidence: 'O risco ainda está alto e segura a evolução.'
        });
      },
      improve_recurrence: function (seasonStats, orderStats, loyaltyStats) {
        return _checklistItem({
          id: 'improve_recurrence',
          title: 'Melhorar recorrência de clientes',
          description: 'Cliente que compra de novo mostra que o negócio está criando relação, não só venda avulsa.',
          category: 'loyalty',
          completed: loyaltyStats.recurringCustomers >= 2 || loyaltyStats.recurringRate >= 0.25,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { recurringCustomers: loyaltyStats.recurringCustomers, recurringRate: Math.round(loyaltyStats.recurringRate * 100) },
          completedEvidence: 'Já existem clientes voltando a comprar.',
          pendingEvidence: 'Ainda falta mais cliente comprando de novo.'
        });
      },
      increase_stability: function (seasonStats, orderStats) {
        var victories = _number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0));
        return _checklistItem({
          id: 'increase_stability',
          title: 'Aumentar estabilidade da operação',
          description: 'A rotina fica mais madura quando vende em dias diferentes, fecha temporadas e reduz risco.',
          category: 'consistency',
          completed: orderStats.activeDays >= 5 && victories >= 1 && seasonStats.avgRiskScore <= 65,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays, victories: victories, averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'O negócio já combina vendas mais distribuídas com uma temporada de vitória.',
          pendingEvidence: 'Ainda falta juntar venda regular, temporada bem fechada e risco menor.'
        });
      },
      grow_with_control: function (seasonStats, orderStats) {
        var limited = orderStats.growthPct > 20 && seasonStats.avgRiskScore >= 70;
        return _checklistItem({
          id: 'grow_with_control',
          title: 'Crescer mantendo controle',
          description: 'Vender mais é bom, mas precisa acontecer sem deixar o negócio mais vulnerável.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && seasonStats.avgRiskScore <= 65,
          limited: limited,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'As vendas cresceram sem aumentar demais o risco.',
          pendingEvidence: 'Ainda falta crescer mantendo o negócio sob controle.',
          limitedEvidence: 'As vendas cresceram, mas com risco alto demais para contar como evolução saudável.'
        });
      },
      balanced_seasons: function (seasonStats) {
        var victories = _number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0));
        return _checklistItem({
          id: 'balanced_seasons',
          title: 'Concluir temporadas equilibradas',
          description: 'Uma temporada equilibrada mostra que o negócio avançou sem depender de esforço extremo.',
          category: 'execution',
          completed: victories >= 1 && seasonStats.avgScore >= 60 && seasonStats.avgRiskScore <= 65,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { victories: victories, averageScore: Math.round(seasonStats.avgScore), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Já houve uma temporada com vitória e risco saudável.',
          pendingEvidence: 'Ainda falta uma temporada com vitória e mais equilíbrio.'
        });
      },
      improve_loyalty: function (seasonStats, orderStats, loyaltyStats) {
        return _checklistItem({
          id: 'improve_loyalty',
          title: 'Melhorar fidelização',
          description: 'Quando mais clientes voltam, o negócio depende menos de vender sempre para pessoas novas.',
          category: 'loyalty',
          completed: loyaltyStats.recurringRate >= 0.30 && loyaltyStats.recurringCustomers >= 2,
          source: 'orders,store_customers',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { recurringCustomers: loyaltyStats.recurringCustomers, recurringRate: Math.round(loyaltyStats.recurringRate * 100) },
          completedEvidence: 'A recompra já aparece com mais força.',
          pendingEvidence: 'Ainda falta mais cliente voltando para comprar.'
        });
      },
      reduce_promotion_dependency: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'reduce_promotion_dependency',
          title: 'Reduzir dependência de promoções',
          description: 'Promoção ajuda quando vende sem derrubar demais o valor dos pedidos.',
          category: 'growth',
          completed: orderStats.currentAverageTicket > 0 && orderStats.previousAverageTicket > 0 && orderStats.currentAverageTicket >= orderStats.previousAverageTicket,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { currentAverageTicket: Math.round(orderStats.currentAverageTicket), previousAverageTicket: Math.round(orderStats.previousAverageTicket) },
          completedEvidence: 'O valor médio dos pedidos foi preservado ou melhorou.',
          pendingEvidence: 'Ainda falta entender se as vendas dependem demais de desconto.'
        });
      },
      healthy_growth: function (seasonStats, orderStats) {
        var limited = orderStats.growthPct > 15 && seasonStats.avgRiskScore >= 70;
        return _checklistItem({
          id: 'healthy_growth',
          title: 'Manter crescimento saudável',
          description: 'O melhor crescimento é aquele em que vende mais, mantém ritmo e não aumenta demais o risco.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && seasonStats.avgScore >= 60 && seasonStats.avgRiskScore <= 65,
          limited: limited,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), averageScore: Math.round(seasonStats.avgScore), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'O negócio cresceu com uma leitura saudável e risco controlado.',
          pendingEvidence: 'Ainda falta crescer com mais equilíbrio.',
          limitedEvidence: 'O crescimento veio com risco alto e isso segura a evolução.'
        });
      },
      reduce_average_risk: function (seasonStats) {
        return _checklistItem({
          id: 'reduce_average_risk',
          title: 'Diminuir chance de falha',
          description: 'Quanto menor o risco, mais previsível fica o caminho do negócio.',
          category: 'risk',
          completed: seasonStats.total > 0 && seasonStats.avgRiskScore <= 50,
          limited: seasonStats.avgRiskScore >= 70,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'As temporadas mostram uma chance de falha menor.',
          pendingEvidence: 'Ainda falta diminuir a chance de a temporada sair do rumo.',
          limitedEvidence: 'A chance de falha ainda está alta e limita a evolução.'
        });
      },
      ambitious_goals: function (seasonStats, orderStats, loyaltyStats, indexes, scenario) {
        var growthContext = scenario === 'growth' || scenario === 'expansion';
        return _checklistItem({
          id: 'ambitious_goals',
          title: 'Sustentar metas mais ousadas',
          description: 'Uma meta mais ousada só fortalece o negócio quando vem com controle e boa execução.',
          category: 'execution',
          completed: growthContext && seasonStats.avgScore >= 65 && seasonStats.avgRiskScore <= 60,
          limited: growthContext && seasonStats.avgRiskScore >= 70,
          source: 'flight_plans,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { scenario: scenario || '', averageScore: Math.round(seasonStats.avgScore), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'O negócio conseguiu sustentar uma rota mais ambiciosa com controle.',
          pendingEvidence: 'Ainda falta provar que uma meta mais ousada cabe na rotina.',
          limitedEvidence: 'A meta ficou ousada demais para o nível de risco atual.'
        });
      },
      financial_stability: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'financial_stability',
          title: 'Melhorar estabilidade financeira',
          description: 'A saúde financeira começa a aparecer quando há pedidos, ticket e venda sem queda forte.',
          category: 'financial',
          completed: orderStats.totalOrders >= 8 && orderStats.averageTicket > 0 && orderStats.growthPct >= -10,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalOrders: orderStats.totalOrders, averageTicket: Math.round(orderStats.averageTicket), growthPct: Math.round(orderStats.growthPct) },
          completedEvidence: 'Pedidos, ticket e vendas recentes mostram uma base financeira mais firme.',
          pendingEvidence: 'Ainda falta mais base para entender se a venda está deixando dinheiro.'
        });
      },
      reduce_concentration: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'reduce_concentration',
          title: 'Reduzir dependência de poucos dias',
          description: 'O negócio fica menos frágil quando não depende de poucos dias bons para vender.',
          category: 'risk',
          completed: orderStats.activeDays >= 8 && orderStats.activeWeeks >= 3,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays, activeWeeks: orderStats.activeWeeks },
          completedEvidence: 'As vendas já aparecem em mais dias e semanas.',
          pendingEvidence: 'As vendas ainda estão concentradas em poucos dias ou semanas.'
        });
      },
      good_consistency: function (seasonStats, orderStats) {
        var victories = _number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0));
        return _checklistItem({
          id: 'good_consistency',
          title: 'Manter boa consistência',
          description: 'Boa consistência aparece quando o negócio vende com frequência e não abandona os ciclos.',
          category: 'consistency',
          completed: orderStats.activeDays >= 8 && seasonStats.abandoned === 0 && victories >= 2,
          limited: seasonStats.abandoned > 0,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays, victories: victories, abandoned: seasonStats.abandoned },
          completedEvidence: 'O negócio já mostra regularidade e vitórias sem abandono.',
          pendingEvidence: 'Ainda falta repetir esse ritmo por mais tempo.',
          limitedEvidence: 'Abandono recente ainda atrapalha a consistência.'
        });
      },
      long_healthy_growth: function (seasonStats, orderStats) {
        var victories = _number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0));
        return _checklistItem({
          id: 'long_healthy_growth',
          title: 'Manter crescimento saudável por mais tempo',
          description: 'Para chegar mais longe, o negócio precisa crescer com controle por mais tempo.',
          category: 'growth',
          completed: victories >= 3 && orderStats.growthPct > 0 && seasonStats.avgRiskScore <= 60,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { victories: victories, growthPct: Math.round(orderStats.growthPct), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Já existe sequência de vitórias com crescimento controlado.',
          pendingEvidence: 'Ainda falta manter crescimento saudável por mais tempo.'
        });
      },
      reduce_operational_instability: function (seasonStats) {
        var limited = seasonStats.unstable > 0 || seasonStats.failed > 0 || seasonStats.abandoned > 0;
        return _checklistItem({
          id: 'reduce_operational_instability',
          title: 'Deixar a rotina mais estável',
          description: 'A rotina amadurece quando as temporadas deixam de terminar instáveis, com falha ou abandono.',
          category: 'risk',
          completed: (_number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0))) >= 2 && !limited && seasonStats.avgRiskScore <= 60,
          limited: limited,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { unstable: seasonStats.unstable, failed: seasonStats.failed, abandoned: seasonStats.abandoned },
          completedEvidence: 'As temporadas recentes fecharam sem instabilidade relevante.',
          pendingEvidence: 'Ainda falta reduzir instabilidade na rotina.',
          limitedEvidence: 'Instabilidade, falha ou abandono ainda mostram que a rotina precisa de ajuste.'
        });
      },
      difficult_seasons: function (seasonStats) {
        return _checklistItem({
          id: 'difficult_seasons',
          title: 'Concluir temporadas difíceis',
          description: 'Desafios maiores ajudam quando o negócio consegue executar sem perder o controle.',
          category: 'execution',
          completed: seasonStats.impacts.some(function (impact) {
            return impact.difficulty === 'aggressive' && impact.impactPercent >= 10 && (impact.riskLevel === 'low' || impact.riskLevel === 'medium');
          }),
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { aggressiveControlledWins: seasonStats.impacts.filter(function (impact) { return impact.difficulty === 'aggressive' && impact.impactPercent >= 10; }).length },
          completedEvidence: 'Já houve uma temporada mais intensa fechada com boa contribuição.',
          pendingEvidence: 'Ainda falta vencer um desafio maior com risco baixo.'
        });
      },
      good_financial_health: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'good_financial_health',
          title: 'Manter boa saúde financeira',
          description: 'A saúde financeira melhora quando há volume, ticket e vendas sem queda forte.',
          category: 'financial',
          completed: orderStats.totalOrders >= 12 && orderStats.averageTicket > 0 && orderStats.growthPct >= 0,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalOrders: orderStats.totalOrders, averageTicket: Math.round(orderStats.averageTicket), growthPct: Math.round(orderStats.growthPct) },
          completedEvidence: 'O volume, o ticket e as vendas recentes mostram base financeira melhor.',
          pendingEvidence: 'Ainda falta mais histórico para confirmar saúde financeira forte.'
        });
      },
      low_risk_growth: function (seasonStats, orderStats) {
        var victories = _number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0));
        return _checklistItem({
          id: 'low_risk_growth',
          title: 'Sustentar crescimento com baixo risco',
          description: 'Crescer com baixo risco mostra que o negócio consegue avançar sem ficar vulnerável.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && seasonStats.avgRiskScore <= 45 && victories >= 3,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), averageRiskScore: Math.round(seasonStats.avgRiskScore), victories: victories },
          completedEvidence: 'O negócio cresceu mantendo risco baixo nas temporadas.',
          pendingEvidence: 'Ainda falta crescer por mais tempo com risco baixo.'
        });
      },
      high_predictability: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'high_predictability',
          title: 'Manter alta previsibilidade',
          description: 'Previsibilidade aparece quando as vendas se repetem, as temporadas fecham melhor e não há abandono.',
          category: 'consistency',
          completed: orderStats.activeWeeks >= 4 && seasonStats.avgScore >= 75 && seasonStats.abandoned === 0,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeWeeks: orderStats.activeWeeks, averageScore: Math.round(seasonStats.avgScore), abandoned: seasonStats.abandoned },
          completedEvidence: 'As semanas ficaram mais regulares e não houve abandono.',
          pendingEvidence: 'Ainda falta manter essa previsibilidade por mais tempo.'
        });
      },
      balance_growth_stability: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'balance_growth_stability',
          title: 'Equilibrar crescimento e estabilidade',
          description: 'O negócio evolui melhor quando cresce e, ao mesmo tempo, mantém a rotina estável.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && orderStats.activeDays >= 8 && seasonStats.avgRiskScore <= 55,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), activeDays: orderStats.activeDays, averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'As vendas cresceram com mais dias ativos e risco controlado.',
          pendingEvidence: 'Ainda falta equilibrar crescimento com uma rotina mais estável.'
        });
      },
      consistent_maturity: function (seasonStats, orderStats, loyaltyStats) {
        var victories = _number(seasonStats.successfulSeasons, 0) || (_number(seasonStats.totalVictories, 0) + _number(seasonStats.partialVictories, 0));
        return _checklistItem({
          id: 'consistent_maturity',
          title: 'Demonstrar maturidade consistente',
          description: 'Maturidade consistente aparece quando vendas, clientes voltando, risco baixo e execução caminham juntos.',
          category: 'execution',
          completed: victories >= 4 && seasonStats.avgScore >= 75 && seasonStats.avgRiskScore <= 55 && loyaltyStats.recurringCustomers >= 3,
          source: 'seasons,orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { victories: victories, averageScore: Math.round(seasonStats.avgScore), recurringCustomers: loyaltyStats.recurringCustomers },
          completedEvidence: 'O histórico já mostra execução forte, risco controlado e clientes voltando.',
          pendingEvidence: 'Ainda falta um histórico mais longo com esses sinais juntos.'
        });
      },
      season_partial_win: function (seasonStats) {
        return _checklistItem({
          id: 'season_partial_win',
          title: 'Alcançar Vitória Parcial',
          description: 'Vitória Parcial mostra que houve avanço real, mesmo sem bater a meta completa.',
          category: 'execution',
          completed: seasonStats.partialVictories > 0 || seasonStats.totalVictories > 0,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { partialVictories: seasonStats.partialVictories, totalVictories: seasonStats.totalVictories },
          completedEvidence: 'Já existe uma temporada com vitória parcial ou total.',
          pendingEvidence: 'Ainda falta alcançar uma vitória parcial ou total.'
        });
      },
      season_total_win: function (seasonStats) {
        return _checklistItem({
          id: 'season_total_win',
          title: 'Alcançar Vitória Total',
          description: 'Vitória Total mostra que o negócio conseguiu executar a rota e alcançar a meta.',
          category: 'execution',
          completed: seasonStats.totalVictories > 0,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalVictories: seasonStats.totalVictories },
          completedEvidence: 'Já existe Vitória Total em uma temporada finalizada.',
          pendingEvidence: 'Ainda falta uma Vitória Total.'
        });
      },
      avoid_abandonment: function (seasonStats) {
        return _checklistItem({
          id: 'avoid_abandonment',
          title: 'Evitar abandono de temporada',
          description: 'Quando uma temporada é abandonada, o negócio perde leitura e ritmo de evolução.',
          category: 'execution',
          completed: seasonStats.total > 0 && seasonStats.abandoned === 0,
          limited: seasonStats.abandoned > 0,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { abandoned: seasonStats.abandoned },
          completedEvidence: 'As temporadas foram fechadas sem abandono.',
          pendingEvidence: 'Ainda falta histórico para confirmar que os ciclos estão sendo fechados.',
          limitedEvidence: 'Temporada abandonada ainda pesa contra a evolução.'
        });
      },
      reduce_operation_risk: function (seasonStats) {
        return _checklistItem({
          id: 'reduce_operation_risk',
          title: 'Reduzir risco da operação',
          description: 'Com menos risco, o negócio consegue evoluir sem depender de esforço extremo.',
          category: 'risk',
          completed: seasonStats.total > 0 && seasonStats.avgRiskScore <= 55,
          limited: seasonStats.avgRiskScore >= 70,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'A chance média de falha está mais controlada.',
          pendingEvidence: 'Ainda falta reduzir a chance de falha nas temporadas.',
          limitedEvidence: 'A chance de falha ainda está alta e segura a evolução.'
        });
      }
    };
  }

  function _checklistIdsForTransition(transition) {
    var map = {
      'Pedra Bruta->Quartzo': ['sell_more_days', 'finish_season', 'reduce_initial_instability', 'minimum_order_base'],
      'Quartzo->Ametista': ['stable_weeks', 'reduce_oscillation', 'improve_average_score', 'reduce_recurring_risk', 'season_partial_win'],
      'Ametista->Safira': ['improve_recurrence', 'increase_stability', 'grow_with_control', 'balanced_seasons'],
      'Safira->Esmeralda': ['improve_loyalty', 'reduce_promotion_dependency', 'healthy_growth', 'reduce_average_risk'],
      'Esmeralda->Rubi': ['ambitious_goals', 'financial_stability', 'reduce_concentration', 'good_consistency'],
      'Rubi->Diamante': ['long_healthy_growth', 'reduce_operational_instability', 'difficult_seasons', 'good_financial_health'],
      'Diamante->Ônix': ['low_risk_growth', 'high_predictability', 'balance_growth_stability', 'consistent_maturity']
    };
    return map[transition] || map['Pedra Bruta->Quartzo'];
  }

  function _checklistItem(config) {
    var limited = config.limited === true;
    var completed = !limited && config.completed === true;
    var status = limited ? 'limited' : (completed ? 'completed' : 'pending');
    return {
      id: config.id,
      title: config.title,
      description: config.description,
      category: config.category,
      completed: completed,
      completedAt: completed ? (config.completedAt || null) : null,
      status: status,
      source: config.source || '',
      evidence: Object.assign({}, config.evidence || {}, {
        message: limited
          ? (config.limitedEvidence || config.pendingEvidence || '')
          : (completed ? config.completedEvidence : config.pendingEvidence)
      })
    };
  }

  function _initialChecklist() {
    var emptySeasonStats = {
      total: 0,
      finished: 0,
      abandoned: 0,
      totalVictories: 0,
      partialVictories: 0,
      unstable: 0,
      failed: 0,
      avgScore: 0,
      avgRiskScore: 55,
      totalImpact: 0,
      impacts: [],
      lastImpact: _emptySeasonImpact()
    };
    var emptyOrderStats = {
      totalOrders: 0,
      revenue: 0,
      averageTicket: 0,
      activeDays: 0,
      activeWeeks: 0,
      currentRevenue: 0,
      previousRevenue: 0,
      currentOrders: 0,
      previousOrders: 0,
      currentAverageTicket: 0,
      previousAverageTicket: 0,
      growthPct: 0
    };
    var emptyLoyaltyStats = { uniqueCustomers: 0, recurringCustomers: 0, recurringRate: 0 };
    return _maturityChecklist('Pedra Bruta', 'Quartzo', emptySeasonStats, emptyOrderStats, emptyLoyaltyStats, _emptyMaturityIndexes(), '');
  }

  function _maturityChecklistSummary(checklist) {
    checklist = checklist || [];
    return {
      completed: checklist.filter(function (item) { return item.status === 'completed'; }).length,
      pending: checklist.filter(function (item) { return item.status === 'pending'; }).length,
      limited: checklist.filter(function (item) { return item.status === 'limited'; }).length,
      total: checklist.length
    };
  }

  function _recentEvidenceDate(seasonStats) {
    var last = seasonStats && seasonStats.lastImpact;
    return last && last.seasonDate ? last.seasonDate : null;
  }

  function _normalizeStoneUpgradeEvents(events) {
    var seen = {};
    return (events || []).filter(function (event) {
      if (!event) return false;
      var key = event.id || event.calculationSignature || (event.fromStone + '>' + event.toStone + ':' + _dateValue(event.createdAt));
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).sort(function (a, b) {
      return _dateValue(b.createdAt || b.upgradedAt) - _dateValue(a.createdAt || a.upgradedAt);
    });
  }

  function _normalizeMaturitySnapshots(snapshots) {
    return (snapshots || []).filter(function (snapshot) {
      return snapshot && snapshot.snapshotType;
    }).sort(function (a, b) {
      return _dateValue(b.createdAt || b.periodEnd) - _dateValue(a.createdAt || a.periodEnd);
    }).slice(0, 24);
  }

  function _normalizeBusinessHistorySnapshots(snapshots) {
    return (snapshots || []).filter(function (snapshot) {
      return snapshot && snapshot.snapshotType && snapshot.periodKey;
    }).sort(function (a, b) {
      return _dateValue(b.updatedAt || b.createdAt || b.periodEnd) - _dateValue(a.updatedAt || a.createdAt || a.periodEnd);
    }).slice(0, 120);
  }

  function _ensureBusinessMaturitySnapshots(maturity, existingSnapshots, opts) {
    opts = opts || {};
    existingSnapshots = _normalizeMaturitySnapshots(existingSnapshots || []);
    if (!maturity || !window.DB || typeof DB.add !== 'function') return Promise.resolve(existingSnapshots);

    var plans = [];
    var monthly = _maturitySnapshotPlan('monthly', maturity, opts, null);
    if (!_hasMaturitySnapshot(existingSnapshots, monthly)) plans.push(monthly);

    if (opts.snapshotType === 'season_final' && opts.relatedSeasonId) {
      var seasonFinal = _maturitySnapshotPlan('season_final', maturity, opts, null);
      if (!_hasMaturitySnapshot(existingSnapshots, seasonFinal)) plans.push(seasonFinal);
    }

    if (maturity.recentUpgradeEvent && maturity.recentUpgradeEvent.id) {
      var upgrade = _maturitySnapshotPlan('stone_upgrade', maturity, opts, maturity.recentUpgradeEvent);
      if (!_hasMaturitySnapshot(existingSnapshots, upgrade)) plans.push(upgrade);
    }

    if (!plans.length) return Promise.resolve(existingSnapshots);

    var created = [];
    return plans.reduce(function (chain, plan) {
      return chain.then(function () {
        return DB.add('business_maturity_snapshots', plan).then(function (ref) {
          created.push(Object.assign({}, plan, {
            id: ref && ref.id ? ref.id : '',
            createdAt: new Date().toISOString()
          }));
        }).catch(function (err) {
          console.warn('Business maturity snapshot save skipped', err);
        });
      });
    }, Promise.resolve()).then(function () {
      return _normalizeMaturitySnapshots(created.concat(existingSnapshots));
    });
  }

  function _ensureBusinessHistorySnapshots(history, existingSnapshots, opts) {
    opts = opts || {};
    existingSnapshots = _normalizeBusinessHistorySnapshots(existingSnapshots || []);
    if (!history || !window.DB || typeof DB.set !== 'function') return Promise.resolve(existingSnapshots);

    var currentMonth = _maturityMonthKey();
    var byId = {};
    existingSnapshots.forEach(function (snapshot) {
      if (snapshot && snapshot.id) byId[snapshot.id] = snapshot;
    });

    var plans = [];
    (history.monthly || []).forEach(function (month) {
      if (!month || !month.monthKey) return;
      var id = _businessHistorySnapshotId('monthly', month.monthKey);
      var exists = byId[id];
      if (exists && month.monthKey !== currentMonth) return;
      plans.push(_businessHistorySnapshotPlan('monthly', month.monthKey, month, opts, exists));
    });

    Object.keys(history.periods || {}).forEach(function (windowKey) {
      var metrics = history.periods[windowKey];
      if (!metrics || !metrics.periodEnd) return;
      var periodKey = windowKey + '_' + String(metrics.periodEnd).slice(0, 10);
      var id = _businessHistorySnapshotId('rolling', periodKey);
      plans.push(_businessHistorySnapshotPlan('rolling', periodKey, Object.assign({ windowKey: windowKey }, metrics), opts, byId[id]));
    });

    if (!plans.length) return Promise.resolve(existingSnapshots);

    var saved = [];
    return plans.reduce(function (chain, plan) {
      return chain.then(function () {
        return DB.set('business_history_snapshots', plan.id, plan).then(function () {
          saved.push(plan);
        }).catch(function (err) {
          console.warn('Business history snapshot save skipped', err);
        });
      });
    }, Promise.resolve()).then(function () {
      var merged = {};
      existingSnapshots.concat(saved).forEach(function (snapshot) {
        if (snapshot && snapshot.id) merged[snapshot.id] = snapshot;
      });
      return _normalizeBusinessHistorySnapshots(Object.keys(merged).map(function (id) { return merged[id]; }));
    });
  }

  function _businessHistorySnapshotId(type, key) {
    return String(type || 'history') + '_' + String(key || 'period')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function _businessHistorySnapshotPlan(type, periodKey, metrics, opts, existing) {
    opts = opts || {};
    metrics = metrics || {};
    var now = new Date().toISOString();
    var id = _businessHistorySnapshotId(type, periodKey);
    return {
      id: id,
      tenantId: _tenantId,
      snapshotType: type,
      periodKey: periodKey,
      windowKey: metrics.windowKey || '',
      monthKey: type === 'monthly' ? (metrics.monthKey || periodKey) : '',
      periodStart: metrics.periodStart || '',
      periodEnd: metrics.periodEnd || '',
      metrics: Object.assign({}, metrics),
      calculationVersion: 'business_history_v1',
      source: opts.source || 'business_maturity_load',
      createdAt: existing && existing.createdAt ? existing.createdAt : now,
      updatedAt: now
    };
  }

  function _maturitySnapshotPlan(type, maturity, opts, upgradeEvent) {
    opts = opts || {};
    var period = _maturitySnapshotPeriod(type, opts);
    return {
      tenantId: _tenantId,
      snapshotType: type,
      periodStart: period.start,
      periodEnd: period.end,
      currentStone: maturity.currentStone || 'Pedra Bruta',
      nextStone: maturity.nextStone || _nextStone(maturity.currentStone),
      stoneProgressPercent: Math.round(_number(maturity.stoneProgressPercent, 0)),
      maturityScore: Math.round(_number(maturity.maturityScore, 0)),
      indexes: maturity.indexes || _emptyMaturityIndexes(),
      dataSignals: maturity.dataSignals || _emptyMaturityDataSignals(),
      checklistSummary: maturity.checklistSummary || _maturityChecklistSummary(maturity.checklist || []),
      checklist: maturity.checklist || [],
      blockers: maturity.blockers || [],
      strengths: maturity.strengths || [],
      weaknesses: maturity.weaknesses || [],
      dataConfidence: _maturityDataConfidence(maturity),
      source: opts.source || (type === 'monthly' ? 'panel_open' : type),
      relatedSeasonId: type === 'season_final' ? (opts.relatedSeasonId || '') : '',
      relatedUpgradeEventId: upgradeEvent && upgradeEvent.id ? upgradeEvent.id : '',
      createdAt: _maturityTimestamp()
    };
  }

  function _maturitySnapshotPeriod(type, opts) {
    opts = opts || {};
    if (type === 'season_final') {
      var season = opts.season || {};
      return {
        start: season.startDate || season.startedAt || opts.periodStart || _maturityMonthStart(),
        end: season.finishedAt || season.endDate || opts.periodEnd || new Date().toISOString()
      };
    }
    if (type === 'stone_upgrade') {
      return {
        start: opts.periodStart || _maturityMonthStart(),
        end: opts.periodEnd || new Date().toISOString()
      };
    }
    return {
      start: _maturityMonthStart(),
      end: _maturityMonthEnd()
    };
  }

  function _hasMaturitySnapshot(snapshots, plan) {
    return (snapshots || []).some(function (snapshot) {
      if (!snapshot || snapshot.snapshotType !== plan.snapshotType) return false;
      if (plan.snapshotType === 'monthly') return String(snapshot.periodStart || '').slice(0, 7) === String(plan.periodStart || '').slice(0, 7);
      if (plan.snapshotType === 'season_final') return snapshot.relatedSeasonId && snapshot.relatedSeasonId === plan.relatedSeasonId;
      if (plan.snapshotType === 'stone_upgrade') return snapshot.relatedUpgradeEventId && snapshot.relatedUpgradeEventId === plan.relatedUpgradeEventId;
      return false;
    });
  }

  function _maturityDataConfidence(maturity) {
    var indexes = maturity && maturity.indexes ? maturity.indexes : {};
    var keys = Object.keys(indexes);
    if (!keys.length) return 'low';
    var low = keys.filter(function (key) { return indexes[key] && indexes[key].confidence === 'low'; }).length;
    var high = keys.filter(function (key) { return indexes[key] && indexes[key].confidence === 'high'; }).length;
    if (low >= 4) return 'low';
    if (high >= 2 || low <= 1) return 'high';
    return 'medium';
  }

  function _maturityMonthStart() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
  }

  function _maturityMonthEnd() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  }

  function _nextPendingStoneCelebration(events) {
    return (events || []).filter(function (event) {
      return event && event.id && event.celebrationPending === true && !event.celebrationShownAt;
    })[0] || null;
  }

  function _maturityCard(maturity, loading, error) {
    if (loading) return _maturityLoadingCard();
    maturity = maturity || _initialMaturity();
    var progress = _clamp(_number(maturity.stoneProgressPercent, 0), 0, 100);
    var current = maturity.currentStone || 'Pedra Bruta';
    var next = maturity.nextStone || _nextStone(current);
    var history = _state.businessMaturityEvents || [];
    return '<section class="stones-card ' + _esc(_stoneThemeClass(current)) + '" aria-label="Maturidade do negócio">' +
      '<div class="stones-card-main">' +
        '<div class="stones-symbol">' + _stoneGraphic(current, 'large') + '</div>' +
        '<div class="stones-copy">' +
          '<span class="seasons-section-label">Maturidade do Negócio</span>' +
          '<h2>' + _esc(current) + '</h2>' +
          '<p>' + _esc(STONE_DESCRIPTIONS[current] || STONE_DESCRIPTIONS['Pedra Bruta']) + '</p>' +
          _maturityStatusChips(maturity, current, next, progress) +
          (error ? '<small class="stones-note">Leitura inicial exibida; cálculo completo indisponível no momento.</small>' : '') +
        '</div>' +
      '</div>' +
      '<div class="stones-progress-panel">' +
        '<div class="stones-progress-top"><span>Caminho das Pedras</span><strong>' + _esc(current) + '</strong></div>' +
        _stoneJourney(current, next) +
        '<div class="stones-progress-line"><span style="width:' + progress + '%"></span></div>' +
        '<div class="stones-progress-meta"><strong>' + Math.round(progress) + '% até ' + _esc(next) + '</strong><span>As próximas Pedras aparecem como caminho ainda a percorrer.</span></div>' +
      '</div>' +
      _maturityChecklistBlock(maturity.checklist || []) +
      '<div class="stones-insights">' +
        _maturityInsightList('Pontos fortes', maturity.strengths || []) +
        _maturityInsightList('Pontos que limitam evolução', maturity.weaknesses || []) +
      '</div>' +
      _maturityDataSignalsBlock(maturity) +
      _maturityEvolutionBlock(history) +
    '</section>';
  }

  function _maturityDataSignalsBlock(maturity) {
    var cards = _maturityDataSignalCards(maturity || _initialMaturity());
    return '<div class="stones-data-signals">' +
      '<div class="stones-data-head">' +
        '<div>' +
          '<span class="seasons-section-label">O que sustenta sua Pedra</span>' +
          '<h3>O que já fortalece o negócio</h3>' +
          '<p>Esta leitura mostra o que já está dando sustentação ao negócio: vendas com ritmo, clientes voltando, dinheiro ficando no caixa, ações que viram pedido e uma rotina que ajuda a entregar melhor.</p>' +
        '</div>' +
        '<small>Baseada no que aconteceu no negócio</small>' +
      '</div>' +
      '<div class="stones-data-grid">' + cards.map(_maturityDataSignalCard).join('') + '</div>' +
    '</div>';
  }

  function _maturityBusinessHistoryBlock(maturity) {
    var history = maturity && maturity.businessHistory ? maturity.businessHistory : (_state.businessHistory || _emptyBusinessHistory());
    var periods = history.periods || {};
    var rolling30 = periods.rolling_30 || {};
    var previous30 = periods.previous_30 || {};
    var rolling90 = periods.rolling_90 || {};
    var rolling365 = periods.rolling_365 || {};
    var currentMonth = (history.monthly || [])[history.monthly.length - 1] || {};
    var lastYear = history.sameMonthLastYear || null;
    var snapshots = _state.businessHistorySnapshots || [];
    var revenueTrend = _businessHistoryTrend(rolling30.revenue, previous30.revenue);
    var cards = [
      {
        title: 'Últimos 30 dias',
        meta: _fmtMoney(rolling30.revenue || 0),
        text: _number(rolling30.ordersCount, 0) ? _number(rolling30.ordersCount, 0) + ' pedido(s), ticket médio de ' + _fmtMoney(rolling30.averageTicket || 0) + ' e ' + _number(rolling30.activeDays, 0) + ' dia(s) com venda.' : 'Ainda não há vendas suficientes nos últimos 30 dias.',
        tone: revenueTrend.tone,
        footer: revenueTrend.text
      },
      {
        title: 'Últimos 90 dias',
        meta: _fmtMoney(rolling90.revenue || 0),
        text: _number(rolling90.ordersCount, 0) ? 'Mostra se o negócio está criando ritmo além de uma semana boa ou ruim.' : 'A base de 90 dias ainda está se formando.',
        tone: _number(rolling90.ordersCount, 0) ? 'strong' : 'empty',
        footer: _number(rolling90.activeWeeks, 0) + ' semana(s) com movimento'
      },
      {
        title: 'Mês atual',
        meta: currentMonth.monthKey ? _businessHistoryMonthLabel(currentMonth.monthKey) : 'Sem mês',
        text: _number(currentMonth.ordersCount, 0) ? _fmtMoney(currentMonth.revenue || 0) + ' vendidos neste mês, com ' + _number(currentMonth.ordersCount, 0) + ' pedido(s).' : 'O mês atual ainda não tem movimento suficiente para comparar.',
        tone: _number(currentMonth.ordersCount, 0) ? 'medium' : 'empty',
        footer: _number(currentMonth.discountTotal, 0) ? 'Descontos no mês: ' + _fmtMoney(currentMonth.discountTotal) : 'Sem desconto relevante no mês'
      },
      {
        title: 'Memória anual',
        meta: _number(history.availableMonths, 0) + '/12 meses',
        text: history.hasFullYear ? 'Já existe um ano de base para comparar o negócio com mais segurança.' : 'O histórico anual ainda está sendo formado. Enquanto isso, a Pedra usa sinais recentes com mais cuidado.',
        tone: history.hasFullYear ? 'strong' : (_number(history.availableMonths, 0) ? 'light' : 'empty'),
        footer: lastYear ? 'Já existe comparação com o mesmo mês do ano anterior' : 'Sem comparação anual suficiente'
      }
    ];
    return '<div class="stones-history-used">' +
      '<div class="stones-data-head">' +
        '<div>' +
          '<span class="seasons-section-label">Histórico usado na leitura</span>' +
          '<h3>O que o BocaFood já consegue comparar</h3>' +
          '<p>Esta parte mostra a memória que já existe sobre o negócio. Quanto mais meses com movimento real, mais segura fica a leitura da Pedra.</p>' +
        '</div>' +
        '<small>' + _number(snapshots.length, 0) + ' registro(s) preservado(s)</small>' +
      '</div>' +
      '<div class="stones-history-grid">' + cards.map(_maturityBusinessHistoryCard).join('') + '</div>' +
      _maturityBusinessHistoryNotes(history, rolling365) +
    '</div>';
  }

  function _maturityBusinessHistoryCard(card) {
    card = card || {};
    return '<article class="stones-history-card stones-history-card-' + _esc(card.tone || 'empty') + '">' +
      '<div class="stones-history-card-top">' +
        '<h4>' + _esc(card.title || '') + '</h4>' +
        '<strong>' + _esc(card.meta || '') + '</strong>' +
      '</div>' +
      '<p>' + _esc(card.text || '') + '</p>' +
      '<small>' + _esc(card.footer || '') + '</small>' +
    '</article>';
  }

  function _maturityBusinessHistoryNotes(history, rolling365) {
    history = history || {};
    var notes = (history.notes || []).filter(Boolean).slice(0, 2);
    if (!notes.length && _number(rolling365.ordersCount, 0)) {
      notes.push('Os últimos 365 dias já ajudam a enxergar a direção geral do negócio.');
    }
    if (!notes.length) notes.push('A memória começa a ficar mais útil conforme pedidos, caixa e operação aparecem mês a mês.');
    return '<div class="stones-history-notes">' + notes.map(function (note) {
      return '<span>' + _esc(note) + '</span>';
    }).join('') + '</div>';
  }

  function _businessHistoryTrend(current, previous) {
    current = _money(current);
    previous = _money(previous);
    if (!current && !previous) return { tone: 'empty', text: 'Sem comparação recente' };
    if (!previous) return { tone: 'medium', text: 'Já existe movimento recente para acompanhar' };
    var diff = current - previous;
    var pct = previous ? Math.round((diff / previous) * 100) : 0;
    if (pct > 5) return { tone: 'strong', text: 'Subiu ' + pct + '% contra os 30 dias anteriores' };
    if (pct < -5) return { tone: 'light', text: 'Caiu ' + Math.abs(pct) + '% contra os 30 dias anteriores' };
    return { tone: 'medium', text: 'Ficou perto dos 30 dias anteriores' };
  }

  function _businessHistoryMonthLabel(monthKey) {
    var parts = String(monthKey || '').split('-');
    if (parts.length !== 2) return String(monthKey || '');
    var d = new Date(_number(parts[0], 0), _number(parts[1], 1) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
  }

  function _maturityDataSignalCards(maturity) {
    var signals = maturity.dataSignals || _emptyMaturityDataSignals();
    var indexes = maturity.indexes || _emptyMaturityIndexes();
    var seasons = maturity.seasonContributionSummary || _emptySeasonContributionSummary();
    var finance = signals.finance || {};
    var marketing = signals.marketing || {};
    var points = signals.loyaltyProgram || {};
    var reviews = signals.reviews || {};
    var operations = signals.operations || {};
    var orders = maturity.orderSummary || {};
    var hasRealOrders = _number(orders.totalOrders, 0) > 0;
    var healthyScore = _number(indexes.healthyGrowth && indexes.healthyGrowth.score, 0);
    var consistencyScore = _number(indexes.consistency && indexes.consistency.score, 0);
    var loyaltyScore = _number(indexes.loyalty && indexes.loyalty.score, 0);
    var actionOrders = _number(marketing.actionOrders, _number(marketing.couponOrders, 0) + _number(marketing.promotionOrders, 0) + _number(marketing.upsellOrders, 0));
    var seasonVictories = _number(seasons.successfulSeasons, 0) || (_number(seasons.totalVictories, 0) + _number(seasons.partialVictories, 0));
    var seasonUnstable = _number(seasons.unstable, 0);
    var seasonFailed = _number(seasons.failed, 0);

    return [
      {
        level: hasRealOrders ? (healthyScore || consistencyScore ? 'strong' : 'light') : 'empty',
        title: 'Vendas e pedidos',
        text: hasRealOrders ? 'Os pedidos reais começam a mostrar se o negócio está criando ritmo ou se ainda depende de poucos dias bons.' : 'Ainda não há pedidos reais para dizer que o negócio vendeu ou ganhou ritmo.',
        meta: hasRealOrders ? _number(orders.totalOrders, 0) + ' pedido(s) · ' + _number(orders.activeDays, 0) + ' dia(s) com venda' : 'Aguardando os primeiros pedidos'
      },
      {
        level: seasonVictories ? 'strong' : (_number(seasons.closedSeasons, 0) ? 'light' : 'empty'),
        title: 'Temporadas',
        text: _maturitySeasonSignalText(seasons),
        meta: seasonVictories + ' vitória(s) · ' + seasonUnstable + ' instável(is) · ' + seasonFailed + ' falha(s)'
      },
      {
        level: finance.hasData ? (finance.cashStatus === 'healthy' ? 'medium' : 'light') : 'empty',
        title: 'Financeiro',
        text: finance.hasData ? _maturityFinanceSignalText(finance) : 'Quando entradas, saídas e contas estiverem acompanhadas, fica mais claro se a venda está deixando dinheiro.',
        meta: finance.hasData ? 'Entrou ' + _fmtMoney(finance.entries) + ' · saiu ' + _fmtMoney(finance.exits) + ' · ficou ' + _fmtMoney(finance.net) : 'Sem caixa recente'
      },
      {
        level: actionOrders ? (marketing.impactStatus === 'heavy_discount' ? 'light' : 'medium') : (marketing.hasData ? 'light' : 'empty'),
        title: 'Ações de venda',
        text: _maturityMarketingSignalText(marketing),
        meta: actionOrders ? actionOrders + ' pedido(s) com ação · ' + _fmtMoney(marketing.netRevenue) + ' depois dos descontos' : _number(marketing.configuredActions, _number(marketing.activePromotions, 0) + _number(marketing.activeCoupons, 0) + _number(marketing.activeUpsells, 0)) + ' ação(ões) prontas, ainda sem venda'
      },
      {
        level: loyaltyScore || points.redemptionOrders ? 'medium' : (points.hasData ? 'light' : 'empty'),
        title: 'Clientes e pontos',
        text: _maturityLoyaltySignalText(loyaltyScore, points),
        meta: points.hasData ? _number(points.customers, 0) + ' cliente(s) com pontos · ' + _number(points.redemptionOrders, 0) + ' pedido(s) usando pontos' : 'Relação com clientes em formação'
      },
      {
        level: reviews.approved ? (reviews.trustStatus === 'attention' ? 'light' : 'medium') : 'empty',
        title: 'Avaliações',
        text: _maturityReviewSignalText(reviews),
        meta: reviews.approved ? _number(reviews.approved, 0) + ' opinião(ões) · nota ' + _number(reviews.averageRating, 0).toFixed(1).replace('.', ',') + ' · ' + _number(reviews.productMentions, 0) + ' citam produto' : 'Ainda sem opinião de cliente'
      },
      {
        level: operations.operationStatus === 'supporting' ? 'medium' : (operations.hasData ? 'light' : 'empty'),
        title: 'Rotina, estoque e produção',
        text: _maturityOperationsSignalText(operations),
        meta: operations.hasData ? _number(operations.stockMovements, 0) + ' movimento(s) · ' + _number(operations.completedProductions, 0) + ' produção(ões) · ' + _number(operations.completedPurchases, 0) + ' compra(s)' : 'Rotina ainda sem histórico'
      }
    ];
  }

  function _maturityDataSignalCard(card) {
    card = card || {};
    var level = card.level || 'empty';
    return '<article class="stones-data-item stones-data-item-' + _esc(level) + '">' +
      '<div class="stones-data-mark"><span></span></div>' +
      '<div class="stones-data-copy">' +
        '<div><h4>' + _esc(card.title || '') + '</h4><small>' + _esc(_maturityDataSignalLevelLabel(level)) + '</small></div>' +
        '<p>' + _esc(card.text || '') + '</p>' +
        '<strong>' + _esc(card.meta || '') + '</strong>' +
      '</div>' +
    '</article>';
  }

  function _maturitySeasonSignalText(seasons) {
    seasons = seasons || {};
    var victories = _number(seasons.successfulSeasons, 0) || (_number(seasons.totalVictories, 0) + _number(seasons.partialVictories, 0));
    var unstable = _number(seasons.unstable, 0);
    var failed = _number(seasons.failed, 0);
    var abandoned = _number(seasons.abandoned, 0);
    if (victories) {
      return 'Já houve temporada com vitória. Isso mostra que o negócio conseguiu escolher um foco, agir e transformar em avanço real.';
    }
    if (unstable || failed) {
      return 'As temporadas trouxeram aprendizado, mas ainda ficaram instáveis ou falharam. Elas ajudam a enxergar o caminho, mas ainda não mostram vitória.';
    }
    if (abandoned) {
      return 'Houve temporada abandonada. Para fortalecer a Pedra, o negócio precisa fechar um ciclo até o fim e sair dele com avanço real.';
    }
    return 'A temporada ajuda a transformar intenção em ação. Para fortalecer a Pedra, precisa terminar com vitória total ou parcial.';
  }

  function _maturityFinanceSignalText(finance) {
    finance = finance || {};
    if (finance.overduePayables > 0) {
      return 'Entrou dinheiro, mas contas vencidas ainda atrapalham a sensação de controle.';
    }
    if (finance.net < 0) {
      return 'Nos últimos lançamentos, saiu mais dinheiro do que entrou.';
    }
    if (finance.pendingPayables > 0) {
      return 'Sobrou dinheiro no caixa recente, mas ainda existem contas em aberto para acompanhar.';
    }
    return 'As vendas começam a mostrar se estão deixando dinheiro no negócio, não só movimento.';
  }

  function _maturityMarketingSignalText(marketing) {
    marketing = marketing || {};
    if (!marketing.hasData) return 'Ainda não há promoção, cupom ou oferta puxando venda. Quando uma ação aparece em pedido real, ela começa a fortalecer o negócio.';
    if (!marketing.actionOrders) return 'As ações já estão prontas, mas ainda não viraram venda. Por enquanto mostram preparo, não resultado.';
    if (marketing.impactStatus === 'heavy_discount') return 'As ações venderam, mas o desconto ficou pesado. Isso movimenta, porém pode reduzir o ganho da venda.';
    if (marketing.upsellOrders > 0 && marketing.netRevenue > 0) return 'Ofertas, cupons ou upsell já ajudaram a vender mais em pedidos reais.';
    return 'Promoções, cupons ou upsell já apareceram em pedidos. Isso mostra que a ação saiu da ideia e virou movimento.';
  }

  function _maturityLoyaltySignalText(loyaltyScore, points) {
    points = points || {};
    if (loyaltyScore) return 'Clientes voltando a comprar mostram que existe relação com o negócio, não apenas venda avulsa.';
    if (points.redemptionOrders > 0) return 'Clientes já voltaram para comprar usando pontos. Isso mostra que o programa começou a puxar recompra.';
    if (points.hasData) return 'Clientes estão juntando pontos. Esse sinal fica mais forte quando eles voltam para usar e comprar de novo.';
    return 'Ainda falta cliente voltando para comprar de novo. Quando a recompra aparecer, a fidelização ganha força.';
  }

  function _maturityReviewSignalText(reviews) {
    reviews = reviews || {};
    if (!reviews.approved) return 'Ainda falta opinião de cliente para mostrar confiança para novas pessoas comprarem.';
    if (reviews.trustStatus === 'attention') return 'Já existem opiniões, mas a nota mostra que a experiência precisa melhorar antes de virar força.';
    if (reviews.attentionRatings > 0 && reviews.averageRating >= 4.5) return 'A maioria das opiniões está muito boa. Existe só um ponto de atenção para acompanhar sem virar limitador.';
    if (reviews.productMentions > 0) return 'Clientes citaram produtos nas avaliações. Isso ajuda outras pessoas a confiar e também mostra o que gera desejo.';
    return 'Opiniões positivas mostram que a experiência está agradando e ajudam a fortalecer a confiança.';
  }

  function _maturityOperationsSignalText(operations) {
    operations = operations || {};
    if (!operations.hasData) return 'Ainda falta registrar compras, produção ou estoque para entender se a rotina sustenta as vendas.';
    if (operations.operationStatus === 'supporting') return 'Compras, produção ou estoque já mostram mais controle. Isso reduz improviso e ajuda a crescer com mais segurança.';
    return 'Já existem registros, mas ainda falta repetir essa rotina mais vezes para ela virar uma força real do negócio.';
  }

  function _maturityDataSignalLevelLabel(level) {
    if (level === 'strong') return 'Bom sinal';
    if (level === 'medium') return 'Ajuda a Pedra';
    if (level === 'light') return 'Ainda fraco';
    return 'Ainda sem base';
  }

  function _maturityLoadingCard() {
    return '<section class="stones-card stones-card-loading stone-theme-pedra-bruta" aria-label="Carregando maturidade"><div class="stones-card-main"><div class="stones-symbol">' + _stoneGraphic('Pedra Bruta', 'large') + '</div><div class="stones-copy"><span class="seasons-section-label">Maturidade do Negócio</span><h2>Pedra Bruta</h2><p>Calculando leitura inicial de evolução do negócio.</p></div></div></section>';
  }

  function _maturityStatusChips(maturity, current, next, progress) {
    var summary = maturity.checklistSummary || {};
    return '<div class="stones-status-chips">' +
      '<span><small>Pedra atual</small><strong>' + _esc(current) + '</strong></span>' +
      '<span><small>Próxima etapa</small><strong>' + _esc(next) + '</strong></span>' +
      '<span><small>Progresso</small><strong>' + Math.round(progress) + '%</strong></span>' +
      '<span><small>Marcos</small><strong>' + _number(summary.completed, 0) + '/' + _number(summary.total, 0) + '</strong></span>' +
    '</div>';
  }

  function _stoneJourney(current, next) {
    var currentIndex = STONES_ORDER.indexOf(current);
    if (currentIndex < 0) currentIndex = 0;
    return '<div class="stones-journey" aria-label="Caminhada completa das Pedras">' + STONES_ORDER.map(function (stone, index) {
      var state = index < currentIndex ? 'done' : (index === currentIndex ? 'current' : 'future');
      var label = index === currentIndex ? 'Você está aqui' : (stone === next ? 'Próxima' : (index < currentIndex ? 'Percorrida' : 'A percorrer'));
      return '<div class="stones-journey-step stones-journey-' + state + ' ' + _esc(_stoneThemeClass(stone)) + '">' +
        '<span class="stones-journey-mark">' + _stoneGraphic(stone, 'small') + '</span>' +
        '<strong>' + _esc(stone) + '</strong>' +
        '<small>' + _esc(label) + '</small>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _maturityInsightList(title, items) {
    items = (items || []);
    if (!items.length) items = ['Ainda sem dados suficientes para leitura.'];
    return '<div class="stones-insight-list"><h3>' + _esc(title) + '</h3><ul>' + items.map(function (item) {
      return '<li>' + _esc(item) + '</li>';
    }).join('') + '</ul></div>';
  }

  function _maturityEvolutionBlock(events) {
    var latest = (events || [])[0];
    if (!latest) {
      return '<div class="stones-evolution-card stones-evolution-empty">' +
        '<div><span class="seasons-section-label">Evolução recente</span><h3>Ainda sem subida de Pedra</h3><p>Quando o negócio evoluir, o histórico ficará disponível aqui.</p></div>' +
        '<button class="seasons-secondary-button" type="button" onclick="Modules.Temporadas.openStoneEvolutionHistory()">Histórico de evolução</button>' +
      '</div>';
    }
    return '<div class="stones-evolution-card">' +
      '<div class="stones-evolution-path">' +
        '<span class="' + _esc(_stoneThemeClass(latest.fromStone)) + '">' + _esc(latest.fromStone || 'Pedra anterior') + '</span>' +
        '<b>→</b>' +
        '<span class="' + _esc(_stoneThemeClass(latest.toStone)) + '">' + _esc(latest.toStone || 'Nova Pedra') + '</span>' +
      '</div>' +
      '<div class="stones-evolution-copy">' +
        '<span class="seasons-section-label">Evolução recente</span>' +
        '<h3>' + _esc(latest.fromStone || 'Pedra') + ' → ' + _esc(latest.toStone || 'Pedra') + '</h3>' +
        '<p>' + _esc(latest.reason || 'Evolução registrada a partir dos indicadores de maturidade.') + '</p>' +
        '<small>' + _esc(_formatDateTime(latest.createdAt || latest.upgradedAt) || 'Data em processamento') + '</small>' +
      '</div>' +
      '<button class="seasons-secondary-button" type="button" onclick="Modules.Temporadas.openStoneEvolutionHistory()">Histórico de evolução</button>' +
    '</div>';
  }

  function _maturityChecklistBlock(checklist) {
    checklist = (checklist || []).slice().sort(function (a, b) {
      var weight = { limited: 0, pending: 1, completed: 2 };
      return (weight[a.status] || 1) - (weight[b.status] || 1);
    });
    if (!checklist.length) checklist = _initialChecklist();
    return '<div class="stones-checklist" aria-label="Caminho da Pedra">' +
      '<div class="stones-checklist-head">' +
        '<div><span class="seasons-section-label">Caminho da Pedra</span><h3>Marcos do negócio</h3></div>' +
      '</div>' +
      '<div class="stones-checklist-list">' +
        checklist.map(_maturityChecklistItem).join('') +
      '</div>' +
    '</div>';
  }

  function _maturityChecklistItem(item) {
    item = item || {};
    var status = item.status || (item.completed ? 'completed' : 'pending');
    var symbol = status === 'completed' ? '✓' : (status === 'limited' ? '!' : '•');
    var evidence = item.evidence && item.evidence.message ? item.evidence.message : (item.description || '');
    return '<article class="stones-checklist-item stones-checklist-item-' + _esc(status) + '">' +
      '<span class="stones-checklist-mark">' + _esc(symbol) + '</span>' +
      '<div>' +
        '<strong>' + _esc(item.title || 'Marco de evolução') + '</strong>' +
        '<p>' + _esc(evidence) + '</p>' +
      '</div>' +
    '</article>';
  }

  function _seasonStoneImpactBlock(season) {
    if (!season || (season.status !== 'finished' && season.status !== 'abandoned')) return '';
    var maturity = _state.businessMaturity || _initialMaturity();
    var storedImpact = maturity.lastSeasonImpact || {};
    var impact = storedImpact.seasonId && storedImpact.seasonId === season.id
      ? storedImpact
      : _seasonMaturityImpact(season);
    var current = maturity.currentStone || 'Pedra Bruta';
    var next = maturity.nextStone || _nextStone(current);
    var after = _clamp(_number(maturity.stoneProgressPercent, 0), 0, 100);
    var matchedLast = impact.seasonId && impact.seasonId === storedImpact.seasonId;
    var before = matchedLast && maturity.previousStoneProgressPercent !== undefined
      ? _clamp(_number(maturity.previousStoneProgressPercent, after), 0, 100)
      : _clamp(after - Math.max(0, _number(impact.impactPercent, 0)), 0, 100);
    var contribution = _number(impact.impactPercent, 0);
    var contributionClass = contribution > 0 ? 'positive' : (contribution < 0 ? 'limited' : 'neutral');
    return '<section class="stones-season-impact" aria-label="Impacto na sua Pedra">' +
      '<div class="stones-season-impact-head">' +
        '<div>' +
          '<span class="seasons-section-label">Impacto na sua Pedra</span>' +
          '<h4>' + _esc(current) + ' → ' + _esc(next) + '</h4>' +
          '<p>' + _esc(impact.reason || 'Impacto calculado com base no resultado final, score, risco e dificuldade da temporada.') + '</p>' +
        '</div>' +
        '<strong class="' + contributionClass + '">' + _esc(_seasonImpactLabel(contribution)) + '</strong>' +
      '</div>' +
      '<div class="stones-season-progress">' +
        '<div><span>Antes</span><strong>' + Math.round(before) + '%</strong></div>' +
        '<div class="stones-progress-line"><span style="width:' + after + '%"></span></div>' +
        '<div><span>Depois</span><strong>' + Math.round(after) + '%</strong></div>' +
      '</div>' +
      '<div class="stones-season-impact-meta">' +
        _seasonImpactPill('Resultado', impact.finalResult || season.finalResult || _statusLabel(season.status)) +
        _seasonImpactPill('Score', impact.finalScore ? String(impact.finalScore) : String(Math.round(_number(season.finalScore, season.currentScore || 0)))) +
        _seasonImpactPill('Risco', _riskLabel(impact.riskLevel || season.riskLevel)) +
        _seasonImpactPill('Dificuldade', _difficultyLabel(impact.difficulty || season.difficulty)) +
      '</div>' +
    '</section>';
  }

  function _seasonImpactLabel(value) {
    value = Math.round(_number(value, 0));
    if (value > 0) return '+' + value + ' p.p.';
    if (value < 0) return value + ' p.p.';
    return '0 p.p.';
  }

  function _seasonImpactPill(label, value) {
    return '<span><small>' + _esc(label) + '</small><strong>' + _esc(value || 'Não calculado') + '</strong></span>';
  }

  function _validStone(stone) {
    return STONES_ORDER.indexOf(stone) >= 0 ? stone : '';
  }

  function _nextStone(stone) {
    var idx = STONES_ORDER.indexOf(stone);
    if (idx < 0) return 'Quartzo';
    return STONES_ORDER[Math.min(idx + 1, STONES_ORDER.length - 1)] || 'Quartzo';
  }

  function _stoneInitial(stone) {
    if (stone === 'Pedra Bruta') return 'PB';
    if (stone === 'Ônix') return 'Ô';
    return String(stone || 'P').charAt(0).toUpperCase();
  }

  function _stoneGraphic(stone, size) {
    return '<span class="stones-gem stones-gem-' + _esc(size || 'md') + ' ' + _esc(_stoneThemeClass(stone)) + '" aria-hidden="true">' +
      '<i class="stones-gem-top"></i><i class="stones-gem-left"></i><i class="stones-gem-right"></i><i class="stones-gem-core"></i>' +
    '</span>';
  }

  function _stoneThemeClass(stone) {
    return 'stone-theme-' + String(stone || 'pedra')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function _maturityTimestamp() {
    return window.firebase && firebase.firestore && firebase.firestore.FieldValue
      ? firebase.firestore.FieldValue.serverTimestamp()
      : new Date().toISOString();
  }

  function _maturityMonthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function _dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function _weekKey(date) {
    var first = new Date(date.getFullYear(), 0, 1);
    var day = Math.floor((date - first) / 86400000);
    return date.getFullYear() + '-W' + Math.ceil((day + first.getDay() + 1) / 7);
  }

  function _loadingCard() {
    return '' +
      '<section class="seasons-active-card" aria-label="Carregando temporada ativa">' +
        '<div class="seasons-loading-box">' +
          _icon('hourglass_top') +
          '<div><strong>Carregando Temporadas</strong><p>Preparando as temporadas da sua operação.</p></div>' +
        '</div>' +
      '</section>';
  }

  function _historyLoadingCard() {
    return '' +
      '<section class="seasons-history-card" aria-label="Carregando histórico">' +
        '<div class="seasons-card-head">' +
          '<div><span class="seasons-section-label">Histórico</span><h2>Temporadas anteriores</h2></div>' +
        '</div>' +
        '<div class="seasons-history-empty">' + _icon('hourglass_top') + '<div><strong>Carregando histórico</strong><p>Aguardando retorno da coleção seasons.</p></div></div>' +
      '</section>';
  }

  function _scheduledLoadingCard() {
    return '' +
      '<section class="seasons-history-card" aria-label="Carregando temporadas programadas">' +
        '<div class="seasons-card-head">' +
          '<div><span class="seasons-section-label">Programadas</span><h2>Temporadas futuras</h2></div>' +
        '</div>' +
        '<div class="seasons-history-empty">' + _icon('hourglass_top') + '<div><strong>Carregando programadas</strong><p>Aguardando retorno da coleção seasons.</p></div></div>' +
      '</section>';
  }

  function _errorCard(err) {
    return '' +
      '<section class="seasons-active-card" aria-label="Erro ao carregar temporadas">' +
        '<div class="seasons-loading-box seasons-error-box">' +
          _icon('error') +
          '<div><strong>Não foi possível carregar Temporadas</strong><p>' + _esc((err && err.message) || err || 'Erro desconhecido') + '</p></div>' +
        '</div>' +
      '</section>';
  }

  function _emptyActiveCard() {
    return '' +
      '<section class="seasons-active-card" aria-label="Temporada ativa">' +
        '<div class="seasons-active-grid">' +
          '<div class="seasons-empty-mark">' + _icon('flag') + '</div>' +
          '<div class="seasons-empty-copy">' +
            '<span class="seasons-section-label">Temporada ativa</span>' +
            '<h2>Nenhuma temporada ativa</h2>' +
            '<p>Crie uma temporada para transformar sua rota em ações práticas. O BocaFood acompanha os pedidos reais e mostra o que fazer para avançar.</p>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function _activeSeasonCard(season) {
    var metrics = season.currentMetrics || {};
    var snapshots = season.snapshotState || _state.snapshots || {};
    var recommendation = _recommendationFromSnapshots(snapshots);
    var tab = _validSeasonTab(season, _state.activeTab);
    return '' +
      '<section class="seasons-active-card" aria-label="Temporada ativa">' +
        _seasonHud(season, metrics) +
        (_state.activeConflict ? '<div class="seasons-warning-line">' + _icon('warning') + ' Mais de uma temporada ativa foi encontrada neste tenant. A próxima fase deve corrigir o dado antes de iniciar outra temporada.</div>' : '') +
        _seasonTabs(season, tab) +
        '<div class="seasons-tab-panel">' + _seasonTabContent(tab, season, metrics, snapshots, recommendation) + '</div>' +
      '</section>';
  }

  function _seasonHud(season, metrics) {
    var progress = _number(season.progressPercent, 0);
    return '' +
      '<div class="seasons-hud">' +
        '<div class="seasons-hud-symbol">' + _icon('assistant_direction') + '</div>' +
        '<div class="seasons-hud-main">' +
          '<span class="seasons-section-label">Painel da Temporada</span>' +
          '<h2>' + _esc(season.title || 'Temporada sem título') + '</h2>' +
          '<p>' + _esc(_formatPeriod(season.startDate, season.endDate)) + '</p>' +
          '<div class="seasons-hud-tags">' +
            _hudTag('Objetivo', _objectiveLabel(season.objective)) +
            _hudTag('Prioridade', _buildLabel(season.build)) +
            _hudTag('Dificuldade', _difficultyLabel(season.difficulty)) +
          '</div>' +
        '</div>' +
        '<div class="seasons-hud-metrics">' +
          _hudMetric('Score', Math.round(_number(season.currentScore, 0))) +
          _hudMetric('Ritmo Atual', _statusScoreLabel(season.currentStatus)) +
          _hudMetric('Progresso', Math.round(progress) + '%') +
          _hudMetric('Dias restantes', _number(metrics.daysRemaining, 0)) +
        '</div>' +
        '<div class="seasons-hud-actions">' +
          '<button class="seasons-help-button" type="button" onclick="Modules.Temporadas.openHelpModal()" aria-label="Como ler esta temporada"><span>?</span> Como ler</button>' +
          (season.status === 'active' ? '<button class="seasons-secondary-button seasons-finish-button" type="button" onclick="Modules.Temporadas.finishActiveSeason()">' + _icon('flag_check') + ' Finalizar</button>' : '') +
        '</div>' +
      '</div>';
  }

  function _hudTag(label, value) {
    return '<span><small>' + _esc(label) + '</small>' + _esc(value) + '</span>';
  }

  function _hudMetric(label, value) {
    return '<div><small>' + _esc(label) + '</small><strong>' + _esc(value === 0 ? '0' : value || '0') + '</strong></div>';
  }

  function _seasonTabs(season, activeTab) {
    var tabs = [
      { key: 'overview', label: 'Visão Geral', icon: 'dashboard' },
      { key: 'next', label: 'Próxima Jogada', icon: 'assistant_direction' }
    ];
    if (season.status === 'finished') tabs.push({ key: 'final', label: 'Resultado Final', icon: 'flag_check' });
    return '<nav class="seasons-inner-tabs" aria-label="Navegação da temporada">' + tabs.map(function (tab) {
      return '<button type="button" class="' + (activeTab === tab.key ? 'active' : '') + '" onclick="Modules.Temporadas._setSeasonTab(\'' + tab.key + '\')">' + _icon(tab.icon) + _esc(tab.label) + '</button>';
    }).join('') + '</nav>';
  }

  function _seasonTabContent(tab, season, metrics, snapshots, recommendation) {
    if (tab === 'next') return _nextMoveTab(season, metrics, recommendation);
    if (tab === 'analysis') return _analysisTab(season, snapshots);
    if (tab === 'final') return _finalResultInline(season);
    return _overviewTab(season, metrics, snapshots, recommendation);
  }

  function _overviewTab(season, metrics, snapshots, recommendation) {
    var progress = _number(season.progressPercent, 0);
    var primaryLabels = _primaryMetricLabels(season.objective);
    var expected = _number(metrics.expectedProgress, 0);
    var score = Math.round(_number(season.currentScore, 0));
    var scoreBreakdown = _scoreBreakdownForDisplay(season, metrics);
    var seasonReading = _seasonReadingForDisplay(season, metrics, scoreBreakdown);
    return '' +
      '<div class="seasons-active-reading">' +
        '<section class="seasons-reading-hero seasons-reading-hero-' + _esc(_seasonSituationTone(season, metrics, progress)) + '">' +
          '<div>' +
            '<span class="seasons-section-label">Resumo da temporada</span>' +
            '<h3>' + _esc(seasonReading.headline) + '</h3>' +
            '<p>' + _esc(_seasonSituationText(season, metrics, progress)) + '</p>' +
          '</div>' +
          '<strong>' + Math.round(progress) + '%</strong>' +
        '</section>' +
        _seasonSalesPlanChart(season, metrics) +
        '<div class="seasons-reading-grid">' +
          _readingCard('Meta e progresso', 'flag', [
            _readingFact('Meta', _formatMetricValue(metrics.targetValue, season.objective)),
            _readingFact('Atual', _formatMetricValue(metrics.currentValue, season.objective)),
            _readingFact('Esperado para hoje', expected > 0 ? Math.round(expected) + '%' : 'Em início')
          ], _progressBalloonText(season, metrics, progress)) +
          _readingCard('Score da temporada', 'speed', [
            _readingFact('Score', score + '/100'),
            _readingFact('Leitura', _scoreSimpleReading(scoreBreakdown, season, metrics))
          ], _scoreBalloonText(season, metrics, scoreBreakdown)) +
          _readingCard('Chance de falha', 'warning', [
            _readingFactHtml('Chance de falha', _riskBadge(season.riskLevel)),
            _readingFact('Dias restantes', String(Math.round(_number(metrics.daysRemaining, 0)))),
            _readingFact('Ritmo', _statusScoreLabel(season.currentStatus))
          ], _riskBalloonText(season, metrics, progress)) +
          _readingCard('Base observada', 'analytics', [
            _readingFact('Pedidos', String(Math.round(_number(metrics.orders, 0)))),
            _readingFact('Ticket médio', _fmtMoney(metrics.averageTicket))
          ], 'Aqui você vê os pedidos reais que alimentam a leitura. Esta base ajuda a explicar progresso, score e risco, mas não é o resultado final da temporada.') +
        '</div>' +
        '<div class="seasons-reading-columns">' +
          _readingListBlock('O que está ajudando', 'thumb_up', seasonReading.helpingSignals) +
          _readingListBlock('O que está travando', 'report', seasonReading.blockingSignals) +
        '</div>' +
      '</div>' +
      _quickAlerts(snapshots);
  }

  function _seasonSalesPlanChart(season, metrics) {
    var plan = season && season.planConnection || {};
    var planned = _number(plan.routeTarget, 0);
    var realized = _number(metrics && metrics.revenue, 0);
    if (planned <= 0 && season && season.objective === 'sell_more') planned = _number(metrics && metrics.targetValue, 0);
    if (planned <= 0) return '';
    var pct = planned > 0 ? _clamp((realized / planned) * 100, 0, 140) : 0;
    var barPct = Math.min(100, pct);
    var remaining = Math.max(0, planned - realized);
    var label = pct >= 100 ? 'Venda do período alcançada' : 'Faltam ' + _fmtMoney(remaining) + ' para a venda planejada do período';
    return '' +
      '<section class="seasons-sales-plan-card" aria-label="Venda planejada e realizada">' +
        '<div class="seasons-sales-plan-head">' +
          '<div>' +
            '<span class="seasons-section-label">Venda do período</span>' +
            '<h3>Planejado x realizado</h3>' +
            '<p>' + _esc(label) + '</p>' +
          '</div>' +
          '<strong>' + Math.round(pct) + '%</strong>' +
        '</div>' +
        '<div class="seasons-sales-plan-values">' +
          '<span><small>Planejado</small><strong>' + _esc(_fmtMoney(planned)) + '</strong></span>' +
          '<span><small>Realizado</small><strong>' + _esc(_fmtMoney(realized)) + '</strong></span>' +
        '</div>' +
        '<div class="seasons-sales-plan-bar"><i style="width:' + barPct + '%"></i></div>' +
      '</section>';
  }

  function _seasonSituationTone(season, metrics, progress) {
    var ratio = _number(metrics.progressRatio, 0);
    var risk = season.riskLevel || 'unknown';
    if (progress >= 100 || ratio >= 1.1) return 'good';
    if (_isSeasonEarlyReading(season, metrics)) return 'steady';
    if (risk === 'high' || risk === 'very_high' || ratio < .5) return 'danger';
    if (ratio < .8 || risk === 'medium') return 'attention';
    return 'steady';
  }

  function _isSeasonEarlyReading(season, metrics) {
    metrics = metrics || {};
    var orders = Math.round(_number(metrics.orders, 0));
    var elapsed = Math.round(_number(metrics.elapsedDays, 0));
    var expected = _number(metrics.expectedProgress, 0);
    var status = _statusScoreLabel(season && season.currentStatus);
    return orders < 2 && (elapsed <= 2 || expected <= 0 || status === 'Em início');
  }

  function _seasonSituationTitle(season, metrics, progress) {
    var ratio = _number(metrics.progressRatio, 0);
    if (progress >= 100) return 'Sua temporada já bateu a meta.';
    if (ratio >= 1.1) return 'Sua temporada está acima do ritmo esperado.';
    if (ratio >= .8) return 'Sua temporada está perto do ritmo esperado.';
    if (ratio >= .5) return 'Sua temporada está abaixo do ritmo esperado.';
    return 'Sua temporada precisa de atenção agora.';
  }

  function _seasonSituationText(season, metrics, progress) {
    var expected = _number(metrics.expectedProgress, 0);
    var current = Math.round(_number(progress, 0));
    if (progress >= 100) return 'A meta principal foi alcançada. Agora vale manter o ritmo e observar o que puxou esse resultado.';
    if (_isSeasonEarlyReading(season, metrics)) {
      var risk = season && (season.initialRiskLevel || season.riskLevel);
      if (risk === 'high' || risk === 'very_high') return 'A rota é exigente, mas ainda é cedo para tratar a temporada como atrasada. Assim que entrarem pedidos, o BocaFood compara produto, canal e ritmo com mais precisão.';
      return 'Ainda é o começo da temporada. Assim que entrarem pedidos, o BocaFood identifica produto, canal e ritmo com mais precisão.';
    }
    if (expected > 0) return 'Até hoje, o ideal era estar perto de ' + Math.round(expected) + '%. A temporada está em ' + current + '%.';
    return 'Ainda há poucos dados para comparar com segurança. Conforme novos pedidos entrarem, esta leitura fica mais precisa.';
  }

  function _readingCard(title, icon, facts, note) {
    return '' +
      '<article class="seasons-reading-card ' + (note ? 'seasons-reading-card-clickable' : '') + '" ' + (note ? 'role="button" tabindex="0" onclick="Modules.Temporadas.toggleMetricBalloon(this)" onkeydown="Modules.Temporadas._metricTileKey(event,this)"' : '') + '>' +
        '<div class="seasons-reading-card-head">' +
          '<span>' + _icon(icon) + '</span>' +
          '<strong>' + _esc(title) + '</strong>' +
        '</div>' +
        '<div class="seasons-reading-facts">' + (facts || []).join('') + '</div>' +
        (note ? '<div class="seasons-metric-balloon seasons-reading-balloon" hidden><small>Como ler</small><p>' + _esc(note) + '</p></div>' : '') +
      '</article>';
  }

  function _readingFact(label, value) {
    return '<div><small>' + _esc(label) + '</small><strong>' + _esc(value === 0 ? '0' : value || '-') + '</strong></div>';
  }

  function _readingFactHtml(label, html) {
    return '<div><small>' + _esc(label) + '</small><strong>' + (html || '-') + '</strong></div>';
  }

  function _riskBadge(risk) {
    return '<span class="seasons-risk-badge seasons-risk-badge-' + _esc(risk || 'unknown') + '">' + _esc(_riskLabel(risk)) + '</span>';
  }

  function _impactBadge(value) {
    var score = Math.max(0, Math.round(_number(value, 0)));
    var tone = score >= 5 ? 'strong' : (score > 0 ? 'medium' : 'neutral');
    return '<span class="seasons-impact-badge seasons-impact-badge-' + tone + '">+' + score + '</span>';
  }

  function _readingListBlock(title, icon, items) {
    items = items && items.length ? items : ['Ainda não há dados suficientes para destacar este ponto.'];
    return '' +
      '<section class="seasons-reading-list">' +
        '<div class="seasons-reading-card-head"><span>' + _icon(icon) + '</span><strong>' + _esc(title) + '</strong></div>' +
        '<ul>' + items.slice(0, 4).map(function (item) { return '<li>' + _esc(item) + '</li>'; }).join('') + '</ul>' +
      '</section>';
  }

  function _readingNextAction(season, metrics, recommendation, seasonReading) {
    var executionPlan = _executionPlanForDisplay(season, metrics, seasonReading);
    var actions = executionPlan.actions || [];
    var primaryAction = actions[0] || null;
    var title = recommendation && (recommendation.title || recommendation.headline) ? (recommendation.title || recommendation.headline) : 'Próxima melhor ação';
    var text = recommendation && (recommendation.description || recommendation.nextAction) ? (recommendation.description || recommendation.nextAction) : ((seasonReading && seasonReading.nextAction) || (primaryAction && primaryAction.description) || _seasonDefaultNextAction(season, metrics));
    return '' +
      '<section class="seasons-reading-next">' +
        '<div class="seasons-reading-card-head"><span>' + _icon('assistant_direction') + '</span><strong>Próxima melhor ação</strong></div>' +
        '<h4>' + _esc(title) + '</h4>' +
        '<p>' + _esc(text) + '</p>' +
        (actions.length ? _executionPlanList(executionPlan) : '') +
      '</section>';
  }

  function _executionPlanForDisplay(season, metrics, seasonReading) {
    return season && season.executionPlan || metrics && metrics.executionPlan || seasonReading && seasonReading.executionPlan || {};
  }

  function _executionPlanList(executionPlan) {
    var profile = executionPlan.difficultyProfile || {};
    var actions = (executionPlan.actions || []).slice(0, 3);
    if (!actions.length) return '';
    return '' +
      '<div class="seasons-execution-plan">' +
        '<div class="seasons-execution-plan-head">' +
          '<strong>' + _esc(profile.label ? 'Plano ' + profile.label : 'Plano prático') + '</strong>' +
          '<span>' + _esc(profile.cadence || 'Ações da temporada') + '</span>' +
        '</div>' +
        '<ul>' + actions.map(function (action) {
          return '<li>' +
            '<div><strong>' + _esc(action.title || 'Ação') + '</strong><p>' + _esc(action.description || '') + '</p></div>' +
            (action.why ? '<small>' + _esc(action.why) + '</small>' : '') +
          '</li>';
        }).join('') + '</ul>' +
      '</div>';
  }

  function _seasonHelpingItems(season, metrics) {
    var items = [];
    var topProduct = (metrics.topProducts || [])[0];
    var strongHour = (metrics.strongHours || [])[0];
    var ticket = _number(metrics.averageTicket, 0);
    var baselineTicket = _number(season && season.baselineAverageTicket, 0);
    var targetTicket = season && season.objective === 'increase_ticket' ? _number(metrics.targetValue || season.calculatedTargetValue, 0) : 0;
    var recurring = Math.round(_number(metrics.recurringCustomers, 0));
    var repurchaseRate = _number(metrics.repurchaseRate, 0);
    var activeDays = Math.round(_number(metrics.activeDays, 0));

    if (topProduct && topProduct.name) items.push(topProduct.name + ' está puxando as vendas desta temporada.');
    if (strongHour && strongHour.hour !== undefined) items.push('O horário perto de ' + _formatHourLabel(strongHour.hour) + ' aparece como um dos melhores momentos.');
    if (ticket > 0 && baselineTicket > 0 && ticket > baselineTicket) items.push('O ticket médio está acima da base anterior: ' + _fmtMoney(ticket) + '.');
    else if (ticket > 0 && targetTicket > 0 && ticket >= targetTicket) items.push('O ticket médio já está no nível esperado para esta temporada.');
    if (_isMeaningfulRecurrence(recurring, repurchaseRate)) items.push(recurring + ' clientes voltaram a comprar no período.');
    if (activeDays > 0) items.push('A operação já teve venda em ' + activeDays + ' dia(s) desta temporada.');
    return items;
  }

  function _isMeaningfulRecurrence(recurringCustomers, repurchaseRate) {
    var recurring = Math.round(_number(recurringCustomers, 0));
    var rate = _number(repurchaseRate, 0);
    return recurring >= 2 && rate >= .15;
  }

  function _seasonBlockingItems(season, metrics, progress) {
    var items = [];
    var expected = _number(metrics.expectedProgress, 0);
    var weakDays = Math.round(_number(metrics.weakDays, 0));
    var ratio = _number(metrics.progressRatio, 0);
    var orders = Math.round(_number(metrics.orders, 0));
    var ticket = _number(metrics.averageTicket, 0);
    var baselineTicket = _number(season.baselineAverageTicket, 0);

    if (expected > 0 && progress < expected) items.push('A temporada está abaixo do ponto esperado para hoje.');
    if (weakDays > 0) items.push(weakDays + ' dia(s) fraco(s) ou sem venda estão pesando na consistência.');
    if (orders <= 0) items.push('Ainda não há pedidos válidos dentro do período da temporada.');
    if (baselineTicket > 0 && ticket > 0 && ticket < baselineTicket) items.push('O ticket médio está abaixo da base usada para criar a temporada.');
    if (ratio > 0 && ratio < .5) items.push('O ritmo atual está distante do necessário para chegar na meta dentro do prazo.');
    return items;
  }

  function _seasonDefaultNextAction(season, metrics) {
    var topProduct = (metrics.topProducts || [])[0];
    var strongHour = (metrics.strongHours || [])[0];
    var parts = [];
    if (topProduct && topProduct.name) parts.push('reforce ' + topProduct.name);
    if (strongHour && strongHour.hour !== undefined) parts.push('no horário perto de ' + _formatHourLabel(strongHour.hour));
    if (season.objective === 'increase_ticket') parts.push('e teste um adicional, combo ou upsell simples');
    if (season.objective === 'retain_customers') parts.push('e chame clientes que já compraram antes');
    if (!parts.length) return 'Escolha uma ação simples para hoje: divulgar o produto mais forte, repetir o melhor horário de venda ou recuperar um dia fraco da semana.';
    return parts.join(' ') + '.';
  }

  function _objectiveWeightSummary(objective) {
    var weights = _objectiveWeights(objective);
    if (!weights.length) return 'Objetivo atual';
    return weights.map(function (item) { return item.label + ' ' + item.weight; }).join(' · ');
  }

  function _formatHourLabel(hour) {
    var n = Math.max(0, Math.min(23, Math.floor(_number(hour, 0))));
    return String(n).padStart(2, '0') + ':00';
  }

  function _scoreBreakdownForDisplay(season, metrics) {
    var breakdown = season.scoreBreakdown || metrics.scoreBreakdown || {};
    return {
      coreObjectiveScore: Math.round(_number(breakdown.coreObjectiveScore, _number(season.currentScore, 0))),
      validatedImpactBonus: Math.round(_number(breakdown.validatedImpactBonus, 0)),
      riskPenalty: Math.round(_number(breakdown.riskPenalty, 0)),
      finalScore: Math.round(_number(breakdown.finalScore, _number(season.currentScore, 0))),
      calculationVersion: breakdown.calculationVersion || 'season_score_v1_1'
    };
  }

  function _generateSeasonReading(season, currentMetrics, scoreBreakdown, validatedImpactSignals, riskContext) {
    return {
      headline: _buildSeasonHeadline(season, currentMetrics, scoreBreakdown),
      helpingSignals: _buildHelpingSignals(season, currentMetrics, validatedImpactSignals),
      blockingSignals: _buildBlockingSignals(season, currentMetrics, validatedImpactSignals, riskContext),
      nextAction: _buildNextBestAction(season, currentMetrics, validatedImpactSignals, riskContext)
    };
  }

  function _buildSeasonHeadline(season, currentMetrics, scoreBreakdown) {
    var progress = _number(season && season.progressPercent, _number(currentMetrics && currentMetrics.progressPercent, 0));
    var ratio = _number(currentMetrics && currentMetrics.progressRatio, 0);
    var finalScore = _number(scoreBreakdown && scoreBreakdown.finalScore, _number(season && season.currentScore, 0));
    if (progress >= 100) return 'A temporada já bateu a meta';
    if (_isSeasonEarlyReading(season, currentMetrics)) return 'A temporada acabou de começar';
    if (ratio >= 1.1 || finalScore >= 85) return 'A temporada está acima do ritmo esperado';
    if (ratio >= .8 || finalScore >= 65) return 'A temporada está perto do ritmo esperado';
    if (ratio >= .5 || finalScore >= 40) return 'A temporada está abaixo do ritmo esperado';
    return 'A temporada precisa de atenção agora';
  }

  function _buildHelpingSignals(season, currentMetrics, validatedImpactSignals) {
    var items = _seasonHelpingItems(season, currentMetrics);
    var signals = validatedImpactSignals || {};
    var coupon = signals.coupons || {};
    var promotion = signals.promotions || {};
    var upsell = signals.upsell || {};
    var points = signals.points || {};
    var channel = signals.channels && signals.channels.topChannel;
    var product = signals.products && signals.products.topProduct;

    if (_number(coupon.usedOrders, 0) > 0) items.push('Cupons apareceram em ' + Math.round(_number(coupon.usedOrders, 0)) + ' pedido(s) válido(s).');
    if (_number(promotion.usedOrders, 0) > 0) {
      var promotionName = promotion.topPromotion && promotion.topPromotion.name;
      items.push((promotionName ? promotionName : 'Promoções') + ' gerou venda real em ' + Math.round(_number(promotion.usedOrders, 0)) + ' pedido(s).');
    }
    if (_number(upsell.acceptedOrders, 0) > 0) items.push('Upsell foi aceito em ' + Math.round(_number(upsell.acceptedOrders, 0)) + ' pedido(s).');
    if (_isMeaningfulRecurrence(points.repeatCustomers, currentMetrics && currentMetrics.repurchaseRate)) items.push('Pontos ajudaram clientes recorrentes a voltar.');
    if (channel && channel.channel) items.push('O canal ' + _channelLabel(channel.channel) + ' está trazendo a melhor resposta.');
    if (product && product.name) items.push(product.name + ' aparece como produto forte da temporada.');
    return _uniqueTextItems(items).slice(0, 5);
  }

  function _buildBlockingSignals(season, currentMetrics, validatedImpactSignals, riskContext) {
    var items = _seasonBlockingItems(season, currentMetrics, _number(season && season.progressPercent, 0));
    var signals = validatedImpactSignals || {};
    var couponDiscount = _number(signals.coupons && signals.coupons.discountTotal, 0);
    var promotionDiscount = _number(signals.promotions && signals.promotions.discountTotal, 0);
    var upsellAdded = _number(signals.upsell && signals.upsell.addedRevenue, 0);

    if (couponDiscount > 0 && couponDiscount > _number(signals.coupons && signals.coupons.revenue, 0) * .25) {
      items.push('O desconto dos cupons está alto em relação ao que vendeu.');
    }
    if (promotionDiscount > 0 && promotionDiscount > _number(signals.promotions && signals.promotions.revenue, 0) * .25) {
      items.push('As promoções venderam, mas o desconto pode estar pesando demais.');
    }
    if (season && season.objective === 'increase_ticket' && promotionDiscount > upsellAdded && promotionDiscount > 0) {
      items.push('O ticket pode estar subindo menos porque o desconto está pesando mais que os adicionais.');
    }
    var lowProduct = signals.products && signals.products.lowSellingProducts && signals.products.lowSellingProducts[0];
    if (lowProduct && lowProduct.name) items.push(lowProduct.name + ' está com baixa saída nesta temporada.');
    if (riskContext && riskContext.recentDrop) items.push('Houve queda recente no ritmo da temporada.');
    return _uniqueTextItems(items).slice(0, 5);
  }

  function _buildNextBestAction(season, currentMetrics, validatedImpactSignals, riskContext) {
    var executionPlan = currentMetrics && currentMetrics.executionPlan;
    var action = executionPlan && executionPlan.actions && executionPlan.actions[0];
    if (action && action.description) return action.description;
    var product = validatedImpactSignals && validatedImpactSignals.products && validatedImpactSignals.products.topProduct;
    var channel = validatedImpactSignals && validatedImpactSignals.channels && validatedImpactSignals.channels.topChannel;
    var topProduct = product && product.name ? product : (currentMetrics.topProducts || [])[0];
    var strongHour = (currentMetrics.strongHours || [])[0];
    var parts = [];
    if (topProduct && topProduct.name) parts.push('reforce ' + topProduct.name);
    if (strongHour && strongHour.hour !== undefined) parts.push('perto de ' + _formatHourLabel(strongHour.hour));
    else if (channel && channel.channel) parts.push('no canal ' + _channelLabel(channel.channel));
    if (season && season.objective === 'increase_ticket') parts.push('e teste adicional, combo ou upsell simples');
    if (season && season.objective === 'retain_customers') parts.push('e chame clientes que já compraram antes');
    if (season && season.objective === 'improve_consistency') parts.push('para recuperar os dias mais fracos');
    if (!parts.length) return _seasonDefaultNextAction(season, currentMetrics);
    return parts.join(' ') + '.';
  }

  function _buildActionOpportunities(metrics, validatedImpactSignals, actionContext, season) {
    metrics = metrics || {};
    validatedImpactSignals = validatedImpactSignals || {};
    actionContext = actionContext || {};
    var topProductSignal = validatedImpactSignals.products && validatedImpactSignals.products.topProduct || (metrics.topProducts || [])[0] || null;
    var product = _findActionProduct(topProductSignal, actionContext.products || []);
    var economics = _productEconomics(product, topProductSignal, actionContext);
    var promo = _bestAvailablePromotionForProduct(product, actionContext.promotions || [], actionContext);
    var coupon = _bestAvailableCouponForProduct(economics, actionContext.coupons || []);
    var upsell = _bestAvailableUpsellForProduct(product, actionContext.upsells || []);
    var complement = _bestComplementProductForProduct(product, economics, actionContext.products || [], actionContext);
    var recommended = _chooseRecommendedSalesAction(topProductSignal, economics, promo, coupon, upsell, validatedImpactSignals);
    var rankedActions = _buildRankedActionOpportunities(metrics, validatedImpactSignals, actionContext, season);
    return {
      topProduct: topProductSignal || null,
      topProductEconomics: economics,
      availablePromotion: promo,
      availableCoupon: coupon,
      availableUpsell: upsell,
      availableComplement: complement,
      recommendedAction: recommended,
      rankedActions: rankedActions
    };
  }

  function _buildRankedActionOpportunities(metrics, validatedImpactSignals, actionContext, season) {
    metrics = metrics || {};
    var signals = validatedImpactSignals || {};
    actionContext = actionContext || {};
    var ranked = [];
    var products = signals.products && signals.products.products && signals.products.products.length ? signals.products.products : (metrics.topProducts || []);
    var topChannel = signals.channels && signals.channels.topChannel;
    var strongHour = (metrics.strongHours || [])[0];
    var channelLabel = topChannel && topChannel.channel ? _channelLabel(topChannel.channel) : '';
    var channelAdvice = topChannel && topChannel.actionAdvice ? topChannel.actionAdvice : '';
    var canUseUpsellChannel = !topChannel || !topChannel.channel || _isCardapioChannel(topChannel.channel);
    var hourLabel = strongHour && strongHour.hour !== undefined ? _formatHourLabel(strongHour.hour) : '';
    var usedPromo = signals.promotions && signals.promotions.topPromotion;

    (products || []).slice(0, 6).forEach(function (productSignal, index) {
      if (!productSignal || !productSignal.name) return;
      var product = _findActionProduct(productSignal, actionContext.products || []);
      var economics = _productEconomics(product, productSignal, actionContext);
      var promo = _bestAvailablePromotionForProduct(product, actionContext.promotions || [], actionContext);
      var coupon = _bestAvailableCouponForProduct(economics, actionContext.coupons || []);
      var upsell = _bestAvailableUpsellForProduct(product, actionContext.upsells || []);
      var complement = _bestComplementProductForProduct(product, economics, actionContext.products || [], actionContext);
      var productName = productSignal.name;
      var complementName = complement && complement.product ? _productActionName(complement.product) : '';
      var productKey = _actionProductKey(productSignal, product);
      var quantity = Math.round(_number(productSignal.quantity, 0));
      var revenue = _number(productSignal.revenue, 0);
      var evidence = productName + ' vendeu ' + quantity + ' unidade(s) e gerou ' + _fmtMoney(revenue) + ' nesta temporada.';
      var scoreBase = 70 - (index * 4) + Math.min(18, quantity * 2) + Math.min(18, revenue / 10);
      var productActionTitle = 'Dar protagonismo para ' + productName;
      var productActionDescription = 'Use ' + productName + ' como produto principal da jogada' + (channelLabel ? ' no canal ' + channelLabel : '') + (hourLabel ? ' perto de ' + hourLabel : '') + '.';
      var productActionChecklist = [
        'Produto da jogada: ' + productName + '.',
        channelLabel ? 'Canal para começar: ' + channelLabel + '.' : 'Canal para começar: canal principal da operação.',
        hourLabel ? 'Horário com melhor resposta: perto de ' + hourLabel + '.' : 'Horário: use o período com mais pedidos recentes.',
        economics.hasPriceAndCost ? 'Sobra atual aproximada: ' + Math.round(_number(economics.marginPct, 0)) + '%.' : 'Use sem desconto por enquanto para proteger o resultado da venda.'
      ];
      if (season && season.objective === 'increase_ticket') {
        if (upsell && upsell.name && canUseUpsellChannel) {
          productActionTitle = 'Usar ' + upsell.name + ' com ' + productName;
          productActionDescription = 'No Cardápio, ofereça ' + upsell.name + ' quando a cliente escolher ' + productName + '. Essa é a jogada concreta para subir o valor do pedido sem baixar preço.';
          productActionChecklist = [
            'Produto que inicia a jogada: ' + productName + '.',
            'Upsell para oferecer: ' + upsell.name + '.',
            'Canal da jogada: Cardápio.',
            hourLabel ? 'Use com mais atenção perto de ' + hourLabel + ', que foi o horário com melhor resposta.' : 'Use antes de finalizar o pedido no Cardápio.',
            'Não aplique cupom forte nesta jogada; o objetivo é aumentar o pedido com oferta extra.'
          ];
        } else if (complementName) {
          productActionTitle = 'Criar oferta ' + productName + ' + ' + complementName;
          productActionDescription = 'Monte uma jogada juntando ' + productName + ' com ' + complementName + '. Esse complemento tem preço e custo suficientes para ser usado como oferta de aumento de pedido.';
          productActionChecklist = [
            'Produto que inicia a jogada: ' + productName + '.',
            'Complemento sugerido: ' + complementName + '.',
            'Ação concreta: criar upsell ou combo no Cardápio com esses dois produtos.',
            complement.economics && complement.economics.hasPriceAndCost ? 'Sobra aproximada do complemento: ' + Math.round(_number(complement.economics.marginPct, 0)) + '%.' : 'Use o complemento sem desconto até completar preço e custo.',
            'Vai valer a pena se os pedidos começarem a levar os dois itens juntos.'
          ];
        } else {
          productActionTitle = 'Preparar um complemento para ' + productName;
          productActionDescription = productName + ' está aparecendo como produto de entrada, mas ainda não encontrei upsell, combo ou complemento pronto para indicar. A jogada concreta agora é cadastrar uma oferta extra para esse produto.';
          productActionChecklist = [
            'Produto que inicia a jogada: ' + productName + '.',
            'Crie um upsell no Cardápio ligado a ' + productName + '.',
            'Escolha um complemento com preço e custo cadastrados.',
            'Depois de criar, a próxima venda já pode mostrar se o pedido médio subiu.'
          ];
        }
      }

      if (index === 0 && usedPromo && usedPromo.name && _number(signals.promotions && signals.promotions.usedOrders, 0) > 0) {
        ranked.push(_rankedAction(
          110,
          'promotion_validated',
          productKey,
          _seasonAction(
            'promocao-validada-' + _slugKey(usedPromo.name),
            'Repetir ' + usedPromo.name,
            'Use ' + usedPromo.name + ' com ' + productName + ' porque essa combinação já trouxe venda real.',
            usedPromo.name + ' já ajudou a vender ' + _fmtMoney(_number(usedPromo.revenue, signals.promotions.revenue)) + ' em ' + Math.round(_number(usedPromo.usedOrders || signals.promotions.usedOrders, 0)) + ' pedido(s). Vale repetir o que já mostrou resposta.',
            'promotions',
            'high',
            [
              'Produto da jogada: ' + productName + '.',
              'Promoção da jogada: ' + usedPromo.name + '.',
              'Resultado que ela já trouxe: ' + _fmtMoney(_number(usedPromo.revenue, signals.promotions.revenue)) + ' em vendas.',
              channelAdvice || (channelLabel ? 'Canal para usar primeiro: ' + channelLabel + '.' : 'Canal para usar primeiro: o canal principal da operação.')
            ]
          )
        ));
      }

      if (promo && promo.canUse) {
        ranked.push(_rankedAction(
          scoreBase + 28,
          'promotion_available',
          productKey,
          _seasonAction(
            'promocao-produto-' + productKey,
            'Usar ' + promo.name + ' em ' + productName,
            'Aplique ' + promo.name + ' em ' + productName + ': o preço ficaria perto de ' + _fmtMoney(promo.finalPrice) + ' e ainda sobra uma margem saudável para vender.',
            evidence + ' Essa promoção pode dar mais força ao produto sem apertar demais o resultado da venda.',
            'promotions',
            'high',
            [
              'Produto: ' + productName + '.',
              'Ação: usar ' + promo.name + '.',
              'Preço provável com a promoção: ' + _fmtMoney(promo.finalPrice) + '.',
              'Sobra aproximada depois da promoção: ' + Math.round(_number(promo.marginAfterPct, 0)) + '%.'
            ]
          )
        ));
      }

      if (upsell && upsell.name && canUseUpsellChannel) {
        ranked.push(_rankedAction(
          scoreBase + (signals.upsell && _number(signals.upsell.acceptedOrders, 0) > 0 ? 26 : 18),
          'upsell',
          productKey,
          _seasonAction(
            'upsell-produto-' + productKey,
            'Aumentar pedido com ' + upsell.name,
            'Ofereça ' + upsell.name + ' junto de ' + productName + ' para subir o valor do pedido sem reduzir preço.',
            evidence + ' Essa jogada ajuda a vender mais em cada pedido sem precisar baixar o preço do produto principal.',
            'upsell',
            'high',
            [
              'Produto de entrada: ' + productName + '.',
              'Oferta extra: ' + upsell.name + '.',
              'Canal da jogada: Cardápio, porque upsell só entra no canal de venda Cardápio.',
              signals.upsell && _number(signals.upsell.acceptedOrders, 0) > 0 ? 'Clientes já aceitaram essa oferta em ' + Math.round(_number(signals.upsell.acceptedOrders, 0)) + ' pedido(s).' : 'Objetivo: vender algo a mais sem criar desconto.',
              'Use essa oferta antes de finalizar o pedido.'
            ]
          )
        ));
      }

      if (coupon && coupon.canUse) {
        ranked.push(_rankedAction(
          scoreBase + 16,
          'coupon',
          productKey,
          _seasonAction(
            'cupom-produto-' + productKey,
            'Usar cupom ' + coupon.code + ' em ' + productName,
            'Use o cupom ' + coupon.code + ' em ' + productName + ': o preço ficaria perto de ' + _fmtMoney(coupon.finalPrice) + ' e a venda ainda continua saudável.',
            evidence + ' O cupom pode ajudar a criar urgência sem transformar a venda em prejuízo.',
            'coupons',
            'medium',
            [
              'Produto: ' + productName + '.',
              'Cupom: ' + coupon.code + '.',
              'Preço provável com cupom: ' + _fmtMoney(coupon.finalPrice) + '.',
              'Sobra aproximada depois do cupom: ' + Math.round(_number(coupon.marginAfterPct, 0)) + '%.'
            ]
          )
        ));
      }

      if (economics.hasPriceAndCost && economics.maxHealthyDiscountPct > 0) {
        ranked.push(_rankedAction(
          scoreBase + 10,
          'healthy_discount',
          productKey,
          _seasonAction(
            'desconto-produto-' + productKey,
            'Desconto pequeno para ' + productName,
            'Se quiser uma jogada com desconto, use no máximo ' + economics.maxHealthyDiscountPct + '% em ' + productName + '.',
            'Preço ' + _fmtMoney(economics.price) + ', custo ' + _fmtMoney(economics.cost) + ' e margem atual de ' + Math.round(_number(economics.marginPct, 0)) + '%. Esse limite preserva margem mínima estimada.',
            'healthy_discount',
            'medium',
            [
              'Produto: ' + productName + '.',
              'Desconto máximo recomendado: ' + economics.maxHealthyDiscountPct + '%.',
              'Preço atual: ' + _fmtMoney(economics.price) + '.',
              'Custo cadastrado: ' + _fmtMoney(economics.cost) + '.'
            ]
          )
        ));
      }

      ranked.push(_rankedAction(
        scoreBase,
        'product_' + productKey,
        productKey,
        _seasonAction(
          'produto-forte-' + productKey,
          productActionTitle,
          productActionDescription,
          evidence + (channelLabel ? ' O canal que mais pode ajudar agora é ' + channelLabel + '.' : ''),
          'products',
          'medium',
          productActionChecklist
        )
      ));
    });

    if (topChannel && topChannel.channel || strongHour && strongHour.hour !== undefined) {
      var channelProductName = products && products[0] && products[0].name ? products[0].name : '';
      var isCardapioAction = channelLabel && _isCardapioChannel(topChannel && topChannel.channel);
      var channelActionTitle = isCardapioAction && channelProductName
        ? 'Dar mais destaque para ' + channelProductName + ' no Cardápio'
        : channelLabel && channelProductName
          ? 'Vender mais ' + channelProductName + ' pelo canal ' + channelLabel
          : channelLabel
            ? 'Usar melhor o canal ' + channelLabel
            : 'Usar o melhor horário';
      var channelActionDescription = isCardapioAction
        ? 'Coloque ' + (channelProductName || 'o produto com melhor saída') + ' mais visível no Cardápio e use o horário de maior resposta para puxar mais pedidos.'
        : channelLabel
          ? 'Leve ' + (channelProductName || 'o produto com melhor saída') + ' para o canal ' + channelLabel + (hourLabel ? ' perto de ' + hourLabel : '') + ', porque esse caminho já trouxe resposta.'
          : 'Use o melhor horário da temporada para dar mais força ao produto que já está vendendo.';
      var channelChecklist = isCardapioAction
        ? [
            'No Cardápio, deixe ' + (channelProductName || 'o produto com melhor saída') + ' mais fácil de encontrar.',
            'Use o card de destaque, a ordem do produto ou uma promoção leve se a margem permitir.',
            hourLabel ? 'Faça essa ação perto de ' + hourLabel + ', que foi o horário com melhor resposta.' : 'Faça essa ação no período em que os pedidos entram melhor.',
            'Quando divulgar fora do BocaFood, envie o link do Cardápio direto para a cliente comprar por lá.'
          ]
        : [
            channelLabel ? 'Use o canal ' + channelLabel + ' como primeiro lugar dessa jogada.' : 'Use o canal que mais trouxe pedido.',
            channelProductName ? 'Produto para oferecer: ' + channelProductName + '.' : 'Produto para oferecer: produto com melhor saída.',
            hourLabel ? 'Faça a ação perto de ' + hourLabel + '.' : 'Use o período com melhor resposta.',
            'Mantenha a oferta simples para entender se esse canal continua respondendo.'
          ];
      ranked.push(_rankedAction(
        76,
        'timing',
        '',
        _seasonAction(
          'canal-horario-ranqueado',
          channelActionTitle,
          channelActionDescription,
          [
            channelLabel ? channelLabel + ' trouxe ' + Math.round(_number(topChannel.orders, 0)) + ' pedido(s) e ' + _fmtMoney(_number(topChannel.revenue, 0)) : '',
            topChannel && topChannel.channelCostPct ? 'Taxas estimadas do canal: ' + Math.round(_number(topChannel.channelCostPct, 0)) + '% da venda' : '',
            topChannel && topChannel.discountTotal > 0 ? 'Descontos ligados ao canal: ' + _fmtMoney(topChannel.discountTotal) : '',
            hourLabel ? hourLabel + ' concentrou ' + Math.round(_number(strongHour.orders, 0)) + ' pedido(s)' : ''
          ].filter(Boolean).join('. ') + '.',
          'timing',
          'medium',
          channelChecklist
        )
      ));
    }

    var recurring = Math.round(_number(metrics.recurringCustomers, 0));
    var repurchaseRate = _number(metrics.repurchaseRate, 0);
    var points = signals.points || {};
    if (_isMeaningfulRecurrence(recurring, repurchaseRate) || _number(points.redemptionOrders, 0) > 0 || _number(points.repeatCustomers, 0) >= 2) {
      ranked.push(_rankedAction(
        70,
        'retention',
        '',
        _seasonAction(
          'recompra-ranqueada',
          'Trazer clientes de volta',
          'Chame clientes que já compraram antes usando o produto ou benefício que mais respondeu na temporada.',
          recurring > 0 ? recurring + ' cliente(s) voltaram no período e a recompra está em ' + Math.round(repurchaseRate * 100) + '%.' : 'Pontos ou recompra já apareceram em pedidos válidos desta temporada.',
          'retention',
          'medium',
          [
            'Público: clientes que já compraram antes.',
            products && products[0] && products[0].name ? 'Motivo do convite: ' + products[0].name + '.' : 'Motivo do convite: produto com melhor resposta.',
            _number(points.redemptionOrders, 0) > 0 ? 'Use pontos como benefício, porque houve resgate em ' + Math.round(_number(points.redemptionOrders, 0)) + ' pedido(s).' : 'Objetivo: gerar recompra dentro da temporada.'
          ]
        )
      ));
    }

    var weakDays = Math.round(_number(metrics.weakDays, 0));
    if (weakDays > 0) {
      ranked.push(_rankedAction(
        64,
        'consistency',
        '',
        _seasonAction(
          'consistencia-ranqueada',
          'Puxar um dia fraco',
          products && products[0] && products[0].name ? 'Use ' + products[0].name + ' para puxar o próximo dia fraco da semana.' : 'Use a melhor oferta disponível para puxar o próximo dia fraco da semana.',
          weakDays + ' dia(s) fraco(s) ainda aparecem na temporada.',
          'consistency',
          'medium',
          [
            products && products[0] && products[0].name ? 'Produto da jogada: ' + products[0].name + '.' : 'Produto da jogada: produto com melhor resposta.',
            channelLabel ? 'Canal da jogada: ' + channelLabel + '.' : 'Canal da jogada: o que mais respondeu.',
            hourLabel ? 'Horário da jogada: perto de ' + hourLabel + '.' : 'Horário da jogada: melhor período disponível.'
          ]
        )
      ));
    }

    return _applySeasonActionStrategy(ranked, season).sort(function (a, b) { return b.score - a.score; }).slice(0, 12);
  }

  function _applySeasonActionStrategy(rankedActions, season) {
    var profile = _seasonActionStrategyProfile(season || {});
    return (rankedActions || []).map(function (item) {
      var key = _seasonActionStrategyKey(item);
      var boost = _number(profile.boosts[key], 0);
      var source = item && item.action && item.action.source || '';
      if (profile.sources && profile.sources[source] !== undefined) boost += _number(profile.sources[source], 0);
      var adjusted = Object.assign({}, item);
      adjusted.score = _number(item && item.score, 0) + boost;
      adjusted.priorityFit = {
        objective: season && season.objective || '',
        build: season && season.build || '',
        key: key,
        boost: boost,
        label: profile.label
      };
      adjusted.action = _contextualizeSeasonActionForStrategy(adjusted.action, key, season);
      return adjusted;
    });
  }

  function _contextualizeSeasonActionForStrategy(action, key, season) {
    if (!action) return action;
    var context = _seasonActionStrategyCopy(key, season || {});
    if (!context) return action;
    var next = Object.assign({}, action);
    next.goalText = context.goal || next.goalText;
    next.successText = context.success || next.successText;
    if (context.description && _seasonActionShouldUseStrategyDescription(next)) {
      next.description = context.description;
    }
    if (context.why) next.why = _mergeSeasonActionReason(next.why, context.why);
    if (context.checklist && context.checklist.length) {
      next.checklist = _mergeSeasonActionChecklist(next.checklist || [], context.checklist);
    }
    return next;
  }

  function _seasonActionShouldUseStrategyDescription(action) {
    return !action || !String(action.description || '').trim();
  }

  function _mergeSeasonActionReason(base, extra) {
    base = String(base || '').trim();
    extra = String(extra || '').trim();
    if (!extra) return base;
    if (!base) return extra;
    if (_foldText(base).indexOf(_foldText(extra).slice(0, 42)) >= 0) return base;
    return base.replace(/\s+$/, '') + ' ' + extra;
  }

  function _mergeSeasonActionChecklist(base, extra) {
    var out = [];
    (base || []).concat(extra || []).forEach(function (item) {
      var text = String(item || '').trim();
      if (!text) return;
      var folded = _foldText(text);
      if (out.some(function (existing) { return _foldText(existing) === folded; })) return;
      out.push(text);
    });
    return out.slice(0, 5);
  }

  function _seasonActionStrategyCopy(key, season) {
    var objective = season && season.objective || '';
    var build = season && season.build || '';
    var combo = objective + ':' + build;
    var copy = {
      'sell_more:volume': {
        goal: 'Gerar mais pedidos usando o produto, canal ou horário que já mostrou resposta.',
        success: 'entrar mais pedidos ligados a essa jogada dentro do prazo.',
        description: 'Use esta jogada para aumentar movimento onde a operação já mostrou resposta.',
        why: 'Aqui o foco é volume: repetir o caminho que já trouxe pedido aumenta a chance de vender mais rápido.',
        checklist: ['Mantenha a ação simples para gerar pedido, não para explicar demais a oferta.']
      },
      'sell_more:margin': {
        goal: 'Vender mais sem trocar crescimento por desconto pesado.',
        success: 'entrar venda com desconto controlado ou sem desconto.',
        description: 'Use esta jogada para puxar venda preservando a sobra do produto.',
        why: 'Como a prioridade é melhor sobra, a jogada precisa vender sem deixar o desconto mandar no resultado.',
        checklist: ['Evite aumentar desconto nesta jogada; prefira destaque, produto forte ou upsell.']
      },
      'sell_more:retention': {
        goal: 'Vender mais chamando quem já conhece sua operação.',
        success: 'cliente conhecido voltar a comprar dentro do prazo.',
        description: 'Use esta jogada para transformar produto forte em motivo de retorno.',
        why: 'Aqui vender mais passa por clientes que já têm relação com sua operação, não por divulgação genérica.',
        checklist: ['Use a mensagem ou benefício como convite para recompra.']
      },
      'increase_ticket:volume': {
        goal: 'Fazer mais pedidos virem com algo a mais.',
        success: 'o pedido médio subir ou aparecer item adicional vendido junto.',
        description: 'Use esta jogada para aumentar o valor de cada pedido sem complicar a compra.',
        why: 'O foco é ticket: não basta vender o produto, a jogada precisa adicionar valor ao pedido.',
        checklist: ['Ofereça complemento, combo ou upsell antes de finalizar o pedido.']
      },
      'increase_ticket:margin': {
        goal: 'Subir o valor do pedido preservando margem.',
        success: 'entrar pedido maior sem depender de cupom forte.',
        description: 'Use esta jogada para vender melhor cada pedido, com adicional ou produto de boa sobra.',
        why: 'Como a prioridade é melhor sobra, upsell e adicional fazem mais sentido que baixar preço.',
        checklist: ['Priorize adicional, combo ou produto complementar em vez de desconto.']
      },
      'increase_ticket:retention': {
        goal: 'Fazer clientes conhecidos comprarem pedidos melhores.',
        success: 'cliente recorrente comprar com adicional, combo ou ticket maior.',
        description: 'Use esta jogada para oferecer algo complementar a quem já compra da sua operação.',
        why: 'Cliente conhecido tende a aceitar melhor uma sugestão ligada ao que já pediu antes.',
        checklist: ['Use o produto que a cliente já conhece como entrada para a oferta.']
      },
      'retain_customers:volume': {
        goal: 'Trazer clientes de volta com uma ação fácil de aceitar.',
        success: 'cliente que já comprou voltar a fazer pedido.',
        description: 'Use esta jogada para aumentar recompra com uma chamada simples.',
        why: 'A prioridade de movimento aqui depende de retorno: mais clientes conhecidos comprando de novo.',
        checklist: ['Fale com clientes que já compraram antes e use o produto forte como motivo.']
      },
      'retain_customers:margin': {
        goal: 'Gerar recompra sem dar desconto desnecessário.',
        success: 'cliente conhecido voltar comprando produto com boa sobra.',
        description: 'Use esta jogada para trazer cliente de volta protegendo o resultado da venda.',
        why: 'Como a prioridade é melhor sobra, a recompra precisa ser saudável, não só barata.',
        checklist: ['Prefira benefício leve, pontos ou produto de boa margem.']
      },
      'retain_customers:retention': {
        goal: 'Criar motivo claro para a cliente voltar.',
        success: 'recompra aparecer com cliente identificado.',
        description: 'Use esta jogada para transformar relacionamento em novo pedido.',
        why: 'Essa combinação pede foco direto em recompra, pontos e clientes que já demonstraram interesse.',
        checklist: ['Use pontos, cupom de retorno ou produto que a cliente costuma repetir.']
      },
      'improve_consistency:volume': {
        goal: 'Preencher dias ou horários fracos com mais movimento.',
        success: 'entrar pedido no dia ou horário que estava fraco.',
        description: 'Use esta jogada para levar o produto certo ao momento em que a operação precisa de movimento.',
        why: 'A consistência melhora quando os pedidos deixam de ficar concentrados em poucos momentos.',
        checklist: ['Aplique a jogada no dia ou horário mais fraco, não só no horário que já vende bem.']
      },
      'improve_consistency:margin': {
        goal: 'Preencher dias ou horários fracos sem sacrificar margem.',
        success: 'entrar venda no período fraco com desconto controlado ou sem desconto.',
        description: 'Use esta jogada para dar movimento nos pontos fracos usando um produto que já responde e preserva resultado.',
        why: 'Essa jogada faz sentido porque junta consistência com margem: usa algo que já responde, mas sem transformar o dia fraco em venda barata.',
        checklist: ['Use o produto forte para puxar o período fraco, mas não aumente desconto para forçar venda.']
      },
      'improve_consistency:retention': {
        goal: 'Usar clientes conhecidos para movimentar dias fracos.',
        success: 'cliente recorrente comprar em um dia ou horário que precisava de movimento.',
        description: 'Use esta jogada para chamar clientes conhecidos nos momentos em que a operação oscila mais.',
        why: 'Para ganhar consistência com fidelização, o melhor é usar relacionamento para preencher buracos da semana.',
        checklist: ['Direcione a chamada para clientes que já compraram e para o dia que precisa de movimento.']
      }
    }[combo];
    if (!copy) return null;
    if (key === 'upsell' && objective !== 'increase_ticket') {
      copy = Object.assign({}, copy, {
        goal: build === 'margin' ? 'Aumentar o valor do pedido sem mexer no preço.' : copy.goal,
        success: 'aparecer pedido com upsell aceito no Cardápio.'
      });
    }
    return copy;
  }

  function _seasonActionStrategyKey(item) {
    var focus = String(item && item.focusKey || '');
    var source = String(item && item.action && item.action.source || '');
    if (focus.indexOf('promotion') >= 0 || source === 'promotions') return 'promotion';
    if (focus === 'coupon' || source === 'coupons') return 'coupon';
    if (focus === 'upsell' || source === 'upsell') return 'upsell';
    if (focus === 'healthy_discount' || source === 'healthy_discount') return 'healthy_discount';
    if (focus.indexOf('product_') === 0 || source === 'products') return 'product';
    if (focus === 'timing' || source === 'timing') return 'timing';
    if (focus === 'retention' || source === 'retention' || source === 'points') return 'retention';
    if (focus === 'consistency' || source === 'consistency') return 'consistency';
    return source || focus || 'general';
  }

  function _seasonActionStrategyProfile(season) {
    var objective = season && season.objective || '';
    var build = season && season.build || '';
    var combo = objective + ':' + build;
    var boosts = {};
    var sources = {};

    function add(key, value) {
      boosts[key] = _number(boosts[key], 0) + value;
    }
    function addSource(key, value) {
      sources[key] = _number(sources[key], 0) + value;
    }

    if (objective === 'sell_more') {
      add('product', 18);
      add('timing', 16);
      add('promotion', 14);
      add('coupon', 8);
      add('upsell', 4);
      add('retention', -4);
    } else if (objective === 'increase_ticket') {
      add('upsell', 28);
      add('healthy_discount', 10);
      add('product', 8);
      add('promotion', 2);
      add('coupon', -10);
      add('timing', 2);
      add('retention', -8);
    } else if (objective === 'retain_customers') {
      add('retention', 30);
      add('coupon', 14);
      add('product', 8);
      add('promotion', 4);
      add('timing', 4);
      add('upsell', -6);
      addSource('points', 18);
    } else if (objective === 'improve_consistency') {
      add('consistency', 30);
      add('timing', 22);
      add('product', 12);
      add('promotion', 6);
      add('coupon', 2);
      add('retention', 6);
      add('upsell', -4);
    }

    if (build === 'volume') {
      add('product', 10);
      add('timing', 8);
      add('promotion', 8);
      add('coupon', 5);
      add('consistency', 5);
    } else if (build === 'margin') {
      add('upsell', 12);
      add('healthy_discount', 10);
      add('product', 8);
      add('promotion', -4);
      add('coupon', -8);
      add('retention', -2);
    } else if (build === 'retention') {
      add('retention', 16);
      add('coupon', 10);
      add('consistency', 6);
      add('product', 3);
      add('promotion', -2);
      add('upsell', -4);
      addSource('points', 12);
    }

    return {
      boosts: boosts,
      sources: sources,
      label: _objectiveLabel(objective) + ' + ' + _buildLabel(build)
    };
  }

  function _rankedAction(score, focusKey, productKey, action) {
    return {
      score: _number(score, 0),
      focusKey: focusKey || '',
      productKey: productKey || '',
      action: action
    };
  }

  function _actionProductKey(signal, product) {
    return _slugKey((product && (product.id || product.productId)) || (signal && (signal.productId || signal.id || signal.name)) || 'produto');
  }

  function _slugKey(value) {
    return _foldText(value || 'item').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
  }

  function _selectRankedSeasonActions(rankedActions, maxActions, excludedIds) {
    var sorted = (rankedActions || []).slice().sort(function (a, b) { return _number(b.score, 0) - _number(a.score, 0); });
    var selected = [];
    var usedIds = {};
    var usedFocus = {};
    var usedProducts = {};
    excludedIds = excludedIds || {};

    function tryAdd(item, strictProduct, strictFocus) {
      if (!item || !item.action || selected.length >= maxActions) return false;
      var actionId = String(item.action.id || item.focusKey || selected.length);
      var productKey = _rankedActionProductSignature(item);
      var focusKey = _rankedActionFocusSignature(item);
      if (excludedIds[actionId]) return false;
      if (usedIds[actionId]) return false;
      if (strictFocus && focusKey && usedFocus[focusKey]) return false;
      if (strictProduct && productKey && usedProducts[productKey]) return false;
      item.action.focusKey = item.focusKey || focusKey || '';
      item.action.productKey = item.productKey || productKey || '';
      selected.push(item.action);
      usedIds[actionId] = true;
      if (focusKey) usedFocus[focusKey] = true;
      if (productKey) usedProducts[productKey] = true;
      return true;
    }

    sorted.forEach(function (item) { tryAdd(item, true, true); });
    sorted.forEach(function (item) { tryAdd(item, false, true); });
    sorted.forEach(function (item) { tryAdd(item, false, false); });
    return selected.slice(0, maxActions);
  }

  function _rankedActionProductSignature(item) {
    var explicit = String(item && item.productKey || item && item.action && item.action.productKey || '').trim();
    if (explicit) return explicit;
    var label = _seasonActionProductLabel(item && item.action || {});
    return label ? _slugKey(label) : '';
  }

  function _rankedActionFocusSignature(item) {
    var source = String(item && item.action && item.action.source || '').trim();
    var focus = String(item && item.focusKey || item && item.action && item.action.focusKey || source || '').trim();
    var product = _rankedActionProductSignature(item);
    if (!focus && !product) return '';
    return [focus || 'acao', product || 'sem-produto'].join(':');
  }

  function _seasonExcludedActionIds(season) {
    var excluded = {};
    (season && season.actionTaskHistory || []).forEach(function (task) {
      if (task && task.actionId) excluded[task.actionId] = true;
    });
    (season && season.actionTasks || []).forEach(function (task) {
      if (task && task.actionId && _isTerminalActionTask(task)) excluded[task.actionId] = true;
    });
    return excluded;
  }

  function _chooseRecommendedSalesAction(topProduct, economics, promo, coupon, upsell, signals) {
    if (!topProduct || !topProduct.name) return null;
    var productName = topProduct.name;
    var usedPromo = signals && signals.promotions && signals.promotions.topPromotion;
    var topChannel = signals && signals.channels && signals.channels.topChannel;
    var canUseUpsellChannel = !topChannel || !topChannel.channel || _isCardapioChannel(topChannel.channel);
    if (usedPromo && usedPromo.name && _number(signals.promotions && signals.promotions.usedOrders, 0) > 0) {
      return {
        type: 'promotion_validated',
        title: 'Repetir ' + usedPromo.name,
        description: 'Use ' + usedPromo.name + ' com ' + productName + ' nesta jogada. A promoção já vendeu ' + _fmtMoney(_number(usedPromo.revenue, 0)) + ' e deve ser repetida com a mesma regra.',
        why: usedPromo.name + ' já apareceu em ' + Math.round(_number(usedPromo.usedOrders || signals.promotions.usedOrders, 0)) + ' pedido(s) válido(s), então é uma ação com resposta real, não uma aposta nova.',
        checklist: [
          'Produto da jogada: ' + productName + '.',
          'Promoção da jogada: ' + usedPromo.name + '.',
          'Resultado já validado: ' + _fmtMoney(_number(usedPromo.revenue, 0)) + ' em vendas.'
        ]
      };
    }
    if (promo && promo.canUse) {
      return {
        type: 'promotion_available',
        title: 'Usar ' + promo.name,
        description: 'Use ' + promo.name + ' em ' + productName + ': o desconto estimado é ' + _fmtMoney(promo.discountValue) + ' e mantém margem aproximada de ' + Math.round(promo.marginAfterPct) + '%.',
        why: 'A promoção está ativa, combina com o produto forte e a margem estimada fica acima do mínimo seguro.',
        checklist: [
          'Ative ou destaque ' + promo.name + ' para ' + productName + '.',
          'Preço estimado depois da promoção: ' + _fmtMoney(promo.finalPrice) + '.',
          'A margem estimada depois da promoção fica em ' + Math.round(promo.marginAfterPct) + '%, acima do mínimo seguro.'
        ]
      };
    }
    if (upsell && upsell.name && canUseUpsellChannel) {
      return {
        type: 'upsell_available',
        title: 'Oferecer ' + upsell.name,
        description: 'Use o upsell ' + upsell.name + ' junto de ' + productName + ' para aumentar o valor do pedido sem reduzir preço.',
        why: 'Essa é a melhor jogada quando o produto vende, mas não vale reduzir preço: aumenta o pedido sem mexer na margem do produto principal.',
        checklist: [
          'Produto principal: ' + productName + '.',
          'Oferta extra: ' + upsell.name + '.',
          'Canal: Cardápio, porque upsell só entra no canal de venda Cardápio.',
          'Objetivo da jogada: subir o valor do pedido sem desconto.'
        ]
      };
    }
    if (coupon && coupon.canUse) {
      return {
        type: 'coupon_available',
        title: 'Usar cupom ' + coupon.code,
        description: 'Use o cupom ' + coupon.code + ' com ' + productName + ': o desconto estimado mantém margem aproximada de ' + Math.round(coupon.marginAfterPct) + '%.',
        why: 'O BocaFood calculou preço, custo e desconto do cupom; a margem estimada depois do cupom continua saudável.',
        checklist: [
          'Produto da jogada: ' + productName + '.',
          'Preço estimado depois do cupom: ' + _fmtMoney(coupon.finalPrice) + '.',
          'A margem estimada depois do cupom fica em ' + Math.round(coupon.marginAfterPct) + '%.'
        ]
      };
    }
    if (economics.hasPriceAndCost) {
      if (economics.maxHealthyDiscountPct > 0) {
        return {
          type: 'healthy_discount_available',
          title: 'Criar desconto pequeno para ' + productName,
          description: 'Se quiser desconto, use no máximo ' + economics.maxHealthyDiscountPct + '% em ' + productName + '. Acima disso a margem estimada começa a ficar apertada.',
          why: 'Com preço ' + _fmtMoney(economics.price) + ' e custo ' + _fmtMoney(economics.cost) + ', a margem atual é de ' + Math.round(economics.marginPct) + '%.',
          checklist: [
            'Produto da jogada: ' + productName + '.',
            'Desconto máximo recomendado: ' + economics.maxHealthyDiscountPct + '%.',
            'Margem atual antes do desconto: ' + Math.round(economics.marginPct) + '%.'
          ]
        };
      }
      return {
        type: 'no_discount_margin',
        title: 'Destacar ' + productName + ' sem desconto',
        description: 'Não recomendo desconto em ' + productName + ' agora. A margem estimada já está curta; use destaque, combo ou upsell.',
        why: 'Preço ' + _fmtMoney(economics.price) + ', custo ' + _fmtMoney(economics.cost) + ' e margem atual de ' + Math.round(economics.marginPct) + '%.',
        checklist: [
          'Coloque ' + productName + ' em destaque sem reduzir preço.',
          'Ofereça adicional, combo ou upsell junto.',
          'Com essa margem, desconto agora reduziria demais o resultado do produto.'
        ]
      };
    }
    return {
      type: 'missing_cost',
      title: 'Destacar ' + productName + ' sem desconto',
      description: 'Use ' + productName + ' como destaque, mas não recomendo cupom ou promoção até existir preço e custo completos para calcular margem.',
      why: 'O produto vende, mas falta dado suficiente de custo/preço para indicar desconto saudável.',
      checklist: [
        'Destaque ' + productName + ' no cardápio ou no canal mais forte.',
        'Use upsell ou combo sem mexer no preço se houver opção.',
        'Complete custo e preço do produto para o BocaFood calcular desconto ideal.'
      ]
    };
  }

  function _findActionProduct(signal, products) {
    if (!signal) return null;
    var id = String(signal.productId || signal.id || '').trim();
    var name = _foldText(signal.name || '');
    return (products || []).filter(function (product) {
      if (!product) return false;
      if (id && String(product.id || product.productId || '') === id) return true;
      return name && _foldText(product.name || product.nome || product.title || '') === name;
    })[0] || null;
  }

  function _productEconomics(product, signal, actionContext) {
    var price = _money(_firstValue(product && product.price, product && product.salePrice, product && product.valor, product && product.preco, product && product.precoVenda, signal && signal.unitPrice));
    var chainCost = _productChainCost(product, actionContext || {});
    var savedCost = _money(_firstValue(product && product.cost, product && product.custo, product && product.purchasePrice, product && product.custoAtual, product && product.custo_atual, product && product.stockUnitCost, product && product.costPerYield, product && product.precoCompra));
    var cost = chainCost.cost > 0 ? chainCost.cost : savedCost;
    var hasPriceAndCost = price > 0 && cost > 0;
    var marginPct = hasPriceAndCost ? ((price - cost) / price) * 100 : null;
    var targetMarginPct = 25;
    var minFinal = hasPriceAndCost ? cost / (1 - targetMarginPct / 100) : 0;
    var maxDiscountValue = hasPriceAndCost ? Math.max(0, price - minFinal) : 0;
    var maxHealthyDiscountPct = hasPriceAndCost && price > 0 ? Math.floor(Math.min(20, (maxDiscountValue / price) * 100)) : 0;
    return {
      price: price,
      cost: cost,
      costSource: chainCost.source || (savedCost > 0 ? 'produto' : ''),
      costBreakdown: chainCost.breakdown || [],
      hasPriceAndCost: hasPriceAndCost,
      marginPct: marginPct,
      targetMarginPct: targetMarginPct,
      maxHealthyDiscountPct: Math.max(0, maxHealthyDiscountPct),
      maxHealthyDiscountValue: maxDiscountValue
    };
  }

  function _realMenuCombinationSignals(orders, actionContext, limit) {
    actionContext = actionContext || {};
    var productIndex = _seasonProductIndex(actionContext.products || []);
    var grouped = {};
    (orders || []).forEach(function (rawOrder) {
      var order = _normalizeSeasonOrder(rawOrder);
      if (!order || !_isValidSeasonOrder(order)) return;
      var itemCount = (order.items || []).length;
      (order.items || []).forEach(function (item) {
        var product = _seasonProductForOrderItem(item, productIndex);
        var groups = _menuChoiceGroupsForSeason(product);
        if (!product || !groups.length) return;
        var combination = _soldCombinationForSeason(product, item);
        if (!combination || !combination.selections.length) return;
        var quantity = Math.max(1, _number(item.quantity, 1));
        var revenue = _money(item.total || (item.unitPrice * quantity));
        var unitPrice = quantity > 0 ? revenue / quantity : _money(item.unitPrice);
        var cost = _soldCombinationCostForSeason(combination, actionContext);
        var fees = _soldCombinationFeesForSeason(unitPrice, order.channel, actionContext, itemCount);
        var profitUnit = unitPrice - cost - fees;
        var key = [
          String(product.id || item.productId || item.id || product.name || item.name || ''),
          combination.label,
          order.channel || ''
        ].join('::');
        if (!grouped[key]) {
          grouped[key] = {
            productId: String(product.id || item.productId || item.id || ''),
            productName: product.name || product.title || item.name || 'Produto',
            combination: combination.label,
            channel: _channelLabel(order.channel || ''),
            orders: 0,
            quantity: 0,
            revenue: 0,
            cost: 0,
            fees: 0,
            profit: 0
          };
        }
        grouped[key].orders += 1;
        grouped[key].quantity += quantity;
        grouped[key].revenue += revenue;
        grouped[key].cost += cost * quantity;
        grouped[key].fees += fees * quantity;
        grouped[key].profit += profitUnit * quantity;
      });
    });
    var rows = Object.keys(grouped).map(function (key) {
      var row = grouped[key];
      row.averagePrice = row.quantity > 0 ? row.revenue / row.quantity : 0;
      row.averageCost = row.quantity > 0 ? row.cost / row.quantity : 0;
      row.averageFees = row.quantity > 0 ? row.fees / row.quantity : 0;
      row.marginPercent = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
      row.status = _soldCombinationStatus(row);
      row.reason = _soldCombinationReason(row);
      return row;
    });
    var top = rows.slice().sort(function (a, b) {
      return b.quantity - a.quantity || b.revenue - a.revenue;
    }).slice(0, Math.max(1, limit || 6));
    var risk = rows.slice().filter(function (row) {
      return row.status === 'margem_baixa' || row.status === 'prejuizo' || row.status === 'sem_custo';
    }).sort(function (a, b) {
      return a.marginPercent - b.marginPercent || b.revenue - a.revenue;
    }).slice(0, 3);
    var seen = {};
    return top.concat(risk).filter(function (row) {
      var key = [row.productId, row.combination, row.channel].join('::');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, Math.max(1, limit || 6));
  }

  function _seasonProductIndex(products) {
    var byId = {};
    var byName = {};
    (products || []).forEach(function (product) {
      if (!product) return;
      var id = String(product.id || product.uid || product.productId || '').trim();
      var name = _foldText(product.name || product.title || product.nome || '');
      if (id) byId[id] = product;
      if (name) byName[name] = product;
    });
    return { byId: byId, byName: byName };
  }

  function _seasonProductForOrderItem(item, index) {
    index = index || { byId: {}, byName: {} };
    var id = String(item && (item.productId || item.id || item.itemId) || '').trim();
    var name = _foldText(item && item.name || '');
    return (id && index.byId[id]) || (name && index.byName[name]) || null;
  }

  function _menuChoiceGroupsForSeason(product) {
    var groups = Array.isArray(product && product.menuChoiceGroups) ? product.menuChoiceGroups : [];
    return groups.map(function (group, groupIndex) {
      var rawOptions = Array.isArray(group && group.options) ? group.options
        : Array.isArray(group && group.items) ? group.items
        : Array.isArray(group && group.opcoes) ? group.opcoes
        : Array.isArray(group && group.choices) ? group.choices
        : [];
      var options = rawOptions.map(function (option, optionIndex) {
        if (!option || typeof option !== 'object') return null;
        var label = String(_firstValue(option.name, option.label, option.title, option.value, option.ref, 'Opção ' + (optionIndex + 1))).trim();
        return {
          id: String(_firstValue(option.id, option.optionId, option.ref, label)),
          ref: String(_firstValue(option.ref, option.stockRef, option.stockItemRef, '')),
          label: label,
          name: label,
          priceExtra: _money(_firstValue(option.priceExtra, option.extraPrice, option.price, option.valorExtra, 0)),
          unitCost: _money(_firstValue(option.stockUnitCost, option.unitCost, option.cost, 0)),
          stockItemId: String(_firstValue(option.stockItemId, option.itemId, '')),
          stockItemType: String(_firstValue(option.stockItemType, option.itemClass, option.classe, ''))
        };
      }).filter(Boolean);
      if (!options.length) return null;
      return {
        id: String(_firstValue(group.id, group.key, 'group_' + groupIndex)),
        title: String(_firstValue(group.title, group.name, group.label, 'Escolha ' + (groupIndex + 1))),
        options: options
      };
    }).filter(Boolean);
  }

  function _soldCombinationForSeason(product, item) {
    return _soldCombinationFromStructuredChoices(product, item) || _soldCombinationFromChoiceText(product, item);
  }

  function _soldCombinationFromStructuredChoices(product, item) {
    var choices = _structuredSeasonChoices(item);
    if (!choices.length) return null;
    var groups = _menuChoiceGroupsForSeason(product);
    var selections = [];
    var extraPrice = 0;
    groups.forEach(function (group) {
      var selected = [];
      choices.forEach(function (choice) {
        if (!_seasonChoiceGroupMatches(group, choice.groupId, choice.groupName || choice.group || choice.title)) return;
        var option = _seasonMatchMenuOption(group, choice.optionName || choice.name || choice.label || choice.value || choice.option, choice.ref || choice.optionRef || choice.stockRef || choice.stockItemRef);
        if (!option) return;
        var qty = Math.max(1, _number(_firstValue(choice.quantity, choice.qty, choice.count, 1), 1));
        selected.push(Object.assign({}, option, { qty: qty }));
        extraPrice += _money(option.priceExtra) * qty;
      });
      if (selected.length) selections.push({ groupId: group.id, groupName: group.title, options: selected });
    });
    if (!selections.length) return null;
    return { selections: selections, extraPrice: extraPrice, label: _seasonCombinationLabel(selections) };
  }

  function _structuredSeasonChoices(item) {
    var fields = ['menuChoices', 'choiceDetails', 'selectedChoiceDetails', 'variantChoices', 'selectedOptions', 'variants', 'options'];
    for (var i = 0; i < fields.length; i++) {
      var list = item && item[fields[i]];
      if (Array.isArray(list) && list.some(function (choice) { return choice && typeof choice === 'object'; })) {
        return list.filter(function (choice) { return choice && typeof choice === 'object'; });
      }
    }
    return [];
  }

  function _soldCombinationFromChoiceText(product, item) {
    var texts = Array.isArray(item && item.choices) ? item.choices : [];
    if (!texts.length) return null;
    var groups = _menuChoiceGroupsForSeason(product);
    var selections = [];
    var extraPrice = 0;
    groups.forEach(function (group) {
      var selected = [];
      texts.forEach(function (choiceText) {
        if (typeof choiceText !== 'string') return;
        var parsed = _parseSeasonChoiceText(choiceText);
        if (!_seasonChoiceGroupMatches(group, '', parsed.group)) return;
        parsed.options.forEach(function (parsedOption) {
          var option = _seasonMatchMenuOption(group, parsedOption.name, '');
          if (!option) return;
          selected.push(Object.assign({}, option, { qty: parsedOption.qty }));
          extraPrice += _money(option.priceExtra) * parsedOption.qty;
        });
      });
      if (selected.length) selections.push({ groupId: group.id, groupName: group.title, options: selected });
    });
    if (!selections.length) return null;
    return { selections: selections, extraPrice: extraPrice, label: _seasonCombinationLabel(selections) };
  }

  function _parseSeasonChoiceText(value) {
    var text = String(value || '');
    var parts = text.split(':');
    var group = parts.length > 1 ? parts.shift() : '';
    var rest = parts.join(':') || text;
    return {
      group: group.trim(),
      options: rest.split(',').map(function (part) {
        var raw = String(part || '').trim();
        var match = raw.match(/\s+x\s*(\d+)\s*$/i);
        var qty = match ? parseInt(match[1], 10) || 1 : 1;
        var name = match ? raw.replace(/\s+x\s*\d+\s*$/i, '').trim() : raw;
        return { name: name, qty: qty };
      }).filter(function (entry) { return entry.name; })
    };
  }

  function _seasonChoiceGroupMatches(group, groupId, groupName) {
    if (groupId && String(group.id || '') === String(groupId)) return true;
    var wanted = _foldText(groupName || '');
    if (!wanted) return false;
    return _foldText(group.title || '') === wanted || _foldText(group.name || '') === wanted;
  }

  function _seasonMatchMenuOption(group, optionName, ref) {
    var refKey = String(ref || '').trim();
    var nameKey = _foldText(optionName || '');
    return (group.options || []).filter(function (option) {
      return (refKey && String(option.ref || '') === refKey) || (nameKey && (_foldText(option.label || '') === nameKey || _foldText(option.name || '') === nameKey));
    })[0] || null;
  }

  function _seasonCombinationLabel(selections) {
    return (selections || []).map(function (selection) {
      var choices = (selection.options || []).map(function (option) {
        return option.label + (_number(option.qty, 0) > 1 ? ' x' + Math.round(_number(option.qty, 1)) : '');
      }).join(', ');
      return selection.groupName + ': ' + choices;
    }).join(' / ');
  }

  function _soldCombinationCostForSeason(combination, actionContext) {
    return (combination.selections || []).reduce(function (sum, selection) {
      return sum + (selection.options || []).reduce(function (lineSum, option) {
        return lineSum + _seasonMenuOptionUnitCost(option, actionContext) * Math.max(1, _number(option.qty, 1));
      }, 0);
    }, 0);
  }

  function _seasonMenuOptionUnitCost(option, actionContext) {
    var ref = String(option && option.ref || '').trim();
    var parts = ref ? ref.split(':') : [];
    var refType = parts[0] || '';
    var refId = parts.slice(1).join(':');
    var itemId = String(option && (option.stockItemId || option.itemId) || refId || '').trim();
    if ((refType === 'ficha' || refType === 'receita' || refType === 'base_producao') && itemId) {
      return _recipeUnitCost(_findRecipeById(itemId, actionContext.recipes || []), actionContext.costItems || []);
    }
    if ((refType === 'produto_pronto' || refType === 'pronto' || refType === 'item' || refType === 'insumo' || refType === 'ingrediente' || refType === 'embalagem') && itemId) {
      return _costItemUnitCost(_findCostItemById(itemId, actionContext.costItems || []));
    }
    return _money(option && option.unitCost || 0);
  }

  function _soldCombinationFeesForSeason(unitPrice, channel, actionContext, orderItemCount) {
    var config = _channelConfigFor(channel, actionContext && actionContext.salesChannels || []);
    if (!config) return 0;
    var commission = _money(unitPrice) * _number(config.commissionPct, 0) / 100;
    var commissionTax = commission > 0 ? commission * _number(config.taxPct, 0) / 100 : 0;
    var fixed = Math.max(1, Math.round(_number(orderItemCount, 1))) === 1 ? _money(config.fixedFee || 0) : 0;
    return commission + commissionTax + fixed;
  }

  function _soldCombinationStatus(row) {
    if (!_number(row.averageCost, 0)) return 'sem_custo';
    if (_number(row.profit, 0) < 0) return 'prejuizo';
    if (_number(row.marginPercent, 0) < 25) return 'margem_baixa';
    return 'saudavel';
  }

  function _soldCombinationReason(row) {
    if (row.status === 'sem_custo') return 'falta custo da combinação';
    if (row.status === 'prejuizo') return 'vendeu abaixo do custo e taxas';
    if (row.status === 'margem_baixa') return 'sobra apertada na combinação vendida';
    return 'combinação vendida com sobra saudável';
  }

  function _productChainCost(product, actionContext) {
    product = product || {};
    actionContext = actionContext || {};
    var recipes = actionContext.recipes || [];
    var costItems = actionContext.costItems || [];
    if (!product) return { cost: 0, source: '', breakdown: [] };
    if (Array.isArray(product.internalComposition) || Array.isArray(product.internalCompositionItems)) {
      var internal = _internalCompositionChainCost(product, actionContext);
      if (internal.cost > 0) return internal;
    }
    var src = String(product.unicoSource || product.sourceType || product.source || '').toLowerCase();
    var readyId = String(product.produtoProntoId || product.sourceItemId || product.readyProductId || '').trim();
    var recipeId = String(product.fichaTecnicaId || product.fichaId || product.recipeId || '').trim();
    if ((src === 'produto_pronto' || src === 'compras_produto' || readyId) && readyId) {
      var ready = _findCostItemById(readyId, costItems);
      var readyCost = _costItemUnitCost(ready);
      if (readyCost > 0) return { cost: readyCost, source: 'produto_pronto', breakdown: [{ type: 'produto_pronto', id: readyId, name: ready && (ready.nome || ready.name) || product.name || '', cost: readyCost }] };
    }
    if ((src === 'receita' || recipeId) && recipeId) {
      var recipe = _findRecipeById(recipeId, recipes);
      var recipeCost = _recipeUnitCost(recipe, costItems);
      if (recipeCost > 0) return { cost: recipeCost, source: 'ficha_tecnica', breakdown: [{ type: 'ficha_tecnica', id: recipeId, name: recipe && (recipe.name || recipe.nome) || product.name || '', cost: recipeCost }] };
    }
    return { cost: 0, source: '', breakdown: [] };
  }

  function _internalCompositionChainCost(product, actionContext) {
    var items = Array.isArray(product && product.internalComposition)
      ? product.internalComposition
      : (Array.isArray(product && product.internalCompositionItems) ? product.internalCompositionItems : []);
    var total = 0;
    var breakdown = [];
    (items || []).forEach(function (part) {
      if (!part) return;
      var qty = _money(_firstValue(part.quantity, part.qty, part.quantidade, part.stockQuantity, 1)) || 1;
      var ref = String(part.ref || part.stockRef || part.stockItemRef || '').trim();
      var refParts = ref ? ref.split(':') : [];
      var refType = refParts[0] || '';
      var refId = refParts.slice(1).join(':');
      var type = String(part.stockItemType || part.itemClass || part.classe || '').trim();
      var itemId = String(part.itemId || part.stockItemId || part.fichaTecnicaId || part.fichaId || part.sourceItemId || part.produtoProntoId || refId || '').trim();
      if (!type && (refType === 'ficha' || refType === 'receita')) type = 'produto_produzido';
      if (!type && refType === 'produto_pronto') type = 'produto_pronto';
      if (!type && (refType === 'insumo' || refType === 'ingrediente' || refType === 'embalagem')) type = refType === 'embalagem' ? 'embalagem' : 'insumo';
      var unitCost = _money(_firstValue(part.unitCost, part.stockUnitCost, part.cost, part.custo, 0));
      if (!(unitCost > 0) && type === 'produto_produzido') unitCost = _recipeUnitCost(_findRecipeById(itemId, actionContext.recipes || []), actionContext.costItems || []);
      if (!(unitCost > 0) && type === 'produto_pronto') unitCost = _costItemUnitCost(_findCostItemById(itemId, actionContext.costItems || []));
      if (!(unitCost > 0) && (type === 'insumo' || type === 'embalagem')) unitCost = _costItemUnitCost(_findCostItemById(itemId, actionContext.costItems || []));
      if (!(unitCost > 0)) return;
      var lineCost = qty * unitCost;
      total += lineCost;
      breakdown.push({ type: type || 'item', id: itemId, name: part.itemName || part.stockItemName || part.name || '', quantity: qty, unitCost: unitCost, cost: lineCost });
    });
    return { cost: total, source: total > 0 ? 'composicao_interna' : '', breakdown: breakdown };
  }

  function _findRecipeById(id, recipes) {
    id = String(id || '').trim();
    if (!id) return null;
    return (recipes || []).filter(function (item) {
      return item && String(item.id || item.uid || item.recipeId || '') === id;
    })[0] || null;
  }

  function _findCostItemById(id, costItems) {
    id = String(id || '').trim();
    if (!id) return null;
    return (costItems || []).filter(function (item) {
      return item && String(item.id || item.uid || item.itemId || '') === id;
    })[0] || null;
  }

  function _costItemUnitCost(item) {
    if (!item) return 0;
    return _money(_firstValue(
      item.unitCost,
      item.stockUnitCost,
      item.custo_atual,
      item.custoAtual,
      item.purchasePrice,
      item.preco_compra,
      item.precoCompra,
      item.cost,
      item.custo,
      0
    ));
  }

  function _recipeUnitCost(recipe, costItems) {
    if (!recipe) return 0;
    var saved = _money(_firstValue(recipe.costPerYield, recipe.unitCost, recipe.stockUnitCost, recipe.custoUnitario, 0));
    if (saved > 0) return saved;
    var yieldQty = _money(_firstValue(recipe.yieldQuantity, recipe.yield, recipe.rendimento, 0));
    var direct = _recipeDirectCost(recipe, costItems || []);
    var indirectPct = _money(_firstValue(recipe.indirectCostPercent, recipe.indirectCostPct, 0));
    var indirect = _money(_firstValue(recipe.indirectCost, 0));
    var total = _money(_firstValue(recipe.totalCost, recipe.custoTotal, 0));
    if (!(total > 0)) total = direct + (indirect > 0 ? indirect : direct * indirectPct / 100);
    return yieldQty > 0 && total > 0 ? total / yieldQty : 0;
  }

  function _recipeDirectCost(recipe, costItems) {
    var total = _money(_firstValue(recipe.directCost, 0));
    if (total > 0) return total;
    var ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    var packaging = Array.isArray(recipe.packagingItems) ? recipe.packagingItems : (Array.isArray(recipe.packaging) ? recipe.packaging : []);
    var components = Array.isArray(recipe.components) ? recipe.components : (Array.isArray(recipe.recipeComponents) ? recipe.recipeComponents : []);
    if (ingredients.length) return _recipeLineCost(ingredients, costItems);
    total += _recipeLineCost(packaging, costItems);
    (components || []).forEach(function (component) {
      var componentLines = Array.isArray(component.ingredients) ? component.ingredients : [];
      var raw = _recipeLineCost(componentLines, costItems);
      var ratio = _componentCostRatio(component, recipe);
      total += raw * ratio;
    });
    return total;
  }

  function _recipeLineCost(lines, costItems) {
    return (lines || []).reduce(function (sum, line) {
      var saved = _money(_firstValue(line.appliedTotalCost, line.totalCost, line.rawTotalCost, 0));
      if (saved > 0) return sum + saved;
      var qty = _money(_firstValue(line.appliedGrossQuantity, line.grossQuantityCalculated, line.grossQuantity, line.qty, line.quantity, 0));
      var unitCost = _money(_firstValue(line.unitCost, 0));
      if (!(unitCost > 0)) {
        var item = _findCostItemById(line.insumoId || line.itemId || line.packagingId || '', costItems);
        unitCost = _costItemUnitCost(item);
      }
      return sum + (qty > 0 && unitCost > 0 ? qty * unitCost : 0);
    }, 0);
  }

  function _componentCostRatio(component, recipe) {
    var stageQty = _money(_firstValue(component.stageYieldQuantity, component.baseYieldQuantity, component.stockYieldQuantity, 0));
    var usageQty = _money(_firstValue(component.stageUsageQuantity, component.usageQuantity, component.quantityPerUnit, component.baseUsageQuantity, 0));
    if (stageQty > 0 && usageQty > 0) return usageQty / stageQty;
    var ratio = _money(_firstValue(component.stageUsageRatio, 0));
    if (ratio > 0) return ratio;
    var recipeQty = _money(_firstValue(recipe && recipe.yieldQuantity, recipe && recipe.yield, 0));
    return stageQty > 0 && recipeQty > 0 ? recipeQty / stageQty : 1;
  }

  function _bestAvailablePromotionForProduct(product, promotions, actionContext) {
    if (!product) return null;
    var candidates = (promotions || []).map(function (promo) {
      if (!_actionPromoApplies(promo, product)) return null;
      var calc = _actionPromoCalc(product, promo, actionContext);
      if (!calc) return null;
      return Object.assign(calc, {
        id: promo.id || promo._id || '',
        name: String(promo.name || promo.title || promo.nome || 'Promoção').trim(),
        promo: promo,
        canUse: calc.marginAfterPct === null || calc.marginAfterPct >= 25
      });
    }).filter(Boolean).sort(function (a, b) {
      return (b.canUse === true) - (a.canUse === true) || b.discountValue - a.discountValue;
    });
    return candidates[0] || null;
  }

  function _bestAvailableCouponForProduct(economics, coupons) {
    if (!economics || !economics.hasPriceAndCost) return null;
    var candidates = (coupons || []).filter(_actionCouponActive).map(function (coupon) {
      var type = String(coupon.type || coupon.discountType || 'pct');
      var value = _money(coupon.value != null ? coupon.value : coupon.discountValue);
      var discount = type === 'eur' ? value : economics.price * value / 100;
      var finalPrice = Math.max(economics.price - discount, 0);
      var marginAfterPct = finalPrice > 0 ? ((finalPrice - economics.cost) / finalPrice) * 100 : -100;
      return {
        code: String(coupon.code || coupon.codigo || coupon.name || coupon.id || '').trim().toUpperCase(),
        discountValue: discount,
        finalPrice: finalPrice,
        marginAfterPct: marginAfterPct,
        canUse: marginAfterPct >= 25
      };
    }).filter(function (item) { return item.code && item.discountValue > 0; }).sort(function (a, b) {
      return (b.canUse === true) - (a.canUse === true) || b.marginAfterPct - a.marginAfterPct;
    });
    return candidates[0] || null;
  }

  function _bestAvailableUpsellForProduct(product, upsells) {
    if (!product) return null;
    var productId = String(product.id || product.productId || '').trim();
    var productName = _foldText(product.name || product.nome || product.title || '');
    return (upsells || []).filter(_actionUpsellActive).filter(function (rule) {
      var ids = _arrayStrings(rule.triggerProductIds).concat(_arrayStrings(rule.productIds)).concat(_arrayStrings(rule.productsSelected));
      if (productId && ids.indexOf(productId) >= 0) return true;
      var text = _foldText([rule.name, rule.title, rule.triggerText, rule.productsText].join(' '));
      return productName && text.indexOf(productName) >= 0;
    }).map(function (rule) {
      return { id: rule.id || rule._id || '', name: String(rule.name || rule.title || 'Upsell').trim(), rule: rule };
    })[0] || null;
  }

  function _productActionName(product) {
    return String(product && (product.name || product.nome || product.title || product.label) || '').trim();
  }

  function _bestComplementProductForProduct(baseProduct, baseEconomics, products, actionContext) {
    if (!baseProduct) return null;
    var baseId = String(baseProduct.id || baseProduct.productId || '').trim();
    var baseName = _foldText(_productActionName(baseProduct));
    var candidates = (products || []).map(function (product) {
      if (!product) return null;
      var productId = String(product.id || product.productId || '').trim();
      var name = _productActionName(product);
      if (!name) return null;
      if (baseId && productId && baseId === productId) return null;
      if (baseName && _foldText(name) === baseName) return null;
      if (product.hidden === true || product.visible === false || product.showInMenu === false || product.cardapioVisible === false) return null;
      var status = _foldText(product.status || product.situacao || '');
      if (['inativo', 'inativa', 'oculto', 'oculta', 'pausado', 'pausada'].indexOf(status) >= 0) return null;
      var economics = _productEconomics(product, null, actionContext);
      var price = _number(economics.price, 0);
      if (!(price > 0)) return null;
      var margin = economics.hasPriceAndCost ? _number(economics.marginPct, 0) : 0;
      var basePrice = _number(baseEconomics && baseEconomics.price, 0);
      var priceFit = basePrice > 0 ? Math.max(0, 20 - Math.abs(price - (basePrice * .45))) : 5;
      var score = priceFit + (economics.hasPriceAndCost ? 20 : 4) + Math.max(0, Math.min(25, margin));
      return { product: product, economics: economics, score: score };
    }).filter(Boolean).sort(function (a, b) {
      return _number(b.score, 0) - _number(a.score, 0);
    });
    return candidates[0] || null;
  }

  function _actionPromoApplies(promo, product) {
    if (!_actionPromoActive(promo)) return false;
    var ids = _arrayStrings(promo.productIds).concat(_arrayStrings(promo.productsSelected)).concat(_arrayStrings(promo.selectedProductIds)).concat(_arrayStrings(promo.suggestedProductIds));
    var productId = String(product.id || product.productId || '').trim();
    if (promo.applyTo === 'all' || promo.scope === 'todos_produtos' || promo.scope === 'all') return true;
    if (productId && ids.indexOf(productId) >= 0) return true;
    if (productId && String(promo.productId || promo.suggestedProductId || '') === productId) return true;
    return !ids.length && !promo.productId && !promo.suggestedProductId;
  }

  function _actionPromoActive(promo) {
    if (!promo || promo.active === false) return false;
    var status = _foldText(promo.status || '');
    if (['pausada', 'pausado', 'expirada', 'expirado', 'finalizada', 'finalizado', 'inativa', 'inativo'].indexOf(status) >= 0) return false;
    return _dateWindowActive(promo.startDate || promo.startsAt || promo.from, promo.endDate || promo.endsAt || promo.to);
  }

  function _actionCouponActive(coupon) {
    if (!coupon || coupon.active === false) return false;
    var status = _foldText(coupon.status || '');
    if (['pausado', 'pausada', 'expirado', 'expirada', 'inativo', 'inativa'].indexOf(status) >= 0) return false;
    return _dateWindowActive(coupon.startDate || coupon.startsAt || coupon.from, coupon.expiry || coupon.endDate || coupon.endsAt || coupon.to);
  }

  function _actionUpsellActive(rule) {
    if (!rule || rule.active === false) return false;
    var status = _foldText(rule.status || '');
    return ['pausado', 'pausada', 'expirado', 'expirada', 'inativo', 'inativa'].indexOf(status) < 0 && _dateWindowActive(rule.startDate || rule.startsAt || rule.from, rule.endDate || rule.endsAt || rule.to);
  }

  function _dateWindowActive(startRaw, endRaw) {
    var now = new Date();
    var start = startRaw ? _toDate(startRaw) : null;
    if (start && now < start) return false;
    var end = endRaw ? _toDate(endRaw) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
      if (now > end) return false;
    }
    return true;
  }

  function _actionPromoCalc(product, promo, actionContext) {
    var economics = _productEconomics(product, null, actionContext);
    if (!(economics.price > 0)) return null;
    var type = _foldText(promo.type || promo.tipo || promo.discountType || promo.benefitType || '');
    var value = _money(_firstValue(promo.valuePercentual, promo.discountPct, promo.pctValue, promo.value));
    var eurValue = _money(_firstValue(promo.valueDesconto, promo.eurValue, promo.fixedDiscount, promo.value));
    var fixedPrice = _money(_firstValue(promo.fixedPrice, promo.finalPrice, promo.offerPrice, promo.priceFixed));
    var finalPrice = economics.price;
    var legacyQtyPromo = /^(2x1|2por1|two_for_one|b2x1)$/.test(type);
    var leve = parseInt(_firstValue(promo.leveQtd, promo.bundleQty, legacyQtyPromo ? 2 : 0), 10) || 0;
    var pague = parseInt(_firstValue(promo.pagueQtd, promo.bundlePay, legacyQtyPromo ? 1 : 0), 10) || 0;
    if (type === 'pct' || type === 'porcentagem' || type === 'percent') finalPrice = Math.max(economics.price - (economics.price * value / 100), 0);
    else if (type === 'eur' || type === 'valor' || type === 'fixed_discount') finalPrice = Math.max(economics.price - eurValue, 0);
    else if (type === 'fixed' || type === 'preco_fixo') finalPrice = fixedPrice > 0 ? Math.min(fixedPrice, economics.price) : economics.price;
    else if ((type === 'add1' || legacyQtyPromo) && leve > 0 && leve > pague) finalPrice = Math.max((economics.price * pague) / leve, 0);
    var marginAfterPct = economics.hasPriceAndCost && finalPrice > 0 ? ((finalPrice - economics.cost) / finalPrice) * 100 : null;
    return {
      finalPrice: finalPrice,
      discountValue: Math.max(economics.price - finalPrice, 0),
      marginAfterPct: marginAfterPct
    };
  }

  function _arrayStrings(value) {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  }

  function _firstValue() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== '') return arguments[i];
    }
    return '';
  }

  function _foldText(value) {
    var raw = String(value || '').trim().toLowerCase();
    return raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
  }

  function _normalizeText(value) {
    return _foldText(value).replace(/[\s-]+/g, '_');
  }

  function _buildSeasonExecutionPlan(season, currentMetrics, validatedImpactSignals, riskContext) {
    var profile = _difficultyExecutionProfile(season && season.difficulty);
    var signals = validatedImpactSignals || {};
    var metrics = currentMetrics || {};
    var actions = [];
    var hasCurrentOrders = _number(metrics.orders, 0) > 0;
    var topProduct = signals.products && signals.products.topProduct && signals.products.topProduct.name ? signals.products.topProduct : (metrics.topProducts || [])[0];
    var topChannel = signals.channels && signals.channels.topChannel;
    var strongHour = (metrics.strongHours || [])[0];
    var channelLabel = topChannel && topChannel.channel ? _channelLabel(topChannel.channel) : '';
    var hourLabel = strongHour && strongHour.hour !== undefined ? _formatHourLabel(strongHour.hour) : '';
    var opportunities = metrics.actionOpportunities || {};
    var recommendedAction = opportunities.recommendedAction || null;
    var economics = opportunities.topProductEconomics || {};
    var availableComplement = opportunities.availableComplement || null;
    var complementName = availableComplement && availableComplement.product ? _productActionName(availableComplement.product) : '';
    var marginText = economics.hasPriceAndCost ? ('preço ' + _fmtMoney(economics.price) + ', custo ' + _fmtMoney(economics.cost) + ' e margem atual de ' + Math.round(_number(economics.marginPct, 0)) + '%') : '';
    var productEvidence = topProduct && topProduct.name ? (topProduct.name + ' vendeu ' + Math.round(_number(topProduct.quantity, 0)) + ' unidade(s) e gerou ' + _fmtMoney(_number(topProduct.revenue, 0)) + ' nesta temporada') : '';
    var channelEvidence = topChannel && topChannel.channel ? (channelLabel + ' trouxe ' + Math.round(_number(topChannel.orders, 0)) + ' pedido(s) e ' + _fmtMoney(_number(topChannel.revenue, 0))) : '';
    var hourEvidence = strongHour && strongHour.hour !== undefined ? (hourLabel + ' concentrou ' + Math.round(_number(strongHour.orders, 0)) + ' pedido(s)') : '';
    var rankedActions = _selectRankedSeasonActions(_applySeasonActionStrategy(opportunities.rankedActions || [], season), profile.maxActions, _seasonExcludedActionIds(season));

    if (!hasCurrentOrders) {
      actions.push(_seasonAction(
        'primeira-base-temporada',
        'Abrir a temporada com os primeiros pedidos',
        'Hoje, coloque a operação para rodar e registre os primeiros pedidos com produto, canal e horário certos.',
        'A temporada começou agora. Ainda não existe venda dentro deste período para dizer qual produto, canal ou horário respondeu melhor.',
        'baseline',
        'high',
        [
          'Abra a operação do dia.',
          'Registre os pedidos reais assim que eles entrarem.',
          'Confira se cada pedido ficou com produto, canal de venda e horário corretos.',
          'Depois dos primeiros pedidos, a próxima jogada passa a usar o que realmente aconteceu nesta temporada.'
        ]
      ));
      return {
        difficulty: season && season.difficulty || 'balanced',
        difficultyProfile: profile,
        actions: actions,
        alertThresholds: {
          progressRatioAttention: profile.progressRatioAttention,
          progressRatioCritical: profile.progressRatioCritical
        },
        source: 'season_start_without_orders'
      };
    }

    if (rankedActions.length) {
      actions = rankedActions;
      if (actions.length < profile.maxActions) {
        actions = _completeSeasonActions(actions, profile, season, metrics, signals, opportunities, topProduct, topChannel, strongHour);
      }
      return {
        difficulty: season && season.difficulty || 'balanced',
        difficultyProfile: profile,
        actions: actions.slice(0, profile.maxActions),
        alertThresholds: {
          progressRatioAttention: profile.progressRatioAttention,
          progressRatioCritical: profile.progressRatioCritical
        },
        source: 'ranked_orders_and_validated_signals'
      };
    }

    if (topProduct && topProduct.name && !(recommendedAction && /^promotion_/.test(String(recommendedAction.type || '')))) {
      var productChecklist = [
        productEvidence || ('Produto da jogada: ' + topProduct.name + '.'),
        channelEvidence || (channelLabel ? 'Canal da jogada: ' + channelLabel + '.' : 'Canal da jogada: ainda não há canal dominante, então mantenha o canal principal da operação.'),
        hourEvidence || (hourLabel ? 'Horário da jogada: perto de ' + hourLabel + '.' : 'Horário da jogada: mantenha o período em que os pedidos entram melhor.')
      ];
      if (recommendedAction && recommendedAction.checklist && recommendedAction.checklist.length) {
        productChecklist = productChecklist.concat(recommendedAction.checklist.slice(0, 2));
      } else if (marginText) {
        productChecklist.push('Sem ação de desconto recomendada agora: ' + marginText + '. Use destaque ou upsell primeiro.');
      } else {
        productChecklist.push('Sem custo completo para calcular desconto saudável. Use destaque ou upsell sem reduzir preço.');
      }
      actions.push(_seasonAction(
        'produto-forte',
        'Vender mais ' + topProduct.name,
        recommendedAction && recommendedAction.description ? recommendedAction.description : ('Hoje, use ' + topProduct.name + ' como produto principal da ação' + (channelLabel ? ' no canal ' + channelLabel : '') + (hourLabel ? ' perto de ' + hourLabel : '') + '.'),
        recommendedAction && recommendedAction.why ? recommendedAction.why : ((productEvidence || 'Esse produto aparece como uma das melhores respostas da temporada') + (marginText ? ' e tem ' + marginText + '.' : '.')),
        'products',
        'high',
        productChecklist
      ));
    }

    if (season && season.objective === 'increase_ticket') {
      var upsell = signals.upsell || {};
      if (_number(upsell.acceptedOrders, 0) > 0) {
        actions.push(_seasonAction(
          'upsell-validado',
          'Repetir o upsell que já funcionou',
          'Ofereça o upsell nos pedidos de hoje para subir o valor do pedido.',
          'O upsell já foi aceito em ' + Math.round(_number(upsell.acceptedOrders, 0)) + ' pedido(s) válido(s) e acrescentou ' + _fmtMoney(_number(upsell.addedRevenue, 0)) + '.',
          'upsell',
          'high',
          [
            topProduct && topProduct.name ? 'Produto de entrada: ' + topProduct.name + '.' : 'Use no produto que mais recebe pedidos.',
            'Esse upsell já acrescentou ' + _fmtMoney(_number(upsell.addedRevenue, 0)) + ' em pedidos válidos.',
            'Use o adicional antes de finalizar o pedido para subir o valor sem reduzir preço.'
          ]
        ));
      } else if (topProduct && topProduct.name) {
        var ticketTitle = complementName ? 'Oferecer ' + complementName + ' junto de ' + topProduct.name : 'Criar upsell para ' + topProduct.name;
        var ticketDescription = complementName
          ? 'Quando a cliente escolher ' + topProduct.name + ', ofereça ' + complementName + ' como complemento no Cardápio. A jogada é aumentar o pedido com um item concreto, não com desconto.'
          : 'Ainda não encontrei complemento pronto para ' + topProduct.name + '. Crie um upsell no Cardápio ligado a esse produto antes de tratar essa jogada como pronta.';
        actions.push(_seasonAction(
          'ticket-produto',
          ticketTitle,
          ticketDescription,
          complementName ? topProduct.name + ' é o produto de entrada e ' + complementName + ' foi escolhido como complemento possível para subir o valor do pedido.' : 'O objetivo desta temporada é aumentar ticket, mas falta um complemento pronto para transformar isso em venda.',
          'objective',
          'medium',
          complementName ? [
            'Produto de entrada: ' + topProduct.name + '.',
            'Complemento da jogada: ' + complementName + '.',
            'Canal: Cardápio.',
            'Vai valer a pena se os pedidos começarem a levar os dois itens juntos.'
          ] : [
            'Produto de entrada: ' + topProduct.name + '.',
            'Crie um upsell no Cardápio para esse produto.',
            'Escolha um complemento com preço e custo cadastrados.',
            'Depois de criado, o BocaFood mede venda adicional e ticket médio.'
          ]
        ));
      }
    }

    if (season && season.objective === 'retain_customers') {
      var points = signals.points || {};
      actions.push(_seasonAction(
        'recorrencia',
        'Chamar quem já comprou',
        'Hoje, convide clientes que já compraram antes para repetir o pedido ou aproveitar os pontos.',
        _number(points.repeatCustomers, 0) > 0 ? 'Pontos já ajudaram ' + Math.round(_number(points.repeatCustomers, 0)) + ' cliente(s) recorrente(s).' : 'A temporada mede recompra, então a melhor ação é trazer clientes de volta.',
        'points',
        'medium',
        [
          'Público da jogada: clientes que já compraram antes.',
          _number(points.repeatCustomers, 0) > 0 ? 'Sinal atual: pontos ajudaram ' + Math.round(_number(points.repeatCustomers, 0)) + ' cliente(s) recorrente(s).' : 'Motivo: esta temporada precisa gerar recompra.',
          topProduct && topProduct.name ? 'Produto do convite: ' + topProduct.name + '.' : 'Produto do convite: use o produto com melhor saída.'
        ]
      ));
    }

    if (season && season.objective === 'improve_consistency') {
      var weakDays = Math.round(_number(metrics.weakDays, 0));
      actions.push(_seasonAction(
        'dia-fraco',
        'Recuperar o próximo dia fraco',
        productName ? 'Use ' + productName + ' no próximo dia fraco para repetir a combinação que já gerou resposta.' : 'Use a melhor oferta disponível no próximo dia fraco.',
        weakDays > 0 ? weakDays + ' dia(s) fraco(s) ainda estão pesando na consistência.' : 'A temporada quer espalhar melhor as vendas durante o período.',
        'consistency',
        'medium',
        [
          topProduct && topProduct.name ? 'Produto da jogada: ' + topProduct.name + '.' : 'Produto da jogada: produto com mais pedidos na temporada.',
          hourEvidence || (hourLabel ? 'Horário da jogada: perto de ' + hourLabel + '.' : 'Horário da jogada: use o melhor período de venda.'),
          'Motivo: existem ' + weakDays + ' dia(s) fraco(s) na temporada.'
        ]
      ));
    }

    var coupon = signals.coupons || {};
    if (_number(coupon.usedOrders, 0) > 0 && profile.maxActions > actions.length) {
      actions.push(_seasonAction(
        'cupom-validado',
        'Usar cupom com direção clara',
        topProduct && topProduct.name ? 'Se for usar cupom hoje, aplique em ' + topProduct.name + ' ou no canal que já gerou pedido válido.' : 'Se for usar cupom hoje, mantenha no canal ou horário que já gerou pedido válido.',
        'Cupom apareceu em ' + Math.round(_number(coupon.usedOrders, 0)) + ' pedido(s) e vendeu ' + _fmtMoney(_number(coupon.revenue, 0)) + '.',
        'coupons',
        'medium',
        [
          topProduct && topProduct.name ? 'Produto da jogada: ' + topProduct.name + '.' : 'Produto da jogada: produto com mais pedidos na temporada.',
          'Esse cupom já vendeu ' + _fmtMoney(_number(coupon.revenue, 0)) + ' em pedido(s) válido(s).',
          'Mantenha a regra que já trouxe pedido antes de criar desconto maior.'
        ]
      ));
    }

    var promotion = signals.promotions || {};
    if (_number(promotion.usedOrders, 0) > 0 && profile.maxActions > actions.length && !actions.some(function (action) { return action.source === 'promotions' || /^promotion_/.test(String(action.id || '')); })) {
      var topPromotion = promotion.topPromotion || {};
      var promotionName = String(topPromotion.name || '').trim();
      actions.push(_seasonAction(
        'promocao-validada',
        promotionName ? 'Repetir ' + promotionName + ' com cuidado' : 'Repetir a promoção com cuidado',
        promotionName ? 'Use ' + promotionName + ' nos produtos ou horários em que ela já vendeu.' : (topProduct && topProduct.name ? 'Crie ou repita uma promoção focada em ' + topProduct.name + ', porque ele é o produto com mais força nesta temporada.' : 'Use a promoção que já gerou pedido válido e mantenha a mesma regra que vendeu.'),
        promotionName ? promotionName + ' apareceu em pedido(s) válido(s) e ajudou a vender ' + _fmtMoney(_number(topPromotion.revenue, promotion.revenue)) + '.' : 'Promoções apareceram em ' + Math.round(_number(promotion.usedOrders, 0)) + ' pedido(s) válido(s).',
        'promotions',
        'medium',
        [
          promotionName ? 'Mantenha a promoção ' + promotionName + ' com a mesma regra que já vendeu.' : (topProduct && topProduct.name ? 'Use ' + topProduct.name + ' como base da promoção.' : 'Use a promoção que já teve pedido válido.'),
          promotionName ? promotionName + ' já vendeu ' + _fmtMoney(_number(topPromotion.revenue, promotion.revenue)) + ' nesta temporada.' : 'Essa promoção já apareceu em pedido válido nesta temporada.',
          'Não aumente o desconto nesta jogada; repita a regra que já gerou venda.'
        ]
      ));
    }

    if (topProduct && topProduct.name && !_number(coupon.usedOrders, 0) && !_number(promotion.usedOrders, 0) && profile.maxActions > actions.length && !actions.some(function (action) { return action.source === 'sales_actions' || action.source === 'products'; })) {
      var salesActionDescription = recommendedAction && recommendedAction.description ? recommendedAction.description : ('Teste uma ação de venda simples para ' + topProduct.name + ', usando destaque no cardápio ou upsell sem mexer no preço.');
      var salesActionChecklist = recommendedAction && recommendedAction.checklist && recommendedAction.checklist.length ? recommendedAction.checklist : [
        'Use destaque no cardápio para ' + topProduct.name + '.',
        'Se houver upsell compatível, ofereça junto do produto.',
        'Use essa jogada porque ela preserva preço e aproveita o produto que já está puxando pedidos.'
      ];
      actions.push(_seasonAction(
        'acao-venda-produto',
        'Criar uma ação para ' + topProduct.name,
        salesActionDescription,
        recommendedAction && recommendedAction.why ? recommendedAction.why : 'O produto já mostrou resposta, mas ainda não há cupom ou promoção validada para ele nesta temporada.',
        'sales_actions',
        'medium',
        salesActionChecklist
      ));
    }

    if (actions.length && actions.length < profile.maxActions) {
      actions = _completeSeasonActions(actions, profile, season, metrics, signals, opportunities, topProduct, topChannel, strongHour);
    }

    if (!actions.length) {
      actions.push(_seasonAction(
        'gerar-base',
        'Criar base para o BocaFood ler',
        'Hoje, registre os pedidos com produto, canal e horário corretos para o sistema identificar onde a temporada responde melhor.',
        'Ainda não há histórico suficiente para recomendar produto, promoção, upsell ou canal específico.',
        'baseline',
        'high',
        [
          'Use esta jogada para criar a primeira base real de produto e canal.',
          'Mantenha a temporada rodando por alguns dias.',
          'Depois volte aqui para ver produto, horário e ação mais fortes.'
        ]
      ));
    }

    return {
      difficulty: season && season.difficulty || 'balanced',
      difficultyProfile: profile,
      actions: actions.slice(0, profile.maxActions),
      alertThresholds: {
        progressRatioAttention: profile.progressRatioAttention,
        progressRatioCritical: profile.progressRatioCritical
      },
      source: 'orders_and_validated_signals'
    };
  }

  function _completeSeasonActions(actions, profile, season, metrics, signals, opportunities, topProduct, topChannel, strongHour) {
    var out = (actions || []).slice();
    var productName = topProduct && topProduct.name;
    var channelLabel = topChannel && topChannel.channel ? _channelLabel(topChannel.channel) : '';
    var hourLabel = strongHour && strongHour.hour !== undefined ? _formatHourLabel(strongHour.hour) : '';
    var availableUpsell = opportunities && opportunities.availableUpsell;
    var availableCoupon = opportunities && opportunities.availableCoupon;
    var availableComplement = opportunities && opportunities.availableComplement;
    var complementName = availableComplement && availableComplement.product ? _productActionName(availableComplement.product) : '';
    var economics = opportunities && opportunities.topProductEconomics || {};

    function has(id) {
      return out.some(function (action) { return action.id === id; });
    }

    function add(action) {
      if (!action || out.length >= profile.maxActions || has(action.id)) return;
      out.push(action);
    }

    if (availableUpsell && availableUpsell.name && (!topChannel || !topChannel.channel || _isCardapioChannel(topChannel.channel))) {
      add(_seasonAction(
        'upsell-disponivel',
        'Subir o pedido com ' + availableUpsell.name,
        productName ? 'Ofereça ' + availableUpsell.name + ' junto de ' + productName + ' para aumentar o valor do pedido sem mexer no preço.' : 'Ofereça ' + availableUpsell.name + ' nos pedidos de hoje para aumentar o valor do pedido.',
        productName ? productName + ' é o produto de entrada desta jogada; ' + availableUpsell.name + ' aumenta o pedido sem aplicar desconto.' : 'Existe uma regra de upsell disponível para aumentar o pedido sem aplicar desconto.',
        'upsell',
        'medium',
        [
          productName ? 'Produto de entrada: ' + productName + '.' : 'Produto de entrada: pedido atual.',
          'Oferta extra: ' + availableUpsell.name + '.',
          'Canal da jogada: Cardápio, porque upsell só entra no canal de venda Cardápio.',
          'Efeito esperado: aumentar ticket sem reduzir margem do produto principal.'
        ]
      ));
    }

    if (availableCoupon && availableCoupon.canUse && productName) {
      add(_seasonAction(
        'cupom-disponivel',
        'Usar cupom ' + availableCoupon.code,
        'Use o cupom ' + availableCoupon.code + ' com ' + productName + ': a margem estimada depois do cupom fica em ' + Math.round(availableCoupon.marginAfterPct) + '%.',
        'O cupom está ativo e o cálculo de preço/custo indica margem suficiente para essa jogada.',
        'coupons',
        'medium',
        [
          'Divulgue o cupom ' + availableCoupon.code + ' junto de ' + productName + '.',
          'Preço estimado depois do cupom: ' + _fmtMoney(availableCoupon.finalPrice) + '.',
          'Margem estimada depois do cupom: ' + Math.round(availableCoupon.marginAfterPct) + '%.'
        ]
      ));
    }

    if (channelLabel || hourLabel) {
      var isCardapioAction = channelLabel && topChannel && _isCardapioChannel(topChannel.channel);
      add(_seasonAction(
        'canal-horario',
        isCardapioAction && productName ? 'Dar mais destaque para ' + productName + ' no Cardápio' : (channelLabel && productName ? 'Vender mais ' + productName + ' pelo canal ' + channelLabel : (channelLabel ? 'Usar melhor o canal ' + channelLabel : 'Usar o melhor horário')),
        isCardapioAction
          ? 'Deixe ' + (productName || 'o produto com melhor saída') + ' mais visível no Cardápio e use o horário que já trouxe resposta.'
          : ((channelLabel ? 'Use o canal ' + channelLabel : 'Use o melhor canal da temporada') + (hourLabel ? ' perto de ' + hourLabel : '') + ' com uma ação simples e fácil de reconhecer no resultado.'),
        [channelLabel ? channelLabel + ' trouxe ' + Math.round(_number(topChannel.orders, 0)) + ' pedido(s) e ' + _fmtMoney(_number(topChannel.revenue, 0)) : '', hourLabel ? hourLabel + ' concentrou ' + Math.round(_number(strongHour.orders, 0)) + ' pedido(s)' : ''].filter(Boolean).join('. ') + '.',
        'timing',
        'medium',
        isCardapioAction ? [
          'No Cardápio, deixe ' + (productName || 'o produto com melhor saída') + ' mais fácil de encontrar.',
          'Use o card de destaque, a ordem do produto ou uma promoção leve se a margem permitir.',
          hourLabel ? 'Faça essa ação perto de ' + hourLabel + '.' : 'Faça essa ação no período em que os pedidos entram melhor.',
          'Quando divulgar fora do BocaFood, envie o link do Cardápio direto para a cliente comprar por lá.'
        ] : [
          channelLabel ? 'Use o canal ' + channelLabel + ' como primeiro lugar dessa jogada.' : 'Use o canal que mais trouxe pedido.',
          productName ? 'Produto para oferecer: ' + productName + '.' : 'Produto para oferecer: produto com melhor saída.',
          hourLabel ? 'Faça a ação perto de ' + hourLabel + '.' : 'Use o período com melhor resposta.',
          'Mantenha a oferta simples para entender se esse canal continua respondendo.'
        ]
      ));
    }

    var recurring = Math.round(_number(metrics && metrics.recurringCustomers, 0));
    var repurchaseRate = _number(metrics && metrics.repurchaseRate, 0);
    if (_isMeaningfulRecurrence(recurring, repurchaseRate) || season && season.objective === 'retain_customers') {
      add(_seasonAction(
        'recorrencia-extra',
        'Trazer clientes de volta',
        productName ? 'Chame clientes que já compraram antes usando ' + productName + ' como motivo do convite.' : 'Chame clientes que já compraram antes para repetir o pedido.',
        _isMeaningfulRecurrence(recurring, repurchaseRate) ? recurring + ' clientes já voltaram no período, então recompra pode ser usada como jogada.' : 'O objetivo da temporada pede uma jogada de recompra.',
        'retention',
        'medium',
        [
          'Público da jogada: clientes que já compraram antes.',
          productName ? 'Ofereça ' + productName + ' como motivo claro para voltar.' : 'Use o produto com melhor saída como motivo claro para voltar.',
          'Objetivo da jogada: aumentar recompra dentro da temporada.'
        ]
      ));
    }

    var weakDays = Math.round(_number(metrics && metrics.weakDays, 0));
    if (weakDays > 0 && _number(metrics && metrics.orders, 0) > 0) {
      add(_seasonAction(
        'consistencia-extra',
        'Puxar um dia fraco',
        productName ? 'Use ' + productName + ' para puxar o próximo dia fraco da semana.' : 'Use a melhor oferta disponível para puxar o próximo dia fraco da semana.',
        weakDays + ' dia(s) fraco(s) ainda aparecem na temporada.',
        'consistency',
        'medium',
        [
          productName ? 'Produto da jogada: ' + productName + '.' : 'Produto da jogada: produto com melhor resposta.',
          channelLabel ? 'Canal da jogada: ' + channelLabel + '.' : 'Canal da jogada: o que mais respondeu.',
          hourLabel ? 'Horário da jogada: perto de ' + hourLabel + '.' : 'Horário da jogada: melhor período de venda.'
        ]
      ));
    }

    if (out.length < profile.maxActions && productName && economics.hasPriceAndCost && economics.maxHealthyDiscountPct > 0) {
      add(_seasonAction(
        'desconto-saudavel',
        'Desconto pequeno para ' + productName,
        'Se quiser criar uma jogada de desconto, use no máximo ' + economics.maxHealthyDiscountPct + '% em ' + productName + '.',
        'Com preço ' + _fmtMoney(economics.price) + ' e custo ' + _fmtMoney(economics.cost) + ', esse limite preserva margem mínima estimada.',
        'healthy_discount',
        'low',
        [
          'Use até ' + economics.maxHealthyDiscountPct + '% de desconto.',
          'Preço atual: ' + _fmtMoney(economics.price) + '.',
          'Custo cadastrado: ' + _fmtMoney(economics.cost) + '.'
        ]
      ));
    }

    if (out.length < profile.maxActions && season && season.objective === 'increase_ticket' && productName && complementName) {
      add(_seasonAction(
        'complemento-disponivel',
        'Vender ' + complementName + ' junto de ' + productName,
        'Use ' + complementName + ' como complemento de ' + productName + ' no Cardápio. Essa jogada aumenta o pedido com produto concreto, sem depender de desconto.',
        productName + ' é o produto de entrada e ' + complementName + ' é uma opção disponível para subir o valor do pedido.',
        'upsell',
        'medium',
        [
          'Produto de entrada: ' + productName + '.',
          'Complemento da jogada: ' + complementName + '.',
          'Canal: Cardápio.',
          availableComplement.economics && availableComplement.economics.hasPriceAndCost ? 'Sobra aproximada do complemento: ' + Math.round(_number(availableComplement.economics.marginPct, 0)) + '%.' : 'Use sem desconto até completar preço e custo.',
          'Vai valer a pena se o pedido médio subir com os dois produtos juntos.'
        ]
      ));
    }

    if (out.length < profile.maxActions) {
      add(_seasonAction(
        'base-extra',
        'Gerar leitura para a próxima decisão',
        'Use a jogada principal por alguns dias com produto, canal e horário consistentes para o BocaFood comparar o resultado.',
        'Ainda faltam sinais diferentes suficientes para preencher todas as jogadas com ações mais específicas.',
        'baseline',
        'low',
        [
          productName ? 'Produto fixo para comparação: ' + productName + '.' : 'Produto para comparação: escolha um produto principal para observar.',
          channelLabel ? 'Canal fixo para comparação: ' + channelLabel + '.' : 'Canal para comparação: use o canal onde a venda entrar hoje.',
          hourLabel ? 'Horário fixo para comparação: perto de ' + hourLabel + '.' : 'Horário para comparação: registre o horário real dos pedidos.'
        ]
      ));
    }

    return out;
  }

  function _seasonAction(id, title, description, why, source, priority, checklist, measurement) {
    var action = {
      id: id,
      title: title,
      description: description,
      why: why,
      source: source,
      priority: priority || 'medium',
      checklist: checklist || []
    };
    return _decorateSeasonActionMeasurement(action, measurement);
  }

  function _decorateSeasonActionMeasurement(action, measurement) {
    action = action || {};
    var inferred = _inferSeasonActionMeasurement(action);
    var explicit = measurement && typeof measurement === 'object' ? measurement : {};
    var merged = Object.assign({}, inferred, explicit);
    merged.type = merged.type || _measurementTypeFromSource(action.source);
    merged.successMetric = merged.successMetric || _successMetricForMeasurement(merged.type);
    action.measurement = merged;
    action.measurable = true;
    if (merged.productName && !action.productName) action.productName = merged.productName;
    if (merged.productKey && !action.productKey) action.productKey = merged.productKey;
    if (merged.channel && !action.channel) action.channel = merged.channel;
    if (merged.couponCode && !action.couponCode) action.couponCode = merged.couponCode;
    if (merged.promotionName && !action.promotionName) action.promotionName = merged.promotionName;
    if (merged.upsellName && !action.upsellName) action.upsellName = merged.upsellName;
    return {
      id: action.id,
      title: action.title,
      description: action.description,
      why: action.why,
      source: action.source,
      priority: action.priority || 'medium',
      checklist: action.checklist || [],
      focusKey: action.focusKey || '',
      productKey: action.productKey || '',
      productName: action.productName || '',
      channel: action.channel || '',
      couponCode: action.couponCode || '',
      promotionName: action.promotionName || '',
      upsellName: action.upsellName || '',
      customerGroup: action.customerGroup || merged.customerGroup || '',
      successMetric: action.successMetric || merged.successMetric || '',
      goalText: action.goalText || '',
      successText: action.successText || '',
      measurable: action.measurable !== false,
      measurement: merged
    };
  }

  function _inferSeasonActionMeasurement(action) {
    var source = String(action && action.source || '');
    var text = [
      action && action.title,
      action && action.description,
      action && action.why,
      (action && action.checklist || []).join(' ')
    ].join(' ');
    var measurement = {
      type: _measurementTypeFromSource(source),
      source: source,
      productName: _seasonActionProductLabel(action),
      productKey: action && action.productKey || '',
      channel: _extractChannelFromActionText(text),
      hour: _extractHourFromActionText(text),
      couponCode: _extractCouponFromActionText(text),
      promotionName: _extractPromotionFromActionText(action, text),
      upsellName: _extractUpsellFromActionText(action, text),
      customerGroup: _extractCustomerGroupFromActionText(text)
    };
    if (!measurement.productKey && measurement.productName) measurement.productKey = _slugKey(measurement.productName);
    return measurement;
  }

  function _measurementTypeFromSource(source) {
    source = String(source || '');
    if (source === 'baseline') return 'baseline';
    if (source === 'coupons') return 'coupon';
    if (source === 'promotions') return 'promotion';
    if (source === 'upsell') return 'upsell';
    if (source === 'timing') return 'timing';
    if (source === 'retention' || source === 'points') return 'retention';
    if (source === 'consistency') return 'consistency';
    if (source === 'healthy_discount' || source === 'products' || source === 'sales_actions') return 'product';
    return 'product';
  }

  function _successMetricForMeasurement(type) {
    return ({
      baseline: 'registered_orders_with_product_channel_time',
      product: 'product_order',
      coupon: 'coupon_order',
      promotion: 'promotion_order',
      upsell: 'upsell_accepted',
      timing: 'channel_or_hour_order',
      retention: 'repeat_customer_order',
      consistency: 'weak_day_order'
    })[type] || 'measurable_order';
  }

  function _extractChannelFromActionText(text) {
    var folded = _foldText(text || '');
    var known = ['cardapio', 'whatsapp', 'glovo', 'venda presencial', 'pedido manual', 'instagram'];
    for (var i = 0; i < known.length; i++) {
      if (folded.indexOf(_foldText(known[i])) >= 0) return known[i];
    }
    return '';
  }

  function _extractHourFromActionText(text) {
    var match = String(text || '').match(/(\d{1,2}):00/);
    if (!match) return '';
    var hour = Math.max(0, Math.min(23, parseInt(match[1], 10)));
    return _formatHourLabel(hour);
  }

  function _extractCouponFromActionText(text) {
    var match = String(text || '').match(/cupom\s+([A-Z0-9_-]{3,})/i);
    return match && match[1] ? match[1].trim() : '';
  }

  function _extractPromotionFromActionText(action, text) {
    if (action && action.source === 'promotions') {
      var title = String(action.title || '').replace(/^Usar\s+/i, '').replace(/^Repetir\s+/i, '').replace(/\s+em\s+.+$/i, '').trim();
      if (title && title !== action.title) return title;
    }
    var match = String(text || '').match(/Promoção(?: da jogada)?:\s*([^\.]+)/i);
    return match && match[1] ? match[1].trim() : '';
  }

  function _extractUpsellFromActionText(action, text) {
    var match = String(text || '').match(/(?:Oferta extra|Upsell para oferecer|Produto do upsell):\s*([^\.]+)/i);
    if (match && match[1]) return match[1].trim();
    if (action && action.source === 'upsell') {
      match = String(action.title || '').match(/(?:com|junto de)\s+(.+)$/i);
      if (match && match[1]) return match[1].trim();
    }
    return '';
  }

  function _extractCustomerGroupFromActionText(text) {
    var folded = _foldText(text || '');
    if (folded.indexOf('pontos') >= 0) return 'clientes com pontos';
    if (folded.indexOf('ja compraram') >= 0 || folded.indexOf('clientes conhecidos') >= 0) return 'clientes que já compraram';
    return '';
  }

  function _difficultyExecutionProfile(difficulty) {
    if (difficulty === 'safe') return {
      label: 'Seguro',
      cadence: '1 ação principal por vez',
      maxActions: 1,
      actionDeadlineDays: 7,
      executionDeadlineDays: 7,
      resultWindowDays: 15,
      progressRatioAttention: .7,
      progressRatioCritical: .45,
      description: 'Menos pressão, mais foco e maior tolerância para ajustar o caminho.'
    };
    if (difficulty === 'aggressive') return {
      label: 'Agressivo',
      cadence: 'até 3 ações específicas',
      maxActions: 3,
      actionDeadlineDays: 3,
      executionDeadlineDays: 3,
      resultWindowDays: 5,
      progressRatioAttention: .9,
      progressRatioCritical: .65,
      description: 'Mais intensidade e acompanhamento próximo para acelerar o resultado.'
    };
    return {
      label: 'Equilibrado',
      cadence: 'até 2 ações práticas',
      maxActions: 2,
      actionDeadlineDays: 5,
      executionDeadlineDays: 5,
      resultWindowDays: 7,
      progressRatioAttention: .8,
      progressRatioCritical: .55,
      description: 'Ritmo constante, com uma ação principal e um apoio.'
    };
  }

  function _reconcileSeasonActionTasks(season, executionPlan, currentOrders) {
    var actions = (executionPlan && executionPlan.actions || []).slice(0, executionPlan && executionPlan.difficultyProfile && executionPlan.difficultyProfile.maxActions || 2);
    var previous = (season && season.actionTasks || season && season.executionPlan && season.executionPlan.actionTasks || []);
    var history = _mergeActionTaskHistory(season && season.actionTaskHistory || [], []);
    var previousMap = {};
    (previous || []).forEach(function (task) {
      if (task && task.actionId) previousMap[task.actionId] = task;
    });
    var now = new Date();
    var fallbackProfile = _difficultyExecutionProfile(season && season.difficulty);
    var difficultyProfile = executionPlan && executionPlan.difficultyProfile || fallbackProfile;
    var executeDays = Math.max(1, _number(difficultyProfile.executionDeadlineDays || difficultyProfile.actionDeadlineDays, fallbackProfile.executionDeadlineDays || 5));
    var resultDays = Math.max(executeDays, _number(difficultyProfile.resultWindowDays, fallbackProfile.resultWindowDays || 7));
    var tasks = actions.map(function (action, index) {
      var actionId = String(action.id || ('action-' + index));
      var old = previousMap[actionId] || {};
      var createdAt = old.createdAt || now.toISOString();
      var executeDueAt = old.executeDueAt || old.dueAt || _addDaysIso(createdAt, executeDays);
      var hasExecutionEvidence = Array.isArray(old.executionEvidence) && old.executionEvidence.length > 0 || !!old.expectedActionId || old.executionStatus === 'created_waiting_result';
      var executionAt = _firstSeasonActionExecutionAt(old);
      var resultAnchorAt = executionAt || old.resultAnchorAt || createdAt;
      var resultDueAt = executionAt && !old.resultAnchorAt ? _addDaysIso(executionAt, resultDays) : (old.resultDueAt || _addDaysIso(resultAnchorAt, resultDays));
      var evidence = _detectSeasonActionEvidence(action, currentOrders || [], createdAt);
      var resultDueDate = _toDate(resultDueAt) || now;
      var executeDueDate = _toDate(executeDueAt) || now;
      var status = 'pending';
      if (evidence.found) {
        status = now > resultDueDate ? 'executed_with_result' : 'result_in_progress';
      } else if (hasExecutionEvidence && now > resultDueDate) {
        status = 'executed_without_result';
      } else if (!hasExecutionEvidence && now > executeDueDate) {
        status = 'not_executed';
      } else if (old.status === 'manually_done') {
        status = 'manually_done';
      }
      if ((old.status === 'executed_with_result' || old.status === 'result_in_progress') && !evidence.found && old.evidence) {
        evidence = old.evidence;
        status = now > resultDueDate ? 'executed_with_result' : 'result_in_progress';
      }
      return {
        actionId: actionId,
        title: action.title || 'Ação',
        source: action.source || '',
        focusKey: action.focusKey || '',
        productKey: action.productKey || '',
        status: status,
        statusLabel: _seasonActionTaskStatusLabel(status),
        createdAt: createdAt,
        dueAt: executeDueAt,
        executeDueAt: executeDueAt,
        resultAnchorAt: resultAnchorAt,
        resultDueAt: resultDueAt,
        completedAt: status === 'executed_with_result' ? (old.completedAt || evidence.completedAt || now.toISOString()) : null,
        evidence: evidence.found ? evidence : (old.evidence && (old.status === 'executed_with_result' || old.status === 'result_in_progress') ? old.evidence : null),
        expectedActionType: old.expectedActionType || '',
        expectedActionId: old.expectedActionId || '',
        expectedActionCollection: old.expectedActionCollection || '',
        executionEvidence: Array.isArray(old.executionEvidence) ? old.executionEvidence : [],
        executionStatus: old.executionStatus || (hasExecutionEvidence ? 'created_waiting_result' : ''),
        deadlineDays: executeDays,
        executionDeadlineDays: executeDays,
        resultWindowDays: resultDays
      };
    });
    var activeTasks = [];
    var archived = [];
    tasks.forEach(function (task) {
      if (_isTerminalActionTask(task)) archived.push(Object.assign({}, task, { archivedAt: task.archivedAt || new Date().toISOString() }));
      else activeTasks.push(task);
    });
    return {
      activeTasks: activeTasks,
      history: _mergeActionTaskHistory(history, archived),
      hasArchived: archived.length > 0
    };
  }

  function _isTerminalActionTask(task) {
    return task && (task.status === 'executed_with_result' || task.status === 'not_executed' || task.status === 'executed_without_result');
  }

  function _firstSeasonActionExecutionAt(task) {
    var evidence = Array.isArray(task && task.executionEvidence) ? task.executionEvidence : [];
    var first = evidence.map(function (item) {
      return item && item.createdAt ? String(item.createdAt) : '';
    }).filter(Boolean).sort()[0];
    return first || '';
  }

  function _mergeActionTaskHistory(existing, incoming) {
    var seen = {};
    var merged = [];
    (existing || []).concat(incoming || []).forEach(function (task) {
      if (!task || !task.actionId) return;
      var key = task.actionId + '|' + (task.completedAt || task.dueAt || task.archivedAt || '');
      if (seen[key]) return;
      seen[key] = true;
      merged.push(task);
    });
    return merged.sort(function (a, b) {
      return _dateValue(b.completedAt || b.archivedAt || b.dueAt) - _dateValue(a.completedAt || a.archivedAt || a.dueAt);
    }).slice(0, 40);
  }

  function _addDaysIso(value, days) {
    var d = _toDate(value) || new Date();
    d.setDate(d.getDate() + Math.max(1, Math.round(_number(days, 1))));
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  function _seasonActionTaskStatusLabel(status) {
    return ({
      pending: 'Em andamento',
      result_in_progress: 'Resultado em leitura',
      executed_with_result: 'Executada com resultado',
      executed_without_result: 'Executada sem resultado',
      manually_done: 'Marcada como feita',
      not_executed: 'Prazo vencido'
    })[status] || 'Em andamento';
  }

  function _detectSeasonActionEvidence(action, orders, createdAt) {
    var from = _toDate(createdAt) || new Date(0);
    var allValidOrders = (orders || []).map(_normalizeSeasonOrder).filter(function (order) {
      return order && !_isCanceledOrder(order) && order.createdAt;
    }).sort(function (a, b) {
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    var validOrders = allValidOrders.filter(function (order) {
      return order && !_isCanceledOrder(order) && order.createdAt && order.createdAt >= from;
    });
    if (!validOrders.length) return { found: false };
    var source = String(action && action.source || '');
    var text = _foldText([
      action && action.title,
      action && action.description,
      action && action.why,
      (action && action.checklist || []).join(' ')
    ].join(' '));
    var match = null;
    var structured = _detectSeasonActionStructuredEvidence(action, allValidOrders, validOrders, from);
    if (structured && structured.found) return structured;

    if (source === 'baseline') {
      match = validOrders[0] || null;
      if (match) return _actionEvidence('baseline', match, 'Os primeiros pedidos entraram com dados suficientes para iniciar a leitura da temporada.');
    }

    if (source === 'coupons' || text.indexOf('cupom') >= 0) {
      match = validOrders.filter(function (order) {
        return order.couponCode && text.indexOf(_foldText(order.couponCode)) >= 0 || _number(order.couponDiscount, 0) > 0 && text.indexOf('cupom') >= 0;
      })[0] || null;
      if (match) return _actionEvidence('coupon', match, 'O cupom já apareceu em uma venda.');
    }

    if (source === 'promotions' || text.indexOf('promocao') >= 0) {
      match = validOrders.filter(function (order) {
        if (_number(order.promotionDiscount, 0) > 0 && text.indexOf('promocao') >= 0) return true;
        if (order.promotionName && text.indexOf(_foldText(order.promotionName)) >= 0) return true;
        return (order.items || []).some(function (item) {
          return item.promotionName && text.indexOf(_foldText(item.promotionName)) >= 0 || _number(item.promotionDiscount, 0) > 0 && text.indexOf('promocao') >= 0;
        });
      })[0] || null;
      if (match) return _actionEvidence('promotion', match, 'A promoção já apareceu em uma venda.');
    }

    if (source === 'upsell' || text.indexOf('upsell') >= 0 || text.indexOf('oferta extra') >= 0) {
      match = validOrders.filter(function (order) {
        return _isCardapioChannel(order.channel) && (order.upsellAccepted || _number(order.upsellAddedRevenue, 0) > 0);
      })[0] || null;
      if (match) return _actionEvidence('upsell', match, 'A oferta extra já foi aceita e aumentou o pedido.');
    }

    if (source === 'timing') {
      match = validOrders.filter(function (order) {
        var channel = _foldText(_channelLabel(order.channel));
        var hour = order.createdAt ? _formatHourLabel(order.createdAt.getHours()) : '';
        return channel && text.indexOf(channel) >= 0 || hour && text.indexOf(_foldText(hour)) >= 0;
      })[0] || null;
      if (match) return _actionEvidence('timing', match, 'A venda entrou no canal ou horário indicado.');
    }

    if (source === 'retention') {
      match = _findRecurringOrderAfter(allValidOrders, from);
      if (match) return _actionEvidence('retention', match, 'Uma cliente voltou a comprar depois da jogada.');
    }

    match = validOrders.filter(function (order) {
      return (order.items || []).some(function (item) {
        var name = _foldText(item.name || '');
        return name && text.indexOf(name) >= 0;
      });
    })[0] || null;
    if (match) return _actionEvidence('product', match, 'O produto indicado já apareceu em uma venda.');

    return { found: false };
  }

  function _detectSeasonActionStructuredEvidence(action, allValidOrders, validOrders, from) {
    var measurement = action && action.measurement || {};
    var type = measurement.type || _measurementTypeFromSource(action && action.source);
    var match = null;
    if (type === 'baseline') {
      match = (validOrders || []).filter(_orderHasBasicSeasonReadingData)[0] || null;
      if (match) return _actionEvidence('baseline', match, 'Os primeiros pedidos entraram com produto, canal e horário para iniciar a leitura da temporada.');
      return null;
    }
    if (type === 'coupon') {
      match = (validOrders || []).filter(function (order) {
        if (measurement.couponCode && _foldText(order.couponCode || '') === _foldText(measurement.couponCode)) return true;
        return !measurement.couponCode && (!!order.couponCode || _number(order.couponDiscount, 0) > 0);
      })[0] || null;
      if (match) return _actionEvidence('coupon', match, measurement.couponCode ? 'O cupom ' + measurement.couponCode + ' apareceu em uma venda.' : 'Um cupom apareceu em uma venda.');
      return null;
    }
    if (type === 'promotion') {
      match = (validOrders || []).filter(function (order) {
        if (measurement.promotionName && _foldText(order.promotionName || '').indexOf(_foldText(measurement.promotionName)) >= 0) return true;
        return (order.items || []).some(function (item) {
          if (measurement.promotionName && _foldText(item.promotionName || '').indexOf(_foldText(measurement.promotionName)) >= 0) return true;
          return !measurement.promotionName && _number(item.promotionDiscount, 0) > 0;
        }) || (!measurement.promotionName && _number(order.promotionDiscount, 0) > 0);
      })[0] || null;
      if (match) return _actionEvidence('promotion', match, measurement.promotionName ? measurement.promotionName + ' apareceu em uma venda.' : 'A promoção apareceu em uma venda.');
      return null;
    }
    if (type === 'upsell') {
      match = (validOrders || []).filter(function (order) {
        if (!_isCardapioChannel(order.channel) && action && action.source === 'upsell') return false;
        if (measurement.upsellName && !_orderHasProductName(order, measurement.upsellName)) return false;
        return !!order.upsellAccepted || _number(order.upsellAddedRevenue, 0) > 0 || (measurement.upsellName && _orderHasProductName(order, measurement.upsellName));
      })[0] || null;
      if (match) return _actionEvidence('upsell', match, measurement.upsellName ? measurement.upsellName + ' apareceu no pedido da jogada.' : 'A oferta extra já foi aceita e aumentou o pedido.');
      return null;
    }
    if (type === 'timing' || type === 'consistency') {
      match = (validOrders || []).filter(function (order) {
        var channelOk = measurement.channel ? _normalizeChannel(order.channel) === _normalizeChannel(measurement.channel) || _foldText(_channelLabel(order.channel)).indexOf(_foldText(measurement.channel)) >= 0 : false;
        var hourOk = measurement.hour && order.createdAt ? _formatHourLabel(order.createdAt.getHours()) === measurement.hour : false;
        var productOk = measurement.productName ? _orderHasProductName(order, measurement.productName) : true;
        return productOk && (channelOk || hourOk || (!measurement.channel && !measurement.hour));
      })[0] || null;
      if (match) return _actionEvidence(type, match, type === 'consistency' ? 'A venda entrou no foco de consistência da jogada.' : 'A venda entrou no canal ou horário indicado.');
      return null;
    }
    if (type === 'retention') {
      match = _findRecurringOrderAfter(allValidOrders || [], from);
      if (match) return _actionEvidence('retention', match, 'Uma cliente voltou a comprar depois da jogada.');
      return null;
    }
    if (measurement.productName || measurement.productKey) {
      match = (validOrders || []).filter(function (order) {
        return measurement.productName ? _orderHasProductName(order, measurement.productName) : _orderHasProductKey(order, measurement.productKey);
      })[0] || null;
      if (match) return _actionEvidence('product', match, measurement.productName ? measurement.productName + ' apareceu em uma venda.' : 'O produto indicado apareceu em uma venda.');
    }
    return null;
  }

  function _orderHasBasicSeasonReadingData(order) {
    return !!(order && order.createdAt && _normalizeChannel(order.channel || '') && (order.items || []).length);
  }

  function _orderHasProductName(order, productName) {
    var needle = _foldText(productName || '');
    if (!needle) return false;
    return (order && order.items || []).some(function (item) {
      return _foldText(item.name || item.productName || item.nome || '').indexOf(needle) >= 0 || needle.indexOf(_foldText(item.name || item.productName || item.nome || '')) >= 0;
    });
  }

  function _orderHasProductKey(order, productKey) {
    var key = _slugKey(productKey || '');
    if (!key) return false;
    return (order && order.items || []).some(function (item) {
      return _slugKey(item.productId || item.id || item.name || item.productName || item.nome || '') === key;
    });
  }

  function _findRecurringOrderAfter(orders, from) {
    var seen = {};
    for (var i = 0; i < orders.length; i++) {
      var key = orders[i].customerKey;
      if (!key) continue;
      if (seen[key] && orders[i].createdAt && orders[i].createdAt >= from) return orders[i];
      seen[key] = true;
    }
    return null;
  }

  function _actionEvidence(type, order, message) {
    return {
      found: true,
      type: type,
      message: message,
      orderId: order && order.id || '',
      orderTotal: order && order.total || 0,
      completedAt: order && order.createdAt ? order.createdAt.toISOString() : new Date().toISOString()
    };
  }

  function _seasonReadingForDisplay(season, metrics, scoreBreakdown) {
    var reading = season.seasonReading || metrics.seasonReading || null;
    var executionPlan = _executionPlanForDisplay(season, metrics, reading);
    if (reading) return {
      headline: reading.headline || _buildSeasonHeadline(season, metrics, scoreBreakdown),
      helpingSignals: reading.helpingSignals || [],
      blockingSignals: reading.blockingSignals || [],
      nextAction: reading.nextAction || _buildNextBestAction(season, Object.assign({}, metrics, { executionPlan: executionPlan }), metrics.validatedImpactSignals, {}),
      executionPlan: executionPlan
    };
    return _generateSeasonReading(season, metrics, scoreBreakdown, metrics.validatedImpactSignals || {}, {});
  }

  function _uniqueTextItems(items) {
    var seen = {};
    return (items || []).filter(function (item) {
      var key = String(item || '').trim();
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function _channelLabel(value) {
    return ({
      cardapio: 'Cardápio',
      venda_presencial: 'Venda presencial',
      pedido_manual: 'Pedido manual',
      whatsapp: 'WhatsApp',
      desconhecido: 'não identificado'
    })[value] || value;
  }

  function _isCardapioChannel(value) {
    return _normalizeChannel(value || '') === 'cardapio';
  }

  function _nextMoveTab(season, metrics, recommendation) {
    return '' +
      '<div class="seasons-copilot-layout">' +
        '<section class="seasons-copilot-main">' +
          _nextMoveBlock(season, metrics, recommendation) +
        '</section>' +
        '<aside class="seasons-system-side">' +
          '<span class="seasons-section-label">Ritmo da temporada</span>' +
          _metricTile('Score', Math.round(_number(season.currentScore, 0)), 'speed') +
          _metricTile('Progresso da meta', Math.round(_number(season.progressPercent, 0)) + '%', 'trending_up') +
          _metricTile('Chance de Falha', _riskLabel(season.riskLevel), 'warning') +
          _metricTile('Resultado até agora', _formatMetricValue(metrics.currentValue, season.objective), 'analytics') +
        '</aside>' +
      '</div>';
  }

  function _analysisTab(season, snapshots) {
    snapshots = snapshots || {};
    return '' +
      '<div class="seasons-tab-header"><span class="seasons-section-label">Análises Automáticas</span><h3>Leituras salvas da temporada</h3><p>Registros automáticos que preservam como a temporada estava sendo lida em cada momento.</p></div>' +
      '<div class="seasons-analysis-update">' + _icon('update') + ' Última atualização: <strong>' + _esc(_snapshotUpdatedLabel(snapshots)) + '</strong></div>' +
      '<div class="seasons-analysis-grid">' +
        _snapshotAnalysisCard('Análise Diária', snapshots.daily, 'Mudanças rápidas, alertas curtos e progresso recente.') +
        _snapshotAnalysisCard('Análise Semanal', snapshots.weekly, 'Tendência, evolução, riscos e oportunidades da semana.') +
      '</div>';
  }

  function _finalResultInline(season) {
    var summary = season.finalSummary || {};
    var metrics = season.finalMetrics || season.currentMetrics || {};
    return '' +
      '<div class="seasons-tab-header"><span class="seasons-section-label">Resultado Final</span><h3>' + _esc(season.finalResult || 'Resultado não calculado') + '</h3><p>Fechamento da temporada: aqui o sistema transforma progresso, score e risco em uma classificação final.</p></div>' +
      '<div class="seasons-final-grid">' +
        _finalFact('Score final', Math.round(_number(season.finalScore, season.currentScore || 0))) +
        _finalFact('Progresso final', Math.round(_number(season.finalProgressPercent, season.progressPercent || 0)) + '%') +
        _finalFact('Resultado', _formatMetricValue(metrics.currentValue, season.objective)) +
      '</div>' +
      '<div class="seasons-final-columns">' +
        _finalList('O que funcionou', summary.worked || []) +
        _finalList('O que atrapalhou', summary.blocked || []) +
      '</div>' +
      _seasonStoneImpactBlock(season) +
      '<div class="seasons-final-suggestion">' + _icon('next_plan') + '<div><small>Sugestão para próxima temporada</small><strong>' + _esc(_objectiveLabel(summary.nextSeasonSuggestion || '')) + '</strong><p>' + _esc(summary.suggestionReason || 'Sugestão baseada nas métricas finais disponíveis.') + '</p></div></div>';
  }

  function _systemStatusBars(season, metrics) {
    var consistency = _consistencyChartValue(metrics);
    return '' +
      '<div class="seasons-status-bars">' +
        _statusBar('Ritmo operacional', season.progressPercent, season.objective === 'sell_more' || season.objective === 'improve_consistency', _metricBalloon('Ritmo operacional', Math.round(_clamp(season.progressPercent, 0, 100)) + '%', _paceBalloonText(season, metrics, _number(season.progressPercent, 0)))) +
        _statusBar('Consistência', consistency.value, season.objective === 'improve_consistency', _metricBalloon('Consistência', consistency.label, _consistencyBalloonText(metrics))) +
        _statusBar('Fidelização', _number(metrics.repurchaseRate, 0) * 100, season.objective === 'retain_customers', _metricBalloon('Fidelização', Math.round(_clamp(_number(metrics.repurchaseRate, 0) * 100, 0, 100)) + '%', _retentionBalloonText(metrics))) +
        _statusBar('Chance de falha', _riskScore(season.riskLevel), false, null) +
      '</div>';
  }

  function _statusBar(label, value, highlighted, balloon) {
    var pct = _clamp(value, 0, 100);
    return '<div class="seasons-status-bar ' + (balloon ? 'seasons-chart-clickable ' : '') + (highlighted ? 'seasons-weighted-field' : '') + '" ' + (balloon ? 'role="button" tabindex="0" onclick="Modules.Temporadas.toggleMetricBalloon(this)" onkeydown="Modules.Temporadas._metricTileKey(event,this)"' : '') + '><div><span>' + _esc(label) + '</span></div><b><i style="width:' + pct + '%"></i></b>' + _chartBalloonHtml(balloon) + '</div>';
  }

  function _primaryMetricLabels(objective) {
    return ({
      sell_more: { current: 'Faturamento atual', target: 'Meta de faturamento' },
      increase_ticket: { current: 'Ticket atual', target: 'Meta de ticket' },
      retain_customers: { current: 'Recorrência atual', target: 'Meta de fidelização' },
      improve_consistency: { current: 'Dias ativos', target: 'Meta de consistência' }
    })[objective] || { current: 'Atual', target: 'Meta' };
  }

  function _riskScore(risk) {
    return ({ low: 20, medium: 45, high: 70, very_high: 92, unknown: 55 })[risk] || 55;
  }

  function _metricBalloon(title, value, text) {
    return { title: title, value: value, text: text };
  }

  function _chartBalloonHtml(balloon) {
    if (!balloon) return '';
    return '<div class="seasons-metric-balloon seasons-chart-balloon" hidden><strong>Resultado atual: ' + _esc(balloon.value) + '</strong><p>' + _esc(balloon.text) + '</p></div>';
  }

  function _progressBalloonText(season, metrics, progress) {
    var current = _formatMetricValue(metrics.currentValue, season.objective);
    var target = _formatMetricValue(metrics.targetValue, season.objective);
    var expected = _number(metrics.expectedProgress, 0);
    var parts = ['Progresso é só o avanço contra a meta principal: você já chegou em ' + current + ' de uma meta de ' + target + '.'];
    if (expected <= 0) {
      return parts.concat(['Como a temporada acabou de começar, ainda não vamos tratar isso como atraso. Hoje é dia de colocar a primeira jogada em movimento.']).join(' ');
    }
    parts.push('Para o momento de hoje, o ideal seria estar perto de ' + Math.round(expected) + '%.');
    if (progress >= 100) parts.push('Você já passou da meta desta temporada. O score e o risco ainda ajudam a entender se esse avanço veio de um jeito saudável.');
    else parts.push('Ainda falta cerca de ' + Math.max(0, Math.round(100 - progress)) + '% para chegar lá. Isso não é o resultado final: é a leitura do caminho até hoje.');
    return parts.join(' ');
  }

  function _scoreSimpleReading(scoreBreakdown, season, metrics) {
    var finalScore = _number(scoreBreakdown && scoreBreakdown.finalScore, _number(season && season.currentScore, 0));
    var risk = season && season.riskLevel || metrics && metrics.riskLevel || '';
    var starting = _statusScoreLabel(season && season.currentStatus) === 'Em início' || _number(metrics && metrics.expectedProgress, 0) <= 0;
    if (starting && (risk === 'high' || risk === 'very_high')) return 'Rota exigente no início';
    if (finalScore >= 85) return 'Muito bom';
    if (finalScore >= 65) return 'No caminho';
    if (finalScore >= 40) return 'Pede atenção';
    return 'Precisa de ação';
  }

  function _scoreBalloonText(season, metrics, scoreBreakdown) {
    var score = _number(season.currentScore, 0);
    scoreBreakdown = scoreBreakdown || _scoreBreakdownForDisplay(season, metrics);
    var starting = _statusScoreLabel(season && season.currentStatus) === 'Em início' || _number(metrics && metrics.expectedProgress, 0) <= 0;
    var objectiveText = _scoreObjectivePlainText(season && season.objective);
    var pieces = [
      'Score é uma nota de 0 a 100 sobre a qualidade da temporada, não apenas sobre quanto da meta já foi feito.',
      objectiveText
    ];
    if (scoreBreakdown.validatedImpactBonus > 0) pieces.push('Algumas vendas e ações reais já começaram a ajudar.');
    if (scoreBreakdown.riskPenalty > 0) {
      pieces.push(starting
        ? 'A rota começou exigente, então este é um cuidado inicial, não uma cobrança de atraso.'
        : 'Quando o ritmo fica distante do necessário, o score cai para mostrar que o caminho precisa de atenção.');
    }
    if (score >= 85) pieces.push('Continue reforçando o que está funcionando.');
    else if (score >= 65) pieces.push('Você está no caminho; mantenha constância.');
    else if (score >= 40) pieces.push('Vale agir agora para não deixar a temporada escapar.');
    else pieces.push('O melhor agora é escolher uma jogada simples e colocar em prática rápido.');
    return pieces.join(' ');
  }

  function _scoreObjectivePlainText(objective) {
    if (objective === 'sell_more') return 'Para esta temporada, o olhar está em vender mais e manter dias com movimento.';
    if (objective === 'increase_ticket') return 'Para esta temporada, o olhar está em fazer cada pedido valer mais.';
    if (objective === 'retain_customers') return 'Para esta temporada, o olhar está em fazer clientes voltarem.';
    if (objective === 'improve_consistency') return 'Para esta temporada, o olhar está em vender com mais regularidade, sem depender de poucos dias bons.';
    return 'Para esta temporada, o olhar está no caminho escolhido para a sua rota.';
  }

  function _paceBalloonText(season, metrics, progress) {
    var expected = _number(metrics.expectedProgress, 0);
    var ratio = _number(metrics.progressRatio, 0);
    var elapsed = Math.round(_number(metrics.elapsedDays, 0));
    if (_statusScoreLabel(season.currentStatus) === 'Em início') {
      return 'Este gráfico compara o avanço real com o avanço esperado para agora. A temporada ainda está no começo, então o sistema evita marcar atraso grave apenas pela ausência de resultado imediato.';
    }
    if (expected <= 0) return 'Este gráfico depende de tempo decorrido e meta definida. Ainda há poucos dados de ritmo para comparar o progresso real com o progresso esperado.';
    if (ratio >= 1.10) return 'O progresso atual de ' + Math.round(progress) + '% está acima do esperado para o dia ' + elapsed + '. Isso indica que a temporada está andando mais rápido que o ritmo necessário.';
    if (ratio >= .80) return 'O progresso atual de ' + Math.round(progress) + '% está próximo do esperado, que era cerca de ' + Math.round(expected) + '%. Isso indica que a temporada está acompanhando o plano, mesmo que ainda não tenha chegado à meta final.';
    if (ratio >= .50) return 'O progresso atual de ' + Math.round(progress) + '% está abaixo do esperado de ' + Math.round(expected) + '%. Por isso o ritmo aparece instável: ainda há avanço, mas o sistema entende que precisa recuperar parte do atraso.';
    return 'O progresso atual de ' + Math.round(progress) + '% está muito abaixo do esperado de ' + Math.round(expected) + '%. Por isso o ritmo aparece crítico: o avanço até agora não acompanha o que seria necessário para chegar à meta no prazo.';
  }

  function _riskBalloonText(season, metrics, progress) {
    var risk = season.riskLevel || 'unknown';
    var expected = _number(metrics.expectedProgress, 0);
    var gap = Math.max(0, expected - progress);
    var daysRemaining = Math.round(_number(metrics.daysRemaining, 0));
    var initialRisk = season.initialRiskLevel || 'unknown';
    var reasons = [];

    if (initialRisk === 'high' || initialRisk === 'very_high') {
      reasons.push('a meta já nasceu com chance inicial ' + _riskLabel(initialRisk).toLowerCase() + ' em relação ao histórico');
    }
    if (expected > 0 && gap >= 35) reasons.push('o progresso está cerca de ' + Math.round(gap) + ' pontos abaixo do esperado para hoje');
    else if (expected > 0 && gap >= 15) reasons.push('o progresso está abaixo do ritmo esperado para hoje');
    if (_statusScoreLabel(season.currentStatus) === 'Crítico' || _statusScoreLabel(season.currentStatus) === 'Instável') {
      reasons.push('o ritmo atual está ' + _statusScoreLabel(season.currentStatus).toLowerCase());
    }
    if (daysRemaining <= 7 && progress < 75) reasons.push('restam poucos dias e a temporada ainda está abaixo de 75% da meta');

    if (!reasons.length) {
      if (risk === 'low') return 'Risco é a chance de a temporada não chegar bem ao final se continuar como está. Aqui ele está baixo porque progresso e ritmo não indicam atraso relevante.';
      if (risk === 'medium') return 'Risco é a chance de a temporada não chegar bem ao final se continuar como está. Aqui ele está médio porque existe algum desvio de ritmo ou exigência da meta, mas ainda há espaço para recuperar.';
      return 'Risco é a chance de a temporada não chegar bem ao final se continuar como está. Ele considera dificuldade da meta, histórico, ritmo atual e dias restantes.';
    }
    return 'Risco é diferente de score: ele olha a chance de falhar se nada mudar. Agora está ' + _riskLabel(risk).toLowerCase() + ' porque ' + reasons.join(', ') + '.';
  }

  function _consistencyBalloonText(metrics) {
    var value = _number(metrics.weeklyRegularity, 0) * 100;
    var weakDays = _number(metrics.weakDays, 0);
    var elapsed = Math.round(_number(metrics.elapsedDays, 0));
    var activeDays = Math.round(_number(metrics.activeDays, 0));
    var orders = Math.round(_number(metrics.orders, 0));
    if (elapsed <= 2 || activeDays <= 1 || orders <= 1) {
      return 'Este gráfico mede regularidade ao longo do tempo. Como a temporada ainda está no começo, não há dias suficientes para concluir se as vendas estão consistentes. A leitura deve ser vista como inicial, não como desempenho bom.';
    }
    if (value >= 75) return 'Este gráfico mede regularidade. A leitura está boa porque as vendas parecem menos concentradas em poucos dias e a semana mostra comportamento mais estável.';
    if (value >= 45) return 'Este gráfico mede regularidade. A leitura está intermediária porque existe algum ritmo de venda, mas ainda há oscilação entre dias ou semanas.';
    if (weakDays > 0) return 'Este gráfico mede regularidade. A leitura está baixa porque existem dias fracos ou sem venda impactando a consistência da temporada.';
    return 'Este gráfico mede regularidade. A leitura está baixa porque ainda há poucos sinais de vendas distribuídas de forma estável no período analisado.';
  }

  function _consistencyChartValue(metrics) {
    var elapsed = Math.round(_number(metrics.elapsedDays, 0));
    var activeDays = Math.round(_number(metrics.activeDays, 0));
    var orders = Math.round(_number(metrics.orders, 0));
    if (elapsed <= 2 || activeDays <= 1 || orders <= 1) {
      return { value: 12, label: 'Leitura inicial' };
    }
    var value = _clamp(_number(metrics.weeklyRegularity, 0) * 100, 0, 100);
    return { value: value, label: Math.round(value) + '%' };
  }

  function _retentionBalloonText(metrics) {
    var rate = _number(metrics.repurchaseRate, 0) * 100;
    var recurring = Math.round(_number(metrics.recurringCustomers, 0));
    if (rate >= 35) return 'Este gráfico mostra sinais de retorno de clientes. A leitura está forte porque a taxa de recompra está em ' + Math.round(rate) + '% e há ' + recurring + ' cliente(s) recorrente(s) no período.';
    if (rate >= 15) return 'Este gráfico mostra sinais de retorno de clientes. A leitura está intermediária porque já existe recompra, mas ainda pode crescer para sustentar melhor a temporada.';
    return 'Este gráfico mostra sinais de retorno de clientes. A leitura está baixa porque a recompra está em ' + Math.round(rate) + '% e há poucos clientes recorrentes no período.';
  }

  function _quickAlerts(snapshots) {
    var alerts = ((snapshots && snapshots.daily && snapshots.daily.alerts) || []).slice(0, 3);
    return '<section class="seasons-alert-panel"><span class="seasons-section-label">Alertas rápidos</span>' + (alerts.length ? alerts.map(function (alert) {
      return '<article><strong>' + _esc(alert.title || 'Alerta') + '</strong><p>' + _esc(alert.message || '') + '</p></article>';
    }).join('') : '<p>Nenhum alerta crítico na leitura de hoje.</p>') + '</section>';
  }

  function _snapshotAnalysisCard(title, snapshot, description) {
    if (!snapshot) {
      return '<article class="seasons-analysis-card"><span class="seasons-section-label">' + _esc(title) + '</span><h4>Ainda não gerada</h4><p>' + _esc(description) + '</p></article>';
    }
    var alerts = (snapshot.alerts || []).slice(0, 3);
    return '' +
      '<article class="seasons-analysis-card">' +
        '<span class="seasons-section-label">' + _esc(title) + '</span>' +
        '<h4>' + _esc(_formatDate(snapshot.date || snapshot.createdAt) || snapshot.date || 'Leitura salva') + '</h4>' +
        '<div class="seasons-analysis-facts">' +
          '<span>Score <strong>' + Math.round(_number(snapshot.score, 0)) + '</strong></span>' +
          '<span>Ritmo <strong>' + _esc(_statusScoreLabel(snapshot.status)) + '</strong></span>' +
          '<span>Progresso <strong>' + Math.round(_number(snapshot.progressPercent, 0)) + '%</strong></span>' +
        '</div>' +
        '<p>' + _esc(description) + '</p>' +
        (alerts.length ? '<div class="seasons-analysis-alerts">' + alerts.map(function (alert) { return '<small>' + _esc(alert.title || 'Alerta') + '</small>'; }).join('') + '</div>' : '<div class="seasons-analysis-alerts"><small>Sem alertas críticos</small></div>') +
      '</article>';
  }

  function _validSeasonTab(season, tab) {
    if (tab === 'final' && season.status !== 'finished') return 'overview';
    return ({ overview: true, next: true, final: true })[tab] ? tab : 'overview';
  }

  function _setSeasonTab(tab) {
    _state.activeTab = _validSeasonTab(_state.activeSeason || {}, tab);
    _paint();
  }

  function _snapshotBadge(label, snapshot) {
    return '' +
      '<span class="seasons-snapshot-badge ' + (snapshot ? 'is-ready' : '') + '">' +
        _icon(snapshot ? 'check_circle' : 'schedule') +
        _esc(label) +
      '</span>';
  }

  function _nextMoveBlock(season, metrics, recommendation) {
    recommendation = recommendation || _fallbackRecommendationForUI();
    var reading = _seasonReadingForDisplay(season || {}, metrics || {}, _scoreBreakdownForDisplay(season || {}, metrics || {}));
    var executionPlan = _executionPlanForDisplay(season, metrics, reading);
    if (!executionPlan.actions || !executionPlan.actions.length) {
      executionPlan = _buildSeasonExecutionPlan(season || {}, metrics || {}, metrics && metrics.validatedImpactSignals || {}, metrics && metrics.riskContext || {});
    }
    var profile = executionPlan.difficultyProfile || _difficultyExecutionProfile(season && season.difficulty);
    if ((executionPlan.actions || []).length < profile.maxActions) {
      var freshPlan = _buildSeasonExecutionPlan(season || {}, metrics || {}, metrics && metrics.validatedImpactSignals || {}, metrics && metrics.riskContext || {});
      if ((freshPlan.actions || []).length > (executionPlan.actions || []).length) executionPlan = freshPlan;
    }
    var actions = (executionPlan.actions || []).slice(0, profile.maxActions || 2);
    var taskMap = _seasonActionTaskMap(season, executionPlan, metrics);
    var history = _seasonActionTaskHistoryForDisplay(season, executionPlan, metrics);
    if (actions.length) {
      return '' +
        _seasonWeeklyReadingHtml(season, metrics, executionPlan, actions) +
        '<div class="seasons-next-move seasons-next-move-operational">' +
          '<div class="seasons-next-move-head">' +
            '<span class="seasons-section-label">Próxima Jogada</span>' +
            '<strong>' + _esc(actions.length > 1 ? 'Jogadas ativas' : 'Jogada ativa') + '</strong>' +
          '</div>' +
          '<p>' + _esc(actions.length > 1 ? 'Faça uma jogada por vez, cada uma com um objetivo claro para ajudar sua operação a avançar melhor.' : 'Esta é a jogada que faz mais sentido para o momento atual da sua operação.') + '</p>' +
          '<div class="seasons-next-checklist">' +
            '<div class="seasons-next-checklist-head"><strong>' + _esc(profile.label ? 'Ritmo ' + profile.label : 'Ritmo da temporada') + '</strong><span>' + _esc(profile.cadence || 'Ações práticas') + '</span></div>' +
            actions.map(function (action, index) {
              var steps = (action.checklist || []).slice(0, 4);
              var task = taskMap[action.id] || {};
              return '<article>' +
                '<header><span>' + (index + 1) + '</span><div><strong>' + _esc(action.title || 'Ação') + '</strong><p>' + _esc(action.description || '') + '</p></div></header>' +
                _seasonActionGoalHtml(action, task, season) +
                '<div class="seasons-next-reason seasons-next-action-reason"><span>Por que fazer</span><strong>' + _esc(action.why || 'Essa jogada aproveita o que já apareceu melhor nas vendas da sua operação.') + '</strong></div>' +
                _seasonActionTaskStatusHtml(task) +
                (steps.length ? '<ul>' + steps.map(function (step) { return '<li>' + _esc(step) + '</li>'; }).join('') + '</ul>' : '') +
                _seasonActionResultHtml(task) +
                _seasonActionButtonsHtml(action, task, season) +
              '</article>';
            }).join('') +
          '</div>' +
          _nextMoveTimingCard(actions[0], taskMap[actions[0].id] || {}, season) +
          _seasonActionOutcomeSummaryHtml(actions, taskMap, history) +
          _seasonActionHistoryHtml(history) +
          _seasonActionLearningHtml(season, metrics, actions, taskMap, history) +
          '<small>Quando uma jogada entra nas vendas ou passa do prazo, ela sai da rodada atual e vira aprendizado para a próxima decisão.</small>' +
        '</div>';
    }

    var isReading = recommendation.headline || recommendation.nextAction;
    var main = recommendation.mainAction || {};
    var steps = Array.isArray(main.howToApply) ? main.howToApply.slice(0, 4) : [];
    var secondary = Array.isArray(recommendation.secondaryActions) ? recommendation.secondaryActions.slice(0, 2) : [];

    if (isReading) {
      return '' +
        '<div class="seasons-next-move">' +
          '<div class="seasons-next-move-head">' +
            '<span class="seasons-section-label">Próxima Jogada</span>' +
            '<strong>' + _esc(recommendation.headline || 'Acompanhar a temporada') + '</strong>' +
          '</div>' +
          '<p>' + _esc(recommendation.nextAction || 'Use o produto, canal ou horário mais forte da temporada para a próxima ação.') + '</p>' +
          '<small>Leitura gerada com dados calculados pelo BocaFood. A IA não calcula score, meta, risco ou progresso.</small>' +
        '</div>';
    }

    return '' +
      '<div class="seasons-next-move">' +
        '<div class="seasons-next-move-head">' +
          '<span class="seasons-section-label">Próxima Jogada</span>' +
          '<strong>' + _esc(main.title || 'Acompanhar a temporada por mais alguns dias') + '</strong>' +
        '</div>' +
        '<p>' + _esc(main.description || 'Ainda há poucos dados para uma ação mais específica.') + '</p>' +
        '<div class="seasons-next-reason"><span>Motivo</span><strong>' + _esc(main.why || 'Recomendação gerada com base nos dados disponíveis da temporada.') + '</strong></div>' +
        (steps.length ? '<ol>' + steps.map(function (step) { return '<li>' + _esc(step) + '</li>'; }).join('') + '</ol>' : '') +
        '<div class="seasons-next-meta">' +
          '<span>Métrica: <strong>' + _esc(main.metricToWatch || 'Progresso') + '</strong></span>' +
          '<span>Revisar em: <strong>' + Math.round(_number(main.reviewInDays, 7)) + ' dias</strong></span>' +
        '</div>' +
        '<div class="seasons-next-risk"><span>Risco se ignorar</span><strong>' + _esc(main.riskIfIgnored || 'A temporada pode perder ritmo antes do fechamento.') + '</strong></div>' +
        (secondary.length ? '<div class="seasons-secondary-actions">' + secondary.map(function (item) {
          return '<article><strong>' + _esc(item.title || 'Ação secundária') + '</strong><p>' + _esc(item.description || item.why || '') + '</p></article>';
        }).join('') + '</div>' : '') +
        '<small>Recomendação gerada com base nos dados disponíveis da temporada.</small>' +
        '</div>';
  }

  function _nextMoveTimingCard(action, task, season) {
    action = action || {};
    task = task || {};
    var deadlineValue = task.resultDueAt || task.executeDueAt || task.dueAt || (season && season.endDate);
    var deadline = _formatDate(deadlineValue) || 'o fim desta rodada';
    return '' +
      '<section class="seasons-next-reason seasons-next-timing-card">' +
        '<span>Quando vem a próxima jogada</span>' +
        '<strong>Esta jogada vai até ' + _esc(deadline) + '.</strong>' +
        '<p>Até lá, siga a ação proposta e continue registrando tudo que acontece na sua operação.</p>' +
        '<div class="seasons-next-timing-observe">' +
          '<small>O que o BocaFood vai observar</small>' +
          '<p>' + _esc(_nextMoveObservationText(action)) + '</p>' +
        '</div>' +
        '<p>Depois dessa data, o BocaFood lê o que aconteceu e cria a próxima jogada.</p>' +
        '<p>Se ainda estiver cedo para tirar uma conclusão, a próxima ação será mais simples: organizar melhor os primeiros pedidos para entender o que está respondendo na sua operação.</p>' +
      '</section>';
  }

  function _nextMoveObservationText(action) {
    action = action || {};
    var measurement = action.measurement || {};
    var type = measurement.type || _measurementTypeFromSource(action.source);
    var product = _seasonActionProductLabel(action) || measurement.productName || action.productName || '';
    var channel = action.channel || measurement.channel || '';
    var channelLabel = channel ? _channelLabel(_normalizeChannel(channel)) : '';
    var offer = action.couponCode || measurement.couponCode || action.promotionName || measurement.promotionName || '';
    var upsell = action.upsellName || measurement.upsellName || '';
    var group = action.customerGroup || measurement.customerGroup || '';

    if (type === 'baseline') return 'Se já existe movimento suficiente para começar a enxergar quais produtos, canais e horários estão funcionando melhor.';
    if (type === 'coupon') return offer ? 'Se o cupom ' + offer + ' trouxe pedidos sem apertar demais a sobra.' : 'Se o cupom trouxe pedidos sem apertar demais a sobra.';
    if (type === 'promotion') return offer ? 'Se ' + offer + ' trouxe pedidos sem apertar demais a sobra.' : 'Se a promoção trouxe pedidos sem apertar demais a sobra.';
    if (type === 'upsell') return upsell ? 'Se ' + upsell + ' entrou junto com os pedidos e aumentou o valor médio.' : 'Se o adicional sugerido entrou junto com os pedidos e aumentou o valor médio.';
    if (type === 'retention') return group ? 'Se ' + group + ' voltou, usou pontos ou fez novos pedidos.' : 'Se esse grupo de clientes voltou, usou pontos ou fez novos pedidos.';
    if (type === 'timing') {
      if (product && channelLabel) return 'Se ' + product + ' apareceu nos pedidos de ' + channelLabel + ' e ajudou a venda a crescer.';
      if (channelLabel) return 'Se ' + channelLabel + ' trouxe pedidos suficientes para continuar recebendo atenção.';
      return 'Se o canal ou horário escolhido trouxe pedidos suficientes para continuar recebendo atenção.';
    }
    if (type === 'consistency') return 'Se o dia ou horário trabalhado recebeu pedidos suficientes para merecer mais atenção.';
    if (product) return 'Se ' + product + ' apareceu nos pedidos e ajudou a venda a crescer.';
    return 'Se a ação trouxe movimento suficiente para entender melhor o que funciona na sua operação.';
  }

  function _seasonActionTaskMap(season, executionPlan, metrics) {
    var list = (executionPlan && executionPlan.actionTasks) || (season && season.actionTasks) || (metrics && metrics.actionTasks) || [];
    var map = {};
    (list || []).forEach(function (task) {
      if (task && task.actionId) map[task.actionId] = task;
    });
    return map;
  }

  function _seasonActionTaskHistoryForDisplay(season, executionPlan, metrics) {
    return ((executionPlan && executionPlan.actionTaskHistory) || (season && season.actionTaskHistory) || (metrics && metrics.actionTaskHistory) || []).slice(0, 6);
  }

  function _seasonWeeklyReadingHtml(season, metrics, executionPlan, actions) {
    var remaining = _seasonRemainingGoalText(season, metrics);
    var profile = executionPlan && executionPlan.difficultyProfile || _difficultyExecutionProfile(season && season.difficulty);
    var focus = _seasonWeeklyFocusText(season, metrics, actions);
    return '' +
      '<section class="seasons-weekly-reading">' +
        '<div>' +
          '<span class="seasons-section-label">Leitura da semana</span>' +
          '<h4>' + _esc(remaining.title) + '</h4>' +
          '<p>' + _esc(focus) + '</p>' +
        '</div>' +
        '<aside class="seasons-weekly-rhythm seasons-weekly-rhythm-' + _esc(season && season.difficulty || 'balanced') + '">' +
          '<small>Ritmo escolhido</small>' +
          '<strong>' + _esc(profile.label || 'Temporada') + '</strong>' +
          '<span>' + _esc(profile.cadence || 'Ações práticas') + '</span>' +
        '</aside>' +
      '</section>';
  }

  function _seasonRemainingGoalText(season, metrics) {
    metrics = metrics || {};
    var objective = season && season.objective;
    var current = _number(metrics.currentValue, 0);
    var target = _number(metrics.targetValue || season && season.targetValue, 0);
    var missing = Math.max(0, target - current);
    if (_number(metrics.orders, 0) <= 0) {
      return {
        title: 'A temporada acabou de começar. Primeiro registre os pedidos de hoje para a leitura ficar ligada ao que aconteceu de verdade.'
      };
    }
    if (objective === 'sell_more') {
      return {
        title: missing > 0 ? 'Sua temporada precisa vender mais ' + _fmtMoney(missing) + ' até o fim do período.' : 'Sua temporada já passou da meta de venda.'
      };
    }
    if (objective === 'increase_ticket') {
      return {
        title: missing > 0 ? 'Falta subir o ticket médio em ' + _fmtMoney(missing) + ' para chegar na meta.' : 'O ticket médio já está no caminho esperado.'
      };
    }
    if (objective === 'retain_customers') {
      return {
        title: missing > 0 ? 'Faltam ' + Math.ceil(missing) + ' cliente(s) voltando a comprar nesta temporada.' : 'A recompra já passou da meta definida.'
      };
    }
    if (objective === 'improve_consistency') {
      return {
        title: missing > 0 ? 'Faltam ' + Math.ceil(missing) + ' dia(s) com venda para deixar a temporada mais consistente.' : 'A consistência já está dentro da meta.'
      };
    }
    return { title: 'Para esta semana, foque nas jogadas com melhor chance de resposta.' };
  }

  function _seasonWeeklyFocusText(season, metrics, actions) {
    var first = (actions || [])[0] || {};
    var product = _seasonActionProductLabel(first);
    if (season && season.objective === 'increase_ticket') {
      return product ? 'O foco agora é vender melhor cada pedido, usando ' + product + ' como entrada para adicionais, combo ou upsell.' : 'O foco agora é vender melhor cada pedido, sem depender só de baixar preço.';
    }
    if (season && season.objective === 'retain_customers') {
      return product ? 'O foco agora é trazer clientes de volta usando ' + product + ' como motivo claro para repetir a compra.' : 'O foco agora é trazer clientes de volta com uma oferta simples e fácil de entender.';
    }
    if (season && season.objective === 'improve_consistency') {
      if (_number(metrics && metrics.orders, 0) <= 0) {
        return 'O foco agora é começar a temporada com pedidos reais. Depois disso, a leitura mostra quais dias, horários ou produtos merecem mais atenção.';
      }
      return product ? 'O foco agora é usar ' + product + ' para puxar os dias ou horários mais fracos.' : 'O foco agora é distribuir melhor as vendas ao longo da semana.';
    }
    return product ? 'Para esta semana, use ' + product + ' como produto de força e acompanhe se a jogada vira venda.' : 'Para esta semana, foque nas jogadas abaixo e veja qual responde melhor.';
  }

  function _seasonActionProductLabel(action) {
    var text = [
      action && action.title,
      action && action.description,
      action && action.why,
      (action && action.checklist || []).join(' ')
    ].join(' ');
    var match = text.match(/(?:Produto(?: da jogada)?|Produto de entrada|Produto):\s*([^\.]+)/i);
    if (match && match[1]) return String(match[1]).trim();
    match = text.match(/(?:Vender mais|Dar protagonismo para|Dar mais destaque para|Usar|Aumentar pedido com)\s+([^\.]+?)(?:\s+no|\s+pelo|\s+em|\s+com|\s+porque|$)/i);
    return match && match[1] ? String(match[1]).trim() : '';
  }

  function _seasonActionObjectiveText(action, season) {
    if (action && action.goalText) return action.goalText;
    var source = String(action && action.source || '');
    if (source === 'baseline') return 'Criar a primeira leitura real da temporada com pedidos bem registrados.';
    if (source === 'upsell') return 'Aumentar o valor do pedido sem mexer no preço do produto principal.';
    if (source === 'coupons') return 'Criar uma chamada de compra com limite de desconto mais controlado.';
    if (source === 'promotions') return 'Usar uma promoção que pode transformar interesse em venda.';
    if (source === 'healthy_discount') return 'Testar desconto pequeno sem apertar demais a margem.';
    if (source === 'timing') return 'Colocar o produto certo no canal e horário que já trouxeram resposta.';
    if (source === 'retention' || source === 'points') return 'Trazer clientes que já conhecem sua operação para comprar de novo.';
    if (source === 'consistency') return 'Dar movimento para dias ou horários que ainda estão fracos.';
    if (season && season.objective === 'increase_ticket') return 'Aumentar o valor médio dos pedidos.';
    if (season && season.objective === 'retain_customers') return 'Fazer mais clientes voltarem.';
    if (season && season.objective === 'improve_consistency') return 'Deixar as vendas menos concentradas.';
    return 'Aumentar venda usando o produto com melhor resposta.';
  }

  function _seasonActionGoalHtml(action, task, season) {
    var items = [
      { label: 'Fazer', value: _seasonActionObjectiveText(action, season) },
      { label: 'Até quando', value: _seasonActionDeadlineText(task) },
      { label: 'Vai valer a pena se', value: _seasonActionMeasureText(action, season) }
    ];
    return '<div class="seasons-action-objective seasons-action-goal">' +
      items.map(function (item) {
        return '<div><span>' + _esc(item.label) + '</span><strong>' + _esc(item.value) + '</strong></div>';
      }).join('') +
    '</div>';
  }

  function _seasonActionDeadlineText(task) {
    var due = task && (task.executeDueAt || task.dueAt) ? _formatDate(task.executeDueAt || task.dueAt) : '';
    return due ? 'Colocar em prática até ' + due + '.' : 'Colocar em prática nesta rodada da temporada.';
  }

  function _seasonActionMeasureText(action, season) {
    if (action && action.successText) return action.successText;
    var source = String(action && action.source || '');
    var product = _seasonActionProductLabel(action);
    if (source === 'baseline') return 'os primeiros pedidos entrarem com produto, canal e horário preenchidos.';
    if (source === 'upsell') return 'aparecer pedido com esse extra aceito no Cardápio.';
    if (source === 'coupons') return 'o cupom entrar em pedidos sem derrubar demais o valor da venda.';
    if (source === 'promotions') return 'a promoção gerar venda real e manter uma sobra saudável.';
    if (source === 'healthy_discount') return 'vender mais ' + (product || 'o produto') + ' sem passar do desconto indicado.';
    if (source === 'timing') return 'entrar venda pelo canal ou horário indicado, de preferência com ' + (product || 'o produto escolhido') + '.';
    if (source === 'retention' || source === 'points') return 'cliente que já comprou voltar a fazer pedido.';
    if (source === 'consistency') return 'o dia ou horário fraco receber pedido dentro do prazo.';
    if (season && season.objective === 'increase_ticket') return 'o pedido médio subir sem depender só de desconto.';
    if (season && season.objective === 'retain_customers') return 'mais clientes conhecidos voltarem a comprar.';
    return 'a venda aparecer ligada a essa jogada dentro do prazo.';
  }

  function _seasonActionResultHtml(task) {
    if (!task || !task.actionId) return '';
    var status = task.status || 'pending';
    var evidence = task.evidence || {};
    var title = status === 'executed_with_result' ? 'Deu resultado' : (status === 'result_in_progress' ? 'Resultado em leitura' : (status === 'executed_without_result' ? 'Foi feita, mas não respondeu' : (status === 'not_executed' ? 'Não foi executada no prazo' : 'Ainda em andamento')));
    var text = '';
    if (status === 'executed_with_result') {
      text = (evidence.message || 'A jogada apareceu nas vendas.') + (_number(evidence.orderTotal, 0) > 0 ? ' Pedido ligado: ' + _fmtMoney(evidence.orderTotal) + '.' : '');
    } else if (status === 'result_in_progress') {
      text = (evidence.message || 'A jogada já apareceu nas vendas.') + ' O BocaFood mantém a leitura aberta até o fim da janela para saber se vale repetir ou trocar.';
    } else if (status === 'not_executed') {
      text = 'Não encontramos a ação criada ou aplicada dentro do prazo de execução. Na próxima rodada, vale trocar para uma jogada mais simples.';
    } else if (status === 'executed_without_result') {
      text = 'A ação foi colocada em prática, mas não trouxe venda ligada a ela dentro da janela de medição.';
    } else {
      text = 'Assim que uma venda ligada a essa jogada aparecer, o BocaFood mostra aqui o resultado.';
    }
    return '<div class="seasons-action-result seasons-action-result-' + _esc(status) + '"><span>Resultado</span><strong>' + _esc(title) + '</strong><p>' + _esc(text) + '</p></div>';
  }

  function _seasonActionOutcomeSummaryHtml(actions, taskMap, history) {
    var tasks = [];
    (actions || []).forEach(function (action) {
      var task = taskMap && taskMap[action.id];
      if (task) tasks.push(task);
    });
    tasks = tasks.concat(history || []);
    var done = tasks.filter(function (task) { return task.status === 'executed_with_result'; });
    var reading = tasks.filter(function (task) { return task.status === 'result_in_progress'; });
    var expired = tasks.filter(function (task) { return task.status === 'not_executed'; });
    var pending = tasks.filter(function (task) { return !task.status || task.status === 'pending' || task.status === 'manually_done'; });
    var revenue = done.concat(reading).reduce(function (sum, task) { return sum + _number(task && task.evidence && task.evidence.orderTotal, 0); }, 0);
    return '' +
      '<section class="seasons-action-outcome">' +
        '<div class="seasons-next-checklist-head"><strong>O que aconteceu</strong><span>Resultado das jogadas</span></div>' +
        '<div class="seasons-action-outcome-grid">' +
          '<span><small>Com resultado</small><strong>' + done.length + '</strong></span>' +
          '<span><small>Em leitura</small><strong>' + reading.length + '</strong></span>' +
          '<span><small>Sem resposta</small><strong>' + expired.length + '</strong></span>' +
          '<span><small>Em andamento</small><strong>' + pending.length + '</strong></span>' +
          '<span><small>Vendas ligadas</small><strong>' + _esc(_fmtMoney(revenue)) + '</strong></span>' +
        '</div>' +
      '</section>';
  }

  function _seasonActionHistoryHtml(history) {
    if (!history || !history.length) return '';
    return '' +
      '<div class="seasons-action-history">' +
        '<div class="seasons-next-checklist-head"><strong>Jogadas que já passaram</strong><span>Aprendizado guardado</span></div>' +
        history.slice(0, 4).map(function (task) {
          var good = task.status === 'executed_with_result';
          return '<article class="' + (good ? 'is-done' : 'is-expired') + '">' +
            '<span>' + _icon(good ? 'check_circle' : 'schedule') + '</span>' +
            '<div><strong>' + _esc(task.title || 'Jogada') + '</strong><p>' + _esc(_seasonActionHistoryText(task)) + '</p></div>' +
          '</article>';
        }).join('') +
      '</div>';
  }

  function _seasonActionHistoryText(task) {
    if (!task) return '';
    if (task.status === 'executed_with_result') {
      return ((task.evidence && task.evidence.message) || 'Essa jogada apareceu nas vendas.') + (_number(task.evidence && task.evidence.orderTotal, 0) > 0 ? ' Resultado ligado: ' + _fmtMoney(task.evidence.orderTotal) + '.' : '');
    }
    if (task.status === 'result_in_progress') {
      return ((task.evidence && task.evidence.message) || 'Essa jogada já apareceu nas vendas.') + ' A leitura ficou aberta até fechar a janela de resultado.';
    }
    return 'Saiu da rodada sem venda ligada a ela. Isso ajuda a próxima jogada a mudar foco em vez de repetir a mesma tentativa.';
  }

  function _seasonActionLearningHtml(season, metrics, actions, taskMap, history) {
    var lessons = [];
    var done = (history || []).filter(function (task) { return task.status === 'executed_with_result'; });
    var expired = (history || []).filter(function (task) { return task.status === 'not_executed'; });
    var firstAction = (actions || [])[0] || {};
    var product = _seasonActionProductLabel(firstAction);
    if (done.length) lessons.push('O que vira venda deve continuar como referência para a próxima rodada.');
    if (expired.length) lessons.push('O que passou do prazo sem resposta deve mudar produto, canal ou benefício.');
    if (product) lessons.push(product + ' deve ser observado de perto, porque apareceu como ponto de força para a temporada.');
    if (!lessons.length) lessons.push('Quando as primeiras jogadas rodarem, esta área vai mostrar o que vale repetir e o que precisa mudar.');
    return '' +
      '<section class="seasons-action-learning">' +
        '<div class="seasons-next-checklist-head"><strong>Aprendizado da temporada</strong><span>Para a próxima decisão</span></div>' +
        '<ul>' + lessons.slice(0, 3).map(function (item) { return '<li>' + _esc(item) + '</li>'; }).join('') + '</ul>' +
      '</section>';
  }

  function _seasonActionTaskStatusHtml(task) {
    if (!task || !task.actionId) return '';
    var status = task.status || 'pending';
    var due = _formatDate(task.executeDueAt || task.dueAt);
    var resultDue = _formatDate(task.resultDueAt);
    var evidence = task.evidence && task.evidence.message ? task.evidence.message : '';
    var text = status === 'executed_with_result'
      ? (evidence || 'Essa jogada já apareceu nas vendas da operação.')
      : (status === 'result_in_progress'
        ? (evidence || 'Essa jogada já apareceu nas vendas.') + ' Vamos medir até ' + (resultDue || 'o fim da janela') + ' antes de trocar a jogada.'
        : (status === 'executed_without_result'
        ? 'A ação foi executada, mas não trouxe venda ligada a ela até ' + (resultDue || 'o fim da medição') + '.'
        : (status === 'not_executed'
        ? 'O prazo passou e essa jogada ainda não apareceu nas vendas.'
        : (task.executionStatus === 'created_waiting_result' ? 'Ação criada. Agora vamos medir resposta até ' + (resultDue || 'o fim da janela') + '.' : 'Execute até ' + (due || 'o prazo da rodada') + '.'))));
    return '' +
      '<div class="seasons-action-task-status seasons-action-task-status-' + _esc(status) + '">' +
        '<span>' + _icon(status === 'executed_with_result' ? 'check_circle' : (status === 'not_executed' ? 'error' : (status === 'result_in_progress' ? 'query_stats' : 'schedule'))) + _esc(task.statusLabel || _seasonActionTaskStatusLabel(status)) + '</span>' +
        '<small>' + _esc(text) + '</small>' +
      '</div>';
  }

  function _seasonActionButtonsHtml(action, task, season) {
    var buttons = _seasonActionButtons(action, task, season);
    if (!buttons.length) return '';
    return '<div class="seasons-action-buttons">' + buttons.map(function (button) {
      return '<button type="button" class="' + _esc(button.primary ? 'primary' : '') + '" onclick="Modules.Temporadas.handleSeasonActionButton(\'' + _esc(action.id || '') + '\',\'' + _esc(button.type || '') + '\')">' + _icon(button.icon || 'arrow_forward') + _esc(button.label) + '</button>';
    }).join('') + '</div>';
  }

  function _seasonActionButtons(action, task, season) {
    var source = String(action && action.source || '');
    if (source === 'promotions') return [
      { type: 'promotion', label: _seasonActionLooksExisting(action) ? 'Ver promoção' : 'Criar promoção', icon: 'local_offer', primary: true },
      { type: 'catalog', label: 'Ver produto', icon: 'restaurant_menu' }
    ];
    if (source === 'coupons' || source === 'healthy_discount') return [
      { type: 'coupon', label: _seasonActionLooksExisting(action) ? 'Ver cupom' : 'Criar cupom', icon: 'sell', primary: true },
      { type: 'catalog', label: 'Ver produto', icon: 'restaurant_menu' }
    ];
    if (source === 'upsell') return [
      { type: 'upsell', label: _seasonActionLooksExisting(action) ? 'Ver upsell' : 'Criar upsell', icon: 'add_shopping_cart', primary: true },
      { type: 'catalog', label: 'Ver produto', icon: 'restaurant_menu' }
    ];
    if (source === 'products' || source === 'sales_actions') return [
      { type: 'catalog', label: 'Aplicar destaque', icon: 'star', primary: true },
      { type: 'promotion', label: 'Criar promoção', icon: 'local_offer' }
    ];
    if (source === 'retention' || source === 'points') return [
      { type: 'customers', label: 'Ver clientes', icon: 'groups', primary: true },
      { type: 'points', label: 'Ver pontos', icon: 'loyalty' }
    ];
    if (source === 'timing' || source === 'consistency') return [
      { type: 'performance', label: source === 'consistency' ? 'Ver dias fracos' : 'Ver horários', icon: 'query_stats', primary: true },
      { type: 'promotion', label: 'Criar ação', icon: 'campaign' }
    ];
    return [
      { type: 'performance', label: 'Ver desempenho', icon: 'analytics', primary: true }
    ];
  }

  function _seasonActionLooksExisting(action) {
    var id = String(action && action.id || '');
    return id.indexOf('validada') >= 0 || id.indexOf('disponivel') >= 0 || id.indexOf('produto-') >= 0 && String(action && action.title || '').match(/usar|repetir/i);
  }

  function handleSeasonActionButton(actionId, buttonType) {
    var season = _state.activeSeason || {};
    var metrics = season.currentMetrics || {};
    var reading = _seasonReadingForDisplay(season, metrics, _scoreBreakdownForDisplay(season, metrics));
    var executionPlan = _executionPlanForDisplay(season, metrics, reading);
    var action = (executionPlan.actions || []).find(function (item) { return String(item.id || '') === String(actionId || ''); }) || null;
    var route = _seasonActionButtonRoute(buttonType);
    try {
      window.sessionStorage.setItem('bocafoodSeasonActionDraft', JSON.stringify({
        seasonId: season.id || '',
        seasonActionId: actionId || '',
        type: buttonType || '',
        source: action && action.source || '',
        productKey: action && action.productKey || '',
        focusKey: action && action.focusKey || '',
        title: action && action.title || '',
        createdAt: new Date().toISOString()
      }));
    } catch (err) {}
    if (window.UI && typeof UI.toast === 'function') {
      UI.toast(_seasonActionButtonToast(buttonType), 'info');
    }
    if (window.Router && typeof Router.navigate === 'function') Router.navigate(route);
  }

  function _seasonActionButtonRoute(buttonType) {
    return ({
      promotion: 'marketing/promocoes',
      coupon: 'marketing/cupons',
      upsell: 'marketing/upsell',
      catalog: 'catalogo/produtos',
      customers: 'pedidos/clientes',
      points: 'marketing/pontos',
      performance: 'crescimento/performance'
    })[buttonType] || 'crescimento/performance';
  }

  function _seasonActionButtonToast(buttonType) {
    return ({
      promotion: 'Abrindo Promoções com esta jogada como referência.',
      coupon: 'Abrindo Cupons com esta jogada como referência.',
      upsell: 'Abrindo Upsell com esta jogada como referência.',
      catalog: 'Abrindo Produtos para aplicar a jogada.',
      customers: 'Abrindo Clientes para trabalhar recompra.',
      points: 'Abrindo Programa de Pontos.',
      performance: 'Abrindo Performance para comparar os sinais.'
    })[buttonType] || 'Abrindo a área relacionada.';
  }

  function _metricTile(label, value, icon, helpText, highlighted, balloon) {
    var display = value === 0 ? '0' : (value || 'Não definido');
    return '' +
      '<div class="seasons-metric-tile ' + (highlighted ? 'seasons-weighted-field' : '') + (balloon ? ' seasons-metric-clickable' : '') + '" ' + (balloon ? 'role="button" tabindex="0" onclick="Modules.Temporadas.toggleMetricBalloon(this)" onkeydown="Modules.Temporadas._metricTileKey(event,this)"' : '') + '>' +
        _icon(icon) +
        '<small>' + _esc(label) + '</small>' +
        '<strong>' + _esc(display) + '</strong>' +
        (helpText ? '<em>' + _esc(helpText) + '</em>' : '') +
        (balloon ? '<div class="seasons-metric-balloon" hidden><small>' + _esc(balloon.title) + '</small><strong>Resultado atual: ' + _esc(balloon.value) + '</strong><p>' + _esc(balloon.text) + '</p></div>' : '') +
      '</div>';
  }

  function toggleMetricBalloon(card) {
    if (!card) return;
    var isOpen = card.classList.contains('open');
    Array.prototype.forEach.call(document.querySelectorAll('.seasons-metric-tile.open, .seasons-status-bar.open, .seasons-progress-block-inner.open, .seasons-reading-card.open'), function (item) {
      if (item !== card) {
        item.classList.remove('open');
        var itemBalloon = item.querySelector('.seasons-metric-balloon');
        if (itemBalloon) itemBalloon.hidden = true;
      }
    });
    var balloon = card.querySelector('.seasons-metric-balloon');
    card.classList.toggle('open', !isOpen);
    if (balloon) balloon.hidden = isOpen;
  }

  function _metricTileKey(event, card) {
    if (!event || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    toggleMetricBalloon(card);
  }

  function _historyCard(seasons) {
    return '' +
      '<section class="seasons-history-card" aria-label="Histórico de temporadas">' +
        '<div class="seasons-card-head">' +
          '<div>' +
            '<span class="seasons-section-label">Histórico</span>' +
            '<h2>Temporadas anteriores</h2>' +
          '</div>' +
          '<span class="seasons-status-pill">' + seasons.length + ' registro' + (seasons.length === 1 ? '' : 's') + '</span>' +
        '</div>' +
        (seasons.length ? '<div class="seasons-history-list">' + seasons.map(_historyRow).join('') + '</div>' : '<div class="seasons-history-empty">' +
          _icon('timeline') +
          '<div>' +
            '<strong>Espaço reservado para resultados concluídos</strong>' +
            '<p>Quando houver temporadas finalizadas ou abandonadas, esta lista mostrará período, resultado final e score.</p>' +
          '</div>' +
        '</div>') +
      '</section>';
  }

  function _scheduledCard(seasons) {
    return '' +
      '<section class="seasons-history-card" aria-label="Temporadas programadas">' +
        '<div class="seasons-card-head">' +
          '<div>' +
            '<span class="seasons-section-label">Programadas</span>' +
            '<h2>Temporadas futuras</h2>' +
          '</div>' +
          '<button class="seasons-secondary-button seasons-compact-action" type="button" onclick="Modules.Temporadas.openCreateFlow()">' + _icon('add') + ' Nova Temporada</button>' +
        '</div>' +
        (_state.scheduledStartConflict ? '<div class="seasons-warning-line">' + _icon('warning') + ' Existe temporada programada com data de início vencida, mas já há uma temporada ativa. Ela continuará programada até o período ficar livre.</div>' : '') +
        (seasons.length ? '<div class="seasons-history-list">' + seasons.map(_scheduledRow).join('') + '</div>' : '<div class="seasons-history-empty">' +
          _icon('event_upcoming') +
          '<div>' +
            '<strong>Nenhuma temporada programada</strong>' +
            '<p>Crie uma temporada com data futura para preparar a próxima campanha operacional sem iniciar análises agora.</p>' +
          '</div>' +
        '</div>') +
      '</section>';
  }

  function _scheduledRow(season) {
    return '' +
      '<article class="seasons-scheduled-row seasons-scheduled-row-clickable" onclick="Modules.Temporadas.openScheduledDetails(\'' + _esc(season.id || '') + '\')" role="button" tabindex="0">' +
        '<div class="seasons-scheduled-main">' +
          '<strong>' + _esc(season.title || 'Temporada sem título') + '</strong>' +
          '<span>' + _esc(_objectiveLabel(season.objective)) + ' · Prioridade: ' + _esc(_buildLabel(season.build)) + ' · ' + _esc(_difficultyLabel(season.difficulty)) + '</span>' +
          '<small>As análises começam quando a temporada ficar ativa.</small>' +
        '</div>' +
        '<div class="seasons-scheduled-meta">' +
          '<span class="seasons-mini-status seasons-mini-status-scheduled">Programada</span>' +
          '<small>Começa em <strong>' + _esc(_formatDate(season.startDate)) + '</strong></small>' +
          '<small>Termina em <strong>' + _esc(_formatDate(season.endDate)) + '</strong></small>' +
          '<small>Meta <strong>' + _esc(_scheduledTargetLabel(season)) + '</strong></small>' +
          '<small>Chance inicial <strong>' + _esc(_riskLabel(season.initialRiskLevel || season.riskLevel)) + '</strong></small>' +
        '</div>' +
      '</article>';
  }

  function _scheduledTargetLabel(season) {
    if (season.targetMode === 'flight_plan') {
      return 'Plano de Voo · ' + _formatMetricValue(season.calculatedTargetValue, season.objective);
    }
    var value = season.targetMode === 'fixed' ? season.targetValue : season.calculatedTargetValue;
    var mode = season.targetMode === 'fixed' ? 'fixa' : 'automática';
    return mode + ' · ' + _formatMetricValue(value, season.objective);
  }

  function _historyRow(season) {
    var score = _number(season.finalScore, _number(season.currentScore, 0));
    return '' +
      '<article class="seasons-history-row seasons-history-row-clickable" onclick="Modules.Temporadas.openFinalResult(\'' + _esc(season.id || '') + '\')" role="button" tabindex="0">' +
        '<div>' +
          '<strong>' + _esc(season.title || 'Temporada sem título') + '</strong>' +
          '<span>' + _esc(_formatPeriod(season.startDate, season.endDate)) + '</span>' +
        '</div>' +
        '<div class="seasons-history-meta">' +
          '<span class="seasons-mini-status seasons-mini-status-' + _esc(season.status || 'draft') + '">' + _esc(season.finalResult || _statusLabel(season.status)) + '</span>' +
          '<small>Score ' + Math.round(score) + '</small>' +
        '</div>' +
      '</article>';
  }

  function finishActiveSeason() {
    if (_loading) {
      _toast('Aguarde o carregamento da temporada.', 'warning');
      return;
    }
    var season = _state.activeSeason;
    if (!season || season.status !== 'active') {
      _toast('Não há temporada ativa para finalizar.', 'warning');
      return;
    }
    if (season.tenantId && season.tenantId !== _tenantId) {
      _toast('Temporada pertence a outro tenant.', 'error');
      return;
    }

    var end = _toDate(season.endDate);
    if (end && end > new Date()) {
      var ok = window.confirm('Esta temporada ainda não chegou ao fim. Deseja finalizar manualmente agora?');
      if (!ok) return;
    }

    _loading = true;
    _paint();

    _finalizeSeason(season).then(function (finishedSeason) {
      _state.activeSeason = null;
      _state.snapshots = { daily: null, weekly: null };
      _state.seasons = _state.seasons.map(function (item) {
        return item.id === finishedSeason.id ? finishedSeason : item;
      });
      return _registerSeasonMaturityImpact(finishedSeason, 'season_final').then(function () {
        return finishedSeason;
      });
    }).then(function (finishedSeason) {
      _loading = false;
      _paint();
      _toast('Temporada finalizada.', 'success');
      _renderFinalResultModal(finishedSeason);
    }).catch(function (err) {
      console.error('Temporadas finish error', err);
      _loading = false;
      _paint();
      _toast((err && err.message) || 'Erro ao finalizar temporada.', 'error');
    });
  }

  function openFinalResult(id) {
    var season = (_state.seasons || []).filter(function (item) { return item.id === id; })[0];
    if (!season) {
      _toast('Temporada não encontrada.', 'warning');
      return;
    }
    _renderFinalResultModal(season);
  }

  function openScheduledDetails(id) {
    var season = (_state.seasons || []).filter(function (item) { return item.id === id; })[0];
    if (!season || season.status !== 'scheduled') {
      _toast('Temporada programada não encontrada.', 'warning');
      return;
    }
    closeFinalResult();
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-final-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _scheduledDetailsHtml(season);
    document.body.appendChild(wrapper);
  }

  function closeFinalResult() {
    var modal = document.getElementById('seasons-final-modal');
    if (modal) modal.remove();
  }

  function deleteScheduledSeason(id) {
    var season = (_state.seasons || []).filter(function (item) { return item.id === id; })[0];
    if (!season || season.status !== 'scheduled') {
      _toast('Temporada programada não encontrada.', 'warning');
      return;
    }
    if (season.tenantId && season.tenantId !== _tenantId) {
      _toast('Temporada pertence a outro negócio.', 'error');
      return;
    }
    var ok = window.confirm('Excluir esta temporada programada? Ela ainda não começou e será removida da lista de futuras temporadas.');
    if (!ok) return;
    if (!window.DB || typeof DB.remove !== 'function') {
      _toast('Não foi possível excluir agora.', 'error');
      return;
    }
    DB.remove('seasons', id).then(function () {
      closeFinalResult();
      _state.seasons = (_state.seasons || []).filter(function (item) { return item.id !== id; });
      _refreshSeasonStateFlags();
      _paint();
      _toast('Temporada programada excluída.', 'success');
    }).catch(function (err) {
      console.error('Erro ao excluir temporada programada', err);
      _toast((err && err.message) || 'Erro ao excluir temporada programada.', 'error');
    });
  }

  function openStoneEvolutionHistory() {
    var overlay = document.getElementById('stones-upgrade-celebration');
    if (overlay) overlay.remove();
    closeStoneEvolutionHistory();
    var wrapper = document.createElement('div');
    wrapper.id = 'stones-history-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _stoneEvolutionHistoryHtml(_state.businessMaturityEvents || []);
    document.body.appendChild(wrapper);
  }

  function closeStoneEvolutionHistory() {
    var modal = document.getElementById('stones-history-modal');
    if (modal) modal.remove();
  }

  function _stoneEvolutionHistoryHtml(events) {
    events = _normalizeStoneUpgradeEvents(events || []);
    return '<div class="seasons-modal stones-history-modal" role="dialog" aria-modal="true" aria-label="Histórico de evolução">' +
      '<div class="seasons-modal-head">' +
        '<div><span class="seasons-section-label">Sistema de Pedras</span><h2>Histórico de evolução</h2></div>' +
        '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeStoneEvolutionHistory()" aria-label="Fechar">' + _icon('close') + '</button>' +
      '</div>' +
      '<div class="stones-history-body">' +
        '<section>' +
          '<div class="stones-history-section-head"><span class="seasons-section-label">Subidas de Pedra</span><h3>Evoluções registradas</h3></div>' +
          (events.length ? events.map(_stoneHistoryEventCard).join('') : _stoneHistoryEmpty()) +
        '</section>' +
        _maturitySnapshotsHistoryBlock(_state.businessMaturitySnapshots || []) +
      '</div>' +
    '</div>';
  }

  function _stoneHistoryEmpty() {
    return '<div class="stones-history-empty"><div class="stones-symbol">' + _stoneGraphic('Pedra Bruta', 'md') + '</div><h3>Ainda sem evolução registrada</h3><p>Quando a operação subir de Pedra, o evento aparecerá aqui com motivo, data e indicadores usados.</p></div>';
  }

  function _stoneHistoryEventCard(event) {
    var indicators = event.indicatorsUsed || {};
    var checklist = indicators.checklistSummary || {};
    var orderSummary = indicators.orderSummary || {};
    return '<article class="stones-history-event">' +
      '<div class="stones-history-event-main">' +
        '<div class="stones-evolution-path">' +
          '<span class="' + _esc(_stoneThemeClass(event.fromStone)) + '">' + _esc(event.fromStone || 'Pedra anterior') + '</span>' +
          '<b>→</b>' +
          '<span class="' + _esc(_stoneThemeClass(event.toStone)) + '">' + _esc(event.toStone || 'Nova Pedra') + '</span>' +
        '</div>' +
        '<small>' + _esc(_formatDateTime(event.createdAt || event.upgradedAt) || 'Data em processamento') + '</small>' +
        '<p>' + _esc(event.reason || 'Evolução registrada a partir dos indicadores de maturidade.') + '</p>' +
      '</div>' +
      '<div class="stones-history-metrics">' +
        _stoneHistoryMetric('Progresso anterior', Math.round(_number(event.previousProgress, 0)) + '%') +
        _stoneHistoryMetric('Score', Math.round(_number(event.maturityScore, 0))) +
        _stoneHistoryMetric('Marcos concluídos', _number(checklist.completed, 0) + '/' + _number(checklist.total, 0)) +
        _stoneHistoryMetric('Dias com venda', _number(orderSummary.activeDays, 0)) +
      '</div>' +
    '</article>';
  }

  function _stoneHistoryMetric(label, value) {
    return '<span><small>' + _esc(label) + '</small><strong>' + _esc(value) + '</strong></span>';
  }

  function _maturitySnapshotsHistoryBlock(snapshots) {
    snapshots = _normalizeMaturitySnapshots(snapshots || []).slice(0, 12);
    return '<section class="stones-snapshots-history">' +
      '<div class="stones-history-section-head"><span class="seasons-section-label">Histórico de maturidade</span><h3>Leituras recentes</h3></div>' +
      (snapshots.length ? '<div class="stones-snapshots-list">' + snapshots.map(_maturitySnapshotRow).join('') + '</div>' : '<div class="stones-snapshots-empty">Ainda não há leituras de maturidade registradas.</div>') +
    '</section>';
  }

  function _maturitySnapshotRow(snapshot) {
    return '<article class="stones-snapshot-row">' +
      '<div>' +
        '<strong>' + _esc(snapshot.currentStone || 'Pedra Bruta') + '</strong>' +
        '<span>' + _esc(_snapshotTypeLabel(snapshot.snapshotType)) + ' · ' + _esc(_formatDate(snapshot.createdAt || snapshot.periodEnd) || 'Data em processamento') + '</span>' +
      '</div>' +
      '<div class="stones-snapshot-row-metrics">' +
        '<small>Progresso <strong>' + Math.round(_number(snapshot.stoneProgressPercent, 0)) + '%</strong></small>' +
        '<small>Score <strong>' + Math.round(_number(snapshot.maturityScore, 0)) + '</strong></small>' +
      '</div>' +
    '</article>';
  }

  function _snapshotTypeLabel(type) {
    return ({
      monthly: 'Mensal',
      season_final: 'Temporada finalizada',
      stone_upgrade: 'Subida de Pedra',
      manual_recalculation: 'Recálculo manual'
    })[type] || 'Leitura salva';
  }

  function _renderFinalResultModal(season) {
    closeFinalResult();
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-final-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _finalResultHtml(season);
    document.body.appendChild(wrapper);
    _triggerVictoryCelebration(season);
  }

  function _triggerStoneUpgradeCelebration(event) {
    if (!event || !event.id || event.celebrationShownAt) return;
    var existing = document.getElementById('stones-upgrade-celebration');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'stones-upgrade-celebration';
    overlay.className = 'stones-upgrade-celebration ' + _stoneThemeClass(event.toStone);
    overlay.innerHTML = _stoneUpgradeCelebrationHtml(event);
    document.body.appendChild(overlay);
    _markStoneCelebrationShown(event);

    window.setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 4200);
  }

  function _stoneUpgradeCelebrationHtml(event) {
    var palette = _stoneCelebrationPalette(event.toStone);
    var pieces = [];
    for (var i = 0; i < 38; i += 1) {
      var left = 5 + Math.random() * 90;
      var top = 6 + Math.random() * 30;
      var delay = Math.random() * .35;
      var duration = 2.4 + Math.random() * .9;
      var drift = (Math.random() * 180 - 90).toFixed(0) + 'px';
      var rotate = (Math.random() * 520 - 260).toFixed(0) + 'deg';
      var size = (5 + Math.random() * 8).toFixed(0) + 'px';
      var color = palette[i % palette.length];
      pieces.push('<span style="left:' + left.toFixed(2) + '%;top:' + top.toFixed(2) + 'vh;--stone-delay:' + delay.toFixed(2) + 's;--stone-duration:' + duration.toFixed(2) + 's;--stone-drift:' + drift + ';--stone-rotate:' + rotate + ';--stone-color:' + color + ';--stone-size:' + size + ';"></span>');
    }
    return '<div class="stones-upgrade-particles" aria-hidden="true">' + pieces.join('') + '</div>' +
      '<div class="stones-upgrade-toast" role="status">' +
        '<div class="stones-upgrade-symbol">' + _stoneGraphic(event.toStone, 'md') + '</div>' +
        '<div>' +
          '<small>Sistema de Pedras</small>' +
          '<strong>Você evoluiu para ' + _esc(event.toStone || 'a próxima Pedra') + '.</strong>' +
          '<p>Seu negócio demonstrou mais maturidade, consistência e evolução saudável.</p>' +
          '<button class="seasons-primary-button" type="button" onclick="Modules.Temporadas.openStoneEvolutionHistory()">Ver evolução</button>' +
        '</div>' +
      '</div>';
  }

  function _stoneCelebrationPalette(stone) {
    var map = {
      Quartzo: ['#FFFFFF', '#EAE4DA', '#B6925E'],
      Ametista: ['#7C3AED', '#C4B5FD', '#F5F3FF'],
      Safira: ['#1D4ED8', '#93C5FD', '#EFF6FF'],
      Esmeralda: ['#047857', '#86EFAC', '#ECFDF5'],
      Rubi: ['#B42318', '#FCA5A5', '#FFF1F2'],
      Diamante: ['#E0F2FE', '#FFFFFF', '#94A3B8'],
      'Ônix': ['#111827', '#6B7280', '#F9FAFB']
    };
    return map[stone] || ['#8A6F5A', '#EAE4DA', '#FFFFFF'];
  }

  function _markStoneCelebrationShown(event) {
    _state.pendingStoneCelebration = null;
    _state.businessMaturityEvents = (_state.businessMaturityEvents || []).map(function (item) {
      if (item.id !== event.id) return item;
      return Object.assign({}, item, { celebrationPending: false, celebrationShownAt: new Date().toISOString() });
    });
    if (!window.DB || typeof DB.update !== 'function') return;
    DB.update('stone_upgrade_events', event.id, {
      celebrationPending: false,
      celebrationShownAt: _maturityTimestamp()
    }).catch(function (err) {
      console.warn('Stone upgrade celebration update skipped', err);
    });
  }

  function _triggerVictoryCelebration(season) {
    if (!season || season.finalResult !== 'Vitória Total') return;
    var key = season.id || String(season.finishedAt || season.title || 'victory-total');
    if (_celebratedFinalResults[key]) return;
    _celebratedFinalResults[key] = true;

    var existing = document.getElementById('seasons-victory-celebration');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'seasons-victory-celebration';
    overlay.className = 'seasons-victory-celebration';
    overlay.setAttribute('aria-hidden', 'true');

    var palette = ['#B42318', '#E04B3F', '#B6925E', '#D8B46E', '#1A9E5A', '#2563EB', '#F4D4A8', '#FFFFFF'];
    var shapes = ['star', 'streamer', 'dot', 'spark'];
    var pieces = [];
    for (var i = 0; i < 86; i += 1) {
      var left = 3 + Math.random() * 94;
      var top = 4 + Math.random() * 18;
      var delay = Math.random() * .55;
      var duration = 3.6 + Math.random() * 1.2;
      var drift = (Math.random() * 280 - 140).toFixed(0) + 'px';
      var rotate = (Math.random() * 760 - 380).toFixed(0) + 'deg';
      var size = (6 + Math.random() * 9).toFixed(0) + 'px';
      var color = palette[i % palette.length];
      var shape = shapes[i % shapes.length];
      pieces.push('<span class="seasons-victory-piece seasons-victory-' + shape + '" style="left:' + left.toFixed(2) + '%;top:' + top.toFixed(2) + 'vh;--vc-delay:' + delay.toFixed(2) + 's;--vc-duration:' + duration.toFixed(2) + 's;--vc-drift:' + drift + ';--vc-rotate:' + rotate + ';--vc-color:' + color + ';--vc-size:' + size + ';"></span>');
    }
    overlay.innerHTML = '<div class="seasons-victory-burst">' + pieces.join('') + '</div>';
    document.body.appendChild(overlay);

    window.setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 5000);
  }

  function _showGoalReachedCelebration(season) {
    var existing = document.getElementById('seasons-goal-celebration');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'seasons-goal-celebration';
    overlay.className = 'seasons-goal-celebration';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    var palette = ['#B42318', '#E04B3F', '#B6925E', '#D8B46E', '#1A9E5A', '#2563EB', '#F4D4A8', '#FFFFFF'];
    var pieces = [];
    for (var i = 0; i < 74; i += 1) {
      var left = 3 + Math.random() * 94;
      var top = 4 + Math.random() * 20;
      var delay = Math.random() * .52;
      var duration = 3.5 + Math.random() * 1.15;
      var drift = (Math.random() * 250 - 125).toFixed(0) + 'px';
      var rotate = (Math.random() * 680 - 340).toFixed(0) + 'deg';
      var size = (6 + Math.random() * 8).toFixed(0) + 'px';
      var color = palette[i % palette.length];
      var shape = i % 4 === 0 ? 'star' : (i % 4 === 1 ? 'streamer' : (i % 4 === 2 ? 'dot' : 'spark'));
      pieces.push('<span class="seasons-goal-piece seasons-victory-' + shape + '" style="left:' + left.toFixed(2) + '%;top:' + top.toFixed(2) + 'vh;--vc-delay:' + delay.toFixed(2) + 's;--vc-duration:' + duration.toFixed(2) + 's;--vc-drift:' + drift + ';--vc-rotate:' + rotate + ';--vc-color:' + color + ';--vc-size:' + size + ';"></span>');
    }

    overlay.innerHTML = '' +
      '<div class="seasons-goal-burst">' + pieces.join('') + '</div>' +
      '<section class="seasons-goal-toast">' +
        '<div class="seasons-goal-mark">' + _icon('flag_check') + '</div>' +
        '<div>' +
          '<strong>Meta da temporada atingida.</strong>' +
          '<p>Você bateu o objetivo definido para esta temporada.</p>' +
        '</div>' +
        '<button type="button" onclick="Modules.Temporadas.openActiveFromCelebration()">Ver temporada</button>' +
      '</section>';

    document.body.appendChild(overlay);
    window.setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 5000);
  }

  function openActiveFromCelebration() {
    var overlay = document.getElementById('seasons-goal-celebration');
    if (overlay) overlay.remove();
    if (window.Router && typeof Router.navigate === 'function') {
      Router.navigate('crescimento/temporadas');
    }
  }

  function _finalResultHtml(season) {
    var summary = season.finalSummary || {};
    var metrics = season.finalMetrics || season.currentMetrics || {};
    var result = season.finalResult || 'Resultado não calculado';
    return '' +
      '<div class="seasons-modal seasons-final-modal" role="dialog" aria-modal="true" aria-label="Resultado Final">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Resultado Final</span>' +
            '<h2>' + _esc(result) + '</h2>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeFinalResult()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-final-body">' +
          '<div class="seasons-final-hero">' +
            '<div>' +
              '<span>' + _esc(season.title || 'Temporada sem título') + '</span>' +
              '<h3>' + _esc(_objectiveLabel(season.objective)) + '</h3>' +
              '<p>' + _esc(summary.headline || _formatPeriod(season.startDate, season.finishedAt || season.endDate)) + '</p>' +
            '</div>' +
            '<strong>' + Math.round(_number(season.finalScore, season.currentScore || 0)) + '</strong>' +
          '</div>' +
          '<div class="seasons-final-grid">' +
            _finalFact('Prioridade', _buildLabel(season.build)) +
            _finalFact('Dificuldade', _difficultyLabel(season.difficulty)) +
            _finalFact('Meta', _formatMetricValue(metrics.targetValue, season.objective)) +
            _finalFact('Resultado', _formatMetricValue(metrics.currentValue, season.objective)) +
            _finalFact('Progresso final', Math.round(_number(season.finalProgressPercent, season.progressPercent || 0)) + '%') +
            _finalFact('Classificação', result) +
          '</div>' +
          '<div class="seasons-final-columns">' +
            _finalList('O que funcionou', summary.worked || []) +
            _finalList('O que atrapalhou', summary.blocked || []) +
          '</div>' +
          _seasonStoneImpactBlock(season) +
          '<div class="seasons-final-summary">' +
            '<span class="seasons-section-label">Evolução detectada</span>' +
            '<p>' + _esc(summary.evolution || 'Ainda não há leitura estratégica suficiente para esta temporada.') + '</p>' +
          '</div>' +
          '<div class="seasons-final-suggestion">' +
            _icon('next_plan') +
            '<div><small>Sugestão para próxima temporada</small><strong>' + _esc(_objectiveLabel(summary.nextSeasonSuggestion || '')) + '</strong><p>' + _esc(summary.suggestionReason || 'Sugestão baseada nas métricas finais disponíveis.') + '</p></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _scheduledDetailsHtml(season) {
    return '' +
      '<div class="seasons-modal seasons-final-modal" role="dialog" aria-modal="true" aria-label="Temporada Programada">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Temporada Programada</span>' +
            '<h2>' + _esc(season.title || 'Temporada sem título') + '</h2>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeFinalResult()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-final-body">' +
          '<div class="seasons-final-grid">' +
            _finalFact('Objetivo', _objectiveLabel(season.objective)) +
            _finalFact('Prioridade', _buildLabel(season.build)) +
            _finalFact('Dificuldade', _difficultyLabel(season.difficulty)) +
            _finalFact('Início', _formatDate(season.startDate)) +
            _finalFact('Fim', _formatDate(season.endDate)) +
            _finalFact('Meta', _scheduledTargetLabel(season)) +
            _finalFact('Chance inicial', _riskLabel(season.initialRiskLevel || season.riskLevel)) +
            _finalFact('Status', _statusLabel(season.status)) +
          '</div>' +
          '<div class="seasons-final-summary">' +
            '<span class="seasons-section-label">Análises</span>' +
            '<p>As leituras automáticas e recomendações da Próxima Jogada começam quando a temporada ficar ativa.</p>' +
          '</div>' +
          '<div class="seasons-modal-foot" style="padding:0;margin-top:4px;border-top:none;background:transparent;">' +
            '<button class="seasons-secondary-button" type="button" onclick="Modules.Temporadas.closeFinalResult()">Fechar</button>' +
            '<button class="seasons-secondary-button" type="button" onclick="Modules.Temporadas.deleteScheduledSeason(\'' + _esc(season.id || '') + '\')" style="color:#B42318;border-color:#F1D2CE;background:#FFF7F5;">Excluir temporada</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _finalFact(label, value) {
    var display = value === 0 ? '0' : (value || 'Não definido');
    return '<div class="seasons-final-fact"><small>' + _esc(label) + '</small><strong>' + _esc(display) + '</strong></div>';
  }

  function _finalList(title, items) {
    items = items && items.length ? items : ['Sem leitura suficiente.'];
    return '' +
      '<div class="seasons-final-list">' +
        '<h4>' + _esc(title) + '</h4>' +
        '<ul>' + items.map(function (item) { return '<li>' + _esc(item) + '</li>'; }).join('') + '</ul>' +
      '</div>';
  }

  function openHelpModal() {
    if (!_state.activeSeason) {
      _toast('Abra uma temporada ativa para ver a explicação dos indicadores.', 'warning');
      return;
    }
    closeHelpModal();
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-help-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _helpModalHtml(_state.activeSeason);
    document.body.appendChild(wrapper);
  }

  function closeHelpModal() {
    var modal = document.getElementById('seasons-help-modal');
    if (modal) modal.remove();
  }

  function _helpModalHtml(season) {
    var objective = _objectiveHelp(season.objective);
    var build = _buildHelp(season.build);
    var difficulty = _difficultyHelp(season.difficulty);
    return '' +
      '<div class="seasons-modal seasons-help-modal" role="dialog" aria-modal="true" aria-label="Como ler esta temporada">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Ajuda da Temporada</span>' +
            '<h2>Como ler esta temporada</h2>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeHelpModal()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-modal-body seasons-help-body">' +
          '<section class="seasons-help-summary">' +
            _helpSummaryCard('Objetivo', _objectiveLabel(season.objective)) +
            _helpSummaryCard('Prioridade', _buildLabel(season.build)) +
            _helpSummaryCard('Dificuldade', _difficultyLabel(season.difficulty)) +
            _helpSummaryCard('Duração', _durationDays(season) + ' dias') +
          '</section>' +
          '<section class="seasons-help-section">' +
            '<h3>O que esta tela te mostra</h3>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Painel da Temporada', 'Mostra o caminho escolhido: objetivo, prioridade, dificuldade, score, progresso e dias restantes.', 'Use este bloco para saber rapidamente se a temporada está andando no ritmo certo.') +
              _helpItem('Visão Geral', 'Resume como a temporada está hoje, o que está ajudando e o que está travando.', 'Os cards têm explicação extra: clique neles para abrir o balão de ajuda.') +
              _helpItem('Próxima Jogada', 'Mostra as ações práticas que valem fazer agora, com produto, canal, prazo e motivo quando esses dados existem.', 'É a parte mais operacional da Temporada: aqui fica o que fazer no dia a dia.') +
              _helpItem('Resultado da jogada', 'Quando uma jogada aparece nos pedidos, o BocaFood mostra se ela deu resultado, não respondeu ou passou do prazo.', 'Assim a próxima decisão aprende com o que aconteceu.') +
            '</div>' +
          '</section>' +
          _helpWeightHighlightsHtml(season) +
          '<section class="seasons-help-section">' +
            '<h3>Diferença entre progresso, score, risco e resultado</h3>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Progresso', 'Mostra quanto da meta principal já foi alcançado.', 'Exemplo: se a meta é faturar €1.000 e já faturou €400, o progresso é 40%. Ele olha volume da meta, não qualidade da execução.') +
              _helpItem('Score', 'Mostra a qualidade geral do caminho da temporada, de 0 a 100.', 'Ele combina avanço da meta, sinais reais das jogadas e penalizações quando o ritmo ou o risco pedem atenção.') +
              _helpItem('Risco', 'Mostra a chance de a temporada não chegar bem ao final se continuar como está.', 'Ele olha dificuldade da meta, histórico, ritmo atual, atraso contra o esperado e dias restantes.') +
              _helpItem('Resultado final', 'Só é fechado quando a temporada termina.', 'É a classificação final, como Vitória Total, Vitória Parcial ou Temporada Instável, usando progresso, score e risco juntos.') +
            '</div>' +
          '</section>' +
          '<section class="seasons-help-section">' +
            '<h3>Como ler os cards principais</h3>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Resumo da temporada', 'É a leitura principal do momento: mostra se a temporada está dentro do caminho, abaixo do ritmo ou pedindo atenção.', 'A porcentagem ao lado mostra o avanço da meta principal.') +
              _helpItem('Meta e progresso', 'Compara o que precisava acontecer com o que já aconteceu até agora.', objective.progress + ' Use para saber quanto falta, não para julgar se a temporada está saudável sozinha.') +
              _helpItem('Score', 'Mostra se o caminho está saudável para o objetivo escolhido.', objective.score + ' Um progresso alto com risco alto pode ter score menor; um progresso parcial com bons sinais pode manter score melhor.') +
              _helpItem('Risco', 'Mostra a chance de a temporada não chegar bem ao final se continuar no ritmo atual.', 'Risco alto não é erro: é um aviso para agir mais rápido, simplificar a jogada ou proteger o resultado.') +
              _helpItem('Base observada', 'Mostra o retrato das vendas desta temporada até agora.', 'Use para entender o volume de pedidos, o ticket médio e o resultado que está puxando o objetivo escolhido.') +
              _helpItem('O que ajuda e o que trava', 'Mostra sinais simples do que está puxando a temporada e do que está atrapalhando.', 'Use essa parte para entender por que a Próxima Jogada foi sugerida.') +
            '</div>' +
          '</section>' +
          '<section class="seasons-help-section">' +
            '<h3>Como agir com a Próxima Jogada</h3>' +
            '<div class="seasons-help-intro">' +
              '<h4>Uma jogada por vez</h4>' +
              '<p>A Próxima Jogada existe para transformar a rota em ação prática. Ela deve dizer o que fazer, por que fazer, até quando fazer e como o BocaFood vai reconhecer se valeu a pena.</p>' +
              '<span>Quando a dificuldade for maior, podem aparecer mais jogadas, mas cada uma precisa ter um objetivo claro.</span>' +
            '</div>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Fazer', 'É a ação principal da jogada.', 'Exemplo: destacar um produto, criar uma promoção, usar um cupom, ativar upsell ou puxar recompra.') +
              _helpItem('Por que fazer', 'Mostra o dado que justifica a jogada.', 'Pode vir de produto forte, canal que respondeu melhor, horário com pedido, promoção usada ou cliente recorrente.') +
              _helpItem('Até quando', 'Mostra o prazo para colocar a jogada em prática.', 'O prazo muda conforme a dificuldade: seguro é mais tranquilo, agressivo é mais rápido.') +
              _helpItem('Vai valer a pena se', 'Mostra como o BocaFood vai reconhecer resposta.', 'O resultado precisa aparecer em pedido real ou em ação criada dentro do BocaFood.') +
            '</div>' +
          '</section>' +
          '<section class="seasons-help-section seasons-help-split">' +
            '<div>' +
              '<h3>Objetivo</h3>' +
              '<p>' + _esc(objective.focus) + '</p>' +
            '</div>' +
            '<div>' +
              '<h3>Prioridade da temporada</h3>' +
              '<p>' + _esc(build) + '</p>' +
            '</div>' +
            '<div>' +
              '<h3>Dificuldade</h3>' +
              '<p>' + _esc(difficulty) + '</p>' +
            '</div>' +
          '</section>' +
          '<p class="seasons-help-note">A Temporada não cria uma meta separada: ela acompanha a rota escolhida no Plano de Voo e usa pedidos reais para orientar as próximas jogadas.</p>' +
        '</div>' +
      '</div>';
  }

  function _helpSummaryCard(label, value) {
    return '<div><small>' + _esc(label) + '</small><strong>' + _esc(value) + '</strong></div>';
  }

  function _helpItem(title, text, detail) {
    return '' +
      '<article class="seasons-help-item">' +
        '<h4>' + _esc(title) + '</h4>' +
        '<p>' + _esc(text) + '</p>' +
        (detail ? '<span>' + _esc(detail) + '</span>' : '') +
      '</article>';
  }

  function _helpWeightHighlightsHtml(season) {
    var weights = _objectiveWeights(season.objective);
    if (!weights.length) return '';
    return '' +
      '<section class="seasons-help-section">' +
        '<h3>Campos com mais peso nesta temporada</h3>' +
        '<div class="seasons-weight-highlight">' +
          '<p>Estes indicadores puxam mais a leitura do score para o objetivo <strong>' + _esc(_objectiveLabel(season.objective)) + '</strong>.</p>' +
          '<div>' + weights.map(function (item) {
            return '<span><strong>' + _esc(item.weight) + '</strong>' + _esc(item.label) + '</span>';
          }).join('') + '</div>' +
          '<small>A prioridade ' + _esc(_buildLabel(season.build)) + ' orienta por onde começar, mas não impede o BocaFood de sugerir outra jogada se os dados mostrarem uma oportunidade mais forte.</small>' +
        '</div>' +
      '</section>';
  }

  function _objectiveWeights(objective) {
    return ({
      sell_more: [
        { label: 'Faturamento', weight: '45%' },
        { label: 'Pedidos', weight: '35%' },
        { label: 'Dias com venda', weight: '20%' }
      ],
      increase_ticket: [
        { label: 'Ticket médio', weight: '50%' },
        { label: 'Valor médio por pedido', weight: '25%' },
        { label: 'Adicionais, combos ou upsell', weight: '25%' }
      ],
      retain_customers: [
        { label: 'Clientes recorrentes', weight: '45%' },
        { label: 'Recompra', weight: '35%' },
        { label: 'Frequência média', weight: '20%' }
      ],
      improve_consistency: [
        { label: 'Dias com venda', weight: '40%' },
        { label: 'Regularidade semanal', weight: '35%' },
        { label: 'Redução de dias fracos', weight: '25%' }
      ]
    })[objective] || [];
  }

  function _objectiveHelp(objective) {
    var map = {
      sell_more: {
        progress: 'Para esta temporada, o progresso compara o faturamento atual com a meta definida.',
        score: 'O score combina faturamento, pedidos e dias com venda.',
        current: 'Nesta temporada, representa o faturamento acumulado no período.',
        target: 'Nesta temporada, a meta principal é o faturamento esperado até o fim.',
        focus: 'Foco em faturamento, pedidos e dias com venda.'
      },
      increase_ticket: {
        progress: 'Para esta temporada, o progresso compara o ticket médio atual com a meta definida.',
        score: 'O score combina ticket médio, valor por pedido e sinais de adicionais, combos ou upsell.',
        current: 'Nesta temporada, representa o ticket médio calculado até agora.',
        target: 'Nesta temporada, a meta principal é o ticket médio esperado até o fim.',
        focus: 'Foco em ticket médio, valor por pedido e adicionais, combos ou upsell.'
      },
      retain_customers: {
        progress: 'Para esta temporada, o progresso acompanha recorrência e recompra conforme a meta.',
        score: 'O score combina clientes recorrentes, recompra e frequência média.',
        current: 'Nesta temporada, representa a recorrência ou recompra observada até agora.',
        target: 'Nesta temporada, a meta principal é melhorar a fidelização até o fim.',
        focus: 'Foco em recompra, clientes recorrentes e frequência.'
      },
      improve_consistency: {
        progress: 'Para esta temporada, o progresso acompanha dias ativos e regularidade de vendas.',
        score: 'O score combina dias com venda, regularidade semanal e redução de dias fracos.',
        current: 'Nesta temporada, representa os dias ativos e a consistência observada.',
        target: 'Nesta temporada, a meta principal é manter vendas mais regulares até o fim.',
        focus: 'Foco em dias com venda, regularidade semanal e redução de dias fracos.'
      }
    };
    return map[objective] || {
      progress: 'Para esta temporada, o progresso acompanha a métrica principal do objetivo escolhido.',
      score: 'O score combina as métricas principais da temporada.',
      current: 'Representa o valor atual da métrica principal.',
      target: 'Representa a meta definida para o fim da temporada.',
      focus: 'Foco nas métricas principais do objetivo escolhido.'
    };
  }

  function _buildHelp(build) {
    return ({
      volume: 'Com a prioridade Mais movimento, o sistema dá mais peso para produto forte, canal, horário e volume de pedidos.',
      margin: 'Com a prioridade Melhor sobra, o sistema dá mais peso para ticket, margem e produtos que vendem melhor.',
      retention: 'Com a prioridade Clientes voltando, o sistema dá mais peso para recompra, pontos e clientes conhecidos.'
    })[build] || 'A prioridade orienta o começo da leitura, mas não limita as jogadas quando os dados mostram uma oportunidade mais forte.';
  }

  function _difficultyHelp(difficulty) {
    return ({
      safe: 'Seguro: meta mais realista, com menor pressão operacional.',
      balanced: 'Equilibrado: meta moderada, que exige consistência.',
      aggressive: 'Agressivo: meta mais alta, com maior risco e maior ritmo necessário.'
    })[difficulty] || 'A dificuldade define o nível de exigência da meta e do ritmo esperado.';
  }

  function openCreateFlow() {
    if (_loading) {
      _toast('Aguarde o carregamento das temporadas.', 'warning');
      return;
    }
    _wizard = _defaultWizard();
    _renderWizard();
  }

  function closeCreateFlow() {
    _wizard = null;
    _removeWizardModal();
  }

  function _removeWizardModal() {
    var modal = document.getElementById('seasons-create-modal');
    if (modal) modal.remove();
  }

  function _defaultWizard() {
    var firstSeason = !(_state && Array.isArray(_state.seasons) && _state.seasons.length);
    return {
      step: 0,
      saving: false,
      baselineLoading: false,
      baseline: null,
      error: '',
      values: {
        objective: firstSeason ? 'increase_ticket' : '',
        durationType: firstSeason ? 'sprint' : '',
        startDate: _todayKey(),
        targetMode: 'flight_plan',
        targetValue: '',
        difficulty: firstSeason ? 'safe' : '',
        build: firstSeason ? 'margin' : ''
      }
    };
  }

  function _renderWizard() {
    _removeWizardModal();
    if (!_wizard) return;
    var wrapper = document.createElement('div');
    wrapper.id = 'seasons-create-modal';
    wrapper.className = 'seasons-modal-backdrop';
    wrapper.innerHTML = _wizardHtml();
    document.body.appendChild(wrapper);
  }

  function _wizardHtml() {
    var step = _wizard.step;
    var title = ['Objetivo', 'Duração', 'Data de início', 'Dificuldade', 'Prioridade da temporada', 'Resumo final'][step] || 'Nova Temporada';
    var totalSteps = 6;
    return '' +
      '<div class="seasons-modal seasons-create-wizard" role="dialog" aria-modal="true" aria-label="Nova Temporada">' +
        '<div class="seasons-modal-head">' +
          '<div>' +
            '<span class="seasons-section-label">Nova Temporada</span>' +
            '<h2>' + _esc(title) + '</h2>' +
            '<p>' + _esc(_wizardStepSubtitle(step)) + '</p>' +
          '</div>' +
          '<button class="seasons-icon-button" type="button" onclick="Modules.Temporadas.closeCreateFlow()" aria-label="Fechar">' + _icon('close') + '</button>' +
        '</div>' +
        '<div class="seasons-stepper seasons-stepper-rich">' + [0, 1, 2, 3, 4, 5].map(function (idx) {
          return '<span class="' + (idx === step ? 'active' : (idx < step ? 'done' : '')) + '"><i></i></span>';
        }).join('') + '</div>' +
        '<div class="seasons-modal-body seasons-wizard-body">' +
          _wizardDecisionPanel(step) +
          '<div class="seasons-wizard-main">' + _wizardStepHtml(step) + '</div>' +
        '</div>' +
        (_wizard.error ? '<div class="seasons-wizard-error">' + _icon('error') + _esc(_wizard.error) + '</div>' : '') +
        '<div class="seasons-modal-foot">' +
          '<button class="seasons-secondary-button" type="button" onclick="Modules.Temporadas._wizardBack()" ' + (step === 0 || _wizard.saving ? 'disabled' : '') + '>Voltar</button>' +
          '<button class="seasons-primary-button" type="button" onclick="Modules.Temporadas._wizardNext()" ' + (_wizard.saving ? 'disabled' : '') + '>' + (step === totalSteps - 1 ? (_wizard.saving ? 'Salvando...' : 'Salvar Temporada') : 'Continuar') + '</button>' +
        '</div>' +
      '</div>';
  }

  function _wizardStepSubtitle(step) {
    return [
      'Escolha o foco principal deste ciclo operacional.',
      'Defina o tamanho da rodada de trabalho.',
      'Escolha quando a temporada começa a acompanhar a rota.',
      'Defina a intensidade das ações que o BocaFood vai sugerir.',
      'Escolha por onde o BocaFood deve começar a procurar as próximas ações.',
      'Revise a rota, o esforço e a base antes de iniciar.'
    ][step] || 'Monte uma temporada clara para executar o Plano de Voo.';
  }

  function _wizardDecisionPanel(step) {
    var values = _wizard.values || {};
    var baseline = _wizard.baseline;
    var plan = baseline && baseline.planConnection ? baseline.planConnection : null;
    var range = _wizardPeriodRange(values);
    var duration = _findByValue(DURATIONS, values.durationType);
    var facts = [
      { label: 'Objetivo', value: values.objective ? _objectiveLabel(values.objective) : 'Escolher agora' },
      { label: 'Duração', value: duration ? duration.label + ' · ' + duration.text : 'Ainda não definida' },
      { label: 'Início', value: values.startDate ? _formatDate(_parseDateInput(values.startDate)) : 'Hoje' },
      { label: 'Ritmo', value: values.difficulty ? _difficultyLabel(values.difficulty) : 'Ainda não definido' },
      { label: 'Prioridade', value: values.build ? _buildLabel(values.build) : 'Ainda não definida' }
    ];
    var routeValue = plan ? _fmtMoney(plan.gapAtStart || plan.routeTarget || 0) : (_wizard.baselineLoading ? 'Buscando rota' : 'Plano de Voo');
    var guidance = [
      'Primeiro escolha o que você quer melhorar nesta temporada.',
      'Sprint é mais rápido. Temporada dá mais tempo para observar resposta.',
      'A data define quando o BocaFood começa a medir pedidos e ações.',
      'Quanto maior a dificuldade, mais ações ficam ativas ao mesmo tempo.',
      'A prioridade dá mais peso a um caminho, mas não bloqueia outras ações se os dados mostrarem algo mais forte.',
      'Depois de salvar, a temporada vira acompanhamento. Para mudar o caminho, crie outra.'
    ][step] || '';
    return '' +
      '<aside class="seasons-wizard-decision">' +
        '<small>Decisão da temporada</small>' +
        '<h3>' + _esc(_wizardStepDecisionTitle(step)) + '</h3>' +
        '<p>' + _esc(guidance) + '</p>' +
        '<div class="seasons-wizard-route">' +
          '<span>Base da rota</span>' +
          '<strong>' + _esc(routeValue) + '</strong>' +
          '<small>' + _esc(range ? _formatDate(range.start) + ' até ' + _formatDate(range.end) : 'Período será calculado') + '</small>' +
        '</div>' +
        '<div class="seasons-wizard-facts">' + facts.map(function (item) {
          return '<div><span>' + _esc(item.label) + '</span><strong>' + _esc(item.value) + '</strong></div>';
        }).join('') + '</div>' +
      '</aside>';
  }

  function _wizardStepDecisionTitle(step) {
    return [
      'Qual resultado precisa melhorar?',
      'Qual o tamanho da rodada?',
      'Quando começa a execução?',
      'Qual intensidade combina com sua rotina?',
      'Por onde o BocaFood deve procurar as próximas ações?',
      'Está pronto para acompanhar?'
    ][step] || 'Nova temporada';
  }

  function _wizardStepHtml(step) {
    if (step === 0) return _optionGrid(OBJECTIVES, 'objective');
    if (step === 1) return _optionGrid(DURATIONS, 'durationType');
    if (step === 2) return _startDateStep();
    if (step === 3) return _optionGrid(DIFFICULTIES, 'difficulty');
    if (step === 4) return _optionGrid(BUILDS, 'build');
    return _summaryStep();
  }

  function _startDateStep() {
    var duration = _findByValue(DURATIONS, _wizard.values.durationType);
    var range = _wizardPeriodRange(_wizard.values);
    return '' +
      '<div class="seasons-date-card">' +
        '<div class="seasons-date-mark">' + _icon('event') + '</div>' +
        '<label class="seasons-target-field"><span>Data de início da temporada</span><input id="seasons-start-date" type="date" min="' + _esc(_todayKey()) + '" value="' + _esc(_wizard.values.startDate || _todayKey()) + '" onchange="Modules.Temporadas._wizardSetStartDate(this.value)"></label>' +
      '</div>' +
      '<div class="seasons-inline-note seasons-inline-note-soft">' + _icon('event') + ' ' + _esc(range ? 'A temporada vai de ' + _formatDate(range.start) + ' até ' + _formatDate(range.end) + '.' : 'Escolha a duração para calcular a data final.') + '</div>' +
      (duration ? '<div class="seasons-inline-note">' + _icon('schedule') + ' Se a data for futura, a temporada ficará programada e só começará análises quando virar ativa.</div>' : '');
  }

  function _optionGrid(options, field) {
    return '<div class="seasons-option-grid">' + options.map(function (opt) {
      var active = _wizard.values[field] === opt.value;
      var meta = _wizardOptionMeta(field, opt.value);
      return '' +
        '<button class="seasons-choice-card ' + (active ? 'active ' : '') + '" type="button" onclick="Modules.Temporadas._wizardSelect(\'' + _esc(field) + '\',\'' + _esc(opt.value) + '\')">' +
          '<i>' + _icon(meta.icon) + '</i>' +
          '<strong>' + _esc(opt.label) + '</strong>' +
          '<span>' + _esc(opt.text) + '</span>' +
          '<small>' + _esc(meta.hint) + '</small>' +
        '</button>';
    }).join('') + '</div>';
  }

  function _wizardOptionMeta(field, value) {
    var map = {
      objective: {
        sell_more: { icon: 'trending_up', hint: 'Prioriza produto forte, canal, horário e movimento.' },
        increase_ticket: { icon: 'analytics', hint: 'Prioriza upsell, adicionais e pedido maior.' },
        retain_customers: { icon: 'verified', hint: 'Prioriza recompra, pontos e clientes conhecidos.' },
        improve_consistency: { icon: 'timeline', hint: 'Prioriza dias fracos, regularidade e ritmo.' }
      },
      durationType: {
        sprint: { icon: 'timer', hint: 'Melhor para testar uma ação rápida.' },
        season: { icon: 'event_upcoming', hint: 'Melhor para acompanhar mudança com mais calma.' }
      },
      difficulty: {
        safe: { icon: 'schedule', hint: 'Uma ação principal, menos pressão.' },
        balanced: { icon: 'speed', hint: 'Duas ações diferentes, ritmo constante.' },
        aggressive: { icon: 'track_changes', hint: 'Até três ações, execução mais intensa.' }
      },
      build: {
        volume: { icon: 'trending_up', hint: 'Procura mais pedidos e mais movimento.' },
        margin: { icon: 'analytics', hint: 'Procura vender melhor, com mais sobra.' },
        retention: { icon: 'verified', hint: 'Procura trazer clientes de volta.' }
      }
    };
    return map[field] && map[field][value] || { icon: 'track_changes', hint: 'Ajuda o BocaFood a escolher melhores ações.' };
  }

  function _summaryStep() {
    var values = _wizard.values;
    var duration = _findByValue(DURATIONS, values.durationType);
    var baseline = _wizard.baseline;
    var plan = baseline && baseline.planConnection ? baseline.planConnection : null;
    var routeRows = _summaryRouteRows(plan, _wizard.baselineLoading);
    return '' +
      '<div class="seasons-summary-hero">' +
        '<div>' +
          '<small>Temporada pronta para nascer</small>' +
          '<h3>' + _esc(_objectiveLabel(values.objective)) + '</h3>' +
          '<p>' + _esc(_buildLabel(values.build)) + ' · ' + _esc(_difficultyLabel(values.difficulty)) + ' · ' + _esc(duration ? duration.text : 'período definido') + '</p>' +
        '</div>' +
        '<strong>' + _esc(plan ? _fmtMoney(plan.gapAtStart || plan.routeTarget || 0) : 'Rota') + '</strong>' +
      '</div>' +
      '<div class="seasons-summary-list">' +
        _summaryRow('Objetivo', _objectiveLabel(values.objective)) +
        _summaryRow('Duração', duration ? duration.label + ' · ' + duration.text : 'Não definido') +
        _summaryRow('Início', values.startDate ? _formatDate(_parseDateInput(values.startDate)) : 'Hoje') +
        _summaryRow('Fim previsto', _wizardPeriodRange(values) ? _formatDate(_wizardPeriodRange(values).end) : 'Não calculado') +
        _summaryRow('Status inicial', _isFutureStart(values.startDate) ? 'Programada' : 'Ativa') +
        routeRows +
        _summaryRow('Dificuldade', _difficultyLabel(values.difficulty)) +
        _summaryRow('Prioridade', _buildLabel(values.build)) +
        _summaryRow('Base de comparação', _summaryBaselineLabel(baseline, values.objective, _wizard.baselineLoading)) +
        _summaryRow('Meta da temporada', baseline ? _formatBaselineValue(baseline.calculatedTargetValue, values.objective) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculada')) +
        _summaryRow('Chance de falha inicial', baseline ? _riskLabel(baseline.initialRiskLevel) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculado')) +
        _summaryRow('Confiabilidade', baseline ? _confidenceLabel(baseline.baselineConfidence) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculada')) +
      '</div>' +
      _creationAlertsHtml(_creationAlerts(values, baseline)) +
      '<div class="seasons-lock-note">' + _icon('lock') + ' Depois de iniciada, a temporada não poderá ser editada.</div>';
  }

  function _summaryRow(label, value) {
    return '<div class="seasons-summary-row"><span>' + _esc(label) + '</span><strong>' + _esc(value) + '</strong></div>';
  }

  function _summaryRouteRows(plan, loading) {
    if (!plan) {
      return _summaryRow('Base da temporada', loading ? 'Buscando rota...' : 'Plano de Voo não encontrado') +
        _summaryRow('Período da rota', loading ? 'Buscando...' : 'Não calculado') +
        _summaryRow('Meta da rota', loading ? 'Calculando...' : 'Não calculada') +
        _summaryRow('Falta cumprir', loading ? 'Calculando...' : 'Não calculado');
    }
    var current = _number(plan.currentValueAtStart, 0);
    var rows = [
      _summaryRow('Base da temporada', plan.flightPlanName || 'Rota do Plano de Voo'),
      _summaryRow('Período da rota', _formatPeriod(plan.periodStart, plan.periodEnd)),
      _summaryRow('Meta da rota', _fmtMoney(plan.routeTarget))
    ];
    if (current > 0 || plan.hasCurrentValueAtStart === true) {
      rows.push(_summaryRow('Vendido até agora', _fmtMoney(current)));
    }
    rows.push(_summaryRow('Falta cumprir', _fmtMoney(plan.gapAtStart)));
    return rows.join('');
  }

  function _summaryBaselineLabel(baseline, objective, loading) {
    if (loading) return 'Calculando...';
    if (!baseline) return 'Não calculada';
    var value = _number(baseline.baselineValue, 0);
    if (value > 0) return _formatBaselineValue(value, objective);
    if (baseline.baselineConfidence === 'low') return 'Poucos pedidos no histórico';
    return 'Ainda sem histórico suficiente';
  }

  function _creationAlerts(values, baseline) {
    var alerts = [];
    if (!baseline) return alerts;
    var growth = _targetGrowthPercent(baseline.baselineValue, baseline.calculatedTargetValue);

    if (growth !== null && growth >= 60) {
      alerts.push('Essa meta exige crescimento de ' + Math.round(growth) + '% sobre seu histórico recente.');
    }
    if (values.difficulty === 'aggressive' && baseline.baselineConfidence === 'low') {
      alerts.push('Você escolheu dificuldade agressiva, mas ainda há poucos dados para uma previsão confiável.');
    }
    if (_isBuildMisaligned(values.objective, values.build)) {
      alerts.push(_buildMisalignmentMessage(values.objective, values.build));
    }
    if (baseline.baselineConfidence === 'low') {
      alerts.push(_isFutureStart(values.startDate)
        ? 'A temporada ainda não começou. Há poucos pedidos no histórico usado como base, então a previsão inicial pode ficar menos precisa.'
        : 'Há poucos pedidos no período usado como base. A rota continua valendo, mas a leitura inicial pode ficar menos precisa.');
    }
    if (values.durationType === 'sprint' && growth !== null && growth >= 35) {
      alerts.push('Para 30 dias, essa meta exige um ritmo alto desde a primeira semana.');
    }
    if (_periodOverlapsExisting(values)) {
      alerts.push('Já existe uma temporada programada ou ativa nesse período. Escolha outra data.');
    }
    return alerts;
  }

  function _creationAlertsHtml(alerts) {
    if (!alerts || !alerts.length) return '';
    return '<div class="seasons-creation-alerts"><span class="seasons-section-label">Alertas da configuração</span>' + alerts.map(function (message) {
      return '<div>' + _icon('warning') + '<p>' + _esc(message) + '</p></div>';
    }).join('') + '</div>';
  }

  function _targetGrowthPercent(base, target) {
    base = _number(base, 0);
    target = _number(target, 0);
    if (base <= 0 || target <= 0) return null;
    return ((target - base) / base) * 100;
  }

  function _isBuildMisaligned(objective, build) {
    return (objective === 'increase_ticket' && build === 'volume') ||
      (objective === 'sell_more' && build === 'margin') ||
      (objective === 'retain_customers' && build === 'volume') ||
      (objective === 'improve_consistency' && build === 'margin');
  }

  function _buildMisalignmentMessage(objective, build) {
    if (objective === 'increase_ticket' && build === 'volume') return 'Mais movimento pode ajudar, mas para aumentar ticket o BocaFood também vai observar adicionais, combos e upsell quando eles aparecerem mais fortes.';
    if (objective === 'sell_more' && build === 'margin') return 'Melhor sobra pode orientar a primeira leitura, mas se produto, canal ou horário mostrarem venda mais forte, eles ainda podem virar jogada.';
    if (objective === 'retain_customers' && build === 'volume') return 'Mais movimento pode entrar como ponto de partida, mas para fidelizar o BocaFood também vai dar atenção a recompra, pontos e clientes conhecidos.';
    if (objective === 'improve_consistency' && build === 'margin') return 'Melhor sobra pode orientar a primeira leitura, mas para consistência o BocaFood ainda vai olhar dias fracos, horários e canais que ajudam a distribuir vendas.';
    return 'Essa prioridade orienta o começo da leitura, mas não impede outras jogadas quando os dados mostrarem oportunidade melhor.';
  }

  function _wizardSelect(field, value) {
    if (!_wizard || _wizard.saving) return;
    _wizard.values[field] = value;
    _wizard.error = '';
    _renderWizard();
  }

  function _wizardSetStartDate(value) {
    if (!_wizard || _wizard.saving) return;
    _wizard.values.startDate = value || _todayKey();
    _wizard.baseline = null;
    _wizard.error = '';
    _renderWizard();
  }

  function _wizardBack() {
    if (!_wizard || _wizard.saving) return;
    _wizard.step = Math.max(0, _wizard.step - 1);
    _wizard.error = '';
    _renderWizard();
  }

  function _wizardNext() {
    if (!_wizard || _wizard.saving) return;
    var error = _validateWizardStep(_wizard.step);
    if (error) {
      _wizard.error = error;
      _renderWizard();
      return;
    }
    if (_wizard.step < 4) {
      _wizard.step += 1;
      _wizard.error = '';
      _renderWizard();
      return;
    }
    if (_wizard.step === 4) {
      _wizard.step = 5;
      _wizard.error = '';
      _renderWizard();
      _prepareBaselineSummary();
      return;
    }
    _startSeasonFromWizard();
  }

  function _validateWizardStep(step) {
    var values = _wizard.values;
    if (step === 0 && !values.objective) return 'Escolha um objetivo.';
    if (step === 1 && !values.durationType) return 'Escolha uma duração.';
    if (step === 2) {
      if (!values.startDate) return 'Escolha a data de início.';
      if (_parseDateInput(values.startDate) < _dayStart(new Date())) return 'A data de início não pode ser no passado.';
    }
    if (step === 3 && !values.difficulty) return 'Escolha uma dificuldade.';
    if (step === 4 && !values.build) return 'Escolha uma prioridade para a temporada.';
    if (step === 5) {
      var required = [0, 1, 2, 3, 4].map(_validateWizardStep).filter(Boolean);
      if (required.length) return required[0];
      if (_periodOverlapsExisting(values)) return 'Já existe uma temporada programada ou ativa nesse período. Escolha outra data.';
    }
    return '';
  }

  function _startSeasonFromWizard() {
    if (_wizard.baselineLoading) {
      _wizard.error = 'Aguarde enquanto buscamos a rota do Plano de Voo.';
      _renderWizard();
      return;
    }
    if (!_wizard.baseline) {
      _wizard.error = 'Não encontramos uma rota válida no Plano de Voo para criar esta Temporada.';
      _renderWizard();
      return;
    }
    _wizard.saving = true;
    _wizard.error = '';
    _renderWizard();

    var overlap = _periodOverlapsExisting(_wizard.values);
    if (overlap) {
      _wizard.saving = false;
      _wizard.error = 'Já existe uma temporada programada ou ativa nesse período. Escolha outra data.';
      _renderWizard();
      return;
    }

    var payload = _buildSeasonPayload(_wizard.values);
    createSeason(payload).then(function () {
      closeCreateFlow();
      _toast(payload.status === 'scheduled' ? 'Temporada programada.' : 'Temporada iniciada.', 'success');
    }).catch(function (err) {
      _wizard.saving = false;
      _wizard.error = (err && err.message) || 'Erro ao iniciar temporada.';
      _renderWizard();
    });
  }

  function _buildSeasonPayload(values) {
    var duration = _findByValue(DURATIONS, values.durationType);
    var now = new Date();
    var range = _wizardPeriodRange(values);
    var start = range ? range.start : _dayStart(now);
    var end = range ? range.end : new Date(start.getTime() + (((duration && duration.days) || 30) * 86400000));
    var status = _isFutureStart(values.startDate) ? 'scheduled' : 'active';
    var objective = _findByValue(OBJECTIVES, values.objective);
    var baseline = _wizard && _wizard.baseline ? _wizard.baseline : {};
    return {
      tenantId: _tenantId,
      title: _objectiveLabel(values.objective) + ' · ' + ((duration && duration.text) || '30 dias'),
      objective: values.objective,
      build: values.build,
      difficulty: values.difficulty,
      durationType: values.durationType,
      targetMode: 'flight_plan',
      targetValue: null,
      targetMetric: objective ? objective.metric : '',
      planConnection: baseline.planConnection || null,
      baselinePeriod: baseline.baselinePeriod || '',
      baselineValue: _nullableNumber(baseline.baselineValue),
      baselineRevenue: _number(baseline.baselineRevenue, 0),
      baselineOrders: _number(baseline.baselineOrders, 0),
      baselineAverageTicket: _number(baseline.baselineAverageTicket, 0),
      baselineActiveDays: _number(baseline.baselineActiveDays, 0),
      baselineRecurringCustomers: _number(baseline.baselineRecurringCustomers, 0),
      baselineRepurchaseRate: _number(baseline.baselineRepurchaseRate, 0),
      baselineConfidence: baseline.baselineConfidence || 'low',
      calculatedTargetValue: _nullableNumber(baseline.calculatedTargetValue),
      initialRiskLevel: baseline.initialRiskLevel || 'unknown',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: status,
      currentScore: 0,
      currentStatus: 'pending',
      riskLevel: baseline.initialRiskLevel || 'unknown',
      progressPercent: 0,
      actionTasks: [],
      goalReachedAt: null,
      goalCelebrationShownAt: null,
      goalCelebrationPending: false,
      goalReachedSnapshotId: '',
      startedAt: status === 'active' ? now.toISOString() : null,
      finishedAt: null,
      abandonedAt: null
    };
  }

  function _findByValue(list, value) {
    return (list || []).filter(function (item) { return item.value === value; })[0] || null;
  }

  function _wizardPeriodRange(values) {
    var duration = _findByValue(DURATIONS, values.durationType);
    var start = _parseDateInput(values.startDate || _todayKey());
    if (!duration || !start) return null;
    var end = new Date(start.getTime());
    end.setDate(end.getDate() + duration.days - 1);
    end.setHours(23, 59, 59, 999);
    return { start: start, end: end };
  }

  function _periodOverlapsExisting(values) {
    var range = _wizardPeriodRange(values);
    if (!range) return false;
    return (_state.seasons || []).some(function (season) {
      if (!season || (season.status !== 'active' && season.status !== 'scheduled')) return false;
      var start = _toDate(season.startDate || season.startedAt || season.createdAt);
      var end = _toDate(season.endDate);
      if (!start || !end) return false;
      return _periodsOverlap(range.start, range.end, start, end);
    });
  }

  function _periodsOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart <= bEnd && bStart <= aEnd;
  }

  function _isFutureStart(value) {
    var start = _parseDateInput(value || _todayKey());
    return start > _dayStart(new Date());
  }

  function _parseDateInput(value) {
    var raw = String(value || '').trim();
    if (!raw) return _dayStart(new Date());
    var parts = raw.split('-');
    if (parts.length === 3) {
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return isNaN(d.getTime()) ? _dayStart(new Date()) : d;
    }
    return _dayStart(_toDate(raw) || new Date());
  }

  function _prepareBaselineSummary() {
    if (!_wizard || _wizard.baselineLoading) return;
    _wizard.baselineLoading = true;
    _wizard.baseline = null;
    _wizard.error = '';
    _renderWizard();

    _calculateBaseline(_wizard.values).then(function (baseline) {
      if (!_wizard) return;
      _wizard.baseline = baseline;
      _wizard.baselineLoading = false;
      _renderWizard();
    }).catch(function (err) {
      if (!_wizard) return;
      console.error('Temporadas baseline error', err);
      _wizard.baselineLoading = false;
      _wizard.error = (err && err.message) || 'Não conseguimos preparar esta Temporada agora. Confira se já existe uma rota no Plano de Voo.';
      _renderWizard();
    });
  }

  function _calculateBaseline(values) {
    if (!window.DB || typeof DB.getAll !== 'function') return Promise.reject(new Error('DB indisponível.'));
    var range = _wizardPeriodRange(values);
    var monthKey = _seasonMonthKeyFromDate((range && range.start) || values.startDate || new Date());
    var monthScenarioPromise = DB.getDoc
      ? DB.getDoc('flight_plan_month_scenarios', monthKey).catch(function () { return null; })
      : Promise.resolve(null);

    return Promise.all([
      DB.getAll('orders').catch(function () { return []; }),
      DB.getAll('flight_plans').catch(function () { return []; }),
      monthScenarioPromise
    ]).then(function (result) {
      var orders = result[0] || [];
      var flightPlans = result[1] || [];
      var monthScenario = result[2] || null;
      var plan = _resolveFlightPlanForSeason(monthKey, monthScenario, flightPlans);
      if (!plan) {
        throw new Error('Crie uma rota no Plano de Voo antes de criar uma Temporada.');
      }

      var summary = _flightPlanSummary(plan, monthScenario);
      var routeTarget = _seasonRouteRevenueTarget(plan, monthScenario, range);
      if (routeTarget <= 0) {
        throw new Error('A rota do Plano de Voo ainda não tem venda prevista para esse período.');
      }

      var duration = _findByValue(DURATIONS, values.durationType) || DURATIONS[0];
      var durationDays = (duration && duration.days) || 30;
      var now = new Date();
      var validOrders = _creationBaselineOrders(orders, range, now, durationDays);
      var baseline = _buildBaselineMetrics(validOrders, durationDays);
      var baseValue = _baselineValueForObjective(baseline, values.objective);
      var currentRevenue = range && now >= range.start ? _number(_buildBaselineMetrics(_ordersInPeriod(orders, range.start, now < range.end ? now : range.end), durationDays).baselineRevenue, 0) : 0;
      var gap = Math.max(0, routeTarget - currentRevenue);
      var calculatedTarget = _targetFromFlightPlan(values.objective, routeTarget, gap, summary, baseline, range);
      var risk = _flightPlanTargetRisk(values.difficulty, calculatedTarget, baseValue, baseline.baselineConfidence);
      var monthData = monthScenario || {};
      var planConnection = {
        source: 'flight_plan',
        flightPlanId: plan.id || monthData.snapshotId || '',
        flightPlanName: plan.name || monthData.snapshotName || 'Rota do Plano de Voo',
        monthScenarioId: monthData.id || monthData.monthKey || monthKey,
        monthKey: monthKey,
        scenario: plan.scenario || monthData.scenario || '',
        periodStart: range ? range.start.toISOString() : (plan.periodStart || ''),
        periodEnd: range ? range.end.toISOString() : (plan.periodEnd || ''),
        routePeriodStart: plan.periodStart || '',
        routePeriodEnd: plan.periodEnd || '',
        routeTarget: routeTarget,
        currentValueAtStart: currentRevenue,
        hasCurrentValueAtStart: currentRevenue > 0,
        gapAtStart: gap,
        suggestedTargetValue: calculatedTarget,
        targetMetric: (_findByValue(OBJECTIVES, values.objective) || {}).metric || 'revenue'
      };

      return Object.assign({}, baseline, {
        baselinePeriod: 'flight_plan:' + monthKey,
        baselineValue: baseValue,
        calculatedTargetValue: calculatedTarget,
        initialRiskLevel: risk,
        planConnection: planConnection
      });
    });
  }

  function _creationBaselineOrders(orders, range, now, durationDays) {
    if (!range) return [];
    now = now || new Date();
    durationDays = Math.max(1, _number(durationDays, 30));
    if (now < range.start) {
      var historyEnd = new Date(range.start.getTime() - 1);
      var historyStart = new Date(range.start.getTime());
      historyStart.setDate(historyStart.getDate() - durationDays);
      historyStart.setHours(0, 0, 0, 0);
      return _ordersInPeriod(orders, historyStart, historyEnd);
    }
    return _ordersInPeriod(orders, range.start, now < range.end ? now : range.end);
  }

  function _seasonMonthKeyFromDate(value) {
    var d = _toDate(value) || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function _resolveFlightPlanForSeason(monthKey, monthScenario, flightPlans) {
    var plans = Array.isArray(flightPlans) ? flightPlans : [];
    var snapId = String((monthScenario && monthScenario.snapshotId) || '').trim();
    if (snapId) {
      var byId = plans.filter(function (plan) { return String(plan.id || '') === snapId; })[0];
      if (byId && !_isDraftFlightPlan(byId) && (String(byId.targetMonthKey || '') === String(monthKey || '') || !byId.targetMonthKey || _flightPlanMatchesMonth(byId, monthKey))) return byId;
      return null;
    }
    var byMonth = plans.filter(function (plan) {
      return _isUsableFlightPlanForMonth(plan, monthKey);
    }).sort(function (a, b) {
      return _dateValue(b.updatedAt || b.createdAt) - _dateValue(a.updatedAt || a.createdAt);
    })[0];
    if (byMonth) return byMonth;
    if (monthScenario && monthScenario.summary && Object.keys(monthScenario.summary).length && String(monthScenario.monthKey || monthKey || '') === String(monthKey || '')) return monthScenario;
    return null;
  }

  function _flightPlanSummary(plan, monthScenario) {
    var planSummary = (plan && plan.summary) || {};
    var monthSummary = (monthScenario && monthScenario.summary) || {};
    return Object.keys(monthSummary).length ? Object.assign({}, planSummary, monthSummary) : planSummary;
  }

  function _seasonRouteRevenueTarget(plan, monthScenario, range) {
    var summary = _flightPlanSummary(plan, monthScenario);
    var total = _number(summary.revenue != null ? summary.revenue : summary.forecastRevenue, 0);
    if (!range) return total;
    var series = Array.isArray(plan && plan.monthSeries) ? plan.monthSeries : [];
    if (!series.length) return total;
    var seriesTotal = series.reduce(function (sum, row) {
      var monthIndex = _number(row.monthIndex, -1);
      if (monthIndex < 0) return sum;
      var share = _monthShareInRange(range.start, range.end, monthIndex, plan);
      return share > 0 ? sum + (_number(row.revenue, 0) * share) : sum;
    }, 0);
    return seriesTotal > 0 ? seriesTotal : total;
  }

  function _monthShareInRange(start, end, monthIndex, plan) {
    if (!start || !end || monthIndex < 0) return 0;
    var year = start.getFullYear();
    if (monthIndex < start.getMonth() && end.getFullYear() > start.getFullYear()) year = end.getFullYear();
    var monthStart = new Date(year, monthIndex, 1);
    var monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    var overlapStart = start > monthStart ? start : monthStart;
    var overlapEnd = end < monthEnd ? end : monthEnd;
    if (overlapEnd < overlapStart) return 0;
    var monthWorkDays = _countPlanWorkDays(monthStart, monthEnd, plan);
    var overlapWorkDays = _countPlanWorkDays(overlapStart, overlapEnd, plan);
    if (monthWorkDays > 0) return _clamp(overlapWorkDays / monthWorkDays, 0, 1);
    var monthDays = monthEnd.getDate();
    var overlapDays = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
    return _clamp(overlapDays / monthDays, 0, 1);
  }

  function _countPlanWorkDays(start, end, plan) {
    if (!start || !end || end < start) return 0;
    var workDays = Array.isArray(plan && plan.workDays) && plan.workDays.length ? plan.workDays.map(function (day) { return _number(day, -1); }) : [0, 1, 2, 3, 4, 5, 6];
    var closed = _plannedClosedDayMap(plan && plan.plannedClosedDays, start.getFullYear());
    if (end.getFullYear() !== start.getFullYear()) {
      var nextClosed = _plannedClosedDayMap(plan && plan.plannedClosedDays, end.getFullYear());
      Object.keys(nextClosed).forEach(function (key) { closed[key] = true; });
    }
    var count = 0;
    var cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var limit = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= limit) {
      if (workDays.indexOf(cursor.getDay()) >= 0 && !closed[_localDateKey(cursor)]) count += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }

  function _plannedClosedDayMap(text, year) {
    var map = {};
    text = String(text || '');
    if (!text) return map;
    var re = /(\d{1,2})\/(\d{1,2})(?:\s*(?:a|até|ate|-)\s*(\d{1,2})\/(\d{1,2}))?/gi;
    var match;
    while ((match = re.exec(text))) {
      var start = new Date(year, parseInt(match[2], 10) - 1, parseInt(match[1], 10));
      var end = match[3] && match[4] ? new Date(year, parseInt(match[4], 10) - 1, parseInt(match[3], 10)) : start;
      if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) continue;
      if (end < start) end = start;
      var cursor = new Date(start);
      while (cursor <= end) {
        map[_localDateKey(cursor)] = true;
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }

  function _localDateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function _monthIndexesInRange(start, end) {
    var months = [];
    var cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    var limit = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= limit) {
      months.push(cursor.getMonth());
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }

  function _targetFromFlightPlan(objective, routeTarget, gap, summary, baseline, range) {
    if (objective === 'sell_more') return Math.max(1, routeTarget || gap);
    if (objective === 'increase_ticket') {
      return _number(summary.averageTicket, 0) || _number(baseline.baselineAverageTicket, 0) || 1;
    }
    if (objective === 'retain_customers') {
      var ticket = _number(summary.averageTicket, 0) || _number(baseline.baselineAverageTicket, 0);
      var estimatedOrders = ticket > 0 ? routeTarget / ticket : _number(summary.ordersPerDay, 0) * _number(summary.workingDays, 0);
      return Math.max(1, Math.ceil(estimatedOrders * 0.2));
    }
    if (objective === 'improve_consistency') {
      var workingDays = _number(summary.workingDays, 0);
      if (workingDays > 0) return Math.ceil(workingDays);
      if (range) return Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / 86400000) + 1);
      return 1;
    }
    return Math.max(1, routeTarget || gap);
  }

  function _flightPlanTargetRisk(difficulty, target, base, confidence) {
    if (confidence === 'low') return difficulty === 'aggressive' ? 'medium' : 'low';
    var growth = _targetGrowthPercent(base, target);
    if (growth === null) return difficulty === 'aggressive' ? 'medium' : 'low';
    var add = difficulty === 'aggressive' ? 15 : (difficulty === 'balanced' ? 5 : 0);
    growth += add;
    if (growth <= 20) return 'low';
    if (growth <= 45) return 'medium';
    if (growth <= 75) return 'high';
    return 'very_high';
  }

  function _ordersInPeriod(orders, start, end) {
    return (orders || []).filter(function (order) {
      var normalized = _normalizeSeasonOrder(order);
      if (!normalized || _isCanceledOrder(normalized)) return false;
      var date = normalized.createdAt;
      if (!date) return false;
      return date >= start && date <= end;
    });
  }

  function _normalizeSeasonOrder(order) {
    if (!order) return null;
    var items = _normalizeOrderItems(order.items || order.itens || order.products || order.cartItems || []);
    return {
      id: order.id || order.orderId || order.uid || '',
      status: _normalizeOrderStatus(order.status || order.state || order.orderStatus || order.kitchenStatus || ''),
      createdAt: _normalizeOrderDate(order),
      total: _getOrderTotal(order),
      channel: _normalizeChannel(order.channel || order.source || order.origin || order.salesChannel || order.canal || ''),
      customerKey: _getOrderCustomerKey(order),
      items: items,
      couponCode: _getCouponCode(order),
      couponDiscount: _getNumber(order.couponDiscount || order.couponDiscountTotal || order.discountCouponTotal || order.couponValue || 0),
      promotionName: _getPromotionName(order),
      promotionDiscount: _getNumber(order.promotionDiscount || order.promotionDiscountTotal || order.promoDiscount || order.promoDiscountTotal || 0),
      upsellAccepted: _hasAcceptedUpsell(order, items),
      upsellDiscount: _getNumber(order.upsellDiscount || order.upsellDiscountTotal || 0),
      upsellAddedRevenue: _getUpsellAddedRevenue(order, items),
      pointsRedemption: _getNumber(order.pointsRedemption || order.pointsUsed || order.loyaltyPointsUsed || 0),
      pointsDiscount: _getNumber(order.pointsDiscountTotal || order.pointsDiscount || order.loyaltyDiscount || 0),
      raw: order
    };
  }

  function _normalizeOrderStatus(value) {
    var raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'unknown';
    var compact = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
    compact = compact.replace(/\s+/g, '_');
    if (['cancelado', 'cancelada', 'canceled', 'cancelled', 'cancel', 'reembolsado', 'refunded', 'estornado'].indexOf(compact) >= 0) return 'canceled';
    if (['entregue', 'entregado', 'delivered', 'concluido', 'concluida', 'completed', 'finalizado', 'finalizada'].indexOf(compact) >= 0) return 'delivered';
    if (['pago', 'paid'].indexOf(compact) >= 0) return 'paid';
    if (['preparando', 'em_preparo', 'in_progress', 'preparing'].indexOf(compact) >= 0) return 'preparing';
    if (['pendente', 'pending', 'novo', 'new'].indexOf(compact) >= 0) return 'pending';
    return compact;
  }

  function _normalizeOrderDate(order) {
    var raw = order && (
      order.analyticsDate ||
      order.orderAnalyticsDate ||
      order.canonicalDate ||
      order.createdAt ||
      order.registeredAt ||
      order.orderCreatedAt ||
      order.orderDate ||
      order.date ||
      order.data ||
      order.paidAt ||
      order.paymentDate ||
      order.deliveryDate ||
      order.scheduleDate ||
      order.updatedAt
    );
    return _toDate(raw);
  }

  function _getOrderTotal(order) {
    return _getNumber(order && (order.total || order.grandTotal || order.finalTotal || order.totalFinal || order.amount || order.value || order.valor || order.subtotalFinal || order.subtotal || 0));
  }

  function _normalizeChannel(value) {
    var raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'desconhecido';
    var compact = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
    compact = compact.replace(/[\s-]+/g, '_');
    if (['template', 'store', 'loja', 'loja_publica', 'public_store', 'cardapio', 'cardapio_publico'].indexOf(compact) >= 0) return 'cardapio';
    if (['pos', 'tpv', 'venda_presencial', 'balcao', 'balcão'].indexOf(compact) >= 0) return 'venda_presencial';
    if (['manual', 'admin', 'pedido_manual', 'painel'].indexOf(compact) >= 0) return 'pedido_manual';
    if (['whatsapp', 'wpp'].indexOf(compact) >= 0) return 'whatsapp';
    return compact;
  }

  function _getOrderCustomerKey(order) {
    var id = String((order && (order.customerId || order.clientId || order.clienteId || order.userId)) || '').trim();
    if (id) return 'id:' + id;
    var phone = _normalizePhone(order && (order.customerPhone || order.phone || order.whatsapp || order.customerWhatsapp || order.telefone || ''));
    if (phone) return 'phone:' + phone;
    var email = String((order && (order.customerEmail || order.email || order.mail)) || '').trim().toLowerCase();
    return email ? 'email:' + email : '';
  }

  function _normalizeOrderItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map(function (item) {
      item = item || {};
      var quantity = Math.max(1, _getNumber(item.qty || item.quantity || item.qtd || item.quantidade || item.amount || 1));
      var unitPrice = _getNumber(item.unitPrice || item.price || item.preco || item.valorUnitario || 0);
      var total = _getNumber(item.total || item.lineTotal || item.priceTotal || item.subtotal || item.valorTotal || 0);
      if (!total && unitPrice) total = unitPrice * quantity;
      return {
        id: item.id || item.productId || item.produtoId || item.itemId || '',
        productId: item.productId || item.produtoId || item.id || '',
        name: String(item.name || item.productName || item.nome || item.title || 'Produto sem nome').slice(0, 90),
        quantity: quantity,
        unitPrice: unitPrice,
        total: total,
        isUpsell: !!(item.isUpsell || item.upsell || item.upsellRuleId || item.source === 'upsell'),
        couponCode: _getCouponCode(item),
        promotionName: _getPromotionName(item),
        promotionDiscount: _getNumber(item.promotionDiscount || item.promotionDiscountTotal || item.promoDiscount || item.discount || 0),
        upsellDiscount: _getNumber(item.upsellDiscount || item.upsellDiscountTotal || 0),
        choices: Array.isArray(item.choices) ? item.choices : [],
        choiceDetails: Array.isArray(item.choiceDetails) ? item.choiceDetails : [],
        menuChoices: Array.isArray(item.menuChoices) ? item.menuChoices : [],
        selectedOptions: Array.isArray(item.selectedOptions) ? item.selectedOptions : [],
        variants: Array.isArray(item.variants) ? item.variants : []
      };
    }).filter(function (item) { return item.name; });
  }

  function _getCouponCode(order) {
    if (!order) return '';
    var coupon = order.coupon || order.cupom || order.appliedCoupon || null;
    if (typeof coupon === 'string') return coupon.trim();
    if (coupon && typeof coupon === 'object') return String(coupon.code || coupon.codigo || coupon.id || '').trim();
    return String(order.couponCode || order.cupomCodigo || order.discountCode || '').trim();
  }

  function _getPromotionName(order) {
    if (!order) return '';
    var promo = order.promotion || order.promo || order.appliedPromotion || order.promocao || null;
    if (typeof promo === 'string') return promo.trim();
    if (promo && typeof promo === 'object') {
      return String(promo.name || promo.title || promo.nome || promo.label || promo.code || promo.id || '').trim();
    }
    return String(order.promotionName || order.promoName || order.promotionTitle || order.promoTitle || order.promocaoNome || order.promoCode || order.promotionCode || '').trim();
  }

  function _hasAcceptedUpsell(order, items) {
    if (!order) return false;
    if (order.upsellAccepted === true || order.acceptedUpsell === true || order.upsellApplied === true) return true;
    if (Array.isArray(order.upsellIds) && order.upsellIds.length) return true;
    if (Array.isArray(order.acceptedUpsells) && order.acceptedUpsells.length) return true;
    return (items || []).some(function (item) { return !!item.isUpsell; });
  }

  function _getUpsellAddedRevenue(order, items) {
    var direct = _getNumber(order && (order.upsellAddedRevenue || order.upsellRevenue || order.upsellTotal || 0));
    if (direct) return direct;
    return (items || []).reduce(function (sum, item) {
      return sum + (item.isUpsell ? _getNumber(item.total) : 0);
    }, 0);
  }

  function _getNumber(value) {
    return _money(value);
  }

  function _isValidSeasonOrder(order) {
    var normalized = order && order.raw ? order : _normalizeSeasonOrder(order);
    if (!normalized) return false;
    if (normalized.status === 'canceled') return false;
    if (!normalized.createdAt) return false;
    return normalized.total >= 0;
  }

  function _calculateValidatedImpactSignals(orders, season, baseline, actionContext) {
    var validOrders = (orders || []).map(_normalizeSeasonOrder).filter(_isValidSeasonOrder);
    return {
      coupons: _calculateCouponImpact(validOrders, season, baseline),
      promotions: _calculatePromotionImpact(validOrders, season, baseline),
      upsell: _calculateUpsellImpact(validOrders, season, baseline),
      points: _calculatePointsImpact(validOrders, season, baseline),
      channels: _calculateChannelImpact(validOrders, season, baseline, actionContext),
      products: _calculateProductImpact(validOrders, season, baseline, actionContext)
    };
  }

  function _calculateCouponImpact(validOrders, season, baseline) {
    var used = (validOrders || []).filter(function (order) {
      return !!order.couponCode || _number(order.couponDiscount, 0) > 0;
    });
    var revenue = _sumOrderRevenue(used);
    var discountTotal = used.reduce(function (sum, order) {
      return sum + _number(order.couponDiscount, 0);
    }, 0);
    return {
      usedOrders: used.length,
      revenue: revenue,
      discountTotal: discountTotal,
      impactScore: _validatedImpactScore(used.length, revenue, baseline, discountTotal)
    };
  }

  function _calculatePromotionImpact(validOrders, season, baseline) {
    var used = (validOrders || []).filter(function (order) {
      return _number(order.promotionDiscount, 0) > 0 || (order.items || []).some(function (item) {
        return _number(item.promotionDiscount, 0) > 0;
      });
    });
    var revenue = _sumOrderRevenue(used);
    var promotionMap = {};
    var discountTotal = used.reduce(function (sum, order) {
      var orderName = String(order.promotionName || '').trim();
      if (orderName) {
        if (!promotionMap[orderName]) promotionMap[orderName] = { name: orderName, usedOrders: 0, discountTotal: 0, revenue: 0 };
        promotionMap[orderName].usedOrders += 1;
        promotionMap[orderName].discountTotal += _number(order.promotionDiscount, 0);
        promotionMap[orderName].revenue += _number(order.total, 0);
      }
      var itemDiscount = (order.items || []).reduce(function (itemSum, item) {
        var itemName = String(item.promotionName || '').trim();
        if (itemName) {
          if (!promotionMap[itemName]) promotionMap[itemName] = { name: itemName, usedOrders: 0, discountTotal: 0, revenue: 0 };
          promotionMap[itemName].usedOrders += 1;
          promotionMap[itemName].discountTotal += _number(item.promotionDiscount, 0);
          promotionMap[itemName].revenue += _number(item.total, 0);
        }
        return itemSum + _number(item.promotionDiscount, 0);
      }, 0);
      return sum + _number(order.promotionDiscount, 0) + itemDiscount;
    }, 0);
    var topPromotion = Object.keys(promotionMap).map(function (key) {
      return promotionMap[key];
    }).sort(function (a, b) {
      return b.usedOrders - a.usedOrders || b.revenue - a.revenue || b.discountTotal - a.discountTotal;
    })[0] || null;
    return {
      usedOrders: used.length,
      revenue: revenue,
      discountTotal: discountTotal,
      topPromotion: topPromotion,
      impactScore: _validatedImpactScore(used.length, revenue, baseline, discountTotal)
    };
  }

  function _calculateUpsellImpact(validOrders, season, baseline) {
    var accepted = (validOrders || []).filter(function (order) {
      return _isCardapioChannel(order.channel) && (!!order.upsellAccepted || _number(order.upsellAddedRevenue, 0) > 0);
    });
    var addedRevenue = accepted.reduce(function (sum, order) {
      return sum + _number(order.upsellAddedRevenue, 0);
    }, 0);
    var discountTotal = accepted.reduce(function (sum, order) {
      return sum + _number(order.upsellDiscount, 0);
    }, 0);
    return {
      acceptedOrders: accepted.length,
      addedRevenue: addedRevenue,
      discountTotal: discountTotal,
      impactScore: _validatedImpactScore(accepted.length, addedRevenue, baseline, discountTotal)
    };
  }

  function _calculatePointsImpact(validOrders, season, baseline) {
    var redemption = (validOrders || []).filter(function (order) {
      return _number(order.pointsRedemption, 0) > 0 || _number(order.pointsDiscount, 0) > 0;
    });
    var customerCounts = {};
    (validOrders || []).forEach(function (order) {
      if (!order.customerKey) return;
      customerCounts[order.customerKey] = (customerCounts[order.customerKey] || 0) + 1;
    });
    var repeatMap = {};
    redemption.forEach(function (order) {
      if (order.customerKey && customerCounts[order.customerKey] >= 2) repeatMap[order.customerKey] = true;
    });
    var discountTotal = redemption.reduce(function (sum, order) {
      return sum + _number(order.pointsDiscount, 0);
    }, 0);
    return {
      redemptionOrders: redemption.length,
      repeatCustomers: Object.keys(repeatMap).length,
      discountTotal: discountTotal,
      impactScore: _validatedImpactScore(redemption.length, _sumOrderRevenue(redemption), baseline, discountTotal)
    };
  }

  function _calculateChannelImpact(validOrders, season, baseline, actionContext) {
    var map = {};
    var totalRevenue = (validOrders || []).reduce(function (sum, order) {
      return sum + _number(order.total, 0);
    }, 0);
    (validOrders || []).forEach(function (order) {
      var channel = order.channel || 'desconhecido';
      if (!map[channel]) map[channel] = { channel: channel, orders: 0, revenue: 0, couponDiscount: 0, promotionDiscount: 0, upsellDiscount: 0, impactScore: 0 };
      map[channel].orders += 1;
      map[channel].revenue += _number(order.total, 0);
      map[channel].couponDiscount += _number(order.couponDiscount, 0);
      map[channel].promotionDiscount += _number(order.promotionDiscount, 0);
      map[channel].upsellDiscount += _number(order.upsellDiscount, 0);
    });
    var channels = Object.keys(map).map(function (key) {
      var item = map[key];
      var config = _channelConfigFor(key, actionContext && actionContext.salesChannels || []);
      var channelCosts = _channelCostImpact(item, config);
      var discountTotal = _number(item.couponDiscount, 0) + _number(item.promotionDiscount, 0) + _number(item.upsellDiscount, 0);
      var netRevenue = Math.max(0, _number(item.revenue, 0) - channelCosts.totalFees - discountTotal);
      var globalSharePct = totalRevenue > 0 ? (_number(item.revenue, 0) / totalRevenue) * 100 : 0;
      item.name = config && config.name || _channelLabel(key);
      item.config = config || null;
      item.commissionPct = channelCosts.commissionPct;
      item.fixedFee = channelCosts.fixedFee;
      item.taxPct = channelCosts.taxPct;
      item.totalFees = channelCosts.totalFees;
      item.channelCostPct = channelCosts.channelCostPct;
      item.discountTotal = discountTotal;
      item.netRevenue = netRevenue;
      item.globalSharePct = globalSharePct;
      item.healthLabel = _channelHealthLabel(item);
      item.actionAdvice = _channelActionAdvice(item);
      item.impactScore = _validatedImpactScore(item.orders, netRevenue, baseline, discountTotal + channelCosts.totalFees);
      return item;
    }).sort(function (a, b) {
      return b.impactScore - a.impactScore || b.netRevenue - a.netRevenue || b.revenue - a.revenue;
    });
    var revenueChannels = channels.slice().sort(function (a, b) {
      return b.revenue - a.revenue || b.orders - a.orders;
    });
    return {
      topChannel: channels[0] || null,
      bestRevenueChannel: revenueChannels[0] || null,
      channels: channels.slice(0, 6)
    };
  }

  function _channelConfigFor(channel, salesChannels) {
    var key = _normalizeChannel(channel || '');
    var folded = _foldText(_channelLabel(key));
    return (salesChannels || []).filter(function (item) {
      return item && (item.key === key || _normalizeChannel(item.name || '') === key || _foldText(item.name || '') === folded);
    })[0] || null;
  }

  function _channelCostImpact(item, config) {
    config = config || {};
    var revenue = _number(item && item.revenue, 0);
    var orders = Math.max(0, Math.round(_number(item && item.orders, 0)));
    var commissionPct = _number(config.commissionPct, 0);
    var fixedFee = _money(config.fixedFee || 0);
    var taxPct = _number(config.taxPct, 0);
    var commission = revenue * commissionPct / 100;
    var commissionTax = commission > 0 ? commission * taxPct / 100 : 0;
    var fixed = orders * fixedFee;
    var totalFees = commission + commissionTax + fixed;
    return {
      commissionPct: commissionPct,
      fixedFee: fixedFee,
      taxPct: taxPct,
      totalFees: totalFees,
      channelCostPct: revenue > 0 ? (totalFees / revenue) * 100 : 0
    };
  }

  function _channelHealthLabel(item) {
    var costPct = _number(item && item.channelCostPct, 0);
    var discountPct = _number(item && item.discountTotal, 0) > 0 && _number(item && item.revenue, 0) > 0 ? (_number(item.discountTotal, 0) / _number(item.revenue, 0)) * 100 : 0;
    if (costPct >= 30 && discountPct >= 8) return 'vende, mas está pesado';
    if (costPct >= 30) return 'vende com taxa alta';
    if (costPct >= 18) return 'atenção na margem';
    return 'canal saudável';
  }

  function _channelActionAdvice(item) {
    var costPct = _number(item && item.channelCostPct, 0);
    var share = _number(item && item.globalSharePct, 0);
    var discountPct = _number(item && item.discountTotal, 0) > 0 && _number(item && item.revenue, 0) > 0 ? (_number(item.discountTotal, 0) / _number(item.revenue, 0)) * 100 : 0;
    var name = item && (item.name || _channelLabel(item.channel)) || 'canal';
    if (costPct >= 30 && discountPct >= 8) return name + ' vende bem, mas taxa e desconto juntos pesam. Antes de colocar mais promoção nele, reduza o desconto ou use produto com margem maior.';
    if (costPct >= 30 && share >= 25) return name + ' traz volume, mas cobra caro. Vale apostar com produto de boa margem e evitar promoção forte nesse canal.';
    if (costPct >= 30) return name + ' tem taxa alta. Use com cuidado e sem desconto adicional até a venda justificar.';
    if (share >= 25) return name + ' está trazendo parte importante das vendas. Pode receber destaque ou promoção leve se o produto tiver margem.';
    return name + ' pode ser testado com uma jogada pequena antes de aumentar esforço.';
  }

  function _calculateProductImpact(validOrders, season, baseline, actionContext) {
    var map = {};
    (validOrders || []).forEach(function (order) {
      (order.items || []).forEach(function (item) {
        var key = item.productId || item.id || item.name;
        if (!key) return;
        if (!map[key]) map[key] = { productId: item.productId || item.id || '', id: item.productId || item.id || '', name: item.name, quantity: 0, revenue: 0, impactScore: 0 };
        map[key].quantity += _number(item.quantity, 0);
        map[key].revenue += _number(item.total, 0);
      });
    });
    var products = Object.keys(map).map(function (key) {
      var item = map[key];
      item.impactScore = _validatedImpactScore(item.quantity, item.revenue, baseline, 0);
      return item;
    }).sort(function (a, b) {
      return b.revenue - a.revenue || b.quantity - a.quantity;
    });
    var lowSellingProducts = _calculateLowSellingProducts(products, actionContext && actionContext.products || [], validOrders);
    return {
      topProduct: products[0] || null,
      products: products.slice(0, 6),
      lowSellingProducts: lowSellingProducts
    };
  }

  function _calculateLowSellingProducts(soldProducts, catalogProducts, validOrders) {
    soldProducts = Array.isArray(soldProducts) ? soldProducts : [];
    catalogProducts = Array.isArray(catalogProducts) ? catalogProducts : [];
    var soldMap = {};
    soldProducts.forEach(function (item) {
      var key = _productSignalKey(item);
      if (key) soldMap[key] = item;
      var nameKey = _productNameKey(item && item.name);
      if (nameKey) soldMap[nameKey] = item;
    });
    var activeCatalog = catalogProducts.filter(_isProductVisibleForSeason);
    var averageQty = soldProducts.length
      ? soldProducts.reduce(function (sum, item) { return sum + _number(item.quantity, 0); }, 0) / soldProducts.length
      : 0;
    var lowQtyLimit = Math.max(1, Math.floor(averageQty * 0.35));
    var candidates = [];
    activeCatalog.forEach(function (product) {
      var productKey = _productSignalKey(product);
      var productId = String(product.id || product.productId || product.uid || product.ref || product.slug || '').trim();
      var name = _productDisplayName(product);
      if (!name) return;
      var sold = soldMap[productKey] || soldMap[_productNameKey(name)] || null;
      var quantity = _number(sold && sold.quantity, 0);
      var revenue = _number(sold && sold.revenue, 0);
      var reason = quantity <= 0 ? 'sem venda no período' : (quantity <= lowQtyLimit ? 'baixa saída no período' : '');
      if (!reason) return;
      candidates.push({
        productId: productId,
        id: productId,
        productKey: productKey,
        name: name,
        quantity: quantity,
        revenue: revenue,
        reason: reason,
        active: true,
        visible: product.menuVisible !== false,
        impactScore: _validatedImpactScore(quantity, revenue, { baselineOrders: Math.max(1, (validOrders || []).length), baselineRevenue: revenue }, 0)
      });
    });
    if (!candidates.length && soldProducts.length) {
      candidates = soldProducts.filter(function (item) {
        return _number(item.quantity, 0) <= lowQtyLimit;
      }).map(function (item) {
        return Object.assign({}, item, {
          reason: 'baixa saída em relação aos outros produtos'
        });
      });
    }
    return candidates.sort(function (a, b) {
      return _number(a.quantity, 0) - _number(b.quantity, 0) || _number(a.revenue, 0) - _number(b.revenue, 0) || String(a.name || '').localeCompare(String(b.name || ''));
    }).slice(0, 8);
  }

  function _productSignalKey(product) {
    var id = product && (product.productId || product.id || product.uid || product.ref || product.slug);
    if (id) return 'id:' + String(id);
    return _productNameKey(product && (product.name || product.nome || product.title));
  }

  function _productNameKey(name) {
    var folded = _foldText(name || '');
    return folded ? 'name:' + folded : '';
  }

  function _productDisplayName(product) {
    return String(product && (product.name || product.nome || product.title || product.label || '') || '').trim().slice(0, 90);
  }

  function _isProductVisibleForSeason(product) {
    if (!product) return false;
    if (product.deleted || product.archived || product.excluded) return false;
    if (product.active === false || product.enabled === false || product.available === false) return false;
    if (product.menuVisible === false || product.visible === false || product.hidden === true) return false;
    return !!_productDisplayName(product);
  }

  function _sumOrderRevenue(orders) {
    return (orders || []).reduce(function (sum, order) {
      return sum + _number(order && order.total, 0);
    }, 0);
  }

  function _validatedImpactScore(count, revenue, baseline, discountTotal) {
    count = _number(count, 0);
    revenue = _number(revenue, 0);
    discountTotal = _number(discountTotal, 0);
    var baselineRevenue = Math.max(1, _number(baseline && (baseline.revenue || baseline.baselineRevenue), 0));
    var revenueShare = revenue / baselineRevenue;
    var score = 0;
    if (count >= 1 && revenue > 0) score += 1;
    if (count >= 3) score += 1;
    if (revenueShare >= .15) score += 1;
    if (revenueShare >= .30) score += 1;
    if (!discountTotal || revenue >= discountTotal * 3) score += 1;
    return Math.round(_clamp(score, 0, 5));
  }

  function _calculateSeasonScoreBreakdown(season, currentMetrics, validatedImpactSignals, riskContext) {
    var coreObjectiveScore = _calculateCoreObjectiveScore(season, currentMetrics, riskContext);
    var validatedImpactBonus = _calculateValidatedImpactBonus(season, validatedImpactSignals);
    var riskPenalty = _calculateRiskPenalty(season, currentMetrics, riskContext);
    var finalScore = Math.round(_clamp(coreObjectiveScore + validatedImpactBonus - riskPenalty, 0, 100));

    return {
      coreObjectiveScore: coreObjectiveScore,
      validatedImpactBonus: validatedImpactBonus,
      riskPenalty: riskPenalty,
      finalScore: finalScore,
      calculationVersion: 'season_score_v1_1'
    };
  }

  function _calculateCoreObjectiveScore(season, currentMetrics, riskContext) {
    var direct = _number(riskContext && riskContext.coreObjectiveScore, null);
    if (direct !== null) return Math.round(_clamp(direct, 0, 100));
    return Math.round(_clamp(_number(currentMetrics && currentMetrics.coreObjectiveScore, 0), 0, 100));
  }

  function _calculateValidatedImpactBonus(season, signals) {
    signals = signals || {};
    var couponScore = _number(signals.coupons && signals.coupons.impactScore, 0);
    var promotionScore = _number(signals.promotions && signals.promotions.impactScore, 0);
    var upsellScore = _number(signals.upsell && signals.upsell.impactScore, 0);
    var pointsScore = _number(signals.points && signals.points.impactScore, 0);
    var channelScore = _number(signals.channels && signals.channels.topChannel && signals.channels.topChannel.impactScore, 0);
    var productScore = _number(signals.products && signals.products.topProduct && signals.products.topProduct.impactScore, 0);
    var consistencyScore = _consistencyValidatedImpactScore(season, signals);
    var ticketHealthyScore = _ticketHealthyImpactScore(season, signals);
    var objective = season && season.objective;
    var bonus = 0;

    if (objective === 'sell_more') {
      bonus = couponScore * .20 + promotionScore * .25 + channelScore * .20 + productScore * .25 + consistencyScore * .10;
    } else if (objective === 'increase_ticket') {
      bonus = upsellScore * .45 + productScore * .20 + ticketHealthyScore * .25 + promotionScore * .10;
    } else if (objective === 'retain_customers') {
      bonus = pointsScore * .45 + couponScore * .25 + consistencyScore * .20 + channelScore * .10;
    } else if (objective === 'improve_consistency') {
      bonus = consistencyScore * .45 + channelScore * .25 + productScore * .20 + pointsScore * .10;
    } else {
      bonus = (couponScore + promotionScore + upsellScore + pointsScore + channelScore + productScore) / 3;
    }

    return Math.round(_clamp(bonus, 0, 8));
  }

  function _consistencyValidatedImpactScore(season, signals) {
    var channelScore = _number(signals && signals.channels && signals.channels.topChannel && signals.channels.topChannel.impactScore, 0);
    var productScore = _number(signals && signals.products && signals.products.topProduct && signals.products.topProduct.impactScore, 0);
    var pointsScore = _number(signals && signals.points && signals.points.impactScore, 0);
    return Math.round(_clamp((channelScore + productScore + pointsScore) / 3, 0, 5));
  }

  function _ticketHealthyImpactScore(season, signals) {
    var upsell = signals && signals.upsell || {};
    var promotions = signals && signals.promotions || {};
    var addedRevenue = _number(upsell.addedRevenue, 0);
    var upsellDiscount = _number(upsell.discountTotal, 0);
    var promoDiscount = _number(promotions.discountTotal, 0);
    var score = _number(upsell.impactScore, 0);
    if (addedRevenue > 0 && addedRevenue >= (upsellDiscount + promoDiscount) * 2) score += 1;
    if (promoDiscount > addedRevenue && addedRevenue > 0) score -= 1;
    return Math.round(_clamp(score, 0, 5));
  }

  function _calculateRiskPenalty(season, currentMetrics, riskContext) {
    riskContext = riskContext || {};
    var risk = riskContext.riskLevel || season && season.riskLevel || 'unknown';
    var penalty = ({ low: 0, medium: 2, high: 5, very_high: 8, unknown: 1 })[risk] || 1;
    var ratio = _number(riskContext.progressRatio, _number(currentMetrics && currentMetrics.progressRatio, 0));
    var progress = _number(riskContext.progressPercent, _number(currentMetrics && currentMetrics.progressPercent, 0));
    var daysRemaining = _number(riskContext.daysRemaining, _number(currentMetrics && currentMetrics.daysRemaining, 999));

    if (riskContext.recentDrop) penalty += 2;
    if (ratio > 0 && ratio < .5) penalty += 3;
    if (daysRemaining <= 7 && progress < 75) penalty += 2;
    return Math.round(_clamp(penalty, 0, 12));
  }

  function _buildBaselineMetrics(orders, days) {
    var revenue = 0;
    var activeDayMap = {};
    var customers = {};
    var itemCount = 0;

    (orders || []).forEach(function (order) {
      var normalized = _normalizeSeasonOrder(order);
      if (!normalized) return;
      var total = normalized.total;
      revenue += total;
      itemCount += _orderItemCount(normalized);

      var date = normalized.createdAt;
      if (date) activeDayMap[date.toISOString().slice(0, 10)] = true;

      var key = normalized.customerKey;
      if (key) customers[key] = (customers[key] || 0) + 1;
    });

    var customerKeys = Object.keys(customers);
    var recurring = customerKeys.filter(function (key) { return customers[key] > 1; }).length;
    var count = (orders || []).length;
    var activeDays = Object.keys(activeDayMap).length;
    var confidence = count >= 10 ? 'high' : (count >= 3 ? 'medium' : 'low');

    return {
      baselineRevenue: revenue,
      baselineOrders: count,
      baselineAverageTicket: count ? revenue / count : 0,
      baselineAverageItemsPerOrder: count ? itemCount / count : 0,
      baselineActiveDays: activeDays,
      baselineRecurringCustomers: recurring,
      baselineRepurchaseRate: customerKeys.length ? recurring / customerKeys.length : 0,
      baselineConfidence: confidence,
      baselineDays: days
    };
  }

  function _baselineValueForObjective(baseline, objective) {
    if (objective === 'sell_more') return _number(baseline.baselineRevenue, 0);
    if (objective === 'increase_ticket') return _number(baseline.baselineAverageTicket, 0);
    if (objective === 'retain_customers') return _number(baseline.baselineRecurringCustomers, 0) || _number(baseline.baselineRepurchaseRate, 0);
    if (objective === 'improve_consistency') return _number(baseline.baselineActiveDays, 0);
    return 0;
  }

  function _automaticTargetValue(base, objective, difficulty) {
    base = _number(base, 0);
    var pct = {
      sell_more: { safe: .10, balanced: .20, aggressive: .35 },
      increase_ticket: { safe: .05, balanced: .10, aggressive: .18 },
      retain_customers: { safe: .05, balanced: .12, aggressive: .20 }
    };
    if (objective === 'improve_consistency') {
      var add = ({ safe: 1, balanced: 2, aggressive: 3 })[difficulty] || 1;
      return base + add;
    }
    var map = pct[objective] || {};
    return base * (1 + (map[difficulty] || 0));
  }

  function _fixedTargetRisk(base, target, confidence) {
    base = _number(base, 0);
    target = _number(target, 0);
    if (confidence === 'low' || base <= 0) return 'unknown';
    var growth = ((target - base) / base) * 100;
    if (growth <= 15) return 'low';
    if (growth <= 35) return 'medium';
    if (growth <= 60) return 'high';
    return 'very_high';
  }

  function _isCanceledOrder(order) {
    return _normalizeOrderStatus(order && order.status) === 'canceled';
  }

  function _orderDate(order) {
    var normalized = order && order.raw ? order : _normalizeSeasonOrder(order);
    return normalized ? normalized.createdAt : null;
  }

  function _orderHour(order) {
    var raw = order && order.raw ? order.raw : order;
    var direct = _nullableNumber(raw && raw.analyticsHour);
    if (direct !== null) return Math.max(0, Math.min(23, Math.floor(direct)));
    var time = String((raw && (raw.analyticsTime || raw.orderTime || raw.saleTime || raw.createdTime || raw.deliveryTime || raw.scheduleTime || raw.slotTime)) || '').trim();
    var match = time.match(/(\d{1,2}):(\d{2})/);
    if (match) return Math.max(0, Math.min(23, parseInt(match[1], 10) || 0));
    var date = _orderDate(order);
    return date ? date.getHours() : null;
  }

  function _customerKey(order) {
    var normalized = order && order.raw ? order : _normalizeSeasonOrder(order);
    return normalized ? normalized.customerKey : '';
  }

  function _normalizePhone(value) {
    return String(value || '').replace(/\D+/g, '');
  }

  function _money(value) {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    var raw = String(value === undefined || value === null ? '' : value).trim().replace(/[^\d,.-]/g, '');
    var normalized = raw.indexOf(',') >= 0 ? raw.replace(/\./g, '').replace(',', '.') : raw;
    var n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }

  function _normalizeSeasons(seasons) {
    return (seasons || []).filter(function (season) {
      return season && (!season.tenantId || season.tenantId === _tenantId);
    }).map(function (season) {
      var status = ALLOWED_STATUS[season.status] ? season.status : 'draft';
    return Object.assign({}, season, { status: status });
    }).sort(function (a, b) {
      return _dateValue(b.createdAt || b.startedAt || b.startDate) - _dateValue(a.createdAt || a.startedAt || a.startDate);
    });
  }

  function _refreshActiveSeasonMetrics(season, actionContext) {
    if (!season || season.status !== 'active' || !season.id || !window.DB || typeof DB.getAll !== 'function' || typeof DB.update !== 'function') {
      return Promise.resolve(season);
    }

    var updatedSeason = season;
    return _loadScoreOrders(season).then(function (orders) {
      var result = _calculateSeasonScore(season, orders || [], actionContext || _state.actionContext);
      var updates = {
        currentScore: result.currentScore,
        currentStatus: result.currentStatus,
        riskLevel: result.riskLevel,
        progressPercent: result.progressPercent,
        scoreBreakdown: result.scoreBreakdown,
        validatedImpactSignals: result.validatedImpactSignals,
        riskContext: result.riskContext,
        seasonReading: result.seasonReading,
        executionPlan: result.executionPlan,
        actionTasks: result.actionTasks,
        actionTaskHistory: result.actionTaskHistory,
        currentMetrics: result.currentMetrics
      };
      _appendGoalReachedPatch(season, result, updates);

      if (!_shouldPersistMetrics(season, updates)) {
        updatedSeason = Object.assign({}, season, updates);
        _maybeRunGoalCelebrationCheck(updatedSeason);
        return updatedSeason;
      }

      return DB.update('seasons', season.id, updates).then(function () {
        updatedSeason = Object.assign({}, season, updates);
        _maybeRunGoalCelebrationCheck(updatedSeason);
        return updatedSeason;
      });
    }).then(function () {
      return _ensureSeasonSnapshots(updatedSeason).then(function (snapshotState) {
        _state.snapshots = snapshotState || { daily: null, weekly: null };
        return Object.assign({}, updatedSeason, { snapshotState: _state.snapshots });
      });
    }).catch(function (err) {
      console.error('Temporadas scoring error', err);
      return season;
    });
  }

  function _appendGoalReachedPatch(season, result, updates) {
    if (!season || season.status !== 'active') return;
    if (_number(result && result.progressPercent, 0) < 100) return;
    if (season.goalReachedAt) return;
    updates.goalReachedAt = new Date().toISOString();
    updates.goalCelebrationPending = true;
    updates.goalCelebrationShownAt = season.goalCelebrationShownAt || null;
  }

  function _maybeRunGoalCelebrationCheck(season) {
    if (!season || season.status !== 'active') return;
    if (_number(season.progressPercent, 0) < 100 && _number(season.currentMetrics && season.currentMetrics.currentValue, 0) < _number(season.currentMetrics && season.currentMetrics.targetValue, 1)) return;
    checkPendingGoalCelebration({ force: true });
  }

  function checkPendingGoalCelebration(opts) {
    opts = opts || {};
    if (_goalCelebrationCheckRunning) return Promise.resolve(null);
    if (!opts.force && Date.now() - _lastGoalCelebrationCheckAt < 8000) return Promise.resolve(null);
    if (!window.Auth || !Auth.getUser || !Auth.getUser()) return Promise.resolve(null);
    if (!window.DB || typeof DB.getAll !== 'function' || typeof DB.update !== 'function') return Promise.resolve(null);

    _goalCelebrationCheckRunning = true;
    _lastGoalCelebrationCheckAt = Date.now();
    _tenantId = (window.Auth && typeof Auth.getTenantId === 'function') ? (Auth.getTenantId() || '') : _tenantId;

    return DB.getAll('seasons').then(function (seasons) {
      seasons = _normalizeSeasons(seasons || []);
      var pending = _pendingGoalCelebrationSeason(seasons);
      if (pending) return _displayPendingGoalCelebration(pending);

      var active = _resolveActiveSeason(seasons);
      if (!active || active.goalReachedAt) return null;
      if (_number(active.progressPercent, 0) >= 100) {
        return _markGoalReached(active).then(function (marked) {
          return marked ? _displayPendingGoalCelebration(marked) : null;
        });
      }
      return _refreshActiveSeasonMetrics(active).then(function (updated) {
        return _pendingGoalCelebrationSeason([updated]) ? _displayPendingGoalCelebration(updated) : null;
      });
    }).catch(function (err) {
      console.warn('Temporadas goal celebration check skipped', err);
      return null;
    }).finally(function () {
      _goalCelebrationCheckRunning = false;
    });
  }

  function _pendingGoalCelebrationSeason(seasons) {
    return (seasons || []).filter(function (season) {
      return season && season.status === 'active' &&
        season.goalCelebrationPending === true &&
        !season.goalCelebrationShownAt &&
        _number(season.progressPercent, 0) >= 100;
    }).sort(function (a, b) {
      return _dateValue(a.goalReachedAt || a.updatedAt || a.startedAt) - _dateValue(b.goalReachedAt || b.updatedAt || b.startedAt);
    })[0] || null;
  }

  function _displayPendingGoalCelebration(season) {
    if (!season || !season.id) return Promise.resolve(null);
    if (_goalCelebrationsInMemory[season.id]) return Promise.resolve(null);
    _goalCelebrationsInMemory[season.id] = true;
    try {
      _showGoalReachedCelebration(season);
    } catch (err) {
      console.warn('Temporadas goal celebration render skipped', err);
      _toast('Meta da temporada atingida.', 'success');
    }
    return _markGoalCelebrationShown(season);
  }

  function _markGoalReached(season) {
    if (!season || season.status !== 'active' || !season.id || season.goalReachedAt) return Promise.resolve(null);
    var reachedAt = new Date().toISOString();
    var patch = {
      goalReachedAt: reachedAt,
      goalCelebrationPending: true,
      goalCelebrationShownAt: null
    };
    return DB.update('seasons', season.id, patch).then(function () {
      return Object.assign({}, season, patch);
    }).catch(function (err) {
      console.warn('Temporadas goal reached update skipped', err);
      return null;
    });
  }

  function _markGoalCelebrationShown(season) {
    var shownAt = new Date().toISOString();
    return DB.update('seasons', season.id, {
      goalCelebrationShownAt: shownAt,
      goalCelebrationPending: false
    }).then(function () {
      _state.seasons = (_state.seasons || []).map(function (item) {
        return item.id === season.id ? Object.assign({}, item, { goalCelebrationShownAt: shownAt, goalCelebrationPending: false }) : item;
      });
      if (_state.activeSeason && _state.activeSeason.id === season.id) {
        _state.activeSeason = Object.assign({}, _state.activeSeason, { goalCelebrationShownAt: shownAt, goalCelebrationPending: false });
      }
      return true;
    }).catch(function (err) {
      console.warn('Temporadas goal celebration shown update skipped', err);
      return false;
    });
  }

  function _ensureSeasonSnapshots(season) {
    if (!season || season.status !== 'active' || !season.id || !window.DB || typeof DB.add !== 'function' || typeof DB.getAll !== 'function') {
      return Promise.resolve({ daily: null, weekly: null });
    }

    var todayKey = _dateKey(new Date());
    var weekStart = _weekStart(new Date());
    var weekKey = _dateKey(weekStart);

    return Promise.all([
      _ensureSnapshot(season, 'daily', todayKey),
      _ensureSnapshot(season, 'weekly', weekKey)
    ]).then(function (items) {
      var snapshotState = { daily: items[0], weekly: items[1] };
      return _ensureSnapshotAIRecommendation(season, snapshotState).then(function (updatedDaily) {
        if (updatedDaily) snapshotState.daily = updatedDaily;
        return snapshotState;
      });
    }).catch(function (err) {
      console.error('Temporadas snapshot error', err);
      return { daily: null, weekly: null };
    });
  }

  function _ensureSnapshot(season, snapshotType, dateKey) {
    return _findSnapshot(season.id, snapshotType, dateKey).then(function (existing) {
      if (existing) return _refreshSnapshotIfChanged(season, snapshotType, dateKey, existing);
      return _createSnapshot(season, snapshotType, dateKey);
    });
  }

  function _findSnapshot(seasonId, snapshotType, dateKey) {
    if (window.DB && typeof DB.col === 'function') {
      return DB.col('season_metrics_snapshots')
        .where('seasonId', '==', seasonId)
        .where('snapshotType', '==', snapshotType)
        .where('date', '==', dateKey)
        .get()
        .then(function (snap) {
          if (!snap || !snap.docs || !snap.docs.length) return null;
          var doc = snap.docs[0];
          return Object.assign({}, doc.data(), { id: doc.id });
        }).catch(function (err) {
          console.warn('Temporadas snapshot query fallback', err);
          return _findSnapshotFallback(seasonId, snapshotType, dateKey);
        });
    }
    return _findSnapshotFallback(seasonId, snapshotType, dateKey);
  }

  function _findSnapshotFallback(seasonId, snapshotType, dateKey) {
    return DB.getAll('season_metrics_snapshots').then(function (snapshots) {
      return (snapshots || []).filter(function (snapshot) {
        return snapshot &&
          snapshot.tenantId === _tenantId &&
          snapshot.seasonId === seasonId &&
          snapshot.snapshotType === snapshotType &&
          snapshot.date === dateKey;
      })[0] || null;
    });
  }

  function _createSnapshot(season, snapshotType, dateKey) {
    return _loadSnapshotOrders(season, snapshotType).then(function (orders) {
      var payload = _buildSnapshotPayload(season, snapshotType, dateKey, orders || []);
      return DB.add('season_metrics_snapshots', payload).then(function (ref) {
        return Object.assign({}, payload, {
          id: ref && ref.id ? ref.id : '',
          createdAt: new Date().toISOString()
        });
      });
    });
  }

  function _refreshSnapshotIfChanged(season, snapshotType, dateKey, existing) {
    if (!existing || !existing.id || !window.DB || typeof DB.update !== 'function') return Promise.resolve(existing);
    return _loadSnapshotOrders(season, snapshotType).then(function (orders) {
      var payload = _buildSnapshotPayload(season, snapshotType, dateKey, orders || []);
      if (!_snapshotHasRelevantChanges(existing, payload)) return existing;
      var patch = Object.assign({}, payload, {
        updatedAt: new Date().toISOString(),
        aiRecommendation: null,
        aiRecommendationGeneratedAt: null,
        aiRecommendationModel: '',
        aiRecommendationStatus: 'not_requested',
        aiRecommendationError: ''
      });
      return DB.update('season_metrics_snapshots', existing.id, patch).then(function () {
        return Object.assign({}, existing, patch);
      });
    }).catch(function (err) {
      console.warn('Temporadas snapshot refresh skipped', err);
      return existing;
    });
  }

  function _snapshotHasRelevantChanges(existing, payload) {
    var fields = [
      'score',
      'progressPercent',
      'status',
      'riskLevel',
      'confidence',
      'scoreBreakdown',
      'validatedImpactSignals',
      'riskContext',
      'seasonReading',
      'executionPlan',
      'actionTasks',
      'actionTaskHistory',
      'metrics',
      'mainMetrics',
      'auxiliaryMetrics',
      'alerts',
      'insights'
    ];
    return fields.some(function (field) {
      return JSON.stringify(existing && existing[field] != null ? existing[field] : null) !== JSON.stringify(payload && payload[field] != null ? payload[field] : null);
    });
  }

  function _loadSnapshotOrders(season, snapshotType) {
    var range = _snapshotRange(season, snapshotType);
    return _loadSeasonOrdersForRange(range.periodStart, range.periodEnd);
  }

  function _buildSnapshotPayload(season, snapshotType, dateKey, orders) {
    var range = _snapshotRange(season, snapshotType);
    var validOrders = _ordersInPeriod(orders || [], range.periodStart, range.periodEnd);
    var days = Math.max(1, Math.ceil((range.periodEnd.getTime() - range.periodStart.getTime()) / 86400000));
    var metrics = _buildRuntimeMetrics(validOrders, days);
    var confidence = _snapshotConfidence(validOrders.length);
    var mainMetrics = _mainMetricsForSnapshot(season, metrics);
    var auxiliaryMetrics = _auxiliaryMetricsForSnapshot(metrics, confidence);
    var alerts = _snapshotAlerts(season, metrics, confidence);
    var scoreBreakdown = season.scoreBreakdown || season.currentMetrics && season.currentMetrics.scoreBreakdown || null;
    var validatedImpactSignals = season.validatedImpactSignals || season.currentMetrics && season.currentMetrics.validatedImpactSignals || null;
    var riskContext = season.riskContext || season.currentMetrics && season.currentMetrics.riskContext || null;
    var seasonReading = season.seasonReading || season.currentMetrics && season.currentMetrics.seasonReading || null;
    var executionPlan = season.executionPlan || season.currentMetrics && season.currentMetrics.executionPlan || null;
    var actionTasks = season.actionTasks || season.currentMetrics && season.currentMetrics.actionTasks || [];
    var actionTaskHistory = season.actionTaskHistory || season.currentMetrics && season.currentMetrics.actionTaskHistory || [];

    return {
      tenantId: _tenantId,
      seasonId: season.id,
      snapshotType: snapshotType,
      date: dateKey,
      periodStart: range.periodStart.toISOString(),
      periodEnd: range.periodEnd.toISOString(),
      objective: season.objective || '',
      build: season.build || '',
      difficulty: season.difficulty || '',
      score: _number(season.currentScore, 0),
      progressPercent: _number(season.progressPercent, 0),
      status: season.currentStatus || 'pending',
      riskLevel: season.riskLevel || 'unknown',
      confidence: confidence,
      scoreBreakdown: scoreBreakdown,
      validatedImpactSignals: validatedImpactSignals,
      riskContext: riskContext,
      seasonReading: seasonReading,
      executionPlan: executionPlan,
      actionTasks: actionTasks,
      actionTaskHistory: actionTaskHistory,
      metrics: metrics,
      mainMetrics: mainMetrics,
      auxiliaryMetrics: auxiliaryMetrics,
      alerts: alerts,
      insights: [],
      aiRecommendation: null,
      aiRecommendationGeneratedAt: null,
      aiRecommendationModel: '',
      aiRecommendationStatus: 'not_requested',
      aiRecommendationError: '',
      aiContextHash: '',
      aiContextSize: 0,
      aiTriggerReason: ''
    };
  }

  function _ensureSnapshotAIRecommendation(season, snapshotState) {
    if (!season || season.status !== 'active') return Promise.resolve(null);
    var daily = snapshotState && snapshotState.daily;
    if (!daily || !daily.id || !window.DB || typeof DB.update !== 'function') return Promise.resolve(daily || null);
    var context = _buildAIContext(season, snapshotState);
    var contextHash = _aiContextHash(context);
    var contextSize = _aiContextSize(context);
    if (_canReuseAIRecommendation(daily, contextHash, season)) {
      return Promise.resolve(daily);
    }

    var triggerReason = _aiTriggerReason(daily, contextHash);
    if (!context.cache) context.cache = {};
    context.cache.hash = contextHash;
    context.cache.size = contextSize;
    context.cache.triggerReason = triggerReason;
    return _generateAIRecommendation(context).then(function (result) {
      var now = new Date().toISOString();
      var recommendation = result.recommendation || _fallbackRecommendationForUI();
      var usage = result.usage || {};
      var patch = {
        aiRecommendation: recommendation,
        aiRecommendationGeneratedAt: now,
        aiRecommendationModel: result.model || 'local-rules-v1',
        aiRecommendationStatus: result.status || 'fallback',
        aiRecommendationError: result.error || '',
        aiContextHash: contextHash,
        aiContextSize: contextSize,
        aiTriggerReason: triggerReason,
        aiPromptTokens: _number(usage.promptTokens || usage.prompt_tokens, 0),
        aiCompletionTokens: _number(usage.completionTokens || usage.completion_tokens, 0),
        aiTotalTokens: _number(usage.totalTokens || usage.total_tokens, 0)
      };
      return DB.update('season_metrics_snapshots', daily.id, patch).then(function () {
        _persistSeasonAIFields(season, recommendation, now, patch);
        return Object.assign({}, daily, patch);
      });
    }).catch(function (err) {
      var fallback = _fallbackRecommendationForUI();
      var patch = {
        aiRecommendation: fallback,
        aiRecommendationGeneratedAt: new Date().toISOString(),
        aiRecommendationModel: 'local-rules-v1',
        aiRecommendationStatus: 'fallback',
        aiRecommendationError: err && err.message ? err.message : 'AI recommendation fallback',
        aiContextHash: contextHash,
        aiContextSize: contextSize,
        aiTriggerReason: triggerReason
      };
      return DB.update('season_metrics_snapshots', daily.id, patch).then(function () {
        return Object.assign({}, daily, patch);
      });
    });
  }

  function _canReuseAIRecommendation(daily, contextHash, season) {
    if (!daily || !daily.aiRecommendation) return false;
    if (daily.aiContextHash && contextHash && daily.aiContextHash !== contextHash) {
      if (_shouldKeepAIRecommendationForOpenTasks(daily, season)) return true;
      return false;
    }
    if (daily.aiRecommendationStatus === 'generated') return true;
    if (daily.aiRecommendationStatus !== 'fallback') return false;
    if (String(daily.aiRecommendationModel || '') !== 'local-rules-v1') return true;
    if (window.SeasonsAI && typeof SeasonsAI.hasRemoteEndpoint === 'function' && SeasonsAI.hasRemoteEndpoint()) {
      if (_recentRemoteAIFallback(daily)) return true;
      return false;
    }
    return true;
  }

  function _shouldKeepAIRecommendationForOpenTasks(daily, season) {
    var currentTasks = _activeActionTasksForAI(season);
    if (!_hasOpenActionTask(currentTasks)) return false;
    var savedTasks = _activeActionTasksForAI(daily);
    return _actionTaskSignature(currentTasks) === _actionTaskSignature(savedTasks);
  }

  function _activeActionTasksForAI(source) {
    var tasks = [];
    if (Array.isArray(source && source.actionTasks)) tasks = source.actionTasks;
    else if (Array.isArray(source && source.executionPlan && source.executionPlan.actionTasks)) tasks = source.executionPlan.actionTasks;
    return (tasks || []).filter(function (task) {
      return task && task.actionId && !_isTerminalActionTask(task);
    });
  }

  function _hasOpenActionTask(tasks) {
    return (tasks || []).some(function (task) {
      var status = task && task.status || 'pending';
      return status === 'pending' || status === 'result_in_progress' || status === 'manually_done';
    });
  }

  function _actionTaskSignature(tasks) {
    return (tasks || []).map(function (task) {
      return String(task.actionId || '');
    }).filter(Boolean).sort().join('|');
  }

  function _recentRemoteAIFallback(daily) {
    var error = String(daily && daily.aiRecommendationError || '').toLowerCase();
    if (!error || (error.indexOf('endpoint') < 0 && error.indexOf('http') < 0 && error.indexOf('openai') < 0 && error.indexOf('configured') < 0)) return false;
    var generatedAt = _toDate(daily.aiRecommendationGeneratedAt);
    if (!generatedAt) return false;
    return (Date.now() - generatedAt.getTime()) < 10 * 60 * 1000;
  }

  function _aiTriggerReason(daily, contextHash) {
    if (!daily || !daily.aiRecommendation) return 'first_daily_snapshot';
    if (daily.aiContextHash && contextHash && daily.aiContextHash !== contextHash) return 'context_changed';
    if (daily.aiRecommendationStatus === 'fallback' && String(daily.aiRecommendationModel || '') === 'local-rules-v1') return 'remote_available_after_local_fallback';
    return 'manual_or_snapshot_refresh';
  }

  function _aiContextHash(context) {
    return context && context.cache && context.cache.hash ? String(context.cache.hash) : _hashText(_stableStringify(context || {}));
  }

  function _aiContextSize(context) {
    try { return JSON.stringify(context || {}).length; } catch (err) { return 0; }
  }

  function _salesIntelligenceForAI(metrics, actionContext, businessHistory, season) {
    metrics = metrics || {};
    actionContext = actionContext || {};
    businessHistory = businessHistory || {};
    season = season || {};
    var rolling30 = businessHistory.periods && businessHistory.periods.rolling_30 || {};
    var previous30 = businessHistory.periods && businessHistory.periods.previous_30 || {};
    var points = _pointsIntelligenceForAI(actionContext, rolling30);
    var activePromotions = _activeActionRecordsForAI(actionContext.promotions || [], 'promotion');
    var activeCoupons = _activeActionRecordsForAI(actionContext.coupons || [], 'coupon');
    var activeUpsells = _activeActionRecordsForAI(actionContext.upsells || [], 'upsell');
    var seasonLinked = _seasonLinkedActionRecordsForAI(actionContext);
    var channels = _availableChannelsForAI(actionContext.salesChannels || []);
    var catalog = _catalogPossibilitiesForAI(actionContext.products || [], actionContext.variantGroups || []);
    return {
      period: 'ultimos_30_dias',
      revenue: _roundMoney(rolling30.revenue),
      previousRevenue: _roundMoney(previous30.revenue),
      orders: Math.round(_number(rolling30.ordersCount, 0)),
      previousOrders: Math.round(_number(previous30.ordersCount, 0)),
      averageTicket: _roundMoney(rolling30.averageTicket),
      activeDays: Math.round(_number(rolling30.activeDays, 0)),
      topProducts: _simplePerformanceList(rolling30.topProducts || metrics.topProducts || [], 5),
      topChannels: _simplePerformanceList(rolling30.topChannels || metrics.channelBreakdown || [], 4),
      strongHours: _simplePerformanceList(metrics.strongHours || [], 4),
      lowSellingProducts: _simplePerformanceList(metrics.lowSellingProducts || [], 4),
      realMenuCombinations: _realMenuCombinationsForAI(metrics.realMenuCombinations || [], 6),
      actionPerformance: {
        couponOrders: Math.round(_number(rolling30.couponOrders, metrics.couponUsage || 0)),
        promotionOrders: Math.round(_number(rolling30.promotionOrders, _number(metrics.promotionDiscount, 0) > 0 ? 1 : 0)),
        upsellOrders: Math.round(_number(rolling30.upsellOrders, metrics.upsellAcceptedCount || 0)),
        discountTotal: _roundMoney(rolling30.discountTotal || (_number(metrics.couponDiscount, 0) + _number(metrics.promotionDiscount, 0) + _number(metrics.upsellDiscount, 0))),
        upsellAddedRevenue: _roundMoney(metrics.upsellAddedRevenue),
        seasonLinkedActions: seasonLinked
      },
      availableActions: {
        promotions: activePromotions.slice(0, 4),
        coupons: activeCoupons.slice(0, 4),
        upsells: activeUpsells.slice(0, 4)
      },
      businessPossibilities: {
        salesChannels: channels.slice(0, 10),
        unexploredChannels: _unexploredChannelsForAI(channels, rolling30.topChannels || metrics.channelBreakdown || []).slice(0, 6),
        catalogProducts: catalog.products.slice(0, 12),
        menuProducts: catalog.menus.slice(0, 8),
        availableSalesLevers: _availableSalesLeversForAI(activePromotions, activeCoupons, activeUpsells, points)
      },
      playHistory: _seasonPlayHistoryForAI(season),
      pointsProgram: points,
      customerSignals: {
        recurringCustomers: Math.round(_number(rolling30.recurringCustomers, metrics.recurringCustomers || 0)),
        repurchaseRate: _number(rolling30.repurchaseRate, metrics.repurchaseRate || 0),
        customersWithPoints: points.customersWithPoints,
        customersReadyToRedeem: points.customersReadyToRedeem,
        suggestedGroups: _customerGroupsForAI(metrics, rolling30, points)
      }
    };
  }

  function _availableChannelsForAI(channels) {
    return (channels || []).map(function (channel) {
      channel = channel || {};
      return {
        key: channel.key || _normalizeChannel(channel.name || ''),
        name: channel.name || _channelLabel(channel.key || ''),
        commissionPct: _roundMoney(channel.commissionPct),
        fixedFee: _roundMoney(channel.fixedFee),
        taxPct: _roundMoney(channel.taxPct),
        locked: channel.locked === true
      };
    }).filter(function (item) {
      return item.name || item.key;
    });
  }

  function _unexploredChannelsForAI(channels, usedChannels) {
    var used = {};
    (usedChannels || []).forEach(function (item) {
      var key = _normalizeChannel(item && (item.key || item.channel || item.name || item.label || ''));
      if (key) used[key] = true;
    });
    return (channels || []).filter(function (channel) {
      var key = _normalizeChannel(channel && (channel.key || channel.name || ''));
      return key && !used[key];
    }).map(function (channel) {
      return { key: channel.key || _normalizeChannel(channel.name || ''), name: channel.name || _channelLabel(channel.key || '') };
    });
  }

  function _catalogPossibilitiesForAI(products, variantGroups) {
    var variantMap = {};
    (variantGroups || []).forEach(function (group) {
      if (group && group.id) variantMap[String(group.id)] = group;
    });
    var out = { products: [], menus: [] };
    (products || []).forEach(function (product) {
      if (!_productVisibleForAI(product)) return;
      var name = _productActionName(product);
      if (!name) return;
      var options = _productOptionGroupsForAI(product, variantMap);
      var isMenu = options.length > 0 || product.combo === true || product.isCombo === true || product.type === 'combo' || product.tipo === 'combo';
      var item = {
        id: product.id || product.productId || '',
        name: name,
        category: product.categoryName || product.category || product.categoria || '',
        price: _roundMoney(_firstValue(product.price, product.salePrice, product.valor, product.preco, product.precoVenda)),
        kind: isMenu ? 'menu_combo' : 'produto',
        hasOptions: options.length > 0,
        optionGroups: options.slice(0, 4)
      };
      out.products.push(item);
      if (isMenu) out.menus.push(item);
    });
    out.products = out.products.slice(0, 18);
    out.menus = out.menus.slice(0, 10);
    return out;
  }

  function _productVisibleForAI(product) {
    if (!product) return false;
    if (product.hidden === true || product.visible === false || product.showInMenu === false || product.cardapioVisible === false) return false;
    var status = _foldText(product.status || product.situacao || product.state || '');
    return ['inativo', 'inativa', 'oculto', 'oculta', 'pausado', 'pausada', 'arquivado', 'arquivada'].indexOf(status) < 0;
  }

  function _productOptionGroupsForAI(product, variantMap) {
    var groups = [];
    if (Array.isArray(product && product.variants)) groups = groups.concat(product.variants);
    if (Array.isArray(product && product.menuChoiceGroups)) groups = groups.concat(product.menuChoiceGroups);
    if (Array.isArray(product && product.variantGroupIds)) {
      product.variantGroupIds.forEach(function (id) {
        var group = variantMap[String(id || '')];
        if (group) groups.push(group);
      });
    }
    var seen = {};
    return (groups || []).map(function (group) {
      if (!group) return null;
      var id = String(group.id || group.key || group.title || group.name || '').trim();
      var title = String(group.title || group.name || group.label || 'Escolha').trim();
      var key = id || _foldText(title);
      if (!key || seen[key]) return null;
      seen[key] = true;
      var options = (group.options || group.items || group.choices || []).map(function (option) {
        option = option || {};
        return String(option.name || option.label || option.title || option.productName || option.stockItemName || option.ref || '').trim();
      }).filter(Boolean);
      return {
        name: title,
        required: group.required === true || group.min > 0 || group.minSelect > 0,
        min: Math.round(_number(group.min || group.minSelect || group.minChoices, 0)),
        max: Math.round(_number(group.max || group.maxSelect || group.maxChoices, 0)),
        options: _uniqueTextItems(options).slice(0, 8)
      };
    }).filter(function (item) {
      return item && (item.name || item.options.length);
    }).slice(0, 5);
  }

  function _availableSalesLeversForAI(promotions, coupons, upsells, points) {
    var levers = [];
    if ((promotions || []).length) levers.push({ type: 'promotions', count: promotions.length, names: promotions.slice(0, 4).map(function (item) { return item.name || item.code || ''; }).filter(Boolean) });
    if ((coupons || []).length) levers.push({ type: 'coupons', count: coupons.length, names: coupons.slice(0, 4).map(function (item) { return item.code || item.name || ''; }).filter(Boolean) });
    if ((upsells || []).length) levers.push({ type: 'upsells', count: upsells.length, names: upsells.slice(0, 4).map(function (item) { return item.name || ''; }).filter(Boolean) });
    if (points && points.active !== false) {
      levers.push({
        type: 'points_program',
        count: Math.round(_number(points.customersWithPoints, 0)),
        names: points.customersReadyToRedeem > 0 ? ['clientes com pontos para usar'] : ['programa de pontos ativo']
      });
    }
    if (!levers.length) levers.push({ type: 'none_ready', count: 0, names: ['sem cupom, promoção, upsell ou pontos pronto para usar'] });
    return levers;
  }

  function _seasonPlayHistoryForAI(season) {
    var tasks = (season && season.actionTaskHistory || []).concat(season && season.actionTasks || []);
    var mapped = (tasks || []).map(function (task) {
      task = task || {};
      return {
        actionId: task.actionId || '',
        title: task.title || '',
        source: task.source || '',
        focusKey: task.focusKey || '',
        productKey: task.productKey || '',
        status: task.status || '',
        resultDueAt: task.resultDueAt || '',
        evidence: task.evidence && task.evidence.message || '',
        orderTotal: _roundMoney(task.evidence && task.evidence.orderTotal)
      };
    }).filter(function (task) {
      return task.title || task.actionId;
    });
    return {
      recent: mapped.slice(-8),
      winners: mapped.filter(function (task) { return task.status === 'executed_with_result'; }).slice(-5),
      weakOrExpired: mapped.filter(function (task) { return task.status === 'executed_without_result' || task.status === 'not_executed'; }).slice(-5),
      activeOrReading: mapped.filter(function (task) { return task.status === 'pending' || task.status === 'result_in_progress' || task.status === 'manually_done'; }).slice(-5)
    };
  }

  function _simplePerformanceList(items, limit) {
    return (items || []).slice(0, limit || 4).map(function (item) {
      item = item || {};
      return {
        id: item.id || item.key || item.productId || '',
        name: item.name || item.label || item.channelName || item.channel || item.day || (item.hour !== undefined ? _formatHourLabel(item.hour) : ''),
        quantity: Math.round(_number(item.quantity || item.qty, 0)),
        orders: Math.round(_number(item.orders || item.count, 0)),
        revenue: _roundMoney(item.revenue || item.total),
        marginPercent: Math.round(_number(item.marginPercent || item.grossMarginPercent || item.margin, 0))
      };
    }).filter(function (item) {
      return item.name || item.quantity || item.orders || item.revenue;
    });
  }

  function _realMenuCombinationsForAI(items, limit) {
    return (items || []).slice(0, limit || 6).map(function (item) {
      item = item || {};
      return {
        productId: item.productId || '',
        productName: item.productName || item.name || '',
        combination: item.combination || item.label || '',
        channel: item.channel || '',
        orders: Math.round(_number(item.orders, 0)),
        quantity: Math.round(_number(item.quantity, 0)),
        revenue: _roundMoney(item.revenue),
        averagePrice: _roundMoney(item.averagePrice),
        averageCost: _roundMoney(item.averageCost),
        averageFees: _roundMoney(item.averageFees),
        profit: _roundMoney(item.profit),
        marginPercent: Math.round(_number(item.marginPercent, 0)),
        status: item.status || '',
        reason: item.reason || ''
      };
    }).filter(function (item) {
      return item.productName && item.combination && (item.orders || item.quantity || item.revenue);
    });
  }

  function _activeActionRecordsForAI(records, type) {
    return (records || []).filter(_maturityActiveRecord).map(function (item) {
      item = item || {};
      return {
        id: item.id || '',
        type: type || '',
        name: _actionRecordName(item, type),
        code: item.code || item.codigo || '',
        benefit: _actionRecordBenefitText(item),
        target: _actionRecordTargetText(item),
        seasonActionId: item.seasonActionId || ''
      };
    }).filter(function (item) { return item.name || item.code; });
  }

  function _seasonLinkedActionRecordsForAI(actionContext) {
    var out = [];
    [
      ['promotion', actionContext.promotions || []],
      ['coupon', actionContext.coupons || []],
      ['upsell', actionContext.upsells || []]
    ].forEach(function (entry) {
      (entry[1] || []).forEach(function (item) {
        if (!item || !item.seasonActionId) return;
        out.push({
          type: entry[0],
          name: _actionRecordName(item, entry[0]),
          seasonActionId: item.seasonActionId || '',
          seasonActionTitle: item.seasonActionTitle || '',
          status: item.status || (item.active === false ? 'inactive' : 'active')
        });
      });
    });
    return out.slice(0, 8);
  }

  function _actionRecordName(item, type) {
    if (!item) return '';
    if (type === 'coupon') return String(item.code || item.codigo || item.name || item.title || '').trim();
    return String(item.name || item.title || item.nome || item.label || item.code || item.id || '').trim();
  }

  function _actionRecordBenefitText(item) {
    if (!item) return '';
    var type = String(item.benefitType || item.discountType || item.type || item.tipo || '').trim();
    var value = _number(item.benefitValue != null ? item.benefitValue : item.discountValue != null ? item.discountValue : item.value != null ? item.value : item.valor, 0);
    if (!type && !value) return '';
    if (type === 'percent' || type === 'percentage' || type === 'porcentagem') return value + '%';
    if (type === 'fixed' || type === 'amount' || type === 'valor') return _fmtMoney(value);
    if (type === 'special_price') return 'preço especial ' + _fmtMoney(item.specialPrice || item.finalPrice || value);
    return [type, value ? String(value) : ''].filter(Boolean).join(' ');
  }

  function _actionRecordTargetText(item) {
    if (!item) return '';
    var ids = item.productIds || item.products || item.triggerProductIds || item.triggerProducts || item.targetProductIds || [];
    if (!Array.isArray(ids)) ids = ids ? [ids] : [];
    var channel = item.channel || item.channels && item.channels[0] || '';
    var parts = [];
    if (ids.length) parts.push(ids.length + ' produto(s)');
    if (channel) parts.push('canal ' + _channelLabel(channel));
    return parts.join(' · ');
  }

  function _pointsIntelligenceForAI(actionContext, rolling30) {
    var cfg = actionContext.pointsConfig || {};
    var movements = actionContext.pointsMovements || [];
    var start = _addDays(_dayStart(new Date()), -29);
    var earned = 0;
    var used = 0;
    var customers = {};
    var ready = 0;
    (movements || []).forEach(function (item) {
      var d = _toDate(item.createdAt || item.date || item.data || item.updatedAt);
      if (d && d < start) return;
      var pts = Math.abs(_number(item.points != null ? item.points : item.amount != null ? item.amount : item.pontos, 0));
      var type = _normalizeText(item.type || item.tipo || item.kind || item.direction || '');
      if (type === 'used' || type === 'uso' || type === 'resgate' || type === 'redeemed' || _number(item.discount || item.discountValue, 0) > 0) used += pts;
      else earned += pts;
      var customerKey = item.customerId || item.clientId || item.customerKey || item.phone || item.email || '';
      if (customerKey) customers[customerKey] = true;
    });
    (actionContext.customers || []).forEach(function (customer, index) {
      var balance = _number(customer.pointsBalance != null ? customer.pointsBalance : customer.pontos != null ? customer.pontos : customer.points, 0);
      if (balance > 0) customers[customer.id || customer.phone || customer.email || customer.name || ('customer_' + index)] = true;
      if (balance >= _number(cfg.minimumPointsToUse, 0)) ready++;
    });
    return {
      active: cfg && cfg.active !== false && cfg.enabled !== false,
      earnPerEuro: _number(cfg.earnPerEuro, 0),
      redeemRate: _number(cfg.redeemRate, 0),
      minimumPointsToUse: _number(cfg.minimumPointsToUse, 0),
      pointsEarned30d: Math.round(earned),
      pointsUsed30d: Math.round(used),
      redemptionOrders30d: Math.round(_number(rolling30.redemptionOrders, 0)),
      customersWithPoints: Object.keys(customers).length,
      customersReadyToRedeem: ready
    };
  }

  function _customerGroupsForAI(metrics, rolling30, points) {
    var groups = [];
    if (_number(rolling30.recurringCustomers, metrics.recurringCustomers || 0) > 0) groups.push('clientes que já compraram mais de uma vez');
    if (_number(points.customersReadyToRedeem, 0) > 0) groups.push('clientes com pontos suficientes para resgate');
    if (_number(points.pointsEarned30d, 0) > _number(points.pointsUsed30d, 0)) groups.push('clientes que juntaram pontos e ainda não usaram');
    if (!groups.length) groups.push('clientes dos primeiros pedidos registrados');
    return groups.slice(0, 4);
  }

  function _roundMoney(value) {
    return Math.round(_number(value, 0) * 100) / 100;
  }

  function _hashText(text) {
    text = String(text || '');
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return 'ctx_' + Math.abs(hash).toString(36) + '_' + text.length.toString(36);
  }

  function _stableStringify(value) {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return '[' + value.map(_stableStringify).join(',') + ']';
    if (typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (key) {
        return JSON.stringify(key) + ':' + _stableStringify(value[key]);
      }).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  function _buildAIContext(season, snapshotState) {
    var metrics = season.currentMetrics || {};
    var relatedData = {
      topProducts: metrics.topProducts || [],
      lowSellingProducts: metrics.lowSellingProducts || [],
      strongDays: metrics.strongDays || [],
      strongHours: metrics.strongHours || [],
      revenuePreviousPeriod: 0,
      ordersPreviousPeriod: 0,
      averageTicketChange: 0,
      reviewsAverage: 0,
      couponUsage: _number(metrics.couponUsage, 0),
      couponDiscount: _number(metrics.couponDiscount, 0),
      promotionUsage: _number(metrics.promotionDiscount, 0) > 0 ? 1 : 0,
      promotionDiscount: _number(metrics.promotionDiscount, 0),
      upsellUsage: _number(metrics.upsellAcceptedCount, 0),
      upsellDiscount: _number(metrics.upsellDiscount, 0),
      upsellAddedRevenue: _number(metrics.upsellAddedRevenue, 0),
      pointsRedemption: _number(metrics.pointsRedemption, 0),
      pointsDiscount: _number(metrics.pointsDiscount, 0),
      channelBreakdown: metrics.channelBreakdown || [],
      actionOpportunities: metrics.actionOpportunities || null,
      validatedImpactSignals: metrics.validatedImpactSignals || season.validatedImpactSignals || null,
      riskContext: metrics.riskContext || season.riskContext || null,
      scoreBreakdown: metrics.scoreBreakdown || season.scoreBreakdown || null,
      seasonReading: metrics.seasonReading || season.seasonReading || null,
      executionPlan: metrics.executionPlan || season.executionPlan || null,
      actionTasks: metrics.actionTasks || season.actionTasks || [],
      actionTaskHistory: metrics.actionTaskHistory || season.actionTaskHistory || [],
      salesIntelligence: _salesIntelligenceForAI(metrics, _state.actionContext || {}, _state.businessHistory || {}, season)
    };
    if (window.SeasonsAI && typeof SeasonsAI.buildSeasonAIContext === 'function') {
      return SeasonsAI.buildSeasonAIContext(season, metrics, snapshotState || {}, relatedData);
    }
    return { season: season, status: {}, operationalData: relatedData, confidence: { unavailableMetrics: ['seasons.ai.js'] } };
  }

  function _generateAIRecommendation(context) {
    if (window.SeasonsAI && typeof SeasonsAI.generateSeasonActionRecommendation === 'function') {
      return SeasonsAI.generateSeasonActionRecommendation(context);
    }
    return Promise.resolve({
      recommendation: _fallbackRecommendationForUI(),
      status: 'fallback',
      model: 'local-rules-v1',
      error: 'SeasonsAI indisponível'
    });
  }

  function _persistSeasonAIFields(season, recommendation, generatedAt, meta) {
    if (!season || !season.id || !window.DB || typeof DB.update !== 'function') return;
    DB.update('seasons', season.id, {
      aiEnabled: false,
      lastAIRecommendationAt: generatedAt,
      lastAIRecommendationSummary: recommendation && (recommendation.headline || recommendation.nextAction || recommendation.summary) ? (recommendation.headline || recommendation.nextAction || recommendation.summary) : '',
      lastAIRecommendationModel: meta && meta.aiRecommendationModel || '',
      lastAIRecommendationStatus: meta && meta.aiRecommendationStatus || '',
      lastAIContextHash: meta && meta.aiContextHash || '',
      lastAITriggerReason: meta && meta.aiTriggerReason || ''
    }).catch(function (err) {
      console.warn('Temporadas AI season fields update skipped', err);
    });
  }

  function _recommendationFromSnapshots(snapshots) {
    var daily = snapshots && snapshots.daily;
    return daily && daily.aiRecommendation ? daily.aiRecommendation : null;
  }

  function _fallbackRecommendationForUI() {
    if (window.SeasonsAI && typeof SeasonsAI.getFallbackRecommendation === 'function') {
      return SeasonsAI.getFallbackRecommendation(_buildAIContext(_state.activeSeason || {}, _state.snapshots || {}));
    }
    return {
      headline: 'A temporada precisa de mais dados',
      helpingSignals: [],
      blockingSignals: ['Ainda há poucos pedidos válidos para uma leitura específica.'],
      nextAction: 'Continue registrando pedidos e revise progresso, score e risco nos próximos dias.'
    };
  }

  function _snapshotRange(season, snapshotType) {
    var now = new Date();
    var seasonStart = _toDate(season.startDate || season.startedAt || season.createdAt) || now;
    var seasonEnd = _toDate(season.endDate) || now;
    var periodEnd = now < seasonEnd ? now : seasonEnd;
    var periodStart;

    if (snapshotType === 'final') {
      periodStart = seasonStart;
    } else if (snapshotType === 'weekly') {
      periodStart = new Date(periodEnd.getTime());
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart = _dayStart(periodEnd);
    }

    if (periodStart < seasonStart) periodStart = seasonStart;
    if (periodEnd < periodStart) periodEnd = periodStart;
    return { periodStart: periodStart, periodEnd: periodEnd };
  }

  function _mainMetricsForSnapshot(season, metrics) {
    if (season.objective === 'sell_more') {
      return { revenue: metrics.revenue, orders: metrics.orders, activeDays: metrics.activeDays };
    }
    if (season.objective === 'increase_ticket') {
      return {
        averageTicket: metrics.averageTicket,
        averageOrderValue: metrics.averageTicket,
        averageItemsPerOrder: metrics.averageItemsPerOrder
      };
    }
    if (season.objective === 'retain_customers') {
      return {
        recurringCustomers: metrics.recurringCustomers,
        repurchaseRate: metrics.repurchaseRate,
        averageFrequency: metrics.averageFrequency
      };
    }
    if (season.objective === 'improve_consistency') {
      return {
        activeDays: metrics.activeDays,
        weeklyRegularity: metrics.weeklyRegularity,
        weakDays: metrics.weakDays
      };
    }
    return {};
  }

  function _auxiliaryMetricsForSnapshot(metrics, confidence) {
    return {
      confidence: confidence,
      revenue: metrics.revenue,
      orders: metrics.orders,
      averageTicket: metrics.averageTicket,
      activeDays: metrics.activeDays,
      recurringCustomers: metrics.recurringCustomers,
      repurchaseRate: metrics.repurchaseRate,
      averageFrequency: metrics.averageFrequency,
      averageItemsPerOrder: metrics.averageItemsPerOrder,
      weeklyRegularity: metrics.weeklyRegularity,
      strongHours: metrics.strongHours || [],
      weakDays: metrics.weakDays,
      scoreBreakdown: metrics.scoreBreakdown || null,
      validatedImpactSignals: metrics.validatedImpactSignals || null,
      riskContext: metrics.riskContext || null,
      seasonReading: metrics.seasonReading || null
    };
  }

  function _snapshotAlerts(season, metrics, confidence) {
    var alerts = [];
    if (confidence === 'low') {
      alerts.push(_snapshotAlert('low_confidence', 'warning', 'Baixa confiança', 'Há poucos dados no período consolidado.', 'orders', metrics.orders, 3));
    }
    if (season.riskLevel === 'high' || season.riskLevel === 'very_high') {
      alerts.push(_snapshotAlert('risk_level', season.riskLevel === 'very_high' ? 'critical' : 'warning', 'Chance de falha elevada', 'A temporada exige atenção pelo histórico, meta ou ritmo atual.', 'riskLevel', season.riskLevel, 'low'));
    }
    if (_number(season.progressPercent, 0) >= 100) {
      alerts.push(_snapshotAlert('target_reached', 'success', 'Meta atingida', 'A métrica principal atingiu ou superou a meta atual.', 'progressPercent', season.progressPercent, 100));
    }
    if (season.objective === 'sell_more' && !metrics.orders) {
      alerts.push(_snapshotAlert('no_orders', 'warning', 'Sem pedidos no período', 'Nenhum pedido válido foi encontrado nesta leitura.', 'orders', 0, 1));
    }
    return alerts;
  }

  function _snapshotAlert(type, severity, title, message, metric, value, expectedValue) {
    return {
      id: type + '-' + _dateKey(new Date()),
      type: type,
      severity: severity,
      title: title,
      message: message,
      metric: metric,
      value: value,
      expectedValue: expectedValue,
      createdAt: new Date().toISOString()
    };
  }

  function _snapshotConfidence(orderCount) {
    if (orderCount >= 10) return 'high';
    if (orderCount >= 3) return 'medium';
    return 'low';
  }

  function _finalizeSeason(season) {
    return _assertReady().then(function () {
      if (!season || !season.id) throw new Error('Temporada sem id.');
      if (typeof DB.getDoc !== 'function' || typeof DB.update !== 'function') throw new Error('DB indisponível para finalizar temporada.');
      return DB.getDoc('seasons', season.id);
    }).then(function (fresh) {
      if (!fresh) throw new Error('Temporada não encontrada.');
      if (fresh.tenantId && fresh.tenantId !== _tenantId) throw new Error('Temporada pertence a outro tenant.');
      if (fresh.status === 'finished') throw new Error('Temporada já finalizada.');
      if (fresh.status === 'abandoned') throw new Error('Temporada abandonada não pode ser finalizada.');
      if (fresh.status !== 'active') throw new Error('Apenas temporada ativa pode ser finalizada.');

      return _loadScoreOrders(fresh).then(function (orders) {
        var scored = _calculateSeasonScore(fresh, orders || [], _state.actionContext || {});
        var finalSeasonBase = Object.assign({}, fresh, {
          currentScore: scored.currentScore,
          currentStatus: scored.currentStatus,
          riskLevel: scored.riskLevel,
          progressPercent: scored.progressPercent,
          scoreBreakdown: scored.scoreBreakdown,
          validatedImpactSignals: scored.validatedImpactSignals,
          riskContext: scored.riskContext,
          seasonReading: scored.seasonReading,
          executionPlan: scored.executionPlan,
          actionTasks: scored.actionTasks,
          currentMetrics: scored.currentMetrics
        });
        var finalPatch = _buildFinalSeasonPatch(finalSeasonBase);
        var finishedSeason = Object.assign({}, finalSeasonBase, finalPatch, { id: fresh.id });

        return DB.update('seasons', fresh.id, finalPatch).then(function () {
          return _createFinalSnapshot(finishedSeason).then(function () {
            return finishedSeason;
          });
        });
      });
    });
  }

  function _buildFinalSeasonPatch(season) {
    var now = new Date().toISOString();
    var finalProgress = _number(season.progressPercent, 0);
    var finalScore = _number(season.currentScore, 0);
    var finalResult = _finalResultForSeason(season);
    var finalSummary = _finalSummaryForSeason(season, finalResult);
    var nextSeasonSuggestion = finalSummary.nextSeasonSuggestion || _nextSeasonSuggestion(season);

    return {
      status: 'finished',
      finalResult: finalResult,
      finalScore: Math.round(finalScore),
      finalProgressPercent: finalProgress,
      finalMetrics: season.currentMetrics || {},
      finalSummary: finalSummary,
      nextSeasonSuggestion: nextSeasonSuggestion,
      currentScore: Math.round(finalScore),
      currentStatus: season.currentStatus || _statusFromScore(finalScore),
      riskLevel: season.riskLevel || 'unknown',
      progressPercent: finalProgress,
      scoreBreakdown: season.scoreBreakdown || season.currentMetrics && season.currentMetrics.scoreBreakdown || null,
      validatedImpactSignals: season.validatedImpactSignals || season.currentMetrics && season.currentMetrics.validatedImpactSignals || null,
      riskContext: season.riskContext || season.currentMetrics && season.currentMetrics.riskContext || null,
      seasonReading: season.seasonReading || season.currentMetrics && season.currentMetrics.seasonReading || null,
      executionPlan: season.executionPlan || season.currentMetrics && season.currentMetrics.executionPlan || null,
      actionTasks: season.actionTasks || season.currentMetrics && season.currentMetrics.actionTasks || [],
      actionTaskHistory: season.actionTaskHistory || season.currentMetrics && season.currentMetrics.actionTaskHistory || [],
      currentMetrics: season.currentMetrics || {},
      finishedAt: now
    };
  }

  function _finalResultForSeason(season) {
    var progress = _number(season.progressPercent, 0);
    var score = _number(season.currentScore, 0);
    var risk = season.riskLevel || 'unknown';
    var hasRelevantEvolution = score >= 65 || risk === 'low' || risk === 'medium';

    if (progress >= 100) return 'Vitória Total';
    if (progress >= 75 && hasRelevantEvolution) return 'Vitória Parcial';
    if (progress >= 40 || score >= 40) return 'Temporada Instável';
    return 'Falha Operacional';
  }

  function _finalSummaryForSeason(season, finalResult) {
    var metrics = season.currentMetrics || {};
    var signals = season.validatedImpactSignals || metrics.validatedImpactSignals || {};
    var scoreBreakdown = season.scoreBreakdown || metrics.scoreBreakdown || {};
    var riskContext = season.riskContext || metrics.riskContext || {};
    var reading = season.seasonReading || metrics.seasonReading || _generateSeasonReading(season, metrics, scoreBreakdown, signals, riskContext);
    var worked = _uniqueTextItems(reading.helpingSignals || []);
    var blocked = _uniqueTextItems(reading.blockingSignals || []);
    var nextSuggestion = _nextSeasonSuggestion(season);

    if (_number(metrics.currentValue, 0) >= _number(metrics.targetValue, 0) && _number(metrics.targetValue, 0) > 0) {
      worked.unshift('A meta principal foi atingida.');
    }
    if (_number(season.currentScore, 0) >= 65) worked.push('A temporada terminou com ' + Math.round(_number(season.currentScore, 0)) + '/100.');
    if (_number(metrics.orders, 0) > 0) worked.push('Os pedidos reais deram base para entender o que funcionou.');
    if (_number(metrics.recurringCustomers, 0) > 0) worked.push('Clientes recorrentes apareceram durante a temporada.');
    if (signals.coupons && _number(signals.coupons.usedOrders, 0) > 0) {
      worked.push('Cupom usado em ' + Math.round(_number(signals.coupons.usedOrders, 0)) + ' pedido(s) válido(s).');
    }
    if (signals.upsell && _number(signals.upsell.acceptedOrders, 0) > 0) {
      worked.push('Upsell aceito em ' + Math.round(_number(signals.upsell.acceptedOrders, 0)) + ' pedido(s).');
    }
    if (signals.products && signals.products.topProduct) {
      worked.push((signals.products.topProduct.name || signals.products.topProduct) + ' ajudou a puxar a temporada.');
    }
    var lowProduct = signals.products && signals.products.lowSellingProducts && signals.products.lowSellingProducts[0];
    if (lowProduct && lowProduct.name) {
      blocked.push(lowProduct.name + ' ficou com baixa saída no período.');
    }

    if (_number(season.progressPercent, 0) < 75) blocked.push('O progresso ficou abaixo de 75% da meta.');
    if (season.riskLevel === 'high' || season.riskLevel === 'very_high') blocked.push('A chance de falha permaneceu elevada no encerramento.');
    if (!_number(metrics.orders, 0)) blocked.push('Faltaram pedidos válidos no período analisado.');
    if (_number(metrics.weeklyRegularity, 1) < .55) blocked.push('A regularidade semanal ficou instável.');
    if (!_number(metrics.recurringCustomers, 0) && season.objective === 'retain_customers') blocked.push('A recorrência de clientes ficou baixa.');
    if (signals.promotions && _number(signals.promotions.discountTotal, 0) > 0 && _number(metrics.averageTicket, 0) < _number(season.baselineAverageTicket, 0)) {
      blocked.push('Alguns descontos podem ter reduzido o ticket médio.');
    }

    var fallbackWorked = _number(metrics.orders, 0) > 0
      ? 'Houve base suficiente para encerrar a temporada com leitura objetiva.'
      : 'A temporada terminou sem pedidos válidos para mostrar o que funcionou.';

    return {
      headline: _finalHeadlineForSeason(season, finalResult),
      worked: _uniqueTextItems(worked).slice(0, 5).length ? _uniqueTextItems(worked).slice(0, 5) : [fallbackWorked],
      blocked: _uniqueTextItems(blocked).slice(0, 5).length ? _uniqueTextItems(blocked).slice(0, 5) : ['Nenhum bloqueio crítico foi detectado nas métricas finais.'],
      evolution: _finalEvolutionText(season, finalResult),
      nextAction: reading.nextAction || _nextSeasonReason(season),
      nextSeasonSuggestion: nextSuggestion,
      suggestionReason: _nextSeasonReason(season)
    };
  }

  function _finalHeadlineForSeason(season, finalResult) {
    var score = Math.round(_number(season.currentScore, 0));
    var progress = _number(season.progressPercent, 0);
    if (progress >= 100) return 'A temporada terminou com ' + score + '/100 e a meta foi atingida.';
    if (progress >= 75) return 'A temporada terminou com ' + score + '/100 e chegou perto da meta.';
    if (score >= 65) return 'A temporada terminou com ' + score + '/100, mas ainda precisa de mais ritmo.';
    return 'A temporada terminou com ' + score + '/100 e mostrou pontos claros para ajustar.';
  }

  function _finalEvolutionText(season, finalResult) {
    var progress = Math.round(_number(season.progressPercent, 0));
    var score = Math.round(_number(season.currentScore, 0));
    if (finalResult === 'Vitória Total') return 'A temporada atingiu a meta e encerrou com score ' + score + '.';
    if (finalResult === 'Vitória Parcial') return 'A temporada chegou a ' + progress + '% da meta com sinais operacionais relevantes.';
    if (finalResult === 'Temporada Instável') return 'Houve avanço parcial, mas o ritmo não ficou estável o suficiente.';
    return 'A temporada ficou abaixo do esperado e precisa de uma meta mais simples ou base operacional mais consistente.';
  }

  function _nextSeasonSuggestion(season) {
    var metrics = season.currentMetrics || {};
    var baselineTicket = _number(season.baselineAverageTicket, 0);
    var ticketLow = baselineTicket > 0 && _number(metrics.averageTicket, 0) < baselineTicket;
    var ordersLow = _number(season.baselineOrders, 0) > 0 && _number(metrics.orders, 0) < _number(season.baselineOrders, 0);
    var recurrenceLow = _number(metrics.recurringCustomers, 0) <= 0 || _number(metrics.repurchaseRate, 0) < .15;
    var consistencyLow = _number(metrics.weeklyRegularity, 1) < .55 || _number(metrics.activeDays, 0) <= Math.max(1, Math.round(_number(season.baselineActiveDays, 0) * .7));

    if (season.objective === 'sell_more' && _number(metrics.revenue, 0) > 0 && ticketLow) return 'increase_ticket';
    if (season.objective === 'increase_ticket' && _number(season.progressPercent, 0) >= 75 && ordersLow) return 'sell_more';
    if (recurrenceLow) return 'retain_customers';
    if (consistencyLow) return 'improve_consistency';
    if (!_number(metrics.orders, 0)) return 'sell_more';
    return 'improve_consistency';
  }

  function _nextSeasonReason(season) {
    var next = _nextSeasonSuggestion(season);
    if (next === 'increase_ticket') return 'O faturamento apareceu, mas o ticket médio pode sustentar melhor a margem.';
    if (next === 'sell_more') return 'O próximo ciclo deve recuperar volume e frequência de pedidos.';
    if (next === 'retain_customers') return 'A recorrência ainda está baixa e pode melhorar a base de clientes ativos.';
    if (next === 'improve_consistency') return 'O próximo ciclo deve reduzir oscilação e distribuir melhor os dias com venda.';
    return 'Sugestão gerada a partir das métricas finais disponíveis.';
  }

  function _createFinalSnapshot(season) {
    var dateKey = _dateKey(season.finishedAt || new Date());
    return _findSnapshot(season.id, 'final', dateKey).then(function (existing) {
      if (existing) return existing;
      return _loadSnapshotOrders(season, 'final').then(function (orders) {
        var payload = _buildSnapshotPayload(season, 'final', dateKey, orders || []);
        payload.score = _number(season.finalScore, season.currentScore || 0);
        payload.progressPercent = _number(season.finalProgressPercent, season.progressPercent || 0);
        payload.status = 'finished';
        payload.riskLevel = season.riskLevel || 'unknown';
        payload.metrics = season.finalMetrics || season.currentMetrics || payload.metrics;
        payload.mainMetrics = _mainMetricsForSnapshot(season, payload.metrics || {});
        payload.auxiliaryMetrics = _auxiliaryMetricsForSnapshot(payload.metrics || {}, payload.confidence || 'low');
        payload.scoreBreakdown = season.scoreBreakdown || payload.metrics && payload.metrics.scoreBreakdown || payload.scoreBreakdown || null;
        payload.validatedImpactSignals = season.validatedImpactSignals || payload.metrics && payload.metrics.validatedImpactSignals || payload.validatedImpactSignals || null;
        payload.riskContext = season.riskContext || payload.metrics && payload.metrics.riskContext || payload.riskContext || null;
        payload.seasonReading = season.seasonReading || payload.metrics && payload.metrics.seasonReading || payload.seasonReading || null;
        payload.insights = _finalInsights(season);
        return DB.add('season_metrics_snapshots', payload);
      });
    });
  }

  function _finalInsights(season) {
    var summary = season.finalSummary || {};
    return [
      { type: 'final_result', title: season.finalResult || 'Resultado final', message: summary.evolution || '' },
      { type: 'next_season', title: 'Próxima temporada sugerida', message: _objectiveLabel(summary.nextSeasonSuggestion || '') }
    ];
  }

  function _loadScoreOrders(season) {
    var period = _seasonPeriod(season);
    return _loadSeasonOrdersForRange(period.baselineStart, period.currentEnd);
  }

  function _loadSeasonOrdersForRange(start, end) {
    if (!window.DB || typeof DB.getAll !== 'function') return Promise.resolve([]);
    return DB.getAll('orders').then(function (orders) {
      return _ordersInPeriod(orders || [], start, end);
    }).catch(function (err) {
      console.warn('Temporadas orders range load skipped', err);
      return [];
    });
  }

  function _calculateSeasonScore(season, allOrders, actionContext) {
    var period = _seasonPeriod(season);
    var currentOrders = _ordersInPeriod(allOrders || [], period.start, period.currentEnd);
    var baselineOrders = _ordersInPeriod(allOrders || [], period.baselineStart, period.start);
    var current = _buildRuntimeMetrics(currentOrders, period.elapsedDays || 1, actionContext || {});
    var baseline = _buildRuntimeMetrics(baselineOrders, period.durationDays || 30, actionContext || {});
    var validatedImpactSignals = _calculateValidatedImpactSignals(currentOrders, season, baseline, actionContext || {});
    current.lowSellingProducts = validatedImpactSignals.products && validatedImpactSignals.products.lowSellingProducts || [];
    var target = _targetValueForSeason(season);
    var primaryValue = _primaryValueForObjective(current, season.objective);
    var progressPercent = target > 0 ? (primaryValue / target) * 100 : 0;
    var score = _scoreByObjective(season, current, baseline, target, period);
    var pace = _paceStatus(progressPercent, period, current, season);
    var status = pace.status;
    var recentDrop = _hasRecentDrop(season, allOrders || [], period);
    var risk = _riskFromProgress(progressPercent, period, recentDrop, season);
    var riskContext = {
      coreObjectiveScore: score,
      riskLevel: risk,
      recentDrop: recentDrop,
      progressRatio: pace.progressRatio,
      progressPercent: progressPercent,
      daysRemaining: period.daysRemaining
    };
    var scoreBreakdown = _calculateSeasonScoreBreakdown(season, current, validatedImpactSignals, riskContext);
    var seasonReadingMetrics = Object.assign({}, current, {
      currentValue: primaryValue,
      targetValue: target,
      progressRatio: pace.progressRatio,
      expectedProgress: pace.expectedProgress,
      daysRemaining: period.daysRemaining,
      validatedImpactSignals: validatedImpactSignals,
      scoreBreakdown: scoreBreakdown,
      actionOpportunities: _buildActionOpportunities(current, validatedImpactSignals, actionContext || {}, season)
    });
    var executionPlan = _buildSeasonExecutionPlan(season, seasonReadingMetrics, validatedImpactSignals, riskContext);
    seasonReadingMetrics.executionPlan = executionPlan;
    var seasonReading = _generateSeasonReading(season, seasonReadingMetrics, scoreBreakdown, validatedImpactSignals, {
      riskLevel: risk,
      recentDrop: recentDrop,
      progressRatio: pace.progressRatio,
      progressPercent: progressPercent,
      daysRemaining: period.daysRemaining
    });
    if (executionPlan.actions && executionPlan.actions[0] && executionPlan.actions[0].description) {
      seasonReading.nextAction = executionPlan.actions[0].description;
      seasonReading.executionPlan = executionPlan;
    }
    var actionTaskState = _reconcileSeasonActionTasks(season, executionPlan, currentOrders);
    if (actionTaskState.hasArchived) {
      var advancedSeason = Object.assign({}, season, {
        actionTasks: actionTaskState.activeTasks,
        actionTaskHistory: actionTaskState.history
      });
      executionPlan = _buildSeasonExecutionPlan(advancedSeason, seasonReadingMetrics, validatedImpactSignals, riskContext);
      actionTaskState = _reconcileSeasonActionTasks(advancedSeason, executionPlan, currentOrders);
    }
    var actionTasks = actionTaskState.activeTasks;
    var actionTaskHistory = actionTaskState.history;
    executionPlan.actionTasks = actionTasks;
    executionPlan.actionTaskHistory = actionTaskHistory;
    seasonReadingMetrics.executionPlan = executionPlan;
    seasonReading.executionPlan = executionPlan;

    return {
      currentScore: scoreBreakdown.finalScore,
      currentStatus: status,
      riskLevel: risk,
      progressPercent: Math.max(0, progressPercent),
      scoreBreakdown: scoreBreakdown,
      validatedImpactSignals: validatedImpactSignals,
      riskContext: riskContext,
      seasonReading: seasonReading,
      executionPlan: executionPlan,
      actionTasks: actionTasks,
      actionTaskHistory: actionTaskHistory,
      currentMetrics: {
        currentValue: primaryValue,
        targetValue: target,
        revenue: current.revenue,
        orders: current.orders,
        averageTicket: current.averageTicket,
        activeDays: current.activeDays,
        recurringCustomers: current.recurringCustomers,
        repurchaseRate: current.repurchaseRate,
        averageFrequency: current.averageFrequency,
        averageItemsPerOrder: current.averageItemsPerOrder,
        weeklyRegularity: current.weeklyRegularity,
        weakDays: current.weakDays,
        strongHours: current.strongHours || [],
        topProducts: current.topProducts || [],
        lowSellingProducts: current.lowSellingProducts || [],
        channelBreakdown: current.channelBreakdown || [],
        couponUsage: current.couponUsage || 0,
        couponDiscount: current.couponDiscount || 0,
        promotionDiscount: current.promotionDiscount || 0,
        upsellAcceptedCount: current.upsellAcceptedCount || 0,
        upsellDiscount: current.upsellDiscount || 0,
        upsellAddedRevenue: current.upsellAddedRevenue || 0,
        pointsRedemption: current.pointsRedemption || 0,
        pointsDiscount: current.pointsDiscount || 0,
        actionOpportunities: seasonReadingMetrics.actionOpportunities || {},
        validatedImpactSignals: validatedImpactSignals,
        riskContext: riskContext,
        scoreBreakdown: scoreBreakdown,
        seasonReading: seasonReading,
        executionPlan: executionPlan,
        actionTasks: actionTasks,
        actionTaskHistory: actionTaskHistory,
        elapsedDays: period.elapsedDays,
        daysRemaining: period.daysRemaining,
        expectedProgress: pace.expectedProgress,
        progressRatio: pace.progressRatio,
        observations: _metricObservations(season, current)
      }
    };
  }

  function _seasonPeriod(season) {
    var now = new Date();
    var start = _toDate(season.startDate || season.startedAt || season.createdAt) || now;
    var configuredEnd = _toDate(season.endDate);
    var duration = _durationDays(season);
    var end = configuredEnd || new Date(start.getTime() + duration * 86400000);
    var currentEnd = now < end ? now : end;
    if (currentEnd < start) currentEnd = start;

    var elapsedMs = Math.max(0, currentEnd.getTime() - start.getTime());
    var totalMs = Math.max(86400000, end.getTime() - start.getTime());
    var baselineStart = new Date(start.getTime());
    baselineStart.setDate(baselineStart.getDate() - duration);

    return {
      start: start,
      end: end,
      currentEnd: currentEnd,
      baselineStart: baselineStart,
      durationDays: duration,
      elapsedDays: Math.max(1, Math.ceil(elapsedMs / 86400000)),
      daysRemaining: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)),
      expectedProgress: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
    };
  }

  function _durationDays(season) {
    if (season.durationType === 'season') return 90;
    if (season.durationType === 'sprint') return 30;
    var start = _toDate(season.startDate || season.startedAt);
    var end = _toDate(season.endDate);
    if (start && end) return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    return 30;
  }

  function _buildRuntimeMetrics(orders, days, actionContext) {
    var base = _buildBaselineMetrics(orders, days);
    var customers = {};
    var products = {};
    var hours = {};
    var channels = {};
    var couponUsage = 0;
    var couponDiscount = 0;
    var promotionDiscount = 0;
    var upsellAcceptedCount = 0;
    var upsellDiscount = 0;
    var upsellAddedRevenue = 0;
    var pointsRedemption = 0;
    var pointsDiscount = 0;
    (orders || []).forEach(function (order) {
      var normalized = _normalizeSeasonOrder(order);
      if (!normalized) return;
      var key = normalized.customerKey;
      if (key) customers[key] = (customers[key] || 0) + 1;
      if (!channels[normalized.channel]) channels[normalized.channel] = { channel: normalized.channel, orders: 0, revenue: 0 };
      channels[normalized.channel].orders += 1;
      channels[normalized.channel].revenue += normalized.total;
      if (normalized.couponCode || normalized.couponDiscount > 0) couponUsage += 1;
      couponDiscount += normalized.couponDiscount;
      promotionDiscount += normalized.promotionDiscount;
      if (normalized.upsellAccepted) upsellAcceptedCount += 1;
      upsellDiscount += normalized.upsellDiscount;
      upsellAddedRevenue += normalized.upsellAddedRevenue;
      pointsRedemption += normalized.pointsRedemption;
      pointsDiscount += normalized.pointsDiscount;
      _orderProducts(normalized).forEach(function (product) {
        var name = product.name || 'Produto sem nome';
        if (!products[name]) products[name] = { name: name, quantity: 0, revenue: 0 };
        products[name].quantity += product.quantity;
        products[name].revenue += product.revenue;
      });
      var hour = _orderHour(normalized);
      if (hour !== null) {
        if (!hours[hour]) hours[hour] = { hour: hour, orders: 0, revenue: 0 };
        hours[hour].orders += 1;
        hours[hour].revenue += normalized.total;
      }
    });
    var customerKeys = Object.keys(customers);
    var frequencyTotal = customerKeys.reduce(function (sum, key) { return sum + customers[key]; }, 0);
    var weakDays = base.baselineOrders > 0 ? Math.max(0, _number(days, 0) - base.baselineActiveDays) : 0;
    var topProducts = Object.keys(products).map(function (key) { return products[key]; }).sort(function (a, b) {
      return b.quantity - a.quantity || b.revenue - a.revenue;
    }).slice(0, 5);
    var strongHours = Object.keys(hours).map(function (key) { return hours[key]; }).sort(function (a, b) {
      return b.orders - a.orders || b.revenue - a.revenue;
    }).slice(0, 5);
    var channelBreakdown = Object.keys(channels).map(function (key) { return channels[key]; }).sort(function (a, b) {
      return b.revenue - a.revenue || b.orders - a.orders;
    });

    return {
      revenue: base.baselineRevenue,
      orders: base.baselineOrders,
      averageTicket: base.baselineAverageTicket,
      averageItemsPerOrder: base.baselineAverageItemsPerOrder,
      activeDays: base.baselineActiveDays,
      recurringCustomers: base.baselineRecurringCustomers,
      repurchaseRate: base.baselineRepurchaseRate,
      averageFrequency: customerKeys.length ? frequencyTotal / customerKeys.length : 0,
      weakDays: weakDays,
      weeklyRegularity: _weeklyRegularity(orders),
      strongHours: strongHours,
      topProducts: topProducts,
      lowSellingProducts: [],
      channelBreakdown: channelBreakdown,
      couponUsage: couponUsage,
      couponDiscount: couponDiscount,
      promotionDiscount: promotionDiscount,
      upsellAcceptedCount: upsellAcceptedCount,
      upsellDiscount: upsellDiscount,
      upsellAddedRevenue: upsellAddedRevenue,
      pointsRedemption: pointsRedemption,
      pointsDiscount: pointsDiscount,
      realMenuCombinations: _realMenuCombinationSignals(orders || [], actionContext || {}, 8)
    };
  }

  function _scoreByObjective(season, current, baseline, target, period) {
    if (season.objective === 'sell_more') {
      var revenueTarget = target || _derivedTarget(season.baselineRevenue, current.revenue);
      var orderTarget = _derivedTarget(season.baselineOrders, current.orders);
      var activeDaysTarget = Math.min(period.durationDays, _derivedTarget(season.baselineActiveDays, current.activeDays));
      return _weightedScore([
        { value: current.revenue, target: revenueTarget, weight: 45 },
        { value: current.orders, target: orderTarget, weight: 35 },
        { value: current.activeDays, target: activeDaysTarget, weight: 20 }
      ]);
    }

    if (season.objective === 'increase_ticket') {
      var ticketTarget = target || _derivedTarget(season.baselineAverageTicket, current.averageTicket);
      var orderValueTarget = _derivedTarget(season.baselineAverageTicket, current.averageTicket);
      var itemsTarget = _derivedTarget(baseline.averageItemsPerOrder, current.averageItemsPerOrder);
      return _weightedScore([
        { value: current.averageTicket, target: ticketTarget, weight: 50 },
        { value: current.averageTicket, target: orderValueTarget, weight: 25 },
        { value: current.averageItemsPerOrder, target: itemsTarget, weight: 25 }
      ]);
    }

    if (season.objective === 'retain_customers') {
      var recurringTarget = target || _derivedTarget(season.baselineRecurringCustomers, current.recurringCustomers);
      var repurchaseTarget = _derivedTarget(season.baselineRepurchaseRate, current.repurchaseRate);
      var frequencyTarget = _derivedTarget(baseline.averageFrequency, current.averageFrequency);
      return _weightedScore([
        { value: current.recurringCustomers, target: recurringTarget, weight: 45 },
        { value: current.repurchaseRate, target: repurchaseTarget, weight: 35 },
        { value: current.averageFrequency, target: frequencyTarget, weight: 20 }
      ]);
    }

    if (season.objective === 'improve_consistency') {
      var activeTarget = target || _derivedTarget(season.baselineActiveDays, current.activeDays);
      var weakBaseline = Math.max(1, baseline.weakDays);
      var weakReductionScore = current.weakDays <= weakBaseline ? 100 : Math.max(0, (weakBaseline / Math.max(1, current.weakDays)) * 100);
      return _weightedScore([
        { value: current.activeDays, target: activeTarget, weight: 40 },
        { value: current.weeklyRegularity, target: 1, weight: 35 },
        { score: weakReductionScore, weight: 25 }
      ]);
    }

    return target > 0 ? _clamp((_primaryValueForObjective(current, season.objective) / target) * 100, 0, 100) : 0;
  }

  function _weightedScore(parts) {
    var totalWeight = 0;
    var totalScore = 0;
    (parts || []).forEach(function (part) {
      var weight = _number(part.weight, 0);
      if (!weight) return;
      totalWeight += weight;
      var score = part.score !== undefined ? _number(part.score, 0) : _ratioScore(part.value, part.target);
      totalScore += _clamp(score, 0, 100) * weight;
    });
    return totalWeight ? totalScore / totalWeight : 0;
  }

  function _ratioScore(value, target) {
    value = _number(value, 0);
    target = _number(target, 0);
    if (target <= 0) return value > 0 ? 100 : 0;
    return (value / target) * 100;
  }

  function _targetValueForSeason(season) {
    var calculated = _nullableNumber(season.calculatedTargetValue);
    if (calculated !== null && calculated > 0) return calculated;
    var fixed = _nullableNumber(season.targetValue);
    return fixed !== null && fixed > 0 ? fixed : 0;
  }

  function _primaryValueForObjective(metrics, objective) {
    if (objective === 'sell_more') return _number(metrics.revenue, 0);
    if (objective === 'increase_ticket') return _number(metrics.averageTicket, 0);
    if (objective === 'retain_customers') return _number(metrics.recurringCustomers, 0) || _number(metrics.repurchaseRate, 0);
    if (objective === 'improve_consistency') return _number(metrics.activeDays, 0);
    return 0;
  }

  function _derivedTarget(base, current) {
    base = _number(base, 0);
    if (base > 0) return base;
    current = _number(current, 0);
    return current > 0 ? current : 1;
  }

  function _statusFromScore(score) {
    score = _number(score, 0);
    if (score >= 85) return 'Excelente';
    if (score >= 65) return 'Estável';
    if (score >= 40) return 'Instável';
    return 'Crítico';
  }

  function _paceStatus(progressPercent, period, current, season) {
    var expected = _expectedProgressForPace(period);
    var progress = Math.max(0, _number(progressPercent, 0));
    var ratio = expected > 0 ? progress / expected : (progress > 0 ? 1 : 0);
    var elapsed = _number(period.elapsedDays, 1);
    var grace = _criticalGraceDays(period);
    var hasEnoughData = _hasEnoughRuntimeData(current, season);

    if (elapsed <= 1) {
      return { status: 'starting', expectedProgress: 0, progressRatio: ratio };
    }

    if (!hasEnoughData && elapsed <= 1) {
      return { status: 'starting', expectedProgress: expected, progressRatio: ratio };
    }

    if (ratio >= 1.10) return { status: 'Excelente', expectedProgress: expected, progressRatio: ratio };
    if (ratio >= .80) return { status: 'Estável', expectedProgress: expected, progressRatio: ratio };
    if (ratio >= .50) return { status: 'Instável', expectedProgress: expected, progressRatio: ratio };
    if (elapsed <= grace) return { status: hasEnoughData ? 'Instável' : 'starting', expectedProgress: expected, progressRatio: ratio };
    return { status: 'Crítico', expectedProgress: expected, progressRatio: ratio };
  }

  function _expectedProgressForPace(period) {
    var elapsed = Math.max(1, _number(period.elapsedDays, 1));
    var duration = Math.max(1, _number(period.durationDays, 30));
    if (elapsed <= 1) return 0;
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  }

  function _criticalGraceDays(period) {
    return _number(period.durationDays, 30) >= 90 ? 7 : 3;
  }

  function _hasEnoughRuntimeData(current, season) {
    if (!current) return false;
    if (_number(current.orders, 0) > 0) return true;
    if (season && season.objective === 'improve_consistency' && _number(current.activeDays, 0) > 0) return true;
    return false;
  }

  function _statusScoreLabel(value) {
    return ({
      excellent: 'Excelente',
      stable: 'Estável',
      unstable: 'Instável',
      critical: 'Crítico',
      pending: 'Inicial',
      starting: 'Em início',
      Excelente: 'Excelente',
      'Estável': 'Estável',
      'Instável': 'Instável',
      'Crítico': 'Crítico',
      'Em início': 'Em início'
    })[value] || value || 'Inicial';
  }

  function _riskFromProgress(progressPercent, period, recentDrop, season) {
    var progress = _clamp(progressPercent, 0, 100);
    var expected = _expectedProgressForPace(period);
    var gap = expected - progress;
    var baseRisk = _normalizeRisk((season && (season.initialRiskLevel || season.riskLevel)) || 'unknown');
    var dynamicRisk = 'low';
    var elapsed = _number(period.elapsedDays, 1);
    var grace = _criticalGraceDays(period);

    if (elapsed <= grace && progress <= expected) {
      return baseRisk;
    }

    if (period.daysRemaining <= 0 && progress < 75) dynamicRisk = 'very_high';
    else if (gap <= 0) dynamicRisk = 'low';
    else if (gap <= 15) dynamicRisk = 'medium';
    else if (gap <= 35) dynamicRisk = 'high';
    else dynamicRisk = 'very_high';

    var risk = _maxRisk(baseRisk, dynamicRisk);
    if (recentDrop && elapsed > grace) risk = _escalateRisk(risk);
    return risk;
  }

  function _normalizeRisk(value) {
    return ({ low: 'low', medium: 'medium', high: 'high', very_high: 'very_high', unknown: 'unknown' })[value] || 'unknown';
  }

  function _riskRank(value) {
    return ({ unknown: 0, low: 1, medium: 2, high: 3, very_high: 4 })[_normalizeRisk(value)] || 0;
  }

  function _maxRisk(a, b) {
    return _riskRank(a) >= _riskRank(b) ? _normalizeRisk(a) : _normalizeRisk(b);
  }

  function _hasRecentDrop(season, orders, period) {
    var end = period.currentEnd;
    var recentStart = new Date(end.getTime());
    recentStart.setDate(recentStart.getDate() - 7);
    var previousStart = new Date(recentStart.getTime());
    previousStart.setDate(previousStart.getDate() - 7);

    var recent = _buildRuntimeMetrics(_ordersInPeriod(orders, recentStart, end), 7);
    var previous = _buildRuntimeMetrics(_ordersInPeriod(orders, previousStart, recentStart), 7);
    var recentValue = _primaryValueForObjective(recent, season.objective);
    var previousValue = _primaryValueForObjective(previous, season.objective);
    return previousValue > 0 && recentValue < previousValue * .75;
  }

  function _escalateRisk(risk) {
    if (risk === 'low') return 'medium';
    if (risk === 'medium') return 'high';
    if (risk === 'high') return 'very_high';
    return risk || 'unknown';
  }

  function _weeklyRegularity(orders) {
    var weeks = {};
    (orders || []).forEach(function (order) {
      var date = _orderDate(order);
      if (!date) return;
      var weekStart = new Date(date.getTime());
      weekStart.setDate(date.getDate() - date.getDay());
      var key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    var counts = Object.keys(weeks).map(function (key) { return weeks[key]; });
    if (!counts.length) return 0;
    if (counts.length === 1) return 1;
    var avg = counts.reduce(function (sum, value) { return sum + value; }, 0) / counts.length;
    if (!avg) return 0;
    var variance = counts.reduce(function (sum, value) {
      var diff = value - avg;
      return sum + diff * diff;
    }, 0) / counts.length;
    return _clamp(1 - (Math.sqrt(variance) / avg), 0, 1);
  }

  function _orderItemCount(order) {
    var normalized = order && order.raw ? order : _normalizeSeasonOrder(order);
    var items = normalized ? normalized.items : [];
    var raw = normalized && normalized.raw ? normalized.raw : order;
    if (!Array.isArray(items)) return _number(raw && (raw.itemsCount || raw.itemCount || raw.quantity || 1), 1);
    if (!items.length) return 1;
    return items.reduce(function (sum, item) {
      return sum + Math.max(1, _number(item.quantity, 1));
    }, 0);
  }

  function _orderProducts(order) {
    var normalized = order && order.raw ? order : _normalizeSeasonOrder(order);
    var items = normalized ? normalized.items : [];
    if (!Array.isArray(items)) return [];
    return items.map(function (item) {
      var name = item.name || '';
      var quantity = Math.max(1, _number(item.quantity, 1));
      var revenue = _money(item.total || 0);
      return { name: String(name || 'Produto sem nome').slice(0, 90), quantity: quantity, revenue: revenue };
    }).filter(function (item) { return item.name; });
  }

  function _metricObservations(season, current) {
    var notes = [];
    if (season.objective === 'increase_ticket' && current.averageItemsPerOrder <= 1) {
      notes.push('upsell_fallback_items_per_order');
    }
    if (season.objective === 'retain_customers' && !current.recurringCustomers) {
      notes.push('retention_fallback_customer_phone_or_email');
    }
    return notes;
  }

  function _shouldPersistMetrics(season, updates) {
    if (Math.round(_number(season.currentScore, -1)) !== Math.round(_number(updates.currentScore, -1))) return true;
    if (season.currentStatus !== updates.currentStatus) return true;
    if (season.riskLevel !== updates.riskLevel) return true;
    if (Math.abs(_number(season.progressPercent, 0) - _number(updates.progressPercent, 0)) >= .1) return true;
    if (updates.goalReachedAt && !season.goalReachedAt) return true;
    if (updates.goalCelebrationPending !== undefined && updates.goalCelebrationPending !== season.goalCelebrationPending) return true;
    if (JSON.stringify(season.scoreBreakdown || null) !== JSON.stringify(updates.scoreBreakdown || null)) return true;
    if (JSON.stringify(season.validatedImpactSignals || null) !== JSON.stringify(updates.validatedImpactSignals || null)) return true;
    if (JSON.stringify(season.riskContext || null) !== JSON.stringify(updates.riskContext || null)) return true;
    if (JSON.stringify(season.seasonReading || null) !== JSON.stringify(updates.seasonReading || null)) return true;
    if (JSON.stringify(season.executionPlan || null) !== JSON.stringify(updates.executionPlan || null)) return true;
    if (JSON.stringify(season.actionTasks || null) !== JSON.stringify(updates.actionTasks || null)) return true;
    if (JSON.stringify(season.actionTaskHistory || null) !== JSON.stringify(updates.actionTaskHistory || null)) return true;
    return JSON.stringify(season.currentMetrics || {}) !== JSON.stringify(updates.currentMetrics || {});
  }

  function _resolveActiveSeason(seasons) {
    return (seasons || []).filter(function (season) { return season.status === 'active'; }).sort(function (a, b) {
      return _dateValue(b.startedAt || b.startDate || b.createdAt) - _dateValue(a.startedAt || a.startDate || a.createdAt);
    })[0] || null;
  }

  function _refreshSeasonStateFlags() {
    _state.activeSeason = _resolveActiveSeason(_state.seasons);
    _state.activeConflict = (_state.seasons || []).filter(function (season) { return season.status === 'active'; }).length > 1;
    _state.scheduledStartConflict = _hasDueScheduled(_state.seasons) && !!_state.activeSeason;
  }

  function _historySeasons() {
    return (_state.seasons || []).filter(function (season) {
      return season.status === 'finished' || season.status === 'abandoned';
    });
  }

  function _scheduledSeasons() {
    return (_state.seasons || []).filter(function (season) {
      return season.status === 'scheduled';
    }).sort(function (a, b) {
      return _dateValue(a.startDate || a.createdAt) - _dateValue(b.startDate || b.createdAt);
    });
  }

  function _hasDueScheduled(seasons) {
    var today = _dayStart(new Date());
    return (seasons || []).some(function (season) {
      var start = _toDate(season.startDate);
      return season.status === 'scheduled' && start && start <= today;
    });
  }

  function _promoteDueScheduledSeasons(seasons) {
    seasons = _normalizeSeasons(seasons || []);
    if (!window.DB || typeof DB.update !== 'function') return Promise.resolve(seasons);
    if (_resolveActiveSeason(seasons)) return Promise.resolve(seasons);
    var today = _dayStart(new Date());
    var due = seasons.filter(function (season) {
      var start = _toDate(season.startDate);
      return season.status === 'scheduled' && start && start <= today;
    }).sort(function (a, b) {
      return _dateValue(a.startDate || a.createdAt) - _dateValue(b.startDate || b.createdAt);
    })[0];
    if (!due || !due.id) return Promise.resolve(seasons);

    var now = new Date().toISOString();
    var patch = {
      status: 'active',
      startedAt: now,
      updatedAt: now
    };
    return DB.update('seasons', due.id, patch).then(function () {
      return seasons.map(function (season) {
        return season.id === due.id ? Object.assign({}, season, patch) : season;
      });
    }).catch(function (err) {
      console.warn('Temporadas scheduled promotion skipped', err);
      return seasons;
    });
  }

  function createSeason(data) {
    return _assertReady().then(function () {
      var payload = _normalizeSeasonPayload(data || {});
      return _assertNoOverlappingSeason(payload).then(function () {
        if (payload.status === 'active') {
          return _assertNoActiveSeason().then(function () {
            return DB.add('seasons', payload);
          });
        }
        return DB.add('seasons', payload);
      });
    }).then(function (ref) {
      return _loadSeasonsPromise().then(function () { return ref; });
    });
  }

  function updateSeason(id, data) {
    return _assertReady().then(function () {
      if (!id) throw new Error('Temporada sem id.');
      return DB.getDoc('seasons', id);
    }).then(function (season) {
      if (!season) throw new Error('Temporada não encontrada.');
      if (season.tenantId && season.tenantId !== _tenantId) throw new Error('Temporada pertence a outro tenant.');
      if (season.status === 'active') throw new Error('Temporada ativa não pode ser editada.');
      if (season.status === 'finished') throw new Error('Temporada finalizada não pode ser editada.');
      if (season.status === 'abandoned') throw new Error('Temporada abandonada não pode ser reativada.');

      var next = _normalizeSeasonPayload(Object.assign({}, season, data || {}), { partial: true });
      if (next.status === 'active' || next.status === 'scheduled') {
        return _assertNoOverlappingSeason(next, id).then(function () {
          if (next.status !== 'active') return true;
          return _assertNoActiveSeason(id);
        }).then(function () {
          return DB.update('seasons', id, next).then(function () {
            if (next.status === 'abandoned') return _registerSeasonMaturityImpact(Object.assign({}, next, { id: id }), 'season_abandoned');
            return null;
          });
        });
      }
      return DB.update('seasons', id, next).then(function () {
        if (next.status === 'abandoned') return _registerSeasonMaturityImpact(Object.assign({}, next, { id: id }), 'season_abandoned');
        return null;
      });
    }).then(function () {
      return _loadSeasonsPromise();
    });
  }

  function getActiveSeason() {
    return _assertReady().then(function () {
      return DB.getAll('seasons');
    }).then(function (seasons) {
      return _resolveActiveSeason(_normalizeSeasons(seasons || []));
    });
  }

  function listSeasons() {
    return _assertReady().then(function () {
      return DB.getAll('seasons');
    }).then(function (seasons) {
      return _normalizeSeasons(seasons || []);
    });
  }

  function _assertReady() {
    _tenantId = (window.Auth && typeof Auth.getTenantId === 'function') ? (Auth.getTenantId() || '') : '';
    if (!_tenantId) return Promise.reject(new Error('Tenant não identificado.'));
    if (!window.DB || typeof DB.getAll !== 'function' || typeof DB.add !== 'function') {
      return Promise.reject(new Error('DB indisponível.'));
    }
    return Promise.resolve();
  }

  function _assertNoActiveSeason(ignoreId) {
    return DB.getAll('seasons').then(function (seasons) {
      var active = _normalizeSeasons(seasons || []).filter(function (season) {
        return season.status === 'active' && season.id !== ignoreId;
      });
      if (active.length) throw new Error('Já existe uma temporada ativa neste tenant.');
      return true;
    });
  }

  function _assertNoOverlappingSeason(candidate, ignoreId) {
    if (!candidate || (candidate.status !== 'active' && candidate.status !== 'scheduled')) return Promise.resolve(true);
    var cStart = _toDate(candidate.startDate || candidate.startedAt || candidate.createdAt);
    var cEnd = _toDate(candidate.endDate);
    if (!cStart || !cEnd) return Promise.resolve(true);
    return DB.getAll('seasons').then(function (seasons) {
      var conflict = _normalizeSeasons(seasons || []).filter(function (season) {
        if (!season || season.id === ignoreId) return false;
        if (season.status !== 'active' && season.status !== 'scheduled') return false;
        var sStart = _toDate(season.startDate || season.startedAt || season.createdAt);
        var sEnd = _toDate(season.endDate);
        return sStart && sEnd && _periodsOverlap(cStart, cEnd, sStart, sEnd);
      })[0];
      if (conflict) throw new Error('Já existe uma temporada programada ou ativa nesse período. Escolha outra data.');
      return true;
    });
  }

  function _loadSeasonsPromise() {
    return listSeasons().then(function (seasons) {
      _state.seasons = seasons;
      _refreshSeasonStateFlags();
      _paint();
      return seasons;
    });
  }

  function _normalizeSeasonPayload(data, opts) {
    opts = opts || {};
    var status = ALLOWED_STATUS[data.status] ? data.status : 'draft';
    var payload = {
      tenantId: _tenantId,
      title: String(data.title || '').trim() || 'Temporada',
      objective: data.objective || '',
      build: data.build || '',
      difficulty: data.difficulty || '',
      durationType: data.durationType || '',
      targetMode: data.targetMode || '',
      targetValue: _nullableNumber(data.targetValue),
      targetMetric: data.targetMetric || '',
      planConnection: data.planConnection || null,
      baselinePeriod: data.baselinePeriod || '',
      baselineValue: _nullableNumber(data.baselineValue),
      baselineRevenue: _number(data.baselineRevenue, 0),
      baselineOrders: _number(data.baselineOrders, 0),
      baselineAverageTicket: _number(data.baselineAverageTicket, 0),
      baselineActiveDays: _number(data.baselineActiveDays, 0),
      baselineRecurringCustomers: _number(data.baselineRecurringCustomers, 0),
      baselineRepurchaseRate: _number(data.baselineRepurchaseRate, 0),
      baselineConfidence: data.baselineConfidence || 'low',
      calculatedTargetValue: _nullableNumber(data.calculatedTargetValue),
      initialRiskLevel: data.initialRiskLevel || data.riskLevel || 'unknown',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      status: status,
      currentScore: _number(data.currentScore, 0),
      currentStatus: data.currentStatus || (status === 'active' ? 'pending' : 'Inicial'),
      riskLevel: data.riskLevel || data.initialRiskLevel || 'unknown',
      progressPercent: _number(data.progressPercent, 0),
      scoreBreakdown: data.scoreBreakdown || null,
      validatedImpactSignals: data.validatedImpactSignals || null,
      riskContext: data.riskContext || null,
      seasonReading: data.seasonReading || null,
      executionPlan: data.executionPlan || null,
      actionTasks: Array.isArray(data.actionTasks) ? data.actionTasks : [],
      actionTaskHistory: Array.isArray(data.actionTaskHistory) ? data.actionTaskHistory : [],
      goalReachedAt: data.goalReachedAt || null,
      goalCelebrationShownAt: data.goalCelebrationShownAt || null,
      goalCelebrationPending: data.goalCelebrationPending === true,
      goalReachedSnapshotId: data.goalReachedSnapshotId || '',
      startedAt: data.startedAt || (status === 'active' ? new Date().toISOString() : null),
      finishedAt: data.finishedAt || null,
      abandonedAt: data.abandonedAt || null
    };
    payload.updatedAt = new Date().toISOString();
    if (!opts.partial) payload.createdAt = data.createdAt || new Date().toISOString();
    return payload;
  }

  function _statusLabel(status) {
    return ({ draft: 'Rascunho', scheduled: 'Programada', active: 'Ativa', finished: 'Finalizada', abandoned: 'Abandonada' })[status] || 'Rascunho';
  }

  function _objectiveLabel(value) {
    return ({
      sell_more: 'Vender Mais',
      increase_ticket: 'Aumentar Ticket',
      retain_customers: 'Fidelizar Clientes',
      improve_consistency: 'Melhorar Consistência'
    })[value] || value || 'Não definido';
  }

  function _buildLabel(value) {
    return ({ volume: 'Mais movimento', margin: 'Melhor sobra', retention: 'Clientes voltando' })[value] || value || 'Não definido';
  }

  function _difficultyLabel(value) {
    return ({ safe: 'Seguro', balanced: 'Equilibrado', aggressive: 'Agressivo' })[value] || value || 'Não definido';
  }

  function _riskLabel(value) {
    return ({ low: 'Baixo', medium: 'Médio', high: 'Alto', very_high: 'Muito alto', unknown: 'Indefinido' })[value] || 'Indefinido';
  }

  function _confidenceLabel(value) {
    return ({ high: 'Alta', medium: 'Média', low: 'Baixa' })[value] || 'Baixa';
  }

  function _formatBaselineValue(value, objective) {
    var n = _number(value, 0);
    if (objective === 'sell_more' || objective === 'increase_ticket') return _fmtMoney(n);
    if (objective === 'retain_customers') return n < 1 && n > 0 ? Math.round(n * 100) + '%' : String(Math.round(n));
    if (objective === 'improve_consistency') return Math.round(n) + ' dia' + (Math.round(n) === 1 ? '' : 's');
    return String(Math.round(n));
  }

  function _formatMetricValue(value, objective) {
    var n = _number(value, 0);
    if (objective === 'sell_more' || objective === 'increase_ticket') return _fmtMoney(n);
    if (objective === 'retain_customers') return n < 1 && n > 0 ? Math.round(n * 100) + '%' : String(Math.round(n));
    if (objective === 'improve_consistency') return Math.round(n) + ' dia' + (Math.round(n) === 1 ? '' : 's');
    return String(Math.round(n));
  }

  function _snapshotUpdatedLabel(snapshots) {
    snapshots = snapshots || {};
    var dates = [snapshots.daily && snapshots.daily.createdAt, snapshots.weekly && snapshots.weekly.createdAt]
      .map(_toDate)
      .filter(Boolean)
      .sort(function (a, b) { return b.getTime() - a.getTime(); });
    if (!dates.length) return 'Ainda não gerada';
    return _formatDateTime(dates[0]);
  }

  function _fmtMoney(value) {
    if (window.UI && typeof UI.fmt === 'function') return UI.fmt(_number(value, 0));
    return '€ ' + _number(value, 0).toFixed(2).replace('.', ',');
  }

  function _formatPeriod(start, end) {
    var s = _formatDate(start);
    var e = _formatDate(end);
    if (s && e) return s + ' até ' + e;
    if (s) return 'Início em ' + s;
    if (e) return 'Até ' + e;
    return 'Período não definido';
  }

  function _formatDate(value) {
    var d = _toDate(value);
    if (!d) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function _formatDateTime(value) {
    var d = _toDate(value);
    if (!d) return '';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function _dateKey(value) {
    var d = _toDate(value) || new Date();
    return d.toISOString().slice(0, 10);
  }

  function _todayKey() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  function _dayStart(value) {
    var d = _toDate(value) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function _dayEnd(value) {
    var d = _dayStart(value);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function _addDays(value, days) {
    var d = _toDate(value) || new Date();
    var next = new Date(d.getTime());
    next.setDate(next.getDate() + _number(days, 0));
    return next;
  }

  function _weekStart(value) {
    var d = _dayStart(value);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function _dateValue(value) {
    var d = _toDate(value);
    return d ? d.getTime() : 0;
  }

  function _toDate(value) {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function _nullableNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function _number(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  function _clamp(value, min, max) {
    return Math.max(min, Math.min(max, _number(value, 0)));
  }

  function _icon(name) {
    var paths = {
      add: '<path d="M12 5v14M5 12h14"/>',
      analytics: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/>',
      assistant_direction: '<path d="M12 3l2.2 5.4L20 10.5l-5.4 2.2L12 19l-2.6-6.3L4 10.5l5.8-2.1L12 3z"/><path d="M18 16l2 2"/><path d="M4 18l2-2"/>',
      check_circle: '<path d="M20 11.1V12a8 8 0 1 1-4.7-7.3"/><path d="M9 11.5l2 2L20 4.5"/>',
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      dashboard: '<path d="M4 5h7v7H4z"/><path d="M13 5h7v4h-7z"/><path d="M13 11h7v8h-7z"/><path d="M4 14h7v5H4z"/>',
      error: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
      event: '<path d="M7 3v4M17 3v4"/><path d="M4 8h16"/><path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
      event_upcoming: '<path d="M7 3v4M17 3v4"/><path d="M4 8h16"/><path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M9 14l2 2 4-5"/>',
      flag: '<path d="M6 21V4"/><path d="M6 5h10l-1 4 1 4H6"/>',
      flag_check: '<path d="M6 21V4"/><path d="M6 5h10l-1 4 1 4H6"/><path d="M9 9.5l1.5 1.5L14 7.5"/>',
      hourglass_top: '<path d="M7 3h10"/><path d="M7 21h10"/><path d="M8 3c0 4 4 5 4 9s-4 5-4 9"/><path d="M16 3c0 4-4 5-4 9s4 5 4 9"/><path d="M9 6h6"/>',
      info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      monitoring: '<path d="M4 17l5-5 4 4 7-8"/><path d="M4 20h16"/>',
      next_plan: '<path d="M5 5h10a4 4 0 0 1 0 8H8"/><path d="M8 9l-4 4 4 4"/><path d="M16 17h4"/><path d="M18 15v4"/>',
      radio_button_checked: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
      schedule: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
      speed: '<path d="M5 17a8 8 0 1 1 14 0"/><path d="M12 17l4-6"/><path d="M8 17h8"/>',
      timeline: '<path d="M4 6h5"/><path d="M15 6h5"/><path d="M9 6a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/><path d="M4 18h5"/><path d="M15 18h5"/><path d="M9 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/>',
      timer: '<path d="M10 2h4"/><path d="M12 6v6l3 2"/><circle cx="12" cy="13" r="8"/>',
      track_changes: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/><path d="M20 4l-4 4"/><path d="M17 4h3v3"/>',
      trending_up: '<path d="M4 16l5-5 4 4 7-8"/><path d="M14 7h6v6"/>',
      update: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/><path d="M12 8v5l3 2"/>',
      verified: '<path d="M12 3l2 2.5 3.2-.3.8 3.1 2.7 1.7-1.4 2.9 1.4 2.9-2.7 1.7-.8 3.1-3.2-.3L12 21l-2-2.5-3.2.3-.8-3.1-2.7-1.7 1.4-2.9-1.4-2.9L6 6.5l.8-3.1 3.2.3L12 3z"/><path d="M8.5 12l2 2 5-5"/>',
      warning: '<path d="M12 3l9 16H3L12 3z"/><path d="M12 9v4"/><path d="M12 16h.01"/>'
    };
    var body = paths[name] || paths.analytics;
    return '<svg class="mi seasons-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }

  function _toast(message, type) {
    if (window.UI && typeof UI.toast === 'function') UI.toast(message, type || 'info');
  }

  function _esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function destroy() {}

  return {
    render: render,
    destroy: destroy,
    createSeason: createSeason,
    updateSeason: updateSeason,
    getActiveSeason: getActiveSeason,
    listSeasons: listSeasons,
    openCreateFlow: openCreateFlow,
    closeCreateFlow: closeCreateFlow,
    finishActiveSeason: finishActiveSeason,
    openFinalResult: openFinalResult,
    openScheduledDetails: openScheduledDetails,
    deleteScheduledSeason: deleteScheduledSeason,
    openStoneEvolutionHistory: openStoneEvolutionHistory,
    closeStoneEvolutionHistory: closeStoneEvolutionHistory,
    openHelpModal: openHelpModal,
    closeHelpModal: closeHelpModal,
    handleSeasonActionButton: handleSeasonActionButton,
    toggleMetricBalloon: toggleMetricBalloon,
    openActiveFromCelebration: openActiveFromCelebration,
    checkPendingGoalCelebration: checkPendingGoalCelebration,
    closeFinalResult: closeFinalResult,
    _setModuleTab: _setModuleTab,
    _setSeasonTab: _setSeasonTab,
    _wizardSelect: _wizardSelect,
    _wizardSetStartDate: _wizardSetStartDate,
    _metricTileKey: _metricTileKey,
    _wizardBack: _wizardBack,
    _wizardNext: _wizardNext
  };
})();
