# Mapa de Dados para Sistema de Pedras / Maturidade do Negócio

Relatório técnico para avaliar quais dados reais do BocaFood podem alimentar um futuro **Sistema de Pedras**, baseado em maturidade acumulada do negócio, crescimento saudável e risco controlado.

Escopo analisado por leitura estática local: documentos de Temporadas, módulos atuais do Admin, Plano de Voo, Performance, Financeiro, Pedidos, Clientes, Compras, Cardápio/Produtos, Marketing/Pontos/Avaliações e camada `DB/Auth`. Nenhum código foi alterado.

## 1. Objetivo do relatório

O Sistema de Pedras deve ser uma camada permanente de maturidade do negócio. Ele deve reconhecer evolução acumulada da loja ao longo do tempo, sem premiar apenas faturamento bruto.

Diferença conceitual:

- **Temporadas** = ciclos curtos de foco operacional, com duração de 30 ou 90 dias, objetivo específico, score, ritmo, chance de falha, snapshots e resultado final.
- **Pedras** = progressão acumulada de maturidade do negócio, considerando histórico de execução, consistência, saúde financeira, risco, fidelização e crescimento sustentável.

Níveis oficiais sugeridos:

- Pedra Bruta
- Quartzo
- Ametista
- Safira
- Esmeralda
- Rubi
- Diamante
- Ônix

O princípio central é: uma loja deve evoluir de nível quando demonstra negócio mais saudável, previsível e controlado, não apenas quando vende mais. A Pedra Bruta representa o começo da organização e a fase de sobrevivência; não deve ser tratada como fracasso.

## 2. Módulos analisados

### Temporadas

- **Arquivos principais:** `js/modules/temporadas.js`, `js/services/seasons.ai.js`, `css/modules/temporadas.css`, `SEASONS_SPEC.md`, `SEASON_SCORING_SYSTEM.md`, `SEASONS_ARCHITECTURE.md`, `SEASONS_UI_FLOW.md`, `IMPLEMENTATION_PLAN_SEASONS_V1.md`.
- **Coleções Firestore usadas:** `seasons`, `season_metrics_snapshots`, `orders`.
- **Campos importantes:** `objective`, `build`, `difficulty`, `durationType`, `targetMode`, `targetValue`, `targetMetric`, `baselineValue`, `baselineOrders`, `baselineRevenue`, `baselineAverageTicket`, `baselineActiveDays`, `calculatedTargetValue`, `status`, `currentScore`, `currentStatus`, `riskLevel`, `progressPercent`, `goalReachedAt`, `goalCelebrationShownAt`, `goalCelebrationPending`, `finalResult`, `finalSummary`, `finalScore`, `finalProgressPercent`, `startedAt`, `finishedAt`, `abandonedAt`, `aiRecommendation`, `aiRecommendationGeneratedAt`, `lastAIRecommendationSummary`.
- **Dados úteis para maturidade:** temporadas concluídas, programadas, abandonadas, score médio, risco médio, dificuldade escolhida, meta atingida, progresso final, resultado final, estabilidade, ritmo, snapshots diário/semanal/final, recomendação de IA.
- **Confiabilidade:** alta para existência/estado da temporada e score salvo; média para IA/recomendação e métricas derivadas; depende de `orders` para cálculo.

### Plano de Voo

- **Arquivos principais:** `js/modules/plano_voo.js`, `js/modules/performance.js`, `js/modules/dashboard.js`.
- **Coleções Firestore usadas:** `flight_plans`, `flight_plan_month_scenarios`, `orders`, `products`, `movimentacoes`, `financeiro_saidas`, `financeiro_apagar`, `financeiro_categorias`, `contas_pagar`, `config/dinheiro`.
- **Campos importantes:** `scenario`, `growthSource`, `growthPct`, `periodType`, `periodStart`, `periodEnd`, `targetMonthKey`, `targetMonthLabel`, `summary.revenue`, `summary.costs`, `summary.variableTotal`, `summary.fixedTotal`, `summary.profit`, `summary.cashStart`, `summary.cashFinal`, `summary.breakEvenRevenue`, `summary.targetProfit`, `snapshotId`, `snapshotName`, `monthKey`.
- **Dados úteis para maturidade:** cenário escolhido, meta mensal, previsto vs realizado, receita projetada, lucro projetado, caixa final projetado, margem estimada, aderência ao plano.
- **Confiabilidade:** média/alta para cenário salvo e comparação mensal; média para lucro/caixa por depender de fontes financeiras e custos estimados.

### Performance

