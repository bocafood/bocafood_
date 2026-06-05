// js/services/seasons.ai.js
window.SeasonsAI = (function () {
  'use strict';

  var AI_PROMPT = [
    'Você é um copiloto operacional para um pequeno negócio de comida.',
    'Use apenas os dados fornecidos no contexto.',
    'Leia primeiro season, status, operationalData, executionPlan, scoreBreakdown, validatedImpactSignals, riskContext, snapshots e confidence.',
    'Considere que o Plano de Voo define a direção maior e que a Temporada transforma essa direção em jogadas de curto prazo.',
    'A dificuldade define a intensidade operacional: Seguro tem 1 jogada, Equilibrado até 2 jogadas e Agressivo até 3 jogadas.',
    'O objetivo define o resultado principal da temporada. A prioridade escolhida pela usuária orienta por onde começar, mas não limita a jogada quando os dados mostram oportunidade mais forte.',
    'Não calcule score, meta, risco ou progresso; esses valores já vêm do BocaFood.',
    'Não altere a quantidade de jogadas, prazos, status, resultado, score ou risco; isso é função do motor determinístico do BocaFood.',
    'Transforme os dados em orientação prática, simples e executável.',
    'Não invente números, clientes, campanhas ou métricas.',
    'Quando sugerir ação, use o plano operacional recebido e cite produto, canal, horário, cupom, promoção, upsell ou pontos somente se existirem no contexto.',
    'Se existir executionPlan.actions, use essas ações como fonte principal da Próxima Jogada e melhore apenas clareza, prioridade e linguagem.',
    'Se uma ação citar produto, canal, horário, cupom, promoção, upsell ou pontos, preserve esses objetos concretos e não troque por termos genéricos.',
    'Não recomende desconto sem preço, custo, margem e desconto saudável já calculados no contexto.',
    'Upsell só pode ser tratado como jogada do canal Cardápio.',
    'Cupom, promoção, upsell e pontos só contam como sinal quando aparecem em pedido real ou quando existe evidência de ação criada pelo BocaFood.',
    'Se a ação foi criada mas não vendeu, trate como execução sem resultado, não como sucesso.',
    'Se não houver dado suficiente, diga isso de forma simples e recomende uma jogada de aprendizado com baixo risco, sem inventar resultado.',
    'Para cada recomendação textual, deixe claro: o que fazer, por que fazer, até quando ou em qual janela agir, e como o BocaFood vai reconhecer que valeu a pena.',
    'Evite frases como confira, meça, acompanhe ou veja se; entregue a leitura já pronta com os dados recebidos.',
    'Evite recomendações repetidas com o mesmo foco. Cada jogada deve ter um objetivo diferente quando houver mais de uma.',
    'Não use tom motivacional exagerado, linguagem infantil ou frases de coach.',
    'Fale com a usuária sobre o negócio dela, sem termos técnicos como baseline, scoreBreakdown, validatedImpactSignals, engine, payload ou algoritmo.',
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
    var executionPlan = _safeExecutionPlan(relatedData.executionPlan || metrics.executionPlan || season.executionPlan || {});
    var status = {
      currentScore: _round(_num(season.currentScore)),
      currentStatus: season.currentStatus || '',
      riskLevel: season.riskLevel || '',
      progressPercent: _round(_num(season.progressPercent)),
      scoreBreakdown: _safeObject(relatedData.scoreBreakdown || metrics.scoreBreakdown || season.scoreBreakdown || {}),
      validatedImpactSignals: _compactSignals(relatedData.validatedImpactSignals || metrics.validatedImpactSignals || {}),
      seasonReading: _safeSeasonReading(relatedData.seasonReading || metrics.seasonReading || season.seasonReading || {}),
      executionPlan: executionPlan,
      mainMetrics: _safeObject((snapshots.daily && snapshots.daily.mainMetrics) || {}),
      auxiliaryMetrics: _safeObject((snapshots.daily && snapshots.daily.auxiliaryMetrics) || {}),
      alerts: _safeAlerts((snapshots.daily && snapshots.daily.alerts) || [])
    };
    var operationalData = {
      revenueCurrentPeriod: _round(_num(metrics.revenue)),
      revenuePreviousPeriod: _round(_num(relatedData.revenuePreviousPeriod)),
      ordersCurrentPeriod: _round(_num(metrics.orders)),
      ordersPreviousPeriod: _round(_num(relatedData.ordersPreviousPeriod)),
      averageTicket: _round(_num(metrics.averageTicket)),
      averageTicketChange: _round(_num(relatedData.averageTicketChange)),
      activeSalesDays: _round(_num(metrics.activeDays)),
      weakDays: _round(_num(metrics.weakDays)),
      strongDays: _safeSimpleList(relatedData.strongDays || metrics.strongDays || [], 4),
      strongHours: _safeSimpleList(relatedData.strongHours || metrics.strongHours || [], 4),
      topProducts: _safeProducts(relatedData.topProducts || []),
      lowSellingProducts: _safeProducts(relatedData.lowSellingProducts || []),
      recurringCustomersCount: _round(_num(metrics.recurringCustomers)),
      repurchaseRate: _round(_num(metrics.repurchaseRate)),
      reviewsAverage: _round(_num(relatedData.reviewsAverage)),
      couponUsage: _round(_num(relatedData.couponUsage)),
      promotionUsage: _round(_num(relatedData.promotionUsage)),
      upsellUsage: _round(_num(relatedData.upsellUsage)),
      couponDiscount: _round(_num(relatedData.couponDiscount)),
      promotionDiscount: _round(_num(relatedData.promotionDiscount)),
      upsellDiscount: _round(_num(relatedData.upsellDiscount)),
      upsellAddedRevenue: _round(_num(relatedData.upsellAddedRevenue)),
      pointsRedemption: _round(_num(relatedData.pointsRedemption)),
      pointsDiscount: _round(_num(relatedData.pointsDiscount)),
      channelBreakdown: _safeChannels(relatedData.channelBreakdown || []),
      actionOpportunities: _compactOpportunities(relatedData.actionOpportunities || metrics.actionOpportunities || {})
    };
    return {
      prompt: AI_PROMPT,
      contextMode: 'compact-v1',
      season: {
        id: season.id || '',
        objective: season.objective || '',
        build: season.build || '',
        priority: season.priority || season.build || '',
        priorityMeaning: 'A prioridade orienta o começo da leitura e ajusta pesos; ela não bloqueia outras jogadas.',
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
      status: status,
      operationalData: operationalData,
      executionPlan: executionPlan,
      riskContext: {
        riskLevel: season.riskLevel || '',
        currentStatus: season.currentStatus || '',
        progressPercent: _round(_num(season.progressPercent)),
        progressRatio: _round(_num(metrics.progressRatio)),
        daysRemaining: _round(_num(metrics.daysRemaining))
      },
      snapshots: _safeSnapshots(snapshots),
      confidence: {
        baselineConfidence: season.baselineConfidence || 'low',
        dataConfidence: (snapshots.daily && (snapshots.daily.confidence || snapshots.daily.auxiliaryMetrics && snapshots.daily.auxiliaryMetrics.confidence)) || 'low',
        unavailableMetrics: _unavailableMetrics(metrics, relatedData)
      },
      cache: {
        hash: _hashContext({
          season: {
            id: season.id || '',
            objective: season.objective || '',
            build: season.build || '',
            priority: season.priority || season.build || '',
            difficulty: season.difficulty || '',
            targetValue: _round(_num(season.targetValue || season.calculatedTargetValue)),
            startDate: season.startDate || '',
            endDate: season.endDate || ''
          },
          status: {
            score: status.currentScore,
            progressPercent: status.progressPercent,
            currentStatus: status.currentStatus,
            riskLevel: status.riskLevel
          },
          operationalData: operationalData,
          executionPlan: executionPlan,
          confidence: {
            baselineConfidence: season.baselineConfidence || 'low',
            dataConfidence: (snapshots.daily && snapshots.daily.confidence) || 'low'
          }
        }),
        size: 0,
        triggerReason: ''
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
          tenantId: window.Auth && window.Auth.getTenantId ? window.Auth.getTenantId() : '',
          seasonId: context && context.season && context.season.id || '',
          snapshotId: context && context.snapshots && context.snapshots.daily && context.snapshots.daily.id || '',
          snapshotDate: context && context.snapshots && context.snapshots.daily && context.snapshots.daily.date || '',
          contextHash: context && context.cache && context.cache.hash || '',
          contextSize: context && context.cache && context.cache.size || 0,
          triggerReason: context && context.cache && context.cache.triggerReason || ''
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
        usage: data.usage || {},
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
    if (cfg.endpoint) return String(cfg.endpoint);
    if (window.location && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname || '')) return '/api/seasons/ai-recommendation';
    var projectId = '';
    try {
      projectId = window.firebase && firebase.app && firebase.app().options && firebase.app().options.projectId || '';
    } catch (err) {}
    if (!projectId) projectId = 'bocado-brasil';
    return 'https://us-central1-' + encodeURIComponent(projectId) + '.cloudfunctions.net/seasonsAiRecommendation';
  }

  function hasRemoteEndpoint() {
    return !!_configuredEndpoint();
  }

  function _requestHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var user = window.Auth && window.Auth.getUser ? window.Auth.getUser() : null;
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
    var currentTime = Math.min(now.getTime(), (end || now).getTime());
    return {
      daysElapsed: metrics && metrics.elapsedDays ? _num(metrics.elapsedDays) : (start ? Math.max(1, Math.ceil((currentTime - start.getTime()) / 86400000)) : 0),
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

  function _safeSimpleList(items, limit) {
    if (!Array.isArray(items)) {
      items = Object.keys(items || {}).map(function (key) {
        var value = items[key];
        return value && typeof value === 'object' ? Object.assign({ label: key }, value) : { label: key, value: value };
      });
    }
    return (items || []).slice(0, limit || 4).map(function (item) {
      if (item && typeof item === 'object') {
        return {
          label: item.label || item.name || item.day || item.hour || item.channelName || item.channel || '',
          value: _round(_num(item.value || item.count || item.orders || item.revenue || item.quantity))
        };
      }
      return String(item || '');
    }).filter(function (item) {
      return typeof item === 'string' ? !!item : !!item.label;
    });
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
    return (products || []).slice(0, 3).map(function (product) {
      return {
        id: product.id || product.productId || '',
        name: product.name || product.productName || '',
        quantity: _round(_num(product.quantity || product.qty)),
        revenue: _round(_num(product.revenue || product.total)),
        marginPercent: _round(_num(product.marginPercent || product.grossMarginPercent || product.margin)),
        reason: product.reason || product.label || ''
      };
    });
  }

  function _safeChannels(channels) {
    return (channels || []).slice(0, 4).map(function (channel) {
      return {
        name: channel.name || channel.channelName || channel.channel || '',
        orders: _round(_num(channel.orders || channel.count || channel.quantity)),
        revenue: _round(_num(channel.revenue || channel.total)),
        share: _round(_num(channel.share || channel.percent || channel.percentage))
      };
    }).filter(function (channel) {
      return channel.name || channel.orders || channel.revenue;
    });
  }

  function _safeExecutionPlan(plan) {
    plan = plan || {};
    return {
      summary: plan.summary || plan.title || '',
      difficultyProfile: plan.difficultyProfile ? {
        label: plan.difficultyProfile.label || '',
        maxActions: _round(_num(plan.difficultyProfile.maxActions))
      } : null,
      actions: (plan.actions || []).slice(0, 3).map(function (action) {
        return {
          id: action.id || '',
          type: action.type || action.kind || '',
          title: action.title || '',
          description: action.description || '',
          why: action.why || action.reason || '',
          dueDate: action.dueDate || action.deadline || '',
          productId: action.productId || action.targetProductId || '',
          productName: action.productName || action.targetProductName || '',
          channelId: action.channelId || '',
          channelName: action.channelName || action.channel || '',
          status: action.status || '',
          confidence: action.confidence || ''
        };
      }),
      actionTasks: (plan.actionTasks || []).slice(0, 5).map(_safeActionTask)
    };
  }

  function _safeActionTask(task) {
    task = task || {};
    return {
      id: task.id || '',
      actionId: task.actionId || '',
      type: task.type || '',
      title: task.title || task.label || '',
      status: task.status || '',
      evidenceCount: task.evidenceCount || (task.evidence && task.evidence.length) || 0,
      updatedAt: task.updatedAt || task.completedAt || task.createdAt || ''
    };
  }

  function _compactSignals(signals) {
    signals = signals || {};
    return {
      products: _safeObject(signals.products || {}),
      channels: _safeObject(signals.channels || {}),
      actions: _safeObject(signals.actions || {}),
      margin: _safeObject(signals.margin || signals.margins || {}),
      recurrence: _safeObject(signals.recurrence || {})
    };
  }

  function _safeSeasonReading(reading) {
    reading = reading || {};
    return {
      headline: reading.headline || reading.title || '',
      helpingSignals: _cleanList(reading.helpingSignals || reading.positiveSignals || []).slice(0, 3),
      blockingSignals: _cleanList(reading.blockingSignals || reading.risks || []).slice(0, 3),
      nextAction: reading.nextAction || reading.action || ''
    };
  }

  function _compactOpportunities(opportunities) {
    opportunities = opportunities || {};
    return {
      promotions: _safeSimpleList(opportunities.promotions || opportunities.promotion || [], 3),
      coupons: _safeSimpleList(opportunities.coupons || opportunities.coupon || [], 3),
      upsells: _safeSimpleList(opportunities.upsells || opportunities.upsell || [], 3),
      products: _safeSimpleList(opportunities.products || [], 3),
      channels: _safeSimpleList(opportunities.channels || [], 3)
    };
  }

  function _safeSnapshots(snapshots) {
    var daily = snapshots && snapshots.daily || {};
    var weekly = snapshots && snapshots.weekly || {};
    return {
      daily: {
        id: daily.id || '',
        date: daily.date || '',
        confidence: daily.confidence || '',
        mainMetrics: _safeObject(daily.mainMetrics || {}),
        alerts: _safeAlerts(daily.alerts || [])
      },
      weekly: {
        id: weekly.id || '',
        date: weekly.date || '',
        confidence: weekly.confidence || '',
        mainMetrics: _safeObject(weekly.mainMetrics || {})
      }
    };
  }

  function _hashContext(value) {
    var text = _stableStringify(value);
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return 'ctx_' + Math.abs(hash).toString(36) + '_' + text.length.toString(36);
  }

  function _stableStringify(value) {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return '[' + value.map(_stableStringify).join(',') + ']';
    if (typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (key) {
        return JSON.stringify(key) + ':' + _stableStringify(value[key]);
      }).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  function _round(value) {
    return Math.round(_num(value) * 100) / 100;
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
    getFallbackRecommendation: getFallbackRecommendation,
    hasRemoteEndpoint: hasRemoteEndpoint
  };
})();
