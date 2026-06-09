// js/services/seasons.ai.js
window.SeasonsAI = (function () {
  'use strict';

  var AI_PROMPT = [
    'Você é um copiloto operacional para um pequeno negócio de comida.',
    'Use apenas os dados fornecidos no contexto.',
    'Leia primeiro season, status, operationalData, executionPlan, scoreBreakdown, validatedImpactSignals, riskContext, snapshots, confidence, salesIntelligence.businessPossibilities e salesIntelligence.playHistory.',
    'Considere que o Plano de Voo define a direção maior e que a Temporada transforma essa direção em jogadas de curto prazo.',
    'A dificuldade define o limite máximo de intensidade operacional: Seguro tem até 1 jogada, Equilibrado até 2 jogadas e Agressivo até 3 jogadas.',
    'O objetivo define o resultado principal da temporada. A prioridade escolhida pela usuária orienta por onde começar, mas não limita a jogada quando os dados mostram oportunidade mais forte.',
    'Não calcule score, meta, risco ou progresso; esses valores já vêm do BocaFood.',
    'Não aumente a quantidade de jogadas, não invente ações extras e não altere prazos, status, resultado, score ou risco; isso é função do motor determinístico do BocaFood.',
    'Não invente a quantidade do resultado esperado. Use expectedQuantity, targetOrders ou measurement recebidos do BocaFood; se não vierem, mantenha a quantidade conservadora do plano determinístico.',
    'Transforme os dados em orientação prática, simples e executável.',
    'Não invente números, clientes, campanhas ou métricas.',
    'Priorize os últimos 60 dias de pedidos, clientes, produtos, canais e ações. Se a conta tiver menos histórico, use todo o histórico disponível e reduza a confiança da recomendação.',
    'Toda jogada precisa ser mensurável pelo BocaFood depois: produto vendido, canal, cupom, promoção, upsell, pontos, recompra, ticket médio ou pedido registrado.',
    'Não transforme em jogada principal uma ação que o sistema não consiga ler nos pedidos ou cadastros.',
    'Em Temporadas, considere somente Cardápio como canal de venda. Não crie jogada para WhatsApp, Instagram, presencial, Glovo ou outro canal externo.',
    'WhatsApp pode aparecer apenas como meio de divulgação com link do Cardápio; o canal de venda, medição e resultado da jogada deve ser Cardápio.',
    'A IA só pode escolher uma destas ações de venda do BocaFood: Cupom, Promoção, Upsell, Combo/Menu, Pontos/Reativação de cliente, Ajuste de preço/desconto saudável, Canal de venda, Revisão de produto parado ou Criar base de leitura.',
    'A Próxima Jogada deve dizer explicitamente qual dessas ações criar, ativar ou usar. Não escreva "ação concreta", "ação objetiva", "ação de venda simples", "transforme em ação" ou variações genéricas.',
    'A Próxima Jogada nunca pode ser uma lista de opções. Escolha uma ação principal; não escreva "cupom, promoção, upsell ou combo" nem "crie ou ative".',
    'Se existir cupom, promoção ou upsell no contexto, use o nome ou código exato. Se não existir, diga explicitamente "Crie um cupom", "Crie uma promoção", "Cadastre um upsell", "Monte um combo", "Chame clientes com pontos" ou "Ajuste o preço/desconto" conforme o melhor caminho.',
    'Se executionPlan.actions vier genérico, normalize para uma única ação permitida antes de responder.',
    'Se faltar clareza comercial, classifique a jogada antes de responder: use unlock quando faltar cadastro/dado operacional como custo, ficha técnica, margem, foto, preço ou visibilidade; use commercial quando houver qualquer histórico recente; use baseline somente quando não houver nenhum pedido/histórico válido nos últimos 30 dias.',
    'Não use Criar base de leitura para falta de custo, foto, preço, margem, upsell criado, público específico ou pouca base. Esses casos são desbloqueio, primeira ação comercial ou divulgação geral pelo Cardápio.',
    'Venda ligada à jogada é sinal de leitura, não motivo para trocar automaticamente a jogada antes da janela de resultado.',
    'Quando sugerir ação, use o plano operacional recebido e cite produto, canal, cupom, promoção, upsell ou pontos somente se existirem no contexto.',
    'Não use horário como critério para criar, priorizar ou explicar uma jogada. Horário pode existir em dados operacionais, mas não deve virar recomendação.',
    'Use salesIntelligence para escolher a jogada mais específica possível: melhor produto, melhor combinação de menu, Cardápio como canal de venda, público principal já segmentado, ação de venda disponível e sinais dos últimos 60 dias ou de todo o histórico disponível quando a conta tiver menos base.',
    'Quando customerSignals.recommendedAudiences existir, escolha um único público principal dali. Não amplie o público por conta própria e não misture clientes que compraram produto, produtos parecidos e recorrentes na mesma jogada.',
    'Use businessPossibilities para saber quais caminhos a usuária pode usar dentro do BocaFood: canais cadastrados, canais ainda pouco explorados, produtos do cardápio, menus/combos, escolhas internas, cupons, promoções, upsells e programa de pontos.',
    'Quando businessPossibilities.recommendedPaths existir, escolha um caminho dali antes de criar qualquer recomendação própria. Esses caminhos já combinam produto, canal, margem líquida, ação de venda disponível e motivo.',
    'A próxima jogada deve preferir uma ação de venda específica quando existir: cupom específico, promoção específica, upsell específico, programa de pontos, combo, ajuste de preço ou revisão de produto.',
    'Formato esperado da ação: "Use o cupom X com o produto Y no canal Z", "Ative a promoção X para o produto Y", "Cadastre o upsell X junto de Y", "Monte o combo X + Y", "Chame clientes com pontos para comprar Y" ou "Ajuste o preço/desconto de Y para Z".',
    'Não escolha canal de venda: use Cardápio. Taxas e outros canais podem aparecer como contexto do negócio, mas não viram canal da jogada em Temporadas.',
    'Use playHistory para não repetir uma jogada sem resposta. Repita apenas quando a jogada anterior teve resultado ou quando não existir alternativa melhor no contexto.',
    'Se houver mais de uma jogada, cada uma precisa ter foco diferente: outro produto, outra combinação, outro canal, outro público ou outro mecanismo de venda.',
    'Quando salesIntelligence.realMenuCombinations existir, use essas combinações reais vendidas para escolher sabor/menu/oferta com mais precisão do que uma análise genérica do produto.',
    'Se uma combinação real vende bem mas tem margem baixa, prefira ajuste de preço, troca de oferta, upsell sem desconto ou destaque de combinação mais saudável.',
    'A jogada deve vir pronta para execução, dizendo exatamente o que fazer, com qual produto/oferta, para qual público/canal, em qual janela e qual dado vai provar se funcionou.',
    'Se não houver produto/canal/público suficiente, primeiro diferencie o motivo: sem pedidos/dados mínimos vira baseline; produto com cadastro incompleto vira unlock; histórico com público fraco vira commercial com divulgação geral pelo canal, sem fingir segmento específico.',
    'Se existir executionPlan.actions, use essas ações como fonte principal da Próxima Jogada e transforme a leitura operacional em uma ficha guiada, sem trocar measurement, score, prazo, status ou resultado.',
    'Quando executionPlan.actions trouxer measurement, respeite esses campos como a regra de leitura do resultado da jogada.',
    'Se uma ação citar produto, combinação, canal, cupom, promoção, upsell ou pontos, preserve esses objetos concretos e não troque por termos genéricos.',
    'Evite verbos vagos como levar, reforçar, destacar ou usar melhor quando eles não dizem uma ação real do BocaFood. Troque por algo executável: criar cupom X, ativar promoção Y, cadastrar upsell Z, ajustar preço, montar combo, chamar grupo de clientes ou revisar produto específico.',
    'Quando o produto for menu/combo e existir optionGroups ou realMenuCombinations, cite a escolha interna útil. Evite dizer só o nome genérico do menu quando a melhor ação depende de sabor, bebida, adicional ou combinação.',
    'Não recomende desconto sem preço, custo, margem mínima desejada, custo do canal e desconto saudável já calculados pelo BocaFood no contexto.',
    'Tudo que o BocaFood consegue ler sozinho deve virar diagnóstico automático, bloqueio ou ação objetiva. Não peça para conferir visibilidade, foto, preço, canal, margem ou pedidos.',
    'Não use como jogada principal frases como "Confira se", "Verifique se", "Veja se" ou "Acompanhe os pedidos".',
    'Upsell só pode ser tratado como jogada do canal Cardápio.',
    'Cupom, promoção, upsell e pontos só contam como sinal quando aparecem em pedido real ou quando existe evidência de ação criada pelo BocaFood.',
    'Se a ação foi criada mas não vendeu, trate como execução sem resultado, não como sucesso.',
    'Se faltarem pedidos ou dados mínimos de leitura, diga isso de forma simples e recomende uma jogada baseline de aprendizado com baixo risco. Se o dado que falta for cadastro, custo, foto, preço, margem, upsell ou público, não chame de base fraca: classifique como unlock ou commercial.',
    'Para cada recomendação textual, deixe claro para a usuária: o que fazer, para quem, como divulgar, até quando agir e qual resultado esperado. Não explique como o BocaFood reconhece, mede, lê ou calcula.',
    'Evite frases como confira, meça, acompanhe ou veja se; entregue a leitura já pronta com os dados recebidos.',
    'Evite recomendações repetidas com o mesmo foco. Cada jogada deve ter um objetivo diferente quando houver mais de uma.',
    'Não use tom motivacional exagerado, linguagem infantil ou frases de coach.',
    'Fale com a usuária sobre o negócio dela, sem termos técnicos como baseline, scoreBreakdown, validatedImpactSignals, engine, payload ou algoritmo.',
    'Não sugira anúncios sem dados de campanha ou marketing.',
    'Não sugira estoque, desperdício ou produção avançada se os dados não forem confiáveis.',
    'Quando melhorar uma jogada, pense em formato de ficha guiada: title, actionKind, actionType, actionName, productName, combinationName, channelName, customerGroup, whereToDo, whatToDo, whyThis, afterDo, expectedResult, ifNoResult e systemActionContext.',
    'commercialPlay.title deve ser curto, quase uma CTA, sem repetir o passo a passo: exemplos bons são "Crie um cupom de recompra", "Aumente o pedido com upsell", "Traga clientes de volta" ou "Complete a leitura do Cardápio". O detalhe fica em whatToDo, setupSteps, distributionSteps e suggestedMessage.',
    'A ficha principal da usuária não deve mostrar howBocaFoodReads nem texto técnico de medição. Measurement continua interno.',
    'A ficha precisa contar o próximo clique no BocaFood: onde fazer, o que preencher, por que isso desbloqueia a próxima jogada, o que acontece depois e qual botão usar.',
    'Não exponha raciocínio interno, restrições estratégicas ou linguagem de análise em texto para a usuária. Evite frases como produto forte, venda barata, não divulgar para todos, se a margem permitir, estratégia clara, mecanismo, guardrail, pedidos entram automaticamente, único canal usado pela Temporada, como o BocaFood vai observar, como o BocaFood vai medir, leitura, score ou algoritmo. Transforme isso em instrução simples e executável.',
    'Quando a jogada for comercial, preencha salesPlayExecution com receita de execução: configuração, público, divulgação, mensagem sugerida, depois que fizer e discountDecision recebido.',
    'Valores de cupom ou promoção não são criados pela IA. Desconto, pedido mínimo, validade, limite de uso, margem mínima, margem após desconto e custo do canal devem vir apenas de discountDecision ou de campos determinísticos enviados pelo BocaFood.',
    'Se sugerir código de cupom, use apenas quando ele vier do BocaFood ou como código sugerido. Nunca repita código listado em availableActions.usedCouponCodes, cupons cadastrados ou jogadas anteriores.',
    'discountDecision é decisão do BocaFood: ele verifica preço, custo, ficha técnica, margem mínima desejada pela usuária para o produto/canal e taxas do canal antes de liberar desconto. A IA só formata e explica essa decisão.',
    'Cupom e promoção só podem aparecer com desconto, pedido mínimo, validade e limite de uso concretos quando discountDecision.canDiscount for true. Se canDiscount for false ou estiver ausente, não recomende desconto.',
    'Não invente nem arredonde por conta própria valores como 5%, €15, 20 usos, validade, margem, preço, custo ou pedido mínimo. Se esses valores não vierem do BocaFood, escolha jogada sem desconto ou desbloqueio.',
    'Produto forte não deve virar desconto automaticamente. Antes de cupom/promoção, prefira upsell, combo, clientes recorrentes, pontos, canal direto ou rotina sem desconto conforme o objetivo da temporada.',
    'Cupom em produto forte só pode aparecer com estratégia clara: recompra, reativação, primeira compra pelo Cardápio ou meta de volume. O título deve dizer essa estratégia.',
    'Quando houver 2 ou 3 jogadas, elas precisam ter papéis diferentes. Não repita cupom, produto, público, canal, mecanismo ou benefício entre jogadas.',
    'Uma jogada é uma hipótese comercial completa. Não transforme configuração, divulgação, mensagem, validade, pedido mínimo, limite de desconto ou envio de link em jogadas separadas.',
    'Se houver cupom ou promoção, envio de link, WhatsApp, código, desconto, pedido mínimo, validade e limite de uso devem entrar em salesPlayExecution.setupSteps, distributionSteps ou guardrails da mesma ficha.',
    'Se uma ação recebida for fraca, genérica, insegura ou parecer subtarefa de outra jogada, normalize para commercial, unlock ou baseline quando houver caminho real; se não houver caminho real, deixe claro que ela não deve ser usada como jogada principal. Quem decide renderizar menos que o limite máximo é a camada determinística.',
    'A única exceção é código sugerido de cupom: a IA pode sugerir um código curto quando a jogada for criar cupom, mas ele deve aparecer como "Código sugerido", nunca como cupom existente.',
    'A ficha ativa não deve antecipar plano B. Não use bloco visual Se não funcionar; mantenha ifNoResult apenas como dado interno quando vier no contexto.',
    'Use Resultado esperado em vez de Depois que fizer quando o texto for apenas voltar para Temporadas.',
    'Nunca escreva benefício pequeno, desconto leve, promoção curta, se a margem permitir, se a margem continuar segura, confira ou verifique.',
    'A IA só pode citar módulos, botões e ações reais enviados em systemActionContext ou availableActions. Não invente tela, botão, rota ou dado.',
    'Retorne exatamente um JSON com headline, helpingSignals, blockingSignals, nextAction e, quando houver clareza suficiente, commercialPlay.',
    'Use somente uma ação de salesIntelligence.actionGuardrails.candidateActions. Copie candidateId no commercialPlay.candidateId.',
    'Nunca transforme salesIntelligence.actionGuardrails.blockedActions em nova jogada. Bloqueado significa que a ação já está em uso ou em leitura.',
    'headline deve ser uma frase curta sobre a temporada.',
    'helpingSignals e blockingSignals devem ser arrays com frases simples.',
    'nextAction deve ser uma ação prática para a usuária executar agora e deve começar com um verbo explícito: Crie, Ative, Use, Cadastre, Monte, Chame, Ajuste ou Revise.',
    'commercialPlay, quando retornado, deve ser um objeto pequeno com os campos da ficha guiada e sem dados inventados.',
    'commercialPlay.actionKind deve ser commercial, unlock ou baseline.',
    'commercialPlay.whatToDo deve repetir a ação explícita com produto, canal/público e passo dentro do BocaFood.',
    'Para Combo/Menu ou Upsell, commercialPlay.combinationName é obrigatório e precisa ser o nome real do complemento enviado em candidateActions.',
    'commercialPlay.afterDo deve explicar o que acontece depois que a usuária executar a ação, sem usar linguagem técnica de measurement.'
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
      strongHours: [],
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
      actionOpportunities: _compactOpportunities(relatedData.actionOpportunities || metrics.actionOpportunities || {}),
      salesIntelligence: _safeSalesIntelligence(relatedData.salesIntelligence || {})
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
      var recommendation = _validSeasonReading(data && (data.recommendation || data), context);
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
    var firstPath = data.salesIntelligence && data.salesIntelligence.businessPossibilities && data.salesIntelligence.businessPossibilities.recommendedPaths && data.salesIntelligence.businessPossibilities.recommendedPaths[0];
    var progress = _num(status.progressPercent);
    if (_weakReadingBase(context)) return _baseReadingRecommendation();
    if (firstPath && (firstPath.actionName || firstPath.actionType)) {
      return _seasonReading(
        progress < 75 ? 'A temporada precisa de uma ação de venda mais clara' : 'A temporada tem um caminho de venda concreto',
        [firstPath.evidence || firstPath.reason || 'Existe uma ação de venda possível com os dados atuais.'],
        [],
        _pathActionText(firstPath)
      );
    }
    if (firstAction && firstAction.description) {
      return _seasonReading(
        progress < 75 ? 'A temporada precisa de uma ação prática agora' : 'A temporada tem uma próxima ação clara',
        [firstAction.why || 'A ação vem dos pedidos e sinais validados da temporada.'],
        [],
        _singleFallbackAction(firstAction, data) || firstAction.description
      );
    }

    if (objective === 'increase_ticket') return _ticketRecommendation(data, progress);
    if (objective === 'retain_customers') return _retainRecommendation(data, progress);
    if (objective === 'improve_consistency') return _consistencyRecommendation(data, progress);
    return _sellMoreRecommendation(data, progress);
  }

  function _pathActionText(path) {
    path = path || {};
    var type = _normalizeActionType(path.actionType || '');
    var action = path.actionName || '';
    var product = path.productName || '';
    var channel = path.channelName ? ' no ' + path.channelName : '';
    var reason = path.reason || path.evidence || '';
    if (type === 'upsell') return 'Cadastre ' + (action && !_genericName(action) ? 'o upsell ' + action : 'um upsell') + (product ? ' junto de ' + product : '') + ' no Cardápio' + (reason ? ', porque ' + reason + '.' : '.');
    if (type === 'promotion') return (action && !_genericName(action) ? 'Use a promoção ' + action : 'Crie uma promoção') + (product ? ' para ' + product : '') + channel + (reason ? ', porque ' + reason + '.' : '.');
    if (type === 'coupon') return (action && !_genericName(action) ? 'Use o cupom ' + action : 'Crie um cupom') + (product ? ' para ' + product : '') + channel + (reason ? ', porque ' + reason + '.' : '.');
    if (type === 'points') return 'Chame clientes com pontos' + (product ? ' para comprar ' + product : '') + (reason ? ', porque ' + reason + '.' : '.');
    if (type === 'review_or_reposition') return 'Revise ' + (product || 'o produto parado') + ' antes de criar desconto' + (reason ? ', porque ' + reason + '.' : '.');
    if (type === 'create_sales_action') return product ? 'Cadastre um upsell para ' + product + ' no Cardápio.' : _baseActionText();
    return product ? 'Use ' + product + channel + (reason ? ', porque ' + reason + '.' : '.') : _baseActionText();
  }

  function _sellMoreRecommendation(data, progress) {
    var product = _firstProductName(data);
    return _seasonReading(
      progress < 75 ? 'A temporada está abaixo do ritmo esperado' : 'A temporada está mantendo o ritmo de venda',
      [
        product ? product + ' está puxando as vendas.' : 'Há pedidos reais suficientes para acompanhar o ritmo.',
        data.topChannels && data.topChannels.length ? 'Existe canal com resposta melhor.' : ''
      ],
      [
        progress < 75 ? 'O progresso ainda está abaixo do ideal para este momento.' : '',
        'Use desconto apenas quando ele tiver regra clara, produto certo e acompanhamento de pedidos.'
      ],
      product ? 'Cadastre um upsell para ' + product + ' no Cardápio.' : _baseActionText()
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
      product ? 'Use ' + product + ' como produto gatilho para oferecer um complemento no Cardápio.' : _baseActionText()
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
      'Use o produto que eles já conhecem como motivo para uma nova compra.'
    );
  }

  function _consistencyRecommendation(data, progress) {
    return _seasonReading(
      'A consistência precisa de uma ação nos dias fracos',
      [
        data.activeSalesDays > 0 ? 'Já existem dias com venda para comparar.' : '',
        data.topChannels && data.topChannels.length ? 'Há canal com melhor resposta.' : ''
      ],
      [
        data.weakDays > 0 ? data.weakDays + ' dia(s) fraco(s) ainda pesam no ritmo.' : '',
        'Vendas concentradas em poucos dias deixam a temporada mais instável.'
      ],
      _firstProductName(data) ? 'Envie o link do Cardápio para clientes que compraram ' + _firstProductName(data) + '.' : _baseActionText()
    );
  }

  function _seasonReading(headline, helpingSignals, blockingSignals, nextAction) {
    return {
      headline: headline || 'A temporada precisa de leitura nos próximos dias',
      helpingSignals: _cleanList(helpingSignals).slice(0, 4),
      blockingSignals: _cleanList(blockingSignals).slice(0, 4),
      nextAction: nextAction || _baseActionText()
    };
  }

  function _baseReadingRecommendation() {
    return _seasonReading(
      'A temporada ainda precisa de base para escolher uma jogada comercial',
      [],
      ['Ainda não existe histórico suficiente para escolher produto, canal ou ação de venda com segurança.'],
      _baseActionText()
    );
  }

  function _baseActionText() {
    return 'Complete produto e pagamento nos próximos pedidos do Cardápio antes de concluir.';
  }

  function _weakReadingBase(context) {
    context = context || {};
    var data = context.operationalData || {};
    var confidence = context.confidence || {};
    var orders = _num(data.ordersCurrentPeriod);
    var product = _firstProductName(data);
    var channels = data.channelBreakdown || data.topChannels || [];
    var dataConfidence = String(confidence.dataConfidence || confidence.baselineConfidence || '').toLowerCase();
    var rolling30 = data.rolling30 || data.last30 || data.last30Days || data.history30 || {};
    var orders30 = _num(rolling30.ordersCount || rolling30.orders || data.ordersLast30Days || data.ordersLast30 || data.orders30d);
    if (orders30 > 0) return false;
    if (orders > 0) return false;
    return true;
  }

  function _singleFallbackAction(action, data) {
    var text = [action && action.title, action && action.description, action && action.why].join(' ');
    if (!_hasGenericList(text)) return action && action.description || '';
    var product = action && (action.productName || action.measurement && action.measurement.productName) || _firstProductName(data);
    var source = String(action && action.source || '');
    if (source === 'upsell') return product ? 'Use ' + product + ' como produto gatilho para oferecer um complemento no Cardápio.' : _baseActionText();
    if (source === 'retention' || source === 'points') return product ? 'Use ' + product + ' como motivo de recompra para clientes que já conhecem o produto.' : 'Use a base de clientes recorrentes para puxar recompra.';
    if (source === 'channels' || source === 'consistency') return product ? 'Envie o link do Cardápio para clientes que compraram ' + product + '.' : _baseActionText();
    return product ? 'Cadastre um upsell para ' + product + ' no Cardápio.' : _baseActionText();
  }

  function _hasGenericList(text) {
    text = _fold(text || '');
    return /cupom.*promoc.*upsell|promoc.*upsell.*combo|crie ou ative|crie ou use|acao concreta|acao objetiva|acao de venda simples|transforme em acao|crie uma acao|use melhor|destaque o produto|melhore a divulg/.test(text);
  }

  function _normalizeActionType(type) {
    type = _fold(type || '');
    if (type.indexOf('upsell') >= 0) return 'upsell';
    if (type.indexOf('promotion') >= 0 || type.indexOf('promoc') >= 0) return 'promotion';
    if (type.indexOf('coupon') >= 0 || type.indexOf('cupom') >= 0) return 'coupon';
    if (type.indexOf('point') >= 0 || type.indexOf('ponto') >= 0) return 'points';
    if (type.indexOf('review') >= 0 || type.indexOf('revis') >= 0) return 'review_or_reposition';
    if (type.indexOf('create') >= 0 || type.indexOf('acao') >= 0 || type.indexOf('ação') >= 0) return 'create_sales_action';
    return type;
  }

  function _genericName(name) {
    name = _fold(name || '');
    return !name || [
      'upsell cadastrado', 'promocao cadastrada', 'promoção cadastrada', 'cupom cadastrado',
      'criar acao de venda', 'criar ação de venda', 'programa de pontos',
      'oferecer', 'criar', 'usar', 'use', 'cadastre', 'cadastrar', 'ativar', 'ative',
      'destacar', 'destaque', 'publicar', 'publique', 'enviar', 'envie', 'acao', 'ação',
      'promocao', 'promoção', 'cupom', 'upsell', 'combo', 'oferta', 'complemento',
      'produto', 'canal', 'extra'
    ].indexOf(name) >= 0;
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

  function _validSeasonReading(value, context) {
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
    var reading = _seasonReading(value.headline, value.helpingSignals || [], value.blockingSignals || [], value.nextAction);
    if (value.commercialPlay && typeof value.commercialPlay === 'object' && !Array.isArray(value.commercialPlay)) {
      reading.commercialPlay = _safeCommercialPlay(value.commercialPlay);
    }
    _validateRecommendationAgainstGuardrails(reading, context);
    return reading;
  }

  function _validateRecommendationAgainstGuardrails(reading, context) {
    var guardrails = context && context.operationalData && context.operationalData.salesIntelligence && context.operationalData.salesIntelligence.actionGuardrails || null;
    var candidates = guardrails && guardrails.candidateActions || [];
    if (!guardrails || !candidates.length || !reading || !reading.commercialPlay) return true;
    var play = reading.commercialPlay || {};
    var match = _findMatchingCandidate(play, candidates);
    if (!match) throw new Error('Resposta de IA fora das ações permitidas.');
    if ((/combo|upsell/i).test(String(match.actionType || play.actionType || '')) && !_sameText(play.combinationName, match.combinationName)) {
      throw new Error('Resposta de IA sem complemento específico permitido.');
    }
    if (_findMatchingCandidate(play, guardrails.blockedActions || []) || _matchesBlockedActionName(play, guardrails.blockedActions || [])) {
      throw new Error('Resposta de IA repetiu jogada bloqueada.');
    }
    return true;
  }

  function _findMatchingCandidate(play, candidates) {
    play = play || {};
    var candidateId = String(play.candidateId || '').trim();
    var type = _aiActionTypeKey(play.actionType || play.salesPlayExecution && play.salesPlayExecution.actionType || '');
    var product = _fold(play.productName || play.salesPlayExecution && play.salesPlayExecution.productName || '');
    var action = _fold(play.actionName || '');
    var combo = _fold(play.combinationName || '');
    return (candidates || []).filter(Boolean).find(function (candidate) {
      if (candidateId && candidate.candidateId && String(candidate.candidateId) === candidateId) return true;
      var cType = _aiActionTypeKey(candidate.actionType || '');
      var cProduct = _fold(candidate.productName || '');
      var cAction = _fold(candidate.actionName || '');
      var cCombo = _fold(candidate.combinationName || '');
      if (cType && type && cType !== type) return false;
      if (cProduct && product && cProduct !== product) return false;
      if (cAction && action && cAction !== action) return false;
      if ((cType === 'combo' || cType === 'upsell') && cCombo && combo && cCombo !== combo) return false;
      return cType && cProduct && cType === type && cProduct === product;
    }) || null;
  }

  function _sameText(a, b) {
    return _fold(a || '') === _fold(b || '');
  }

  function _matchesBlockedActionName(play, blocked) {
    var type = _aiActionTypeKey(play.actionType || play.salesPlayExecution && play.salesPlayExecution.actionType || '');
    var action = _fold(play.actionName || '');
    if (!/promotion|coupon|upsell/.test(type) || !action) return false;
    return (blocked || []).some(function (item) {
      return _aiActionTypeKey(item && item.actionType || '') === type && _fold(item && item.actionName || '') === action;
    });
  }

  function _aiActionTypeKey(value) {
    var text = _fold(value || '');
    if (/promoc|promotion/.test(text)) return 'promotion';
    if (/cupom|coupon/.test(text)) return 'coupon';
    if (/upsell|complement/.test(text)) return 'upsell';
    if (/combo|menu/.test(text)) return 'combo';
    if (/ponto|reativ|retention|cliente/.test(text)) return 'retention';
    if (/canal|channel/.test(text)) return 'channel';
    if (/base/.test(text)) return 'base_reading';
    return text;
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
    return (channels || []).filter(function (channel) {
      return _isCardapioAIChannel(channel && (channel.name || channel.channelName || channel.channel || channel.key || channel.label || ''));
    }).slice(0, 4).map(function (channel) {
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

  function _isCardapioAIChannel(value) {
    var text = _fold(value || '');
    return text === 'cardapio' || text === 'cardapio publico' || text === 'loja publica' || text === 'loja online' || text === 'storefront';
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
          couponCode: action.couponCode || action.measurement && action.measurement.couponCode || '',
          promotionName: action.promotionName || action.measurement && action.measurement.promotionName || '',
          upsellName: action.upsellName || action.measurement && action.measurement.upsellName || '',
          customerGroup: action.customerGroup || action.measurement && action.measurement.customerGroup || '',
          successMetric: action.successMetric || action.measurement && action.measurement.successMetric || '',
          commercialPlay: _safeCommercialPlay(action.commercialPlay || action.commercial || {}),
          measurement: _safeMeasurement(action.measurement || {}),
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

  function _safeMeasurement(measurement) {
    measurement = measurement || {};
    return {
      type: measurement.type || '',
      productName: measurement.productName || '',
      productKey: measurement.productKey || '',
      channel: measurement.channel || '',
      hour: measurement.hour || '',
      couponCode: measurement.couponCode || '',
      promotionName: measurement.promotionName || '',
      upsellName: measurement.upsellName || '',
      customerGroup: measurement.customerGroup || '',
      successMetric: measurement.successMetric || '',
      expectedQuantity: _num(measurement.expectedQuantity)
    };
  }

  function _safeCommercialPlay(play) {
    play = play || {};
    return {
      title: play.title || '',
      summary: play.summary || '',
      candidateId: play.candidateId || '',
      actionKind: play.actionKind || '',
      actionType: play.actionType || '',
      actionName: play.actionName || '',
      productName: play.productName || '',
      combinationName: play.combinationName || '',
      channelName: play.channelName || '',
      customerGroup: play.customerGroup || '',
      whereToDo: play.whereToDo || '',
      whatToDo: play.whatToDo || '',
      whyThis: play.whyThis || '',
      afterDo: play.afterDo || '',
      expectedResult: play.expectedResult || '',
      howBocaFoodReads: play.howBocaFoodReads || '',
      ifNoResult: play.ifNoResult || '',
      salesPlayExecution: _safeSalesPlayExecution(play.salesPlayExecution || {}),
      systemActionContext: _safeObject(play.systemActionContext || {})
    };
  }

  function _safeSalesPlayExecution(value) {
    value = value || {};
    return {
      actionType: value.actionType || '',
      actionStatus: value.actionStatus || '',
      productName: value.productName || '',
      channelName: value.channelName || '',
      audience: value.audience || '',
      benefitType: value.benefitType || '',
      benefitValue: value.benefitValue || '',
      minimumOrderValue: _num(value.minimumOrderValue),
      usageLimit: _num(value.usageLimit),
      validUntil: value.validUntil || '',
      distributionChannel: value.distributionChannel || '',
      suggestedMessage: value.suggestedMessage || '',
      suggestedCode: value.suggestedCode || '',
      expectedQuantity: _num(value.expectedQuantity),
      setupSteps: _safeSimpleList(value.setupSteps || [], 8),
      distributionSteps: _safeSimpleList(value.distributionSteps || [], 6),
      guardrails: _safeSimpleList(value.guardrails || [], 6),
      afterAction: value.afterAction || '',
      primaryButtonLabel: value.primaryButtonLabel || '',
      secondaryButtonLabel: value.secondaryButtonLabel || '',
      discountDecision: _safeObject(value.discountDecision || {})
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

  function _safeSalesIntelligence(info) {
    info = info || {};
    var actionPerformance = info.actionPerformance || {};
    var available = info.availableActions || {};
    var points = info.pointsProgram || {};
    var customers = info.customerSignals || {};
    var possibilities = info.businessPossibilities || {};
    return {
      period: info.period || 'ultimos_30_dias',
      revenue: _round(_num(info.revenue)),
      previousRevenue: _round(_num(info.previousRevenue)),
      orders: _round(_num(info.orders)),
      previousOrders: _round(_num(info.previousOrders)),
      averageTicket: _round(_num(info.averageTicket)),
      activeDays: _round(_num(info.activeDays)),
      topProducts: _safeProducts(info.topProducts || []),
      topChannels: _safeChannels(info.topChannels || []),
      strongHours: [],
      lowSellingProducts: _safeProducts(info.lowSellingProducts || []),
      realMenuCombinations: _safeRealMenuCombinations(info.realMenuCombinations || []),
      actionPerformance: {
        couponOrders: _round(_num(actionPerformance.couponOrders)),
        promotionOrders: _round(_num(actionPerformance.promotionOrders)),
        upsellOrders: _round(_num(actionPerformance.upsellOrders)),
        discountTotal: _round(_num(actionPerformance.discountTotal)),
        upsellAddedRevenue: _round(_num(actionPerformance.upsellAddedRevenue)),
        seasonLinkedActions: _safeActionList(actionPerformance.seasonLinkedActions || [], 6)
      },
      availableActions: {
        allowedTypes: _allowedSalesActionTypes(),
        promotions: _safeActionList(available.promotions || [], 4),
        coupons: _safeActionList(available.coupons || [], 4),
        upsells: _safeActionList(available.upsells || [], 4)
      },
      actionGuardrails: _safeActionGuardrails(info.actionGuardrails || {}),
      businessPossibilities: {
        businessConfig: _safeBusinessConfig(possibilities.businessConfig || {}),
        salesChannels: _safePossibilityChannels(possibilities.salesChannels || []),
        bestMarginChannels: _safePerformanceChannels(possibilities.bestMarginChannels || []),
        unexploredChannels: _safePossibilityChannels(possibilities.unexploredChannels || []),
        catalogProducts: _safeCatalogPossibilities(possibilities.catalogProducts || [], 6),
        menuProducts: _safeCatalogPossibilities(possibilities.menuProducts || [], 4),
        availableSalesLevers: _safeSalesLevers(possibilities.availableSalesLevers || []),
        recommendedPaths: _safeRecommendedPaths(possibilities.recommendedPaths || [])
      },
      playHistory: _safePlayHistory(info.playHistory || {}),
      pointsProgram: {
        active: points.active !== false,
        earnPerEuro: _round(_num(points.earnPerEuro)),
        redeemRate: _round(_num(points.redeemRate)),
        minimumPointsToUse: _round(_num(points.minimumPointsToUse)),
        pointsEarned30d: _round(_num(points.pointsEarned30d)),
        pointsUsed30d: _round(_num(points.pointsUsed30d)),
        customersWithPoints: _round(_num(points.customersWithPoints)),
        customersReadyToRedeem: _round(_num(points.customersReadyToRedeem))
      },
      customerSignals: {
        recurringCustomers: _round(_num(customers.recurringCustomers)),
        repurchaseRate: _round(_num(customers.repurchaseRate)),
        customersWithPoints: _round(_num(customers.customersWithPoints)),
        customersReadyToRedeem: _round(_num(customers.customersReadyToRedeem)),
        segmentCounts: _safeObject(customers.segmentCounts || {}),
        segmentGroups: _cleanList(customers.segmentGroups || []).slice(0, 5),
        recommendedAudiences: _safeRecommendedAudiences(customers.recommendedAudiences || []),
        suggestedGroups: _cleanList(customers.suggestedGroups || []).slice(0, 4)
      }
    };
  }

  function _safeRecommendedAudiences(items) {
    return (items || []).slice(0, 5).map(function (item) {
      item = item || {};
      return {
        id: String(item.id || '').slice(0, 90),
        label: String(item.label || '').slice(0, 180),
        reason: String(item.reason || '').slice(0, 220),
        count: _round(_num(item.count)),
        confidence: String(item.confidence || '').slice(0, 20),
        bestForObjective: _cleanList(item.bestForObjective || []).slice(0, 4),
        compatibleActionTypes: _cleanList(item.compatibleActionTypes || []).slice(0, 6),
        preferredChannel: String(item.preferredChannel || '').slice(0, 80),
        productName: String(item.productName || '').slice(0, 120),
        productKey: String(item.productKey || '').slice(0, 90),
        categoryName: String(item.categoryName || '').slice(0, 120),
        categoryKey: String(item.categoryKey || '').slice(0, 90),
        channelName: String(item.channelName || '').slice(0, 80),
        channelKey: String(item.channelKey || '').slice(0, 80),
        measurement: _safeObject(item.measurement || {})
      };
    }).filter(function (item) { return item.label && item.count > 0; });
  }

  function _allowedSalesActionTypes() {
    return [
      'Cupom',
      'Promoção',
      'Upsell',
      'Combo/Menu',
      'Pontos/Reativação de cliente',
      'Ajuste de preço/desconto saudável',
      'Canal de venda',
      'Revisão de produto parado',
      'Criar base de leitura'
    ];
  }

  function _safeActionGuardrails(value) {
    value = value || {};
    return {
      rule: String(value.rule || '').slice(0, 220),
      blockedActions: _safeRecommendedPaths(value.blockedActions || []).slice(0, 12),
      candidateActions: _safeRecommendedPaths(value.candidateActions || []).slice(0, 5),
      requiredFields: _cleanList(value.requiredFields || []).slice(0, 10)
    };
  }

  function _safePossibilityChannels(items) {
    return (items || []).filter(function (item) {
      return _isCardapioAIChannel(item && (item.key || item.name || item.label || ''));
    }).slice(0, 10).map(function (item) {
      item = item || {};
      return {
        key: item.key || '',
        name: item.name || item.label || '',
        commissionPct: _round(_num(item.commissionPct)),
        fixedFee: _round(_num(item.fixedFee)),
        taxPct: _round(_num(item.taxPct)),
        netRevenue: _round(_num(item.netRevenue)),
        netMarginPct: _round(_num(item.netMarginPct)),
        healthLabel: item.healthLabel || '',
        actionAdvice: item.actionAdvice || ''
      };
    }).filter(function (item) { return item.name || item.key; });
  }

  function _safePerformanceChannels(items) {
    return (items || []).filter(function (item) {
      return _isCardapioAIChannel(item && (item.key || item.name || item.label || ''));
    }).slice(0, 6).map(function (item) {
      item = item || {};
      return {
        key: item.key || '',
        name: item.name || '',
        orders: _round(_num(item.orders)),
        revenue: _round(_num(item.revenue)),
        netRevenue: _round(_num(item.netRevenue)),
        netMarginPct: _round(_num(item.netMarginPct)),
        channelCostPct: _round(_num(item.channelCostPct)),
        healthLabel: item.healthLabel || '',
        actionAdvice: item.actionAdvice || ''
      };
    }).filter(function (item) { return item.name || item.key; });
  }

  function _safeBusinessConfig(config) {
    config = config || {};
    return {
      businessName: config.businessName || '',
      city: config.city || '',
      country: config.country || '',
      language: config.language || '',
      deliveryEnabled: config.deliveryEnabled !== false,
      pickupEnabled: config.pickupEnabled !== false,
      onlineStoreEnabled: config.onlineStoreEnabled !== false,
      paymentMethods: (config.paymentMethods || []).slice(0, 6).map(function (method) {
        method = method || {};
        return {
          name: method.name || '',
          active: method.active !== false,
          provider: method.provider || '',
          feePct: _round(_num(method.feePct)),
          fixedFee: _round(_num(method.fixedFee))
        };
      }).filter(function (method) { return method.name; })
    };
  }

  function _safeRecommendedPaths(items) {
    return (items || []).filter(function (item) {
      return !item || !item.channelKey || _isCardapioAIChannel(item.channelKey || item.channelName || '');
    }).slice(0, 8).map(function (item) {
      item = item || {};
      return {
        actionType: item.actionType || '',
        actionName: item.actionName || '',
        candidateId: item.candidateId || '',
        productId: item.productId || '',
        productName: item.productName || '',
        combinationName: item.combinationName || '',
        channelKey: 'cardapio',
        channelName: 'Cardápio',
        customerGroup: item.customerGroup || '',
        specificInstruction: item.specificInstruction || '',
        whereToDo: item.whereToDo || '',
        expectedResult: item.expectedResult || '',
        evidence: item.evidence || '',
        reason: item.reason || '',
        whenToUse: item.whenToUse || '',
        channelNetMarginPct: _round(_num(item.channelNetMarginPct)),
        channelHealth: item.channelHealth || ''
      };
    }).filter(function (item) {
      return item.actionType || item.actionName || item.productName;
    });
  }

  function _safeCatalogPossibilities(items, limit) {
    return (items || []).slice(0, limit || 10).map(function (item) {
      item = item || {};
      return {
        id: item.id || '',
        name: item.name || item.label || '',
        category: item.category || '',
        price: _round(_num(item.price)),
        kind: item.kind || '',
        hasOptions: item.hasOptions === true,
        optionGroups: _safeOptionGroups(item.optionGroups || [])
      };
    }).filter(function (item) { return item.name; });
  }

  function _safeOptionGroups(items) {
    return (items || []).slice(0, 4).map(function (group) {
      group = group || {};
      return {
        name: group.name || group.title || '',
        required: group.required === true,
        min: _round(_num(group.min)),
        max: _round(_num(group.max)),
        options: _cleanList(group.options || []).slice(0, 8)
      };
    }).filter(function (group) { return group.name || group.options.length; });
  }

  function _safeSalesLevers(items) {
    return (items || []).slice(0, 6).map(function (item) {
      item = item || {};
      return {
        type: item.type || '',
        count: _round(_num(item.count)),
        names: _cleanList(item.names || []).slice(0, 4)
      };
    }).filter(function (item) { return item.type || item.names.length; });
  }

  function _safePlayHistory(history) {
    history = history || {};
    return {
      recent: _safePlayHistoryItems(history.recent || [], 8),
      winners: _safePlayHistoryItems(history.winners || [], 5),
      weakOrExpired: _safePlayHistoryItems(history.weakOrExpired || [], 5),
      activeOrReading: _safePlayHistoryItems(history.activeOrReading || [], 5)
    };
  }

  function _safePlayHistoryItems(items, limit) {
    return (items || []).slice(0, limit || 6).map(function (item) {
      item = item || {};
      return {
        actionId: item.actionId || '',
        title: item.title || '',
        source: item.source || '',
        focusKey: item.focusKey || '',
        productKey: item.productKey || '',
        status: item.status || '',
        resultDueAt: item.resultDueAt || '',
        evidence: item.evidence || '',
        orderTotal: _round(_num(item.orderTotal))
      };
    }).filter(function (item) { return item.title || item.actionId; });
  }

  function _safeRealMenuCombinations(items) {
    return (items || []).slice(0, 6).map(function (item) {
      item = item || {};
      return {
        productId: item.productId || '',
        productName: item.productName || item.name || '',
        combination: item.combination || item.label || '',
        channel: item.channel || '',
        orders: _round(_num(item.orders)),
        quantity: _round(_num(item.quantity)),
        revenue: _round(_num(item.revenue)),
        averagePrice: _round(_num(item.averagePrice)),
        averageCost: _round(_num(item.averageCost)),
        averageFees: _round(_num(item.averageFees)),
        profit: _round(_num(item.profit)),
        marginPercent: _round(_num(item.marginPercent)),
        status: item.status || '',
        reason: item.reason || ''
      };
    }).filter(function (item) {
      return item.productName && item.combination && (item.orders || item.quantity || item.revenue);
    });
  }

  function _safeActionList(items, limit) {
    return (items || []).slice(0, limit || 4).map(function (item) {
      item = item || {};
      return {
        type: item.type || '',
        name: item.name || item.label || item.title || '',
        code: item.code || '',
        productId: item.productId || '',
        productName: item.productName || '',
        benefit: item.benefit || '',
        target: item.target || '',
        status: item.status || '',
        seasonActionId: item.seasonActionId || '',
        seasonActionTitle: item.seasonActionTitle || ''
      };
    }).filter(function (item) {
      return item.name || item.code || item.seasonActionId;
    });
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

  function _fold(value) {
    var raw = String(value || '').trim().toLowerCase();
    return raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
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
