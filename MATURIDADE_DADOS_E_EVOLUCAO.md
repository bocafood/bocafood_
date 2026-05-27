# Maturidade do Negócio — Dados e evolução

## Objetivo

A Maturidade do Negócio deve mostrar a evolução real do negócio de comida, sem depender de opinião ou de IA para calcular score.

Ela deve usar dados auditáveis do BocaFood para responder:

- o negócio está vendendo com mais consistência?
- está crescendo com controle?
- está executando as temporadas?
- está fidelizando clientes?
- está financeiramente mais saudável?
- está usando ações de venda que trazem resultado real?
- existe algo na operação limitando a evolução?

## Regra principal

A Maturidade não deve dar ponto por cadastro isolado.

Exemplos:

- promoção cadastrada não pontua sozinha;
- cupom criado não pontua sozinho;
- upsell configurado não pontua sozinho;
- programa de pontos ativo não pontua sozinho;
- estoque configurado não pontua sozinho.

O que pode contar é resultado real:

- pedido com cupom;
- pedido com promoção;
- pedido com upsell aceito;
- cliente que voltou;
- pontos usados em recompra;
- venda com margem saudável;
- temporada finalizada;
- redução de risco;
- evolução de consistência.

Importante sobre uso do sistema:

- a Maturidade mede a maturidade do negócio, não o volume de uso do BocaFood;
- usar o sistema é meio para gerar dados, execução e controle;
- cadastro, configuração ou temporada sem resultado claro não devem acelerar a Pedra;
- temporada só fortalece a Maturidade quando termina com resultado operacional reconhecível, aprendizado ou impacto real;
- finalizar uma temporada sem resultado claro preserva histórico, mas não deve contar como avanço de maturidade.
- os Marcos da Pedra seguem a mesma regra: quando um marco depende de Temporadas, ele deve considerar temporadas concluídas com resultado, não apenas temporadas finalizadas.

## Dados que já existem e devem alimentar a Maturidade

### Pedidos

Coleção: `orders`

Usos:

- faturamento;
- volume de pedidos;
- ticket médio;
- dias com venda;
- semanas com venda;
- canais de venda;
- clientes recorrentes;
- itens vendidos;
- promoção/cupom/upsell/pontos presentes no pedido.

### Clientes

Coleção: `store_customers`

Usos:

- quantidade de clientes identificados;
- recorrência;
- dados complementares de recompra;
- base de fidelização.

### Plano de Voo

Coleções:

- `flight_plans`
- `flight_plan_month_scenarios`

Usos:

- cenário escolhido;
- contexto de crescimento;
- meta mensal/anual como direção do negócio.

### Temporadas

Coleções:

- `seasons`
- `season_metrics_snapshots`

Usos:

- temporadas concluídas;
- temporadas abandonadas;
- resultado final;
- score final;
- risco final;
- dificuldade;
- impacto validado;
- próximas jogadas executadas;
- aprendizado operacional.

### Financeiro

Coleções:

- `movimentacoes`
- `financeiro_entradas`
- `financeiro_saidas`
- `financeiro_apagar`
- `contas_pagar`

Usos desejados:

- entradas reais;
- saídas reais;
- saldo líquido;
- margem operacional;
- contas pendentes;
- contas vencidas;
- saúde do caixa.

Na primeira conexão, financeiro entra como sinal consolidado em `dataSignals.finance`.

### Marketing e ações de venda

Coleções:

- `promotions`
- `promocoes`
- `coupons`
- `upsellRules`

Usos desejados:

- ações ativas;
- pedidos que usaram cupom;
- pedidos que usaram promoção;
- pedidos com upsell aceito;
- desconto total;
- receita gerada;
- sinal de desconto saudável ou dependência de desconto.

Na primeira conexão, marketing entra como sinal consolidado em `dataSignals.marketing`.

### Programa de pontos

Coleção:

- `points_movements`

Usos desejados:

