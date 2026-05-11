# Arquitetura Técnica: Temporadas / Missões Operacionais

## 1. Objetivo da arquitetura

O módulo **Temporadas / Missões Operacionais** deve estruturar ciclos curtos de acompanhamento operacional para objetivos de 30 ou 90 dias. A arquitetura precisa usar dados reais já gerados pelo BocaFood, evitando preenchimento manual de desempenho pela usuária.

A V1 deve ser leve, performática e segura para multi-tenant. O módulo deve calcular progresso, risco, evolução e resultado final a partir de pedidos, clientes, avaliações, marketing, financeiro e Plano de Voo, sempre respeitando o tenant ativo.

A arquitetura também deve permitir evolução futura com IA, recomendações mais ricas e alertas externos, mas sem depender de IA na V1. Na primeira versão, os cálculos devem ser determinísticos, claros e auditáveis.

## 2. Coleções Firestore sugeridas

Todas as coleções sugeridas devem viver dentro do escopo do tenant:

- `tenants/{tenantId}/seasons/{seasonId}`
- `tenants/{tenantId}/season_metrics_snapshots/{snapshotId}`
- `tenants/{tenantId}/season_events/{eventId}`

Nenhuma coleção deve ser global para cálculo individual de uma loja.

### `seasons`

Coleção principal da temporada.

Campos sugeridos:

- `id`
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
- `calculatedTargetValue`
- `startDate`
- `endDate`
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
- `createdAt`
- `updatedAt`
- `startedAt`
- `finishedAt`
- `abandonedAt`

Status possíveis:

- `draft`
- `scheduled`
- `active`
- `finished`
- `abandoned`

Regras:

- Apenas uma temporada `active` por tenant.
- Pode existir mais de uma temporada `scheduled` por tenant.
- Temporadas `scheduled` não podem sobrepor período com outra `scheduled` ou `active`.
- Temporadas `scheduled` só geram snapshots, score operacional e IA quando forem promovidas para `active`.
- Temporada `active` não pode ser editada.
- Temporada `abandoned` não pode ser reativada.
- Temporada `finished` não pode ser alterada.
- Ao iniciar, a temporada deve congelar objetivo, build, dificuldade, duração, baseline e meta calculada.
- O campo `tenantId` deve bater com o caminho `tenants/{tenantId}`.

### `season_metrics_snapshots`

Snapshots de métricas da temporada. Devem guardar leituras consolidadas para evitar recalcular histórico pesado em toda abertura de tela.

Campos sugeridos:

- `id`
- `tenantId`
- `seasonId`
- `snapshotType`
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
- `createdAt`

Tipos:

- `daily`
- `weekly`
- `final`

Regras:

- Cada snapshot deve pertencer a uma temporada do mesmo tenant.
- `metrics` pode conter o mapa bruto consolidado.
- `mainMetrics` deve conter métricas com peso direto no score.
- `auxiliaryMetrics` deve conter sinais explicativos, estimativas e contexto.
- `alerts` e `insights` devem ser derivados dos dados calculados, não preenchidos manualmente como desempenho.

### `season_events`

Coleção opcional para V1, preparada para futuro. Pode registrar acontecimentos importantes sem virar requisito inicial de interface ou automação.

Campos sugeridos:

- `id`
- `tenantId`
- `seasonId`
- `type`
- `title`
- `description`
- `severity`
- `relatedMetric`
- `createdAt`

Exemplos:

- `risk_detected`
- `milestone_reached`
- `weekly_summary_generated`
- `season_finished`
- `season_abandoned`

## 3. Fonte de dados

As fontes abaixo alimentam Temporadas a partir de dados já existentes. Toda leitura deve passar por normalização antes de cálculo.

