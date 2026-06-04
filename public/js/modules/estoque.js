// js/modules/estoque.js
window.Modules = window.Modules || {};
Modules.Estoque = (function () {
  'use strict';

  var _activeSub = 'itens';
  var _movements = [];
  var _items = [];
  var _settings = {};
  var _stockConfig = {};
  var _orders = [];
  var _fornecedores = [];
  var _classMaps = { itens: {}, receitas: {}, produtos: {} };
  var _filters = { q: '', type: 'todos', stockKind: 'insumo' };
  var _itemsPage = { page: 1, perPage: 10 };
  var _movementFilters = { q: '', direction: 'entrada', origin: 'todos' };
  var _movementsPage = { page: 1, perPage: 10 };
  var _regularizationFilters = { q: '', status: 'pendente', type: 'todos' };
  var _regularizationsPage = { page: 1, perPage: 10 };
  var _detailMovementState = { key: '', q: '', page: 1, perPage: 5 };

  function render(sub) {
    _activeSub = sub || 'itens';
    var app = document.getElementById('app');
    if (!app) return;
    var isMovements = _activeSub === 'movimentacoes';
    var isRegularizations = _activeSub === 'regularizacoes';
    var title = isRegularizations ? 'Regularizações do estoque' : (isMovements ? 'Movimentações do estoque' : 'Itens em estoque');
    var subtitle = isRegularizations
      ? 'Veja vendas que geraram saída com saldo insuficiente e escolha como regularizar o histórico de estoque.'
      : (isMovements ? 'Acompanhe entradas, saídas, estornos e ajustes usados para calcular os saldos.' : 'Saldo calculado pelas entradas, saídas e ajustes registrados. Separe os itens por classe para conferir com mais clareza.');
    app.innerHTML =
      '<div id="stock-root" class="module-page stock-page">' +
        _styles() +
        '<div class="stock-page-head">' +
          '<div style="min-width:0;flex:1 1 420px;">' +
            '<h2>' + title + '</h2>' +
            '<p>' + subtitle + '</p>' +
          '</div>' +
        '</div>' +
        '<div id="stock-content" class="stock-content"><div class="loading-inline">Carregando estoque...</div></div>' +
      '</div>';
    _loadItems();
  }

  function _loadItems() {
    var content = document.getElementById('stock-content');
    if (content) content.innerHTML = '<div class="loading-inline">Carregando estoque...</div>';
    Promise.all([
      DB.getAll('stock_movements').catch(function () { return []; }),
      DB.getAll('stock_settings').catch(function () { return []; }),
      DB.getAll('itens_custo').catch(function () { return []; }),
      DB.getAll('fichasTecnicas').catch(function () { return []; }),
      DB.getAll('products').catch(function () { return []; }),
      DB.getAll('orders').catch(function () { return []; }),
      DB.getDocRoot ? DB.getDocRoot('config', 'estoque').catch(function () { return {}; }) : Promise.resolve({}),
      DB.getAll('fornecedores').catch(function () { return []; })
    ]).then(function (results) {
      var movements = results[0] || [];
      var settings = results[1] || [];
      _classMaps = _buildClassMaps(results[2] || [], results[3] || [], results[4] || []);
      _orders = results[5] || [];
      _stockConfig = results[6] || {};
      _fornecedores = results[7] || [];
      _settings = {};
      settings.forEach(function (item) {
        if (item && item.stockKey) _settings[item.stockKey] = item;
      });
      _movements = (movements || []).slice();
      _items = _buildStockItems(_movements);
      if (_activeSub === 'movimentacoes') _paintMovements();
      else if (_activeSub === 'regularizacoes') _paintRegularizations();
      else _paintItems();
    });
  }

  function _buildStockItems(movements) {
    var map = {};
    (movements || []).forEach(function (movement) {
      var entry = _movementEntry(movement);
      if (!entry.key) return;
      if (!map[entry.key]) {
        map[entry.key] = {
          key: entry.key,
          itemId: entry.itemId,
          itemName: entry.itemName,
          itemType: entry.itemType,
          stockItemType: entry.stockItemType,
          stockClass: entry.stockClass,
          unit: entry.unit,
          balance: 0,
          entries: 0,
          exits: 0,
          estimatedValue: 0,
          hasCost: false,
          lastUnitCost: null,
          lastCostAt: '',
          lastMovementAt: '',
          origins: {},
          movements: []
        };
      }

      var item = map[entry.key];
      item.unit = item.unit || entry.unit;
      item.stockItemType = item.stockItemType || entry.stockItemType;
      item.stockClass = item.stockClass || entry.stockClass;
      item.balance += entry.direction * entry.quantity;
      if (entry.direction > 0) item.entries += entry.quantity;
      if (entry.direction < 0) item.exits += entry.quantity;
      if (entry.hasCost) {
        item.hasCost = true;
        if (!_dateValue(item.lastCostAt) || _dateValue(entry.date) >= _dateValue(item.lastCostAt)) {
          item.lastUnitCost = entry.unitCost;
          item.lastCostAt = entry.date;
        }
      }
      if (entry.origin) item.origins[entry.origin] = true;
      item.movements.push(entry);
      if (!_dateValue(item.lastMovementAt) || _dateValue(entry.date) >= _dateValue(item.lastMovementAt)) {
        item.lastMovementAt = entry.date;
      }
    });

    return Object.keys(map).map(function (key) {
      var item = map[key];
      item.balance = _round(item.balance);
      item.entries = _round(item.entries);
      item.exits = _round(item.exits);
      item.estimatedValue = item.hasCost ? _round(item.balance * item.lastUnitCost) : null;
      item.originText = Object.keys(item.origins).length
        ? Object.keys(item.origins).slice(0, 3).join(', ') + (Object.keys(item.origins).length > 3 ? ' +' + (Object.keys(item.origins).length - 3) : '')
        : 'Produção';
      var setting = _settings[item.key] || {};
      var manualMinStock = _num(setting.minStock);
      var manualMaxStock = _num(setting.maxStock);
      var suggestedMinStock = _num(setting.suggestedMinStock);
      var suggestedMaxStock = _num(setting.suggestedMaxStock);
      item.minStock = manualMinStock > 0 ? manualMinStock : suggestedMinStock;
      item.maxStock = manualMaxStock > 0 ? manualMaxStock : suggestedMaxStock;
      item.minStockSuggested = manualMinStock <= 0 && suggestedMinStock > 0;
      item.maxStockSuggested = manualMaxStock <= 0 && suggestedMaxStock > 0;
      item.minStockEnabled = item.minStock > 0;
      item.maxStockEnabled = item.maxStock > 0;
      item.isBelowMin = item.minStockEnabled && item.balance <= item.minStock;
      item.isAboveMax = item.maxStockEnabled && item.balance > item.maxStock;
      item.movements.sort(function (a, b) { return _dateValue(b.date) - _dateValue(a.date); });
      return item;
    }).sort(function (a, b) {
      return String(a.itemName || '').localeCompare(String(b.itemName || ''), 'pt-BR');
    });
  }

  function _buildClassMaps(costItems, recipes, products) {
    var maps = { itens: {}, receitas: {}, produtos: {} };
    (costItems || []).forEach(function (item) {
      if (!item || !item.id) return;
      maps.itens[String(item.id)] = _normalizeStockClass(item.stockItemType || item.itemClass || item.classe || '');
    });
    (recipes || []).forEach(function (item) {
      if (!item || !item.id) return;
      maps.receitas[String(item.id)] = _normalizeStockClass(item.stockItemType || item.itemClass || item.classe || 'produto_produzido');
    });
    (products || []).forEach(function (item) {
      if (!item || !item.id) return;
      maps.produtos[String(item.id)] = _normalizeStockClass(item.stockItemType || item.itemClass || item.classe || (item.fichaTecnicaId || item.fichaId ? 'produto_produzido' : 'produto'));
    });
    return maps;
  }

  function _movementEntry(movement) {
    var type = movement && movement.type;
    var isPurchaseEntry = type === 'entrada_compra';
    var isProductionEntry = type === 'entrada_producao';
    var isBaseProductionEntry = type === 'entrada_base_producao';
    var isBaseSaleExit = type === 'saida_base_venda';
    var isSaleExit = type === 'saida_venda' || isBaseSaleExit;
    var isSaleReturn = type === 'retorno_venda';
    var isSaleLoss = type === 'perda_venda';
    var isPurchaseReversal = type === 'estorno_compra';
    var isSaleReversal = type === 'estorno_venda';
    var isProductionIngredientReversal = type === 'estorno_producao_ingrediente';
    var isProductionProductReversal = type === 'estorno_producao_produto';
    var isBaseProductionReversal = type === 'estorno_base_producao';
    var isAdjustmentEntry = type === 'ajuste_entrada';
    var isAdjustmentExit = type === 'ajuste_saida';
    var isRegularizationEntry = type === 'entrada_regularizacao';
    var isEntry = isProductionEntry || isBaseProductionEntry || isPurchaseEntry || isSaleReversal || isSaleReturn || isProductionIngredientReversal || isAdjustmentEntry || isRegularizationEntry;
    var isExit = type === 'saida_producao' || isSaleExit || isPurchaseReversal || isProductionProductReversal || isBaseProductionReversal || isAdjustmentExit;
    if (!isEntry && !isExit && !isSaleLoss) return {};

    var directClass = _normalizeStockClass(movement.stockItemType || movement.itemClass || movement.classe || '');
    var isSaleRelated = isSaleExit || isSaleReversal || isSaleReturn || isSaleLoss;
    var saleReadyItemId = isSaleRelated ? (movement.sourceItemId || movement.produtoProntoId || '') : '';
    var saleIsReadyProduct = isSaleRelated && !!saleReadyItemId && !movement.fichaTecnicaId;
    var adjustmentStockType = String(movement.stockItemType || '').trim();
    var isBaseStockMovement = isBaseProductionEntry || isBaseProductionReversal || isBaseSaleExit || ((isSaleReversal || isSaleExit) && !!movement.baseProductionId);
    var itemId = '';
    var itemName = '';
    if (isBaseStockMovement) {
      itemId = movement.baseProductionId || movement.componentName || '';
      itemName = movement.baseProductionName || movement.componentName || 'Base de produção';
    } else if (isProductionEntry || isProductionProductReversal) {
      itemId = movement.fichaTecnicaId || '';
      itemName = movement.fichaTecnicaNome || 'Produto produzido';
    } else if (isRegularizationEntry) {
      itemId = movement.itemId || movement.stockItemId || movement.fichaTecnicaId || saleReadyItemId || movement.productId || '';
      itemName = movement.itemName || movement.productName || 'Item regularizado';
    } else if (isSaleRelated) {
      itemId = movement.fichaTecnicaId || saleReadyItemId || movement.productId || '';
      itemName = movement.productName || 'Produto vendido';
    } else if (isAdjustmentEntry || isAdjustmentExit) {
      itemId = movement.itemId || '';
      itemName = movement.itemName || 'Item ajustado';
    } else if (isPurchaseEntry || isPurchaseReversal) {
      itemId = movement.itemId || '';
      itemName = movement.itemName || 'Ingrediente';
    } else {
      itemId = movement.ingredientId || '';
      itemName = movement.ingredientName || 'Ingrediente';
    }
    var lookupClass = _lookupStockClass(movement, itemId, {
      isProductionEntry: isProductionEntry,
      isProductionProductReversal: isProductionProductReversal,
      isBaseProductionEntry: isBaseProductionEntry,
      isBaseProductionReversal: isBaseProductionReversal,
      isSaleExit: isSaleExit,
      isSaleReversal: isSaleReversal || isSaleReturn || isSaleLoss,
      isPurchaseEntry: isPurchaseEntry,
      isPurchaseReversal: isPurchaseReversal
    });
    var stockClass = directClass || lookupClass || (isBaseStockMovement ? 'base_producao' : ((isProductionEntry || isProductionProductReversal) ? 'produto_produzido' : (saleIsReadyProduct ? 'produto' : 'insumo')));
    var movementIsReadyProduct = stockClass === 'produto' || stockClass === 'produto_pronto';
    var movementIsProducedProduct = stockClass === 'produto_produzido';
    var movementIsBaseProduct = stockClass === 'base_producao';
    var movementIsSupply = stockClass === 'insumo' || stockClass === 'embalagem';
    var purchaseIsProduct = (isPurchaseEntry || isPurchaseReversal) && movementIsReadyProduct;
    var itemType = (isProductionEntry || isProductionProductReversal || isBaseStockMovement || isSaleRelated || isRegularizationEntry || purchaseIsProduct || adjustmentStockType.indexOf('produto') === 0 || movementIsProducedProduct || movementIsBaseProduct) ? 'produto' : 'ingrediente';
    var quantity = (isProductionEntry || isProductionProductReversal || isBaseProductionEntry || isBaseProductionReversal) ? _num(movement.quantityProduced || movement.quantity) : _num(movement.quantity);
    var unit = (isProductionEntry || isProductionProductReversal || isBaseProductionEntry || isBaseProductionReversal) ? (movement.yieldUnit || movement.unit || '') : (movement.unit || '');
    var unitCost = (isProductionEntry || isProductionProductReversal || isBaseProductionEntry || isBaseProductionReversal) ? _num(movement.estimatedUnitCost || movement.unitCost) : _num(movement.unitCost);
    var hasCost = unitCost > 0;
    var label = isRegularizationEntry ? 'Entrada de regularização' : (isPurchaseEntry ? 'Entrada de compra' : (isPurchaseReversal ? 'Estorno de compra' : (isBaseProductionEntry ? 'Entrada de base de produção' : (isBaseProductionReversal ? 'Estorno de base de produção' : (isBaseSaleExit ? 'Saída de base por venda' : (isProductionEntry ? 'Entrada de produção' : (isProductionProductReversal ? 'Estorno de produto produzido' : (isSaleReturn ? 'Retorno de venda' : (isSaleLoss ? 'Perda de venda' : (isSaleExit ? 'Saída por venda' : (isSaleReversal ? 'Estorno de venda' : (isProductionIngredientReversal ? 'Estorno de ingrediente' : (isAdjustmentEntry ? 'Ajuste de entrada' : (isAdjustmentExit ? 'Ajuste de saída' : 'Saída para produção'))))))))))))));
    var origin = isRegularizationEntry ? 'Regularização' : ((isPurchaseEntry || isPurchaseReversal) ? 'Compra' : (isSaleRelated || isSaleReversal ? 'Venda' : ((isAdjustmentEntry || isAdjustmentExit) ? 'Ajuste' : 'Produção')));
    var originDetail = '';
    if (isPurchaseEntry || isPurchaseReversal) {
      originDetail = 'Compra' + (movement.purchaseNumber ? ' ' + movement.purchaseNumber : '') + (movement.purchaseDocument ? ' · ' + movement.purchaseDocument : '');
    } else if (isRegularizationEntry) {
      originDetail = 'Regularização do pedido' + (movement.orderNumber ? ' ' + movement.orderNumber : '');
    } else if (isSaleRelated || isSaleReversal) {
      originDetail = 'Pedido' + (movement.orderNumber ? ' ' + movement.orderNumber : '') + _saleStockTraceLabel(movement, { isSaleLoss: isSaleLoss, isSaleReturn: isSaleReturn, isBaseSaleExit: isBaseSaleExit });
    } else if (isAdjustmentEntry || isAdjustmentExit) {
      originDetail = movement.reason || 'Contagem manual';
    } else {
      originDetail = movement.productionOrderName || movement.fichaTecnicaNome || 'Ordem de produção';
    }
    var stockItemType = stockClass === 'embalagem'
      ? 'embalagem'
      : (movementIsSupply
        ? 'insumo'
      : (movementIsReadyProduct
        ? 'produto_pronto'
        : (movementIsBaseProduct
          ? 'base_producao'
          : (movementIsProducedProduct
            ? 'produto_produzido'
            : ((isProductionEntry || isProductionProductReversal) ? 'produto_produzido' : (saleIsReadyProduct || purchaseIsProduct ? 'produto_pronto' : (adjustmentStockType || (itemType === 'ingrediente' ? 'insumo' : 'produto_produzido'))))))));

    return {
      id: movement.id || '',
      key: stockItemType + ':' + (itemId || itemName),
      itemId: itemId,
      itemName: itemName,
      itemType: itemType,
      stockClass: stockClass,
      movementType: type,
      direction: isSaleLoss ? 0 : (isEntry ? 1 : -1),
      label: label,
      quantity: Math.abs(quantity),
      unit: unit,
      unitCost: unitCost,
      totalCost: _num(isEntry ? movement.estimatedTotalCost : movement.totalCost) || (hasCost ? Math.abs(quantity) * unitCost : 0),
      hasCost: hasCost,
      date: movement.movementDate || movement.createdAt || movement.updatedAt || '',
      origin: origin,
      originDetail: originDetail,
      productionOrderId: movement.productionOrderId || '',
      purchaseId: movement.purchaseId || '',
      orderId: movement.orderId || '',
      stockItemType: stockItemType,
      batchNumber: movement.batchNumber || '',
      expiresAt: movement.expiresAt || ''
    };
  }

  function _saleStockTraceLabel(movement, flags) {
    flags = flags || {};
    if (flags.isSaleLoss) return ' · perda registrada';
    if (flags.isSaleReturn) return ' · retorno ao estoque';
    var source = String(movement && movement.stockSource || '').trim();
    if (flags.isBaseSaleExit || movement.baseProductionId || source.indexOf('base') >= 0) return ' · base de produção';
    if (source === 'composicao_interna') return ' · montagem interna';
    if (movement.sourceItemId || movement.produtoProntoId) return ' · produto pronto';
    if (movement.fichaTecnicaId) return ' · produto produzido';
    return '';
  }

  function _lookupStockClass(movement, itemId, flags) {
    movement = movement || {};
    flags = flags || {};
    if (flags.isBaseProductionEntry || flags.isBaseProductionReversal || movement.baseProductionId) {
      return 'base_producao';
    }
    if ((flags.isProductionEntry || flags.isProductionProductReversal) && movement.fichaTecnicaId) {
      return _classMaps.receitas[String(movement.fichaTecnicaId || '')] || '';
    }
    if (movement.sourceItemId || movement.produtoProntoId) {
      return _classMaps.itens[String(movement.sourceItemId || movement.produtoProntoId || '')] || 'produto';
    }
    if ((flags.isPurchaseEntry || flags.isPurchaseReversal) && itemId) {
      return _classMaps.itens[String(itemId || '')] || '';
    }
    if (movement.ingredientId) {
      return _classMaps.itens[String(movement.ingredientId || '')] || 'insumo';
    }
    if ((flags.isSaleExit || flags.isSaleReversal) && movement.productId) {
      return _classMaps.produtos[String(movement.productId || '')] || '';
    }
    if (itemId) {
      return _classMaps.itens[String(itemId || '')] || _classMaps.receitas[String(itemId || '')] || _classMaps.produtos[String(itemId || '')] || '';
    }
    return '';
  }

  function _paintItems() {
    var content = document.getElementById('stock-content');
    if (!content) return;
    var visible = _filteredItems();
    var paging = _itemsPage || (_itemsPage = { page: 1, perPage: 10 });
    paging.perPage = Number(paging.perPage) || 10;
    var totalPages = Math.max(1, Math.ceil(visible.length / paging.perPage));
    if (paging.page > totalPages) paging.page = totalPages;
    if (paging.page < 1) paging.page = 1;
    var pageStartIndex = (paging.page - 1) * paging.perPage;
    var pageItems = visible.slice(pageStartIndex, pageStartIndex + paging.perPage);
    var showingStart = visible.length ? pageStartIndex + 1 : 0;
    var showingEnd = visible.length ? Math.min(pageStartIndex + pageItems.length, visible.length) : 0;
    var pageOptions = [10, 25, 50].map(function (size) {
      return '<option value="' + size + '"' + (paging.perPage === size ? ' selected' : '') + '>' + size + ' por página</option>';
    }).join('');
    var hasFilters = _hasFilters();
    var rows = pageItems.map(function (item) {
      return '<tr onclick="Modules.Estoque._openItemDetails(\'' + _escJs(item.key) + '\')" class="stock-row">' +
        '<td><div class="stock-item-name">' + _esc(item.itemName) + '</div><div class="stock-item-note">' + _esc(item.itemId || 'Sem código vinculado') + '</div></td>' +
        '<td><span class="stock-badge ' + _stockKindClass(item.stockItemType) + '">' + _stockClassLabel(item.stockClass || item.stockItemType) + '</span>' + (item.stockItemType && item.stockClass && item.stockItemType !== item.stockClass ? '<div class="stock-item-note">' + _esc(_stockKindLabel(item.stockItemType)) + '</div>' : '') + '</td>' +
        '<td><strong>' + _fmtQty(item.balance) + '</strong> <span>' + _esc(item.unit || '') + '</span>' + (item.isBelowMin ? '<div class="stock-item-note stock-alert-text">Abaixo do mínimo</div>' : '') + (item.isAboveMax ? '<div class="stock-item-note stock-alert-text">Acima do máximo</div>' : '') + '</td>' +
        '<td>' + (item.hasCost ? _money(item.estimatedValue) : '<span class="stock-muted">sem custo informado</span>') + '</td>' +
        '<td>' + _fmtDate(item.lastMovementAt) + '</td>' +
        '<td><span class="stock-origin">' + _esc(item.originText) + '</span></td>' +
      '</tr>';
    }).join('');

    content.innerHTML =
      _viewTabsHtml() +
      _stockKindTabsHtml() +
      '<section class="stock-filter-card">' +
        '<div class="stock-filter-grid">' +
          '<label><span>Buscar</span><input type="search" value="' + _esc(_filters.q) + '" placeholder="Buscar item..." oninput="Modules.Estoque._setFilter(\'q\', this.value)"></label>' +
          '<label><span>Tipo</span><select onchange="Modules.Estoque._setFilter(\'type\', this.value)">' +
            '<option value="todos"' + (_filters.type === 'todos' ? ' selected' : '') + '>Todos</option>' +
            '<option value="ingrediente"' + (_filters.type === 'ingrediente' ? ' selected' : '') + '>Ingredientes</option>' +
            '<option value="produto"' + (_filters.type === 'produto' ? ' selected' : '') + '>Produtos</option>' +
          '</select></label>' +
        '</div>' +
        (hasFilters ? '<div class="stock-filter-actions"><button type="button" class="stock-filter-clear" onclick="Modules.Estoque._clearFilters()">Limpar filtros</button></div>' : '') +
      '</section>' +
      (visible.length ?
        '<section style="display:flex;flex-direction:column;gap:10px;">' +
          '<div class="stock-list-title"><div><h2>Saldo por item</h2><p>Entradas, saídas e ajustes são somados a partir das movimentações do estoque.</p></div><button type="button" onclick="Modules.Estoque._openInventoryModal()">Inventário em lote</button></div>' +
          '<div class="stock-table-card">' +
            '<div class="stock-table-wrap"><table class="stock-table"><thead><tr><th>Item</th><th>Classe</th><th>Saldo atual</th><th>Valor estimado</th><th>Última movimentação</th><th>Origem</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
            '<div class="stock-table-footer">' +
              '<span>Mostrando <strong>' + showingStart + '</strong> a <strong>' + showingEnd + '</strong> de <strong>' + visible.length + '</strong></span>' +
              '<div class="stock-pagination">' +
                '<select onchange="Modules.Estoque._setItemsPageSize(this.value)">' + pageOptions + '</select>' +
                '<button type="button" ' + (paging.page <= 1 ? 'disabled' : '') + ' onclick="Modules.Estoque._setItemsPage(' + (paging.page - 1) + ')">Anterior</button>' +
                '<div class="stock-page-indicator"><span>' + paging.page + '</span><i></i><span>' + totalPages + '</span></div>' +
                '<button type="button" ' + (paging.page >= totalPages ? 'disabled' : '') + ' onclick="Modules.Estoque._setItemsPage(' + (paging.page + 1) + ')">Próxima</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>' :
        '<section class="stock-card">' + _emptyState() + '</section>');
  }

  function _viewTabsHtml() {
    return '<section class="stock-view-tabs">' +
      '<button type="button" class="' + (_activeSub === 'itens' ? 'active' : '') + '" onclick="Modules.Estoque._setView(\'itens\')">Itens</button>' +
      '<button type="button" class="' + (_activeSub === 'movimentacoes' ? 'active' : '') + '" onclick="Modules.Estoque._setView(\'movimentacoes\')">Movimentações</button>' +
      '<button type="button" class="' + (_activeSub === 'regularizacoes' ? 'active' : '') + '" onclick="Modules.Estoque._setView(\'regularizacoes\')">Regularizações</button>' +
    '</section>';
  }

  function _setView(view) {
    _activeSub = view === 'movimentacoes' ? 'movimentacoes' : (view === 'regularizacoes' ? 'regularizacoes' : 'itens');
    if (_activeSub === 'movimentacoes') _paintMovements();
    else if (_activeSub === 'regularizacoes') _paintRegularizations();
    else _paintItems();
  }

  function _paintRegularizations() {
    var content = document.getElementById('stock-content');
    if (!content) return;
    var entries = _filteredRegularizations();
    var summary = _regularizationSummary();
    var paging = _regularizationsPage || (_regularizationsPage = { page: 1, perPage: 10 });
    paging.perPage = Number(paging.perPage) || 10;
    var totalPages = Math.max(1, Math.ceil(entries.length / paging.perPage));
    if (paging.page > totalPages) paging.page = totalPages;
    if (paging.page < 1) paging.page = 1;
    var pageStartIndex = (paging.page - 1) * paging.perPage;
    var pageEntries = entries.slice(pageStartIndex, pageStartIndex + paging.perPage);
    var showingStart = entries.length ? pageStartIndex + 1 : 0;
    var showingEnd = entries.length ? Math.min(pageStartIndex + pageEntries.length, entries.length) : 0;
    var pageOptions = [10, 25, 50].map(function (size) {
      return '<option value="' + size + '"' + (paging.perPage === size ? ' selected' : '') + '>' + size + ' por página</option>';
    }).join('');
    var rows = pageEntries.map(function (entry) {
      var canApply = entry.status === 'pendente' && !entry.isChainItem;
      var chainNote = entry.regularizationChainCount ? '<div class="stock-item-note">Cadeia: ' + entry.regularizationChainCount + ' mov.</div>' : '';
      var itemPrefix = entry.isChainItem ? '<span class="stock-chain-prefix">↳</span>' : '';
      var actionText = entry.isChainItem ? 'Na cadeia' : (canApply ? 'Regularizar entrada' : 'Aplicada');
      return '<tr>' +
        '<td><div class="stock-item-name ' + (entry.isChainItem ? 'stock-chain-item' : '') + '">' + itemPrefix + '<span>' + _esc(entry.itemName) + '</span></div><div class="stock-item-note">' + _esc(_stockKindLabel(entry.stockItemType)) + ' · ' + _esc(entry.stockSourceLabel) + '</div>' + chainNote + '</td>' +
        '<td><div class="stock-item-name">' + _esc(entry.orderLabel) + '</div><div class="stock-item-note">' + _esc(_fmtDate(entry.detectedAt || entry.orderDate)) + ' · ' + _esc(entry.customerName || 'Cliente não informado') + '</div></td>' +
        '<td><span class="stock-badge ' + (entry.status === 'pendente' ? 'regularization-pending' : 'regularization-muted') + '">' + _esc(_regularizationStatusLabel(entry.status)) + '</span></td>' +
        '<td><strong class="stock-negative">' + _fmtQty(entry.shortageQuantity) + ' ' + _esc(entry.unit || '') + '</strong><div class="stock-item-note">Saída: ' + _fmtQty(entry.requiredQuantity) + ' ' + _esc(entry.unit || '') + '</div></td>' +
        '<td><div class="stock-item-name">' + _fmtQty(entry.balanceBefore) + ' → ' + _fmtQty(entry.balanceAfter) + '</div><div class="stock-item-note">Saldo antes/depois</div></td>' +
        '<td>' + (entry.unitCost > 0 ? _money(entry.estimatedTotalCost) : '<span class="stock-muted">sem custo</span>') + '</td>' +
        '<td><button type="button" class="stock-row-action" ' + (canApply ? 'onclick="Modules.Estoque._applyRegularization(\'' + _escJs(entry.id) + '\')"' : 'disabled') + '>' + actionText + '</button></td>' +
      '</tr>';
    }).join('');
    var hasFilters = !!((_regularizationFilters.q || '').trim() || _regularizationFilters.status !== 'todos' || _regularizationFilters.type !== 'todos');
    content.innerHTML =
      _viewTabsHtml() +
      _regularizationConfigHtml() +
      '<section class="stock-regularization-summary">' +
        _regularizationMetric('Pendentes', summary.pending, 'Itens vendidos sem saldo suficiente.') +
        _regularizationMetric('Pedidos', summary.orders, 'Pedidos com pelo menos uma pendência.') +
        _regularizationMetric('Custo estimado', summary.cost > 0 ? _money(summary.cost) : 'sem custo', 'Soma dos custos estimados das faltas.') +
      '</section>' +
      '<section class="stock-filter-card">' +
        '<div class="stock-filter-grid movement-grid">' +
          '<label><span>Buscar</span><input type="search" value="' + _esc(_regularizationFilters.q || '') + '" placeholder="Buscar item, pedido ou cliente..." oninput="Modules.Estoque._setRegularizationFilter(\'q\', this.value)"></label>' +
          '<label><span>Status</span><select onchange="Modules.Estoque._setRegularizationFilter(\'status\', this.value)">' +
            '<option value="pendente"' + (_regularizationFilters.status === 'pendente' ? ' selected' : '') + '>Pendentes</option>' +
            '<option value="todos"' + (_regularizationFilters.status === 'todos' ? ' selected' : '') + '>Todos</option>' +
            '<option value="aplicada"' + (_regularizationFilters.status === 'aplicada' ? ' selected' : '') + '>Aplicadas</option>' +
            '<option value="ignorada"' + (_regularizationFilters.status === 'ignorada' ? ' selected' : '') + '>Ignoradas</option>' +
          '</select></label>' +
          '<label><span>Classe</span><select onchange="Modules.Estoque._setRegularizationFilter(\'type\', this.value)">' +
            '<option value="todos"' + (_regularizationFilters.type === 'todos' ? ' selected' : '') + '>Todas</option>' +
            '<option value="insumo"' + (_regularizationFilters.type === 'insumo' ? ' selected' : '') + '>Insumos</option>' +
            '<option value="embalagem"' + (_regularizationFilters.type === 'embalagem' ? ' selected' : '') + '>Embalagens</option>' +
            '<option value="produto_pronto"' + (_regularizationFilters.type === 'produto_pronto' ? ' selected' : '') + '>Produtos prontos</option>' +
            '<option value="produto_produzido"' + (_regularizationFilters.type === 'produto_produzido' ? ' selected' : '') + '>Produtos produzidos</option>' +
            '<option value="base_producao"' + (_regularizationFilters.type === 'base_producao' ? ' selected' : '') + '>Bases de produção</option>' +
          '</select></label>' +
        '</div>' +
        (hasFilters ? '<div class="stock-filter-actions"><button type="button" class="stock-filter-clear" onclick="Modules.Estoque._clearRegularizationFilters()">Limpar filtros</button></div>' : '') +
      '</section>' +
      (entries.length ?
        '<section style="display:flex;flex-direction:column;gap:10px;">' +
          '<div class="stock-list-title"><div><h2>Itens para regularizar</h2><p>Lista gerada por pedidos que baixaram estoque sem saldo suficiente.</p></div></div>' +
          '<div class="stock-table-card">' +
            '<div class="stock-table-wrap"><table class="stock-table stock-regularization-table"><thead><tr><th>Item</th><th>Pedido</th><th>Status</th><th>Falta</th><th>Saldo</th><th>Custo estimado</th><th>Ação</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
            '<div class="stock-table-footer">' +
              '<span>Mostrando <strong>' + showingStart + '</strong> a <strong>' + showingEnd + '</strong> de <strong>' + entries.length + '</strong></span>' +
              '<div class="stock-pagination">' +
                '<select onchange="Modules.Estoque._setRegularizationsPageSize(this.value)">' + pageOptions + '</select>' +
                '<button type="button" ' + (paging.page <= 1 ? 'disabled' : '') + ' onclick="Modules.Estoque._setRegularizationsPage(' + (paging.page - 1) + ')">Anterior</button>' +
                '<div class="stock-page-indicator"><span>' + paging.page + '</span><i></i><span>' + totalPages + '</span></div>' +
                '<button type="button" ' + (paging.page >= totalPages ? 'disabled' : '') + ' onclick="Modules.Estoque._setRegularizationsPage(' + (paging.page + 1) + ')">Próxima</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>' :
        '<section class="stock-card">' + _emptyState('regularizacoes') + '</section>');
  }

  function _regularizationConfigHtml() {
    var mode = _regularizationMode();
    var allowOutOfStock = _allowOutOfStockSales();
    return '<section class="stock-filter-card stock-regularization-config">' +
      '<div class="stock-list-title">' +
        '<div><h2>Comportamento da regularização</h2><p>Defina o que acontece quando uma venda baixa estoque sem saldo suficiente.</p></div>' +
      '</div>' +
      '<div class="stock-config-options">' +
        _regularizationModeOption('pendencia', mode, 'Criar pendência', 'Registra a falta para revisar depois. É o modo mais seguro.') +
        _regularizationModeOption('automatico', mode, 'Aplicar automaticamente', 'Cria entrada de regularização junto com a saída da venda.') +
        _regularizationModeOption('desligado', mode, 'Desligado', 'Mantém a saída, mas não gera pendência nem entrada de regularização.') +
      '</div>' +
      '<div class="stock-list-title" style="margin-top:4px;">' +
        '<div><h2>Venda sem saldo na loja</h2><p>Produtos sob encomenda continuam liberados. Para os demais, escolha se a loja pública deve bloquear quando o saldo calculado acabar.</p></div>' +
      '</div>' +
      '<div class="stock-config-options">' +
        _outOfStockModeOption(false, allowOutOfStock, 'Bloquear quando zerar', 'A loja impede adicionar produto calculável sem saldo. É o padrão seguro.') +
        _outOfStockModeOption(true, allowOutOfStock, 'Permitir venda sem saldo', 'A loja aceita a venda; a baixa cria pendência, regularização ou só histórico conforme a regra acima.') +
      '</div>' +
    '</section>';
  }

  function _regularizationModeOption(value, current, label, description) {
    return '<button type="button" class="stock-config-option ' + (current === value ? 'active' : '') + '" onclick="Modules.Estoque._saveRegularizationMode(\'' + value + '\')">' +
      '<strong>' + _esc(label) + '</strong><span>' + _esc(description) + '</span>' +
    '</button>';
  }

  function _regularizationMode() {
    var mode = String(_stockConfig.regularizationMode || _stockConfig.stockRegularizationMode || 'pendencia').trim().toLowerCase();
    if (mode === 'auto') mode = 'automatico';
    if (mode === 'off') mode = 'desligado';
    if (['pendencia', 'automatico', 'desligado'].indexOf(mode) < 0) mode = 'pendencia';
    return mode;
  }

  function _allowOutOfStockSales() {
    return !!(_stockConfig.allowOutOfStockSales || _stockConfig.sellWithoutStock || _stockConfig.publicAllowOutOfStockSales);
  }

  function _outOfStockModeOption(value, current, label, description) {
    return '<button type="button" class="stock-config-option ' + (current === value ? 'active' : '') + '" onclick="Modules.Estoque._saveOutOfStockSalesMode(' + (value ? 'true' : 'false') + ')">' +
      '<strong>' + _esc(label) + '</strong><span>' + _esc(description) + '</span>' +
    '</button>';
  }

  function _saveRegularizationMode(mode) {
    mode = ['pendencia', 'automatico', 'desligado'].indexOf(mode) >= 0 ? mode : 'pendencia';
    var now = new Date().toISOString();
    DB.col('config').doc('estoque').set({
      regularizationMode: mode,
      stockRegularizationMode: mode,
      updatedAt: now
    }, { merge: true }).then(function () {
      _stockConfig.regularizationMode = mode;
      _stockConfig.stockRegularizationMode = mode;
      UI.toast('Configuração de regularização salva.', 'success');
      _paintRegularizations();
    }).catch(function (err) {
      UI.toast('Erro ao salvar configuração: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _saveOutOfStockSalesMode(allow) {
    allow = !!allow;
    var now = new Date().toISOString();
    DB.col('config').doc('estoque').set({
      allowOutOfStockSales: allow,
      sellWithoutStock: allow,
      publicAllowOutOfStockSales: allow,
      updatedAt: now
    }, { merge: true }).then(function () {
      _stockConfig.allowOutOfStockSales = allow;
      _stockConfig.sellWithoutStock = allow;
      _stockConfig.publicAllowOutOfStockSales = allow;
      UI.toast('Configuração de venda sem saldo salva.', 'success');
      _paintRegularizations();
    }).catch(function (err) {
      UI.toast('Erro ao salvar configuração: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _paintMovements() {
    var content = document.getElementById('stock-content');
    if (!content) return;
    var entries = _filteredMovements();
    var paging = _movementsPage || (_movementsPage = { page: 1, perPage: 10 });
    paging.perPage = Number(paging.perPage) || 10;
    var totalPages = Math.max(1, Math.ceil(entries.length / paging.perPage));
    if (paging.page > totalPages) paging.page = totalPages;
    if (paging.page < 1) paging.page = 1;
    var pageStartIndex = (paging.page - 1) * paging.perPage;
    var pageEntries = entries.slice(pageStartIndex, pageStartIndex + paging.perPage);
    var showingStart = entries.length ? pageStartIndex + 1 : 0;
    var showingEnd = entries.length ? Math.min(pageStartIndex + pageEntries.length, entries.length) : 0;
    var pageOptions = [10, 25, 50].map(function (size) {
      return '<option value="' + size + '"' + (paging.perPage === size ? ' selected' : '') + '>' + size + ' por página</option>';
    }).join('');
    var rows = pageEntries.map(function (entry) {
      var qtyClass = entry.direction > 0 ? 'stock-positive' : (entry.direction < 0 ? 'stock-negative' : '');
      var qtyPrefix = entry.direction > 0 ? '+' : (entry.direction < 0 ? '-' : '');
      return '<tr>' +
        '<td>' + _fmtDate(entry.date) + '</td>' +
        '<td><span class="stock-badge ' + (entry.direction > 0 ? 'product' : 'ingredient') + '">' + _esc(entry.label) + '</span></td>' +
        '<td><div class="stock-item-name">' + _esc(entry.itemName) + '</div><div class="stock-item-note">' + _esc(_stockClassLabel(entry.stockClass || entry.stockItemType)) + (entry.batchNumber ? ' · lote ' + _esc(entry.batchNumber) : '') + (entry.expiresAt ? ' · validade ' + _esc(_fmtDate(entry.expiresAt)) : '') + '</div></td>' +
        '<td class="' + qtyClass + '">' + qtyPrefix + _fmtQty(entry.quantity) + ' ' + _esc(entry.unit || '') + '</td>' +
        '<td>' + (entry.hasCost ? _money(entry.totalCost) : '<span class="stock-muted">sem custo</span>') + '</td>' +
        '<td><span class="stock-origin">' + _esc(entry.originDetail || entry.origin || '') + '</span></td>' +
      '</tr>';
    }).join('');
    var hasFilters = !!((_movementFilters.q || '').trim() || _movementFilters.direction !== 'todos' || _movementFilters.origin !== 'todos');
    content.innerHTML =
      _viewTabsHtml() +
      '<section class="stock-kind-tabs movement-tabs">' +
        '<button type="button" class="' + (_movementFilters.direction === 'entrada' ? 'active' : '') + '" onclick="Modules.Estoque._setMovementDirection(\'entrada\')">Entradas</button>' +
        '<button type="button" class="' + (_movementFilters.direction === 'saida' ? 'active' : '') + '" onclick="Modules.Estoque._setMovementDirection(\'saida\')">Saídas</button>' +
      '</section>' +
      '<section class="stock-filter-card">' +
        '<div class="stock-filter-grid movement-grid">' +
          '<label><span>Buscar</span><input type="search" value="' + _esc(_movementFilters.q || '') + '" placeholder="Buscar item, origem ou tipo..." oninput="Modules.Estoque._setMovementFilter(\'q\', this.value)"></label>' +
          '<label><span>Origem</span><select onchange="Modules.Estoque._setMovementFilter(\'origin\', this.value)">' +
            '<option value="todos"' + (_movementFilters.origin === 'todos' ? ' selected' : '') + '>Todas</option>' +
            '<option value="Compra"' + (_movementFilters.origin === 'Compra' ? ' selected' : '') + '>Compra</option>' +
            '<option value="Produção"' + (_movementFilters.origin === 'Produção' ? ' selected' : '') + '>Produção</option>' +
            '<option value="Venda"' + (_movementFilters.origin === 'Venda' ? ' selected' : '') + '>Venda</option>' +
            '<option value="Ajuste"' + (_movementFilters.origin === 'Ajuste' ? ' selected' : '') + '>Ajuste</option>' +
            '<option value="Regularização"' + (_movementFilters.origin === 'Regularização' ? ' selected' : '') + '>Regularização</option>' +
          '</select></label>' +
        '</div>' +
        (hasFilters ? '<div class="stock-filter-actions"><button type="button" class="stock-filter-clear" onclick="Modules.Estoque._clearMovementFilters()">Limpar filtros</button></div>' : '') +
      '</section>' +
      (entries.length ?
        '<section style="display:flex;flex-direction:column;gap:10px;">' +
          '<div class="stock-list-title"><div><h2>' + (_movementFilters.direction === 'saida' ? 'Saídas do estoque' : 'Entradas do estoque') + '</h2><p>Registros usados para calcular os saldos atuais do estoque.</p></div></div>' +
          '<div class="stock-table-card">' +
            '<div class="stock-table-wrap"><table class="stock-table"><thead><tr><th>Data</th><th>Tipo</th><th>Item</th><th>Quantidade</th><th>Valor</th><th>Origem</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
            '<div class="stock-table-footer">' +
              '<span>Mostrando <strong>' + showingStart + '</strong> a <strong>' + showingEnd + '</strong> de <strong>' + entries.length + '</strong></span>' +
              '<div class="stock-pagination">' +
                '<select onchange="Modules.Estoque._setMovementsPageSize(this.value)">' + pageOptions + '</select>' +
                '<button type="button" ' + (paging.page <= 1 ? 'disabled' : '') + ' onclick="Modules.Estoque._setMovementsPage(' + (paging.page - 1) + ')">Anterior</button>' +
                '<div class="stock-page-indicator"><span>' + paging.page + '</span><i></i><span>' + totalPages + '</span></div>' +
                '<button type="button" ' + (paging.page >= totalPages ? 'disabled' : '') + ' onclick="Modules.Estoque._setMovementsPage(' + (paging.page + 1) + ')">Próxima</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>' :
        '<section class="stock-card">' + _emptyState() + '</section>');
  }

  function _stockKindTabsHtml() {
    var tabs = [
      ['insumo', 'Insumos'],
      ['embalagem', 'Embalagens'],
      ['produto_pronto', 'Produtos prontos'],
      ['produto_produzido', 'Produtos produzidos'],
      ['base_producao', 'Bases de produção']
    ];
    return '<section class="stock-kind-tabs">' + tabs.map(function (tab) {
      var active = _filters.stockKind === tab[0];
      return '<button type="button" class="' + (active ? 'active' : '') + '" onclick="Modules.Estoque._setStockKind(\'' + tab[0] + '\')">' + _esc(tab[1]) + '</button>';
    }).join('') + '</section>';
  }

  function _filteredItems() {
    var q = _norm(_filters.q);
    return (_items || []).filter(function (item) {
      var typeOk = _filters.type === 'todos' || item.itemType === _filters.type;
      var kindOk = _filters.stockKind === 'todos' || item.stockItemType === _filters.stockKind;
      var qOk = !q || _norm(item.itemName + ' ' + item.itemId + ' ' + item.originText).indexOf(q) >= 0;
      return typeOk && kindOk && qOk;
    });
  }

  function _filteredMovements() {
    var q = _norm(_movementFilters.q);
    return (_movements || []).map(_movementEntry).filter(function (entry) {
      if (!entry.key) return false;
      if (_movementFilters.direction === 'entrada' && entry.direction <= 0) return false;
      if (_movementFilters.direction === 'saida' && entry.direction >= 0 && entry.movementType !== 'perda_venda') return false;
      if (_movementFilters.origin !== 'todos' && entry.origin !== _movementFilters.origin) return false;
      if (!q) return true;
      return _norm([
        entry.label,
        entry.itemName,
        entry.origin,
        entry.originDetail,
        entry.stockClass,
        entry.stockItemType
      ].join(' ')).indexOf(q) >= 0;
    }).sort(function (a, b) {
      return _dateValue(b.date) - _dateValue(a.date);
    });
  }

  function _regularizationEntries() {
    var entries = [];
    (_orders || []).forEach(function (order) {
      if (_regularizationOrderCancelled(order)) return;
      var items = Array.isArray(order && order.stockRegularizationPendingItems) ? order.stockRegularizationPendingItems : [];
      if (!items.length && order && order.stockRegularizationPending) {
        items = [];
      }
      items.forEach(function (item, idx) {
        if (!item || typeof item !== 'object') return;
        var status = String(item.status || order.stockRegularizationStatus || 'pendente').trim().toLowerCase() || 'pendente';
        var stockType = _normalizeRegularizationStockType(item.stockItemType || item.itemClass || item.classe || '');
        var requiredQty = _num(item.requiredQuantity);
        var shortageQty = _regularizationEffectiveShortage(item);
        var unitCost = _num(item.unitCost);
        var chain = Array.isArray(item.regularizationChain) ? item.regularizationChain : [];
        var baseEntry = {
          id: String(order.id || '') + ':' + idx,
          parentId: '',
          itemIndex: idx,
          chainIndex: -1,
          isChainItem: false,
          orderId: order.id || '',
          orderLabel: _orderLabel(order),
          orderDate: _firstText(order.deliveryDate, order.pickupDate, order.scheduleDate, order.createdAt, order.updatedAt, ''),
          detectedAt: _firstText(order.stockRegularizationDetectedAt, order.stockMovementUpdatedAt, order.updatedAt, ''),
          customerName: _firstText(order.customerName, order.name, order.clienteNome, ''),
          status: status,
          origin: item.origin || order.stockRegularizationOrigin || 'saldo_negativo_venda',
          stockKey: item.stockKey || '',
          stockItemId: item.stockItemId || '',
          stockItemType: stockType,
          itemName: item.itemName || 'Item',
          productId: item.productId || '',
          productName: item.productName || '',
          stockSource: item.stockSource || '',
          stockSourceLabel: _stockSourceLabel(item.stockSource || ''),
          sourceMovementId: item.movementId || item.sourceMovementId || '',
          regularizationMovementId: item.regularizationMovementId || '',
          requiredQuantity: requiredQty,
          shortageQuantity: shortageQty,
          balanceBefore: _num(item.balanceBefore),
          balanceAfter: _num(item.balanceAfter),
          unit: item.unit || '',
          unitCost: unitCost,
          estimatedTotalCost: unitCost > 0 ? _round(shortageQty * unitCost) : _num(item.estimatedTotalCost),
          regularizationChain: chain,
          regularizationChainCount: _num(item.regularizationChainCount) || chain.length
        };
        entries.push(baseEntry);
        chain.forEach(function (movement, chainIdx) {
          var chainEntry = _regularizationChainEntry(order, item, baseEntry, movement, chainIdx);
          if (chainEntry) entries.push(chainEntry);
        });
      });
    });
    return entries.sort(function (a, b) {
      if (a.orderId === b.orderId && a.itemIndex === b.itemIndex) return a.chainIndex - b.chainIndex;
      return _dateValue(b.detectedAt || b.orderDate) - _dateValue(a.detectedAt || a.orderDate);
    });
  }

  function _regularizationChainEntry(order, item, parent, movement, chainIdx) {
    if (!movement || movement.type !== 'entrada_regularizacao') return null;
    var stockType = _normalizeRegularizationStockType(movement.stockItemType || movement.itemClass || movement.classe || '');
    var qty = _num(movement.quantity || movement.quantityProduced);
    if (qty <= 0) return null;
    var unitCost = _num(movement.unitCost);
    return Object.assign({}, parent, {
      id: parent.id + ':chain:' + chainIdx,
      parentId: parent.id,
      chainIndex: chainIdx,
      isChainItem: true,
      stockItemId: movement.stockItemId || movement.itemId || movement.baseProductionId || movement.ingredientId || movement.packagingId || '',
      stockItemType: stockType,
      itemName: movement.itemName || movement.baseProductionName || movement.ingredientName || movement.packagingName || 'Item da cadeia',
      productName: parent.productName,
      stockSource: 'regularization_chain',
      stockSourceLabel: 'Cadeia da regularização',
      sourceMovementId: item.movementId || item.sourceMovementId || '',
      regularizationMovementId: movement.id || '',
      requiredQuantity: qty,
      shortageQuantity: qty,
      balanceBefore: 0,
      balanceAfter: -qty,
      unit: movement.unit || movement.yieldUnit || '',
      unitCost: unitCost,
      estimatedTotalCost: unitCost > 0 ? _round(qty * unitCost) : _num(movement.totalCost),
      regularizationChain: [],
      regularizationChainCount: 0
    });
  }

  function _regularizationOrderCancelled(order) {
    var status = _norm(order && (order.status || order.orderStatus || ''));
    return status === 'cancelado' || status === 'cancelada' || status === 'canceled' || status === 'cancelled';
  }

  function _regularizationEffectiveShortage(item) {
    var required = _num(item && item.requiredQuantity);
    var shortage = _num(item && item.shortageQuantity);
    var balanceAfter = _num(item && item.balanceAfter);
    if (required > 0 && balanceAfter < 0) return _round(Math.min(required, Math.abs(balanceAfter)));
    return _round(shortage);
  }

  function _filteredRegularizations() {
    var q = _norm(_regularizationFilters.q);
    return _regularizationEntries().filter(function (entry) {
      if (_regularizationFilters.status !== 'todos' && entry.status !== _regularizationFilters.status) return false;
      if (_regularizationFilters.type !== 'todos' && entry.stockItemType !== _regularizationFilters.type) return false;
      if (!q) return true;
      return _norm([
        entry.itemName,
        entry.productName,
        entry.orderLabel,
        entry.customerName,
        entry.stockItemType,
        entry.stockSourceLabel,
        entry.origin
      ].join(' ')).indexOf(q) >= 0;
    });
  }

  function _regularizationSummary() {
    var entries = _regularizationEntries();
    var pending = entries.filter(function (entry) { return entry.status === 'pendente'; });
    var orders = {};
    var cost = 0;
    pending.forEach(function (entry) {
      if (entry.orderId) orders[entry.orderId] = true;
      cost += _num(entry.estimatedTotalCost);
    });
    return { pending: pending.length, orders: Object.keys(orders).length, cost: _round(cost) };
  }

  function _regularizationMetric(label, value, note) {
    return '<div class="stock-detail-metric"><span>' + _esc(label) + '</span><strong>' + _esc(String(value)) + '</strong><p>' + _esc(note) + '</p></div>';
  }

  function _regularizationStatusLabel(status) {
    var key = String(status || '').toLowerCase();
    if (key === 'aplicada') return 'Aplicada';
    if (key === 'ignorada') return 'Ignorada';
    return 'Pendente';
  }

  function _normalizeRegularizationStockType(value) {
    var key = _norm(value || '').replace(/\s+/g, '_');
    if (key === 'ingrediente' || key === 'ingredient') return 'insumo';
    if (key === 'embalagens' || key === 'packaging' || key === 'package') return 'embalagem';
    if (key === 'produto' || key === 'produto_pronto' || key === 'ready_product') return 'produto_pronto';
    if (key === 'receita' || key === 'ficha' || key === 'ficha_tecnica' || key === 'produto_produzido') return 'produto_produzido';
    if (key === 'base' || key === 'base_producao') return 'base_producao';
    return key || 'insumo';
  }

  function _stockSourceLabel(source) {
    var key = String(source || '').trim();
    if (key === 'combo_opcao') return 'Combo/opção';
    if (key === 'composicao_interna') return 'Montagem interna';
    if (key === 'base_producao' || key === 'combo_base_producao') return 'Base de produção';
    if (key === 'item') return 'Produto';
    return key || 'Venda';
  }

  function _orderLabel(order) {
    return _firstText(order && order.publicOrderCode, order && order.orderRef, order && order.orderNumber, order && order.number, order && order.code, order && order.id ? '#' + String(order.id).slice(-6).toUpperCase() : 'Pedido');
  }

  function _setStockKind(value) {
    _filters.stockKind = value || 'todos';
    _itemsPage.page = 1;
    _paintItems();
  }

  function _setFilter(key, value) {
    _filters[key] = value || (key === 'type' || key === 'stockKind' ? 'todos' : '');
    _itemsPage.page = 1;
    _paintItems();
  }

  function _clearFilters() {
    _filters.q = '';
    _filters.type = 'todos';
    _itemsPage.page = 1;
    _paintItems();
  }

  function _setItemsPageSize(value) {
    _itemsPage.perPage = Number(value) || 10;
    _itemsPage.page = 1;
    _paintItems();
  }

  function _setItemsPage(page) {
    _itemsPage.page = Math.max(1, Number(page) || 1);
    _paintItems();
  }

  function _setMovementFilter(key, value) {
    _movementFilters[key] = value || (key === 'origin' ? 'todos' : '');
    _movementsPage.page = 1;
    _paintMovements();
  }

  function _setMovementDirection(value) {
    _movementFilters.direction = value === 'saida' ? 'saida' : 'entrada';
    _movementsPage.page = 1;
    _paintMovements();
  }

  function _clearMovementFilters() {
    _movementFilters.q = '';
    _movementFilters.origin = 'todos';
    _movementsPage.page = 1;
    _paintMovements();
  }

  function _setMovementsPageSize(value) {
    _movementsPage.perPage = Number(value) || 10;
    _movementsPage.page = 1;
    _paintMovements();
  }

  function _setMovementsPage(page) {
    _movementsPage.page = Math.max(1, Number(page) || 1);
    _paintMovements();
  }

  function _setRegularizationFilter(key, value) {
    _regularizationFilters[key] = value || (key === 'status' || key === 'type' ? 'todos' : '');
    _regularizationsPage.page = 1;
    _paintRegularizations();
  }

  function _clearRegularizationFilters() {
    _regularizationFilters.q = '';
    _regularizationFilters.status = 'pendente';
    _regularizationFilters.type = 'todos';
    _regularizationsPage.page = 1;
    _paintRegularizations();
  }

  function _setRegularizationsPageSize(value) {
    _regularizationsPage.perPage = Number(value) || 10;
    _regularizationsPage.page = 1;
    _paintRegularizations();
  }

  function _setRegularizationsPage(page) {
    _regularizationsPage.page = Math.max(1, Number(page) || 1);
    _paintRegularizations();
  }

  function _applyRegularization(entryId) {
    var entry = _regularizationEntries().find(function (item) { return item.id === entryId; });
    if (!entry || entry.status !== 'pendente') {
      UI.toast('Regularização já aplicada ou não encontrada.', 'info');
      return;
    }
    var ask = UI && typeof UI.confirm === 'function'
      ? UI.confirm('Criar entrada de regularização para ' + entry.itemName + '?')
      : Promise.resolve(window.confirm('Criar entrada de regularização para ' + entry.itemName + '?'));
    ask.then(function (yes) {
      if (!yes) return null;
      return _saveRegularizationEntry(entry);
    }).catch(function (err) {
      UI.toast('Erro ao regularizar: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _saveRegularizationEntry(entry) {
    var order = (_orders || []).find(function (item) { return String(item.id || '') === String(entry.orderId || ''); });
    if (!order) {
      UI.toast('Pedido da regularização não encontrado.', 'error');
      return Promise.resolve(false);
    }
    var now = new Date().toISOString();
    var movementId = 'regularizacao_' + _stockSettingId(entry.orderId + '_' + entry.itemIndex + '_' + entry.stockItemId + '_' + entry.stockItemType);
    var movement = _regularizationMovementPayload(entry, movementId, now);
    var chainMovements = _regularizationChainPayloads(entry, movementId, now);
    var items = (Array.isArray(order.stockRegularizationPendingItems) ? order.stockRegularizationPendingItems : []).map(function (item, idx) {
      if (idx !== entry.itemIndex) return item;
      return Object.assign({}, item, {
        status: 'aplicada',
        appliedAt: now,
        regularizationMovementId: movementId,
        regularizationAppliedQuantity: entry.shortageQuantity
      });
    });
    var pendingCount = items.filter(function (item) { return String(item && item.status || 'pendente').toLowerCase() === 'pendente'; }).length;
    var orderPatch = {
      stockRegularizationPendingItems: items,
      stockRegularizationPendingCount: pendingCount,
      stockRegularizationPending: pendingCount > 0,
      stockRegularizationStatus: pendingCount > 0 ? 'pendente' : 'aplicada',
      stockRegularizationUpdatedAt: now
    };
    if (!pendingCount) orderPatch.stockRegularizationAppliedAt = now;
    var ops = [DB.col('stock_movements').doc(movementId).set(movement, { merge: true })];
    chainMovements.forEach(function (payload) {
      ops.push(DB.col('stock_movements').doc(payload.id).set(payload, { merge: true }));
    });
    ops.push(DB.update('orders', entry.orderId, orderPatch));
    if (entry.sourceMovementId) {
      ops.push(DB.update('stock_movements', entry.sourceMovementId, {
        regularizationStatus: 'aplicada',
        regularizationAppliedAt: now,
        regularizationMovementId: movementId,
        updatedAt: now
      }).catch(function () { return null; }));
    }
    return Promise.all(ops).then(function () {
      UI.toast('Entrada de regularização criada.', 'success');
      return _loadItems();
    });
  }

  function _regularizationMovementPayload(entry, movementId, now) {
    var stockType = _normalizeRegularizationStockType(entry.stockItemType);
    var qty = _round(entry.shortageQuantity);
    var unitCost = _num(entry.unitCost);
    var payload = {
      id: movementId,
      type: 'entrada_regularizacao',
      movementGroup: 'stock_regularization',
      regularizationOrigin: 'saldo_negativo_venda',
      regularizationStatus: 'aplicada',
      regularizationEntry: true,
      regularizationSourceMovementId: entry.sourceMovementId || '',
      orderId: entry.orderId || '',
      orderNumber: entry.orderLabel || '',
      itemId: entry.stockItemId || '',
      itemName: entry.itemName || '',
      productId: entry.productId || '',
      productName: entry.productName || entry.itemName || '',
      stockItemId: entry.stockItemId || '',
      stockItemType: stockType,
      itemClass: stockType,
      classe: stockType,
      quantity: qty,
      unit: entry.unit || 'un',
      unitCost: unitCost,
      totalCost: unitCost > 0 ? qty * unitCost : 0,
      previousBalance: entry.balanceAfter,
      balanceBefore: entry.balanceAfter,
      balanceAfter: _round(entry.balanceAfter + qty),
      reason: 'Regularização de venda sem saldo',
      notes: 'Entrada criada manualmente a partir de Estoque > Regularizações.',
      movementDate: _today(),
      createdAt: now,
      updatedAt: now
    };
    if (stockType === 'base_producao') {
      payload.baseProductionId = entry.stockItemId || '';
      payload.baseProductionName = entry.itemName || '';
    } else if (stockType === 'produto_produzido') {
      payload.fichaTecnicaId = entry.stockItemId || '';
      payload.fichaTecnicaNome = entry.itemName || '';
    } else if (stockType === 'produto_pronto') {
      payload.sourceItemId = entry.stockItemId || '';
      payload.produtoProntoId = entry.stockItemId || '';
    } else if (stockType === 'insumo') {
      payload.ingredientId = entry.stockItemId || '';
      payload.ingredientName = entry.itemName || '';
    } else if (stockType === 'embalagem') {
      payload.packagingId = entry.stockItemId || '';
      payload.packagingName = entry.itemName || '';
    }
    return payload;
  }

  function _regularizationChainPayloads(entry, parentMovementId, now) {
    var chain = Array.isArray(entry && entry.regularizationChain) ? entry.regularizationChain : [];
    return chain.map(function (movement, idx) {
      var id = movement.id || _stockSettingId(parentMovementId + '_chain_' + idx);
      return Object.assign({}, movement, {
        id: id,
        orderId: entry.orderId || '',
        orderNumber: entry.orderLabel || '',
        movementGroup: 'stock_regularization_chain',
        regularizationOrigin: 'saldo_negativo_venda',
        regularizationParentMovementId: parentMovementId || '',
        regularizationSourceMovementId: entry.sourceMovementId || '',
        movementDate: _today(),
        createdAt: now,
        updatedAt: now
      });
    });
  }

  function _openItemDetails(key) {
    var item = (_items || []).find(function (it) { return it.key === key; });
    if (!item) return;
    _detailMovementState = { key: key, q: '', page: 1, perPage: 5 };
    var body = _styles() +
      '<div class="stock-detail">' +
        '<section class="stock-detail-hero">' +
          '<div class="stock-modal-head" style="margin-bottom:0;"><span class="mi">inventory_2</span><div><p>' + _stockKindLabel(item.stockItemType) + '</p><h2>' + _esc(item.itemName) + '</h2></div></div>' +
          '<span class="stock-badge ' + _stockKindClass(item.stockItemType) + '">' + _esc(item.unit || 'sem unidade') + '</span>' +
        '</section>' +
        '<section class="stock-detail-grid">' +
          _detailMetric('Saldo atual', _fmtQty(item.balance) + ' ' + _esc(item.unit || ''), 'Saldo calculado pelas movimentações.') +
          _detailMetric('Entradas', _fmtQty(item.entries) + ' ' + _esc(item.unit || ''), 'Quantidade registrada como entrada.') +
          _detailMetric('Saídas', _fmtQty(item.exits) + ' ' + _esc(item.unit || ''), 'Quantidade registrada como saída.') +
          _detailMetric('Valor estimado', item.hasCost ? _money(item.estimatedValue) : 'sem custo informado', 'Usa o custo informado nas movimentações.') +
          _detailMetric('Estoque mínimo', item.minStockEnabled ? (_fmtQty(item.minStock) + ' ' + _esc(item.unit || '') + (item.minStockSuggested ? ' · sugerido' : '')) : 'não definido', item.isBelowMin ? 'Este item está abaixo do mínimo.' : 'Referência para conferência rápida.') +
          _detailMetric('Estoque máximo', item.maxStockEnabled ? (_fmtQty(item.maxStock) + ' ' + _esc(item.unit || '') + (item.maxStockSuggested ? ' · sugerido' : '')) : 'não definido', item.isAboveMax ? 'Este item está acima do máximo definido.' : 'Limite recomendado para não comprar ou produzir além do necessário.') +
        '</section>' +
        '<section class="stock-detail-card">' +
          '<div class="stock-modal-head"><span class="mi">receipt_long</span><div><div class="stock-modal-title">Movimentações relacionadas</div><div class="stock-modal-hint">Histórico usado para calcular este saldo.</div></div><span style="margin-left:auto;font-size:12px;color:#6F6860;border:1px solid #EAE4DA;border-radius:999px;padding:5px 9px;background:#FFFCF8;white-space:nowrap;">' + item.movements.length + '</span></div>' +
          '<div class="stock-detail-search"><input id="stock-detail-movement-q" type="search" placeholder="Buscar por data, origem ou tipo..." oninput="Modules.Estoque._setDetailMovementSearch(this.value)"></div>' +
          '<div id="stock-detail-movement-list" class="stock-movement-list"></div>' +
          '<div id="stock-detail-movement-footer"></div>' +
        '</section>' +
        '<p class="stock-footnote">O saldo continua sendo calculado por movimentações. O ajuste de inventário registra uma nova entrada ou saída para igualar o sistema à contagem real.</p>' +
      '</div>';
    window._stockDetailModal = UI.modal({ title: 'Detalhe do estoque', body: body, footer: '<div class="stock-modal-footer"><button class="stock-secondary" onclick="if(window._stockDetailModal){window._stockDetailModal.close();}">Fechar</button><button class="stock-secondary" onclick="Modules.Estoque._openMinimumModal(\'' + _escJs(item.key) + '\')">Mínimo e máximo</button><button class="stock-primary" onclick="Modules.Estoque._openAdjustmentModal(\'' + _escJs(item.key) + '\')">Ajustar saldo</button></div>', maxWidth: '900px' });
    _paintDetailMovements();
  }

  function _filteredDetailMovements(item) {
    var q = String(_detailMovementState.q || '').toLowerCase();
    return (item && item.movements ? item.movements : []).filter(function (movement) {
      if (!q) return true;
      return [
        movement.label,
        movement.origin,
        movement.originDetail,
        movement.date,
        _fmtDate(movement.date),
        movement.unit,
        movement.quantity
      ].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }

  function _detailMovementRow(movement) {
    return '<div class="stock-movement-line">' +
      '<div><strong>' + _esc(movement.label) + '</strong><span>' + _fmtDate(movement.date) + ' · ' + _esc(movement.originDetail || movement.origin || 'Produção') + '</span></div>' +
      '<div class="' + (movement.direction > 0 ? 'stock-positive' : 'stock-negative') + '">' + (movement.direction > 0 ? '+' : '-') + _fmtQty(movement.quantity) + ' ' + _esc(movement.unit || '') + '</div>' +
    '</div>';
  }

  function _paintDetailMovements() {
    var item = (_items || []).find(function (it) { return it.key === _detailMovementState.key; });
    var listEl = document.getElementById('stock-detail-movement-list');
    var footerEl = document.getElementById('stock-detail-movement-footer');
    if (!item || !listEl || !footerEl) return;
    var data = _filteredDetailMovements(item);
    var perPage = _detailMovementState.perPage || 5;
    var totalPages = Math.max(1, Math.ceil(data.length / perPage));
    _detailMovementState.page = Math.min(Math.max(1, _detailMovementState.page || 1), totalPages);
    var start = (_detailMovementState.page - 1) * perPage;
    var pageData = data.slice(start, start + perPage);
    listEl.innerHTML = pageData.length ? pageData.map(_detailMovementRow).join('') : '<p class="stock-muted">Nenhuma movimentação encontrada.</p>';
    var from = data.length ? start + 1 : 0;
    var to = Math.min(start + perPage, data.length);
    footerEl.innerHTML = '<div class="stock-detail-pagination">' +
      '<span>Mostrando <strong>' + from + '-' + to + '</strong> de <strong>' + data.length + '</strong></span>' +
      '<div class="stock-pagination">' +
        '<button type="button" ' + (_detailMovementState.page <= 1 ? 'disabled' : '') + ' onclick="Modules.Estoque._setDetailMovementPage(' + (_detailMovementState.page - 1) + ')">Anterior</button>' +
        '<div class="stock-page-indicator"><span>' + _detailMovementState.page + '</span><i></i><span>' + totalPages + '</span></div>' +
        '<button type="button" ' + (_detailMovementState.page >= totalPages ? 'disabled' : '') + ' onclick="Modules.Estoque._setDetailMovementPage(' + (_detailMovementState.page + 1) + ')">Próxima</button>' +
      '</div>' +
    '</div>';
  }

  function _setDetailMovementSearch(value) {
    _detailMovementState.q = value || '';
    _detailMovementState.page = 1;
    _paintDetailMovements();
  }

  function _setDetailMovementPage(page) {
    _detailMovementState.page = Math.max(1, Number(page) || 1);
    _paintDetailMovements();
  }

  function _detailMetric(label, value, note) {
    return '<div class="stock-detail-metric"><span>' + _esc(label) + '</span><strong>' + value + '</strong><p>' + _esc(note) + '</p></div>';
  }

  function _openAdjustmentModal(key) {
    var item = (_items || []).find(function (it) { return it.key === key; });
    if (!item) return;
    var current = _fmtQty(item.balance) + ' ' + (item.unit || '');
    var body = _styles() +
      '<div class="stock-adjust">' +
        '<section class="stock-detail-hero compact">' +
          '<div class="stock-modal-head" style="margin-bottom:0;"><span class="mi">inventory_2</span><div><p>' + _stockKindLabel(item.stockItemType) + '</p><h2>' + _esc(item.itemName) + '</h2></div></div>' +
          '<span class="stock-badge ' + _stockKindClass(item.stockItemType) + '">' + _esc(item.unit || 'sem unidade') + '</span>' +
        '</section>' +
        '<section class="stock-adjust-card">' +
          '<div class="stock-adjust-head"><span class="mi">tune</span><div><h3>Contagem de estoque</h3><p>Informe o saldo real encontrado. O BocaFood cria uma movimentação de ajuste para aproximar o sistema da contagem física.</p></div></div>' +
          '<div class="stock-adjust-grid">' +
            '<label><span>Saldo no sistema</span><input type="text" value="' + _esc(current) + '" disabled></label>' +
            '<label><span>Saldo contado *</span><input id="stock-adjust-counted" type="number" step="0.001" min="0" value="' + _esc(String(item.balance || 0)) + '" oninput="Modules.Estoque._updateAdjustmentPreview(\'' + _escJs(key) + '\')"></label>' +
            '<label><span>Data da contagem</span><input id="stock-adjust-date" type="date" value="' + _today() + '"></label>' +
            '<label><span>Motivo</span><select id="stock-adjust-reason"><option value="Contagem de inventário">Contagem de inventário</option><option value="Correção operacional">Correção operacional</option><option value="Perda identificada">Perda identificada</option><option value="Sobra identificada">Sobra identificada</option></select></label>' +
            '<label class="full"><span>Observação</span><textarea id="stock-adjust-notes" placeholder="Ex: contagem feita no fechamento do dia"></textarea></label>' +
          '</div>' +
          '<div id="stock-adjust-preview" class="stock-adjust-preview"></div>' +
        '</section>' +
      '</div>';
    window._stockAdjustmentModal = UI.modal({
      title: 'Ajustar estoque',
      body: body,
      footer: '<div class="stock-modal-footer"><button class="stock-secondary" onclick="if(window._stockAdjustmentModal){window._stockAdjustmentModal.close();}">Cancelar</button><button class="stock-primary" onclick="Modules.Estoque._saveAdjustment(\'' + _escJs(key) + '\')">Salvar ajuste</button></div>',
      maxWidth: '760px'
    });
    setTimeout(function () { _updateAdjustmentPreview(key); }, 20);
  }

  function _updateAdjustmentPreview(key) {
    var item = (_items || []).find(function (it) { return it.key === key; });
    var el = document.getElementById('stock-adjust-preview');
    if (!item || !el) return;
    var counted = _num((document.getElementById('stock-adjust-counted') || {}).value);
    var diff = _round(counted - _num(item.balance));
    if (!diff) {
      el.innerHTML = '<span class="stock-muted">O saldo contado é igual ao saldo do sistema. Nenhum ajuste será criado.</span>';
      return;
    }
    el.innerHTML = '<strong class="' + (diff > 0 ? 'stock-positive' : 'stock-negative') + '">' + (diff > 0 ? '+' : '-') + _fmtQty(Math.abs(diff)) + ' ' + _esc(item.unit || '') + '</strong>' +
      '<span>' + (diff > 0 ? 'Será registrada uma entrada de ajuste.' : 'Será registrada uma saída de ajuste.') + '</span>';
  }

  function _saveAdjustment(key) {
    var item = (_items || []).find(function (it) { return it.key === key; });
    if (!item) return;
    var countedEl = document.getElementById('stock-adjust-counted');
    var counted = _num(countedEl && countedEl.value);
    if (counted < 0) { UI.toast('Informe um saldo contado válido.', 'error'); return; }
    var diff = _round(counted - _num(item.balance));
    if (!diff) { UI.toast('O saldo contado é igual ao saldo atual.', 'info'); return; }
    var now = new Date().toISOString();
    var qty = Math.abs(diff);
    var unitCost = _num(item.lastUnitCost);
    var movement = {
      type: diff > 0 ? 'ajuste_entrada' : 'ajuste_saida',
      movementGroup: 'inventory_adjustment',
      itemId: item.itemId || '',
      itemName: item.itemName || '',
      itemType: item.itemType || '',
      stockItemType: item.stockItemType || (item.itemType === 'ingrediente' ? 'insumo' : 'produto_produzido'),
      quantity: qty,
      unit: item.unit || '',
      unitCost: unitCost,
      totalCost: unitCost > 0 ? qty * unitCost : 0,
      previousBalance: _num(item.balance),
      countedBalance: counted,
      balanceAfter: counted,
      reason: ((document.getElementById('stock-adjust-reason') || {}).value || 'Contagem de inventário'),
      notes: ((document.getElementById('stock-adjust-notes') || {}).value || '').trim(),
      movementDate: ((document.getElementById('stock-adjust-date') || {}).value || _today()),
      createdAt: now,
      updatedAt: now
    };
    DB.add('stock_movements', movement).then(function () {
      UI.toast('Ajuste de estoque registrado.', 'success');
      if (window._stockAdjustmentModal) window._stockAdjustmentModal.close();
      if (window._stockDetailModal) window._stockDetailModal.close();
      _loadItems();
    }).catch(function (err) {
      UI.toast('Erro ao ajustar estoque: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _openMinimumModal(key) {
    var item = (_items || []).find(function (it) { return it.key === key; });
    if (!item) return;
    var body = _styles() +
      '<div class="stock-adjust">' +
        '<section class="stock-detail-hero compact">' +
          '<div class="stock-modal-head" style="margin-bottom:0;"><span class="mi">inventory_2</span><div><p>' + _stockKindLabel(item.stockItemType) + '</p><h2>' + _esc(item.itemName) + '</h2></div></div>' +
          '<span class="stock-badge ' + _stockKindClass(item.stockItemType) + '">' + _esc(item.unit || 'sem unidade') + '</span>' +
        '</section>' +
        '<section class="stock-adjust-card">' +
          '<div class="stock-adjust-head"><span class="mi">data_thresholding</span><div><h3>Estoque mínimo e máximo</h3><p>Defina a faixa ideal deste item para saber quando precisa repor ou quando já passou do necessário.</p></div></div>' +
          '<div class="stock-adjust-grid min-grid">' +
            '<label><span>Saldo atual</span><input type="text" value="' + _esc(_fmtQty(item.balance) + ' ' + (item.unit || '')) + '" disabled></label>' +
            '<label><span>Quantidade mínima</span><input id="stock-min-value" type="number" step="0.001" min="0" value="' + _esc(String(item.minStock || '')) + '"></label>' +
            '<label><span>Quantidade máxima</span><input id="stock-max-value" type="number" step="0.001" min="0" value="' + _esc(String(item.maxStock || '')) + '"></label>' +
          '</div>' +
        '</section>' +
      '</div>';
    window._stockMinimumModal = UI.modal({
      title: 'Estoque mínimo e máximo',
      body: body,
      footer: '<div class="stock-modal-footer"><button class="stock-secondary" onclick="if(window._stockMinimumModal){window._stockMinimumModal.close();}">Cancelar</button><button class="stock-primary" onclick="Modules.Estoque._saveMinimum(\'' + _escJs(key) + '\')">Salvar faixa</button></div>',
      maxWidth: '620px'
    });
  }

  function _saveMinimum(key) {
    var item = (_items || []).find(function (it) { return it.key === key; });
    if (!item) return;
    var minStock = _num((document.getElementById('stock-min-value') || {}).value);
    var maxStock = _num((document.getElementById('stock-max-value') || {}).value);
    if (minStock < 0) { UI.toast('Informe uma quantidade mínima válida.', 'error'); return; }
    if (maxStock < 0) { UI.toast('Informe uma quantidade máxima válida.', 'error'); return; }
    if (minStock > 0 && maxStock > 0 && maxStock < minStock) { UI.toast('O estoque máximo não pode ser menor que o mínimo.', 'error'); return; }
    var id = _stockSettingId(key);
    var now = new Date().toISOString();
    DB.col('stock_settings').doc(id).set({
      id: id,
      stockKey: key,
      itemId: item.itemId || '',
      itemName: item.itemName || '',
      itemType: item.itemType || '',
      stockItemType: item.stockItemType || '',
      unit: item.unit || '',
      minStock: minStock,
      maxStock: maxStock,
      updatedAt: now,
      createdAt: (_settings[key] && _settings[key].createdAt) || now
    }, { merge: true }).then(function () {
      return _syncStockRangeToOrigin(item, minStock, maxStock, now);
    }).then(function () {
      UI.toast('Faixa de estoque salva.', 'success');
      if (window._stockMinimumModal) window._stockMinimumModal.close();
      if (window._stockDetailModal) window._stockDetailModal.close();
      _loadItems();
    }).catch(function (err) {
      UI.toast('Erro ao salvar faixa de estoque: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _syncStockRangeToOrigin(item, minStock, maxStock, now) {
    if (!item || !item.itemId) return Promise.resolve();
    var patch = {
      minStock: minStock,
      maxStock: maxStock,
      estoque_minimo: minStock,
      estoque_maximo: maxStock,
      updatedAt: now
    };
    if (item.stockItemType === 'insumo' || item.stockItemType === 'produto_pronto') {
      return DB.update('itens_custo', item.itemId, patch).catch(function () { return null; });
    }
    if (item.stockItemType === 'produto_produzido') {
      return DB.update('fichasTecnicas', item.itemId, patch).catch(function () { return null; });
    }
    if (item.stockItemType === 'base_producao') {
      return _syncBaseStockRangeToRecipe(item, minStock, maxStock, now);
    }
    return Promise.resolve();
  }

  function _syncBaseStockRangeToRecipe(item, minStock, maxStock, now) {
    var rawId = String(item.itemId || '');
    var parts = rawId.split(':');
    var recipeId = parts.shift() || '';
    var componentName = parts.join(':');
    return DB.getAll('fichasTecnicas').catch(function () { return []; }).then(function (recipes) {
      var ops = [];
      (recipes || []).forEach(function (recipe) {
        var changed = false;
        var components = (recipe.components || []).map(function (comp, idx) {
          var isLegacyMatch = recipeId && componentName && String(recipe.id || '') === String(recipeId) && String(comp.name || '') === String(componentName || '');
          var isSharedMatch = _baseComponentStockId(recipe, comp, idx) === rawId;
          if (!isLegacyMatch && !isSharedMatch) return comp;
          changed = true;
          return Object.assign({}, comp, {
            minStock: minStock,
            maxStock: maxStock,
            estoque_minimo: minStock,
            estoque_maximo: maxStock
          });
        });
        if (changed) ops.push(DB.update('fichasTecnicas', recipe.id, { components: components, updatedAt: now }).catch(function () { return null; }));
      });
      return Promise.all(ops);
    });
  }

  function _baseComponentStockId(recipe, comp, idx) {
    comp = comp || {};
    var existing = String(comp.baseProductionId || '').trim();
    if (existing) return existing;
    var shared = String(comp.sharedBaseId || '').trim();
    if (shared) return shared;
    var componentId = String(comp.componentId || comp.recipeComponentId || '').trim();
    if (componentId) return componentId.indexOf('base_component:') === 0 ? componentId : 'base_component:' + componentId;
    return (recipe && recipe.id ? recipe.id : '') + ':' + (comp.name || ('etapa_' + (idx || 0)));
  }

  function _openInventoryModal() {
    var visible = _filteredItems();
    if (!visible.length) { UI.toast('Não há itens para inventariar neste filtro.', 'info'); return; }
    var rows = visible.map(function (item, idx) {
      return '<div class="stock-inventory-row" data-key="' + _esc(item.key) + '">' +
        '<div><strong>' + _esc(item.itemName) + '</strong><span>' + _stockKindLabel(item.stockItemType) + ' · saldo atual ' + _fmtQty(item.balance) + ' ' + _esc(item.unit || '') + '</span></div>' +
        '<input id="stock-count-' + idx + '" data-key="' + _esc(item.key) + '" type="number" step="0.001" min="0" value="' + _esc(String(item.balance || 0)) + '">' +
      '</div>';
    }).join('');
    var body = _styles() +
      '<div class="stock-adjust"><section class="stock-adjust-card">' +
        '<div class="stock-adjust-head"><span class="mi">fact_check</span><div><h3>Inventário em lote</h3><p>Informe a contagem real dos itens visíveis. O BocaFood cria ajustes apenas para os itens com diferença.</p></div></div>' +
        '<div class="stock-inventory-list">' + rows + '</div>' +
      '</section></div>';
    window._stockInventoryModal = UI.modal({
      title: 'Inventário em lote',
      body: body,
      footer: '<div class="stock-modal-footer"><button class="stock-secondary" onclick="if(window._stockInventoryModal){window._stockInventoryModal.close();}">Cancelar</button><button class="stock-primary" onclick="Modules.Estoque._saveInventory()">Salvar inventário</button></div>',
      maxWidth: '820px'
    });
  }

  function _saveInventory() {
    var inputs = [].slice.call(document.querySelectorAll('[id^="stock-count-"]'));
    var now = new Date().toISOString();
    var sessionId = 'inv_' + Date.now();
    var ops = [];
    inputs.forEach(function (input, idx) {
      var key = input.getAttribute('data-key');
      var item = (_items || []).find(function (it) { return it.key === key; });
      if (!item) return;
      var counted = _num(input.value);
      if (counted < 0) return;
      var diff = _round(counted - _num(item.balance));
      if (!diff) return;
      var qty = Math.abs(diff);
      var unitCost = _num(item.lastUnitCost);
      var id = sessionId + '_' + idx + '_' + (diff > 0 ? 'entrada' : 'saida');
      ops.push(DB.col('stock_movements').doc(id).set({
        id: id,
        type: diff > 0 ? 'ajuste_entrada' : 'ajuste_saida',
        movementGroup: 'inventory_count',
        inventorySessionId: sessionId,
        itemId: item.itemId || '',
        itemName: item.itemName || '',
        itemType: item.itemType || '',
        stockItemType: item.stockItemType || '',
        quantity: qty,
        unit: item.unit || '',
        unitCost: unitCost,
        totalCost: unitCost > 0 ? qty * unitCost : 0,
        previousBalance: _num(item.balance),
        countedBalance: counted,
        balanceAfter: counted,
        reason: 'Inventário em lote',
        movementDate: _today(),
        createdAt: now,
        updatedAt: now
      }, { merge: true }));
    });
    if (!ops.length) { UI.toast('Nenhuma diferença encontrada no inventário.', 'info'); return; }
    Promise.all(ops).then(function () {
      UI.toast('Inventário salvo com ' + ops.length + ' ajuste' + (ops.length === 1 ? '' : 's') + '.', 'success');
      if (window._stockInventoryModal) window._stockInventoryModal.close();
      _loadItems();
    }).catch(function (err) {
      UI.toast('Erro ao salvar inventário: ' + (err && err.message ? err.message : err), 'error');
    });
  }

  function _emptyState(context) {
    if (context === 'regularizacoes') {
      return '<div class="stock-empty">' +
        '<span class="mi">task_alt</span>' +
        '<strong>Nenhuma regularização encontrada</strong>' +
        '<p>Quando uma venda baixar estoque sem saldo suficiente, a pendência aparecerá aqui para conferência.</p>' +
      '</div>';
    }
    return '<div class="stock-empty">' +
      '<span class="mi">inventory_2</span>' +
      '<strong>Nenhum saldo calculado ainda</strong>' +
      '<p>Quando a produção gerar movimentações, os itens aparecerão aqui automaticamente.</p>' +
    '</div>';
  }

  function _hasFilters() {
    return !!(_filters.q || _filters.type !== 'todos' || _filters.stockKind !== 'todos');
  }

  function _typeLabel(type) {
    return type === 'produto' ? 'Produto produzido' : 'Ingrediente';
  }

  function _stockKindLabel(kind) {
    if (kind === 'embalagem') return 'Embalagem';
    if (kind === 'produto_pronto') return 'Produto pronto';
    if (kind === 'produto_produzido') return 'Produto produzido';
    if (kind === 'base_producao') return 'Base de produção';
    return 'Insumo';
  }

  function _stockClassLabel(kind) {
    if (kind === 'embalagem') return 'Embalagem';
    if (kind === 'produto' || kind === 'produto_pronto') return 'Produto';
    if (kind === 'produto_produzido') return 'Produto produzido';
    if (kind === 'base_producao') return 'Base de produção';
    return 'Insumo';
  }

  function _stockKindClass(kind) {
    if (kind === 'embalagem') return 'packaging';
    if (kind === 'produto_pronto') return 'ready-product';
    if (kind === 'produto_produzido') return 'product';
    if (kind === 'base_producao') return 'base-product';
    return 'ingredient';
  }

  function _normalizeStockClass(value) {
    var key = _norm(value || '').replace(/\s+/g, '_');
    if (!key) return '';
    if (key === 'insumo' || key === 'ingrediente' || key === 'ingredient') return 'insumo';
    if (key === 'embalagem' || key === 'embalagens' || key === 'packaging' || key === 'package') return 'embalagem';
    if (key === 'produto' || key === 'produto_pronto' || key === 'ready_product') return 'produto';
    if (key === 'produto_produzido' || key === 'produzido' || key === 'produced_product' || key === 'ficha_tecnica') return 'produto_produzido';
    if (key === 'base_producao' || key === 'base' || key === 'semiacabado' || key === 'preparo_intermediario') return 'base_producao';
    return key;
  }

  function _stockSettingId(key) {
    return String(key || 'item').replace(/[^\w-]/g, '_').slice(0, 140);
  }

  function _num(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return 0;
    raw = raw.replace(/[^\d,.-]/g, '');
    if (raw.indexOf(',') >= 0 && raw.indexOf('.') >= 0) raw = raw.replace(/\./g, '').replace(',', '.');
    else if (raw.indexOf(',') >= 0) raw = raw.replace(',', '.');
    return parseFloat(raw) || 0;
  }

  function _round(value) {
    return Math.round((_num(value) + Number.EPSILON) * 10000) / 10000;
  }

  function _fmtQty(value) {
    var n = _round(value);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }

  function _money(value) {
    if (value == null || isNaN(Number(value))) return 'sem custo informado';
    return '€\u00a0' + Number(value || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function _fmtDate(raw) {
    if (!raw) return '—';
    var d = null;
    if (raw && typeof raw.toDate === 'function') d = raw.toDate();
    else if (raw instanceof Date) d = raw;
    else d = new Date(raw);
    return d && !isNaN(d.getTime()) ? UI.fmtDate(d) : '—';
  }

  function _dateValue(raw) {
    if (!raw) return 0;
    if (raw && typeof raw.toDate === 'function') return raw.toDate().getTime();
    var d = raw instanceof Date ? raw : new Date(raw);
    return d && !isNaN(d.getTime()) ? d.getTime() : 0;
  }

  function _norm(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function _esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function _firstText() {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (value === undefined || value === null) continue;
      if (value && typeof value.toDate === 'function') {
        try {
          return value.toDate().toISOString();
        } catch (err) {}
      }
      var text = String(value).trim();
      if (text) return text;
    }
    return '';
  }

  function _escJs(value) {
    return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
  }

  function _today() {
    return new Date().toISOString().slice(0, 10);
  }

  function _styles() {
    return '<style>' +
      '.stock-page{padding:24px;display:flex;flex-direction:column;gap:16px;color:#1F1F1F;}' +
      '.stock-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}' +
      '.stock-page-head h2{font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.15;letter-spacing:0;}' +
      '.stock-page-head p{font-size:13px;color:#6F6860;line-height:1.5;margin:0;max-width:760px;font-weight:400;}' +
      '.stock-content{display:flex;flex-direction:column;gap:14px;}' +
      '.stock-kind-tabs{display:flex;gap:8px;align-items:center;overflow:auto;padding:8px;background:linear-gradient(135deg,#FFFDFC 0%,#FFF8F3 100%);border:1px solid #E8DDD5;border-radius:16px;box-shadow:0 10px 24px rgba(85,46,32,.045),inset 0 1px 0 rgba(255,255,255,.72);}' +
      '.stock-kind-tabs button{height:32px;padding:0 12px;border:1px solid transparent;border-radius:999px;background:rgba(255,255,255,.72);color:#6F6860;font-size:12px;font-weight:650;font-family:Manrope,Inter,sans-serif;white-space:nowrap;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s,border-color .15s,transform .15s;}' +
      '.stock-kind-tabs button:hover{background:#fff;color:#211815;border-color:#E8DDD5;box-shadow:0 5px 14px rgba(85,46,32,.06);}' +
      '.stock-kind-tabs button.active{background:#B42318;color:#fff;border-color:#B42318;box-shadow:0 8px 18px rgba(180,35,24,.16);}' +
      '.stock-kind-tabs.movement-tabs{padding:8px;}' +
      '.stock-view-tabs{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}' +
      '.stock-view-tabs button{height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:12px;background:#fff;color:#6F6860;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;box-shadow:0 8px 18px rgba(31,31,31,.035);}' +
      '.stock-view-tabs button.active{background:#B42318;border-color:#B42318;color:#fff;box-shadow:0 8px 18px rgba(180,35,24,.14);}' +
      '.stock-filter-card,.stock-card,.stock-detail-card{background:#fff;border:1px solid #EAE4DA;border-radius:18px;box-shadow:0 14px 34px rgba(31,31,31,.055);}' +
      '.stock-filter-card{padding:16px;}' +
      '.stock-filter-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:11px 12px;align-items:end;}' +
      '.stock-filter-grid.movement-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));}' +
      '.stock-filter-grid label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;}' +
      '.stock-filter-grid input,.stock-filter-grid select{height:42px;width:100%;box-sizing:border-box;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;padding:0 12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.82);}' +
      '.stock-filter-grid select{appearance:none;-webkit-appearance:none;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:38px;}' +
      '.stock-filter-actions{display:flex;justify-content:flex-start;margin-top:11px;}' +
      '.stock-filter-clear{height:36px;padding:0 13px;border:1px solid #EADFD8;border-radius:11px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.stock-card{padding:0;overflow:hidden;}' +
      '.stock-card-head{padding:18px 18px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid #F0E7E1;}' +
      '.stock-card-head.compact{padding:0 0 12px;border-bottom:0;}' +
      '.stock-card-head h2{margin:0;color:#1F1F1F;font-size:17px;font-weight:720;letter-spacing:0;}' +
      '.stock-card-head p{margin:4px 0 0;color:#6F6860;font-size:13px;line-height:1.4;font-weight:400;}' +
      '.stock-card-head>span{font-size:12px;color:#6F6860;border:1px solid #EAE4DA;border-radius:999px;padding:5px 9px;background:#FFFCF8;white-space:nowrap;}' +
      '.stock-head-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;}' +
      '.stock-head-actions span{font-size:12px;color:#6F6860;border:1px solid #EAE4DA;border-radius:999px;padding:5px 9px;background:#FFFCF8;white-space:nowrap;}' +
      '.stock-head-actions button{height:34px;padding:0 12px;border:none;border-radius:10px;background:#1F1F1F;color:#fff;font-size:12px;font-weight:650;font-family:inherit;cursor:pointer;box-shadow:0 8px 18px rgba(31,31,31,.12);}' +
      '.stock-head-actions button:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}' +
      '.stock-list-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}' +
      '.stock-list-title h2{margin:0;color:#1F1F1F;font-size:14px;font-weight:700;line-height:1.3;}' +
      '.stock-list-title p{margin:3px 0 0;color:#6F6860;font-size:13px;line-height:1.45;}' +
      '.stock-list-title button{height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);}' +
      '.stock-regularization-config{display:flex;flex-direction:column;gap:12px;}' +
      '.stock-config-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}' +
      '.stock-config-option{min-height:78px;text-align:left;border:1px solid #E8DCD7;border-radius:14px;background:#FFFCF8;padding:12px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:5px;transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.stock-config-option strong{font-size:13px;color:#1F1F1F;font-weight:750;line-height:1.25;}' +
      '.stock-config-option span{font-size:12px;color:#6F6860;line-height:1.35;}' +
      '.stock-config-option.active{background:#FFF6F4;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.stock-table-card{background:#fff;border:1px solid #EADFD8;border-radius:18px;box-shadow:0 12px 30px rgba(31,31,31,.055);overflow:hidden;}' +
      '.stock-table-wrap{overflow:auto;}' +
      '.stock-table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;min-width:920px;}' +
      '.stock-table th{padding:12px 16px;text-align:left;color:#1F1F1F;font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:600;background:#fff;border-bottom:1px solid #EAE4DA;white-space:nowrap;}' +
      '.stock-table td{padding:14px 16px;border-bottom:1px solid #EADFD8;color:#1F1F1F;vertical-align:middle;}' +
      '.stock-row{cursor:pointer;transition:background .15s ease;}' +
      '.stock-row:hover{background:#FFFCF8;}' +
      '.stock-table-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;}' +
      '.stock-table-footer>span{font-size:12px;color:#6F6860;line-height:1.4;}' +
      '.stock-table-footer strong{color:#1F1F1F;font-weight:600;}' +
      '.stock-pagination{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}' +
      '.stock-pagination select{width:120px;height:34px;padding:0 34px 0 10px;border:1px solid #E8DCD7;border-radius:10px;font-size:12px;font-family:inherit;outline:none;background:#FFFCF8;color:#6F6860;box-sizing:border-box;appearance:none;-webkit-appearance:none;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 14px,calc(100% - 13px) 14px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;}' +
      '.stock-pagination button{height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;font-family:inherit;cursor:pointer;}' +
      '.stock-pagination button:disabled{opacity:.45;cursor:not-allowed;}' +
      '.stock-pagination span{font-size:12px;color:#6F6860;}' +
      '.stock-page-indicator{display:flex;align-items:center;gap:6px;}' +
      '.stock-page-indicator i{width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65;}' +
      '.stock-row-action{height:32px;padding:0 10px;border:none;border-radius:9px;background:#B42318;color:#fff;font-size:12px;font-weight:650;font-family:inherit;cursor:pointer;white-space:nowrap;box-shadow:0 4px 10px rgba(180,35,24,.14);}' +
      '.stock-row-action:disabled{background:#F1E8E3;color:#8A7E7C;box-shadow:none;cursor:not-allowed;}' +
      '.stock-item-name{font-size:14px;font-weight:650;color:#1F1F1F;line-height:1.25;}' +
      '.stock-item-note,.stock-muted{font-size:12px;color:#6F6860;font-weight:400;line-height:1.35;}' +
      '.stock-chain-item{display:flex;align-items:center;gap:6px;color:#4B403A!important;font-weight:600!important;}' +
      '.stock-chain-prefix{color:#8A7E7C;font-size:13px;line-height:1;}' +
      '.stock-alert-text{color:#B42318;margin-top:3px;}' +
      '.stock-badge{display:inline-flex;align-items:center;justify-content:center;height:26px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;}' +
      '.stock-badge.ingredient{background:#FFF4EE;color:#8F3D22;border:1px solid #F3D8CA;}' +
      '.stock-badge.packaging{background:#FFF8E8;color:#7A4E12;border:1px solid #F3DCA8;}' +
      '.stock-badge.ready-product{background:#F5F0FF;color:#5D3D9B;border:1px solid #E1D6F8;}' +
      '.stock-badge.product{background:#EEF8F2;color:#246B43;border:1px solid #D4EADB;}' +
      '.stock-badge.base-product{background:#FFF8E8;color:#7A4E12;border:1px solid #F3DCA8;}' +
      '.stock-origin{font-size:12px;color:#6F6860;}' +
      '.stock-empty{padding:42px 20px;text-align:center;color:#6F6860;display:flex;flex-direction:column;align-items:center;gap:8px;}' +
      '.stock-empty .mi{font-size:30px;color:#B42318;opacity:.72;}' +
      '.stock-empty strong{font-size:15px;color:#1F1F1F;font-weight:650;}' +
      '.stock-empty p{margin:0;font-size:13px;line-height:1.4;}' +
      '.stock-detail{display:flex;flex-direction:column;gap:14px;}' +
      '.stock-detail-hero{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;box-shadow:0 10px 24px rgba(31,31,31,.04);}' +
      '.stock-detail-hero.compact{padding:15px;}' +
      '.stock-modal-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:12px;}' +
      '.stock-modal-head .mi{font-size:18px;color:#6F6860;line-height:1.2;flex:0 0 auto;}' +
      '.stock-modal-title{font-size:13px;font-weight:700;color:#1F1F1F;line-height:1.25;margin:0 0 3px;}' +
      '.stock-modal-hint{font-size:12px;color:#8A7E7C;line-height:1.4;margin:0;}' +
      '.stock-detail-hero p{margin:0 0 5px;color:#6F6860;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;}' +
      '.stock-detail-hero h2{margin:0;font-size:19px;line-height:1.18;color:#1F1F1F;font-weight:700;}' +
      '.stock-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:stretch;}' +
      '.stock-regularization-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:stretch;}' +
      '.stock-regularization-table .stock-badge.regularization-pending{background:#FFF6ED;color:#9A3412;border:1px solid #FED7AA;}' +
      '.stock-regularization-table .stock-badge.regularization-muted{background:#F6F1EA;color:#6F6860;border:1px solid #E8DCD7;}' +
      '.stock-detail-metric{background:#FFFCF8;border:1px solid #E8DCD7;border-radius:16px;padding:13px;box-shadow:0 1px 2px rgba(31,31,31,.03);}' +
      '.stock-detail-metric span{display:block;color:#6F6860;font-size:12px;font-weight:500;margin-bottom:5px;}' +
      '.stock-detail-metric strong{display:block;color:#1F1F1F;font-size:16px;font-weight:650;line-height:1.2;}' +
      '.stock-detail-metric p{margin:5px 0 0;color:#6F6860;font-size:12px;line-height:1.35;}' +
      '.stock-detail-card{padding:16px;background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border-color:#EADFD8;box-shadow:0 10px 24px rgba(31,31,31,.04);}' +
      '.stock-movement-list{display:flex;flex-direction:column;gap:8px;}' +
      '.stock-movement-line{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:#FFFCF8;border:1px solid #F0E7E1;border-radius:14px;}' +
      '.stock-movement-line strong{display:block;font-size:13px;color:#1F1F1F;font-weight:650;}' +
      '.stock-movement-line span{display:block;margin-top:2px;font-size:12px;color:#6F6860;}' +
      '.stock-detail-search{margin:0 0 10px;}' +
      '.stock-detail-search input{width:100%;height:40px;box-sizing:border-box;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;padding:0 12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.82);transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.stock-detail-search input:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.stock-detail-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #F0E7E1;}' +
      '.stock-detail-pagination>span{font-size:12px;color:#6F6860;line-height:1.4;}' +
      '.stock-detail-pagination strong{font-weight:600;color:#1F1F1F;}' +
      '.stock-positive,.stock-negative{font-size:13px;font-weight:650;white-space:nowrap;}' +
      '.stock-positive{color:#246B43;}.stock-negative{color:#B42318;}' +
      '.stock-footnote{margin:0;color:#6F6860;font-size:12px;line-height:1.45;}' +
      '.stock-modal-footer{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;}' +
      '.stock-primary{height:40px;padding:0 14px;border-radius:10px;border:none;background:#B42318;color:#fff;font-size:14px;font-weight:650;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;}' +
      '.stock-secondary{height:40px;padding:0 14px;border-radius:10px;border:1px solid #EAE4DA;background:#fff;color:#1F1F1F;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.stock-adjust{display:flex;flex-direction:column;gap:14px;}' +
      '.stock-adjust-card{background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(31,31,31,.04);}' +
      '.stock-adjust-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:12px;}' +
      '.stock-adjust-head .mi{font-size:18px;color:#6F6860;line-height:1.2;flex:0 0 auto;}' +
      '.stock-adjust-head h3{margin:0;color:#1F1F1F;font-size:13px;font-weight:700;line-height:1.25;}' +
      '.stock-adjust-head p{margin:3px 0 0;color:#8A7E7C;font-size:12px;line-height:1.4;}' +
      '.stock-adjust-grid{display:grid;grid-template-columns:minmax(145px,.4fr) minmax(135px,.36fr) minmax(145px,.38fr) minmax(210px,.64fr);gap:12px;align-items:end;justify-content:start;}' +
      '.stock-adjust-grid.min-grid{grid-template-columns:minmax(145px,.4fr) minmax(135px,.36fr) minmax(135px,.36fr);justify-content:start;}' +
      '.stock-adjust-grid label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:600;color:#6F6860;letter-spacing:.02em;}' +
      '.stock-adjust-grid label.full{grid-column:1/-1;}' +
      '.stock-adjust-grid input,.stock-adjust-grid select,.stock-adjust-grid textarea{width:100%;box-sizing:border-box;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;color:#1F1F1F;font-size:14px;font-weight:400;font-family:inherit;outline:none;padding:0 12px;min-height:40px;box-shadow:inset 0 1px 0 rgba(255,255,255,.82);transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;}' +
      '.stock-adjust-grid input:focus,.stock-adjust-grid select:focus,.stock-adjust-grid textarea:focus{background:#fff;border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.stock-adjust-grid select{appearance:none;-webkit-appearance:none;-moz-appearance:none;padding-right:42px;background-image:url(data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%236F6860%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E);background-repeat:no-repeat;background-position:right 16px center;background-size:14px;}' +
      '.stock-adjust-grid textarea{min-height:74px;padding-top:10px;resize:vertical;}' +
      '.stock-adjust-grid input:disabled{color:#6F6860;background:#FAF8F4;}' +
      '.stock-adjust-preview{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #F0E7E1;border-radius:14px;background:#FFFCF8;padding:11px 12px;font-size:13px;}' +
      '.stock-adjust-preview strong{font-size:15px;}' +
      '.stock-adjust-preview span{color:#6F6860;font-size:12px;line-height:1.35;}' +
      '.stock-inventory-list{display:flex;flex-direction:column;gap:8px;max-height:58vh;overflow:auto;padding-right:2px;}' +
      '.stock-inventory-row{display:grid;grid-template-columns:minmax(0,1fr) 135px;gap:12px;align-items:center;padding:10px 12px;border:1px solid #F0E7E1;border-radius:14px;background:#FFFCF8;}' +
      '.stock-inventory-row strong{display:block;font-size:13px;color:#1F1F1F;font-weight:650;line-height:1.25;}' +
      '.stock-inventory-row span{display:block;margin-top:3px;font-size:12px;color:#6F6860;line-height:1.35;}' +
      '.stock-inventory-row input{width:100%;height:38px;border:1px solid #E8DCD7;border-radius:11px;background:#fff;color:#1F1F1F;font-size:14px;font-family:inherit;padding:0 10px;box-sizing:border-box;outline:none;transition:border-color .16s ease,box-shadow .16s ease;}' +
      '.stock-inventory-row input:focus{border-color:#D9AAA1;box-shadow:0 0 0 3px rgba(180,35,24,.08);}' +
      '.stock-quick-list{display:flex;flex-direction:column;gap:8px;margin-top:12px;}' +
      '.stock-quick-line{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #F0E7E1;border-radius:14px;background:#FFFCF8;}' +
      '.stock-quick-line strong{display:block;font-size:13px;color:#1F1F1F;font-weight:750;line-height:1.25;}' +
      '.stock-quick-line span{display:block;margin-top:3px;font-size:12px;color:#6F6860;line-height:1.35;}' +
      '@media(max-width:900px){.stock-detail-grid,.stock-regularization-summary{grid-template-columns:1fr 1fr;}.stock-adjust-grid,.stock-adjust-grid.min-grid{grid-template-columns:1fr 1fr;}}' +
      '@media(max-width:760px){.stock-page{padding:16px;}.stock-filter-grid,.stock-filter-grid.movement-grid,.stock-config-options{grid-template-columns:1fr;}.stock-table{min-width:760px;}}' +
      '@media(max-width:760px){.stock-adjust-grid{grid-template-columns:1fr 1fr;}.stock-kind-tabs{overflow:auto;flex-wrap:nowrap}.stock-kind-tabs button{white-space:nowrap;}}' +
      '@media(max-width:520px){.stock-detail-grid,.stock-regularization-summary{grid-template-columns:1fr;}.stock-detail-hero{flex-direction:column;}.stock-header h1{font-size:22px;}.stock-adjust-grid{grid-template-columns:1fr;}}' +
      '</style>';
  }

  return {
    render: render,
    _setFilter: _setFilter,
    _setStockKind: _setStockKind,
    _clearFilters: _clearFilters,
    _setItemsPageSize: _setItemsPageSize,
    _setItemsPage: _setItemsPage,
    _setMovementFilter: _setMovementFilter,
    _setMovementDirection: _setMovementDirection,
    _clearMovementFilters: _clearMovementFilters,
    _setMovementsPageSize: _setMovementsPageSize,
    _setMovementsPage: _setMovementsPage,
    _setRegularizationFilter: _setRegularizationFilter,
    _clearRegularizationFilters: _clearRegularizationFilters,
    _setRegularizationsPageSize: _setRegularizationsPageSize,
    _setRegularizationsPage: _setRegularizationsPage,
    _applyRegularization: _applyRegularization,
    _saveRegularizationMode: _saveRegularizationMode,
    _saveOutOfStockSalesMode: _saveOutOfStockSalesMode,
    _openItemDetails: _openItemDetails,
    _setDetailMovementSearch: _setDetailMovementSearch,
    _setDetailMovementPage: _setDetailMovementPage,
    _openAdjustmentModal: _openAdjustmentModal,
    _updateAdjustmentPreview: _updateAdjustmentPreview,
    _saveAdjustment: _saveAdjustment,
    _openMinimumModal: _openMinimumModal,
    _saveMinimum: _saveMinimum,
    _openInventoryModal: _openInventoryModal,
    _saveInventory: _saveInventory,
    _setView: _setView
  };
})();
