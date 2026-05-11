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
  var TABS = [
    { key: 'receitas', label: 'Receitas' },
    { key: 'insumos', label: 'Insumos' },
    { key: 'configuracoes', label: 'Configurações' }
  ];
  var CONFIG_TABS = [
    { key: 'componentes', label: 'Componentes da receita' },
    { key: 'categorias-receita', label: 'Categorias da receita' },
    { key: 'tipos-insumos', label: 'Tipos de insumos' },
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
    if (key === 'tipos') key = 'tipos-insumos';
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
    var addLabelMap = {
      componentes: '+ Novo componente',
      'categorias-receita': '+ Nova categoria',
      'tipos-insumos': '+ Novo tipo',
      'categorias-insumos': '+ Nova categoria',
      unidades: '+ Nova unidade'
    };
    var addActionMap = {
      componentes: 'Modules.Receitas._openRecipeComponentModal(null)',
      'categorias-receita': 'Modules.Receitas._openRecipeCategoryModal(null)',
      'tipos-insumos': 'Modules.Receitas._openIngredientCatalogModal(\'tipos\',null)',
      'categorias-insumos': 'Modules.Receitas._openIngredientCatalogModal(\'categorias\',null)',
      unidades: 'Modules.Receitas._openUnitModal(null)'
    };
    content.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div><div style="font-size:11px;font-weight:600;color:#A39B90;letter-spacing:.02em;margin-bottom:5px;">Produção</div><h1 style="font-size:28px;font-weight:600;line-height:1.1;margin:0 0 6px;color:#1F1F1F;">Configurações da produção</h1><p style="font-size:15px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;">Gerencie os cadastros auxiliares usados em receitas e insumos, como componentes, categorias, tipos e unidades.</p></div>' +
        '<button onclick="' + (addActionMap[subKey] || 'void(0)') + '" style="' + _primaryBtnStyle() + '">' + (addLabelMap[subKey] || '+ Adicionar') + '</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">' +
        CONFIG_TABS.map(function (t) {
          var active = t.key === subKey;
          return '<button onclick="Modules.Receitas._switchConfigSub(\'' + t.key + '\')" style="height:38px;padding:0 14px;border:1px solid ' + (active ? '#B42318' : '#EAE4DA') + ';background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#1F1F1F') + ';border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">' + t.label + '</button>';
        }).join('') +
      '</div>' +
      '<div id="receitas-config-content"></div>';
    if (subKey === 'componentes') return _renderRecipeComponents();
    if (subKey === 'categorias-receita') return _renderRecipeCategories();
    if (subKey === 'tipos-insumos') return _renderIngredientCatalog('tipos');
    if (subKey === 'categorias-insumos') return _renderIngredientCatalog('categorias');
    if (subKey === 'unidades') return _renderUnits();
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
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Componentes da Receita (' + _recipeComponents.length + ')', 'Arraste para reordenar e use a edição para ajustar nomes e descrições.') +
        (_recipeComponents.length === 0 ? UI.emptyState('Nenhum componente ainda', '') :
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
        _recipeComponents.map(function (comp) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:14px 16px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
            '<div style="min-width:0;flex:1;"><div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.3;">' + _esc(comp.name) + '</div>' +
            (comp.description ? '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(comp.description) + '</div>' : '') + '</div>' +
            '<div style="display:flex;gap:6px;flex-shrink:0;">' +
            '<button onclick="Modules.Receitas._openRecipeComponentModal(\'' + comp.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
            '<button onclick="Modules.Receitas._deleteRecipeComponent(\'' + comp.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
            '</div></div>';
        }).join('') + '</div></section>');
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
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Categorias da Receita (' + _recipeCategories.length + ')', 'Use categorias para agrupar as fichas de produção.') +
        (_recipeCategories.length === 0 ? UI.emptyState('Nenhuma categoria ainda', '') :
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
        _recipeCategories.map(function (cat) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:14px 16px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
            '<div style="min-width:0;flex:1;"><div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.3;">' + _esc(cat.name) + '</div>' +
            (cat.description ? '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(cat.description) + '</div>' : '') + '</div>' +
            '<div style="display:flex;gap:6px;flex-shrink:0;">' +
            '<button onclick="Modules.Receitas._openRecipeCategoryModal(\'' + cat.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
            '<button onclick="Modules.Receitas._deleteRecipeCategory(\'' + cat.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
            '</div></div>';
        }).join('') + '</div></section>');
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
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle(cfg.title + ' (' + list.length + ')', 'Os cadastros são compartilhados com Compras e com os modais de insumo.') +
        (list.length === 0 ? UI.emptyState('Nenhum registro ainda', '') :
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
        list.map(function (item) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:14px 16px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
            '<div style="min-width:0;flex:1;"><div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.3;">' + _esc(item.name || '-') + '</div>' +
            '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">Classe: insumo' + (item.ativo === false ? ' · inativo' : '') + '</div></div>' +
            '<div style="display:flex;gap:6px;flex-shrink:0;">' +
            '<button onclick="Modules.Receitas._openIngredientCatalogModal(\'' + kind + '\',\'' + item.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
            '<button onclick="Modules.Receitas._deleteIngredientCatalog(\'' + kind + '\',\'' + item.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
            '</div></div>';
        }).join('') + '</div></section>');
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
    content.innerHTML = '' +
      '<section style="' + _cardStyle() + '">' +
        _sectionTitle('Unidades (' + _units.length + ')', 'Use unidades consistentes para melhorar fichas técnicas e produção.') +
        (_units.length === 0 ? UI.emptyState('Nenhuma unidade ainda', 'Cadastre unidades para usar nas fichas técnicas.') :
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          _units.map(function (u) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff;border:1px solid #EAE4DA;border-radius:14px;padding:14px 16px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
              '<div style="min-width:0;flex:1;"><div style="font-size:15px;font-weight:600;color:#1F1F1F;line-height:1.3;">' + _esc(u.name || '-') + '</div>' +
              '<div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(u.symbol || '-') + ' · ' + _esc(u.type || '-') + '</div></div>' +
              '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                '<button onclick="Modules.Receitas._openUnitModal(\'' + u.id + '\')" style="' + _smallActionStyle('#6F6860') + '"><span class="mi" style="font-size:14px;">edit</span></button>' +
                '<button onclick="Modules.Receitas._deleteUnit(\'' + u.id + '\')" style="' + _smallActionStyle('#B42318') + '"><span class="mi" style="font-size:14px;">delete</span></button>' +
              '</div></div>';
        }).join('') + '</div></section>');
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
