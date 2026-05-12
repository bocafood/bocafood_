// js/modules/operacao.js
window.Modules = window.Modules || {};
Modules.Operacao = (function () {
  'use strict';

  var _activeSub = 'status';
  var _config = {};
  var _zonesDraft = [];

  var TABS = [
    { key: 'status', label: 'Status e horários', icon: 'schedule' },
    { key: 'atendimento', label: 'Entrega e retirada', icon: 'local_shipping' },
    { key: 'zonas', label: 'Zonas de entrega', icon: 'map' },
    { key: 'pagamentos', label: 'Pagamentos', icon: 'payments' },
    { key: 'contato', label: 'Endereço e contato', icon: 'storefront' }
  ];

  var DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  function render(sub) {
    _activeSub = _normalizeSub(sub);
    var app = document.getElementById('app');
    app.innerHTML = '' +
      '<div id="op-root" class="module-page" style="padding:24px;display:flex;flex-direction:column;gap:18px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
          '<div style="min-width:0;">' +
            '<h1 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 4px;line-height:1.15;">Operação</h1>' +
            '<p style="font-size:13px;color:#6F6860;margin:0;line-height:1.45;">Controle o que a loja pública usa no dia a dia: status, horários, entrega, pagamentos e contato.</p>' +
          '</div>' +
          '<button type="button" onclick="Router.navigate(\'loja-online/template\')" style="border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Ver template</button>' +
        '</div>' +
        '<div id="op-tabs"></div>' +
        '<div id="op-content" style="display:flex;flex-direction:column;gap:16px;"><div class="loading-inline">Carregando...</div></div>' +
      '</div>';

    _renderTabs();
    _loadConfig().then(function () {
      _renderActive();
    }).catch(function (err) {
      console.error('Operacao load error', err);
      _paintError(err);
    });
  }

  function destroy() {}

  function _normalizeSub(sub) {
    var key = String(sub || 'status');
    if (key === 'horarios') return 'status';
    if (key === 'endereco') return 'contato';
    if (key === 'retirada' || key === 'entrega') return 'atendimento';
    return TABS.some(function (t) { return t.key === key; }) ? key : 'status';
  }

  function _renderTabs() {
    var el = document.getElementById('op-tabs');
    if (!el) return;
    el.innerHTML = TABS.map(function (t) {
      var active = t.key === _activeSub;
      return '' +
        '<button type="button" onclick="Modules.Operacao._switchSub(\'' + t.key + '\')" style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:none;border-radius:999px;background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#6F6860') + ';font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:' + (active ? '0 10px 24px rgba(180,35,24,.18)' : 'inset 0 0 0 1px #EAE4DA') + ';transition:background .15s ease,color .15s ease,box-shadow .15s ease;white-space:nowrap;">' +
          '<span class="mi" style="font-size:17px;">' + _esc(t.icon) + '</span>' + _esc(t.label) +
        '</button>';
    }).join('');
    el.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#FAF8F4;border-radius:999px;padding:4px;box-shadow:inset 0 0 0 1px #EAE4DA;max-width:100%;overflow:auto;';
  }

  function _switchSub(key) {
    _activeSub = _normalizeSub(key);
    _renderTabs();
    _renderActive();
    Router.navigate('operacao/' + _activeSub);
  }

  function _loadConfig() {
    return Promise.all([
      _safeDoc('config', 'template'),
      _safeDoc('config', 'geral'),
      _safeDoc('config', 'aparencia'),
      _safeDoc('config', 'operacao'),
      _safeDoc('config', 'horarios'),
      _safeDoc('config', 'zonas'),
      _safeDoc('config', 'pagamentos'),
      _safeDoc('config', 'endereco'),
      _safeDoc('config', 'financeiro')
    ]).then(function (r) {
      _config = {
        template: r[0] || {},
        geral: r[1] || {},
        aparencia: r[2] || {},
        operacao: r[3] || {},
        horarios: r[4] || {},
        zonas: r[5] || {},
        pagamentos: r[6] || {},
        endereco: r[7] || {},
        financeiro: r[8] || {}
      };
      _zonesDraft = _zonesFromConfig();
    });
  }

  function _safeDoc(col, id) {
    return DB.getDocRoot(col, id).catch(function () { return null; });
  }

  function _renderActive() {
    if (_activeSub === 'status') return _renderStatusHours();
    if (_activeSub === 'atendimento') return _renderAtendimento();
    if (_activeSub === 'zonas') return _renderZonas();
    if (_activeSub === 'pagamentos') return _renderPagamentos();
    if (_activeSub === 'contato') return _renderContato();
  }

  function _paintError(err) {
    var content = document.getElementById('op-content');
    if (!content) return;
    content.innerHTML = '<section style="' + _cardStyle() + 'color:#B42318;font-size:13px;">Erro ao carregar Operação: ' + _esc((err && err.message) || err || 'desconhecido') + '</section>';
  }

  function _summary() {
    var tpl = _config.template || {};
    var op = _config.operacao || {};
    var status = tpl.statusMode || (tpl.manualClosed ? 'manual_closed' : tpl.manualOpen ? 'manual_open' : (op.isOpen === false ? 'manual_closed' : 'auto'));
    var zones = _zonesFromConfig();
    var activeZones = zones.filter(function (z) { return z.active !== false; }).length;
    var pay = _paymentConfigs().filter(function (m) { return m.active; }).length;
    return {
      statusMode: status,
      statusLabel: status === 'manual_open' ? 'Aberta manualmente' : (status === 'manual_closed' ? 'Fechada manualmente' : 'Automática'),
      delivery: tpl.deliveryEnabled !== false,
      pickup: tpl.pickupEnabled !== false,
      activeZones: activeZones,
      payments: pay
    };
  }

  function _renderHeader(title, desc, actionLabel, actionFn) {
    var s = _summary();
    return '' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        _sectionTitle(title, desc) +
        (actionLabel ? '<button type="button" onclick="' + actionFn + '" style="border:none;background:#B42318;color:#fff;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.16);">' + _esc(actionLabel) + '</button>' : '') +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:-2px;">' +
        _chip('Status: ' + s.statusLabel) +
        _chip(s.delivery ? 'Entrega ativa' : 'Entrega inativa') +
        _chip(s.pickup ? 'Retirada ativa' : 'Retirada inativa') +
        _chip(s.activeZones + ' zona(s) ativa(s)') +
        _chip(s.payments + ' pagamento(s)') +
      '</div>';
  }

  function _renderStatusHours() {
    var content = document.getElementById('op-content');
    var tpl = _config.template || {};
    var op = _config.operacao || {};
    var statusMode = tpl.statusMode || (tpl.manualClosed ? 'manual_closed' : tpl.manualOpen ? 'manual_open' : (op.isOpen === false ? 'manual_closed' : 'auto'));
    var hours = _hoursFromConfig();
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _renderHeader('Status e horários', 'Edite aqui os mesmos campos usados em Catálogo > Template da loja para controlar o funcionamento público.', 'Salvar status e horários', 'Modules.Operacao._saveStatusHours()') +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Status da loja', 'Escolha se a loja segue os horários ou se deve abrir/fechar manualmente.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:start;">' +
          _selectField('op-status-mode', 'Status da loja', statusMode, [
            ['auto', 'Automático pelos horários'],
            ['manual_open', 'Aberta manualmente'],
            ['manual_closed', 'Fechada temporariamente']
          ]) +
          _textareaField('op-closed-message', 'Mensagem quando fechada', op.closedMessage || tpl.closedMessage || tpl.specialHoursText || '', 'Ex: Voltamos às 18h.', 3) +
        '</div>' +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Horários de funcionamento', 'Esses horários alimentam a loja pública e o Template da loja.') +
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          hours.map(function (row, idx) { return _hourRow(idx, row); }).join('') +
        '</div>' +
        '<div style="margin-top:12px;">' + _textareaField('op-special-hours', 'Texto de horários especiais', tpl.specialHoursText || (_config.horarios || {}).specialHoursText || '', 'Ex: Fechamos em feriados.', 3) + '</div>' +
      '</section>';
  }

  function _hourRow(idx, row) {
    var closed = row.closed || row.enabled === false;
    var second = row.enabled2 !== false && (!!row.open2 || !!row.close2 || row.enabled2 === true);
    return '' +
      '<div data-op-hour-row="' + idx + '" style="display:grid;grid-template-columns:minmax(150px,1fr) 110px 120px 120px 120px 120px;gap:10px;align-items:end;padding:12px 14px;border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;">' +
        '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;">' + _esc(DAYS[idx]) + '</div><div style="font-size:12px;color:#6F6860;">' + (closed ? 'Fechada' : 'Aberta') + '</div></div>' +
        _toggleField('op-h-closed-' + idx, 'Fechada', closed) +
        _inputField('op-h-open-' + idx, 'Abre', row.open || '', 'time') +
        _inputField('op-h-close-' + idx, 'Fecha', row.close || '', 'time') +
        _toggleField('op-h-enabled2-' + idx, '2º período', second) +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          _inputField('op-h-open2-' + idx, 'Abre 2', row.open2 || '', 'time') +
          _inputField('op-h-close2-' + idx, 'Fecha 2', row.close2 || '', 'time') +
        '</div>' +
      '</div>';
  }

  function _saveStatusHours() {
    var statusMode = _val('op-status-mode') || 'auto';
    var hours = _collectHours();
    var closedMessage = _val('op-closed-message');
    var specialHoursText = _val('op-special-hours');
    var tpl = Object.assign({}, _config.template || {}, {
      statusMode: statusMode,
      manualClosed: statusMode === 'manual_closed',
      manualOpen: statusMode === 'manual_open',
      closedMessage: closedMessage,
      hours: hours,
      specialHoursText: specialHoursText,
      updatedAt: new Date().toISOString()
    });
    var horarios = Object.assign({}, _config.horarios || {}, _legacyDayHours(hours), {
      days: hours,
      specialHoursText: specialHoursText
    });
    var operacao = Object.assign({}, _config.operacao || {}, {
      isOpen: statusMode === 'manual_closed' ? false : true,
      statusMode: statusMode,
      closedMessage: closedMessage
    });
    _saveMany([
      ['template', tpl],
      ['horarios', horarios],
      ['operacao', operacao]
    ], 'Status e horários salvos.');
  }

  function _renderAtendimento() {
    var content = document.getElementById('op-content');
    var tpl = _config.template || {};
    var deliveryEnabled = tpl.deliveryEnabled !== false;
    var pickupEnabled = tpl.pickupEnabled !== false;
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _renderHeader('Entrega e retirada', 'Configure os canais operacionais que aparecem na loja pública e no Template.', 'Salvar atendimento', 'Modules.Operacao._saveAtendimento()') +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Modos de atendimento', 'Ative entrega e retirada conforme a operação do dia.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
          _toggleField('op-pickup-enabled', 'Ativar retirada', pickupEnabled, 'Cliente pode retirar no endereço informado.') +
          _toggleField('op-delivery-enabled', 'Ativar entrega', deliveryEnabled, 'Cliente pode escolher entrega.') +
        '</div>' +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Capacidade e prazos', 'Dados exibidos nos chips e usados para orientar o pedido.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
          _inputField('op-prep-time', 'Tempo médio de preparo', _stripMin(tpl.prepTime || tpl.averagePrepTime || ''), 'text', 'Ex: 45') +
          _inputField('op-delivery-time', 'Tempo médio de entrega', _stripMin(tpl.deliveryTime || tpl.averageDeliveryTime || ''), 'text', 'Ex: 30-45') +
          _inputField('op-orders-hour', 'Pedidos por hora', tpl.maxOrdersPerSlot || tpl.ordersPerHour || '', 'number') +
          _inputField('op-advance-days', 'Dias mínimos de antecedência', tpl.maxAdvanceDays || tpl.advanceDaysLimit || '', 'number') +
          _inputField('op-min-delivery', 'Pedido mínimo para entrega', _moneyDisplay(tpl.minDeliveryOrder || tpl.minimumDeliveryOrder || ''), 'text', 'Ex: 15,00') +
        '</div>' +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Textos exibidos na loja', 'Esses textos são os mesmos usados pelo Template da loja.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">' +
          _textareaField('op-pickup-text', 'Texto de retirada', tpl.pickupText || '', 'Retire no endereço informado.', 4) +
          _textareaField('op-delivery-text', 'Texto de entrega', tpl.deliveryText || '', 'Entregamos na área selecionada.', 4) +
        '</div>' +
      '</section>';
  }

  function _saveAtendimento() {
    var prep = _val('op-prep-time');
    var deliveryTime = _val('op-delivery-time');
    var minDelivery = _numVal('op-min-delivery');
    var orders = _numVal('op-orders-hour');
    var days = _numVal('op-advance-days');
    var tpl = Object.assign({}, _config.template || {}, {
      pickupEnabled: _checked('op-pickup-enabled'),
      deliveryEnabled: _checked('op-delivery-enabled'),
      prepTime: prep,
      averagePrepTime: prep,
      deliveryTime: deliveryTime,
      averageDeliveryTime: deliveryTime,
      maxOrdersPerSlot: orders,
      ordersPerHour: orders,
      maxAdvanceDays: days,
      advanceDaysLimit: days,
      minDeliveryOrder: minDelivery,
      minimumDeliveryOrder: minDelivery,
      pickupText: _val('op-pickup-text'),
      deliveryText: _val('op-delivery-text'),
      updatedAt: new Date().toISOString()
    });
    _saveMany([['template', tpl]], 'Entrega e retirada salvas.');
  }

  function _renderZonas() {
    var content = document.getElementById('op-content');
    _zonesDraft = _zonesDraft.length ? _zonesDraft : _zonesFromConfig();
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _renderHeader('Zonas de entrega', 'Cadastre as mesmas zonas usadas pelo Template e pela loja pública.', 'Salvar zonas', 'Modules.Operacao._saveZonas()') +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;">' +
          _sectionTitle('Zonas cadastradas', 'Informe nome, códigos postais e valor da entrega.') +
          '<button type="button" onclick="Modules.Operacao._addZone()" style="border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Adicionar zona</button>' +
        '</div>' +
        (_zonesDraft.length ? _zonesDraft.map(function (z, idx) { return _zoneRow(z, idx); }).join('') : _emptyState('Nenhuma zona cadastrada', 'Adicione uma zona para liberar regras por código postal.')) +
      '</section>';
  }

  function _zoneRow(zone, idx) {
    return '' +
      '<div data-op-zone-row="' + idx + '" style="display:grid;grid-template-columns:minmax(150px,1fr) minmax(220px,1.4fr) 120px 100px 36px;gap:10px;align-items:end;padding:12px 14px;border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;margin-bottom:10px;">' +
        '<input type="hidden" id="op-zone-id-' + idx + '" value="' + _esc(zone.id || _newId('zone')) + '">' +
        _inputField('op-zone-name-' + idx, 'Nome', zone.name || '', 'text', 'Centro') +
        _inputField('op-zone-postals-' + idx, 'Códigos postais', (zone.postalCodes || []).join(', '), 'text', '31001, 31002') +
        _inputField('op-zone-fee-' + idx, 'Entrega', _moneyDisplay(zone.deliveryFee), 'text', '2,50') +
        _toggleField('op-zone-active-' + idx, 'Ativa', zone.active !== false) +
        '<button type="button" onclick="Modules.Operacao._removeZone(' + idx + ')" title="Excluir" style="width:34px;height:34px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#B42318;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:18px;">delete</span></button>' +
      '</div>';
  }

  function _addZone() {
    _zonesDraft = _collectZones();
    _zonesDraft.push({ id: _newId('zone'), name: '', postalCodes: [], deliveryFee: '', active: true });
    _renderZonas();
  }

  function _removeZone(idx) {
    _zonesDraft = _collectZones().filter(function (_, i) { return i !== idx; });
    _renderZonas();
  }

  function _saveZonas() {
    var zones = _collectZones();
    var err = _zonesError(zones);
    if (err) { UI.toast(err, 'error'); return; }
    var tpl = Object.assign({}, _config.template || {}, {
      deliveryZones: zones,
      updatedAt: new Date().toISOString()
    });
    var zonas = Object.assign({}, _config.zonas || {}, {
      list: zones,
      deliveryZones: zones
    });
    _saveMany([['template', tpl], ['zonas', zonas]], 'Zonas de entrega salvas.');
  }

  function _renderPagamentos() {
    var content = document.getElementById('op-content');
    var methods = _paymentConfigs();
    var note = (_config.template || {}).paymentNote || (_config.pagamentos || {}).paymentNote || (_config.pagamentos || {}).note || '';
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _renderHeader('Pagamentos', 'Ative as formas que aparecem na loja pública e ajuste instruções operacionais.', 'Salvar pagamentos', 'Modules.Operacao._savePagamentos()') +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Formas de pagamento', 'A lista reflete as formas usadas pelo Template da loja.') +
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          methods.map(function (m, idx) { return _paymentRow(m, idx); }).join('') +
        '</div>' +
        '<div style="margin-top:12px;">' + _textareaField('op-payment-note', 'Observação geral sobre pagamento', note, 'Pagamento na entrega ou retirada.', 3) + '</div>' +
      '</section>';
  }

  function _paymentRow(method, idx) {
    return '' +
      '<div style="display:grid;grid-template-columns:90px minmax(160px,.8fr) minmax(220px,1.3fr);gap:10px;align-items:end;padding:12px 14px;border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;">' +
        '<input type="hidden" id="op-pay-key-' + idx + '" value="' + _esc(method.key || _paymentKey(method.name)) + '">' +
        _toggleField('op-pay-active-' + idx, 'Ativa', method.active !== false) +
        _inputField('op-pay-name-' + idx, 'Nome', method.name || '', 'text') +
        _inputField('op-pay-instructions-' + idx, 'Instruções', method.instructions || '', 'text', 'Ex: pagar no balcão') +
      '</div>';
  }

  function _savePagamentos() {
    var configs = _collectPaymentConfigs();
    var activeNames = configs.filter(function (m) { return m.active; }).map(function (m) { return m.name; });
    var instructions = {};
    configs.forEach(function (m) { if (m.instructions) instructions[m.key] = m.instructions; });
    var flags = _paymentFlags(configs);
    var note = _val('op-payment-note');
    var tpl = Object.assign({}, _config.template || {}, {
      paymentMethods: activeNames,
      paymentMethodConfigs: configs,
      paymentMethodInstructions: instructions,
      paymentNote: note,
      payments: Object.assign({}, ((_config.template || {}).payments || {}), flags, {
        paymentMethods: activeNames,
        paymentMethodConfigs: configs,
        paymentMethodInstructions: instructions,
        paymentNote: note,
        note: note
      }),
      updatedAt: new Date().toISOString()
    });
    var pagamentos = Object.assign({}, _config.pagamentos || {}, flags, {
      paymentMethods: activeNames,
      paymentMethodConfigs: configs,
      paymentMethodInstructions: instructions,
      paymentNote: note,
      note: note
    });
    _saveMany([['template', tpl], ['pagamentos', pagamentos]], 'Pagamentos salvos.');
  }

  function _renderContato() {
    var content = document.getElementById('op-content');
    var tpl = _config.template || {};
    var geral = _config.geral || {};
    var end = _config.endereco || {};
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _renderHeader('Endereço e contato', 'Edite os dados públicos de localização e atendimento usados no Template da loja.', 'Salvar contato', 'Modules.Operacao._saveContato()') +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Endereço público', 'Localização usada pela loja pública e pelos dados do Template.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
          _inputField('op-address', 'Endereço', end.address || end.addressLine || tpl.address || '', 'text', 'Rua...') +
          _inputField('op-number', 'Número', end.number || end.numero || tpl.number || tpl.numero || '', 'text') +
          _inputField('op-city', 'Cidade', end.city || tpl.city || geral.city || '', 'text') +
          _inputField('op-region', 'Região / província', end.region || end.state || end.province || tpl.region || '', 'text') +
          _inputField('op-neighborhood', 'Bairro / Localidade', end.neighborhood || tpl.neighborhood || geral.neighborhood || '', 'text') +
          _inputField('op-postal', 'Código postal', end.postalCode || tpl.postalCode || '', 'text') +
          _inputField('op-country', 'País', end.country || tpl.country || geral.country || '', 'text') +
        '</div>' +
      '</section>' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Canais de atendimento', 'Esses contatos aparecem na loja pública e no rodapé quando habilitados no Template.') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
          _inputField('op-whatsapp', 'WhatsApp', tpl.whatsapp || geral.whatsapp || '', 'text') +
          _inputField('op-phone', 'Telefone', tpl.phone || geral.phone || '', 'text') +
          _inputField('op-email', 'E-mail', tpl.email || geral.email || '', 'email') +
          _inputField('op-instagram', 'Instagram', tpl.instagram || geral.instagram || '', 'text') +
          _inputField('op-facebook', 'Facebook', tpl.facebook || geral.facebook || '', 'text') +
          _inputField('op-tiktok', 'TikTok', tpl.tiktok || geral.tiktok || '', 'text') +
        '</div>' +
      '</section>';
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('op-address'); }, 100);
  }

  function _saveContato() {
    var tpl = Object.assign({}, _config.template || {}, {
      address: _val('op-address'),
      number: _val('op-number'),
      numero: _val('op-number'),
      city: _val('op-city'),
      region: _val('op-region'),
      neighborhood: _val('op-neighborhood'),
      postalCode: _val('op-postal'),
      country: _val('op-country'),
      whatsapp: _val('op-whatsapp'),
      phone: _val('op-phone'),
      email: _val('op-email'),
      instagram: _val('op-instagram'),
      facebook: _val('op-facebook'),
      tiktok: _val('op-tiktok'),
      updatedAt: new Date().toISOString()
    });
    var geral = Object.assign({}, _config.geral || {}, {
      city: tpl.city,
      country: tpl.country,
      whatsapp: tpl.whatsapp,
      phone: tpl.phone || tpl.whatsapp,
      email: tpl.email,
      instagram: tpl.instagram,
      facebook: tpl.facebook,
      tiktok: tpl.tiktok
    });
    var endereco = Object.assign({}, _config.endereco || {}, {
      address: tpl.address,
      addressLine: tpl.address,
      pickupAddress: tpl.address,
      city: tpl.city,
      region: tpl.region,
      province: tpl.region,
      state: tpl.region,
      neighborhood: tpl.neighborhood,
      postalCode: tpl.postalCode,
      country: tpl.country
    });
    _saveMany([['template', tpl], ['geral', geral], ['endereco', endereco]], 'Endereço e contato salvos.');
  }

  function _saveMany(items, message) {
    Promise.all(items.map(function (it) { return DB.setDocRoot('config', it[0], it[1]); })).then(function () {
      items.forEach(function (it) { _config[it[0]] = it[1]; });
      if (items.some(function (it) { return it[0] === 'zonas'; })) _zonesDraft = _zonesFromConfig();
      UI.toast(message || 'Salvo.', 'success');
      _renderActive();
    }).catch(function (err) {
      UI.toast('Erro ao salvar: ' + err.message, 'error');
      console.error('Operacao save error', err);
    });
  }

  function _hoursFromConfig() {
    var tpl = _config.template || {};
    var hor = _config.horarios || {};
    var source = Array.isArray(hor.days) && hor.days.length ? hor.days : (Array.isArray(tpl.hours) && tpl.hours.length ? tpl.hours : null);
    if (source) {
      return DAYS.map(function (label, idx) {
        var row = source[idx] || {};
        return {
          day: row.day || label,
          open: row.open || row.from || '',
          close: row.close || row.to || '',
          open2: row.open2 || '',
          close2: row.close2 || '',
          closed: !!(row.closed || row.enabled === false),
          enabled: !(row.closed || row.enabled === false),
          enabled2: !!row.enabled2
        };
      });
    }
    return DAYS.map(function (label, idx) {
      var legacyIndex = idx === 6 ? 0 : idx + 1;
      var row = hor['day' + legacyIndex] || {};
      return {
        day: label,
        open: row.open || row.from || '',
        close: row.close || row.to || '',
        open2: row.open2 || '',
        close2: row.close2 || '',
        closed: !!row.closed,
        enabled: !row.closed,
        enabled2: !!row.enabled2
      };
    });
  }

  function _collectHours() {
    return DAYS.map(function (label, idx) {
      var closed = _checked('op-h-closed-' + idx);
      return {
        day: label,
        open: _val('op-h-open-' + idx),
        close: _val('op-h-close-' + idx),
        open2: _val('op-h-open2-' + idx),
        close2: _val('op-h-close2-' + idx),
        closed: closed,
        enabled: !closed,
        enabled2: _checked('op-h-enabled2-' + idx)
      };
    });
  }

  function _legacyDayHours(hours) {
    var out = {};
    (hours || []).forEach(function (row, idx) {
      var legacyIndex = idx === 6 ? 0 : idx + 1;
      out['day' + legacyIndex] = {
        from: row.open || '',
        to: row.close || '',
        open: row.open || '',
        close: row.close || '',
        open2: row.open2 || '',
        close2: row.close2 || '',
        closed: !!row.closed,
        enabled: row.enabled !== false,
        enabled2: !!row.enabled2
      };
    });
    return out;
  }

  function _zonesFromConfig() {
    var tpl = _config.template || {};
    var zonas = _config.zonas || {};
    var raw = Array.isArray(tpl.deliveryZones) && tpl.deliveryZones.length ? tpl.deliveryZones : (Array.isArray(zonas.list) && zonas.list.length ? zonas.list : (Array.isArray(zonas.deliveryZones) ? zonas.deliveryZones : []));
    return (raw || []).map(function (z, idx) {
      return {
        id: z.id || _newId('zone-' + idx),
        name: z.name || z.nome || '',
        postalCodes: Array.isArray(z.postalCodes) ? z.postalCodes : _postalList(z.postalCodes || z.postals || z.cep || ''),
        deliveryFee: z.deliveryFee != null ? z.deliveryFee : z.fee,
        active: z.active !== false
      };
    });
  }

  function _collectZones() {
    var rows = [].slice.call(document.querySelectorAll('[data-op-zone-row]'));
    return rows.map(function (_, idx) {
      return {
        id: _val('op-zone-id-' + idx) || _newId('zone-' + idx),
        name: _val('op-zone-name-' + idx),
        postalCodes: _postalList(_val('op-zone-postals-' + idx)),
        deliveryFee: _numVal('op-zone-fee-' + idx),
        active: _checked('op-zone-active-' + idx)
      };
    });
  }

  function _zonesError(zones) {
    var seen = {};
    for (var i = 0; i < zones.length; i += 1) {
      var z = zones[i] || {};
      if (!z.name) return 'Preencha o nome de todas as zonas.';
      if (!z.postalCodes.length) return 'Informe pelo menos um código postal para cada zona.';
      if (z.deliveryFee < 0) return 'O valor de entrega não pode ser negativo.';
      if (z.active === false) continue;
      for (var j = 0; j < z.postalCodes.length; j += 1) {
        var code = z.postalCodes[j];
        if (seen[code] && seen[code] !== z.id) return 'O código postal ' + code + ' já está em outra zona ativa.';
        seen[code] = z.id;
      }
    }
    return '';
  }

  function _paymentConfigs() {
    var tpl = _config.template || {};
    var pay = _config.pagamentos || {};
    var configs = Array.isArray(tpl.paymentMethodConfigs) && tpl.paymentMethodConfigs.length ? tpl.paymentMethodConfigs : (Array.isArray(pay.paymentMethodConfigs) ? pay.paymentMethodConfigs : []);
    if (!configs.length) {
      var names = Array.isArray(tpl.paymentMethods) && tpl.paymentMethods.length ? tpl.paymentMethods : (Array.isArray(pay.paymentMethods) && pay.paymentMethods.length ? pay.paymentMethods : _defaultPaymentNames());
      configs = names.map(function (name) { return { name: name, key: _paymentKey(name), active: true, instructions: '' }; });
    }
    var activeNames = Array.isArray(tpl.paymentMethods) && tpl.paymentMethods.length ? tpl.paymentMethods : (Array.isArray(pay.paymentMethods) ? pay.paymentMethods : []);
    return configs.map(function (m) {
      var name = m.name || m.nome || m.label || m.key || '';
      var key = m.key || _paymentKey(name);
      var active = m.active;
      if (active == null && activeNames.length) active = activeNames.indexOf(name) >= 0 || activeNames.indexOf(key) >= 0;
      if (active == null) active = true;
      return { key: key, name: name, active: active !== false, instructions: m.instructions || m.instrucoes || '' };
    });
  }

  function _collectPaymentConfigs() {
    return [].slice.call(document.querySelectorAll('[id^="op-pay-key-"]')).map(function (_, idx) {
      var name = _val('op-pay-name-' + idx);
      return {
        key: _val('op-pay-key-' + idx) || _paymentKey(name),
        name: name,
        active: _checked('op-pay-active-' + idx),
        instructions: _val('op-pay-instructions-' + idx)
      };
    }).filter(function (m) { return m.name; });
  }

  function _paymentFlags(configs) {
    var active = {};
    configs.forEach(function (m) { if (m.active) active[_paymentKey(m.name)] = true; });
    return {
      cash: !!(active.dinheiro || active.efectivo || active.efetivo || active.cash),
      card: !!(active.cartao || active.tarjeta || active.card),
      bizum: !!active.bizum,
      mbway: !!(active.mbway || active['mb-way']),
      multibanco: !!active.multibanco,
      transfer: !!(active.transferencia || active.transfer || active['bank-transfer']),
      localTransfer: !!(active.transferencia || active.transfer || active['bank-transfer']),
      online: !!(active.online || active['pagamento-online'] || active['pago-online'])
    };
  }

  function _defaultPaymentNames() {
    var country = (window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : 'ES') || 'ES';
    return country === 'PT'
      ? ['Dinheiro', 'Cartão', 'MB WAY', 'Multibanco', 'Transferência']
      : ['Efectivo', 'Tarjeta', 'Bizum', 'Transferencia'];
  }

  function _cardStyle() {
    return 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
  }

  function _inputStyle() {
    return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);';
  }

  function _labelStyle() {
    return 'font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;';
  }

  function _sectionTitle(title, desc) {
    return '<div style="margin-bottom:14px;"><h3 style="font-size:14px;font-weight:700;color:#1F1F1F;margin:0 0 4px;line-height:1.2;">' + _esc(title) + '</h3><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">' + _esc(desc || '') + '</p></div>';
  }

  function _chip(text) {
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(text) + '</span>';
  }

  function _inputField(id, label, value, type, placeholder) {
    return '<label style="display:block;margin-bottom:0;"><span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">' + _esc(label) + '</span><input id="' + _esc(id) + '" type="' + _esc(type || 'text') + '" value="' + _esc(value != null ? value : '') + '" placeholder="' + _esc(placeholder || '') + '" style="' + _inputStyle() + 'height:40px;"></label>';
  }

  function _textareaField(id, label, value, placeholder, rows) {
    return '<label style="display:block;margin-bottom:0;"><span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">' + _esc(label) + '</span><textarea id="' + _esc(id) + '" rows="' + (rows || 3) + '" placeholder="' + _esc(placeholder || '') + '" style="' + _inputStyle() + 'min-height:84px;resize:vertical;">' + _esc(value || '') + '</textarea></label>';
  }

  function _selectField(id, label, value, options) {
    return '<label style="display:block;margin-bottom:0;"><span style="' + _labelStyle() + 'display:block;margin-bottom:5px;">' + _esc(label) + '</span><select id="' + _esc(id) + '" style="' + _inputStyle() + 'height:40px;">' +
      options.map(function (o) { return '<option value="' + _esc(o[0]) + '"' + (String(value) === String(o[0]) ? ' selected' : '') + '>' + _esc(o[1]) + '</option>'; }).join('') +
      '</select></label>';
  }

  function _toggleField(id, label, checked, hint) {
    return '<label style="display:flex;align-items:flex-start;gap:10px;padding:11px 12px;border:1px solid #EAE4DA;border-radius:12px;background:#fff;cursor:pointer;min-height:40px;"><input id="' + _esc(id) + '" type="checkbox" ' + (checked ? 'checked' : '') + ' style="width:16px;height:16px;margin-top:2px;accent-color:#B42318;"><span style="display:flex;flex-direction:column;gap:2px;"><strong style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.2;">' + _esc(label) + '</strong>' + (hint ? '<small style="font-size:12px;color:#6F6860;line-height:1.35;">' + _esc(hint) + '</small>' : '') + '</span></label>';
  }

  function _emptyState(title, subtitle) {
    return '<div style="text-align:center;padding:32px 24px;color:#6F6860;background:#FAF8F4;border:1px dashed #EAE4DA;border-radius:14px;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">' + _esc(title) + '</div><div style="font-size:13px;line-height:1.5;">' + _esc(subtitle || '') + '</div></div>';
  }

  function _val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function _checked(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function _numVal(idOrValue) {
    var raw = String(document.getElementById(idOrValue) ? _val(idOrValue) : (idOrValue == null ? '' : idOrValue)).trim().replace(/\s/g, '');
    if (!raw) return 0;
    var hasComma = raw.indexOf(',') >= 0;
    var hasDot = raw.indexOf('.') >= 0;
    if (hasComma && hasDot) raw = raw.lastIndexOf(',') > raw.lastIndexOf('.') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
    else if (hasComma) raw = raw.replace(/\./g, '').replace(',', '.');
    var n = parseFloat(raw.replace(/[^0-9.-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  function _moneyDisplay(v) {
    if (v == null || v === '') return '';
    var n = _numVal(v);
    return n ? n.toFixed(2).replace('.', ',') : '0,00';
  }

  function _stripMin(v) {
    return String(v || '').replace(/\s*min$/i, '').trim();
  }

  function _postalList(v) {
    if (Array.isArray(v)) return v.map(String).map(function (x) { return x.trim(); }).filter(Boolean);
    return String(v || '').split(/[,\n;]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function _paymentKey(v) {
    return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function _newId(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function _esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    render: render,
    destroy: destroy,
    _switchSub: _switchSub,
    _saveStatusHours: _saveStatusHours,
    _saveAtendimento: _saveAtendimento,
    _addZone: _addZone,
    _removeZone: _removeZone,
    _saveZonas: _saveZonas,
    _savePagamentos: _savePagamentos,
    _saveContato: _saveContato
  };
})();
