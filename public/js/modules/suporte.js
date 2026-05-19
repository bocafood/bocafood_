// js/modules/suporte.js
window.Modules = window.Modules || {};
Modules.Suporte = (function () {
  'use strict';

  var _saving = false;

  function _baseStyles() {
    return '<style>' +
      '.support-page{padding:24px;display:flex;flex-direction:column;gap:18px;max-width:1180px;margin:0 auto;width:100%;box-sizing:border-box;}' +
      '.support-hero{background:linear-gradient(135deg,#FFFFFF 0%,#FCF8F2 62%,#FFF4F1 100%);border:1px solid #E8DED6;border-radius:22px;padding:22px;box-shadow:0 18px 42px rgba(31,31,31,.07);display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;overflow:hidden;position:relative;}' +
      '.support-hero::before{content:"";position:absolute;left:0;top:18px;bottom:18px;width:4px;border-radius:999px;background:#C4362A;}' +
      '.support-kicker{font-size:11px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:#C4362A;margin-bottom:7px;}' +
      '.support-title{font-size:26px;line-height:1.15;font-weight:850;color:#1F1F1F;margin:0 0 8px;}' +
      '.support-subtitle{font-size:14px;line-height:1.55;color:#6F6860;margin:0;max-width:680px;}' +
      '.support-hero-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid #E8DED6;background:#fff;border-radius:999px;padding:8px 11px;color:#6F6860;font-size:12px;font-weight:750;white-space:nowrap;box-shadow:0 8px 22px rgba(31,31,31,.045);}' +
      '.support-hero-badge .mi{font-size:16px;color:#C4362A;}' +
      '.support-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,.8fr);gap:16px;align-items:start;}' +
      '.support-card{background:#fff;border:1px solid #EAE4DA;border-radius:20px;box-shadow:0 14px 34px rgba(31,31,31,.055);padding:18px;}' +
      '.support-card-title{font-size:16px;font-weight:850;color:#1F1F1F;margin:0 0 4px;}' +
      '.support-card-copy{font-size:13px;line-height:1.5;color:#6F6860;margin:0 0 16px;}' +
      '.support-form{display:grid;gap:13px;}' +
      '.support-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}' +
      '.support-field{display:flex;flex-direction:column;gap:7px;min-width:0;}' +
      '.support-field.full{grid-column:1/-1;}' +
      '.support-label{font-size:10.5px;font-weight:850;letter-spacing:.055em;text-transform:uppercase;color:#857A73;}' +
      '.support-input,.support-select,.support-textarea{width:100%;box-sizing:border-box;border:1.5px solid #E5D8D5;border-radius:13px;background:#fff;color:#1F1F1F;font:inherit;font-size:13.5px;outline:none;transition:border-color .16s ease,box-shadow .16s ease;background .16s ease;}' +
      '.support-input,.support-select{height:42px;padding:0 12px;}' +
      '.support-select{appearance:none;background-image:linear-gradient(45deg,transparent 50%,#8A7D79 50%),linear-gradient(135deg,#8A7D79 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:34px;}' +
      '.support-textarea{min-height:142px;resize:vertical;padding:12px;line-height:1.5;}' +
      '.support-input:focus,.support-select:focus,.support-textarea:focus{border-color:#C4362A;box-shadow:0 0 0 4px rgba(196,54,42,.08);background:#FFFEFC;}' +
      '.support-help{font-size:11.5px;line-height:1.4;color:#8A7E7C;}' +
      '.support-actions{display:flex;justify-content:flex-end;gap:10px;padding-top:4px;}' +
      '.support-primary,.support-secondary{height:42px;border-radius:12px;padding:0 15px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;}' +
      '.support-primary{border:none;background:#C4362A;color:#fff;box-shadow:0 10px 22px rgba(196,54,42,.16);}' +
      '.support-primary:disabled{opacity:.62;cursor:not-allowed;box-shadow:none;}' +
      '.support-secondary{border:1.5px solid #E8DED6;background:#fff;color:#5E514E;}' +
      '.support-side{display:flex;flex-direction:column;gap:12px;}' +
      '.support-mini-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}' +
      '.support-mini-card{background:#fff;border:1px solid #EAE4DA;border-radius:18px;padding:15px;box-shadow:0 10px 26px rgba(31,31,31,.045);}' +
      '.support-mini-head{display:flex;align-items:center;gap:9px;margin-bottom:7px;color:#1F1F1F;font-size:13px;font-weight:850;}' +
      '.support-mini-head .mi{width:30px;height:30px;border-radius:11px;background:#FCEEEE;color:#C4362A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;}' +
      '.support-mini-card p{font-size:12.5px;line-height:1.5;color:#6F6860;margin:0;}' +
      '.support-home-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}' +
      '.support-home-grid.three{grid-template-columns:repeat(3,minmax(0,1fr));}' +
      '.support-home-card{border:1px solid #EAE4DA;background:#fff;border-radius:20px;padding:18px;text-align:left;box-shadow:0 14px 34px rgba(31,31,31,.055);cursor:pointer;display:flex;flex-direction:column;gap:9px;font-family:inherit;color:#1F1F1F;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease;}' +
      '.support-home-card:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(31,31,31,.08);border-color:#E4D6CF;background:#FFFEFC;}' +
      '.support-home-card.primary{background:linear-gradient(135deg,#FFFFFF 0%,#FFF8F6 100%);}' +
      '.support-home-icon{width:38px;height:38px;border-radius:14px;background:#FCEEEE;color:#C4362A;display:inline-flex;align-items:center;justify-content:center;font-size:20px;}' +
      '.support-home-title{font-size:17px;font-weight:850;color:#1F1F1F;line-height:1.2;}' +
      '.support-home-copy{font-size:13px;line-height:1.5;color:#6F6860;max-width:420px;}' +
      '.support-home-action{margin-top:4px;color:#C4362A;font-size:12.5px;font-weight:850;}' +
      '.support-guide-list{display:grid;gap:10px;margin:12px 0 16px;}' +
      '.support-guide-item{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;border:1px solid #EAE4DA;border-radius:15px;padding:11px;background:#FFFEFC;}' +
      '.support-guide-item>.mi{width:34px;height:34px;border-radius:12px;background:#F7F1E8;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:18px;}' +
      '.support-guide-item strong{display:block;font-size:13px;color:#1F1F1F;margin-bottom:2px;}' +
      '.support-guide-item small{display:block;font-size:11.8px;color:#6F6860;line-height:1.35;}' +
      '.support-guide-item em{font-style:normal;font-size:11px;font-weight:800;color:#9A8F88;background:#F7F1E8;border-radius:999px;padding:5px 8px;white-space:nowrap;}' +
      '.support-guide-detail{margin-top:14px;border:1px solid #EAE4DA;background:linear-gradient(135deg,#FFFFFF 0%,#FFFCFB 100%);border-radius:18px;padding:16px;box-shadow:0 10px 26px rgba(31,31,31,.045);}' +
      '.support-guide-detail h3{font-size:15px;font-weight:850;color:#1F1F1F;margin:0 0 5px;}' +
      '.support-guide-detail p{font-size:12.5px;line-height:1.5;color:#6F6860;margin:0 0 12px;}' +
      '.support-guide-fields{display:grid;gap:10px;}' +
      '.support-guide-field{display:grid;grid-template-columns:minmax(170px,.34fr) minmax(0,1fr);gap:14px;align-items:start;border:1px solid #F0E7E1;background:linear-gradient(135deg,#FFFFFF 0%,#FFFCF8 100%);border-radius:15px;padding:13px;font-size:12.8px;line-height:1.52;box-shadow:0 8px 20px rgba(31,31,31,.035);}' +
      '.support-guide-field strong{color:#1F1F1F;font-size:12.8px;font-weight:850;line-height:1.28;}' +
      '.support-guide-field span{color:#625A55;}' +
      '.help-hero{background:linear-gradient(135deg,#FFFFFF 0%,#FCF8F2 58%,#FFF4F1 100%);border:1px solid #E8DED6;border-radius:24px;padding:24px;box-shadow:0 18px 44px rgba(31,31,31,.07);position:relative;overflow:hidden;display:grid;gap:18px;}' +
      '.help-hero::before{content:"";position:absolute;left:0;top:20px;bottom:20px;width:4px;border-radius:999px;background:#C4362A;}' +
      '.help-hero-main{max-width:760px;}' +
      '.help-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;}' +
      '.help-search{height:48px;border:1.5px solid #E4D6CF;background:#fff;border-radius:15px;padding:0 15px;font:inherit;font-size:14px;color:#1F1F1F;outline:none;box-shadow:0 10px 24px rgba(31,31,31,.045);}' +
      '.help-search:focus{border-color:#C4362A;box-shadow:0 0 0 4px rgba(196,54,42,.08),0 10px 24px rgba(31,31,31,.045);}' +
      '.help-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:4px;}' +
      '.help-section-head h2{font-size:20px;font-weight:850;color:#1F1F1F;line-height:1.18;margin:0 0 4px;}' +
      '.help-section-head p{font-size:13.5px;line-height:1.5;color:#6F6860;margin:0;}' +
      '.help-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;}' +
      '.help-category-card{border:1px solid #EAE4DA;background:#fff;border-radius:20px;padding:16px;text-align:left;box-shadow:0 14px 34px rgba(31,31,31,.052);cursor:pointer;display:flex;flex-direction:column;gap:10px;font-family:inherit;color:#1F1F1F;min-height:174px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease;}' +
      '.help-category-card:hover{transform:translateY(-2px);box-shadow:0 18px 44px rgba(31,31,31,.08);border-color:#E2D1CA;background:#FFFEFC;}' +
      '.help-category-card[disabled]{cursor:default;}' +
      '.help-category-card[disabled]:hover{transform:none;box-shadow:0 14px 34px rgba(31,31,31,.052);border-color:#EAE4DA;background:#fff;}' +
      '.help-category-icon{width:38px;height:38px;border-radius:14px;background:#FCEEEE;color:#C4362A;display:inline-flex;align-items:center;justify-content:center;font-size:20px;}' +
      '.help-category-title{font-size:15px;font-weight:850;color:#1F1F1F;line-height:1.2;}' +
      '.help-category-copy{font-size:12.5px;line-height:1.45;color:#6F6860;margin:0;flex:1;}' +
      '.help-category-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px;}' +
      '.help-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 8px;font-size:10.5px;font-weight:850;background:#F4FAF7;color:#1E7A50;white-space:nowrap;}' +
      '.help-badge.soon{background:#F7F1E8;color:#8A6F5A;}' +
      '.help-count{font-size:11px;font-weight:750;color:#8A7E7C;white-space:nowrap;}' +
      '.help-guide-panel{display:none;border:1px solid #E6DAD3;background:linear-gradient(135deg,#FFFFFF 0%,#FFFCF8 56%,#FFF5F2 100%);border-radius:24px;padding:20px;box-shadow:0 18px 44px rgba(31,31,31,.07);position:relative;overflow:hidden;}' +
      '.help-guide-panel::before{content:"";position:absolute;left:0;top:20px;bottom:20px;width:4px;border-radius:999px;background:#C4362A;}' +
      '.help-guide-panel.open{display:block;}' +
      '.help-guide-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;padding-left:4px;}' +
      '.help-guide-panel h3{font-size:20px;font-weight:850;color:#1F1F1F;margin:0 0 6px;line-height:1.18;}' +
      '.help-guide-panel p{font-size:13.5px;line-height:1.55;color:#6F6860;margin:0;max-width:760px;}' +
      '.help-submodule-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;}' +
      '.help-submodule-card{border:1px solid #EAE4DA;background:#fff;border-radius:18px;padding:15px;text-align:left;font-family:inherit;cursor:pointer;box-shadow:0 12px 28px rgba(31,31,31,.05);display:grid;grid-template-columns:38px 1fr;gap:12px;align-items:flex-start;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background .16s ease;}' +
      '.help-submodule-card:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(31,31,31,.08);border-color:#E2D1CA;background:#FFFEFC;}' +
      '.help-submodule-card .mi{width:38px;height:38px;border-radius:14px;background:linear-gradient(135deg,#FCEEEE 0%,#FFF7F4 100%);color:#C4362A;display:inline-flex;align-items:center;justify-content:center;font-size:19px;}' +
      '.help-submodule-card strong{display:block;color:#1F1F1F;font-size:14px;margin-bottom:4px;line-height:1.22;}' +
      '.help-submodule-card span:not(.mi){display:block;color:#6F6860;font-size:12.7px;line-height:1.46;}' +
      '.support-ticket-id{margin-top:12px;border:1px solid #D7EBDD;background:#F4FAF7;color:#245A49;border-radius:14px;padding:12px;font-size:13px;line-height:1.45;display:none;}' +
      '.support-ticket-id strong{display:block;color:#1E4D3F;font-size:13.5px;margin-bottom:2px;}' +
      '.support-ticket-list{display:grid;gap:10px;}' +
      '.support-ticket-card{border:1px solid #EAE4DA;background:#FFFEFC;border-radius:16px;padding:13px;display:grid;gap:8px;}' +
      '.support-ticket-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}' +
      '.support-ticket-code{font-size:11px;font-weight:850;color:#C4362A;letter-spacing:.045em;text-transform:uppercase;margin-bottom:3px;}' +
      '.support-ticket-subject{font-size:14px;font-weight:850;color:#1F1F1F;line-height:1.25;}' +
      '.support-ticket-message{font-size:12.5px;line-height:1.45;color:#6F6860;margin:0;}' +
      '.support-ticket-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:11.5px;color:#7A6E68;}' +
      '.support-ticket-pill{display:inline-flex;align-items:center;border:1px solid #EAE4DA;border-radius:999px;background:#fff;padding:5px 8px;font-weight:750;}' +
      '.support-ticket-status{display:inline-flex;align-items:center;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:850;white-space:nowrap;background:#FFF4F2;color:#C4362A;}' +
      '.support-ticket-status.done{background:#F4FAF7;color:#1E7A50;}' +
      '.support-empty{border:1px dashed #E0D4CD;border-radius:18px;padding:18px;text-align:center;background:#FFFEFC;color:#6F6860;font-size:13px;line-height:1.45;}' +
      '.support-empty strong{display:block;color:#1F1F1F;font-size:15px;margin-bottom:4px;}' +
      '@media(max-width:1020px){.help-category-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.help-search-row{grid-template-columns:1fr;}.help-search-row .support-primary,.help-search-row .support-secondary{width:100%;}}' +
      '@media(max-width:860px){.support-page{padding:18px 14px;}.support-hero,.help-hero{grid-template-columns:1fr;padding:18px;}.support-title{font-size:22px;}.support-layout,.support-home-grid,.support-home-grid.three,.help-category-grid,.help-submodule-grid{grid-template-columns:1fr;}.support-grid{grid-template-columns:1fr;}.support-actions{flex-direction:column-reverse;}.support-primary,.support-secondary{width:100%;}.support-guide-item{grid-template-columns:34px 1fr;}.support-guide-item em{grid-column:2;justify-self:start;}.support-guide-field{grid-template-columns:1fr;gap:3px;}.support-ticket-top{flex-direction:column;}.support-ticket-status{align-self:flex-start;}.help-section-head{align-items:flex-start;flex-direction:column;}.help-guide-panel-head{flex-direction:column;}}' +
    '</style>';
  }

  function render(sub) {
    if (sub === 'chamado') return renderTicket();
    if (sub === 'chamados') return renderTickets();
    if (sub === 'guias') return renderGuides();
    return renderCentral();
  }

  function renderCentral() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '' +
      '<div class="support-page">' +
        _baseStyles() +
        '<section class="support-hero">' +
          '<div>' +
            '<div class="support-kicker">Central de Ajuda</div>' +
            '<h1 class="support-title">Como podemos ajudar?</h1>' +
            '<p class="support-subtitle">Encontre orientações para usar o BocaFood ou abra um chamado quando precisar falar com a equipe de suporte.</p>' +
          '</div>' +
          '<div class="support-hero-badge"><span class="mi">help</span><span>Ajuda e suporte</span></div>' +
        '</section>' +
        '<section class="support-home-grid three">' +
          '<button class="support-home-card" type="button" onclick="Router.navigate(\'suporte/guias\')">' +
            '<span class="support-home-icon mi">menu_book</span>' +
            '<span class="support-home-title">Guias de uso</span>' +
            '<span class="support-home-copy">Veja, aos poucos, instruções práticas para usar cada módulo do BocaFood.</span>' +
            '<span class="support-home-action">Ver guias</span>' +
          '</button>' +
          '<button class="support-home-card" type="button" onclick="Router.navigate(\'suporte/chamados\')">' +
            '<span class="support-home-icon mi">confirmation_number</span>' +
            '<span class="support-home-title">Meus chamados</span>' +
            '<span class="support-home-copy">Acompanhe os chamados enviados por esta conta e veja o status de cada solicitação.</span>' +
            '<span class="support-home-action">Ver chamados</span>' +
          '</button>' +
          '<button class="support-home-card primary" type="button" onclick="Router.navigate(\'suporte/chamado\')">' +
            '<span class="support-home-icon mi">support_agent</span>' +
            '<span class="support-home-title">Abrir chamado</span>' +
            '<span class="support-home-copy">Envie uma solicitação para o suporte quando precisar de ajuda com sua conta ou sistema.</span>' +
            '<span class="support-home-action">Abrir chamado</span>' +
          '</button>' +
        '</section>' +
        '<section class="support-mini-row">' +
          '<div class="support-mini-card"><div class="support-mini-head"><span class="mi">lock</span><span>Segurança</span></div><p>O BocaFood nunca pede senha por e-mail, chamado ou mensagem.</p></div>' +
          '<div class="support-mini-card"><div class="support-mini-head"><span class="mi">mail</span><span>Contato direto</span></div><p>Se preferir, escreva para <strong>teajudo@bocafood.app</strong> usando o e-mail da conta.</p></div>' +
        '</section>' +
      '</div>';
  }

  function renderGuides() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '' +
      '<div class="support-page">' +
        _baseStyles() +
        '<section class="help-hero">' +
          '<div class="help-hero-main">' +
            '<div class="support-kicker">Central de Ajuda</div>' +
            '<h1 class="support-title">Como podemos ajudar?</h1>' +
            '<p class="support-subtitle">Guias rápidos para configurar sua loja, entender cada módulo e resolver dúvidas no BocaFood.</p>' +
          '</div>' +
          '<div class="help-search-row">' +
            '<input id="help-search" class="help-search" type="search" placeholder="Buscar ajuda no BocaFood..." oninput="Modules.Suporte._filterGuides(this.value)">' +
            '<button class="support-secondary" type="button" onclick="Modules.Suporte._openGuideModule(\'primeiros-passos\')">Ver primeiros passos</button>' +
            '<button class="support-primary" type="button" onclick="Router.navigate(\'suporte/chamado\')"><span class="mi">support_agent</span>Abrir chamado</button>' +
          '</div>' +
        '</section>' +
        '<section id="help-module-head" class="help-section-head">' +
          '<div>' +
            '<h2>Escolha por onde começar</h2>' +
            '<p>Acesse os guias pelo módulo que você está usando agora.</p>' +
          '</div>' +
        '</section>' +
        '<section id="help-category-grid" class="help-category-grid">' +
          _guideCategoryCard('primeiros-passos', 'rocket_launch', 'Primeiros passos', 'Comece pelo essencial: revise seu acesso, complete os dados principais da loja e saiba o que fazer antes de publicar.', 'Disponível', '1 guia', true) +
          _guideCategoryCard('configuracoes', 'settings', 'Configurações', 'Entenda como preencher Geral e Usuário sem misturar dados da loja, dados fiscais e dados da pessoa responsável pela conta.', 'Disponível', '2 guias', true) +
          _guideCategoryCard('loja-online', 'storefront', 'Loja Online', 'Vai reunir orientações sobre aparência da loja, link público, publicação, avaliações e informações que aparecem para seus clientes.', 'Em breve', '', false) +
          _guideCategoryCard('cardapio', 'restaurant_menu', 'Cardápio', 'Vai explicar como organizar produtos, categorias, fotos, preços, fichas técnicas e custos sem misturar cadastro com controle financeiro.', 'Em breve', '', false) +
          _guideCategoryCard('pedidos', 'receipt_long', 'Pedidos', 'Vai mostrar como acompanhar pedidos recebidos, entender status e manter a operação organizada durante o atendimento.', 'Em breve', '', false) +
          _guideCategoryCard('financeiro', 'payments', 'Financeiro', 'Vai ajudar você a registrar entradas, saídas, contas e olhar o dinheiro do negócio de forma simples.', 'Em breve', '', false) +
          _guideCategoryCard('acoes-vendas', 'local_offer', 'Ações de vendas', 'Vai explicar promoções, combos, upsell e campanhas para vender melhor sem precisar configurar tudo de uma vez.', 'Em breve', '', false) +
          _guideCategoryCard('suporte', 'support_agent', 'Suporte', 'Use quando não conseguir resolver sozinha. Você pode abrir um chamado e depois acompanhar o que enviou.', 'Disponível', '2 guias', true) +
        '</section>' +
        '<section id="help-guide-panel" class="help-guide-panel" aria-live="polite"></section>' +
      '</div>';
  }

  function _guideCategoryCard(key, icon, title, copy, badge, count, available) {
    return '<button class="help-category-card" type="button" data-guide-card data-guide-title="' + _esc(title.toLowerCase()) + '" data-guide-copy="' + _esc(copy.toLowerCase()) + '"' + (available ? ' onclick="Modules.Suporte._openGuideModule(\'' + key + '\')"' : ' disabled') + '>' +
      '<span class="help-category-icon mi">' + _esc(icon) + '</span>' +
      '<span class="help-category-title">' + _esc(title) + '</span>' +
      '<p class="help-category-copy">' + _esc(copy) + '</p>' +
      '<span class="help-category-meta"><span class="help-badge ' + (available ? '' : 'soon') + '">' + _esc(badge) + '</span>' + (count ? '<span class="help-count">' + _esc(count) + '</span>' : '') + '</span>' +
    '</button>';
  }

  function _submoduleCard(key, icon, title, copy, moduleKey) {
    return '<button class="help-submodule-card" type="button" onclick="Modules.Suporte._openGuide(\'' + key + '\',\'' + moduleKey + '\')">' +
      '<span class="mi">' + _esc(icon) + '</span>' +
      '<span><strong>' + _esc(title) + '</strong><span>' + _esc(copy) + '</span></span>' +
    '</button>';
  }

  function _openGuideModule(key) {
    var panel = document.getElementById('help-guide-panel');
    if (!panel) return;
    _showModuleCards(false);
    var body = '';
    if (key === 'configuracoes') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Configurações</h3><p>Escolha qual parte de Configurações você quer entender. Cada guia explica o que preencher, quando usar e qual tela abrir.</p></div>' +
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar aos módulos</button>' +
        '</div>' +
        '<div class="help-submodule-grid">' +
          _submoduleCard('configuracoes-geral', 'storefront', 'Geral', 'Dados principais da loja, contatos do negócio e informações fiscais.', 'configuracoes') +
          _submoduleCard('configuracoes-usuario', 'person', 'Usuário', 'Dados da pessoa responsável pelo acesso, WhatsApp e recuperação de senha.', 'configuracoes') +
        '</div>';
    } else if (key === 'suporte') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Suporte</h3><p>Use esta área quando precisar falar com a equipe BocaFood ou acompanhar uma solicitação enviada.</p></div>' +
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar aos módulos</button>' +
        '</div>' +
        '<div class="help-submodule-grid">' +
          _submoduleCard('suporte-abrir', 'support_agent', 'Abrir chamado', 'Quando usar o chamado e quais informações ajudam no atendimento.', 'suporte') +
          _submoduleCard('suporte-chamados', 'confirmation_number', 'Meus chamados', 'Como acompanhar os chamados enviados por esta conta.', 'suporte') +
        '</div>';
    } else {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Primeiros passos</h3><p>Comece por um roteiro simples antes de avançar para configurações mais detalhadas.</p></div>' +
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar aos módulos</button>' +
        '</div>' +
        '<div class="help-submodule-grid">' +
          _submoduleCard('primeiros-passos', 'rocket_launch', 'Começar pelo essencial', 'Revise usuário, complete a loja e publique apenas quando estiver pronta.', 'primeiros-passos') +
        '</div>';
    }
    panel.innerHTML = body;
    panel.classList.add('open');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _clearGuidePanel() {
    var panel = document.getElementById('help-guide-panel');
    if (!panel) return;
    panel.classList.remove('open');
    panel.innerHTML = '';
    _showModuleCards(true);
    var grid = document.getElementById('help-category-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _showModuleCards(show) {
    var grid = document.getElementById('help-category-grid');
    var head = document.getElementById('help-module-head');
    if (grid) grid.style.display = show ? '' : 'none';
    if (head) head.style.display = show ? '' : 'none';
  }

  function _guideBackButtons(moduleKey, routeLabel, route) {
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button class="support-secondary" type="button" onclick="Modules.Suporte._openGuideModule(\'' + _esc(moduleKey || 'primeiros-passos') + '\')">Voltar aos guias</button>' +
      '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar aos módulos</button>' +
      (route ? '<button class="support-secondary" type="button" onclick="Router.navigate(\'' + _esc(route) + '\')">' + _esc(routeLabel || 'Abrir tela') + '</button>' : '') +
    '</div>';
  }

  function _openGuide(key, moduleKey) {
    var panel = document.getElementById('help-guide-panel');
    if (!panel) return;
    var body = '';
    if (key === 'configuracoes-usuario') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Configurações → Usuário</h3><p>Esta tela fala sobre a pessoa que entra no Centro de Controle. Ela não muda o nome da loja nem os dados comerciais do negócio; serve para identificar quem administra a conta, receber avisos importantes e recuperar o acesso quando necessário.</p></div>' +
          _guideBackButtons(moduleKey || 'configuracoes', 'Abrir Usuário', 'configuracoes/conta_usuario') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>Seu nome completo</strong><span>Preencha com o nome da pessoa que administra a conta. Esse campo é sobre você, não sobre a loja. Não coloque aqui o nome do negócio, nome comercial, marca ou nome do cardápio.</span></div>' +
          '<div class="support-guide-field"><strong>Como você quer ser chamada?</strong><span>Use um nome curto ou nome social. Esse nome ajuda a identificar melhor o usuário dentro da conta.</span></div>' +
          '<div class="support-guide-field"><strong>E-mail de acesso</strong><span>É o e-mail usado para entrar no Centro de Controle. Por segurança, ele aparece bloqueado. Se você precisa trocar o e-mail, abra um chamado ou fale com o suporte para a equipe orientar a mudança corretamente.</span></div>' +
          '<div class="support-guide-field"><strong>Enviar link para redefinir senha</strong><span>Use esse botão se esqueceu a senha ou quer criar uma nova. O BocaFood envia um link para o e-mail de acesso. Depois é só abrir o e-mail, clicar no link e cadastrar a nova senha.</span></div>' +
          '<div class="support-guide-field"><strong>WhatsApp de contato</strong><span>Informe um número onde você consiga receber avisos importantes da conta. Ele pode ser usado para suporte, segurança e comunicação sobre o acesso. Não é o WhatsApp público da loja para pedidos.</span></div>' +
          '<div class="support-guide-field"><strong>Salvar alterações</strong><span>Depois de mudar nome, nome curto ou WhatsApp, clique em Salvar alterações. Se sair da tela sem salvar, as mudanças podem não ficar guardadas.</span></div>' +
        '</div>';
    } else if (key === 'configuracoes-geral') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Configurações → Geral</h3><p>A aba Geral reúne os dados principais da loja e do negócio. Use esta tela para revisar como sua marca aparece, quais contatos a loja usa e quais informações fiscais identificam o negócio.</p></div>' +
          _guideBackButtons(moduleKey || 'configuracoes', 'Abrir Geral', 'configuracoes/geral') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>Perfil do negócio</strong><span>Esta parte mostra os dados básicos da marca. Pense nela como a ficha principal da sua loja: o nome que aparece para clientes, uma apresentação curta e a imagem que identifica o negócio.</span></div>' +
          '<div class="support-guide-field"><strong>Logo da marca</strong><span>Envie uma imagem quadrada e nítida, de preferência com boa leitura em tamanho pequeno. Evite fotos muito largas, imagens com muito texto ou artes que fiquem difíceis de entender quando aparecem menores.</span></div>' +
          '<div class="support-guide-field"><strong>Nome comercial</strong><span>Preencha com o nome que seus clientes reconhecem. Pode ser o nome da marca, do delivery, da confeitaria, da marmitaria ou do negócio como você divulga nas redes sociais. Não precisa ser o nome fiscal.</span></div>' +
          '<div class="support-guide-field"><strong>Nome fiscal</strong><span>Use o nome usado em documentos fiscais. Se você trabalha como autónoma, normalmente será seu nome completo. Se for empresa, use a denominação social. Esse campo não precisa ser bonito para divulgação; ele precisa estar correto para identificação do negócio.</span></div>' +
          '<div class="support-guide-field"><strong>Apresentação curta</strong><span>Escreva uma frase simples dizendo o que você vende. Não precisa parecer anúncio. O ideal é que uma pessoa entenda rapidamente sua especialidade, por exemplo: comida caseira por encomenda, bolos artesanais, marmitas da semana ou doces para eventos.</span></div>' +
          '<div class="support-guide-field"><strong>Contato e preferências</strong><span>Use esta parte para separar os contatos da loja. Esses contatos são do negócio e podem aparecer em atendimento, comunicação ou organização da loja. Eles são diferentes dos dados pessoais do usuário responsável.</span></div>' +
          '<div class="support-guide-field"><strong>Telefone da loja</strong><span>Informe um telefone de atendimento da loja, se você usa esse canal. Pode ser fixo ou móvel. Se sua loja atende apenas por WhatsApp, ainda assim deixe claro qual número deve ser usado para cada canal.</span></div>' +
          '<div class="support-guide-field"><strong>WhatsApp da loja</strong><span>Informe o WhatsApp usado para pedidos ou atendimento da loja. Este não é o WhatsApp pessoal da pessoa responsável pela conta. Se você usa um número público para clientes, ele deve ficar aqui.</span></div>' +
          '<div class="support-guide-field"><strong>E-mail de contato</strong><span>Use um e-mail que clientes possam usar para falar com a loja. Pode ser um e-mail simples de atendimento. Evite colocar aqui um e-mail que você não costuma acompanhar.</span></div>' +
          '<div class="support-guide-field"><strong>E-mail administrativo/fiscal</strong><span>Use o e-mail mais adequado para documentos, assuntos da conta e comunicações importantes. Pode ser o mesmo e-mail de contato, se você centraliza tudo em uma caixa de entrada.</span></div>' +
          '<div class="support-guide-field"><strong>Dados fiscais do negócio</strong><span>Esta parte identifica o negócio para documentos e regras fiscais. Preencha com atenção, principalmente se você trabalha no mercado espanhol, porque os nomes e documentos podem variar entre autónomo e empresa.</span></div>' +
          '<div class="support-guide-field"><strong>Documento fiscal</strong><span>Na Espanha, pode ser NIF, NIE ou CIF, conforme o seu caso. Escreva o documento como você usa em dados legais e faturas. Se tiver dúvida sobre qual documento usar, confirme antes de salvar.</span></div>' +
          '<div class="support-guide-field"><strong>Endereço fiscal</strong><span>Digite o endereço usado nos dados fiscais do negócio. Comece digitando a rua e escolha uma opção da lista quando aparecer. Depois revise número, bairro/zona, localidade, província, código postal e país.</span></div>' +
          '<div class="support-guide-field"><strong>País fiscal</strong><span>Esse campo mostra o país fiscal aplicado à conta. Se ele não estiver correto, fale com o suporte antes de continuar configurando dados fiscais.</span></div>' +
          '<div class="support-guide-field"><strong>Salvar alterações</strong><span>Depois de revisar os dados, clique em Salvar alterações. Se você trocar de tela antes de salvar, as mudanças podem não ficar guardadas.</span></div>' +
        '</div>';
    } else if (key === 'suporte-abrir') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Suporte → Abrir chamado</h3><p>Use o chamado quando tiver dúvida, erro, bloqueio ou uma configuração que precise da equipe BocaFood.</p></div>' +
          _guideBackButtons(moduleKey || 'suporte', 'Abrir chamado', 'suporte/chamado') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>Quando abrir um chamado</strong><span>Abra um chamado quando não conseguir seguir sozinha, quando aparecer uma mensagem de erro ou quando precisar que a equipe BocaFood revise algo da sua conta.</span></div>' +
          '<div class="support-guide-field"><strong>O que escrever</strong><span>Explique em qual tela você estava, o que tentou fazer e o que apareceu. Quanto mais claro for o relato, mais fácil será entender o problema.</span></div>' +
          '<div class="support-guide-field"><strong>O que não enviar</strong><span>Não envie senha, dados de cartão, códigos secretos ou informações sensíveis. A equipe BocaFood nunca precisa da sua senha para ajudar.</span></div>' +
        '</div>';
    } else if (key === 'suporte-chamados') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Suporte → Meus chamados</h3><p>Esta tela mostra os chamados enviados por esta conta para você acompanhar o que já foi solicitado.</p></div>' +
          _guideBackButtons(moduleKey || 'suporte', 'Abrir Meus chamados', 'suporte/chamados') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>Histórico de chamados</strong><span>Veja as solicitações registradas pela conta. Isso ajuda a lembrar o que já foi enviado e evita repetir o mesmo pedido.</span></div>' +
          '<div class="support-guide-field"><strong>Status</strong><span>O status indica se o chamado ainda está aberto, em andamento ou concluído. Se precisar complementar uma informação, abra um novo chamado citando o assunto anterior.</span></div>' +
        '</div>';
    } else {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Primeiros passos</h3><p>Se você acabou de entrar no BocaFood, comece revisando o acesso e os dados principais da loja. Depois avance para cardápio, atendimento e publicação.</p></div>' +
          _guideBackButtons(moduleKey || 'primeiros-passos', 'Abrir Usuário', 'configuracoes/conta_usuario') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>1. Revise seu usuário</strong><span>Entre em Configurações → Usuário e confirme seu nome, o nome curto, o e-mail de acesso e o WhatsApp de contato. Esses dados ajudam o BocaFood a falar com a pessoa certa quando houver aviso, suporte ou segurança.</span></div>' +
          '<div class="support-guide-field"><strong>2. Complete sua loja</strong><span>Depois revise os dados da loja, como nome, cidade de atendimento, cardápio e aparência. Esses dados são diferentes dos dados do usuário: eles aparecem ou influenciam a operação da sua loja.</span></div>' +
          '<div class="support-guide-field"><strong>3. Publique só quando estiver pronta</strong><span>Antes de publicar, confira se há pelo menos produtos, categorias, canal de pedido e informações principais. Se algo estiver faltando, o sistema pode impedir a publicação para evitar uma loja incompleta.</span></div>' +
          '<div class="support-guide-field"><strong>4. Peça ajuda quando travar</strong><span>Se você não souber o que preencher, se aparecer uma mensagem que não entendeu ou se algo parecer errado, use Abrir chamado. Explique em qual tela estava e o que tentou fazer.</span></div>' +
        '</div>';
    }
    panel.innerHTML = body;
    panel.classList.add('open');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _filterGuides(value) {
    var q = String(value || '').trim().toLowerCase();
    _showModuleCards(true);
    document.querySelectorAll('[data-guide-card]').forEach(function (card) {
      var haystack = [card.getAttribute('data-guide-title'), card.getAttribute('data-guide-copy')].join(' ');
      card.style.display = !q || haystack.indexOf(q) >= 0 ? '' : 'none';
    });
    var panel = document.getElementById('help-guide-panel');
    if (panel && q) {
      panel.classList.remove('open');
      panel.innerHTML = '';
    }
  }

  function renderTickets() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '' +
      '<div class="support-page">' +
        _baseStyles() +
        '<section class="support-hero">' +
          '<div>' +
            '<div class="support-kicker">Central de Ajuda</div>' +
            '<h1 class="support-title">Meus chamados</h1>' +
            '<p class="support-subtitle">Acompanhe os chamados enviados por esta conta. As respostas ainda serão feitas pelo e-mail informado no chamado.</p>' +
          '</div>' +
          '<div class="support-hero-badge"><span class="mi">confirmation_number</span><span>Acompanhamento</span></div>' +
        '</section>' +
        '<section class="support-card">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">' +
            '<div><h2 class="support-card-title">Histórico de chamados</h2><p class="support-card-copy" style="margin-bottom:0;">Listando solicitações registradas para esta conta.</p></div>' +
            '<button class="support-primary" type="button" onclick="Router.navigate(\'suporte/chamado\')"><span class="mi">add</span>Novo chamado</button>' +
          '</div>' +
          '<div id="support-ticket-list" class="support-ticket-list"><div class="support-empty"><strong>Carregando chamados...</strong>Buscando solicitações desta conta.</div></div>' +
          '<div class="support-actions"><button class="support-secondary" type="button" onclick="Router.navigate(\'suporte\')">Voltar à Central</button></div>' +
        '</section>' +
      '</div>';
    _loadTickets();
  }

  function renderTicket() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '' +
      '<div class="support-page">' +
        _baseStyles() +
        '<section class="support-hero">' +
          '<div>' +
            '<div class="support-kicker">Suporte BocaFood</div>' +
            '<h1 class="support-title">Abrir chamado</h1>' +
            '<p class="support-subtitle">Conte o que aconteceu com o máximo de contexto possível. A equipe BocaFood recebe as informações da sua conta junto com o chamado para ajudar com mais precisão.</p>' +
          '</div>' +
          '<div class="support-hero-badge"><span class="mi">support_agent</span><span>Atendimento pelo suporte</span></div>' +
        '</section>' +
        '<section class="support-layout">' +
          '<div class="support-card">' +
            '<h2 class="support-card-title">Novo chamado</h2>' +
            '<p class="support-card-copy">Use este formulário para dúvidas, erros, bloqueios ou ajustes que precisem da equipe BocaFood.</p>' +
            '<form class="support-form" id="support-ticket-form">' +
              '<div class="support-grid">' +
                '<label class="support-field"><span class="support-label">Tipo de ajuda</span><select class="support-select" id="support-type">' +
                  '<option value="duvida">Dúvida sobre o sistema</option>' +
                  '<option value="erro">Erro ou comportamento inesperado</option>' +
                  '<option value="configuracao">Ajuda com configuração</option>' +
                  '<option value="acesso">Acesso ou conta</option>' +
                  '<option value="cobranca">Plano ou cobrança</option>' +
                  '<option value="outro">Outro assunto</option>' +
                '</select></label>' +
                '<label class="support-field"><span class="support-label">Prioridade</span><select class="support-select" id="support-priority">' +
                  '<option value="normal">Normal</option>' +
                  '<option value="alta">Alta</option>' +
                  '<option value="critica">Crítica, estou bloqueada</option>' +
                '</select></label>' +
                '<label class="support-field full"><span class="support-label">Assunto</span><input class="support-input" id="support-subject" maxlength="120" placeholder="Ex.: Não consigo publicar minha loja"></label>' +
                '<label class="support-field full"><span class="support-label">Mensagem</span><textarea class="support-textarea" id="support-message" maxlength="2200" placeholder="Descreva o que você tentou fazer, o que apareceu na tela e onde isso aconteceu."></textarea><span class="support-help">Não envie senhas, tokens, dados de cartão ou informações sensíveis.</span></label>' +
                '<label class="support-field"><span class="support-label">E-mail para retorno</span><input class="support-input" id="support-email" type="email" placeholder="seu@email.com"></label>' +
                '<label class="support-field"><span class="support-label">WhatsApp opcional</span><input class="support-input" id="support-whatsapp" inputmode="tel" placeholder="+34 600 000 000"></label>' +
              '</div>' +
              '<div id="support-ticket-success" class="support-ticket-id"></div>' +
              '<div class="support-actions">' +
                '<button class="support-secondary" type="button" onclick="Router.navigate(\'dashboard\')">Voltar ao início</button>' +
                '<button class="support-primary" id="support-submit" type="submit"><span class="mi">send</span>Enviar chamado</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
          '<aside class="support-side">' +
            '<div class="support-mini-card"><div class="support-mini-head"><span class="mi">info</span><span>O que ajuda no atendimento</span></div><p>Informe a tela onde o problema aconteceu, a ação que você tentou fazer e se apareceu alguma mensagem de erro.</p></div>' +
            '<div class="support-mini-card"><div class="support-mini-head"><span class="mi">lock</span><span>Segurança</span></div><p>A equipe BocaFood nunca pede sua senha. Chamados devem conter apenas informações necessárias para suporte.</p></div>' +
            '<div class="support-mini-card"><div class="support-mini-head"><span class="mi">mail</span><span>Contato direto</span></div><p>Se preferir, escreva para <strong>teajudo@bocafood.app</strong> usando o mesmo e-mail da sua conta.</p></div>' +
          '</aside>' +
        '</section>' +
      '</div>';
    _prefillContact();
    var form = document.getElementById('support-ticket-form');
    if (form) form.addEventListener('submit', _submitTicket);
  }

  function _prefillContact() {
    var profile = window.Auth && Auth.getAdminProfile ? Auth.getAdminProfile() : {};
    var user = window.Auth && Auth.getUser ? Auth.getUser() : {};
    var email = document.getElementById('support-email');
    var whats = document.getElementById('support-whatsapp');
    if (email) email.value = (profile && profile.email) || (user && user.email) || '';
    if (whats) whats.value = (profile && (profile.whatsappFull || profile.whatsapp || profile.whatsappNumber)) || '';
  }

  function _esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch];
    });
  }

  function _fmtDate(value) {
    if (!value) return '';
    var d = value && typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function _statusLabel(status) {
    var map = {
      open: 'Aberto',
      pending: 'Aberto',
      in_progress: 'Em atendimento',
      waiting_user: 'Aguardando resposta',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };
    return map[status] || status || 'Aberto';
  }

  function _loadTickets() {
    var target = document.getElementById('support-ticket-list');
    if (!target) return;
    if (!window.DB || typeof DB.getAll !== 'function') {
      target.innerHTML = '<div class="support-empty"><strong>Não foi possível carregar</strong>Tente novamente em alguns instantes.</div>';
      return;
    }
    DB.getAll('support_tickets').then(function (items) {
      items = Array.isArray(items) ? items : [];
      items.sort(function (a, b) {
        var ad = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        var bd = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bd - ad;
      });
      if (!items.length) {
        target.innerHTML = '<div class="support-empty"><strong>Nenhum chamado ainda</strong>Quando você abrir um chamado, ele aparecerá aqui para acompanhamento.</div>';
        return;
      }
      target.innerHTML = items.map(function (ticket) {
        var status = ticket.status || 'open';
        var done = status === 'resolved' || status === 'closed';
        var created = _fmtDate(ticket.createdAt);
        var message = String(ticket.message || '');
        if (message.length > 180) message = message.slice(0, 177) + '...';
        return '<article class="support-ticket-card">' +
          '<div class="support-ticket-top">' +
            '<div>' +
              '<div class="support-ticket-code">' + _esc(ticket.ticketCode || ticket.id || 'Chamado') + '</div>' +
              '<div class="support-ticket-subject">' + _esc(ticket.subject || 'Sem assunto') + '</div>' +
            '</div>' +
            '<span class="support-ticket-status ' + (done ? 'done' : '') + '">' + _esc(_statusLabel(status)) + '</span>' +
          '</div>' +
          '<p class="support-ticket-message">' + _esc(message || 'Sem descrição informada.') + '</p>' +
          '<div class="support-ticket-meta">' +
            '<span class="support-ticket-pill">Tipo: ' + _esc(ticket.type || 'duvida') + '</span>' +
            '<span class="support-ticket-pill">Prioridade: ' + _esc(ticket.priority || 'normal') + '</span>' +
            (created ? '<span class="support-ticket-pill">Criado: ' + _esc(created) + '</span>' : '') +
          '</div>' +
        '</article>';
      }).join('');
    }).catch(function (err) {
      console.error('support tickets load error', err);
      target.innerHTML = '<div class="support-empty"><strong>Erro ao carregar chamados</strong>Verifique sua conexão e tente novamente.</div>';
    });
  }

  function _val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function _setSaving(on) {
    _saving = !!on;
    var btn = document.getElementById('support-submit');
    if (!btn) return;
    btn.disabled = _saving;
    btn.innerHTML = _saving ? '<span class="mi">hourglass_top</span>Enviando...' : '<span class="mi">send</span>Enviar chamado';
  }

  function _ticketCode() {
    var d = new Date();
    var date = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return 'BF-' + date + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function _submitTicket(event) {
    event.preventDefault();
    if (_saving) return;
    var subject = _val('support-subject');
    var message = _val('support-message');
    if (!subject || subject.length < 5) {
      if (window.UI && UI.toast) UI.toast('Informe um assunto para o chamado.', 'warning');
      return;
    }
    if (!message || message.length < 15) {
      if (window.UI && UI.toast) UI.toast('Descreva um pouco melhor o que aconteceu.', 'warning');
      return;
    }
    if (!window.DB || typeof DB.add !== 'function') {
      if (window.UI && UI.toast) UI.toast('Não foi possível abrir o chamado agora.', 'error');
      return;
    }
    var profile = window.Auth && Auth.getAdminProfile ? Auth.getAdminProfile() : {};
    var user = window.Auth && Auth.getUser ? Auth.getUser() : {};
    var ticketCode = _ticketCode();
    var payload = {
      ticketCode: ticketCode,
      type: _val('support-type') || 'duvida',
      priority: _val('support-priority') || 'normal',
      subject: subject,
      message: message,
      contactEmail: _val('support-email') || (user && user.email) || '',
      contactWhatsapp: _val('support-whatsapp'),
      status: 'open',
      source: 'admin_support_page',
      tenantUid: (profile && profile.tenantId) || (user && user.uid) || '',
      authUid: (user && user.uid) || '',
      accountEmail: (profile && profile.email) || (user && user.email) || '',
      storeName: (profile && (profile.storeName || profile.businessName || profile.name)) || '',
      pageUrl: location.href,
      userAgent: navigator.userAgent || ''
    };
    _setSaving(true);
    DB.add('support_tickets', payload).then(function (ref) {
      var box = document.getElementById('support-ticket-success');
      if (box) {
        box.style.display = 'block';
        box.innerHTML = '<strong>Chamado enviado: ' + ticketCode + '</strong>Guarde este código para acompanhar o atendimento. A equipe BocaFood poderá responder pelo e-mail informado.';
      }
      var form = document.getElementById('support-ticket-form');
      if (form) form.reset();
      _prefillContact();
      if (window.UI && UI.toast) UI.toast('Chamado enviado para o suporte BocaFood.', 'success');
      window.setTimeout(function () { Router.navigate('suporte/chamados'); }, 900);
    }).catch(function (err) {
      console.error('support ticket error', err);
      if (window.UI && UI.toast) UI.toast('Não foi possível enviar o chamado. Tente novamente.', 'error');
    }).finally(function () {
      _setSaving(false);
    });
  }

  function destroy() {}

  return { render: render, destroy: destroy, _openGuideModule: _openGuideModule, _openGuide: _openGuide, _clearGuidePanel: _clearGuidePanel, _filterGuides: _filterGuides };
})();