- **Arquivos principais:** `js/modules/performance.js`, `js/modules/dashboard.js`.
- **Coleções Firestore usadas:** `orders`, `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `financeiro_categorias`, `flight_plans`, `flight_plan_month_scenarios`, `config/dinheiro`.
- **Campos importantes:** `orders.total`, `orders.createdAt/date/data`, `orders.channel/source/type`, fluxo financeiro normalizado, `summary.revenue`, `summary.profit`, `summary.cashFinal`, cenário mensal.
- **Dados úteis para maturidade:** ritmo vs meta, vendas realizadas, entradas/saídas, margem estimada, melhor dia, canal, evolução contra período anterior.
- **Confiabilidade:** média; possui normalização e dedupe, mas herda duplicidade de coleções financeiras.

### Financeiro

- **Arquivos principais:** `js/modules/financeiro.js`, `financeiro.html`.
- **Coleções Firestore usadas:** `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `contas_pagar`, `contas_bancarias`, `financeiro_categorias`, `store_customers`, `fornecedores`, `compras`, `config/financeiro`, `config/geral`, `config/custos`.
- **Campos importantes:** `tipo`, `descricao`, `valor`, `valorRecebido`, `valorPago`, `saldoRestante`, `data`, `vencimento`, `data_pagamento`, `status`, `categoria`, `conta_id`, `forma_pagamento`, `formaPagamento`, `pessoaId`, `pessoaNome`, `fornecedorId`, `fornecedorNome`, `recorrencia`, `parcelamento`.
- **Dados úteis para maturidade:** entradas, saídas, contas vencidas, contas futuras, saldo/caixa, categorias, contas bancárias, recorrência de despesas, custos indiretos.
- **Confiabilidade:** média; é rico, mas há fontes duplicadas/legadas e valores/status heterogêneos.

### Pedidos

- **Arquivos principais:** `js/modules/pedidos.js`, `track.html`, `index.html`, `template-mobile-premium-fiel.html`.
- **Coleções Firestore usadas:** `orders`, `store_customers`, `reviews`, `products`, `promotions`, `movimentacoes`, `orderSlots`, `config/geral`, `config/financeiro`, `config/zonas`, `config/canais_venda`.
- **Campos importantes:** `customerId`, `customerName`, `customerPhone`, `customerEmail`, `items`, `subtotal`, `subtotalOriginal`, `subtotalFinal`, `promoDiscountTotal`, `discountTotal`, `shippingFee`, `deliveryFee`, `total`, `paymentMethod`, `paymentStatus`, `paidAmount`, `status`, `type`, `channel`, `source`, `deliveryDate`, `deliveryTime`, `slot`, `slotKey`, `scheduleDate`, `scheduleTime`, `address`, `zone`, `createdAt`, `updatedAt`.
- **Dados úteis para maturidade:** faturamento, volume, ticket médio, dias com venda, horários fortes, produtos vendidos, canais, tipos de pedido, cancelamentos, recorrência por cliente.
- **Confiabilidade:** alta para pedidos/total/status; média para canal, pagamento, custo/margem e origem detalhada.

### Clientes

- **Arquivos principais:** `js/modules/clientes.js`, `js/modules/pedidos.js`.
- **Coleções Firestore usadas:** `store_customers`, `orders`, `reviews`, `points_movements`, `config/canais_venda`, `config/pontos_program`.
- **Campos importantes:** `name`, `phone`, `whatsapp`, `email`, `address`, `origin`, `mainChannel`, `status`, `acceptsMarketing`, `totalOrders`, `totalSpent`, `points`, `pointsBalance`, `createdAt`, `lastOrderAt`.
- **Dados úteis para maturidade:** clientes recorrentes, recompra, frequência, ticket por cliente, base ativa, aceitação de marketing, pontos acumulados.
- **Confiabilidade:** média; pedidos por `customerId`/telefone podem ser mais confiáveis que agregados salvos em cliente.

### Compras

- **Arquivos principais:** `js/modules/compras.js`.
- **Coleções Firestore usadas:** `compras`, `fornecedores`, `itens_custo`, `compras_tipos`, `compras_categorias`, `unidades_medida`, `financeiro_apagar`, `contas_pagar`, `movimentacoes`, `contas_bancarias`, `financeiro_categorias`, `config/compras`, `config/financeiro`.
- **Campos importantes:** `data`, `fornecedorId`, `statusCompra`, `numDocumento`, `observacoes`, `total`, `valorSemIva`, `ivaValor`, `ivaPct`, `itens`, `dedutivelIva`, `dedutivelIrpf`, `categoriaFiscal`, `costClass`, `gerarContaPagar`, `formaPagamento`, `dueDate`, `parcelas`, `categoriaFinanceiraId`, `contaPagarId`, `contaPagarIds`.
- **Dados úteis para maturidade:** compras por fornecedor, evolução de custos, concentração de fornecedores, pressão de contas a pagar, insumos ativos, custo atualizado.
- **Confiabilidade:** média; bom para compras e custo atualizado, baixo para estoque real.

### Cardápio / Produtos

