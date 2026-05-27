# Mapa de Temporadas, Missoes e Maturidade do BocaFood

Atualizado em: 2026-05-26

Este documento consolida o que foi construido no BocaFood para `Temporadas`, `Missoes operacionais` e `Maturidade do Negocio`. Ele junta a leitura dos documentos existentes com a implementacao atual em `public/js/modules/temporadas.js` e `public/js/services/seasons.ai.js`.

O objetivo e deixar claro quais dados o sistema usa, o que ele calcula, quais documentos grava e onde essa inteligencia conversa com o restante do produto.

## 1. Papel do modulo

Temporadas sao ciclos operacionais de foco. A usuaria escolhe uma direcao para um periodo curto, como vender mais, aumentar ticket, fidelizar clientes ou melhorar consistencia. Depois disso, o BocaFood acompanha os dados reais da loja e mostra progresso, ritmo, risco e resultado final.

Maturidade do Negocio e a camada permanente. Ela nao olha apenas uma meta isolada. Ela mede se o negocio esta amadurecendo com mais consistencia, risco controlado, execucao, fidelizacao e crescimento saudavel.

Na pratica:

- `Temporadas` acompanham ciclos de 30 ou 90 dias.
- `Maturidade do Negocio` acompanha a evolucao acumulada da loja.
- `Missoes` aparecem como area preparada no menu, mas ainda nao possuem um motor separado completo.

## 2. Arquivos principais

Arquivos de produto/publicacao:

- `public/js/modules/temporadas.js`
- `public/js/services/seasons.ai.js`
- `public/css/modules/temporadas.css`
- `public/admin.html`

Arquivos legados/duplicados fora de `public/`:

- `js/modules/temporadas.js`
- `css/modules/temporadas.css`

Documentacao relacionada:

- `TEMPORADAS_FUNCIONAMENTO_MAPEAMENTO.md`
- `SEASONS_ARCHITECTURE.md`
- `SEASONS_SPEC.md`
- `SEASON_SCORING_SYSTEM.md`
- `SEASONS_UI_FLOW.md`
- `DATA_MAP_FOR_SEASONS.md`
- `MATURIDADE_NEGOCIO_FUNCIONAMENTO_MAPEAMENTO.md`
- `STONES_ARCHITECTURE.md`
- `STONES_SCORING_SYSTEM.md`
- `STONES_EVOLUTION_SYSTEM.md`
- `STONES_UI_FLOW.md`

Observacao importante: para telas publicadas no Admin, a fonte de verdade e `public/`.

## 3. Rotas e menu

Rotas atuais:

- `crescimento/maturidade`
- `crescimento/temporadas`

No Admin:

- `Maturidade do Negocio` fica como entrada propria da sidebar.
- `Temporadas` fica dentro da area de Crescimento/Operacao conforme navegacao atual.
- `Missoes` foi incluida como area futura no menu, com placeholder.

O modulo `Modules.Temporadas` identifica a tela pelo subcaminho:

- quando a rota e `crescimento/maturidade`, carrega a experiencia de Maturidade;
- quando a rota e `crescimento/temporadas`, carrega a experiencia de Temporadas.

## 4. Telas de Temporadas

A tela de Temporadas trabalha com tres leituras principais:

- `Ativa`: mostra a temporada em andamento, progresso, risco, score e recomendacao.
- `Programadas`: mostra temporadas agendadas para comecar depois.
- `Historico`: mostra temporadas finalizadas ou abandonadas.

Tambem existe fluxo para criar temporada com escolhas guiadas:

- objetivo;
- duracao;
- meta automatica ou fixa;
- dificuldade;
- estrategia/build;
- data de inicio.

## 5. Objetivos disponiveis

Objetivos atuais:

| Chave | Nome funcional | O que mede principalmente |
|---|---|---|
| `sell_more` | Vender mais | faturamento, pedidos e dias com venda |
| `increase_ticket` | Aumentar ticket | ticket medio, valor por pedido e itens/adicionais |
| `retain_customers` | Fidelizar clientes | clientes recorrentes e recompra |
| `improve_consistency` | Melhorar consistencia | dias ativos, regularidade semanal e menos oscilacao |