- pontos gerados;
- pontos resgatados;
- clientes com movimento de pontos;
- recompra apoiada por pontos.

Na primeira conexão, pontos entram como `dataSignals.loyaltyProgram`.

### Avaliações

Coleção:

- `reviews`

Usos desejados:

- média de avaliação;
- quantidade de avaliações aprovadas;
- produtos citados;
- confiança social.

Na primeira conexão, avaliações entram como `dataSignals.reviews`.

### Estoque, produção e compras

Coleções:

- `stock_movements`
- `production_orders`
- `compras`

Usos desejados:

- produtos/insumos com movimentação;
- produção planejada/concluída;
- compras registradas;
- sinal de controle operacional.

Na primeira conexão, esses dados entram como `dataSignals.operations`.

## Como deve evoluir

### Fase 1 — Conectar dados

Criar `dataSignals` dentro de `business_maturity/current` e nos snapshots de maturidade.

Sem mudar drasticamente score.

### Fase 2 — Explicar dados usados

Mostrar na tela da Maturidade quais dados já estão sendo considerados e quais ainda são sinais leves.

Status: implementada na tela de Maturidade com o bloco "O que o BocaFood já considera na sua Pedra".

O bloco separa:

- base forte;
- dados que já ajudam a leitura;
- contexto inicial;
- áreas aguardando dados.

A intenção é explicar a leitura para a usuária sem expor nomes técnicos, índices internos ou estrutura de Firestore.

### Fase 3 — Financeiro real

Substituir a leitura básica de saúde financeira por dados reais de:

- entradas;
- saídas;
- margem;
- contas vencidas;
- saldo.

Status: implementada como peso moderado na Maturidade.

A leitura financeira considera:

- dinheiro recebido recentemente;
- dinheiro pago recentemente;
- saldo recente;
- margem aproximada;
- contas pendentes;
- contas vencidas;
- quantidade de lançamentos disponíveis para medir confiança.

Regra de segurança:

- financeiro positivo ajuda a Pedra, mas não domina o score;
- contas vencidas reduzem a leitura de saúde financeira;
- se ainda não houver financeiro suficiente, pedidos e ticket continuam apenas como sinal leve;
- lançamentos cancelados ou estornados não entram na leitura;
- contas pagas não entram como pendência.

### Fase 4 — Ações de venda com resultado

Usar promoção, cupom e upsell somente quando aparecerem em pedido real.

Status: implementada como leitura de impacto validado em pedidos.

A Maturidade separa:

- ações cadastradas;
- ações realmente usadas em pedidos válidos;
- venda bruta ligada às ações;
- desconto concedido;
- venda líquida após desconto;
- upsell aceito;
- sinal de desconto pesado.

Regra de segurança:

- cupom, promoção ou upsell cadastrado não melhora a Pedra sozinho;
- ação cadastrada sem venda aparece apenas como contexto inicial;
- ação usada em pedido real pode ajudar crescimento saudável;
- desconto alto pode limitar a leitura mesmo quando houve venda;
- upsell aceito em pedido real ajuda mais do que uma regra de upsell apenas cadastrada.

### Fase 5 — Fidelização e avaliações

Usar pontos, recompra e avaliações como sinal de confiança e recorrência.

Status: implementada como leitura de relacionamento real.

A Maturidade separa:

- cliente cadastrado;
- cliente que voltou a comprar;
- pontos apenas gerados;
- pontos resgatados em pedido real;
- recompra apoiada por pontos;
- avaliações aprovadas;
- nota média;
- avaliações que citam produto;
- avaliações baixas que pedem atenção.

Regra de segurança:

- cliente cadastrado sem recompra não melhora a Pedra sozinho;
- ponto gerado sem resgate é sinal inicial, não fidelização comprovada;
- ponto usado em pedido real ajuda a leitura de fidelização;
- avaliação aprovada ajuda confiança;
- avaliação citando produto fortalece a leitura comercial;
- avaliações baixas reduzem a confiança até o negócio melhorar a experiência.