- **Arquivos principais:** `js/modules/catalogo.js`, `js/modules/loja_online.js`, `js/modules/receitas.js`.
- **Coleções Firestore usadas:** `products`, `categories`, `produtos_prontos`, `variantGroups`, `tags`, `fichasTecnicas`, `itens_custo`, `coupons`, `promotions`, `orders`, `config/template`, `config/geral`, `config/aparencia`, `config/endereco`, `config/pagamentos`, `config/horarios`, `config/zonas`, `config/seo`.
- **Campos importantes:** `name`, `price`, `cost`, `custo`, `categoryId`, `menuVisible`, `type`, `fichaId`, `produtoProntoId`, `menuItems`, `menuChoiceGroups`, `variantGroupIds`, `featured`, `popular`, `tags`, `seoTitle`, `seoDescription`, `slug`, `imageUrl`, campos de ficha como `ingredientCost`, `packagingCost`, `directCost`, `indirectCost`, `totalCost`, `costPerYield`.
- **Dados úteis para maturidade:** mix de produtos, produtos com custo, produtos sem custo, margem estimada, variedade do cardápio, produtos visíveis, produtos mais vendidos.
- **Confiabilidade:** média; produtos e preços são bons, margem real por venda ainda exige snapshot no pedido.

### Programa de Pontos

- **Arquivos principais:** `js/modules/marketing.js`, `js/modules/clientes.js`, `js/modules/pedidos.js`.
- **Coleções Firestore usadas:** `points_movements`, `store_customers`, `orders`, `config/pontos_program`.
- **Campos importantes:** config `active`, `programName`, `earnPerEuro`, `redeemRate`, `minimumPointsToUse`, `maxDiscountPct`, `pointsExpire`, `pointsExpirationDays`, `autoApply`; movimento `type`, `pointsEarned`, `pointsUsed`, `discountValue`, `balanceBefore`, `balanceAfter`, `orderId`, `customerId`, `createdAt`.
- **Dados úteis para maturidade:** engajamento, uso de pontos, clientes com saldo, recorrência incentivada, desconto por fidelidade.
- **Confiabilidade:** alta quando há movimento salvo; média para inferir fidelização sem cruzar com recompra.

### Avaliações

- **Arquivos principais:** `js/modules/marketing.js`, `js/modules/pedidos.js`, `review.html`, `public/review.html`.
- **Coleções Firestore usadas:** `reviews`, `orders`, `products`, `store_customers`.
- **Campos importantes:** `name`, `comment`, `stars`, `rating`, `productId`, `productName`, `status`, `approved`, `rejected`, `source`, `reply`, `createdAt`.
- **Dados úteis para maturidade:** reputação, satisfação, volume de avaliações, nota média, produtos avaliados, respostas da loja.
- **Confiabilidade:** alta para avaliações registradas; média para representar satisfação geral, pois depende de adesão do cliente.

### IA / Próxima Jogada

- **Arquivos principais:** `js/services/seasons.ai.js`, `js/modules/temporadas.js`.
- **Coleções Firestore usadas:** `seasons`, `season_metrics_snapshots`.
- **Campos importantes:** `aiRecommendation`, `aiRecommendationGeneratedAt`, `lastAIRecommendationSummary`, `aiRecommendationError`, `recommendation` dentro de snapshot.
- **Dados úteis para maturidade:** recomendação gerada, métrica a observar, risco se ignorada, ações sugeridas.
- **Confiabilidade:** baixa/média para maturidade V1; há dado de recomendação, mas não há evidência confiável de execução/aplicação real da recomendação.

## 3. Dados disponíveis para medir maturidade

### Crescimento

- **Faturamento por período:** sim, via `orders.total`, com exclusão de cancelados.
- **Evolução de pedidos:** sim, via `orders` por período.
- **Ticket médio:** sim, `sum(total) / count(orders)`.
- **Comparação mês atual vs histórico:** sim/parcial; Dashboard, Performance e Plano de Voo já comparam períodos e cenário mensal.
- **Metas do Plano de Voo:** sim, via `flight_plans` e `flight_plan_month_scenarios`.
- **Escolha de cenário/meta:** sim, `scenario` em Plano de Voo. Existem quatro cenários (`survival`, `equilibrium`, `growth`, `expansion`), que podem ser mapeados para conservador/equilibrado/agressivo.
- **Meta atingida ou não:** sim/parcial; Performance calcula `progressPct` contra `targetRevenue`; Plano de Voo calcula `achievementPct`.

### Consistência

- **Dias com venda:** sim, calculável via `orders` e já usado em Temporadas.
- **Regularidade semanal:** sim, `temporadas.js` calcula `weeklyRegularity`.
- **Variação entre semanas:** sim/parcial, calculável; Performance compara períodos.
- **Temporadas concluídas:** sim, `seasons.status === 'finished'`.
- **Temporadas abandonadas:** sim, `seasons.status === 'abandoned'`.
- **Score médio das temporadas:** sim, via `currentScore`, `finalScore` ou snapshots finais.
- **Ritmo atual das temporadas:** sim, via `progressPercent`, `currentStatus`, `riskLevel`, snapshots.

