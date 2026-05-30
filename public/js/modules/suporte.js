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
      '.docs-topic h4{font-size:12.8px;font-weight:850;color:#1F1F1F;margin:6px 0 2px;line-height:1.25;}' +
      '.docs-topic p{font-size:12.8px;line-height:1.55;color:#625A55;margin:0;}' +
      '.docs-topic ul{margin:0;padding-left:18px;color:#625A55;font-size:12.8px;line-height:1.52;}' +
      '.docs-topic li{margin:4px 0;}' +
      '.docs-path{display:inline-flex;width:max-content;max-width:100%;align-items:center;gap:7px;border:1px solid #EFE6DA;background:#fff;border-radius:999px;padding:7px 10px;color:#7A6352;font-size:11.5px;font-weight:800;box-sizing:border-box;}' +
      '.docs-path .mi{font-size:15px;color:#C4362A;}' +
      '.docs-path code{font-family:inherit;color:#1F1F1F;background:transparent;font-weight:850;white-space:normal;}' +
      '.docs-block{display:grid;gap:5px;padding-top:3px;}' +
      '.docs-block-title{font-size:11px;font-weight:900;letter-spacing:.055em;text-transform:uppercase;color:#8A7E7C;}' +
      '.docs-subtopics{display:grid;gap:9px;margin-top:4px;}' +
      '.docs-subtopic{border:1px solid #F0E7E1;background:#fff;border-radius:14px;padding:11px;display:grid;gap:6px;}' +
      '.docs-subtopic strong{font-size:12.8px;color:#1F1F1F;line-height:1.25;}' +
      '.docs-section-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0;}' +
      '.docs-section-card{border:1px solid #EFE6DA;background:#FFFEFC;border-radius:15px;padding:12px;display:grid;grid-template-columns:30px 1fr;gap:9px;align-items:start;}' +
      '.docs-section-card .mi{width:30px;height:30px;border-radius:11px;background:#F7F1E8;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;}' +
      '.docs-section-card strong{display:block;color:#1F1F1F;font-size:12.8px;font-weight:850;line-height:1.25;}' +
      '.docs-section-card span:not(.mi){display:block;color:#6F6860;font-size:12px;line-height:1.42;margin-top:3px;}' +
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
            '<span class="support-home-copy">Consulte o que cada área faz, quais dados usa e como ele conversa com o resto do negócio.</span>' +
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
            '<span class="support-home-copy">Envie uma solicitação para o suporte quando precisar de ajuda com sua conta ou com o Painel BocaFood.</span>' +
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
          ['Como o BocaFood se organiza', 'Entender a lógica geral antes de preencher campos.', 'map'],
          ['O que configurar primeiro', 'Dados do negócio, canais, produtos, custos e rotina mínima.', 'checklist'],
          ['Primeira rota e primeira temporada', 'Como criar direção antes de começar a operar no escuro.', 'route'],
          ['Primeira venda acompanhada', 'Como compra, pedido, financeiro e estoque começam a conversar.', 'point_of_sale']
        ],
        intro: [
          'Esta área é para começar do jeito certo, sem tentar configurar tudo de uma vez.',
          'O BocaFood funciona melhor quando primeiro entende o seu negócio. Depois disso, ele consegue ajudar você a vender, acompanhar dinheiro, cuidar de produtos, planejar metas e tomar decisões com mais clareza.',
          'A ideia dos primeiros passos é montar uma base mínima para o BocaFood parar de ser só uma tela com botões e começar a mostrar uma leitura real do negócio.'
        ],
        topics: [
          {
            title: '1. Como o BocaFood se organiza',
            intro: 'O BocaFood tem uma parte para a rotina do dia a dia e outra para crescimento. Primeiro você registra o que acontece. Depois o BocaFood transforma essa base em direção.',
            subtopics: [
              {
                title: 'Operação',
                text: 'É onde você registra produtos, compras, pedidos, clientes, financeiro, estoque, loja online e venda presencial.',
                lines: [
                  'Produtos: Cardápio > Produtos',
                  'Receitas: Produção > Receitas de produção',
                  'Compras: Compras',
                  'Pedidos: Pedidos > Pedidos',
                  'Cozinha: Pedidos > Modo cozinha',
                  'Clientes: Clientes',
                  'Financeiro: Financeiro',
                  'Estoque: Estoque',
                  'Loja online: Loja online',
                  'Venda presencial: Venda presencial'
                ]
              },
              {
                title: 'Crescimento',
                text: 'É onde você olha para frente e entende se o negócio está indo na direção escolhida.',
                lines: [
                  'Plano de Voo: Crescimento > Plano de Voo',
                  'Temporadas: Crescimento > Temporadas',
                  'Performance: Crescimento > Performance',
                  'Maturidade: Maturidade do Negócio'
                ]
              }
            ],
            why: 'Antes de criar metas, temporadas ou olhar relatórios, o BocaFood precisa entender o que você vende, por onde vende, quanto custa, quais despesas existem e como o dinheiro entra. Sem essa base, qualquer plano vira chute.',
            ready: 'Você entendeu que primeiro vem a base operacional e depois vêm as leituras de crescimento.'
          },
          {
            title: '2. Preencher os dados do negócio',
            path: 'Configurações > Dados da loja',
            intro: 'Aqui você cadastra as informações principais do negócio.',
            fill: ['nome do negócio', 'logo', 'WhatsApp', 'endereço', 'país', 'moeda', 'idioma', 'redes sociais, se tiver', 'dados principais da loja'],
            why: 'Essas informações aparecem em várias partes do BocaFood, como loja online, rodapé do cardápio, links públicos, mensagens, identidade visual e configurações fiscais.',
            after: 'O BocaFood passa a usar esses dados como identidade base do negócio e evita que cada área tenha uma informação diferente.',
            cautions: ['Não deixar telefone só com código do país.', 'Conferir endereço, país e idioma antes de publicar a loja.', 'Usar logo e nome reais para evitar confusão no cardápio público.'],
            ready: 'Os dados principais aparecem corretos na tela e a loja online herda essas informações.'
          },
          {
            title: '3. Configurar canais de venda',
            path: 'Configurações > Canais de venda',
            intro: 'Aqui você informa por onde as vendas chegam.',
            fill: ['Cardápio online', 'Instagram', 'WhatsApp', 'balcão', 'delivery próprio', 'marketplace', 'outros canais que realmente usa'],
            why: 'O canal mostra de onde veio a venda. Isso ajuda a entender qual canal vende mais, qual dá mais margem, qual custa caro e onde vale colocar promoção ou esforço.',
            after: 'Os canais passam a aparecer em pedidos, venda presencial, financeiro, Plano de Voo, Performance e leituras de crescimento.',
            cautions: ['Cadastrar somente canais reais.', 'Evitar manter canais padrão que a loja não usa.', 'Quando houver taxa ou comissão, configurar para a margem ficar mais fiel.'],
            ready: 'A lista mostra apenas os canais usados pelo negócio.'
          },
          {
            title: '4. Configurar formas de pagamento',
            path: 'Financeiro > Configurações > Formas de pagamento',
            intro: 'Aqui você cadastra como a cliente pode pagar.',
            fill: ['dinheiro', 'cartão', 'transferência', 'Stripe', 'outras formas usadas no negócio'],
            why: 'A forma de pagamento precisa aparecer corretamente no pedido, no checkout, na venda presencial e no financeiro.',
            after: 'Quando uma venda for registrada, o BocaFood consegue guardar como ela foi paga e organizar melhor as entradas.',
            cautions: ['Se não cadastrar forma de pagamento, algumas telas não terão opção válida para selecionar.', 'Conferir se a forma de pagamento combina com o país fiscal e a rotina da loja.'],
            ready: 'As formas aparecem disponíveis nos pedidos e na venda presencial.'
          },
          {
            title: '5. Configurar contas financeiras',
            path: 'Financeiro > Configurações > Contas bancárias',
            intro: 'Aqui você informa onde o dinheiro fica.',
            fill: ['conta principal', 'caixa físico', 'conta da venda presencial', 'conta usada pelo Stripe, se tiver'],
            why: 'O financeiro precisa saber se o dinheiro está no banco, no caixa físico ou em outra conta. Isso ajuda a entender o saldo real.',
            after: 'Entradas, saídas, transferências, sangrias e reforços passam a ter um lugar correto dentro do financeiro.',
            cautions: ['Não misturar caixa físico com conta bancária se você controla os dois separadamente.', 'Conferir qual conta recebe venda presencial e Stripe.'],
            ready: 'Cada entrada de dinheiro tem uma conta clara para cair.'
          },
          {
            title: '6. Configurar regras de preço',
            path: 'Preço e Margem > Regras de preço',
            intro: 'Aqui você ajuda o BocaFood a entender se o preço cobre o custo e deixa margem.',
            fill: ['custo do produto', 'embalagem', 'taxa do canal', 'comissão', 'impostos, quando configurados', 'margem desejada'],
            why: 'Vender muito não significa ganhar dinheiro. Se o preço estiver errado, o negócio pode trabalhar bastante e sobrar pouco.',
            after: 'As análises de preço, margem, canal e Plano de Voo ficam mais confiáveis.',
            cautions: ['Não usar desconto antes de saber se existe margem.', 'Conferir produtos com custo zerado.', 'Canais com comissão alta vendem muito e ainda assim reduzir o resultado.'],
            ready: 'Os principais produtos têm preço, custo e uma leitura mínima de margem.'
          },
          {
            title: '7. Cadastrar categorias do cardápio',
            path: 'Cardápio > Configurações > Categorias',
            intro: 'Aqui você organiza como os produtos aparecem para a cliente.',
            fill: ['salgados', 'doces', 'bebidas', 'combos', 'pratos', 'sobremesas ou as categorias reais da loja'],
            why: 'Categorias ajudam a cliente a encontrar rápido o que quer comprar e deixam o cardápio mais fácil de navegar.',
            after: 'As categorias aparecem no cardápio público, nos filtros e na organização dos produtos.',
            cautions: ['Não criar categorias demais no começo.', 'Usar nomes simples e fáceis de entender.', 'Ordenar as categorias mais importantes primeiro.'],
            ready: 'Os produtos principais conseguem ser colocados em categorias claras.'
          },
          {
            title: '8. Cadastrar produtos',
            path: 'Cardápio > Produtos',
            intro: 'Aqui você cadastra tudo que vende para a cliente.',
            fill: ['nome', 'descrição', 'preço', 'categoria', 'imagem', 'se aparece no cardápio', 'variações', 'adicionais', 'tag', 'ficha técnica, quando for produzido por você', 'produto pronto, quando for comprado pronto'],
            why: 'O produto não aparece só no cardápio. Ele também aparece nos pedidos, cozinha, promoções, upsell, estoque, financeiro e leituras de crescimento.',
            after: 'O produto passa a poder ser vendido, aparecer no cardápio público e entrar nos relatórios.',
            cautions: ['Produto sem preço não ajuda a vender corretamente.', 'Produto produzido deve ter ficha técnica quando possível.', 'Produto comprado pronto precisa ter custo para margem e estoque fazerem sentido.', 'Produto oculto não aparece para a cliente.'],
            ready: 'Os principais produtos têm preço, categoria e estão marcados para aparecer quando devem ser vendidos.'
          },
          {
            title: '9. Cadastrar insumos',
            path: 'Produção > Insumos',
            intro: 'Aqui você cadastra os itens usados para produzir ou comprar para a operação.',
            fill: ['farinha', 'leite', 'frango', 'chocolate', 'embalagem', 'óleo', 'queijo ou outros itens usados no negócio'],
            why: 'Os insumos ajudam a montar receitas, registrar compras, calcular custo e movimentar estoque.',
            after: 'Eles entram em fichas técnicas, compras, produção e estoque.',
            cautions: ['Usar unidade correta.', 'Não duplicar o mesmo insumo com nomes diferentes.', 'Informar custo quando tiver.'],
            ready: 'Os principais ingredientes e embalagens usados nas receitas já estão cadastrados.'
          },
          {
            title: '10. Cadastrar receitas ou fichas técnicas',
            path: 'Produção > Receitas de produção',
            intro: 'Use quando você produz o item que vende ou uma base usada em outra receita.',
            fill: ['ingredientes usados', 'quantidade de cada ingrediente', 'rendimento', 'unidade do rendimento', 'custo previsto', 'produto produzido, quando fizer sentido'],
            why: 'A ficha técnica ajuda o BocaFood a entender quanto custa produzir, quanto rende, o que sai do estoque e quanto deveria entrar como produto produzido.',
            after: 'A receita entra em produção, estoque, preço, margem, lista de compras e leitura de produtos.',
            cautions: ['Rendimento errado deixa custo errado.', 'Ingrediente sem custo deixa a ficha fraca.', 'Bases de produção, como massas e recheios, também podem virar receitas.'],
            ready: 'Os produtos mais importantes têm receita ou custo suficiente para o BocaFood entender margem e produção.'
          },
          {
            title: '11. Cadastrar despesas e custos fixos',
            path: 'Financeiro > Saídas',
            intro: 'Aqui você registra o que o negócio precisa pagar.',
            fill: ['aluguel', 'internet', 'luz', 'água', 'contador', 'ferramentas', 'mensalidades', 'marketing fixo', 'salários ou ajuda fixa', 'taxas recorrentes'],
            why: 'O Plano de Voo precisa saber quanto o negócio precisa cobrir. Sem despesas e custos, ele não consegue responder quanto você precisa vender para valer a pena.',
            after: 'As saídas alimentam financeiro, Plano de Voo e leitura de saúde do negócio.',
            cautions: ['Não misturar despesa pessoal com despesa do negócio.', 'Usar categoria correta.', 'Marcar recorrência quando for uma conta que se repete.'],
            ready: 'As principais contas do negócio estão registradas e categorizadas.'
          },
          {
            title: '12. Criar o primeiro Plano de Voo',
            path: 'Crescimento > Plano de Voo',
            intro: 'O Plano de Voo é onde você escolhe a realidade que quer construir no negócio.',
            fill: ['conferir base atual', 'confirmar ticket médio', 'revisar custos e despesas', 'comparar cenários', 'escolher uma rota'],
            why: 'Ele ajuda a entender quanto precisa vender, quantos pedidos por dia precisa fazer, quanto tende a sobrar e se o esforço está leve, possível ou puxado.',
            after: 'A rota escolhida passa a ser acompanhada pela Performance e serve como base para Temporadas.',
            cautions: ['Não ficar mudando a rota todo dia.', 'Se o caminho mudar muito, criar uma nova rota.', 'Antes de escolher, conferir se os dados base fazem sentido.'],
            ready: 'Existe uma rota ativa escolhida para o período anual ou restante do ano.'
          },
          {
            title: '13. Criar a primeira Temporada',
            path: 'Crescimento > Temporadas',
            intro: 'A Temporada transforma a rota em ações práticas de curto prazo.',
            fill: ['objetivo da temporada', 'estratégia', 'dificuldade', 'período', 'jogadas sugeridas'],
            why: 'Ela responde o que fazer agora para chegar mais perto do Plano de Voo, sem criar uma meta solta e sem direção.',
            after: 'O BocaFood acompanha as jogadas, observa resultados e ajuda a decidir o próximo passo.',
            cautions: ['Escolher objetivo que combina com o momento.', 'Não criar várias ações iguais.', 'A dificuldade define o ritmo das jogadas.'],
            ready: 'Existe uma temporada ativa conectada à rota do Plano de Voo.'
          },
          {
            title: '14. Configurar a loja online',
            path: 'Loja online > Template da loja',
            intro: 'Aqui você prepara como a cliente vai ver sua loja.',
            fill: ['identidade visual', 'card principal', 'destaque', 'categorias', 'programa de pontos', 'atendimento', 'checkout', 'textos', 'rodapé'],
            why: 'A loja online precisa passar confiança, mostrar produtos com clareza e facilitar o pedido.',
            after: 'O cardápio público começa a refletir sua marca, seus produtos, seu atendimento e suas regras de checkout.',
            cautions: ['Não publicar sem conferir horários, entrega e retirada.', 'Conferir se os produtos aparecem corretamente.', 'Evitar excesso de texto pesado ou informações faltando.'],
            ready: 'A loja está visualmente pronta para uma cliente fazer pedido.'
          },
          {
            title: '15. Publicar o link da loja',
            path: 'Loja online > Link da loja',
            intro: 'Aqui você define o nome do link público e publica o cardápio.',
            fill: ['nome do link', 'status de publicação', 'dados públicos da loja'],
            why: 'Esse é o endereço que a cliente usa para acessar e comprar.',
            after: 'Depois de publicar, você envia o link no WhatsApp, Instagram, bio, campanha ou atendimento.',
            cautions: ['Usar nome fácil de lembrar.', 'Conferir se a loja aparece publicada.', 'Abrir o link em celular antes de divulgar.'],
            ready: 'O link abre a loja publicada e mostra os produtos corretos.'
          },
          {
            title: '16. Criar ações de venda quando fizer sentido',
            intro: 'Depois da base criada, você usa ações para vender mais, aumentar ticket ou trazer cliente de volta.',
            subtopics: [
              { title: 'Promoções', text: 'Caminho: Ações de vendas > Promoções. Use para desconto em produto, leve 3 pague 2, frete grátis ou oferta por período.' },
              { title: 'Cupons', text: 'Caminho: Ações de vendas > Cupons. Use para primeira compra, retorno, campanha específica ou cliente especial.' },
              { title: 'Upsell', text: 'Caminho: Ações de vendas > Upsell. Use para sugerir bebida, adicional, produto complementar ou combo.' },
              { title: 'Programa de pontos', text: 'Caminho: Ações de vendas > Programa de pontos. Use para acúmulo, resgate, validade e benefício para recompra.' }
            ],
            why: 'Ação de venda só fica forte quando está ligada a produto, margem, canal e objetivo. O BocaFood mostra se a ação realmente virou pedido.',
            cautions: ['Não criar desconto sem olhar margem.', 'Não colocar o mesmo produto em promoções conflitantes.', 'Upsell faz mais sentido no Cardápio online.'],
            ready: 'As ações existem apenas quando têm objetivo claro e conseguem ser acompanhadas pelos pedidos.'
          },
          {
            title: '17. Registrar a primeira venda',
            intro: 'Depois da base pronta, a rotina começa com pedido real.',
            subtopics: [
              { title: 'Venda pelo cardápio online', text: 'Caminho: Loja online > Link da loja. A cliente acessa, escolhe produtos e envia o pedido.' },
              { title: 'Pedido recebido', text: 'Caminho: Pedidos > Pedidos. A venda aparece na listagem de pedidos.' },
              { title: 'Modo cozinha', text: 'Caminho: Pedidos > Modo cozinha. A equipe acompanha preparo, retirada ou entrega.' },
              { title: 'Pedido manual', text: 'Caminho: Pedidos > Pedidos > Novo pedido. Use quando o pedido veio por WhatsApp, Instagram, telefone ou balcão.' },
              { title: 'Venda presencial', text: 'Caminho: Venda presencial. Use para venda rápida no balcão ou presencial.' }
            ],
            why: 'O pedido é uma das principais fontes de verdade do BocaFood. Ele alimenta cliente, financeiro, estoque, performance, maturidade e temporadas.',
            after: 'Quando o pedido é confirmado, pago, entregue ou finalizado, essa informação alimenta as áreas ligadas à rotina.',
            cautions: ['Selecionar canal correto.', 'Conferir pagamento.', 'Conferir endereço quando for entrega.', 'Usar cliente cadastrado quando possível.'],
            ready: 'O primeiro pedido aparece corretamente em Pedidos e, quando aplicável, na cozinha e no financeiro.'
          },
          {
            title: '18. Registrar compras',
            path: 'Compras',
            intro: 'Use para registrar o que entrou no negócio.',
            fill: ['ingredientes', 'embalagens', 'produtos prontos', 'materiais', 'fornecedor', 'quantidade', 'valor', 'forma de pagamento', 'recebimento'],
            why: 'A compra atualiza custo, alimenta estoque e ajuda a entender quanto o negócio está gastando.',
            after: 'Quando a compra é recebida, ela gera entrada no estoque e alimenta o financeiro quando esses controles estão ativos.',
            cautions: ['Conferir quantidade e unidade.', 'Confirmar recebimento quando realmente chegou.', 'Usar fornecedor correto quando tiver.'],
            ready: 'A compra aparece registrada e, se recebida, movimenta o estoque.'
          },
          {
            title: '19. Produzir itens',
            intro: 'Use produção quando você prepara produtos ou bases antes de vender.',
            subtopics: [
              { title: 'Criar ordem de produção', text: 'Caminho: Produção > Ordens de produção. Registre receita, quantidade planejada, data prevista e observação.' },
              { title: 'Finalizar produção', text: 'Caminho: Produção > Ordens de produção > Abrir ordem > Finalizar produção. Informe quantidade real, perdas e data real.' },
              { title: 'Lista de compras da produção', text: 'Caminho: Produção > Lista de compras. Planeje o que precisa comprar com base no que pretende produzir.' }
            ],
            why: 'A produção mostra se o rendimento real está perto do previsto e ajuda a controlar produto produzido, perda e custo.',
            after: 'Ao finalizar, o BocaFood gera movimentações de estoque quando a produção está ligada ao estoque.',
            cautions: ['Não finalizar produção sem quantidade real.', 'Registrar perda quando existir.', 'Não recalcular produção antiga usando receita nova.'],
            ready: 'A ordem concluída mostra planejado, produzido, diferença e movimentações quando houver.'
          },
          {
            title: '20. Acompanhar estoque',
            path: 'Estoque > Itens em estoque',
            intro: 'Aqui você acompanha o saldo dos itens.',
            fill: ['insumos', 'produtos prontos', 'produtos produzidos', 'bases de produção', 'mínimo', 'máximo', 'movimentações'],
            why: 'O estoque ajuda a evitar vender sem ter item, comprar demais ou perder controle do que foi produzido.',
            after: 'As movimentações aparecem em Estoque > Movimentações e vêm de compras, produção, vendas e ajustes.',
            cautions: ['Saldo é calculado por movimentações.', 'Se algo físico não bater, usar ajuste ou inventário.', 'Mínimo e máximo devem vir da origem do item quando possível.'],
            ready: 'Os principais itens aparecem separados por classe e com saldo compreensível.'
          },
          {
            title: '21. Acompanhar financeiro',
            intro: 'O financeiro mostra o dinheiro que entra, sai e fica.',
            subtopics: [
              { title: 'Visão geral', text: 'Caminho: Financeiro > Visão geral. Mostra uma leitura resumida da saúde financeira.' },
              { title: 'Entradas', text: 'Caminho: Financeiro > Entradas. Veja dinheiro recebido ou previsto.' },
              { title: 'Saídas', text: 'Caminho: Financeiro > Saídas. Veja contas, despesas, custos e pagamentos.' },
              { title: 'Fluxo de caixa', text: 'Caminho: Financeiro > Fluxo de caixa. Veja o movimento do dinheiro ao longo do tempo.' },
              { title: 'Configurações', text: 'Caminho: Financeiro > Configurações. Ajuste categorias, formas de pagamento, contas e custos indiretos.' }
            ],
            why: 'Sem financeiro, o negócio vende e ainda assim não sabe se sobrou dinheiro.',
            cautions: ['Conferir valores em moeda.', 'Separar despesa, custo direto e custo indireto.', 'Evitar duplicar lançamentos previstos e históricos.'],
            ready: 'Entradas e saídas principais estão registradas e categorizadas.'
          },
          {
            title: '22. Acompanhar clientes',
            path: 'Clientes',
            intro: 'Aqui você guarda informações importantes de quem compra.',
            fill: ['nome', 'WhatsApp', 'e-mail', 'documento', 'aniversário', 'endereços de entrega', 'preferências', 'alergias', 'observações', 'histórico de pedidos'],
            why: 'Cliente bem cadastrado facilita atendimento, recompra, pontos, entrega e comunicação.',
            after: 'Os dados entram em pedidos, checkout, programa de pontos e histórico da cliente.',
            cautions: ['Não duplicar cliente pelo mesmo WhatsApp.', 'Separar WhatsApp do endereço.', 'Guardar mais de um endereço quando a cliente tiver casa e trabalho.'],
            ready: 'A cliente fica fácil de encontrar e reutilizar em novos pedidos.'
          },
          {
            title: '23. Acompanhar crescimento',
            intro: 'Depois que a rotina começa, use crescimento para entender se o negócio está evoluindo.',
            subtopics: [
              { title: 'Performance', text: 'Caminho: Crescimento > Performance. Mostra se o mês está caminhando perto da rota escolhida.' },
              { title: 'Maturidade do Negócio', text: 'Caminho: Maturidade do Negócio. Mostra se o negócio está ficando mais organizado, consistente e forte.' }
            ],
            why: 'O objetivo não é só registrar dados. É transformar a rotina em decisão.',
            after: 'O BocaFood começa a apontar ritmo, sinais fortes, pontos que travam e evolução real do negócio.',
            ready: 'Você consegue olhar para a tela e entender o que aconteceu e o que precisa de atenção.'
          },
          {
            title: '24. O que fazer no primeiro dia',
            intro: 'Não tente fazer tudo perfeito. Siga esta ordem para criar uma base suficiente.',
            lines: [
              'Configurações > Dados da loja',
              'Configurações > Canais de venda',
              'Financeiro > Configurações > Formas de pagamento',
              'Financeiro > Configurações > Contas bancárias',
              'Cardápio > Configurações > Categorias',
              'Cardápio > Produtos',
              'Produção > Insumos',
              'Produção > Receitas de produção',
              'Financeiro > Saídas',
              'Crescimento > Plano de Voo',
              'Crescimento > Temporadas',
              'Loja online > Template da loja',
              'Loja online > Link da loja',
              'Pedidos > Pedidos ou Venda presencial'
            ],
            why: 'Essa ordem evita começar por relatório ou meta sem antes dar ao BocaFood os dados mínimos para entender o negócio.',
            ready: 'Depois dessa sequência, você já consegue vender e começar a acompanhar a evolução.'
          },
          {
            title: '25. O que deixar para depois',
            intro: 'Algumas coisas ficam para depois. Primeiro faça o básico funcionar.',
            lines: [
              'Cadastrar todos os produtos.',
              'Cadastrar todos os fornecedores.',
              'Deixar todas as imagens perfeitas.',
              'Configurar automações avançadas.',
              'Criar todas as promoções.',
              'Analisar todos os relatórios.',
              'Montar histórico completo.'
            ],
            why: 'No começo, o mais importante é criar uma base útil e começar a registrar vendas reais.'
          },
          {
            title: '26. Erros comuns no começo',
            lines: [
              'Cadastrar produto sem custo: o BocaFood registra a venda, mas não consegue dizer bem se está sobrando dinheiro.',
              'Criar promoção antes de saber a margem: vende mais e mesmo assim sobra menos.',
              'Não configurar canal de venda: depois fica difícil saber de onde veio o pedido e qual canal vale a pena.',
              'Não registrar despesas: o Plano de Voo fica fraco porque não sabe quanto o negócio precisa cobrir.',
              'Mexer em tudo ao mesmo tempo: o melhor é seguir a ordem dos primeiros passos.'
            ],
            ready: 'Se você evitar esses erros, a primeira leitura do BocaFood já nasce mais confiável.'
          },
          {
            title: '27. Como saber que a base inicial está boa',
            lines: [
              'Configurações > Dados da loja está preenchido.',
              'Configurações > Canais de venda tem seus canais reais.',
              'Cardápio > Produtos tem seus principais produtos.',
              'Produção > Receitas de produção tem pelo menos os produtos mais importantes.',
              'Financeiro > Saídas tem despesas principais.',
              'Crescimento > Plano de Voo já tem uma rota criada.',
              'Crescimento > Temporadas já tem uma temporada ativa.',
              'Loja online > Link da loja já permite publicar o cardápio.',
              'Pedidos > Pedidos já consegue receber ou registrar venda.'
            ],
            ready: 'Se esses pontos estiverem prontos, você já tem o necessário para começar.'
          },
          {
            title: '28. O que o BocaFood começa a entregar depois disso',
            lines: [
              'Quanto você precisa vender.',
              'Se o mês está dentro da rota.',
              'Quais produtos puxam resultado.',
              'Quais canais merecem atenção.',
              'Se uma promoção ajudou ou só deu desconto.',
              'Se o ticket médio está bom.',
              'Se clientes estão voltando.',
              'Se estoque e produção acompanham a rotina.',
              'Se o negócio está ficando mais maduro.'
            ],
            why: 'O objetivo não é só preencher tela. O objetivo é fazer o BocaFood entender o negócio para ajudar você a decidir melhor.'
          }
        ]
      },
      {
        key: 'base-negocio',
        icon: 'settings',
        title: 'Base do negócio',
        summary: 'Tudo que identifica a loja, a usuária, os canais, pagamentos e regras usadas como base pelas outras áreas.',
        tags: ['cadastro', 'canais', 'integrações'],
        sections: [
          ['Dados da loja', 'Nome, marca, contatos, endereço, país fiscal e apresentação.', 'storefront'],
          ['Usuária e acesso', 'Dados da pessoa responsável, WhatsApp, e-mail e segurança.', 'person'],
          ['Canais de venda', 'De onde vêm as vendas e como cada canal conversa com financeiro e relatórios.', 'hub'],
          ['Pagamentos e integrações', 'Stripe, WhatsApp, redes sociais, pixel e ferramentas externas.', 'credit_card'],
          ['Venda presencial', 'Quando ativar, como configurar e como entra na rotina.', 'point_of_sale']
        ],
        intro: [
          'A Base do negócio é onde você deixa claro quem é o seu negócio, quem acessa o Painel BocaFood, por onde as vendas chegam e quais ferramentas fazem parte da rotina.',
          'Essas informações parecem simples, mas elas aparecem em muitos lugares: loja online, pedidos, financeiro, mensagens, relatórios, Plano de Voo, Temporadas e Maturidade.',
          'Quando essa base está bem preenchida, você evita retrabalho, passa mais confiança para a cliente e acompanha a rotina com mais clareza.'
        ],
        topics: [
          {
            title: '1. Dados da loja',
            path: 'Configurações > Dados da loja',
            intro: 'Aqui você informa os dados principais que identificam o negócio.',
            fill: [
              'Nome do negócio: escreva o nome que a cliente reconhece, igual ao que você usa no cardápio, Instagram, embalagem ou WhatsApp.',
              'Logo: envie a imagem oficial da marca. Prefira uma versão limpa, sem fundo pesado, para aparecer bem no Painel BocaFood e na loja online.',
              'WhatsApp: informe o número completo com código do país. Esse número é usado para atendimento e precisa abrir corretamente quando a cliente chamar.',
              'E-mail de contato: use um e-mail que você acompanha. Ele serve para contato do negócio e organização da conta.',
              'Endereço de atendimento: busque o endereço real usado como referência para retirada, entrega ou informação pública. Alguns campos são preenchidos automaticamente depois da seleção.',
              'Bairro: confira se o bairro veio preenchido automaticamente. Se não vier, escreva a zona ou bairro conhecido pela cliente.',
              'Cidade: confira se a cidade veio preenchida. Se não vier, complete manualmente.',
              'Província: confira se a província veio preenchida corretamente. Se não vier, preencha antes de salvar.',
              'País: confira o país preenchido pelo endereço ou selecione o país onde o negócio opera.',
              'Idioma: selecione o idioma principal da loja online. Os textos do cardápio público seguem essa escolha.',
              'Moeda: escolha a moeda usada nas vendas. Para Espanha e boa parte da Europa, normalmente será euro.',
              'Redes sociais: coloque somente links reais e ativos. Campo vazio não deve aparecer para a cliente.'
            ],
            why: 'Esses dados são a identidade do negócio dentro do BocaFood. Eles aparecem na loja online, nas mensagens, no rodapé, em links públicos, em configurações fiscais e em partes do atendimento.',
            after: 'A loja online mostra nome, logo, contato, endereço, redes sociais e idioma corretos. A cliente reconhece a marca e encontra os canais certos para comprar ou falar com você.',
            cautions: ['Não deixar telefone com apenas o código do país.', 'Conferir se o endereço está completo.', 'Usar nome e logo reais antes de publicar a loja.', 'Preencher o idioma correto, porque textos do cardápio público dependem dele.'],
            ready: 'A tela mostra o nome real do negócio, contato válido, endereço completo e identidade visual mínima.'
          },
          {
            title: '2. Endereço de atendimento',
            path: 'Configurações > Dados da loja',
            intro: 'O endereço de atendimento é o endereço usado como referência da loja.',
            fill: [
              'Busca de endereço: comece procurando a rua ou endereço principal. Depois de selecionar a sugestão correta, o BocaFood preenche os campos que conseguir reconhecer.',
              'Rua: confira se ficou apenas o nome da rua. Se a busca não preencher, escreva manualmente.',
              'Número ou portal: complete sempre que não vier preenchido. Na Espanha, portal costuma ser mais claro que apenas número.',
              'Bairro: confira se veio preenchido. Se ficar vazio, escreva a zona ou bairro de atendimento.',
              'Código postal: confira se veio preenchido. Se não vier, complete manualmente porque ele ajuda a organizar entrega e retirada.',
              'Cidade: confirme se veio correta. Se não vier, preencha com a cidade onde a loja atende.',
              'Província: confirme se veio correta. Se não vier, preencha manualmente antes de salvar.',
              'País: confirme o país do endereço. Se não vier preenchido, selecione o país correto.',
              'Referência: escreva somente quando ajuda a cliente a chegar melhor, como loja dentro de mercado, campainha, ponto conhecido ou instrução de entrada.'
            ],
            why: 'Quando a retirada, o rodapé ou a entrega usam endereço, esse endereço aparece na retirada, no rodapé da loja online, nas informações de contato e na configuração de entrega.',
            after: 'Quando a retirada estiver ativa, a cliente entende onde buscar o pedido. O código postal base também ajuda a orientar zonas de atendimento e configuração de entrega.',
            cautions: ['Conferir se o bairro foi preenchido.', 'Não deixar província e país vazios quando a busca de endereço não completar tudo.', 'Depois de escolher o endereço, revisar rua, cidade e país antes de salvar.'],
            ready: 'O endereço aparece completo e fácil de entender para uma cliente.'
          },
          {
            title: '3. Usuária e acesso',
            path: 'Configurações > Usuários',
            intro: 'Aqui ficam as pessoas que acessam o painel e seus dados principais.',
            fill: [
              'Nome: escreva o nome da pessoa que usa o Painel BocaFood.',
              'E-mail: use o e-mail de acesso dessa pessoa. Cada pessoa deve ter seu próprio e-mail.',
              'WhatsApp: informe o número completo da pessoa responsável ou da equipe, com código do país.',
              'Função: escolha o papel da pessoa na rotina, como responsável, equipe, cozinha ou atendimento, conforme as opções disponíveis.',
              'Status de acesso: deixe ativo apenas quem realmente deve entrar no Painel BocaFood.',
              'País fiscal: quando aparecer, selecione o país correto para liberar opções compatíveis com a operação.'
            ],
            why: 'Nem toda pessoa deve ter o mesmo acesso. Separar usuária responsável, equipe e permissões ajuda a proteger a operação.',
            after: 'Cada pessoa entra com o próprio acesso e vê o que precisa para trabalhar com segurança.',
            cautions: ['Não compartilhar a mesma senha entre pessoas.', 'Remover acesso de quem não trabalha mais no negócio.', 'Separar acesso da conta principal e acesso da loja quando necessário.'],
            ready: 'Cada pessoa tem seu próprio acesso e o status correto.'
          },
          {
            title: '4. Canais de venda',
            path: 'Configurações > Canais de venda',
            intro: 'Aqui você cadastra por onde as vendas chegam.',
            fill: [
              'Canais fixos: Cardápio e Venda presencial já aparecem na tela como canais do BocaFood. Eles ficam bloqueados para evitar que a rotina principal perca essa referência.',
              'Canais adicionais: adicione somente os canais que a loja realmente usa, como Instagram, WhatsApp, Balcão, Delivery próprio, marketplace ou aplicativo de entrega.',
              'Nome do canal: escreva um nome curto e fácil de reconhecer. Use o mesmo nome que você usa na rotina para não confundir a equipe.',
              'Categoria financeira: escolha o grupo que vai aparecer no financeiro quando entrar dinheiro desse canal. Use nomes simples que mostrem de onde veio a venda, como Vendas do Cardápio, Vendas do Instagram, Vendas do Balcão ou Vendas de Marketplace.',
              'Comissão: preencha quando o canal fica com uma porcentagem da venda. Se não cobra comissão, deixe zerado.',
              'Taxa fixa: preencha quando o canal cobra um valor fixo por pedido ou por venda. Se não existe taxa fixa, deixe zerado.',
              'Imposto comissão %: use somente quando existe imposto sobre a comissão cobrada pelo canal. Se não existe ou você ainda não controla esse detalhe, deixe zerado.',
              'Canal sem custo: se esse canal não cobra taxa, comissão nem imposto sobre comissão, mantenha esses campos zerados. Não invente um valor só para preencher.',
              'Canal com custo: se o canal cobra comissão, taxa por pedido ou imposto sobre comissão, registre isso para saber se vender por ali está valendo a pena.',
              'Forma de pagamento: ela não fica presa ao canal. Escolha a forma de pagamento em cada venda ou pedido, porque uma venda pelo mesmo canal pode ser paga de maneiras diferentes.',
              'Adicionar canal: use o botão apenas quando existir outro lugar real por onde a venda chega.',
              'Remover canal: remova canais adicionados por engano. Os canais fixos não devem ser removidos.',
              'Salvar canais: depois de revisar nomes e categorias financeiras, salve para essas opções ficarem disponíveis nas vendas.'
            ],
            why: 'O canal mostra se uma venda veio do cardápio online, Instagram, balcão ou outro lugar. Isso ajuda a entender onde vale colocar esforço e onde a margem está apertada.',
            after: 'Você passa a enxergar de onde vêm as vendas e compara quais canais trazem mais pedidos, mais margem e mais resultado.',
            cautions: ['Manter somente canais reais.', 'Vincular a categoria financeira certa para não misturar entradas.', 'Não criar Instagram, WhatsApp ou marketplace se a loja ainda não recebe pedidos por esses lugares.'],
            ready: 'A lista mostra Cardápio, Venda presencial e apenas os canais adicionais usados pelo negócio.'
          },
          {
            title: '5. Formas de pagamento',
            path: 'Financeiro > Configurações > Formas de pagamento',
            intro: 'Aqui você define como a cliente pode pagar.',
            fill: [
              'Nome da forma de pagamento: escreva como a usuária e a equipe reconhecem a forma, como Dinheiro, Cartão, Transferência ou Stripe.',
              'Tipo: selecione o tipo correto para organizar caixa, cartão, transferência ou pagamento online.',
              'País fiscal: escolha o país onde essa forma deve aparecer. Isso evita mostrar opção errada para outra operação.',
              'Conta financeira: vincule a conta onde o dinheiro cai. Exemplo: caixa físico, banco, conta Stripe ou conta da venda presencial.',
              'Taxa: preencha quando a forma de pagamento desconta valor da venda, como cartão ou Stripe.',
              'Status: deixe ativa somente a forma de pagamento usada no checkout, pedido manual ou venda presencial.'
            ],
            why: 'As formas de pagamento precisam aparecer no checkout, pedido manual, venda presencial e financeiro.',
            after: 'A forma de pagamento aparece na hora do pedido e ajuda você a conferir o dinheiro que entrou.',
            cautions: ['Se não houver forma de pagamento cadastrada, algumas telas devem orientar a cadastrar antes.', 'Conferir se a forma de pagamento está liberada para o país fiscal correto.', 'Stripe deve ficar vinculado à conta financeira definida pela loja.'],
            ready: 'As opções certas aparecem para selecionar no pedido, checkout e venda presencial.'
          },
          {
            title: '6. Contas financeiras',
            path: 'Financeiro > Configurações > Contas bancárias',
            intro: 'Aqui você define onde o dinheiro fica dentro do negócio.',
            fill: [
              'Nome da conta: use um nome fácil, como Banco principal, Caixa físico, Stripe ou Venda presencial.',
              'Tipo da conta: escolha se é banco, caixa, cartão, Stripe ou outro tipo disponível.',
              'Moeda: selecione a moeda em que o dinheiro dessa conta é controlado.',
              'Saldo inicial: preencha apenas quando você já sabe quanto havia nessa conta no começo do controle.',
              'Conta padrão: marque a conta mais usada para facilitar lançamentos.',
              'Status: mantenha ativa apenas a conta que ainda faz parte da rotina financeira.',
              'Observação: use para lembrar detalhes, como conta usada só para cartão, só para caixa físico ou só para venda presencial.'
            ],
            why: 'A forma de pagamento diz como a cliente pagou. A conta financeira diz onde esse dinheiro ficou.',
            after: 'Você entende melhor onde está o dinheiro: no banco, no caixa físico, no Stripe ou em outra conta usada pelo negócio.',
            cautions: ['Não confundir caixa físico com banco.', 'Caixa inicial, sangria e reforço não são venda nova: eles organizam onde o dinheiro está.', 'Conferir se a venda presencial tem conta padrão quando estiver ativa.'],
            ready: 'Você olha o financeiro e entende em qual conta está o dinheiro.'
          },
          {
            title: '7. Integração com Stripe',
            path: 'Configurações > Integrações',
            intro: 'Use quando a loja quiser receber pagamento por cartão no checkout usando Stripe Connect.',
            fill: [
              'Conectar conta Stripe: use o botão de conexão para ligar a conta Stripe da própria loja.',
              'Status da conexão: confira se aparece conectada antes de aceitar cartão no checkout.',
              'Forma de pagamento Stripe: confirme se a forma de pagamento Stripe foi criada e está ativa nas formas de pagamento.',
              'Conta financeira para receber: escolha onde as vendas pagas por Stripe entram no financeiro.',
              'Taxa Stripe: registre a taxa quando ela estiver configurada, para o financeiro mostrar a sobra com mais fidelidade.',
              'Moeda: confirme a moeda usada pela loja, normalmente euro quando a loja opera na Espanha.',
              'Teste de pagamento: antes de divulgar, faça um pedido pequeno de teste para conferir pedido, pagamento e financeiro.'
            ],
            why: 'Cada loja conecta sua própria conta Stripe. Assim o pagamento da cliente acontece no checkout e o dinheiro vai para a conta conectada da loja.',
            after: 'Quando o pagamento é aprovado, o pedido fica mais fácil de acompanhar, o valor entra no financeiro e a taxa fica registrada para você saber quanto sobrou.',
            cautions: ['A loja precisa conectar a própria conta Stripe.', 'Antes de divulgar pagamento por cartão, faça um teste completo.', 'Se o pagamento falhar, o pedido não deve ser tratado como pago.'],
            ready: 'A integração mostra conta conectada e a forma de pagamento Stripe aparece onde precisa.'
          },
          {
            title: '8. WhatsApp e redes sociais',
            path: 'Configurações > Integrações',
            intro: 'Aqui ficam contatos e links usados para atendimento e comunicação.',
            fill: [
              'WhatsApp público: informe o número que a cliente usa para falar com a loja. Use código do país e número completo.',
              'Instagram: cole o link correto do perfil, não apenas o nome de usuário solto quando o campo pedir link.',
              'Facebook: preencha somente se a página estiver ativa e for usada pelo negócio.',
              'TikTok: preencha somente se o perfil fizer parte da comunicação da loja.',
              'Outros links: use para canais reais, como site, cardápio externo ou perfil importante.',
              'Conferência final: abra cada link depois de salvar para garantir que a cliente chega no lugar certo.'
            ],
            why: 'Esses dados ajudam a cliente encontrar a loja, chamar no WhatsApp e confiar que está comprando do negócio certo.',
            after: 'A loja online herda redes sociais, botão de WhatsApp, rodapé e informações de contato.',
            cautions: ['Não deixar link quebrado.', 'Usar número de WhatsApp com país e número completos.', 'Não mostrar campo vazio no rodapé público.'],
            ready: 'Os links abrem corretamente e o WhatsApp chama o número certo.'
          },
          {
            title: '9. Google, endereço e busca',
            path: 'Configurações > Integrações',
            intro: 'Quando a busca de endereço está ativa, ela ajuda a preencher parte do endereço com mais rapidez.',
            fill: [
              'Busca de endereço: quando estiver ativa, ela ajuda a encontrar ruas e preencher parte do endereço.',
              'País de busca: confirme o país principal da operação para a busca sugerir endereços corretos.',
              'Rua: depois de selecionar um endereço, confira se ficou apenas o nome da rua no campo certo. Se não vier, preencha manualmente.',
              'Número ou portal: complete manualmente quando a busca não preencher.',
              'Bairro: confira se veio preenchido. Se não vier, preencha manualmente.',
              'Cidade, província e país: confira os três campos depois da seleção. Se algum ficar vazio, complete antes de salvar.',
              'Referência: escreva uma orientação útil quando a entrega ou retirada precisa de detalhe extra.'
            ],
            why: 'Endereço preenchido corretamente evita erro em entrega, retirada, cliente e loja online.',
            after: 'Você preenche endereços com menos erro e economiza tempo no cadastro da loja, de clientes e de entregas.',
            cautions: ['Autocomplete não substitui conferência.', 'Se a lista continuar aparecendo depois de selecionar, revisar o padrão do campo.', 'Província e país devem vir do endereço selecionado quando possível.'],
            ready: 'Ao selecionar um endereço, rua, cidade, província e país ficam preenchidos de forma coerente.'
          },
          {
            title: '10. Venda presencial',
            path: 'Configurações > Venda presencial',
            intro: 'Ative quando a loja também vende no balcão ou presencialmente.',
            fill: [
              'Ativar venda presencial: ligue somente quando a loja vende no balcão, evento, feira ou atendimento direto.',
              'Conta financeira padrão: escolha a conta onde as vendas presenciais entram. Normalmente é Caixa físico ou Conta venda presencial.',
              'Formas de pagamento aceitas: marque apenas formas cadastradas no financeiro e usadas no atendimento presencial.',
              'Categorias visíveis: deixe disponíveis somente categorias que fazem sentido para venda rápida.',
              'Produtos visíveis: produtos ocultos ou fora do cardápio não devem aparecer para venda presencial.',
              'Caixa físico: use para controlar dinheiro contado, reforço, sangria e fechamento da venda presencial.',
              'Pedido gerado: confirme que a venda presencial cria pedido entregue e entrada financeira quando finalizada.'
            ],
            why: 'Venda presencial precisa registrar pedido, pagamento, financeiro e estoque sem depender do checkout público.',
            after: 'As vendas feitas no balcão ou em atendimento direto entram na rotina junto com pedidos, financeiro e estoque.',
            cautions: ['Produtos ocultos não devem aparecer na venda presencial.', 'Se não houver forma de pagamento cadastrada, mostrar orientação para configurar.', 'Variantes e combos precisam ser escolhidos antes de adicionar ao carrinho.'],
            ready: 'A venda presencial mostra produtos ativos, permite escolher pagamento e registra a venda no financeiro e pedidos.'
          },
          {
            title: '11. Link público e publicação',
            path: 'Loja online > Link da loja',
            intro: 'Aqui você define como a cliente acessa a loja publicada.',
            fill: [
              'Nome do link: escolha um nome curto, parecido com o nome da loja e fácil de enviar para a cliente.',
              'Validação do nome: o check verde indica que o nome está livre e correto. O X vermelho indica que precisa ajustar antes de salvar.',
              'Status de publicação: publique somente quando produtos, atendimento, checkout e informações principais estiverem revisados.',
              'URL pública: depois de salvar, copie ou abra o endereço final para conferir se mostra a loja certa.',
              'Botão Ver loja: use para testar a loja publicada como cliente, principalmente no celular.',
              'Remover publicação: use apenas quando quiser tirar a loja do ar temporariamente.'
            ],
            why: 'O link público precisa ser fácil de entender e ficar livre para esta loja.',
            after: 'O botão Ver loja e o link compartilhado passam a abrir a loja publicada correta.',
            cautions: ['Usar nome parecido com o nome da loja.', 'Não publicar antes de revisar produtos, atendimento e checkout.', 'Se aparecer que o nome do link está em uso, conferir se outra loja já usa esse nome antes de forçar.'],
            ready: 'O link abre a loja certa e publicada.'
          },
          {
            title: '12. Como saber que a base do negócio está pronta',
            lines: [
              'Dados da loja estão completos.',
              'Endereço de atendimento está correto.',
              'Usuária responsável e acessos estão claros.',
              'Canais de venda usados de verdade estão cadastrados.',
              'Formas de pagamento aparecem nos pedidos.',
              'Contas financeiras representam onde o dinheiro fica.',
              'Integrações importantes estão conectadas ou conscientemente desativadas.',
              'Venda presencial está ativa somente se a loja realmente usa.',
              'Link público abre a loja correta.'
            ],
            ready: 'Quando esses pontos estão prontos, a rotina fica mais organizada e as próximas configurações ficam muito mais fáceis.'
          },
          {
            title: '13. Erros comuns nesta etapa',
            lines: [
              'Cadastrar canal que a loja não usa e depois confundir análise de vendas.',
              'Deixar WhatsApp incompleto.',
              'Não separar conta bancária e caixa físico.',
              'Ativar Stripe sem conectar a conta da loja.',
              'Publicar a loja sem revisar endereço, atendimento e checkout.',
              'Apagar acesso da loja achando que é o mesmo acesso principal.',
              'Deixar redes sociais vazias aparecendo no rodapé.'
            ],
            why: 'Esses erros às vezes deixam a venda entrar, mas enfraquecem a leitura do negócio e podem criar confusão no atendimento.'
          }
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
        ],
        intro: [
          'O Cardápio é onde você cadastra o que a cliente compra.',
          'Ele não serve apenas para mostrar produtos bonitos na loja online. O cadastro do produto alimenta pedidos, cozinha, promoções, upsell, produção, estoque, preço, margem, Plano de Voo, Temporadas e Maturidade.',
          'Quanto mais claro e completo estiver o cardápio, melhor o BocaFood consegue vender e também entender o resultado real do negócio.'
        ],
        topics: [
          {
            title: '1. Categorias do cardápio',
            path: 'Cardápio > Configurações > Categorias',
            intro: 'As categorias organizam os produtos para a cliente encontrar rápido o que quer comprar.',
            fill: ['nome da categoria', 'ordem de exibição', 'status ativo quando aplicável'],
            why: 'Uma categoria bem organizada melhora a experiência da loja online e também ajuda você a analisar quais grupos de produtos vendem melhor.',
            after: 'As categorias aparecem no cardápio público, nos filtros, no cadastro do produto e na organização visual da loja.',
            cautions: ['Não criar categorias demais no começo.', 'Evitar nomes parecidos para a mesma coisa.', 'Categorias não precisam de imagem se isso não fizer parte da experiência atual.', 'Ordenar primeiro o que a cliente mais procura.'],
            ready: 'As principais famílias de produtos estão cadastradas e com nomes fáceis de entender.'
          },
          {
            title: '2. Cadastrar produto',
            path: 'Cardápio > Produtos',
            intro: 'Aqui você cadastra tudo que a cliente compra.',
            fill: ['nome do produto', 'descrição curta', 'preço', 'categoria', 'imagem', 'status visível no cardápio', 'tag quando quiser destacar', 'tipo de produto', 'vínculo com ficha técnica ou produto pronto quando existir'],
            why: 'O produto aparece em várias partes do BocaFood. Ele aparece na loja online, no pedido, na cozinha, nas promoções, no upsell, no estoque, no financeiro e nas leituras de crescimento.',
            after: 'Quando o produto está ativo e visível, ele aparece no cardápio público e entra no pedido.',
            cautions: ['Produto sem preço gera venda errada.', 'Produto sem categoria fica mais difícil de encontrar.', 'Imagem precisa mostrar bem o produto.', 'Produto oculto não deve aparecer na loja nem na venda presencial.'],
            ready: 'O produto aparece na listagem com nome, preço, categoria e status corretos.'
          },
          {
            title: '3. Tipo de produto',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'O tipo ajuda o BocaFood a entender de onde vem o produto e como ele conversa com produção e estoque.',
            subtopics: [
              { title: 'Produto produzido', text: 'Use quando você faz o produto a partir de uma ficha técnica ou receita.' },
              { title: 'Produto pronto comprado', text: 'Use quando você compra o item pronto para revender, como bebida ou produto embalado.' },
              { title: 'Produto simples sem vínculo', text: 'Use apenas no começo: sem vínculo, a leitura de estoque, custo e margem fica limitada.' }
            ],
            why: 'O tipo errado baixa o estoque pelo lugar errado ou deixar margem e produção sem informação suficiente.',
            after: 'Produtos produzidos se conectam com fichas técnicas. Produtos prontos se conectam com itens comprados e estoque.',
            cautions: ['Não tratar produto produzido como produto comprado pronto.', 'Se o item baixa estoque, precisa ter vínculo correto.', 'Produtos sem vínculo não bloqueiam venda, mas geram leitura mais fraca.'],
            ready: 'Cada produto importante tem uma origem clara: produzido, comprado pronto ou sem controle por enquanto.'
          },
          {
            title: '4. Preço do produto',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'O preço é o valor que a cliente vê e paga pelo produto.',
            fill: ['preço de venda', 'preço promocional quando aplicável', 'valor adicional ou desconto em variações quando existir'],
            why: 'O preço precisa conversar com custo, margem, promoções, upsell e Plano de Voo. Se o preço estiver errado, a venda acontece, mas o resultado do negócio fica distorcido.',
            after: 'O preço aparece no card do produto, modal do produto, carrinho, pedido, financeiro e relatórios.',
            cautions: ['Sempre conferir moeda.', 'Não deixar produto com preço zero sem intenção.', 'Quando uma promoção estiver ativa, o card e o modal precisam mostrar o benefício de forma clara.'],
            ready: 'O card, modal e carrinho mostram o mesmo preço esperado.'
          },
          {
            title: '5. Custo e margem',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'O custo mostra quanto aquele produto custa para existir.',
            fill: ['ficha técnica para produto produzido', 'custo do produto pronto comprado', 'embalagem quando aplicável', 'canal de venda com taxa quando existir'],
            why: 'Sem custo, o BocaFood registra venda, mas não consegue dizer bem se sobrou dinheiro. Promoções, upsell e canais com comissão dependem dessa base para serem analisados com mais segurança.',
            after: 'Preço e Margem, Plano de Voo, Temporadas e Performance usam essa informação para orientar decisões.',
            cautions: ['Produto com custo zerado enfraquece análise.', 'Desconto sem margem pode vender mais e sobrar menos.', 'Marketplace com comissão alta precisa ser analisado junto com margem.'],
            ready: 'Os produtos mais vendidos têm custo ou ficha técnica suficiente para avaliar margem.'
          },
          {
            title: '6. Imagem do produto',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'A imagem ajuda a cliente entender o que está comprando.',
            fill: ['foto principal do produto', 'remoção ou troca da imagem quando necessário'],
            why: 'Imagem boa aumenta confiança e ajuda a vender. Imagem errada ou cortada atrapalha a decisão da cliente.',
            after: 'A foto aparece no card do produto, modal do produto, promoções e outras áreas que mostram o item.',
            cautions: ['Não usar imagem de outro produto duplicado sem revisar.', 'Ao duplicar produto, a imagem deve ser copiada como dado independente, não ficar presa ao original.', 'Produto sem foto deve ficar sem placeholder falso se esse for o padrão definido.'],
            ready: 'A imagem aparece corretamente na listagem, no card público e no modal.'
          },
          {
            title: '7. Variações',
            path: 'Cardápio > Produtos > Abrir produto > Variantes',
            intro: 'Variações são escolhas que a cliente precisa fazer ou escolhe fazer antes de adicionar o produto.',
            fill: ['nome da variante', 'se é obrigatória ou opcional', 'mínimo por item', 'máximo por item', 'opções disponíveis', 'acréscimo ou desconto', 'foto opcional da opção'],
            why: 'Variações evitam pedido incompleto. Elas servem para sabor, tamanho, bebida, recheio, ponto, acompanhamento ou qualquer escolha importante.',
            after: 'As variações aparecem no modal do produto e também devem acompanhar o item no pedido e na mensagem do WhatsApp.',
            cautions: ['Se a variante for obrigatória, o produto só deve ser adicionado depois da escolha.', 'Não mostrar área de foto quando a opção não tem foto cadastrada.', 'Campos pequenos demais dificultam preenchimento no celular.'],
            ready: 'Ao abrir o produto, a cliente consegue escolher as variações e o pedido guarda essas escolhas.'
          },
          {
            title: '8. Combos',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'Combo é quando um produto vendido reúne escolhas ou itens dentro de uma oferta maior.',
            fill: ['grupos de escolha', 'quantidade mínima', 'quantidade máxima', 'opções por grupo', 'preço do combo', 'variações quando existirem'],
            why: 'Combos ajudam a vender mais em um único pedido e deixam a compra mais prática para a cliente.',
            after: 'O modal do produto precisa guiar a escolha do combo antes de adicionar ao carrinho.',
            cautions: ['Não deixar grupo obrigatório sem opção.', 'Garantir que o botão de adicionar só funcione depois das escolhas obrigatórias.', 'O layout do modal precisa ficar claro no desktop e mobile.'],
            ready: 'A cliente consegue montar o combo sem dúvida e o pedido mostra todas as escolhas.'
          },
          {
            title: '9. Adicionais e upsell do produto',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'Adicionais e sugestões ajudam a aumentar o valor do pedido quando fazem sentido.',
            fill: ['produtos sugeridos', 'limite quando aplicável', 'benefício ou desconto quando existir', 'vínculo com regra de upsell'],
            why: 'Um produto complementar aumenta ticket sem depender de desconto forte.',
            after: 'As sugestões aparecem no modal do produto ou no carrinho, conforme a regra criada em Ações de venda.',
            cautions: ['Upsell só deve ser aplicado se a cliente aceitar.', 'Se o upsell tiver variação, a escolha precisa abrir antes de adicionar.', 'Não sugerir produto oculto ou indisponível.'],
            ready: 'A sugestão aparece no momento correto e entra no carrinho somente quando a cliente escolhe.'
          },
          {
            title: '10. Tags do produto',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'Tags são pequenos selos para destacar uma informação importante.',
            fill: ['texto da tag', 'cor de fundo', 'cor da fonte'],
            why: 'A tag chama atenção sem precisar mudar a ordem do produto. Serve para indicar novidade, mais vendido, caseiro, limitado ou outro destaque.',
            after: 'A tag aparece no card público e no modal do produto com as cores escolhidas.',
            cautions: ['Não usar elemento gráfico extra na tag se o padrão pede só texto e cor.', 'Preservar a cor de fundo e a cor da fonte escolhidas pela usuária.', 'Não usar tag para colocar produto em vitrine automaticamente.'],
            ready: 'A tag aparece igual no cadastro, no card do produto e no modal.'
          },
          {
            title: '11. Produto em destaque',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'O destaque serve para sinalizar visualmente um produto importante.',
            fill: ['ativar ou desativar destaque', 'selo de destaque quando aplicável'],
            why: 'Destaque ajuda a chamar atenção para um produto sem transformar isso em uma categoria separada.',
            after: 'O produto recebe selo visual no cardápio, respeitando o padrão do cardápio público.',
            cautions: ['Destaque não deve mover automaticamente o produto para uma vitrine separada se essa não for a regra atual.', 'Não confundir destaque do produto com card promocional da loja.'],
            ready: 'Ao ativar ou desativar, o selo aparece ou some de forma coerente no template.'
          },
          {
            title: '12. Mostrar no cardápio',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'Este controle define se o produto aparece para a cliente.',
            fill: ['ativo no cardápio', 'oculto quando não deve vender', 'status de disponibilidade quando existir'],
            why: 'Produto oculto não deve aparecer na loja pública nem na venda presencial. Isso evita vender item que não está disponível.',
            after: 'O produto fica visível ou escondido nos canais que usam o cardápio.',
            cautions: ['Não deixar produto antigo visível por engano.', 'Produto oculto não deve aparecer nem bloqueado na venda presencial.', 'Conferir visibilidade depois de duplicar produto.'],
            ready: 'Somente produtos prontos para venda aparecem para a cliente.'
          },
          {
            title: '13. Duplicar produto',
            path: 'Cardápio > Produtos',
            intro: 'Duplicar ajuda a criar um produto parecido sem começar do zero.',
            fill: ['dados úteis do produto original', 'novo nome', 'novo preço se mudar', 'nova imagem se necessário', 'vínculos revisados'],
            why: 'A duplicação economiza tempo, mas o novo produto precisa ser independente do original.',
            after: 'O produto duplicado deve abrir com os dados copiados, mas alterações futuras no original não podem alterar a cópia.',
            cautions: ['Revisar imagem, preço, ficha técnica, tags, variações e visibilidade.', 'Não deixar o produto duplicado em branco.', 'Não manter vínculo compartilhado de imagem se isso fizer a cópia mudar junto com o original.'],
            ready: 'A cópia tem dados úteis e fica livre para edição sem afetar o produto original.'
          },
          {
            title: '14. Produto, produção e estoque',
            path: 'Cardápio > Produtos > Abrir produto',
            intro: 'O produto vendido precisa conversar com o que existe no estoque quando houver controle.',
            subtopics: [
              { title: 'Produto produzido', text: 'Deve apontar para ficha técnica ou produto produzido para baixar estoque corretamente quando vender.' },
              { title: 'Produto pronto comprado', text: 'Deve apontar para item comprado pronto quando a venda baixa esse item direto do estoque.' },
              { title: 'Insumo', text: 'Normalmente é usado em produção e compras, não como produto final vendido para a cliente.' }
            ],
            why: 'Se o vínculo estiver errado, o pedido entra, mas o estoque não baixa do lugar certo.',
            after: 'Vendas confirmadas geram saída de estoque do produto vendido quando houver vínculo correto.',
            cautions: ['Não baixar ingrediente direto na venda se o item vendido é produto produzido.', 'Produto produzido entra no estoque pela produção concluída.', 'Produto pronto comprado entra no estoque pela compra recebida.'],
            ready: 'Cada produto importante baixa o estoque correto ou está claro que ainda não será controlado.'
          },
          {
            title: '15. Como saber que o cardápio está pronto',
            lines: [
              'Categorias principais estão cadastradas.',
              'Produtos mais importantes têm nome, preço, categoria e imagem.',
              'Produtos vendidos no template estão marcados para aparecer.',
              'Produtos ocultos não aparecem na loja nem na venda presencial.',
              'Produtos produzidos têm ficha técnica quando possível.',
              'Produtos prontos comprados têm custo e vínculo correto.',
              'Variações obrigatórias aparecem no modal do produto.',
              'Tags preservam cor de fundo e cor de texto.',
              'Promoções e upsell conseguem usar os produtos certos.'
            ],
            ready: 'Se esses pontos estão ok, o cardápio já consegue vender e alimentar as leituras do BocaFood.'
          },
          {
            title: '16. Erros comuns no Cardápio',
            lines: [
              'Produto com preço zero sem intenção.',
              'Produto sem categoria.',
              'Produto produzido sem ficha técnica.',
              'Produto comprado pronto sem custo.',
              'Produto oculto aparecendo em venda presencial.',
              'Variação obrigatória que não bloqueia o adicionar.',
              'Tag no card público diferente da tag cadastrada.',
              'Imagem duplicada ficando dependente do produto original.',
              'Upsell adicionando produto sem pedir variação obrigatória.'
            ],
            why: 'Esses erros deixam a venda entrar, mas atrapalham pedido, estoque, margem e experiência da cliente.'
          }
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
        ],
        intro: [
          'Produção é a área para controlar o que você prepara antes de vender.',
          'Ela serve para negócios que fazem receitas, bases, recheios, massas, produtos finais ou qualquer etapa que transforma ingredientes em algo que será vendido ou usado depois.',
          'Quando a produção está bem cadastrada, o BocaFood começa a entender rendimento, custo, perda, necessidade de compra e entrada de produto produzido no estoque.'
        ],
        topics: [
          {
            title: '1. Insumos',
            path: 'Produção > Insumos',
            intro: 'Insumos são os itens usados para produzir ou manter a operação funcionando.',
            fill: ['nome do insumo', 'tipo', 'categoria', 'unidade base', 'custo atual quando existir', 'fornecedor padrão quando houver', 'estoque mínimo e máximo se for controlado'],
            why: 'Sem insumos bem cadastrados, a ficha técnica não consegue calcular custo e a lista de compras fica fraca.',
            after: 'O insumo entra em receitas, compras, estoque, produção e cálculo de custo.',
            cautions: ['Não duplicar o mesmo insumo com nomes diferentes.', 'Usar unidade base correta.', 'Conferir custo quando registrar compra.', 'Separar ingrediente, embalagem e material operacional quando fizer sentido.'],
            ready: 'Os principais ingredientes, embalagens e itens usados nas receitas já aparecem na lista.'
          },
          {
            title: '2. Receitas e fichas técnicas',
            path: 'Produção > Receitas de produção',
            intro: 'A ficha técnica mostra como um produto ou base é feito.',
            fill: ['nome da receita', 'ingredientes usados', 'quantidade de cada ingrediente', 'rendimento', 'unidade do rendimento', 'custo previsto', 'imagem quando ajudar', 'produto produzido vinculado quando existir'],
            why: 'A ficha técnica ajuda a saber quanto custa produzir, quanto rende e se o preço de venda faz sentido.',
            after: 'A receita alimenta produto do cardápio, produção, estoque, lista de compras, preço e margem.',
            cautions: ['Rendimento errado muda todo o custo.', 'Ingrediente sem custo deixa a ficha incompleta.', 'A receita atual não deve alterar o snapshot de uma ordem antiga já criada.'],
            ready: 'A receita mostra ingredientes, rendimento e custo previsto de forma coerente.'
          },
          {
            title: '3. Bases de produção',
            path: 'Produção > Receitas de produção',
            intro: 'Base de produção é uma etapa intermediária que depois entra em outro produto.',
            subtopics: [
              { title: 'Exemplos', text: 'Massa, recheio, molho, creme, calda, carne desfiada ou qualquer preparo usado em mais de uma receita.' },
              { title: 'Como pensar', text: 'Se você faz primeiro uma etapa e depois monta o produto final quando chega pedido, essa etapa vira uma base.' }
            ],
            why: 'Essa lógica ajuda quem trabalha produzindo partes do produto antes, como massas e recheios, e monta o item final depois.',
            after: 'A base é produzida, entrar no estoque e ser usada em outra receita ou no preparo do produto final.',
            cautions: ['Não misturar base com produto final se você controla os dois separadamente.', 'Registrar perda quando a base estragar ou render menos.', 'Usar classe correta para o estoque entender o tipo do item.'],
            ready: 'As etapas intermediárias importantes aparecem como receitas/bases e ficam prontas para planejamento.'
          },
          {
            title: '4. Produtos produzidos',
            path: 'Produção > Receitas de produção',
            intro: 'Produto produzido é o resultado de uma produção concluída.',
            fill: ['ficha técnica de origem', 'rendimento', 'unidade produzida', 'custo previsto por unidade', 'classe de estoque quando aplicável'],
            why: 'Quando você produz algo antes de vender, esse item precisa entrar no estoque como produto produzido.',
            after: 'Ao finalizar uma ordem, o BocaFood registra entrada do produto produzido no estoque.',
            cautions: ['Produto produzido deve conversar com o produto vendido no cardápio quando houver baixa por venda.', 'Não confundir produto produzido com produto comprado pronto.', 'Se não houver vínculo, a venda fica sem baixar o estoque correto.'],
            ready: 'O produto produzido está ligado à ficha técnica e é reconhecido pelo estoque.'
          },
          {
            title: '5. Criar ordem de produção',
            path: 'Produção > Ordens de produção',
            intro: 'A ordem de produção é o planejamento do que será feito.',
            fill: ['ficha técnica', 'quantidade planejada', 'data prevista', 'observação opcional'],
            why: 'Ela ajuda a sair do improviso e registrar o que você pretende produzir, com custo e ingredientes previstos.',
            after: 'A ordem salva um retrato da ficha técnica naquele momento, incluindo ingredientes, rendimento e custo previsto.',
            cautions: ['Escolher a ficha correta antes de salvar.', 'Não criar ordem sem quantidade planejada.', 'Lembrar que a ordem planejada ainda não movimenta estoque até ser finalizada.'],
            ready: 'A ordem aparece como planejada e mostra o que será produzido.'
          },
          {
            title: '6. Snapshot da ficha técnica',
            path: 'Produção > Ordens de produção > Detalhes da ordem',
            intro: 'Quando a ordem é criada, o BocaFood guarda uma cópia da receita usada naquele momento.',
            fill: ['nome da ficha', 'rendimento', 'unidade', 'ingredientes', 'quantidades previstas', 'custos usados', 'custo previsto total', 'custo previsto por unidade'],
            why: 'Isso evita que uma alteração futura na receita mude o histórico da produção antiga.',
            after: 'A ordem continua sendo lida com base no snapshot original, mesmo que a ficha técnica seja editada depois.',
            cautions: ['Não recalcular ordem antiga usando ficha atual.', 'Se a receita mudou, crie nova ordem para a nova realidade.'],
            ready: 'O detalhe da ordem mostra os dados usados quando ela foi criada.'
          },
          {
            title: '7. Finalizar produção',
            path: 'Produção > Ordens de produção > Abrir ordem > Finalizar produção',
            intro: 'Finalizar produção registra o que realmente aconteceu no lote.',
            fill: ['quantidade produzida real', 'data real da produção', 'perda real se existir', 'observação da produção', 'responsável quando disponível'],
            why: 'O planejado raramente é igual ao real. Registrar o resultado ajuda a entender rendimento, perda e custo real estimado.',
            after: 'A ordem muda para concluída e mostra diferença entre planejado e produzido.',
            cautions: ['Quantidade real precisa ser maior que zero.', 'Ordem concluída não deve ser finalizada de novo.', 'Ordem cancelada não deve ser finalizada.', 'Perda deve ser registrada quando acontecer.'],
            ready: 'A ordem aparece como concluída e mostra planejado, produzido, diferença e custo estimado.'
          },
          {
            title: '8. Resultado do lote',
            path: 'Produção > Ordens de produção > Detalhes da ordem',
            intro: 'O resultado do lote mostra se a produção ficou perto do esperado.',
            fill: ['planejado x produzido', 'diferença em quantidade', 'diferença em percentual', 'custo previsto por unidade', 'custo real estimado por unidade', 'perda real'],
            why: 'Essa leitura mostra se houve perda, rendimento menor, rendimento maior ou se tudo ficou dentro do esperado.',
            after: 'A produção ganha uma leitura operacional, sem depender ainda de fechamento financeiro complexo.',
            cautions: ['Custo real nesta fase é estimado pelo custo previsto dividido pela quantidade real produzida.', 'Não confundir essa leitura com inventário completo.', 'Se a diferença for alta, revisar processo ou ficha técnica.'],
            ready: 'O lote tem status de resultado e uma mensagem simples sobre o que aconteceu.'
          },
          {
            title: '9. Movimentações de produção',
            path: 'Produção > Movimentações',
            intro: 'As movimentações mostram o que entrou e saiu por causa da produção.',
            subtopics: [
              { title: 'Saída de ingredientes', text: 'Quando a produção é concluída, O BocaFood registra saída dos ingredientes previstos no snapshot.' },
              { title: 'Entrada de produto produzido', text: 'A quantidade produzida real entra como produto produzido no estoque.' }
            ],
            why: 'Isso cria a base do estoque a partir da produção sem precisar calcular saldo manualmente.',
            after: 'O estoque consegue considerar entrada de produto produzido e saída de ingredientes.',
            cautions: ['Movimentação deve ser criada somente uma vez por ordem.', 'Nesta etapa usa consumo previsto, não consumo real ingrediente por ingrediente.', 'Não alterar movimentação antiga sem motivo claro.'],
            ready: 'A ordem concluída mostra que as movimentações foram geradas e quantas foram criadas.'
          },
          {
            title: '10. Lista de compras da produção',
            path: 'Produção > Lista de compras',
            intro: 'A lista de compras ajuda a planejar o que falta comprar para produzir.',
            fill: ['tipo de geração', 'classe de produto', 'itens necessários', 'quantidade sugerida', 'status comprado ou não', 'lista para impressão com checkbox'],
            why: 'Ela transforma produção planejada e necessidade de reposição em uma lista prática para comprar.',
            after: 'A lista fica salva para consulta e abre em um modal com resumo e itens.',
            cautions: ['Por enquanto, a lista não precisa criar compra automaticamente.', 'Usar status para controlar se já comprou.', 'Conferir unidade e quantidade antes de imprimir ou comprar.'],
            ready: 'A lista gerada mostra itens claros, quantidades e status de compra.'
          },
          {
            title: '11. Produção e estoque mínimo',
            path: 'Produção > Ordens de produção',
            intro: 'A produção ajuda a identificar necessidade de produzir com base no estoque mínimo.',
            fill: ['produto produzido', 'estoque atual', 'estoque mínimo', 'quantidade necessária', 'botão para gerar planejamento quando disponível'],
            why: 'Se o produto produzido está abaixo do mínimo, o BocaFood ajuda a sugerir uma nova ordem.',
            after: 'A usuária consegue transformar necessidade em planejamento de produção.',
            cautions: ['Estoque mínimo deve estar cadastrado na origem correta.', 'Não gerar ordem sem revisar demanda real.', 'Produtos sem vínculo correto ficam fora na necessidade.'],
            ready: 'A tela mostra quando há produto produzido precisando de reposição.'
          },
          {
            title: '12. Quando você trabalha por etapas',
            path: 'Produção > Receitas de produção',
            intro: 'Alguns negócios produzem bases antes e montam o produto final só quando entra pedido.',
            subtopics: [
              { title: 'Exemplo', text: 'Você produz massa e recheio, guarda essas bases, e monta o salgado final quando a cliente pede.' },
              { title: 'Como controlar', text: 'Cadastre massa e recheio como bases de produção, controle entrada e perda dessas bases e vincule o produto final à receita correta.' }
            ],
            why: 'Esse jeito de trabalhar precisa controlar a etapa intermediária, porque também existe estoque, perda e custo antes do produto final.',
            after: 'O BocaFood consegue diferenciar base produzida, produto produzido e produto vendido.',
            cautions: ['Registrar perda da base se estragar.', 'Não misturar tudo em uma única ficha se você precisa controlar as etapas separadas.', 'Usar classe correta para a base aparecer no estoque certo.'],
            ready: 'As bases aparecem separadas dos produtos finais e ficam prontas para produção antes.'
          },
          {
            title: '13. Como saber que Produção está pronta',
            lines: [
              'Os principais insumos estão cadastrados.',
              'As receitas importantes têm ingredientes, rendimento e custo previsto.',
              'Bases de produção estão separadas quando o negócio trabalha por etapas.',
              'Produtos produzidos têm vínculo com ficha técnica.',
              'Ordens são criadas com quantidade e data prevista.',
              'Ordens concluídas mostram quantidade real, perda e diferença de rendimento.',
              'Movimentações de produção são geradas uma única vez.',
              'A lista de compras é gerada e acompanhada por status.'
            ],
            ready: 'Se esses pontos estão funcionando, Produção já serve como base para estoque, compras e margem.'
          },
          {
            title: '14. Erros comuns em Produção',
            lines: [
              'Cadastrar receita sem rendimento.',
              'Usar ingrediente sem custo.',
              'Produzir sem finalizar a ordem.',
              'Finalizar ordem com quantidade real errada.',
              'Não registrar perda.',
              'Misturar base de produção com produto final.',
              'Produto vendido sem vínculo com produto produzido.',
              'Gerar movimentação duplicada para a mesma ordem.',
              'Alterar ficha técnica e achar que isso deve mudar ordem antiga.'
            ],
            why: 'Esses erros prejudicam custo, estoque, lista de compras e leitura real do lote.'
          }
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
          ['Produtos e insumos comprados', 'O que entra por compra e alimenta receitas, estoque ou venda direta.', 'inventory_2'],
          ['Financeiro da compra', 'Conta a pagar, forma de pagamento, vencimento e categoria.', 'account_balance_wallet']
        ],
        intro: [
          'Compras é a área para registrar tudo que entra no negócio vindo de fornecedor ou compra direta.',
          'Ela ajuda a controlar custo, recebimento, estoque e financeiro. Quando uma compra é bem registrada, o BocaFood entende o que foi comprado, quanto custou, se já chegou e se precisa entrar no estoque.',
          'Essa área é especialmente importante para ingredientes, embalagens, produtos prontos comprados e materiais usados na operação.'
        ],
        topics: [
          {
            title: '1. Quando registrar uma compra',
            path: 'Compras',
            intro: 'Registre uma compra sempre que algo entra no negócio e precisa ser controlado.',
            fill: ['ingredientes', 'embalagens', 'produto pronto comprado', 'material operacional', 'item administrativo quando fizer sentido', 'serviço ou compra com impacto financeiro'],
            why: 'A compra ajuda a atualizar custos, alimentar estoque e mostrar para onde o dinheiro está indo.',
            after: 'A compra gera conta a pagar, atualizar custo do item e criar entrada de estoque quando for recebida.',
            cautions: ['Não registrar compra duplicada.', 'Não marcar como recebida se o item ainda não chegou.', 'Conferir se o item comprado existe no cadastro correto.'],
            ready: 'Toda compra importante aparece registrada com fornecedor, itens, valores e status.'
          },
          {
            title: '2. Criar ou editar registro de compra',
            path: 'Compras > Novo registro ou Compras > Editar registro',
            intro: 'Aqui você informa os dados principais da compra.',
            fill: ['fornecedor', 'data da compra', 'itens comprados', 'quantidade', 'unidade', 'valor unitário', 'valor total', 'documento ou nota, se tiver', 'forma de pagamento', 'vencimento', 'observações'],
            why: 'Essas informações permitem saber o que foi comprado, quanto custou e quando precisa pagar.',
            after: 'A compra fica na listagem e alimenta financeiro e estoque conforme o status.',
            cautions: ['Conferir moeda nos campos de valor.', 'Quantidade e unidade precisam fazer sentido com o item.', 'Forma de pagamento deve vir das configurações financeiras.', 'Não remover item sem revisar o total.'],
            ready: 'O total da compra bate com os itens e os dados financeiros estão coerentes.'
          },
          {
            title: '3. Itens da compra',
            path: 'Compras > Novo registro ou Compras > Editar registro',
            intro: 'Os itens são aquilo que foi comprado dentro do registro.',
            fill: ['item cadastrado', 'classe do item', 'quantidade', 'unidade', 'valor unitário', 'desconto quando existir', 'subtotal'],
            why: 'O item comprado atualiza custo, entrar no estoque e alimentar receitas ou produtos prontos.',
            after: 'Quando a compra é recebida, cada item gera uma movimentação de entrada no estoque.',
            cautions: ['Escolher o item correto, não apenas escrever um nome parecido.', 'Separar insumo de produto pronto comprado.', 'Conferir se o valor unitário está em moeda e não multiplicado errado.'],
            ready: 'Cada item da compra está identificado e com quantidade e valor corretos.'
          },
          {
            title: '4. Fornecedores',
            path: 'Compras > Fornecedores ou Configurações > Fornecedores',
            intro: 'Fornecedor é quem vende para o negócio.',
            fill: ['nome', 'contato', 'WhatsApp', 'e-mail', 'documento fiscal quando houver', 'endereço', 'observações', 'condições comerciais'],
            why: 'Com fornecedor cadastrado, fica mais fácil repetir compras, acompanhar custos e saber de onde veio cada item.',
            after: 'O fornecedor aparece no registro de compra e como fornecedor padrão de alguns itens.',
            cautions: ['Não duplicar fornecedor com nomes diferentes.', 'Guardar contato útil para recompra.', 'Conferir dados fiscais se a loja usa esse controle.'],
            ready: 'Os fornecedores principais aparecem disponíveis na compra.'
          },
          {
            title: '5. Recebimento da compra',
            path: 'Compras > Editar registro > Confirmar recebimento',
            intro: 'Recebimento é o momento em que a compra realmente chegou.',
            fill: ['data de recebimento', 'quantidade recebida quando houver conferência', 'valor recebido quando aplicável', 'observação de recebimento'],
            why: 'A compra só deve alimentar estoque quando o item chegou de verdade.',
            after: 'Ao confirmar recebimento, o BocaFood gera entrada de estoque do tipo compra.',
            cautions: ['Não confirmar recebimento antes de conferir os itens.', 'Valor recebido deve estar em moeda.', 'Se chegou diferente do comprado, registrar observação ou ajustar antes de confirmar.'],
            ready: 'A compra aparece como recebida e os itens entram no estoque quando aplicável.'
          },
          {
            title: '6. Entrada de estoque pela compra',
            path: 'Compras > Confirmar recebimento',
            intro: 'Quando a compra é recebida, os itens entram no estoque automaticamente.',
            fill: ['item comprado', 'quantidade', 'unidade', 'custo unitário', 'custo total', 'data da movimentação'],
            why: 'Isso faz o estoque refletir o que chegou no negócio sem precisar lançar tudo manualmente.',
            after: 'O estoque passa a considerar `entrada_compra` como entrada do item.',
            cautions: ['A entrada deve ser gerada somente uma vez por compra/item.', 'Compra antiga precisa de ação manual para gerar entrada se ainda não foi movimentada.', 'Não alterar histórico sem motivo claro.'],
            ready: 'A compra recebida mostra entrada de estoque sem duplicidade.'
          },
          {
            title: '7. Produtos e insumos comprados',
            path: 'Produção > Insumos ou Cardápio > Produtos',
            intro: 'Antes de comprar, o item precisa existir na origem correta.',
            subtopics: [
              { title: 'Insumo', text: 'Ingrediente, embalagem ou material usado em receita, produção ou operação.' },
              { title: 'Produto pronto comprado', text: 'Item comprado pronto para vender, como bebida ou produto embalado.' },
              { title: 'Material operacional', text: 'Item usado na rotina, mas que não necessariamente vira produto vendido.' }
            ],
            why: 'Se a origem estiver errada, a compra entra no estoque errado ou não atualizar custo onde deveria.',
            after: 'O item comprado alimenta ficha técnica, estoque, produto pronto e margem.',
            cautions: ['Não cadastrar bebida vendida como ingrediente se ela é produto pronto comprado.', 'Não cadastrar ingrediente como produto vendido se ele não é vendido direto.', 'Estoque mínimo e máximo devem estar na origem do item quando possível.'],
            ready: 'Cada item comprado tem uma classe clara e aparece no lugar certo.'
          },
          {
            title: '8. Financeiro da compra',
            path: 'Compras > Novo registro ou Editar registro',
            intro: 'A compra também precisa conversar com o financeiro.',
            fill: ['forma de pagamento', 'conta financeira', 'categoria de saída', 'vencimento', 'status pago ou pendente', 'valor total'],
            why: 'Comprar impacta o caixa. Se não entrar no financeiro, o negócio acha que sobrou mais dinheiro do que realmente sobrou.',
            after: 'A compra gera ou atualizar uma saída/conta a pagar no financeiro.',
            cautions: ['Categoria de saída deve diferenciar despesa, custo direto e custo indireto quando aplicável.', 'Não duplicar conta a pagar para a mesma compra.', 'Conferir se o valor total não foi multiplicado errado.'],
            ready: 'A compra aparece conectada ao financeiro com categoria, vencimento e valor corretos.'
          },
          {
            title: '9. Status da compra',
            path: 'Compras',
            intro: 'O status mostra em que ponto a compra está.',
            fill: ['rascunho ou em aberto', 'recebida', 'paga', 'pendente', 'cancelada quando existir'],
            why: 'Status claro evita confundir compra registrada com compra recebida ou paga.',
            after: 'Listagem, estoque e financeiro conseguem interpretar melhor o que fazer com aquela compra.',
            cautions: ['Recebida não significa necessariamente paga.', 'Paga não significa necessariamente recebida.', 'Cancelar compra deve impedir movimentação indevida quando aplicável.'],
            ready: 'A compra mostra claramente se foi recebida e se foi paga.'
          },
          {
            title: '10. Custo atualizado pela compra',
            path: 'Compras > Confirmar recebimento',
            intro: 'Uma compra atualiza o custo atual do item comprado.',
            fill: ['custo unitário', 'data da última compra', 'fornecedor', 'unidade'],
            why: 'Custo atualizado melhora ficha técnica, margem, preço sugerido e leitura do negócio.',
            after: 'O item passa a mostrar custo mais recente para uso em receitas, estoque e análises.',
            cautions: ['Conferir unidade antes de atualizar custo.', 'Compra com unidade diferente precisa ser convertida corretamente.', 'Custo errado prejudica preço e margem.'],
            ready: 'O custo atual do item reflete a compra recebida mais confiável.'
          },
          {
            title: '11. Compras antigas',
            path: 'Compras',
            intro: 'Compras antigas ficam sem movimentação de estoque se foram criadas antes dessa integração.',
            fill: ['ação manual para gerar entrada quando disponível', 'conferência de duplicidade', 'status recebido'],
            why: 'Não é seguro movimentar estoque antigo automaticamente sem a usuária confirmar.',
            after: 'A compra antiga ganha entrada de estoque quando a ação manual for usada com segurança.',
            cautions: ['Não gerar entrada duplicada.', 'Só gerar entrada se a compra realmente chegou.', 'Revisar itens antes de movimentar.'],
            ready: 'Compras antigas importantes foram conferidas e movimentadas apenas uma vez.'
          },
          {
            title: '12. Como saber que Compras está pronta',
            lines: [
              'Fornecedores principais estão cadastrados.',
              'Itens comprados existem na origem correta.',
              'Registro de compra aceita itens, quantidades e valores corretos.',
              'Forma de pagamento vem das configurações financeiras.',
              'Categoria de saída conversa com Financeiro.',
              'Recebimento gera entrada de estoque quando aplicável.',
              'Compra não gera movimentação duplicada.',
              'Custo do item é atualizado de forma coerente.'
            ],
            ready: 'Se esses pontos estão ok, Compras já alimenta estoque, custo e financeiro com mais confiança.'
          },
          {
            title: '13. Erros comuns em Compras',
            lines: [
              'Registrar compra sem fornecedor quando ele deveria existir.',
              'Escolher item errado ou duplicado.',
              'Informar valor unitário como total.',
              'Confirmar recebimento antes da entrega real.',
              'Gerar entrada de estoque duas vezes.',
              'Não vincular forma de pagamento.',
              'Usar categoria financeira genérica demais.',
              'Misturar produto pronto comprado com ingrediente.',
              'Não conferir unidade antes de atualizar custo.'
            ],
            why: 'Esses erros prejudicam estoque, custo, margem e caixa.'
          }
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
        ],
        intro: [
          'Estoque é a área para entender o que entrou, o que saiu e o que ainda existe no negócio.',
          'No BocaFood, o saldo não deve ser inventado manualmente como primeira regra. Ele nasce das movimentações: compras recebidas, produções concluídas, vendas, ajustes e inventários.',
          'Quando o estoque está bem conectado, você consegue saber se precisa comprar, produzir, ajustar ou investigar uma diferença.'
        ],
        topics: [
          {
            title: '1. Como o estoque é calculado',
            path: 'Estoque > Itens em estoque',
            intro: 'O saldo é calculado a partir das movimentações registradas.',
            subtopics: [
              { title: 'Entradas', text: 'Compra recebida, produção concluída, ajuste positivo ou inventário que aumenta saldo.' },
              { title: 'Saídas', text: 'Uso em produção, venda, ajuste negativo, perda ou inventário que reduz saldo.' }
            ],
            why: 'Essa lógica evita que o número do estoque seja só um campo editado sem histórico. Toda mudança importante precisa ter origem.',
            after: 'A tela de itens soma entradas e subtrai saídas para mostrar saldo atual.',
            cautions: ['Se uma compra não foi recebida, ela não deve entrar no estoque.', 'Se uma produção não foi finalizada, o produto produzido ainda não entrou.', 'Se uma venda não tem vínculo com item de estoque, fica sem baixa de estoque.'],
            ready: 'O saldo mostrado consegue ser explicado pelas movimentações relacionadas.'
          },
          {
            title: '2. Tipos de estoque',
            path: 'Estoque > Itens em estoque',
            intro: 'Os itens aparecem separados por classe para não misturar coisas diferentes.',
            subtopics: [
              { title: 'Insumo', text: 'Ingrediente, embalagem ou item usado em receita, produção ou operação.' },
              { title: 'Produto pronto comprado', text: 'Item comprado pronto para revender, como bebida ou produto embalado.' },
              { title: 'Produto produzido', text: 'Item que entrou no estoque depois de uma produção concluída.' },
              { title: 'Base de produção', text: 'Massa, recheio, molho ou etapa intermediária que entra em outro produto.' }
            ],
            why: 'Cada classe tem uma origem e uma forma diferente de entrar ou sair do estoque.',
            after: 'A tela mostra abas separadas para cada classe e facilitar a leitura.',
            cautions: ['Tipo de estoque deve vir da origem correta do item.', 'Produto produzido deve respeitar a classe da ficha/produção.', 'Produto comprado pronto não deve ser tratado como ingrediente se é vendido direto.'],
            ready: 'Os itens aparecem na classe certa, sem precisar adivinhar o que são.'
          },
          {
            title: '3. Itens em estoque',
            path: 'Estoque > Itens em estoque',
            intro: 'Esta tela mostra o saldo atual de cada item.',
            fill: ['item', 'tipo de estoque', 'saldo atual', 'unidade', 'valor estimado em estoque', 'última movimentação', 'origem das movimentações'],
            why: 'Ela ajuda a ver rapidamente o que tem, o que está baixo e o que precisa de atenção.',
            after: 'Ao clicar em um item, você vê detalhes e movimentações relacionadas.',
            cautions: ['Saldo sem custo informado mostra valor estimado incompleto.', 'Se o tipo estiver errado, revisar a origem do produto/insumo.', 'Não usar estoque como cadastro duplicado do produto.'],
            ready: 'A lista mostra itens com saldo, unidade e tipo corretos.'
          },
          {
            title: '4. Detalhe do item',
            path: 'Estoque > Itens em estoque > Abrir item',
            intro: 'O detalhe mostra de onde veio o saldo daquele item.',
            fill: ['saldo atual', 'entradas', 'saídas', 'valor estimado', 'última atualização', 'movimentações relacionadas'],
            why: 'Quando o saldo parece estranho, o detalhe ajuda a investigar o histórico.',
            after: 'Você consegue ver compras, produções, vendas e ajustes ligados ao item.',
            cautions: ['Movimentações relacionadas crescem, por isso precisam de busca e paginação.', 'Não corrigir saldo sem entender a origem da diferença.', 'Conferir se venda ou produção gerou movimento duplicado.'],
            ready: 'O detalhe explica o saldo sem depender de suposição.'
          },
          {
            title: '5. Entrada por compra',
            path: 'Compras > Confirmar recebimento',
            intro: 'Quando uma compra é recebida, o item comprado entra no estoque.',
            fill: ['item comprado', 'quantidade', 'unidade', 'custo unitário', 'custo total', 'data da movimentação'],
            why: 'Compra registrada não significa item disponível. O estoque só deve aumentar quando a compra chegou.',
            after: 'A movimentação aparece como entrada de compra e aumenta o saldo do item.',
            cautions: ['Gerar entrada somente uma vez por compra/item.', 'Não receber compra antes de conferir.', 'Compras antigas precisam de ação manual segura se ainda não entraram no estoque.'],
            ready: 'A compra recebida aparece como origem de entrada no detalhe do item.'
          },
          {
            title: '6. Entrada por produção',
            path: 'Produção > Ordens de produção > Finalizar produção',
            intro: 'Quando uma produção é concluída, o produto produzido entra no estoque.',
            fill: ['ordem de produção', 'produto produzido', 'quantidade real produzida', 'unidade', 'custo estimado', 'data real'],
            why: 'O produto só existe no estoque depois que foi produzido de verdade.',
            after: 'A movimentação aparece como entrada de produção e aumenta o saldo do produto produzido ou base.',
            cautions: ['Finalizar produção somente com quantidade real.', 'Não gerar entrada duplicada para a mesma ordem.', 'Produto vendido precisa estar vinculado ao produto produzido para baixar depois.'],
            ready: 'A ordem concluída gerou entrada de produto produzido uma única vez.'
          },
          {
            title: '7. Saída por produção',
            path: 'Produção > Ordens de produção > Finalizar produção',
            intro: 'Ao produzir, os ingredientes previstos saem do estoque.',
            fill: ['ingrediente', 'quantidade prevista', 'unidade', 'custo unitário', 'custo total', 'ordem de produção'],
            why: 'Produzir consome ingredientes. Essa saída mostra o que foi usado para gerar o lote.',
            after: 'A movimentação aparece como saída de produção e reduz o saldo dos ingredientes.',
            cautions: ['Nesta fase, a saída usa consumo previsto do snapshot, não consumo real ingrediente por ingrediente.', 'Se houve perda real diferente, registrar no resultado da produção.', 'Não recalcular usando ficha técnica atual.'],
            ready: 'A produção concluída mostra os ingredientes consumidos e o produto produzido.'
          },
          {
            title: '8. Saída por venda',
            path: 'Pedidos > Pedidos ou Venda presencial',
            intro: 'Quando uma venda é confirmada, o item vendido sai do estoque.',
            fill: ['pedido', 'produto vendido', 'quantidade', 'unidade', 'vínculo com ficha técnica, produto produzido ou produto pronto comprado'],
            why: 'Venda sem baixa deixa o estoque maior do que deveria.',
            after: 'A movimentação aparece como saída de venda e reduz o saldo do item vendido.',
            cautions: ['Se não houver vínculo com estoque, o pedido não deve ser bloqueado, mas o item fica sem baixar.', 'Produto produzido baixa pelo identificador usado na entrada da produção.', 'Produto pronto comprado baixa direto do item comprado pronto.'],
            ready: 'Venda confirmada gera saída do estoque quando o produto tem vínculo correto.'
          },
          {
            title: '9. Registro de perda',
            path: 'Estoque > Ajustar estoque',
            intro: 'Use perda quando um item não serve mais ou vendido.',
            fill: ['item', 'quantidade perdida', 'motivo', 'data', 'observação'],
            why: 'Perda precisa aparecer para o negócio entender desperdício e custo real.',
            after: 'A perda reduz o saldo e fica registrada no histórico do item.',
            cautions: ['Não usar venda como perda.', 'Não usar perda para corrigir erro de cadastro sem explicar.', 'Registrar motivo ajuda a evitar repetição.'],
            ready: 'A perda aparece como saída clara e com motivo.'
          },
          {
            title: '10. Ajustar estoque',
            path: 'Estoque > Ajustar estoque',
            intro: 'Use ajuste quando o saldo do BocaFood não bate com a quantidade real.',
            fill: ['item', 'tipo de ajuste', 'quantidade', 'motivo', 'observação'],
            why: 'Ajuste corrige diferença sem apagar o histórico.',
            after: 'O ajuste cria movimentação positiva ou negativa e altera o saldo calculado.',
            cautions: ['Antes de ajustar, conferir se não faltou receber compra ou finalizar produção.', 'Não usar ajuste como rotina para tudo.', 'Sempre registrar motivo.'],
            ready: 'O saldo fica igual ao real e o motivo da correção fica registrado.'
          },
          {
            title: '11. Estoque mínimo e máximo',
            path: 'Estoque > Estoque mínimo e máximo',
            intro: 'Mínimo e máximo ajudam a saber quando comprar ou produzir.',
            fill: ['estoque mínimo', 'estoque máximo', 'unidade', 'item de origem'],
            why: 'Mínimo evita faltar item. Máximo ajuda a não comprar ou produzir demais.',
            after: 'Produção e lista de compras usam esses limites para sugerir reposição.',
            cautions: ['O valor deve ser alterado na origem do item quando possível.', 'Mínimo de produto produzido sugere produção.', 'Mínimo de insumo sugere compra.'],
            ready: 'Itens importantes têm mínimo e máximo coerentes com a rotina.'
          },
          {
            title: '12. Inventário em lote',
            path: 'Estoque > Inventário em lote',
            intro: 'Inventário é a conferência física de vários itens.',
            fill: ['itens conferidos', 'quantidade real', 'diferença', 'motivo', 'data'],
            why: 'Ajuda a colocar o estoque em dia quando há muitas diferenças acumuladas.',
            after: 'O BocaFood gera ajustes para deixar o saldo igual ao que foi contado.',
            cautions: ['Fazer inventário com calma.', 'Não misturar contagem antiga com contagem nova.', 'Revisar diferenças grandes antes de salvar.'],
            ready: 'Os itens conferidos ficam com saldo alinhado à contagem real.'
          },
          {
            title: '13. Valor estimado em estoque',
            path: 'Estoque > Itens em estoque',
            intro: 'O valor estimado mostra quanto aquele saldo representa em dinheiro.',
            fill: ['saldo atual', 'custo unitário', 'custo estimado total'],
            why: 'Ajuda a entender quanto dinheiro está parado em estoque.',
            after: 'O estoque mostra valor estimado quando existe custo suficiente.',
            cautions: ['Se não houver custo, O BocaFood mostra sem custo informado.', 'Valor estimado não substitui fechamento contábil.', 'Custo errado gera valor estimado errado.'],
            ready: 'Itens com custo mostram valor estimado coerente.'
          },
          {
            title: '14. Como saber que Estoque está pronto',
            lines: [
              'Itens aparecem separados por classe.',
              'Compras recebidas geram entrada.',
              'Produções concluídas geram entrada de produto produzido.',
              'Produções concluídas geram saída de ingredientes quando aplicável.',
              'Vendas confirmadas baixam produto vendido quando há vínculo.',
              'Perdas e ajustes ficam registrados como movimentação.',
              'Mínimo e máximo estão cadastrados nos itens importantes.',
              'Detalhe do item mostra movimentações relacionadas.',
              'Saldo atual fica explicado pelo histórico.'
            ],
            ready: 'Se esses pontos estão funcionando, o estoque já ajuda a decidir compra, produção e reposição.'
          },
          {
            title: '15. Erros comuns em Estoque',
            lines: [
              'Achar que compra registrada já entrou no estoque sem confirmar recebimento.',
              'Finalizar produção duas vezes.',
              'Produto vendido sem vínculo com estoque.',
              'Produto pronto comprado cadastrado como insumo.',
              'Produto produzido sem ficha técnica.',
              'Usar ajuste para corrigir tudo sem investigar.',
              'Não registrar perda.',
              'Mínimo e máximo cadastrados no lugar errado.',
              'Valor estimado zerado por falta de custo.'
            ],
            why: 'Esses erros fazem o saldo parecer certo na tela, mas errado na prática.'
          }
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
        ],
        intro: [
          'Vendas e atendimento é a área onde a venda vira pedido, o pedido vira preparo, e a cliente recebe acompanhamento.',
          'Essa parte precisa guardar tudo que aconteceu: canal de venda, cliente, produtos, escolhas, entrega ou retirada, pagamento, descontos, pontos, status, financeiro e estoque.',
          'Quando o pedido está bem preenchido, o BocaFood consegue ajudar na cozinha, no caixa, na recompra, na avaliação e na leitura do crescimento.'
        ],
        topics: [
          {
            title: '1. Pedido recebido',
            path: 'Pedidos > Pedidos',
            intro: 'Aqui ficam os pedidos recebidos pela loja online, pedido manual, venda presencial ou outros canais conectados.',
            fill: ['cliente', 'canal de venda', 'produtos', 'quantidade', 'variações', 'adicionais', 'descontos', 'cupom', 'pontos', 'entrega ou retirada', 'pagamento', 'status'],
            why: 'O pedido é uma das principais fontes de verdade do BocaFood. Ele alimenta financeiro, estoque, clientes, programa de pontos, Performance, Temporadas e Maturidade.',
            after: 'A cada mudança de status, o pedido atualiza cozinha, financeiro, estoque, mensagens de WhatsApp e avaliação.',
            cautions: ['Conferir canal de venda.', 'Não deixar item sem variação obrigatória.', 'Conferir endereço quando for entrega.', 'Conferir forma de pagamento antes de concluir.'],
            ready: 'O pedido mostra cliente, itens, total, pagamento, entrega/retirada e status de forma clara.'
          },
          {
            title: '2. Criar pedido manual',
            path: 'Pedidos > Pedidos > Novo pedido',
            intro: 'Use quando a venda chegou fora da loja online.',
            fill: ['canal de venda', 'cliente existente ou cliente rápido', 'produtos pela busca', 'variações e escolhas', 'entrega ou retirada', 'data e horário', 'forma de pagamento', 'observações', 'descontos aplicáveis'],
            why: 'Pedido manual evita que vendas feitas pelo WhatsApp, Instagram, telefone ou balcão fiquem fora do BocaFood.',
            after: 'O pedido entra na listagem, vai para cozinha, financeiro, estoque, cliente e relatórios.',
            cautions: ['Selecionar canal antes do cliente.', 'Buscar cliente existente antes de cadastrar novo.', 'Se for entrega, usar endereço cadastrado ou cadastrar novo endereço atendido.', 'Produtos devem ser adicionados pela busca, não por cards desnecessários.'],
            ready: 'A venda manual entra como pedido completo e segue o mesmo fluxo dos outros pedidos.'
          },
          {
            title: '3. Cliente no pedido',
            path: 'Pedidos > Pedidos > Novo pedido',
            intro: 'O cliente vem do cadastro existente ou ser criado rapidamente durante o pedido.',
            fill: ['nome', 'WhatsApp', 'e-mail se houver', 'documento quando usado', 'endereços de entrega', 'preferências', 'alergias', 'observações'],
            why: 'Cliente bem conectado evita duplicidade, melhora entrega, histórico, pontos e atendimento futuro.',
            after: 'Os dados ficam disponíveis em Clientes e ficam prontos para reutilização em novos pedidos.',
            cautions: ['Não duplicar cliente pelo mesmo WhatsApp.', 'Telefone deve seguir o mesmo padrão usado em Configurações > Usuários.', 'Endereços de entrega devem ficar separados do WhatsApp.'],
            ready: 'O pedido usa o cliente certo e os dados ficam salvos para próximas compras.'
          },
          {
            title: '4. Endereço, entrega e retirada',
            path: 'Pedidos > Pedidos > Novo pedido',
            intro: 'Entrega e retirada precisam seguir a mesma lógica configurada na loja online.',
            fill: ['tipo de atendimento', 'endereço salvo ou novo endereço', 'data', 'horário', 'taxa de entrega', 'pedido mínimo quando existir'],
            why: 'Isso evita cobrar entrega errada, aceitar endereço fora da zona ou prometer horário indisponível.',
            after: 'O pedido guarda endereço, taxa, horário e tipo de atendimento para cozinha e entrega.',
            cautions: ['Se for retirada, não precisa pedir endereço da cliente.', 'Se for entrega, trazer taxa automaticamente conforme configuração.', 'Data e horário devem respeitar dias e horários disponíveis.'],
            ready: 'Entrega ou retirada aparece clara no pedido e no modo cozinha.'
          },
          {
            title: '5. Produtos, escolhas e observações',
            path: 'Pedidos > Pedidos > Novo pedido',
            intro: 'Cada item do pedido precisa guardar exatamente o que a cliente escolheu.',
            fill: ['produto', 'quantidade', 'valor unitário', 'variações', 'opções de combo', 'adicionais', 'observação do produto quando existir'],
            why: 'A cozinha precisa saber o que preparar e o BocaFood precisa calcular preço, desconto, estoque e financeiro corretamente.',
            after: 'As escolhas aparecem no detalhe do pedido e acompanham o item no atendimento.',
            cautions: ['Nome do produto não deve ser editado como se fosse cadastro do produto.', 'Editar pedido deve permitir ajustar escolhas, não alterar o produto original.', 'Botão de editar escolhas deve abrir acima do modal do pedido.'],
            ready: 'O item mostra produto, escolhas, quantidade, preço e subtotal sem dúvida.'
          },
          {
            title: '6. Pagamento no pedido',
            path: 'Pedidos > Pedidos > Novo pedido ou Detalhes do pedido',
            intro: 'Pagamento mostra como a cliente vai pagar ou pagou.',
            fill: ['forma de pagamento', 'status do pagamento', 'valor pago', 'troco quando existir', 'conta financeira quando aplicável'],
            why: 'Sem pagamento correto, o financeiro fica errado e a loja não sabe o que recebeu.',
            after: 'Pedidos confirmados ou pagos criam entrada financeira conforme o fluxo.',
            cautions: ['Forma de pagamento deve vir das configurações financeiras.', 'Canal de venda deve ser Cardápio quando vier da loja online.', 'Não abrir mensagem de WhatsApp se apenas salvou sem mudar status.'],
            ready: 'O pedido mostra forma de pagamento e total correto, e o financeiro reflete quando deve refletir.'
          },
          {
            title: '7. Promoções, cupons, pontos e upsell',
            path: 'Pedidos > Detalhes do pedido',
            intro: 'O pedido precisa guardar os benefícios usados pela cliente.',
            fill: ['promoção aplicada', 'cupom', 'desconto de pontos', 'upsell aceito', 'frete grátis quando existir', 'subtotal original', 'total final'],
            why: 'Esses dados mostram se uma ação de venda realmente ajudou ou apenas reduziu o resultado.',
            after: 'Ações de venda, Temporadas, Performance e financeiro analisam o impacto real.',
            cautions: ['Promoção precisa respeitar produto e período.', 'Cupom automático deve aplicar desconto pelo link quando configurado.', 'Pontos só devem ser resgatados se a cliente escolher usar.', 'Upsell só entra se a cliente aceitar.'],
            ready: 'O detalhe mostra desconto, benefício e total final sem esconder o valor original.'
          },
          {
            title: '8. Status do pedido',
            path: 'Pedidos > Pedidos ou Pedidos > Modo cozinha',
            intro: 'O status mostra em que etapa o pedido está.',
            fill: ['pendente', 'confirmado', 'em preparo', 'pronto', 'saiu para entrega ou aguardando retirada', 'entregue', 'cancelado quando aplicável'],
            why: 'Status certo orienta cozinha, atendimento, cliente, estoque, financeiro e mensagens.',
            after: 'Mudanças de status geram mensagem de WhatsApp, baixa de estoque, pontos ou entrada financeira.',
            cautions: ['Se salvar sem mudar status, não precisa abrir WhatsApp.', 'Checklist salva mesmo sem mudar status.', 'Pedido entregue envia link de avaliação.'],
            ready: 'A equipe entende rapidamente o que falta fazer no pedido.'
          },
          {
            title: '9. Modo cozinha',
            path: 'Pedidos > Modo cozinha',
            intro: 'Modo cozinha é a tela para acompanhar preparo, retirada e entrega com leitura rápida.',
            fill: ['pedido', 'cliente', 'tipo de atendimento', 'endereço quando for entrega', 'horário', 'status', 'checklist', 'itens dentro do detalhe'],
            why: 'A cozinha precisa de clareza, não de relatório cheio. O card deve mostrar o essencial e o detalhe abre o resto.',
            after: 'A equipe muda status, marca checklist e acompanha o pedido sem sair do fluxo.',
            cautions: ['No card não precisa listar todos os itens.', 'Endereço deve aparecer quando for entrega.', 'Detalhe deve manter a tela de cozinha no fundo.', 'Botão Fechar salva checklist e fechar modal.'],
            ready: 'A cozinha consegue saber o que preparar, para quem e quando entregar ou retirar.'
          },
          {
            title: '10. Detalhes do pedido',
            path: 'Pedidos > Pedidos > Abrir pedido',
            intro: 'O detalhe reúne tudo que importa sobre aquele pedido.',
            fill: ['resumo do pedido', 'cliente e entrega', 'pagamento', 'itens', 'descontos', 'status', 'checklist', 'histórico quando disponível'],
            why: 'É o lugar para revisar, corrigir ou acompanhar o pedido sem perder contexto.',
            after: 'Alterações atualizam itens, pagamento, status, financeiro e mensagens.',
            cautions: ['Campos devem ficar compactos e organizados.', 'Não mostrar UID técnico do cliente.', 'Não usar textos explicativos desnecessários dentro do modal.', 'Editar item deve permitir remover ou ajustar escolhas sem alterar cadastro do produto.'],
            ready: 'O modal mostra as informações certas sem parecer uma tela técnica.'
          },
          {
            title: '11. WhatsApp por status',
            path: 'Pedidos > Pedidos ou Pedidos > Modo cozinha',
            intro: 'Mudanças de status abrem mensagem para a cliente.',
            fill: ['mensagem no idioma da loja', 'nome da cliente quando útil', 'status do pedido', 'previsão ou informação importante', 'link de avaliação ao entregar'],
            why: 'A mensagem precisa falar com a cliente de forma humana, não técnica.',
            after: 'Ao mudar status, a loja envia uma mensagem pronta pelo WhatsApp.',
            cautions: ['Mensagem deve respeitar o idioma configurado no template da loja.', 'Se não mudou status, não abrir mensagem.', 'Na entrega, incluir link de avaliação com nome do link da loja e motivo para avaliar.'],
            ready: 'As mensagens parecem naturais e ajudam a cliente acompanhar o pedido.'
          },
          {
            title: '12. Avaliação depois da entrega',
            path: 'Pedidos > Pedidos',
            intro: 'Depois que o pedido é entregue, a cliente recebe o link para deixar opinião.',
            fill: ['link de avaliação com nome do link da loja', 'pedido relacionado', 'produto quando possível', 'mensagem convidando a avaliar'],
            why: 'Avaliação ajuda outras pessoas a confiar e mostra onde o negócio melhora.',
            after: 'A avaliação aparece na loja pública depois de aprovada e alimentar Maturidade.',
            cautions: ['Não usar link com termo técnico.', 'Não prometer que a avaliação será publicada imediatamente.', 'A mensagem deve convidar e ouvir a cliente, não pressionar.'],
            ready: 'Pedido entregue tem mensagem com link correto para avaliação.'
          },
          {
            title: '13. Baixa de estoque por venda',
            path: 'Pedidos > Pedidos',
            intro: 'Quando o pedido é confirmado ou concluído, o produto vendido sai do estoque.',
            fill: ['produto vendido', 'quantidade', 'vínculo com produto produzido, produto pronto comprado ou ficha técnica', 'status que dispara baixa'],
            why: 'Venda sem baixa deixa o estoque maior do que o real.',
            after: 'O estoque recebe movimentação de saída por venda quando o vínculo existe.',
            cautions: ['Produto sem vínculo não bloqueia pedido, mas fica sem baixar estoque.', 'Se o pedido for cancelado ou estornado, precisa haver lógica de devolução/perda quando aplicável.', 'Não baixar ingrediente direto quando o item vendido é produto produzido.'],
            ready: 'Pedido confirmado baixa o item certo uma única vez.'
          },
          {
            title: '14. Estorno, devolução e perda',
            path: 'Pedidos > Detalhes do pedido',
            intro: 'Use quando parte do pedido não deve continuar como venda normal.',
            subtopics: [
              { title: 'Devolver ao estoque', text: 'Use quando o item volta para venda, como uma bebida não retirada.' },
              { title: 'Registrar perda', text: 'Use quando o item não volta, como comida preparada que estragou ou não foi retirada.' }
            ],
            why: 'Nem todo cancelamento é igual. Alguns itens voltam para estoque, outros viram perda.',
            after: 'O estoque e o histórico do pedido ficam mais fiéis ao que aconteceu.',
            cautions: ['Não devolver comida preparada se ela não deve ser vendida de novo.', 'Registrar motivo ajuda a entender prejuízo.', 'Estorno financeiro e ajuste de estoque precisam conversar.'],
            ready: 'O pedido mostra o que foi devolvido, perdido ou ajustado.'
          },
          {
            title: '15. Clientes',
            path: 'Clientes',
            intro: 'Clientes guardam histórico e dados úteis para atendimento.',
            fill: ['nome', 'WhatsApp', 'e-mail', 'documento', 'aniversário', 'endereços', 'preferências', 'alergias', 'observações', 'avatar'],
            why: 'Cliente cadastrado facilita recompra, entrega, pontos, atendimento e campanhas.',
            after: 'Os dados aparecem em pedidos, cadastro público, programa de pontos e histórico.',
            cautions: ['Não duplicar cliente com mesmo telefone.', 'Endereços devem permitir mais de um cadastro.', 'Avatar precisa atualizar na lista e nos detalhes.'],
            ready: 'A cliente fica fácil de encontrar, editar e reutilizada em pedido novo.'
          },
          {
            title: '16. Como saber que Vendas e atendimento está pronto',
            lines: [
              'Pedido manual permite selecionar canal de venda.',
              'Busca de cliente encontra cadastros existentes.',
              'Cliente rápido salva dados essenciais e endereço quando necessário.',
              'Produtos entram por busca e pedem variações obrigatórias.',
              'Entrega e retirada seguem a configuração da loja online.',
              'Forma de pagamento vem das configurações financeiras.',
              'Promoções, cupons, pontos e upsell aparecem no pedido quando usados.',
              'Modo cozinha mostra card limpo e detalhe completo.',
              'Status salva checklist mesmo sem mudar etapa.',
              'Pedido entregue envia link de avaliação.',
              'Venda confirmada baixa estoque quando há vínculo correto.'
            ],
            ready: 'Se esses pontos estão funcionando, a venda entra completa e alimenta atendimento, financeiro, estoque e crescimento.'
          },
          {
            title: '17. Erros comuns em Vendas e atendimento',
            lines: [
              'Criar pedido sem canal de venda.',
              'Duplicar cliente em vez de buscar pelo cadastro existente.',
              'Não guardar endereço de entrega da cliente.',
              'Adicionar produto sem escolher variante obrigatória.',
              'Usar forma de pagamento que não existe nas configurações.',
              'Salvar pedido sem considerar promoção ou cupom aplicado.',
              'Abrir WhatsApp mesmo sem mudança de status.',
              'Mostrar dados técnicos no detalhe do pedido.',
              'Não baixar estoque de venda confirmada.',
              'Devolver ao estoque item que deveria ser perda.'
            ],
            why: 'Esses erros prejudicam atendimento, cozinha, financeiro, estoque e histórico da cliente.'
          }
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
          ['Link e publicação', 'Nome do link, status publicado, loja não publicada e domínio.', 'link'],
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
          ['Inteligência futura', 'Como dados de vendas, clientes, ações e estoque alimentam decisões.', 'psychology']
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
            '<h1 class="support-title">Documentação BocaFood</h1>' +
            '<p class="support-subtitle">Esta área será construída como uma documentação padrão: escolha uma categoria principal e veja o índice dos assuntos que serão detalhados aos poucos.</p>' +
          '</div>' +
          '<div class="help-search-row">' +
            '<input id="help-search" class="help-search" type="search" placeholder="Buscar área ou assunto..." oninput="Modules.Suporte._filterGuides(this.value)">' +
            '<button class="support-primary" type="button" onclick="Router.navigate(\'suporte/chamado\')"><span class="mi">support_agent</span>Abrir chamado</button>' +
          '</div>' +
        '</section>' +
        '<section class="docs-shell">' +
          '<aside class="docs-sidebar" aria-label="Áreas da documentação">' +
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
    var introHtml = (item.intro || []).length
      ? '<section class="docs-topic">' + item.intro.map(function (line) { return '<p>' + _esc(line) + '</p>'; }).join('') + '</section>'
      : '<section class="docs-topic"><h3>Como esta documentação será organizada</h3><ul>' +
        '<li>Cada categoria principal terá seus próprios assuntos internos.</li>' +
        '<li>Cada assunto poderá ganhar passo a passo, campos explicados, conexões com outras áreas e cuidados importantes.</li>' +
        '<li>Por enquanto, esta tela cria a estrutura para a documentação ser preenchida por partes.</li>' +
      '</ul></section>';
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
      introHtml +
      '<div class="docs-section-grid">' + sections.map(function (section) {
        return '<div class="docs-section-card">' +
          '<span class="mi">' + _esc(section[2] || 'article') + '</span>' +
          '<span><strong>' + _esc(section[0]) + '</strong><span>' + _esc(section[1]) + '</span></span>' +
        '</div>';
      }).join('') + '</div>' +
      '<div class="docs-topic-list">' + (item.topics || []).map(_docTopicHtml).join('') + '</div>' +
    '</article>';
  }

  function _docList(items) {
    return (items || []).length ? '<ul>' + items.map(function (line) { return '<li>' + _esc(line) + '</li>'; }).join('') + '</ul>' : '';
  }

  function _docBlock(title, content) {
    if (!content) return '';
    return '<div class="docs-block"><div class="docs-block-title">' + _esc(title) + '</div>' + content + '</div>';
  }

  function _docSubtopics(items) {
    if (!(items || []).length) return '';
    return '<div class="docs-subtopics">' + items.map(function (item) {
      return '<div class="docs-subtopic">' +
        '<strong>' + _esc(item.title || '') + '</strong>' +
        (item.text ? '<p>' + _esc(item.text) + '</p>' : '') +
        _docList(item.lines || []) +
      '</div>';
    }).join('') + '</div>';
  }

  function _docTopicHtml(topic) {
    if (Array.isArray(topic)) {
      return '<section class="docs-topic"><h3>' + _esc(topic[0]) + '</h3>' + _docList(topic[1] || []) + '</section>';
    }
    topic = topic || {};
    var html = '<section class="docs-topic"><h3>' + _esc(topic.title || '') + '</h3>';
    if (topic.path) html += '<div class="docs-path"><span class="mi">near_me</span><code>' + _esc(topic.path) + '</code></div>';
    if (topic.intro) html += '<p>' + _esc(topic.intro) + '</p>';
    html += _docSubtopics(topic.subtopics || []);
    html += _docBlock('Por que isso importa', topic.why ? '<p>' + _esc(topic.why) + '</p>' : '');
    html += _docBlock('O que preencher ou fazer', _docList(topic.fill || []));
    html += _docBlock('O que acontece depois', topic.after ? '<p>' + _esc(topic.after) + '</p>' : '');
    html += _docBlock('Cuidados comuns', _docList(topic.cautions || []));
    html += _docBlock('Como saber se está pronto', topic.ready ? '<p>' + _esc(topic.ready) + '</p>' : '');
    html += _docList(topic.lines || []);
    return html + '</section>';
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
            '<p class="support-subtitle">Guias rápidos para configurar sua loja, entender cada área e resolver dúvidas no BocaFood.</p>' +
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
            '<p>Acesse os guias pela área que você está usando agora.</p>' +
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
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar às áreas</button>' +
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
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar às áreas</button>' +
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
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar às áreas</button>' +
        '</div>' +
        '<div class="help-submodule-grid">' +
          _submoduleCard('suporte-abrir', 'support_agent', 'Abrir chamado', 'Quando usar o chamado e quais informações ajudam no atendimento.', 'suporte') +
          _submoduleCard('suporte-chamados', 'confirmation_number', 'Meus chamados', 'Como acompanhar os chamados enviados por esta conta.', 'suporte') +
        '</div>';
    } else {
      body = '<div class="help-guide-panel-head">' +
          '<div><h3>Primeiros passos</h3><p>Comece por um roteiro simples antes de avançar para configurações mais detalhadas.</p></div>' +
          '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar às áreas</button>' +
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
      '<button class="support-secondary" type="button" onclick="Modules.Suporte._clearGuidePanel()">Voltar às áreas</button>' +
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
          '<div><h3>Configurações → Usuário</h3><p>Esta tela fala sobre a pessoa que entra no Painel BocaFood. Ela não muda o nome da loja nem os dados comerciais do negócio; serve para identificar quem administra a conta, receber avisos importantes e recuperar o acesso quando necessário.</p></div>' +
          _guideBackButtons(moduleKey || 'configuracoes', 'Abrir Usuário', 'configuracoes/conta_usuario') +
        '</div>' +
        '<div class="support-guide-fields">' +
          '<div class="support-guide-field"><strong>Seu nome completo</strong><span>Preencha com o nome da pessoa que administra a conta. Esse campo é sobre você, não sobre a loja. Não coloque aqui o nome do negócio, nome comercial, marca ou nome do cardápio.</span></div>' +
          '<div class="support-guide-field"><strong>Como você quer ser chamada?</strong><span>Use um nome curto ou nome social. Esse nome ajuda a identificar melhor o usuário dentro da conta.</span></div>' +
          '<div class="support-guide-field"><strong>E-mail de acesso</strong><span>É o e-mail usado para entrar no Painel BocaFood. Por segurança, ele aparece bloqueado. Se você precisa trocar o e-mail, abra um chamado ou fale com o suporte para a equipe orientar a mudança corretamente.</span></div>' +
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
          '<div class="support-guide-field"><strong>Acesso</strong><span>Indica se sua conta está liberada para usar o Painel BocaFood. Quando aparece como ativa, você pode seguir configurando a loja normalmente. Se aparecer pendente ou bloqueada, abra um chamado para a equipe verificar.</span></div>' +
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
          ['Fornecedor', 'Escolha quem vendeu os itens. Use a busca para encontrar o fornecedor cadastrado. Ao selecionar, o sistema consegue mostrar o nome comercial e aproveitar formas de pagamento quando eles existirem.'],
          ['Nome comercial', 'Mostra como aquele fornecedor é conhecido no dia a dia. Esse campo ajuda você a confirmar se selecionou o fornecedor certo, principalmente quando o nome fiscal é diferente do nome usado comercialmente.'],
          ['Data da compra', 'Informe a data em que a compra aconteceu ou a data do documento recebido. Essa data ajuda a organizar o histórico e entender quando o custo foi atualizado.'],
          ['Número do documento', 'Use para guardar o número da nota, recibo, pedido, fatura ou referência do fornecedor. Se não houver documento, você pode deixar em branco ou usar uma identificação simples que ajude a reconhecer a compra depois.'],
          ['Status da compra', 'Use Pendente quando ainda falta receber ou revisar algo. Use Recebida quando a compra já entrou corretamente. Use Parcial quando só uma parte foi recebida. Use Cancelada quando o registro não deve mais entrar na organização da loja.'],
          ['Observações internas', 'Use para detalhes que ajudam você ou sua equipe: combinado com fornecedor, prazo, divergência de entrega, item substituído, valor combinado ou qualquer ponto que explique a compra.'],
          ['Itens comprados', 'Nesta parte você informa cada item recebido. Escolha o item, diga como ele veio do fornecedor, quantas embalagens vieram e qual foi o preço pago por embalagem. O BocaFood usa essas informações para calcular o custo real por unidade.'],
          ['Quantidade comprada', 'Informe quantas embalagens, caixas, sacos, unidades ou pacotes foram comprados. Se você comprou 3 sacos de farinha, a quantidade comprada é 3.'],
          ['Embalagem', 'Descreva como o item veio na compra: saco, caixa, garrafa, pacote, bandeja ou unidade. Esse campo ajuda a entender o preço informado e a leitura do estoque.'],
          ['Conteúdo da embalagem', 'Informe quanto vem dentro de cada embalagem. Exemplo: um saco com 5 kg, uma garrafa com 1 L ou uma caixa com 12 unidades. Esse número é usado para calcular quanto custa cada kg, litro ou unidade.'],
          ['Unidade usada no custo', 'É a unidade que o BocaFood usa para custo, estoque e receitas: kg, g, L, ml ou unidade. Ela vem do cadastro do item. Se estiver errada, ajuste primeiro em Produtos / Insumos.'],
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
          '<div><h3>Compras → Produtos / Insumos</h3><p>Use esta tela para cadastrar os itens que o negócio compra. Esses cadastros ajudam no registro de compras, no cálculo de custo e, quando for insumo, na preparação de receitas.</p></div>' +
          _guideBackButtons(moduleKey || 'compras', 'Abrir Produtos / Insumos', 'compras/itens') +
        '</div>' +
        _guideFields([
          ['Produto pronto ou insumo', 'Produto pronto é algo comprado para vender ou usar como item final, como bebida, doce de fornecedor ou produto revendido. Insumo é o que entra no preparo, montagem ou entrega, como farinha, chocolate, carne, molho, caixa, pote, saco, etiqueta ou descartável.'],
          ['Classe do item', 'Escolha Insumo para ingredientes e materiais usados no preparo, montagem ou entrega. Escolha Produto quando o item já chega pronto para vender. Caixa, pote, saco, etiqueta e descartável entram como insumo e podem ficar em uma categoria própria.'],
          ['Nome do item', 'Use um nome fácil de procurar. Prefira nomes claros, como Farinha de trigo, Batata, Caixa para bolo ou Refrigerante lata. Evite abreviações que você possa esquecer depois.'],
          ['Categoria', 'Pense na categoria como uma pasta para encontrar o item depois. Use nomes do dia a dia do negócio, como Bebidas, Carnes, Ingredientes secos, Embalagens, Descartáveis ou Congelados. Isso ajuda na busca, nos filtros e na leitura dos custos.'],
          ['Cadastro ativo', 'Itens ativos aparecem nas buscas e nos formulários de compra. Se você não usa mais um item, prefira desativar em vez de apagar quando ele já apareceu em compras antigas.'],
          ['Compra e custo', 'Use esta área para dizer como você costuma comprar esse item. Isso ajuda o BocaFood a preencher melhor o registro de compras e calcular custo por unidade, kg ou litro.'],
          ['Unidade base', 'É a unidade em que você compra e controla o custo desse item. Se compra batata por quilo, escolha kg. Se compra leite por litro, escolha L. Se compra refrigerante por unidade, escolha unidade. Essa unidade vira a base do custo, do estoque e das receitas.'],
          ['Fornecedor padrão', 'Preencha com o fornecedor de quem você compra esse item com mais frequência. Isso não impede comprar de outro fornecedor, mas deixa o lançamento mais rápido no dia a dia.'],
          ['Preço de compra base', 'Preencha uma primeira base de custo quando ainda não existe compra registrada. Esse valor já ajuda receitas, cardápio e Plano de Voo a começarem com uma referência real. Depois que compras forem registradas, o campo vira custo médio automático e passa a ser protegido para evitar alteração manual por engano.'],
          ['Embalagem de compra padrão', 'Informe como você costuma comprar esse item: saco, caixa, pacote, garrafa, bandeja ou unidade. Exemplo: batata em saco, leite em garrafa, ovos em caixa.'],
          ['Conteúdo por embalagem (×)', 'Informe quanto vem dentro da embalagem padrão. Exemplo: saco com 5 kg, garrafa com 1 L ou caixa com 12 unidades. Esse dado ajuda o BocaFood a calcular o custo real.'],
          ['Como preencher?', 'A ajuda aparece para insumos porque eles costumam entrar em receitas. Ela explica o exemplo da batata comprada em saco, mas usada por kg, para mostrar como embalagem e conteúdo trabalham juntos no custo.'],
          ['Estoque mínimo', 'Informe a quantidade que marca o momento de comprar mais. Exemplo: se você quer ser avisada quando restarem 2 kg de farinha, coloque 2 como estoque mínimo.'],
          ['Estoque máximo', 'Informe a maior quantidade que vale a pena manter guardada. Esse limite evita comprar além do espaço, validade ou necessidade do negócio.'],
          ['Custo atual', 'Esse campo é atualizado automaticamente pelo BocaFood quando você registra compras. Ele usa a média de compra do item e serve como referência para receitas, margens, cardápio e Plano de Voo. Se precisar corrigir o custo, ajuste a compra que gerou o valor.'],
          ['Última compra', 'Esse campo também é atualizado automaticamente. Ele mostra a última compra registrada para este item e ajuda a perceber se o custo está recente.'],
          ['Uso em receitas', 'Ative quando este item puder entrar na preparação dos seus produtos. Ao ativar, ele aparece na lista de ingredientes das receitas e o BocaFood usa o custo dele para calcular quanto cada produto custa para ser feito.'],
          ['Aproveitamento (%)', 'Informe quanto do item realmente entra na receita depois de limpar, descascar, cortar ou preparar. O jeito mais simples é pesar antes e depois. Exemplo: você comprou 1 kg e, depois de preparar, aproveitou 800 g. Como 800 g é 80% de 1 kg, preencha 80%. Use 100% quando tudo é aproveitado.'],
          ['Produto comprado pronto no cardápio', 'Quando quiser vender esse item para a cliente, vá em Cardápio > Produtos e crie o produto de venda usando este produto comprado pronto como origem. Assim o cadastro de compra fica separado do produto que aparece no cardápio.'],
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
          '<div class="support-guide-field"><strong>3. Publique só quando estiver pronta</strong><span>Antes de publicar, confira se há pelo menos produtos, categorias, canal de pedido e informações principais. Se algo estiver faltando, o BocaFood impede a publicação para evitar uma loja incompleta.</span></div>' +
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
                  '<option value="duvida">Dúvida sobre o Painel BocaFood</option>' +
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
