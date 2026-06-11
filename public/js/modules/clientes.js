// js/modules/clientes.js
window.Modules = window.Modules || {};
Modules.Clientes = (function () {
  'use strict';

  var _clientes = [];
  var _orders = [];
  var _reviews = [];
  var _canais = [];
  var _pointsMovements = [];
  var _postalHistory = [];
  var _pointsConfig = { earnPerEuro: 1, redeemRate: 10, minimumPointsToUse: 50, maxDiscountPct: 20 };
  var _view = [];
  var _editingId = null;
  var _clienteDeliveryAddresses = [];
  var _clienteAddressFormOpen = false;
  var _clienteAddressEditIndex = -1;
  var _filters = { q: '', status: '', segment: '', origin: '' };
  var _page = { page: 1, perPage: 10 };

  function render() {
    var app = document.getElementById('app');
    app.innerHTML = '<section class="module-page">' +
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
      DB.getAll('points_movements').catch(function () { return []; }),
      DB.getAll('postal_history').catch(function () { return []; })
    ]).then(function (r) {
      _clientes = (r[0] || []).map(_withClienteRecordId).sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
      _orders = r[1] || [];
      _reviews = r[2] || [];
      _canais = _normalizeCanais(r[3]);
      _pointsConfig = _normalizePointsConfig(r[4] || {});
      _pointsMovements = Array.isArray(r[5]) ? r[5] : [];
      _postalHistory = Array.isArray(r[6]) ? r[6] : [];
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
    var paging = _page || (_page = { page: 1, perPage: 10 });
    var totalPages = Math.max(1, Math.ceil(data.length / paging.perPage));
    if (paging.page > totalPages) paging.page = totalPages;
    if (paging.page < 1) paging.page = 1;
    var start = data.length ? ((paging.page - 1) * paging.perPage + 1) : 0;
    var end = data.length ? Math.min(paging.page * paging.perPage, data.length) : 0;
    var pageData = data.slice((paging.page - 1) * paging.perPage, paging.page * paging.perPage);
    root.innerHTML = _clientesStyles() + '<div class="bf-page clientes-page">' +
      '<div class="clientes-head">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 class="clientes-title">Clientes</h2>' +
          '<p class="clientes-subtitle">Base de clientes, histórico de compras, preferências e ações de relacionamento.</p>' +
        '</div>' +
        '<button type="button" class="clientes-primary" onclick="Modules.Clientes._openModal(null)"><span class="mi" style="font-size:16px;">person_add</span>Novo Cliente</button>' +
      '</div>' +
      _kpis() +
      _filtersHTML(data) +
      '<div id="clientes-list">' + _list(pageData, data.length, start, end, paging.page, totalPages, paging.perPage) + '</div>' +
      '</div>';
  }

  function _clientesStyles() {
    return '<style>' +
      '.clientes-page{display:flex;flex-direction:column;gap:16px;}' +
      '.clientes-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.clientes-title{font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;}' +
      '.clientes-subtitle{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;}' +
      '.clientes-primary{height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.clientes-primary:hover{background:#9F1F16;transform:translateY(-1px);box-shadow:0 8px 18px rgba(180,35,24,.22);}' +
      '.clientes-filter{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.055);}' +
      '.clientes-filter-grid{display:grid;grid-template-columns:minmax(260px,1fr) minmax(155px,210px) minmax(165px,220px) minmax(175px,230px);gap:11px 12px;align-items:end;}' +
      '.clientes-field{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.clientes-field:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.clientes-field input,.clientes-field select{width:100%;height:40px;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;box-sizing:border-box;}' +
      '.clientes-field select{appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:30px;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 4px center;background-size:14px;}' +
      '.clientes-filter-actions{display:flex;justify-content:flex-start;margin-top:11px;}' +
      '.clientes-clear{height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.clientes-table-card{background:#fff;border:1px solid #EADFD8;border-radius:18px;box-shadow:0 12px 30px rgba(31,31,31,.055);overflow:hidden;}' +
      '.clientes-table-wrap{overflow-x:auto;}' +
      '.clientes-table{width:100%;border-collapse:separate;border-spacing:0;min-width:940px;}' +
      '.clientes-table th{padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;}' +
      '.clientes-table th:last-child{text-align:right;}' +
      '.clientes-table td{padding:14px 16px;vertical-align:middle;border-bottom:1px solid #EADFD8;}' +
      '.clientes-table tbody tr{cursor:pointer;background:#fff;transition:background .15s ease,box-shadow .15s ease;}' +
      '.clientes-table tbody tr:hover{background:#FFFCF8;}' +
      '.clientes-page-select{width:110px;height:34px;padding:0 34px 0 10px;border:1px solid #E8DCD7;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#FFFCF8;color:#6F6860;box-sizing:border-box;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 12px center;background-size:14px;}' +
      '.clientes-page-btn{height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;}' +
      '.clientes-empty{text-align:center;padding:42px 18px;color:#6F6860;font-size:13px;line-height:1.45;border:1px dashed #EADFD8;border-radius:14px;background:#FFFCF8;}' +
      '@media(max-width:820px){.clientes-filter-grid{grid-template-columns:1fr}.clientes-primary{width:100%;}}' +
      '</style>';
  }

  function _kpis() {
    var total = _view.length;
    var recurrent = _view.filter(function (c) { return (c._stats.recurrenceOrdersCount || 0) >= 2; }).length;
    var inactive = _view.filter(function (c) { return c._stats.segment === 'inativo'; }).length;
    var valid = _view.filter(function (c) { return c._stats.ordersCount > 0; });
    var avgTicket = valid.length ? valid.reduce(function (s, c) { return s + c._stats.avgTicket; }, 0) / valid.length : 0;
    var optIn = _view.filter(function (c) { return c.acceptsMarketing === true; }).length;
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' +
      _kpi('Total de clientes', total, 'base cadastrada', 'groups', '#8A6F5A') +
      _kpi('Recorrentes', recurrent, '2+ pedidos identificados', 'repeat', '#6C8777') +
      _kpi('Inativos', inactive, 'sem compra recente', 'person_off', '#A18362') +
      _kpi('Ticket médio', valid.length ? UI.fmt(avgTicket) : 'sem dados', valid.length + ' cliente(s) com pedido', 'payments', '#B42318') +
      _kpi('Aceitam marketing', optIn, 'WhatsApp/campanhas', 'campaign', '#2563EB') +
      '</div>';
  }

  function _filtersHTML(data) {
    var hasFilters = !!(_filters.q || _filters.status || _filters.segment || _filters.origin);
    return '<div class="clientes-filter">' +
      '<div class="clientes-filter-grid">' +
        _filterField('Buscar', '<div class="clientes-field"><input id="cli-search" type="search" value="' + _esc(_filters.q) + '" oninput="Modules.Clientes._setFilter(\'q\', this.value)" placeholder="Buscar por nome, telefone ou e-mail" autocomplete="off" autocapitalize="off" spellcheck="false"></div>') +
        _filterField('Status', '<div class="clientes-field"><select id="cli-status-filter" onchange="Modules.Clientes._setFilter(\'status\', this.value)">' + _filterOptions(['', 'ativo', 'recorrente', 'inativo', 'bloqueado'], _filters.status, 'Todos') + '</select></div>') +
        _filterField('Segmento', '<div class="clientes-field"><select id="cli-segment-filter" onchange="Modules.Clientes._setFilter(\'segment\', this.value)">' + _filterOptions(['', 'novo', 'recorrente', 'vip', 'inativo', 'sem_segunda_compra', 'com_pontos', 'sem_pedido'], _filters.segment, 'Todos') + '</select></div>') +
        _filterField('Canal principal', '<div class="clientes-field"><select id="cli-origin-filter" onchange="Modules.Clientes._setFilter(\'origin\', this.value)">' + _originOptions(_filters.origin) + '</select></div>') +
      '</div>' +
      (hasFilters ? '<div class="clientes-filter-actions"><button type="button" class="clientes-clear" onclick="Modules.Clientes._clearFilters()">Limpar filtros</button></div>' : '') +
    '</div>';
  }

  function _list(data, total, start, end, page, totalPages, perPage) {
    if (!data.length) {
      return '<section class="clientes-table-card"><div class="clientes-empty">' +
        '<div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum cliente encontrado</div>' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Tente ajustar a busca ou os filtros.</div>' +
      '</div></section>';
    }
    var pageOptions = [10, 25, 50].map(function (n) {
      return '<option value="' + n + '"' + (Number(perPage) === n ? ' selected' : '') + '>' + n + ' / pág.</option>';
    }).join('');
    return '<section style="display:flex;flex-direction:column;gap:10px;">' +
      '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Clientes cadastrados</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Consulte contatos, relacionamento e histórico de compra.</div></div>' +
      '<div class="clientes-table-card">' +
        '<div class="clientes-table-wrap">' +
          '<table class="bf-table clientes-table">' +
            '<thead><tr>' +
              '<th>Cliente</th>' +
              '<th>Contato</th>' +
              '<th>Segmento</th>' +
              '<th>Pedidos</th>' +
              '<th>Total</th>' +
              '<th>Ações</th>' +
            '</tr></thead>' +
            '<tbody>' + data.map(_rowHTML).join('') + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
          '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + total + '</strong></span>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
            '<select onchange="Modules.Clientes._setPageSize(this.value)" class="clientes-page-select">' + pageOptions + '</select>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<button type="button" class="clientes-page-btn" onclick="Modules.Clientes._setPage(' + (page - 1) + ')" style="cursor:' + (page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (page > 1 ? '1' : '.45') + ';"' + (page > 1 ? '' : ' disabled') + '>Anterior</button>' +
              '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + totalPages + '</span></div>' +
              '<button type="button" class="clientes-page-btn" onclick="Modules.Clientes._setPage(' + (page + 1) + ')" style="cursor:' + (page < totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (page < totalPages ? '1' : '.45') + ';"' + (page < totalPages ? '' : ' disabled') + '>Próxima</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function _rowHTML(c) {
    var s = c._stats;
    var wa = _whatsUrl(c.phone, 'Hola ' + (c.name || '') + ', ¿todo bien?');
    var contact = _contactHTML(c, 'Hola ' + (c.name || '') + ', ¿todo bien?');
    var address = _clientAddress(c);
    return '<tr onclick="Modules.Clientes._openProfile(\'' + _clienteRecordId(c) + '\')">' +
      '<td style="min-width:280px;">' +
        '<div style="display:flex;align-items:center;gap:12px;min-width:0;">' +
          _avatarHTML(c, 48, 12, 16) +
          '<div style="min-width:0;flex:1;">' +
            '<div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(c.name || 'Cliente') + '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">' + _tags(c.tags).map(function (t) { return UI.badge(t, 'gray'); }).join('') + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="min-width:220px;">' +
        '<div style="font-size:12px;color:#6F6860;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (contact || 'Sem contato') + '</div>' +
        '<div style="font-size:12px;color:#A39B90;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">' + _esc(address || 'Sem endereço') + '</div>' +
      '</td>' +
      '<td>' + _segmentBadge(s.segment) + '<div style="margin-top:6px;">' + _statusBadge(c.status) + '</div></td>' +
      '<td style="white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + (s.ordersCount || 0) + '<div style="font-size:12px;color:#6F6860;font-weight:500;margin-top:2px;">Ticket ' + (s.ordersCount ? UI.fmt(s.avgTicket) : '-') + '</div></td>' +
      '<td style="white-space:nowrap;font-size:14px;font-weight:600;color:#1F1F1F;">' + (s.ordersCount ? UI.fmt(s.totalSpent) : '-') + '</td>' +
      '<td style="text-align:right;white-space:nowrap;" onclick="event.stopPropagation();">' +
        '<div style="display:inline-flex;align-items:center;gap:6px;">' +
          (c.phone ? '<a href="' + wa + '" target="_blank" style="' + _iconBtn('#fff', '#6F6860') + '" title="WhatsApp"><span class="mi" style="font-size:14px;">chat</span></a>' : '') +
          '<button type="button" onclick="Modules.Clientes._openHistory(\'' + _clienteRecordId(c) + '\')" style="' + _iconBtn('#fff', '#6F6860') + '" title="Histórico"><span class="mi" style="font-size:14px;">history</span></button>' +
          '<button type="button" onclick="Modules.Clientes._openModal(\'' + _clienteRecordId(c) + '\')" style="' + _iconBtn('#fff', '#6F6860') + '" title="Editar"><span class="mi" style="font-size:14px;">edit</span></button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  function _openModal(id) {
    _editingId = id;
    var _tenantFc = window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES';
    var _defaultCountry = _tenantFc === 'PT' ? 'Portugal' : 'España';
    var c = id ? (_findClienteByRecordId(id) || {}) : { status: 'ativo', origin: _defaultChannel(), acceptsMarketing: false, country: _defaultCountry };
    _editingId = id ? _clienteRecordId(c) || String(id || '') : null;
    _clienteDeliveryAddresses = _normalizeClienteAddresses(c);
    _clienteAddressFormOpen = false;
    _clienteAddressEditIndex = -1;
    var clientFiscal = _ensureClientFiscal(c);
    var _cliCountry = c.country || _defaultCountry;
    var _cliCode = window.FiscalConfig ? FiscalConfig.countryToCode(_cliCountry) : null;
    var _cliNifCfg = window.FiscalConfig ? FiscalConfig.get(_cliCode || _cliCountry || 'ES')
      : { fiscalDocumentLabel: 'NIF / CIF', fiscalDocumentPlaceholder: '', fiscalDocumentHint: '', regionLabel: 'Estado / Província' };
    var selectedChannel = c.mainChannel || c.channelName || c.channel || c.origin || _defaultChannel();
    var modalCss = '<style>' +
      '.cliente-modal-body{display:flex;flex-direction:column;gap:12px;font-family:Manrope,Inter,sans-serif;}' +
      '.cliente-modal-body .bf-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%)!important;border:1px solid #EADFD8!important;border-radius:18px!important;padding:14px!important;box-shadow:0 10px 24px rgba(31,31,31,.04)!important;min-width:0!important;}' +
      '.cliente-card-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:12px;}' +
      '.cliente-card-head .mi{font-size:18px;color:#6F6860;line-height:1.2;}' +
      '.cliente-card-title{font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:3px;}' +
      '.cliente-card-hint{font-size:12px;color:#8A7E7C;line-height:1.4;margin:0;}' +
      '.cliente-modal-body .bf-field label{font-size:11px!important;font-weight:650!important;color:#8A7E7C!important;display:block!important;margin-bottom:5px!important;letter-spacing:.02em!important;text-transform:none!important;}' +
      '.cliente-modal-body .bf-input,.cliente-modal-body .bf-select,.cliente-modal-body .bf-textarea{width:100%!important;min-height:36px!important;border:1px solid #E8DCD7!important;border-radius:12px!important;padding:0 12px!important;font-size:14px!important;font-family:inherit!important;outline:none!important;background:#FFFCF8!important;color:#1F1F1F!important;box-shadow:none!important;box-sizing:border-box!important;}' +
      '.cliente-modal-body .bf-input:focus,.cliente-modal-body .bf-select:focus,.cliente-modal-body .bf-textarea:focus{background:#fff!important;border-color:#D9AAA1!important;box-shadow:0 0 0 3px rgba(180,35,24,.08)!important;}' +
      '.cliente-modal-body .bf-select{padding-right:42px!important;appearance:none!important;-webkit-appearance:none!important;-moz-appearance:none!important;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E)!important;background-repeat:no-repeat!important;background-position:right 16px center!important;background-size:14px!important;}' +
      '.cliente-modal-body .bf-textarea{min-height:74px!important;padding-top:8px!important;padding-bottom:8px!important;resize:vertical!important;}' +
      '.cliente-avatar-box{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;margin-bottom:12px;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:10px 12px;}' +
      '.cliente-avatar-preview{width:58px;height:58px;border-radius:50%;background:transparent;border:1px solid #EEE6E4;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#6F6860;box-shadow:0 8px 18px rgba(31,31,31,.035);}' +
      '.cliente-avatar-preview img{width:100%;height:100%;object-fit:contain;display:block;}' +
      '.cliente-avatar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:7px;}' +
      '.cliente-avatar-btn{height:34px;padding:0 11px;border-radius:10px;border:1px solid #E8DCD7;background:#fff;color:#1F1F1F;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}' +
      '.cliente-address-list{display:flex;flex-direction:column;gap:8px;}' +
      '.cliente-address-card{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:11px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;}' +
      '.cliente-address-name{font-size:13px;font-weight:750;color:#1F1F1F;line-height:1.25;margin-bottom:3px;}' +
      '.cliente-address-text{font-size:12px;color:#6F6860;line-height:1.35;overflow-wrap:anywhere;}' +
      '.cliente-address-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;}' +
      '.cliente-address-mini{height:30px;padding:0 9px;border-radius:9px;border:1px solid #E8DCD7;background:#fff;color:#6F6860;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}' +
      '.cliente-address-add{height:34px;padding:0 11px;border-radius:10px;border:1px solid #E8DCD7;background:#fff;color:#1F1F1F;font-size:12px;font-weight:650;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}' +
      '.cliente-address-form{margin-top:12px;background:#fff;border:1px solid #EADFD8;border-radius:16px;padding:13px;box-shadow:0 8px 18px rgba(31,31,31,.035);}' +
      '.cliente-address-form-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px 12px;align-items:end;}' +
      '.cliente-address-form-grid .wide{grid-column:span 2;}' +
      '.cliente-phone-box{display:grid;grid-template-columns:88px minmax(0,1fr);gap:8px;align-items:center;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.cliente-phone-box:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.cliente-phone-box select,.cliente-phone-box input{width:100%;min-height:34px;border:0;background:transparent;box-shadow:none;border-radius:8px;padding:0 8px;font-size:14px;font-family:inherit;color:#1F1F1F;outline:none;box-sizing:border-box;}' +
      '.cliente-phone-box select{border-right:1px solid #E8DCD7;border-radius:8px 0 0 8px;padding-right:22px;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 6px center;background-size:13px;}' +
      '@media(max-width:920px){.cliente-modal-body [style*="grid-template-columns"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}' +
      '@media(max-width:640px){.cliente-modal-body [style*="grid-template-columns"],.cliente-address-form-grid{grid-template-columns:1fr!important;}.cliente-address-form-grid .wide{grid-column:auto;}.cliente-modal-body .bf-card{padding:13px!important;}.cliente-avatar-box{grid-template-columns:auto minmax(0,1fr);}.cliente-address-card{grid-template-columns:1fr;}.cliente-address-actions{justify-content:flex-start;}.cliente-phone-box{grid-template-columns:86px minmax(0,1fr);}}' +
      '</style>';
    var avatarUrl = c.avatarUrl || c.photoURL || c.photoUrl || '';
    var phoneParts = _clientPhoneParts(c.phone || c.whatsapp || '');
    var body = modalCss + _clientePostalDatalistHTML() + '<div class="cliente-modal-body">' +
      '<div class="bf-card" style="padding:16px;">' +
      '<div class="cliente-card-head"><span class="mi">person</span><div><div class="cliente-card-title">Dados do cliente</div><p class="cliente-card-hint">Identifique a cliente e mantenha os principais contatos atualizados.</p></div></div>' +
      '<div class="cliente-avatar-box">' +
        '<div id="cli-avatar-preview" class="cliente-avatar-preview">' + (avatarUrl ? '<img src="' + _esc(avatarUrl) + '" alt="">' : '<span class="mi" style="font-size:25px;">person</span>') + '</div>' +
        '<div style="min-width:0;">' +
          '<div style="font-size:12px;font-weight:700;color:#1F1F1F;line-height:1.25;">Avatar do cliente</div>' +
          '<div style="font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Imagem quadrada, em JPG, PNG ou WebP.</div>' +
          '<div class="cliente-avatar-actions">' +
            '<button type="button" class="cliente-avatar-btn" onclick="document.getElementById(\'cli-avatar-file\').click()"><span class="mi" style="font-size:15px;">upload</span>Trocar imagem</button>' +
            '<button type="button" class="cliente-avatar-btn" onclick="Modules.Clientes._clearClienteAvatarImage()"><span class="mi" style="font-size:15px;">delete</span>Remover</button>' +
          '</div>' +
        '</div>' +
        '<input id="cli-avatar-file" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Clientes._uploadClienteAvatarImage(event)" style="display:none;">' +
        '<input id="cli-avatar-url" type="hidden" value="' + _esc(avatarUrl) + '">' +
        '<input id="cli-avatar-storage" type="hidden" value="' + _esc(c.avatarStoragePath || c.avatarImagePath || '') + '">' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1.3fr .8fr .9fr;gap:12px;margin-bottom:12px;">' +
      _field('cli-name', 'Nome completo *', c.name || '') +
      _phoneField('cli-phone-prefix', 'cli-phone-number', 'Telefone / WhatsApp', phoneParts) +
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
      (id ? _clientSegmentationCardHTML(c, true) : '') +
      '<div class="bf-card" style="padding:16px;">' +
      '<div class="cliente-card-head"><span class="mi">location_on</span><div><div class="cliente-card-title">Endereço e entrega</div><p class="cliente-card-hint">Dados usados para localizar a cliente e organizar próximas entregas.</p></div></div>' +
      '<div id="cli-address-book">' + _clienteAddressesBookHTML() + '</div>' +
      '</div>' +
      '<details class="bf-card" style="padding:16px;">' +
      '<summary style="cursor:pointer;list-style:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
      '<div class="cliente-card-head" style="margin-bottom:0;"><span class="mi">request_quote</span><div><div class="cliente-card-title">Dados fiscais</div><p class="cliente-card-hint">Use quando o cliente precisar de dados completos para faturação.</p></div></div>' +
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
      '<div class="cliente-card-head"><span class="mi">campaign</span><div><div class="cliente-card-title">Marketing e relacionamento</div><p class="cliente-card-hint">Organize preferências, tags e permissões para futuras ações.</p></div></div>' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#1F1F1F;margin-bottom:12px;"><input id="cli-marketing" type="checkbox" ' + (c.acceptsMarketing ? 'checked' : '') + ' style="accent-color:#B42318;width:16px;height:16px;"> Aceita receber promoções</label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      _field('cli-tags', 'Tags', _tags(c.tags).join(', ')) +
      _field('cli-preferences', 'Preferências', c.preferences || '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:12px;margin-top:12px;">' +
      _field('cli-allergies', 'Alergias / restrições', c.allergies || '') +
      '</div></div>' +
      '<div class="bf-card" style="padding:16px;">' +
      '<div class="cliente-card-head"><span class="mi">notes</span><div><div class="cliente-card-title">Observações internas</div></div></div>' +
      _textarea('cli-notes', 'Observações internas', c.notes || c.internalNotes || '') +
      '</div></div>';
    var footer = '<div style="display:flex;align-items:center;gap:10px;justify-content:space-between;width:100%;font-family:Manrope,Inter,sans-serif;flex-wrap:wrap;">' +
      '<div style="font-size:12px;color:#7A746B;line-height:1.4;">Revise os dados antes de salvar.</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
      (_editingId ? '<button class="bf-btn bf-btn-secondary" onclick="Modules.Clientes._deleteCliente(\'' + _editingId + '\')" style="height:40px;padding:0 13px;color:#B42318;font-size:13px;font-weight:600;"><span class="mi" style="font-size:16px;">delete</span>Excluir</button>' : '') +
      '<button class="bf-btn bf-btn-secondary" onclick="if(window._clienteModal)window._clienteModal.close()" style="height:40px;padding:0 14px;font-size:13px;font-weight:600;">Cancelar</button>' +
      '<button class="bf-btn bf-btn-primary" onclick="Modules.Clientes._saveCliente()" style="height:40px;padding:0 16px;font-size:13px;font-weight:600;min-width:auto;flex:0 0 auto;">' + (id ? 'Atualizar cliente' : 'Adicionar cliente') + '</button>' +
      '</div>' +
      '</div>';
    window._clienteModal = UI.modal({ title: id ? 'Editar Cliente' : 'Novo Cliente', body: body, footer: footer, maxWidth: '1120px' });
    setTimeout(_initClientePlaces, 200);
  }

  function _saveCliente() {
    var name = _val('cli-name').trim();
    if (!name) { UI.toast('Nome é obrigatório', 'error'); return; }
    var phone = _clientPhoneFull(_val('cli-phone-prefix'), _val('cli-phone-number'));
    if (!_validPhone(phone)) { UI.toast('Telefone inválido. Use apenas números com DDD/código do país.', 'error'); return; }
    if (!_validEmail(_val('cli-email'))) { UI.toast('E-mail inválido', 'error'); return; }
    var current = _editingId ? (_findClienteByRecordId(_editingId) || {}) : {};
    var channel = _val('cli-origin') || _defaultChannel();
    var deliveryAddresses = _normalizeClienteAddresses({ deliveryAddresses: _clienteDeliveryAddresses });
    var primaryAddress = deliveryAddresses[0] || {};
    var hasDeliveryAddress = !!String([
      primaryAddress.address,
      primaryAddress.number,
      primaryAddress.complement,
      primaryAddress.neighborhood,
      primaryAddress.city,
      primaryAddress.province,
      primaryAddress.country
    ].filter(Boolean).join('')).trim();
    if (hasDeliveryAddress && !String(primaryAddress.postalCode || '').trim()) {
      UI.toast('Informe a caixa postal do cliente antes de salvar.', 'error'); return;
    }
    var _sCountry = primaryAddress.country || _val('cli-country') || 'España';
    var _sCode = window.FiscalConfig ? FiscalConfig.countryToCode(_sCountry) : null;
    var _sNifCfg = window.FiscalConfig ? FiscalConfig.get(_sCode || _sCountry || 'ES') : null;
    var _nifRaw = (_val('cli-fiscal') || '').trim().toUpperCase().replace(/[\s.-]/g, '');
    var _nifOk = !_nifRaw || (_sNifCfg ? _sNifCfg.validateNif(_nifRaw) : _validFiscalId(_val('cli-fiscal')));
    if (!_nifOk) { UI.toast((_sNifCfg && _sNifCfg.nifErrorMsg) || 'Documento fiscal inválido.', 'error'); return; }
    var _fiscalCountryCode = _countryIso(_val('cli-fiscal-country-code') || _sCountry || 'ES');
    var _structuredFiscalRaw = (_val('cli-fiscal-id-structured') || '').trim().toUpperCase().replace(/[\s.-]/g, '');
    var _structuredFiscalCfg = window.FiscalConfig ? FiscalConfig.get(_fiscalCountryCode || 'ES') : null;
    var _structuredFiscalOk = !_structuredFiscalRaw || (_structuredFiscalCfg ? _structuredFiscalCfg.validateNif(_structuredFiscalRaw) : _validFiscalId(_val('cli-fiscal-id-structured')));
    if (!_structuredFiscalOk) { UI.toast((_structuredFiscalCfg && _structuredFiscalCfg.nifErrorMsg) || 'Documento fiscal inválido.', 'error'); return; }
    if (!_validEmail(_val('cli-fiscal-invoice-email'))) { UI.toast('E-mail de faturação inválido', 'error'); return; }
    if (!_validPostalCode(_val('cli-fiscal-postal'), _fiscalCountryCode)) {
      UI.toast(_postalErrorMessage(_fiscalCountryCode), 'error'); return;
    }
    if (!_validPostalCode(primaryAddress.postalCode || _val('cli-zip'), _sCountry)) {
      UI.toast(_postalErrorMessage(_sCountry), 'error'); return;
    }
    var fiscal = _ensureClientFiscal(current);
    fiscal.customerType = _val('cli-fiscal-customer-type') || fiscal.customerType || 'person';
    fiscal.legalName = _val('cli-fiscal-legal-name');
    fiscal.commercialName = _val('cli-fiscal-commercial-name');
    fiscal.documentType = _val('cli-fiscal-doc-type');
    fiscal.fiscalId = _val('cli-fiscal-id-structured') || _val('cli-fiscal');
    fiscal.countryCode = _countryIso(_val('cli-fiscal-country-code') || _val('cli-country') || fiscal.countryCode);
    fiscal.invoiceEmail = _val('cli-fiscal-invoice-email') || _val('cli-email');
    fiscal.fiscalAddress = {
      address: _val('cli-fiscal-address') || primaryAddress.address || '',
      number: _val('cli-fiscal-number') || primaryAddress.number || '',
      complement: _val('cli-fiscal-complement') || primaryAddress.complement || '',
      city: _val('cli-fiscal-city'),
      province: _val('cli-fiscal-province') || primaryAddress.province || '',
      postalCode: _val('cli-fiscal-postal') || primaryAddress.postalCode || '',
      countryCode: fiscal.countryCode || 'ES'
    };
    var phoneKey = _phoneMatchKey(phone);
    var data = {
      name: name,
      phone: phone,
      whatsapp: phone,
      phoneNormalized: phoneKey,
      whatsappNormalized: phoneKey,
      phoneDigits: phoneKey,
      whatsappDigits: phoneKey,
      email: _val('cli-email'),
      status: _val('cli-status') || 'ativo',
      origin: channel,
      mainChannel: channel,
      channelName: channel,
      nifCif: _val('cli-fiscal'),
      fiscalId: _val('cli-fiscal'),
      birthday: _val('cli-bday'),
      avatarUrl: _val('cli-avatar-url'),
      avatarStoragePath: _val('cli-avatar-storage'),
      avatarImagePath: _val('cli-avatar-storage'),
      address: primaryAddress.address || '',
      number: primaryAddress.number || '',
      numero: primaryAddress.number || '',
      neighborhood: primaryAddress.neighborhood || '',
      zone: primaryAddress.neighborhood || '',
      postalCode: primaryAddress.postalCode || '',
      state: primaryAddress.province || '',
      province: primaryAddress.province || '',
      country: primaryAddress.country || _defaultCountry,
      reference: primaryAddress.complement || '',
      deliveryAddresses: deliveryAddresses,
      savedDeliveryAddresses: deliveryAddresses,
      acceptsMarketing: _checked('cli-marketing'),
      tags: _tags(_val('cli-tags')),
      preferences: _val('cli-preferences'),
      allergies: _val('cli-allergies'),
      points: current.points != null ? current.points : (current.pointsBalance != null ? current.pointsBalance : 0),
      pointsBalance: current.pointsBalance != null ? current.pointsBalance : (current.points != null ? current.points : 0),
      notes: _val('cli-notes'),
      ordersCount: current.ordersCount || 0,
      totalSpent: current.totalSpent || 0,
      fiscal: fiscal
    };
    var editingId = _clienteRecordId(current) || String(_editingId || '');
    var op = editingId ? DB.update('store_customers', editingId, data).then(function () { return editingId; }) : DB.add('store_customers', data).then(function (ref) { return ref && ref.id ? ref.id : ref; });
    op.then(function (savedId) {
      _rememberPostalCode(primaryAddress.postalCode || _val('cli-zip'), {
        source: 'customer',
        city: primaryAddress.city || '',
        province: primaryAddress.province || '',
        country: primaryAddress.country || _defaultCountry,
        neighborhood: primaryAddress.neighborhood || ''
      });
      _rememberPostalCode(fiscal.fiscalAddress && fiscal.fiscalAddress.postalCode, {
        source: 'customer_fiscal',
        city: fiscal.fiscalAddress && fiscal.fiscalAddress.city || '',
        province: fiscal.fiscalAddress && fiscal.fiscalAddress.province || '',
        country: fiscal.fiscalAddress && fiscal.fiscalAddress.countryCode || _defaultCountry
      });
      UI.toast(_editingId ? 'Cliente atualizado!' : 'Cliente adicionado!', 'success');
      if (window._clienteModal) window._clienteModal.close();
      if (savedId) _editingId = String(savedId || '');
      _load();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _uploadClienteAvatarImage(event) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    if (!window.ImageTools || !ImageTools.process) {
      UI.toast('Upload de imagem indisponível no momento.', 'error');
      if (event && event.target) event.target.value = '';
      return;
    }
    var entityId = 'cliente-avatar-' + (_editingId || Date.now().toString(36));
    ImageTools.process(file, { kind: 'logo', folder: 'logos', entityId: entityId }).then(function (result) {
      var url = result && (result.imageUrl || result.mainUrl) || '';
      var path = result && (result.imageStoragePath || result.imagePath) || '';
      var urlField = document.getElementById('cli-avatar-url');
      var pathField = document.getElementById('cli-avatar-storage');
      var preview = document.getElementById('cli-avatar-preview');
      if (urlField) urlField.value = url;
      if (pathField) pathField.value = path;
      if (preview) preview.innerHTML = url ? '<img src="' + _esc(url) + '" alt="">' : '<span class="mi" style="font-size:25px;">person</span>';
      _persistClienteAvatar(url, path);
    }).catch(function (err) {
      console.error('Upload de avatar do cliente', err);
      UI.toast(err && err.message ? err.message : 'Erro ao enviar avatar.', 'error');
      if (event && event.target) event.target.value = '';
    });
  }

  function _clearClienteAvatarImage() {
    var urlField = document.getElementById('cli-avatar-url');
    var pathField = document.getElementById('cli-avatar-storage');
    var fileField = document.getElementById('cli-avatar-file');
    var preview = document.getElementById('cli-avatar-preview');
    if (urlField) urlField.value = '';
    if (pathField) pathField.value = '';
    if (fileField) fileField.value = '';
    if (preview) preview.innerHTML = '<span class="mi" style="font-size:25px;">person</span>';
    _persistClienteAvatar('', '');
  }

  function _persistClienteAvatar(url, path) {
    if (_editingId) {
      _syncClienteAvatarLocal(_editingId, url, path);
      _paint();
      DB.update('store_customers', _editingId, {
        avatarUrl: url || '',
        avatarStoragePath: path || '',
        avatarImagePath: path || ''
      }).then(function () {
        UI.toast(url ? 'Avatar atualizado.' : 'Avatar removido.', 'success');
      }).catch(function (err) {
        UI.toast('Erro ao salvar avatar: ' + err.message, 'error');
      });
      return;
    }
    UI.toast(url ? 'Avatar atualizado. Salve o cliente para concluir.' : 'Avatar removido.', 'success');
  }

  function _syncClienteAvatarLocal(id, url, path) {
    [_clientes, _view].forEach(function (list) {
      (list || []).forEach(function (item) {
        if (item && _clienteRecordId(item) === String(id || '')) {
          item.avatarUrl = url || '';
          item.avatarStoragePath = path || '';
          item.avatarImagePath = path || '';
        }
      });
    });
  }

  function _openProfile(id) {
    var c = _view.find(function (x) { return _clienteRecordId(x) === String(id || ''); });
    if (!c) return;
    var s = c._stats;
    var contact = _contactHTML(c, 'Hola ' + (c.name || '') + ', tenemos una novedad para ti.');
    var address = _clientAddress(c);
    var profileCss = '<style>' +
      '.cliente-profile-body{display:flex;flex-direction:column;gap:12px;font-family:Manrope,Inter,sans-serif;}' +
      '.cliente-profile-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:14px;box-shadow:0 10px 24px rgba(31,31,31,.04);min-width:0;}' +
      '.cliente-profile-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:12px;}' +
      '.cliente-profile-head .mi{font-size:18px;color:#6F6860;line-height:1.2;}' +
      '.cliente-profile-title{font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:3px;}' +
      '.cliente-profile-hint{font-size:12px;color:#8A7E7C;line-height:1.4;margin:0;}' +
      '.cliente-profile-grid{display:grid;gap:11px 12px;align-items:start;min-width:0;}' +
      '.cliente-profile-top{grid-template-columns:auto minmax(0,1fr) auto;align-items:center;}' +
      '.cliente-profile-metrics{grid-template-columns:repeat(4,minmax(0,1fr));}' +
      '.cliente-profile-two{grid-template-columns:minmax(0,1.1fr) minmax(260px,.78fr);}' +
      '.cliente-profile-avatar{width:58px;height:58px;border-radius:50%;background:transparent;color:#fff;font-size:20px;font-weight:750;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(31,31,31,.06);overflow:hidden;}' +
      '.cliente-profile-avatar img{width:100%;height:100%;object-fit:contain;display:block;}' +
      '.cliente-profile-metric{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:13px;padding:10px 11px;min-width:0;}' +
      '.cliente-profile-metric span{font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;display:block;margin-bottom:5px;}' +
      '.cliente-profile-metric strong{font-size:15px;font-weight:750;color:#1F1F1F;line-height:1.15;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.cliente-profile-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;}' +
      '.cliente-profile-info-row{padding:8px 0;border-top:1px solid #F2EDED;min-width:0;}' +
      '.cliente-profile-info-row div:first-child{font-size:10px;font-weight:700;color:#8A7E7C;text-transform:uppercase;letter-spacing:.03em;margin-bottom:3px;}' +
      '.cliente-profile-info-row div:last-child{font-size:13px;font-weight:600;color:#1F1F1F;line-height:1.35;overflow-wrap:anywhere;}' +
      '@media(max-width:760px){.cliente-profile-top,.cliente-profile-metrics,.cliente-profile-two,.cliente-profile-info{grid-template-columns:1fr}.cliente-profile-top{align-items:start}.cliente-profile-avatar{width:54px;height:54px}}' +
      '</style>';
    var body = profileCss + '<div class="cliente-profile-body">' +
      '<section class="cliente-profile-card">' +
        '<div class="cliente-profile-grid cliente-profile-top">' +
          _profileAvatarHTML(c) +
          '<div style="min-width:0;">' +
            '<h2 style="font-size:22px;font-weight:750;margin:0 0 5px;color:#1F1F1F;line-height:1.12;overflow-wrap:anywhere;">' + _esc(c.name || 'Cliente') + '</h2>' +
            '<div style="color:#6F6860;font-size:13px;line-height:1.35;">' + (contact || 'Sem contato') + '</div>' +
            (address ? '<div style="color:#6F6860;font-size:12px;margin-top:4px;line-height:1.35;"><span class="mi" style="font-size:15px;color:#B42318;vertical-align:-3px;">location_on</span> ' + _esc(address) + '</div>' : '') +
          '</div>' +
          '<button class="bf-btn bf-btn-primary" onclick="Modules.Clientes._openModal(\'' + _clienteRecordId(c) + '\')" style="min-width:150px;height:38px;border-radius:10px;font-size:13px;font-weight:600;">Editar</button>' +
        '</div>' +
      '</section>' +
      '<section class="cliente-profile-grid cliente-profile-metrics">' +
        _profileMetric('Pedidos', s.ordersCount, 'histórico') +
        _profileMetric('Total comprado', s.ordersCount ? UI.fmt(s.totalSpent) : '-', 'todos os pedidos') +
        _profileMetric('Ticket médio', s.ordersCount ? UI.fmt(s.avgTicket) : '-', 'por pedido') +
        _profileMetric('Último pedido', s.lastOrderLabel || '-', s.segmentLabel) +
      '</section>' +
      _clientSegmentationCardHTML(c, false) +
      '<section class="cliente-profile-grid cliente-profile-two">' +
        '<div class="cliente-profile-card"><div class="cliente-profile-head"><span class="mi">badge</span><div><div class="cliente-profile-title">Perfil</div><p class="cliente-profile-hint">Dados principais usados no atendimento e relacionamento.</p></div></div>' +
          '<div class="cliente-profile-info">' +
            _profileInfo('Canal principal', c.mainChannel || c.channelName || c.channel || c.origin || '-') +
            _profileInfo('Status', c.status || s.segmentLabel) +
            _profileInfo('NIF / CIF', c.nifCif || c.fiscalId || '-') +
            _profileInfoHTML('Telefone / WhatsApp', c.phone ? _phoneLink(c, 'Hola ' + (c.name || '') + ', tenemos una novedad para ti.') : '-') +
            _profileInfoHTML('Endereços de entrega', _profileAddressesHTML(c)) +
            _profileInfo('Preferências', c.preferences || '-') +
            _profileInfo('Alergias', c.allergies || '-') +
          '</div>' +
        '</div>' +
        '<div class="cliente-profile-card"><div class="cliente-profile-head"><span class="mi">bolt</span><div><div class="cliente-profile-title">Ações rápidas</div><p class="cliente-profile-hint">Atalhos para atendimento e leitura do relacionamento.</p></div></div>' +
          (c.phone ? '<a href="' + _whatsUrl(c.phone, 'Hola ' + (c.name || '') + ', tenemos una novedad para ti.') + '" target="_blank" style="' + _actionLink('#E9F8EF', '#1A9E5A') + '"><span class="mi">chat</span> Abrir WhatsApp</a>' : '') +
          '<button onclick="Modules.Clientes._openHistory(\'' + _clienteRecordId(c) + '\')" style="' + _actionButton('#EEF4FF', '#2563EB') + '"><span class="mi">history</span> Ver histórico</button>' +
          '<button onclick="Modules.Clientes._openSegmentFlow(\'' + _clienteRecordId(c) + '\')" style="' + _actionButton('#FFF8F1', '#B45309') + '"><span class="mi">timeline</span> Ver fluxo do segmento</button>' +
        '</div>' +
      '</section>' +
      _pointsHistoryHTML(c) +
      _topProductsHTML(s.topProducts) +
      _reviewsHTML(c) +
      '</div>';
    UI.modal({ title: 'Cliente', body: body, maxWidth: '900px' });
  }

  function _openHistory(id) {
    var c = _view.find(function (x) { return _clienteRecordId(x) === String(id || ''); });
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
    var c = _view.find(function (x) { return _clienteRecordId(x) === String(id || ''); }) || _findClienteByRecordId(id);
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
      _ruleRow('Sem segunda compra', '1 pedido e 14+ dias sem voltar') +
      _ruleRow('Com pontos', 'saldo de pontos positivo') +
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
    _page.page = 1;
    _paint();
  }

  function _clearFilters() {
    _filters = { q: '', status: '', segment: '', origin: '' };
    _page.page = 1;
    _paint();
  }

  function _setPage(page) {
    _page.page = Math.max(1, parseInt(page, 10) || 1);
    _paint();
  }

  function _setPageSize(size) {
    _page.perPage = parseInt(size, 10) || 10;
    _page.page = 1;
    _paint();
  }

  function _filtered() {
    var q = (_filters.q || '').toLowerCase();
    var qDigits = _phone(q);
    return _view.filter(function (c) {
      var s = c._stats || {};
      var haystack = [c.name, c.customerName, c.phone, c.whatsapp, c.customerPhone, c.telefone, c.phoneNormalized, c.whatsappNormalized, c.phoneDigits, c.whatsappDigits, c.email, c.customerEmail, c.nifCif, c.fiscalId, c.neighborhood, c.zone, c.postalCode, c.state, c.province, c.country, c.origin, c.mainChannel, c.channelName, c.channel, c.status, _tags(c.tags).join(' '), c.preferences, c.allergies].join(' ').toLowerCase();
      var phoneHaystack = _phone([c.phone, c.whatsapp, c.customerPhone, c.telefone, c.phoneNormalized, c.whatsappNormalized, c.phoneDigits, c.whatsappDigits].join(' '));
      if (q && haystack.indexOf(q) < 0 && (!qDigits || phoneHaystack.indexOf(qDigits) < 0)) return false;
      if (_filters.status && String(c.status || s.segment) !== _filters.status) return false;
      if (_filters.segment && s.segment !== _filters.segment && !(s.actionSegments || []).some(function (item) { return item.id === _filters.segment; })) return false;
      if (_filters.origin && String(c.mainChannel || c.channelName || c.channel || c.origin || '') !== _filters.origin) return false;
      return true;
    });
  }

  function _ordersForClient(c) {
    var id = _clienteRecordId(c);
    var name = _clean(c.name);
    var phone = _phone(c.phone);
    var email = _clean(c.email);
    return (_orders || []).filter(function (o) {
      if (id && String(o.customerId || o.clientId || o.customerUid || '') === id) return true;
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
    var recurrenceValid = valid.filter(function (o) { return !_orderChannelHasImportModel(o); });
    var total = valid.reduce(function (s, o) { return s + _num(o.total || o.amount || o.grandTotal); }, 0);
    var count = valid.length;
    var recurrenceCount = recurrenceValid.length;
    var last = valid[0] || null;
    var days = last ? Math.floor((Date.now() - _dateTs(last)) / 86400000) : null;
    var freq = {};
    var channelFreq = {};
    var channelRevenue = {};
    valid.forEach(function (o) {
      var channel = o.channel || o.source || o.origin || o.salesChannel || o.canal || c.mainChannel || c.channelName || c.channel || c.origin || '';
      if (channel) {
        channelFreq[channel] = (channelFreq[channel] || 0) + 1;
        channelRevenue[channel] = (channelRevenue[channel] || 0) + _num(o.total || o.amount || o.grandTotal);
      }
      (o.items || []).forEach(function (item) {
        var name = item.name || item.nome || item.title || 'Produto';
        freq[name] = (freq[name] || 0) + (_num(item.qty || item.quantity) || 1);
      });
    });
    var topProducts = Object.keys(freq).map(function (k) { return [k, freq[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    var topChannels = Object.keys(channelFreq).map(function (k) { return { channel: k, count: channelFreq[k], revenue: channelRevenue[k] || 0 }; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 3);
    var segment = 'sem_pedido';
    if (String(c.status || '') === 'bloqueado') segment = 'bloqueado';
    else if (!count) segment = 'sem_pedido';
    else if (days !== null && days > 60) segment = 'inativo';
    else if (total >= 100 || count >= 5) segment = 'vip';
    else if (recurrenceCount >= 2) segment = 'recorrente';
    else segment = 'novo';
    var points = _pointsBalance(c);
    var actionSegments = _clientActionSegments(segment, count, days, points);
    return {
      ordersCount: count,
      recurrenceOrdersCount: recurrenceCount,
      totalSpent: total,
      avgTicket: count ? total / count : 0,
      lastOrderTs: last ? _dateTs(last) : 0,
      lastOrderLabel: last ? _fmtDate(last) : '',
      daysSinceLast: days,
      segment: segment,
      segmentLabel: _segmentLabel(segment),
      actionSegments: actionSegments,
      topProducts: topProducts,
      topChannels: topChannels,
      preferredProduct: topProducts[0] && topProducts[0][0] || '',
      preferredChannel: topChannels[0] && topChannels[0].channel || (c.mainChannel || c.channelName || c.channel || c.origin || ''),
      pointsBalance: points,
      recommendedUse: _clientSegmentBestUse(segment, actionSegments, topProducts[0] && topProducts[0][0] || '')
    };
  }

  function _clientActionSegments(segment, ordersCount, daysSinceLast, points) {
    var out = [];
    function add(id, label, reason) { out.push({ id: id, label: label, reason: reason }); }
    if (segment) add(segment, _segmentLabel(segment), _segmentReasonById(segment));
    if (ordersCount === 1 && daysSinceLast !== null && daysSinceLast >= 14) add('sem_segunda_compra', 'Sem segunda compra', 'Fez 1 pedido e ainda não voltou depois de 14 dias.');
    if (_num(points) > 0) add('com_pontos', 'Com pontos', 'Tem saldo de pontos registrado.');
    return out;
  }

  function _segmentReasonById(segment) {
    return ({
      novo: 'Cliente com primeira compra registrada.',
      recorrente: 'Cliente com 2 ou mais pedidos válidos.',
      vip: 'Cliente com maior frequência ou valor acumulado.',
      inativo: 'Cliente sem compra há mais de 60 dias.',
      sem_pedido: 'Cliente cadastrado sem pedido válido.',
      bloqueado: 'Cliente bloqueado no cadastro.'
    })[segment] || 'Segmento calculado automaticamente.';
  }

  function _clientSegmentBestUse(segment, actionSegments, product) {
    var ids = (actionSegments || []).map(function (item) { return item.id; });
    if (ids.indexOf('com_pontos') >= 0) return 'Recompra com pontos';
    if (segment === 'vip') return product ? 'Oferta premium ou combo com ' + product : 'Oferta premium ou combo';
    if (segment === 'inativo') return product ? 'Reativação usando ' + product : 'Reativação';
    if (ids.indexOf('sem_segunda_compra') >= 0) return 'Segunda compra';
    if (segment === 'recorrente') return product ? 'Recompra ou upsell com ' + product : 'Recompra ou upsell';
    if (segment === 'novo') return 'Mensagem de continuidade';
    return 'Criar histórico de compra';
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

  function _clientSegmentationCardHTML(c, compact) {
    c = c || {};
    var orders = c._orders || _ordersForClient(c);
    var s = c._stats || _stats(c, orders);
    var actionSegments = s.actionSegments || [];
    var badges = actionSegments.length ? actionSegments.map(function (item) {
      return _segmentBadge(item.id);
    }).join('') : _segmentBadge(s.segment);
    var topProduct = s.preferredProduct || '-';
    var channel = s.preferredChannel ? _channelLabel(s.preferredChannel) : '-';
    var cardClass = compact ? 'bf-card' : 'cliente-profile-card';
    var style = compact ? 'padding:16px;' : '';
    var headClass = compact ? 'cliente-card-head' : 'cliente-profile-head';
    var titleClass = compact ? 'cliente-card-title' : 'cliente-profile-title';
    var hintClass = compact ? 'cliente-card-hint' : 'cliente-profile-hint';
    return '<div class="' + cardClass + '" style="' + style + '">' +
      '<div class="' + headClass + '"><span class="mi">hub</span><div><div class="' + titleClass + '">Segmentação BocaFood</div><p class="' + hintClass + '">Classificação automática usada por Clientes e Temporadas para escolher públicos de jogadas.</p></div></div>' +
      '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:10px;">' + badges + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;">' +
        _miniMetric('Uso indicado', _esc(s.recommendedUse || '-')) +
        _miniMetric('Produto preferido', _esc(topProduct)) +
        _miniMetric('Canal principal', _esc(channel)) +
        _miniMetric('Pontos', _pointsBalance(c) || '-') +
      '</div>' +
      '<div style="font-size:12px;color:#8A7E7C;line-height:1.45;margin-top:10px;">' + _esc(_segmentReason(c, s)) + '</div>' +
    '</div>';
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
    var id = _clienteRecordId(c);
    var name = _clean(c.name);
    var rows = (_reviews || []).filter(function (r) {
      return (id && String(r.customerId || r.clientId || r.customerUid || '') === id) || (name && _clean(r.customerName || r.name) === name);
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
    return '<option value="">Canal principal</option>' + origins.map(function (o) { return '<option value="' + _esc(o) + '"' + (selected === o ? ' selected' : '') + '>' + _esc(_title(o)) + '</option>'; }).join('');
  }

  function _normalizeCanais(raw) {
    var list = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.list)) list = raw.list;
    else if (raw && Array.isArray(raw.channels)) list = raw.channels;
    else if (raw && Array.isArray(raw.items)) list = raw.items;
    else if (raw && typeof raw === 'object') {
      list = Object.keys(raw).filter(function (key) {
        return ['createdAt', 'updatedAt', 'id'].indexOf(key) < 0;
      }).map(function (key) { return raw[key]; });
    }
    var fixed = [{ name: 'Cardápio' }, { name: 'Venda presencial' }];
    var normalized = [];
    fixed.concat(list || []).forEach(function (c) {
      if (!c || c.active === false || c.enabled === false || c.status === 'inativo') return;
      var name = typeof c === 'string' ? c : (c.name || c.nome || c.label || c.title);
      if (!name) return;
      var channel = typeof c === 'string' ? { name: name } : Object.assign({}, c, { name: name });
      channel.key = _channelKey(channel.key || channel.value || name);
      channel.importModel = _channelImportModel(channel);
      if (normalized.some(function (item) { return item.key === channel.key || _fold(item.name) === _fold(channel.name); })) return;
      normalized.push(channel);
    });
    return normalized;
  }

  function _channelImportModel(channel) {
    return String(channel && (channel.importModel || channel.import_model || channel.orderImportModel || channel.importacaoModelo || channel.modeloImportacao || '') || '').trim();
  }

  function _channelKey(value) {
    var raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    raw = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
    raw = raw.replace(/[\s-]+/g, '_');
    if (['template', 'store', 'loja', 'loja_publica', 'public_store', 'cardapio', 'cardapio_publico'].indexOf(raw) >= 0) return 'cardapio';
    if (['pos', 'tpv', 'venda_presencial', 'balcao', 'balcão'].indexOf(raw) >= 0) return 'venda_presencial';
    if (['manual', 'admin', 'pedido_manual', 'painel'].indexOf(raw) >= 0) return 'pedido_manual';
    if (['whatsapp', 'wpp'].indexOf(raw) >= 0) return 'whatsapp';
    return raw;
  }

  function _orderChannelHasImportModel(order) {
    var key = _channelKey(order && (order.channel || order.source || order.origin || order.salesChannel || order.canal || order.originChannel || order.originSource || ''));
    var label = _fold(order && (order.channelName || order.salesChannelName || ''));
    return (_canais || []).some(function (channel) {
      if (!_channelImportModel(channel) && !channel.marketplace && !channel.isMarketplace && !channel.marketplaceChannel) return false;
      return channel.key === key || _channelKey(channel.name || '') === key || (label && _fold(channel.name || '') === label);
    });
  }

  function _channelNames() {
    var names = (_canais || []).map(function (c) { return c.name || c.nome || c.label; }).filter(Boolean);
    return names.length ? names : ['Cardápio', 'Venda presencial'];
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
  }

  function _initClientePlaces() {
    if (!window.BocaPlaces) return;
    BocaPlaces.init('cli-address', {
      onPlace: function (place) {
        if (!place) return;
        if (place.number) _setClienteField('cli-number', place.number);
        if (place.neighborhood) _setClienteField('cli-hood', place.neighborhood);
        if (place.postalCode) _setClienteField('cli-zip', place.postalCode);
        if (place.city || place.locality) _setClienteField('cli-city', place.city || place.locality);
        if (place.country || place.countryCode) {
          _setClienteCountry(place.country, place.countryCode);
        }
        if (place.province) {
          _setClienteField('cli-state', place.province);
        }
      }
    });
  }

  function _clienteAddressesBookHTML() {
    var addresses = _normalizeClienteAddresses({ deliveryAddresses: _clienteDeliveryAddresses });
    _clienteDeliveryAddresses = addresses;
    var list = addresses.length ? '<div class="cliente-address-list">' + addresses.map(function (addr, idx) {
      return '<div class="cliente-address-card">' +
        '<div style="min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px;">' +
            '<div class="cliente-address-name">' + _esc(addr.label || (idx === 0 ? 'Endereço principal' : 'Endereço ' + (idx + 1))) + '</div>' +
            (idx === 0 ? '<span style="height:22px;padding:0 8px;border-radius:999px;background:#FFF3F0;color:#B42318;font-size:10px;font-weight:750;display:inline-flex;align-items:center;">Principal</span>' : '') +
          '</div>' +
          '<div class="cliente-address-text">' + _esc(_clienteAddressLine(addr) || 'Endereço sem dados completos') + '</div>' +
        '</div>' +
        '<div class="cliente-address-actions">' +
          (idx > 0 ? '<button type="button" class="cliente-address-mini" onclick="Modules.Clientes._setClientePrimaryAddress(' + idx + ')"><span class="mi" style="font-size:14px;">star</span>Principal</button>' : '') +
          '<button type="button" class="cliente-address-mini" onclick="Modules.Clientes._editClienteDeliveryAddress(' + idx + ')"><span class="mi" style="font-size:14px;">edit</span>Editar</button>' +
          '<button type="button" class="cliente-address-mini" onclick="Modules.Clientes._removeClienteDeliveryAddress(' + idx + ')" style="color:#B42318;"><span class="mi" style="font-size:14px;">delete</span>Remover</button>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>' : '<div style="background:#FFFCF8;border:1px dashed #E8DCD7;border-radius:14px;padding:13px;color:#6F6860;font-size:13px;line-height:1.4;">Nenhum endereço de entrega cadastrado.</div>';
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px;">' +
        '<div style="font-size:12px;color:#6F6860;line-height:1.35;">Cadastre os endereços usados para entrega. O primeiro endereço fica como principal e é usado como referência nos pedidos.</div>' +
        '<button type="button" class="cliente-address-add" onclick="Modules.Clientes._newClienteDeliveryAddress()"><span class="mi" style="font-size:15px;">add_location_alt</span>Adicionar endereço</button>' +
      '</div>' +
      list +
      (_clienteAddressFormOpen ? _clienteAddressFormHTML() : '');
  }

  function _clienteAddressFormHTML() {
    var editing = _clienteAddressEditIndex >= 0 ? (_clienteDeliveryAddresses[_clienteAddressEditIndex] || {}) : {};
    return '<div class="cliente-address-form">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">' +
        '<div><div class="cliente-card-title" style="margin-bottom:2px;">' + (_clienteAddressEditIndex >= 0 ? 'Editar endereço' : 'Novo endereço') + '</div><p class="cliente-card-hint">Use a busca da rua para preencher bairro, cidade, província, país e código postal quando disponível.</p></div>' +
        '<button type="button" class="cliente-address-mini" onclick="Modules.Clientes._cancelClienteDeliveryAddress()">Cancelar</button>' +
      '</div>' +
      '<div class="cliente-address-form-grid">' +
        '<div>' + _field('cli-address-label-input', 'Nome do endereço', editing.label || '') + '</div>' +
        '<div class="wide">' + _field('cli-address', 'Rua', editing.address || '') + '</div>' +
        _field('cli-number', 'Número / portal', editing.number || '') +
        _field('cli-reference', 'Piso / referência', editing.complement || '') +
        _field('cli-hood', 'Bairro / zona', editing.neighborhood || '') +
        _field('cli-zip', 'Código postal', editing.postalCode || '') +
        _field('cli-city', 'Localidade', editing.city || '') +
        '<div><label id="cli-state-label" style="' + _label() + '">Província</label><input id="cli-state" type="text" value="' + _esc(editing.province || '') + '" readonly placeholder="Preenchido pelo endereço" style="' + _input() + 'background:#F7F3EF;color:#6F6860;cursor:default;"></div>' +
        '<div><label style="' + _label() + '">País</label><input id="cli-country" type="text" value="' + _esc(editing.country || 'España') + '" readonly placeholder="Preenchido pelo endereço" style="' + _input() + 'background:#F7F3EF;color:#6F6860;cursor:default;"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
        '<button type="button" class="cliente-address-mini" onclick="Modules.Clientes._cancelClienteDeliveryAddress()">Cancelar</button>' +
        '<button type="button" class="clientes-primary" onclick="Modules.Clientes._saveClienteDeliveryAddress()" style="height:36px;box-shadow:0 8px 18px rgba(180,35,24,.14);"><span class="mi" style="font-size:15px;">check</span>Salvar endereço</button>' +
      '</div>' +
    '</div>';
  }

  function _renderClienteAddressesBook() {
    var el = document.getElementById('cli-address-book');
    if (!el) return;
    el.innerHTML = _clienteAddressesBookHTML();
    setTimeout(_initClientePlaces, 80);
  }

  function _newClienteDeliveryAddress() {
    _clienteAddressFormOpen = true;
    _clienteAddressEditIndex = -1;
    _renderClienteAddressesBook();
  }

  function _editClienteDeliveryAddress(index) {
    _clienteAddressFormOpen = true;
    _clienteAddressEditIndex = parseInt(index, 10);
    _renderClienteAddressesBook();
  }

  function _cancelClienteDeliveryAddress() {
    _clienteAddressFormOpen = false;
    _clienteAddressEditIndex = -1;
    _renderClienteAddressesBook();
  }

  function _saveClienteDeliveryAddress() {
    var address = {
      id: _clienteAddressEditIndex >= 0 && _clienteDeliveryAddresses[_clienteAddressEditIndex] ? _clienteDeliveryAddresses[_clienteAddressEditIndex].id : ('addr-' + Date.now().toString(36)),
      label: _val('cli-address-label-input') || (_clienteDeliveryAddresses.length ? 'Endereço ' + (_clienteDeliveryAddresses.length + 1) : 'Endereço principal'),
      address: _val('cli-address'),
      number: _val('cli-number'),
      complement: _val('cli-reference'),
      neighborhood: _val('cli-hood'),
      city: _val('cli-city'),
      province: _val('cli-state'),
      country: _val('cli-country') || 'España',
      postalCode: _val('cli-zip')
    };
    if (!(address.address || address.postalCode || address.neighborhood)) {
      UI.toast('Informe pelo menos rua, bairro ou código postal para salvar o endereço.', 'error');
      return;
    }
    if (!_validPostalCode(address.postalCode, address.country)) {
      UI.toast(_postalErrorMessage(address.country), 'error');
      return;
    }
    if (_clienteAddressEditIndex >= 0) _clienteDeliveryAddresses[_clienteAddressEditIndex] = address;
    else _clienteDeliveryAddresses.push(address);
    _clienteDeliveryAddresses = _normalizeClienteAddresses({ deliveryAddresses: _clienteDeliveryAddresses });
    _clienteAddressFormOpen = false;
    _clienteAddressEditIndex = -1;
    _renderClienteAddressesBook();
  }

  function _removeClienteDeliveryAddress(index) {
    index = parseInt(index, 10);
    if (index < 0 || index >= _clienteDeliveryAddresses.length) return;
    _clienteDeliveryAddresses.splice(index, 1);
    _clienteDeliveryAddresses = _normalizeClienteAddresses({ deliveryAddresses: _clienteDeliveryAddresses });
    _clienteAddressFormOpen = false;
    _clienteAddressEditIndex = -1;
    _renderClienteAddressesBook();
  }

  function _setClientePrimaryAddress(index) {
    index = parseInt(index, 10);
    if (index <= 0 || index >= _clienteDeliveryAddresses.length) return;
    var item = _clienteDeliveryAddresses.splice(index, 1)[0];
    _clienteDeliveryAddresses.unshift(item);
    _clienteDeliveryAddresses = _normalizeClienteAddresses({ deliveryAddresses: _clienteDeliveryAddresses });
    _renderClienteAddressesBook();
  }

  function _setClienteField(id, value) {
    var el = document.getElementById(id);
    if (!el || !value) return;
    el.value = value;
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }

  function _setClienteCountry(country, code) {
    var map = {
      Spain: 'España', ES: 'España',
      Portugal: 'Portugal', PT: 'Portugal',
      France: 'Francia', FR: 'Francia',
      Italy: 'Italia', IT: 'Italia',
      Germany: 'Alemania', DE: 'Alemania',
      Netherlands: 'Países Bajos', NL: 'Países Bajos',
      Belgium: 'Bélgica', BE: 'Bélgica',
      'United Kingdom': 'Reino Unido', GB: 'Reino Unido', UK: 'Reino Unido',
      Ireland: 'Irlanda', IE: 'Irlanda'
    };
    var target = map[country] || map[code] || country || code || '';
    _setClienteField('cli-country', target);
    _onClienteCountryChange();
  }

  function _setClienteSelectFuzzy(id, value) {
    var el = document.getElementById(id);
    if (!el || !value) return;
    var target = _fold(value);
    var best = '';
    Array.prototype.forEach.call(el.options || [], function (opt) {
      var optText = _fold(opt.textContent || opt.value || '');
      var optValue = _fold(opt.value || '');
      if (!best && (optText === target || optValue === target || optText.indexOf(target) >= 0 || target.indexOf(optText) >= 0)) {
        best = opt.value;
      }
    });
    el.value = best || value;
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
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
    return ({ novo: 'Novo', recorrente: 'Recorrente', vip: 'VIP', inativo: 'Inativo', sem_segunda_compra: 'Sem segunda compra', com_pontos: 'Com pontos', sem_pedido: 'Sem pedido', ativo: 'Ativo', bloqueado: 'Bloqueado' })[v] || _title(v || '');
  }

  function _segmentBadge(v) {
    var color = v === 'vip' ? 'orange' : v === 'recorrente' ? 'green' : v === 'inativo' ? 'gray' : v === 'bloqueado' ? 'red' : v === 'com_pontos' ? 'purple' : 'blue';
    return UI.badge(_segmentLabel(v), color);
  }

  function _channelLabel(value) {
    var raw = String(value || '').trim();
    var key = raw.toLowerCase().normalize ? raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw.toLowerCase();
    key = key.replace(/[\s-]+/g, '_');
    return ({
      cardapio: 'Cardápio',
      cardapio_publico: 'Cardápio',
      loja_publica: 'Cardápio',
      whatsapp: 'WhatsApp',
      wpp: 'WhatsApp',
      venda_presencial: 'Venda presencial',
      presencial: 'Venda presencial',
      pedido_manual: 'Pedido manual',
      glovo: 'Glovo',
      uber_eats: 'Uber Eats'
    })[key] || raw || '-';
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
    var id = _clienteRecordId(c);
    var phone = String(c && c.phone || c && c.whatsapp || '').replace(/\D/g, '');
    var name = _clean(c && c.name || '');
    return (_pointsMovements || []).filter(function (m) {
      if (id && String(m.customerId || m.clientId || m.customerUid || '') === id) return true;
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
  function _profileMetric(label, value, sub) {
    return '<div class="cliente-profile-metric"><span>' + _esc(label) + '</span><strong>' + _esc(String(value == null ? '-' : value)) + '</strong>' + (sub ? '<small style="display:block;margin-top:3px;font-size:11px;color:#8A7E7C;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(sub) + '</small>' : '') + '</div>';
  }
  function _profileInfo(label, value) {
    return '<div class="cliente-profile-info-row"><div>' + _esc(label) + '</div><div>' + _esc(value || '-') + '</div></div>';
  }
  function _profileInfoHTML(label, html) {
    return '<div class="cliente-profile-info-row"><div>' + _esc(label) + '</div><div>' + (html || '-') + '</div></div>';
  }
  function _profileAddressesHTML(c) {
    var addresses = _normalizeClienteAddresses(c || {});
    if (!addresses.length) return '-';
    return '<div style="display:flex;flex-direction:column;gap:6px;">' + addresses.map(function (addr, idx) {
      return '<div style="font-size:12px;color:#1F1F1F;line-height:1.35;font-weight:500;">' +
        '<span style="color:' + (idx === 0 ? '#B42318' : '#6F6860') + ';font-weight:650;">' + _esc(addr.label || (idx === 0 ? 'Principal' : 'Endereço ' + (idx + 1))) + ':</span> ' +
        _esc(_clienteAddressLine(addr) || '-') +
      '</div>';
    }).join('') + '</div>';
  }
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
  function _field(id, label, value, type) {
    var postalAttr = (id === 'cli-zip' || id === 'cli-fiscal-postal') ? ' list="clientes-postal-suggestions" autocomplete="postal-code"' : '';
    return '<div class="bf-field"><label>' + label + '</label><input id="' + id + '" class="bf-input" type="' + (type || 'text') + '"' + postalAttr + ' value="' + _esc(value == null ? '' : value) + '"></div>';
  }
  function _phoneField(prefixId, numberId, label, parts) {
    parts = parts || {};
    return '<div class="bf-field"><label>' + _esc(label || 'Telefone / WhatsApp') + '</label><div class="cliente-phone-box">' +
      '<select id="' + _esc(prefixId) + '">' + _phonePrefixOptions(parts.prefix) + '</select>' +
      '<input id="' + _esc(numberId) + '" type="text" value="' + _esc(parts.number || '') + '" placeholder="Telefone / WhatsApp">' +
    '</div></div>';
  }
  function _clientPhoneParts(value) {
    var raw = String(value || '').trim();
    var match = raw.match(/^(\+\d{1,4})\s*(.*)$/);
    return {
      prefix: match ? match[1] : '',
      number: match ? String(match[2] || '').trim() : raw.replace(/^\+/, '')
    };
  }
  function _clientPhoneFull(prefix, number) {
    var p = String(prefix || '').trim();
    var n = String(number || '').trim();
    if (!_phone(n)) return '';
    return [p, n].filter(Boolean).join(' ').trim();
  }
  function _phonePrefixOptions(selected) {
    var current = String(selected || '');
    var labels = {
      '+34': '🇪🇸 +34',
      '+351': '🇵🇹 +351',
      '+55': '🇧🇷 +55',
      '+33': '🇫🇷 +33',
      '+39': '🇮🇹 +39',
      '+49': '🇩🇪 +49',
      '+44': '🇬🇧 +44',
      '+1': '🇺🇸 +1'
    };
    var options = ['+34', '+351', '+55', '+33', '+39', '+49', '+44', '+1'];
    if (current && options.indexOf(current) < 0) options.unshift(current);
    return '<option value=""' + (!current ? ' selected' : '') + '>DDI</option>' + options.map(function (value) {
      return '<option value="' + _esc(value) + '"' + (value === current ? ' selected' : '') + '>' + _esc(labels[value] || value) + '</option>';
    }).join('');
  }
  function _textarea(id, label, value) { return '<div class="bf-field"><label>' + label + '</label><textarea id="' + id + '" class="bf-textarea">' + _esc(value || '') + '</textarea></div>'; }
  function _select(id, label, options) { return '<div class="bf-field"><label>' + label + '</label><select id="' + id + '" class="bf-select">' + options + '</select></div>'; }
  function _input() { return 'width:100%;min-height:36px;padding:0 12px;border:1px solid #E8DCD7;border-radius:12px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;background:#FFFCF8;color:#1F1F1F;box-shadow:none;transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;'; }
  function _label() { return 'font-size:11px;font-weight:650;color:#8A7E7C;display:block;margin-bottom:5px;letter-spacing:.02em;'; }
  function _sectionTitle() { return 'font-size:10px;font-weight:600;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;'; }
  function _primaryBtn() { return 'min-width:180px;height:40px;background:#B42318;color:#fff;border:none;padding:0 16px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(180,35,24,.18);'; }
  function _smallSelect() { return 'height:38px;padding:0 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;font-size:13px;font-weight:500;color:#1F1F1F;font-family:inherit;outline:none;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _iconBtn(bg, color) { return 'width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:' + bg + ';color:' + color + ';cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _panel() { return 'background:#fff;border:1px solid #EAE4DA;border-radius:16px;padding:16px;box-shadow:0 12px 30px rgba(31,31,31,.06);'; }
  function _h3() { return 'font-size:14px;font-weight:700;color:#1F1F1F;margin-bottom:10px;'; }
  function _filterField(label, control) { return '<label style="display:block;min-width:0;"><span style="font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;">' + _esc(label) + '</span>' + control + '</label>'; }
  function _filterBoxStyle() { return 'background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;'; }
  function _filterControlStyle() { return 'width:100%;height:40px;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;box-sizing:border-box;'; }
  function _filterSelectControlStyle() { return _filterControlStyle() + 'appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:30px;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 4px center;background-size:14px;'; }
  function _actionButton(bg, color) { return 'width:100%;display:flex;align-items:center;gap:8px;margin-top:8px;padding:10px 12px;border-radius:10px;border:1px solid #EAE4DA;background:' + bg + ';color:' + color + ';font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _actionLink(bg, color) { return _actionButton(bg, color) + 'text-decoration:none;box-sizing:border-box;'; }
  function _avatarColor(name) { var colors = ['#C4362A', '#1A9E5A', '#2563EB', '#7C3AED', '#D97706', '#0891B2']; return colors[(name || 'C').charCodeAt(0) % colors.length]; }
  function _avatarUrl(c) { return c && (c.avatarUrl || c.photoURL || c.photoUrl || c.imageUrl || c.picture) || ''; }
  function _avatarHTML(c, size, radius, fontSize) {
    var url = _avatarUrl(c);
    var bg = url ? 'transparent' : _avatarColor(c && c.name);
    var style = 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + bg + ';color:#fff;font-size:' + fontSize + 'px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 2px rgba(31,31,31,.03);overflow:hidden;';
    return '<div style="' + style + '">' + (url ? '<img src="' + _esc(url) + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">' : _esc(_initials(c && c.name))) + '</div>';
  }
  function _profileAvatarHTML(c) {
    var url = _avatarUrl(c);
    return '<div class="cliente-profile-avatar">' + (url ? '<img src="' + _esc(url) + '" alt="">' : _esc(_initials(c && c.name))) + '</div>';
  }
  function _initials(name) { return (name || 'Cliente').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
  function _clientAddress(c) {
    var primary = _primaryClientAddress(c || {});
    return _clienteAddressLine(primary);
  }
  function _primaryClientAddress(c) {
    var addresses = _normalizeClienteAddresses(c || {});
    if (addresses.length) return addresses[0];
    return {};
  }
  function _normalizeClienteAddresses(c) {
    c = c || {};
    var source = Array.isArray(c.deliveryAddresses) ? c.deliveryAddresses
      : (Array.isArray(c.savedDeliveryAddresses) ? c.savedDeliveryAddresses
        : (Array.isArray(c.addresses) ? c.addresses : []));
    var list = [];
    source.forEach(function (addr, index) {
      if (!addr) return;
      var item = _normalizeClienteAddress(addr, index);
      if (item.address || item.postalCode || item.neighborhood) list.push(item);
    });
    if (!list.length) {
      var legacy = _normalizeClienteAddress({
        id: 'legacy',
        label: 'Endereço principal',
        address: c.address || c.streetAddress || c.fullAddress || c.street || c.endereco || '',
        number: c.number || c.numero || c.portal || '',
        complement: c.reference || c.complement || c.piso || '',
        neighborhood: c.neighborhood || c.zone || c.bairro || c.area || c.district || '',
        city: c.city || c.locality || c.cidade || '',
        province: c.province || c.state || c.estado || c.region || '',
        country: c.country || c.countryCode || c.pais || '',
        postalCode: c.postalCode || c.zip || c.codigoPostal || c.postcode || ''
      }, 0);
      if (legacy.address || legacy.postalCode || legacy.neighborhood) list.push(legacy);
    }
    return list.map(function (item, index) {
      item.label = item.label || (index === 0 ? 'Endereço principal' : 'Endereço ' + (index + 1));
      return item;
    });
  }
  function _normalizeClienteAddress(addr, index) {
    return {
      id: String(addr.id || addr.key || ('addr-' + index)),
      label: addr.label || addr.name || addr.nome || '',
      address: addr.address || addr.street || addr.streetAddress || addr.route || addr.addressLine || addr.line1 || addr.formattedAddress || addr.fullAddress || addr.endereco || '',
      number: addr.number || addr.numero || addr.portal || addr.addressNumber || '',
      complement: addr.complement || addr.piso || addr.floor || addr.reference || addr.addressComplement || '',
      neighborhood: addr.neighborhood || addr.zone || addr.bairro || addr.area || addr.district || '',
      city: addr.city || addr.locality || addr.cidade || '',
      province: addr.province || addr.state || addr.estado || addr.region || '',
      country: addr.country || addr.countryCode || addr.pais || 'España',
      postalCode: _postalCodeValue(addr)
    };
  }
  function _clienteAddressLine(addr) {
    if (!addr) return '';
    var line1 = [addr.address, addr.number].filter(Boolean).join(' ');
    var line2 = [addr.complement, addr.neighborhood, addr.postalCode].filter(Boolean).join(' · ');
    var line3 = [addr.city, addr.province, addr.country].filter(Boolean).join(', ');
    return [line1, line2, line3].filter(Boolean).join(' · ');
  }
  function _phoneLink(c, text) { return '<a href="' + _whatsUrl(c.phone, text || '') + '" target="_blank" onclick="event.stopPropagation();" style="color:#1A9E5A;font-weight:900;text-decoration:none;">' + _esc(c.phone || '') + '</a>'; }
  function _contactHTML(c, text) {
    var parts = [];
    if (c.phone) parts.push('<span class="mi" style="font-size:14px;color:#1A9E5A;vertical-align:-2px;">chat</span> ' + _phoneLink(c, text));
    if (c.email) parts.push('<span>' + _esc(c.email) + '</span>');
    return parts.join('<span style="color:#D4C8C6;"> · </span>');
  }
  function _whatsUrl(phone, text) { return 'https://wa.me/' + _phone(phone) + '?text=' + encodeURIComponent(text || ''); }
  function _clienteRecordId(cliente) {
    return String(cliente && (cliente.id || cliente._id || cliente.customerId || cliente.clientId || cliente.uid || cliente.customerUid || cliente.docId || '') || '').trim();
  }
  function _withClienteRecordId(cliente) {
    if (!cliente || typeof cliente !== 'object') return cliente;
    var id = _clienteRecordId(cliente);
    return id && !cliente.id ? Object.assign({}, cliente, { id: id }) : cliente;
  }
  function _postalCodeValue(source) {
    source = source || {};
    return [source.postalCode, source.postal, source.zip, source.zipCode, source.postcode, source.postCode, source.codigoPostal, source.codigo_postal, source.caixaPostal, source.caixa_postal, source.cep].map(function (v) {
      return String(v || '').trim();
    }).filter(Boolean)[0] || '';
  }
  function _postalHistoryId(value) {
    value = String(value || '').trim().toUpperCase();
    return value ? 'cp_' + value.replace(/[^A-Z0-9_-]/g, '_').slice(0, 48) : '';
  }
  function _rememberPostalCode(value, meta) {
    value = String(value || '').trim();
    if (!value || value.length < 3 || !DB || typeof DB.set !== 'function') return;
    meta = meta || {};
    var id = _postalHistoryId(value);
    if (!id) return;
    var payload = {
      postalCode: value,
      source: String(meta.source || 'customer').trim(),
      city: String(meta.city || '').trim(),
      province: String(meta.province || '').trim(),
      country: String(meta.country || '').trim(),
      neighborhood: String(meta.neighborhood || '').trim(),
      lastUsedAt: new Date().toISOString()
    };
    var idx = (_postalHistory || []).findIndex(function (item) { return String(item.id || '') === id || String(item.postalCode || '').trim() === value; });
    if (idx >= 0) _postalHistory[idx] = Object.assign({}, _postalHistory[idx], payload, { id: id });
    else _postalHistory.push(Object.assign({}, payload, { id: id }));
    DB.set('postal_history', id, payload).catch(function () {});
  }
  function _clientePostalDatalistHTML() {
    var map = {};
    function add(value) {
      value = String(value || '').trim();
      if (value) map[value] = true;
    }
    (_postalHistory || []).forEach(function (item) {
      add(_postalCodeValue(item));
    });
    (_clientes || []).forEach(function (customer) {
      add(_postalCodeValue(customer));
      _normalizeClienteAddresses(customer).forEach(function (addr) { add(_postalCodeValue(addr)); });
    });
    (_orders || []).forEach(function (order) {
      add(_postalCodeValue(order));
      if (order && typeof order.deliveryAddress === 'object') add(_postalCodeValue(order.deliveryAddress));
    });
    var values = Object.keys(map).sort().slice(0, 80);
    return '<datalist id="clientes-postal-suggestions">' + values.map(function (value) {
      return '<option value="' + _esc(value) + '"></option>';
    }).join('') + '</datalist>';
  }
  function _findClienteByRecordId(id) {
    var wanted = String(id || '').trim();
    if (!wanted) return null;
    return (_clientes || []).map(_withClienteRecordId).find(function (c) { return _clienteRecordId(c) === wanted; }) || null;
  }
  function _phone(v) { return String(v || '').replace(/\D/g, ''); }
  function _phoneMatchKey(v) { var digits = _phone(v); return digits.length >= 6 ? digits : ''; }
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
    if (lc === 'españa' || lc === 'es' || lc === 'spain') return /^\d{5}$/.test(raw);
    if (lc === 'portugal' || lc === 'pt') return /^\d{4}-\d{3}$/.test(raw) || /^\d{4}$/.test(raw);
    return raw.length >= 3 && raw.length <= 12;
  }
  function _postalErrorMessage(country) {
    var lc = String(country || '').toLowerCase();
    if (lc === 'portugal' || lc === 'pt') return 'Código postal inválido para Portugal. Use NNNN-NNN.';
    if (lc === 'españa' || lc === 'es' || lc === 'spain') return 'Código postal inválido para Espanha. Use 5 números.';
    return 'Código postal inválido.';
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
  function _fold(v) {
    var raw = String(v == null ? '' : v).trim().toLowerCase();
    return raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
  }
  function _title(v) {
    var raw = String(v || '').replace(/_/g, ' ').trim();
    var key = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : raw.toLowerCase();
    if (key === 'cardapio') return 'Cardápio';
    if (key === 'venda presencial') return 'Venda presencial';
    return raw.replace(/(^|\s)([a-záéíóúàèìòùâêîôûãõç])/gi, function (_, sep, letter) {
      return sep + letter.toUpperCase();
    });
  }
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
    _uploadClienteAvatarImage: _uploadClienteAvatarImage,
    _clearClienteAvatarImage: _clearClienteAvatarImage,
    _onClienteCountryChange: _onClienteCountryChange,
    _newClienteDeliveryAddress: _newClienteDeliveryAddress,
    _editClienteDeliveryAddress: _editClienteDeliveryAddress,
    _cancelClienteDeliveryAddress: _cancelClienteDeliveryAddress,
    _saveClienteDeliveryAddress: _saveClienteDeliveryAddress,
    _removeClienteDeliveryAddress: _removeClienteDeliveryAddress,
    _setClientePrimaryAddress: _setClientePrimaryAddress,
    _deleteCliente: _deleteCliente,
    _openHistory: _openHistory,
    _openSegmentFlow: _openSegmentFlow,
    _openProfile: _openProfile,
    _setFilter: _setFilter,
    _clearFilters: _clearFilters,
    _setPage: _setPage,
    _setPageSize: _setPageSize
  };
})();