### Saúde financeira

- **Lucro estimado:** parcial; Plano de Voo e Performance calculam `profit`, mas dependem de custos estimados/dedupe financeiro.
- **Margem estimada:** parcial; Performance calcula margem contra saídas e `dinheiro.js` calcula margem por produto.
- **Contas a pagar:** sim, `contas_pagar` e `financeiro_apagar`.
- **Contas vencidas:** sim, por `vencimento/dueDate` e `status`.
- **Entradas e saídas:** sim/parcial, via `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`.
- **Saldo/caixa:** parcial; há `contas_bancarias` e `summary.cashFinal`, mas caixa consolidado depende de uso correto das contas.
- **Despesas fixas/variáveis:** parcial; Plano de Voo separa custos variáveis/fixos projetados, financeiro categoriza despesas.
- **Compras por fornecedor:** sim, via `compras.fornecedorId/fornecedorNome`.
- **Custos de produto/insumo:** parcial; `products.cost/custo`, `fichasTecnicas`, `itens_custo`, mas sem snapshot obrigatório por venda.

### Risco controlado

- **Chance de falha da temporada:** sim, via `seasons.riskLevel` e alertas de snapshot.
- **Metas agressivas concluídas:** sim, cruzando `difficulty === 'aggressive'` com `status/finalResult/progressPercent`.
- **Metas muito acima do histórico:** sim/parcial; Temporadas têm `targetMode`, `baselineValue`, `calculatedTargetValue`, `initialRiskLevel`.
- **Temporadas instáveis/críticas:** sim, via `finalResult === 'Temporada Instável'`, `riskLevel`, `currentStatus`.
- **Dependência de poucos dias/produtos:** parcial; Temporadas calculam dias/produtos fortes, mas não há índice persistido específico de concentração.
- **Crescimento com margem ruim:** parcial; possível cruzar crescimento de pedidos/receita com margem estimada, mas falta snapshot de custo real no pedido.

### Fidelização

- **Clientes recorrentes:** sim, por `customerId` ou telefone em `orders`.
- **Recompra:** sim, por sequência de pedidos por cliente/telefone.
- **Frequência média:** sim/parcial, calculável por datas de pedidos.
- **Programa de pontos:** sim, via `points_movements` e `config/pontos_program`.
- **Avaliações:** sim, via `reviews`.
- **Satisfação/reputação:** sim/parcial, via nota média e aprovação, mas depende do volume de avaliações.

### Execução

- **Criação e conclusão de temporadas:** sim, via `seasons.createdAt`, `status`, `finishedAt`.
- **Vitórias totais:** sim, via `finalResult === 'Vitória Total'`.
- **Vitórias parciais:** sim, via `finalResult === 'Vitória Parcial'`.
- **Falhas operacionais:** sim, via `finalResult === 'Falha Operacional'`.
- **Uso de Próxima Jogada/IA:** parcial; recomendação é salva, mas não há evento confiável de aplicação.
- **Uso recorrente do sistema:** baixo/parcial; uso pode ser inferido indiretamente por pedidos, compras, financeiro e temporadas, mas não há coleção canônica de eventos de uso do Admin.

## 4. Relação com Plano de Voo

O Plano de Voo possui dados muito úteis para o Sistema de Pedras porque transforma metas em cenários, projeções e comparação com realizado.

### Tipos de meta existentes hoje

O módulo trabalha com previsões/snapshots e cenário mensal, não apenas uma meta simples. O modelo inclui:

- Receita prevista.
- Custos variáveis.
- Despesas fixas.
- Lucro previsto.
- Caixa inicial/final.
- Break-even.
- Lucro alvo (`targetProfit`).
- Comparação previsto vs real.

### Existem 3 cenários/metas?

Existem quatro cenários no código:

- `survival` = Sobrevivência, fator base `0.90`.
- `equilibrium` = Equilíbrio, fator base `1.00`.
- `growth` = Crescimento, fator base `1.15`.
- `expansion` = Expansão, fator base `1.30`.

Para Pedras, a leitura correta dos cenários deve respeitar o estágio real do negócio:

- `survival`: Meta de Sobrevivência. Peso menor, mas sem punir crescimento lento; deve reconhecer caixa mínimo, redução de risco, organização inicial e consistência básica.
- `equilibrium`: Equilíbrio. Peso médio; deve reconhecer estabilidade, previsibilidade, organização e margem mais saudável.
- `growth`: Crescimento. Peso alto; só deve acelerar evolução quando houver saúde, consistência e risco controlado.
- `expansion`: Expansão. Peso muito alto; só deve destravar evolução forte quando a loja demonstrar maturidade operacional, crescimento saudável e controle financeiro.

### Onde esses dados ficam salvos?

