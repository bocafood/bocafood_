// js/modules/dinheiro.js
window.Modules = window.Modules || {};
Modules.Dinheiro = (function () {
  'use strict';

  var _activeSub = 'resumo';
  var _data = {};
  var _priceView = { page: 1, pageSize: 12 };
  var _priceCompositionChannel = '0';
  var _priceListFilters = { q: '', price: 'todos', status: 'todos' };
  var _menuCombinationView = { filter: 'todos', sort: 'margem-asc' };

  var TABS = [
    { key: 'resumo', label: 'Radar' },
    { key: 'precos', label: 'Composição do Preço' },
    { key: 'lista', label: 'Lista de Preço' },
    { key: 'simulador', label: 'Simulador' },
    { key: 'regras', label: 'Regras de preço' }
  ];

  function render(sub) {
    _activeSub = sub || 'resumo';
    var app = document.getElementById('app');
    app.innerHTML = '<div id="dinheiro-root" style="display:flex;flex-direction:column;height:100%;">' +
      '<div id="dinheiro-content" style="flex:1;overflow-y:auto;padding:24px;"><div class="loading-inline">Carregando...</div></div>' +
      '</div>';
    _load().then(_renderSub).catch(function (err) {
      console.error('Dinheiro load error', err);
      _content('<div style="padding:24px;background:#fff;border-radius:12px;color:#C4362A;">Erro ao carregar dados: ' + _esc(err.message || err) + '</div>');
    });
  }

  function _switchSub(key) {
    _activeSub = key;
    _renderSub();
    Router.navigate('dinheiro/' + key);
  }

  function _load() {
    return Promise.all([
      DB.getAll('products'),
      DB.getAll('fichasTecnicas'),
      DB.getAll('itens_custo'),
      DB.getAll('financeiro_saidas'),
      DB.getAll('financeiro_apagar'),
      DB.getDocRoot('config', 'geral'),
      DB.getDocRoot('config', 'dinheiro'),
      DB.getDocRoot('config', 'canais_venda'),
      DB.getDocRoot('config', 'fiscal'),
      DB.getDocRoot('config', 'tpv').catch(function () { return {}; }),
      DB.getAll('orders').catch(function () { return []; })
    ]).then(function (r) {
      _data = {
        products: r[0] || [],
        receitas: r[1] || [],
        itens: r[2] || [],
        saidas: r[3] || [],
        apagar: r[4] || [],
        geral: r[5] || {},
        dinheiro: _normalizeMoneyConfig(r[6] || {}),
        canais: _normalizeChannels(r[7] || {}, r[9] || {}),
        fiscal: _normalizeFiscalConfig(r[8] || {}),
        tpv: r[9] || {},
        orders: r[10] || []
      };
    });
  }

  function _renderSub() {
    if (_activeSub === 'resumo') return _renderResumo();
    if (_activeSub === 'precos') return _renderPrecos();
    if (_activeSub === 'lista') return _renderListaPrecos();
    if (_activeSub === 'simulador') return _renderSimulador();
    if (_activeSub === 'custos') {
      Router.navigate('financeiro/configuracoes');
      return;
    }
    if (_activeSub === 'regras') return _renderRegras();
  }

  function _normalizeMoneyConfig(c) {
    return Object.assign({
      desiredMarginPct: 60,
      minMarginPct: 40,
      defaultMarkup: 3,
      rounding: '90',
      ivaPct: 0,
      cardFeePct: 0,
      marketplaceCommissionPct: 0,
      fixedOrderFee: 0,
      estimatedTaxReservePct: 0,
      otherFeesPct: 0
    }, c || {});
  }

  function _normalizeFiscalConfig(c) {
    c = c || {};
    var normalized = Object.assign({
      ivaPadrao: 0,
      irpfPadrao: 0,
      usarCalculoFiscal: false
    }, c);
    normalized.ivaPadrao = _num(c.ivaPadrao != null && c.ivaPadrao !== '' ? c.ivaPadrao : (c.defaultIvaRate != null && c.defaultIvaRate !== '' ? c.defaultIvaRate : normalized.ivaPadrao));
    normalized.irpfPadrao = _num(c.irpfPadrao != null && c.irpfPadrao !== '' ? c.irpfPadrao : normalized.irpfPadrao);
    normalized.usarCalculoFiscal = c.usarCalculoFiscal === true;
    return normalized;
  }

  function _isTpvEnabledConfig(cfg) {
    cfg = cfg || {};
    return cfg.enabled === true || cfg.tpvEnabled === true || cfg.active === true;
  }

  function _normalizeChannels(c, tpvConfig) {
    var list = Array.isArray(c.list) ? c.list : [];
    var hasCardapio = list.some(function (ch) { return _isCardapioChannel(ch); });
    var hasTpv = list.some(function (ch) { return _isTpvChannel(ch); });
    if (!hasCardapio) list.unshift({ name: 'Cardápio', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true });
    if (_isTpvEnabledConfig(tpvConfig) && !hasTpv) list.splice(1, 0, { name: 'Venda presencial', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true });
    return list.filter(function (ch) {
      return _isTpvEnabledConfig(tpvConfig) || !_isTpvChannel(ch);
    }).map(function (ch) {
      var cardapio = _isCardapioChannel(ch);
      var tpv = _isTpvChannel(ch);
      return {
        name: cardapio ? 'Cardápio' : (tpv ? 'Venda presencial' : (ch.name || '')),
        commissionPct: (cardapio || tpv) ? 0 : _num(ch.commissionPct),
        fixedFee: (cardapio || tpv) ? 0 : _num(ch.fixedFee),
        taxPct: (cardapio || tpv) ? 0 : _num(ch.taxPct),
        minMarginPct: _num(ch.minMarginPct),
        differentPrice: !!ch.differentPrice,
        entradaCategoriaId: String(ch.entradaCategoriaId || ch.incomeCategoryId || ch.categoriaEntradaId || ch.financialCategoryId || ch.categoriaFinanceiraId || ''),
        entradaCategoriaNome: String(ch.entradaCategoriaNome || ch.incomeCategoryName || ch.categoriaEntradaNome || ch.financialCategoryName || ch.categoriaFinanceiraNome || ''),
        incomeCategoryId: String(ch.incomeCategoryId || ch.entradaCategoriaId || ch.categoriaEntradaId || ch.financialCategoryId || ch.categoriaFinanceiraId || ''),
        incomeCategoryName: String(ch.incomeCategoryName || ch.entradaCategoriaNome || ch.categoriaEntradaNome || ch.financialCategoryName || ch.categoriaFinanceiraNome || ''),
        categoriaEntradaId: String(ch.categoriaEntradaId || ch.entradaCategoriaId || ch.incomeCategoryId || ch.financialCategoryId || ch.categoriaFinanceiraId || ''),
        categoriaEntradaNome: String(ch.categoriaEntradaNome || ch.entradaCategoriaNome || ch.incomeCategoryName || ch.financialCategoryName || ch.categoriaFinanceiraNome || ''),
        financialCategoryId: String(ch.financialCategoryId || ch.entradaCategoriaId || ch.incomeCategoryId || ch.categoriaEntradaId || ch.categoriaFinanceiraId || ''),
        financialCategoryName: String(ch.financialCategoryName || ch.entradaCategoriaNome || ch.incomeCategoryName || ch.categoriaEntradaNome || ch.categoriaFinanceiraNome || ''),
        categoriaFinanceiraId: String(ch.categoriaFinanceiraId || ch.entradaCategoriaId || ch.incomeCategoryId || ch.categoriaEntradaId || ch.financialCategoryId || ''),
        categoriaFinanceiraNome: String(ch.categoriaFinanceiraNome || ch.entradaCategoriaNome || ch.incomeCategoryName || ch.categoriaEntradaNome || ch.financialCategoryName || ''),
        locked: cardapio || tpv || !!ch.locked
      };
    });
  }

  function _productsAnalysis() {
    return (_data.products || []).map(function (p) { return _analyzeProduct(p, _cardapioChannel()); });
  }

  function _productsAnalysisForChannel(channel) {
    channel = channel || _cardapioChannel();
    return (_data.products || []).map(function (p) {
      return _analyzeProduct(Object.assign({}, p, { price: _priceForChannel(p, channel) }), channel);
    });
  }

  function _defaultChannel() {
    return (_data.canais || [])[0] || { name: 'Cardápio', commissionPct: 0, fixedFee: 0, taxPct: 0, locked: true };
  }

  function _cardapioChannel() {
    return (_data.canais || []).find(function (ch) { return _isCardapioChannel(ch); }) || _defaultChannel();
  }

  function _analyzeProduct(p, channel) {
    var cost = _productCost(p);
    var price = _num(p.price || p.preco || p.salePrice);
    var fee = _feesForPrice(price, channel, p);
    var totalWithFees = cost.total + fee.total;
    var profit = price - totalWithFees;
    var margin = price > 0 ? (profit / price) * 100 : 0;
    var markup = cost.total > 0 ? price / cost.total : 0;
    var desired = _num(_data.dinheiro.desiredMarginPct || 60);
    var minMargin = _num(_data.dinheiro.minMarginPct || 40);
    var minimum = _priceForMargin(cost.total, minMargin, channel, { round: false }, p);
    var suggested = _suggestedPrice(cost.total, desired, channel, p);
    var status = _status(price, cost.total, margin, minMargin, profit, markup);
    return {
      product: p,
      channel: channel,
      ingredientCost: cost.ingredients,
      packagingCost: cost.packaging,
      indirectCost: cost.indirect,
      directCost: cost.direct,
      totalCost: cost.total,
      costDetails: cost.details || { ingredients: [], packaging: [] },
      price: price,
      fees: fee.total,
      profit: profit,
      margin: margin,
      markup: markup,
      suggestedPrice: suggested,
      minimumPrice: minimum,
      status: status,
      costSource: cost.source,
      costRange: cost.range || null
    };
  }

  function _productCost(p) {
    var indirectInfo = _indirectCostInfo();
    var direct = 0;
    var ingredients = 0;
    var packaging = 0;
    var source = 'sem dados';
    var details = { ingredients: [], packaging: [] };

    if (p.type === 'menu') {
      var menu = _menuCost(p);
      ingredients = menu.ingredients;
      packaging = menu.packaging;
      direct = menu.direct;
      source = menu.source;
      details = menu.details || details;
    } else if (_hasInternalComposition(p)) {
      var internal = _internalCompositionCost(p);
      ingredients = internal.ingredients;
      packaging = internal.packaging;
      direct = internal.direct;
      source = 'montagem interna';
      details = internal.details || details;
    } else if (p.fichaId) {
      var recipe = _byId(_data.receitas, p.fichaId);
      var rc = _recipeDirectCost(recipe);
      ingredients = rc.ingredients;
      packaging = rc.packaging;
      direct = rc.direct;
      source = recipe ? 'receita' : 'receita não encontrada';
      details = rc.details || details;
    } else if (p.sourceItemId || p.produtoProntoId) {
      var item = _byId(_data.itens, p.sourceItemId || p.produtoProntoId);
      direct = _itemCost(item);
      ingredients = direct;
      source = item ? 'produto único' : 'produto único não encontrado';
      if (direct > 0) details.ingredients.push({ label: item && item.nome || p.name || 'Produto pronto', value: direct });
    } else {
      direct = _num(p.directCost || p.cost || p.custo || 0);
      ingredients = direct;
      source = direct > 0 ? 'manual/legado' : 'sem dados';
      if (direct > 0) details.ingredients.push({ label: 'Custo manual', value: direct });
    }

    var indirect = direct * (indirectInfo.percent / 100);
    var range = null;
    if (p.type === 'menu' && menu && menu.range) {
      range = {
        minDirect: menu.range.min,
        avgDirect: menu.range.avg,
        maxDirect: menu.range.max,
        minTotal: menu.range.min + (menu.range.min * indirectInfo.percent / 100),
        avgTotal: menu.range.avg + (menu.range.avg * indirectInfo.percent / 100),
        maxTotal: menu.range.max + (menu.range.max * indirectInfo.percent / 100)
      };
    }
    return {
      ingredients: ingredients,
      packaging: packaging,
      direct: direct,
      indirect: indirect,
      total: direct + indirect,
      indirectPercent: indirectInfo.percent,
      indirectMode: indirectInfo.modeUsed,
      source: source,
      range: range,
      details: _normalizeCostDetails(details, ingredients, packaging)
    };
  }

  function _menuCost(p) {
    var direct = 0;
    var ingredients = 0;
    var packaging = 0;
    var details = { ingredients: [], packaging: [] };
    var minDirect = 0;
    var avgDirect = 0;
    var maxDirect = 0;
    var source = 'combo/menu (pior caso)';
    var groups = Array.isArray(p.menuChoiceGroups) ? p.menuChoiceGroups : [];
    if (groups.length) {
      groups.forEach(function (g) {
        var qty = parseInt(g.max || g.min || 1, 10) || 1;
        var optionCosts = (g.options || []).map(function (o) { return _refCost(o.ref); }).filter(function (c) { return c.direct > 0; });
        if (!optionCosts.length) return;
        optionCosts.sort(function (a, b) { return a.direct - b.direct; });
        var count = Math.min(qty, optionCosts.length);
        var cheapest = optionCosts.slice(0, count);
        var expensive = optionCosts.slice().reverse().slice(0, count);
        var avg = _averageMenuCost(optionCosts, count);
        cheapest.forEach(function (c) {
          minDirect += c.direct;
        });
        avgDirect += avg.direct;
        expensive.forEach(function (c) {
          direct += c.direct;
          ingredients += c.ingredients;
          packaging += c.packaging;
          _appendCostDetails(details, c.details, 1);
          maxDirect += c.direct;
        });
      });
    } else if (Array.isArray(p.menuItems)) {
      p.menuItems.forEach(function (item) {
        var qty = parseInt(item.qty || 1, 10) || 1;
        var c = _refCost(item.ref);
        direct += c.direct * qty;
        ingredients += c.ingredients * qty;
        packaging += c.packaging * qty;
        _appendCostDetails(details, c.details, qty);
        minDirect += c.direct * qty;
        avgDirect += c.direct * qty;
        maxDirect += c.direct * qty;
      });
    }
    return { direct: direct, ingredients: ingredients, packaging: packaging, details: details, source: source, range: { min: minDirect, avg: avgDirect, max: maxDirect } };
  }

  function _averageMenuCost(optionCosts, count) {
    var base = { direct: 0, ingredients: 0, packaging: 0 };
    if (!optionCosts || !optionCosts.length || !count) return base;
    var factor = count / optionCosts.length;
    optionCosts.forEach(function (c) {
      base.direct += c.direct * factor;
      base.ingredients += c.ingredients * factor;
      base.packaging += c.packaging * factor;
    });
    return base;
  }

  function _menuCombinationDiscovery(product, limit, channel) {
    limit = Math.max(1, parseInt(limit, 10) || 120);
    var groups = _menuGroupsForCombinations(product);
    if (!groups.length) return { isMenu: false, groups: [], totalCount: 0, samples: [], truncated: false, analysis: null };
    var totalCount = groups.reduce(function (total, group) {
      return total * _menuGroupCombinationCount(group);
    }, 1);
    if (!isFinite(totalCount) || totalCount < 0) totalCount = 0;
    var groupSamples = groups.map(function (group) {
      return _menuGroupSelectionSamples(group, Math.max(limit, 12));
    });
    var samples = [];
    function walk(groupIndex, selections, extraPrice) {
      if (samples.length >= limit) return;
      if (groupIndex >= groups.length) {
        var sample = {
          selections: selections.slice(),
          extraPrice: extraPrice,
          label: _menuCombinationLabel(selections)
        };
        sample.analysis = _menuCombinationMetrics(product, sample, channel || _cardapioChannel());
        samples.push(sample);
        return;
      }
      (groupSamples[groupIndex] || []).some(function (selection) {
        var nextSelections = selections.concat(selection.options.length ? [selection] : []);
        var nextExtra = extraPrice + selection.options.reduce(function (sum, option) {
          return sum + (_num(option.priceExtra) * _num(option.qty || 1));
        }, 0);
        walk(groupIndex + 1, nextSelections, nextExtra);
        return samples.length >= limit;
      });
    }
    walk(0, [], 0);
    return {
      isMenu: true,
      groups: groups,
      totalCount: totalCount,
      samples: samples,
      truncated: totalCount > samples.length,
      analysis: _menuCombinationSummary(samples)
    };
  }

  function _menuCombinationMetrics(product, combination, channel) {
    var basePrice = _priceForChannel(product, channel || _cardapioChannel());
    var extraPrice = _num(combination && combination.extraPrice);
    var soldPrice = combination && combination.priceOverride != null ? _num(combination.priceOverride) : null;
    var price = soldPrice != null ? Math.max(0, soldPrice) : Math.max(0, basePrice + extraPrice);
    var cost = _menuCombinationCost(combination);
    var indirectInfo = _indirectCostInfo();
    var indirect = cost.direct * (indirectInfo.percent / 100);
    var totalCost = cost.direct + indirect;
    var fee = _feesForPrice(price, channel, product);
    var profit = price - totalCost - fee.total;
    var margin = price > 0 ? (profit / price) * 100 : 0;
    var markup = totalCost > 0 ? price / totalCost : 0;
    var minMargin = _num(_data.dinheiro.minMarginPct || 40);
    var status = _status(price, totalCost, margin, minMargin, profit, markup);
    return {
      basePrice: basePrice,
      extraPrice: extraPrice,
      price: price,
      ingredientCost: cost.ingredients,
      packagingCost: cost.packaging,
      directCost: cost.direct,
      indirectCost: indirect,
      totalCost: totalCost,
      fees: fee.total,
      profit: profit,
      margin: margin,
      markup: markup,
      status: status,
      costDetails: _normalizeCostDetails(cost.details, cost.ingredients, cost.packaging)
    };
  }

  function _menuCombinationCost(combination) {
    var result = { direct: 0, ingredients: 0, packaging: 0, details: { ingredients: [], packaging: [] } };
    ((combination && combination.selections) || []).forEach(function (selection) {
      (selection.options || []).forEach(function (option) {
        var qty = _num(option.qty || 1) || 1;
        var c = _refCost(option.ref);
        result.direct += c.direct * qty;
        result.ingredients += c.ingredients * qty;
        result.packaging += c.packaging * qty;
        _appendCostDetails(result.details, c.details, qty);
      });
    });
    return result;
  }

  function _menuCombinationSummary(samples) {
    var withAnalysis = (samples || []).filter(function (sample) { return sample && sample.analysis; });
    var analyzed = withAnalysis.map(function (sample) { return sample.analysis; });
    if (!analyzed.length) return null;
    function avg(key) {
      return analyzed.reduce(function (sum, item) { return sum + _num(item[key]); }, 0) / analyzed.length;
    }
    var worst = withAnalysis.slice().sort(function (a, b) {
      return _num(a.analysis.margin) - _num(b.analysis.margin) || _num(a.analysis.profit) - _num(b.analysis.profit);
    })[0];
    var best = withAnalysis.slice().sort(function (a, b) {
      return _num(b.analysis.margin) - _num(a.analysis.margin) || _num(b.analysis.profit) - _num(a.analysis.profit);
    })[0];
    var highestCost = withAnalysis.slice().sort(function (a, b) {
      return _num(b.analysis.totalCost) - _num(a.analysis.totalCost);
    })[0];
    var lowestCost = withAnalysis.slice().sort(function (a, b) {
      return _num(a.analysis.totalCost) - _num(b.analysis.totalCost);
    })[0];
    return {
      count: analyzed.length,
      minCost: Math.min.apply(Math, analyzed.map(function (item) { return _num(item.totalCost); })),
      avgCost: avg('totalCost'),
      maxCost: Math.max.apply(Math, analyzed.map(function (item) { return _num(item.totalCost); })),
      avgProfit: avg('profit'),
      minMargin: Math.min.apply(Math, analyzed.map(function (item) { return _num(item.margin); })),
      avgMargin: avg('margin'),
      maxMargin: Math.max.apply(Math, analyzed.map(function (item) { return _num(item.margin); })),
      minPrice: Math.min.apply(Math, analyzed.map(function (item) { return _num(item.price); })),
      maxPrice: Math.max.apply(Math, analyzed.map(function (item) { return _num(item.price); })),
      riskCount: analyzed.filter(function (item) { return item.status === 'prejuízo' || item.status === 'margem baixa' || item.status === 'sem custo'; }).length,
      worst: worst || null,
      best: best || null,
      highestCost: highestCost || null,
      lowestCost: lowestCost || null
    };
  }

  function _menuGroupsForCombinations(product) {
    var groups = Array.isArray(product && product.menuChoiceGroups) ? product.menuChoiceGroups : [];
    return groups.map(function (group, index) {
      var rawOptions = Array.isArray(group && group.options) ? group.options
        : Array.isArray(group && group.items) ? group.items
        : Array.isArray(group && group.opcoes) ? group.opcoes
        : Array.isArray(group && group.choices) ? group.choices
        : [];
      var options = rawOptions.map(function (option, optionIndex) {
        if (!option || typeof option !== 'object') return null;
        var label = _firstText(option.name, option.label, option.title, option.value, option.ref, 'Opção ' + (optionIndex + 1));
        return {
          ref: option.ref || option.stockRef || option.stockItemRef || '',
          label: label,
          name: label,
          priceExtra: _num(option.priceExtra != null ? option.priceExtra : option.extraPrice != null ? option.extraPrice : option.price != null ? option.price : option.valorExtra),
          source: option
        };
      }).filter(Boolean);
      if (!options.length) return null;
      var max = parseInt(group.maxPerUnit || group.max || group.qty || 1, 10);
      var min = parseInt(group.minPerUnit || group.min || (group.required ? 1 : 0), 10);
      if (!isFinite(max) || max < 1) max = 1;
      if (!isFinite(min) || min < 0) min = group.required ? 1 : 0;
      if (min > max) min = max;
      return {
        id: _firstText(group.id, 'group_' + index),
        title: _firstText(group.title, group.name, 'Escolha ' + (index + 1)),
        min: min,
        max: max,
        required: group.required === true || min > 0,
        options: options
      };
    }).filter(Boolean);
  }

  function _menuGroupCombinationCount(group) {
    var n = (group.options || []).length;
    if (!n) return 0;
    var total = 0;
    for (var size = Math.max(0, group.min || 0); size <= Math.max(group.max || 1, group.min || 0); size++) {
      total += size === 0 ? 1 : _combinationWithRepetitionCount(n, size);
    }
    return total;
  }

  function _combinationWithRepetitionCount(optionsCount, size) {
    if (size <= 0) return 1;
    return _binomial(optionsCount + size - 1, size);
  }

  function _binomial(n, k) {
    n = parseInt(n, 10);
    k = parseInt(k, 10);
    if (!isFinite(n) || !isFinite(k) || k < 0 || n < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    var result = 1;
    for (var i = 1; i <= k; i++) {
      result = result * (n - k + i) / i;
      if (result > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
    }
    return Math.round(result);
  }

  function _menuGroupSelectionSamples(group, limit) {
    var out = [];
    var options = group.options || [];
    var min = Math.max(0, group.min || 0);
    var max = Math.max(min, group.max || 1);
    if (!options.length) return out;
    if (min === 0) out.push({ groupId: group.id, groupName: group.title, options: [] });
    function build(size, start, picks) {
      if (out.length >= limit) return;
      if (picks.length === size) {
        var byIndex = {};
        picks.forEach(function (idx) { byIndex[idx] = (byIndex[idx] || 0) + 1; });
        out.push({
          groupId: group.id,
          groupName: group.title,
          options: Object.keys(byIndex).map(function (idx) {
            var option = options[Number(idx)];
            return Object.assign({}, option, { qty: byIndex[idx] });
          })
        });
        return;
      }
      for (var i = start; i < options.length; i++) {
        picks.push(i);
        build(size, i, picks);
        picks.pop();
        if (out.length >= limit) return;
      }
    }
    for (var size = Math.max(1, min); size <= max; size++) {
      build(size, 0, []);
      if (out.length >= limit) break;
    }
    return out;
  }

  function _menuCombinationLabel(selections) {
    if (!selections || !selections.length) return 'Sem escolhas obrigatórias';
    return selections.map(function (selection) {
      var choices = (selection.options || []).map(function (option) {
        return option.label + (_num(option.qty) > 1 ? ' x' + option.qty : '');
      }).join(', ');
      return selection.groupName + ': ' + choices;
    }).join(' / ');
  }

  function _menuCombinationCountLabel(count) {
    count = Math.max(0, Math.round(_num(count)));
    if (count >= Number.MAX_SAFE_INTEGER) return 'muitas combinações';
    return count === 1 ? '1 combinação' : count + ' combinações';
  }

  function _hasInternalComposition(product) {
    return _internalCompositionItems(product).length > 0;
  }

  function _internalCompositionItems(product) {
    var list = Array.isArray(product && product.internalComposition)
      ? product.internalComposition
      : (Array.isArray(product && product.internalCompositionItems) ? product.internalCompositionItems : []);
    return list.filter(function (item) {
      return item && (item.ref || item.itemId || item.fichaTecnicaId || item.fichaId || item.sourceItemId || item.produtoProntoId);
    });
  }

  function _internalCompositionCost(product) {
    var result = { direct: 0, ingredients: 0, packaging: 0, details: { ingredients: [], packaging: [] } };
    _internalCompositionItems(product).forEach(function (part) {
      var qty = _num(part.quantity != null ? part.quantity : (part.qty != null ? part.qty : 1)) || 1;
      var ref = String(part.ref || '').trim();
      var pieces = ref.split(':');
      var refType = pieces[0] || '';
      var refId = pieces.slice(1).join(':');
      var stockType = String(part.stockItemType || part.itemClass || part.classe || '').toLowerCase();
      var id = part.itemId || refId || part.fichaTecnicaId || part.fichaId || part.sourceItemId || part.produtoProntoId || '';
      var line = { direct: 0, ingredients: 0, packaging: 0, details: { ingredients: [], packaging: [] } };
      if (refType === 'ficha' || stockType === 'produto_produzido' || part.fichaTecnicaId || part.fichaId) {
        line = _recipeDirectCost(_byId(_data.receitas, id));
        if (!line.direct) {
          line.direct = _num(part.unitCost);
          line.ingredients = line.direct;
          line.details = { ingredients: [{ label: part.name || part.label || 'Receita', value: line.direct }], packaging: [] };
        }
      } else {
        var item = _byId(_data.itens, id);
        var cost = _itemCost(item) || _num(part.unitCost);
        var label = part.name || part.label || item && item.nome || 'Item';
        line.direct = cost;
        if (stockType === 'embalagem' || (item && String(item.classe || item.itemClass || item.stockItemType || '').toLowerCase() === 'embalagem')) {
          line.packaging = cost;
          line.details.packaging.push({ label: label, value: cost });
        } else {
          line.ingredients = cost;
          line.details.ingredients.push({ label: label, value: cost });
        }
      }
      result.direct += line.direct * qty;
      result.ingredients += line.ingredients * qty;
      result.packaging += line.packaging * qty;
      _appendCostDetails(result.details, line.details, qty);
    });
    return result;
  }

  function _refCost(ref) {
    var parts = String(ref || '').split(':');
    var type = parts[0];
    var id = parts.slice(1).join(':');
    if (type === 'ficha' || type === 'receita') return _recipeDirectCost(_byId(_data.receitas, id));
    if (type === 'base_producao') return _recipeDirectCost(_byId(_data.receitas, id));
    if (type === 'pronto' || type === 'item' || type === 'produto_pronto' || type === 'insumo' || type === 'ingrediente' || type === 'embalagem') {
      var item = _byId(_data.itens, id);
      var direct = _itemCost(item);
      var itemClass = String(item && (item.classe || item.itemClass || item.stockItemType) || type).toLowerCase();
      var packaging = itemClass === 'embalagem';
      return {
        direct: direct,
        ingredients: packaging ? 0 : direct,
        packaging: packaging ? direct : 0,
        details: {
          ingredients: packaging || !direct ? [] : [{ label: item && item.nome || 'Produto pronto', value: direct }],
          packaging: packaging && direct ? [{ label: item && item.nome || 'Embalagem', value: direct }] : []
        }
      };
    }
    return { direct: 0, ingredients: 0, packaging: 0, details: { ingredients: [], packaging: [] } };
  }

  function _recipeDirectCost(recipe) {
    if (!recipe) return { direct: 0, ingredients: 0, packaging: 0, details: { ingredients: [], packaging: [] } };
    var ingredients = _num(recipe.ingredientCost);
    var packaging = _num(recipe.packagingCost);
    var direct = _num(recipe.directCost);
    var yieldQty = _recipeYieldQty(recipe);
    var details = _recipeCostDetails(recipe, yieldQty);
    if (!direct && (ingredients || packaging)) direct = ingredients + packaging;
    if (!direct && Array.isArray(recipe.components)) {
      details = { ingredients: [], packaging: [] };
      recipe.components.forEach(function (comp) {
        var target = String(comp.name || '').toLowerCase().indexOf('embal') >= 0 ? 'packaging' : 'ingredients';
        var compIngredient = 0;
        var compPackaging = 0;
        (comp.ingredients || []).forEach(function (ing) {
          var val = _num(ing.totalCost);
          if (!val) {
            var item = _byId(_data.itens, ing.insumoId);
            val = _itemCost(item) * _num(ing.grossQuantityCalculated || ing.qty || ing.quantity);
          }
          if (target === 'packaging') {
            packaging += val;
            compPackaging += val;
          } else {
            ingredients += val;
            compIngredient += val;
          }
        });
        if (compIngredient > 0) details.ingredients.push({ label: comp.name || 'Base de produção', value: compIngredient / yieldQty });
        if (compPackaging > 0) details.packaging.push({ label: comp.name || 'Embalagem', value: compPackaging / yieldQty });
      });
      direct = ingredients + packaging;
    }
    var baseIngredients = ingredients || direct;
    return {
      direct: direct / yieldQty,
      ingredients: baseIngredients / yieldQty,
      packaging: packaging / yieldQty,
      details: _normalizeCostDetails(details, baseIngredients / yieldQty, packaging / yieldQty)
    };
  }

  function _recipeCostDetails(recipe, yieldQty) {
    var details = { ingredients: [], packaging: [] };
    var breakdown = Array.isArray(recipe.componentCostBreakdown) ? recipe.componentCostBreakdown : [];
    breakdown.forEach(function (item) {
      var label = item.name || 'Base de produção';
      var ingredient = _num(item.ingredientCost != null ? item.ingredientCost : item.appliedCost);
      var pack = _num(item.packagingCost);
      if (ingredient > 0) details.ingredients.push({ label: label, value: ingredient / yieldQty });
      if (pack > 0) details.packaging.push({ label: label, value: pack / yieldQty });
    });
    (recipe.packagingItems || recipe.packaging || recipe.embalagens || []).forEach(function (item) {
      var value = _num(item.totalCost || item.rawTotalCost);
      if (!value) {
        var ins = _byId(_data.itens, item.insumoId || item.itemId || item.packagingId || '');
        value = _itemCost(ins) * _num(item.grossQuantityCalculated || item.qty || item.quantity || 0);
      }
      if (value > 0) details.packaging.push({ label: item.supplyName || item.name || 'Embalagem', value: value / yieldQty });
    });
    if (!breakdown.length) {
      (recipe.directIngredients || recipe.looseIngredients || []).forEach(function (item) {
        var value = _num(item.totalCost || item.rawTotalCost);
        if (!value) {
          var ins = _byId(_data.itens, item.insumoId || item.itemId || '');
          value = _itemCost(ins) * _num(item.grossQuantityCalculated || item.qty || item.quantity || 0);
        }
        if (value > 0) details.ingredients.push({ label: item.supplyName || item.name || 'Ingrediente avulso', value: value / yieldQty });
      });
    }
    return details;
  }

  function _appendCostDetails(target, source, factor) {
    target = target || { ingredients: [], packaging: [] };
    source = source || { ingredients: [], packaging: [] };
    factor = _num(factor || 1) || 1;
    ['ingredients', 'packaging'].forEach(function (key) {
      (source[key] || []).forEach(function (item) {
        var value = _num(item.value) * factor;
        if (value > 0) target[key].push({ label: item.label || 'Item', value: value });
      });
    });
    return target;
  }

  function _normalizeCostDetails(details, ingredientTotal, packagingTotal) {
    details = details || { ingredients: [], packaging: [] };
    var normalized = { ingredients: [], packaging: [] };
    ['ingredients', 'packaging'].forEach(function (key) {
      var total = key === 'ingredients' ? _num(ingredientTotal) : _num(packagingTotal);
      var list = (details[key] || []).filter(function (item) { return _num(item.value) > 0; });
      var grouped = {};
      list.forEach(function (item) {
        var label = item.label || (key === 'ingredients' ? 'Custo base' : 'Embalagem');
        grouped[label] = (grouped[label] || 0) + _num(item.value);
      });
      normalized[key] = Object.keys(grouped).map(function (label) {
        return { label: label, value: grouped[label] };
      }).filter(function (item) { return item.value > 0; });
      var sum = normalized[key].reduce(function (s, item) { return s + _num(item.value); }, 0);
      var diff = total - sum;
      if (diff > 0.005) {
        normalized[key].push({ label: key === 'ingredients' ? 'Outros custos base' : 'Outras embalagens', value: diff });
      }
    });
    return normalized;
  }

  function _recipeYieldQty(recipe) {
    var qty = _num(recipe.yieldQuantity || recipe.rendimento || recipe.yield || recipe.portions || recipe.porcoes);
    return qty > 0 ? qty : 1;
  }

  function _itemCost(item) {
    if (!item) return 0;
    return _num(item.custo_atual || item.custoAtual || item.preco_compra || item.purchasePrice || item.cost || 0);
  }

  function _indirectCostInfo() {
    var manualValue = _data.geral.indirectCostPercent != null ? _data.geral.indirectCostPercent : _data.geral.percentualCustosIndiretos;
    var manual = _num(manualValue != null ? manualValue : 0);
    var mode = _data.geral.indirectCostMode || _data.geral.custosIndiretosModo || 'manual';
    if (mode !== 'automatico') return { modeUsed: 'Manual', percent: manual, fallback: false };
    var months = parseInt(_data.geral.indirectCostMonths || _data.geral.custosIndiretosMeses, 10) || 6;
    if ([3, 6, 12].indexOf(months) < 0) months = 6;
    var start = new Date();
    start.setMonth(start.getMonth() - months);
    start.setHours(0, 0, 0, 0);
    var direct = 0;
    var indirect = 0;
    (_data.saidas || []).concat(_data.apagar || []).forEach(function (item) {
      var rawDate = item.date || item.dueDate || item.paidAt || item.createdAt || '';
      if (!rawDate) return;
      var d = new Date(rawDate);
      if (isNaN(d.getTime()) || d < start) return;
      var value = _num(item.valor || item.amount || item.total);
      var cls = item.costClass || (item.tipoSaida === 'Custo Produção' ? 'direto' : 'despesa');
      if (cls === 'direto') direct += value;
      if (cls === 'indireto') indirect += value;
    });
    if (direct <= 0 || indirect <= 0) return { modeUsed: 'Manual', percent: manual, fallback: true, months: months };
    return { modeUsed: 'Automático', percent: (indirect / direct) * 100, fallback: false, months: months };
  }

  function _feesForPrice(price, channel, product) {
    var items = _feeBreakdown(price, channel, product);
    var total = items.reduce(function (sum, item) { return sum + item.value; }, 0);
    var fixed = _fixedFeeForChannel(channel);
    return { pct: price > 0 ? (total - fixed) / price * 100 : 0, fixed: fixed, total: total, items: items };
  }

  function _fiscalEnabled() {
    return _data.fiscal && _data.fiscal.usarCalculoFiscal === true;
  }

  function _fiscalIvaPct(product) {
    if (!_fiscalEnabled()) return 0;
    var fiscal = product && product.fiscal && typeof product.fiscal === 'object' ? product.fiscal : {};
    var productRate = fiscal.ivaRate != null ? fiscal.ivaRate : product && product.ivaRate;
    return productRate != null && productRate !== '' ? _num(productRate) : _num(_data.fiscal.ivaPadrao);
  }

  function _fiscalIrpfPct() {
    return _fiscalEnabled() ? _num(_data.fiscal.irpfPadrao) : 0;
  }

  function _feeParts(channel, product) {
    channel = channel || {};
    var commissionPct = _num(channel.commissionPct);
    var channelTaxPct = _num(channel.taxPct);
    var pct = commissionPct;
    if (commissionPct > 0) pct += commissionPct * channelTaxPct / 100;
    else pct += channelTaxPct;
    if (_fiscalEnabled()) pct += _fiscalIvaPct(product);
    if (_isOwnChannel(channel)) {
      pct += _num(_data.dinheiro.cardFeePct) + _num(_data.dinheiro.estimatedTaxReservePct) + _num(_data.dinheiro.otherFeesPct);
    }
    return { pct: pct, fixed: _fixedFeeForChannel(channel) };
  }

  function _feeBreakdown(price, channel, product) {
    channel = channel || {};
    var list = [];
    var commissionPct = _num(channel.commissionPct);
    var channelTaxPct = _num(channel.taxPct);
    var commission = price * commissionPct / 100;
    if (commission > 0) {
      list.push({ label: 'Comissão ' + (channel.name || 'marketplace'), value: commission, color: '#7C3AED', percentBase: price });
      if (channelTaxPct > 0) list.push({ label: 'Imposto sobre comissão', value: commission * channelTaxPct / 100, color: '#A855F7', percentBase: price });
    } else if (channelTaxPct > 0) {
      list.push({ label: 'Imposto do canal', value: price * channelTaxPct / 100, color: '#A855F7', percentBase: price });
    }
    if (_fiscalEnabled()) _pushFee(list, 'IVA aplicado', price * _fiscalIvaPct(product) / 100, '#0EA5E9', price);
    if (_isOwnChannel(channel)) {
      _pushFee(list, 'Taxa de cartão', price * _num(_data.dinheiro.cardFeePct) / 100, '#2563EB', price);
      _pushFee(list, 'Reserva impostos', price * _num(_data.dinheiro.estimatedTaxReservePct) / 100, '#0891B2', price);
      _pushFee(list, 'Outras taxas', price * _num(_data.dinheiro.otherFeesPct) / 100, '#64748B', price);
    }
    _pushFee(list, 'Taxa fixa', _fixedFeeForChannel(channel), '#F97316', price);
    return list;
  }

  function _fixedFeeForChannel(channel) {
    channel = channel || {};
    if (_isOwnChannel(channel)) {
      return _num(channel.fixedFee || _data.dinheiro.fixedOrderFee || 0);
    }
    return _num(channel.fixedFee);
  }

  function _isCardapioChannel(channel) {
    var name = String((channel || {}).name || '').toLowerCase().replace(/[áàãâ]/g, 'a');
    return name === 'cardapio' || name === 'catalogo';
  }

  function _isTpvChannel(channel) {
    var name = String((channel || {}).name || '').toLowerCase().trim();
    return name === 'tpv' || name === 'venda presencial';
  }

  function _isOwnChannel(channel) {
    var name = String((channel || {}).name || '').toLowerCase();
    return !name || name === 'loja própria' || name === 'loja propria' || _isCardapioChannel(channel) || _isTpvChannel(channel);
  }

  function _pushFee(list, label, value, color, percentBase) {
    if (value > 0) list.push({ label: label, value: value, color: color, percentBase: percentBase });
  }

  function _priceForMargin(cost, marginPct, channel, opts, product) {
    if (cost <= 0) return 0;
    opts = opts || {};
    var parts = _feeParts(channel, product);
    var pctFees = parts.pct / 100;
    var fixed = parts.fixed;
    var target = _num(marginPct) / 100;
    var divisor = 1 - target - pctFees;
    var raw = divisor > 0 ? (cost + fixed) / divisor : cost * (_num(_data.dinheiro.defaultMarkup || 3));
    if (opts.round === false) return Math.ceil(raw * 100) / 100;
    return _roundPrice(raw);
  }

  function _suggestedPrice(cost, marginPct, channel, product) {
    if (cost <= 0) return 0;
    var markup = Math.max(_num(_data.dinheiro.defaultMarkup || 3), 0);
    var byMarkup = _roundPrice(cost * (markup || 1));
    var byMargin = _priceForMargin(cost, marginPct, channel, {}, product);
    return Math.max(byMarkup, byMargin);
  }

  function _roundPrice(value) {
    var mode = _data.dinheiro.rounding || '90';
    var n = Math.max(0, _num(value));
    if (n <= 0) return 0;
    if (mode === 'cheio') return Math.ceil(n);
    var cents = mode === '95' ? 0.95 : 0.90;
    var base = Math.floor(n);
    var rounded = base + cents;
    if (rounded < n) rounded = base + 1 + cents;
    return Math.round(rounded * 100) / 100;
  }

  function _status(price, cost, margin, minMargin, profit, markup) {
    if (!cost) return 'sem custo';
    if (!price) return 'sem preço';
    if (profit < 0) return 'prejuízo';
    if (margin < minMargin) return 'margem baixa';
    var defaultMarkup = _num(_data.dinheiro.defaultMarkup || 0);
    if (defaultMarkup > 0 && markup > 0 && markup < defaultMarkup) return 'atenção';
    if (margin < minMargin + 10) return 'atenção';
    return 'saudável';
  }

  function _renderResumo() {
    var rows = _productsAnalysis();
    var channelRows = _channelPriorityRows();
    var low = channelRows.filter(function (r) { return r.status === 'margem baixa'; });
    var loss = channelRows.filter(function (r) { return r.status === 'prejuízo'; });
    var attention = channelRows.filter(function (r) { return r.status === 'atenção'; });
    var noCost = channelRows.filter(function (r) { return !r.totalCost; });
    var noPrice = channelRows.filter(function (r) { return !r.price; });
    var validRows = channelRows.filter(function (r) { return r.totalCost > 0 && r.price > 0; });
    var avgProfit = validRows.length ? validRows.reduce(function (s, r) { return s + (r.profit || 0); }, 0) / validRows.length : null;
    var channels = _channelDiagnostics(rows);
    var configuredChannels = _data.canais || [_defaultChannel()];
    var channelCount = Math.max(1, configuredChannels.length || 1);
    var worstChannel = channels.slice().sort(function (a, b) { return b.impactPct - a.impactPct || b.fixedFee - a.fixedFee; })[0];
    var worstChannelLabel = worstChannel && (worstChannel.impactPct > 0 || worstChannel.fixedFee > 0)
      ? 'Maior peso agora: ' + worstChannel.name + ', com cerca de ' + worstChannel.impactPct.toFixed(1).replace('.', ',') + '% sobre a venda' + (worstChannel.fixedFee > 0 ? ' e ' + UI.fmt(worstChannel.fixedFee) + ' por pedido' : '') + '.'
      : '';
    var priorities = _financialPriorities(channelRows);
    var riskRows = loss.concat(low, noCost, noPrice);
    var riskCount = _uniqueProductCount(riskRows);
    var lowCount = _uniqueProductCount(low.concat(loss));
    var attentionCount = _uniqueProductCount(attention);
    var noCostCount = _uniqueProductCount(noCost);
    var healthyCount = _healthyProductCountByChannel(channelRows, channelCount);
    var riskNote = riskCount ? _channelOccurrenceLabel(riskRows) : 'nenhum produto crítico agora';
    var lowMarginNote = lowCount
      ? _channelOccurrenceLabel(low.concat(loss))
      : (attentionCount ? attentionCount + ' perto do limite' : 'nenhum abaixo da mínima');
    var kpis = [
      _radarKpi('Produtos analisados', rows.length, channelCount + ' canais na leitura', 'neutral', 'inventory_2'),
      _radarKpi('Risco crítico', riskCount, riskNote, riskCount ? 'danger' : 'success', 'warning'),
      _radarKpi('Margem baixa', lowCount, lowMarginNote, lowCount ? 'danger' : (attentionCount ? 'warning' : 'success'), 'trending_down'),
      _radarKpi('Sem custo', noCostCount, noCostCount ? _channelOccurrenceLabel(noCost) : 'custos preenchidos', noCostCount ? 'warning' : 'success', 'link_off'),
      _radarKpi('Saudáveis', healthyCount, 'bem nos canais ativos', healthyCount ? 'success' : 'neutral', 'check_circle'),
      _radarKpi('Lucro médio', avgProfit == null ? 'sem dados' : UI.fmt(avgProfit), validRows.length + ' leituras com custo e preço', avgProfit == null ? 'neutral' : (avgProfit < 0 ? 'danger' : 'success'), 'query_stats')
    ].join('');
    var priorityHtml = _channelPrioritySummary(channelRows);
    var channelImpact = channels.map(function (c) {
      var tone = c.status === 'margem baixa' ? '#B42318' : (c.status === 'atenção' || c.status === 'maior custo' ? '#D97706' : (c.status === 'melhor margem' || c.status === 'saudável' ? '#1F6F43' : '#6F6860'));
      return '<div style="' + _radarInnerCardStyle('padding:11px 12px;display:flex;flex-direction:column;gap:9px;') + '">' +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:13.5px;font-weight:700;color:#1F1F1F;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(c.name) + '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;">' +
              _channelStatusBadge(c.status) +
              '<span style="font-size:11px;color:#6F6860;font-weight:650;">Margem ' + (c.avgMargin == null ? 'sem dados' : c.avgMargin.toFixed(1).replace('.', ',') + '%') + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;min-width:64px;">' +
            '<div style="font-size:10px;color:#6F6860;font-weight:750;letter-spacing:.04em;text-transform:uppercase;line-height:1;">Impacto</div>' +
            '<div style="color:' + tone + ';font-size:18px;font-weight:760;line-height:1;margin-top:5px;">' + c.impactPct.toFixed(1).replace('.', ',') + '%</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          _radarCompactMetric('Comissão', c.commissionPct.toFixed(1).replace('.', ',') + '%') +
          _radarCompactMetric('Imposto', c.commissionTaxPct.toFixed(1).replace('.', ',') + '%') +
          _radarCompactMetric('Taxa fixa', UI.fmt(c.fixedFee)) +
        '</div>' +
      '</div>';
    }).join('');
    _content('<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.2;margin:0 0 6px;color:#1F1F1F;">Radar</h2>' +
          '<p style="font-size:13px;font-weight:400;color:#6F6860;line-height:1.45;max-width:760px;margin:0;">Um resumo para decidir quais custos, preços e canais precisam de atenção primeiro.</p>' +
        '</div>' +
      '</div>' +
      '<div class="growth-grid" style="margin-bottom:0;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">' + kpis + '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(340px,.95fr) minmax(360px,1.05fr);gap:14px;margin-bottom:0;align-items:start;">' +
      '<section style="' + _priorityFinanceCardStyle() + '">' + _sectionTitle('Por onde começar', 'Prioridades separadas por canal para revisar sem abrir todos os produtos.', 'priority_high') + (priorityHtml || '<div style="color:#1F6F43;font-size:14px;font-weight:600;">Nenhuma revisão urgente com os dados atuais.</div>') + '</section>' +
      '<section style="' + _radarPatternCardStyle() + '">' + _radarSectionTitle('Canais de venda', 'Compare onde a venda fica mais pesada para a margem.', 'toll') + (worstChannelLabel ? _radarChannelHighlight(worstChannelLabel) : '') + (channelImpact ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;align-items:stretch;">' + channelImpact + '</div>' : _radarEmptyBox('Quando você configurar taxas dos canais de venda, o impacto na margem aparece aqui.')) + '</section>' +
      '</div>' +
      '<section style="' + _radarPatternCardStyle() + '">' + _radarSectionTitle('Produtos para revisar primeiro', 'Abra só os produtos com maior chance de afetar lucro, preço ou custo.', 'manage_search') + _priorityProducts(priorities) + '</section>' +
      '</div>');
  }

  function _prioritySummary(count, label, action, filter, note) {
    if (!count) return '';
    var color = filter === 'sem-custo' || filter === 'sem-preco' ? '#D97706' : '#B42318';
    var bg = filter === 'sem-custo' || filter === 'sem-preco' ? '#FFF7ED' : '#FFF0EE';
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:14px;background:' + bg + ';border:1px solid #EAE4DA;margin-bottom:10px;box-shadow:0 1px 2px rgba(31,31,31,.03);transition:transform .16s ease,box-shadow .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 1px 2px rgba(31,31,31,.03)\'">' +
      '<div><strong style="font-size:20px;font-weight:700;color:' + color + ';">' + count + '</strong><span style="font-size:14px;font-weight:600;color:#1F1F1F;"> ' + _esc(label) + '</span>' + (note ? '<div style="font-size:12px;color:#6F6860;margin-top:3px;">' + _esc(note) + '</div>' : '') + '</div>' +
      '<button onclick="Modules.Dinheiro._goPriceFilter(\'' + filter + '\')" style="height:34px;padding:0 12px;background:#fff;color:' + color + ';border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">' + _esc(action) + '</button>' +
      '</div>';
  }

  function _channelPriorityRows() {
    var channels = _data.canais || [_defaultChannel()];
    if (!channels.length) channels = [_defaultChannel()];
    var rows = [];
    channels.forEach(function (ch, idx) {
      _productsAnalysisForChannel(ch).forEach(function (r) {
        rows.push(Object.assign({}, r, {
          priorityChannel: ch,
          priorityChannelIndex: idx,
          priorityChannelName: ch.name || ('Canal ' + (idx + 1))
        }));
      });
    });
    return rows;
  }

  function _productKeyFromRow(row) {
    var product = row && row.product || {};
    return String(product.id || product.ref || product.name || '');
  }

  function _uniqueProductCount(rows) {
    var seen = {};
    (rows || []).forEach(function (row) {
      var key = _productKeyFromRow(row);
      if (key) seen[key] = true;
    });
    return Object.keys(seen).length;
  }

  function _channelOccurrenceLabel(rows) {
    var products = {};
    var channels = {};
    (rows || []).forEach(function (row) {
      var productKey = _productKeyFromRow(row);
      if (productKey) products[productKey] = true;
      var channelKey = row && row.priorityChannelName || row && row.channel && row.channel.name || '';
      if (channelKey) channels[channelKey] = true;
    });
    var productCount = Object.keys(products).length;
    var channelCount = Object.keys(channels).length;
    if (!productCount) return 'nenhum caso agora';
    return productCount + ' produto' + (productCount === 1 ? '' : 's') + ' em ' + channelCount + ' canal' + (channelCount === 1 ? '' : 'is');
  }

  function _healthyProductCountByChannel(rows, channelCount) {
    var grouped = {};
    (rows || []).forEach(function (row) {
      var key = _productKeyFromRow(row);
      if (!key) return;
      if (!grouped[key]) grouped[key] = { total: 0, healthy: 0 };
      grouped[key].total += 1;
      if (row.status === 'saudável') grouped[key].healthy += 1;
    });
    return Object.keys(grouped).filter(function (key) {
      var item = grouped[key];
      return item.total >= channelCount && item.healthy === item.total;
    }).length;
  }

  function _channelPrioritySummary(rows) {
    var grouped = {};
    (rows || []).forEach(function (r) {
      var key = String(r.priorityChannelIndex != null ? r.priorityChannelIndex : 0);
      if (!grouped[key]) grouped[key] = {
        channelIndex: r.priorityChannelIndex || 0,
        channelName: r.priorityChannelName || 'Canal',
        noCost: 0,
        noPrice: 0,
        low: 0,
        belowSuggested: 0
      };
      if (!r.totalCost) grouped[key].noCost += 1;
      if (!r.price) grouped[key].noPrice += 1;
      if (r.status === 'margem baixa' || r.status === 'prejuízo') grouped[key].low += 1;
      if (_isBelowSuggestedActionable(r)) grouped[key].belowSuggested += 1;
    });
    var items = Object.keys(grouped).map(function (key) { return grouped[key]; }).map(function (item) {
      var score = item.low * 4 + item.noCost * 3 + item.noPrice * 2 + item.belowSuggested;
      item.score = score;
      return item;
    }).filter(function (item) { return item.score > 0; }).sort(function (a, b) {
      return b.score - a.score || a.channelName.localeCompare(b.channelName);
    });
    if (!items.length) return '';
    return '<div style="display:flex;flex-direction:column;gap:8px;">' + items.slice(0, 6).map(function (item) {
      var mainFilter = item.low ? 'margem-baixa' : (item.noCost ? 'sem-custo' : (item.noPrice ? 'sem-preco' : 'abaixo-recomendado'));
      var mainAction = item.low ? 'Revisar margem' : (item.noCost ? 'Completar custo' : (item.noPrice ? 'Ver preço' : 'Ajustar preço'));
      var color = item.low ? '#B42318' : '#D97706';
      var bg = item.low ? '#FFF0EE' : '#FFF7ED';
      return '<div style="padding:10px 11px;border-radius:14px;background:' + bg + ';border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<div style="min-width:0;">' +
            '<div style="font-size:10px;color:#6F6860;font-weight:750;letter-spacing:.04em;text-transform:uppercase;margin-bottom:3px;">Canal de venda</div>' +
            '<strong style="display:block;font-size:14px;font-weight:700;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(item.channelName) + '</strong>' +
          '</div>' +
          '<button onclick="Modules.Dinheiro._goPriceFilter(\'' + mainFilter + '\',' + item.channelIndex + ')" style="height:32px;padding:0 11px;background:#fff;color:' + color + ';border:1px solid #EAE4DA;border-radius:10px;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);white-space:nowrap;">' + _esc(mainAction) + '</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px;">' +
          _priorityChannelChip('Margem baixa', item.low, item.low ? '#B42318' : '#1F6F43') +
          _priorityChannelChip('Sem custo', item.noCost, item.noCost ? '#D97706' : '#1F6F43') +
          _priorityChannelChip('Sem preço', item.noPrice, item.noPrice ? '#D97706' : '#1F6F43') +
          _priorityChannelChip('Abaixo sugerido', item.belowSuggested, item.belowSuggested ? '#B42318' : '#1F6F43') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function _priorityChannelChip(label, value, color) {
    return '<span style="display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:4px 7px;border-radius:999px;background:#fff;border:1px solid #EAE4DA;font-size:11px;color:#6F6860;font-weight:650;line-height:1;white-space:nowrap;">' +
      '<span>' + _esc(label) + '</span>' +
      '<strong style="color:' + color + ';font-weight:800;">' + value + '</strong>' +
    '</span>';
  }

  function _channelDiagnostics(rows) {
    var channels = _summaryChannels();
    var validRows = rows.filter(function (r) { return r.totalCost > 0 && r.price > 0; });
    var data = channels.map(function (ch) {
      var commissionPct = _num(ch.commissionPct);
      var commissionTaxPct = commissionPct > 0 ? commissionPct * _num(ch.taxPct) / 100 : _num(ch.taxPct);
      var fixedFee = _num(ch.fixedFee);
      var impactPct = commissionPct + commissionTaxPct;
      var metrics = validRows.map(function (r) { return _analyzeProduct(r.product, ch); });
      var avgMargin = metrics.length ? metrics.reduce(function (s, r) { return s + r.margin; }, 0) / metrics.length : null;
      return { name: ch.name, channel: ch, impactPct: impactPct, commissionPct: commissionPct, commissionTaxPct: commissionTaxPct, fixedFee: fixedFee, avgMargin: avgMargin, status: 'saudável' };
    }).filter(function (c) { return c.impactPct > 0 || c.fixedFee > 0; });
    var best = data.filter(function (c) { return c.avgMargin != null; }).sort(function (a, b) { return b.avgMargin - a.avgMargin; })[0];
    var mostExpensive = data.slice().sort(function (a, b) { return b.impactPct - a.impactPct || b.fixedFee - a.fixedFee; })[0];
    data.forEach(function (c) {
      if (mostExpensive && c.name === mostExpensive.name && (c.impactPct > 0 || c.fixedFee > 0)) c.status = 'maior custo';
      else if (best && c.name === best.name) c.status = 'melhor margem';
      else if (c.avgMargin == null) c.status = 'sem dados';
      else if (c.avgMargin < _num(_data.dinheiro.minMarginPct || 40)) c.status = 'margem baixa';
      else if (c.avgMargin < _num(_data.dinheiro.minMarginPct || 40) + 10) c.status = 'atenção';
      else c.status = 'saudável';
    });
    return data;
  }

  function _summaryChannels() {
    return (_data.canais || []).filter(function (ch) { return ch && ch.name; });
  }

  function _channelStatusBadge(status) {
    var colors = {
      'melhor margem': ['#EDFAF3', '#1A9E5A'],
      'maior custo': ['#FFF7ED', '#D97706'],
      'saudável': ['#EDFAF3', '#1A9E5A'],
      'atenção': ['#FFF7ED', '#D97706'],
      'margem baixa': ['#FFF0EE', '#C4362A'],
      'sem dados': ['#F2EDED', '#8A7E7C']
    }[status] || ['#F2EDED', '#8A7E7C'];
    return '<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:' + colors[0] + ';color:' + colors[1] + ';font-size:11px;font-weight:900;">' + _esc(status) + '</span>';
  }

  function _financialPriorities(rows) {
    var valid = rows.filter(function (r) { return r.totalCost > 0 && r.price > 0; });
    var lowestMargin = valid.slice().sort(function (a, b) { return a.margin - b.margin; })[0];
    var noCost = rows.filter(function (r) { return !r.totalCost && r.price > 0; }).sort(function (a, b) { return b.price - a.price; })[0] || rows.filter(function (r) { return !r.totalCost; })[0];
    var belowSuggested = valid.filter(_isBelowSuggestedActionable).sort(function (a, b) { return (b.suggestedPrice - b.price) - (a.suggestedPrice - a.price); })[0];
    var highFeeProduct = valid.slice().sort(function (a, b) { return b.fees - a.fees; })[0];
    return [
      lowestMargin ? { label: 'Menor margem', row: lowestMargin, action: 'Ver composição', filter: 'margem-baixa' } : null,
      noCost ? { label: 'Sem custo mais relevante', row: noCost, action: 'Ver composição', filter: 'sem-custo' } : null,
      belowSuggested ? { label: 'Preço abaixo do recomendado', row: belowSuggested, action: 'Ver composição', filter: 'abaixo-recomendado' } : null,
      highFeeProduct && highFeeProduct.fees > 0 ? { label: 'Maior impacto de comissão', row: highFeeProduct, action: 'Ver composição', filter: 'todos' } : null
    ].filter(Boolean);
  }

  function _priorityProducts(items) {
    if (!items.length) return _radarEmptyBox('Nenhuma revisão urgente com os dados atuais.');
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;">' + items.map(function (item) {
      var r = item.row;
      var img = _productImage(r.product);
      var tone = !r.totalCost ? '#D97706' : (r.margin < 0 ? '#B42318' : (r.margin < _num(_data.dinheiro.minMarginPct || 40) ? '#B42318' : '#6F6860'));
      var channelName = r.priorityChannelName || (r.channel && r.channel.name) || 'Canal';
      var channelIndex = r.priorityChannelIndex != null ? r.priorityChannelIndex : 0;
      var productId = r.product && r.product.id || '';
      return '<div style="' + _radarInnerCardStyle('display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;align-items:center;') + '" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.085)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 10px 24px rgba(31,31,31,.045)\'">' +
        '<div style="width:52px;height:52px;border-radius:15px;background:#FFFCF8;border:1px solid #E8DCD7;overflow:hidden;display:flex;align-items:center;justify-content:center;">' + (img ? '<img src="' + _esc(img) + '" style="width:100%;height:100%;object-fit:cover;">' : '<span class="mi" style="font-size:19px;color:#C9BCB8;">restaurant_menu</span>') + '</div>' +
        '<div style="min-width:0;">' +
          '<div style="font-size:10.5px;color:#6F6860;font-weight:650;letter-spacing:.04em;text-transform:uppercase;margin-bottom:3px;">' + _esc(item.label) + '</div>' +
          '<strong style="display:block;font-size:14.5px;font-weight:650;line-height:1.25;color:#1F1F1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(r.product.name || 'Produto') + '</strong>' +
          '<div style="font-size:11.5px;color:#6F6860;font-weight:650;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(channelName) + '</div>' +
          '<div style="font-size:12px;color:' + tone + ';font-weight:650;margin-top:4px;">' + (r.totalCost ? 'Margem ' + r.margin.toFixed(1).replace('.', ',') + '%' : 'sem custo definido') + '</div>' +
          '<button data-product-id="' + _esc(productId) + '" data-channel-index="' + channelIndex + '" onclick="Modules.Dinheiro._openProductModal(this.dataset.productId,this.dataset.channelIndex)" style="margin-top:9px;height:32px;padding:0 12px;background:#B42318;color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 7px 16px rgba(180,35,24,.14);">' + _esc(item.action) + '</button>' +
        '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function _goPriceFilter(filter, channelIndex) {
    var next = filter || 'todos';
    try {
      if (next === 'todos') sessionStorage.removeItem('dinheiro_price_filter');
      else sessionStorage.setItem('dinheiro_price_filter', next);
    } catch (e) {}
    if (channelIndex != null && channelIndex !== '') {
      _priceCompositionChannel = String(channelIndex);
    }
    _priceView.page = 1;
    if (_activeSub === 'precos') {
      _renderPrecos();
      return;
    }
    Router.navigate('dinheiro/precos');
  }

  function _renderPrecos() {
    var channels = _data.canais || [_defaultChannel()];
    var selectedChannel = String(_priceCompositionChannel || '0');
    var channelIndex = parseInt(selectedChannel, 10) || 0;
    if (!channels[channelIndex]) channelIndex = 0;
    _priceCompositionChannel = String(channelIndex);
    var selectedChannelObj = channels[channelIndex] || _defaultChannel();
    var channelOptions = channels.map(function (ch, idx) {
      return '<option value="' + idx + '"' + (idx === channelIndex ? ' selected' : '') + '>' + _esc(ch.name || ('Canal ' + (idx + 1))) + '</option>';
    }).join('');
    var rows = _productsAnalysisForChannel(selectedChannelObj);
    var filter = _pendingPriceFilter();
    var filteredRows = _applyPriceFilter(rows, filter);
    var paging = _pricePaging(filteredRows);
    var fieldStyle = _listingFieldStyle();
    var filterSelectStyle = _listingSelectStyle('height:42px;');
    var selectStyle = _listingSelectStyle('min-width:110px;max-width:110px;height:34px;font-size:12px;color:#6F6860;');
    var appliedFilter = filter && filter !== 'todos';
    var hasFilters = appliedFilter || channelIndex !== 0;
    var pageSizeOptions = [10, 12, 24, 48].map(function (n) { return '<option value="' + n + '"' + (Number(_priceView.pageSize) === n ? ' selected' : '') + '>' + n + ' / pág.</option>'; }).join('');
    var paginationHtml = paging.total ? '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px 18px;">' +
      '<span style="font-size:12px;color:#6F6860;line-height:1.4;">Mostrando <strong style="color:#1F1F1F;font-weight:600;">' + paging.start + '</strong> a <strong style="color:#1F1F1F;font-weight:600;">' + paging.end + '</strong> de <strong style="color:#1F1F1F;font-weight:600;">' + paging.total + '</strong></span>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
        '<select onchange="Modules.Dinheiro._setPricePageSize(this.value)" style="' + selectStyle + '">' + pageSizeOptions + '</select>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" onclick="Modules.Dinheiro._setPricePage(' + (paging.page - 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page > 1 ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page > 1 ? '1' : '.45') + ';"' + (paging.page > 1 ? '' : ' disabled') + '>Anterior</button>' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:12px;color:#A39B90;">' + paging.page + '</span><span style="width:14px;height:2px;border-radius:999px;background:#B42318;display:inline-block;opacity:.65"></span><span style="font-size:12px;color:#A39B90;">' + paging.totalPages + '</span></div>' +
          '<button type="button" onclick="Modules.Dinheiro._setPricePage(' + (paging.page + 1) + ')" style="height:34px;padding:0 11px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;cursor:' + (paging.page < paging.totalPages ? 'pointer' : 'not-allowed') + ';opacity:' + (paging.page < paging.totalPages ? '1' : '.45') + ';"' + (paging.page < paging.totalPages ? '' : ' disabled') + '>Próxima</button>' +
        '</div>' +
      '</div>' +
    '</div>' : '';
    var filterNotice = hasFilters ? '<div style="display:flex;align-items:center;gap:8px;color:#8A4A18;font-size:12.5px;line-height:1.4;margin-top:10px;"><span class="mi" style="font-size:16px;color:#D97706;">filter_alt</span><span>' + (appliedFilter ? 'Mostrando ' + _esc(_filterLabel(filter)) + ' em ' + _esc(selectedChannelObj.name || 'Canal') + '.' : 'Mostrando preços de ' + _esc(selectedChannelObj.name || 'Canal') + '.') + '</span></div>' : '';
    _content('<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;color:#1F1F1F;margin:0 0 6px;line-height:1.2;">Composição do Preço</h2>' +
          '<p style="font-size:13px;color:#6F6860;line-height:1.45;margin:0;max-width:760px;">Veja quanto cada produto custa, quanto sobra na venda e quais preços pedem revisão.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Dinheiro._switchSub(\'resumo\')" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Ver Radar</button>' +
          '<button type="button" onclick="Modules.Dinheiro._switchSub(\'regras\')" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Regras de preço</button>' +
        '</div>' +
      '</div>' +
      '<div style="' + _listingFilterCardStyle() + '">' +
        '<div style="display:grid;grid-template-columns:minmax(280px,1fr) minmax(180px,240px) auto;gap:10px 12px;align-items:end;">' +
          '<label style="display:block;min-width:0;"><span style="' + _listingLabelStyle() + '">Buscar produto</span><input id="din-prod-search" type="search" oninput="Modules.Dinheiro._filterProducts()" placeholder="Digite o nome do produto" autocomplete="off" style="' + fieldStyle + 'height:42px;"></label>' +
          '<label style="display:block;min-width:0;"><span style="' + _listingLabelStyle() + '">Canal de venda</span><select id="din-price-channel" onchange="Modules.Dinheiro._setPriceCompositionChannel(this.value)" style="' + filterSelectStyle + '">' + channelOptions + '</select></label>' +
          (hasFilters ? '<button type="button" onclick="Modules.Dinheiro._clearPriceCompositionFilters()" style="height:38px;padding:0 13px;border:1px solid #E8DCD7;border-radius:12px;background:#fff;color:#B42318;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button>' : '') +
        '</div>' +
        filterNotice +
      '</div>' +
      (filteredRows.length === 0 ? '<section style="' + _listingEmptyCardStyle() + '"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum produto encontrado</div><div style="font-size:13px;color:#6F6860;line-height:1.45;">Ajuste a busca ou limpe os filtros para ver os produtos novamente.</div></section>' :
        '<section style="display:flex;flex-direction:column;gap:10px;">' +
          '<div><div style="font-size:14px;font-weight:700;color:#1F1F1F;">Produtos analisados</div><div style="font-size:13px;color:#6F6860;line-height:1.45;margin-top:2px;">Clique em um produto para ver a composição do preço com mais detalhes.</div></div>' +
          '<div style="background:#fff;border:1px solid #EAE4DA;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(31,31,31,.06);">' +
            '<div style="overflow:auto;"><table class="bf-table" style="width:100%;border-collapse:separate;border-spacing:0;min-width:1120px;">' +
              '<thead><tr style="background:#fff;border-bottom:1px solid #EAE4DA;">' +
                ['Produto','Custo base','Embalagem','Indireto','Custo total','Preço atual','Lucro/unid.','Margem','Markup','Preço margem mín.','Preço margem desejada','Status'].map(_priceTh).join('') +
              '</tr></thead>' +
              '<tbody id="din-products-tbody">' + _productRows(paging.items) + '</tbody>' +
            '</table></div>' +
            paginationHtml +
          '</div>' +
        '</section>') +
    '</div>');
    window._dinProducts = rows;
  }

  function _pendingPriceFilter() {
    try {
      var filter = sessionStorage.getItem('dinheiro_price_filter') || 'todos';
      if (filter === 'todos') sessionStorage.removeItem('dinheiro_price_filter');
      return filter;
    } catch (e) {
      return 'todos';
    }
  }

  function _pricePaging(list) {
    var items = (list || []).slice();
    var total = items.length;
    var pageSize = Math.max(6, parseInt(_priceView.pageSize, 10) || 12);
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var currentPage = Math.min(Math.max(1, parseInt(_priceView.page, 10) || 1), totalPages);
    if (_priceView.page !== currentPage) _priceView.page = currentPage;
    var start = (currentPage - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: total,
      page: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(total, start + pageSize)
    };
  }

  function _setPricePage(page) {
    var next = parseInt(page, 10);
    if (!isFinite(next)) return;
    _priceView.page = Math.max(1, next);
    _renderPrecos();
  }

  function _setPricePageSize(value) {
    var size = parseInt(value, 10);
    if (!isFinite(size) || size <= 0) return;
    _priceView.pageSize = size;
    _priceView.page = 1;
    _renderPrecos();
  }

  function _setPriceCompositionChannel(value) {
    _priceCompositionChannel = String(value || '0');
    _priceView.page = 1;
    _renderPrecos();
  }

  function _clearPriceCompositionFilters() {
    _priceCompositionChannel = '0';
    try { sessionStorage.removeItem('dinheiro_price_filter'); } catch (e) {}
    _priceView.page = 1;
    _renderPrecos();
  }

  function _applyPriceFilter(rows, filter) {
    if (!filter || filter === 'todos') return rows;
    if (filter === 'sem-custo') return rows.filter(function (r) { return !r.totalCost; });
    if (filter === 'sem-preco') return rows.filter(function (r) { return !r.price; });
    if (filter === 'margem-baixa') return rows.filter(function (r) { return r.status === 'margem baixa' || r.status === 'prejuízo'; });
    if (filter === 'abaixo-recomendado') return rows.filter(_isBelowSuggestedActionable);
    return rows;
  }

  function _isBelowSuggestedActionable(r) {
    if (!r || !(r.totalCost > 0) || !(r.price > 0) || !(r.suggestedPrice > 0) || !(r.price < r.suggestedPrice)) return false;
    var desired = _num(_data.dinheiro.desiredMarginPct || 60);
    var defaultMarkup = _num(_data.dinheiro.defaultMarkup || 0);
    var marginBelowTarget = desired > 0 && r.margin < desired;
    var markupBelowTarget = defaultMarkup > 0 && r.markup > 0 && r.markup < defaultMarkup;
    return marginBelowTarget || markupBelowTarget;
  }

  function _filterLabel(filter) {
    return {
      'sem-custo': 'produtos sem custo definido',
      'sem-preco': 'produtos sem preço',
      'margem-baixa': 'margem baixa ou prejuízo',
      'abaixo-recomendado': 'preço abaixo do recomendado'
    }[filter] || 'todos';
  }

  function _productRows(rows) {
    if (!rows.length) return '<tr><td colspan="12" style="padding:48px 24px;text-align:center;color:#8A7E7C;font-size:14px;font-weight:600;">Nenhum produto encontrado.</td></tr>';
    return rows.map(function (r) {
      var img = _productImage(r.product);
      var hasCostAndPrice = r.totalCost > 0 && r.price > 0;
      var marginColor = !hasCostAndPrice ? '#6F6860' : (r.profit < 0 || r.status === 'margem baixa' ? '#B42318' : (r.status === 'atenção' ? '#D97706' : '#1F6F43'));
      return '<tr data-din-product="' + _esc((r.product.name || '').toLowerCase()) + '" data-product-id="' + _esc(r.product.id || '') + '" onclick="Modules.Dinheiro._openProductModal(this.dataset.productId)" onmouseenter="this.style.background=\'#FBF8F2\'" onmouseleave="this.style.background=\'#fff\'" style="background:#fff;border-bottom:1px solid #EAE4DA;cursor:pointer;transition:background .15s ease;">' +
        _priceTd('<div style="display:flex;align-items:center;gap:12px;min-width:0;"><div style="width:46px;height:46px;border-radius:12px;background:#FAF8F4;border:1px solid #EAE4DA;overflow:hidden;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">' + (img ? '<img src="' + _esc(img) + '" style="width:100%;height:100%;object-fit:cover;">' : '<span class="mi" style="font-size:18px;color:#C9BCB8;">restaurant_menu</span>') + '</div><div style="min-width:0;"><strong style="display:block;font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">' + _esc(r.product.name || 'Produto') + '</strong><div style="font-size:12px;color:#6F6860;line-height:1.35;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">' + _esc(r.costSource) + '</div></div></div>') +
        _priceTd(UI.fmt(r.ingredientCost)) +
        _priceTd(UI.fmt(r.packagingCost)) +
        _priceTd(UI.fmt(r.indirectCost)) +
        _priceTd('<strong style="font-weight:600;">' + UI.fmt(r.totalCost) + '</strong>') +
        _priceTd(UI.fmt(r.price)) +
        _priceTd(hasCostAndPrice ? '<strong style="font-weight:600;color:' + (r.profit < 0 ? '#B42318' : '#1F6F43') + ';">' + UI.fmt(r.profit) + '</strong>' : '—') +
        _priceTd(hasCostAndPrice ? '<strong style="font-weight:600;color:' + marginColor + ';">' + (r.margin || 0).toFixed(1).replace('.', ',') + '%</strong>' : '—') +
        _priceTd(hasCostAndPrice && r.markup ? r.markup.toFixed(2).replace('.', ',') + 'x' : '—') +
        _priceTd(UI.fmt(r.minimumPrice)) +
        _priceTd('<strong style="font-weight:600;color:#2F5F93;">' + UI.fmt(r.suggestedPrice) + '</strong>') +
        _priceTd(_statusBadge(r.status)) +
        '</tr>';
    }).join('');
  }

  function _filterProducts() {
    var q = ((document.getElementById('din-prod-search') || {}).value || '').toLowerCase();
    document.querySelectorAll('[data-din-product]').forEach(function (row) {
      row.style.display = !q || (row.dataset.dinProduct || '').indexOf(q) >= 0 ? '' : 'none';
    });
  }

  function _renderListaPrecos() {
    var channels = _data.canais || [_defaultChannel()];
    var selected = _val('din-list-channel') || '0';
    var opts = channels.map(function (ch, idx) {
      return '<option value="' + idx + '"' + (String(idx) === String(selected) ? ' selected' : '') + '>' + _esc(ch.name || ('Canal ' + (idx + 1))) + '</option>';
    }).join('');
    var ch = channels[parseInt(selected, 10) || 0] || _defaultChannel();
    var rows = _productsAnalysis().map(function (r) {
      var price = _priceForChannel(r.product, ch);
      return Object.assign({}, r, { channelPrice: price, channel: ch });
    });
    var filteredRows = _filterPriceListRows(rows);
    var hasFilters = !!(_priceListFilters.q || _priceListFilters.price !== 'todos' || _priceListFilters.status !== 'todos');
    var fieldStyle = _listingFieldStyle();
    var selectStyle = _listingSelectStyle();
    var filterNotice = hasFilters ? '<div style="display:flex;align-items:center;gap:8px;color:#8A4A18;font-size:12.5px;line-height:1.4;margin-top:10px;"><span class="mi" style="font-size:16px;color:#D97706;">filter_alt</span><span>Lista filtrada. Limpe os filtros para ver todos os produtos deste canal.</span></div>' : '';
    _content('<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.2;margin:0 0 6px;color:#1F1F1F;">Lista de Preço</h2>' +
          '<p style="font-size:13px;font-weight:400;color:#6F6860;line-height:1.45;max-width:760px;margin:0;">Monte uma lista clara de preços por canal para consultar ou imprimir quando precisar.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Dinheiro._switchSub(\'precos\')" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Ver composição</button>' +
          '<button type="button" onclick="Modules.Dinheiro._printPriceList()" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Imprimir</button>' +
        '</div>' +
      '</div>' +
      '<div style="' + _listingFilterCardStyle() + '">' +
        '<div style="display:grid;grid-template-columns:minmax(320px,1.6fr) minmax(180px,.8fr) minmax(170px,.75fr) minmax(170px,.75fr) auto;gap:10px;align-items:end;">' +
          '<label style="display:block;min-width:0;"><span style="' + _listingLabelStyle() + '">Buscar produto</span><input id="din-list-search" type="search" value="' + _esc(_priceListFilters.q || '') + '" oninput="Modules.Dinheiro._setPriceListFilter(\'q\',this.value)" placeholder="Digite o nome do produto" autocomplete="off" style="' + fieldStyle + 'height:42px;"></label>' +
          '<label style="display:block;min-width:0;"><span style="' + _listingLabelStyle() + '">Canal</span><select id="din-list-channel" onchange="Modules.Dinheiro._renderListaPrecos()" style="' + selectStyle + 'height:42px;">' + opts + '</select></label>' +
          '<label style="display:block;min-width:0;"><span style="' + _listingLabelStyle() + '">Preço</span><select onchange="Modules.Dinheiro._setPriceListFilter(\'price\',this.value)" style="' + selectStyle + 'height:42px;"><option value="todos"' + (_priceListFilters.price === 'todos' ? ' selected' : '') + '>Todos os preços</option><option value="com-preco"' + (_priceListFilters.price === 'com-preco' ? ' selected' : '') + '>Com preço</option><option value="sem-preco"' + (_priceListFilters.price === 'sem-preco' ? ' selected' : '') + '>Sem preço</option></select></label>' +
          '<label style="display:block;min-width:0;"><span style="' + _listingLabelStyle() + '">Margem</span><select onchange="Modules.Dinheiro._setPriceListFilter(\'status\',this.value)" style="' + selectStyle + 'height:42px;"><option value="todos"' + (_priceListFilters.status === 'todos' ? ' selected' : '') + '>Todas</option><option value="risco"' + (_priceListFilters.status === 'risco' ? ' selected' : '') + '>Em risco</option><option value="saudavel"' + (_priceListFilters.status === 'saudavel' ? ' selected' : '') + '>Saudáveis</option><option value="sem-dados"' + (_priceListFilters.status === 'sem-dados' ? ' selected' : '') + '>Sem dados</option></select></label>' +
          (hasFilters ? '<button type="button" onclick="Modules.Dinheiro._clearPriceListFilters()" style="height:38px;padding:0 13px;border:1px solid #E8DCD7;border-radius:12px;background:#fff;color:#B42318;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Limpar filtros</button>' : '') +
        '</div>' +
        filterNotice +
      '</div>' +
      '<div id="din-price-list-print" style="' + _listingFilterCardStyle() + '">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;">' +
          '<div><h3 style="font-size:14px;font-weight:700;margin:0 0 4px;color:#1F1F1F;">' + _esc(ch.name || 'Canal') + '</h3><p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">Lista pronta para consultar ou imprimir.</p></div>' +
          '<strong style="font-size:12px;font-weight:600;color:#6F6860;">' + UI.fmtDate(new Date()) + '</strong>' +
        '</div>' +
        (filteredRows.length
          ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">' + filteredRows.map(_priceListCard).join('') + '</div>'
          : '<div style="text-align:center;padding:40px 20px;color:#6F6860;"><div style="font-size:15px;font-weight:700;color:#1F1F1F;margin-bottom:4px;">Nenhum produto encontrado</div><div style="font-size:13px;line-height:1.45;">Ajuste a busca ou limpe os filtros para montar a lista de preços.</div></div>') +
      '</div>' +
    '</div>');
  }

  function _filterPriceListRows(rows) {
    var q = String(_priceListFilters.q || '').trim().toLowerCase();
    return (rows || []).filter(function (r) {
      var hasPrice = _num(r.channelPrice) > 0;
      if (_priceListFilters.price === 'com-preco' && !hasPrice) return false;
      if (_priceListFilters.price === 'sem-preco' && hasPrice) return false;
      if (_priceListFilters.status === 'risco' && !(r.status === 'margem baixa' || r.status === 'prejuízo')) return false;
      if (_priceListFilters.status === 'saudavel' && r.status !== 'saudável') return false;
      if (_priceListFilters.status === 'sem-dados' && !(r.status === 'sem custo' || r.status === 'sem preço' || r.status === 'sem dados')) return false;
      if (!q) return true;
      var text = [
        r.product && r.product.name,
        r.product && r.product.shortDesc,
        r.product && r.product.description,
        r.status,
        r.costSource
      ].join(' ').toLowerCase();
      return text.indexOf(q) >= 0;
    });
  }

  function _setPriceListFilter(key, value) {
    var keepSearchFocus = key === 'q';
    if (key === 'q') _priceListFilters.q = String(value || '');
    else if (key === 'price') _priceListFilters.price = value || 'todos';
    else if (key === 'status') _priceListFilters.status = value || 'todos';
    _renderListaPrecos();
    if (keepSearchFocus) setTimeout(function () {
      var input = document.getElementById('din-list-search');
      if (!input) return;
      var pos = String(_priceListFilters.q || '').length;
      input.focus();
      if (input.setSelectionRange) input.setSelectionRange(pos, pos);
    }, 0);
  }

  function _clearPriceListFilters() {
    _priceListFilters = { q: '', price: 'todos', status: 'todos' };
    _renderListaPrecos();
  }

  function _priceListCard(r) {
    var img = _productImage(r.product);
    var hasPrice = _num(r.channelPrice) > 0;
    return '<div style="display:grid;grid-template-columns:62px minmax(0,1fr);gap:12px;align-items:center;border:1px solid #EAE4DA;border-radius:16px;background:#fff;padding:12px;box-shadow:0 12px 30px rgba(31,31,31,.06);break-inside:avoid;transition:transform .16s ease,box-shadow .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\'">' +
      '<div style="width:62px;height:62px;border-radius:12px;background:#FAF8F4;border:1px solid #EAE4DA;overflow:hidden;display:flex;align-items:center;justify-content:center;">' + (img ? '<img src="' + _esc(img) + '" style="width:100%;height:100%;object-fit:cover;">' : '<span class="mi" style="font-size:20px;color:#C9BCB8;">restaurant_menu</span>') + '</div>' +
      '<div style="min-width:0;"><strong style="display:block;font-size:14px;font-weight:600;color:#1F1F1F;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(r.product.name || 'Produto') + '</strong><div style="color:#6F6860;font-size:12px;line-height:1.35;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(r.product.shortDesc || r.product.description || 'Sem descrição curta') + '</div><div style="color:' + (hasPrice ? '#B42318' : '#6F6860') + ';font-size:22px;font-weight:700;line-height:1;margin-top:9px;">' + UI.fmt(r.channelPrice) + '</div></div>' +
      '</div>';
  }

  function _printPriceList() {
    var el = document.getElementById('din-price-list-print');
    if (!el) return;
    var win = window.open('', '_blank');
    if (!win) {
      UI.toast('Não foi possível abrir a janela de impressão.', 'error');
      return;
    }
    win.document.write('<!doctype html><html><head><title>Lista de Preço</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#1A1A1A}img{max-width:100%}@media print{button{display:none}}</style></head><body>' + el.innerHTML + '</body></html>');
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 250);
  }

  function _openProductModal(id, channelIndex) {
    if (!id) return;
    var product = (_data.products || []).find(function (item) {
      return String(item.id) === String(id);
    });
    if (!product) {
      UI.toast('Produto não encontrado nesta lista.', 'error');
      return;
    }
    var channels = _data.canais || [_defaultChannel()];
    var initialChannel = channelIndex != null && channelIndex !== '' ? parseInt(channelIndex, 10) : parseInt(_priceCompositionChannel, 10);
    if (!isFinite(initialChannel) || !channels[initialChannel]) {
      initialChannel = channels.findIndex(function (ch) { return _isCardapioChannel(ch); });
      if (initialChannel < 0) initialChannel = 0;
    }
    _priceCompositionChannel = String(initialChannel);
    var channelOpts = channels.map(function (ch, idx) {
      return '<option value="' + idx + '">' + _esc(ch.name || ('Canal ' + (idx + 1))) + '</option>';
    }).join('');
    var modalCss = '<style>' +
      '.din-price-modal-shell{width:min(1040px,100%);max-height:90vh;overflow:auto;background:#FFFCFA;border:1px solid #EADFD8;border-radius:20px;box-shadow:0 24px 70px rgba(31,31,31,.22);position:relative;font-family:Manrope,Inter,sans-serif;}' +
      '.din-price-modal-head{padding:20px 22px 14px;border-bottom:1px solid #F0E6E3;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);}' +
      '.din-price-modal-title{font-size:20px;font-weight:700;line-height:1.18;color:#1F1F1F;margin:0;}' +
      '.din-price-modal-subtitle{font-size:13px;font-weight:400;line-height:1.45;color:#6F6860;margin:6px 0 0;max-width:640px;}' +
      '.din-price-modal-close{width:34px;height:34px;border:0;border-radius:12px;background:#F8F1ED;color:#5F514D;font-size:18px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;}' +
      '.din-price-modal-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px;}' +
      '.din-price-modal-foot{padding:14px 18px 18px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #F0E6E3;background:#FFFCFA;}' +
      '@media(max-width:720px){#din-price-modal{padding:12px!important;align-items:flex-start!important}.din-price-modal-shell{max-height:calc(100dvh - 24px);border-radius:18px}.din-price-modal-head{padding:18px 16px 12px}.din-price-modal-body{padding:14px}.din-price-current-grid{grid-template-columns:1fr!important}.din-price-modal-foot{padding:12px 14px 14px;flex-direction:column-reverse}.din-price-modal-foot button{width:100%}}' +
      '</style>';
    var html = '<div id="din-price-modal" onclick="Modules.Dinheiro._closeProductModal(event)" style="position:fixed;inset:0;z-index:10000;background:rgba(26,26,26,.48);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;">' +
      modalCss +
      '<div class="din-price-modal-shell" onclick="event.stopPropagation()">' +
      '<div class="din-price-modal-head">' +
      '<div style="display:flex;gap:12px;align-items:flex-start;min-width:0;">' +
      '<span class="mi" style="width:34px;height:34px;border-radius:12px;background:#F8F1ED;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 auto;">receipt_long</span>' +
      '<div style="min-width:0;"><h2 class="din-price-modal-title">' + _esc(product.name || 'Produto') + '</h2>' +
      '<p class="din-price-modal-subtitle">Veja preço, custo, margem e recomendação por canal de venda.</p></div>' +
      '</div>' +
      '<button class="din-price-modal-close" onclick="Modules.Dinheiro._closeProductModal()" aria-label="Fechar">×</button>' +
      '</div>' +
      '<input id="din-modal-product-id" type="hidden" value="' + _esc(id) + '">' +
      '<div id="din-price-modal-body" class="din-price-modal-body"></div>' +
      '<div class="din-price-modal-foot">' +
      '<button onclick="Modules.Dinheiro._closeProductModal()" style="height:40px;background:#fff;color:#1F1F1F;border:1px solid #E8DCD7;padding:0 16px;border-radius:12px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(31,31,31,.03);">Fechar</button>' +
      '<button onclick="Modules.Dinheiro._saveProductPrice(\'' + _esc(id) + '\')" style="height:40px;background:#B42318;color:#fff;border:none;padding:0 18px;border-radius:12px;font-weight:650;cursor:pointer;font-family:inherit;box-shadow:0 10px 22px rgba(180,35,24,.18);">Salvar preço</button>' +
      '</div>' +
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    _renderProductPriceModal({ product: product }, initialChannel, channelOpts, { useChannelPrice: true });
    var input = document.getElementById('din-modal-price');
    if (input) input.focus();
  }

  function _renderProductPriceModal(row, channelIndex, channelOpts, opts) {
    var body = document.getElementById('din-price-modal-body');
    if (!body) return;
    opts = opts || {};
    var channels = _data.canais || [_defaultChannel()];
    var ch = channels[channelIndex] || _defaultChannel();
    var typedPrice = _moneyInputValue((document.getElementById('din-modal-price') || {}).value);
    var currentPrice = opts.useChannelPrice ? _priceForChannel(row.product, ch) : (typedPrice || _priceForChannel(row.product, ch));
    var analysis = _analyzeProduct(Object.assign({}, row.product, { price: currentPrice }), ch);
    var desiredMarginRule = _num(_data.dinheiro.desiredMarginPct || 60);
    var minMarginRule = _num(_data.dinheiro.minMarginPct || 40);
    var minimumRulePrice = analysis.minimumPrice || _priceForMargin(analysis.totalCost, minMarginRule, ch, { round: false }, row.product);
    var minMarkup = analysis.totalCost > 0 ? minimumRulePrice / analysis.totalCost : 0;
    var recommendedMarkup = analysis.totalCost > 0 ? analysis.suggestedPrice / analysis.totalCost : 0;
    var minFee = _feesForPrice(minimumRulePrice, ch, row.product);
    var suggestedFee = _feesForPrice(analysis.suggestedPrice, ch, row.product);
    var minMarkupMargin = minimumRulePrice > 0 ? ((minimumRulePrice - analysis.totalCost - minFee.total) / minimumRulePrice) * 100 : 0;
    var recommendedMarkupMargin = analysis.suggestedPrice > 0 ? ((analysis.suggestedPrice - analysis.totalCost - suggestedFee.total) / analysis.suggestedPrice) * 100 : 0;
    var suggestedWarning = _suggestedPriceWarning(analysis, ch);
    var fiscalCards = _fiscalEnabled()
      ? _priceMetric('Lucro antes de impostos', UI.fmt(analysis.profit), 'por unidade') +
        _priceMetric('Lucro depois fiscal', UI.fmt(_afterFiscalProfit(analysis)), 'estimativa')
      : _priceMetric('Lucro estimado', UI.fmt(analysis.profit), 'por unidade');
    body.innerHTML =
      '<section style="' + _priceModalCardStyle() + '">' +
      _priceModalSectionTitle('Preço atual', 'Escolha o canal e confira como o preço se comporta na margem.', 'sell') +
      '<div class="din-price-current-grid" style="display:grid;grid-template-columns:minmax(220px,.9fr) minmax(150px,170px) minmax(160px,.6fr);gap:12px;align-items:end;justify-content:start;margin-bottom:12px;">' +
      '<label style="' + _labelWrap() + '"><span style="' + _priceModalLabel() + '">Canal de venda</span><select id="din-modal-channel" onchange="Modules.Dinheiro._updateProductPriceModal(true)" style="' + _priceModalSelect() + '">' + channelOpts.replace('value="' + channelIndex + '"', 'value="' + channelIndex + '" selected') + '</select></label>' +
      '<label style="' + _labelWrap() + '"><span style="' + _priceModalLabel() + '">Preço de venda</span><input id="din-modal-price" type="text" inputmode="decimal" onchange="Modules.Dinheiro._updateProductPriceModal(false)" onfocus="Modules.Dinheiro._moneyInputFocus(this)" onblur="Modules.Dinheiro._moneyInputBlurOnly(this);Modules.Dinheiro._updateProductPriceModal(false)" value="' + _esc(_moneyDisplay(currentPrice, true)) + '" placeholder="€0,00" style="' + _priceModalInput('font-size:17px;font-weight:650;text-align:right;') + '"></label>' +
      _priceStatusMetric(analysis.status, ch.name || 'canal') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;">' +
      _priceMetric('Custo', UI.fmt(analysis.totalCost), analysis.costSource) +
      fiscalCards +
      _priceMetric('Margem', (analysis.margin || 0).toFixed(1).replace('.', ',') + '%', 'real') +
      _priceMetric('Markup', analysis.markup ? analysis.markup.toFixed(2).replace('.', ',') + 'x' : '—', 'real') +
      '</div>' +
      _comboCostRangeBlock(analysis) +
      _menuCombinationDiscoveryBlock(row.product, ch) +
      _soldMenuCombinationsBlock(row.product) +
      '</section>' +
      '<section style="' + _priceModalCardStyle() + '">' +
      _priceModalSectionTitle('Distribuição do preço', 'Veja quanto do preço vai para custo, taxas e resultado.', 'donut_large') +
      _priceDistribution(analysis) +
      '</section>' +
      '<section style="' + _priceModalCardStyle() + '">' +
      _priceModalSectionTitle('Preços sugeridos', 'Compare o preço para proteger a margem mínima e o preço para chegar na margem desejada.', 'trending_up') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">' +
      _priceMetric('Preço com margem mínima', UI.fmt(minimumRulePrice), 'margem mínima ' + minMarginRule.toFixed(1).replace('.', ',') + '%') +
      _priceMetric('Markup da margem mínima', minMarkup ? minMarkup.toFixed(2).replace('.', ',') + 'x' : '—', 'margem aprox. ' + minMarkupMargin.toFixed(1).replace('.', ',') + '%') +
      _priceMetric('Preço com margem desejada', UI.fmt(analysis.suggestedPrice), 'margem desejada ' + desiredMarginRule.toFixed(1).replace('.', ',') + '%') +
      _priceMetric('Markup da margem desejada', recommendedMarkup ? recommendedMarkup.toFixed(2).replace('.', ',') + 'x' : '—', 'margem aprox. ' + recommendedMarkupMargin.toFixed(1).replace('.', ',') + '%') +
      '</div>' + suggestedWarning + '</section>';
  }

  function _suggestedPriceWarning(analysis, channel) {
    var currentPrice = _num(analysis.price);
    var suggested = _num(analysis.suggestedPrice);
    if (!currentPrice || !suggested || suggested <= currentPrice * 3) return '';
    var parts = _feeParts(channel, analysis.product);
    var feeText = parts.pct > 0 ? ' As taxas e impostos deste canal somam cerca de ' + parts.pct.toFixed(1).replace('.', ',') + '% sobre a venda.' : '';
    return '<div style="margin-top:12px;display:flex;gap:10px;align-items:flex-start;background:#FFF7ED;border:1px solid #FED7AA;border-radius:14px;padding:12px 14px;color:#7C2D12;font-size:13px;line-height:1.45;">' +
      '<span class="mi" style="font-size:18px;color:#D97706;line-height:1.2;">warning</span>' +
      '<span><strong style="font-weight:700;">Preço sugerido muito acima do preço atual.</strong> Isso acontece quando a margem desejada, as taxas e os impostos deixam pouco espaço para lucro nesse canal.' + feeText + '</span>' +
      '</div>';
  }

  function _comboCostRangeBlock(analysis) {
    var range = analysis && analysis.costRange;
    if (!range || !(_num(range.maxTotal) > 0)) return '';
    return '<div style="margin-top:12px;border:1px solid #E8DCD7;background:#FFFCF8;border-radius:14px;padding:12px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">' +
        '<div><div style="font-size:11px;font-weight:800;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Faixa de custo do combo</div>' +
        '<p style="font-size:12px;color:#6F6860;line-height:1.4;margin:3px 0 0;">A margem usa o pior caso, quando a cliente escolhe as opções mais caras.</p></div>' +
        '<span class="mi" style="width:30px;height:30px;border-radius:10px;background:#FFF3F1;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto;">rule</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">' +
        _comboCostRangeMetric('Mínimo', range.minTotal, 'opções mais baratas') +
        _comboCostRangeMetric('Médio', range.avgTotal, 'média das opções') +
        _comboCostRangeMetric('Máximo', range.maxTotal, 'usado na margem') +
      '</div>' +
    '</div>';
  }

  function _comboCostRangeMetric(label, value, note) {
    return '<div style="background:#fff;border:1px solid #EFE5E1;border-radius:12px;padding:10px 11px;">' +
      '<span style="display:block;font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;">' + _esc(label) + '</span>' +
      '<strong style="display:block;font-size:15px;color:#1F1F1F;margin-top:3px;">' + UI.fmt(_num(value)) + '</strong>' +
      '<small style="display:block;font-size:11px;color:#6F6860;line-height:1.3;margin-top:3px;">' + _esc(note) + '</small>' +
    '</div>';
  }

  function _menuCombinationDiscoveryBlock(product, channel) {
    var info = _menuCombinationDiscovery(product, 250, channel);
    if (!info.isMenu || !info.groups.length) return '';
    var summary = info.analysis;
    var analyzedNote = info.truncated ? 'amostra de ' + info.samples.length + ' combinações' : 'todas as combinações';
    var insight = summary ? _menuCombinationInsight(summary, info.truncated) : '';
    var listId = 'din-menu-combos-list-' + String(product && product.id || 'menu').replace(/[^a-zA-Z0-9_-]/g, '');
    var filterStyle = 'height:34px;border:1px solid #E8DCD7;border-radius:10px;background:#fff;color:#1F1F1F;font-size:12px;font-weight:600;font-family:inherit;padding:0 28px 0 9px;outline:none;';
    var summaryHtml = summary ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;margin-top:10px;">' +
      _menuCombinationMetric('Preço', UI.fmt(summary.minPrice) + ' a ' + UI.fmt(summary.maxPrice), 'com adicionais') +
      _menuCombinationMetric('Custo médio', UI.fmt(summary.avgCost), UI.fmt(summary.minCost) + ' a ' + UI.fmt(summary.maxCost)) +
      _menuCombinationMetric('Margem média', summary.avgMargin.toFixed(1).replace('.', ',') + '%', summary.minMargin.toFixed(1).replace('.', ',') + '% a ' + summary.maxMargin.toFixed(1).replace('.', ',') + '%') +
      _menuCombinationMetric('Combinações em atenção', summary.riskCount, analyzedNote) +
    '</div>' : '';
    var extremesHtml = summary ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin-top:10px;">' +
      _menuCombinationExtremeCard('Pior margem', summary.worst, '#B42318') +
      _menuCombinationExtremeCard('Melhor margem', summary.best, '#1F6F43') +
    '</div>' : '';
    (info.samples || []).forEach(function (sample, index) { sample.__comboIndex = index; });
    window._dinMenuCombinationData = window._dinMenuCombinationData || {};
    window._dinMenuCombinationData[listId] = { product: product, channel: channel, samples: info.samples || [] };
    var listHtml = '<div style="margin-top:12px;border-top:1px solid #E8DCD7;padding-top:10px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px;">' +
        '<div><div style="font-size:11px;font-weight:800;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Escolha uma combinação para analisar</div><div style="font-size:11px;color:#8A7E7C;margin-top:2px;">Use os filtros para encontrar a combinação e abra a composição completa no botão Ver composição.</div></div>' +
        '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">' +
          '<select onchange="Modules.Dinheiro._setMenuCombinationView(\'' + _esc(listId) + '\',\'filter\',this.value)" style="' + filterStyle + '">' +
            '<option value="todos"' + (_menuCombinationView.filter === 'todos' ? ' selected' : '') + '>Todas</option>' +
            '<option value="risco"' + (_menuCombinationView.filter === 'risco' ? ' selected' : '') + '>Em atenção</option>' +
            '<option value="saudavel"' + (_menuCombinationView.filter === 'saudavel' ? ' selected' : '') + '>Saudáveis</option>' +
          '</select>' +
          '<select onchange="Modules.Dinheiro._setMenuCombinationView(\'' + _esc(listId) + '\',\'sort\',this.value)" style="' + filterStyle + '">' +
            '<option value="margem-asc"' + (_menuCombinationView.sort === 'margem-asc' ? ' selected' : '') + '>Menor margem</option>' +
            '<option value="margem-desc"' + (_menuCombinationView.sort === 'margem-desc' ? ' selected' : '') + '>Maior margem</option>' +
            '<option value="custo-desc"' + (_menuCombinationView.sort === 'custo-desc' ? ' selected' : '') + '>Maior custo</option>' +
            '<option value="preco-desc"' + (_menuCombinationView.sort === 'preco-desc' ? ' selected' : '') + '>Maior preço</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div id="' + _esc(listId) + '">' + _menuCombinationListHtml(info.samples || [], _menuCombinationView, listId) + '</div>' +
    '</div>';
    return '<div style="margin-top:12px;border:1px solid #E8DCD7;background:#FFFCF8;border-radius:14px;padding:12px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
        '<div><div style="font-size:11px;font-weight:800;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Análise por combinação do menu</div>' +
        '<p style="font-size:12px;color:#6F6860;line-height:1.4;margin:3px 0 0;">Escolha uma combinação abaixo para abrir a composição de preço detalhada dela.</p></div>' +
        '<span style="height:30px;padding:0 10px;border-radius:999px;background:#fff;border:1px solid #EADFD8;color:#1F1F1F;font-size:12px;font-weight:800;display:inline-flex;align-items:center;white-space:nowrap;">' + _esc(_menuCombinationCountLabel(info.totalCount)) + '</span>' +
      '</div>' +
      (insight ? '<div style="margin-top:10px;padding:10px 11px;border-radius:12px;background:#fff;border:1px solid #EFE5E1;color:#5F514D;font-size:12px;line-height:1.45;">' + _esc(insight) + '</div>' : '') +
      summaryHtml +
      extremesHtml +
      listHtml +
      (info.truncated ? '<div style="font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:8px;">Este menu tem muitas possibilidades. A listagem mostra ' + _esc(analyzedNote) + ' para manter a tela rápida.</div>' : '') +
    '</div>';
  }

  function _menuCombinationInsight(summary, truncated) {
    if (!summary) return '';
    var source = truncated ? 'Na amostra analisada' : 'Nas combinações possíveis';
    if (summary.riskCount > 0) {
      return source + ', existem combinações que pedem atenção antes de vender. Comece revisando a pior margem e veja se algum adicional precisa de ajuste.';
    }
    var spread = _num(summary.maxMargin) - _num(summary.minMargin);
    if (spread >= 20) return source + ', a margem muda bastante conforme a escolha. Vale olhar quais opções puxam o resultado para baixo.';
    return source + ', as combinações estão próximas entre si. O preço do menu parece mais estável para as escolhas atuais.';
  }

  function _menuCombinationExtremeCard(title, sample, color) {
    if (!sample || !sample.analysis) return '';
    var a = sample.analysis;
    return '<div style="background:#fff;border:1px solid #EFE5E1;border-radius:12px;padding:10px 11px;min-width:0;">' +
      '<div style="font-size:10px;font-weight:800;color:' + color + ';text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;">' + _esc(title) + '</div>' +
      '<div style="font-size:11.5px;color:#5F514D;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(sample.label || 'Combinação') + '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:7px;">' +
        '<strong style="font-size:12px;color:#1F1F1F;">' + UI.fmt(_num(a.price)) + '</strong>' +
        '<span style="font-size:11px;color:#6F6860;">Custo ' + UI.fmt(_num(a.totalCost)) + '</span>' +
        '<span style="font-size:11px;color:' + color + ';font-weight:750;">Margem ' + _num(a.margin).toFixed(1).replace('.', ',') + '%</span>' +
      '</div>' +
    '</div>';
  }

  function _menuCombinationListHtml(samples, view, listId) {
    view = view || _menuCombinationView;
    var rows = _filterMenuCombinationRows(samples || [], view.filter || 'todos');
    rows = _sortMenuCombinationRows(rows, view.sort || 'margem-asc');
    var visible = rows.slice(0, 24);
    if (!visible.length) return '<div style="background:#fff;border:1px dashed #E8DCD7;border-radius:12px;padding:12px;color:#6F6860;font-size:12px;line-height:1.4;">Nenhuma combinação encontrada com este filtro.</div>';
    return '<div style="display:flex;flex-direction:column;gap:6px;">' + visible.map(function (sample) { return _menuCombinationRowHtml(sample, listId); }).join('') + '</div>' +
      (rows.length > visible.length ? '<div style="font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:8px;">Mostrando 24 de ' + rows.length + ' combinações deste filtro.</div>' : '');
  }

  function _filterMenuCombinationRows(samples, filter) {
    if (filter === 'risco') {
      return (samples || []).filter(function (sample) {
        var status = sample && sample.analysis && sample.analysis.status;
        return status === 'prejuízo' || status === 'margem baixa' || status === 'sem custo' || status === 'atenção';
      });
    }
    if (filter === 'saudavel') {
      return (samples || []).filter(function (sample) {
        return sample && sample.analysis && sample.analysis.status === 'saudável';
      });
    }
    return (samples || []).slice();
  }

  function _sortMenuCombinationRows(rows, sort) {
    return (rows || []).slice().sort(function (a, b) {
      var aa = a && a.analysis || {};
      var ba = b && b.analysis || {};
      if (sort === 'margem-desc') return _num(ba.margin) - _num(aa.margin) || _num(ba.profit) - _num(aa.profit);
      if (sort === 'custo-desc') return _num(ba.totalCost) - _num(aa.totalCost) || _num(ba.price) - _num(aa.price);
      if (sort === 'preco-desc') return _num(ba.price) - _num(aa.price) || _num(ba.margin) - _num(aa.margin);
      return _num(aa.margin) - _num(ba.margin) || _num(aa.profit) - _num(ba.profit);
    });
  }

  function _menuCombinationRowHtml(sample, listId) {
    var a = sample && sample.analysis || {};
    var tone = a.status === 'prejuízo' || a.status === 'margem baixa' ? '#B42318' : (a.status === 'atenção' || a.status === 'sem custo' ? '#D97706' : '#1F6F43');
    var extra = _num(sample && sample.extraPrice);
    return '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,max-content);gap:10px;align-items:center;background:#fff;border:1px solid #EFE5E1;border-radius:11px;padding:9px 10px;">' +
      '<div style="min-width:0;">' +
        '<div style="font-size:12px;color:#1F1F1F;font-weight:650;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(sample && sample.label || 'Combinação') + '</div>' +
        '<div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:3px;">Preço ' + UI.fmt(_num(a.price)) + (extra ? ' · adicional +' + UI.fmt(extra) : '') + ' · margem ' + _num(a.margin).toFixed(1).replace('.', ',') + '%</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap;text-align:right;">' +
        '<span style="font-size:10.5px;color:' + tone + ';font-weight:750;background:#FAF8F4;border-radius:999px;padding:4px 7px;white-space:nowrap;">' + _esc(a.status || 'sem dados') + '</span>' +
        '<button type="button" onclick="Modules.Dinheiro._openMenuCombinationPriceModal(\'' + _esc(listId || '') + '\',' + _num(sample && sample.__comboIndex) + ')" style="height:32px;padding:0 11px;border-radius:10px;border:1px solid #E8DCD7;background:#fff;color:#1F1F1F;font-size:11.5px;font-weight:750;cursor:pointer;font-family:inherit;white-space:nowrap;">Ver composição</button>' +
      '</div>' +
    '</div>';
  }

  function _setMenuCombinationView(listId, key, value) {
    if (key === 'filter') _menuCombinationView.filter = value || 'todos';
    if (key === 'sort') _menuCombinationView.sort = value || 'margem-asc';
    var host = document.getElementById(listId);
    var data = window._dinMenuCombinationData && window._dinMenuCombinationData[listId] || {};
    var samples = Array.isArray(data) ? data : (data.samples || []);
    if (host) host.innerHTML = _menuCombinationListHtml(samples, _menuCombinationView, listId);
  }

  function _openMenuCombinationPriceModal(listId, index) {
    var data = window._dinMenuCombinationData && window._dinMenuCombinationData[listId] || {};
    var samples = Array.isArray(data) ? data : (data.samples || []);
    var sample = samples[parseInt(index, 10) || 0];
    if (!sample || !sample.analysis) return;
    var product = data.product || {};
    var channel = data.channel || _cardapioChannel();
    var analysis = Object.assign({}, sample.analysis, { product: product, channel: channel });
    var minMarginRule = _num(_data.dinheiro.minMarginPct || 40);
    var desiredMarginRule = _num(_data.dinheiro.desiredMarginPct || 60);
    var minimumRulePrice = _priceForMargin(analysis.totalCost, minMarginRule, channel, { round: false }, product);
    var suggestedPrice = _suggestedPrice(analysis.totalCost, desiredMarginRule, channel, product);
    var minFee = _feesForPrice(minimumRulePrice, channel, product);
    var suggestedFee = _feesForPrice(suggestedPrice, channel, product);
    var minMargin = minimumRulePrice > 0 ? ((minimumRulePrice - analysis.totalCost - minFee.total) / minimumRulePrice) * 100 : 0;
    var suggestedMargin = suggestedPrice > 0 ? ((suggestedPrice - analysis.totalCost - suggestedFee.total) / suggestedPrice) * 100 : 0;
    var statusTone = analysis.status === 'prejuízo' || analysis.status === 'margem baixa' ? '#B42318' : (analysis.status === 'atenção' || analysis.status === 'sem custo' ? '#D97706' : '#1F6F43');
    var body = '<div style="display:flex;flex-direction:column;gap:12px;font-family:Manrope,Inter,sans-serif;">' +
      '<section style="' + _priceModalCardStyle() + '">' +
        _priceModalSectionTitle('Combinação analisada', 'Esta leitura usa só as escolhas desta combinação.', 'tune') +
        '<div style="font-size:13px;font-weight:750;color:#1F1F1F;line-height:1.45;">' + _esc(sample.label || 'Combinação') + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;">' +
          '<span style="font-size:11px;color:#6F6860;">' + _esc(product.name || 'Menu') + '</span>' +
          '<span style="font-size:11px;color:#6F6860;">·</span>' +
          '<span style="font-size:11px;color:#6F6860;">' + _esc(channel.name || 'Canal') + '</span>' +
          '<span style="font-size:10.5px;color:' + statusTone + ';font-weight:800;background:#FAF8F4;border-radius:999px;padding:4px 7px;">' + _esc(analysis.status || 'sem dados') + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px;margin-top:11px;">' +
          _priceMetric('Preço', UI.fmt(analysis.price), analysis.extraPrice ? 'inclui +' + UI.fmt(analysis.extraPrice) + ' de adicional' : 'sem adicional') +
          _priceMetric('Custo', UI.fmt(analysis.totalCost), 'custo desta combinação') +
          _priceMetric('Taxas', UI.fmt(analysis.fees), channel.name || 'canal') +
          _priceMetric('Lucro', UI.fmt(analysis.profit), 'antes de IRPF estimado') +
          _priceMetric('Margem', _num(analysis.margin).toFixed(1).replace('.', ',') + '%', 'desta combinação') +
        '</div>' +
      '</section>' +
      '<section style="' + _priceModalCardStyle() + '">' +
        _priceModalSectionTitle('Distribuição do preço', 'Veja quanto do preço desta combinação vai para custo, taxas e resultado.', 'donut_large') +
        _priceDistribution(analysis) +
      '</section>' +
      '<section style="' + _priceModalCardStyle() + '">' +
        _priceModalSectionTitle('Preços sugeridos', 'Referências calculadas só para esta combinação.', 'trending_up') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">' +
          _priceMetric('Preço com margem mínima', UI.fmt(minimumRulePrice), 'margem aprox. ' + minMargin.toFixed(1).replace('.', ',') + '%') +
          _priceMetric('Preço com margem desejada', UI.fmt(suggestedPrice), 'margem aprox. ' + suggestedMargin.toFixed(1).replace('.', ',') + '%') +
        '</div>' +
      '</section>' +
    '</div>';
    window._dinMenuCombinationModal = UI.modal({
      title: 'Composição da combinação',
      body: body,
      footer: '<button type="button" onclick="if(window._dinMenuCombinationModal){window._dinMenuCombinationModal.close();}" style="height:40px;background:#fff;color:#1F1F1F;border:1px solid #E8DCD7;padding:0 16px;border-radius:12px;font-weight:650;cursor:pointer;font-family:inherit;">Fechar</button>',
      maxWidth: '980px'
    });
  }

  function _soldMenuCombinationsBlock(product) {
    var rows = _soldMenuCombinationRows(product, 40);
    if (!rows.length) return '';
    var valid = rows.filter(function (row) { return row.analysis && row.analysis.price > 0; });
    var revenue = valid.reduce(function (sum, row) { return sum + _num(row.total); }, 0);
    var profit = valid.reduce(function (sum, row) { return sum + (_num(row.analysis.profit) * _num(row.qty || 1)); }, 0);
    var avgMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    var risk = valid.filter(function (row) {
      var s = row.analysis.status;
      return s === 'prejuízo' || s === 'margem baixa' || s === 'sem custo' || s === 'atenção';
    }).length;
    var summary = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:8px;margin-top:10px;">' +
      _menuCombinationMetric('Vendidas', rows.length, 'últimos pedidos') +
      _menuCombinationMetric('Receita', UI.fmt(revenue), 'dessas combinações') +
      _menuCombinationMetric('Margem média', avgMargin.toFixed(1).replace('.', ',') + '%', 'com canal do pedido') +
      _menuCombinationMetric('Pedem atenção', risk, 'custo, taxa ou preço') +
    '</div>';
    return '<div style="margin-top:12px;border:1px solid #E8DCD7;background:#FFFCF8;border-radius:14px;padding:12px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
        '<div><div style="font-size:11px;font-weight:800;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;">Combinações vendidas</div>' +
        '<p style="font-size:12px;color:#6F6860;line-height:1.4;margin:3px 0 0;">Aqui a margem usa a escolha feita no pedido, o preço realmente cobrado e as taxas do canal daquele pedido.</p></div>' +
        '<span class="mi" style="width:30px;height:30px;border-radius:10px;background:#FFF3F1;color:#B42318;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto;">shopping_bag</span>' +
      '</div>' +
      summary +
      '<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;">' + rows.slice(0, 12).map(_soldMenuCombinationRowHtml).join('') + '</div>' +
      (rows.length > 12 ? '<div style="font-size:11px;color:#8A7E7C;line-height:1.35;margin-top:8px;">Mostrando 12 de ' + rows.length + ' combinações vendidas encontradas.</div>' : '') +
    '</div>';
  }

  function _soldMenuCombinationRows(product, limit) {
    if (!_menuGroupsForCombinations(product).length) return [];
    var productId = String(product && product.id || '');
    var productName = _fold(product && product.name || '');
    var rows = [];
    (_data.orders || []).filter(_validOrderForSoldMargin).some(function (order) {
      var channel = _channelForOrder(order);
      var orderNumber = _firstText(order.orderNumber, order.number, order.code, order.id ? '#' + String(order.id).slice(-6).toUpperCase() : 'Pedido');
      var date = _firstText(order.orderDate, order.dataPedido, order.createdAt, order.createdDate, order.date, '');
      _orderItemsForMargin(order).forEach(function (item, idx) {
        if (rows.length >= limit) return;
        if (!_orderItemMatchesProduct(item, productId, productName)) return;
        var qty = _num(item.qty != null ? item.qty : item.quantity != null ? item.quantity : item.amount) || 1;
        var total = _orderItemTotal(item, qty);
        var unitPrice = qty > 0 ? total / qty : _num(item.price || item.unitPrice || item.valorUnitario);
        var combination = _combinationFromSoldItem(product, item);
        if (!combination || !combination.selections.length) return;
        combination.priceOverride = unitPrice;
        var analysis = _menuCombinationMetrics(product, combination, channel);
        rows.push({
          key: [order.id || orderNumber, productId || productName, idx].join(':'),
          orderNumber: orderNumber,
          date: date,
          channel: channel && channel.name || _firstText(order.channel, order.source, 'Canal'),
          customer: _firstText(order.customerName, order.clientName, order.name, ''),
          qty: qty,
          total: total,
          label: combination.label,
          analysis: analysis
        });
      });
      return rows.length >= limit;
    });
    return rows.sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || '')) || String(b.orderNumber || '').localeCompare(String(a.orderNumber || ''));
    });
  }

  function _soldMenuCombinationRowHtml(row) {
    var a = row && row.analysis || {};
    var tone = a.status === 'prejuízo' || a.status === 'margem baixa' ? '#B42318' : (a.status === 'atenção' || a.status === 'sem custo' ? '#D97706' : '#1F6F43');
    var date = row.date ? String(row.date).slice(0, 10) : '';
    return '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,max-content);gap:10px;align-items:start;background:#fff;border:1px solid #EFE5E1;border-radius:11px;padding:9px 10px;">' +
      '<div style="min-width:0;">' +
        '<div style="font-size:12px;color:#1F1F1F;font-weight:650;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(row.label || 'Combinação vendida') + '</div>' +
        '<div style="font-size:11px;color:#6F6860;line-height:1.35;margin-top:3px;">' + _esc(row.orderNumber || 'Pedido') + (date ? ' · ' + _esc(date) : '') + ' · ' + _esc(row.channel || 'Canal') + (row.customer ? ' · ' + _esc(row.customer) : '') + '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap;text-align:right;">' +
        '<strong style="font-size:12px;color:#1F1F1F;white-space:nowrap;">' + UI.fmt(_num(a.price)) + ' x ' + _num(row.qty || 1).toFixed(0) + '</strong>' +
        '<span style="font-size:11px;color:#6F6860;white-space:nowrap;">Custo ' + UI.fmt(_num(a.totalCost)) + '</span>' +
        '<span style="font-size:11px;color:' + tone + ';font-weight:800;white-space:nowrap;">' + _num(a.margin).toFixed(1).replace('.', ',') + '%</span>' +
        '<span style="font-size:10.5px;color:' + tone + ';font-weight:750;background:#FAF8F4;border-radius:999px;padding:4px 7px;white-space:nowrap;">' + _esc(a.status || 'sem dados') + '</span>' +
      '</div>' +
    '</div>';
  }

  function _combinationFromSoldItem(product, item) {
    var structured = _structuredSoldChoices(item);
    if (structured.length) return _combinationFromStructuredChoices(product, structured);
    return _combinationFromChoiceText(product, item);
  }

  function _structuredSoldChoices(item) {
    var fields = ['menuChoices', 'choiceDetails', 'selectedChoiceDetails', 'variantChoices'];
    for (var i = 0; i < fields.length; i++) {
      var key = fields[i];
      var list = item && item[key];
      if (Array.isArray(list) && list.length) {
        return list.filter(function (choice) { return choice && typeof choice === 'object'; });
      }
    }
    return [];
  }

  function _combinationFromStructuredChoices(product, choices) {
    var groups = _menuGroupsForCombinations(product);
    var selections = [];
    var extraPrice = 0;
    groups.forEach(function (group) {
      var selected = [];
      choices.forEach(function (choice) {
        var groupMatch = _choiceGroupMatches(group, choice.groupId, choice.groupName || choice.group || choice.title);
        if (!groupMatch) return;
        var option = _matchMenuOption(group, choice.optionName || choice.name || choice.label || choice.value, choice.ref || choice.optionRef || choice.stockRef || choice.stockItemRef);
        if (!option) return;
        var qty = _num(choice.quantity != null ? choice.quantity : choice.qty != null ? choice.qty : choice.count) || 1;
        selected.push(Object.assign({}, option, { qty: qty }));
        extraPrice += _num(option.priceExtra) * qty;
      });
      if (selected.length) selections.push({ groupId: group.id, groupName: group.title, options: selected });
    });
    if (!selections.length) return null;
    return { selections: selections, extraPrice: extraPrice, label: _menuCombinationLabel(selections) };
  }

  function _combinationFromChoiceText(product, item) {
    var groups = _menuGroupsForCombinations(product);
    var texts = Array.isArray(item && item.choices) ? item.choices : [];
    var selections = [];
    var extraPrice = 0;
    groups.forEach(function (group) {
      var selected = [];
      texts.forEach(function (choiceText) {
        var parsed = _parseSoldChoiceText(choiceText);
        if (!_choiceGroupMatches(group, '', parsed.group)) return;
        parsed.options.forEach(function (parsedOption) {
          var option = _matchMenuOption(group, parsedOption.name, '');
          if (!option) return;
          selected.push(Object.assign({}, option, { qty: parsedOption.qty }));
          extraPrice += _num(option.priceExtra) * parsedOption.qty;
        });
      });
      if (selected.length) selections.push({ groupId: group.id, groupName: group.title, options: selected });
    });
    if (!selections.length) return null;
    return { selections: selections, extraPrice: extraPrice, label: _menuCombinationLabel(selections) };
  }

  function _parseSoldChoiceText(value) {
    var text = String(value || '');
    var parts = text.split(':');
    var group = parts.length > 1 ? parts.shift() : '';
    var rest = parts.join(':') || text;
    return {
      group: group.trim(),
      options: rest.split(',').map(function (part) {
        var raw = String(part || '').trim();
        var match = raw.match(/\s+x\s*(\d+)\s*$/i);
        var qty = match ? parseInt(match[1], 10) || 1 : 1;
        var name = match ? raw.replace(/\s+x\s*\d+\s*$/i, '').trim() : raw;
        return { name: name, qty: qty };
      }).filter(function (item) { return item.name; })
    };
  }

  function _choiceGroupMatches(group, groupId, groupName) {
    if (groupId && String(group.id || '') === String(groupId)) return true;
    var wanted = _fold(groupName || '');
    if (!wanted) return false;
    return _fold(group.title || '') === wanted || _fold(group.name || '') === wanted;
  }

  function _matchMenuOption(group, optionName, ref) {
    var refKey = String(ref || '').trim();
    var nameKey = _fold(optionName || '');
    return (group.options || []).find(function (option) {
      return (refKey && String(option.ref || '') === refKey) || (nameKey && (_fold(option.label || '') === nameKey || _fold(option.name || '') === nameKey));
    }) || null;
  }

  function _validOrderForSoldMargin(order) {
    var status = _fold(_firstText(order && order.status, order && order.orderStatus, ''));
    return status !== 'cancelado' && status !== 'cancelada' && status !== 'cancelled' && status !== 'estornado';
  }

  function _orderItemsForMargin(order) {
    return Array.isArray(order && order.items) ? order.items
      : Array.isArray(order && order.orderItems) ? order.orderItems
      : Array.isArray(order && order.products) ? order.products
      : [];
  }

  function _orderItemMatchesProduct(item, productId, productName) {
    var itemId = String(_firstText(item && item.id, item && item.productId, item && item.product_id, item && item.itemId, ''));
    if (productId && itemId && itemId === productId) return true;
    return productName && _fold(_firstText(item && item.name, item && item.productName, item && item.title, '')) === productName;
  }

  function _orderItemTotal(item, qty) {
    var total = _num(item && (item.total != null ? item.total : item.subtotal != null ? item.subtotal : item.lineTotal));
    if (total > 0) return total;
    return _num(item && (item.price != null ? item.price : item.unitPrice != null ? item.unitPrice : item.valorUnitario)) * (_num(qty) || 1);
  }

  function _channelForOrder(order) {
    var raw = _fold(_firstText(order && order.channelName, order && order.salesChannelName, order && order.channel, order && order.source, order && order.originChannel, ''));
    var found = (_data.canais || []).find(function (channel) {
      return _fold(channel && channel.name || '') === raw;
    });
    return found || (raw ? { name: _firstText(order.channelName, order.salesChannelName, order.channel, order.source, order.originChannel, 'Canal'), commissionPct: _num(order.channelCommissionPct), fixedFee: _num(order.channelFixedFee), taxPct: _num(order.channelCommissionTaxPct || order.channelTaxPct) } : _cardapioChannel());
  }

  function _menuCombinationMetric(label, value, note) {
    return '<div style="background:#fff;border:1px solid #EFE5E1;border-radius:12px;padding:9px 10px;">' +
      '<span style="display:block;font-size:10px;font-weight:800;color:#8A7E7C;text-transform:uppercase;letter-spacing:.04em;">' + _esc(label) + '</span>' +
      '<strong style="display:block;font-size:13px;color:#1F1F1F;margin-top:3px;line-height:1.25;">' + _esc(value) + '</strong>' +
      '<small style="display:block;font-size:10.5px;color:#6F6860;line-height:1.3;margin-top:3px;">' + _esc(note || '') + '</small>' +
    '</div>';
  }

  function _updateProductPriceModal(useChannelPrice) {
    var id = _val('din-modal-product-id');
    var product = (_data.products || []).find(function (item) { return String(item.id) === String(id); });
    if (!product) return;
    var channel = parseInt(_val('din-modal-channel'), 10) || 0;
    var opts = (_data.canais || [_defaultChannel()]).map(function (ch, idx) {
      return '<option value="' + idx + '">' + _esc(ch.name || ('Canal ' + (idx + 1))) + '</option>';
    }).join('');
    _renderProductPriceModal({ product: product }, channel, opts, { useChannelPrice: !!useChannelPrice });
  }

  function _breakEvenPrice(cost, channel) {
    if (cost <= 0) return 0;
    var parts = _feeParts(channel);
    var divisor = 1 - (parts.pct / 100);
    if (divisor <= 0) return cost + parts.fixed;
    return Math.round(((cost + parts.fixed) / divisor) * 100) / 100;
  }

  function _priceDistribution(analysis) {
    var price = Math.max(analysis.price || 0, 0);
    var parts = [
      { label: 'Custo base', value: analysis.ingredientCost, color: '#C4362A', percentBase: price, group: 'cost', details: analysis.costDetails && analysis.costDetails.ingredients || [] },
      { label: 'Embalagem', value: analysis.packagingCost, color: '#E6A93B', percentBase: price, group: 'cost', details: analysis.costDetails && analysis.costDetails.packaging || [] },
      { label: 'Custos indiretos', value: analysis.indirectCost, color: '#6B7280', percentBase: price, group: 'cost' }
    ].filter(function (p) { return p.value > 0; });
    (_feeBreakdown(price, analysis.channel, analysis.product) || []).forEach(function (fee) {
      parts.push(Object.assign({}, fee, { group: fee.label === 'IVA aplicado' || fee.label === 'Imposto sobre comissão' ? 'tax' : 'fee' }));
    });
    var irpf = _irpfEstimatedOnProfit(analysis);
    if (_fiscalEnabled() && irpf > 0) parts.push({ label: 'IRPF estimado', value: irpf, color: '#BE123C', percentBase: price, group: 'tax' });
    if (analysis.profit > 0) parts.push({ label: _fiscalEnabled() ? 'Lucro depois da estimativa fiscal' : 'Lucro', value: Math.max(0, analysis.profit - irpf), color: '#1A9E5A', percentBase: price, group: 'result' });
    var total = 1;
    var markupBase = Math.max(_num(analysis.totalCost), 0);
    var costsTotal = parts.filter(function (p) { return p.group === 'cost'; }).reduce(function (s, p) { return s + Math.max(0, p.value); }, 0);
    var feesTotal = parts.filter(function (p) { return p.group === 'fee' || p.group === 'tax'; }).reduce(function (s, p) { return s + Math.max(0, p.value); }, 0);
    var resultTotal = parts.filter(function (p) { return p.group === 'result'; }).reduce(function (s, p) { return s + Math.max(0, p.value); }, 0);
    var costLikeTotal = costsTotal + feesTotal;
    var lossAmount = Math.max(0, -_num(analysis.profit));
    var hasLoss = lossAmount > 0;
    var distributedTotal = hasLoss ? Math.min(price, costLikeTotal) : parts.reduce(function (s, p) { return s + Math.max(0, p.value); }, 0);
    total = Math.max(hasLoss ? costLikeTotal : distributedTotal, 1);
    function pctText(value, base) {
      var pct = (base || price) > 0 ? (value / (base || price)) * 100 : 0;
      return pct.toFixed(1).replace('.', ',') + '%';
    }
    function markupText(value) {
      if (markupBase <= 0) return '—';
      return (value / markupBase).toFixed(2).replace('.', ',') + 'x';
    }
    function metricsHTML(value, base, mutedPct) {
      var pct = (base || price) > 0 ? (value / (base || price)) * 100 : 0;
      return '<span style="font-weight:700;">' + UI.fmt(value) + '</span>' +
        '<span style="color:#1A1A1A;font-weight:' + (mutedPct ? '500' : '650') + ';"> · ' + pct.toFixed(1).replace('.', ',') + '%</span>' +
        '<span style="color:#8A7E7C;font-weight:500;"> · ' + markupText(value) + '</span>';
    }
    function summaryCard(label, value, color, note) {
      return '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:10px 12px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
        '<div style="font-size:10.5px;font-weight:650;letter-spacing:.04em;text-transform:uppercase;color:#6F6860;margin-bottom:6px;">' + _esc(label) + '</div>' +
        '<div style="display:flex;align-items:center;gap:7px;"><i style="width:9px;height:9px;border-radius:50%;background:' + color + ';display:inline-block;"></i><strong style="font-size:17px;font-weight:700;color:#1F1F1F;">' + UI.fmt(value) + '</strong></div>' +
        '<div style="font-size:11px;color:#8A7E7C;margin-top:4px;">' + (note ? _esc(note) : pctText(value) + ' do preço · ' + markupText(value) + ' do markup') + '</div>' +
        '</div>';
    }
    var bar = parts.map(function (p) {
      var width = Math.max(0, (p.value / total) * 100);
      if (!width) return '';
      return '<div title="' + _esc(p.label + ': ' + UI.fmt(p.value)) + '" style="width:' + width + '%;background:' + p.color + ';height:18px;"></div>';
    }).join('');
    function rowHTML(p, opts) {
      opts = opts || {};
      var base = p.percentBase || price;
      var separate = p.label.indexOf('Comissão ') === 0 || p.label === 'Imposto sobre comissão';
      var details = _costDetailRows(p, base);
      return '<div style="border-bottom:1px solid #F2EDED;' + (separate ? 'background:#FFFCF8;border-radius:10px;padding:0 8px;' : '') + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:' + (separate ? '10px 0' : '8px 0') + ';"><span style="display:flex;align-items:center;gap:8px;font-size:13px;color:#1F1F1F;line-height:1.35;"><i style="width:9px;height:9px;border-radius:50%;background:' + p.color + ';display:inline-block;flex:0 0 auto;"></i>' + _esc(p.label) + '</span><span style="white-space:nowrap;font-size:13px;color:#1F1F1F;">' + metricsHTML(p.value, base, opts.mutedPct) + '</span></div>' +
        details +
      '</div>';
    }
    function _costDetailRows(p, base) {
      var details = (p.details || []).filter(function (item) { return _num(item.value) > 0; });
      if (!details.length) return '';
      return '<div style="display:flex;flex-direction:column;gap:4px;padding:0 0 8px 21px;">' + details.map(function (item) {
        var pct = base > 0 ? (_num(item.value) / base) * 100 : 0;
        return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;color:#6F6860;font-size:12px;line-height:1.35;">' +
          '<span style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(item.label || 'Item') + '</span>' +
          '<span style="white-space:nowrap;"><strong style="color:#1F1F1F;font-weight:650;">' + UI.fmt(_num(item.value)) + '</strong> · ' + pct.toFixed(1).replace('.', ',') + '%</span>' +
        '</div>';
      }).join('') + '</div>';
    }
    var costLikeParts = parts.filter(function (p) { return p.group !== 'result'; });
    var resultParts = parts.filter(function (p) { return p.group === 'result'; });
    var rows = costLikeParts.map(function (p) {
      return rowHTML(p, { mutedPct: true });
    }).join('');
    if (costLikeParts.length) {
      rows += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 0;padding:10px 0 8px;border-top:1px solid #E8DCD7;border-bottom:1px solid #F2EDED;"><span style="font-weight:700;color:#1F1F1F;">Custo + taxas</span><span style="white-space:nowrap;font-size:13px;color:#1F1F1F;">' + metricsHTML(costLikeTotal, price, true) + '</span></div>';
    }
    rows += resultParts.map(function (p) {
      return rowHTML(p, { mutedPct: false });
    }).join('');
    if (hasLoss) {
      rows += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 0;padding:10px 0 8px;border-top:1px solid #E8DCD7;border-bottom:1px solid #F2EDED;"><span style="display:flex;align-items:center;gap:8px;font-weight:700;color:#991B1B;"><i style="width:9px;height:9px;border-radius:50%;background:#991B1B;display:inline-block;flex:0 0 auto;"></i>Falta para cobrir</span><span style="white-space:nowrap;font-size:13px;color:#1F1F1F;">' + metricsHTML(lossAmount, price, false) + '</span></div>';
    }
    var empty = !parts.length ? '<div style="padding:10px;color:#8A7E7C;background:#F8F6F5;border-radius:10px;">Sem custos ou taxas cadastradas para distribuir.</div>' : '';
    var priceCoverageNote = hasLoss && costLikeTotal > 0 ? 'cobre ' + ((price / costLikeTotal) * 100).toFixed(1).replace('.', ',') + '% do custo + taxas' : '100,0% do preço';
    var summaries = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px;">' +
      summaryCard('Custos', costsTotal, '#C4362A') +
      summaryCard('Taxas, impostos e comissões', feesTotal, '#6B7280') +
      (hasLoss ? summaryCard('Falta para cobrir', lossAmount, '#991B1B', pctText(lossAmount) + ' além do preço atual') : summaryCard('Resultado', resultTotal, '#1A9E5A')) +
      summaryCard(hasLoss ? 'Preço atual' : 'Total distribuído', hasLoss ? price : distributedTotal, '#1A1A1A', priceCoverageNote) +
      '</div>';
    var totalRow = parts.length ? '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;padding:10px 0 0;border-top:1px solid #E8DCD7;"><span style="font-weight:700;color:#1F1F1F;">' + (hasLoss ? 'Preço atual' : 'Soma total') + '</span><span style="white-space:nowrap;font-size:13px;color:#1F1F1F;">' + metricsHTML(hasLoss ? price : distributedTotal, price, false) + '</span></div>' : '';
    var lossNotice = hasLoss ? '<div style="margin:0 0 10px;padding:10px 12px;border-radius:12px;background:#FFF0EE;border:1px solid #F2C8C2;color:#7A271A;font-size:12.5px;line-height:1.45;">O preço atual não cobre custo e taxas.</div>' : '';
    return summaries + lossNotice + '<div style="display:flex;overflow:hidden;border-radius:999px;background:#F8F1ED;margin-bottom:10px;">' + bar + '</div>' + rows + totalRow + empty;
  }

  function _irpfEstimatedOnProfit(analysis) {
    return Math.max(0, _num(analysis.profit)) * _fiscalIrpfPct() / 100;
  }

  function _afterFiscalProfit(analysis) {
    return _num(analysis.profit) - _irpfEstimatedOnProfit(analysis);
  }

  function _priceForChannel(product, channel) {
    if (_isCardapioChannel(channel)) return _num(product.price || product.preco || product.preco_venda || 0);
    var prices = product.channelPrices || {};
    return _num(prices[channel.name || ''] || product.price || product.preco || product.preco_venda || 0);
  }

  function _productImage(product) {
    product = product || {};
    return product.imageBase64 || product.imageUrl || product.image || product.foto || '';
  }

  function _saveProductPrice(id) {
    var price = _moneyInputValue(_val('din-modal-price'));
    if (!price || price <= 0) {
      UI.toast('Informe um preço de venda válido.', 'error');
      return;
    }
    var channels = _data.canais || [_defaultChannel()];
    var channel = channels[parseInt(_val('din-modal-channel'), 10) || 0] || _defaultChannel();
    var product = (_data.products || []).find(function (item) { return String(item.id) === String(id); }) || {};
    var update = {};
    if (_isCardapioChannel(channel)) {
      update.price = price;
    } else {
      var channelPrices = Object.assign({}, product.channelPrices || {});
      channelPrices[channel.name || 'Canal'] = price;
      update.channelPrices = channelPrices;
    }
    DB.update('products', id, update).then(function () {
      var p = (_data.products || []).find(function (item) { return String(item.id) === String(id); });
      if (p) Object.assign(p, update);
      window._dinProducts = _productsAnalysis();
      _renderSub();
      _updateProductPriceModal();
      UI.toast('Preço de venda atualizado.', 'success');
    }).catch(function (err) {
      UI.toast('Erro ao salvar preço: ' + err.message, 'error');
    });
  }

  function _closeProductModal(ev) {
    if (ev && ev.target && ev.target.id !== 'din-price-modal') return;
    var el = document.getElementById('din-price-modal');
    if (el) el.remove();
  }

  function _priceModalCardStyle() {
    return 'background:linear-gradient(180deg,#fff 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:14px;box-shadow:0 10px 24px rgba(31,31,31,.045);';
  }

  function _priceModalSectionTitle(title, desc, icon) {
    return '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:13px;">' +
      '<span class="mi" style="width:31px;height:31px;border-radius:12px;background:#FAF8F4;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto;">' + _esc(icon || 'insights') + '</span>' +
      '<div style="min-width:0;"><h3 style="font-size:15px;font-weight:700;line-height:1.2;margin:0;color:#1F1F1F;">' + _esc(title) + '</h3>' +
      '<p style="font-size:12.5px;font-weight:400;color:#6F6860;line-height:1.45;margin:5px 0 0;max-width:620px;">' + _esc(desc || '') + '</p></div>' +
    '</div>';
  }

  function _priceModalLabel() {
    return 'display:block;font-size:11px;font-weight:650;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;';
  }

  function _priceModalInput(extra) {
    return 'width:100%;height:42px;border:1px solid #E8DCD7;border-radius:12px;background:#FFFCF8;padding:0 12px;color:#1F1F1F;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;' + (extra || '');
  }

  function _priceModalSelect(extra) {
    return _priceModalInput('appearance:none;-webkit-appearance:none;background-color:#FFFCF8;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:36px;' + (extra || ''));
  }

  function _priceMetric(label, value, note) {
    return '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:11px 12px;min-height:74px;box-shadow:0 1px 2px rgba(31,31,31,.03);">' +
      '<div style="font-size:10.5px;font-weight:650;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;">' + _esc(label) + '</div>' +
      '<div style="font-size:19px;font-weight:700;color:#1F1F1F;margin-top:6px;line-height:1.05;">' + value + '</div>' +
      '<div style="font-size:11.5px;color:#6F6860;margin-top:4px;line-height:1.35;">' + _esc(note || '') + '</div>' +
      '</div>';
  }

  function _priceStatusMetric(status, channelName) {
    return '<div style="background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:11px 12px;min-height:74px;box-shadow:0 1px 2px rgba(31,31,31,.03);display:flex;flex-direction:column;justify-content:center;">' +
      '<div style="font-size:10.5px;font-weight:650;color:#6F6860;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">Status</div>' +
      '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap;">' + _statusBadge(status) +
        '<span style="font-size:12.5px;color:#6F6860;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;">' + _esc(channelName || 'canal') + '</span>' +
      '</div>' +
    '</div>';
  }

  function _renderSimulador() {
    var channelOpts = (_data.canais || []).map(function (ch, idx) { return '<option value="' + idx + '">' + _esc(ch.name) + '</option>'; }).join('');
    var inputStyle = _listingFieldStyle('height:42px;');
    var selectStyle = _listingSelectStyle('height:42px;');
    var labelStyle = _listingLabelStyle();
    function simField(id, label, value, type, readonly) {
      return '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">' + _esc(label) + '</span><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '"' + (readonly ? ' readonly' : '') + ' style="' + inputStyle + (readonly ? 'background:#FAF8F4;color:#6F6860;' : '') + '"></label>';
    }
    function simMoneyField(id, label, value) {
      return '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">' + _esc(label) + '</span><input id="' + id + '" type="text" inputmode="decimal" value="' + _esc(_moneyDisplay(value, true)) + '" placeholder="€0,00" onfocus="Modules.Dinheiro._moneyInputFocus(this)" onblur="Modules.Dinheiro._moneyInputBlur(this)" style="' + inputStyle + 'text-align:right;"></label>';
    }
    _content('<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.2;margin:0 0 6px;color:#1F1F1F;">Simulador</h2>' +
          '<p style="font-size:13px;font-weight:400;color:#6F6860;line-height:1.45;max-width:760px;margin:0;">Teste preço, desconto e taxas antes de mudar qualquer produto da loja.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Dinheiro._switchSub(\'precos\')" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Ver composição</button>' +
          '<button type="button" onclick="Modules.Dinheiro._switchSub(\'regras\')" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Regras de preço</button>' +
        '</div>' +
      '</div>' +
      '<section style="' + _listingFilterCardStyle() + '">' +
      _sectionTitle('Dados para testar', 'Preencha os valores e veja na hora como eles afetam lucro e margem.', 'calculate') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,180px));gap:12px;align-items:end;">' +
      simMoneyField('sim-price', 'Preço de venda', 10) +
      simMoneyField('sim-cost', 'Custo do produto', 3) +
      simField('sim-discount', 'Desconto %', '0', 'number') +
      '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Canal de venda</span><select id="sim-channel" onchange="Modules.Dinheiro._applySimulatorChannel()" style="' + selectStyle + '">' + channelOpts + '</select></label>' +
      simField('sim-commission', 'Comissão %', '0', 'number') +
      simField('sim-commission-tax', 'Imposto sobre comissão %', '0', 'number') +
      simMoneyField('sim-fixed', 'Taxa fixa', 0) +
      simField('sim-iva-readonly', 'IVA configurado %', _fiscalIvaPct(), 'text', true) +
      simField('sim-irpf-readonly', 'Imposto de renda %', _fiscalIrpfPct(), 'text', true) +
      '</div></section><section id="sim-result" style="' + _listingFilterCardStyle() + '"></section></div>');
    ['sim-price','sim-cost','sim-discount','sim-commission','sim-commission-tax','sim-fixed'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.oninput = _updateSimulador;
    });
    _applySimulatorChannel();
  }

  function _applySimulatorChannel() {
    var ch = (_data.canais || [])[parseInt((document.getElementById('sim-channel') || {}).value, 10) || 0] || {};
    var commission = document.getElementById('sim-commission');
    var commissionTax = document.getElementById('sim-commission-tax');
    var fixed = document.getElementById('sim-fixed');
    if (commission) commission.value = _num(ch.commissionPct);
    if (commissionTax) commissionTax.value = _num(ch.taxPct || (ch.commissionPct ? 21 : 0));
    if (fixed) fixed.value = _moneyDisplay(_num(ch.fixedFee), true);
    _updateSimulador();
  }

  function _updateSimulador() {
    var price = _moneyInputValue(_val('sim-price'));
    var discount = _num(_val('sim-discount'));
    var netPrice = price * (1 - discount / 100);
    var cost = _moneyInputValue(_val('sim-cost'));
    var commission = netPrice * _num(_val('sim-commission')) / 100;
    var commissionTax = commission * _num(_val('sim-commission-tax')) / 100;
    var fixed = _moneyInputValue(_val('sim-fixed'));
    var fees = commission + commissionTax + fixed;
    var profitBeforeFiscal = netPrice - cost - fees;
    var iva = netPrice * _fiscalIvaPct() / 100;
    var irpfBase = Math.max(0, profitBeforeFiscal - iva);
    var incomeTax = irpfBase * _fiscalIrpfPct() / 100;
    var profit = profitBeforeFiscal - iva - incomeTax;
    var margin = netPrice > 0 ? profit / netPrice * 100 : 0;
    var markup = cost > 0 ? netPrice / cost : 0;
    var el = document.getElementById('sim-result');
    if (el) el.innerHTML = _sectionTitle('Resultado da simulação', 'Os destaques mudam de cor conforme o impacto no lucro e na margem.') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">' +
      _radarKpi('Preço líquido', UI.fmt(netPrice), 'após desconto', 'neutral', 'sell') +
      _radarKpi('Comissão', UI.fmt(commission), _num(_val('sim-commission')).toFixed(1).replace('.', ',') + '% sobre venda', commission > 0 ? 'warning' : 'neutral', 'percent') +
      _radarKpi('Imposto comissão', UI.fmt(commissionTax), _num(_val('sim-commission-tax')).toFixed(1).replace('.', ',') + '% sobre comissão', commissionTax > 0 ? 'warning' : 'neutral', 'receipt_long') +
      _radarKpi('Taxa fixa', UI.fmt(fixed), 'por pedido', fixed > 0 ? 'warning' : 'neutral', 'payments') +
      '</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:12px;">' +
      _radarKpi('IVA', UI.fmt(iva), _fiscalIvaPct().toFixed(1).replace('.', ',') + '% configurado', iva > 0 ? 'warning' : 'neutral', 'account_balance') +
      _radarKpi('Imposto de renda', UI.fmt(incomeTax), _fiscalIrpfPct().toFixed(1).replace('.', ',') + '% estimado', incomeTax > 0 ? 'warning' : 'neutral', 'request_quote') +
      _radarKpi('Lucro estimado', UI.fmt(profit), 'após impostos e taxas', profit < 0 ? 'danger' : 'success', 'trending_up') +
      _radarKpi('Margem real', margin.toFixed(1).replace('.', ',') + '%', 'após impostos e taxas', margin < 0 ? 'danger' : (margin < _num(_data.dinheiro.minMarginPct || 40) ? 'warning' : 'success'), 'query_stats') +
      _radarKpi('Markup', markup ? markup.toFixed(2).replace('.', ',') + 'x' : '—', 'preço líquido / custo', markup ? 'neutral' : 'warning', 'calculate') +
      '</div>';
  }

  function _renderCustos() {
    var g = _data.geral || {};
    var mode = g.indirectCostMode || 'manual';
    var months = String(g.indirectCostMonths || 6);
    _settings('Custos e despesas', 'Modo dos custos indiretos estimados usado nas receitas e preços.', [
      '<label style="' + _labelWrap() + '"><span style="' + _label() + '">Modo dos custos indiretos estimados</span><select id="dn-ind-mode" style="' + _input() + '"><option value="manual"' + (mode === 'manual' ? ' selected' : '') + '>Manual por percentual</option><option value="automatico"' + (mode === 'automatico' ? ' selected' : '') + '>Automático por média dos últimos meses</option></select></label>',
      _field('dn-ind-pct', 'Percentual manual de custos indiretos', g.indirectCostPercent || 0, 'number'),
      '<label style="' + _labelWrap() + '"><span style="' + _label() + '">Período para cálculo automático</span><select id="dn-ind-months" style="' + _input() + '"><option value="3"' + (months === '3' ? ' selected' : '') + '>3 meses</option><option value="6"' + (months === '6' ? ' selected' : '') + '>6 meses</option><option value="12"' + (months === '12' ? ' selected' : '') + '>12 meses</option></select></label>'
    ].join(''), function () {
      return Object.assign({}, _data.geral, {
        indirectCostMode: _val('dn-ind-mode') || 'manual',
        indirectCostPercent: _num(_val('dn-ind-pct')),
        indirectCostMonths: parseInt(_val('dn-ind-months'), 10) || 6
      });
    }, 'geral');
  }

  function _renderRegras() {
    var c = _data.dinheiro;
    var channels = _data.canais || [];
    var inputStyle = _listingFieldStyle('height:42px;');
    var selectStyle = _listingSelectStyle('height:42px;');
    var labelStyle = _listingLabelStyle();
    function ruleField(id, label, value) {
      return '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">' + _esc(label) + '</span><input id="' + id + '" type="text" inputmode="decimal" value="' + _esc(value == null ? '' : value) + '" style="' + inputStyle + '"></label>';
    }
    _content('<div class="bf-page" style="display:flex;flex-direction:column;gap:16px;">' +
      '<div class="bf-page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
        '<div style="min-width:0;flex:1 1 420px;">' +
          '<h2 style="font-size:22px;font-weight:700;line-height:1.2;margin:0 0 6px;color:#1F1F1F;">Regras de preço</h2>' +
          '<p style="font-size:13px;font-weight:400;color:#6F6860;line-height:1.45;max-width:760px;margin:0;">Defina a margem que sua loja quer proteger e as taxas usadas nos cálculos de preço.</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
          '<button type="button" onclick="Modules.Dinheiro._switchSub(\'resumo\')" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Ver Radar</button>' +
          '<button type="button" onclick="Modules.Dinheiro._saveRegras()" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Salvar regras</button>' +
        '</div>' +
      '</div>' +
      '<section style="' + _listingFilterCardStyle() + '">' +
      _sectionTitle('Regras gerais', 'Use estes valores como referência para sugerir preços e apontar margens apertadas.', 'tune') +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,210px));gap:12px;align-items:end;">' +
      ruleField('dn-margin', 'Margem desejada padrão %', c.desiredMarginPct) +
      ruleField('dn-min-margin', 'Margem mínima aceitável %', c.minMarginPct) +
      ruleField('dn-markup', 'Markup padrão', c.defaultMarkup) +
      '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Arredondamento de preço</span><select id="dn-round" style="' + selectStyle + '"><option value="90"' + (c.rounding === '90' ? ' selected' : '') + '>Terminar em ,90</option><option value="95"' + (c.rounding === '95' ? ' selected' : '') + '>Terminar em ,95</option><option value="cheio"' + (c.rounding === 'cheio' ? ' selected' : '') + '>Número cheio</option></select></label>' +
      '</div></section>' +
      '<section style="' + _listingFilterCardStyle() + '">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;">' +
        '<div>' + _sectionTitle('Canais de venda', 'Informe as taxas de cada canal para entender o impacto real na margem.', 'storefront') + '</div>' +
        '<button type="button" onclick="Router.navigate(\'configuracoes/canais_venda\')" style="height:38px;padding:0 14px;border:1px solid #EAE4DA;border-radius:10px;background:#fff;color:#1F1F1F;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(31,31,31,.03);font-family:inherit;">Gerenciar canais</button>' +
      '</div>' +
      '<div id="dn-channel-list" style="display:grid;gap:10px;">' + _channelRows(channels) + '</div>' +
      '</section>' +
      '<div style="display:flex;justify-content:flex-end;"><button id="din-save-rules" onclick="Modules.Dinheiro._saveRegras()" style="height:38px;padding:0 14px;border:none;border-radius:10px;background:#B42318;color:#fff;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 4px 12px rgba(180,35,24,.18);font-family:inherit;">Salvar regras</button></div>' +
      '</div>');
  }

  function _channelRows(list) {
    if (!list.length) list = _normalizeChannels({});
    return list.map(function (ch, idx) {
      var locked = ch.locked || _isCardapioChannel(ch) || _isTpvChannel(ch);
      var inputStyle = _listingFieldStyle('height:42px;');
      var labelStyle = _listingLabelStyle();
      return '<div data-dn-channel-row="' + idx + '" style="display:grid;grid-template-columns:minmax(180px,1.2fr) minmax(116px,.6fr) minmax(116px,.6fr) minmax(134px,.7fr) 38px;gap:10px;align-items:end;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:16px;padding:12px;box-shadow:0 10px 24px rgba(31,31,31,.045);transition:transform .16s ease,box-shadow .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.085)\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 10px 24px rgba(31,31,31,.045)\'">' +
        '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Canal</span><input id="dn-ch-name-' + idx + '" value="' + _esc(ch.name || '') + '" readonly style="' + inputStyle + 'background:#fff;font-weight:600;color:#1F1F1F;"></label>' +
        '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Comissão %</span><input id="dn-ch-commission-' + idx + '" type="text" inputmode="decimal" value="' + _esc(ch.commissionPct || 0) + '" ' + (locked ? 'readonly' : '') + ' style="' + inputStyle + (locked ? 'background:#FAF8F4;color:#6F6860;' : '') + '"></label>' +
        '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Taxa fixa</span><input id="dn-ch-fixed-' + idx + '" type="text" inputmode="decimal" value="' + _esc(_moneyDisplay(ch.fixedFee || 0, true)) + '" ' + (locked ? 'readonly' : 'onfocus="Modules.Dinheiro._moneyInputFocus(this)" onblur="Modules.Dinheiro._moneyInputBlurOnly(this)"') + ' style="' + inputStyle + 'text-align:right;' + (locked ? 'background:#FAF8F4;color:#6F6860;' : '') + '"></label>' +
        '<label style="display:block;min-width:0;"><span style="' + labelStyle + '">Imposto comissão %</span><input id="dn-ch-tax-' + idx + '" type="text" inputmode="decimal" value="' + _esc(ch.taxPct || 0) + '" ' + (locked ? 'readonly' : '') + ' style="' + inputStyle + (locked ? 'background:#FAF8F4;color:#6F6860;' : '') + '"></label>' +
        '<span title="' + (locked ? 'Canal fixo do Cardápio' : 'Canal cadastrado em Configurações') + '" style="height:42px;border-radius:12px;background:' + (locked ? '#F0FAF4' : '#fff') + ';color:' + (locked ? '#1F6F43' : '#6F6860') + ';border:1px solid #E8DCD7;display:inline-flex;align-items:center;justify-content:center;font-weight:700;">✓</span>' +
      '</div>';
    }).join('');
  }

  function _collectCanaisVenda() {
    var existing = _data.canais || [];
    return [].slice.call(document.querySelectorAll('[data-dn-channel-row]')).map(function (row) {
      var idx = row.dataset.dnChannelRow;
      var name = _val('dn-ch-name-' + idx);
      var prev = existing.find(function (ch) { return String(ch.name || '').toLowerCase() === String(name || '').toLowerCase(); }) || {};
      return {
        name: name,
        commissionPct: _num(_val('dn-ch-commission-' + idx)),
        fixedFee: _moneyInputValue(_val('dn-ch-fixed-' + idx)),
        taxPct: _num(_val('dn-ch-tax-' + idx)),
        minMarginPct: _num(prev.minMarginPct),
        differentPrice: !!prev.differentPrice,
        entradaCategoriaId: String(prev.entradaCategoriaId || prev.incomeCategoryId || prev.categoriaEntradaId || prev.financialCategoryId || prev.categoriaFinanceiraId || ''),
        entradaCategoriaNome: String(prev.entradaCategoriaNome || prev.incomeCategoryName || prev.categoriaEntradaNome || prev.financialCategoryName || prev.categoriaFinanceiraNome || ''),
        incomeCategoryId: String(prev.incomeCategoryId || prev.entradaCategoriaId || prev.categoriaEntradaId || prev.financialCategoryId || prev.categoriaFinanceiraId || ''),
        incomeCategoryName: String(prev.incomeCategoryName || prev.entradaCategoriaNome || prev.categoriaEntradaNome || prev.financialCategoryName || prev.categoriaFinanceiraNome || ''),
        categoriaEntradaId: String(prev.categoriaEntradaId || prev.entradaCategoriaId || prev.incomeCategoryId || prev.financialCategoryId || prev.categoriaFinanceiraId || ''),
        categoriaEntradaNome: String(prev.categoriaEntradaNome || prev.entradaCategoriaNome || prev.incomeCategoryName || prev.financialCategoryName || prev.categoriaFinanceiraNome || ''),
        financialCategoryId: String(prev.financialCategoryId || prev.entradaCategoriaId || prev.incomeCategoryId || prev.categoriaEntradaId || prev.categoriaFinanceiraId || ''),
        financialCategoryName: String(prev.financialCategoryName || prev.entradaCategoriaNome || prev.incomeCategoryName || prev.categoriaEntradaNome || prev.categoriaFinanceiraNome || ''),
        categoriaFinanceiraId: String(prev.categoriaFinanceiraId || prev.entradaCategoriaId || prev.incomeCategoryId || prev.categoriaEntradaId || prev.financialCategoryId || ''),
        categoriaFinanceiraNome: String(prev.categoriaFinanceiraNome || prev.entradaCategoriaNome || prev.incomeCategoryName || prev.categoriaEntradaNome || prev.financialCategoryName || ''),
        locked: _isCardapioChannel({ name: name }) || _isTpvChannel({ name: name }) || !!prev.locked
      };
    }).filter(function (ch) { return !!ch.name; });
  }

  function _validatePriceRules(dinheiro, canais) {
    var desired = _num(dinheiro.desiredMarginPct);
    var min = _num(dinheiro.minMarginPct);
    var markup = _num(dinheiro.defaultMarkup);
    if (desired <= 0 || desired >= 95) return 'A margem desejada precisa ficar entre 1% e 94%.';
    if (min <= 0 || min >= 95) return 'A margem mínima precisa ficar entre 1% e 94%.';
    if (min > desired) return 'A margem mínima não pode ser maior que a margem desejada.';
    if (markup <= 0) return 'O markup precisa ser maior que zero.';
    if (markup > 20) return 'O markup está muito alto. Use um valor menor para evitar preços irreais.';
    var invalidChannel = (canais || []).find(function (ch) {
      return _num(ch.commissionPct) < 0 || _num(ch.fixedFee) < 0 || _num(ch.taxPct) < 0 || _num(ch.commissionPct) >= 100 || _num(ch.taxPct) >= 100;
    });
    if (invalidChannel) return 'Revise as taxas de ' + (invalidChannel.name || 'um canal') + '. Comissão, taxa fixa e imposto não podem ficar negativos, e percentuais precisam ser menores que 100%.';
    return '';
  }

  function _saveRegras() {
    var dinheiro = Object.assign({}, _data.dinheiro, {
      desiredMarginPct: _num(_val('dn-margin')),
      minMarginPct: _num(_val('dn-min-margin')),
      defaultMarkup: _num(_val('dn-markup')),
      rounding: _val('dn-round') || '90'
    });
    var canais = { list: _collectCanaisVenda() };
    var validationError = _validatePriceRules(dinheiro, canais.list);
    if (validationError) {
      UI.toast(validationError, 'error');
      return;
    }
    Promise.all([
      DB.setDocRoot('config', 'dinheiro', dinheiro),
      DB.setDocRoot('config', 'canais_venda', canais)
    ]).then(function () {
      _data.dinheiro = _normalizeMoneyConfig(dinheiro);
      _data.canais = _normalizeChannels(canais, _data.tpv || {});
      UI.toast('Regras de preço salvas', 'success');
      _renderRegras();
    }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
  }

  function _addCanalVenda() {
    _data.canais = _collectCanaisVenda().concat([{ name: '', commissionPct: 0, fixedFee: 0, taxPct: 21 }]);
    var list = document.getElementById('dn-channel-list');
    if (list) list.innerHTML = _channelRows(_data.canais);
  }

  function _removeCanalVenda(idx) {
    _data.canais = _collectCanaisVenda();
    if (_data.canais[idx] && _isCardapioChannel(_data.canais[idx])) {
      UI.toast('O canal Cardápio é fixo e não pode ser excluído.', 'info');
      return;
    }
    _data.canais.splice(idx, 1);
    var list = document.getElementById('dn-channel-list');
    if (list) list.innerHTML = _channelRows(_data.canais);
  }

  function _settings(title, desc, body, collect, configKey) {
    _content('<div style="background:#fff;border-radius:14px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,.06);max-width:900px;">' +
      '<h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">' + title + '</h2><p style="color:#8A7E7C;margin-bottom:16px;">' + desc + '</p>' +
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">' + body + '</div>' +
      '<button id="din-save-settings" style="margin-top:16px;background:#C4362A;color:#fff;border:none;padding:12px 18px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;">Salvar</button></div>');
    document.getElementById('din-save-settings').onclick = function () {
      var data = collect();
      DB.setDocRoot('config', configKey, data).then(function () {
        if (configKey === 'geral') _data.geral = data;
        else _data.dinheiro = _normalizeMoneyConfig(data);
        UI.toast('Configurações salvas', 'success');
      }).catch(function (err) { UI.toast('Erro: ' + err.message, 'error'); });
    };
  }

  function _content(html) {
    var el = document.getElementById('dinheiro-content');
    if (el) el.innerHTML = html;
  }

  function _radarKpi(label, value, note, tone, icon) {
    var palette = {
      danger: ['#FAF8F4', '#B42318'],
      warning: ['#FAF8F4', '#D97706'],
      success: ['#FAF8F4', '#6C8777'],
      neutral: ['#FAF8F4', '#8A6F5A']
    }[tone || 'neutral'] || ['#FAF8F4', '#8A6F5A'];
    return '<div class="kpi-tile" style="display:flex;align-items:center;gap:12px;background:' + palette[0] + ';border:none;border-radius:16px;padding:15px 16px;box-shadow:0 12px 30px rgba(31,31,31,.06);min-height:78px;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,background .16s ease;" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 16px 34px rgba(31,31,31,.09)\';this.style.background=\'#fff\'" onmouseleave="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 12px 30px rgba(31,31,31,.06)\';this.style.background=\'' + palette[0] + '\'">' +
      '<div style="width:46px;height:46px;border-radius:14px;background:transparent;color:' + palette[1] + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span class="mi" style="font-size:24px;color:' + palette[1] + ';">' + _esc(icon || 'query_stats') + '</span></div>' +
      '<div style="min-width:0;display:flex;flex-direction:column;gap:3px;">' +
        '<span style="display:block;font-size:12px;font-weight:500;color:#6F6860;line-height:1.15;">' + _esc(label) + '</span>' +
        '<strong style="display:block;font-family:inherit;font-size:30px;font-weight:700;color:#1F1F1F;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(value) + '</strong>' +
        '<span style="display:block;font-size:11px;color:#6F6860;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(note || '') + '</span>' +
      '</div>' +
    '</div>';
  }

  function _radarChip(text) {
    return '<span style="display:inline-flex;align-items:center;min-height:24px;padding:0 10px;border-radius:999px;background:#fff;color:#6F6860;font-size:12px;font-weight:500;border:1px solid #EAE4DA;box-shadow:0 1px 2px rgba(31,31,31,.02);">' + _esc(text) + '</span>';
  }

  function _cardStyle() { return 'background:#fff;border:none;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);'; }

  function _priorityFinanceCardStyle() {
    return 'background:#fff;border:1px solid #EADFD8;border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px rgba(31,31,31,.06);';
  }

  function _listingFilterCardStyle() {
    return 'background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:16px 18px;box-shadow:0 14px 34px rgba(31,31,31,.055);';
  }

  function _listingEmptyCardStyle() {
    return 'background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:32px 22px;text-align:center;box-shadow:0 14px 34px rgba(31,31,31,.055);';
  }

  function _listingLabelStyle() {
    return 'display:block;font-size:11px;font-weight:600;color:#6F6860;margin-bottom:6px;letter-spacing:.02em;';
  }

  function _listingFieldStyle(extra) {
    return 'padding:10px 12px;border:1px solid #E8DCD7;border-radius:12px;font-size:14px;font-family:inherit;outline:none;background:#FFFCF8;width:100%;box-sizing:border-box;color:#1F1F1F;box-shadow:inset 0 1px 0 rgba(255,255,255,.78);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;' + (extra || '');
  }

  function _listingSelectStyle(extra) {
    return _listingFieldStyle('appearance:none;-webkit-appearance:none;padding-right:34px;background-color:#FFFCF8;background-image:linear-gradient(45deg,transparent 50%,#8A7E7C 50%),linear-gradient(135deg,#8A7E7C 50%,transparent 50%);background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;' + (extra || ''));
  }

  function _radarPatternCardStyle() {
    return 'background:linear-gradient(180deg,#FFFFFF 0%,#FFFCFA 100%);border:1px solid #EADFD8;border-radius:18px;padding:18px 20px;box-shadow:0 14px 34px rgba(31,31,31,.055);';
  }

  function _radarInnerCardStyle(extra) {
    return 'background:#FFFCF8;border:1px solid #E8DCD7;border-radius:15px;padding:13px;box-shadow:0 10px 24px rgba(31,31,31,.045);transition:transform .16s ease,box-shadow .16s ease;' + (extra || '');
  }

  function _radarCompactMetric(label, value) {
    return '<span style="display:inline-flex;align-items:center;gap:4px;min-height:24px;padding:4px 7px;border-radius:999px;background:#fff;border:1px solid rgba(232,220,215,.78);font-size:11px;line-height:1;color:#6F6860;font-weight:650;white-space:nowrap;">' +
      '<span style="color:#8A7E7C;font-weight:600;">' + _esc(label) + '</span>' +
      '<strong style="color:#1F1F1F;font-weight:760;">' + _esc(value) + '</strong>' +
    '</span>';
  }

  function _radarEmptyBox(text) {
    return '<div style="background:#FFFCF8;border:1px dashed #E8DCD7;border-radius:16px;padding:14px 16px;color:#6F6860;font-size:13px;line-height:1.45;display:flex;align-items:center;gap:10px;min-height:54px;">' +
      '<span class="mi" style="width:28px;height:28px;border-radius:11px;background:#fff;color:#8A7E7C;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;">info</span>' +
      '<span>' + _esc(text) + '</span>' +
    '</div>';
  }

  function _radarChannelHighlight(text) {
    return '<div style="margin-bottom:10px;background:#FFFCF8;border:1px solid #E8DCD7;border-radius:14px;padding:10px 12px;color:#1F1F1F;font-size:12.5px;line-height:1.4;display:flex;align-items:center;gap:9px;">' +
      '<span class="mi" style="width:26px;height:26px;border-radius:10px;background:#fff;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;">trending_down</span>' +
      '<span>' + _esc(text) + '</span>' +
    '</div>';
  }

  function _radarSectionTitle(title, desc, icon) {
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">' +
      '<div style="min-width:0;display:flex;align-items:flex-start;gap:10px;">' +
        (icon ? '<span class="mi" style="width:31px;height:31px;border-radius:12px;background:#FAF8F4;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto;">' + _esc(icon) + '</span>' : '') +
        '<div style="min-width:0;">' +
          '<h3 style="font-size:15px;font-weight:700;margin:0;color:#1F1F1F;line-height:1.2;">' + _esc(title) + '</h3>' +
          '<p style="font-size:12.5px;color:#6F6860;line-height:1.45;margin:5px 0 0;max-width:560px;">' + _esc(desc || '') + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _sectionTitle(title, desc, icon) {
    if (!icon) {
      return '<div style="margin-bottom:14px;"><h3 style="font-size:14px;font-weight:600;margin:0 0 4px;color:#1F1F1F;">' + _esc(title) + '</h3><p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">' + _esc(desc || '') + '</p></div>';
    }
    return '<div style="margin-bottom:14px;display:flex;align-items:flex-start;gap:10px;">' +
      (icon ? '<span class="mi" style="width:31px;height:31px;border-radius:12px;background:#FAF8F4;color:#8A6F5A;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto;">' + _esc(icon) + '</span>' : '') +
      '<div style="min-width:0;"><h3 style="font-size:14px;font-weight:600;margin:0 0 4px;color:#1F1F1F;">' + _esc(title) + '</h3><p style="font-size:13px;color:#6F6860;line-height:1.5;margin:0;">' + _esc(desc || '') + '</p></div>' +
    '</div>';
  }

  function _dinheiroSubtabsHtml() {
    var icons = {
      resumo: 'monitoring',
      precos: 'receipt_long',
      lista: 'format_list_bulleted',
      simulador: 'calculate',
      regras: 'tune'
    };
    function tab(item) {
      var active = _activeSub === item.key;
      return '<button type="button" onclick="Modules.Dinheiro._switchSub(\'' + item.key + '\')" style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:none;border-radius:999px;background:' + (active ? '#B42318' : '#fff') + ';color:' + (active ? '#fff' : '#6F6860') + ';font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:' + (active ? '0 10px 24px rgba(180,35,24,.18)' : 'inset 0 0 0 1px #EAE4DA') + ';transition:background .15s ease,color .15s ease,box-shadow .15s ease;white-space:nowrap;">' +
        '<span class="mi" style="font-size:17px;">' + _esc(icons[item.key] || 'radio_button_unchecked') + '</span>' + _esc(item.label) +
      '</button>';
    }
    return '<div style="display:inline-flex;align-items:center;gap:6px;background:#FAF8F4;border-radius:999px;padding:4px;box-shadow:inset 0 0 0 1px #EAE4DA;max-width:100%;overflow:auto;">' + TABS.map(tab).join('') + '</div>';
  }

  function _kpi(label, value, note) {
    return '<div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);"><div style="font-size:11px;color:#8A7E7C;text-transform:uppercase;font-weight:800;">' + _esc(label) + '</div><div style="font-size:22px;font-weight:900;color:#1A1A1A;margin-top:6px;">' + value + '</div><div style="font-size:12px;color:#8A7E7C;margin-top:4px;">' + _esc(note || '') + '</div></div>';
  }

  function _statusBadge(status) {
    var colors = {
      'saudável': ['#EDFAF3', '#1A9E5A'],
      'atenção': ['#FFF7ED', '#D97706'],
      'margem baixa': ['#FFF0EE', '#C4362A'],
      'prejuízo': ['#FEE2E2', '#991B1B'],
      'sem custo': ['#F2EDED', '#8A7E7C'],
      'sem preço': ['#F2EDED', '#8A7E7C'],
      'sem dados': ['#F2EDED', '#8A7E7C']
    }[status] || ['#F2EDED', '#8A7E7C'];
    return '<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:' + colors[0] + ';color:' + colors[1] + ';font-size:11px;font-weight:800;">' + _esc(status) + '</span>';
  }

  function _field(id, label, value, type) {
    return '<label style="' + _labelWrap() + '"><span style="' + _label() + '">' + _esc(label) + '</span><input id="' + id + '" type="' + (type || 'text') + '" value="' + _esc(value == null ? '' : value) + '" style="' + _input() + '"></label>';
  }

  function _labelWrap() { return 'display:block;'; }
  function _label() { return 'display:block;font-size:11px;font-weight:800;color:#8A7E7C;text-transform:uppercase;margin-bottom:4px;'; }
  function _input() { return 'width:100%;padding:10px;border:1.5px solid #D4C8C6;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#fff;box-sizing:border-box;'; }
  function _th(h) { return '<th style="padding:11px 12px;text-align:left;font-size:11px;font-weight:800;color:#8A7E7C;text-transform:uppercase;white-space:nowrap;">' + _esc(h) + '</th>'; }
  function _td(v) { return '<td style="padding:12px;font-size:13px;vertical-align:top;white-space:nowrap;">' + v + '</td>'; }
  function _priceTh(h) { return '<th style="padding:12px 16px;border-bottom:1px solid #EAE4DA;background:#fff;text-align:left;font-size:11px;font-weight:600;color:#1F1F1F;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">' + _esc(h) + '</th>'; }
  function _priceTd(v) { return '<td style="padding:13px 16px;vertical-align:middle;font-size:13px;color:#1F1F1F;white-space:nowrap;">' + v + '</td>'; }
  function _byId(list, id) { return (list || []).find(function (x) { return String(x.id) === String(id); }) || null; }
  function _num(v) { return parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0; }
  function _firstText() {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (value == null) continue;
      var text = String(value).trim();
      if (text) return text;
    }
    return '';
  }
  function _fold(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function _moneyInputValue(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return 0;
    raw = raw.replace(/[^\d,.-]/g, '');
    if (raw.indexOf(',') >= 0) raw = raw.replace(/\./g, '').replace(',', '.');
    return parseFloat(raw) || 0;
  }
  function _moneyDisplay(value, showZero) {
    var n = _moneyInputValue(value);
    return n > 0 || showZero ? '€' + n.toFixed(2).replace('.', ',') : '';
  }
  function _moneyInputFocus(el) {
    if (!el) return;
    el.value = String(el.value || '').replace(/^\s*€\s*/, '');
    if (el.select) el.select();
  }
  function _moneyInputBlur(el) {
    if (!el) return;
    el.value = _moneyDisplay(el.value, true);
    _updateSimulador();
  }
  function _moneyInputBlurOnly(el) {
    if (!el) return;
    el.value = _moneyDisplay(el.value, true);
  }
  function _val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function destroy() {}

  return {
    render: render,
    destroy: destroy,
    _switchSub: _switchSub,
    _filterProducts: _filterProducts,
    _setPricePage: _setPricePage,
    _setPricePageSize: _setPricePageSize,
    _setPriceCompositionChannel: _setPriceCompositionChannel,
    _clearPriceCompositionFilters: _clearPriceCompositionFilters,
    _openProductModal: _openProductModal,
    _updateProductPriceModal: _updateProductPriceModal,
    _setMenuCombinationView: _setMenuCombinationView,
    _openMenuCombinationPriceModal: _openMenuCombinationPriceModal,
    _saveProductPrice: _saveProductPrice,
    _closeProductModal: _closeProductModal,
    _saveRegras: _saveRegras,
    _goPriceFilter: _goPriceFilter,
    _addCanalVenda: _addCanalVenda,
    _removeCanalVenda: _removeCanalVenda,
    _renderListaPrecos: _renderListaPrecos,
    _setPriceListFilter: _setPriceListFilter,
    _clearPriceListFilters: _clearPriceListFilters,
    _printPriceList: _printPriceList,
    _applySimulatorChannel: _applySimulatorChannel,
    _updateSimulador: _updateSimulador,
    _moneyInputFocus: _moneyInputFocus,
    _moneyInputBlur: _moneyInputBlur,
    _moneyInputBlurOnly: _moneyInputBlurOnly
  };
})();