Esses objetivos determinam qual metrica e usada como foco principal e como o score e interpretado.

## 6. Duracao, dificuldade e tipo de meta

Duracoes:

- `sprint`: 30 dias.
- `season`: 90 dias.

Tipo de meta:

- `automatic`: o sistema calcula a meta com base no historico recente da loja.
- `fixed`: a usuaria define a meta manualmente.

Dificuldade:

- `safe`: caminho mais seguro.
- `balanced`: caminho equilibrado.
- `aggressive`: caminho mais puxado.

Build/estrategia:

- `volume`: foco em volume.
- `margin`: foco em margem/ticket.
- `retention`: foco em recompra/fidelizacao.

## 7. Colecoes usadas diretamente

### `tenants/{tenantId}/seasons`

Colecao principal das temporadas.

Campos relevantes:

- `tenantId`
- `title`
- `objective`
- `build`
- `difficulty`
- `durationType`
- `targetMode`
- `targetValue`
- `targetMetric`
- `baselinePeriod`
- `baselineValue`
- `baselineRevenue`
- `baselineOrders`
- `baselineAverageTicket`
- `baselineActiveDays`
- `baselineRecurringCustomers`
- `baselineRepurchaseRate`
- `baselineConfidence`
- `calculatedTargetValue`
- `initialRiskLevel`
- `startDate`
- `endDate`
- `status`
- `currentScore`
- `currentStatus`
- `riskLevel`
- `progressPercent`
- `currentMetrics`
- `goalReachedAt`
- `goalCelebrationShownAt`
- `goalCelebrationPending`
- `goalReachedSnapshotId`
- `startedAt`
- `finishedAt`
- `abandonedAt`
- `finalResult`
- `finalScore`
- `finalProgressPercent`
- `finalMetrics`
- `finalSummary`
- `createdAt`
- `updatedAt`
- `aiEnabled`
- `lastAIRecommendationAt`
- `lastAIRecommendationSummary`

### `tenants/{tenantId}/season_metrics_snapshots`

Guarda retratos de metrica da temporada. Serve para auditoria, comparacao, recomendacao e fechamento.

Tipos principais:

- `daily`
- `final`

Campos comuns:

- `tenantId`
- `seasonId`
- `snapshotType`
- `dateKey`
- `periodStart`
- `periodEnd`
- `mainMetrics`
- `auxiliaryMetrics`
- `alerts`
- `confidence`
- `aiRecommendation`
- `createdAt`
- `updatedAt`

### `tenants/{tenantId}/business_maturity/current`

Documento consolidado da maturidade atual.

Campos principais:

- `tenantId`
- `currentStone`
- `nextStone`
- `stoneProgressPercent`
- `previousStoneProgressPercent`
- `maturityScore`
- `indexes`
- `strengths`
- `weaknesses`
- `checklist`
- `checklistSummary`
- `blockers`
- `lastSeasonImpact`
- `lastSeasonImpactPercent`
- `lastSeasonImpactReason`
- `seasonContributionSummary`
- `lastUpgradeSignature`
- `lastUpgradeReason`
- `lastUpgradeFrom`
- `lastUpgradeTo`
- `lastCalculatedAt`
- `lastUpgradeAt`
- `createdAt`
- `updatedAt`
- `calculationVersion`
- `calculationNotes`

### `tenants/{tenantId}/business_maturity_snapshots`

Historico auditavel da maturidade.

Tipos vistos na documentacao/implementacao:

- `monthly`
- `season_final`
- `stone_upgrade`
- `manual_recalculation` previsto para futuro.

### `tenants/{tenantId}/stone_upgrade_events`

Registra evolucao de Pedra.

Uso:

- evita repetir upgrade para a mesma assinatura de calculo;
- preserva quando e por que a loja subiu de nivel;
- permite auditoria do caminho de maturidade.

## 8. Dados lidos para calcular Temporadas

Fonte principal:

- `orders`

O modulo filtra pedidos validos por periodo e ignora cancelados/invalidos. A partir deles calcula:

- faturamento;
- quantidade de pedidos;
- ticket medio;
- dias com venda;
- clientes recorrentes;
- taxa de recompra;
- frequencia media;
- itens por pedido;
- regularidade semanal;
- horarios fortes;
- produtos mais vendidos;
- periodos fracos;
- queda recente.

Dados de produtos dentro dos pedidos sao lidos em `orders.items`, com normalizacao de nome, quantidade e total quando disponiveis.

## 9. Dados lidos para calcular Maturidade

A tela de Maturidade usa:

- `orders`
- `store_customers`
- `flight_plans`
- `flight_plan_month_scenarios`
- `business_maturity/current`
- `stone_upgrade_events`
- `business_maturity_snapshots`
- `seasons`

Ela combina historico de pedidos, clientes, temporadas encerradas e Plano de Voo para calcular a evolucao acumulada.

## 10. Fontes preparadas ou citadas para evolucao futura

A arquitetura de Temporadas tambem mapeia dados que podem entrar em fases futuras:

- `products`
- `reviews`
- `points_movements`
- `promotions`
- `coupons`
- `upsellEvents`
- `movimentacoes`
- `financeiro_entradas`
- `financeiro_saidas`
- `financeiro_apagar`
- `contas_pagar`
- `compras`
- `flight_plans`
- `flight_plan_month_scenarios`

Ponto importante: nem todas essas fontes pesam hoje no score operacional da Temporada. Algumas aparecem como preparacao de arquitetura, contexto de recomendacao ou evolucao futura.

## 11. Como a temporada e criada

Ao criar uma temporada, o sistema:

1. valida tenant e disponibilidade do banco;
2. normaliza os dados preenchidos;
3. calcula periodo de inicio e fim;
4. calcula baseline;
5. define meta automatica ou usa meta fixa;
6. calcula risco inicial;
7. define status inicial;
8. impede conflito de datas com temporada ativa ou programada;
9. salva em `seasons`.

Regras importantes:

- so pode existir uma temporada ativa por tenant;
- temporadas ativas/programadas nao podem se sobrepor;
- temporada ativa nao pode ser editada;
- temporada finalizada ou abandonada nao pode ser reativada como se fosse a mesma;
- uma programada vencida pode ser promovida automaticamente para ativa quando nao ha outra ativa.

## 12. Status da temporada

Status usados:

- `draft`
- `scheduled`
- `active`
- `finished`
- `abandoned`

Leitura funcional:

- `scheduled`: temporada planejada para comecar.
- `active`: temporada em andamento.
- `finished`: temporada encerrada com resultado.
- `abandoned`: temporada interrompida.

## 13. Metricas atuais da temporada

O objeto `currentMetrics` pode trazer:

- `currentValue`
- `targetValue`
- `revenue`
- `orders`
- `averageTicket`
- `activeDays`
- `recurringCustomers`
- `repurchaseRate`
- `averageFrequency`
- `averageItemsPerOrder`
- `weeklyRegularity`
- `weakDays`
- `strongHours`
- `topProducts`
- `lowSellingProducts`
- `elapsedDays`
- `daysRemaining`
- `expectedProgress`
- `progressRatio`
- `observations`

Essas metricas sao calculadas a partir do periodo da temporada e do historico de pedidos.

## 14. Score, progresso e risco

O score da temporada e deterministico. Ele nao depende de IA para calcular progresso.

O modulo calcula:

- `currentScore`
- `progressPercent`
- `currentStatus`
- `riskLevel`
- `currentMetrics`

Exemplos de leitura:

- se a loja esta perto do ritmo esperado, o risco tende a ficar menor;
- se o progresso esta atrasado para o dia atual da temporada, o risco sobe;
- se ha queda recente, o risco pode ser escalado;
- se ha poucos dados, a confianca do resultado fica menor.

O `progressPercent` pode passar de 100 internamente, mas a leitura visual normalmente deve evitar parecer planilha ou ranking tecnico demais.

## 15. Pesos por objetivo

### Vender mais

Mede principalmente:

- faturamento;
- pedidos;
- dias com venda.

Na documentacao, a matriz indica:

- faturamento: 45%;
- pedidos: 35%;
- dias com venda: 20%.

### Aumentar ticket

Mede principalmente:

