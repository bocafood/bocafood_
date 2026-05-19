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
  var _masterTenantControl = {};
  var _publicationProducts = [];
  var _publicationCategories = [];

  var TABS = [
    { key: 'geral', label: 'Geral' },
    { key: 'conta_usuario', label: 'Usuário' },
    { key: 'tpv', label: 'Venda presencial' },
    { key: 'dominio', label: 'Link da loja' },
    { key: 'integracoes', label: 'Integrações' },
    { key: 'plano', label: 'Plano' },
    { key: 'canais_venda', label: 'Canais de venda' }
  ];

  var CONFIG_TABS = ['geral', 'conta_usuario', 'tpv', 'dominio', 'integracoes', 'pagamentos', 'financeiro', 'endereco', 'seo', 'template', 'canais_venda'];

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
    _activeSub = sub || 'geral';
    var app = document.getElementById('app');
    app.innerHTML = '<section class="module-page">' +
      '<div id="config-content" class="module-content narrow"><div class="loading-inline">Carregando...</div></div>' +
      '</section>';
    _load().then(function () { _renderSub(); });
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

  function _switchSub(key) {
    _activeSub = key;
    _renderSub();
    Router.navigate('configuracoes/' + key);
  }

  function _recordActivity(input) {
    if (!window.Auth || !Auth.recordSystemAccessLog) return Promise.resolve(false);
    return Auth.recordSystemAccessLog(input || {}).catch(function () { return false; });
  }

  function _load() {
    var tenantPromise = _loadSystemTenant().catch(function () { return {}; });
    var masterTenantPromise = _loadMasterTenantControl().catch(function () { return {}; });
    return Promise.all(CONFIG_TABS.map(function (k) { return DB.getDocRoot('config', k); }).concat([tenantPromise, masterTenantPromise]))
      .then(function (docs) {
        _config = {};
        CONFIG_TABS.forEach(function (k, i) { _config[k] = docs[i] || {}; });
        _systemTenant = docs[CONFIG_TABS.length] || {};
        _masterTenantControl = docs[CONFIG_TABS.length + 1] || _systemTenant || {};
      })
      .catch(function (err) {
        console.error('Config load error', err);
        _config = {};
        _systemTenant = {};
        _masterTenantControl = {};
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
    var content = document.getElementById('config-content');
    if (!content) return;
    content.className = 'module-content';
    content.innerHTML = '<div style="display:flex;flex-direction:column;gap:22px;max-width:1180px;margin:0 auto;width:100%;">' +
      '<style>.profile-business .bf-input,.profile-business .bf-select,.fiscal-business .bf-input,.fiscal-business .bf-select,.contact-preferences .bf-input,.contact-preferences .bf-select{transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.profile-business .bf-input,.profile-business .bf-select,.profile-business textarea.bf-input,.fiscal-business .bf-input,.fiscal-business .bf-select{background:#FFFCF8;border-color:#E8DCD7}.profile-business .bf-input:focus,.profile-business .bf-select:focus,.profile-business textarea.bf-input:focus,.fiscal-business .bf-input:focus,.fiscal-business .bf-select:focus,.contact-preferences .bf-input:focus,.contact-preferences .bf-select:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);outline:none}.profile-business .bf-field label,.fiscal-business .bf-field label{color:#7E716D}.profile-logo-row{display:grid;grid-template-columns:48px minmax(0,1fr) minmax(170px,230px);gap:12px;align-items:center;grid-column:1/-1;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:10px}.fiscal-business .bf-input[readonly]{background:#F8F4F1;color:#6F6860}.fiscal-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 14px}.fiscal-span-2{grid-column:span 2}.fiscal-span-1{grid-column:span 1}.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px}.contact-field-help{font-size:11px;color:#8A7E7C;line-height:1.38;margin-top:4px}.contact-phone-box{display:grid;grid-template-columns:112px minmax(0,1fr);gap:8px;align-items:center;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:6px}.contact-phone-box .bf-select,.contact-phone-box .bf-input{border:0;background:transparent;box-shadow:none;min-height:36px}.contact-phone-box .bf-select{border-right:1px solid #E8DCD7;border-radius:8px;padding-left:8px}.contact-phone-box .bf-input{padding-left:8px}.contact-phone-box:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08)}@media(max-width:900px){.fiscal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fiscal-span-2,.fiscal-span-1{grid-column:span 1}}@media(max-width:760px){.contact-grid{grid-template-columns:1fr}.profile-logo-row{grid-template-columns:48px minmax(0,1fr)}.profile-logo-row input{grid-column:1/-1}.fiscal-grid{grid-template-columns:1fr}.fiscal-span-2,.fiscal-span-1{grid-column:1/-1}}@media(max-width:420px){.contact-phone-box{grid-template-columns:100px minmax(0,1fr)}}</style>' +
      '<section class="bf-card" style="overflow:hidden;background:linear-gradient(135deg,#fff 0%,#fff 58%,#FFF7F4 100%);">' +
        '<div class="bf-split-grid">' +
          '<div style="background:linear-gradient(145deg,#FFF8F5 0%,#FAF8F4 55%,#FFFFFF 100%);border-right:1px solid #EAE4DA;padding:24px;display:flex;flex-direction:column;gap:18px;min-width:0;">' +
            '<div style="background:#fff;border:1px solid #EADFD8;border-radius:22px;padding:22px;box-shadow:0 16px 36px rgba(31,31,31,.07);display:flex;flex-direction:column;gap:18px;min-height:280px;">' +
              '<div style="display:flex;align-items:flex-start;gap:16px;">' +
                '<div id="cfg-avatar-preview" style="width:84px;height:84px;border-radius:22px;background:#FFF7F4;color:#B42318;border:1px solid #E5D3CF;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 10px 22px rgba(31,31,31,.08);flex:0 0 auto;">' + (avatarUrl ? '<img src="' + _esc(avatarUrl) + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">' : '<span class="mi" style="font-size:34px;">storefront</span>') + '</div>' +
                '<div style="min-width:0;flex:1;padding-top:3px;">' +
                  '<h3 style="margin:0;color:#1F1F1F;font-size:25px;font-weight:800;line-height:1.12;word-break:break-word;">' + _esc(businessNameValue || 'Nome comercial') + '</h3>' +
                  '<p style="margin:9px 0 0;color:#6F6860;font-size:13px;line-height:1.5;max-width:420px;">' + _esc(shortDescription || 'Adicione uma apresentação curta para explicar o que você vende.') + '</p>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<span class="bf-badge" style="background:#FFF7F4;border:1px solid #EACBC4;color:#7B332D;">' + _esc(fiscalLabel) + '</span>' +
                '<span class="bf-badge" style="background:#fff;border:1px solid #EAE4DA;color:#6F6860;">' + _esc(fiscalDocumentValue ? 'Documento informado' : 'Documento não informado') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="bf-section profile-business" style="min-width:0;">' +
            '<div class="bf-section-header">' +
              '<div><h3 class="bf-section-title">Perfil do negócio</h3><p class="bf-section-subtitle">Configure como sua marca aparece no BocaFood e mantenha os dados principais atualizados.</p></div>' +
              '<span class="bf-badge">Editável</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
              '<div class="bf-panel" style="background:#fff;padding:16px;border-color:#EADFD8;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
                '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;"><span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;">storefront</span><div><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Informações da marca</div><div style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Configure o nome, a apresentação e a imagem principal da sua loja.</div></div></div>' +
                '<div class="bf-form-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px;">' +
                  '<div class="profile-logo-row">' +
                    '<div style="width:42px;height:42px;border-radius:13px;background:#FFF7F4;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;border:1px solid #F0D8D1;"><span class="mi" style="font-size:20px;">add_photo_alternate</span></div>' +
                    '<div style="min-width:0;"><div style="font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25;margin-bottom:2px;">Logo da marca</div><div style="font-size:12px;color:#6F6860;line-height:1.4;">Imagem quadrada, ideal 500 × 500 px. Use JPG, PNG ou WebP.</div></div>' +
                    '<input class="bf-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Configuracoes._uploadGeneralAvatarImage(event)" style="width:100%;font-size:12px;background:#fff;">' +
                  '</div>' +
                  '<input id="cfg-avatar-url" type="hidden" value="' + _esc(avatarUrl) + '">' +
                  '<div class="bf-field"><label>Nome comercial</label><input id="cfg-business-name" class="bf-input" value="' + _esc(businessNameValue) + '" placeholder="Ex.: Bocado Brasil"><div style="font-size:11px;color:#8A7E7C;line-height:1.45;margin-top:6px;">Nome que seus clientes veem na loja online.</div></div>' +
                  '<div class="bf-field"><label>Nome fiscal</label><input id="cfg-legal-name" class="bf-input" value="' + _esc(c.legalName || c.companyLegalName || '') + '" placeholder="Nome completo ou denominação social"><div style="font-size:11px;color:#8A7E7C;line-height:1.45;margin-top:6px;">Para autónomo, use o nome completo. Para empresa, use a denominação social.</div></div>' +
                  '<div class="bf-field bf-span-full"><label>Apresentação curta</label><textarea id="cfg-description" class="bf-input" rows="3" placeholder="Ex.: Comida brasileira caseira feita por encomenda em Pamplona." style="min-height:92px;resize:vertical;">' + _esc(shortDescription) + '</textarea><div style="font-size:11px;color:#8A7E7C;line-height:1.45;margin-top:6px;">Uma frase simples para explicar o que você vende.</div></div>' +
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
          '<div class="bf-panel" style="background:#fff;padding:16px;border-color:#EADFD8;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
            '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;"><span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;">support_agent</span><div><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Atendimento</div><div style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Canais usados para falar com clientes e receber contatos importantes.</div></div></div>' +
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
          '<div class="bf-panel" style="background:#fff;padding:16px;border-color:#EADFD8;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
            '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;"><span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;">account_balance</span><div><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Informações fiscais</div><div style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Comece digitando o endereço e selecione uma opção da lista para preencher os dados automaticamente.</div></div></div>' +
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
      '<section class="bf-card bf-actions-row" style="padding:14px 16px;position:sticky;bottom:0;z-index:2;">' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Revise os dados antes de salvar.</div>' +
        '<button id="config-save" class="bf-btn bf-btn-primary">Salvar alterações</button>' +
      '</section>' +
    '</div>';
    document.getElementById('config-save').onclick = function () {
      var fiscalId = _val('cfg-company-fiscal-id').toUpperCase();
      if (fiscalCfg && fiscalId && fiscalCfg.validateNif && !fiscalCfg.validateNif(fiscalId.replace(/[\s.-]/g, ''))) {
        UI.toast(fiscalCfg.nifErrorMsg || 'Documento fiscal inválido.', 'error');
        var fiscalInput = document.getElementById('cfg-company-fiscal-id');
        if (fiscalInput) fiscalInput.focus();
        return;
      }
      _save('geral', {
        businessName: _val('cfg-business-name'),
        legalName: _val('cfg-legal-name'),
        companyLegalName: _val('cfg-legal-name'),
        description: _val('cfg-description'),
        phone: _val('cfg-phone'),
        whatsapp: _val('cfg-whatsapp'),
        phoneCountryCode: _val('cfg-phone-country'),
        whatsappCountryCode: _val('cfg-whatsapp-country'),
        phoneFull: [_val('cfg-phone-country'), _val('cfg-phone')].filter(Boolean).join(' '),
        whatsappFull: [_val('cfg-whatsapp-country'), _val('cfg-whatsapp')].filter(Boolean).join(' '),
        email: _val('cfg-email'),
        adminEmail: _val('cfg-admin-email'),
        fiscalEmail: _val('cfg-admin-email'),
        billingEmail: _val('cfg-admin-email'),
        country: c.country,
        city: c.city,
        language: _val('cfg-language'),
        defaultLanguage: _val('cfg-language'),
        currency: _val('cfg-currency'),
        defaultCurrency: _val('cfg-currency'),
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
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('cfg-company-address'); }, 100);
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
      '<div class="config-wrap">' +
        '<section class="bf-card bf-section account-settings">' +
          '<div class="bf-section-header">' +
            '<div><h3 class="bf-section-title">Usuário</h3><p class="bf-section-subtitle">Mantenha seus dados atualizados para receber suporte, avisos importantes e acessar sua conta com segurança.</p></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
            '<div class="bf-panel" style="background:#fff;padding:16px;border-color:#EADFD8;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
              '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;"><span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;">person</span><div><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Dados do usuário</div><div style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Informações da pessoa responsável pelo acesso e comunicação da conta.</div></div></div>' +
              '<div class="bf-form-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px;">' +
                '<div class="bf-field"><label>Seu nome completo</label><input id="cfg-account-owner-name" class="bf-input" value="' + _esc(tenant.ownerName || conta.ownerName || geral.ownerName || '') + '" placeholder="Nome completo"><div class="account-field-help">Nome da pessoa responsável pela conta.</div></div>' +
                '<div class="bf-field"><label>Como você quer ser chamada?</label><input id="cfg-account-social-name" class="bf-input" value="' + _esc(tenant.preferredName || tenant.socialName || conta.preferredName || conta.socialName || '') + '" placeholder="Nome curto"><div class="account-field-help">Usaremos esse nome nas mensagens e áreas internas do BocaFood.</div></div>' +
              '<div class="bf-field"><label>E-mail de acesso</label><input id="cfg-account-email" class="bf-input" type="email" value="' + _esc(emailValue) + '" readonly placeholder="seu@email.com"><div class="account-field-help">Para trocar este e-mail, fale com o suporte.</div><div class="account-reset-action"><button id="cfg-account-password-reset" type="button" class="account-reset-btn" onclick="Modules.Configuracoes._sendPasswordReset()">Enviar link para redefinir senha</button></div></div>' +
              '<div class="bf-field"><label>WhatsApp de contato</label><div class="account-phone-box"><select id="cfg-account-whatsapp-country" class="bf-select" aria-label="Código do país">' + _phoneCountryOptions(whatsapp.countryCode) + '</select><input id="cfg-account-whatsapp" class="bf-input" type="tel" value="' + _esc(whatsapp.number == null ? '' : whatsapp.number) + '" placeholder="600 000 000" autocomplete="tel-national"></div><div class="account-field-help">Usado para suporte e avisos importantes da sua conta.</div></div>' +
              '</div>' +
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
    var patch = {
      ownerName: _val('cfg-account-owner-name'),
      preferredName: _val('cfg-account-social-name'),
      socialName: _val('cfg-account-social-name'),
      whatsappCountryCode: whatsappCode,
      whatsappNumber: whatsappNumber,
      whatsappFull: _phoneFull(whatsappCode, whatsappNumber),
      accountWhatsappCountryCode: whatsappCode,
      accountWhatsappNumber: whatsappNumber,
      accountWhatsappFull: _phoneFull(whatsappCode, whatsappNumber),
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
    var status = profile.status || 'active';
    var features = Array.isArray(profile.features) ? profile.features : (Array.isArray(profile.planFeatures) ? profile.planFeatures : []);
    var limits = profile.planLimits || profile.limits || {};
    var billing = profile.billing || {};
    var renewalDate = profile.renewalDate || profile.nextBillingAt || billing.renewalDate || billing.nextBillingAt || '';
    var trialEndsAt = profile.trialEndsAt || billing.trialEndsAt || '';
    var cycle = profile.billingCycle || billing.billingCycle || billing.cycle || '';
    var billingStatus = profile.billingStatus || billing.status || '';
    var content = document.getElementById('config-content');
    var featureRows = features.length ? features.map(function (item) {
      var label = typeof item === 'string' ? item : (item.label || item.name || item.key || 'Recurso');
      var enabled = typeof item === 'object' ? item.enabled !== false : true;
      return _planListRow(enabled ? 'check_circle' : 'block', label, enabled ? 'Disponível neste plano' : 'Indisponível neste plano', enabled ? '#2F6B57' : '#9B928A');
    }).join('') : _planEmpty('Recursos ainda não configurados no Master.');
    var limitRows = Object.keys(limits || {}).length ? Object.keys(limits).map(function (key) {
      return _planListRow('speed', _humanizePlanKey(key), limits[key], '#B42318');
    }).join('') : _planEmpty('Limites de uso ainda não configurados no Master.');
    content.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div><h2 style="margin:0;color:#1F1F1F;font-size:24px;line-height:1.15;font-weight:700;">Plano</h2><p style="margin:6px 0 0;color:#6F6860;font-size:14px;line-height:1.45;max-width:760px;">Acompanhe o plano da conta e deixe a leitura pronta para os campos que serão configurados no Master.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' + _configChip('Dados do Master') + _configChip('Somente leitura') + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:16px;">' +
        _domainStatusCard('Plano atual', _planDisplay(plan), 'Campo `plan` sincronizado pelo Master', '#B42318', 'workspace_premium') +
        _domainStatusCard('Status da conta', _accountStatusDisplay(status), 'Controle de acesso do tenant', status === 'active' ? '#2F6B57' : '#9A6A2F', 'verified_user') +
        _domainStatusCard('Ciclo', _valueOrPending(cycle), 'Cobrança mensal, anual ou personalizada', cycle ? '#2F6B57' : '#9A6A2F', 'event_repeat') +
        _domainStatusCard('Próxima renovação', _formatPlanDate(renewalDate), 'Data enviada pelo Master', renewalDate ? '#2F6B57' : '#9A6A2F', 'calendar_month') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.72fr);gap:16px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          '<section style="' + _configCardStyle('18px 20px') + '"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;"><div><h3 style="margin:0;color:#1F1F1F;font-size:16px;font-weight:700;">Resumo do plano</h3><p style="margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;">Campos já sincronizados pelo Master e campos preparados para assinatura.</p></div><span class="mi" style="color:#B42318;font-size:22px;">receipt_long</span></div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">' +
              _planMetric('Papel de acesso', _roleDisplay(profile.role), 'Define entrada no painel') +
              _planMetric('País fiscal', profile.fiscalCountry || 'ES', 'Base das regras fiscais') +
              _planMetric('Status de cobrança', _valueOrPending(billingStatus), 'Aguardando campo do Master') +
              _planMetric('Fim do teste', _formatPlanDate(trialEndsAt), 'Aguardando campo do Master') +
            '</div>' +
          '</section>' +
          '<section style="' + _configCardStyle('18px 20px') + '"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;"><div><h3 style="margin:0;color:#1F1F1F;font-size:16px;font-weight:700;">Recursos do plano</h3><p style="margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;">Quando o Master enviar recursos, eles aparecem aqui automaticamente.</p></div><span class="mi" style="color:#B42318;font-size:22px;">fact_check</span></div><div style="display:flex;flex-direction:column;gap:8px;">' + featureRows + '</div></section>' +
        '</div>' +
        '<aside style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          '<section style="' + _configCardStyle('18px 20px') + '"><div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;"><div style="width:36px;height:36px;border-radius:12px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">tune</span></div><div><h3 style="margin:0;color:#1F1F1F;font-size:16px;font-weight:700;">Limites e uso</h3><p style="margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;">Preparado para limites por plano, módulos e volume de uso.</p></div></div><div style="display:flex;flex-direction:column;gap:8px;">' + limitRows + '</div></section>' +
          '<section style="' + _configCardStyle('18px 20px') + '"><h3 style="margin:0 0 8px;color:#1F1F1F;font-size:16px;font-weight:700;">Próximos campos do Master</h3><p style="margin:0;color:#6F6860;font-size:13px;line-height:1.45;">A tela já está preparada para receber ciclo de cobrança, renovação, fim do teste, status de cobrança, recursos e limites do plano.</p></section>' +
        '</aside>' +
      '</div>';
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
    _editingFornecedorId = id;
    var f = id ? (_fornecedores.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<label class="bf-field"><span>Nome *</span><input id="forn-name" class="bf-input" type="text" value="' + _esc(f.name || '') + '"></label>' +
      '<label class="bf-field"><span>Contato (telefone / email)</span><input id="forn-contact" class="bf-input" type="text" value="' + _esc(f.contact || '') + '"></label>' +
      '<label class="bf-field"><span>Observações</span><textarea id="forn-notes" class="bf-textarea" style="min-height:70px;">' + _esc(f.notes || '') + '</textarea></label>' +
      '</div>';
    var footer = '<button class="bf-btn bf-btn-primary" onclick="Modules.Configuracoes._saveFornecedor()" style="width:100%;">' + (id ? 'Atualizar' : 'Adicionar') + '</button>';
    window._fornecedorModal = UI.modal({ title: id ? 'Editar Fornecedor' : 'Novo Fornecedor', body: body, footer: footer });
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
    _editingUnidadeId = id;
    var u = id ? (_unidades.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<label class="bf-field"><span>Nome *</span><input id="un-name" class="bf-input" type="text" value="' + _esc(u.name || '') + '" placeholder="ex: Quilograma"></label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<label class="bf-field"><span>Símbolo *</span>' +
      '<input id="un-symbol" class="bf-input" type="text" value="' + _esc(u.symbol || '') + '" placeholder="kg"></label>' +
      '<label class="bf-field"><span>Tipo *</span>' +
      '<select id="un-type" class="bf-select">' +
      '<option value="massa"' + (u.type === 'massa' ? ' selected' : '') + '>Massa</option>' +
      '<option value="volume"' + (u.type === 'volume' ? ' selected' : '') + '>Volume</option>' +
      '<option value="unidade"' + (!u.type || u.type === 'unidade' ? ' selected' : '') + '>Unidade</option>' +
      '</select></label>' +
      '</div></div>';

    var footer = '<button class="bf-btn bf-btn-primary" onclick="Modules.Configuracoes._saveUnidade()" style="width:100%;">' + (id ? 'Atualizar' : 'Adicionar') + '</button>';
    window._unidadeModal = UI.modal({ title: id ? 'Editar Unidade' : 'Nova Unidade de Medida', body: body, footer: footer });
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
    var c = _config.dominio || {};
    var geral = _config.geral || {};
    var suggestedSlug = _slugify(c.storeSlug || c.slug || c.subdomain || geral.storeSlug || geral.businessName || '');
    var rootDomain = c.rootDomain || c.mainDomain || c.platformDomain || '';
    var urls = _domainUrls(suggestedSlug, rootDomain, c);
    var slugStatus = suggestedSlug ? 'Link definido' : 'Link pendente';
    var content = document.getElementById('config-content');
    if (!content) return;
    content.className = 'module-content';
    content.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Link da loja</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Defina o identificador que completa o endereço público da sua loja no BocaFood.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
          _configChip(slugStatus) +
          _configChip('bocafood.app') +
        '</div>' +
      '</div>' +
      '<section style="' + _configCardStyle() + 'display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:14px;align-items:center;">' +
        '<div style="min-width:0;"><div style="font-size:12px;font-weight:600;color:#6F6860;margin-bottom:5px;">Link principal da loja</div><div style="font-size:clamp(20px,2.4vw,30px);font-weight:700;color:#1F1F1F;line-height:1.1;word-break:break-all;">' + _esc(urls.publicUrl.replace(/^https?:\/\//, '')) + '</div><div style="font-size:12px;color:#8A7E7C;line-height:1.4;margin-top:7px;">Esse é o endereço público da loja. A usuária não precisa configurar domínio próprio.</div></div>' +
        '<button type="button" class="bf-btn bf-btn-secondary" onclick="Modules.Configuracoes._copyDomainValue(\'' + _esc(urls.publicUrl) + '\')"><span class="mi" style="font-size:17px;">content_copy</span>Copiar</button>' +
      '</section>' +
      '<section style="' + _configCardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Identificador da loja</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Esse nome completa o endereço bocafood.app/ e deve ser curto, claro e fácil de escrever.</div></div>' +
          '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:' + (suggestedSlug ? '#F0FFF4' : '#FFF7ED') + ';border:1px solid ' + (suggestedSlug ? '#D9F2E3' : '#F3D9C7') + ';color:' + (suggestedSlug ? '#1F6F43' : '#B45309') + ';font-size:12px;font-weight:700;">' + _esc(slugStatus) + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">' +
          '<div><label style="' + _configLabelStyle() + '">Nome do link</label><input id="cfg-store-slug" type="text" value="' + _esc(suggestedSlug) + '" placeholder="minha-loja" oninput="Modules.Configuracoes._normalizeDomainSlugField(\'cfg-store-slug\')" style="' + _configInputStyle() + '"><div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;">Use letras, números e hífen. Exemplo: <strong>bocafood.app/minha-loja</strong>.</div></div>' +
        '</div>' +
      '</section>' +
      '<section style="' + _configCardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Links gerados pelo sistema</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Estes links são gerados automaticamente a partir do identificador da loja.</div></div>' +
          '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:700;">Gerados automaticamente</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">' +
          _domainUrlCard('Loja pública', urls.publicUrl, 'Página pública da loja.', 'storefront', true) +
          _domainUrlCard('Pedidos', urls.orderUrl, 'Link direto para pedido/cardápio.', 'shopping_bag') +
          _domainUrlCard('Rastreio', urls.trackUrl, 'Consulta de pedidos pelo cliente.', 'local_shipping') +
          _domainUrlCard('Avaliações', urls.reviewUrl, 'Link para clientes avaliarem a experiência.', 'reviews') +
        '</div>' +
      '</section>' +
      '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
        _domainStatusCard('Identificador', suggestedSlug || 'Pendente', suggestedSlug ? 'Pronto para salvar.' : 'Informe o nome do link.', suggestedSlug ? '#1F6F43' : '#B45309', suggestedSlug ? 'check_circle' : 'pending') +
        _domainStatusCard('Domínio BocaFood', 'bocafood.app', 'Usado automaticamente no link público.', '#1F6F43', 'verified') +
        _domainStatusCard('Links públicos', suggestedSlug ? 'Gerados' : 'Aguardando', suggestedSlug ? 'Prontos para copiar.' : 'Dependem do identificador.', suggestedSlug ? '#6C8777' : '#B45309', 'link') +
      '</section>' +
      '<section id="store-publication-card" style="' + _configCardStyle() + '">' + _publicationCardHtml(urls, _publicationState(urls)) + '</section>' +
      '<section style="' + _configCardStyle() + 'display:flex;gap:12px;align-items:flex-start;">' +
        '<div style="width:38px;height:38px;border-radius:12px;background:#FAF8F4;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:22px;">info</span></div>' +
        '<div style="min-width:0;"><div style="font-size:14px;font-weight:700;color:#1F1F1F;margin-bottom:3px;">Link público BocaFood</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">A usuária define apenas o identificador da loja. O endereço final sempre segue o padrão bocafood.app/nome-da-loja, sem domínio personalizado.</div></div>' +
      '</section>' +
      '<section style="' + _configCardStyle('12px 14px') + 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:sticky;bottom:0;z-index:2;">' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Esses dados alimentam os links públicos da loja, pedidos, rastreio e avaliações.</div>' +
        '<button id="config-save" class="bf-btn bf-btn-primary">Salvar link</button>' +
      '</section>' +
    '</div>';
    document.getElementById('config-save').onclick = function () {
      var slug = _slugify(_val('cfg-store-slug'));
      if (!slug) { UI.toast('Informe o nome do link da loja.', 'error'); return; }
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
      DB.setDocRoot('config', 'dominio', dominioData).then(function () {
        _config.dominio = dominioData;
        return _syncStoreSlugUrl(slug, generated);
      }).then(function () {
        UI.toast('Domínio e URL salvos', 'success');
        _renderDominio();
      }).catch(function (err) {
        UI.toast('Erro: ' + err.message, 'error');
      });
    };
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
    var publicData = {
      tenantId: tenantId,
      slug: slug,
      storeName: store.name || ((_config.geral || {}).businessName) || ((_config.geral || {}).name) || '',
      status: 'active',
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
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
        '<div style="min-width:0;"><div style="font-size:15px;font-weight:800;color:#1F1F1F;">Publicação da loja</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:3px;">Controle quando sua loja pública fica disponível para clientes.</div></div>' +
        '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:' + statusMeta.bg + ';border:1px solid ' + statusMeta.border + ';color:' + statusMeta.color + ';font-size:12px;font-weight:800;">' + _esc(statusMeta.label) + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
        _domainStatusCard('URL pública calculada', state.publicUrl || urls.publicUrl, 'Link usado na loja publicada.', '#6C8777', 'link') +
        _domainStatusCard('Status atual', statusMeta.label, statusMeta.hint, statusMeta.color, statusMeta.icon) +
        _domainStatusCard('Última publicação', _formatPlanDate(state.lastPublishedAt || state.publishedAt), 'Data registrada em system_tenants.', state.lastPublishedAt || state.publishedAt ? '#2F6B57' : '#9A6A2F', 'event_available') +
      '</div>' +
      (state.lastPublicationError ? '<div style="margin-top:12px;padding:12px 14px;border:1px solid #F0C9C0;border-radius:12px;background:#FFF8F6;color:#7A352B;font-size:13px;line-height:1.45;"><strong>Erro da última publicação:</strong> ' + _esc(state.lastPublicationError) + '</div>' : '') +
      (suspended ? '<div style="margin-top:12px;padding:12px 14px;border:1px solid #F0C9C0;border-radius:12px;background:#FFF8F6;color:#7A352B;font-size:13px;line-height:1.45;">Sua loja está suspensa. Entre em contato com o suporte BocaFood.</div>' : missingHtml) +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">' +
        '<button type="button" class="bf-btn bf-btn-primary" onclick="Modules.Configuracoes._publishStore()" ' + publishDisabled + '>Publicar loja</button>' +
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
    DB.setDocRoot('config', 'dominio', {
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
    var store = Object.assign({}, ((_systemTenant && _systemTenant.store) || {}), {
      name: geral.businessName || ((_systemTenant.store || {}).name) || '',
      slug: urls && urls.publicUrl ? _slugify(_val('cfg-store-slug') || ((_config.dominio || {}).slug)) : ((_systemTenant.store || {}).slug || ''),
      publicUrl: urls.publicUrl,
      country: geral.country || endereco.country || ((_systemTenant.store || {}).country) || '',
      language: geral.language || geral.defaultLanguage || ((_systemTenant.store || {}).language) || '',
      status: status
    }, extraStore || {});
    return firebase.firestore().collection('system_tenants').doc(tenantId).set({ store: store, updatedAt: now }, { merge: true }).then(function () {
      _systemTenant.store = store;
      return _syncPublicStoreSlug(tenantId, store.slug, urls, store, ((_systemTenant && _systemTenant.store) || {}));
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
    var content = document.getElementById('config-content');
    content.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div><h2 style="margin:0;color:#1F1F1F;font-size:24px;line-height:1.15;font-weight:700;">Integrações</h2><p style="margin:6px 0 0;color:#6F6860;font-size:14px;line-height:1.45;max-width:680px;">Conecte canais públicos, analytics e pixels usados pela loja online sem alterar a operação do cardápio.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
          _configChip((hasAnalytics ? 'Analytics ativo' : 'Analytics pendente')) +
          _configChip((hasMeta ? 'Pixel ativo' : 'Pixel pendente')) +
          _configChip((hasSocial ? 'Canais conectados' : 'Canais pendentes')) +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:16px;">' +
        _domainStatusCard('Medição', hasAnalytics ? 'Configurada' : 'Pendente', hasAnalytics ? 'GA4 ou GTM informado' : 'Informe GA4 ou GTM', hasAnalytics ? '#2F6B57' : '#9A6A2F', 'monitoring') +
        _domainStatusCard('Meta Pixel', hasMeta ? 'Configurado' : 'Pendente', hasMeta ? 'ID pronto para eventos' : 'Informe o Pixel ID', hasMeta ? '#B42318' : '#9A6A2F', 'ads_click') +
        _domainStatusCard('WhatsApp', whatsapp ? 'Conectado' : 'Pendente', whatsapp ? 'Usado no contato público' : 'Informe o número público', whatsapp ? '#2F6B57' : '#9A6A2F', 'forum') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1.12fr) minmax(300px,.88fr);gap:16px;align-items:start;">' +
        '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">' +
          '<section style="' + _configCardStyle('18px 20px') + '"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;"><div><h3 style="margin:0;color:#1F1F1F;font-size:16px;font-weight:700;">Medição e pixels</h3><p style="margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;">IDs usados para medir visitas, campanhas e conversões da loja pública.</p></div><span class="mi" style="color:#B42318;font-size:22px;">query_stats</span></div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
              _configInput('cfg-ga4', 'Google Analytics 4 ID', ga, 'G-XXXXXXXXXX') +
              _configInput('cfg-gtm', 'Google Tag Manager ID', c.gtmId, 'GTM-XXXXXXX') +
              _configInput('cfg-meta', 'Meta Pixel ID', meta, '123456789') +
            '</div>' +
          '</section>' +
          '<section style="' + _configCardStyle('18px 20px') + '"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;"><div><h3 style="margin:0;color:#1F1F1F;font-size:16px;font-weight:700;">Canais públicos</h3><p style="margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;">Links e contatos exibidos na loja, avaliações e pontos de contato do cliente.</p></div><span class="mi" style="color:#B42318;font-size:22px;">share</span></div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">' +
              _phoneInput('cfg-int-whatsapp-country', 'cfg-whatsapp', 'WhatsApp público', countryCode, whatsapp, '912 345 678') +
              _configInput('cfg-instagram', 'Instagram', c.instagram, 'https://instagram.com/sua_loja') +
              _configInput('cfg-facebook', 'Facebook', c.facebook, 'https://facebook.com/sua_loja') +
              _configInput('cfg-tiktok', 'TikTok', c.tiktok, 'https://tiktok.com/@sua_loja') +
            '</div>' +
          '</section>' +
        '</div>' +
        '<aside style="' + _configCardStyle('18px 20px') + 'position:sticky;top:82px;">' +
          '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;"><div style="width:36px;height:36px;border-radius:12px;background:#FAF8F4;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:20px;">hub</span></div><div><h3 style="margin:0;color:#1F1F1F;font-size:16px;font-weight:700;">Onde esses dados aparecem</h3><p style="margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;">A configuração fica salva em Firebase e alimenta os pontos públicos já conectados.</p></div></div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            _integrationInfoRow('forum', 'WhatsApp', 'Usado nos botões de contato da loja e na página de avaliações.') +
            _integrationInfoRow('alternate_email', 'Redes sociais', 'Instagram, Facebook e TikTok são lidos pelo template público quando preenchidos.') +
            _integrationInfoRow('analytics', 'Analytics', 'GA4, GTM e Meta Pixel ficam disponíveis para medição da loja pública.') +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<div style="position:sticky;bottom:0;margin-top:16px;background:linear-gradient(180deg,rgba(250,248,244,0),#FAF8F4 42%);padding:14px 0 2px;display:flex;justify-content:flex-end;">' +
        '<button id="config-save" class="bf-btn bf-btn-primary">Salvar configurações</button>' +
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
        updatedAt: new Date().toISOString()
      });
      _save('integracoes', data);
    };
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
    var list = (Array.isArray(c.list) ? c.list : []).filter(function (ch) { return !_isSystemChannel(ch); });
    var rows = list.map(function (ch, idx) {
      return '<div class="channel-row bf-panel" data-channel-row="' + idx + '" style="grid-column:1/-1;display:grid;grid-template-columns:minmax(240px,1fr) 34px;gap:10px;align-items:end;background:#fff;padding:12px;">' +
        _field('ch-name-' + idx, 'Canal de venda', ch.name || '', 'WhatsApp, Marketplace, iFood...') +
        '<button class="bf-btn bf-btn-danger" type="button" onclick="Modules.Configuracoes._removeCanalVenda(' + idx + ')" title="Remover canal" style="width:34px;min-height:38px;height:38px;padding:0;">×</button>' +
      '</div>';
    }).join('');
    var content = document.getElementById('config-content');
    content.innerHTML = '<div class="settings-card bf-card">' +
      '<div class="settings-card-head"><h2>Canais de venda</h2><p>Cadastre os canais além dos canais fixos do sistema. Cardápio e Venda presencial aparecem automaticamente em Regras de preço.</p></div>' +
      '<div style="background:#F0FAF4;border:1px solid #BDE7CA;border-radius:14px;padding:12px 14px;margin-bottom:14px;color:#1F6F43;font-size:13px;font-weight:600;">Cardápio e Venda presencial são fixos e não precisam ser cadastrados aqui.</div>' +
      '<div id="channels-list" class="settings-grid">' + (rows || '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#8A7E7C;font-size:14px;font-weight:600;">Nenhum canal adicional cadastrado.</div>') + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;"><button class="bf-btn bf-btn-secondary" type="button" onclick="Modules.Configuracoes._addCanalVenda()">+ Adicionar canal</button><button class="bf-btn bf-btn-primary" type="button" onclick="Modules.Configuracoes._saveCanaisVenda()">Salvar canais</button></div>' +
      '</div>';
  }

  function _collectCanaisVenda() {
    var existing = (_config.canais_venda && Array.isArray(_config.canais_venda.list)) ? _config.canais_venda.list : [];
    return [].slice.call(document.querySelectorAll('[data-channel-row]')).map(function (row) {
      var idx = row.dataset.channelRow;
      var name = _val('ch-name-' + idx).trim().replace(/\s+/g, ' ');
      var prev = existing.find(function (ch) { return _normChannelName(ch.name) === _normChannelName(name); }) || {};
      return {
        name: name,
        commissionPct: parseFloat(String(prev.commissionPct || '0').replace(',', '.')) || 0,
        fixedFee: parseFloat(String(prev.fixedFee || '0').replace(',', '.')) || 0,
        taxPct: parseFloat(String(prev.taxPct || '0').replace(',', '.')) || 0,
        minMarginPct: parseFloat(String(prev.minMarginPct || '0').replace(',', '.')) || 0,
        differentPrice: !!prev.differentPrice
      };
    }).filter(function (ch) { return !!ch.name && !_isSystemChannel(ch); });
  }

  function _saveCanaisVenda() {
    var data = { list: _fixedChannels().concat(_collectCanaisVenda()) };
    DB.setDocRoot('config', 'canais_venda', data).then(function () {
      _config.canais_venda = data;
      UI.toast('Canais salvos', 'success');
      _renderCanaisVenda();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _addCanalVenda() {
    _config.canais_venda = { list: _collectCanaisVenda().concat([{ name: '', commissionPct: 0, fixedFee: 0, taxPct: 0, minMarginPct: 0, differentPrice: false }]) };
    _renderCanaisVenda();
  }

  function _removeCanalVenda(idx) {
    var list = _collectCanaisVenda();
    list.splice(idx, 1);
    _config.canais_venda = { list: list };
    _renderCanaisVenda();
  }

  function _renderTpv() {
    var c = _config.tpv || {};
    var enabled = c.enabled === true || c.tpvEnabled === true || c.active === true;
    var paymentMethods = _tpvFinancePaymentMethods(c.defaultPaymentMethod || '');
    var paymentOptions = _tpvPaymentMethodOptions(c.defaultPaymentMethod || '', paymentMethods);
    var content = document.getElementById('config-content');
    content.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:22px;max-width:1180px;margin:0 auto;width:100%;">' +
        '<style>.tpv-settings .bf-input,.tpv-settings .bf-select{background:#FFFCF8;border-color:#E8DCD7;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease}.tpv-settings .bf-input:focus,.tpv-settings .bf-select:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);outline:none}.tpv-panel{display:grid;grid-template-columns:1fr;gap:14px}.tpv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 16px;align-items:start}.tpv-status-wrap{display:flex;flex-direction:column;align-items:flex-start;min-width:0}.tpv-status-field{background:#FFFCF8;border:0;border-radius:12px;padding:0;min-height:42px;display:flex;align-items:center;justify-content:flex-start;width:100%}.tpv-status-row{display:flex;align-items:center;justify-content:flex-start;gap:8px;min-height:42px;white-space:nowrap}.tpv-status-row input{accent-color:#C4362A;width:16px;height:16px;flex:0 0 auto}.tpv-status-row span{font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.2}.tpv-note{font-size:12px;color:#6F6860;line-height:1.48;background:#FFFCF8;border:1px solid #EADFD8;border-radius:14px;padding:10px 12px}.tpv-field-help{font-size:11px;color:#8A7E7C;line-height:1.38;margin-top:5px}.tpv-settings .bf-field label,.tpv-status-label{color:#7E716D;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.045em;margin-bottom:6px;display:block}@media(max-width:900px){.tpv-grid{grid-template-columns:1fr 1fr}.tpv-status-wrap{grid-column:1/-1}}@media(max-width:760px){.tpv-grid{grid-template-columns:1fr}.tpv-status-row{white-space:normal}}</style>' +
        '<section class="bf-card bf-section tpv-settings">' +
          '<div class="bf-section-header">' +
            '<div style="min-width:0;"><h3 class="bf-section-title">Venda presencial</h3><p class="bf-section-subtitle">Configurações usadas para vender presencialmente pela loja.</p></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
            '<div class="bf-panel tpv-panel" style="background:#fff;padding:16px;border-color:#EADFD8;box-shadow:0 10px 24px rgba(31,31,31,.04);">' +
              '<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;"><span class="mi" style="font-size:18px;color:#6F6860;line-height:1.2;">point_of_sale</span><div><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Informações do caixa</div><div style="font-size:12px;color:#8A7E7C;line-height:1.35;margin-top:2px;">Ative a venda presencial quando a loja também registrar vendas no balcão.</div></div></div>' +
              '<div class="tpv-grid">' +
                '<div class="tpv-status-wrap"><span class="tpv-status-label">Status</span><div class="tpv-status-field"><label class="tpv-status-row"><input id="cfg-tpv-enabled" type="checkbox"' + (enabled ? ' checked' : '') + '><span>Ativar venda presencial</span></label></div></div>' +
                '<div class="bf-field"><label>Nome do caixa</label><input id="cfg-tpv-register-name" class="bf-input" value="' + _esc(c.registerName || 'Caixa principal') + '" placeholder="Caixa principal"><div class="tpv-field-help">Nome interno para identificar o caixa usado nas vendas presenciais.</div></div>' +
                '<div class="bf-field"><label>Pagamento padrão</label><select id="cfg-tpv-default-payment" class="bf-select">' + paymentOptions + '</select></div>' +
              '</div>' +
            '</div>' +
            '<div class="tpv-note">Quando ativado, o menu Venda presencial aparece no painel e as vendas feitas ali entram como canal Venda presencial. Quando desativado, esse menu fica oculto e a loja continua usando apenas os canais de venda já configurados.</div>' +
          '</div>' +
        '</section>' +
        '<section class="bf-card bf-actions-row" style="padding:14px 16px;position:sticky;bottom:0;z-index:2;">' +
          '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Revise os dados antes de salvar.</div>' +
          '<button class="bf-btn bf-btn-primary" id="config-save">Salvar alterações</button>' +
        '</section>' +
      '</div>';
    document.getElementById('config-save').onclick = function () {
      _save(_activeSub, {
        enabled: _checked('cfg-tpv-enabled'),
        registerName: _val('cfg-tpv-register-name') || 'Caixa principal',
        defaultPaymentMethod: _val('cfg-tpv-default-payment'),
        channel: 'Venda presencial',
        updatedAt: new Date().toISOString()
      });
    };
  }

  function _tpvFinancePaymentMethods(selected) {
    var current = String(selected || '').trim();
    var financeiro = _config.financeiro || {};
    var source = Array.isArray(financeiro.formas_pagamento) ? financeiro.formas_pagamento
      : (Array.isArray(financeiro.paymentMethods) ? financeiro.paymentMethods
      : (Array.isArray(financeiro.formasPagamento) ? financeiro.formasPagamento : []));
    var methods = source.map(function (item) {
      if (typeof item === 'string') return { name: item, active: true, raw: item };
      var typeName = item && (item.tipoGlobalNome || item.tipo || item.typeName || item.type || '');
      var accountId = item && (item.contaPadraoId || item.defaultAccountId || item.bankAccountId || '');
      return {
        name: item && (item.nome || item.name || item.label || item.id || ''),
        active: !item || item.ativo !== false,
        typeName: typeName,
        requiresAccount: !!(item && (item.exigeConta || item.requiresBankAccount)),
        defaultAccountId: accountId,
        compensationDays: item && (item.prazoCompensacaoDias || item.defaultCompensationDays || item.compensationDays || 0),
        feePct: item && (item.taxaPercentual || item.feePct || 0),
        feeFixed: item && (item.taxaFixa || item.fixedFee || 0),
        raw: item
      };
    }).filter(function (item) {
      return item.name;
    }).sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    if (!methods.length) {
      methods = ['Dinheiro', 'Transferência', 'MB Way', 'Multibanco', 'Cartão', 'Cheque', 'Outro'].map(function (name) {
        return { name: name, active: true, fallback: true };
      });
    }
    var exists = methods.some(function (item) { return item.name === current; });
    if (current && !exists) {
      methods.unshift({ name: current, active: false, legacy: true });
    }
    return methods;
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

  function _phoneInput(countryId, phoneId, label, countryCode, phone, placeholder) {
    return '<div class="bf-field"><label>' + _esc(label) + '</label><div class="bf-phone-row">' +
      '<select id="' + countryId + '" class="bf-select">' + _phoneCountryOptions(countryCode) + '</select>' +
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

  function _cleanDomain(value) {
    return String(value || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  }

  function _domainBase(slug, rootDomain, c) {
    if (slug) return 'https://bocafood.app/' + slug;
    return 'https://bocafood.app/aguardando-slug';
  }

  function _domainUrls(slug, rootDomain, c) {
    var base = _domainBase(slug, rootDomain, c);
    return {
      publicUrl: base,
      loginUrl: base + '/login',
      orderUrl: base + '/#pedido',
      trackUrl: base + '/track.html',
      reviewUrl: base + '/review.html',
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

  function _planDisplay(plan) {
    var map = { essencial: 'Plano Essencial', starter: 'Plano Essencial', compromisso_anual: 'Plano Compromisso Anual', fundadoras: 'Plano Fundadoras' };
    var value = String(plan || 'essencial').trim();
    return map[value] || value;
  }

  function _accountStatusDisplay(status) {
    var map = { active: 'Ativo', pending: 'Pendente', paused: 'Pausado', disabled: 'Bloqueado' };
    var value = String(status || 'active').trim();
    return map[value] || value;
  }

  function _roleDisplay(role) {
    var map = { master_admin: 'Master admin', master: 'Master admin', store_owner: 'Responsável pela loja', tenant_owner: 'Responsável pela loja', owner: 'Responsável pela loja', store_staff: 'Equipe da loja', manager: 'Gestor', store_customer: 'Cliente da loja', pending_classification: 'Pendente' };
    var value = String(role || '').trim();
    return map[value] || value || 'Não configurado';
  }

  function _formatPlanDate(value) {
    if (!value) return 'Não configurado';
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
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
      patch.phoneCountryCode = phoneCode;
      patch.phoneNumber = phoneNumber;
      patch.phoneFull = phoneFull;
      patch.contactEmail = data.email || '';
      patch.adminEmail = data.adminEmail || data.fiscalEmail || data.billingEmail || '';
      patch.fiscalEmail = data.fiscalEmail || data.adminEmail || '';
      patch.billingEmail = data.billingEmail || data.adminEmail || '';
      patch.country = addressCountry;
      patch.language = data.language || data.defaultLanguage || '';
      patch.document = data.companyFiscalId || data.fiscalDocument || data.taxId || data.nif || '';
      patch.accountAddress = Object.assign({}, currentAddress, {
        street: data.companyAddressLine || (data.companyAddress && data.companyAddress.addressLine) || '',
        number: data.companyNumber || (data.companyAddress && data.companyAddress.number) || '',
        complement: data.companyComplement || (data.companyAddress && data.companyAddress.complement) || '',
        neighborhood: data.companyNeighborhood || (data.companyAddress && data.companyAddress.neighborhood) || '',
        city: data.companyCity || (data.companyAddress && data.companyAddress.city) || '',
        province: data.companyRegion || (data.companyAddress && (data.companyAddress.region || data.companyAddress.state || data.companyAddress.province)) || '',
        postalCode: data.companyPostalCode || (data.companyAddress && data.companyAddress.postalCode) || '',
        country: addressCountry,
        source: 'admin_setup',
        updatedAt: now
      });
      patch.store = Object.assign({}, currentStore, {
        name: data.businessName || currentStore.name || '',
        city: currentStore.city || zoneLocation.city || '',
        country: zoneLocation.country || currentStore.country || addressCountry,
        language: data.language || data.defaultLanguage || currentStore.language || '',
        phone: data.phone || '',
        phoneCountryCode: phoneCode,
        phoneFull: phoneFull,
        whatsapp: data.whatsapp || '',
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
    return String(code || '') + clean;
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

  function _fixedChannels() {
    return [
      { name: 'Cardápio', commissionPct: 0, fixedFee: 0, taxPct: 0, minMarginPct: 0, differentPrice: false, locked: true },
      { name: 'Venda presencial', commissionPct: 0, fixedFee: 0, taxPct: 0, minMarginPct: 0, differentPrice: false, locked: true }
    ];
  }

  function _ensureFixedChannels() {
    var current = (_config.canais_venda && Array.isArray(_config.canais_venda.list)) ? _config.canais_venda.list : [];
    var custom = current.filter(function (ch) { return !_isSystemChannel(ch); });
    var data = { list: _fixedChannels().concat(custom) };
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
    _addCanalVenda: _addCanalVenda, _removeCanalVenda: _removeCanalVenda, _saveCanaisVenda: _saveCanaisVenda,
    _uploadAppearanceImage: _uploadAppearanceImage,
    _uploadGeneralAvatarImage: _uploadGeneralAvatarImage,
    _normalizeDomainSlugField: _normalizeDomainSlugField,
    _copyDomainValue: _copyDomainValue,
    _sendPasswordReset: _sendPasswordReset,
    _publishStore: _publishStore,
    _unpublishStore: _unpublishStore
  };
})();
