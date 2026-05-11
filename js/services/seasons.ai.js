// js/services/seasons.ai.js
window.SeasonsAI = (function () {
  'use strict';

  var AI_PROMPT = [
    'Você é um copiloto operacional para um pequeno negócio de comida.',
    'Use apenas os dados fornecidos no contexto.',
    'Não calcule score, meta, risco ou progresso; esses valores já vêm do BocaFood.',
    'Transforme os dados em orientação prática, simples e executável.',
    'Não invente números, clientes, campanhas ou métricas.',
    'Não use tom motivacional exagerado, linguagem infantil ou frases de coach.',
    'Não sugira anúncios sem dados de campanha ou marketing.',
    'Não sugira estoque, desperdício ou produção avançada se os dados não forem confiáveis.',
    'Retorne exatamente um JSON com mainAction, até duas secondaryActions, summary, confidence e dataLimitations.'
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
        upsellUsage: _num(relatedData.upsellUsage)
      },
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

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: context })
    }).then(function (res) {
      if (!res.ok) throw new Error('AI endpoint HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      var recommendation = _validRecommendation(data && (data.recommendation || data));
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
    var progress = _num(status.progressPercent);

    if (objective === 'increase_ticket') return _ticketRecommendation(data, progress);
    if (objective === 'retain_customers') return _retainRecommendation(data, progress);
    if (objective === 'improve_consistency') return _consistencyRecommendation(data, progress);
    return _sellMoreRecommendation(data, progress);
  }

  function _sellMoreRecommendation(data, progress) {
    var product = _firstProductName(data);
    return _recommendation(
      progress < 75 ? 'Reforçar o melhor produto no melhor período' : 'Manter foco no produto líder da temporada',
      'Use o produto com melhor sinal de venda como gancho para recuperar ritmo sem depender de desconto agressivo.',
      'O progresso de vendas está abaixo do ritmo ideal ou ainda precisa manter consistência até o fechamento.',
      [
        'Escolha o produto com melhor saída nos dados recentes.',
        'Publique uma oferta simples no melhor dia ou horário identificado.',
        'Evite desconto agressivo; destaque combinação, praticidade ou preço fechado.',
        'Acompanhe pedidos e faturamento pelos próximos 7 dias.'
      ],
      'Faturamento e pedidos',
      'A temporada pode continuar dependendo de poucos dias fortes.',
      [
        { title: 'Usar produto líder como gancho', description: product ? 'Produto de referência: ' + product + '.' : 'Use o produto mais vendido disponível nos relatórios.', why: 'Produto com tração reduz esforço de venda.' }
      ],
      data.ordersCurrentPeriod > 0 ? 'medium' : 'low'
    );
  }

  function _ticketRecommendation(data, progress) {
    var product = _firstProductName(data);
    return _recommendation(
      'Criar combo com o produto mais vendido',
      'Monte um combo simples com produto líder e um adicional, bebida ou sobremesa.',
      'O objetivo é aumentar ticket sem reduzir valor por pedido com desconto pesado.',
      [
        'Pegue o produto mais vendido dos últimos dados disponíveis.',
        'Combine com adicional, bebida ou sobremesa simples.',
        'Use preço fechado e fácil de entender.',
        'Acompanhe o ticket médio por 7 dias.'
      ],
      'Ticket médio',
      'Você pode continuar vendendo, mas sem aumentar o valor por pedido.',
      [
        { title: 'Evitar desconto amplo', description: 'Prefira composição de pedido em vez de cortar preço.', why: 'Desconto pode baixar margem e não elevar ticket.' },
        { title: 'Destacar adicional simples', description: product ? 'Conecte o adicional ao produto ' + product + '.' : 'Escolha um adicional fácil de vender.', why: 'Reduz fricção na decisão da cliente.' }
      ],
      progress > 0 ? 'medium' : 'low'
    );
  }

  function _retainRecommendation(data, progress) {
    return _recommendation(
      'Reativar clientes que já compraram',
      'Faça uma ação simples para incentivar recompra usando o histórico de clientes recorrentes como agregado.',
      'A recompra está baixa ou ainda precisa ganhar força dentro da temporada.',
      [
        'Escolha uma mensagem curta para quem já comprou recentemente.',
        'Ofereça uma vantagem simples e limitada no tempo.',
        'Se o programa de pontos estiver ativo, lembre o benefício disponível.',
        'Revise recompra e clientes recorrentes em 7 dias.'
      ],
      'Clientes recorrentes e recompra',
      'A loja pode depender demais de clientes novos e perder frequência.',
      [
        { title: 'Revisar experiência pós-pedido', description: 'Use avaliações e comentários disponíveis para ajustar a próxima compra.', why: 'Fidelização depende de confiança e repetição.' }
      ],
      data.recurringCustomersCount > 0 ? 'medium' : 'low'
    );
  }

  function _consistencyRecommendation(data, progress) {
    return _recommendation(
      'Criar ação para o dia mais fraco',
      'Use o produto líder como gancho em um dia com pouca venda para reduzir oscilação.',
      'A temporada precisa distribuir melhor os dias ativos e reduzir períodos fracos.',
      [
        'Identifique o dia mais fraco disponível nos dados.',
        'Escolha um produto com boa saída para servir de gancho.',
        'Faça uma comunicação simples naquele dia.',
        'Acompanhe dias com venda e regularidade semanal por 7 dias.'
      ],
      'Dias com venda',
      'As vendas podem continuar concentradas em poucos dias.',
      [
        { title: 'Repetir o melhor horário', description: 'Quando houver horário forte, use esse horário para publicar a ação.', why: 'Aumenta chance de resposta sem criar campanha complexa.' }
      ],
      data.activeSalesDays > 0 ? 'medium' : 'low'
    );
  }

  function _recommendation(title, description, why, howToApply, metricToWatch, riskIfIgnored, secondaryActions, confidence) {
    return {
      mainAction: {
        title: title,
        description: description,
        why: why,
        howToApply: howToApply,
        metricToWatch: metricToWatch,
        reviewInDays: 7,
        riskIfIgnored: riskIfIgnored
      },
      secondaryActions: (secondaryActions || []).slice(0, 2),
      summary: title + '.',
      confidence: confidence || 'low',
      dataLimitations: []
    };
  }

  function _configuredEndpoint() {
    var cfg = window.SeasonsAIConfig || {};
    return cfg.endpoint ? String(cfg.endpoint) : '';
  }

  function _validRecommendation(value) {
    value = value || {};
    if (!value.mainAction || !value.mainAction.title) throw new Error('Resposta de IA inválida.');
    value.secondaryActions = Array.isArray(value.secondaryActions) ? value.secondaryActions.slice(0, 2) : [];
    value.confidence = /^(high|medium|low)$/.test(value.confidence) ? value.confidence : 'low';
    value.dataLimitations = Array.isArray(value.dataLimitations) ? value.dataLimitations : [];
    return value;
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