- ticket medio;
- valor medio por pedido;
- adicionais/combos/upsell quando houver sinal.

### Fidelizar clientes

Mede principalmente:

- clientes recorrentes;
- taxa de recompra;
- frequencia.

### Melhorar consistencia

Mede principalmente:

- dias com venda;
- regularidade semanal;
- reducao de oscilacao.

## 16. Snapshots

Snapshots sao usados para congelar leituras de desempenho.

Usos atuais:

- registrar leitura diaria/final;
- dar contexto para recomendacao;
- preservar o resultado ao finalizar;
- evitar que uma mudanca futura nos pedidos altere a leitura historica sem rastreio.

Na finalizacao da temporada, o sistema tenta criar um snapshot final se ainda nao existir.

## 17. Finalizacao da temporada

Ao finalizar uma temporada, o sistema:

1. recarrega a temporada atual;
2. carrega pedidos do periodo;
3. recalcula score final com os dados salvos;
4. grava:
   - `status: finished`;
   - `finishedAt`;
   - `finalResult`;
   - `finalScore`;
   - `finalProgressPercent`;
   - `finalMetrics`;
   - `finalSummary`;
5. cria snapshot final;
6. atualiza leituras que alimentam maturidade.

O resultado final pode gerar:

- o que funcionou;
- o que travou;
- leitura de evolucao;
- sugestao de proxima temporada;
- motivo da sugestao.

## 18. IA e recomendacoes

Arquivo:

- `public/js/services/seasons.ai.js`

O servico monta contexto para recomendacao, mas nao calcula score, meta, risco ou progresso. Esses valores continuam vindo do motor deterministico do BocaFood.

O contexto inclui:

- dados da temporada;
- periodo;
- desempenho;
- risco;
- dados operacionais;
- confianca;
- snapshots.

Se nao houver endpoint externo configurado, existe recomendacao fallback por objetivo:

- vender mais: reforcar produto, horario ou canal com melhor resposta;
- aumentar ticket: melhorar composicao do pedido;
- fidelizar clientes: incentivar recompra;
- melhorar consistencia: reduzir dias fracos e distribuir melhor as vendas.

## 19. Maturidade do Negocio

Maturidade mede a evolucao permanente da loja.

Ela usa o conceito de Pedras:

1. Pedra Bruta
2. Quartzo
3. Ametista
4. Safira
5. Esmeralda
6. Rubi
7. Diamante
8. Onix

Pedra Bruta nao e fracasso. E o estagio inicial de construcao.

## 20. Indices da Maturidade

A maturidade combina seis indices:

| Indice | Peso |
|---|---:|
| Crescimento saudavel | 20% |
| Consistencia | 25% |
| Saude financeira | 20% |
| Risco controlado | 15% |
| Fidelizacao | 10% |
| Execucao | 10% |

Esses indices formam o `maturityScore`.

O sistema tambem gera:

- pontos fortes;
- pontos limitadores;
- checklist automatico;
- bloqueios para evolucao;
- progresso ate a proxima Pedra;
- evento de subida quando aplicavel.

## 21. Como as Temporadas alimentam Maturidade

Temporadas impactam Maturidade quando sao finalizadas ou abandonadas.

O sistema considera:

- quantidade de temporadas fechadas;
- score medio;
- risco medio;
- abandono;
- evolucao recente;
- consistencia da execucao;
- impacto da ultima temporada.

Uma temporada finalizada com bom score e risco controlado pode ajudar a loja a evoluir. Uma temporada abandonada ou com risco alto pode limitar a evolucao.

## 22. Relacao com outros modulos

### Pedidos

Pedidos sao a principal fonte de dados reais para Temporadas e Maturidade.

Usos:

- faturamento;
- numero de pedidos;
- ticket medio;
- produtos vendidos;
- horarios fortes;
- clientes recorrentes;
- dias com venda.

### Clientes

Clientes entram principalmente na leitura de fidelizacao.

Usos:

- recompra;
- recorrencia;
- clientes com mais de um pedido;
- base de clientes criada pela loja publica, pedido manual ou venda presencial.

### Plano de Voo