- Previsões completas: `flight_plans`.
- Cenário mensal escolhido: `flight_plan_month_scenarios/{monthKey}`.
- Campo de vínculo: `snapshotId`.
- Campos de meta: `summary.revenue`, `summary.profit`, `summary.cashFinal`, `scenario`, `monthKey`, `targetMonthKey`.

### Campos que indicam meta escolhida pela usuária

- `flight_plan_month_scenarios.monthKey`
- `flight_plan_month_scenarios.snapshotId`
- `flight_plan_month_scenarios.snapshotName`
- `flight_plan_month_scenarios.scenario`
- `flight_plan_month_scenarios.summary`
- Em `flight_plans`: `scenario`, `targetMonthKey`, `targetMonthLabel`, `summary`.

### Existe histórico de metas mensais?

Sim. `flight_plans` guarda previsões salvas e `flight_plan_month_scenarios` aponta o cenário escolhido por mês. Isso permite histórico mensal, desde que a usuária salve/defina cenários de forma recorrente.

### Existe comparação de previsto vs realizado?

Sim. `plano_voo.js` e `performance.js` calculam previsto vs real usando pedidos e financeiro. Campos calculados incluem `achievementPct`, `forecast`, `actual`, `deltaLabel`, receita real, custos reais e lucro real estimado.

### Isso já pode alimentar Pedras?

Sim, com confiança média/alta para aderência ao plano e execução de meta. Deve ser usado com cuidado para não premiar projeções irreais nem crescimento com prejuízo.

Regras sugeridas:

- Meta de sobrevivência atingida = menor peso, mas avanço válido para Pedra Bruta/Quartzo quando reduz risco e cria estrutura.
- Meta equilibrada atingida = peso médio.
- Meta agressiva atingida = peso alto, se margem/caixa não piorarem.
- Meta agressiva falhada com risco alto = não deve premiar igual.
- Crescimento com prejuízo ou margem ruim não deve contar como evolução saudável.
- Cenário salvo mas sem execução real não deve gerar progresso de Pedra.

## 5. Relação com Temporadas

Temporadas já são a fonte mais direta para medir execução e evolução saudável.

### Campos existentes/previstos em `seasons`

O código atual normaliza e usa:

- `objective`
- `build`
- `difficulty`
- `durationType`
- `durationDays`
- `targetMode`
- `targetValue`
- `targetMetric`
- `baselineValue`
- `baselineOrders`
- `baselineRevenue`
- `baselineAverageTicket`
- `baselineActiveDays`
- `calculatedTargetValue`
- `initialRiskLevel`
- `status`
- `currentScore`
- `currentStatus`
- `riskLevel`
- `progressPercent`
- `goalReachedAt`
- `goalCelebrationShownAt`
- `goalCelebrationPending`
- `goalReachedSnapshotId`
- `finalResult`
- `finalSummary`
- `finalScore`
- `finalProgressPercent`
- `createdAt`
- `updatedAt`
- `startedAt`
- `finishedAt`
- `abandonedAt`
- `aiRecommendation`
- `aiRecommendationGeneratedAt`
- `lastAIRecommendationSummary`

### Campos existentes em `season_metrics_snapshots`

O módulo cria snapshots com:

- `seasonId`
- `snapshotType` (`daily`, `weekly`, `final`)
- `date`
- `periodStart`
- `periodEnd`
- `objective`
- `build`
- `difficulty`
- `score`
- `progressPercent`
- `status`
- `riskLevel`
- `metrics`
- `mainMetrics`
- `auxiliaryMetrics`
- `alerts`
- `insights`
- `summary`
- `confidence`
- `createdAt`
- campos de IA/recomendação quando gerados.

### Resultado final e score

Sim, há finalização com:

- `status: 'finished'`
- `finalResult`
- `finalSummary`
- `finalScore`
- `finalProgressPercent`
- `finishedAt`
- snapshot final em `season_metrics_snapshots`.

### `goalReachedAt`

Sim. Existe `goalReachedAt`, além de campos de celebração: `goalCelebrationPending`, `goalCelebrationShownAt`, `goalReachedSnapshotId`.

### Status

O módulo trabalha com:

- `scheduled`
- `active`
- `finished`
- `abandoned`
- também há referência documental a `draft`.

### IA / Próxima Jogada

Existe serviço `SeasonsAI` com fallback determinístico e persistência em `seasons`/snapshot. É útil para contexto, mas ainda não deve ser indicador forte de maturidade porque não mede se a ação foi executada.

### Snapshots diário/semanal/final

Sim. O código suporta `daily`, `weekly` e `final`, com criação e atualização.

### Dados de temporadas que podem alimentar Pedras

- Quantidade de temporadas concluídas.
- Quantidade de temporadas programadas e efetivamente iniciadas.
- Vitórias totais.
- Vitórias parciais.
- Falhas operacionais.
- Temporadas instáveis.
- Temporadas abandonadas.
- Score médio das últimas N temporadas.
- Risco médio das últimas N temporadas.
- Progresso médio.
- Metas agressivas concluídas.
- Estabilidade via `activeDays`, `weeklyRegularity`, `riskLevel`.
- Sequência de temporadas concluídas sem abandono.

