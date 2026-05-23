// js/modules/fiscal.js
window.Modules = window.Modules || {};
Modules.Fiscal = (function () {
  'use strict';

  var _activeSub = 'configuracoes';
  var _data = {};
  var _ivaView = { busca: '', tipo: 'todos', impacto: 'todos', page: 1, pageSize: 12, detalhe: [] };
  var _irpfView = { busca: '', tipo: 'todos', impacto: 'todos', page: 1, pageSize: 12, detalhe: [] };
  var _comprasView = { busca: '', deducao: 'todos', categoria: 'todos', page: 1, pageSize: 12, detalhe: [] };

  var FISCAL_CATEGORIES = [
    ['insumo', 'Insumo'],
    ['embalagem', 'Embalagem'],
    ['produto_pronto', 'Produto pronto'],
    ['despesa_operacional', 'Despesa operacional'],
    ['equipamento_investimento', 'Equipamento/investimento'],
    ['servico', 'Serviço'],
    ['outro', 'Outro']
  ];

  function render(sub) {
    _activeSub = sub === 'compras' ? 'resumo' : (sub || 'resumo');
    var app = document.getElementById('app');
    app.innerHTML = '<section class="module-page">' +
      '<div id="fiscal-content" class="module-content"><div class="loading-inline">Carregando...</div></div>' +
      '</section>';
    _load().then(_renderSub).catch(function (err) {
      console.error('Fiscal load error', err);
      _content('<div style="padding:24px;background:#fff;border-radius:12px;color:#C4362A;">Erro ao carregar dados fiscais: ' + _esc(err.message || err) + '</div>');
    });
  }

  function _switchSub(key) {
    _activeSub = key === 'compras' ? 'resumo' : key;
    _renderSub();
    Router.navigate('fiscal/' + _activeSub);
  }

  function _load() {
    return Promise.all([
      DB.getDocRoot('config', 'fiscal'),
      DB.getAll('orders'),
      DB.getAll('financeiro_entradas'),
      DB.getAll('compras'),
      DB.getAll('financeiro_saidas'),
      DB.getAll('financeiro_apagar'),
      DB.getAll('fornecedores')
    ]).then(function (r) {
      _data = {
        config: _normalizeConfig(r[0] || {}),
        orders: r[1] || [],
        entradas: r[2] || [],
        compras: r[3] || [],
        saidas: r[4] || [],
        apagar: r[5] || [],
        fornecedores: r[6] || []
      };
    });
  }

  function _normalizeConfig(c) {
    return _normalizeFiscalConfig(c || {});
  }

  function _defaultFiscalConfig() {
    return {
      countryCode: 'ES',
      currency: 'EUR',
      fiscalProvider: '',
      providerMode: 'none',
      providerConnected: false,
      invoiceMode: 'automatic',
      defaultInvoiceType: 'simplified',
      simplifiedInvoiceEnabled: true,
      fullInvoiceEnabled: true,
      defaultIvaRate: 10,
      pricesIncludeIva: true,
      invoiceSeries: 'A',
      nextInvoiceNumber: 1,
      facturaDirecta: {
        enabled: false,
        partnerMode: false,
        companyId: '',
        connectionStatus: 'not_connected',
        lastSyncAt: null
      },
      legalBusiness: {
        legalName: '',
        commercialName: '',
        documentType: '',
        fiscalId: '',
        taxRegime: '',
        address: '',
        number: '',
        complement: '',
        city: '',
        province: '',
        postalCode: '',
        countryCode: 'ES',
        invoiceEmail: ''
      },
      createdAt: null,
      updatedAt: null,
      ivaPadrao: 10,
      irpfPadrao: 15,
      trimestreAtual: _currentQuarterKey(),
      usarCalculoFiscal: true
    };
  }

  function _normalizeFiscalConfig(c) {
    var defaults = _defaultFiscalConfig();
    var legal = Object.assign({}, defaults.legalBusiness, c.legalBusiness || {});
    var facturaDirecta = Object.assign({}, defaults.facturaDirecta, c.facturaDirecta || {});
    var iva = _num(c.defaultIvaRate != null ? c.defaultIvaRate : (c.ivaPadrao != null ? c.ivaPadrao : defaults.defaultIvaRate));
    var normalized = Object.assign({}, defaults, c || {}, {
      countryCode: _normalizeCountryCode(c.countryCode || legal.countryCode || defaults.countryCode),
      currency: _normalizeCurrency(c.currency || defaults.currency),
      defaultIvaRate: iva || defaults.defaultIvaRate,
      pricesIncludeIva: c.pricesIncludeIva !== false,
      invoiceMode: c.invoiceMode === 'manual' ? 'manual' : 'automatic',
      defaultInvoiceType: c.defaultInvoiceType === 'full' ? 'full' : 'simplified',
      invoiceSeries: String(c.invoiceSeries || defaults.invoiceSeries).trim() || defaults.invoiceSeries,
      nextInvoiceNumber: Math.max(1, parseInt(c.nextInvoiceNumber, 10) || defaults.nextInvoiceNumber),
      facturaDirecta: facturaDirecta,
      legalBusiness: legal,
      ivaPadrao: iva || defaults.defaultIvaRate,
      irpfPadrao: _num(c.irpfPadrao != null ? c.irpfPadrao : defaults.irpfPadrao),
      trimestreAtual: c.trimestreAtual || defaults.trimestreAtual,
      usarCalculoFiscal: c.usarCalculoFiscal !== false
    });
    normalized.legalBusiness.countryCode = _normalizeCountryCode(normalized.legalBusiness.countryCode || normalized.countryCode);
    return normalized;
  }

  function _renderSub() {
    if (_activeSub === 'configuracoes') return _renderConfig();
    if (_activeSub === 'iva') return _renderIva();
    if (_activeSub === 'irpf') return _renderIrpf();
    if (_activeSub === 'resumo') return _renderResumo();
    _activeSub = 'resumo';
    return _renderResumo();
  }

  function _renderConfig() {
    var c = _data.config;
    var fd = c.facturaDirecta || {};
    var legal = c.legalBusiness || {};
    var fdStatus = fd.connectionStatus === 'connected' ? 'Conectado' : 'Não conectado';
    _content(
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
          '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Configuração fiscal</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:680px;">Prepare os dados de faturação do seu negócio para uma futura integração fiscal. Esta tela ainda não emite faturas nem envia documentos para nenhum provedor.</p></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
            _chip(_countryLabel(c.countryCode)) +
            _chip((c.defaultIvaRate || 0) + '% IVA') +
            _chip(_invoiceModeLabel(c.invoiceMode)) +
            _chip('FacturaDirecta: ' + fdStatus) +
          '</div>' +
        '</div>' +
        '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;align-items:start;">' +
          '<div style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:18px;">' +
            '<div><div style="font-size:15px;font-weight:700;color:#1F1F1F;">Dados de faturação</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:3px;">Configurações básicas para preparar faturas simplificadas e completas no futuro.</div></div>' +
            '<div style="' + _softGroupStyle() + '">' +
              '<div style="font-size:12px;font-weight:700;color:#1F1F1F;margin-bottom:12px;">Regras padrão</div>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
                _select('fis-country', 'País fiscal', _countryOptions(c.countryCode)) +
                _select('fis-currency', 'Moeda', _currencyOptions(c.currency)) +
                _field('fis-default-iva', 'IVA padrão (%)', c.defaultIvaRate, 'number') +
                _select('fis-prices-iva', 'Preços incluem IVA', '<option value="sim"' + (c.pricesIncludeIva !== false ? ' selected' : '') + '>Sim</option><option value="nao"' + (c.pricesIncludeIva === false ? ' selected' : '') + '>Não</option>') +
                _select('fis-default-invoice-type', 'Tipo de fatura padrão', _invoiceTypeOptions(c.defaultInvoiceType)) +
                _select('fis-invoice-mode', 'Emissão', _invoiceModeOptions(c.invoiceMode)) +
                _field('fis-series', 'Série', c.invoiceSeries, 'text') +
                _field('fis-next-number', 'Próximo número', c.nextInvoiceNumber, 'number') +
              '</div>' +
            '</div>' +
            '<div style="' + _softGroupStyle() + '">' +
              '<div style="font-size:12px;font-weight:700;color:#1F1F1F;margin-bottom:12px;">Dados fiscais do negócio</div>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
                _field('fis-legal-name', 'Nome fiscal', legal.legalName, 'text') +
                _field('fis-commercial-name', 'Nome comercial', legal.commercialName, 'text') +
                _select('fis-doc-type', 'Tipo de documento', _documentTypeOptions(legal.documentType)) +
                _field('fis-fiscal-id', 'NIF / NIE / CIF', legal.fiscalId, 'text') +
                _field('fis-tax-regime', 'Regime fiscal', legal.taxRegime, 'text') +
                _field('fis-invoice-email', 'E-mail para faturas', legal.invoiceEmail, 'email') +
                _field('fis-address', 'Endereço fiscal', legal.address, 'text') +
                _field('fis-number', 'Número', legal.number, 'text') +
                _field('fis-complement', 'Complemento', legal.complement, 'text') +
                _field('fis-city', 'Cidade', legal.city, 'text') +
                _field('fis-province', 'Província', legal.province, 'text') +
                _field('fis-postal-code', 'Código postal', legal.postalCode, 'text') +
              '</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:2px;">' +
              '<div style="font-size:12px;color:#8A7E7C;line-height:1.4;">Revise os dados antes de salvar. Nenhuma fatura será emitida nesta etapa.</div>' +
              '<button onclick="Modules.Fiscal._saveConfig()" style="' + _primaryStyle() + '">Salvar alterações</button>' +
            '</div>' +
          '</div>' +
          '<aside style="display:flex;flex-direction:column;gap:12px;">' +
            '<div style="' + _cardStyle('16px') + 'display:flex;flex-direction:column;gap:10px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
                '<div style="font-size:14px;font-weight:700;color:#1F1F1F;">FacturaDirecta</div>' +
                '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:11px;font-weight:700;">Em breve</span>' +
              '</div>' +
              '<div style="font-size:13px;color:#6F6860;line-height:1.45;">A conexão com provedor externo ainda não está ativa. Nenhuma chave ou token é solicitado nesta fase.</div>' +
              '<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:2px;">' +
                _readonlyMini('Status', fdStatus) +
                _readonlyMini('Modo', fd.partnerMode ? 'Parceiro' : 'Padrão futuro') +
              '</div>' +
            '</div>' +
            '<div style="' + _cardStyle('16px') + 'display:flex;gap:11px;align-items:flex-start;">' +
              '<div style="width:34px;height:34px;border-radius:12px;background:#FAF8F4;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">info</span></div>' +
              '<div style="font-size:13px;color:#6F6860;line-height:1.45;"><strong style="display:block;color:#1F1F1F;font-size:13px;margin-bottom:3px;">Preparação fiscal</strong>Estes dados ajudam a deixar produtos, clientes, fornecedores e pedidos prontos para uma integração futura. A emissão real será criada em outra etapa.</div>' +
            '</div>' +
            '<div style="' + _cardStyle('16px') + 'display:flex;gap:11px;align-items:flex-start;">' +
              '<div style="width:34px;height:34px;border-radius:12px;background:#FAF8F4;color:#6C8777;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">calculate</span></div>' +
              '<div style="font-size:13px;color:#6F6860;line-height:1.45;"><strong style="display:block;color:#1F1F1F;font-size:13px;margin-bottom:3px;">Cálculos atuais</strong>As abas de IVA e IRPF continuam usando estimativas internas. Isso não substitui contador ou gestor fiscal.</div>' +
            '</div>' +
          '</aside>' +
        '</section>' +
      '</div>'
    );
  }

  function _saveConfig() {
    var current = _normalizeFiscalConfig(_data.config || {});
    var now = new Date().toISOString();
    var iva = _num(_val('fis-default-iva')) || 10;
    var country = _normalizeCountryCode(_val('fis-country') || current.countryCode);
    var data = Object.assign({}, current, {
      countryCode: country,
      currency: _normalizeCurrency(_val('fis-currency') || current.currency),
      invoiceMode: _val('fis-invoice-mode') === 'manual' ? 'manual' : 'automatic',
      defaultInvoiceType: _val('fis-default-invoice-type') === 'full' ? 'full' : 'simplified',
      simplifiedInvoiceEnabled: true,
      fullInvoiceEnabled: true,
      defaultIvaRate: iva,
      pricesIncludeIva: _val('fis-prices-iva') !== 'nao',
      invoiceSeries: String(_val('fis-series') || 'A').trim() || 'A',
      nextInvoiceNumber: Math.max(1, parseInt(_val('fis-next-number'), 10) || 1),
      providerMode: current.providerMode || 'none',
      providerConnected: current.providerConnected === true,
      fiscalProvider: current.fiscalProvider || '',
      facturaDirecta: Object.assign({}, _defaultFiscalConfig().facturaDirecta, current.facturaDirecta || {}, {
        enabled: false,
        connectionStatus: (current.facturaDirecta && current.facturaDirecta.connectionStatus) || 'not_connected'
      }),
      legalBusiness: {
        legalName: String(_val('fis-legal-name') || '').trim(),
        commercialName: String(_val('fis-commercial-name') || '').trim(),
        documentType: String(_val('fis-doc-type') || '').trim(),
        fiscalId: String(_val('fis-fiscal-id') || '').trim(),
        taxRegime: String(_val('fis-tax-regime') || '').trim(),
        address: String(_val('fis-address') || '').trim(),
        number: String(_val('fis-number') || '').trim(),
        complement: String(_val('fis-complement') || '').trim(),
        city: String(_val('fis-city') || '').trim(),
        province: String(_val('fis-province') || '').trim(),
        postalCode: String(_val('fis-postal-code') || '').trim(),
        countryCode: country,
        invoiceEmail: String(_val('fis-invoice-email') || '').trim()
      },
      createdAt: current.createdAt || now,
      updatedAt: now,
      ivaPadrao: iva,
      irpfPadrao: current.irpfPadrao,
      trimestreAtual: current.trimestreAtual || _currentQuarterKey(),
      usarCalculoFiscal: current.usarCalculoFiscal !== false
    });
    DB.setDocRoot('config', 'fiscal', data).then(function () {
      UI.toast('Configuração fiscal salva.', 'success');
      _data.config = _normalizeConfig(data);
      _renderSub();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _renderIva() {
    var calc = _calcFiscal();
    var resultLabel = calc.ivaResultado >= 0 ? 'IVA a pagar' : 'IVA a compensar';
    var sales = _salesInQuarter();
    var purchases = _quarterItems(_data.compras, _itemDate).filter(_isVatDeductible);
    var periodLabel = String(_data.config.trimestreAtual || _currentQuarterKey()).replace('-T', ' / T');
    var chipStyle = 'display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);';
    var kpis =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
        _metricCard('IVA das vendas', UI.fmt(calc.ivaVendas), 'Estimado no trimestre.', 'receipt_long', '#B45309') +
        _metricCard('IVA compras dedutível', UI.fmt(calc.ivaComprasDedutivel), 'Compras marcadas como dedutíveis.', 'shopping_cart', '#1F6F43') +
        _metricCard(resultLabel, UI.fmt(Math.abs(calc.ivaResultado)), calc.ivaResultado >= 0 ? 'Resultado positivo.' : 'Crédito estimado.', calc.ivaResultado >= 0 ? 'payments' : 'savings', calc.ivaResultado >= 0 ? '#B42318' : '#1F6F43') +
        _metricCard('IVA aplicado', (_data.config.ivaPadrao || 0) + '%', 'Configuração fiscal atual.', 'percent', '#6C8777') +
      '</div>';
    var rows = _ivaRows(sales, purchases);
    _ivaView.detalhe = rows;
    var filtered = _ivaFilterRows(rows);
    var paging = _ivaPaging(filtered);
    var pageRows = paging.items;
    var pageSizeOptions = [8, 12, 24, 48].map(function (n) { return '<option value="' + n + '"' + (Number(_ivaView.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('');
    var filterCard = '<section style="' + _cardStyle() + '">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Filtros</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Refine por busca, origem e impacto no IVA.</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><span style="' + chipStyle + '">' + filtered.length + ' movimento(s)</span><span style="' + chipStyle + '">Página ' + paging.page + ' de ' + paging.totalPages + '</span></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(240px,1.4fr) minmax(150px,.7fr) minmax(150px,.7fr) auto;gap:12px;align-items:end;">' +
        '<div><label style="' + _labelStyle() + '">Busca</label><input id="fis-iva-busca" type="search" value="' + _esc(_ivaView.busca || '') + '" oninput="Modules.Fiscal._setIvaFiltro(\'busca\',this.value)" placeholder="Buscar referência, fornecedor, tipo ou valor..." style="' + _inputStyle() + 'height:40px;"></div>' +
        '<div><label style="' + _labelStyle() + '">Tipo</label><select onchange="Modules.Fiscal._setIvaFiltro(\'tipo\',this.value)" style="' + _inputStyle() + 'height:40px;background:#fff;"><option value="todos"' + (_ivaView.tipo === 'todos' ? ' selected' : '') + '>Todos</option><option value="Venda"' + (_ivaView.tipo === 'Venda' ? ' selected' : '') + '>Vendas</option><option value="Compra"' + (_ivaView.tipo === 'Compra' ? ' selected' : '') + '>Compras</option></select></div>' +
        '<div><label style="' + _labelStyle() + '">Impacto</label><select onchange="Modules.Fiscal._setIvaFiltro(\'impacto\',this.value)" style="' + _inputStyle() + 'height:40px;background:#fff;"><option value="todos"' + (_ivaView.impacto === 'todos' ? ' selected' : '') + '>Todos</option><option value="debito"' + (_ivaView.impacto === 'debito' ? ' selected' : '') + '>IVA das vendas</option><option value="credito"' + (_ivaView.impacto === 'credito' ? ' selected' : '') + '>IVA dedutível</option></select></div>' +
        '<button onclick="Modules.Fiscal._limparIvaFiltros()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-weight:700;color:#6F6860;background:#fff;cursor:pointer;font-family:inherit;">Limpar</button>' +
      '</div>' +
    '</section>';
    var pagination = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<select onchange="Modules.Fiscal._setIvaPageSize(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">' + pageSizeOptions + '</select>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Fiscal._setIvaPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Fiscal._setIvaPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>' : '';
    var table = filtered.length
      ? '<section style="display:flex;flex-direction:column;gap:10px;">' +
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Movimentos considerados no IVA</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Confira vendas e compras dedutíveis usadas na estimativa.</div></div>' +
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
            '<div style="overflow:auto;">' +
              '<table style="width:100%;min-width:960px;border-collapse:separate;border-spacing:0;">' +
                '<thead><tr style="background:#fff;">' +
                  '<th style="' + _thStyle() + '">Tipo</th>' +
                  '<th style="' + _thStyle() + '">Referência</th>' +
                  '<th style="' + _thStyle() + '">Data</th>' +
                  '<th style="' + _thStyle() + 'text-align:right;">Base</th>' +
                  '<th style="' + _thStyle() + 'text-align:right;">IVA</th>' +
                  '<th style="' + _thStyle() + '">Impacto</th>' +
                  '<th style="' + _thStyle() + 'text-align:right;">Ações</th>' +
                '</tr></thead><tbody>' +
                pageRows.map(function (r) {
                  return '<tr style="transition:background .15s ease;" onmouseover="this.style.background=\'#FAF8F4\'" onmouseout="this.style.background=\'#fff\'">' +
                    '<td style="' + _tdStyle() + '"><span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:' + r.color + ';font-size:12px;font-weight:700;">' + _esc(r.tipo) + '</span></td>' +
                    '<td style="' + _tdStyle() + '"><div style="font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(r.ref) + '</div>' + (r.supplier ? '<div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(r.supplier) + '</div>' : '') + '</td>' +
                    '<td style="' + _tdStyle() + 'color:#6F6860;">' + _esc(_fmtDate(r.date)) + '</td>' +
                    '<td style="' + _tdStyle() + 'text-align:right;font-weight:700;color:#1F1F1F;">' + UI.fmt(r.base) + '</td>' +
                    '<td style="' + _tdStyle() + 'text-align:right;font-weight:700;color:' + r.color + ';">' + UI.fmt(r.iva) + '</td>' +
                    '<td style="' + _tdStyle() + '"><span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:' + (r.impact >= 0 ? '#FFF5F5' : '#F0FFF4') + ';color:' + (r.impact >= 0 ? '#B42318' : '#1F6F43') + ';font-size:12px;font-weight:700;">' + _esc(r.status) + '</span></td>' +
                    '<td style="' + _tdStyle() + 'text-align:right;"><button onclick="Modules.Fiscal._openIvaDetalhe(\'' + _esc(r.uid) + '\')" title="Ver detalhes" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:17px;">visibility</span></button></td>' +
                  '</tr>';
                }).join('') +
                '</tbody></table>' +
            '</div>' +
            pagination +
          '</div>' +
        '</section>'
      : '<section style="' + _cardStyle() + 'text-align:center;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum movimento encontrado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Ainda não há vendas ou compras dedutíveis no trimestre selecionado.</div></section>';
    _content(
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
          '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">IVA</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Acompanhe IVA das vendas, compras dedutíveis e saldo estimado do trimestre.</p></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><span style="' + chipStyle + '">' + _esc(periodLabel) + '</span><span style="' + chipStyle + '">' + sales.length + ' venda(s)</span><span style="' + chipStyle + '">' + purchases.length + ' compra(s) dedutível(is)</span></div>' +
        '</div>' +
        kpis +
        '<section style="' + _cardStyle() + 'display:flex;gap:12px;align-items:flex-start;">' +
          '<div style="width:38px;height:38px;border-radius:12px;background:#FAF8F4;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:22px;">info</span></div>' +
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;margin-bottom:3px;">Cálculo estimado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">As compras entram no IVA dedutível apenas quando marcadas como dedutíveis para IVA. Não substitui contador ou gestor fiscal.</div></div>' +
        '</section>' +
        filterCard +
        table +
      '</div>'
    );
  }

  function _renderIrpf() {
    var calc = _calcFiscal();
    var sales = _salesInQuarter();
    var purchases = _quarterItems(_data.compras, _itemDate).filter(_isIrpfDeductible);
    var expenses = _quarterItems((_data.saidas || []).concat(_data.apagar || []), _itemDate).filter(_isIrpfDeductible);
    var periodLabel = String(_data.config.trimestreAtual || _currentQuarterKey()).replace('-T', ' / T');
    var rows = _irpfRows(sales, purchases, expenses);
    _irpfView.detalhe = rows;
    var filtered = _irpfFilterRows(rows);
    var paging = _irpfPaging(filtered);
    var pageRows = paging.items;
    var chipStyle = 'display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);';
    var pageSizeOptions = [8, 12, 24, 48].map(function (n) { return '<option value="' + n + '"' + (Number(_irpfView.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('');
    var kpis = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
      _metricCard('Receita sem IVA', UI.fmt(calc.receitaSemIVA), 'Vendas do trimestre.', 'receipt_long', '#1F6F43') +
      _metricCard('Gastos dedutíveis', UI.fmt(calc.gastosDedutiveis), 'Compras e despesas dedutíveis.', 'shopping_bag', '#B45309') +
      _metricCard('Lucro fiscal', UI.fmt(calc.lucroFiscal), 'Base estimada.', 'trending_up', calc.lucroFiscal >= 0 ? '#6C8777' : '#B42318') +
      _metricCard('IRPF estimado', UI.fmt(calc.irpfEstimado), (_data.config.irpfPadrao || 0) + '% sobre lucro positivo.', 'request_quote', '#B42318') +
    '</div>';
    var filterCard = '<section style="' + _cardStyle() + '">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Filtros</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Refine por busca, origem e impacto fiscal.</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><span style="' + chipStyle + '">' + filtered.length + ' movimento(s)</span><span style="' + chipStyle + '">Página ' + paging.page + ' de ' + paging.totalPages + '</span></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(240px,1.4fr) minmax(150px,.7fr) minmax(150px,.7fr) auto;gap:12px;align-items:end;">' +
        '<div><label style="' + _labelStyle() + '">Busca</label><input id="fis-irpf-busca" type="search" value="' + _esc(_irpfView.busca || '') + '" oninput="Modules.Fiscal._setIrpfFiltro(\'busca\',this.value)" placeholder="Buscar referência, fornecedor, tipo ou valor..." style="' + _inputStyle() + 'height:40px;"></div>' +
        '<div><label style="' + _labelStyle() + '">Tipo</label><select onchange="Modules.Fiscal._setIrpfFiltro(\'tipo\',this.value)" style="' + _inputStyle() + 'height:40px;background:#fff;"><option value="todos"' + (_irpfView.tipo === 'todos' ? ' selected' : '') + '>Todos</option><option value="Receita"' + (_irpfView.tipo === 'Receita' ? ' selected' : '') + '>Receitas</option><option value="Compra"' + (_irpfView.tipo === 'Compra' ? ' selected' : '') + '>Compras</option><option value="Despesa"' + (_irpfView.tipo === 'Despesa' ? ' selected' : '') + '>Despesas</option></select></div>' +
        '<div><label style="' + _labelStyle() + '">Impacto</label><select onchange="Modules.Fiscal._setIrpfFiltro(\'impacto\',this.value)" style="' + _inputStyle() + 'height:40px;background:#fff;"><option value="todos"' + (_irpfView.impacto === 'todos' ? ' selected' : '') + '>Todos</option><option value="receita"' + (_irpfView.impacto === 'receita' ? ' selected' : '') + '>Aumenta base</option><option value="deducao"' + (_irpfView.impacto === 'deducao' ? ' selected' : '') + '>Deduz base</option></select></div>' +
        '<button onclick="Modules.Fiscal._limparIrpfFiltros()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-weight:700;color:#6F6860;background:#fff;cursor:pointer;font-family:inherit;">Limpar</button>' +
      '</div>' +
    '</section>';
    var pagination = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;"><select onchange="Modules.Fiscal._setIrpfPageSize(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">' + pageSizeOptions + '</select><div style="display:flex;align-items:center;gap:6px;"><button type="button" onclick="Modules.Fiscal._setIrpfPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div><button type="button" onclick="Modules.Fiscal._setIrpfPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button></div></div>' +
    '</div>' : '';
    var table = filtered.length
      ? '<section style="display:flex;flex-direction:column;gap:10px;"><div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Movimentos considerados no IRPF</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Confira receitas e gastos dedutíveis usados na estimativa.</div></div><div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="overflow:auto;"><table style="width:100%;min-width:960px;border-collapse:separate;border-spacing:0;"><thead><tr style="background:#fff;"><th style="' + _thStyle() + '">Tipo</th><th style="' + _thStyle() + '">Referência</th><th style="' + _thStyle() + '">Data</th><th style="' + _thStyle() + 'text-align:right;">Base</th><th style="' + _thStyle() + 'text-align:right;">Impacto</th><th style="' + _thStyle() + '">Efeito</th><th style="' + _thStyle() + 'text-align:right;">Ações</th></tr></thead><tbody>' +
        pageRows.map(function (r) {
          return '<tr style="transition:background .15s ease;" onmouseover="this.style.background=\'#FAF8F4\'" onmouseout="this.style.background=\'#fff\'"><td style="' + _tdStyle() + '"><span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:' + r.color + ';font-size:12px;font-weight:700;">' + _esc(r.tipo) + '</span></td><td style="' + _tdStyle() + '"><div style="font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(r.ref) + '</div>' + (r.supplier ? '<div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(r.supplier) + '</div>' : '') + '</td><td style="' + _tdStyle() + 'color:#6F6860;">' + _esc(_fmtDate(r.date)) + '</td><td style="' + _tdStyle() + 'text-align:right;font-weight:700;color:#1F1F1F;">' + UI.fmt(r.base) + '</td><td style="' + _tdStyle() + 'text-align:right;font-weight:700;color:' + r.color + ';">' + UI.fmt(Math.abs(r.impact)) + '</td><td style="' + _tdStyle() + '"><span style="display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:999px;background:' + (r.impact >= 0 ? '#F0FFF4' : '#FFF5F5') + ';color:' + (r.impact >= 0 ? '#1F6F43' : '#B42318') + ';font-size:12px;font-weight:700;">' + _esc(r.status) + '</span></td><td style="' + _tdStyle() + 'text-align:right;"><button onclick="Modules.Fiscal._openIrpfDetalhe(\'' + _esc(r.uid) + '\')" title="Ver detalhes" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:17px;">visibility</span></button></td></tr>';
        }).join('') + '</tbody></table></div>' + pagination + '</div></section>'
      : '<section style="' + _cardStyle() + 'text-align:center;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum movimento encontrado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Ainda não há receitas ou gastos dedutíveis no trimestre selecionado.</div></section>';
    _content('<div style="display:flex;flex-direction:column;gap:16px;"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;"><div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">IRPF</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Acompanhe receita sem IVA, gastos dedutíveis, lucro fiscal e imposto estimado.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><span style="' + chipStyle + '">' + _esc(periodLabel) + '</span><span style="' + chipStyle + '">' + sales.length + ' receita(s)</span><span style="' + chipStyle + '">' + (purchases.length + expenses.length) + ' gasto(s) dedutível(is)</span></div></div>' + kpis + '<section style="' + _cardStyle() + 'display:flex;gap:12px;align-items:flex-start;"><div style="width:38px;height:38px;border-radius:12px;background:#FAF8F4;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:22px;">info</span></div><div><div style="font-size:14px;font-weight:700;color:#1F1F1F;margin-bottom:3px;">Cálculo estimado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">O IRPF estimado considera receita sem IVA menos gastos marcados como dedutíveis para IRPF. Não substitui contador ou gestor fiscal.</div></div></section>' + filterCard + table + '</div>');
  }

  function _renderResumo() {
    var calc = _calcFiscal();
    var ivaLabel = calc.ivaResultado >= 0 ? 'IVA a pagar' : 'IVA a compensar';
    var periodLabel = String(_data.config.trimestreAtual || _currentQuarterKey()).replace('-T', ' / T');
    var sales = _salesInQuarter();
    var purchases = _quarterItems(_data.compras, _itemDate);
    var expenses = _quarterItems((_data.saidas || []).concat(_data.apagar || []), _itemDate);
    var ivaColor = calc.ivaResultado >= 0 ? '#B42318' : '#1F6F43';
    var lucroColor = calc.lucroFiscal >= 0 ? '#1F6F43' : '#B42318';
    var impostosEstimados = Math.max(0, calc.ivaResultado) + calc.irpfEstimado;
    var cargaEfetiva = calc.vendasBrutas > 0 ? (impostosEstimados / calc.vendasBrutas) * 100 : 0;
    var deducaoRatio = calc.receitaSemIVA > 0 ? Math.min(100, (calc.gastosDedutiveis / calc.receitaSemIVA) * 100) : 0;
    var chipStyle = 'display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);';
    var kpis = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
      _metricCard('Vendas brutas', UI.fmt(calc.vendasBrutas), sales.length + ' movimento(s) no trimestre.', 'point_of_sale', '#6C8777') +
      _metricCard(ivaLabel, UI.fmt(Math.abs(calc.ivaResultado)), calc.ivaResultado >= 0 ? 'Saldo estimado de IVA.' : 'Crédito estimado de IVA.', calc.ivaResultado >= 0 ? 'payments' : 'savings', ivaColor) +
      _metricCard('IRPF estimado', UI.fmt(calc.irpfEstimado), (_data.config.irpfPadrao || 0) + '% sobre lucro positivo.', 'request_quote', '#B42318') +
      _metricCard('Lucro fiscal', UI.fmt(calc.lucroFiscal), 'Receita sem IVA menos deduções.', 'trending_up', lucroColor) +
    '</div>';
    var composition = '<section style="' + _cardStyle() + '">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Composição do resultado fiscal</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Como vendas, IVA, deduções e lucro fiscal se conectam no trimestre.</div></div>' +
        '<span style="' + chipStyle + '">' + _esc(periodLabel) + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:16px;align-items:stretch;">' +
        '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;">' +
          _summaryFlowLine('Vendas brutas estimadas', UI.fmt(calc.vendasBrutas), '#6C8777') +
          _summaryFlowLine('IVA das vendas', UI.fmt(calc.ivaVendas), '#B45309') +
          _summaryFlowLine('IVA compras dedutível', UI.fmt(calc.ivaComprasDedutivel), '#1F6F43') +
          _summaryFlowLine(ivaLabel, UI.fmt(Math.abs(calc.ivaResultado)), ivaColor) +
          _summaryFlowLine('Receita sem IVA', UI.fmt(calc.receitaSemIVA), '#1F1F1F') +
          _summaryFlowLine('Gastos dedutíveis IRPF', UI.fmt(calc.gastosDedutiveis), '#B45309') +
          _summaryFlowLine('Lucro fiscal estimado', UI.fmt(calc.lucroFiscal), lucroColor, true) +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
          _summaryInsightCard('Carga estimada', UI.fmt(impostosEstimados), cargaEfetiva.toFixed(1).replace('.', ',') + '% das vendas brutas', 'account_balance', impostosEstimados > 0 ? '#B42318' : '#1F6F43') +
          _summaryInsightCard('Deduções sobre receita', deducaoRatio.toFixed(1).replace('.', ',') + '%', calc.comprasDedutiveis.length + ' compra(s) marcada(s)', 'rule', '#B45309') +
          _summaryInsightCard('Base fiscal', UI.fmt(calc.receitaSemIVA), 'Receita considerada sem IVA.', 'analytics', '#6C8777') +
        '</div>' +
      '</div>' +
    '</section>';
    var split = '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">' +
      '<div style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:14px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">IVA</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Resumo da posição estimada de IVA.</div></div>' +
        _summaryBar('IVA das vendas', calc.ivaVendas, Math.max(calc.ivaVendas, calc.ivaComprasDedutivel), '#B45309') +
        _summaryBar('IVA dedutível', calc.ivaComprasDedutivel, Math.max(calc.ivaVendas, calc.ivaComprasDedutivel), '#1F6F43') +
        '<div style="padding-top:2px;font-size:13px;color:#6F6860;line-height:1.45;">Resultado: <strong style="color:' + ivaColor + ';font-weight:700;">' + _esc(ivaLabel) + ' de ' + UI.fmt(Math.abs(calc.ivaResultado)) + '</strong></div>' +
      '</div>' +
      '<div style="' + _cardStyle() + 'display:flex;flex-direction:column;gap:14px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">IRPF</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Resumo da base estimada de imposto de renda.</div></div>' +
        _summaryBar('Receita sem IVA', calc.receitaSemIVA, Math.max(calc.receitaSemIVA, calc.gastosDedutiveis), '#1F6F43') +
        _summaryBar('Gastos dedutíveis', calc.gastosDedutiveis, Math.max(calc.receitaSemIVA, calc.gastosDedutiveis), '#B45309') +
        '<div style="padding-top:2px;font-size:13px;color:#6F6860;line-height:1.45;">IRPF estimado: <strong style="color:#B42318;font-weight:700;">' + UI.fmt(calc.irpfEstimado) + '</strong></div>' +
      '</div>' +
    '</section>';
    var insightText = calc.vendasBrutas <= 0
      ? 'Ainda não há vendas no trimestre selecionado para gerar uma leitura fiscal consistente.'
      : calc.lucroFiscal <= 0
        ? 'O lucro fiscal está zerado ou negativo no trimestre. Revise receitas e deduções antes de usar a estimativa para planejamento.'
        : impostosEstimados <= 0
          ? 'A estimativa atual não aponta imposto a pagar, considerando o crédito de IVA e a base de IRPF calculada.'
          : 'Há imposto estimado para o trimestre. Use esta visão para antecipar caixa e revisar compras dedutíveis antes do fechamento.';
    var alerts = '<section style="' + _cardStyle() + 'display:flex;gap:12px;align-items:flex-start;">' +
      '<div style="width:38px;height:38px;border-radius:12px;background:#FAF8F4;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:22px;">tips_and_updates</span></div>' +
      '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;margin-bottom:3px;">Leitura rápida</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">' + _esc(insightText) + '</div><div style="font-size:12px;color:#8A7E7C;line-height:1.45;margin-top:8px;">Cálculo estimado. Não substitui contador ou gestor fiscal.</div></div>' +
    '</section>';
    _content('<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Resumo trimestral</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Veja a posição fiscal estimada do trimestre em uma visão de desempenho.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><span style="' + chipStyle + '">' + _esc(periodLabel) + '</span><span style="' + chipStyle + '">' + sales.length + ' venda(s)</span><span style="' + chipStyle + '">' + purchases.length + ' compra(s)</span><span style="' + chipStyle + '">' + expenses.length + ' saída(s)</span></div>' +
      '</div>' +
      kpis +
      composition +
      split +
      alerts +
    '</div>');
  }

  function _renderCompras() {
    var rows = _compraFiscalRows();
    _comprasView.detalhe = rows;
    var filtered = _compraFilterRows(rows);
    var paging = _compraPaging(filtered);
    var pageRows = paging.items;
    var periodLabel = String(_data.config.trimestreAtual || _currentQuarterKey()).replace('-T', ' / T');
    var total = rows.reduce(function (s, r) { return s + r.total; }, 0);
    var ivaCount = rows.filter(function (r) { return r.iva; }).length;
    var irpfCount = rows.filter(function (r) { return r.irpf; }).length;
    var bothCount = rows.filter(function (r) { return r.iva && r.irpf; }).length;
    var chipStyle = 'display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);';
    var pageSizeOptions = [8, 12, 24, 48].map(function (n) { return '<option value="' + n + '"' + (Number(_comprasView.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('');
    var categoryOptions = '<option value="todos"' + (_comprasView.categoria === 'todos' ? ' selected' : '') + '>Todas</option>' + FISCAL_CATEGORIES.map(function (p) {
      return '<option value="' + p[0] + '"' + (_comprasView.categoria === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
    }).join('');
    var kpis = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
      _metricCard('Compras do trimestre', rows.length, 'Registros carregados.', 'shopping_cart', '#6C8777') +
      _metricCard('Valor em compras', UI.fmt(total), 'Total bruto considerado.', 'payments', '#B45309') +
      _metricCard('Dedutíveis para IVA', ivaCount, 'Marcadas para crédito de IVA.', 'receipt_long', '#1F6F43') +
      _metricCard('Dedutíveis para IRPF', irpfCount, 'Marcadas para base fiscal.', 'request_quote', '#B42318') +
    '</div>';
    var filterCard = '<section style="' + _cardStyle() + '">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px;">' +
        '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Filtros</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Refine por busca, dedutibilidade e categoria fiscal.</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><span style="' + chipStyle + '">' + filtered.length + ' compra(s)</span><span style="' + chipStyle + '">Página ' + paging.page + ' de ' + paging.totalPages + '</span></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(240px,1.35fr) minmax(170px,.75fr) minmax(170px,.75fr) auto;gap:12px;align-items:end;">' +
        '<div><label style="' + _labelStyle() + '">Busca</label><input id="fis-compra-search" type="search" value="' + _esc(_comprasView.busca || '') + '" oninput="Modules.Fiscal._setCompraFiltro(\'busca\',this.value)" placeholder="Buscar compra, fornecedor, documento ou valor..." style="' + _inputStyle() + 'height:40px;"></div>' +
        '<div><label style="' + _labelStyle() + '">Dedutibilidade</label><select onchange="Modules.Fiscal._setCompraFiltro(\'deducao\',this.value)" style="' + _inputStyle() + 'height:40px;background:#fff;"><option value="todos"' + (_comprasView.deducao === 'todos' ? ' selected' : '') + '>Todas</option><option value="iva"' + (_comprasView.deducao === 'iva' ? ' selected' : '') + '>Dedutível IVA</option><option value="irpf"' + (_comprasView.deducao === 'irpf' ? ' selected' : '') + '>Dedutível IRPF</option><option value="ambos"' + (_comprasView.deducao === 'ambos' ? ' selected' : '') + '>IVA e IRPF</option><option value="nenhum"' + (_comprasView.deducao === 'nenhum' ? ' selected' : '') + '>Não dedutível</option></select></div>' +
        '<div><label style="' + _labelStyle() + '">Categoria fiscal</label><select onchange="Modules.Fiscal._setCompraFiltro(\'categoria\',this.value)" style="' + _inputStyle() + 'height:40px;background:#fff;">' + categoryOptions + '</select></div>' +
        '<button onclick="Modules.Fiscal._limparCompraFiltros()" style="height:40px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-weight:700;color:#6F6860;background:#fff;cursor:pointer;font-family:inherit;">Limpar</button>' +
      '</div>' +
    '</section>';
    var pagination = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;"><select onchange="Modules.Fiscal._setCompraPageSize(this.value)" style="min-width:110px;max-width:110px;height:34px;padding:0 10px;border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#fff;color:#6F6860;box-sizing:border-box;">' + pageSizeOptions + '</select><div style="display:flex;align-items:center;gap:6px;"><button type="button" onclick="Modules.Fiscal._setCompraPage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div><button type="button" onclick="Modules.Fiscal._setCompraPage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button></div></div>' +
    '</div>' : '';
    var table = filtered.length
      ? '<section style="display:flex;flex-direction:column;gap:10px;"><div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Compras do trimestre</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Marque o que entra no IVA, no IRPF e ajuste a categoria fiscal de cada compra.</div></div><div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);"><div style="overflow:auto;"><table style="width:100%;min-width:1040px;border-collapse:separate;border-spacing:0;"><thead><tr style="background:#fff;"><th style="' + _thStyle() + '">Compra</th><th style="' + _thStyle() + '">Fornecedor</th><th style="' + _thStyle() + 'text-align:right;">Total</th><th style="' + _thStyle() + 'text-align:center;">IVA</th><th style="' + _thStyle() + 'text-align:center;">IRPF</th><th style="' + _thStyle() + '">Categoria fiscal</th><th style="' + _thStyle() + 'text-align:right;">Ações</th></tr></thead><tbody>' +
        pageRows.map(_compraRow).join('') +
        '</tbody></table></div>' + pagination + '</div></section>'
      : '<section style="' + _cardStyle() + 'text-align:center;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma compra encontrada</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Ajuste os filtros ou confira se há compras no trimestre selecionado.</div></section>';
    _content('<div style="display:flex;flex-direction:column;gap:16px;"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;"><div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Compras dedutíveis</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Classifique compras que entram no IVA, no IRPF e no resumo fiscal do trimestre.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><span style="' + chipStyle + '">' + _esc(periodLabel) + '</span><span style="' + chipStyle + '">' + rows.length + ' compra(s)</span><span style="' + chipStyle + '">' + bothCount + ' para IVA e IRPF</span></div></div>' + kpis + filterCard + table + '</div>');
  }

  function _compraFiscalRows() {
    return _quarterItems(_data.compras, _itemDate).map(function (c, i) {
      var category = c.categoriaFiscal || c.fiscalCategory || 'outro';
      return {
        uid: 'compra-fiscal-' + (c.id || c.numDocumento || i),
        id: c.id,
        ref: c.numDocumento || c.numeroDocumento || c.id || 'Compra',
        date: _itemDate(c),
        supplier: _supplierName(c.fornecedorId) || c.fornecedorNome || c.fornecedor || '',
        total: _itemValue(c),
        iva: _isVatDeductible(c),
        irpf: _isIrpfDeductible(c),
        category: category,
        categoryLabel: _fiscalCategoryLabel(category),
        raw: c
      };
    }).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }

  function _compraFilterRows(rows) {
    var q = String(_comprasView.busca || '').toLowerCase().trim();
    return (rows || []).filter(function (r) {
      if (_comprasView.categoria !== 'todos' && r.category !== _comprasView.categoria) return false;
      if (_comprasView.deducao === 'iva' && !r.iva) return false;
      if (_comprasView.deducao === 'irpf' && !r.irpf) return false;
      if (_comprasView.deducao === 'ambos' && (!r.iva || !r.irpf)) return false;
      if (_comprasView.deducao === 'nenhum' && (r.iva || r.irpf)) return false;
      if (q) {
        var hay = [r.ref, r.supplier, r.categoryLabel, _fmtDate(r.date), String(r.total), r.iva ? 'iva' : '', r.irpf ? 'irpf' : ''].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function _compraPaging(items) {
    var total = (items || []).length;
    var pageSize = Math.max(6, parseInt(_comprasView.pageSize, 10) || 12);
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, parseInt(_comprasView.page, 10) || 1), totalPages);
    if (_comprasView.page !== page) _comprasView.page = page;
    var start = (page - 1) * pageSize;
    return {
      items: (items || []).slice(start, start + pageSize),
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(total, start + pageSize)
    };
  }

  function _compraRow(r) {
    var id = _esc(r.id || '');
    var disabled = r.id ? '' : ' disabled';
    var disabledStyle = r.id ? '' : 'opacity:.45;cursor:not-allowed;';
    return '<tr style="transition:background .15s ease;" onmouseover="this.style.background=\'#FAF8F4\'" onmouseout="this.style.background=\'#fff\'">' +
      '<td style="' + _tdStyle() + '"><div style="font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(r.ref) + '</div><div style="font-size:11px;color:#6F6860;margin-top:2px;">' + _esc(_fmtDate(r.date)) + '</div></td>' +
      '<td style="' + _tdStyle() + 'color:#6F6860;">' + _esc(r.supplier || '-') + '</td>' +
      '<td style="' + _tdStyle() + 'text-align:right;font-weight:700;color:#1F1F1F;">' + UI.fmt(r.total) + '</td>' +
      '<td style="' + _tdStyle() + 'text-align:center;"><label style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:10px;background:' + (r.iva ? '#F0FFF4' : '#FAF8F4') + ';border:1px solid #EAE4DA;cursor:pointer;"><input id="fis-iva-' + id + '" type="checkbox" ' + (r.iva ? 'checked' : '') + disabled + ' style="accent-color:#B42318;width:16px;height:16px;cursor:pointer;"></label></td>' +
      '<td style="' + _tdStyle() + 'text-align:center;"><label style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:10px;background:' + (r.irpf ? '#FFF5F5' : '#FAF8F4') + ';border:1px solid #EAE4DA;cursor:pointer;"><input id="fis-irpf-' + id + '" type="checkbox" ' + (r.irpf ? 'checked' : '') + disabled + ' style="accent-color:#B42318;width:16px;height:16px;cursor:pointer;"></label></td>' +
      '<td style="' + _tdStyle() + '"><select id="fis-cat-' + id + '" style="' + _inputStyle() + 'height:36px;background:#fff;font-size:13px;"' + disabled + '>' + _fiscalCategoryOptions(r.category) + '</select></td>' +
      '<td style="' + _tdStyle() + 'text-align:right;"><div style="display:flex;justify-content:flex-end;gap:7px;"><button onclick="Modules.Fiscal._openCompraDetalhe(\'' + _esc(r.uid) + '\')" title="Ver detalhes" style="width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:17px;">visibility</span></button><button onclick="Modules.Fiscal._saveCompraFiscal(\'' + id + '\')" title="Salvar" style="width:30px;height:30px;border-radius:9px;border:1px solid #B42318;background:#B42318;color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;' + disabledStyle + '"' + disabled + '><span class="mi" style="font-size:17px;">check</span></button></div></td>' +
    '</tr>';
  }

  function _compraRows(rows) {
    if (!rows.length) return '<tr><td colspan="7" style="padding:36px;text-align:center;color:#8A7E7C;">Nenhuma compra neste trimestre.</td></tr>';
    return rows.map(function (c) {
      var search = [_itemDate(c), c.numDocumento, _supplierName(c.fornecedorId), c.total, c.categoriaFiscal].join(' ').toLowerCase();
      return '<tr data-fis-compra="' + _esc(search) + '" style="border-top:1px solid #F2EDED;">' +
        _td('<strong>' + _esc(c.numDocumento || c.id || 'Compra') + '</strong><div style="font-size:11px;color:#8A7E7C;">' + _esc(_fmtDate(_itemDate(c))) + '</div>') +
        _td(_esc(_supplierName(c.fornecedorId) || '-')) +
        _td('<strong>' + UI.fmt(_itemValue(c)) + '</strong>') +
        _td('<input id="fis-iva-' + _esc(c.id) + '" type="checkbox" ' + (_isVatDeductible(c) ? 'checked' : '') + ' style="accent-color:#C4362A;width:16px;height:16px;">') +
        _td('<input id="fis-irpf-' + _esc(c.id) + '" type="checkbox" ' + (_isIrpfDeductible(c) ? 'checked' : '') + ' style="accent-color:#C4362A;width:16px;height:16px;">') +
        _td('<select id="fis-cat-' + _esc(c.id) + '" style="' + _inputStyle() + 'background:#fff;">' + _fiscalCategoryOptions(c.categoriaFiscal || c.fiscalCategory || 'outro') + '</select>') +
        '<td style="padding:10px;text-align:right;"><button onclick="Modules.Fiscal._saveCompraFiscal(\'' + _esc(c.id) + '\')" style="background:#C4362A;color:#fff;border:none;border-radius:9px;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Salvar</button></td>' +
        '</tr>';
    }).join('');
  }

  function _saveCompraFiscal(id) {
    var data = {
      dedutivelIva: _checked('fis-iva-' + id),
      dedutivelIrpf: _checked('fis-irpf-' + id),
      categoriaFiscal: _val('fis-cat-' + id) || 'outro'
    };
    DB.update('compras', id, data).then(function () {
      UI.toast('Compra fiscal atualizada.', 'success');
      var c = (_data.compras || []).find(function (x) { return String(x.id) === String(id); });
      if (c) Object.assign(c, data);
      _renderSub();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _filterCompras() {
    var q = (_val('fis-compra-search') || '').toLowerCase();
    document.querySelectorAll('[data-fis-compra]').forEach(function (row) {
      row.style.display = !q || (row.dataset.fisCompra || '').indexOf(q) >= 0 ? '' : 'none';
    });
  }

  function _setCompraFiltro(key, value) {
    _comprasView[key] = value;
    _comprasView.page = 1;
    _renderCompras();
    if (key === 'busca') {
      setTimeout(function () {
        var el = document.getElementById('fis-compra-search');
        if (el) { el.focus(); if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); }
      }, 0);
    }
  }

  function _limparCompraFiltros() {
    _comprasView.busca = '';
    _comprasView.deducao = 'todos';
    _comprasView.categoria = 'todos';
    _comprasView.page = 1;
    _renderCompras();
  }

  function _setCompraPage(page) {
    _comprasView.page = Math.max(1, parseInt(page, 10) || 1);
    _renderCompras();
  }

  function _setCompraPageSize(size) {
    _comprasView.pageSize = Math.max(6, parseInt(size, 10) || 12);
    _comprasView.page = 1;
    _renderCompras();
  }

  function _openCompraDetalhe(uid) {
    var r = (_comprasView.detalhe || []).find(function (x) { return String(x.uid) === String(uid); });
    if (!r) return;
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
        '<div><div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Compra dedutível</div><div style="font-size:26px;font-weight:700;color:#1F1F1F;line-height:1;">' + UI.fmt(r.total) + '</div><div style="font-size:13px;color:#6F6860;margin-top:7px;">' + _esc(r.ref) + '</div></div>' +
        '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#B42318;font-size:12px;font-weight:700;">' + _esc(r.categoryLabel) + '</span>' +
      '</div>' +
      '<div style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">' +
        _detailCell('Documento', r.ref) +
        _detailCell('Data', _fmtDate(r.date)) +
        _detailCell('Fornecedor', r.supplier || '-') +
        _detailCell('Categoria fiscal', r.categoryLabel) +
        _detailCell('Dedutível IVA', r.iva ? 'Sim' : 'Não') +
        _detailCell('Dedutível IRPF', r.irpf ? 'Sim' : 'Não') +
      '</div>' +
      '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:13px 14px;color:#6F6860;font-size:13px;line-height:1.45;">Para alterar a dedutibilidade ou categoria, use os campos diretamente na tabela e clique em salvar.</div>' +
    '</div>';
    var footer = '<div style="display:flex;justify-content:flex-end;width:100%;"><button onclick="if(window._compraDetalheModal)window._compraDetalheModal.close();" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Fechar</button></div>';
    window._compraDetalheModal = UI.modal({ title: 'Detalhes da compra', body: body, footer: footer, maxWidth: '560px' });
  }

  function _ivaRows(sales, purchases) {
    return (sales || []).map(function (x, i) {
      var gross = _itemValue(x);
      var pct = _num(x.ivaPct || x.iva || _data.config.ivaPadrao);
      var iva = _ivaFromGross(gross, pct);
      return {
        uid: 'venda-' + (x.id || x.numeroSequencial || i),
        tipo: 'Venda',
        ref: x.numeroSequencial || x.numDocumento || x.numeroDocumento || x.id || 'Venda',
        date: _itemDate(x),
        base: gross,
        pct: pct,
        iva: iva,
        impact: iva,
        status: 'IVA das vendas',
        color: '#B45309',
        raw: x
      };
    }).concat((purchases || []).map(function (x, i) {
      var gross = _itemValue(x);
      var pct = _num(x.ivaPct || x.iva || _data.config.ivaPadrao);
      var iva = _ivaFromGross(gross, pct);
      return {
        uid: 'compra-' + (x.id || x.numDocumento || i),
        tipo: 'Compra',
        ref: x.numDocumento || x.numeroDocumento || x.id || 'Compra',
        date: _itemDate(x),
        base: gross,
        pct: pct,
        iva: iva,
        impact: -iva,
        status: 'IVA dedutível',
        supplier: _supplierName(x.fornecedorId),
        color: '#1F6F43',
        raw: x
      };
    })).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }

  function _ivaFilterRows(rows) {
    var q = String(_ivaView.busca || '').toLowerCase().trim();
    return (rows || []).filter(function (r) {
      if (_ivaView.tipo !== 'todos' && r.tipo !== _ivaView.tipo) return false;
      if (_ivaView.impacto === 'debito' && r.impact < 0) return false;
      if (_ivaView.impacto === 'credito' && r.impact >= 0) return false;
      if (q) {
        var hay = [r.tipo, r.ref, r.status, r.supplier, _fmtDate(r.date), String(r.base), String(r.iva)].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function _ivaPaging(items) {
    var total = (items || []).length;
    var pageSize = Math.max(6, parseInt(_ivaView.pageSize, 10) || 12);
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, parseInt(_ivaView.page, 10) || 1), totalPages);
    if (_ivaView.page !== page) _ivaView.page = page;
    var start = (page - 1) * pageSize;
    return {
      items: (items || []).slice(start, start + pageSize),
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(total, start + pageSize)
    };
  }

  function _setIvaFiltro(key, value) {
    _ivaView[key] = value;
    _ivaView.page = 1;
    _renderIva();
    if (key === 'busca') {
      setTimeout(function () {
        var el = document.getElementById('fis-iva-busca');
        if (el) { el.focus(); if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); }
      }, 0);
    }
  }

  function _limparIvaFiltros() {
    _ivaView.busca = '';
    _ivaView.tipo = 'todos';
    _ivaView.impacto = 'todos';
    _ivaView.page = 1;
    _renderIva();
  }

  function _setIvaPage(page) {
    _ivaView.page = Math.max(1, parseInt(page, 10) || 1);
    _renderIva();
  }

  function _setIvaPageSize(size) {
    _ivaView.pageSize = Math.max(6, parseInt(size, 10) || 12);
    _ivaView.page = 1;
    _renderIva();
  }

  function _openIvaDetalhe(uid) {
    var r = (_ivaView.detalhe || []).find(function (x) { return String(x.uid) === String(uid); });
    if (!r) return;
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
        '<div><div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Detalhe do IVA</div><div style="font-size:26px;font-weight:700;color:#1F1F1F;line-height:1;">' + UI.fmt(r.iva) + '</div><div style="font-size:13px;color:#6F6860;margin-top:7px;">' + _esc(r.status) + '</div></div>' +
        '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:' + r.color + ';font-size:12px;font-weight:700;">' + _esc(r.tipo) + '</span>' +
      '</div>' +
      '<div style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">' +
        _detailCell('Referência', r.ref) +
        _detailCell('Data', _fmtDate(r.date)) +
        _detailCell('Base bruta', UI.fmt(r.base)) +
        _detailCell('Percentual aplicado', (r.pct || 0) + '%') +
        _detailCell('Impacto', r.impact >= 0 ? 'Débito de IVA' : 'Crédito dedutível') +
        _detailCell('Fornecedor', r.supplier || '-') +
      '</div>' +
    '</div>';
    var footer = '<div style="display:flex;justify-content:flex-end;width:100%;"><button onclick="if(window._ivaDetalheModal)window._ivaDetalheModal.close();" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Fechar</button></div>';
    window._ivaDetalheModal = UI.modal({ title: 'Detalhes do movimento', body: body, footer: footer, maxWidth: '560px' });
  }

  function _irpfRows(sales, purchases, expenses) {
    return (sales || []).map(function (x, i) {
      var gross = _itemValue(x);
      var pct = _num(x.ivaPct || x.iva || _data.config.ivaPadrao);
      var net = _netFromGross(gross, pct);
      return {
        uid: 'receita-irpf-' + (x.id || x.numeroSequencial || i),
        tipo: 'Receita',
        ref: x.numeroSequencial || x.numDocumento || x.numeroDocumento || x.id || 'Receita',
        date: _itemDate(x),
        base: net,
        gross: gross,
        pct: pct,
        impact: net,
        status: 'Aumenta base',
        color: '#1F6F43',
        raw: x
      };
    }).concat((purchases || []).map(function (x, i) {
      var gross = _itemValue(x);
      var pct = _num(x.ivaPct || x.iva || _data.config.ivaPadrao);
      var net = _netFromGross(gross, pct);
      return {
        uid: 'compra-irpf-' + (x.id || x.numDocumento || i),
        tipo: 'Compra',
        ref: x.numDocumento || x.numeroDocumento || x.id || 'Compra',
        date: _itemDate(x),
        base: net,
        gross: gross,
        pct: pct,
        impact: -net,
        status: 'Deduz base',
        supplier: _supplierName(x.fornecedorId),
        color: '#B45309',
        raw: x
      };
    })).concat((expenses || []).map(function (x, i) {
      var gross = _itemValue(x);
      var pct = _num(x.ivaPct || x.iva || _data.config.ivaPadrao);
      var net = _netFromGross(gross, pct);
      return {
        uid: 'despesa-irpf-' + (x.id || x.numeroSequencial || i),
        tipo: 'Despesa',
        ref: x.numeroSequencial || x.numDocumento || x.numeroDocumento || x.descricao || x.id || 'Despesa',
        date: _itemDate(x),
        base: net,
        gross: gross,
        pct: pct,
        impact: -net,
        status: 'Deduz base',
        supplier: x.fornecedorNome || x.fornecedor || '',
        color: '#B42318',
        raw: x
      };
    })).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }

  function _irpfFilterRows(rows) {
    var q = String(_irpfView.busca || '').toLowerCase().trim();
    return (rows || []).filter(function (r) {
      if (_irpfView.tipo !== 'todos' && r.tipo !== _irpfView.tipo) return false;
      if (_irpfView.impacto === 'receita' && r.impact < 0) return false;
      if (_irpfView.impacto === 'deducao' && r.impact >= 0) return false;
      if (q) {
        var hay = [r.tipo, r.ref, r.status, r.supplier, _fmtDate(r.date), String(r.base), String(r.gross)].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function _irpfPaging(items) {
    var total = (items || []).length;
    var pageSize = Math.max(6, parseInt(_irpfView.pageSize, 10) || 12);
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, parseInt(_irpfView.page, 10) || 1), totalPages);
    if (_irpfView.page !== page) _irpfView.page = page;
    var start = (page - 1) * pageSize;
    return {
      items: (items || []).slice(start, start + pageSize),
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(total, start + pageSize)
    };
  }

  function _setIrpfFiltro(key, value) {
    _irpfView[key] = value;
    _irpfView.page = 1;
    _renderIrpf();
    if (key === 'busca') {
      setTimeout(function () {
        var el = document.getElementById('fis-irpf-busca');
        if (el) { el.focus(); if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); }
      }, 0);
    }
  }

  function _limparIrpfFiltros() {
    _irpfView.busca = '';
    _irpfView.tipo = 'todos';
    _irpfView.impacto = 'todos';
    _irpfView.page = 1;
    _renderIrpf();
  }

  function _setIrpfPage(page) {
    _irpfView.page = Math.max(1, parseInt(page, 10) || 1);
    _renderIrpf();
  }

  function _setIrpfPageSize(size) {
    _irpfView.pageSize = Math.max(6, parseInt(size, 10) || 12);
    _irpfView.page = 1;
    _renderIrpf();
  }

  function _openIrpfDetalhe(uid) {
    var r = (_irpfView.detalhe || []).find(function (x) { return String(x.uid) === String(uid); });
    if (!r) return;
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="background:#FAF8F4;border:none;border-radius:16px;padding:18px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
        '<div><div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Detalhe do IRPF</div><div style="font-size:26px;font-weight:700;color:#1F1F1F;line-height:1;">' + UI.fmt(Math.abs(r.impact)) + '</div><div style="font-size:13px;color:#6F6860;margin-top:7px;">' + _esc(r.status) + '</div></div>' +
        '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:' + r.color + ';font-size:12px;font-weight:700;">' + _esc(r.tipo) + '</span>' +
      '</div>' +
      '<div style="background:#fff;border:none;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">' +
        _detailCell('Referência', r.ref) +
        _detailCell('Data', _fmtDate(r.date)) +
        _detailCell('Base sem IVA', UI.fmt(r.base)) +
        _detailCell('Valor bruto', UI.fmt(r.gross)) +
        _detailCell('IVA removido', (r.pct || 0) + '%') +
        _detailCell('Efeito', r.impact >= 0 ? 'Aumenta base do IRPF' : 'Deduz base do IRPF') +
        _detailCell('Fornecedor', r.supplier || '-') +
      '</div>' +
    '</div>';
    var footer = '<div style="display:flex;justify-content:flex-end;width:100%;"><button onclick="if(window._irpfDetalheModal)window._irpfDetalheModal.close();" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Fechar</button></div>';
    window._irpfDetalheModal = UI.modal({ title: 'Detalhes do movimento', body: body, footer: footer, maxWidth: '560px' });
  }

  function _calcFiscal() {
    var ivaPct = _num(_data.config.ivaPadrao);
    var irpfPct = _num(_data.config.irpfPadrao);
    var sales = _salesInQuarter();
    var compras = _quarterItems(_data.compras, _itemDate);
    var expenses = _quarterItems((_data.saidas || []).concat(_data.apagar || []), _itemDate);
    var vendasBrutas = sales.reduce(function (s, x) { return s + _itemValue(x); }, 0);
    var ivaVendas = sales.reduce(function (s, x) { return s + _ivaFromGross(_itemValue(x), _num(x.ivaPct || x.iva || ivaPct)); }, 0);
    var comprasDedutiveis = compras.filter(_isAnyDeductible);
    var ivaComprasDedutivel = compras.filter(_isVatDeductible).reduce(function (s, x) {
      return s + _ivaFromGross(_itemValue(x), _num(x.ivaPct || x.iva || ivaPct));
    }, 0);
    var receitaSemIVA = sales.reduce(function (s, x) { return s + _netFromGross(_itemValue(x), _num(x.ivaPct || x.iva || ivaPct)); }, 0);
    var gastosCompras = compras.filter(_isIrpfDeductible).reduce(function (s, x) {
      return s + _netFromGross(_itemValue(x), _num(x.ivaPct || x.iva || ivaPct));
    }, 0);
    var gastosDespesas = expenses.filter(_isIrpfDeductible).reduce(function (s, x) {
      return s + _netFromGross(_itemValue(x), _num(x.ivaPct || x.iva || ivaPct));
    }, 0);
    var gastosDedutiveis = gastosCompras + gastosDespesas;
    var lucroFiscal = receitaSemIVA - gastosDedutiveis;
    return {
      vendasBrutas: vendasBrutas,
      ivaVendas: ivaVendas,
      ivaComprasDedutivel: ivaComprasDedutivel,
      ivaResultado: ivaVendas - ivaComprasDedutivel,
      receitaSemIVA: receitaSemIVA,
      gastosDedutiveis: gastosDedutiveis,
      lucroFiscal: lucroFiscal,
      irpfEstimado: Math.max(0, lucroFiscal) * irpfPct / 100,
      comprasDedutiveis: comprasDedutiveis
    };
  }

  function _salesInQuarter() {
    var orders = (_data.orders || []).filter(function (o) {
      var st = String(o.status || '').toLowerCase();
      return st !== 'cancelado' && st !== 'canceled' && st !== 'cancelled';
    });
    var entries = _data.entradas || [];
    return _quarterItems(orders.concat(entries), _itemDate);
  }

  function _quarterItems(list, dateFn) {
    var range = _quarterRange(_data.config.trimestreAtual);
    return (list || []).filter(function (x) {
      var raw = dateFn(x);
      if (!raw) return false;
      var d = _toDate(raw);
      return d && d >= range.start && d <= range.end;
    });
  }

  function _quarterRange(key) {
    var parts = String(key || _currentQuarterKey()).split('-T');
    var year = parseInt(parts[0], 10) || new Date().getFullYear();
    var q = Math.min(Math.max(parseInt(parts[1], 10) || 1, 1), 4);
    var start = new Date(year, (q - 1) * 3, 1);
    var end = new Date(year, q * 3, 0, 23, 59, 59, 999);
    return { start: start, end: end };
  }

  function _currentQuarterKey() {
    var d = new Date();
    return d.getFullYear() + '-T' + (Math.floor(d.getMonth() / 3) + 1);
  }

  function _normalizeCountryCode(value) {
    var v = String(value || 'ES').trim().toUpperCase();
    if (v === 'ESPANHA' || v === 'SPAIN') return 'ES';
    if (v === 'PORTUGAL') return 'PT';
    if (v === 'BRASIL' || v === 'BRAZIL') return 'BR';
    return ['ES', 'PT', 'BR', 'FR', 'IT', 'DE', 'GB', 'US'].indexOf(v) >= 0 ? v : 'ES';
  }

  function _normalizeCurrency(value) {
    var v = String(value || 'EUR').trim().toUpperCase();
    return ['EUR', 'BRL', 'USD', 'GBP'].indexOf(v) >= 0 ? v : 'EUR';
  }

  function _countryLabel(value) {
    var map = { ES: 'Espanha', PT: 'Portugal', BR: 'Brasil', FR: 'França', IT: 'Itália', DE: 'Alemanha', GB: 'Reino Unido', US: 'Estados Unidos' };
    return map[_normalizeCountryCode(value)] || 'Espanha';
  }

  function _invoiceModeLabel(value) {
    return value === 'manual' ? 'Emissão manual' : 'Emissão automática';
  }

  function _optionList(options, selected) {
    return options.map(function (opt) {
      return '<option value="' + _esc(opt[0]) + '"' + (String(selected || '') === String(opt[0]) ? ' selected' : '') + '>' + _esc(opt[1]) + '</option>';
    }).join('');
  }

  function _countryOptions(selected) {
    return _optionList([
      ['ES', 'Espanha'],
      ['PT', 'Portugal'],
      ['BR', 'Brasil'],
      ['FR', 'França'],
      ['IT', 'Itália'],
      ['DE', 'Alemanha'],
      ['GB', 'Reino Unido'],
      ['US', 'Estados Unidos']
    ], _normalizeCountryCode(selected));
  }

  function _currencyOptions(selected) {
    return _optionList([
      ['EUR', 'Euro (EUR)'],
      ['BRL', 'Real (BRL)'],
      ['USD', 'Dólar (USD)'],
      ['GBP', 'Libra (GBP)']
    ], _normalizeCurrency(selected));
  }

  function _invoiceTypeOptions(selected) {
    return _optionList([
      ['simplified', 'Fatura simplificada'],
      ['full', 'Fatura completa']
    ], selected || 'simplified');
  }

  function _invoiceModeOptions(selected) {
    return _optionList([
      ['automatic', 'Automática'],
      ['manual', 'Manual']
    ], selected || 'automatic');
  }

  function _documentTypeOptions(selected) {
    return _optionList([
      ['', 'Selecionar'],
      ['nif', 'NIF'],
      ['nie', 'NIE'],
      ['cif', 'CIF'],
      ['other', 'Outro']
    ], selected || '');
  }

  function _quarterOptions(selected) {
    var now = new Date();
    var year = now.getFullYear();
    var opts = [];
    [year - 1, year, year + 1].forEach(function (y) {
      for (var q = 1; q <= 4; q++) opts.push(y + '-T' + q);
    });
    return opts.map(function (key) {
      return '<option value="' + key + '"' + (selected === key ? ' selected' : '') + '>' + key.replace('-T', ' / T') + '</option>';
    }).join('');
  }

  function _fiscalCategoryOptions(selected) {
    return FISCAL_CATEGORIES.map(function (p) {
      return '<option value="' + p[0] + '"' + (selected === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
    }).join('');
  }
  function _fiscalCategoryLabel(value) {
    var row = FISCAL_CATEGORIES.find(function (p) { return p[0] === value; });
    return row ? row[1] : 'Outro';
  }

  function _isVatDeductible(x) { return x.dedutivelIva === true || x.deductibleVat === true; }
  function _isIrpfDeductible(x) { return x.dedutivelIrpf === true || x.deductibleIrpf === true; }
  function _isAnyDeductible(x) { return _isVatDeductible(x) || _isIrpfDeductible(x); }
  function _ivaFromGross(gross, pct) { pct = _num(pct); return pct > 0 ? _num(gross) - (_num(gross) / (1 + pct / 100)) : 0; }
  function _netFromGross(gross, pct) { pct = _num(pct); return pct > 0 ? _num(gross) / (1 + pct / 100) : _num(gross); }
  function _itemValue(x) { return _num(x.total || x.valor || x.amount || x.totalAmount || x.grandTotal || x.price || 0); }
  function _itemDate(x) { return x.data || x.date || x.createdAt || x.paidAt || x.dueDate || x.updatedAt || ''; }
  function _supplierName(id) { var f = (_data.fornecedores || []).find(function (x) { return String(x.id) === String(id); }); return f ? (f.name || f.nome || '') : ''; }
  function _toDate(raw) {
    if (!raw) return null;
    if (raw && typeof raw.toDate === 'function') return raw.toDate();
    var d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  function _fmtDate(raw) { var d = _toDate(raw); return d ? UI.fmtDate(d) : '-'; }
  function _notice() { return '<div style="padding:14px 16px;border-radius:14px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:13px;font-weight:600;line-height:1.45;">Cálculo estimado. Não substitui contador/gestor fiscal.</div>'; }
  function _salesAndPurchasesHint() { return '<div style="margin-top:14px;color:#8A7E7C;font-size:13px;">As compras entram no IVA dedutível apenas quando marcadas como dedutíveis para IVA.</div>'; }
  function _summaryLine(label, value) { return '<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #F2EDED;"><span>' + _esc(label) + '</span><strong>' + UI.fmt(value) + '</strong></div>'; }
  function _kpi(label, value, sub) { return '<div class="kpi-tile"><span>' + label + '</span><strong>' + value + '</strong><small>' + _esc(sub || '') + '</small></div>'; }
  function _summaryFlowLine(label, value, color, strong) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:' + (strong ? '13px 0 0' : '0 0 11px') + ';border-bottom:' + (strong ? 'none' : '1px solid #EAE4DA') + ';">' +
      '<span style="font-size:13px;color:#6F6860;line-height:1.35;">' + _esc(label) + '</span>' +
      '<strong style="font-size:' + (strong ? '18px' : '14px') + ';font-weight:700;color:' + (color || '#1F1F1F') + ';white-space:nowrap;">' + _esc(value) + '</strong>' +
    '</div>';
  }
  function _summaryInsightCard(label, value, sub, icon, color) {
    return '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:14px;display:flex;gap:11px;align-items:flex-start;min-height:82px;">' +
      '<div style="width:34px;height:34px;border-radius:11px;background:#fff;color:' + (color || '#6F6860') + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">' + _esc(icon || 'analytics') + '</span></div>' +
      '<div style="min-width:0;"><div style="font-size:12px;color:#6F6860;line-height:1.2;">' + _esc(label) + '</div><div style="font-size:20px;font-weight:700;color:#1F1F1F;line-height:1.1;margin-top:4px;overflow-wrap:anywhere;">' + _esc(value) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:4px;">' + _esc(sub || '') + '</div></div>' +
    '</div>';
  }
  function _summaryBar(label, value, max, color) {
    var pct = max > 0 ? Math.max(2, Math.min(100, (_num(value) / max) * 100)) : 2;
    return '<div style="display:flex;flex-direction:column;gap:7px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><span style="font-size:13px;color:#6F6860;">' + _esc(label) + '</span><strong style="font-size:13px;font-weight:700;color:#1F1F1F;">' + UI.fmt(value) + '</strong></div>' +
      '<div style="height:8px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;overflow:hidden;"><span style="display:block;width:' + pct.toFixed(1) + '%;height:100%;border-radius:999px;background:' + (color || '#B42318') + ';"></span></div>' +
    '</div>';
  }
  function _metricCard(label, value, sub, icon, color) {
    return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">' +
      '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + (color || '#6F6860') + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'analytics') + '</span></div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
        '<span style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
        '<strong style="font-size:clamp(24px,2.4vw,34px);font-weight:700;color:#1F1F1F;line-height:1;letter-spacing:0;overflow-wrap:anywhere;">' + _esc(String(value)) + '</strong>' +
        '<small style="font-size:12px;color:#6F6860;line-height:1.35;">' + _esc(sub || '') + '</small>' +
      '</div>' +
    '</div>';
  }
  function _detailCell(label, value) {
    return '<div style="min-width:0;"><div style="font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;">' + _esc(label) + '</div><div style="font-size:14px;font-weight:650;color:#1F1F1F;line-height:1.35;word-break:break-word;">' + _esc(value == null || value === '' ? '--' : value) + '</div></div>';
  }
  function _thead(cols) { return '<thead><tr style="background:#F2EDED;">' + cols.map(function (h) { return '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:800;color:#8A7E7C;text-transform:uppercase;white-space:nowrap;">' + h + '</th>'; }).join('') + '</tr></thead>'; }
  function _td(html) { return '<td style="padding:11px 14px;font-size:13px;">' + html + '</td>'; }
  function _thStyle() { return 'padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #EAE4DA;background:#fff;'; }
  function _tdStyle() { return 'padding:12px 14px;font-size:13px;border-bottom:1px solid #F2EDEA;'; }
  function _field(id, label, value, type) { return '<div><label style="' + _labelStyle() + '">' + label + '</label><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '" style="' + _inputStyle() + '"></div>'; }
  function _select(id, label, options) { return '<div><label style="' + _labelStyle() + '">' + label + '</label><select id="' + id + '" style="' + _inputStyle() + 'background:#fff;">' + options + '</select></div>'; }
  function _readonlyMini(label, value) {
    return '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:12px;padding:10px 12px;">' +
      '<div style="font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">' + _esc(label) + '</div>' +
      '<div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.3;">' + _esc(value || '-') + '</div>' +
    '</div>';
  }
  function _content(html) { var el = document.getElementById('fiscal-content'); if (el) el.innerHTML = html; }
  function _cardStyle(pad) { return 'background:#fff;border:none;border-radius:16px;padding:' + (pad || '18px 20px') + ';box-shadow:0 12px 30px rgba(31,31,31,.06);'; }
  function _softGroupStyle() { return 'background:#FAF8F4;border:1px solid #EAE4DA;border-radius:16px;padding:16px;'; }
  function _chip(txt) { return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(txt) + '</span>'; }
  function _inputStyle() { return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);'; }
  function _labelStyle() { return 'font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;'; }
  function _primaryStyle() { return 'height:40px;padding:0 16px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);'; }
  function _num(v) { return parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0; }
  function _val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function _checked(id) { var el = document.getElementById(id); return !!(el && el.checked); }
  function _esc(str) { return String(str == null ? '' : str).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]; }); }

  return {
    render: render,
    _switchSub: _switchSub,
    _saveConfig: _saveConfig,
    _saveCompraFiscal: _saveCompraFiscal,
    _filterCompras: _filterCompras,
    _setIvaFiltro: _setIvaFiltro,
    _limparIvaFiltros: _limparIvaFiltros,
    _setIvaPage: _setIvaPage,
    _setIvaPageSize: _setIvaPageSize,
    _openIvaDetalhe: _openIvaDetalhe,
    _setIrpfFiltro: _setIrpfFiltro,
    _limparIrpfFiltros: _limparIrpfFiltros,
    _setIrpfPage: _setIrpfPage,
    _setIrpfPageSize: _setIrpfPageSize,
    _openIrpfDetalhe: _openIrpfDetalhe,
    _setCompraFiltro: _setCompraFiltro,
    _limparCompraFiltros: _limparCompraFiltros,
    _setCompraPage: _setCompraPage,
    _setCompraPageSize: _setCompraPageSize,
    _openCompraDetalhe: _openCompraDetalhe
  };
})();