Maturidade le `flight_plans` e `flight_plan_month_scenarios` para entender rota/meta e comparar execucao com direcao planejada.

Temporadas e Plano de Voo nao sao a mesma coisa:

- Plano de Voo define rota anual/restante do ano;
- Temporada cria foco operacional de curto prazo.

### Performance

Performance acompanha a execucao da rota e dos indicadores atuais. Temporadas podem usar parte da mesma base operacional, principalmente pedidos e ritmo.

### Marketing

Promocoes, cupons, upsell e pontos aparecem como fontes preparadas para enriquecer Temporadas, especialmente em objetivos de ticket, recompra e venda. O uso direto no score ainda depende de conexoes mais completas e dados consistentes de evento.

### Financeiro

Maturidade ja considera saude financeira em nivel consolidado. A arquitetura tambem aponta que financeiro pode alimentar leituras futuras de risco, margem, entradas, saidas e consistencia.

### Estoque, Producao e Compras

Esses dados ainda nao sao o centro da Temporada V1. Eles sao importantes para fases futuras, quando o sistema puder sugerir missoes baseadas em custo, compra, estoque minimo, perdas, producao planejada e margem operacional.

## 23. Inteligencia que o sistema ja gera

Hoje o BocaFood ja consegue gerar:

- temporada ativa;
- temporadas programadas;
- historico de temporadas;
- bloqueio de conflito de temporada;
- meta automatica ou fixa;
- baseline historico;
- progresso da temporada;
- score de desempenho;
- risco operacional;
- ritmo esperado;
- queda recente;
- produtos mais vendidos;
- horarios fortes;
- regularidade semanal;
- clientes recorrentes;
- snapshot de metricas;
- recomendacao automatica/fallback;
- resultado final da temporada;
- sugestao de proxima temporada;
- maturidade atual;
- Pedra atual e proxima Pedra;
- progresso para evoluir;
- checklist automatico;
- bloqueadores de evolucao;
- eventos de upgrade de Pedra.

## 24. O que ja esta pronto

Ja esta implementado:

- estrutura de Temporadas por tenant;
- criacao de temporada;
- listagem de ativa, programadas e historico;
- promocao automatica de programada vencida;
- validacao de temporada ativa unica;
- validacao de conflito de datas;
- calculo deterministico de score;
- calculo de progresso;
- calculo de risco;
- leitura de pedidos por periodo;
- snapshots;
- finalizacao de temporada;
- recomendacoes por objetivo com fallback;
- Maturidade do Negocio;
- calculo de Pedras;
- snapshots de maturidade;
- eventos de subida de Pedra.

## 25. Pontos de atencao

Pontos que precisam de cuidado antes de evoluir:

- `season_events` aparece como colecao preparada na arquitetura, mas nao e o centro da implementacao atual.
- Financeiro, estoque, compras e marketing aparecem em arquitetura/contexto, mas nao devem ser tratados como totalmente incorporados ao score sem validar cada conexao.
- `lowSellingProducts` existe no shape de metrica, mas pode estar incompleto ou vazio dependendo da coleta.
- Upsell e promocoes precisam de eventos consistentes para virarem indicador forte de ticket ou recompra.
- Score e risco devem continuar auditaveis; IA nao deve substituir o calculo base.
- Temporadas nao devem recalcular historico de forma que altere decisoes antigas sem snapshot.
- Dados antigos de pedidos podem ter `channel/source/status/items` em formatos diferentes.
- A maturidade divide codigo com Temporadas; uma limpeza futura pode separar melhor as responsabilidades, mas isso exige cuidado para nao quebrar rotas existentes.

## 26. O que falta para evoluir

Proximas fases seguras:

1. Transformar `Missoes` em camada propria, ligada a Temporadas, mas com acoes menores e mais praticas.
2. Conectar promocoes, cupons, upsell e pontos com eventos confiaveis para medir impacto real.
3. Usar estoque/producao para sugerir missoes de custo, disponibilidade e perda.
4. Conectar financeiro com mais clareza para missoes de margem, caixa e despesa.
5. Criar recomendacoes mais humanas no fim da temporada, com linguagem de acao.
6. Separar visualmente Maturidade de Temporadas no codigo, mantendo compatibilidade.
7. Criar historico de decisoes/recomendacoes aceitas pela usuaria.
8. Criar uma leitura de "proxima melhor acao" sem exigir que a usuaria leia muitos indicadores.

