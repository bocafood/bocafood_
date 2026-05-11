# Especificação Técnica Inicial: Temporadas / Missões Operacionais

## 1. Definição do módulo

O módulo **Temporadas / Missões Operacionais** representa ciclos curtos de foco operacional para a loja. Uma Temporada é uma missão baseada em dados reais que o BocaFood já gera durante a operação diária, como pedidos, faturamento, ticket médio, produtos vendidos, clientes recorrentes, recompra e avaliações.

A usuária não preenche manualmente desempenho, não marca tarefas e não informa progresso de forma subjetiva. A temporada interpreta automaticamente os dados gerados pelo sistema dentro do período escolhido e transforma esses dados em leitura operacional, alertas, ritmo esperado e resultado final.

Na V1, o módulo deve priorizar clareza e confiabilidade. Dados com alta confiança podem orientar metas e conclusões principais. Dados com confiança média podem apoiar interpretações e alertas. Dados com baixa confiança não devem ser usados como decisão central da temporada.

## 2. Objetivos disponíveis na V1

### Vender Mais

- **Objetivo estrategico:** aumentar o volume de vendas e o faturamento dentro do periodo da temporada.
- **Metricas principais:** numero de pedidos, faturamento, produtos vendidos, dias fortes/fracos, horarios fortes.
- **Metricas auxiliares:** ticket medio, canal/origem dos pedidos, produtos mais vendidos, avaliacoes recebidas.
- **Dados usados:** `orders.total`, `orders.items`, `orders.status`, datas do pedido, `channel`, `source`, `type`, `reviews`.
- **Bom desempenho:** crescimento consistente de pedidos e faturamento, ritmo diario/semanal proximo ou acima da meta calculada, aumento de vendas nos dias ou horarios historicamente fortes e ausencia de queda relevante em avaliacoes.
- **Risco:** queda de pedidos, faturamento abaixo do ritmo esperado, concentracao excessiva em poucos dias, horarios fortes perdendo tracao ou crescimento acompanhado de piora nas avaliacoes.

### Aumentar Ticket

- **Objetivo estrategico:** elevar o valor medio por pedido sem depender apenas de aumento bruto de volume.
- **Metricas principais:** ticket medio, faturamento, composicao dos itens do pedido, produtos vendidos.
- **Metricas auxiliares:** cupons, descontos, promocoes usadas, upsell, mix de produtos, margem estimada.
- **Dados usados:** `orders.total`, `orders.subtotal`, `orders.items`, campos de desconto/cupom/promocao quando presentes, `products.price`, `products.cost/custo`, `fichasTecnicas`.
- **Bom desempenho:** ticket medio acima da linha base, faturamento acompanhando a evolucao do ticket, aumento de itens por pedido ou venda de produtos de maior valor sem queda forte no numero de pedidos.
- **Risco:** ticket medio estavel ou em queda, aumento de faturamento sustentado apenas por volume, uso excessivo de desconto, ticket maior com perda de recorrencia ou margem estimada pressionada.

### Fidelizar Clientes

- **Objetivo estrategico:** aumentar recompra e relacionamento com clientes existentes.
- **Metricas principais:** clientes recorrentes, recompra, pedidos por cliente, avaliacoes.
- **Metricas auxiliares:** pontos gerados/usados, cupons, ticket medio de recorrentes, intervalo entre compras.
- **Dados usados:** `orders.customerId`, telefone normalizado quando disponivel, `store_customers`, `points_movements`, `reviews`, dados de cupom/desconto em pedidos.
- **Bom desempenho:** aumento de clientes com mais de um pedido no periodo, reducao do intervalo de recompra, recorrentes mantendo ou elevando ticket medio e avaliacoes estaveis ou melhores.
- **Risco:** muitos pedidos de clientes unicos sem retorno, queda na recompra, clientes recorrentes reduzindo ticket, uso de desconto sem retorno futuro ou avaliacoes negativas de clientes ativos.

### Melhorar Consistência

- **Objetivo estrategico:** reduzir oscilacoes operacionais e tornar vendas, atendimento e desempenho mais previsiveis ao longo do periodo.
- **Metricas principais:** distribuicao de pedidos por dia, dias fortes/fracos, horarios fortes, faturamento diario, avaliacoes.
- **Metricas auxiliares:** ticket medio diario, produtos vendidos por dia, status/cancelamentos quando confiaveis, ritmo versus meta.
- **Dados usados:** `orders`, datas normalizadas do pedido, `orders.status`, `orders.total`, `orders.items`, `reviews`, cenarios do Plano de Voo quando existirem.
- **Bom desempenho:** menor variacao entre dias comparaveis, manutencao de ritmo semanal, melhora dos dias fracos sem prejudicar dias fortes e estabilidade de avaliacoes.
- **Risco:** forte dependencia de poucos dias, queda recorrente em dias fracos, horarios importantes sem pedidos, crescimento instavel ou piora operacional indicada por avaliacoes.

