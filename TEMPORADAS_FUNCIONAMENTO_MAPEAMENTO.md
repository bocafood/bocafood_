# Temporadas / Missões Operacionais — funcionamento e mapeamento

## 1. Objetivo do módulo

Temporadas são ciclos operacionais de 30 ou 90 dias para acompanhar metas reais da loja com base em dados já gerados pelo BocaFood. A usuária escolhe foco, duração, meta, dificuldade e estratégia. Depois disso, o sistema calcula automaticamente progresso, score, ritmo, risco, snapshots, resultado final e impacto na Maturidade do Negócio.

Temporadas não são tarefas manuais. A usuária não informa desempenho e não marca avanço. O módulo lê pedidos, clientes e sinais operacionais do tenant atual.

## 2. Onde está implementado hoje

Arquivos principais:

- `public/js/modules/temporadas.js`
- `public/js/services/seasons.ai.js`
- `public/css/modules/temporadas.css`
- `public/admin.html`

Rotas atuais:

- `crescimento/maturidade`: tela própria de Maturidade do Negócio / Pedras.
- `crescimento/temporadas`: módulo de Temporadas.

Abas atuais de Temporadas:

- `Ativa`
- `Programadas`
- `Histórico`

Coleções usadas diretamente:

- `tenants/{tenantId}/seasons`
- `tenants/{tenantId}/season_metrics_snapshots`
- `tenants/{tenantId}/orders`

Coleções ligadas por integração de maturidade:

- `tenants/{tenantId}/business_maturity/current`
- `tenants/{tenantId}/business_maturity_snapshots`
- `tenants/{tenantId}/stone_upgrade_events`

## 3. Fluxo da temporada

1. A usuária abre `Crescimento > Temporadas`.
2. Clica em `Nova Temporada`.
3. O wizard coleta:
   - objetivo;
   - duração;
   - data de início;
   - tipo de meta;
   - dificuldade;
   - estratégia operacional;
   - resumo final.
4. O sistema calcula baseline usando pedidos recentes.
5. Se a data de início for hoje, a temporada nasce como `active`.
6. Se a data de início for futura, nasce como `scheduled`.
7. Temporadas programadas podem virar `active` automaticamente quando chega a data, desde que não exista outra ativa.
8. Enquanto ativa, o sistema recalcula score, progresso, ritmo e risco.
9. O sistema cria snapshots diários e semanais.
10. Quando a meta chega a 100%, marca `goalReachedAt` e pode mostrar comemoração de meta atingida.
11. Ao finalizar, gera resultado final e snapshot final.
12. O resultado final alimenta o Sistema de Pedras / Maturidade do Negócio.

## 4. Opções disponíveis no wizard

### Objetivos

| Valor técnico | Nome exibido | Métrica principal | Foco |
|---|---|---|---|
| `sell_more` | Vender Mais | `revenue` | Faturamento, pedidos e dias com venda. |
| `increase_ticket` | Aumentar Ticket | `averageTicket` | Ticket médio, valor por pedido e adicionais. |
| `retain_customers` | Fidelizar Clientes | `recurringCustomers` | Recorrência, recompra e frequência. |
| `improve_consistency` | Melhorar Consistência | `activeDays` | Dias ativos, regularidade e redução de dias fracos. |

### Durações

| Valor técnico | Nome exibido | Dias |
|---|---|---|
| `sprint` | Sprint | 30 |
| `season` | Temporada | 90 |

### Tipo de meta

| Valor técnico | Nome exibido | Funcionamento |
|---|---|---|
| `automatic` | Meta automática | Calculada sobre o baseline recente. |
| `fixed` | Meta fixa | A usuária informa o valor da meta. |

### Dificuldade

| Valor técnico | Nome exibido | Interpretação |
|---|---|---|
| `safe` | Seguro | Meta conservadora e menor pressão operacional. |
| `balanced` | Equilibrado | Meta moderada, exige consistência. |
| `aggressive` | Agressivo | Meta mais alta, maior ritmo e maior risco. |

### Estratégia operacional

