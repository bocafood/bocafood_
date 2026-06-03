// js/modules/financeiro.js
window.Modules = window.Modules || {};
Modules.Financeiro = (function () {
  'use strict';

  var _activeSub = 'visao-geral';
  var _movimentacoes = [];
  var _contasBancarias = [];
  var _contasPagar = [];
  var _categorias = [];
  var _configFin = {};
  var _configGeral = {};
  var _systemConfig = {};
  var _editingId = null;
  var _compras = [];
  var _fornecedores = [];
  var _clientes = [];
  var _itensCusto = [];
  var _cpSelecionadas = [];
  var _cpVisiveis = [];
  var _bulkCPProcessando = false;
  var _visaoFiltro = { periodo: 'todos', inicio: '', fim: '', conta: 'todas' };

  var TABS = [
    { key: 'visao-geral',       label: 'Visão Geral' },
    { key: 'fluxo-caixa',      label: 'Fluxo de Caixa' },
    { key: 'movimentacoes',    label: 'Entradas' },
    { key: 'contas-pagar',     label: 'Saídas' },
    { key: 'configuracoes',    label: 'Configurações' }
  ];

  var FORMAS_PAG_DEFAULT = ['Dinheiro', 'Transferência', 'MB Way', 'Multibanco', 'Cartão', 'Cheque', 'Outro'];
  var TIPOS_CONTA = ['Conta corrente', 'Conta poupança', 'Caixa / cofre', 'Carteira'];

  // ── SHELL ─────────────────────────────────────────────────────────────────
  function render(sub) {
    _activeSub = sub || 'visao-geral';
    var app = document.getElementById('app');
    app.innerHTML =
      '<div id="fin-root" class="module-page" style="padding:24px;display:flex;flex-direction:column;gap:18px;">' +
        '<div id="fin-content" class="module-content" style="padding:0;display:flex;flex-direction:column;gap:16px;"></div>' +
      '</div>';
    _renderTabs();
    _loadSub(_activeSub);
  }

  function _renderTabs() {
    var el = document.getElementById('fin-tabs');
    if (!el) return;
    el.innerHTML = TABS.map(function (t) {
      var active = t.key === _activeSub;
      return '<button onclick="Modules.Financeiro._switchSub(\'' + t.key + '\')" class="' + (active ? 'active' : '') + '">' + t.label + '</button>';
    }).join('');
  }

  function _switchSub(key) {
    _activeSub = key;
    _renderTabs();
    _loadSub(key);
    Router.navigate('financeiro/' + key);
  }

  function _loadSub(key) {
    var content = document.getElementById('fin-content');
    if (!content) return;
    content.innerHTML = '<div class="loading-inline">Carregando...</div>';
    if (key === 'visao-geral')       return _loadVisaoGeral();
    if (key === 'fluxo-caixa')      return _loadFluxoCaixa();
    if (key === 'movimentacoes')    return _loadMovimentacoes();
    if (key === 'contas-pagar')     return _loadContasPagar();
    if (key === 'contas-bancarias') { _activeSub='configuracoes'; _cfgSub='contas-bancarias'; _renderTabs(); Router.navigate('financeiro/configuracoes'); return _loadConfiguracoes(); }
    if (key === 'configuracoes')    return _loadConfiguracoes();
    if (key === 'entradas' || key === 'saidas') { _activeSub = 'movimentacoes'; _renderTabs(); Router.navigate('financeiro/movimentacoes'); return _loadMovimentacoes(); }
    if (key === 'apagar') { _activeSub = 'contas-pagar'; _renderTabs(); Router.navigate('financeiro/contas-pagar'); return _loadContasPagar(); }
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function _normSearch(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function _fmtDateDisplay(raw) {
    if (!raw) return '—';
    var d = null;
    if (raw && typeof raw.toDate === 'function') d = raw.toDate();
    else if (raw instanceof Date) d = raw;
    else if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) d = new Date(raw + 'T00:00:00');
    else d = new Date(raw);
    return (d && !isNaN(d.getTime())) ? UI.fmtDate(d) : '—';
  }
  function _fmtVal(n) {
    n = parseFloat(n) || 0;
    return '€\u00a0' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function _parseNum(v) {
    var raw = String(v == null ? '' : v).trim();
    if (!raw) return 0;
    raw = raw.replace(/[^\d,.-]/g, '');
    if (!raw) return 0;
    var lastComma = raw.lastIndexOf(',');
    var lastDot = raw.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) raw = raw.replace(/\./g, '').replace(',', '.');
      else raw = raw.replace(/,/g, '');
    } else if (lastComma >= 0) {
      raw = raw.replace(/\./g, '').replace(',', '.');
    } else if (lastDot >= 0) {
      var parts = raw.split('.');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3)) raw = raw.replace(/\./g, '');
    }
    return parseFloat(raw) || 0;
  }
  function _moneyInputDisplay(v) {
    var n = _parseNum(v);
    return n ? _fmtVal(n) : '';
  }
  function _moneyInputFocus(el) {
    if (!el) return;
    var n = _parseNum(el.value);
    el.value = n ? String(n).replace('.', ',') : '';
    try { el.select(); } catch (_) {}
  }
  function _moneyInputBlur(el) {
    if (!el) return;
    el.value = _moneyInputDisplay(el.value);
  }
  function _normalizeFiscalCountry(value) {
    var raw = String(value || '').trim().toLowerCase();
    if (raw === 'pt' || raw === 'portugal' || raw === 'pt-pt') return 'PT';
    if (raw === 'es' || raw === 'espana' || raw === 'españa' || raw === 'espanha' || raw === 'spain' || raw === 'es-es') return 'ES';
    return '';
  }
  function _paymentCountryByName(name) {
    var key = String(name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    if (key === 'mb way' || key === 'mbway' || key === 'multibanco') return 'PT';
    if (key === 'bizum') return 'ES';
    return '';
  }
  function _tenantFiscalCountry() {
    var profile = (window.Auth && Auth.getAdminProfile) ? (Auth.getAdminProfile() || {}) : {};
    var fromAuth = (window.Auth && Auth.getFiscalCountry) ? Auth.getFiscalCountry() : '';
    var candidates = [
      _configGeral && _configGeral.fiscalCountry,
      _configGeral && _configGeral.defaultFiscalCountry,
      _configGeral && _configGeral.companyFiscalCountry,
      profile && profile.fiscalCountry,
      profile && profile.accountAddress && profile.accountAddress.fiscalCountry,
      profile && profile.store && profile.store.fiscalCountry,
      fromAuth
    ];
    for (var i = 0; i < candidates.length; i++) {
      var normalized = _normalizeFiscalCountry(candidates[i]);
      if (normalized) return normalized;
    }
    return 'ES';
  }
  function _dateToYMD(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function _parseLocalDate(v) {
    var m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function _today() { return _dateToYMD(new Date()); }
  function _addLocalDays(v, days) {
    var d = _parseLocalDate(v);
    if (!d) return '';
    d.setDate(d.getDate() + (parseInt(days, 10) || 0));
    return _dateToYMD(d);
  }
  function _inp() { return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;'; }
  function _lbl() { return 'font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;'; }
  function _g2()  { return 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;'; }
  function _g3()  { return 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;'; }
  function _modalCardStyle() { return 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px;box-shadow:0 14px 34px rgba(31,31,31,.055);'; }
  function _modalFieldStyle(extra) { return 'width:100%;box-sizing:border-box;height:42px;padding:0 12px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;' + (extra || ''); }
  function _modalSelectStyle(extra) { return _modalFieldStyle('appearance:none;-webkit-appearance:none;background-color:#FFFCF8;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:38px;' + (extra || '')); }
  function _modalIconTitle(icon, title, help) {
    return '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:14px;"><span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;margin-top:1px;">'+_esc(icon)+'</span><div style="min-width:0;"><div style="font-size:13px;font-weight:650;color:#1F1F1F;line-height:1.25;">'+_esc(title)+'</div>'+(help?'<div style="font-size:12px;color:#8A7E7C;line-height:1.4;margin-top:3px;">'+_esc(help)+'</div>':'')+'</div></div>';
  }
  function _catNature(c) {
    var v = String((c && (c.financialNature || c.naturezaFinanceira || c.nature || c.tipoFinanceiro)) || '').toLowerCase();
    if (v === 'custo' || v === 'cost') return 'custo';
    if (v === 'receita' || v === 'entrada') return 'receita';
    return (c && (c.tipo === 'saida' || c.tipo === 'expense')) ? 'despesa' : 'receita';
  }
  function _catCostClass(c) {
    var v = String((c && (c.costClass || c.classeCusto || c.classificacaoCusto || c.classificacao)) || '').toLowerCase();
    if (v === 'direto' || v === 'direct') return 'direto';
    if (v === 'indireto' || v === 'indirect') return 'indireto';
    return 'indireto';
  }
  function _catNatureLabel(c) {
    var n = _catNature(c);
    if (n === 'custo') return 'Custo';
    if (n === 'receita') return 'Receita';
    return 'Despesa';
  }
  function _catClassLabel(c) {
    return _catCostClass(c) === 'direto' ? 'Direto' : 'Indireto';
  }
  function _findSaidaCategory(value) {
    var v = String(value || '');
    if (!v) return null;
    return (_categorias || []).find(function (c) {
      if (!(c && (c.tipo === 'saida' || c.tipo === 'expense'))) return false;
      return String(c.id || '') === v || String(c.nome || c.name || '') === v;
    }) || null;
  }
  function _categoryOptionLabel(c) {
    var nome = c && (c.nome || c.name) ? (c.nome || c.name) : '';
    var nature = _catNatureLabel(c);
    var costClass = _catNature(c) === 'receita' ? '' : (' ' + _catClassLabel(c).toLowerCase());
    return nome + ' · ' + nature + costClass;
  }
  function _saidaCategoryOptions(selected) {
    var selectedValue = String(selected || '');
    var groups = { despesa: [], custo: [] };
    (_categorias || []).forEach(function (c) {
      if (!(c && (c.tipo === 'saida' || c.tipo === 'expense'))) return;
      var nature = _catNature(c) === 'custo' ? 'custo' : 'despesa';
      groups[nature].push(c);
    });
    function renderGroup(title, items) {
      items = items.slice().sort(function (a, b) { return String(a.nome || a.name || '').localeCompare(String(b.nome || b.name || '')); });
      if (!items.length) return '';
      return '<optgroup label="' + _esc(title) + '">' + items.map(function (c) {
        var value = c.nome || c.name || c.id || '';
        var selectedOpt = selectedValue === String(value) || selectedValue === String(c.id || '') || selectedValue === String(c.nome || c.name || '');
        return '<option value="' + _esc(value) + '"' + (selectedOpt ? ' selected' : '') + '>' + _esc(_categoryOptionLabel(c)) + '</option>';
      }).join('') + '</optgroup>';
    }
    return '<option value="">Selecionar categoria...</option>' +
      renderGroup('Despesas', groups.despesa) +
      renderGroup('Custos', groups.custo) +
      '<option value="__nova__">+ Nova categoria</option>';
  }
  function _financialMetaFromRecord(record) {
    record = record || {};
    var cat = _findSaidaCategory(record.categoriaFinanceiraId || record.categoriaId || record.categoryId || record.categoria || '');
    var nature = record.financialNature || record.categoriaFinanceiraNatureza || (cat ? _catNature(cat) : 'despesa');
    var costClass = record.costClass || record.categoriaFinanceiraCostClass || (cat ? _catCostClass(cat) : 'indireto');
    return {
      categoriaId: record.categoriaFinanceiraId || record.categoriaId || record.categoryId || (cat ? (cat.id || '') : ''),
      categoriaNome: record.categoriaFinanceiraNome || record.categoria || (cat ? (cat.nome || cat.name || '') : ''),
      financialNature: nature,
      costClass: costClass
    };
  }

  function _statusCP(cp) {
    var st = String((cp && cp.status) || '').toLowerCase();
    if (st === 'estornada' || st === 'estornado') return 'estornada';
    if (st === 'cancelada' || st === 'cancelado') return 'cancelada';
    if (st === 'parcial') return 'parcial';
    if (st === 'pago' || st === 'paga') return 'pago';
    if (st === 'vencido' || st === 'vencida') return 'vencido';
    if (cp.data_pagamento) return 'pago';
    if (cp.vencimento && cp.vencimento < _today()) return 'vencido';
    return 'pendente';
  }

  function _badgeTipo(tipo) {
    return tipo === 'entrada'
      ? '<span style="background:#DCFCE7;color:#16A34A;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">Entrada</span>'
      : '<span style="background:#FEE2E2;color:#DC2626;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">Saída</span>';
  }
  function _badgeSt(s) {
    var m = { pago:['#DCFCE7','#16A34A','Pago'], parcial:['#EFF6FF','#2563EB','Parcial'], pendente:['#FEF9C3','#CA8A04','Pendente'], vencido:['#FEE2E2','#DC2626','Vencido'], efetivado:['#DCFCE7','#16A34A','Efetivado'], previsto:['#EFF6FF','#3B82F6','Previsto'] }[s] || ['#F3F4F6','#6B7280',s];
    return '<span style="background:' + m[0] + ';color:' + m[1] + ';padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">' + m[2] + '</span>';
  }
  function _badgeEntradaStatus(s) {
    var m = { previsto:['#EFF6FF','#2563EB','A receber',''], efetivado:['#DCFCE7','#16A34A','Recebido',''], parcial:['#FEF9C3','#B45309','Parcial','Recebido parcialmente'] }[s] || ['#F3F4F6','#6B7280',s||'—',''];
    return '<span '+(m[3]?'title="'+_esc(m[3])+'" ':'')+'style="background:' + m[0] + ';color:' + m[1] + ';padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">' + m[2] + '</span>';
  }
  function _badgeSaidaStatus(s) {
    var m = { pago:['#DCFCE7','#16A34A','Já pago',''], parcial:['#FEF9C3','#B45309','Parcial','Pago parcialmente'], pendente:['#EFF6FF','#2563EB','A pagar',''], vencido:['#FEE2E2','#DC2626','Vencida',''] }[s] || ['#F3F4F6','#6B7280',s||'—',''];
    return '<span '+(m[3]?'title="'+_esc(m[3])+'" ':'')+'style="background:' + m[0] + ';color:' + m[1] + ';padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">' + m[2] + '</span>';
  }
  function _movEntradaPendente(m) {
    var info=_movValorInfo(m);
    return info.status==='parcial' ? info.saldoRestante : info.valorRow;
  }

  function _movValorInfo(m) {
    var st=(m&&m.status)||'efetivado';
    var valorTotalOriginal=_parseNum(m && (m.valorTotalOriginal || (m.parcelamento&&m.parcelamento.valorTotalOriginal) || m.valor));
    var valorParcela=_parseNum(m && (m.valorParcela || (m.parcelamento&&m.parcelamento.valorParcela) || m.valor));
    if(!valorParcela && (m&&m.parcelaNumero)) valorParcela=_parseNum(m.valor);
    if(!valorParcela) valorParcela=valorTotalOriginal;
    var valorRecebido=_parseNum(m && (m.valorRecebido || m.valor_recebido_total));
    var valorPago=_parseNum(m && (m.valorPago || m.valor_pago_total));
    if(!valorRecebido && st==='efetivado') valorRecebido=valorParcela;
    if(!valorPago && st==='efetivado') valorPago=valorParcela;
    var saldoRestante=_parseNum(m && (m.saldoRestante || m.saldo_restante));
    if(!saldoRestante && st==='parcial') saldoRestante=Math.max(0,valorTotalOriginal-(m && m.tipo === 'saida' ? valorPago : valorRecebido));
    return {
      status: st,
      valorTotalOriginal: valorTotalOriginal,
      valorParcela: valorParcela,
      valorRecebido: valorRecebido,
      valorPago: valorPago,
      saldoRestante: saldoRestante,
      displayValor: st==='parcial' ? valorTotalOriginal : (st==='efetivado' ? valorRecebido : valorParcela),
      valorRow: valorParcela || valorTotalOriginal
    };
  }

  function _cpValorInfo(cp) {
    var st=_statusCP(cp);
    var valorTotalOriginal=_parseNum(cp && (cp.valorTotalOriginal || cp.valor_total_original || cp.valor));
    var valorParcela=_parseNum(cp && (cp.valorParcela || cp.valor_parcela || cp.valor));
    if(!valorParcela && (cp&&cp.parcelaNumero)) valorParcela=_parseNum(cp.valor);
    if(!valorParcela) valorParcela=valorTotalOriginal;
    var payableTotal=valorParcela || _parseNum(cp && cp.valor) || valorTotalOriginal;
    var valorPago=_parseNum(cp && (cp.valorPago || cp.valor_pago_total));
    if(!valorPago && st==='pago') valorPago=payableTotal;
    var saldoRestante=_parseNum(cp && (cp.saldoRestante || cp.saldo_restante));
    if(!saldoRestante && st==='parcial') saldoRestante=Math.max(0,payableTotal-valorPago);
    var valorVencido=(st==='vencido')?Math.max(0,payableTotal-valorPago):0;
    return {
      status: st,
      valorTotalOriginal: valorTotalOriginal,
      valorParcela: valorParcela,
      valorPago: valorPago,
      saldoRestante: saldoRestante,
      valorVencido: valorVencido,
      displayValor: st==='parcial' ? payableTotal : (st==='pago' ? valorPago : payableTotal),
      valorRow: payableTotal
    };
  }

  function _saldoConta(c) {
    var ent = _movimentacoes.filter(function(m){ return m.conta_id===c.id && m.tipo==='entrada' && (m.status==='efetivado' || m.status==='parcial'); }).reduce(function(s,m){
      var info=_movValorInfo(m);
      return s + (m.status==='parcial' ? info.valorRecebido : info.valorRow);
    },0);
    var sai = _movimentacoes.filter(function(m){ return m.conta_id===c.id && m.tipo==='saida'   && (m.status==='efetivado' || m.status==='parcial'); }).reduce(function(s,m){
      var info=_movValorInfo(m);
      return s + (m.status==='parcial' ? info.valorPago : info.valorRow);
    },0);
    var transfers = (_movimentacoes || []).reduce(function (sum, m) {
      return sum + _transferEffectForAccount(m, c.id);
    }, 0);
    return _parseNum(c.saldo_inicial) + ent - sai + transfers;
  }
  function _saldoTotal() {
    return _contasBancarias.filter(function(c){ return c.ativo!==false; }).reduce(function(s,c){ return s+_saldoConta(c); },0);
  }
  function _isTransferMov(m) {
    return String(m && (m.tipo || m.type) || '') === 'transferencia';
  }
  function _transferOriginId(m) {
    return String(m && (m.contaOrigemId || m.originAccountId || m.fromAccountId || '') || '');
  }
  function _transferDestinationId(m) {
    return String(m && (m.contaDestinoId || m.destinationAccountId || m.toAccountId || '') || '');
  }
  function _transferTouchesAccount(m, accountId) {
    var id = String(accountId || '');
    return _isTransferMov(m) && id && (_transferOriginId(m) === id || _transferDestinationId(m) === id);
  }
  function _transferEffectForAccount(m, accountId) {
    if (!_transferTouchesAccount(m, accountId) || (m.status && m.status !== 'efetivado')) return 0;
    var value = _parseNum(m.valor);
    if (_transferOriginId(m) === String(accountId || '')) return -value;
    if (_transferDestinationId(m) === String(accountId || '')) return value;
    return 0;
  }
  function _transferLabelForAccount(m, accountId) {
    if (!_isTransferMov(m)) return 'Transferência';
    return _transferDestinationId(m) === String(accountId || '') ? 'Transferência recebida' : 'Transferência enviada';
  }
  function _mesAtual() { return _today().slice(0,7); }
  function _movMes() {
    var mes=_mesAtual(); var ent=0,sai=0;
    _movimentacoes.forEach(function(m){
      if(!m.data||m.data.slice(0,7)!==mes) return;
      if(m.tipo==='entrada'&&(m.status==='efetivado'||m.status==='parcial')){
        var einfo=_movValorInfo(m);
        ent += (m.status==='parcial' ? einfo.valorRecebido : einfo.valorRow);
      }
      if(m.tipo==='saida'&&(m.status==='efetivado'||m.status==='parcial')){
        var sinfo=_movValorInfo(m);
        sai += (m.status==='parcial' ? sinfo.valorPago : sinfo.valorRow);
      }
    });
    return {entradas:ent,saidas:sai};
  }
  function _totalAPagar() {
    return _contasPagar.filter(function(cp){ return _statusCP(cp)!=='pago'; }).reduce(function(s,cp){
      var info=_cpValorInfo(cp);
      return s + (_statusCP(cp)==='parcial' ? info.saldoRestante : info.valorRow);
    },0);
  }
  function _formasPag() {
    var raw=_formasPagFull(false);
    return raw.filter(function(f){ return _formaPagCountryOk(f); }).map(function(f){ return typeof f==='string'?f:(f&&f.nome)||''; }).filter(Boolean).sort(function(a,b){ return a.localeCompare(b); });
  }
  function _formaPagCountryOk(f) {
    var name = typeof f === 'string' ? f : (f && (f.nome || f.name || f.label || f.tipoGlobalNome || f.tipo || ''));
    var country = typeof f === 'string' ? '' : (f && (f.tipoGlobalCountry || f.countryFiscal || f.fiscalCountry || f.country || ''));
    country = country || _paymentCountryByName(name);
    return _globalTypeCountryOk(country, _tenantFiscalCountry());
  }
  function _formasPagFull(includeInactive) {
    var hasTenant = !!(_configFin.formas_pagamento && _configFin.formas_pagamento.length);
    var raw = hasTenant ? _configFin.formas_pagamento.slice() : [];
    var tenantCountry = _tenantFiscalCountry();
    var seen = {};
    function keyFor(item) {
      var name = typeof item === 'string' ? item : (item && (item.nome || item.name || item.tipoGlobalNome || item.tipo || item.id || item.slug || ''));
      return String(name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    }
    raw.forEach(function (item) {
      var key = keyFor(item);
      if (key) seen[key] = true;
    });
    _globalFinanceList('payment', false).filter(function(t){ return _globalTypeCountryOk(t.countryFiscal, tenantCountry); }).forEach(function (t) {
      var key = keyFor(t);
      if (!key || seen[key]) return;
      seen[key] = true;
      raw.push({
        nome: t.name || t.nome || '',
        tipo: t.name || t.nome || '',
        tipoGlobalId: t.id || '',
        tipoGlobalSlug: t.slug || '',
        tipoGlobalNome: t.name || t.nome || '',
        tipoGlobalCountry: t.countryFiscal || 'ambos',
        ativo: t.active !== false,
        exigeConta: !!t.requiresBankAccount,
        prazoCompensacaoDias: t.defaultCompensationDays || 0,
        taxaPercentual: 0,
        taxaFixa: 0,
        origemGlobalMaster: true
      });
    });
    if (!raw.length) {
      raw = FORMAS_PAG_DEFAULT.map(function(n){ return {nome:n,tipo:'outro',ativo:true,tipoGlobalCountry:_paymentCountryByName(n)||'ambos'}; });
    }
    return raw.map(function(f){ return typeof f==='string'?{nome:f,tipo:'outro',ativo:true}:Object.assign({ativo:true,tipo:'outro'},f||{}); })
      .filter(function(f){ return _formaPagCountryOk(f); })
      .filter(function(f){ return includeInactive || f.ativo!==false; })
      .sort(function(a,b){ return String(a.nome||'').localeCompare(String(b.nome||'')); });
  }

  function _setConfigFin(cfg) {
    _configFin=cfg||{};
    if(!cfg || !Object.keys(cfg).length){
      DB.setDocRoot('config','financeiro',{}).catch(function(){});
    }
  }
  function _getSystemFinanceConfig() {
    return ((_systemConfig || {}).globalFinance) || {};
  }
  function _globalTypeCountryOk(country, tenantCountry) {
    var item = String(country || 'ambos').trim().toLowerCase();
    var tenant = _normalizeFiscalCountry(tenantCountry || _tenantFiscalCountry()) || 'ES';
    if (item === 'ambos' || item === 'both' || item === 'all' || item === 'geral' || item === '') return true;
    var itemCountry = _normalizeFiscalCountry(item);
    if (!itemCountry) return true;
    return itemCountry === tenant;
  }
  function _globalTypeResolve(kind, value, includeInactive) {
    var list = _globalFinanceList(kind, includeInactive);
    var target = String(value || '').trim().toLowerCase();
    if (!target) return null;
    return list.find(function (t) {
      return String(t.id || '').toLowerCase() === target ||
        String(t.slug || '').toLowerCase() === target ||
        String(t.name || '').toLowerCase() === target;
    }) || null;
  }
  function _globalFinanceList(kind, includeInactive) {
    var key = kind === 'payment' ? 'paymentMethodTypes' : 'bankAccountTypes';
    var stored = _getSystemFinanceConfig()[key] || [];
    var raw = stored.map(function (t, idx) {
      var out = Object.assign({}, t || {});
      out.id = out.id || out.slug || out.code || (key + '-' + idx);
      out.name = out.name || out.nome || '';
      out.slug = out.slug || out.code || out.codigo || String(out.name || out.id).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
      out.order = out.order != null ? _parseNum(out.order) : _parseNum(out.ordem);
      out.countryFiscal = out.countryFiscal || out.fiscalCountry || out.country || _paymentCountryByName(out.name) || 'ambos';
      out.active = out.active !== false;
      if (kind === 'payment') {
        out.requiresBankAccount = !!(out.requiresBankAccount != null ? out.requiresBankAccount : out.exigeConta);
        out.defaultCompensationDays = out.defaultCompensationDays != null ? _parseNum(out.defaultCompensationDays) : _parseNum(out.prazoCompensacaoDias);
      }
      return out;
    }).filter(function (t) {
      return includeInactive || t.active !== false;
    });
    if (!stored.length) {
      raw = (kind === 'payment' ? FORMAS_PAG_DEFAULT : TIPOS_CONTA).map(function (name, idx) {
        var normalized = { id: name, name: name, slug: String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'), order: (idx + 1) * 10, countryFiscal: kind === 'payment' ? (_paymentCountryByName(name) || 'ambos') : 'ambos', active: true };
        if (kind === 'payment') normalized.requiresBankAccount = true;
        return normalized;
      });
    }
    return raw.sort(function (a, b) {
      var ao = _parseNum(a.order), bo = _parseNum(b.order);
      if (ao !== bo) return ao - bo;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }
  function _globalPaymentRequiresAccount(value) {
    var t = _globalTypeResolve('payment', value, true);
    return !!(t && t.requiresBankAccount);
  }
  function _globalTypeLabel(kind, value) {
    var t = _globalTypeResolve(kind, value, true);
    return t ? (t.name || t.nome || value || '') : (value || '');
  }
  function _formaOptions(selected) {
    var hasSelected=false;
    var opts='<option value="">Selecionar...</option>'+_formasPagFull(false).map(function(f){
      if((f.nome||'')===selected) hasSelected=true;
      return '<option value="'+_esc(f.nome||'')+'"'+(selected===(f.nome||'')?' selected':'')+'>'+_esc(f.nome||'')+'</option>';
    }).join('');
    if(selected&&!hasSelected) opts+='<option value="'+_esc(selected)+'" selected>'+_esc(selected)+' (inativa)</option>';
    return opts;
  }
  function _catsByTipo(tipo) {
    return (_categorias||[]).filter(function(c){ return c.tipo===tipo; }).map(function(c){ return c.nome||''; }).filter(Boolean).sort(function(a,b){ return a.localeCompare(b); });
  }
  function _uniqById(items) {
    var seen = {};
    return (items || []).filter(function (item, idx) {
      var id = item && item.id ? item.id : 'idx-' + idx;
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }
  function _normalizeLegacyMov(tipo) {
    return function (m) {
      var valor=_parseNum(m.valor);
      var recebido=_parseNum(m.valorRecebido || m.valor_recebido_total);
      var pago=_parseNum(m.valorPago || m.valor_pago_total);
      var saldo=_parseNum(m.saldoRestante || m.saldo_restante);
      var normStatus=String(m.status||'').toLowerCase();
      if(normStatus!=='previsto'&&normStatus!=='parcial') normStatus='efetivado';
      return Object.assign({}, m, {
        tipo: tipo,
        descricao: m.descricao || m.description || m.nome || '—',
        data: m.data || m.date || '',
        valor: valor,
        valorTotalOriginal: _parseNum(m.valorTotalOriginal || m.valor_total_original || valor),
        valorParcela: _parseNum(m.valorParcela || m.valor_parcela || valor),
        valorRecebido: recebido || (normStatus==='efetivado' ? valor : 0),
        valorPago: pago || (normStatus==='efetivado' ? valor : 0),
        saldoRestante: saldo || (normStatus==='parcial' ? Math.max(0,valor-(tipo === 'saida' ? pago : recebido)) : (normStatus==='previsto' ? valor : 0)),
        status: normStatus,
        conta_id: m.conta_id || m.contaId || '',
        categoria: m.categoria || m.category || '',
        forma_pagamento: m.forma_pagamento || m.paymentMethod || ''
      });
    };
  }
  function _normalizeLegacyCP(cp) {
    var pago = cp.status === 'Pago' || cp.status === 'pago' || !!cp.data_pagamento;
    var valor=_parseNum(cp.valor);
    var valorPago=_parseNum(cp.valorPago || cp.valor_pago_total || (pago ? valor : 0));
    var normStatus=String(cp.status||'').toLowerCase();
    if(!normStatus){
      normStatus=valorPago>0&&valorPago<valor?'parcial':(pago?'pago':(cp.vencimento&&cp.vencimento<_today()?'vencido':'pendente'));
    }
    return Object.assign({}, cp, {
      descricao: cp.descricao || cp.description || cp.nome || '—',
      vencimento: cp.vencimento || cp.dueDate || cp.data || '',
      data_pagamento: cp.data_pagamento || (pago ? (cp.paidAt || _today()) : null),
      valor: valor,
      valorTotalOriginal: _parseNum(cp.valorTotalOriginal || cp.valor_total_original || valor),
      valorParcela: _parseNum(cp.valorParcela || cp.valor_parcela || valor),
      valorPago: valorPago,
      saldoRestante: _parseNum(cp.saldoRestante || cp.saldo_restante || (pago ? 0 : valor)),
      status: normStatus,
      categoria: cp.categoria || cp.category || '',
      fornecedor: cp.fornecedor || cp.supplier || '',
      conta_id: cp.conta_id || cp.contaId || cp.conta_bancaria_id || cp.contaBancariaId || ''
    });
  }
  function _loadMovimentacoesData() {
    return Promise.all([DB.getAll('movimentacoes'), DB.getAll('financeiro_entradas'), DB.getAll('financeiro_saidas')]).then(function (r) {
      return _uniqById((r[0] || []).concat((r[1] || []).map(_normalizeLegacyMov('entrada')), (r[2] || []).map(_normalizeLegacyMov('saida'))));
    });
  }
  function _loadContasPagarData() {
    return Promise.all([DB.getAll('contas_pagar'), DB.getAll('financeiro_apagar')]).then(function (r) {
      // contas_pagar  → lançamentos manuais do módulo Financeiro
      // financeiro_apagar → contas geradas automaticamente pelo módulo Compras
      // Ambas são fontes válidas; _colecao identifica onde buscar/atualizar o documento.
      var manual = (r[0] || []).map(function(cp){
        return Object.assign({}, cp, {_colecao:'contas_pagar', _origemFinanceira:'financeiro_manual', _acionavel:true});
      });
      var compra = (r[1] || []).map(function(cp){
        return Object.assign({}, _normalizeLegacyCP(cp), {_colecao:'financeiro_apagar', _origemFinanceira:'compra', _acionavel:true});
      });
      return _uniqById(manual.concat(compra));
    });
  }

  // ── VISÃO GERAL ──────────────────────────────────────────────────────────
  function _loadVisaoGeral() {
    Promise.all([_loadMovimentacoesData(),DB.getAll('contas_bancarias'),_loadContasPagarData()]).then(function(r){
      _movimentacoes=r[0]||[]; _contasBancarias=r[1]||[]; _contasPagar=r[2]||[];
      _paintVisaoGeral();
    });
  }

  var _VISAO_PERIODOS = [
    { value: 'todos', label: 'Todo período' },
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: 'semana_atual', label: 'Esta semana' },
    { value: 'semana_passada', label: 'Semana passada' },
    { value: 'mes_atual', label: 'Este mês' },
    { value: 'mes_passado', label: 'Mês passado' },
    { value: 'ultimos_7_dias', label: 'Últimos 7 dias' },
    { value: 'ultimos_30_dias', label: 'Últimos 30 dias' },
    { value: 'ultimos_90_dias', label: 'Últimos 90 dias' },
    { value: 'trimestre_atual', label: 'Este trimestre' },
    { value: 'ano_atual', label: 'Este ano' },
    { value: 'ano_passado', label: 'Ano passado' },
    { value: 'personalizado', label: 'Personalizado' }
  ];

  function _visaoContasAtivas() {
    return (_contasBancarias || []).filter(function (c) { return c && c.ativo !== false; }).slice().sort(function (a, b) {
      return (a.nome || '').localeCompare(b.nome || '');
    });
  }

  function _visaoContaSelecionada() {
    if (!_visaoFiltro.conta || _visaoFiltro.conta === 'todas') return null;
    return (_contasBancarias || []).find(function (c) { return c && c.id === _visaoFiltro.conta; }) || null;
  }

  function _visaoContaMatches(cId) {
    var sel = _visaoFiltro.conta;
    return !sel || sel === 'todas' || String(sel) === String(cId || '');
  }

  function _visaoPeriodRange() {
    var periodo = _visaoFiltro.periodo || 'todos';
    var inicio = _visaoFiltro.inicio || '';
    var fim = _visaoFiltro.fim || '';
    var hoje = _today();
    var now = new Date();
    if (periodo === 'todos') return { start: null, end: null };
    if (periodo === 'hoje') return { start: hoje, end: hoje };
    if (periodo === 'ontem') {
      var dOntem = new Date(now); dOntem.setDate(dOntem.getDate() - 1);
      var ymdOntem = _dateToYMD(dOntem);
      return { start: ymdOntem, end: ymdOntem };
    }
    if (periodo === 'semana_atual') {
      var dow = (now.getDay() || 7);
      var iniSem = new Date(now); iniSem.setDate(now.getDate() - dow + 1); iniSem.setHours(0, 0, 0, 0);
      var fimSem = new Date(iniSem); fimSem.setDate(iniSem.getDate() + 6);
      return { start: _dateToYMD(iniSem), end: _dateToYMD(fimSem) };
    }
    if (periodo === 'semana_passada') {
      var dow2 = (now.getDay() || 7);
      var iniSP = new Date(now); iniSP.setDate(now.getDate() - dow2 - 6); iniSP.setHours(0, 0, 0, 0);
      var fimSP = new Date(iniSP); fimSP.setDate(iniSP.getDate() + 6);
      return { start: _dateToYMD(iniSP), end: _dateToYMD(fimSP) };
    }
    if (periodo === 'mes_atual') {
      return { start: hoje.slice(0, 7) + '-01', end: _dateToYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
    }
    if (periodo === 'mes_passado') {
      return { start: _dateToYMD(new Date(now.getFullYear(), now.getMonth() - 1, 1)), end: _dateToYMD(new Date(now.getFullYear(), now.getMonth(), 0)) };
    }
    if (periodo === 'ultimos_7_dias') return { start: _addLocalDays(hoje, -7), end: hoje };
    if (periodo === 'ultimos_30_dias') return { start: _addLocalDays(hoje, -30), end: hoje };
    if (periodo === 'ultimos_90_dias') return { start: _addLocalDays(hoje, -90), end: hoje };
    if (periodo === 'trimestre_atual') {
      var trimestre = Math.floor(now.getMonth() / 3);
      var iniTri = new Date(now.getFullYear(), trimestre * 3, 1);
      var fimTri = new Date(now.getFullYear(), trimestre * 3 + 3, 0);
      return { start: _dateToYMD(iniTri), end: _dateToYMD(fimTri) };
    }
    if (periodo === 'ano_atual') return { start: hoje.slice(0, 4) + '-01-01', end: hoje.slice(0, 4) + '-12-31' };
    if (periodo === 'ano_passado') {
      var yp = String(parseInt(hoje.slice(0, 4), 10) - 1);
      return { start: yp + '-01-01', end: yp + '-12-31' };
    }
    if (periodo === 'personalizado') return { start: inicio || null, end: fim || null };
    return { start: null, end: null };
  }

  function _visaoMovContaData() {
    var range = _visaoPeriodRange();
    var contaSel = _visaoFiltro.conta;
    return (_movimentacoes || []).filter(function (m) {
      if (_isTransferMov(m)) {
        if (contaSel && contaSel !== 'todas' && !_transferTouchesAccount(m, contaSel)) return false;
      } else if (!_visaoContaMatches(m.conta_id || m.contaBancariaId)) return false;
      if (range.start && (!m.data || m.data < range.start)) return false;
      if (range.end && (!m.data || m.data > range.end)) return false;
      return true;
    });
  }

  function _visaoCPFiltradas() {
    var range = _visaoPeriodRange();
    return (_contasPagar || []).filter(function (cp) {
      var contaId = cp.conta_id || cp.contaBancariaId || cp.contaId || '';
      if (!_visaoContaMatches(contaId)) return false;
      var st = _statusCP(cp);
      if (st === 'pago' || st === 'estornada' || st === 'cancelada') return false;
      var due = cp.vencimento || cp.dueDate || cp.data || '';
      if (range.start && due && due < range.start) return false;
      if (range.end && due && due > range.end) return false;
      if (range.start && !due) return false;
      return true;
    });
  }

  function _visaoSaldoConta(c) {
    return (_movimentacoes || []).filter(function (m) {
      return (m.conta_id === c.id || m.contaBancariaId === c.id) && (m.status === 'efetivado' || m.status === 'parcial');
    }).reduce(function (s, m) {
      var info = _movValorInfo(m);
      if (m.tipo === 'entrada') return s + (m.status === 'parcial' ? info.valorRecebido : info.valorRow);
      if (m.tipo === 'saida') return s - (m.status === 'parcial' ? info.valorPago : info.valorRow);
      if (_isTransferMov(m)) return s + _transferEffectForAccount(m, c.id);
      return s;
    }, _parseNum(c.saldo_inicial));
  }

  function _visaoSaldoAtual() {
    var contas = _visaoFiltro.conta === 'todas'
      ? _visaoContasAtivas()
      : _visaoContasAtivas().filter(function (c) { return String(c.id) === String(_visaoFiltro.conta); });
    return contas.reduce(function (s, c) { return s + _visaoSaldoConta(c); }, 0);
  }

  function _visaoResumoFinanceiro() {
    var movs = _visaoMovContaData();
    var entradasEf = 0, saidasEf = 0, entradasPrev = 0, saidasPrev = 0;
    movs.forEach(function (m) {
      var info = _movValorInfo(m);
      if (m.status === 'previsto') {
        if (m.tipo === 'entrada') entradasPrev += info.valorRow;
        else if (m.tipo === 'saida') saidasPrev += info.valorRow;
        return;
      }
      if (m.status === 'parcial') {
        if (m.tipo === 'entrada') entradasEf += info.valorRecebido;
        else if (m.tipo === 'saida') saidasEf += info.valorPago;
        return;
      }
      if (m.status === 'efetivado') {
        if (m.tipo === 'entrada') entradasEf += info.valorRow;
        else if (m.tipo === 'saida') saidasEf += info.valorRow;
      }
    });
    var cps = _visaoCPFiltradas();
    var totalAPagar = cps.reduce(function (s, cp) {
      var info = _cpValorInfo(cp);
      return s + (_statusCP(cp) === 'parcial' ? info.saldoRestante : info.valorRow);
    }, 0);
    var vencidas = cps.filter(function (cp) {
      var st = _statusCP(cp);
      return st === 'vencido' || (st === 'pendente' && cp.vencimento && cp.vencimento < _today());
    });
    var valorVencido = vencidas.reduce(function (s, cp) {
      var info = _cpValorInfo(cp);
      return s + (info.valorVencido || info.valorRow);
    }, 0);
    var saldoAtual = _visaoSaldoAtual();
    var saldoProjetado = saldoAtual + entradasPrev - saidasPrev - totalAPagar;
    var resultadoPeriodo = entradasEf - saidasEf;
    var saude = saldoProjetado < 0 ? 'Crítica' : (vencidas.length ? 'Atenção' : 'Saudável');
    var saudeText = saldoProjetado < 0
      ? 'Crítica: saldo projetado negativo.'
      : (vencidas.length ? 'Atenção: existem contas vencidas.' : 'Saudável: saldo projetado positivo.');
    return {
      saldoAtual: saldoAtual,
      saldoProjetado: saldoProjetado,
      entradasEf: entradasEf,
      saidasEf: saidasEf,
      entradasPrev: entradasPrev,
      saidasPrev: saidasPrev,
      totalAPagar: totalAPagar,
      vencidas: vencidas,
      valorVencido: valorVencido,
      resultadoPeriodo: resultadoPeriodo,
      saude: saude,
      saudeText: saudeText
    };
  }

  function _visaoPessoasMov() {
    var contas = _visaoContasAtivas();
    var range = _visaoPeriodRange();
    var selecionada = _visaoContaSelecionada();
    var movsTudo = _movimentacoes.filter(function (m) {
      var contaId = m.conta_id || m.contaBancariaId || '';
      if (selecionada && String(contaId) !== String(selecionada.id)) return false;
      if (!selecionada && !_visaoContaMatches(contaId)) return false;
      return true;
    });
    var movsPeriodo = movsTudo.filter(function (m) {
      if (range.start && (!m.data || m.data < range.start)) return false;
      if (range.end && (!m.data || m.data > range.end)) return false;
      return true;
    });
    return contas.map(function (c) {
      var movsContaTudo = movsTudo.filter(function (m) { return String(m.conta_id || m.contaBancariaId || '') === String(c.id); });
      var movsContaPeriodo = movsPeriodo.filter(function (m) { return String(m.conta_id || m.contaBancariaId || '') === String(c.id); });
      var ultimo = movsContaTudo.slice().sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); })[0] || null;
      return {
        conta: c,
        saldo: _visaoSaldoConta(c),
        ultimo: ultimo,
        totalPeriodo: movsContaPeriodo.length,
        totalEfetivadas: movsContaTudo.filter(function (m) { return m.status === 'efetivado' || m.status === 'parcial'; }).length
      };
    }).filter(function (item) {
      return !selecionada || String(item.conta.id) === String(selecionada.id);
    });
  }

  function _setVisaoFiltro(key, val) {
    _visaoFiltro[key] = val;
    if (key === 'periodo' && val === 'personalizado') {
      _visaoFiltro.inicio = _visaoFiltro.inicio || _today();
      _visaoFiltro.fim = _visaoFiltro.fim || _today();
    }
    _paintVisaoGeral();
  }

  function _limparVisaoFiltros() {
    _visaoFiltro = { periodo: 'todos', inicio: '', fim: '', conta: 'todas' };
    _paintVisaoGeral();
  }

  function _abrirGestaoContasBancarias() {
    _cfgSub = 'contas-bancarias';
    _activeSub = 'configuracoes';
    _renderTabs();
    Router.navigate('financeiro/configuracoes');
    _loadConfiguracoes();
  }

  function _paintVisaoGeral() {
    var content=document.getElementById('fin-content'); if(!content) return;
    var resumo = _visaoResumoFinanceiro();
    var recentes = _visaoMovContaData().slice().sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); }).slice(0, 6);
    var contasVisao = _visaoPessoasMov();
    var contaSel = _visaoContaSelecionada();
    var cardStyle = 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.055);';
    var sectionTitle = function (title, desc, icon) {
      return '<div style="margin-bottom:14px;display:flex;align-items:flex-start;gap:10px;">'+
        (icon ? '<span class="mi" style="width:31px;height:31px;border-radius:12px;background:#FAF8F4;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto;">'+_esc(icon)+'</span>' : '')+
        '<div style="min-width:0;"><h3 style="font-size:15px;font-weight:700;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">'+_esc(title)+'</h3><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:680px;">'+_esc(desc||'')+'</p></div>'+
      '</div>';
    };
    var metricBadge = function (txt,bg,fg) { return '<span style="display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border-radius:999px;background:'+bg+';color:'+fg+';font-size:12px;font-weight:700;">'+_esc(txt)+'</span>'; };
    var heroMetric = function (title, value, desc, icon, color, badge) {
      return '<div style="display:flex;align-items:flex-start;gap:14px;background:#FAF8F4;border:none;border-radius:16px;padding:18px 18px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:118px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">'+
        '<div style="width:48px;height:48px;border-radius:14px;background:transparent;color:'+color+';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:26px;">'+icon+'</span></div>'+
        '<div style="min-width:0;display:flex;flex-direction:column;gap:6px;">'+
          '<span style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.15;">'+_esc(title)+'</span>'+
          '<strong style="font-size:clamp(24px,2.4vw,34px);font-weight:700;color:#1F1F1F;line-height:1.05;letter-spacing:0;overflow-wrap:anywhere;">'+_esc(value)+'</strong>'+
          '<small style="font-size:12px;color:#6F6860;line-height:1.35;">'+_esc(desc||'')+'</small>'+
          (badge ? '<div style="margin-top:2px;">'+badge+'</div>' : '')+
        '</div>'+
      '</div>';
    };
    var supportMetric = function (title, value, desc, icon, color, extra) {
      return '<div style="display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:13px 14px;min-height:76px;">'+
        '<div style="width:38px;height:38px;border-radius:12px;background:transparent;color:'+color+';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:21px;">'+icon+'</span></div>'+
        '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">'+
          '<span style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.15;">'+_esc(title)+'</span>'+
          '<strong style="font-size:22px;font-weight:700;color:#1F1F1F;line-height:1.05;overflow-wrap:anywhere;">'+_esc(value)+'</strong>'+
          '<small style="font-size:12px;color:#6F6860;line-height:1.3;">'+_esc(desc||'')+'</small>'+
          (extra || '')+
        '</div>'+
      '</div>';
    };
    var healthBg = resumo.saude === 'Crítica' ? '#FFF0EE' : (resumo.saude === 'Atenção' ? '#FFF7E6' : '#EDFAF3');
    var healthFg = resumo.saude === 'Crítica' ? '#B42318' : (resumo.saude === 'Atenção' ? '#B45309' : '#1F6F43');
    content.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">'+
        '<div style="min-width:0;flex:1 1 420px;">'+
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;">Visão Geral</h2>'+
          '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Veja o saldo, o desempenho do período e os principais sinais do financeiro.</p>'+
        '</div>'+
      '</div>'+
      '<section style="'+cardStyle+'">'+
        '<div style="display:flex;align-items:flex-start;gap:12px;background:'+healthBg+';color:'+healthFg+';border-radius:15px;padding:14px 16px;">'+
          '<span class="mi" style="font-size:23px;margin-top:1px;">'+(resumo.saude === 'Saudável' ? 'verified' : 'warning')+'</span>'+
          '<div style="min-width:0;">'+
            '<div style="font-size:12px;font-weight:600;line-height:1.2;margin-bottom:4px;">Saúde financeira</div>'+
            '<div style="font-size:16px;font-weight:700;line-height:1.25;margin-bottom:4px;">'+_esc(resumo.saude)+'</div>'+
            '<div style="font-size:13px;line-height:1.45;">'+_esc(resumo.saudeText)+'</div>'+
          '</div>'+
        '</div>'+
      '</section>'+
      '<section style="display:flex;flex-direction:column;gap:12px;">'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;">'+
        heroMetric('Saldo total', _fmtVal(resumo.saldoAtual), 'Saldo disponível nas contas selecionadas.', 'account_balance_wallet', resumo.saldoAtual>=0?'#1F6F43':'#B42318', metricBadge(contaSel?contaSel.nome:'Todas as contas','#fff','#6F6860'))+
        heroMetric('Saldo projetado', _fmtVal(resumo.saldoProjetado), 'Considera entradas previstas e contas a pagar.', 'timeline', resumo.saldoProjetado>=0?'#6C8777':'#B42318', resumo.saldoProjetado<0?metricBadge('Atenção: saldo negativo','#FFF0EE','#B42318'):metricBadge('Projeção saudável','#EDFAF3','#1F6F43'))+
        heroMetric('A pagar', _fmtVal(resumo.totalAPagar), 'Total pendente de pagamento.', 'receipt_long', resumo.vencidas.length>0?'#B42318':'#B45309', resumo.vencidas.length?metricBadge(resumo.vencidas.length+' vencida(s)','#FFF0EE','#B42318'):metricBadge('Sem vencidas','#EDFAF3','#1F6F43'))+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">'+
        supportMetric('Resultado do período', _fmtVal(resumo.resultadoPeriodo), 'Entradas menos saídas efetivadas.', 'balance', resumo.resultadoPeriodo>=0?'#1F6F43':'#B42318')+
        supportMetric('Entradas do período', _fmtVal(resumo.entradasEf), 'Receitas efetivadas no período.', 'south_west', '#1F6F43', '<button onclick="Modules.Financeiro._switchSub(\'movimentacoes\')" style="width:max-content;margin-top:4px;padding:0;border:none;background:none;color:#B42318;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Ver entradas</button>')+
        supportMetric('Saídas do período', _fmtVal(resumo.saidasEf), 'Despesas efetivadas no período.', 'north_east', '#B42318', '<button onclick="Modules.Financeiro._switchSub(\'contas-pagar\')" style="width:max-content;margin-top:4px;padding:0;border:none;background:none;color:#B42318;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Ver saídas</button>')+
        supportMetric('Vencido em atraso', _fmtVal(resumo.valorVencido), resumo.vencidas.length ? resumo.vencidas.length+' conta(s) vencida(s)' : 'Sem contas vencidas.', 'priority_high', resumo.vencidas.length?'#B42318':'#6C8777', '<button onclick="Modules.Financeiro._openContasVencidas()" style="width:max-content;margin-top:4px;padding:0;border:none;background:none;color:#B42318;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Ver vencidas</button>')+
      '</div>'+
      '</section>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:18px;align-items:start;">'+
        '<section style="'+cardStyle+'">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap;">'+
            sectionTitle('Movimentações recentes', 'Movimentos do período e da conta selecionada.', 'receipt_long')+
            '<button onclick="Modules.Financeiro._switchSub(\'fluxo-caixa\')" style="font-size:12px;color:#B42318;background:none;border:none;cursor:pointer;font-weight:700;font-family:inherit;">Ver todas</button>'+
          '</div>'+
          (recentes.length===0
            ? '<div style="text-align:center;padding:32px 24px;color:#6F6860;background:#FAF8F4;border:1px dashed #EAE4DA;border-radius:14px;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma movimentação no período</div><div style="font-size:13px;line-height:1.5;">Ajuste os filtros ou registre entradas e saídas para acompanhar o fluxo.</div></div>'
            : '<div style="display:flex;flex-direction:column;gap:0;">'+
                recentes.map(function (m) {
                  var isTransfer = _isTransferMov(m);
                  var selectedContaId = contaSel ? contaSel.id : (m.conta_id || m.contaBancariaId || '');
                  var conta = _contasBancarias.find(function (c) { return c.id === selectedContaId; });
                  var originName = m.contaOrigemNome || ((_contasBancarias.find(function (c) { return c.id === _transferOriginId(m); }) || {}).nome) || 'Origem';
                  var destName = m.contaDestinoNome || ((_contasBancarias.find(function (c) { return c.id === _transferDestinationId(m); }) || {}).nome) || 'Destino';
                  var tipo = isTransfer ? (selectedContaId ? _transferLabelForAccount(m, selectedContaId) : 'Transferência') : (m.tipo === 'entrada' ? 'Entrada' : 'Saída');
                  var st = m.status || 'efetivado';
                  var statusTxt = st === 'efetivado' ? 'Efetivado' : (st === 'parcial' ? 'Parcial' : (st === 'previsto' ? 'Previsto' : st));
                  var statusBg = st === 'efetivado' ? '#DCFCE7' : (st === 'parcial' ? '#FEF3C7' : '#EFF6FF');
                  var statusFg = st === 'efetivado' ? '#166534' : (st === 'parcial' ? '#B45309' : '#2563EB');
                  var transferEffect = isTransfer ? _transferEffectForAccount(m, selectedContaId) : 0;
                  var sign = isTransfer ? (selectedContaId ? (transferEffect < 0 ? '-' : '+') : '') : (m.tipo === 'saida' ? '-' : '+');
                  var info = _movValorInfo(m);
                  var val = isTransfer ? Math.abs(transferEffect || _parseNum(m.valor)) : (m.tipo === 'entrada' ? (m.status === 'parcial' ? info.valorRecebido : info.displayValor) : (m.status === 'parcial' ? info.valorPago : info.displayValor));
                  var tone = isTransfer ? '#8A6F5A' : (m.tipo === 'entrada' ? '#1F6F43' : '#B42318');
                  return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #EAE4DA;transition:background .15s ease;" onmouseenter="this.style.background=\'#FAF8F4\'" onmouseleave="this.style.background=\'transparent\'">'+
                    '<div style="width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:transparent;color:'+tone+';font-size:15px;font-weight:700;flex-shrink:0;"><span class="mi" style="font-size:21px;">'+(isTransfer?'sync_alt':(m.tipo==='entrada'?'south_west':'north_east'))+'</span></div>'+
                    '<div style="flex:1;min-width:0;">'+
                      '<div style="font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(m.descricao||'—')+'</div>'+
                      '<div style="font-size:12px;color:#6F6860;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+
                        _esc([tipo, isTransfer && !selectedContaId ? (originName + ' → ' + destName) : (conta ? conta.nome : '—'), _fmtDateDisplay(m.data), statusTxt].join(' · '))+
                      '</div>'+
                    '</div>'+
                    '<div style="font-size:14px;font-weight:700;color:'+tone+';flex-shrink:0;white-space:nowrap;">'+(sign ? sign + ' ' : '')+_fmtVal(val)+'</div>'+
                    '<span style="margin-left:8px;background:'+statusBg+';color:'+statusFg+';padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700;flex-shrink:0;">'+_esc(statusTxt)+'</span>'+
                  '</div>';
                }).join('')+
              '</div>')+
        '</section>'+
        '<section style="'+cardStyle+'">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap;">'+
            sectionTitle('Contas bancárias', 'Saldo atual e atividade por conta.', 'account_balance')+
            '<button onclick="Modules.Financeiro._abrirGestaoContasBancarias()" style="font-size:12px;color:#B42318;background:none;border:none;cursor:pointer;font-weight:700;font-family:inherit;">Gerir</button>'+
          '</div>'+
          (contasVisao.length===0
            ? '<div style="text-align:center;padding:32px 24px;color:#6F6860;background:#FAF8F4;border:1px dashed #EAE4DA;border-radius:14px;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma conta bancária cadastrada</div><div style="font-size:13px;line-height:1.5;">Adicione uma conta para ver saldo, última movimentação e volume do período.</div></div>'
            : '<div style="display:flex;flex-direction:column;gap:10px;">'+
                contasVisao.map(function (item) {
                  var c = item.conta;
                  var ultimo = item.ultimo;
                  var periodCount = item.totalPeriodo;
                  return '<div style="padding:12px 14px;border-radius:14px;background:'+(contaSel&&String(contaSel.id)===String(c.id)?'#FFF7ED':'#FAF8F4')+';border:1px solid '+(contaSel&&String(contaSel.id)===String(c.id)?'#F7D9B6':'#EAE4DA')+';">'+
                    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;">'+
                      '<div style="min-width:0;">'+
                        '<div style="font-size:14px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(c.nome||'Conta')+'</div>'+
                        '<div style="font-size:12px;color:#6F6860;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc([c.tipoGlobalNome || c.tipo || '', c.banco || ''].filter(Boolean).join(' · ') || 'Sem tipo informado')+'</div>'+
                      '</div>'+
                      '<div style="font-size:16px;font-weight:700;color:'+(item.saldo>=0?'#1F6F43':'#B42318')+';white-space:nowrap;">'+_fmtVal(item.saldo)+'</div>'+
                    '</div>'+
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'+
                      '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:10px;padding:8px 10px;"><div style="font-size:11px;font-weight:600;color:#6F6860;">Última movimentação</div><div style="font-size:12px;font-weight:700;color:#1F1F1F;margin-top:3px;">'+(ultimo?_esc(_fmtDateDisplay(ultimo.data)):'—')+'</div></div>'+
                      '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:10px;padding:8px 10px;"><div style="font-size:11px;font-weight:600;color:#6F6860;">Movimentos no período</div><div style="font-size:12px;font-weight:700;color:#1F1F1F;margin-top:3px;">'+periodCount+' registro'+(periodCount===1?'':'s')+'</div></div>'+
                    '</div>'+
                  '</div>';
                }).join('')+
              '</div>')+
        '</section>'+
      '</div>'+
      '</div>';
  }

  // ── FLUXO DE CAIXA ────────────────────────────────────────────────────────
  var _PERIODO_OPTIONS=[
    {value:'todos',          label:'Todo período'},
    {value:'hoje',           label:'Hoje'},
    {value:'ontem',          label:'Ontem'},
    {value:'semana',         label:'Esta semana'},
    {value:'semana-passada', label:'Semana passada'},
    {value:'mes',            label:'Este mês'},
    {value:'mes-passado',    label:'Mês passado'},
    {value:'7d',             label:'Últimos 7 dias'},
    {value:'30d',            label:'Últimos 30 dias'},
    {value:'90d',            label:'Últimos 90 dias'},
    {value:'trimestre',      label:'Este trimestre'},
    {value:'ano',            label:'Este ano'},
    {value:'ano-passado',    label:'Ano passado'},
    {value:'custom',         label:'Personalizado'}
  ];
  var _fluxoFiltro={status:{efetivado:true,previsto:true,vencido:true},periodo:'todos',inicio:'',fim:'',busca:'',ordem:'asc',conta:'todas'};
  var _fluxoView={page:1,pageSize:12};

  function _periodoOptionsHtml(selected) {
    var sel=selected==='30'?'30d':selected;
    return _PERIODO_OPTIONS.map(function(o){ return '<option value="'+o.value+'"'+(sel===o.value?' selected':'')+'>'+o.label+'</option>'; }).join('');
  }

  function _periodRange(periodo, inicio, fim) {
    var hoje=_today(); var now=new Date(); var p=periodo==='30'?'30d':periodo;
    if(p==='todos') return {start:null,end:null};
    if(p==='hoje') return {start:hoje,end:hoje};
    if(p==='ontem'){ var d=new Date(now);d.setDate(d.getDate()-1);var s=_dateToYMD(d);return {start:s,end:s}; }
    if(p==='semana'){ var dow=(now.getDay()||7);var mon=new Date(now);mon.setDate(now.getDate()-dow+1);mon.setHours(0,0,0,0);var sun=new Date(mon);sun.setDate(mon.getDate()+6);return {start:_dateToYMD(mon),end:_dateToYMD(sun)}; }
    if(p==='semana-passada'){ var dow2=(now.getDay()||7);var lm=new Date(now);lm.setDate(now.getDate()-dow2-6);lm.setHours(0,0,0,0);var ls=new Date(lm);ls.setDate(lm.getDate()+6);return {start:_dateToYMD(lm),end:_dateToYMD(ls)}; }
    if(p==='mes'){ var y=now.getFullYear(),m=now.getMonth();var last=new Date(y,m+1,0);return {start:hoje.slice(0,7)+'-01',end:_dateToYMD(last)}; }
    if(p==='mes-passado'){ var dp=new Date(now.getFullYear(),now.getMonth()-1,1);var lastp=new Date(now.getFullYear(),now.getMonth(),0);return {start:_dateToYMD(dp),end:_dateToYMD(lastp)}; }
    if(p==='7d') return {start:_addLocalDays(hoje,-7),end:hoje};
    if(p==='30d') return {start:_addLocalDays(hoje,-30),end:hoje};
    if(p==='90d') return {start:_addLocalDays(hoje,-90),end:hoje};
    if(p==='trimestre'){ var q=Math.floor(now.getMonth()/3);var qs=new Date(now.getFullYear(),q*3,1);var qe=new Date(now.getFullYear(),q*3+3,0);return {start:_dateToYMD(qs),end:_dateToYMD(qe)}; }
    if(p==='ano') return {start:hoje.slice(0,4)+'-01-01',end:hoje.slice(0,4)+'-12-31'};
    if(p==='ano-passado'){ var yp=String(parseInt(hoje.slice(0,4),10)-1);return {start:yp+'-01-01',end:yp+'-12-31'}; }
    if(p==='custom') return {start:inicio||null,end:fim||null};
    return {start:null,end:null};
  }

  function _loadFluxoCaixa() {
    Promise.all([_loadMovimentacoesData(),DB.getAll('contas_bancarias'),_loadContasPagarData()]).then(function(r){
      _movimentacoes=r[0]||[]; _contasBancarias=r[1]||[]; _contasPagar=r[2]||[];
      _paintFluxoCaixa();
    });
  }

  function _fluxoPeriodRange() {
    return _periodRange(_fluxoFiltro.periodo,_fluxoFiltro.inicio,_fluxoFiltro.fim);
  }

  function _buildFluxoModel() {
    var range=_fluxoPeriodRange();
    var normStatus=function(st){ return (st==='pendente'||st==='parcial')?'previsto':st; };
    var incluiStatus=function(st){ st=normStatus(st||'previsto'); return !!(_fluxoFiltro.status&&_fluxoFiltro.status[st]); };
    var busca=_normSearch(_fluxoFiltro.busca||'');
    var eventos=[];
    _movimentacoes.filter(function(m){
      if(m.tipo!=='entrada'&&m.tipo!=='saida') return false;
      if(!incluiStatus(m.status||'efetivado')) return false;
      if(_fluxoFiltro.conta!=='todas'&&m.conta_id!==_fluxoFiltro.conta) return false;
      if(range.start&&(!m.data||m.data<range.start)) return false;
      if(range.end&&(!m.data||m.data>range.end)) return false;
      return true;
    }).forEach(function(m){
      eventos.push({data:m.data,tipo:m.tipo==='entrada'?'entrada':'saida',status:normStatus(m.status||'efetivado'),descricao:m.descricao||'Movimentação',categoria:m.categoria||'',entrada:m.tipo==='entrada'?_parseNum(m.valor):0,saida:m.tipo==='saida'?_parseNum(m.valor):0,order:m.tipo==='entrada'?1:2});
    });
    _contasPagar.filter(function(cp){
      var st=_statusCP(cp);
      if(st==='pago') return false;
      if(!incluiStatus(st)) return false;
      if(_fluxoFiltro.conta!=='todas'&&(!cp.conta_id||cp.conta_id!==_fluxoFiltro.conta)) return false;
      if(range.start&&(!cp.vencimento||cp.vencimento<range.start)) return false;
      if(range.end&&(!cp.vencimento||cp.vencimento>range.end)) return false;
      return true;
    }).forEach(function(cp){
      eventos.push({data:cp.vencimento,tipo:'saida',status:normStatus(_statusCP(cp)),descricao:cp.descricao||'Saída',categoria:cp.categoria||cp.fornecedor||'Saída',entrada:0,saida:_parseNum(cp.valor),order:3});
    });
    if(busca){ eventos=eventos.filter(function(ev){ return _normSearch((ev.descricao||'')+' '+(ev.categoria||'')+' '+(ev.tipo||'')).indexOf(busca)>=0; }); }
    var rows=eventos.sort(function(a,b){ var d=(a.data||'').localeCompare(b.data||''); return d?d:a.order-b.order; });
    if(_fluxoFiltro.ordem==='desc') rows.reverse();
    var conta=(_contasBancarias||[]).find(function(c){ return String(c.id)===String(_fluxoFiltro.conta); });
    var saldoInicialFluxo=_fluxoSaldoInicialSelecionado(conta);
    var running=saldoInicialFluxo;
    rows=rows.map(function(ev){ running+=ev.entrada-ev.saida; ev.saldo=running; return ev; });
    var entradaTotal=rows.reduce(function(s,r){ return s+(r.entrada||0); },0);
    var saidaTotal=rows.reduce(function(s,r){ return s+(r.saida||0); },0);
    var vencidos=rows.filter(function(r){ return r.status==='vencido'; }).length;
    var previstos=rows.filter(function(r){ return r.status==='previsto'; }).length;
    var efetivados=rows.filter(function(r){ return r.status==='efetivado'; }).length;
    var periodoLabel=(_PERIODO_OPTIONS.find(function(p){ return p.value===(_fluxoFiltro.periodo==='30'?'30d':_fluxoFiltro.periodo); })||{}).label||'Todo período';
    return {
      rows: rows,
      entradaTotal: entradaTotal,
      saidaTotal: saidaTotal,
      saldoFiltrado: running,
      saldoInicialFluxo: saldoInicialFluxo,
      vencidos: vencidos,
      previstos: previstos,
      efetivados: efetivados,
      periodoLabel: periodoLabel,
      contaLabel: conta ? (conta.nome||'Conta') : 'Todas as contas'
    };
  }

  function _fluxoSaldoInicialSelecionado(conta) {
    if (conta) return _saldoContaAteData(conta, _fluxoPeriodRange().start);
    return (_contasBancarias || []).filter(function (c) {
      return c && c.ativo !== false;
    }).reduce(function (sum, c) {
      return sum + _saldoContaAteData(c, _fluxoPeriodRange().start);
    }, 0);
  }

  function _saldoContaAteData(conta, beforeDate) {
    if (!conta) return 0;
    if (!beforeDate) return _parseNum(conta.saldo_inicial);
    var base = _parseNum(conta.saldo_inicial);
    return (_movimentacoes || []).reduce(function (saldo, m) {
      var data = m && m.data ? String(m.data) : '';
      if (!data || data >= beforeDate) return saldo;
      if (_isTransferMov(m)) return saldo + _transferEffectForAccount(m, conta.id);
      if (String(m.conta_id || m.contaBancariaId || '') !== String(conta.id)) return saldo;
      if (m.status !== 'efetivado' && m.status !== 'parcial') return saldo;
      var info = _movValorInfo(m);
      if (m.tipo === 'entrada') return saldo + (m.status === 'parcial' ? info.valorRecebido : info.valorRow);
      if (m.tipo === 'saida') return saldo - (m.status === 'parcial' ? info.valorPago : info.valorRow);
      return saldo;
    }, base);
  }

  function _fluxoPaging(rows) {
    var total=(rows||[]).length;
    var pageSize=Math.max(6,parseInt(_fluxoView.pageSize,10)||12);
    var totalPages=Math.max(1,Math.ceil(total/pageSize));
    var page=Math.min(Math.max(1,parseInt(_fluxoView.page,10)||1),totalPages);
    if(_fluxoView.page!==page) _fluxoView.page=page;
    var start=(page-1)*pageSize;
    return {
      items:(rows||[]).slice(start,start+pageSize),
      total:total,
      page:page,
      pageSize:pageSize,
      totalPages:totalPages,
      start:total?start+1:0,
      end:Math.min(total,start+pageSize)
    };
  }

  function _paintFluxoCaixa() {
    var content=document.getElementById('fin-content'); if(!content) return;
    var vm=_buildFluxoModel();
    var showCustom=_fluxoFiltro.periodo==='custom';
    var contasAtivas=(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; }).slice().sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); });
    var cardStyle='background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.055);';
    var inputStyle='width:100%;box-sizing:border-box;padding:0 12px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;height:42px;';
    var selectStyle=inputStyle+'appearance:none;-webkit-appearance:none;background-color:#FFFCF8;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:36px;';
    var labelStyle='font-size:11px;font-weight:650;color:#6F6860;letter-spacing:.04em;text-transform:uppercase;display:block;margin-bottom:6px;';
    var hasFluxoFilter=!!(_fluxoFiltro.busca||_fluxoFiltro.periodo!=='todos'||_fluxoFiltro.inicio||_fluxoFiltro.fim||_fluxoFiltro.conta!=='todas'||!_fluxoFiltro.status.efetivado||!_fluxoFiltro.status.previsto||!_fluxoFiltro.status.vencido);
    var sectionTitle=function(title,desc){ return '<div style="margin-bottom:14px;"><h3 style="font-size:15px;font-weight:700;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">'+_esc(title)+'</h3><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:680px;">'+_esc(desc||'')+'</p></div>'; };
    var metric=function(title,value,desc,icon,color){
      return '<div style="display:flex;align-items:flex-start;gap:14px;background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:118px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">'+
        '<div style="width:48px;height:48px;border-radius:14px;background:transparent;color:'+color+';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:26px;">'+icon+'</span></div>'+
        '<div style="min-width:0;display:flex;flex-direction:column;gap:6px;">'+
          '<span style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.15;">'+_esc(title)+'</span>'+
          '<strong style="font-size:clamp(24px,2.4vw,34px);font-weight:700;color:#1F1F1F;line-height:1.05;letter-spacing:0;overflow-wrap:anywhere;">'+_esc(value)+'</strong>'+
          '<small style="font-size:12px;color:#6F6860;line-height:1.35;">'+_esc(desc||'')+'</small>'+
        '</div>'+
      '</div>';
    };
    var statusCheck=function(key,label){
      return '<label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;white-space:nowrap;"><input type="checkbox" '+(_fluxoFiltro.status[key]?'checked':'')+' onchange="Modules.Financeiro._setFluxoFiltro(\'status.'+key+'\',this.checked)" style="accent-color:#B42318;width:16px;height:16px;"> '+label+'</label>';
    };
    content.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">'+
          '<div style="min-width:0;flex:1 1 420px;">'+
            '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;">Fluxo de Caixa</h2>'+
            '<p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Acompanhe entradas, saídas e saldo acumulado conforme período, status e conta bancária.</p>'+
          '</div>'+
        '</div>'+
        '<section style="'+cardStyle+'">'+
          '<div style="display:grid;grid-template-columns:minmax(240px,1fr) minmax(180px,220px) minmax(220px,280px) auto;gap:12px;align-items:end;justify-content:start;">'+
            '<div><label style="'+labelStyle+'">Busca</label><input id="fluxo-busca" type="search" value="'+_esc(_fluxoFiltro.busca||'')+'" oninput="Modules.Financeiro._setFluxoFiltro(\'busca\',this.value)" placeholder="Buscar descrição, categoria ou tipo" style="'+inputStyle+'"></div>'+
            '<div><label style="'+labelStyle+'">Período</label><select onchange="Modules.Financeiro._setFluxoFiltro(\'periodo\',this.value)" style="'+selectStyle+'">'+_periodoOptionsHtml(_fluxoFiltro.periodo)+'</select></div>'+
            '<div><label style="'+labelStyle+'">Conta Bancária</label><select onchange="Modules.Financeiro._setFluxoFiltro(\'conta\',this.value)" style="'+selectStyle+'">'+
              '<option value="todas"'+(_fluxoFiltro.conta==='todas'?' selected':'')+'>Todas as contas</option>'+
              contasAtivas.map(function(c){ return '<option value="'+_esc(c.id)+'"'+(_fluxoFiltro.conta===c.id?' selected':'')+'>'+_esc(c.nome||'Conta')+'</option>'; }).join('')+
            '</select></div>'+
            (hasFluxoFilter?'<div style="display:flex;align-items:flex-end;"><button onclick="Modules.Financeiro._limparFluxoFiltros()" style="height:38px;padding:0 14px;border:1px solid #E8DCD7;border-radius:12px;font-size:12.5px;font-weight:600;color:#B42318;background:#fff;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>':'')+
          '</div>'+
          '<div style="margin-top:12px;display:grid;grid-template-columns:minmax(220px,max-content);gap:6px;">'+
            '<span style="'+labelStyle+'margin-bottom:0;">Status</span>'+
            '<div style="min-height:42px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;">'+statusCheck('efetivado','Efetivado')+statusCheck('previsto','Previsto')+statusCheck('vencido','Vencido')+'</div>'+
          '</div>'+
          (showCustom?'<div style="display:grid;grid-template-columns:repeat(2,minmax(160px,220px));gap:12px;margin-top:12px;">'+
            '<div><label style="'+labelStyle+'">Data inicial</label><input type="date" value="'+_esc(_fluxoFiltro.inicio||'')+'" onchange="Modules.Financeiro._setFluxoFiltro(\'inicio\',this.value)" style="'+inputStyle+'"></div>'+
            '<div><label style="'+labelStyle+'">Data final</label><input type="date" value="'+_esc(_fluxoFiltro.fim||'')+'" onchange="Modules.Financeiro._setFluxoFiltro(\'fim\',this.value)" style="'+inputStyle+'"></div>'+
          '</div>':'')+
        '</section>'+
        '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;">'+
          metric('Saldo antes do período', _fmtVal(vm.saldoInicialFluxo), 'Ponto de partida das contas selecionadas.', 'account_balance', vm.saldoInicialFluxo>=0?'#6C8777':'#B42318')+
          metric('Saldo filtrado', _fmtVal(vm.saldoFiltrado), 'Resultado acumulado dos eventos exibidos.', 'account_balance_wallet', vm.saldoFiltrado>=0?'#1F6F43':'#B42318')+
          metric('Entradas', _fmtVal(vm.entradaTotal), vm.efetivados+' evento(s) efetivado(s) no recorte.', 'south_west', '#1F6F43')+
          metric('Saídas', _fmtVal(vm.saidaTotal), vm.vencidos?vm.vencidos+' evento(s) vencido(s) no recorte.':'Sem vencidos no recorte.', 'north_east', vm.vencidos?'#B42318':'#B45309')+
          metric('Previstos', String(vm.previstos), 'Entradas e saídas ainda não efetivadas.', 'pending_actions', '#6C8777')+
        '</section>'+
        '<section style="'+cardStyle+'padding:0;overflow:hidden;">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:18px 20px;border-bottom:1px solid #EAE4DA;">'+
            '<div>'+sectionTitle('Linha do fluxo','Eventos organizados em linha vertical por data, com saldo acumulado preservado.')+'</div>'+
            '<button onclick="Modules.Financeiro._toggleFluxoOrdem()" style="border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;"><span class="mi" style="font-size:17px;">swap_vert</span>Data '+(_fluxoFiltro.ordem==='asc'?'↑':'↓')+'</button>'+
          '</div>'+
          '<div id="fluxo-results"></div>'+
        '</section>'+
      '</div>';
    _refreshFluxoResults();
  }

  function _refreshFluxoResults() {
    var resultsEl=document.getElementById('fluxo-results');
    if(!resultsEl) return;
    var vm=_buildFluxoModel();
    var rows=vm.rows;
    var paging=_fluxoPaging(rows);
    var pageSizeOptions=[8,12,24,48].map(function(n){ return '<option value="'+n+'"'+(Number(_fluxoView.pageSize)===n?' selected':'')+'>'+n+' / pág.</option>'; }).join('');
    var paginationHtml=paging.total?'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 20px;border-top:1px solid #EAE4DA;">'+
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">'+paging.start+'</strong> a <strong style="color:#1F1F1F;font-weight:600;">'+paging.end+'</strong> de <strong style="color:#1F1F1F;font-weight:600;">'+paging.total+'</strong></span>'+
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">'+
        '<select onchange="Modules.Financeiro._setFluxoPageSize(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">'+pageSizeOptions+'</select>'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<button type="button" onclick="Modules.Financeiro._setFluxoPage('+(paging.page-1)+')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:'+(paging.page>1?'pointer':'not-allowed')+';opacity:'+(paging.page>1?'1':'.45')+';"'+(paging.page>1?'':' disabled')+'>Anterior</button>'+
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">'+paging.page+'</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">'+paging.totalPages+'</span></div>'+
          '<button type="button" onclick="Modules.Financeiro._setFluxoPage('+(paging.page+1)+')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:'+(paging.page<paging.totalPages?'pointer':'not-allowed')+';opacity:'+(paging.page<paging.totalPages?'1':'.45')+';"'+(paging.page<paging.totalPages?'':' disabled')+'>Próxima</button>'+
        '</div>'+
      '</div>'+
    '</div>':'';
    resultsEl.innerHTML=rows.length===0
      ?'<div style="text-align:center;padding:42px 24px;color:#6F6860;background:#FAF8F4;border:1px dashed #EAE4DA;border-radius:14px;margin:18px 20px;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum evento encontrado</div><div style="font-size:13px;line-height:1.5;">Ajuste os filtros ou adicione lançamentos para visualizar o fluxo.</div></div>'
      :'<div style="padding:18px 20px 4px;overflow-x:auto;">'+
          '<div style="display:flex;flex-direction:column;gap:12px;position:relative;min-width:760px;">'+
            paging.items.map(function(r,idx){
              var statusLabel=r.status==='efetivado'?'Efetivado':(r.status==='vencido'?'Vencido':'Previsto');
              var statusColor=r.status==='efetivado'?'#166534':(r.status==='vencido'?'#B42318':'#6C8777');
              var statusBg=r.status==='efetivado'?'#DCFCE7':(r.status==='vencido'?'#FFF0EE':'#FAF8F4');
              var tone=r.tipo==='entrada'?'#1F6F43':'#B42318';
              var value=r.entrada>0?r.entrada:r.saida;
              return '<div style="display:grid;grid-template-columns:120px 34px minmax(0,1fr) auto;gap:12px;align-items:center;position:relative;">'+
                '<div style="font-size:12px;font-weight:700;color:#6F6860;white-space:nowrap;">'+_esc(_fmtDateDisplay(r.data))+'</div>'+
                '<div style="position:relative;display:flex;align-items:center;justify-content:center;min-height:64px;">'+
                  (idx<paging.items.length-1?'<span style="position:absolute;top:38px;bottom:-26px;left:50%;width:1px;background:#EAE4DA;"></span>':'')+
                  '<span style="width:34px;height:34px;border-radius:12px;background:#fff;border:1px solid #EAE4DA;color:'+tone+';display:inline-flex;align-items:center;justify-content:center;z-index:1;"><span class="mi" style="font-size:21px;">'+(r.tipo==='entrada'?'south_west':'north_east')+'</span></span>'+
                '</div>'+
                '<div style="min-width:0;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px 14px;transition:background .15s ease,box-shadow .15s ease,transform .15s ease;" onmouseenter="this.style.background=\'#FAF8F4\';this.style.boxShadow=\'0 10px 24px rgba(31,31,31,.05)\';this.style.transform=\'translateY(-1px)\'" onmouseleave="this.style.background=\'#fff\';this.style.boxShadow=\'none\';this.style.transform=\'translateY(0)\'">'+
                  '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">'+
                    '<div style="min-width:0;">'+
                      '<div style="font-size:13px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(r.descricao)+'</div>'+
                      '<div style="font-size:12px;color:#6F6860;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(r.tipo==='entrada'?'Entrada':'Saída')+(r.categoria?' · '+_esc(r.categoria):'')+'</div>'+
                    '</div>'+
                    '<span style="background:'+statusBg+';color:'+statusColor+';padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700;flex:0 0 auto;">'+statusLabel+'</span>'+
                  '</div>'+
                '</div>'+
                '<div style="text-align:right;min-width:138px;">'+
                  '<div style="font-size:15px;font-weight:800;color:'+tone+';white-space:nowrap;">'+(r.tipo==='entrada'?'+':'-')+_fmtVal(value)+'</div>'+
                  '<div style="font-size:11px;font-weight:600;color:'+(r.saldo>=0?'#1F6F43':'#B42318')+';margin-top:3px;white-space:nowrap;">Saldo '+_fmtVal(r.saldo)+'</div>'+
                '</div>'+
              '</div>';
            }).join('')+
          '</div>'+
        '</div>'+paginationHtml;
  }

  function _setFluxoFiltro(key,val){
    if(key.indexOf('status.')===0){
      var st=key.split('.')[1];
      _fluxoFiltro.status[st]=!!val;
    } else {
      _fluxoFiltro[key]=val;
    }
    _fluxoView.page=1;
    if(key==='periodo'&&val==='custom'){
      _fluxoFiltro.inicio=_fluxoFiltro.inicio||_today();
      _fluxoFiltro.fim=_fluxoFiltro.fim||_today();
    }
    _paintFluxoCaixa();
  }

  function _toggleFluxoOrdem(){
    _fluxoFiltro.ordem=_fluxoFiltro.ordem==='asc'?'desc':'asc';
    _fluxoView.page=1;
    _refreshFluxoResults();
  }

  function _limparFluxoFiltros(){
    _fluxoFiltro={status:{efetivado:true,previsto:true,vencido:true},periodo:'todos',inicio:'',fim:'',busca:'',ordem:'asc',conta:'todas'};
    _fluxoView={page:1,pageSize:12};
    _paintFluxoCaixa();
  }

  function _setFluxoPage(page){
    var next=parseInt(page,10);
    if(!isFinite(next)) return;
    _fluxoView.page=Math.max(1,next);
    _paintFluxoCaixa();
  }

  function _setFluxoPageSize(value){
    var size=parseInt(value,10);
    if(!isFinite(size)||size<=0) return;
    _fluxoView.pageSize=size;
    _fluxoView.page=1;
    _paintFluxoCaixa();
  }

  function _limparMovFiltros(){
    _resetMovDefaultListState();
    _paintMovimentacoes();
  }

  function _clearMovSelection(){ _movSelecionadas=[]; _paintMovimentacoes(); }

  function _bulkMovStatus(status){
    var ids=_movSelecionadas.slice();
    if(!ids.length) return;
    var upd={status:status};
    if(status==='efetivado') upd.data_recebimento=_today();
    Promise.all(ids.map(function(id){ return DB.update('movimentacoes',id,upd); })).then(function(){
      UI.toast(ids.length+' entrada(s) atualizada(s).','success');
      _movSelecionadas=[];
      _loadMovimentacoes();
    }).catch(function(){ UI.toast('Não foi possível atualizar as entradas selecionadas.','error'); });
  }

  function _openBulkEntradaModal(){
    if(!_movSelecionadas.length) return;
    var cats=_catsByTipo('entrada');
    var catOpts='<option value="">Manter categoria</option>'+cats.map(function(c){ return '<option value="'+_esc(c)+'">'+_esc(c)+'</option>'; }).join('');
    var contaOpts='<option value="">Manter conta</option>'+(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; }).sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); }).map(function(c){ return '<option value="'+c.id+'">'+_esc(c.nome||'')+'</option>'; }).join('');
    var body='<div style="display:flex;flex-direction:column;gap:12px;">'+
      '<div><label style="'+_lbl()+'">Categoria</label><select id="bulk-mov-cat" style="'+_inp()+'background:#fff;">'+catOpts+'</select></div>'+
      '<div><label style="'+_lbl()+'">Forma de pagamento</label><select id="bulk-mov-forma" style="'+_inp()+'background:#fff;"><option value="">Manter forma</option>'+_formaOptions('').replace('<option value="">Selecionar...</option>','')+'</select></div>'+
      '<div><label style="'+_lbl()+'">Conta bancária</label><select id="bulk-mov-conta" style="'+_inp()+'background:#fff;">'+contaOpts+'</select></div>'+
    '</div>';
    var footer='<button onclick="Modules.Financeiro._applyBulkEntrada()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Aplicar</button>';
    window._bulkMovModal=UI.modal({title:'Alterar entradas selecionadas',body:body,footer:footer,maxWidth:'440px'});
  }

  function _applyBulkEntrada(){
    var upd={};
    var cat=(document.getElementById('bulk-mov-cat')||{}).value||'';
    var forma=(document.getElementById('bulk-mov-forma')||{}).value||'';
    var conta=(document.getElementById('bulk-mov-conta')||{}).value||'';
    if(cat) upd.categoria=cat;
    if(forma) upd.forma_pagamento=forma;
    if(conta) upd.conta_id=conta;
    var ids=_movSelecionadas.slice();
    if(!Object.keys(upd).length){ UI.toast('Escolha pelo menos uma alteração.','error'); return; }
    Promise.all(ids.map(function(id){ return DB.update('movimentacoes',id,upd); })).then(function(){
      if(window._bulkMovModal) window._bulkMovModal.close();
      UI.toast(ids.length+' entrada(s) atualizada(s).','success');
      _movSelecionadas=[];
      _loadMovimentacoes();
    }).catch(function(){ UI.toast('Não foi possível atualizar as entradas selecionadas.','error'); });
  }

  function _bulkDeleteMov(){
    var ids=_movSelecionadas.slice();
    if(!ids.length) return;
    UI.confirm('Excluir '+ids.length+' entrada(s) selecionada(s)?').then(function(yes){
      if(!yes) return;
      var valid=ids.filter(function(id){
        var m=(_movimentacoes||[]).find(function(x){ return x.id===id; });
        return m && m.status!=='efetivado' && m.status!=='parcial';
      });
      Promise.all(valid.map(function(id){ return DB.remove('movimentacoes',id); })).then(function(){
        UI.toast(valid.length+' entrada(s) excluída(s). '+(ids.length-valid.length)+' ignorada(s).','info');
        _movSelecionadas=[];
        _loadMovimentacoes();
      });
    });
  }

  function _limparCPFiltros(){
    _resetCPDefaultListState();
    _paintContasPagar();
  }

  function _nextNumeroSequencial(tipo) {
    var key=tipo==='entrada'?'entradaSeq':'saidaSeq';
    var prefix=tipo==='entrada'?'EN':'SA';
    return DB.getDocRoot('config','financeiro').then(function(cfg){
      cfg=cfg||{};
      var seq=(parseInt(cfg[key]||0,10)||0)+1;
      var num=prefix+'-'+String(seq).padStart(6,'0');
      var upd={};
      upd[key]=seq;
      return DB.setDocRoot('config','financeiro',upd).then(function(){ _configFin[key]=seq; return num; });
    });
  }

  function _applyFormaPadraoConta(scope){
    var formaEl=document.getElementById(scope==='cp'?'cp-forma':'mov-forma');
    var contaEl=document.getElementById(scope==='cp'?'cp-conta':'mov-conta');
    if(!formaEl||!contaEl||contaEl.value) return;
    var nome=formaEl.value||'';
    var forma=_formasPagFull(true).find(function(f){ return (f.nome||'')===nome; });
    if(forma&&forma.contaPadraoId) contaEl.value=forma.contaPadraoId;
  }

  function _contaBancariaOptions(selectedId) {
    selectedId = selectedId || '';
    return '<option value="">Selecionar conta...</option>' + (_contasBancarias || []).filter(function (c) {
      return c.ativo !== false || c.id === selectedId;
    }).sort(function (a, b) {
      return (a.nome || '').localeCompare(b.nome || '');
    }).map(function (c) {
      return '<option value="' + c.id + '"' + (selectedId === c.id ? ' selected' : '') + '>' + _esc(c.nome || '') + '</option>';
    }).join('');
  }

  function _quickBankTypeOptions(selectedType) {
    selectedType = selectedType || '';
    var bankTypes = _globalFinanceList('bank', false).filter(function (t) { return _globalTypeCountryOk(t.countryFiscal, _tenantFiscalCountry()); });
    var opts = bankTypes.map(function (t) {
      var selected = selectedType && (String(t.id) === String(selectedType) || String(t.slug) === String(selectedType) || String(t.name) === String(selectedType));
      return '<option value="' + _esc(t.id) + '" data-slug="' + _esc(t.slug) + '" data-name="' + _esc(t.name) + '" data-country="' + _esc(t.countryFiscal) + '"' + (selected ? ' selected' : '') + '>' + _esc(t.name) + '</option>';
    }).join('');
    return opts || '<option value="corrente" selected>Conta corrente</option>';
  }

  function _openQuickContaModal(scope) {
    window._quickContaScope = scope || 'cp';
    var cardStyle = _modalCardStyle();
    var fieldStyle = _modalFieldStyle();
    var selectStyle = _modalSelectStyle('max-width:220px;');
    var moneyStyle = _modalFieldStyle('max-width:170px;');
    var body =
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<div style="' + cardStyle + '">' +
          _modalIconTitle('account_balance_wallet', 'Nova conta bancária', 'Cadastre rapidamente a conta que será usada nesta saída.') +
          '<div style="display:flex;flex-direction:column;gap:12px;">' +
            '<div><label style="' + _lbl() + '">Nome da conta *</label><input id="quick-conta-nome" type="text" placeholder="Ex.: Conta principal, Caixa..." style="' + fieldStyle + '"></div>' +
            '<div style="display:grid;grid-template-columns:minmax(220px,1fr) minmax(170px,.55fr);gap:12px;align-items:end;">' +
              '<div><label style="' + _lbl() + '">Banco / Instituição</label><input id="quick-conta-banco" type="text" placeholder="Opcional" style="' + fieldStyle + '"></div>' +
              '<div style="max-width:220px;"><label style="' + _lbl() + '">Tipo</label><select id="quick-conta-tipo" style="' + selectStyle + '">' + _quickBankTypeOptions('') + '</select></div>' +
            '</div>' +
            '<div style="max-width:170px;"><label style="' + _lbl() + '">Saldo inicial</label><input id="quick-conta-saldo" type="text" inputmode="decimal" placeholder="€ 0,00" onfocus="Modules.Financeiro._moneyInputFocus(this)" onblur="Modules.Financeiro._moneyInputBlur(this)" style="' + moneyStyle + '"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    var footer = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;flex-wrap:wrap;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Depois de salvar, a conta fica selecionada nesta saída.</span>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><button type="button" onclick="if(window._quickContaModal)window._quickContaModal.close()" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button><button type="button" onclick="Modules.Financeiro._saveQuickConta()" style="height:40px;padding:0 16px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);">Salvar conta</button></div>' +
    '</div>';
    window._quickContaModal = UI.modal({ title: 'Nova conta bancária', body: body, footer: footer, maxWidth: '640px' });
  }

  function _saveQuickConta() {
    var nome = ((document.getElementById('quick-conta-nome') || {}).value || '').trim();
    if (!nome) { UI.toast('Informe o nome da conta bancária.', 'error'); return; }
    var tipoSel = document.getElementById('quick-conta-tipo') || {};
    var selectedOption = tipoSel.selectedOptions && tipoSel.selectedOptions[0] ? tipoSel.selectedOptions[0] : null;
    var tipoId = (tipoSel.value || '').trim();
    var globalTipo = _globalTypeResolve('bank', tipoId, true) || (selectedOption ? _globalTypeResolve('bank', selectedOption.dataset.slug || selectedOption.dataset.name || selectedOption.textContent || '', true) : null);
    var obj = {
      nome: nome,
      banco: (document.getElementById('quick-conta-banco') || {}).value || '',
      tipo: globalTipo ? (globalTipo.name || globalTipo.nome || tipoId) : tipoId,
      tipoGlobalId: globalTipo ? globalTipo.id : (tipoId || ''),
      tipoGlobalSlug: globalTipo ? globalTipo.slug : (selectedOption ? (selectedOption.dataset.slug || '') : ''),
      tipoGlobalNome: globalTipo ? globalTipo.name : (selectedOption ? (selectedOption.dataset.name || tipoId) : tipoId),
      tipoGlobalCountry: globalTipo ? globalTipo.countryFiscal : (selectedOption ? (selectedOption.dataset.country || 'ambos') : 'ambos'),
      saldo_inicial: _parseNum((document.getElementById('quick-conta-saldo') || {}).value),
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    DB.add('contas_bancarias', obj).then(function (ref) {
      var id = String((ref && ref.id) || '');
      var saved = Object.assign({ id: id }, obj);
      _contasBancarias = (_contasBancarias || []).filter(function (c) { return String(c.id || '') !== id; }).concat(saved);
      var scope = window._quickContaScope || 'cp';
      var select = document.getElementById(scope === 'cp' ? 'cp-conta' : 'mov-conta');
      if (select) {
        select.innerHTML = _contaBancariaOptions(id);
        select.value = id;
      }
      UI.toast('Conta bancária adicionada.', 'success');
      if (window._quickContaModal) window._quickContaModal.close();
    }).catch(function (e) {
      UI.toast('Erro: ' + e.message, 'error');
    });
  }

  // ── MOVIMENTAÇÕES ─────────────────────────────────────────────────────────
  var _movFiltro={tipo:'todos',periodo:'todos',inicio:'',fim:'',contas:[],status:'',busca:'',ordem:'desc'};
  var _movSelecionadas=[];
  var _movVisiveis=[];
  var _movView={page:1,pageSize:12};

  function _resetMovDefaultListState(){
    _movFiltro={tipo:'todos',periodo:'todos',inicio:'',fim:'',contas:[],status:'',busca:'',ordem:'desc'};
    _movSelecionadas=[];
    _movView={page:1,pageSize:12};
  }

  function _loadMovimentacoes() {
    Promise.all([_loadMovimentacoesData(),DB.getAll('contas_bancarias'),DB.getAll('financeiro_categorias'),DB.getAll('store_customers'),DB.getAll('fornecedores'),DB.getDocRoot('config','financeiro')]).then(function(r){
      _movimentacoes=r[0]||[]; _contasBancarias=r[1]||[]; _categorias=r[2]||[]; _clientes=r[3]||[]; _fornecedores=r[4]||[]; _setConfigFin(r[5]);
      _paintMovimentacoes();
    });
  }

  function _movPaging(items) {
    var total=(items||[]).length;
    var pageSize=Math.max(6,parseInt(_movView.pageSize,10)||12);
    var totalPages=Math.max(1,Math.ceil(total/pageSize));
    var page=Math.min(Math.max(1,parseInt(_movView.page,10)||1),totalPages);
    if(_movView.page!==page) _movView.page=page;
    var start=(page-1)*pageSize;
    return {
      items:(items||[]).slice(start,start+pageSize),
      total:total,
      page:page,
      pageSize:pageSize,
      totalPages:totalPages,
      start:total?start+1:0,
      end:Math.min(total,start+pageSize)
    };
  }

  function _paintMovimentacoes() {
    var content=document.getElementById('fin-content'); if(!content) return;
    var range=_periodRange(_movFiltro.periodo,_movFiltro.inicio,_movFiltro.fim);
    var filtered=_movimentacoes.filter(function(m){
      var conta=_contasBancarias.find(function(c){ return c.id===m.conta_id; });
      var busca=(_movFiltro.busca||'').toLowerCase();
      if(m.tipo!=='entrada') return false;
      if(_movFiltro.contas&&_movFiltro.contas.length&&_movFiltro.contas.indexOf(m.conta_id)<0) return false;
      if(_movFiltro.status&&m.status!==_movFiltro.status) return false;
      if(range.start&&(!m.data||m.data<range.start)) return false;
      if(range.end&&(!m.data||m.data>range.end)) return false;
      if(busca){
        var hay=[m.numeroSequencial,m.numeroDocumento,m.numDocumento,m.descricao,m.categoria,m.forma_pagamento,conta?conta.nome:'',m.pessoaNome,String(m.valor||'')].join(' ').toLowerCase();
        if(hay.indexOf(busca)<0) return false;
      }
      return true;
    }).sort(function(a,b){
      var cmp=(a.data||'').localeCompare(b.data||'');
      return _movFiltro.ordem==='asc'?cmp:-cmp;
    });
    _movVisiveis=filtered.map(function(m){ return m.id; });
    _movSelecionadas=_movSelecionadas.filter(function(id){ return filtered.some(function(m){ return m.id===id; }); });
    var totalPrevisto=filtered.filter(function(m){ return (m.status||'efetivado')==='previsto'; }).reduce(function(s,m){
      return s+_movValorInfo(m).valorRow;
    },0);
    var totalEfetivado=filtered.filter(function(m){ return (m.status||'efetivado')==='efetivado' || m.status==='parcial'; }).reduce(function(s,m){
      var info=_movValorInfo(m);
      return s+(m.status==='parcial'?info.valorRecebido:info.valorRow);
    },0);
    var totalParcial=filtered.filter(function(m){ return m.status==='parcial'; }).reduce(function(s,m){
      return s+_movValorInfo(m).saldoRestante;
    },0);
    var paging=_movPaging(filtered);
    var pageItems=paging.items;
    var cardStyle='background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.055);';
    var inputStyle='width:100%;box-sizing:border-box;padding:0 12px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;height:42px;';
    var selectStyle=inputStyle+'appearance:none;-webkit-appearance:none;background-color:#FFFCF8;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:36px;';
    var labelStyle='font-size:11px;font-weight:650;color:#6F6860;letter-spacing:.04em;text-transform:uppercase;display:block;margin-bottom:6px;';
    var hasMovFilter=!!(_movFiltro.busca||_movFiltro.periodo!=='todos'||_movFiltro.inicio||_movFiltro.fim||(_movFiltro.contas&&_movFiltro.contas.length)||_movFiltro.status);
    var sectionTitle=function(title,desc){ return '<div style="margin-bottom:14px;"><h3 style="font-size:15px;font-weight:700;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">'+_esc(title)+'</h3><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:680px;">'+_esc(desc||'')+'</p></div>'; };
    var metric=function(title,value,desc,icon,color){
      return '<div style="display:flex;align-items:flex-start;gap:14px;background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:118px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">'+
        '<div style="width:48px;height:48px;border-radius:14px;background:transparent;color:'+color+';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:26px;">'+icon+'</span></div>'+
        '<div style="min-width:0;display:flex;flex-direction:column;gap:6px;">'+
          '<span style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.15;">'+_esc(title)+'</span>'+
          '<strong style="font-size:clamp(24px,2.4vw,34px);font-weight:700;color:#1F1F1F;line-height:1.05;letter-spacing:0;overflow-wrap:anywhere;">'+_esc(value)+'</strong>'+
          '<small style="font-size:12px;color:#6F6860;line-height:1.35;">'+_esc(desc||'')+'</small>'+
        '</div>'+
      '</div>';
    };
    var contasFiltro=(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; }).slice().sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); });
    var contasHtml='<label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;white-space:nowrap;"><input type="checkbox" '+((!_movFiltro.contas||!_movFiltro.contas.length)?'checked':'')+' onchange="Modules.Financeiro._setMovFiltro(\'contas\',[])" style="accent-color:#B42318;width:16px;height:16px;"> Todas</label>'+
      contasFiltro.map(function(c){ return '<label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;white-space:nowrap;"><input type="checkbox" '+((_movFiltro.contas||[]).indexOf(c.id)>=0?'checked':'')+' onchange="Modules.Financeiro._toggleMovConta(\''+c.id+'\',this.checked)" style="accent-color:#B42318;width:16px;height:16px;"> '+_esc(c.nome)+'</label>'; }).join('');
    var showCustom=_movFiltro.periodo==='custom';
    var pageSizeOptions=[8,12,24,48].map(function(n){ return '<option value="'+n+'"'+(Number(_movView.pageSize)===n?' selected':'')+'>'+n+' / pág.</option>'; }).join('');
    var paginationHtml=paging.total?'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">'+
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">'+paging.start+'</strong> a <strong style="color:#1F1F1F;font-weight:600;">'+paging.end+'</strong> de <strong style="color:#1F1F1F;font-weight:600;">'+paging.total+'</strong></span>'+
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">'+
        '<select onchange="Modules.Financeiro._setMovPageSize(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">'+pageSizeOptions+'</select>'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<button type="button" onclick="Modules.Financeiro._setMovPage('+(paging.page-1)+')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:'+(paging.page>1?'pointer':'not-allowed')+';opacity:'+(paging.page>1?'1':'.45')+';"'+(paging.page>1?'':' disabled')+'>Anterior</button>'+
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">'+paging.page+'</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">'+paging.totalPages+'</span></div>'+
          '<button type="button" onclick="Modules.Financeiro._setMovPage('+(paging.page+1)+')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:'+(paging.page<paging.totalPages?'pointer':'not-allowed')+';opacity:'+(paging.page<paging.totalPages?'1':'.45')+';"'+(paging.page<paging.totalPages?'':' disabled')+'>Próxima</button>'+
        '</div>'+
      '</div>'+
    '</div>':'';
    content.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">'+
        '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Entradas</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Controle valores a receber, recebidos e parciais sem perder o histórico do caixa.</p></div>'+
        '<button onclick="Modules.Financeiro._openMovModal(null,null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">+ Nova Entrada</button>'+
      '</div>'+
      '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;">'+
        metric('A receber', _fmtVal(totalPrevisto), 'Entradas previstas no recorte.', 'pending_actions', '#6C8777')+
        metric('Recebido', _fmtVal(totalEfetivado), 'Valor já efetivado no caixa.', 'south_west', '#1F6F43')+
        metric('Parcial pendente', _fmtVal(totalParcial), 'Saldo restante de recebimentos parciais.', 'hourglass_top', '#B45309')+
        metric('Registros', String(filtered.length), 'Entradas encontradas pelos filtros.', 'receipt_long', '#8A6F5A')+
      '</section>'+
      '<section style="'+cardStyle+'">'+
        '<div style="display:grid;grid-template-columns:minmax(240px,1fr) minmax(180px,220px) minmax(170px,210px) auto;gap:12px;align-items:end;justify-content:start;">'+
          '<div><label style="'+labelStyle+'">Busca</label><input id="mov-busca" type="search" value="'+_esc(_movFiltro.busca||'')+'" oninput="Modules.Financeiro._setMovFiltro(\'busca\',this.value)" placeholder="Descrição, cliente, documento, forma, conta ou valor" style="'+inputStyle+'"></div>'+
          '<div><label style="'+labelStyle+'">Período</label><select onchange="Modules.Financeiro._setMovFiltro(\'periodo\',this.value)" style="'+selectStyle+'">'+_periodoOptionsHtml(_movFiltro.periodo)+'</select></div>'+
          '<div><label style="'+labelStyle+'">Status</label><select onchange="Modules.Financeiro._setMovFiltro(\'status\',this.value)" style="'+selectStyle+'">'+
            '<option value=""'+(!_movFiltro.status?' selected':'')+'>Qualquer status</option>'+
            '<option value="efetivado"'+(_movFiltro.status==='efetivado'?' selected':'')+'>Recebido</option>'+
            '<option value="previsto"'+(_movFiltro.status==='previsto'?' selected':'')+'>A receber</option>'+
            '<option value="parcial"'+(_movFiltro.status==='parcial'?' selected':'')+'>Parcial</option>'+
          '</select></div>'+
          (hasMovFilter?'<div style="display:flex;align-items:flex-end;"><button onclick="Modules.Financeiro._limparMovFiltros()" style="height:38px;padding:0 14px;border:1px solid #E8DCD7;border-radius:12px;font-size:12.5px;font-weight:600;color:#B42318;background:#fff;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>':'')+
        '</div>'+
        '<div style="margin-top:12px;display:grid;grid-template-columns:minmax(260px,max-content);gap:6px;">'+
          '<span style="'+labelStyle+'margin-bottom:0;">Contas bancárias</span>'+
          '<div style="min-height:42px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:8px 12px;">'+contasHtml+'</div>'+
        '</div>'+
        (showCustom?'<div style="display:grid;grid-template-columns:repeat(2,minmax(160px,220px));gap:12px;margin-top:12px;">'+
          '<div><label style="'+labelStyle+'">Data inicial</label><input type="date" value="'+_esc(_movFiltro.inicio||'')+'" onchange="Modules.Financeiro._setMovFiltro(\'inicio\',this.value)" style="'+inputStyle+'"></div>'+
          '<div><label style="'+labelStyle+'">Data final</label><input type="date" value="'+_esc(_movFiltro.fim||'')+'" onchange="Modules.Financeiro._setMovFiltro(\'fim\',this.value)" style="'+inputStyle+'"></div>'+
        '</div>':'')+
        (_movSelecionadas.length?'<div style="margin-top:14px;padding:12px 14px;border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;"><span style="font-size:12px;color:#6F6860;font-weight:600;">'+_movSelecionadas.length+' entrada(s) selecionada(s)</span><div style="display:flex;gap:8px;flex-wrap:wrap;"><button onclick="Modules.Financeiro._openBulkEntradaModal()" style="border:none;background:#EEF4FF;color:#2563EB;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Alterar em massa</button><button onclick="Modules.Financeiro._bulkMovStatus(\'efetivado\')" style="border:none;background:#16A34A;color:#fff;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Marcar recebido</button><button onclick="Modules.Financeiro._bulkMovStatus(\'previsto\')" style="border:none;background:#3B82F6;color:#fff;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Marcar previsto</button><button onclick="Modules.Financeiro._bulkDeleteMov()" style="border:none;background:#FFF0EE;color:#C4362A;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Excluir</button><button onclick="Modules.Financeiro._clearMovSelection()" style="border:1px solid #EAE4DA;background:#fff;color:#6F6860;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Limpar seleção</button></div></div>':'')+
      '</section>'+
      (filtered.length===0
        ?'<section style="'+cardStyle+'text-align:center;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma entrada encontrada</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Ajuste os filtros ou cadastre uma nova entrada.</div></section>'
        :'<section style="display:flex;flex-direction:column;gap:10px;">'+
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Entradas cadastradas</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Gerencie recebimentos, parcelas e ações em massa.</div></div>'+
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
          '<div style="overflow:auto;">'+
            '<table style="width:100%;min-width:1060px;border-collapse:separate;border-spacing:0;table-layout:fixed;">'+
              '<colgroup><col style="width:34px;"><col style="width:130px;"><col style="width:25%;"><col style="width:22%;"><col style="width:14%;"><col style="width:14%;"><col style="width:96px;"><col style="width:128px;"><col style="width:190px;"></colgroup>'+
              '<thead><tr style="background:#fff;">'+
                '<th style="padding:12px 8px;text-align:center;width:34px;border-bottom:1px solid #EAE4DA;"><input type="checkbox" onchange="Modules.Financeiro._toggleMovTodas(this.checked)" '+(filtered.length&&filtered.every(function(m){ return _movSelecionadas.indexOf(m.id)>=0; })?'checked':'')+' style="accent-color:#B42318;"></th>'+
                '<th onclick="Modules.Financeiro._toggleMovOrdem()" style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;user-select:none;border-bottom:1px solid #EAE4DA;">Nº / Data '+(_movFiltro.ordem==='asc'?'↑':'↓')+'</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Descrição</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Cliente</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Forma</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Conta</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Status</th>'+
                '<th style="padding:12px 14px;text-align:right;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Valor</th>'+
                '<th style="padding:12px 6px;border-bottom:1px solid #EAE4DA;"></th>'+
              '</tr></thead><tbody>'+
              pageItems.map(function(m){
                var conta=_contasBancarias.find(function(c){ return c.id===m.conta_id; });
                var pessoa=m.pessoaNome||'';
                if(!pessoa&&m.pessoaId){
                  var list=m.pessoaTipo==='cliente'?_clientes:_fornecedores;
                  var p=list.find(function(x){ return x.id===m.pessoaId; });
                  pessoa=p?(p.name||p.nome||''):'';
                }
                var st=m.status||'efetivado';
                var info=_movValorInfo(m);
                var valorHtml=st==='parcial'
                  ?'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;line-height:1.15;"><div style="font-size:12px;font-weight:700;color:#16A34A;">Recebido: '+_fmtVal(info.valorRecebido)+'</div><div style="font-size:12px;font-weight:700;color:#B45309;">Pendente: '+_fmtVal(info.saldoRestante)+'</div></div>'
                  :('<div style="text-align:right;"><div style="font-size:14px;font-weight:800;color:#16A34A;">+ '+_fmtVal(info.displayValor)+'</div><div style="font-size:11px;color:#8A7E7C;margin-top:2px;">'+(st==='efetivado'?'Recebido':(m.parcelamento?'Parcela '+(m.parcelaNumero||'?')+'/'+(m.numeroParcelas||'?'):'A receber'))+'</div></div>');
                return '<tr style="cursor:pointer;transition:background .15s ease;" onclick="Modules.Financeiro._openMovDetalheModal(\''+m.id+'\')" onmouseover="this.style.background=\'#FAF8F4\'" onmouseout="this.style.background=\'transparent\'">'+
                  '<td style="padding:12px 8px;text-align:center;"><input type="checkbox" '+(_movSelecionadas.indexOf(m.id)>=0?'checked':'')+' onclick="event.stopPropagation();" onchange="Modules.Financeiro._toggleMovSelecionada(\''+m.id+'\',this.checked)" style="accent-color:#B42318;"></td>'+
                  '<td style="padding:12px 14px;font-size:13px;color:#6F6860;"><div style="font-weight:700;color:#1F1F1F;">'+_esc(m.numeroSequencial||'—')+'</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">'+_esc(_fmtDateDisplay(m.data))+'</div></td>'+
                  '<td style="padding:10px 14px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;">'+_esc(m.descricao||'—')+'</div>'+(m.numeroDocumento||m.numDocumento?'<div style="font-size:11px;color:#8A7E7C;margin-top:2px;overflow:hidden;text-overflow:ellipsis;">Doc: '+_esc(m.numeroDocumento||m.numDocumento)+'</div>':'')+'</td>'+
                  '<td style="padding:10px 14px;font-size:12px;color:#8A7E7C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(pessoa?_esc(pessoa):'—')+'</td>'+
                  '<td style="padding:10px 14px;font-size:12px;color:#8A7E7C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(m.forma_pagamento||'—')+'</td>'+
                  '<td style="padding:10px 14px;font-size:12px;color:#8A7E7C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(conta?conta.nome:'—')+'</td>'+
                  '<td style="padding:10px 14px;">'+_badgeEntradaStatus(st)+'</td>'+
                  '<td style="padding:10px 14px;text-align:right;">'+valorHtml+'</td>'+
                  '<td style="padding:10px 6px;text-align:right;white-space:nowrap;">'+
                    (st==='previsto'?'<button onclick="event.stopPropagation();Modules.Financeiro._openEfetivarEntradasModal(\''+m.id+'\')" style="padding:6px 10px;border-radius:8px;border:none;background:#16A34A;color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;margin-right:4px;">Confirmar recebimento</button>':'')+
                    (st==='efetivado'?'':'<button onclick="event.stopPropagation();Modules.Financeiro._openMovModal(\''+m.id+'\')" style="padding:6px 10px;border-radius:8px;border:none;background:#EEF4FF;color:#3B82F6;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;margin-right:4px;">Editar</button>')+
                    '<button onclick="event.stopPropagation();Modules.Financeiro._deleteMov(\''+m.id+'\')" style="padding:6px 10px;border-radius:8px;border:none;background:#FFF0EE;color:#C4362A;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;">Excluir</button>'+
                  '</td></tr>';
              }).join('')+
              '</tbody></table></div>'+paginationHtml+'</div></section>')+
      '</div>';
  }

  function _setMovFiltro(key,val){
    _movFiltro[key]=val;
    _movView.page=1;
    if(key==='periodo'&&val==='custom'){
      _movFiltro.inicio=_movFiltro.inicio||_today();
      _movFiltro.fim=_movFiltro.fim||_today();
    }
    _paintMovimentacoes();
    if(key==='busca'){
      setTimeout(function(){
        var el=document.getElementById('mov-busca');
        if(el){ el.focus(); if(el.setSelectionRange) el.setSelectionRange(el.value.length,el.value.length); }
      },0);
    }
  }

  function _toggleMovConta(id,checked){
    var contas=(_movFiltro.contas||[]).slice();
    if(checked&&contas.indexOf(id)<0) contas.push(id);
    if(!checked) contas=contas.filter(function(x){ return x!==id; });
    _movFiltro.contas=contas;
    _movView.page=1;
    _paintMovimentacoes();
  }

  function _toggleMovSelecionada(id,checked){
    if(checked&&_movSelecionadas.indexOf(id)<0) _movSelecionadas.push(id);
    if(!checked) _movSelecionadas=_movSelecionadas.filter(function(x){ return x!==id; });
    _paintMovimentacoes();
  }

  function _toggleMovTodas(checked){
    _movSelecionadas=checked?_movVisiveis.slice():[];
    _paintMovimentacoes();
  }

  function _toggleMovOrdem(){
    _movFiltro.ordem=_movFiltro.ordem==='asc'?'desc':'asc';
    _movView.page=1;
    _paintMovimentacoes();
  }

  function _setMovPage(page){
    var next=parseInt(page,10);
    if(!isFinite(next)) return;
    _movView.page=Math.max(1,next);
    _paintMovimentacoes();
  }

  function _setMovPageSize(value){
    var size=parseInt(value,10);
    if(!isFinite(size)||size<=0) return;
    _movView.pageSize=size;
    _movView.page=1;
    _paintMovimentacoes();
  }

  function _openMovDetalheModal(id) {
    var m=_movimentacoes.find(function(x){ return x.id===id; });
    if(!m) return;
    var conta=_contasBancarias.find(function(c){ return c.id===m.conta_id; });
    var pessoa=m.pessoaNome||'';
    if(!pessoa&&m.pessoaId){
      var list=m.pessoaTipo==='cliente'?_clientes:_fornecedores;
      var p=list.find(function(x){ return x.id===m.pessoaId; });
      pessoa=p?(p.name||p.nome||''):'';
    }
    var st=m.status||'efetivado';
    var statusInfo=st==='previsto'
      ? {label:'Ainda não recebido',bg:'#EFF6FF',fg:'#2563EB'}
      : st==='parcial'
        ? {label:'Recebido parcialmente',bg:'#FEF9C3',fg:'#B45309'}
        : {label:'Já recebido',bg:'#DCFCE7',fg:'#16A34A'};
    var cardStyle=_modalCardStyle();
    var detailItem=function(label,value,wide){
      return '<div style="'+(wide?'grid-column:1/-1;':'')+'min-width:0;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:10px 11px;">'+
        '<div style="font-size:10.5px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;">'+_esc(label)+'</div>'+
        '<div style="font-size:13.5px;font-weight:500;color:#1F1F1F;line-height:1.35;word-break:break-word;">'+(value||'--')+'</div>'+
      '</div>';
    };
    var tipoLabel=m.parcelamento?'Parcelada':(m.recorrencia?'Recorrente':'Entrada única');
    var info=_movValorInfo(m);
    var totalValor=_fmtVal(info.valorTotalOriginal);
    var hasRecorrencia=!!m.recorrencia;
    var hasParcelamento=!!m.parcelamento;
    var pendente=st==='parcial'?info.saldoRestante:0;
    var recebido=st==='parcial'?info.valorRecebido:(st==='efetivado'?info.valorRecebido:0);
    var parcelaAtual=(m.parcelamento&&m.parcelamento.parcelaAtual)||m.parcelaNumero||'';
    var totalParcelas=(m.parcelamento&&m.parcelamento.parcelas)||m.numeroParcelas||'';
    var infoCards=[];
    if(info.valorTotalOriginal){
      infoCards.push(detailItem('Valor total original',_fmtVal(info.valorTotalOriginal)));
    }
    if(info.valorParcela && (hasParcelamento || hasRecorrencia)){
      infoCards.push(detailItem('Valor da parcela',_fmtVal(info.valorParcela)));
    }
    if(hasRecorrencia){
      infoCards.push(detailItem('Recorrência',_esc((m.recorrencia.frequencia||'')+(m.recorrencia.data_fim?' até '+_fmtDateDisplay(m.recorrencia.data_fim):''))));
    }
    if(hasParcelamento && (parcelaAtual || totalParcelas)){
      infoCards.push(detailItem('Parcelamento',_esc('Parcela '+(parcelaAtual||'?')+' de '+(totalParcelas||'?'))));
    }
    if(m.parcelamento && m.parcelamento.proxima_data){
      infoCards.push(detailItem('Próxima',_esc(_fmtDateDisplay(m.parcelamento.proxima_data))));
    }
    if(st==='parcial'){
      infoCards.push(detailItem('Valor recebido','<span style="color:#1F6F43;">'+_fmtVal(recebido)+'</span>'));
      infoCards.push(detailItem('Saldo pendente','<span style="color:#B45309;">'+_fmtVal(pendente)+'</span>'));
    }
    if(st==='efetivado' && recebido){
      infoCards.push(detailItem('Valor recebido','<span style="color:#1F6F43;">'+_fmtVal(recebido)+'</span>'));
    }
    var body=
      '<div style="display:flex;flex-direction:column;gap:14px;">'+
        '<div style="'+cardStyle+'">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">'+
            '<div style="min-width:0;">'+
              '<div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;"><span class="mi" style="font-size:18px;color:#6F6860;">receipt_long</span><div style="font-size:13px;font-weight:650;color:#1F1F1F;">Resumo da entrada</div></div>'+
              '<div style="font-size:clamp(25px,4vw,34px);line-height:1;font-weight:650;color:#1F1F1F;letter-spacing:0;">'+totalValor+'</div>'+
              '<div style="margin-top:8px;font-size:13px;color:#6F6860;line-height:1.4;">'+
                (st==='parcial'
                  ? _esc(_fmtVal(recebido)+' recebidos · '+_fmtVal(pendente)+' pendentes')
                  : _esc(tipoLabel))+
              '</div>'+
            '</div>'+
            '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">'+
              '<span style="background:'+statusInfo.bg+';color:'+statusInfo.fg+';padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;">'+statusInfo.label+'</span>'+
              '<span style="background:#FFFCF8;border:1px solid #E8DCD7;color:#6F6860;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;">'+_esc(tipoLabel)+'</span>'+
            '</div>'+
          '</div>'+
        '</div>'+

        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">'+
          '<div style="'+cardStyle+'">'+
            _modalIconTitle('badge','Identificação','Dados usados para localizar esta entrada no financeiro.')+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'+
              detailItem('Número interno',_esc(m.numeroSequencial||'--'))+
              detailItem('Documento',_esc(m.numeroDocumento||m.numDocumento||'--'))+
              detailItem('Data',_esc(_fmtDateDisplay(m.data)))+
              detailItem('Tipo',_esc(tipoLabel))+
            '</div>'+
          '</div>'+
          '<div style="'+cardStyle+'">'+
            _modalIconTitle('payments','Recebimento','Cliente, forma de pagamento e conta onde o valor entra.')+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'+
              detailItem('Quem pagou',_esc(pessoa||'--'),true)+
              detailItem('Categoria',_esc(m.categoria||'--'))+
              detailItem('Forma',_esc(m.forma_pagamento||'--'))+
              detailItem('Conta de destino',_esc(conta?conta.nome:'--'),true)+
            '</div>'+
          '</div>'+
        '</div>'+
        (infoCards.length
          ? '<div style="'+cardStyle+'">'+_modalIconTitle('calendar_month','Informações adicionais','Valores, parcelas e recorrências ligados a esta entrada.')+'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">'+infoCards.join('')+'</div></div>'
          : '')+
        (m.observacoes && String(m.observacoes).trim()
          ? '<div style="'+cardStyle+'">'+_modalIconTitle('notes','Observações','Anotações internas registradas nesta entrada.')+'<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:12px;font-size:13.5px;line-height:1.5;color:#1F1F1F;white-space:pre-wrap;word-break:break-word;">'+_esc(m.observacoes)+'</div></div>'
          : '')+
      '</div>';
    var footer='<div style="display:flex;flex-direction:column;gap:8px;">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">'+
      (st==='parcial'
        ? '<button onclick="Modules.Financeiro._closeMovDetalhe();Modules.Financeiro._openEfetivarEntradasModal(\''+m.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:none;background:#1F8F56;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(31,143,86,.16);">Receber restante</button>'
        : (st==='previsto'
          ? '<button onclick="Modules.Financeiro._closeMovDetalhe();Modules.Financeiro._openEfetivarEntradasModal(\''+m.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:none;background:#1F8F56;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(31,143,86,.16);">Marcar como recebido</button>'
          : ''))+
      (st!=='efetivado'
        ? '<button onclick="Modules.Financeiro._closeMovDetalhe();Modules.Financeiro._openMovModal(\''+m.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Editar</button>'
        : '')+
      '<button onclick="Modules.Financeiro._deleteMov(\''+m.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:none;background:#FFF0EE;color:#B42318;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Excluir</button>'+
      '<button onclick="Modules.Financeiro._closeMovDetalhe();" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Fechar</button>'+
      '</div>'+
    '</div>';
    window._movDetalheModal=UI.modal({title:'Detalhes da entrada',body:body,footer:footer,maxWidth:'820px'});
  }

  function _closeMovDetalhe() {
    if(window._movDetalheModal) window._movDetalheModal.close();
  }

  function _pessoaLabel(item) {
    return item ? (item.name || item.nome || 'Sem nome') : '';
  }

  function _pessoaList(tipo) {
    return tipo==='entrada' ? (_clientes||[]) : (_fornecedores||[]);
  }

  function _financePessoaSearch(scope,q) {
    var isMov=scope==='mov';
    var dd=document.getElementById(isMov?'mov-pessoa-dropdown':'cp-forn-dropdown');
    var hidden=document.getElementById(isMov?'mov-pessoa-id':'cp-forn-id');
    if(hidden) hidden.value='';
    if(!dd) return;
    var list=isMov?_pessoaList('entrada'):(_fornecedores||[]);
    var norm=_normSearch(q);
    var filtered=norm?list.filter(function(p){
      var hay=_normSearch([p.name,p.nome,p.contact,p.contato,p.nif,p.phone,p.whatsapp,p.email,p.state,p.estado].join(' '));
      return hay.indexOf(norm)>=0;
    }):list.slice();
    filtered=filtered.slice().sort(function(a,b){ return _pessoaLabel(a).localeCompare(_pessoaLabel(b)); });
    var emptyLabel=isMov?'Nenhum cliente encontrado.':'Nenhum fornecedor encontrado.';
    var noneLabel=isMov?'Sem cliente':'Sem fornecedor';
    var target=isMov?'Modules.Financeiro._financePessoaSelect(\'mov\',':'Modules.Financeiro._financePessoaSelect(\'cp\',';
    var items='<div onmousedown="'+target+'\'\')" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #F2EDED;font-size:13px;font-family:inherit;" onmouseover="this.style.background=\'#FFF5F5\'" onmouseout="this.style.background=\'\'"><div style="color:#8A7E7C;font-style:italic;">'+noneLabel+'</div></div>';
    if(!filtered.length){
      dd.innerHTML=items+'<div style="padding:10px 14px;color:#8A7E7C;font-size:13px;font-family:inherit;">'+emptyLabel+'</div>';
      dd.style.display='block';
      return;
    }
    items+=filtered.slice(0,60).map(function(p){
      var label=_pessoaLabel(p)||'—';
      var sub=[p.contact||p.contato,p.email,p.state||p.estado].filter(Boolean).map(_esc).join(' · ');
      return '<div onmousedown="'+target+'\''+p.id+'\')" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #F2EDED;font-size:13px;font-family:inherit;" onmouseover="this.style.background=\'#FFF5F5\'" onmouseout="this.style.background=\'\'">'+
        '<div style="font-weight:500;color:#1A1A1A;">'+_esc(label)+'</div>'+
        (sub?'<div style="font-size:11px;color:#8A7E7C;margin-top:2px;">'+sub+'</div>':'')+
      '</div>';
    }).join('');
    dd.innerHTML=items;
    dd.style.display='block';
  }

  function _financePessoaSelect(scope,id) {
    var isMov=scope==='mov';
    var list=isMov?_pessoaList('entrada'):(_fornecedores||[]);
    var item=id?list.find(function(p){ return p.id===id; }):null;
    var display=document.getElementById(isMov?'mov-pessoa-novo':'cp-forn-novo');
    var hidden=document.getElementById(isMov?'mov-pessoa-id':'cp-forn-id');
    var dd=document.getElementById(isMov?'mov-pessoa-dropdown':'cp-forn-dropdown');
    if(hidden) hidden.value=id||'';
    if(display) display.value=item?_pessoaLabel(item):'';
    if(dd) dd.style.display='none';
    if(!isMov) _renderCPPreviews();
  }

  function _renderMovPessoaField(tipo, selectedId, selectedName) {
    var box=document.getElementById('mov-pessoa-box');
    if(!box) return;
    var isEntrada=tipo==='entrada';
    var list=_pessoaList(tipo).slice().sort(function(a,b){ return _pessoaLabel(a).localeCompare(_pessoaLabel(b)); });
    var selected=list.find(function(p){ return p.id===selectedId; });
    box.innerHTML=
      '<div style="position:relative;">'+
      '<label style="'+_lbl()+'">'+(isEntrada?'Cliente':'Fornecedor')+'</label>'+
      '<input id="mov-pessoa-novo" type="text" value="'+_esc(selected?_pessoaLabel(selected):(selectedName||''))+'" placeholder="'+(isEntrada?'Buscar cliente...':'Buscar fornecedor...')+'" autocomplete="off" oninput="Modules.Financeiro._financePessoaSearch(\'mov\',this.value)" onfocus="Modules.Financeiro._financePessoaSearch(\'mov\',this.value)" onblur="setTimeout(function(){var d=document.getElementById(\'mov-pessoa-dropdown\');if(d)d.style.display=\'none\';},200)" style="'+_modalFieldStyle()+'">'+
      '<input id="mov-pessoa-id" type="hidden" value="'+_esc(selectedId||'')+'">'+
      '<div id="mov-pessoa-dropdown" style="display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #E8DCD7;border-radius:12px;max-height:220px;overflow-y:auto;z-index:9999;box-shadow:0 14px 34px rgba(31,31,31,.12);"></div>'+
      '</div>'+
      '<div style="font-size:11px;color:#8A7E7C;margin-top:5px;">'+(isEntrada?'Quem pagou essa entrada.':'Para quem você está pagando.')+'</div>';
  }

  function _openMovModal(id,tipoPreset) {
    _editingId=id;
    var m=id?(_movimentacoes.find(function(x){ return x.id===id; })||{}): {};
    var tipo='entrada';
    var cats=_catsByTipo(tipo);
    var catOpts='<option value="">Selecionar categoria...</option>'+cats.map(function(c){ return '<option value="'+_esc(c)+'"'+(m.categoria===c?' selected':'')+'>'+_esc(c)+'</option>'; }).join('')+'<option value="__nova__">+ Nova categoria</option>';
    var fOpts=_formaOptions(m.forma_pagamento||'');
    var statusSel=(m.status==='efetivado' || m.status==='previsto') ? m.status : '';
    var rec=!!m.recorrencia;
    var parc=!!m.parcelamento;
    var recFreq=(m.recorrencia&&m.recorrencia.frequencia)||'mensal';
    var recReps=(m.recorrencia&&m.recorrencia.repeticoes)||'';
    var recDataIni=(m.recorrencia&&m.recorrencia.data_inicial)||m.data||_today();
    var parcelas=(m.parcelamento&&m.parcelamento.parcelas)||'';
    var primeiraParcela=(m.parcelamento&&m.parcelamento.primeira_data)||m.data||_today();
    var valorParcela=parcelas?_fmtVal((_parseNum(m.valor)||0)/_parseNum(parcelas)):'';
    var numeroPreview=id?(m.numeroSequencial||''):('EN-'+String((parseInt(_configFin.entradaSeq||0,10)||0)+1).padStart(6,'0'));
    var cardStyle=_modalCardStyle();
    var fieldStyle=_modalFieldStyle();
    var selectStyle=_modalSelectStyle();
    var shortField=_modalFieldStyle('max-width:160px;');
    var docField=_modalFieldStyle('max-width:220px;');
    var dateField=_modalFieldStyle('max-width:168px;');
    var statusOptionStyle='display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;min-height:34px;';
    var cleanCheckboxStyle='display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;min-height:32px;';
    var body=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
        '<div style="'+cardStyle+'">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">'+
            _modalIconTitle('receipt_long','Dados principais','Organize de onde vem o valor, quando ele entra e como deve aparecer no caixa.').replace('margin-bottom:14px;','margin-bottom:0;')+
            '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FFFCF8;border:1px solid #E8DCD7;color:#6F6860;font-size:12px;font-weight:600;white-space:nowrap;">'+_esc(numeroPreview||'Automático')+'</span>'+
          '</div>'+
          '<div style="display:flex;flex-direction:column;gap:12px;">'+
            '<div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">'+
              '<div style="flex:0 0 160px;max-width:160px;"><label style="'+_lbl()+'">Número interno</label><input id="mov-numero" type="text" value="'+_esc(numeroPreview||'Automático')+'" readonly style="'+shortField+'background:#F7F2EF;color:#5A4E4C;font-weight:600;"></div>'+
              '<div style="flex:0 1 220px;max-width:220px;"><label style="'+_lbl()+'">Número do documento</label><input id="mov-doc" type="text" value="'+_esc(m.numeroDocumento||m.numDocumento||'')+'" placeholder="Recibo, referência..." style="'+docField+'"></div>'+
            '</div>'+
            '<div><label style="'+_lbl()+'">Descrição / observação *</label><input id="mov-desc" type="text" value="'+_esc(m.descricao||'')+'" placeholder="Ex: venda no cardápio, recebimento de encomenda..." style="'+fieldStyle+'"></div>'+
            '<div style="display:flex;gap:12px;align-items:start;flex-wrap:wrap;">'+
              '<div style="flex:0 0 170px;max-width:170px;"><label style="'+_lbl()+'">Valor total *</label><input id="mov-valor" type="text" value="'+_esc(m.valor||'')+'" oninput="Modules.Financeiro._renderMovPreviews()" placeholder="€ 0,00" style="'+shortField+'"></div>'+
              '<div id="mov-pessoa-box" style="flex:1 1 260px;min-width:240px;"></div>'+
            '</div>'+
            '<div style="display:flex;gap:12px;align-items:start;flex-wrap:wrap;">'+
              '<div style="flex:1 1 220px;max-width:300px;"><label style="'+_lbl()+'">Categoria de entrada *</label><select id="mov-cat" onchange="Modules.Financeiro._toggleMovNovaCat()" style="'+selectStyle+'">'+catOpts+'</select><input id="mov-cat-nova" type="text" placeholder="Nome da nova categoria..." style="'+fieldStyle+'display:none;margin-top:8px;"></div>'+
              '<div style="flex:1 1 190px;max-width:260px;"><label style="'+_lbl()+'">Forma de pagamento *</label><select id="mov-forma" onchange="Modules.Financeiro._applyFormaPadraoConta(\'mov\')" style="'+selectStyle+'">'+fOpts+'</select></div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="'+cardStyle+'">'+
          '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(220px,.9fr);gap:14px;align-items:start;">'+
            '<div>'+
              _modalIconTitle('task_alt','Status da entrada','Defina se o valor ainda será recebido ou se já entrou no caixa.')+
              '<input type="hidden" id="mov-status" value="'+_esc(statusSel)+'">'+
              '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">'+
                '<label style="'+statusOptionStyle+'"><input type="radio" name="mov-status-radio" value="previsto" '+(statusSel==='previsto'?'checked':'')+' onchange="Modules.Financeiro._selectMovStatus(\'previsto\')" style="accent-color:#B42318;width:16px;height:16px;"> A receber</label>'+
                '<label style="'+statusOptionStyle+'"><input type="radio" name="mov-status-radio" value="efetivado" '+(statusSel==='efetivado'?'checked':'')+' onchange="Modules.Financeiro._selectMovStatus(\'efetivado\')" style="accent-color:#B42318;width:16px;height:16px;"> Já recebido</label>'+
              '</div>'+
              '<div id="mov-status-help" style="margin-top:8px;font-size:11px;color:#8A7E7C;">Escolha o status da entrada antes de salvar.</div>'+
            '</div>'+
            '<div>'+
              _modalIconTitle('event','Datas e conta','Quando receber e para qual conta o valor entra.')+
              '<div style="display:flex;flex-direction:column;gap:12px;">'+
                '<div id="mov-data-box"><label id="mov-data-label" style="'+_lbl()+'">'+(statusSel==='efetivado'?'Data de recebimento':'Data prevista')+' *</label><input id="mov-data" type="date" value="'+_esc(m.data||_today())+'" style="'+dateField+'"><div id="mov-data-help" style="font-size:11px;color:#8A7E7C;margin-top:5px;">'+(statusSel==='efetivado'?'Quando o valor entrou no caixa.':'Quando você espera receber.')+'</div></div>'+
                '<div><label style="'+_lbl()+'">Conta bancária *</label><select id="mov-conta" required style="'+selectStyle+'max-width:260px;"><option value="">Para onde entrou o dinheiro</option>'+_contasBancarias.filter(function(c){ return c.ativo!==false || c.id===m.conta_id; }).map(function(c){ return '<option value="'+c.id+'"'+(m.conta_id===c.id?' selected':'')+'>'+_esc(c.nome)+'</option>'; }).join('')+'</select></div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div id="mov-tipo-box" style="'+cardStyle+'">'+
          _modalIconTitle('calendar_month','Recorrência e parcelamento','Use quando o recebimento precisa aparecer em mais de uma data.')+
          '<div style="display:flex;flex-direction:column;gap:10px;">'+
            '<label style="'+cleanCheckboxStyle+'"><input type="checkbox" id="mov-recorrente"'+(rec?' checked':'')+' onchange="Modules.Financeiro._toggleMovRecorrente()" style="accent-color:#B42318;width:16px;height:16px;"> Pagamento recorrente</label>'+
            '<div id="mov-rec-box" style="display:'+(rec?'block':'none')+';">'+
              '<div style="display:grid;grid-template-columns:minmax(150px,180px) minmax(150px,180px) minmax(0,1fr);gap:12px;margin-bottom:12px;align-items:end;">'+
                '<div><label style="'+_lbl()+'">Frequência</label><select id="mov-rec-freq" onchange="Modules.Financeiro._renderMovPreviews()" style="'+selectStyle+'">'+
                  '<option value="semanal"'+(recFreq==='semanal'?' selected':'')+'>Semanal</option>'+
                  '<option value="mensal"'+(recFreq==='mensal'?' selected':'')+'>Mensal</option>'+
                  '<option value="anual"'+(recFreq==='anual'?' selected':'')+'>Anual</option>'+
                '</select></div>'+
                '<div><label style="'+_lbl()+'">Repetições *</label><input id="mov-rec-reps" type="number" min="1" value="'+_esc(recReps)+'" placeholder="Ex: 6" oninput="Modules.Financeiro._renderMovPreviews()" style="'+shortField+'"></div>'+
              '</div>'+
              '<div id="mov-rec-preview" style="margin-top:10px;"></div>'+
            '</div>'+
            '<label style="'+cleanCheckboxStyle+'"><input type="checkbox" id="mov-parcelado"'+(parc?' checked':'')+' onchange="Modules.Financeiro._toggleMovParcelado()" style="accent-color:#B42318;width:16px;height:16px;"> Dividir em parcelas</label>'+
            '<div id="mov-parc-box" style="display:'+(parc?'block':'none')+';">'+
              '<div style="display:grid;grid-template-columns:minmax(150px,180px) minmax(150px,180px) minmax(0,1fr);gap:12px;margin-bottom:12px;align-items:end;">'+
                '<div><label style="'+_lbl()+'">Parcelas *</label><input id="mov-parc-qtd" type="number" min="2" value="'+_esc(parcelas)+'" placeholder="Ex: 3" oninput="Modules.Financeiro._renderMovPreviews()" style="'+shortField+'"></div>'+
                '<div><label style="'+_lbl()+'">Valor por parcela</label><input id="mov-parc-valor" type="text" value="'+_esc(valorParcela)+'" readonly style="'+shortField+'background:#F7F2EF;"></div>'+
              '</div>'+
              '<div id="mov-parc-preview" style="margin-top:10px;"></div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="'+cardStyle+'">'+
          _modalIconTitle('description','Comprovante e observações','Guarde uma referência do recebimento e anotações úteis para consulta.')+
          '<div style="display:grid;grid-template-columns:minmax(220px,280px) minmax(0,1fr);gap:12px;align-items:start;">'+
            '<div><label style="'+_lbl()+'">Comprovante / fatura</label><input id="mov-anexo" type="file" style="'+_modalFieldStyle('height:auto;min-height:42px;padding:8px;background:#FFFCF8;')+'"><div style="font-size:11px;color:#8A7E7C;margin-top:5px;">O nome do arquivo fica preparado no cadastro.</div></div>'+
            '<div><label style="'+_lbl()+'">Observações</label><textarea id="mov-obs" placeholder="Opcional..." style="'+_modalFieldStyle('height:auto;min-height:82px;padding:10px 12px;resize:vertical;')+'">'+_esc(m.observacoes||'')+'</textarea></div>'+
          '</div>'+
        '</div>'+
      '</div>';
    var footer=
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;width:100%;">'+
        '<div style="font-size:11px;color:#7A746B;">Revise os dados antes de salvar.</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">'+
          '<button onclick="if(window._movModal)window._movModal.close()" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>'+
          '<button id="mov-save-btn" onclick="Modules.Financeiro._saveMov()" style="height:42px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">'+(id?'Salvar alterações':'Salvar entrada')+'</button>'+
        '</div>'+
      '</div>';
    window._movModal=UI.modal({title:id?'Editar Entrada':'Nova Entrada',body:body,footer:footer,maxWidth:'820px'});
    setTimeout(function(){
      _renderMovPessoaField(tipo,m.pessoaId||'',m.pessoaNome||'');
      _selectMovStatus(statusSel||'');
      _toggleMovRecorrente();
      _toggleMovParcelado();
      _renderMovPreviews();
    },0);
  }

  function _setMovTipo(tipo) {
    var t=document.getElementById('mov-tipo'); if(t) t.value=tipo;
    var desc=document.getElementById('mov-desc');
    if(desc) desc.placeholder=tipo==='entrada'?'Ex: Venda, recebimento...':'Ex: Aluguel, fornecedor, compra...';
    var save=document.getElementById('mov-save-btn');
    if(save) save.style.background=tipo==='entrada'?'#16A34A':'#DC2626';
    _renderMovPessoaField(tipo,'');
    ['entrada','saida'].forEach(function(k){
      var btn=document.getElementById('mov-btn-'+k); if(!btn) return;
      var a=tipo===k; var col=k==='entrada'?'#16A34A':'#DC2626'; var bg=k==='entrada'?'#DCFCE7':'#FEE2E2';
      btn.style.border='2px solid '+(a?col:'#D4C8C6'); btn.style.background=a?bg:'#fff'; btn.style.color=a?col:'#8A7E7C';
    });
  }

  function _selectMovStatus(status) {
    var input=document.getElementById('mov-status'); if(input) input.value=status;
    var help=document.getElementById('mov-status-help');
    var label=document.getElementById('mov-data-label');
    var dataHelp=document.getElementById('mov-data-help');
    var tipoBox=document.getElementById('mov-tipo-box');
    var rec=document.getElementById('mov-recorrente');
    var parc=document.getElementById('mov-parcelado');
    var recBox=document.getElementById('mov-rec-box');
    var parcBox=document.getElementById('mov-parc-box');
    if(help) help.textContent=status==='efetivado'
      ? 'Já recebeu este valor. A data de recebimento é obrigatória.'
      : 'Você ainda vai receber este valor. A data prevista é obrigatória.';
    if(label) label.textContent=(status==='efetivado'?'Data de recebimento':'Data prevista')+' *';
    if(dataHelp) dataHelp.textContent=status==='efetivado'
      ? 'Quando o valor entrou no caixa.'
      : 'Quando você espera receber.';
    if(tipoBox) tipoBox.style.display=status==='efetivado'?'none':'block';
    if(status==='efetivado'){
      if(rec) rec.checked=false;
      if(parc) parc.checked=false;
      if(recBox) recBox.style.display='none';
      if(parcBox) parcBox.style.display='none';
    } else {
      if(recBox) recBox.style.display=rec&&rec.checked?'block':'none';
      if(parcBox) parcBox.style.display=parc&&parc.checked?'block':'none';
    }
  }

  function _toggleMovNovaCat() {
    var sel=document.getElementById('mov-cat');
    var inp=document.getElementById('mov-cat-nova');
    if(inp) inp.style.display=(sel&&sel.value==='__nova__')?'block':'none';
  }

  function _toggleMovNovaPessoa() {
    var sel=document.getElementById('mov-pessoa-id');
    var inp=document.getElementById('mov-pessoa-novo');
    if(inp) inp.style.display=(sel&&sel.value==='__novo__')?'block':'none';
  }

  function _toggleMovRecorrente() {
    var checked=!!(document.getElementById('mov-recorrente')||{}).checked;
    var box=document.getElementById('mov-rec-box');
    var parc=document.getElementById('mov-parcelado');
    var parcBox=document.getElementById('mov-parc-box');
    if(checked && parc) parc.checked=false;
    if(checked && parcBox) parcBox.style.display='none';
    if(box) box.style.display=checked?'block':'none';
    _renderMovPreviews();
  }

  function _toggleMovParcelado() {
    var box=document.getElementById('mov-parc-box');
    var checked=!!(document.getElementById('mov-parcelado')||{}).checked;
    if(box) box.style.display=checked?'block':'none';
    var rec=document.getElementById('mov-recorrente');
    var recBox=document.getElementById('mov-rec-box');
    if(checked && rec) rec.checked=false;
    if(checked && recBox) recBox.style.display='none';
    _renderMovPreviews();
  }

  function _calcMovParcela() {
    var qtd=_parseNum((document.getElementById('mov-parc-qtd')||{}).value);
    var valor=_parseNum((document.getElementById('mov-valor')||{}).value);
    var out=document.getElementById('mov-parc-valor');
    if(out) out.value=(qtd>0&&valor>0)?_fmtVal(valor/qtd):'';
    _renderMovPreviews();
  }

  function _movPreviewCard(title, items) {
    return '<div style="background:#FAFAF9;border:1px solid #EDE7E4;border-radius:12px;padding:10px 12px;">'+
      '<div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:8px;">'+_esc(title)+'</div>'+
      (items.length
        ? '<div style="display:flex;flex-direction:column;gap:6px;">'+items.join('')+'</div>'
        : '<div style="font-size:12px;color:#8A7E7C;">Preencha os campos para ver o preview.</div>')+
    '</div>';
  }

  function _renderMovPreviews() {
    var recBox=document.getElementById('mov-rec-preview');
    var parcBox=document.getElementById('mov-parc-preview');
    var rec=!!(document.getElementById('mov-recorrente')||{}).checked;
    var parc=!!(document.getElementById('mov-parcelado')||{}).checked;
    if(recBox){
      if(!rec){ recBox.innerHTML=''; recBox.style.display='none'; }
      else {
        recBox.style.display='block';
        var inicio=(document.getElementById('mov-data')||{}).value||'';
        var reps=_parseNum((document.getElementById('mov-rec-reps')||{}).value);
        var freq=(document.getElementById('mov-rec-freq')||{}).value||'mensal';
        var itens=[];
        if(inicio&&reps>0){
          for(var i=0;i<Math.min(reps,8);i++){
            itens.push('<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#374151;"><span>'+_esc('Recorrência '+(i+1))+'</span><strong style="font-weight:700;">'+_esc(_fmtDateDisplay(_addPeriodo(inicio,freq,i)))+'</strong></div>');
          }
          if(reps>8) itens.push('<div style="font-size:11px;color:#8A7E7C;">... e mais '+(reps-8)+' ocorrências</div>');
        }
        recBox.innerHTML=_movPreviewCard('Recorrências a criar', itens);
      }
    }
    if(parcBox){
      if(!parc){ parcBox.innerHTML=''; parcBox.style.display='none'; }
      else {
        parcBox.style.display='block';
        var total=_parseNum((document.getElementById('mov-valor')||{}).value);
        var n=_parseNum((document.getElementById('mov-parc-qtd')||{}).value);
        var primeira=(document.getElementById('mov-data')||{}).value||'';
        var outParcela=document.getElementById('mov-parc-valor');
        var itensP=[];
        if(total>0&&n>1&&primeira){
          var valorParcela=total/n;
          if(outParcela) outParcela.value=_fmtVal(valorParcela);
          for(var j=0;j<Math.min(n,8);j++){
            var val=j===n-1?+(total-(valorParcela*(n-1))).toFixed(2):+valorParcela.toFixed(2);
            itensP.push('<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#374151;"><span>'+_esc('Parcela '+(j+1)+' de '+n)+'</span><strong style="font-weight:700;">'+_esc(_fmtVal(val))+' · '+_esc(_fmtDateDisplay(_addPeriodo(primeira,'mensal',j)))+'</strong></div>');
          }
          if(n>8) itensP.push('<div style="font-size:11px;color:#8A7E7C;">... e mais '+(n-8)+' parcelas</div>');
        }
        if(outParcela && !(total>0&&n>1)) outParcela.value='';
        parcBox.innerHTML=_movPreviewCard('Parcelas a criar', itensP);
      }
    }
  }

  function _saveMov() {
    var isNewMov=!_editingId;
    var desc=((document.getElementById('mov-desc')||{}).value||'').trim();
    var valor=_parseNum((document.getElementById('mov-valor')||{}).value);
    var contaId=(document.getElementById('mov-conta')||{}).value||'';
    var status=(document.getElementById('mov-status')||{}).value||'';
    var cat=(document.getElementById('mov-cat')||{}).value||'';
    var novaCat=((document.getElementById('mov-cat-nova')||{}).value||'').trim();
    var forma=(document.getElementById('mov-forma')||{}).value||'';
    var numeroAtual=((document.getElementById('mov-numero')||{}).value||'').trim();
    var numeroDoc=((document.getElementById('mov-doc')||{}).value||'').trim();
    if(!desc){ UI.toast('Descrição obrigatória','error'); return; }
    if(valor<=0){ UI.toast('Valor deve ser maior que zero','error'); return; }
    var formaCfgMov=_formasPagFull(true).find(function(f){ return (f.nome||'')===forma; });
    if(!contaId&&formaCfgMov&&formaCfgMov.contaPadraoId) contaId=formaCfgMov.contaPadraoId;
    if(!contaId){ UI.toast('Conta bancária obrigatória','error'); return; }
    if(!status){ UI.toast('Escolha se a entrada já foi recebida ou ainda será recebida','error'); return; }
    if(!cat){ UI.toast('Categoria de entrada obrigatória','error'); return; }
    if(cat==='__nova__'&&!novaCat){ UI.toast('Informe o nome da nova categoria','error'); return; }
    if(!forma){ UI.toast('Forma de pagamento obrigatória','error'); return; }
    var dataBase=(document.getElementById('mov-data')||{}).value||'';
    if(!dataBase){ UI.toast('Informe a data da entrada','error'); return; }
    var rec=!!(document.getElementById('mov-recorrente')||{}).checked;
    var recFreq=(document.getElementById('mov-rec-freq')||{}).value||'mensal';
    var recReps=_parseNum((document.getElementById('mov-rec-reps')||{}).value);
    var parcelado=!!(document.getElementById('mov-parcelado')||{}).checked;
    var parcelas=_parseNum((document.getElementById('mov-parc-qtd')||{}).value);
    var primeiraParcela=(document.getElementById('mov-data')||{}).value||'';
    if(rec&&parcelado){ UI.toast('Escolha recorrente ou parcelado, não os dois','error'); return; }
    if(rec&&recReps<1){ UI.toast('Informe o número de repetições','error'); return; }
    if(parcelado&&!_editingId&&(parcelas<2||!primeiraParcela)){ UI.toast('Preencha os dados do parcelamento','error'); return; }
    var anexoEl=document.getElementById('mov-anexo');
    var anexoNome=(anexoEl&&anexoEl.files&&anexoEl.files[0])?anexoEl.files[0].name:'';
    var tipoMov='entrada';
    var pessoaTexto=((document.getElementById('mov-pessoa-novo')||{}).value||'').trim();
    var pessoaIdSel=(document.getElementById('mov-pessoa-id')||{}).value||'';
    var pessoaLista=_pessoaList(tipoMov);
    var pessoaExistente=pessoaIdSel ? pessoaLista.find(function(p){ return p.id===pessoaIdSel; }) : (pessoaTexto ? pessoaLista.find(function(p){ return _pessoaLabel(p).toLowerCase()===pessoaTexto.toLowerCase(); }) : null);
    var pessoaTipo=pessoaTexto ? (tipoMov==='entrada'?'cliente':'fornecedor') : 'nenhum';
    var obj={
      tipo:tipoMov,
      descricao:desc, valor:valor,
      valorTotalOriginal:valor,
      valorParcela:valor,
      valorRecebido:status==='efetivado'?valor:0,
      saldoRestante:status==='efetivado'?0:valor,
      data:dataBase,
      categoria:cat==='__nova__'?novaCat:cat,
      conta_id:contaId,
      forma_pagamento:forma,
      numeroSequencial:(numeroAtual&&numeroAtual!=='Automático')?numeroAtual:'',
      numeroDocumento:numeroDoc,
      numDocumento:numeroDoc,
      status:status,
      origem:'manual',
      pessoaTipo:pessoaTipo,
      pessoaId:pessoaExistente?pessoaExistente.id:'',
      pessoaNome:pessoaExistente?_pessoaLabel(pessoaExistente):(pessoaTexto||''),
      recorrencia:rec?{
        ativo:true,
        frequencia:recFreq,
        data_inicial:dataBase,
        repeticoes:recReps
      }:null,
      parcelamento:parcelado?{
        ativo:true,
        parcelas:parcelas,
        primeira_data:primeiraParcela,
        frequencia:'mensal'
      }:null,
      anexo_nome:anexoNome,
      observacoes:(document.getElementById('mov-obs')||{}).value||'',
      updatedAt:new Date().toISOString()
    };
    if(!_editingId) obj.createdAt=new Date().toISOString();
    var saveCat=(cat==='__nova__')?DB.add('financeiro_categorias',{nome:novaCat,tipo:obj.tipo,financialNature:'receita',costClass:''}):Promise.resolve();
    saveCat.then(function(){
      if(pessoaTexto&&!pessoaExistente){
        var col=tipoMov==='entrada'?'store_customers':'fornecedores';
        var data=tipoMov==='entrada'?{name:pessoaTexto,status:'ativo',origin:'manual'}:{name:pessoaTexto,nome:pessoaTexto,ativo:true};
        return DB.add(col,data).then(function(ref){
          obj.pessoaId=(ref&&ref.id)||'';
          obj.pessoaNome=pessoaTexto;
        });
      }
      return null;
    }).then(function(){
      if(!_editingId){
        return _nextNumeroSequencial('entrada').then(function(num){ obj.numeroSequencial=num; });
      }
      return null;
    }).then(function(){
      if(rec&&!_editingId){
        var recId='entrada-recorrencia-'+Date.now();
        var opsRec=[];
        for(var r=1;r<=recReps;r++){
          opsRec.push(DB.add('movimentacoes',Object.assign({},obj,{
            descricao:desc+' ('+r+'/'+recReps+')',
            data:_addPeriodo(dataBase,recFreq,r-1),
            status:status||'previsto',
            recorrenciaId:recId,
            recorrencia:Object.assign({},obj.recorrencia||{},{
              ocorrencia:r,
              total:recReps
            }),
            createdAt:new Date().toISOString(),
            updatedAt:new Date().toISOString()
          })));
        }
        return Promise.all(opsRec);
      }
      if(parcelado&&!_editingId){
        var parcelamentoId='entrada-parcelamento-'+Date.now();
        var valorParcela=+(valor/parcelas).toFixed(2);
        var ops=[];
        for(var i=1;i<=parcelas;i++){
          var valorAtual=i===parcelas?+(valor-(valorParcela*(parcelas-1))).toFixed(2):valorParcela;
          ops.push(DB.add('movimentacoes',Object.assign({},obj,{
            descricao:desc+' ('+i+'/'+parcelas+')',
            valor:valorAtual,
            valorTotalOriginal:valor,
            valorParcela:valorAtual,
            valorRecebido:0,
            saldoRestante:valorAtual,
            data:_addPeriodo(primeiraParcela,'mensal',i-1),
            status:'previsto',
            parcelamentoId:parcelamentoId,
            parcelaNumero:i,
            numeroParcelas:parcelas,
            valorTotal:valor,
            createdAt:new Date().toISOString(),
            updatedAt:new Date().toISOString()
          })));
        }
        return Promise.all(ops);
      }
      return _editingId?DB.update('movimentacoes',_editingId,obj):DB.add('movimentacoes',obj);
    }).then(function(){
      UI.toast('Entrada salva!','success');
      if(window._movModal) window._movModal.close();
      if(isNewMov) _resetMovDefaultListState();
      _loadMovimentacoes();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _deleteMov(id) {
    var mov=(_movimentacoes||[]).find(function(m){ return m.id===id; });
    if(mov && (mov.status==='efetivado' || mov.status==='parcial')){
      UI.toast('Não é possível excluir uma entrada recebida ou parcial. Use estorno/cancelamento para manter o histórico financeiro.','error');
      return;
    }
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#FFF0EE;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:flex;gap:14px;align-items:flex-start;">'+
        '<div style="width:42px;height:42px;border-radius:14px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">delete</span></div>'+
        '<div style="min-width:0;">'+
          '<div style="font-size:15px;font-weight:800;color:#1F1F1F;line-height:1.25;">Excluir esta entrada?</div>'+
          '<div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:5px;">Esta ação remove o registro manual previsto. Entradas recebidas ou parciais continuam protegidas para preservar o histórico financeiro.</div>'+
        '</div>'+
      '</div>'+
      '<div style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
        '<div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;">Entrada selecionada</div>'+
        '<div style="font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.35;word-break:break-word;">'+_esc((mov&&mov.descricao)||'Sem descrição')+'</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">'+
          '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:600;">'+_esc((mov&&mov.numeroSequencial)||'Sem número')+'</span>'+
          '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#1F6F43;font-size:12px;font-weight:700;">'+_fmtVal(_parseNum(mov&&mov.valor))+'</span>'+
        '</div>'+
      '</div>'+
    '</div>';
    var footer='<div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;width:100%;">'+
      '<button onclick="if(window._movDeleteModal)window._movDeleteModal.close();" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button>'+
      '<button onclick="Modules.Financeiro._confirmDeleteMov(\''+id+'\')" style="height:40px;padding:0 16px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);">Excluir entrada</button>'+
    '</div>';
    window._movDeleteModal=UI.modal({title:'Excluir entrada',body:body,footer:footer,maxWidth:'520px'});
  }

  function _confirmDeleteMov(id) {
    DB.remove('movimentacoes',id).then(function(){
      if(window._movDeleteModal) window._movDeleteModal.close();
      if(window._movDetalheModal) window._movDetalheModal.close();
      UI.toast('Eliminado','info');
      _loadMovimentacoes();
    });
  }

  function _openEfetivarEntradasModal(id) {
    var ids=id?[id]:_movSelecionadas.slice();
    var entradas=ids.map(function(x){ return _movimentacoes.find(function(m){ return m.id===x; }); }).filter(function(m){
      var st=(m&&m.status)||'efetivado';
      return m&&m.tipo==='entrada'&&(st==='previsto'||(id&&st==='parcial'));
    });
    if(!entradas.length){ UI.toast('Selecione entradas previstas ou parciais','error'); return; }
    window._movEfetivarIds=entradas.map(function(m){ return m.id; });
    var total=entradas.reduce(function(s,m){ return s+_movEntradaPendente(m); },0);
    var contasAtivas=_contasBancarias.filter(function(c){ return c.ativo!==false; });
    var selectedConta=entradas.length===1?(entradas[0].conta_id||''):'';
    if(!selectedConta&&contasAtivas.length===1) selectedConta=contasAtivas[0].id;
    var contaOpts='<option value="">Selecionar conta...</option>'+contasAtivas.map(function(c){ return '<option value="'+c.id+'"'+(selectedConta===c.id?' selected':'')+'>'+_esc(c.nome)+'</option>'; }).join('');
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<section style="background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;"><div><div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Total previsto</div><div style="font-size:clamp(26px,4vw,34px);font-weight:700;color:#1F6F43;line-height:1;">'+_fmtVal(total)+'</div><div style="font-size:12px;color:#6F6860;margin-top:7px;line-height:1.4;">'+entradas.length+' entrada(s) selecionada(s) para baixa.</div></div><div style="width:46px;height:46px;border-radius:14px;background:#fff;color:#1F6F43;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:26px;">south_west</span></div></div></section>'+
      '<section style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
      '<div style="font-size:12px;font-weight:800;color:#1F1F1F;margin-bottom:4px;">Dados do recebimento</div>'+
      '<div style="font-size:12px;color:#6F6860;line-height:1.4;margin-bottom:12px;">Confirme valor, data e conta de destino.</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">'+
        '<div style="max-width:170px;"><label style="'+_lbl()+'">Valor recebido *</label><div style="display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;border:1px solid #EAE4DA;border-radius:10px;background:#fff;overflow:hidden;height:40px;"><span style="height:40px;display:flex;align-items:center;justify-content:center;background:#FFFCF8;color:#6F6860;font-size:13px;font-weight:600;border-right:1px solid #EAE4DA;">€</span><input id="mov-ef-valor" type="text" inputmode="decimal" value="'+_esc(_fmtVal(total).replace('€ ',''))+'" style="width:100%;height:40px;box-sizing:border-box;padding:9px 10px;border:0;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;text-align:right;"></div></div>'+
        '<div><label style="'+_lbl()+'">Data de recebimento *</label><input id="mov-ef-data" type="date" value="'+_today()+'" style="'+_inp()+'"></div>'+
        '<div><label style="'+_lbl()+'">Conta de destino *</label><select id="mov-ef-conta" style="'+_inp()+'background:#fff;">'+contaOpts+'</select></div>'+
      '</div>'+
      '</section>'+
    '</div>';
    var footer='<div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;width:100%;"><button onclick="if(window._movEfModal)window._movEfModal.close()" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button><button onclick="Modules.Financeiro._saveEfetivarEntradas()" style="height:40px;padding:0 16px;border-radius:12px;border:none;background:#16A34A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(22,163,74,.16);">Confirmar recebimento</button></div>';
    window._movEfModal=UI.modal({title:'Confirmar recebimento',body:body,footer:footer,maxWidth:'560px'});
  }

  function _saveEfetivarEntradas() {
    var ids=window._movEfetivarIds||[];
    var entradas=ids.map(function(x){ return _movimentacoes.find(function(m){ return m.id===x; }); }).filter(Boolean);
    var valor=_parseNum((document.getElementById('mov-ef-valor')||{}).value);
    var data=(document.getElementById('mov-ef-data')||{}).value||'';
    var conta=(document.getElementById('mov-ef-conta')||{}).value||'';
    var total=entradas.reduce(function(s,m){ return s+_movEntradaPendente(m); },0);
    if(!valor||valor<=0){ UI.toast('Informe o valor recebido','error'); return; }
    if(!data){ UI.toast('Informe a data de recebimento','error'); return; }
    if(!conta){ UI.toast('Informe a conta destino','error'); return; }
    if(valor>total){ UI.toast('O valor recebido não pode ser maior que o valor pendente','error'); return; }
    if(entradas.length>1&&!confirm('Confirmar recebimento de '+entradas.length+' entradas selecionadas?')) return;
    var parcial=entradas.length===1&&valor<total;
    var ops=[];
    if(parcial){
      var m=entradas[0];
      var saldo=+(total-valor).toFixed(2);
      var infoParcial=_movValorInfo(m);
      var valorRecebidoTotal=+((infoParcial.valorRecebido||0)+valor).toFixed(2);
      window._movRecebimentoParcial={orig:m,saldo:saldo,update:{status:'parcial',valorRecebido:valorRecebidoTotal,valor_recebido_total:valorRecebidoTotal,saldoRestante:saldo,saldo_restante:saldo,valorTotalOriginal:infoParcial.valorTotalOriginal||_parseNum(m.valorTotalOriginal||m.valor),data_recebimento:data,conta_id:conta,updatedAt:new Date().toISOString()}};
      if(window._movEfModal) window._movEfModal.close();
      _openRecebimentoParcialModal();
      return;
    }
    entradas.forEach(function(m){
      var info=_movValorInfo(m);
      var pendente=_movEntradaPendente(m);
      var valorEf=+((info.status==='parcial' ? info.valorRecebido : 0)+pendente).toFixed(2);
      ops.push(DB.update('movimentacoes',m.id,{status:'efetivado',valorRecebido:valorEf,valor_recebido_total:valorEf,saldoRestante:0,saldo_restante:0,valorTotalOriginal:info.valorTotalOriginal||_parseNum(m.valorTotalOriginal||m.valor),data_recebimento:data,data:data,conta_id:conta,updatedAt:new Date().toISOString()}));
    });
    Promise.all(ops).then(function(){
      if(window._movEfModal) window._movEfModal.close();
      UI.toast('Recebimento confirmado','success');
      _movSelecionadas=[];
      _loadMovimentacoes();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _openRecebimentoParcialModal() {
    var ctx=window._movRecebimentoParcial||{};
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
        '<div style="font-size:15px;font-weight:800;color:#1F1F1F;line-height:1.3;">Recebimento parcial</div>'+
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:6px;">Você recebeu apenas parte do valor. Escolha como deseja tratar o saldo restante.</div>'+
        '<div style="margin-top:12px;font-size:12px;color:#6F6860;">Saldo restante</div><div style="font-size:24px;font-weight:700;color:#B45309;line-height:1.1;margin-top:3px;">'+_fmtVal(ctx.saldo||0)+'</div>'+
      '</div>'+
    '</div>';
    var footer='<div style="display:flex;gap:10px;flex-wrap:wrap;width:100%;">'+
      '<button onclick="Modules.Financeiro._gerarNovaPrevisaoParcial()" style="flex:1;min-width:160px;height:40px;border-radius:12px;border:none;background:#16A34A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(22,163,74,.16);">Gerar nova previsão</button>'+
      '<button onclick="Modules.Financeiro._marcarEntradaParcial()" style="flex:1;min-width:160px;height:40px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Marcar como parcial</button>'+
    '</div>';
    window._movParcialModal=UI.modal({title:'Recebimento parcial',body:body,footer:footer,maxWidth:'460px'});
  }

  function _marcarEntradaParcial() {
    var ctx=window._movRecebimentoParcial||{};
    if(!ctx.orig||!ctx.orig.id) return;
    DB.update('movimentacoes',ctx.orig.id,ctx.update).then(function(){
      if(window._movParcialModal) window._movParcialModal.close();
      UI.toast('Entrada marcada como parcial','success');
      _movSelecionadas=[];
      _loadMovimentacoes();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _gerarNovaPrevisaoParcial() {
    var ctx=window._movRecebimentoParcial||{};
    if(!ctx.orig||!ctx.orig.id) return;
    DB.update('movimentacoes',ctx.orig.id,ctx.update).then(function(){
      if(window._movParcialModal) window._movParcialModal.close();
      _openEntradaRestanteModal(ctx.orig,ctx.saldo);
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _openEntradaRestanteModal(orig,saldo) {
    window._movEntradaRestante={orig:orig,saldo:saldo};
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Valor restante</div><div style="font-size:26px;font-weight:700;color:#B45309;line-height:1;">'+_fmtVal(saldo)+'</div></div>'+
      '<div style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
        '<div style="margin-bottom:12px;"><label style="'+_lbl()+'">Valor restante</label><input type="text" value="'+_esc(_fmtVal(saldo))+'" readonly style="'+_inp()+'background:#F8F6F5;"></div>'+
        '<label style="'+_lbl()+'">Nova data prevista *</label><input id="mov-rest-data" type="date" value="'+_today()+'" style="'+_inp()+'">'+
      '</div>'+
    '</div>';
    var footer='<div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;width:100%;"><button onclick="if(window._movRestModal)window._movRestModal.close();" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button><button onclick="Modules.Financeiro._criarEntradaRestante()" style="height:40px;padding:0 16px;border-radius:12px;border:none;background:#16A34A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(22,163,74,.16);">Criar nova entrada</button></div>';
    window._movRestModal=UI.modal({title:'Nova previsão de recebimento',body:body,footer:footer,maxWidth:'420px'});
  }

  function _criarEntradaRestante() {
    var data=window._movEntradaRestante||{};
    var orig=data.orig||{};
    var venc=(document.getElementById('mov-rest-data')||{}).value||'';
    if(!venc){ UI.toast('Informe a nova data prevista','error'); return; }
    var novaEntrada=Object.assign({},orig,{
      descricao:(orig.descricao||'Entrada')+' - saldo restante',
      valor:data.saldo,
      valorTotalOriginal:data.saldo,
      valorParcela:data.saldo,
      valorRecebido:0,
      saldoRestante:data.saldo,
      data:venc,
      status:'previsto',
      valor_recebido_total:0,
      saldo_restante:data.saldo,
      entradaOriginalId:orig.entradaOriginalId||orig.id,
      origem:'manual',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    });
    delete novaEntrada.id;
    DB.add('movimentacoes',novaEntrada).then(function(){
      if(window._movRestModal) window._movRestModal.close();
      UI.toast('Previsão restante criada','success');
      _movSelecionadas=[];
      _loadMovimentacoes();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  // ── CONTAS A PAGAR ────────────────────────────────────────────────────────
  var _cpFiltro={periodo:'todos',inicio:'',fim:'',contas:[],status:{pago:true,pendente:true,parcial:true,vencido:true},busca:'',ordem:'asc'};
  var _cpView={page:1,pageSize:12};

  function _resetCPDefaultListState(){
    _cpFiltro={periodo:'todos',inicio:'',fim:'',contas:[],status:{pago:true,pendente:true,parcial:true,vencido:true},busca:'',ordem:'asc'};
    _cpSelecionadas=[];
    _cpView={page:1,pageSize:12};
  }

  function _loadContasPagar() {
    Promise.all([_loadContasPagarData(),DB.getAll('financeiro_categorias'),DB.getAll('fornecedores'),DB.getAll('contas_bancarias'),_loadMovimentacoesData(),DB.getDocRoot('config','financeiro')]).then(function(r){
      _contasPagar=r[0]||[]; _categorias=r[1]||[]; _fornecedores=r[2]||[]; _contasBancarias=r[3]||[]; _movimentacoes=r[4]||[]; _setConfigFin(r[5]);
      _paintContasPagar();
    });
  }

  function _cpPaging(items) {
    var total=(items||[]).length;
    var pageSize=Math.max(6,parseInt(_cpView.pageSize,10)||12);
    var totalPages=Math.max(1,Math.ceil(total/pageSize));
    var page=Math.min(Math.max(1,parseInt(_cpView.page,10)||1),totalPages);
    if(_cpView.page!==page) _cpView.page=page;
    var start=(page-1)*pageSize;
    return {
      items:(items||[]).slice(start,start+pageSize),
      total:total,
      page:page,
      pageSize:pageSize,
      totalPages:totalPages,
      start:total?start+1:0,
      end:Math.min(total,start+pageSize)
    };
  }

  function _paintContasPagar() {
    var content=document.getElementById('fin-content'); if(!content) return;
    var range=_periodRange(_cpFiltro.periodo,_cpFiltro.inicio,_cpFiltro.fim);
    var contasAtivas=(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; });
    var caixa=contasAtivas.find(function(c){
      var txt=((c.nome||'')+' '+(c.tipo||'')).toLowerCase();
      return txt.indexOf('caixa')>=0 || txt.indexOf('cofre')>=0;
    });
    var contasOrdenadas=contasAtivas.slice().sort(function(a,b){
      if(caixa){
        if(a.id===caixa.id) return -1;
        if(b.id===caixa.id) return 1;
      }
      return (a.nome||'').localeCompare(b.nome||'');
    });
    var filtered=_contasPagar.filter(function(cp){
      var st=_statusCP(cp);
      var busca=(_cpFiltro.busca||'').toLowerCase().trim();
      var fornecedorNome=cp.fornecedorNome||cp.fornecedor||'';
      if(!fornecedorNome&&cp.fornecedorId){
        var forn=_fornecedores.find(function(f){ return f.id===cp.fornecedorId; });
        fornecedorNome=forn?(forn.name||forn.nome||''):'';
      }
      if(_cpFiltro.status && !_cpFiltro.status[st]) return false;
      if(_cpFiltro.contas&&_cpFiltro.contas.length&&_cpFiltro.contas.indexOf(cp.conta_id)<0) return false;
      if(range.start&&(!cp.vencimento||cp.vencimento<range.start)) return false;
      if(range.end&&(!cp.vencimento||cp.vencimento>range.end)) return false;
      if(busca){
        var valorTxt=_fmtVal(cp.valor).toLowerCase();
        var valorRaw=String(_parseNum(cp.valor)).toLowerCase();
        var contaBusca=(_contasBancarias.find(function(c){ return c.id===(cp.conta_id||cp.contaBancariaId); })||{}).nome||'';
        var hay=[cp.numeroSequencial,cp.numeroDocumento,cp.numDocumento,cp.descricao,fornecedorNome,cp.categoria,cp.formaPagamento,cp.forma_pagamento,contaBusca,valorRaw,valorTxt].join(' ').toLowerCase();
        if(hay.indexOf(busca)<0) return false;
      }
      return true;
    }).sort(function(a,b){
      var cmp=(a.vencimento||'').localeCompare(b.vencimento||'');
      return _cpFiltro.ordem==='asc'?cmp:-cmp;
    });
    _cpVisiveis=filtered.map(function(cp){ return cp.id; });
    _cpSelecionadas=_cpSelecionadas.filter(function(id){ return filtered.some(function(cp){ return cp.id===id; }); });
    var totalAPagar=filtered.filter(function(cp){ return _statusCP(cp)==='pendente'; }).reduce(function(s,cp){
      return s+_cpValorInfo(cp).valorRow;
    },0);
    var totalPago=filtered.filter(function(cp){ return _statusCP(cp)==='pago' || _statusCP(cp)==='parcial'; }).reduce(function(s,cp){
      var info=_cpValorInfo(cp);
      return s+(_statusCP(cp)==='parcial'?info.valorPago:info.valorRow);
    },0);
    var totalParcial=filtered.filter(function(cp){ return _statusCP(cp)==='parcial'; }).reduce(function(s,cp){
      return s+_cpValorInfo(cp).saldoRestante;
    },0);
    var totalVencido=filtered.filter(function(cp){ return _statusCP(cp)==='vencido'; }).reduce(function(s,cp){
      return s+_cpValorInfo(cp).valorVencido;
    },0);
    var paging=_cpPaging(filtered);
    var pageItems=paging.items;
    var showCustom=_cpFiltro.periodo==='custom';
    var cardStyle='background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.055);';
    var inputStyle='width:100%;box-sizing:border-box;padding:0 12px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;height:42px;';
    var selectStyle=inputStyle+'appearance:none;-webkit-appearance:none;background-color:#FFFCF8;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:36px;';
    var labelStyle='font-size:11px;font-weight:650;color:#6F6860;letter-spacing:.04em;text-transform:uppercase;display:block;margin-bottom:6px;';
    var hasCPFilter=!!(_cpFiltro.busca||_cpFiltro.periodo!=='todos'||_cpFiltro.inicio||_cpFiltro.fim||(_cpFiltro.contas&&_cpFiltro.contas.length)||!(_cpFiltro.status||{}).pago||!(_cpFiltro.status||{}).pendente||!(_cpFiltro.status||{}).parcial||!(_cpFiltro.status||{}).vencido);
    var sectionTitle=function(title,desc){ return '<div style="margin-bottom:14px;"><h3 style="font-size:15px;font-weight:700;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">'+_esc(title)+'</h3><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:680px;">'+_esc(desc||'')+'</p></div>'; };
    var metric=function(title,value,desc,icon,color){
      return '<div style="display:flex;align-items:flex-start;gap:14px;background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:118px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">'+
        '<div style="width:48px;height:48px;border-radius:14px;background:transparent;color:'+color+';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:26px;">'+icon+'</span></div>'+
        '<div style="min-width:0;display:flex;flex-direction:column;gap:6px;">'+
          '<span style="font-size:12px;font-weight:600;color:#6F6860;line-height:1.15;">'+_esc(title)+'</span>'+
          '<strong style="font-size:clamp(24px,2.4vw,34px);font-weight:700;color:#1F1F1F;line-height:1.05;letter-spacing:0;overflow-wrap:anywhere;">'+_esc(value)+'</strong>'+
          '<small style="font-size:12px;color:#6F6860;line-height:1.35;">'+_esc(desc||'')+'</small>'+
        '</div>'+
      '</div>';
    };
    var statusCheck=function(key,label){
      return '<label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;white-space:nowrap;"><input type="checkbox" '+((_cpFiltro.status||{})[key]?'checked':'')+' onchange="Modules.Financeiro._toggleCPStatus(\''+key+'\',this.checked)" style="accent-color:#B42318;width:16px;height:16px;"> '+_esc(label)+'</label>';
    };
    var contasHtml='<label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;white-space:nowrap;"><input type="checkbox" '+((!_cpFiltro.contas||!_cpFiltro.contas.length)?'checked':'')+' onchange="Modules.Financeiro._setCPFiltro(\'contas\',[])" style="accent-color:#B42318;width:16px;height:16px;"> Todas</label>'+
      contasOrdenadas.map(function(c){ return '<label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;white-space:nowrap;"><input type="checkbox" '+((_cpFiltro.contas||[]).indexOf(c.id)>=0?'checked':'')+' onchange="Modules.Financeiro._toggleCPConta(\''+c.id+'\',this.checked)" style="accent-color:#B42318;width:16px;height:16px;"> '+_esc(c.nome)+'</label>'; }).join('');
    var pageSizeOptions=[8,12,24,48].map(function(n){ return '<option value="'+n+'"'+(Number(_cpView.pageSize)===n?' selected':'')+'>'+n+' / pág.</option>'; }).join('');
    var paginationHtml=paging.total?'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">'+
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">'+paging.start+'</strong> a <strong style="color:#1F1F1F;font-weight:600;">'+paging.end+'</strong> de <strong style="color:#1F1F1F;font-weight:600;">'+paging.total+'</strong></span>'+
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">'+
        '<select onchange="Modules.Financeiro._setCPPageSize(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">'+pageSizeOptions+'</select>'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<button type="button" onclick="Modules.Financeiro._setCPPage('+(paging.page-1)+')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:'+(paging.page>1?'pointer':'not-allowed')+';opacity:'+(paging.page>1?'1':'.45')+';"'+(paging.page>1?'':' disabled')+'>Anterior</button>'+
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">'+paging.page+'</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">'+paging.totalPages+'</span></div>'+
          '<button type="button" onclick="Modules.Financeiro._setCPPage('+(paging.page+1)+')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:'+(paging.page<paging.totalPages?'pointer':'not-allowed')+';opacity:'+(paging.page<paging.totalPages?'1':'.45')+';"'+(paging.page<paging.totalPages?'':' disabled')+'>Próxima</button>'+
        '</div>'+
      '</div>'+
    '</div>':'';
    content.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">'+
        '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Saídas</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Controle contas a pagar, vencimentos e valores pagos sem perder o histórico financeiro.</p></div>'+
        '<button onclick="Modules.Financeiro._openCPModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">+ Nova Saída</button>'+
      '</div>'+
      '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;">'+
        metric('A pagar', _fmtVal(totalAPagar), 'Saídas previstas no recorte.', 'payments', '#B45309')+
        metric('Pago', _fmtVal(totalPago), 'Valor já baixado do caixa.', 'task_alt', '#1F6F43')+
        metric('Parcial pendente', _fmtVal(totalParcial), 'Saldo restante de pagamentos parciais.', 'hourglass_top', '#6C8777')+
        metric('Vencido', _fmtVal(totalVencido), 'Contas vencidas no período.', 'priority_high', '#B42318')+
      '</section>'+
      '<section style="'+cardStyle+'">'+
        '<div style="display:grid;grid-template-columns:minmax(240px,1fr) minmax(180px,220px) auto;gap:12px;align-items:end;justify-content:start;">'+
          '<div><label style="'+labelStyle+'">Busca</label><input id="cp-busca" type="search" value="'+_esc(_cpFiltro.busca||'')+'" oninput="Modules.Financeiro._setCPFiltro(\'busca\',this.value)" placeholder="Descrição, fornecedor, documento, forma, conta ou valor" style="'+inputStyle+'"></div>'+
          '<div><label style="'+labelStyle+'">Período</label><select onchange="Modules.Financeiro._setCPFiltro(\'periodo\',this.value)" style="'+selectStyle+'">'+_periodoOptionsHtml(_cpFiltro.periodo)+'</select></div>'+
          (hasCPFilter?'<div style="display:flex;align-items:flex-end;"><button onclick="Modules.Financeiro._limparCPFiltros()" style="height:38px;padding:0 14px;border:1px solid #E8DCD7;border-radius:12px;font-size:12.5px;font-weight:600;color:#B42318;background:#fff;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button></div>':'')+
        '</div>'+
        '<div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;align-items:start;">'+
          '<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:6px;">'+
            '<span style="'+labelStyle+'margin-bottom:0;">Status</span>'+
            '<div style="min-height:42px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:8px 12px;">'+
              statusCheck('pago','Já pago')+statusCheck('pendente','A pagar')+statusCheck('parcial','Parcial')+statusCheck('vencido','Vencido')+
            '</div>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:6px;">'+
            '<span style="'+labelStyle+'margin-bottom:0;">Contas bancárias</span>'+
            '<div style="min-height:42px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:8px 12px;">'+contasHtml+'</div>'+
          '</div>'+
        '</div>'+
        (showCustom?'<div style="display:grid;grid-template-columns:repeat(2,minmax(160px,220px));gap:12px;margin-top:12px;">'+
          '<div><label style="'+labelStyle+'">Data inicial</label><input type="date" value="'+_esc(_cpFiltro.inicio||'')+'" onchange="Modules.Financeiro._setCPFiltro(\'inicio\',this.value)" style="'+inputStyle+'"></div>'+
          '<div><label style="'+labelStyle+'">Data final</label><input type="date" value="'+_esc(_cpFiltro.fim||'')+'" onchange="Modules.Financeiro._setCPFiltro(\'fim\',this.value)" style="'+inputStyle+'"></div>'+
        '</div>':'')+
        (_cpSelecionadas.length?'<div style="margin-top:14px;padding:12px 14px;border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;"><span style="font-size:12px;color:#6F6860;font-weight:600;">'+_cpSelecionadas.length+' saída(s) selecionada(s)</span><div style="display:flex;gap:8px;flex-wrap:wrap;"><button onclick="Modules.Financeiro._openBulkCPModal()" style="border:none;background:#EEF4FF;color:#2563EB;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Alterar em massa</button><button onclick="Modules.Financeiro._bulkConfirmarCP()" style="border:none;background:#16A34A;color:#fff;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Confirmar saída</button><button onclick="Modules.Financeiro._bulkDeleteCP()" style="border:none;background:#FFF0EE;color:#C4362A;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Excluir</button><button onclick="Modules.Financeiro._clearCPSelection()" style="border:1px solid #EAE4DA;background:#fff;color:#6F6860;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Limpar seleção</button></div></div>':'')+
      '</section>'+
      (filtered.length===0
        ?'<section style="'+cardStyle+'text-align:center;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma saída encontrada</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Ajuste os filtros ou cadastre uma nova saída.</div></section>'
        :'<section style="display:flex;flex-direction:column;gap:10px;">'+
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Saídas cadastradas</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Gerencie vencimentos, pagamentos e ações em massa.</div></div>'+
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
          '<div style="overflow:auto;">'+
            '<table style="width:100%;min-width:1080px;border-collapse:separate;border-spacing:0;table-layout:fixed;">'+
              '<colgroup><col style="width:34px;"><col style="width:138px;"><col style="width:25%;"><col style="width:18%;"><col style="width:24%;"><col style="width:100px;"><col style="width:130px;"><col style="width:210px;"></colgroup>'+
              '<thead><tr style="background:#fff;">'+
                '<th style="padding:12px 8px;text-align:center;width:34px;border-bottom:1px solid #EAE4DA;"><input type="checkbox" onchange="Modules.Financeiro._toggleCPTodas(this.checked)" '+(filtered.length&&filtered.every(function(cp){ return _cpSelecionadas.indexOf(cp.id)>=0; })?'checked':'')+' style="accent-color:#B42318;"></th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;user-select:none;border-bottom:1px solid #EAE4DA;" onclick="Modules.Financeiro._toggleCPOrdem()">Nº / Vencimento '+(_cpFiltro.ordem==='asc'?'↑':'↓')+'</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Descrição</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Forma / Conta</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Fornecedor</th>'+
                '<th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Status</th>'+
                '<th style="padding:12px 14px;text-align:right;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;">Valor</th>'+
                '<th style="padding:12px 6px;border-bottom:1px solid #EAE4DA;"></th>'+
              '</tr></thead><tbody>'+
              pageItems.map(function(cp){
                var st=_statusCP(cp);
                var fornecedorNome=cp.fornecedorNome||cp.fornecedor||'';
                if(!fornecedorNome&&cp.fornecedorId){
                  var forn=_fornecedores.find(function(f){ return f.id===cp.fornecedorId; });
                  fornecedorNome=forn?(forn.name||forn.nome||''):'';
                }
                var contaNome=(_contasBancarias.find(function(c){ return c.id===(cp.conta_id||cp.contaBancariaId); })||{}).nome||'';
                var info=_cpValorInfo(cp);
                var valorHtml=st==='parcial'
                  ?'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;line-height:1.15;"><div style="font-size:12px;font-weight:700;color:#16A34A;">Pago: '+_fmtVal(info.valorPago)+'</div><div style="font-size:12px;font-weight:700;color:#B45309;">Pendente: '+_fmtVal(info.saldoRestante)+'</div></div>'
                  :('<div style="text-align:right;"><div style="font-size:14px;font-weight:800;color:#B42318;">- '+_fmtVal(info.displayValor)+'</div><div style="font-size:11px;color:#8A7E7C;margin-top:2px;">'+(st==='pago'?'Já pago':(st==='vencido'?'Vencido':(cp.parcelada?'Parcela '+(cp.parcelaNumero||'?')+'/'+(cp.numeroParcelas||'?'):'A pagar')) )+'</div></div>');
                return '<tr style="cursor:pointer;transition:background .15s ease;" onclick="Modules.Financeiro._openCPDetalheModal(\''+cp.id+'\')" onmouseover="this.style.background=\'#FAF8F4\'" onmouseout="this.style.background=\'#fff\'">'+
                  '<td style="padding:12px 8px;text-align:center;border-bottom:1px solid #F2EDEA;"><input type="checkbox" '+(_cpSelecionadas.indexOf(cp.id)>=0?'checked':'')+' onclick="event.stopPropagation();" onchange="Modules.Financeiro._toggleCPSelecionada(\''+cp.id+'\',this.checked)" style="accent-color:#B42318;"></td>'+
                  '<td style="padding:12px 14px;font-size:13px;font-weight:600;color:'+(st==='vencido'?'#B42318':'#1F1F1F')+';border-bottom:1px solid #F2EDEA;"><div style="font-weight:700;">'+_esc(cp.numeroSequencial||'--')+'</div><div style="font-size:11px;color:#8A7E7C;margin-top:2px;">'+_esc(_fmtDateDisplay(cp.vencimento))+'</div></td>'+
                  '<td style="padding:12px 14px;font-size:13px;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid #F2EDEA;"><div style="font-weight:700;color:#1F1F1F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(cp.descricao||'Sem descrição')+(cp.recorrente?'<span style="font-size:10px;background:#EFF6FF;color:#3B82F6;padding:1px 6px;border-radius:9px;margin-left:4px;">Recorrente</span>':'')+'</div>'+(cp.numeroDocumento||cp.numDocumento?'<div style="font-size:11px;color:#8A7E7C;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Doc: '+_esc(cp.numeroDocumento||cp.numDocumento)+'</div>':'')+'</td>'+
                  '<td style="padding:12px 14px;font-size:12px;color:#6F6860;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid #F2EDEA;"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:#1F1F1F;">'+_esc(cp.formaPagamento||cp.forma_pagamento||'--')+'</div><div style="font-size:11px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(contaNome||'--')+'</div></td>'+
                  '<td style="padding:12px 14px;font-size:12px;color:#6F6860;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-bottom:1px solid #F2EDEA;">'+_esc(fornecedorNome||'--')+'</td>'+
                  '<td style="padding:12px 14px;border-bottom:1px solid #F2EDEA;">'+_badgeSaidaStatus(st)+'</td>'+
                  '<td style="padding:12px 14px;text-align:right;border-bottom:1px solid #F2EDEA;">'+valorHtml+'</td>'+
                  '<td style="padding:12px 6px;text-align:right;white-space:nowrap;border-bottom:1px solid #F2EDEA;">'+
                    (st!=='pago' && cp._acionavel?'<button onclick="event.stopPropagation();Modules.Financeiro._pagarCP(\''+cp.id+'\')" title="Confirmar saída" style="width:30px;height:30px;border-radius:9px;border:none;background:#EAF7EF;color:#1F6F43;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;margin-right:4px;"><span class="mi" style="font-size:17px;">task_alt</span></button>':'')+
                    (st!=='pago' && cp._colecao==='contas_pagar'?'<button onclick="event.stopPropagation();Modules.Financeiro._openCPModal(\''+cp.id+'\')" title="Editar" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;margin-right:4px;"><span class="mi" style="font-size:17px;">edit</span></button>':'')+
                    (cp._colecao==='contas_pagar'?'<button onclick="event.stopPropagation();Modules.Financeiro._deleteCP(\''+cp.id+'\')" title="Excluir" style="width:30px;height:30px;border-radius:9px;border:none;background:#FFF0EE;color:#B42318;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:17px;">delete</span></button>':'')+
                  '</td></tr>';
              }).join('')+
              '</tbody></table></div>'+paginationHtml+'</div></section>')+
      '</div>';
  }

  function _setCPFiltro(key,val){
    _cpFiltro[key]=val;
    _cpView.page=1;
    if(key==='periodo'&&val==='custom'){
      _cpFiltro.inicio=_cpFiltro.inicio||_today();
      _cpFiltro.fim=_cpFiltro.fim||_today();
    }
    _paintContasPagar();
    if(key==='busca'){
      setTimeout(function(){
        var el=document.getElementById('cp-busca');
        if(el){ el.focus(); if(el.setSelectionRange) el.setSelectionRange(el.value.length,el.value.length); }
      },0);
    }
  }

  function _toggleCPConta(id,checked){
    var contas=(_cpFiltro.contas||[]).slice();
    if(checked&&contas.indexOf(id)<0) contas.push(id);
    if(!checked) contas=contas.filter(function(x){ return x!==id; });
    _cpFiltro.contas=contas;
    _cpView.page=1;
    _paintContasPagar();
  }

  function _toggleCPStatus(status,checked){
    var st=Object.assign({},_cpFiltro.status||{});
    st[status]=checked;
    _cpFiltro.status=st;
    _cpView.page=1;
    _paintContasPagar();
  }

  function _toggleCPOrdem() {
    _cpFiltro.ordem=_cpFiltro.ordem==='asc'?'desc':'asc';
    _cpView.page=1;
    _paintContasPagar();
  }

  function _setCPPage(page){
    _cpView.page=Math.max(1,parseInt(page,10)||1);
    _paintContasPagar();
  }

  function _setCPPageSize(size){
    _cpView.pageSize=Math.max(6,parseInt(size,10)||12);
    _cpView.page=1;
    _paintContasPagar();
  }

  function _toggleCPSelecionada(id,checked){
    if(checked&&_cpSelecionadas.indexOf(id)<0) _cpSelecionadas.push(id);
    if(!checked) _cpSelecionadas=_cpSelecionadas.filter(function(x){ return x!==id; });
    _paintContasPagar();
  }

  function _toggleCPTodas(checked){
    _cpSelecionadas=checked?_cpVisiveis.slice():[];
    _paintContasPagar();
  }

  function _clearCPSelection(){ _cpSelecionadas=[]; _paintContasPagar(); }

  function _selectedCPItems(){
    return _cpSelecionadas.map(function(id){ return (_contasPagar||[]).find(function(cp){ return cp.id===id; }); }).filter(Boolean);
  }

  function _openBulkCPModal(){
    if(!_cpSelecionadas.length) return;
    var cats=_catsByTipo('saida');
    var catOpts='<option value="">Manter categoria</option>'+cats.map(function(c){ return '<option value="'+_esc(c)+'">'+_esc(c)+'</option>'; }).join('');
    var contaOpts='<option value="">Manter conta</option>'+(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; }).sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); }).map(function(c){ return '<option value="'+c.id+'">'+_esc(c.nome||'')+'</option>'; }).join('');
    var body='<div style="display:flex;flex-direction:column;gap:12px;">'+
      '<div><label style="'+_lbl()+'">Categoria</label><select id="bulk-cp-cat" style="'+_inp()+'background:#fff;">'+catOpts+'</select></div>'+
      '<div><label style="'+_lbl()+'">Forma de pagamento</label><select id="bulk-cp-forma" style="'+_inp()+'background:#fff;"><option value="">Manter forma</option>'+_formaOptions('').replace('<option value="">Selecionar...</option>','')+'</select></div>'+
      '<div><label style="'+_lbl()+'">Conta bancária</label><select id="bulk-cp-conta" style="'+_inp()+'background:#fff;">'+contaOpts+'</select></div>'+
    '</div>';
    var footer='<button onclick="Modules.Financeiro._applyBulkCP()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Aplicar</button>';
    window._bulkCPModal=UI.modal({title:'Alterar saídas selecionadas',body:body,footer:footer,maxWidth:'440px'});
  }

  function _applyBulkCP(){
    var upd={};
    var cat=(document.getElementById('bulk-cp-cat')||{}).value||'';
    var forma=(document.getElementById('bulk-cp-forma')||{}).value||'';
    var conta=(document.getElementById('bulk-cp-conta')||{}).value||'';
    if(cat) upd.categoria=cat;
    if(forma){ upd.formaPagamento=forma; upd.forma_pagamento=forma; }
    if(conta){ upd.conta_id=conta; upd.contaBancariaId=conta; }
    if(!Object.keys(upd).length){ UI.toast('Escolha pelo menos uma alteração.','error'); return; }
    var items=_selectedCPItems();
    Promise.all(items.map(function(cp){ return DB.update(cp._colecao||'contas_pagar',cp.id,upd); })).then(function(){
      if(window._bulkCPModal) window._bulkCPModal.close();
      UI.toast(items.length+' saída(s) atualizada(s).','success');
      _cpSelecionadas=[];
      _loadContasPagar();
    }).catch(function(){ UI.toast('Não foi possível atualizar as saídas selecionadas.','error'); });
  }

  function _bulkConfirmarCP(){
    if(_bulkCPProcessando){ UI.toast('Aguarde a confirmação em andamento.','warning'); return; }
    var contasAtivas=(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; });
    var items=_selectedCPItems().filter(function(cp){
      var already=(_movimentacoes||[]).some(function(m){ return m.tipo==='saida' && m.status==='efetivado' && (m.contaPagarId===cp.id || (m.sourceCollection===(cp._colecao||'contas_pagar') && m.sourceId===cp.id)); });
      var conta=cp.conta_id||cp.contaBancariaId||(contasAtivas.length===1?contasAtivas[0].id:'');
      return cp._acionavel && _statusCP(cp)!=='pago' && _statusCP(cp)!=='parcial' && !already && !!conta;
    });
    var skipped=_cpSelecionadas.length-items.length;
    if(!items.length){ UI.toast('Nenhuma saída selecionada pode ser confirmada.','error'); return; }
    var today=_today();
    _bulkCPProcessando=true;
    Promise.all(items.map(function(cp){
      var conta=cp.conta_id||cp.contaBancariaId||(contasAtivas.length===1?contasAtivas[0].id:'');
      var info=_cpValorInfo(cp);
      var dueTotal=_cpPayableTotal(cp,info);
      var meta=_financialMetaFromRecord(cp);
      var upd={status:'pago',data_pagamento:today,valorPago:dueTotal,valor_pago_total:dueTotal,saldoRestante:0,saldo_restante:0,ultimo_pagamento:today,conta_id:conta,contaBancariaId:conta};
      return DB.update(cp._colecao||'contas_pagar',cp.id,upd).then(function(){
        return DB.add('movimentacoes',{tipo:'saida',descricao:cp.descricao||'Saída',valor:dueTotal,valorTotalOriginal:dueTotal,valorParcela:dueTotal,valorPago:dueTotal,saldoRestante:0,data:today,status:'efetivado',conta_id:conta,forma_pagamento:cp.formaPagamento||cp.forma_pagamento||'',categoria:meta.categoriaNome||cp.categoria||'',categoriaId:meta.categoriaId,categoriaFinanceiraId:meta.categoriaId,categoriaFinanceiraNome:meta.categoriaNome,financialNature:meta.financialNature,categoriaFinanceiraNatureza:meta.financialNature,costClass:meta.costClass,categoriaFinanceiraCostClass:meta.costClass,contaPagarId:cp.id,sourceCollection:cp._colecao||'contas_pagar',sourceId:cp.id,origem:cp.origem||'financeiro',pessoaTipo:cp.fornecedorId||cp.fornecedorNome||cp.fornecedor?'fornecedor':'nenhum',pessoaId:cp.fornecedorId||'',pessoaNome:cp.fornecedorNome||cp.fornecedor||'',updatedAt:new Date().toISOString()});
      });
    })).then(function(){
      UI.toast(items.length+' saída(s) confirmada(s). '+skipped+' ignorada(s).','success');
      _cpSelecionadas=[];
      _loadContasPagar();
    }).catch(function(){ UI.toast('Não foi possível confirmar as saídas selecionadas.','error'); }).then(function(){ _bulkCPProcessando=false; });
  }

  function _bulkDeleteCP(){
    var items=_selectedCPItems();
    UI.confirm('Excluir '+items.length+' saída(s) selecionada(s)?').then(function(yes){
      if(!yes) return;
      var valid=items.filter(function(cp){ return (cp._colecao||'')==='contas_pagar' && _statusCP(cp)!=='pago' && _statusCP(cp)!=='parcial'; });
      Promise.all(valid.map(function(cp){ return DB.remove('contas_pagar',cp.id); })).then(function(){
        UI.toast(valid.length+' saída(s) excluída(s). '+(items.length-valid.length)+' ignorada(s).','info');
        _cpSelecionadas=[];
        _loadContasPagar();
      });
    });
  }

  function _openContasVencidas() {
    _cpFiltro.status={pago:false,pendente:false,parcial:false,vencido:true};
    _switchSub('contas-pagar');
  }

  function _cpMovPagamento(cp) {
    if(!cp || !cp.id) return null;
    var movs=(_movimentacoes||[]).filter(function(m){ return m.tipo==='saida' && m.contaPagarId===cp.id; }).sort(function(a,b){
      return (b.data||'').localeCompare(a.data||'');
    });
    return movs[0] || null;
  }

  function _findNameById(list,id,fields) {
    if(!id) return '';
    var item=(list||[]).find(function(x){ return x && x.id===id; });
    if(!item) return '';
    for(var i=0;i<fields.length;i++){
      if(item[fields[i]]) return item[fields[i]];
    }
    return '';
  }

  function _resolveFormaPagamentoName(cp,mov) {
    var direct=cp.formaPagamentoNome||cp.formaPagamento||cp.forma_pagamento||cp.paymentMethodName||cp.paymentMethod||cp.metodoPagamentoNome||cp.metodoPagamento||cp.forma||'';
    if(direct) return direct;
    if(mov&&(mov.formaPagamentoNome||mov.formaPagamento||mov.forma_pagamento)) return mov.formaPagamentoNome||mov.formaPagamento||mov.forma_pagamento;
    var id=cp.formaPagamentoId||cp.forma_pagamento_id||cp.paymentMethodId||cp.metodoPagamentoId||'';
    if(!id) return '';
    var forma=_formasPagFull(true).find(function(f){ return f.id===id || f.nome===id || f.name===id; });
    return forma?(forma.nome||forma.name||''):'';
  }

  function _resolveContaBancariaNome(cp,mov) {
    if(cp.contaBancaria&&typeof cp.contaBancaria==='object'&&(cp.contaBancaria.nome||cp.contaBancaria.name)) return cp.contaBancaria.nome||cp.contaBancaria.name;
    var direct=cp.contaBancariaNome||cp.contaNome||cp.conta_nome||cp.conta_bancaria_nome||cp.bankAccountName||cp.contaSaidaNome||'';
    if(direct) return direct;
    if(mov&&(mov.contaBancariaNome||mov.contaNome||mov.conta_nome)) return mov.contaBancariaNome||mov.contaNome||mov.conta_nome;
    var id=cp.contaBancariaId||cp.conta_id||cp.contaId||cp.conta_bancaria_id||cp.bankAccountId||cp.contaSaidaId||(mov&&(mov.contaBancariaId||mov.conta_id||mov.contaId))||'';
    return _findNameById(_contasBancarias,id,['nome','name','banco','instituicao']);
  }

  function _resolveCategoriaSaidaNome(cp) {
    var direct=cp.categoriaNome||cp.categoriaFinanceiraNome||cp.categoria||cp.category||'';
    if(direct){
      var byDirectId=_findNameById((_categorias||[]).filter(function(c){ return !c.tipo || c.tipo==='saida' || c.tipo==='expense'; }),direct,['nome','name']);
      return byDirectId||direct;
    }
    var id=cp.categoriaFinanceiraId||cp.categoriaId||cp.categoryId||'';
    return _findNameById((_categorias||[]).filter(function(c){ return !c.tipo || c.tipo==='saida' || c.tipo==='expense'; }),id,['nome','name']);
  }

  function _resolveFavorecidoNome(cp) {
    var direct=cp.fornecedorNome||cp.favorecidoNome||cp.fornecedor||cp.favorecido||cp.supplier||cp.pessoaNome||'';
    if(direct) return direct;
    return _findNameById(_fornecedores,cp.fornecedorId||cp.favorecidoId||cp.supplierId||'',['name','nome']);
  }

  function _normalizeSaidaResumo(cp,mov,info,st) {
    var totalParcelas=cp.totalParcelas||cp.numeroParcelas||cp.parcelasTotal||cp.total_parcelas||'';
    var parcelaNumero=cp.numeroParcela||cp.parcelaNumero||cp.parcela||cp.parcela_atual||'';
    var origem=cp.origem||cp.origin||cp._origemFinanceira||cp.sourceModule||'';
    if(!origem&&cp._colecao==='financeiro_apagar') origem='compra';
    if(!origem&&cp._colecao==='contas_pagar') origem='manual';
    return {
      numeroInterno:cp.numeroInterno||cp.numeroSequencial||cp.numero||cp.codigo||'',
      numeroDocumento:cp.numeroDocumento||cp.numDocumento||cp.numDoc||cp.documentoNumero||cp.documentNumber||'',
      descricao:cp.descricao||cp.description||'',
      valor:info.valorTotalOriginal||_parseNum(cp.valor),
      data:cp.data||cp.data_saida||cp.dataPagamento||cp.data_pagamento||'',
      vencimento:cp.vencimento||cp.dueDate||cp.data||'',
      status:st,
      favorecidoNome:_resolveFavorecidoNome(cp),
      categoriaNome:_resolveCategoriaSaidaNome(cp),
      formaPagamentoNome:_resolveFormaPagamentoName(cp,mov),
      contaBancariaNome:_resolveContaBancariaNome(cp,mov),
      tipoPagamento:cp.parcelada||parcelaNumero||totalParcelas?'Parcelada':(cp.recorrente?'Recorrente':'Conta única'),
      recorrente:!!cp.recorrente,
      parcelado:!!(cp.parcelada||parcelaNumero||totalParcelas),
      parcelaNumero:parcelaNumero,
      totalParcelas:totalParcelas,
      observacao:cp.observacao||cp.observacoes||cp.obs||'',
      origem:origem,
      valorParcela:info.valorParcela||_parseNum(cp.valorParcela||cp.valor_parcela),
      valorTotalOriginal:info.valorTotalOriginal||_parseNum(cp.valorTotalOriginal||cp.valor_total_original||cp.valor)
    };
  }

  function _openCPDetalheModal(id) {
    var cp=id?(_contasPagar.find(function(x){ return x.id===id; })||{}):{};
    if(!cp.id) return;
    var st=_statusCP(cp);
    var info=_cpValorInfo(cp);
    var pago=info.valorPago;
    var pendente=info.saldoRestante;
    var canManageManualCP=cp._colecao==='contas_pagar';
    var mov=_cpMovPagamento(cp);
    var resumo=_normalizeSaidaResumo(cp,mov,info,st);
    var tipoLabel=resumo.tipoPagamento;
    var statusInfo=st==='pago'
      ? {label:'Já pago',bg:'#DCFCE7',fg:'#16A34A'}
      : st==='parcial'
        ? {label:'Parcial',bg:'#FEF9C3',fg:'#B45309'}
        : st==='vencido'
          ? {label:'Vencida',bg:'#FEE2E2',fg:'#DC2626'}
          : {label:'A pagar',bg:'#EFF6FF',fg:'#2563EB'};
    var cardStyle=_modalCardStyle();
    var detailItem=function(label,value,wide){
      return '<div style="'+(wide?'grid-column:1/-1;':'')+'min-width:0;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:10px 11px;">'+
        '<div style="font-size:10.5px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;">'+_esc(label)+'</div>'+
        '<div style="font-size:13.5px;font-weight:500;color:#1F1F1F;line-height:1.35;word-break:break-word;">'+(value||'--')+'</div>'+
      '</div>';
    };
    var infoCards=[];
    if(info.valorTotalOriginal){
      infoCards.push(detailItem('Valor total original',_fmtVal(info.valorTotalOriginal)));
    }
    if(resumo.origem){
      infoCards.push(detailItem('Origem',_esc(resumo.origem==='compra'?'Compra':'Manual')));
    }
    if(info.valorParcela && (cp.parcelada || cp.parcelaNumero || cp.numeroParcelas)){
      infoCards.push(detailItem('Valor da parcela',_fmtVal(info.valorParcela)));
    }
    if(cp.recorrente){
      infoCards.push(detailItem('Recorrência',_esc(cp.periodicidade||'Mensal')+(cp.data_final?' até '+_esc(_fmtDateDisplay(cp.data_final)):'') ));
    }
    if(cp.parcelada && (cp.parcelaNumero || cp.numeroParcelas)){
      infoCards.push(detailItem('Parcelamento',_esc('Parcela '+(cp.parcelaNumero||'?')+' de '+(cp.numeroParcelas||'?'))));
    }
    if(cp.parcelada && mov && mov.data){
      var nextLabel=cp.status==='pago' ? 'Último pagamento' : 'Próxima';
      infoCards.push(detailItem(nextLabel,_esc(_fmtDateDisplay(mov.data))));
    }
    if(st==='parcial'){
      infoCards.push(detailItem('Valor pago','<span style="color:#1F6F43;">'+_fmtVal(pago)+'</span>'));
      infoCards.push(detailItem('Saldo pendente','<span style="color:#B45309;">'+_fmtVal(pendente)+'</span>'));
    }
    if(st==='pago' && pago){
      infoCards.push(detailItem('Valor pago','<span style="color:#1F6F43;">'+_fmtVal(pago)+'</span>'));
    }
    if(resumo.descricao){
      infoCards.push(detailItem('Descrição da saída',_esc(resumo.descricao),true));
    }
    var body=
      '<div style="display:flex;flex-direction:column;gap:14px;">'+
        '<div style="'+cardStyle+'">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">'+
            '<div style="min-width:0;">'+
              '<div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;"><span class="mi" style="font-size:18px;color:#6F6860;">north_east</span><div style="font-size:13px;font-weight:650;color:#1F1F1F;">Resumo da saída</div></div>'+
              '<div style="font-size:clamp(25px,4vw,34px);line-height:1;font-weight:650;color:#1F1F1F;letter-spacing:0;">'+_fmtVal(info.valorTotalOriginal)+'</div>'+
              '<div style="margin-top:8px;font-size:13px;color:#6F6860;line-height:1.4;">'+
                (st==='parcial'
                  ? _fmtVal(pago)+' pagos · '+_fmtVal(pendente)+' pendentes'
                  : tipoLabel)+
              '</div>'+
            '</div>'+
            '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">'+
              '<span style="background:'+statusInfo.bg+';color:'+statusInfo.fg+';padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;">'+statusInfo.label+'</span>'+
              '<span style="background:#FFFCF8;border:1px solid #E8DCD7;color:#6F6860;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;">'+_esc(tipoLabel)+'</span>'+
            '</div>'+
          '</div>'+
        '</div>'+

        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">'+
          '<div style="'+cardStyle+'">'+
            _modalIconTitle('badge','Identificação','Dados usados para localizar esta saída no financeiro.')+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'+
              detailItem('Número interno',_esc(resumo.numeroInterno||'--'))+
              detailItem('Documento',_esc(resumo.numeroDocumento||'--'))+
              detailItem('Vencimento',_esc(_fmtDateDisplay(resumo.vencimento||resumo.data)))+
              detailItem('Tipo',_esc(tipoLabel))+
            '</div>'+
          '</div>'+
          '<div style="'+cardStyle+'">'+
            _modalIconTitle('payments','Pagamento','Favorecido, forma de pagamento e conta de onde o valor sai.')+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'+
              detailItem('Favorecido',_esc(resumo.favorecidoNome||'--'),true)+
              detailItem('Categoria',_esc(resumo.categoriaNome||'--'))+
              detailItem('Forma',_esc(resumo.formaPagamentoNome||'--'))+
              detailItem('Conta de saída',_esc(resumo.contaBancariaNome||'--'),true)+
            '</div>'+
          '</div>'+
        '</div>'+

        (infoCards.length
          ? '<div style="'+cardStyle+'">'+_modalIconTitle('calendar_month','Informações adicionais','Valores, parcelas e recorrências ligados a esta saída.')+'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">'+infoCards.join('')+'</div></div>'
          : '')+
        (resumo.observacao && String(resumo.observacao).trim()
          ? '<div style="'+cardStyle+'">'+_modalIconTitle('notes','Observações','Anotações internas registradas nesta saída.')+'<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:12px;font-size:13.5px;line-height:1.5;color:#1F1F1F;white-space:pre-wrap;word-break:break-word;">'+_esc(resumo.observacao)+'</div></div>'
          : '')+
      '</div>';
    var footer='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;width:100%;">'+
      '<div style="font-size:11px;color:#7A746B;">Ações disponíveis para esta saída.</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">'+
      (canManageManualCP && st==='parcial'
        ? '<button onclick="Modules.Financeiro._closeCPDetalhe();Modules.Financeiro._pagarCP(\''+cp.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:none;background:#1F8F56;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(31,143,86,.16);">Pagar restante</button>'
        : (canManageManualCP && (st==='pendente' || st==='vencido')
          ? '<button onclick="Modules.Financeiro._closeCPDetalhe();Modules.Financeiro._pagarCP(\''+cp.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:none;background:#1F8F56;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(31,143,86,.16);">Marcar como pago</button>'
          : ''))+
      (canManageManualCP && st!=='pago'
        ? '<button onclick="Modules.Financeiro._closeCPDetalhe();Modules.Financeiro._openCPModal(\''+cp.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Editar</button>'
        : '')+
      (canManageManualCP ? '<button onclick="Modules.Financeiro._deleteCP(\''+cp.id+'\')" style="height:42px;padding:0 16px;border-radius:12px;border:none;background:#FFF0EE;color:#B42318;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Excluir</button>' : '')+
      '<button onclick="Modules.Financeiro._closeCPDetalhe();" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Fechar</button>'+
      '</div>'+
    '</div>';
    window._cpDetalheModal=UI.modal({title:'Detalhes da saída',body:body,footer:footer,maxWidth:'820px'});
  }

  function _closeCPDetalhe() {
    if(window._cpDetalheModal) window._cpDetalheModal.close();
  }

  function _openCPModal(id) {
    _editingId=id;
    var cp=id?(_contasPagar.find(function(x){ return x.id===id; })||{}):{};
    var catOpts=_saidaCategoryOptions(cp.categoriaFinanceiraId||cp.categoriaId||cp.categoryId||cp.categoria||'');
    var fornecedorId=cp.fornecedorId||'';
    var fornecedorNomeAtual=cp.fornecedorNome||cp.fornecedor||'';
    if(fornecedorId&&!fornecedorNomeAtual){
      var fornAtual=(_fornecedores||[]).find(function(f){ return f.id===fornecedorId; });
      fornecedorNomeAtual=fornAtual?(fornAtual.name||fornAtual.nome||''):'';
    }
    var fOpts=_formaOptions(cp.formaPagamento||cp.forma_pagamento||'');
    var contaAtual=cp.conta_id||cp.contaBancariaId||'';
    var contaOpts=_contaBancariaOptions(contaAtual);
    var recFreq=cp.periodicidade||'mensal';
    var parcFreq=cp.periodicidadeParcelas||cp.parcelasFrequencia||'mensal';
    var statusSel=(cp.status==='pago'||cp.data_pagamento)?'pago':'pendente';
    var ehRec=!!cp.recorrente;
    var recChecked=!!cp.recorrente;
    var parcChecked=!!cp.parcelada;
    var numeroPreview=id?(cp.numeroSequencial||''):('SA-'+String((parseInt(_configFin.saidaSeq||0,10)||0)+1).padStart(6,'0'));
    var cardStyle=_modalCardStyle();
    var fieldStyle=_modalFieldStyle();
    var selectStyle=_modalSelectStyle();
    var shortField=_modalFieldStyle('max-width:160px;');
    var docField=_modalFieldStyle('max-width:220px;');
    var moneyField=_modalFieldStyle('max-width:170px;');
    var dateField=_modalFieldStyle('max-width:168px;');
    var statusOptionStyle='display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;min-height:34px;';
    var cleanCheckboxStyle='display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;min-height:32px;';
    var body=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
        '<div style="'+cardStyle+'">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">'+
            _modalIconTitle('north_east','Dados principais','Organize para quem será pago, o valor e como essa saída aparece no financeiro.').replace('margin-bottom:14px;','margin-bottom:0;')+
            '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FFFCF8;border:1px solid #E8DCD7;color:#6F6860;font-size:12px;font-weight:600;white-space:nowrap;">'+_esc(numeroPreview||'Automático')+'</span>'+
          '</div>'+
          '<div style="display:flex;flex-direction:column;gap:12px;">'+
            '<div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">'+
              '<div style="flex:0 0 160px;max-width:160px;"><label style="'+_lbl()+'">Número interno</label><input id="cp-numero" type="text" value="'+_esc(numeroPreview||'Automático')+'" readonly style="'+shortField+'background:#F7F2EF;color:#5A4E4C;font-weight:600;"></div>'+
              '<div style="flex:0 1 220px;max-width:220px;"><label style="'+_lbl()+'">Número do documento</label><input id="cp-num-doc" type="text" value="'+_esc(cp.numeroDocumento||cp.numDocumento||'')+'" placeholder="Fatura, recibo..." style="'+docField+'"></div>'+
            '</div>'+
            '<div><label style="'+_lbl()+'">Descrição da saída *</label><input id="cp-desc" type="text" value="'+_esc(cp.descricao||'')+'" placeholder="Ex.: luz, aluguel, fornecedor..." style="'+fieldStyle+'"></div>'+
            '<div style="display:flex;gap:12px;align-items:start;flex-wrap:wrap;">'+
              '<div style="flex:0 0 170px;max-width:170px;"><label style="'+_lbl()+'">Valor total *</label><input id="cp-valor" type="text" inputmode="decimal" value="'+_esc(_moneyInputDisplay(cp.valor||''))+'" placeholder="€ 0,00" onfocus="Modules.Financeiro._moneyInputFocus(this)" onblur="Modules.Financeiro._moneyInputBlur(this);Modules.Financeiro._renderCPPreviews()" oninput="Modules.Financeiro._renderCPPreviews()" style="'+moneyField+'"></div>'+
              '<div style="position:relative;flex:1 1 280px;min-width:240px;"><label style="'+_lbl()+'">Fornecedor / favorecido</label><input id="cp-forn-novo" type="text" value="'+_esc(fornecedorNomeAtual)+'" placeholder="Buscar fornecedor..." autocomplete="off" oninput="Modules.Financeiro._financePessoaSearch(\'cp\',this.value);Modules.Financeiro._renderCPPreviews()" onfocus="Modules.Financeiro._financePessoaSearch(\'cp\',this.value)" onblur="setTimeout(function(){var d=document.getElementById(\'cp-forn-dropdown\');if(d)d.style.display=\'none\';},200)" style="'+fieldStyle+'"><input id="cp-forn-id" type="hidden" value="'+_esc(fornecedorId)+'"><div id="cp-forn-dropdown" style="display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #E8DCD7;border-radius:12px;max-height:220px;overflow-y:auto;z-index:9999;box-shadow:0 14px 34px rgba(31,31,31,.12);"></div><div style="font-size:11px;color:#8A7E7C;margin-top:5px;">Para quem você está pagando.</div></div>'+
            '</div>'+
            '<div style="display:flex;gap:12px;align-items:start;flex-wrap:wrap;">'+
              '<div style="flex:1 1 260px;max-width:340px;"><label style="'+_lbl()+'">Categoria de saída *</label><select id="cp-cat" onchange="Modules.Financeiro._toggleCPNovaCat()" style="'+selectStyle+'">'+catOpts+'</select><input id="cp-cat-nova" type="text" placeholder="Nome da nova categoria..." style="'+fieldStyle+'display:none;margin-top:8px;"><div id="cp-cat-new-meta" style="display:none;grid-template-columns:minmax(130px,160px) minmax(130px,160px);gap:10px;margin-top:8px;"><div><label style="'+_lbl()+'">Tipo</label><select id="cp-cat-nature" style="'+selectStyle+'"><option value="despesa">Despesa</option><option value="custo">Custo</option></select></div><div><label style="'+_lbl()+'">Classe</label><select id="cp-cat-cost-class" style="'+selectStyle+'"><option value="indireto">Indireto</option><option value="direto">Direto</option></select></div></div><div id="cp-cat-help" style="font-size:11px;color:#8A7E7C;margin-top:5px;"></div></div>'+
              '<div style="flex:1 1 190px;max-width:260px;"><label style="'+_lbl()+'">Forma de pagamento *</label><select id="cp-forma" onchange="Modules.Financeiro._applyFormaPadraoConta(\'cp\')" style="'+selectStyle+'">'+fOpts+'</select></div>'+
              '<div style="flex:1 1 220px;max-width:300px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><label style="'+_lbl()+'margin-bottom:0;">Conta bancária</label><button type="button" onclick="Modules.Financeiro._openQuickContaModal(\'cp\')" style="border:none;background:transparent;color:#B42318;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;padding:0 0 5px;">+ conta bancária</button></div><select id="cp-conta" style="'+selectStyle+'">'+contaOpts+'</select></div>'+
            '</div>'+
          '</div>'+
        '</div>'+

        '<div style="'+cardStyle+'">'+
          '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(220px,.9fr);gap:14px;align-items:start;">'+
            '<div>'+
              _modalIconTitle('task_alt','Status da saída','Defina se a saída ainda será paga ou se já saiu do caixa.')+
              '<input type="hidden" id="cp-status" value="'+_esc(statusSel)+'">'+
              '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">'+
                '<label style="'+statusOptionStyle+'"><input type="radio" name="cp-status-radio" value="pendente" '+(statusSel==='pendente'?'checked':'')+' onchange="Modules.Financeiro._setCPStatus(\'pendente\')" style="accent-color:#B42318;width:16px;height:16px;"> A pagar</label>'+
                '<label style="'+statusOptionStyle+'"><input type="radio" name="cp-status-radio" value="pago" '+(statusSel==='pago'?'checked':'')+' onchange="Modules.Financeiro._setCPStatus(\'pago\')" style="accent-color:#B42318;width:16px;height:16px;"> Já paga</label>'+
              '</div>'+
              '<div id="cp-status-help" style="margin-top:8px;font-size:11px;color:#8A7E7C;">'+(statusSel==='pago'?'A data de pagamento é obrigatória.':'Escolha o status da saída antes de salvar.')+'</div>'+
            '</div>'+
            '<div>'+
              _modalIconTitle('event','Datas','Vencimento e baixa no caixa.')+
              '<div style="display:flex;flex-direction:column;gap:12px;">'+
                '<div><label style="'+_lbl()+'">Vencimento *</label><input id="cp-venc" type="date" value="'+_esc(cp.vencimento||_today())+'" style="'+dateField+'"></div>'+
                '<div id="cp-pago-box" style="display:'+(statusSel==='pago'?'block':'none')+';"><label style="'+_lbl()+'">Data de pagamento *</label><input id="cp-pago" type="date" value="'+_esc(cp.data_pagamento||'')+'" style="'+dateField+'"></div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+

        '<div id="cp-tipo-box" style="'+cardStyle+'">'+
          _modalIconTitle('calendar_month','Recorrência e parcelamento','Use quando a saída precisa aparecer em mais de uma data.')+
          '<div style="display:flex;flex-direction:column;gap:10px;">'+
            '<label style="'+cleanCheckboxStyle+'"><input type="checkbox" id="cp-recorrente"'+(recChecked?' checked':'')+' onchange="Modules.Financeiro._toggleCPRecorrente()" style="accent-color:#B42318;width:16px;height:16px;"> Pagamento recorrente</label>'+
            '<div id="cp-rec-box" style="display:'+(recChecked?'block':'none')+';">'+
              '<div style="display:grid;grid-template-columns:minmax(150px,180px) minmax(150px,180px) minmax(0,1fr);gap:12px;margin-bottom:12px;align-items:end;">'+
                '<div><label style="'+_lbl()+'">Frequência</label><select id="cp-periodo" onchange="Modules.Financeiro._renderCPPreviews()" style="'+selectStyle+'">'+
                  '<option value="semanal"'+(recFreq==='semanal'?' selected':'')+'>Semanal</option>'+
                  '<option value="mensal"'+(recFreq==='mensal'?' selected':'')+'>Mensal</option>'+
                  '<option value="anual"'+(recFreq==='anual'?' selected':'')+'>Anual</option>'+
                '</select></div>'+
                '<div><label style="'+_lbl()+'">Repetições *</label><input id="cp-repeticoes" type="number" min="1" value="'+_esc(cp.repeticoes||'')+'" placeholder="Ex.: 6" oninput="Modules.Financeiro._renderCPPreviews()" style="'+shortField+'"></div>'+
              '</div>'+
              '<div id="cp-rec-preview" style="margin-top:10px;"></div>'+
            '</div>'+
            '<label style="'+cleanCheckboxStyle+'"><input type="checkbox" id="cp-parcelada"'+(parcChecked?' checked':'')+' onchange="Modules.Financeiro._toggleCPParcelada()" style="accent-color:#B42318;width:16px;height:16px;"> Dividir em parcelas</label>'+
            '<div id="cp-parcelas-section" style="display:'+(parcChecked?'block':'none')+';">'+
              '<div style="display:grid;grid-template-columns:minmax(150px,180px) minmax(150px,180px) minmax(0,1fr);gap:12px;margin-bottom:12px;align-items:end;">'+
                '<div><label style="'+_lbl()+'">Parcelas *</label><input id="cp-num-parcelas" type="number" min="2" value="'+_esc(cp.numeroParcelas||'')+'" placeholder="Ex.: 3" oninput="Modules.Financeiro._renderCPPreviews()" style="'+shortField+'"></div>'+
                '<div><label style="'+_lbl()+'">Valor por parcela</label><input id="cp-valor-parcela" type="text" readonly value="" style="'+moneyField+'background:#F7F2EF;"></div>'+
                '<div><label style="'+_lbl()+'">Frequência</label><select id="cp-freq-parcelas" onchange="Modules.Financeiro._renderCPPreviews()" style="'+selectStyle+'">'+
                  '<option value="semanal"'+(parcFreq==='semanal'?' selected':'')+'>Semanal</option>'+
                  '<option value="mensal"'+(parcFreq==='mensal'?' selected':'')+'>Mensal</option>'+
                  '<option value="anual"'+(parcFreq==='anual'?' selected':'')+'>Anual</option>'+
                '</select></div>'+
              '</div>'+
              '<div id="cp-parc-preview" style="margin-top:10px;"></div>'+
            '</div>'+
          '</div>'+
        '</div>'+

        '<div style="'+cardStyle+'">'+
          _modalIconTitle('notes','Observações','Anotações internas opcionais para consulta futura.')+
          '<textarea id="cp-obs" placeholder="Opcional..." style="'+_modalFieldStyle('height:auto;min-height:82px;padding:10px 12px;resize:vertical;')+'">'+_esc(cp.observacoes||'')+'</textarea>'+
        '</div>'+
      '</div>';
    var footer=
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;width:100%;">'+
        '<div style="font-size:11px;color:#7A746B;">Revise os dados antes de salvar.</div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">'+
          '<button onclick="if(window._cpModal)window._cpModal.close();" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>'+
          '<button onclick="Modules.Financeiro._saveCP()" style="height:42px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">'+(id?'Salvar alterações':'Salvar saída')+'</button>'+
        '</div>'+
      '</div>';
    window._cpModal=UI.modal({title:id?'Editar Saída':'Nova Saída',body:body,footer:footer,maxWidth:'820px'});
    setTimeout(function(){
      _setCPStatus(statusSel||'pendente');
      _toggleCPRecorrente();
      _toggleCPParcelada();
      _toggleCPNovaCat();
      _renderCPPreviews();
    },0);
  }

  function _cpStatusSelecionado() {
    return (document.getElementById('cp-status')||{}).value||'pendente';
  }

  function _setCPStatus(status) {
    var input=document.getElementById('cp-status');
    if(input) input.value=status||'';
    var help=document.getElementById('cp-status-help');
    var pagoBox=document.getElementById('cp-pago-box');
    var pagoLabel=document.querySelector('#cp-pago-box label');
    var tipoBox=document.getElementById('cp-tipo-box');
    var rec=document.getElementById('cp-recorrente');
    var parcel=document.getElementById('cp-parcelada');
    var recBox=document.getElementById('cp-rec-box');
    var parcSec=document.getElementById('cp-parcelas-section');
    var isPago=status==='pago';
    if(help) help.textContent=isPago?'A data de pagamento é obrigatória.':'Escolha o status da saída antes de salvar.';
    if(pagoBox) pagoBox.style.display=isPago?'block':'none';
    if(pagoLabel) pagoLabel.textContent='Data de pagamento'+(isPago?' *':'');
    if(tipoBox) tipoBox.style.display=isPago?'none':'block';
    if(isPago){
      if(rec) rec.checked=false;
      if(parcel) parcel.checked=false;
      if(recBox) recBox.style.display='none';
      if(parcSec) parcSec.style.display='none';
    } else {
      if(recBox) recBox.style.display=rec&&rec.checked?'block':'none';
      if(parcSec) parcSec.style.display=parcel&&parcel.checked?'block':'none';
    }
  }

  function _toggleCPRecorrente() {
    var checked=!!(document.getElementById('cp-recorrente')||{}).checked;
    var recBox=document.getElementById('cp-rec-box');
    var parcel=document.getElementById('cp-parcelada');
    var parcSec=document.getElementById('cp-parcelas-section');
    if(checked && parcel) parcel.checked=false;
    if(checked && parcSec) parcSec.style.display='none';
    if(recBox) recBox.style.display=checked?'block':'none';
    _renderCPPreviews();
  }

  function _toggleCPParcelada() {
    var sec=document.getElementById('cp-parcelas-section');
    var checked=!!(document.getElementById('cp-parcelada')||{}).checked;
    var rec=document.getElementById('cp-recorrente');
    var recSec=document.getElementById('cp-rec-box');
    if(checked && rec) rec.checked=false;
    if(checked && recSec) recSec.style.display='none';
    if(sec) sec.style.display=checked?'block':'none';
    _renderCPPreviews();
  }

  function _toggleCPNovoForn() {
    var sel=document.getElementById('cp-forn-id');
    var inp=document.getElementById('cp-forn-novo');
    if(inp) inp.style.display=(sel&&sel.value==='__novo__')?'block':'none';
  }

  function _toggleCPNovaCat() {
    var sel=document.getElementById('cp-cat');
    var inp=document.getElementById('cp-cat-nova');
    var meta=document.getElementById('cp-cat-new-meta');
    var help=document.getElementById('cp-cat-help');
    var isNova=!!(sel&&sel.value==='__nova__');
    if(inp) inp.style.display=isNova?'block':'none';
    if(meta) meta.style.display=isNova?'grid':'none';
    if(help){
      var cat=!isNova&&sel?_findSaidaCategory(sel.value):null;
      help.textContent=isNova
        ? 'Escolha se essa nova categoria entra como despesa ou custo, direto ou indireto.'
        : (cat ? (_catNatureLabel(cat)+' '+_catClassLabel(cat).toLowerCase()+'.') : '');
    }
  }

  function _addPeriodo(data, freq, idx) {
    var d=_parseLocalDate(data);
    if(!d) return '';
    if(freq==='semanal') d.setDate(d.getDate()+(idx*7));
    else if(freq==='anual') d.setFullYear(d.getFullYear()+idx);
    else d.setMonth(d.getMonth()+idx);
    return _dateToYMD(d);
  }

  function _cpPreviewCard(title, items) {
    return '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:10px 12px;">'+
      '<div style="font-size:11px;font-weight:600;color:#8A7E7C;text-transform:uppercase;margin-bottom:8px;">'+_esc(title)+'</div>'+
      (items.length
        ? '<div style="display:flex;flex-direction:column;gap:6px;">'+items.join('')+'</div>'
        : '<div style="font-size:12px;color:#8A7E7C;">Preencha os campos para ver o preview.</div>')+
    '</div>';
  }

  function _renderCPPreviews() {
    var recBox=document.getElementById('cp-rec-preview');
    var parcBox=document.getElementById('cp-parc-preview');
    var rec=!!(document.getElementById('cp-recorrente')||{}).checked;
    var parc=!!(document.getElementById('cp-parcelada')||{}).checked;
    if(recBox){
      if(!rec){ recBox.innerHTML=''; recBox.style.display='none'; }
      else {
        recBox.style.display='block';
        var inicio=(document.getElementById('cp-venc')||{}).value||'';
        var reps=_parseNum((document.getElementById('cp-repeticoes')||{}).value);
        var freq=(document.getElementById('cp-periodo')||{}).value||'mensal';
        var itens=[];
        if(inicio&&reps>0){
          for(var i=0;i<Math.min(reps,8);i++){
            itens.push('<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#374151;"><span>'+_esc('Recorrência '+(i+1))+'</span><strong style="font-weight:700;">'+_esc(_addPeriodo(inicio,freq,i))+'</strong></div>');
          }
          if(reps>8) itens.push('<div style="font-size:11px;color:#8A7E7C;">... e mais '+(reps-8)+' ocorrências</div>');
        }
        recBox.innerHTML=_cpPreviewCard('Recorrências a criar', itens);
      }
    }
    if(parcBox){
      if(!parc){ parcBox.innerHTML=''; parcBox.style.display='none'; }
      else {
        parcBox.style.display='block';
        var total=_parseNum((document.getElementById('cp-valor')||{}).value);
        var n=_parseNum((document.getElementById('cp-num-parcelas')||{}).value);
        var primeira=(document.getElementById('cp-venc')||{}).value||'';
        var freqP=(document.getElementById('cp-freq-parcelas')||{}).value||'mensal';
        var outParcela=document.getElementById('cp-valor-parcela');
        var itensP=[];
        if(total>0&&n>1&&primeira){
          var valorParcela=total/n;
          if(outParcela) outParcela.value=_fmtVal(valorParcela);
          for(var j=0;j<Math.min(n,8);j++){
            var val=j===n-1?+(total-(valorParcela*(n-1))).toFixed(2):+valorParcela.toFixed(2);
            itensP.push('<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#374151;"><span>'+_esc('Parcela '+(j+1)+' de '+n)+'</span><strong style="font-weight:700;">'+_esc(_fmtVal(val))+' · '+_esc(_addPeriodo(primeira,freqP,j))+'</strong></div>');
          }
          if(n>8) itensP.push('<div style="font-size:11px;color:#8A7E7C;">... e mais '+(n-8)+' parcelas</div>');
        }
        if(outParcela && !(total>0&&n>1)) outParcela.value='';
        parcBox.innerHTML=_cpPreviewCard('Parcelas a criar', itensP);
      }
    }
  }

  function _saveCP() {
    var isNewCP=!_editingId;
    var desc=((document.getElementById('cp-desc')||{}).value||'').trim();
    var valor=_parseNum((document.getElementById('cp-valor')||{}).value);
    if(!desc){ UI.toast('Descrição obrigatória','error'); return; }
    if(valor<=0){ UI.toast('Valor deve ser maior que zero','error'); return; }
    var status=_cpStatusSelecionado();
    if(status!=='pendente'&&status!=='pago'){ UI.toast('Selecione o status da saída','error'); return; }
    var rec=!!(document.getElementById('cp-recorrente')||{}).checked;
    var cat=(document.getElementById('cp-cat')||{}).value||'';
    var novaCat=((document.getElementById('cp-cat-nova')||{}).value||'').trim();
    var forma=(document.getElementById('cp-forma')||{}).value||'';
    var contaId=(document.getElementById('cp-conta')||{}).value||'';
    var numeroAtual=((document.getElementById('cp-numero')||{}).value||'').trim();
    var numeroDoc=((document.getElementById('cp-num-doc')||{}).value||'').trim();
    if(!cat){ UI.toast('Categoria de saída obrigatória','error'); return; }
    if(cat==='__nova__'&&!novaCat){ UI.toast('Informe o nome da nova categoria','error'); return; }
    if(!forma){ UI.toast('Forma de pagamento obrigatória','error'); return; }
    var formaCfg=_formasPagFull(true).find(function(f){ return (f.nome||'')===forma; });
    if(!contaId&&formaCfg&&formaCfg.contaPadraoId) contaId=formaCfg.contaPadraoId;
    if(!contaId&&formaCfg&&(_globalPaymentRequiresAccount(formaCfg.tipoGlobalId || formaCfg.tipoGlobalSlug || formaCfg.tipo || '') || formaCfg.exigeConta)){ UI.toast('Conta bancária obrigatória para esta forma de pagamento','error'); return; }
    if(status==='pago'&&!contaId){ UI.toast('Informe a conta bancária usada para registrar a saída paga','error'); return; }
    var novoForn=((document.getElementById('cp-forn-novo')||{}).value||'').trim();
    var fornIdSel=(document.getElementById('cp-forn-id')||{}).value||'';
    var fornExistente=fornIdSel?(_fornecedores||[]).find(function(f){ return f.id===fornIdSel; }):(novoForn?(_fornecedores||[]).find(function(f){ return String(f.name||f.nome||'').toLowerCase()===novoForn.toLowerCase(); }):null);
    var fornId=fornExistente?fornExistente.id:'';
    var parcelada=!!(document.getElementById('cp-parcelada')||{}).checked;
    if(rec&&parcelada){ UI.toast('Escolha recorrente ou parcelada, não os dois','error'); return; }
    var vencimento=(document.getElementById('cp-venc')||{}).value||'';
    if(!vencimento){ UI.toast('Informe a data de vencimento da saída','error'); return; }
    var dataPagamento=(document.getElementById('cp-pago')||{}).value||null;
    if(status==='pendente') dataPagamento=null;
    if(status==='pago' && !dataPagamento){ UI.toast('Informe a data de pagamento','error'); return; }
    var repeticoes=_parseNum((document.getElementById('cp-repeticoes')||{}).value);
    if(rec && repeticoes<1){ UI.toast('Informe o número de repetições','error'); return; }
    var catMeta=cat==='__nova__'?null:_findSaidaCategory(cat);
    var newCatNature=(document.getElementById('cp-cat-nature')||{}).value||'despesa';
    var newCatCostClass=(document.getElementById('cp-cat-cost-class')||{}).value||'indireto';
    var categoriaNome=cat==='__nova__'?novaCat:(catMeta?(catMeta.nome||catMeta.name||cat):cat);
    var categoriaNature=cat==='__nova__'?newCatNature:_catNature(catMeta||{tipo:'saida'});
    var categoriaCostClass=cat==='__nova__'?newCatCostClass:_catCostClass(catMeta||{tipo:'saida'});
    var fornecedorNome=fornExistente?(fornExistente.name||fornExistente.nome||''):(novoForn||'');
    var obj={
      descricao:desc, valor:valor,
      valorTotalOriginal:valor,
      valorParcela:valor,
      valorPago:status==='pago'?valor:0,
      saldoRestante:status==='pago'?0:valor,
      vencimento:vencimento,
      data_inicial:rec?vencimento:'',
      data_pagamento:status==='pago'?dataPagamento:null,
      categoria:categoriaNome,
      categoriaId:catMeta?(catMeta.id||''):'',
      categoriaFinanceiraId:catMeta?(catMeta.id||''):'',
      categoriaFinanceiraNome:categoriaNome,
      financialNature:categoriaNature,
      categoriaFinanceiraNatureza:categoriaNature,
      costClass:categoriaCostClass,
      categoriaFinanceiraCostClass:categoriaCostClass,
      formaPagamento:forma,
      forma_pagamento:forma,
      conta_id:contaId,
      contaBancariaId:contaId,
      numeroSequencial:(numeroAtual&&numeroAtual!=='Automático')?numeroAtual:'',
      numeroDocumento:numeroDoc,
      numDocumento:numeroDoc,
      fornecedorId:fornId,
      fornecedorNome:fornecedorNome,
      fornecedor:fornecedorNome||'',
      status:status,
      recorrente:rec,
      periodicidade:rec?((document.getElementById('cp-periodo')||{}).value||'mensal'):null,
      repeticoes:rec?repeticoes:0,
      data_final:'',
      parcelada:parcelada,
      observacoes:(document.getElementById('cp-obs')||{}).value||'',
      updatedAt:new Date().toISOString()
    };
    if(!_editingId) obj.createdAt=new Date().toISOString();
    var savedCpId=_editingId||'';
    var saveCat=(cat==='__nova__')?DB.add('financeiro_categorias',{nome:novaCat,tipo:'saida',financialNature:categoriaNature,costClass:categoriaCostClass}).then(function(ref){
      obj.categoriaId=(ref&&ref.id)||'';
      obj.categoriaFinanceiraId=(ref&&ref.id)||'';
      return ref;
    }):Promise.resolve();
    saveCat.then(function(){
      if(novoForn&&!fornExistente){
        return DB.add('fornecedores',{name:novoForn,nome:novoForn,ativo:true}).then(function(ref){
          obj.fornecedorId=(ref&&ref.id)||'';
          obj.fornecedorNome=novoForn;
          obj.fornecedor=novoForn;
        });
      }
      return null;
    }).then(function(){
      if(!_editingId){
        return _nextNumeroSequencial('saida').then(function(num){ obj.numeroSequencial=num; });
      }
      return null;
    }).then(function(){
      if(rec&&!_editingId){
        var freqRec=(document.getElementById('cp-periodo')||{}).value||'mensal';
        var serieId='recorrencia-'+Date.now();
        var opsRec=[];
        for(var r=1;r<=repeticoes;r++){
          var valorRec=valor;
          opsRec.push(DB.add('contas_pagar',Object.assign({},obj,{
            valor:valorRec,
            valorParcela:valorRec,
            valorTotalOriginal:valor,
            valorPago:0,
            saldoRestante:valorRec,
            vencimento:_addPeriodo(vencimento,freqRec,r-1),
            data_inicial:vencimento,
            data_pagamento:null,
            status:'pendente',
            recorrente:true,
            recorrenciaId:serieId,
            contaOriginalId:serieId,
            createdAt:new Date().toISOString(),
            updatedAt:new Date().toISOString()
          })));
        }
        return Promise.all(opsRec);
      }
      if(parcelada&&!_editingId){
        var n=_parseNum((document.getElementById('cp-num-parcelas')||{}).value);
        var total=valor;
        var primeira=(document.getElementById('cp-venc')||{}).value||obj.vencimento;
        var freq=(document.getElementById('cp-freq-parcelas')||{}).value||'mensal';
        if(n<2||!total||!primeira){ UI.toast('Preencha os dados do parcelamento','error'); throw new Error('parcelamento inválido'); }
        var parcelamentoId='parcelamento-'+Date.now();
        var valorParcela=+(total/n).toFixed(2);
        var ops=[];
        for(var i=1;i<=n;i++){
          var valorAtual=i===n?+(total-(valorParcela*(n-1))).toFixed(2):valorParcela;
          ops.push(DB.add('contas_pagar',Object.assign({},obj,{
            descricao:desc+' ('+i+'/'+n+')',
            valor:valorAtual,
            valorTotalOriginal:total,
            valorParcela:valorAtual,
            valorPago:0,
            saldoRestante:valorAtual,
            vencimento:_addPeriodo(primeira,freq,i-1),
            data_pagamento:null,
            status:'pendente',
            parcelada:true,
            parcelaNumero:i,
            numeroParcelas:n,
            periodicidadeParcelas:freq,
            parcelasFrequencia:freq,
            valorTotal:total,
            parcelamentoId:parcelamentoId,
            contaOriginalId:parcelamentoId
          })));
        }
        return Promise.all(ops);
      }
      if(status==='pago') obj.data_pagamento=dataPagamento;
      if(_editingId){
        return DB.getDoc('contas_pagar',_editingId).then(function(existing){
          if(!existing){
            _contasPagar=_contasPagar.filter(function(cp){ return cp.id!==_editingId; });
            if(window._cpModal) window._cpModal.close();
            UI.toast('Esta conta a pagar não existe mais ou já foi removida. A lista foi atualizada.','warning');
            _loadContasPagar();
            var e2=new Error('conta_nao_existe'); e2._handled=true; throw e2;
          }
          return DB.update('contas_pagar',_editingId,obj).then(function(){
            savedCpId=_editingId;
            return null;
          });
        });
      }
      return DB.add('contas_pagar',Object.assign({},obj,{
        status:status,
        data_pagamento:status==='pago'?dataPagamento:null
      })).then(function(ref){
        savedCpId=String((ref&&ref.id)||'');
        return null;
      });
    }).then(function(){
      if(status==='pago'&&savedCpId){
        return _syncPaidCPMovement(savedCpId,Object.assign({},obj,{id:savedCpId,_colecao:'contas_pagar'}),'contas_pagar');
      }
      return null;
    }).then(function(){
      UI.toast('Saída salva!','success');
      if(window._cpModal) window._cpModal.close();
      if(isNewCP) _resetCPDefaultListState();
      _loadContasPagar();
    }).catch(function(e){ if(!e._handled) UI.toast('Erro: '+e.message,'error'); });
  }

  function _pagarCP(id) {
    var cp=_contasPagar.find(function(x){ return x.id===id; });
    if(!cp) return;
    var info=_cpValorInfo(cp);
    var pago=info.valorPago;
    var pendente=info.saldoRestante;
    var movExistente=_cpMovPagamento(cp);
    var contaPreSel=cp.conta_id||cp.contaId||cp.conta_bancaria_id||cp.contaBancariaId||(movExistente&&movExistente.conta_id)||'';
    var contasAtivas=(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; });
    if(!contaPreSel&&contasAtivas.length===1) contaPreSel=contasAtivas[0].id;
    var contaOpts='<option value="">Selecionar conta...</option>'+contasAtivas.map(function(c){ return '<option value="'+c.id+'"'+(contaPreSel===c.id?' selected':'')+'>'+_esc(c.nome)+'</option>'; }).join('');
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#FAF8F4;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">'+
        '<div><div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:5px;">Saldo pendente</div><div style="font-size:24px;font-weight:700;color:#B42318;line-height:1;">'+_fmtVal(pendente)+'</div></div>'+
        '<div style="font-size:12px;color:#6F6860;line-height:1.4;max-width:250px;">Confirme o valor, a data e a conta usada para registrar a baixa.</div>'+
      '</div>'+
      '<div style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
      '<div style="'+_g3()+'">'+
        '<div><label style="'+_lbl()+'">Valor pago *</label><input id="cp-pay-valor" type="text" inputmode="decimal" value="'+_esc(_moneyInputDisplay(pendente))+'" onfocus="Modules.Financeiro._moneyInputFocus(this)" onblur="Modules.Financeiro._moneyInputBlur(this)" style="'+_inp()+'"></div>'+
        '<div><label style="'+_lbl()+'">Data do pagamento *</label><input id="cp-pay-data" type="date" value="'+_today()+'" style="'+_inp()+'"></div>'+
        '<div><label style="'+_lbl()+'">Conta de saída *</label><select id="cp-pay-conta" style="'+_inp()+'background:#fff;">'+contaOpts+'</select></div>'+
      '</div>'+
      '</div>'+
    '</div>';
    var footer='<div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;width:100%;">'+
      '<button onclick="if(window._cpPayModal)window._cpPayModal.close();" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button>'+
      '<button onclick="Modules.Financeiro._savePagamentoCP(\''+id+'\')" style="height:40px;padding:0 16px;border-radius:12px;border:none;background:#16A34A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(22,163,74,.16);">Confirmar saída</button>'+
    '</div>';
    window._cpPayModal=UI.modal({title:'Confirmar saída',body:body,footer:footer,maxWidth:'560px'});
  }

  function _savePagamentoCP(id) {
    var cp=_contasPagar.find(function(x){ return x.id===id; });
    if(!cp) return;
    var colecao=cp._colecao||'contas_pagar'; // contas_pagar ou financeiro_apagar
    var valorPago=_parseNum((document.getElementById('cp-pay-valor')||{}).value);
    var data=(document.getElementById('cp-pay-data')||{}).value||'';
    var contaId=(document.getElementById('cp-pay-conta')||{}).value||'';
    var info=_cpValorInfo(cp);
    var dueTotal=_cpPayableTotal(cp,info);
    var jaPago=info.valorPago;
    var pendente=info.saldoRestante || Math.max(0,dueTotal-jaPago);
    if(!valorPago||valorPago<=0){ UI.toast('Informe o valor pago','error'); return; }
    if(!data){ UI.toast('Informe a data do pagamento','error'); return; }
    if(!contaId){ UI.toast('Informe a conta bancária usada','error'); return; }
    if(valorPago>pendente) valorPago=pendente;
    var totalPago=jaPago+valorPago;
    var parcial=totalPago<dueTotal;
    // Proteção anti-duplicidade: verificar se já existe movimentação efetivada para este item
    var jaRegistrado=(_movimentacoes||[]).some(function(m){
      return m.tipo==='saida'&&m.status==='efetivado'&&(
        (m.sourceCollection===colecao&&m.sourceId===id)||m.contaPagarId===id
      );
    });
    if(jaRegistrado&&jaPago<=0&&!parcial){
      UI.toast('Este pagamento já foi registrado anteriormente.','warning');
      return;
    }
    var meta=_financialMetaFromRecord(cp);
    var formaPagamento=cp.formaPagamento||cp.forma_pagamento||'';
    var mov={
      tipo:'saida',
      descricao:'Pagamento: '+(cp.descricao||'Saída'),
      valor:valorPago,
      valorTotalOriginal:valorPago,
      valorParcela:valorPago,
      valorPago:valorPago,
      saldoRestante:0,
      data:data,
      categoria:meta.categoriaNome||cp.categoria||'',
      categoriaId:meta.categoriaId,
      categoriaFinanceiraId:meta.categoriaId,
      categoriaFinanceiraNome:meta.categoriaNome,
      financialNature:meta.financialNature,
      categoriaFinanceiraNatureza:meta.financialNature,
      costClass:meta.costClass,
      categoriaFinanceiraCostClass:meta.costClass,
      conta_id:contaId,
      contaBancariaId:contaId,
      forma_pagamento:formaPagamento,
      formaPagamento:formaPagamento,
      status:'efetivado',
      origem:cp._origemFinanceira||'conta_a_pagar',
      sourceCollection:colecao,
      sourceId:id,
      contaPagarId:id,
      compraId:cp.compraId||'',
      parcelaNumero:cp.parcelaNumero||null,
      totalParcelas:cp.numeroParcelas||cp.totalParcelas||null,
      pessoaTipo:cp.fornecedorId||cp.fornecedorNome||cp.fornecedor?'fornecedor':'nenhum',
      pessoaId:cp.fornecedorId||'',
      pessoaNome:cp.fornecedorNome||cp.fornecedor||'',
      updatedAt:new Date().toISOString()
    };
    // Verificar existência na coleção de origem ANTES de registrar qualquer movimentação
    DB.getDoc(colecao,id).then(function(existing){
      if(!existing){
        _contasPagar=_contasPagar.filter(function(x){ return x.id!==id; });
        if(window._cpPayModal) window._cpPayModal.close();
        UI.toast('Esta conta a pagar não existe mais ou já foi removida. A lista foi atualizada.','warning');
        _loadContasPagar();
        var e2=new Error('conta_nao_existe'); e2._handled=true; throw e2;
      }
      // Conta existe — registrar movimentação e atualizar na coleção de origem
      return DB.add('movimentacoes',mov).then(function(){
        var saldoAtual=Math.max(0,dueTotal-totalPago);
        var upd={valorPago:totalPago,valor_pago_total:totalPago,saldoRestante:saldoAtual,saldo_restante:saldoAtual,ultimo_pagamento:data,conta_id:contaId,contaBancariaId:contaId,status:parcial?'parcial':'pago',updatedAt:new Date().toISOString()};
        if(!parcial) upd.data_pagamento=data;
        return DB.update(colecao,id,upd);
      });
    }).then(function(){
      if(window._cpPayModal) window._cpPayModal.close();
      if(parcial){
        UI.confirm('Esta saída não foi paga integralmente. Deseja gerar uma nova parcela com o saldo restante?').then(function(yes){
          if(yes) _openSaldoRestanteModal(id,Math.max(0,dueTotal-totalPago));
          else { UI.toast('Saída parcial registrada','success'); _loadContasPagar(); }
        });
      } else {
        UI.toast('Saída confirmada e movimentação gerada','success');
        _loadContasPagar();
      }
    }).catch(function(e){ if(!e._handled) UI.toast('Erro: '+e.message,'error'); });
  }

  function _openSaldoRestanteModal(id,saldo) {
    window._cpSaldoRestante={id:id,saldo:saldo};
    var body='<div><div style="font-size:13px;color:#8A7E7C;margin-bottom:12px;">Saldo restante da saída: <strong style="color:#DC2626;">'+_fmtVal(saldo)+'</strong></div>'+
      '<div style="margin-bottom:12px;"><label style="'+_lbl()+'">Como programar o saldo?</label><select id="cp-rest-modo" onchange="Modules.Financeiro._toggleSaldoRestanteModo()" style="'+_inp()+'background:#fff;">'+
        '<option value="unico">Pagar de uma vez</option><option value="parcelar">Parcelar saldo</option>'+
      '</select></div>'+
      '<div id="cp-rest-unico"><label style="'+_lbl()+'">Novo vencimento *</label><input id="cp-rest-venc" type="date" value="'+_today()+'" style="'+_inp()+'"></div>'+
      '<div id="cp-rest-parcelar" style="display:none;grid-template-columns:1fr 1fr 1fr;gap:10px;">'+
        '<div><label style="'+_lbl()+'">Parcelas *</label><input id="cp-rest-parcelas" type="number" min="2" value="2" style="'+_inp()+'"></div>'+
        '<div><label style="'+_lbl()+'">Primeiro vencimento *</label><input id="cp-rest-primeiro" type="date" value="'+_today()+'" style="'+_inp()+'"></div>'+
        '<div><label style="'+_lbl()+'">Frequência</label><select id="cp-rest-freq" style="'+_inp()+'background:#fff;"><option value="mensal">Mensal</option><option value="semanal">Semanal</option></select></div>'+
      '</div></div>';
    var footer='<button onclick="Modules.Financeiro._criarSaldoRestanteCP()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Programar saldo restante</button>';
    window._cpRestModal=UI.modal({title:'Saldo restante da saída',body:body,footer:footer,maxWidth:'560px'});
  }

  function _toggleSaldoRestanteModo() {
    var modo=(document.getElementById('cp-rest-modo')||{}).value||'unico';
    var unico=document.getElementById('cp-rest-unico');
    var parcelar=document.getElementById('cp-rest-parcelar');
    if(unico) unico.style.display=modo==='unico'?'block':'none';
    if(parcelar) parcelar.style.display=modo==='parcelar'?'grid':'none';
  }

  function _cpPayableTotal(cp, info) {
    info = info || _cpValorInfo(cp || {});
    return _parseNum(cp && (cp.valorParcela || cp.valor_parcela || cp.valor)) || info.valorParcela || info.valorRow || info.valorTotalOriginal || 0;
  }

  function _syncPaidCPMovement(cpId, cp, colecao) {
    cpId = String(cpId || '');
    if (!cpId || !cp) return Promise.resolve(false);
    colecao = colecao || cp._colecao || 'contas_pagar';
    var info = _cpValorInfo(cp);
    var dueTotal = _cpPayableTotal(cp, info);
    var paidValue = _parseNum(cp.valorPago || cp.valor_pago_total) || dueTotal;
    if (!(paidValue > 0)) return Promise.resolve(false);
    var data = cp.data_pagamento || cp.ultimo_pagamento || cp.data || _today();
    var meta = _financialMetaFromRecord(cp);
    var payload = {
      tipo: 'saida',
      descricao: 'Pagamento: ' + (cp.descricao || 'Saída'),
      valor: paidValue,
      valorTotalOriginal: paidValue,
      valorParcela: paidValue,
      valorPago: paidValue,
      saldoRestante: 0,
      data: data,
      categoria: meta.categoriaNome || cp.categoria || '',
      categoriaId: meta.categoriaId,
      categoriaFinanceiraId: meta.categoriaId,
      categoriaFinanceiraNome: meta.categoriaNome,
      financialNature: meta.financialNature,
      categoriaFinanceiraNatureza: meta.financialNature,
      costClass: meta.costClass,
      categoriaFinanceiraCostClass: meta.costClass,
      conta_id: cp.conta_id || cp.contaBancariaId || '',
      forma_pagamento: cp.formaPagamento || cp.forma_pagamento || '',
      status: 'efetivado',
      origem: cp._origemFinanceira || 'conta_a_pagar',
      sourceCollection: colecao,
      sourceId: cpId,
      contaPagarId: cpId,
      compraId: cp.compraId || '',
      parcelaNumero: cp.parcelaNumero || null,
      totalParcelas: cp.numeroParcelas || cp.totalParcelas || null,
      pessoaTipo: cp.fornecedorId || cp.fornecedorNome || cp.fornecedor ? 'fornecedor' : 'nenhum',
      pessoaId: cp.fornecedorId || '',
      pessoaNome: cp.fornecedorNome || cp.fornecedor || '',
      updatedAt: new Date().toISOString()
    };
    var found = (_movimentacoes || []).find(function (m) {
      return m && m.tipo === 'saida' && ((m.sourceCollection === colecao && String(m.sourceId || '') === cpId) || String(m.contaPagarId || '') === cpId);
    });
    if (found && found.id) return DB.update('movimentacoes', found.id, payload).then(function () { return true; });
    return DB.add('movimentacoes', payload).then(function () { return true; });
  }

  function _criarSaldoRestanteCP() {
    var data=window._cpSaldoRestante||{};
    var cp=_contasPagar.find(function(x){ return x.id===data.id; });
    var modo=(document.getElementById('cp-rest-modo')||{}).value||'unico';
    if(!cp){ UI.toast('Conta original não encontrada','error'); return; }
    var base={
      data_pagamento:null,
      status:'pendente',
      valor_pago_total:0,
      valorPago:0,
      saldoRestante:data.saldo,
      valorTotalOriginal:data.saldo,
      valorParcela:data.saldo,
      contaOriginalId:cp.contaOriginalId||cp.parcelamentoId||cp.id,
      parcelaOrigemId:cp.id,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    var op;
    if(modo==='parcelar'){
      var n=_parseNum((document.getElementById('cp-rest-parcelas')||{}).value);
      var primeira=(document.getElementById('cp-rest-primeiro')||{}).value||'';
      var freq=(document.getElementById('cp-rest-freq')||{}).value||'mensal';
      if(n<2||!primeira){ UI.toast('Informe parcelas e primeiro vencimento','error'); return; }
      var parcelamentoId='saldo-restante-'+Date.now();
      var valorParcela=+(data.saldo/n).toFixed(2);
      var ops=[];
      for(var i=1;i<=n;i++){
        ops.push(DB.add('contas_pagar',Object.assign({},cp,base,{
          descricao:(cp.descricao||'Saída')+' - saldo restante ('+i+'/'+n+')',
          valor:i===n?+(data.saldo-(valorParcela*(n-1))).toFixed(2):valorParcela,
          valorTotalOriginal:data.saldo,
          valorParcela:i===n?+(data.saldo-(valorParcela*(n-1))).toFixed(2):valorParcela,
          valorPago:0,
          saldoRestante:i===n?+(data.saldo-(valorParcela*(n-1))).toFixed(2):valorParcela,
          vencimento:_addPeriodo(primeira,freq,i-1),
          parcelada:true,
          parcelaNumero:i,
          numeroParcelas:n,
          valorTotal:data.saldo,
          parcelamentoId:parcelamentoId
        })));
      }
      op=Promise.all(ops);
    } else {
      var venc=(document.getElementById('cp-rest-venc')||{}).value||'';
      if(!venc){ UI.toast('Informe o novo vencimento','error'); return; }
      op=DB.add('contas_pagar',Object.assign({},cp,base,{
        descricao:(cp.descricao||'Saída')+' - saldo restante',
        valor:data.saldo,
        valorTotalOriginal:data.saldo,
        valorParcela:data.saldo,
        valorPago:0,
        saldoRestante:data.saldo,
        vencimento:venc
      }));
    }
    op.then(function(){
      if(window._cpRestModal) window._cpRestModal.close();
      UI.toast('Saldo restante programado','success');
      _loadContasPagar();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _deleteCP(id) {
    var cp=(_contasPagar||[]).find(function(x){ return x.id===id; });
    if(cp && cp._colecao && cp._colecao!=='contas_pagar'){
      UI.toast('Esta saída foi gerada por outro módulo e não pode ser excluída pelo Financeiro.','error');
      return;
    }
    if(cp && (_statusCP(cp)==='pago' || _statusCP(cp)==='parcial')){
      UI.toast('Não é possível excluir uma saída paga ou parcial. Use estorno/cancelamento para manter o histórico financeiro.','error');
      return;
    }
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#FFF0EE;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:flex;gap:14px;align-items:flex-start;">'+
        '<div style="width:42px;height:42px;border-radius:14px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">delete</span></div>'+
        '<div style="min-width:0;">'+
          '<div style="font-size:15px;font-weight:800;color:#1F1F1F;line-height:1.25;">Excluir esta saída?</div>'+
          '<div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:5px;">Esta ação remove o registro manual de contas a pagar. Saídas pagas ou geradas por outros módulos continuam protegidas.</div>'+
        '</div>'+
      '</div>'+
      '<div style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);">'+
        '<div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;">Saída selecionada</div>'+
        '<div style="font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.35;word-break:break-word;">'+_esc((cp&&cp.descricao)||'Sem descrição')+'</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">'+
          '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:600;">'+_esc((cp&&cp.numeroSequencial)||'Sem número')+'</span>'+
          '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#B42318;font-size:12px;font-weight:700;">'+_fmtVal(_parseNum(cp&&cp.valor))+'</span>'+
        '</div>'+
      '</div>'+
    '</div>';
    var footer='<div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;width:100%;">'+
      '<button onclick="if(window._cpDeleteModal)window._cpDeleteModal.close();" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Cancelar</button>'+
      '<button onclick="Modules.Financeiro._confirmDeleteCP(\''+id+'\')" style="height:40px;padding:0 16px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);">Excluir saída</button>'+
    '</div>';
    window._cpDeleteModal=UI.modal({title:'Excluir saída',body:body,footer:footer,maxWidth:'520px'});
  }

  function _confirmDeleteCP(id) {
    DB.remove('contas_pagar',id).then(function(){
      if(window._cpDeleteModal) window._cpDeleteModal.close();
      if(window._cpDetalheModal) window._cpDetalheModal.close();
      UI.toast('Eliminado','info');
      _loadContasPagar();
    });
  }

  // ── CONTAS BANCÁRIAS ──────────────────────────────────────────────────────
  function _loadContasBancarias() {
    Promise.all([DB.getAll('contas_bancarias'),_loadMovimentacoesData(),DB.getSystemConfig(),DB.getDocRoot('config','geral').catch(function(){ return {}; })]).then(function(r){
      _contasBancarias=r[0]||[]; _movimentacoes=r[1]||[]; _systemConfig=r[2]||{}; _configGeral=r[3]||{};
      _paintContasBancarias();
    });
  }

  function _contaResumo(c) {
    var ent=(_movimentacoes||[]).filter(function(m){ return m.conta_id===c.id&&m.tipo==='entrada'&&m.status==='efetivado'; }).reduce(function(s,m){ return s+_parseNum(m.valor); },0);
    var sai=(_movimentacoes||[]).filter(function(m){ return m.conta_id===c.id&&m.tipo==='saida'&&m.status==='efetivado'; }).reduce(function(s,m){ return s+_parseNum(m.valor); },0);
    return { saldo:_saldoConta(c), entradas:ent, saidas:sai };
  }

  function _contaCardHtml(c) {
    var r=_contaResumo(c);
    var saldoColor=r.saldo>=0?'#1F6F43':'#B42318';
    var isTpvCash=!!(c.tpvDefault || c.systemKey==='tpv_cash');
    var physical=isTpvCash?_cashPhysicalBalance(c.id):0;
    var neutralRows=isTpvCash?_cashNeutralMovements(c.id).slice(0,3):[];
    return '<div style="'+_cfgCardStyle('16px 16px')+(c.ativo===false?'opacity:.58;':'')+'transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.055)\';this.style.background=\'linear-gradient(180deg,#fff 0%,#FFFCFA 100%)\'">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">'+
        '<div style="min-width:0;">'+
          '<div style="font-size:15px;font-weight:700;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_esc(c.nome||'Conta')+'</div>'+
          '<div style="font-size:12px;color:#6F6860;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+
            _esc([c.tipoGlobalNome || c.tipo, c.banco].filter(Boolean).join(' · ') || 'Sem banco informado')+
          '</div>'+
        '</div>'+
        '<div style="display:flex;gap:6px;flex-shrink:0;">'+
          _cfgIconButton('sync_alt','Transferir','#F4EFEA','#8A6F5A','Modules.Financeiro._openTransferModal(\''+c.id+'\')')+
          _cfgIconButton('edit','Editar','#fff','#6F6860','Modules.Financeiro._openContaModal(\''+c.id+'\')')+
          _cfgIconButton('delete','Excluir','#FFF0EE','#B42318','Modules.Financeiro._deleteConta(\''+c.id+'\')')+
        '</div>'+
      '</div>'+
      '<div style="font-size:28px;font-weight:700;color:'+saldoColor+';line-height:1;margin-bottom:14px;">'+_fmtVal(r.saldo)+'</div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">'+
        '<div style="background:#FFFCF8;border:1px solid #EADFD8;border-radius:12px;padding:9px 10px;min-width:0;"><div style="font-size:10px;color:#6F6860;font-weight:650;text-transform:uppercase;">Inicial</div><div style="font-size:13px;font-weight:700;color:#1F1F1F;margin-top:3px;">'+_fmtVal(c.saldo_inicial)+'</div></div>'+
        '<div style="background:#F0FFF4;border:1px solid #D5F3DF;border-radius:12px;padding:9px 10px;min-width:0;"><div style="font-size:10px;color:#1F6F43;font-weight:650;text-transform:uppercase;">Entradas</div><div style="font-size:13px;font-weight:700;color:#1F6F43;margin-top:3px;">+'+_fmtVal(r.entradas)+'</div></div>'+
        '<div style="background:#FFF5F5;border:1px solid #F4D8D4;border-radius:12px;padding:9px 10px;min-width:0;"><div style="font-size:10px;color:#B42318;font-weight:650;text-transform:uppercase;">Saídas</div><div style="font-size:13px;font-weight:700;color:#B42318;margin-top:3px;">-'+_fmtVal(r.saidas)+'</div></div>'+
      '</div>'+
      (isTpvCash
        ? '<div style="margin-top:10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">'+
            '<div style="background:#FFF9EC;border:1px solid #F4E3B8;border-radius:12px;padding:9px 10px;min-width:0;"><div style="font-size:10px;color:#8A6400;font-weight:650;text-transform:uppercase;">Físico no caixa</div><div style="font-size:13px;font-weight:700;color:#1F1F1F;margin-top:3px;">'+_fmtVal(physical)+'</div></div>'+
            '<div style="background:#F8F7F4;border:1px solid #E6DDD3;border-radius:12px;padding:9px 10px;min-width:0;"><div style="font-size:10px;color:#6F6860;font-weight:650;text-transform:uppercase;">Na conta</div><div style="font-size:13px;font-weight:700;color:#1F1F1F;margin-top:3px;">'+_fmtVal(r.saldo-physical)+'</div></div>'+
          '</div>'+
          (neutralRows.length
            ? '<div style="margin-top:10px;border-top:1px solid #F2EDEA;padding-top:9px;display:flex;flex-direction:column;gap:7px;">'+neutralRows.map(function(m){ return '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;font-size:11px;color:#6F6860;"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(_cashMovementLabel(m))+' · '+_esc(_fmtDateDisplay(m.data))+'</span><strong style="font-weight:650;color:'+_cashMovementColor(m)+';">'+(_cashMovementDirection(m)==='out'?'-':'+')+_fmtVal(m.valor)+'</strong></div>'; }).join('')+'</div>'
            : '')+
          '<div style="margin-top:9px;font-size:11px;color:#8A7E7C;line-height:1.35;">Abertura, reforço e sangria mostram onde está o dinheiro desta conta. Não entram como receita ou despesa.</div>'
        : '')+
      (c.ativo===false?'<div style="margin-top:12px;font-size:11px;font-weight:600;color:#6F6860;background:#FFFCF8;border:1px solid #EADFD8;border-radius:999px;padding:5px 9px;display:inline-block;">Conta inativa</div>':'')+
    '</div>';
  }

  function _cashNeutralMovements(accountId) {
    return (_movimentacoes || []).filter(function (m) {
      return String(m.conta_id || m.contaBancariaId || '') === String(accountId || '') && String(m.tipo || '') === 'caixa_fisico';
    }).sort(function (a, b) {
      return String(b.createdAt || b.data || '').localeCompare(String(a.createdAt || a.data || ''));
    });
  }

  function _cashPhysicalBalance(accountId) {
    return _cashNeutralMovements(accountId).reduce(function (sum, m) {
      return sum + (_cashMovementDirection(m) === 'out' ? -_parseNum(m.valor) : _parseNum(m.valor));
    }, 0);
  }

  function _cashMovementDirection(m) {
    return String(m && (m.cashMovementDirection || m.direction) || '') === 'out' || String(m && m.cashMovementType || '') === 'sangria' ? 'out' : 'in';
  }

  function _cashMovementLabel(m) {
    var type=String(m && m.cashMovementType || '');
    if(type==='abertura') return 'Abertura do caixa';
    if(type==='reforco') return 'Reforço';
    if(type==='sangria') return 'Sangria';
    return m && m.descricao || 'Movimento do caixa';
  }

  function _cashMovementColor(m) {
    return _cashMovementDirection(m)==='out'?'#B45309':'#1F6F43';
  }

  function _contasCardsHtml(emptyPadding) {
    var contas=(_contasBancarias||[]).slice().sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); });
    if(!contas.length){
      return '<div style="'+_cfgCardStyle(emptyPadding||'52px 20px')+'text-align:center;color:#6F6860;">'+
        '<div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:5px;">Nenhuma conta bancária cadastrada</div>'+
        '<div style="font-size:13px;line-height:1.45;margin-bottom:14px;">Adicione uma conta para acompanhar saldos, entradas e saídas.</div>'+
        _cfgPrimaryButton('+ Nova Conta','Modules.Financeiro._openContaModal(null)')+
      '</div>';
    }
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;">'+
      contas.map(_contaCardHtml).join('')+
    '</div>';
  }

  function _paintContasBancarias() {
    var content=document.getElementById('fin-content'); if(!content) return;
    var st=_saldoTotal();
    content.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">'+
        '<div><h2 style="font-size:18px;font-weight:800;margin-bottom:4px;">Contas Bancárias</h2>'+
          '<p style="font-size:12px;color:#8A7E7C;">Saldo total: <strong style="color:'+(st>=0?'#16A34A':'#DC2626')+';">'+_fmtVal(st)+'</strong></p></div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">'+
          '<button onclick="Modules.Financeiro._openTransferModal()" style="height:38px;padding:0 14px;border:1px solid #EADFD8;border-radius:12px;background:#fff;color:#8A6F5A;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(31,31,31,.04);display:inline-flex;align-items:center;gap:7px;"><span class="mi" style="font-size:18px;">sync_alt</span> Transferir</button>'+
          '<button onclick="Modules.Financeiro._openContaModal(null)" style="background:#C4362A;color:#fff;border:none;padding:0 18px;height:38px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">+ Nova Conta</button>'+
        '</div>'+
      '</div>'+
      _contasCardsHtml('60px 20px');
  }

  function _globalFinanceCountryLabel(country) {
  const value = String(country || '').toLowerCase().trim();

  if (
    value === 'es' ||
    value === 'espana' ||
    value === 'españa' ||
    value === 'spain'
  ) {
    return 'Espanha';
  }

  if (
    value === 'pt' ||
    value === 'portugal'
  ) {
    return 'Portugal';
  }

  if (
    value === 'both' ||
    value === 'ambos' ||
    value === 'ambos_paises' ||
    value === 'ambos_os_paises' ||
    value === 'ambos-os-paises'
  ) {
    return 'Ambos os países';
  }

  return 'Geral';
}
function _openContaModal(id) {
    _editingId=id;
    var c=id?(_contasBancarias.find(function(x){ return x.id===id; })||{}):{};
    var selectedType = c.tipoGlobalId || c.tipoGlobalSlug || c.tipo || '';
    var bankTypes = _globalFinanceList('bank', false).filter(function(t){ return _globalTypeCountryOk(t.countryFiscal, _tenantFiscalCountry()); });
    var tOpts = bankTypes.map(function (t) {
      var selected = selectedType && (String(t.id) === String(selectedType) || String(t.slug) === String(selectedType) || String(t.name) === String(selectedType));
      return '<option value="'+_esc(t.id)+'" data-slug="'+_esc(t.slug)+'" data-name="'+_esc(t.name)+'" data-country="'+_esc(t.countryFiscal)+'"'+(selected?' selected':'')+'>'+_esc(t.name)+'</option>';
    }).join('');
    if (selectedType && !bankTypes.some(function (t) { return String(t.id) === String(selectedType) || String(t.slug) === String(selectedType) || String(t.name) === String(selectedType); })) {
      tOpts += '<option value="'+_esc(selectedType)+'" selected>'+_esc(c.tipoGlobalNome || c.tipo || selectedType)+' (legado)</option>';
    }
    if(!tOpts) tOpts='<option value="corrente" selected>Conta corrente</option>';
    var cardStyle=_modalCardStyle();
    var fieldStyle=_modalFieldStyle();
    var selectStyle=_modalSelectStyle();
    var moneyField=_modalFieldStyle('max-width:170px;');
    var cleanCheckboxStyle='display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;min-height:32px;';
    var body=
      '<div style="display:flex;flex-direction:column;gap:14px;">'+
        '<div style="'+cardStyle+'">'+
          _modalIconTitle('account_balance_wallet','Dados da conta','Cadastre onde o dinheiro entra ou sai para organizar caixa, pagamentos e recebimentos.')+
          '<div style="display:flex;flex-direction:column;gap:12px;">'+
            '<div><label style="'+_lbl()+'">Nome da conta *</label><input id="cb-nome" type="text" value="'+_esc(c.nome||'')+'" placeholder="Ex: Conta principal, Caixa..." style="'+fieldStyle+'"></div>'+
            '<div style="display:grid;grid-template-columns:minmax(220px,1fr) minmax(170px,.55fr);gap:12px;align-items:end;">'+
              '<div><label style="'+_lbl()+'">Banco / Instituição</label><input id="cb-banco" type="text" value="'+_esc(c.banco||'')+'" placeholder="Ex: Caixa, Millennium..." style="'+fieldStyle+'"></div>'+
              '<div style="max-width:220px;"><label style="'+_lbl()+'">Tipo</label><select id="cb-tipo" style="'+selectStyle+'max-width:220px;">'+tOpts+'</select></div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="'+cardStyle+'">'+
          _modalIconTitle('tune','Uso no financeiro','Defina o saldo inicial e se esta conta aparece disponível nos lançamentos.')+
          '<div style="display:flex;align-items:end;gap:18px;flex-wrap:wrap;">'+
            '<div style="flex:0 0 170px;max-width:170px;"><label style="'+_lbl()+'">Saldo inicial</label><input id="cb-saldo" type="text" value="'+_esc(c.saldo_inicial!=null?c.saldo_inicial:'')+'" placeholder="€ 0,00" style="'+moneyField+'"></div>'+
            '<label style="'+cleanCheckboxStyle+'"><input type="checkbox" id="cb-ativo"'+(c.ativo!==false?' checked':'')+' style="width:16px;height:16px;cursor:pointer;accent-color:#B42318;"> <span>Conta ativa</span></label>'+
          '</div>'+
        '</div>'+
      '</div>';
    var footer='<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;width:100%;"><div style="font-size:11px;color:#7A746B;">Revise os dados antes de salvar.</div><div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;"><button onclick="if(window._contaModal)window._contaModal.close();" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button><button onclick="Modules.Financeiro._saveConta()" style="height:42px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">Salvar alterações</button></div></div>';
    window._contaModal=UI.modal({title:id?'Editar conta bancária':'Nova conta bancária',body:body,footer:footer,maxWidth:'720px'});
  }

  function _refreshContasBancariasView() {
    if(_activeSub==='configuracoes'){
      _cfgSub='contas-bancarias';
      return _loadConfiguracoes();
    }
    return _loadContasBancarias();
  }

  function _saveConta() {
    var nome=((document.getElementById('cb-nome')||{}).value||'').trim();
    if(!nome){ UI.toast('Nome obrigatório','error'); return; }
    var tipoSel = document.getElementById('cb-tipo') || {};
    var selectedOption = tipoSel.selectedOptions && tipoSel.selectedOptions[0] ? tipoSel.selectedOptions[0] : null;
    var tipoId = (tipoSel.value || '').trim();
    var globalTipo = _globalTypeResolve('bank', tipoId, true) || (selectedOption ? _globalTypeResolve('bank', selectedOption.dataset.slug || selectedOption.dataset.name || selectedOption.textContent || '', true) : null);
    var obj={
      nome:nome,
      banco:(document.getElementById('cb-banco')||{}).value||'',
      tipo: globalTipo ? (globalTipo.name || globalTipo.nome || tipoId) : tipoId,
      tipoGlobalId: globalTipo ? globalTipo.id : (tipoId || ''),
      tipoGlobalSlug: globalTipo ? globalTipo.slug : (selectedOption ? (selectedOption.dataset.slug || '') : ''),
      tipoGlobalNome: globalTipo ? globalTipo.name : (selectedOption ? (selectedOption.dataset.name || tipoId) : tipoId),
      tipoGlobalCountry: globalTipo ? globalTipo.countryFiscal : (selectedOption ? (selectedOption.dataset.country || 'ambos') : 'ambos'),
      saldo_inicial:_parseNum((document.getElementById('cb-saldo')||{}).value),
      ativo:!!(document.getElementById('cb-ativo')||{}).checked,
      updatedAt:new Date().toISOString()
    };
    if(!_editingId) obj.createdAt=new Date().toISOString();
    (_editingId?DB.update('contas_bancarias',_editingId,obj):DB.add('contas_bancarias',obj)).then(function(){
      UI.toast('Conta bancária salva!','success');
      if(window._contaModal) window._contaModal.close();
      _refreshContasBancariasView();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _deleteConta(id) {
    var relacionadosMov=(_movimentacoes||[]).filter(function(m){ return m.conta_id===id || m.contaBancariaId===id || _transferTouchesAccount(m,id); }).length;
    var relacionadosCP=(_contasPagar||[]).filter(function(cp){ return cp.conta_id===id || cp.contaId===id || cp.conta_bancaria_id===id || cp.contaBancariaId===id; }).length;
    var totalRelacionados=relacionadosMov+relacionadosCP;
    if(totalRelacionados>0){
      UI.toast('Não é possível excluir: esta conta possui '+totalRelacionados+' lançamento(s) associado(s).','error');
      return;
    }
    UI.confirm('Eliminar esta conta? Movimentações associadas não serão apagadas.').then(function(yes){
      if(!yes) return;
      DB.remove('contas_bancarias',id).then(function(){ UI.toast('Eliminado','info'); _refreshContasBancariasView(); });
    });
  }

  function _openTransferModal(originId) {
    var contas=(_contasBancarias||[]).filter(function(c){ return c.ativo!==false; }).slice().sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); });
    if(contas.length<2){ UI.toast('Cadastre pelo menos duas contas ativas para fazer transferência.','warning'); return; }
    var selectedOrigin=originId&&contas.some(function(c){ return String(c.id)===String(originId); })?String(originId):'';
    var options=function(selected, excludeId, placeholder){
      return '<option value="">'+_esc(placeholder||'Selecionar conta')+'</option>'+contas.filter(function(c){ return String(c.id)!==String(excludeId||''); }).map(function(c){ return '<option value="'+_esc(c.id)+'"'+(String(selected||'')===String(c.id)?' selected':'')+'>'+_esc(c.nome||'Conta')+'</option>'; }).join('');
    };
    var cardStyle=_modalCardStyle();
    var fieldStyle=_modalFieldStyle();
    var selectStyle=_modalSelectStyle();
    var moneyField=_modalFieldStyle('max-width:170px;');
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="'+cardStyle+'">'+
        _modalIconTitle('sync_alt','Transferência entre contas','Use quando o dinheiro sai de uma conta e entra em outra. Isso não vira receita nem despesa.')+
        '<div style="display:grid;grid-template-columns:minmax(220px,1fr) minmax(220px,1fr);gap:12px;align-items:end;">'+
          '<div><label style="'+_lbl()+'">Conta de origem *</label><select id="fin-transfer-origin" onchange="Modules.Financeiro._refreshTransferAccounts()" style="'+selectStyle+'">'+options(selectedOrigin,'','De onde sai')+'</select></div>'+
          '<div><label style="'+_lbl()+'">Conta de destino *</label><select id="fin-transfer-dest" style="'+selectStyle+'">'+options('',selectedOrigin,'Para onde entra')+'</select></div>'+
        '</div>'+
      '</div>'+
      '<div style="'+cardStyle+'">'+
        _modalIconTitle('payments','Valor e data','Informe o valor transferido e quando a movimentação aconteceu.')+
        '<div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">'+
          '<div style="flex:0 0 170px;max-width:170px;"><label style="'+_lbl()+'">Valor *</label><input id="fin-transfer-value" type="text" placeholder="€ 0,00" style="'+moneyField+'"></div>'+
          '<div style="flex:0 0 170px;max-width:170px;"><label style="'+_lbl()+'">Data *</label><input id="fin-transfer-date" type="date" value="'+_esc(_today())+'" style="'+_modalFieldStyle('max-width:170px;')+'"></div>'+
        '</div>'+
      '</div>'+
      '<div style="'+cardStyle+'">'+
        _modalIconTitle('notes','Observação','Use para registrar o motivo da transferência, se precisar consultar depois.')+
        '<input id="fin-transfer-note" type="text" placeholder="Ex.: sangria para banco, ajuste de caixa..." style="'+fieldStyle+'">'+
      '</div>'+
    '</div>';
    var footer='<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;width:100%;"><div style="font-size:11px;color:#7A746B;">A transferência ajusta apenas o saldo das contas.</div><div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;"><button onclick="if(window._transferModal)window._transferModal.close();" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button><button onclick="Modules.Financeiro._saveTransfer()" style="height:42px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">Salvar transferência</button></div></div>';
    window._transferModal=UI.modal({title:'Transferir entre contas',body:body,footer:footer,maxWidth:'760px'});
  }

  function _refreshTransferAccounts() {
    var origin=(document.getElementById('fin-transfer-origin')||{}).value||'';
    var dest=document.getElementById('fin-transfer-dest');
    if(!dest) return;
    var current=dest.value||'';
    var contas=(_contasBancarias||[]).filter(function(c){ return c.ativo!==false && String(c.id)!==String(origin); }).slice().sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); });
    dest.innerHTML='<option value="">Para onde entra</option>'+contas.map(function(c){ return '<option value="'+_esc(c.id)+'"'+(String(current)===String(c.id)?' selected':'')+'>'+_esc(c.nome||'Conta')+'</option>'; }).join('');
  }

  function _saveTransfer() {
    var originId=(document.getElementById('fin-transfer-origin')||{}).value||'';
    var destId=(document.getElementById('fin-transfer-dest')||{}).value||'';
    var value=_parseNum((document.getElementById('fin-transfer-value')||{}).value);
    var date=(document.getElementById('fin-transfer-date')||{}).value||_today();
    var note=((document.getElementById('fin-transfer-note')||{}).value||'').trim();
    if(!originId){ UI.toast('Selecione a conta de origem.','error'); return; }
    if(!destId){ UI.toast('Selecione a conta de destino.','error'); return; }
    if(String(originId)===String(destId)){ UI.toast('Origem e destino precisam ser contas diferentes.','error'); return; }
    if(!(value>0)){ UI.toast('Informe um valor maior que zero.','error'); return; }
    var origin=(_contasBancarias||[]).find(function(c){ return String(c.id)===String(originId); })||{};
    var dest=(_contasBancarias||[]).find(function(c){ return String(c.id)===String(destId); })||{};
    var now=new Date().toISOString();
    var payload={
      tipo:'transferencia',
      status:'efetivado',
      descricao:note||('Transferência de '+(origin.nome||'conta de origem')+' para '+(dest.nome||'conta de destino')),
      valor:value,
      data:date,
      contaOrigemId:originId,
      contaOrigemNome:origin.nome||'',
      contaDestinoId:destId,
      contaDestinoNome:dest.nome||'',
      neutral:true,
      affectsFinancialResult:false,
      origem:'transferencia_contas',
      createdAt:now,
      updatedAt:now
    };
    DB.add('movimentacoes',payload).then(function(){
      UI.toast('Transferência registrada.','success');
      if(window._transferModal) window._transferModal.close();
      if(_activeSub==='configuracoes') _loadConfiguracoes();
      else _loadContasBancarias();
    }).catch(function(e){ UI.toast('Erro ao salvar transferência: '+(e&&e.message?e.message:e),'error'); });
  }

  // ── COMPRAS ───────────────────────────────────────────────────────────────
  var UNID_MAP = { g: ['g','Kg'], ml: ['ml','L'] };

  function _toBase(qty, purchaseUnit, baseUnit) {
    if (purchaseUnit==='Kg' && baseUnit==='g')  return qty * 1000;
    if (purchaseUnit==='L'  && baseUnit==='ml') return qty * 1000;
    return qty;
  }
  function _custoPorBase(unitPrice, purchaseUnit, baseUnit) {
    // ex: €4/Kg → €0.004/g
    if (purchaseUnit==='Kg' && baseUnit==='g')  return unitPrice / 1000;
    if (purchaseUnit==='L'  && baseUnit==='ml') return unitPrice / 1000;
    return unitPrice;
  }

  function _loadCompras() {
    Promise.all([DB.getAll('compras'), DB.getAll('fornecedores'), DB.getAll('itens_custo')]).then(function(r){
      _compras=r[0]||[]; _fornecedores=r[1]||[]; _itensCusto=r[2]||[];
      _paintCompras();
    });
  }

  function _paintCompras() {
    var content=document.getElementById('fin-content'); if(!content) return;
    var sorted=_compras.slice().sort(function(a,b){ return (b.data||'').localeCompare(a.data||''); });
    var totalGasto=_compras.reduce(function(s,c){ return s+_parseNum(c.total); },0);
    content.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'+
        '<div><h2 style="font-size:18px;font-weight:800;margin-bottom:4px;">Compras</h2>'+
          '<p style="font-size:12px;color:#8A7E7C;">Total gasto: <strong style="color:#DC2626;">'+_fmtVal(totalGasto)+'</strong> em '+_compras.length+' compra(s)</p></div>'+
        '<button onclick="Modules.Financeiro._openCompraModal(null)" style="background:#C4362A;color:#fff;border:none;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">+ Registar Compra</button>'+
      '</div>'+
      (sorted.length===0
        ?'<div style="text-align:center;padding:60px 20px;color:#8A7E7C;"><div style="font-size:14px;font-weight:600;">Nenhuma compra registada</div><div style="font-size:12px;margin-top:6px;">Ao registar uma compra, o custo atual dos insumos é atualizado automaticamente.</div></div>'
        :'<div style="background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden;">'+
            '<table style="width:100%;border-collapse:collapse;">'+
              '<thead><tr style="background:#F8F6F5;">'+
                '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Data</th>'+
                '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Fornecedor</th>'+
                '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Itens</th>'+
                '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Nº Doc.</th>'+
                '<th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Total</th>'+
                '<th style="padding:10px 6px;"></th>'+
              '</tr></thead><tbody>'+
              sorted.map(function(c){
                var forn=_fornecedores.find(function(f){ return f.id===c.fornecedorId; });
                var nItens=(c.items||[]).length;
                return '<tr style="border-top:1px solid #F2EDED;" onmouseover="this.style.background=\'#FAFAF9\'" onmouseout="this.style.background=\'\'">'+
                  '<td style="padding:10px 14px;font-size:13px;color:#6B7280;">'+_esc(c.data||'—')+'</td>'+
                  '<td style="padding:10px 14px;font-size:13px;font-weight:600;">'+_esc(forn?(forn.nome||forn.name||''):'—')+'</td>'+
                  '<td style="padding:10px 14px;font-size:12px;color:#8A7E7C;">'+nItens+' insumo'+(nItens!==1?'s':'')+'</td>'+
                  '<td style="padding:10px 14px;font-size:12px;color:#8A7E7C;">'+_esc(c.numDoc||'—')+'</td>'+
                  '<td style="padding:10px 14px;text-align:right;font-size:14px;font-weight:800;color:#DC2626;">'+_fmtVal(c.total)+'</td>'+
                  '<td style="padding:10px 6px;text-align:right;white-space:nowrap;">'+
                    '<button onclick="Modules.Financeiro._openCompraModal(\''+c.id+'\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#EEF4FF;color:#3B82F6;cursor:pointer;margin-right:4px;"><span class="mi" style="font-size:13px;">edit</span></button>'+
                    '<button onclick="Modules.Financeiro._deleteCompra(\''+c.id+'\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#FFF0EE;color:#C4362A;cursor:pointer;"><span class="mi" style="font-size:13px;">delete</span></button>'+
                  '</td></tr>';
              }).join('')+'</tbody></table></div>');
  }

  function _openCompraModal(id) {
    _editingId=id;
    var c=id?(_compras.find(function(x){ return x.id===id; })||{}):{};
    window._compraItemCount=0;
    var fornOpts='<option value="">Sem fornecedor</option>'+_fornecedores.map(function(f){ return '<option value="'+f.id+'"'+(c.fornecedorId===f.id?' selected':'')+'>'+_esc(f.nome||f.name||'')+'</option>'; }).join('');
    // build insumo options string once
    window._compraInsOpts='<option value="">Selecionar insumo...</option>'+_itensCusto.filter(function(i){ return i.ativo!==false&&i.classe!=='produto'; }).map(function(i){ return '<option value="'+i.id+'" data-base="'+_esc(i.unidade_base||'un')+'">'+_esc(i.nome)+'</option>'; }).join('');
    var itemsHtml=(c.items||[]).map(function(item){
      var idx=window._compraItemCount++;
      return _renderCompraLinha(idx,item);
    }).join('');

    var body=
      '<div>'+
        '<div style="'+_g3()+'">'+
          '<div><label style="'+_lbl()+'">Data *</label><input id="cp2-data" type="date" value="'+_esc(c.data||_today())+'" style="'+_inp()+'"></div>'+
          '<div><label style="'+_lbl()+'">Fornecedor</label><select id="cp2-forn" style="'+_inp()+'background:#fff;">'+fornOpts+'</select></div>'+
          '<div><label style="'+_lbl()+'">Nº Documento</label><input id="cp2-numdoc" type="text" value="'+_esc(c.numDoc||'')+'" placeholder="Fatura, recibo..." style="'+_inp()+'"></div>'+
        '</div>'+
        '<div style="overflow-x:auto;margin-bottom:8px;">'+
          '<table style="width:100%;border-collapse:collapse;min-width:560px;">'+
            '<thead><tr style="background:#F8F6F5;">'+
              '<th style="padding:7px 10px;font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;text-align:left;min-width:180px;">Insumo</th>'+
              '<th style="padding:7px 10px;font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;text-align:left;width:80px;">Qtd</th>'+
              '<th style="padding:7px 10px;font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;text-align:left;width:70px;">Unidade</th>'+
              '<th style="padding:7px 10px;font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;text-align:left;width:100px;">Preço/unidade</th>'+
              '<th style="padding:7px 10px;font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;text-align:left;width:80px;">Total</th>'+
              '<th style="padding:7px 6px;width:30px;"></th>'+
            '</tr></thead>'+
            '<tbody id="cp2-items">'+itemsHtml+'</tbody>'+
          '</table>'+
        '</div>'+
        '<button type="button" onclick="Modules.Financeiro._addCompraLinha()" style="width:100%;padding:9px;border-radius:9px;border:1.5px dashed #D4C8C6;background:transparent;font-size:13px;font-weight:600;cursor:pointer;color:#8A7E7C;font-family:inherit;margin-bottom:12px;">+ Adicionar item</button>'+
        '<div style="'+_g2()+'">'+
          '<div><label style="'+_lbl()+'">Observações</label><textarea id="cp2-obs" placeholder="Opcional..." style="'+_inp()+'min-height:50px;resize:vertical;">'+_esc(c.observacoes||'')+'</textarea></div>'+
          '<div style="background:#F8F6F5;border-radius:10px;padding:12px;display:flex;flex-direction:column;justify-content:center;">'+
            '<div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;">Total da compra</div>'+
            '<div id="cp2-total-display" style="font-size:22px;font-weight:800;color:#DC2626;">€ 0,00</div>'+
          '</div>'+
        '</div>'+
        '<div style="background:#EFF6FF;border-radius:10px;padding:10px;font-size:12px;color:#1D4ED8;">'+
          'Ao salvar, o <strong>custo atual</strong> de cada insumo será atualizado automaticamente com o preço por unidade base.'+
        '</div>'+
      '</div>';
    var footer='<button onclick="Modules.Financeiro._saveCompra()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">'+(id?'Atualizar Compra':'Registar Compra')+'</button>';
    window._compraModal=UI.modal({title:id?'Editar Compra':'Nova Compra',body:body,footer:footer,maxWidth:'700px'});
    setTimeout(function(){ _calcCompraTotal(); },60);
  }

  function _renderCompraLinha(idx, item) {
    item=item||{};
    var ins=item.insumoId?_itensCusto.find(function(i){ return i.id===item.insumoId; }):null;
    var baseUnit=ins?(ins.unidade_base||'un'):'un';
    var unidOpts=_getUnidOpts(baseUnit,item.unit||baseUnit);
    var opts=(window._compraInsOpts||'').replace('value="'+item.insumoId+'"','value="'+item.insumoId+'" selected');
    return '<tr id="cp2-row-'+idx+'" style="border-top:1px solid #F2EDED;">'+
      '<td style="padding:5px 8px;"><select data-cp2-ins="'+idx+'" onchange="Modules.Financeiro._onCompraInsChange('+idx+')" style="width:100%;padding:6px 8px;border:1.5px solid #D4C8C6;border-radius:8px;font-size:12px;font-family:inherit;outline:none;">'+opts+'</select></td>'+
      '<td style="padding:5px 8px;"><input type="text" data-cp2-qty="'+idx+'" value="'+_esc(item.qty||'')+'" placeholder="0" oninput="Modules.Financeiro._calcCompraLinha('+idx+')" style="width:70px;padding:6px 8px;border:1.5px solid #D4C8C6;border-radius:8px;font-size:12px;font-family:inherit;outline:none;"></td>'+
      '<td style="padding:5px 8px;"><select data-cp2-unit="'+idx+'" onchange="Modules.Financeiro._calcCompraLinha('+idx+')" style="width:70px;padding:6px 8px;border:1.5px solid #D4C8C6;border-radius:8px;font-size:12px;font-family:inherit;outline:none;background:#fff;">'+unidOpts+'</select></td>'+
      '<td style="padding:5px 8px;"><input type="text" data-cp2-price="'+idx+'" value="'+_esc(item.unitPrice||'')+'" placeholder="0,00" oninput="Modules.Financeiro._calcCompraLinha('+idx+')" style="width:90px;padding:6px 8px;border:1.5px solid #D4C8C6;border-radius:8px;font-size:12px;font-family:inherit;outline:none;"></td>'+
      '<td id="cp2-linetotal-'+idx+'" style="padding:5px 8px;font-size:12px;font-weight:700;color:#DC2626;white-space:nowrap;">—</td>'+
      '<td style="padding:5px 6px;"><button type="button" onclick="Modules.Financeiro._removeCompraLinha('+idx+')" style="width:24px;height:24px;border-radius:6px;border:none;background:#FFF0EE;color:#C4362A;cursor:pointer;font-size:11px;">✕</button></td>'+
    '</tr>';
  }

  function _getUnidOpts(baseUnit, selectedUnit) {
    var opts=UNID_MAP[baseUnit]||[baseUnit==='unidade'?'un':baseUnit];
    return opts.map(function(u){ return '<option value="'+u+'"'+(selectedUnit===u?' selected':'')+'>'+u+'</option>'; }).join('');
  }

  function _onCompraInsChange(idx) {
    var sel=document.querySelector('[data-cp2-ins="'+idx+'"]'); if(!sel) return;
    var opt=sel.options[sel.selectedIndex];
    var baseUnit=(opt&&opt.dataset.base)||'un';
    var unitSel=document.querySelector('[data-cp2-unit="'+idx+'"]');
    if(unitSel) unitSel.innerHTML=_getUnidOpts(baseUnit,baseUnit);
    _calcCompraLinha(idx);
  }

  function _calcCompraLinha(idx) {
    var qty=_parseNum((document.querySelector('[data-cp2-qty="'+idx+'"]')||{}).value);
    var price=_parseNum((document.querySelector('[data-cp2-price="'+idx+'"]')||{}).value);
    var total=qty*price;
    var el=document.getElementById('cp2-linetotal-'+idx);
    if(el) el.textContent=total>0?_fmtVal(total):'—';
    _calcCompraTotal();
  }

  function _calcCompraTotal() {
    var total=0;
    document.querySelectorAll('[data-cp2-qty]').forEach(function(el){
      var idx=el.dataset.cp2Qty;
      var qty=_parseNum(el.value);
      var price=_parseNum((document.querySelector('[data-cp2-price="'+idx+'"]')||{}).value);
      total+=qty*price;
    });
    var disp=document.getElementById('cp2-total-display');
    if(disp) disp.textContent=_fmtVal(total);
  }

  function _addCompraLinha() {
    var tbody=document.getElementById('cp2-items'); if(!tbody) return;
    var idx=window._compraItemCount||0;
    window._compraItemCount=idx+1;
    tbody.insertAdjacentHTML('beforeend',_renderCompraLinha(idx,{}));
  }

  function _removeCompraLinha(idx) {
    var el=document.getElementById('cp2-row-'+idx); if(el) el.remove();
    _calcCompraTotal();
  }

  function _saveCompra() {
    var data=(document.getElementById('cp2-data')||{}).value||_today();
    var fornecedorId=(document.getElementById('cp2-forn')||{}).value||'';
    var numDoc=((document.getElementById('cp2-numdoc')||{}).value||'').trim();
    var obs=((document.getElementById('cp2-obs')||{}).value||'').trim();
    var items=[]; var total=0;
    document.querySelectorAll('[data-cp2-ins]').forEach(function(sel){
      var idx=sel.dataset.cp2Ins;
      var insumoId=sel.value; if(!insumoId) return;
      var qty=_parseNum((document.querySelector('[data-cp2-qty="'+idx+'"]')||{}).value);
      if(qty<=0) return;
      var unit=(document.querySelector('[data-cp2-unit="'+idx+'"]')||{}).value||'';
      var unitPrice=_parseNum((document.querySelector('[data-cp2-price="'+idx+'"]')||{}).value);
      var ins=_itensCusto.find(function(i){ return i.id===insumoId; });
      var baseUnit=ins?(ins.unidade_base||'un'):'un';
      var custoBase=_custoPorBase(unitPrice,unit,baseUnit);
      var linTotal=qty*unitPrice;
      total+=linTotal;
      items.push({insumoId:insumoId,supplyName:ins?ins.nome:'',qty:qty,unit:unit,baseUnit:baseUnit,unitPrice:unitPrice,custoBase:custoBase,total:linTotal});
    });
    if(items.length===0){ UI.toast('Adicione pelo menos 1 item','error'); return; }
    var obj={data:data,fornecedorId:fornecedorId,numDoc:numDoc,observacoes:obs,items:items,total:total,updatedAt:new Date().toISOString()};
    if(!_editingId) obj.createdAt=new Date().toISOString();
    var compraId=_editingId;
    (_editingId?DB.update('compras',_editingId,obj):DB.add('compras',obj)).then(function(ref){
      var cid=compraId||(ref&&ref.id)||'';
      // Atualizar custo_atual em cada insumo
      var updates=items.map(function(item){
        var upd={custo_atual:item.custoBase,ultima_compra_data:data,ultima_compra_id:cid,updatedAt:new Date().toISOString()};
        if(fornecedorId) upd.fornecedor_padrao_id=fornecedorId;
        return DB.update('itens_custo',item.insumoId,upd);
      });
      return Promise.all(updates);
    }).then(function(){
      UI.toast('Compra registada e custos atualizados!','success');
      if(window._compraModal) window._compraModal.close();
      _loadCompras();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _deleteCompra(id) {
    UI.confirm('Eliminar esta compra? Os custos dos insumos NÃO serão revertidos.').then(function(yes){
      if(!yes) return;
      DB.remove('compras',id).then(function(){ UI.toast('Eliminado','info'); _loadCompras(); });
    });
  }

  // ── CONFIGURAÇÕES ─────────────────────────────────────────────────────────
  var _cfgSub='categorias';

  function _loadConfiguracoes() {
    Promise.all([DB.getAll('financeiro_categorias'),DB.getDocRoot('config','financeiro'),DB.getDocRoot('config','geral'),DB.getDocRoot('config','custos'),DB.getAll('contas_bancarias'),_loadMovimentacoesData(),DB.getAll('compras'),DB.getSystemConfig(),DB.getDocRoot('config','tpv').catch(function(){ return {}; })]).then(function(r){
      _categorias=r[0]||[]; _setConfigFin(r[1]); _configGeral=r[2]||{}; window._configCustos=r[3]||{}; _contasBancarias=r[4]||[]; _movimentacoes=r[5]||[]; _compras=r[6]||[]; _systemConfig=r[7]||{};
      if(_cfgSub==='fornecedores') _cfgSub='categorias';
      return _ensureTpvCashAccountVisible(r[8] || {}).then(function(){ _paintConfiguracoes(); });
    });
  }

  function _ensureTpvCashAccountVisible(tpvConfig) {
    var enabled = !!(tpvConfig && (tpvConfig.enabled === true || tpvConfig.tpvEnabled === true || tpvConfig.active === true));
    if (!enabled) return Promise.resolve(false);
    var existingId = String((tpvConfig && (tpvConfig.cashAccountId || tpvConfig.tpvCashAccountId)) || '').trim();
    var accounts = Array.isArray(_contasBancarias) ? _contasBancarias : [];
    var account = existingId ? accounts.find(function (item) { return String(item.id || '') === existingId; }) : null;
    if (!account) {
      account = accounts.find(function (item) {
        var name = _simpleKey(item && (item.nome || item.name || ''));
        return !!(item && (item.tpvDefault === true || item.systemKey === 'tpv_cash' || name === 'caixa-venda-presencial'));
      });
    }
    if (account && account.id) {
      if (!existingId || String(tpvConfig.cashAccountName || '') !== String(account.nome || account.name || '')) {
        return DB.setDocRoot('config','tpv',{ cashAccountId:String(account.id), cashAccountName:account.nome || account.name || 'Caixa venda presencial', updatedAt:new Date().toISOString() }).then(function(){ return true; }).catch(function(){ return false; });
      }
      return Promise.resolve(true);
    }
    var now = new Date().toISOString();
    var payload = {
      nome:'Caixa venda presencial',
      tipo:'caixa',
      ativo:true,
      saldoInicial:0,
      saldo_inicial:0,
      tpvDefault:true,
      systemKey:'tpv_cash',
      origem:'venda_presencial',
      observacao:'Conta criada automaticamente para receber as entradas da Venda presencial.',
      createdAt:now,
      updatedAt:now
    };
    return DB.add('contas_bancarias',payload).then(function(ref){
      var id=String((ref&&ref.id)||'');
      var saved=Object.assign({},payload,{ id:id });
      _contasBancarias.push(saved);
      return DB.setDocRoot('config','tpv',{ cashAccountId:id, cashAccountName:payload.nome, updatedAt:now }).then(function(){ return true; });
    }).catch(function(){ return false; });
  }

  function _simpleKey(value) {
    return String(value == null ? '' : value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'-').replace(/^-+|-+$/g,'');
  }

  function _cfgCardStyle(pad) {
    return 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:'+(pad||'18px 20px')+';box-shadow:0 12px 30px rgba(31,31,31,.055);';
  }

  function _cfgChip(txt) {
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">'+_esc(txt)+'</span>';
  }

  function _cfgIconButton(icon,title,bg,color,onClick) {
    return '<button onclick="'+onClick+'" title="'+_esc(title||'')+'" style="width:30px;height:30px;border-radius:9px;border:'+(bg==='#fff'?'1px solid #EAE4DA':'none')+';background:'+bg+';color:'+color+';cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:17px;">'+icon+'</span></button>';
  }

  function _cfgPrimaryButton(label,onClick) {
    return '<button onclick="'+onClick+'" style="height:38px;padding:0 14px;border:none;border-radius:12px;background:#B42318;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">'+_esc(label)+'</button>';
  }

  function _cfgSectionHead(icon,title,desc) {
    return '<div style="display:flex;align-items:flex-start;gap:10px;min-width:0;">'+
      '<span class="mi" style="width:31px;height:31px;border-radius:12px;background:#FAF8F4;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto;">'+_esc(icon||'settings')+'</span>'+
      '<div style="min-width:0;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;line-height:1.2;">'+_esc(title||'')+'</div>'+
      (desc?'<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:3px 0 0;max-width:680px;">'+_esc(desc)+'</p>':'')+'</div>'+
    '</div>';
  }

  function _cfgListRow(main,sub,actions,accent) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px;border:1px solid #EADFD8;border-radius:14px;background:#FFFCF8;transition:background .15s ease,transform .15s ease;" onmouseover="this.style.background=\'#fff\';this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.background=\'#FFFCF8\';this.style.transform=\'translateY(0)\'">'+
      '<div style="display:flex;align-items:center;gap:10px;min-width:0;">'+
        '<span style="width:7px;height:28px;border-radius:999px;background:'+(accent||'#EADFD8')+';display:inline-block;flex:0 0 auto;"></span>'+
        '<div style="min-width:0;"><div style="font-size:13px;font-weight:650;color:#1F1F1F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(main||'')+'</div>'+
        (sub?'<div style="font-size:11.5px;color:#6F6860;line-height:1.35;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(sub)+'</div>':'')+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-shrink:0;">'+(actions||'')+'</div>'+
    '</div>';
  }

  function _paintConfiguracoes() {
    var content=document.getElementById('fin-content'); if(!content) return;
    var subs=[
      {key:'categorias',    label:'Categorias'},
      {key:'formas-pag',   label:'Formas de Pagamento'},
      {key:'contas-bancarias', label:'Contas Bancárias'},
      {key:'custos-ind',   label:'Custos Indiretos'}
    ];
    var sbSt=function(k){ var a=_cfgSub===k; return 'height:34px;padding:0 12px;border-radius:999px;border:1px solid '+(a?'#B42318':'#E8DCD7')+';background:'+(a?'#B42318':'#FFFCF8')+';color:'+(a?'#fff':'#6F6860')+';font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:'+(a?'0 4px 12px rgba(180,35,24,.14)':'0 1px 2px rgba(31,31,31,.02)')+';'; };
    var tabs='<div style="'+_cfgCardStyle('10px 12px')+'display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'+subs.map(function(s){ return '<button onclick="Modules.Financeiro._setCfgSub(\''+s.key+'\')" style="'+sbSt(s.key)+'">'+s.label+'</button>'; }).join('')+'</div>';
    var inner='';
    if(_cfgSub==='categorias')   inner=_paintCfgCats();
    if(_cfgSub==='contas-bancarias') inner=_paintCfgContasBancarias();
    if(_cfgSub==='formas-pag')  inner=_paintCfgFormas();
    if(_cfgSub==='custos-ind')  inner=_paintCfgCustos();
    content.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:16px;">'+
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">'+
          '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;">Configurações financeiras</h2><p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Organize as bases usadas para registrar entradas, saídas, pagamentos, contas e custos sem transformar o financeiro em uma tela pesada.</p></div>'+
        '</div>'+
        tabs+
        inner+
      '</div>';
  }

  function _setCfgSub(k){ _cfgSub=k; _paintConfiguracoes(); }

  function _paintCfgCats() {
    var rg=function(lista,tipo,title,desc,addNature){
      var isEntrada=tipo==='entrada';
      var isCost=addNature==='custo';
      var color=isEntrada?'#1F6F43':(isCost?'#B45309':'#B42318');
      return '<div style="'+_cfgCardStyle()+'min-width:0;">'+
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">'+
          _cfgSectionHead(isEntrada?'south_west':(isCost?'price_check':'north_east'),title,desc)+
          '<button onclick="Modules.Financeiro._openCatModal(null,\''+tipo+'\''+(addNature?',\''+addNature+'\'':'')+')" style="height:34px;padding:0 12px;border:none;border-radius:12px;background:'+color+';color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(31,31,31,.08);">+ Adicionar</button>'+
        '</div>'+
        (lista.length===0?'<div style="border:1px dashed #EAE4DA;border-radius:14px;text-align:center;padding:24px 16px;color:#6F6860;font-size:13px;">Nenhuma categoria cadastrada.</div>':
          '<div style="display:flex;flex-direction:column;gap:8px;">'+
          lista.slice().sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); }).map(function(c){
            var sub=tipo==='entrada'?'Entrada':_catClassLabel(c);
            return _cfgListRow(c.nome,sub,_cfgIconButton('edit','Editar','#fff','#6F6860','Modules.Financeiro._openCatModal(\''+c.id+'\',\''+tipo+'\')')+_cfgIconButton('delete','Excluir','#FFF0EE','#B42318','Modules.Financeiro._deleteCat(\''+c.id+'\')'),color);
          }).join('')+
          '</div>')+
      '</div>';
    };
    var entradas=(_categorias||[]).filter(function(c){ return c.tipo==='entrada'; });
    var saidas=(_categorias||[]).filter(function(c){ return c.tipo==='saida'; });
    var despesas=saidas.filter(function(c){ return _catNature(c)!=='custo'; });
    var custos=saidas.filter(function(c){ return _catNature(c)==='custo'; });
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;align-items:start;">'+
      rg(entradas,'entrada','Entradas','Categorias para separar valores recebidos.')+
      rg(despesas,'saida','Despesas','Gastos para manter o negócio funcionando.','despesa')+
      rg(custos,'saida','Custos','Gastos ligados ao que é produzido, comprado ou vendido.','custo')+
    '</div>';
  }

  function _paintCfgContasBancarias() {
    var st=_saldoTotal();
    return '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="'+_cfgCardStyle('14px 16px')+'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">'+
        _cfgSectionHead('account_balance_wallet','Contas bancárias','Cadastre os lugares por onde o dinheiro entra e sai. Saldo total: '+_fmtVal(st))+
        _cfgPrimaryButton('+ Nova Conta','Modules.Financeiro._openContaModal(null)')+
      '</div>'+
      _contasCardsHtml('44px 20px')+
    '</div>';
  }

  function _openCatModal(id,tipoPreset,naturePreset) {
    _editingId=id;
    var c=id?((_categorias||[]).find(function(x){ return x.id===id; })||{}):{};
    var tipo=c.tipo||tipoPreset||'entrada';
    var nature=id?_catNature(c):(naturePreset||_catNature(c));
    if(tipo==='entrada') nature='receita';
    if(tipo==='saida' && nature==='receita') nature='despesa';
    var costClass=_catCostClass(c);
    var showSaida=tipo==='saida';
    var body='<div style="'+_modalCardStyle()+'">'+
      _modalIconTitle('category','Categoria financeira','Use categorias para separar o que entra, o que sai e entender melhor onde o dinheiro está indo.')+
      '<div style="display:grid;grid-template-columns:minmax(220px,1fr) minmax(150px,190px);gap:12px;align-items:end;">'+
      '<div><label style="'+_lbl()+'">Nome *</label><input id="cat-nome" type="text" value="'+_esc(c.nome||'')+'" placeholder="Ex.: Vendas, Aluguel, Matéria-prima..." style="'+_modalFieldStyle()+'"></div>'+
      '<div><label style="'+_lbl()+'">Tipo</label><select id="cat-tipo" onchange="Modules.Financeiro._syncCatTypeFields()" style="'+_modalSelectStyle('max-width:190px;')+'">'+
        '<option value="entrada"'+(tipo==='entrada'?' selected':'')+'>Receita (entrada)</option>'+
        '<option value="saida"'+(tipo==='saida'?' selected':'')+'>Saída</option>'+
      '</select></div></div>'+
      '<div id="cat-saida-fields" style="display:'+(showSaida?'grid':'none')+';grid-template-columns:minmax(180px,220px) minmax(180px,220px);gap:12px;align-items:start;margin-top:14px;">'+
        '<div><label style="'+_lbl()+'">Essa saída é</label><select id="cat-natureza" style="'+_modalSelectStyle('max-width:220px;')+'">'+
          '<option value="despesa"'+(nature==='despesa'?' selected':'')+'>Despesa</option>'+
          '<option value="custo"'+(nature==='custo'?' selected':'')+'>Custo</option>'+
        '</select><div style="font-size:11px;color:#8A7E7C;margin-top:5px;line-height:1.35;">Despesa mantém o negócio. Custo está ligado ao que é vendido ou produzido.</div></div>'+
        '<div><label style="'+_lbl()+'">Classificação</label><select id="cat-cost-class" style="'+_modalSelectStyle('max-width:220px;')+'">'+
          '<option value="direto"'+(costClass==='direto'?' selected':'')+'>Direto</option>'+
          '<option value="indireto"'+(costClass==='indireto'?' selected':'')+'>Indireto</option>'+
        '</select><div style="font-size:11px;color:#8A7E7C;margin-top:5px;line-height:1.35;">Direto pertence ao produto, pedido ou venda. Indireto ajuda a operação a funcionar.</div></div>'+
      '</div></div>';
    var footer='<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;width:100%;"><div style="font-size:11px;color:#7A746B;">Revise os dados antes de salvar.</div><div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;"><button onclick="if(window._catModal)window._catModal.close();" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button><button onclick="Modules.Financeiro._saveCat()" style="height:42px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">Salvar alterações</button></div></div>';
    window._catModal=UI.modal({title:id?'Editar categoria':'Nova categoria',body:body,footer:footer,maxWidth:'520px'});
  }

  function _syncCatTypeFields() {
    var tipo=(document.getElementById('cat-tipo')||{}).value||'entrada';
    var box=document.getElementById('cat-saida-fields');
    if(box) box.style.display=tipo==='saida'?'grid':'none';
  }

  function _saveCat() {
    var nome=((document.getElementById('cat-nome')||{}).value||'').trim();
    if(!nome){ UI.toast('Nome obrigatório','error'); return; }
    var tipo=(document.getElementById('cat-tipo')||{}).value||'entrada';
    var obj={nome:nome,tipo:tipo};
    if(tipo==='saida'){
      obj.financialNature=(document.getElementById('cat-natureza')||{}).value||'despesa';
      obj.costClass=(document.getElementById('cat-cost-class')||{}).value||'indireto';
    } else {
      obj.financialNature='receita';
      obj.costClass='';
    }
    (_editingId?DB.update('financeiro_categorias',_editingId,obj):DB.add('financeiro_categorias',obj)).then(function(){
      UI.toast('Categoria salva!','success');
      if(window._catModal) window._catModal.close();
      _loadConfiguracoes();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _deleteCat(id) {
    UI.confirm('Eliminar esta categoria?').then(function(yes){
      if(!yes) return;
      DB.remove('financeiro_categorias',id).then(function(){ UI.toast('Eliminado','info'); _loadConfiguracoes(); });
    });
  }

  // Fornecedores
  var TIPOS_FORN = ['Supermercado','Distribuidor','Atacado','Online','Outro'];

  function _paintCfgFornecedores() {
    var tipoColors={'Supermercado':'#16A34A','Distribuidor':'#3B82F6','Atacado':'#D97706','Online':'#7C3AED','Outro':'#6B7280'};
    return '<div style="background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #F2EDED;">'+
        '<h3 style="font-size:14px;font-weight:800;">Fornecedores</h3>'+
        '<button onclick="Modules.Financeiro._openFornModal(null)" style="background:#C4362A;color:#fff;border:none;padding:7px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Adicionar</button>'+
      '</div>'+
      (_fornecedores.length===0
        ?'<p style="text-align:center;color:#8A7E7C;padding:30px;font-size:13px;">Nenhum fornecedor cadastrado</p>'
        :'<table style="width:100%;border-collapse:collapse;">'+
            '<thead><tr style="background:#F8F6F5;">'+
              '<th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Nome</th>'+
              '<th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Tipo</th>'+
              '<th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Email</th>'+
              '<th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Endereço</th>'+
              '<th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Estado</th>'+
              '<th style="padding:9px 6px;"></th>'+
            '</tr></thead><tbody>'+
            _fornecedores.map(function(f){
              var col=tipoColors[f.tipo]||'#6B7280';
              var tipoBadge=f.tipo?'<span style="background:'+col+'22;color:'+col+';padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">'+_esc(f.tipo)+'</span>':'—';
              var estadoBadge=f.ativo!==false?'<span style="background:#DCFCE7;color:#16A34A;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">Ativo</span>':'<span style="background:#F3F4F6;color:#6B7280;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">Inativo</span>';
              return '<tr style="border-top:1px solid #F2EDED;" onmouseover="this.style.background=\'#FAFAF9\'" onmouseout="this.style.background=\'\'">'+
                '<td style="padding:10px 14px;font-size:13px;font-weight:700;">'+_esc(f.nome||f.name||'—')+'</td>'+
                '<td style="padding:10px 14px;">'+tipoBadge+'</td>'+
                '<td style="padding:10px 14px;font-size:12px;color:#8A7E7C;">'+_esc(f.email||'—')+'</td>'+
                '<td style="padding:10px 14px;font-size:12px;color:#8A7E7C;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(f.endereco||'—')+'</td>'+
                '<td style="padding:10px 14px;">'+estadoBadge+'</td>'+
                '<td style="padding:10px 6px;text-align:right;white-space:nowrap;">'+
                  '<button onclick="Modules.Financeiro._openFornModal(\''+f.id+'\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#EEF4FF;color:#3B82F6;cursor:pointer;margin-right:4px;"><span class="mi" style="font-size:13px;">edit</span></button>'+
                  '<button onclick="Modules.Financeiro._deleteForn(\''+f.id+'\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#FFF0EE;color:#C4362A;cursor:pointer;"><span class="mi" style="font-size:13px;">delete</span></button>'+
                '</td></tr>';
            }).join('')+'</tbody></table>')+
    '</div>';
  }

  function _openFornModal(id) {
    _editingId=id;
    var f=id?(_fornecedores.find(function(x){ return x.id===id; })||{}):{};
    var tipoOpts=TIPOS_FORN.map(function(t){ return '<option value="'+t+'"'+((f.tipo||'')===t?' selected':'')+'>'+t+'</option>'; }).join('');
    var body=
      '<div>'+
        '<div style="margin-bottom:12px;"><label style="'+_lbl()+'">Nome *</label><input id="forn-nome" type="text" value="'+_esc(f.nome||f.name||'')+'" placeholder="Nome do fornecedor..." style="'+_inp()+'"></div>'+
        '<div style="'+_g2()+'">'+
          '<div><label style="'+_lbl()+'">Tipo</label><select id="forn-tipo" style="'+_inp()+'background:#fff;"><option value="">Selecionar...</option>'+tipoOpts+'</select></div>'+
          '<div><label style="'+_lbl()+'">Email</label><input id="forn-email" type="email" value="'+_esc(f.email||'')+'" placeholder="email@fornecedor.com" style="'+_inp()+'"></div>'+
        '</div>'+
        '<div style="margin-bottom:12px;"><label style="'+_lbl()+'">Endereço</label><input id="forn-end" type="text" value="'+_esc(f.endereco||'')+'" placeholder="Morada completa..." style="'+_inp()+'"></div>'+
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;"><input type="checkbox" id="forn-ativo"'+(f.ativo!==false?' checked':'')+' style="width:15px;height:15px;cursor:pointer;"> Fornecedor ativo</label>'+
      '</div>';
    var footer='<button onclick="Modules.Financeiro._saveForn()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">'+(id?'Atualizar':'Salvar')+'</button>';
    window._fornModal=UI.modal({title:id?'Editar Fornecedor':'Novo Fornecedor',body:body,footer:footer,maxWidth:'480px'});
  }

  function _saveForn() {
    var nome=((document.getElementById('forn-nome')||{}).value||'').trim();
    if(!nome){ UI.toast('Nome obrigatório','error'); return; }
    var obj={
      nome:nome, name:nome, // compatibilidade com compras.js que usa .name
      tipo:(document.getElementById('forn-tipo')||{}).value||'',
      email:(document.getElementById('forn-email')||{}).value||'',
      endereco:(document.getElementById('forn-end')||{}).value||'',
      ativo:!!(document.getElementById('forn-ativo')||{}).checked,
      updatedAt:new Date().toISOString()
    };
    if(!_editingId) obj.createdAt=new Date().toISOString();
    (_editingId?DB.update('fornecedores',_editingId,obj):DB.add('fornecedores',obj)).then(function(){
      UI.toast('Fornecedor salvo!','success');
      if(window._fornModal) window._fornModal.close();
      _loadConfiguracoes();
    }).catch(function(e){ UI.toast('Erro: '+e.message,'error'); });
  }

  function _deleteForn(id) {
    UI.confirm('Eliminar este fornecedor?').then(function(yes){
      if(!yes) return;
      DB.remove('fornecedores',id).then(function(){ UI.toast('Eliminado','info'); _loadConfiguracoes(); });
    });
  }

  function _paintCfgFormas() {
    var formas=_formasPagFull(true);
    return '<div style="'+_cfgCardStyle()+'">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;">'+
        _cfgSectionHead('payments','Formas de pagamento','Cadastre as opções que podem aparecer nos registros financeiros e no checkout da loja.')+
        _cfgPrimaryButton('+ Adicionar','Modules.Financeiro._openFormaPagModal(null)')+
      '</div>'+
      (formas.length===0
        ? '<div style="border:1px dashed #EAE4DA;border-radius:14px;text-align:center;padding:24px 16px;color:#6F6860;font-size:13px;">Nenhuma forma de pagamento cadastrada.</div>'
        : '<div style="display:flex;flex-direction:column;gap:8px;">'+formas.map(function(f,i){
            var typeLabel = f.tipoGlobalNome || _globalTypeLabel('payment', f.tipoGlobalId || f.tipoGlobalSlug || f.tipo || '') || f.tipo || 'outro';
            var exigeConta = !!(f.exigeConta || _globalPaymentRequiresAccount(f.tipoGlobalId || f.tipoGlobalSlug || f.tipo || ''));
            return _cfgListRow(f.nome||'',typeLabel+' · '+(f.ativo===false?'Inativa':'Ativa')+(exigeConta?' · exige conta':''),
                _cfgIconButton('edit','Editar','#fff','#6F6860','Modules.Financeiro._openFormaPagModal('+i+')')+
                _cfgIconButton('delete','Excluir','#FFF0EE','#B42318','Modules.Financeiro._removeFormaPag('+i+')'),
              f.ativo===false?'#C8BDB7':'#1F6F43');
          }).join('')+'</div>')+
    '</div>';
  }

  function _openFormaPagModal(idx) {
    var formas=_formasPagFull(true);
    var valor=idx!=null ? (formas[idx] || {}) : {};
    window._formaPagEditIdx = (idx!=null ? idx : null);
    var currentTipo = valor.tipoGlobalId || valor.tipoGlobalSlug || valor.tipo || '';
    var tipos=_globalFinanceList('payment', false).filter(function(t){ return _globalTypeCountryOk(t.countryFiscal, _tenantFiscalCountry()); });
    if(!currentTipo && tipos.length) currentTipo=tipos[0].id || tipos[0].slug || tipos[0].name || '';
    var tipoOpts=tipos.map(function(t){
      var selected = String(t.id) === String(currentTipo) || String(t.slug) === String(currentTipo) || String(t.name) === String(currentTipo);
      return '<option value="'+_esc(t.id)+'" data-slug="'+_esc(t.slug)+'" data-name="'+_esc(t.name)+'" data-country="'+_esc(t.countryFiscal)+'" data-required="'+(t.requiresBankAccount ? '1' : '0')+'"'+(selected?' selected':'')+'>'+_esc(t.name)+' — '+_globalFinanceCountryLabel(t.countryFiscal)+'</option>';
    }).join('');
    if (currentTipo && !tipos.some(function(t){ return String(t.id) === String(currentTipo) || String(t.slug) === String(currentTipo) || String(t.name) === String(currentTipo); })) {
      tipoOpts += '<option value="'+_esc(currentTipo)+'" selected>'+_esc(valor.tipoGlobalNome || valor.tipo || currentTipo)+' (inativo)</option>';
    }
    if(!tipoOpts) tipoOpts='<option value="outro" data-slug="outro" data-name="Outro" data-country="ambos" data-required="0" selected>Outro</option>';
    var contaOpts='<option value="">Nenhuma</option>'+(_contasBancarias||[]).filter(function(c){ return c.ativo!==false || c.id===valor.contaPadraoId; }).sort(function(a,b){ return (a.nome||'').localeCompare(b.nome||''); }).map(function(c){ return '<option value="'+c.id+'"'+(valor.contaPadraoId===c.id?' selected':'')+'>'+_esc(c.nome||'')+'</option>'; }).join('');
    var cardStyle=_modalCardStyle();
    var fieldStyle=_modalFieldStyle();
    var selectStyle=_modalSelectStyle();
    var shortField=_modalFieldStyle('max-width:160px;');
    var moneyField=_modalFieldStyle('max-width:150px;');
    var cleanCheckboxStyle='display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;color:#1F1F1F;cursor:pointer;min-height:32px;';
    var body='<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="'+cardStyle+'">'+
        _modalIconTitle('payments','Dados da forma','Configure como esta forma aparece no financeiro, qual conta usa por padrão e se há taxas.')+
        '<select id="forma-pag-tipo" onchange="Modules.Financeiro._syncFormaPagTypeRule()" style="display:none;">'+tipoOpts+'</select>'+
        '<div style="display:flex;flex-direction:column;gap:12px;">'+
          '<div style="display:flex;gap:12px;align-items:start;flex-wrap:wrap;">'+
            '<div style="flex:1 1 260px;min-width:240px;"><label style="'+_lbl()+'">Nome *</label><input id="forma-pag-nome" type="text" value="'+_esc(valor.nome||'')+'" placeholder="Ex.: MB Way" style="'+fieldStyle+'"></div>'+
            '<div style="flex:1 1 220px;max-width:280px;"><label style="'+_lbl()+'">Conta bancária padrão</label><select id="forma-pag-conta" style="'+selectStyle+'">'+contaOpts+'</select></div>'+
          '</div>'+
          '<div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">'+
            '<div style="flex:0 0 160px;max-width:160px;"><label style="'+_lbl()+'">Prazo em dias</label><input id="forma-pag-prazo" type="number" min="0" value="'+_esc(valor.prazoCompensacaoDias||'')+'" placeholder="0" style="'+shortField+'"></div>'+
            '<div style="flex:0 0 150px;max-width:150px;"><label style="'+_lbl()+'">Taxa %</label><input id="forma-pag-taxa-pct" type="text" value="'+_esc(valor.taxaPercentual||'')+'" placeholder="0,00" style="'+moneyField+'"></div>'+
            '<div style="flex:0 0 150px;max-width:150px;"><label style="'+_lbl()+'">Taxa fixa</label><input id="forma-pag-taxa-fixa" type="text" value="'+_esc(valor.taxaFixa||'')+'" placeholder="€ 0,00" style="'+moneyField+'"></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div style="'+cardStyle+'">'+
        _modalIconTitle('tune','Uso no financeiro','Defina se esta forma está disponível e se precisa de conta bancária.')+
        '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">'+
          '<label style="'+cleanCheckboxStyle+'"><input id="forma-pag-ativo" type="checkbox" '+(valor.ativo!==false?'checked':'')+' style="accent-color:#B42318;width:16px;height:16px;"><span>Forma ativa</span></label>'+
          '<label style="'+cleanCheckboxStyle+'"><input id="forma-pag-exige-conta" type="checkbox" '+((valor.exigeConta || _globalPaymentRequiresAccount(currentTipo))?'checked':'')+' style="accent-color:#B42318;width:16px;height:16px;"><span>Exige conta bancária</span></label>'+
        '</div>'+
        '<div id="forma-pag-exige-hint" style="font-size:11px;color:#8A7E7C;margin-top:8px;">Use conta bancária quando o dinheiro precisa entrar ou sair de uma conta específica.</div>'+
      '</div>'+
      '<div style="'+cardStyle+'">'+
        _modalIconTitle('notes','Observação','Anotações internas opcionais sobre esta forma de pagamento.')+
        '<textarea id="forma-pag-obs" placeholder="Opcional..." style="'+_modalFieldStyle('height:auto;min-height:82px;padding:10px 12px;resize:vertical;')+'">'+_esc(valor.observacao||'')+'</textarea>'+
      '</div>'+
    '</div>';
    var footer='<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;width:100%;"><div style="font-size:11px;color:#7A746B;">Revise os dados antes de salvar.</div><div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;"><button onclick="if(window._formaPagModal)window._formaPagModal.close();" style="height:42px;padding:0 16px;border-radius:12px;border:1px solid #E6DDD3;background:#fff;color:#1F1F1F;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button><button onclick="Modules.Financeiro._saveFormaPag()" style="height:42px;padding:0 18px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">Salvar alterações</button></div></div>';
    window._formaPagModal=UI.modal({title:idx!=null?'Editar forma de pagamento':'Nova forma de pagamento',body:body,footer:footer,maxWidth:'720px'});
    setTimeout(function(){ Modules.Financeiro._syncFormaPagTypeRule(); }, 0);
  }

  function _saveFormaPag() {
    var nome=((document.getElementById('forma-pag-nome')||{}).value||'').trim();
    var tipoSel=document.getElementById('forma-pag-tipo')||{};
    var tipo=(tipoSel.value||'').trim();
    if(!nome){ UI.toast('Nome obrigatório','error'); return; }
    if(!tipo){ UI.toast('Tipo obrigatório','error'); return; }
    var atual=_formasPagFull(true).slice();
    var idx=window._formaPagEditIdx;
    var lower=nome.toLowerCase();
    var selectedOption=tipoSel.selectedOptions&&tipoSel.selectedOptions[0]?tipoSel.selectedOptions[0]:null;
    var globalTipo=_globalTypeResolve('payment', tipo, true) || _globalTypeResolve('payment', selectedOption ? (selectedOption.dataset.slug || selectedOption.dataset.name || selectedOption.textContent || '') : '', true);
    var requiresBank=!!(globalTipo && globalTipo.requiresBankAccount);
    var typeLabel = globalTipo ? (globalTipo.name || globalTipo.nome || tipo) : (selectedOption ? (selectedOption.dataset.name || tipo) : tipo);
    var typeCountry = globalTipo ? globalTipo.countryFiscal : (selectedOption ? (selectedOption.dataset.country || 'ambos') : 'ambos');
    var typeSlug = globalTipo ? globalTipo.slug : (selectedOption ? (selectedOption.dataset.slug || _globalFinanceSlug(typeLabel)) : _globalFinanceSlug(typeLabel));
    var formaObj={
      nome:nome,
      tipo:typeLabel,
      tipoGlobalId: globalTipo ? globalTipo.id : tipo,
      tipoGlobalSlug: typeSlug,
      tipoGlobalNome: typeLabel,
      tipoGlobalCountry: typeCountry,
      ativo:!!(document.getElementById('forma-pag-ativo')||{}).checked,
      exigeConta:requiresBank || !!(document.getElementById('forma-pag-exige-conta')||{}).checked,
      contaPadraoId:(document.getElementById('forma-pag-conta')||{}).value||'',
      prazoCompensacaoDias:_parseNum((document.getElementById('forma-pag-prazo')||{}).value),
      taxaPercentual:_parseNum((document.getElementById('forma-pag-taxa-pct')||{}).value),
      taxaFixa:_parseNum((document.getElementById('forma-pag-taxa-fixa')||{}).value),
      observacao:(document.getElementById('forma-pag-obs')||{}).value||''
    };
    if(idx==null){
      if(atual.some(function(v){ return String(v.nome||'').toLowerCase()===lower; })){ UI.toast('Já existe','error'); return; }
      atual.push(formaObj);
    } else {
      if(atual.some(function(v,i){ return i!==idx && String(v.nome||'').toLowerCase()===lower; })){ UI.toast('Já existe','error'); return; }
      atual[idx]=formaObj;
    }
    atual.sort(function(a,b){ return String(a.nome||'').localeCompare(String(b.nome||'')); });
    DB.setDocRoot('config','financeiro',{formas_pagamento:atual}).then(function(){
      _configFin.formas_pagamento=atual;
      UI.toast('Forma de pagamento salva!','success');
      if(window._formaPagModal) window._formaPagModal.close();
      _paintConfiguracoes();
    }).catch(function(e){ UI.toast('Erro ao salvar forma de pagamento','error'); console.error(e); });
  }

  function _syncFormaPagTypeRule() {
    var sel = document.getElementById('forma-pag-tipo');
    var chk = document.getElementById('forma-pag-exige-conta');
    var hint = document.getElementById('forma-pag-exige-hint');
    if (!sel || !chk) return;
    var opt = sel.selectedOptions && sel.selectedOptions[0] ? sel.selectedOptions[0] : null;
    var required = !!(opt && opt.dataset && opt.dataset.required === '1');
    if (required) {
      chk.checked = true;
      chk.disabled = true;
      if (hint) hint.textContent = 'Esta forma precisa ficar vinculada a uma conta bancária.';
    } else {
      chk.disabled = false;
      if (hint) hint.textContent = 'Use conta bancária quando o dinheiro precisa entrar ou sair de uma conta específica.';
    }
  }

  function _addFormaPag() {
    var v=((document.getElementById('cfg-nova-forma')||{}).value||'').trim();
    if(!v){ UI.toast('Digite o nome','error'); return; }
    var atual=_formasPagFull(true).slice();
    if(atual.some(function(f){ return String(f.nome||'').toLowerCase()===v.toLowerCase(); })){ UI.toast('Já existe','error'); return; }
    atual.push({nome:v,tipo:'outro',ativo:true});
    atual.sort(function(a,b){ return String(a.nome||'').localeCompare(String(b.nome||'')); });
    DB.setDocRoot('config','financeiro',{formas_pagamento:atual}).then(function(){ _configFin.formas_pagamento=atual; UI.toast('Adicionado!','success'); _paintConfiguracoes(); }).catch(function(e){ UI.toast('Erro ao salvar','error'); console.error(e); });
  }

  function _removeFormaPag(idx) {
    var atual=_formasPagFull(true).slice(); atual.splice(idx,1);
    DB.setDocRoot('config','financeiro',{formas_pagamento:atual}).then(function(){ _configFin.formas_pagamento=atual; UI.toast('Removido','info'); _paintConfiguracoes(); }).catch(function(e){ UI.toast('Erro ao salvar','error'); console.error(e); });
  }

  function _paintCfgCustos() {
    var g=_configGeral||{};
    var cc=window._configCustos||{};
    var mode=g.variableCostMode||g.custosVariaveisModo||g.indirectCostMode||g.custosIndiretosModo||'manual';
    var pct=g.variableCostPercent!=null?g.variableCostPercent:(g.percentualCustosVariaveis!=null?g.percentualCustosVariaveis:(g.indirectCostPercent!=null?g.indirectCostPercent:(g.percentualCustosIndiretos!=null?g.percentualCustosIndiretos:(cc.defaultIndirectCostPercent!=null?cc.defaultIndirectCostPercent:''))));
    var months=String(g.variableCostMonths||g.custosVariaveisMeses||g.indirectCostMonths||g.custosIndiretosMeses||6);
    var manualVisible = mode !== 'automatico';
    var autoVisible = mode === 'automatico';
    return '<div style="'+_cfgCardStyle()+'">'+
      '<div style="margin-bottom:14px;">'+_cfgSectionHead('price_check','Custos variáveis','Reserve uma parte da venda para gastos que aumentam quando o movimento cresce.')+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:14px;">'+
        '<div style="background:#FFFCF8;border:1px solid #EADFD8;border-radius:16px;padding:14px 14px 16px;">'+
          '<div style="font-size:13px;font-weight:650;color:#1F1F1F;margin-bottom:10px;">Como deseja prever esses custos?</div>'+
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">'+
            '<label style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;cursor:pointer;background:#fff;border:1px solid #E8DCD7;border-radius:12px;padding:11px 12px;"><input type="radio" name="cfg-ind-mode-radio" value="automatico" '+(mode==='automatico'?'checked':'')+' onchange="Modules.Financeiro._setCfgIndirectMode(this.value)" style="accent-color:#B42318;width:16px;height:16px;"> Automático</label>'+
            '<label style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:500;cursor:pointer;background:#fff;border:1px solid #E8DCD7;border-radius:12px;padding:11px 12px;"><input type="radio" name="cfg-ind-mode-radio" value="manual" '+(mode!=='automatico'?'checked':'')+' onchange="Modules.Financeiro._setCfgIndirectMode(this.value)" style="accent-color:#B42318;width:16px;height:16px;"> Manual</label>'+
          '</div>'+
        '</div>'+
        '<div style="background:#FFFCF8;border:1px solid #EADFD8;border-radius:16px;padding:14px 14px 16px;">'+
          '<div id="cfg-ind-manual-box" style="display:'+(manualVisible?'block':'none')+';margin-bottom:12px;">'+
            '<label style="'+_lbl()+'">Percentual de custos variáveis</label>'+
            '<div style="display:flex;align-items:center;gap:8px;max-width:180px;">'+
              '<input id="cfg-ind-pct" type="text" value="'+_esc(pct)+'" placeholder="15" style="'+_inp()+'max-width:112px;background:#fff;border-color:#E8DCD7;border-radius:12px;">'+
              '<span style="font-size:16px;font-weight:600;color:#1F1F1F;">%</span>'+
            '</div>'+
            '<div style="font-size:11.5px;color:#6F6860;margin-top:5px;">Use para marketing de campanha, energia, água, gás, perdas e reforços que crescem junto com as vendas. Contas fixas, como aluguel, internet e contador, já entram pelas saídas previstas do Financeiro.</div>'+
          '</div>'+
          '<div id="cfg-ind-auto-box" style="display:'+(autoVisible?'block':'none')+';">'+
            '<label style="'+_lbl()+'">Período para cálculo automático</label><select id="cfg-ind-months" style="'+_modalSelectStyle('max-width:220px;')+'">'+
              '<option value="3"'+(months==='3'?' selected':'')+'>3 meses</option>'+
              '<option value="6"'+(months==='6'?' selected':'')+'>6 meses</option>'+
              '<option value="12"'+(months==='12'?' selected':'')+'>12 meses</option>'+
            '</select>'+
            '<div style="font-size:11.5px;color:#6F6860;margin-top:5px;">Usa lançamentos financeiros com perfil variável em relação às vendas do período. Se ainda não houver histórico confiável, prefira Manual.</div>'+
          '</div>'+
        '</div>'+
        '<div style="background:#FFFCF8;border:1px solid #EADFD8;border-radius:16px;padding:14px 14px 16px;">'+
          '<div style="font-size:13px;font-weight:650;color:#1F1F1F;margin-bottom:10px;">Exemplo rápido</div>'+
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;font-size:12px;color:#1F1F1F;">'+
            '<div style="background:#fff;border:1px solid #E8DCD7;border-radius:12px;padding:9px 10px;"><span style="display:block;color:#6F6860;font-size:10.5px;text-transform:uppercase;">Produto</span><strong style="font-weight:650;">'+_fmtVal(10)+'</strong></div>'+
            '<div style="background:#fff;border:1px solid #E8DCD7;border-radius:12px;padding:9px 10px;"><span style="display:block;color:#6F6860;font-size:10.5px;text-transform:uppercase;">Custo do produto</span><strong style="font-weight:650;">'+_fmtVal(4)+'</strong></div>'+
            '<div style="background:#fff;border:1px solid #E8DCD7;border-radius:12px;padding:9px 10px;"><span style="display:block;color:#6F6860;font-size:10.5px;text-transform:uppercase;">Custo variável</span><strong style="font-weight:650;">'+_fmtVal(1)+'</strong></div>'+
            '<div style="background:#fff;border:1px solid #E8DCD7;border-radius:12px;padding:9px 10px;"><span style="display:block;color:#6F6860;font-size:10.5px;text-transform:uppercase;">Lucro</span><strong style="font-weight:650;">'+_fmtVal(5)+'</strong></div>'+
          '</div>'+
        '</div>'+
        '<div style="display:flex;justify-content:flex-end;">'+
          '<button onclick="Modules.Financeiro._saveCustosInd()" style="height:40px;padding:0 16px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);">Salvar configuração</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  function _setCfgIndirectMode(mode) {
    var manual=document.getElementById('cfg-ind-manual-box');
    var auto=document.getElementById('cfg-ind-auto-box');
    if(manual) manual.style.display=mode==='automatico'?'none':'block';
    if(auto) auto.style.display=mode==='automatico'?'block':'none';
  }

  function _saveCustosInd() {
    var pct=parseFloat(((document.getElementById('cfg-ind-pct')||{}).value||'').replace(',','.'))||0;
    if(pct<0){ UI.toast('Percentual não pode ser negativo','error'); return; }
    var modeEl=document.querySelector('input[name="cfg-ind-mode-radio"]:checked');
    var mode=(modeEl&&modeEl.value)||'manual';
    var months=parseInt((document.getElementById('cfg-ind-months')||{}).value,10)||6;
    var geral=Object.assign({}, _configGeral || {}, {
      variableCostMode: mode,
      variableCostPercent: pct,
      variableCostMonths: months,
      custosVariaveisModo: mode,
      percentualCustosVariaveis: pct,
      custosVariaveisMeses: months,
      variableCostConfigured: true,
      custosVariaveisConfigurados: true,
      indirectCostMode: mode,
      indirectCostPercent: pct,
      indirectCostMonths: months,
      custosIndiretosModo: mode,
      percentualCustosIndiretos: pct,
      custosIndiretosMeses: months,
      indirectCostConfigured: true,
      custosIndiretosConfigurados: true
    });
    Promise.all([
      DB.setDocRoot('config','geral',geral),
      DB.setDocRoot('config','custos',{defaultIndirectCostPercent:pct})
    ]).then(function(){
      _configGeral=geral;
      if(window._configCustos) window._configCustos.defaultIndirectCostPercent=pct;
      UI.toast('Custos variáveis salvos!','success');
    }).catch(function(e){ UI.toast('Erro ao salvar configurações','error'); console.error(e); });
  }

  function destroy() {}

  return {
    render:render, destroy:destroy, _switchSub:_switchSub,
    _setVisaoFiltro:_setVisaoFiltro, _limparVisaoFiltros:_limparVisaoFiltros, _abrirGestaoContasBancarias:_abrirGestaoContasBancarias,
    _setFluxoFiltro:_setFluxoFiltro, _toggleFluxoOrdem:_toggleFluxoOrdem, _limparFluxoFiltros:_limparFluxoFiltros, _setFluxoPage:_setFluxoPage, _setFluxoPageSize:_setFluxoPageSize,
    _limparMovFiltros:_limparMovFiltros, _limparCPFiltros:_limparCPFiltros, _applyFormaPadraoConta:_applyFormaPadraoConta,
    _openMovModal:_openMovModal, _setMovTipo:_setMovTipo, _selectMovStatus:_selectMovStatus, _toggleMovNovaCat:_toggleMovNovaCat, _toggleMovRecorrente:_toggleMovRecorrente, _toggleMovParcelado:_toggleMovParcelado, _calcMovParcela:_calcMovParcela, _renderMovPreviews:_renderMovPreviews,
    _toggleMovNovaPessoa:_toggleMovNovaPessoa, _financePessoaSearch:_financePessoaSearch, _financePessoaSelect:_financePessoaSelect, _saveMov:_saveMov, _deleteMov:_deleteMov, _setMovFiltro:_setMovFiltro, _toggleMovConta:_toggleMovConta, _toggleMovOrdem:_toggleMovOrdem,
    _toggleMovSelecionada:_toggleMovSelecionada, _toggleMovTodas:_toggleMovTodas, _clearMovSelection:_clearMovSelection, _setMovPage:_setMovPage, _setMovPageSize:_setMovPageSize, _openBulkEntradaModal:_openBulkEntradaModal, _applyBulkEntrada:_applyBulkEntrada, _bulkMovStatus:_bulkMovStatus, _bulkDeleteMov:_bulkDeleteMov, _openMovDetalheModal:_openMovDetalheModal, _closeMovDetalhe:_closeMovDetalhe, _confirmDeleteMov:_confirmDeleteMov, _openEfetivarEntradasModal:_openEfetivarEntradasModal, _saveEfetivarEntradas:_saveEfetivarEntradas, _marcarEntradaParcial:_marcarEntradaParcial, _gerarNovaPrevisaoParcial:_gerarNovaPrevisaoParcial, _criarEntradaRestante:_criarEntradaRestante,
    _openCompraModal:_openCompraModal, _addCompraLinha:_addCompraLinha, _removeCompraLinha:_removeCompraLinha,
    _onCompraInsChange:_onCompraInsChange, _calcCompraLinha:_calcCompraLinha, _saveCompra:_saveCompra, _deleteCompra:_deleteCompra,
    _openCPModal:_openCPModal, _saveCP:_saveCP, _deleteCP:_deleteCP, _confirmDeleteCP:_confirmDeleteCP, _pagarCP:_pagarCP, _savePagamentoCP:_savePagamentoCP, _criarSaldoRestanteCP:_criarSaldoRestanteCP, _toggleSaldoRestanteModo:_toggleSaldoRestanteModo,
    _setCPFiltro:_setCPFiltro, _toggleCPConta:_toggleCPConta, _toggleCPStatus:_toggleCPStatus, _toggleCPOrdem:_toggleCPOrdem, _setCPPage:_setCPPage, _setCPPageSize:_setCPPageSize, _toggleCPSelecionada:_toggleCPSelecionada, _toggleCPTodas:_toggleCPTodas, _clearCPSelection:_clearCPSelection, _openBulkCPModal:_openBulkCPModal, _applyBulkCP:_applyBulkCP, _bulkConfirmarCP:_bulkConfirmarCP, _bulkDeleteCP:_bulkDeleteCP, _openContasVencidas:_openContasVencidas, _openCPDetalheModal:_openCPDetalheModal, _closeCPDetalhe:_closeCPDetalhe, _setCPStatus:_setCPStatus, _renderCPPreviews:_renderCPPreviews, _toggleCPRecorrente:_toggleCPRecorrente, _toggleCPParcelada:_toggleCPParcelada, _toggleCPNovoForn:_toggleCPNovoForn, _toggleCPNovaCat:_toggleCPNovaCat,
    _moneyInputFocus:_moneyInputFocus, _moneyInputBlur:_moneyInputBlur,
    _openQuickContaModal:_openQuickContaModal, _saveQuickConta:_saveQuickConta,
    _openContaModal:_openContaModal, _saveConta:_saveConta, _deleteConta:_deleteConta, _openTransferModal:_openTransferModal, _refreshTransferAccounts:_refreshTransferAccounts, _saveTransfer:_saveTransfer,
    _setCfgSub:_setCfgSub, _openCatModal:_openCatModal, _syncCatTypeFields:_syncCatTypeFields, _saveCat:_saveCat, _deleteCat:_deleteCat,
    _openFornModal:_openFornModal, _saveForn:_saveForn, _deleteForn:_deleteForn,
    _addFormaPag:_addFormaPag, _removeFormaPag:_removeFormaPag, _openFormaPagModal:_openFormaPagModal, _saveFormaPag:_saveFormaPag, _syncFormaPagTypeRule:_syncFormaPagTypeRule, _setCfgIndirectMode:_setCfgIndirectMode, _saveCustosInd:_saveCustosInd
  };
})();