### Fase 6 — Operação como limitador

Usar estoque, produção e compras como contexto/limitador, sem virar peso forte antes de validar a consistência dos dados.

Status: implementada como apoio e limitador operacional.

A Maturidade considera:

- movimentações de estoque;
- entradas de estoque;
- saídas de estoque;
- ordens de produção planejadas;
- ordens de produção concluídas;
- compras registradas;
- compras recebidas/concluídas;
- histórico suficiente ou insuficiente de operação.

Regra de segurança:

- operação não vira peso forte nesta fase;
- produção, compras e estoque podem apoiar execução quando há rotina registrada;
- operação com pouco histórico reduz a confiança e pode limitar risco/execução;
- estoque, compras ou produção cadastrados sem rotina consistente não aceleram a Pedra;
- a operação ajuda mais como sustentação do negócio do que como prêmio isolado.

## Cuidados

- IA não calcula score.
- Histórico finalizado não deve ser recalculado sem snapshot.
- Dados financeiros, estoque, compras e marketing entram primeiro como contexto.
- Score e evolução de Pedra precisam continuar auditáveis.
- Se o dado não tiver confiança suficiente, deve aparecer como sinal leve ou limitação, não como avanço forte.

## Camada de Histórico do Negócio

### Fase 1 — Agregador de histórico

Status: implementada como camada de cálculo, sem alterar a régua da Pedra.

A camada `businessHistory` consolida:

- últimos 30 dias;
- 30 dias anteriores;
- últimos 90 dias;
- últimos 180 dias;
- últimos 365 dias;
- últimos 12 meses em visão mensal;
- mesmo mês do ano anterior, quando existir.

Cada período calcula:

- faturamento;
- quantidade de pedidos;
- ticket médio;
- dias com venda;
- semanas com venda;
- clientes recorrentes;
- taxa de recompra;
- produtos mais fortes;
- canais mais fortes;
- descontos;
- pedidos com cupom, promoção e upsell;
- entradas financeiras;
- saídas financeiras;
- saldo financeiro;
- margem financeira aproximada;
- média de avaliações;
- produções concluídas;
- movimentações de estoque.

Regra de segurança:

- essa camada ainda não muda score, Pedra ou Marcos;
- serve como base preparada para as próximas fases;
- a régua atual continua funcionando quando não houver histórico suficiente;
- histórico de 12 meses só será usado como base forte quando houver meses suficientes.

### Fase 2 — Snapshots mensais e janelas móveis

Status: implementada como persistência histórica, sem alterar a régua da Pedra.

A coleção usada é:

- `tenants/{tenantId}/business_history_snapshots`

Tipos de snapshot:

- `monthly`: guarda o fechamento mensal calculado pela camada `businessHistory`;
- `rolling`: guarda janelas móveis de leitura do negócio.

Janelas móveis salvas:

- últimos 30 dias;
- 30 dias anteriores;
- últimos 90 dias;
- últimos 180 dias;
- últimos 365 dias.

Campos principais:

- `snapshotType`;
- `periodKey`;
- `windowKey`;
- `monthKey`;
- `periodStart`;
- `periodEnd`;
- `metrics`;
- `calculationVersion`;
- `source`;
- `createdAt`;
- `updatedAt`.

Regra de segurança:

- snapshots mensais usam ID determinístico, como `monthly_2026-05`;
- snapshots de janelas móveis usam ID determinístico com a janela e a data final, como `rolling_rolling_90_2026-05-27`;
- o mês atual pode ser atualizado enquanto ainda está em andamento;
- meses anteriores, quando já existem, não são regravados;
- janelas móveis podem ser atualizadas ao recalcular a Maturidade;
- nenhum snapshot altera score, Pedra ou Marcos nesta fase.

Objetivo:

