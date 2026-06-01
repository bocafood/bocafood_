// js/modules/performance.js
window.Modules = window.Modules || {};
Modules.Performance = (function () {
  'use strict';

  var _loading = false;
  var _state = {
    tab: 'visao',
    period: 'thismonth',
    start: '',
    end: '',
    channel: 'all',
    categoryType: 'saidas',
    scenarioMonthKey: _currentMonthKey()
  };

  var _data = {
    orders: [],
    entries: [],
    exits: [],
    categories: [],
    snapshots: [],
    monthScenarios: [],
    monthScenario: null,
    channels: [],
    money: { desiredMarginPct: 60, minMarginPct: 40 }
  };

  function render() {
    var app = document.getElementById('app');
    app.innerHTML = '' +
      '<div class="module-page perf-root perf-page">' +
        '<div id="perf-content" class="module-content perf-content"><div class="loading-inline">Carregando...</div></div>' +
      '</div>';

    _paint();
    _load().then(function () {
      _paint();
    }).catch(function (err) {
      console.error('Performance load error', err);
      _paintError(err);
    });
  }

  function destroy() {}

  function _load() {
    _loading = true;
    return Promise.all([
      _safeAll('orders'),
      _safeAll('movimentacoes'),
      _safeAll('financeiro_entradas'),
      _safeAll('financeiro_saidas'),
      _safeAll('financeiro_apagar'),
      _safeAll('contas_pagar'),
      _safeAll('financeiro_categorias'),
      _safeAll('flight_plans'),
      _safeAll('flight_plan_month_scenarios'),
      _safeDoc('flight_plan_month_scenarios', _currentMonthKey()),
      _safeDoc('config', 'dinheiro'),
      _safeDoc('config', 'canais_venda')
    ]).then(function (r) {
      _data.orders = Array.isArray(r[0]) ? r[0] : [];
      _data.entries = _normalizeEntries(r[1], r[2]);
      _data.exits = _normalizeExits(r[3], r[4], r[5], r[1]);
      _data.categories = Array.isArray(r[6]) ? r[6] : [];
      _data.snapshots = Array.isArray(r[7]) ? r[7].slice().sort(function (a, b) {
        return _ts(b.createdAt) - _ts(a.createdAt);
      }) : [];
      _data.monthScenarios = Array.isArray(r[8]) ? r[8].filter(Boolean) : [];
      _data.monthScenario = _resolveMonthScenario(_state.scenarioMonthKey, r[9] || null, _data.monthScenarios, _data.snapshots);
      _data.money = _normalizeMoney(r[10] || {});
      _data.channels = _normalizeConfiguredChannels(r[11] || {});
      _loading = false;
    }).catch(function (err) {
      _loading = false;
      console.error('Performance data load error', err);
    });
  }

  function _paint() {
    var content = document.getElementById('perf-content');
    if (!content) return;

    if (_loading) {
      content.innerHTML = '<div class="loading-inline">Carregando...</div>';
      return;
    }

    var vm = _buildModel();
    var html = '' +
      '<div class="perf-stack">' +
        _tabsCard(vm) +
        _tabContent(vm) +
      '</div>';

    content.innerHTML = _safeHtml(html);
  }

  function _paintError(err) {
    var content = document.getElementById('perf-content');
    if (!content) return;
    content.innerHTML = _safeHtml('<div style="' + _cardStyle() + 'color:#B42318;font-size:13px;">Erro ao carregar a tela: ' + _esc((err && err.message) || err || 'desconhecido') + '</div>');
  }

  function _setPeriod(value) {
    _state.period = String(value || 'thismonth');
    if (_state.period !== 'custom') {
      _state.start = '';
      _state.end = '';
    }
    _paint();
  }

  function _setPeriodStart(value) {
    _state.start = String(value || '');
    _paint();
  }

  function _setPeriodEnd(value) {
    _state.end = String(value || '');
    _paint();
  }

  function _setChannel(value) {
    _state.channel = String(value || 'all');
    _paint();
  }

  function _setCategoryType(value) {
    _state.categoryType = String(value || 'saidas');
    _paint();
  }

  function _setScenarioMonth(value) {
    _state.scenarioMonthKey = String(value || _currentMonthKey());
    _data.monthScenario = _resolveMonthScenario(_state.scenarioMonthKey, _data.monthScenario, _data.monthScenarios, _data.snapshots);
    _paint();
  }

  function _setTab(value) {
    _state.tab = ['visao', 'vendas', 'financeiro'].indexOf(value) >= 0 ? value : 'visao';
    _paint();
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

  function _normalizeMoney(cfg) {
    cfg = cfg || {};
    return {
      desiredMarginPct: _num(cfg.desiredMarginPct != null ? cfg.desiredMarginPct : cfg.margemDesejadaPct != null ? cfg.margemDesejadaPct : 60),
      minMarginPct: _num(cfg.minMarginPct != null ? cfg.minMarginPct : cfg.margemMinimaPct != null ? cfg.margemMinimaPct : 40)
    };
  }

  function _normalizeEntries(legacy, modern) {
    var arr = [];
    (Array.isArray(legacy) ? legacy : []).forEach(function (m) {
      if (!_isCashFlowType(m, 'entrada')) return;
      arr.push(_normalizeCashFlow(m, 'entrada', 'movimentacoes'));
    });
    (Array.isArray(modern) ? modern : []).forEach(function (m) {
      arr.push(_normalizeCashFlow(m, 'entrada', 'financeiro_entradas'));
    });
    return _dedupe(arr).sort(function (a, b) { return b.ts - a.ts; });
  }

  function _normalizeExits(saidas, apagar, contasPagar, legacy) {
    var arr = [];
    var movementRefs = _payableMovementRefs(legacy);
    (Array.isArray(legacy) ? legacy : []).forEach(function (m) {
      if (!_isCashFlowType(m, 'saida')) return;
      arr.push(_normalizeCashFlow(m, 'saida', 'movimentacoes'));
    });
    (Array.isArray(saidas) ? saidas : []).forEach(function (m) {
      arr.push(_normalizeCashFlow(m, 'saida', 'financeiro_saidas'));
    });
    (Array.isArray(apagar) ? apagar : []).forEach(function (m) {
      arr.push(_normalizePayableCashFlow(m, 'financeiro_apagar', movementRefs));
    });
    (Array.isArray(contasPagar) ? contasPagar : []).forEach(function (m) {
      arr.push(_normalizePayableCashFlow(m, 'contas_pagar', movementRefs));
    });
    return _dedupe(arr).sort(function (a, b) { return b.ts - a.ts; });
  }

  function _isCashFlowType(item, expected) {
    var type = _normalizeText(item && (item.tipo || item.type || item.kind || ''));
    if (!type) return false;
    if (expected === 'entrada') {
      return type === 'entrada' || type === 'income' || type === 'receita' || type === 'recebimento';
    }
    return type === 'saida' || type === 'saída' || type === 'expense' || type === 'despesa' || type === 'pagamento';
  }

  function _payableMovementRefs(legacy) {
    var refs = {};
    (Array.isArray(legacy) ? legacy : []).forEach(function (m) {
      if (!_isCashFlowType(m, 'saida')) return;
      if (m.contaPagarId) refs['id:' + String(m.contaPagarId)] = true;
      if (m.sourceCollection && m.sourceId) refs['source:' + String(m.sourceCollection) + ':' + String(m.sourceId)] = true;
    });
    return refs;
  }

  function _normalizePayableCashFlow(item, source, movementRefs) {
    var normalized = _normalizeCashFlow(item, 'saida', source);
    var id = String(item && (item.id || item._id || item.docId) || '');
    var hasMovement = !!(id && (movementRefs['id:' + id] || movementRefs['source:' + source + ':' + id]));
    if (hasMovement && (normalized.status === 'pago' || normalized.status === 'parcial')) {
      normalized.effectiveValue = 0;
      normalized.paidValue = 0;
    }
    return normalized;
  }

  function _normalizeCashFlow(item, kind, source) {
    item = item || {};
    var rawValue = _num(item.valor != null ? item.valor : item.value);
    var totalOriginal = _num(item.valorTotalOriginal != null ? item.valorTotalOriginal : item.valor_total_original != null ? item.valor_total_original : rawValue);
    var valueRow = _num(item.valorParcela != null ? item.valorParcela : item.valor_parcela != null ? item.valor_parcela : rawValue || totalOriginal);
    var paid = _num(item.valorPago != null ? item.valorPago : item.valor_pago_total != null ? item.valor_pago_total : item.valorRecebido != null ? item.valorRecebido : item.valor_recebido_total != null ? item.valor_recebido_total : 0);
    var pending = _num(item.saldoRestante != null ? item.saldoRestante : item.saldo_restante != null ? item.saldo_restante : Math.max(0, totalOriginal - paid));
    var status = _normalizeCashStatus(item, kind, source, item.status || item.state || '', paid, totalOriginal || valueRow);
    var date = _cashDate(item, kind, status);
    var category = _normalizeCategoryName(item.categoria || item.category || item.cat || item.categoryName || item.tipo || '');
    var channel = _normalizeChannelKey(item.channel || item.canal || item.source || '');
    var customer = _normalizeText(item.pessoaNome || item.customerName || item.nome || item.fornecedorNome || item.supplierName || '');
    var desc = _normalizeText(item.descricao || item.description || item.nome || item.title || '');
    var effective = kind === 'entrada'
      ? (status === 'parcial' ? (paid || valueRow - pending) : (status === 'efetivado' || status === 'pago' ? (paid || valueRow) : (status === 'previsto' ? 0 : (paid || valueRow))))
      : (status === 'parcial' ? (paid || valueRow - pending) : (status === 'pago' || status === 'efetivado' ? (paid || valueRow) : 0));

    return {
      id: String(item.id || item._id || item.docId || kind + '-' + Math.random().toString(36).slice(2)),
      kind: kind,
      source: source,
      ts: date ? date.getTime() : 0,
      date: date,
      dateKey: _dateKey(date),
      labelDate: UI.fmtDate(date || new Date()),
      description: desc || '—',
      category: category || 'Sem categoria',
      customer: customer || '—',
      channel: channel || '—',
      status: status || (kind === 'entrada' ? 'efetivado' : 'pago'),
      value: rawValue || totalOriginal || 0,
      valueRow: valueRow || rawValue || totalOriginal || 0,
      totalOriginal: totalOriginal || rawValue || 0,
      paidValue: paid || 0,
      pendingValue: pending || 0,
      effectiveValue: effective || 0,
      raw: item
    };
  }

  function _dedupe(list) {
    var seen = {};
    return list.filter(function (item) {
      var key = [
        item.kind,
        item.dateKey,
        _normalizeText(item.description),
        _normalizeText(item.category),
        _normalizeText(item.customer),
        _normalizeText(item.channel),
        _fmtFixed(item.totalOriginal || item.value || 0)
      ].join('|');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function _buildModel() {
    var range = _periodRange();
    var orders = _ordersInRange(range.start, range.end);
    var entries = _entriesInRange(range.start, range.end);
    var exits = _exitsInRange(range.start, range.end);
    var days = _rangeDays(range.start, range.end);
    var daysTotal = days.length || 1;
    var today = _todayStart();
    var currentMonth = _monthRange(today);
    var monthOrders = _ordersInRange(currentMonth.start, currentMonth.end);
    var monthTarget = _monthScenarioTarget();
    var actualRevenue = _sum(orders, 'value');
    var monthRevenueTotal = _sum(monthOrders, 'value');
    var actualEntries = _sum(entries, 'effectiveValue');
    var actualExits = _sum(exits, 'effectiveValue');
    var pendingReceivables = entries.filter(function (x) { return x.kind === 'entrada' && (x.status === 'previsto' || x.status === 'parcial'); }).reduce(function (s, x) {
      return s + (x.status === 'parcial' ? x.pendingValue : x.valueRow);
    }, 0);
    var pendingPayables = exits.filter(function (x) { return x.kind === 'saida' && (x.status === 'pendente' || x.status === 'vencido' || x.status === 'parcial'); }).reduce(function (s, x) {
      return s + (x.status === 'parcial' ? x.pendingValue : x.valueRow);
    }, 0);
    var pendingPayableRows = exits.filter(function (x) {
      return x.kind === 'saida' && (x.status === 'pendente' || x.status === 'vencido' || x.status === 'parcial');
    }).sort(function (a, b) {
      return a.ts - b.ts;
    }).slice(0, 5);
    var netCash = actualEntries - actualExits;
    var marginPct = actualRevenue > 0 ? ((actualRevenue - actualExits) / actualRevenue) * 100 : 0;
    var periodPrev = _previousRange(range.start, range.end);
    var prevOrders = _ordersInRange(periodPrev.start, periodPrev.end);
    var prevEntries = _entriesInRange(periodPrev.start, periodPrev.end);
    var prevExits = _exitsInRange(periodPrev.start, periodPrev.end);
    var targetRevenue = monthTarget.revenue > 0 ? monthTarget.revenue : 0;
    var targetProfit = monthTarget.profit > 0 ? monthTarget.profit : 0;
    var daysLeftMonth = Math.max(0, _diffDays(today, currentMonth.end));
    var daysElapsedMonth = Math.min(_diffDays(currentMonth.start, today) + 1, currentMonth.days);
    var dailyPlan = _dailyTargetPlan(days, targetRevenue, orders);
    var monthPlan = _dailyTargetPlan(_rangeDays(currentMonth.start, currentMonth.end), targetRevenue, monthOrders);
    var expectedNow = targetRevenue ? _plannedTargetUpTo(monthPlan, today) : 0;
    var remainingToTarget = targetRevenue ? Math.max(0, targetRevenue - monthRevenueTotal) : 0;
    var remainingPlanWeight = _plannedWeightAfter(monthPlan, today);
    var needPerDay = targetRevenue && remainingPlanWeight > 0 ? remainingToTarget / remainingPlanWeight : 0;
    var elapsedPlanWeight = _plannedWeightUpTo(monthPlan, today);
    var totalPlanWeight = _plannedTotalWeight(monthPlan);
    var paceProjection = targetRevenue && elapsedPlanWeight > 0 ? (monthRevenueTotal / elapsedPlanWeight) * totalPlanWeight : 0;
    var progressPct = targetRevenue ? (monthRevenueTotal / targetRevenue) * 100 : 0;
    var bestDay = _bestDay(days, orders);
    var bestChannel = _bestChannel(orders);
    var bestCategory = _bestCategory(exits);
    var dailyRows = _dailyRows(days, orders, entries, exits, targetRevenue, dailyPlan);
    var channelBreakdown = _channelBreakdown(orders);
    var entryCategories = _categoryBreakdown(entries, 'entrada');
    var entryOrigins = _entryOriginBreakdown(entries);
    var exitCategories = _categoryBreakdown(exits, 'saida');
    var expensePlanRows = _expensePlanRows(exits);
    var monthScenario = _data.monthScenario || null;
    var scenarioName = monthScenario ? (monthScenario.snapshotName || monthScenario.name || 'Rota ativa') : '';
    var scenarioLabel = monthScenario ? _scenarioLabel(monthScenario.scenario) : 'Sem rota';
    var scenarioRevenue = monthTarget.revenue;
    var scenarioProfit = monthTarget.profit;
    var scenarioCash = monthTarget.cashFinal;
    var targetAverageTicket = monthTarget.averageTicket;
    var rateLabel;
    var monthStarting = targetRevenue && daysElapsedMonth <= 2 && progressPct < 92;
    if (!targetRevenue) rateLabel = 'Escolha uma rota no Plano de Voo para acompanhar o mês com mais clareza.';
    else if (monthStarting) rateLabel = 'O mês está só começando. Observe os primeiros pedidos antes de cobrar ritmo.';
    else if (progressPct >= 100 && marginPct >= _data.money.desiredMarginPct) rateLabel = 'Seu mês está caminhando bem e a margem acompanha esse resultado.';
    else if (progressPct >= 85) rateLabel = 'Seu mês pede atenção, mas ainda há tempo para ajustar o ritmo.';
    else rateLabel = 'Seu mês precisa de uma reação para voltar ao caminho escolhido.';
    if (targetRevenue && !monthStarting && marginPct < _data.money.minMarginPct) {
      rateLabel = 'As vendas estão entrando, mas a sobra ficou apertada. Vale olhar preço, custo e descontos.';
    }

    return {
      range: range,
      periodLabel: range.label,
      selectedChannel: _state.channel,
      selectedCategoryType: _state.categoryType,
      monthScenario: monthScenario,
      scenarioName: scenarioName,
      scenarioLabel: scenarioLabel,
      targetRevenue: targetRevenue,
      targetProfit: targetProfit,
      targetAverageTicket: targetAverageTicket,
      targetMonthStrength: monthTarget.strengthLabel || '',
      targetMonthLabel: monthTarget.monthLabel || _scenarioMonthLabel(),
      scenarioCash: scenarioCash,
      actualRevenue: actualRevenue,
      actualEntries: actualEntries,
      actualExits: actualExits,
      pendingReceivables: pendingReceivables,
      pendingPayables: pendingPayables,
      pendingPayableRows: pendingPayableRows,
      netCash: netCash,
      marginPct: marginPct,
      daysTotal: daysTotal,
      daysElapsedMonth: daysElapsedMonth,
      daysLeftMonth: daysLeftMonth,
      expectedNow: expectedNow,
      remainingToTarget: remainingToTarget,
      needPerDay: needPerDay,
      paceProjection: paceProjection,
      progressPct: progressPct,
      bestDay: bestDay,
      bestChannel: bestChannel,
      bestCategory: bestCategory,
      rateLabel: rateLabel,
      orders: orders,
      entries: entries,
      exits: exits,
      prevOrders: prevOrders,
      prevEntries: prevEntries,
      prevExits: prevExits,
      dailyRows: dailyRows,
      channelBreakdown: channelBreakdown,
      entryCategories: entryCategories,
      entryOrigins: entryOrigins,
      exitCategories: exitCategories,
      expensePlanRows: expensePlanRows,
      monthOrders: monthOrders,
      periodOrders: orders,
      periodEntries: entries,
      periodExits: exits,
      channels: _channelOptions(orders),
      currentMonth: currentMonth
    };
  }

  function _paintErrorFallback(msg) {
    var content = document.getElementById('perf-content');
    if (content) {
      content.innerHTML = _safeHtml('<div style="' + _cardStyle() + 'color:#B42318;font-size:13px;">Erro ao montar a tela: ' + _esc(msg || 'desconhecido') + '</div>');
    }
  }

  function _tabsCard(vm) {
    var tabs = [
      { key: 'visao', label: 'Visão geral', icon: 'space_dashboard' },
      { key: 'vendas', label: 'Vendas', icon: 'shopping_bag' },
      { key: 'financeiro', label: 'Financeiro', icon: 'account_balance_wallet' }
    ];
    return '' +
      '<section class="perf-tabs-wrap">' +
        '<div class="perf-tabs">' +
          tabs.map(function (tab) {
            var active = _state.tab === tab.key;
            return '<button type="button" class="' + (active ? 'active' : '') + '" onclick="Modules.Performance._setTab(\'' + tab.key + '\')"><span class="mi">' + _esc(tab.icon) + '</span>' + _esc(tab.label) + '</button>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function _tabContent(vm) {
    if (_state.tab === 'vendas') {
      return _kpiGrid(vm) + _channelsCard(vm) + _dailyCard(vm);
    }
    if (_state.tab === 'financeiro') {
      return _financeCard(vm) + _expensePlanCard(vm) + _categoriesCard(vm);
    }
    return _scenarioBanner(vm) + _routeStatusCard(vm) + _routeThisMonthCard(vm) + _routePaceCard(vm) + _routePracticalCard(vm);
  }

  function _scenarioBanner(vm) {
    if (!vm.monthScenario) {
      var emptyStatus = { color: '#B45309', bg: '#FFF7ED', border: '#FED7AA' };
      return '' +
        '<section class="perf-route-banner perf-route-banner-empty" style="--perf-route-color:' + _esc(emptyStatus.color) + ';--perf-route-bg:' + _esc(emptyStatus.bg) + ';--perf-route-border:' + _esc(emptyStatus.border) + ';">' +
          '<div class="perf-route-main">' +
            '<div class="perf-route-copy">' +
              '<span>Rota ativa</span>' +
              '<strong>Nenhuma rota ativa</strong>' +
              '<p>Crie uma rota no Plano de Voo para acompanhar o mês com uma meta clara.</p>' +
            '</div>' +
          '</div>' +
          '<button class="perf-primary-button" onclick="Router.navigate(\'crescimento/plano-de-voo\')"><span class="mi">add</span>Criar rota</button>' +
        '</section>';
    }

    var routeStatus = _scenarioTone(vm.monthScenario && vm.monthScenario.scenario);
    return '' +
      '<section class="perf-route-banner" style="--perf-route-color:' + _esc(routeStatus.color) + ';--perf-route-bg:' + _esc(routeStatus.bg) + ';--perf-route-border:' + _esc(routeStatus.border) + ';">' +
        '<div class="perf-route-main">' +
          '<div class="perf-route-copy">' +
            '<span>Rota ativa</span>' +
            '<strong>' + _esc(vm.scenarioName || 'Rota ativa') + '</strong>' +
            '<p>Esta é a rota escolhida para guiar o mês. A Performance mostra se as vendas estão acompanhando o caminho combinado.</p>' +
          '</div>' +
        '</div>' +
        '<div class="perf-route-summary">' +
          _routeMini('Meta do mês', _fmtMoney(vm.targetRevenue || 0), routeStatus.color) +
          _routeMini('Sobra esperada', _fmtMoney(vm.targetProfit || 0), '#1F1F1F') +
          _routeMini('Cenário', vm.scenarioLabel, routeStatus.color) +
          _routeMini('Força do mês', vm.targetMonthStrength || _scenarioMonthLabel(vm), '#8A6F5A') +
        '</div>' +
      '</section>';
  }

  function _filtersCard(vm) {
    var channels = vm.channels || [];
    var periodField = '' +
      '<div class="field" style="margin-bottom:0;">' +
        '<span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">Período</span>' +
        '<select onchange="Modules.Performance._setPeriod(this.value)" style="' + _inputStyle() + 'height:40px;">' +
          _selectOption('today', 'Hoje') +
          _selectOption('yesterday', 'Ontem') +
          _selectOption('last7', 'Últimos 7 dias') +
          _selectOption('last30', 'Últimos 30 dias') +
          _selectOption('thismonth', 'Este mês') +
          _selectOption('lastmonth', 'Mês passado') +
          _selectOption('custom', 'Personalizado') +
        '</select>' +
      '</div>';

    var customFields = _state.period === 'custom'
      ? '' +
        '<div class="field" style="margin-bottom:0;">' +
          '<span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">Data inicial</span><input type="date" value="' + _esc(_state.start) + '" onchange="Modules.Performance._setPeriodStart(this.value)" style="' + _inputStyle() + 'height:40px;">' +
        '</div>' +
        '<div class="field" style="margin-bottom:0;">' +
          '<span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">Data final</span><input type="date" value="' + _esc(_state.end) + '" onchange="Modules.Performance._setPeriodEnd(this.value)" style="' + _inputStyle() + 'height:40px;">' +
        '</div>'
      : '';

    return '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Filtros', 'Ajuste período e canal para analisar a performance operacional.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
          periodField +
          customFields +
          '<div class="field" style="margin-bottom:0;">' +
            '<span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">Canal</span>' +
            '<select onchange="Modules.Performance._setChannel(this.value)" style="' + _inputStyle() + 'height:40px;">' +
              channels.map(function (ch) {
                return '<option value="' + _esc(ch.key) + '"' + (_state.channel === ch.key ? ' selected' : '') + '>' + _esc(ch.label) + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
          _chip(vm.periodLabel) +
          _chip('Canal: ' + _channelLabel(_state.channel, vm.channels)) +
          _chip((vm.orders || []).length + ' pedido(s)') +
          _chip((vm.entries || []).length + ' entrada(s)') +
          _chip((vm.exits || []).length + ' saída(s)') +
        '</div>' +
      '</section>';
  }

  function _kpiGrid(vm) {
    var prevOrders = vm.prevOrders || [];
    var prevEntries = vm.prevEntries || [];
    var prevExits = vm.prevExits || [];
    var prevRevenue = _sum(prevOrders, 'value');
    var prevEntriesTotal = _sum(prevEntries, 'effectiveValue');
    var prevExitsTotal = _sum(prevExits, 'effectiveValue');
    return '' +
      '<section style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;">' +
          _heroMetric('Vendas realizadas', _fmtMoney(vm.actualRevenue), _trendLabel(vm.actualRevenue, prevRevenue, 'vs período anterior'), 'payments', '#8A6F5A') +
          _heroMetric('Meta do mês', vm.targetRevenue ? _fmtMoney(vm.targetRevenue) : '—', vm.targetRevenue ? 'considera a força do mês na rota' : 'Crie uma rota no Plano de Voo', 'flag', '#6C8777') +
          _heroMetric('Atingimento', vm.targetRevenue ? vm.progressPct.toFixed(1) + '%' : '—', vm.targetRevenue ? (vm.progressPct >= 100 ? 'Meta batida' : 'Meta da rota') : 'Sem rota ativa', 'query_stats', vm.progressPct >= 100 ? '#1F6F43' : '#B45309') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
          _supportMetric('Falta vender', vm.targetRevenue ? _fmtMoney(vm.remainingToTarget) : '—', vm.targetRevenue ? (vm.remainingToTarget > 0 ? 'valor restante para fechar' : 'meta já alcançada') : 'sem rota ativa', 'restart_alt', vm.remainingToTarget > 0 ? '#B45309' : '#1F6F43') +
          _supportMetric('Necessário por dia', vm.targetRevenue ? _fmtMoney(vm.needPerDay) : '—', vm.targetRevenue ? (vm.daysLeftMonth + ' dia(s) até o fim do mês') : 'sem rota ativa', 'today', '#B42318') +
          _supportMetric('Entradas no caixa', _fmtMoney(vm.actualEntries), _trendLabel(vm.actualEntries, prevEntriesTotal, 'vs período anterior'), 'south_west', '#1F6F43') +
          _supportMetric('Saídas no caixa', _fmtMoney(vm.actualExits), _trendLabel(vm.actualExits, prevExitsTotal, 'vs período anterior'), 'north_east', '#B42318') +
          _supportMetric('Saldo líquido', _fmtMoney(vm.netCash), vm.marginPct.toFixed(1) + '% de margem operacional', 'account_balance_wallet', vm.netCash >= 0 ? '#1F6F43' : '#B42318') +
        '</div>' +
      '</section>';
  }

  function _statusCard(vm) {
    var tone = '#6C8777';
    var bg = '#EEF4FF';
    if (!vm.targetRevenue) {
      tone = '#B45309';
      bg = '#FFF7ED';
    } else if (vm.progressPct >= 100 && vm.marginPct >= _data.money.desiredMarginPct) {
      tone = '#1F6F43';
      bg = '#EDFAF3';
    } else if (vm.marginPct < _data.money.minMarginPct) {
      tone = '#B42318';
      bg = '#FFF0EE';
    }

    return '' +
      '<section style="' + _cardStyle() + 'display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;min-width:0;flex:1;">' +
          '<div style="width:44px;height:44px;border-radius:14px;background:transparent;color:' + tone + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="mi" style="font-size:25px;">' + (vm.targetRevenue ? 'speed' : 'info') + '</span></div>' +
          '<div style="min-width:0;">' +
            '<div style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.2;margin-bottom:4px;">Leitura do mês</div>' +
            '<div style="font-size:18px;font-weight:700;color:' + tone + ';line-height:1.25;margin-bottom:5px;">' + _esc(vm.rateLabel) + '</div>' +
            '<div style="font-size:13px;color:#6F6860;line-height:1.5;">' +
              'Meta até agora: ' + _fmtMoney(vm.expectedNow) + ' · ' +
              'Vendas acumuladas: ' + _fmtMoney(vm.actualRevenue) + ' · ' +
              'Projeção no ritmo atual: ' + _fmtMoney(vm.paceProjection) +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:' + bg + ';color:' + tone + ';font-size:12px;font-weight:700;">' + _esc(vm.bestChannel.label ? ('Melhor canal: ' + vm.bestChannel.label) : 'Sem canal suficiente') + '</span>' +
          '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:700;">' + _esc(vm.bestDay.label ? ('Melhor dia: ' + vm.bestDay.label) : 'Sem dia suficiente') + '</span>' +
        '</div>' +
      '</section>';
  }

  function _routeStatusCard(vm) {
    var status = _routeStatusInfo(vm);
    var monthRevenue = _monthRevenue(vm);
    var early = _isMonthStarting(vm);
    var compareColor = early ? '#6C8777' : (monthRevenue >= vm.expectedNow ? '#1F6F43' : '#B42318');
    return '' +
      '<section class="perf-status-card" style="--perf-status-bg:' + _esc(status.bg) + ';--perf-status-border:' + _esc(status.border) + ';--perf-status-color:' + _esc(status.color) + ';">' +
        '<div class="perf-status-main">' +
          '<div class="perf-status-copy">' +
            '<span>Como está o mês</span>' +
            '<strong>' + _esc(status.title) + '</strong>' +
            '<p>' + _esc(status.text) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="perf-status-grid">' +
          _routeMini('Esperado até hoje', _fmtMoney(vm.expectedNow)) +
          _routeMini('Vendido até hoje', _fmtMoney(monthRevenue), compareColor) +
          _routeMini(early ? 'Referência inicial' : 'Diferença', early ? 'Mês começando' : _fmtMoney(monthRevenue - vm.expectedNow), early ? '#6C8777' : (monthRevenue >= vm.expectedNow ? '#2563EB' : '#B42318')) +
        '</div>' +
      '</section>';
  }

  function _routeThisMonthCard(vm) {
    var monthRevenue = _monthRevenue(vm);
    var remaining = Math.max(0, _num(vm.targetRevenue) - monthRevenue);
    var ticket = _monthTicket(vm);
    var neededOrders = ticket > 0 && remaining > 0 ? Math.max(1, Math.ceil((remaining / ticket) / Math.max(1, vm.daysLeftMonth || 1))) : 0;
    return '' +
      '<section class="perf-panel" style="' + _cardStyle() + '">' +
        _sectionTitle('Este mês', 'Veja o que já aconteceu, quanto falta vender e o ritmo necessário até o fim do mês.') +
        '<div class="perf-metric-grid">' +
          _miniMetric('Meta do mês', vm.targetRevenue ? _fmtMoney(vm.targetRevenue) : '—', '#6C8777') +
          _miniMetric('Vendido até agora', _fmtMoney(monthRevenue), monthRevenue >= vm.expectedNow ? '#1F6F43' : '#B42318') +
          _miniMetric('Ticket médio atual', ticket > 0 ? _fmtMoney(ticket) : 'Sem base', '#8A6F5A') +
          _miniMetric('Ainda falta vender', remaining > 0 ? _fmtMoney(remaining) : 'Meta alcançada', remaining > 0 ? '#B45309' : '#1F6F43') +
          _miniMetric('Pedidos por dia daqui pra frente', String(neededOrders), '#B42318') +
        '</div>' +
      '</section>';
  }

  function _routePaceCard(vm) {
    var monthRevenue = _monthRevenue(vm);
    var ordersDone = (vm.monthOrders || []).length;
    var ticket = _monthTicket(vm);
    var targetOrders = ticket > 0 && vm.targetRevenue ? Math.ceil(vm.targetRevenue / ticket) : 0;
    var early = _isMonthStarting(vm);
    return '' +
      '<section class="perf-panel perf-panel-soft" style="' + _cardStyle() + '">' +
        _sectionTitle('Ritmo da rota', 'Compare o volume de pedidos planejado com o que já aconteceu no mês.') +
        '<div class="perf-metric-grid">' +
          _miniMetric('Pedidos previstos no mês', targetOrders ? String(targetOrders) : '—', '#6C8777') +
          _miniMetric('Pedidos já feitos', String(ordersDone), early ? '#6C8777' : (ordersDone >= targetOrders ? '#1F6F43' : '#B45309')) +
          _miniMetric(early ? 'Leitura inicial' : 'Se continuar assim', early ? 'Acompanhar nos próximos dias' : _fmtMoney(vm.paceProjection || 0), early ? '#6C8777' : (_num(vm.paceProjection) >= _num(vm.targetRevenue) ? '#1F6F43' : '#B42318')) +
        '</div>' +
      '</section>';
  }

  function _routeComparisonCard(vm) {
    var monthRevenue = _monthRevenue(vm);
    var rows = [
      { label: 'Vendas', planned: vm.targetRevenue, actual: monthRevenue },
      { label: 'Lucro esperado', planned: vm.targetProfit, actual: monthRevenue - vm.actualExits },
      { label: 'Entradas', planned: vm.targetRevenue, actual: vm.actualEntries },
      { label: 'Saídas', planned: 0, actual: vm.actualExits, inverse: true }
    ];
    return '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('O combinado x o que aconteceu', 'Compare o que foi escolhido na rota com o resultado atual do mês.') +
        '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;min-width:760px;">' +
            '<thead><tr style="background:#FAF8F4;">' +
              ['Indicador', 'Planejado', 'Realizado', 'Diferença', 'Ritmo'].map(function (h) {
                return '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#6F6860;text-transform:uppercase;letter-spacing:.02em;">' + h + '</th>';
              }).join('') +
            '</tr></thead><tbody>' +
              rows.map(function (row) {
                var diff = _num(row.actual) - _num(row.planned);
                var good = row.inverse ? diff <= 0 : diff >= 0;
                var pct = row.planned ? (_num(row.actual) / Math.abs(_num(row.planned))) * 100 : 0;
                return '<tr style="border-top:1px solid #EAE4DA;">' +
                  '<td style="padding:12px 14px;font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(row.label) + '</td>' +
                  '<td style="padding:12px 14px;font-size:13px;color:#1F1F1F;white-space:nowrap;">' + _fmtMoney(row.planned) + '</td>' +
                  '<td style="padding:12px 14px;font-size:13px;color:#1F1F1F;white-space:nowrap;">' + _fmtMoney(row.actual) + '</td>' +
                  '<td style="padding:12px 14px;font-size:13px;font-weight:700;color:' + (good ? '#1F6F43' : '#B42318') + ';white-space:nowrap;">' + (diff >= 0 ? '+' : '-') + _fmtMoney(Math.abs(diff)) + '</td>' +
                  '<td style="padding:12px 14px;font-size:13px;font-weight:600;color:#1F1F1F;">' + (row.planned ? pct.toFixed(1) + '%' : '—') + '</td>' +
                '</tr>';
              }).join('') +
            '</tbody></table>' +
        '</div>' +
      '</section>';
  }

  function _routePracticalCard(vm) {
    var messages = _routeMessages(vm);
    return '' +
      '<section class="perf-panel perf-panel-practical" style="' + _cardStyle() + '">' +
        _sectionTitle('O que olhar agora', 'Alguns sinais do mês para ajudar você a decidir o próximo passo sem procurar número por número.') +
        '<div class="perf-practical-grid">' +
          messages.map(function (msg) {
            return '<div class="perf-practical-item"><span class="mi" style="color:' + _esc(msg.color) + ';">' + _esc(msg.icon) + '</span><div>' + _esc(msg.text) + '</div></div>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function _routeMini(label, value, color) {
    return '<div class="perf-route-mini"><span>' + _esc(label) + '</span><strong style="color:' + _esc(color || '#1F1F1F') + ';">' + _esc(value) + '</strong></div>';
  }

  function _routeStatusInfo(vm) {
    var monthRevenue = _monthRevenue(vm);
    if (!vm.targetRevenue) {
      return { title: 'Ainda falta escolher a rota do mês', text: 'Crie uma rota no Plano de Voo para acompanhar o mês com mais clareza e ver se o negócio está indo na direção que você escolheu.', color: '#B45309', bg: '#FFF7ED', border: '#FED7AA', icon: 'info' };
    }
    var pct = vm.expectedNow > 0 ? (monthRevenue / vm.expectedNow) * 100 : 0;
    var diff = monthRevenue - vm.expectedNow;
    if (_isMonthStarting(vm) && pct < 92) {
      return { title: 'O mês está só começando', text: 'Ainda estamos nos primeiros dias. Agora é hora de observar quais produtos começam a sair, por onde chegam os pedidos e como o caixa começa a se movimentar.', color: '#6C8777', bg: '#F4F7F2', border: '#DCE6DA', icon: 'schedule' };
    }
    if (pct >= 115) return { title: 'Seu mês começou mais forte que o esperado', text: 'As vendas já estão ' + _fmtMoney(Math.abs(diff)) + ' acima do que estava previsto para hoje. Vale entender o que está puxando esse resultado para repetir nos próximos dias.', color: '#2563EB', bg: '#EEF4FF', border: '#D6E6FF', icon: 'north_east' };
    if (pct >= 92) return { title: 'Seu mês está caminhando bem', text: 'As vendas estão perto do caminho escolhido. Continue cuidando dos produtos que mais saem, do ticket médio e dos custos para manter essa direção.', color: '#1F6F43', bg: '#F0FAF4', border: '#D9F2E3', icon: 'check_circle' };
    if (pct >= 75) return { title: 'Seu mês pede um pouco mais de atenção', text: 'As vendas estão ' + _fmtMoney(Math.abs(diff)) + ' abaixo do ritmo esperado para hoje. Ainda há tempo para ajustar produtos, canais ou horários.', color: '#B45309', bg: '#FFF7ED', border: '#FED7AA', icon: 'warning' };
    return { title: 'Seu mês precisa de uma reação', text: 'As vendas estão ' + _fmtMoney(Math.abs(diff)) + ' abaixo do caminho escolhido para hoje. O melhor agora é escolher uma ação simples em Temporadas para trazer pedidos com mais foco.', color: '#B42318', bg: '#FFF0EE', border: '#F3C7C1', icon: 'priority_high' };
  }

  function _routeMessages(vm) {
    var status = _routeStatusInfo(vm);
    var monthRevenue = _monthRevenue(vm);
    var remaining = Math.max(0, _num(vm.targetRevenue) - monthRevenue);
    var ticket = _monthTicket(vm);
    var needed = ticket > 0 && remaining > 0 ? Math.max(1, Math.ceil((remaining / ticket) / Math.max(1, vm.daysLeftMonth || 1))) : 0;
    var out = [{ icon: status.icon, color: status.color, text: status.text }];
    if (!vm.targetRevenue) {
      out.push(_ticketComparisonMessage(vm));
      out.push(_channelSignalMessage(vm));
      return out;
    }
    if (_isMonthStarting(vm)) {
      out.push(_ticketComparisonMessage(vm));
      out.push(_channelSignalMessage(vm));
      return out;
    }
    out.push(remaining > 0
      ? { icon: 'shopping_bag', color: '#8A6F5A', text: 'Para chegar na meta do mês, ainda faltam ' + _fmtMoney(remaining) + '. Com o ticket médio atual de ' + (ticket > 0 ? _fmtMoney(ticket) : 'sem base') + ', isso pede cerca de ' + needed + ' pedidos por dia daqui pra frente.' }
      : { icon: 'celebration', color: '#1F6F43', text: 'A meta de venda do mês já foi alcançada. Agora vale observar se os custos seguem dentro do esperado.' });
    out.push(_ticketComparisonMessage(vm));
    out.push(_num(vm.paceProjection) < _num(vm.targetRevenue)
      ? { icon: 'schedule', color: '#B45309', text: 'Mantendo o ritmo atual, o mês pode terminar em ' + _fmtMoney(vm.paceProjection) + '. A rota do mês é ' + _fmtMoney(vm.targetRevenue) + ', então ficaria ' + _fmtMoney(Math.abs(_num(vm.targetRevenue) - _num(vm.paceProjection))) + ' abaixo do planejado.' }
      : { icon: 'trending_up', color: '#2563EB', text: 'Mantendo o ritmo atual, o mês pode terminar em ' + _fmtMoney(vm.paceProjection) + '. A rota do mês é ' + _fmtMoney(vm.targetRevenue) + ', então ficaria ' + _fmtMoney(Math.abs(_num(vm.paceProjection) - _num(vm.targetRevenue))) + ' acima do planejado.' });
    return out;
  }

  function _ticketComparisonMessage(vm) {
    var current = _monthTicket(vm);
    var planned = _num(vm && vm.targetAverageTicket);
    if (current > 0 && planned > 0) {
      var diff = current - planned;
      return {
        icon: diff >= 0 ? 'local_activity' : 'sell',
        color: diff >= 0 ? '#1F6F43' : '#B45309',
        text: 'O ticket médio atual está em ' + _fmtMoney(current) + '. Na rota, você planejou perto de ' + _fmtMoney(planned) + ', então cada pedido está vindo ' + _fmtMoney(Math.abs(diff)) + (diff >= 0 ? ' acima' : ' abaixo') + ' do planejado.'
      };
    }
    if (current > 0) {
      return { icon: 'local_activity', color: '#8A6F5A', text: 'O ticket médio atual está em ' + _fmtMoney(current) + '. Use esse valor para sentir se os pedidos estão vindo fortes o suficiente para o mês.' };
    }
    if (planned > 0) {
      return { icon: 'local_activity', color: '#8A6F5A', text: 'A rota foi criada com ticket médio perto de ' + _fmtMoney(planned) + '. Assim que os primeiros pedidos entrarem, a Performance compara o valor real com esse plano.' };
    }
    return { icon: 'local_activity', color: '#8A6F5A', text: 'Ainda não há ticket médio suficiente para comparar. Quando os pedidos entrarem, este card mostra se cada venda está vindo mais forte ou mais fraca que o planejado.' };
  }

  function _channelSignalMessage(vm) {
    var channel = vm && vm.bestChannel;
    if (channel && channel.label) {
      return { icon: 'storefront', color: '#6C8777', text: 'O canal que mais respondeu até agora foi ' + channel.label + ', com ' + _fmtMoney(channel.value || 0) + ' em vendas neste período. Use esse sinal para decidir onde vale concentrar a próxima ação.' };
    }
    return { icon: 'storefront', color: '#6C8777', text: 'Ainda não apareceu um canal puxando as vendas. Quando os pedidos entrarem, a Performance mostra qual canal está ajudando mais o mês.' };
  }

  function _isMonthStarting(vm) {
    return !!(vm && vm.targetRevenue && _num(vm.daysElapsedMonth) <= 2);
  }

  function _monthRevenue(vm) {
    return _sum(vm && vm.monthOrders || [], 'value');
  }

  function _monthTicket(vm) {
    var revenue = _monthRevenue(vm);
    var count = (vm && vm.monthOrders || []).length;
    return count && revenue > 0 ? revenue / count : 0;
  }

  function _dailyCard(vm) {
    var rows = vm.dailyRows || [];
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
          _sectionTitle('Linha do tempo diária', 'Veja vendas, entradas, saídas e a meta diária ajustada pela realidade da rota.') +
          _chip(vm.periodLabel) +
        '</div>' +
        (rows.length ? '' +
          '<div style="overflow-x:auto;">' +
            '<table style="width:100%;border-collapse:collapse;min-width:1080px;">' +
              '<thead><tr style="background:#FAF8F4;">' +
                ['Data', 'Vendas', 'Entradas', 'Saídas', 'Acumulado', 'Meta do dia', 'Meta recalculada', 'Saldo do dia'].map(function (h) {
                  return '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#6F6860;text-transform:uppercase;letter-spacing:.02em;">' + h + '</th>';
                }).join('') +
              '</tr></thead>' +
              '<tbody>' +
                rows.map(function (row) {
                  var tone = row.delta >= 0 ? '#1F6F43' : '#B42318';
                  var barPct = row.targetDaily ? Math.min(100, (row.sales / row.targetDaily) * 100) : 0;
                  return '' +
                    '<tr style="border-top:1px solid #EAE4DA;transition:background .15s ease;" onmouseenter="this.style.background=\'#FAF8F4\'" onmouseleave="this.style.background=\'transparent\'">' +
                      '<td style="padding:12px 14px;font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(row.labelDate) + '</td>' +
                      '<td style="padding:12px 14px;font-size:13px;">' +
                        '<div style="display:flex;flex-direction:column;gap:5px;min-width:120px;">' +
                          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><span style="font-weight:700;color:#1F1F1F;">' + _fmtMoney(row.sales) + '</span><span style="font-size:11px;color:#6F6860;">' + (row.salesPct ? row.salesPct.toFixed(1) + '%' : '0%') + '</span></div>' +
                          '<div style="height:6px;background:#EAE4DA;border-radius:999px;overflow:hidden;"><span style="display:block;height:100%;width:' + barPct.toFixed(1) + '%;background:' + tone + ';border-radius:999px;"></span></div>' +
                        '</div>' +
                      '</td>' +
                      '<td style="padding:12px 14px;font-size:13px;">' + _fmtMoney(row.entries) + '</td>' +
                      '<td style="padding:12px 14px;font-size:13px;">' + _fmtMoney(row.exits) + '</td>' +
                      '<td style="padding:12px 14px;font-size:13px;font-weight:800;">' + _fmtMoney(row.accumSales) + '</td>' +
                      '<td style="padding:12px 14px;font-size:13px;">' + _fmtMoney(row.targetDaily) + '</td>' +
                      '<td style="padding:12px 14px;font-size:13px;">' + _fmtMoney(row.needPerDay) + '</td>' +
                      '<td style="padding:12px 14px;font-size:13px;font-weight:800;color:' + tone + ';">' + _fmtMoney(row.balanceDay) + '</td>' +
                    '</tr>';
                }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>'
          : _emptyState('Sem dados para este período', 'Escolha outro intervalo para ver a linha do tempo.')) +
      '</section>';
  }

  function _channelsCard(vm) {
    var rows = vm.channelBreakdown || [];
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
          _sectionTitle('Vendas por canal', 'Veja por onde as vendas estão chegando no período selecionado.') +
          _chip('Canal filtrado: ' + _channelLabel(_state.channel, vm.channels)) +
        '</div>' +
        (rows.length ? _barList(rows, '#6C8777', function (row) {
          return _fmtMoney(row.value);
        }) : _emptyState('Sem vendas para os canais deste período', 'No intervalo selecionado não houve pedidos suficientes.')) +
      '</section>';
  }

  function _financeCard(vm) {
    var totalEntries = vm.actualEntries;
    var totalExits = vm.actualExits;
    var pendingReceivables = vm.pendingReceivables;
    var pendingPayables = vm.pendingPayables;
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
          _sectionTitle('Entradas e saídas', 'Veja o que entrou, o que saiu e o que ainda está pendente no caixa.') +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#EDFAF3;color:#1F6F43;font-size:12px;font-weight:700;">Entradas ' + _fmtMoney(totalEntries) + '</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FFF0EE;color:#B42318;font-size:12px;font-weight:700;">Saídas ' + _fmtMoney(totalExits) + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:14px;">' +
          _miniMetric('A receber', _fmtMoney(pendingReceivables), '#6C8777') +
          _miniMetric('Contas a pagar', _fmtMoney(pendingPayables), '#B45309') +
          _miniMetric('Saldo líquido', _fmtMoney(vm.netCash), vm.netCash >= 0 ? '#1F6F43' : '#B42318') +
          _miniMetric('Margem operacional', vm.marginPct.toFixed(1) + '%', vm.marginPct >= _data.money.desiredMarginPct ? '#1F6F43' : (vm.marginPct >= _data.money.minMarginPct ? '#B45309' : '#B42318')) +
        '</div>' +
        _pendingPayablesList(vm.pendingPayableRows) +
        '<div style="font-size:12px;color:#6F6860;line-height:1.5;">' +
          'O caixa do período ficou ' + (vm.netCash >= 0 ? 'positivo' : 'negativo') + '. ' +
          (vm.marginPct >= _data.money.desiredMarginPct ? 'Margem acima do desejado.' : (vm.marginPct >= _data.money.minMarginPct ? 'Margem perto do mínimo.' : 'Margem abaixo do mínimo.')) +
        '</div>' +
      '</section>';
  }

  function _pendingPayablesList(rows) {
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) return '';
    return '' +
      '<div style="border:1px solid #F0E3D5;background:#FFFCF8;border-radius:14px;padding:12px;margin:0 0 14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;flex-wrap:wrap;">' +
          '<strong style="font-size:13px;color:#1F1F1F;">Próximas contas a pagar</strong>' +
          '<span style="font-size:11px;color:#8A6F5A;font-weight:700;">Até 5 vencimentos do período</span>' +
        '</div>' +
        rows.map(function (row) {
          var color = row.status === 'vencido' ? '#B42318' : (row.status === 'parcial' ? '#B45309' : '#6C8777');
          var amount = row.status === 'parcial' ? row.pendingValue : row.valueRow;
          return '' +
            '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #F1E6DD;">' +
              '<div style="min-width:0;">' +
                '<div style="font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(row.description || 'Conta a pagar') + '</div>' +
                '<div style="font-size:11.5px;color:#6F6860;margin-top:2px;">' + _esc(row.labelDate) + ' · ' + _esc(row.category || 'Sem categoria') + ' · ' + _esc(_cashStatusLabel(row.status)) + '</div>' +
              '</div>' +
              '<strong style="font-size:13px;color:' + color + ';white-space:nowrap;">' + _fmtMoney(amount) + '</strong>' +
            '</div>';
        }).join('') +
      '</div>';
  }

  function _categoriesCard(vm) {
    var rows = vm.entryOrigins || vm.entryCategories || [];
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
          _sectionTitle('De onde veio o dinheiro', 'Veja quais origens trouxeram entrada para o negócio neste período.') +
        '</div>' +
        (rows.length ? _barList(rows, '#1F6F43', function (row) {
          return _fmtMoney(row.value);
        }) : _emptyState('Ainda não há entradas para mostrar', 'Quando entrar dinheiro no período, ele aparece aqui agrupado pela origem.')) +
      '</section>';
  }

  function _expensePlanCard(vm) {
    var rows = vm.expensePlanRows || [];
    var monthScenario = vm.monthScenario || null;
    var scenarioLabel = monthScenario ? (monthScenario.snapshotName || monthScenario.name || 'Rota ativa') : 'Sem rota ativa';
    var scenarioMonth = _scenarioMonthLabel(vm);
    return '' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
          _sectionTitle('Gastos previstos da rota', 'Veja quanto a rota reservou para cada bloco de gasto e quanto já virou saída real.') +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
            _chip(scenarioMonth) +
            _chip(scenarioLabel) +
          '</div>' +
        '</div>' +
        (rows.length ? '' +
          '<div style="overflow-x:auto;">' +
            '<table style="width:100%;border-collapse:collapse;min-width:960px;">' +
              '<thead><tr style="background:#FAF8F4;">' +
                ['Bloco', 'Previsto', 'Realizado', 'Ainda previsto', 'Leitura'].map(function (h) {
                  return '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#6F6860;text-transform:uppercase;letter-spacing:.02em;">' + h + '</th>';
                }).join('') +
              '</tr></thead>' +
              '<tbody>' +
                rows.map(function (row) {
                  var remaining = Math.max(0, row.planned - row.actual);
                  var over = Math.max(0, row.actual - row.planned);
                  var tone = over > 0 ? '#B42318' : row.actual > 0 ? '#1F6F43' : '#B45309';
                  var tag = over > 0 ? 'Passou do previsto' : row.actual > 0 ? 'Já começou a acontecer' : 'Ainda previsto';
                  var tagBg = over > 0 ? '#FFF0EE' : row.actual > 0 ? '#EDFAF3' : '#FFF7ED';
                  var tagColor = tone;
                  return '' +
                    '<tr style="border-top:1px solid #EAE4DA;transition:background .15s ease;" onmouseenter="this.style.background=\'#FAF8F4\'" onmouseleave="this.style.background=\'transparent\'">' +
                      '<td style="padding:13px 14px;vertical-align:top;">' +
                        '<div style="font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(row.label || 'Bloco da rota') + '</div>' +
                        '<div style="font-size:12px;color:#6F6860;margin-top:3px;">' + _esc(row.note || 'Previsto na rota e acompanhado pelo financeiro') + '</div>' +
                      '</td>' +
                      '<td style="padding:13px 14px;vertical-align:top;font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;">' + _fmtMoney(row.planned) + '</td>' +
                      '<td style="padding:13px 14px;vertical-align:top;font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;">' + _fmtMoney(row.actual) + '</td>' +
                      '<td style="padding:13px 14px;vertical-align:top;font-size:13px;font-weight:700;color:' + (over > 0 ? '#B42318' : '#1F6F43') + ';white-space:nowrap;">' + (over > 0 ? '+' + _fmtMoney(over) : _fmtMoney(remaining)) + '</td>' +
                      '<td style="padding:13px 14px;vertical-align:top;">' +
                        '<div style="display:flex;flex-direction:column;gap:6px;">' +
                          _expenseMiniGraph(row) +
                          '<div style="display:inline-flex;align-items:center;gap:6px;width:max-content;padding:5px 8px;border-radius:999px;background:' + tagBg + ';color:' + tagColor + ';font-size:11px;font-weight:700;">' + tag + '</div>' +
                        '</div>' +
                      '</td>' +
                    '</tr>' +
                    '<tr style="border-top:0;">' +
                      '<td colspan="5" style="padding:0 14px 13px;">' + _expenseDetails(row) + '</td>' +
                    '</tr>';
                }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>'
          : _emptyState('Ainda não há gastos previstos para comparar', 'Crie uma rota no Plano de Voo para acompanhar quanto foi reservado e quanto já virou saída real.')) +
      '</section>';
  }

  function _expenseDetails(row) {
    row = row || {};
    var planned = row.plannedItems || [];
    var actual = row.actualItems || [];
    if (!planned.length && !actual.length) return '';
    return '' +
      '<details style="background:#FFFCF8;border:1px solid #EAE4DA;border-radius:12px;padding:10px 12px;">' +
        '<summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;font-weight:800;color:#6F6860;">' +
          '<span>Ver detalhes do bloco</span><span class="mi" style="font-size:17px;color:#8A7E7C;">expand_more</span>' +
        '</summary>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:10px;">' +
          _expenseDetailColumn('Previsto na rota', planned, 'Ainda não há detalhe previsto para este bloco.') +
          _expenseDetailColumn('Realizado no financeiro', actual, 'Ainda não houve saída real neste bloco.') +
        '</div>' +
      '</details>';
  }

  function _expenseDetailColumn(title, items, emptyText) {
    items = (items || []).filter(Boolean);
    return '' +
      '<div style="min-width:0;">' +
        '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#8A7E7C;margin-bottom:7px;">' + _esc(title) + '</div>' +
        (items.length ? '<div style="display:flex;flex-direction:column;gap:6px;">' + items.slice(0, 8).map(function (item) {
          return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;background:#fff;border:1px solid #F0E7E2;border-radius:10px;padding:8px 9px;">' +
            '<div style="min-width:0;"><div style="font-size:12px;font-weight:700;color:#1F1F1F;line-height:1.25;">' + _esc(item.name || 'Item') + '</div>' +
            (item.note ? '<div style="font-size:11px;color:#8A7E7C;line-height:1.3;margin-top:2px;">' + _esc(item.note) + '</div>' : '') + '</div>' +
            '<div style="font-size:12px;font-weight:800;color:#1F1F1F;white-space:nowrap;">' + _fmtMoney(item.value) + '</div>' +
          '</div>';
        }).join('') + (items.length > 8 ? '<div style="font-size:11px;color:#8A7E7C;padding:2px 1px;">+' + (items.length - 8) + ' item(ns) neste bloco.</div>' : '') + '</div>' : '<div style="font-size:12px;color:#8A7E7C;background:#fff;border:1px dashed #E4D8D0;border-radius:10px;padding:9px;">' + _esc(emptyText) + '</div>') +
      '</div>';
  }

  function _barList(rows, color, valueFormatter) {
    var max = rows.reduce(function (m, row) { return Math.max(m, row.value || 0); }, 0) || 1;
    return '<div class="perf-bar-list">' + rows.map(function (row) {
      var pct = Math.max(4, ((row.value || 0) / max) * 100);
      return '' +
        '<div class="perf-bar-row">' +
          '<div class="perf-bar-copy">' +
            '<strong>' + _esc(row.label || '—') + '</strong>' +
            '<span>' + _esc(row.note || '') + '</span>' +
          '</div>' +
          '<div class="perf-bar-track-wrap">' +
            '<div class="perf-bar-track"><span style="width:' + pct.toFixed(1) + '%;background:' + color + ';"></span></div>' +
            '<div class="perf-bar-pct">' + pct.toFixed(0) + '%</div>' +
          '</div>' +
          '<div class="perf-bar-value" style="color:' + color + ';">' + _esc(valueFormatter(row)) + '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function _miniMetric(label, value, tone) {
    return '' +
      '<div class="perf-mini-metric">' +
        '<span>' + _esc(label) + '</span>' +
        '<strong style="color:' + tone + ';">' + _esc(value) + '</strong>' +
      '</div>';
  }

  function _emptyState(title, subtitle) {
    return '' +
      '<div class="perf-empty-state">' +
        '<div class="perf-empty-icon"><span class="mi">insights</span></div>' +
        '<strong>' + _esc(title || 'Sem dados') + '</strong>' +
        '<p>' + _esc(subtitle || '') + '</p>' +
      '</div>';
  }

  function _heroMetric(label, value, sub, icon, color) {
    return '' +
      '<div class="perf-hero-metric" style="--perf-metric-color:' + _esc(color || '#8A6F5A') + ';">' +
        '<div class="perf-metric-icon"><span class="mi">' + _esc(icon || 'monitoring') + '</span></div>' +
        '<div class="perf-metric-copy">' +
          '<span>' + _esc(label) + '</span>' +
          '<strong>' + _esc(value) + '</strong>' +
          '<small>' + _esc(sub || '') + '</small>' +
        '</div>' +
      '</div>';
  }

  function _supportMetric(label, value, sub, icon, color) {
    return '' +
      '<div class="perf-support-metric" style="--perf-metric-color:' + _esc(color || '#6F6860') + ';">' +
        '<div class="perf-support-icon"><span class="mi">' + _esc(icon || 'insights') + '</span></div>' +
        '<div class="perf-support-copy">' +
          '<span>' + _esc(label) + '</span>' +
          '<strong>' + _esc(value) + '</strong>' +
          '<small>' + _esc(sub || '') + '</small>' +
        '</div>' +
      '</div>';
  }

  function _cardStyle() {
    return 'background:#fff;border:1px solid #EAE4DA;border-radius:20px;padding:20px;box-shadow:0 18px 44px rgba(31,31,31,.065);';
  }

  function _inputStyle() {
    return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;';
  }

  function _labelStyle() {
    return 'font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;';
  }

  function _chip(text) {
    return '<span class="perf-chip">' + _esc(text) + '</span>';
  }

  function _sectionTitle(title, desc) {
    return '<div class="perf-section-title"><h3>' + _esc(title) + '</h3><p>' + _esc(desc || '') + '</p></div>';
  }

  function _channelOptions(orders) {
    var channels = {};
    var allowed = _configuredChannelMap();
    (orders || []).forEach(function (o) {
      var key = _normalizeChannelKey(o.channel || o.source || '');
      if (allowed && !allowed[key]) return;
      if (!channels[key]) channels[key] = { key: key, label: _channelDisplay(key), count: 0, revenue: 0 };
      channels[key].count += 1;
      channels[key].revenue += _num(o.finalSubtotal != null ? o.finalSubtotal : o.total != null ? o.total : o.subtotal);
    });
    var list = Object.keys(channels).map(function (k) { return channels[k]; });
    list.sort(function (a, b) { return b.revenue - a.revenue; });
    return [{ key: 'all', label: 'Todos', count: (orders || []).length, revenue: _sum(orders || [], 'value') }].concat(list);
  }

  function _channelBreakdown(orders) {
    var map = {};
    var allowed = _configuredChannelMap();
    (orders || []).forEach(function (o) {
      var key = _normalizeChannelKey(o.channel || o.source || '');
      if (allowed && !allowed[key]) return;
      if (!map[key]) map[key] = { key: key, label: _channelDisplay(key), value: 0, count: 0 };
      map[key].value += _num(o.value || o.total || o.finalSubtotal || o.subtotal);
      map[key].count += 1;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; }).map(function (row) {
      row.note = row.count + ' pedido(s)';
      return row;
    });
  }

  function _categoryBreakdown(rows, kind) {
    var map = {};
    (rows || []).forEach(function (r) {
      var amount = _cashFlowAmount(r);
      if (amount <= 0) return;
      var key = _normalizeCategoryName(r.category || r.categoria || r.cat || r.type || '');
      if (!map[key]) map[key] = { key: key, label: key, value: 0, count: 0, note: '' };
      map[key].value += amount;
      map[key].count += 1;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 8).map(function (row) {
      row.note = row.count + ' lançamento(s)';
      return row;
    });
  }

  function _entryOriginBreakdown(rows) {
    var map = {};
    (rows || []).forEach(function (r) {
      var amount = _cashFlowAmount(r);
      if (amount <= 0) return;
      var raw = r.category || r.categoria || r.cat || r.channel || r.canal || r.source || r.type || '';
      var key = _normalizeCategoryName(raw);
      if (!map[key]) map[key] = { key: key, label: key, value: 0, count: 0, note: '' };
      map[key].value += amount;
      map[key].count += 1;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 8).map(function (row) {
      row.note = row.count === 1 ? '1 entrada' : row.count + ' entradas';
      return row;
    });
  }

  function _cashFlowAmount(row) {
    if (!row) return 0;
    if (row.kind === 'entrada' || row.kind === 'saida') {
      return _num(row.effectiveValue);
    }
    if (row.valueRow != null) return _num(row.valueRow);
    return _num(row.value);
  }

  function _expensePlanRows(actualExits) {
    var snapshot = _monthScenarioSnapshot() || {};
    var plannedMonthRevenue = _expensePlanMonthRevenue(snapshot);
    var map = {};

    function ensure(key, label, note) {
      if (!key) return null;
      if (!map[key]) {
        map[key] = {
          key: key,
          label: label || key,
          planned: 0,
          actual: 0,
          note: note || 'Previsto na rota e acompanhado pelo financeiro',
          plannedItems: [],
          actualItems: []
        };
      }
      return map[key];
    }

    (Array.isArray(snapshot.variableCosts) ? snapshot.variableCosts : []).forEach(function (r) {
      if (!r || r.include === false) return;
      var group = _plannedVariableExpenseGroup(r);
      var planned = plannedMonthRevenue > 0 ? plannedMonthRevenue * (_num(r.pct) / 100) : _num(r.projectedMonthly != null ? r.projectedMonthly : r.projected);
      var row = ensure(group.key, group.label, group.note);
      if (!row) return;
      row.planned += planned;
      row.plannedItems.push({
        name: r.name || group.label,
        value: planned,
        note: r.sourceLabel || (r.pct != null ? _fmtPct(_num(r.pct)) + ' da venda prevista do mês' : '')
      });
    });

    (Array.isArray(snapshot.fixedExpenses) ? snapshot.fixedExpenses : []).forEach(function (r) {
      if (!r || r.include === false) return;
      var source = String(r.source || '').toLowerCase();
      if (source && source !== 'historical' && source !== 'payable' && source !== 'outflow' && source !== 'financeiro_saida' && source !== 'financeiro_saidas') return;
      var group = _financialGlobalGroup(r);
      var planned = _num(r.projectedMonthly != null ? r.projectedMonthly : r.projected != null ? r.projected : r.value);
      var row = ensure(group.key, group.label, group.note);
      if (!row) return;
      row.planned += planned;
      row.plannedItems.push({
        name: r.name || group.label,
        value: planned,
        note: r.sourceLabel || r.recurrenceLabel || ''
      });
    });

    (actualExits || []).forEach(function (r) {
      var amount = _cashFlowAmount(r);
      if (amount <= 0) return;
      var group = _financialGlobalGroup(r);
      var row = ensure(group.key, group.label, group.note);
      if (!row) return;
      row.actual += amount;
      row.actualItems.push({
        name: r.description || r.category || group.label,
        value: amount,
        note: [r.labelDate, _cashStatusLabel(r.status)].filter(Boolean).join(' · ')
      });
    });

    return Object.keys(map).map(function (key) {
      var row = map[key];
      row.diff = row.actual - row.planned;
      row.base = Math.max(row.planned, row.actual, 1);
      row.planPct = Math.min(100, (row.planned / row.base) * 100);
      row.actualPct = Math.min(100, (row.actual / row.base) * 100);
      return row;
    }).sort(function (a, b) {
      return Math.abs(b.diff) - Math.abs(a.diff) || b.planned - a.planned;
    });
  }

  function _expensePlanMonthRevenue(snapshot) {
    snapshot = snapshot || {};
    var monthKey = _state.scenarioMonthKey || _currentMonthKey();
    var parts = String(monthKey || '').split('-');
    var monthIndex = parts.length > 1 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
    var month = (Array.isArray(snapshot.monthSeries) ? snapshot.monthSeries : []).find(function (m) {
      return m && _num(m.monthIndex) === monthIndex;
    });
    if (month && _num(month.revenue) > 0) return _num(month.revenue);
    var total = _num((snapshot.summary || {}).revenue || snapshot.revenueTotal || snapshot.revenue);
    var count = Math.max(1, (Array.isArray(snapshot.monthSeries) ? snapshot.monthSeries.length : 0) || 1);
    return total > 0 ? total / count : 0;
  }

  function _plannedVariableExpenseGroup(row) {
    var key = String(row && row.key || '');
    if (key === 'products') {
      return { key: 'custos-diretos', label: 'Custos diretos', note: 'Produtos, ingredientes, embalagens e itens previstos para vender.' };
    }
    if (key === 'tax') {
      return { key: 'reserva-fiscal', label: 'Reserva fiscal', note: 'Valor reservado para impostos conforme a rota.' };
    }
    return { key: 'custos-variaveis', label: 'Custos variáveis', note: 'Taxas, comissões, marketing, perdas e outros gastos que crescem com as vendas.' };
  }

  function _financialGlobalGroup(row) {
    var meta = _financialCategoryMeta(row);
    var nature = meta.nature || _normalizeFinancialNature(row && row.raw || row);
    var costClass = meta.costClass || _normalizeCostClass(row && row.raw || row);
    if (nature === 'custo' && costClass === 'direto') return { key: 'custos-diretos', label: 'Custos diretos', note: 'Custos ligados diretamente ao que é produzido ou vendido.' };
    if (nature === 'custo') return { key: 'custos-indiretos', label: 'Custos indiretos', note: 'Custos de apoio para manter a operação funcionando.' };
    if (costClass === 'direto') return { key: 'despesas-diretas', label: 'Despesas diretas', note: 'Despesas ligadas diretamente à venda ou entrega.' };
    return { key: 'despesas-indiretas', label: 'Despesas indiretas', note: 'Contas e compromissos gerais do negócio.' };
  }

  function _financialCategoryMeta(row) {
    row = row || {};
    var raw = row.raw || row;
    var rawKey = _normalizeCategoryKey(
      row.categoryId || row.categoriaFinanceiraId || row.categoriaId ||
      raw.categoriaFinanceiraId || raw.categoria_id || raw.categoriaId || raw.categoryId ||
      row.category || raw.categoriaFinanceiraNome || raw.categoria || raw.categoryName || raw.category || ''
    );
    var found = (_data.categories || []).find(function (cat) {
      var keys = [cat.id, cat.slug, cat.name, cat.nome, cat.label].map(_normalizeCategoryKey);
      return keys.indexOf(rawKey) >= 0;
    }) || null;
    return {
      category: found,
      nature: found ? _normalizeFinancialNature(found) : '',
      costClass: found ? _normalizeCostClass(found) : ''
    };
  }

  function _normalizeCategoryKey(v) {
    return _normalizeText(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function _normalizeFinancialNature(item) {
    var v = _normalizeText(item && (item.financialNature || item.naturezaFinanceira || item.nature || item.tipoFinanceiro || item.kind));
    if (v === 'custo' || v === 'cost') return 'custo';
    if (v === 'despesa' || v === 'expense') return 'despesa';
    if (item && item.tipoSaida === 'Custo Produção') return 'custo';
    return '';
  }

  function _normalizeCostClass(item) {
    var v = _normalizeText(item && (item.costClass || item.classeCusto || item.classificacaoCusto || item.tipoCusto));
    if (v === 'direto' || v === 'direct') return 'direto';
    if (v === 'indireto' || v === 'indirect') return 'indireto';
    if (item && item.tipoSaida === 'Custo Produção') return 'direto';
    return '';
  }

  function _expenseMiniGraph(row) {
    var planned = _num(row.planned);
    var actual = _num(row.actual);
    var diff = _num(row.diff);
    var tone = diff > 0 ? '#B42318' : diff < 0 ? '#B45309' : '#1F6F43';
    var base = Math.max(planned, actual, 1);
    var plannedPct = Math.min(100, (planned / base) * 100);
    var actualPct = Math.min(100, (actual / base) * 100);
    var label = diff > 0 ? 'Passou ' + _fmtMoney(diff) : diff < 0 ? 'Faltou ' + _fmtMoney(Math.abs(diff)) : 'No alvo';
    return '' +
      '<div style="display:flex;flex-direction:column;gap:6px;min-width:170px;">' +
        '<div style="position:relative;height:10px;background:#EAE4DA;border-radius:999px;overflow:hidden;">' +
          '<span style="position:absolute;left:0;top:0;bottom:0;width:' + actualPct.toFixed(1) + '%;background:' + tone + ';border-radius:999px;"></span>' +
          '<span style="position:absolute;left:' + plannedPct.toFixed(1) + '%;top:-3px;bottom:-3px;width:2px;background:#1A1A1A;opacity:.35;"></span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:#6F6860;">' +
          '<span>' + label + '</span>' +
          '<span>' + (planned > 0 ? (actual / planned * 100).toFixed(1) + '% do previsto' : (actual > 0 ? 'Sem previsto' : '0%')) + '</span>' +
        '</div>' +
      '</div>';
  }

  function _dailyRows(days, orders, entries, exits, targetRevenue, dailyPlan) {
    var rows = [];
    var cumulative = 0;
    var plan = dailyPlan || _dailyTargetPlan(days, targetRevenue, orders);
    for (var i = 0; i < days.length; i += 1) {
      var day = days[i];
      var key = _dateKey(day);
      var daySales = _sumByDate(orders, key);
      var dayEntries = _sumByDate(entries, key);
      var dayExits = _sumByDate(exits, key);
      cumulative += daySales;
      var planRow = plan.byKey[key] || { target: 0, weight: 0, cumulativeTarget: 0, remainingWeightAfter: 0 };
      var targetDaily = planRow.target || 0;
      var expectedUpTo = planRow.cumulativeTarget || 0;
      var remainingWeight = _num(planRow.remainingWeightAfter);
      var needPerDay = targetRevenue && remainingWeight > 0 ? Math.max(0, targetRevenue - cumulative) / remainingWeight : 0;
      var balanceDay = dayEntries - dayExits;
      rows.push({
        date: day,
        dateKey: key,
        labelDate: UI.fmtDate(day),
        sales: daySales,
        entries: dayEntries,
        exits: dayExits,
        accumSales: cumulative,
        targetDaily: targetDaily,
        expectedUpTo: expectedUpTo,
        needPerDay: needPerDay,
        balanceDay: balanceDay,
        delta: daySales - targetDaily,
        salesPct: targetDaily ? (daySales / targetDaily) * 100 : 0
      });
    }
    return rows;
  }

  function _dailyTargetPlan(days, targetRevenue, orders) {
    days = Array.isArray(days) ? days : [];
    var weights = {};
    var byKey = {};
    var totalWeight = 0;
    var dayWeights = _weekdayRevenueWeights(orders);
    var snap = _monthScenarioSnapshot();
    var workDays = _snapshotWorkDays(snap);
    var unavailable = _snapshotUnavailableDateKeys(snap);

    days.forEach(function (day) {
      var key = _dateKey(day);
      var weight = 1;
      if (workDays && workDays.indexOf(day.getDay()) < 0) weight = 0;
      if (unavailable[key]) weight = 0;
      if (weight > 0) weight = _num(dayWeights[day.getDay()] || 1);
      weights[key] = weight;
      totalWeight += weight;
    });

    if (targetRevenue > 0 && totalWeight <= 0 && days.length) {
      days.forEach(function (day) {
        var key = _dateKey(day);
        weights[key] = 1;
      });
      totalWeight = days.length;
    }

    var cumulativeTarget = 0;
    days.forEach(function (day) {
      var key = _dateKey(day);
      var weight = _num(weights[key]);
      var target = targetRevenue && totalWeight > 0 ? targetRevenue * (weight / totalWeight) : 0;
      cumulativeTarget += target;
      byKey[key] = {
        weight: weight,
        target: target,
        cumulativeTarget: cumulativeTarget,
        remainingWeightAfter: 0
      };
    });

    var remainingWeight = 0;
    for (var i = days.length - 1; i >= 0; i -= 1) {
      var dkey = _dateKey(days[i]);
      if (byKey[dkey]) byKey[dkey].remainingWeightAfter = remainingWeight;
      remainingWeight += _num(weights[dkey]);
    }

    return {
      byKey: byKey,
      totalWeight: totalWeight
    };
  }

  function _plannedTargetUpTo(plan, date) {
    var key = _dateKey(date);
    var row = plan && plan.byKey ? plan.byKey[key] : null;
    if (row) return _num(row.cumulativeTarget);
    var total = 0;
    Object.keys((plan && plan.byKey) || {}).forEach(function (k) {
      if (k <= key) total = Math.max(total, _num(plan.byKey[k].cumulativeTarget));
    });
    return total;
  }

  function _plannedWeightUpTo(plan, date) {
    var key = _dateKey(date);
    return Object.keys((plan && plan.byKey) || {}).reduce(function (sum, k) {
      return k <= key ? sum + _num(plan.byKey[k].weight) : sum;
    }, 0);
  }

  function _plannedWeightAfter(plan, date) {
    var key = _dateKey(date);
    return Object.keys((plan && plan.byKey) || {}).reduce(function (sum, k) {
      return k > key ? sum + _num(plan.byKey[k].weight) : sum;
    }, 0);
  }

  function _plannedTotalWeight(plan) {
    return _num(plan && plan.totalWeight);
  }

  function _snapshotWorkDays(snap) {
    if (!snap || !Array.isArray(snap.workDays) || !snap.workDays.length) return null;
    return snap.workDays.map(function (v) { return _num(v); }).filter(function (v, idx, arr) {
      return v >= 0 && v <= 6 && arr.indexOf(v) === idx;
    });
  }

  function _snapshotUnavailableDateKeys(snap) {
    var map = {};
    var text = String(snap && snap.plannedClosedDays || '').trim();
    if (!text) return map;
    var year = _dateFromAny(snap && snap.periodStart);
    year = year ? year.getFullYear() : new Date().getFullYear();
    var re = /(\d{1,2})\/(\d{1,2})(?:\s*(?:a|até|ate|-)\s*(\d{1,2})\/(\d{1,2}))?/gi;
    var match;
    while ((match = re.exec(text))) {
      var start = new Date(year, parseInt(match[2], 10) - 1, parseInt(match[1], 10));
      var end = match[3] && match[4] ? new Date(year, parseInt(match[4], 10) - 1, parseInt(match[3], 10)) : start;
      if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) continue;
      if (end < start) end = start;
      var cursor = new Date(start);
      while (cursor <= end) {
        map[_dateKey(cursor)] = true;
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }

  function _weekdayRevenueWeights(orders) {
    var totals = {};
    var active = [];
    (orders || []).forEach(function (order) {
      var date = _dateFromTs(_ts(order.createdAt || order.updatedAt || order.date));
      if (!date) return;
      var day = date.getDay();
      totals[day] = _num(totals[day]) + _num(order.value || order.total || order.finalSubtotal || order.subtotal);
    });
    Object.keys(totals).forEach(function (key) {
      if (_num(totals[key]) > 0) active.push(_num(totals[key]));
    });
    if (active.length < 3) return {};
    var avg = active.reduce(function (sum, value) { return sum + value; }, 0) / active.length;
    if (avg <= 0) return {};
    var weights = {};
    Object.keys(totals).forEach(function (key) {
      weights[_num(key)] = Math.max(0.5, Math.min(1.8, _num(totals[key]) / avg));
    });
    return weights;
  }

  function _bestDay(days, orders) {
    var best = { value: 0, label: '' };
    days.forEach(function (day) {
      var key = _dateKey(day);
      var total = _sumByDate(orders, key);
      if (total > best.value) best = { value: total, label: UI.fmtDate(day) };
    });
    return best;
  }

  function _bestChannel(orders) {
    var map = {};
    var allowed = _configuredChannelMap();
    (orders || []).forEach(function (o) {
      var key = _normalizeChannelKey(o.channel || o.source || '');
      if (allowed && !allowed[key]) return;
      if (!map[key]) map[key] = { label: _channelDisplay(key), value: 0 };
      map[key].value += _num(o.value || o.total || o.finalSubtotal || o.subtotal);
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; })[0] || { label: '' };
  }

  function _bestCategory(rows) {
    var map = {};
    (rows || []).forEach(function (r) {
      var amount = _cashFlowAmount(r);
      if (amount <= 0) return;
      var key = _normalizeCategoryName(r.category || r.categoria || r.cat || '');
      if (!map[key]) map[key] = { label: key, value: 0 };
      map[key].value += amount;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.value - a.value; })[0] || { label: '' };
  }

  function _monthScenarioTarget() {
    var snap = _monthScenarioSnapshot();
    var summary = snap && snap.summary ? snap.summary : {};
    var monthIndex = _monthIndexFromKey(_state.scenarioMonthKey || _currentMonthKey());
    var routeIndexes = _snapshotRouteMonthIndexes(snap);
    var isMonthInRoute = !snap || routeIndexes.indexOf(monthIndex) >= 0;
    var monthRow = snap && Array.isArray(snap.monthSeries) ? snap.monthSeries.find(function (m) {
      return _num(m.monthIndex) === monthIndex;
    }) : null;
    var routeRevenue = _num(summary.revenue != null ? summary.revenue : summary.forecastRevenue != null ? summary.forecastRevenue : 0);
    var monthRevenue = monthRow ? _num(monthRow.revenue) : 0;
    var monthWeight = _monthWeightFactorFromSnapshot(snap, monthIndex, monthRow);
    var monthShare = routeRevenue > 0 && monthRevenue > 0 ? monthRevenue / routeRevenue : _monthShareFromSnapshot(snap, monthIndex);
    var routeProfit = _num(summary.profit != null ? summary.profit : 0);
    if (!isMonthInRoute || monthWeight <= 0) {
      monthRevenue = 0;
      monthShare = 0;
    } else {
      if (!monthRevenue && routeRevenue > 0 && monthShare > 0) monthRevenue = routeRevenue * monthShare;
      if (!monthRevenue && routeRevenue > 0) monthRevenue = routeRevenue / Math.max(1, routeIndexes.length || 1);
      if (!monthShare && routeRevenue > 0 && monthRevenue > 0) monthShare = monthRevenue / routeRevenue;
    }
    var effectiveMonthWeight = (!isMonthInRoute || monthWeight <= 0) ? 0 : monthWeight;
    var strength = _monthStrengthInfo(effectiveMonthWeight);
    return {
      revenue: monthRevenue,
      profit: monthShare > 0 ? routeProfit * monthShare : 0,
      cashFinal: _num(summary.cashFinal != null ? summary.cashFinal : 0),
      averageTicket: _num(summary.averageTicket || 0),
      monthFactor: effectiveMonthWeight,
      strengthLabel: strength.label,
      monthLabel: monthRow && monthRow.label ? monthRow.label : _monthLabelFromKey(_state.scenarioMonthKey || _currentMonthKey())
    };
  }

  function _monthShareFromSnapshot(snap, monthIndex) {
    if (!snap) return 0;
    var indexes = _snapshotRouteMonthIndexes(snap);
    if (indexes.indexOf(monthIndex) < 0) return 0;
    var total = indexes.reduce(function (sum, idx) {
      return sum + Math.max(0, _monthWeightFactorFromSnapshot(snap, idx, null));
    }, 0);
    if (total <= 0) return 0;
    return Math.max(0, _monthWeightFactorFromSnapshot(snap, monthIndex, null)) / total;
  }

  function _snapshotRouteMonthIndexes(snap) {
    if (snap && Array.isArray(snap.monthSeries) && snap.monthSeries.length) {
      return snap.monthSeries.map(function (m) { return _num(m.monthIndex); }).filter(function (idx, pos, arr) {
        return idx >= 0 && idx <= 11 && arr.indexOf(idx) === pos;
      });
    }
    var count = Math.max(0, Math.min(12, _num(snap && snap.routeMonthCount)));
    if (count > 0) {
      var current = new Date().getMonth();
      var startIdx = Math.max(0, Math.min(11, current - (count - 1)));
      var byCount = [];
      for (var c = 0; c < count && startIdx + c <= 11; c += 1) byCount.push(startIdx + c);
      if (byCount.indexOf(current) < 0) byCount.push(current);
      return byCount.sort(function (a, b) { return a - b; });
    }
    var start = _dateFromAny(snap && snap.periodStart);
    var end = _dateFromAny(snap && snap.periodEnd);
    if (start && end) {
      var arr = [];
      for (var i = start.getMonth(); i <= end.getMonth(); i += 1) arr.push(i);
      return arr;
    }
    return [new Date().getMonth()];
  }

  function _monthWeightFactorFromSnapshot(snap, monthIndex, monthRow) {
    var idx = Math.max(0, Math.min(11, _num(monthIndex)));
    if (snap && Array.isArray(snap.monthWeights) && snap.monthWeights[idx] != null) return _num(snap.monthWeights[idx]) / 100;
    if (snap && Array.isArray(snap.seasonality) && snap.seasonality[idx] != null) return _num(snap.seasonality[idx]) / 100;
    if (monthRow && monthRow.factor != null) {
      var scenario = _scenarioFactor(snap && snap.scenario);
      return scenario > 0 ? _num(monthRow.factor) / scenario : _num(monthRow.factor);
    }
    return 1;
  }

  function _scenarioFactor(value) {
    var key = _normalizeText(value || '');
    if (key === 'survival') return 0.9;
    if (key === 'growth') return 2;
    if (key === 'expansion') return 3;
    return 1;
  }

  function _monthStrengthInfo(factor) {
    var n = _num(factor);
    var score = n <= 0 ? 0 : Math.max(1, Math.min(10, Math.round(n * 5)));
    if (!score) return { score: 0, label: 'Mês fora da rota' };
    if (score <= 3) return { score: score, label: 'Força do mês ' + score + '/10' };
    if (score <= 6) return { score: score, label: 'Força do mês ' + score + '/10' };
    return { score: score, label: 'Força do mês ' + score + '/10' };
  }

  function _monthIndexFromKey(key) {
    var parts = String(key || '').split('-');
    if (parts.length < 2) return new Date().getMonth();
    var idx = parseInt(parts[1], 10) - 1;
    return Math.max(0, Math.min(11, isFinite(idx) ? idx : new Date().getMonth()));
  }

  function _monthScenarioSnapshot() {
    var m = _data.monthScenario || null;
    if (!m) return null;
    var id = String(m.snapshotId || m.id || '');
    if (!id) return m;
    var found = (_data.snapshots || []).find(function (x) { return String(x.id) === id; });
    return found || m;
  }

  function _scenarioMonthLabel(vm) {
    var m = _data.monthScenario || {};
    return m.monthLabel || _monthLabelFromKey(m.monthKey || _state.scenarioMonthKey || _currentMonthKey());
  }

  function _monthScenarioOptions() {
    var docs = (_data.monthScenarios || []).slice();
    var byMonth = {};
    docs.forEach(function (doc) {
      if (!doc) return;
      var key = String(doc.monthKey || '').trim();
      if (!key) return;
      if (!byMonth[key] || _ts(doc.updatedAt || doc.selectedAt || doc.createdAt) > _ts(byMonth[key].updatedAt || byMonth[key].selectedAt || byMonth[key].createdAt)) {
        byMonth[key] = doc;
      }
    });
    var current = _currentMonthKey();
    if (!byMonth[current]) byMonth[current] = { monthKey: current, monthLabel: _monthLabelFromKey(current) };
    return Object.keys(byMonth).sort().map(function (key) {
      var doc = byMonth[key];
      var label = doc.monthLabel || _monthLabelFromKey(key);
      return '<option value="' + _esc(key) + '"' + (String(_state.scenarioMonthKey || current) === key ? ' selected' : '') + '>' + _esc(label) + '</option>';
    }).join('');
  }

  function _resolveMonthScenario(selectedMonthKey, currentDoc, allDocs, snapshots) {
    var monthKey = String(selectedMonthKey || _currentMonthKey());
    var candidates = [];
    if (currentDoc) candidates.push(currentDoc);
    (Array.isArray(allDocs) ? allDocs : []).forEach(function (doc) {
      if (!doc) return;
      candidates.push(doc);
    });

    var direct = candidates.find(function (doc) {
      return String(doc.monthKey || doc.month || doc.key || '') === monthKey;
    });
    if (direct) return direct;

    var byLabel = candidates.find(function (doc) {
      return String(doc.monthLabel || '').indexOf(monthKey.slice(5)) >= 0;
    });
    if (byLabel) return byLabel;

    var fromSnapshot = _monthScenarioFromSnapshot(monthKey, snapshots);
    if (fromSnapshot) return fromSnapshot;

    var byUpdate = candidates.slice().sort(function (a, b) {
      return _ts(b.updatedAt || b.selectedAt || b.createdAt) - _ts(a.updatedAt || a.selectedAt || a.createdAt);
    })[0];
    return byUpdate || null;
  }

  function _monthScenarioFromSnapshot(monthKey, snapshots) {
    var list = (Array.isArray(snapshots) ? snapshots : _data.snapshots || []).filter(Boolean);
    if (!list.length) return null;
    var selectedKey = String(monthKey || _currentMonthKey());
    var monthDate = _dateFromMonthKey(selectedKey);
    var monthIndex = _monthIndexFromKey(selectedKey);
    var candidates = list.filter(function (snap) {
      if (!snap) return false;
      if (String(snap.targetMonthKey || '') === selectedKey) return true;
      var start = _dateFromAny(snap.periodStart);
      var end = _dateFromAny(snap.periodEnd);
      if (start && end && monthDate && monthDate >= _monthRange(start).start && monthDate <= _monthRange(end).end) return true;
      if (Array.isArray(snap.monthSeries) && snap.monthSeries.some(function (m) { return _num(m.monthIndex) === monthIndex; })) return true;
      return false;
    });
    var snap = (candidates.length ? candidates : list).slice().sort(function (a, b) {
      return _ts(b.updatedAt || b.selectedAt || b.createdAt) - _ts(a.updatedAt || a.selectedAt || a.createdAt);
    })[0];
    if (!snap) return null;
    return {
      monthKey: selectedKey,
      monthLabel: _monthLabelFromKey(selectedKey),
      snapshotId: snap.id || '',
      snapshotName: snap.name || 'Rota ativa',
      scenario: snap.scenario || 'equilibrium',
      summary: snap.summary || {},
      monthSeries: Array.isArray(snap.monthSeries) ? snap.monthSeries : [],
      monthWeights: Array.isArray(snap.monthWeights) ? snap.monthWeights : [],
      seasonality: Array.isArray(snap.seasonality) ? snap.seasonality : [],
      routeMonthCount: snap.routeMonthCount || 0,
      periodStart: snap.periodStart || '',
      periodEnd: snap.periodEnd || '',
      periodType: snap.periodType || 'annual',
      updatedAt: snap.updatedAt || snap.createdAt || '',
      selectedAt: snap.selectedAt || snap.updatedAt || snap.createdAt || '',
      fromSnapshotFallback: true
    };
  }

  function _dateFromMonthKey(key) {
    var parts = String(key || '').split('-');
    if (parts.length < 2) return null;
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    if (!isFinite(year) || !isFinite(month)) return null;
    return new Date(year, Math.max(0, Math.min(11, month)), 1);
  }

  function _ordersInRange(start, end) {
    var channel = _state.channel;
    return (_data.orders || []).filter(function (o) {
      var ts = _ts(o.createdAt || o.updatedAt || o.date);
      if (!ts) return false;
      if (ts < start.getTime() || ts > end.getTime()) return false;
      if (_isCancelledOrder(o)) return false;
      if (channel !== 'all' && _normalizeChannelKey(o.channel || o.source || '') !== channel) return false;
      return true;
    }).map(function (o) {
      return {
        id: String(o.id || ''),
        date: _dateFromTs(_ts(o.createdAt || o.updatedAt || o.date)),
        dateKey: _dateKey(_dateFromTs(_ts(o.createdAt || o.updatedAt || o.date))),
        labelDate: UI.fmtDate(_dateFromTs(_ts(o.createdAt || o.updatedAt || o.date))),
        value: _num(o.finalSubtotal != null ? o.finalSubtotal : o.total != null ? o.total : o.subtotal),
        channel: _normalizeChannelKey(o.channel || o.source || ''),
        channelLabel: _channelDisplay(_normalizeChannelKey(o.channel || o.source || '')),
        status: _normalizeText(o.status || ''),
        customer: _normalizeText(o.customerName || o.customer || ''),
        raw: o
      };
    }).sort(function (a, b) { return b.dateKey.localeCompare(a.dateKey); });
  }

  function _entriesInRange(start, end) {
    return (_data.entries || []).filter(function (r) {
      return r.ts >= start.getTime() && r.ts <= end.getTime();
    });
  }

  function _exitsInRange(start, end) {
    return (_data.exits || []).filter(function (r) {
      return r.ts >= start.getTime() && r.ts <= end.getTime();
    });
  }

  function _previousRange(start, end) {
    var days = _diffDays(start, end) + 1;
    var prevEnd = new Date(start.getTime() - 86400000);
    var prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);
    return { start: prevStart, end: prevEnd };
  }

  function _periodRange() {
    var today = _todayStart();
    if (_state.period === 'custom') {
      var start = _state.start ? new Date(_state.start + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth(), 1);
      var end = _state.end ? new Date(_state.end + 'T23:59:59') : today;
      if (!isFinite(start.getTime())) start = new Date(today.getFullYear(), today.getMonth(), 1);
      if (!isFinite(end.getTime())) end = today;
      return { start: start, end: end, label: 'Personalizado' };
    }

    if (_state.period === 'today') {
      return { start: new Date(today.getTime()), end: _endOfDay(today), label: 'Hoje' };
    }
    if (_state.period === 'yesterday') {
      var y = new Date(today.getTime() - 86400000);
      return { start: new Date(y.getFullYear(), y.getMonth(), y.getDate()), end: _endOfDay(y), label: 'Ontem' };
    }
    if (_state.period === 'last7') {
      var s7 = new Date(today.getTime() - 6 * 86400000);
      return { start: new Date(s7.getFullYear(), s7.getMonth(), s7.getDate()), end: _endOfDay(today), label: 'Últimos 7 dias' };
    }
    if (_state.period === 'last30') {
      var s30 = new Date(today.getTime() - 29 * 86400000);
      return { start: new Date(s30.getFullYear(), s30.getMonth(), s30.getDate()), end: _endOfDay(today), label: 'Últimos 30 dias' };
    }
    if (_state.period === 'lastmonth') {
      var lastStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      var lastEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: lastStart, end: _endOfDay(lastEnd), label: 'Mês passado' };
    }
    var thisStart = new Date(today.getFullYear(), today.getMonth(), 1);
    var thisEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: thisStart, end: _endOfDay(thisEnd), label: 'Este mês' };
  }

  function _monthRange(date) {
    var d = date || new Date();
    var start = new Date(d.getFullYear(), d.getMonth(), 1);
    var end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start: start, end: _endOfDay(end), days: _diffDays(start, end) + 1, label: UI.fmtDate(start) + ' - ' + UI.fmtDate(end) };
  }

  function _rangeDays(start, end) {
    var days = [];
    var cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= last) {
      days.push(new Date(cursor.getTime()));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  function _sum(list, field) {
    return (list || []).reduce(function (s, item) { return s + _num(item[field]); }, 0);
  }

  function _sumByDate(list, key) {
    return (list || []).filter(function (item) { return item.dateKey === key; }).reduce(function (s, item) {
      var useEffective = item && (item.kind === 'entrada' || item.kind === 'saida');
      return s + _num(useEffective ? item.effectiveValue : item.value);
    }, 0);
  }

  function _trendLabel(current, previous, suffix) {
    if (!previous && !current) return 'Sem dados anteriores';
    if (!previous) return 'Sem dados anteriores';
    var pct = ((current - previous) / Math.abs(previous || 1)) * 100;
    return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '% ' + (suffix || 'vs período anterior');
  }

  function _channelLabel(key, options) {
    var opts = options || _stateChannelOptionsFallback();
    var found = opts.find(function (c) { return c.key === key; });
    return found ? found.label : _channelDisplay(key);
  }

  function _stateChannelOptionsFallback() {
    var configured = _configuredChannelOptions();
    if (configured.length) return [{ key: 'all', label: 'Todos' }].concat(configured);
    return [{ key: 'all', label: 'Todos' }];
  }

  function _normalizeConfiguredChannels(cfg) {
    var list = cfg && Array.isArray(cfg.list) ? cfg.list : [];
    var out = [];
    var seen = {};
    list.forEach(function (ch) {
      var name = ch && (ch.name || ch.label || ch.key);
      var key = _normalizeChannelKey(name);
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push({ key: key, label: name || _channelDisplay(key) });
    });
    ['cardapio', 'venda-presencial'].forEach(function (key) {
      if (!seen[key]) {
        seen[key] = true;
        out.unshift({ key: key, label: _channelDisplay(key) });
      }
    });
    return out;
  }

  function _configuredChannelOptions() {
    return Array.isArray(_data.channels) ? _data.channels : [];
  }

  function _configuredChannelMap() {
    var list = _configuredChannelOptions();
    if (!list.length) return null;
    var map = {};
    list.forEach(function (ch) { map[ch.key] = true; });
    return map;
  }

  function _channelDisplay(key) {
    if (!key || key === 'all') return 'Todos';
    if (key === 'cardapio') return 'Cardápio';
    if (key === 'venda-presencial') return 'Venda presencial';
    if (key === 'whatsapp') return 'WhatsApp';
    if (key === 'admin') return 'Admin';
    var configured = _configuredChannelOptions().find(function (ch) { return ch.key === key; });
    return configured ? configured.label : key.replace(/-/g, ' ');
  }

  function _normalizeChannelKey(v) {
    var key = _normalizeText(v || '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!key || key === 'template' || key === 'loja-online' || key === 'loja-publica') return 'cardapio';
    if (key === 'tpv') return 'venda-presencial';
    return key;
  }

  function _normalizeCategoryName(v) {
    var text = _normalizeText(v || '');
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Sem categoria';
  }

  function _normalizeText(v) {
    return String(v == null ? '' : v).trim().toLowerCase();
  }

  function _normalizeCashStatus(item, kind, source, rawStatus, paid, total) {
    var status = _normalizeText(rawStatus || '');
    if (status === 'paga' || status === 'pago' || status === 'ja-pago' || status === 'já pago' || status === 'já paga') return 'pago';
    if (status === 'recebido' || status === 'recebida' || status === 'efetivada') return 'efetivado';
    if (status === 'a pagar' || status === 'pendente' || status === 'aberto' || status === 'em aberto') return 'pendente';
    if (status === 'a receber' || status === 'prevista') return 'previsto';
    if (status === 'parcial' || status === 'parcialmente pago' || status === 'parcialmente recebido') return 'parcial';
    if (status === 'vencida' || status === 'vencido') return 'vencido';
    if (status) return status;

    if (kind === 'entrada') return 'efetivado';

    var dueTs = _ts(item && (item.vencimento || item.dueDate || item.data_vencimento || item.dataVencimento || item.data));
    var isPayable = source === 'contas_pagar' || source === 'financeiro_apagar';
    if (paid > 0 && paid < total) return 'parcial';
    if (paid >= total && total > 0) return 'pago';
    if (item && (item.data_pagamento || item.paidAt)) return 'pago';
    if (isPayable && dueTs && dueTs < _todayStart().getTime()) return 'vencido';
    return isPayable ? 'pendente' : 'pago';
  }

  function _cashStatusLabel(status) {
    status = _normalizeText(status || '');
    if (status === 'pago' || status === 'efetivado') return 'Já pago';
    if (status === 'parcial') return 'Parcial';
    if (status === 'vencido') return 'Vencida';
    if (status === 'previsto') return 'Previsto';
    return 'A pagar';
  }

  function _cashDate(item, kind, status) {
    item = item || {};
    var value = kind === 'saida' && (status === 'pendente' || status === 'vencido' || status === 'parcial')
      ? (item.vencimento || item.dueDate || item.data_vencimento || item.dataVencimento || item.data || item.date || item.createdAt || item.updatedAt)
      : (item.data_pagamento || item.paidAt || item.data_recebimento || item.receivedAt || item.date || item.data || item.vencimento || item.dueDate || item.createdAt || item.updatedAt);
    return _dateFromTs(_ts(value));
  }

  function _isCancelledOrder(o) {
    var status = _normalizeText(o && o.status);
    return status === 'cancelado' || status === 'canceled' || status === 'rejected' || status === 'rejeitado';
  }

  function _ts(v) {
    if (!v) return 0;
    try {
      if (typeof v.toDate === 'function') return v.toDate().getTime();
      var d = new Date(v);
      return isFinite(d.getTime()) ? d.getTime() : 0;
    } catch (e) {
      return 0;
    }
  }

  function _dateFromTs(ts) {
    if (!ts) return null;
    var d = new Date(ts);
    return isFinite(d.getTime()) ? d : null;
  }

  function _dateFromAny(value) {
    if (!value) return null;
    if (value instanceof Date) return isFinite(value.getTime()) ? value : null;
    if (typeof value.toDate === 'function') return value.toDate();
    return _dateFromTs(_ts(value));
  }

  function _dateKey(date) {
    var d = date instanceof Date ? date : _dateFromTs(_ts(date));
    if (!d) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _currentMonthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function _currentMonthLabel() {
    var d = new Date();
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][d.getMonth()] + '/' + d.getFullYear();
  }

  function _monthLabelFromKey(key) {
    var str = String(key || '');
    var parts = str.split('-');
    if (parts.length !== 2) return _currentMonthLabel();
    var idx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][idx] + '/' + parts[0];
  }

  function _todayStart() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function _endOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  function _diffDays(start, end) {
    var s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    var e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return Math.max(0, Math.round((e - s) / 86400000));
  }

  function _selectOption(value, label) {
    return '<option value="' + _esc(value) + '"' + (_state.period === value ? ' selected' : '') + '>' + _esc(label) + '</option>';
  }

  function _fmtFixed(v) {
    return (parseFloat(v) || 0).toFixed(2);
  }

  function _num(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (typeof v === 'string') {
      var s = v.trim().replace(/\s/g, '');
      if (!s) return 0;
      var hasComma = s.indexOf(',') >= 0;
      var hasDot = s.indexOf('.') >= 0;
      if (hasComma && hasDot) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
          s = s.replace(/\./g, '').replace(',', '.');
        } else {
          s = s.replace(/,/g, '');
        }
      } else if (hasComma) {
        s = s.replace(/\./g, '').replace(',', '.');
      }
      var n = parseFloat(s.replace(/[^0-9.-]/g, ''));
      return isFinite(n) ? n : 0;
    }
    if (typeof v.toNumber === 'function') return _num(v.toNumber());
    return 0;
  }

  function _fmtMoney(v) {
    return UI.fmt(_num(v));
  }

  function _safeHtml(html) {
    return String(html == null ? '' : html).replace(/\bundefined\b/g, '');
  }

  function _esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _scenarioLabel(value) {
    var key = _normalizeText(value || '');
    if (key === 'survival') return 'Sobrevivência';
    if (key === 'equilibrium') return 'Segurança';
    if (key === 'growth') return 'Crescimento';
    if (key === 'expansion') return 'Lucro forte';
    return 'Sem rota';
  }

  function _scenarioTone(value) {
    var key = _normalizeText(value || '');
    if (key === 'survival') return { color: '#D97706', bg: '#FFF7ED', border: '#FED7AA' };
    if (key === 'equilibrium') return { color: '#2563EB', bg: '#EEF4FF', border: '#D6E6FF' };
    if (key === 'growth') return { color: '#1A9E5A', bg: '#EDFAF3', border: '#CFEFDC' };
    if (key === 'expansion') return { color: '#C4362A', bg: '#FFF0EE', border: '#F3C7C1' };
    return { color: '#B45309', bg: '#FFF7ED', border: '#FED7AA' };
  }

  function _barSeriesTooltip() {}

  return {
    render: render,
    destroy: destroy,
    _setPeriod: _setPeriod,
    _setPeriodStart: _setPeriodStart,
    _setPeriodEnd: _setPeriodEnd,
    _setChannel: _setChannel,
    _setScenarioMonth: _setScenarioMonth,
    _setTab: _setTab,
    _setCategoryType: _setCategoryType
  };
})();
