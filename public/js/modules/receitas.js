// js/modules/receitas.js
window.Modules = window.Modules || {};
Modules.Receitas = (function () {
  'use strict';

  var _activeSub = 'receitas';
  var _recipeCategories = [];
  var _editingCategoryId = null;
  var _recipeComponents = [];
  var _editingComponentId = null;
  var _ingredientTypes = [];
  var _ingredientCategories = [];
  var _editingIngredientCatalogKind = null;
  var _editingIngredientCatalogId = null;
  var _units = [];
  var _editingUnitId = null;
  var _configSearch = '';
  var _productionOrders = [];
  var _productionRecipes = [];
  var _stockMovements = [];
  var _stockMovementFilter = 'todos';
  var _purchaseListState = { source: 'planejado', classe: 'insumo' };
  var _purchaseListData = { orders: [], recipes: [], movements: [], settings: [], costItems: [] };
  var _productionNeedData = { items: [], recipes: [], movements: [], settings: [] };
  var TABS = [
    { key: 'receitas', label: 'Receitas' },
    { key: 'ordens', label: 'Ordens' },
    { key: 'lista-compras', label: 'Lista de Compras' },
    { key: 'movimentacoes', label: 'Movimentações' },
    { key: 'insumos', label: 'Insumos' },
    { key: 'configuracoes', label: 'Configurações' }
  ];
  var CONFIG_TABS = [
    { key: 'componentes', label: 'Etapas da receita' },
    { key: 'categorias-receita', label: 'Categorias da receita' },
    { key: 'categorias-insumos', label: 'Categorias de insumos' },
    { key: 'unidades', label: 'Unidades' }
  ];

  function _labelStyle() { return 'font-size:11px;font-weight:600;color:#6F6860;display:block;margin-bottom:5px;letter-spacing:.02em;'; }
  function _inputStyle() { return 'width:100%;padding:10px 12px;border:1px solid #EAE4DA;border-radius:10px;font-size:14px;font-family:Manrope,Inter,sans-serif;outline:none;background:#fff;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);'; }
  function _cardStyle() { return 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);'; }
  function _sectionTitle(title, desc) {
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;"><div><div style="font-size:14px;font-weight:600;line-height:1.3;color:#1F1F1F;">' + _esc(title) + '</div><div style="font-size:13px;line-height:1.45;color:#6F6860;margin-top:4px;">' + _esc(desc || '') + '</div></div></div>';
  }
  function _primaryBtnStyle() { return 'height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;'; }
  function _secondaryBtnStyle() { return 'height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;'; }
  function _smallActionStyle(color) { return 'width:30px;height:30px;border-radius:9px;border:1px solid #EAE4DA;background:#fff;color:' + (color || '#6F6860') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(31,31,31,.03);'; }
  function _configMeta(key) {
    var map = {
      componentes: {
        title: 'Etapas da receita',
        desc: 'Cadastre etapas como massa, recheio, cobertura ou finalização para organizar melhor os ingredientes.',
        add: '+ Adicionar etapa'
      },
      'categorias-receita': {
        title: 'Categorias da receita',
        desc: 'Agrupe receitas parecidas para encontrar e organizar a produção com mais facilidade.',
        add: '+ Adicionar categoria'
      },
      'tipos-insumos': {
        title: 'Tipos de insumos',
        desc: 'Classifique os insumos usados na produção para manter compras e receitas mais organizadas.',
        add: '+ Adicionar tipo'
      },
      'categorias-insumos': {
        title: 'Categorias de insumos',
        desc: 'Categorias organizam insumos parecidos no mesmo grupo.',
        add: '+ Adicionar categoria'
      },
      unidades: {
        title: 'Unidades',
        desc: 'Cadastre as unidades usadas nos ingredientes, compras e rendimento das receitas.',
        add: '+ Adicionar unidade'
      }
    };
    return map[key] || map.componentes;
  }
  function _configStyles() {
    return '<style>' +
      '.recipes-config-wrap{display:flex;flex-direction:column;gap:16px;}' +
      '.recipes-config-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.recipes-config-title{font-size:22px;font-weight:700;line-height:1.15;margin:0 0 6px;color:#1F1F1F;}' +
      '.recipes-config-subtitle{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;}' +
      '.recipes-config-filter,.recipes-config-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;box-shadow:0 10px 24px rgba(31,31,31,.04);}' +
      '.recipes-config-filter{padding:14px;}' +
      '.recipes-config-filter-grid{display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:12px;align-items:end;}' +
      '.recipes-config-control{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.recipes-config-control:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.recipes-config-control input{width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;}' +
      '.recipes-config-chip-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;}' +
      '.recipes-config-chip{height:34px;padding:0 12px;border-radius:999px;border:1px solid #EADFD8;background:#fff;color:#6F6860;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;transition:background .16s ease,border-color .16s ease,color .16s ease;}' +
      '.recipes-config-chip.active{background:#FFF3F1;border-color:#D9AAA1;color:#B42318;}' +
      '.recipes-config-card{padding:18px 20px;}' +
      '.recipes-config-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;}' +
      '.recipes-config-section-title{font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.3;}' +
      '.recipes-config-section-desc{font-size:13px;color:#6F6860;line-height:1.45;margin-top:4px;}' +
      '.recipes-config-primary{height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.recipes-config-primary:hover{background:#9F1F16;transform:translateY(-1px);box-shadow:0 8px 18px rgba(180,35,24,.22);}' +
      '.recipes-config-list{display:flex;flex-direction:column;gap:10px;}' +
      '.recipes-config-row{background:#fff;border:1px solid #EADFD8;border-radius:14px;padding:13px 14px;box-shadow:0 1px 2px rgba(31,31,31,.03);display:flex;align-items:center;gap:12px;transition:background .15s ease,box-shadow .15s ease,transform .15s ease;}' +
      '.recipes-config-row:hover{background:#FFFCF8;box-shadow:0 8px 18px rgba(31,31,31,.04);transform:translateY(-1px);}' +
      '.recipes-config-row-title{font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.recipes-config-row-text{font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;}' +
      '.recipes-config-status{height:24px;padding:0 9px;border-radius:999px;border:1px solid #DDE8D9;background:#F5FBF2;color:#3F7A3D;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;}' +
      '.recipes-config-status.inactive{border-color:#E6DED8;background:#FAF8F4;color:#8A7E7C;}' +
      '.recipes-config-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}' +
      '.recipes-config-empty{text-align:center;padding:38px 18px;color:#8A7E7C;font-size:13px;line-height:1.45;border:1px dashed #EADFD8;border-radius:14px;background:#FFFCF8;}' +
      '@media(max-width:760px){.recipes-config-filter-grid{grid-template-columns:1fr}.recipes-config-chip-row{justify-content:flex-start}.recipes-config-row{align-items:flex-start;flex-direction:column}.recipes-config-actions{justify-content:flex-start}}' +
      '</style>';
  }

  function render(sub) {
    var normalized = _normalizeSub(sub || 'receitas');
    _activeSub = normalized.key;
    var app = document.getElementById('app');
    app.innerHTML = '<section class="module-page">' +
      '<div id="receitas-content" class="module-content"><div class="loading-inline">Carregando...</div></div>' +
      '</section>';
    _syncSideNav();
    if (normalized.redirect && window.Router && Router.current && Router.current() !== 'receitas/' + normalized.key) {
      Router.navigate('receitas/' + normalized.key);
    }
    _loadSub(_activeSub);
  }

  function _renderTabs() {
    var el = document.getElementById('receitas-tabs');
    if (!el) return;
    el.innerHTML = TABS.map(function (t) {
      var active = t.key === _mainSub(_activeSub);
      return '<button class="' + (active ? 'active' : '') + '" onclick="Modules.Receitas._switchSub(\'' + t.key + '\')">' + t.label + '</button>';
    }).join('');
  }

  function _switchSub(key) {
    key = _normalizeSub(key).key;
    _activeSub = key;
    _renderTabs();
    _syncSideNav();
    _loadSub(key);
    Router.navigate('receitas/' + key);
  }

  function _switchConfigSub(key) {
    _configSearch = '';
    _switchSub('configuracoes/' + key);
  }

  function _mainSub(key) {
    return String(key || '').split('/')[0] || 'receitas';
  }

  function _configSub(key) {
    var parts = String(key || '').split('/');
    return parts[0] === 'configuracoes' ? (parts[1] || 'componentes') : '';
  }

  function _normalizeSub(sub) {
    var key = String(sub || 'receitas').replace(/^\/+|\/+$/g, '');
    var redirect = false;
    if (!key) key = 'receitas';
    if (key === 'tipos') key = 'categorias-insumos';
    if (key === 'categorias') key = 'categorias-insumos';
    if (key === 'configuracoes') key = 'configuracoes/componentes';
    if (key === 'componentes' || key === 'categorias-receita' || key === 'tipos-insumos' || key === 'categorias-insumos' || key === 'unidades') {
      key = 'configuracoes/' + key;
      redirect = true;
    }
    if (key === 'categorias') {
      key = 'configuracoes/categorias-insumos';
      redirect = true;
    }
    if (key === 'configuracoes/categorias') {
      key = 'configuracoes/categorias-insumos';
      redirect = true;
    }
    if (key.indexOf('configuracoes/') === 0) {
      var subKey = key.split('/')[1] || 'componentes';
      if (!CONFIG_TABS.some(function (t) { return t.key === subKey; })) subKey = 'componentes';
      key = 'configuracoes/' + subKey;
    }
    if (!TABS.some(function (t) { return t.key === _mainSub(key); })) key = 'receitas';
    return { key: key, redirect: redirect };
  }

  function _syncSideNav() {
    if (_mainSub(_activeSub) !== 'configuracoes') return;
    var item = document.querySelector('[data-route="receitas/configuracoes"]');
    if (!item) return;
    item.classList.add('active');
    var parent = item.closest('.nav-group');
    if (parent) {
      parent.classList.add('expanded');
      var navItem = parent.querySelector('.nav-item');
      if (navItem) navItem.classList.add('active');
      var sub = parent.querySelector('.nav-sub');
      if (sub) sub.style.display = 'block';
    }
  }

  function _loadSub(key) {
    key = _normalizeSub(key).key;
    var content = document.getElementById('receitas-content');
    if (!content) return;

    if (key === 'receitas') {
      content.innerHTML = '<div id="catalogo-content"></div>';
      return Modules.Catalogo._renderFichas();
    }

    if (key === 'ordens') return _renderProductionOrders();
    if (key === 'lista-compras') return _renderPurchaseList();
    if (key === 'movimentacoes') return _renderStockMovements();

    content.innerHTML = '<div id="compras-content"></div>';
    if (key === 'insumos') return Modules.Compras._renderInsumos();
    if (_mainSub(key) === 'configuracoes') return _renderConfiguracoes(_configSub(key));
  }

  function _ordersStyles() {
    return '<style>' +
      '.production-orders-page{display:flex;flex-direction:column;gap:16px;}' +
      '.production-orders-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.production-orders-title{font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;}' +
      '.production-orders-subtitle{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;}' +
      '.production-orders-primary{height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.production-orders-primary:hover{background:#9F1F16;transform:translateY(-1px);box-shadow:0 8px 18px rgba(180,35,24,.22);}' +
      '.production-orders-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;box-shadow:0 10px 24px rgba(31,31,31,.04);padding:18px 20px;}' +
      '.production-orders-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;}' +
      '.production-orders-section-title{font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.3;}' +
      '.production-orders-section-desc{font-size:13px;color:#6F6860;line-height:1.45;margin-top:4px;}' +
      '.production-orders-list{display:flex;flex-direction:column;gap:10px;}' +
      '.production-orders-row{background:#fff;border:1px solid #EADFD8;border-radius:14px;padding:14px;box-shadow:0 1px 2px rgba(31,31,31,.03);display:grid;grid-template-columns:minmax(220px,1fr) minmax(120px,145px) minmax(120px,145px) minmax(110px,135px) minmax(120px,145px) auto;gap:12px;align-items:center;cursor:pointer;transition:background .15s ease,box-shadow .15s ease,transform .15s ease;}' +
      '.production-orders-row:hover{background:#FFFCF8;box-shadow:0 8px 18px rgba(31,31,31,.04);transform:translateY(-1px);}' +
      '.production-orders-row-title{font-size:15px;font-weight:650;color:#1F1F1F;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.production-orders-row-text{font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;}' +
      '.production-orders-label{font-size:10px;font-weight:650;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;}' +
      '.production-orders-value{font-size:13px;color:#1F1F1F;line-height:1.35;}' +
      '.production-orders-status{height:26px;padding:0 10px;border-radius:999px;border:1px solid #EADFD8;background:#FFF7F6;color:#B42318;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;}' +
      '.production-orders-status.done{border-color:#DDE8D9;background:#F5FBF2;color:#3F7A3D;}' +
      '.production-orders-status.cancelled{border-color:#E6DED8;background:#FAF8F4;color:#8A7E7C;}' +
      '.production-result-badge{min-height:26px;padding:4px 10px;border-radius:999px;border:1px solid #EADFD8;background:#FAF8F4;color:#6F6860;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;line-height:1.2;}' +
      '.production-result-badge.ok{background:#F5FBF2;border-color:#DDE8D9;color:#3F7A3D;}' +
      '.production-result-badge.warn{background:#FFF7ED;border-color:#FED7AA;color:#C2410C;}' +
      '.production-result-badge.danger{background:#FFF3F1;border-color:#F2B8B0;color:#B42318;}' +
      '.production-result-badge.up{background:#F0F7FF;border-color:#BFDBFE;color:#1D4ED8;}' +
      '.production-orders-icon{width:38px;height:38px;border-radius:12px;background:#FFF3F1;color:#B42318;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(180,35,24,.08);flex-shrink:0;}' +
      '.production-orders-empty{text-align:center;padding:42px 18px;color:#6F6860;font-size:13px;line-height:1.45;border:1px dashed #EADFD8;border-radius:14px;background:#FFFCF8;}' +
      '.production-modal-grid{display:grid;grid-template-columns:minmax(240px,1.4fr) minmax(120px,.7fr) minmax(150px,.8fr);gap:12px;align-items:start;}' +
      '.production-modal-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:16px;padding:16px;box-shadow:0 8px 22px rgba(31,31,31,.04);}' +
      '.production-modal-card-title{font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.3;margin-bottom:4px;}' +
      '.production-modal-card-desc{font-size:12px;color:#6F6860;line-height:1.45;margin-bottom:14px;}' +
      '.production-orders-secondary{height:38px;padding:0 14px;border:1px solid #EADFD8;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;}' +
      '.recipes-config-control{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:12px;padding:0 12px;min-height:42px;display:flex;align-items:center;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.recipes-config-control:focus-within{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.production-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:10px;}' +
      '.production-detail-tile{background:#FFFCF8;border:1px solid #EADFD8;border-radius:12px;padding:12px;}' +
      '.production-result-panel{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:14px;padding:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;}' +
      '.production-result-message{font-size:13px;color:#1F1F1F;line-height:1.45;margin-top:5px;max-width:680px;}' +
      '.production-ingredient-list{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto;padding-right:2px;}' +
      '.production-ingredient-row{background:#fff;border:1px solid #EADFD8;border-radius:12px;padding:10px 12px;display:grid;grid-template-columns:minmax(160px,1fr) minmax(90px,120px) minmax(90px,120px);gap:10px;align-items:center;}' +
      '.stock-movement-filter{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;box-shadow:0 10px 24px rgba(31,31,31,.04);padding:14px;display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap;}' +
      '.stock-movement-row{background:#fff;border:1px solid #EADFD8;border-radius:14px;padding:14px;box-shadow:0 1px 2px rgba(31,31,31,.03);display:grid;grid-template-columns:minmax(110px,135px) minmax(130px,170px) minmax(220px,1fr) minmax(110px,150px) minmax(180px,1fr);gap:12px;align-items:center;}' +
      '.stock-movement-type{height:26px;padding:0 10px;border-radius:999px;border:1px solid #EADFD8;background:#FAF8F4;color:#6F6860;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;}' +
      '.stock-movement-type.out{background:#FFF3F1;border-color:#F2B8B0;color:#B42318;}' +
      '.stock-movement-type.in{background:#F5FBF2;border-color:#DDE8D9;color:#3F7A3D;}' +
      '.stock-movement-select{height:40px;min-width:190px;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:28px;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 6px center;background-size:14px;}' +
      '.purchase-list-controls{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(190px,.5fr);gap:12px;align-items:end;}' +
      '.purchase-list-controls label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;}' +
      '.purchase-list-controls select{height:42px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-family:inherit;padding:0 38px 0 12px;outline:none;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 14px center;background-size:14px;}' +
      '.purchase-list-table{display:flex;flex-direction:column;gap:8px;}' +
      '.purchase-list-row{background:#fff;border:1px solid #EADFD8;border-radius:14px;padding:14px;box-shadow:0 1px 2px rgba(31,31,31,.03);display:grid;grid-template-columns:minmax(220px,1fr) minmax(110px,150px) minmax(100px,140px) minmax(150px,.7fr);gap:12px;align-items:center;}' +
      '.production-need-list{display:flex;flex-direction:column;gap:8px;}' +
      '.production-need-row{background:#FFFCF8;border:1px solid #EADFD8;border-radius:14px;padding:12px;display:grid;grid-template-columns:minmax(220px,1fr) minmax(120px,160px) auto;gap:12px;align-items:center;}' +
      '@media(max-width:820px){.production-orders-row,.stock-movement-row,.purchase-list-row,.production-need-row{grid-template-columns:1fr}.purchase-list-controls{grid-template-columns:1fr}.production-modal-grid,.production-detail-grid,.production-ingredient-row{grid-template-columns:1fr}.production-orders-primary{width:100%;}}' +
      '</style>';
  }

  function _renderProductionOrders() {
    var content = document.getElementById('receitas-content');
    if (!content) return;
    content.innerHTML = _ordersStyles() + '<div class="production-orders-page"><div class="loading-inline">Carregando ordens...</div></div>';
    Promise.all([
      DB.getAll('production_orders').catch(function () { return []; }),
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('stock_movements').catch(function () { return []; }),
      DB.getAll('stock_settings').catch(function () { return []; })
    ]).then(function (r) {
      _productionOrders = (r[0] || []).slice().sort(function (a, b) {
        return _dateTimeValue(b.createdAt || b.updatedAt || b.plannedDate) - _dateTimeValue(a.createdAt || a.updatedAt || a.plannedDate);
      });
      _productionRecipes = (r[1] || []).slice().sort(function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
      _productionNeedData = {
        items: _buildProductionNeeds(r[1] || [], r[2] || [], r[3] || []),
        recipes: r[1] || [],
        movements: r[2] || [],
        settings: r[3] || []
      };
      _paintProductionOrders();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _paintProductionOrders() {
    var content = document.getElementById('receitas-content');
    if (!content) return;
    var rows = _productionOrders.map(function (order) {
      var yieldUnit = (order.recipeSnapshot && order.recipeSnapshot.yieldUnit) || order.yieldUnit || 'unidades';
      var isBaseOrder = order.productionMode === 'base_producao' || (order.recipeSnapshot && order.recipeSnapshot.productionMode === 'base_producao');
      var orderName = isBaseOrder ? (order.baseProductionName || (order.recipeSnapshot && order.recipeSnapshot.baseProductionName) || 'Base de produção') : (order.fichaTecnicaNome || 'Receita sem nome');
      var metrics = _productionMetrics(order);
      var result = _productionResult(order, metrics);
      var statusClass = order.status === 'concluida' ? ' done' : (order.status === 'cancelada' ? ' cancelled' : '');
      return '<div class="production-orders-row" onclick="Modules.Receitas._openProductionOrderDetails(\'' + order.id + '\')">' +
        '<div style="display:flex;align-items:center;gap:12px;min-width:0;">' +
          '<div class="production-orders-icon"><span class="mi" style="font-size:20px;">assignment</span></div>' +
          '<div style="min-width:0;"><div class="production-orders-row-title">' + _esc(orderName) + '</div>' +
          '<div class="production-orders-row-text">' + (isBaseOrder ? 'Base produzida para ser usada depois na montagem dos produtos.' : 'Criada para planejar uma produção antes de mexer no estoque.') + '</div></div>' +
        '</div>' +
        '<div><div class="production-orders-label">Planejada</div><div class="production-orders-value">' + _esc(_fmtQty(order.plannedQuantity)) + ' ' + _esc(yieldUnit) + '</div></div>' +
        '<div><div class="production-orders-label">Produzida</div><div class="production-orders-value">' + (order.actualQuantity ? _esc(_fmtQty(order.actualQuantity)) + ' ' + _esc(yieldUnit) : '—') + '</div></div>' +
        '<div><div class="production-orders-label">Data prevista</div><div class="production-orders-value">' + _esc(_fmtDate(order.plannedDate)) + '</div></div>' +
        '<div><div class="production-orders-label">Resultado</div><div class="production-orders-value">' + (order.actualQuantity ? '<span class="production-result-badge ' + result.tone + '">' + _esc(result.label) + '</span><div style="margin-top:4px;">' + _esc(_signedQty(metrics.yieldDifference)) + ' · ' + _money(metrics.estimatedRealUnitCost) + '/un.</div>' : _money(order.plannedCost || 0)) + '</div></div>' +
        '<div style="display:flex;align-items:center;justify-content:flex-end;"><span class="production-orders-status' + statusClass + '">' + _esc(_statusLabel(order.status)) + '</span></div>' +
      '</div>';
    }).join('');
    content.innerHTML = _ordersStyles() +
      '<div class="production-orders-page">' +
        '<div class="production-orders-head">' +
          '<div style="min-width:0;flex:1 1 420px;">' +
            '<h2 class="production-orders-title">Ordens de produção</h2>' +
            '<p class="production-orders-subtitle">Planeje o que será produzido a partir das receitas cadastradas. Nesta fase, a ordem ainda não movimenta estoque nem baixa ingredientes.</p>' +
          '</div>' +
          '<button type="button" class="production-orders-primary" onclick="Modules.Receitas._openProductionOrderModal()">+ Nova ordem</button>' +
        '</div>' +
        _productionNeedsHtml() +
        '<section class="production-orders-card">' +
          '<div class="production-orders-card-head">' +
            '<div><div class="production-orders-section-title">Produções planejadas</div><div class="production-orders-section-desc">Acompanhe as ordens criadas e o snapshot da receita usado no planejamento.</div></div>' +
          '</div>' +
          (rows ? '<div class="production-orders-list">' + rows + '</div>' : '<div class="production-orders-empty"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhuma ordem criada ainda</div><div>Crie uma ordem quando quiser planejar uma produção sem alterar estoque.</div></div>') +
        '</section>' +
      '</div>';
  }

  function _renderStockMovements() {
    var content = document.getElementById('receitas-content');
    if (!content) return;
    content.innerHTML = _ordersStyles() + '<div class="production-orders-page"><div class="loading-inline">Carregando movimentações...</div></div>';
    DB.getAll('stock_movements').then(function (items) {
      _stockMovements = (items || []).slice().sort(function (a, b) {
        return _dateTimeValue(b.movementDate || b.createdAt) - _dateTimeValue(a.movementDate || a.createdAt);
      });
      _paintStockMovements();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _paintStockMovements() {
    var content = document.getElementById('receitas-content');
    if (!content) return;
    var filtered = (_stockMovements || []).filter(function (m) {
      return _stockMovementFilter === 'todos' || m.type === _stockMovementFilter;
    });
    var rows = filtered.slice(0, 80).map(function (m) {
      var typeClass = (m.type === 'saida_producao' || m.type === 'saida_base_venda') ? ' out' : (m.type === 'entrada_producao' || m.type === 'entrada_base_producao' ? ' in' : '');
      return '<div class="stock-movement-row">' +
        '<div><div class="production-orders-label">Data</div><div class="production-orders-value">' + _esc(_fmtDate(m.movementDate || m.createdAt)) + '</div></div>' +
        '<div><div class="production-orders-label">Tipo</div><span class="stock-movement-type' + typeClass + '">' + _esc(_movementTypeLabel(m.type)) + '</span></div>' +
        '<div><div class="production-orders-label">Item</div><div class="production-orders-value">' + _esc(_movementItemName(m)) + '</div></div>' +
        '<div><div class="production-orders-label">Quantidade</div><div class="production-orders-value">' + _esc(_movementQuantityLabel(m)) + '</div></div>' +
        '<div><div class="production-orders-label">Origem</div><div class="production-orders-value">' + _esc(m.fichaTecnicaNome || m.productionOrderName || 'Ordem de produção') + '</div></div>' +
      '</div>';
    }).join('');
    content.innerHTML = _ordersStyles() +
      '<div class="production-orders-page">' +
        '<div class="production-orders-head">' +
          '<div style="min-width:0;flex:1 1 420px;">' +
            '<h2 class="production-orders-title">Movimentações de produção</h2>' +
            '<p class="production-orders-subtitle">Veja as movimentações simples geradas quando uma produção é concluída. Nesta fase, elas ainda não calculam saldo, inventário ou alertas.</p>' +
          '</div>' +
        '</div>' +
        '<div class="stock-movement-filter">' +
          '<div><label style="' + _labelStyle() + '">Tipo de movimentação</label><div class="recipes-config-control"><select class="stock-movement-select" onchange="Modules.Receitas._setStockMovementFilter(this.value)">' +
            '<option value="todos"' + (_stockMovementFilter === 'todos' ? ' selected' : '') + '>Todas</option>' +
            '<option value="saida_producao"' + (_stockMovementFilter === 'saida_producao' ? ' selected' : '') + '>Saída de ingredientes</option>' +
            '<option value="entrada_producao"' + (_stockMovementFilter === 'entrada_producao' ? ' selected' : '') + '>Entrada de produto produzido</option>' +
            '<option value="entrada_base_producao"' + (_stockMovementFilter === 'entrada_base_producao' ? ' selected' : '') + '>Entrada de base de produção</option>' +
          '</select></div></div>' +
          '<div style="font-size:12px;color:#6F6860;line-height:1.4;">' + filtered.length + ' movimentações encontradas</div>' +
        '</div>' +
        '<section class="production-orders-card">' +
          '<div class="production-orders-card-head">' +
            '<div><div class="production-orders-section-title">Movimentações recentes</div><div class="production-orders-section-desc">Registros criados automaticamente a partir das ordens concluídas.</div></div>' +
          '</div>' +
          (rows ? '<div class="production-orders-list">' + rows + '</div>' : '<div class="production-orders-empty">Nenhuma movimentação encontrada.</div>') +
        '</section>' +
      '</div>';
  }

  function _setStockMovementFilter(value) {
    _stockMovementFilter = value || 'todos';
    _paintStockMovements();
  }

  function _addPurchaseNeed(map, id, name, classe, qty, unit, origin, detail) {
    qty = _num(qty);
    if (qty <= 0) return;
    var key = (classe || 'insumo') + ':' + (id || name);
    if (!map[key]) {
      map[key] = { id: id || '', name: name || 'Item', classe: classe || 'insumo', quantity: 0, unit: unit || '', origins: {}, details: [] };
    }
    map[key].quantity += qty;
    map[key].unit = map[key].unit || unit || '';
    if (origin) map[key].origins[origin] = true;
    if (detail) map[key].details.push(detail);
  }

  function _purchaseItemClass(id, fallback) {
    var item = (_purchaseListData.costItems || []).find(function (it) { return String(it.id || '') === String(id || ''); });
    return _normalizeStockClass((item && (item.classe || item.itemClass || item.stockItemType)) || fallback || 'insumo') === 'produto' ? 'produto' : 'insumo';
  }

  function _purchaseClassAllowed(itemClass, filter) {
    if (filter === 'todos') return itemClass === 'insumo' || itemClass === 'produto';
    return itemClass === filter;
  }

  function _buildSimpleStockBalances(movements) {
    var map = {};
    (movements || []).forEach(function (movement) {
      var entry = _simpleStockEntry(movement);
      if (!entry.key || !entry.quantity) return;
      if (!map[entry.key]) map[entry.key] = { balance: 0, unit: entry.unit || '' };
      map[entry.key].balance += entry.direction * entry.quantity;
      map[entry.key].unit = map[entry.key].unit || entry.unit || '';
    });
    Object.keys(map).forEach(function (key) { map[key].balance = _round(map[key].balance); });
    return map;
  }

  function _simpleStockEntry(movement) {
    var type = movement && movement.type;
    var direction = 0;
    if (type === 'entrada_compra' || type === 'entrada_producao' || type === 'entrada_base_producao' || type === 'ajuste_entrada' || type === 'estorno_venda' || type === 'estorno_producao_ingrediente') direction = 1;
    if (type === 'saida_producao' || type === 'saida_venda' || type === 'saida_base_venda' || type === 'ajuste_saida' || type === 'estorno_compra' || type === 'estorno_producao_produto' || type === 'estorno_base_producao') direction = -1;
    if (!direction) return {};
    var stockKind = _movementStockKind(movement);
    var itemId = stockKind === 'produto_produzido'
      ? (movement.fichaTecnicaId || '')
      : (stockKind === 'base_producao'
        ? (movement.baseProductionId || movement.componentName || '')
        : (stockKind === 'produto_pronto'
          ? (movement.sourceItemId || movement.produtoProntoId || movement.itemId || '')
          : (movement.ingredientId || movement.itemId || '')));
    var quantity = (stockKind === 'produto_produzido' || stockKind === 'base_producao') ? _num(movement.quantityProduced || movement.quantity) : _num(movement.quantity);
    return {
      key: stockKind + ':' + (itemId || _movementItemName(movement)),
      direction: direction,
      quantity: Math.abs(quantity),
      unit: (stockKind === 'produto_produzido' || stockKind === 'base_producao') ? (movement.yieldUnit || movement.unit || '') : (movement.unit || '')
    };
  }

  function _movementStockKind(movement) {
    var cls = _normalizeStockClass(movement && (movement.stockItemType || movement.itemClass || movement.classe || ''));
    if (cls === 'produto') return 'produto_pronto';
    if (cls === 'produto_produzido') return 'produto_produzido';
    if (cls === 'base_producao') return 'base_producao';
    if (cls === 'insumo') return 'insumo';
    if (movement && (movement.baseProductionId || movement.type === 'entrada_base_producao' || movement.type === 'estorno_base_producao')) return 'base_producao';
    if (movement && movement.fichaTecnicaId) return 'produto_produzido';
    if (movement && (movement.sourceItemId || movement.produtoProntoId)) return 'produto_pronto';
    return 'insumo';
  }

  function _stockKindFromKey(key, fallback) {
    var fb = _normalizeStockClass(fallback || '');
    if (fb === 'produto') return 'produto_pronto';
    if (fb === 'produto_produzido') return 'produto_produzido';
    if (fb === 'base_producao') return 'base_producao';
    if (fb === 'insumo') return 'insumo';
    var first = String(key || '').split(':')[0] || '';
    if (first === 'produto_pronto' || first === 'produto') return 'produto_pronto';
    if (first === 'produto_produzido') return 'produto_produzido';
    if (first === 'base_producao') return 'base_producao';
    return 'insumo';
  }

  function _renderPurchaseList() {
    var content = document.getElementById('receitas-content');
    if (!content) return;
    content.innerHTML = _ordersStyles() + '<div class="production-orders-page"><div class="loading-inline">Montando lista de compras...</div></div>';
    Promise.all([
      DB.getAll('production_orders').catch(function () { return []; }),
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('stock_movements').catch(function () { return []; }),
      DB.getAll('stock_settings').catch(function () { return []; }),
      DB.getAll('itens_custo').catch(function () { return []; })
    ]).then(function (r) {
      _purchaseListData = {
        orders: r[0] || [],
        recipes: r[1] || [],
        movements: r[2] || [],
        settings: r[3] || [],
        costItems: r[4] || []
      };
      _paintPurchaseList();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _paintPurchaseList() {
    var content = document.getElementById('receitas-content');
    if (!content) return;
    var list = _buildPurchaseListItems();
    var rows = list.map(function (item) {
      return '<div class="purchase-list-row">' +
        '<div><div class="production-orders-label">Item</div><div class="production-orders-value">' + _esc(item.name) + '</div><div class="production-orders-row-text">' + _esc(item.reason) + '</div></div>' +
        '<div><div class="production-orders-label">Classe</div><div class="production-orders-value">' + _esc(item.classLabel) + '</div></div>' +
        '<div><div class="production-orders-label">Comprar</div><div class="production-orders-value">' + _esc(_fmtQty(item.quantity)) + ' ' + _esc(item.unit || '') + '</div></div>' +
        '<div><div class="production-orders-label">Origem</div><div class="production-orders-value">' + _esc(item.originText) + '</div></div>' +
      '</div>';
    }).join('');
    content.innerHTML = _ordersStyles() +
      '<div class="production-orders-page">' +
        '<div class="production-orders-head">' +
          '<div style="min-width:0;flex:1 1 420px;">' +
            '<h2 class="production-orders-title">Lista de Compras</h2>' +
            '<p class="production-orders-subtitle">Gere uma sugestão de compra a partir do que está planejado para produzir, dos mínimos do estoque ou dos dois juntos.</p>' +
          '</div>' +
        '</div>' +
        '<section class="production-orders-card">' +
          '<div class="purchase-list-controls">' +
            '<label><span>Gerar lista por</span><select onchange="Modules.Receitas._setPurchaseListOption(\'source\', this.value)">' +
              '<option value="planejado"' + (_purchaseListState.source === 'planejado' ? ' selected' : '') + '>Produção planejada</option>' +
              '<option value="minimo"' + (_purchaseListState.source === 'minimo' ? ' selected' : '') + '>Estoque mínimo</option>' +
              '<option value="ambos"' + (_purchaseListState.source === 'ambos' ? ' selected' : '') + '>Produção planejada + estoque mínimo</option>' +
            '</select></label>' +
            '<label><span>Classe</span><select onchange="Modules.Receitas._setPurchaseListOption(\'classe\', this.value)">' +
              '<option value="insumo"' + (_purchaseListState.classe === 'insumo' ? ' selected' : '') + '>Insumos</option>' +
              '<option value="produto"' + (_purchaseListState.classe === 'produto' ? ' selected' : '') + '>Produtos prontos</option>' +
              '<option value="todos"' + (_purchaseListState.classe === 'todos' ? ' selected' : '') + '>Insumos e produtos prontos</option>' +
            '</select></label>' +
          '</div>' +
        '</section>' +
        '<section class="production-orders-card">' +
          '<div class="production-orders-card-head">' +
            '<div><div class="production-orders-section-title">Itens sugeridos para comprar</div><div class="production-orders-section-desc">A lista é uma sugestão operacional. Confira fornecedores, embalagens e saldos antes de comprar.</div></div>' +
            '<span class="production-orders-status">' + list.length + ' item' + (list.length === 1 ? '' : 's') + '</span>' +
          '</div>' +
          (rows ? '<div class="purchase-list-table">' + rows + '</div>' : '<div class="production-orders-empty">Nenhum item encontrado para os critérios escolhidos.</div>') +
        '</section>' +
      '</div>';
  }

  function _setPurchaseListOption(key, value) {
    if (key === 'source') _purchaseListState.source = value || 'planejado';
    if (key === 'classe') _purchaseListState.classe = value || 'insumo';
    _paintPurchaseList();
  }

  function _buildPurchaseListItems() {
    var source = _purchaseListState.source || 'planejado';
    var classe = _purchaseListState.classe || 'insumo';
    var map = {};
    if (source === 'planejado' || source === 'ambos') {
      (_purchaseListData.orders || []).forEach(function (order) {
        if (String(order.status || 'planejada') !== 'planejada') return;
        var ingredients = order.plannedIngredients || (order.recipeSnapshot && order.recipeSnapshot.plannedIngredients) || [];
        (ingredients || []).forEach(function (ing) {
          var id = ing.insumoId || ing.itemId || '';
          var name = ing.supplyName || ing.name || 'Item';
          var itemClass = _purchaseItemClass(id, ing.classe || ing.itemClass || 'insumo');
          if (!_purchaseClassAllowed(itemClass, classe)) return;
          var qty = _num(ing.plannedGrossQuantity || ing.plannedQty || ing.qty);
          _addPurchaseNeed(map, id, name, itemClass, qty, ing.unit || '', 'Produção planejada', order.fichaTecnicaNome || 'Ordem planejada');
        });
      });
    }
    if (source === 'minimo' || source === 'ambos') {
      var balances = _buildSimpleStockBalances(_purchaseListData.movements || []);
      (_purchaseListData.settings || []).forEach(function (setting) {
        var key = setting.stockKey || '';
        var stockKind = _stockKindFromKey(key, setting.stockItemType);
        if (stockKind === 'produto_produzido') return;
        var itemClass = stockKind === 'produto_pronto' ? 'produto' : 'insumo';
        if (!_purchaseClassAllowed(itemClass, classe)) return;
        var min = _num(setting.minStock);
        if (min <= 0) return;
        var balance = _num((balances[key] || {}).balance);
        var missing = _round(Math.max(0, min - balance));
        if (missing <= 0) return;
        _addPurchaseNeed(map, setting.itemId || key, setting.itemName || key, itemClass, missing, setting.unit || (balances[key] || {}).unit || '', 'Estoque mínimo', 'Abaixo do mínimo');
      });
    }
    return Object.keys(map).map(function (key) {
      var item = map[key];
      item.quantity = _round(item.quantity);
      item.classLabel = item.classe === 'produto' ? 'Produto pronto' : 'Insumo';
      item.originText = Object.keys(item.origins).join(', ');
      item.reason = item.details.slice(0, 2).join(' · ') + (item.details.length > 2 ? ' +' + (item.details.length - 2) : '');
      return item;
    }).filter(function (item) { return item.quantity > 0; }).sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
    });
  }

  function _openProductionOrderModal() {
    if (!_productionRecipes.length) {
      UI.toast('Cadastre uma receita antes de criar uma ordem de produção.', 'warning');
      return;
    }
    var firstRecipe = _productionRecipes[0] || {};
    var defaultQty = _fmtQty(firstRecipe.yieldQuantity || firstRecipe.yield || 1).replace(',', '.');
    var options = _productionRecipes.map(function (f) {
      var yieldLabel = _fmtQty(f.yieldQuantity || f.yield || 1) + ' ' + (f.yieldUnit || 'unidades');
      return '<option value="' + _esc(f.id) + '">' + _esc(f.name || 'Receita sem nome') + ' · rende ' + _esc(yieldLabel) + '</option>';
    }).join('');
    var baseOptions = _baseProductionOptionsHtml();
    var body = '<div class="production-modal-card">' +
      '<div class="production-modal-card-title">Planejamento da produção</div>' +
      '<div class="production-modal-card-desc">Escolha se vai produzir o produto final ou uma base usada depois na montagem, como massa ou recheio.</div>' +
      '<div class="production-modal-grid">' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">O que será produzido *</span><div class="recipes-config-control"><select id="po-mode" onchange="Modules.Receitas._updateProductionOrderMode()" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;"><option value="produto_final">Produto final</option><option value="base_producao"' + (!baseOptions ? ' disabled' : '') + '>Base de produção</option></select></div></label>' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Ficha técnica *</span><div class="recipes-config-control"><select id="po-recipe" onchange="Modules.Receitas._updateProductionOrderPreview()" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;">' + options + '</select></div></label>' +
        '<label id="po-base-wrap" style="display:none;"><span style="' + _labelStyle() + '">Base *</span><div class="recipes-config-control"><select id="po-base" onchange="Modules.Receitas._updateProductionOrderPreview()" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;">' + baseOptions + '</select></div></label>' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Quantidade planejada *</span><div class="recipes-config-control"><input id="po-quantity" type="number" min="0.01" step="0.01" value="' + _esc(defaultQty) + '" oninput="Modules.Receitas._updateProductionOrderPreview()" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;"></div></label>' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Data prevista *</span><div class="recipes-config-control"><input id="po-date" type="date" value="' + _today() + '" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;"></div></label>' +
      '</div>' +
      '<label style="display:block;margin-top:12px;"><span style="' + _labelStyle() + '">Observação</span><textarea id="po-notes" placeholder="Ex: produção para encomendas do fim de semana" style="' + _inputStyle() + 'min-height:82px;resize:vertical;background:#FFFCF8;"></textarea></label>' +
      '<div id="po-preview" style="margin-top:14px;"></div>' +
      '</div>';
    var footer = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;flex-wrap:wrap;"><span style="font-size:12px;color:#6F6860;line-height:1.4;">Revise os dados antes de salvar.</span><button onclick="Modules.Receitas._saveProductionOrder()" class="production-orders-primary">Criar ordem planejada</button></div>';
    window._productionOrderModal = UI.modal({ title: 'Nova ordem de produção', body: _ordersStyles() + body, footer: footer, maxWidth: '860px' });
    setTimeout(_updateProductionOrderMode, 0);
  }

  function _productionNeedsHtml() {
    var needs = (_productionNeedData.items || []).slice(0, 6);
    if (!needs.length) return '';
    var rows = needs.map(function (need) {
      return '<div class="production-need-row">' +
        '<div><div class="production-orders-value">' + _esc(need.name) + '</div><div class="production-orders-row-text">Saldo ' + _esc(_fmtQty(need.balance)) + ' · mínimo ' + _esc(_fmtQty(need.minStock)) + ' ' + _esc(need.unit || '') + '</div></div>' +
        '<div><div class="production-orders-label">Produzir</div><div class="production-orders-value">' + _esc(_fmtQty(need.missing)) + ' ' + _esc(need.unit || '') + '</div></div>' +
        '<button type="button" class="production-orders-primary" onclick="Modules.Receitas._createProductionOrderFromNeed(\'' + _escJs(need.recipeId) + '\',\'' + _escJs(String(need.missing)) + '\',\'' + _escJs(need.stockKind || '') + '\',\'' + _escJs(need.baseProductionId || '') + '\')">Gerar planejamento</button>' +
      '</div>';
    }).join('');
    return '<section class="production-orders-card">' +
      '<div class="production-orders-card-head">' +
        '<div><div class="production-orders-section-title">Necessidade de produção</div><div class="production-orders-section-desc">Produtos produzidos e bases abaixo do estoque mínimo aparecem aqui para virar ordem planejada.</div></div>' +
      '</div>' +
      '<div class="production-need-list">' + rows + '</div>' +
    '</section>';
  }

  function _buildProductionNeeds(recipes, movements, settings) {
    var balances = _buildSimpleStockBalances(movements || []);
    return (settings || []).map(function (setting) {
      var key = setting.stockKey || '';
      var stockKind = _stockKindFromKey(key, setting.stockItemType);
      if (stockKind !== 'produto_produzido' && stockKind !== 'base_producao') return null;
      var parts = String(key || '').split(':');
      var recipeId = stockKind === 'base_producao'
        ? (parts[1] || String(setting.itemId || '').split(':')[1] || setting.recipeId || '')
        : (setting.itemId || parts[1] || '');
      var recipe = (recipes || []).find(function (item) { return String(item.id || '') === String(recipeId || ''); }) || {};
      var min = _num(setting.minStock);
      if (min <= 0) return null;
      var balance = _num((balances[key] || {}).balance);
      var missing = _round(Math.max(0, min - balance));
      if (missing <= 0) return null;
      return {
        recipeId: recipeId,
        stockKind: stockKind,
        baseProductionId: stockKind === 'base_producao' ? String(key || '') : '',
        name: setting.itemName || recipe.name || 'Receita',
        minStock: min,
        balance: balance,
        missing: missing,
        unit: setting.unit || (balances[key] || {}).unit || recipe.yieldUnit || 'unidades'
      };
    }).filter(Boolean).sort(function (a, b) { return b.missing - a.missing; });
  }

  function _createProductionOrderFromNeed(recipeId, quantity, stockKind, baseProductionId) {
    recipeId = String(recipeId || '').trim();
    var recipe = (_productionRecipes || _productionNeedData.recipes || []).find(function (item) {
      return String(item.id || '') === recipeId;
    });
    if (!recipe) { UI.toast('Receita não encontrada para gerar a ordem.', 'error'); return; }
    var qty = _num(quantity);
    if (qty <= 0) { UI.toast('Quantidade de produção inválida.', 'error'); return; }
    var isBase = stockKind === 'base_producao';
    var baseComponent = isBase ? _findBaseComponentByProductionId(recipe, baseProductionId) : null;
    if (isBase && !baseComponent) { UI.toast('Base de produção não encontrada nesta ficha.', 'error'); return; }
    var snapshot = isBase ? _buildBaseProductionSnapshot(recipe, baseComponent, qty) : _buildProductionSnapshot(recipe, qty);
    var user = window.Auth && Auth.getUser ? Auth.getUser() : null;
    var payload = {
      fichaTecnicaId: recipe.id || '',
      fichaTecnicaNome: recipe.name || '',
      productionMode: isBase ? 'base_producao' : 'produto_final',
      baseProductionId: isBase ? ((recipe.id || '') + ':' + (baseComponent.name || 'base')) : '',
      baseProductionName: isBase ? (baseComponent.name || 'Base de produção') : '',
      plannedQuantity: qty,
      plannedDate: _today(),
      status: 'planejada',
      notes: isBase ? 'Planejamento de base gerado pela necessidade de produção do estoque mínimo.' : 'Planejamento gerado pela necessidade de produção do estoque mínimo.',
      recipeSnapshot: snapshot.recipeSnapshot,
      plannedCost: snapshot.plannedCost,
      plannedIngredients: snapshot.plannedIngredients,
      createdBy: user && user.uid ? user.uid : '',
      createdFrom: 'stock_minimum_need',
      updatedAt: new Date().toISOString()
    };
    DB.add('production_orders', payload).then(function () {
      UI.toast('Planejamento de produção criado.', 'success');
      _renderProductionOrders();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _updateProductionOrderPreview() {
    var el = document.getElementById('po-preview');
    if (!el) return;
    var isBase = ((document.getElementById('po-mode') || {}).value || '') === 'base_producao';
    var baseItem = isBase ? _selectedProductionBaseItem() : null;
    var recipe = isBase && baseItem ? ((_productionRecipes || []).find(function (f) { return f.id === baseItem.recipeId; }) || _selectedProductionRecipe()) : _selectedProductionRecipe();
    if (!recipe) {
      el.innerHTML = '';
      return;
    }
    var qty = _num((document.getElementById('po-quantity') || {}).value) || 0;
    var baseComponent = baseItem ? baseItem.component : null;
    if (isBase && !baseComponent) {
      el.innerHTML = '<div class="production-orders-empty">Selecione uma base de produção para ver o planejamento.</div>';
      return;
    }
    var snapshot = isBase ? _buildBaseProductionSnapshot(recipe, baseComponent, qty) : _buildProductionSnapshot(recipe, qty);
    el.innerHTML = '<div class="production-detail-grid">' +
      _detailTile(isBase ? 'Rendimento da base' : 'Rendimento da ficha', _fmtQty(snapshot.yieldQuantity) + ' ' + snapshot.yieldUnit) +
      _detailTile(isBase ? 'Custo da base' : 'Custo da ficha', _money(snapshot.totalCost)) +
      _detailTile('Custo planejado', _money(snapshot.plannedCost)) +
      _detailTile('Ingredientes', String(snapshot.plannedIngredients.length)) +
      '</div>';
  }

  function _saveProductionOrder() {
    var isBase = ((document.getElementById('po-mode') || {}).value || '') === 'base_producao';
    var baseItem = isBase ? _selectedProductionBaseItem() : null;
    var recipe = isBase && baseItem ? ((_productionRecipes || []).find(function (f) { return f.id === baseItem.recipeId; }) || _selectedProductionRecipe()) : _selectedProductionRecipe();
    var qty = _num((document.getElementById('po-quantity') || {}).value);
    var plannedDate = ((document.getElementById('po-date') || {}).value || '').trim();
    var baseComponent = baseItem ? baseItem.component : null;
    if (!recipe) { UI.toast('Selecione uma ficha técnica.', 'error'); return; }
    if (isBase && !baseComponent) { UI.toast('Selecione uma base de produção.', 'error'); return; }
    if (!qty || qty <= 0) { UI.toast('Informe uma quantidade planejada maior que zero.', 'error'); return; }
    if (!plannedDate) { UI.toast('Informe a data prevista.', 'error'); return; }
    var snapshot = isBase ? _buildBaseProductionSnapshot(recipe, baseComponent, qty) : _buildProductionSnapshot(recipe, qty);
    var user = window.Auth && Auth.getUser ? Auth.getUser() : null;
    var payload = {
      fichaTecnicaId: recipe.id || '',
      fichaTecnicaNome: recipe.name || '',
      productionMode: isBase ? 'base_producao' : 'produto_final',
      baseProductionId: isBase ? ((recipe.id || '') + ':' + (baseComponent.name || 'base')) : '',
      baseProductionName: isBase ? (baseComponent.name || 'Base de produção') : '',
      plannedQuantity: qty,
      plannedDate: plannedDate,
      status: 'planejada',
      notes: ((document.getElementById('po-notes') || {}).value || '').trim(),
      recipeSnapshot: snapshot.recipeSnapshot,
      plannedCost: snapshot.plannedCost,
      plannedIngredients: snapshot.plannedIngredients,
      createdBy: user && user.uid ? user.uid : '',
      updatedAt: new Date().toISOString()
    };
    DB.add('production_orders', payload).then(function () {
      UI.toast('Ordem de produção criada.', 'success');
      if (window._productionOrderModal) window._productionOrderModal.close();
      _renderProductionOrders();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _openProductionOrderDetails(id) {
    var order = (_productionOrders || []).find(function (x) { return x.id === id; }) || null;
    if (!order) return;
    var snapshot = order.recipeSnapshot || {};
    var isBaseOrder = order.productionMode === 'base_producao' || snapshot.productionMode === 'base_producao';
    var ingredients = order.plannedIngredients || snapshot.plannedIngredients || [];
    var metrics = _productionMetrics(order);
    var result = _productionResult(order, metrics);
    var canComplete = order.status !== 'concluida' && order.status !== 'cancelada';
    var canCreateStockMovements = order.status === 'concluida' && !order.stockMovementCreated;
    var canCancel = order.status !== 'cancelada';
    var movementCount = _num(order.stockMovementCount);
    var ingredientRows = ingredients.map(function (ing) {
      return '<div class="production-ingredient-row">' +
        '<div><div class="production-orders-label">Ingrediente</div><div class="production-orders-value">' + _esc(ing.supplyName || ing.name || '-') + '</div></div>' +
        '<div><div class="production-orders-label">Quantidade prevista</div><div class="production-orders-value">' + _esc(_fmtQty(ing.plannedQty != null ? ing.plannedQty : ing.qty)) + ' ' + _esc(ing.unit || '') + '</div></div>' +
        '<div><div class="production-orders-label">Custo previsto</div><div class="production-orders-value">' + _money(ing.plannedTotalCost != null ? ing.plannedTotalCost : ing.totalCost || 0) + '</div></div>' +
      '</div>';
    }).join('');
    var body = '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<section class="production-modal-card">' +
        '<div class="production-modal-card-title">' + _esc(isBaseOrder ? (order.baseProductionName || snapshot.baseProductionName || 'Base de produção') : (order.fichaTecnicaNome || snapshot.name || 'Ordem de produção')) + '</div>' +
        '<div class="production-modal-card-desc">' + (isBaseOrder ? 'Esta ordem produz uma base intermediária para usar depois na montagem dos produtos.' : 'Esta ordem guarda uma cópia da receita no momento em que foi criada. Alterações futuras na ficha técnica não mudam este planejamento.') + '</div>' +
        (order.status === 'concluida' ? '<div class="production-result-panel"><div><div class="production-orders-label">Resultado do lote</div><div class="production-result-message">' + _esc(result.message) + '</div></div><span class="production-result-badge ' + result.tone + '">' + _esc(result.label) + '</span></div>' : '') +
        '<div class="production-detail-grid">' +
          _detailTile('Status', _statusLabel(order.status)) +
          _detailTile('Data prevista', _fmtDate(order.plannedDate)) +
          _detailTile(isBaseOrder ? 'Base planejada' : 'Quantidade planejada', _fmtQty(order.plannedQuantity) + ' ' + (snapshot.yieldUnit || 'unidades')) +
          _detailTile('Quantidade produzida', order.actualQuantity ? (_fmtQty(order.actualQuantity) + ' ' + (snapshot.yieldUnit || 'unidades')) : 'Ainda não informada') +
          _detailTile('Diferença de rendimento', order.actualQuantity ? _signedQty(metrics.yieldDifference) : '—') +
          _detailTile('Diferença percentual', order.actualQuantity ? _signedPercent(metrics.yieldDifferencePercent) : '—') +
          _detailTile('Rendimento real', order.actualQuantity ? _percent(metrics.yieldRealPercent) : '—') +
          _detailTile('Custo previsto por un.', _money(metrics.plannedUnitCost)) +
          _detailTile('Custo real estimado', order.actualQuantity ? (_money(metrics.estimatedRealUnitCost) + '/un.') : '—') +
          _detailTile('Variação do custo', order.actualQuantity ? _signedPercent(metrics.costVariationPercent) : '—') +
          _detailTile('Custo previsto do lote', _money(metrics.plannedCost)) +
          _detailTile('Data realizada', _fmtDate(order.actualDate || order.completedAt)) +
          _detailTile('Perdas reais', order.realLossQuantity ? _fmtQty(order.realLossQuantity) : '—') +
          _detailTile('Movimentações', order.stockMovementCreated ? (movementCount + ' criadas') : (order.status === 'concluida' ? 'Ainda não geradas' : 'Aguardando conclusão')) +
        '</div>' +
        '<div style="margin-top:12px;font-size:12px;color:#6F6860;line-height:1.45;background:#FFFCF8;border:1px solid #EADFD8;border-radius:12px;padding:10px 12px;">Quando a produção é concluída, o BocaFood registra as movimentações do lote. Se a ordem for cancelada depois disso, o histórico é mantido com estorno.</div>' +
      '</section>' +
      '<section class="production-modal-card">' +
        '<div class="production-modal-card-title">Base de movimentações</div>' +
        '<div class="production-modal-card-desc">Resumo simples do que será usado para a futura camada de estoque. Ainda não há saldo nem inventário.</div>' +
        '<div class="production-detail-grid">' +
          _detailTile('Ingredientes consumidos', String(ingredients.length)) +
          _detailTile(isBaseOrder ? 'Base produzida' : 'Produto produzido', order.actualQuantity ? (_fmtQty(order.actualQuantity) + ' ' + (snapshot.yieldUnit || 'unidades')) : '—') +
          _detailTile('Movimentação criada', order.stockMovementCreated ? 'Sim' : 'Não') +
          _detailTile('Total de registros', order.stockMovementCreated ? String(movementCount) : '—') +
        '</div>' +
      '</section>' +
      '<section class="production-modal-card">' +
        '<div class="production-modal-card-title">Snapshot da receita</div>' +
        '<div class="production-modal-card-desc">Base usada para calcular ingredientes e custo previsto desta ordem.</div>' +
        '<div class="production-detail-grid">' +
          _detailTile('Rendimento da ficha', _fmtQty(snapshot.yieldQuantity || 1) + ' ' + (snapshot.yieldUnit || 'unidades')) +
          _detailTile('Custo total da ficha', _money(snapshot.totalCost || 0)) +
          _detailTile('Custo por rendimento', _money(snapshot.costPerYield || 0)) +
          _detailTile('Ingredientes', String(ingredients.length)) +
        '</div>' +
      '</section>' +
      '<section class="production-modal-card">' +
        '<div class="production-modal-card-title">Ingredientes previstos</div>' +
        '<div class="production-modal-card-desc">Ainda não há baixa automática. Esta lista é apenas o planejamento salvo na ordem.</div>' +
        (ingredientRows ? '<div class="production-ingredient-list">' + ingredientRows + '</div>' : '<div class="production-orders-empty">Nenhum ingrediente no snapshot.</div>') +
      '</section>' +
      (order.notes || order.productionNotes ? '<section class="production-modal-card"><div class="production-modal-card-title">Observações</div>' + (order.notes ? '<div style="font-size:13px;color:#1F1F1F;line-height:1.5;">Planejamento: ' + _esc(order.notes) + '</div>' : '') + (order.productionNotes ? '<div style="font-size:13px;color:#1F1F1F;line-height:1.5;margin-top:6px;">Produção: ' + _esc(order.productionNotes) + '</div>' : '') + '</section>' : '') +
    '</div>';
    var footer = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;flex-wrap:wrap;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">' + (canComplete ? 'Finalize somente depois de conferir o resultado real do lote.' : 'Ordem já encerrada para esta fase.') + '</span>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' +
        (canComplete ? '<button type="button" onclick="Modules.Receitas._openCompleteProductionOrderModal(\'' + order.id + '\')" class="production-orders-primary">Finalizar produção</button>' : '') +
        (canCreateStockMovements ? '<button type="button" onclick="Modules.Receitas._createStockMovementsForCompletedOrder(\'' + order.id + '\')" class="production-orders-primary">Gerar movimentações</button>' : '') +
        (canCancel ? '<button type="button" onclick="Modules.Receitas._cancelProductionOrder(\'' + order.id + '\')" class="production-orders-secondary">Cancelar ordem</button>' : '') +
        '<button type="button" onclick="if(window._productionOrderDetailsModal)window._productionOrderDetailsModal.close()" class="production-orders-secondary">Fechar</button>' +
      '</div></div>';
    window._productionOrderDetailsModal = UI.modal({
      title: 'Detalhes da ordem',
      body: _ordersStyles() + body,
      footer: footer,
      maxWidth: '940px'
    });
  }

  function _openCompleteProductionOrderModal(id) {
    var order = (_productionOrders || []).find(function (x) { return x.id === id; }) || null;
    if (!order) return;
    if (order.status === 'concluida') {
      UI.toast('Esta ordem já foi concluída.', 'warning');
      return;
    }
    if (order.status === 'cancelada') {
      UI.toast('Ordem cancelada não pode ser finalizada.', 'warning');
      return;
    }
    var snapshot = order.recipeSnapshot || {};
    var plannedQty = _num(order.plannedQuantity);
    var body = '<div class="production-modal-card">' +
      '<div class="production-modal-card-title">Resultado real do lote</div>' +
      '<div class="production-modal-card-desc">Informe quanto foi produzido de verdade. O custo real desta fase é estimado pelo custo previsto da ordem dividido pela quantidade produzida.</div>' +
      '<div class="production-detail-grid" style="margin-bottom:14px;">' +
        _detailTile('Planejado', _fmtQty(plannedQty) + ' ' + (snapshot.yieldUnit || 'unidades')) +
        _detailTile('Custo previsto', _money(_productionMetrics(order).plannedCost)) +
        _detailTile('Custo previsto por un.', _money(_productionMetrics(order).plannedUnitCost)) +
        _detailTile('Status atual', _statusLabel(order.status)) +
      '</div>' +
      '<div class="production-modal-grid">' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Quantidade produzida real *</span><div class="recipes-config-control"><input id="po-actual-quantity" type="number" min="0.01" step="0.01" value="' + _esc(_fmtQty(plannedQty).replace(',', '.')) + '" oninput="Modules.Receitas._updateProductionCompletionPreview(\'' + id + '\')" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;"></div></label>' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Data real *</span><div class="recipes-config-control"><input id="po-actual-date" type="date" value="' + _today() + '" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;"></div></label>' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Perdas reais</span><div class="recipes-config-control"><input id="po-real-loss" type="number" min="0" step="0.01" value="" placeholder="0" style="width:100%;border:0;background:transparent;outline:none;font-size:14px;font-family:inherit;color:#1F1F1F;height:40px;"></div></label>' +
      '</div>' +
      '<label style="display:block;margin-top:12px;"><span style="' + _labelStyle() + '">Observação da produção</span><textarea id="po-production-notes" placeholder="Ex: a massa rendeu menos porque houve perda no preparo" style="' + _inputStyle() + 'min-height:82px;resize:vertical;background:#FFFCF8;"></textarea></label>' +
      '<div id="po-complete-preview" style="margin-top:14px;"></div>' +
      '</div>';
    var footer = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;flex-wrap:wrap;"><span style="font-size:12px;color:#6F6860;line-height:1.4;">Esta ação encerra a ordem como concluída.</span><button onclick="Modules.Receitas._completeProductionOrder(\'' + id + '\')" class="production-orders-primary">Salvar produção realizada</button></div>';
    window._completeProductionOrderModal = UI.modal({ title: 'Finalizar produção', body: _ordersStyles() + body, footer: footer, maxWidth: '860px' });
    setTimeout(function () { _updateProductionCompletionPreview(id); }, 0);
  }

  function _updateProductionCompletionPreview(id) {
    var el = document.getElementById('po-complete-preview');
    if (!el) return;
    var order = (_productionOrders || []).find(function (x) { return x.id === id; }) || null;
    if (!order) return;
    var actualQty = _num((document.getElementById('po-actual-quantity') || {}).value);
    var metrics = _productionMetrics(order, actualQty);
    var result = _productionResult(order, metrics);
    el.innerHTML = '<div class="production-detail-grid">' +
      _detailTile('Diferença de rendimento', _signedQty(metrics.yieldDifference)) +
      _detailTile('Rendimento real', _percent(metrics.yieldRealPercent)) +
      _detailTile('Custo real estimado', _money(metrics.estimatedRealUnitCost) + '/un.') +
      _detailTile('Variação do custo', _signedPercent(metrics.costVariationPercent)) +
      '</div>' +
      '<div class="production-result-panel" style="margin-top:12px;margin-bottom:0;"><div><div class="production-orders-label">Leitura operacional</div><div class="production-result-message">' + _esc(result.message) + '</div></div><span class="production-result-badge ' + result.tone + '">' + _esc(result.label) + '</span></div>';
  }

  function _completeProductionOrder(id) {
    var order = (_productionOrders || []).find(function (x) { return x.id === id; }) || null;
    if (!order) return;
    if (order.status === 'concluida') {
      UI.toast('Esta ordem já foi concluída.', 'warning');
      return;
    }
    if (order.status === 'cancelada') {
      UI.toast('Ordem cancelada não pode ser finalizada.', 'warning');
      return;
    }
    var actualQty = _num((document.getElementById('po-actual-quantity') || {}).value);
    var actualDate = ((document.getElementById('po-actual-date') || {}).value || '').trim();
    if (!actualQty || actualQty <= 0) {
      UI.toast('Informe a quantidade produzida real.', 'error');
      return;
    }
    if (!actualDate) {
      UI.toast('Informe a data real da produção.', 'error');
      return;
    }
    var metrics = _productionMetrics(order, actualQty);
    var result = _productionResult(order, metrics);
    var user = window.Auth && Auth.getUser ? Auth.getUser() : null;
    var patch = {
      actualQuantity: actualQty,
      actualDate: actualDate,
      realLossQuantity: _num((document.getElementById('po-real-loss') || {}).value),
      productionNotes: ((document.getElementById('po-production-notes') || {}).value || '').trim(),
      completedAt: new Date().toISOString(),
      completedBy: user && user.uid ? user.uid : '',
      completedByEmail: user && user.email ? user.email : '',
      status: 'concluida',
      yieldDifference: metrics.yieldDifference,
      yieldDifferencePercent: metrics.yieldDifferencePercent,
      yieldRealPercent: metrics.yieldRealPercent,
      estimatedRealUnitCost: metrics.estimatedRealUnitCost,
      plannedUnitCost: metrics.plannedUnitCost,
      costVariationPercent: metrics.costVariationPercent,
      productionResultStatus: result.status,
      productionResultLabel: result.label,
      productionResultMessage: result.message,
      updatedAt: new Date().toISOString()
    };
    var completedOrder = Object.assign({}, order, patch, { id: id });
    _createStockMovementsForOrder(completedOrder).then(function (movementInfo) {
      patch.stockMovementCreated = true;
      patch.stockMovementCreatedAt = new Date().toISOString();
      patch.stockMovementCount = movementInfo.count || 0;
      patch.stockMovementIngredientCount = movementInfo.ingredientCount || 0;
      patch.stockMovementProductCount = movementInfo.productCount || 0;
      return DB.update('production_orders', id, patch);
    }).then(function () {
      UI.toast('Produção registrada.', 'success');
      if (window._completeProductionOrderModal) window._completeProductionOrderModal.close();
      if (window._productionOrderDetailsModal) window._productionOrderDetailsModal.close();
      _renderProductionOrders();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _createStockMovementsForCompletedOrder(id) {
    var order = (_productionOrders || []).find(function (x) { return x.id === id; }) || null;
    if (!order) return;
    if (order.status !== 'concluida') {
      UI.toast('Finalize a produção antes de gerar movimentações.', 'warning');
      return;
    }
    if (order.stockMovementCreated) {
      UI.toast('Movimentações já foram geradas para esta ordem.', 'info');
      return;
    }
    _createStockMovementsForOrder(order).then(function (info) {
      return DB.update('production_orders', id, {
        stockMovementCreated: true,
        stockMovementCreatedAt: new Date().toISOString(),
        stockMovementCount: info.count || 0,
        stockMovementIngredientCount: info.ingredientCount || 0,
        stockMovementProductCount: info.productCount || 0
      });
    }).then(function () {
      UI.toast('Movimentações geradas.', 'success');
      if (window._productionOrderDetailsModal) window._productionOrderDetailsModal.close();
      _renderProductionOrders();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _createStockMovementsForOrder(order) {
    order = order || {};
    if (!order.id) return Promise.reject(new Error('Ordem não identificada.'));
    if (order.stockMovementCreated) {
      return Promise.resolve({
        count: _num(order.stockMovementCount),
        ingredientCount: _num(order.stockMovementIngredientCount),
        productCount: _num(order.stockMovementProductCount)
      });
    }
    return DB.getAll('stock_movements').catch(function () { return []; }).then(function (existing) {
      var matches = (existing || []).filter(function (m) { return m.productionOrderId === order.id; });
      if (matches.length) {
        var ingredientExisting = matches.filter(function (m) { return m.type === 'saida_producao'; }).length;
        var productExisting = matches.filter(function (m) { return m.type === 'entrada_producao'; }).length;
        return { count: matches.length, ingredientCount: ingredientExisting, productCount: productExisting };
      }
      var movements = _buildStockMovementsForOrder(order);
      if (!movements.length) return { count: 0, ingredientCount: 0, productCount: 0 };
      return Promise.all(movements.map(function (movement) {
        return DB.add('stock_movements', movement);
      })).then(function () {
        return {
          count: movements.length,
          ingredientCount: movements.filter(function (m) { return m.type === 'saida_producao'; }).length,
          productCount: movements.filter(function (m) { return m.type === 'entrada_producao'; }).length
        };
      });
    });
  }

  function _buildStockMovementsForOrder(order) {
    var snapshot = order.recipeSnapshot || {};
    var ingredients = order.plannedIngredients || snapshot.plannedIngredients || snapshot.ingredients || [];
    var movementDate = order.actualDate || order.completedAt || _today();
    var base = {
      movementGroup: 'production_order',
      productionOrderId: order.id || '',
      productionOrderName: order.fichaTecnicaNome || snapshot.name || '',
      movementDate: movementDate
    };
    var ingredientMovements = (ingredients || []).map(function (ing) {
      var quantity = _num(ing.plannedGrossQuantity || ing.plannedQty || ing.grossQuantityCalculated || ing.qty);
      var totalCost = _num(ing.plannedTotalCost != null ? ing.plannedTotalCost : ing.totalCost);
      var unitCost = _num(ing.unitCost) || (quantity > 0 ? totalCost / quantity : 0);
      return Object.assign({}, base, {
        type: 'saida_producao',
        ingredientId: ing.insumoId || '',
        ingredientName: ing.supplyName || ing.name || '',
        itemClass: ing.classe || ing.itemClass || 'insumo',
        classe: ing.classe || ing.itemClass || 'insumo',
        quantity: quantity,
        unit: ing.unit || '',
        unitCost: unitCost,
        totalCost: totalCost
      });
    }).filter(function (m) { return m.quantity > 0; });
    var actualQty = _num(order.actualQuantity);
    var metrics = _productionMetrics(order);
    var baseMovements = actualQty > 0 ? _buildBaseProductionMovements(order, snapshot, metrics, base) : [];
    if (order.productionMode === 'base_producao' || snapshot.productionMode === 'base_producao') {
      return ingredientMovements.concat(baseMovements);
    }
    var productMovement = actualQty > 0 ? [Object.assign({}, base, {
      type: 'entrada_producao',
      fichaTecnicaId: order.fichaTecnicaId || snapshot.id || '',
      fichaTecnicaNome: order.fichaTecnicaNome || snapshot.name || '',
      itemClass: snapshot.classe || snapshot.itemClass || order.classe || order.itemClass || 'produto_produzido',
      classe: snapshot.classe || snapshot.itemClass || order.classe || order.itemClass || 'produto_produzido',
      quantityProduced: actualQty,
      yieldUnit: snapshot.yieldUnit || 'unidades',
      estimatedUnitCost: metrics.estimatedRealUnitCost,
      estimatedTotalCost: metrics.estimatedRealUnitCost * actualQty
    })] : [];
    return ingredientMovements.concat(baseMovements, productMovement);
  }

  function _buildBaseProductionMovements(order, snapshot, metrics, base) {
    var plannedQty = _num(order.plannedQuantity || snapshot.plannedQuantity) || 1;
    var actualQty = _num(order.actualQuantity);
    var scale = plannedQty > 0 ? actualQty / plannedQty : 1;
    var components = snapshot.components || [];
    return components.map(function (comp, idx) {
      if (!(comp.stockControl || comp.controlsStock)) return null;
      var plannedBaseQty = _num(comp.baseYieldQuantity || comp.stockYieldQuantity);
      if (plannedBaseQty <= 0) plannedBaseQty = _num(snapshot.plannedQuantity || order.plannedQuantity || actualQty);
      var qty = _round(plannedBaseQty * scale);
      if (qty <= 0) return null;
      var compCost = (comp.ingredients || []).reduce(function (sum, ing) {
        return sum + _num(ing.totalCost || ing.plannedTotalCost);
      }, 0);
      var totalCost = compCost > 0 && components.length ? compCost * scale : (_num(metrics.plannedCost) * scale / Math.max(1, components.filter(function (c) { return c.stockControl || c.controlsStock; }).length));
      var unitCost = qty > 0 ? totalCost / qty : 0;
      return Object.assign({}, base, {
        type: 'entrada_base_producao',
        baseProductionId: (order.fichaTecnicaId || snapshot.id || 'receita') + ':' + (comp.name || 'etapa_' + idx),
        baseProductionName: comp.name || 'Base de produção',
        fichaTecnicaId: order.fichaTecnicaId || snapshot.id || '',
        fichaTecnicaNome: order.fichaTecnicaNome || snapshot.name || '',
        componentName: comp.name || '',
        itemClass: 'base_producao',
        classe: 'base_producao',
        stockItemType: 'base_producao',
        quantityProduced: qty,
        quantity: qty,
        yieldUnit: comp.baseYieldUnit || comp.stockYieldUnit || snapshot.yieldUnit || '',
        unit: comp.baseYieldUnit || comp.stockYieldUnit || snapshot.yieldUnit || '',
        estimatedUnitCost: unitCost,
        unitCost: unitCost,
        estimatedTotalCost: totalCost,
        totalCost: totalCost
      });
    }).filter(Boolean);
  }

  function _cancelProductionOrder(id) {
    var order = (_productionOrders || []).find(function (x) { return x.id === id; }) || null;
    if (!order) return;
    if (order.status === 'cancelada') { UI.toast('Esta ordem já está cancelada.', 'info'); return; }
    UI.confirm('Cancelar esta ordem de produção? Se já houver movimentações, o BocaFood criará estornos para manter o histórico.').then(function (yes) {
      if (!yes) return;
      return _reverseProductionStockMovements(order).then(function (patch) {
        patch = Object.assign({}, patch || {}, {
          status: 'cancelada',
          canceledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return DB.update('production_orders', id, patch);
      }).then(function () {
        UI.toast('Ordem cancelada.', 'success');
        if (window._productionOrderDetailsModal) window._productionOrderDetailsModal.close();
        _renderProductionOrders();
      }).catch(function (err) {
        UI.toast('Erro ao cancelar ordem: ' + (err && err.message ? err.message : err), 'error');
      });
    });
  }

  function _reverseProductionStockMovements(order) {
    if (!order || !order.id || !order.stockMovementCreated || order.stockMovementReversed) return Promise.resolve({});
    return DB.getAll('stock_movements').catch(function () { return []; }).then(function (existing) {
      var movements = (existing || []).filter(function (m) {
        return m && String(m.productionOrderId || '') === String(order.id || '') && (m.type === 'saida_producao' || m.type === 'entrada_producao' || m.type === 'entrada_base_producao');
      });
      if (!movements.length) return {};
      var already = (existing || []).some(function (m) {
        return m && String(m.productionOrderId || '') === String(order.id || '') && (m.type === 'estorno_producao_ingrediente' || m.type === 'estorno_producao_produto');
      });
      if (already) return { stockMovementReversed: true, stockMovementReversedAt: order.stockMovementReversedAt || new Date().toISOString() };
      var now = new Date().toISOString();
      var ops = movements.map(function (movement, idx) {
        var isProduct = movement.type === 'entrada_producao';
        var isBase = movement.type === 'entrada_base_producao';
        var id = String(order.id || 'ordem').replace(/[^\w-]/g, '_') + '_' + idx + '_' + (isProduct ? 'estorno_produto' : (isBase ? 'estorno_base' : 'estorno_ingrediente'));
        return DB.col('stock_movements').doc(id).set(Object.assign({}, movement, {
          id: id,
          type: isProduct ? 'estorno_producao_produto' : (isBase ? 'estorno_base_producao' : 'estorno_producao_ingrediente'),
          movementGroup: 'production_order',
          reversalOf: movement.id || '',
          reversalReason: 'cancelamento_ordem',
          quantity: movement.quantity || movement.quantityProduced || 0,
          quantityProduced: movement.quantityProduced || movement.quantity || 0,
          movementDate: now.slice(0, 10),
          createdAt: now,
          updatedAt: now
        }), { merge: true });
      });
      return Promise.all(ops).then(function () {
        return {
          stockMovementReversed: true,
          stockMovementReversedAt: now,
          stockMovementReversalCount: ops.length
        };
      });
    });
  }

  function _selectedProductionRecipe() {
    var id = ((document.getElementById('po-recipe') || {}).value || '').trim();
    return (_productionRecipes || []).find(function (f) { return f.id === id; }) || null;
  }

  function _updateProductionOrderMode() {
    var mode = ((document.getElementById('po-mode') || {}).value || 'produto_final').trim();
    var wrap = document.getElementById('po-base-wrap');
    if (wrap) wrap.style.display = mode === 'base_producao' ? 'block' : 'none';
    _updateProductionOrderPreview();
  }

  function _baseProductionOptions() {
    var list = [];
    (_productionRecipes || []).forEach(function (recipe) {
      (recipe.components || []).forEach(function (comp, idx) {
        if (!(comp && (comp.stockControl || comp.controlsStock))) return;
        list.push({
          id: (recipe.id || '') + ':' + (comp.name || 'etapa_' + idx),
          recipeId: recipe.id || '',
          recipeName: recipe.name || 'Ficha sem nome',
          componentName: comp.name || 'Base de produção',
          component: comp
        });
      });
    });
    return list;
  }

  function _baseProductionOptionsHtml() {
    return _baseProductionOptions().map(function (item) {
      return '<option value="' + _esc(item.id) + '">' + _esc(item.componentName) + ' · ' + _esc(item.recipeName) + '</option>';
    }).join('');
  }

  function _selectedProductionBase() {
    var found = _selectedProductionBaseItem();
    return found ? found.component : null;
  }

  function _selectedProductionBaseItem() {
    var id = ((document.getElementById('po-base') || {}).value || '').trim();
    if (!id) return null;
    return _baseProductionOptions().find(function (item) { return item.id === id; }) || null;
  }

  function _findBaseComponentByProductionId(recipe, baseProductionId) {
    recipe = recipe || {};
    var wanted = String(baseProductionId || '').trim();
    var components = recipe.components || [];
    return components.find(function (comp, idx) {
      if (!(comp && (comp.stockControl || comp.controlsStock))) return false;
      var id = (recipe.id || '') + ':' + (comp.name || 'etapa_' + idx);
      return id === wanted || String(comp.name || '') === wanted || wanted.indexOf(':' + String(comp.name || '')) > -1;
    }) || null;
  }

  function _buildProductionSnapshot(recipe, plannedQty) {
    var yieldQty = _num(recipe.yieldQuantity || recipe.yield) || 1;
    var yieldUnit = recipe.yieldUnit || 'unidades';
    var scale = plannedQty > 0 && yieldQty > 0 ? plannedQty / yieldQty : 0;
    var ingredients = _recipeIngredients(recipe).map(function (ing) {
      var qty = _num(ing.qty);
      var grossQty = _num(ing.grossQuantityCalculated || ing.grossQuantity || qty);
      var totalCost = _num(ing.totalCost);
      return {
        insumoId: ing.insumoId || '',
        supplyName: ing.supplyName || ing.name || '',
        itemClass: ing.itemClass || ing.classe || 'insumo',
        classe: ing.classe || ing.itemClass || 'insumo',
        componentName: ing.componentName || '',
        qty: qty,
        unit: ing.unit || '',
        lossPercent: _num(ing.lossPercent),
        grossQuantityCalculated: grossQty,
        unitCost: _num(ing.unitCost),
        totalCost: totalCost,
        plannedQty: qty * scale,
        plannedGrossQuantity: grossQty * scale,
        plannedTotalCost: totalCost * scale
      };
    });
    var ingredientCost = _num(recipe.ingredientCost);
    var packagingCost = _num(recipe.packagingCost);
    var directCost = _num(recipe.directCost) || ingredientCost + packagingCost;
    var indirectCost = _num(recipe.indirectCost);
    var ingredientTotalFallback = ingredients.reduce(function (sum, ing) { return sum + _num(ing.totalCost); }, 0);
    var totalCost = _num(recipe.totalCost) || (directCost + indirectCost) || ingredientTotalFallback;
    var costPerYield = _num(recipe.costPerYield) || (yieldQty > 0 ? totalCost / yieldQty : 0);
    var plannedCost = costPerYield * plannedQty;
    var recipeSnapshot = {
      id: recipe.id || '',
      name: recipe.name || '',
      itemClass: recipe.itemClass || recipe.classe || 'produto_produzido',
      classe: recipe.classe || recipe.itemClass || 'produto_produzido',
      yieldQuantity: yieldQty,
      yieldUnit: yieldUnit,
      components: (recipe.components || []).map(function (comp) {
        var controls = !!(comp.stockControl || comp.controlsStock);
        return Object.assign({}, comp, {
          stockControl: controls,
          controlsStock: controls,
          stockItemType: controls ? 'base_producao' : (comp.stockItemType || ''),
          itemClass: controls ? 'base_producao' : (comp.itemClass || comp.classe || ''),
          classe: controls ? 'base_producao' : (comp.classe || comp.itemClass || ''),
          baseYieldQuantity: controls ? _num(comp.baseYieldQuantity || comp.stockYieldQuantity) : 0,
          stockYieldQuantity: controls ? _num(comp.baseYieldQuantity || comp.stockYieldQuantity) : 0,
          baseYieldUnit: controls ? (comp.baseYieldUnit || comp.stockYieldUnit || '') : '',
          stockYieldUnit: controls ? (comp.baseYieldUnit || comp.stockYieldUnit || '') : ''
        });
      }),
      ingredients: ingredients,
      ingredientCost: ingredientCost || ingredientTotalFallback,
      packagingCost: packagingCost,
      directCost: directCost || ingredientTotalFallback,
      indirectCost: indirectCost,
      indirectCostPercent: _num(recipe.indirectCostPercent),
      totalCost: totalCost,
      costPerYield: costPerYield,
      plannedQuantity: plannedQty,
      plannedCost: plannedCost,
      plannedIngredients: ingredients
    };
    return {
      yieldQuantity: yieldQty,
      yieldUnit: yieldUnit,
      totalCost: totalCost,
      costPerYield: costPerYield,
      plannedCost: plannedCost,
      plannedIngredients: ingredients,
      recipeSnapshot: recipeSnapshot
    };
  }

  function _buildBaseProductionSnapshot(recipe, component, plannedQty) {
    recipe = recipe || {};
    component = component || {};
    var yieldQty = _num(component.baseYieldQuantity || component.stockYieldQuantity) || _num(recipe.yieldQuantity || recipe.yield) || 1;
    var yieldUnit = component.baseYieldUnit || component.stockYieldUnit || recipe.yieldUnit || 'unidades';
    var scale = plannedQty > 0 && yieldQty > 0 ? plannedQty / yieldQty : 0;
    var ingredients = (component.ingredients || []).map(function (ing) {
      var qty = _num(ing.qty);
      var grossQty = _num(ing.grossQuantityCalculated || ing.grossQuantity || qty);
      var totalCost = _num(ing.totalCost);
      return {
        insumoId: ing.insumoId || '',
        supplyName: ing.supplyName || ing.name || '',
        itemClass: ing.itemClass || ing.classe || 'insumo',
        classe: ing.classe || ing.itemClass || 'insumo',
        componentName: component.name || '',
        qty: qty,
        unit: ing.unit || '',
        lossPercent: _num(ing.lossPercent),
        grossQuantityCalculated: grossQty,
        unitCost: _num(ing.unitCost),
        totalCost: totalCost,
        plannedQty: qty * scale,
        plannedGrossQuantity: grossQty * scale,
        plannedTotalCost: totalCost * scale
      };
    });
    var totalCost = ingredients.reduce(function (sum, ing) { return sum + _num(ing.totalCost); }, 0);
    var costPerYield = yieldQty > 0 ? totalCost / yieldQty : 0;
    var plannedCost = costPerYield * plannedQty;
    var baseComponent = Object.assign({}, component, {
      stockControl: true,
      controlsStock: true,
      stockItemType: 'base_producao',
      itemClass: 'base_producao',
      classe: 'base_producao',
      baseYieldQuantity: yieldQty,
      stockYieldQuantity: yieldQty,
      baseYieldUnit: yieldUnit,
      stockYieldUnit: yieldUnit,
      ingredients: component.ingredients || []
    });
    var recipeSnapshot = {
      id: recipe.id || '',
      name: recipe.name || '',
      productionMode: 'base_producao',
      baseProductionId: (recipe.id || '') + ':' + (component.name || 'base'),
      baseProductionName: component.name || 'Base de produção',
      itemClass: 'base_producao',
      classe: 'base_producao',
      yieldQuantity: yieldQty,
      yieldUnit: yieldUnit,
      components: [baseComponent],
      ingredients: ingredients,
      ingredientCost: totalCost,
      packagingCost: 0,
      directCost: totalCost,
      indirectCost: 0,
      totalCost: totalCost,
      costPerYield: costPerYield,
      plannedQuantity: plannedQty,
      plannedCost: plannedCost,
      plannedIngredients: ingredients
    };
    return {
      yieldQuantity: yieldQty,
      yieldUnit: yieldUnit,
      totalCost: totalCost,
      costPerYield: costPerYield,
      plannedCost: plannedCost,
      plannedIngredients: ingredients,
      recipeSnapshot: recipeSnapshot
    };
  }

  function _recipeIngredients(recipe) {
    var out = [];
    if (Array.isArray(recipe.components) && recipe.components.length) {
      recipe.components.forEach(function (comp) {
        (comp.ingredients || []).forEach(function (ing) {
          out.push(Object.assign({ componentName: comp.name || '' }, ing));
        });
      });
    }
    if (!out.length && Array.isArray(recipe.ingredients)) out = recipe.ingredients.slice();
    return out;
  }

  function _detailTile(label, value) {
    return '<div class="production-detail-tile"><div class="production-orders-label">' + _esc(label) + '</div><div class="production-orders-value">' + _esc(value) + '</div></div>';
  }

  function _movementTypeLabel(type) {
    if (type === 'saida_producao') return 'Saída de ingredientes';
    if (type === 'entrada_producao') return 'Entrada produzida';
    if (type === 'entrada_base_producao') return 'Entrada de base';
    if (type === 'saida_base_venda') return 'Saída de base por venda';
    if (type === 'estorno_base_producao') return 'Estorno de base';
    return type || 'Movimentação';
  }

  function _movementItemName(movement) {
    if (!movement) return '—';
    if (movement.type === 'saida_producao') return movement.ingredientName || 'Ingrediente';
    if (movement.type === 'entrada_producao') return movement.fichaTecnicaNome || 'Produto produzido';
    if (movement.type === 'entrada_base_producao' || movement.type === 'estorno_base_producao') return movement.baseProductionName || movement.componentName || 'Base de produção';
    return movement.itemName || 'Item';
  }

  function _movementQuantityLabel(movement) {
    if (!movement) return '—';
    if (movement.type === 'entrada_producao' || movement.type === 'entrada_base_producao' || movement.type === 'estorno_base_producao') return _fmtQty(movement.quantityProduced || movement.quantity) + ' ' + (movement.yieldUnit || movement.unit || '');
    return _fmtQty(movement.quantity) + ' ' + (movement.unit || '');
  }

  function _statusLabel(status) {
    if (status === 'planejada') return 'Planejada';
    if (status === 'concluida') return 'Concluída';
    if (status === 'cancelada') return 'Cancelada';
    return status || 'Planejada';
  }

  function _productionMetrics(order, actualOverride) {
    order = order || {};
    var plannedQty = _num(order.plannedQuantity);
    var actualQty = actualOverride != null ? _num(actualOverride) : _num(order.actualQuantity);
    var plannedCost = _num(order.plannedCost) || _num(order.recipeSnapshot && order.recipeSnapshot.plannedCost) || _num(order.recipeSnapshot && order.recipeSnapshot.totalCost);
    var plannedUnitCost = plannedQty > 0 ? plannedCost / plannedQty : 0;
    var estimatedRealUnitCost = actualQty > 0 ? plannedCost / actualQty : 0;
    var yieldDifference = actualQty > 0 ? actualQty - plannedQty : 0;
    var yieldDifferencePercent = plannedQty > 0 && actualQty > 0 ? (yieldDifference / plannedQty) * 100 : 0;
    var yieldRealPercent = plannedQty > 0 && actualQty > 0 ? (actualQty / plannedQty) * 100 : 0;
    var costVariationPercent = plannedUnitCost > 0 && estimatedRealUnitCost > 0 ? ((estimatedRealUnitCost - plannedUnitCost) / plannedUnitCost) * 100 : 0;
    return {
      plannedQuantity: plannedQty,
      actualQuantity: actualQty,
      plannedCost: plannedCost,
      plannedUnitCost: plannedUnitCost,
      estimatedRealUnitCost: estimatedRealUnitCost,
      yieldDifference: yieldDifference,
      yieldDifferencePercent: yieldDifferencePercent,
      yieldRealPercent: yieldRealPercent,
      costVariationPercent: costVariationPercent
    };
  }

  function _productionResult(order, metrics) {
    order = order || {};
    metrics = metrics || _productionMetrics(order);
    if (order.productionResultStatus && order.productionResultLabel && order.productionResultMessage) {
      return {
        status: order.productionResultStatus,
        label: order.productionResultLabel,
        message: order.productionResultMessage,
        tone: _productionResultTone(order.productionResultStatus)
      };
    }
    if (!metrics.actualQuantity || metrics.actualQuantity <= 0) {
      return {
        status: '',
        label: 'Pendente',
        message: 'Finalize a produção para ver a leitura do resultado.',
        tone: ''
      };
    }
    var diffPercent = metrics.yieldDifferencePercent;
    if (metrics.yieldDifference > 0) {
      return {
        status: 'rendimento_maior',
        label: 'Rendimento maior',
        message: 'A produção rendeu mais que o previsto. Vale conferir se a ficha técnica está correta.',
        tone: 'up'
      };
    }
    if (Math.abs(diffPercent) <= 5) {
      return {
        status: 'dentro_do_esperado',
        label: 'Dentro do esperado',
        message: 'A produção ficou próxima do planejado.',
        tone: 'ok'
      };
    }
    if (diffPercent < -15) {
      return {
        status: 'rendimento_muito_menor',
        label: 'Rendimento muito menor',
        message: 'A produção teve uma diferença alta. Isso pode indicar perda, erro de rendimento ou falha no processo.',
        tone: 'danger'
      };
    }
    return {
      status: 'rendimento_menor',
      label: 'Rendimento menor',
      message: 'A produção rendeu menos que o previsto. Vale revisar perdas ou quantidade final.',
      tone: 'warn'
    };
  }

  function _productionResultTone(status) {
    if (status === 'dentro_do_esperado') return 'ok';
    if (status === 'rendimento_maior') return 'up';
    if (status === 'rendimento_muito_menor') return 'danger';
    if (status === 'rendimento_menor') return 'warn';
    return '';
  }

  function _num(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    var raw = String(value).trim();
    var normalized = raw.indexOf(',') >= 0 ? raw.replace(/\./g, '').replace(',', '.') : raw;
    var n = parseFloat(normalized);
    return isFinite(n) ? n : 0;
  }

  function _round(value) {
    return Math.round((_num(value) + Number.EPSILON) * 10000) / 10000;
  }

  function _normalizeStockClass(value) {
    var key = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '_');
    if (!key) return '';
    if (key === 'insumo' || key === 'ingrediente' || key === 'ingredient') return 'insumo';
    if (key === 'produto' || key === 'produto_pronto' || key === 'ready_product') return 'produto';
    if (key === 'produto_produzido' || key === 'produzido' || key === 'produced_product' || key === 'ficha_tecnica') return 'produto_produzido';
    if (key === 'base_producao' || key === 'base' || key === 'semiacabado' || key === 'preparo_intermediario') return 'base_producao';
    return key;
  }

  function _fmtQty(value) {
    var n = _num(value);
    if (Math.abs(n - Math.round(n)) < 0.000001) return String(Math.round(n));
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  function _signedQty(value) {
    var n = _num(value);
    if (!n) return '0';
    return (n > 0 ? '+' : '') + _fmtQty(n);
  }

  function _percent(value) {
    var n = _num(value);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  }

  function _signedPercent(value) {
    var n = _num(value);
    return (n > 0 ? '+' : '') + _percent(n);
  }

  function _money(value) {
    return window.UI && UI.fmt ? UI.fmt(_num(value)) : ('€' + _num(value).toFixed(2).replace('.', ','));
  }

  function _fmtDate(value) {
    if (!value) return '—';
    var d = value && value.toDate ? value.toDate() : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('pt-BR');
  }

  function _dateTimeValue(value) {
    if (!value) return 0;
    var d = value && value.toDate ? value.toDate() : new Date(value);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function _today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function _renderConfiguracoes(subKey) {
    var content = document.getElementById('receitas-content');
    if (!content) return;
    subKey = subKey || 'componentes';
    var meta = _configMeta(subKey);
    var addLabelMap = {
      componentes: meta.add,
      'categorias-receita': meta.add,
      'tipos-insumos': meta.add,
      'categorias-insumos': meta.add,
      unidades: meta.add
    };
    var addActionMap = {
      componentes: 'Modules.Receitas._openRecipeComponentModal(null)',
      'categorias-receita': 'Modules.Receitas._openRecipeCategoryModal(null)',
      'tipos-insumos': 'Modules.Receitas._openIngredientCatalogModal(\'tipos\',null)',
      'categorias-insumos': 'Modules.Receitas._openIngredientCatalogModal(\'categorias\',null)',
      unidades: 'Modules.Receitas._openUnitModal(null)'
    };
    content.innerHTML = _configStyles() +
      '<div class="recipes-config-wrap">' +
      '<div class="recipes-config-head">' +
        '<div><h1 class="recipes-config-title">Configurações</h1><p class="recipes-config-subtitle">Organize as bases usadas nas receitas para preencher fichas com mais rapidez e manter a produção clara.</p></div>' +
      '</div>' +
      '<div class="recipes-config-filter">' +
        '<div class="recipes-config-filter-grid">' +
          '<div><label style="' + _labelStyle() + '">Buscar</label><div class="recipes-config-control"><input id="receitas-config-search" type="search" placeholder="Buscar por nome..." value="' + _esc(_configSearch || '') + '" oninput="Modules.Receitas._setConfigSearch(this.value)"></div></div>' +
          '<div><label style="' + _labelStyle() + '">Área</label><div class="recipes-config-chip-row">' +
            CONFIG_TABS.map(function (t) {
              var active = t.key === subKey;
              return '<button class="recipes-config-chip ' + (active ? 'active' : '') + '" onclick="Modules.Receitas._switchConfigSub(\'' + t.key + '\')">' + _esc(t.label) + '</button>';
            }).join('') +
          '</div></div>' +
        '</div>' +
      '</div>' +
      '<div id="receitas-config-content"></div>';
    if (subKey === 'componentes') return _renderRecipeComponents();
    if (subKey === 'categorias-receita') return _renderRecipeCategories();
    if (subKey === 'tipos-insumos') return _renderIngredientCatalog('tipos');
    if (subKey === 'categorias-insumos') return _renderIngredientCatalog('categorias');
    if (subKey === 'unidades') return _renderUnits();
  }

  function _setConfigSearch(value) {
    _configSearch = String(value || '').trim();
    var key = _configSub(_activeSub) || 'componentes';
    if (key === 'componentes') return _paintRecipeComponents();
    if (key === 'categorias-receita') return _paintRecipeCategories();
    if (key === 'tipos-insumos') return _paintIngredientCatalog('tipos');
    if (key === 'categorias-insumos') return _paintIngredientCatalog('categorias');
    if (key === 'unidades') return _paintUnits();
  }

  function _matchesConfigSearch(item) {
    var q = (_configSearch || '').toLowerCase();
    if (!q) return true;
    var hay = [item && item.name, item && item.description, item && item.symbol, item && item.type].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function _configCardHtml(meta, addAction, emptyTitle, rowsHtml, count) {
    return '<section class="recipes-config-card">' +
      '<div class="recipes-config-card-head">' +
        '<div><div class="recipes-config-section-title">' + _esc(meta.title) + ' (' + count + ')</div><div class="recipes-config-section-desc">' + _esc(meta.desc || '') + '</div></div>' +
        '<button type="button" class="recipes-config-primary" onclick="' + addAction + '">' + _esc(meta.add || '+ Adicionar') + '</button>' +
      '</div>' +
      (rowsHtml ? '<div class="recipes-config-list">' + rowsHtml + '</div>' : '<div class="recipes-config-empty">' + _esc(emptyTitle || 'Nenhum registro encontrado') + '</div>') +
      '</section>';
  }

  function _renderRecipeComponents() {
    DB.getAll('recipe_components').then(function (items) {
      _recipeComponents = (items || []).slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0) || String(a.name || '').localeCompare(String(b.name || ''));
      });
      _paintRecipeComponents();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _paintRecipeComponents() {
    var content = document.getElementById('receitas-config-content') || document.getElementById('receitas-content');
    if (!content) return;
    var filtered = _recipeComponents.filter(_matchesConfigSearch);
    var rows = filtered.map(function (comp) {
      return '<div class="recipes-config-row">' +
        '<div style="min-width:0;flex:1;"><div class="recipes-config-row-title">' + _esc(comp.name) + '</div>' +
        '<div class="recipes-config-row-text">' + _esc(comp.description || 'Etapa usada para separar ingredientes dentro da receita.') + '</div></div>' +
        '<div class="recipes-config-actions">' +
        '<button onclick="Modules.Receitas._openRecipeComponentModal(\'' + comp.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
        '<button onclick="Modules.Receitas._deleteRecipeComponent(\'' + comp.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
        '</div></div>';
    }).join('');
    content.innerHTML = _configCardHtml(_configMeta('componentes'), 'Modules.Receitas._openRecipeComponentModal(null)', 'Nenhuma etapa encontrada.', rows, filtered.length);
  }

  function _openRecipeComponentModal(id) {
    _editingComponentId = id;
    var comp = id ? (_recipeComponents.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div>' +
      '<label style="display:block;margin-bottom:12px;"><span style="' + _labelStyle() + '">Nome do componente *</span><input id="rcomp-name" type="text" value="' + _esc(comp.name || '') + '" placeholder="Ex: Massa" style="' + _inputStyle() + '"></label>' +
      '<label style="display:block;"><span style="' + _labelStyle() + '">Descrição</span><textarea id="rcomp-desc" placeholder="Uso interno opcional" style="' + _inputStyle() + 'min-height:84px;resize:vertical;"></textarea></label>' +
      '</div>';
    var footer = '<button onclick="Modules.Receitas._saveRecipeComponent()" style="width:100%;height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Salvar componente</button>';
    window._recipeComponentModal = UI.modal({ title: id ? 'Editar Componente da Receita' : 'Novo Componente da Receita', body: body, footer: footer });
  }

  function _saveRecipeComponent() {
    var name = ((document.getElementById('rcomp-name') || {}).value || '').trim();
    if (!name) { UI.toast('Nome obrigatório', 'error'); return; }
    var data = {
      name: name,
      description: ((document.getElementById('rcomp-desc') || {}).value || '').trim(),
      updatedAt: new Date().toISOString()
    };
    if (!_editingComponentId) data.createdAt = new Date().toISOString();
    var op = _editingComponentId ? DB.update('recipe_components', _editingComponentId, data) : DB.add('recipe_components', data);
    op.then(function () {
      UI.toast('Componente salvo', 'success');
      if (window._recipeComponentModal) window._recipeComponentModal.close();
      _renderRecipeComponents();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteRecipeComponent(id) {
    UI.confirm('Eliminar este componente da receita?').then(function (yes) {
      if (!yes) return;
      DB.remove('recipe_components', id).then(function () {
        UI.toast('Componente eliminado', 'info');
        _renderRecipeComponents();
      });
    });
  }

  function _renderRecipeCategories() {
    DB.getAll('recipe_categories').then(function (items) {
      _recipeCategories = (items || []).slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0) || String(a.name || '').localeCompare(String(b.name || ''));
      });
      _paintRecipeCategories();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _paintRecipeCategories() {
    var content = document.getElementById('receitas-config-content') || document.getElementById('receitas-content');
    if (!content) return;
    var filtered = _recipeCategories.filter(_matchesConfigSearch);
    var rows = filtered.map(function (cat) {
      return '<div class="recipes-config-row">' +
        '<div style="min-width:0;flex:1;"><div class="recipes-config-row-title">' + _esc(cat.name) + '</div>' +
        '<div class="recipes-config-row-text">' + _esc(cat.description || 'Categoria usada para agrupar receitas parecidas.') + '</div></div>' +
        '<div class="recipes-config-actions">' +
        '<button onclick="Modules.Receitas._openRecipeCategoryModal(\'' + cat.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
        '<button onclick="Modules.Receitas._deleteRecipeCategory(\'' + cat.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
        '</div></div>';
    }).join('');
    content.innerHTML = _configCardHtml(_configMeta('categorias-receita'), 'Modules.Receitas._openRecipeCategoryModal(null)', 'Nenhuma categoria encontrada.', rows, filtered.length);
  }

  function _openRecipeCategoryModal(id) {
    _editingCategoryId = id;
    var cat = id ? (_recipeCategories.find(function (x) { return x.id === id; }) || {}) : {};
    var body = '<div>' +
      '<label style="display:block;margin-bottom:12px;"><span style="' + _labelStyle() + '">Nome da categoria *</span><input id="rc-name" type="text" value="' + _esc(cat.name || '') + '" placeholder="Ex: Salgados" style="' + _inputStyle() + '"></label>' +
      '<label style="display:block;"><span style="' + _labelStyle() + '">Descrição</span><textarea id="rc-desc" placeholder="Uso interno opcional" style="' + _inputStyle() + 'min-height:84px;resize:vertical;"></textarea></label>' +
      '</div>';
    var footer = '<button onclick="Modules.Receitas._saveRecipeCategory()" style="width:100%;height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Salvar categoria</button>';
    window._recipeCategoryModal = UI.modal({ title: id ? 'Editar Categoria da Receita' : 'Nova Categoria da Receita', body: body, footer: footer });
  }

  function _saveRecipeCategory() {
    var name = ((document.getElementById('rc-name') || {}).value || '').trim();
    if (!name) { UI.toast('Nome obrigatório', 'error'); return; }
    var data = {
      name: name,
      description: ((document.getElementById('rc-desc') || {}).value || '').trim(),
      updatedAt: new Date().toISOString()
    };
    if (!_editingCategoryId) data.createdAt = new Date().toISOString();
    var op = _editingCategoryId ? DB.update('recipe_categories', _editingCategoryId, data) : DB.add('recipe_categories', data);
    op.then(function () {
      UI.toast('Categoria salva', 'success');
      if (window._recipeCategoryModal) window._recipeCategoryModal.close();
      _renderRecipeCategories();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteRecipeCategory(id) {
    UI.confirm('Eliminar esta categoria da receita?').then(function (yes) {
      if (!yes) return;
      DB.remove('recipe_categories', id).then(function () {
        UI.toast('Categoria eliminada', 'info');
        _renderRecipeCategories();
      });
    });
  }

  function _ingredientCatalogConfig(kind) {
    return kind === 'tipos'
      ? { col: 'compras_tipos', title: 'Tipos de insumos', singular: 'tipo', list: _ingredientTypes }
      : { col: 'compras_categorias', title: 'Categorias de insumos', singular: 'categoria', list: _ingredientCategories };
  }

  function _renderIngredientCatalog(kind) {
    var cfg = _ingredientCatalogConfig(kind);
    DB.getAll(cfg.col).then(function (items) {
      var list = (items || []).filter(function (item) {
        return item && item.classe === 'insumo';
      }).sort(function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
      if (kind === 'tipos') _ingredientTypes = list;
      else _ingredientCategories = list;
      _paintIngredientCatalog(kind);
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _paintIngredientCatalog(kind) {
    var cfg = _ingredientCatalogConfig(kind);
    var list = kind === 'tipos' ? _ingredientTypes : _ingredientCategories;
    var content = document.getElementById('receitas-config-content') || document.getElementById('receitas-content');
    if (!content) return;
    var key = kind === 'tipos' ? 'tipos-insumos' : 'categorias-insumos';
    var filtered = list.filter(_matchesConfigSearch);
    var rows = filtered.map(function (item) {
      return '<div class="recipes-config-row">' +
        '<div style="min-width:0;flex:1;"><div class="recipes-config-row-title">' + _esc(item.name || '-') + '</div>' +
        '</div>' +
        '<div class="recipes-config-actions">' +
        '<span class="recipes-config-status ' + (item.ativo === false ? 'inactive' : '') + '">' + (item.ativo === false ? 'Inativo' : 'Ativo') + '</span>' +
        '<button onclick="Modules.Receitas._openIngredientCatalogModal(\'' + kind + '\',\'' + item.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
        '<button onclick="Modules.Receitas._deleteIngredientCatalog(\'' + kind + '\',\'' + item.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
        '</div></div>';
    }).join('');
    content.innerHTML = _configCardHtml(_configMeta(key), 'Modules.Receitas._openIngredientCatalogModal(\'' + kind + '\',null)', 'Nenhum registro encontrado.', rows, filtered.length);
  }

  function _openIngredientCatalogModal(kind, id) {
    var cfg = _ingredientCatalogConfig(kind);
    var list = kind === 'tipos' ? _ingredientTypes : _ingredientCategories;
    var item = id ? (list.find(function (x) { return x.id === id; }) || {}) : { ativo: true };
    _editingIngredientCatalogKind = kind;
    _editingIngredientCatalogId = id;
    var body = '<div>' +
      '<label style="display:block;margin-bottom:12px;"><span style="' + _labelStyle() + '">Nome *</span><input id="ric-name" type="text" value="' + _esc(item.name || '') + '" placeholder="' + (kind === 'tipos' ? 'Ex: Ingrediente' : 'Ex: Secos') + '" style="' + _inputStyle() + '"></label>' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:#1F1F1F;margin-top:12px;">' +
      '<input id="ric-ativo" type="checkbox" ' + (item.ativo !== false ? 'checked' : '') + ' style="accent-color:#B42318;width:16px;height:16px;"> Cadastro ativo</label>' +
      '</div>';
    var footer = '<button onclick="Modules.Receitas._saveIngredientCatalog()" style="width:100%;height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Salvar ' + cfg.singular + '</button>';
    window._ingredientCatalogModal = UI.modal({ title: id ? 'Editar ' + cfg.title : 'Novo ' + cfg.title, body: body, footer: footer });
  }

  function _saveIngredientCatalog() {
    var kind = _editingIngredientCatalogKind || 'tipos';
    var cfg = _ingredientCatalogConfig(kind);
    var name = ((document.getElementById('ric-name') || {}).value || '').trim().replace(/\s+/g, ' ');
    if (!name) { UI.toast('Nome obrigatório', 'error'); return; }
    DB.getAll(cfg.col).then(function (items) {
      var norm = _normName(name);
      var duplicate = (items || []).find(function (item) {
        return item && item.id !== _editingIngredientCatalogId && item.classe === 'insumo' && _normName(item.name) === norm;
      });
      if (duplicate) {
        UI.toast('Já existe ' + cfg.singular + ' de insumo com esse nome.', 'error');
        return null;
      }
      var data = { name: name, classe: 'insumo', ativo: (document.getElementById('ric-ativo') || {}).checked !== false };
      return _editingIngredientCatalogId ? DB.update(cfg.col, _editingIngredientCatalogId, data) : DB.add(cfg.col, data);
    }).then(function (res) {
      if (res === null) return;
      UI.toast((kind === 'tipos' ? 'Tipo' : 'Categoria') + ' salvo!', 'success');
      if (window._ingredientCatalogModal) window._ingredientCatalogModal.close();
      _renderIngredientCatalog(kind);
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _deleteIngredientCatalog(kind, id) {
    var cfg = _ingredientCatalogConfig(kind);
    UI.confirm('Eliminar este ' + cfg.singular + ' de insumo?').then(function (yes) {
      if (!yes) return;
      if (window._ingredientCatalogModal) window._ingredientCatalogModal.close();
      DB.remove(cfg.col, id).then(function () {
        UI.toast((kind === 'tipos' ? 'Tipo' : 'Categoria') + ' eliminado', 'info');
        _renderIngredientCatalog(kind);
      });
    });
  }

  function _renderUnits() {
    DB.getAll('unidades_medida').then(function (items) {
      _units = (items || []).slice().sort(function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
      _paintUnits();
    }).catch(function (err) {
      UI.toast('Erro: ' + err.message, 'error');
    });
  }

  function _paintUnits() {
    var content = document.getElementById('receitas-config-content') || document.getElementById('receitas-content');
    if (!content) return;
    var filtered = _units.filter(_matchesConfigSearch);
    var rows = filtered.map(function (u) {
      return '<div class="recipes-config-row">' +
        '<div style="min-width:0;flex:1;"><div class="recipes-config-row-title">' + _esc(u.name || '-') + '</div>' +
        '<div class="recipes-config-row-text">' + _esc(u.symbol || '-') + ' · ' + _esc(u.type || 'unidade') + '</div></div>' +
        '<div class="recipes-config-actions">' +
          '<button onclick="Modules.Receitas._openUnitModal(\'' + u.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
          '<button onclick="Modules.Receitas._deleteUnit(\'' + u.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
        '</div></div>';
    }).join('');
    content.innerHTML = _configCardHtml(_configMeta('unidades'), 'Modules.Receitas._openUnitModal(null)', 'Nenhuma unidade encontrada.', rows, filtered.length);
  }

  function _openUnitModal(id) {
    _editingUnitId = id;
    var u = id ? (_units.find(function (x) { return x.id === id; }) || {}) : { type: 'unidade' };
    var body = '<div>' +
      '<label style="display:block;margin-bottom:12px;"><span style="' + _labelStyle() + '">Nome *</span><input id="ru-name" type="text" value="' + _esc(u.name || '') + '" placeholder="Ex: Quilograma" style="' + _inputStyle() + '"></label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Símbolo *</span><input id="ru-symbol" type="text" value="' + _esc(u.symbol || '') + '" placeholder="kg" style="' + _inputStyle() + '"></label>' +
        '<label style="display:block;"><span style="' + _labelStyle() + '">Tipo</span><select id="ru-type" style="' + _inputStyle() + 'background:#fff;"><option value="massa"' + (u.type === 'massa' ? ' selected' : '') + '>Massa</option><option value="volume"' + (u.type === 'volume' ? ' selected' : '') + '>Volume</option><option value="unidade"' + (!u.type || u.type === 'unidade' ? ' selected' : '') + '>Unidade</option></select></label>' +
      '</div>' +
      '</div>';
    var footer = '<button onclick="Modules.Receitas._saveUnit()" style="width:100%;height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">' + (id ? 'Atualizar unidade' : 'Adicionar unidade') + '</button>';
    window._unitReceitasModal = UI.modal({ title: id ? 'Editar Unidade' : 'Nova Unidade', body: body, footer: footer });
  }

  function _saveUnit() {
    var name = ((document.getElementById('ru-name') || {}).value || '').trim();
    var symbol = ((document.getElementById('ru-symbol') || {}).value || '').trim();
    if (!name || !symbol) { UI.toast('Nome e símbolo são obrigatórios', 'error'); return; }
    var data = {
      name: name,
      symbol: symbol,
      type: (document.getElementById('ru-type') || {}).value || 'unidade'
    };
    var op = _editingUnitId ? DB.update('unidades_medida', _editingUnitId, data) : DB.add('unidades_medida', data);
    op.then(function () {
      UI.toast('Unidade salva', 'success');
      if (window._unitReceitasModal) window._unitReceitasModal.close();
      _renderUnits();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _deleteUnit(id) {
    UI.confirm('Eliminar esta unidade?').then(function (yes) {
      if (!yes) return;
      DB.remove('unidades_medida', id).then(function () {
        UI.toast('Unidade eliminada', 'info');
        _renderUnits();
      });
    });
  }

  function _esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function _escJs(value) {
    return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
  }

  function _normName(s) {
    return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  return {
    render: render,
    _switchSub: _switchSub,
    _switchConfigSub: _switchConfigSub,
    _setConfigSearch: _setConfigSearch,
    _openProductionOrderModal: _openProductionOrderModal,
    _saveProductionOrder: _saveProductionOrder,
    _openProductionOrderDetails: _openProductionOrderDetails,
    _updateProductionOrderMode: _updateProductionOrderMode,
    _updateProductionOrderPreview: _updateProductionOrderPreview,
    _openCompleteProductionOrderModal: _openCompleteProductionOrderModal,
    _updateProductionCompletionPreview: _updateProductionCompletionPreview,
    _completeProductionOrder: _completeProductionOrder,
    _createStockMovementsForCompletedOrder: _createStockMovementsForCompletedOrder,
    _cancelProductionOrder: _cancelProductionOrder,
    _setStockMovementFilter: _setStockMovementFilter,
    _setPurchaseListOption: _setPurchaseListOption,
    _createProductionOrderFromNeed: _createProductionOrderFromNeed,
    _openRecipeComponentModal: _openRecipeComponentModal,
    _saveRecipeComponent: _saveRecipeComponent,
    _deleteRecipeComponent: _deleteRecipeComponent,
    _openRecipeCategoryModal: _openRecipeCategoryModal,
    _saveRecipeCategory: _saveRecipeCategory,
    _deleteRecipeCategory: _deleteRecipeCategory,
    _openIngredientCatalogModal: _openIngredientCatalogModal,
    _saveIngredientCatalog: _saveIngredientCatalog,
    _deleteIngredientCatalog: _deleteIngredientCatalog,
    _openUnitModal: _openUnitModal,
    _saveUnit: _saveUnit,
    _deleteUnit: _deleteUnit
  };
})();
