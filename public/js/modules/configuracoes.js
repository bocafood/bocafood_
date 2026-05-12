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

  var TABS = [
    { key: 'geral', label: 'Geral' },
    { key: 'tpv', label: 'TPV' },
    { key: 'dominio', label: 'Domínio / URL' },
    { key: 'integracoes', label: 'Integrações' },
    { key: 'plano', label: 'Plano' },
    { key: 'canais_venda', label: 'Canais de venda' }
  ];

  var CONFIG_TABS = ['geral', 'tpv', 'dominio', 'integracoes', 'pagamentos', 'endereco', 'seo', 'template', 'canais_venda'];

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
      return '<button class="' + (t.key === _activeSub ? 'active' : '') + '" onclick="Modules.Configuracoes._switchSub(\'' + t.key + '\')">' + t.label + '</button>';
    }).join('');
  }

  function _switchSub(key) {
    _activeSub = key;
    _renderSub();
    Router.navigate('configuracoes/' + key);
  }

  function _load() {
    return Promise.all(CONFIG_TABS.map(function (k) { return DB.getDocRoot('config', k); }))
      .then(function (docs) {
        _config = {};
        CONFIG_TABS.forEach(function (k, i) { _config[k] = docs[i] || {}; });
      })
      .catch(function (err) {
        console.error('Config load error', err);
        _config = {};
      });
  }

  function _renderSub() {
    if (_activeSub === 'geral') return _renderGeral();
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
    return '<label class="field"><span>' + label + '</span><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value || '') + '" placeholder="' + (placeholder || '') + '"></label>';
  }

  function _textarea(id, label, value, placeholder) {
    return '<label class="field"><span>' + label + '</span><textarea id="' + id + '" placeholder="' + (placeholder || '') + '">' + _esc(value || '') + '</textarea></label>';
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
    ImageTools.process(file, { kind: targetKind, entityId: draftId }).then(function (result) {
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
    ImageTools.process(file, { kind: 'logo', entityId: 'general-avatar' }).then(function (result) {
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
    var profile = window.Auth && Auth.getAdminProfile ? Auth.getAdminProfile() : null;
    var fc = (profile && profile.fiscalCountry) || 'ES';
    var fiscalCfg = window.FiscalConfig ? FiscalConfig.get(fc) : null;
    var fiscalLabel = fiscalCfg ? fiscalCfg.label : (fc === 'PT' ? 'Portugal' : 'Espanha');
    var fiscalNote = fiscalCfg && !fiscalCfg.fiscalModuleEnabled ? 'Modulo fiscal desativado' : 'Modulo fiscal ativo';
    var fiscalDocLabel = fiscalCfg ? fiscalCfg.fiscalDocumentLabel : 'Documento fiscal';
    var fiscalDocPlaceholder = fiscalCfg ? fiscalCfg.fiscalDocumentPlaceholder : 'Número de identificação fiscal';
    var fiscalDocHint = fiscalCfg ? fiscalCfg.fiscalDocumentHint : 'Documento fiscal da empresa.';
    var regionLabel = fiscalCfg ? fiscalCfg.regionLabel : 'Região / Província';
    var addressLabel = fiscalCfg ? fiscalCfg.addressLabel : 'Endereço';
    var cityLabel = fiscalCfg ? fiscalCfg.cityLabel : 'Cidade';
    var postalLabel = fiscalCfg ? fiscalCfg.postalCodeLabel : 'Código postal';
    var companyAddress = c.companyAddress || c.businessAddress || {};
    var avatarUrl = c.avatarUrl || c.storeAvatarUrl || c.accountAvatarUrl || '';
    var content = document.getElementById('config-content');
    if (!content) return;
    content.className = 'module-content';
    content.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Geral</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Dados centrais usados pelo painel, loja online, fiscal, comunicação e módulos operacionais.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
          _configChip(c.businessName || 'Nome pendente') +
          _configChip((c.city || 'Cidade') + ' / ' + (c.country || 'Pais')) +
          _configChip((c.currency || c.defaultCurrency || 'EUR') + ' · ' + (c.language || c.defaultLanguage || 'pt-PT')) +
        '</div>' +
      '</div>' +
      '<section style="' + _configCardStyle('0') + 'overflow:hidden;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr));gap:0;align-items:stretch;">' +
          '<div style="background:linear-gradient(135deg,#FFF 0%,#FAF8F4 100%);border-right:1px solid #EAE4DA;padding:22px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;min-width:0;">' +
            '<div>' +
              '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;">' +
                '<div id="cfg-avatar-preview" style="width:66px;height:66px;border-radius:20px;background:#fff;color:#B42318;border:1px solid #E5D3CF;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 12px 24px rgba(31,31,31,.075);flex:0 0 auto;">' + (avatarUrl ? '<img src="' + _esc(avatarUrl) + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block;">' : '<span class="mi" style="font-size:30px;">storefront</span>') + '</div>' +
                '<div style="min-width:0;flex:1;padding-top:2px;">' +
                  '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:7px;"><span style="font-size:12px;font-weight:800;color:#B42318;text-transform:uppercase;letter-spacing:.02em;">Ficha do negócio</span><span style="display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:11px;font-weight:700;">' + _esc(fiscalLabel) + '</span></div>' +
                  '<h3 style="margin:0;color:#1F1F1F;font-size:25px;font-weight:800;line-height:1.12;word-break:break-word;">' + _esc(c.businessName || c.tradeName || c.visualName || 'Nome do negócio') + '</h3>' +
                  '<p style="margin:8px 0 0;color:#6F6860;font-size:13px;line-height:1.45;max-width:440px;">' + _esc(c.description || 'Descrição curta ainda não preenchida.') + '</p>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">' +
              _generalMiniInfo('Nome comercial', c.tradeName || c.commercialName || c.visualName || c.businessName || 'Não informado') +
              _generalMiniInfo('Responsável', c.legalRepresentative || c.responsavelLegal || 'Não informado') +
              _generalMiniInfo('Documento', c.companyFiscalId || c.fiscalDocument || c.taxId || c.nif || 'Não informado') +
              _generalMiniInfo('País fiscal', fiscalLabel) +
            '</div>' +
          '</div>' +
          '<div style="padding:22px;min-width:0;">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;">' +
              '<div><div style="font-size:16px;font-weight:700;color:#1F1F1F;">Identidade e cadastro</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:3px;">Campos que alimentam áreas públicas, internas e fiscais.</div></div>' +
              '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:700;white-space:nowrap;">Editável</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">' +
              '<div style="grid-column:1/-1;">' +
                '<div style="border:1px solid #EAE4DA;border-radius:15px;background:#FAF8F4;padding:13px 14px;display:flex;align-items:center;gap:12px;">' +
                  '<div style="width:38px;height:38px;border-radius:13px;background:#fff;color:#B42318;display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:0 8px 18px rgba(31,31,31,.045);"><span class="mi" style="font-size:20px;">add_photo_alternate</span></div>' +
                  '<div style="min-width:0;flex:1;">' +
                    '<div style="font-size:13px;font-weight:800;color:#1F1F1F;line-height:1.25;">Avatar da conta</div>' +
                    '<div style="font-size:12px;color:#6F6860;line-height:1.4;margin-top:2px;">Imagem quadrada, ideal 500 x 500 px. JPG, PNG ou WebP.</div>' +
                  '</div>' +
                  '<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Configuracoes._uploadGeneralAvatarImage(event)" style="max-width:210px;width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:400;font-family:inherit;outline:none;">' +
                '</div>' +
                '<input id="cfg-avatar-url" value="' + _esc(avatarUrl) + '" placeholder="URL do avatar" style="' + _configInputStyle() + 'margin-top:10px;">' +
              '</div>' +
              '<div style="grid-column:1/-1;">' + _configInput('cfg-business-name', 'Nome do negócio', c.businessName, 'Boca do Brasil') + '</div>' +
              _configInput('cfg-trade-name', 'Nome comercial', c.tradeName || c.commercialName || c.visualName || c.businessName, 'Boca do Brasil') +
              _configInput('cfg-legal-name', 'Razão social', c.legalName || c.companyLegalName || '', 'Nome legal da empresa') +
              _configInput('cfg-legal-representative', 'Responsável legal', c.legalRepresentative || c.responsavelLegal || '', 'Nome do responsável') +
              '<div style="grid-column:1/-1;">' + _configTextarea('cfg-description', 'Descrição curta', c.description, 'Comida brasileira artesanal em Lisboa') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section style="' + _configCardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px;">' +
          '<div><div style="font-size:15px;font-weight:800;color:#1F1F1F;">Contato e padrões</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Canais de atendimento e preferências compartilhadas com o restante do painel.</div></div>' +
          '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:700;">' + _esc(c.currency || c.defaultCurrency || 'EUR') + ' · ' + _esc(c.language || c.defaultLanguage || 'pt-PT') + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px;">' +
          '<div style="border:1px solid #EAE4DA;border-radius:15px;background:#fff;padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:9px;margin-bottom:13px;"><span class="mi" style="font-size:19px;color:#B42318;">support_agent</span><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Atendimento</div></div>' +
            '<div style="display:flex;flex-direction:column;gap:14px;">' +
              _phoneInput('cfg-phone-country', 'cfg-whatsapp', 'Telefone / WhatsApp', c.phoneCountryCode || c.whatsappCountryCode || _defaultPhoneCode(fc), c.whatsapp || c.phone, '912 345 678') +
              _configInput('cfg-email', 'E-mail', c.email, 'contato@...') +
              _configInput('cfg-admin-email', 'E-mail fiscal / administrativo', c.adminEmail || c.fiscalEmail || c.billingEmail || '', 'admin@...') +
            '</div>' +
          '</div>' +
          '<div style="border:1px solid #EAE4DA;border-radius:15px;background:#fff;padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:9px;margin-bottom:13px;"><span class="mi" style="font-size:19px;color:#B42318;">tune</span><div style="font-size:13px;font-weight:800;color:#1F1F1F;">Padrões do sistema</div></div>' +
            '<div style="display:flex;flex-direction:column;gap:14px;">' +
            _configSelect('cfg-language', 'Idioma padrão', c.language || c.defaultLanguage || 'pt-PT', [
              ['pt-PT', 'Português (Portugal)'],
              ['pt-BR', 'Português (Brasil)'],
              ['es-ES', 'Espanhol'],
              ['en', 'Inglês']
            ]) +
            _configSelect('cfg-currency', 'Moeda', c.currency || c.defaultCurrency || 'EUR', [
              ['EUR', 'Euro (EUR)'],
              ['BRL', 'Real brasileiro (BRL)'],
              ['USD', 'Dólar americano (USD)'],
              ['GBP', 'Libra esterlina (GBP)']
            ]) +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section style="' + _configCardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
          '<div style="display:flex;align-items:flex-start;gap:11px;min-width:0;">' +
            '<div style="width:38px;height:38px;border-radius:13px;background:#FAF8F4;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:21px;">account_balance</span></div>' +
            '<div style="min-width:0;"><div style="font-size:15px;font-weight:800;color:#1F1F1F;">Dados fiscais da empresa</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Documento e endereço fiscal do negócio. Este endereço é separado do endereço de retirada usado no template.</div></div>' +
          '</div>' +
          '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:#FAF8F4;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:700;">' + _esc(fiscalLabel) + ' · ' + _esc(fiscalNote) + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">' +
          '<div>' +
            _configInput('cfg-company-fiscal-id', fiscalDocLabel, c.companyFiscalId || c.fiscalDocument || c.taxId || c.nif || '', fiscalDocPlaceholder) +
            '<div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;">' + _esc(fiscalDocHint) + '</div>' +
          '</div>' +
          _configInput('cfg-company-address', addressLabel + ' fiscal da empresa', companyAddress.addressLine || c.companyAddressLine || c.businessAddressLine || '', 'Rua, número...', 'text', 'off', 'business street-address') +
          _configInput('cfg-company-city', cityLabel, companyAddress.city || c.companyCity || c.businessCity || c.city || '', cityLabel) +
          _configInput('cfg-company-region', regionLabel, companyAddress.region || companyAddress.state || c.companyRegion || c.companyState || '', regionLabel) +
          _configInput('cfg-company-postal', postalLabel, companyAddress.postalCode || c.companyPostalCode || '', postalLabel) +
          _configInput('cfg-company-country', 'País fiscal da empresa', companyAddress.country || c.companyCountry || c.country || fiscalLabel, fiscalLabel) +
        '</div>' +
        '<div style="display:flex;align-items:flex-start;gap:10px;background:#FAF8F4;border:1px solid #EAE4DA;border-radius:14px;padding:13px 14px;color:#6F6860;font-size:13px;line-height:1.45;margin-top:14px;">' +
          '<span class="mi" style="font-size:18px;color:#B45309;line-height:1.35;">travel_explore</span>' +
          '<div>O campo de endereço fiscal já está preparado para o autocomplete do Google Maps via <strong style="color:#1F1F1F;">BocaPlaces</strong>. O país fiscal é definido pelo Master e afeta regras fiscais, IVA e módulos disponíveis.</div>' +
        '</div>' +
      '</section>' +
      '<section style="' + _configCardStyle('12px 14px') + 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:sticky;bottom:0;z-index:2;">' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;">As alterações alimentam outras áreas do painel. Salve para atualizar a base compartilhada.</div>' +
        '<button id="config-save" style="' + _configPrimaryStyle() + '">Salvar configurações</button>' +
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
        tradeName: _val('cfg-trade-name'),
        commercialName: _val('cfg-trade-name'),
        legalName: _val('cfg-legal-name'),
        companyLegalName: _val('cfg-legal-name'),
        legalRepresentative: _val('cfg-legal-representative'),
        responsavelLegal: _val('cfg-legal-representative'),
        description: _val('cfg-description'),
        whatsapp: _val('cfg-whatsapp'),
        phone: _val('cfg-whatsapp'),
        phoneCountryCode: _val('cfg-phone-country'),
        whatsappCountryCode: _val('cfg-phone-country'),
        phoneFull: [_val('cfg-phone-country'), _val('cfg-whatsapp')].filter(Boolean).join(' '),
        whatsappFull: [_val('cfg-phone-country'), _val('cfg-whatsapp')].filter(Boolean).join(' '),
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
        avatarWidth: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageWidth ? _appearanceState().generalAvatar.imageWidth : c.avatarWidth,
        avatarHeight: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageHeight ? _appearanceState().generalAvatar.imageHeight : c.avatarHeight,
        avatarSizeKb: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageSizeKb ? _appearanceState().generalAvatar.imageSizeKb : c.avatarSizeKb,
        avatarFormat: _appearanceState().generalAvatar && _appearanceState().generalAvatar.imageFormat ? _appearanceState().generalAvatar.imageFormat : c.avatarFormat,
        companyFiscalId: fiscalId,
        fiscalDocument: fiscalId,
        companyAddressLine: _val('cfg-company-address'),
        companyCity: _val('cfg-company-city'),
        companyRegion: _val('cfg-company-region'),
        companyPostalCode: _val('cfg-company-postal'),
        companyCountry: _val('cfg-company-country'),
        companyAddress: {
          addressLine: _val('cfg-company-address'),
          city: _val('cfg-company-city'),
          region: _val('cfg-company-region'),
          postalCode: _val('cfg-company-postal'),
          country: _val('cfg-company-country')
        },
        businessAddress: {
          addressLine: _val('cfg-company-address'),
          city: _val('cfg-company-city'),
          region: _val('cfg-company-region'),
          postalCode: _val('cfg-company-postal'),
          country: _val('cfg-company-country')
        }
      });
    };
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('cfg-company-address'); }, 100);
  }

  function _renderPlano() {
    var profile = window.Auth && Auth.getAdminProfile ? (Auth.getAdminProfile() || {}) : {};
    var plan = profile.plan || 'starter';
    var status = profile.status || 'active';
    var features = Array.isArray(profile.features) ? profile.features : (Array.isArray(profile.planFeatures) ? profile.planFeatures : []);
    var limits = profile.planLimits || profile.limits || {};
    var billing = profile.billing || {};
    var renewalDate = profile.renewalDate || profile.nextBillingAt || billing.renewalDate || billing.nextBillingAt || '';
    var trialEndsAt = profile.trialEndsAt || billing.trialEndsAt || '';
    var cycle = profile.billingCycle || billing.cycle || '';
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
      '<div class="field"><span>Logo</span><input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Configuracoes._uploadAppearanceImage(event,\'logo\')" style="width:100%;padding:11px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:#fff;font-size:14px;"><div style="margin-top:6px;font-size:11px;line-height:1.45;color:#8A7E7C;">' + _appearanceTip('logo') + '</div></div>',
      _field('app-logo-url', 'Logo', c.logoUrl || _config.geral.logoUrl, 'https://...'),
      '<div class="field"><span>Banner</span><input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="Modules.Configuracoes._uploadAppearanceImage(event,\'banner\')" style="width:100%;padding:11px 12px;border:1.5px solid #D4C8C6;border-radius:10px;background:#fff;font-size:14px;"><div style="margin-top:6px;font-size:11px;line-height:1.45;color:#8A7E7C;">' + _appearanceTip('banner') + '</div></div>',
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
        logoWidth: _appearanceState().logo && _appearanceState().logo.imageWidth ? _appearanceState().logo.imageWidth : c.logoWidth,
        logoHeight: _appearanceState().logo && _appearanceState().logo.imageHeight ? _appearanceState().logo.imageHeight : c.logoHeight,
        logoSizeKb: _appearanceState().logo && _appearanceState().logo.imageSizeKb ? _appearanceState().logo.imageSizeKb : c.logoSizeKb,
        logoFormat: _appearanceState().logo && _appearanceState().logo.imageFormat ? _appearanceState().logo.imageFormat : c.logoFormat,
        bannerStoragePath: _appearanceState().banner && _appearanceState().banner.imageStoragePath ? _appearanceState().banner.imageStoragePath : c.bannerStoragePath,
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

    content.innerHTML = '<div class="settings-card">' +
      '<div class="settings-card-head"><h2>Produtos</h2><p>Configurações relacionadas ao cardápio de produtos.</p></div>' +
      '<div style="margin-top:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div>' +
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:4px;">Unidades de Medida</h3>' +
      '<p style="font-size:12px;color:#8A7E7C;">Unidades usadas em insumos e fichas técnicas</p>' +
      '</div>' +
      '<button onclick="Modules.Configuracoes._openUnidadeModal(null)" style="background:#C4362A;color:#fff;border:none;padding:9px 16px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">+ Adicionar</button>' +
      '</div>' +
      (_unidades.length === 0
        ? '<p style="text-align:center;padding:24px;color:#8A7E7C;font-size:13px;">Nenhuma unidade cadastrada.</p>'
        : '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">' +
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
              '<button onclick="Modules.Configuracoes._openUnidadeModal(\'' + u.id + '\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#EEF4FF;color:#3B82F6;cursor:pointer;margin-right:4px;font-size:13px;">✏</button>' +
              '<button onclick="Modules.Configuracoes._deleteUnidade(\'' + u.id + '\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#FFF0EE;color:#C4362A;cursor:pointer;font-size:13px;">✕</button>' +
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
      '<button onclick="Modules.Configuracoes._openFornecedorModal(null)" style="background:#C4362A;color:#fff;border:none;padding:9px 16px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">+ Adicionar</button>' +
      '</div>' +
      (_fornecedores.length === 0
        ? '<p style="text-align:center;padding:24px;color:#8A7E7C;font-size:13px;">Nenhum fornecedor cadastrado.</p>'
        : '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">' +
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
              '<button onclick="Modules.Configuracoes._openFornecedorModal(\'' + f.id + '\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#EEF4FF;color:#3B82F6;cursor:pointer;margin-right:4px;"><span class="mi" style="font-size:14px;">edit</span></button>' +
              '<button onclick="Modules.Configuracoes._deleteFornecedor(\'' + f.id + '\')" style="width:28px;height:28px;border-radius:7px;border:none;background:#FFF0EE;color:#C4362A;cursor:pointer;"><span class="mi" style="font-size:14px;">delete</span></button>' +
              '</td></tr>';
          }).join('') +
          '</tbody></table></div>') +
      '</div>' +

      '</div>';
  }

  function _openFornecedorModal(id) {
    _editingFornecedorId = id;
    var f = id ? (_fornecedores.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div>' +
      '<div style="margin-bottom:12px;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Nome *</label>' +
      '<input id="forn-name" type="text" value="' + _esc(f.name || '') + '" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
      '<div style="margin-bottom:12px;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Contato (telefone / email)</label>' +
      '<input id="forn-contact" type="text" value="' + _esc(f.contact || '') + '" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
      '<div style="margin-bottom:12px;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Observações</label>' +
      '<textarea id="forn-notes" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;min-height:60px;resize:vertical;">' + _esc(f.notes || '') + '</textarea></div>' +
      '</div>';
    var footer = '<button onclick="Modules.Configuracoes._saveFornecedor()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">' + (id ? 'Atualizar' : 'Adicionar') + '</button>';
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
    var body = '<div>' +
      '<div style="margin-bottom:12px;"><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Nome *</label>' +
      '<input id="un-name" type="text" value="' + _esc(u.name || '') + '" placeholder="ex: Quilograma" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Símbolo *</label>' +
      '<input id="un-symbol" type="text" value="' + _esc(u.symbol || '') + '" placeholder="kg" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;"></div>' +
      '<div><label style="font-size:11px;font-weight:700;color:#8A7E7C;display:block;margin-bottom:4px;">Tipo *</label>' +
      '<select id="un-type" style="width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;">' +
      '<option value="massa"' + (u.type === 'massa' ? ' selected' : '') + '>Massa</option>' +
      '<option value="volume"' + (u.type === 'volume' ? ' selected' : '') + '>Volume</option>' +
      '<option value="unidade"' + (!u.type || u.type === 'unidade' ? ' selected' : '') + '>Unidade</option>' +
      '</select></div>' +
      '</div></div>';

    var footer = '<button onclick="Modules.Configuracoes._saveUnidade()" style="width:100%;padding:13px;border-radius:11px;border:none;background:#C4362A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">' + (id ? 'Atualizar' : 'Adicionar') + '</button>';
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
    var suggestedSlug = _slugify(c.storeSlug || c.slug || c.subdomain || geral.storeSlug || geral.businessName || geral.tradeName || '');
    var rootDomain = c.rootDomain || c.mainDomain || c.platformDomain || '';
    var urls = _domainUrls(suggestedSlug, rootDomain, c);
    var domainReady = !!_cleanDomain(rootDomain || c.customDomain);
    var slugStatus = suggestedSlug ? 'Subdomínio definido' : 'Subdomínio pendente';
    var content = document.getElementById('config-content');
    if (!content) return;
    content.className = 'module-content';
    content.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;"><h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Domínio / URL</h2><p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;">Defina o identificador da loja que será usado como subdomínio e base dos links públicos.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
          _configChip(slugStatus) +
          _configChip(domainReady ? 'Domínio do sistema pronto' : 'Aguardando domínio principal') +
        '</div>' +
      '</div>' +
      '<section style="' + _configCardStyle() + 'display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:14px;align-items:center;">' +
        '<div style="min-width:0;"><div style="font-size:12px;font-weight:600;color:#6F6860;margin-bottom:5px;">Link principal da loja</div><div style="font-size:clamp(20px,2.4vw,30px);font-weight:700;color:#1F1F1F;line-height:1.1;word-break:break-all;">' + _esc(urls.publicUrl.replace(/^https?:\/\//, '')) + '</div><div style="font-size:12px;color:#8A7E7C;line-height:1.4;margin-top:7px;">' + (domainReady ? 'URL calculada com o domínio principal do sistema.' : 'Prévia temporária até o domínio principal ser configurado internamente.') + '</div></div>' +
        '<button type="button" onclick="Modules.Configuracoes._copyDomainValue(\'' + _esc(urls.publicUrl) + '\')" style="height:40px;padding:0 14px;border-radius:12px;border:1px solid #EAE4DA;background:#fff;color:#6F6860;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:8px;"><span class="mi" style="font-size:17px;">content_copy</span>Copiar</button>' +
      '</section>' +
      '<section style="' + _configCardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Identificador da loja</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Esse nome completa o endereço da loja e deve ser curto, claro e fácil de escrever.</div></div>' +
          '<span style="display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:' + (suggestedSlug ? '#F0FFF4' : '#FFF7ED') + ';border:1px solid ' + (suggestedSlug ? '#D9F2E3' : '#F3D9C7') + ';color:' + (suggestedSlug ? '#1F6F43' : '#B45309') + ';font-size:12px;font-weight:700;">' + _esc(slugStatus) + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">' +
          '<div><label style="' + _configLabelStyle() + '">Nome da loja / subdomínio</label><input id="cfg-store-slug" type="text" value="' + _esc(suggestedSlug) + '" placeholder="minha-loja" oninput="Modules.Configuracoes._normalizeDomainSlugField(\'cfg-store-slug\')" style="' + _configInputStyle() + '"><div style="font-size:11px;color:#8A7E7C;line-height:1.4;margin-top:5px;">Use letras, números e hífen. Exemplo: <strong>minha-loja</strong>.</div></div>' +
        '</div>' +
      '</section>' +
      '<section style="' + _configCardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;">' +
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Links gerados pelo sistema</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Quando o domínio principal for configurado, estes links ficam prontos a partir do subdomínio da loja.</div></div>' +
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
        _domainStatusCard('Subdomínio', suggestedSlug || 'Pendente', suggestedSlug ? 'Pronto para salvar.' : 'Informe o nome da loja.', suggestedSlug ? '#1F6F43' : '#B45309', suggestedSlug ? 'check_circle' : 'pending') +
        _domainStatusCard('Domínio principal', domainReady ? _cleanDomain(rootDomain || c.customDomain) : 'Pendente', domainReady ? 'Configurado internamente.' : 'Será definido pelo sistema.', domainReady ? '#1F6F43' : '#B45309', domainReady ? 'verified' : 'schedule') +
        _domainStatusCard('Links públicos', suggestedSlug ? 'Gerados' : 'Aguardando', suggestedSlug ? 'Prontos para copiar.' : 'Dependem do subdomínio.', suggestedSlug ? '#6C8777' : '#B45309', 'link') +
      '</section>' +
      '<section style="' + _configCardStyle() + 'display:flex;gap:12px;align-items:flex-start;">' +
        '<div style="width:38px;height:38px;border-radius:12px;background:#FAF8F4;color:#B45309;display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><span class="mi" style="font-size:22px;">info</span></div>' +
        '<div style="min-width:0;"><div style="font-size:14px;font-weight:700;color:#1F1F1F;margin-bottom:3px;">Preparado para o domínio principal</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">A usuária define apenas o nome da loja. O domínio principal será configurado internamente pelo sistema e aplicado automaticamente às URLs.</div></div>' +
      '</section>' +
      '<section style="' + _configCardStyle('12px 14px') + 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:sticky;bottom:0;z-index:2;">' +
        '<div style="font-size:13px;color:#6F6860;line-height:1.45;">Esses dados alimentam os links públicos da loja, pedidos, rastreio e avaliações.</div>' +
        '<button id="config-save" style="' + _configPrimaryStyle() + '">Salvar domínio</button>' +
      '</section>' +
    '</div>';
    document.getElementById('config-save').onclick = function () {
      var slug = _slugify(_val('cfg-store-slug'));
      if (!slug) { UI.toast('Informe o nome da loja para gerar o subdomínio.', 'error'); return; }
      var root = _cleanDomain(rootDomain);
      var custom = _cleanDomain(c.customDomain);
      var generated = _domainUrls(slug, root, { customDomain: custom });
      _save('dominio', {
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
      });
    };
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
      _field('cfg-city', 'Cidade', c.city, 'Lisboa'),
      _field('cfg-postal', 'Código postal', c.postalCode, '1000-000'),
      _field('cfg-pickup-area', 'Área / bairro para retirada', c.pickupArea, 'Centro'),
      _field('cfg-phone', 'Telefone', c.phone, '+351...'),
      _field('cfg-email', 'E-mail', c.email, 'contato@...')
    ].join(''), function () {
      return {
        addressLine: _val('cfg-address-line'),
        pickupAddress: _val('cfg-address-line'),
        pickupArea: _val('cfg-pickup-area'),
        city: _val('cfg-city'),
        postalCode: _val('cfg-postal'),
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
        '<button id="config-save" style="' + _configPrimaryStyle() + '">Salvar configurações</button>' +
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
    _paint('Template da loja', 'Campos diretos esperados pelo template público index.html.', [
      _check('cfg-tpl-closed', 'Loja fechada manualmente', !!c.manualClosed),
      _field('cfg-tpl-prep', 'Tempo de preparo (min)', c.prepTime || 45, '45', 'number'),
      _field('cfg-tpl-site', 'siteUrl', c.siteUrl, 'https://seudominio.com'),
      _field('cfg-tpl-pickup-address', 'pickupAddress', c.pickupAddress, 'Rua...'),
      _field('cfg-tpl-pickup-area', 'pickupArea', c.pickupArea, 'Centro'),
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
        pickupArea: _val('cfg-tpl-pickup-area'),
        destaqueProductId: _val('cfg-tpl-highlight'),
        hours: _parseJson('cfg-tpl-hours', []),
        deliveryZones: _parseJson('cfg-tpl-zones', []),
        categories: _parseJson('cfg-tpl-categories', []),
        coupons: _parseJson('cfg-tpl-coupons', [])
      };
    });
    setTimeout(function () { if (window.BocaPlaces) BocaPlaces.init('cfg-tpl-pickup-address'); }, 100);
  }

  function _renderCanaisVenda() {
    var c = _config.canais_venda || {};
    var list = (Array.isArray(c.list) ? c.list : []).filter(function (ch) { return !_isSystemChannel(ch); });
    var rows = list.map(function (ch, idx) {
      return '<div class="channel-row" data-channel-row="' + idx + '" style="grid-column:1/-1;display:grid;grid-template-columns:minmax(240px,1fr) 34px;gap:10px;align-items:end;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:12px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
        _field('ch-name-' + idx, 'Canal de venda', ch.name || '', 'WhatsApp, Marketplace, iFood...') +
        '<button type="button" onclick="Modules.Configuracoes._removeCanalVenda(' + idx + ')" title="Remover canal" style="height:38px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#B42318;cursor:pointer;font-weight:700;box-shadow:0 1px 2px rgba(31,31,31,.03);">×</button>' +
      '</div>';
    }).join('');
    var content = document.getElementById('config-content');
    content.innerHTML = '<div class="settings-card">' +
      '<div class="settings-card-head"><h2>Canais de venda</h2><p>Cadastre os canais além dos canais fixos do sistema. Cardápio e TPV aparecem automaticamente em Regras de preço.</p></div>' +
      '<div style="background:#F0FAF4;border:1px solid #BDE7CA;border-radius:14px;padding:12px 14px;margin-bottom:14px;color:#1F6F43;font-size:13px;font-weight:600;">Cardápio e TPV são fixos e não precisam ser cadastrados aqui.</div>' +
      '<div id="channels-list" class="settings-grid">' + (rows || '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#8A7E7C;font-size:14px;font-weight:600;">Nenhum canal adicional cadastrado.</div>') + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;"><button class="secondary-action" type="button" onclick="Modules.Configuracoes._addCanalVenda()">+ Adicionar canal</button><button class="primary-action" type="button" onclick="Modules.Configuracoes._saveCanaisVenda()">Salvar canais</button></div>' +
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
    _paint('TPV / Venda presencial', 'Ative o módulo de venda presencial por loja. Quando ativo, o menu Venda presencial aparece e as vendas usam o canal TPV.', [
      _check('cfg-tpv-enabled', 'Ativar TPV nesta loja', enabled),
      _field('cfg-tpv-register-name', 'Nome do caixa', c.registerName || 'Caixa principal', 'Caixa principal'),
      _field('cfg-tpv-default-payment', 'Pagamento padrão', c.defaultPaymentMethod || '', 'Dinheiro, cartão, multibanco...')
    ].join(''), function () {
      return {
        enabled: _checked('cfg-tpv-enabled'),
        registerName: _val('cfg-tpv-register-name') || 'Caixa principal',
        defaultPaymentMethod: _val('cfg-tpv-default-payment'),
        channel: 'TPV',
        updatedAt: new Date().toISOString()
      };
    });
  }

  function _paint(title, desc, body, collect) {
    var content = document.getElementById('config-content');
    content.innerHTML = '<div class="settings-card">' +
      '<div class="settings-card-head"><h2>' + title + '</h2><p>' + desc + '</p></div>' +
      '<div class="settings-grid">' + body + '</div>' +
      '<button class="primary-action" id="config-save">Salvar configurações</button>' +
      '</div>';
    document.getElementById('config-save').onclick = function () {
      _save(_activeSub, collect());
    };
  }

  function _configCardStyle(pad) {
    return 'background:#fff;border:none;border-radius:16px;padding:' + (pad || '18px 20px') + ';box-shadow:0 12px 30px rgba(31,31,31,.06);';
  }

  function _configChip(txt) {
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;color:#6F6860;font-size:12px;font-weight:500;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(txt) + '</span>';
  }

  function _configInput(id, label, value, placeholder, type, autocomplete, name) {
    return '<div><label style="' + _configLabelStyle() + '">' + _esc(label) + '</label><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '" placeholder="' + _esc(placeholder || '') + '"' + (autocomplete ? ' autocomplete="' + _esc(autocomplete) + '"' : '') + (name ? ' name="' + _esc(name) + '"' : '') + ' style="' + _configInputStyle() + '"></div>';
  }

  function _phoneInput(countryId, phoneId, label, countryCode, phone, placeholder) {
    return '<div><label style="' + _configLabelStyle() + '">' + _esc(label) + '</label><div style="display:grid;grid-template-columns:minmax(132px,.42fr) minmax(150px,1fr);gap:8px;">' +
      '<select id="' + countryId + '" style="' + _configInputStyle() + 'height:40px;background:#fff;">' + _phoneCountryOptions(countryCode) + '</select>' +
      '<input id="' + phoneId + '" type="tel" value="' + _esc(phone == null ? '' : phone) + '" placeholder="' + _esc(placeholder || '') + '" autocomplete="tel-national" style="' + _configInputStyle() + 'height:40px;">' +
    '</div></div>';
  }

  function _phoneCountryOptions(selected) {
    var current = String(selected || '+34');
    return [
      ['+34', '🇪🇸 +34'],
      ['+351', '🇵🇹 +351'],
      ['+55', '🇧🇷 +55'],
      ['+33', '🇫🇷 +33'],
      ['+39', '🇮🇹 +39'],
      ['+44', '🇬🇧 +44'],
      ['+1', '🇺🇸 +1']
    ].map(function (opt) {
      return '<option value="' + _esc(opt[0]) + '"' + (opt[0] === current ? ' selected' : '') + '>' + _esc(opt[1]) + '</option>';
    }).join('');
  }

  function _defaultPhoneCode(fiscalCountry) {
    if (fiscalCountry === 'PT') return '+351';
    if (fiscalCountry === 'BR') return '+55';
    return '+34';
  }

  function _configTextarea(id, label, value, placeholder) {
    return '<div><label style="' + _configLabelStyle() + '">' + _esc(label) + '</label><textarea id="' + id + '" placeholder="' + _esc(placeholder || '') + '" style="' + _configInputStyle() + 'min-height:118px;resize:vertical;line-height:1.45;">' + _esc(value == null ? '' : value) + '</textarea></div>';
  }

  function _configSelect(id, label, value, options) {
    var selected = String(value == null ? '' : value);
    return '<div><label style="' + _configLabelStyle() + '">' + _esc(label) + '</label><select id="' + id + '" style="' + _configInputStyle() + 'height:40px;background:#fff;">' + (options || []).map(function (opt) {
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
    var custom = _cleanDomain(c && c.customDomain);
    if (custom) return 'https://' + custom;
    rootDomain = _cleanDomain(rootDomain);
    if (slug && rootDomain) return 'https://' + slug + '.' + rootDomain;
    if (slug) return 'https://' + slug + '.dominio-principal.com';
    return 'https://loja.dominio-principal.com';
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
    var map = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
    var value = String(plan || 'starter').trim();
    return map[value] || value;
  }

  function _accountStatusDisplay(status) {
    var map = { active: 'Ativo', pending: 'Pendente', paused: 'Pausado', disabled: 'Bloqueado' };
    var value = String(status || 'active').trim();
    return map[value] || value;
  }

  function _roleDisplay(role) {
    var map = { master_admin: 'Master admin', master: 'Master admin', store_owner: 'Dono da loja', tenant_owner: 'Dono da loja', store_staff: 'Equipe da loja', manager: 'Gestor', store_customer: 'Cliente da loja', pending_classification: 'Pendente' };
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
    DB.setDocRoot('config', key, data).then(function () {
      _config[key] = data;
      if (key === 'aparencia') {
        _config.geral = Object.assign({}, _config.geral || {}, data);
        DB.setDocRoot('config', 'geral', _config.geral).catch(function (err) {
          console.error('Config sync geral/aparencia error', err);
        });
      }
      if (key === 'tpv') {
        _ensureFixedChannels();
        if (window.AdminApp && typeof AdminApp.applyTpvVisibility === 'function') AdminApp.applyTpvVisibility();
      }
      UI.toast('Configurações salvas', 'success');
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
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
    return name === 'tpv';
  }

  function _isSystemChannel(channel) {
    return _isCardapioChannel(channel) || _isTpvChannel(channel);
  }

  function _fixedChannels() {
    return [
      { name: 'Cardápio', commissionPct: 0, fixedFee: 0, taxPct: 0, minMarginPct: 0, differentPrice: false, locked: true },
      { name: 'TPV', commissionPct: 0, fixedFee: 0, taxPct: 0, minMarginPct: 0, differentPrice: false, locked: true }
    ];
  }

  function _ensureFixedChannels() {
    var current = (_config.canais_venda && Array.isArray(_config.canais_venda.list)) ? _config.canais_venda.list : [];
    var custom = current.filter(function (ch) { return !_isSystemChannel(ch); });
    var data = { list: _fixedChannels().concat(custom) };
    _config.canais_venda = data;
    DB.setDocRoot('config', 'canais_venda', data).catch(function (err) {
      console.error('TPV channel sync error', err);
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
    _copyDomainValue: _copyDomainValue
  };
})();
