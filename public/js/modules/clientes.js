// js/modules/clientes.js
window.Modules = window.Modules || {};
Modules.Clientes = (function () {
  'use strict';

  var _clientes = [];
  var _orders = [];
  var _reviews = [];
  var _canais = [];
  var _pointsMovements = [];
  var _pointsConfig = { earnPerEuro: 1, redeemRate: 10, minimumPointsToUse: 50, maxDiscountPct: 20 };
  var _view = [];
  var _editingId = null;
  var _filters = { q: '', status: '', segment: '', origin: '' };

  function render() {
    var app = document.getElementById('app');
    app.innerHTML = '<section class="module-page">' +
      '<div class="module-head" style="align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div style="min-width:0;flex:1 1 420px;"><h1 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Clientes</h1><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0 0 10px;max-width:760px;">Base de clientes, histórico de compras, preferências e ações de relacionamento.</p><div id="clientes-head-chips" style="display:flex;gap:8px;flex-wrap:wrap;"></div></div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button class="bf-btn-primary" onclick="Modules.Clientes._openModal(null)" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;display:inline-flex;align-items:center;gap:8px;"><span class="mi" style="font-size:16px;">person_add</span>Novo Cliente</button>' +
        '</div>' +
      '</div>' +
      '<div id="clientes-content" class="module-content"><div class="loading-inline">Carregando...</div></div>' +
      '</section>';
    _load();
  }

  function _load() {
    Promise.all([
      DB.getAll('store_customers'),
      DB.getAll('orders'),
      DB.getAll('reviews'),
      DB.getDocRoot ? DB.getDocRoot('config', 'canais_venda').catch(function () { return null; }) : Promise.resolve(null),
      DB.getDocRoot ? DB.getDocRoot('config', 'pontos_program').catch(function () { return null; }) : Promise.resolve(null),
      DB.getAll('points_movements').catch(function () { return []; })
    ]).then(function (r) {
      _clientes = (r[0] || []).sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
      _orders = r[1] || [];
      _reviews = r[2] || [];
      _canais = _normalizeCanais(r[3]);
      _pointsConfig = _normalizePointsConfig(r[4] || {});
      _pointsMovements = Array.isArray(r[5]) ? r[5] : [];
      _buildView();
      _paint();
    }).catch(function (err) {
      var el = document.getElementById('clientes-content');
      if (el) el.innerHTML = UI.emptyState('Erro ao carregar clientes: ' + err.message, '❌');
    });
  }

  function _buildView() {
    _view = _clientes.map(function (c) {
      var orders = _ordersForClient(c);
      var stats = _stats(c, orders);
      return Object.assign({}, c, { _orders: orders, _stats: stats });
    });
    _view.sort(function (a, b) {
      return (b._stats.lastOrderTs || 0) - (a._stats.lastOrderTs || 0) || (a.name || '').localeCompare(b.name || '');
    });
  }

  function _paint() {
    var root = document.getElementById('clientes-content');
    if (!root) return;
    var data = _filtered();
    var total = _view.length;
    var recurrent = _view.filter(function (c) { return c._stats.ordersCount >= 2; }).length;
    var inactive = _view.filter(function (c) { return c._stats.segment === 'inativo'; }).length;
    var headChips = document.getElementById('clientes-head-chips');
    if (headChips) {
      headChips.innerHTML = _chip(total + ' clientes') + _chip(recurrent + ' recorrentes') + _chip(inactive + ' inativos');
    }
    root.innerHTML = '<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      _kpis() +
      _filtersHTML(data) +
      '<div id="clientes-list">' + _list(data) + '</div>' +
      '</div>';
  }

  function _kpis() {
    var total = _view.length;
    var recurrent = _view.filter(function (c) { return c._stats.ordersCount >= 2; }).length;
    var inactive = _view.filter(function (c) { return c._stats.segment === 'inativo'; }).length;
    var valid = _view.filter(function (c) { return c._stats.ordersCount > 0; });
    var avgTicket = valid.length ? valid.reduce(function (s, c) { return s + c._stats.avgTicket; }, 0) / valid.length : 0;
    var optIn = _view.filter(function (c) { return c.acceptsMarketing === true; }).length;
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
      _kpi('Total de clientes', total, 'base cadastrada', 'groups', '#8A6F5A') +
      _kpi('Recorrentes', recurrent, '2+ pedidos', 'repeat', '#6C8777') +
      _kpi('Inativos', inactive, 'sem compra recente', 'person_off', '#A18362') +
      _kpi('Ticket médio', valid.length ? UI.fmt(avgTicket) : 'sem dados', valid.length + ' cliente(s) com pedido', 'payments', '#B42318') +
      _kpi('Aceitam marketing', optIn, 'WhatsApp/campanhas', 'campaign', '#2563EB') +
      '</div>';
  }

  function _filtersHTML(data) {
    var fieldStyle = 'padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;background:#fff;width:100%;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;';
    return '<div style="background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end;">' +
        '<div style="display:grid;grid-template-columns:minmax(320px,1.6fr) minmax(160px,.75fr) minmax(170px,.8fr) minmax(170px,.8fr);gap:10px 12px;flex:1;align-items:end;">' +
          '<div><input id="cli-search" type="search" value="' + _esc(_filters.q) + '" oninput="Modules.Clientes._setFilter(\'q\', this.value)" placeholder="Buscar clientes pelo nome, telefone ou email..." autocomplete="off" autocapitalize="off" spellcheck="false" style="' + fieldStyle + 'height:40px;"></div>' +
          '<div><select id="cli-status-filter" onchange="Modules.Clientes._setFilter(\'status\', this.value)" style="' + fieldStyle + 'height:40px;">' + _filterOptions(['', 'ativo', 'recorrente', 'inativo', 'bloqueado'], _filters.status, 'Status: Todos') + '</select></div>' +
          '<div><select id="cli-segment-filter" onchange="Modules.Clientes._setFilter(\'segment\', this.value)" style="' + fieldStyle + 'height:40px;">' + _filterOptions(['', 'novo', 'recorrente', 'vip', 'inativo', 'sem_pedido'], _filters.segment, 'Segmento: Todos') + '</select></div>' +
          '<div><select id="cli-origin-filter" onchange="Modules.Clientes._setFilter(\'origin\', this.value)" style="' + fieldStyle + 'height:40px;">' + _originOptions(_filters.origin) + '</select></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
        _chip(_view.length + ' clientes') +
        _chip(data.length + ' encontrados') +
        _chip(_filters.q || _filters.status || _filters.segment || _filters.origin ? 'Filtros ativos' : 'Sem filtros ativos') +
      '</div>' +
    '</div>';
  }

  function _list(data) {
    if (!data.length) {
      return '<section style="background:#fff;border:none;border-radius:16px;padding:28px 22px;text-align:center;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum cliente encontrado</div>' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Tente ajustar a busca ou os filtros.</div>' +
      '</section>';
    }
    return '<section style="display:flex;flex-direction:column;gap:10px;">' +
      '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Clientes cadastrados</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Consulte contatos, relacionamento e histórico de compra.</div></div>' +
      '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
        '<div style="overflow:auto;">' +
          '<table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:940px;">' +
            '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
              '<th style="width:44px;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;"><input type="checkbox" disabled style="width:16px;height:16px;accent-color:#B42318;"></th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Cliente</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Contato</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Segmento</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Pedidos</th>' +
              '<th style="text-align:left;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Total</th>' +
              '<th style="text-align:right;padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Ações</th>' +
            '</tr></thead>' +
            '<tbody>' + data.map(_rowHTML).join('') + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _rowHTML(c) {
    var s = c._stats;
    var initials = _initials(c.name);
    var wa = _whatsUrl(c.phone, 'Hola ' + (c.name || '') + ', ¿todo bien?');
    var contact = _contactHTML(c, 'Hola ' + (c.name || '') + ', ¿todo bien?');
    var address = _clientAddress(c);
    return '<tr onclick="Modules.Clientes._openProfile(\'' + c.id + '\')" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="cursor:pointer;background:#fff;border-bottom:1px solid #EAE4DA;transition:background .15s ease;">' +
      '<td style="padding:14px 16px;vertical-align:middle;"><input type="checkbox" onclick="event.stopPropagation()" style="width:16px;height:16px;accent-color:#B42318;"></td>' +
      '<td style="padding:12px 16px;vertical-align:middle;min-width:280px;">' +
        '<div style="display:flex;align-items:center;gap:12px;min-width:0;">' +
          '<div style="width:48px;height:48px;border-radius:12px;background:' + _avatarColor(c.name) + ';color:#fff;font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 2px rgba(31,31,31,.03);">' + _esc(initials) + '</div>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(c.name || 'Cliente') + '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">' + _tags(c.tags).map(function (t) { return UI.badge(t, 'gray'); }).join('') + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;min-width:220px;">' +
        '<div style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (contact || 'Sem contato') + '</div>' +
        '<div style="font-size:12px;color:#A39B90;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">' + _esc(address || 'Sem endereço') + '</div>' +
      '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;">' + _segmentBadge(s.segment) + '<div style="margin-top:6px;">' + _statusBadge(c.status) + '</div></td>' +
      '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + (s.ordersCount || 0) + '<div style="font-size:12px;color:#6F6860;font-weight:500;margin-top:2px;">Ticket ' + (s.ordersCount ? UI.fmt(s.avgTicket) : '-') + '</div></td>' +
      '<td style="padding:13px 16px;vertical-align:middle;white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + (s.ordersCount ? UI.fmt(s.totalSpent) : '-') + '</td>' +
      '<td style="padding:13px 16px;vertical-align:middle;text-align:right;white-space:nowrap;" onclick="event.stopPropagation();">' +
        '<div style="display:inline-flex;align-items:center;gap:6px;">' +
          (c.phone ? '<a href="' + wa + '" target="_blank" style="' + _iconBtn('#fff', '#6F6860') + '" title="WhatsApp"><span class="mi" style="font-size:14px;">chat</span></a>' : '') +
          '<button type="button" onclick="Modules.Clientes._openHistory(\'' + c.id + '\')" style="' + _iconBtn('#fff', '#6F6860') + '" title="Histórico"><span class="mi" style="font-size:14px;">history</span></button>' +
          '<button type="button" onclick="Modules.Clientes._openModal(\'' + c.id + '\')" style="' + _iconBtn('#fff', '#6F6860') + '" title="Editar"><span class="mi" style="font-size:14px;">edit</span></button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  function _openModal(id) {
    _editingId = id;
    var _tenantFc = window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES';
    var _defaultCountry = _tenantFc === 'PT' ? 'Portugal' : 'España';
    var c = id ? (_clientes.find(function (x) { return x.id === id; }) || {}) : { status: 'ativo', origin: _defaultChannel(), acceptsMarketing: false, country: _defaultCountry };
    var clientFiscal = _ensureClientFiscal(c);
    var _cliCountry = c.country || _defaultCountry;
    var _cliCode = window.FiscalConfig ? FiscalConfig.countryToCode(_cliCountry) : null;
    var _cliNifCfg = window.FiscalConfig ? FiscalConfig.get(_cliCode || _cliCountry || 'ES')
      : { fiscalDocumentLabel: 'NIF / CIF', fiscalDocumentPlaceholder: '', fiscalDocumentHint: '', regionLabel: 'Estado / Província' };
    var selectedChannel = c.mainChannel || c.channelName || c.channel || c.origin || _defaultChannel();
    var body = '<div style="display:flex;flex-direction:column;gap:14px;font-family:Manrope,Inter,sans-serif;">' +
      '<div class="bf-card" style="padding:16px;">' +
      '<div style="' + _sectionTitle() + '">Dados do cliente</div>' +
      '<div style="display:grid;grid-template-columns:1.3fr .8fr .9fr;gap:12px;margin-bottom:12px;">' +
      _field('cli-name', 'Nome completo *', c.name || '') +
      _field('cli-phone', 'Telefone / WhatsApp', c.phone || '') +
      _field('cli-email', 'E-mail', c.email || '', 'email') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;">' +
      _select('cli-status', 'Status', _simpleOptions(['ativo', 'recorrente', 'inativo', 'bloqueado'], c.status || 'ativo')) +
      _select('cli-origin', 'Canal principal', _channelOptions(selectedChannel)) +
      '<div><label id="cli-fiscal-label" style="' + _label() + '">' + _esc(_cliNifCfg.fiscalDocumentLabel) + '</label>' +
        '<input id="cli-fiscal" type="text" value="' + _esc(c.nifCif || c.fiscalId || '') + '" placeholder="' + _esc(_cliNifCfg.fiscalDocumentPlaceholder) + '" maxlength="20" style="' + _input() + '">' +
        '<div id="cli-fiscal-hint" style="font-size:11px;color:#8A7E7C;margin-top:4px;">' + _esc(_cliNifCfg.fiscalDocumentHint) + '</div></div>' +
      _field('cli-bday', 'Aniversário', c.birthday || '', 'date') +
      '</div></div>' +
      '<div class="bf-card" style="padding:16px;">' +
      '<div style="' + _sectionTitle() + '">Endereço e entrega</div>' +
      _field('cli-address', 'Endereço principal', c.address || '') +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px;">' +
      _field('cli-number', 'Número', c.number || c.numero || '') +
      _field('cli-hood', 'Bairro / zona', c.neighborhood || c.zone || '') +
      _field('cli-zip', 'Código postal', c.postalCode || '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px;">' +
      '<div><label id="cli-state-label" style="' + _label() + '">' + _esc(_cliNifCfg.regionLabel || 'Estado / Província') + '</label>' +
        '<select id="cli-state" style="' + _input() + 'background:#fff;">' + _regionOptions(_cliCountry, c.state || c.province || '') + '</select></div>' +
      '<div><label style="' + _label() + '">País</label><select id="cli-country" onchange="Modules.Clientes._onClienteCountryChange()" style="' + _input() + 'background:#fff;">' + _countryOptions(_cliCountry) + '</select></div>' +
      _field('cli-reference', 'Referência / complemento', c.reference || c.complement || '') +
      '</div></div>' +
      '<details class="bf-card" style="padding:16px;">' +
      '<summary style="cursor:pointer;list-style:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
      '<div><div style="' + _sectionTitle() + 'margin-bottom:4px;">Dados fiscais</div><div style="font-size:12px;color:#7A746B;line-height:1.45;">Opcional. Use apenas quando o cliente precisar de dados para faturação completa.</div></div>' +
      '<span style="font-size:16px;color:#6F6860;line-height:1;">▸</span>' +
      '</summary>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-top:14px;">' +
      _select('cli-fiscal-customer-type', 'Tipo de cliente', _customerTypeOptions(clientFiscal.customerType)) +
      _field('cli-fiscal-legal-name', 'Nome fiscal', clientFiscal.legalName || '') +
      _field('cli-fiscal-commercial-name', 'Nome comercial', clientFiscal.commercialName || '') +
      _select('cli-fiscal-doc-type', 'Tipo de documento', _documentTypeOptions(clientFiscal.documentType)) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 120px;gap:12px;margin-top:12px;">' +
      _field('cli-fiscal-id-structured', 'Documento fiscal', clientFiscal.fiscalId || '') +
      _field('cli-fiscal-invoice-email', 'E-mail de faturação', clientFiscal.invoiceEmail || '', 'email') +
      _select('cli-fiscal-country-code', 'País fiscal', _countryCodeOptions(clientFiscal.countryCode)) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1.4fr .6fr 1fr 1fr 1fr 120px;gap:12px;margin-top:12px;">' +
      _field('cli-fiscal-address', 'Endereço fiscal', clientFiscal.fiscalAddress.address || '') +
      _field('cli-fiscal-number', 'Número', clientFiscal.fiscalAddress.number || '') +
      _field('cli-fiscal-complement', 'Complemento', clientFiscal.fiscalAddress.complement || '') +
      _field('cli-fiscal-city', 'Localidade', clientFiscal.fiscalAddress.city || '') +
      _field('cli-fiscal-province', 'Província', clientFiscal.fiscalAddress.province || '') +
      _field('cli-fiscal-postal', 'Código postal', clientFiscal.fiscalAddress.postalCode || '') +
      '</div>' +
      '</details>' +
      '<div class="bf-card" style="padding:16px;">' +
      '<div style="' + _sectionTitle() + '">Marketing e relacionamento</div>' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#1F1F1F;margin-bottom:12px;"><input id="cli-marketing" type="checkbox" ' + (c.acceptsMarketing ? 'checked' : '') + ' style="accent-color:#B42318;width:16px;height:16px;"> Aceita receber promoções</label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      _field('cli-tags', 'Tags', _tags(c.tags).join(', ')) +
      _field('cli-preferences', 'Preferências', c.preferences || '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">' +
      _field('cli-allergies', 'Alergias / restrições', c.allergies || '') +
      _field('cli-points', 'Pontos de fidelidade', c.points || 0, 'number') +
      '</div></div>' +
      '<div class="bf-card" style="padding:16px;">' +
      _textarea('cli-notes', 'Observações internas', c.notes || c.internalNotes || '') +
      '</div></div>';
    var footer = '<div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;font-family:Manrope,Inter,sans-serif;">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
      (id ? '<button class="bf-btn bf-btn-secondary" onclick="Modules.Clientes._deleteCliente(\'' + id + '\')" style="color:#B42318;"><span class="mi" style="font-size:16px;">delete</span>Excluir</button>' : '') +
      '<button class="bf-btn bf-btn-secondary" onclick="if(window._clienteModal)window._clienteModal.close()">Cancelar</button>' +
      '<button class="bf-btn bf-btn-primary" onclick="Modules.Clientes._saveCliente()" style="flex:1;">' + (id ? 'Atualizar cliente' : 'Adicionar cliente') + '</button>' +
      '</div>' +
      '<div style="font-size:11px;color:#7A746B;text-align:center;line-height:1.4;">As alterações ficam vinculadas aos pedidos e ao histórico do cliente.</div>' +
      '</div>';
    window._clienteModal = UI.modal({ title: id ? 'Editar Cliente' : 'Novo Cliente', body: body, footer: footer, maxWidth: '1120px' });
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('cli-address'); }, 200);
  }

  function _saveCliente() {
    var name = _val('cli-name').trim();
    if (!name) { UI.toast('Nome é obrigatório', 'error'); return; }
    if (!_validPhone(_val('cli-phone'))) { UI.toast('Telefone inválido. Use apenas números com DDD/código do país.', 'error'); return; }
    if (!_validEmail(_val('cli-email'))) { UI.toast('E-mail inválido', 'error'); return; }
    var _sCountry = _val('cli-country');
    var _sCode = window.FiscalConfig ? FiscalConfig.countryToCode(_sCountry) : null;
    var _sNifCfg = window.FiscalConfig ? FiscalConfig.get(_sCode || _sCountry || 'ES') : null;
    var _nifRaw = (_val('cli-fiscal') || '').trim().toUpperCase().replace(/[\s.-]/g, '');
    var _nifOk = _sNifCfg ? _sNifCfg.validateNif(_nifRaw) : _validFiscalId(_val('cli-fiscal'));
    if (!_nifOk) { UI.toast((_sNifCfg && _sNifCfg.nifErrorMsg) || 'Documento fiscal inválido.', 'error'); return; }
    if (!_validPostalCode(_val('cli-zip'), _sCountry)) {
      var _postalMsg = String(_sCountry || '').toLowerCase() === 'portugal' ? 'Código postal inválido para Portugal. Use NNNN-NNN.' : String(_sCountry || '').toLowerCase() === 'españa' ? 'Código postal inválido para Espanha. Use 5 números.' : 'Código postal inválido.';
      UI.toast(_postalMsg, 'error'); return;
    }
    var current = _editingId ? (_clientes.find(function (c) { return c.id === _editingId; }) || {}) : {};
    var channel = _val('cli-origin') || _defaultChannel();
    var fiscal = _ensureClientFiscal(current);
    fiscal.customerType = _val('cli-fiscal-customer-type') || fiscal.customerType || 'person';
    fiscal.legalName = _val('cli-fiscal-legal-name');
    fiscal.commercialName = _val('cli-fiscal-commercial-name');
    fiscal.documentType = _val('cli-fiscal-doc-type');
    fiscal.fiscalId = _val('cli-fiscal-id-structured') || _val('cli-fiscal');
    fiscal.countryCode = _countryIso(_val('cli-fiscal-country-code') || _val('cli-country') || fiscal.countryCode);
    fiscal.invoiceEmail = _val('cli-fiscal-invoice-email') || _val('cli-email');
    fiscal.fiscalAddress = {
      address: _val('cli-fiscal-address') || _val('cli-address'),
      number: _val('cli-fiscal-number') || _val('cli-number'),
      complement: _val('cli-fiscal-complement') || _val('cli-reference'),
      city: _val('cli-fiscal-city'),
      province: _val('cli-fiscal-province') || _val('cli-state'),
      postalCode: _val('cli-fiscal-postal') || _val('cli-zip'),
      countryCode: fiscal.countryCode || 'ES'
    };
    var data = {
      name: name,
      phone: _val('cli-phone'),
      email: _val('cli-email'),
      status: _val('cli-status') || 'ativo',
      origin: channel,
      mainChannel: channel,
      channelName: channel,
      nifCif: _val('cli-fiscal'),
      fiscalId: _val('cli-fiscal'),
      birthday: _val('cli-bday'),
      address: _val('cli-address'),
      number: _val('cli-number'),
      numero: _val('cli-number'),
      neighborhood: _val('cli-hood'),
      zone: _val('cli-hood'),
      postalCode: _val('cli-zip'),
      state: _val('cli-state'),
      province: _val('cli-state'),
      country: _val('cli-country'),
      reference: _val('cli-reference'),
      acceptsMarketing: _checked('cli-marketing'),
      tags: _tags(_val('cli-tags')),
      preferences: _val('cli-preferences'),
      allergies: _val('cli-allergies'),
      points: parseInt(_val('cli-points') || '0', 10) || 0,
      notes: _val('cli-notes'),
      ordersCount: current.ordersCount || 0,
      totalSpent: current.totalSpent || 0,
      fiscal: fiscal
    };
    var op = _editingId ? DB.update('store_customers', _editingId, data) : DB.add('store_customers', data);
    op.then(function () {
      UI.toast(_editingId ? 'Cliente atualizado!' : 'Cliente adicionado!', 'success');
      if (window._clienteModal) window._clienteModal.close();
      _load();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _openProfile(id) {
    var c = _view.find(function (x) { return x.id === id; });
    if (!c) return;
    var s = c._stats;
    var contact = _contactHTML(c, 'Hola ' + (c.name || '') + ', tenemos una novedad para ti.');
    var address = _clientAddress(c);
    var body = '<div>' +
      '<div style="display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;margin-bottom:16px;">' +
      '<div style="width:64px;height:64px;border-radius:18px;background:' + _avatarColor(c.name) + ';color:#fff;font-size:22px;font-weight:900;display:flex;align-items:center;justify-content:center;">' + _esc(_initials(c.name)) + '</div>' +
      '<div><h2 style="font-size:22px;font-weight:900;margin-bottom:4px;">' + _esc(c.name || 'Cliente') + '</h2><div style="color:#8A7E7C;font-size:13px;">' + (contact || 'Sem contato') + '</div>' + (address ? '<div style="color:#8A7E7C;font-size:13px;margin-top:4px;"><span class="mi" style="font-size:15px;color:#C4362A;vertical-align:-2px;">location_on</span> ' + _esc(address) + '</div>' : '') + '</div>' +
      '<button class="bf-btn bf-btn-primary" onclick="Modules.Clientes._openModal(\'' + c.id + '\')" style="min-width:180px;">Editar</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px;">' +
      _kpi('Pedidos', s.ordersCount, 'histórico') +
      _kpi('Total comprado', s.ordersCount ? UI.fmt(s.totalSpent) : '-', 'todos os pedidos') +
      _kpi('Ticket médio', s.ordersCount ? UI.fmt(s.avgTicket) : '-', 'por pedido') +
      _kpi('Último pedido', s.lastOrderLabel || '-', s.segmentLabel) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
      '<div style="' + _panel() + '"><h3 style="' + _h3() + '">Perfil</h3>' +
      _info('Canal principal', c.mainChannel || c.channelName || c.channel || c.origin || '-') + _info('Status', c.status || s.segmentLabel) + _info('NIF / CIF', c.nifCif || c.fiscalId || '-') + _infoHTML('Telefone / WhatsApp', c.phone ? _phoneLink(c, 'Hola ' + (c.name || '') + ', tenemos una novedad para ti.') : '-') + _info('Endereço', address || '-') + _info('Preferências', c.preferences || '-') + _info('Alergias', c.allergies || '-') + '</div>' +
      '<div style="' + _panel() + '"><h3 style="' + _h3() + '">Ações rápidas</h3>' +
      (c.phone ? '<a href="' + _whatsUrl(c.phone, 'Hola ' + (c.name || '') + ', tenemos una novedad para ti.') + '" target="_blank" style="' + _actionLink('#E9F8EF', '#1A9E5A') + '"><span class="mi">chat</span> Abrir WhatsApp</a>' : '') +
      '<button onclick="Modules.Clientes._openHistory(\'' + c.id + '\')" style="' + _actionButton('#EEF4FF', '#2563EB') + '"><span class="mi">history</span> Ver histórico</button>' +
      '<button onclick="Modules.Clientes._openSegmentFlow(\'' + c.id + '\')" style="' + _actionButton('#FFF8F1', '#B45309') + '"><span class="mi">timeline</span> Ver fluxo do segmento</button>' +
      '</div></div>' +
      _pointsHistoryHTML(c) +
      _topProductsHTML(s.topProducts) +
      _reviewsHTML(c) +
      '</div>';
    UI.modal({ title: 'Cliente', body: body, maxWidth: '900px' });
  }

  function _openHistory(id) {
    var c = _view.find(function (x) { return x.id === id; });
    if (!c) return;
    var orders = c._orders || [];
    var body = '<div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px;">' +
      _kpi('Pedidos', orders.length, 'do cliente') +
      _kpi('Total', orders.length ? UI.fmt(c._stats.totalSpent) : '-', 'comprado') +
      _kpi('Ticket médio', orders.length ? UI.fmt(c._stats.avgTicket) : '-', 'por pedido') +
      '</div>' +
      (orders.length ? '<div style="display:flex;flex-direction:column;gap:8px;">' + orders.map(_orderRow).join('') + '</div>' : UI.emptyState('Nenhum pedido encontrado', '📦')) +
      '</div>';
    UI.modal({ title: 'Histórico - ' + (c.name || 'Cliente'), body: body, maxWidth: '720px' });
  }

  function _openSegmentFlow(id) {
    var c = _view.find(function (x) { return x.id === id; }) || _clientes.find(function (x) { return x.id === id; });
    if (!c) return;
    var orders = c._orders || _ordersForClient(c);
    var stats = c._stats || _stats(c, orders);
    var events = _segmentEvents(c, orders);
    var body = '<div>' +
      '<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:14px;margin-bottom:14px;">' +
      '<div style="' + _panel() + '"><h3 style="' + _h3() + '">Segmento atual</h3>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' + _segmentBadge(stats.segment) + '<strong style="font-size:18px;">' + _esc(stats.segmentLabel) + '</strong></div>' +
      '<div style="font-size:13px;color:#8A7E7C;line-height:1.45;">' + _esc(_segmentReason(c, stats)) + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px;">' +
      _miniMetric('Pedidos', stats.ordersCount) +
      _miniMetric('Total', stats.ordersCount ? UI.fmt(stats.totalSpent) : '-') +
      _miniMetric('Último pedido', stats.lastOrderLabel || '-') +
      '</div></div>' +
      '<div style="' + _panel() + '"><h3 style="' + _h3() + '">Regras do segmento</h3>' +
      _ruleRow('Novo', '1 pedido válido') +
      _ruleRow('Recorrente', '2 ou mais pedidos válidos') +
      _ruleRow('VIP', '5+ pedidos ou €100+ em compras') +
      _ruleRow('Inativo', 'mais de 60 dias sem comprar') +
      _ruleRow('Sem pedido', 'cliente cadastrado sem pedido válido') +
      '</div></div>' +
      '<div style="' + _panel() + '"><h3 style="' + _h3() + '">Fluxo do segmento</h3>' +
      '<div style="font-size:12px;color:#8A7E7C;margin-bottom:8px;">Histórico calculado automaticamente com base em pedidos, total comprado, última compra e status do cliente.</div>' +
      (events.length ? events.map(_segmentEventRow).join('') : '<div style="padding:12px;border:1px dashed #D4C8C6;border-radius:12px;color:#8A7E7C;text-align:center;">Ainda não há eventos suficientes para montar o fluxo.</div>') +
      '<button onclick="Modules.Clientes._setFilter(\'segment\', \'' + stats.segment + '\')" style="' + _actionButton('#FFF8F1', '#B45309') + '"><span class="mi">filter_alt</span> Filtrar clientes deste segmento</button>' +
      '</div>' +
      '</div>';
    UI.modal({ title: 'Segmento - ' + (c.name || 'Cliente'), body: body, maxWidth: '860px' });
  }

  function _deleteCliente(id) {
    UI.confirm('Eliminar este cliente?').then(function (yes) {
      if (!yes) return;
      DB.remove('store_customers', id).then(function () {
        UI.toast('Cliente eliminado', 'info');
        if (window._clienteModal) window._clienteModal.close();
        _load();
      });
    });
  }

  function _setFilter(key, value) {
    _filters[key] = value || '';
    _paint();
  }

  function _filtered() {
    var q = (_filters.q || '').toLowerCase();
    return _view.filter(function (c) {
      var s = c._stats || {};
      var haystack = [c.name, c.phone, c.email, c.nifCif, c.fiscalId, c.neighborhood, c.zone, c.postalCode, c.state, c.province, c.country, c.origin, c.mainChannel, c.channelName, c.channel, c.status, _tags(c.tags).join(' '), c.preferences, c.allergies].join(' ').toLowerCase();
      if (q && haystack.indexOf(q) < 0) return false;
      if (_filters.status && String(c.status || s.segment) !== _filters.status) return false;
      if (_filters.segment && s.segment !== _filters.segment) return false;
      if (_filters.origin && String(c.mainChannel || c.channelName || c.channel || c.origin || '') !== _filters.origin) return false;
      return true;
    });
  }

  function _ordersForClient(c) {
    var id = String(c.id || '');
    var name = _clean(c.name);
    var phone = _phone(c.phone);
    var email = _clean(c.email);
    return (_orders || []).filter(function (o) {
      if (id && String(o.customerId || o.clientId || '') === id) return true;
      if (phone && _phone(o.phone || o.customerPhone || o.whatsapp) === phone) return true;
      if (email && _clean(o.email || o.customerEmail) === email) return true;
      if (name && _clean(o.customerName || o.clientName || o.name) === name) return true;
      return false;
    }).sort(function (a, b) { return _dateTs(b) - _dateTs(a); });
  }

  function _stats(c, orders) {
    var valid = (orders || []).filter(function (o) {
      var st = String(o.status || '').toLowerCase();
      return st !== 'cancelado' && st !== 'canceled' && st !== 'cancelled';
    });
    var total = valid.reduce(function (s, o) { return s + _num(o.total || o.amount || o.grandTotal); }, 0);
    var count = valid.length;
    var last = valid[0] || null;
    var days = last ? Math.floor((Date.now() - _dateTs(last)) / 86400000) : null;
    var freq = {};
    valid.forEach(function (o) {
      (o.items || []).forEach(function (item) {
        var name = item.name || item.nome || item.title || 'Produto';
        freq[name] = (freq[name] || 0) + (_num(item.qty || item.quantity) || 1);
      });
    });
    var topProducts = Object.keys(freq).map(function (k) { return [k, freq[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    var segment = 'sem_pedido';
    if (String(c.status || '') === 'bloqueado') segment = 'bloqueado';
    else if (!count) segment = 'sem_pedido';
    else if (days !== null && days > 60) segment = 'inativo';
    else if (total >= 100 || count >= 5) segment = 'vip';
    else if (count >= 2) segment = 'recorrente';
    else segment = 'novo';
    return {
      ordersCount: count,
      totalSpent: total,
      avgTicket: count ? total / count : 0,
      lastOrderTs: last ? _dateTs(last) : 0,
      lastOrderLabel: last ? _fmtDate(last) : '',
      daysSinceLast: days,
      segment: segment,
      segmentLabel: _segmentLabel(segment),
      topProducts: topProducts
    };
  }

  function _segmentEvents(c, orders) {
    var valid = (orders || []).filter(function (o) {
      var st = String(o.status || '').toLowerCase();
      return st !== 'cancelado' && st !== 'canceled' && st !== 'cancelled';
    }).sort(function (a, b) { return _dateTs(a) - _dateTs(b); });
    var events = [];
    var created = _dateTs(c);
    if (created) {
      events.push({ ts: created, segment: 'sem_pedido', title: 'Cliente cadastrado', text: 'Entrada criada na base de clientes.' });
    }
    var total = 0;
    var vipByValue = false;
    valid.forEach(function (o, idx) {
      var count = idx + 1;
      var amount = _num(o.total || o.amount || o.grandTotal);
      total += amount;
      if (count === 1) {
        events.push({ ts: _dateTs(o), segment: 'novo', title: 'Primeiro pedido', text: 'Cliente passa a ter histórico de compra. Pedido de ' + UI.fmt(amount) + '.' });
      }
      if (count === 2) {
        events.push({ ts: _dateTs(o), segment: 'recorrente', title: 'Cliente recorrente', text: 'Atingiu 2 pedidos válidos.' });
      }
      if (count === 5) {
        events.push({ ts: _dateTs(o), segment: 'vip', title: 'Cliente VIP por frequência', text: 'Atingiu 5 pedidos válidos.' });
      }
      if (!vipByValue && total >= 100) {
        vipByValue = true;
        events.push({ ts: _dateTs(o), segment: 'vip', title: 'Cliente VIP por valor', text: 'Atingiu ' + UI.fmt(total) + ' em compras acumuladas.' });
      }
    });
    var lastOrder = valid.length ? valid[valid.length - 1] : null;
    var lastOrderTs = lastOrder ? _dateTs(lastOrder) : 0;
    var daysSinceLast = lastOrderTs ? Math.floor((Date.now() - lastOrderTs) / 86400000) : null;
    if (String(c.status || '') !== 'bloqueado' && lastOrderTs && daysSinceLast > 60) {
      events.push({ ts: lastOrderTs + 60 * 86400000, segment: 'inativo', title: 'Cliente inativo', text: 'Mais de 60 dias sem novo pedido. Último pedido em ' + _fmtDate(lastOrder) + '.' });
    }
    if (String(c.status || '') === 'bloqueado') {
      events.push({ ts: _dateTs(c) || Date.now(), segment: 'bloqueado', title: 'Status bloqueado', text: 'Status marcado manualmente no cadastro do cliente.' });
    }
    if (!valid.length && !created) {
      events.push({ ts: 0, segment: 'sem_pedido', title: 'Sem pedidos', text: 'Cliente ainda não possui pedidos válidos vinculados.' });
    }
    return events.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
  }

  function _segmentReason(c, s) {
    if (String(c.status || '') === 'bloqueado') return 'O cliente está com status bloqueado no cadastro.';
    if (!s.ordersCount) return 'Cliente cadastrado, mas ainda sem pedidos válidos vinculados.';
    if (s.segment === 'inativo') return 'Último pedido há ' + s.daysSinceLast + ' dias. Acima do limite de 60 dias sem compra.';
    if (s.segment === 'vip') return 'Cliente com ' + s.ordersCount + ' pedidos válidos e ' + UI.fmt(s.totalSpent) + ' em compras acumuladas.';
    if (s.segment === 'recorrente') return 'Cliente com ' + s.ordersCount + ' pedidos válidos. A partir de 2 pedidos entra como recorrente.';
    return 'Cliente com primeiro pedido válido registrado.';
  }

  function _ruleRow(label, text) {
    return '<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid #F2EDED;"><strong style="font-size:13px;">' + _esc(label) + '</strong><span style="font-size:12px;color:#8A7E7C;text-align:right;">' + _esc(text) + '</span></div>';
  }

  function _segmentEventRow(e) {
    return '<div style="display:grid;grid-template-columns:96px 1fr;gap:12px;padding:11px 0;border-top:1px solid #F2EDED;">' +
      '<div style="font-size:11px;color:#8A7E7C;font-weight:900;">' + _esc(e.ts ? UI.fmtDate(new Date(e.ts)) : '-') + '</div>' +
      '<div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' + _segmentBadge(e.segment) + '<strong style="font-size:14px;">' + _esc(e.title) + '</strong></div>' +
      '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;line-height:1.4;">' + _esc(e.text) + '</div></div>' +
      '</div>';
  }

  function _topProductsHTML(items) {
    if (!items || !items.length) return '';
    return '<div style="' + _panel() + 'margin-top:14px;"><h3 style="' + _h3() + '">Produtos mais comprados</h3><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      items.map(function (p) { return '<span style="padding:7px 11px;border-radius:18px;background:#F2EDED;font-size:12px;font-weight:800;">' + _esc(p[0]) + ' x' + p[1] + '</span>'; }).join('') +
      '</div></div>';
  }

  function _reviewsHTML(c) {
    var name = _clean(c.name);
    var rows = (_reviews || []).filter(function (r) {
      return String(r.customerId || '') === String(c.id || '') || (name && _clean(r.customerName || r.name) === name);
    }).slice(0, 3);
    if (!rows.length) return '';
    return '<div style="' + _panel() + 'margin-top:14px;"><h3 style="' + _h3() + '">Avaliações</h3>' + rows.map(function (r) {
      return '<div style="padding:10px 0;border-top:1px solid #F2EDED;"><strong>' + _esc(r.rating || r.stars || '-') + ' estrelas</strong><div style="font-size:12px;color:#8A7E7C;">' + _esc(r.comment || r.text || '') + '</div></div>';
    }).join('') + '</div>';
  }

  function _orderRow(o) {
    var items = (o.items || []).map(function (i) { return (i.qty || i.quantity || 1) + 'x ' + (i.name || i.nome || 'Produto'); }).join(', ');
    return '<div style="background:#fff;border:1px solid #F2EDED;border-radius:12px;padding:12px;display:flex;justify-content:space-between;gap:12px;align-items:center;">' +
      '<div><strong>' + _esc(o.status || 'Pendente') + '</strong><div style="font-size:12px;color:#8A7E7C;">' + _esc(_fmtDate(o)) + (items ? ' · ' + _esc(items) : '') + '</div></div>' +
      '<strong style="color:#C4362A;">' + UI.fmt(_num(o.total || o.amount || o.grandTotal)) + '</strong></div>';
  }

  function _originOptions(selected) {
    var origins = _channelNames();
    (_clientes || []).forEach(function (c) {
      var v = c.mainChannel || c.channelName || c.channel || c.origin;
      if (v && origins.indexOf(v) < 0) origins.push(v);
    });
    return '<option value="">Canal principal</option>' + origins.map(function (o) { return '<option value="' + _esc(o) + '"' + (selected === o ? ' selected' : '') + '>' + _esc(_title(o)) + '</option>'; }).join('');
  }

  function _normalizeCanais(raw) {
    var list = raw && Array.isArray(raw.list) ? raw.list : [];
    var names = ['Cardápio', 'Loja própria', 'WhatsApp'];
    list.forEach(function (c) {
      var name = c && (c.name || c.nome || c.label);
      if (name && names.indexOf(name) < 0) names.push(name);
    });
    return names.map(function (name) { return { name: name }; });
  }

  function _channelNames() {
    var names = (_canais || []).map(function (c) { return c.name || c.nome || c.label; }).filter(Boolean);
    return names.length ? names : ['Cardápio', 'Loja própria', 'WhatsApp'];
  }

  function _defaultChannel() {
    var names = _channelNames();
    return names.indexOf('Cardápio') >= 0 ? 'Cardápio' : names[0];
  }

  function _channelOptions(selected) {
    return _channelNames().map(function (name) {
      return '<option value="' + _esc(name) + '"' + (selected === name ? ' selected' : '') + '>' + _esc(_title(name)) + '</option>';
    }).join('');
  }

  function _stateOptions(selected) {
    var states = ['', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Gipuzkoa', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Las Palmas', 'Pontevedra', 'La Rioja', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Bizkaia', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'];
    return states.map(function (s, idx) { return '<option value="' + _esc(s) + '"' + (selected === s ? ' selected' : '') + '>' + _esc(idx === 0 ? 'Selecionar...' : s) + '</option>'; }).join('');
  }

  function _regionOptions(country, selected) {
    var lc = String(country || '').toLowerCase();
    var opts;
    if (lc === 'portugal') {
      opts = ['', 'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Açores', 'Madeira'];
    } else if (!lc || lc === 'españa') {
      opts = ['', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Gipuzkoa', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Las Palmas', 'Pontevedra', 'La Rioja', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Bizkaia', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'];
    } else {
      opts = [''];
    }
    return opts.map(function (s, idx) { return '<option value="' + _esc(s) + '"' + (selected === s ? ' selected' : '') + '>' + _esc(idx === 0 ? 'Selecionar...' : s) + '</option>'; }).join('');
  }

  function _onClienteCountryChange() {
    var countryVal = (document.getElementById('cli-country') || {}).value || '';
    var code = window.FiscalConfig ? FiscalConfig.countryToCode(countryVal) : null;
    var cfg = window.FiscalConfig ? FiscalConfig.get(code || countryVal || 'ES') : null;
    if (cfg) {
      var lbl = document.getElementById('cli-fiscal-label');
      var inp = document.getElementById('cli-fiscal');
      var hint = document.getElementById('cli-fiscal-hint');
      var stLbl = document.getElementById('cli-state-label');
      if (lbl) lbl.textContent = cfg.fiscalDocumentLabel;
      if (inp) inp.placeholder = cfg.fiscalDocumentPlaceholder;
      if (hint) hint.textContent = cfg.fiscalDocumentHint;
      if (stLbl) stLbl.textContent = cfg.regionLabel || 'Estado / Província';
    }
    var stateSelect = document.getElementById('cli-state');
    if (stateSelect) stateSelect.innerHTML = _regionOptions(countryVal, '');
  }

  function _countryOptions(selected) {
    var countries = ['España', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Países Bajos', 'Bélgica', 'Reino Unido', 'Irlanda', 'Otro'];
    return countries.map(function (c) { return '<option value="' + _esc(c) + '"' + (selected === c ? ' selected' : '') + '>' + _esc(c) + '</option>'; }).join('');
  }

  function _filterOptions(values, selected, empty) {
    return values.map(function (v, idx) {
      return '<option value="' + _esc(v) + '"' + (selected === v ? ' selected' : '') + '>' + (idx === 0 ? empty : _esc(_segmentLabel(v))) + '</option>';
    }).join('');
  }

  function _simpleOptions(values, selected) {
    return values.map(function (v) { return '<option value="' + _esc(v) + '"' + (selected === v ? ' selected' : '') + '>' + _esc(_title(v)) + '</option>'; }).join('');
  }

  function _segmentLabel(v) {
    return ({ novo: 'Novo', recorrente: 'Recorrente', vip: 'VIP', inativo: 'Inativo', sem_pedido: 'Sem pedido', ativo: 'Ativo', bloqueado: 'Bloqueado' })[v] || _title(v || '');
  }

  function _segmentBadge(v) {
    var color = v === 'vip' ? 'orange' : v === 'recorrente' ? 'green' : v === 'inativo' ? 'gray' : v === 'bloqueado' ? 'red' : 'blue';
    return UI.badge(_segmentLabel(v), color);
  }

  function _statusBadge(status) {
    if (!status) return '';
    if (status === 'ativo') return '';
    return UI.badge(_segmentLabel(status), status === 'bloqueado' ? 'red' : 'gray');
  }

  function _tags(raw) {
    if (Array.isArray(raw)) return raw.map(function (x) { return String(x).trim(); }).filter(Boolean);
    return String(raw || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function _normalizePointsConfig(raw) {
    raw = raw || {};
    return {
      earnPerEuro: Math.max(1, Math.round(_pointsNumber(raw.earnPerEuro != null ? raw.earnPerEuro : raw.pointsPerEuro != null ? raw.pointsPerEuro : 1) || 1)),
      redeemRate: Math.max(1, Math.round(_pointsNumber(raw.redeemRate != null ? raw.redeemRate : raw.pointsPerDiscountEuro != null ? raw.pointsPerDiscountEuro : 10) || 10)),
      minimumPointsToUse: Math.max(0, Math.round(_pointsNumber(raw.minimumPointsToUse != null ? raw.minimumPointsToUse : 50) || 50)),
      maxDiscountPct: Math.max(0, Math.min(100, _pointsNumber(raw.maxDiscountPct != null ? raw.maxDiscountPct : 20) || 20))
    };
  }

  function _pointsNumber(value) {
    var str = String(value == null ? '' : value).trim();
    if (!str) return 0;
    var cleaned = str.replace(/[^\d,.-]/g, '');
    if (!cleaned) return 0;
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    else cleaned = cleaned.replace(/,/g, '');
    var n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }

  function _pointsBalance(c) {
    return Math.max(0, Math.floor(_pointsNumber(c && (c.points != null ? c.points : c.pointsBalance != null ? c.pointsBalance : 0))));
  }

  function _pointsAvailableDiscount(c) {
    var cfg = _pointsConfig || { redeemRate: 10, maxDiscountPct: 20 };
    return Math.floor(_pointsBalance(c) / Math.max(1, cfg.redeemRate || 10));
  }

  function _pointsMovementDate(v) {
    if (!v) return 0;
    if (v && typeof v.toDate === 'function') return v.toDate().getTime();
    var d = new Date(v);
    return isFinite(d.getTime()) ? d.getTime() : 0;
  }

  function _pointsMovementsForClient(c) {
    var id = String(c && c.id || '');
    var phone = String(c && c.phone || c && c.whatsapp || '').replace(/\D/g, '');
    var name = _clean(c && c.name || '');
    return (_pointsMovements || []).filter(function (m) {
      if (id && String(m.customerId || m.clientId || '') === id) return true;
      if (phone && String(m.phone || '').replace(/\D/g, '') === phone) return true;
      if (name && _clean(m.customerName || m.name || '') === name) return true;
      return false;
    }).sort(function (a, b) { return _pointsMovementDate(b.createdAt || b.date || b.updatedAt) - _pointsMovementDate(a.createdAt || a.date || a.updatedAt); });
  }

  function _pointsHistoryHTML(c) {
    var balance = _pointsBalance(c);
    var available = _pointsAvailableDiscount(c);
    var movements = _pointsMovementsForClient(c).slice(0, 6);
    return '<div style="' + _panel() + 'margin-top:14px;"><h3 style="' + _h3() + '">Histórico de Pontos</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px;">' +
        _miniMetric('Saldo', balance + ' pts') +
        _miniMetric('Desconto disponível', UI.fmt(available)) +
        _miniMetric('Movimentos', movements.length) +
      '</div>' +
      (movements.length ? '<div style="display:flex;flex-direction:column;gap:8px;">' + movements.map(function (m) {
        var ts = _pointsMovementDate(m.createdAt || m.date || m.updatedAt);
        var type = String(m.type || '') === 'used' ? 'Uso' : 'Ganho';
        var value = String(m.type || '') === 'used' ? '-' + _pointsNumber(m.pointsUsed != null ? m.pointsUsed : m.points || 0) + ' pts' : '+' + _pointsNumber(m.pointsEarned != null ? m.pointsEarned : m.points || 0) + ' pts';
        return '<div style="display:grid;grid-template-columns:96px 1fr auto;gap:10px;padding:10px 0;border-top:1px solid #F2EDED;align-items:center;">' +
          '<div style="font-size:11px;color:#8A7E7C;font-weight:900;">' + _esc(ts ? UI.fmtDate(new Date(ts)) : '-') + '</div>' +
          '<div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><strong style="font-size:13px;">' + _esc(type) + '</strong>' + UI.badge(m.orderDisplay || m.orderId || 'Pedido', String(m.type || '') === 'used' ? 'orange' : 'green') + '</div>' +
            '<div style="font-size:12px;color:#8A7E7C;margin-top:4px;line-height:1.4;">Pontos ganhos: ' + _pointsNumber(m.pointsEarned || 0) + ' · Pontos usados: ' + _pointsNumber(m.pointsUsed || 0) + ' · Desconto: ' + UI.fmt(_pointsNumber(m.discountValue || 0)) + '</div></div>' +
          '<div style="text-align:right;"><div style="font-size:14px;font-weight:900;color:' + (String(m.type || '') === 'used' ? '#C4362A' : '#1A9E5A') + ';">' + _esc(value) + '</div><div style="font-size:11px;color:#8A7E7C;">Saldo final: ' + _pointsNumber(m.balanceAfter || 0) + '</div></div>' +
        '</div>';
      }).join('') : '<div style="font-size:13px;color:#8A7E7C;">Ainda sem movimentos.</div>') +
    '</div>';
  }

  function _miniMetric(label, value) { return '<div style="background:#FAF8F4;border:1px solid #EAE4DA;border-radius:12px;padding:10px 11px;min-width:0;"><div style="font-size:10px;color:#6F6860;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.2;">' + label + '</div><strong style="display:block;font-size:14px;color:#1F1F1F;margin-top:4px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + value + '</strong></div>'; }
  function _kpi(label, value, sub, icon, color) {
    return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'#FAF8F4\'">' +
      '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + (color || '#6F6860') + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'analytics') + '</span></div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
        '<span style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
        '<strong style="font-size:34px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;letter-spacing:0;">' + _esc(String(value)) + '</strong>' +
        (sub ? '<small style="font-size:11px;color:#8A7E7C;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(sub) + '</small>' : '') +
      '</div>' +
    '</div>';
  }
  function _chip(text) { return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(text) + '</span>'; }
  function _info(label, value) { return '<div style="padding:8px 0;border-top:1px solid #F2EDED;"><div style="font-size:10px;color:#8A7E7C;font-weight:900;text-transform:uppercase;">' + label + '</div><div style="font-size:13px;font-weight:700;">' + _esc(value || '-') + '</div></div>'; }
  function _infoHTML(label, html) { return '<div style="padding:8px 0;border-top:1px solid #F2EDED;"><div style="font-size:10px;color:#8A7E7C;font-weight:900;text-transform:uppercase;">' + label + '</div><div style="font-size:13px;font-weight:700;">' + (html || '-') + '</div></div>'; }
  function _field(id, label, value, type) { return '<div class="bf-field"><label>' + label + '</label><input id="' + id + '" class="bf-input" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '"></div>'; }
  function _textarea(id, label, value) { return '<div class="bf-field"><label>' + label + '</label><textarea id="' + id + '" class="bf-textarea">' + _esc(value || '') + '</textarea></div>'; }
  function _select(id, label, options) { return '<div class="bf-field"><label>' + label + '</label><select id="' + id + '" class="bf-select">' + options + '</select></div>'; }
  function _input() { return 'width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;background:#fff;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;'; }
  function _label() { return 'font-size:10px;font-weight:600;color:#7A746B;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;'; }
  function _sectionTitle() { return 'font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;'; }
  function _primaryBtn() { return 'min-width:180px;height:40px;background:#B42318;color:#fff;border:none;padding:0 16px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);'; }
  function _smallSelect() { return 'height:38px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;font-size:13px;font-weight:500;color:#1F1F1F;font-family:inherit;outline:none;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _iconBtn(bg, color) { return 'width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:' + bg + ';color:' + color + ';cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _panel() { return 'background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);'; }
  function _h3() { return 'font-size:14px;font-weight:700;color:#1F1F1F;margin-bottom:10px;'; }
  function _actionButton(bg, color) { return 'width:100%;display:flex;align-items:center;gap:8px;margin-top:8px;padding:10px 12px;border-radius:10px;border:1px solid #EAE4DA;background:' + bg + ';color:' + color + ';font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _actionLink(bg, color) { return _actionButton(bg, color) + 'text-decoration:none;box-sizing:border-box;'; }
  function _avatarColor(name) { var colors = ['#C4362A', '#1A9E5A', '#2563EB', '#7C3AED', '#D97706', '#0891B2']; return colors[(name || 'C').charCodeAt(0) % colors.length]; }
  function _initials(name) { return (name || 'Cliente').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
  function _clientAddress(c) { return [c.address, c.neighborhood || c.zone, c.postalCode, c.state || c.province, c.country].filter(Boolean).join(', '); }
  function _phoneLink(c, text) { return '<a href="' + _whatsUrl(c.phone, text || '') + '" target="_blank" onclick="event.stopPropagation();" style="color:#1A9E5A;font-weight:900;text-decoration:none;">' + _esc(c.phone || '') + '</a>'; }
  function _contactHTML(c, text) {
    var parts = [];
    if (c.phone) parts.push('<span class="mi" style="font-size:14px;color:#1A9E5A;vertical-align:-2px;">chat</span> ' + _phoneLink(c, text));
    if (c.email) parts.push('<span>' + _esc(c.email) + '</span>');
    return parts.join('<span style="color:#D4C8C6;"> · </span>');
  }
  function _whatsUrl(phone, text) { return 'https://wa.me/' + _phone(phone) + '?text=' + encodeURIComponent(text || ''); }
  function _phone(v) { return String(v || '').replace(/\D/g, ''); }
  function _validPhone(v) { var raw = String(v || '').trim(); if (!raw) return true; var digits = _phone(raw); return digits.length >= 7 && digits.length <= 15; }
  function _validEmail(v) { var raw = String(v || '').trim(); return !raw || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw); }
  function _validFiscalId(v) {
    var raw = String(v || '').toUpperCase().replace(/[\s.-]/g, '');
    if (!raw) return true;
    return /^\d{8}[A-Z]$/.test(raw) || /^[XYZ]\d{7}[A-Z]$/.test(raw) || /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(raw);
  }
  function _validPostalCode(v, country) {
    var raw = String(v || '').trim();
    if (!raw) return true;
    var lc = String(country || '').toLowerCase();
    if (lc === 'españa') return /^\d{5}$/.test(raw);
    if (lc === 'portugal') return /^\d{4}-\d{3}$/.test(raw) || /^\d{4}$/.test(raw);
    return raw.length >= 3 && raw.length <= 12;
  }
  function _countryIso(value) {
    var raw = String(value || '').trim();
    var up = raw.toUpperCase();
    if (['ES', 'PT', 'BR', 'FR', 'IT', 'DE', 'GB', 'US'].indexOf(up) >= 0) return up;
    if (window.FiscalConfig && FiscalConfig.countryToCode) {
      var mapped = FiscalConfig.countryToCode(raw);
      if (mapped) return mapped;
    }
    var lc = raw.toLowerCase();
    if (lc.indexOf('portugal') >= 0) return 'PT';
    if (lc.indexOf('brasil') >= 0 || lc.indexOf('brazil') >= 0) return 'BR';
    if (lc.indexOf('fran') >= 0) return 'FR';
    if (lc.indexOf('ital') >= 0) return 'IT';
    if (lc.indexOf('alem') >= 0 || lc.indexOf('germany') >= 0) return 'DE';
    if (lc.indexOf('reino') >= 0 || lc.indexOf('kingdom') >= 0) return 'GB';
    if (lc.indexOf('unidos') >= 0 || lc.indexOf('states') >= 0) return 'US';
    return 'ES';
  }
  function _defaultClientFiscal() {
    return {
      customerType: 'person',
      legalName: '',
      commercialName: '',
      documentType: '',
      fiscalId: '',
      countryCode: 'ES',
      invoiceEmail: '',
      fiscalAddress: {
        address: '',
        number: '',
        complement: '',
        city: '',
        province: '',
        postalCode: '',
        countryCode: 'ES'
      },
      externalFiscalCustomerId: '',
      facturaDirectaCustomerId: ''
    };
  }
  function _ensureClientFiscal(c) {
    c = c || {};
    var current = Object.assign({}, c.fiscal || {});
    var currentAddress = Object.assign({}, current.fiscalAddress || {});
    var countryCode = _countryIso(current.countryCode || c.country || (window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES'));
    var defaults = _defaultClientFiscal();
    return Object.assign({}, defaults, current, {
      customerType: current.customerType || 'person',
      legalName: current.legalName || c.legalName || c.name || '',
      commercialName: current.commercialName || c.commercialName || '',
      documentType: current.documentType || '',
      fiscalId: current.fiscalId || c.fiscalId || c.nifCif || '',
      countryCode: countryCode,
      invoiceEmail: current.invoiceEmail || c.invoiceEmail || c.email || '',
      fiscalAddress: Object.assign({}, defaults.fiscalAddress, currentAddress, {
        address: currentAddress.address || c.address || '',
        number: currentAddress.number || c.number || c.numero || '',
        complement: currentAddress.complement || c.reference || c.complement || '',
        city: currentAddress.city || c.city || c.cidade || '',
        province: currentAddress.province || c.province || c.state || '',
        postalCode: currentAddress.postalCode || c.postalCode || '',
        countryCode: _countryIso(currentAddress.countryCode || countryCode)
      }),
      externalFiscalCustomerId: current.externalFiscalCustomerId || '',
      facturaDirectaCustomerId: current.facturaDirectaCustomerId || ''
    });
  }
  function _customerTypeOptions(selected) {
    var list = [
      ['person', 'Pessoa física'],
      ['autonomo', 'Autónomo'],
      ['company', 'Empresa']
    ];
    return list.map(function (x) { return '<option value="' + x[0] + '"' + (selected === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('');
  }
  function _documentTypeOptions(selected) {
    var list = ['', 'NIF', 'NIE', 'CIF', 'VAT'];
    return list.map(function (x) { return '<option value="' + x + '"' + (selected === x ? ' selected' : '') + '>' + (x || 'Selecionar') + '</option>'; }).join('');
  }
  function _countryCodeOptions(selected) {
    var list = [['ES', 'ES'], ['PT', 'PT'], ['BR', 'BR'], ['FR', 'FR'], ['IT', 'IT'], ['DE', 'DE'], ['GB', 'GB'], ['US', 'US']];
    return list.map(function (x) { return '<option value="' + x[0] + '"' + (selected === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('');
  }
  function _clean(v) { return String(v || '').trim().toLowerCase(); }
  function _title(v) { return String(v || '').replace(/_/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }); }
  function _dateTs(o) { var raw = o.createdAt || o.date || o.data || o.updatedAt || o.paidAt || ''; if (raw && typeof raw.toDate === 'function') return raw.toDate().getTime(); var d = new Date(raw); return isNaN(d.getTime()) ? 0 : d.getTime(); }
  function _fmtDate(o) { var ts = _dateTs(o); return ts ? UI.fmtDate(new Date(ts)) : '-'; }
  function _num(v) { return parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0; }
  function _val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function _checked(id) { var el = document.getElementById(id); return !!(el && el.checked); }
  function _esc(str) { return String(str == null ? '' : str).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]; }); }

  function destroy() {}

  return {
    render: render,
    destroy: destroy,
    _openModal: _openModal,
    _saveCliente: _saveCliente,
    _onClienteCountryChange: _onClienteCountryChange,
    _deleteCliente: _deleteCliente,
    _openHistory: _openHistory,
    _openSegmentFlow: _openSegmentFlow,
    _openProfile: _openProfile,
    _setFilter: _setFilter
  };
})();