## 6. Métricas possíveis hoje

| Área | Métrica | Fonte | Campos necessários | Calculável hoje? | Confiabilidade | Observação |
|---|---|---|---|---|---|---|
| crescimento | Faturamento por período | `orders` | `total`, `createdAt/date/data`, `status` | Sim | Alta | Excluir cancelados. |
| crescimento | Número de pedidos | `orders` | data, `status` | Sim | Alta | Base mais confiável do sistema. |
| crescimento | Ticket médio | `orders` | `total`, data, `status` | Sim | Alta | Usar total canônico. |
| crescimento | Meta mensal atingida | `flight_plan_month_scenarios`, `orders` | `summary.revenue`, `monthKey`, pedidos reais | Sim | Média/Alta | Depende de cenário mensal salvo. |
| crescimento | Crescimento vs histórico | `orders`, `season_metrics_snapshots` | períodos comparáveis, `total`, `ordersCount` | Sim | Alta | Melhor quando há baseline salvo. |
| consistência | Dias com venda | `orders` | data do pedido, `status` | Sim | Alta | Já usado em Temporadas. |
| consistência | Regularidade semanal | `orders`, `seasons` | datas, vendas por semana | Sim | Média/Alta | Código de Temporadas já calcula. |
| consistência | Variação entre semanas | `orders`, `performance` | períodos, totais por semana | Sim | Média | Precisa normalização de datas. |
| consistência | Score médio de temporadas | `seasons` | `currentScore/finalScore`, `status` | Sim | Alta | Preferir temporadas finalizadas. |
| consistência | Abandono de temporadas | `seasons` | `status`, `abandonedAt` | Sim | Alta | Indicador forte de execução. |
| saúde financeira | Entradas efetivas | `movimentacoes`, `financeiro_entradas` | `valor`, `status`, `data` | Parcial | Média | Risco de duplicidade. |
| saúde financeira | Saídas efetivas | `financeiro_saidas`, `financeiro_apagar`, `contas_pagar` | `valor`, `status`, datas | Parcial | Média | Exige dedupe. |
| saúde financeira | Contas vencidas | `contas_pagar`, `financeiro_apagar` | `vencimento/dueDate`, `status`, `valor` | Sim | Média | Campos/status variam. |
| saúde financeira | Caixa final projetado | `flight_plans`, `flight_plan_month_scenarios` | `summary.cashFinal` | Sim | Média | É projeção, não caixa real auditado. |
| saúde financeira | Lucro estimado | `performance`, `flight_plans`, financeiro | receita, custos, saídas | Parcial | Média | Não usar como único critério. |
| saúde financeira | Margem por produto | `products`, `fichasTecnicas`, `itens_custo` | preço, custo/ficha | Parcial | Média | Falta snapshot por venda. |
| risco | Chance de falha da temporada | `seasons`, snapshots | `riskLevel`, `alerts` | Sim | Alta | Indicador direto. |
| risco | Meta agressiva concluída | `seasons` | `difficulty`, `finalResult`, `progressPercent` | Sim | Alta | Dar peso só se saúde financeira estiver ok. |
| risco | Dependência de poucos dias | `orders`, snapshots | vendas por dia, concentração | Parcial | Média | Calculável, mas não está consolidado como campo próprio. |
| risco | Crescimento com margem ruim | `orders`, financeiro, produtos | receita, saídas, custos | Parcial | Média/Baixa | Precisa padronizar margem. |
| fidelização | Clientes recorrentes | `orders`, `store_customers` | `customerId`, telefone, datas | Sim | Alta/Média | Telefone normalizado como fallback. |
| fidelização | Recompra | `orders` | cliente, datas | Sim | Alta/Média | Usar mínimo 2 pedidos por cliente. |
| fidelização | Frequência média | `orders` | cliente, datas | Parcial | Média | Requer janela definida. |
| fidelização | Pontos gerados/usados | `points_movements` | `type`, `pointsEarned`, `pointsUsed`, `customerId` | Sim | Alta | Bom indicador auxiliar. |
| fidelização | Nota média de avaliação | `reviews` | `stars/rating`, `status/approved`, `createdAt` | Sim | Alta | Exige volume mínimo. |
| execução | Temporadas concluídas | `seasons` | `status`, `finishedAt` | Sim | Alta | Indicador central. |
| execução | Vitórias totais/parciais | `seasons` | `finalResult` | Sim | Alta | Bom para progressão. |
| execução | Falha operacional | `seasons` | `finalResult`, `riskLevel` | Sim | Alta | Deve reduzir progresso. |
| execução | Uso de IA/Próxima Jogada | `seasons`, snapshots | `aiRecommendation*` | Parcial | Baixa/Média | Não mede execução da recomendação. |
| maturidade | Índice composto de maturidade | múltiplas fontes | crescimento, consistência, financeiro, risco, fidelização, execução | Parcial | Média | Recomendado criar snapshot próprio. |
| maturidade | Sequência de evolução saudável | `seasons`, `orders`, financeiro | resultados, margem, caixa, risco | Parcial | Média | Depende de normalizadores. |