| Valor técnico | Nome exibido | Interpretação |
|---|---|---|
| `volume` | Volume | Prioriza pedidos, frequência e movimento. |
| `margin` | Margem | Prioriza ticket, valor por pedido e produtos de maior valor. |
| `retention` | Fidelização | Prioriza recompra, recorrência e frequência. |

## 5. Coleção `seasons`

Caminho:

`tenants/{tenantId}/seasons/{seasonId}`

Campos principais salvos hoje:

| Campo | Tipo esperado | Descrição |
|---|---|---|
| `tenantId` | string | Tenant dono da temporada. |
| `title` | string | Nome gerado, ex: `Vender Mais · 30 dias`. |
| `objective` | string | Objetivo técnico. |
| `build` | string | Estratégia operacional. |
| `difficulty` | string | Dificuldade. |
| `durationType` | string | `sprint` ou `season`. |
| `targetMode` | string | `automatic` ou `fixed`. |
| `targetValue` | number/null | Meta digitada quando o modo é fixo. |
| `targetMetric` | string | Métrica principal do objetivo. |
| `baselinePeriod` | string | Período usado no baseline, ex: `30d`. |
| `baselineValue` | number/null | Valor base da métrica principal. |
| `baselineRevenue` | number | Faturamento do baseline. |
| `baselineOrders` | number | Pedidos do baseline. |
| `baselineAverageTicket` | number | Ticket médio do baseline. |
| `baselineActiveDays` | number | Dias com venda no baseline. |
| `baselineRecurringCustomers` | number | Clientes recorrentes no baseline. |
| `baselineRepurchaseRate` | number | Taxa estimada de recompra. |
| `baselineConfidence` | string | `high`, `medium` ou `low`. |
| `calculatedTargetValue` | number/null | Meta calculada pelo sistema. |
| `initialRiskLevel` | string | Risco inicial. |
| `startDate` | ISO date string | Início planejado. |
| `endDate` | ISO date string | Fim planejado. |
| `status` | string | Estado atual. |
| `currentScore` | number | Score atual, 0 a 100. |
| `currentStatus` | string | Ritmo atual. |
| `riskLevel` | string | Chance de falha atual. |
| `progressPercent` | number | Progresso em relação à meta. Pode passar de 100. |
| `currentMetrics` | object | Métricas calculadas no período atual. |
| `goalReachedAt` | ISO/null | Quando a meta chegou a 100%. |
| `goalCelebrationShownAt` | ISO/null | Quando a comemoração da meta foi exibida. |
| `goalCelebrationPending` | boolean | Indica comemoração pendente. |
| `goalReachedSnapshotId` | string | Preparado para vínculo com snapshot. |
| `startedAt` | ISO/null | Quando entrou como ativa. |
| `finishedAt` | ISO/null | Quando foi finalizada. |
| `abandonedAt` | ISO/null | Quando foi abandonada. |
| `finalResult` | string | Resultado final. |
| `finalScore` | number | Score final. |
| `finalProgressPercent` | number | Progresso final. |
| `finalMetrics` | object | Métricas finais congeladas. |
| `finalSummary` | object | Resumo final interpretativo. |
| `createdAt` | ISO | Criação técnica. |
| `updatedAt` | ISO | Última atualização técnica. |
| `aiEnabled` | boolean | Hoje salvo como `false` quando há recomendação gerada/fallback. |
| `lastAIRecommendationAt` | ISO | Última recomendação gerada. |
| `lastAIRecommendationSummary` | string | Resumo da recomendação. |

### `currentMetrics`

Campos calculados hoje:

