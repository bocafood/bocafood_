// js/core/db.js
window.DB = (function () {
  'use strict';

  function _db() { return firebase.firestore(); }

  var SCHEMAS = {
    plano_voo: {
      version: 1,
      label: 'Plano de Voo',
      collections: {
        flight_plans: {
          label: 'Previsões salvas',
          purpose: 'Snapshots de simulação com períodos, cenários, canais, custos, despesas e resultados projetados.',
          fields: {
            id: 'string',
            name: 'string',
            periodType: 'monthly|annual',
            mode: 'historical|manual',
            annualMode: 'linear_growth|linear_decline|seasonality_manual',
            scenario: 'survival|equilibrium|growth|expansion',
            growthPct: 'number',
            declinePct: 'number',
            seasonality: 'array<number>',
            channels: 'array<object>',
            variableCosts: 'array<object>',
            fixedExpenses: 'array<object>',
            summary: 'object',
            periodStart: 'string',
            periodEnd: 'string',
            createdAt: 'timestamp',
            updatedAt: 'timestamp'
          }
        }
      }
    },
    pedidos: {
      version: 1,
      label: 'Pedidos',
      collections: {
        orders: {
          label: 'Pedidos',
          purpose: 'Cabeçalho do pedido com dados do cliente, itens, totais e status.',
          fields: {
            id: 'string',
            orderNumber: 'string',
            customerId: 'string|null',
            customerName: 'string',
            customerPhone: 'string',
            customerEmail: 'string',
            type: 'delivery|pickup|dine_in|takeaway',
            status: 'Pendente|Confirmado|Em preparação|Em camino|Listo para recoger|Entregado|Cancelado',
            paymentStatus: 'pendente|pago|parcial|reembolsado',
            subtotal: 'number',
            originalSubtotal: 'number',
            promoSubtotal: 'number',
            promoDiscountTotal: 'number',
            couponDiscountTotal: 'number',
            discountTotal: 'number',
            finalSubtotal: 'number',
            deliveryFee: 'number',
            total: 'number',
            itemCount: 'number',
            items: 'array<object>',
            address: 'string',
            postalCode: 'string',
            zone: 'string',
            slotKey: 'string',
            slotLabel: 'string',
            note: 'string',
            coupon: 'object|null',
            payment: 'string',
            pointsEarned: 'number',
            source: 'store|admin|whatsapp',
            channel: 'string',
            promoIds: 'array<string>',
            promoNames: 'array<string>',
            promoTypes: 'array<string>',
            promoSummary: 'object|null',
            upsellIds: 'array<string>',
            createdAt: 'timestamp',
            updatedAt: 'timestamp'
          }
        },
        order_items: {
          label: 'Itens do pedido',
          purpose: 'Linha detalhada de itens por pedido, útil para análise e relatórios futuros.',
          fields: {
            id: 'string',
            orderId: 'string',
            productId: 'string',
            productName: 'string',
            qty: 'number',
            originalUnitPrice: 'number',
            promoUnitPrice: 'number',
            price: 'number',
            discount: 'number',
            total: 'number',
            promoId: 'string|null',
            promoType: 'string|null',
            promoName: 'string|null',
            upsellId: 'string|null',
            createdAt: 'timestamp',
            updatedAt: 'timestamp'
          }
        },
        order_payments: {
          label: 'Pagamentos do pedido',
          purpose: 'Registro de pagamentos, confirmações e diferenças parciais.',
          fields: {
            id: 'string',
            orderId: 'string',
            method: 'string',
            amount: 'number',
            status: 'pendente|pago|parcial|falhou',
            reference: 'string',
            note: 'string',
            paidAt: 'timestamp|null',
            createdAt: 'timestamp',
            updatedAt: 'timestamp'
          }
        },
        order_events: {
          label: 'Eventos do pedido',
          purpose: 'Histórico simples de mudanças de status e ações no pedido.',
          fields: {
            id: 'string',
            orderId: 'string',
            type: 'created|status_changed|payment_added|note_added|cancelled',
            fromStatus: 'string|null',
            toStatus: 'string|null',
            actor: 'string|null',
            note: 'string',
            createdAt: 'timestamp'
          }
        },
        orderSlots: {
          label: 'Slots de entrega',
          purpose: 'Controle de capacidade por data e horário.',
          fields: {
            id: 'string',
            count: 'number',
            max: 'number',
            date: 'string',
            time: 'string',
            active: 'boolean',
            createdAt: 'timestamp',
            updatedAt: 'timestamp'
          }
        }
      }
    }
  };

  function _tenantPath(path) {
    const tid = Auth.getTenantId();
    if (!tid) throw new Error('No tenant ID — user not authenticated');
    return 'tenants/' + tid + '/' + path;
  }

  function col(path) {
    return _db().collection(_tenantPath(path));
  }

  function doc(colPath, id) {
    return _db().collection(_tenantPath(colPath)).doc(id);
  }

  function getAll(colPath) {
    return col(colPath).get().then(function (snap) {
      return snap.docs.map(function (d) { return Object.assign({}, d.data(), { id: d.id }); });
    });
  }

  function getDoc(colPath, id) {
    return doc(colPath, id).get().then(function (d) {
      if (!d.exists) return null;
      return Object.assign({}, d.data(), { id: d.id });
    });
  }

  function add(colPath, data) {
    var ts = firebase.firestore.FieldValue.serverTimestamp();
    return col(colPath).add(Object.assign({}, data, { createdAt: ts, updatedAt: ts }));
  }

  function set(colPath, id, data) {
    return doc(colPath, id).set(data);
  }

  function update(colPath, id, data) {
    var ts = firebase.firestore.FieldValue.serverTimestamp();
    return doc(colPath, id).update(Object.assign({}, data, { updatedAt: ts }));
  }

  function remove(colPath, id) {
    return doc(colPath, id).delete();
  }

  function listen(colPath, callback) {
    return col(colPath).onSnapshot(function (snap) {
      var docs = snap.docs.map(function (d) { return Object.assign({}, d.data(), { id: d.id }); });
      callback(docs);
    }, function (err) { console.error('DB.listen error', err); });
  }

  function listenQuery(colPath, field, op, value, callback) {
    return col(colPath).where(field, op, value).onSnapshot(function (snap) {
      var docs = snap.docs.map(function (d) { return Object.assign({}, d.data(), { id: d.id }); });
      callback(docs);
    }, function (err) { console.error('DB.listenQuery error', err); });
  }

  // Root-level doc reference (for config sub-docs)
  function docRoot(colPath, id) {
    const tid = Auth.getTenantId();
    if (!tid) throw new Error('No tenant ID');
    return _db().collection('tenants/' + tid + '/' + colPath).doc(id);
  }

  function getDocRoot(colPath, id) {
    return docRoot(colPath, id).get().then(function (d) {
      if (!d.exists) return null;
      return Object.assign({}, d.data(), { id: d.id });
    });
  }

  function setDocRoot(colPath, id, data) {
    return docRoot(colPath, id).set(data, { merge: true });
  }

  function getSchema(name) {
    return SCHEMAS[name] ? JSON.parse(JSON.stringify(SCHEMAS[name])) : null;
  }

  function ensureSchemaDoc(name) {
    var schema = getSchema(name);
    if (!schema) return Promise.resolve(null);
    return getDocRoot('config', name + '_schema').then(function (existing) {
      if (existing) return existing;
      return setDocRoot('config', name + '_schema', schema).then(function () { return schema; });
    }).catch(function (err) {
      console.error('DB.ensureSchemaDoc error', err);
      return schema;
    });
  }

  function getSystemConfig() {
    return firebase.firestore().collection('system').doc('config').get()
      .then(function (d) { return d.exists ? (d.data() || {}) : {}; })
      .catch(function () { return {}; });
  }

  function setSystemConfig(data) {
    return firebase.firestore().collection('system').doc('config').set(data, { merge: true });
  }

  return { col, doc, getAll, getDoc, add, set, update, remove, listen, listenQuery, docRoot, getDocRoot, setDocRoot, getSchema, ensureSchemaDoc, getSystemConfig, setSystemConfig };
})();

