// js/modules/configuracoes.js
window.Modules = window.Modules || {};
Modules.Configuracoes = (function () {
  'use strict';

  var _activeSub = 'geral';
  var _config = {};
  var _unidades = [];
  var _editingUnidadeId = null;
  var _fornecedores = [];
  var _editingFornecedorId = null;
  var _systemTenant = {};
  var _systemConfig = {};
  var _masterTenantControl = {};
  var _publicationProducts = [];
  var _publicationCategories = [];
  var _financeCategories = [];
  var _bankAccounts = [];
  var _fiscalEnabledDraft = null;
  var CONFIG_FN_BASE = 'https://us-central1-bocado-brasil.cloudfunctions.net/';

  var TABS = [
    { key: 'geral', label: 'Geral' },
    { key: 'conta_usuario', label: 'Usuário' },
    { key: 'tpv', label: 'Venda presencial' },
    { key: 'fiscal', label: 'Fiscal' },
    { key: 'integracoes', label: 'Integrações' },
    { key: 'plano', label: 'Plano' },
    { key: 'canais_venda', label: 'Canais de venda' }
  ];

  var CONFIG_TABS = ['geral', 'conta_usuario', 'tpv', 'fiscal', 'dominio', 'integracoes', 'pagamentos', 'financeiro', 'endereco', 'seo', 'template', 'canais_venda'];

  var DEFAULT_UNIDADES = [
    { name: 'Quilograma', symbol: 'kg', type: 'massa' },
    { name: 'Grama', symbol: 'g', type: 'massa' },
    { name: 'Litro', symbol: 'L', type: 'volume' },
    { name: 'Mililitro', symbol: 'ml', type: 'volume' },
    { name: 'Unidade', symbol: 'un', type: 'unidade' },
    { name: 'Dúzia', symbol: 'dz', type: 'unidade' },
    { name: 'Pacote', symbol: 'pct', type: 'unidade' }
  ];

  function render(sub) {
    _activeSub = _normalizeSub(sub || 'geral');
    _fiscalEnabledDraft = null;
    var app = document.getElementById('app');
    app.innerHTML = '<section class="module-page">' +
      '<div id="config-content" class="module-content narrow"><div class="loading-inline">Carregando...</div></div>' +
      '</section>';
    _load().then(function () { _renderSub(); });
  }

  function _normalizeSub(sub) {
    if (sub === 'link-da-loja' || sub === 'link') return 'dominio';
    return sub || 'geral';
  }

  function _renderTabs() {
    var el = document.getElementById('config-tabs');
    if (!el) return;
    el.innerHTML = TABS.map(function (t) {
      return '<button type="button" class="config-tab-btn ' + (t.key === _activeSub ? 'active' : '') + '" onclick="Modules.Configuracoes._switchSub(\'' + t.key + '\')">' + t.label + '</button>';
    }).join('');
  }

  function _configVisualStyles() {
    return '<style id="config-visual-style">' +
      '.config-wrap{display:flex;flex-direction:column;gap:18px;max-width:1040px;margin:0 auto;width:100%;}' +
      '.config-tabs{display:flex;gap:6px;align-items:center;overflow-x:auto;padding:4px 2px 8px;border-bottom:1px solid #EAE4DA;scrollbar-width:thin;}' +
      '.config-tab-btn{appearance:none;-webkit-appearance:none;border:0;background:transparent;color:#6F6860;border-radius:999px;padding:9px 13px;font:800 13px/1.1 inherit;white-space:nowrap;cursor:pointer;position:relative;transition:background .16s ease,color .16s ease;}' +
      '.config-tab-btn:hover{background:#FFF8F6;color:#B42318;}' +
      '.config-tab-btn.active{background:#FFF0EE;color:#B42318;}' +
      '.config-tab-btn.active:after{content:"";position:absolute;left:13px;right:13px;bottom:-9px;height:3px;border-radius:999px;background:#B42318;}' +
      '.bf-field label,.bf-field>span,.bf-field-label{text-transform:uppercase;font-size:10px;font-weight:800;letter-spacing:.055em;color:#8A7E7C;}' +
      '.bf-input,.bf-select,.bf-textarea{border-color:#D8C9C5;background:#fff;border-radius:10px;color:#2F2927;}' +
      '.bf-input,.bf-select{min-height:42px;}' +
      '.bf-select{appearance:none;-webkit-appearance:none;padding-right:38px;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;}' +
      '.bf-phone-row{display:grid;grid-template-columns:minmax(112px,132px) minmax(0,1fr);gap:8px;align-items:center;}' +
      '.bf-phone-row .bf-select{min-width:0;padding-left:10px;padding-right:30px;}' +
      '.account-block{padding:0 0 18px;border-bottom:none;}' +
      '.account-block:last-of-type{padding-bottom:0;}' +
      '.account-block-title{margin:0 0 4px;color:#1F1F1F;font-size:13px;font-weight:800;line-height:1.2;}' +
      '.account-block-text{margin:0 0 12px;color:#6F6860;font-size:12px;line-height:1.45;}' +
      '.account-field-help{font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;}' +
      '.account-settings .bf-input,.account-settings .bf-select{background:#FFFCF8;border-color:#E8DCD7;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.account-settings .bf-input:focus,.account-settings .bf-select:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);outline:none;}' +
      '.account-settings .bf-input[readonly]{background:#F8F4F1;color:#6F6860;}' +
      '.account-settings{padding:18px 20px;}' +
      '.account-settings .bf-section-header{margin-bottom:14px;}' +
      '.account-settings .bf-form-grid{gap:14px 16px;align-items:start;}' +
      '.account-settings .account-block{padding-bottom:14px;}' +
      '.account-settings .account-block + .account-block{padding-top:2px;}' +
      '.account-settings .account-block-title{margin-bottom:2px;}' +
      '.account-settings .account-block-text{margin-bottom:10px;}' +
      '.account-phone-box{display:grid;grid-template-columns:112px minmax(0,1fr);gap:8px;align-items:center;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px;}' +
      '.account-phone-box .bf-select,.account-phone-box .bf-input{border:0;background:transparent;box-shadow:none;min-height:36px;}' +
      '.account-phone-box .bf-select{border-right:1px solid #E8DCD7;border-radius:8px;padding-left:8px;}' +
      '.account-phone-box .bf-input{padding-left:8px;}' +
      '.account-phone-box:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.account-reset-action{margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}' +
      '.account-reset-btn{height:34px;border:1px solid #E4D8D3;background:#fff;color:#B42318;border-radius:10px;padding:0 11px;font-size:11px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 6px 14px rgba(31,31,31,.04);}' +
      '.account-reset-btn:hover{background:#FFF8F6;border-color:#E7C9C3;}' +
      '.account-reset-btn:disabled{opacity:.55;cursor:not-allowed;}' +
      '.account-card-footer{display:flex;justify-content:flex-end;padding-top:18px;border-top:none;}' +
      '@media(max-width:640px){.config-tabs{padding-bottom:10px}.config-tab-btn{padding:8px 11px;font-size:12px}.bf-phone-row{grid-template-columns:minmax(96px,118px) minmax(0,1fr)}.account-phone-box{grid-template-columns:100px minmax(0,1fr)}.account-settings .bf-form-grid,.fiscal-business .bf-form-grid{grid-template-columns:1fr!important}}' +
    '</style>';
  }

  function _ensureConfigModalStyles() {
    if (document.getElementById('config-modal-style')) return;
    var style = document.createElement('style');
    style.id = 'config-modal-style';
    style.textContent = '' +
      '.config-modal-card{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(31,31,31,.045),inset 0 1px 0 rgba(255,255,255,.78);font-family:Manrope,Inter,sans-serif;color:#211815;}' +
      '.config-modal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start;}' +
      '.config-modal-grid.compact{grid-template-columns:minmax(0,1fr) 110px 150px;align-items:end;}' +
      '.config-modal-field-full{grid-column:1/-1;}' +
      '.config-modal-field{display:block;min-width:0;}' +
      '.config-modal-field>span{display:block;margin-bottom:5px;font-size:11px;font-weight:700;color:#6F6860;letter-spacing:.02em;text-transform:none;}' +
      '.config-modal-input,.config-modal-select,.config-modal-textarea{width:100%;box-sizing:border-box;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#211815;font-family:Manrope,Inter,sans-serif;font-size:14px;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.82);transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.config-modal-input,.config-modal-select{height:42px;padding:0 12px;}' +
      '.config-modal-textarea{min-height:86px;padding:10px 12px;line-height:1.45;resize:vertical;}' +
      '.config-modal-input:focus,.config-modal-select:focus,.config-modal-textarea:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08),inset 0 1px 0 rgba(255,255,255,.82);}' +
      '.config-modal-select-wrap{position:relative;display:block;}' +
      '.config-modal-select{appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:42px;background:#FFFCF8;}' +
      '.config-modal-select-arrow{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:19px;color:#6F6860;line-height:1;pointer-events:none;}' +
      '.config-modal-help{font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:5px;}' +
      '.config-modal-footer{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;width:100%;}' +
      '.config-modal-btn{height:40px;padding:0 14px;border-radius:12px;font-family:Manrope,Inter,sans-serif;font-size:13px;font-weight:650;cursor:pointer;}' +
      '.config-modal-btn.secondary{border:1px solid #E8DCD7;background:#fff;color:#6F6860;}' +
      '.config-modal-btn.primary{border:none;background:#B42318;color:#fff;box-shadow:0 8px 18px rgba(180,35,24,.16);}' +
      '@media(max-width:680px){.config-modal-grid,.config-modal-grid.compact{grid-template-columns:1fr}.config-modal-footer{justify-content:stretch}.config-modal-btn{flex:1 1 140px}}';
    document.head.appendChild(style);
  }

  function _ensureStoreLinkStyles() {
    if (document.getElementById('store-link-style')) return;
    var style = document.createElement('style');
    style.id = 'store-link-style';
    style.textContent = '' +
      '.store-link-page{display:flex;flex-direction:column;gap:16px;max-width:1040px;margin:0 auto;width:100%;font-family:Manrope,Inter,sans-serif;color:#211815;}' +
      '.store-link-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.store-link-head h2{font-size:22px;font-weight:700;line-height:1.15;margin:0 0 6px;color:#1F1F1F;}' +
      '.store-link-head p{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:680px;}' +
      '.store-link-chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}' +
      '.store-link-chip{display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EADFD8;color:#6F6860;font-size:12px;font-weight:600;box-shadow:0 1px 2px rgba(31,31,31,.025);}' +
      '.store-link-card,.store-link-hero,.store-link-note,.store-link-footer{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;box-shadow:0 10px 24px rgba(31,31,31,.045),inset 0 1px 0 rgba(255,255,255,.78);}' +
      '.store-link-card{padding:16px 18px;}' +
      '.store-link-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:18px 20px;}' +
      '.store-link-hero-copy{min-width:0;}' +
      '.store-link-hero-copy span{display:block;font-size:12px;font-weight:600;color:#6F6860;margin-bottom:5px;}' +
      '.store-link-hero-copy strong{display:block;font-size:clamp(21px,2.35vw,30px);font-weight:700;color:#1F1F1F;line-height:1.08;word-break:break-word;}' +
      '.store-link-hero-copy small{display:block;font-size:12px;color:#8A7E7C;line-height:1.4;margin-top:7px;}' +
      '.store-link-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(232,221,213,.82);}' +
      '.store-link-card-head h3{font-size:15px;font-weight:700;color:#211815;line-height:1.2;margin:0 0 4px;}' +
      '.store-link-card-head p{font-size:12px;color:#82766F;line-height:1.42;margin:0;max-width:720px;}' +
      '.store-link-status{display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;font-size:12px;font-weight:650;border:1px solid #EAE4DA;background:#FAF8F4;color:#6F6860;}' +
      '.store-link-status.ok{background:#F0FFF4;border-color:#D9F2E3;color:#1F6F43;}' +
      '.store-link-status.warn{background:#FFF7ED;border-color:#F3D9C7;color:#B45309;}' +
      '.store-link-status.neutral{background:#FAF8F4;border-color:#EAE4DA;color:#6F6860;}' +
      '.store-link-field-grid{display:grid;grid-template-columns:minmax(260px,420px);gap:12px;align-items:start;}' +
      '.store-link-field{display:block;min-width:0;}' +
      '.store-link-field span{display:block;margin-bottom:5px;font-size:11px;font-weight:700;color:#6F6860;letter-spacing:.02em;}' +
      '.store-link-input-wrap{position:relative;display:block;}' +
      '.store-link-field input{width:100%;height:42px;box-sizing:border-box;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#211815;font-family:Manrope,Inter,sans-serif;font-size:14px;outline:none;padding:0 12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.82);transition:border-color .16s,box-shadow .16s,background .16s;}' +
      '.store-link-input-wrap input{padding-right:44px;}' +
      '.store-link-field input:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08),inset 0 1px 0 rgba(255,255,255,.82);}' +
      '.store-link-validation-icon{position:absolute;right:11px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:999px;display:inline-flex!important;align-items:center;justify-content:center;font-size:17px;background:#FAF8F4;color:#8A7E7C;pointer-events:none;}' +
      '.store-link-field.valid input{border-color:#BEE5CA;background:#F8FFF9;}' +
      '.store-link-field.valid .store-link-validation-icon{background:#EAF8EF;color:#1F7A43;}' +
      '.store-link-field.invalid input{border-color:#F1B8AD;background:#FFF8F6;}' +
      '.store-link-field.invalid .store-link-validation-icon{background:#FFF0EE;color:#B42318;}' +
      '.store-link-field.valid small{color:#1F6F43;}' +
      '.store-link-field.invalid small{color:#B42318;}' +
      '.store-link-field small{display:block;font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:5px;}' +
      '.store-link-url-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}' +
      '.store-link-status-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}' +
      '.store-link-secondary-btn,.store-link-primary-btn{height:40px;border-radius:12px;font-family:Manrope,Inter,sans-serif;font-size:13px;font-weight:650;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;}' +
      '.store-link-secondary-btn{padding:0 14px;border:1px solid #E8DCD7;background:#fff;color:#6F6860;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.store-link-secondary-btn .mi{font-size:17px;}' +
      '.store-link-primary-btn{padding:0 16px;border:none;background:#B42318;color:#fff;box-shadow:0 8px 18px rgba(180,35,24,.16);}' +
      '.store-link-note{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;}' +
      '.store-link-note>.mi{width:36px;height:36px;border-radius:12px;background:#FFFCF8;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:21px;}' +
      '.store-link-note strong{display:block;font-size:13px;font-weight:700;color:#211815;margin-bottom:3px;}' +
      '.store-link-note p{font-size:12px;color:#6F6860;line-height:1.45;margin:0;}' +
      '.store-link-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:sticky;bottom:0;z-index:2;padding:12px 14px;}' +
      '.store-link-footer div{font-size:13px;color:#6F6860;line-height:1.45;}' +
      '@media(max-width:720px){.store-link-hero{grid-template-columns:1fr}.store-link-secondary-btn,.store-link-primary-btn{width:100%}.store-link-field-grid{grid-template-columns:1fr}.store-link-footer{position:static}}';
    document.head.appendChild(style);
  }

  function _switchSub(key) {
    _activeSub = _normalizeSub(key);
    _renderSub();
    Router.navigate('configuracoes/' + _activeSub);
  }

  function _recordActivity(input) {
    if (!window.Auth || !Auth.recordSystemAccessLog) return Promise.resolve(false);
    return Auth.recordSystemAccessLog(input || {}).catch(function () { return false; });
  }

  function _load() {
    var tenantPromise = _loadSystemTenant().catch(function () { return {}; });
    var masterTenantPromise = _loadMasterTenantControl().catch(function () { return {}; });
    var financeCategoriesPromise = DB.getAll ? DB.getAll('financeiro_categorias').catch(function () { return []; }) : Promise.resolve([]);
    var bankAccountsPromise = DB.getAll ? DB.getAll('contas_bancarias').catch(function () { return []; }) : Promise.resolve([]);
    var systemConfigPromise = DB.getSystemConfig ? DB.getSystemConfig().catch(function () { return {}; }) : Promise.resolve({});
    return Promise.all(CONFIG_TABS.map(function (k) { return DB.getDocRoot('config', k); }).concat([tenantPromise, masterTenantPromise, financeCategoriesPromise, bankAccountsPromise, systemConfigPromise]))
      .then(function (docs) {
        _config = {};
        CONFIG_TABS.forEach(function (k, i) { _config[k] = docs[i] || {}; });
        _systemTenant = docs[CONFIG_TABS.length] || {};
        _masterTenantControl = docs[CONFIG_TABS.length + 1] || _systemTenant || {};
        _financeCategories = docs[CONFIG_TABS.length + 2] || [];
        _bankAccounts = docs[CONFIG_TABS.length + 3] || [];
        _systemConfig = docs[CONFIG_TABS.length + 4] || {};
      })
      .catch(function (err) {
        console.error('Config load error', err);
        _config = {};
        _systemTenant = {};
        _systemConfig = {};
        _masterTenantControl = {};
        _financeCategories = [];
        _bankAccounts = [];
      });
  }

  function _loadSystemTenant() {
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId || !window.firebase || !firebase.firestore) return Promise.resolve({});
    console.info('[Configuracoes] lendo tenant Master', { tenantUid: tenantId, path: 'system_tenants/' + tenantId });
    return firebase.firestore().collection('system_tenants').doc(tenantId).get().then(function (snap) {
      if (!snap.exists) return {};
      return Object.assign({}, snap.data() || {}, { id: snap.id });
    });
  }

  function _loadMasterTenantControl() {
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    var masterTenantId = window.Auth && Auth.getMasterTenantId ? Auth.getMasterTenantId() : tenantId;
    if (!masterTenantId || !window.firebase || !firebase.firestore) return Promise.resolve({});
    var refreshPromise = window.Auth && Auth.refreshMasterTenantControl ? Auth.refreshMasterTenantControl() : Promise.resolve(null);
    return refreshPromise.then(function () {
      if (masterTenantId === tenantId) return _loadSystemTenant();
      console.info('[Configuracoes] lendo tenant de controle Master', { tenantUid: masterTenantId, path: 'system_tenants/' + masterTenantId });
      return firebase.firestore().collection('system_tenants').doc(masterTenantId).get().then(function (snap) {
        if (!snap.exists) return {};
        return Object.assign({}, snap.data() || {}, { id: snap.id });
      });
    });
  }

  function _renderSub() {
    if (_activeSub === 'geral') return _renderGeral();
    if (_activeSub === 'conta_usuario') return _renderContaUsuario();
    if (_activeSub === 'produtos') { _activeSub = 'geral'; return _renderGeral(); }
    if (_activeSub === 'tpv') return _renderTpv();
    if (_activeSub === 'fiscal') return _renderFiscalActivation();
    if (_activeSub === 'dominio') return _renderDominio();
    if (_activeSub === 'integracoes') return _renderIntegracoes();
    if (_activeSub === 'plano') return _renderPlano();
    if (_activeSub === 'canais_venda') return _renderCanaisVenda();
    if (_activeSub === 'pagamentos') return _renderPagamentos();
    if (_activeSub === 'endereco') return _renderEndereco();
    if (_activeSub === 'seo') return _renderSeo();
    if (_activeSub === 'template') return _renderTemplate();
    _activeSub = 'geral';
    return _renderGeral();
  }

  function _field(id, label, value, placeholder, type) {
    return '<label class="field bf-field"><span>' + _esc(label) + '</span><input id="' + id + '" class="bf-input" type="' + (type || 'text') + '" value="' + _esc(value || '') + '" placeholder="' + _esc(placeholder || '') + '"></label>';
  }

  function _textarea(id, label, value, placeholder) {
    return '<label class="field bf-field"><span>' + _esc(label) + '</span><textarea id="' + id + '" class="bf-textarea" placeholder="' + _esc(placeholder || '') + '">' + _esc(value || '') + '</textarea></label>';
  }

  function _appearanceState() {
    window._appearanceImageState = window._appearanceImageState || {};
    return window._appearanceImageState;
  }

  function _appearanceDraftId(kind) {
    return 'appearance-' + (kind || 'image');
  }

  function _appearanceTip(kind) {
    if (kind === 'banner') {
      return 'Aceita JPG, JPEG, PNG ou WebP. O sistema ajusta para 1200x600 px e otimiza em WebP. Se não subir, o motivo aparece na mensagem do sistema.';
    }
    return 'Aceita JPG, JPEG, PNG ou WebP. O sistema ajusta para 500x500 px e otimiza em WebP. Se não subir, o motivo aparece na mensagem do sistema.';
  }

  function _uploadAppearanceImage(event, kind) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    var targetKind = kind === 'banner' ? 'banner' : 'logo';
    var draftId = _appearanceDraftId(targetKind);
    ImageTools.process(file, { kind: targetKind, folder: targetKind === 'logo' ? 'logos' : 'banners', entityId: draftId }).then(function (result) {
      var state = _appearanceState();
      state[targetKind] = result;
      var field = document.getElementById(targetKind === 'logo' ? 'app-logo-url' : 'app-banner-url');
      if (field) field.value = result.imageUrl || '';
      var preview = document.getElementById(targetKind === 'logo' ? 'appearance-logo-preview' : 'appearance-banner-preview');
      if (preview) {
        preview.src = result.imageUrl || '';
        preview.style.display = 'block';
      }
      UI.toast('Imagem otimizada com sucesso.', 'success');
    }).catch(function (err) {
      console.error('Upload de imagem da aparência', err);
      UI.toast(err && err.message ? err.message : 'Erro ao otimizar imagem.', 'error');
      if (event && event.target) event.target.value = '';
    });
  }

  function _uploadGeneralAvatarImage(event) {
    var file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    ImageTools.process(file, { kind: 'logo', folder: 'logos', entityId: 'general-avatar' }).then(function (result) {
      var state = _appearanceState();
      state.generalAvatar = result;
      var field = document.getElementById('cfg-avatar-url');
      if (field) field.value = result.imageUrl || '';
      var preview = document.getElementById('cfg-avatar-preview');
      if (preview) {
        preview.innerHTML = result.imageUrl ? '<img src="' + _esc(result.imageUrl) + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">' : '<span class="mi" style="font-size:22px;">storefront</span>';
      }
      UI.toast('Avatar otimizado com sucesso.', 'success');
    }).catch(function (err) {
      console.error('Upload de avatar', err);
      UI.toast(err && err.message ? err.message : 'Erro ao otimizar avatar.', 'error');
      if (event && event.target) event.target.value = '';
    });
  }

  function _renderGeral() {
    var c = _config.geral || {};
    var tenantStore = (_systemTenant && _systemTenant.store) || {};
    var inheritedStoreName = tenantStore.name || '';
    var businessNameValue = c.businessName || inheritedStoreName || c.tradeName || c.commercialName || c.visualName || '';
    var profile = window.Auth && Auth.getAdminProfile ? Auth.getAdminProfile() : null;
    var companyAddress = c.companyAddress || c.businessAddress || {};
    var masterFiscalCountry = (_masterTenantControl && (_masterTenantControl.fiscalCountry || (_masterTenantControl.accountAddress && _masterTenantControl.accountAddress.fiscalCountry) || (_masterTenantControl.store && _masterTenantControl.store.fiscalCountry))) || '';
    var tenantFiscalCountry = (_systemTenant && (_systemTenant.fiscalCountry || (_systemTenant.accountAddress && _systemTenant.accountAddress.fiscalCountry) || (_systemTenant.store && _systemTenant.store.fiscalCountry))) || '';
    var fc = _fiscalCountryCode(masterFiscalCountry || tenantFiscalCountry || (profile && profile.fiscalCountry) || 'ES');
    var fiscalCfg = window.FiscalConfig ? FiscalConfig.get(fc) : null;
    var fiscalLabel = fiscalCfg ? fiscalCfg.label : (fc === 'PT' ? 'Portugal' : 'Espanha');
    var fiscalNote = fiscalCfg && !fiscalCfg.fiscalModuleEnabled ? 'Modulo fiscal desativado' : 'Modulo fiscal ativo';
    var fiscalDocLabel = fc === 'ES' ? 'NIF / NIE / CIF' : (fiscalCfg ? fiscalCfg.fiscalDocumentLabel : 'Documento fiscal');
    var fiscalDocPlaceholder = fc === 'ES' ? 'Ex.: 12345678Z, X1234567L ou B12345678' : (fiscalCfg ? fiscalCfg.fiscalDocumentPlaceholder : 'Número de identificação fiscal');
    var fiscalDocHint = fc === 'ES' ? 'Documento fiscal usado na Espanha.' : (fiscalCfg ? fiscalCfg.fiscalDocumentHint : 'Documento fiscal da empresa.');
    var regionLabel = fiscalCfg ? fiscalCfg.regionLabel : 'Região / Província';
    var addressLabel = fiscalCfg ? fiscalCfg.addressLabel : 'Endereço';
    var cityLabel = fiscalCfg ? fiscalCfg.cityLabel : 'Cidade';
    var postalLabel = fiscalCfg ? fiscalCfg.postalCodeLabel : 'Código postal';
    var addressCountry = companyAddress.country || c.companyCountry || c.country || '';
    var avatarUrl = c.avatarUrl || c.storeAvatarUrl || c.accountAvatarUrl || '';
    var fiscalDocumentValue = c.companyFiscalId || c.fiscalDocument || c.taxId || c.nif || '';
    var shortDescription = c.description || '';
    var previewAddress = [
      companyAddress.addressLine || c.companyAddressLine || c.businessAddressLine || '',
      companyAddress.number || c.companyNumber || '',
      companyAddress.neighborhood || c.companyNeighborhood || '',
      companyAddress.city || c.companyCity || c.businessCity || c.city || '',
      companyAddress.region || companyAddress.state || c.companyRegion || c.companyState || '',
      companyAddress.postalCode || c.companyPostalCode || ''
    ].filter(Boolean).join(', ');
    var previewPhone = _phoneFull(c.phoneCountryCode || _defaultPhoneCode(fc), c.phone || '');
    var previewWhatsapp = _phoneFull(c.whatsappCountryCode || c.phoneCountryCode || _defaultPhoneCode(fc), c.whatsapp || '');
    var content = document.getElementById('config-content');
    if (!content) return;
    content.className = 'module-content';
    content.innerHTML = '<div style="display:flex;flex-direction:column;gap:22px;max-width:1180px;margin:0 auto;width:100%;">' +
      '<style>.general-info-panel{border:1px solid #EADFD8;border-radius:15px;background:#fff;padding:14px;display:grid;gap:12px}.general-info-title{display:flex;align-items:flex-start;gap:9px;margin-bottom:13px}.general-info-title .mi{font-size:18px;color:#6F6860;line-height:1.2;opacity:.95}.general-info-title strong{display:block;font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25}.general-info-title span{display:block;font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px}.store-preview-shell{background:linear-gradient(145deg,#FFF8F1 0%,#FAF5ED 48%,#FFFDFC 100%);border-right:1px solid #EAE4DA;padding:24px;display:flex;flex-direction:column;gap:18px;min-width:0;position:relative;overflow:hidden}.store-preview-shell::before{content:"";position:absolute;left:26px;right:26px;top:18px;height:120px;background:radial-gradient(circle at 28% 20%,rgba(255,255,255,.95) 0%,rgba(255,244,235,.72) 38%,rgba(196,54,42,.09) 100%);filter:blur(10px);opacity:.88;pointer-events:none}.store-preview-card{position:relative;z-index:1;background:linear-gradient(145deg,#FFFFFF 0%,#FFFDF9 48%,#FFF5EF 100%);border:1px solid rgba(228,211,200,.96);border-radius:26px;padding:24px;box-shadow:0 24px 58px rgba(72,48,38,.12),0 8px 22px rgba(196,54,42,.06);display:flex;flex-direction:column;gap:18px;min-height:300px;overflow:hidden}.store-preview-card::after{content:"";position:absolute;right:-42px;top:-52px;width:150px;height:150px;border-radius:999px;background:radial-gradient(circle,rgba(196,54,42,.12),rgba(196,54,42,0) 68%);pointer-events:none}.store-preview-main{display:flex;align-items:flex-start;gap:17px;position:relative;z-index:1}.store-preview-logo{width:92px;height:92px;border-radius:25px;background:linear-gradient(145deg,#FFF8F4 0%,#FCECE7 100%);color:#B42318;border:1px solid #E8D1CA;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 16px 34px rgba(82,52,42,.14);flex:0 0 auto}.store-preview-logo img{width:100%;height:100%;object-fit:contain;display:block}.store-preview-logo .mi{font-size:36px}.store-preview-copy{min-width:0;flex:1;padding-top:5px}.store-preview-name{margin:0;color:#211A18;font-size:27px;font-weight:850;line-height:1.08;letter-spacing:-.01em;word-break:break-word}.store-preview-description{margin:10px 0 0;color:#635853;font-size:13.5px;line-height:1.55;max-width:430px}.store-preview-meta{position:relative;z-index:1;display:grid;gap:10px;padding-top:4px}.store-preview-details{display:grid;grid-template-columns:1fr;gap:8px}.store-preview-detail{display:grid;grid-template-columns:22px minmax(0,1fr);gap:9px;align-items:start;border:1px solid rgba(232,215,206,.78);background:rgba(255,255,255,.72);border-radius:15px;padding:10px 11px;box-shadow:inset 0 1px 0 rgba(255,255,255,.85)}.store-preview-detail .mi{font-size:17px;color:#C4362A;margin-top:1px}.store-preview-detail small{display:block;color:#A0928D;font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.045em;line-height:1.1;margin-bottom:3px}.store-preview-detail strong{display:block;color:#3D302C;font-size:12.5px;font-weight:760;line-height:1.35;word-break:break-word}.store-preview-detail.muted strong{color:#8A7E7C;font-weight:650}.store-preview-badges{display:flex;gap:8px;flex-wrap:wrap}.store-preview-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:820;line-height:1;border:1px solid #E8D7CE;background:rgba(255,255,255,.78);color:#6A4038}.store-preview-badge .mi{font-size:14px;color:#C4362A}.profile-business .bf-input,.profile-business .bf-select,.fiscal-business .bf-input,.fiscal-business .bf-select,.contact-preferences .bf-input,.contact-preferences .bf-select{background:#FFFCF8;border-color:#E8DCD7;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.profile-business .bf-input:focus,.profile-business .bf-select:focus,.profile-business textarea.bf-input:focus,.fiscal-business .bf-input:focus,.fiscal-business .bf-select:focus,.contact-preferences .bf-input:focus,.contact-preferences .bf-select:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);outline:none}.profile-business .bf-field label,.fiscal-business .bf-field label,.contact-preferences .bf-field label{color:#7E716D}.profile-logo-row{display:grid;grid-template-columns:48px minmax(0,1fr) minmax(170px,230px);gap:12px;align-items:center;grid-column:1/-1;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:10px}.fiscal-business .bf-input[readonly]{background:#F8F4F1;color:#6F6860}.fiscal-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 14px}.fiscal-span-2{grid-column:span 2}.fiscal-span-1{grid-column:span 1}.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px}.contact-field-help,.general-field-help{font-size:10px;color:#9A8E89;line-height:1.3;margin-top:4px;max-width:300px}.contact-phone-box{display:grid;grid-template-columns:112px minmax(0,1fr);gap:8px;align-items:center;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px}.contact-phone-box .bf-select,.contact-phone-box .bf-input{border:0;background:transparent;box-shadow:none;min-height:36px}.contact-phone-box .bf-select{border-right:1px solid #E8DCD7;border-radius:8px;padding-left:8px}.contact-phone-box .bf-input{padding-left:8px}.contact-phone-box:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08)}@media(max-width:900px){.fiscal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fiscal-span-2,.fiscal-span-1{grid-column:span 1}.store-preview-main{flex-direction:column}.store-preview-logo{width:86px;height:86px}}@media(max-width:760px){.contact-grid{grid-template-columns:1fr}.profile-logo-row{grid-template-columns:48px minmax(0,1fr)}.profile-logo-row input{grid-column:1/-1}.fiscal-grid{grid-template-columns:1fr}.fiscal-span-2,.fiscal-span-1{grid-column:1/-1}.store-preview-shell{border-right:0;border-bottom:1px solid #EAE4DA;padding:18px}.store-preview-card{min-height:0;padding:20px}.store-preview-name{font-size:23px}}@media(max-width:420px){.contact-phone-box{grid-template-columns:100px minmax(0,1fr)}}</style>' +
      '<section class="bf-card" style="overflow:hidden;background:linear-gradient(135deg,#fff 0%,#fff 58%,#FFF7F4 100%);">' +
        '<div class="bf-split-grid">' +
          '<div class="store-preview-shell">' +
            '<div class="store-preview-card">' +
              '<div class="store-preview-main">' +
                '<div id="cfg-avatar-preview" class="store-preview-logo">' + (avatarUrl ? '<img src="' + _esc(avatarUrl) + '" alt="">' : '<span class="mi">storefront</span>') + '</div>' +
                '<div class="store-preview-copy">' +
                  '<h3 class="store-preview-name" id="cfg-preview-business-name">' + _esc(businessNameValue || 'Nome comercial') + '</h3>' +
                  '<p class="store-preview-description" id="cfg-preview-description">' + _esc(shortDescription || 'Adicione uma apresentação curta para explicar o que você vende.') + '</p>' +
                '</div>' +
              '</div>' +
              '<div class="store-preview-meta">' +
                '<div class="store-preview-badges">' +
                  '<span class="store-preview-badge"><span class="mi">public</span><span id="cfg-preview-fiscal-country">' + _esc(fiscalLabel) + '</span></span>' +
                  '<span class="store-preview-badge"><span class="mi">badge</span><span id="cfg-preview-fiscal-doc">' + _esc(fiscalDocumentValue || 'Documento não informado') + '</span></span>' +
                '</div>' +
                '<div class="store-preview-details">' +
                  '<div class="store-preview-detail ' + (previewAddress ? '' : 'muted') + '" id="cfg-preview-address-card"><span class="mi">location_on</span><div><small>Endereço</small><strong id="cfg-preview-address">' + _esc(previewAddress || 'Não informado') + '</strong></div></div>' +
                  '<div class="store-preview-detail ' + (previewPhone ? '' : 'muted') + '" id="cfg-preview-phone-card"><span class="mi">call</span><div><small>Telefone</small><strong id="cfg-preview-phone">' + _esc(previewPhone || 'Não informado') + '</strong></div></div>' +
                  '<div class="store-preview-detail ' + (previewWhatsapp ? '' : 'muted') + '" id="cfg-preview-whatsapp-card"><span class="mi">chat</span><div><small>WhatsApp</small><strong id="cfg-preview-whatsapp">' + _esc(previewWhatsapp || 'Não informado') + '</strong></div></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="bf-section profile-business" style="min-width:0;">' +
            '<div class="bf-section-header">' +
              '<div><h3 class="bf-section-title">Perfil do negócio</h3><p class="bf-section-subtitle">Configure como sua marca aparece no BocaFood e mantenha os dados principais atualizados.</p></div>' +
              '<span class="bf-badge">Editável</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
              '<div class="general-info-panel">' +
                '<div class="general-info-title"><span class="mi">storefront</span><div><strong>Informações da marca</strong><span>Configure o nome, a apresentação e a imagem principal da sua loja.</span></div></div>' +
                '<div class="bf-form-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px;">' +
                  '<div class="profile-logo-row">' +
                    '<div style="width:42px;height:42px;border-radius:13px;background:#FFF7F4;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #F0D8D1;"><span class="mi" style="font-size:20px;">add_photo_alternate</span></div>' +
                    '<div style="min-width:0;"><div style="font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:2px;">Logo da marca</div><div style="font-size:12px;color:#6F6860;line-height:1.4;">Imagem quadrada, ideal 500 × 500 px. Use JPG, PNG ou WebP.</div></div>' +
                    '<input class="bf-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Configuracoes._uploadGeneralAvatarImage(event)" style="width:100%;font-size:12px;background:#fff;">' +
                  '</div>' +
                  '<input id="cfg-avatar-url" type="hidden" value="' + _esc(avatarUrl) + '">' +
                  '<div class="bf-field"><label>Nome comercial</label><input id="cfg-business-name" class="bf-input" value="' + _esc(businessNameValue) + '" placeholder="Ex.: Bocado Brasil"><div class="general-field-help">Nome que seus clientes veem na loja online.</div></div>' +
                  '<div class="bf-field"><label>Nome fiscal</label><input id="cfg-legal-name" class="bf-input" value="' + _esc(c.legalName || c.companyLegalName || '') + '" placeholder="Nome completo ou denominação social"><div class="general-field-help">Para autónomo, use o nome completo. Para empresa, use a denominação social.</div></div>' +
                  '<div class="bf-field bf-span-full"><label>Apresentação curta</label><textarea id="cfg-description" class="bf-input" rows="3" placeholder="Ex.: Comida brasileira caseira feita por encomenda em Pamplona." style="min-height:92px;resize:vertical;">' + _esc(shortDescription) + '</textarea><div class="general-field-help">Uma frase simples para explicar o que você vende.</div></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="bf-card bf-section contact-preferences" style="padding-top:18px;">' +
        '<div class="bf-section-header">' +
          '<div><h3 class="bf-section-title">Contato e preferências</h3><p class="bf-section-subtitle">Dados usados para atendimento, comunicação e padrões do painel.</p></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
          '<div class="general-info-panel">' +
            '<div class="general-info-title"><span class="mi">support_agent</span><div><strong>Atendimento</strong><span>Canais usados para falar com clientes e receber contatos importantes.</span></div></div>' +
            '<div class="contact-grid">' +
              _contactPhoneInput('cfg-phone-country', 'cfg-phone', 'Telefone da loja', c.phoneCountryCode || _defaultPhoneCode(fc), c.phone || '', '912 345 678', 'Número principal de atendimento por telefone.') +
              _contactPhoneInput('cfg-whatsapp-country', 'cfg-whatsapp', 'WhatsApp da loja', c.whatsappCountryCode || c.phoneCountryCode || _defaultPhoneCode(fc), c.whatsapp || '', '912 345 678', 'Número usado para atendimento da loja pelo WhatsApp.') +
              '<div>' + _configInput('cfg-email', 'E-mail de contato', c.email, 'contato@...') + '<div class="contact-field-help">E-mail que seus clientes podem usar para falar com a loja.</div></div>' +
              '<div>' + _configInput('cfg-admin-email', 'E-mail administrativo/fiscal', c.adminEmail || c.fiscalEmail || c.billingEmail || '', 'admin@...') + '<div class="contact-field-help">E-mail usado para assuntos da conta e documentos.</div></div>' +
            '</div>' +
          '</div>' +
          '<input id="cfg-language" type="hidden" value="' + _esc(c.language || c.defaultLanguage || 'pt-PT') + '">' +
          '<input id="cfg-currency" type="hidden" value="' + _esc(c.currency || c.defaultCurrency || 'EUR') + '">' +
        '</div>' +
      '</section>' +
      '<section class="bf-card bf-section fiscal-business">' +
        '<div class="bf-section-header">' +
          '<div style="min-width:0;"><h3 class="bf-section-title">Dados fiscais do negócio</h3><p class="bf-section-subtitle">Dados usados para documentos, regras fiscais e informações legais da conta.</p></div>' +
          '<span class="bf-badge bf-badge-warning">' + _esc(fiscalLabel) + ' · ' + (fiscalCfg && !fiscalCfg.fiscalModuleEnabled ? 'Fiscal inativo' : 'Fiscal ativo') + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
          '<div class="general-info-panel">' +
            '<div class="general-info-title"><span class="mi">account_balance</span><div><strong>Informações fiscais</strong><span>Comece digitando o endereço e selecione uma opção da lista para preencher os dados automaticamente.</span></div></div>' +
            '<div class="fiscal-grid">' +
              '<div class="fiscal-span-2">' +
                _configInput('cfg-company-fiscal-id', fiscalDocLabel, c.companyFiscalId || c.fiscalDocument || c.taxId || c.nif || '', fiscalDocPlaceholder) +
                '<div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;">' + _esc(fiscalDocHint) + '</div>' +
              '</div>' +
              '<div class="fiscal-span-2">' + _configInput('cfg-company-address', 'Endereço fiscal', companyAddress.addressLine || c.companyAddressLine || c.businessAddressLine || '', 'Rua...', 'text', 'off', 'business street-address') + '<div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;">Endereço usado para dados fiscais e documentos da conta.</div></div>' +
              '<div class="fiscal-span-1">' + _configInput('cfg-company-number', 'Número', companyAddress.number || c.companyNumber || '', 'Número') + '</div>' +
              '<div class="fiscal-span-1">' + _configInput('cfg-company-neighborhood', 'Bairro / zona', companyAddress.neighborhood || c.companyNeighborhood || '', 'Bairro / zona') + '</div>' +
              '<div class="fiscal-span-1">' + _configInput('cfg-company-city', cityLabel, companyAddress.city || c.companyCity || c.businessCity || c.city || '', cityLabel) + '</div>' +
              '<div class="fiscal-span-1">' + _configInput('cfg-company-region', regionLabel, companyAddress.region || companyAddress.state || c.companyRegion || c.companyState || '', regionLabel) + '</div>' +
              '<div class="fiscal-span-1">' + _configInput('cfg-company-postal', postalLabel, companyAddress.postalCode || c.companyPostalCode || '', postalLabel) + '</div>' +
              '<div class="bf-field fiscal-span-1"><label>País</label><input id="cfg-company-country" class="bf-input" value="' + _esc(addressCountry) + '" readonly placeholder="País"><div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;">País identificado pelo endereço fiscal.</div></div>' +
              '<div class="bf-field fiscal-span-2"><label>País fiscal</label><input id="cfg-company-fiscal-country" class="bf-input" value="' + _esc(fiscalLabel + ' (' + fc + ')') + '" readonly data-fiscal-country="' + _esc(fc) + '"><div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;">Este campo define quais regras fiscais aparecem no painel. Para alterar, fale com o suporte.</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="bf-card bf-section operation-capacity" style="padding-top:18px;">' +
        '<div class="bf-section-header">' +
          '<div style="min-width:0;"><h3 class="bf-section-title">Capacidade diária</h3><p class="bf-section-subtitle">Informe uma referência simples do que você consegue produzir ou atender em um dia normal.</p></div>' +
        '</div>' +
        '<div class="general-info-panel">' +
          '<div class="general-info-title"><span class="mi">fact_check</span><div><strong>Pedidos por dia</strong><span>Esse número ajuda o Plano de Voo e a Performance a comparar a meta com a sua rotina real. Se deixar vazio, o sistema calcula os pedidos necessários, mas não avisa se passou da sua capacidade.</span></div></div>' +
          '<div class="contact-grid">' +
            '<div class="bf-field"><label>Capacidade de pedidos por dia</label><input id="cfg-daily-order-capacity" class="bf-input" type="number" min="0" step="1" inputmode="numeric" value="' + _esc(c.dailyOrderCapacity || c.dailyProductionCapacity || c.maxOrdersPerDay || '') + '" placeholder="Ex.: 12"><div class="contact-field-help">Use a quantidade média de pedidos que você consegue preparar, vender ou entregar em um dia de trabalho sem sobrecarregar a operação.</div></div>' +
            '<div class="bf-field"><label>Observação interna</label><textarea id="cfg-daily-capacity-note" class="bf-input" rows="3" placeholder="Ex.: 12 pedidos em dias normais, 18 com ajuda extra." style="min-height:84px;resize:vertical;">' + _esc(c.dailyCapacityNote || c.productionCapacityNote || '') + '</textarea><div class="contact-field-help">Opcional. Serve para lembrar quando essa capacidade muda, por exemplo fins de semana, eventos ou ajuda extra.</div></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="bf-card bf-actions-row" style="padding:14px 16px;position:sticky;bottom:0;z-index:2;">' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Revise os dados antes de salvar.</div>' +
        '<button id="config-save" class="bf-btn bf-btn-primary">Salvar alterações</button>' +
      '</section>' +
    '</div>';
    document.getElementById('config-save').onclick = function () {
      var businessName = _val('cfg-business-name').trim();
      var contactEmail = _val('cfg-email').trim();
      var adminEmail = _val('cfg-admin-email').trim();
      if (!businessName) {
        UI.toast('Informe o nome comercial do negócio.', 'error');
        var nameInput = document.getElementById('cfg-business-name');
        if (nameInput) nameInput.focus();
        return;
      }
      if (contactEmail && !_isValidEmail(contactEmail)) {
        UI.toast('Revise o e-mail de contato.', 'error');
        var emailInput = document.getElementById('cfg-email');
        if (emailInput) emailInput.focus();
        return;
      }
      if (adminEmail && !_isValidEmail(adminEmail)) {
        UI.toast('Revise o e-mail administrativo/fiscal.', 'error');
        var adminEmailInput = document.getElementById('cfg-admin-email');
        if (adminEmailInput) adminEmailInput.focus();
        return;
      }
      var fiscalId = _val('cfg-company-fiscal-id').toUpperCase();
      if (fiscalCfg && fiscalId && fiscalCfg.validateNif && !fiscalCfg.validateNif(fiscalId.replace(/[\s.-]/g, ''))) {
        UI.toast(fiscalCfg.nifErrorMsg || 'Documento fiscal inválido.', 'error');
        var fiscalInput = document.getElementById('cfg-company-fiscal-id');
        if (fiscalInput) fiscalInput.focus();
        return;
      }
      _save('geral', {
        businessName: businessName,
        legalName: _val('cfg-legal-name'),
        companyLegalName: _val('cfg-legal-name'),
        description: _val('cfg-description'),
        phone: _val('cfg-phone'),
        whatsapp: _val('cfg-whatsapp'),
        phoneCountryCode: _val('cfg-phone-country'),
        whatsappCountryCode: _val('cfg-whatsapp-country'),
        phoneFull: _phoneFull(_val('cfg-phone-country'), _val('cfg-phone')),
        whatsappFull: _phoneFull(_val('cfg-whatsapp-country'), _val('cfg-whatsapp')),
        email: contactEmail,
        adminEmail: adminEmail,
        fiscalEmail: adminEmail,
        billingEmail: adminEmail,
        country: c.country,
        city: c.city,
        language: _val('cfg-language'),
        defaultLanguage: _val('cfg-language'),
        currency: _val('cfg-currency'),
        defaultCurrency: _val('cfg-currency'),
        dailyOrderCapacity: _positiveIntegerValue('cfg-daily-order-capacity'),
        dailyProductionCapacity: _positiveIntegerValue('cfg-daily-order-capacity'),
        maxOrdersPerDay: _positiveIntegerValue('cfg-daily-order-capacity'),
        dailyCapacityNote: _val('cfg-daily-capacity-note'),
        productionCapacityNote: _val('cfg-daily-capacity-note'),
        indirectCostMode: c.indirectCostMode,
        custosIndiretosModo: c.custosIndiretosModo,
        indirectCostPercent: c.indirectCostPercent,
        percentualCustosIndiretos: c.percentualCustosIndiretos,
        indirectCostMonths: c.indirectCostMonths,
        custosIndiretosMeses: c.custosIndiretosMeses,
        logoUrl: c.logoUrl,
        faviconUrl: c.faviconUrl,
        primaryColor: c.primaryColor || (_config.geral && _config.geral.primaryColor) || '',
        secondaryColor: c.secondaryColor || (_config.geral && _config.geral.secondaryColor) || '',
        bannerUrl: c.bannerUrl,
        visualName: c.visualName,
        avatarUrl: _val('cfg-avatar-url'),
        storeAvatarUrl: _val('cfg-avatar-url'),
        accountAvatarUrl: _val('cfg-avatar-url'),
        avatarStoragePath: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageStoragePath ? _appearanceState().generalAvatar.imageStoragePath : c.avatarStoragePath,
        avatarImagePath: _appearanceState().generalAvatar && (_appearanceState().generalAvatar.imagePath || _appearanceState().generalAvatar.imageStoragePath) ? (_appearanceState().generalAvatar.imagePath || _appearanceState().generalAvatar.imageStoragePath) : (c.avatarImagePath || c.avatarStoragePath),
        avatarWidth: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageWidth ? _appearanceState().generalAvatar.imageWidth : c.avatarWidth,
        avatarHeight: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageHeight ? _appearanceState().generalAvatar.imageHeight : c.avatarHeight,
        avatarSizeKb: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageSizeKb ? _appearanceState().generalAvatar.imageSizeKb : c.avatarSizeKb,
        avatarFormat: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageFormat ? _appearanceState().generalAvatar.imageFormat : c.avatarFormat,
        companyFiscalId: fiscalId,
        fiscalDocument: fiscalId,
        companyAddressLine: _val('cfg-company-address'),
        companyNumber: _val('cfg-company-number'),
        companyNeighborhood: _val('cfg-company-neighborhood'),
        companyCity: _val('cfg-company-city'),
        companyRegion: _val('cfg-company-region'),
        companyPostalCode: _val('cfg-company-postal'),
        companyCountry: _val('cfg-company-country'),
        companyAddress: {
          addressLine: _val('cfg-company-address'),
          number: _val('cfg-company-number'),
          neighborhood: _val('cfg-company-neighborhood'),
          city: _val('cfg-company-city'),
          region: _val('cfg-company-region'),
          postalCode: _val('cfg-company-postal'),
          country: _val('cfg-company-country')
        },
        businessAddress: {
          addressLine: _val('cfg-company-address'),
          number: _val('cfg-company-number'),
          neighborhood: _val('cfg-company-neighborhood'),
          city: _val('cfg-company-city'),
          region: _val('cfg-company-region'),
          postalCode: _val('cfg-company-postal'),
          country: _val('cfg-company-country')
        }
      });
    };
    _bindGeneralPreviewRefresh(fiscalLabel);
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('cfg-company-address'); }, 100);
  }

  function _setPreviewText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function _setPreviewMuted(cardId, hasValue) {
    var el = document.getElementById(cardId);
    if (el) el.classList.toggle('muted', !hasValue);
  }

  function _refreshGeneralPreview(fiscalLabel) {
    var name = _val('cfg-business-name') || 'Nome comercial';
    var description = _val('cfg-description') || 'Adicione uma apresentação curta para explicar o que você vende.';
    var fiscalDoc = (_val('cfg-company-fiscal-id') || '').toUpperCase() || 'Documento não informado';
    var address = [
      _val('cfg-company-address'),
      _val('cfg-company-number'),
      _val('cfg-company-neighborhood'),
      _val('cfg-company-city'),
      _val('cfg-company-region'),
      _val('cfg-company-postal')
    ].filter(Boolean).join(', ');
    var phone = _phoneFull(_val('cfg-phone-country'), _val('cfg-phone'));
    var whatsapp = _phoneFull(_val('cfg-whatsapp-country'), _val('cfg-whatsapp'));
    _setPreviewText('cfg-preview-business-name', name);
    _setPreviewText('cfg-preview-description', description);
    _setPreviewText('cfg-preview-fiscal-country', fiscalLabel || 'Espanha');
    _setPreviewText('cfg-preview-fiscal-doc', fiscalDoc);
    _setPreviewText('cfg-preview-address', address || 'Não informado');
    _setPreviewText('cfg-preview-phone', phone || 'Não informado');
    _setPreviewText('cfg-preview-whatsapp', whatsapp || 'Não informado');
    _setPreviewMuted('cfg-preview-address-card', !!address);
    _setPreviewMuted('cfg-preview-phone-card', !!phone);
    _setPreviewMuted('cfg-preview-whatsapp-card', !!whatsapp);
  }

  function _bindGeneralPreviewRefresh(fiscalLabel) {
    var ids = [
      'cfg-business-name', 'cfg-description', 'cfg-company-fiscal-id',
      'cfg-company-address', 'cfg-company-number', 'cfg-company-neighborhood',
      'cfg-company-city', 'cfg-company-region', 'cfg-company-postal',
      'cfg-phone-country', 'cfg-phone', 'cfg-whatsapp-country', 'cfg-whatsapp'
    ];
    var refresh = function () { _refreshGeneralPreview(fiscalLabel); };
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', refresh);
      el.addEventListener('change', refresh);
    });
    refresh();
  }

  function _renderContaUsuario() {
    var content = document.getElementById('config-content');
    var geral = _config.geral || {};
    var conta = _config.conta_usuario || {};
    var tenant = _systemTenant || {};
    var accountAddress = tenant.accountAddress || conta.accountAddress || {};
    var user = window.Auth && Auth.getUser ? Auth.getUser() : null;
    var profile = window.Auth && Auth.getAdminProfile ? (Auth.getAdminProfile() || {}) : {};
    var fiscalCountry = _fiscalCountryCode((window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : '') || tenant.fiscalCountry || accountAddress.fiscalCountry || 'ES');
    var tenantAccountWhatsappFull = tenant.accountWhatsappFull || tenant.ownerWhatsappFull || tenant.userWhatsappFull || '';
    var tenantAccountWhatsappCountry = tenant.accountWhatsappCountryCode || tenant.ownerWhatsappCountryCode || tenant.userWhatsappCountryCode || '';
    if (!tenantAccountWhatsappFull && !conta.whatsappFull && !conta.whatsapp && !geral.whatsapp && (tenant.ownerName || tenant.preferredName || tenant.socialName)) {
      tenantAccountWhatsappFull = tenant.whatsappFull || tenant.whatsapp || '';
      tenantAccountWhatsappCountry = tenant.whatsappCountryCode || '';
    }
    var accountWhatsappFull = conta.whatsappFull || conta.whatsapp || tenantAccountWhatsappFull || '';
    var accountWhatsappCountry = conta.whatsappCountryCode || tenantAccountWhatsappCountry || _defaultPhoneCode(fiscalCountry);
    var whatsapp = _splitPhoneForForm(accountWhatsappFull, accountWhatsappCountry);
    var emailValue = (user && user.email) || tenant.email || conta.email || geral.email || '';

    content.innerHTML =
      _configVisualStyles() +
      '<div class="config-wrap" style="max-width:980px;">' +
        '<section class="settings-card bf-card account-settings" style="background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF9 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 16px 38px rgba(47,37,35,.055);">' +
          '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">' +
            '<span class="mi" style="width:34px;height:34px;border-radius:12px;background:#F8F1ED;color:#8F3E32;display:inline-flex;align-items:center;justify-content:center;font-size:19px;flex:0 0 auto;">person</span>' +
            '<div style="min-width:0;">' +
              '<h2 style="margin:0;color:#2F2523;font-size:20px;line-height:1.2;font-weight:700;">Usuário</h2>' +
              '<p style="margin:6px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:660px;">Mantenha os dados da pessoa responsável pela conta para suporte, avisos importantes e acesso seguro ao BocaFood.</p>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF7F2;border:1px solid #F0DED5;border-radius:14px;padding:12px 14px;margin-bottom:14px;color:#5D504B;font-size:13px;line-height:1.45;">' +
            '<span class="mi" style="font-size:18px;color:#A84A3E;line-height:1.2;">info</span>' +
            '<span>Estes dados identificam quem administra a conta. O e-mail de acesso fica bloqueado por segurança; para trocar, fale com o suporte.</span>' +
          '</div>' +
          '<div class="bf-panel" style="background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF8 100%);padding:16px;border:1px solid #EADFD8;border-radius:14px;box-shadow:0 10px 24px rgba(47,37,35,.045);">' +
            '<div class="bf-form-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px;">' +
              '<div class="bf-field"><label>Seu nome completo</label><input id="cfg-account-owner-name" class="bf-input" value="' + _esc(tenant.ownerName || conta.ownerName || geral.ownerName || '') + '" placeholder="Nome completo"><div class="account-field-help">Nome da pessoa responsável pela conta.</div></div>' +
              '<div class="bf-field"><label>Como você quer ser chamada?</label><input id="cfg-account-social-name" class="bf-input" value="' + _esc(tenant.preferredName || tenant.socialName || conta.preferredName || conta.socialName || '') + '" placeholder="Nome curto"><div class="account-field-help">Usaremos esse nome nas mensagens e áreas internas do BocaFood.</div></div>' +
              '<div class="bf-field"><label>E-mail de acesso</label><input id="cfg-account-email" class="bf-input" type="email" value="' + _esc(emailValue) + '" readonly placeholder="seu@email.com"><div class="account-field-help">Para trocar este e-mail, fale com o suporte.</div><div class="account-reset-action"><button id="cfg-account-password-reset" type="button" class="account-reset-btn" onclick="Modules.Configuracoes._sendPasswordReset()">Enviar link para redefinir senha</button></div></div>' +
              '<div class="bf-field"><label>WhatsApp de contato</label><div class="account-phone-box"><select id="cfg-account-whatsapp-country" class="bf-select" aria-label="Código do país">' + _phoneCountryOptions(whatsapp.countryCode) + '</select><input id="cfg-account-whatsapp" class="bf-input" type="tel" value="' + _esc(whatsapp.number == null ? '' : whatsapp.number) + '" placeholder="600 000 000" autocomplete="tel-national"></div><div class="account-field-help">Usado para suporte e avisos importantes da sua conta.</div></div>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<section class="bf-card bf-actions-row" style="padding:14px 16px;position:sticky;bottom:0;z-index:2;">' +
          '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Revise os dados antes de salvar.</div>' +
          '<button id="account-save" class="bf-btn bf-btn-primary">Salvar alterações</button>' +
        '</section>' +
      '</div>';
    document.getElementById('account-save').onclick = _saveContaUsuario;
  }

  function _sendPasswordReset() {
    var email = _val('cfg-account-email');
    var btn = document.getElementById('cfg-account-password-reset');
    if (!email) {
      UI.toast('E-mail de acesso não encontrado.', 'error');
      return;
    }
    if (!window.firebase || !firebase.app || !firebase.app().functions) {
      UI.toast('Recuperação de senha indisponível neste ambiente.', 'error');
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Enviando...';
    }
    firebase.app().functions('us-central1').httpsCallable('requestPasswordResetEmail')({ email: email })
      .then(function () {
        UI.toast('Enviamos o link de redefinição para o e-mail de acesso.', 'success');
      })
      .catch(function (err) {
        console.error('[Configuracoes] password reset error', err);
        UI.toast('Não foi possível enviar o link de redefinição. Tente novamente em alguns instantes.', 'error');
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Enviar link para redefinir senha';
        }
      });
  }

  function _saveContaUsuario() {
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId || !window.firebase || !firebase.firestore) {
      UI.toast('Não foi possível identificar a conta atual.', 'error');
      return;
    }
    var now = new Date().toISOString();
    var whatsappCode = _val('cfg-account-whatsapp-country');
    var whatsappNumber = _cleanPhoneNumber(_val('cfg-account-whatsapp'));
    var ownerName = _val('cfg-account-owner-name');
    var preferredName = _val('cfg-account-social-name');
    var whatsappFull = _phoneFull(whatsappCode, whatsappNumber);
    var patch = {
      ownerName: ownerName,
      fullName: ownerName,
      responsibleName: ownerName,
      preferredName: preferredName,
      socialName: preferredName,
      whatsappCountryCode: whatsappCode,
      whatsappNumber: whatsappNumber,
      whatsappFull: whatsappFull,
      accountWhatsappCountryCode: whatsappCode,
      accountWhatsappNumber: whatsappNumber,
      accountWhatsappFull: whatsappFull,
      ownerWhatsappCountryCode: whatsappCode,
      ownerWhatsappNumber: whatsappNumber,
      ownerWhatsappFull: whatsappFull,
      userWhatsappCountryCode: whatsappCode,
      userWhatsappNumber: whatsappNumber,
      userWhatsappFull: whatsappFull,
      language: 'pt-BR',
      updatedAt: now
    };
    var compatibility = Object.assign({}, _config.conta_usuario || {}, patch, {
      whatsapp: patch.whatsappFull,
      email: _val('cfg-account-email')
    });
    console.info('[Configuracoes] salvando Conta/Usuária', {
      tenantUid: tenantId,
      path: 'system_tenants/' + tenantId,
      fields: Object.keys(patch)
    });
    Promise.all([
      firebase.firestore().collection('system_tenants').doc(tenantId).set(patch, { merge: true }),
      DB.setDocRoot('config', 'conta_usuario', _cleanFirestorePayload(compatibility))
    ]).then(function () {
      _systemTenant = Object.assign({}, _systemTenant || {}, patch);
      _config.conta_usuario = compatibility;
      return _recordActivity({
        action: 'account_settings_updated',
        module: 'configuracoes/conta_usuario',
        entityType: 'tenant',
        entityId: tenantId,
        summary: 'Dados da conta atualizados.',
        severity: 'info',
        metadata: { fields: Object.keys(patch).filter(function (key) { return key !== 'updatedAt'; }).join(',') }
      });
    }).then(function () {
      UI.toast('Dados da conta salvos.', 'success');
    }).catch(function (err) {
      UI.toast('Erro ao salvar dados da conta: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _renderPlano() {
    var profile = window.Auth && Auth.getAdminProfile ? (Auth.getAdminProfile() || {}) : {};
    var plan = profile.plan || 'essencial';
    if (plan === 'starter') plan = 'essencial';
    var status = profile.accountStatus || profile.status || 'active';
    var billing = profile.billing || {};
    var trialEndsAt = profile.trialEndsAt || billing.trialEndsAt || '';
    var cycle = profile.billingCycle || billing.billingCycle || billing.cycle || '';
    var billingStatus = profile.billingStatus || billing.status || '';
    var fiscalCountry = profile.fiscalCountry || (profile.accountAddress && profile.accountAddress.fiscalCountry) || 'ES';
    var trialState = _trialState(trialEndsAt, billingStatus);
    var isPostTrial = trialState && trialState.status === 'expired';
    var billingActive = _isBillingActive(billingStatus);
    var accessActive = String(status || '').toLowerCase() === 'active';
    var isPostTrialActive = isPostTrial && billingActive && accessActive;
    var planCards = isPostTrialActive ?
      (_domainStatusCard('Plano atual', _planDisplay(plan), 'Seu acesso está ativo no BocaFood.', '#B42318', 'workspace_premium') +
      _domainStatusCard('Acesso', _accountStatusDisplay(status), 'Sua conta está liberada para uso.', '#2F6B57', 'verified_user') +
      _domainStatusCard('Cobrança', _billingCycleDisplay(cycle), 'Sua assinatura está ativa.', cycle ? '#2F6B57' : '#9A6A2F', 'event_repeat')) :
      (isPostTrial ?
      (_domainStatusCard('Plano atual', _planDisplay(plan), 'Seu plano no BocaFood.', '#B42318', 'workspace_premium') +
      _domainStatusCard('Acesso', _accountStatusDisplay(status), 'Mostra se sua conta está liberada para uso.', accessActive ? '#2F6B57' : '#9A6A2F', 'verified_user') +
      _domainStatusCard('Cobrança', _billingStatusDisplay(billingStatus || status), 'Verifique o status da assinatura para continuar usando o BocaFood.', '#9A6A2F', 'event_repeat')) :
      (_domainStatusCard('Plano atual', _planDisplay(plan), 'Seu plano ativo no BocaFood.', '#B42318', 'workspace_premium') +
      _domainStatusCard('Acesso', _accountStatusDisplay(status), 'Mostra se sua conta está liberada para uso.', accessActive ? '#2F6B57' : '#9A6A2F', 'verified_user') +
      _domainStatusCard('Período grátis', _trialCardValue(trialState), trialState.dateText ? 'Data final: ' + trialState.dateText : 'Data final: Não configurado', trialState.daysLeft != null ? '#9A6A2F' : '#6F6860', 'hourglass_top') +
      _domainStatusCard('Cobrança', _billingCycleDisplay(cycle), 'Mostra como será a renovação do plano.', cycle ? '#2F6B57' : '#9A6A2F', 'event_repeat')));
    var content = document.getElementById('config-content');
    content.innerHTML =
      '<style>.plan-help-card{display:flex;align-items:center;justify-content:space-between;gap:18px;background:linear-gradient(135deg,#FFFFFF 0%,#FFF8F6 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 14px 34px rgba(31,31,31,.055);margin-bottom:18px}.plan-help-main{display:flex;align-items:center;gap:13px;min-width:0}.plan-help-icon{width:42px;height:42px;border-radius:14px;background:#FFF0EE;color:#B42318;display:flex;align-items:center;justify-content:center;font-size:21px;flex:0 0 auto}.plan-help-title{font-size:15px;font-weight:850;color:#1F1F1F;line-height:1.2}.plan-help-text{font-size:13px;color:#6F6860;line-height:1.42;margin-top:3px}.plan-hotmart-info{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;background:#fff;border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 12px 28px rgba(31,31,31,.045);margin-top:2px}.plan-hotmart-info .mi{width:40px;height:40px;border-radius:14px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto}.plan-hotmart-info h3{margin:0;color:#1F1F1F;font-size:15px;font-weight:850;line-height:1.2}.plan-hotmart-info p{margin:5px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:720px}.plan-trial-banner{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;border:1px solid #EACBC4;border-radius:18px;background:linear-gradient(135deg,#FFF8F6 0%,#fff 100%);padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.05)}.plan-trial-main{display:flex;gap:12px;align-items:flex-start;min-width:0}.plan-trial-icon{width:38px;height:38px;border-radius:13px;background:#FFF0EE;color:#B42318;display:grid;place-items:center;flex:0 0 auto}.plan-trial-banner h3{margin:0;color:#1F1F1F;font-size:16px;font-weight:800;line-height:1.25}.plan-trial-banner p{margin:5px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:680px}.plan-trial-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.plan-secondary-btn{height:38px;border:1px solid #E4D8D3;border-radius:11px;background:#fff;color:#6F6860;padding:0 14px;font-size:12px;font-weight:800;font-family:inherit;cursor:pointer}.plan-status-grid{display:grid;grid-template-columns:repeat(4,minmax(210px,1fr));gap:18px;margin-bottom:18px}.plan-status-grid>div{min-height:124px;padding:22px 20px!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}.plan-status-grid>div:hover{transform:translateY(-2px);background:#fff;box-shadow:0 18px 38px rgba(31,31,31,.08)!important}.plan-status-grid>div>div:last-child>div:nth-child(2){white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.16!important;font-size:18px!important}.plan-status-grid>div>div:last-child>div:nth-child(3){line-height:1.42!important;margin-top:6px!important}.plan-section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.plan-section-title h3{margin:0;color:#1F1F1F;font-size:16px;font-weight:800;line-height:1.2}.plan-section-title p{margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.45}.plan-section-title .mi{color:#B42318;font-size:21px;line-height:1.1;opacity:.9}@media(max-width:1120px){.plan-status-grid{grid-template-columns:repeat(2,minmax(220px,1fr))}}@media(max-width:760px){.plan-help-card,.plan-hotmart-info{flex-direction:column;align-items:stretch}.plan-help-main{align-items:flex-start}.plan-trial-banner{flex-direction:column}.plan-trial-actions{width:100%;justify-content:stretch}.plan-trial-actions button{flex:1 1 auto}.plan-status-grid{grid-template-columns:1fr}}</style>' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px;">' +
        '<div><h2 style="margin:0;color:#1F1F1F;font-size:24px;line-height:1.15;font-weight:700;">Meu plano</h2><p style="margin:6px 0 0;color:#6F6860;font-size:14px;line-height:1.45;max-width:760px;">Acompanhe seu plano, acesso e assinatura no BocaFood.</p></div>' +
      '</div>' +
      '<div class="plan-help-card">' +
        '<div class="plan-help-main">' +
          '<span class="mi plan-help-icon">support_agent</span>' +
          '<div><div class="plan-help-title">Precisa de ajuda com seu plano?</div><div class="plan-help-text">Fale com a equipe BocaFood para tirar dúvidas sobre acesso, assinatura ou status da sua conta.</div></div>' +
        '</div>' +
        '<button type="button" class="plan-secondary-btn" onclick="Router.navigate(\'suporte/chamado\')">Falar com suporte</button>' +
      '</div>' +
      _trialBannerHtml(trialState, billingStatus, status) +
      '<div class="plan-status-grid">' +
        planCards +
      '</div>' +
      '<section class="plan-hotmart-info"><div style="display:flex;align-items:flex-start;gap:13px;min-width:0;"><span class="mi">receipt_long</span><div><h3>Dados da compra na Hotmart</h3><p>Pagamentos, recibos, cartão, próxima cobrança e dados financeiros da assinatura devem ser conferidos no painel da Hotmart. O BocaFood usa a Hotmart apenas para liberar, manter ou bloquear o acesso conforme o status recebido.</p></div></div><button type="button" class="plan-secondary-btn" onclick="window.open(\'https://consumer.hotmart.com/\',\'_blank\',\'noopener\')">Abrir Hotmart</button></section>';
  }

  function _renderAparencia() {
    var c = _config.aparencia || _config.geral || {};
    _paint('Aparência', 'Identidade visual do painel e da loja publicada.', [
      '<div style="background:#FBF5F3;border:1px solid #F2EDED;border-radius:14px;padding:16px;margin-bottom:14px;">' +
        '<div style="font-size:12px;font-weight:800;color:#8A7E7C;text-transform:uppercase;margin-bottom:6px;">Pré-visualização</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:56px;height:56px;border-radius:14px;background:#fff;border:1px solid #EEE6E4;display:flex;align-items:center;justify-content:center;overflow:hidden;"><img id="appearance-logo-preview" src="' + _esc(c.logoUrl || _config.geral.logoUrl || '') + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain;"></div>' +
            '<div style="min-width:0;">' +
              '<div style="font-size:16px;font-weight:900;">' + _esc(c.visualName || _config.geral.businessName || 'Nome visual da loja') + '</div>' +
              '<div style="font-size:12px;color:#8A7E7C;margin-top:3px;">Cores do template público fixas pelo layout aprovado</div>' +
            '</div>' +
          '</div>' +
          '<div style="width:100%;height:92px;border-radius:14px;background:#fff;border:1px solid #EEE6E4;overflow:hidden;"><img id="appearance-banner-preview" src="' + _esc(c.bannerUrl || _config.geral.bannerUrl || '') + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"></div>' +
        '</div>' +
      '</div>',
      _field('app-visual-name', 'Nome visual da loja', c.visualName || _config.geral.visualName || _config.geral.businessName, 'Boca do Brasil'),
      '<div class="field bf-field"><span>Logo</span><input class="bf-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Configuracoes._uploadAppearanceImage(event,\'logo\')"><div style="margin-top:6px;font-size:11px;line-height:1.45;color:#8A7E7C;">' + _appearanceTip('logo') + '</div></div>',
      _field('app-logo-url', 'Logo', c.logoUrl || _config.geral.logoUrl, 'https://...'),
      '<div class="field bf-field"><span>Banner</span><input class="bf-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Configuracoes._uploadAppearanceImage(event,\'banner\')"><div style="margin-top:6px;font-size:11px;line-height:1.45;color:#8A7E7C;">' + _appearanceTip('banner') + '</div></div>',
      _field('app-favicon-url', 'Favicon', c.faviconUrl || _config.geral.faviconUrl, 'https://...'),
      _field('app-banner-url', 'Imagem de capa / banner', c.bannerUrl || _config.geral.bannerUrl, 'https://...'),
      _textarea('app-notes', 'Observação interna', c.notes || '', 'Apenas para referência do time')
    ].join(''), function () {
      var data = {
        visualName: _val('app-visual-name'),
        logoUrl: _val('app-logo-url'),
        faviconUrl: _val('app-favicon-url'),
        primaryColor: c.primaryColor || (_config.geral && _config.geral.primaryColor) || '',
        secondaryColor: c.secondaryColor || (_config.geral && _config.geral.secondaryColor) || '',
        bannerUrl: _val('app-banner-url'),
        notes: _val('app-notes')
      };
      return data;
    });
  }

  function _renderAparencia() {
    var c = _config.aparencia || _config.geral || {};
    _paint('Aparência', 'Identidade visual do painel e da loja publicada.', [
      '<div style="background:#FBF5F3;border:1px solid #F2EDED;border-radius:14px;padding:16px;margin-bottom:14px;">' +
        '<div style="font-size:12px;font-weight:800;color:#8A7E7C;text-transform:uppercase;margin-bottom:6px;">Pré-visualização</div>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:56px;height:56px;border-radius:14px;background:#fff;border:1px solid #EEE6E4;display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src="' + _esc(c.logoUrl || _config.geral.logoUrl || '') + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain;"></div>' +
          '<div style="min-width:0;">' +
            '<div style="font-size:16px;font-weight:900;">' + _esc(c.visualName || _config.geral.businessName || 'Nome visual da loja') + '</div>' +
            '<div style="font-size:12px;color:#8A7E7C;margin-top:3px;">Cores do template público fixas pelo layout aprovado</div>' +
          '</div>' +
        '</div>' +
      '</div>',
      _field('app-visual-name', 'Nome visual da loja', c.visualName || _config.geral.visualName || _config.geral.businessName, 'Boca do Brasil'),
      _field('app-logo-url', 'Logo', c.logoUrl || _config.geral.logoUrl, 'https://...'),
      _field('app-favicon-url', 'Favicon', c.faviconUrl || _config.geral.faviconUrl, 'https://...'),
      _field('app-banner-url', 'Imagem de capa / banner', c.bannerUrl || _config.geral.bannerUrl, 'https://...'),
      _textarea('app-notes', 'Observação interna', c.notes || '', 'Apenas para referência do time')
    ].join(''), function () {
      return {
        visualName: _val('app-visual-name'),
        logoUrl: _val('app-logo-url'),
        faviconUrl: _val('app-favicon-url'),
        primaryColor: c.primaryColor || (_config.geral && _config.geral.primaryColor) || '',
        secondaryColor: c.secondaryColor || (_config.geral && _config.geral.secondaryColor) || '',
        bannerUrl: _val('app-banner-url'),
        logoStoragePath: _appearanceState().logo && _appearanceState().logo.imageStoragePath ? _appearanceState().logo.imageStoragePath : c.logoStoragePath,
        logoImagePath: _appearanceState().logo && (_appearanceState().logo.imagePath || _appearanceState().logo.imageStoragePath) ? (_appearanceState().logo.imagePath || _appearanceState().logo.imageStoragePath) : (c.logoImagePath || c.logoStoragePath),
        logoWidth: _appearanceState().logo && _appearanceState().logo.imageWidth ? _appearanceState().logo.imageWidth : c.logoWidth,
        logoHeight: _appearanceState().logo && _appearanceState().logo.imageHeight ? _appearanceState().logo.imageHeight : c.logoHeight,
        logoSizeKb: _appearanceState().logo && _appearanceState().logo.imageSizeKb ? _appearanceState().logo.imageSizeKb : c.logoSizeKb,
        logoFormat: _appearanceState().logo && _appearanceState().logo.imageFormat ? _appearanceState().logo.imageFormat : c.logoFormat,
        bannerStoragePath: _appearanceState().banner && _appearanceState().banner.imageStoragePath ? _appearanceState().banner.imageStoragePath : c.bannerStoragePath,
        bannerImagePath: _appearanceState().banner && (_appearanceState().banner.imagePath || _appearanceState().banner.imageStoragePath) ? (_appearanceState().banner.imagePath || _appearanceState().banner.imageStoragePath) : (c.bannerImagePath || c.bannerStoragePath),
        bannerWidth: _appearanceState().banner && _appearanceState().banner.imageWidth ? _appearanceState().banner.imageWidth : c.bannerWidth,
        bannerHeight: _appearanceState().banner && _appearanceState().banner.imageHeight ? _appearanceState().banner.imageHeight : c.bannerHeight,
        bannerSizeKb: _appearanceState().banner && _appearanceState().banner.imageSizeKb ? _appearanceState().banner.imageSizeKb : c.bannerSizeKb,
        bannerFormat: _appearanceState().banner && _appearanceState().banner.imageFormat ? _appearanceState().banner.imageFormat : c.bannerFormat,
        notes: _val('app-notes')
      };
    });
  }

  // Change L: Produtos tab with Unidades de Medida + Fornecedores
  function _renderProdutos() {
    var content = document.getElementById('config-content');
    if (!content) return;

    Promise.all([DB.getAll('unidades_medida'), DB.getAll('fornecedores')]).then(function (r) {
      _unidades = r[0] || [];
      _fornecedores = r[1] || [];

      // Pre-populate defaults if empty
      if (_unidades.length === 0) {
        var promises = DEFAULT_UNIDADES.map(function (u) { return DB.add('unidades_medida', u); });
        Promise.all(promises).then(function () {
          DB.getAll('unidades_medida').then(function (fresh) {
            _unidades = fresh || [];
            _paintProdutosCfg();
          });
        });
      } else {
        _paintProdutosCfg();
      }
    }).catch(function (err) {
      console.error('Produtos config load error', err);
      _unidades = [];
      _fornecedores = [];
      _paintProdutosCfg();
    });
  }

  function _paintProdutosCfg() {
    var content = document.getElementById('config-content');
    if (!content) return;

    var typeLabel = { massa: 'Massa', volume: 'Volume', unidade: 'Unidade' };

    content.innerHTML = '<div class="settings-card bf-card">' +
      '<div class="settings-card-head"><h2>Produtos</h2><p>Configurações relacionadas ao cardápio de produtos.</p></div>' +
      '<div style="margin-top:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div>' +
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:4px;">Unidades de Medida</h3>' +
      '<p style="font-size:12px;color:#8A7E7C;">Unidades usadas em insumos e fichas técnicas</p>' +
      '</div>' +
      '<button class="bf-btn bf-btn-primary" onclick="Modules.Configuracoes._openUnidadeModal(null)">+ Adicionar</button>' +
      '</div>' +
      (_unidades.length === 0
        ? '<p style="text-align:center;padding:24px;color:#8A7E7C;font-size:13px;">Nenhuma unidade cadastrada.</p>'
        : '<div style="overflow-x:auto;"><table class="bf-table" style="background:#fff;border-radius:12px;overflow:hidden;">' +
          '<thead><tr style="background:#F2EDED;">' +
          '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Nome</th>' +
          '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Símbolo</th>' +
          '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Tipo</th>' +
          '<th style="padding:11px 4px;text-align:right;"></th>' +
          '</tr></thead><tbody>' +
          _unidades.map(function (u) {
            return '<tr style="border-top:1px solid #F2EDED;">' +
              '<td style="padding:11px 14px;font-size:13px;font-weight:700;">' + _esc(u.name) + '</td>' +
              '<td style="padding:11px 14px;font-size:13px;">' + _esc(u.symbol) + '</td>' +
              '<td style="padding:11px 14px;font-size:13px;color:#8A7E7C;">' + (typeLabel[u.type] || u.type || '—') + '</td>' +
              '<td style="padding:11px 8px;text-align:right;">' +
              '<button class="bf-btn bf-btn-secondary" onclick="Modules.Configuracoes._openUnidadeModal(\'' + u.id + '\')" style="width:30px;min-height:30px;height:30px;padding:0;margin-right:4px;color:#2563EB;">✏</button>' +
              '<button class="bf-btn bf-btn-danger" onclick="Modules.Configuracoes._deleteUnidade(\'' + u.id + '\')" style="width:30px;min-height:30px;height:30px;padding:0;">✕</button>' +
              '</td></tr>';
          }).join('') +
          '</tbody></table></div>') +
      '</div>' +

      // Fornecedores section
      '<div style="margin-top:28px;border-top:1px solid #F2EDED;padding-top:20px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div>' +
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:4px;">Fornecedores</h3>' +
      '<p style="font-size:12px;color:#8A7E7C;">Lista de fornecedores para produtos prontos e insumos</p>' +
      '</div>' +
      '<button class="bf-btn bf-btn-primary" onclick="Modules.Configuracoes._openFornecedorModal(null)">+ Adicionar</button>' +
      '</div>' +
      (_fornecedores.length === 0
        ? '<p style="text-align:center;padding:24px;color:#8A7E7C;font-size:13px;">Nenhum fornecedor cadastrado.</p>'
        : '<div style="overflow-x:auto;"><table class="bf-table" style="background:#fff;border-radius:12px;overflow:hidden;">' +
          '<thead><tr style="background:#F2EDED;">' +
          '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Nome</th>' +
          '<th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#8A7E7C;text-transform:uppercase;">Contato</th>' +
          '<th style="padding:11px 4px;text-align:right;"></th>' +
          '</tr></thead><tbody>' +
          _fornecedores.map(function (f) {
            return '<tr style="border-top:1px solid #F2EDED;">' +
              '<td style="padding:11px 14px;font-size:13px;font-weight:700;">' + _esc(f.name) + '</td>' +
              '<td style="padding:11px 14px;font-size:13px;color:#8A7E7C;">' + _esc(f.contact || '—') + '</td>' +
              '<td style="padding:11px 8px;text-align:right;">' +
              '<button class="bf-btn bf-btn-secondary" onclick="Modules.Configuracoes._openFornecedorModal(\'' + f.id + '\')" style="width:30px;min-height:30px;height:30px;padding:0;margin-right:4px;color:#2563EB;"><span class="mi" style="font-size:14px;">edit</span></button>' +
              '<button class="bf-btn bf-btn-danger" onclick="Modules.Configuracoes._deleteFornecedor(\'' + f.id + '\')" style="width:30px;min-height:30px;height:30px;padding:0;"><span class="mi" style="font-size:14px;">delete</span></button>' +
              '</td></tr>';
          }).join('') +
          '</tbody></table></div>') +
      '</div>' +

      '</div>';
  }

  function _openFornecedorModal(id) {
    _ensureConfigModalStyles();
    _editingFornecedorId = id;
    var f = id ? (_fornecedores.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div class="config-modal-card">' +
      '<div class="config-modal-grid">' +
        '<label class="config-modal-field config-modal-field-full"><span>Nome do fornecedor *</span><input id="forn-name" class="config-modal-input" type="text" value="' + _esc(f.name || '') + '" placeholder="Ex.: Mercado Central"></label>' +
        '<label class="config-modal-field config-modal-field-full"><span>Contato</span><input id="forn-contact" class="config-modal-input" type="text" value="' + _esc(f.contact || '') + '" placeholder="Telefone, WhatsApp ou e-mail"></label>' +
        '<label class="config-modal-field config-modal-field-full"><span>Observações</span><textarea id="forn-notes" class="config-modal-textarea" placeholder="Anotações úteis para compras, atendimento ou condições combinadas.">' + _esc(f.notes || '') + '</textarea><div class="config-modal-help">Use este campo para detalhes que ajudam no dia a dia da compra.</div></label>' +
      '</div>' +
      '</div>';
    var footer = '<div class="config-modal-footer"><button class="config-modal-btn secondary" onclick="if(window._fornecedorModal)window._fornecedorModal.close();">Cancelar</button><button class="config-modal-btn primary" onclick="Modules.Configuracoes._saveFornecedor()">' + (id ? 'Salvar fornecedor' : 'Adicionar fornecedor') + '</button></div>';
    window._fornecedorModal = UI.modal({ title: id ? 'Editar fornecedor' : 'Novo fornecedor', body: body, footer: footer, maxWidth: '560px' });
  }

  function _saveFornecedor() {
    var name = ((document.getElementById('forn-name') || {}).value || '').trim();
    if (!name) { UI.toast('Nome obrigatorio', 'error'); return; }
    var data = {
      name: name,
      contact: (document.getElementById('forn-contact') || {}).value || '',
      notes: (document.getElementById('forn-notes') || {}).value || ''
    };
    var op = _editingFornecedorId
      ? DB.update('fornecedores', _editingFornecedorId, data)
      : DB.add('fornecedores', data);
    op.then(function () {
      UI.toast('Fornecedor salvo!', 'success');
      if (window._fornecedorModal) window._fornecedorModal.close();
      _renderProdutos();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteFornecedor(id) {
    UI.confirm('Eliminar este fornecedor?').then(function (yes) {
      if (!yes) return;
      DB.remove('fornecedores', id).then(function () {
        UI.toast('Eliminado', 'info');
        _renderProdutos();
      });
    });
  }

  function _openUnidadeModal(id) {
    _ensureConfigModalStyles();
    _editingUnidadeId = id;
    var u = id ? (_unidades.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div class="config-modal-card">' +
      '<div class="config-modal-grid compact">' +
      '<label class="config-modal-field"><span>Nome *</span><input id="un-name" class="config-modal-input" type="text" value="' + _esc(u.name || '') + '" placeholder="Ex.: Quilograma"></label>' +
      '<label class="config-modal-field"><span>Símbolo *</span><input id="un-symbol" class="config-modal-input" type="text" value="' + _esc(u.symbol || '') + '" placeholder="kg"></label>' +
      '<label class="config-modal-field"><span>Tipo *</span><span class="config-modal-select-wrap">' +
      '<select id="un-type" class="config-modal-select">' +
      '<option value="massa"' + (u.type === 'massa' ? ' selected' : '') + '>Massa</option>' +
      '<option value="volume"' + (u.type === 'volume' ? ' selected' : '') + '>Volume</option>' +
      '<option value="unidade"' + (!u.type || u.type === 'unidade' ? ' selected' : '') + '>Unidade</option>' +
      '</select><span class="mi config-modal-select-arrow">expand_more</span></span></label>' +
      '<div class="config-modal-help config-modal-field-full">Use unidades para padronizar produtos, ingredientes, receitas e compras.</div>' +
      '</div></div>';

    var footer = '<div class="config-modal-footer"><button class="config-modal-btn secondary" onclick="if(window._unidadeModal)window._unidadeModal.close();">Cancelar</button><button class="config-modal-btn primary" onclick="Modules.Configuracoes._saveUnidade()">' + (id ? 'Salvar unidade' : 'Adicionar unidade') + '</button></div>';
    window._unidadeModal = UI.modal({ title: id ? 'Editar unidade' : 'Nova unidade de medida', body: body, footer: footer, maxWidth: '560px' });
  }

  function _saveUnidade() {
    var name = (document.getElementById('un-name') || {}).value || '';
    var symbol = (document.getElementById('un-symbol') || {}).value || '';
    if (!name || !symbol) { UI.toast('Nome e símbolo são obrigatórios', 'error'); return; }
    var data = {
      name: name,
      symbol: symbol,
      type: (document.getElementById('un-type') || {}).value || 'unidade'
    };
    var op = _editingUnidadeId
      ? DB.update('unidades_medida', _editingUnidadeId, data)
      : DB.add('unidades_medida', data);
    op.then(function () {
      UI.toast('Unidade salva!', 'success');
      if (window._unidadeModal) window._unidadeModal.close();
      _renderProdutos();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteUnidade(id) {
    UI.confirm('Eliminar esta unidade de medida?').then(function (yes) {
      if (!yes) return;
      DB.remove('unidades_medida', id).then(function () {
        UI.toast('Eliminado', 'info');
        _renderProdutos();
      });
    });
  }

  function _renderDominio() {
    _ensureStoreLinkStyles();
    var c = _config.dominio || {};
    var geral = _config.geral || {};
    var suggestedSlug = _slugify(c.storeSlug || c.slug || c.subdomain || geral.storeSlug || geral.businessName || '');
    var rootDomain = c.rootDomain || c.mainDomain || c.platformDomain || '';
    var urls = _domainUrls(suggestedSlug, rootDomain, c);
    var slugStatus = suggestedSlug ? 'Link definido' : 'Link pendente';
    var content = document.getElementById('config-content');
    if (!content) return;
    content.className = 'module-content';
    content.innerHTML = '<div class="store-link-page">' +
      '<div class="store-link-head">' +
        '<div style="min-width:0;"><h2>Link da loja</h2><p>Defina o endereço que seus clientes usam para acessar sua loja no BocaFood.</p></div>' +
        '<div class="store-link-chips">' +
          '<span class="store-link-chip">' + _esc(slugStatus) + '</span>' +
        '</div>' +
      '</div>' +
      '<section class="store-link-hero">' +
        '<div class="store-link-hero-copy"><span>Nome público da sua loja</span><strong>' + _esc(suggestedSlug || 'minha-loja') + '</strong><small>Esse nome identifica sua loja no link público e deve ser fácil para a cliente digitar.</small></div>' +
        '<button type="button" class="store-link-secondary-btn" onclick="Modules.Configuracoes._copyDomainValue(\'' + _esc(urls.publicUrl) + '\')"><span class="mi">content_copy</span>Copiar</button>' +
      '</section>' +
      '<section class="store-link-card">' +
        '<div class="store-link-card-head">' +
          '<div><h3>Identificador da loja</h3><p>Escolha um nome curto, claro e fácil de escrever. É esse nome que representa sua loja no endereço público.</p></div>' +
          '<span class="store-link-status ' + (suggestedSlug ? 'ok' : 'warn') + '">' + _esc(slugStatus) + '</span>' +
        '</div>' +
        '<div class="store-link-field-grid">' +
          '<label class="store-link-field" id="cfg-store-slug-field"><span>Nome da loja no link</span><span class="store-link-input-wrap"><input id="cfg-store-slug" type="text" value="' + _esc(suggestedSlug) + '" placeholder="nome-da-sua-loja" oninput="Modules.Configuracoes._normalizeDomainSlugField(\'cfg-store-slug\')"><span class="mi store-link-validation-icon" id="cfg-store-slug-icon">close</span></span><small id="cfg-store-slug-help">Use o nome da sua loja de forma curta, com letras, números e hífen.</small></label>' +
        '</div>' +
      '</section>' +
      '<section class="store-link-card">' +
        '<div class="store-link-card-head">' +
          '<div><h3>Links da loja</h3><p>Depois de salvar o identificador, os links ficam prontos para copiar e compartilhar.</p></div>' +
          '<span class="store-link-status neutral">Automáticos</span>' +
        '</div>' +
        '<div class="store-link-url-grid">' +
          _domainUrlCard('Loja pública', urls.publicUrl, 'Página pública da loja.', 'storefront', true) +
          _domainUrlCard('Avaliações', urls.reviewUrl, 'Link para clientes avaliarem a experiência.', 'reviews') +
        '</div>' +
      '</section>' +
      '<section class="store-link-status-grid">' +
        _domainStatusCard('Identificador', suggestedSlug || 'Pendente', suggestedSlug ? 'Pronto para salvar.' : 'Informe o nome do link.', suggestedSlug ? '#1F6F43' : '#B45309', suggestedSlug ? 'check_circle' : 'pending') +
        _domainStatusCard('Endereço completo', urls.publicUrl.replace(/^https?:\/\//, ''), 'Gerado automaticamente a partir do nome do link.', '#1F6F43', 'verified') +
        _domainStatusCard('Links públicos', suggestedSlug ? 'Gerados' : 'Aguardando', suggestedSlug ? 'Prontos para copiar.' : 'Dependem do identificador.', suggestedSlug ? '#6C8777' : '#B45309', 'link') +
      '</section>' +
      '<section id="store-publication-card" class="store-link-card">' + _publicationCardHtml(urls, _publicationState(urls)) + '</section>' +
      '<section class="store-link-footer">' +
        '<div>Revise o nome do link antes de salvar.</div>' +
        '<button id="config-save" class="store-link-primary-btn">Salvar link</button>' +
      '</section>' +
    '</div>';
    document.getElementById('config-save').onclick = function () {
      var slug = _slugify(_val('cfg-store-slug'));
      if (!slug) { UI.toast('Informe o nome da loja para montar o link.', 'error'); return; }
      if (!_storeSlugVisualValidation(slug).valid) { _updateStoreSlugFeedback(slug); UI.toast(_storeSlugVisualValidation(slug).message, 'error'); return; }
      if (_isReservedStoreSlug(slug)) { UI.toast('Esse nome não pode ser usado no link da loja.', 'error'); return; }
      var root = _cleanDomain(rootDomain);
      var custom = _cleanDomain(c.customDomain);
      var generated = _domainUrls(slug, root, { customDomain: custom });
      var dominioData = {
        storeSlug: slug,
        slug: slug,
        subdomain: slug,
        rootDomain: root,
        mainDomain: root,
        platformDomain: root,
        customDomain: custom,
        publicUrl: generated.publicUrl,
        siteUrl: generated.publicUrl,
        loginUrl: generated.loginUrl,
        orderUrl: generated.orderUrl,
        trackUrl: generated.trackUrl,
        reviewUrl: generated.reviewUrl,
        apiUrl: generated.apiUrl
      };
      _validateStoreSlugAvailable(slug).then(function () {
        return DB.setDocRoot('config', 'dominio', dominioData);
      }).then(function () {
        _config.dominio = dominioData;
        return _syncStoreSlugUrl(slug, generated);
      }).then(function () {
        UI.toast('Domínio e URL salvos', 'success');
        _renderDominio();
      }).catch(function (err) {
        UI.toast('Erro: ' + err.message, 'error');
      });
    };
    _updateStoreSlugFeedback(suggestedSlug);
    _refreshPublicationReadiness(urls);
  }

  function _syncStoreSlugUrl(slug, urls) {
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId || !window.firebase || !firebase.firestore) return Promise.reject(new Error('Tenant não identificado.'));
    var now = new Date().toISOString();
    var currentStore = ((_systemTenant && _systemTenant.store) || {});
    var nextStore = Object.assign({}, currentStore, {
      slug: slug,
      publicUrl: urls.publicUrl,
      status: currentStore.status || 'draft',
      updatedAt: now
    });
    console.info('[Configuracoes] salvando Domínio/URL', {
      tenantUid: tenantId,
      path: 'system_tenants/' + tenantId + '.store',
      slug: slug,
      publicUrl: urls.publicUrl
    });
    return firebase.firestore().collection('system_tenants').doc(tenantId).set({ store: nextStore, updatedAt: now }, { merge: true }).then(function () {
      _systemTenant = Object.assign({}, _systemTenant || {}, { store: nextStore, updatedAt: now });
      return _syncPublicStoreSlug(tenantId, slug, urls, nextStore, currentStore);
    }).then(function () {
      if ((currentStore.slug || '') !== slug) {
        return _recordActivity({
          action: 'store_slug_updated',
          module: 'configuracoes/dominio',
          entityType: 'store',
          entityId: tenantId,
          summary: 'Slug público da loja alterado.',
          severity: 'info',
          metadata: { from: currentStore.slug || '', to: slug, publicUrl: urls.publicUrl || '' }
        });
      }
    });
  }

  function _syncPublicStoreSlug(tenantId, slug, urls, store, previousStore) {
    if (!tenantId || !slug || !window.firebase || !firebase.firestore) return Promise.resolve(false);
    var db = firebase.firestore();
    var now = new Date().toISOString();
    var previousSlug = _slugify((previousStore && previousStore.slug) || '');
    var publicStatus = store && store.status === 'published' ? 'active' : 'inactive';
    var publicData = {
      tenantId: tenantId,
      slug: slug,
      storeName: store.name || ((_config.geral || {}).businessName) || ((_config.geral || {}).name) || '',
      status: publicStatus,
      publicUrl: urls.publicUrl,
      updatedAt: now
    };
    var writes = [];
    if (previousSlug && previousSlug !== slug) {
      writes.push(db.collection('public_stores').doc(previousSlug).delete().catch(function () { return false; }));
    }
    writes.push(db.collection('public_stores').doc(slug).set(Object.assign({ createdAt: now }, publicData), { merge: true }));
    return Promise.all(writes).then(function () { return true; });
  }

  function _refreshPublicationReadiness(urls) {
    Promise.all([
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('categories').catch(function () { return []; }),
      _loadSystemTenant().catch(function () { return {}; })
    ]).then(function (res) {
      _publicationProducts = res[0] || [];
      _publicationCategories = res[1] || [];
      _systemTenant = res[2] || _systemTenant || {};
      var card = document.getElementById('store-publication-card');
      if (card) card.innerHTML = _publicationCardHtml(urls, _publicationState(urls));
    });
  }

  function _publicationState(urls) {
    var geral = _config.geral || {};
    var dominio = _config.dominio || {};
    var integracoes = _config.integracoes || {};
    var endereco = _config.endereco || {};
    var canais = _config.canais_venda || {};
    var tenantStore = (_systemTenant && _systemTenant.store) || {};
    var slug = _slugify((document.getElementById('cfg-store-slug') || {}).value || dominio.storeSlug || dominio.slug || dominio.subdomain || tenantStore.slug || '');
    var storeName = geral.businessName || geral.visualName || tenantStore.name || '';
    var language = geral.language || geral.defaultLanguage || tenantStore.language || '';
    var country = geral.country || endereco.country || tenantStore.country || '';
    var whatsapp = integracoes.whatsapp || geral.whatsapp || geral.phone || '';
    var hasOrderChannel = _hasOrderChannel(canais);
    var activeCategories = (_publicationCategories || []).filter(_isActiveCatalogItem);
    var activeProducts = (_publicationProducts || []).filter(_isActiveProduct);
    var missing = [];
    if (!storeName) missing.push('nome da loja');
    if (!slug) missing.push('slug público');
    if (!language) missing.push('idioma da loja');
    if (!country) missing.push('país da loja');
    if (!whatsapp && !hasOrderChannel) missing.push('WhatsApp de pedidos ou canal de pedido');
    if (!activeCategories.length) missing.push('pelo menos 1 categoria ativa');
    if (!activeProducts.length) missing.push('pelo menos 1 produto ativo');
    var coreReady = !!(storeName && slug && language && country);
    return {
      slug: slug,
      storeName: storeName,
      language: language,
      country: country,
      whatsapp: whatsapp,
      hasOrderChannel: hasOrderChannel,
      publicUrl: urls.publicUrl,
      status: tenantStore.status || (coreReady ? 'ready' : 'draft'),
      publishedAt: tenantStore.publishedAt || '',
      lastPublishedAt: tenantStore.lastPublishedAt || '',
      unpublishedAt: tenantStore.unpublishedAt || '',
      lastPublicationError: tenantStore.lastPublicationError || '',
      missing: missing,
      coreReady: coreReady,
      suspended: tenantStore.status === 'suspended'
    };
  }

  function _isActiveCatalogItem(item) {
    if (!item) return false;
    var status = String(item.status || item.state || '').toLowerCase();
    return item.active !== false && item.enabled !== false && item.ativo !== false && item.hidden !== true && item.menuVisible !== false && !/inactive|inativo|disabled|ocult|hidden|archived|arquiv/.test(status);
  }

  function _isActiveProduct(item) {
    return _isActiveCatalogItem(item) && !!(item.name || item.nome || item.title);
  }

  function _hasOrderChannel(config) {
    var list = Array.isArray(config.list) ? config.list : [];
    return list.some(function (channel) {
      if (!channel) return false;
      var name = _normChannelName(channel.name || channel.label || channel.key || '');
      return channel.active !== false && channel.enabled !== false && (name === 'cardápio' || name === 'cardapio' || name === 'online' || name === 'loja online' || name === 'delivery');
    });
  }

  function _publicationCardHtml(urls, state) {
    state = state || {};
    var status = state.status || 'draft';
    var statusMeta = _publicationStatusMeta(status);
    var missingHtml = state.missing && state.missing.length
      ? '<div style="margin-top:12px;padding:12px 14px;border:1px dashed #F0C9C0;border-radius:12px;background:#FFF8F6;color:#7A352B;font-size:13px;line-height:1.45;"><strong>Antes de publicar sua loja, complete:</strong> ' + _esc(state.missing.join(', ')) + '.</div>'
      : '<div style="margin-top:12px;padding:12px 14px;border:1px solid #D9F2E3;border-radius:12px;background:#F0FFF4;color:#1F6F43;font-size:13px;line-height:1.45;">Requisitos mínimos completos para publicação.</div>';
    var suspended = status === 'suspended';
    var publishDisabled = suspended ? ' disabled' : '';
    var publishButton = status === 'published' ? '' : '<button type="button" class="bf-btn bf-btn-primary" onclick="Modules.Configuracoes._publishStore()" ' + publishDisabled + '>Publicar loja</button>';
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
        '<div style="min-width:0;"><div style="font-size:15px;font-weight:800;color:#1F1F1F;">Publicação da loja</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:3px;">Controle quando sua loja pública fica disponível para clientes.</div></div>' +
        '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:' + statusMeta.bg + ';border:1px solid ' + statusMeta.border + ';color:' + statusMeta.color + ';font-size:12px;font-weight:800;">' + _esc(statusMeta.label) + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
        _domainStatusCard('URL pública calculada', state.publicUrl || urls.publicUrl, 'Link usado na loja publicada.', '#6C8777', 'link') +
        _domainStatusCard('Status atual', statusMeta.label, statusMeta.hint, statusMeta.color, statusMeta.icon) +
        _domainStatusCard('Última publicação', _formatPlanDate(state.lastPublishedAt || state.publishedAt), state.lastPublishedAt || state.publishedAt ? 'Última vez que a loja foi publicada.' : 'Ainda sem publicação registrada.', state.lastPublishedAt || state.publishedAt ? '#2F6B57' : '#9A6A2F', 'event_available') +
      '</div>' +
      (state.lastPublicationError ? '<div style="margin-top:12px;padding:12px 14px;border:1px solid #F0C9C0;border-radius:12px;background:#FFF8F6;color:#7A352B;font-size:13px;line-height:1.45;"><strong>Erro da última publicação:</strong> ' + _esc(state.lastPublicationError) + '</div>' : '') +
      (suspended ? '<div style="margin-top:12px;padding:12px 14px;border:1px solid #F0C9C0;border-radius:12px;background:#FFF8F6;color:#7A352B;font-size:13px;line-height:1.45;">Sua loja está suspensa. Entre em contato com o suporte BocaFood.</div>' : missingHtml) +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">' +
        publishButton +
        (status === 'published' ? '<button type="button" class="bf-btn bf-btn-secondary" onclick="Modules.Configuracoes._unpublishStore()">Despublicar loja</button>' : '') +
      '</div>';
  }

  function _publicationStatusMeta(status) {
    var map = {
      draft: { label: 'Rascunho', hint: 'Ainda faltam dados para publicar.', color: '#B45309', bg: '#FFF7ED', border: '#F3D9C7', icon: 'edit_note' },
      ready: { label: 'Pronta para publicar', hint: 'Requisitos principais preenchidos.', color: '#1F6F43', bg: '#F0FFF4', border: '#D9F2E3', icon: 'check_circle' },
      published: { label: 'Publicada', hint: 'Loja disponível publicamente.', color: '#1F6F43', bg: '#F0FFF4', border: '#D9F2E3', icon: 'public' },
      unpublished: { label: 'Não publicada', hint: 'Dados salvos, loja fora do ar.', color: '#6F6860', bg: '#FAF8F4', border: '#EAE4DA', icon: 'visibility_off' },
      suspended: { label: 'Suspensa', hint: 'Publicação bloqueada pelo Master.', color: '#B42318', bg: '#FFF8F6', border: '#F0C9C0', icon: 'block' },
      publication_error: { label: 'Erro de publicação', hint: 'Revise a última falha registrada.', color: '#B42318', bg: '#FFF8F6', border: '#F0C9C0', icon: 'error' }
    };
    return map[status] || map.draft;
  }

  function _publishStore() {
    var c = _config.dominio || {};
    var root = _cleanDomain(c.rootDomain || c.mainDomain || c.platformDomain || '');
    var custom = _cleanDomain(c.customDomain);
    var slug = _slugify(_val('cfg-store-slug') || c.storeSlug || c.slug || c.subdomain || '');
    var urls = _domainUrls(slug, root, { customDomain: custom });
    var state = _publicationState(urls);
    if (!slug) {
      UI.toast('Informe o nome do link da loja.', 'error');
      return;
    }
    if (_isReservedStoreSlug(slug)) {
      UI.toast('Esse nome não pode ser usado no link da loja.', 'error');
      return;
    }
    if (state.suspended) {
      UI.toast('Sua loja está suspensa. Entre em contato com o suporte BocaFood.', 'error');
      return;
    }
    if (state.missing.length) {
      var nextStatus = state.coreReady ? 'ready' : 'draft';
      _updateStorePublication(nextStatus, urls, { lastPublicationError: 'Faltam requisitos: ' + state.missing.join(', ') }, 'store_publication_failed')
        .then(function () {
          UI.toast('Antes de publicar sua loja, complete: ' + state.missing.join(', ') + '.', 'error');
          _refreshPublicationReadiness(urls);
        })
        .catch(function (err) { UI.toast('Erro ao validar publicação: ' + err.message, 'error'); });
      return;
    }
    _validateStoreSlugAvailable(slug).then(function () {
      return DB.setDocRoot('config', 'dominio', {
      storeSlug: slug,
      slug: slug,
      subdomain: slug,
      rootDomain: root,
      mainDomain: root,
      platformDomain: root,
      customDomain: custom,
      publicUrl: urls.publicUrl,
      siteUrl: urls.publicUrl,
      loginUrl: urls.loginUrl,
      orderUrl: urls.orderUrl,
      trackUrl: urls.trackUrl,
      reviewUrl: urls.reviewUrl,
      apiUrl: urls.apiUrl
      });
    }).then(function () {
      return _updateStorePublication('published', urls, { publishedAt: new Date().toISOString(), lastPublishedAt: new Date().toISOString(), lastPublicationError: '' }, 'store_published');
    }).then(function () {
      UI.toast('Loja publicada com sucesso.', 'success');
      return _load();
    }).then(function () {
      _renderDominio();
    }).catch(function (err) {
      UI.toast('Erro ao publicar loja: ' + err.message, 'error');
    });
  }

  function _unpublishStore() {
    UI.confirm('Despublicar esta loja? Seus dados continuarão salvos.').then(function (yes) {
      if (!yes) return;
      var c = _config.dominio || {};
      var slug = _slugify(_val('cfg-store-slug') || c.storeSlug || c.slug || c.subdomain || '');
      var urls = _domainUrls(slug, c.rootDomain || c.mainDomain || c.platformDomain || '', c);
      _updateStorePublication('unpublished', urls, { unpublishedAt: new Date().toISOString() }, 'store_unpublished')
        .then(function () {
          UI.toast('Sua loja foi despublicada. Seus dados continuam salvos.', 'success');
          return _load();
        })
        .then(function () { _renderDominio(); })
        .catch(function (err) { UI.toast('Erro ao despublicar loja: ' + err.message, 'error'); });
    });
  }

  function _updateStorePublication(status, urls, extraStore, action) {
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId || !window.firebase || !firebase.firestore) return Promise.reject(new Error('Tenant não identificado.'));
    var now = new Date().toISOString();
    var geral = _config.geral || {};
    var endereco = _config.endereco || {};
    var previousStore = Object.assign({}, ((_systemTenant && _systemTenant.store) || {}));
    var store = Object.assign({}, previousStore, {
      name: geral.businessName || ((_systemTenant.store || {}).name) || '',
      slug: urls && urls.publicUrl ? _slugify(_val('cfg-store-slug') || ((_config.dominio || {}).slug)) : ((_systemTenant.store || {}).slug || ''),
      publicUrl: urls.publicUrl,
      country: geral.country || endereco.country || ((_systemTenant.store || {}).country) || '',
      language: geral.language || geral.defaultLanguage || ((_systemTenant.store || {}).language) || '',
      status: status
    }, extraStore || {});
    return firebase.firestore().collection('system_tenants').doc(tenantId).set({ store: store, updatedAt: now }, { merge: true }).then(function () {
      _systemTenant.store = store;
      return _syncPublicStoreSlug(tenantId, store.slug, urls, store, previousStore);
    }).then(function () {
      return _recordActivity({
        action: action,
        module: 'configuracoes/dominio',
        entityType: 'store',
        entityId: tenantId,
        summary: action === 'store_publication_failed' ? 'Erro ao publicar loja.' : (action === 'store_unpublished' ? 'Loja despublicada.' : 'Loja publicada.'),
        severity: action === 'store_publication_failed' ? 'warning' : 'info',
        metadata: {
          status: status,
          publicUrl: store.publicUrl || '',
          lastPublicationError: store.lastPublicationError || ''
        }
      });
    });
  }

  function _renderPagamentos() {
    var c = _config.pagamentos || {};
    var methods = c.paymentMethods || [];
    _paint('Formas de pagamento', 'Opções que podem aparecer para o cliente no site.', [
      _check('cfg-pay-cash', 'Dinheiro', c.cash !== false || methods.indexOf('cash') >= 0),
      _check('cfg-pay-card', 'Cartão', c.card !== false || methods.indexOf('card') >= 0),
      _check('cfg-pay-mbway', 'MB WAY', !!c.mbway || methods.indexOf('mbway') >= 0),
      _field('cfg-mbway-phone', 'Telefone MB WAY', c.mbwayPhone, '+351...'),
      _field('cfg-bank-info', 'Dados bancários / referência', c.bankInfo, 'IBAN ou instruções')
    ].join(''), function () {
      var paymentMethods = [];
      if (_checked('cfg-pay-cash')) paymentMethods.push('cash');
      if (_checked('cfg-pay-card')) paymentMethods.push('card');
      if (_checked('cfg-pay-mbway')) paymentMethods.push('mbway');
      return {
        cash: _checked('cfg-pay-cash'),
        card: _checked('cfg-pay-card'),
        mbway: _checked('cfg-pay-mbway'),
        paymentMethods: paymentMethods,
        mbwayPhone: _val('cfg-mbway-phone'),
        bankInfo: _val('cfg-bank-info')
      };
    });
  }

  function _renderEndereco() {
    var c = _config.endereco || {};
    _paint('Endereço', 'Local físico do negócio e dados de contato.', [
      _field('cfg-address-line', 'Endereço', c.addressLine || c.pickupAddress, 'Rua...'),
      _field('cfg-address-number', 'Número', c.number || c.numero || ''),
      _field('cfg-pickup-area', 'Bairro / Localidade', c.pickupArea || c.neighborhood || ''),
      _field('cfg-city', 'Cidade', c.city, 'Lisboa'),
      _field('cfg-postal', 'Código postal', c.postalCode, '1000-000'),
      _field('cfg-address-region', 'Província', c.region || c.state || c.province || ''),
      _field('cfg-address-country', 'País', c.country || ''),
      _field('cfg-address-reference', 'Referência / complemento', c.reference || c.complemento || ''),
      _field('cfg-phone', 'Telefone', c.phone, '+351...'),
      _field('cfg-email', 'E-mail', c.email, 'contato@...')
    ].join(''), function () {
      return {
        addressLine: _val('cfg-address-line'),
        pickupAddress: _val('cfg-address-line'),
        number: _val('cfg-address-number'),
        numero: _val('cfg-address-number'),
        pickupArea: _val('cfg-pickup-area'),
        neighborhood: _val('cfg-pickup-area'),
        city: _val('cfg-city'),
        postalCode: _val('cfg-postal'),
        region: _val('cfg-address-region'),
        state: _val('cfg-address-region'),
        province: _val('cfg-address-region'),
        country: _val('cfg-address-country'),
        reference: _val('cfg-address-reference'),
        complemento: _val('cfg-address-reference'),
        phone: _val('cfg-phone'),
        email: _val('cfg-email')
      };
    });
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('cfg-address-line'); }, 100);
  }

  function _renderIntegracoes() {
    var c = _config.integracoes || {};
    var geral = _config.geral || {};
    var ga = c.gaId || c.ga4Id || '';
    var meta = c.pixelId || c.metaPixelId || '';
    var whatsapp = c.whatsapp || geral.whatsapp || geral.phone || '';
    var countryCode = c.whatsappCountryCode || geral.whatsappCountryCode || geral.phoneCountryCode || _defaultPhoneCode(geral.fiscalCountry || Auth.getFiscalCountry());
    var hasAnalytics = !!(ga || c.gtmId);
    var hasMeta = !!meta;
    var hasSocial = !!(c.whatsapp || c.instagram || c.facebook || c.tiktok);
    var stripeAccountId = c.stripeConnectedAccountId || c.stripeAccountId || '';
    var content = document.getElementById('config-content');
    content.innerHTML =
      '<style>.integrations-info-panel{border:1px solid #EADFD8;border-radius:15px;background:#fff;padding:14px;display:grid;gap:12px}.integrations-info-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:13px}.integrations-info-title h3{margin:0;color:#1F1F1F;font-size:16px;font-weight:800;line-height:1.2}.integrations-info-title p{margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:620px}.integrations-info-title .mi{color:#B42318;font-size:21px;line-height:1.1;opacity:.9}.integrations-info-panel .bf-input,.integrations-info-panel .bf-select{background:#FFFCF8;border-color:#E4D8D3;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.integrations-info-panel .bf-input:focus,.integrations-info-panel .bf-select:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);outline:none}.integrations-info-panel .contact-field-help{font-size:10px;line-height:1.3;margin-top:4px;color:#9A8E89;max-width:270px}.integrations-phone-box{display:grid;grid-template-columns:112px minmax(0,1fr);gap:8px;align-items:center;background:#FFFCF8;border:1px solid #E4D8D3;border-radius:12px;padding:6px;transition:border-color .16s ease,box-shadow .16s ease}.integrations-phone-box .bf-select,.integrations-phone-box .bf-input{border:0;background:transparent;box-shadow:none;min-height:36px}.integrations-phone-box .bf-select{border-right:1px solid #E8DCD7;border-radius:8px;padding-left:8px}.integrations-phone-box .bf-input{padding-left:8px}.integrations-phone-box:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08)}@media(max-width:640px){.integrations-info-panel{padding:12px}.integrations-info-title{margin-bottom:11px}.integrations-phone-box{grid-template-columns:100px minmax(0,1fr)}}</style>' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div><h2 style="margin:0;color:#1F1F1F;font-size:24px;line-height:1.15;font-weight:700;">Integrações</h2><p style="margin:6px 0 0;color:#6F6860;font-size:14px;line-height:1.45;max-width:680px;">Conecte canais, redes sociais e ferramentas de medição usadas na página pública do seu negócio.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
          _configChip((hasAnalytics ? 'Medição conectada' : 'Medição pendente')) +
          _configChip((hasMeta ? 'Pixel conectado' : 'Pixel pendente')) +
          _configChip((whatsapp ? 'WhatsApp conectado' : 'WhatsApp pendente')) +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:16px;">' +
        _domainStatusCard('Medição', hasAnalytics ? 'Conectada' : 'Pendente', hasAnalytics ? 'GA4 ou GTM adicionado.' : 'Adicione GA4 ou GTM.', hasAnalytics ? '#2F6B57' : '#9A6A2F', 'monitoring') +
        _domainStatusCard('Meta Pixel', hasMeta ? 'Conectado' : 'Pendente', hasMeta ? 'Pixel ID adicionado.' : 'Adicione o Pixel ID.', hasMeta ? '#B42318' : '#9A6A2F', 'ads_click') +
        _domainStatusCard('WhatsApp', whatsapp ? 'Conectado' : 'Pendente', whatsapp ? 'Canal principal ativo.' : 'Adicione o WhatsApp principal.', whatsapp ? '#2F6B57' : '#9A6A2F', 'forum') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1.12fr) minmax(300px,.88fr);gap:16px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          '<section style="' + _configCardStyle('18px 20px') + '"><div class="integrations-info-title"><div><h3>Visitas e campanhas</h3><p>Use essas integrações para acompanhar visitas, campanhas e conversões.</p></div><span class="mi">query_stats</span></div>' +
	            '<div class="integrations-info-panel" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">' +
	              _configInputWithHelp('cfg-ga4', 'Google Analytics 4', ga, 'G-XXXXXXXXXX', 'Código usado para acompanhar visitas e comportamento na página pública.') +
	              _configInputWithHelp('cfg-gtm', 'Google Tag Manager', c.gtmId, 'GTM-XXXXXXX', 'Use se você gerencia tags e scripts pelo GTM.') +
	              _configInputWithHelp('cfg-meta', 'Meta Pixel', meta, '123456789', 'Código usado para medir campanhas do Facebook e Instagram.') +
	            '</div>' +
	            '<div style="margin-top:10px;font-size:11.5px;color:#756A64;line-height:1.45;background:#FFFCF8;border:1px solid #EADFD8;border-radius:12px;padding:9px 11px;">Se Google Tag Manager estiver preenchido, ele controla os eventos da loja. O BocaFood não carrega o GA4 direto ao mesmo tempo para evitar visitas e conversões duplicadas.</div>' +
	          '</section>' +
          '<section style="' + _configCardStyle('18px 20px') + '"><div class="integrations-info-title"><div><h3>Canais de contato</h3><p>Adicione os links que seus clientes usam para falar com você ou acompanhar sua marca.</p></div><span class="mi">share</span></div>' +
            '<div class="integrations-info-panel" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">' +
              _integrationPhoneInput('cfg-int-whatsapp-country', 'cfg-whatsapp', 'WhatsApp', countryCode, whatsapp, '912 345 678') +
              _configInput('cfg-instagram', 'Instagram', c.instagram, 'https://instagram.com/sua_loja') +
              _configInput('cfg-facebook', 'Facebook', c.facebook, 'https://facebook.com/sua_loja') +
              _configInput('cfg-tiktok', 'TikTok', c.tiktok, 'https://tiktok.com/@sua_loja') +
            '</div>' +
          '</section>' +
        '</div>' +
        '<aside style="' + _configCardStyle('18px 20px') + 'position:sticky;top:82px;">' +
          '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;"><div style="width:36px;height:36px;border-radius:12px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">hub</span></div><div><h3 style="margin:0;color:#1F1F1F;font-size:16px;font-weight:700;">O que cada integração faz</h3><p style="margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;">Veja como cada canal ajuda no funcionamento da sua página pública.</p></div></div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            _integrationInfoRow('forum', 'WhatsApp', 'Mostra o botão de contato na página pública e nas avaliações.') +
            _integrationInfoRow('credit_card', 'Cartão online', 'Configure em Loja Online > Template da loja > Checkout.') +
            _integrationInfoRow('alternate_email', 'Redes sociais', 'Exibe seus canais para o cliente conhecer e acompanhar sua marca.') +
            _integrationInfoRow('analytics', 'Analytics', 'Ajuda a medir visitas, campanhas e resultados.') +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<div style="position:sticky;bottom:0;margin-top:16px;background:linear-gradient(180deg,rgba(250,248,244,0),#FAF8F4 42%);padding:14px 0 2px;display:flex;justify-content:flex-end;">' +
        '<button id="config-save" class="bf-btn bf-btn-primary">Salvar alterações</button>' +
      '</div>';
    document.getElementById('config-save').onclick = function () {
      var phone = _val('cfg-whatsapp');
      var phoneCountry = _val('cfg-int-whatsapp-country');
      var data = Object.assign({}, c, {
        gaId: _val('cfg-ga4'),
        ga4Id: _val('cfg-ga4'),
        gtmId: _val('cfg-gtm'),
        pixelId: _val('cfg-meta'),
        metaPixelId: _val('cfg-meta'),
        whatsapp: phone,
        whatsappCountryCode: phoneCountry,
        whatsappFull: [phoneCountry, phone].filter(Boolean).join(' '),
        instagram: _val('cfg-instagram'),
        facebook: _val('cfg-facebook'),
        tiktok: _val('cfg-tiktok'),
        stripeEnabled: c.stripeEnabled === true,
        stripeConnectedAccountId: stripeAccountId,
        stripeAccountId: stripeAccountId,
        stripeConnectStatus: c.stripeConnectStatus || (stripeAccountId ? 'onboarding_required' : 'not_connected'),
        stripeFinanceAccountId: c.stripeFinanceAccountId || c.stripeDefaultAccountId || _stripePaymentMethodAccountId(),
        stripeDefaultAccountId: c.stripeDefaultAccountId || c.stripeFinanceAccountId || _stripePaymentMethodAccountId(),
        updatedAt: new Date().toISOString()
      });
      _ensureStripeFinancePaymentMethod(data).then(function () {
        _save('integracoes', data);
      }).catch(function (err) {
        UI.toast('Erro ao preparar forma de pagamento Stripe: ' + (err && err.message ? err.message : err), 'error');
      });
    };
  }

  function _stripeConnectStatusText(status, data) {
    status = String(status || '').trim();
    if (status === 'ready' && data && data.stripeChargesEnabled === true) return 'Conta pronta para receber cartão';
    if (status === 'pending_review') return 'Stripe analisando os dados';
    if (status === 'onboarding_required') return 'Falta concluir no Stripe';
    if (status === 'not_connected') return 'Conta ainda não conectada';
    return 'Conexão Stripe pendente';
  }

  function _stripeBankAccountOptions(selected) {
    var current = String(selected || '');
    var active = (_bankAccounts || []).filter(function (account) {
      return account && (account.ativo !== false || String(account.id || '') === current);
    }).sort(function (a, b) {
      return String(a.nome || a.name || '').localeCompare(String(b.nome || b.name || ''));
    });
    var html = '<option value="">Selecionar conta financeira...</option>';
    html += active.map(function (account) {
      var id = String(account.id || '');
      var name = account.nome || account.name || 'Conta';
      return '<option value="' + _esc(id) + '"' + (id === current ? ' selected' : '') + '>' + _esc(name) + '</option>';
    }).join('');
    if (current && !active.some(function (account) { return String(account.id || '') === current; })) {
      html += '<option value="' + _esc(current) + '" selected>Conta selecionada</option>';
    }
    return html;
  }

  function _channelBankAccountId(channel) {
    return String(channel && (channel.contaPadraoId || channel.defaultAccountId || channel.bankAccountId || channel.contaBancariaId || channel.conta_id) || '');
  }

  function _channelPaymentMethod(channel) {
    return String(channel && (channel.formaPagamento || channel.forma_pagamento || channel.defaultPaymentMethod || channel.paymentMethod || channel.paymentMethodName || channel.metodoPagamento || '') || '').trim();
  }

  function _channelPaymentMethodOptions(selected) {
    var current = String(selected || '').trim();
    var methods = _paymentMethodListForSettings();
    var html = '<option value="">Definir no pedido/importação</option>';
    html += methods.map(function (method) {
      var name = String(method.name || '').trim();
      return '<option value="' + _esc(name) + '"' + (name === current ? ' selected' : '') + '>' + _esc(name) + '</option>';
    }).join('');
    if (current && !methods.some(function (method) { return String(method.name || '').trim() === current; })) {
      html += '<option value="' + _esc(current) + '" selected>Forma selecionada</option>';
    }
    return html;
  }

  function _channelPaymentMethodFields(method) {
    method = String(method || '').trim();
    return {
      formaPagamento: method,
      forma_pagamento: method,
      defaultPaymentMethod: method,
      paymentMethod: method,
      paymentMethodName: method,
      metodoPagamento: method
    };
  }

  function _channelImportModel(channel) {
    return String(channel && (channel.importModel || channel.import_model || channel.orderImportModel || channel.importacaoModelo || channel.modeloImportacao || '') || '').trim();
  }

  function _channelImportModelOptions(selected) {
    selected = String(selected || '').trim();
    var options = [
      { value: '', label: 'Sem modelo de importação' },
      { value: 'glovo_csv', label: 'Glovo CSV' }
    ];
    if (selected && !options.some(function (opt) { return opt.value === selected; })) {
      options.push({ value: selected, label: 'Modelo selecionado' });
    }
    return options.map(function (opt) {
      return '<option value="' + _esc(opt.value) + '"' + (opt.value === selected ? ' selected' : '') + '>' + _esc(opt.label) + '</option>';
    }).join('');
  }

  function _channelImportModelFields(model) {
    model = String(model || '').trim();
    return {
      importModel: model,
      import_model: model,
      orderImportModel: model,
      importacaoModelo: model,
      modeloImportacao: model
    };
  }

  function _channelBankAccountOptions(selected) {
    var current = String(selected || '');
    var active = (_bankAccounts || []).filter(function (account) {
      return account && (account.ativo !== false || String(account.id || '') === current);
    }).sort(function (a, b) {
      return String(a.nome || a.name || '').localeCompare(String(b.nome || b.name || ''));
    });
    var html = '<option value="">Definir no pedido</option>';
    html += active.map(function (account) {
      var id = String(account.id || '');
      var name = account.nome || account.name || 'Conta';
      return '<option value="' + _esc(id) + '"' + (id === current ? ' selected' : '') + '>' + _esc(name) + '</option>';
    }).join('');
    if (current && !active.some(function (account) { return String(account.id || '') === current; })) {
      html += '<option value="' + _esc(current) + '" selected>Conta selecionada</option>';
    }
    return html;
  }

  function _stripePaymentMethodAccountId() {
    var method = _stripePaymentMethod();
    return method ? String(method.contaPadraoId || method.defaultAccountId || method.bankAccountId || '') : '';
  }

  function _stripePaymentMethod() {
    var finance = _config.financeiro || {};
    var methods = Array.isArray(finance.formas_pagamento) ? finance.formas_pagamento : [];
    return methods.find(function (item) {
      var name = String(item && (item.nome || item.name || '') || '').toLowerCase();
      return item && (item.provider === 'stripe' || item.stripe === true || item.stripeConnected === true || name === 'stripe');
    }) || null;
  }

  var STRIPE_DEFAULT_FEE_PCT = 1.5;
  var STRIPE_DEFAULT_FIXED_FEE = 0.25;

  function _stripeFeeInfo() {
    var method = _stripePaymentMethod() || {};
    var pct = _stripeDefaultFeeValue(method.taxaPercentual, method.feePct, STRIPE_DEFAULT_FEE_PCT);
    var fixed = _stripeDefaultFeeValue(method.taxaFixa, method.fixedFee, STRIPE_DEFAULT_FIXED_FEE);
    var sampleAmount = 10;
    var sampleFee = Math.max(0, (sampleAmount * pct / 100) + fixed);
    return {
      pct: pct,
      fixed: fixed,
      sampleAmount: sampleAmount,
      sampleFee: sampleFee,
      sampleNet: Math.max(0, sampleAmount - sampleFee),
      hasEstimate: pct > 0 || fixed > 0
    };
  }

  function _stripeFeePanel(info) {
    info = info || _stripeFeeInfo();
    var ruleText = info.hasEstimate ? (_formatPercent(info.pct) + (info.fixed > 0 ? ' + ' + _formatCurrency(info.fixed) : '')) : 'Taxa ainda não preenchida';
    var note = info.hasEstimate
      ? 'Essa é uma previsão para a usuária decidir se quer ativar cartão online. Depois da venda aprovada, o BocaFood registra a taxa real informada pela Stripe.'
      : 'Preencha a taxa estimada em Financeiro > Configurações > Formas de pagamento. Mesmo sem previsão, quando a venda for aprovada o BocaFood tenta registrar a taxa real cobrada pela Stripe.';
    return '<div class="stripe-fee-panel">' +
      '<div class="stripe-fee-head"><span class="mi">payments</span><div><h4>Taxa estimada do cartão online</h4><p>Antes de conectar, veja quanto pode sair de cada venda paga por cartão.</p></div></div>' +
      '<div class="stripe-fee-grid">' +
        '<div class="stripe-fee-metric"><span>Regra usada</span><strong>' + _esc(ruleText) + '</strong></div>' +
        '<div class="stripe-fee-metric"><span>Exemplo em ' + _esc(_formatCurrency(info.sampleAmount)) + '</span><strong>' + _esc(_formatCurrency(info.sampleFee)) + '</strong></div>' +
        '<div class="stripe-fee-metric"><span>Ficaria perto de</span><strong>' + _esc(_formatCurrency(info.sampleNet)) + '</strong></div>' +
      '</div>' +
      '<p class="stripe-fee-note">' + _esc(note) + '</p>' +
    '</div>';
  }

  function _safeNumber(value) {
    if (typeof value === 'string') value = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    value = Number(value || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function _formatCurrency(value) {
    value = _safeNumber(value);
    try {
      return value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
    } catch (err) {
      return '€ ' + value.toFixed(2).replace('.', ',');
    }
  }

  function _formatPercent(value) {
    value = _safeNumber(value);
    return value.toLocaleString('pt-PT', { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: 2 }) + '%';
  }

  function _ensureStripeFinancePaymentMethod(integracoes) {
    integracoes = integracoes || {};
    if (integracoes.stripeEnabled !== true) return Promise.resolve(false);
    var finance = Object.assign({}, _config.financeiro || {});
    var methods = Array.isArray(finance.formas_pagamento) ? finance.formas_pagamento.slice() : [];
    var accountId = String(integracoes.stripeFinanceAccountId || integracoes.stripeDefaultAccountId || '').trim();
    var now = new Date().toISOString();
    var found = false;
    methods = methods.map(function (item) {
      item = typeof item === 'string' ? { nome: item, tipo: 'outro', ativo: true } : Object.assign({}, item || {});
      var name = String(item.nome || item.name || '').trim().toLowerCase();
      var isStripe = item.provider === 'stripe' || item.stripe === true || item.stripeConnected === true || name === 'stripe';
      if (!isStripe) return item;
      found = true;
      return Object.assign({}, item, _stripeFinancePaymentPayload(accountId, now), {
        taxaPercentual: _stripeDefaultFeeValue(item.taxaPercentual, item.feePct, STRIPE_DEFAULT_FEE_PCT),
        taxaFixa: _stripeDefaultFeeValue(item.taxaFixa, item.fixedFee, STRIPE_DEFAULT_FIXED_FEE),
        createdAt: item.createdAt || now
      });
    });
    if (!found) methods.push(_stripeFinancePaymentPayload(accountId, now));
    methods.sort(function (a, b) { return String(a.nome || '').localeCompare(String(b.nome || '')); });
    finance.formas_pagamento = methods;
    _config.financeiro = finance;
    return DB.setDocRoot('config', 'financeiro', finance).then(function () { return true; });
  }

  function _stripeFinancePaymentPayload(accountId, now) {
    return {
      nome: 'Stripe',
      tipo: 'Cartão',
      tipoGlobalId: 'card',
      tipoGlobalSlug: 'card',
      tipoGlobalNome: 'Cartão',
      tipoGlobalCountry: 'ambos',
      ativo: true,
      exigeConta: true,
      contaPadraoId: accountId || '',
      provider: 'stripe',
      stripe: true,
      stripeConnected: true,
      prazoCompensacaoDias: 0,
      taxaPercentual: STRIPE_DEFAULT_FEE_PCT,
      taxaFixa: STRIPE_DEFAULT_FIXED_FEE,
      observacao: 'Taxa Stripe estimada: 1,5% + €0,25 por venda.',
      updatedAt: now || new Date().toISOString(),
      createdAt: now || new Date().toISOString()
    };
  }

  function _stripeDefaultFeeValue(primary, fallback, defaultValue) {
    var value = _safeNumber(primary != null && primary !== '' ? primary : fallback);
    return value > 0 ? value : defaultValue;
  }

  function _stripeMessage(text, tone) {
    var el = document.getElementById('cfg-stripe-message');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'stripe-connect-message' + (tone ? ' ' + tone : '');
  }

  function _configFunctionHeaders() {
    var user = window.Auth && Auth.getUser ? Auth.getUser() : null;
    var headers = { 'Content-Type': 'application/json' };
    if (!user || typeof user.getIdToken !== 'function') return Promise.resolve(headers);
    return user.getIdToken().then(function (token) {
      if (token) headers.Authorization = 'Bearer ' + token;
      return headers;
    });
  }

  function _callConfigFunction(name, payload) {
    return _configFunctionHeaders().then(function (headers) {
      return fetch(CONFIG_FN_BASE + name, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload || {})
      });
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (json) {
        if (!response.ok || json.ok === false) throw new Error(json.error || ('function_' + response.status));
        return json;
      });
    });
  }

  function _stripeReturnUrl(hash) {
    hash = String(hash || 'configuracoes/integracoes').replace(/^#/, '');
    return window.location.origin + window.location.pathname + '#' + hash;
  }

  function _startStripeConnect(options) {
    options = options || {};
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId) {
      UI.toast('Tenant não identificado.', 'error');
      return;
    }
    var btn = document.getElementById(options.buttonId || 'cfg-stripe-connect');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="mi">sync</span>Abrindo Stripe...';
    }
    _stripeMessage('Preparando conexão segura com o Stripe...', '');
    return _callConfigFunction('createStripeConnectOnboarding', {
      tenantId: tenantId,
      financeAccountId: options.financeAccountId != null ? options.financeAccountId : _val('cfg-stripe-finance-account'),
      returnUrl: options.returnUrl || _stripeReturnUrl(options.returnHash),
      refreshUrl: options.refreshUrl || _stripeReturnUrl(options.returnHash)
    }).then(function (result) {
      if (result.accountId) {
        _config.integracoes = Object.assign({}, _config.integracoes || {}, {
          stripeEnabled: true,
          stripeConnectedAccountId: result.accountId,
          stripeAccountId: result.accountId,
          stripeConnectStatus: result.status || 'onboarding_required'
        });
      }
      if (result.url) {
        if (window.sessionStorage) sessionStorage.setItem('bf_stripe_connect_refresh', '1');
        window.location.href = result.url;
        return;
      }
      _stripeMessage('Não foi possível abrir o Stripe agora.', 'error');
    }).catch(function (err) {
      console.warn('[Stripe] connect error', err && err.message ? err.message : err);
      _stripeMessage(_stripeConnectErrorMessage(err && err.message), 'error');
      UI.toast(_stripeConnectErrorMessage(err && err.message), 'error');
    }).finally(function () {
      if (btn) {
        btn.disabled = false;
        var hasAccount = !!((_config.integracoes || {}).stripeConnectedAccountId || (_config.integracoes || {}).stripeAccountId);
        btn.innerHTML = '<span class="mi">open_in_new</span>' + (hasAccount ? 'Continuar configuração no Stripe' : 'Conectar minha conta Stripe');
      }
    });
  }

  function _disconnectStripeConnect() {
    if (!confirm('Desconectar o Stripe desta loja? O cartão deixará de aparecer no checkout, mas a conta Stripe não será encerrada.')) return;
    var current = Object.assign({}, _config.integracoes || {});
    var data = Object.assign({}, current, {
      stripeEnabled: false,
      stripeConnectedAccountId: '',
      stripeAccountId: '',
      stripeConnectStatus: 'not_connected',
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      stripeDetailsSubmitted: false,
      stripeDisabledReason: '',
      stripeRequirementsDue: [],
      updatedAt: new Date().toISOString()
    });
    var btn = document.getElementById('cfg-stripe-connect');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="mi">sync</span>Desconectando...';
    }
    _stripeMessage('Desconectando o Stripe desta loja...', '');
    DB.setDocRoot('config', 'integracoes', data).then(function () {
      _config.integracoes = data;
      if (options.renderAfter !== false) _renderIntegracoes();
      UI.toast('Stripe desconectado desta loja.', 'success');
    }).catch(function (err) {
      _stripeMessage('Erro ao desconectar Stripe: ' + (err && err.message ? err.message : err), 'error');
      UI.toast('Erro ao desconectar Stripe.', 'error');
    }).finally(function () {
      if (btn) btn.disabled = false;
    });
  }

  function _refreshStripeConnectStatus(options) {
    options = options || {};
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId) {
      UI.toast('Tenant não identificado.', 'error');
      return;
    }
    var btn = document.getElementById(options.buttonId || 'cfg-stripe-refresh');
    if (btn) btn.disabled = true;
    _stripeMessage('Consultando status no Stripe...', '');
    return _callConfigFunction('getStripeConnectStatus', { tenantId: tenantId, financeAccountId: options.financeAccountId != null ? options.financeAccountId : _val('cfg-stripe-finance-account') }).then(function (result) {
      var stripe = result.stripe || {};
      var selectedFinanceAccountId = (options.financeAccountId != null ? options.financeAccountId : _val('cfg-stripe-finance-account')) || (_config.integracoes || {}).stripeFinanceAccountId || _stripePaymentMethodAccountId();
      _config.integracoes = Object.assign({}, _config.integracoes || {}, {
        stripeEnabled: stripe.status === 'ready' ? true : (_config.integracoes && _config.integracoes.stripeEnabled === true),
        stripeConnectedAccountId: stripe.accountId || ((_config.integracoes || {}).stripeConnectedAccountId),
        stripeAccountId: stripe.accountId || ((_config.integracoes || {}).stripeAccountId),
        stripeConnectStatus: stripe.status || 'onboarding_required',
        stripeChargesEnabled: stripe.chargesEnabled === true,
        stripePayoutsEnabled: stripe.payoutsEnabled === true,
        stripeDetailsSubmitted: stripe.detailsSubmitted === true,
        stripeDisabledReason: stripe.disabledReason || '',
        stripeRequirementsDue: stripe.currentlyDue || [],
        stripeFinanceAccountId: selectedFinanceAccountId,
        stripeDefaultAccountId: selectedFinanceAccountId
      });
      _renderIntegracoes();
      UI.toast(stripe.status === 'ready' ? 'Stripe pronto para receber cartão.' : 'Stripe ainda precisa de ajustes.', stripe.status === 'ready' ? 'success' : 'info');
    }).catch(function (err) {
      console.warn('[Stripe] status error', err && err.message ? err.message : err);
      _stripeMessage(_stripeConnectErrorMessage(err && err.message), 'error');
      UI.toast(_stripeConnectErrorMessage(err && err.message), 'error');
    }).finally(function () {
      if (btn) btn.disabled = false;
    });
  }

  function _stripeConnectErrorMessage(code) {
    code = String(code || '');
    if (code === 'stripe_not_configured') return 'O Stripe ainda não foi configurado no Master.';
    if (code === 'store_stripe_not_connected') return 'A conta Stripe da loja ainda não foi conectada.';
    if (code === 'forbidden') return 'Você não tem permissão para conectar esta loja.';
    if (code === 'missing_auth') return 'Entre novamente para conectar o Stripe.';
    if (code === 'tenant_required') return 'Não foi possível identificar a loja. Entre novamente e tente conectar o Stripe.';
    if (code === 'stripe_account_not_created') return 'O Stripe não conseguiu criar a conta conectada da loja. Confira se o Stripe Connect está liberado na conta configurada no Master.';
    var lower = code.toLowerCase();
    if (lower.indexOf('failed to fetch') >= 0 || lower.indexOf('network') >= 0) return 'Não foi possível falar com o Stripe agora. Confira a internet e tente novamente.';
    if (lower.indexOf('api key') >= 0 || lower.indexOf('secret key') >= 0 || lower.indexOf('no such') >= 0) return 'A chave secreta do Stripe no Master não parece válida. Revise a chave no Master e salve novamente.';
    if (lower.indexOf('managing losses') >= 0 || lower.indexOf('platform-profile') >= 0) return 'Falta concluir uma etapa do perfil Connect na Stripe. No painel Stripe, abra Configurações > Connect > Perfil da plataforma e revise a responsabilidade por perdas das contas conectadas.';
    if (lower.indexOf('connect') >= 0 && (lower.indexOf('sign') >= 0 || lower.indexOf('platform') >= 0 || lower.indexOf('account') >= 0)) return 'A conta Stripe configurada no Master precisa estar liberada para Stripe Connect antes de conectar lojas.';
    if (lower.indexOf('country') >= 0 || lower.indexOf('unsupported') >= 0) return 'O país fiscal da loja precisa ser Portugal ou Espanha para criar a conta Stripe conectada.';
    if (lower.indexOf('permission') >= 0 || lower.indexOf('not allowed') >= 0) return 'O Stripe não permitiu criar a conexão com essa conta. Revise as permissões da conta Stripe no Master.';
    return 'Não foi possível conectar o Stripe agora. Motivo recebido: ' + code;
  }

  function _renderSeo() {
    var c = _config.seo || {};
    _paint('SEO', 'Metadados usados pelo template público.', [
      _field('cfg-seo-title', 'Título padrão', c.title, 'Boca do Brasil'),
      _textarea('cfg-seo-desc', 'Descrição padrão', c.description, 'Comida brasileira artesanal'),
      _field('cfg-seo-image', 'Imagem social', c.imageUrl, 'https://...'),
      _field('cfg-seo-keywords', 'Palavras-chave', c.keywords, 'brasileiro, comida, lisboa')
    ].join(''), function () {
      return { title: _val('cfg-seo-title'), description: _val('cfg-seo-desc'), imageUrl: _val('cfg-seo-image'), keywords: _val('cfg-seo-keywords') };
    });
  }

  function _renderTemplate() {
    var c = _config.template || {};
    var deliveryArea = c.deliveryArea || {};
    var zone1 = (Array.isArray(c.deliveryZones) && c.deliveryZones[0]) || {};
    _paint('Template da loja', 'Campos diretos esperados pelo template público index.html.', [
      _check('cfg-tpl-closed', 'Loja fechada manualmente', !!c.manualClosed),
      _field('cfg-tpl-prep', 'Tempo de preparo (min)', c.prepTime || 45, '45', 'number'),
      _field('cfg-tpl-site', 'siteUrl', c.siteUrl, 'https://seudominio.com'),
      _field('cfg-tpl-pickup-address', 'pickupAddress', c.pickupAddress, 'Rua...'),
      _field('cfg-tpl-pickup-number', 'Número', c.pickupNumber || c.number || ''),
      _field('cfg-tpl-pickup-area', 'pickupArea', c.pickupArea, 'Centro'),
      '<div class="full user-field-note" style="grid-column:1/-1;">Localização atendida pela loja. Selecione a cidade antes de cadastrar as zonas de entrega; Google Places preenche província/estado, país e código postal quando disponível.</div>',
      _field('cfg-tpl-delivery-city', 'Cidade atendida', deliveryArea.city || c.deliveryCity || zone1.city || zone1.cidade || zone1.locality || zone1.name || '', 'Buscar cidade atendida'),
      _field('cfg-tpl-delivery-province', 'Província / estado', deliveryArea.province || c.deliveryProvince || zone1.province || zone1.state || zone1.estado || '', 'Preenchido automaticamente'),
      '<label class="field bf-field"><span>País atendido</span><select id="cfg-tpl-delivery-country" class="bf-input">' + _countrySelectOptions(deliveryArea.country || c.deliveryCountry || zone1.country || zone1.pais || zone1.país || zone1.countryCode || '') + '</select></label>',
      _field('cfg-tpl-delivery-postal', 'Código postal base', deliveryArea.postalCode || c.deliveryPostalCode || zone1.postal || zone1.postalCode || zone1.zip || '', 'Preenchido automaticamente'),
      _field('cfg-tpl-instagram', 'Instagram', c.instagram || (c.social && c.social.instagram) || ((_config.integracoes || {}).instagram) || '', 'https://instagram.com/sua_loja'),
      _field('cfg-tpl-facebook', 'Facebook', c.facebook || (c.social && c.social.facebook) || ((_config.integracoes || {}).facebook) || '', 'https://facebook.com/sua_loja'),
      _field('cfg-tpl-tiktok', 'TikTok', c.tiktok || (c.social && c.social.tiktok) || ((_config.integracoes || {}).tiktok) || '', 'https://tiktok.com/@sua_loja'),
      _field('cfg-tpl-highlight', 'Produto destaque ID', c.destaqueProductId, 'ID do produto'),
      _textarea('cfg-tpl-hours', 'hours (JSON)', _json(c.hours || []), '[{"enabled":true,"open":"11:00","close":"22:00"}]'),
      _textarea('cfg-tpl-zones', 'deliveryZones (JSON)', _json(c.deliveryZones || []), '[{"postal":"1000-000","name":"Centro","fee":2}]'),
      _textarea('cfg-tpl-categories', 'categories (JSON)', _json(c.categories || []), '[{"id":"salgados","name":"Salgados"}]'),
      _textarea('cfg-tpl-coupons', 'coupons (JSON)', _json(c.coupons || []), '[{"code":"BRASIL10","type":"pct","value":10}]')
    ].join(''), function () {
      return {
        manualClosed: _checked('cfg-tpl-closed'),
        prepTime: parseInt(_val('cfg-tpl-prep')) || 45,
        siteUrl: _val('cfg-tpl-site'),
        pickupAddress: _val('cfg-tpl-pickup-address'),
        pickupNumber: _val('cfg-tpl-pickup-number'),
        pickupArea: _val('cfg-tpl-pickup-area'),
        deliveryCity: _val('cfg-tpl-delivery-city'),
        deliveryProvince: _val('cfg-tpl-delivery-province'),
        deliveryCountry: _val('cfg-tpl-delivery-country'),
        deliveryPostalCode: _val('cfg-tpl-delivery-postal'),
        deliveryArea: {
          city: _val('cfg-tpl-delivery-city'),
          province: _val('cfg-tpl-delivery-province'),
          country: _val('cfg-tpl-delivery-country'),
          postalCode: _val('cfg-tpl-delivery-postal'),
          source: 'admin_delivery_zones'
        },
        instagram: _val('cfg-tpl-instagram'),
        facebook: _val('cfg-tpl-facebook'),
        tiktok: _val('cfg-tpl-tiktok'),
        social: {
          instagram: _val('cfg-tpl-instagram'),
          facebook: _val('cfg-tpl-facebook'),
          tiktok: _val('cfg-tpl-tiktok')
        },
        destaqueProductId: _val('cfg-tpl-highlight'),
        hours: _parseJson('cfg-tpl-hours', []),
        deliveryZones: _parseJson('cfg-tpl-zones', []),
        categories: _parseJson('cfg-tpl-categories', []),
        coupons: _parseJson('cfg-tpl-coupons', [])
      };
    });
    setTimeout(function () {
      if (!window.BocaPlaces) return;
      BocaPlaces.init('cfg-tpl-pickup-address');
      BocaPlaces.init('cfg-tpl-delivery-city');
    }, 100);
  }

  function _renderCanaisVenda() {
    var c = _config.canais_venda || {};
    var list = _mergeFixedChannels(Array.isArray(c.list) ? c.list : []);
    var inputStyle = 'width:100%;height:42px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;padding:0 12px;color:#2F2523;font-size:14px;outline:none;box-sizing:border-box;';
    var selectStyle = inputStyle + 'appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:38px;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 14px center;background-size:14px;';
    var labelStyle = 'display:block;font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;margin:0 0 6px;';
    var compactInputStyle = inputStyle + 'max-width:132px;';
    var rows = list.map(function (ch, idx) {
      var system = _isSystemChannel(ch);
      return '<div class="channel-row" data-channel-row="' + idx + '" style="background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF8 100%);border:1px solid #EADFD8;border-radius:14px;padding:13px 14px;box-shadow:0 10px 24px rgba(47,37,35,.045);display:flex;flex-direction:column;gap:12px;">' +
        '<div class="channel-row-main" style="display:grid;grid-template-columns:minmax(180px,1fr) minmax(220px,1.12fr) auto;gap:10px;align-items:end;">' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Canal de venda</span>' +
            '<input id="ch-name-' + idx + '" type="text" value="' + _esc(ch.name || '') + '" placeholder="Ex.: Instagram, marketplace, app de entrega" ' + (system ? 'readonly' : '') + ' style="' + inputStyle + (system ? 'background:#FAF8F4;color:#6F6860;' : '') + '">' +
          '</label>' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Categoria de entrada</span>' +
            '<select id="ch-income-category-' + idx + '" onchange="Modules.Configuracoes._createEntradaCategoryFromChannel(' + idx + ')" style="' + selectStyle + '">' + _entradaCategoryOptions(_channelIncomeCategoryId(ch) || _channelIncomeCategoryName(ch)) + '</select>' +
          '</label>' +
          (system ? '<span title="Canal fixo do BocaFood" style="width:38px;height:42px;border-radius:12px;background:#F0FAF4;color:#1F6F43;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:18px;">lock</span></span>' : '<button class="bf-btn bf-btn-danger" type="button" onclick="Modules.Configuracoes._removeCanalVenda(' + idx + ')" title="Remover canal" style="width:38px;min-height:42px;height:42px;padding:0;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">' +
            '<span class="mi" style="font-size:18px;">delete_outline</span>' +
          '</button>') +
        '</div>' +
        '<div class="channel-row-costs" style="display:grid;grid-template-columns:minmax(170px,1fr) minmax(170px,1fr) minmax(170px,1fr) minmax(92px,132px) minmax(104px,132px) minmax(118px,148px);gap:10px;align-items:end;">' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Conta bancária padrão</span>' +
            '<select id="ch-bank-account-' + idx + '" style="' + selectStyle + '">' + _channelBankAccountOptions(_channelBankAccountId(ch)) + '</select>' +
          '</label>' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Forma de pagamento padrão</span>' +
            '<select id="ch-payment-method-' + idx + '" style="' + selectStyle + '">' + _channelPaymentMethodOptions(_channelPaymentMethod(ch)) + '</select>' +
          '</label>' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Modelo de importação</span>' +
            '<select id="ch-import-model-' + idx + '" style="' + selectStyle + '">' + _channelImportModelOptions(_channelImportModel(ch)) + '</select>' +
          '</label>' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Comissão %</span>' +
            '<input id="ch-commission-' + idx + '" type="text" inputmode="decimal" value="' + _esc(_channelNumberText(ch.commissionPct)) + '" placeholder="0,00" style="' + compactInputStyle + '">' +
          '</label>' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Taxa fixa</span>' +
            '<input id="ch-fixed-fee-' + idx + '" type="text" inputmode="decimal" value="' + _esc(_channelNumberText(ch.fixedFee)) + '" placeholder="€ 0,00" style="' + compactInputStyle + '">' +
          '</label>' +
          '<label style="min-width:0;">' +
            '<span style="' + labelStyle + '">Imposto comissão %</span>' +
            '<input id="ch-tax-' + idx + '" type="text" inputmode="decimal" value="' + _esc(_channelNumberText(ch.taxPct)) + '" placeholder="0,00" style="' + compactInputStyle + '">' +
          '</label>' +
          '<div style="grid-column:1/-1;color:#8A7E7C;font-size:11px;line-height:1.35;">Categoria, conta bancária e forma de pagamento serão usadas como padrão nos pedidos e nas importações desse canal. Só canais com modelo de importação aparecem na prévia de importação de pedidos. Deixe taxas zeradas quando este canal não cobra comissão, taxa por venda ou imposto sobre a comissão.</div>' +
        '</div>' +
      '</div>';
    }).join('');
    var content = document.getElementById('config-content');
    var fixedChannelText = _isTpvEnabled() ? 'Cardápio e Venda presencial são canais fixos do BocaFood.' : 'Cardápio é um canal fixo do BocaFood. Venda presencial aparece aqui quando estiver ativada.';
    var emptyChannelText = _isTpvEnabled() ? 'Adicione apenas se sua loja vender por outro canal além do Cardápio e da Venda presencial.' : 'Adicione apenas se sua loja vender por outro canal além do Cardápio.';
    content.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;max-width:1040px;width:100%;margin:0 auto;">' +
      '<style>@media(max-width:980px){.channel-row-main{grid-template-columns:1fr!important}.channel-row-main>button,.channel-row-main>span[title]{justify-self:start}.channel-row-costs{grid-template-columns:minmax(180px,1fr) minmax(180px,1fr) minmax(92px,132px)!important}.channel-row-costs>div{grid-column:1/-1}}@media(max-width:640px){.channel-row-main,.channel-row-costs{grid-template-columns:1fr!important}.channel-row-main>label,.channel-row-costs>label,.channel-row-costs>div{grid-column:1/-1!important}.channel-row-costs input{max-width:100%!important}}</style>' +
      '<section class="settings-card bf-card" style="background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF9 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 16px 38px rgba(47,37,35,.055);">' +
        '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">' +
          '<span class="mi" style="width:34px;height:34px;border-radius:12px;background:#F8F1ED;color:#8F3E32;display:inline-flex;align-items:center;justify-content:center;font-size:19px;flex:0 0 auto;">storefront</span>' +
          '<div style="min-width:0;">' +
            '<h2 style="margin:0;color:#2F2523;font-size:20px;line-height:1.2;font-weight:700;">Canais de venda</h2>' +
            '<p style="margin:6px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:660px;">Cadastre os lugares onde sua loja também recebe pedidos, como Instagram, marketplace ou aplicativo de entrega.</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF7F2;border:1px solid #F0DED5;border-radius:14px;padding:12px 14px;margin-bottom:14px;color:#5D504B;font-size:13px;line-height:1.45;">' +
          '<span class="mi" style="font-size:18px;color:#A84A3E;line-height:1.2;">info</span>' +
          '<span>Defina por onde a venda chega e quais padrões financeiros esse canal deve usar. Quando esse canal tiver um modelo de importação, ele aparece na prévia de importação de pedidos e o BocaFood já pode preencher categoria, conta bancária e forma de pagamento com base nesses campos. ' + _esc(fixedChannelText) + '</span>' +
        '</div>' +
        '<div id="channels-list" style="display:grid;grid-template-columns:1fr;gap:10px;">' + (rows || '<div style="text-align:center;padding:34px 20px;color:#7C706B;font-size:14px;line-height:1.45;background:#FFFCF8;border:1px dashed #E4D4CC;border-radius:14px;"><strong style="display:block;color:#443836;font-size:14px;margin-bottom:4px;">Nenhum canal adicional cadastrado.</strong>' + _esc(emptyChannelText) + '</div>') + '</div>' +
        '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center;justify-content:space-between;">' +
          '<button class="bf-btn bf-btn-secondary" type="button" onclick="Modules.Configuracoes._addCanalVenda()" style="display:inline-flex;align-items:center;gap:6px;"><span class="mi" style="font-size:17px;">add</span>Adicionar canal</button>' +
          '<button class="bf-btn bf-btn-primary" type="button" onclick="Modules.Configuracoes._saveCanaisVenda()">Salvar canais</button>' +
        '</div>' +
      '</section>' +
      '</div>';
  }

  function _collectCanaisVenda() {
    var existing = (_config.canais_venda && Array.isArray(_config.canais_venda.list)) ? _config.canais_venda.list : [];
    return [].slice.call(document.querySelectorAll('[data-channel-row]')).map(function (row) {
      var idx = row.dataset.channelRow;
      var name = _val('ch-name-' + idx).trim().replace(/\s+/g, ' ');
      var prev = existing.find(function (ch) { return _normChannelName(ch.name) === _normChannelName(name); }) || {};
      var cat = _findEntradaCategory(_val('ch-income-category-' + idx));
      var paymentMethod = _val('ch-payment-method-' + idx);
      var importModel = _val('ch-import-model-' + idx);
      return Object.assign({
        name: name,
        commissionPct: _parseChannelNumber(_val('ch-commission-' + idx)),
        fixedFee: _parseChannelNumber(_val('ch-fixed-fee-' + idx)),
        taxPct: _parseChannelNumber(_val('ch-tax-' + idx)),
        contaPadraoId: _val('ch-bank-account-' + idx),
        defaultAccountId: _val('ch-bank-account-' + idx),
        bankAccountId: _val('ch-bank-account-' + idx),
        minMarginPct: parseFloat(String(prev.minMarginPct || '0').replace(',', '.')) || 0,
        differentPrice: !!prev.differentPrice,
        locked: _isSystemChannel({ name: name }) || !!prev.locked
      }, _incomeCategoryFields(cat), _channelPaymentMethodFields(paymentMethod), _channelImportModelFields(importModel));
    }).filter(function (ch) { return !!ch.name; });
  }

  function _validateCanaisVenda(list) {
    var seen = {};
    for (var i = 0; i < (list || []).length; i++) {
      var ch = list[i] || {};
      var key = _normChannelName(ch.name);
      if (!key) continue;
      if (seen[key]) return 'Existe mais de um canal com o nome "' + ch.name + '". Deixe cada canal com um nome único.';
      seen[key] = true;
      if (_parseChannelNumber(ch.commissionPct) < 0 || _parseChannelNumber(ch.fixedFee) < 0 || _parseChannelNumber(ch.taxPct) < 0) {
        return 'Revise as taxas de ' + ch.name + '. Se o canal não cobra, deixe o campo zerado.';
      }
      if (_parseChannelNumber(ch.commissionPct) >= 100 || _parseChannelNumber(ch.taxPct) >= 100) {
        return 'Revise os percentuais de ' + ch.name + '. Comissão e imposto sobre comissão precisam ficar abaixo de 100%.';
      }
    }
    return '';
  }

  function _saveCanaisVenda() {
    var collected = _collectCanaisVenda();
    var validationError = _validateCanaisVenda(collected);
    if (validationError) {
      UI.toast(validationError, 'error');
      return;
    }
    var data = { list: _mergeFixedChannels(collected) };
    DB.setDocRoot('config', 'canais_venda', data).then(function () {
      _config.canais_venda = data;
      UI.toast('Canais salvos', 'success');
      _renderCanaisVenda();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _addCanalVenda() {
    _config.canais_venda = { list: _collectCanaisVenda().concat([Object.assign({ name: '', commissionPct: 0, fixedFee: 0, taxPct: 0, contaPadraoId: '', defaultAccountId: '', bankAccountId: '', minMarginPct: 0, differentPrice: false }, _channelPaymentMethodFields(''), _channelImportModelFields(''))]) };
    _renderCanaisVenda();
  }

  function _removeCanalVenda(idx) {
    var list = _collectCanaisVenda();
    if (_isSystemChannel(list[idx])) {
      UI.toast('Esse canal é fixo do BocaFood.', 'info');
      return;
    }
    list.splice(idx, 1);
    _config.canais_venda = { list: _mergeFixedChannels(list) };
    _renderCanaisVenda();
  }

  function _createEntradaCategoryFromChannel(idx) {
    var select = document.getElementById('ch-income-category-' + idx);
    if (!select || select.value !== '__new__') return;
    select.value = '';
    _openEntradaCategoryModalFromChannel(idx);
  }

  function _openEntradaCategoryModalFromChannel(idx) {
    _ensureConfigModalStyles();
    window._entradaCategoryModalContext = { idx: idx };
    var body = '<div class="config-modal-card">' +
      '<div class="config-modal-grid">' +
        '<label class="config-modal-field config-modal-field-full"><span>Nome da categoria *</span><input id="channel-category-name" class="config-modal-input" type="text" placeholder="Ex.: Vendas Instagram, Vendas Cardápio"></label>' +
        '<div class="config-modal-help config-modal-field-full">Essa categoria organiza onde o dinheiro desse canal aparece no Financeiro. Use um nome claro para reconhecer a origem da venda.</div>' +
      '</div>' +
    '</div>';
    var footer = '<div class="config-modal-footer"><button class="config-modal-btn secondary" onclick="if(window._entradaCategoryModal)window._entradaCategoryModal.close();">Cancelar</button><button class="config-modal-btn primary" onclick="Modules.Configuracoes._saveEntradaCategoryFromChannel()">Criar categoria</button></div>';
    window._entradaCategoryModal = UI.modal({ title: 'Nova categoria de entrada', body: body, footer: footer, maxWidth: '520px' });
    setTimeout(function () {
      var input = document.getElementById('channel-category-name');
      if (input) input.focus();
    }, 80);
  }

  function _saveEntradaCategoryFromChannel() {
    var ctx = window._entradaCategoryModalContext || {};
    var idx = ctx.idx;
    var select = document.getElementById('ch-income-category-' + idx);
    var name = _val('channel-category-name');
    name = String(name || '').trim().replace(/\s+/g, ' ');
    if (!name) {
      UI.toast('Informe o nome da categoria', 'error');
      return;
    }
    var existing = _findEntradaCategory(name);
    if (existing && existing.id) {
      if (select) {
        select.innerHTML = _entradaCategoryOptions(existing.id);
        select.value = String(existing.id);
      }
      if (window._entradaCategoryModal) window._entradaCategoryModal.close();
      UI.toast('Categoria já existia e foi selecionada', 'info');
      return;
    }
    var now = new Date().toISOString();
    var payload = {
      nome: name,
      name: name,
      tipo: 'entrada',
      type: 'entrada',
      financialNature: 'receita',
      origem: 'configuracoes_canais_venda',
      createdAt: now,
      updatedAt: now
    };
    DB.add('financeiro_categorias', payload).then(function (ref) {
      var id = String((ref && ref.id) || '');
      var category = Object.assign({}, payload, { id: id });
      _financeCategories = (_financeCategories || []).concat([category]);
      Array.prototype.forEach.call(document.querySelectorAll('[id^="ch-income-category-"]'), function (el) {
        var previous = el === select ? id : el.value;
        el.innerHTML = _entradaCategoryOptions(previous);
        el.value = previous;
      });
      if (select) select.value = id;
      if (window._entradaCategoryModal) window._entradaCategoryModal.close();
      UI.toast('Categoria adicionada', 'success');
    }).catch(function (err) {
      if (select) select.value = '';
      UI.toast('Erro ao criar categoria: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _channelNumberText(value) {
    var n = _parseChannelNumber(value);
    if (!n) return '';
    return String(n).replace('.', ',');
  }

  function _parseChannelNumber(value) {
    var raw = String(value == null ? '' : value).replace(/[^\d,.-]/g, '').replace(',', '.');
    var n = parseFloat(raw);
    return isFinite(n) ? n : 0;
  }

  function _globalFinanceConfigForSettings() {
    return ((_systemConfig || {}).globalFinance) || ((_masterTenantControl || {}).globalFinance) || ((_systemTenant || {}).globalFinance) || {};
  }

  function _normalizePaymentCountry(value) {
    var raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    if (raw === 'ambos' || raw === 'both' || raw === 'all' || raw === 'geral') return 'ambos';
    var code = _countryIso(raw);
    if (code === 'ES' || code === 'PT') return code;
    return '';
  }

  function _tenantFiscalCountryForSettings() {
    var geral = _config.geral || {};
    var conta = _config.conta_usuario || {};
    var endereco = _config.endereco || {};
    var candidates = [
      geral.fiscalCountry, geral.countryFiscal, geral.paisFiscal, geral.taxCountry, geral.fiscal_country,
      conta.fiscalCountry, conta.countryFiscal, conta.paisFiscal, conta.taxCountry, conta.fiscal_country,
      endereco.fiscalCountry, endereco.countryFiscal, endereco.paisFiscal, endereco.country,
      (_systemTenant || {}).fiscalCountry, (_systemTenant || {}).countryFiscal, (_systemTenant || {}).paisFiscal, (_systemTenant || {}).country,
      (_masterTenantControl || {}).fiscalCountry, (_masterTenantControl || {}).countryFiscal, (_masterTenantControl || {}).paisFiscal, (_masterTenantControl || {}).country,
      geral.country, geral.pais
    ];
    for (var i = 0; i < candidates.length; i++) {
      var code = _countryIso(candidates[i]);
      if (code === 'PT' || code === 'ES') return code;
    }
    return 'ES';
  }

  function _paymentCountryFromName(name) {
    var key = _normChannelName(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key === 'mb way' || key === 'mbway' || key === 'multibanco') return 'PT';
    if (key === 'bizum') return 'ES';
    return '';
  }

  function _paymentMethodCountryAllowed(country, name) {
    var normalized = _normalizePaymentCountry(country) || _paymentCountryFromName(name);
    if (!normalized || normalized === 'ambos') return true;
    return normalized === _tenantFiscalCountryForSettings();
  }

  function _paymentMethodKey(name) {
    return _normChannelName(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function _paymentMethodListForSettings() {
    var financeiro = _config.financeiro || {};
    var tenantSource = Array.isArray(financeiro.formas_pagamento) ? financeiro.formas_pagamento
      : (Array.isArray(financeiro.paymentMethodConfigs) ? financeiro.paymentMethodConfigs
      : (Array.isArray(financeiro.paymentMethods) ? financeiro.paymentMethods
      : (Array.isArray(financeiro.formasPagamento) ? financeiro.formasPagamento : [])));
    var globalSource = Array.isArray(_globalFinanceConfigForSettings().paymentMethodTypes) ? _globalFinanceConfigForSettings().paymentMethodTypes : [];
    var methods = [];
    function pushMethod(item, origin, idx) {
      if (typeof item === 'string') item = { name: item, active: true };
      item = item || {};
      var name = item.nome || item.name || item.label || item.id || item.slug || '';
      if (!name) return;
      var country = item.tipoGlobalCountry || item.countryFiscal || item.fiscalCountry || item.country || item.paisFiscal || '';
      var active = item.ativo !== false && item.active !== false && item.enabled !== false;
      if (!active) return;
      if (!_paymentMethodCountryAllowed(country, name)) return;
      methods.push({
        name: String(name).trim(),
        active: true,
        origin: origin,
        order: item.order != null ? Number(item.order) : (item.ordem != null ? Number(item.ordem) : (idx + 1) * 10)
      });
    }
    tenantSource.forEach(function (item, idx) { pushMethod(item, 'tenant', idx); });
    globalSource.forEach(function (item, idx) { pushMethod(item, 'master', idx); });
    if (!methods.length) {
      ['Dinheiro', 'Transferência', 'Cartão', 'Outro'].forEach(function (name, idx) {
        pushMethod({ name: name, active: true, countryFiscal: 'ambos', order: (idx + 1) * 10 }, 'fallback', idx);
      });
      if (_tenantFiscalCountryForSettings() === 'PT') {
        pushMethod({ name: 'MB Way', active: true, countryFiscal: 'PT', order: 50 }, 'fallback', 5);
        pushMethod({ name: 'Multibanco', active: true, countryFiscal: 'PT', order: 60 }, 'fallback', 6);
      }
      if (_tenantFiscalCountryForSettings() === 'ES') {
        pushMethod({ name: 'Bizum', active: true, countryFiscal: 'ES', order: 50 }, 'fallback', 5);
      }
    }
    var seen = {};
    return methods.filter(function (item) {
      var key = _paymentMethodKey(item.name);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    }).sort(function (a, b) {
      var ao = isFinite(a.order) ? a.order : 9999;
      var bo = isFinite(b.order) ? b.order : 9999;
      if (ao !== bo) return ao - bo;
      return String(a.name).localeCompare(String(b.name));
    });
  }

  function _tpvFinancePaymentMethods(selected) {
    var current = String(selected || '').trim();
    var methods = _paymentMethodListForSettings().map(function (item) {
      return {
        name: item.name,
        active: item.active !== false,
        legacy: item.legacy
      };
    });
    if (current && _paymentMethodCountryAllowed('', current) && !methods.some(function (item) { return _paymentMethodKey(item.name) === _paymentMethodKey(current); })) {
      methods.unshift({ name: current, active: false, legacy: true });
    }
    return methods;
  }

  function _renderTpv() {
    var c = _config.tpv || {};
    var enabled = c.enabled === true || c.tpvEnabled === true || c.active === true;
    var paymentMethods = _tpvFinancePaymentMethods(c.defaultPaymentMethod || '');
    var paymentOptions = _tpvPaymentMethodOptions(c.defaultPaymentMethod || '', paymentMethods);
    var content = document.getElementById('config-content');
    content.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:16px;max-width:980px;margin:0 auto;width:100%;">' +
        '<style>.tpv-settings .bf-input,.tpv-settings .bf-select{background:#FFFCF8;border-color:#E8DCD7;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.tpv-settings .bf-input:focus,.tpv-settings .bf-select:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);outline:none}.tpv-panel{display:grid;grid-template-columns:1fr;gap:14px}.tpv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 16px;align-items:start}.tpv-status-wrap{display:flex;flex-direction:column;align-items:flex-start;min-width:0}.tpv-status-field{background:#FFFCF8;border:0;border-radius:12px;padding:0;min-height:42px;display:flex;align-items:center;justify-content:flex-start;width:100%}.tpv-status-row{display:flex;align-items:center;justify-content:flex-start;gap:8px;min-height:42px;white-space:nowrap}.tpv-status-row input{accent-color:#C4362A;width:16px;height:16px;flex:0 0 auto}.tpv-status-row span{font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.2}.tpv-note{font-size:12px;color:#6F6860;line-height:1.48;background:#FFFCF8;border:1px solid #EADFD8;border-radius:14px;padding:10px 12px}.tpv-field-help{font-size:11px;color:#8A7E7C;line-height:1.38;margin-top:5px}.tpv-settings .bf-field label,.tpv-status-label{color:#7E716D;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.045em;margin-bottom:6px;display:block}@media(max-width:900px){.tpv-grid{grid-template-columns:1fr 1fr}.tpv-status-wrap{grid-column:1/-1}}@media(max-width:760px){.tpv-grid{grid-template-columns:1fr}.tpv-status-row{white-space:normal}}</style>' +
        '<section class="settings-card bf-card tpv-settings" style="background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF9 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 16px 38px rgba(47,37,35,.055);">' +
          '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">' +
            '<span class="mi" style="width:34px;height:34px;border-radius:12px;background:#F8F1ED;color:#8F3E32;display:inline-flex;align-items:center;justify-content:center;font-size:19px;flex:0 0 auto;">point_of_sale</span>' +
            '<div style="min-width:0;">' +
              '<h2 style="margin:0;color:#2F2523;font-size:20px;line-height:1.2;font-weight:700;">Venda presencial</h2>' +
              '<p style="margin:6px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:660px;">Configure o caixa usado para registrar vendas no balcão e enviar as entradas para o Financeiro.</p>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF7F2;border:1px solid #F0DED5;border-radius:14px;padding:12px 14px;margin-bottom:14px;color:#5D504B;font-size:13px;line-height:1.45;">' +
            '<span class="mi" style="font-size:18px;color:#A84A3E;line-height:1.2;">info</span>' +
            '<span>Quando ativada, a Venda presencial aparece no menu, cria a conta financeira do caixa e registra as vendas desse canal no painel.</span>' +
          '</div>' +
          '<div class="bf-panel tpv-panel" style="background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF8 100%);padding:16px;border:1px solid #EADFD8;border-radius:14px;box-shadow:0 10px 24px rgba(47,37,35,.045);">' +
            '<div class="tpv-grid">' +
              '<div class="tpv-status-wrap"><span class="tpv-status-label">Status</span><div class="tpv-status-field"><label class="tpv-status-row"><input id="cfg-tpv-enabled" type="checkbox"' + (enabled ? ' checked' : '') + '><span>Ativar venda presencial</span></label></div></div>' +
              '<div class="bf-field"><label>Nome do caixa</label><input id="cfg-tpv-register-name" class="bf-input" value="' + _esc(c.registerName || 'Caixa principal') + '" placeholder="Caixa principal"><div class="tpv-field-help">Nome interno para identificar o caixa usado nas vendas presenciais.</div></div>' +
              '<div class="bf-field"><label>Pagamento padrão</label><select id="cfg-tpv-default-payment" class="bf-select">' + paymentOptions + '</select></div>' +
              '<div class="bf-field"><label>Conta financeira</label><input class="bf-input" value="' + _esc(c.cashAccountName || (enabled ? 'Caixa venda presencial' : 'Será criada ao ativar')) + '" readonly><div class="tpv-field-help">As entradas da venda presencial entram nessa conta no Financeiro.</div></div>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<section class="bf-card bf-actions-row" style="padding:14px 16px;position:sticky;bottom:0;z-index:2;">' +
          '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Revise os dados antes de salvar.</div>' +
          '<button class="bf-btn bf-btn-primary" id="config-save">Salvar alterações</button>' +
        '</section>' +
      '</div>';
    document.getElementById('config-save').onclick = function () {
      _saveTpvSettings(Object.assign({}, _config.tpv || {}, {
        enabled: _checked('cfg-tpv-enabled'),
        registerName: _val('cfg-tpv-register-name') || 'Caixa principal',
        defaultPaymentMethod: _val('cfg-tpv-default-payment'),
        channel: 'Venda presencial',
        updatedAt: new Date().toISOString()
      }));
    };
  }

  function _renderFiscalActivation() {
    var c = _config.fiscal || {};
    if (typeof _fiscalEnabledDraft !== 'boolean') _fiscalEnabledDraft = c.usarCalculoFiscal === true;
    var fiscalCountry = _tenantFiscalCountryForSettings();
    var fiscalCfg = window.FiscalConfig ? FiscalConfig.get(fiscalCountry) : null;
    var fiscalLabel = fiscalCfg ? fiscalCfg.label : (fiscalCountry === 'PT' ? 'Portugal' : 'Espanha');
    var enabled = _fiscalEnabledDraft === true;
    var statusLabel = enabled ? 'Fiscal ativado' : 'Fiscal desligado';
    var statusText = enabled
      ? 'O menu Fiscal aparece no painel. Produtos, compras e Plano de Voo passam a considerar IVA, IRPF e reserva fiscal.'
      : 'O menu Fiscal fica oculto. Produtos, compras e Plano de Voo seguem sem reserva fiscal automática.';
    var content = document.getElementById('config-content');
    content.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:16px;max-width:980px;margin:0 auto;width:100%;">' +
        '<style>.fiscal-activation .bf-input{background:#FFFCF8;border-color:#E8DCD7}.fiscal-activation-card{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF9 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 16px 38px rgba(47,37,35,.055)}.fiscal-activation-panel{background:linear-gradient(180deg,#FFFFFF 0%,#FFFCF8 100%);padding:16px;border:1px solid #EADFD8;border-radius:14px;box-shadow:0 10px 24px rgba(47,37,35,.045)}.fiscal-toggle-btn{height:42px;border-radius:999px;border:1px solid #E3D5CF;background:#fff;color:#6F6860;padding:0 14px;font-family:inherit;font-size:13px;font-weight:850;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 8px 18px rgba(31,31,31,.045)}.fiscal-toggle-btn .mi{font-size:18px}.fiscal-toggle-btn.active{background:#FFF1EE;border-color:#E4B7AE;color:#B42318}.fiscal-toggle-btn.active .mi{color:#1F6F43}.fiscal-activation-grid{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:14px;align-items:center}.fiscal-activation-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.fiscal-activation-info-card{border:1px solid #EADFD8;border-radius:14px;background:#FFFCF8;padding:12px}.fiscal-activation-info-card span{display:block;color:#8A7E7C;font-size:10px;font-weight:850;letter-spacing:.055em;text-transform:uppercase;margin-bottom:5px}.fiscal-activation-info-card strong{display:block;color:#1F1F1F;font-size:13px;line-height:1.3}.fiscal-activation-help{font-size:12px;color:#6F6860;line-height:1.48;margin-top:7px}@media(max-width:760px){.fiscal-activation-grid,.fiscal-activation-info{grid-template-columns:1fr}.fiscal-toggle-btn{width:100%;justify-content:center}}</style>' +
        '<section class="fiscal-activation fiscal-activation-card">' +
          '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">' +
            '<span class="mi" style="width:34px;height:34px;border-radius:12px;background:#F8F1ED;color:#8F3E32;display:inline-flex;align-items:center;justify-content:center;font-size:19px;flex:0 0 auto;">request_quote</span>' +
            '<div style="min-width:0;">' +
              '<h2 style="margin:0;color:#2F2523;font-size:20px;line-height:1.2;font-weight:700;">Fiscal</h2>' +
              '<p style="margin:6px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:680px;">Ative esta parte somente quando quiser acompanhar IVA, IRPF e reserva fiscal no painel.</p>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF7F2;border:1px solid #F0DED5;border-radius:14px;padding:12px 14px;margin-bottom:14px;color:#5D504B;font-size:13px;line-height:1.45;">' +
            '<span class="mi" style="font-size:18px;color:#A84A3E;line-height:1.2;">info</span>' +
            '<span>Quando ativar e salvar, o menu Fiscal aparece no painel. A configuração completa de IVA, IRPF e dados fiscais fica dentro desse módulo.</span>' +
          '</div>' +
          '<div class="fiscal-activation-panel">' +
            '<div class="fiscal-activation-grid">' +
              '<div style="min-width:0;">' +
                '<div style="font-size:11px;font-weight:850;color:#7E716D;text-transform:uppercase;letter-spacing:.055em;margin-bottom:6px;">Status do Fiscal</div>' +
                '<div id="cfg-fiscal-status-title" style="font-size:16px;font-weight:850;color:#1F1F1F;line-height:1.25;">' + _esc(statusLabel) + '</div>' +
                '<div id="cfg-fiscal-status-text" class="fiscal-activation-help">' + _esc(statusText) + '</div>' +
              '</div>' +
              '<button id="cfg-fiscal-toggle" type="button" class="fiscal-toggle-btn' + (enabled ? ' active' : '') + '" onclick="Modules.Configuracoes._toggleFiscalEnabled()"><span class="mi">' + (enabled ? 'toggle_on' : 'toggle_off') + '</span><span>' + (enabled ? 'Desligar Fiscal' : 'Ativar Fiscal') + '</span></button>' +
            '</div>' +
            '<div class="fiscal-activation-info">' +
              '<div class="fiscal-activation-info-card"><span>País fiscal</span><strong>' + _esc(fiscalLabel) + '</strong><div class="fiscal-activation-help">Vem dos dados gerais do negócio.</div></div>' +
              '<div class="fiscal-activation-info-card"><span>Menu Fiscal</span><strong>' + (enabled ? 'Aparece no painel' : 'Fica oculto') + '</strong><div class="fiscal-activation-help">O menu abre a configuração completa e os acompanhamentos fiscais.</div></div>' +
              '<div class="fiscal-activation-info-card"><span>Plano de Voo</span><strong>' + (enabled ? 'Considera reserva fiscal' : 'Sem reserva fiscal') + '</strong><div class="fiscal-activation-help">Ajuda a separar dinheiro que pode precisar ficar guardado para impostos.</div></div>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<section class="bf-card bf-actions-row" style="padding:14px 16px;position:sticky;bottom:0;z-index:2;">' +
          '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Depois de salvar, o menu lateral é atualizado automaticamente.</div>' +
          '<button class="bf-btn bf-btn-primary" id="config-save">Salvar alterações</button>' +
        '</section>' +
      '</div>';
    document.getElementById('config-save').onclick = function () {
      _save('fiscal', Object.assign({}, _config.fiscal || {}, {
        usarCalculoFiscal: _fiscalEnabledDraft === true,
        fiscalDecisionSaved: true,
        fiscalCountry: fiscalCountry,
        updatedAt: new Date().toISOString()
      }));
    };
  }

  function _toggleFiscalEnabled() {
    _fiscalEnabledDraft = _fiscalEnabledDraft !== true;
    var enabled = _fiscalEnabledDraft === true;
    var btn = document.getElementById('cfg-fiscal-toggle');
    var title = document.getElementById('cfg-fiscal-status-title');
    var text = document.getElementById('cfg-fiscal-status-text');
    if (btn) {
      btn.className = 'fiscal-toggle-btn' + (enabled ? ' active' : '');
      btn.innerHTML = '<span class="mi">' + (enabled ? 'toggle_on' : 'toggle_off') + '</span><span>' + (enabled ? 'Desligar Fiscal' : 'Ativar Fiscal') + '</span>';
    }
    if (title) title.textContent = enabled ? 'Fiscal ativado' : 'Fiscal desligado';
    if (text) text.textContent = enabled
      ? 'O menu Fiscal aparece no painel. Produtos, compras e Plano de Voo passam a considerar IVA, IRPF e reserva fiscal.'
      : 'O menu Fiscal fica oculto. Produtos, compras e Plano de Voo seguem sem reserva fiscal automática.';
    _renderFiscalActivation();
  }

  function _saveTpvSettings(data) {
    data = data || {};
    _ensureTpvCashAccount(data).then(function (nextData) {
      _save('tpv', nextData);
    }).catch(function (err) {
      UI.toast('Erro ao preparar conta da venda presencial: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _ensureTpvCashAccount(data) {
    if (!data || data.enabled !== true) return Promise.resolve(data);
    var existingId = String(data.cashAccountId || (_config.tpv && _config.tpv.cashAccountId) || '').trim();
    var now = new Date().toISOString();
    return DB.getAll('contas_bancarias').catch(function () { return []; }).then(function (accounts) {
      accounts = Array.isArray(accounts) ? accounts : [];
      var account = existingId ? accounts.find(function (item) { return String(item.id || '') === existingId; }) : null;
      if (!account) {
        account = accounts.find(function (item) {
          var name = _slugify(item && (item.nome || item.name || ''));
          return !!(item && (item.tpvDefault === true || item.systemKey === 'tpv_cash' || name === 'caixa-venda-presencial'));
        });
      }
      if (account && account.id) {
        return Object.assign({}, data, {
          cashAccountId: String(account.id),
          cashAccountName: account.nome || account.name || 'Caixa venda presencial'
        });
      }
      var payload = {
        nome: 'Caixa venda presencial',
        tipo: 'caixa',
        ativo: true,
        saldoInicial: 0,
        saldo_inicial: 0,
        tpvDefault: true,
        systemKey: 'tpv_cash',
        origem: 'venda_presencial',
        observacao: 'Conta criada automaticamente para receber as entradas da Venda presencial.',
        createdAt: now,
        updatedAt: now
      };
      return DB.add('contas_bancarias', payload).then(function (ref) {
        var id = String((ref && ref.id) || '');
        return Object.assign({}, data, {
          cashAccountId: id,
          cashAccountName: payload.nome
        });
      });
    });
  }

  function _tpvPaymentMethodOptions(selected, methods) {
    var current = String(selected || '').trim();
    var html = '<option value="">Selecionar forma de pagamento...</option>';
    html += (methods || []).filter(function (item) {
      return item.active !== false || item.name === current;
    }).map(function (item) {
      var extra = item.legacy ? ' (não listado no Financeiro)' : (item.active === false ? ' (inativa)' : '');
      return '<option value="' + _esc(item.name) + '"' + (item.name === current ? ' selected' : '') + '>' + _esc(item.name + extra) + '</option>';
    }).join('');
    return html;
  }

  function _paint(title, desc, body, collect) {
    var content = document.getElementById('config-content');
    content.innerHTML = '<div class="settings-card bf-card">' +
      '<div class="settings-card-head"><h2>' + title + '</h2><p>' + desc + '</p></div>' +
      '<div class="settings-grid">' + body + '</div>' +
      '<button class="bf-btn bf-btn-primary" id="config-save" style="width:100%;">Salvar configurações</button>' +
      '</div>';
    document.getElementById('config-save').onclick = function () {
      _save(_activeSub, collect());
    };
  }

  function _configCardStyle(pad) {
    return 'background:#fff;border:none;border-radius:16px;padding:' + (pad || '18px 20px') + ';box-shadow:0 12px 30px rgba(31,31,31,.06);';
  }

  function _configChip(txt) {
    return '<span class="bf-badge" style="background:#fff;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(txt) + '</span>';
  }

  function _configInput(id, label, value, placeholder, type, autocomplete, name) {
    return '<div class="bf-field"><label>' + _esc(label) + '</label><input id="' + id + '" class="bf-input" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '" placeholder="' + _esc(placeholder || '') + '"' + (autocomplete ? ' autocomplete="' + _esc(autocomplete) + '"' : '') + (name ? ' name="' + _esc(name) + '"' : '') + '></div>';
  }

  function _configInputWithHelp(id, label, value, placeholder, help, type, autocomplete, name) {
    return '<div class="bf-field"><label>' + _esc(label) + '</label><input id="' + id + '" class="bf-input" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '" placeholder="' + _esc(placeholder || '') + '"' + (autocomplete ? ' autocomplete="' + _esc(autocomplete) + '"' : '') + (name ? ' name="' + _esc(name) + '"' : '') + '><div class="contact-field-help">' + _esc(help || '') + '</div></div>';
  }

  function _phoneInput(countryId, phoneId, label, countryCode, phone, placeholder) {
    return '<div class="bf-field"><label>' + _esc(label) + '</label><div class="bf-phone-row">' +
      '<select id="' + countryId + '" class="bf-select">' + _phoneCountryOptions(countryCode) + '</select>' +
      '<input id="' + phoneId + '" class="bf-input" type="tel" value="' + _esc(phone == null ? '' : phone) + '" placeholder="' + _esc(placeholder || '') + '" autocomplete="tel-national">' +
      '</div></div>';
  }

  function _integrationPhoneInput(countryId, phoneId, label, countryCode, phone, placeholder) {
    return '<div class="bf-field"><label>' + _esc(label) + '</label><div class="integrations-phone-box">' +
      '<select id="' + countryId + '" class="bf-select" aria-label="Código do país">' + _phoneCountryOptions(countryCode) + '</select>' +
      '<input id="' + phoneId + '" class="bf-input" type="tel" value="' + _esc(phone == null ? '' : phone) + '" placeholder="' + _esc(placeholder || '') + '" autocomplete="tel-national">' +
      '</div></div>';
  }

  function _contactPhoneInput(countryId, phoneId, label, countryCode, phone, placeholder, help) {
    return '<div class="bf-field"><label>' + _esc(label) + '</label>' +
      '<div class="contact-phone-box">' +
        '<select id="' + countryId + '" class="bf-select" aria-label="Código do país">' + _phoneCountryOptions(countryCode) + '</select>' +
        '<input id="' + phoneId + '" class="bf-input" type="tel" value="' + _esc(phone == null ? '' : phone) + '" placeholder="' + _esc(placeholder || '') + '" autocomplete="tel-national">' +
      '</div>' +
      '<div class="contact-field-help">' + _esc(help || '') + '</div>' +
    '</div>';
  }

  function _phoneCountryOptions(selected) {
    var current = String(selected || '+34');
    return [
      ['+34', '🇪🇸 +34'],
      ['+351', '🇵🇹 +351'],
      ['+55', '🇧🇷 +55'],
      ['+33', '🇫🇷 +33'],
      ['+39', '🇮🇹 +39'],
      ['+49', '🇩🇪 +49'],
      ['+44', '🇬🇧 +44'],
      ['+1', '🇺🇸 +1'],
      ['', 'Outro']
    ].map(function (opt) {
      return '<option value="' + _esc(opt[0]) + '"' + (opt[0] === current ? ' selected' : '') + '>' + _esc(opt[1]) + '</option>';
    }).join('');
  }

  function _defaultPhoneCode(fiscalCountry) {
    if (fiscalCountry === 'PT') return '+351';
    if (fiscalCountry === 'BR') return '+55';
    if (fiscalCountry === 'FR') return '+33';
    if (fiscalCountry === 'IT') return '+39';
    if (fiscalCountry === 'DE') return '+49';
    if (fiscalCountry === 'GB') return '+44';
    if (fiscalCountry === 'US') return '+1';
    return '+34';
  }

  function _splitPhoneForForm(fullValue, fallbackCode) {
    var value = String(fullValue || '').trim();
    var code = String(fallbackCode || '+34').trim();
    var digits = _cleanPhoneNumber(value);
    var countries = ['+351', '+34', '+55', '+33', '+39', '+49', '+44', '+1'];
    for (var i = 0; i < countries.length; i += 1) {
      var dial = countries[i];
      var dialDigits = _cleanPhoneNumber(dial);
      if (value.indexOf(dial) === 0 || digits.indexOf(dialDigits) === 0) {
        code = dial;
        digits = digits.slice(dialDigits.length);
        break;
      }
    }
    return { countryCode: code, number: digits, full: _phoneFull(code, digits) };
  }

  function _languageOptions() {
    return [
      ['pt-BR', '🇧🇷 Português'],
      ['es-ES', '🇪🇸 Espanhol']
    ];
  }

  function _configTextarea(id, label, value, placeholder) {
    return '<div class="bf-field"><label>' + _esc(label) + '</label><textarea id="' + id + '" class="bf-textarea" placeholder="' + _esc(placeholder || '') + '" style="min-height:118px;line-height:1.45;">' + _esc(value == null ? '' : value) + '</textarea></div>';
  }

  function _configSelect(id, label, value, options) {
    var selected = String(value == null ? '' : value);
    return '<div class="bf-field"><label>' + _esc(label) + '</label><select id="' + id + '" class="bf-select">' + (options || []).map(function (opt) {
      return '<option value="' + _esc(opt[0]) + '"' + (String(opt[0]) === selected ? ' selected' : '') + '>' + _esc(opt[1]) + '</option>';
    }).join('') + '</select></div>';
  }

  function _configInputStyle() {
    return 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);';
  }

  function _configLabelStyle() {
    return 'font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;';
  }

  function _configPrimaryStyle() {
    return 'height:40px;padding:0 16px;border-radius:12px;border:none;background:#B42318;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(180,35,24,.16);';
  }

  function _slugify(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 48);
  }

  function _reservedStoreSlugs() {
    return {
      admin: true,
      'admin-html': true,
      index: true,
      'index-html': true,
      cadastro: true,
      login: true,
      master: true,
      'master-html': true,
      termos: true,
      termosdeuso: true,
      privacidade: true,
      politicadeprivacidade: true,
      'redefinir-senha': true,
      rr: true,
      api: true,
      review: true,
      track: true
    };
  }

  function _isReservedStoreSlug(slug) {
    return !!_reservedStoreSlugs()[_slugify(slug)];
  }

  function _storeSlugVisualValidation(slug) {
    slug = _slugify(slug);
    if (!slug) return { valid: false, message: 'Digite o nome da sua loja para montar o link.' };
    if (slug.length < 3) return { valid: false, message: 'Use pelo menos 3 caracteres no nome da loja.' };
    if (_isReservedStoreSlug(slug)) return { valid: false, message: 'Esse nome não pode ser usado no link da loja.' };
    return { valid: true, message: 'Nome pronto para usar no link da loja.' };
  }

  function _updateStoreSlugFeedback(slug) {
    var field = document.getElementById('cfg-store-slug-field');
    var icon = document.getElementById('cfg-store-slug-icon');
    var help = document.getElementById('cfg-store-slug-help');
    if (!field) return;
    var result = _storeSlugVisualValidation(slug);
    field.classList.toggle('valid', result.valid);
    field.classList.toggle('invalid', !result.valid);
    if (icon) icon.textContent = result.valid ? 'check' : 'close';
    if (help) help.textContent = result.message;
  }

  function _validateStoreSlugAvailable(slug) {
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId || !window.firebase || !firebase.firestore) return Promise.reject(new Error('Tenant não identificado.'));
    if (!slug) return Promise.reject(new Error('Informe o nome do link da loja.'));
    if (_isReservedStoreSlug(slug)) return Promise.reject(new Error('Esse nome não pode ser usado no link da loja.'));
    return firebase.firestore().collection('public_stores').doc(slug).get().then(function (snap) {
      if (!snap.exists) return true;
      var data = snap.data() || {};
      if (data.tenantId && data.tenantId !== tenantId) {
        throw new Error('Esse nome de link já está sendo usado por outra loja.');
      }
      return true;
    });
  }

  function _cleanDomain(value) {
    return String(value || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  }

  function _domainBase(slug, rootDomain, c) {
    if (slug) return 'https://bocafood.app/loja/' + slug;
    return 'https://bocafood.app/loja/aguardando-slug';
  }

  function _domainUrls(slug, rootDomain, c) {
    var base = _domainBase(slug, rootDomain, c);
    return {
      publicUrl: base,
      loginUrl: base + '/login',
      orderUrl: base + '/#pedido',
      trackUrl: base + '/track.html',
      reviewUrl: base + '/review',
      apiUrl: base + '/api'
    };
  }

  function _domainUrlCard(label, url, sub, icon, featured) {
    return '<div style="background:' + (featured ? '#fff' : '#FAF8F4') + ';border:1px solid ' + (featured ? '#E5D3CF' : '#EAE4DA') + ';border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0;box-shadow:' + (featured ? '0 12px 30px rgba(31,31,31,.06)' : 'none') + ';">' +
      '<div style="display:flex;align-items:flex-start;gap:10px;">' +
        '<div style="width:34px;height:34px;border-radius:11px;background:' + (featured ? '#FAF8F4' : '#fff') + ';color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:19px;">' + _esc(icon || 'link') + '</span></div>' +
        '<div style="min-width:0;flex:1;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">' + _esc(label) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;">' + _esc(sub || '') + '</div></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
        '<code style="flex:1;min-width:0;background:#fff;border:1px solid #EAE4DA;border-radius:10px;padding:8px 10px;font-size:12px;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(url) + '</code>' +
        '<button type="button" onclick="Modules.Configuracoes._copyDomainValue(\'' + _esc(url) + '\')" title="Copiar" style="width:34px;height:34px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><span class="mi" style="font-size:17px;">content_copy</span></button>' +
      '</div>' +
    '</div>';
  }

  function _domainStatusCard(label, value, sub, color, icon) {
    return '<div style="display:flex;align-items:center;gap:12px;background:#FAF8F4;border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:74px;">' +
      '<div style="width:42px;height:42px;border-radius:14px;background:transparent;color:' + (color || '#6F6860') + ';display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:24px;">' + _esc(icon || 'info') + '</span></div>' +
      '<div style="min-width:0;"><div style="font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</div><div style="font-size:18px;font-weight:700;color:#1F1F1F;line-height:1.12;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(value) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(sub || '') + '</div></div>' +
    '</div>';
  }

  function _integrationInfoRow(icon, title, text) {
    return '<div style="display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;">' +
      '<div style="width:32px;height:32px;border-radius:11px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:18px;">' + _esc(icon || 'check_circle') + '</span></div>' +
      '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">' + _esc(title) + '</div><div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:2px;">' + _esc(text || '') + '</div></div>' +
    '</div>';
  }

  function _planMetric(label, value, hint) {
    return '<div style="border:1px solid #EAE4DA;border-radius:14px;background:#FAF8F4;padding:13px 14px;min-height:74px;">' +
      '<div style="font-size:12px;color:#6F6860;font-weight:600;line-height:1.2;">' + _esc(label) + '</div>' +
      '<div style="font-size:18px;color:#1F1F1F;font-weight:700;line-height:1.15;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(value || 'Não configurado') + '</div>' +
      '<div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:4px;">' + _esc(hint || '') + '</div>' +
    '</div>';
  }

  function _generalMiniInfo(label, value) {
    return '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:13px;padding:11px 12px;min-width:0;">' +
      '<div style="font-size:11px;color:#6F6860;font-weight:600;line-height:1.2;">' + _esc(label) + '</div>' +
      '<div style="font-size:13px;color:#1F1F1F;font-weight:700;line-height:1.25;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(value || 'Não informado') + '</div>' +
    '</div>';
  }

  function _planListRow(icon, title, text, color) {
    return '<div style="display:flex;align-items:flex-start;gap:10px;padding:11px 12px;border:1px solid #EAE4DA;border-radius:13px;background:#FAF8F4;">' +
      '<span class="mi" style="font-size:18px;color:' + (color || '#6F6860') + ';line-height:1.2;">' + _esc(icon || 'info') + '</span>' +
      '<div style="min-width:0;"><div style="font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;">' + _esc(title || '-') + '</div><div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:2px;word-break:break-word;">' + _esc(text == null || text === '' ? 'Não configurado' : text) + '</div></div>' +
    '</div>';
  }

  function _planEmpty(text) {
    return '<div style="padding:18px;border:1px dashed #E4D9D6;border-radius:14px;background:#FBF5F3;color:#8A7E7C;text-align:center;font-size:13px;line-height:1.4;">' + _esc(text || 'Ainda não configurado.') + '</div>';
  }

  function _dateFromAny(value) {
    if (!value) return null;
    if (value && typeof value.toDate === 'function') return value.toDate();
    if (value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function _trialState(trialEndsAt, billingStatus) {
    var d = _dateFromAny(trialEndsAt);
    if (!d) return { status: 'none', daysLeft: null, dateText: '' };
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(d.getTime());
    end.setHours(0, 0, 0, 0);
    var daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);
    return {
      status: daysLeft <= 0 ? 'expired' : 'active',
      daysLeft: daysLeft,
      dateText: _formatPlanDate(trialEndsAt)
    };
  }

  function _trialBannerHtml(state, billingStatus, accountStatus) {
    if (!state || state.status === 'none') return '';
    var billingActive = _isBillingActive(billingStatus);
    var accessActive = String(accountStatus || '').toLowerCase() === 'active';
    if (state.status === 'expired' && billingActive && accessActive) return '';
    var title = 'Você está no período grátis';
    var text = 'Seu acesso grátis termina em ' + state.dateText + '. Aproveite esse período para configurar seu negócio no BocaFood.';
    var showActions = false;
    var primary = 'Escolher plano';
    if (state.status === 'expired') {
      title = 'Seu período grátis terminou';
      text = 'Escolha um plano para continuar usando o BocaFood sem interrupção.';
      showActions = true;
      primary = 'Escolher plano';
    } else if (state.daysLeft === 1) {
      title = 'Seu período grátis termina amanhã';
      text = 'Escolha um plano para continuar usando o BocaFood sem interromper seu acesso.';
      showActions = true;
    } else if (state.daysLeft <= 5) {
      title = 'Seu período grátis termina em breve';
      text = 'Seu acesso grátis termina em ' + Math.max(0, state.daysLeft) + ' dias. Escolha um plano para continuar usando o BocaFood sem interrupção.';
      showActions = true;
    }
    return '<section class="plan-trial-banner">' +
      '<div class="plan-trial-main"><div class="plan-trial-icon"><span class="mi" style="font-size:20px;">hourglass_top</span></div><div><h3>' + _esc(title) + '</h3><p>' + _esc(text) + '</p></div></div>' +
      (showActions ? '<div class="plan-trial-actions"><button type="button" class="bf-btn bf-btn-primary" onclick="Router.navigate(\'suporte/chamado\')">' + _esc(primary) + '</button><button type="button" class="plan-secondary-btn" onclick="Router.navigate(\'suporte/chamado\')">Falar com suporte</button></div>' : '') +
    '</section>';
  }

  function _trialCardValue(state) {
    if (!state || state.status === 'none') return 'Não configurado';
    if (state.status === 'expired') return 'Encerrado';
    if (state.daysLeft === 1) return 'Termina amanhã';
    if (state.daysLeft === 0) return 'Termina hoje';
    return 'Termina em ' + state.daysLeft + ' dias';
  }

  function _isBillingActive(status) {
    var value = String(status || '').toLowerCase();
    return value === 'active' || value === 'paid' || value === 'approved';
  }

  function _planTimelineRows(profile, billing, trialState) {
    var rows = [];
    var createdAt = profile.createdAt || profile.created_at || profile.created || '';
    if (createdAt) {
      rows.push(_planTimelineItem('rocket_launch', 'Acesso liberado', 'Sua conta BocaFood foi criada e já está pronta para uso.', _formatPlanDate(createdAt), 'Concluído'));
    }
    if (trialState && trialState.dateText) {
      var daysText = trialState.daysLeft > 1 ? trialState.daysLeft + ' dias grátis' : (trialState.daysLeft === 1 ? '1 dia grátis' : 'período grátis');
      rows.push(_planTimelineItem('hourglass_top', trialState.status === 'expired' ? 'Período grátis encerrado' : 'Período grátis ativo', trialState.status === 'expired' ? 'O período grátis chegou ao fim.' : 'Você ainda tem ' + daysText + ' para usar o BocaFood.', 'Termina em ' + trialState.dateText, trialState.status === 'expired' ? 'Encerrado' : 'Ativo'));
      rows.push(_planTimelineItem('workspace_premium', 'Próxima etapa', 'Escolha um plano antes do fim do período grátis para continuar usando sem interrupção.', '', 'Pendente', true));
    }
    if (!rows.length) {
      rows.push(_planTimelineItem('info', 'Plano em preparação', 'Quando houver informações do período grátis ou assinatura, elas aparecerão aqui.', '', 'Aguardando'));
    }
    return rows.join('');
  }

  function _planTimelineItem(icon, title, text, date, status, showCta) {
    return '<div class="plan-timeline-item">' +
      '<span class="mi plan-timeline-icon">' + _esc(icon || 'info') + '</span>' +
      '<div><div class="plan-timeline-title">' + _esc(title || '') + '</div><div class="plan-timeline-text">' + _esc(text || '') + '</div>' +
        '<span class="plan-timeline-status">' + _esc(status || '') + '</span>' +
        (showCta ? '<div style="margin-top:9px;"><button type="button" class="bf-btn bf-btn-primary" onclick="Router.navigate(\'suporte/chamado\')" style="height:34px;padding:0 12px;font-size:12px;">Escolher plano</button></div>' : '') +
      '</div>' +
      '<div class="plan-timeline-date">' + _esc(date || '') + '</div>' +
    '</div>';
  }

  function _realBillingRows(profile, billing, trialState, postTrialActive) {
    var charges = billing.charges || profile.billingCharges || profile.charges || [];
    if (!Array.isArray(charges) || !charges.length) {
      var postTrial = trialState && trialState.status === 'expired';
      return '<div class="plan-empty-billing"><strong>Nenhuma cobrança realizada ainda.</strong>' + (postTrial ? (postTrialActive ? 'Quando houver pagamentos ou renovações, eles aparecerão aqui.' : 'Quando sua assinatura estiver ativa, os pagamentos e renovações aparecerão aqui.') : 'Você está usando o período grátis do BocaFood.') + '</div>';
    }
    return '<div class="plan-history-table-wrap"><table class="plan-history-table"><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Recibo</th></tr></thead><tbody>' + charges.map(function (item) {
      return '<tr><td>' + _esc(_formatPlanDate(item.date || item.createdAt || item.paidAt || '')) + '</td><td>' + _esc(item.description || item.title || 'Cobrança do plano') + '</td><td>' + _esc(item.amount || item.value || '-') + '</td><td>' + _esc(item.status || '-') + '</td><td>' + (item.receiptUrl ? '<a href="' + _esc(item.receiptUrl) + '" target="_blank" rel="noopener" style="color:#B42318;font-weight:800;text-decoration:none;">Ver recibo</a>' : '-') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  function _planDisplay(plan) {
    var map = { essencial: 'Plano Essencial', starter: 'Plano Essencial', compromisso_anual: 'Plano Compromisso Anual', fundadoras: 'Plano Fundadoras' };
    var value = String(plan || 'essencial').trim();
    return map[value] || value;
  }

  function _accountStatusDisplay(status) {
    var map = { active: 'Ativo', pending: 'Pendente', paused: 'Pausado', disabled: 'Bloqueado', blocked: 'Bloqueado', canceled: 'Cancelado', inactive: 'Inativo', archived: 'Arquivado' };
    var value = String(status || 'active').trim();
    return map[value] || value;
  }

  function _billingCycleDisplay(cycle) {
    var map = { monthly: 'Mensal', month: 'Mensal', mensal: 'Mensal', annual: 'Anual', yearly: 'Anual', anual: 'Anual' };
    var value = String(cycle || '').trim();
    return value ? (map[value] || value) : 'Ainda não configurada';
  }

  function _billingStatusDisplay(status) {
    var map = { active: 'Ativo', trial: 'Período grátis', trialing: 'Período grátis', pending: 'Pendente', pending_payment: 'Pagamento pendente', past_due: 'Pagamento em atraso', canceled: 'Cancelado', refunded: 'Reembolsado', chargeback: 'Chargeback', inactive: 'Inativo' };
    var value = String(status || '').trim();
    return value ? (map[value] || value) : 'Não configurado';
  }

  function _countryDisplay(country) {
    var map = { ES: 'Espanha', PT: 'Portugal', BR: 'Brasil', FR: 'França', IT: 'Itália', DE: 'Alemanha', GB: 'Reino Unido', US: 'Estados Unidos', OTHER: 'Outro' };
    var value = String(country || '').trim();
    var upper = value.toUpperCase();
    return map[upper] || value || 'Não configurado';
  }

  function _roleDisplay(role) {
    var map = { master_admin: 'Master admin', master: 'Master admin', store_owner: 'Responsável pela loja', tenant_owner: 'Responsável pela loja', owner: 'Responsável pela loja', store_staff: 'Equipe da loja', manager: 'Gestor', store_customer: 'Cliente da loja', pending_classification: 'Pendente' };
    var value = String(role || '').trim();
    return map[value] || value || 'Não configurado';
  }

  function _formatPlanDate(value) {
    if (!value) return 'Não configurado';
    var d = _dateFromAny(value);
    if (!d) return String(value);
    return d.toLocaleDateString('pt-PT');
  }

  function _valueOrPending(value) {
    return value == null || value === '' ? 'Não configurado' : String(value);
  }

  function _humanizePlanKey(key) {
    return String(key || '').replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function _normalizeDomainSlugField(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var normalized = _slugify(el.value);
    if (el.value !== normalized) el.value = normalized;
    if (id === 'cfg-store-slug') _updateStoreSlugFeedback(normalized);
  }

  function _copyDomainValue(value) {
    var text = String(value || '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { UI.toast('Link copiado.', 'success'); }).catch(function () { UI.toast(text, 'info'); });
    } else {
      UI.toast(text, 'info');
    }
  }

  function _save(key, data) {
    data = _cleanFirestorePayload(data);
    DB.setDocRoot('config', key, data).then(function () {
      _config[key] = data;
      if (key === 'aparencia') {
        _config.geral = _cleanFirestorePayload(Object.assign({}, _config.geral || {}, data));
        DB.setDocRoot('config', 'geral', _config.geral).catch(function (err) {
          console.error('Config sync geral/aparencia error', err);
        });
      }
      if (key === 'tpv') {
        _ensureFixedChannels();
        if (window.AdminApp && typeof AdminApp.applyTpvVisibility === 'function') AdminApp.applyTpvVisibility();
      }
      if (key === 'fiscal') {
        if (window.AdminApp && typeof AdminApp.applyFiscalVisibility === 'function') AdminApp.applyFiscalVisibility();
      }
      _syncSystemTenantFromConfig(key, data).catch(function (err) {
        console.warn('[Configuracoes] sync system_tenants falhou', { key: key, message: err && err.message ? err.message : String(err || '') });
      });
      if (['geral', 'endereco', 'template', 'integracoes'].indexOf(key) >= 0) {
        _recordActivity({
          action: 'store_settings_updated',
          module: 'configuracoes/' + key,
          entityType: 'store',
          entityId: window.Auth && Auth.getTenantId ? Auth.getTenantId() : '',
          summary: 'Configurações da loja atualizadas.',
          severity: 'info',
          metadata: { screen: key }
        });
      }
      UI.toast('Configurações salvas', 'success');
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _cleanFirestorePayload(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return typeof item === 'undefined' ? null : _cleanFirestorePayload(item);
      });
    }
    if (value && typeof value === 'object') {
      return Object.keys(value).reduce(function (acc, key) {
        if (typeof value[key] === 'undefined') return acc;
        acc[key] = _cleanFirestorePayload(value[key]);
        return acc;
      }, {});
    }
    return value;
  }

  function _syncSystemTenantFromConfig(key, data) {
    if (key !== 'geral' && key !== 'endereco' && key !== 'template' && key !== 'integracoes') return Promise.resolve();
    var tenantId = window.Auth && Auth.getTenantId ? Auth.getTenantId() : '';
    if (!tenantId || !window.firebase || !firebase.firestore) return Promise.resolve();
    var now = new Date().toISOString();
    var patch = { updatedAt: now };
    var currentStore = ((_systemTenant && _systemTenant.store) || {});
    var currentAddress = ((_systemTenant && _systemTenant.accountAddress) || {});
    var zoneLocation = _primaryDeliveryZoneLocation(key === 'template' ? data : null);
    var hasZoneLocation = !!(zoneLocation.city || zoneLocation.province || zoneLocation.country || zoneLocation.postalCode);
    var hasCurrentDeliveryLocation = currentStore.locationSource === 'delivery_area' && !!(currentStore.city || currentStore.region || currentStore.province || currentStore.country || currentStore.postalCode);
    if (key === 'geral') {
      var phoneCode = data.phoneCountryCode || '';
      var phoneNumber = _cleanPhoneNumber(data.phone || '');
      var phoneFull = _phoneFull(phoneCode, phoneNumber);
      var storeWhatsappCode = data.whatsappCountryCode || '';
      var storeWhatsappNumber = _cleanPhoneNumber(data.whatsapp || '');
      var storeWhatsappFull = _phoneFull(storeWhatsappCode, storeWhatsappNumber);
      var addressCountry = _countryIso((data.companyAddress && data.companyAddress.country) || data.companyCountry || data.country || '');
      var businessName = data.businessName || data.tradeName || data.commercialName || (currentStore && currentStore.name) || '';
      var legalName = data.legalName || data.companyLegalName || '';
      var fiscalDocument = data.companyFiscalId || data.fiscalDocument || data.taxId || data.nif || '';
      var fiscalCountry = _fiscalCountryCode(data.fiscalCountry || data.defaultFiscalCountry || (_systemTenant && (_systemTenant.fiscalCountry || (_systemTenant.accountAddress && _systemTenant.accountAddress.fiscalCountry) || (_systemTenant.store && _systemTenant.store.fiscalCountry))) || (window.Auth && Auth.getFiscalCountry ? Auth.getFiscalCountry() : '') || addressCountry || 'ES');
      var fiscalCity = data.companyCity || (data.companyAddress && data.companyAddress.city) || '';
      var fiscalProvince = data.companyRegion || (data.companyAddress && (data.companyAddress.region || data.companyAddress.state || data.companyAddress.province)) || '';
      var fiscalPostalCode = data.companyPostalCode || (data.companyAddress && data.companyAddress.postalCode) || '';
      patch.phoneCountryCode = phoneCode;
      patch.phoneNumber = phoneNumber;
      patch.phoneFull = phoneFull;
      patch.whatsappCountryCode = storeWhatsappCode;
      patch.storeWhatsappCountryCode = storeWhatsappCode;
      patch.storeWhatsappNumber = storeWhatsappNumber;
      patch.storeWhatsappFull = storeWhatsappFull;
      patch.contactEmail = data.email || '';
      patch.adminEmail = data.adminEmail || data.fiscalEmail || data.billingEmail || '';
      patch.fiscalEmail = data.fiscalEmail || data.adminEmail || '';
      patch.billingEmail = data.billingEmail || data.adminEmail || '';
      patch.country = addressCountry;
      patch.fiscalCountry = fiscalCountry;
      patch.language = data.language || data.defaultLanguage || '';
      patch.name = businessName;
      patch.businessName = businessName;
      patch.storeName = businessName;
      patch.legalName = legalName;
      patch.companyLegalName = legalName;
      patch.document = fiscalDocument;
      patch.companyFiscalId = fiscalDocument;
      patch.fiscalDocument = fiscalDocument;
      patch.taxId = fiscalDocument;
      patch.nif = fiscalDocument;
      patch.description = data.description || '';
      patch.shortDescription = data.description || '';
      patch.avatarUrl = data.avatarUrl || data.storeAvatarUrl || data.accountAvatarUrl || '';
      patch.storeAvatarUrl = data.storeAvatarUrl || data.avatarUrl || '';
      patch.accountAddress = Object.assign({}, currentAddress, {
        street: data.companyAddressLine || (data.companyAddress && data.companyAddress.addressLine) || '',
        number: data.companyNumber || (data.companyAddress && data.companyAddress.number) || '',
        complement: data.companyComplement || (data.companyAddress && data.companyAddress.complement) || '',
        neighborhood: data.companyNeighborhood || (data.companyAddress && data.companyAddress.neighborhood) || '',
        city: data.companyCity || (data.companyAddress && data.companyAddress.city) || '',
        province: data.companyRegion || (data.companyAddress && (data.companyAddress.region || data.companyAddress.state || data.companyAddress.province)) || '',
        postalCode: data.companyPostalCode || (data.companyAddress && data.companyAddress.postalCode) || '',
        country: addressCountry,
        fiscalCountry: fiscalCountry,
        source: 'admin_setup',
        updatedAt: now
      });
      patch.store = Object.assign({}, currentStore, {
        name: businessName || currentStore.name || '',
        description: data.description || currentStore.description || '',
        city: currentStore.city || zoneLocation.city || fiscalCity || '',
        region: currentStore.region || currentStore.province || zoneLocation.province || fiscalProvince || '',
        province: currentStore.province || currentStore.region || zoneLocation.province || fiscalProvince || '',
        postalCode: currentStore.postalCode || zoneLocation.postalCode || fiscalPostalCode || '',
        country: zoneLocation.country || currentStore.country || addressCountry,
        fiscalCountry: fiscalCountry,
        language: data.language || data.defaultLanguage || currentStore.language || '',
        phone: data.phone || '',
        phoneNumber: phoneNumber,
        phoneCountryCode: phoneCode,
        phoneFull: phoneFull,
        whatsapp: data.whatsapp || '',
        whatsappNumber: storeWhatsappNumber,
        whatsappCountryCode: storeWhatsappCode,
        whatsappFull: storeWhatsappFull,
        status: currentStore.status || 'draft',
        updatedAt: now
      });
    }
    if (key === 'endereco') {
      var publicAddress = {
        street: data.addressLine || data.pickupAddress || data.address || '',
        number: data.number || data.numero || '',
        complement: data.complement || data.complemento || data.reference || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        province: data.region || data.state || data.province || '',
        postalCode: data.postalCode || '',
        country: _countryIso(data.country || ''),
        source: 'admin_public_address',
        updatedAt: now
      };
      var addressHasLocation = !!(publicAddress.street || publicAddress.number || publicAddress.neighborhood || publicAddress.city || publicAddress.province || publicAddress.country || publicAddress.postalCode);
      patch.store = Object.assign({}, currentStore, {
        city: hasCurrentDeliveryLocation ? (currentStore.city || '') : (publicAddress.city || ''),
        region: hasCurrentDeliveryLocation ? (currentStore.region || currentStore.province || '') : (publicAddress.province || ''),
        province: hasCurrentDeliveryLocation ? (currentStore.province || currentStore.region || '') : (publicAddress.province || ''),
        country: hasCurrentDeliveryLocation ? (currentStore.country || '') : (publicAddress.country || ''),
        postalCode: hasCurrentDeliveryLocation ? (currentStore.postalCode || '') : (publicAddress.postalCode || ''),
        address: addressHasLocation ? publicAddress : (currentStore.address || {}),
        locationSource: hasCurrentDeliveryLocation ? 'delivery_area' : (addressHasLocation ? 'public_address' : (currentStore.locationSource || '')),
        status: currentStore.status || 'draft',
        updatedAt: now
      });
    }
    if (key === 'template') {
      var templateAddress = {
        street: data.address || data.pickupAddress || '',
        number: data.number || data.numero || '',
        complement: data.complemento || data.reference || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        province: data.region || data.province || data.state || '',
        postalCode: data.postalCode || '',
        country: _countryIso(data.country || ''),
        source: 'admin_public_address',
        updatedAt: now
      };
      var templateAddressHasLocation = !!(templateAddress.street || templateAddress.number || templateAddress.neighborhood || templateAddress.city || templateAddress.province || templateAddress.country || templateAddress.postalCode);
      patch.store = Object.assign({}, currentStore, {
        city: hasZoneLocation ? zoneLocation.city : (templateAddress.city || currentStore.city || ''),
        region: hasZoneLocation ? zoneLocation.province : (templateAddress.province || currentStore.region || currentStore.province || ''),
        province: hasZoneLocation ? zoneLocation.province : (templateAddress.province || currentStore.province || currentStore.region || ''),
        country: hasZoneLocation ? zoneLocation.country : (templateAddress.country || currentStore.country || ''),
        postalCode: hasZoneLocation ? zoneLocation.postalCode : (templateAddress.postalCode || currentStore.postalCode || ''),
        address: templateAddressHasLocation ? templateAddress : (currentStore.address || {}),
        locationSource: hasZoneLocation ? 'delivery_area' : (templateAddressHasLocation ? 'public_address' : (currentStore.locationSource || '')),
        deliveryArea: zoneLocation,
        social: _storeSocialFromConfig(data, currentStore),
        status: currentStore.status || 'draft',
        updatedAt: now
      });
    }
    if (key === 'integracoes') {
      patch.store = Object.assign({}, currentStore, {
        social: _storeSocialFromConfig(data, currentStore),
        updatedAt: now
      });
    }
    console.info('[Configuracoes] sincronizando system_tenants', {
      tenantUid: tenantId,
      screen: key,
      path: 'system_tenants/' + tenantId,
      fields: Object.keys(patch).filter(function (k) { return k !== 'updatedAt'; })
    });
    return firebase.firestore().collection('system_tenants').doc(tenantId).set(patch, { merge: true }).then(function () {
      _systemTenant = Object.assign({}, _systemTenant || {}, patch);
    });
  }

  function _cleanPhoneNumber(value) {
    return String(value || '').replace(/[^\d]/g, '');
  }

  function _phoneFull(code, number) {
    var clean = _cleanPhoneNumber(number);
    if (!clean) return '';
    return String(code || '') + clean;
  }

  function _isValidEmail(value) {
    var email = String(value || '').trim();
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function _countryIso(value) {
    var v = String(value || '').trim().toUpperCase();
    var map = { ESPANHA: 'ES', SPAIN: 'ES', PORTUGAL: 'PT', BRASIL: 'BR', BRAZIL: 'BR', FRANCA: 'FR', 'FRANÇA': 'FR', FRANCE: 'FR', ITALIA: 'IT', 'ITÁLIA': 'IT', ITALY: 'IT', ALEMANHA: 'DE', GERMANY: 'DE', 'REINO UNIDO': 'GB', UK: 'GB', UNITEDKINGDOM: 'GB', 'UNITED KINGDOM': 'GB', EUA: 'US', USA: 'US', 'UNITED STATES': 'US', 'ESTADOS UNIDOS': 'US' };
    if (v === 'OTHER' || v === 'OUTRO') return 'OTHER';
    return ['ES', 'PT', 'BR', 'FR', 'IT', 'DE', 'GB', 'US'].indexOf(v) >= 0 ? v : (map[v] || '');
  }

  function _fiscalCountryCode(value) {
    var code = _countryIso(value);
    return code === 'PT' ? 'PT' : 'ES';
  }

  function _countrySelectOptions(value) {
    var selected = _countryIso(value);
    var list = [
      ['', 'Selecionar país'],
      ['ES', 'Espanha (ES)'],
      ['PT', 'Portugal (PT)'],
      ['BR', 'Brasil (BR)'],
      ['FR', 'França (FR)'],
      ['IT', 'Itália (IT)'],
      ['DE', 'Alemanha (DE)'],
      ['GB', 'Reino Unido (GB)'],
      ['US', 'Estados Unidos (US)'],
      ['OTHER', 'Outro']
    ];
    return list.map(function (item) {
      var valueAttr = item[0];
      return '<option value="' + _esc(valueAttr) + '"' + (valueAttr === selected ? ' selected' : '') + '>' + _esc(item[1]) + '</option>';
    }).join('');
  }

  function _primaryDeliveryZoneLocation(zones) {
    var tpl = _config.template || {};
    if (zones && !Array.isArray(zones.deliveryZones)) {
      tpl = zones;
      zones = zones.deliveryZones;
    }
    zones = Array.isArray(zones) ? zones : (tpl.deliveryZones || []);
    var area = tpl.deliveryArea || {};
    var zone = zones[0] || {};
    if (!zone || typeof zone !== 'object') zone = {};
    var postalCode = String(zone.postal || zone.postalCode || zone.zip || zone.cep || '').trim();
    postalCode = String(area.postalCode || tpl.deliveryPostalCode || postalCode || '').trim();
    return {
      city: String(area.city || tpl.deliveryCity || zone.city || zone.cidade || zone.locality || zone.name || zone.nome || '').trim(),
      province: String(area.province || tpl.deliveryProvince || zone.province || zone.state || zone.estado || '').trim(),
      country: _countryIso(area.country || tpl.deliveryCountry || zone.country || zone.pais || zone.país || zone.countryCode || '') || _countryFromPostalCode(postalCode),
      postalCode: postalCode,
      source: 'admin_delivery_zones'
    };
  }

  function _storeSocialFromConfig(data, currentStore) {
    var existing = currentStore && currentStore.social && typeof currentStore.social === 'object' ? currentStore.social : {};
    var template = (_config.template || {});
    var templateSocial = template.social && typeof template.social === 'object' ? template.social : {};
    return {
      instagram: data.instagram || (data.social && data.social.instagram) || template.instagram || templateSocial.instagram || existing.instagram || '',
      facebook: data.facebook || (data.social && data.social.facebook) || template.facebook || templateSocial.facebook || existing.facebook || '',
      tiktok: data.tiktok || (data.social && data.social.tiktok) || template.tiktok || templateSocial.tiktok || existing.tiktok || ''
    };
  }

  function _countryFromPostalCode(postalCode) {
    var postal = String(postalCode || '').trim().toUpperCase();
    if (/^\d{4}-\d{3}$/.test(postal)) return 'PT';
    if (/^\d{5}$/.test(postal)) return 'ES';
    if (/^\d{5}-?\d{3}$/.test(postal)) return 'BR';
    if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(postal)) return 'GB';
    if (/^\d{5}(-\d{4})?$/.test(postal)) return 'US';
    return '';
  }

  function _check(id, label, checked) {
    return '<label class="check-row"><input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + '><span>' + label + '</span></label>';
  }

  function _val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _positiveIntegerValue(id) {
    var raw = _val(id).replace(/\./g, '').replace(',', '.');
    var n = parseFloat(raw.replace(/[^0-9.-]/g, ''));
    if (!isFinite(n) || n <= 0) return 0;
    return Math.max(1, Math.round(n));
  }

  function _checked(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function _normChannelName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function _isCardapioChannel(channel) {
    var name = _normChannelName(channel && channel.name);
    return name === 'cardápio' || name === 'cardapio';
  }

  function _isTpvChannel(channel) {
    var name = _normChannelName(channel && channel.name);
    return name === 'tpv' || name === 'venda presencial';
  }

  function _isSystemChannel(channel) {
    return _isCardapioChannel(channel) || _isTpvChannel(channel);
  }

  function _isTpvEnabled() {
    var tpv = _config.tpv || {};
    return tpv.enabled === true || tpv.tpvEnabled === true || tpv.active === true;
  }

  function _fixedChannels() {
    var fixed = [
      Object.assign({ name: 'Cardápio', commissionPct: 0, fixedFee: 0, taxPct: 0, contaPadraoId: '', defaultAccountId: '', bankAccountId: '', minMarginPct: 0, differentPrice: false, locked: true }, _channelPaymentMethodFields(''))
    ];
    if (_isTpvEnabled()) {
      fixed.push(Object.assign({ name: 'Venda presencial', commissionPct: 0, fixedFee: 0, taxPct: 0, contaPadraoId: '', defaultAccountId: '', bankAccountId: '', minMarginPct: 0, differentPrice: false, locked: true }, _channelPaymentMethodFields('')));
    }
    return fixed;
  }

  function _mergeFixedChannels(current) {
    current = Array.isArray(current) ? current : [];
    var custom = current.filter(function (ch) { return ch && !_isSystemChannel(ch); });
    var fixed = _fixedChannels().map(function (base) {
      var prev = current.find(function (ch) { return _normChannelName(ch && ch.name) === _normChannelName(base.name) || (_isCardapioChannel(base) && _isCardapioChannel(ch)) || (_isTpvChannel(base) && _isTpvChannel(ch)); }) || {};
      return Object.assign({}, base, prev, _incomeCategoryFields({
        id: _channelIncomeCategoryId(prev),
        nome: _channelIncomeCategoryName(prev)
      }), { name: base.name, locked: true });
    });
    return fixed.concat(custom);
  }

  function _entradaCategories() {
    return (_financeCategories || []).filter(function (cat) {
      return cat && String(cat.tipo || cat.type || '').toLowerCase() === 'entrada';
    }).sort(function (a, b) {
      return String(a.nome || a.name || '').localeCompare(String(b.nome || b.name || ''), 'pt', { sensitivity: 'base' });
    });
  }

  function _channelIncomeCategoryId(channel) {
    channel = channel || {};
    return String(channel.entradaCategoriaId || channel.incomeCategoryId || channel.categoriaEntradaId || channel.financialCategoryId || channel.categoriaFinanceiraId || channel.categoryId || '').trim();
  }

  function _channelIncomeCategoryName(channel) {
    channel = channel || {};
    return String(channel.entradaCategoriaNome || channel.incomeCategoryName || channel.categoriaEntradaNome || channel.financialCategoryName || channel.categoriaFinanceiraNome || channel.categoryName || '').trim();
  }

  function _findEntradaCategory(value) {
    var raw = String(value || '').trim();
    var folded = _normChannelName(raw);
    if (!raw) return null;
    return _entradaCategories().find(function (cat) {
      return String(cat.id || '') === raw || _normChannelName(cat.nome || cat.name || '') === folded;
    }) || null;
  }

  function _incomeCategoryFields(category) {
    var id = String(category && (category.id || category.value) || '').trim();
    var name = String(category && (category.nome || category.name || category.label || category.title) || '').trim();
    return {
      entradaCategoriaId: id,
      entradaCategoriaNome: name,
      incomeCategoryId: id,
      incomeCategoryName: name,
      categoriaEntradaId: id,
      categoriaEntradaNome: name,
      financialCategoryId: id,
      financialCategoryName: name,
      categoriaFinanceiraId: id,
      categoriaFinanceiraNome: name
    };
  }

  function _entradaCategoryOptions(selected) {
    var current = String(selected || '').trim();
    var currentFold = _normChannelName(current);
    var matched = !current;
    var options = '<option value="">Sem categoria vinculada</option>';
    options += _entradaCategories().map(function (cat) {
      var id = String(cat.id || '');
      var name = String(cat.nome || cat.name || 'Categoria');
      var isSelected = current && (current === id || currentFold === _normChannelName(name));
      if (isSelected) matched = true;
      var selectedAttr = isSelected ? ' selected' : '';
      return '<option value="' + _esc(id) + '"' + selectedAttr + '>' + _esc(name) + '</option>';
    }).join('');
    options += '<option value="__new__">+ Criar nova categoria...</option>';
    if (current && !matched) {
      options += '<option value="' + _esc(current) + '" selected>' + _esc(current) + '</option>';
    }
    return options;
  }

  function _ensureFixedChannels() {
    var current = (_config.canais_venda && Array.isArray(_config.canais_venda.list)) ? _config.canais_venda.list : [];
    var data = { list: _mergeFixedChannels(current) };
    _config.canais_venda = data;
    DB.setDocRoot('config', 'canais_venda', data).catch(function (err) {
      console.error('Venda presencial channel sync error', err);
    });
  }

  function _json(value) {
    try { return JSON.stringify(value || [], null, 2); } catch (e) { return '[]'; }
  }

  function _parseJson(id, fallback) {
    try {
      var raw = _val(id);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      UI.toast('JSON inválido em ' + id, 'error');
      return fallback;
    }
  }

  function _esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function destroy() {}

  return {
    render: render, destroy: destroy, _switchSub: _switchSub,
    _openUnidadeModal: _openUnidadeModal, _saveUnidade: _saveUnidade, _deleteUnidade: _deleteUnidade,
    _openFornecedorModal: _openFornecedorModal, _saveFornecedor: _saveFornecedor, _deleteFornecedor: _deleteFornecedor,
    _addCanalVenda: _addCanalVenda, _removeCanalVenda: _removeCanalVenda, _saveCanaisVenda: _saveCanaisVenda, _createEntradaCategoryFromChannel: _createEntradaCategoryFromChannel, _saveEntradaCategoryFromChannel: _saveEntradaCategoryFromChannel,
    _uploadAppearanceImage: _uploadAppearanceImage,
    _uploadGeneralAvatarImage: _uploadGeneralAvatarImage,
    _normalizeDomainSlugField: _normalizeDomainSlugField,
    _copyDomainValue: _copyDomainValue,
    _toggleFiscalEnabled: _toggleFiscalEnabled,
    _sendPasswordReset: _sendPasswordReset,
    _startStripeConnect: _startStripeConnect,
    _refreshStripeConnectStatus: _refreshStripeConnectStatus,
    _disconnectStripeConnect: _disconnectStripeConnect,
    _publishStore: _publishStore,
    _unpublishStore: _unpublishStore
  };
})();