## 27. Regra de produto recomendada

Temporada deve responder:

- qual foco escolhemos agora;
- qual era a base;
- qual e a meta;
- como esta indo;
- qual risco existe;
- o que fazer para melhorar;
- como terminou.

Maturidade deve responder:

- em que estagio o negocio esta;
- por que esta nesse estagio;
- o que ja evoluiu;
- o que ainda trava a evolucao;
- qual proximo passo faz sentido.

Missoes devem responder:

- qual acao pequena executar agora;
- por que ela importa;
- como saber se funcionou.

## 28. Regras para implantar sem quebrar o modulo atual

Ao evoluir Temporadas/Missoes, a implantacao deve ser incremental e preservar o modulo atual.

Regras obrigatorias:

- nao apagar os campos atuais de `seasons`, `season_metrics_snapshots`, `business_maturity` ou `stone_upgrade_events`;
- nao mudar o fluxo atual de criacao da temporada antes de criar uma camada nova compatível;
- nao mexer primeiro em `Maturidade do Negocio`; Temporadas/Missoes devem evoluir sem alterar a leitura de Pedras ate haver validacao;
- nao colocar financeiro, estoque, compras ou producao como peso forte de score nesta fase;
- nao dar ponto por cadastro de cupom, promocao ou upsell;
- nao deixar IA calcular score, meta, risco ou progresso;
- nao recalcular historico finalizado sem snapshot;
- nao alterar temporada finalizada como se fosse uma leitura viva;
- nao transformar dados preparados na arquitetura em regra oficial sem validar a conexao real;
- nao trocar o motor deterministico por leitura subjetiva.

O score atual deve continuar auditavel. Isso significa que a usuaria e a equipe precisam conseguir entender de onde veio cada leitura: pedidos, dias com venda, ticket, recorrencia, regularidade, baseline, meta e snapshots.

### O que pode entrar agora com baixo risco

Nesta fase, a evolucao mais segura e adicionar uma camada visual/funcional de Missoes sem interferir no score principal.

Pode entrar:

- cards de missoes sugeridas com base no objetivo da temporada;
- copy mais clara sobre o que fazer esta semana;
- leitura de proximas acoes sem alterar pontuacao;
- registro de missao criada/aceita como dado separado;
- recomendacoes usando dados ja calculados pela temporada;
- status simples de missao, como `sugerida`, `aceita`, `em_andamento`, `concluida`, `descartada`;
- explicacao de por que aquela missao foi sugerida.

Essas missoes podem usar financeiro, estoque, compras, producao, promocoes, cupons e upsell como contexto textual ou sinal de oportunidade, mas nao como peso de score ate cada origem estar validada.

### O que deve ficar para depois

Deve ficar para fases futuras:

- pontuar a loja por criar cupom/promocao/upsell;
- usar estoque como score de execucao;
- usar compras e producao como criterio de maturidade;
- usar financeiro como criterio forte de risco da temporada;
- alterar o peso oficial dos objetivos;
- recalcular temporadas antigas;
- automatizar upgrade de Pedra com novas fontes sem snapshot;
- conectar IA como decisora de score.

### Caminho seguro recomendado

1. Criar Missoes como camada separada, sem alterar `seasons`.
2. Usar os dados ja calculados pela temporada para sugerir a missao.
3. Salvar a missao em colecao propria, preservando tenant.
4. Mostrar a missao dentro da Temporada ativa.
5. Permitir concluir/descartar missao sem mudar score.
6. Depois de validar uso real, decidir se alguma missao deve influenciar leitura futura.

Esse caminho protege o modulo atual e permite evoluir a experiencia sem quebrar Maturidade, historico, score ou snapshots.

## 29. Normalizacao de pedidos para Temporadas

A partir da Etapa 2, o modulo `public/js/modules/temporadas.js` passa a ter uma camada interna de normalizacao de pedidos antes de usar os dados em baseline, score, maturidade e recomendacoes.