| Campo | Descrição |
|---|---|
| `currentValue` | Valor atual da métrica principal. |
| `targetValue` | Meta usada para cálculo. |
| `revenue` | Faturamento no período atual. |
| `orders` | Número de pedidos válidos. |
| `averageTicket` | Ticket médio. |
| `activeDays` | Dias com venda. |
| `recurringCustomers` | Clientes recorrentes. |
| `repurchaseRate` | Taxa de recompra estimada. |
| `averageFrequency` | Frequência média de pedidos por cliente identificado. |
| `averageItemsPerOrder` | Itens médios por pedido. |
| `weeklyRegularity` | Regularidade semanal de 0 a 1. |
| `weakDays` | Dias sem venda dentro do período analisado. |
| `strongHours` | Horários mais fortes. |
| `topProducts` | Produtos mais vendidos. |
| `lowSellingProducts` | Preparado, mas hoje fica vazio. |
| `elapsedDays` | Dias decorridos. |
| `daysRemaining` | Dias restantes. |
| `expectedProgress` | Progresso esperado pelo tempo decorrido. |
| `progressRatio` | Relação entre progresso real e esperado. |
| `observations` | Observações técnicas/fallbacks usados. |

## 6. Status possíveis

| Status | Descrição | Pode editar? |
|---|---|---|
| `draft` | Rascunho técnico. Pouco usado no fluxo atual. | Sim, se existir. |
| `scheduled` | Programada para data futura. | Sim, desde que não vire ativa. |
| `active` | Temporada em andamento. | Não. |
| `finished` | Finalizada com resultado final. | Não. |
| `abandoned` | Abandonada. | Não pode ser reativada. |

Regras atuais:

- Só pode existir uma temporada `active` por tenant.
- Temporadas `scheduled` e `active` não podem ter períodos sobrepostos.
- Temporada `scheduled` pode virar `active` automaticamente quando a data chega, se não existir outra ativa.
- Apenas temporada `active` pode ser finalizada.
- Temporada `finished` ou `abandoned` não pode ser editada pelo fluxo atual.

## 7. Baseline e meta

O baseline usa pedidos válidos dos últimos 30 ou 90 dias, conforme a duração escolhida.

Pedidos cancelados são excluídos. A data do pedido é normalizada por esta prioridade:

1. `canonicalDate`
2. `createdAt`
3. `date`
4. `data`
5. `deliveryDate`
6. `scheduleDate`

Cliente é identificado por:

1. `customerId`
2. `clientId`
3. telefone normalizado (`customerPhone`, `phone`, `whatsapp`, `customerWhatsapp`)
4. e-mail (`customerEmail`, `email`)

Confiança do baseline:

| Pedidos válidos | Confiança |
|---:|---|
| 10 ou mais | `high` |
| 3 a 9 | `medium` |
| 0 a 2 | `low` |

### Meta automática

| Objetivo | Seguro | Equilibrado | Agressivo |
|---|---:|---:|---:|
| `sell_more` | +10% | +20% | +35% |
| `increase_ticket` | +5% | +10% | +18% |
| `retain_customers` | +5% | +12% | +20% |
| `improve_consistency` | +1 dia | +2 dias | +3 dias |

### Risco inicial de meta fixa

Quando a meta é fixa, o risco inicial depende do crescimento pedido sobre o baseline:

| Crescimento pedido | Risco |
|---:|---|
| até 15% | `low` |
| até 35% | `medium` |
| até 60% | `high` |
| acima de 60% | `very_high` |
| baseline baixo/sem confiança | `unknown` |

## 8. Cálculo de progresso, score e ritmo

### Progresso

`progressPercent = currentValue / targetValue * 100`

Valor pode passar de 100 quando a meta é superada.

Métrica principal por objetivo:

| Objetivo | Métrica principal |
|---|---|
| `sell_more` | `revenue` |
| `increase_ticket` | `averageTicket` |
| `retain_customers` | `recurringCustomers` ou `repurchaseRate` |
| `improve_consistency` | `activeDays` |

### Score por objetivo

| Objetivo | Pesos atuais |
|---|---|
| `sell_more` | Faturamento 45%, pedidos 35%, dias com venda 20%. |
| `increase_ticket` | Ticket médio 50%, valor médio por pedido 25%, itens por pedido 25%. |
| `retain_customers` | Clientes recorrentes 45%, recompra 35%, frequência média 20%. |
| `improve_consistency` | Dias com venda 40%, regularidade semanal 35%, redução de dias fracos 25%. |

### Ritmo atual

O ritmo compara progresso real com progresso esperado pelo tempo decorrido.

