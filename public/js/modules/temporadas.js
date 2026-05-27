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
    pendingStoneCelebration: null,
    actionContext: {
      products: [],
      promotions: [],
      coupons: [],
      upsells: [],
      salesChannels: []
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
    { value: 'volume', label: 'Volume', text: 'Prioriza pedidos, frequência e dias ativos.' },
    { value: 'margin', label: 'Margem', text: 'Prioriza ticket, valor por pedido e margem estimada.' },
    { value: 'retention', label: 'Fidelização', text: 'Prioriza recompra, clientes recorrentes e frequência.' }
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
      '<div class="seasons-hero-copy">' +
        '<div class="seasons-kicker">' + _icon('track_changes') + ' Missões Operacionais</div>' +
        '<h1>Temporadas</h1>' +
        '<p>Crie missões de 30 ou 90 dias para acompanhar metas reais do negócio.</p>' +
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
      _state.actionContext = { products: [], promotions: [], coupons: [], upsells: [], salesChannels: [] };
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
      _state.actionContext = { products: [], promotions: [], coupons: [], upsells: [], salesChannels: [] };
      _state.pendingStoneCelebration = null;
      _state.snapshots = { daily: null, weekly: null };
      _paint();
    });
  }

  function _loadSeasonActionContext() {
    if (!window.DB || typeof DB.getAll !== 'function') {
      return Promise.resolve({ products: [], promotions: [], coupons: [], upsells: [], salesChannels: [] });
    }
    return Promise.all([
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('promotions').catch(function () { return []; }),
      DB.getAll('promocoes').catch(function () { return []; }),
      DB.getAll('coupons').catch(function () { return []; }),
      DB.getAll('upsellRules').catch(function () { return []; }),
      (typeof DB.getDocRoot === 'function' ? DB.getDocRoot('config', 'canais_venda') : Promise.resolve(null)).catch(function () { return null; })
    ]).then(function (res) {
      return {
        products: res[0] || [],
        promotions: _mergePromotionLists(res[1] || [], res[2] || []),
        coupons: res[3] || [],
        upsells: res[4] || [],
        salesChannels: _normalizeSalesChannelsConfig(res[5] || {})
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
      DB.getAll('business_maturity_snapshots').catch(function () { return []; })
    ]).then(function (r) {
      var events = _normalizeStoneUpgradeEvents(r[5] || []);
      var snapshots = _normalizeMaturitySnapshots(r[6] || []);
      var maturity = _calculateBusinessMaturity({
        seasons: _state.seasons || [],
        orders: r[0] || [],
        customers: r[1] || [],
        flightPlans: r[2] || [],
        monthScenario: r[3] || null,
        existing: r[4] || null
      });
      _state.businessMaturity = maturity;
      _state.businessMaturityEvents = events;
      _state.businessMaturitySnapshots = snapshots;
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
          _paint();
          _triggerStoneUpgradeCelebration(_state.pendingStoneCelebration);
          return _state.businessMaturity;
        });
      });
    }).catch(function (err) {
      console.warn('Business maturity calculation skipped', err);
      _state.businessMaturity = _initialMaturity();
      _state.businessMaturityLoading = false;
      _state.businessMaturityError = err;
      _state.businessMaturitySnapshots = [];
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
    var scenario = _maturityScenario(monthScenario, flightPlans);
    var indexes = _maturityIndexes(seasonStats, orderStats, loyaltyStats, scenario);
    var maturityScore = _maturityScore(indexes);
    var hasEnoughData = seasonStats.total > 0 || orderStats.totalOrders >= 3;
    var previousProgress = _clamp(_number(existing.stoneProgressPercent, 0), 0, 100);
    var progress = hasEnoughData ? _clamp(Math.round((maturityScore * 0.68) + seasonStats.totalImpact), 0, 100) : 0;
    var strengths = _maturityStrengths(seasonStats, orderStats, loyaltyStats, indexes, scenario);
    var weaknesses = _maturityWeaknesses(seasonStats, orderStats, loyaltyStats, indexes, scenario);
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
      strengths = _maturityStrengths(seasonStats, orderStats, loyaltyStats, indexes, scenario);
      weaknesses = _maturityWeaknesses(seasonStats, orderStats, loyaltyStats, indexes, scenario);
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

  function _maturityIndexes(seasonStats, orderStats, loyaltyStats, scenario) {
    var healthyGrowth = 0;
    if (orderStats.totalOrders > 0) healthyGrowth += Math.min(34, orderStats.totalOrders * 3);
    if (orderStats.revenue > 0) healthyGrowth += Math.min(18, orderStats.revenue / 120);
    if (orderStats.growthPct > 0) healthyGrowth += Math.min(18, orderStats.growthPct * 0.35);
    if (orderStats.averageTicket > 0) healthyGrowth += Math.min(14, orderStats.averageTicket / 4);
    if (scenario === 'growth' || scenario === 'expansion') healthyGrowth += Math.min(6, seasonStats.avgRiskScore <= 55 ? 6 : 2);

    var consistency = Math.min(42, orderStats.activeDays * 5) + Math.min(18, orderStats.activeWeeks * 6);
    if (seasonStats.finished > 0) consistency += Math.min(22, seasonStats.finished * 9);
    if (seasonStats.avgScore > 0) consistency += Math.min(18, seasonStats.avgScore * 0.22);
    consistency += Math.min(10, seasonStats.totalImpact * 0.25);
    consistency -= seasonStats.abandoned * 10;

    var financialHealth = orderStats.totalOrders > 0 ? 42 : 0;
    if (orderStats.averageTicket > 0) financialHealth += Math.min(18, orderStats.averageTicket / 3);
    if (scenario === 'survival') financialHealth += 8;
    if (scenario === 'equilibrium') financialHealth += 10;
    if ((scenario === 'growth' || scenario === 'expansion') && seasonStats.avgRiskScore > 70) financialHealth -= 12;

    var controlledRisk = seasonStats.total ? Math.max(0, 100 - seasonStats.avgRiskScore) : (orderStats.totalOrders >= 3 ? 45 : 0);
    controlledRisk += Math.min(14, seasonStats.finished * 5);
    controlledRisk -= seasonStats.abandoned * 16;

    var loyalty = loyaltyStats.uniqueCustomers ? Math.min(70, loyaltyStats.recurringRate * 100) : 0;
    loyalty += Math.min(20, loyaltyStats.recurringCustomers * 6);
    if (customers.length >= 5) loyalty += 8;

    var execution = seasonStats.finished * 18 + seasonStats.totalVictories * 15 + seasonStats.partialVictories * 9;
    if (seasonStats.avgScore > 0) execution += Math.min(25, seasonStats.avgScore * 0.28);
    execution += Math.min(24, seasonStats.totalImpact * 0.45);
    execution -= seasonStats.abandoned * 18;

    return {
      healthyGrowth: _maturityIndex(healthyGrowth, orderStats.totalOrders >= 6 ? 'medium' : 'low', _growthNotes(orderStats, scenario)),
      consistency: _maturityIndex(consistency, orderStats.totalOrders >= 6 || seasonStats.total >= 2 ? 'medium' : 'low', _consistencyNotes(seasonStats, orderStats)),
      financialHealth: _maturityIndex(financialHealth, orderStats.totalOrders ? 'low' : 'low', ['Esta fase usa pedidos e Plano de Voo como sinal leve; margem complexa fica fora.']),
      controlledRisk: _maturityIndex(controlledRisk, seasonStats.total ? 'medium' : 'low', _riskNotes(seasonStats)),
      loyalty: _maturityIndex(loyalty, loyaltyStats.uniqueCustomers >= 5 ? 'medium' : 'low', _loyaltyNotes(loyaltyStats)),
      execution: _maturityIndex(execution, seasonStats.total ? 'high' : 'low', _executionNotes(seasonStats))
    };
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

  function _seasonMaturityImpact(season) {
    season = season || {};
    var result = season.status === 'abandoned' ? 'Abandono' : (season.finalResult || 'Resultado não calculado');
    var score = _number(season.finalScore, _number(season.currentScore, 0));
    var risk = season.riskLevel || season.initialRiskLevel || 'unknown';
    var difficulty = season.difficulty || season.targetDifficulty || 'balanced';
    var impact = 0;
    var reasons = [];
    var limiters = [];

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
      impact += 1;
      limiters.push('Falha Operacional quase não contribui para a Pedra.');
    } else if (result === 'Abandono') {
      impact -= 7;
      limiters.push('Temporada abandonada limita a evolução.');
    }

    if (score >= 85) {
      impact += 5;
      reasons.push('Score final alto aumentou a qualidade do avanço.');
    } else if (score >= 65) {
      impact += 3;
      reasons.push('Score final saudável contribuiu para maturidade.');
    } else if (score > 0 && score < 40) {
      impact -= 3;
      limiters.push('Score final baixo reduziu o impacto.');
    }

    if (risk === 'low') {
      impact += 3;
      reasons.push('Risco baixo deixou o avanço mais saudável.');
    } else if (risk === 'medium') {
      impact += 1;
      reasons.push('Risco médio manteve o avanço controlado.');
    } else if (risk === 'high' || risk === 'very_high') {
      impact -= risk === 'very_high' ? 7 : 5;
      limiters.push('Chance de falha elevada limitou o avanço.');
    }

    if (difficulty === 'aggressive') {
      if (risk === 'low' || risk === 'medium') {
        impact += 4;
        reasons.push('Dificuldade agressiva bem controlada aumentou a contribuição.');
      } else {
        limiters.push('Dificuldade agressiva com risco alto não acelera a Pedra.');
      }
    } else if (difficulty === 'balanced') {
      impact += 2;
    } else if (difficulty === 'safe') {
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

  function _maturityScenario(monthScenario, flightPlans) {
    var direct = monthScenario && (monthScenario.scenario || monthScenario.selectedScenario);
    if (direct) return String(direct).toLowerCase();
    var plans = (flightPlans || []).slice().sort(function (a, b) {
      return _dateValue(b.updatedAt || b.createdAt || b.periodStart) - _dateValue(a.updatedAt || a.createdAt || a.periodStart);
    });
    return plans[0] && plans[0].scenario ? String(plans[0].scenario).toLowerCase() : '';
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

  function _maturityStrengths(seasonStats, orderStats, loyaltyStats, indexes, scenario) {
    var list = [];
    if (seasonStats.finished > 0) list.push('Temporadas concluídas mostram execução real.');
    if (seasonStats.totalVictories > 0 || seasonStats.partialVictories > 0) list.push('Há vitórias totais ou parciais em temporadas.');
    if (orderStats.activeDays >= 4) list.push('A loja vendeu em mais dias, sinal de consistência.');
    if (loyaltyStats.recurringCustomers > 0) list.push('Já existem sinais básicos de recorrência de clientes.');
    if (indexes.controlledRisk.score >= 60) list.push('O risco operacional está mais controlado.');
    if (scenario === 'survival') list.push('Meta Survival conta como construção válida nesta fase.');
    if (!list.length) list.push('Começo da organização do negócio registrado.');
    return list.slice(0, 4);
  }

  function _maturityWeaknesses(seasonStats, orderStats, loyaltyStats, indexes) {
    var list = [];
    if (!seasonStats.finished) list.push('Ainda faltam temporadas concluídas para medir execução.');
    if (seasonStats.abandoned > 0) list.push('Temporadas abandonadas reduzem a velocidade de evolução.');
    if (seasonStats.avgRiskScore >= 70) list.push('Risco alto recorrente limita o avanço.');
    if (orderStats.activeDays < 3) list.push('Poucos dias com venda limitam a leitura de consistência.');
    if (!loyaltyStats.recurringCustomers) list.push('Baixa recorrência ainda limita a maturidade.');
    if (indexes.financialHealth.confidence === 'low') list.push('Saúde financeira ainda tem leitura básica nesta fase.');
    return list.slice(0, 4);
  }

  function _growthNotes(orderStats, scenario) {
    var notes = [];
    if (orderStats.totalOrders) notes.push(orderStats.totalOrders + ' pedido(s) válidos analisados.');
    if (orderStats.growthPct > 0) notes.push('Receita recente acima do período anterior.');
    if (scenario) notes.push('Cenário do Plano de Voo usado como contexto: ' + scenario + '.');
    if (!notes.length) notes.push('Ainda há poucos pedidos para medir crescimento.');
    return notes;
  }

  function _consistencyNotes(seasonStats, orderStats) {
    var notes = [];
    if (orderStats.activeDays) notes.push(orderStats.activeDays + ' dia(s) com venda detectados.');
    if (seasonStats.finished) notes.push(seasonStats.finished + ' temporada(s) concluída(s).');
    if (seasonStats.abandoned) notes.push(seasonStats.abandoned + ' temporada(s) abandonada(s) reduziram o índice.');
    if (!notes.length) notes.push('Sem histórico suficiente para medir consistência.');
    return notes;
  }

  function _riskNotes(seasonStats) {
    if (!seasonStats.total) return ['Sem temporadas suficientes para medir risco com confiança.'];
    return ['Risco médio calculado a partir das temporadas disponíveis.'];
  }

  function _loyaltyNotes(loyaltyStats) {
    if (!loyaltyStats.uniqueCustomers) return ['Sem clientes suficientes para medir recorrência.'];
    return [loyaltyStats.recurringCustomers + ' cliente(s) recorrente(s) entre ' + loyaltyStats.uniqueCustomers + ' identificado(s).'];
  }

  function _executionNotes(seasonStats) {
    if (!seasonStats.total) return ['Sem temporadas para medir execução.'];
    return [seasonStats.finished + ' concluída(s), ' + seasonStats.abandoned + ' abandonada(s).'];
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
    return items.slice(0, 6);
  }

  function _checklistFactories() {
    return {
      sell_more_days: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'sell_more_days',
          title: 'Manter vendas em mais dias da semana',
          description: 'A operação ganha maturidade quando vende com mais frequência, não apenas em dias isolados.',
          category: 'consistency',
          completed: orderStats.activeDays >= 4,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays },
          completedEvidence: 'Detectado por dias com venda no período.',
          pendingEvidence: 'Ainda há poucos dias com venda para confirmar consistência.'
        });
      },
      finish_season: function (seasonStats) {
        return _checklistItem({
          id: 'finish_season',
          title: 'Concluir uma temporada',
          description: 'Finalizar ciclos operacionais mostra execução e capacidade de acompanhar metas até o fechamento.',
          category: 'execution',
          completed: seasonStats.finished > 0,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { finishedSeasons: seasonStats.finished },
          completedEvidence: 'Detectado pelo fechamento de temporada.',
          pendingEvidence: 'Ainda falta uma temporada concluída para medir execução.'
        });
      },
      reduce_initial_instability: function (seasonStats, orderStats) {
        var limited = seasonStats.abandoned > 0 || seasonStats.failed > 0 || seasonStats.avgRiskScore >= 70;
        return _checklistItem({
          id: 'reduce_initial_instability',
          title: 'Reduzir instabilidade inicial',
          description: 'A evolução fica mais forte quando a loja reduz abandono, falhas e risco recorrente.',
          category: 'risk',
          completed: seasonStats.total > 0 && !limited && orderStats.activeDays >= 3,
          limited: limited,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { abandoned: seasonStats.abandoned, failed: seasonStats.failed, averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por temporada finalizada sem sinais fortes de instabilidade.',
          pendingEvidence: 'Ainda faltam dados para confirmar menor instabilidade.',
          limitedEvidence: 'Abandono, falha ou risco alto ainda limitam este marco.'
        });
      },
      minimum_order_base: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'minimum_order_base',
          title: 'Criar base mínima de pedidos',
          description: 'Uma base inicial de pedidos ajuda o BocaFood a ler evolução real com mais confiança.',
          category: 'growth',
          completed: orderStats.totalOrders >= 5,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalOrders: orderStats.totalOrders },
          completedEvidence: 'Detectado por volume mínimo de pedidos válidos.',
          pendingEvidence: 'Ainda há poucos pedidos válidos para confirmar a base inicial.'
        });
      },
      stable_weeks: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'stable_weeks',
          title: 'Manter semanas mais estáveis',
          description: 'Semanas com vendas recorrentes indicam mais previsibilidade operacional.',
          category: 'consistency',
          completed: orderStats.activeWeeks >= 2 && orderStats.activeDays >= 5,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeWeeks: orderStats.activeWeeks, activeDays: orderStats.activeDays },
          completedEvidence: 'Detectado por vendas distribuídas em mais semanas.',
          pendingEvidence: 'Ainda falta regularidade semanal para confirmar estabilidade.'
        });
      },
      reduce_oscillation: function (seasonStats, orderStats) {
        var limited = orderStats.previousRevenue > 0 && orderStats.growthPct < -25;
        return _checklistItem({
          id: 'reduce_oscillation',
          title: 'Reduzir oscilações fortes',
          description: 'A maturidade aumenta quando o resultado recente não cai de forma brusca contra o histórico.',
          category: 'consistency',
          completed: orderStats.previousRevenue > 0 && orderStats.growthPct >= -10,
          limited: limited,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), previousRevenue: Math.round(orderStats.previousRevenue), currentRevenue: Math.round(orderStats.currentRevenue) },
          completedEvidence: 'Detectado por variação recente sem queda forte.',
          pendingEvidence: 'Ainda falta histórico comparável para medir oscilação.',
          limitedEvidence: 'Queda recente forte limita este marco.'
        });
      },
      improve_average_score: function (seasonStats) {
        return _checklistItem({
          id: 'improve_average_score',
          title: 'Melhorar score médio das temporadas',
          description: 'Scores mais saudáveis mostram melhor execução dos ciclos operacionais.',
          category: 'execution',
          completed: seasonStats.avgScore >= 65,
          limited: seasonStats.total > 0 && seasonStats.avgScore > 0 && seasonStats.avgScore < 45,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageScore: Math.round(seasonStats.avgScore) },
          completedEvidence: 'Detectado por score médio saudável nas temporadas.',
          pendingEvidence: 'O score médio ainda precisa melhorar.',
          limitedEvidence: 'Score médio baixo limita a evolução.'
        });
      },
      reduce_recurring_risk: function (seasonStats) {
        return _checklistItem({
          id: 'reduce_recurring_risk',
          title: 'Reduzir risco recorrente',
          description: 'Risco controlado evita que crescimento rápido seja confundido com evolução saudável.',
          category: 'risk',
          completed: seasonStats.total > 0 && seasonStats.avgRiskScore <= 55,
          limited: seasonStats.avgRiskScore >= 70,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por risco médio controlado nas temporadas.',
          pendingEvidence: 'Ainda falta reduzir o risco médio das temporadas.',
          limitedEvidence: 'Risco médio alto limita a evolução.'
        });
      },
      improve_recurrence: function (seasonStats, orderStats, loyaltyStats) {
        return _checklistItem({
          id: 'improve_recurrence',
          title: 'Melhorar recorrência de clientes',
          description: 'Clientes que voltam indicam maturidade comercial e operação mais confiável.',
          category: 'loyalty',
          completed: loyaltyStats.recurringCustomers >= 2 || loyaltyStats.recurringRate >= 0.25,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { recurringCustomers: loyaltyStats.recurringCustomers, recurringRate: Math.round(loyaltyStats.recurringRate * 100) },
          completedEvidence: 'Detectado por clientes recorrentes no histórico de pedidos.',
          pendingEvidence: 'A recorrência ainda precisa crescer.'
        });
      },
      increase_stability: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'increase_stability',
          title: 'Aumentar estabilidade da operação',
          description: 'Estabilidade combina venda em dias diferentes, temporadas concluídas e menor risco.',
          category: 'consistency',
          completed: orderStats.activeDays >= 5 && seasonStats.finished >= 1 && seasonStats.avgRiskScore <= 65,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays, finishedSeasons: seasonStats.finished, averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por vendas mais distribuídas e temporada concluída.',
          pendingEvidence: 'Ainda falta combinar venda regular, execução e risco controlado.'
        });
      },
      grow_with_control: function (seasonStats, orderStats) {
        var limited = orderStats.growthPct > 20 && seasonStats.avgRiskScore >= 70;
        return _checklistItem({
          id: 'grow_with_control',
          title: 'Crescer mantendo controle',
          description: 'Crescimento só fortalece a Pedra quando não vem acompanhado de risco elevado.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && seasonStats.avgRiskScore <= 65,
          limited: limited,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por crescimento recente com risco controlado.',
          pendingEvidence: 'Ainda falta crescimento recente com risco controlado.',
          limitedEvidence: 'Crescimento com risco alto não conta como evolução saudável.'
        });
      },
      balanced_seasons: function (seasonStats) {
        return _checklistItem({
          id: 'balanced_seasons',
          title: 'Concluir temporadas equilibradas',
          description: 'Temporadas equilibradas indicam evolução sustentável, sem depender de pressão excessiva.',
          category: 'execution',
          completed: seasonStats.finished >= 1 && seasonStats.avgScore >= 60 && seasonStats.avgRiskScore <= 65,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { finishedSeasons: seasonStats.finished, averageScore: Math.round(seasonStats.avgScore), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por temporada concluída com score e risco saudáveis.',
          pendingEvidence: 'Ainda falta uma temporada concluída com equilíbrio entre score e risco.'
        });
      },
      improve_loyalty: function (seasonStats, orderStats, loyaltyStats) {
        return _checklistItem({
          id: 'improve_loyalty',
          title: 'Melhorar fidelização',
          description: 'Fidelização mais forte reduz dependência de vendas pontuais.',
          category: 'loyalty',
          completed: loyaltyStats.recurringRate >= 0.30 && loyaltyStats.recurringCustomers >= 2,
          source: 'orders,store_customers',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { recurringCustomers: loyaltyStats.recurringCustomers, recurringRate: Math.round(loyaltyStats.recurringRate * 100) },
          completedEvidence: 'Detectado por taxa de recompra mais forte.',
          pendingEvidence: 'A fidelização ainda precisa de mais recompra.'
        });
      },
      reduce_promotion_dependency: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'reduce_promotion_dependency',
          title: 'Reduzir dependência de promoções',
          description: 'Sem dados promocionais completos, esta V1 usa ticket e estabilidade como sinal auxiliar.',
          category: 'growth',
          completed: orderStats.currentAverageTicket > 0 && orderStats.previousAverageTicket > 0 && orderStats.currentAverageTicket >= orderStats.previousAverageTicket,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { currentAverageTicket: Math.round(orderStats.currentAverageTicket), previousAverageTicket: Math.round(orderStats.previousAverageTicket) },
          completedEvidence: 'Detectado por ticket médio preservado ou melhorado.',
          pendingEvidence: 'Ainda falta histórico de ticket para reduzir dependência de promoções.'
        });
      },
      healthy_growth: function (seasonStats, orderStats) {
        var limited = orderStats.growthPct > 15 && seasonStats.avgRiskScore >= 70;
        return _checklistItem({
          id: 'healthy_growth',
          title: 'Manter crescimento saudável',
          description: 'A Pedra evolui melhor quando crescimento, score e risco caminham juntos.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && seasonStats.avgScore >= 60 && seasonStats.avgRiskScore <= 65,
          limited: limited,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), averageScore: Math.round(seasonStats.avgScore), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por crescimento com score saudável e risco controlado.',
          pendingEvidence: 'Ainda falta crescimento acompanhado de score e risco saudáveis.',
          limitedEvidence: 'Crescimento com risco alto limita este marco.'
        });
      },
      reduce_average_risk: function (seasonStats) {
        return _checklistItem({
          id: 'reduce_average_risk',
          title: 'Reduzir risco médio',
          description: 'Menor risco médio indica operação mais previsível e menos vulnerável.',
          category: 'risk',
          completed: seasonStats.total > 0 && seasonStats.avgRiskScore <= 50,
          limited: seasonStats.avgRiskScore >= 70,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por risco médio baixo nas temporadas.',
          pendingEvidence: 'O risco médio ainda precisa cair.',
          limitedEvidence: 'Risco médio elevado limita a evolução.'
        });
      },
      ambitious_goals: function (seasonStats, orderStats, loyaltyStats, indexes, scenario) {
        var growthContext = scenario === 'growth' || scenario === 'expansion';
        return _checklistItem({
          id: 'ambitious_goals',
          title: 'Sustentar metas mais ousadas',
          description: 'Metas mais fortes só contam quando aparecem com controle e boa execução.',
          category: 'execution',
          completed: growthContext && seasonStats.avgScore >= 65 && seasonStats.avgRiskScore <= 60,
          limited: growthContext && seasonStats.avgRiskScore >= 70,
          source: 'flight_plans,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { scenario: scenario || '', averageScore: Math.round(seasonStats.avgScore), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por contexto de Growth/Expansion com score e risco saudáveis.',
          pendingEvidence: 'Ainda falta sustentar meta mais ousada com controle.',
          limitedEvidence: 'Meta ousada com risco alto não acelera a Pedra.'
        });
      },
      financial_stability: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'financial_stability',
          title: 'Melhorar estabilidade financeira',
          description: 'Nesta V1, a leitura financeira é conservadora e usa pedidos/ticket como sinal básico.',
          category: 'financial',
          completed: orderStats.totalOrders >= 8 && orderStats.averageTicket > 0 && orderStats.growthPct >= -10,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalOrders: orderStats.totalOrders, averageTicket: Math.round(orderStats.averageTicket), growthPct: Math.round(orderStats.growthPct) },
          completedEvidence: 'Detectado por pedidos, ticket e variação recente sem deterioração forte.',
          pendingEvidence: 'Ainda falta base financeira normalizada para maior confiança.'
        });
      },
      reduce_concentration: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'reduce_concentration',
          title: 'Reduzir dependência de poucos dias',
          description: 'Vendas distribuídas reduzem risco de depender de poucos picos.',
          category: 'risk',
          completed: orderStats.activeDays >= 8 && orderStats.activeWeeks >= 3,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays, activeWeeks: orderStats.activeWeeks },
          completedEvidence: 'Detectado por vendas distribuídas em mais dias e semanas.',
          pendingEvidence: 'Ainda há concentração de vendas em poucos dias ou semanas.'
        });
      },
      good_consistency: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'good_consistency',
          title: 'Manter boa consistência',
          description: 'Consistência forte combina vendas recorrentes e temporadas sem abandono.',
          category: 'consistency',
          completed: orderStats.activeDays >= 8 && seasonStats.abandoned === 0 && seasonStats.finished >= 2,
          limited: seasonStats.abandoned > 0,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeDays: orderStats.activeDays, finishedSeasons: seasonStats.finished, abandoned: seasonStats.abandoned },
          completedEvidence: 'Detectado por boa regularidade e temporadas concluídas sem abandono.',
          pendingEvidence: 'Ainda falta mais histórico consistente.',
          limitedEvidence: 'Abandono recente limita a consistência.'
        });
      },
      long_healthy_growth: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'long_healthy_growth',
          title: 'Manter crescimento saudável por mais tempo',
          description: 'Pedras altas exigem histórico mais longo de crescimento com controle.',
          category: 'growth',
          completed: seasonStats.finished >= 3 && orderStats.growthPct > 0 && seasonStats.avgRiskScore <= 60,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { finishedSeasons: seasonStats.finished, growthPct: Math.round(orderStats.growthPct), averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por sequência de temporadas com crescimento controlado.',
          pendingEvidence: 'Ainda falta histórico longo de crescimento saudável.'
        });
      },
      reduce_operational_instability: function (seasonStats) {
        var limited = seasonStats.unstable > 0 || seasonStats.failed > 0 || seasonStats.abandoned > 0;
        return _checklistItem({
          id: 'reduce_operational_instability',
          title: 'Reduzir instabilidade operacional',
          description: 'Menos temporadas instáveis, falhas e abandonos indicam operação mais madura.',
          category: 'risk',
          completed: seasonStats.finished >= 2 && !limited && seasonStats.avgRiskScore <= 60,
          limited: limited,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { unstable: seasonStats.unstable, failed: seasonStats.failed, abandoned: seasonStats.abandoned },
          completedEvidence: 'Detectado por temporadas concluídas sem instabilidade relevante.',
          pendingEvidence: 'Ainda falta reduzir instabilidade operacional.',
          limitedEvidence: 'Instabilidade, falha ou abandono ainda limitam este marco.'
        });
      },
      difficult_seasons: function (seasonStats) {
        return _checklistItem({
          id: 'difficult_seasons',
          title: 'Concluir temporadas difíceis',
          description: 'Desafios maiores só fortalecem a Pedra quando fecham com risco controlado.',
          category: 'execution',
          completed: seasonStats.impacts.some(function (impact) {
            return impact.difficulty === 'aggressive' && impact.impactPercent >= 10 && (impact.riskLevel === 'low' || impact.riskLevel === 'medium');
          }),
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { aggressiveControlledWins: seasonStats.impacts.filter(function (impact) { return impact.difficulty === 'aggressive' && impact.impactPercent >= 10; }).length },
          completedEvidence: 'Detectado por temporada agressiva concluída com contribuição saudável.',
          pendingEvidence: 'Ainda falta concluir desafio maior com baixo risco.'
        });
      },
      good_financial_health: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'good_financial_health',
          title: 'Manter boa saúde financeira',
          description: 'Nesta V1, saúde financeira alta ainda depende de sinais básicos e deve ser validada depois.',
          category: 'financial',
          completed: orderStats.totalOrders >= 12 && orderStats.averageTicket > 0 && orderStats.growthPct >= 0,
          source: 'orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalOrders: orderStats.totalOrders, averageTicket: Math.round(orderStats.averageTicket), growthPct: Math.round(orderStats.growthPct) },
          completedEvidence: 'Detectado por volume, ticket e crescimento recente sem queda.',
          pendingEvidence: 'Ainda falta dado financeiro mais confiável para confirmar este marco.'
        });
      },
      low_risk_growth: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'low_risk_growth',
          title: 'Sustentar crescimento com baixo risco',
          description: 'Excelência exige crescer sem aumentar vulnerabilidade operacional.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && seasonStats.avgRiskScore <= 45 && seasonStats.finished >= 3,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), averageRiskScore: Math.round(seasonStats.avgRiskScore), finishedSeasons: seasonStats.finished },
          completedEvidence: 'Detectado por crescimento e risco médio baixo ao longo de temporadas.',
          pendingEvidence: 'Ainda falta crescimento sustentado com risco baixo.'
        });
      },
      high_predictability: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'high_predictability',
          title: 'Manter alta previsibilidade',
          description: 'Previsibilidade combina semanas ativas, score alto e ausência de abandono.',
          category: 'consistency',
          completed: orderStats.activeWeeks >= 4 && seasonStats.avgScore >= 75 && seasonStats.abandoned === 0,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { activeWeeks: orderStats.activeWeeks, averageScore: Math.round(seasonStats.avgScore), abandoned: seasonStats.abandoned },
          completedEvidence: 'Detectado por regularidade semanal, score alto e sem abandono.',
          pendingEvidence: 'Ainda falta previsibilidade alta por mais tempo.'
        });
      },
      balance_growth_stability: function (seasonStats, orderStats) {
        return _checklistItem({
          id: 'balance_growth_stability',
          title: 'Equilibrar crescimento e estabilidade',
          description: 'A evolução mais alta combina avanço de resultado com operação consistente.',
          category: 'growth',
          completed: orderStats.growthPct > 0 && orderStats.activeDays >= 8 && seasonStats.avgRiskScore <= 55,
          source: 'orders,seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { growthPct: Math.round(orderStats.growthPct), activeDays: orderStats.activeDays, averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por crescimento, dias ativos e risco controlado.',
          pendingEvidence: 'Ainda falta equilibrar crescimento com estabilidade operacional.'
        });
      },
      consistent_maturity: function (seasonStats, orderStats, loyaltyStats) {
        return _checklistItem({
          id: 'consistent_maturity',
          title: 'Demonstrar maturidade consistente',
          description: 'Maturidade consistente aparece quando execução, risco, vendas e recorrência caminham juntos.',
          category: 'execution',
          completed: seasonStats.finished >= 4 && seasonStats.avgScore >= 75 && seasonStats.avgRiskScore <= 55 && loyaltyStats.recurringCustomers >= 3,
          source: 'seasons,orders',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { finishedSeasons: seasonStats.finished, averageScore: Math.round(seasonStats.avgScore), recurringCustomers: loyaltyStats.recurringCustomers },
          completedEvidence: 'Detectado por histórico forte de execução, risco e recorrência.',
          pendingEvidence: 'Ainda falta histórico mais longo de maturidade consistente.'
        });
      },
      season_partial_win: function (seasonStats) {
        return _checklistItem({
          id: 'season_partial_win',
          title: 'Alcançar Vitória Parcial',
          description: 'Vitória Parcial mostra avanço real mesmo quando a meta completa ainda não foi atingida.',
          category: 'execution',
          completed: seasonStats.partialVictories > 0 || seasonStats.totalVictories > 0,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { partialVictories: seasonStats.partialVictories, totalVictories: seasonStats.totalVictories },
          completedEvidence: 'Detectado pelo resultado final de temporada.',
          pendingEvidence: 'Ainda falta alcançar uma vitória parcial ou total.'
        });
      },
      season_total_win: function (seasonStats) {
        return _checklistItem({
          id: 'season_total_win',
          title: 'Alcançar Vitória Total',
          description: 'Vitória Total confirma execução forte de uma meta operacional.',
          category: 'execution',
          completed: seasonStats.totalVictories > 0,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { totalVictories: seasonStats.totalVictories },
          completedEvidence: 'Detectado por Vitória Total em temporada finalizada.',
          pendingEvidence: 'Ainda falta uma Vitória Total.'
        });
      },
      avoid_abandonment: function (seasonStats) {
        return _checklistItem({
          id: 'avoid_abandonment',
          title: 'Evitar abandono de temporada',
          description: 'Abandono recorrente indica quebra de execução e reduz a velocidade de evolução.',
          category: 'execution',
          completed: seasonStats.total > 0 && seasonStats.abandoned === 0,
          limited: seasonStats.abandoned > 0,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { abandoned: seasonStats.abandoned },
          completedEvidence: 'Detectado por temporadas fechadas sem abandono.',
          pendingEvidence: 'Ainda falta histórico para confirmar ausência de abandono.',
          limitedEvidence: 'Temporada abandonada limita a evolução.'
        });
      },
      reduce_operation_risk: function (seasonStats) {
        return _checklistItem({
          id: 'reduce_operation_risk',
          title: 'Reduzir risco da operação',
          description: 'Risco menor deixa a evolução mais saudável e menos dependente de esforço extremo.',
          category: 'risk',
          completed: seasonStats.total > 0 && seasonStats.avgRiskScore <= 55,
          limited: seasonStats.avgRiskScore >= 70,
          source: 'seasons',
          completedAt: _recentEvidenceDate(seasonStats),
          evidence: { averageRiskScore: Math.round(seasonStats.avgRiskScore) },
          completedEvidence: 'Detectado por chance de falha média controlada.',
          pendingEvidence: 'Ainda falta reduzir a chance de falha média.',
          limitedEvidence: 'Chance de falha elevada limita a evolução.'
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
        '<div class="stones-progress-top"><span>Caminhada das Pedras</span><strong>' + _esc(current) + '</strong></div>' +
        _stoneJourney(current, next) +
        '<div class="stones-progress-line"><span style="width:' + progress + '%"></span></div>' +
        '<div class="stones-progress-meta"><strong>' + Math.round(progress) + '% até ' + _esc(next) + '</strong><span>As próximas Pedras aparecem como caminho ainda a percorrer.</span></div>' +
      '</div>' +
      _maturityEvolutionBlock(history) +
      '<div class="stones-insights">' +
        _maturityInsightList('Pontos fortes', maturity.strengths || []) +
        _maturityInsightList('Pontos que limitam evolução', maturity.weaknesses || []) +
      '</div>' +
      _maturityChecklistBlock(maturity.checklist || []) +
    '</section>';
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
    items = (items || []).slice(0, 3);
    if (!items.length) items = ['Ainda sem dados suficientes para leitura.'];
    return '<div class="stones-insight-list"><h3>' + _esc(title) + '</h3><ul>' + items.map(function (item) {
      return '<li>' + _esc(item) + '</li>';
    }).join('') + '</ul></div>';
  }

  function _maturityEvolutionBlock(events) {
    var latest = (events || [])[0];
    if (!latest) {
      return '<div class="stones-evolution-card stones-evolution-empty">' +
        '<div><span class="seasons-section-label">Evolução recente</span><h3>Ainda sem subida de Pedra</h3><p>Quando a loja evoluir, o histórico ficará disponível aqui.</p></div>' +
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
    }).slice(0, 5);
    if (!checklist.length) checklist = _initialChecklist().slice(0, 5);
    return '<div class="stones-checklist" aria-label="Caminho da Pedra">' +
      '<div class="stones-checklist-head">' +
        '<div><span class="seasons-section-label">Caminho da Pedra</span><h3>Marcos reais do negócio</h3></div>' +
        '<small>Automático</small>' +
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
          '<div><strong>Carregando Temporadas</strong><p>Buscando temporadas do tenant atual.</p></div>' +
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
            '<p>A estrutura inicial está pronta. Na próxima fase, esta área exibirá objetivo, estratégia, dificuldade, progresso, score, status e dias restantes.</p>' +
            '<div class="seasons-readiness-row">' +
              '<span>' + _icon('verified') + ' Tenant carregado</span>' +
              '<span>' + _icon('timer') + ' Ciclos de 30 ou 90 dias</span>' +
              '<span>' + _icon('analytics') + ' Dados reais do sistema</span>' +
            '</div>' +
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
        '<div class="seasons-hud-main">' +
          '<span class="seasons-section-label">Painel da Temporada</span>' +
          '<h2>' + _esc(season.title || 'Temporada sem título') + '</h2>' +
          '<p>' + _esc(_formatPeriod(season.startDate, season.endDate)) + '</p>' +
          '<div class="seasons-hud-tags">' +
            _hudTag('Objetivo', _objectiveLabel(season.objective)) +
            _hudTag('Estratégia', _buildLabel(season.build)) +
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
      { key: 'next', label: 'Próxima Jogada', icon: 'assistant_direction' },
      { key: 'analysis', label: 'Análises', icon: 'monitoring' }
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
      '<div class="seasons-tab-header"><span class="seasons-section-label">Temporada ativa</span><h3>Como estou indo e o que faço hoje?</h3><p>Leitura simples do ritmo da temporada, usando os dados reais que a loja já gerou.</p></div>' +
      '<div class="seasons-active-reading">' +
        '<section class="seasons-reading-hero seasons-reading-hero-' + _esc(_seasonSituationTone(season, metrics, progress)) + '">' +
          '<div>' +
            '<span class="seasons-section-label">Resumo da temporada</span>' +
            '<h3>' + _esc(seasonReading.headline) + '</h3>' +
            '<p>' + _esc(_seasonSituationText(season, metrics, progress)) + '</p>' +
          '</div>' +
          '<strong>' + Math.round(progress) + '%</strong>' +
        '</section>' +
        '<div class="seasons-reading-grid">' +
          _readingCard('Meta e progresso', 'flag', [
            _readingFact('Meta', _formatMetricValue(metrics.targetValue, season.objective)),
            _readingFact('Atual', _formatMetricValue(metrics.currentValue, season.objective)),
            _readingFact('Esperado para hoje', expected > 0 ? Math.round(expected) + '%' : 'Em leitura')
          ], _progressBalloonText(season, metrics, progress)) +
          _readingCard('Score explicado', 'speed', [
            _readingFact('Score', score + '/100'),
            _readingFact('Base do objetivo', scoreBreakdown.coreObjectiveScore + '/100'),
            _readingFactHtml('Impactos validados', _impactBadge(scoreBreakdown.validatedImpactBonus)),
            _readingFact('Ajuste por risco', '-' + scoreBreakdown.riskPenalty)
          ], _scoreBalloonText(season, metrics)) +
          _readingCard('Risco', 'warning', [
            _readingFactHtml('Chance de falha', _riskBadge(season.riskLevel)),
            _readingFact('Dias restantes', String(Math.round(_number(metrics.daysRemaining, 0)))),
            _readingFact('Ritmo', _statusScoreLabel(season.currentStatus))
          ], _riskBalloonText(season, metrics, progress)) +
          _readingCard('Base observada', 'analytics', [
            _readingFact('Pedidos', String(Math.round(_number(metrics.orders, 0)))),
            _readingFact('Ticket médio', _fmtMoney(metrics.averageTicket)),
            _readingFact(primaryLabels.current, _formatMetricValue(metrics.currentValue, season.objective))
          ], 'Estes números vêm dos pedidos válidos dentro do período da temporada.') +
        '</div>' +
        '<div class="seasons-reading-columns">' +
          _readingListBlock('O que está ajudando', 'thumb_up', seasonReading.helpingSignals) +
          _readingListBlock('O que está travando', 'report', seasonReading.blockingSignals) +
        '</div>' +
        _readingNextAction(season, metrics, recommendation, seasonReading) +
      '</div>' +
      _quickAlerts(snapshots);
  }

  function _seasonSituationTone(season, metrics, progress) {
    var ratio = _number(metrics.progressRatio, 0);
    var risk = season.riskLevel || 'unknown';
    if (progress >= 100 || ratio >= 1.1) return 'good';
    if (risk === 'high' || risk === 'very_high' || ratio < .5) return 'danger';
    if (ratio < .8 || risk === 'medium') return 'attention';
    return 'steady';
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
    if (expected > 0) return 'Até hoje, o ideal era estar perto de ' + Math.round(expected) + '%. A temporada está em ' + current + '%.';
    return 'Ainda há poucos dados para comparar com segurança. Conforme novos pedidos entrarem, esta leitura fica mais precisa.';
  }

  function _readingCard(title, icon, facts, note) {
    return '' +
      '<article class="seasons-reading-card">' +
        '<div class="seasons-reading-card-head">' +
          '<span>' + _icon(icon) + '</span>' +
          '<strong>' + _esc(title) + '</strong>' +
        '</div>' +
        '<div class="seasons-reading-facts">' + (facts || []).join('') + '</div>' +
        (note ? '<p>' + _esc(note) + '</p>' : '') +
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
    if (activeDays > 0) items.push('A loja já teve venda em ' + activeDays + ' dia(s) desta temporada.');
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
    var economics = _productEconomics(product, topProductSignal);
    var promo = _bestAvailablePromotionForProduct(product, actionContext.promotions || []);
    var coupon = _bestAvailableCouponForProduct(economics, actionContext.coupons || []);
    var upsell = _bestAvailableUpsellForProduct(product, actionContext.upsells || []);
    var complement = _bestComplementProductForProduct(product, economics, actionContext.products || []);
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
      var economics = _productEconomics(product, productSignal);
      var promo = _bestAvailablePromotionForProduct(product, actionContext.promotions || []);
      var coupon = _bestAvailableCouponForProduct(economics, actionContext.coupons || []);
      var upsell = _bestAvailableUpsellForProduct(product, actionContext.upsells || []);
      var complement = _bestComplementProductForProduct(product, economics, actionContext.products || []);
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
        channelLabel ? 'Canal para começar: ' + channelLabel + '.' : 'Canal para começar: canal principal da loja.',
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
              channelAdvice || (channelLabel ? 'Canal para usar primeiro: ' + channelLabel + '.' : 'Canal para usar primeiro: o canal principal da loja.')
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
    return (rankedActions || []).filter(function (item) {
      return _isSeasonActionAllowedForStrategy(item, profile);
    }).map(function (item) {
      var key = _seasonActionStrategyKey(item);
      var boost = _number(profile.boosts[key], 0);
      var source = item && item.action && item.action.source || '';
      if (profile.sources && profile.sources[source] !== undefined) boost += _number(profile.sources[source], 0);
      var adjusted = Object.assign({}, item);
      adjusted.score = _number(item && item.score, 0) + boost;
      adjusted.strategyFit = {
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

  function _isSeasonActionAllowedForStrategy(item, profile) {
    var key = _seasonActionStrategyKey(item);
    var allowed = profile && profile.allowedKeys;
    if (!allowed || !allowed.length) return true;
    return allowed.indexOf(key) >= 0;
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
        description: 'Use esta jogada para aumentar movimento onde a loja já mostrou resposta.',
        why: 'Aqui o foco é volume: repetir o caminho que já trouxe pedido aumenta a chance de vender mais rápido.',
        checklist: ['Mantenha a ação simples para gerar pedido, não para explicar demais a oferta.']
      },
      'sell_more:margin': {
        goal: 'Vender mais sem trocar crescimento por desconto pesado.',
        success: 'entrar venda com desconto controlado ou sem desconto.',
        description: 'Use esta jogada para puxar venda preservando a sobra do produto.',
        why: 'Como a estratégia é margem, a jogada precisa vender sem deixar o desconto mandar no resultado.',
        checklist: ['Evite aumentar desconto nesta jogada; prefira destaque, produto forte ou upsell.']
      },
      'sell_more:retention': {
        goal: 'Vender mais chamando quem já conhece a loja.',
        success: 'cliente conhecido voltar a comprar dentro do prazo.',
        description: 'Use esta jogada para transformar produto forte em motivo de retorno.',
        why: 'Aqui vender mais passa por clientes que já têm relação com a loja, não por divulgação genérica.',
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
        why: 'Como a estratégia é margem, upsell e adicional fazem mais sentido que baixar preço.',
        checklist: ['Priorize adicional, combo ou produto complementar em vez de desconto.']
      },
      'increase_ticket:retention': {
        goal: 'Fazer clientes conhecidos comprarem pedidos melhores.',
        success: 'cliente recorrente comprar com adicional, combo ou ticket maior.',
        description: 'Use esta jogada para oferecer algo complementar a quem já compra da loja.',
        why: 'Cliente conhecido tende a aceitar melhor uma sugestão ligada ao que já pediu antes.',
        checklist: ['Use o produto que a cliente já conhece como entrada para a oferta.']
      },
      'retain_customers:volume': {
        goal: 'Trazer clientes de volta com uma ação fácil de aceitar.',
        success: 'cliente que já comprou voltar a fazer pedido.',
        description: 'Use esta jogada para aumentar recompra com uma chamada simples.',
        why: 'A estratégia de volume aqui depende de retorno: mais clientes conhecidos comprando de novo.',
        checklist: ['Fale com clientes que já compraram antes e use o produto forte como motivo.']
      },
      'retain_customers:margin': {
        goal: 'Gerar recompra sem dar desconto desnecessário.',
        success: 'cliente conhecido voltar comprando produto com boa sobra.',
        description: 'Use esta jogada para trazer cliente de volta protegendo o resultado da venda.',
        why: 'Como a estratégia é margem, a recompra precisa ser saudável, não só barata.',
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
        description: 'Use esta jogada para levar o produto certo ao momento em que a loja precisa de movimento.',
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
        description: 'Use esta jogada para chamar clientes conhecidos nos momentos em que a loja oscila mais.',
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
      allowedKeys: _seasonAllowedActionKeys(combo),
      label: _objectiveLabel(objective) + ' + ' + _buildLabel(build)
    };
  }

  function _seasonAllowedActionKeys(combo) {
    var map = {
      'sell_more:volume': ['product', 'timing', 'promotion', 'coupon', 'consistency'],
      'sell_more:retention': ['retention', 'coupon', 'product', 'promotion', 'timing'],
      'increase_ticket:margin': ['upsell', 'healthy_discount', 'product', 'promotion'],
      'increase_ticket:retention': ['upsell', 'retention', 'coupon', 'product'],
      'retain_customers:retention': ['retention', 'coupon', 'product', 'promotion'],
      'retain_customers:margin': ['retention', 'healthy_discount', 'product', 'coupon'],
      'improve_consistency:volume': ['consistency', 'timing', 'product', 'promotion', 'coupon'],
      'improve_consistency:retention': ['consistency', 'retention', 'coupon', 'product', 'timing']
    };
    return map[combo] || [];
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
      if (excludedIds[actionId]) return false;
      if (usedIds[actionId]) return false;
      if (strictFocus && item.focusKey && usedFocus[item.focusKey]) return false;
      if (strictProduct && item.productKey && usedProducts[item.productKey]) return false;
      item.action.focusKey = item.focusKey || '';
      item.action.productKey = item.productKey || '';
      selected.push(item.action);
      usedIds[actionId] = true;
      if (item.focusKey) usedFocus[item.focusKey] = true;
      if (item.productKey) usedProducts[item.productKey] = true;
      return true;
    }

    sorted.forEach(function (item) { tryAdd(item, true, true); });
    sorted.forEach(function (item) { tryAdd(item, false, true); });
    sorted.forEach(function (item) { tryAdd(item, false, false); });
    return selected.slice(0, maxActions);
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

  function _productEconomics(product, signal) {
    var price = _money(_firstValue(product && product.price, product && product.salePrice, product && product.valor, product && product.preco, product && product.precoVenda, signal && signal.unitPrice));
    var cost = _money(_firstValue(product && product.cost, product && product.custo, product && product.purchasePrice, product && product.custoAtual, product && product.custo_atual, product && product.stockUnitCost, product && product.costPerYield, product && product.precoCompra));
    var hasPriceAndCost = price > 0 && cost > 0;
    var marginPct = hasPriceAndCost ? ((price - cost) / price) * 100 : null;
    var targetMarginPct = 25;
    var minFinal = hasPriceAndCost ? cost / (1 - targetMarginPct / 100) : 0;
    var maxDiscountValue = hasPriceAndCost ? Math.max(0, price - minFinal) : 0;
    var maxHealthyDiscountPct = hasPriceAndCost && price > 0 ? Math.floor(Math.min(20, (maxDiscountValue / price) * 100)) : 0;
    return {
      price: price,
      cost: cost,
      hasPriceAndCost: hasPriceAndCost,
      marginPct: marginPct,
      targetMarginPct: targetMarginPct,
      maxHealthyDiscountPct: Math.max(0, maxHealthyDiscountPct),
      maxHealthyDiscountValue: maxDiscountValue
    };
  }

  function _bestAvailablePromotionForProduct(product, promotions) {
    if (!product) return null;
    var candidates = (promotions || []).map(function (promo) {
      if (!_actionPromoApplies(promo, product)) return null;
      var calc = _actionPromoCalc(product, promo);
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

  function _bestComplementProductForProduct(baseProduct, baseEconomics, products) {
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
      var economics = _productEconomics(product, null);
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

  function _actionPromoCalc(product, promo) {
    var economics = _productEconomics(product, null);
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

  function _buildSeasonExecutionPlan(season, currentMetrics, validatedImpactSignals, riskContext) {
    var profile = _difficultyExecutionProfile(season && season.difficulty);
    var signals = validatedImpactSignals || {};
    var metrics = currentMetrics || {};
    var actions = [];
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
        channelEvidence || (channelLabel ? 'Canal da jogada: ' + channelLabel + '.' : 'Canal da jogada: ainda não há canal dominante, então mantenha o canal principal da loja.'),
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
    var strategyProfile = _seasonActionStrategyProfile(season || {});
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
      if (!_isSeasonActionAllowedForStrategy({ focusKey: action.source || '', action: action }, strategyProfile)) return;
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
    if (weakDays > 0) {
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
          productName ? 'Produto fixo para comparação: ' + productName + '.' : 'Produto fixo para comparação: produto com melhor resposta.',
          channelLabel ? 'Canal fixo para comparação: ' + channelLabel + '.' : 'Canal fixo para comparação: melhor canal.',
          hourLabel ? 'Horário fixo para comparação: perto de ' + hourLabel + '.' : 'Horário fixo para comparação: melhor período.'
        ]
      ));
    }

    return out;
  }

  function _seasonAction(id, title, description, why, source, priority, checklist) {
    return {
      id: id,
      title: title,
      description: description,
      why: why,
      source: source,
      priority: priority || 'medium',
      checklist: checklist || []
    };
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
      var status = evidence.found
        ? 'executed_with_result'
        : (hasExecutionEvidence && now > (_toDate(resultDueAt) || now)
          ? 'executed_without_result'
          : (!hasExecutionEvidence && now > (_toDate(executeDueAt) || now)
            ? 'not_executed'
            : (old.status === 'manually_done' ? 'manually_done' : 'pending')));
      if (old.status === 'executed_with_result' && !evidence.found) status = old.status;
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
        completedAt: evidence.found ? (old.completedAt || evidence.completedAt || now.toISOString()) : (status === 'executed_with_result' ? old.completedAt || null : null),
        evidence: evidence.found ? evidence : (old.evidence && old.status === 'executed_with_result' ? old.evidence : null),
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
          '<div class="seasons-tab-header"><span class="seasons-section-label">Próxima Jogada</span><h3>O que fazer agora?</h3><p>Jogadas práticas para ajudar sua loja a avançar nesta temporada, com foco, prazo e leitura do que aconteceu.</p></div>' +
          _nextMoveBlock(season, metrics, recommendation) +
        '</section>' +
        '<aside class="seasons-system-side">' +
          '<span class="seasons-section-label">Ritmo da temporada</span>' +
          _metricTile('Score', Math.round(_number(season.currentScore, 0)), 'speed') +
          _metricTile('Progresso', Math.round(_number(season.progressPercent, 0)) + '%', 'trending_up') +
          _metricTile('Chance de Falha', _riskLabel(season.riskLevel), 'warning') +
          _metricTile('Métrica observada', _formatMetricValue(metrics.currentValue, season.objective), 'analytics') +
        '</aside>' +
      '</div>';
  }

  function _analysisTab(season, snapshots) {
    snapshots = snapshots || {};
    return '' +
      '<div class="seasons-tab-header"><span class="seasons-section-label">Análises Automáticas</span><h3>Snapshots da temporada</h3><p>Leituras geradas automaticamente para reduzir recálculo e registrar o histórico de interpretação.</p></div>' +
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
      '<div class="seasons-tab-header"><span class="seasons-section-label">Resultado Final</span><h3>' + _esc(season.finalResult || 'Resultado não calculado') + '</h3><p>Fechamento da campanha operacional.</p></div>' +
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
    var parts = ['Este gráfico mostra quanto da meta principal já foi alcançado. O resultado atual é ' + current + ' de uma meta de ' + target + '.'];
    if (expected > 0) parts.push('Para este momento da temporada, o ritmo esperado era perto de ' + Math.round(expected) + '%, então a comparação principal é entre o progresso real e esse ponto de referência.');
    if (progress >= 100) parts.push('Como o progresso chegou a 100% ou mais, a meta da temporada já foi atingida ou superada.');
    else parts.push('Ainda falta aproximadamente ' + Math.max(0, Math.round(100 - progress)) + '% para chegar à meta. Se esse número ficar distante do ritmo esperado, a temporada tende a exigir ação mais rápida.');
    return parts.join(' ');
  }

  function _scoreBalloonText(season, metrics) {
    var score = _number(season.currentScore, 0);
    var weights = _objectiveWeights(season.objective).map(function (item) {
      return item.label + ' ' + item.weight;
    }).join(', ');
    var text = 'Este score considera principalmente: ' + (weights || 'as métricas do objetivo atual') + '.';
    if (score >= 85) return text + ' A nota está alta porque os indicadores principais estão acima do ritmo esperado.';
    if (score >= 65) return text + ' A nota está dentro de uma faixa estável, com avanço suficiente até agora.';
    if (score >= 40) return text + ' A nota mostra oscilação: existe avanço, mas ainda abaixo do ideal para este ponto da temporada.';
    return text + ' A nota está baixa porque os indicadores principais ainda estão longe da meta ou do ritmo esperado.';
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
      if (risk === 'low') return 'A chance está baixa porque o progresso e o ritmo atual não indicam atraso relevante para a meta.';
      if (risk === 'medium') return 'A chance está média porque existe algum desvio de ritmo ou exigência da meta, mas ainda há espaço para recuperar.';
      return 'A chance considera a dificuldade da meta, histórico, ritmo atual e dias restantes.';
    }
    return 'A chance está ' + _riskLabel(risk).toLowerCase() + ' porque ' + reasons.join(', ') + '.';
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
    }).join('') : '<p>Nenhum alerta crítico no snapshot diário.</p>') + '</section>';
  }

  function _snapshotAnalysisCard(title, snapshot, description) {
    if (!snapshot) {
      return '<article class="seasons-analysis-card"><span class="seasons-section-label">' + _esc(title) + '</span><h4>Ainda não gerada</h4><p>' + _esc(description) + '</p></article>';
    }
    var alerts = (snapshot.alerts || []).slice(0, 3);
    return '' +
      '<article class="seasons-analysis-card">' +
        '<span class="seasons-section-label">' + _esc(title) + '</span>' +
        '<h4>' + _esc(_formatDate(snapshot.date || snapshot.createdAt) || snapshot.date || 'Snapshot') + '</h4>' +
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
    return ({ overview: true, next: true, analysis: true, final: true })[tab] ? tab : 'overview';
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
          '<p>' + _esc(actions.length > 1 ? 'Cada card tem um foco diferente para você agir sem misturar tudo na mesma decisão.' : 'Esta é a jogada com mais sentido para o momento atual da sua loja.') + '</p>' +
          '<div class="seasons-next-checklist">' +
            '<div class="seasons-next-checklist-head"><strong>' + _esc(profile.label ? 'Ritmo ' + profile.label : 'Ritmo da temporada') + '</strong><span>' + _esc(profile.cadence || 'Ações práticas') + '</span></div>' +
            actions.map(function (action, index) {
              var steps = (action.checklist || []).slice(0, 4);
              var task = taskMap[action.id] || {};
              return '<article>' +
                '<header><span>' + (index + 1) + '</span><div><strong>' + _esc(action.title || 'Ação') + '</strong><p>' + _esc(action.description || '') + '</p></div></header>' +
                _seasonActionGoalHtml(action, task, season) +
                '<div class="seasons-next-reason seasons-next-action-reason"><span>Por que fazer</span><strong>' + _esc(action.why || 'Essa jogada aproveita o que já apareceu melhor nas vendas da sua loja.') + '</strong></div>' +
                _seasonActionTaskStatusHtml(task) +
                (steps.length ? '<ul>' + steps.map(function (step) { return '<li>' + _esc(step) + '</li>'; }).join('') + '</ul>' : '') +
                _seasonActionResultHtml(task) +
                _seasonActionButtonsHtml(action, task, season) +
              '</article>';
            }).join('') +
          '</div>' +
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
        '<aside>' +
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
    if (source === 'upsell') return 'Aumentar o valor do pedido sem mexer no preço do produto principal.';
    if (source === 'coupons') return 'Criar uma chamada de compra com limite de desconto mais controlado.';
    if (source === 'promotions') return 'Usar uma promoção que pode transformar interesse em venda.';
    if (source === 'healthy_discount') return 'Testar desconto pequeno sem apertar demais a margem.';
    if (source === 'timing') return 'Colocar o produto certo no canal e horário que já trouxeram resposta.';
    if (source === 'retention' || source === 'points') return 'Trazer clientes que já conhecem sua loja para comprar de novo.';
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
    var title = status === 'executed_with_result' ? 'Deu resultado' : (status === 'executed_without_result' ? 'Foi feita, mas não respondeu' : (status === 'not_executed' ? 'Não foi executada no prazo' : 'Ainda em andamento'));
    var text = '';
    if (status === 'executed_with_result') {
      text = (evidence.message || 'A jogada apareceu nas vendas.') + (_number(evidence.orderTotal, 0) > 0 ? ' Pedido ligado: ' + _fmtMoney(evidence.orderTotal) + '.' : '');
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
    var expired = tasks.filter(function (task) { return task.status === 'not_executed'; });
    var pending = tasks.filter(function (task) { return !task.status || task.status === 'pending' || task.status === 'manually_done'; });
    var revenue = done.reduce(function (sum, task) { return sum + _number(task && task.evidence && task.evidence.orderTotal, 0); }, 0);
    return '' +
      '<section class="seasons-action-outcome">' +
        '<div class="seasons-next-checklist-head"><strong>O que aconteceu</strong><span>Resultado das jogadas</span></div>' +
        '<div class="seasons-action-outcome-grid">' +
          '<span><small>Com resultado</small><strong>' + done.length + '</strong></span>' +
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
      ? (evidence || 'Essa jogada já apareceu nas vendas da loja.')
      : (status === 'executed_without_result'
        ? 'A ação foi executada, mas não trouxe venda ligada a ela até ' + (resultDue || 'o fim da medição') + '.'
        : (status === 'not_executed'
        ? 'O prazo passou e essa jogada ainda não apareceu nas vendas.'
        : (task.executionStatus === 'created_waiting_result' ? 'Ação criada. Agora vamos medir resposta até ' + (resultDue || 'o fim da janela') + '.' : 'Execute até ' + (due || 'o prazo da rodada') + '.')));
    return '' +
      '<div class="seasons-action-task-status seasons-action-task-status-' + _esc(status) + '">' +
        '<span>' + _icon(status === 'executed_with_result' ? 'check_circle' : (status === 'not_executed' ? 'error' : 'schedule')) + _esc(task.statusLabel || _seasonActionTaskStatusLabel(status)) + '</span>' +
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
    Array.prototype.forEach.call(document.querySelectorAll('.seasons-metric-tile.open, .seasons-status-bar.open, .seasons-progress-block-inner.open'), function (item) {
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
          '<span>' + _esc(_objectiveLabel(season.objective)) + ' · ' + _esc(_buildLabel(season.build)) + ' · ' + _esc(_difficultyLabel(season.difficulty)) + '</span>' +
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
    return '<div class="stones-history-empty"><div class="stones-symbol">' + _stoneGraphic('Pedra Bruta', 'md') + '</div><h3>Ainda sem evolução registrada</h3><p>Quando a loja subir de Pedra, o evento aparecerá aqui com motivo, data e indicadores usados.</p></div>';
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
      '<div class="stones-history-section-head"><span class="seasons-section-label">Histórico de maturidade</span><h3>Snapshots recentes</h3></div>' +
      (snapshots.length ? '<div class="stones-snapshots-list">' + snapshots.map(_maturitySnapshotRow).join('') + '</div>' : '<div class="stones-snapshots-empty">Ainda não há snapshots de maturidade registrados.</div>') +
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
    })[type] || 'Snapshot';
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
            _finalFact('Estratégia', _buildLabel(season.build)) +
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
            _finalFact('Estratégia', _buildLabel(season.build)) +
            _finalFact('Dificuldade', _difficultyLabel(season.difficulty)) +
            _finalFact('Início', _formatDate(season.startDate)) +
            _finalFact('Fim', _formatDate(season.endDate)) +
            _finalFact('Meta', _scheduledTargetLabel(season)) +
            _finalFact('Chance inicial', _riskLabel(season.initialRiskLevel || season.riskLevel)) +
            _finalFact('Status', _statusLabel(season.status)) +
          '</div>' +
          '<div class="seasons-final-summary">' +
            '<span class="seasons-section-label">Análises</span>' +
            '<p>As análises, snapshots e recomendações da Próxima Jogada começam quando a temporada ficar ativa.</p>' +
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
            _helpSummaryCard('Estratégia', _buildLabel(season.build)) +
            _helpSummaryCard('Dificuldade', _difficultyLabel(season.difficulty)) +
            _helpSummaryCard('Duração', _durationDays(season) + ' dias') +
          '</section>' +
          '<section class="seasons-help-section">' +
            '<h3>O que significa este resumo</h3>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Objetivo: ' + _objectiveLabel(season.objective), 'É o foco principal da temporada. Define qual resultado o sistema vai acompanhar com mais atenção.', objective.focus) +
              _helpItem('Estratégia: ' + _buildLabel(season.build), 'É a forma como o BocaFood interpreta os dados dentro da temporada.', build) +
              _helpItem('Dificuldade: ' + _difficultyLabel(season.difficulty), 'Define o nível de exigência da meta, a pressão do ritmo esperado e a tolerância ao risco.', difficulty) +
              _helpItem('Duração: ' + _durationDays(season) + ' dias', 'Define o período usado para acompanhar a meta e comparar o progresso real com o ritmo esperado.', 'Sprint usa 30 dias. Temporada usa 90 dias.') +
            '</div>' +
          '</section>' +
          _helpWeightHighlightsHtml(season) +
          '<section class="seasons-help-section">' +
            '<h3>Campos principais</h3>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Progresso', 'Mostra quanto da meta já foi alcançado. Pode passar de 100% se a meta for superada. Muda conforme o objetivo da temporada.', objective.progress) +
              _helpItem('Score', 'Nota de 0 a 100 que combina as métricas principais da temporada. Não é só faturamento: os pesos mudam conforme o objetivo.', objective.score) +
              _helpItem('Ritmo Atual', 'Compara o progresso real com o progresso esperado para este momento da temporada. No início, não deve punir ausência de resultado imediato.', 'Estados: Em início, Excelente, Estável, Instável e Crítico.') +
              _helpItem('Chance de Falha', 'Estima o risco de não atingir a meta considerando histórico, dificuldade da meta, dias restantes e ritmo atual.', 'Estados: Baixo, Médio, Alto e Muito alto. Pode ser alta no começo se a meta estiver muito acima do histórico.') +
              _helpItem('Atual', 'Valor atual acumulado ou calculado até agora.', objective.current) +
              _helpItem('Meta', 'Valor que precisa ser alcançado até o final da temporada. Agora a meta vem da rota escolhida no Plano de Voo.', objective.target) +
            '</div>' +
          '</section>' +
          '<section class="seasons-help-section">' +
            '<h3>Como ler os gráficos</h3>' +
            '<div class="seasons-help-intro">' +
              '<h4>Barras de status</h4>' +
              '<p>Mostram leituras rápidas de áreas importantes da temporada. Quanto maior a barra, maior o nível daquele indicador.</p>' +
              '<span>Use as barras para entender onde a temporada está forte e onde precisa de atenção.</span>' +
            '</div>' +
            '<div class="seasons-help-grid">' +
              _helpItem('Barra de progresso', 'Mostra visualmente quanto da meta já foi alcançado. A barra enche até 100% para facilitar a leitura, mesmo que o progresso real possa passar disso.', objective.progress) +
              _helpItem('Ritmo operacional', 'Mostra se a temporada está avançando no ritmo necessário para o momento atual.', 'Não é a mesma coisa que a meta final: compara o progresso real com o esperado até hoje.') +
              _helpItem('Consistência', 'Mostra a regularidade das vendas ao longo da temporada.', 'Uma barra baixa indica vendas muito concentradas em poucos dias ou semanas irregulares.') +
              _helpItem('Fidelização', 'Mostra sinais de recompra, clientes recorrentes e frequência.', 'Se o objetivo não for fidelização, essa barra entra como apoio para leitura do negócio.') +
              _helpItem('Chance de falha', 'Mostra o nível visual de risco da temporada não atingir a meta.', 'Nesta barra, valor alto pede atenção: significa maior chance de falha, não melhor desempenho.') +
            '</div>' +
          '</section>' +
          '<section class="seasons-help-section seasons-help-split">' +
            '<div>' +
              '<h3>Objetivo desta temporada</h3>' +
              '<p>' + _esc(objective.focus) + '</p>' +
            '</div>' +
            '<div>' +
              '<h3>Estratégia operacional</h3>' +
              '<p>' + _esc(build) + '</p>' +
            '</div>' +
            '<div>' +
              '<h3>Dificuldade</h3>' +
              '<p>' + _esc(difficulty) + '</p>' +
            '</div>' +
          '</section>' +
          '<p class="seasons-help-note">As análises são automáticas. Você não precisa preencher esta tela manualmente. O sistema usa os dados gerados nos pedidos, clientes e demais módulos disponíveis.</p>' +
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
          '<small>A estratégia ' + _esc(_buildLabel(season.build)) + ' ajuda a priorizar a interpretação, mas não muda os dados reais da temporada.</small>' +
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
      volume: 'Com a estratégia Volume, o sistema dá mais peso para pedidos, frequência e movimento.',
      margin: 'Com a estratégia Margem, o sistema dá mais peso para ticket, valor por pedido e produtos de maior valor.',
      retention: 'Com a estratégia Fidelização, o sistema dá mais peso para recompra, recorrência e frequência.'
    })[build] || 'A estratégia altera o peso da leitura operacional sem mudar a temporada inteira.';
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
    return {
      step: 0,
      saving: false,
      baselineLoading: false,
      baseline: null,
      error: '',
      values: {
        objective: '',
        durationType: '',
        startDate: _todayKey(),
        targetMode: 'flight_plan',
        targetValue: '',
        difficulty: '',
        build: ''
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
    var title = ['Objetivo', 'Duração', 'Data de início', 'Dificuldade', 'Estratégia operacional', 'Resumo final'][step] || 'Nova Temporada';
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
      'Defina a intensidade das jogadas que o BocaFood vai sugerir.',
      'Escolha o caminho usado para montar as próximas ações.',
      'Revise a rota, o esforço e a base antes de iniciar.'
    ][step] || 'Monte uma temporada clara para executar o Plano de Voo.';
  }

  function _wizardDecisionPanel(step) {
    var values = _wizard.values || {};
    var baseline = _wizard.baseline;
    var plan = baseline && baseline.planConnection ? baseline.planConnection : null;
    var range = _wizardPeriodRange(values);
    var facts = [
      { label: 'Objetivo', value: values.objective ? _objectiveLabel(values.objective) : 'Escolher agora' },
      { label: 'Ritmo', value: values.difficulty ? _difficultyLabel(values.difficulty) : 'Ainda não definido' },
      { label: 'Estratégia', value: values.build ? _buildLabel(values.build) : 'Ainda não definida' }
    ];
    var routeValue = plan ? _fmtMoney(plan.gapAtStart || plan.routeTarget || 0) : (_wizard.baselineLoading ? 'Buscando rota' : 'Plano de Voo');
    var guidance = [
      'Primeiro escolha o que você quer melhorar nesta temporada.',
      'Sprint é mais rápido. Temporada dá mais tempo para observar resposta.',
      'A data define quando o BocaFood começa a medir pedidos e jogadas.',
      'Quanto maior a dificuldade, mais jogadas ficam ativas ao mesmo tempo.',
      'A estratégia muda a ordem das ações sugeridas: volume, margem ou fidelização.',
      'Depois de salvar, a temporada vira acompanhamento. Para mudar o caminho, crie outra.'
    ][step] || '';
    return '' +
      '<aside class="seasons-wizard-decision">' +
        '<div class="seasons-wizard-orbit">' +
          '<span></span><span></span><span></span>' +
          _icon(step === 5 ? 'verified' : (step === 2 ? 'event_upcoming' : 'track_changes')) +
        '</div>' +
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
      'Por onde o BocaFood deve procurar as jogadas?',
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
      var disabled = field === 'build' && !_isBuildAllowedForObjective(_wizard.values.objective, opt.value);
      return '' +
        '<button class="seasons-choice-card ' + (active ? 'active ' : '') + (disabled ? 'disabled' : '') + '" type="button" ' + (disabled ? 'disabled aria-disabled="true"' : 'onclick="Modules.Temporadas._wizardSelect(\'' + _esc(field) + '\',\'' + _esc(opt.value) + '\')"') + '>' +
          '<i>' + _icon(meta.icon) + '</i>' +
          '<strong>' + _esc(opt.label) + '</strong>' +
          '<span>' + _esc(opt.text) + '</span>' +
          '<small>' + _esc(disabled ? _blockedBuildReason(_wizard.values.objective, opt.value) : meta.hint) + '</small>' +
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
        sprint: { icon: 'timer', hint: 'Melhor para testar uma jogada rápida.' },
        season: { icon: 'event_upcoming', hint: 'Melhor para acompanhar mudança com mais calma.' }
      },
      difficulty: {
        safe: { icon: 'schedule', hint: 'Uma jogada principal, menos pressão.' },
        balanced: { icon: 'speed', hint: 'Duas jogadas diferentes, ritmo constante.' },
        aggressive: { icon: 'track_changes', hint: 'Até três jogadas, execução mais intensa.' }
      },
      build: {
        volume: { icon: 'trending_up', hint: 'Procura mais pedidos e mais movimento.' },
        margin: { icon: 'analytics', hint: 'Procura vender melhor, com mais sobra.' },
        retention: { icon: 'verified', hint: 'Procura trazer clientes de volta.' }
      }
    };
    return map[field] && map[field][value] || { icon: 'track_changes', hint: 'Ajuda o BocaFood a escolher melhores jogadas.' };
  }

  function _summaryStep() {
    var values = _wizard.values;
    var duration = _findByValue(DURATIONS, values.durationType);
    var baseline = _wizard.baseline;
    var plan = baseline && baseline.planConnection ? baseline.planConnection : null;
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
        _summaryRow('Base da temporada', plan ? (plan.flightPlanName || 'Rota do Plano de Voo') : (_wizard.baselineLoading ? 'Buscando rota...' : 'Plano de Voo não encontrado')) +
        _summaryRow('Período da rota', plan ? _formatPeriod(plan.periodStart, plan.periodEnd) : (_wizard.baselineLoading ? 'Buscando...' : 'Não calculado')) +
        _summaryRow('Meta da rota', plan ? _fmtMoney(plan.routeTarget) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculada')) +
        _summaryRow('Já realizado', plan ? _fmtMoney(plan.currentValueAtStart) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculado')) +
        _summaryRow('Falta cumprir', plan ? _fmtMoney(plan.gapAtStart) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculado')) +
        _summaryRow('Dificuldade', _difficultyLabel(values.difficulty)) +
        _summaryRow('Estratégia', _buildLabel(values.build)) +
        _summaryRow('Ponto de partida', baseline ? _formatBaselineValue(baseline.baselineValue, values.objective) : (_wizard.baselineLoading ? 'Calculando...' : 'Não calculado')) +
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
      alerts.push('Há poucos pedidos dentro desta temporada. A rota continua valendo, mas a leitura inicial pode ficar menos precisa.');
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

  function _isBuildAllowedForObjective(objective, build) {
    if (!objective || !build) return true;
    return !_isBuildMisaligned(objective, build);
  }

  function _blockedBuildReason(objective, build) {
    if (!objective) return 'Escolha primeiro o objetivo da temporada.';
    return _buildMisalignmentMessage(objective, build);
  }

  function _buildMisalignmentMessage(objective, build) {
    if (objective === 'increase_ticket' && build === 'volume') return 'Essa combinação pode funcionar, mas Volume prioriza quantidade de pedidos, não valor por pedido.';
    if (objective === 'sell_more' && build === 'margin') return 'Essa combinação pode funcionar, mas Margem prioriza valor por pedido e produtos premium, não volume total.';
    if (objective === 'retain_customers' && build === 'volume') return 'Essa combinação pode funcionar, mas Volume prioriza pedidos, não recorrência e relacionamento.';
    if (objective === 'improve_consistency' && build === 'margin') return 'Essa combinação pode funcionar, mas Margem pode desviar o foco da regularidade operacional.';
    return 'Essa combinação pode funcionar, mas a estratégia escolhida não é a mais alinhada ao objetivo.';
  }

  function _wizardSelect(field, value) {
    if (!_wizard || _wizard.saving) return;
    if (field === 'build' && !_isBuildAllowedForObjective(_wizard.values.objective, value)) {
      _wizard.error = _blockedBuildReason(_wizard.values.objective, value);
      _renderWizard();
      return;
    }
    _wizard.values[field] = value;
    if (field === 'objective' && _wizard.values.build && !_isBuildAllowedForObjective(value, _wizard.values.build)) {
      _wizard.values.build = '';
    }
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
    if (step === 4 && !values.build) return 'Escolha uma estratégia operacional.';
    if (step === 4 && !_isBuildAllowedForObjective(values.objective, values.build)) return _blockedBuildReason(values.objective, values.build);
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

      var end = range ? range.end : new Date();
      var now = new Date();
      var progressEnd = now < end ? now : end;
      var validOrders = range && progressEnd >= range.start ? _ordersInPeriod(orders, range.start, progressEnd) : [];
      var duration = _findByValue(DURATIONS, values.durationType) || DURATIONS[0];
      var baseline = _buildBaselineMetrics(validOrders, (duration && duration.days) || 30);
      var baseValue = _baselineValueForObjective(baseline, values.objective);
      var currentRevenue = _number(baseline.baselineRevenue, 0);
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

  function _seasonMonthKeyFromDate(value) {
    var d = _toDate(value) || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function _resolveFlightPlanForSeason(monthKey, monthScenario, flightPlans) {
    var plans = Array.isArray(flightPlans) ? flightPlans : [];
    var snapId = String((monthScenario && monthScenario.snapshotId) || '').trim();
    if (snapId) {
      var byId = plans.filter(function (plan) { return String(plan.id || '') === snapId; })[0];
      if (byId) return byId;
    }
    var byMonth = plans.filter(function (plan) {
      return String(plan.targetMonthKey || '') === monthKey && plan.summary;
    }).sort(function (a, b) {
      return _dateValue(b.updatedAt || b.createdAt) - _dateValue(a.updatedAt || a.createdAt);
    })[0];
    if (byMonth) return byMonth;
    if (monthScenario && monthScenario.summary && Object.keys(monthScenario.summary).length) return monthScenario;
    return plans.filter(function (plan) { return plan && plan.summary; }).sort(function (a, b) {
      return _dateValue(b.updatedAt || b.selectedAt || b.createdAt) - _dateValue(a.updatedAt || a.selectedAt || a.createdAt);
    })[0] || null;
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
    var months = _monthIndexesInRange(range.start, range.end);
    var seriesTotal = series.reduce(function (sum, row) {
      return months.indexOf(_number(row.monthIndex, -1)) >= 0 ? sum + _number(row.revenue, 0) : sum;
    }, 0);
    return seriesTotal > 0 ? seriesTotal : total;
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
    if (objective === 'sell_more') return Math.max(1, gap || routeTarget);
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
    return Math.max(1, gap || routeTarget);
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
    var raw = order && (order.canonicalDate || order.createdAt || order.orderDate || order.date || order.data || order.paidAt || order.deliveryDate || order.scheduleDate || order.updatedAt);
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
        upsellDiscount: _getNumber(item.upsellDiscount || item.upsellDiscountTotal || 0)
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
      products: _calculateProductImpact(validOrders, season, baseline)
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

  function _calculateProductImpact(validOrders, season, baseline) {
    var map = {};
    (validOrders || []).forEach(function (order) {
      (order.items || []).forEach(function (item) {
        var key = item.productId || item.id || item.name;
        if (!key) return;
        if (!map[key]) map[key] = { productId: item.productId || item.id || '', name: item.name, quantity: 0, revenue: 0, impactScore: 0 };
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
    return {
      topProduct: products[0] || null,
      products: products.slice(0, 6)
    };
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
      if (existing) return existing;
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

  function _loadSnapshotOrders(season, snapshotType) {
    var range = _snapshotRange(season, snapshotType);
    if (window.DB && typeof DB.col === 'function') {
      return DB.col('orders')
        .where('createdAt', '>=', range.periodStart)
        .where('createdAt', '<=', range.periodEnd)
        .get()
        .then(function (snap) {
          return snap.docs.map(function (doc) {
            return Object.assign({}, doc.data(), { id: doc.id });
          });
        }).catch(function (err) {
          console.warn('Temporadas snapshot orders fallback', err);
          return DB.getAll('orders').then(function (orders) {
            return _ordersInPeriod(orders || [], range.periodStart, range.periodEnd);
          });
        });
    }
    return DB.getAll('orders').then(function (orders) {
      return _ordersInPeriod(orders || [], range.periodStart, range.periodEnd);
    });
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
      aiRecommendationError: ''
    };
  }

  function _ensureSnapshotAIRecommendation(season, snapshotState) {
    if (!season || season.status !== 'active') return Promise.resolve(null);
    var daily = snapshotState && snapshotState.daily;
    if (!daily || !daily.id || !window.DB || typeof DB.update !== 'function') return Promise.resolve(daily || null);
    if (daily.aiRecommendation && (daily.aiRecommendationStatus === 'generated' || daily.aiRecommendationStatus === 'fallback')) {
      return Promise.resolve(daily);
    }

    var context = _buildAIContext(season, snapshotState);
    return _generateAIRecommendation(context).then(function (result) {
      var now = new Date().toISOString();
      var recommendation = result.recommendation || _fallbackRecommendationForUI();
      var patch = {
        aiRecommendation: recommendation,
        aiRecommendationGeneratedAt: now,
        aiRecommendationModel: result.model || 'local-rules-v1',
        aiRecommendationStatus: result.status || 'fallback',
        aiRecommendationError: result.error || ''
      };
      return DB.update('season_metrics_snapshots', daily.id, patch).then(function () {
        _persistSeasonAIFields(season, recommendation, now);
        return Object.assign({}, daily, patch);
      });
    }).catch(function (err) {
      var fallback = _fallbackRecommendationForUI();
      var patch = {
        aiRecommendation: fallback,
        aiRecommendationGeneratedAt: new Date().toISOString(),
        aiRecommendationModel: 'local-rules-v1',
        aiRecommendationStatus: 'fallback',
        aiRecommendationError: err && err.message ? err.message : 'AI recommendation fallback'
      };
      return DB.update('season_metrics_snapshots', daily.id, patch).then(function () {
        return Object.assign({}, daily, patch);
      });
    });
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
      actionTaskHistory: metrics.actionTaskHistory || season.actionTaskHistory || []
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

  function _persistSeasonAIFields(season, recommendation, generatedAt) {
    if (!season || !season.id || !window.DB || typeof DB.update !== 'function') return;
    DB.update('seasons', season.id, {
      aiEnabled: false,
      lastAIRecommendationAt: generatedAt,
      lastAIRecommendationSummary: recommendation && (recommendation.headline || recommendation.nextAction || recommendation.summary) ? (recommendation.headline || recommendation.nextAction || recommendation.summary) : ''
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
      alerts.push(_snapshotAlert('no_orders', 'warning', 'Sem pedidos no período', 'Nenhum pedido válido foi encontrado no período do snapshot.', 'orders', 0, 1));
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
      worked.push(signals.products.topProduct + ' ajudou a puxar a temporada.');
    }

    if (_number(season.progressPercent, 0) < 75) blocked.push('O progresso ficou abaixo de 75% da meta.');
    if (season.riskLevel === 'high' || season.riskLevel === 'very_high') blocked.push('A chance de falha permaneceu elevada no encerramento.');
    if (!_number(metrics.orders, 0)) blocked.push('Faltaram pedidos válidos no período analisado.');
    if (_number(metrics.weeklyRegularity, 1) < .55) blocked.push('A regularidade semanal ficou instável.');
    if (!_number(metrics.recurringCustomers, 0) && season.objective === 'retain_customers') blocked.push('A recorrência de clientes ficou baixa.');
    if (signals.promotions && _number(signals.promotions.discountTotal, 0) > 0 && _number(metrics.averageTicket, 0) < _number(season.baselineAverageTicket, 0)) {
      blocked.push('Alguns descontos podem ter reduzido o ticket médio.');
    }

    return {
      headline: _finalHeadlineForSeason(season, finalResult),
      worked: _uniqueTextItems(worked).slice(0, 5).length ? _uniqueTextItems(worked).slice(0, 5) : ['Houve base suficiente para encerrar a temporada com leitura objetiva.'],
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
    if (window.DB && typeof DB.col === 'function') {
      var period = _seasonPeriod(season);
      return DB.col('orders')
        .where('createdAt', '>=', period.baselineStart)
        .where('createdAt', '<=', period.currentEnd)
        .get()
        .then(function (snap) {
          return snap.docs.map(function (doc) {
            return Object.assign({}, doc.data(), { id: doc.id });
          });
        }).catch(function (err) {
          console.warn('Temporadas period query fallback', err);
          return DB.getAll('orders');
        });
    }
    return DB.getAll('orders');
  }

  function _calculateSeasonScore(season, allOrders, actionContext) {
    var period = _seasonPeriod(season);
    var currentOrders = _ordersInPeriod(allOrders || [], period.start, period.currentEnd);
    var baselineOrders = _ordersInPeriod(allOrders || [], period.baselineStart, period.start);
    var current = _buildRuntimeMetrics(currentOrders, period.elapsedDays || 1);
    var baseline = _buildRuntimeMetrics(baselineOrders, period.durationDays || 30);
    var validatedImpactSignals = _calculateValidatedImpactSignals(currentOrders, season, baseline, actionContext || {});
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

  function _buildRuntimeMetrics(orders, days) {
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
    var weakDays = Math.max(0, _number(days, 0) - base.baselineActiveDays);
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
      pointsDiscount: pointsDiscount
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
    return ({ volume: 'Volume', margin: 'Margem', retention: 'Fidelização' })[value] || value || 'Não definido';
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
