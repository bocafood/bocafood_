// js/modules/dashboard.js
window.Modules = window.Modules || {};
Modules.Dashboard = (function () {
  'use strict';

  var _loading = false;
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
    recipes: [],
    purchases: [],
    seasons: [],
    geral: {},
    template: {},
    operacao: {}
  };

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
          '.dash-tour-backdrop{position:fixed;inset:0;background:rgba(31,31,31,.28);z-index:90;display:flex;align-items:center;justify-content:center;padding:20px;}' +
          '.dash-tour-modal{width:min(560px,100%);background:#fff;border-radius:22px;box-shadow:0 28px 70px rgba(31,31,31,.24);overflow:hidden;border:1px solid rgba(234,228,218,.9);}' +
          '@media(max-width:760px){.dash-onboarding-float{right:12px;bottom:12px;width:calc(100vw - 24px);}.dash-onboarding-pill{right:12px;bottom:12px;}}' +
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
    _loading = true;
    return Promise.all([
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
      _safeAll('fichasTecnicas'),
      _safeAll('compras'),
      _safeAll('seasons')
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
      _data.recipes = Array.isArray(r[15]) ? r[15] : [];
      _data.purchases = Array.isArray(r[16]) ? r[16] : [];
      _data.seasons = Array.isArray(r[17]) ? r[17] : [];
      _loading = false;
    }).catch(function (err) {
      _loading = false;
      throw err;
    });
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
      _onboarding(vm) +
      _tourModal() +
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
  }

  function _paintError(err) {
    var content = document.getElementById('dashboard-content');
    if (!content) return;
    content.innerHTML = _safeHtml('<section class="dash-card" style="padding:18px;color:#B42318;font-size:13px;">Erro ao carregar a tela inicial: ' + _esc((err && err.message) || err || 'desconhecido') + '</section>');
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
      onboardingDone: onboardingFlat.length ? onboardingFlat.every(function (s) { return s.done; }) : true
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
    if (vm.onboardingDone) return '';
    var flat = _flattenOnboarding(vm.onboarding);
    var done = flat.filter(function (s) { return s.done; }).length;
    var total = flat.length || 1;
    var phase = _currentOnboardingPhase(vm.onboarding);
    var phaseSteps = (phase && phase.steps) || flat;
    var phaseDone = phaseSteps.filter(function (s) { return s.done; }).length;
    var pct = Math.round((done / total) * 100);
    var collapsed = false;
    try { collapsed = window.localStorage && localStorage.getItem('boca_dashboard_onboarding_collapsed') === '1'; } catch (err) {}
    return '<div id="dash-onboarding-panel" class="dash-card dash-onboarding-float" style="display:' + (collapsed ? 'none' : 'block') + ';overflow:hidden;border:1px solid rgba(234,228,218,.9);">' +
      '<div style="padding:15px 16px;background:linear-gradient(135deg,#fff 0%,#FFF7EC 100%);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
            '<span class="mi" style="width:36px;height:36px;border-radius:13px;background:#B42318;color:#fff;font-size:20px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">rocket_launch</span>' +
            '<div style="min-width:0;"><div style="font-size:15px;font-weight:750;color:#1F1F1F;line-height:1.2;">' + _esc((phase && phase.title) || 'Primeiros passos') + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc((phase && phase.text) || 'Finalize a base para começar a operar com mais segurança.') + '</div></div>' +
          '</div>' +
          '<button type="button" onclick="try{localStorage.setItem(\'boca_dashboard_onboarding_collapsed\',\'1\')}catch(e){};var p=document.getElementById(\'dash-onboarding-panel\');var b=document.getElementById(\'dash-onboarding-pill\');if(p)p.style.display=\'none\';if(b)b.style.display=\'inline-flex\';" style="width:30px;height:30px;border:none;background:rgba(255,255,255,.7);border-radius:10px;color:#6F6860;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:18px;">expand_more</span></button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;margin-top:13px;"><div style="height:8px;border-radius:999px;background:#F1ECE4;overflow:hidden;flex:1;"><div style="height:100%;width:' + pct + '%;background:#B42318;border-radius:999px;"></div></div><span style="font-size:12px;color:#1F1F1F;white-space:nowrap;">' + done + '/' + total + '</span></div>' +
        '<button type="button" onclick="Modules.Dashboard._openTour()" class="dash-soft-btn" style="margin-top:10px;width:100%;height:34px;border:1px solid #E8DCD7;background:#fff;border-radius:11px;color:#1F1F1F;font-size:12px;cursor:pointer;font-family:inherit;">Conhecer o painel em 2 minutos</button>' +
      '</div>' +
      '<div style="padding:10px;background:#fff;display:flex;flex-direction:column;gap:7px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px 3px;"><span style="font-size:11px;color:#8A6F5A;text-transform:uppercase;letter-spacing:.03em;">Etapa atual</span><span style="font-size:11px;color:#6F6860;">' + phaseDone + '/' + phaseSteps.length + '</span></div>' +
          phaseSteps.map(function (step) {
            return '<button type="button" onclick="Router.navigate(\'' + _esc(step.route) + '\')" class="dash-action" style="text-align:left;border:1px solid ' + (step.done ? '#D9F2E3' : '#EAE4DA') + ';background:' + (step.done ? '#F4FBF6' : '#fff') + ';border-radius:13px;padding:10px;display:flex;gap:9px;align-items:flex-start;cursor:pointer;font-family:inherit;min-width:0;">' +
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
    '<button id="dash-onboarding-pill" type="button" class="dash-onboarding-pill" onclick="try{localStorage.setItem(\'boca_dashboard_onboarding_collapsed\',\'0\')}catch(e){};var p=document.getElementById(\'dash-onboarding-panel\');var b=document.getElementById(\'dash-onboarding-pill\');if(p)p.style.display=\'block\';if(b)b.style.display=\'none\';" style="display:' + (collapsed ? 'inline-flex' : 'none') + ';align-items:center;gap:8px;height:42px;padding:0 14px;border:none;background:#B42318;color:#fff;border-radius:999px;font-size:12px;font-weight:750;cursor:pointer;font-family:inherit;"><span class="mi" style="font-size:18px;">rocket_launch</span>' + _esc((phase && phase.shortTitle) || 'Primeiros passos') + ' ' + done + '/' + total + '</button>';
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

  function _tourModal() {
    var open = false;
    try { open = window.localStorage && localStorage.getItem('boca_dashboard_tour_open') === '1'; } catch (err) {}
    if (!open) return '';
    return '<div id="dash-tour" class="dash-tour-backdrop">' +
      '<section class="dash-tour-modal">' +
        '<div style="padding:18px 20px;background:linear-gradient(135deg,#FFFDF8 0%,#FAF1E6 100%);display:flex;align-items:flex-start;justify-content:space-between;gap:14px;">' +
          '<div style="min-width:0;"><div style="font-size:12px;color:#8A6F5A;text-transform:uppercase;letter-spacing:.03em;">Passeio guiado</div><h2 style="font-size:20px;color:#1F1F1F;line-height:1.15;margin:5px 0 0;font-weight:750;">Como o BocaFood organiza sua rotina</h2></div>' +
          '<button type="button" onclick="Modules.Dashboard._closeTour()" style="width:34px;height:34px;border:none;background:#fff;border-radius:12px;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:19px;">close</span></button>' +
        '</div>' +
        '<div style="padding:16px 20px;display:flex;flex-direction:column;gap:11px;">' +
          _tourRow('settings', 'Base do negócio', 'Comece em Configurações, Canais de venda, Preço e Margem, Produtos, Receitas e Financeiro. Isso dá base para o Plano de Voo.') +
          _tourRow('flight_takeoff', 'Plano de Voo', 'Depois da base, crie a rota do período. Ela mostra quanto vender, quantos pedidos buscar e qual esforço será necessário.') +
          _tourRow('event_available', 'Temporadas', 'A Temporada transforma a rota em jogadas práticas para vender mais, aumentar ticket, fidelizar ou ganhar consistência.') +
          _tourRow('storefront', 'Loja online', 'Com produtos e rota definidos, organize cardápio, entrega, retirada e checkout para receber pedidos.') +
          _tourRow('inventory_2', 'Rotina diária', 'No dia a dia, use Compras, Estoque, Pedidos, Cozinha e Financeiro para manter a operação andando.') +
          _tourRow('diamond', 'Leitura do crescimento', 'Performance mostra o mês, e Maturidade mostra se o negócio está evoluindo de verdade.') +
          '<button type="button" onclick="Modules.Dashboard._closeTour()" class="dash-soft-btn" style="height:40px;border:none;background:#B42318;color:#fff;border-radius:13px;font-size:13px;font-weight:750;cursor:pointer;font-family:inherit;margin-top:2px;">Entendi</button>' +
        '</div>' +
      '</section>' +
    '</div>';
  }

  function _tourRow(icon, title, text) {
    return '<div style="display:flex;gap:11px;align-items:flex-start;border:1px solid #EFE6DA;background:#FFFEFC;border-radius:14px;padding:11px 12px;">' +
      '<span class="mi" style="width:32px;height:32px;border-radius:11px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 auto;">' + _esc(icon) + '</span>' +
      '<div style="min-width:0;"><div style="font-size:13px;color:#1F1F1F;font-weight:750;line-height:1.2;">' + _esc(title) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:3px;">' + _esc(text) + '</div></div>' +
    '</div>';
  }

  function _openTour() {
    try { localStorage.setItem('boca_dashboard_tour_open', '1'); } catch (err) {}
    _paint();
  }

  function _closeTour() {
    try { localStorage.setItem('boca_dashboard_tour_open', '0'); } catch (err) {}
    var el = document.getElementById('dash-tour');
    if (el) el.remove();
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
    return [
      {
        key: 'base',
        title: 'Preparar a base',
        shortTitle: 'Base',
        text: 'Antes da rota, o BocaFood precisa entender como o negócio vende, custa e opera.',
        steps: [
          { title: 'Preencher cadastro', text: 'Nome, contato, endereço e dados principais.', icon: 'badge', route: 'configuracoes/geral', done: !!(g.businessName && (g.phone || g.whatsapp || g.email)) },
          { title: 'Criar canais de venda', text: 'Por onde os pedidos chegam e onde entram no financeiro.', icon: 'storefront', route: 'configuracoes/canais_venda', done: hasSalesChannels },
          { title: 'Configurar preço e margem', text: 'Margem desejada e regras para precificar com mais segurança.', icon: 'calculate', route: 'dinheiro/regras', done: hasPriceRules },
          { title: 'Cadastrar produtos', text: 'O que será vendido no cardápio e nos pedidos.', icon: 'restaurant_menu', route: 'catalogo/produtos', done: hasProducts },
          { title: 'Cadastrar receitas', text: 'Fichas técnicas para custo, margem, produção e estoque.', icon: 'receipt_long', route: 'receitas/receitas', done: hasRecipes },
          { title: 'Cadastrar custos fixos', text: 'Despesas e custos que a rota precisa considerar.', icon: 'payments', route: 'financeiro/contas-pagar', done: hasCosts }
        ]
      },
      {
        key: 'route',
        title: 'Criar direção',
        shortTitle: 'Rota',
        text: 'Com a base pronta, crie a rota e transforme isso em jogadas práticas.',
        steps: [
          { title: 'Criar Plano de Voo', text: 'Escolher a rota do período e o ritmo necessário.', icon: 'flight_takeoff', route: 'crescimento/plano-de-voo', done: hasPlan },
          { title: 'Criar primeira Temporada', text: 'Transformar a rota em ações para os próximos dias.', icon: 'event_available', route: 'crescimento/temporadas', done: hasSeason }
        ]
      },
      {
        key: 'storefront',
        title: 'Preparar venda online',
        shortTitle: 'Loja',
        text: 'Agora deixe o cardápio e a loja prontos para receber pedidos.',
        steps: [
          { title: 'Organizar cardápio', text: 'Produtos visíveis, categorias e apresentação.', icon: 'menu_book', route: 'catalogo/produtos', done: hasProducts },
          { title: 'Configurar loja online', text: 'Identidade, capa, logo e informações públicas.', icon: 'store', route: 'loja-online/template', done: hasStorefrontIdentity },
          { title: 'Conferir entrega e retirada', text: 'Horários, checkout e formas de receber pedido.', icon: 'local_shipping', route: 'loja-online/template', done: hasCheckout }
        ]
      },
      {
        key: 'routine',
        title: 'Começar a rotina',
        shortTitle: 'Rotina',
        text: 'Depois da loja pronta, acompanhe compras, estoque, pedidos e dinheiro.',
        steps: [
          { title: 'Criar primeira compra', text: 'Registrar compra para alimentar custo e estoque.', icon: 'shopping_cart', route: 'compras/registros', done: hasPurchase },
          { title: 'Receber primeiro pedido', text: 'Acompanhar pedido, cozinha e entrada financeira.', icon: 'receipt_long', route: 'pedidos/cozinha', done: hasOrder },
          { title: 'Ver Performance', text: 'Conferir se o mês acompanha a rota escolhida.', icon: 'analytics', route: 'crescimento/performance', done: hasPlan && hasOrder }
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
    _openTour: _openTour,
    _closeTour: _closeTour
  };
})();
