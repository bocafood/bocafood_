// js/modules/loja_online.js
window.Modules = window.Modules || {};
window.Modules.LojaOnline = (function () {
  'use strict';

  function render(sub) {
    var tab = sub || 'template';
    var templateTabs = { identidade: true, vitrine: true, operacao: true, atendimento: true, checkout: true, textos: true };
    if (templateTabs[tab]) {
      try { if (window.sessionStorage) sessionStorage.setItem('boca_template_initial_tab', tab); } catch (err) {}
      tab = 'template';
    }
    if (tab !== 'seo' && tab !== 'avaliacoes') tab = 'template';
    if (!window.Modules || !Modules.Catalogo || typeof Modules.Catalogo.render !== 'function') {
      var app = document.getElementById('app');
      if (app) app.innerHTML = '<div style="padding:24px;color:#6F6860;">Módulo de loja online indisponível.</div>';
      return;
    }
    Modules.Catalogo.render(tab);
  }

  function destroy() {}

  return {
    render: render,
    destroy: destroy
  };
})();
