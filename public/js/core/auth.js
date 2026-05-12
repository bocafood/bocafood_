// js/core/auth.js
window.Auth = (function () {
  'use strict';

  let _currentUser = null;
  let _authReady = false;
  let _adminProfile = null;
  let _authSessionSeq = 0;
  const MASTER_EMAIL = 'bocadobrasil.es@gmail.com';
  const BOOTSTRAP_ADMIN_EMAILS = ['bocadobrasil.es@gmail.com', 'pcruz.digital@gmail.com'];

  function isAllowedAdminRole(role) {
    return ['master_admin', 'store_owner', 'store_staff'].indexOf((role || '').toString()) >= 0;
  }

  function normalizeRole(role) {
    var r = (role || '').toString().trim();
    if (!r || r === 'tenant_owner') return 'store_owner';
    if (r === 'manager') return 'store_staff';
    if (r === 'master') return 'master_admin';
    return r;
  }

  function init() {
    firebase.auth().onAuthStateChanged(function (user) {
      var sessionSeq = ++_authSessionSeq;
      _authReady = false;
      _currentUser = null;
      _adminProfile = null;
      if (window.AdminApp && AdminApp.resetStoreIdentity) AdminApp.resetStoreIdentity();
      if (!user) {
        _authReady = true;
        if (window.Router) Router.resolve();
        return;
      }

      if (BOOTSTRAP_ADMIN_EMAILS.indexOf(user.email || '') >= 0) {
        _currentUser = user;
        _adminProfile = { authUid: user.uid, uid: user.uid, tenantId: user.uid, role: user.email === MASTER_EMAIL ? 'master_admin' : 'store_owner', bootstrap: true, email: user.email || '' };
        _authReady = true;
        console.info('[Auth] bootstrap access granted', { email: user.email || '', uid: user.uid, role: _adminProfile.role });
        if (window.Router) Router.resolve();
        if (window.AdminApp && AdminApp.applyFiscalVisibility) AdminApp.applyFiscalVisibility();
        return;
      }

      var docPath = 'system_tenants/' + user.uid;
      console.info('[Auth] lookup system_tenants', { email: user.email || '', uid: user.uid, path: docPath });
      firebase.firestore().collection('system_tenants').doc(user.uid).get().then(function (snap) {
        if (sessionSeq !== _authSessionSeq || !firebase.auth().currentUser || firebase.auth().currentUser.uid !== user.uid) return;
        var data = snap.exists ? (snap.data() || {}) : null;
        var role = data ? (data.role || 'pending_classification') : '';
        var normalizedRole = data ? normalizeRole(role) : '';
        var status = data ? (data.status || '') : '';
        var deniedReason = '';

        console.info('[Auth] lookup result', {
          email: user.email || '',
          uid: user.uid,
          path: docPath,
          found: !!snap.exists,
          status: status || '(ausente)',
          role: normalizedRole || '(ausente)'
        });

        if (!snap.exists) {
          deniedReason = 'missing_master';
        } else if ((status || '').toLowerCase() !== 'active') {
          deniedReason = 'inactive';
        } else if (normalizedRole === 'store_customer') {
          deniedReason = 'customer';
        } else if (!isAllowedAdminRole(normalizedRole)) {
          deniedReason = 'not_allowed';
        }

        if (!deniedReason) {
          _currentUser = user;
          _adminProfile = Object.assign({ authUid: user.uid, uid: user.uid, tenantId: user.uid, role: normalizedRole || 'store_owner', email: user.email || '' }, data);
          console.info('[Auth] access granted', {
            email: user.email || '',
            uid: user.uid,
            path: docPath,
            status: _adminProfile.status || 'active',
            role: _adminProfile.role || 'store_owner'
          });
          return;
        }

        console.warn('[Auth] access denied', {
          email: user.email || '',
          uid: user.uid,
          path: docPath,
          found: !!snap.exists,
          status: status || '(ausente)',
          role: normalizedRole || '(ausente)',
          reason: deniedReason
        });
        return firebase.auth().signOut().then(function () {
          if (window.AdminApp && AdminApp.showAccessDenied) AdminApp.showAccessDenied(deniedReason);
        });
      }).catch(function (err) {
        if (sessionSeq !== _authSessionSeq) return;
        console.error('[Auth] Erro ao verificar perfil do Centro de Control.', {
          email: user.email || '',
          uid: user.uid,
          path: docPath,
          error: err && err.message ? err.message : err
        });
        return firebase.auth().signOut().then(function () {
          if (window.AdminApp && AdminApp.showAccessDenied) AdminApp.showAccessDenied('error');
        });
      }).finally(function () {
        if (sessionSeq !== _authSessionSeq) return;
        _authReady = true;
        if (window.Router) Router.resolve();
        if (window.AdminApp && AdminApp.applyFiscalVisibility) AdminApp.applyFiscalVisibility();
      });
    });
  }

  function login(email, pass) {
    return firebase.auth().signInWithEmailAndPassword(email, pass);
  }

  function logout() {
    _authSessionSeq++;
    return firebase.auth().signOut();
  }

  function getUser() {
    return _currentUser;
  }

  function getTenantId() {
    return _adminProfile ? (_adminProfile.tenantId || _currentUser.uid) : null;
  }

  function getAdminProfile() {
    return _adminProfile;
  }

  function requireAuth() {
    if (_authReady && !_currentUser) {
      if (window.AdminApp) AdminApp.showLogin();
      return false;
    }
    return true;
  }

  function isMaster() {
    return _adminProfile && (['master_admin', 'master'].indexOf(_adminProfile.role) >= 0 || _currentUser.email === MASTER_EMAIL);
  }

  function isReady() {
    return _authReady;
  }

  // Retorna o código do país fiscal do tenant ('ES' ou 'PT'). Padrão: 'ES'.
  function getFiscalCountry() {
    return _adminProfile ? (_adminProfile.fiscalCountry || 'ES') : 'ES';
  }

  return { init, login, logout, getUser, getTenantId, getAdminProfile, requireAuth, isMaster, isReady, getFiscalCountry };
})();

