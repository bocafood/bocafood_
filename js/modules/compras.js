// js/modules/compras.js
window.Modules = window.Modules || {};
Modules.Compras = (function () {
  'use strict';

  var _activeSub = 'registros';
  var _compras = [];
  var _itens = [];
  var _fornecedores = [];
  var _unidades = [];
  var _tipos = [];
  var _categorias = [];
  var _contas = [];
  var _finCategorias = [];
  var _finFormas = [];
  var _editingId = null;
  var _editingKind = '';
  var _itensView = 'todos';
  var _registroFilters = { q: '', periodo: 'todos', inicio: '', fim: '', status: '', ordem: 'desc' };
  var _itensFilters = { q: '', classe: '', tipo: '', categoria: '', fornecedor: '', ativo: 'ativo' };
  var _simpleListClasseFilter = '';
  var _simpleListQ = '';
  var _fornecedoresFilters = { q: '', status: 'ativo' };
  var PHONE_COUNTRIES = [
    { ddi: '+34',  flag: '🇪🇸', label: 'ES' },
    { ddi: '+55',  flag: '🇧🇷', label: 'BR' },
    { ddi: '+351', flag: '🇵🇹', label: 'PT' },
    { ddi: '+33',  flag: '🇫🇷', label: 'FR' },
    { ddi: '+39',  flag: '🇮🇹', label: 'IT' },
    { ddi: '+49',  flag: '🇩🇪', label: 'DE' },
    { ddi: '+44',  flag: '🇬🇧', label: 'GB' },
    { ddi: '+1',   flag: '🇺🇸', label: 'US' }
  ];
  var _compraEstadoFinanceiro = null; // loaded async when modal opens
  var _savingCompra = false;
  var _sendingFinanceiro = {};
  var _comprasFinanceiroStatus = {};
  var _compraParcelasPreview = []; // preview das parcelas antes de salvar
  var _pag = {
    registros:    { page: 1, perPage: 25 },
    itens:        { page: 1, perPage: 25 },
    fornecedores: { page: 1, perPage: 25 },
    tipos:        { page: 1, perPage: 25 },
    categorias:   { page: 1, perPage: 25 }
  };

  var TABS = [
    { key: 'registros',    label: 'Registro de compras' },
    { key: 'itens',        label: 'Produtos / Insumos' },
    { key: 'fornecedores', label: 'Fornecedores' },
    { key: 'configuracoes', label: 'Configurações' }
  ];
  var _configSub = 'tipos'; // subtab activo dentro de Configurações

  var DEFAULT_TIPOS_SEED = [
    { name: 'Ingrediente', classe: 'insumo' }, { name: 'Embalagem', classe: 'insumo' },
    { name: 'Material operacional', classe: 'insumo' }, { name: 'Escritório / administrativo', classe: 'ambos' },
    { name: 'Bebida', classe: 'produto' }, { name: 'Sobremesa pronta', classe: 'produto' },
    { name: 'Produto revenda', classe: 'produto' }
  ];
  var DEFAULT_CATS_SEED = [
    { name: 'Laticínios', classe: 'insumo' }, { name: 'Secos', classe: 'insumo' },
    { name: 'Proteínas', classe: 'insumo' }, { name: 'Hortifruti', classe: 'insumo' },
    { name: 'Temperos', classe: 'insumo' }, { name: 'Outros', classe: 'ambos' },
    { name: 'Refrigerantes', classe: 'produto' }, { name: 'Sucos', classe: 'produto' },
    { name: 'Doces prontos', classe: 'produto' }, { name: 'Bebidas em geral', classe: 'produto' }
  ];
  var PACKAGE_OPTIONS_PT = ['bandeja', 'bolsa', 'caixa', 'fardo', 'frasco', 'garrafa', 'lata', 'pacote', 'saco', 'unidade'];
  var DEFAULT_UNIDADES = [
    { name: 'Quilograma', symbol: 'kg', type: 'massa' },
    { name: 'Grama', symbol: 'g', type: 'massa' },
    { name: 'Litro', symbol: 'L', type: 'volume' },
    { name: 'Mililitro', symbol: 'ml', type: 'volume' },
    { name: 'Unidade', symbol: 'un', type: 'unidade' },
    { name: 'Pacote', symbol: 'pct', type: 'unidade' }
  ];
  var UNIDADES_COMPRA_MAP = { g: ['g', 'kg'], kg: ['kg', 'g'], ml: ['ml', 'L'], L: ['L', 'ml'], un: ['un'], unidade: ['unidade'], pct: ['pct'] };

  function render(sub) {
    _activeSub = sub || 'registros';
    var app = document.getElementById('app');
    app.innerHTML = '<div id="compras-root" style="display:flex;flex-direction:column;height:100%;">' +
      '<div id="compras-content" style="flex:1;overflow-y:auto;padding:24px;"><div class="loading-inline">Carregando...</div></div>' +
      '</div>';
    _seedDefaults().then(function () { _loadSub(_activeSub); });
  }

  function _switchSub(key) {
    _activeSub = key;
    _loadSub(key);
    Router.navigate('compras/' + key);
  }

  function _loadSub(key) {
    var content = document.getElementById('compras-content');
    if (content) content.innerHTML = '<div class="loading-inline">Carregando...</div>';
    if (key === 'registros') return _renderRegistros();
    if (key === 'itens') { _itensView = 'todos'; return _renderItens(); }
    if (key === 'fornecedores') return _renderFornecedores();
    if (key === 'unidades') return _renderUnidades();
    if (key === 'configuracoes') return _renderConfiguracoes();
    // rotas legadas (podem vir de Router.navigate ou links antigos)
    if (key === 'tipos') { _configSub = 'tipos'; _activeSub = 'configuracoes'; return _renderConfiguracoes(); }
    if (key === 'categorias') { _configSub = 'categorias'; _activeSub = 'configuracoes'; return _renderConfiguracoes(); }
  }

  function _seedDefaults() {
    return Promise.all([DB.getAll('compras_tipos'), DB.getAll('compras_categorias'), DB.getAll('unidades_medida')]).then(function (r) {
      var ops = [];
      if (!(r[0] || []).length) ops = ops.concat(DEFAULT_TIPOS_SEED.map(function (t) { return DB.add('compras_tipos', { name: t.name, classe: t.classe, ativo: true }); }));
      if (!(r[1] || []).length) ops = ops.concat(DEFAULT_CATS_SEED.map(function (t) { return DB.add('compras_categorias', { name: t.name, classe: t.classe, ativo: true }); }));
      if (!(r[2] || []).length) ops = ops.concat(DEFAULT_UNIDADES.map(function (u) { return DB.add('unidades_medida', u); }));
      return Promise.all(ops);
    }).catch(function () {});
  }

  // ── Paginação ──────────────────────────────────────────────────────────────
  function _pagerHtml(key, total) {
    var p = _pag[key];
    if (!p || total === 0) return '';
    var perPage = p.perPage;
    var page = p.page;
    var totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1 && total <= perPage) return '';
    var from = Math.min((page - 1) * perPage + 1, total);
    var to = Math.min(page * perPage, total);
    var btn = 'height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;';
    var activeBtn = btn + 'color:#1F1F1F;border-color:#EAE4DA;font-weight:600;';
    var perPageSel = '<select onchange="Modules.Compras._setPerPage(\'' + key + '\',this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">' +
      [10, 25, 50].map(function (n) { return '<option value="' + n + '"' + (perPage === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('') + '</select>';
    var pages = '';
    pages += '<button type="button" onclick="Modules.Compras._changePage(\'' + key + '\',' + (page - 1) + ')" style="' + btn + 'cursor:' + (page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (page > 1 ? '1' : '.45') + ';"' + (page > 1 ? '' : ' disabled') + '>Anterior</button>';
    pages += '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + totalPages + '</span></div>';
    pages += '<button type="button" onclick="Modules.Compras._changePage(\'' + key + '\',' + (page + 1) + ')" style="' + btn + 'cursor:' + (page < totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (page < totalPages ? '1' : '.45') + ';"' + (page < totalPages ? '' : ' disabled') + '>Próxima</button>';
    return '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + from + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + to + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' + perPageSel + '<div style="display:flex;align-items:center;gap:6px;">' + pages + '</div></div></div>';
  }

  function _changePage(key, page) {
    if (_pag[key]) { _pag[key].page = page; _repaintForKey(key); }
  }

  function _setPerPage(key, n) {
    if (_pag[key]) { _pag[key].perPage = parseInt(n, 10) || 25; _pag[key].page = 1; _repaintForKey(key); }
  }

  function _repaintForKey(key) {
    if (key === 'registros') _paintRegistrosTable();
    else if (key === 'itens') { var _rit = document.getElementById('compras-itens-table'); if (_rit) _rit.innerHTML = _itensTable(_filteredItens()); }
    else if (key === 'fornecedores') _paintFornecedoresTable();
    else if (key === 'tipos') _paintSimpleList('tipos');
    else if (key === 'categorias') _paintSimpleList('categorias');
    else if (key === 'configuracoes') _paintConfiguracoes();
  }

  // ── Registro de compras ────────────────────────────────────────────────────
  function _renderRegistros() {
    return Promise.all([
      DB.getAll('compras'), DB.getAll('fornecedores'), DB.getAll('itens_custo'),
      DB.getAll('contas_bancarias'), DB.getAll('financeiro_categorias'),
      DB.getDoc('config', 'financeiro'), DB.getAll('financeiro_apagar'),
      DB.getAll('contas_pagar'), DB.getAll('movimentacoes')
    ]).then(function (r) {
      _compras = (r[0] || []).sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); });
      _fornecedores = r[1] || [];
      _itens = (r[2] || []).filter(function (i) { return i.ativo !== false; });
      _contas = (r[3] || []).filter(function (c) { return c && c.ativo !== false; });
      _finCategorias = r[4] || [];
      var finConfig = r[5] || {};
      _finFormas = (finConfig.formas_pagamento && finConfig.formas_pagamento.length) ? finConfig.formas_pagamento : [];
      _comprasFinanceiroStatus = _buildComprasFinanceiroStatus(r[6] || [], r[7] || [], r[8] || []);
      _paintRegistros();
    });
  }

  function _paintRegistros() {
    var content = document.getElementById('compras-content');
    if (!content) return;
    var totalComprado = _compras.reduce(function (s, c) { return s + (parseFloat(c.total) || 0); }, 0);
    var comprasPendentes = _compras.filter(_compraPendente).length;
    var fieldStyle = 'padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;width:100%;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;';
    var selStyle = fieldStyle + 'height:40px;';
    var limparBtn = 'height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;white-space:nowrap;';
    content.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div>' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.15;margin:0 0 6px;color:#1F1F1F;">Registro de compras</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Acompanhe compras registradas, status de recebimento e vínculo com o Financeiro.</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;">' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + _compras.length + ' compras</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + comprasPendentes + ' pendentes</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">Total ' + UI.fmt(totalComprado) + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Compras._openCompraModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">+ Nova compra</button>' +
        '</div>' +
      '</div>' +
      '<div id="compras-reg-kpis" class="growth-grid" style="margin-bottom:0;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;"></div>' +
      '<div style="background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="display:grid;grid-template-columns:minmax(320px,1.6fr) minmax(150px,.75fr) minmax(160px,.8fr) minmax(140px,.7fr) minmax(140px,.7fr) auto;gap:10px;align-items:end;">' +
      '<div><input id="compras-reg-search" type="search" value="' + _esc(_registroFilters.q) + '" oninput="Modules.Compras._filterRegistros()" placeholder="Buscar por fornecedor, pedido, item, conta, categoria..." autocomplete="off" style="' + fieldStyle + 'height:40px;"></div>' +
      '<select id="compras-reg-status" onchange="Modules.Compras._filterRegistros()" style="' + selStyle + '">' +
      '<option value=""' + (!_registroFilters.status ? ' selected' : '') + '>Todos status</option>' +
      '<option value="Cancelada"' + (_registroFilters.status === 'Cancelada' ? ' selected' : '') + '>Cancelada</option>' +
      '<option value="Parcial"' + (_registroFilters.status === 'Parcial' ? ' selected' : '') + '>Parcial</option>' +
      '<option value="Pendente"' + (_registroFilters.status === 'Pendente' ? ' selected' : '') + '>Pendente</option>' +
      '<option value="Recebida"' + (_registroFilters.status === 'Recebida' ? ' selected' : '') + '>Recebida</option>' +
      '</select>' +
      '<select id="compras-reg-periodo" onchange="Modules.Compras._filterRegistros()" style="' + selStyle + '">' +
      _periodoOption('todos', 'Todo período') +
      _periodoOption('hoje', 'Hoje') +
      _periodoOption('ontem', 'Ontem') +
      _periodoOption('semana_atual', 'Esta semana') +
      _periodoOption('semana_passada', 'Semana passada') +
      _periodoOption('mes_atual', 'Este mês') +
      _periodoOption('mes_passado', 'Mês passado') +
      _periodoOption('7', 'Últimos 7 dias') +
      _periodoOption('30', 'Últimos 30 dias') +
      _periodoOption('90', 'Últimos 90 dias') +
      _periodoOption('trimestre_atual', 'Este trimestre') +
      _periodoOption('ano_atual', 'Este ano') +
      _periodoOption('ano_passado', 'Ano passado') +
      '</select>' +
      '<input id="compras-reg-inicio" type="date" value="' + _esc(_registroFilters.inicio) + '" onchange="Modules.Compras._filterRegistros()" title="Data inicial" style="' + selStyle + '">' +
      '<input id="compras-reg-fim" type="date" value="' + _esc(_registroFilters.fim) + '" onchange="Modules.Compras._filterRegistros()" title="Data final" style="' + selStyle + '">' +
      '<button onclick="Modules.Compras._clearRegistrosFilters()" style="' + limparBtn + '">Limpar</button>' +
      '</div>' +
      '<div id="compras-reg-summary" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;"></div>' +
      '</div>' +
      '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.3;">Compras registradas</div>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:3px 0 0;">Veja pedidos, fornecedores, itens, status e contas vinculadas ao Financeiro.</p>' +
        '</div>' +
        '<div id="compras-reg-table"></div>' +
      '</section>' +
      '</div>';
    _paintRegistrosTable();
  }

  function _paintRegistrosTable() {
    var data = _filteredRegistros();
    var total = data.reduce(function (s, c) { return s + (parseFloat(c.total) || 0); }, 0);
    var pendentes = data.filter(_compraPendente).length;
    var ticketMedio = data.length ? total / data.length : 0;
    var fornecedorPrincipal = _fornecedorPrincipal(data);
    var compraKpi = function (label, value, icon, color) {
      return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\';" onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\';">' +
        '<div style="width:46px;height:46px;border-radius:14px;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="mi" style="font-size:26px;color:' + color + ';">' + _esc(icon) + '</span></div>' +
        '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
          '<span style="display:block;font-size:12px;font-weight:500;color:#6F6860;line-height:1.2;">' + _esc(label) + '</span>' +
          '<strong style="display:block;font-size:26px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(value) + '</strong>' +
        '</div>' +
      '</div>';
    };
    var kpis = document.getElementById('compras-reg-kpis');
    if (kpis) kpis.innerHTML =
      compraKpi('Compras', data.length, 'receipt_long', '#8A6F5A') +
      compraKpi('Total comprado', UI.fmt(total), 'payments', '#A18362') +
      compraKpi('Pendentes', pendentes, 'pending_actions', '#B42318') +
      compraKpi('Ticket médio', UI.fmt(ticketMedio), 'query_stats', '#6C8777') +
      compraKpi('Fornecedor principal', fornecedorPrincipal || '-', 'storefront', '#8A6F5A');
    var p = _pag.registros;
    var pageData = data.slice((p.page - 1) * p.perPage, p.page * p.perPage);
    var tbl = document.getElementById('compras-reg-table');
    if (!tbl) return;
    var summary = document.getElementById('compras-reg-summary');
    if (summary) summary.innerHTML =
      _chip(data.length + ' compras') +
      _chip(pendentes + ' pendentes') +
      _chip('Total ' + UI.fmt(total)) +
      _chip('Página ' + Math.min(Math.max(1, p.page), Math.max(1, Math.ceil(data.length / p.perPage))) + ' de ' + Math.max(1, Math.ceil(data.length / p.perPage)));
    if (!data.length) {
      tbl.innerHTML = '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="text-align:center;padding:60px 20px;color:#7A746B;">' +
          '<div style="width:54px;height:54px;border-radius:16px;background:#FAF8F4;border:1px solid #EAE4DA;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span class="mi" style="font-size:26px;color:#A39B90;">receipt_long</span></div>' +
          '<p style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 6px;">Nenhuma compra encontrada</p>' +
          '<p style="font-size:13px;color:#7A746B;margin:0 0 16px;">Tente ajustar a busca, os filtros ou o período.</p>' +
          '<button type="button" onclick="Modules.Compras._openCompraModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);">Nova compra</button>' +
        '</div>' +
      '</div>';
      return;
    }
    var _dataArrow = _registroFilters.ordem === 'asc' ? ' ↑' : ' ↓';
    var th = 'padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;';
    var _theadRegistros = '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
      '<th style="text-align:left;' + th + '">Pedido</th>' +
      '<th onclick="Modules.Compras._toggleRegistrosOrdem()" style="text-align:left;cursor:pointer;user-select:none;' + th + '">Data' + _dataArrow + '</th>' +
      '<th style="text-align:left;' + th + '">Fornecedor</th>' +
      '<th style="text-align:left;' + th + '">Documento</th>' +
      '<th style="text-align:left;' + th + '">Itens</th>' +
      '<th style="text-align:left;' + th + '">Total</th>' +
      '<th style="text-align:left;' + th + '">Status</th>' +
      '<th style="text-align:left;' + th + '">Conta a pagar</th>' +
      '<th style="text-align:right;' + th + '">Ações</th>' +
      '</tr></thead>';
    tbl.innerHTML = '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="overflow:auto;"><table class="bf-table" style="width:100%;min-width:1040px;border-collapse:separate;border-spacing:0;background:#fff;">' +
      _theadRegistros +
      '<tbody>' + (data.length ? pageData.map(function (c) {
        var f = _byId(_fornecedores, c.fornecedorId);
        return '<tr onclick="Modules.Compras._openCompraModal(\'' + c.id + '\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
          _td('<span style="font-size:11px;font-weight:600;color:#8A7E7C;font-family:monospace;">' + _esc(c.numPedido || '—') + '</span>') +
          _td(c.data ? UI.fmtDate(new Date(c.data)) : '-') +
          _td(_esc(f ? f.name : '-'), true) +
          _td(_esc(c.numDocumento || '-')) +
          _td(((c.itens || []).length) + ' item(s)') +
          _td('<strong style="color:#1F1F1F;font-weight:600;">' + UI.fmt(c.total || 0) + '</strong>') +
          _td(_statusBadge(c.statusCompra)) +
          _td('<div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;">' + _financeiroBadgeHtml(c) + _financeiroActionHtml(c) + '</div>') +
          '<td style="padding:13px 16px;vertical-align:middle;text-align:right;white-space:nowrap;" onclick="event.stopPropagation();"><div style="display:inline-flex;align-items:center;gap:6px;"><button type="button" title="Editar" onclick="Modules.Compras._openCompraModal(\'' + c.id + '\')" style="' + _iconBtn('#fff', '#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
          '<button type="button" title="Excluir" onclick="Modules.Compras._deleteCompra(\'' + c.id + '\')" style="' + _iconBtn('#fff', '#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button></div></td></tr>';
      }).join('') : '') + '</tbody></table></div>' +
      _pagerHtml('registros', data.length) + '</div>';
  }

  function _filterRegistros() {
    _registroFilters.q = (_el('compras-reg-search').value || '').trim();
    _registroFilters.periodo = _el('compras-reg-periodo').value || 'todos';
    _registroFilters.inicio = (_el('compras-reg-inicio').value || '').trim();
    _registroFilters.fim = (_el('compras-reg-fim').value || '').trim();
    _registroFilters.status = _el('compras-reg-status').value || '';
    _pag.registros.page = 1;
    _paintRegistrosTable();
  }

  function _clearRegistrosFilters() {
    _registroFilters = { q: '', periodo: 'todos', inicio: '', fim: '', status: '', ordem: 'desc' };
    _pag.registros.page = 1;
    _paintRegistros();
  }

  function _filteredRegistros() {
    var q = String(_registroFilters.q || '').toLowerCase();
    var filtered = (_compras || []).filter(function (c) {
      if (!_periodoMatch(c.data, _registroFilters.periodo)) return false;
      if (!_dateRangeMatch(c.data, _registroFilters.inicio, _registroFilters.fim)) return false;
      if (_registroFilters.status) {
        var cStatus = c.statusCompra || (_compraPendente(c) ? 'Pendente' : '');
        if (String(cStatus).toLowerCase() !== _registroFilters.status.toLowerCase()) return false;
      }
      if (!q) return true;
      var f = _byId(_fornecedores, c.fornecedorId);
      var conta = _byId(_contas, c.contaBancariaId);
      var finCat = _byId(_finCategorias, c.categoriaFinanceiraId);
      var itemText = (c.itens || []).map(function (i) { return i.nome || i.name || ''; }).join(' ');
      var hay = [
        f && f.name,
        c.numPedido,
        c.numDocumento,
        c.documento,
        c.observacoes,
        c.formaPagamento,
        c.categoriaFiscal,
        c.statusCompra,
        conta && conta.name,
        finCat && finCat.name,
        itemText
      ].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    var dir = _registroFilters.ordem === 'asc' ? 1 : -1;
    return filtered.sort(function (a, b) {
      return dir * (a.data || '').localeCompare(b.data || '');
    });
  }

  function _toggleRegistrosOrdem() {
    _registroFilters.ordem = _registroFilters.ordem === 'desc' ? 'asc' : 'desc';
    _pag.registros.page = 1;
    _paintRegistrosTable();
  }

  function _periodoMatch(dateStr, periodo) {
    if (!periodo || periodo === 'todos') return true;
    var d = dateStr ? new Date(dateStr + 'T00:00:00') : null;
    if (!d || isNaN(d.getTime())) return false;
    var now = new Date();
    var todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate();
    // Hoje
    if (periodo === 'hoje') return d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;
    // Ontem
    if (periodo === 'ontem') {
      var yest = new Date(now); yest.setDate(todayD - 1);
      return d.getFullYear() === yest.getFullYear() && d.getMonth() === yest.getMonth() && d.getDate() === yest.getDate();
    }
    // Esta semana (Dom–Sáb)
    if (periodo === 'semana_atual') {
      var dow = now.getDay();
      var weekStart = new Date(now); weekStart.setDate(todayD - dow); weekStart.setHours(0,0,0,0);
      var weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
      return d >= weekStart && d <= weekEnd;
    }
    // Semana passada
    if (periodo === 'semana_passada') {
      var dow2 = now.getDay();
      var ws = new Date(now); ws.setDate(todayD - dow2 - 7); ws.setHours(0,0,0,0);
      var we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23,59,59,999);
      return d >= ws && d <= we;
    }
    // Este mês
    if (periodo === 'mes_atual') return d.getFullYear() === todayY && d.getMonth() === todayM;
    // Mês passado
    if (periodo === 'mes_passado') {
      var pm = todayM === 0 ? 11 : todayM - 1;
      var py = todayM === 0 ? todayY - 1 : todayY;
      return d.getFullYear() === py && d.getMonth() === pm;
    }
    // Este trimestre
    if (periodo === 'trimestre_atual') {
      var qStart = Math.floor(todayM / 3) * 3;
      return d.getFullYear() === todayY && d.getMonth() >= qStart && d.getMonth() < qStart + 3;
    }
    // Este ano
    if (periodo === 'ano_atual') return d.getFullYear() === todayY;
    // Ano passado
    if (periodo === 'ano_passado') return d.getFullYear() === todayY - 1;
    // Últimos N dias (numeric string)
    var days = parseInt(periodo, 10);
    if (!days) return true;
    var start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - days + 1);
    return d >= start;
  }

  function _dateRangeMatch(dateStr, inicio, fim) {
    if (!inicio && !fim) return true;
    var d = dateStr ? new Date(dateStr + 'T00:00:00') : null;
    if (!d || isNaN(d.getTime())) return false;
    if (inicio) {
      var start = new Date(inicio + 'T00:00:00');
      if (!isNaN(start.getTime()) && d < start) return false;
    }
    if (fim) {
      var end = new Date(fim + 'T23:59:59');
      if (!isNaN(end.getTime()) && d > end) return false;
    }
    return true;
  }

  // Normaliza o status da compra para verificação de pendência
  function _statusCompraRaw(c) {
    return String(c.statusCompra || c.status || c.estado || c.situacao || c.situação || c.statusPagamento || c.paymentStatus || '').toLowerCase().trim();
  }

  var _PENDENTE_STATUS = ['pendente', 'pendentes', 'aguardando', 'em aberto', 'aberto'];
  var _PAGO_STATUS    = ['pago', 'paga', 'quitado', 'quitada', 'recebida', 'concluido', 'concluída', 'concluida', 'cancelada', 'cancelado', 'parcial'];

  function _compraPendente(c) {
    var raw = _statusCompraRaw(c);
    if (!raw) return !c.contaPagarId; // legado sem campo de status
    if (_PAGO_STATUS.indexOf(raw) >= 0) return false;
    if (_PENDENTE_STATUS.indexOf(raw) >= 0) return true;
    if (c.pago === false || c.paid === false) return true;
    return false;
  }

  function _statusContaPagar(c) {
    if (!c) return 'pendente';
    var s = String(c.status || '').toLowerCase();
    if (s === 'estornada' || s === 'estornado') return 'estornada';
    if (s === 'cancelada' || s === 'cancelado') return 'cancelada';
    if (s === 'pago' || s === 'paga' || s === 'parcial') return 'pago';
    if (c.data_pagamento) return 'pago';
    return 'pendente';
  }

  function _buildComprasFinanceiroStatus(finApagar, contasPagar, movs) {
    var out = {};
    var all = _uniqById((finApagar || []).map(function (c) { return Object.assign({}, c, { _col: 'financeiro_apagar' }); })
      .concat((contasPagar || []).map(function (c) { return Object.assign({}, c, { _col: 'contas_pagar' }); })));
    all.forEach(function (c) {
      var compraId = c.compraId || c.sourceCompraId || (c.sourceCollection === 'compras' ? c.sourceId : '') || '';
      if (!compraId) return;
      var st = _statusContaPagar(c);
      if (st === 'estornada' || st === 'cancelada') return;
      if (!out[compraId]) out[compraId] = { contas: [], active: 0, pending: 0, paid: 0, hasPaid: false };
      out[compraId].contas.push(c);
      out[compraId].active++;
      if (st === 'pago') {
        var confirmed = (movs || []).some(function (m) { return m.contaPagarId === c.id && m.tipo === 'saida' && m.status === 'efetivado'; });
        if (confirmed) { out[compraId].paid++; out[compraId].hasPaid = true; }
        else out[compraId].pending++;
      } else {
        out[compraId].pending++;
      }
    });
    return out;
  }

  function _financeiroStateCompra(c) {
    var info = (c && c.id && _comprasFinanceiroStatus[c.id]) || { active: 0, pending: 0, paid: 0, hasPaid: false, contas: [] };
    if (info.active > 0 && c.contaPagarStatus === 'pendente_atualizacao') return 'pendente_atualizacao';
    if (info.active > 0) return 'gerada';
    return 'nao_gerada';
  }

  function _financeiroBadgeHtml(c) {
    var st = _financeiroStateCompra(c);
    if (st === 'gerada') return _statusChip('Gerada', '#5B7A67', '#6C8777');
    if (st === 'pendente_atualizacao') return _statusChip('Pendente atualização', '#9A5B13', '#D97706');
    return _statusChip('Não gerada', '#6F6860', '#A39B90');
  }

  function _financeiroActionHtml(c) {
    var st = _financeiroStateCompra(c);
    var info = (c && c.id && _comprasFinanceiroStatus[c.id]) || {};
    var canceled = String(c.statusCompra || '').toLowerCase() === 'cancelada';
    var sending = !!_sendingFinanceiro[c.id];
    var disabled = sending ? ' disabled style="margin-top:5px;padding:6px 9px;border-radius:8px;border:none;background:#D4C8C6;color:#fff;cursor:not-allowed;font-size:11px;font-weight:700;font-family:inherit;"' : '';
    if (!c.id || _num(c.total) <= 0 || canceled || info.hasPaid) return '';
    if ((st === 'nao_gerada' || st === 'pendente_atualizacao') && c.gerarContaPagar !== false) {
      return '<button onclick="event.stopPropagation();Modules.Compras._abrirAtualizacaoFinanceiroPrompt(\'' + c.id + '\')"' + (sending ? disabled : ' style="margin-top:5px;padding:6px 9px;border-radius:8px;border:none;background:#D97706;color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;"') + '>' + (sending ? 'Atualizando...' : 'Atualizar Financeiro') + '</button>';
    }
    return '';
  }

  function _financeiroSignature(c) {
    if (!c) return '';
    return JSON.stringify({
      total: +(_num(c.total).toFixed(2)),
      valorSemIva: +(_num(c.valorSemIva).toFixed(2)),
      ivaValor: +(_num(c.ivaValor).toFixed(2)),
      itens: (c.itens || []).map(function (l) {
        return {
          itemId: l.itemId || '',
          qty: _num(l.qty),
          qtyBase: _num(l.qtyBase),
          precoEmbalagem: _num(l.precoEmbalagem || l.precoCompra || l.preco),
          descontoUnitario: _num(l.descontoUnitario),
          descontoTotal: _num(l.descontoTotal || l.desconto),
          ivaPct: _num(l.ivaPct),
          total: +(_lineTotal(l).toFixed(2))
        };
      }),
      gerarContaPagar: c.gerarContaPagar !== false,
      formaPagamento: c.formaPagamento || '',
      dueDate: c.dueDate || '',
      parcelas: parseInt(c.parcelas || 1, 10) || 1,
      prazoParcelas: parseInt(c.prazoParcelas || 30, 10) || 30,
      categoriaFinanceiraId: c.categoriaFinanceiraId || '',
      teveEntrada: !!c.teveEntrada,
      entradaValor: _num(c.entradaValor),
      entradaData: c.entradaData || '',
      entradaFormaPagamento: c.entradaFormaPagamento || '',
      parcelasPreview: (c.parcelasPreview && c.parcelasPreview.length) ? c.parcelasPreview : _parcelasPreviewFromCompra(c)
    });
  }

  function _statusBadge(status) {
    var s = status || 'Pendente';
    var colors = {
      'Pendente': ['#9A5B13', '#D97706'],
      'Recebida': ['#5B7A67', '#6C8777'],
      'Parcial': ['#3B5B82', '#5B7FA6'],
      'Cancelada': ['#6F6860', '#A39B90']
    };
    var c = colors[s] || colors.Pendente;
    return _statusChip(s, c[0], c[1]);
  }

  function _compraStatusOptions(selected) {
    return ['Pendente', 'Recebida', 'Parcial', 'Cancelada'].map(function (s) {
      return '<option value="' + s + '"' + (selected === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('');
  }

  function _fornecedorPrincipal(data) {
    var totals = {};
    (data || []).forEach(function (c) {
      var f = _byId(_fornecedores, c.fornecedorId);
      var name = (f && f.name) || 'Sem fornecedor';
      totals[name] = (totals[name] || 0) + (parseFloat(c.total) || 0);
    });
    var best = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; })[0];
    return best ? _esc(best) : '';
  }

  function _periodoOption(value, label) {
    return '<option value="' + value + '"' + (_registroFilters.periodo === value ? ' selected' : '') + '>' + label + '</option>';
  }

  function _openCompraModal(id) {
    _editingId = id;
    _compraEstadoFinanceiro = null;
    _savingCompra = false;
    _compraParcelasPreview = [];
    var c = id ? (_byId(_compras, id) || {}) : { data: _todayLocal(), gerarContaPagar: true };
    window._compraLinhas = (c.itens || []).map(function (i) { return Object.assign({}, i); });
    var fornecedoresSorted = _fornecedores.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var fornecedorOpts = _options(fornecedoresSorted, c.fornecedorId, 'name', 'Sem fornecedor');
    var catOpts = _finCatSaidaOptions(c.categoriaFinanceiraId);
    var fornAtual = c.fornecedorId ? (_byId(_fornecedores, c.fornecedorId) || {}) : {};
    var itemOpts = _itens.map(function (i) {
      var unidade = i.unidade_base || i.unidadeBase || 'un';
      // Embalagem padrão: ignora valores que são unidades base (kg, g, L, ml)
      var embPadrao = (!_isBaseUnit(i.unidade_compra_padrao) ? (i.unidade_compra_padrao || '') : '') ||
                      (!_isBaseUnit(i.ultima_embalagem) ? (i.ultima_embalagem || '') : '');
      var conteudoPadrao = _num(i.conteudo_por_embalagem_padrao) || _num(i.ultimo_conteudo) || 1;
      return '<option value="' + i.id + '" data-unidade="' + _esc(unidade) + '" data-aproveitamento="' + (i.aproveitamento_padrao || 100) + '" data-emb="' + _esc(embPadrao) + '" data-conteudo="' + conteudoPadrao + '" data-classe="' + _esc(i.classe || 'insumo') + '">' + _esc(i.nome || i.name) + '</option>';
    }).join('');
    window._compraAllItems = _itens; // para busca live no modal
    var body = '<div style="display:flex;flex-direction:column;gap:14px;"><div id="cp-financial-status"></div>' +
      (id && c.numPedido ? '<div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;padding:4px 10px;background:#fff;border:1px solid #EAE4DA;border-radius:999px;font-size:12px;font-weight:500;color:#6F6860;box-shadow:0 1px 2px rgba(31,31,31,.02);"><span style="font-weight:600;color:#A39B90;font-size:10px;letter-spacing:.04em;">Pedido</span> <strong style="color:#1F1F1F;font-family:monospace;">' + _esc(c.numPedido) + '</strong></div>' : '') +
      '<section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">' +
      _field('cp-data', 'Data *', c.data || '', 'date') +
      _field('cp-doc', 'Nº documento', c.numDocumento || '') +
      _select('cp-status', 'Status', _compraStatusOptions(c.statusCompra || 'Pendente')) +
      '</div>' +
      '<div style="position:relative;margin-bottom:12px;">' +
      '<label style="' + _labelStyle() + '">Fornecedor</label>' +
      '<input id="cp-forn-display" type="text" placeholder="Buscar fornecedor..." autocomplete="off" value="' + _esc(fornAtual.name || '') + '" ' +
        'oninput="Modules.Compras._compraFornSearch(this.value)" ' +
        'onfocus="Modules.Compras._compraFornSearch(this.value)" ' +
        'onblur="setTimeout(function(){var d=document.getElementById(\'cp-forn-dropdown\');if(d)d.style.display=\'none\';},200)" ' +
        'style="' + _inputStyle() + '">' +
      '<div id="cp-forn-dropdown" style="display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border:1px solid #EAE4DA;border-radius:10px;max-height:220px;overflow-y:auto;z-index:9999;box-shadow:0 12px 30px rgba(31,31,31,.12);"></div>' +
      '<select id="cp-forn" onchange="Modules.Compras._buildParcelasPreview()" style="display:none;"><option value="">Sem fornecedor</option>' + fornecedorOpts + '</select>' +
      '</div>' +
      '<div>' + _textarea('cp-obs', 'Observações', c.observacoes || '') + '</div>' +
      '</section>' +
      '<section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.04em;margin-bottom:10px;">Itens da compra</div>' +
      '<datalist id="cp-emb-list"><option value="un"><option value="unidade"><option value="pacote"><option value="caixa"><option value="fardo"><option value="saco"><option value="garrafa"><option value="lata"><option value="frasco"><option value="bandeja"><option value="botella"><option value="bolsa"><option value="caja"></datalist>' +
      '<div style="display:grid;grid-template-columns:2.2fr .55fr .78fr .6fr .45fr;gap:8px;align-items:end;margin-bottom:8px;">' +
      '<div style="position:relative;">' +
      '<label style="' + _labelStyle() + '">Produto / Insumo</label>' +
      '<input id="cp-item-display" type="text" placeholder="Buscar produto ou insumo..." autocomplete="off" ' +
        'oninput="Modules.Compras._compraItemSearch(this.value)" ' +
        'onfocus="Modules.Compras._compraItemSearch(this.value)" ' +
        'onblur="setTimeout(function(){var d=document.getElementById(\'cp-item-dropdown\');if(d)d.style.display=\'none\';},200)" ' +
        'style="' + _inputStyle() + '">' +
      '<div id="cp-item-dropdown" style="display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;background:#fff;border:1px solid #EAE4DA;border-radius:10px;max-height:220px;overflow-y:auto;z-index:9999;box-shadow:0 12px 30px rgba(31,31,31,.12);"></div>' +
      '<select id="cp-item" style="display:none;"><option value="">Selecionar...</option>' + itemOpts + '</select>' +
      '</div>' +
      _field('cp-qty', 'Qtd. comprada', '', 'number', 'Modules.Compras._calcCompraLinha()') +
      '<div><label style="' + _labelStyle() + '">Embalagem</label><input id="cp-emb" list="cp-emb-list" placeholder="kg, pacote…" oninput="Modules.Compras._calcCompraLinha()" style="' + _inputStyle() + '"></div>' +
      _field('cp-conteudo', 'Conteúdo (×)', '1', 'number', 'Modules.Compras._calcCompraLinha()') +
      '<div><label style="' + _labelStyle() + '">Unid. base</label><input id="cp-unidade-base" readonly placeholder="—" style="' + _inputStyle() + 'background:#FAF8F4;color:#6F6860;font-weight:600;text-align:center;cursor:default;"></div>' +
      '</div>' +
      (function () {
        var _fc = window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES';
        var _fiscalEnabled = window.FiscalConfig ? FiscalConfig.get(_fc).fiscalModuleEnabled : true;
        var _ivaCols = _fiscalEnabled ? '1fr .75fr .6fr auto' : '1fr .75fr auto';
        return '<div style="display:grid;grid-template-columns:' + _ivaCols + ';gap:8px;align-items:end;">' +
          _field('cp-preco', 'Preço/embalagem (€)', '', 'number', 'Modules.Compras._calcCompraLinha()') +
          _field('cp-desc', 'Desc. un. (€)', '', 'number', 'Modules.Compras._calcCompraLinha()') +
          (_fiscalEnabled ? _field('cp-iva-line', 'IVA %', c.ivaPct || c.iva || '', 'number', 'Modules.Compras._calcCompraLinha()') : '<input id="cp-iva-line" type="hidden" value="">') +
          '<button onclick="Modules.Compras._addCompraLinha()" style="height:40px;padding:0 14px;background:#B42318;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;align-self:end;white-space:nowrap;box-shadow:0 4px 12px rgba(180,35,24,.18);">Adicionar</button>' +
          '</div>';
      }()) +
      '<div id="cp-preview" style="margin-top:8px;font-size:11px;color:#7A746B;min-height:16px;"></div>' +
      '</section>' +
      '<div id="cp-preco-hint"></div>' +
      '<div id="cp-lines"></div><div id="cp-total" style="margin:10px 0 14px;text-align:right;font-weight:600;"></div>' +
      (function () {
        var _fc = window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES';
        var _fiscalEnabled = window.FiscalConfig ? FiscalConfig.get(_fc).fiscalModuleEnabled : true;
        if (!_fiscalEnabled) return '';
        return '<section id="cp-fiscal-card" style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
          '<div style="font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.04em;margin-bottom:10px;">Fiscal</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><input id="cp-ded-iva" type="checkbox" ' + (c.dedutivelIva || c.deductibleVat ? 'checked' : '') + ' style="accent-color:#C4362A;width:16px;height:16px;"> Dedutível para IVA</label>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><input id="cp-ded-irpf" type="checkbox" ' + (c.dedutivelIrpf || c.deductibleIrpf ? 'checked' : '') + ' style="accent-color:#C4362A;width:16px;height:16px;"> Dedutível para IRPF</label>' +
          '</div>' +
          _select('cp-fiscal-cat', 'Categoria fiscal', _fiscalCategoryOptions(c.categoriaFiscal || c.fiscalCategory || 'outro')) +
          '<div style="font-size:11px;color:#7A746B;margin-top:6px;">O IVA pode ser informado em cada item da compra. Se estiver vazio, o Fiscal usa o IVA padrão.</div>' +
          '</section>';
      }()) +
      '<section id="cp-financeiro-section" style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;margin-bottom:12px;"><input id="cp-gerar-apagar" type="checkbox" ' + (c.gerarContaPagar !== false ? 'checked' : '') + ' onchange="Modules.Compras._buildParcelasPreview()" style="accent-color:#C4362A;width:16px;height:16px;"> Gerar conta a pagar</label>' +
      '<div style="margin-bottom:12px;">' + _select('cp-cost-class', 'Classificação do custo', _costClassOptions(c.costClass || 'direto')) + '</div>' +
      '<div style="margin-bottom:12px;">' + _select('cp-forma', 'Forma de pagamento *', _finFormasPagOptions(c.formaPagamento), 'Modules.Compras._buildParcelasPreview()') + '</div>' +
      '<div style="margin-bottom:12px;">' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:#5A4E4C;cursor:pointer;">' +
      '<input id="cp-teve-entrada" type="checkbox" ' + (c.teveEntrada ? 'checked' : '') + ' onchange="Modules.Compras._toggleEntradaSection()" style="accent-color:#C4362A;width:15px;height:15px;"> Teve entrada?</label>' +
      '</div>' +
      '<div id="cp-entrada-section" style="display:' + (c.teveEntrada ? 'block' : 'none') + ';margin-bottom:12px;background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:12px;">' +
      '<div style="font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.04em;margin-bottom:10px;">Dados da entrada</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      _field('cp-entrada-valor', 'Valor da entrada (€) *', c.entradaValor || '', 'number', 'Modules.Compras._buildParcelasPreview()') +
      _field('cp-entrada-data', 'Data da entrada *', c.entradaData || _todayLocal(), 'date', 'Modules.Compras._buildParcelasPreview()') +
      '</div>' +
      '<div style="margin-top:10px;">' + _select('cp-entrada-forma', 'Forma de pagamento da entrada *', _finFormasPagOptions(c.entradaFormaPagamento), 'Modules.Compras._buildParcelasPreview()') + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1.5fr;gap:12px;align-items:end;">' +
      _field('cp-venc', 'Vencimento *', c.dueDate || c.data || '', 'date', 'Modules.Compras._buildParcelasPreview()') +
      _field('cp-prazo', 'Prazo entre parcelas (dias)', c.prazoParcelas || 30, 'number', 'Modules.Compras._buildParcelasPreview()') +
      _field('cp-parcelas', c.teveEntrada ? 'Parcelas restantes' : 'Parcelas', c.parcelas || 1, 'number', 'Modules.Compras._buildParcelasPreview()') +
      _select('cp-fin-cat', 'Categoria financeira *', catOpts) +
      '</div><div id="cp-parcelas-preview"></div></section></div>';
    // Rodapé: para edição, começa com loading enquanto carrega estado financeiro
    var footer = id
      ? '<div id="cp-footer-wrap" style="display:flex;align-items:center;gap:8px;">' +
        '<button onclick="window._compraModal&&window._compraModal.close()" style="' + _cancelStyle() + '">Fechar</button>' +
        '<span style="flex:1;margin-left:8px;font-size:12px;color:#8A7E7C;">Verificando financeiro...</span>' +
        '</div>'
      : '<div id="cp-footer-wrap" style="display:flex;justify-content:flex-end;gap:8px;">' +
        '<button onclick="window._compraModal&&window._compraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
        '<button onclick="Modules.Compras._saveCompra()" style="' + _primaryStyle() + '">Registrar compra</button>' +
        '</div>';
    window._compraModal = UI.modal({ title: id ? 'Editar compra' : 'Nova compra', body: body, footer: footer, maxWidth: '1120px' });
    // Carrega estado financeiro assíncrono para compras existentes
    if (id) {
      _loadEstadoFinanceiro(id).then(function (estado) {
        _compraEstadoFinanceiro = estado;
        _updateCompraModalUI(id, estado);
      }).catch(function () {
        _updateCompraModalUI(id, { hasPaid: false, hasPending: false, paidContas: [], pendingContas: [] });
      });
    }
    setTimeout(_renderCompraLinhas, 50);
  }

  function _paymentOptions(selected) {
    return ['A definir', 'Cartão', 'Débito direto', 'Dinheiro', 'MB WAY', 'Outro', 'Transferência'].map(function (p) {
      return '<option value="' + _esc(p) + '"' + (selected === p ? ' selected' : '') + '>' + _esc(p) + '</option>';
    }).join('');
  }

  // Formas de pagamento reais do módulo Financeiro (com fallback à lista padrão)
  function _finFormasPagOptions(selected) {
    var FALLBACK = ['A definir', 'Cartão', 'Débito direto', 'Dinheiro', 'MB WAY', 'Outro', 'Transferência'];
    var list = (_finFormas && _finFormas.length) ? _finFormas.slice() : FALLBACK.slice();
    if (list.indexOf('A definir') < 0) list.unshift('A definir');
    return list.map(function (p) {
      return '<option value="' + _esc(p) + '"' + (selected === p ? ' selected' : '') + '>' + _esc(p) + '</option>';
    }).join('');
  }

  // Categorias financeiras do tipo saída (para contas a pagar)
  function _finCatSaidaOptions(selected) {
    var cats = (_finCategorias || []).filter(function (c) { return c.tipo === 'saida' || c.tipo === 'expense'; });
    cats = cats.slice().sort(function (a, b) { return (a.nome || a.name || '').localeCompare(b.nome || b.name || ''); });
    var opts = '<option value="">Sem categoria</option>';
    cats.forEach(function (cat) {
      var label = cat.nome || cat.name || '';
      opts += '<option value="' + _esc(cat.id) + '"' + (selected === cat.id ? ' selected' : '') + '>' + _esc(label) + '</option>';
    });
    return opts;
  }

  function _fiscalCategoryOptions(selected) {
    return [
      ['insumo', 'Insumo'],
      ['embalagem', 'Embalagem'],
      ['produto_pronto', 'Produto pronto'],
      ['despesa_operacional', 'Despesa operacional'],
      ['equipamento_investimento', 'Equipamento/investimento'],
      ['servico', 'Serviço'],
      ['outro', 'Outro']
    ].map(function (p) {
      return '<option value="' + p[0] + '"' + (selected === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
    }).join('');
  }

  function _costClassOptions(selected) {
    return [
      ['direto', 'Custo direto'],
      ['indireto', 'Custo indireto'],
      ['despesa', 'Despesa']
    ].map(function (p) {
      return '<option value="' + p[0] + '"' + (selected === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
    }).join('');
  }

  // Filtra o select de itens da compra conforme texto digitado na busca
  function _filterItemSelect() {
    var q = (_el('cp-item-search').value || '').toLowerCase();
    var sel = document.getElementById('cp-item');
    if (!sel) return;
    var source = window._compraAllItems || _itens || [];
    var filtered = q ? source.filter(function (i) { return (i.nome || i.name || '').toLowerCase().indexOf(q) >= 0; }) : source;
    sel.innerHTML = '<option value="">Selecionar...</option>' + filtered.map(function (i) {
      var unidade = i.unidade_base || i.unidadeBase || 'un';
      var embPadrao = (!_isBaseUnit(i.unidade_compra_padrao) ? (i.unidade_compra_padrao || '') : '') ||
                      (!_isBaseUnit(i.ultima_embalagem) ? (i.ultima_embalagem || '') : '');
      var conteudoPadrao = _num(i.conteudo_por_embalagem_padrao) || _num(i.ultimo_conteudo) || 1;
      return '<option value="' + i.id + '" data-unidade="' + _esc(unidade) + '" data-aproveitamento="' + (i.aproveitamento_padrao || 100) + '" data-emb="' + _esc(embPadrao) + '" data-conteudo="' + conteudoPadrao + '" data-classe="' + _esc(i.classe || 'insumo') + '">' + _esc(i.nome || i.name) + '</option>';
    }).join('');
  }

  // Retorna true para unidades de medida (não devem aparecer como embalagem)
  function _isBaseUnit(u) {
    return ['kg', 'g', 'gr', 'l', 'ml', 'kilo', 'litro', 'litros'].indexOf((u || '').toLowerCase().trim()) >= 0;
  }

  // Normaliza string para busca sem acentos (guarana → guaraná funciona)
  function _normalizeStr(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Combobox: filtra e mostra o dropdown de Produto/Insumo no modal de compra
  function _compraItemSearch(q) {
    var dd = document.getElementById('cp-item-dropdown');
    if (!dd) return;
    var source = window._compraAllItems || _itens || [];
    var norm = _normalizeStr(q);
    var filtered = norm ? source.filter(function (i) {
      var forn = _byId(_fornecedores, i.fornecedor_padrao_id);
      var hay = _normalizeStr([i.nome, i.name, i.classe, i.tipo, i.categoria, forn && forn.name].join(' '));
      return hay.indexOf(norm) >= 0;
    }) : source;
    if (!filtered.length) {
      dd.innerHTML = '<div style="padding:10px 14px;color:#8A7E7C;font-size:13px;font-family:inherit;">Nenhum item encontrado.</div>';
      dd.style.display = 'block';
      return;
    }
    dd.innerHTML = filtered.slice(0, 60).map(function (i) {
      var label = _esc(i.nome || i.name || '');
      var sub = _esc([i.tipo, i.categoria, i.classe === 'produto' ? 'Produto' : 'Insumo'].filter(Boolean).join(' · '));
      return '<div onmousedown="Modules.Compras._compraItemSelect(\'' + i.id + '\')" ' +
        'style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #F2EDED;font-size:13px;font-family:inherit;" ' +
        'onmouseover="this.style.background=\'#FFF5F5\'" onmouseout="this.style.background=\'\'">' +
        '<div style="font-weight:500;color:#1A1A1A;">' + label + '</div>' +
        (sub ? '<div style="font-size:11px;color:#8A7E7C;margin-top:2px;">' + sub + '</div>' : '') +
        '</div>';
    }).join('');
    dd.style.display = 'block';
  }

  // Combobox: seleciona um item e dispara _onCompraItemChange
  function _compraItemSelect(id) {
    var sel = document.getElementById('cp-item');
    var disp = document.getElementById('cp-item-display');
    var dd = document.getElementById('cp-item-dropdown');
    if (!sel) return;
    sel.value = id;
    var source = window._compraAllItems || _itens || [];
    var item = null;
    for (var ix = 0; ix < source.length; ix++) { if (source[ix].id === id) { item = source[ix]; break; } }
    if (disp) disp.value = item ? (item.nome || item.name || '') : '';
    if (dd) dd.style.display = 'none';
    _onCompraItemChange();
  }

  // Combobox: filtra e mostra o dropdown de Fornecedor no modal de compra
  function _compraFornSearch(q) {
    var dd = document.getElementById('cp-forn-dropdown');
    if (!dd) return;
    var norm = _normalizeStr(q);
    var source = _fornecedores.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var filtered = norm ? source.filter(function (f) {
      var hay = _normalizeStr([f.name, f.contact, f.nif, f.phone, f.whatsapp, f.email, f.state, f.estado].join(' '));
      return hay.indexOf(norm) >= 0;
    }) : source;
    if (!filtered.length) {
      dd.innerHTML = '<div style="padding:10px 14px;color:#8A7E7C;font-size:13px;font-family:inherit;">Nenhum fornecedor encontrado.</div>';
      dd.style.display = 'block';
      return;
    }
    // Opção "Sem fornecedor"
    var items = '<div onmousedown="Modules.Compras._compraFornSelect(\'\')" ' +
      'style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #F2EDED;font-size:13px;font-family:inherit;" ' +
      'onmouseover="this.style.background=\'#FFF5F5\'" onmouseout="this.style.background=\'\'">' +
      '<div style="color:#8A7E7C;font-style:italic;">Sem fornecedor</div>' +
      '</div>';
    items += filtered.slice(0, 60).map(function (f) {
      var sub = [f.contact, f.email, f.state || f.estado].filter(Boolean).map(_esc).join(' · ');
      return '<div onmousedown="Modules.Compras._compraFornSelect(\'' + f.id + '\')" ' +
        'style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #F2EDED;font-size:13px;font-family:inherit;" ' +
        'onmouseover="this.style.background=\'#FFF5F5\'" onmouseout="this.style.background=\'\'">' +
        '<div style="font-weight:500;color:#1A1A1A;">' + _esc(f.name || '-') + '</div>' +
        (sub ? '<div style="font-size:11px;color:#8A7E7C;margin-top:2px;">' + sub + '</div>' : '') +
        '</div>';
    }).join('');
    dd.innerHTML = items;
    dd.style.display = 'block';
  }

  // Combobox: seleciona um fornecedor e dispara _buildParcelasPreview
  function _compraFornSelect(id) {
    var sel = document.getElementById('cp-forn');
    var disp = document.getElementById('cp-forn-display');
    var dd = document.getElementById('cp-forn-dropdown');
    if (!sel) return;
    sel.value = id;
    var forn = id ? (_byId(_fornecedores, id) || {}) : null;
    if (disp) disp.value = forn ? (forn.name || '') : '';
    if (dd) dd.style.display = 'none';
    _buildParcelasPreview();
  }

  // ── Helpers de telefone com DDI ───────────────────────────────────────────

  function _parsePhoneValue(val, defaultDdi) {
    var fallback = defaultDdi || '+34';
    if (!val) return { ddi: fallback, number: '' };
    var m = String(val).match(/^(\+\d{1,3})\s?(.*)/);
    if (m) {
      for (var i = 0; i < PHONE_COUNTRIES.length; i++) {
        if (PHONE_COUNTRIES[i].ddi === m[1]) return { ddi: m[1], number: m[2] };
      }
    }
    return { ddi: fallback, number: val };
  }

  function _phoneField(idPrefix, label, savedValue, defaultDdi) {
    var p = _parsePhoneValue(savedValue, defaultDdi);
    var selSty = 'flex:0 0 auto;padding:10px 6px;width:88px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:13px;font-family:inherit;outline:none;background:#fff;cursor:pointer;box-sizing:border-box;';
    var opts = PHONE_COUNTRIES.map(function (c) {
      return '<option value="' + c.ddi + '"' + (p.ddi === c.ddi ? ' selected' : '') + '>' + c.flag + ' ' + c.ddi + '</option>';
    }).join('');
    return '<div><label style="' + _labelStyle() + '">' + label + '</label>' +
      '<div style="display:flex;gap:6px;">' +
      '<select id="' + idPrefix + '-ddi" style="' + selSty + '">' + opts + '</select>' +
      '<input id="' + idPrefix + '-num" type="tel" value="' + _esc(p.number) + '" placeholder="600 000 000" inputmode="tel" style="' + _inputStyle() + 'flex:1;width:auto;">' +
      '</div></div>';
  }

  function _phoneValue(idPrefix) {
    var ddiEl = document.getElementById(idPrefix + '-ddi');
    var numEl = document.getElementById(idPrefix + '-num');
    var ddi = ddiEl ? ddiEl.value : '+34';
    var num = (numEl ? numEl.value : '').trim();
    if (!num) return '';
    return ddi + ' ' + num;
  }

  function _countryCode(countryVal) {
    var raw = String(countryVal || '').trim();
    if (!raw) return '';
    if (window.FiscalConfig && FiscalConfig.countryToCode) {
      var mapped = FiscalConfig.countryToCode(raw);
      if (mapped) return mapped;
    }
    raw = raw.toUpperCase();
    if (raw === 'ES' || raw === 'PT') return raw;
    if (raw === 'PORTUGAL') return 'PT';
    if (raw === 'ESPAÑA' || raw === 'ESPANHA') return 'ES';
    return '';
  }

  function _defaultPhoneDdiForCountry(countryVal) {
    return _countryCode(countryVal) === 'PT' ? '+351' : '+34';
  }

  // ── Google Places Autocomplete ─────────────────────────────────────────────

  // Inicializa autocomplete do campo de endereço no modal de Fornecedor.
  // Usa a configuração global (BocaPlaces) — ativa apenas se a chave estiver configurada no Admin Master.
  function _initAddressAutocomplete() {
    if (!window.BocaPlaces) return;
    BocaPlaces.loadConfig().then(function () {
      BocaPlaces.loadScript(function () {
        var input = document.getElementById('fo-address');
        if (!input || input._bocaAc) return;
        try {
          var ac = new window.google.maps.places.Autocomplete(input, { types: ['address'] });
          input._bocaAc = true;
          ac.addListener('place_changed', function () {
            var place = ac.getPlace();
            if (!place || !place.address_components) return;
            var comp = {};
            for (var i = 0; i < place.address_components.length; i++) {
              var c = place.address_components[i];
              for (var j = 0; j < c.types.length; j++) { comp[c.types[j]] = c.long_name; }
            }
            var neighborhood = comp.neighborhood || comp.sublocality_level_1 || comp.locality || '';
            var state = comp.administrative_area_level_2 || comp.administrative_area_level_1 || '';
            var country = comp.country || '';
            var neighborEl = document.getElementById('fo-neighborhood');
            var stateEl = document.getElementById('fo-state');
            var countryEl = document.getElementById('fo-country');
            if (neighborEl) neighborEl.value = neighborhood;
            if (stateEl && state) stateEl.value = state;
            var countryMap = { 'Spain': 'España', 'Portugal': 'Portugal', 'France': 'Francia',
              'Italy': 'Italia', 'Germany': 'Alemania', 'United Kingdom': 'Reino Unido',
              'United States': 'Otro', 'Belgium': 'Bélgica', 'Netherlands': 'Países Bajos' };
            if (countryEl && country) {
              var mapped = countryMap[country] || 'Otro';
              var copts = countryEl.options;
              for (var l = 0; l < copts.length; l++) {
                if (copts[l].value === mapped) { countryEl.value = copts[l].value; break; }
              }
            }
          });
        } catch (e) { /* Places unavailable — silent fallback */ }
      });
    }).catch(function () { /* fail silently */ });
  }

  function _onCompraItemChange() {
    var sel = document.getElementById('cp-item');
    var opt = sel ? sel.options[sel.selectedIndex] : null;
    var itemId = sel ? sel.value : '';
    var unidadeBase = (opt && opt.dataset.unidade) || 'un';
    // Mostra unidade base no campo read-only
    var ubEl = document.getElementById('cp-unidade-base');
    if (ubEl) ubEl.value = itemId ? unidadeBase : '';
    if (!itemId) {
      // Sem item: desbloquear conteúdo
      var cEl = document.getElementById('cp-conteudo');
      if (cEl) { cEl.disabled = false; cEl.style.opacity = ''; cEl.style.cursor = ''; }
      _calcCompraLinha(); return;
    }
    var embEl = document.getElementById('cp-emb');
    var conteudoEl = document.getElementById('cp-conteudo');
    var precoEl = document.getElementById('cp-preco');
    var hintEl = document.getElementById('cp-preco-hint');
    // Padrões do cadastro do item (data-emb / data-conteudo nos <option>)
    var embPadraoItem = (opt && opt.dataset.emb) || '';
    var conteudoPadraoItem = parseFloat((opt && opt.dataset.conteudo) || '1') || 1;
    var isProduto = (opt && opt.dataset.classe) === 'produto';
    // Para Produto: conteúdo fixo em 1 e bloqueado
    if (conteudoEl) {
      if (isProduto) {
        conteudoEl.value = '1';
        conteudoEl.disabled = true;
        conteudoEl.style.opacity = '0.45';
        conteudoEl.style.cursor = 'not-allowed';
      } else {
        conteudoEl.disabled = false;
        conteudoEl.style.opacity = '';
        conteudoEl.style.cursor = '';
      }
    }
    // Última configuração de compra (usada para embalagem e preço; conteúdo ignorado para Produto)
    var lastCfg = _getLastCompraConfig(itemId);
    if (lastCfg) {
      // Se a embalagem salva for uma unidade base (dado antigo: 'kg', 'g' etc.), usar o padrão do item
      var embFromCfg = (!_isBaseUnit(lastCfg.embalagem) ? lastCfg.embalagem : embPadraoItem) || '';
      if (embEl) embEl.value = embFromCfg;
      if (conteudoEl && !isProduto) conteudoEl.value = lastCfg.conteudo || conteudoPadraoItem || 1;
      if (precoEl && !precoEl.value) precoEl.value = lastCfg.precoPago;
      var conteudo = lastCfg.conteudo || 1;
      var embLabel = embFromCfg
        ? (conteudo > 1 ? '1 ' + _esc(embFromCfg) + ' × ' + conteudo + ' ' + _esc(unidadeBase) : _esc(embFromCfg))
        : (conteudo + ' ' + _esc(unidadeBase));
      if (hintEl) hintEl.innerHTML = '<div style="padding:4px 0;font-size:11px;color:#8A7E7C;">Última compra: <strong style="color:#5A4E4C;">' + embLabel + '</strong> · <strong style="color:#1A9E5A;">€' + lastCfg.precoPago.toFixed(2) + '</strong></div>';
    } else {
      // Sem histórico: usar defaults do cadastro — NUNCA a unidade base
      if (embEl) embEl.value = embPadraoItem;
      if (conteudoEl && !isProduto) conteudoEl.value = conteudoPadraoItem;
      if (hintEl) hintEl.innerHTML = embPadraoItem
        ? '<div style="padding:4px 0;font-size:11px;color:#8A7E7C;">Embalagem padrão: <strong style="color:#5A4E4C;">' + _esc(embPadraoItem) + (conteudoPadraoItem > 1 ? ' × ' + conteudoPadraoItem + ' ' + _esc(unidadeBase) : '') + '</strong></div>'
        : '';
    }
    _calcCompraLinha();
  }

  // Fator de conversão entre unidade de compra e unidade base (para sub-unidades conhecidas)
  function _convFactor(emb, base) {
    var e = (emb || '').toLowerCase().trim();
    var b = (base || '').toLowerCase().trim();
    if ((e === 'g' || e === 'gr') && (b === 'kg' || b === 'kilo')) return 0.001;
    if (e === 'ml' && (b === 'l' || b === 'litro' || b === 'litros')) return 0.001;
    if ((e === 'kg' || e === 'kilo') && (b === 'g' || b === 'gr')) return 1000;
    if ((e === 'l' || e === 'litro') && b === 'ml') return 1000;
    return 1;
  }

  // Mantido para compatibilidade com compras antigas sem conteudoPorEmbalagem
  function _toBase(qty, unidadeCompra, unidadeBase) {
    return qty * _convFactor(unidadeCompra, unidadeBase);
  }

  function _calcCompraLinha() {
    var sel = document.getElementById('cp-item');
    var opt = sel ? sel.options[sel.selectedIndex] : null;
    var unidadeBase = (opt && opt.dataset.unidade) || 'un';
    var aproveitamento = parseFloat((opt && opt.dataset.aproveitamento) || '100') || 100;
    var qty = parseFloat((_el('cp-qty').value || '0')) || 0;
    var emb = (document.getElementById('cp-emb') ? document.getElementById('cp-emb').value : '') || unidadeBase;
    var conteudo = Math.max(parseFloat((document.getElementById('cp-conteudo') ? document.getElementById('cp-conteudo').value : '') || '1') || 1, 0.000001);
    var precoUnit = _num(_el('cp-preco').value);  // preço por embalagem
    var descontoUnitario = _num(_el('cp-desc').value);
    var ivaPct = _num(_el('cp-iva-line').value);
    var preview = document.getElementById('cp-preview');
    if (!preview || !qty || !precoUnit || !sel || !sel.value) { if (preview) preview.innerHTML = ''; return; }
    var qtyBase = qty * conteudo * _convFactor(emb, unidadeBase);
    var totalBruto = qty * precoUnit;
    if (descontoUnitario > precoUnit) {
      preview.innerHTML = '<span style="color:#C4362A;font-weight:600;">O desconto por unidade não pode ser maior que o preço por embalagem.</span>';
      return;
    }
    var descontoTotal = descontoUnitario * qty;
    var precoLiquidoUnitario = Math.max(0, precoUnit - descontoUnitario);
    var totalLinha = precoLiquidoUnitario * qty;
    var valorSemIva = ivaPct > 0 ? totalLinha / (1 + ivaPct / 100) : totalLinha;
    var ivaValor = totalLinha - valorSemIva;
    var custo = qtyBase > 0 ? valorSemIva / qtyBase / (aproveitamento / 100) : 0;
    var compraDesc = qty + ' ' + _esc(emb) + (conteudo !== 1 ? ' × ' + conteudo + ' ' + _esc(unidadeBase) : '');
    var estoqueDesc = qtyBase.toFixed(qtyBase < 0.01 ? 6 : 3) + ' ' + _esc(unidadeBase);
    var parts = [
      'Compra: <strong>' + compraDesc + '</strong> → Estoque: <strong style="color:#2563EB;">+' + estoqueDesc + '</strong>'
    ];
    if (descontoUnitario > 0) {
      parts.push('Preço bruto unitário: <strong>' + UI.fmt(precoUnit) + '</strong>');
      parts.push('Desconto unitário: <strong style="color:#C4362A;">-' + UI.fmt(descontoUnitario) + '</strong>');
      parts.push('Desconto total: <strong style="color:#C4362A;">-' + UI.fmt(descontoTotal) + '</strong>');
      parts.push('Total líquido: <strong style="color:#C4362A;">' + UI.fmt(totalLinha) + '</strong>');
    } else {
      parts.push('Total: <strong style="color:#C4362A;">' + UI.fmt(totalLinha) + '</strong>');
    }
    parts.push('Custo/base: <strong style="color:#1A9E5A;">€' + custo.toFixed(custo < 0.01 ? 6 : 4) + '/' + _esc(unidadeBase) + '</strong>');
    if (ivaPct > 0) parts.push('IVA: <strong>' + UI.fmt(ivaValor) + '</strong>');
    preview.innerHTML = parts.join('<br>');
  }

  function _addCompraLinha() {
    var sel = document.getElementById('cp-item');
    var opt = sel ? sel.options[sel.selectedIndex] : null;
    if (!sel || !sel.value) { UI.toast('Selecione um produto/insumo', 'error'); return; }
    var qty = parseFloat(_el('cp-qty').value || '0') || 0;
    var precoUnit = _num(_el('cp-preco').value);  // preço por embalagem
    if (qty <= 0 || precoUnit <= 0) { UI.toast('Quantidade e preço por embalagem são obrigatórios', 'error'); return; }
    var unidadeBase = (opt && opt.dataset.unidade) || 'un';
    var embEl = document.getElementById('cp-emb');
    var conteudoEl = document.getElementById('cp-conteudo');
    var emb = (embEl ? embEl.value : '') || unidadeBase;
    var conteudo = Math.max(parseFloat((conteudoEl ? conteudoEl.value : '') || '1') || 1, 0.000001);
    var descontoUnitario = _num(_el('cp-desc').value);
    var ivaPct = _num(_el('cp-iva-line').value);
    var aproveitamento = parseFloat((opt && opt.dataset.aproveitamento) || '100') || 100;
    var qtyBase = qty * conteudo * _convFactor(emb, unidadeBase);
    var totalBruto = qty * precoUnit;
    if (descontoUnitario > precoUnit) { UI.toast('O desconto por unidade não pode ser maior que o preço por embalagem.', 'error'); return; }
    var descontoTotal = descontoUnitario * qty;
    var precoLiquidoUnitario = Math.max(0, precoUnit - descontoUnitario);
    var totalLinha = precoLiquidoUnitario * qty;
    var valorSemIva = ivaPct > 0 ? totalLinha / (1 + ivaPct / 100) : totalLinha;
    var ivaValor = totalLinha - valorSemIva;
    var custoAjustado = qtyBase > 0 ? valorSemIva / qtyBase / (aproveitamento / 100) : 0;
    window._compraLinhas.push({
      itemId: sel.value,
      itemNome: opt ? opt.text : '',
      qtdComprada: qty,
      unidadeCompra: emb,
      conteudoPorEmbalagem: conteudo,
      unidadeBase: unidadeBase,
      precoUnitario: precoUnit,       // preço por embalagem (o que o user digitou)
      precoEmbalagem: precoUnit,
      precoPago: precoUnit,           // mantido para compat com _getLastCompraConfig
      quantidadeComprada: qty,
      desconto: descontoTotal,        // compat: desconto total da linha
      descontoUnitario: descontoUnitario,
      descontoTotal: descontoTotal,
      totalBruto: totalBruto,
      precoLiquidoUnitario: precoLiquidoUnitario,
      totalLinha: totalLinha,
      totalLiquido: totalLinha,
      ivaPct: ivaPct,
      ivaValor: ivaValor,
      valorSemIva: valorSemIva,
      qtyBase: qtyBase,
      aproveitamento: aproveitamento,
      custoAjustado: custoAjustado,
      custoBaseUnitario: custoAjustado
    });
    // Limpa formulário
    sel.value = '';
    var dispEl = document.getElementById('cp-item-display');
    if (dispEl) dispEl.value = '';
    var ddEl = document.getElementById('cp-item-dropdown');
    if (ddEl) ddEl.style.display = 'none';
    _el('cp-qty').value = '';
    if (embEl) embEl.value = '';
    if (conteudoEl) { conteudoEl.value = '1'; conteudoEl.disabled = false; conteudoEl.style.opacity = ''; conteudoEl.style.cursor = ''; }
    _el('cp-preco').value = '';
    _el('cp-desc').value = '';
    var ubEl = document.getElementById('cp-unidade-base');
    if (ubEl) ubEl.value = '';
    var hintEl = document.getElementById('cp-preco-hint');
    if (hintEl) hintEl.innerHTML = '';
    _renderCompraLinhas();
  }

  function _renderCompraLinhas() {
    var el = document.getElementById('cp-lines');
    var totalEl = document.getElementById('cp-total');
    if (!el) return;
    var linhas = window._compraLinhas || [];
    if (!linhas.length) {
      el.innerHTML = '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);padding:18px;text-align:center;color:#7A746B;font-size:13px;">Nenhum item adicionado.</div>';
      if (totalEl) totalEl.innerHTML = '';
      _buildParcelasPreview();
      return;
    }
    var total = linhas.reduce(function (s, l) { return s + _lineTotal(l); }, 0);
    var semIva = linhas.reduce(function (s, l) { return s + (_num(l.valorSemIva) || _lineTotal(l)); }, 0);
    var iva = linhas.reduce(function (s, l) { return s + _num(l.ivaValor); }, 0);
    el.innerHTML = '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="overflow:auto;"><table style="width:100%;border-collapse:separate;border-spacing:0;">' +
      _thead(['Item', 'Compra', '+Estoque', '€/embal. · Total', 'Custo/base', '']) +
      '<tbody>' + linhas.map(function (l, idx) {
        // Compat: linhas antigas sem conteudoPorEmbalagem
        var conteudo = _num(l.conteudoPorEmbalagem) || 1;
        var emb = l.unidadeCompra || l.unidadeBase || '';
        var compraCell = (conteudo > 1)
          ? l.qtdComprada + ' ' + _esc(emb) + ' × ' + conteudo + ' ' + _esc(l.unidadeBase)
          : l.qtdComprada + ' ' + _esc(emb);
        var qtyBase = _num(l.qtyBase);
        var estoqueCell = '+' + (qtyBase).toFixed(qtyBase < 0.01 ? 6 : 3) + ' ' + _esc(l.unidadeBase);
        // Mostra preço por embalagem + total da linha
        var precoUnit = _num(l.precoUnitario) || _num(l.precoPago);
        var totalLinha = _lineTotal(l);
        var descontoUnitarioLinha = _num(l.descontoUnitario);
        var descontoTotalLinha = _num(l.descontoTotal || l.desconto);
        if (!descontoUnitarioLinha && descontoTotalLinha > 0 && _num(l.qtdComprada) > 0) descontoUnitarioLinha = descontoTotalLinha / _num(l.qtdComprada);
        var precoCell = UI.fmt(precoUnit) + '/embal.'
          + (descontoTotalLinha > 0 ? '<small style="color:#C4362A;display:block;">Desc. un.: -' + UI.fmt(descontoUnitarioLinha || descontoTotalLinha) + '</small><small style="color:#C4362A;display:block;">Desc. total: -' + UI.fmt(descontoTotalLinha) + '</small>' : '')
          + '<small style="color:#8A7E7C;display:block;">Total: ' + UI.fmt(totalLinha) + (l.ivaPct ? ' · IVA ' + l.ivaPct + '%' : '') + '</small>';
        var custo = l.custoAjustado || 0;
        return '<tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
          _td(_esc(l.itemNome), true) +
          _td(compraCell) +
          _td('<span style="color:#5B7A67;font-weight:600;">' + estoqueCell + '</span>') +
          _td(precoCell) +
          _td('<strong style="color:#5B7A67;">€' + custo.toFixed(custo < 0.01 ? 6 : 4) + '/' + _esc(l.unidadeBase) + '</strong>') +
          '<td style="padding:13px 16px;text-align:right;"><button onclick="Modules.Compras._removeCompraLinha(' + idx + ')" style="' + _iconBtn('#fff', '#B42318') + '"><span class="mi" style="font-size:14px;">close</span></button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    if (totalEl) totalEl.innerHTML = '<div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;">' + _chip('Sem IVA ' + UI.fmt(semIva)) + _chip('IVA ' + UI.fmt(iva)) + '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:600;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.02);">Total ' + UI.fmt(total) + '</span></div>';
    _buildParcelasPreview();
  }

  function _removeCompraLinha(idx) {
    (window._compraLinhas || []).splice(idx, 1);
    _renderCompraLinhas();
  }

  function _saveCompra() {
    if (_savingCompra) return;
    // Bloqueia se há pagamento confirmado (Fluxo 3)
    if (_compraEstadoFinanceiro && _compraEstadoFinanceiro.hasPaid) {
      UI.toast('Esta compra possui pagamento confirmado. Estorne os pagamentos antes de editar.', 'error');
      return;
    }
    var data = _dateInputValue('cp-data');
    var linhas = window._compraLinhas || [];
    if (!data) { UI.toast('Data obrigatória', 'error'); return; }
    if (!linhas.length) { UI.toast('Adicione pelo menos um item', 'error'); return; }
    var total = linhas.reduce(function (s, l) { return s + _lineTotal(l); }, 0);
    var valorSemIva = linhas.reduce(function (s, l) { return s + (_num(l.valorSemIva) || _lineTotal(l)); }, 0);
    var ivaValor = linhas.reduce(function (s, l) { return s + _num(l.ivaValor); }, 0);
    var ivaPctList = linhas.map(function (l) { return _num(l.ivaPct); }).filter(function (v) { return v > 0; });
    var currentCompra = _editingId ? (_byId(_compras, _editingId) || {}) : {};
    var compraData = {
      data: data,
      fornecedorId: _el('cp-forn').value,
      statusCompra: _el('cp-status').value || 'Pendente',
      numDocumento: _el('cp-doc').value,
      observacoes: _el('cp-obs').value,
      total: total,
      valorSemIva: valorSemIva,
      ivaValor: ivaValor,
      ivaPct: ivaPctList.length ? ivaPctList[0] : 0,
      itens: linhas,
      dedutivelIva: _el('cp-ded-iva').checked,
      dedutivelIrpf: _el('cp-ded-irpf').checked,
      categoriaFiscal: _el('cp-fiscal-cat').value || 'outro',
      costClass: _el('cp-cost-class').value || 'direto',
      gerarContaPagar: _el('cp-gerar-apagar').checked,
      contaBancariaId: currentCompra.contaBancariaId || '',
      contaBancariaNome: currentCompra.contaBancariaNome || '',
      contaBancariaOrigem: currentCompra.contaBancariaOrigem || '',
      formaPagamento: _el('cp-forma').value,
      dueDate: _dateInputValue('cp-venc'),
      parcelas: parseInt(_el('cp-parcelas').value || '1', 10) || 1,
      prazoParcelas: parseInt(_el('cp-prazo').value || '30', 10) || 30,
      categoriaFinanceiraId: _el('cp-fin-cat').value,
      teveEntrada: !!(document.getElementById('cp-teve-entrada') && document.getElementById('cp-teve-entrada').checked),
      entradaValor: _num(_el('cp-entrada-valor').value),
      entradaData: _dateInputValue('cp-entrada-data'),
      entradaFormaPagamento: _el('cp-entrada-forma').value || '',
      entradaContaBancariaId: currentCompra.entradaContaBancariaId || '',
      entradaContaBancariaNome: currentCompra.entradaContaBancariaNome || '',
      entradaContaBancariaOrigem: currentCompra.entradaContaBancariaOrigem || ''
    };
    if (compraData.gerarContaPagar) {
      if (!_compraParcelasPreview.length) _buildParcelasPreview();
      compraData.parcelasPreview = _compraParcelasPreview.map(function (p) { return Object.assign({}, p); });
    } else {
      compraData.parcelasPreview = [];
    }
    var currentCompraAtual = _editingId ? _byId(_compras, _editingId) : null;
    var finInfo = _editingId ? (_comprasFinanceiroStatus[_editingId] || {}) : {};
    if (_editingId && finInfo.active > 0 && _financeiroSignature(currentCompraAtual) !== _financeiroSignature(compraData)) {
      compraData.contaPagarStatus = 'pendente_atualizacao';
    }
    _doSaveCompra(compraData, _editingId, total, 'save_only');
  }

  function _deleteCompra(id) {
    // Carrega estado antes de confirmar (pode ser chamado da tabela ou do modal)
    _loadEstadoFinanceiro(id).then(function (estado) {
      if (estado.hasPaid) {
        UI.toast('Esta compra possui pagamentos confirmados. Estorne os pagamentos antes de excluir.', 'error');
        return;
      }
      if (estado.hasPending) {
        UI.confirm('Esta ação também removerá as parcelas pendentes vinculadas a esta compra. Excluir mesmo assim?')
          .then(function (yes) {
            if (!yes) return;
            if (window._compraModal) window._compraModal.close();
            _doDeleteCompra(id, estado.pendingContas);
          });
      } else {
        UI.confirm('Eliminar esta compra?').then(function (yes) {
          if (!yes) return;
          if (window._compraModal) window._compraModal.close();
          _doDeleteCompra(id, []);
        });
      }
    }).catch(function () {
      // Fallback sem estado: confirmação simples
      UI.confirm('Eliminar esta compra?').then(function (yes) {
        if (!yes) return;
        if (window._compraModal) window._compraModal.close();
        _doDeleteCompra(id, []);
      });
    });
  }

  // ── Produtos / Insumos ────────────────────────────────────────────────────
  function _renderItens() {
    Promise.all([DB.getAll('itens_custo'), DB.getAll('fornecedores'), DB.getAll('unidades_medida'), DB.getAll('compras_tipos'), DB.getAll('compras_categorias')]).then(function (r) {
      _itens = (r[0] || []).sort(function (a, b) { return (a.nome || '').localeCompare(b.nome || ''); });
      _fornecedores = r[1] || [];
      _unidades = r[2] || [];
      _tipos = r[3] || [];
      _categorias = r[4] || [];
      _syncItemFiltersToCatalog();
      _paintItens();
    });
  }

  function _catalogList(kind, classe, strictClass) {
    var list = kind === 'tipos' ? _tipos : _categorias;
    var classKey = String(classe || '').trim();
    return (list || []).filter(function (item) {
      if (!item || item.ativo === false) return false;
      if (!classKey) return true;
      if (strictClass) return item.classe === classKey;
      return !item.classe || item.classe === classKey || item.classe === 'ambos';
    }).slice().sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  function _catalogNames(kind, classe, strictClass) {
    return _catalogList(kind, classe, strictClass).map(function (item) { return item.name; }).filter(Boolean);
  }

  function _catalogOptions(kind, selected, classe, emptyLabel, strictClass) {
    var names = _catalogNames(kind, classe, strictClass);
    var selectedExists = selected && names.indexOf(selected) >= 0;
    var html = '<option value="">' + _esc(emptyLabel || 'Não informado') + '</option>';
    if (!selectedExists && selected) {
      html = '<option value="" selected>Não informado</option>';
    }
    html += names.map(function (name) {
      return '<option value="' + _esc(name) + '"' + (selected === name ? ' selected' : '') + '>' + _esc(name) + '</option>';
    }).join('');
    return html;
  }

  function _normCatalogName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function _findCatalogByName(kind, name, classe, strictClass) {
    var norm = _normCatalogName(name);
    if (!norm) return null;
    var classKey = String(classe || '').trim();
    var source = kind === 'tipos' ? _tipos : _categorias;
    return (source || []).find(function (item) {
      if (!item) return false;
      var itemClass = item.classe || '';
      var classOk = !classKey || (strictClass ? itemClass === classKey : (!itemClass || itemClass === classKey || itemClass === 'ambos'));
      return classOk && _normCatalogName(item.name) === norm;
    }) || null;
  }

  function _catalogDropdownStyle() {
    return 'display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:10000;background:#fff;border:1px solid #EAE4DA;border-radius:10px;max-height:220px;overflow-y:auto;box-shadow:0 12px 30px rgba(31,31,31,.12);';
  }

  function _dropdownItemHtml(label, sub, action, strongColor) {
    return '<div onmousedown="' + action + '" style="padding:9px 12px;cursor:pointer;border-bottom:1px solid #EAE4DA;font-size:13px;font-family:inherit;background:#fff;" onmouseover="this.style.background=\'#FBF8F2\'" onmouseout="this.style.background=\'#fff\'">' +
      '<div style="font-weight:600;color:' + (strongColor || '#1F1F1F') + ';">' + _esc(label) + '</div>' +
      (sub ? '<div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(sub) + '</div>' : '') +
      '</div>';
  }

  function _searchableCatalogField(kind, id, label, selected, classe, strictClass) {
    var selectedName = selected || '';
    return '<div style="position:relative;"><label style="' + _labelStyle() + '">' + label + '</label>' +
      '<input id="' + id + '-display" type="text" autocomplete="off" value="' + _esc(selectedName) + '" placeholder="Buscar ou cadastrar..." ' +
        'oninput="Modules.Compras._catalogSearch(\'' + id + '\',\'' + kind + '\',this.value)" ' +
        'onfocus="Modules.Compras._catalogSearch(\'' + id + '\',\'' + kind + '\',this.value)" ' +
        'onblur="setTimeout(function(){var d=document.getElementById(\'' + id + '-dropdown\');if(d)d.style.display=\'none\';},180)" ' +
        'style="' + _inputStyle() + 'background:#fff;">' +
      '<input id="' + id + '" type="hidden" value="' + _esc(selectedName) + '" data-kind="' + kind + '" data-classe="' + _esc(classe || '') + '" data-strict-class="' + (strictClass ? '1' : '0') + '">' +
      '<div id="' + id + '-dropdown" style="' + _catalogDropdownStyle() + '"></div>' +
      '</div>';
  }

  function _packageValue(value) {
    var norm = _normCatalogName(value);
    if (!norm) return '';
    var aliases = { un: 'unidade', unidad: 'unidade', unidade: 'unidade', botella: 'garrafa', caja: 'caixa' };
    var mapped = aliases[norm] || norm;
    return PACKAGE_OPTIONS_PT.indexOf(mapped) >= 0 ? mapped : '';
  }

  function _searchablePackageField(id, label, selected) {
    var value = _packageValue(selected);
    return '<div style="position:relative;"><label style="' + _labelStyle() + '">' + label + '</label>' +
      '<input id="' + id + '-display" type="text" autocomplete="off" value="' + _esc(value) + '" placeholder="Selecionar embalagem..." ' +
        'oninput="Modules.Compras._packageSearch(\'' + id + '\',this.value)" ' +
        'onfocus="Modules.Compras._packageSearch(\'' + id + '\',this.value)" ' +
        'onblur="setTimeout(function(){var d=document.getElementById(\'' + id + '-dropdown\');if(d)d.style.display=\'none\';},180)" ' +
        'style="' + _inputStyle() + 'background:#fff;">' +
      '<input id="' + id + '" type="hidden" value="' + _esc(value) + '">' +
      '<div id="' + id + '-dropdown" style="' + _catalogDropdownStyle() + '"></div>' +
      '</div>';
  }

  function _syncItemFiltersToCatalog() {
    var insumosOnly = _itensView === 'insumos';
    var classe = insumosOnly ? 'insumo' : (_itensFilters.classe || '');
    var strictClass = !!insumosOnly;
    var tipos = insumosOnly ? _availableInsumoFilterValues('tipo') : _catalogNames('tipos', classe, strictClass);
    var categorias = insumosOnly ? _availableInsumoFilterValues('categoria') : _catalogNames('categorias', classe, strictClass);
    if (_itensFilters.tipo && tipos.indexOf(_itensFilters.tipo) < 0) _itensFilters.tipo = '';
    if (_itensFilters.categoria && categorias.indexOf(_itensFilters.categoria) < 0) _itensFilters.categoria = '';
  }

  function _refreshItemViews() {
    _syncItemFiltersToCatalog();
    if (_activeSub === 'itens' || document.getElementById('compras-itens-table')) {
      _paintItens();
    }
    _refreshOpenItemModalCatalog();
  }

  function _refreshOpenItemModalCatalog() {
    var tipoEl = document.getElementById('it-tipo');
    var catEl = document.getElementById('it-categoria');
    if (!tipoEl && !catEl) return;
    var classeEl = document.getElementById('it-classe');
    var classe = classeEl ? (classeEl.value || 'insumo') : 'insumo';
    var strictClass = tipoEl && tipoEl.dataset.strictClass === '1' || catEl && catEl.dataset.strictClass === '1';
    var curTipo = tipoEl ? tipoEl.value : '';
    var curCat = catEl ? catEl.value : '';
    if (tipoEl && curTipo && !_findCatalogByName('tipos', curTipo, classe, strictClass)) _catalogSelect('it-tipo', '');
    if (catEl && curCat && !_findCatalogByName('categorias', curCat, classe, strictClass)) _catalogSelect('it-categoria', '');
  }

  function _itemFilterBase(ignoreField) {
    var insumosOnly = _itensView === 'insumos';
    var q = (_itensFilters.q || '').toLowerCase();
    return (_itens || []).filter(function (i) {
      if (insumosOnly && i.classe === 'produto') return false;
      if (_itensFilters.classe && i.classe !== _itensFilters.classe) return false;
      if (ignoreField !== 'tipo' && _itensFilters.tipo && i.tipo !== _itensFilters.tipo) return false;
      if (ignoreField !== 'categoria' && _itensFilters.categoria && i.categoria !== _itensFilters.categoria) return false;
      if (_itensFilters.ativo === 'ativo' && i.ativo === false) return false;
      if (_itensFilters.ativo === 'inativo' && i.ativo !== false) return false;
      if (!q) return true;
      var forn = _byId(_fornecedores, i.fornecedor_padrao_id);
      var hay = [i.nome, i.name, i.tipo, i.categoria, i.classe, i.unidade_base, i.unidadeBase, i.unidade_compra_padrao, forn && forn.name].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function _availableItemFilterValues(field) {
    var insumosOnly = _itensView === 'insumos';
    if (insumosOnly) return _availableInsumoFilterValues(field);
    var classe = insumosOnly ? 'insumo' : (_itensFilters.classe || '');
    return _catalogNames(field === 'tipo' ? 'tipos' : 'categorias', classe, !!insumosOnly);
  }

  function _availableInsumoFilterValues(field) {
    var kind = field === 'tipo' ? 'tipos' : 'categorias';
    var valueKey = field === 'tipo' ? 'tipo' : 'categoria';
    var oppositeKey = field === 'tipo' ? 'categoria' : 'tipo';
    var oppositeVal = _itensFilters[oppositeKey] || '';
    var catalog = _catalogNames(kind, 'insumo', true);
    if (!oppositeVal) return catalog;
    var used = {};
    (_itens || []).forEach(function (item) {
      if (!item || item.classe === 'produto') return;
      if ((item[oppositeKey] || '') !== oppositeVal) return;
      if (item[valueKey]) used[item[valueKey]] = true;
    });
    return catalog.filter(function (name) { return !!used[name]; });
  }

  function _renderInsumos() {
    _itensView = 'insumos';
    _renderItens();
  }

  function _paintItens() {
    var content = document.getElementById('compras-content');
    if (!content) return;
    var insumosOnly = _itensView === 'insumos';
    var title = insumosOnly ? 'Insumos' : 'Produtos / Insumos';
    var subtitle = insumosOnly ? 'Cadastre os insumos usados na produção com tipo, categoria, unidade e custo atual.' : 'Cadastre e acompanhe produtos e insumos usados em compras, estoque e custos.';
    var addLabel = insumosOnly ? '+ Novo insumo' : '+ Novo item';
    var listTitle = insumosOnly ? 'Insumos cadastrados' : 'Produtos / Insumos cadastrados';
    var listDesc = insumosOnly ? 'Gerencie tipo, categoria, unidade e custo dos insumos usados em receitas.' : 'Veja classe, tipo, categoria, unidade e custo atual dos itens de compra.';
    var addFn = insumosOnly ? 'Modules.Compras._openInsumoModal(null)' : 'Modules.Compras._openItemModal(null)';
    var iS = _inputStyle();
    _syncItemFiltersToCatalog();
    var tipoOpts = '<option value="">Todos os tipos</option>' +
      _availableItemFilterValues('tipo').map(function (name) {
        return '<option value="' + _esc(name) + '"' + (_itensFilters.tipo === name ? ' selected' : '') + '>' + _esc(name) + '</option>';
      }).join('');
    var catOpts = '<option value="">Todas categorias</option>' +
      _availableItemFilterValues('categoria').map(function (name) {
        return '<option value="' + _esc(name) + '"' + (_itensFilters.categoria === name ? ' selected' : '') + '>' + _esc(name) + '</option>';
      }).join('');
    var filteredForCounts = _filteredItens();
    var insumosCount = filteredForCounts.length;
    var ativosCount = filteredForCounts.filter(function (i) { return i.ativo !== false; }).length;
    var produtosCount = filteredForCounts.filter(function (i) { return i.classe === 'produto'; }).length;
    var insumosClassCount = filteredForCounts.filter(function (i) { return i.classe !== 'produto'; }).length;
    var receitasCount = filteredForCounts.filter(function (i) { return i.usar_em_fichas !== false; }).length;
    var revendaCount = filteredForCounts.filter(function (i) { return i.venda_habilitada === true; }).length;
    var tiposCount = _availableItemFilterValues('tipo').length;
    var custoMedio = filteredForCounts.length ? filteredForCounts.reduce(function (s, i) { return s + _num(i.custo_atual); }, 0) / filteredForCounts.length : 0;
    var p = _pag.itens;
    var totalPages = Math.max(1, Math.ceil(insumosCount / p.perPage));
    var currentPage = Math.min(p.page, totalPages);
    if (p.page !== currentPage) p.page = currentPage;
    var insumoKpi = function (label, value, icon, color) {
      return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\';" onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\';">' +
        '<div style="width:46px;height:46px;border-radius:14px;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="mi" style="font-size:26px;color:' + color + ';">' + _esc(icon) + '</span></div>' +
        '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
          '<span style="display:block;font-size:12px;font-weight:500;color:#6F6860;line-height:1.2;">' + _esc(label) + '</span>' +
          '<strong style="display:block;font-size:26px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(value) + '</strong>' +
        '</div>' +
      '</div>';
    };
    var metricsHtml = insumosOnly ? '<div class="growth-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' +
      insumoKpi('Total de insumos', insumosCount, 'inventory_2', '#8A6F5A') +
      insumoKpi('Tipos', tiposCount, 'category', '#A18362') +
      insumoKpi('Em receitas', receitasCount, 'receipt_long', '#6C8777') +
      insumoKpi('Custo médio', UI.fmt(custoMedio), 'query_stats', '#B42318') +
      '</div>' : '';
    var classeFilterHtml = insumosOnly ? '' : '<select id="it-f-classe" onchange="Modules.Compras._filterItens()" style="' + iS + 'height:40px;background:#fff;">' +
      '<option value=""' + (!_itensFilters.classe ? ' selected' : '') + '>Todas classes</option>' +
      '<option value="produto"' + (_itensFilters.classe === 'produto' ? ' selected' : '') + '>Produtos</option>' +
      '<option value="insumo"' + (_itensFilters.classe === 'insumo' ? ' selected' : '') + '>Insumos</option>' +
      '</select>';
    var filterGrid = insumosOnly
      ? 'minmax(320px,1.6fr) minmax(180px,.8fr) minmax(160px,.7fr) minmax(150px,.7fr) auto'
      : 'minmax(320px,1.6fr) minmax(150px,.75fr) minmax(160px,.8fr) minmax(140px,.7fr) minmax(140px,.7fr) auto';
    var filterCard = '<div style="background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="display:grid;grid-template-columns:' + filterGrid + ';gap:10px;align-items:end;">' +
        '<div><input id="it-f-q" type="search" placeholder="' + (insumosOnly ? 'Buscar insumos...' : 'Buscar produtos ou insumos...') + '" value="' + _esc(_itensFilters.q) + '" oninput="Modules.Compras._filterItens()" style="width:100%;height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;box-sizing:border-box;color:#1F1F1F;"></div>' +
        classeFilterHtml +
        '<select id="it-f-tipo" onchange="Modules.Compras._filterItens()" style="' + iS + 'height:40px;background:#fff;">' + tipoOpts.replace('<option value="">Todos os tipos</option>', '<option value="">Todos os tipos</option>') + '</select>' +
        '<select id="it-f-cat" onchange="Modules.Compras._filterItens()" style="' + iS + 'height:40px;background:#fff;">' + catOpts.replace('<option value="">Todas categorias</option>', '<option value="">Todas categorias</option>') + '</select>' +
        '<select id="it-f-ativo" onchange="Modules.Compras._filterItens()" style="' + iS + 'height:40px;background:#fff;">' +
          '<option value="">Todos</option>' +
          '<option value="ativo"' + (_itensFilters.ativo === 'ativo' ? ' selected' : '') + '>Ativo</option>' +
          '<option value="inativo"' + (_itensFilters.ativo === 'inativo' ? ' selected' : '') + '>Inativo</option>' +
        '</select>' +
        '<button onclick="Modules.Compras._clearItensFilters()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;font-size:13px;font-family:inherit;cursor:pointer;background:#fff;color:#6F6860;white-space:nowrap;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button>' +
      '</div>' +
      '<div style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
          '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + insumosCount + ' itens</span>' +
          '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + ativosCount + ' ativos</span>' +
          (insumosOnly
            ? '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + receitasCount + ' em receitas</span><span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + revendaCount + ' em revenda</span>'
            : '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + produtosCount + ' produtos</span><span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + insumosClassCount + ' insumos</span>') +
        '</div>' +
      '</div>' +
    '</div>';
    content.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div>' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.15;margin:0 0 6px;color:#1F1F1F;">' + _esc(title) + '</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">' + _esc(subtitle) + '</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;">' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + insumosCount + (insumosOnly ? ' insumos' : ' itens') + '</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + ativosCount + ' ativos</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + tiposCount + ' tipos</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="' + addFn + '" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">' + _esc(addLabel) + '</button>' +
        '</div>' +
      '</div>' +
      metricsHtml +
      filterCard +
      '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.3;">' + _esc(listTitle) + '</div>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:3px 0 0;">' + _esc(listDesc) + '</p>' +
        '</div>' +
        '<div id="compras-itens-table">' + _itensTable(_filteredItens()) + '</div>' +
      '</section>' +
    '</div>';
  }

  function _filteredItens() {
    return _itemFilterBase();
  }

  function _itensTable(data) {
    var p = _pag.itens;
    var total = (data || []).length;
    var totalPages = Math.max(1, Math.ceil(total / p.perPage));
    var currentPage = Math.min(Math.max(1, p.page), totalPages);
    if (p.page !== currentPage) p.page = currentPage;
    var start = total ? ((currentPage - 1) * p.perPage + 1) : 0;
    var end = total ? Math.min(currentPage * p.perPage, total) : 0;
    var perPageOptions = [10, 25, 50].map(function (n) {
      return '<option value="' + n + '"' + (Number(p.perPage) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
    }).join('');
    var paginationHtml = total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<select onchange="Modules.Compras._setPerPage(\'itens\',this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">' + perPageOptions + '</select>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Compras._changePage(\'itens\',' + (currentPage - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (currentPage > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (currentPage > 1 ? '1' : '.45') + ';"' + (currentPage > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + currentPage + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Compras._changePage(\'itens\',' + (currentPage + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (currentPage < totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (currentPage < totalPages ? '1' : '.45') + ';"' + (currentPage < totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>' : '';
    var pageData = data.slice((currentPage - 1) * p.perPage, currentPage * p.perPage);
    var insumosOnly = _itensView === 'insumos';
    var headers = insumosOnly ? ['ITEM', 'CLASSE', 'TIPO', 'CATEGORIA', 'UNIDADE', 'CUSTO ATUAL', 'AÇÕES'] : ['Nome', 'Classe', 'Tipo', 'Categoria', 'Unidade', 'Custo atual', 'Venda', ''];
    var emptyTitle = insumosOnly ? 'Nenhum insumo encontrado' : 'Nenhum item encontrado';
    var emptyAction = insumosOnly ? 'Novo insumo' : 'Novo item';
    if (!data.length) {
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="text-align:center;padding:60px 20px;color:#7A746B;">' +
          '<div style="width:54px;height:54px;border-radius:16px;background:#FAF8F4;border:1px solid #EAE4DA;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span class="mi" style="font-size:26px;color:#A39B90;">inventory_2</span></div>' +
          '<p style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 6px;">' + _esc(emptyTitle) + '</p>' +
          '<p style="font-size:13px;color:#7A746B;margin:0 0 16px;">Tente ajustar a busca ou os filtros.</p>' +
          '<button type="button" onclick="Modules.Compras.' + (insumosOnly ? '_openInsumoModal(null)' : '_openItemModal(null)') + '" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);">' + _esc(emptyAction) + '</button>' +
        '</div>' +
      '</div>';
    }
    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);overflow:hidden;">' +
      '<div style="overflow-x:auto;"><table style="width:100%;min-width:920px;border-collapse:separate;border-spacing:0;background:#fff;">' +
      '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
        '<th style="width:44px;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;"><input type="checkbox" disabled style="width:16px;height:16px;accent-color:#B42318;"></th>' +
        '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">ITEM</th>' +
        '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">CLASSE</th>' +
        '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">TIPO</th>' +
        '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">CATEGORIA</th>' +
        '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">UNIDADE</th>' +
        '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">CUSTO ATUAL</th>' +
        '<th style="text-align:right;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">AÇÕES</th>' +
      '</tr></thead>' +
      '<tbody>' + pageData.map(function (i) {
        var openFn = _itensView === 'insumos' ? '_openInsumoModal' : '_openItemModal';
        return '<tr data-item-name="' + _esc((i.nome || i.name || '').toLowerCase()) + '" onclick="Modules.Compras.' + openFn + '(\'' + i.id + '\')" style="cursor:pointer;border-bottom:1px solid #EAE4DA;transition:background .15s ease;" onmouseover="this.style.background=\'#FBF8F2\'" onmouseout="this.style.background=\'#fff\'">' +
          '<td style="width:44px;padding:14px 16px;vertical-align:middle;"><input type="checkbox" disabled style="width:16px;height:16px;accent-color:#B42318;"></td>' +
          '<td style="padding:14px 16px;vertical-align:middle;">' +
            '<div style="min-width:0;">' +
              '<div style="font-size:15px;font-weight:600;line-height:1.25;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;">' + _esc(i.nome || i.name) + '</div>' +
              '<div style="font-size:12px;line-height:1.4;color:#6F6860;margin-top:3px;">' + _esc(i.unidade_base || i.unidadeBase || '-') + (i.unidade_compra_padrao ? ' · ' + _esc(i.unidade_compra_padrao) : '') + '</div>' +
            '</div>' +
          '</td>' +
          '<td style="padding:14px 16px;vertical-align:middle;">' + (i.classe === 'produto' ? _statusChip('Produto', '#3B5B82', '#5B7FA6') : _statusChip('Insumo', '#9A5B13', '#D97706')) + '</td>' +
          '<td style="padding:14px 16px;vertical-align:middle;">' + _chip(i.tipo || '-') + '</td>' +
          '<td style="padding:14px 16px;vertical-align:middle;">' + _chip(i.categoria || '-') + '</td>' +
          '<td style="padding:14px 16px;vertical-align:middle;font-size:14px;font-weight:600;color:#1F1F1F;">' + _esc(i.unidade_base || i.unidadeBase || '-') + '</td>' +
          '<td style="padding:14px 16px;vertical-align:middle;font-size:14px;font-weight:600;color:#1F1F1F;">' + (i.custo_atual ? '€' + Number(i.custo_atual).toFixed(Number(i.custo_atual) < 0.01 ? 6 : 4) : '-') + '</td>' +
          '<td style="padding:14px 16px;vertical-align:middle;text-align:right;white-space:nowrap;" onclick="event.stopPropagation();"><div style="display:inline-flex;gap:6px;">' +
            '<button onclick="Modules.Compras.' + openFn + '(\'' + i.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">edit</span></button>' +
            '<button onclick="Modules.Compras._deleteItem(\'' + i.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#B42318;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">delete</span></button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>' +
      paginationHtml +
      '</div>';
  }

  function _filterItens() {
    var activeId = document.activeElement ? document.activeElement.id : '';
    _itensFilters.q = (_el('it-f-q').value || '').trim();
    var classeEl = document.getElementById('it-f-classe');
    _itensFilters.classe = classeEl ? (classeEl.value || '') : (_itensView === 'insumos' ? '' : _itensFilters.classe || '');
    var tipoEl = document.getElementById('it-f-tipo');
    _itensFilters.tipo = tipoEl ? (tipoEl.value || '') : '';
    _itensFilters.categoria = _el('it-f-cat').value || '';
    var ativoEl = document.getElementById('it-f-ativo');
    _itensFilters.ativo = ativoEl ? ativoEl.value : 'ativo';
    _syncItemFiltersToCatalog();
    _pag.itens.page = 1;
    if (_itensView === 'insumos') {
      _paintItens();
      if (activeId === 'it-f-q') {
        var input = document.getElementById('it-f-q');
        if (input) {
          try {
            input.focus();
            var len = String(input.value || '').length;
            if (input.setSelectionRange) input.setSelectionRange(len, len);
          } catch (e) {}
        }
      }
      return;
    }
    var el = document.getElementById('compras-itens-table');
    if (el) el.innerHTML = _itensTable(_filteredItens());
  }

  function _clearItensFilters() {
    _itensFilters = { q: '', classe: '', tipo: '', categoria: '', fornecedor: '', ativo: '' };
    _pag.itens.page = 1;
    _paintItens();
  }

  function _openItemModal(id) {
    _editingId = id;
    var defaultClasse = 'insumo';
    var item = id ? (_byId(_itens, id) || {}) : {
      classe: defaultClasse,
      tipo: '',
      categoria: '',
      ativo: true,
      aproveitamento_padrao: 100
    };
    window._itemCompraImageBase64 = item.imageBase64 || '';
    var classeItem = item.classe || 'insumo';
    var strictCatalog = _itensView === 'insumos' || classeItem === 'insumo';
    var unidadeOpts = _unidades.map(function (u) {
      var val = u.symbol || u.name;
      return '<option value="' + _esc(val) + '"' + ((item.unidade_base || item.unidadeBase) === val ? ' selected' : '') + '>' + _esc(u.name) + ' (' + _esc(val) + ')</option>';
    }).join('');
    var fornecedoresSorted = _fornecedores.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var fornAtual = item.fornecedor_padrao_id ? (_byId(_fornecedores, item.fornecedor_padrao_id) || {}) : {};
    var fornOpts = _options(fornecedoresSorted, item.fornecedor_padrao_id, 'name', 'Sem fornecedor padrão');
    var imgSrc = item.imageBase64 || item.imageUrl || '';
    var costText = item.custo_atual ? '€' + Number(item.custo_atual).toFixed(Number(item.custo_atual) < 0.01 ? 6 : 4) + '/' + _esc(item.unidade_base || '') : '-';
    var lastPurchaseText = item.ultima_compra_data ? UI.fmtDate(new Date(item.ultima_compra_data)) : '-';
    var sectionTitle = 'font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.3;margin-bottom:4px;';
    var sectionHint = 'font-size:13px;color:#6F6860;line-height:1.45;margin-bottom:14px;';
    var cardStyle = 'background:#fff;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
    var softCardStyle = 'background:#fff;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
    var metricStyle = 'background:#fff;border:none;border-radius:14px;padding:12px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
    var body = '<div style="display:grid;gap:16px;">' +
      '<div style="' + softCardStyle + '">' +
      '<div style="display:grid;grid-template-columns:minmax(180px,.65fr) 1.35fr;gap:16px;align-items:end;">' +
      '<div><label style="' + _labelStyle() + '">Classe do cadastro *</label>' +
      '<select id="it-classe" onchange="Modules.Compras._toggleItemClasse()" style="' + _inputStyle() + '">' +
      '<option value="insumo"' + (item.classe !== 'produto' ? ' selected' : '') + '>Insumo</option>' +
      '<option value="produto"' + (item.classe === 'produto' ? ' selected' : '') + '>Produto</option>' +
      '</select></div>' +
      '<div>' + _field('it-nome', 'Nome *', item.nome || item.name || '') + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">' + _searchableCatalogField('tipos', 'it-tipo', 'Tipo *', item.tipo || '', classeItem, strictCatalog) + _searchableCatalogField('categorias', 'it-categoria', 'Categoria *', item.categoria || '', classeItem, strictCatalog) + '</div>' +
      '</div>' +
      '<div style="' + cardStyle + '">' +
      '<div style="' + sectionTitle + '">Compra e custo</div>' +
      '<div id="it-custo-hint" style="' + sectionHint + '">Dados usados em compras, fornecedores, custos, receitas e cálculo financeiro.</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;align-items:start;">' +
        _select('it-unidade', 'Unidade base *', '<option value="">Selecionar...</option>' + unidadeOpts) +
        '<div style="position:relative;"><label style="' + _labelStyle() + '">Fornecedor padrão</label>' +
          '<input id="it-forn-display" type="text" placeholder="Buscar fornecedor..." autocomplete="off" value="' + _esc(fornAtual.name || '') + '" ' +
            'oninput="Modules.Compras._itemFornSearch(this.value)" ' +
            'onfocus="Modules.Compras._itemFornSearch(this.value)" ' +
            'onblur="setTimeout(function(){var d=document.getElementById(\'it-forn-dropdown\');if(d)d.style.display=\'none\';},200)" ' +
            'style="' + _inputStyle() + '">' +
          '<div id="it-forn-dropdown" style="display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;z-index:9999;background:#fff;border:1px solid #EAE4DA;border-radius:10px;max-height:220px;overflow-y:auto;box-shadow:0 12px 30px rgba(31,31,31,.12);"></div>' +
          '<select id="it-forn" style="display:none;"><option value="">Sem fornecedor padrão</option>' + fornOpts + '</select>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1.5fr .6fr;gap:12px;margin-bottom:12px;">' +
      _searchablePackageField('it-emb-padrao', 'Embalagem de compra padrão', item.unidade_compra_padrao || '') +
      _field('it-conteudo-padrao', 'Conteúdo por embalagem (×)', item.conteudo_por_embalagem_padrao || 1, 'number') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:stretch;">' +
      '<label style="' + metricStyle + 'display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;"><input id="it-ativo" type="checkbox" ' + (item.ativo !== false ? 'checked' : '') + ' style="accent-color:#C4362A;width:17px;height:17px;"> Cadastro ativo</label>' +
      '<div style="' + metricStyle + '"><div style="' + sectionTitle + 'margin-bottom:6px;">Custo atual</div><strong style="font-size:17px;color:#1A1A1A;">' + costText + '</strong></div>' +
      '<div style="' + metricStyle + '"><div style="' + sectionTitle + 'margin-bottom:6px;">Última compra</div><strong style="font-size:17px;color:#1A1A1A;">' + lastPurchaseText + '</strong></div>' +
      '</div>' +
      '</div>' +
      '<div id="it-insumo-fields" style="display:none;' + cardStyle + '">' +
      '<div style="' + sectionTitle + '">Uso em receitas</div>' +
      '<div style="' + sectionHint + '">Configura o rendimento do insumo para fichas técnicas, perdas e custos de produção.</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;">' + _field('it-aprov', 'Aproveitamento (%)', item.aproveitamento_padrao || 100, 'number') +
      '<label style="background:#F8F4F3;border:1px solid #EFE6E3;border-radius:14px;padding:16px;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;"><input id="it-fichas" type="checkbox" ' + (item.usar_em_fichas !== false ? 'checked' : '') + ' style="accent-color:#C4362A;width:17px;height:17px;"> Usar em receitas</label></div>' +
      '</div>' +
      '<div id="it-produto-fields" style="display:none;' + cardStyle + '">' +
      '<div style="' + sectionTitle + '">Produto para revenda direta</div>' +
      '<div style="' + sectionHint + '">Produto comprado para venda unitária. Não entra em receitas. Estoque baixa por unidade vendida. Imagem, preço de venda e descrição são geridos no módulo de Cardápio / Venda.</div>' +
      '<label style="background:#FFF7F5;border:1px solid #F0C7C1;border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;"><input id="it-venda" type="checkbox" ' + (item.venda_habilitada ? 'checked' : '') + ' style="accent-color:#C4362A;width:18px;height:18px;"> Alimentar cardápio / venda como produto único</label>' +
      '</div>' +
      '</div>';
    var footer = id
      ? '<div style="display:flex;align-items:center;gap:8px;">' +
        '<button onclick="Modules.Compras._deleteItem(\'' + id + '\')" style="' + _dangerStyle() + '">Excluir</button>' +
        '<span style="flex:1;"></span>' +
        '<button onclick="window._itemCompraModal&&window._itemCompraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
        '<button onclick="Modules.Compras._saveItem()" style="' + _primaryStyle() + '">Atualizar</button>' +
        '</div>'
      : '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
        '<button onclick="window._itemCompraModal&&window._itemCompraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
        '<button onclick="Modules.Compras._saveItem()" style="' + _primaryStyle() + '">Adicionar</button>' +
        '</div>';
    var modalTitle = (strictCatalog || classeItem === 'insumo')
      ? (id ? 'Editar Insumo' : 'Novo Insumo')
      : (id ? 'Editar Produto / Insumo' : 'Novo Produto / Insumo');
    window._itemCompraModal = UI.modal({ title: modalTitle, body: body, footer: footer, maxWidth: '1120px' });
    setTimeout(_toggleItemClasse, 20);
  }

  function _itemFornSearch(q) {
    var dd = document.getElementById('it-forn-dropdown');
    if (!dd) return;
    var norm = _normalizeStr(q);
    var source = _fornecedores.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var filtered = norm ? source.filter(function (f) {
      var hay = _normalizeStr([f.name, f.contact, f.nif, f.phone, f.whatsapp, f.email, f.state, f.estado].join(' '));
      return hay.indexOf(norm) >= 0;
    }) : source;
    var items = '<div onmousedown="Modules.Compras._itemFornSelect(\'\')" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #EAE4DA;font-size:13px;font-family:inherit;background:#fff;" onmouseover="this.style.background=\'#FBF8F2\'" onmouseout="this.style.background=\'#fff\'"><div style="color:#6F6860;font-style:italic;">Sem fornecedor padrão</div></div>';
    if (!filtered.length) {
      dd.innerHTML = items + '<div style="padding:10px 14px;color:#8A7E7C;font-size:13px;font-family:inherit;">Nenhum fornecedor encontrado.</div>';
      dd.style.display = 'block';
      return;
    }
    items += filtered.slice(0, 60).map(function (f) {
      var sub = [f.contact, f.email, f.state || f.estado].filter(Boolean).map(_esc).join(' · ');
      return '<div onmousedown="Modules.Compras._itemFornSelect(\'' + f.id + '\')" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #EAE4DA;font-size:13px;font-family:inherit;background:#fff;" onmouseover="this.style.background=\'#FBF8F2\'" onmouseout="this.style.background=\'#fff\'">' +
        '<div style="font-weight:600;color:#1F1F1F;">' + _esc(f.name || '-') + '</div>' +
        (sub ? '<div style="font-size:11px;color:#6F6860;margin-top:2px;">' + sub + '</div>' : '') +
        '</div>';
    }).join('');
    dd.innerHTML = items;
    dd.style.display = 'block';
  }

  function _itemFornSelect(id) {
    var sel = document.getElementById('it-forn');
    var disp = document.getElementById('it-forn-display');
    var dd = document.getElementById('it-forn-dropdown');
    if (!sel) return;
    sel.value = id;
    var forn = id ? (_byId(_fornecedores, id) || {}) : null;
    if (disp) disp.value = forn ? (forn.name || '') : '';
    if (dd) dd.style.display = 'none';
  }

  function _catalogSearch(id, kind, q) {
    var dd = document.getElementById(id + '-dropdown');
    var hidden = document.getElementById(id);
    if (!dd || !hidden) return;
    var classeEl = document.getElementById('it-classe');
    var classe = classeEl ? (classeEl.value || 'insumo') : (hidden.dataset.classe || 'insumo');
    var strictClass = hidden.dataset.strictClass === '1';
    var norm = _normCatalogName(q);
    var list = _catalogList(kind, classe, strictClass);
    var filtered = norm ? list.filter(function (item) {
      return _normCatalogName(item.name).indexOf(norm) >= 0;
    }) : list;
    var exact = _findCatalogByName(kind, q, classe, strictClass);
    hidden.value = exact ? (exact.name || '') : '';
    var html = _dropdownItemHtml('Não informado', '', 'Modules.Compras._catalogSelect(\'' + id + '\',\'\')', '#8A7E7C');
    html += filtered.slice(0, 60).map(function (item) {
      return _dropdownItemHtml(item.name || '-', item.classe === 'ambos' ? 'Disponível para todos' : (item.classe || classe), 'Modules.Compras._catalogSelect(\'' + id + '\',\'' + _escJs(item.name || '') + '\')');
    }).join('');
    if (norm && !exact) {
      var label = kind === 'tipos' ? '+ Cadastrar novo tipo: ' : '+ Cadastrar nova categoria: ';
      html += _dropdownItemHtml(label + String(q || '').trim(), 'Criar para a classe atual', 'Modules.Compras._catalogQuickCreate(\'' + id + '\',\'' + kind + '\',\'' + _escJs(q) + '\')', '#C4362A');
    }
    if (!filtered.length && !norm) {
      html += '<div style="padding:10px 12px;color:#8A7E7C;font-size:13px;">Nenhum cadastro disponível.</div>';
    }
    dd.innerHTML = html;
    dd.style.display = 'block';
  }

  function _catalogSelect(id, name) {
    var hidden = document.getElementById(id);
    var display = document.getElementById(id + '-display');
    var dd = document.getElementById(id + '-dropdown');
    if (hidden) hidden.value = name || '';
    if (display) display.value = name || '';
    if (dd) dd.style.display = 'none';
  }

  function _catalogQuickCreate(id, kind, rawName) {
    var name = String(rawName || '').trim().replace(/\s+/g, ' ');
    if (!name) return;
    var classeEl = document.getElementById('it-classe');
    var hidden = document.getElementById(id);
    var strictClass = hidden && hidden.dataset.strictClass === '1';
    var classe = strictClass ? (hidden.dataset.classe || 'insumo') : (classeEl ? (classeEl.value || 'insumo') : 'insumo');
    var existing = _findCatalogByName(kind, name, classe, strictClass);
    if (existing) {
      _catalogSelect(id, existing.name || name);
      return;
    }
    var col = kind === 'tipos' ? 'compras_tipos' : 'compras_categorias';
    DB.add(col, { name: name, classe: classe, ativo: true }).then(function () {
      UI.toast((kind === 'tipos' ? 'Tipo' : 'Categoria') + ' cadastrado!', 'success');
      return Promise.all([DB.getAll('compras_tipos'), DB.getAll('compras_categorias')]);
    }).then(function (r) {
      _tipos = r[0] || [];
      _categorias = r[1] || [];
      _catalogSelect(id, name);
      _syncItemFiltersToCatalog();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _packageSearch(id, q) {
    var dd = document.getElementById(id + '-dropdown');
    if (!dd) return;
    var hidden = document.getElementById(id);
    if (hidden) hidden.value = _packageValue(q);
    var norm = _normCatalogName(q);
    var filtered = PACKAGE_OPTIONS_PT.filter(function (name) {
      return !norm || name.indexOf(norm) >= 0;
    });
    dd.innerHTML = filtered.length ? filtered.map(function (name) {
      return _dropdownItemHtml(name, '', 'Modules.Compras._packageSelect(\'' + id + '\',\'' + _escJs(name) + '\')');
    }).join('') : '<div style="padding:10px 12px;color:#8A7E7C;font-size:13px;">Nenhuma embalagem encontrada.</div>';
    dd.style.display = 'block';
  }

  function _packageSelect(id, name) {
    var value = _packageValue(name);
    var hidden = document.getElementById(id);
    var display = document.getElementById(id + '-display');
    var dd = document.getElementById(id + '-dropdown');
    if (hidden) hidden.value = value;
    if (display) display.value = value;
    if (dd) dd.style.display = 'none';
  }

  function _openInsumoModal(id) {
    _openItemModal(id);
    setTimeout(function () {
      var classe = document.getElementById('it-classe');
      if (classe) {
        classe.value = 'insumo';
        var wrap = classe.parentNode;
        while (wrap && wrap.tagName && wrap.tagName.toLowerCase() !== 'div') wrap = wrap.parentNode;
        if (wrap) wrap.style.display = 'none';
      }
      var headings = document.querySelectorAll('h2');
      if (headings.length) headings[headings.length - 1].textContent = id ? 'Editar Insumo' : 'Novo Insumo';
      _toggleItemClasse();
    }, 30);
  }

  function _toggleItemClasse() {
    var classe = _el('it-classe').value || 'insumo';
    var ins = document.getElementById('it-insumo-fields');
    var prod = document.getElementById('it-produto-fields');
    if (ins) ins.style.display = classe === 'insumo' ? 'block' : 'none';
    if (prod) prod.style.display = classe === 'produto' ? 'block' : 'none';
    // Produto → unidade base padrão 'un' quando o campo estiver em branco
    if (classe === 'produto') {
      var unidEl = document.getElementById('it-unidade');
      if (unidEl && !unidEl.value) {
        for (var i = 0; i < unidEl.options.length; i++) {
          if (unidEl.options[i].value === 'un') { unidEl.selectedIndex = i; break; }
        }
      }
    }
    // Bloquear / desbloquear "Conteúdo por embalagem" conforme classe
    var conteudoPadraoEl = document.getElementById('it-conteudo-padrao');
    if (conteudoPadraoEl) {
      if (classe === 'produto') {
        conteudoPadraoEl.value = '1';
        conteudoPadraoEl.disabled = true;
        conteudoPadraoEl.style.opacity = '0.45';
        conteudoPadraoEl.style.cursor = 'not-allowed';
      } else {
        conteudoPadraoEl.disabled = false;
        conteudoPadraoEl.style.opacity = '';
        conteudoPadraoEl.style.cursor = '';
      }
    }
    // Hint dinâmico da secção Compra e custo
    var custoHint = document.getElementById('it-custo-hint');
    if (custoHint) {
      custoHint.textContent = classe === 'produto'
        ? 'Dados usados em compras, fornecedores, controlo de estoque e custo por unidade vendável.'
        : 'Dados usados em compras, fornecedores, custos, receitas e cálculo financeiro.';
    }
    // Actualizar campos de Tipo e Categoria conforme classe
    var tipoEl = document.getElementById('it-tipo');
    var catEl = document.getElementById('it-categoria');
    if (tipoEl) {
      tipoEl.dataset.classe = classe;
      if (tipoEl.dataset.strictClass !== '1') tipoEl.dataset.strictClass = classe === 'insumo' ? '1' : '0';
      var tipoStrict = tipoEl.dataset.strictClass === '1';
      if (tipoEl.value && !_findCatalogByName('tipos', tipoEl.value, classe, tipoStrict)) _catalogSelect('it-tipo', '');
    }
    if (catEl) {
      catEl.dataset.classe = classe;
      if (catEl.dataset.strictClass !== '1') catEl.dataset.strictClass = classe === 'insumo' ? '1' : '0';
      var catStrict = catEl.dataset.strictClass === '1';
      if (catEl.value && !_findCatalogByName('categorias', catEl.value, classe, catStrict)) _catalogSelect('it-categoria', '');
    }
  }

  function _onItemImgFileChange(event) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type || '')) {
      UI.toast('Use uma imagem PNG, JPG ou WebP.', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      window._itemCompraImageBase64 = reader.result || '';
      var img = document.getElementById('it-img-preview');
      var empty = document.getElementById('it-img-empty');
      if (img) {
        img.src = window._itemCompraImageBase64;
        img.style.display = '';
      }
      if (empty) empty.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function _saveItem() {
    var nome = (_el('it-nome').value || '').trim();
    if (!nome) { UI.toast('Nome obrigatório', 'error'); return; }
    var classe = _el('it-classe').value || 'insumo';
    var data = {
      nome: nome,
      classe: classe,
      tipo: _el('it-tipo').value,
      categoria: _el('it-categoria').value,
      unidade_base: _el('it-unidade').value,
      fornecedor_padrao_id: _el('it-forn').value,
      ativo: _el('it-ativo').checked,
      unidade_compra_padrao: (_el('it-emb-padrao').value || '').trim(),
      conteudo_por_embalagem_padrao: parseFloat(_el('it-conteudo-padrao').value || '1') || 1
    };
    if (classe === 'insumo') {
      data.aproveitamento_padrao = parseFloat(_el('it-aprov').value || '100') || 100;
      data.usar_em_fichas = _el('it-fichas').checked;
      data.venda_habilitada = false;
    } else {
      data.venda_habilitada = _el('it-venda').checked;
      data.usar_em_fichas = false;
      // Campos de catálogo (imagem, preço de venda, descrição) são geridos no módulo Cardápio/Venda
    }
    var op = _editingId ? DB.update('itens_custo', _editingId, data) : DB.add('itens_custo', data);
    op.then(function (ref) {
      var id = _editingId || (ref && ref.id) || ''; // eslint-disable-line no-unused-vars
      return null; // _syncProdutoCatalogo não é chamado daqui; catálogo gerido em módulo próprio
    }).then(function () {
      UI.toast('Cadastro salvo!', 'success');
      if (window._itemCompraModal) window._itemCompraModal.close();
      _renderItens();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _syncProdutoCatalogo(itemId, item) {
    if (!item.venda_habilitada) return null;
    var productData = {
      name: item.nome,
      price: item.preco_venda || 0,
      shortDesc: item.descricao_venda || '',
      description: item.descricao_venda || '',
      fullDesc: item.descricao_venda || '',
      imageUrl: item.imageUrl || '',
      imageBase64: item.imageBase64 || '',
      type: 'unico',
      productType: 'simple',
      unicoSource: 'compras_produto',
      produtoProntoId: itemId,
      sourceType: 'compras_produto',
      sourceItemId: itemId,
      menuVisible: true
    };
    return DB.getAll('products').then(function (products) {
      var existingItem = _byId(_itens, itemId) || {};
      var linkedId = existingItem.catalogProductId || '';
      var linkedProduct = (products || []).find(function (p) {
        return p.id === linkedId || p.sourceItemId === itemId || p.produtoProntoId === itemId;
      });
      if (linkedProduct && linkedProduct.id) {
        return DB.update('products', linkedProduct.id, productData)
          .then(function () { return DB.update('itens_custo', itemId, { catalogProductId: linkedProduct.id }); });
      }
      return DB.add('products', productData).then(function (ref) {
        return DB.update('itens_custo', itemId, { catalogProductId: ref && ref.id ? ref.id : '' });
      });
    });
  }

  function _deleteItem(id) {
    UI.confirm('Eliminar este cadastro?').then(function (yes) {
      if (!yes) return;
      if (window._itemCompraModal) window._itemCompraModal.close();
      DB.update('itens_custo', id, { ativo: false }).then(function () { UI.toast('Cadastro desativado', 'info'); _renderItens(); });
    });
  }

  // ── Fornecedores ──────────────────────────────────────────────────────────
  function _renderFornecedores() {
    var p1 = DB.getAll('fornecedores');
    var p2 = window.BocaPlaces ? BocaPlaces.loadConfig() : Promise.resolve({});
    Promise.all([p1, p2]).then(function (r) {
      _fornecedores = (r[0] || []).sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
      _paintFornecedores();
    }).catch(function () {
      DB.getAll('fornecedores').then(function (data) {
        _fornecedores = (data || []).sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
        _paintFornecedores();
      });
    });
  }

  function _paintFornecedores() {
    var content = document.getElementById('compras-content');
    if (!content) return;
    var totalFornecedores = _fornecedores.length;
    var fornecedoresAtivos = _fornecedores.filter(function (f) { return f.ativo !== false; }).length;
    var fornecedoresInativos = _fornecedores.filter(function (f) { return f.ativo === false; }).length;
    var iS = _inputStyle();
    var selStyle = iS + 'height:40px;background:#fff;';
    var limparBtn = 'height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 1px 2px rgba(31,31,31,.03);';
    var filterCard = '<div style="background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="display:grid;grid-template-columns:minmax(320px,1.6fr) minmax(150px,.75fr) auto;gap:10px;align-items:end;">' +
      '<div><input id="fo-f-q" type="search" placeholder="Buscar por nome, contato, NIF ou categorias..." autocomplete="off" value="' + _esc(_fornecedoresFilters.q) + '" oninput="Modules.Compras._filterFornecedores()" style="' + iS + 'height:40px;"></div>' +
      '<select id="fo-f-status" onchange="Modules.Compras._filterFornecedores()" style="' + selStyle + '">' +
      '<option value=""' + (_fornecedoresFilters.status === '' ? ' selected' : '') + '>Todos status</option>' +
      '<option value="ativo"' + (_fornecedoresFilters.status === 'ativo' ? ' selected' : '') + '>Status: Ativos</option>' +
      '<option value="inativo"' + (_fornecedoresFilters.status === 'inativo' ? ' selected' : '') + '>Status: Inativos</option>' +
      '</select>' +
      '<button onclick="Modules.Compras._clearFornecedoresFilters()" style="' + limparBtn + '">Limpar filtros</button>' +
      '</div>' +
      '<div id="compras-forn-summary" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;"></div>' +
      '</div>';
    content.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div>' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.15;margin:0 0 6px;color:#1F1F1F;">Fornecedores</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Organize contatos, dados fiscais e padrões de pagamento usados no registro de compras.</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;">' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + totalFornecedores + ' fornecedores</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + fornecedoresAtivos + ' ativos</span>' +
            '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:12px;font-weight:500;">' + fornecedoresInativos + ' inativos</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Compras._openFornecedorModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">+ Adicionar fornecedor</button>' +
        '</div>' +
      '</div>' +
      filterCard +
      '<section style="display:flex;flex-direction:column;gap:10px;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.3;">Fornecedores cadastrados</div>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:3px 0 0;">Veja contato, pagamento padrão, status e ações de cada fornecedor.</p>' +
        '</div>' +
        '<div id="compras-forn-table"></div>' +
      '</section>' +
      '</div>';
    _paintFornecedoresTable();
  }

  function _filteredFornecedores() {
    var q = (_fornecedoresFilters.q || '').toLowerCase();
    return _fornecedores.filter(function (f) {
      if (_fornecedoresFilters.status === 'ativo' && f.ativo === false) return false;
      if (_fornecedoresFilters.status === 'inativo' && f.ativo !== false) return false;
      if (!q) return true;
      var hay = [f.name, f.contact, f.email, f.phone, f.whatsapp, f.nif, f.address, f.categories, f.categorias, f.notes].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function _paintFornecedoresTable() {
    var tbl = document.getElementById('compras-forn-table');
    if (!tbl) return;
    var data = _filteredFornecedores();
    var ativos = data.filter(function (f) { return f.ativo !== false; }).length;
    var inativos = data.filter(function (f) { return f.ativo === false; }).length;
    var comPagamento = data.filter(function (f) { return f.defaultPaymentMethod || f.formaPagamentoPadrao || f.paymentDays || f.prazoPagamento; }).length;
    var summary = document.getElementById('compras-forn-summary');
    if (summary) summary.innerHTML =
      _chip(data.length + ' fornecedores') +
      _chip(ativos + ' ativos') +
      _chip(inativos + ' inativos') +
      _chip(comPagamento + ' com padrão de pagamento');
    if (!data.length) {
      tbl.innerHTML = '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="text-align:center;padding:60px 20px;color:#7A746B;">' +
          '<div style="width:54px;height:54px;border-radius:16px;background:#FAF8F4;border:1px solid #EAE4DA;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span class="mi" style="font-size:26px;color:#A39B90;">storefront</span></div>' +
          '<p style="font-size:15px;font-weight:600;color:#1F1F1F;margin:0 0 6px;">Nenhum fornecedor encontrado</p>' +
          '<p style="font-size:13px;color:#7A746B;margin:0 0 16px;">Tente ajustar a busca ou os filtros.</p>' +
          '<button type="button" onclick="Modules.Compras._openFornecedorModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);">Adicionar fornecedor</button>' +
        '</div>' +
      '</div>';
      return;
    }
    var p = _pag.fornecedores;
    var totalPages = Math.max(1, Math.ceil(data.length / p.perPage));
    var currentPage = Math.min(Math.max(1, p.page), totalPages);
    if (p.page !== currentPage) p.page = currentPage;
    var pageData = data.slice((currentPage - 1) * p.perPage, currentPage * p.perPage);
    var th = 'padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;';
    tbl.innerHTML = '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="overflow:auto;"><table class="bf-table" style="width:100%;min-width:920px;border-collapse:separate;border-spacing:0;background:#fff;">' +
      '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
        '<th style="width:44px;' + th + '"><input type="checkbox" disabled style="width:16px;height:16px;accent-color:#B42318;"></th>' +
        '<th style="text-align:left;' + th + '">Fornecedor</th>' +
        '<th style="text-align:left;' + th + '">Contato</th>' +
        '<th style="text-align:left;' + th + '">Pagamento</th>' +
        '<th style="text-align:left;' + th + '">Status</th>' +
        '<th style="text-align:right;' + th + '">Ações</th>' +
      '</tr></thead><tbody>' + pageData.map(function (f) {
      var contato = [f.contact, f.whatsapp || f.phone, f.email].filter(Boolean).map(_esc).join('<br>');
      var prazo = f.paymentDays || f.prazoPagamento || '';
      var pagamento = [_esc(f.defaultPaymentMethod || f.formaPagamentoPadrao || '-'), prazo ? _esc(prazo) + ' dia(s)' : ''].filter(Boolean).join('<br>');
      var location = [f.bairro || f.neighborhood, f.estado || f.state, f.pais || f.country].filter(Boolean).map(_esc).join(' · ');
      return '<tr onclick="Modules.Compras._openFornecedorModal(\'' + f.id + '\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
        '<td style="width:44px;padding:14px 16px;vertical-align:middle;"><input type="checkbox" disabled style="width:16px;height:16px;accent-color:#B42318;"></td>' +
        '<td style="padding:14px 16px;vertical-align:middle;min-width:280px;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:15px;font-weight:600;line-height:1.25;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;">' + _esc(f.name || '-') + '</div>' +
            '<div style="font-size:12px;line-height:1.4;color:#6F6860;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;">' + _esc(f.nif || f.taxId || location || 'Sem dados fiscais') + '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;font-size:13px;color:#1F1F1F;line-height:1.45;">' + (contato || '-') + '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;font-size:13px;color:#1F1F1F;line-height:1.45;">' + (pagamento || '-') + '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;">' + (f.ativo === false ? _statusChip('Inativo', '#6F6860', '#A39B90') : _statusChip('Ativo', '#5B7A67', '#6C8777')) + '</td>' +
        '<td style="padding:14px 16px;vertical-align:middle;text-align:right;white-space:nowrap;" onclick="event.stopPropagation();"><div style="display:inline-flex;gap:6px;">' +
          '<button type="button" title="Editar" onclick="Modules.Compras._openFornecedorModal(\'' + f.id + '\')" style="' + _iconBtn('#fff', '#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
          '<button type="button" title="Excluir" onclick="Modules.Compras._deleteFornecedor(\'' + f.id + '\')" style="' + _iconBtn('#fff', '#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
        '</div></td></tr>';
    }).join('') + '</tbody></table></div>' + _pagerHtml('fornecedores', data.length) + '</div>';
  }

  function _filterFornecedores() {
    var activeId = document.activeElement ? document.activeElement.id : '';
    _fornecedoresFilters.q = (_el('fo-f-q').value || '').trim();
    _fornecedoresFilters.status = (_el('fo-f-status') && _el('fo-f-status').value) || '';
    _pag.fornecedores.page = 1;
    _paintFornecedoresTable();
    if (activeId === 'fo-f-q') {
      var input = document.getElementById('fo-f-q');
      if (input) {
        try {
          input.focus();
          var len = String(input.value || '').length;
          if (input.setSelectionRange) input.setSelectionRange(len, len);
        } catch (e) {}
      }
    }
  }

  function _clearFornecedoresFilters() {
    _fornecedoresFilters = { q: '', status: 'ativo' };
    _pag.fornecedores.page = 1;
    _paintFornecedores();
  }

  function _openFornecedorModal(id) {
    _editingId = id;
    var f = id ? (_byId(_fornecedores, id) || {}) : { ativo: true };
    var selectedState = f.estado || f.state || '';
    var selectedCountry = f.pais || f.country || (function () {
      var tc = window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES';
      return tc === 'PT' ? 'Portugal' : 'España';
    }());
    var states = ['Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Gipuzkoa', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Las Palmas', 'Pontevedra', 'La Rioja', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Bizkaia', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'];
    var countries = ['España', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Bélgica', 'Países Bajos', 'Reino Unido', 'Otro'];
    var stateDatalist = '<datalist id="fo-state-list">' + states.map(function (s) { return '<option value="' + _esc(s) + '">'; }).join('') + '</datalist>';
    var countryOpts = countries.map(function (c) { return '<option value="' + _esc(c) + '"' + (selectedCountry === c ? ' selected' : '') + '>' + _esc(c) + '</option>'; }).join('');
    var _fornNifCfg = (function () {
      var code = window.FiscalConfig ? FiscalConfig.countryToCode(selectedCountry) : null;
      return window.FiscalConfig ? FiscalConfig.get(code || 'ES') : { fiscalDocumentLabel: 'NIF / CIF', fiscalDocumentPlaceholder: 'B12345678 ou 12345678Z', fiscalDocumentHint: 'NIF, NIE ou CIF espanhol.' };
    }());
    var card = 'background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
    var headCard = card;
    var secTitle = 'font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.04em;margin-bottom:6px;';
    var secHint = 'font-size:12px;color:#7A746B;line-height:1.5;margin-bottom:16px;';
    var g2 = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;';
    var g3 = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;';
    var iS = _inputStyle();
    var phoneDefaultDdi = _defaultPhoneDdiForCountry(selectedCountry);
    var body = '<div style="display:grid;gap:14px;">' +

      '<div style="' + headCard + '">' +
      '<div style="' + secTitle + '">Dados do fornecedor</div>' +
      '<div style="' + secHint + '">Informações principais para compras, fiscal e geração de contas a pagar.</div>' +
      '<div style="margin-bottom:14px;">' + _field('fo-name', 'Nome *', f.name || '') + '</div>' +
      '<div style="' + g2 + '">' +
      _field('fo-contact', 'Pessoa de contato', f.contact || '') +
      '<div><label id="fo-nif-label" style="' + _labelStyle() + '">' + _esc(_fornNifCfg.fiscalDocumentLabel) + '</label>' +
      '<input id="fo-nif" value="' + _esc(f.nif || f.taxId || '') + '" placeholder="' + _esc(_fornNifCfg.fiscalDocumentPlaceholder) + '" maxlength="20" style="' + iS + '">' +
      '<div id="fo-nif-hint" style="font-size:11px;color:#8A7E7C;margin-top:5px;">' + _esc(_fornNifCfg.fiscalDocumentHint) + '</div></div>' +
      '</div></div>' +

      '<div style="' + card + '">' +
      '<div style="' + secTitle + '">Endereço</div>' +
      '<div style="' + secHint + '">Localização fiscal do fornecedor.' + (window.BocaPlaces && BocaPlaces.getKey() ? ' <span style="color:#1A9E5A;font-weight:600;">● Autocomplete ativo</span>' : '') + '</div>' +
      '<div style="margin-bottom:14px;">' +
      '<label style="' + _labelStyle() + '">Endereço</label>' +
      '<input id="fo-address" type="text" value="' + _esc(f.address || '') + '" placeholder="Rua, número..." autocomplete="off" style="' + iS + '">' +
      stateDatalist + '</div>' +
      '<div style="' + g3 + '">' +
      _field('fo-neighborhood', 'Bairro / Localidade', f.bairro || f.neighborhood || '') +
      '<div><label id="fo-state-label" style="' + _labelStyle() + '">' + _esc(_fornNifCfg.regionLabel || 'Estado / Província') + '</label>' +
      '<input id="fo-state" list="fo-state-list" value="' + _esc(selectedState) + '" placeholder="Selecionar ou digitar..." style="' + iS + '"></div>' +
      _select('fo-country', 'País', countryOpts, 'Modules.Compras._onFornecedorCountryChange()') +
      '</div></div>' +

      '<div style="' + card + '">' +
      '<div style="' + secTitle + '">Contato</div>' +
      '<div style="' + g2 + '">' +
      _phoneField('fo-whatsapp', 'WhatsApp', f.whatsapp || '', phoneDefaultDdi) +
      _phoneField('fo-phone', 'Telefone', f.phone || '', phoneDefaultDdi) +
      '</div>' +
      '<div style="margin-top:14px;"><label style="' + _labelStyle() + '">E-mail</label>' +
      '<input id="fo-email" type="email" value="' + _esc(f.email || '') + '" placeholder="fornecedor@email.com" style="' + iS + '"></div>' +
      '</div>' +

      '<div style="' + card + '">' +
      '<div style="' + secTitle + '">Compras e pagamento</div>' +
      '<div style="' + secHint + '">Padrões usados ao lançar uma compra e gerar contas a pagar.</div>' +
      '<div style="' + g2 + '">' +
      _select('fo-payment-method', 'Forma de pagamento padrão', _finFormasPagOptions(f.defaultPaymentMethod || f.formaPagamentoPadrao)) +
      _field('fo-payment-days', 'Prazo padrão (dias)', f.paymentDays || f.prazoPagamento || '', 'number') +
      '</div></div>' +

      '<div style="' + card + '">' +
      _textarea('fo-notes', 'Observações internas', f.notes || '') +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;margin-top:14px;">' +
      '<input id="fo-ativo" type="checkbox" ' + (f.ativo !== false ? 'checked' : '') + ' style="accent-color:#C4362A;width:16px;height:16px;"> Fornecedor ativo</label>' +
      '</div></div>';

    var footer = id
      ? '<div style="display:flex;align-items:center;gap:8px;">' +
        '<button onclick="Modules.Compras._deleteFornecedor(\'' + id + '\')" style="' + _dangerStyle() + '">Excluir</button>' +
        '<span style="flex:1;"></span>' +
        '<button onclick="window._fornecedorCompraModal&&window._fornecedorCompraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
        '<button onclick="Modules.Compras._saveFornecedor()" style="' + _primaryStyle() + '">Atualizar</button>' +
        '</div>'
      : '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
        '<button onclick="window._fornecedorCompraModal&&window._fornecedorCompraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
        '<button onclick="Modules.Compras._saveFornecedor()" style="' + _primaryStyle() + '">Adicionar</button>' +
        '</div>';
    window._fornecedorCompraModal = UI.modal({ title: id ? 'Editar fornecedor' : 'Novo fornecedor', body: body, footer: footer, maxWidth: '1120px' });
    setTimeout(_initAddressAutocomplete, 300);
  }

  function _onFornecedorCountryChange() {
    var countryVal = (_el('fo-country').value || '');
    var code = window.FiscalConfig ? FiscalConfig.countryToCode(countryVal) : null;
    var cfg = window.FiscalConfig ? FiscalConfig.get(code || countryVal || 'ES') : null;
    if (!cfg) return;
    var nifLabel = document.getElementById('fo-nif-label');
    var nifEl = document.getElementById('fo-nif');
    var nifHint = document.getElementById('fo-nif-hint');
    var stateLabel = document.getElementById('fo-state-label');
    if (nifLabel) nifLabel.textContent = cfg.fiscalDocumentLabel;
    if (nifEl) nifEl.placeholder = cfg.fiscalDocumentPlaceholder;
    if (nifHint) nifHint.textContent = cfg.fiscalDocumentHint;
    if (stateLabel) stateLabel.textContent = cfg.regionLabel || 'Estado / Província';
    var defaultDdi = _defaultPhoneDdiForCountry(countryVal);
    ['fo-whatsapp', 'fo-phone'].forEach(function (prefix) {
      var num = document.getElementById(prefix + '-num');
      var ddi = document.getElementById(prefix + '-ddi');
      if (num && ddi && !String(num.value || '').trim()) ddi.value = defaultDdi;
    });
  }

  function _saveFornecedor() {
    var name = (_el('fo-name').value || '').trim();
    if (!name) { UI.toast('Nome obrigatório', 'error'); return; }
    var nif = (_el('fo-nif').value || '').trim().toUpperCase().replace(/\s|-/g, '');
    var whatsapp = _phoneValue('fo-whatsapp');
    var phone = _phoneValue('fo-phone');
    var email = (_el('fo-email').value || '').trim();
    var _foCountry = (_el('fo-country').value || '');
    var _foNifCfg = window.FiscalConfig ? FiscalConfig.get(FiscalConfig.countryToCode(_foCountry) || _foCountry || 'ES') : null;
    var nifOk = _foNifCfg ? _foNifCfg.validateNif(nif) : (!nif || /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J])$/.test(nif));
    var phoneOk = function (value) {
      if (!value) return true;
      var digits = value.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15 && /^[+0-9() .-]+$/.test(value);
    };
    var emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nifOk) { UI.toast((_foNifCfg && _foNifCfg.nifErrorMsg) || 'NIF/CIF inválido.', 'error'); _el('fo-nif').focus(); return; }
    if (!phoneOk(whatsapp)) { UI.toast('WhatsApp inválido.', 'error'); var wn = document.getElementById('fo-whatsapp-num'); if (wn) wn.focus(); return; }
    if (!phoneOk(phone)) { UI.toast('Telefone inválido.', 'error'); var pn = document.getElementById('fo-phone-num'); if (pn) pn.focus(); return; }
    if (!emailOk) { UI.toast('E-mail inválido.', 'error'); _el('fo-email').focus(); return; }
    var data = {
      name: name,
      contact: _el('fo-contact').value,
      whatsapp: whatsapp,
      phone: phone,
      email: email,
      nif: nif,
      address: _el('fo-address').value,
      bairro: _el('fo-neighborhood').value,
      neighborhood: _el('fo-neighborhood').value,
      estado: _el('fo-state').value,
      state: _el('fo-state').value,
      pais: _el('fo-country').value,
      country: _el('fo-country').value,
      defaultPaymentMethod: _el('fo-payment-method').value,
      paymentDays: parseInt(_el('fo-payment-days').value || '0', 10) || 0,
      notes: _el('fo-notes').value,
      ativo: _el('fo-ativo').checked
    };
    var op = _editingId ? DB.update('fornecedores', _editingId, data) : DB.add('fornecedores', data);
    op.then(function () { UI.toast('Fornecedor salvo!', 'success'); if (window._fornecedorCompraModal) window._fornecedorCompraModal.close(); _renderFornecedores(); });
  }

  function _deleteFornecedor(id) {
    UI.confirm('Eliminar este fornecedor?').then(function (yes) {
      if (!yes) return;
      if (window._fornecedorCompraModal) window._fornecedorCompraModal.close();
      DB.remove('fornecedores', id).then(_renderFornecedores);
    });
  }

  // ── Unidades ──────────────────────────────────────────────────────────────
  function _renderUnidades() {
    DB.getAll('unidades_medida').then(function (data) {
      _unidades = (data || []).sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
      var content = document.getElementById('compras-content');
      if (!content) return;
      content.innerHTML = _head('Unidades de medida', '+ Adicionar unidade', 'Modules.Compras._openUnidadeModal(null)') +
        _basicTable(_unidades, ['Nome', 'Símbolo', 'Tipo'], function (u) { return [_esc(u.name || '-'), _esc(u.symbol || '-'), _esc(u.type || '-')]; }, 'Modules.Compras._openUnidadeModal', 'Modules.Compras._deleteUnidade');
    });
  }

  function _openUnidadeModal(id) {
    _editingId = id;
    var u = id ? (_byId(_unidades, id) || {}) : { type: 'unidade' };
    var body = '<div>' + _field('un-name', 'Nome *', u.name || '') +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' + _field('un-symbol', 'Símbolo *', u.symbol || '') +
      _select('un-type', 'Tipo', '<option value="massa"' + (u.type === 'massa' ? ' selected' : '') + '>Massa</option><option value="volume"' + (u.type === 'volume' ? ' selected' : '') + '>Volume</option><option value="unidade"' + (u.type === 'unidade' ? ' selected' : '') + '>Unidade</option>') + '</div></div>';
    var footer = id
      ? '<div style="display:flex;align-items:center;gap:8px;">' +
        '<button onclick="Modules.Compras._deleteUnidade(\'' + id + '\')" style="' + _dangerStyle() + '">Excluir</button>' +
        '<span style="flex:1;"></span>' +
        '<button onclick="window._unidadeCompraModal&&window._unidadeCompraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
        '<button onclick="Modules.Compras._saveUnidade()" style="' + _primaryStyle() + '">Atualizar</button>' +
        '</div>'
      : '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
        '<button onclick="window._unidadeCompraModal&&window._unidadeCompraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
        '<button onclick="Modules.Compras._saveUnidade()" style="' + _primaryStyle() + '">Adicionar</button>' +
        '</div>';
    window._unidadeCompraModal = UI.modal({ title: id ? 'Editar unidade' : 'Nova unidade', body: body, footer: footer });
  }

  function _saveUnidade() {
    var name = (_el('un-name').value || '').trim();
    var symbol = (_el('un-symbol').value || '').trim();
    if (!name || !symbol) { UI.toast('Nome e símbolo são obrigatórios', 'error'); return; }
    var data = { name: name, symbol: symbol, type: _el('un-type').value || 'unidade' };
    var op = _editingId ? DB.update('unidades_medida', _editingId, data) : DB.add('unidades_medida', data);
    op.then(function () { UI.toast('Unidade salva!', 'success'); if (window._unidadeCompraModal) window._unidadeCompraModal.close(); _renderUnidades(); });
  }

  function _deleteUnidade(id) {
    UI.confirm('Eliminar esta unidade?').then(function (yes) {
      if (!yes) return;
      if (window._unidadeCompraModal) window._unidadeCompraModal.close();
      DB.remove('unidades_medida', id).then(_renderUnidades);
    });
  }

  // ── Tipos & Categorias ────────────────────────────────────────────────────
  // ── Configurações (Tipos + Categorias em subtabs) ─────────────────────────
  function _renderConfiguracoes() {
    Promise.all([DB.getAll('compras_tipos'), DB.getAll('compras_categorias')]).then(function (r) {
      _tipos = r[0] || [];
      _categorias = r[1] || [];
      _editingKind = _configSub;
      _paintConfiguracoes();
    });
  }

  function _paintConfiguracoes() {
    var content = document.getElementById('compras-content');
    if (!content) return;
    _editingKind = _configSub;
    var tabBtn = function (key, label) {
      var active = _configSub === key;
      return '<button onclick="Modules.Compras._switchConfigSub(\'' + key + '\')" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid ' + (active ? '#B42318' : '#EAE4DA') + ';background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#1F1F1F') + ';font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">' + label + '</button>';
    };
    content.innerHTML = '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
      '<div><div style="font-size:11px;font-weight:600;color:#A39B90;letter-spacing:.02em;margin-bottom:5px;">Compras</div><h2 style="font-size:28px;font-weight:600;line-height:1.1;margin:0 0 6px;color:#1F1F1F;">Configurações</h2><p style="font-size:15px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Cadastros auxiliares usados nas compras, produtos e insumos.</p></div>' +
      '</div>';
    content.innerHTML += '<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;">' + tabBtn('tipos', 'Tipos') + tabBtn('categorias', 'Categorias') + '</div>' +
      '<div id="compras-config-sub"></div>';
    _paintSimpleList(_configSub);
  }

  function _switchConfigSub(sub) {
    _configSub = sub;
    _editingKind = sub;
    _simpleListQ = '';
    _simpleListClasseFilter = '';
    _paintConfiguracoes();
  }

  function _renderSimpleList(kind) {
    _editingKind = kind;
    var col = kind === 'tipos' ? 'compras_tipos' : 'compras_categorias';
    DB.getAll(col).then(function (data) {
      if (kind === 'tipos') _tipos = data || [];
      else _categorias = data || [];
      _paintSimpleList(kind);
    });
  }

  function _paintSimpleList(kind) {
    _editingKind = kind;
    var inConfig = _activeSub === 'configuracoes';
    var target = inConfig
      ? document.getElementById('compras-config-sub')
      : document.getElementById('compras-content');
    if (!target) return;
    var chipBtn = function (classe, label) {
      var active = _simpleListClasseFilter === classe || (!classe && !_simpleListClasseFilter);
      return '<button onclick="Modules.Compras._setSimpleListClasse(\'' + kind + '\',\'' + classe + '\')" style="height:34px;padding:0 12px;border-radius:10px;border:1px solid ' + (active ? '#B42318' : '#EAE4DA') + ';background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#1F1F1F') + ';font-size:12px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">' + label + '</button>';
    };
    var filterBlock = '<div style="' + _cardStyle() + 'margin-bottom:16px;">' +
      '<div style="display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:10px;align-items:end;">' +
        '<input id="sl-search-' + kind + '" type="search" placeholder="Buscar por nome ou classe..." value="' + _esc(_simpleListQ) + '" oninput="Modules.Compras._setSimpleListQ(\'' + kind + '\',this.value)" style="' + _inputStyle() + 'height:40px;">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
          chipBtn('', 'Todos') + chipBtn('insumo', 'Insumo') + chipBtn('produto', 'Produto') +
        '</div>' +
      '</div>' +
    '</div>';
    var tableWrap = '<div id="compras-simpleList-table-' + kind + '"></div>';
    if (inConfig) {
      target.innerHTML = filterBlock + tableWrap;
    } else {
      target.innerHTML = _head(kind === 'tipos' ? 'Tipos' : 'Categorias', '+ Adicionar', 'Modules.Compras._openSimpleModal(null)') +
        filterBlock + tableWrap;
    }
    _repaintSimpleTable(kind);
  }

  function _repaintSimpleTable(kind) {
    var wrap = document.getElementById('compras-simpleList-table-' + kind);
    if (!wrap) return;
    var all = (kind === 'tipos' ? _tipos : _categorias).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var filtered = _simpleListClasseFilter ? all.filter(function (x) { return (x.classe || '') === _simpleListClasseFilter; }) : all;
    if (_simpleListQ) {
      var sq = _simpleListQ.toLowerCase();
      var classeLabel = { insumo: 'insumo', produto: 'produto', ambos: 'ambos' };
      filtered = filtered.filter(function (x) {
        var hay = [x.name, x.description, x.descricao, classeLabel[x.classe] || ''].join(' ').toLowerCase();
        return hay.indexOf(sq) >= 0;
      });
    }
    var p = _pag[kind];
    var totalPages = p ? Math.max(1, Math.ceil(filtered.length / p.perPage)) : 1;
    if (p && p.page > totalPages) p.page = totalPages;
    var pageData = p ? filtered.slice((p.page - 1) * p.perPage, p.page * p.perPage) : filtered;
    var title = kind === 'tipos' ? 'Tipos' : 'Categorias';
    var desc = kind === 'tipos'
      ? 'Cadastros usados para classificar produtos e insumos nas compras.'
      : 'Agrupamentos usados para organizar produtos e insumos nas compras.';
    var addLabel = kind === 'tipos' ? '+ Adicionar tipo' : '+ Adicionar categoria';
    var empty = '<div style="text-align:center;padding:48px 20px;color:#8A7E7C;font-size:14px;line-height:1.45;font-weight:600;">Nenhum registro cadastrado.</div>';
    var list = pageData.map(function (x) {
      var classe = x.classe === 'produto' ? 'Produto' : x.classe === 'insumo' ? 'Insumo' : 'Todos';
      var ativo = x.ativo === false ? 'Inativo' : 'Ativo';
      return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:14px 14px;box-shadow:0 1px 2px rgba(31,31,31,.03);display:flex;align-items:center;gap:12px;transition:background .15s ease;">' +
        '<div style="min-width:0;flex:1;">' +
          '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(x.name || '-') + '</div>' +
          '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">Cadastro usado em compras e produtos/insumos.</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">' +
          _catalogLikeChip(classe, x.classe === 'produto' ? '#2F5F93' : (x.classe === 'insumo' ? '#8A6F5A' : '#6F6860')) +
          _catalogLikeChip(ativo, x.ativo === false ? '#B42318' : '#1F6F43') +
          '<button onclick="Modules.Compras._openSimpleModal(\'' + x.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">edit</span></button>' +
          '<button onclick="Modules.Compras._deleteSimple(\'' + x.id + '\')" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#B42318;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);"><span class="mi" style="font-size:14px;">delete</span></button>' +
        '</div>' +
      '</div>';
    }).join('');
    wrap.innerHTML = '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
      '<button onclick="Modules.Compras._openSimpleModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">' + addLabel + '</button>' +
      '</div>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle(title + ' (' + filtered.length + ')', desc) +
        (filtered.length === 0 ? empty : '<div style="display:flex;flex-direction:column;gap:10px;">' + list + '</div>') +
      '</section>' +
      _pagerHtml(kind, filtered.length);
  }

  function _setSimpleListClasse(kind, classe) {
    _simpleListClasseFilter = classe;
    _paintSimpleList(kind);
  }

  function _setSimpleListQ(kind, q) {
    _simpleListQ = (q || '').trim();
    _repaintSimpleTable(kind);
  }

  function _openSimpleModal(id) {
    _editingId = id;
    var list = _editingKind === 'tipos' ? _tipos : _categorias;
    var item = id ? (_byId(list, id) || {}) : { ativo: true, classe: _simpleListClasseFilter || 'insumo' };
    var iS = _inputStyle();
    var body = '<div style="display:grid;gap:12px;">' +
      _field('sl-name', 'Nome *', item.name || '') +
      '<div><label style="' + _labelStyle() + '">Classe</label><select id="sl-classe" style="' + iS + 'background:#fff;">' +
      '<option value="insumo"' + ((item.classe || '') === 'insumo' ? ' selected' : '') + '>Insumo</option>' +
      '<option value="produto"' + (item.classe === 'produto' ? ' selected' : '') + '>Produto</option>' +
      '</select></div>' +
      '<div style="display:flex;align-items:center;gap:8px;padding:10px;background:#FAFAF8;border-radius:10px;border:1px solid #EAE4DA;">' +
      '<input id="sl-ativo" type="checkbox" ' + (item.ativo !== false ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:#C4362A;">' +
      '<label for="sl-ativo" style="font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;">Ativo</label></div></div>';
    var footer = '<button onclick="Modules.Compras._saveSimple()" style="width:100%;height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">' + (id ? 'Atualizar' : 'Adicionar') + '</button>';
    var kindLabel = _editingKind === 'tipos' ? 'Tipo' : 'Categoria';
    window._simpleCompraModal = UI.modal({ title: id ? 'Editar ' + kindLabel : 'Novo ' + kindLabel, body: body, footer: footer });
  }

  function _saveSimple() {
    var name = (_el('sl-name').value || '').trim().replace(/\s+/g, ' ');
    if (!name) { UI.toast('Nome obrigatório', 'error'); return; }
    var col = _editingKind === 'tipos' ? 'compras_tipos' : 'compras_categorias';
    var classeVal = _el('sl-classe').value || 'insumo';
    var currentList = _editingKind === 'tipos' ? _tipos : _categorias;
    var norm = _normCatalogName(name);
    var duplicate = (currentList || []).find(function (item) {
      return item && item.id !== _editingId && (item.classe || '') === classeVal && _normCatalogName(item.name) === norm;
    });
    if (duplicate) {
      UI.toast('Já existe um registro com esse nome para essa classe.', 'error');
      return;
    }
    var op = _editingId ? DB.update(col, _editingId, { name: name, ativo: _el('sl-ativo').checked, classe: classeVal }) : DB.add(col, { name: name, ativo: _el('sl-ativo').checked, classe: classeVal });
    op.then(function () {
      UI.toast('Salvo!', 'success');
      if (window._simpleCompraModal) window._simpleCompraModal.close();
      _renderSimpleList(_editingKind);
      return Promise.all([DB.getAll('compras_tipos'), DB.getAll('compras_categorias')]).then(function (r) {
        _tipos = r[0] || [];
        _categorias = r[1] || [];
        _refreshItemViews();
      });
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteSimple(id) {
    var col = _editingKind === 'tipos' ? 'compras_tipos' : 'compras_categorias';
    UI.confirm('Eliminar este registro?').then(function (yes) {
      if (!yes) return;
      if (window._simpleCompraModal) window._simpleCompraModal.close();
      DB.remove(col, id).then(function () {
        _renderSimpleList(_editingKind);
        return Promise.all([DB.getAll('compras_tipos'), DB.getAll('compras_categorias')]).then(function (r) {
          _tipos = r[0] || [];
          _categorias = r[1] || [];
          _refreshItemViews();
        });
      }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
    });
  }

  // ── Financeiro: estado e vínculo com compras ──────────────────────────────

  function _uniqById(arr) {
    var seen = {};
    return (arr || []).filter(function (x) { if (!x || seen[x.id]) return false; seen[x.id] = true; return true; });
  }

  // Carrega todas as contas a pagar vinculadas a uma compra (busca nas duas coleções)
  function _loadContasPagarForCompra(compra) {
    if (!compra || !compra.id) return Promise.resolve([]);
    var ids = [];
    if (compra.contaPagarId) ids.push(compra.contaPagarId);
    if (Array.isArray(compra.contaPagarIds)) ids = ids.concat(compra.contaPagarIds);
    ids = ids.filter(Boolean);
    return Promise.all([DB.getAll('financeiro_apagar'), DB.getAll('contas_pagar')]).then(function (r) {
      var fromFA = (r[0] || []).map(function (c) { return Object.assign({}, c, { _col: 'financeiro_apagar' }); });
      var fromCP = (r[1] || []).map(function (c) { return Object.assign({}, c, { _col: 'contas_pagar' }); });
      var all = _uniqById(fromFA.concat(fromCP));
      return all.filter(function (c) {
        return c.sourceCompraId === compra.id || c.compraId === compra.id || (c.sourceCollection === 'compras' && c.sourceId === compra.id) || ids.indexOf(c.id) >= 0;
      });
    });
  }

  function _reservarNumerosFinanceiroSaida(qtd) {
    var total = Math.max(parseInt(qtd, 10) || 0, 0);
    if (!total) return Promise.resolve([]);
    return DB.getDocRoot('config', 'financeiro').then(function (cfg) {
      cfg = cfg || {};
      var start = (parseInt(cfg.saidaSeq || 0, 10) || 0) + 1;
      return DB.setDocRoot('config', 'financeiro', { saidaSeq: start + total - 1 }).then(function () {
        var seqs = [];
        for (var i = 0; i < total; i++) {
          seqs.push('SA-' + String(start + i).padStart(6, '0'));
        }
        return seqs;
      });
    });
  }

  // Carrega estado financeiro completo de uma compra
  function _loadEstadoFinanceiro(compraId) {
    var compra = _byId(_compras, compraId);
    if (!compra) return Promise.resolve({ contas: [], movs: [], hasPaid: false, hasPending: false, paidContas: [], pendingContas: [] });
    return Promise.all([_loadContasPagarForCompra(compra), DB.getAll('movimentacoes')]).then(function (r) {
      var contas = r[0] || [];
      var movs = r[1] || [];
      var paidContas = [], pendingContas = [];
      contas.forEach(function (c) {
        var status = _statusContaPagar(c);
        if (status === 'estornada' || status === 'cancelada') return; // ignora — histórico apenas
        if (status === 'pago' || status === 'parcial') {
          var hasConfirmed = movs.some(function (m) {
            return m.contaPagarId === c.id && m.tipo === 'saida' && m.status === 'efetivado';
          });
          if (hasConfirmed) paidContas.push(c);
          else pendingContas.push(c); // status marcado mas sem movimento confirmado
        } else {
          pendingContas.push(c);
        }
      });
      return { contas: contas, movs: movs, hasPaid: paidContas.length > 0, hasPending: pendingContas.length > 0, paidContas: paidContas, pendingContas: pendingContas };
    });
  }

  // Atualiza o banner e o rodapé do modal de compra com base no estado financeiro
  function _updateCompraModalUI(id, estado) {
    var bannerEl = document.getElementById('cp-financial-status');
    var footerEl = document.getElementById('cp-footer-wrap');
    if (!bannerEl && !footerEl) return;
    if (estado.hasPaid) {
      if (bannerEl) bannerEl.innerHTML =
        '<div style="background:#FFF0EE;border:1px solid #F1C4BC;border-radius:12px;padding:14px 16px;margin-bottom:14px;">' +
        '<div style="font-size:13px;font-weight:600;color:#C4362A;margin-bottom:5px;">⚠ Esta compra possui pagamento confirmado.</div>' +
        '<div style="font-size:13px;color:#5A4E4C;line-height:1.5;">Para alterar valores, itens ou parcelas, primeiro estorne os pagamentos vinculados. O sistema manterá o histórico financeiro e liberará a compra para edição.</div>' +
        '</div>';
      if (footerEl) footerEl.innerHTML =
        '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
        '<button onclick="window._compraModal&&window._compraModal.close()" style="' + _cancelStyle() + '">Fechar</button>' +
        '<button onclick="Modules.Compras._saveStatusOnly(\'' + id + '\')" style="background:#2563EB;color:#fff;border:none;padding:13px 22px;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Salvar status</button>' +
        '<button onclick="Modules.Compras._estornarPagamentosModal(\'' + id + '\')" style="background:#C4362A;color:#fff;border:none;padding:13px 22px;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Estornar pagamentos e liberar edição</button>' +
        '</div>';
      // Bloqueia todos os campos estruturais — mantém apenas cp-status editável
      var formEl = bannerEl ? bannerEl.parentElement : null;
      if (formEl) {
        var lockedEls = formEl.querySelectorAll('input,select,textarea,button');
        for (var k = 0; k < lockedEls.length; k++) {
          if (lockedEls[k].id === 'cp-status') continue; // status sempre editável
          lockedEls[k].disabled = true;
          lockedEls[k].style.opacity = '0.55';
          lockedEls[k].style.cursor = 'not-allowed';
          lockedEls[k].style.pointerEvents = 'none';
        }
        // Restaura aparência normal do campo Status
        var statusEl = document.getElementById('cp-status');
        if (statusEl) {
          statusEl.style.opacity = '';
          statusEl.style.cursor = '';
          statusEl.style.pointerEvents = '';
        }
      }
    } else if (estado.hasPending) {
      if (bannerEl) bannerEl.innerHTML =
        '<div style="background:#FFF8F1;border:1px solid #F1D6C8;border-radius:12px;padding:12px 16px;margin-bottom:14px;">' +
        '<div style="font-size:13px;color:#8A5A2A;">Esta compra possui parcelas pendentes no financeiro. Salve a compra e use \'Atualizar Financeiro\' na listagem para sincronizar as contas a pagar.</div>' +
        '</div>';
      if (footerEl) footerEl.innerHTML = _compraFooterEditHtml(id);
    } else {
      if (bannerEl) bannerEl.innerHTML = '';
      if (footerEl) footerEl.innerHTML = _compraFooterEditHtml(id);
    }
  }

  function _compraFooterEditHtml(id) {
    return '<div style="display:flex;align-items:center;gap:8px;">' +
      '<button onclick="Modules.Compras._deleteCompra(\'' + id + '\')" style="' + _dangerStyle() + '">Excluir compra</button>' +
      '<span style="flex:1;"></span>' +
      '<button onclick="window._compraModal&&window._compraModal.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
      '<button onclick="Modules.Compras._saveCompra()" style="' + _primaryStyle() + '">Atualizar compra</button>' +
      '</div>';
  }

  function _setCompraSavingUI(isSaving) {
    var footerEl = document.getElementById('cp-footer-wrap');
    if (!footerEl) return;
    var buttons = footerEl.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = !!isSaving;
      buttons[i].style.opacity = isSaving ? '0.6' : '';
      buttons[i].style.cursor = isSaving ? 'not-allowed' : '';
    }
    var primary = buttons.length ? buttons[buttons.length - 1] : null;
    if (!primary) return;
    if (isSaving) {
      if (!primary.getAttribute('data-original-text')) primary.setAttribute('data-original-text', primary.textContent || '');
      primary.textContent = 'Salvando...';
    } else {
      var original = primary.getAttribute('data-original-text');
      if (original) primary.textContent = original;
      primary.removeAttribute('data-original-text');
    }
  }

  // Salva somente o status da compra — não toca em contas a pagar nem parcelas
  function _saveStatusOnly(id) {
    var statusEl = document.getElementById('cp-status');
    if (!statusEl) { UI.toast('Campo de status não encontrado.', 'error'); return; }
    var newStatus = statusEl.value;
    DB.update('compras', id, { statusCompra: newStatus }).then(function () {
      var compra = _byId(_compras, id);
      if (compra) compra.statusCompra = newStatus;
      UI.toast('Status atualizado com sucesso.', 'success');
      _paintRegistrosTable();
      if (window._compraModal) window._compraModal.close();
    }).catch(function (err) {
      UI.toast('Erro ao salvar status: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  // Estorno: abre confirmação e executa
  function _estornarPagamentosModal(compraId) {
    if (!_compraEstadoFinanceiro || !_compraEstadoFinanceiro.hasPaid) {
      UI.toast('Não foi possível encontrar as parcelas financeiras vinculadas a esta compra.', 'error');
      return;
    }
    UI.confirm('O sistema vai criar lançamentos de estorno para os pagamentos confirmados, cancelar as parcelas pendentes e liberar a compra para edição. O histórico financeiro será mantido. Confirmar estorno?')
      .then(function (yes) { if (yes) _executarEstorno(compraId, _compraEstadoFinanceiro); });
  }

  function _executarEstorno(compraId, estado) {
    var now = new Date().toISOString();
    var today = now.slice(0, 10);
    var ops = [];
    // 1. Para cada parcela paga: criar movimento de estorno + marcar movimento original
    estado.paidContas.forEach(function (conta) {
      var paymovs = (estado.movs || []).filter(function (m) {
        return m.contaPagarId === conta.id && m.tipo === 'saida' && m.status === 'efetivado';
      });
      paymovs.forEach(function (m) {
        ops.push(DB.add('movimentacoes', {
          tipo: 'entrada',
          descricao: 'Estorno: ' + (m.descricao || 'Pagamento de compra'),
          valor: m.valor,
          data: today,
          status: 'efetivado',
          conta_id: m.conta_id || '',
          contaPagarId: conta.id,
          sourceCompraId: compraId,
          estornoDeMovId: m.id,
          origem: 'estorno_compra',
          createdAt: now
        }));
        ops.push(DB.update('movimentacoes', m.id, { estornado: true, estornadoEm: now }));
      });
      // 2. Marcar parcela paga como Estornada (manter no histórico)
      ops.push(DB.update(conta._col || 'financeiro_apagar', conta.id, { status: 'Estornada', estornadoEm: now }));
    });
    // 3. Remover parcelas pendentes vinculadas
    estado.pendingContas.forEach(function (conta) {
      ops.push(DB.remove(conta._col || 'financeiro_apagar', conta.id));
    });
    // 4. Limpar vínculos da compra (mantém sourceCompraId nas contas para histórico)
    ops.push(DB.update('compras', compraId, { contaPagarId: '', contaPagarIds: [], contaPagarEstornadaEm: now }));

    Promise.all(ops).then(function () {
      _compraEstadoFinanceiro = { hasPaid: false, hasPending: false, paidContas: [], pendingContas: [], contas: [], movs: [] };
      UI.toast('Pagamentos estornados. A compra foi liberada para edição.', 'success');
      var bannerEl = document.getElementById('cp-financial-status');
      var footerEl = document.getElementById('cp-footer-wrap');
      if (bannerEl) bannerEl.innerHTML =
        '<div style="background:#F0FFF4;border:1px solid #B7E4C7;border-radius:12px;padding:12px 16px;margin-bottom:14px;">' +
        '<div style="font-size:13px;color:#1A9E5A;font-weight:600;">✓ Pagamentos estornados. A compra foi liberada para edição.</div>' +
        '</div>';
      if (footerEl) footerEl.innerHTML = _compraFooterEditHtml(compraId);
    }).catch(function (err) {
      UI.toast('Não foi possível estornar os pagamentos desta compra. Verifique os vínculos financeiros antes de continuar.', 'error');
      console.error('[Compras] Erro no estorno:', err);
    });
  }

  // Cancela (remove) parcelas pendentes vinculadas à compra
  function _cancelarParcelasPendentes(pendingContas) {
    if (!pendingContas || !pendingContas.length) return Promise.resolve();
    return Promise.all(pendingContas.map(function (c) { return DB.remove(c._col || 'financeiro_apagar', c.id); }));
  }

  function _parcelasPreviewFromCompra(compra) {
    if (Array.isArray(compra.parcelasPreview) && compra.parcelasPreview.length) {
      return compra.parcelasPreview.map(function (p) { return Object.assign({}, p); });
    }
    var total = _num(compra.total);
    var parcelas = Math.max(parseInt(compra.parcelas || 1, 10) || 1, 1);
    var prazo = Math.max(parseInt(compra.prazoParcelas || 30, 10) || 30, 1);
    var vencBase = compra.dueDate || compra.data || '';
    var fornNome = _getFornecedorNome(compra.fornecedorId) || 'Compra sem fornecedor';
    var pcLabel = compra.numPedido || '';
    var descBase = (pcLabel ? 'Pedido de Compra #' + pcLabel + ' — ' : 'Compra — ') + fornNome;
    var out = [];
    if (!total) return out;
    if (compra.teveEntrada) {
      var entradaValor = _num(compra.entradaValor);
      if (entradaValor > 0) {
        out.push({
          index: -1,
          isEntrada: true,
          descricao: descBase + ' — Entrada',
          valor: entradaValor,
          vencimento: compra.entradaData || '',
          contaBancariaId: compra.entradaContaBancariaId || '',
          contaBancariaNome: compra.entradaContaBancariaNome || _accountName(compra.entradaContaBancariaId),
          contaBancariaOrigem: compra.entradaContaBancariaId ? 'financeiro' : '',
          formaPagamento: compra.entradaFormaPagamento || ''
        });
      }
      var saldo = Math.max(total - entradaValor, 0);
      if (saldo <= 0.01) return out;
      var valorParcEntrada = parseFloat((saldo / parcelas).toFixed(2));
      for (var e = 0; e < parcelas; e++) {
        out.push({
          index: e,
          descricao: descBase + (parcelas > 1 ? ' — Parcela ' + (e + 1) + '/' + parcelas : ''),
          valor: e === parcelas - 1 ? +(saldo - (valorParcEntrada * (parcelas - 1))).toFixed(2) : valorParcEntrada,
          vencimento: vencBase ? _addLocalDays(vencBase, e * prazo) : '',
          contaBancariaId: compra.contaBancariaId || compra.entradaContaBancariaId || '',
          contaBancariaNome: compra.contaBancariaNome || compra.entradaContaBancariaNome || _accountName(compra.contaBancariaId || compra.entradaContaBancariaId),
          contaBancariaOrigem: (compra.contaBancariaId || compra.entradaContaBancariaId) ? 'financeiro' : '',
          formaPagamento: compra.formaPagamento || ''
        });
      }
      return out;
    }
    var valorParcela = parseFloat((total / parcelas).toFixed(2));
    for (var i = 0; i < parcelas; i++) {
      out.push({
        index: i,
        descricao: descBase + (parcelas > 1 ? ' — Parcela ' + (i + 1) + '/' + parcelas : ''),
        valor: i === parcelas - 1 ? +(total - (valorParcela * (parcelas - 1))).toFixed(2) : valorParcela,
        vencimento: vencBase ? _addLocalDays(vencBase, i * prazo) : '',
        contaBancariaId: compra.contaBancariaId || '',
        contaBancariaNome: compra.contaBancariaNome || _accountName(compra.contaBancariaId),
        contaBancariaOrigem: compra.contaBancariaId ? 'financeiro' : '',
        formaPagamento: compra.formaPagamento || ''
      });
    }
    return out;
  }

  function _validarCompraParaFinanceiro(compra) {
    var missing = [];
    var total = _num(compra.total);
    var saldo = total - (compra.teveEntrada ? _num(compra.entradaValor) : 0);
    if (!compra.id) missing.push('compraId');
    if (compra.gerarContaPagar === false) missing.push('gerar conta a pagar');
    if (!compra.costClass) missing.push('classificação do custo');
    if (total <= 0) missing.push('valor total');
    if (!compra.categoriaFinanceiraId) missing.push('categoria financeira');
    if (compra.teveEntrada) {
      if (_num(compra.entradaValor) <= 0) missing.push('valor da entrada');
      if (!compra.entradaData) missing.push('data da entrada');
      if (!compra.entradaContaBancariaId) missing.push('conta bancária da entrada');
      if (!compra.entradaFormaPagamento || compra.entradaFormaPagamento === 'A definir') missing.push('forma de pagamento da entrada');
      if (saldo > 0.01) {
        if (!compra.contaBancariaId && !compra.entradaContaBancariaId) missing.push('conta bancária prevista');
        if (!compra.formaPagamento || compra.formaPagamento === 'A definir') missing.push('forma de pagamento');
        if (!compra.dueDate) missing.push('vencimento');
        if ((parseInt(compra.parcelas || 0, 10) || 0) < 1) missing.push('parcelas');
      }
    } else {
      if (!compra.contaBancariaId) missing.push('conta bancária prevista');
      if (!compra.formaPagamento || compra.formaPagamento === 'A definir') missing.push('forma de pagamento');
      if (!compra.dueDate) missing.push('vencimento');
      if ((parseInt(compra.parcelas || 0, 10) || 0) < 1) missing.push('parcelas');
    }
    if (Array.isArray(compra.parcelasPreview) && compra.parcelasPreview.length) {
      var previewTotal = compra.parcelasPreview.reduce(function (s, p) { return s + _num(p.valor); }, 0);
      if (Math.abs(previewTotal - total) > 0.01) missing.push('total das parcelas');
      var invalidParcelas = compra.parcelasPreview.some(function (p) {
        return _num(p.valor) <= 0 || !p.vencimento;
      });
      if (invalidParcelas) missing.push('valores das parcelas');
    }
    return missing;
  }

  function _contasAtivasForCompra(compra) {
    return _loadContasPagarForCompra(compra).then(function (contas) {
      return (contas || []).filter(function (c) {
        var st = _statusContaPagar(c);
        return st !== 'estornada' && st !== 'cancelada';
      });
    });
  }

  function _focarFinanceiroCompra() {
    setTimeout(function () {
      var sec = document.getElementById('cp-financeiro-section');
      if (!sec) return;
      sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sec.style.boxShadow = '0 0 0 2px rgba(196,54,42,.22)';
      setTimeout(function () { if (sec) sec.style.boxShadow = ''; }, 1800);
    }, 450);
  }

  function _abrirCompraParaCompletarFinanceiro(id) {
    _openCompraModal(id);
    _focarFinanceiroCompra();
  }

  function _abrirAtualizacaoFinanceiroPrompt(id) {
    var compra = _byId(_compras, id) || {};
    var contas = _activeBankAccounts();
    if (!contas.length) {
      UI.toast('Cadastre uma conta bancária em Financeiro > Contas Bancárias antes de atualizar o Financeiro.', 'error');
      return;
    }
    var selected = compra.contaBancariaId || (contas[0] && contas[0].id) || '';
    var body = '<div style="display:grid;gap:12px;">' +
      '<div style="font-size:13px;color:#5A4E4C;line-height:1.5;">Escolha a conta bancária usada para gerar as contas a pagar.</div>' +
      _select('cp-fin-update-conta', 'Conta bancária *', _accountOptions(contas, selected, 'Selecionar conta')) +
      '</div>';
    var footer = '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
      '<button onclick="window._comprasFinPrompt&&window._comprasFinPrompt.close()" style="' + _cancelStyle() + '">Cancelar</button>' +
      '<button onclick="Modules.Compras._confirmarAtualizacaoFinanceiro(\'' + id + '\')" style="' + _primaryStyle() + '">Enviar para Financeiro</button>' +
      '</div>';
    window._comprasFinPrompt = UI.modal({ title: 'Atualizar Financeiro', body: body, footer: footer, maxWidth: '560px' });
  }

  function _confirmarAtualizacaoFinanceiro(id) {
    var compra = _byId(_compras, id) || {};
    var contaId = (_el('cp-fin-update-conta').value || '').trim();
    if (!contaId) { UI.toast('Selecione a conta bancária.', 'error'); return; }
    var conta = _byId(_contas, contaId) || {};
    var patch = {
      contaBancariaId: contaId,
      contaBancariaNome: conta.nome || conta.name || '',
      contaBancariaOrigem: 'financeiro'
    };
    DB.update('compras', id, patch).then(function () {
      var compraAtualizada = Object.assign({}, compra, patch);
      return _gerarFinanceiroDaCompraSalva(id, {
        compra: compraAtualizada,
        validationMessage: 'Complete os dados financeiros antes de enviar para o Financeiro.'
      });
    }).then(function () {
      if (window._comprasFinPrompt) window._comprasFinPrompt.close();
      _renderRegistros();
    }).catch(function (err) {
      if (err && err.message === 'validation') return;
      UI.toast('Não foi possível atualizar o Financeiro. Revise os dados financeiros da compra.', 'error');
      console.error('[Compras] Falha ao confirmar atualização financeira', { compraId: id, contaId: contaId, error: err });
    });
  }

  function _gerarFinanceiroDaCompraSalva(id, opts) {
    opts = opts || {};
    if (_sendingFinanceiro[id]) return;
    var compra = opts.compra || _byId(_compras, id);
    if (!compra) { UI.toast('Compra não encontrada.', 'error'); return; }
    _sendingFinanceiro[id] = true;
    _paintRegistrosTable();
    return _loadEstadoFinanceiro(id).then(function (estado) {
      if (estado.hasPaid) {
        UI.toast('Esta compra possui pagamento confirmado. Estorne os pagamentos antes de atualizar o Financeiro.', 'error');
        return Promise.reject(new Error('paid'));
      }
      var missing = _validarCompraParaFinanceiro(compra);
      if (missing.length) {
        if (opts.openModalOnValidation) {
          _abrirCompraParaCompletarFinanceiro(id);
        } else {
          _focarFinanceiroCompra();
        }
        UI.toast(
          opts.validationMessage || 'Complete os dados financeiros antes de enviar para o Financeiro.',
          'error'
        );
        return Promise.reject(new Error('validation'));
      }
      var pending = estado.pendingContas || [];
      // Verifica parcelas marcadas como pagas sem movimento confirmado (self-reported)
      var selfPaid = pending.filter(function (c) { return _statusContaPagar(c) === 'pago'; });
      var isFirstSend = !pending.length;
      var doProceed = function () {
        return _cancelarParcelasPendentes(pending).then(function () {
          var data = Object.assign({}, compra, {
            parcelasPreview: _parcelasPreviewFromCompra(compra),
            fornecedorNome: _getFornecedorNome(compra.fornecedorId) || 'Compra sem fornecedor'
          });
          return _criarContasPagar(id, data, _num(compra.total), compra.numPedido);
        }).then(function () {
          UI.toast(
            isFirstSend ? 'Conta a pagar enviada para o Financeiro.' : 'Financeiro atualizado com sucesso.',
            'success'
          );
        });
      };
      if (selfPaid.length > 0) {
        return UI.confirm(
          'Existe(m) ' + selfPaid.length + ' parcela(s) com status "Pago" sem pagamento confirmado no Financeiro. ' +
          'Ao atualizar, essas parcelas serão recriadas como pendentes. Continuar?'
        ).then(function (yes) {
          if (!yes) return Promise.reject(new Error('user_cancel'));
          return doProceed();
        });
      }
      return doProceed();
    }).then(function () {
      _sendingFinanceiro[id] = false;
      _renderRegistros();
    }).catch(function (err) {
      _sendingFinanceiro[id] = false;
      if (err && (err.message === 'validation' || err.message === 'paid' || err.message === 'user_cancel')) {
        _paintRegistrosTable(); return;
      }
      UI.toast('Não foi possível enviar para o Financeiro. Revise os dados financeiros da compra.', 'error');
      _paintRegistrosTable();
    });
  }

  function _enviarCompraFinanceiro(id, opts) {
    return _abrirAtualizacaoFinanceiroPrompt(id);
  }

  function _atualizarCompraFinanceiro(id, opts) {
    return _abrirAtualizacaoFinanceiroPrompt(id);
  }

  function _modalCompraHasUnsavedChanges(id) {
    if (!window._compraModal || _editingId !== id) return false;
    var compra = _byId(_compras, id);
    if (!compra) return false;
    var current = {
      total: (window._compraLinhas || []).reduce(function (s, l) { return s + _lineTotal(l); }, 0),
      valorSemIva: (window._compraLinhas || []).reduce(function (s, l) { return s + (_num(l.valorSemIva) || _lineTotal(l)); }, 0),
      ivaValor: (window._compraLinhas || []).reduce(function (s, l) { return s + _num(l.ivaValor); }, 0),
      itens: window._compraLinhas || [],
      gerarContaPagar: _el('cp-gerar-apagar').checked,
      formaPagamento: _el('cp-forma').value,
      dueDate: _dateInputValue('cp-venc'),
      parcelas: parseInt(_el('cp-parcelas').value || '1', 10) || 1,
      prazoParcelas: parseInt(_el('cp-prazo').value || '30', 10) || 30,
      categoriaFinanceiraId: _el('cp-fin-cat').value,
      teveEntrada: !!(document.getElementById('cp-teve-entrada') && document.getElementById('cp-teve-entrada').checked),
      entradaValor: _num(_el('cp-entrada-valor').value),
      entradaData: _dateInputValue('cp-entrada-data'),
      entradaFormaPagamento: _el('cp-entrada-forma').value || '',
      parcelasPreview: compra.parcelasPreview || []
    };
    return _financeiroSignature(compra) !== _financeiroSignature(current);
  }

  function _enviarCompraFinanceiroFromModal(id) {
    return _abrirAtualizacaoFinanceiroPrompt(id);
  }

  function _enviarCompraFinanceiroFromList(id) {
    return _abrirAtualizacaoFinanceiroPrompt(id);
  }

  function _atualizarCompraFinanceiroFromModal(id) {
    return _abrirAtualizacaoFinanceiroPrompt(id);
  }

  // Cria contas a pagar a partir dos dados de uma compra, reutilizando vínculos existentes quando houver.
  function _criarContasPagar(compraId, compraData, total, numPedido) {
    if (!compraId) return Promise.reject(new Error('Compra sem id para gerar contas a pagar.'));
    var parcelas = Math.max(parseInt(compraData.parcelas || 1, 10) || 1, 1);
    var baseDue = compraData.dueDate || compraData.data;
    var now = new Date().toISOString();
    var pcLabel = numPedido || compraData.numPedido || '';
    var fornNome = _getFornecedorNome(compraData.fornecedorId);
    var descBase = (pcLabel ? 'Pedido de Compra #' + pcLabel + ' — ' : 'Compra — ') + fornNome;
    var catFin = (_finCategorias || []).filter(function (c) { return c.id === compraData.categoriaFinanceiraId; })[0] || null;
    var base = {
      fornecedorId: compraData.fornecedorId,
      fornecedorNome: fornNome,
      categoriaId: compraData.categoriaFinanceiraId,
      categoriaFinanceiraId: compraData.categoriaFinanceiraId,
      categoriaFinanceiraNome: catFin ? (catFin.nome || catFin.name || '') : '',
      categoriaFinanceiraTipo: 'saida',
      tipoMovimento: 'saida',
      origem: 'compra',
      status: 'Pendente',
      contaBancariaId: compraData.contaBancariaId,
      contaBancariaNome: compraData.contaBancariaNome || '',
      contaBancariaOrigem: compraData.contaBancariaId ? 'financeiro' : '',
      conta_id: compraData.contaBancariaId,
      formaPagamento: compraData.formaPagamento,
      formaPagamentoNome: compraData.formaPagamento || '',
      costClass: compraData.costClass || 'direto',
      sourceCompraId: compraId,
      compraId: compraId,
      sourceCollection: 'compras',
      sourceId: compraId,
      numPedido: pcLabel,
      pedidoCompraNumero: pcLabel,
      createdAt: now
    };
    var compraRefInfo = {
      id: compraId,
      contaPagarId: compraData.contaPagarId || '',
      contaPagarIds: compraData.contaPagarIds || []
    };
    function updateCompraComRefs(refs) {
      var ids = (refs || []).map(function (r) { return r && r.id ? r.id : ''; }).filter(Boolean);
      if (!ids.length) throw new Error('Nenhuma conta a pagar foi criada.');
      return DB.update('compras', compraId, {
        contaPagarId: ids[0],
        contaPagarIds: ids,
        contaPagarGeradaEm: now,
        contaPagarStatus: 'gerada'
      });
    }
    function createFresh() {
      // ── Usa prévia editável se disponível ─────────────────────────────────
      var preview = (compraData.parcelasPreview && compraData.parcelasPreview.length) ? compraData.parcelasPreview : _compraParcelasPreview;
      if (preview.length > 0) {
        var totalPreviewItems = preview.length;
        var totalParcelasRegulares = preview.filter(function (p) { return !p.isEntrada; }).length;
        var parcelaRegularSeq = 0;
        return _reservarNumerosFinanceiroSaida(totalPreviewItems).then(function (sequenciais) {
          var seqIdx = 0;
          var ops = preview.map(function (p) {
            if (!p.isEntrada) parcelaRegularSeq++;
            var parcelaNumero = p.isEntrada ? 0 : parcelaRegularSeq;
            var numeroParcelas = p.isEntrada ? totalParcelasRegulares : totalParcelasRegulares;
            var extra = totalPreviewItems > 1 ? {
              parcelada: true,
              parcelaNumero: parcelaNumero,
              numeroParcela: parcelaNumero,
              numeroParcelas: numeroParcelas,
              totalParcelas: numeroParcelas,
              parcelamentoId: 'compra_' + compraId,
              isEntrada: p.isEntrada || false,
              tipoParcela: p.isEntrada ? 'entrada' : 'parcela'
            } : { tipoParcela: p.isEntrada ? 'entrada' : 'parcela' };
            var itemContaInfo = p.contaBancariaId
              ? { id: p.contaBancariaId, nome: p.contaBancariaNome || _accountName(p.contaBancariaId) }
              : { id: base.contaBancariaId || '', nome: base.contaBancariaNome || '' };
            var itemData = Object.assign({}, base, extra, {
              descricao: p.descricao || descBase,
              valor: _num(p.valor),
              dueDate: p.vencimento,
              vencimento: p.vencimento,
              contaBancariaId: itemContaInfo.id,
              contaBancariaNome: itemContaInfo.nome,
              contaBancariaOrigem: itemContaInfo.id ? 'financeiro' : '',
              conta_id: itemContaInfo.id,
              numeroSequencial: sequenciais[seqIdx++] || ''
            });
            if (p.formaPagamento) itemData.formaPagamento = p.formaPagamento;
            if (p.formaPagamento) itemData.formaPagamentoNome = p.formaPagamento;
            return DB.add('financeiro_apagar', itemData);
          });
          return Promise.all(ops).then(updateCompraComRefs);
        });
      }
      // ── Cálculo automático (sem prévia) ────────────────────────────────────
      if (parcelas <= 1) {
        return _reservarNumerosFinanceiroSaida(1).then(function (sequenciais) {
          return DB.add('financeiro_apagar', Object.assign({}, base, {
            descricao: descBase,
            valor: total,
            dueDate: baseDue,
            vencimento: baseDue,
            tipoParcela: 'parcela',
            parcelaNumero: 1,
            numeroParcela: 1,
            numeroParcelas: 1,
            totalParcelas: 1,
            numeroSequencial: sequenciais[0] || ''
          })).then(function (ref) {
            return updateCompraComRefs([ref]);
          });
        });
      }
      var valorParcela = total / parcelas;
      return _reservarNumerosFinanceiroSaida(parcelas).then(function (sequenciais) {
        var autoOps = [];
        for (var i = 0; i < parcelas; i++) {
          var vencAuto = _addLocalDays(baseDue || _todayLocal(), i * (parseInt(compraData.prazoParcelas || '30', 10) || 30));
          autoOps.push(DB.add('financeiro_apagar', Object.assign({}, base, {
            descricao: descBase + (parcelas > 1 ? ' — Parcela ' + (i + 1) + '/' + parcelas : ''),
            valor: valorParcela,
            dueDate: vencAuto,
            vencimento: vencAuto,
            parcelada: true,
            parcelaNumero: i + 1,
            numeroParcela: i + 1,
            numeroParcelas: parcelas,
            totalParcelas: parcelas,
            parcelamentoId: 'compra_' + compraId,
            tipoParcela: 'parcela',
            numeroSequencial: sequenciais[i] || ''
          })));
        }
        return Promise.all(autoOps).then(updateCompraComRefs);
      });
    }

    return _loadContasPagarForCompra(compraRefInfo).then(function (existing) {
      var active = (existing || []).filter(function (c) {
        var st = _statusContaPagar(c);
        return st !== 'estornada' && st !== 'cancelada';
      });
      if (active.length) {
        return DB.update('compras', compraId, {
          contaPagarId: active[0].id || '',
          contaPagarIds: active.map(function (c) { return c.id; }).filter(Boolean),
          contaPagarGeradaEm: now,
          contaPagarStatus: 'gerada'
        });
      }
      return createFresh();
    }).catch(function (err) {
      console.error('[Compras] Erro ao gerar contas a pagar para compra salva', {
        compraId: compraId,
        compraData: compraData,
        total: total,
        numPedido: numPedido,
        error: err
      });
      throw err;
    });
  }

  // Executa o save real da compra (desacoplado da UI)
  function _doSaveCompra(compraData, savingId, total, mode) {
    if (_savingCompra) return;
    _savingCompra = true;
    _setCompraSavingUI(true);
    var proceed = function (numPedido) {
      if (numPedido) compraData.numPedido = numPedido;
      var compraId = savingId || '';
      var stage = 'compra';
      var op;
      if (savingId) {
        op = DB.update('compras', savingId, compraData);
      } else {
        var docRef = DB.col('compras').doc();
        compraId = docRef.id;
        var ts = firebase.firestore.FieldValue.serverTimestamp();
        op = docRef.set(Object.assign({}, compraData, { createdAt: ts, updatedAt: ts }));
      }
      op.then(function (ref) {
        if (!compraId && ref && ref.id) compraId = ref.id;
        if (!compraId) throw new Error('Compra salva sem id retornado.');
        stage = 'itens';
        var updates = (compraData.itens || []).map(function (l) {
          var upd = {
            custo_atual: l.custoAjustado,
            preco_compra: l.custoAjustado,
            ultima_compra_data: compraData.data,
            ultima_compra_id: compraId,
            ultima_compra_total: _lineTotal(l),
            ultima_compra_qtd_base: l.qtyBase,
            ultima_embalagem: l.unidadeCompra || '',
            ultimo_conteudo: _num(l.conteudoPorEmbalagem) || 1
          };
          if (compraData.fornecedorId) upd.fornecedor_padrao_id = compraData.fornecedorId;
          return DB.update('itens_custo', l.itemId, upd);
        });
        return Promise.all(updates);
      }).then(function () {
        return null;
      }).then(function () {
        return null;
      }).then(function () {
        _savingCompra = false;
        _setCompraSavingUI(false);
        UI.toast('Compra salva com sucesso.', 'success');
        if (window._compraModal) window._compraModal.close();
        _renderRegistros();
      }).catch(function (err) {
        _savingCompra = false;
        _setCompraSavingUI(false);
        if (!savingId && compraId) _editingId = compraId;
        UI.toast('Erro: ' + err.message, 'error');
      });
    };
    if (!savingId) {
      _gerarNumeroPedido().then(proceed).catch(function () { proceed(''); });
    } else {
      proceed('');
    }
  }

  // Executa a exclusão da compra + remoção de parcelas pendentes vinculadas
  function _doDeleteCompra(id, pendingContas) {
    var ops = (pendingContas || []).map(function (c) { return DB.remove(c._col || 'financeiro_apagar', c.id); });
    ops.push(DB.remove('compras', id));
    Promise.all(ops).then(function () {
      UI.toast('Compra excluída com sucesso.', 'success');
      _renderRegistros();
    }).catch(function (err) { UI.toast('Erro ao excluir: ' + err.message, 'error'); });
  }

  // ── Número de pedido, sugestão de preço, preview de parcelas ─────────────

  function _padNum(n, len) {
    var s = String(n || 0);
    while (s.length < (len || 6)) s = '0' + s;
    return s;
  }

  function _gerarNumeroPedido() {
    return DB.getDocRoot('config', 'compras').then(function (cfg) {
      var last = (cfg && cfg.lastPCNum) ? parseInt(cfg.lastPCNum, 10) || 0 : 0;
      if (!last) last = _compras.length || 0;
      var next = last + 1;
      var writeOp = cfg ? DB.update('config', 'compras', { lastPCNum: next })
                        : DB.add('config', { id: 'compras', lastPCNum: next });
      return writeOp.then(function () { return 'PC-' + _padNum(next, 6); });
    }).catch(function () {
      return 'PC-' + _padNum((_compras.length || 0) + 1, 6);
    });
  }

  function _getFornecedorNome(fornecedorId) {
    if (!fornecedorId) return 'Compra sem fornecedor';
    var f = _byId(_fornecedores, fornecedorId);
    return (f && f.name) ? f.name : 'Compra sem fornecedor';
  }

  // Retorna a última configuração de compra usada para um item (embalagem, conteúdo, preço)
  function _getLastCompraConfig(itemId) {
    if (!itemId || !_compras.length) return null;
    var sorted = _compras.slice().sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); });
    for (var i = 0; i < sorted.length; i++) {
      var itens = sorted[i].itens || [];
      for (var j = 0; j < itens.length; j++) {
        var l = itens[j];
        if (l.itemId === itemId && (_num(l.precoUnitario) > 0 || _num(l.precoPago) > 0)) {
          return {
            // precoUnitario: novo campo (preço por embalagem); precoPago: fallback legado
            precoPago: _num(l.precoUnitario) || _num(l.precoPago),
            embalagem: l.unidadeCompra || l.unidadeBase || '',
            conteudo: _num(l.conteudoPorEmbalagem) || 1,
            unidadeBase: l.unidadeBase || ''
          };
        }
      }
    }
    return null;
  }

  function _buildParcelasPreview() {
    var gerarEl = document.getElementById('cp-gerar-apagar');
    if (!gerarEl || !gerarEl.checked) {
      _compraParcelasPreview = [];
      _renderParcelasPreview();
      return;
    }
    var parcelas = Math.max(parseInt((_el('cp-parcelas').value || '1'), 10) || 1, 1);
    var vencBase = _dateInputValue('cp-venc');
    var prazo = Math.max(parseInt((_el('cp-prazo').value || '30'), 10) || 30, 1);
    var linhas = window._compraLinhas || [];
    var total = linhas.reduce(function (s, l) { return s + _lineTotal(l); }, 0);
    if (!total) { _compraParcelasPreview = []; _renderParcelasPreview(); return; }
    var fornNome = _getFornecedorNome(_el('cp-forn').value);
    var pcLabel = '';
    if (_editingId) {
      var ec = _byId(_compras, _editingId);
      pcLabel = (ec && ec.numPedido) ? ec.numPedido : '';
    }
    var descBase = (pcLabel ? 'Pedido de Compra #' + pcLabel + ' — ' : 'Compra — ') + fornNome;
    _compraParcelasPreview = [];

    var tevEntradaEl = document.getElementById('cp-teve-entrada');
    var tevEntrada = tevEntradaEl && tevEntradaEl.checked;

    if (tevEntrada) {
      var entradaValor = _num(_el('cp-entrada-valor').value);
      var entradaData = _dateInputValue('cp-entrada-data');
      var entradaForma = _el('cp-entrada-forma').value || '';
      if (!entradaData) { _renderParcelasPreview(); return; }
      _compraParcelasPreview.push({
        index: -1,
        isEntrada: true,
        descricao: descBase + ' — Entrada',
        valor: entradaValor > 0 ? entradaValor : 0,
        vencimento: entradaData,
        formaPagamento: entradaForma
      });
      var saldo = Math.max(total - entradaValor, 0);
      if (saldo > 0.01 && parcelas > 0) {
        if (!vencBase) { _renderParcelasPreview(); return; }
        var valorParcela = parseFloat((saldo / parcelas).toFixed(2));
        var parcFormaPagamento = _el('cp-forma') ? _el('cp-forma').value || '' : '';
        for (var i = 0; i < parcelas; i++) {
          var vencParcela = _addLocalDays(vencBase, i * prazo);
          var parcelaItem = {
            index: i,
            descricao: descBase + (parcelas > 1 ? ' — Parcela ' + (i + 1) + '/' + parcelas : ''),
            valor: valorParcela,
            vencimento: vencParcela
          };
          if (parcFormaPagamento && parcFormaPagamento !== 'A definir') parcelaItem.formaPagamento = parcFormaPagamento;
          _compraParcelasPreview.push(parcelaItem);
        }
      }
    } else {
      if (!vencBase) { _renderParcelasPreview(); return; }
      var valorParcela = parseFloat((total / parcelas).toFixed(2));
      var formaParcela = _el('cp-forma') ? _el('cp-forma').value || '' : '';
      for (var i = 0; i < parcelas; i++) {
        var parcela = {
          index: i,
          descricao: descBase + (parcelas > 1 ? ' — Parcela ' + (i + 1) + '/' + parcelas : ''),
          valor: valorParcela,
          vencimento: _addLocalDays(vencBase, i * prazo)
        };
        if (formaParcela && formaParcela !== 'A definir') parcela.formaPagamento = formaParcela;
        _compraParcelasPreview.push(parcela);
      }
    }
    _renderParcelasPreview();
  }

  function _renderParcelasPreview() {
    var el = document.getElementById('cp-parcelas-preview');
    if (!el) return;
    if (!_compraParcelasPreview.length) { el.innerHTML = ''; return; }
    var totalPreview = _compraParcelasPreview.reduce(function (s, p) { return s + _num(p.valor); }, 0);
    var rowsHtml = _compraParcelasPreview.map(function (p, idx) {
      var rowBg = p.isEntrada ? 'background:#FAF8F4;' : 'background:#fff;';
      var descCell = p.isEntrada
        ? '<td style="padding:10px 12px;font-size:12px;color:#5B7A67;font-weight:600;">' + _esc(p.descricao) + ' <span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;background:#fff;color:#5B7A67;border:1px solid #EAE4DA;font-size:9px;font-weight:700;vertical-align:middle;">ENTRADA</span></td>'
        : '<td style="padding:10px 12px;font-size:12px;color:#1F1F1F;">' + _esc(p.descricao) + '</td>';
      return '<tr style="border-top:1px solid #EAE4DA;' + rowBg + '">' +
        descCell +
        '<td style="padding:10px 12px;"><input type="date" value="' + _esc(p.vencimento) + '" oninput="Modules.Compras._onParcelaVencChange(' + idx + ',this.value)" style="border:1px solid #EAE4DA;border-radius:10px;padding:6px 8px;font-size:12px;font-family:inherit;outline:none;width:130px;background:#fff;"></td>' +
        '<td style="padding:10px 12px;text-align:right;"><input type="number" value="' + _num(p.valor).toFixed(2) + '" step="0.01" min="0" oninput="Modules.Compras._onParcelaValorChange(' + idx + ',this.value)" style="border:1px solid #EAE4DA;border-radius:10px;padding:6px 8px;font-size:12px;font-family:inherit;outline:none;width:90px;text-align:right;background:#fff;"></td>' +
        '</tr>';
    }).join('');
    el.innerHTML = '<div style="margin-top:12px;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="background:#fff;padding:12px 16px;border-bottom:1px solid #EAE4DA;font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.04em;">Prévia das parcelas — edite antes de salvar</div>' +
      '<table style="width:100%;border-collapse:separate;border-spacing:0;">' +
      '<thead><tr style="background:#fff;"><th style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:11px;font-weight:600;color:#1F1F1F;text-align:left;letter-spacing:.04em;text-transform:uppercase;">Descrição</th><th style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:11px;font-weight:600;color:#1F1F1F;text-align:left;letter-spacing:.04em;text-transform:uppercase;">Vencimento</th><th style="padding:10px 12px;border-bottom:1px solid #EAE4DA;font-size:11px;font-weight:600;color:#1F1F1F;text-align:right;letter-spacing:.04em;text-transform:uppercase;">Valor (€)</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '<tfoot><tr style="border-top:1px solid #EAE4DA;background:#FAF8F4;"><td colspan="2" style="padding:10px 12px;font-size:12px;font-weight:600;color:#1F1F1F;">Total</td><td id="cp-preview-total" style="padding:10px 12px;font-size:13px;font-weight:600;color:#1F1F1F;text-align:right;">' + UI.fmt(totalPreview) + '</td></tr></tfoot>' +
      '</table></div>';
  }

  function _onParcelaValorChange(idx, value) {
    if (!_compraParcelasPreview[idx]) return;
    _compraParcelasPreview[idx].valor = _num(value);
    var totalEl = document.getElementById('cp-preview-total');
    if (totalEl) {
      var sum = _compraParcelasPreview.reduce(function (s, p) { return s + _num(p.valor); }, 0);
      var compraTotal = (window._compraLinhas || []).reduce(function (s, l) { return s + _lineTotal(l); }, 0);
      var over = compraTotal > 0 && sum > compraTotal + 0.01;
      totalEl.innerHTML = UI.fmt(sum) + (over
        ? ' <span style="color:#C4362A;font-size:11px;font-weight:600;">⚠ A soma das parcelas excede o total da compra (' + UI.fmt(compraTotal) + ')</span>'
        : '');
      totalEl.style.color = over ? '#C4362A' : '';
    }
  }

  function _onParcelaVencChange(idx, value) {
    if (_compraParcelasPreview[idx]) _compraParcelasPreview[idx].vencimento = value;
  }

  function _toggleEntradaSection() {
    var tevEl = document.getElementById('cp-teve-entrada');
    var sectionEl = document.getElementById('cp-entrada-section');
    if (sectionEl) sectionEl.style.display = (tevEl && tevEl.checked) ? 'block' : 'none';
    // Atualiza label do campo Parcelas
    var parcelasInput = document.getElementById('cp-parcelas');
    if (parcelasInput && parcelasInput.parentElement) {
      var lbl = parcelasInput.parentElement.querySelector('label');
      if (lbl) lbl.textContent = (tevEl && tevEl.checked) ? 'Parcelas restantes' : 'Parcelas';
    }
    _buildParcelasPreview();
  }

  // ── Helpers de layout ─────────────────────────────────────────────────────
  function _head(title, label, action, eyebrow, subtitle) {
    if (eyebrow || subtitle) {
      return '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<div style="font-size:11px;font-weight:500;color:#A39B90;letter-spacing:.03em;margin-bottom:5px;">' + _esc(eyebrow || 'Compras') + '</div>' +
          '<h2 style="font-size:28px;font-weight:600;line-height:1.15;margin:0 0 6px;color:#1F1F1F;">' + _esc(title) + '</h2>' +
          '<p style="font-size:15px;font-weight:400;color:#7A746B;line-height:1.55;max-width:760px;margin:0;">' + _esc(subtitle || '') + '</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="' + action + '" class="bf-btn-primary" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);">' + _esc(label) + '</button>' +
        '</div>' +
      '</div>';
    }
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;"><h2 style="font-size:20px;font-weight:600;">' + _esc(title) + '</h2><button onclick="' + action + '" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);">' + _esc(label) + '</button></div>';
  }
  function _kpi(label, value, icon, color) {
    var iconHtml = icon ? '<span class="mi" style="font-size:28px;color:' + (color || '#9CA3AF') + ';">' + _esc(icon) + '</span>' : '';
    return '<div class="kpi-tile" style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:18px 18px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="width:54px;height:54px;border-radius:16px;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + iconHtml + '</div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:2px;">' +
        '<span style="display:block;font-size:13px;font-weight:500;color:#6F6860;line-height:1.1;">' + _esc(label) + '</span>' +
        '<strong style="display:block;font-family:inherit;font-size:38px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(value) + '</strong>' +
      '</div>' +
    '</div>';
  }
  function _chip(text) { return '<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(text) + '</span>'; }
  function _statusChip(text, color, dotColor) { return '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;color:' + (color || '#6F6860') + ';font-size:12px;font-weight:500;border:1px solid #EAE4DA;"><span style="width:6px;height:6px;border-radius:50%;background:' + (dotColor || '#A39B90') + ';display:inline-block;"></span>' + _esc(text) + '</span>'; }
  function _catalogLikeChip(text, color) { return '<span style="font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:' + (color || '#1F1F1F') + ';">' + _esc(text) + '</span>'; }
  function _cardStyle() { return 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);'; }
  function _sectionTitle(title, desc) {
    return '<div style="margin-bottom:14px;"><h3 style="font-size:14px;font-weight:600;margin:0 0 4px;color:#1F1F1F;">' + _esc(title) + '</h3><p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">' + _esc(desc || '') + '</p></div>';
  }
  function _thead(cols) { return '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' + cols.map(function (h) { return '<th style="padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">' + h + '</th>'; }).join('') + '</tr></thead>'; }
  function _td(html, strong) { return '<td style="padding:13px 16px;vertical-align:middle;font-size:13px;color:#1F1F1F;' + (strong ? 'font-weight:600;' : '') + '">' + html + '</td>'; }
  function _basicTable(data, headers, rowFn, editFn, delFn, rowClickFn, pagKey) {
    var p = pagKey ? (_pag[pagKey] || null) : null;
    var pageData = p ? data.slice((p.page - 1) * p.perPage, p.page * p.perPage) : data;
    var emptyHtml = '<tr><td colspan="' + (headers.length + 1) + '" style="padding:48px 24px;text-align:center;color:#8A7E7C;">' +
      '<div style="font-size:15px;margin-bottom:10px;">Nenhum registro cadastrado.</div>' +
      (editFn ? '<button onclick="' + editFn + '(null)" style="' + _primaryStyle() + 'width:auto;padding:10px 20px;font-size:13px;">+ Adicionar</button>' : '') +
      '</td></tr>';
    var tableHtml = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">' + _thead(headers.concat([''])) +
      '<tbody>' + (data.length ? pageData.map(function (x) {
        var rowAttrs = rowClickFn ? ' onclick="' + rowClickFn + '(\'' + x.id + '\')" style="border-top:1px solid #F2EDED;cursor:pointer;"' : ' style="border-top:1px solid #F2EDED;"';
        return '<tr' + rowAttrs + '>' + rowFn(x).map(function (v, i) { return _td(v, i === 0); }).join('') +
          '<td style="padding:10px;text-align:right;white-space:nowrap;"><button onclick="event.stopPropagation();' + editFn + '(\'' + x.id + '\')" style="' + _iconBtn('#EEF4FF', '#2563EB') + '"><span class="mi" style="font-size:15px;">edit</span></button> ' +
          '<button onclick="event.stopPropagation();' + delFn + '(\'' + x.id + '\')" style="' + _iconBtn('#FFF0EE', '#C4362A') + '"><span class="mi" style="font-size:15px;">delete</span></button></td></tr>';
      }).join('') : emptyHtml) + '</tbody></table></div>';
    return tableHtml + (p ? _pagerHtml(pagKey, data.length) : '');
  }
  function _field(id, label, value, type, oninput) {
    return '<div><label style="' + _labelStyle() + '">' + label + '</label><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '"' + (oninput ? ' oninput="' + oninput + '"' : '') + ' style="' + _inputStyle() + '"></div>';
  }
  function _textarea(id, label, value) {
    return '<div><label style="' + _labelStyle() + '">' + label + '</label><textarea id="' + id + '" style="' + _inputStyle() + 'min-height:74px;resize:vertical;">' + _esc(value || '') + '</textarea></div>';
  }
  function _select(id, label, options, onchange) {
    return '<div><label style="' + _labelStyle() + '">' + label + '</label><select id="' + id + '"' + (onchange ? ' onchange="' + onchange + '"' : '') + ' style="' + _inputStyle() + 'background:#fff;">' + options + '</select></div>';
  }
  function _inputStyle() { return 'width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);'; }
  function _labelStyle() { return 'font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;'; }
  function _primaryStyle() { return 'padding:13px 22px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.18);'; }
  function _cancelStyle() { return 'padding:13px 20px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;'; }
  function _dangerStyle() { return 'padding:13px 20px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#B42318;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;'; }
  function _iconBtn(bg, color) { return 'width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:' + bg + ';color:' + color + ';cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _options(list, selected, labelKey, empty) {
    return '<option value="">' + _esc(empty || '-') + '</option>' + (list || []).map(function (x) { return '<option value="' + x.id + '"' + (selected === x.id ? ' selected' : '') + '>' + _esc(x[labelKey] || x.name || x.nome || '-') + '</option>'; }).join('');
  }
  function _activeBankAccounts() {
    return (_contas || []).filter(function (c) { return c && c.ativo !== false; }).slice().sort(function (a, b) {
      return String(a.nome || a.name || '').localeCompare(String(b.nome || b.name || ''));
    });
  }
  function _accountOptions(list, selected, empty) {
    return '<option value="">' + _esc(empty || 'Sem conta') + '</option>' + (list || []).map(function (x) {
      var label = x.nome || x.name || '-';
      return '<option value="' + _esc(x.id) + '"' + (selected === x.id ? ' selected' : '') + '>' + _esc(label) + '</option>';
    }).join('');
  }
  function _accountInfo(id) {
    if (!id) return { id: '', nome: '' };
    var c = _byId(_contas, id) || {};
    return { id: id, nome: c.nome || c.name || '' };
  }
  function _accountName(id) {
    return _accountInfo(id).nome;
  }
  function _todayLocal() {
    return _dateToYMD(new Date());
  }
  function _dateInputValue(id) {
    return _normalizeYMD(_el(id).value);
  }
  function _normalizeYMD(value) {
    var m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? (m[1] + '-' + m[2] + '-' + m[3]) : '';
  }
  function _parseLocalDate(value) {
    var m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  function _dateToYMD(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  function _addLocalDays(value, days) {
    var d = _parseLocalDate(value);
    if (!d) return '';
    d.setDate(d.getDate() + (parseInt(days, 10) || 0));
    return _dateToYMD(d);
  }
  function _formatLocalDate(value) {
    var m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? (m[3] + '/' + m[2] + '/' + m[1]) : '';
  }
  function _namedOptions(list, selected, fallback) {
    var arr = (list || []).length ? list.filter(function (x) { return x.ativo !== false; }).map(function (x) { return x.name; }) : fallback;
    if (selected && arr.indexOf(selected) < 0) arr.push(selected);
    arr = (arr || []).slice().filter(Boolean).sort(function (a, b) { return String(a).localeCompare(String(b)); });
    return arr.map(function (name) { return '<option value="' + _esc(name) + '"' + (selected === name ? ' selected' : '') + '>' + _esc(name) + '</option>'; }).join('');
  }
  function _lineTotal(l) {
    if (!l) return 0;
    if (l.totalLinha !== undefined && l.totalLinha !== null && l.totalLinha !== '') return _num(l.totalLinha);
    if (l.total !== undefined && l.total !== null && l.total !== '') return _num(l.total);
    return _num(l.precoPago);
  }
  function _num(v) { return parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0; }
  function _byId(arr, id) { return (arr || []).find(function (x) { return x.id === id; }); }
  function _el(id) { return document.getElementById(id) || { value: '', checked: false, innerHTML: '' }; }
  function _esc(str) { return String(str == null ? '' : str).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]; }); }
  function _escJs(str) { return _esc(String(str == null ? '' : str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ')); }

  return {
    render: render, _switchSub: _switchSub,
    _openCompraModal: _openCompraModal, _saveCompra: _saveCompra, _deleteCompra: _deleteCompra,
    _abrirAtualizacaoFinanceiroPrompt: _abrirAtualizacaoFinanceiroPrompt, _confirmarAtualizacaoFinanceiro: _confirmarAtualizacaoFinanceiro,
    _enviarCompraFinanceiro:_enviarCompraFinanceiro, _enviarCompraFinanceiroFromList:_enviarCompraFinanceiroFromList, _atualizarCompraFinanceiro:_atualizarCompraFinanceiro, _enviarCompraFinanceiroFromModal:_enviarCompraFinanceiroFromModal, _atualizarCompraFinanceiroFromModal:_atualizarCompraFinanceiroFromModal,
    _saveStatusOnly: _saveStatusOnly, _estornarPagamentosModal: _estornarPagamentosModal,
    _onCompraItemChange: _onCompraItemChange, _calcCompraLinha: _calcCompraLinha, _addCompraLinha: _addCompraLinha, _removeCompraLinha: _removeCompraLinha,
    _buildParcelasPreview: _buildParcelasPreview, _onParcelaValorChange: _onParcelaValorChange, _onParcelaVencChange: _onParcelaVencChange, _toggleEntradaSection: _toggleEntradaSection,
    _filterRegistros: _filterRegistros, _changePage: _changePage, _setPerPage: _setPerPage,
    _filterItemSelect: _filterItemSelect, _compraItemSearch: _compraItemSearch, _compraItemSelect: _compraItemSelect,
    _compraFornSearch: _compraFornSearch, _compraFornSelect: _compraFornSelect,
    _itemFornSearch: _itemFornSearch, _itemFornSelect: _itemFornSelect,
    _catalogSearch: _catalogSearch, _catalogSelect: _catalogSelect, _catalogQuickCreate: _catalogQuickCreate, _packageSearch: _packageSearch, _packageSelect: _packageSelect,
    _setSimpleListClasse: _setSimpleListClasse,
    _openItemModal: _openItemModal, _openInsumoModal: _openInsumoModal, _saveItem: _saveItem, _deleteItem: _deleteItem, _toggleItemClasse: _toggleItemClasse, _onItemImgFileChange: _onItemImgFileChange, _filterItens: _filterItens, _renderInsumos: _renderInsumos,
    _openFornecedorModal: _openFornecedorModal, _saveFornecedor: _saveFornecedor, _deleteFornecedor: _deleteFornecedor, _onFornecedorCountryChange: _onFornecedorCountryChange,
    _openUnidadeModal: _openUnidadeModal, _saveUnidade: _saveUnidade, _deleteUnidade: _deleteUnidade,
    _openSimpleModal: _openSimpleModal, _saveSimple: _saveSimple, _deleteSimple: _deleteSimple, _renderUnidades: _renderUnidades, _renderSimpleList: _renderSimpleList,
    _switchConfigSub: _switchConfigSub, _setSimpleListQ: _setSimpleListQ, _repaintSimpleTable: _repaintSimpleTable,
    _paintRegistrosTable: _paintRegistrosTable, _clearRegistrosFilters: _clearRegistrosFilters, _toggleRegistrosOrdem: _toggleRegistrosOrdem,
    _clearItensFilters: _clearItensFilters,
    _filterFornecedores: _filterFornecedores, _paintFornecedoresTable: _paintFornecedoresTable, _clearFornecedoresFilters: _clearFornecedoresFilters,
    _initAddressAutocomplete: _initAddressAutocomplete
  };
})();