## 7. Métricas que ainda faltam

- Lucro real por venda.
- Margem real com snapshot no pedido.
- Custo real por item no momento da venda.
- Caixa confiável consolidado por conta e período.
- Controle real de estoque.
- Baixa automática de insumos por venda/produção.
- Desperdício real por data, insumo, produto e motivo.
- Horas trabalhadas/capacidade produtiva.
- Sobrecarga operacional.
- Tempo real de preparo/entrega por pedido.
- Motivo de cancelamento padronizado.
- Origem detalhada de pedidos/campanhas.
- Eventos confiáveis de visualização/clique/aceite de promoções, cupons e upsell.
- Aplicação real das recomendações de IA.
- Histórico de uso do Admin por módulo.
- Snapshot próprio de maturidade por mês/trimestre.

## 8. Riscos de usar faturamento bruto

Faturamento bruto sozinho é perigoso para um sistema de maturidade porque pode premiar crescimento ruim.

Riscos:

- Faturamento alto com prejuízo.
- Crescimento sustentado por desconto agressivo.
- Ticket maior com margem menor.
- Aumento de pedidos com operação instável.
- Dono trabalhando demais sem capacidade real.
- Falta de caixa mesmo com vendas.
- Contas vencidas crescendo junto com receita.
- Dependência de poucos produtos.
- Dependência de poucos dias fortes.
- Baixa recompra.
- Avaliações ruins ou queda de reputação.
- Meta agressiva atingida com risco alto e sem consistência.

Portanto, receita deve ser uma dimensão, não o critério central. O Sistema de Pedras deve premiar crescimento que vem acompanhado de margem, caixa, consistência, execução e fidelização.

## 9. Proposta inicial de indicadores para Pedras

### Índice de crescimento saudável

- **Dados usados:** `orders.total`, quantidade de pedidos, ticket médio, comparação com histórico, `flight_plan_month_scenarios.summary.revenue`, cenário escolhido.
- **Confiabilidade:** alta para pedidos/receita; média para aderência ao Plano de Voo.
- **V1 ou futuro:** recomendado para V1.
- **Observação:** não pontuar crescimento se margem/caixa estiverem em zona crítica.

### Índice de consistência

- **Dados usados:** dias com venda, regularidade semanal, variação entre semanas, `seasons.currentScore`, `seasons.progressPercent`, snapshots.
- **Confiabilidade:** alta/média.
- **V1 ou futuro:** recomendado para V1.
- **Observação:** útil para evitar que uma semana forte gere avanço exagerado.

### Índice financeiro

- **Dados usados:** entradas, saídas, contas vencidas, contas a pagar, margem/lucro estimados, `summary.profit`, `summary.cashFinal`.
- **Confiabilidade:** média.
- **V1 ou futuro:** recomendado para V1 com peso moderado e normalizador financeiro; ampliar no futuro.
- **Observação:** evitar usar lucro estimado como verdade absoluta.

### Índice de risco controlado

- **Dados usados:** `seasons.riskLevel`, alertas de snapshots, metas agressivas vs resultado, crescimento com margem ruim, concentração de dias/produtos.
- **Confiabilidade:** alta para risco de temporada; média para concentração/margem.
- **V1 ou futuro:** recomendado para V1.
- **Observação:** deve funcionar como limitador de avanço, não apenas como pontuação positiva.

### Índice de fidelização

- **Dados usados:** clientes recorrentes, recompra, frequência média, `points_movements`, avaliações.
- **Confiabilidade:** média/alta.
- **V1 ou futuro:** recomendado para V1.
- **Observação:** exigir volume mínimo de pedidos/avaliações para evitar distorção.

### Índice de execução

- **Dados usados:** temporadas criadas, concluídas, abandonadas, `finalResult`, `finalScore`, `goalReachedAt`, sequência de conclusão.
- **Confiabilidade:** alta.
- **V1 ou futuro:** recomendado para V1.
- **Observação:** deve ser o núcleo do sistema de Pedras, porque mede disciplina operacional.

### Índice de aprendizado / IA

- **Dados usados:** `aiRecommendation`, `lastAIRecommendationSummary`, snapshots com recomendação.
- **Confiabilidade:** baixa/média.
- **V1 ou futuro:** futuro.
- **Observação:** só virar V1 quando existir evento de ação aplicada/concluída.

## 10. Recomendação técnica

### O sistema já tem dados suficientes para uma V1?