## 3. Duração

A V1 deve permitir somente duas durações:

- **Sprint:** 30 dias.
- **Temporada:** 90 dias.

A duração define o intervalo de leitura, a quantidade de snapshots esperados e o tipo de diagnóstico final. Períodos customizados ficam fora da V1 para preservar comparabilidade e reduzir complexidade de cálculo.

## 4. Dificuldade

A V1 deve oferecer três níveis de dificuldade:

- **Seguro:** metas conservadoras, maior tolerância a oscilações e ritmo esperado mais gradual.
- **Equilibrado:** metas moderadas, tolerância intermediária e ritmo esperado proporcional ao histórico recente.
- **Agressivo:** metas mais altas, menor tolerância a risco e ritmo esperado mais intenso desde o início.

A dificuldade altera:

- **Meta calculada:** percentual ou valor-alvo aplicado sobre a linha base do objetivo.
- **Tolerância de risco:** quanto desvio é aceito antes de gerar alerta ou classificar instabilidade.
- **Ritmo esperado:** distribuição diária/semanal necessária para concluir a temporada com bom resultado.

## 5. Builds operacionais

A V1 deve incluir somente as seguintes builds:

- **Volume:** prioriza pedidos, faturamento, produtos vendidos, dias fortes/fracos e horários fortes.
- **Margem:** prioriza ticket médio, margem estimada, lucro operacional estimado, descontos, cupons e mix de produtos.
- **Fidelização:** prioriza clientes recorrentes, recompra, pontos, avaliações e comportamento de clientes ativos.

A build nao muda o sistema inteiro e nao altera as regras operacionais da loja. Ela apenas ajusta o peso dos indicadores, a prioridade dos alertas e a interpretacao dos resultados dentro da temporada.

## 6. Regras de criação

- A usuária cria a temporada uma única vez.
- Depois de iniciada, a temporada não pode ser editada.
- A temporada pode ser abandonada, mas não alterada.
- Só pode existir uma temporada ativa por tenant.
- A usuária pode escolher data de início futura para deixar uma temporada como programada.
- Pode existir mais de uma temporada programada, desde que os períodos não se sobreponham com outra programada ou ativa.
- Temporadas programadas não geram análises, snapshots ou IA até virarem ativas.
- A temporada sempre pertence a um tenant e deve respeitar isolamento por `tenantId`.
- A temporada usa dados gerados automaticamente pelo sistema.
- A usuária não marca tarefas manualmente.
- A usuária não informa desempenho manualmente.
- A temporada deve armazenar a configuracao inicial usada no momento da criacao para preservar historico e auditabilidade.

## 7. Métricas por nível de confiança

### Alta confiança

Metricas que podem ser usadas como base principal da V1:

- Pedidos.
- Faturamento.
- Ticket medio.
- Produtos vendidos.
- Dias fortes/fracos.
- Horarios fortes.
- Clientes recorrentes.
- Recompra.
- Avaliacoes.

Essas metricas devem vir principalmente de `orders`, `orders.items`, `store_customers`, identificadores/telefone de cliente e `reviews`.

### Média confiança

Metricas que podem apoiar analises, mas devem ser apresentadas como estimativas ou sinais auxiliares:

- Margem estimada.
- Lucro operacional estimado.
- Cupons.
- Upsell.
- Compras por fornecedor.

Essas metricas dependem de padronizacao adicional, deduplicacao ou completude variavel dos dados, especialmente em financeiro, marketing e custos.

### Baixa confiança

Metricas que nao devem ser usadas como base de decisao na V1:

- Estoque real.
- Desperdicio real.
- Capacidade real de producao.
- Custo exato por venda.

Esses dados nao estao suficientemente consolidados hoje para sustentar metas, alertas ou resultado final automatico.

## 8. Atualização das análises

- **Numeros simples:** podem atualizar em tempo real ou sempre que a tela abrir. Exemplos: pedidos, faturamento, ticket medio e progresso percentual.
- **Snapshot diario:** deve gerar uma leitura curta do dia, com ritmo, principais sinais e alertas simples.
- **Snapshot semanal:** deve gerar diagnostico estrategico, comparando evolucao, tendencia, riscos e oportunidades da semana.
- **Resultado final:** deve ser calculado ao encerrar a temporada, usando todo o periodo e os snapshots disponiveis.

Os snapshots evitam recalculos pesados em telas e preservam o historico interpretativo da temporada.

## 9. Resultado final da temporada

A temporada deve terminar com uma das seguintes classificações:

- **Vitória Total:** meta principal atingida ou superada, sem risco operacional relevante nos indicadores de apoio.
- **Vitória Parcial:** parte relevante da meta foi atingida, mas houve algum desvio, instabilidade ou indicador auxiliar negativo.
- **Temporada Instável:** houve sinais positivos, mas com oscilação alta, risco recorrente ou desempenho sem consistência suficiente.
- **Falha Operacional:** meta principal ficou distante do esperado ou os indicadores centrais mostraram queda relevante durante o periodo.