| Condição | Status exibido |
|---|---|
| Poucos dados no primeiro dia | `starting` / Em início |
| Progresso >= 110% do esperado | `Excelente` |
| Progresso >= 80% do esperado | `Estável` |
| Progresso >= 50% do esperado | `Instável` |
| Abaixo disso após carência | `Crítico` |

Carência:

- 3 dias para temporada de 30 dias.
- 7 dias para temporada de 90 dias.

### Chance de falha

Risco atual combina:

- risco inicial;
- diferença entre progresso esperado e progresso real;
- dias restantes;
- queda recente nos últimos 7 dias contra os 7 dias anteriores.

Estados:

- `low` / Baixo
- `medium` / Médio
- `high` / Alto
- `very_high` / Muito alto
- `unknown` / Indefinido

## 9. Snapshots da temporada

Coleção:

`tenants/{tenantId}/season_metrics_snapshots/{snapshotId}`

Tipos:

| Tipo | Quando é criado | Período |
|---|---|---|
| `daily` | Durante temporada ativa, no máximo um por dia. | Dia atual desde 00:00 ou início da temporada. |
| `weekly` | Durante temporada ativa, no máximo um por semana. | Últimos 7 dias ou início da temporada. |
| `final` | Ao finalizar temporada. | Temporada inteira. |

Campos principais:

| Campo | Descrição |
|---|---|
| `tenantId` | Tenant dono. |
| `seasonId` | Temporada vinculada. |
| `snapshotType` | `daily`, `weekly` ou `final`. |
| `date` | Chave de data do snapshot. |
| `periodStart` | Início do período analisado. |
| `periodEnd` | Fim do período analisado. |
| `objective` | Objetivo da temporada. |
| `build` | Estratégia. |
| `difficulty` | Dificuldade. |
| `score` | Score no momento. |
| `progressPercent` | Progresso no momento. |
| `status` | Ritmo/status no momento. |
| `riskLevel` | Risco no momento. |
| `confidence` | Confiança do snapshot. |
| `metrics` | Métricas consolidadas. |
| `mainMetrics` | Métricas principais conforme objetivo. |
| `auxiliaryMetrics` | Métricas auxiliares. |
| `alerts` | Alertas automáticos. |
| `insights` | Insights do snapshot/final. |
| `aiRecommendation` | Recomendação gerada/fallback. |
| `aiRecommendationGeneratedAt` | Data da recomendação. |
| `aiRecommendationModel` | Modelo/origem. |
| `aiRecommendationStatus` | `not_requested`, `generated` ou `fallback`. |
| `aiRecommendationError` | Erro se houver fallback. |

Alertas automáticos atuais:

- `low_confidence`: poucos dados no período.
- `risk_level`: chance de falha elevada.
- `target_reached`: meta atingida.
- `no_orders`: sem pedidos no período para objetivo `sell_more`.

## 10. IA / Próxima Jogada

Arquivo:

`public/js/services/seasons.ai.js`

Funcionamento:

- A IA não calcula score, meta, risco ou progresso.
- Ela recebe contexto já calculado pelo BocaFood.
- Se não houver endpoint configurado, usa regras locais de fallback.
- A recomendação fica no snapshot diário.

Campos do contexto enviado:

- objetivo, build, dificuldade, duração, tipo de meta;
- meta, baseline, datas;
- score, status, risco, progresso;
- métricas principais e auxiliares;
- alertas;
- faturamento, pedidos, ticket, dias ativos;
- produtos fortes;
- clientes recorrentes;
- limitações dos dados.

Tipos de fallback:

| Objetivo | Recomendação local principal |
|---|---|
| `sell_more` | Reforçar melhor produto no melhor período. |
| `increase_ticket` | Criar combo com produto mais vendido. |
| `retain_customers` | Reativar clientes que já compraram. |
| `improve_consistency` | Criar ação para o dia mais fraco. |

## 11. Resultado final da temporada

Uma temporada ativa pode ser finalizada manualmente. Ao finalizar:

1. Recalcula score e progresso.
2. Define `finalResult`.
3. Salva patch final em `seasons`.
4. Cria snapshot `final`.
5. Exibe modal de resultado.
6. Calcula impacto na Maturidade do Negócio.

Resultados possíveis:

| Resultado | Regra atual |
|---|---|
| `Vitória Total` | `progressPercent >= 100`. |
| `Vitória Parcial` | `progressPercent >= 75` e evolução relevante (`score >= 65` ou risco baixo/médio). |
| `Temporada Instável` | `progressPercent >= 40` ou `score >= 40`. |
| `Falha Operacional` | Abaixo dos critérios anteriores. |

Resumo final (`finalSummary`) contém:

| Campo | Descrição |
|---|---|
| `worked` | Lista do que funcionou. |
| `blocked` | Lista do que atrapalhou. |
| `evolution` | Texto interpretativo do resultado. |
| `nextSeasonSuggestion` | Próximo objetivo sugerido. |
| `suggestionReason` | Motivo da sugestão. |

Possíveis pontos positivos detectados:

- meta principal atingida;
- score operacional saudável;
- pedidos reais suficientes;
- dias ativos suficientes;
- clientes recorrentes detectados.

Possíveis limitadores:

- progresso abaixo de 75%;
- risco alto ou muito alto;
- ausência de pedidos válidos;
- regularidade semanal abaixo de 0,55;
- baixa recorrência quando o objetivo é fidelizar.

## 12. Relação com Maturidade do Negócio / Pedras

Temporadas finalizadas e abandonadas alimentam o Sistema de Pedras. O impacto usa:

- temporadas concluídas;
- temporadas abandonadas;
- Vitória Total;
- Vitória Parcial;
- Temporada Instável;
- Falha Operacional;
- score final;
- risco final;
- dificuldade da temporada;
- estabilidade e execução.

Na tela de resultado final aparece o bloco `Impacto na sua Pedra`, com:

- Pedra atual;
- próxima Pedra;
- progresso antes/depois quando possível;
- contribuição da temporada;
- motivo do avanço ou limitação.

## 13. Dados usados hoje

Fonte principal:

- `orders`

Campos lidos de pedidos:

- `total`
- `status`
- `canonicalDate`
- `createdAt`
- `date`
- `data`
- `deliveryDate`
- `scheduleDate`
- `items`
- `itens`
- `products`
- `itemsCount`
- `itemCount`
- `quantity`
- `customerId`
- `clientId`
- `customerPhone`
- `phone`
- `whatsapp`
- `customerWhatsapp`
- `customerEmail`
- `email`
- `analyticsHour`
- `analyticsTime`
- `orderTime`
- `saleTime`
- `createdTime`
- `deliveryTime`
- `scheduleTime`
- `slotTime`

Campos lidos de itens:

- `name`
- `productName`
- `nome`
- `title`
- `qty`
- `quantity`
- `qtd`
- `quantidade`
- `total`
- `lineTotal`
- `priceTotal`
- `subtotal`
- `price`
- `preco`

Status de pedido ignorados:

- `cancelado`
- `cancelada`
- `canceled`
- `cancelled`

## 14. Validações e travas atuais

Validações do wizard:

- objetivo obrigatório;
- duração obrigatória;
- data de início obrigatória;
- data de início não pode ser no passado;
- tipo de meta obrigatório;
- meta fixa precisa ser maior que zero;
- dificuldade obrigatória;
- estratégia obrigatória;
- bloqueia sobreposição de período com temporada ativa/programada.

Validações de persistência:

- tenant precisa existir;
- DB precisa estar disponível;
- temporada ativa não pode ser editada;
- finalizada não pode ser editada;
- abandonada não pode ser reativada;
- apenas uma ativa por tenant;
- temporada só pode ser finalizada se estiver ativa;
- temporada precisa pertencer ao tenant atual.

Alertas de configuração:

- meta exige crescimento alto sobre histórico;
- dificuldade agressiva com baixa confiança;
- estratégia desalinhada com objetivo;
- poucos pedidos para baseline;
- sprint com meta muito agressiva;
- conflito com outra temporada no período.