| Coleção | Uso esperado | Nível de confiança | Cuidados necessários |
|---|---|---|---|
| `orders` | Base principal para faturamento, pedidos, ticket médio, dias ativos, itens vendidos, canal, tipo, cliente e recompra. | Alta | Excluir cancelados, normalizar datas, total, status, cliente, telefone, itens, canal e tipo. |
| `products` | Apoiar análise de mix, produtos premium, preço e custo estimado. | Média | Nem todo item vendido garante snapshot de custo; usar `productId` quando existir e nome como fallback. |
| `store_customers` | Apoiar recorrência, clientes ativos, dados agregados e relacionamento. | Média | Pode faltar `createdAt` ou vínculo perfeito com pedidos; usar pedido e telefone normalizado como fallback. |
| `reviews` | Medir avaliações, nota média e sinais de qualidade operacional. | Alta | Filtrar por status/aprovação quando aplicável e considerar data da avaliação. |
| `points_movements` | Apoiar fidelização, pontos gerados/usados e engajamento de clientes recorrentes. | Alta | Validar vínculo com `customerId` e período da temporada. |
| `promotions` | Contexto de promoções ativas e possíveis impactos em vendas/ticket. | Média | Cadastro de promoção não prova uso real; cruzar com pedidos quando houver IDs/descontos. |
| `coupons` | Apoiar análise de cupons, descontos e campanhas. | Média | `usesCount` e uso real podem variar por fluxo; priorizar cupom salvo no pedido. |
| `upsellEvents` | Medir sinais de upsell, exposição, clique ou aceite quando disponíveis. | Média | Coleta pode estar incompleta; não usar como métrica decisiva sem validação. |
| `movimentacoes` | Apoiar leitura financeira legada, entradas, saídas e lucro estimado. | Média | Pode duplicar dados de financeiro moderno; exige dedupe e normalização. |
| `financeiro_entradas` | Apoiar receitas financeiras e recebimentos. | Média | Comparar com pedidos e `movimentacoes` para evitar duplicidade. |
| `financeiro_saidas` | Apoiar custos/despesas e lucro operacional estimado. | Média | Normalizar status, datas e valores; separar previsto de realizado. |
| `financeiro_apagar` | Apoiar contas pendentes e pressão de caixa. | Média | Pode coexistir com `contas_pagar`; dedupe obrigatório. |
| `contas_pagar` | Apoiar contas a pagar, vencimentos e despesas. | Média | Normalizar status e evitar duplicidade com compras e financeiro legado. |
| `compras` | Apoiar compras por fornecedor e custo atualizado de insumos. | Média | Útil para contexto, mas não representa estoque real nem custo exato por venda. |
| `flight_plans` | Apoiar comparação com planejamento e metas existentes. | Média | Usar como referência auxiliar, não como substituto das métricas reais da temporada. |
| `flight_plan_month_scenarios` | Apoiar ritmo versus cenário mensal e metas do Plano de Voo. | Alta | Conferir período, `monthKey` e tenant; útil para comparação de ritmo. |

## 4. Normalização de dados

O módulo precisa usar normalizadores antes de calcular métricas. A camada de normalização deve transformar campos heterogêneos em uma estrutura canônica para Temporadas.

Normalizar:

- Datas.
- Valores monetários.
- Status de pedido.
- Status de pagamento.
- Cliente.
- Telefone.
- Itens do pedido.
- Produto.
- Canal/origem.
- Tipo de pedido.

Regras:

- Total do pedido deve usar `orders.total`.
- Pedidos cancelados devem ser excluídos dos cálculos principais.
- Cliente recorrente deve usar `customerId` quando existir e telefone normalizado como fallback.
- Produto vendido deve usar `productId` quando existir e nome como fallback.
- Datas devem priorizar uma data canônica de pedido.
- Valores monetários devem ser convertidos para número e ignorar entradas inválidas.
- Status de pedido deve mapear variações em português/espanhol para estados canônicos.
- Canal/origem deve consolidar `channel`, `source` e `type` sem perder o valor original.

Data canônica sugerida para pedidos:

1. `createdAt`, quando existir e representar criação real do pedido.
2. `date` ou `data`, quando `createdAt` não existir.
3. `deliveryDate` ou `scheduleDate`, apenas como fallback analítico quando a data de criação não estiver disponível.

## 5. Cálculo de baseline

Baseline é o ponto de partida usado para calcular meta automática, ritmo esperado e risco.

Para temporada de 30 dias:

- Usar últimos 30 dias como baseline padrão.

Para temporada de 90 dias:

- Usar últimos 90 dias como baseline padrão.

Se não houver dados suficientes:

- Usar dados disponíveis.
- Marcar confiabilidade como baixa.
- Avisar que a meta automática pode ser menos precisa.
- Evitar gerar conclusões fortes quando a base histórica for pequena.

Campos esperados:

- `baselinePeriod`
- `baselineValue`
- `baselineOrders`
- `baselineRevenue`
- `baselineAverageTicket`
- `baselineRecurringCustomers`
- `baselineActiveDays`

O baseline deve ser calculado no início da temporada e gravado em `seasons` para que a meta não mude durante o ciclo.

## 6. Tipos de atualização

### Tempo real / ao abrir tela

Calcular:

- Faturamento atual.
- Pedidos atuais.
- Ticket médio atual.
- Progresso básico.
- Dias restantes.

Essa camada deve usar consultas leves por tenant e período da temporada.

### Snapshot diário

Gerar:

- Score diário.
- Alertas simples.
- Progresso do dia.
- Comparação com ritmo esperado.

O snapshot diário deve ser curto e operacional, com foco em desvios rápidos.

### Snapshot semanal

Gerar:

- Tendência.
- Risco.
- Evolução positiva.
- Recomendação estratégica.

O snapshot semanal deve consolidar padrões e reduzir ruído de um único dia.

### Snapshot final

Gerar:

- Resultado final.
- Classificação.
- Pontos fortes.
- Pontos críticos.
- Sugestão para próxima temporada.

O snapshot final deve ser criado ao finalizar a temporada e deve congelar o resultado.

## 7. Score geral

O score geral deve ser um número de 0 a 100. Ele deve ser calculado com base nos pesos definidos em `SEASON_SCORING_SYSTEM.md`.

Regras:

- Métricas principais pesam mais que auxiliares.
- Métricas auxiliares ajudam a explicar contexto, risco e interpretação.
- Build altera interpretação e peso relativo dos indicadores.
- Score não deve depender de IA externa na V1.
- Métricas de baixa confiança não devem determinar vitória ou falha.
- O score exibido deve ser simples, mesmo que o cálculo interno preserve detalhes por métrica.

Status sugeridos:

- 85 a 100: Excelente.
- 65 a 84: Estável.
- 40 a 64: Instável.
- 0 a 39: Crítico.

## 8. Alertas

Alertas representam desvios, marcos ou sinais relevantes derivados dos dados da temporada.

Campos:

- `id`
- `type`
- `severity`
- `title`
- `message`
- `metric`
- `value`
- `expectedValue`
- `createdAt`

Severidade:

- `info`
- `warning`
- `critical`
- `success`

Na V1:

- Alertas aparecem apenas no painel.
- Não enviar WhatsApp, email ou push.
- Alertas devem ser explicáveis com os dados usados.
- Alertas não devem ser criados a partir de tarefas manuais.

Exemplos de tipos:

- `behind_expected_pace`
- `low_active_days`
- `ticket_drop`
- `recurrence_drop`
- `milestone_reached`
- `weekly_growth`

## 9. Lifecycle da temporada

### 1. `draft`

A temporada está sendo criada. Pode receber configuração inicial, mas ainda não deve calcular progresso oficial.

### 2. `scheduled`

A temporada foi criada com `startDate` futura. Pode existir em múltiplas unidades por tenant desde que os períodos não se sobreponham com outra temporada `scheduled` ou `active`. Não deve gerar snapshots, score operacional ou recomendações de IA até virar `active`.