A classificacao final deve considerar objetivo, dificuldade, build, ritmo esperado, metricas principais e alertas registrados nos snapshots.

## 10. Modelo de dados inicial sugerido

Este modelo e apenas uma proposta inicial para orientar a implementacao futura. Nenhuma colecao deve ser criada nesta fase de documentacao.

### `seasons`

Colecao sugerida por tenant: `tenants/{tenantId}/seasons/{seasonId}`.

Campos sugeridos:

- `tenantId`: identificador do tenant.
- `title`: nome da temporada.
- `objective`: `sell_more`, `increase_ticket`, `retain_customers` ou `improve_consistency`.
- `durationType`: `sprint` ou `season`.
- `durationDays`: `30` ou `90`.
- `difficulty`: `safe`, `balanced` ou `aggressive`.
- `build`: `volume`, `margin` ou `retention`.
- `status`: `draft`, `scheduled`, `active`, `finished`, `abandoned`.
- `startDate`: data/hora de inicio.
- `endDate`: data/hora prevista de encerramento.
- `startedAt`: data/hora em que a temporada ficou ativa, quando houver.
- `finishedAt`: data/hora de encerramento real, quando houver.
- `abandonedAt`: data/hora de abandono, quando houver.
- `baseline`: linha base calculada no momento da criacao.
- `targets`: metas calculadas para as metricas principais.
- `riskTolerance`: parametros de tolerancia derivados da dificuldade.
- `weights`: pesos dos indicadores derivados da build.
- `createdAt`: data/hora de criacao.
- `createdBy`: usuario responsavel pela criacao.
- `updatedAt`: data/hora da ultima atualizacao tecnica.

Observacoes:

- A configuracao operacional da temporada deve ser congelada ao iniciar.
- Uma temporada ativa nao deve permitir edicao de `objective`, `durationType`, `difficulty` ou `build`.
- Deve existir validacao para impedir mais de uma temporada ativa por tenant.

### `season_metrics_snapshots`

Colecao sugerida por tenant: `tenants/{tenantId}/season_metrics_snapshots/{snapshotId}`.

Campos sugeridos:

- `tenantId`: identificador do tenant.
- `seasonId`: referencia logica da temporada.
- `snapshotType`: `daily`, `weekly` ou `final`.
- `periodStart`: inicio do periodo analisado.
- `periodEnd`: fim do periodo analisado.
- `ordersCount`: total de pedidos validos.
- `revenueTotal`: faturamento do periodo.
- `averageTicket`: ticket medio.
- `productsSold`: total de produtos vendidos.
- `strongDays`: dias com melhor desempenho.
- `weakDays`: dias com pior desempenho.
- `strongHours`: horarios com maior concentracao de pedidos.
- `recurringCustomers`: clientes recorrentes.
- `repurchaseRate`: taxa estimada de recompra.
- `reviewsCount`: total de avaliacoes.
- `averageRating`: nota media.
- `estimatedMargin`: margem estimada, quando calculavel.
- `estimatedOperationalProfit`: lucro operacional estimado, quando calculavel.
- `couponUsage`: leitura auxiliar de cupons, quando confiavel.
- `upsellSignals`: leitura auxiliar de upsell, quando confiavel.
- `supplierPurchases`: compras por fornecedor, quando relevante para a build.
- `confidence`: mapa por metrica indicando `high`, `medium` ou `low`.
- `alerts`: alertas gerados no periodo.
- `summary`: leitura curta textual para a usuaria.
- `createdAt`: data/hora de criacao do snapshot.

Observacoes:

- Snapshots devem armazenar numeros consolidados, nao substituir as fontes originais.
- O calculo deve excluir pedidos cancelados ou status equivalentes.
- Campos de margem, lucro, cupons, upsell e fornecedores devem ser opcionais na V1.

## 11. Fora do escopo da V1

A V1 não deve incluir:

- Estoque automático.
- Desperdício real.
- Capacidade produtiva avançada.
- IA complexa.
- Múltiplas temporadas ativas.
- Tarefas manuais.
- Edição de temporada iniciada.
- Metas preenchidas manualmente pela usuária como fonte de desempenho.
- Períodos customizados.
- Ranking entre tenants ou comparação entre lojas.

## Referencias tecnicas consideradas

- `DATA_MAP_FOR_SEASONS.md`.
- Modulos atuais de pedidos, clientes, dashboard, financeiro, compras, marketing, avaliacoes, performance e Plano de Voo descritos no mapa de dados.
- Regra multi-tenant descrita em `AGENTS.md`: todas as leituras e escritas futuras devem respeitar `tenantId` ou `lojaId` selecionado.