## 15. O que está funcionando hoje

- Criação de temporada por wizard.
- Meta automática e meta fixa.
- Baseline por pedidos recentes.
- Temporadas ativas e programadas.
- Promoção automática de programada para ativa quando chega a data.
- Trava de sobreposição.
- Trava de uma temporada ativa por tenant.
- Recalculo de score, progresso, ritmo e risco.
- Snapshots diário, semanal e final.
- Recomendação de Próxima Jogada com fallback local.
- Comemoração quando meta chega a 100%.
- Resultado final com quatro classificações.
- Integração com Maturidade do Negócio / Pedras.
- Histórico de temporadas finalizadas/abandonadas.

## 16. O que falta ou precisa melhorar

### Dados e confiabilidade

- Padronizar datas de pedidos em um campo canônico definitivo.
- Garantir snapshot de custo/margem no item vendido.
- Melhorar identificação de cliente para evitar recorrência subestimada.
- Popular `lowSellingProducts`, hoje preparado mas vazio.
- Usar avaliações reais na leitura da temporada.
- Usar pontos/fidelidade como dado real de fidelização.
- Validar coleta real de promoções, cupons e upsell em todos os fluxos.
- Diferenciar pedido criado, entregue, pago e cancelado com status canônico.

### Lógica de temporadas

- Implementar abandono explícito pela interface, caso ainda não exista fluxo visível.
- Criar edição segura para temporadas programadas antes de iniciar, se for desejado.
- Melhorar cálculo de regularidade semanal em períodos curtos.
- Fazer score considerar build com mais força; hoje a build orienta mais a leitura do que altera profundamente o cálculo.
- Adicionar leitura real de margem para objetivo/estratégia `margin`.
- Fazer snapshots finais registrarem `createdAt` de forma consistente quando criados diretamente por `DB.add`.

### Interface

- Separar completamente código de Maturidade e Temporadas em módulos próprios no futuro.
- Mostrar melhor a diferença entre `Ritmo Atual`, `Score`, `Progresso` e `Chance de Falha`.
- Criar visão de comparação entre baseline, atual e meta por objetivo.
- Melhorar histórico de snapshots na tela de Temporadas.
- Permitir visualizar detalhes da recomendação de IA/fallback com limitações dos dados.

### Arquitetura

- Extrair cálculo para um serviço próprio (`seasons.analytics.js`) para reduzir tamanho de `temporadas.js`.
- Criar serviço de persistência (`seasons.service.js`) para CRUD, snapshots e validações.
- Criar normalizadores reutilizáveis para pedidos, clientes e itens.
- Evitar duplicar cálculos entre Temporadas e Maturidade.
- Criar índices Firestore documentados para `seasons` e `season_metrics_snapshots`.
- Considerar uma coleção `season_events` para auditoria de acontecimentos importantes.

### Produto

- Definir se `draft` será usado ou removido do fluxo.
- Definir regras claras para abandonar temporada.
- Definir se temporadas finalizadas podem ser reabertas apenas por admin interno.
- Definir como o Plano de Voo deve influenciar a meta automática.
- Definir como promoções, cupons e campanhas devem impactar resultado sem premiar crescimento ruim.

## 17. Recomendações objetivas

Para lançamento:

- Manter Temporadas focadas em pedidos, ticket, dias ativos, recorrência básica e score operacional.
- Tratar margem, promoções, upsell e financeiro como sinais auxiliares até haver dados mais confiáveis.
- Não usar estoque, desperdício ou lucro real por venda como regra principal ainda.
- Garantir que `orders.createdAt`, `orders.total`, `orders.status`, cliente e itens estejam consistentes.
- Validar manualmente os quatro resultados finais com tenants de teste.

Para próxima etapa técnica:

- Separar `Maturidade do Negócio` de `Temporadas` também em arquivos/módulos próprios.
- Extrair cálculo para serviços testáveis.
- Criar testes unitários para baseline, meta automática, score, risco, snapshots e resultado final.
- Documentar índices Firestore necessários.
- Fechar a definição de abandono de temporada.
