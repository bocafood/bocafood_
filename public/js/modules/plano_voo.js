// js/modules/plano_voo.js
window.Modules = window.Modules || {};
Modules.PlanoDeVoo = (function () {
  'use strict';

  var _activeSub = 'simulacao';
  var _loading = false;
  var MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  var _data = {
    orders: [],
    products: [],
    costItems: [],
    recipes: [],
    movements: [],
    saidas: [],
    apagar: [],
    contasPagar: [],
    categorias: [],
    contas: [],
    geral: {},
    dinheiro: {},
    financeiro: {},
    custos: {},
    canais: [],
    tpv: {},
    snapshots: [],
    monthScenario: null
  };

  var _state = _defaultState();

  var TABS = [
    { key: 'simulacao', label: 'Rota' }
  ];

  var SCENARIOS = {
    survival: { label: 'Sobrevivência', factor: 0.90, tone: '#D97706', bg: '#FFF7ED' },
    equilibrium: { label: 'Segurança', factor: 1.00, tone: '#2563EB', bg: '#EEF4FF' },
    growth: { label: 'Crescimento', factor: 2.00, bg: '#EDFAF3', tone: '#1A9E5A' },
    expansion: { label: 'Lucro forte', factor: 3.00, bg: '#FFF0EE', tone: '#C4362A' }
  };

  function _defaultState() {
    return {
      periodType: 'annual',
      routePeriod: _defaultRoutePeriod(),
      mode: 'automatico',
      scenario: 'equilibrium',
      growthSource: 'historical',
      declineSource: 'historical',
      historyMonths: 0,
      annualMode: 'linear_growth',
      growthPct: 10,
      declinePct: 5,
      seasonality: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
      channelValues: {},
      channelMode: {},
      channelInclude: {},
      costMode: {},
      costPct: {},
      costInclude: {},
      fixedInclude: {},
      workDays: [1, 2, 3, 4, 5],
      plannedClosedDays: '',
      monthWeights: _defaultMonthWeights(),
      averageTicketOverride: 0,
      snapshotMonthKey: _currentMonthKey(),
      snapshotMonthLabel: _currentMonthLabel(),
      snapshotName: '',
      compareSnapshotId: '',
      currentTargetProfit: 500
    };
  }

  function _defaultRoutePeriod() {
    var d = new Date();
    return d.getMonth() === 0 ? 'full_year' : 'remaining_year';
  }

  function _defaultMonthWeights() {
    var route = _defaultRoutePeriod();
    var currentMonth = new Date().getMonth();
    var arr = [];
    for (var i = 0; i < 12; i += 1) arr.push(route === 'remaining_year' && i < currentMonth ? 0 : 100);
    return arr;
  }

  function render(sub) {
    _activeSub = _normalizeRouteSub(sub);
    var app = document.getElementById('app');
    app.innerHTML = '' +
      '<div id="pv-root" style="display:flex;flex-direction:column;height:100%;background:linear-gradient(180deg,#FFFCF8 0%,#FAF8F4 58%,#F6F1EB 100%);">' +
        '<div id="pv-content-wrap" style="flex:1;overflow-y:auto;padding:24px;">' +
          '<div style="display:flex;flex-direction:column;gap:16px;">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
              '<div style="min-width:0;flex:1 1 420px;">' +
                '<div style="font-size:11px;font-weight:600;color:#8A6F5A;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px;">Inteligência operacional</div>' +
                '<h2 style="font-size:24px;font-weight:600;color:#1F1F1F;margin:0 0 5px;line-height:1.15;">Plano de Voo</h2>' +
                '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0 0 8px;max-width:760px;">Escolha a rota do negócio e acompanhe o ritmo necessário para chegar nela.</p>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
                '<div id="pv-tabs"></div>' +
              '</div>' +
            '</div>' +
            '<div id="pv-content"><div class="loading-inline">Carregando...</div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    _renderTabs();
    _ensureStateDefaults();
    _paintActive();
    _load().then(function () {
      _ensureStateDefaults();
      _paintActive();
    }).catch(function (err) {
      console.error('Plano de Voo load error', err);
      _paintError(err);
    });
  }

  function _renderTabs() {
    var el = document.getElementById('pv-tabs');
    if (!el) return;
    var icons = {
      simulacao: 'flight_takeoff'
    };
    el.innerHTML = TABS.map(function (t) {
      var active = t.key === _activeSub;
      return '<button onclick="Modules.PlanoDeVoo._switchSub(\'' + t.key + '\')" style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:none;border-radius:999px;background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#6F6860') + ';font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:' + (active ? '0 10px 24px rgba(180,35,24,.18)' : 'inset 0 0 0 1px #EAE4DA') + ';transition:background .15s ease,color .15s ease,box-shadow .15s ease;white-space:nowrap;">' +
        '<span class="mi" style="font-size:17px;">' + _esc(icons[t.key] || 'radio_button_unchecked') + '</span>' + _esc(t.label) +
      '</button>';
    }).join('');
    el.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#FAF8F4;border-radius:999px;padding:4px;box-shadow:inset 0 0 0 1px #EAE4DA;max-width:100%;overflow:auto;';
  }

  function _switchSub(key) {
    _activeSub = key;
    _renderTabs();
    _paintActive();
    Router.navigate(_routeForSub(key));
  }

  function _normalizeRouteSub(sub) {
    var value = String(sub || '').replace(/^\/+|\/+$/g, '');
    if (!value || value === 'plano-de-voo') return 'simulacao';
    if (value.indexOf('plano-de-voo/') === 0) value = value.replace('plano-de-voo/', '');
    if (value === 'comparacao') return 'simulacao';
    if (value === 'simulacao') return value;
    return 'simulacao';
  }

  function _routeForSub(key) {
    key = _normalizeRouteSub(key);
    return 'crescimento/plano-de-voo';
  }

  function _paintError(err) {
    var content = document.getElementById('pv-content');
    if (!content) return;
    content.innerHTML = _safeHtml('<div style="' + _cardStyle() + 'color:#B42318;font-size:13px;">Erro ao carregar o módulo: ' + _esc((err && err.message) || err || 'desconhecido') + '</div>');
  }

  function _load() {
    _loading = true;
    return Promise.all([
      _safeAll('orders'),
      _safeAll('products'),
      _safeAll('itens_custo'),
      _safeAll('fichasTecnicas'),
      _safeAll('movimentacoes'),
      _safeAll('financeiro_saidas'),
      _safeAll('financeiro_apagar'),
      _safeAll('contas_pagar'),
      _safeAll('financeiro_categorias'),
      _safeAll('contas_bancarias'),
      _safeDoc('config', 'geral'),
      _safeDoc('config', 'dinheiro'),
      _safeDoc('config', 'financeiro'),
      _safeDoc('config', 'custos'),
      _safeDoc('config', 'canais_venda'),
      _safeDoc('config', 'fiscal'),
      _safeDoc('config', 'tpv'),
      _safeAll('flight_plans'),
      _safeDoc('flight_plan_month_scenarios', _currentMonthKey())
    ]).then(function (r) {
      _data.orders = r[0] || [];
      _data.products = r[1] || [];
      _data.costItems = r[2] || [];
      _data.recipes = r[3] || [];
      _data.movements = r[4] || [];
      _data.saidas = r[5] || [];
      _data.contasPagar = r[7] || [];
      _data.apagar = [].concat(r[6] || [], r[7] || []);
      _data.categorias = r[8] || [];
      _data.contas = r[9] || [];
      _data.geral = _normalizeGeneral(r[10] || {});
      _data.dinheiro = _normalizeMoney(r[11] || {});
      _data.financeiro = r[12] || {};
      _data.custos = r[13] || {};
      _data.canais = _normalizeChannels(r[14] || {}, r[16] || {});
      _data.fiscal = _normalizeFiscal(r[15] || {});
      _data.tpv = r[16] || {};
      _data.snapshots = (r[17] || []).slice().sort(function (a, b) {
        return _ts(b.createdAt) - _ts(a.createdAt);
      });
      _data.monthScenario = r[18] || null;
      _loading = false;
    }).catch(function (err) {
      _loading = false;
      console.error('Plano de Voo data load error', err);
    });
  }

  function _ensureStateDefaults() {
    _state.periodType = 'annual';
    _state.routePeriod = _defaultRoutePeriod();
    _state.annualMode = 'seasonality_manual';
    _normalizeRouteMonthWeights();
    var channels = _channelCatalog();
    channels.forEach(function (ch) {
      var hist = _channelHistoryAverage(ch.key, _historyMonthsBack());
      var recent = _channelCurrentMonthTotal(ch.key);
      if (_state.channelInclude[ch.key] == null) _state.channelInclude[ch.key] = true;
      if (_state.channelMode[ch.key] == null) _state.channelMode[ch.key] = hist.hasData ? 'automatico' : 'manual';
      if (_state.channelValues[ch.key] == null) _state.channelValues[ch.key] = hist.hasData ? hist.avg : recent;
      else if (!hist.hasData && recent > 0 && _num(_state.channelValues[ch.key]) <= 0) _state.channelValues[ch.key] = recent;
    });

    _buildVariableSeed().forEach(function (row) {
      if (_state.costInclude[row.key] == null) _state.costInclude[row.key] = true;
      if (row.key === 'indirect') {
        _state.costMode[row.key] = row.mode;
        _state.costPct[row.key] = row.pct;
      } else if (_state.costMode[row.key] == null) _state.costMode[row.key] = row.mode;
      if (row.key !== 'indirect' && _state.costPct[row.key] == null) _state.costPct[row.key] = row.pct;
      else if (row.key === 'products' && row.pct > 0 && _num(_state.costPct[row.key]) <= 0 && (_state.costMode[row.key] || row.mode) === 'automatico') _state.costPct[row.key] = row.pct;
    });

    _buildFixedSeed().forEach(function (row) {
      if (_state.fixedInclude[row.id] == null) _state.fixedInclude[row.id] = true;
    });

    if (!_state.snapshotName) _state.snapshotName = _defaultSnapshotName();
    if (_state.compareSnapshotId == null) _state.compareSnapshotId = '';
  }

  function _normalizeGeneral(c) {
    c = c || {};
    return {
      indirectCostMode: c.variableCostMode || c.custosVariaveisModo || c.indirectCostMode || c.custosIndiretosModo || 'manual',
      indirectCostPercent: _num(c.variableCostPercent != null ? c.variableCostPercent : c.percentualCustosVariaveis != null ? c.percentualCustosVariaveis : c.indirectCostPercent != null ? c.indirectCostPercent : c.percentualCustosIndiretos != null ? c.percentualCustosIndiretos : 0),
      indirectCostMonths: parseInt(c.variableCostMonths != null ? c.variableCostMonths : c.custosVariaveisMeses != null ? c.custosVariaveisMeses : c.indirectCostMonths != null ? c.indirectCostMonths : c.custosIndiretosMeses != null ? c.custosIndiretosMeses : 6, 10) || 6,
      businessName: c.businessName || c.nomeNegocio || '',
      description: c.description || '',
      primaryColor: c.primaryColor || '#C4362A'
    };
  }

  function _normalizeMoney(c) {
    c = c || {};
    return {
      desiredMarginPct: _num(c.desiredMarginPct != null ? c.desiredMarginPct : 60),
      minMarginPct: _num(c.minMarginPct != null ? c.minMarginPct : 40),
      defaultMarkup: _num(c.defaultMarkup != null ? c.defaultMarkup : 3),
      rounding: c.rounding || '90',
      ivaPct: _num(c.ivaPct != null ? c.ivaPct : 0),
      cardFeePct: _num(c.cardFeePct != null ? c.cardFeePct : 0),
      marketplaceCommissionPct: _num(c.marketplaceCommissionPct != null ? c.marketplaceCommissionPct : 0),
      fixedOrderFee: _num(c.fixedOrderFee != null ? c.fixedOrderFee : 0),
      estimatedTaxReservePct: _num(c.estimatedTaxReservePct != null ? c.estimatedTaxReservePct : 0),
      otherFeesPct: _num(c.otherFeesPct != null ? c.otherFeesPct : 0)
    };
  }

  function _normalizeFiscal(c) {
    c = c || {};
    var iva = _num(c.defaultIvaRate != null ? c.defaultIvaRate : (c.ivaPadrao != null ? c.ivaPadrao : 0));
    return {
      usarCalculoFiscal: c.usarCalculoFiscal === true,
      defaultIvaRate: iva,
      ivaPadrao: iva,
      pricesIncludeIva: c.pricesIncludeIva !== false,
      irpfPadrao: _num(c.irpfPadrao != null ? c.irpfPadrao : 0)
    };
  }

  function _isTpvEnabledConfig(cfg) {
    cfg = cfg || {};
    return cfg.enabled === true || cfg.tpvEnabled === true || cfg.active === true;
  }

  function _normalizeChannels(c, tpvConfig) {
    c = c || {};
    var list = Array.isArray(c.list) ? c.list.slice() : [];
    var tpvEnabled = _isTpvEnabledConfig(tpvConfig);
    var hasCardapio = list.some(function (ch) { return _isCardapioChannel(ch); });
    var hasTpv = list.some(function (ch) { return _isTpvChannel(ch); });
    if (!hasCardapio) list.unshift({ name: 'Cardápio', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true });
    if (tpvEnabled && !hasTpv) list.splice(1, 0, { name: 'Venda presencial', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true });
    return list.filter(function (ch) {
      return tpvEnabled || !_isTpvChannel(ch);
    }).map(function (ch) {
      var cardapio = _isCardapioChannel(ch);
      var tpv = _isTpvChannel(ch);
      var key = _channelKey(cardapio ? 'Cardápio' : (tpv ? 'Venda presencial' : (ch.name || '')));
      return {
        key: key,
        name: cardapio ? 'Cardápio' : (tpv ? 'Venda presencial' : (ch.name || '')),
        commissionPct: (cardapio || tpv) ? 0 : _num(ch.commissionPct),
        fixedFee: (cardapio || tpv) ? 0 : _num(ch.fixedFee),
        taxPct: (cardapio || tpv) ? 0 : _num(ch.taxPct),
        entradaCategoriaId: String(ch.entradaCategoriaId || ch.incomeCategoryId || ch.categoriaEntradaId || ch.financialCategoryId || ch.categoriaFinanceiraId || ''),
        entradaCategoriaNome: String(ch.entradaCategoriaNome || ch.incomeCategoryName || ch.categoriaEntradaNome || ch.financialCategoryName || ch.categoriaFinanceiraNome || ''),
        incomeCategoryId: String(ch.incomeCategoryId || ch.entradaCategoriaId || ch.categoriaEntradaId || ch.financialCategoryId || ch.categoriaFinanceiraId || ''),
        incomeCategoryName: String(ch.incomeCategoryName || ch.entradaCategoriaNome || ch.categoriaEntradaNome || ch.financialCategoryName || ch.categoriaFinanceiraNome || ''),
        locked: cardapio || tpv || !!ch.locked
      };
    });
  }

  function _defaultSnapshotName() {
    var d = new Date();
    return 'Rota ' + _scenarioLabel(_state.scenario || 'equilibrium') + ' ' + d.getFullYear();
  }

  function _forecastRevenueBase() {
    return _channelRowsForBase().reduce(function (sum, ch) {
      return sum + (ch.include ? ch.baseMonthly : 0);
    }, 0);
  }

  function _buildVariableSeed() {
    var revenueBase = _forecastRevenueBase();
    var channels = _channelRowsForBase(revenueBase);
    return _variableRowsForRevenue(revenueBase, channels).map(function (row) {
      return {
        key: row.key,
        name: row.name,
        pct: row.pct,
        mode: row.mode
      };
    });
  }

  function _buildFixedSeed() {
    return _fixedRowsForForecast().map(function (row) {
      return {
        id: row.id,
        name: row.name
      };
    });
  }

  function _safeAll(col) {
    return Promise.resolve().then(function () {
      return DB.getAll(col);
    }).catch(function () {
      return [];
    });
  }

  function _safeDoc(col, id) {
    return Promise.resolve().then(function () {
      return DB.getDocRoot(col, id);
    }).catch(function () {
      return null;
    });
  }

  function _paintActive() {
    return _paintSimulacao();
  }

  function _paintSimulacao() {
    var html = _data.monthScenario
      ? '' +
        _activeRouteCard(_data.monthScenario) +
        _routeBaseReadCard(_data.monthScenario) +
        _routeBreakEvenCard(_data.monthScenario) +
        _routeSafetyCard(_data.monthScenario) +
        _routeMonthPreviewCard(_data.monthScenario) +
        _routesCreatedCard(_data.monthScenario) +
        _routeQualityAlertsCard(_data.monthScenario)
      : '' +
        _noActiveRouteCard() +
        _routeReadinessCard();
    _paint(html);
  }


  function _paint(html) {
    var content = document.getElementById('pv-content');
    if (!content) return;
    try {
      content.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;">' + _safeHtml(html) + '</div>';
    } catch (err) {
      content.innerHTML = '<div style="' + _cardStyle() + 'color:#B42318;font-size:13px;">Erro ao montar a tela: ' + _esc((err && err.message) || err || 'desconhecido') + '</div>';
      console.error('Plano de Voo paint error', err);
    }
  }

  function _safeHtml(html) {
    return String(html == null ? '' : html).replace(/\bundefined\b/g, '');
  }


  function _noActiveRouteCard() {
    return '' +
      '<section style="' + _routeHeroStyle('#8A6F5A', '#F7EFE4') + '">' +
        '<div style="' + _routeHeroGlow('#8A6F5A') + '"></div>' +
        '<div style="position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;">' +
          '<div style="display:flex;gap:16px;align-items:center;min-width:0;">' +
            _routeGraphic('equilibrium') +
            '<div style="min-width:0;max-width:780px;">' +
              '<div style="font-size:11px;font-weight:600;color:#8A6F5A;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;">Plano de Voo</div>' +
              '<div style="font-size:24px;font-weight:600;color:#1F1F1F;line-height:1.12;">Nenhuma rota ativa ainda</div>' +
              '<div style="font-size:13px;color:#6F6860;line-height:1.5;margin-top:7px;">Crie uma rota para decidir quanto precisa vender, quantos pedidos precisa fazer por dia e qual resultado quer buscar neste ano.</div>' +
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;">' +
                _snapshotPill('Decisão do período', '#fff', '#8A6F5A', '#E7DDD1') +
                _snapshotPill('Acompanha execução', '#fff', '#6F6860', '#EAE4DA') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" onclick="Modules.PlanoDeVoo._openCreateRouteModal(\'create\')" style="height:42px;padding:0 16px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 14px 26px rgba(180,35,24,.20);white-space:nowrap;">Criar nova rota</button>' +
        '</div>' +
      '</section>';
  }

  function _routesCreatedCard(monthScenario) {
    if (monthScenario) return _unselectedScenariosCard(monthScenario);
    return '';
  }


  function _routeSmallStat(label, value, color) {
    return '<div style="background:#FAF8F4;border-radius:12px;padding:10px 11px;"><div style="font-size:11px;color:#6F6860;font-weight:500;margin-bottom:5px;">' + _esc(label) + '</div><div style="font-size:16px;color:' + _esc(color || '#1F1F1F') + ';font-weight:600;line-height:1.05;overflow-wrap:anywhere;">' + _esc(value) + '</div></div>';
  }

  function _unselectedScenariosCard(monthScenario) {
    var activeKey = (monthScenario && monthScenario.scenario) || 'equilibrium';
    var keys = ['survival', 'equilibrium', 'growth', 'expansion'].filter(function (key) { return key !== activeKey; });
    return '' +
      '<section style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:15px;background:linear-gradient(135deg,#fff 0%,#FFFCF8 100%);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">' +
              '<span class="mi" style="font-size:20px;color:#B42318;">alt_route</span>' +
              '<div style="font-size:15px;font-weight:600;color:#1F1F1F;">Rotas criadas</div>' +
            '</div>' +
            '<div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:5px;">Compare os caminhos que ficaram de fora e veja o que mudaria em venda, pedidos e sobra.</div>' +
          '</div>' +
          _snapshotPill('Comparação com a rota ativa', '#FFF0EE', '#B42318', '#F3C7C1') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">' +
          keys.map(_scenarioCompareMiniCard).join('') +
        '</div>' +
      '</section>';
  }

  function _scenarioCompareMiniCard(key) {
    var scenario = SCENARIOS[key] || SCENARIOS.equilibrium;
    var vm = _forecastForScenario(key, _activeRouteSnapshot(_data.monthScenario));
    var effort = _effortInfo(vm);
    var base = _activeRouteBaselineSummary();
    var revenueDelta = _num(vm.revenueTotal) - _num(base.revenue);
    var profitDelta = _num(vm.profit) - _num(base.profit);
    var ordersDelta = _num(_ordersPerDay(vm)) - _num(base.ordersPerDay);
    return '' +
      '<article style="background:#fff;border:1px solid ' + _esc(scenario.tone || '#EAE4DA') + '26;border-radius:16px;padding:14px;box-shadow:0 8px 20px rgba(31,31,31,.04);display:flex;flex-direction:column;gap:11px;min-width:0;position:relative;overflow:hidden;">' +
        '<div style="position:absolute;inset:0 0 auto 0;height:4px;background:' + _esc(scenario.tone || '#B42318') + ';opacity:.72;"></div>' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.2;">' + _esc(_scenarioLabel(key)) + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(_scenarioDecisionText(key)) + '</div>' +
          '</div>' +
          '<span class="mi" style="font-size:20px;color:' + _esc(scenario.tone || '#B42318') + ';">' + _esc(_scenarioIcon(key)) + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:7px;">' +
          _routeSmallStat('Vender', _fmtMoney(vm.revenueTotal)) +
          _routeSmallStat('Pedidos por dia', _ordersPerDay(vm)) +
          _routeSmallStat('Sobra', _fmtMoney(vm.profit), vm.profit >= 0 ? '#1F6F43' : '#B42318') +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:5px;border-radius:12px;background:#FAF8F4;padding:9px 10px;">' +
          _routeDeltaLine('Venda vs ativa', revenueDelta) +
          _routeDeltaLine('Sobra vs ativa', profitDelta) +
          _routeDeltaTextLine('Pedidos/dia vs ativa', (ordersDelta > 0 ? '+' : '') + _fmtNum(ordersDelta, 0)) +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:' + _esc(effort.bg) + ';border-radius:12px;padding:8px 10px;">' +
          '<span style="font-size:12px;color:#6F6860;">Esforço</span>' +
          '<span style="font-size:12px;color:' + _esc(effort.color) + ';font-weight:600;">' + _esc(effort.label) + '</span>' +
        '</div>' +
      '</article>';
  }

  function _activeRouteSnapshot(monthScenario) {
    monthScenario = monthScenario || _data.monthScenario || {};
    return (_data.snapshots || []).find(function (x) {
      return String(x.id || '') === String(monthScenario.snapshotId || '');
    }) || null;
  }

  function _activeRouteForecast(monthScenario) {
    var snap = _activeRouteSnapshot(monthScenario);
    return snap ? _snapshotToForecast(snap) : _forecastModel();
  }

  function _activeRouteBaselineSummary() {
    var monthScenario = _data.monthScenario || {};
    var snap = _activeRouteSnapshot(monthScenario);
    var summary = (snap && snap.summary) || monthScenario.summary || {};
    return {
      revenue: _num(summary.revenue),
      profit: _num(summary.profit),
      ordersPerDay: _num(summary.ordersPerDay || _ordersPerDayFromRevenue(summary.revenue))
    };
  }

  function _routeDeltaLine(label, value) {
    var n = _num(value);
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:#6F6860;line-height:1.2;"><span>' + _esc(label) + '</span><span style="font-weight:600;color:' + (n >= 0 ? '#1F6F43' : '#B42318') + ';">' + (n >= 0 ? '+' : '') + _fmtMoney(n) + '</span></div>';
  }

  function _routeDeltaTextLine(label, value) {
    var positive = String(value || '').charAt(0) !== '-';
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:#6F6860;line-height:1.2;"><span>' + _esc(label) + '</span><span style="font-weight:600;color:' + (positive ? '#1F6F43' : '#B42318') + ';">' + _esc(value) + '</span></div>';
  }

  function _routeBaseReadCard(monthScenario) {
    var snap = _activeRouteSnapshot(monthScenario) || {};
    var forecast = _activeRouteForecast(monthScenario);
    var summary = snap.summary || {};
    var ticket = _num(summary.averageTicket || _averageTicket());
    var workingDays = _num(summary.workingDays || _workingDaysInPeriod());
    var monthsText = snap.routeMonthCount ? snap.routeMonthCount + ' meses' : _routeMonthCount() + ' meses';
    return '' +
      '<section style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:14px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">' +
              '<span class="mi" style="font-size:20px;color:#8A6F5A;">tune</span>' +
              '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0;">Base da rota</h3>' +
            '</div>' +
          '</div>' +
          _snapshotPill((snap.routePeriodLabel || _routePeriodLabel()), '#FAF8F4', '#6F6860', '#EAE4DA') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:11px;">' +
          _baseMini('Ticket médio', ticket > 0 ? _fmtMoney(ticket) : 'Sem base', 'Valor médio usado para estimar pedidos.') +
          _baseMini('Dias de venda', workingDays ? String(workingDays) : 'Sem base', 'Dias úteis considerados na rota.') +
          _baseMini('Meses considerados', monthsText, 'Período que a rota acompanha.') +
        '</div>' +
      '</section>';
  }

  function _routeSafetyCard(monthScenario) {
    var forecast = _activeRouteForecast(monthScenario);
    var revenue = _num(forecast.revenueTotal);
    var variable = _num(forecast.variableTotal);
    var expenses = _num(forecast.fixedExpensesTotal != null ? forecast.fixedExpensesTotal : 0);
    var financialCosts = _num(forecast.financialCostsTotal || 0);
    var fixed = _num(forecast.fixedTotal || 0);
    if (!expenses && !financialCosts) expenses = fixed;
    var total = variable + expenses + financialCosts;
    var gap = revenue - total;
    return '' +
      '<section style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:14px;background:linear-gradient(135deg,#fff 0%,#FFF7ED 100%);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">' +
              '<span class="mi" style="font-size:20px;color:#B45309;">health_and_safety</span>' +
              '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0;">Ponto de segurança</h3>' +
            '</div>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:5px 0 0;max-width:780px;">Veja se a rota escolhida passa do mínimo necessário para o negócio respirar com mais tranquilidade.</p>' +
          '</div>' +
          _snapshotPill(gap >= 0 ? 'Rota cobre a base' : 'Atenção na base', gap >= 0 ? '#F0FAF4' : '#FFF0EE', gap >= 0 ? '#1F6F43' : '#B42318', gap >= 0 ? '#D9F2E3' : '#F3C7C1') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;align-items:stretch;">' +
          '<div style="border-radius:16px;background:#fff;border:1px solid #F0E7DE;padding:15px;display:flex;flex-direction:column;gap:10px;">' +
            '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;">' +
              '<span style="font-size:12px;color:#6F6860;">Total que precisa cobrir</span>' +
              '<strong style="font-size:20px;font-weight:600;color:#1F1F1F;">' + (total > 0 ? _fmtMoney(total) : 'Sem base') + '</strong>' +
            '</div>' +
            '<div style="height:8px;background:#F1ECE7;border-radius:999px;overflow:hidden;">' +
              '<div style="height:100%;width:' + _esc(_routeSafetyBarWidth(revenue, total)) + ';background:' + (gap >= 0 ? '#1F6F43' : '#B42318') + ';border-radius:999px;"></div>' +
            '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.4;">' + (gap >= 0 ? 'A rota passa ' + _fmtMoney(Math.abs(gap)) + ' do valor que precisa cobrir.' : 'Faltam ' + _fmtMoney(Math.abs(gap)) + ' para cobrir custos e despesas.') + '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px;">' +
            _routeCostBox('Custos das vendas', variable, '#8A6F5A') +
            _routeCostBox('Despesas indiretas', expenses, '#B45309') +
            _routeCostBox('Custos indiretos', financialCosts, '#6C8777') +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function _routeBreakEvenCard(monthScenario) {
    var forecast = _activeRouteForecast(monthScenario);
    var revenue = _num(forecast.revenueTotal);
    var breakEven = _num(forecast.breakEvenRevenue);
    if (!(breakEven > 0)) return '';
    var gap = revenue - breakEven;
    return '' +
      '<section style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:14px;background:linear-gradient(135deg,#fff 0%,#F7FBFF 100%);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">' +
              '<span class="mi" style="font-size:20px;color:#2563EB;">balance</span>' +
              '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0;">Ponto de equilíbrio</h3>' +
            '</div>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:5px 0 0;max-width:780px;">É a venda mínima estimada para o negócio pagar o que precisa e não terminar no prejuízo.</p>' +
          '</div>' +
          _snapshotPill(gap >= 0 ? 'Rota passa do equilíbrio' : 'Ainda abaixo do equilíbrio', gap >= 0 ? '#F0FAF4' : '#FFF7ED', gap >= 0 ? '#1F6F43' : '#B45309', gap >= 0 ? '#D9F2E3' : '#FED7AA') +
        '</div>' +
        '<div style="border-radius:16px;background:#fff;border:1px solid #E5EEF9;padding:15px;display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
            '<span style="font-size:12px;color:#6F6860;">Venda mínima para empatar</span>' +
            '<strong style="font-size:20px;font-weight:600;color:#1F1F1F;">' + _fmtMoney(breakEven) + '</strong>' +
          '</div>' +
          '<div style="height:8px;background:#EEF4FF;border-radius:999px;overflow:hidden;">' +
            '<div style="height:100%;width:' + _esc(_routeSafetyBarWidth(revenue, breakEven)) + ';background:' + (gap >= 0 ? '#1F6F43' : '#2563EB') + ';border-radius:999px;"></div>' +
          '</div>' +
          '<div style="font-size:12px;color:#6F6860;line-height:1.45;">' + (gap >= 0 ? 'A rota fica ' + _fmtMoney(Math.abs(gap)) + ' acima da venda mínima para empatar.' : 'Faltam ' + _fmtMoney(Math.abs(gap)) + ' para chegar na venda mínima de equilíbrio.') + '</div>' +
        '</div>' +
      '</section>';
  }

  function _routeSafetyBarWidth(revenue, breakEven) {
    if (!breakEven || breakEven <= 0) return '0%';
    return Math.max(6, Math.min(100, (revenue / breakEven) * 100)).toFixed(0) + '%';
  }

  function _routeCostBox(label, value, color) {
    return '<div style="background:#fff;border:1px solid #F0E7DE;border-radius:14px;padding:12px;min-width:0;"><div style="font-size:11px;color:#6F6860;line-height:1.25;margin-bottom:7px;">' + _esc(label) + '</div><div style="font-size:16px;font-weight:600;color:' + _esc(color || '#1F1F1F') + ';line-height:1.1;overflow-wrap:anywhere;">' + _fmtMoney(value) + '</div></div>';
  }

  function _routeMonthPreviewCard(monthScenario) {
    var forecast = _activeRouteForecast(monthScenario);
    var rows = Array.isArray(forecast.monthSeries) ? forecast.monthSeries.slice(0, 12) : [];
    if (!rows.length) return '';
    return '' +
      '<section style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:14px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">' +
              '<span class="mi" style="font-size:20px;color:#6C8777;">calendar_month</span>' +
              '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0;">Resumo da rota mês a mês</h3>' +
            '</div>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:5px 0 0;max-width:780px;">Uma leitura rápida do que foi planejado para cada mês da rota ativa.</p>' +
          '</div>' +
          '<button type="button" onclick="Router.navigate(\'crescimento/performance\')" style="height:36px;padding:0 13px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Acompanhar execução</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">' +
          rows.map(function (m) {
            var strength = _monthStrengthInfo(m.factor);
            return '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:7px;min-width:0;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
                '<span style="font-size:12px;font-weight:600;color:#1F1F1F;">' + _esc(m.label) + '</span>' +
                '<span style="font-size:11px;color:' + _esc(strength.color) + ';font-weight:600;">' + _esc(strength.label) + '</span>' +
              '</div>' +
              _monthStrengthBar(strength.score, strength.color) +
              '<div style="font-size:16px;font-weight:600;color:#1F1F1F;line-height:1.1;">' + _fmtMoney(m.revenue) + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function _monthStrengthInfo(factor) {
    var n = _num(factor);
    var score = n <= 0 ? 0 : Math.max(1, Math.min(10, Math.round(n * 5)));
    if (!score) return { score: 0, label: 'Sem força', color: '#8A7E7C' };
    if (score <= 3) return { score: score, label: 'Força ' + score + '/10', color: '#B45309' };
    if (score <= 6) return { score: score, label: 'Força ' + score + '/10', color: '#6F6860' };
    if (score <= 8) return { score: score, label: 'Força ' + score + '/10', color: '#1F6F43' };
    return { score: score, label: 'Força ' + score + '/10', color: '#B42318' };
  }

  function _monthStrengthBar(score, color) {
    var html = '<div aria-label="Força do mês" title="Força do mês" style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;">';
    for (var i = 1; i <= 10; i += 1) {
      html += '<span style="height:5px;border-radius:999px;background:' + (i <= score ? _esc(color || '#B42318') : '#E8DED4') + ';opacity:' + (i <= score ? '1' : '.75') + ';"></span>';
    }
    return html + '</div>';
  }

  function _routeQualityAlertsCard(monthScenario) {
    var forecast = _activeRouteForecast(monthScenario);
    var alerts = _routeQualityAlerts(forecast);
    if (!alerts.length) return '';
    return '' +
      '<section style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:12px;border-color:#FED7AA;background:#FFFDF8;">' +
        '<div style="display:flex;gap:10px;align-items:flex-start;">' +
          '<span class="mi" style="font-size:20px;color:#D97706;">tips_and_updates</span>' +
          '<div style="min-width:0;">' +
            '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 4px;">O que pode melhorar a leitura</h3>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Alguns dados deixam a rota mais fiel à realidade do negócio.</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">' +
          alerts.map(function (item) {
            return '<div style="background:#fff;border:1px solid #F0E7DE;border-radius:13px;padding:11px 12px;"><div style="font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.25;">' + _esc(item.title) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:4px;">' + _esc(item.text) + '</div></div>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function _routeReadinessCard() {
    var forecast = _forecastModel();
    var alerts = _routeQualityAlerts(forecast);
    var hasSalesHistory = (forecast.channels || []).some(function (ch) {
      return ch && ch.historyHasData === true && _num(ch.historyAvg) > 0;
    });
    return '' +
      '<section style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:13px;">' +
        '<div style="display:flex;gap:10px;align-items:flex-start;">' +
          '<span class="mi" style="font-size:20px;color:#8A6F5A;">checklist</span>' +
          '<div style="min-width:0;">' +
            '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 4px;">Antes de criar a rota</h3>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Veja como está o desempenho atual do negócio e use estes números como base para criar seu Plano de Voo.</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:11px;">' +
          _baseMini('Ticket médio', _averageTicket() ? _fmtMoney(_averageTicket()) : 'Falta base', 'Hoje, cada pedido está ficando perto deste valor.') +
          (hasSalesHistory ? _baseMini('Vendas recentes', _fmtMoney(forecast.revenueBase || 0), 'Mostra a média das vendas recentes. Use este número como ponto de partida e ajuste se hoje o negócio estiver vendendo mais ou menos que isso.') : '') +
          _baseMini('Custos e despesas', _fmtMoney(_num(forecast.variableTotal) + _num(forecast.fixedTotal)), 'Valor que o negócio precisa cobrir antes de sobrar dinheiro.') +
          _baseMini('Dias de trabalho', String(_workingDaysInPeriod()), 'Dias disponíveis para vender dentro deste período.') +
        '</div>' +
        (alerts.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + alerts.map(function (item) { return _snapshotPill(item.title, '#FFF7ED', '#B45309', '#FED7AA'); }).join('') + '</div>' : '') +
      '</section>';
  }

  function _routeQualityAlerts(forecast) {
    forecast = forecast || _forecastModel();
    var alerts = [];
    if (!_averageTicket()) alerts.push({ title: 'Ticket médio ausente', text: 'Informe ou gere pedidos para o BocaFood estimar melhor quantos pedidos por dia serão necessários.' });
    if (!_num(forecast.revenueBase)) alerts.push({ title: 'Vendas por canal vazias', text: 'Preencha a base mensal dos canais para os cenários começarem de uma previsão realista.' });
    if (!_num(forecast.variableTotal)) alerts.push({ title: 'Custo dos produtos zerado', text: 'Cadastre custos dos produtos para a rota mostrar melhor quanto pode sobrar.' });
    if (!_num(forecast.fixedTotal)) alerts.push({ title: 'Sem saídas indiretas', text: 'Inclua despesas ou custos indiretos no Financeiro para a rota considerar o que precisa sair do caixa.' });
    return alerts.slice(0, 4);
  }

  function _calculationBaseCard(vm) {
    var fullYear = _hasFullYearSalesHistory();
    var ticket = _averageTicket();
    var closedDays = String(_state.plannedClosedDays || '').trim() || 'Sem dias informados';
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
          '<div style="min-width:0;">' +
            '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 4px;">Ponto de partida da rota</h3>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:760px;">Antes de comparar as rotas, confirme a base que o BocaFood está usando para estimar venda, sobra e ritmo de pedidos.</p>' +
          '</div>' +
          '<span style="font-size:12px;color:' + (fullYear ? '#1F6F43' : '#B45309') + ';background:' + (fullYear ? '#F0FAF4' : '#FFF7ED') + ';border-radius:999px;padding:7px 10px;font-weight:600;">' + (fullYear ? 'Histórico anual disponível' : 'Base guiada pela operação') + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
          _routePeriodControl() +
          _baseMini('Ticket médio usado', ticket ? _fmtMoney(ticket) : 'Sem base suficiente', fullYear ? 'Calculado pelo histórico ou ajuste manual.' : 'Pode ser ajustado nos ajustes avançados.') +
          _baseMini('Custos considerados', _fmtMoney(vm.variableTotal), 'Usa custos e margens já cadastrados.') +
          _baseMini('Despesas previstas da rota', _fmtMoney(vm.fixedExpensesTotal != null ? vm.fixedExpensesTotal : vm.fixedTotal), 'Saídas previstas do Financeiro classificadas como despesa indireta.') +
          _baseMini('Custos previstos da rota', _fmtMoney(vm.financialCostsTotal || 0), 'Saídas previstas do Financeiro classificadas como custo indireto.') +
          _baseMini('Dias trabalhados', String(_workingDaysInPeriod()), 'Usado para calcular pedidos por dia.') +
          _baseMini('Dias fechados', closedDays, 'Feriados ou dias em que não haverá venda.') +
          _baseMini('Força dos meses', _monthWeightsSummary(), 'Mostra se há meses mais fortes ou mais fracos.') +
        '</div>' +
        '<div style="margin-top:12px;font-size:12px;color:#6F6860;line-height:1.5;background:#FAF8F4;border-radius:12px;padding:11px 12px;">' +
          (fullYear
            ? 'Como já existe histórico de um ano, o histórico de vendas pode ter mais peso na rota.'
            : 'Como ainda não há um ano completo de histórico, a rota deve se apoiar mais em custos, margem, ticket médio, dias trabalhados e força de cada mês.') +
        '</div>' +
      '</section>';
  }

  function _workRealityCard() {
    var currentMonth = new Date().getMonth();
    return '' +
      '<details style="' + _cardStyle() + 'padding:0;overflow:hidden;">' +
        '<summary style="list-style:none;cursor:pointer;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
          '<span style="display:flex;gap:12px;align-items:flex-start;min-width:0;">' +
            '<span class="mi" style="font-size:22px;color:#B42318;">event_available</span>' +
            '<span style="min-width:0;">' +
              '<strong style="display:block;font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.2;">Confirme sua realidade de trabalho</strong>' +
              '<small style="display:block;font-size:13px;color:#6F6860;line-height:1.4;margin-top:3px;">Ajuste dias de trabalho, dias fechados e meses mais fortes ou mais fracos.</small>' +
            '</span>' +
          '</span>' +
          '<span class="mi" style="font-size:21px;color:#6F6860;">expand_more</span>' +
        '</summary>' +
        '<div style="display:flex;flex-direction:column;gap:14px;padding:0 20px 20px;">' +
          '<div style="display:flex;justify-content:flex-start;">' + _chip('Preparado para distribuição mensal') + '</div>' +
          '<div style="display:grid;grid-template-columns:minmax(260px,1.1fr) minmax(220px,.9fr);gap:14px;align-items:start;">' +
            '<div style="display:flex;flex-direction:column;gap:12px;">' +
              '<div>' +
                '<div style="' + _labelStyle() + 'margin-bottom:8px;">Dias da semana em que trabalha</div>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + _workDayButtons() + '</div>' +
              '</div>' +
              _textAreaField('pv-closed-days', 'Feriados ou dias fechados', _state.plannedClosedDays, 'Ex.: 01/05, 24/12', 'Modules.PlanoDeVoo._setClosedDays(this.value)') +
            '</div>' +
            '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:16px;padding:14px;">' +
              '<div style="font-size:13px;font-weight:600;color:#1F1F1F;margin-bottom:4px;">Meses mais fortes ou mais fracos</div>' +
              '<div style="font-size:12px;color:#6F6860;line-height:1.45;margin-bottom:12px;">Use 100 como mês normal. Menor que 100 indica mês mais fraco; maior que 100 indica mês mais forte. Use 0 quando não for trabalhar naquele mês. Se não quiser incluir o mês atual na rota, coloque 0 nele também.</div>' +
              '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">' +
                MONTHS.map(function (m, i) {
                  var locked = _state.routePeriod === 'remaining_year' && i < currentMonth;
                  var value = locked ? 0 : (_state.monthWeights[i] != null ? _state.monthWeights[i] : 100);
                  return '<label style="display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:600;color:#6F6860;opacity:' + (locked ? '.62' : '1') + ';">' +
                    '<span>' + _esc(m) + '</span>' +
                    '<input type="number" step="1" value="' + _esc(value) + '"' + (locked ? ' disabled' : '') + ' oninput="Modules.PlanoDeVoo._setMonthWeight(' + i + ', this.value)" style="' + _inputStyle() + 'height:36px;padding:8px 10px;' + (locked ? 'background:#F1ECE7;color:#8A7E7C;cursor:not-allowed;' : '') + '">' +
                  '</label>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</details>';
  }

  function _baseMini(label, value, text) {
    return '' +
      '<div style="background:linear-gradient(180deg,#fff 0%,#FFFCF8 100%);border:1px solid #EAE4DA;border-radius:14px;padding:13px 14px;min-height:84px;box-shadow:0 8px 18px rgba(31,31,31,.035);">' +
        '<div style="font-size:11px;font-weight:600;color:#6F6860;line-height:1.2;margin-bottom:7px;">' + _esc(label) + '</div>' +
        '<div style="font-size:18px;font-weight:600;color:#1F1F1F;line-height:1.1;overflow-wrap:anywhere;">' + _esc(value) + '</div>' +
        '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:6px;">' + _esc(text || '') + '</div>' +
      '</div>';
  }

  function _routePeriodControl() {
    return _baseMini('Período da rota', _routePeriodLabel(), 'A rota é criada para acompanhar o período anual.');
  }

  function _workDayButtons() {
    var days = [
      [1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom']
    ];
    return days.map(function (d) {
      var active = (_state.workDays || []).indexOf(d[0]) >= 0;
      return '<button type="button" onclick="Modules.PlanoDeVoo._toggleWorkDay(' + d[0] + ')" style="height:34px;min-width:48px;border:1px solid ' + (active ? '#B42318' : '#EAE4DA') + ';background:' + (active ? '#FFF0EE' : '#fff') + ';color:' + (active ? '#B42318' : '#6F6860') + ';border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">' + _esc(d[1]) + '</button>';
    }).join('');
  }

  function _textAreaField(id, label, value, placeholder, onchange) {
    return '' +
      '<label style="display:block;margin-bottom:0;">' +
        '<span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">' + _esc(label) + '</span>' +
        '<textarea id="' + id + '" onchange="' + onchange + '" placeholder="' + _esc(placeholder || '') + '" style="' + _inputStyle() + 'height:76px;resize:vertical;line-height:1.35;">' + _esc(value || '') + '</textarea>' +
      '</label>';
  }

  function _activeRouteCard(monthScenario) {
    var snap = (_data.snapshots || []).find(function (x) { return String(x.id || '') === String(monthScenario.snapshotId || ''); }) || {};
    var summary = snap.summary || monthScenario.summary || {};
    var scenarioKey = monthScenario.scenario || snap.scenario || 'equilibrium';
    var scenario = SCENARIOS[scenarioKey] || SCENARIOS.equilibrium;
    var revenue = _num(summary.revenue || 0);
    var profit = _num(summary.profit || 0);
    var ordersDay = summary.ordersPerDay != null ? _fmtNum(_num(summary.ordersPerDay), 1) : _ordersPerDayFromRevenue(revenue);
    var routeId = snap.id || monthScenario.snapshotId || '';
    return '' +
      '<section style="' + _routeHeroStyle(scenario.tone || '#B42318', scenario.bg || '#FFF0EE') + '">' +
        '<div style="' + _routeHeroGlow(scenario.tone || '#B42318') + '"></div>' +
        '<div style="position:relative;display:flex;flex-direction:column;gap:17px;">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap;">' +
            '<div style="min-width:0;display:flex;gap:16px;align-items:center;flex:1 1 560px;">' +
              _routeGraphic(scenarioKey) +
              '<div style="min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
                  '<span style="font-size:11px;font-weight:600;color:' + _esc(scenario.tone || '#B42318') + ';letter-spacing:.06em;text-transform:uppercase;">Rota ativa</span>' +
                  _snapshotPill(_scenarioLabel(scenarioKey), '#fff', scenario.tone, scenario.tone || '#EAE4DA') +
                '</div>' +
                '<div style="font-size:25px;font-weight:600;color:#1F1F1F;line-height:1.12;overflow-wrap:anywhere;">' + _esc(monthScenario.snapshotName || snap.name || _scenarioLabel(scenarioKey)) + '</div>' +
                '<div style="font-size:13px;color:#6F6860;line-height:1.5;margin-top:7px;max-width:760px;">Esta é a rota que guia o período. Acompanhe o ritmo e crie uma nova rota quando quiser mudar o caminho.</div>' +
                '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;">' +
                  _snapshotPill(snap.routePeriodLabel || _routePeriodLabel(), '#fff', '#6F6860', '#EAE4DA') +
                  _snapshotPill('Acompanhamento ' + (monthScenario.monthLabel || _currentMonthLabel()), '#fff', '#6F6860', '#EAE4DA') +
                '</div>' +
              '</div>' +
            '</div>' +
            (routeId ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">' +
              '<button type="button" onclick="Modules.PlanoDeVoo._openRouteSummaryModal(\'' + _esc(routeId) + '\')" style="height:36px;padding:0 12px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 6px 14px rgba(31,31,31,.04);">Ver resumo</button>' +
              '<button type="button" onclick="Modules.PlanoDeVoo._deleteRoute(\'' + _esc(routeId) + '\')" style="height:36px;padding:0 12px;border:1px solid #F3C7C1;background:#FFF7F6;color:#B42318;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Excluir rota</button>' +
            '</div>' : '') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;">' +
            _routeMiniMetric('Você precisa vender', _fmtMoney(revenue), 'meta do período', 'payments', '#8A6F5A') +
            _routeMiniMetric('Pedidos por dia', ordersDay, 'ritmo necessário', 'receipt_long', scenario.tone || '#B42318') +
            _routeMiniMetric('Pode sobrar', _fmtMoney(profit), profit >= 0 ? 'lucro esperado' : 'atenção ao resultado', 'trending_up', profit >= 0 ? '#1F6F43' : '#B42318') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:center;">' +
            _routeJourneyStep('Rota criada', true, scenario.tone || '#B42318') +
            _routeJourneyStep('Rota ativa', true, scenario.tone || '#B42318') +
            _routeJourneyStep('Acompanhamento', true, scenario.tone || '#B42318') +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function _routeScenarioCards() {
    var keys = ['survival', 'equilibrium', 'growth', 'expansion'];
    return '' +
      '<section style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div>' +
            '<div style="font-size:15px;font-weight:600;color:#1F1F1F;">Escolha a realidade que você quer viver</div>' +
            '<div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Compare caminhos possíveis para o negócio e escolha qual deles vai guiar o ano.</div>' +
          '</div>' +
          _chip(_routePeriodLabel()) +
        '</div>' +
        '<div id="pv-route-live-feedback" style="display:none;align-self:flex-start;font-size:12px;color:#1F6F43;background:#F0FAF4;border:1px solid #D9F2E3;border-radius:999px;padding:7px 10px;font-weight:600;">Cenários atualizados com esta base.</div>' +
        _routeCoverageWarningHtml() +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;padding-bottom:2px;">' +
          keys.map(function (key) { return _routeScenarioCard(key); }).join('') +
        '</div>' +
      '</section>';
  }

  function _routeCoverageWarningHtml() {
    var vm = _forecastForScenario(_state.scenario || 'equilibrium');
    var revenue = _num(vm.revenueTotal);
    var costs = _num(vm.variableTotal) + _num(vm.fixedTotal);
    if (!(costs > 0) || revenue >= costs) return '';
    var missing = costs - revenue;
    return '' +
      '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF7ED;border:1px solid #FED7AA;border-radius:15px;padding:12px 14px;color:#7C2D12;">' +
        '<span class="mi" style="font-size:21px;color:#D97706;flex:0 0 auto;">warning</span>' +
        '<div style="min-width:0;">' +
          '<div style="font-size:13px;font-weight:600;line-height:1.25;color:#7C2D12;">As vendas informadas ainda não cobrem o que precisa sair.</div>' +
          '<div style="font-size:12.5px;line-height:1.45;margin-top:4px;color:#7C2D12;">Faltam ' + _fmtMoney(missing) + ' para cobrir custos e despesas. Revise a venda média, os custos ou escolha uma rota mais forte antes de ativar.</div>' +
        '</div>' +
      '</div>';
  }

  function _routeScenarioCard(key) {
    var scenario = SCENARIOS[key] || SCENARIOS.equilibrium;
    var vm = _forecastForScenario(key);
    var effort = _effortInfo(vm);
    var active = _state.scenario === key;
    return '' +
      '<article onclick="Modules.PlanoDeVoo._setScenario(\'' + _esc(key) + '\')" style="min-width:220px;background:#fff;border:1px solid ' + (active ? _esc(scenario.tone) : '#EAE4DA') + ';border-radius:18px;padding:16px;box-shadow:' + (active ? '0 16px 34px rgba(180,35,24,.12)' : '0 12px 30px rgba(31,31,31,.06)') + ';display:flex;flex-direction:column;gap:13px;transition:transform .16s ease,box-shadow .16s ease;cursor:pointer;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 18px 38px rgba(31,31,31,.10)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'' + (active ? '0 16px 34px rgba(180,35,24,.12)' : '0 12px 30px rgba(31,31,31,.06)') + '\'">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:16px;font-weight:600;color:#1F1F1F;line-height:1.2;">' + _esc(_scenarioLabel(key)) + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:4px;">' + _esc(_scenarioDecisionText(key)) + '</div>' +
          '</div>' +
          '<span class="mi" style="font-size:23px;color:' + _esc(scenario.tone || '#B42318') + ';">' + _esc(_scenarioIcon(key)) + '</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:9px;">' +
          _routeLine('Faturamento necessário', _fmtMoney(vm.revenueTotal), null, _routePeriodLabel(), true) +
          _routeLine('Pedidos por dia', _ordersPerDay(vm)) +
          _routeLine('Lucro estimado', _fmtMoney(vm.profit), vm.profit >= 0 ? '#1F6F43' : '#B42318') +
        '</div>' +
        _scenarioCostSummary(vm) +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:' + _esc(effort.bg) + ';border-radius:13px;padding:10px 11px;">' +
          '<span style="font-size:12px;color:#6F6860;">Nível de esforço</span>' +
          '<strong style="font-size:13px;color:' + _esc(effort.color) + ';font-weight:600;">' + _esc(effort.label) + '</strong>' +
        '</div>' +
        '<button type="button" onclick="event.stopPropagation();Modules.PlanoDeVoo._selectRouteForSummary(\'' + _esc(key) + '\')" style="height:40px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">Escolher cenário</button>' +
      '</article>';
  }

  function _scenarioCostSummary(vm) {
    vm = vm || {};
    var revenue = _num(vm.revenueTotal);
    if (!(revenue > 0)) return '';
    function smallMoney(label, value) {
      return '<span style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:#6F6860;line-height:1.25;"><span>' + _esc(label) + '</span><span style="color:#1F1F1F;font-weight:600;">' + _fmtMoney(value) + '</span></span>';
    }
    var totalCosts = _num(vm.variableTotal) + _num(vm.fixedTotal);
    return '' +
      '<div style="border-radius:14px;background:#FFFCF8;border:1px solid #F0E7DE;padding:10px 11px;display:flex;flex-direction:column;gap:7px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<span style="font-size:11px;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;font-weight:600;">Custos e despesas</span>' +
          '<strong style="font-size:14px;color:#B45309;font-weight:600;">' + _fmtMoney(totalCosts) + '</strong>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:4px;">' +
          smallMoney('Custos das vendas', _num(vm.variableTotal)) +
          smallMoney('Despesas indiretas', _num(vm.fixedExpensesTotal)) +
          smallMoney('Custos indiretos', _num(vm.financialCostsTotal)) +
        '</div>' +
      '</div>';
  }

  function _forecastForScenario(key, snapshotBase) {
    if (snapshotBase) {
      return _forecastForScenarioFromSnapshot(key, snapshotBase);
    }
    var previous = _state.scenario;
    _state.scenario = SCENARIOS[key] ? key : 'equilibrium';
    var vm = _forecastModel();
    _state.scenario = previous;
    return vm;
  }

  function _forecastForScenarioFromSnapshot(key, snapshotBase) {
    var previous = _cloneState(_state);
    _applySnapshotBaseToState(snapshotBase, key);
    var vm = _forecastModel();
    _restoreState(previous);
    return vm;
  }

  function _cloneState(state) {
    return JSON.parse(JSON.stringify(state || {}));
  }

  function _restoreState(previous) {
    Object.keys(_state).forEach(function (key) { delete _state[key]; });
    Object.keys(previous || {}).forEach(function (key) { _state[key] = previous[key]; });
  }

  function _applySnapshotBaseToState(s, scenarioKey) {
    s = s || {};
    _state.periodType = s.periodType || 'annual';
    _state.routePeriod = s.routePeriod || _state.routePeriod || _defaultRoutePeriod();
    _state.mode = s.mode || 'automatico';
    _state.annualMode = s.annualMode || 'linear_growth';
    _state.scenario = SCENARIOS[scenarioKey] ? scenarioKey : (s.scenario || 'equilibrium');
    _state.growthSource = s.growthSource || 'historical';
    _state.declineSource = s.declineSource || 'historical';
    _state.historyMonths = _historyMonthsBack();
    _state.growthPct = _num(s.growthPct != null ? s.growthPct : 10);
    _state.declinePct = _num(s.declinePct != null ? s.declinePct : 5);
    _state.averageTicketOverride = _num((s.summary || {}).averageTicket || s.averageTicket || 0);
    _state.seasonality = (s.seasonality || _state.seasonality || _defaultState().seasonality).slice(0, 12);
    _state.monthWeights = (s.monthWeights || s.seasonality || _state.monthWeights || _defaultMonthWeights()).slice(0, 12);
    _state.workDays = Array.isArray(s.workDays) && s.workDays.length ? s.workDays.slice() : _state.workDays;
    _state.plannedClosedDays = s.plannedClosedDays || '';
    _state.channelValues = {};
    _state.channelMode = {};
    _state.channelInclude = {};
    _state.costMode = {};
    _state.costPct = {};
    _state.costInclude = {};
    _state.fixedInclude = {};
    (s.channels || []).forEach(function (ch) {
      _state.channelValues[ch.key] = _num(ch.baseMonthly != null ? ch.baseMonthly : ch.periodValue);
      _state.channelMode[ch.key] = ch.mode || (ch.historyAvg > 0 ? 'automatico' : 'manual');
      _state.channelInclude[ch.key] = ch.include !== false;
    });
    (s.variableCosts || []).forEach(function (r) {
      _state.costMode[r.key] = r.mode || 'automatico';
      _state.costPct[r.key] = _num(r.pct);
      _state.costInclude[r.key] = r.include !== false;
    });
    (s.fixedExpenses || []).forEach(function (r) {
      _state.fixedInclude[r.id] = r.include !== false;
    });
  }

  function _routeMiniMetric(label, value, sub, icon, color) {
    return '' +
      '<div style="background:rgba(255,255,255,.78);border:1px solid rgba(234,228,218,.9);border-radius:16px;padding:14px 15px;min-width:0;display:flex;gap:11px;align-items:flex-start;box-shadow:0 10px 22px rgba(31,31,31,.045);backdrop-filter:blur(8px);">' +
        '<span class="mi" style="font-size:21px;color:' + _esc(color || '#B42318') + ';flex:0 0 auto;margin-top:1px;">' + _esc(icon || 'insights') + '</span>' +
        '<span style="min-width:0;">' +
          '<span style="display:block;font-size:11px;font-weight:600;color:#6F6860;line-height:1.2;">' + _esc(label) + '</span>' +
          '<strong style="display:block;font-size:20px;font-weight:600;color:#1F1F1F;line-height:1.05;margin-top:5px;overflow-wrap:anywhere;">' + _esc(value) + '</strong>' +
          '<small style="display:block;font-size:12px;color:#6F6860;line-height:1.3;margin-top:4px;">' + _esc(sub || '') + '</small>' +
        '</span>' +
      '</div>';
  }

  function _routeHeroStyle(color, soft) {
    return 'position:relative;overflow:hidden;background:linear-gradient(135deg,#fff 0%,' + _esc(soft || '#FAF8F4') + ' 100%);border:1px solid ' + _esc(color || '#B42318') + '35;border-radius:22px;padding:22px 24px;box-shadow:0 22px 50px rgba(31,31,31,.08), inset 0 1px 0 rgba(255,255,255,.88);';
  }

  function _routeHeroGlow(color) {
    return 'position:absolute;inset:-90px auto auto -70px;width:260px;height:260px;border-radius:999px;background:' + _esc(color || '#B42318') + ';opacity:.09;filter:blur(2px);pointer-events:none;';
  }

  function _routeGraphic(key) {
    var scenario = SCENARIOS[key] || SCENARIOS.equilibrium;
    var color = scenario.tone || '#B42318';
    return '' +
      '<span style="width:78px;height:78px;border-radius:24px;background:linear-gradient(145deg,#fff,' + _esc(scenario.bg || '#FAF8F4') + ');border:1px solid ' + _esc(color) + '30;display:flex;align-items:center;justify-content:center;color:' + _esc(color) + ';box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 18px 36px rgba(31,31,31,.08);flex:0 0 auto;">' +
        '<span class="mi" style="font-size:36px;filter:drop-shadow(0 10px 14px ' + _esc(color) + '24);">near_me</span>' +
      '</span>';
  }

  function _routeJourneyStep(label, active, color) {
    return '' +
      '<div style="display:flex;align-items:center;gap:8px;min-width:0;color:#6F6860;font-size:12px;line-height:1.2;">' +
        '<span style="width:9px;height:9px;border-radius:999px;background:' + (active ? _esc(color || '#B42318') : '#D8CEC4') + ';box-shadow:' + (active ? '0 0 0 4px ' + _esc(color || '#B42318') + '14' : 'none') + ';flex:0 0 auto;"></span>' +
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(label) + '</span>' +
      '</div>';
  }

  function _routeLine(label, value, color, helper, compactValue) {
    return '' +
      '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;border-bottom:1px solid #F0EAE1;padding-bottom:8px;">' +
        '<span style="font-size:12px;color:#6F6860;line-height:1.25;">' + _esc(label) + (helper ? '<small style="display:block;font-size:11px;color:#8A7E7C;font-weight:400;margin-top:3px;">' + _esc(helper) + '</small>' : '') + '</span>' +
        '<strong style="font-size:' + (compactValue ? '13px' : '15px') + ';font-weight:600;color:' + _esc(color || '#1F1F1F') + ';line-height:1.1;text-align:right;overflow-wrap:anywhere;">' + _esc(value) + '</strong>' +
      '</div>';
  }

  function _scenarioDecisionText(key) {
    if (key === 'survival') return 'Para cobrir o básico e manter o negócio respirando.';
    if (key === 'equilibrium') return 'Para vender com mais tranquilidade e evitar aperto.';
    if (key === 'growth') return 'Para crescer sem perder o controle da operação.';
    return 'Para buscar uma sobra maior, com mais esforço.';
  }

  function _scenarioIcon(key) {
    if (key === 'survival') return 'shield';
    if (key === 'equilibrium') return 'verified';
    if (key === 'growth') return 'trending_up';
    return 'rocket_launch';
  }

  function _monthWeightsSummary() {
    var weights = (_state.monthWeights || []).map(function (v) { return v === '' || v == null ? 100 : _num(v); });
    var strong = weights.filter(function (v) { return v > 100; }).length;
    var weak = weights.filter(function (v) { return v > 0 && v < 100; }).length;
    if (!strong && !weak) return 'Meses equilibrados';
    var parts = [];
    if (strong) parts.push(strong + ' mais ' + (strong === 1 ? 'forte' : 'fortes'));
    if (weak) parts.push(weak + ' mais ' + (weak === 1 ? 'fraco' : 'fracos'));
    return parts.join(' · ');
  }

  function _averageTicket() {
    if (_num(_state.averageTicketOverride) > 0) return _num(_state.averageTicketOverride);
    return _historicalAverageTicket();
  }

  function _historicalAverageTicket() {
    var orders = _realOrders();
    var total = orders.reduce(function (sum, o) { return sum + _orderRevenue(o); }, 0);
    return orders.length && total > 0 ? total / orders.length : 0;
  }

  function _hasFullYearSalesHistory() {
    var dates = _realOrders().map(_orderDate).filter(Boolean).sort(function (a, b) { return a - b; });
    if (dates.length < 2) return false;
    return (dates[dates.length - 1].getTime() - dates[0].getTime()) >= 365 * 86400000;
  }

  function _routePeriodLabel() {
    var year = new Date().getFullYear();
    var months = _routeMonthIndexes();
    var start = months.length ? months[0] : 0;
    var end = months.length ? months[months.length - 1] : 11;
    return (MONTHS[start] || 'Jan') + ' a ' + (MONTHS[end] || 'Dez') + ' de ' + year;
  }

  function _routeMonthIndexes() {
    var startMonth = _state.routePeriod === 'full_year' ? 0 : new Date().getMonth();
    var arr = [];
    for (var i = startMonth; i < 12; i += 1) arr.push(i);
    return arr;
  }

  function _routeMonthCount() {
    return Math.max(1, _routeMonthIndexes().length);
  }

  function _normalizeRouteMonthWeights() {
    var currentMonth = new Date().getMonth();
    var weights = Array.isArray(_state.monthWeights) ? _state.monthWeights.slice(0, 12) : [];
    var seasonality = Array.isArray(_state.seasonality) ? _state.seasonality.slice(0, 12) : [];
    for (var i = 0; i < 12; i += 1) {
      var locked = _state.routePeriod === 'remaining_year' && i < currentMonth;
      var value = locked ? 0 : (weights[i] != null ? weights[i] : (seasonality[i] != null ? seasonality[i] : 100));
      weights[i] = value;
      seasonality[i] = value;
    }
    _state.monthWeights = weights;
    _state.seasonality = seasonality;
  }

  function _workingDaysInPeriod() {
    var range = _routeDateRange();
    var start = _dateFromAny(range.start);
    var end = _dateFromAny(range.end);
    if (!start || !end) return _state.periodType === 'annual' ? 365 : 30;
    var days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    var workDays = Array.isArray(_state.workDays) && _state.workDays.length ? _state.workDays : [1, 2, 3, 4, 5];
    var unavailable = _plannedUnavailableDateKeys();
    var count = 0;
    var d = new Date(start);
    while (d <= end) {
      if (workDays.indexOf(d.getDay()) >= 0 && !unavailable[_dateKey(d)]) count += 1;
      d.setDate(d.getDate() + 1);
    }
    return Math.max(1, count || days);
  }

  function _plannedUnavailableDateKeys() {
    var map = {};
    var year = new Date().getFullYear();
    var text = String(_state.plannedClosedDays || '');
    var re = /(\d{1,2})\/(\d{1,2})(?:\s*(?:a|até|ate|-)\s*(\d{1,2})\/(\d{1,2}))?/gi;
    var match;
    while ((match = re.exec(text))) {
      var start = new Date(year, parseInt(match[2], 10) - 1, parseInt(match[1], 10));
      var end = match[3] && match[4] ? new Date(year, parseInt(match[4], 10) - 1, parseInt(match[3], 10)) : start;
      if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) continue;
      if (end < start) end = start;
      var d = new Date(start);
      while (d <= end) {
        map[_dateKey(d)] = true;
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }

  function _dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _routeDateRange() {
    var now = new Date();
    var year = now.getFullYear();
    if (_state.routePeriod === 'full_year') {
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
    }
    return { start: new Date(year, now.getMonth(), now.getDate()), end: new Date(year, 11, 31, 23, 59, 59, 999) };
  }

  function _ordersPerDayFromRevenue(revenue) {
    var ticket = _averageTicket();
    if (!ticket) return '—';
    var orders = _num(revenue) / ticket;
    return String(Math.max(1, Math.ceil(orders / _workingDaysInPeriod())));
  }

  function _ordersPerDay(vm) {
    return _ordersPerDayFromRevenue(vm && vm.revenueTotal);
  }

  function _effortInfo(vm) {
    var raw = _ordersPerDay(vm);
    var n = _num(raw);
    if (!n) return { label: 'Sem base', color: '#6F6860', bg: '#FAF8F4' };
    if (n <= 3) return { label: 'Leve', color: '#1F6F43', bg: '#F0FAF4' };
    if (n <= 8) return { label: 'Possível', color: '#2563EB', bg: '#EEF4FF' };
    if (n <= 12) return { label: 'Puxado', color: '#B45309', bg: '#FFF7ED' };
    return { label: 'Muito puxado', color: '#B42318', bg: '#FFF0EE' };
  }

  function _chooseRoute(key) {
    _setScenario(key);
    _state.periodType = 'annual';
    _state.snapshotName = 'Rota ' + _scenarioLabel(_state.scenario) + ' ' + new Date().getFullYear();
    _openCreateRouteModal('summary');
  }

  function _selectRouteForSummary(key) {
    _chooseRoute(key);
  }

  function _openActiveRouteSummary() {
    var active = _data.monthScenario || {};
    if (active.snapshotId) return _openRouteSummaryModal(active.snapshotId);
    if ((_data.snapshots || []).length) return _openRouteSummaryModal((_data.snapshots || [])[0].id);
  }

  function _toggleWorkDay(day) {
    var d = _num(day);
    var list = Array.isArray(_state.workDays) ? _state.workDays.slice() : [];
    var idx = list.indexOf(d);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(d);
    _state.workDays = list.sort(function (a, b) { return a - b; });
    _afterCalculationChange();
  }

  function _setClosedDays(v) {
    _state.plannedClosedDays = String(v || '');
    _afterCalculationChange();
  }

  function _setMonthWeight(idx, v) {
    if (_state.routePeriod === 'remaining_year' && _num(idx) < new Date().getMonth()) return;
    _state.monthWeights[idx] = (v === '' || v == null) ? 100 : _num(v);
    _state.seasonality[idx] = _state.monthWeights[idx];
    _afterCalculationChange({ refreshAdvanced: true, keepAdvancedState: true, skipWork: true });
  }


  function _openCreateRouteModal(tab) {
    tab = tab === 'summary' ? 'summary' : 'create';
    _state.periodType = 'annual';
    if (!_state.snapshotName) _state.snapshotName = _defaultSnapshotName();
    _closePlanModals();
    var vm = _forecastModel();
    var body = '' +
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
        _routeModalTabs(tab) +
        (tab === 'summary' ? _routeModalSummary(vm) : _routeModalCreate(vm)) +
      '</div>';
    UI.modal({
      title: 'Criar nova rota',
      body: body,
      maxWidth: '1040px',
      footer: '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
        '<button type="button" onclick="Modules.PlanoDeVoo._closePlanModals()" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>' +
        (tab === 'summary'
          ? '<button type="button" onclick="Modules.PlanoDeVoo._activateRouteFromModal()" style="height:38px;padding:0 14px;border:none;background:#B42318;color:#fff;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);">Salvar e ativar rota</button>'
          : '') +
      '</div>'
    });
  }

  function _routeModalTabs(active) {
    return '<div style="display:inline-flex;align-self:flex-start;background:#FAF8F4;border:1px solid #EAE4DA;border-radius:999px;padding:4px;gap:4px;">' +
      _routeModalTabButton('create', 'Criar rota', active) +
      _routeModalTabButton('summary', 'Resumo da rota selecionada', active) +
    '</div>';
  }

  function _routeModalTabButton(key, label, active) {
    var selected = key === active;
    return '<button type="button" onclick="Modules.PlanoDeVoo._openCreateRouteModal(\'' + key + '\')" style="height:34px;padding:0 12px;border:none;border-radius:999px;background:' + (selected ? '#B42318' : '#fff') + ';color:' + (selected ? '#fff' : '#6F6860') + ';font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">' + _esc(label) + '</button>';
  }

  function _routeModalCreate(vm) {
    return '' +
      _routeHowToFillHelp() +
      '<div id="pv-create-base">' + _calculationBaseCard(vm) + '</div>' +
      '<div id="pv-create-work">' + _workRealityCard() + '</div>' +
      '<div id="pv-create-scenarios">' + _routeScenarioCards() + '</div>' +
      (_hasFullYearSalesHistory() ? '' : '<div id="pv-create-advanced">' + _advancedAdjustmentsCard(vm, true) + '</div>');
  }

  function _routeHowToFillHelp() {
    return '' +
      '<details style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:16px;box-shadow:0 10px 24px rgba(31,31,31,.04);overflow:hidden;">' +
        '<summary style="list-style:none;cursor:pointer;padding:13px 15px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#B42318;font-size:12px;font-weight:600;">' +
          '<span>Como preencher?</span>' +
          '<span class="mi" style="font-size:18px;color:#B42318;">expand_more</span>' +
        '</summary>' +
        '<div style="padding:0 15px 15px;font-size:13px;color:#3F3A34;line-height:1.55;">' +
          '<p style="margin:0 0 10px;">Use esta etapa para escolher a rota do ano, não uma meta solta de um mês.</p>' +
          '<p style="margin:0 0 10px;">Primeiro confira o ponto de partida: período da rota, ticket médio, custos e compromissos do negócio. A ideia é garantir que a rota comece perto da sua realidade.</p>' +
          '<p style="margin:0 0 10px;">Depois confirme sua rotina de trabalho: dias da semana em que costuma vender, dias fechados e meses que normalmente são mais fortes ou mais fracos. Se não for trabalhar em um mês inteiro, coloque 0 naquele mês.</p>' +
          '<div style="margin:0 0 10px;">' +
            '<strong style="font-weight:600;color:#1F1F1F;">Compare as quatro rotas:</strong><br>' +
            '• Sobrevivência: para cobrir o básico.<br>' +
            '• Segurança: para trabalhar com mais tranquilidade.<br>' +
            '• Crescimento: para vender mais sem perder o controle.<br>' +
            '• Lucro forte: para buscar uma sobra maior, sabendo que exige mais esforço.' +
          '</div>' +
          '<p style="margin:0 0 10px;">Escolha a rota que combina com o momento do negócio. Na aba <strong style="font-weight:600;color:#1F1F1F;">Resumo da rota selecionada</strong>, revise quanto precisa vender, quantos pedidos por dia precisa fazer, quanto pode sobrar e quantos dias de trabalho foram considerados.</p>' +
          '<p style="margin:0;">Ao clicar em <strong style="font-weight:600;color:#1F1F1F;">Salvar e ativar rota</strong>, ela vira a Rota ativa. Depois disso, a tela principal acompanha o andamento. Para mudar o caminho, crie uma nova rota e mantenha o histórico das anteriores.</p>' +
        '</div>' +
      '</details>';
  }

  function _routeModalSummary(vm) {
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
          '<div style="min-width:0;">' +
            '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 4px;">Resumo da rota selecionada</h3>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:760px;">Confira o caminho antes de salvar. Depois de ativada, a rota fica para acompanhamento; para mudar, crie outra rota.</p>' +
          '</div>' +
          _snapshotPill(_scenarioLabel(_state.scenario), (SCENARIOS[_state.scenario] || SCENARIOS.equilibrium).bg, (SCENARIOS[_state.scenario] || SCENARIOS.equilibrium).tone, '#EAE4DA') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">' +
          _routePeriodControl() +
          '<label style="display:block;background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:13px 14px;min-height:84px;box-sizing:border-box;">' +
            '<span style="' + _labelStyle() + 'display:block;margin-bottom:7px;">Nome da rota</span>' +
            '<input id="pv-route-name" type="text" value="' + _esc(_state.snapshotName || _defaultSnapshotName()) + '" onchange="Modules.PlanoDeVoo._setSnapshotName(this.value)" style="' + _inputStyle() + 'height:38px;padding:8px 10px;">' +
            '<span style="display:block;font-size:12px;color:#6F6860;line-height:1.35;margin-top:6px;">Nome que aparecerá no histórico.</span>' +
          '</label>' +
          _baseMini('Faturamento necessário', _fmtMoney(vm.revenueTotal), 'Meta principal da rota.') +
          _baseMini('Pode sobrar', _fmtMoney(vm.profit), 'Lucro estimado no período.') +
          _baseMini('Pedidos por dia', _ordersPerDay(vm), 'Ritmo médio nos dias trabalhados.') +
          _baseMini('Dias trabalhados considerados', String(_workingDaysInPeriod()), 'Calculado pelos dias marcados na realidade de trabalho.') +
        '</div>' +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Distribuição mensal', 'A rota continua anual; esta leitura mostra como a distribuição pode aparecer mês a mês.') +
        '<div style="overflow-x:auto;">' +
          '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:720px;">' +
            '<thead><tr>' + ['Mês', 'Venda estimada', 'Força do mês', 'Lucro estimado'].map(function (h) {
              return '<th style="padding:10px 12px;border-bottom:1px solid #EAE4DA;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;">' + h + '</th>';
            }).join('') + '</tr></thead>' +
            '<tbody>' + (vm.monthSeries || []).map(function (m) {
              var breakdown = _monthScenarioBreakdown(vm, m);
              var profit = m.revenue - breakdown.total;
              var strength = _monthStrengthInfo(m.factor);
              return '<tr><td style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(m.label) + '</td><td style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:13px;color:#1F1F1F;">' + _fmtMoney(m.revenue) + '</td><td style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:13px;color:#6F6860;min-width:150px;"><div style="display:flex;flex-direction:column;gap:5px;"><span style="font-size:12px;font-weight:600;color:' + _esc(strength.color) + ';">' + _esc(strength.label) + '</span>' + _monthStrengthBar(strength.score, strength.color) + '</div></td><td style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:13px;color:' + (profit >= 0 ? '#1F6F43' : '#B42318') + ';font-weight:700;">' + _fmtMoney(profit) + '</td></tr>';
            }).join('') + '</tbody>' +
          '</table>' +
        '</div>' +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Base usada na rota', 'Resumo do ponto de partida que será salvo junto com esta decisão.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
          _baseMini('Ticket médio', _averageTicket() ? _fmtMoney(_averageTicket()) : 'Sem base suficiente', 'Base atual dos pedidos.') +
          _baseMini('Custos que acompanham as vendas', _fmtMoney(vm.variableTotal), 'Custos previstos para vender neste caminho.') +
          _baseMini('Despesas fixas', _fmtMoney(vm.fixedTotal), 'Compromissos considerados.') +
          _baseMini('Histórico anual', _hasFullYearSalesHistory() ? 'Disponível' : 'Ainda não completo', 'Define o peso do histórico na leitura.') +
        '</div>' +
      '</section>';
  }

  function _openRouteSummaryModal(id) {
    var snap = (_data.snapshots || []).find(function (s) { return String(s.id || '') === String(id || ''); });
    if (!snap) return;
    var forecast = _snapshotToForecast(snap);
    var scenario = SCENARIOS[snap.scenario] || SCENARIOS.equilibrium;
    var summary = snap.summary || {};
    var body = '<style>.pv-route-details-modal{scrollbar-width:none;}.pv-route-details-modal::-webkit-scrollbar{display:none;width:0;height:0;}</style>' +
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<section style="' + _cardStyle() + '">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
            '<div style="min-width:0;">' +
              '<h3 style="font-size:16px;font-weight:700;color:#1F1F1F;margin:0 0 4px;">' + _esc(snap.name || 'Rota salva') + '</h3>' +
              '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Detalhes salvos quando esta rota foi criada. Esta tela é apenas para consulta.</p>' +
            '</div>' +
            _snapshotPill(_isMonthScenarioSnapshot(snap) ? 'Ativa' : 'Salva', _isMonthScenarioSnapshot(snap) ? '#F0FAF4' : '#FAF8F4', _isMonthScenarioSnapshot(snap) ? '#1F6F43' : '#6F6860', _isMonthScenarioSnapshot(snap) ? '#D9F2E3' : '#EAE4DA') +
          '</div>' +
          '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px;">' +
            _snapshotPill(_scenarioLabel(snap.scenario), scenario.bg, scenario.tone, '#EAE4DA') +
            _snapshotPill(_snapshotPeriodLabel(snap), '#FAF8F4', '#6F6860', '#EAE4DA') +
            _snapshotPill('Acompanha ' + (snap.targetMonthLabel || _monthLabelFromKey(snap.targetMonthKey || _currentMonthKey())), '#FAF8F4', '#6F6860', '#EAE4DA') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
            _baseMini('Faturamento necessário', _fmtMoney(forecast.revenueTotal), 'Meta da rota.') +
            _baseMini('Pode sobrar', _fmtMoney(forecast.profit), 'Lucro estimado.') +
            _baseMini('Pedidos por dia', summary.ordersPerDay != null ? _fmtNum(summary.ordersPerDay, 1) : _ordersPerDayFromRevenue(forecast.revenueTotal), 'Ritmo médio esperado.') +
            _baseMini('Caixa final', _fmtMoney(forecast.cashFinal), 'Estimativa ao fim do período.') +
          '</div>' +
        '</section>' +
        _routeSavedBaseDetails(snap, forecast) +
        _routeSavedChannelsDetails(snap) +
        _routeSavedCostsDetails(snap, forecast) +
        _routeSavedMonthlyDetails(forecast) +
      '</div>';
    var modal = UI.modal({
      title: 'Detalhes da rota',
      body: body,
      maxWidth: '1040px',
      footer: '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
        '<button type="button" onclick="Modules.PlanoDeVoo._closePlanModals()" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Fechar</button>' +
      '</div>'
    });
    var modalBox = modal && modal.el ? modal.el.querySelector('.bf-modal') : null;
    if (modalBox) modalBox.classList.add('pv-route-details-modal');
  }

  function _routeSavedBaseDetails(snap, forecast) {
    snap = snap || {};
    forecast = forecast || _snapshotToForecast(snap);
    var summary = snap.summary || {};
    var workDays = Array.isArray(snap.workDays) ? snap.workDays : [];
    var dayNames = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
    var workLabel = workDays.length ? workDays.map(function (d) { return dayNames[d] || d; }).join(', ') : 'Não informado';
    return '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Base cadastrada', 'Ponto de partida usado quando a rota foi criada.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
          _baseMini('Período da rota', _snapshotPeriodLabel(snap), 'Período anual ou restante do ano salvo na rota.') +
          _baseMini('Ticket médio usado', summary.averageTicket ? _fmtMoney(summary.averageTicket) : 'Sem base', 'Valor usado para estimar os pedidos necessários.') +
          _baseMini('Dias trabalhados', summary.workingDays ? String(summary.workingDays) : 'Sem base', workLabel) +
          _baseMini('Dias fechados', snap.plannedClosedDays || 'Nenhum informado', 'Feriados ou pausas considerados na rota.') +
          _baseMini('Histórico anual', _num(snap.historyMonths) >= 12 ? 'Disponível' : 'Ainda não completo', 'Define se a rota usou histórico anual completo ou base manual.') +
          _baseMini('Meses considerados', String(snap.routeMonthCount || (forecast.monthSeries || []).length || _routeMonthCount()), 'Quantidade de meses que entram nesta rota.') +
        '</div>' +
      '</section>';
  }

  function _routeSavedChannelsDetails(snap) {
    var channels = (snap && Array.isArray(snap.channels)) ? snap.channels.filter(function (ch) { return ch && ch.include !== false; }) : [];
    return '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Vendas por canal', 'Valores usados como base para distribuir a venda da rota.') +
        (channels.length ? '<div><table style="width:100%;border-collapse:separate;border-spacing:0;table-layout:auto;">' +
          '<thead><tr>' + ['Canal', 'Base mensal', 'Valor no período', 'Comissão efetiva'].map(_routeSavedTh).join('') + '</tr></thead>' +
          '<tbody>' + channels.map(function (ch) {
            var commission = _num(ch.commissionPct);
            var tax = _num(ch.taxPct);
            var effective = commission + (commission > 0 && tax > 0 ? commission * tax / 100 : 0);
            return '<tr>' +
              _routeSavedTd(ch.label || ch.name || ch.key || 'Canal', true) +
              _routeSavedTd(_fmtMoney(ch.baseMonthly || 0)) +
              _routeSavedTd(_fmtMoney(ch.periodValue || 0)) +
              _routeSavedTd(effective > 0 ? _fmtPct(effective) + (_num(ch.fixedFee) > 0 ? ' + ' + _fmtMoney(ch.fixedFee) + ' fixo' : '') : 'Sem comissão') +
            '</tr>';
          }).join('') + '</tbody></table></div>' : _routeSavedEmpty('Nenhum canal com valor salvo nesta rota.')) +
      '</section>';
  }

  function _routeSavedCostsDetails(snap, forecast) {
    var variableRows = (forecast && forecast.variableRows) || [];
    var fixedRows = (forecast && forecast.fixedRows) || [];
    return '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Custos e compromissos salvos', 'Custos que acompanham as vendas e saídas previstas consideradas na rota.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">' +
          '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:12px;">' +
            '<div style="font-size:13px;font-weight:700;color:#1F1F1F;margin-bottom:8px;">Custos que acompanham as vendas</div>' +
            (variableRows.length ? variableRows.map(function (row) {
              return _routeSavedLine(row.name || 'Custo', _fmtMoney(row.projected || 0), (row.pct != null ? _fmtPct(row.displayPct != null ? row.displayPct : row.pct) : '') + (row.sourceLabel ? ' · ' + row.sourceLabel : ''));
            }).join('') : _routeSavedEmpty('Nenhum custo variável salvo.')) +
          '</div>' +
          _routeSavedFixedByMonth(fixedRows, forecast) +
        '</div>' +
      '</section>';
  }

  function _routeSavedFixedByMonth(rows, forecast) {
    var grouped = _routeSavedFixedGroups(rows, forecast);
    return '' +
      '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:12px;">' +
        '<div style="font-size:13px;font-weight:700;color:#1F1F1F;margin-bottom:8px;">Saídas previstas</div>' +
        (grouped.length ? '<div style="display:flex;flex-direction:column;gap:10px;">' + grouped.map(function (month) {
          return '<div style="border:1px solid #EFE6DA;background:#fff;border-radius:13px;padding:10px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">' +
              '<strong style="font-size:13px;color:#1F1F1F;">' + _esc(month.label) + '</strong>' +
              '<span style="font-size:12px;font-weight:800;color:#1F1F1F;background:#FAF8F4;border:1px solid #EAE4DA;border-radius:999px;padding:4px 8px;">' + _esc(_fmtMoney(month.total)) + '</span>' +
            '</div>' +
            month.categories.map(function (cat) {
              return '<div style="padding:8px 0;border-top:1px solid #F2EDEA;">' +
                '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start;">' +
                  '<div style="min-width:0;"><strong style="display:block;font-size:12.5px;color:#2D2823;line-height:1.25;">' + _esc(cat.label) + '</strong>' +
                  '<small style="display:block;font-size:11.5px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(cat.items.map(function (item) { return item.name; }).join(' · ')) + '</small></div>' +
                  '<strong style="font-size:12.5px;color:#1F1F1F;white-space:nowrap;">' + _esc(_fmtMoney(cat.total)) + '</strong>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>';
        }).join('') + '</div>' : _routeSavedEmpty('Nenhuma saída prevista salva.')) +
      '</div>';
  }

  function _routeSavedFixedGroups(rows, forecast) {
    var months = (forecast && forecast.monthSeries) || [];
    var groups = [];
    if (!rows || !rows.length || !months.length) return groups;
    months.forEach(function (month) {
      var byCategory = {};
      rows.forEach(function (row) {
        if (!row || row.include === false) return;
        var value = _fixedRowValueForMonth(row, month);
        if (!(value > 0)) return;
        var label = _routeSavedCategoryLabel(row);
        var key = _normalizeCategoryKey(label);
        if (!byCategory[key]) byCategory[key] = { label: label, total: 0, items: [] };
        byCategory[key].total += value;
        byCategory[key].items.push({ name: row.name || 'Saída prevista', value: value });
      });
      var categories = Object.keys(byCategory).map(function (key) { return byCategory[key]; }).sort(function (a, b) {
        return b.total - a.total;
      });
      if (categories.length) {
        groups.push({
          label: month.label || MONTHS[month.monthIndex] || 'Mês',
          total: categories.reduce(function (sum, item) { return sum + _num(item.total); }, 0),
          categories: categories
        });
      }
    });
    return groups;
  }

  function _routeSavedCategoryLabel(row) {
    row = row || {};
    var raw = row.categoryId || row.categoriaFinanceiraId || row.categoriaId || row.categoryId ||
      (row.raw && (row.raw.categoriaFinanceiraNome || row.raw.categoria || row.raw.categoryName || row.raw.category)) || '';
    var meta = _categoryMeta(raw);
    if (meta && meta.name && meta.name !== 'Despesa') return meta.name;
    return row.financialNature === 'custo' ? 'Custos indiretos' : 'Despesas indiretas';
  }

  function _routeSavedMonthlyDetails(forecast) {
    var months = (forecast && forecast.monthSeries) || [];
    return '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Resumo mês a mês', 'Distribuição salva para acompanhar a rota ao longo do período.') +
        (months.length ? '<div><table style="width:100%;border-collapse:separate;border-spacing:0;table-layout:auto;">' +
          '<thead><tr>' + ['Mês', 'Receita', 'Custos e despesas', 'Lucro', 'Força do mês'].map(_routeSavedTh).join('') + '</tr></thead>' +
          '<tbody>' + months.map(function (m) {
            var breakdown = _monthScenarioBreakdown(forecast, m);
            var profit = _num(m.revenue) - _num(breakdown.total);
            var strength = _monthStrengthInfo(m.factor);
            return '<tr>' +
              _routeSavedTd(m.label || 'Mês', true) +
              _routeSavedTd(_fmtMoney(m.revenue || 0)) +
              _routeSavedTd(_fmtMoney(breakdown.total || 0)) +
              _routeSavedTd(_fmtMoney(profit), true, profit >= 0 ? '#1F6F43' : '#B42318') +
              _routeSavedTd(strength.label) +
            '</tr>';
          }).join('') + '</tbody></table></div>' : _routeSavedEmpty('Sem distribuição mensal salva.')) +
      '</section>';
  }

  function _routeSavedTh(label) {
    return '<th style="padding:10px 12px;border-bottom:1px solid #EAE4DA;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">' + _esc(label) + '</th>';
  }

  function _routeSavedTd(value, strong, color) {
    return '<td style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:13px;color:' + _esc(color || '#1F1F1F') + ';font-weight:' + (strong ? '700' : '500') + ';vertical-align:top;">' + _esc(value) + '</td>';
  }

  function _routeSavedLine(label, value, meta) {
    return '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start;padding:8px 0;border-bottom:1px solid #F2EDEA;">' +
      '<div style="min-width:0;"><div style="font-size:13px;font-weight:650;color:#1F1F1F;line-height:1.25;">' + _esc(label) + '</div>' +
      (meta ? '<div style="font-size:11.5px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(meta) + '</div>' : '') + '</div>' +
      '<div style="font-size:13px;font-weight:750;color:#1F1F1F;white-space:nowrap;">' + _esc(value) + '</div>' +
    '</div>';
  }

  function _routeSavedEmpty(text) {
    return '<div style="padding:18px;border:1px dashed #EADFD8;border-radius:12px;background:#fff;color:#8A7E7C;font-size:13px;line-height:1.45;text-align:center;">' + _esc(text) + '</div>';
  }

  function _activateRouteFromModal() {
    var nameEl = document.getElementById('pv-route-name');
    _state.snapshotName = String(nameEl && nameEl.value || _state.snapshotName || _defaultSnapshotName()).trim();
    _state.periodType = 'annual';
    _state.snapshotMonthKey = _currentMonthKey();
    _state.snapshotMonthLabel = _monthLabelFromKey(_state.snapshotMonthKey);
    _saveSnapshot(_state.snapshotMonthKey, _state.snapshotMonthLabel);
  }

  function _closePlanModals() {
    var buttons = document.querySelectorAll('.ui-modal-close');
    buttons.forEach(function (btn) {
      try { btn.click(); } catch (e) {}
    });
  }

  function _afterCalculationChange(options) {
    if (_refreshCreateRouteModal(options || {})) return;
    _paintActive();
  }

  function _refreshCreateRouteModal(options) {
    var scenarios = document.getElementById('pv-create-scenarios');
    if (!scenarios) return false;
    var vm = _forecastModel();
    var base = document.getElementById('pv-create-base');
    var work = document.getElementById('pv-create-work');
    var workDetails = work ? work.querySelector('details') : null;
    var workWasOpen = !!(workDetails && workDetails.open);
    var advanced = document.getElementById('pv-create-advanced');
    var advancedDetails = advanced ? advanced.querySelector('details') : null;
    var wasOpen = !!(advancedDetails && advancedDetails.open);
    if (base) base.innerHTML = _calculationBaseCard(vm);
    if (work && !(options && options.skipWork)) {
      work.innerHTML = _workRealityCard();
      workDetails = work.querySelector('details');
      if (workDetails) workDetails.open = workWasOpen;
    }
    scenarios.innerHTML = _routeScenarioCards();
    if (options && options.refreshAdvanced && advanced) {
      advanced.innerHTML = _advancedAdjustmentsCard(vm, true);
      advancedDetails = advanced.querySelector('details');
      if (advancedDetails) advancedDetails.open = options && options.keepAdvancedState ? wasOpen : true;
    } else if (advancedDetails) {
      advancedDetails.open = wasOpen;
    }
    _showRouteUpdatedFeedback();
    return true;
  }

  function _showRouteUpdatedFeedback() {
    ['pv-route-live-feedback', 'pv-advanced-feedback'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'inline-flex';
      el.textContent = 'Cenários atualizados com esta base.';
    });
  }

  function _advancedAdjustmentsCard(vm, annual) {
    return '' +
      '<details style="' + _cardStyle() + 'padding:0;overflow:hidden;">' +
        '<summary style="list-style:none;cursor:pointer;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
          '<span style="display:flex;gap:12px;align-items:flex-start;min-width:0;">' +
            '<span class="mi" style="font-size:22px;color:#B42318;">tune</span>' +
            '<span style="min-width:0;">' +
              '<strong style="display:block;font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.2;">Ajustes avançados</strong>' +
              '<small style="display:block;font-size:13px;color:#6F6860;line-height:1.4;margin-top:3px;">Abra apenas se quiser revisar canais, custos e despesas que influenciam a rota.</small>' +
            '</span>' +
          '</span>' +
          '<span class="mi" style="font-size:21px;color:#6F6860;">expand_more</span>' +
        '</summary>' +
        '<div id="pv-advanced-feedback" style="display:none;margin:0 20px 12px;font-size:12px;color:#1F6F43;background:#F0FAF4;border:1px solid #D9F2E3;border-radius:999px;padding:7px 10px;font-weight:600;width:max-content;max-width:calc(100% - 40px);">Cenários atualizados com esta base.</div>' +
        '<div style="display:flex;flex-direction:column;gap:16px;padding:0 20px 20px;">' +
          _controlsCard(vm) +
          _channelsCard(vm) +
          _variableCostsCard(vm) +
          (annual ? _annualBreakdownCard(vm) : '') +
        '</div>' +
      '</details>';
  }

  function _controlsCard(vm) {
    var historicalTicket = _historicalAverageTicket();
    return '' +
      '<section style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:16px;padding:12px 14px;">' +
        '<div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;">' +
          '<div style="min-width:180px;flex:1 1 220px;max-width:320px;">' +
            '<div style="font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.2;">Ajustes da rota</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">Ajuste apenas se o valor médio dos pedidos não representar bem o negócio hoje.</div>' +
          '</div>' +
          _moneyField('pl-ticket', 'Ticket médio usado', _averageTicket(), 'Modules.PlanoDeVoo._setAverageTicket(this.value)', 'max-width:170px;flex:0 0 170px;') +
        '</div>' +
        '<div style="margin-top:8px;font-size:11.5px;color:#6F6860;line-height:1.4;">' + (_hasFullYearSalesHistory() ? ('Já existe um ano de vendas para apoiar a rota. Ticket do histórico: ' + (historicalTicket ? _fmtMoney(historicalTicket) : 'sem base suficiente') + '.') : 'Ainda sem um ano completo de vendas. Preencha a venda média nos canais para montar uma rota mais próxima da realidade.') + ' Se ajustar o ticket, os pedidos por dia mudam nos cards.</div>' +
      '</section>';
  }



  function _channelsCard(vm) {
    var annual = _state.periodType === 'annual';
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
          '<div>' +
            '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">Vendas por canal</h3>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Quando o canal está automático, a base aparece calculada. Quando estiver manual, você pode editar o valor.</p>' +
          '</div>' +
          '<div style="font-size:12px;color:#6F6860;padding:8px 12px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;">' +
            (annual ? 'Base mensal anualizada no resultado final' : 'Valor mensal projetado para o período') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;overflow-x:auto;padding-bottom:2px;">' +
          vm.channels.map(function (ch) {
            return _channelRow(ch, annual);
          }).join('') +
        '</div>' +
      '</section>';
  }

  function _channelRow(ch, annual) {
    var included = _state.channelInclude[ch.key] !== false;
    var mode = ch.mode || (ch.historyHasData ? 'automatico' : 'manual');
    var base = _num(ch.baseMonthly != null ? ch.baseMonthly : (mode === 'manual' && _state.channelValues[ch.key] != null ? _state.channelValues[ch.key] : ch.historyAvg));
    var periodValue = annual ? _num(ch.basePeriodValue) : base;
    var helper = ch.historyHasData
      ? 'Histórico médio dos últimos ' + ch.lookbackMonths + ' meses: ' + _fmtMoney(ch.historyAvg) + ' por mês'
      : (_num(ch.currentMonthTotal) > 0 ? 'Este mês já vendeu ' + _fmtMoney(ch.currentMonthTotal) + ' neste canal. Ajuste se a previsão do mês for maior.' : 'Sem histórico suficiente. Use o valor manual.');
    var categoryHelp = ch.incomeCategoryName ? 'Entrada financeira: ' + ch.incomeCategoryName : '';
    return '' +
      '<div style="display:grid;grid-template-columns:28px minmax(240px,1.4fr) minmax(150px,.85fr) minmax(160px,.95fr) minmax(130px,150px);gap:10px;align-items:center;min-width:820px;padding:14px 14px;border:1px solid #EAE4DA;border-radius:14px;background:' + (included ? '#fff' : '#FAF8F4') + ';transition:background .15s ease,box-shadow .15s ease;" onmouseenter="this.style.background=\'#FCFBF8\';this.style.boxShadow=\'0 10px 24px rgba(31,31,31,.05)\'" onmouseleave="this.style.background=\'' + (included ? '#fff' : '#FAF8F4') + '\';this.style.boxShadow=\'none\'">' +
        '<label style="display:flex;align-items:center;justify-content:center;"><input type="checkbox" ' + (included ? 'checked' : '') + ' onchange="Modules.PlanoDeVoo._toggleChannelInclude(\'' + ch.key + '\', this.checked)" style="accent-color:#B42318;width:16px;height:16px;"></label>' +
        '<div style="min-width:0;">' +
          '<div style="font-size:14px;font-weight:600;color:#1F1F1F;">' + _esc(ch.label) + '</div>' +
          '<div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:3px;">' + _esc(helper) + '</div>' +
          (categoryHelp ? '<div style="font-size:11.5px;color:#8A7E7C;line-height:1.35;margin-top:3px;">' + _esc(categoryHelp) + '</div>' : '') +
        '</div>' +
        '<div>' +
          '<div style="' + _labelStyle() + 'margin-bottom:4px;">' + (mode === 'manual' ? 'Venda média mensal' : 'Venda média calculada') + '</div>' +
          (mode === 'manual'
            ? '<div style="display:grid;grid-template-columns:34px minmax(110px,1fr);align-items:center;border:1px solid #EAE4DA;border-radius:10px;background:#fff;overflow:hidden;height:40px;"><span style="height:40px;display:flex;align-items:center;justify-content:center;background:#FFFCF8;color:#6F6860;font-size:13px;font-weight:600;border-right:1px solid #EAE4DA;">€</span><input type="text" inputmode="decimal" value="' + _esc(_moneyInputValue(base)) + '" onchange="Modules.PlanoDeVoo._setChannelForecast(\'' + ch.key + '\', this.value)" onblur="this.value=Modules.PlanoDeVoo._moneyInputValue(this.value)" style="width:100%;height:40px;box-sizing:border-box;padding:9px 10px;border:0;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;text-align:right;"></div>'
            : '<div style="padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#FAF8F4;font-size:13px;font-weight:600;color:#1F1F1F;">' + _fmtMoney(base) + '</div>') +
        '</div>' +
        '<div>' +
          '<div style="' + _labelStyle() + 'margin-bottom:4px;">Projeção do período</div>' +
          '<div style="font-size:18px;font-weight:600;color:' + (included ? '#B42318' : '#6F6860') + ';">' + _fmtMoney(periodValue) + '</div>' +
        '</div>' +
        '<div style="font-size:12px;color:#6F6860;text-align:right;">' +
          '<div style="margin-bottom:4px;padding:5px 8px;border-radius:999px;background:' + (mode === 'manual' ? '#F2F7FF' : '#F0FAF4') + ';color:' + (mode === 'manual' ? '#2F5F93' : '#1F6F43') + ';font-size:11px;font-weight:600;">' + (mode === 'manual' ? 'Manual' : 'Automático') + '</div>' +
          (annual ? ('Período: ' + _routeMonthCount() + ' meses') : ('Ajuste do cenário: ' + _fmtNum(ch.periodFactor, 2) + 'x')) +
        '</div>' +
      '</div>';
  }

  function _variableCostsCard(vm) {
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
          '<div>' +
            '<h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">Custos que acompanham as vendas</h3>' +
            '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Aqui entram valores que tendem a aumentar quando você vende mais: custo dos produtos, taxas, comissões e a provisão para custos variáveis.</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;overflow-x:auto;padding-bottom:2px;">' +
          vm.variableRows.map(function (row) { return _variableRow(row, vm.revenueTotal); }).join('') +
        '</div>' +
      '</section>';
  }

  function _variableRow(row, revenueTotal) {
    var include = _state.costInclude[row.key] !== false;
    var locked = row.key === 'indirect';
    var mode = locked ? (row.mode || 'manual') : (_state.costMode[row.key] || row.mode || 'automatico');
    var pct = locked ? _num(row.pct) : (mode === 'manual' ? _num(_state.costPct[row.key] != null ? _state.costPct[row.key] : row.pct) : _num(row.pct));
    var displayPct = mode === 'manual' ? pct : _num(row.displayPct != null ? row.displayPct : pct);
    var projected = include ? (row.projected != null ? _num(row.projected) : revenueTotal * (pct / 100)) : 0;
    var note = row.note || (mode === 'manual' ? 'Manual' : 'Automático');
    var pctField = locked || mode !== 'manual'
      ? '<div style="padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#FAF8F4;font-size:13px;font-weight:600;color:#1F1F1F;">' + _fmtPct(displayPct) + '</div>'
      : '<input type="number" step="0.01" value="' + _esc(pct) + '" onchange="Modules.PlanoDeVoo._setCostPct(\'' + row.key + '\', this.value)" style="' + _inputStyle() + 'height:40px;">';
    return '' +
      '<div style="display:grid;grid-template-columns:28px minmax(230px,1.3fr) minmax(150px,1fr) minmax(150px,.9fr) minmax(120px,130px);gap:10px;align-items:center;min-width:800px;padding:14px 14px;border:1px solid #EAE4DA;border-radius:14px;background:' + (include ? '#fff' : '#FAF8F4') + ';transition:background .15s ease,box-shadow .15s ease;" onmouseenter="this.style.background=\'#FCFBF8\';this.style.boxShadow=\'0 10px 24px rgba(31,31,31,.05)\'" onmouseleave="this.style.background=\'' + (include ? '#fff' : '#FAF8F4') + '\';this.style.boxShadow=\'none\'">' +
        '<label style="display:flex;align-items:center;justify-content:center;"><input type="checkbox" ' + (include ? 'checked' : '') + ' onchange="Modules.PlanoDeVoo._toggleCostInclude(\'' + row.key + '\', this.checked)" style="accent-color:#B42318;width:16px;height:16px;"></label>' +
        '<div style="min-width:0;overflow-x:auto;padding-bottom:2px;">' +
          '<div style="font-size:14px;font-weight:600;color:#1F1F1F;">' + _esc(row.name) + '</div>' +
          '<div style="font-size:12px;color:#6F6860;margin-top:3px;">' + _esc(note) + '</div>' +
        '</div>' +
        '<div>' +
          '<div style="' + _labelStyle() + 'margin-bottom:4px;">' + (mode === 'manual' ? 'Percentual manual' : 'Percentual calculado') + '</div>' +
          pctField +
        '</div>' +
        '<div>' +
          '<div style="' + _labelStyle() + 'margin-bottom:4px;">Valor projetado</div>' +
          '<div style="font-size:18px;font-weight:600;color:' + (include ? '#1F6F43' : '#6F6860') + ';">' + _fmtMoney(projected) + '</div>' +
        '</div>' +
        '<div style="text-align:right;font-size:12px;color:#6F6860;">' +
          '<div style="margin-bottom:4px;padding:5px 8px;border-radius:999px;background:' + (mode === 'manual' ? '#F2F7FF' : '#F0FAF4') + ';color:' + (mode === 'manual' ? '#2F5F93' : '#1F6F43') + ';font-size:11px;font-weight:600;">' + (mode === 'manual' ? 'Manual' : 'Automático') + '</div>' +
          (row.sourceLabel || 'Base') + (locked ? '<div style="margin-top:4px;font-size:10.5px;color:#8A7E7C;">Editável em Financeiro &gt; Configurações</div>' : '') +
        '</div>' +
      '</div>';
  }




  function _annualBreakdownCard(vm) {
    return '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Resumo anual por mês', 'Receita, custos, despesas e lucro projetado mês a mês, conforme o cenário escolhido.') +
        '<div style="overflow-x:auto;">' +
          '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:860px;">' +
            '<thead><tr style="background:#fff;">' +
              ['Mês', 'Receita', 'Custos e despesas', 'Lucro', 'Detalhes'].map(function (h) {
                return '<th style="padding:12px 16px;border-bottom:1px solid #EAE4DA;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">' + h + '</th>';
              }).join('') +
            '</tr></thead>' +
            '<tbody>' +
              vm.monthSeries.map(function (m) {
                var breakdown = _monthScenarioBreakdown(vm, m);
                var profit = m.revenue - breakdown.total;
                return '<tr style="background:#fff;transition:background .15s ease;" onmouseenter="this.style.background=\'#FCFBF8\'" onmouseleave="this.style.background=\'#fff\'">' +
                  '<td style="padding:14px 16px;border-bottom:1px solid #EAE4DA;font-size:13px;font-weight:700;color:#1F1F1F;vertical-align:top;">' + _esc(m.label) + '</td>' +
                  '<td style="padding:14px 16px;border-bottom:1px solid #EAE4DA;font-size:13px;color:#1F1F1F;vertical-align:top;white-space:nowrap;">' + _fmtMoney(m.revenue) + '</td>' +
                  '<td style="padding:14px 16px;border-bottom:1px solid #EAE4DA;font-size:13px;color:#1F1F1F;vertical-align:top;white-space:nowrap;">' + _fmtMoney(breakdown.total) + '</td>' +
                  '<td style="padding:14px 16px;border-bottom:1px solid #EAE4DA;font-size:13px;font-weight:700;color:' + (profit >= 0 ? '#1F6F43' : '#B42318') + ';vertical-align:top;white-space:nowrap;">' + _fmtMoney(profit) + '</td>' +
                  '<td style="padding:10px 16px;border-bottom:1px solid #EAE4DA;vertical-align:top;">' + _monthDetailsHtml(vm, m, breakdown) + '</td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</section>';
  }

  function _monthScenarioBreakdown(vm, month) {
    vm = vm || {};
    month = month || {};
    var items = [];
    (vm.variableRows || []).forEach(function (row) {
      if (!row || row.include === false) return;
      var value = _num(month.revenue) * (_num(row.pct) / 100);
      if (value > 0) items.push({ name: row.name || 'Custo', group: 'Custos das vendas', value: value });
    });
    (vm.fixedRows || []).forEach(function (row) {
      if (!row || row.include === false) return;
      var value = _fixedRowValueForMonth(row, month);
      if (!(value > 0)) return;
      var isCost = row.financialNature === 'custo';
      items.push({
        name: row.name || (isCost ? 'Custo previsto' : 'Despesa prevista'),
        group: isCost ? 'Custos indiretos' : 'Despesas indiretas',
        value: value
      });
    });
    var total = items.reduce(function (sum, item) { return sum + _num(item.value); }, 0);
    return { items: items, total: total };
  }

  function _fixedRowValueForMonth(row, month) {
    row = row || {};
    month = month || {};
    var recurrence = _normalizeRecurrence(row.recurrence || '');
    var monthIndex = month.monthIndex != null ? _num(month.monthIndex) : -1;
    var due = _dateFromAny(row.dueDate || (row.raw && (row.raw.vencimento || row.raw.dueDate || row.raw.data || row.raw.date)));
    var currentYear = new Date().getFullYear();
    var monthEnd = monthIndex >= 0 ? new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999) : null;
    if (recurrence === 'única') {
      if (!due || due.getMonth() !== monthIndex || due.getFullYear() !== currentYear) return 0;
      return _num(row.value || row.projected);
    }
    if (recurrence === 'anual') {
      if (due && (due.getMonth() !== monthIndex || due.getFullYear() !== currentYear)) return 0;
      return _num(row.value || row.projected);
    }
    if (due && monthEnd && due > monthEnd) return 0;
    return _num(row.projectedMonthly);
  }

  function _monthRevenueBreakdown(vm, month) {
    vm = vm || {};
    month = month || {};
    return (vm.channels || []).filter(function (ch) { return ch && ch.include !== false; }).map(function (ch) {
      var value = _num(ch.baseMonthly) * _num(month.factor);
      return { name: ch.label || 'Canal', group: 'Receitas', value: value };
    }).filter(function (item) { return item.value > 0; });
  }

  function _monthDetailsHtml(vm, month, breakdown) {
    var revenues = _monthRevenueBreakdown(vm, month);
    var costs = (breakdown && breakdown.items) || [];
    return '' +
      '<details style="min-width:260px;">' +
        '<summary style="list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:0 10px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#1F1F1F;font-size:12px;font-weight:600;">' +
          '<span class="mi" style="font-size:16px;color:#6F6860;">expand_more</span> Ver detalhes' +
        '</summary>' +
        '<div style="margin-top:10px;display:grid;grid-template-columns:minmax(180px,1fr) minmax(210px,1.2fr);gap:12px;align-items:start;">' +
          _monthBreakdownHtml({ items: revenues, total: revenues.reduce(function (s, item) { return s + item.value; }, 0) }, 'Receitas do mês', ['Receitas'], 'Sem receitas previstas neste mês.') +
          _monthBreakdownHtml({ items: costs, total: breakdown.total }, 'Custos e despesas do mês', ['Custos das vendas', 'Despesas indiretas', 'Custos indiretos'], 'Sem custos previstos neste mês.') +
        '</div>' +
      '</details>';
  }

  function _monthBreakdownHtml(breakdown, title, order, emptyText) {
    breakdown = breakdown || { items: [], total: 0 };
    var groups = {};
    (breakdown.items || []).forEach(function (item) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    order = order || ['Custos das vendas', 'Despesas indiretas', 'Custos indiretos'];
    var detail = order.map(function (group) {
      var items = groups[group] || [];
      if (!items.length) return '';
      return '<div style="display:flex;flex-direction:column;gap:3px;">' +
        '<div style="font-size:11px;font-weight:600;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;margin-top:3px;">' + _esc(group) + '</div>' +
        items.map(function (item) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;color:#6F6860;line-height:1.3;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;">' + _esc(item.name) + '</span><span style="color:#1F1F1F;font-weight:600;white-space:nowrap;">' + _fmtMoney(item.value) + '</span></div>';
        }).join('') +
      '</div>';
    }).join('');
    return '<div style="max-width:430px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;">' +
        '<span style="font-size:12px;color:#6F6860;">' + _esc(title || 'Total do mês') + '</span>' +
        '<strong style="font-size:14px;color:#B45309;font-weight:700;white-space:nowrap;">' + _fmtMoney(breakdown.total) + '</strong>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' + (detail || '<div style="font-size:12px;color:#8A7E7C;">' + _esc(emptyText || 'Sem valores previstos neste mês.') + '</div>') + '</div>' +
    '</div>';
  }


















  function _snapshotPill(text, bg, color, border) {
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:' + _esc(bg || '#FAF8F4') + ';border:1px solid ' + _esc(border || '#EAE4DA') + ';color:' + _esc(color || '#6F6860') + ';font-size:11px;font-weight:600;white-space:nowrap;">' + _esc(text) + '</span>';
  }


  function _snapshotToForecast(snap) {
    var s = snap || {};
    return {
      fromSnapshot: true,
      periodLabel: _snapshotPeriodLabel(s),
      periodStart: _dateFromAny(s.periodStart),
      periodEnd: _dateFromAny(s.periodEnd),
      revenueTotal: _num((s.summary || {}).revenue),
      variableTotal: _num((s.summary || {}).variableTotal || (s.summary || {}).costs),
      fixedTotal: _num((s.summary || {}).fixedTotal || (s.summary || {}).despesas),
      fixedExpensesTotal: _num((s.summary || {}).fixedExpensesTotal),
      financialCostsTotal: _num((s.summary || {}).financialCostsTotal),
      profit: _num((s.summary || {}).profit),
      cashStart: _num((s.summary || {}).cashStart),
      cashFinal: _num((s.summary || {}).cashFinal),
      breakEvenRevenue: _num((s.summary || {}).breakEvenRevenue),
      targetProfit: _num((s.summary || {}).targetProfit || 500),
      needForProfit: _num((s.summary || {}).needForProfit),
      channels: s.channels || [],
      variableRows: s.variableCosts || [],
      fixedRows: s.fixedExpenses || [],
      monthSeries: s.monthSeries || [],
      forecast: {
        revenue: _num((s.summary || {}).revenue),
        costs: _num((s.summary || {}).variableTotal || (s.summary || {}).costs),
        fixed: _num((s.summary || {}).fixedTotal || 0),
        profit: _num((s.summary || {}).profit),
        cashFinal: _num((s.summary || {}).cashFinal)
      }
    };
  }


  function _forecastModel() {
    var channels = _channelRowsForBase();
    var baseMonthlyRevenue = channels.reduce(function (s, ch) {
      return s + (ch.include ? ch.baseMonthly : 0);
    }, 0);
    var period = _periodInfo();
    var monthlyFactor = _scenarioMultiplier();
    var revenueTotal = 0;
    var monthSeries = [];
    var annual = _state.periodType === 'annual';

    if (!annual) {
      revenueTotal = baseMonthlyRevenue * monthlyFactor;
      monthSeries.push({
        label: MONTHS[new Date().getMonth()],
        monthIndex: new Date().getMonth(),
        revenue: revenueTotal,
        factor: monthlyFactor
      });
    } else {
      var monthFactors = _annualMonthFactors();
      var monthIndexes = _routeMonthIndexes();
      for (var mi = 0; mi < monthIndexes.length; mi += 1) {
        var i = monthIndexes[mi];
        var factor = monthFactors[mi];
        var monthRevenue = baseMonthlyRevenue * factor;
        revenueTotal += monthRevenue;
        monthSeries.push({ label: MONTHS[i], monthIndex: i, revenue: monthRevenue, factor: factor });
      }
    }

    var variableRows = _variableRowsForRevenue(revenueTotal, channels);
    var fixedRows = _fixedRowsForForecast();
    var monthVariable = variableRows.reduce(function (s, row) {
      return s + row.projectedMonthly;
    }, 0);
    var variableTotal = variableRows.reduce(function (s, row) { return s + row.projected; }, 0);
    var indirectFixedRows = fixedRows.filter(function (row) { return row.costClass === 'indireto'; });
    var monthFixed = indirectFixedRows.reduce(function (s, row) {
      return s + row.projectedMonthly;
    }, 0);
    var fixedExpensesTotal = indirectFixedRows.reduce(function (s, row) { return s + (row.financialNature === 'custo' ? 0 : row.projected); }, 0);
    var financialCostsTotal = indirectFixedRows.reduce(function (s, row) { return s + (row.financialNature === 'custo' ? row.projected : 0); }, 0);
    var fixedTotal = fixedExpensesTotal + financialCostsTotal;
    var profit = revenueTotal - variableTotal - fixedTotal;
    var cashStart = _currentCash();
    var cashFinal = cashStart + profit;
    var variableRate = revenueTotal > 0 ? variableTotal / revenueTotal : 0;
    var breakEvenRevenue = variableRate < 1 ? fixedTotal / (1 - variableRate) : null;
    var targetProfit = _num(_state.currentTargetProfit || 500);
    var needForProfit = variableRate < 1 ? (fixedTotal + targetProfit) / (1 - variableRate) : null;

    return {
      periodLabel: period.label,
      periodStart: period.start,
      periodEnd: period.end,
      channels: channels,
      revenueBase: baseMonthlyRevenue,
      revenueTotal: revenueTotal,
      variableRows: variableRows,
      fixedRows: indirectFixedRows,
      payableRows: _openPayablesRows(),
      historyRows: _mergeHistoricalCategories(),
      monthSeries: monthSeries,
      monthVariable: monthVariable,
      monthFixed: monthFixed,
      variableTotal: variableTotal,
      fixedTotal: fixedTotal,
      fixedExpensesTotal: fixedExpensesTotal,
      financialCostsTotal: financialCostsTotal,
      profit: profit,
      cashStart: cashStart,
      cashFinal: cashFinal,
      variableRate: variableRate,
      breakEvenRevenue: breakEvenRevenue,
      targetProfit: targetProfit,
      needForProfit: needForProfit,
      forecast: {
        revenue: revenueTotal,
        costs: variableTotal,
        fixed: fixedTotal,
        profit: profit,
        cashFinal: cashFinal
      }
    };
  }

  function _channelRowsForBase() {
    var catalog = _channelCatalog();
    var annual = _state.periodType === 'annual';
    var factors = annual ? _annualMonthFactors() : [_scenarioMultiplier()];
    var baseFactors = annual ? _annualBaseMonthFactors() : [1];
    return catalog.map(function (ch) {
      var hist = _channelHistoryAverage(ch.key, _historyMonthsBack());
      var mode = _state.channelMode[ch.key] || (hist.hasData ? 'automatico' : 'manual');
      var baseMonthly = mode === 'manual'
        ? _num(_state.channelValues[ch.key] != null ? _state.channelValues[ch.key] : hist.avg)
        : _num(hist.avg);
      var periodFactor = annual ? factors.reduce(function (s, f) { return s + f; }, 0) : factors[0];
      var periodValue = baseMonthly * periodFactor;
      var basePeriodFactor = annual ? baseFactors.reduce(function (s, f) { return s + f; }, 0) : 1;
      var basePeriodValue = baseMonthly * basePeriodFactor;
      return {
        key: ch.key,
        label: ch.name || ch.label,
        commissionPct: ch.commissionPct || 0,
        fixedFee: ch.fixedFee || 0,
        taxPct: ch.taxPct || 0,
        incomeCategoryName: ch.entradaCategoriaNome || ch.incomeCategoryName || '',
        locked: !!ch.locked,
        historyAvg: hist.avg,
        historyHasData: hist.hasData,
        lookbackMonths: hist.lookbackMonths,
        currentMonthTotal: _channelCurrentMonthTotal(ch.key),
        baseMonthly: baseMonthly,
        mode: mode,
        periodValue: periodValue,
        periodFactor: periodFactor,
        basePeriodValue: basePeriodValue,
        basePeriodFactor: basePeriodFactor,
        include: _state.channelInclude[ch.key] !== false,
        sharePct: 0
      };
    }).map(function (ch, idx, arr) {
      var total = arr.reduce(function (s, x) { return s + (x.include ? x.periodValue : 0); }, 0);
      ch.sharePct = total > 0 ? (ch.periodValue / total) * 100 : 0;
      return ch;
    });
  }

  function _financeRecordDate(item) {
    return item ? (item.date || item.dueDate || item.paidAt || item.createdAt || '') : '';
  }

  function _financeCostClass(item) {
    if (item && item.costClass) return item.costClass;
    if (item && item.classeCusto) return item.classeCusto;
    if (item && item.classificacaoCusto) return item.classificacaoCusto;
    if (item && item.tipoSaida === 'Custo Produção') return 'direto';
    return 'indireto';
  }

  function _financeNature(item) {
    var v = String((item && (item.financialNature || item.naturezaFinanceira || item.nature || item.tipoFinanceiro)) || '').toLowerCase();
    if (v === 'custo' || v === 'cost') return 'custo';
    if (v === 'despesa' || v === 'expense') return 'despesa';
    if (item && item.tipoSaida === 'Custo Produção') return 'custo';
    return 'despesa';
  }

  function _financeHasRecurrence(item) {
    if (!item) return false;
    return item.recorrente === true || item.isRecurring === true || !!(item.recorrencia || item.recurrence || item.frequencia || item.frequency || item.recorrenciaId || item.contaOriginalId);
  }

  function _variableCostCandidate(item) {
    if (!item) return false;
    var cls = _financeCostClass(item);
    if (cls === 'direto') return true;
    if (_financeHasRecurrence(item)) return false;
    var text = String([
      item.name, item.title, item.descricao, item.description, item.categoria,
      item.category, item.categoriaFinanceiraNome, item.financialCategory
    ].filter(Boolean).join(' ')).toLowerCase();
    return /(marketing|campanha|trafego|tráfego|luz|energia|agua|água|g[aá]s|perda|taxa|comiss[aã]o|extra|refor[cç]o|vari[aá]vel)/.test(text);
  }

  function _categoryMeta(rawCat) {
    var rawKey = _normalizeCategoryKey(rawCat);
    var found = (_data.categorias || []).find(function (c) {
      var keys = [c.id, c.slug, c.name, c.nome, c.label].map(_normalizeCategoryKey);
      return keys.indexOf(rawKey) >= 0;
    }) || null;
    return {
      category: found,
      name: found ? (found.name || found.nome || found.label || _parseCategoryLabel(rawCat)) : _parseCategoryLabel(rawCat),
      nature: _financeNature(found || {}),
      costClass: _financeCostClass(found || {})
    };
  }

  function _indirectCostInfo() {
    var manualValue = _data.geral.variableCostPercent != null ? _data.geral.variableCostPercent : _data.geral.percentualCustosVariaveis != null ? _data.geral.percentualCustosVariaveis : _data.geral.indirectCostPercent != null ? _data.geral.indirectCostPercent : _data.custos.defaultIndirectCostPercent;
    var manual = _num(manualValue != null ? manualValue : 0);
    var mode = _data.geral.variableCostMode || _data.geral.custosVariaveisModo || _data.geral.indirectCostMode || _data.geral.custosIndiretosModo || 'manual';
    if (mode !== 'automatico') return { modeUsed: 'Manual', configuredMode: 'manual', percent: manual, fallback: false };

    var months = parseInt(_data.geral.variableCostMonths || _data.geral.custosVariaveisMeses || _data.geral.indirectCostMonths || _data.geral.custosIndiretosMeses, 10) || 6;
    if ([3, 6, 12].indexOf(months) < 0) months = 6;
    var start = new Date();
    start.setMonth(start.getMonth() - months);
    start.setHours(0, 0, 0, 0);

    var variableExtra = 0;
    (_data.saidas || []).concat(_data.apagar || []).forEach(function (item) {
      var rawDate = _financeRecordDate(item);
      if (!rawDate) return;
      var d = new Date(rawDate);
      if (isNaN(d.getTime()) || d < start) return;
      var value = _num(item.valor || item.amount || item.total);
      if (_variableCostCandidate(item)) variableExtra += value;
    });

    var revenue = _realOrders().reduce(function (sum, order) {
      var d = _orderDate(order);
      if (!d || d < start) return sum;
      return sum + _orderRevenue(order);
    }, 0);

    if (variableExtra <= 0 || revenue <= 0) {
      return { modeUsed: 'Manual', configuredMode: 'automatico', percent: manual, fallback: true, months: months };
    }
    return { modeUsed: 'Automático', configuredMode: 'automatico', percent: (variableExtra / revenue) * 100, fallback: false, months: months };
  }

  function _taxReserveInfo() {
    var fiscal = _data.fiscal || {};
    if (fiscal.usarCalculoFiscal !== true) {
      return {
        pct: 0,
        sourceLabel: 'Módulo fiscal',
        note: 'Controle fiscal desativado. O Plano de Voo não reserva valor fiscal nesta linha.'
      };
    }
    if (fiscal.usarCalculoFiscal === true) {
      var iva = _num(fiscal.defaultIvaRate != null ? fiscal.defaultIvaRate : fiscal.ivaPadrao);
      var irpf = _num(fiscal.irpfPadrao);
      if (iva > 0 || irpf > 0) {
        var ivaPct = iva > 0 ? (fiscal.pricesIncludeIva === false ? iva : (iva / (100 + iva)) * 100) : 0;
        var profitBase = _num(_data.dinheiro.desiredMarginPct || 0);
        var irpfPct = irpf > 0 && profitBase > 0 ? (profitBase * irpf / 100) : 0;
        return {
          pct: ivaPct + irpfPct,
          sourceLabel: 'Módulo fiscal',
          note: 'Usa IVA e IRPF configurados no Fiscal para reservar uma parte da venda antes de estimar a sobra.'
        };
      }
    }
    var legacy = _num(_data.dinheiro.estimatedTaxReservePct || 0);
    return {
      pct: legacy,
      sourceLabel: legacy > 0 ? 'Regra antiga de preço' : 'Módulo fiscal',
      note: legacy > 0
        ? 'Mantém a reserva fiscal antiga salva em Preço e Margem para não alterar rotas anteriores.'
        : 'Sem reserva fiscal configurada no Fiscal. O Plano de Voo considera 0% nesta linha.'
    };
  }

  function _variableRowsForRevenue(revenueTotal, channels) {
    var lookbackMonths = _historyMonthsBack();
    var productCostPct = _historicalProductCostPct(lookbackMonths);
    var paymentPct = _num(_data.dinheiro.cardFeePct || 0);
    var channelCommissionInfo = _channelCommissionInfo(channels);
    var indirectInfo = _indirectCostInfo();
    var indirectPct = indirectInfo.percent;
    var taxReserve = _taxReserveInfo();
    var rows = [
      { key: 'products', name: 'Custo do que foi vendido', pct: productCostPct, mode: 'automatico', sourceLabel: 'Produtos vendidos', note: productCostPct > 0 ? 'Usa o custo cadastrado nos produtos que já foram vendidos.' : 'Cadastre o custo dos produtos para o BocaFood estimar melhor esta parte.', warning: productCostPct <= 0 ? 'Custo não informado' : '' },
      { key: 'payment', name: 'Taxas de pagamento', pct: paymentPct, mode: 'automatico', sourceLabel: 'Formas de pagamento', note: 'Reserva para taxas cobradas pelas formas de pagamento usadas nas vendas.' },
      { key: 'channel', name: 'Comissões dos canais', pct: channelCommissionInfo.totalPct, displayPct: channelCommissionInfo.chargedPct || channelCommissionInfo.totalPct, projectedOverride: channelCommissionInfo.feeTotal, mode: 'automatico', sourceLabel: 'Canais de venda', note: channelCommissionInfo.chargedPct > channelCommissionInfo.totalPct ? 'Mostra a comissão efetiva dos canais que cobram taxa. O valor projetado considera só a parte das vendas que passa por esses canais.' : 'Considera comissão, imposto sobre a comissão e taxa fixa configurada nos canais.' },
      { key: 'indirect', name: 'Provisão para custos variáveis', pct: indirectPct, mode: indirectInfo.configuredMode === 'automatico' ? 'automatico' : 'manual', sourceLabel: indirectInfo.modeUsed === 'Automático' ? 'Histórico financeiro' : 'Configuração geral', note: indirectInfo.fallback ? 'Usa o percentual configurado para reservar custos que crescem quando as vendas aumentam.' : 'Usa o histórico financeiro para estimar custos variáveis que acompanharam as vendas.' },
      { key: 'tax', name: 'Reserva fiscal', pct: taxReserve.pct, mode: 'automatico', sourceLabel: taxReserve.sourceLabel, note: taxReserve.note }
    ];

    return rows.map(function (row) {
      var mode = row.key === 'indirect' ? (row.mode || 'manual') : (_state.costMode[row.key] || row.mode || 'automatico');
      var pct = row.key === 'indirect' ? _num(row.pct) : mode === 'manual'
        ? _num(_state.costPct[row.key] != null ? _state.costPct[row.key] : row.pct)
        : _num(row.pct);
      var projected = row.projectedOverride != null ? _num(row.projectedOverride) : revenueTotal * (pct / 100);
      var projectedMonthly = projected / _routeMonthCount();
      return {
        key: row.key,
        name: row.name,
        pct: pct,
        displayPct: row.displayPct != null ? _num(row.displayPct) : pct,
        mode: mode,
        include: _state.costInclude[row.key] !== false,
        projectedMonthly: _state.costInclude[row.key] === false ? 0 : projectedMonthly,
        projected: _state.costInclude[row.key] === false ? 0 : projected,
        sourceLabel: row.sourceLabel,
        note: row.note,
        warning: row.warning || ''
      };
    });
  }

  function _fixedRowsForForecast() {
    var rows = [];
    var payables = _openPayables();
    var historyRows = _historicalExpenseRows();
    payables.forEach(function (item) {
      rows.push({
        id: 'pay:' + item.id,
        source: 'payable',
        name: item.name,
        value: item.value,
        recurrence: item.recurrence,
        recurrenceLabel: item.recurrenceLabel,
        include: _state.fixedInclude['pay:' + item.id] !== false,
        projectedMonthly: _state.fixedInclude['pay:' + item.id] === false ? 0 : item.projectedMonthly,
        projected: _state.fixedInclude['pay:' + item.id] === false ? 0 : item.projected,
        sourceLabel: 'Conta a pagar',
        transformable: false,
        categoryId: item.categoryId || '',
        financialNature: item.financialNature || 'despesa',
        costClass: item.costClass || 'indireto',
        dueDate: item.dueDate || '',
        raw: item.raw || null
      });
    });
    historyRows.forEach(function (item) {
      rows.push({
        id: 'hist:' + item.key,
        source: 'historical',
        name: item.name,
        value: item.value,
        recurrence: item.recurrence,
        recurrenceLabel: item.recurrenceLabel,
        include: _state.fixedInclude['hist:' + item.key] !== false,
        projectedMonthly: _state.fixedInclude['hist:' + item.key] === false ? 0 : item.projectedMonthly,
        projected: _state.fixedInclude['hist:' + item.key] === false ? 0 : item.projected,
        sourceLabel: 'Categoria financeira',
        transformable: true,
        categoryId: item.categoryId || '',
        financialNature: item.financialNature || 'despesa',
        costClass: item.costClass || 'indireto'
      });
    });
    return rows;
  }

  function _openPayables() {
    var merged = [];
    var seen = {};
    var raw = [].concat(_data.apagar || []);
    raw.forEach(function (cp) {
      var id = String(cp.id || cp.name || cp.description || Math.random());
      if (seen[id]) return;
      seen[id] = true;
      var name = cp.name || cp.title || cp.descricao || cp.description || cp.nome || 'Conta a pagar';
      var isParcel = !!(cp.parcelada || cp.parcelaNumero || cp.numeroParcelas || cp.parcelamentoId);
      var isGeneratedRecurrence = !!(cp.recorrente && (cp.recorrenciaId || cp.contaOriginalId));
      var value = isParcel
        ? _num(cp.valorParcela || cp.valor_parcela || cp.valor || cp.amount || cp.total || cp.valorTotalOriginal || 0)
        : _num(cp.valor || cp.amount || cp.total || cp.valorParcela || cp.valor_parcela || cp.valorTotalOriginal || 0);
      var recurrence = _normalizeRecurrence(isGeneratedRecurrence ? 'única' : (cp.recorrente ? (cp.frequencia || cp.recorrencia || 'mensal') : (cp.frequencia || cp.recorrencia || 'única')));
      var recurrenceLabel = _recurrenceLabel(recurrence);
      var periodFactor = _periodRecurrenceFactor(recurrence);
      var projectedMonthly = value * periodFactor.monthly;
      var projected = value * periodFactor.period;
      var meta = _categoryMeta(cp.categoriaFinanceiraId || cp.categoria_id || cp.categoriaId || cp.categoryId || cp.categoriaFinanceiraNome || cp.categoria || cp.category || cp.financialCategory || '');
      var nature = meta.category ? meta.nature : _financeNature(cp);
      var costClass = meta.category ? meta.costClass : _financeCostClass(cp);
      merged.push({
        id: id,
        name: name,
        value: value,
        recurrence: recurrence,
        recurrenceLabel: recurrenceLabel,
        projectedMonthly: projectedMonthly,
        projected: projected,
        categoryId: cp.categoriaFinanceiraId || cp.categoria_id || cp.categoriaId || cp.categoryId || '',
        financialNature: nature || 'despesa',
        costClass: costClass || 'indireto',
        dueDate: cp.vencimento || cp.dueDate || '',
        raw: cp
      });
    });
    return merged;
  }

  function _historicalExpenseRows() {
    return _historicalFinanceRows('despesa');
  }

  function _historicalCostRows() {
    return _historicalFinanceRows('custo');
  }

  function _historicalFinanceRows(natureFilter) {
    var lookbackMonths = _historyMonthsBack();
    if (lookbackMonths <= 0) return [];
    var period = _completeMonthsRange(lookbackMonths);
    var categories = {};

    _financeOutflowHistoryRecords().forEach(function (s) {
      var d = _recordDate(s);
      if (!d || d < period.start || d > period.end) return;
      var rawCat = s.categoria_id || s.categoriaId || s.categoryId || s.categoria || s.category || s.financialCategory || 'despesas';
      var key = _normalizeCategoryKey(rawCat);
      var meta = _categoryMeta(rawCat);
      if (natureFilter && meta.nature !== natureFilter) return;
      var name = meta.name || s.categoria_nome || s.categoryName || s.categoria || s.category || (natureFilter === 'custo' ? 'Custo' : 'Despesa');
      if (!categories[key]) categories[key] = { key: key, name: name, total: 0, count: 0, categoryId: rawCat, financialNature: meta.nature, costClass: meta.costClass };
      categories[key].total += _outflowValue(s);
      categories[key].count += 1;
    });

    return Object.keys(categories).map(function (key) {
      var item = categories[key];
      var avgMonthly = item.total / lookbackMonths;
      var periodFactor = _state.periodType === 'annual' ? _routeMonthCount() : 1;
      var projectedMonthly = avgMonthly;
      var projected = avgMonthly * periodFactor;
      return {
        key: key,
        name: item.name,
        value: avgMonthly,
        recurrence: 'mensal',
        recurrenceLabel: 'Mensal',
        projectedMonthly: projectedMonthly,
        projected: projected,
        categoryId: item.categoryId,
        source: 'historical',
        financialNature: item.financialNature || natureFilter || 'despesa',
        costClass: item.costClass || 'indireto'
      };
    });
  }

  function _outflowValue(s) {
    var isParcel = !!(s.parcelada || s.parcelaNumero || s.numeroParcelas || s.parcelamentoId || (s.parcelamento && s.parcelamento.parcelas));
    var value = isParcel
      ? _num(s.valorParcela || s.valor_parcela || s.valor || s.amount || s.total || s.valorTotalOriginal || 0)
      : _num(s.valor || s.amount || s.total || s.valorParcela || s.valor_parcela || s.valorTotalOriginal || 0);
    var paid = _num(s.valorPago || s.valor_pago_total || 0);
    var status = String(s.status || '').toLowerCase();
    if (status === 'parcial') return paid || value;
    return value;
  }

  function _financeOutflowHistoryRecords() {
    var seen = {};
    var rows = [];
    function add(item, source) {
      if (!item) return;
      var type = _normalizeText(item.tipo || item.type || '');
      if (source === 'movimentacoes') {
        if (type !== 'saida' && type !== 'saída' && type !== 'expense') return;
        if (!_movementActive(item)) return;
      } else if (type && type !== 'saida' && type !== 'saída' && type !== 'expense') {
        return;
      }
      var id = String(item.id || item.sourceId || item.contaPagarId || item.descricao || item.description || '') || JSON.stringify(item).slice(0, 80);
      var key = source + ':' + id;
      if (seen[key]) return;
      seen[key] = true;
      rows.push(item);
    }
    (_data.saidas || []).forEach(function (item) { add(item, 'financeiro_saidas'); });
    (_data.movements || []).forEach(function (item) { add(item, 'movimentacoes'); });
    return rows;
  }





  function _saveSnapshot(monthKey, monthLabel) {
    var vm = _forecastModel();
    var name = String(_state.snapshotName || '').trim() || _defaultSnapshotName();
    if (!name || !String(_state.periodType || '').trim() || !_state.scenario || !vm || vm.revenueTotal == null) {
      UI.toast('Preencha nome, período, rota e resultado antes de salvar.', 'error');
      return;
    }
    monthKey = String(monthKey || _state.snapshotMonthKey || _currentMonthKey());
    monthLabel = String(monthLabel || _state.snapshotMonthLabel || _monthLabelFromKey(monthKey));
    var snapshot = {
      name: name,
      targetMonthKey: monthKey,
      targetMonthLabel: monthLabel,
      periodType: _state.periodType,
      routePeriod: _state.routePeriod,
      routePeriodLabel: _routePeriodLabel(),
      routeMonthCount: _routeMonthCount(),
      mode: _state.mode,
      annualMode: _state.annualMode,
      scenario: _state.scenario,
      growthSource: _state.growthSource,
      declineSource: _state.declineSource,
      historyMonths: _historyMonthsBack(),
      growthPct: _num(_state.growthPct),
      declinePct: _num(_state.declinePct),
      seasonality: (_state.seasonality || []).slice(),
      monthWeights: (_state.monthWeights || []).slice(),
      workDays: (_state.workDays || []).slice(),
      plannedClosedDays: _state.plannedClosedDays || '',
      channels: vm.channels.map(function (ch) {
        return {
          key: ch.key,
          label: ch.label,
          mode: ch.mode,
          baseMonthly: ch.baseMonthly,
          periodValue: ch.periodValue,
          include: ch.include,
          historyAvg: ch.historyAvg,
          commissionPct: ch.commissionPct,
          fixedFee: ch.fixedFee,
          taxPct: ch.taxPct,
          locked: ch.locked
        };
      }),
      variableCosts: vm.variableRows.map(function (r) {
        return {
          key: r.key,
          name: r.name,
          pct: r.pct,
          mode: r.mode,
          include: r.include,
          projectedMonthly: r.projectedMonthly,
          projected: r.projected,
          sourceLabel: r.sourceLabel
        };
      }),
      fixedExpenses: vm.fixedRows.map(function (r) {
        return {
          id: r.id,
          source: r.source,
          name: r.name,
          value: r.value,
          recurrence: r.recurrence,
          recurrenceLabel: r.recurrenceLabel,
          include: r.include,
          projectedMonthly: r.projectedMonthly,
          projected: r.projected,
          sourceLabel: r.sourceLabel,
          categoryId: r.categoryId || '',
          financialNature: r.financialNature || 'despesa',
          costClass: r.costClass || 'indireto',
          dueDate: r.dueDate || ''
        };
      }),
      summary: {
        revenue: vm.revenueTotal,
        variableTotal: vm.variableTotal,
        fixedTotal: vm.fixedTotal,
        fixedExpensesTotal: vm.fixedExpensesTotal,
        financialCostsTotal: vm.financialCostsTotal,
        costs: vm.variableTotal,
        profit: vm.profit,
        cashStart: vm.cashStart,
        cashFinal: vm.cashFinal,
        breakEvenRevenue: vm.breakEvenRevenue,
        targetProfit: vm.targetProfit,
        needForProfit: vm.needForProfit,
        averageTicket: _averageTicket(),
        workingDays: _workingDaysInPeriod(),
        ordersPerDay: _num(_ordersPerDay(vm))
      },
      periodStart: vm.periodStart,
      periodEnd: vm.periodEnd,
      monthSeries: vm.monthSeries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    snapshot = _cleanFirestoreData(snapshot);

    DB.add('flight_plans', snapshot).then(function (ref) {
      snapshot.id = ref.id;
      _data.snapshots.unshift(snapshot);
      _state.compareSnapshotId = snapshot.id;
      var monthScenarioPayload = _cleanFirestoreData({
        monthKey: monthKey,
        monthLabel: monthLabel,
        snapshotId: snapshot.id,
        snapshotName: snapshot.name || 'Rota salva',
        scenario: snapshot.scenario || 'equilibrium',
        summary: snapshot.summary || {},
        periodType: snapshot.periodType || 'monthly',
        updatedAt: new Date().toISOString(),
        selectedAt: new Date().toISOString()
      });
      DB.set('flight_plan_month_scenarios', monthKey, monthScenarioPayload).then(function () {
        _data.monthScenario = monthScenarioPayload;
        UI.toast('Rota escolhida para ' + monthLabel + '.', 'success');
        _closePlanModals();
        _paintActive();
      }).catch(function (err) {
        UI.toast('Rota salva, mas não foi possível definir o cenário do mês: ' + err.message, 'warning');
        _paintActive();
      });
    }).catch(function (err) {
      UI.toast('Erro ao salvar rota: ' + err.message, 'error');
    });
  }

  function _loadSnapshot(id) {
    var s = (_data.snapshots || []).find(function (x) { return String(x.id) === String(id); });
    if (!s) return;
    _state.periodType = s.periodType || 'monthly';
    _state.routePeriod = s.routePeriod || _state.routePeriod || _defaultRoutePeriod();
    _state.mode = s.mode || 'automatico';
    _state.annualMode = s.annualMode || 'linear_growth';
    _state.scenario = s.scenario || 'equilibrium';
    _state.growthSource = s.growthSource || 'historical';
    _state.declineSource = s.declineSource || 'historical';
    _state.historyMonths = _historyMonthsBack();
    _state.growthPct = _num(s.growthPct != null ? s.growthPct : 10);
    _state.declinePct = _num(s.declinePct != null ? s.declinePct : 5);
    _state.averageTicketOverride = _num((s.summary || {}).averageTicket || s.averageTicket || 0);
    _state.seasonality = (s.seasonality || _state.seasonality).slice(0, 12);
    _state.monthWeights = (s.monthWeights || s.seasonality || _state.monthWeights || []).slice(0, 12);
    _state.workDays = Array.isArray(s.workDays) && s.workDays.length ? s.workDays.slice() : _state.workDays;
    _state.plannedClosedDays = s.plannedClosedDays || '';
    _state.channelValues = {};
    _state.channelMode = {};
    _state.channelInclude = {};
    _state.costMode = {};
    _state.costPct = {};
    _state.costInclude = {};
    _state.fixedInclude = {};
    (s.channels || []).forEach(function (ch) {
      _state.channelValues[ch.key] = _num(ch.baseMonthly != null ? ch.baseMonthly : ch.periodValue);
      _state.channelMode[ch.key] = ch.mode || (ch.historyAvg > 0 ? 'automatico' : 'manual');
      _state.channelInclude[ch.key] = ch.include !== false;
    });
    (s.variableCosts || []).forEach(function (r) {
      _state.costMode[r.key] = r.mode || 'automatico';
      _state.costPct[r.key] = _num(r.pct);
      _state.costInclude[r.key] = r.include !== false;
    });
    (s.fixedExpenses || []).forEach(function (r) {
      _state.fixedInclude[r.id] = r.include !== false;
    });
    _state.snapshotName = s.name || _defaultSnapshotName();
    _state.snapshotMonthKey = s.targetMonthKey || _state.snapshotMonthKey || _currentMonthKey();
    _state.snapshotMonthLabel = s.targetMonthLabel || _monthLabelFromKey(_state.snapshotMonthKey);
    _state.compareSnapshotId = s.id || '';
    _activeSub = 'simulacao';
    _renderTabs();
      _paintActive();
    Router.navigate(_routeForSub('simulacao'));
    UI.toast('Rota carregada para revisão.', 'success');
  }


  function _setMonthScenario(id) {
    var s = (_data.snapshots || []).find(function (x) { return String(x.id) === String(id); });
    if (!s) return;
    var monthKey = String(s.targetMonthKey || _currentMonthKey());
    var monthLabel = String(s.targetMonthLabel || _monthLabelFromKey(monthKey));
    var payload = _cleanFirestoreData({
      monthKey: monthKey,
      monthLabel: monthLabel,
      snapshotId: s.id,
      snapshotName: s.name || 'Rota salva',
      scenario: s.scenario || 'equilibrium',
      summary: s.summary || {},
      periodType: s.periodType || 'monthly',
      updatedAt: new Date().toISOString(),
      selectedAt: new Date().toISOString()
    });
    DB.set('flight_plan_month_scenarios', monthKey, payload).then(function () {
      _data.monthScenario = payload;
      UI.toast('Cenário do mês definido.', 'success');
      _paintActive();
    }).catch(function (err) {
      UI.toast('Erro ao definir cenário do mês: ' + err.message, 'error');
    });
  }

  function _deleteRoute(id) {
    id = String(id || '').trim();
    if (!id) return;
    var snap = (_data.snapshots || []).find(function (x) { return String(x.id || '') === id; });
    if (!snap) return;
    var active = _isMonthScenarioSnapshot(snap);
    var message = active
      ? 'Excluir a rota ativa? Ela deixará de guiar o Plano de Voo.'
      : 'Excluir esta rota salva?';
    var ask = (window.UI && typeof UI.confirm === 'function')
      ? UI.confirm(message)
      : Promise.resolve(window.confirm(message));
    ask.then(function (yes) {
      if (!yes) return;
      var ops = [DB.remove('flight_plans', id)];
      var monthKey = String((snap && snap.targetMonthKey) || (_data.monthScenario && _data.monthScenario.monthKey) || _currentMonthKey());
      if (active && monthKey) {
        ops.push(DB.remove('flight_plan_month_scenarios', monthKey).catch(function () { return null; }));
      }
      return Promise.all(ops).then(function () {
        _data.snapshots = (_data.snapshots || []).filter(function (item) {
          return String(item.id || '') !== id;
        });
        if (active) _data.monthScenario = null;
        if (_state.compareSnapshotId === id) _state.compareSnapshotId = '';
        _closePlanModals();
        UI.toast(active ? 'Rota ativa excluída.' : 'Rota excluída.', 'success');
        _paintActive();
      });
    }).catch(function (err) {
      UI.toast('Erro ao excluir rota: ' + ((err && err.message) || err), 'error');
    });
  }

  function _currentMonthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function _currentMonthLabel() {
    var d = new Date();
    var label = MONTHS && MONTHS[d.getMonth()] ? MONTHS[d.getMonth()] : String(d.getMonth() + 1).padStart(2, '0');
    return label + '/' + d.getFullYear();
  }

  function _monthLabelFromKey(key) {
    var str = String(key || '');
    var parts = str.split('-');
    if (parts.length !== 2) return _currentMonthLabel();
    var year = parts[0];
    var monthIndex = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    var monthLabel = MONTHS && MONTHS[monthIndex] ? MONTHS[monthIndex] : String(monthIndex + 1).padStart(2, '0');
    return monthLabel + '/' + year;
  }


  function _isMonthScenarioSnapshot(s) {
    var m = _data.monthScenario || {};
    return !!m && String(m.snapshotId || '') === String(s && s.id || '');
  }


  function _setRoutePeriod(v) {
    _state.routePeriod = v === 'full_year' ? 'full_year' : 'remaining_year';
    _state.periodType = 'annual';
    _state.snapshotName = _defaultSnapshotName();
    _afterCalculationChange();
  }

  function _setMode(v) {
    _state.mode = v === 'manual' ? 'manual' : 'automatico';
    _afterCalculationChange();
  }

  function _setScenario(v) {
    _state.scenario = SCENARIOS[v] ? v : 'equilibrium';
    _afterCalculationChange({ refreshAdvanced: true, keepAdvancedState: true, skipWork: true });
  }

  function _setGrowthSource(v) {
    _state.growthSource = v === 'manual' ? 'manual' : 'historical';
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _setDeclineSource(v) {
    _state.declineSource = v === 'manual' ? 'manual' : 'historical';
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _setAnnualMode(v) {
    var allowed = ['linear_growth', 'linear_decline', 'seasonality_manual'];
    _state.annualMode = allowed.indexOf(v) >= 0 ? v : 'linear_growth';
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _setGrowthPct(v) {
    _state.growthPct = _num(v);
    _afterCalculationChange();
  }

  function _setDeclinePct(v) {
    _state.declinePct = _num(v);
    _afterCalculationChange();
  }

  function _setSnapshotName(v) {
    _state.snapshotName = String(v || '');
  }

  function _setTargetProfit(v) {
    _state.currentTargetProfit = _num(v);
    if (document.getElementById('pv-route-name')) {
      _openCreateRouteModal('summary');
      return;
    }
    _paintActive();
  }

  function _setAverageTicket(v) {
    _state.averageTicketOverride = _num(v);
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _setChannelForecast(key, v) {
    _state.channelValues[key] = _num(v);
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _moneyInputValue(v) {
    return _num(v).toFixed(2).replace('.', ',');
  }

  function _toggleChannelInclude(key, checked) {
    _state.channelInclude[key] = !!checked;
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _setCostMode(key, v) {
    _state.costMode[key] = v === 'manual' ? 'manual' : 'automatico';
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _setCostPct(key, v) {
    _state.costPct[key] = _num(v);
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _toggleCostInclude(key, checked) {
    _state.costInclude[key] = !!checked;
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _toggleFixedInclude(id, checked) {
    _state.fixedInclude[id] = !!checked;
    _afterCalculationChange({ refreshAdvanced: true });
  }

  function _transformFixedExpense(id) {
    var row = _fixedRowsForForecast().find(function (x) { return x.id === id; });
    if (!row) return;
    if (row.source !== 'historical') {
      UI.toast('Esta linha já existe como conta a pagar.', 'info');
      return;
    }
    var due = _addMonths(new Date(), 1);
    due.setDate(1);
    var payload = {
      nome: row.name,
      valor: row.value,
      valorTotalOriginal: row.value,
      valorParcela: row.value,
      status: 'pendente',
      vencimento: due.toISOString().slice(0, 10),
      recorrente: true,
      frequencia: 'mensal',
      categoriaId: row.categoryId || '',
      categoria_id: row.categoryId || '',
      source: 'plano_voo',
      note: 'Gerado a partir do Plano de Voo'
    };
    DB.add('contas_pagar', payload).then(function () {
      UI.toast('Conta a pagar criada a partir da rota.', 'success');
      _load().then(function () {
        _ensureStateDefaults();
        _paintActive();
      });
    }).catch(function (err) {
      UI.toast('Erro ao criar conta a pagar: ' + err.message, 'error');
    });
  }





















  function _inputField(id, label, value, type, onchange) {
    return '' +
      '<label style="display:block;margin-bottom:0;">' +
        '<span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">' + _esc(label) + '</span>' +
        '<input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value != null ? value : '') + '" onchange="' + onchange + '" style="' + _inputStyle() + 'height:40px;">' +
      '</label>';
  }

  function _moneyField(id, label, value, onchange, extraStyle) {
    return '' +
      '<label style="display:block;margin-bottom:0;' + (extraStyle || '') + '">' +
        '<span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">' + _esc(label) + '</span>' +
        '<div style="display:grid;grid-template-columns:34px minmax(110px,1fr);align-items:center;border:1px solid #EAE4DA;border-radius:10px;background:#fff;overflow:hidden;height:40px;">' +
          '<span style="height:40px;display:flex;align-items:center;justify-content:center;background:#FFFCF8;color:#6F6860;font-size:13px;font-weight:600;border-right:1px solid #EAE4DA;">€</span>' +
          '<input id="' + id + '" type="text" inputmode="decimal" value="' + _esc(_moneyInputValue(value)) + '" onchange="' + onchange + '" onblur="this.value=Modules.PlanoDeVoo._moneyInputValue(this.value)" style="width:100%;height:40px;box-sizing:border-box;padding:9px 10px;border:0;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;text-align:right;">' +
        '</div>' +
      '</label>';
  }

  function _cardStyle() {
    return 'background:rgba(255,255,255,.92);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 14px 34px rgba(31,31,31,.055),inset 0 1px 0 rgba(255,255,255,.88);';
  }

  function _inputStyle() {
    return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;';
  }

  function _labelStyle() {
    return 'font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;';
  }

  function _chip(text) {
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(text) + '</span>';
  }

  function _sectionTitle(title, desc) {
    return '<div style="margin-bottom:14px;"><h3 style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">' + _esc(title) + '</h3><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">' + _esc(desc || '') + '</p></div>';
  }



  function _snapshotPeriodLabel(s) {
    var start = _fmtDate(_dateFromAny(s.periodStart));
    var end = _fmtDate(_dateFromAny(s.periodEnd));
    var label = s.routePeriodLabel || (s.routePeriod === 'remaining_year' ? 'Restante do ano' : (s.periodType === 'annual' ? 'Ano da rota' : 'Mês da rota'));
    return label + ' · ' + start + ' → ' + end;
  }

  function _periodInfo() {
    var now = new Date();
    if (_state.periodType === 'annual') {
      var range = _routeDateRange();
      return {
        start: range.start,
        end: range.end,
        label: _routePeriodLabel()
      };
    }
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      label: 'Mês atual'
    };
  }

  function _completeMonthsRange(monthsBack) {
    var now = new Date();
    var end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    var start = new Date(end.getFullYear(), end.getMonth() - monthsBack + 1, 1);
    return { start: start, end: end };
  }

  function _annualMonthFactors() {
    var scenario = _scenarioMultiplier();
    return _annualBaseMonthFactors().map(function (f) { return f * scenario; });
  }

  function _annualBaseMonthFactors() {
    var arr = [];
    var indexes = _routeMonthIndexes();
    for (var p = 0; p < indexes.length; p += 1) {
      var i = indexes[p];
      var f = 1;
      if (_state.annualMode === 'linear_growth') {
        f = Math.pow(1 + (_growthAdjustmentPct() / 100), p);
      } else if (_state.annualMode === 'linear_decline') {
        f = Math.pow(Math.max(0, 1 - (_declineAdjustmentPct() / 100)), p);
      } else {
        f = _num(_state.monthWeights[i] != null ? _state.monthWeights[i] : (_state.seasonality[i] != null ? _state.seasonality[i] : 100)) / 100;
      }
      arr.push(f);
    }
    return arr;
  }

  function _growthAdjustmentPct() {
    if (_state.growthSource === 'historical') {
      var hist = _historicalGrowthAdjustmentPct();
      return hist == null ? 0 : hist;
    }
    return _num(_state.growthPct);
  }

  function _declineAdjustmentPct() {
    if (_state.declineSource === 'historical') {
      var hist = _historicalDeclineAdjustmentPct();
      return hist == null ? 0 : hist;
    }
    return _num(_state.declinePct);
  }

  function _historicalGrowthAdjustmentPct() {
    var trend = _historicalTrendPct(_historyMonthsBack());
    if (trend == null) return null;
    return Math.max(0, trend);
  }

  function _historicalDeclineAdjustmentPct() {
    var trend = _historicalTrendPct(_historyMonthsBack());
    if (trend == null) return null;
    return Math.max(0, -trend);
  }

  function _growthHistoricalNote() {
    var back = _historyMonthsBack();
    var trend = _historicalTrendPct(back);
    if (trend == null) return 'Sem base histórica suficiente. Use Manual para definir o ajuste.';
    return 'Base histórica dos últimos ' + back + ' meses completos vs. os ' + back + ' meses anteriores: ' + _fmtPct(Math.max(0, trend));
  }

  function _declineHistoricalNote() {
    var back = _historyMonthsBack();
    var trend = _historicalTrendPct(back);
    if (trend == null) return 'Sem base histórica suficiente. Use Manual para definir o ajuste.';
    return 'Base histórica dos últimos ' + back + ' meses completos vs. os ' + back + ' meses anteriores: ' + _fmtPct(Math.max(0, -trend));
  }

  function _scenarioHelpText() {
    var scenario = _state.scenario || 'equilibrium';
    if (scenario === 'equilibrium') {
      return 'Rota de segurança: mantém a base sem ajuste percentual extra.';
    }
    if (scenario === 'survival') {
      return 'Rota de sobrevivência: considera uma venda mais baixa para proteger o básico do negócio.';
    }
    var label = scenario === 'growth' ? 'crescimento' : 'lucro forte';
    return 'Rota de ' + label + ': considera uma venda maior para mostrar o esforço necessário e o resultado esperado.';
  }

  function _historicalTrendPct(monthsBack) {
    var back = _num(monthsBack);
    if (back <= 0) return null;
    var current = _compareRevenueBlock(back, 0);
    var previous = _compareRevenueBlock(back, back);
    if (!previous.hasData || previous.total <= 0) return null;
    return ((current.total - previous.total) / previous.total) * 100;
  }

  function _compareRevenueBlock(monthsBack, offsetMonths) {
    var now = new Date();
    var endRef = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    var end = new Date(endRef.getFullYear(), endRef.getMonth() - (offsetMonths || 0), 0, 23, 59, 59, 999);
    if ((offsetMonths || 0) === 0) end = endRef;
    var start = new Date(end.getFullYear(), end.getMonth() - (monthsBack - 1), 1);
    var total = 0;
    var hasData = false;
    _realOrders().forEach(function (o) {
      var d = _orderDate(o);
      if (!d || d < start || d > end) return;
      total += _orderRevenue(o);
      hasData = true;
    });
    return { total: total, hasData: hasData, start: start, end: end };
  }

  function _scenarioMultiplier() {
    var s = SCENARIOS[_state.scenario] || SCENARIOS.equilibrium;
    var adjust = 1;
    if (_state.scenario === 'survival') adjust = Math.max(0, 1 - (_declineAdjustmentPct() / 100));
    else if (_state.scenario === 'growth' || _state.scenario === 'expansion') adjust = 1 + (_growthAdjustmentPct() / 100);
    return s.factor * adjust;
  }

  function _realOrders() {
    var finals = {
      confirmado: true,
      'em preparacao': true,
      'em camino': true,
      'em caminho': true,
      'listo para recoger': true,
      entregado: true,
      finalizado: true,
      pago: true
    };
    return (_data.orders || []).filter(function (o) {
      var status = _normalizeText(o.status || '');
      var payment = _normalizeText(o.paymentStatus || '');
      if (status === 'cancelado') return false;
      return payment === 'pago' || payment === 'parcial' || finals[status];
    });
  }

  function _planningOrders() {
    return (_data.orders || []).filter(function (o) {
      var status = _normalizeText(o.status || '');
      return status !== 'cancelado' && status !== 'cancelada' && status !== 'canceled' && status !== 'cancelled';
    });
  }

  function _orderDate(o) {
    return _dateFromAny(o.createdAt || o.date || o.created_at || o.orderDate || o.updatedAt);
  }

  function _orderRevenue(o) {
    return _orderMoneyTotal(o);
  }

  function _orderMoneyItemTotal(item) {
    item = item || {};
    var qty = _num(item.qty != null ? item.qty : item.quantity != null ? item.quantity : 1) || 1;
    var total = _num(item.total != null ? item.total : item.subtotal != null ? item.subtotal : item.lineTotal != null ? item.lineTotal : 0);
    if (total > 0) return total;
    var unit = _num(item.finalPrice != null ? item.finalPrice : item.price != null ? item.price : item.unitPrice != null ? item.unitPrice : 0);
    return unit * qty;
  }

  function _normalizeMoneyWithExpected(rawValue, expected) {
    var raw = _num(rawValue);
    expected = _num(expected);
    if (!(raw > 0) || !(expected > 0)) return raw;
    var divided = raw / 100;
    if (raw > expected * 50 && Math.abs(divided - expected) <= Math.max(0.05, expected * 0.03)) return +divided.toFixed(2);
    return raw;
  }

  function _orderMoneyTotal(o) {
    o = o || {};
    var items = Array.isArray(o.items) ? o.items : [];
    var itemSubtotal = items.reduce(function (sum, item) { return sum + _orderMoneyItemTotal(item); }, 0);
    var raw = o.finalSubtotal != null ? o.finalSubtotal : (o.total != null ? o.total : (o.subtotal != null ? o.subtotal : 0));
    return _normalizeMoneyWithExpected(raw, itemSubtotal);
  }

  function _orderChannelLabel(o) {
    return String(o.channel || o.source || o.salesChannel || 'Cardápio');
  }

  function _channelKey(v) {
    var key = _normalizeText(v || '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cardapio';
    if (['template', 'store', 'storefront', 'public', 'publico', 'loja', 'loja-online', 'loja-publica', 'cardapio-online'].indexOf(key) >= 0) return 'cardapio';
    if (key === 'tpv' || key === 'venda-presencial' || key === 'balcao') return 'venda-presencial';
    return key;
  }

  function _isCardapioChannel(channel) {
    var key = _channelKey((channel && (channel.name || channel.key || channel.label)) || channel || '');
    return key === 'cardapio' || key === 'loja-online' || key === 'loja-publica';
  }

  function _isTpvChannel(channel) {
    var key = _channelKey((channel && (channel.name || channel.key || channel.label)) || channel || '');
    return key === 'tpv' || key === 'venda-presencial';
  }

  function _channelCatalog() {
    var map = {};
    var list = [];
    (_data.canais || []).forEach(function (ch) {
      var key = _channelKey(ch.name || ch.key || '');
      if (!key || map[key]) return;
      map[key] = true;
      list.push({
        key: key,
        name: ch.name || ch.key || 'Canal',
        commissionPct: _num(ch.commissionPct),
        fixedFee: _num(ch.fixedFee),
        taxPct: _num(ch.taxPct),
        entradaCategoriaId: String(ch.entradaCategoriaId || ch.incomeCategoryId || ch.categoriaEntradaId || ch.financialCategoryId || ch.categoriaFinanceiraId || ''),
        entradaCategoriaNome: String(ch.entradaCategoriaNome || ch.incomeCategoryName || ch.categoriaEntradaNome || ch.financialCategoryName || ch.categoriaFinanceiraNome || ''),
        incomeCategoryId: String(ch.incomeCategoryId || ch.entradaCategoriaId || ch.categoriaEntradaId || ch.financialCategoryId || ch.categoriaFinanceiraId || ''),
        incomeCategoryName: String(ch.incomeCategoryName || ch.entradaCategoriaNome || ch.categoriaEntradaNome || ch.financialCategoryName || ch.categoriaFinanceiraNome || ''),
        locked: !!ch.locked
      });
    });
    if (!list.length) {
      list = [{ key: 'cardapio', name: 'Cardápio', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true }];
      if (_isTpvEnabledConfig(_data.tpv || {})) {
        list.push({ key: 'venda-presencial', name: 'Venda presencial', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true });
      }
    }
    return list;
  }

  function _channelHistoryAverage(key, monthsBack) {
    key = _channelKey(key);
    var back = monthsBack == null ? _historyMonthsBack() : _num(monthsBack);
    if (back <= 0) {
      return { sum: 0, avg: 0, hasData: false, lookbackMonths: 0 };
    }
    var range = _completeMonthsRange(back);
    var sum = 0;
    var monthTotals = {};
    _realOrders().forEach(function (o) {
      var d = _orderDate(o);
      if (!d || d < range.start || d > range.end) return;
      if (_channelKey(_orderChannelLabel(o)) !== key) return;
      var mk = _monthKey(d);
      monthTotals[mk] = (monthTotals[mk] || 0) + _orderRevenue(o);
    });
    Object.keys(monthTotals).forEach(function (k) { sum += monthTotals[k]; });
    return {
      sum: sum,
      avg: sum / back,
      hasData: sum > 0,
      lookbackMonths: back
    };
  }

  function _channelCurrentMonthTotal(key) {
    key = _channelKey(key);
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), 1);
    var end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return _planningOrders().reduce(function (sum, o) {
      var d = _orderDate(o);
      if (!d || d < start || d > end) return sum;
      if (_channelKey(_orderChannelLabel(o)) !== key) return sum;
      return sum + _orderRevenue(o);
    }, 0);
  }

  function _monthKey(d) {
    if (!d) return '';
    var dt = _dateFromAny(d);
    if (!dt) return '';
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  function _historicalProductCostPct(monthsBack) {
    var back = monthsBack == null ? _historyMonthsBack() : _num(monthsBack);
    if (back <= 0) return _currentProductCostPct() || _catalogProductCostPct();
    var range = _completeMonthsRange(back);
    var revenue = 0;
    var cost = 0;
    _realOrders().forEach(function (o) {
      var d = _orderDate(o);
      if (!d || d < range.start || d > range.end) return;
      revenue += _orderRevenue(o);
      (o.items || []).forEach(function (item) {
        cost += _orderItemCost(item);
      });
    });
    return revenue > 0 ? (cost / revenue) * 100 : 0;
  }

  function _currentProductCostPct() {
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), 1);
    var end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    var revenue = 0;
    var cost = 0;
    _planningOrders().forEach(function (o) {
      var d = _orderDate(o);
      if (!d || d < start || d > end) return;
      revenue += _orderRevenue(o);
      (o.items || []).forEach(function (item) {
        cost += _orderItemCost(item);
      });
    });
    return revenue > 0 && cost > 0 ? (cost / revenue) * 100 : 0;
  }

  function _catalogProductCostPct() {
    var revenue = 0;
    var cost = 0;
    (_data.products || []).forEach(function (p) {
      var price = _num(p.price != null ? p.price : (p.preco != null ? p.preco : (p.preco_venda != null ? p.preco_venda : p.salePrice)));
      var unitCost = _productUnitCost(p);
      if (!(price > 0) || !(unitCost > 0)) return;
      revenue += price;
      cost += unitCost;
    });
    return revenue > 0 && cost > 0 ? (cost / revenue) * 100 : 0;
  }

  function _channelCommissionInfo(channels) {
    var total = 0;
    var weighted = 0;
    var fixedFeeTotal = 0;
    var chargedRevenue = 0;
    var ticket = _averageTicket();
    (channels || []).forEach(function (ch) {
      if (!ch.include) return;
      var periodValue = _num(ch.periodValue);
      if (!(periodValue > 0)) return;
      var commissionPct = _num(ch.commissionPct);
      var commissionTaxPct = commissionPct > 0 ? (commissionPct * _num(ch.taxPct) / 100) : 0;
      var fixedFee = _num(ch.fixedFee);
      var hasChannelCost = commissionPct > 0 || commissionTaxPct > 0 || fixedFee > 0;
      total += periodValue;
      weighted += periodValue * (commissionPct + commissionTaxPct);
      if (hasChannelCost) chargedRevenue += periodValue;
      if (ticket > 0 && fixedFee > 0) {
        fixedFeeTotal += (periodValue / ticket) * fixedFee;
      }
    });
    if (!(total > 0)) {
      var legacy = _num(_data.dinheiro.marketplaceCommissionPct || 0);
      return { totalPct: legacy, chargedPct: legacy, feeTotal: 0, chargedRevenue: 0, totalRevenue: 0 };
    }
    var feeTotal = (weighted / 100) + fixedFeeTotal;
    return {
      totalPct: feeTotal > 0 ? (feeTotal / total) * 100 : 0,
      chargedPct: chargedRevenue > 0 ? (feeTotal / chargedRevenue) * 100 : 0,
      feeTotal: feeTotal,
      chargedRevenue: chargedRevenue,
      totalRevenue: total
    };
  }

  function _productById(id) {
    return (_data.products || []).find(function (p) {
      var wanted = String(id || '');
      return String(p.id || '') === wanted ||
        String(p.productId || '') === wanted ||
        String(p.sourceItemId || '') === wanted ||
        String(p.produtoProntoId || '') === wanted ||
        String(p.readyProductId || '') === wanted ||
        String(p.fichaId || p.fichaTecnicaId || p.recipeId || '') === wanted;
    }) || null;
  }

  function _costItemById(id) {
    var wanted = String(id || '');
    if (!wanted) return null;
    return (_data.costItems || []).find(function (p) {
      return String(p.id || '') === wanted ||
        String(p.itemId || '') === wanted ||
        String(p.productId || '') === wanted ||
        String(p.catalogProductId || '') === wanted;
    }) || null;
  }

  function _recipeById(id) {
    var wanted = String(id || '');
    if (!wanted) return null;
    return (_data.recipes || []).find(function (p) {
      return String(p.id || '') === wanted ||
        String(p.fichaId || '') === wanted ||
        String(p.fichaTecnicaId || '') === wanted ||
        String(p.recipeId || '') === wanted;
    }) || null;
  }

  function _stockItemUnitCost(item) {
    if (!item) return 0;
    var directCost = _num(item.custo_atual != null ? item.custo_atual : (item.custoAtual != null ? item.custoAtual : (item.stockUnitCost != null ? item.stockUnitCost : 0)));
    if (_num(item.preco_compra_base_embalagem || item.basePackagePrice) > 0) return directCost;
    var hasPurchaseHistory = !!item.ultima_compra_id || !!item.ultima_compra_data || _num(item.custo_medio_compra || 0) > 0 || _num(item.custo_medio_qtd_base || 0) > 0;
    if (hasPurchaseHistory) return directCost;
    var content = _num(item.conteudo_por_embalagem_padrao || item.conteudoPorEmbalagemPadrao || 1) || 1;
    var savedPurchase = _num(item.preco_compra || item.purchasePrice || 0);
    if (content > 1 && directCost > 0 && savedPurchase > 0 && Math.abs(directCost - savedPurchase) < 0.000001) {
      return directCost / content;
    }
    return directCost || _num(item.preco_compra || item.purchasePrice || item.cost || item.custo || 0);
  }

  function _stockItemLossPercent(item) {
    if (!item) return 0;
    if (item.perda_percentual != null) return Math.max(0, _num(item.perda_percentual));
    if (item.perdaPercentual != null) return Math.max(0, _num(item.perdaPercentual));
    var aproveitamento = _num(item.aproveitamento_padrao || item.aproveitamentoPadrao || 100) || 100;
    return Math.max(0, 100 - aproveitamento);
  }

  function _stockItemClass(item) {
    return _normalizeText((item && (item.classe || item.itemClass || item.stockItemType || item.tipoCadastro || item.class)) || '');
  }

  function _isRecipePackagingItem(item) {
    return _stockItemClass(item) === 'embalagem';
  }

  function _isRecipePackagingComponent(name) {
    return _normalizeText(name || '').indexOf('embal') >= 0;
  }

  function _recipeCostTarget(componentName, item) {
    return _isRecipePackagingItem(item) || _isRecipePackagingComponent(componentName) ? 'packaging' : 'ingredients';
  }

  function _recipeYieldUnitKey(unit) {
    var value = _normalizeText(unit || '').trim();
    if (!value) return '';
    if (['un', 'unid', 'unidade', 'unidades', 'porcao', 'porcoes'].indexOf(value) >= 0) return 'count';
    if (['kg', 'quilo', 'quilos', 'quilograma', 'quilogramas'].indexOf(value) >= 0) return 'kg';
    if (['g', 'gr', 'grama', 'gramas'].indexOf(value) >= 0) return 'g';
    if (['l', 'litro', 'litros'].indexOf(value) >= 0) return 'l';
    if (['ml', 'mililitro', 'mililitros'].indexOf(value) >= 0) return 'ml';
    return value;
  }

  function _recipeComponentUsageRatio(component, recipeYieldQty, recipeYieldUnit) {
    component = component || {};
    var stageQty = _num(component.stageYieldQuantity || component.baseYieldQuantity || component.stockYieldQuantity || 0);
    var recipeQty = _num(recipeYieldQty);
    var stageUnit = component.stageYieldUnit || component.baseYieldUnit || component.stockYieldUnit || '';
    var recipeUnit = recipeYieldUnit || 'unidades';
    var compatible = !!stageQty && !!recipeQty && _recipeYieldUnitKey(stageUnit) && _recipeYieldUnitKey(stageUnit) === _recipeYieldUnitKey(recipeUnit);
    var ratio = compatible ? (recipeQty / stageQty) : 1;
    return isFinite(ratio) && ratio > 0 ? ratio : 1;
  }

  function _recipeComponents(recipe) {
    recipe = recipe || {};
    var components = Array.isArray(recipe.components) ? recipe.components : [];
    if (!components.length && Array.isArray(recipe.recipeComponents)) components = recipe.recipeComponents;
    if (!components.length && Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
      components = [{ name: 'Receita', ingredients: recipe.ingredients }];
    }
    return components || [];
  }

  function _recipePackagingItems(recipe) {
    recipe = recipe || {};
    return Array.isArray(recipe.packagingItems) ? recipe.packagingItems : (Array.isArray(recipe.packaging) ? recipe.packaging : []);
  }

  function _recipeIngredientLineCost(ingredient) {
    ingredient = ingredient || {};
    var item = _costItemById(ingredient.insumoId || ingredient.itemId || ingredient.stockItemId || '');
    var qty = _num(ingredient.qty != null ? ingredient.qty : ingredient.quantity);
    var unitCost = _stockItemUnitCost(item) || _num(ingredient.unitCost || ingredient.custoUnitario || 0);
    var loss = _stockItemLossPercent(item);
    var factor = 1 - (loss / 100);
    if (factor <= 0) factor = 1;
    var grossQty = qty / factor;
    var calculated = grossQty * unitCost;
    return calculated > 0 ? calculated : _num(ingredient.totalCost || ingredient.appliedTotalCost || 0);
  }

  function _recipeCostSummary(recipe) {
    recipe = recipe || {};
    var savedTotal = _num(recipe.totalCost || recipe.custoTotal || recipe.plannedCost || 0);
    var savedUnit = _num(recipe.costPerYield != null ? recipe.costPerYield : (recipe.custoUnitario != null ? recipe.custoUnitario : recipe.unitCost));
    if (savedUnit > 0) return { totalCost: savedTotal, costPerYield: savedUnit };
    var yieldQty = _num(recipe.yieldQuantity || recipe.yield || recipe.rendimento || 1) || 1;
    var yieldUnit = recipe.yieldUnit || recipe.unidadeRendimento || 'unidades';
    var ingredientsCost = 0;
    var packagingCost = 0;
    _recipeComponents(recipe).forEach(function (component) {
      var ratio = _recipeComponentUsageRatio(component, yieldQty, yieldUnit);
      var rawIngredients = 0;
      var rawPackaging = 0;
      (component.ingredients || []).forEach(function (ingredient) {
        var item = _costItemById(ingredient.insumoId || ingredient.itemId || ingredient.stockItemId || '');
        var lineCost = _recipeIngredientLineCost(ingredient);
        if (_recipeCostTarget(component.name || component.componentName || '', item || ingredient) === 'packaging') rawPackaging += lineCost;
        else rawIngredients += lineCost;
      });
      ingredientsCost += rawIngredients * ratio;
      packagingCost += rawPackaging * ratio;
    });
    _recipePackagingItems(recipe).forEach(function (item) {
      packagingCost += _recipeIngredientLineCost(item);
    });
    var direct = ingredientsCost + packagingCost;
    var indirectInfo = _indirectCostInfo();
    var indirect = direct * (_num(indirectInfo.percent) / 100);
    var total = savedTotal > 0 ? savedTotal : direct + indirect;
    return {
      totalCost: total,
      costPerYield: yieldQty > 0 ? total / yieldQty : 0
    };
  }

  function _productUnitCost(p) {
    if (!p) return 0;
    var direct = _num(
      p.cost != null ? p.cost :
      p.custo != null ? p.custo :
      p.purchasePrice != null ? p.purchasePrice :
      p.preco_compra != null ? p.preco_compra :
      p.custo_atual != null ? p.custo_atual :
      p.custoAtual != null ? p.custoAtual :
      p.precoCompra != null ? p.precoCompra :
      p.custoCompra != null ? p.custoCompra :
      p.purchase_price != null ? p.purchase_price :
      p.stockUnitCost != null ? p.stockUnitCost :
      p.costPerYield != null ? p.costPerYield :
      p.custoUnitario != null ? p.custoUnitario :
      p.directCost != null ? p.directCost : 0
    );
    if (direct > 0) return direct;
    var linkedItem = _costItemById(p.sourceItemId || p.produtoProntoId || p.readyProductId || '');
    if (linkedItem) {
      var itemCost = _num(linkedItem.custo_atual != null ? linkedItem.custo_atual : (linkedItem.custoAtual != null ? linkedItem.custoAtual : (linkedItem.preco_compra != null ? linkedItem.preco_compra : linkedItem.purchasePrice)));
      if (itemCost > 0) return itemCost;
    }
    var recipe = _recipeById(p.fichaId || p.fichaTecnicaId || p.recipeId || '');
    if (recipe) {
      var recipeSummary = _recipeCostSummary(recipe);
      var recipeCost = _num(recipeSummary.costPerYield);
      if (recipeCost > 0) return recipeCost;
    }
    return 0;
  }

  function _orderItemCost(item) {
    if (!item) return 0;
    var qty = _num(item.qty != null ? item.qty : (item.quantity != null ? item.quantity : 1)) || 1;
    var productId = item.productId || item.idProduto || item.product_id || item.ref || item.id;
    var product = _productById(productId);
    if (!product) product = _productById(item.fichaTecnicaId || item.fichaId || item.recipeId || item.sourceItemId || item.produtoProntoId || item.readyProductId || '');
    if (!product) product = _costItemById(item.sourceItemId || item.produtoProntoId || item.readyProductId || productId || '');
    if (!product) product = _recipeById(item.fichaTecnicaId || item.fichaId || item.recipeId || '');
    var cost = _productUnitCost(product);
    if (!cost) {
      cost = _num(
        item.stockUnitCost != null ? item.stockUnitCost :
        item.costPerYield != null ? item.costPerYield :
        item.custoUnitario != null ? item.custoUnitario :
        item.cost != null ? item.cost :
        item.custo != null ? item.custo :
        item.custoAtual != null ? item.custoAtual :
        item.purchasePrice != null ? item.purchasePrice :
        item.preco_compra != null ? item.preco_compra :
        item.valorCusto != null ? item.valorCusto : 0
      );
    }
    return cost * qty;
  }


  function _normalizeRecurrence(v) {
    var text = _normalizeText(v || '');
    if (text.indexOf('seman') >= 0) return 'semanal';
    if (text.indexOf('anual') >= 0) return 'anual';
    if (text.indexOf('única') >= 0 || text.indexOf('unica') >= 0 || text.indexOf('one') >= 0 || text.indexOf('single') >= 0) return 'única';
    return 'mensal';
  }

  function _recurrenceLabel(v) {
    return ({ semanal: 'Semanal', mensal: 'Mensal', anual: 'Anual', 'única': 'Única' })[v] || 'Mensal';
  }

  function _periodRecurrenceFactor(v) {
    var recurrence = _normalizeRecurrence(v);
    if (_state.periodType === 'annual') {
      var months = _routeMonthCount();
      var range = _routeDateRange();
      var days = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000) + 1);
      if (recurrence === 'semanal') return { monthly: 4.33, period: days / 7 };
      if (recurrence === 'anual') return { monthly: 1 / 12, period: months / 12 };
      if (recurrence === 'única') return { monthly: 1, period: 1 };
      return { monthly: 1, period: months };
    }
    if (recurrence === 'semanal') return { monthly: 4.33, period: 4.33 };
    if (recurrence === 'anual') return { monthly: 1 / 12, period: 1 / 12 };
    if (recurrence === 'única') return { monthly: 1, period: 1 };
    return { monthly: 1, period: 1 };
  }

  function _normalizeCategoryKey(v) {
    return _normalizeText(v || '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'despesas';
  }

  function _parseCategoryLabel(v) {
    if (!v) return 'Despesa';
    return String(v).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function _openPayablesRows() {
    return _openPayables().map(function (row) {
      var periodFactor = _periodRecurrenceFactor(row.recurrence);
      var projectedMonthly = row.value * periodFactor.monthly;
      var projected = _state.periodType === 'annual' ? row.value * periodFactor.period : row.value * periodFactor.period;
      return {
        id: row.id,
        source: 'payable',
        name: row.name,
        value: row.value,
        recurrence: row.recurrence,
        recurrenceLabel: row.recurrenceLabel,
        projectedMonthly: projectedMonthly,
        projected: projected,
        categoryId: row.categoryId,
        sourceLabel: row.financialNature === 'custo' ? 'Custo em conta a pagar' : 'Conta a pagar',
        financialNature: row.financialNature || 'despesa',
        costClass: row.costClass || 'indireto',
        dueDate: row.dueDate || '',
        raw: row.raw || null
      };
    });
  }

  function _mergeHistoricalCategories(extraRows) {
    var rows = _historicalExpenseRows();
    var payables = _openPayablesRows().concat(extraRows || []);
    var payableNames = payables.map(function (p) { return _normalizeText(p.name); }).filter(Boolean);
    return rows.filter(function (r) {
      var normalized = _normalizeText(r.name);
      return !payableNames.some(function (name) {
        return name.indexOf(normalized) >= 0 || normalized.indexOf(name) >= 0;
      });
    });
  }

  function _historicalExpenseRows() {
    return _historicalFinanceRows('despesa');
  }

  function _fixedRowsForForecast() {
    var payables = _openPayablesRows();
    var routeOutflows = _routeOutflowRows(payables);
    return payables.concat(routeOutflows).concat(_mergeHistoricalCategories(payables.concat(routeOutflows))).concat(_historicalCostRows());
  }

  function _routeOutflowRows(payableRows) {
    var rows = [];
    var seen = {};
    var payableIds = {};
    (payableRows || []).forEach(function (row) {
      var raw = row && row.raw || {};
      [row && row.id, raw.id, raw.sourceId, raw.contaPagarId].forEach(function (id) {
        id = String(id || '').replace(/^pay:/, '').trim();
        if (id) payableIds[id] = true;
      });
    });
    var range = _routeDateRange();
    function add(item, source) {
      if (!item) return;
      var type = _normalizeText(item.tipo || item.type || '');
      if (source === 'movimentacoes') {
        if (type !== 'saida' && type !== 'saída' && type !== 'expense') return;
      } else if (type && type !== 'saida' && type !== 'saída' && type !== 'expense') {
        return;
      }
      var origin = _normalizeText(item.origem || item.origin || item.source || item.sourceCollection || '');
      if (origin === 'transferencia' || origin === 'transferência' || origin === 'transfer' || origin === 'caixa') return;
      var status = _normalizeText(item.status || '');
      if (status === 'cancelado' || status === 'cancelada' || status === 'canceled' || status === 'cancelled' || status === 'estornado') return;
      var linkedId = String(item.contaPagarId || item.sourceId || item.origemId || '').trim();
      if (linkedId && payableIds[linkedId]) return;
      var d = _recordDate(item);
      if (!d || d < range.start || d > range.end) return;
      var value = source === 'movimentacoes' ? _movementValueOut(item) : _outflowValue(item);
      if (!(value > 0)) return;
      var rawCat = item.categoriaFinanceiraId || item.categoria_id || item.categoriaId || item.categoryId || item.categoriaFinanceiraNome || item.categoria || item.category || item.financialCategory || '';
      var meta = _categoryMeta(rawCat);
      var nature = meta.category ? meta.nature : _financeNature(item);
      var costClass = meta.category ? meta.costClass : _financeCostClass(item);
      var name = item.descricao || item.description || item.name || item.title || meta.name || (nature === 'custo' ? 'Custo lançado' : 'Despesa lançada');
      var id = String(item.id || item.sourceId || item.contaPagarId || [name, value, d.toISOString().slice(0, 10)].join(':'));
      var key = source + ':' + id;
      if (seen[key]) return;
      seen[key] = true;
      rows.push({
        id: 'out:' + key,
        source: source,
        name: name,
        value: value,
        recurrence: 'única',
        recurrenceLabel: 'Única',
        include: _state.fixedInclude['out:' + key] !== false,
        projectedMonthly: _state.fixedInclude['out:' + key] === false ? 0 : value / Math.max(1, _routeMonthCount()),
        projected: _state.fixedInclude['out:' + key] === false ? 0 : value,
        sourceLabel: nature === 'custo' ? 'Custo lançado' : 'Saída lançada',
        transformable: false,
        categoryId: item.categoriaFinanceiraId || item.categoria_id || item.categoriaId || item.categoryId || '',
        financialNature: nature || 'despesa',
        costClass: costClass || 'indireto',
        dueDate: d.toISOString().slice(0, 10),
        raw: item
      });
    }
    (_data.movements || []).forEach(function (item) { add(item, 'movimentacoes'); });
    (_data.saidas || []).forEach(function (item) { add(item, 'financeiro_saidas'); });
    return rows;
  }



  function _currentCash() {
    var total = 0;
    (_data.contas || []).filter(function (c) { return c.ativo !== false; }).forEach(function (c) {
      var start = _num(c.saldo_inicial != null ? c.saldo_inicial : c.saldoInicial);
      var ent = (_data.movements || []).filter(function (m) {
        return String(m.conta_id || m.contaId || m.conta_bancaria_id || m.contaBancariaId || '') === String(c.id) && _movementType(m) === 'entrada' && _movementActive(m);
      }).reduce(function (s, m) {
        return s + _movementValueIn(m);
      }, 0);
      var sai = (_data.movements || []).filter(function (m) {
        return String(m.conta_id || m.contaId || m.conta_bancaria_id || m.contaBancariaId || '') === String(c.id) && _movementType(m) === 'saida' && _movementActive(m);
      }).reduce(function (s, m) {
        return s + _movementValueOut(m);
      }, 0);
      total += start + ent - sai;
    });
    return total;
  }

  function _movementType(m) {
    return _normalizeText(m.tipo || m.type || '');
  }

  function _movementActive(m) {
    var st = _normalizeText(m.status || '');
    return st === 'efetivado' || st === 'pago' || st === 'parcial' || st === 'recebido' || st === 'received';
  }

  function _movementValueIn(m) {
    var st = _normalizeText(m.status || '');
    var value = _num(m.valorRecebido || m.valor_recebido_total || m.valorTotalOriginal || m.valorParcela || m.valor || 0);
    if (!value && st === 'efetivado') value = _num(m.valor || 0);
    return value;
  }

  function _movementValueOut(m) {
    var st = _normalizeText(m.status || '');
    var isParcel = !!(m.parcelada || m.parcelaNumero || m.numeroParcelas || m.parcelamentoId || (m.parcelamento && m.parcelamento.parcelas));
    var value = isParcel
      ? _num(m.valorPago || m.valor_pago_total || m.valorParcela || m.valor_parcela || m.valor || m.valorTotalOriginal || 0)
      : _num(m.valorPago || m.valor_pago_total || m.valor || m.valorParcela || m.valor_parcela || m.valorTotalOriginal || 0);
    if (!value && st === 'pago') value = _num(m.valor || 0);
    return value;
  }


  function _recordDate(obj) {
    return _dateFromAny(obj && (obj.data_pagamento || obj.dataPagamento || obj.paidAt || obj.date || obj.data || obj.vencimento || obj.dueDate || obj.createdAt || obj.updatedAt));
  }

  function _ts(v) {
    var d = _dateFromAny(v);
    return d ? d.getTime() : 0;
  }

  function _dateFromAny(v) {
    if (!v) return null;
    try {
      if (typeof v.toDate === 'function') return v.toDate();
      if (v instanceof Date) return v;
      var d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  }

  function _fmtDate(d) {
    var dt = _dateFromAny(d);
    if (!dt) return '—';
    return UI.fmtDate ? UI.fmtDate(dt) : dt.toISOString().slice(0, 10);
  }

  function _fmtMoney(v) {
    var n = _num(v);
    return '€ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function _fmtPct(v) {
    return _num(v).toFixed(1).replace('.', ',') + '%';
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }

  function _fmtNum(v, decimals) {
    return _num(v).toFixed(decimals || 0).replace('.', ',');
  }

  function _formatMonthFactor(v) {
    var n = _num(v);
    return Math.abs(n - Math.round(n)) < 0.005 ? String(Math.round(n)) : _fmtNum(n, 1);
  }

  function _num(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = String(v).trim();
    if (!s) return 0;
    var cleaned = s.replace(/[^\d,.-]/g, '');
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > -1 && lastDot > -1) {
      if (lastComma > lastDot) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (lastComma > -1) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    var n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }

  function _normalizeText(v) {
    return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function _scenarioLabel(key) {
    return (SCENARIOS[key] && SCENARIOS[key].label) || 'Segurança';
  }



















  function _historyMonthsBack() {
    return _hasFullYearSalesHistory() ? 12 : 0;
  }













  function _cleanFirestoreData(value) {
    if (value == null) return value;
    if (Array.isArray(value)) {
      return value.map(_cleanFirestoreData).filter(function (item) { return item !== undefined; });
    }
    if (typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (key) {
        var cleaned = _cleanFirestoreData(value[key]);
        if (cleaned !== undefined) out[key] = cleaned;
      });
      return out;
    }
    if (typeof value === 'number') {
      return isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return undefined;
  }

  function destroy() {}

  return {
    render: render,
    destroy: destroy,
    _switchSub: _switchSub,
    _setRoutePeriod: _setRoutePeriod,
    _setMode: _setMode,
    _setScenario: _setScenario,
    _setGrowthSource: _setGrowthSource,
    _setDeclineSource: _setDeclineSource,
    _setAnnualMode: _setAnnualMode,
    _setGrowthPct: _setGrowthPct,
    _setDeclinePct: _setDeclinePct,
    _setSnapshotName: _setSnapshotName,
    _setTargetProfit: _setTargetProfit,
    _setAverageTicket: _setAverageTicket,
    _setChannelForecast: _setChannelForecast,
    _moneyInputValue: _moneyInputValue,
    _toggleChannelInclude: _toggleChannelInclude,
    _setCostMode: _setCostMode,
    _setCostPct: _setCostPct,
    _toggleCostInclude: _toggleCostInclude,
    _toggleFixedInclude: _toggleFixedInclude,
    _transformFixedExpense: _transformFixedExpense,
    _openCreateRouteModal: _openCreateRouteModal,
    _openRouteSummaryModal: _openRouteSummaryModal,
    _openActiveRouteSummary: _openActiveRouteSummary,
    _selectRouteForSummary: _selectRouteForSummary,
    _activateRouteFromModal: _activateRouteFromModal,
    _closePlanModals: _closePlanModals,
    _chooseRoute: _chooseRoute,
    _toggleWorkDay: _toggleWorkDay,
    _setClosedDays: _setClosedDays,
    _setMonthWeight: _setMonthWeight,
    _saveSnapshot: _saveSnapshot,
    _loadSnapshot: _loadSnapshot,
    _setMonthScenario: _setMonthScenario,
    _deleteRoute: _deleteRoute,
  };
})();
