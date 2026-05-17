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
    if (!r || r === 'tenant_owner' || r === 'owner') return 'store_owner';
    if (r === 'manager') return 'store_staff';
    if (r === 'master') return 'master_admin';
    return r;
  }

  function normalizeFiscalCountry(value) {
    var code = String(value || '').trim().toUpperCase();
    if (code === 'PT' || code === 'PORTUGAL') return 'PT';
    return 'ES';
  }

  function normalizeBillingProfile(profile) {
    var next = Object.assign({}, profile || {});
    var billing = Object.assign({}, next.billing || {});
    var cycle = next.billingCycle || billing.billingCycle || billing.cycle || '';
    if (cycle) {
      billing.billingCycle = billing.billingCycle || cycle;
      next.billingCycle = cycle;
    }
    if (!next.plan && billing.planSlug) next.plan = billing.planSlug;
    if (!next.billingStatus && billing.status) next.billingStatus = billing.status;
    if (!next.trialEndsAt && billing.trialEndsAt) next.trialEndsAt = billing.trialEndsAt;
    if (!next.activatedAt && billing.activatedAt) next.activatedAt = billing.activatedAt;
    if (!next.canceledAt && billing.canceledAt) next.canceledAt = billing.canceledAt;
    next.billing = billing;
    return next;
  }

  function tenantScore(candidate) {
    var data = candidate && candidate.data ? candidate.data : {};
    var store = data.store || {};
    var billing = data.billing || {};
    var score = 0;
    if (store.slug) score += 100;
    if (store.name) score += 80;
    if (store.publicUrl) score += 60;
    if (billing.planSlug || billing.provider) score += 40;
    if (data.accountStatus === 'active' || data.status === 'active') score += 20;
    if (data.origin === 'firebase_auth_auto_import' && !store.name && !store.slug && !billing.provider && !billing.planSlug) score -= 200;
    return score;
  }

  function tenantUpdatedAt(candidate) {
    var data = candidate && candidate.data ? candidate.data : {};
    var value = data.updatedAt || (data.store && data.store.updatedAt) || data.createdAt;
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    var parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  function tenantCandidateFromSnap(snap) {
    if (!snap || !snap.exists) return null;
    return { id: snap.id, data: snap.data() || {} };
  }

  function choosePreferredTenant(candidates) {
    var valid = [];
    var seen = {};
    (candidates || []).forEach(function (candidate) {
      if (!candidate || !candidate.id || seen[candidate.id]) return;
      seen[candidate.id] = true;
      valid.push(candidate);
    });
    valid.sort(function (a, b) {
      var scoreDiff = tenantScore(b) - tenantScore(a);
      if (scoreDiff) return scoreDiff;
      return tenantUpdatedAt(b) - tenantUpdatedAt(a);
    });
    return valid[0] || null;
  }

  function resolveSystemTenantForBootstrap(user) {
    var db = firebase.firestore();
    var email = String(user.email || '').trim();
    var emails = [];
    if (email) emails.push(email);
    if (email && email.toLowerCase() !== email) emails.push(email.toLowerCase());
    var uidDocPath = 'system_tenants/' + user.uid;

    var uidPromise = db.collection('system_tenants').doc(user.uid).get().then(function (snap) {
      return tenantCandidateFromSnap(snap);
    }).catch(function (err) {
      console.warn('[Auth] bootstrap uid tenant lookup failed', {
        uid: user.uid,
        path: uidDocPath,
        error: err && err.message ? err.message : err
      });
      return null;
    });

    var emailPromises = emails.map(function (value) {
      return db.collection('system_tenants').where('email', '==', value).get().then(function (querySnap) {
        var items = [];
        querySnap.forEach(function (doc) {
          items.push(tenantCandidateFromSnap(doc));
        });
        return items;
      }).catch(function (err) {
        console.warn('[Auth] bootstrap email tenant lookup failed', {
          email: value,
          collection: 'system_tenants',
          error: err && err.message ? err.message : err
        });
        return [];
      });
    });

    var emailFallbackPromise = email ? db.collection('system_tenants').get().then(function (querySnap) {
      var target = email.toLowerCase();
      var items = [];
      querySnap.forEach(function (doc) {
        var candidate = tenantCandidateFromSnap(doc);
        var candidateEmail = candidate && candidate.data ? String(candidate.data.email || '').trim().toLowerCase() : '';
        if (candidateEmail === target) items.push(candidate);
      });
      return items;
    }).catch(function (err) {
      console.warn('[Auth] bootstrap email fallback lookup failed', {
        email: email,
        collection: 'system_tenants',
        error: err && err.message ? err.message : err
      });
      return [];
    }) : Promise.resolve([]);

    return Promise.all([uidPromise].concat(emailPromises).concat([emailFallbackPromise])).then(function (parts) {
      var uidCandidate = parts[0];
      var candidates = [];
      if (uidCandidate) candidates.push(uidCandidate);
      parts.slice(1).forEach(function (items) {
        (items || []).forEach(function (item) {
          if (item) candidates.push(item);
        });
      });
      return {
        uidFound: !!uidCandidate,
        emailMatches: Math.max(0, candidates.length - (uidCandidate ? 1 : 0)),
        selected: choosePreferredTenant(candidates)
      };
    });
  }

  function safeLogMetadata(metadata) {
    var blocked = /password|senha|token|secret|credential|authorization|html|image|payload|customer|cliente/i;
    var out = {};
    Object.keys(metadata || {}).slice(0, 12).forEach(function (key) {
      if (blocked.test(key)) return;
      var value = metadata[key];
      if (value == null || typeof value === 'undefined') return;
      if (typeof value === 'object') value = JSON.stringify(value);
      value = String(value);
      out[key] = value.length > 180 ? value.slice(0, 180) : value;
    });
    return out;
  }

  function recordSystemAccessLog(input) {
    if (!window.firebase || !firebase.firestore) return Promise.resolve(false);
    var allowed = [
      'admin_login',
      'store_published',
      'store_unpublished',
      'store_publication_failed',
      'store_slug_updated',
      'account_settings_updated',
      'store_settings_updated'
    ];
    var action = String(input && input.action || '').trim();
    if (allowed.indexOf(action) < 0) return Promise.resolve(false);
    var user = _currentUser || (firebase.auth && firebase.auth().currentUser);
    var profile = _adminProfile || {};
    var tenantId = String((input && input.tenantUid) || profile.tenantId || (user && user.uid) || '').trim();
    if (!tenantId) return Promise.resolve(false);
    var log = {
      tenantUid: tenantId,
      uid: tenantId,
      email: String((input && input.email) || (user && user.email) || profile.email || '').trim(),
      action: action,
      module: String((input && input.module) || 'admin').trim(),
      entityType: String((input && input.entityType) || 'tenant').trim(),
      entityId: String((input && input.entityId) || tenantId).trim(),
      summary: String((input && input.summary) || action).slice(0, 220),
      source: 'admin',
      severity: ['info', 'warning', 'critical'].indexOf(input && input.severity) >= 0 ? input.severity : 'info',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      metadata: safeLogMetadata((input && input.metadata) || {})
    };
    return firebase.firestore().collection('system_access_logs').add(log).then(function () {
      console.info('[Auth] system access logged', { uid: tenantId, action: action });
      return true;
    }).catch(function (err) {
      console.warn('[Auth] system access log failed', { uid: tenantId, action: action, error: err && err.message ? err.message : err });
      return false;
    });
  }

  function recordAdminAccess(user) {
    if (!user || !_adminProfile) return;
    var tenantId = _adminProfile.tenantId || user.uid;
    var key = 'bf_admin_access_logged_' + user.uid;
    try {
      if (window.sessionStorage && sessionStorage.getItem(key)) return;
      if (window.sessionStorage) sessionStorage.setItem(key, '1');
    } catch (e) {}
    recordSystemAccessLog({
      tenantUid: tenantId,
      email: user.email || '',
      action: 'admin_login',
      module: 'auth',
      entityType: 'tenant',
      entityId: tenantId,
      summary: 'Login no Centro de Controle.',
      metadata: {
        role: _adminProfile.role || '',
        masterTenantId: _adminProfile.masterTenantId || tenantId
      }
    }).then(function (ok) {
      if (!ok) {
        try {
          if (window.sessionStorage) sessionStorage.removeItem(key);
        } catch (e) {}
      }
    });
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
        console.info('[Auth] bootstrap lookup system_tenants', { email: user.email || '', uid: user.uid, path: 'system_tenants/' + user.uid });
        resolveSystemTenantForBootstrap(user).then(function (resolved) {
          if (sessionSeq !== _authSessionSeq || !firebase.auth().currentUser || firebase.auth().currentUser.uid !== user.uid) return;
          if (resolved && resolved.selected) {
            var data = resolved.selected.data || {};
            var bootstrapRole = user.email === MASTER_EMAIL ? 'master_admin' : normalizeRole(data.role || _adminProfile.role);
            _adminProfile = normalizeBillingProfile(Object.assign({}, data, {
              authUid: user.uid,
              uid: user.uid,
              tenantId: user.uid,
              masterTenantId: resolved.selected.id,
              role: bootstrapRole,
              bootstrap: true,
              email: user.email || data.email || ''
            }));
          }
          console.info('[Auth] bootstrap access granted', {
            email: user.email || '',
            uid: user.uid,
            masterTenantId: _adminProfile.masterTenantId || user.uid,
            role: _adminProfile.role,
            fiscalCountry: getFiscalCountry(),
            uidTenantFound: !!(resolved && resolved.uidFound),
            emailTenantMatches: resolved ? resolved.emailMatches : 0
          });
          recordAdminAccess(user);
        }).catch(function (err) {
          console.warn('[Auth] bootstrap system_tenants lookup failed', {
            email: user.email || '',
            uid: user.uid,
            path: 'system_tenants',
            error: err && err.message ? err.message : err
          });
        }).finally(function () {
          if (sessionSeq !== _authSessionSeq) return;
          _authReady = true;
          if (window.Router) Router.resolve();
          if (window.AdminApp && AdminApp.applyFiscalVisibility) AdminApp.applyFiscalVisibility();
        });
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
          _adminProfile = normalizeBillingProfile(Object.assign({ authUid: user.uid, uid: user.uid, tenantId: user.uid, role: normalizedRole || 'store_owner', email: user.email || '' }, data));
          console.info('[Auth] access granted', {
            email: user.email || '',
            uid: user.uid,
            path: docPath,
            status: _adminProfile.status || 'active',
            role: _adminProfile.role || 'store_owner'
          });
          recordAdminAccess(user);
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

  function getMasterTenantId() {
    return _adminProfile ? (_adminProfile.masterTenantId || _adminProfile.tenantId || (_currentUser && _currentUser.uid) || null) : null;
  }

  function getAdminProfile() {
    return _adminProfile;
  }

  function refreshMasterTenantControl() {
    var masterTenantId = getMasterTenantId();
    if (!masterTenantId || !window.firebase || !firebase.firestore || !_adminProfile) return Promise.resolve(_adminProfile);
    return firebase.firestore().collection('system_tenants').doc(masterTenantId).get().then(function (snap) {
      if (!snap.exists) return _adminProfile;
      var data = snap.data() || {};
      _adminProfile = normalizeBillingProfile(Object.assign({}, _adminProfile, data, {
        fiscalCountry: data.fiscalCountry || (data.accountAddress && data.accountAddress.fiscalCountry) || (data.store && data.store.fiscalCountry) || _adminProfile.fiscalCountry || '',
        masterTenantId: masterTenantId,
        masterTenantUpdatedAt: data.updatedAt || _adminProfile.masterTenantUpdatedAt || ''
      }));
      console.info('[Auth] master tenant control refreshed', {
        masterTenantId: masterTenantId,
        fiscalCountry: getFiscalCountry()
      });
      return _adminProfile;
    }).catch(function (err) {
      console.warn('[Auth] master tenant control refresh failed', {
        masterTenantId: masterTenantId,
        error: err && err.message ? err.message : err
      });
      return _adminProfile;
    });
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
    var raw = _adminProfile ? (_adminProfile.fiscalCountry || (_adminProfile.accountAddress && _adminProfile.accountAddress.fiscalCountry) || (_adminProfile.store && _adminProfile.store.fiscalCountry) || 'ES') : 'ES';
    return normalizeFiscalCountry(raw);
  }

  return { init, login, logout, getUser, getTenantId, getMasterTenantId, getAdminProfile, refreshMasterTenantControl, recordSystemAccessLog, requireAuth, isMaster, isReady, getFiscalCountry };
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
    label: 'País fiscal em desenvolvimento',
    fiscalDocumentLabel: 'Documento fiscal',
    fiscalDocumentPlaceholder: 'Número de identificação fiscal',
    fiscalDocumentHint: 'Número de identificação fiscal do fornecedor.',
    regionLabel: 'Região / Província',
    addressLabel: 'Endereço',
    cityLabel: 'Cidade',
    postalCodeLabel: 'Código postal',
    fiscalModuleEnabled: false,
    productTaxEnabled: false,
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