// ── BocaPlaces — global Google Maps/Places autocomplete utility ──────────────
// Reads the platform-level config from Firestore system/config (written by Admin Master).
// All address fields across modules call BocaPlaces.init(inputId) to activate autocomplete.
// Fails silently when key is not configured or Maps API is unavailable.
window.BocaPlaces = (function () {
  var _cfg = null;      // cached config — null means not yet loaded
  var _loading = false; // script tag is being loaded
  var _queue = [];      // callbacks waiting for script to finish loading

  function loadConfig() {
    if (_cfg !== null) return Promise.resolve(_cfg);
    try {
      return firebase.firestore().collection('system').doc('config').get()
        .then(function (d) { _cfg = d.exists ? (d.data() || {}) : {}; return _cfg; })
        .catch(function () { _cfg = {}; return {}; });
    } catch (e) { _cfg = {}; return Promise.resolve({}); }
  }

  function getKey() {
    if (!_cfg) return '';
    return (_cfg.googleMapsEnabled !== false && _cfg.googleMapsKey) ? String(_cfg.googleMapsKey) : '';
  }

  function loadScript(cb) {
    var key = getKey();
    if (!key) return; // no key — silent noop
    if (window.google && window.google.maps && window.google.maps.places) { cb(); return; }
    if (_loading) { _queue.push(cb); return; }
    _loading = true;
    window._bocaPlacesReady = function () {
      _loading = false;
      cb();
      var fn; while ((fn = _queue.shift())) fn();
    };
    var s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&v=weekly&loading=async&libraries=places&callback=_bocaPlacesReady';
    s.async = true;
    s.defer = true;
    s.onerror = function () { _loading = false; };
    document.head.appendChild(s);
  }

  function loadPlacesLibrary() {
    if (window.google && window.google.maps && typeof window.google.maps.importLibrary === 'function') {
      return window.google.maps.importLibrary('places').catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  function _componentMap(addressComponents) {
    var out = {};
    (addressComponents || []).forEach(function (item) {
      var types = item.types || [];
      var longText = item.longText || item.long_name || item.name || '';
      var shortText = item.shortText || item.short_name || longText;
      types.forEach(function (type) {
        out[type] = { longText: longText, shortText: shortText };
      });
    });
    return out;
  }

  function _componentValue(map, keys, shortText) {
    for (var i = 0; i < keys.length; i++) {
      var item = map[keys[i]];
      if (item) return shortText ? item.shortText : item.longText;
    }
    return '';
  }

  function _latLng(location) {
    if (!location) return { lat: '', lng: '' };
    var lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    var lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    return {
      lat: lat == null ? '' : lat,
      lng: lng == null ? '' : lng
    };
  }

  function normalizePlace(place) {
    place = place || {};
    var json = typeof place.toJSON === 'function' ? place.toJSON() : place;
    var components = place.addressComponents || json.addressComponents || json.address_components || [];
    var map = _componentMap(components);
    var loc = _latLng(place.location || json.location);
    var street = _componentValue(map, ['route']);
    var number = _componentValue(map, ['street_number']);
    var addressLine = [street, number].filter(Boolean).join(', ');
    return {
      formattedAddress: place.formattedAddress || json.formattedAddress || json.formatted_address || '',
      addressLine: addressLine,
      street: street,
      number: number,
      neighborhood: _componentValue(map, [
        'neighborhood',
        'sublocality_level_1',
        'sublocality_level_2',
        'sublocality_level_3',
        'sublocality',
        'administrative_area_level_4',
        'administrative_area_level_5'
      ]),
      city: _componentValue(map, ['locality', 'postal_town', 'administrative_area_level_3']),
      province: _componentValue(map, ['administrative_area_level_2', 'administrative_area_level_1']),
      country: _componentValue(map, ['country']),
      countryCode: _componentValue(map, ['country'], true),
      postalCode: _componentValue(map, ['postal_code']),
      latitude: loc.lat,
      longitude: loc.lng,
      placeId: place.id || place.placeId || json.id || json.place_id || ''
    };
  }

  function _syncInput(input, value) {
    input.value = value || '';
    try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }

  function _setField(id, value) {
    var el = document.getElementById(id);
    if (el && value) _syncInput(el, value);
  }

  function _setCountry(id, data) {
    var map = {
      Spain: 'España', ES: 'España',
      Portugal: 'Portugal', PT: 'Portugal',
      France: 'Francia', FR: 'Francia',
      Italy: 'Italia', IT: 'Italia',
      Germany: 'Alemania', DE: 'Alemania',
      'United Kingdom': 'Reino Unido', GB: 'Reino Unido', UK: 'Reino Unido',
      Belgium: 'Bélgica', BE: 'Bélgica',
      Netherlands: 'Países Bajos', NL: 'Países Bajos'
    };
    _setField(id, map[data.country] || map[data.countryCode] || data.country);
  }

  function _fillRelatedFields(inputId, data) {
    if (inputId === 'cfg-address-line') {
      _setField('cfg-address-number', data.number);
      _setField('cfg-city', data.city);
      _setField('cfg-postal', data.postalCode);
      _setField('cfg-pickup-area', data.neighborhood);
      _setField('cfg-address-region', data.province);
      _setCountry('cfg-address-country', data);
    } else if (inputId === 'cfg-company-address') {
      _setField('cfg-company-number', data.number);
      _setField('cfg-company-neighborhood', data.neighborhood);
      _setField('cfg-company-city', data.city);
      _setField('cfg-company-postal', data.postalCode);
      _setField('cfg-company-region', data.province);
      _setField('cfg-company-country', data.countryCode || data.country);
    } else if (inputId === 'cfg-tpl-pickup-address') {
      _setField('cfg-tpl-pickup-number', data.number);
      _setField('cfg-tpl-pickup-area', data.neighborhood);
    } else if (inputId === 'cfg-tpl-delivery-city') {
      _setField('cfg-tpl-delivery-city', data.city || data.formattedAddress);
      _setField('cfg-tpl-delivery-province', data.province);
      _setField('cfg-tpl-delivery-postal', data.postalCode);
      _setSelectValue('cfg-tpl-delivery-country', data.countryCode);
    } else if (inputId === 'tpl-delivery-area-city') {
      _setField('tpl-delivery-area-city', data.city || data.formattedAddress);
      _setField('tpl-delivery-area-province', data.province);
      _setField('tpl-delivery-area-postal', data.postalCode);
      _setSelectValue('tpl-delivery-area-country', data.countryCode);
    } else if (inputId === 'cli-address') {
      _setField('cli-number', data.number);
      _setField('cli-hood', data.neighborhood);
      _setField('cli-zip', data.postalCode);
      _setField('cli-state', data.province);
      _setCountry('cli-country', data);
    } else if (inputId === 'tpl-address') {
      _setField('tpl-number', data.number);
      _setField('tpl-neighborhood', data.neighborhood);
      _setField('tpl-city', data.city);
      _setField('tpl-region', data.province);
      _setField('tpl-postal', data.postalCode);
      _setCountry('tpl-country', data);
    } else if (inputId === 'op-address') {
      _setField('op-number', data.number);
      _setField('op-neighborhood', data.neighborhood);
      _setField('op-city', data.city);
      _setField('op-region', data.province);
      _setField('op-postal', data.postalCode);
      _setCountry('op-country', data);
    }
  }

  function _setSelectValue(id, value) {
    var el = document.getElementById(id);
    if (!el || !value) return;
    el.value = value;
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }

  function init(inputId, opts) {
    opts = opts || {};
    loadConfig().then(function () {
      loadScript(function () {
        loadPlacesLibrary().then(function () {
          var input = document.getElementById(inputId);
          if (!input || input._bocaAc) return;
          try {
            if (!window.google || !window.google.maps || !window.google.maps.places || !window.google.maps.places.PlaceAutocompleteElement) return;
            var placeEl = new window.google.maps.places.PlaceAutocompleteElement();
            placeEl.id = inputId + '-places';
            placeEl.style.cssText = 'display:block;width:100%;min-height:40px;margin-bottom:8px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;color-scheme:light;font-family:inherit;font-size:13px;box-shadow:0 1px 2px rgba(31,31,31,.03);--gmp-mat-color-surface:#fff;--gmp-mat-color-on-surface:#1F1F1F;--gmp-mat-color-primary:#B42318;';
            placeEl.setAttribute('requested-language', 'es');
            placeEl.setAttribute('unit-system', 'metric');
            placeEl.setAttribute('aria-label', 'Buscar endereço');
            try { placeEl.placeholder = input.placeholder || 'Buscar endereço'; } catch (e) {}
            if (input.value) placeEl.value = input.value;
            input.insertAdjacentElement('beforebegin', placeEl);
            input._bocaAc = true;
            input._bocaPlaceElement = placeEl;
            window.setTimeout(function () {
              if (input._bocaPlaceElement === placeEl) input.style.display = 'none';
            }, 0);
            placeEl.addEventListener('input', function () {
              if (placeEl.value != null) _syncInput(input, placeEl.value);
            });
            placeEl.addEventListener('gmp-select', function (event) {
              Promise.resolve().then(function () {
                var prediction = event && event.placePrediction;
                var place = prediction && typeof prediction.toPlace === 'function' ? prediction.toPlace() : (event && event.place);
                if (!place) return null;
                if (typeof place.fetchFields === 'function') {
                  return place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'] }).then(function () { return place; });
                }
                return place;
              }).then(function (place) {
                if (!place) return;
                var data = normalizePlace(place);
                _syncInput(input, data.addressLine || data.formattedAddress || placeEl.value || input.value);
                _fillRelatedFields(inputId, data);
                if (typeof opts.onPlace === 'function') opts.onPlace(data, place);
              }).catch(function () { /* keep manual fallback */ });
            });
          } catch (e) { /* fail silently */ }
        }).catch(function () { /* fail silently */ });
      });
    }).catch(function () { /* fail silently */ });
  }

  function setConfig(data) {
    return firebase.firestore().collection('system').doc('config')
      .set(data, { merge: true })
      .then(function () { _cfg = Object.assign(_cfg || {}, data); });
  }

  return { loadConfig: loadConfig, getKey: getKey, loadScript: loadScript, init: init, normalizePlace: normalizePlace, setConfig: setConfig };
})();
