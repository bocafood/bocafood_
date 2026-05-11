# Sistema de Pontuação e Cálculo das Temporadas

## 1. Objetivo do sistema de scoring

O sistema de scoring define o cérebro lógico das **Temporadas / Missões Operacionais** do BocaFood. Temporadas são acompanhadas automaticamente pelo sistema a partir dos dados reais que a loja gera no uso diário.

A usuária não alimenta manualmente desempenho, não marca tarefas e não informa progresso subjetivo. O BocaFood interpreta dados operacionais, calcula progresso, identifica risco, mede evolução e determina o resultado final da temporada.

O scoring deve priorizar clareza e coerência, não complexidade excessiva. A V1 deve usar métricas compreensíveis, pesos explícitos e regras auditáveis, evitando depender de dados que ainda não existem ou que têm baixa confiança operacional.

## 2. Tipos de meta

### Meta automática

Na meta automática, o sistema calcula a meta com base no histórico da loja. A linha base deve usar:

- Últimos 30 dias, quando a duração escolhida for **Sprint: 30 dias**.
- Últimos 90 dias, quando a duração escolhida for **Temporada: 90 dias**.

O percentual de crescimento aplicado sobre o histórico depende do objetivo e da dificuldade escolhida. A meta automática deve ser calculada no início da temporada e congelada para preservar consistência histórica.

### Meta fixa

Na meta fixa, a usuária define a meta manualmente. Mesmo assim, o sistema continua calculando automaticamente progresso, risco e evolução com base nos dados operacionais reais.

Quando a meta for fixa, o sistema deve comparar a meta informada com a média histórica da loja e calcular o nível de risco da meta. Metas muito acima da média histórica devem gerar alerta antes da temporada iniciar.

| Crescimento vs histórico | Nível de risco |
|---|---|
| até +15% | baixo |
| +16% até +35% | médio |
| +36% até +60% | alto |
| acima de +60% | muito alto |

## 3. Objetivos da V1

A V1 do scoring deve considerar somente estes objetivos:

- Vender Mais.
- Aumentar Ticket.
- Fidelizar Clientes.
- Melhorar Consistência.

## 4. Matriz de métricas por objetivo

O progresso geral de cada objetivo deve ser calculado pela soma ponderada das métricas principais. Métricas auxiliares não devem substituir as principais; elas ajudam a explicar risco, evolução e contexto.

------------------------------------------------

## 🔥 Vender Mais

### Objetivo estratégico

Aumentar o volume de vendas e o faturamento dentro do período da temporada, sem depender de preenchimento manual.

### Métricas principais

- faturamento → 45%
- pedidos → 35%
- dias com venda → 20%

### Métricas auxiliares

- ticket médio
- horários fortes
- produtos mais vendidos
- promoções usadas
- canais de venda

### Dados utilizados

- orders
- performance
- dashboard
- flight_plan_month_scenarios

### Meta automática

Seguro → +10%  
Equilibrado → +20%  
Agressivo → +35%

### Como calcular progresso

Calcular o progresso de cada métrica principal contra sua meta individual e aplicar o peso correspondente:

- `progresso_faturamento * 45%`
- `progresso_pedidos * 35%`
- `progresso_dias_com_venda * 20%`

O progresso final deve ser limitado a uma leitura simples de 0% a 100% para status e resultado, mesmo que internamente alguma métrica ultrapasse a meta.

### Risco

- faturamento abaixo do ritmo esperado
- queda de pedidos
- muitos dias sem venda
- dependência de poucos dias fortes

### Como identificar risco

Comparar o realizado acumulado com o ritmo esperado até a data atual. O risco aumenta quando o faturamento ou os pedidos ficam abaixo do ritmo, quando há vários dias sem venda ou quando a maior parte do resultado depende de poucos dias isolados.

### Evolução positiva

- crescimento semanal
- aumento de frequência
- aumento de dias ativos

### Como identificar evolução positiva

Comparar a semana atual com a semana anterior e com a linha base histórica. Há evolução positiva quando faturamento, pedidos ou dias ativos crescem de forma consistente, sem piora relevante em ticket ou avaliações.

### Vitória

- meta atingida
ou
- pelo menos 85% da meta com crescimento consistente

### Como definir vitória

Vitória ocorre quando o progresso final chega a 100% ou quando atinge pelo menos 85% com evolução semanal consistente e sem risco crítico no encerramento.

------------------------------------------------

## 💰 Aumentar Ticket

### Objetivo estratégico

