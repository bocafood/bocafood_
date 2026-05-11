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
      _safeDocRoot('config', 'operacao')
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
      _kpis(vm) +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr));gap:16px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          _planCard(vm) +
          _todayCard(vm) +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          _financeCard(vm) +
          _actionsCard(vm) +
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
      onboardingDone: onboarding.every(function (s) { return s.done; })
    };
  }

  function _header(vm) {
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
      '<div style="min-width:0;">' +
        '<h1 style="font-size:22px;font-weight:700;color:#1F1F1F;line-height:1.15;margin:0 0 5px;">' + _esc(vm.greeting) + ', ' + _esc(vm.storeName) + '</h1>' +
        '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:760px;">Resumo operacional do negócio: pedidos, vendas, caixa, Plano de Voo e pontos de atenção do dia.</p>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
        _chip(vm.monthLabel) +
        _chip((vm.openOrders || []).length + ' pedido(s) em andamento') +
      '</div>' +
    '</div>';
  }

  function _onboarding(vm) {
    if (vm.onboardingDone) return '';
    var done = vm.onboarding.filter(function (s) { return s.done; }).length;
    var pct = Math.round((done / vm.onboarding.length) * 100);
    return '<section class="dash-card" style="padding:16px 18px;">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:16px;align-items:center;">' +
        '<div style="min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span class="mi" style="width:34px;height:34px;border-radius:12px;background:#FAF8F4;color:#B42318;font-size:19px;">rocket_launch</span><div><div style="font-size:15px;font-weight:800;color:#1F1F1F;line-height:1.2;">Primeiros passos</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">Some quando a base estiver pronta.</div></div></div>' +
          '<div style="display:flex;align-items:center;gap:10px;"><div style="height:8px;border-radius:999px;background:#F1ECE4;overflow:hidden;flex:1;"><div style="height:100%;width:' + pct + '%;background:#B42318;border-radius:999px;"></div></div><strong style="font-size:12px;color:#1F1F1F;white-space:nowrap;">' + done + '/' + vm.onboarding.length + '</strong></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;">' +
          vm.onboarding.map(function (step) {
            return '<button type="button" onclick="Router.navigate(\'' + _esc(step.route) + '\')" class="dash-action" style="text-align:left;border:1px solid ' + (step.done ? '#D9F2E3' : '#EAE4DA') + ';background:' + (step.done ? '#F4FBF6' : '#fff') + ';border-radius:13px;padding:10px;display:flex;gap:9px;align-items:flex-start;cursor:pointer;font-family:inherit;min-width:0;">' +
              '<span class="mi" style="width:28px;height:28px;border-radius:10px;background:' + (step.done ? '#E8F7EE' : '#FAF8F4') + ';color:' + (step.done ? '#1F6F43' : '#B42318') + ';font-size:17px;flex:0 0 auto;">' + (step.done ? 'check_circle' : step.icon) + '</span>' +
              '<span style="min-width:0;"><strong style="display:block;font-size:12px;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(step.title) + '</strong><span style="display:block;font-size:11px;color:#6F6860;line-height:1.3;margin-top:2px;">' + _esc(step.text) + '</span></span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</section>';
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

  function _onboardingSteps() {
    var g = _data.geral || {};
    var t = _data.template || {};
    return [
      { title: 'Preencher dados gerais', text: 'Nome, contato e documento fiscal.', icon: 'badge', route: 'configuracoes/geral', done: !!(g.businessName && (g.phone || g.whatsapp || g.email)) },
      { title: 'Publicar identidade da loja', text: 'Template, nome público e logo.', icon: 'storefront', route: 'loja-online/template', done: !!(t.publicStoreName || t.publicName || t.logoUrl) },
      { title: 'Cadastrar produtos', text: 'Cardápio pronto para vender.', icon: 'restaurant_menu', route: 'catalogo/produtos', done: (_data.products || []).length > 0 },
      { title: 'Definir Plano de Voo', text: 'Cenário do mês para acompanhar meta.', icon: 'flag', route: 'crescimento/plano-de-voo/snapshots', done: !!_data.monthScenario || !!_snapshotForCurrentMonth() },
      { title: 'Receber primeiro pedido', text: 'Acompanhar operação real.', icon: 'receipt_long', route: 'pedidos/cozinha', done: (_data.orders || []).length > 0 }
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
    destroy: destroy
  };
})();