- preservar uma memória histórica do negócio;
- evitar que leituras antigas dependam apenas do estado atual dos pedidos;
- preparar comparações futuras por mês, tendência e evolução real;
- permitir que a Maturidade use histórico com mais confiança nas próximas fases.

### Fase 3 — Histórico usado na leitura

Status: implementada como exposição visual do histórico, sem alterar a régua da Pedra.

Na tela de Maturidade, o bloco `Histórico usado na leitura` mostra:

- últimos 30 dias;
- comparação com os 30 dias anteriores;
- últimos 90 dias;
- mês atual;
- memória anual disponível;
- existência ou não de comparação com o mesmo mês do ano anterior;
- quantidade de snapshots históricos preservados.

Regra de segurança:

- o bloco apenas mostra a memória já calculada;
- não altera score;
- não altera Pedra;
- não altera Marcos;
- não substitui a régua atual;
- ajuda a usuária a entender se a leitura já tem base histórica suficiente ou se ainda está em formação.

Objetivo:

- deixar a Maturidade mais transparente;
- mostrar quando o sistema está lendo tendência recente ou histórico maior;
- preparar a usuária para confiar mais na leitura conforme o negócio acumula meses reais de movimento.

### Fase 4 — Comparação histórica na régua

Status: implementada parcialmente na régua da Pedra, com fallback para negócios sem histórico.

Partes da régua que passaram a usar histórico quando existe base suficiente:

- crescimento saudável;
- consistência;
- saúde financeira;
- fidelização.

Como funciona:

- quando existem últimos 30 dias e 30 dias anteriores, o crescimento compara venda, quantidade de pedidos e ticket médio entre esses períodos;
- quando existem últimos 90 dias, a consistência usa dias e semanas com venda nesse período, além da comparação de dias ativos contra os 30 dias anteriores;
- quando há financeiro nos últimos 90 dias, a saúde financeira passa a considerar entrada, saída, saldo e margem aproximada desse histórico;
- quando há recompra nos últimos 90 dias, a fidelização passa a considerar clientes recorrentes e taxa de recompra desse período;
- quando não há histórico suficiente, a régua antiga continua ativa como fallback.

Regra de segurança:

- a comparação histórica não substitui tudo de uma vez;
- score, Pedra e Marcos continuam auditáveis;
- negócio novo não é punido por ainda não ter histórico;
- ação cadastrada sem venda continua sem acelerar a Pedra;
- uso do sistema continua sendo meio, não o objetivo da Maturidade.

Objetivo:

- reduzir dependência de números fixos iguais para todos os negócios;
- fazer a Pedra medir evolução do negócio contra ele mesmo;
- preparar a próxima fase para ajustar Marcos e limites usando histórico real.

### Fase 5 — Sazonalidade com 12 meses completos

Status: implementada como camada sazonal acima da comparação recente, apenas quando há base anual.

Quando existe histórico anual completo e comparação com o mesmo mês do ano anterior, a régua passa a considerar sazonalidade em:

- crescimento saudável;
- consistência;
- saúde financeira;
- fidelização.

Como funciona:

- o mês atual é projetado de acordo com o andamento do mês;
- a projeção do mês atual é comparada com o mesmo mês do ano anterior;
- crescimento compara venda, pedidos e ticket médio;
- consistência compara dias e semanas com venda;
- financeiro compara entradas, saídas e saldo;
- fidelização compara clientes recorrentes e taxa de recompra.

Regra de segurança:

- sazonalidade só entra quando há 12 meses fechados de base e `sameMonthLastYear`;
- mês em andamento é projetado para evitar punição indevida no começo do mês;
- sem sazonalidade suficiente, a régua volta para comparação dos últimos 30/90 dias;
- sem histórico recente suficiente, a régua antiga continua como fallback;
- score, Pedra e Marcos continuam auditáveis.

Objetivo:

- evitar comparar meses naturalmente diferentes como se fossem iguais;
- respeitar meses fortes e fracos do próprio negócio;
- medir evolução contra a realidade sazonal da comida vendida pela usuária.