Elevar o valor médio por pedido, melhorando a composição das vendas sem depender apenas de aumento de volume.

### Métricas principais

- ticket médio → 50%
- valor médio por pedido → 25%
- adicionais/combos/upsell → 25%

### Métricas auxiliares

- produtos premium
- cupons
- descontos
- itens por pedido

### Dados utilizados

- orders
- products
- promotions
- coupons
- upsellRules
- upsellEvents

### Meta automática

Seguro → +5%  
Equilibrado → +10%  
Agressivo → +18%

### Como calcular progresso

Calcular a evolução do ticket médio, do valor médio por pedido e dos sinais de adicionais/combos/upsell contra suas metas. Aplicar os pesos:

- `progresso_ticket_medio * 50%`
- `progresso_valor_medio_pedido * 25%`
- `progresso_adicionais_combos_upsell * 25%`

Quando dados de upsell estiverem incompletos, tratar a métrica como sinal de confiança média e explicar a limitação no snapshot.

### Risco

- ticket caindo
- excesso de desconto
- muitos pedidos baixos

### Como identificar risco

O risco aumenta quando o ticket médio cai contra a linha base, quando descontos ou cupons sustentam o faturamento sem elevar valor real por pedido, ou quando há concentração de pedidos abaixo do ticket esperado.

### Evolução positiva

- crescimento do ticket
- aumento de itens por pedido
- maior uso de adicionais

### Como identificar evolução positiva

Há evolução positiva quando o ticket médio cresce por semana, os pedidos passam a carregar mais itens ou adicionais e o aumento não depende exclusivamente de desconto.

### Vitória

- meta atingida
ou
- ticket crescendo consistentemente por pelo menos 2 semanas

### Como definir vitória

Vitória ocorre quando a meta ponderada é atingida ou quando o ticket cresce de forma consistente por pelo menos duas semanas, mesmo que o fechamento fique ligeiramente abaixo da meta.

------------------------------------------------

## 🔁 Fidelizar Clientes

### Objetivo estratégico

Aumentar recompra, recorrência e frequência de clientes, fortalecendo a base ativa da loja.

### Métricas principais

- clientes recorrentes → 45%
- recompra → 35%
- frequência média → 20%

### Métricas auxiliares

- avaliações
- pontos
- ticket recorrente
- clientes novos

### Dados utilizados

- store_customers
- orders
- points_movements
- reviews

### Meta automática

Seguro → +5%  
Equilibrado → +12%  
Agressivo → +20%

### Como calcular progresso

Agrupar pedidos por `customerId` ou telefone normalizado quando necessário. Calcular clientes com mais de um pedido, taxa de recompra e frequência média no período. Aplicar os pesos:

- `progresso_clientes_recorrentes * 45%`
- `progresso_recompra * 35%`
- `progresso_frequencia_media * 20%`

### Risco

- clientes comprando apenas 1 vez
- queda na recompra
- dependência excessiva de novos clientes

### Como identificar risco

O risco aumenta quando a maioria dos clientes compra apenas uma vez, quando a recompra cai contra o histórico ou quando o crescimento depende de novos clientes sem retorno posterior.

### Evolução positiva

- aumento de recompra
- crescimento de clientes recorrentes
- aumento de frequência

### Como identificar evolução positiva

Há evolução positiva quando mais clientes fazem um segundo pedido, a frequência média melhora e avaliações ou pontos indicam relacionamento ativo.

### Vitória

- meta atingida
ou
- melhora consistente na recorrência

### Como definir vitória

Vitória ocorre quando a meta ponderada é atingida ou quando há melhora consistente de recorrência durante a temporada, especialmente se clientes recorrentes mantêm ou elevam o ticket.

------------------------------------------------

## ⚡ Melhorar Consistência

### Objetivo estratégico

Reduzir oscilações operacionais e tornar vendas, frequência e ritmo semanal mais previsíveis.

### Métricas principais

- dias com venda → 40%
- regularidade semanal → 35%
- redução de dias fracos → 25%

### Métricas auxiliares

- horários mortos
- pedidos por dia
- variação semanal

### Dados utilizados

- orders
- performance
- dashboard

### Meta automática

Seguro → +1 dia ativo  
Equilibrado → +2 dias ativos  
Agressivo → +3 dias ativos

### Como calcular progresso

Calcular aumento de dias com venda, melhora na regularidade semanal e redução de dias fracos contra a linha base. Aplicar os pesos:

- `progresso_dias_com_venda * 40%`
- `progresso_regularidade_semanal * 35%`
- `progresso_reducao_dias_fracos * 25%`

Para este objetivo, estabilidade vale mais do que picos isolados. Um dia de venda muito forte não deve compensar sozinho muitos dias sem pedido.

### Risco

- muitos dias sem pedido
- vendas concentradas
- semanas inconsistentes

### Como identificar risco

O risco aumenta quando há muitos dias sem pedido, quando a maior parte das vendas se concentra em poucos dias ou quando as semanas variam muito entre si.

### Evolução positiva

- mais dias ativos
- menor variação entre semanas
- ritmo mais estável

### Como identificar evolução positiva

Há evolução positiva quando a loja aumenta dias ativos, reduz dias fracos e mantém ritmo mais uniforme entre semanas.

### Vitória

- meta atingida
ou
- estabilidade operacional claramente melhor

### Como definir vitória

Vitória ocorre quando a meta de dias ativos ou regularidade é atingida, ou quando a estabilidade operacional melhora claramente mesmo sem crescimento expressivo de faturamento.

## 5. Builds operacionais

As builds operacionais ajustam a interpretação dos dados dentro da temporada. Elas não alteram o sistema inteiro, não mudam regras globais e não criam outra lógica de negócio fora do módulo de Temporadas.

### ⚡ Volume

Priorizar:

- pedidos
- frequência
- dias ativos

Esta build aumenta a importância de volume, ritmo, dias com venda e resposta rápida a queda de pedidos.

### 💎 Margem

Priorizar:

- ticket
- valor por pedido
- produtos premium
- margem estimada

Esta build favorece leitura de ticket, mix de produtos, uso de descontos e margem estimada. Como margem ainda tem confiança média, o sistema deve sinalizar quando a análise for estimativa.

### 🔁 Fidelização

Priorizar:

- recompra
- clientes recorrentes
- frequência
- pontos/avaliações

Esta build favorece recorrência, relação com clientes ativos, pontos e avaliações como sinais de qualidade da base.

Builds apenas mudam o peso da interpretação dos dados, a prioridade dos alertas e a forma de explicar o resultado. Elas não devem alterar cadastros, pedidos, financeiro, marketing ou qualquer operação fora da temporada.

## 6. Sistema de status da temporada

### Excelente

Acima do ritmo esperado. A temporada está avançando melhor que a meta proporcional para o momento atual e não apresenta risco relevante.

### Estável

Dentro do esperado. A temporada acompanha o ritmo necessário para atingir a meta ou está levemente abaixo, mas com evolução suficiente.

### Instável

Oscilações ou perda de consistência. Há sinais positivos, mas o resultado depende de poucos dias, há queda recente ou métricas principais alternam entre avanço e recuo.

### Crítico

Risco alto de falha da temporada. O progresso está muito abaixo do ritmo esperado, os alertas são recorrentes ou não há evolução consistente nas métricas centrais.

## 7. Resultado final

### Vitória Total

Meta atingida.

### Vitória Parcial

75%–99% da meta com evolução relevante.

### Temporada Instável

Houve crescimento parcial, mas sem estabilidade.

### Falha Operacional

Abaixo de 75% da meta e sem evolução consistente.

O resultado final deve considerar progresso ponderado, risco acumulado, evolução semanal e confiabilidade dos dados usados. Métricas de baixa confiança não devem determinar vitória ou falha na V1.

## 8. Atualização das análises

### Tempo real

- faturamento
- pedidos
- ticket
- progresso

Números simples podem atualizar em tempo real ou quando a tela abrir.

### Snapshot diário

- leitura curta
- alertas rápidos

O snapshot diário deve registrar ritmo, principais desvios e alertas simples do dia.

### Snapshot semanal

- tendência
- risco
- evolução estratégica

O snapshot semanal deve comparar semanas, identificar evolução ou perda de consistência e explicar riscos com mais contexto.

### Encerramento final

- resumo da temporada
- pontos fortes
- pontos críticos
- recomendação futura

O encerramento final consolida o período completo e gera a classificação final da temporada.

## 9. Fora do escopo da V1

Não incluir:

- estoque automático
- desperdício real
- IA avançada
- previsão comportamental complexa
- múltiplas temporadas simultâneas
- tarefas manuais
- gamificação infantil

## Referências técnicas

- `DATA_MAP_FOR_SEASONS.md`
- `SEASONS_SPEC.md`
- Regra multi-tenant do `AGENTS.md`: leituras e escritas futuras devem respeitar o tenant ativo.
