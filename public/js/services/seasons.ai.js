// js/services/seasons.ai.js
window.SeasonsAI = (function () {
  'use strict';

  var AI_PROMPT = [
    'Você é um copiloto operacional para um pequeno negócio de comida.',
    'Use apenas os dados fornecidos no contexto.',
    'Não calcule score, meta, risco ou progresso; esses valores já vêm do BocaFood.',
    'Transforme os dados em orientação prática, simples e executável.',
    'Não invente números, clientes, campanhas ou métricas.',
    'Quando sugerir ação, use o plano operacional recebido e cite produto, canal, horário, cupom, promoção, upsell ou pontos somente se existirem no contexto.',
    'Não use tom motivacional exagerado, linguagem infantil ou frases de coach.',
    'Não sugira anúncios sem dados de campanha ou marketing.',
    'Não sugira estoque, desperdício ou produção avançada se os dados não forem confiáveis.',
    'Retorne exatamente um JSON com headline, helpingSignals, blockingSignals e nextAction.',
    'headline deve ser uma frase curta sobre a temporada.',
    'helpingSignals e blockingSignals devem ser arrays com frases simples.',
    'nextAction deve ser uma ação prática para a usuária executar agora.'
  ].join('\n');

  function buildSeasonAIContext(season, metrics, snapshots, relatedData) {
    season = season || {};
    metrics = metrics || {};
    snapshots = snapshots || {};
    relatedData = relatedData || {};

    var period = _periodInfo(season, metrics);
    return {
      prompt: AI_PROMPT,
      season: {
        objective: season.objective || '',
        build: season.build || '',
        difficulty: season.difficulty || '',
        durationType: season.durationType || '',
        targetMode: season.targetMode || '',
        targetValue: _num(season.targetValue),
        calculatedTargetValue: _num(season.calculatedTargetValue),
        baselineValue: _num(season.baselineValue),
        startDate: season.startDate || '',
        endDate: season.endDate || '',
        daysElapsed: period.daysElapsed,
        daysRemaining: period.daysRemaining
      },
      status: {
        currentScore: _num(season.currentScore),
        currentStatus: season.currentStatus || '',
        riskLevel: season.riskLevel || '',
        progressPercent: _num(season.progressPercent),
        scoreBreakdown: _safeObject(relatedData.scoreBreakdown || metrics.scoreBreakdown || season.scoreBreakdown || {}),
        validatedImpactSignals: _safeObject(relatedData.validatedImpactSignals || metrics.validatedImpactSignals || {}),
        seasonReading: _safeObject(relatedData.seasonReading || metrics.seasonReading || season.seasonReading || {}),
        executionPlan: _safeObject(relatedData.executionPlan || metrics.executionPlan || season.executionPlan || {}),
        mainMetrics: _safeObject((snapshots.daily && snapshots.daily.mainMetrics) || {}),
        auxiliaryMetrics: _safeObject((snapshots.daily && snapshots.daily.auxiliaryMetrics) || {}),
        alerts: _safeAlerts((snapshots.daily && snapshots.daily.alerts) || [])
      },
      operationalData: {
        revenueCurrentPeriod: _num(metrics.revenue),
        revenuePreviousPeriod: _num(relatedData.revenuePreviousPeriod),
        ordersCurrentPeriod: _num(metrics.orders),
        ordersPreviousPeriod: _num(relatedData.ordersPreviousPeriod),
        averageTicket: _num(metrics.averageTicket),
        averageTicketChange: _num(relatedData.averageTicketChange),
        activeSalesDays: _num(metrics.activeDays),
        weakDays: _num(metrics.weakDays),
        strongDays: relatedData.strongDays || [],
        strongHours: relatedData.strongHours || [],
        topProducts: _safeProducts(relatedData.topProducts || []),
        lowSellingProducts: _safeProducts(relatedData.lowSellingProducts || []),
        recurringCustomersCount: _num(metrics.recurringCustomers),
        repurchaseRate: _num(metrics.repurchaseRate),
        reviewsAverage: _num(relatedData.reviewsAverage),
        couponUsage: _num(relatedData.couponUsage),
        promotionUsage: _num(relatedData.promotionUsage),
        upsellUsage: _num(relatedData.upsellUsage),
        couponDiscount: _num(relatedData.couponDiscount),
        promotionDiscount: _num(relatedData.promotionDiscount),
        upsellDiscount: _num(relatedData.upsellDiscount),
        upsellAddedRevenue: _num(relatedData.upsellAddedRevenue),
        pointsRedemption: _num(relatedData.pointsRedemption),
        pointsDiscount: _num(relatedData.pointsDiscount),
        channelBreakdown: relatedData.channelBreakdown || [],
        actionOpportunities: _safeObject(relatedData.actionOpportunities || metrics.actionOpportunities || {})
      },
      currentMetrics: _safeObject(metrics),
      scoreBreakdown: _safeObject(relatedData.scoreBreakdown || metrics.scoreBreakdown || season.scoreBreakdown || {}),
      validatedImpactSignals: _safeObject(relatedData.validatedImpactSignals || metrics.validatedImpactSignals || {}),
      executionPlan: _safeObject(relatedData.executionPlan || metrics.executionPlan || season.executionPlan || {}),
      riskContext: {
        riskLevel: season.riskLevel || '',
        currentStatus: season.currentStatus || '',
        progressPercent: _num(season.progressPercent),
        progressRatio: _num(metrics.progressRatio),
        daysRemaining: _num(metrics.daysRemaining)
      },
      snapshots: _safeObject(snapshots),
      confidence: {
        baselineConfidence: season.baselineConfidence || 'low',
        dataConfidence: (snapshots.daily && (snapshots.daily.confidence || snapshots.daily.auxiliaryMetrics && snapshots.daily.auxiliaryMetrics.confidence)) || 'low',
        unavailableMetrics: _unavailableMetrics(metrics, relatedData)
      }
    };
  }

  function generateSeasonActionRecommendation(context) {
    var endpoint = _configuredEndpoint();
    if (!endpoint) {
      return Promise.resolve({
        recommendation: getFallbackRecommendation(context),
        status: 'fallback',
        model: 'local-rules-v1',
        error: ''
      });
    }

    return _requestHeaders().then(function (headers) {
      return fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          context: context,
          tenantId: window.Auth && Auth.getTenantId ? Auth.getTenantId() : ''
        })
      });
    }).then(function (res) {
      if (!res.ok) throw new Error('AI endpoint HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      var recommendation = _validSeasonReading(data && (data.recommendation || data));
      return {
        recommendation: recommendation,
        status: 'generated',
        model: data.model || data.aiRecommendationModel || 'server-side',
        error: ''
      };
    }).catch(function (err) {
      return {
        recommendation: getFallbackRecommendation(context),
        status: 'fallback',
        model: 'local-rules-v1',
        error: err && err.message ? err.message : 'AI endpoint error'
      };
    });
  }

  function getFallbackRecommendation(context) {
    context = context || {};
    var objective = context.season && context.season.objective;
    var data = context.operationalData || {};
    var status = context.status || {};
    var executionPlan = status.executionPlan || context.executionPlan || {};
    var firstAction = executionPlan.actions && executionPlan.actions[0];
    var progress = _num(status.progressPercent);
    if (firstAction && firstAction.description) {
      return _seasonReading(
        progress < 75 ? 'A temporada precisa de uma ação prática agora' : 'A temporada tem uma próxima ação clara',
        [firstAction.why || 'A ação vem dos pedidos e sinais validados da temporada.'],
        [],
        firstAction.description
      );
    }

    if (objective === 'increase_ticket') return _ticketRecommendation(data, progress);
    if (objective === 'retain_customers') return _retainRecommendation(data, progress);
    if (objective === 'improve_consistency') return _consistencyRecommendation(data, progress);
    return _sellMoreRecommendation(data, progress);
  }

  function _sellMoreRecommendation(data, progress) {
    var product = _firstProductName(data);
    return _seasonReading(
      progress < 75 ? 'A temporada está abaixo do ritmo esperado' : 'A temporada está mantendo o ritmo de venda',
      [
        product ? product + ' está puxando as vendas.' : 'Há pedidos reais suficientes para acompanhar o ritmo.',
        data.strongHours && data.strongHours.length ? 'Existe horário com resposta melhor.' : ''
      ],
      [
        progress < 75 ? 'O progresso ainda está abaixo do ideal para este momento.' : '',
        'Use desconto apenas quando ele tiver regra clara, produto certo e acompanhamento de pedidos.'
      ],
      product ? 'Reforce ' + product + ' no melhor horário identificado nesta temporada.' : 'Reforce o produto com melhor saída nesta temporada.'
    );
  }

  function _ticketRecommendation(data, progress) {
    var product = _firstProductName(data);
    return _seasonReading(
      'O ticket precisa de uma ação mais clara',
      [
        product ? product + ' pode servir de base para combo ou adicional.' : '',
        data.upsellUsage > 0 ? 'Upsell já apareceu em pedido real.' : ''
      ],
      [
        'Desconto amplo pode vender mais, mas reduzir o ticket líquido.',
        progress < 75 ? 'O avanço ainda está abaixo do esperado para o objetivo.' : ''
      ],
      product ? 'Monte uma composição simples com ' + product + ' e um adicional para subir o valor do pedido.' : 'Use adicional ou combo no produto mais vendido para subir o valor do pedido.'
    );
  }

  function _retainRecommendation(data, progress) {
    return _seasonReading(
      data.recurringCustomersCount > 0 ? 'A recompra já começou a aparecer' : 'A recompra ainda precisa ganhar força',
      [
        data.recurringCustomersCount > 0 ? data.recurringCustomersCount + ' cliente(s) voltaram a comprar.' : '',
        data.pointsRedemption > 0 ? 'Pontos foram usados em pedido real.' : ''
      ],
      [
        data.recurringCustomersCount <= 0 ? 'Ainda há poucos sinais de clientes voltando.' : '',
        'Cliente cadastrado sem nova compra ainda não valida fidelização.'
      ],
      'Chame clientes que já compraram antes com uma mensagem curta e uma vantagem simples para voltar.'
    );
  }

  function _consistencyRecommendation(data, progress) {
    return _seasonReading(
      'A consistência precisa de uma ação nos dias fracos',
      [
        data.activeSalesDays > 0 ? 'Já existem dias com venda para comparar.' : '',
        data.strongHours && data.strongHours.length ? 'Há horário com melhor resposta.' : ''
      ],
      [
        data.weakDays > 0 ? data.weakDays + ' dia(s) fraco(s) ainda pesam no ritmo.' : '',
        'Vendas concentradas em poucos dias deixam a temporada mais instável.'
      ],
      'Use o produto mais forte em um dia fraco e repita o melhor horário identificado.'
    );
  }

  function _seasonReading(headline, helpingSignals, blockingSignals, nextAction) {
    return {
      headline: headline || 'A temporada precisa de leitura nos próximos dias',
      helpingSignals: _cleanList(helpingSignals).slice(0, 4),
      blockingSignals: _cleanList(blockingSignals).slice(0, 4),
      nextAction: nextAction || 'Use o produto, canal ou horário mais forte da temporada para a próxima ação.'
    };
  }

  function _configuredEndpoint() {
    var cfg = window.SeasonsAIConfig || {};
    return cfg.endpoint ? String(cfg.endpoint) : '';
  }

  function _requestHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var user = window.Auth && Auth.getUser ? Auth.getUser() : null;
    if (!user || typeof user.getIdToken !== 'function') return Promise.resolve(headers);
    return user.getIdToken().then(function (token) {
      if (token) headers.Authorization = 'Bearer ' + token;
      return headers;
    }).catch(function () {
      return headers;
    });
  }

  function _validSeasonReading(value) {
    value = value || {};
    if (value.mainAction && !value.nextAction) {
      value = {
        headline: value.summary || value.mainAction.title || '',
        helpingSignals: [],
        blockingSignals: value.dataLimitations || [],
        nextAction: value.mainAction.description || value.mainAction.title || ''
      };
    }
    if (!value.headline || !value.nextAction) throw new Error('Resposta de IA inválida.');
    return _seasonReading(value.headline, value.helpingSignals || [], value.blockingSignals || [], value.nextAction);
  }

  function _periodInfo(season, metrics) {
    var start = _date(season.startDate || season.startedAt);
    var end = _date(season.endDate);
    var now = new Date();
    return {
      daysElapsed: metrics && metrics.elapsedDays ? _num(metrics.elapsedDays) : (start ? Math.max(1, Math.ceil((Math.min(now, end || now).getTime() - start.getTime()) / 86400000)) : 0),
      daysRemaining: metrics && metrics.daysRemaining !== undefined ? _num(metrics.daysRemaining) : (end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)) : 0)
    };
  }

  function _unavailableMetrics(metrics, relatedData) {
    var missing = [];
    if (!relatedData || !relatedData.topProducts || !relatedData.topProducts.length) missing.push('topProducts');
    if (!relatedData || relatedData.reviewsAverage === undefined) missing.push('reviewsAverage');
    if (!metrics || metrics.averageItemsPerOrder === undefined) missing.push('upsellUsage');
    return missing;
  }

  function _safeObject(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function _cleanList(items) {
    var seen = {};
    return (items || []).map(function (item) {
      return String(item || '').trim();
    }).filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function _safeAlerts(alerts) {
    return (alerts || []).map(function (alert) {
      return {
        type: alert.type || '',
        severity: alert.severity || '',
        title: alert.title || '',
        message: alert.message || '',
        metric: alert.metric || ''
      };
    });
  }

  function _safeProducts(products) {
    return (products || []).slice(0, 5).map(function (product) {
      return {
        name: product.name || product.productName || '',
        quantity: _num(product.quantity || product.qty),
        revenue: _num(product.revenue || product.total)
      };
    });
  }

  function _firstProductName(data) {
    var products = data && data.topProducts || [];
    return products.length ? (products[0].name || '') : '';
  }

  function _num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function _date(value) {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    var d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return {
    AI_PROMPT: AI_PROMPT,
    buildSeasonAIContext: buildSeasonAIContext,
    generateSeasonActionRecommendation: generateSeasonActionRecommendation,
    getFallbackRecommendation: getFallbackRecommendation
  };
})();
