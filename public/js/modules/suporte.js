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
      '.docs-shell{display:grid;grid-template-columns:280px minmax(0,1fr);gap:16px;align-items:start;}' +
      '.docs-sidebar{position:sticky;top:88px;background:#fff;border:1px solid #EAE4DA;border-radius:20px;box-shadow:0 14px 34px rgba(31,31,31,.055);padding:12px;display:flex;flex-direction:column;gap:7px;max-height:calc(100vh - 120px);overflow:auto;}' +
      '.docs-side-title{font-size:11px;font-weight:850;letter-spacing:.07em;text-transform:uppercase;color:#8A7E7C;padding:6px 8px 4px;}' +
      '.docs-nav-btn{border:none;background:transparent;border-radius:13px;padding:10px;text-align:left;display:grid;grid-template-columns:30px 1fr;gap:9px;align-items:start;font-family:inherit;cursor:pointer;color:#1F1F1F;transition:background .16s ease,box-shadow .16s ease,transform .16s ease;}' +
      '.docs-nav-btn:hover{background:#FFFEFC;box-shadow:0 8px 18px rgba(31,31,31,.045);transform:translateY(-1px);}' +
      '.docs-nav-btn.active{background:linear-gradient(135deg,#FFF7F2 0%,#FFFFFF 100%);box-shadow:inset 3px 0 0 #C4362A;}' +
      '.docs-nav-btn .mi{width:30px;height:30px;border-radius:11px;background:#FCEEEE;color:#C4362A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;}' +
      '.docs-nav-btn strong{display:block;font-size:12.8px;font-weight:850;color:#1F1F1F;line-height:1.2;}' +
      '.docs-nav-btn span:not(.mi){display:block;font-size:11.5px;color:#6F6860;line-height:1.32;margin-top:2px;}' +
      '.docs-content{min-width:0;display:flex;flex-direction:column;gap:14px;}' +
      '.docs-panel{background:#fff;border:1px solid #EAE4DA;border-radius:22px;box-shadow:0 14px 34px rgba(31,31,31,.055);padding:20px;}' +
      '.docs-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px;}' +
      '.docs-panel h2{font-size:23px;font-weight:850;color:#1F1F1F;line-height:1.12;margin:0 0 6px;}' +
      '.docs-panel p{font-size:13.5px;line-height:1.56;color:#6F6860;margin:0;}' +
      '.docs-topic-list{display:grid;gap:10px;}' +
      '.docs-topic{border:1px solid #EFE6DA;background:linear-gradient(135deg,#FFFFFF 0%,#FFFCF8 100%);border-radius:16px;padding:14px;display:grid;gap:8px;}' +
      '.docs-topic h3{font-size:14px;font-weight:850;color:#1F1F1F;margin:0;line-height:1.25;}' +
      '.docs-topic ul{margin:0;padding-left:18px;color:#625A55;font-size:12.8px;line-height:1.52;}' +
      '.docs-topic li{margin:4px 0;}' +
      '.docs-section-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0;}' +
      '.docs-section-card{border:1px solid #EFE6DA;background:#FFFEFC;border-radius:15px;padding:12px;display:grid;grid-template-columns:30px 1fr;gap:9px;align-items:start;}' +
      '.docs-section-card .mi{width:30px;height:30px;border-radius:11px;background:#F7F1E8;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;}' +
      '.docs-section-card strong{display:block;color:#1F1F1F;font-size:12.8px;font-weight:850;line-height:1.25;}' +
      '.docs-section-card span:not(.mi){display:block;color:#6F6860;font-size:12px;line-height:1.42;margin-top:3px;}' +
      '.docs-section-status{display:inline-flex;width:max-content;margin-top:7px;border-radius:999px;background:#F7F1E8;color:#8A6F5A;font-size:10.5px;font-weight:850;padding:5px 8px;}' +
      '.docs-tag-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;}' +
      '.docs-tag{display:inline-flex;align-items:center;border-radius:999px;background:#F7F1E8;color:#7A6352;font-size:11px;font-weight:800;padding:6px 9px;}' +
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
      '@media(max-width:860px){.support-page{padding:18px 14px;}.support-hero,.help-hero{grid-template-columns:1fr;padding:18px;}.support-title{font-size:22px;}.support-layout,.support-home-grid,.support-home-grid.three,.help-category-grid,.help-submodule-grid,.docs-shell,.docs-section-grid{grid-template-columns:1fr;}.docs-sidebar{position:relative;top:auto;max-height:none;}.support-grid{grid-template-columns:1fr;}.support-actions{flex-direction:column-reverse;}.support-primary,.support-secondary{width:100%;}.support-guide-item{grid-template-columns:34px 1fr;}.support-guide-item em{grid-column:2;justify-self:start;}.support-guide-field{grid-template-columns:1fr;gap:3px;}.support-ticket-top{flex-direction:column;}.support-ticket-status{align-self:flex-start;}.help-section-head{align-items:flex-start;flex-direction:column;}.help-guide-panel-head{flex-direction:column;}}' +
    '</style>';
  }

  function render(sub) {
    if (sub === 'chamado') return renderTicket();
    if (sub === 'chamados') return renderTickets();
    if (sub === 'guias' || sub === 'documentacao') return renderDocumentation();
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
          '<button class="support-home-card" type="button" onclick="Router.navigate(\'suporte/documentacao\')">' +
            '<span class="support-home-icon mi">library_books</span>' +
            '<span class="support-home-title">Documentação</span>' +
            '<span class="support-home-copy">Consulte o que cada módulo faz, quais dados usa e como ele conversa com o resto do negócio.</span>' +
            '<span class="support-home-action">Abrir documentação</span>' +
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

  function _documentationModules() {
    return [
      {
        key: 'primeiros-passos',
        icon: 'rocket_launch',
        title: 'Primeiros passos',
        summary: 'Ordem recomendada para sair do zero e deixar o negócio pronto para vender com leitura real.',
        tags: ['começo', 'base', 'roteiro'],
        sections: [
          ['Como o sistema se organiza', 'Entender a lógica geral antes de preencher campos.', 'map'],
          ['O que configurar primeiro', 'Dados do negócio, canais, produtos, custos e rotina mínima.', 'checklist'],
          ['Primeira rota e primeira temporada', 'Como criar direção antes de começar a operar no escuro.', 'route'],
          ['Primeira venda acompanhada', 'Como compra, pedido, financeiro e estoque começam a conversar.', 'point_of_sale']
        ]
      },
      {
        key: 'base-negocio',
        icon: 'settings',
        title: 'Base do negócio',
        summary: 'Tudo que identifica a loja, a usuária, os canais, pagamentos e regras usadas como base pelos outros módulos.',
        tags: ['cadastro', 'canais', 'integrações'],
        sections: [
          ['Dados da loja', 'Nome, marca, contatos, endereço, país fiscal e apresentação.', 'storefront'],
          ['Usuária e acesso', 'Dados da pessoa responsável, WhatsApp, e-mail e segurança.', 'person'],
          ['Canais de venda', 'De onde vêm as vendas e como cada canal conversa com financeiro e relatórios.', 'hub'],
          ['Pagamentos e integrações', 'Stripe, WhatsApp, redes sociais, pixel e ferramentas externas.', 'credit_card'],
          ['Venda presencial', 'Quando ativar, como configurar e como entra na rotina.', 'point_of_sale']
        ]
      },
      {
        key: 'cardapio',
        icon: 'restaurant_menu',
        title: 'Cardápio',
        summary: 'Estrutura de produtos, categorias, preços, variações, combos, fotos, tags e regras para vender melhor.',
        tags: ['produtos', 'preço', 'venda'],
        sections: [
          ['Produtos', 'Cadastro do que a cliente compra e como aparece no pedido.', 'lunch_dining'],
          ['Categorias', 'Organização visual do cardápio e ordem de exibição.', 'category'],
          ['Preços, margem e custo', 'Como o preço conversa com regras de margem e ficha técnica.', 'payments'],
          ['Variações e combos', 'Escolhas obrigatórias, opcionais, adicionais e fotos.', 'tune'],
          ['Disponibilidade e destaque', 'Produto oculto, produto ativo, tags e selo visual.', 'sell']
        ]
      },
      {
        key: 'producao',
        icon: 'receipt_long',
        title: 'Produção',
        summary: 'Receitas, fichas técnicas, bases de produção, ordens, lotes, lista de compras e movimentações geradas.',
        tags: ['receitas', 'lote', 'estoque'],
        sections: [
          ['Receitas e fichas técnicas', 'Ingredientes, rendimento, custo previsto e unidade produzida.', 'menu_book'],
          ['Bases de produção', 'Massas, recheios e etapas intermediárias usadas em outras receitas.', 'bakery_dining'],
          ['Ordens de produção', 'Planejamento, finalização, rendimento real e leitura do lote.', 'assignment'],
          ['Lista de compras', 'Necessidade gerada por produção planejada e estoque mínimo.', 'shopping_cart'],
          ['Movimentações de produção', 'Saída de ingredientes e entrada de produto produzido.', 'sync_alt']
        ]
      },
      {
        key: 'compras',
        icon: 'shopping_cart',
        title: 'Compras',
        summary: 'Entrada de itens comprados, fornecedores, produtos/insumos, recebimento, pagamento e entrada no estoque.',
        tags: ['fornecedores', 'recebimento', 'custo'],
        sections: [
          ['Registro de compra', 'Itens, quantidades, valores, documento, pagamento e observações.', 'receipt_long'],
          ['Recebimento', 'Quando a compra vira entrada de estoque.', 'inventory'],
          ['Fornecedores', 'Dados fiscais, contato, endereço e condições comerciais.', 'store'],
          ['Produtos e insumos comprados', 'O que entra por compra e pode alimentar receitas, estoque ou venda direta.', 'inventory_2'],
          ['Financeiro da compra', 'Conta a pagar, forma de pagamento, vencimento e categoria.', 'account_balance_wallet']
        ]
      },
      {
        key: 'estoque',
        icon: 'inventory_2',
        title: 'Estoque',
        summary: 'Saldo calculado por movimentações de compra, produção, venda, ajustes e inventário.',
        tags: ['saldo', 'movimentações', 'mínimo'],
        sections: [
          ['Tipos de estoque', 'Insumo, produto pronto comprado, produto produzido e base de produção.', 'segment'],
          ['Itens em estoque', 'Saldo, unidade, valor estimado, mínimo, máximo e última movimentação.', 'inventory_2'],
          ['Movimentações', 'Entradas, saídas, ajustes, vendas, compras e produção.', 'swap_vert'],
          ['Ajustes e inventário', 'Correção manual quando a quantidade real não bate.', 'fact_check'],
          ['Reposição', 'Como mínimo, máximo e lista de compras devem orientar compras e produção.', 'notification_important']
        ]
      },
      {
        key: 'vendas-atendimento',
        icon: 'room_service',
        title: 'Vendas e atendimento',
        summary: 'Pedidos, venda manual, cozinha, cliente, entrega, pagamento, WhatsApp, baixa de estoque e financeiro.',
        tags: ['pedido', 'cozinha', 'cliente'],
        sections: [
          ['Criar pedido manual', 'Cliente, canal, produtos, entrega, pagamento, descontos e pontos.', 'add_shopping_cart'],
          ['Pedido recebido', 'Itens, escolhas, observações, status, checklist e comunicação.', 'receipt_long'],
          ['Modo cozinha', 'Leitura rápida para preparo, retirada e entrega.', 'room_service'],
          ['Clientes', 'Cadastro, endereços, preferências, histórico e avatar.', 'groups'],
          ['WhatsApp e avaliação', 'Mensagens por status e pedido de avaliação após entrega.', 'chat']
        ]
      },
      {
        key: 'financeiro',
        icon: 'payments',
        title: 'Financeiro',
        summary: 'Entradas, saídas, contas, formas de pagamento, canais, transferências, categorias e visão de saúde financeira.',
        tags: ['caixa', 'entrada', 'saída'],
        sections: [
          ['Entradas', 'Dinheiro recebido por pedidos, venda presencial, Stripe ou lançamento manual.', 'south_west'],
          ['Saídas e contas a pagar', 'Despesas, custos, vencimento, recorrência e pagamento.', 'north_east'],
          ['Fluxo de caixa', 'O que entra, sai e fica no período.', 'waterfall_chart'],
          ['Contas e transferências', 'Conta bancária, caixa físico, reforço, sangria e transferência.', 'account_balance'],
          ['Categorias financeiras', 'Despesa, custo direto, custo indireto e vínculo com Plano de Voo.', 'label']
        ]
      },
      {
        key: 'loja-online',
        icon: 'storefront',
        title: 'Loja Online',
        summary: 'Template público, identidade visual, link, SEO, atendimento, checkout, avaliações, promoções, fidelidade e carrinho.',
        tags: ['cardápio público', 'checkout', 'publicação'],
        sections: [
          ['Identidade e vitrine', 'Logo, capa, card principal, categorias e card promocional.', 'palette'],
          ['Link e publicação', 'Slug, status publicado, loja não publicada e domínio.', 'link'],
          ['Checkout', 'Entrega, retirada, endereço, pagamento, cupom, pontos e WhatsApp.', 'shopping_bag'],
          ['Avaliações', 'Página de avaliação, resenhas, carrossel e CTA.', 'star'],
          ['SEO e compartilhamento', 'Título, descrição, imagem e dados herdados.', 'travel_explore']
        ]
      },
      {
        key: 'acoes-vendas',
        icon: 'local_offer',
        title: 'Ações de Venda',
        summary: 'Promoções, cupons, upsell e pontos usados para vender mais, aumentar ticket ou trazer cliente de volta.',
        tags: ['promoção', 'cupom', 'upsell'],
        sections: [
          ['Promoções', 'Regras, produtos elegíveis, período, conflito e reflexo no pedido.', 'campaign'],
          ['Cupons', 'Código, link automático, pedido mínimo e aplicação no checkout.', 'confirmation_number'],
          ['Upsell', 'Gatilho, momento, produto sugerido, desconto e aceite da cliente.', 'add_circle'],
          ['Programa de pontos', 'Acúmulo, resgate, validade, mínimo e histórico da cliente.', 'loyalty'],
          ['Resultado das ações', 'Como vendas reais validam ou não uma ação.', 'query_stats']
        ]
      },
      {
        key: 'crescimento',
        icon: 'diamond',
        title: 'Crescimento',
        summary: 'Plano de Voo, Temporadas, Performance e Maturidade: a camada que transforma dados em direção para o negócio.',
        tags: ['plano', 'temporada', 'maturidade'],
        sections: [
          ['Plano de Voo', 'Rota anual, cenários, base de cálculo e acompanhamento.', 'flight_takeoff'],
          ['Temporadas', 'Jogadas práticas para alcançar a rota sem criar meta paralela.', 'event_available'],
          ['Performance', 'Leitura do mês contra a rota e sinais de ritmo.', 'analytics'],
          ['Maturidade', 'Evolução real do negócio, pedras, marcos e histórico.', 'diamond'],
          ['Inteligência futura', 'Como dados de vendas, clientes, ações e estoque podem alimentar decisões.', 'psychology']
        ]
      },
      {
        key: 'suporte',
        icon: 'support_agent',
        title: 'Suporte',
        summary: 'Chamados, acompanhamento e documentação para consultar antes de acionar a equipe.',
        tags: ['ajuda', 'chamado', 'documentação'],
        sections: [
          ['Documentação', 'Onde consultar o funcionamento antes de abrir chamado.', 'library_books'],
          ['Abrir chamado', 'Como explicar o problema com tela, ação feita e print.', 'support_agent'],
          ['Meus chamados', 'Como acompanhar status e retorno da equipe.', 'confirmation_number'],
          ['Segurança', 'O que nunca enviar em uma solicitação.', 'lock']
        ]
      }
    ];
  }

  function renderDocumentation() {
    var app = document.getElementById('app');
    if (!app) return;
    var modules = _documentationModules();
    app.innerHTML = '' +
      '<div class="support-page">' +
        _baseStyles() +
        '<section class="help-hero">' +
          '<div class="help-hero-main">' +
            '<div class="support-kicker">Documentação</div>' +
            '<h1 class="support-title">Documentação do sistema</h1>' +
            '<p class="support-subtitle">Esta área será construída como uma documentação padrão: escolha uma categoria principal e veja o índice dos assuntos que serão detalhados aos poucos.</p>' +
          '</div>' +
          '<div class="help-search-row">' +
            '<input id="help-search" class="help-search" type="search" placeholder="Buscar módulo ou assunto..." oninput="Modules.Suporte._filterGuides(this.value)">' +
            '<button class="support-primary" type="button" onclick="Router.navigate(\'suporte/chamado\')"><span class="mi">support_agent</span>Abrir chamado</button>' +
          '</div>' +
        '</section>' +
        '<section class="docs-shell">' +
          '<aside class="docs-sidebar" aria-label="Módulos da documentação">' +
            '<div class="docs-side-title">Documentação</div>' +
            modules.map(function (item, index) { return _docNavButton(item, index === 0); }).join('') +
          '</aside>' +
          '<main id="docs-content" class="docs-content">' + _docPanel(modules[0]) + '</main>' +
        '</section>' +
      '</div>';
  }

  function _docNavButton(item, active) {
    var sectionText = (item.sections || []).map(function (section) { return section[0] + ' ' + section[1]; }).join(' ');
    return '<button class="docs-nav-btn' + (active ? ' active' : '') + '" type="button" data-doc-nav data-doc-key="' + _esc(item.key) + '" data-guide-title="' + _esc(item.title.toLowerCase()) + '" data-guide-copy="' + _esc((item.summary + ' ' + sectionText + ' ' + (item.tags || []).join(' ')).toLowerCase()) + '" onclick="Modules.Suporte._openDocModule(\'' + _esc(item.key) + '\')">' +
      '<span class="mi">' + _esc(item.icon || 'article') + '</span>' +
      '<span><strong>' + _esc(item.title) + '</strong><span>' + _esc(item.summary) + '</span></span>' +
    '</button>';
  }

  function _docPanel(item) {
    item = item || _documentationModules()[0];
    var sections = item.sections || [];
    return '<article class="docs-panel">' +
      '<div class="docs-panel-head">' +
        '<div>' +
          '<div class="support-kicker">Categoria</div>' +
          '<h2>' + _esc(item.title) + '</h2>' +
          '<p>' + _esc(item.summary) + '</p>' +
          '<div class="docs-tag-row">' + (item.tags || []).map(function (tag) { return '<span class="docs-tag">' + _esc(tag) + '</span>'; }).join('') + '</div>' +
        '</div>' +
        '<span class="support-hero-badge"><span class="mi">' + _esc(item.icon || 'article') + '</span><span>Estrutura base</span></span>' +
      '</div>' +
      '<section class="docs-topic"><h3>Como esta documentação será organizada</h3><ul>' +
        '<li>Cada categoria principal terá seus próprios assuntos internos.</li>' +
        '<li>Cada assunto poderá ganhar passo a passo, campos explicados, conexões com outros módulos e cuidados importantes.</li>' +
        '<li>Por enquanto, esta tela cria a estrutura para a documentação ser preenchida por partes.</li>' +
      '</ul></section>' +
      '<div class="docs-section-grid">' + sections.map(function (section) {
        return '<div class="docs-section-card">' +
          '<span class="mi">' + _esc(section[2] || 'article') + '</span>' +
          '<span><strong>' + _esc(section[0]) + '</strong><span>' + _esc(section[1]) + '</span><em class="docs-section-status">A documentar</em></span>' +
        '</div>';
      }).join('') + '</div>' +
      '<div class="docs-topic-list">' + (item.topics || []).map(function (topic) {
        return '<section class="docs-topic"><h3>' + _esc(topic[0]) + '</h3><ul>' + (topic[1] || []).map(function (line) { return '<li>' + _esc(line) + '</li>'; }).join('') + '</ul></section>';
      }).join('') + '</div>' +
    '</article>';
  }

  function _openDocModule(key) {
    var modules = _documentationModules();
    var item = modules.find(function (doc) { return doc.key === key; }) || modules[0];
    var box = document.getElementById('docs-content');
    if (box) box.innerHTML = _docPanel(item);
    document.querySelectorAll('[data-doc-nav]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-doc-key') === item.key);
    });
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
          _guideCategoryCard('configuracoes', 'settings', 'Configurações', 'Entenda Geral, Usuário, Venda presencial, Integrações e Meu plano sem misturar dados da loja, acesso e assinatura.', 'Disponível', '5 guias', true) +
          _guideCategoryCard('compras', 'shopping_cart', 'Compras', 'Entenda fornecedores, produtos e insumos, registro de compras e configurações para manter custos e pagamentos organizados.', 'Disponível', '4 guias', true) +
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
          _submoduleCard('configuracoes-venda-presencial', 'point_of_sale', 'Venda presencial', 'Quando ativar a venda no balcão e como escolher a forma de pagamento padrão.', 'configuracoes') +
          _submoduleCard('configuracoes-integracoes', 'hub', 'Integrações', 'WhatsApp, redes sociais e ferramentas de medição usadas na página pública.', 'configuracoes') +
          _submoduleCard('configuracoes-plano', 'workspace_premium', 'Plano', 'Plano atual, acesso, período grátis quando existir e dados da compra na Hotmart.', 'configuracoes') +
        '</div>';
    } else if (key === 'compras') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Compras</h3><p>Use estes guias para cadastrar fornecedores, organizar produtos e insumos, registrar compras e manter os custos da loja mais fáceis de acompanhar.</p></div>' +
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar aos módulos</button>' +
        '</div>' +
        '<div class="help-submodule-grid">' +
          _submoduleCard('compras-registro', 'receipt_long', 'Registro de compras', 'Como lançar uma compra, preencher itens recebidos, documento, pagamento e contas a pagar.', 'compras') +
          _submoduleCard('compras-produtos-insumos', 'inventory_2', 'Produtos / Insumos', 'Como cadastrar itens comprados, unidade base, embalagem padrão, fornecedor e uso em receitas.', 'compras') +
          _submoduleCard('compras-fornecedores', 'storefront', 'Fornecedores', 'Como preencher dados fiscais, endereço, contato e condições de pagamento dos fornecedores.', 'compras') +
          _submoduleCard('compras-configuracoes', 'category', 'Configurações', 'Como organizar categorias e opções usadas nos cadastros e filtros de compras.', 'compras') +
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

  function _guideFields(items) {
    return '<div class="support-guide-fields">' + items.map(function (item) {
      return '<div class="support-guide-field"><strong>' + _esc(item[0]) + '</strong><span>' + _esc(item[1]) + '</span></div>';
    }).join('') + '</div>';
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
    } else if (key === 'configuracoes-venda-presencial') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Configurações → Venda presencial</h3><p>Esta tela controla se a loja terá uma área de venda feita diretamente no balcão, em evento ou em atendimento presencial. Use com cuidado: quando estiver ativada, aparece uma opção própria no menu para registrar vendas presenciais.</p></div>' +
          _guideBackButtons(moduleKey || 'configuracoes', 'Abrir Venda presencial', 'configuracoes/tpv') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>Quando ativar</strong><span>Ative a venda presencial se você também registra vendas feitas fora do pedido online, como retirada no balcão, venda em feira, evento, loja física ou atendimento direto. Se você trabalha somente com pedidos pela loja pública ou WhatsApp, pode deixar desativado por enquanto.</span></div>' +
          '<div class="support-guide-field"><strong>O que muda ao ativar</strong><span>Quando ativada, o menu Venda presencial aparece no painel. As vendas registradas ali entram separadas como canal de venda presencial, ajudando você a entender de onde vieram os pedidos e o dinheiro.</span></div>' +
          '<div class="support-guide-field"><strong>O que acontece ao desativar</strong><span>Quando desativada, o menu de venda presencial fica oculto. A loja continua funcionando com os outros canais que você já usa, como loja pública, WhatsApp ou pedidos online.</span></div>' +
          '<div class="support-guide-field"><strong>Pagamento padrão</strong><span>Escolha a forma de pagamento que costuma ser usada nesse tipo de venda. A lista vem das formas cadastradas no Financeiro. Se uma forma de pagamento não aparecer, revise primeiro Financeiro → Configurações → Formas de pagamento.</span></div>' +
          '<div class="support-guide-field"><strong>Salvar alterações</strong><span>Depois de ativar, desativar ou trocar a forma de pagamento padrão, clique em Salvar alterações. Se o menu não aparecer logo depois, atualize a página ou entre novamente no painel.</span></div>' +
        '</div>';
    } else if (key === 'configuracoes-integracoes') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Configurações → Integrações</h3><p>A aba Integrações reúne canais de contato, redes sociais e ferramentas de medição da página pública. Ela ajuda clientes a encontrarem seus canais e ajuda você a medir visitas e campanhas quando tiver os códigos configurados.</p></div>' +
          _guideBackButtons(moduleKey || 'configuracoes', 'Abrir Integrações', 'configuracoes/integracoes') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>WhatsApp</strong><span>Informe o WhatsApp público da loja, usado para contato com clientes. Esse número é diferente do WhatsApp do usuário responsável pela conta. Use aqui o número que você quer que clientes vejam e usem para falar com a loja.</span></div>' +
          '<div class="support-guide-field"><strong>Instagram, Facebook e TikTok</strong><span>Preencha os links dos canais que você realmente usa. Esses links ajudam clientes a conhecerem sua marca, verem fotos, acompanharem novidades e confirmarem que estão falando com a loja certa.</span></div>' +
          '<div class="support-guide-field"><strong>Google Analytics 4</strong><span>Use este campo se você já tem um código do Google Analytics. Ele ajuda a acompanhar visitas e comportamento na página pública. Se você ainda não usa Analytics, pode deixar em branco.</span></div>' +
          '<div class="support-guide-field"><strong>Google Tag Manager</strong><span>Use apenas se você ou alguém que cuida do seu marketing trabalha com GTM. Ele serve para organizar tags e scripts em um só lugar. Se você não conhece essa ferramenta, não precisa preencher agora.</span></div>' +
          '<div class="support-guide-field"><strong>Meta Pixel</strong><span>Use este campo quando você mede campanhas do Facebook ou Instagram com Pixel. Ele ajuda a entender resultados de anúncios. Se você não anuncia ainda, pode deixar vazio até precisar.</span></div>' +
          '<div class="support-guide-field"><strong>Salvar alterações</strong><span>Depois de preencher links ou códigos, clique em Salvar alterações. Os canais aparecem na página pública quando estiverem preenchidos corretamente.</span></div>' +
        '</div>';
    } else if (key === 'configuracoes-plano') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Configurações → Plano</h3><p>A tela Meu plano ajuda você a entender se sua conta está liberada, qual plano está associado ao acesso e onde conferir informações da compra feita pela Hotmart. Ela não altera dados da loja, dados fiscais ou forma de pagamento.</p></div>' +
          _guideBackButtons(moduleKey || 'configuracoes', 'Abrir Plano', 'configuracoes/plano') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>Plano atual</strong><span>Mostra o plano associado à sua conta BocaFood. Se a conta ainda estiver dentro do período grátis, o destaque pode mostrar os dias gratuitos restantes em vez de repetir o nome do plano.</span></div>' +
          '<div class="support-guide-field"><strong>Acesso</strong><span>Indica se sua conta está liberada para usar o Centro de Controle. Quando aparece como ativa, você pode seguir configurando a loja normalmente. Se aparecer pendente ou bloqueada, abra um chamado para a equipe verificar.</span></div>' +
          '<div class="support-guide-field"><strong>Período grátis</strong><span>Esse aviso aparece somente quando existe período grátis ativo ou quando ele terminou sem acesso liberado. Se o período grátis acabar e a Hotmart mantiver a assinatura ativa, a tela deixa de mostrar mensagens de teste grátis e passa a focar no plano ativo.</span></div>' +
          '<div class="support-guide-field"><strong>Cobrança</strong><span>Mostra o ciclo do plano quando essa informação vem da compra, como mensal ou anual. O BocaFood não mostra cartão, recibo ou lista completa de cobranças dentro do painel, porque esses detalhes ficam no ambiente da Hotmart.</span></div>' +
          '<div class="support-guide-field"><strong>Dados da compra na Hotmart</strong><span>Use esta área para lembrar que pagamentos, recibos, cartão, próxima cobrança e dados financeiros devem ser conferidos no painel da Hotmart. O BocaFood mostra apenas o necessário para indicar plano e acesso.</span></div>' +
          '<div class="support-guide-field"><strong>Quando o acesso pode mudar</strong><span>Se a Hotmart informar cancelamento, reembolso, chargeback ou atraso que bloqueie o acesso, a conta pode deixar de aparecer como ativa. Nesses casos, os dados da loja não são apagados; o acesso apenas fica limitado até regularizar.</span></div>' +
          '<div class="support-guide-field"><strong>Precisa de ajuda com seu plano?</strong><span>Use o card de ajuda quando tiver dúvida sobre acesso, assinatura, período grátis ou compra. Explique o que aparece na tela e, se possível, informe o e-mail usado na compra. Não envie senha, cartão ou dados sensíveis.</span></div>' +
        '</div>';
    } else if (key === 'compras-registro') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Compras → Registro de compras</h3><p>Use esta tela para registrar o que entrou na loja, de qual fornecedor veio, quanto custou e como o pagamento será acompanhado no financeiro.</p></div>' +
          _guideBackButtons(moduleKey || 'compras', 'Abrir Registro de compras', 'compras/registros') +
        '</div>' +
        _guideFields([
          ['Quando registrar uma compra', 'Registre uma compra quando você recebeu ou contratou algo para a loja: ingredientes, produtos prontos, embalagens, descartáveis, serviços ou qualquer gasto ligado à operação. O ideal é criar um registro por nota, recibo, pedido ou entrega para manter o histórico fácil de entender.'],
          ['Nova compra', 'Abre o formulário para lançar uma compra. Antes de começar, se possível, cadastre o fornecedor e os itens comprados. Assim o preenchimento fica mais rápido e o custo por unidade fica mais confiável.'],
          ['Fornecedor', 'Escolha quem vendeu os itens. Use a busca para encontrar o fornecedor cadastrado. Ao selecionar, o sistema consegue mostrar o nome comercial e aproveitar padrões de pagamento quando eles existirem.'],
          ['Nome comercial', 'Mostra como aquele fornecedor é conhecido no dia a dia. Esse campo ajuda você a confirmar se selecionou o fornecedor certo, principalmente quando o nome fiscal é diferente do nome usado comercialmente.'],
          ['Data da compra', 'Informe a data em que a compra aconteceu ou a data do documento recebido. Essa data ajuda a organizar o histórico e entender quando o custo foi atualizado.'],
          ['Número do documento', 'Use para guardar o número da nota, recibo, pedido, fatura ou referência do fornecedor. Se não houver documento, você pode deixar em branco ou usar uma identificação simples que ajude a reconhecer a compra depois.'],
          ['Status da compra', 'Use Pendente quando ainda falta receber ou revisar algo. Use Recebida quando a compra já entrou corretamente. Use Parcial quando só uma parte foi recebida. Use Cancelada quando o registro não deve mais entrar na organização da loja.'],
          ['Observações internas', 'Use para detalhes que ajudam você ou sua equipe: combinado com fornecedor, prazo, divergência de entrega, item substituído, valor combinado ou qualquer ponto que explique a compra.'],
          ['Itens comprados', 'Nesta parte você informa cada item recebido. Escolha o item, diga como ele veio do fornecedor, quantas embalagens vieram e qual foi o preço pago por embalagem. O sistema usa essas informações para calcular o custo real por unidade.'],
          ['Quantidade comprada', 'Informe quantas embalagens, caixas, sacos, unidades ou pacotes foram comprados. Se você comprou 3 sacos de farinha, a quantidade comprada é 3.'],
          ['Embalagem', 'Descreva como o item veio na compra: saco, caixa, garrafa, pacote, bandeja ou unidade. Esse campo ajuda a entender o preço informado e a leitura do estoque.'],
          ['Conteúdo da embalagem', 'Informe quanto vem dentro de cada embalagem. Exemplo: um saco com 5 kg, uma garrafa com 1 L ou uma caixa com 12 unidades. Esse número é usado para calcular quanto custa cada kg, litro ou unidade.'],
          ['Unidade usada no custo', 'É a unidade que o sistema usa para custo, estoque e receitas: kg, g, L, ml ou unidade. Ela vem do cadastro do item. Se estiver errada, ajuste primeiro em Produtos / Insumos.'],
          ['Preço por embalagem', 'Informe o valor pago pela embalagem inteira, não o valor por kg, litro ou unidade. Exemplo: se o saco de 5 kg custou €2,50, preencha €2,50 no preço da embalagem.'],
          ['Desconto por embalagem', 'Use apenas quando o fornecedor deu desconto em cada embalagem ou unidade comprada. Se o desconto foi no total da compra, revise se faz sentido dividir o valor entre os itens antes de preencher.'],
          ['IVA do item', 'Quando aparecer, use para informar o imposto aplicado ao item. Se você não tiver certeza, mantenha o padrão da loja e revise depois com a pessoa que acompanha sua parte fiscal.'],
          ['Adicionar item', 'Depois de preencher os dados do item, clique para adicioná-lo à compra. Só depois de adicionar ele entra no total e no resumo da compra.'],
          ['Pagamento e vencimento', 'Use esta parte para organizar se a compra também deve gerar conta a pagar no financeiro. Preencha vencimento, forma de pagamento, categoria financeira e parcelas quando houver pagamento futuro.'],
          ['Gerar conta a pagar', 'Marque quando essa compra precisa aparecer no Financeiro para acompanhamento de pagamento. Se a compra já foi paga e você não quer controlar parcelas, revise se vale deixar desmarcado.'],
          ['Entrada', 'Use quando uma parte já foi paga no momento da compra. O restante pode ser dividido em parcelas, mantendo a compra e o financeiro mais fáceis de conferir.'],
          ['Parcelas e intervalo', 'Use quando o fornecedor permitiu pagar em mais de uma vez. Informe a quantidade de parcelas e o intervalo entre vencimentos para que o financeiro fique organizado.'],
          ['Categoria financeira', 'Escolha o grupo que melhor representa esse gasto. Isso ajuda depois a entender quanto a loja gasta com ingredientes, embalagens, serviços ou outras despesas.'],
          ['Compra com contas a pagar já geradas', 'Quando uma compra já gerou parcelas no financeiro, edite com atenção. Ao salvar usando Atualizar compra, as mudanças são sincronizadas para evitar diferença entre o registro da compra e as contas a pagar.'],
          ['Boas práticas', 'Cadastre fornecedores e itens antes de registrar compras, confira quantidades e preços antes de salvar e evite misturar documentos diferentes no mesmo registro quando isso dificultar a conferência.']
        ]);
    } else if (key === 'compras-produtos-insumos') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Compras → Produtos / Insumos</h3><p>Use esta tela para cadastrar os itens que a loja compra. Esses cadastros ajudam no registro de compras, no cálculo de custo e, quando for insumo, na preparação de receitas.</p></div>' +
          _guideBackButtons(moduleKey || 'compras', 'Abrir Produtos / Insumos', 'compras/itens') +
        '</div>' +
        _guideFields([
          ['Produto pronto ou insumo', 'Produto pronto é algo comprado para vender ou usar como item final. Insumo é algo usado para preparar produtos, como farinha, chocolate, carne, molho, embalagem ou descartável. Escolher a classe certa ajuda o sistema a mostrar os campos adequados.'],
          ['Classe do item', 'Define se o cadastro será tratado como produto pronto ou insumo. Quando for insumo, aparecem opções ligadas a receitas e aproveitamento. Quando for produto pronto, a tela fica mais simples.'],
          ['Nome do item', 'Use um nome fácil de procurar. Prefira nomes claros, como Farinha de trigo, Batata, Caixa para bolo ou Refrigerante lata. Evite abreviações que você possa esquecer depois.'],
          ['Categoria', 'Organiza itens parecidos no mesmo grupo. Exemplos: Laticínios, Congelados, Bebidas, Embalagens ou Descartáveis. A categoria ajuda na busca, nos filtros e na leitura dos custos.'],
          ['Cadastro ativo', 'Itens ativos aparecem nas buscas e nos formulários de compra. Se você não usa mais um item, prefira desativar em vez de apagar quando ele já apareceu em compras antigas.'],
          ['Compra e custo', 'Use esta área para dizer como você costuma comprar esse item. Isso ajuda o sistema a preencher melhor o registro de compras e calcular custo por unidade, kg ou litro.'],
          ['Unidade base', 'É a unidade usada para calcular custo, estoque e receitas. Se você usa batata por quilo nas receitas, escolha kg. Se usa leite por litro, escolha L. Se compra e usa por unidade, escolha unidade.'],
          ['Fornecedor padrão', 'Escolha o fornecedor onde você costuma comprar esse item. Isso não impede comprar de outro fornecedor, mas deixa o lançamento mais rápido quando o fornecedor for o de sempre.'],
          ['Embalagem de compra padrão', 'Informe como o item costuma vir na compra: saco, caixa, pacote, garrafa, bandeja ou unidade. Exemplo: batata em saco, leite em garrafa, ovos em caixa.'],
          ['Conteúdo por embalagem', 'Informe quanto vem dentro da embalagem padrão. Exemplo: saco com 5 kg, garrafa com 1 L ou caixa com 12 unidades. Esse dado ajuda o sistema a calcular o custo real.'],
          ['Como preencher?', 'A ajuda aparece para insumos porque eles costumam entrar em receitas. Ela explica o exemplo da batata comprada em saco, mas usada por kg, para mostrar como embalagem e conteúdo trabalham juntos no custo.'],
          ['Custo atual', 'O custo atual ajuda você a acompanhar quanto o item está custando. Ele pode ser atualizado a partir das compras registradas e serve como referência para receitas, margens e decisões de compra.'],
          ['Uso em receitas', 'Ative quando este item puder entrar na preparação dos seus produtos. Ao ativar, ele aparece na lista de ingredientes das receitas e o BocaFood usa o custo dele para calcular quanto cada produto custa para ser feito.'],
          ['Aproveitamento (%)', 'Informe quanto do item realmente é aproveitado. Use 100% quando tudo é usado. Se existe perda ao limpar, descascar, cortar ou preparar, use uma porcentagem menor. Exemplo: se de 1 kg você aproveita cerca de 800 g, use 80%.'],
          ['Dados fiscais', 'Preencha quando precisar organizar o item para documentos e impostos: código interno, nome fiscal, IVA, categoria fiscal e unidade fiscal. Esses dados ajudam a preparar a base fiscal sem mudar a forma simples de cadastrar o item.'],
          ['Quando editar', 'Edite quando mudar fornecedor padrão, unidade base, categoria, embalagem ou uso em receitas. Se o item já foi usado em compras e receitas, revise com atenção para não confundir custos antigos com custos novos.'],
          ['Quando não apagar', 'Se o item já apareceu em compras, receitas ou relatórios, prefira desativar. Assim o histórico continua entendível e você evita perder referência de custos anteriores.']
        ]);
    } else if (key === 'compras-fornecedores') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Compras → Fornecedores</h3><p>Use esta tela para manter os dados de quem vende ingredientes, produtos, embalagens ou serviços para a loja. Um cadastro bem preenchido deixa compras e pagamentos mais fáceis de conferir.</p></div>' +
          _guideBackButtons(moduleKey || 'compras', 'Abrir Fornecedores', 'compras/fornecedores') +
        '</div>' +
        _guideFields([
          ['Quando cadastrar um fornecedor', 'Cadastre todo fornecedor que você usa com alguma frequência ou que precisa aparecer no histórico de compras. Pode ser mercado, distribuidor, produtor local, loja de embalagens ou prestador de serviço.'],
          ['Dados fiscais', 'Use esta parte para identificar corretamente o fornecedor nas compras, pagamentos e documentos. Preencha com os dados que aparecem na nota, fatura, recibo ou cadastro comercial do fornecedor.'],
          ['Nome fiscal', 'É o nome usado em documentos. Pode ser o nome completo de uma pessoa autónoma ou a denominação social de uma empresa. Esse nome nem sempre é igual ao nome conhecido comercialmente.'],
          ['Nome comercial', 'É o nome pelo qual você reconhece o fornecedor no dia a dia. Ele aparece em resumos e facilita encontrar o fornecedor certo sem precisar decorar o nome fiscal.'],
          ['Pessoa de contato', 'Preencha quando você fala com uma pessoa específica dentro do fornecedor. Isso ajuda na hora de resolver dúvidas de entrega, pedido ou pagamento.'],
          ['Tipo de documento', 'Escolha o tipo de identificação fiscal do fornecedor. Use a opção que corresponde ao documento informado. Se não tiver certeza, confira no documento do fornecedor antes de salvar.'],
          ['Documento fiscal', 'Informe o número do documento do fornecedor. Esse campo ajuda a diferenciar fornecedores com nomes parecidos e deixa o cadastro pronto para compras e conferências.'],
          ['País fiscal', 'Mostra o país usado para interpretar os dados fiscais do fornecedor. Para fornecedores da Espanha, mantenha Espanha. Para fornecedores de outro país, escolha o país correspondente quando estiver disponível.'],
          ['Regime fiscal', 'Use quando você souber como o fornecedor trabalha fiscalmente. Essa informação ajuda na organização fiscal e pode influenciar conferências futuras. Se você não sabe, deixe sem preencher até confirmar.'],
          ['IVA dedutível', 'Marque quando o IVA da compra normalmente pode ser considerado na organização fiscal do negócio. Se você não tem certeza, mantenha o padrão e revise com apoio fiscal antes de usar em decisões importantes.'],
          ['IRPF dedutível', 'Use apenas quando fizer sentido para o tipo de fornecedor e documento recebido. Nem todo fornecedor usa IRPF. Se não souber, deixe desmarcado até confirmar.'],
          ['Endereço', 'Preencha o endereço principal do fornecedor. Comece digitando a rua e escolha uma sugestão quando aparecer. Depois confira número, zona, localidade, província, código postal e país.'],
          ['Telefone e WhatsApp', 'Use telefone para contato geral e WhatsApp para conversas rápidas com o fornecedor. Se for o mesmo número, você pode repetir. O importante é conseguir falar com o fornecedor quando houver dúvida sobre compra ou entrega.'],
          ['E-mail', 'Use o e-mail onde o fornecedor envia documentos, respostas, orçamentos ou comprovantes. Evite e-mails que você não costuma acompanhar.'],
          ['Pagamento padrão', 'Escolha a forma de pagamento mais comum para esse fornecedor. Isso ajuda o registro de compras a sugerir o preenchimento correto, mas você ainda pode mudar em cada compra.'],
          ['Prazo de pagamento', 'Informe em quantos dias você costuma pagar esse fornecedor. Exemplo: 0 para pagamento na hora, 7 para uma semana, 30 para mensal.'],
          ['Observações', 'Use para anotar condições, horário de entrega, pedido mínimo, contato preferido, qualidade, frequência ou qualquer detalhe que ajude na compra.'],
          ['Fornecedor ativo', 'Fornecedores ativos aparecem na busca e nos formulários de compra. Se você parou de comprar, desative para manter o histórico sem deixar a lista principal confusa.'],
          ['Editar ou excluir', 'Edite sempre que os dados mudarem. Se o fornecedor já tem compras registradas, prefira desativar em vez de excluir, para manter o histórico compreensível.']
        ]);
    } else if (key === 'compras-configuracoes') {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Compras → Configurações</h3><p>Use esta tela para organizar as opções que aparecem nos cadastros e filtros de compras. Ela ajuda a encontrar itens mais rápido e manter custos separados por grupos.</p></div>' +
          _guideBackButtons(moduleKey || 'compras', 'Abrir Configurações', 'compras/configuracoes') +
        '</div>' +
        _guideFields([
          ['Para que serve', 'Configurações de compras organizam os cadastros usados em Produtos / Insumos, Fornecedores e Registro de compras. O objetivo é deixar a operação mais fácil de procurar, filtrar e conferir.'],
          ['Categorias', 'Categorias organizam itens parecidos no mesmo grupo. Exemplos: Bebidas, Laticínios, Carnes, Embalagens, Congelados e Descartáveis. Use nomes simples e consistentes.'],
          ['Como escolher uma categoria', 'Pense em como você procura os itens na prática. Se você quer encontrar ingredientes por tipo de compra, use categorias como Hortifruti, Secos, Proteínas ou Embalagens. Evite criar categorias muito parecidas.'],
          ['Ordem da lista', 'As categorias aparecem em ordem alfabética para facilitar a busca. Se uma categoria não aparecer onde você espera, confira se o nome está escrito da forma desejada e se ela está ativa.'],
          ['Busca e filtros', 'Use a busca para encontrar uma categoria pelo nome. O botão Limpar filtros aparece somente quando há algo filtrando a lista. Se nada aparecer, limpe os filtros ou revise a palavra buscada.'],
          ['Nova categoria', 'Crie uma categoria quando precisar agrupar itens de um jeito que ainda não existe. Use um nome curto e fácil de entender. A categoria criada poderá aparecer nos cadastros de Produtos / Insumos e nos filtros.'],
          ['Editar categoria', 'Use para corrigir nome, ajustar status ou padronizar a organização. Se a categoria já estiver em uso, prefira renomear com cuidado para não confundir relatórios e buscas.'],
          ['Excluir categoria', 'Use exclusão apenas quando a categoria foi criada por engano ou não está em uso. Se ela já organiza itens existentes, avalie deixar inativa ou ajustar o nome para preservar a leitura do histórico.'],
          ['Categorias e classe do item', 'A classe do item separa Produto pronto de Insumo. A categoria apenas agrupa itens parecidos. Exemplo: um insumo e um produto pronto podem estar em grupos diferentes conforme a organização da loja.'],
          ['Unidades de medida', 'As unidades aparecem nos cadastros e compras para indicar como o item é medido, como kg, g, L, ml ou unidade. Elas ajudam o sistema a calcular custos e quantidades de forma coerente.'],
          ['Boas práticas', 'Comece com poucas categorias bem claras. Depois, se a lista crescer, crie novas categorias. Muitas categorias parecidas deixam a busca mais difícil e podem espalhar custos que deveriam estar juntos.']
        ]);
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
    if (document.getElementById('docs-content')) {
      var first = null;
      document.querySelectorAll('[data-doc-nav]').forEach(function (btn) {
        var haystack = [btn.getAttribute('data-guide-title'), btn.getAttribute('data-guide-copy')].join(' ');
        var match = !q || haystack.indexOf(q) >= 0;
        btn.style.display = match ? '' : 'none';
        if (match && !first) first = btn;
      });
      if (q && first) _openDocModule(first.getAttribute('data-doc-key'));
      return;
    }
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

  return { render: render, destroy: destroy, _openDocModule: _openDocModule, _openGuideModule: _openGuideModule, _openGuide: _openGuide, _clearGuidePanel: _clearGuidePanel, _filterGuides: _filterGuides };
})();