Sim. O BocaFood já possui dados suficientes para uma V1 do Sistema de Pedras, desde que a V1 seja conservadora e use indicadores com boa confiabilidade:

- Pedidos.
- Faturamento.
- Ticket médio.
- Dias com venda.
- Clientes recorrentes/recompra.
- Avaliações.
- Pontos.
- Temporadas concluídas/abandonadas.
- Score e risco de temporadas.
- Cenário mensal do Plano de Voo.
- Contas vencidas/saídas/entradas como sinal financeiro auxiliar.

### Indicadores seguros para V1

- Crescimento saudável baseado em pedidos e receita, com limite financeiro.
- Consistência baseada em dias com venda e regularidade semanal.
- Execução baseada em temporadas finalizadas e `finalResult`.
- Risco controlado baseado em `riskLevel` e alertas.
- Fidelização baseada em recompra, recorrência, pontos e avaliações.
- Aderência ao Plano de Voo baseada em `flight_plan_month_scenarios`.

### Indicadores que devem ficar fora por enquanto

- Estoque real.
- Desperdício real.
- Capacidade produtiva real.
- Horas trabalhadas.
- Lucro real por venda.
- Margem real por pedido.
- Uso real de IA/recomendação.
- Atribuição detalhada de campanha.
- Aceite real de upsell sem evento consolidado.

### Dados a padronizar antes

- Data canônica de pedido.
- Status canônico de pedido.
- Valor canônico de pedido.
- Cliente canônico por `customerId`/telefone.
- Itens do pedido: `productId`, `qty`, `unitPrice`, `lineTotal`.
- Pagamento: método e status.
- Fonte financeira canônica ou dedupe obrigatório.
- Custo/margem salvo como snapshot no pedido.
- `finalResult` e snapshots finais de temporadas como fonte preferencial.

### Coleções/campos a evitar por duplicidade ou baixa confiança

- Usar `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar` e `contas_pagar` sem normalizador/dedupe.
- Usar `products.cost/custo` como custo real histórico de venda.
- Usar cadastro de `promotions`, `coupons` ou `upsellRules` como prova de uso real.
- Usar `aiRecommendation` como prova de execução.
- Usar `store_customers.totalOrders/totalSpent` sem validar contra `orders`.

### Como evitar premiar crescimento ruim

- Criar travas de risco: avanço de Pedra deve ser limitado se `riskLevel` for alto/muito alto.
- Exigir saúde mínima: contas vencidas e margem/caixa não podem piorar muito.
- Exigir consistência: crescimento concentrado em poucos dias não deve valer igual.
- Exigir execução: temporadas abandonadas devem reduzir ou travar progresso.
- Exigir fidelização mínima: crescimento só por novos clientes sem recompra deve ter peso menor.
- Usar receita como um componente, nunca como critério único.

## 11. Cuidados técnicos

- **Duplicidade financeira:** existem `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar` e `contas_pagar`. O Sistema de Pedras precisa de normalizador/dedupe antes de usar saúde financeira.
- **Campos com nomes diferentes:** pedidos e financeiro têm campos equivalentes com nomes diferentes, como `shippingFee/deliveryFee`, `payment/paymentMethod/forma_pagamento`, `customerPhone/phone/whatsapp`.
- **Datas não padronizadas:** há `createdAt`, `updatedAt`, `date`, `data`, `deliveryDate`, `scheduleDate`, `vencimento`, `dueDate`, ISO string e Timestamp Firestore.
- **Valores monetários como string:** muitos valores vêm de inputs e precisam de conversão robusta para número.
- **Status variados:** pedidos misturam português e espanhol; financeiro usa status próprios. É necessário mapear status canônicos.
- **TenantId:** toda leitura futura deve acontecer dentro de `tenants/{tenantId}` via `DB/Auth`. Pedras não devem misturar lojas.
- **Performance de consultas:** não recalcular maturidade inteira em toda abertura de tela. Criar snapshots próprios de maturidade por período.
- **Snapshots próprios para maturidade:** recomendado criar futuramente `business_maturity_snapshots` ou similar, por tenant, com score consolidado mensal/trimestral.
- **Auditabilidade:** cada avanço de Pedra deve guardar os indicadores usados, período, versão do cálculo e limitações de confiança.
- **Não comparar tenants:** Pedras devem medir evolução da própria loja contra seu histórico, não ranking entre lojas.

## Conclusão

O BocaFood já possui base suficiente para uma V1 do Sistema de Pedras se a primeira versão priorizar dados de alta confiança: pedidos, temporadas, plano mensal escolhido, recorrência, avaliações e sinais financeiros normalizados.

A melhor abordagem técnica é tratar Pedras como uma camada de maturidade acumulada, alimentada por snapshots próprios e pelos resultados das Temporadas. O sistema deve premiar crescimento saudável e consistente, com risco controlado, execução real e sinais de fidelização. Faturamento bruto deve ter peso limitado e nunca destravar nível sozinho.