### 3. `active`

A temporada foi iniciada. Não pode ser editada. O sistema passa a calcular progresso, risco, score e snapshots.

### 4. `finished`

A temporada terminou. Resultado final calculado e snapshot final gerado. Não pode ser alterada.

### 5. `abandoned`

A usuária abandonou a temporada. Não pode ser editada nem reativada.

Regras:

- Não permitir duas temporadas `active` ao mesmo tempo.
- Permitir múltiplas temporadas `scheduled`, sem sobreposição de período.
- Ao abrir o módulo, uma temporada `scheduled` com `startDate <= hoje` pode ser promovida para `active` se não existir outra `active`.
- Se já existir `active`, manter a temporada vencida como `scheduled` e exibir alerta administrativo.
- Ao iniciar nova temporada, verificar se já existe `active`.
- Ao finalizar, gerar snapshot final.
- Ao abandonar, registrar motivo opcional no futuro.
- Transições válidas: `draft` → `scheduled`, `draft` → `active`, `scheduled` → `active`, `active` → `finished`, `active` → `abandoned`.
- Não permitir `finished` → `active` nem `abandoned` → `active`.

## 10. Performance

Cuidados:

- Evitar recalcular histórico completo em toda abertura de tela.
- Usar snapshots para leituras pesadas.
- Manter cálculos simples em tempo real.
- Limitar consultas por período.
- Usar queries por tenant e período.
- Preparar índices Firestore se necessário.
- Evitar dependência de coleções duplicadas sem normalização.
- Preferir agregações por período da temporada e baseline, não varreduras globais.
- Separar cálculo rápido de tela de diagnósticos semanais mais pesados.

Consultas prováveis:

- Temporada ativa por tenant: `status == active`.
- Snapshots por temporada: `seasonId`, `snapshotType`, `date`.
- Pedidos por tenant e período canônico.
- Avaliações, pontos e eventos por tenant e período.

## 11. Multi-tenant e segurança

Regras:

- Todas as leituras e escritas devem respeitar `tenants/{tenantId}`.
- Nunca misturar dados entre lojas.
- Não usar dados globais para cálculo individual da temporada.
- Regras devem respeitar `Auth.getTenantId()`.
- Status e snapshots devem pertencer ao tenant correto.
- O `tenantId` gravado no documento deve ser validado contra o tenant do caminho.
- Exportações futuras devem conter somente dados do tenant selecionado.
- Dados de comparação futura entre lojas só podem ser anônimos e fora da V1.

## 12. Fora do escopo da V1

Não incluir na arquitetura inicial:

- Múltiplas temporadas ativas.
- Ranking entre lojas.
- Comparação pública entre tenants.
- Estoque automático.
- Desperdício real.
- Previsão avançada com IA.
- Tarefas manuais.
- Notificações externas.
- Gamificação infantil.
- Avatar, XP falso ou medalhas sem dado real.

## 13. Preparação para futuro

A arquitetura deve permitir no futuro:

- IA gerar insights melhores a partir dos snapshots.
- Comparação anônima entre lojas parecidas.
- Recomendações automáticas de próxima temporada.
- Alertas externos.
- Missões secundárias.
- Análise por campanha.
- Integração com Meta Ads / Google Analytics.

Preparação técnica recomendada:

- Manter snapshots bem estruturados e versionáveis.
- Guardar baseline, pesos, objetivo, build e dificuldade usados no momento da temporada.
- Separar métricas principais de auxiliares.
- Preservar confiabilidade por métrica.
- Evitar acoplar Temporadas a uma interface específica.
- Projetar `season_events` para histórico de acontecimentos sem obrigar uso na V1.

## Referências técnicas

- `DATA_MAP_FOR_SEASONS.md`
- `SEASONS_SPEC.md`
- `SEASON_SCORING_SYSTEM.md`
- `AGENTS.md`
