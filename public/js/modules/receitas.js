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
  var TABS = [
    { key: 'receitas', label: 'Receitas' },
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

    content.innerHTML = '<div id="compras-content"></div>';
    if (key === 'insumos') return Modules.Compras._renderInsumos();
    if (_mainSub(key) === 'configuracoes') return _renderConfiguracoes(_configSub(key));
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

  function _normName(s) {
    return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  return {
    render: render,
    _switchSub: _switchSub,
    _switchConfigSub: _switchConfigSub,
    _setConfigSearch: _setConfigSearch,
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