// ── FiscalConfig — configuração de regras e labels por país fiscal ─────────────
// Disponível globalmente para todos os módulos do painel.
window.FiscalConfig = (function () {
  'use strict';

  var _configs = {
    ES: {
      label: 'Espanha',
      fiscalDocumentLabel: 'Documento fiscal — NIF / NIE / CIF',
      fiscalDocumentPlaceholder: 'Ex: B12345678, 12345678Z ou X1234567L',
      fiscalDocumentHint: 'NIF, NIE ou CIF espanhol.',
      regionLabel: 'Província',
      addressLabel: 'Endereço',
      cityLabel: 'Localidade',
      postalCodeLabel: 'Código postal',
      fiscalModuleEnabled: true,
      productTaxEnabled: true,
      validateNif: function (v) {
        return !v || /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J])$/.test(v);
      },
      nifErrorMsg: 'NIF/CIF inválido. Use um NIF, NIE ou CIF espanhol válido.'
    },
    PT: {
      label: 'Portugal',
      fiscalDocumentLabel: 'Documento fiscal — NIF / NIPC',
      fiscalDocumentPlaceholder: 'Ex: 123456789',
      fiscalDocumentHint: 'NIF ou NIPC português (9 dígitos).',
      regionLabel: 'Distrito',
      addressLabel: 'Morada',
      cityLabel: 'Localidade',
      postalCodeLabel: 'Código postal',
      fiscalModuleEnabled: false,
      productTaxEnabled: false,
      validateNif: function (v) {
        return !v || /^[0-9]{9}$/.test(v);
      },
      nifErrorMsg: 'NIF/NIPC inválido. Use 9 dígitos (sem pontos ou traços).'
    }
  };

  // Configuração genérica para outros países (França, Itália, etc.)
  var _default = {
    label: 'Outro',
    fiscalDocumentLabel: 'Documento fiscal',
    fiscalDocumentPlaceholder: 'Número de identificação fiscal',
    fiscalDocumentHint: 'Número de identificação fiscal do fornecedor.',
    regionLabel: 'Região / Província',
    addressLabel: 'Endereço',
    cityLabel: 'Cidade',
    postalCodeLabel: 'Código postal',
    fiscalModuleEnabled: true,
    productTaxEnabled: true,
    validateNif: function () { return true; },
    nifErrorMsg: ''
  };

  // Mapa de nomes de exibição → código fiscal
  var _nameMap = {
    'ESPAÑA': 'ES', 'ESPANHA': 'ES', 'SPAIN': 'ES',
    'PORTUGAL': 'PT'
  };

  // get(v): aceita código ('ES','PT') ou nome de exibição ('España','Portugal','Francia'...)
  function get(v) {
    if (!v) return _configs.ES;
    var code = String(v).toUpperCase();
    if (_configs[code]) return _configs[code];
    var mapped = _nameMap[code];
    return (mapped && _configs[mapped]) ? _configs[mapped] : _default;
  }

  // Converte nome de exibição → código ('España' → 'ES', 'Portugal' → 'PT', outros → null)
  function countryToCode(displayName) {
    return _nameMap[(displayName || '').toUpperCase()] || null;
  }

  return { get: get, countryToCode: countryToCode };
})();