Objetivo:

- reduzir diferenca entre pedidos antigos e pedidos novos;
- evitar que `channel`, `source`, `status`, `items`, descontos e dados de cliente quebrem leituras futuras;
- preparar sinais de cupom, promocao, upsell e pontos sem transformar isso em score agora.

Funcao base:

- `_normalizeSeasonOrder(order)`

Shape normalizado:

- `id`
- `status`
- `createdAt`
- `total`
- `channel`
- `customerKey`
- `items`
- `couponCode`
- `couponDiscount`
- `promotionDiscount`
- `upsellAccepted`
- `upsellDiscount`
- `upsellAddedRevenue`
- `pointsRedemption`
- `pointsDiscount`
- `raw`

Normalizadores auxiliares:

- `_normalizeOrderStatus`
- `_normalizeOrderDate`
- `_getOrderTotal`
- `_normalizeChannel`
- `_getOrderCustomerKey`
- `_normalizeOrderItems`
- `_getCouponCode`
- `_hasAcceptedUpsell`
- `_getUpsellAddedRevenue`
- `_getNumber`

Campos preparados em `currentMetrics`:

- `channelBreakdown`
- `couponUsage`
- `couponDiscount`
- `promotionDiscount`
- `upsellAcceptedCount`
- `upsellDiscount`
- `upsellAddedRevenue`
- `pointsRedemption`
- `pointsDiscount`

Regra importante:

Esses sinais ficam disponiveis para leitura, recomendacao e futuras Missoes, mas nao entram como peso forte de score nesta etapa. O score continua baseado nas metricas oficiais do objetivo da temporada.

## 30. Sinais de impacto validado

A partir da Etapa 3, o modulo tambem calcula `validatedImpactSignals`.

Objetivo:

- responder quais acoes tiveram pedido real;
- separar cadastro/configuracao de resultado validado;
- preparar a futura camada de Missoes sem alterar o score oficial da temporada.

Funcao base:

- `_calculateValidatedImpactSignals(orders, season, baseline)`

Estrutura salva em `currentMetrics.validatedImpactSignals`:

- `coupons`
- `promotions`
- `upsell`
- `points`
- `channels`
- `products`

Regras de leitura:

- cupom criado nao pontua;
- cupom usado em pedido valido pode gerar sinal;
- promocao criada nao pontua;
- promocao com venda real pode gerar sinal;
- upsell configurado nao pontua;
- upsell aceito ou ligado a aumento de receita pode gerar sinal;
- pontos gerados nao pontuam;
- pontos usados em pedido, especialmente por cliente recorrente, podem gerar sinal;
- canal e produto sao medidos por venda real, nao por cadastro.

Campos calculados por tipo:

- cupons: `usedOrders`, `revenue`, `discountTotal`, `impactScore`;
- promocoes: `usedOrders`, `revenue`, `discountTotal`, `impactScore`;
- upsell: `acceptedOrders`, `addedRevenue`, `discountTotal`, `impactScore`;
- pontos: `redemptionOrders`, `repeatCustomers`, `discountTotal`, `impactScore`;
- canais: `topChannel`, `channels`;
- produtos: `topProduct`, `products`.

O `impactScore` e uma leitura auxiliar de 0 a 5. Ele nao altera `currentScore`, `progressPercent`, `riskLevel`, `Maturidade` ou `Pedras`.

Essa camada serve para frases, recomendacoes e futuras Missoes, por exemplo:

- "Cupom X gerou pedidos reais";
- "Upsell foi aceito e adicionou receita";
- "Este produto puxou a temporada";
- "Este canal concentrou mais vendas".

## 31. Abertura do score da temporada

A partir da Etapa 4, o score passa a ser salvo com explicacao em `scoreBreakdown`.

Estrutura:

- `coreObjectiveScore`
- `validatedImpactBonus`
- `riskPenalty`
- `finalScore`
- `calculationVersion`

Versao atual:

- `season_score_v1_1`

Formula:

`scoreFinal = scorePrincipalDoObjetivo + bonusDeImpactoValidado - penalidadesDeRisco`

Regras de seguranca:

- o objetivo principal continua mandando no score;
- o bonus de impacto validado e limitado;
- risco pode reduzir o score;
- IA continua sem calcular score;
- sinais de cupom, promocao, upsell, pontos, canal e produto so ajudam quando estao ligados a pedido real valido.

Limites atuais:

- `validatedImpactBonus` vai de 0 a 8;
- `riskPenalty` vai de 0 a 12;
- `finalScore` fica entre 0 e 100.

O breakdown tambem fica disponivel em `currentMetrics.scoreBreakdown` para leitura visual, snapshots e recomendacoes.

## 31.1. Leitura humana da temporada

A partir da Etapa 4, o modulo tambem gera `seasonReading`.

Estrutura:

- `headline`
- `helpingSignals`
- `blockingSignals`
- `nextAction`

Objetivo:

- transformar score, progresso, risco e sinais validados em linguagem clara;
- responder "como estou indo e o que faco hoje?";
- complementar `currentScore`, `riskLevel`, `progressPercent`, `currentMetrics` e `lastAIRecommendationSummary`;
- nao substituir o motor deterministico.

Exemplo:

```js
seasonReading: {
  headline: "A temporada está abaixo do ritmo esperado",
  helpingSignals: [
    "O produto X está puxando o faturamento",
    "O horário da noite tem melhor resposta"
  ],
  blockingSignals: [
    "Terça e quarta seguem fracas",
    "O ticket médio caiu nos pedidos com desconto"
  ],
  nextAction: "Reforce o produto X no horário da noite e evite desconto alto nos pedidos pequenos."
}
```

## 31.2. Contexto da IA em Temporadas

O arquivo `public/js/services/seasons.ai.js` recebe o novo contexto:

- `season`
- `currentMetrics`
- `scoreBreakdown`
- `validatedImpactSignals`
- `riskContext`
- `snapshots`

A IA/fallback deve devolver:

- `headline`
- `helpingSignals`
- `blockingSignals`
- `nextAction`

Regras preservadas:

- IA nao calcula score;
- IA nao calcula meta;
- IA nao calcula risco;
- IA nao calcula progresso;
- IA apenas explica e recomenda com base nos dados ja calculados pelo BocaFood.

## 32. Pontuacao por objetivo

Cada objetivo tem um score principal e uma leitura de bonus validado. O score principal continua vindo das metricas oficiais do objetivo. O bonus so entra quando existe pedido real valido.

### Vender mais

Score principal:

- faturamento: 45%;
- pedidos: 35%;
- dias com venda: 20%.

Bonus validado permitido:

- cupom usado em pedido valido;
- promocao que gerou venda real;
- canal que concentrou ou cresceu em venda real;
- produto forte reforcado por venda real;
- horario forte aproveitado.

Nao pontua:

- cupom criado;
- promocao cadastrada;
- campanha sem pedido real.

### Aumentar ticket

Score principal:

- ticket medio;
- valor medio por pedido;
- itens por pedido.

Bonus validado permitido:

- upsell aceito;
- combo vendido;
- adicional comprado;
- mais itens por pedido;
- ticket subindo sem depender so de desconto.

Nao pontua:

- regra de upsell criada;
- sugestao exibida mas nao aceita;
- desconto que aumenta volume mas derruba ticket liquido.

### Fidelizar clientes

Score principal:

- clientes recorrentes;
- taxa de recompra;
- frequencia media.

Bonus validado permitido:

- pontos usados em recompra;
- cupom de retorno usado;
- cliente que comprou novamente;
- aumento de frequencia.

Nao pontua:

- pontos gerados sem recompra;
- cliente cadastrado sem voltar;
- cupom de retorno criado e nao usado.

### Melhorar consistencia

Score principal:

- dias com venda;
- regularidade semanal;
- menor oscilacao.

Bonus validado permitido:

- dias fracos melhoraram;
- venda ficou mais distribuida;
- produto forte ficou disponivel;
- queda recente diminuiu.

Estoque, producao e compras entram primeiro como alerta/contexto. Eles ainda nao sao score principal da Temporada V1. Sao mais adequados para fases futuras de Missoes ligadas a custo, disponibilidade, estoque minimo, perdas, compras e producao.
