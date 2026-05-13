# Sistema de Cálculo e Evolução das Pedras

Data: 2026-05-13

Este documento define o sistema conceitual de cálculo, progresso, travas e evolução das Pedras do BocaFood. Ele não implementa código, não cria telas e não altera Temporadas, Plano de Voo, Performance, IA, snapshots, Firebase, rotas, permissões ou estrutura de dados.

## 1. Objetivo do sistema de cálculo

As Pedras representam maturidade acumulada do negócio. O cálculo deve analisar o histórico da loja, sua evolução contra o próprio passado e a qualidade dessa evolução.

O Sistema de Pedras deve premiar:

- evolução saudável;
- execução recorrente;
- consistência;
- crescimento sustentável;
- saúde do negócio;
- risco controlado;
- sobrevivência e organização em fases iniciais.

O sistema deve evitar premiar crescimento caótico. Faturamento bruto, volume de pedidos ou uma semana muito forte não podem destravar nível sozinhos.

As Pedras não devem comparar lojas entre si. Cada loja evolui contra o próprio histórico, respeitando seu estágio, cenário do Plano de Voo, capacidade operacional e confiabilidade dos dados disponíveis.

## 2. Estrutura geral da evolução

### Pedra Atual

A Pedra Atual representa o estágio acumulado de maturidade da loja. Ela é uma leitura histórica do negócio, não uma reação instantânea ao resultado da semana.

Ordem oficial:

1. Pedra Bruta
2. Quartzo
3. Ametista
4. Safira
5. Esmeralda
6. Rubi
7. Diamante
8. Ônix

### Evolução para Próxima Pedra

A evolução para a próxima Pedra representa progresso acumulado dentro do estágio atual.

A interface futura deve poder mostrar:

- progresso percentual de 0 a 100%;
- marcos automáticos atingidos;
- checklist automático;
- áreas fortes;
- áreas fracas;
- principais travas ou desacelerações.

O progresso deve ser gradual e auditável. O sistema precisa conseguir explicar por que a loja avançou, desacelerou ou ficou estável.

## 3. Índices principais

O Índice da Pedra é composto por seis índices oficiais. Os pesos abaixo são a referência conceitual para V1.

| Índice | Peso sugerido |
|---|---:|
| Consistência | 25% |
| Crescimento Saudável | 20% |
| Saúde Financeira | 20% |
| Risco Controlado | 15% |
| Fidelização | 10% |
| Execução | 10% |

### Índice de Crescimento Saudável

Peso sugerido: **20%**.

Analisa:

- evolução de faturamento;
- evolução de pedidos;
- ticket médio;
- metas atingidas;
- crescimento sustentável;
- aderência ao Plano de Voo;
- comparação do mês atual contra histórico da própria loja.

Crescimento sozinho não basta. O índice deve pontuar melhor quando a receita e os pedidos melhoram sem deteriorar consistência, risco, margem estimada ou caixa.

Exemplos negativos:

- crescimento com prejuízo;
- crescimento com risco extremo;
- crescimento sem consistência;
- crescimento dependente de desconto agressivo;
- crescimento concentrado em poucos dias;
- crescimento com temporadas abandonadas.

### Índice de Consistência

Peso sugerido: **25%**.

Analisa:

- dias com venda;
- regularidade semanal;
- baixa oscilação extrema;
- score médio de temporadas;
- estabilidade do ritmo;
- sequência de temporadas concluídas;
- redução de dependência de dias isolados.

Consistência pesa mais que faturamento bruto porque maturidade exige previsibilidade. Uma loja pequena, mas estável, pode demonstrar mais maturidade que uma loja grande e instável.

### Índice de Saúde Financeira

Peso sugerido: **20%**.

Analisa:

- lucro estimado;
- margem estimada;
- contas vencidas;
- contas a pagar;
- entradas e saídas;
- caixa/saldo quando confiável;
- estabilidade financeira;
- crescimento sem deterioração financeira.

Saúde financeira não deve ser usada como punição agressiva para negócios pequenos. Na V1, seu papel principal é impedir que crescimento ruim seja tratado como evolução saudável.

Exemplos:

- loja em Survival pode avançar mesmo com lucro baixo, se reduz risco e organiza o caixa;
- loja em Growth/Expansion não deve avançar forte se cresce com contas vencidas e margem piorando.

### Índice de Risco Controlado

Peso sugerido: **15%**.

Analisa:

- chance de falha das Temporadas;
- temporadas críticas;
- metas agressivas;
- risco inicial e final;
- dependência de poucos dias/produtos;
- crescimento caótico;
- alertas recorrentes em snapshots.

Crescimento com risco extremo deve desacelerar evolução. Este índice deve funcionar tanto como pontuação positiva quanto como trava de velocidade.

### Índice de Fidelização

Peso sugerido: **10%**.

Analisa:

- recompra;
- clientes recorrentes;
- frequência média;
- avaliações;
- reputação;
- pontos/fidelidade;
- uso real de pontos quando houver movimento salvo.

Fidelização não deve ser exigida com força excessiva nos níveis iniciais, mas passa a ter mais importância de Safira em diante.

### Índice de Execução

Peso sugerido: **10%**.

Analisa:

- temporadas concluídas;
- vitórias totais;
- vitórias parciais;
- abandono;
- disciplina operacional;
- sequência de execução;
- uso recorrente dos ciclos de foco.

Execução mede a capacidade da loja de planejar, acompanhar e concluir ciclos. Ela pesa mais que volume puro porque mostra disciplina operacional.

## 4. Sistema de pesos

Regras gerais:

- consistência pesa mais que faturamento bruto;
- execução pesa mais que volume puro;
- crescimento saudável pesa mais que crescimento agressivo sem controle;
- risco alto reduz velocidade de evolução;
- abandono reduz evolução;
- saúde financeira funciona como trava contra crescimento ruim;
- fidelização ganha mais importância nos níveis intermediários e altos.

Os pesos podem ser calibrados por Pedra, mas a soma oficial da V1 deve preservar a lógica acima. Uma loja não deve subir apenas porque vendeu mais; ela deve subir porque ficou mais madura.

## 5. Influência do Plano de Voo

O Plano de Voo influencia a leitura de dificuldade e contexto da evolução.

### Survival

Survival representa Meta de Sobrevivência.

Regras:

- crescimento lento não penaliza;
- foco em sobrevivência, organização e redução de risco;
- avanço deve reconhecer caixa mínimo, consistência básica e primeiros sinais de estrutura;
- ideal para Pedra Bruta, Quartzo e parte de Ametista.

### Equilibrium

Equilibrium exige estabilidade mínima.

Regras:

- peso médio;
- premia previsibilidade;
- valoriza meta atingida sem deterioração financeira;
- reforça consistência e saúde operacional.

### Growth

Growth acelera evolução quando saudável.

Regras:

- peso alto;
- exige crescimento acompanhado de consistência;
- não deve premiar risco extremo;
- deve observar margem, contas vencidas, temporadas concluídas e estabilidade.

### Expansion

Expansion tem maior potencial de evolução e maior exigência de saúde operacional.

Regras:

- peso muito alto;
- só deve acelerar evolução se houver maturidade;
- exige risco controlado;
- exige histórico confiável;
- exige capacidade de sustentar crescimento sem caos.

Growth e Expansion não devem premiar:

- prejuízo;
- caos operacional;
- risco extremo;
- temporadas instáveis recorrentes;
- contas vencidas crescendo;
- crescimento dependente de poucos produtos/dias.

## 6. Sistema de progresso

### Progresso da Pedra

Cada loja tem uma Pedra Atual e um progresso de **0 a 100%** para a próxima Pedra.

Quando atingir 100%:

- sobe para a próxima Pedra;
- registra o evento de evolução;
- reinicia o progresso para a nova Pedra;
- mantém histórico auditável do cálculo que gerou a subida.

O progresso deve ser gradual. Uma temporada não deve subir uma Pedra inteira sozinha, salvo exceções futuras muito especiais e explicitamente documentadas.

### Cálculo conceitual de progresso

Fluxo sugerido:

1. Calcular os seis índices oficiais no período de análise.
2. Aplicar pesos.
3. Aplicar travas de risco e saúde financeira.
4. Aplicar contexto do Plano de Voo.
5. Comparar contra requisitos da Pedra atual.
6. Converter a leitura em ganho gradual de progresso.
7. Registrar marcos/checklist atingidos.

Exemplo conceitual:

```text
indice_pedra_periodo =
  consistencia * 0.25 +
  crescimento_saudavel * 0.20 +
  saude_financeira * 0.20 +
  risco_controlado * 0.15 +
  fidelizacao * 0.10 +
  execucao * 0.10
```

Depois do índice bruto, aplicar limitadores. Exemplo: se risco extremo recorrente ou abandono repetido existir, o ganho de progresso do período deve ser reduzido.

## 7. Checklist automático

O checklist das Pedras deve ser uma lista de **marcos reais de evolução do negócio**, detectados automaticamente pelo BocaFood.

Ele não representa:

- uso do sistema;
- tarefas administrativas;
- cliques;
- ações mecânicas;
- abertura de telas;
- uso de uma feature específica.

Ele representa:

- sinais reais de maturidade;
- melhoria operacional;
- crescimento saudável;
- estabilidade;
- execução consistente;
- redução de risco;
- evolução contra o próprio histórico da loja.

A usuária não marca tarefas manualmente. O sistema identifica os marcos a partir de dados como:

- pedidos;
- temporadas;
- Plano de Voo;
- Performance;
- financeiro normalizado;
- clientes;
- recorrência;
- avaliações;
- score;
- risco;
- crescimento saudável.

Mesmo sendo detectado por dados do sistema, o checklist deve parecer uma leitura de evolução do negócio. A usuária deve sentir: "meu negócio está evoluindo", não "subi porque cliquei em coisas".

### O que evitar como checklist principal

Evitar como foco visual principal:

- criar temporada;
- abrir análise;
- acessar módulo;
- clicar em botão;
- usar feature X;
- preencher uma tela;
- configurar algo sem resultado real.

Esses sinais podem existir internamente com peso baixo como indício de adoção/organização, mas não devem ser apresentados como marcos principais da Pedra.

### Marcos corretos para mostrar

Exemplos de marcos adequados:

- vender em mais dias da semana;
- melhorar ticket médio;
- reduzir risco da operação;
- concluir temporada com estabilidade;
- aumentar recorrência de clientes;
- manter crescimento saudável;
- melhorar consistência semanal;
- reduzir dependência de promoções;
- reduzir dependência de poucos produtos;
- manter contas sob controle;
- sustentar metas mais ousadas;
- melhorar fidelização;
- reduzir oscilações fortes;
- crescer sem piorar margem estimada;
- manter boa reputação/avaliações.

### Exemplos por transição de Pedra

| Transição | Foco | Exemplos de checklist |
|---|---|---|
| Pedra Bruta -> Quartzo | Sobrevivência, organização inicial e primeiros sinais de consistência | Vender em mais dias da semana; concluir primeira temporada; reduzir instabilidade inicial; criar rotina mínima de vendas. |
| Quartzo -> Ametista | Consistência e previsibilidade inicial | Manter semanas mais estáveis; reduzir oscilações fortes; melhorar score médio; reduzir risco recorrente. |
| Ametista -> Safira | Crescimento saudável inicial | Melhorar recorrência; aumentar estabilidade; crescer mantendo controle; concluir temporadas equilibradas. |
| Safira -> Esmeralda | Crescimento mais sustentável | Melhorar fidelização; reduzir dependência de promoções; manter crescimento saudável; reduzir risco médio. |
| Esmeralda -> Rubi | Maturidade operacional | Sustentar metas mais ousadas; melhorar estabilidade financeira; reduzir dependência de poucos produtos; manter boa consistência. |
| Rubi -> Diamante | Alta consistência | Manter crescimento saudável por longo período; reduzir instabilidade operacional; concluir temporadas difíceis; manter boa saúde financeira. |
| Diamante -> Ônix | Excelência sustentável | Sustentar crescimento com baixo risco; manter alta previsibilidade; equilibrar crescimento e estabilidade; demonstrar maturidade consistente. |

### Linguagem do checklist

O checklist deve soar como leitura estratégica de maturidade empresarial.

Evitar:

- tom infantil;
- "missão desbloqueada";
- "XP ganho";
- "parabéns por clicar";
- gamificação artificial;
- linguagem de coach.

Preferir:

- "Seu negócio está mais consistente.";
- "Sua operação reduziu risco.";
- "Seu crescimento está mais saudável.";
- "A recompra melhorou em relação ao histórico.";
- "Sua meta foi sustentada com controle.";

### Relação com o sistema

O checklist é consequência dos dados. A usuária não precisa alimentar a tela.

Exemplo: a usuária não marca "melhorei recorrência". O sistema detecta aumento de clientes recorrentes, melhora de recompra e frequência maior, e marca automaticamente o marco correspondente.

O checklist deve explicar progresso, não virar lista manual de tarefas. Ele é uma camada de leitura sobre pedidos, Temporadas, Plano de Voo, Performance, fidelização e financeiro normalizado.

## 8. Regras por Pedra

As Pedras têm dificuldade progressiva. Quanto maior a Pedra, maior a exigência de histórico, saúde, consistência e controle de risco.

### Pedra Bruta

Exigir:

- sobrevivência;
- primeiras temporadas;
- primeiros sinais de organização;
- dados mínimos confiáveis;
- redução de caos básico;
- primeiros dias com venda ou registro operacional.

Não exigir faturamento alto, margem avançada ou crescimento agressivo.

### Quartzo

Exigir:

- consistência mínima;
- execução básica;
- redução de caos;
- primeiros ciclos concluídos;
- metas Survival ou Equilibrium simples.

### Ametista

Exigir:

- primeiras vitórias fortes;
- estabilidade inicial;
- score de temporadas em melhora;
- menos abandono;
- primeiros sinais de previsibilidade.

### Safira

Exigir:

- crescimento saudável inicial;
- fidelização emergente;
- consistência semanal;
- risco em queda;
- metas Survival/Equilibrium cumpridas com recorrência.

### Esmeralda

Exigir:

- metas equilibradas ou Growth saudáveis;
- risco controlado;
- consistência acima do básico;
- crescimento acompanhado de saúde;
- execução confiável.

### Rubi

Exigir:

- maturidade sólida;
- boa execução;
- estabilidade financeira;
- baixa taxa de abandono;
- crescimento recorrente sem caos;
- fidelização mais clara.

### Diamante

Exigir:

- alta consistência;
- crescimento sustentável;
- boa previsibilidade;
- risco baixo ou moderado;
- bom histórico de metas cumpridas;
- saúde financeira mais estável.

### Ônix

Exigir:

- excelência sustentável;
- longo histórico saudável;
- crescimento com controle;
- risco controlado mesmo em Growth/Expansion;
- baixa dependência de poucos produtos/dias;
- execução forte e recorrente;
- fidelização e reputação consistentes.

## 9. Regras de desaceleração

Situações que reduzem evolução:

- temporadas abandonadas;
- risco extremo recorrente;
- contas vencidas crescendo;
- crescimento sem consistência;
- score muito baixo recorrente;
- temporadas críticas seguidas;
- crescimento caótico;
- dependência excessiva de poucos produtos/dias;
- queda forte de avaliações;
- Growth/Expansion falhando com prejuízo ou instabilidade.

Desacelerar evolução não deve destruir a Pedra atual facilmente. A Pedra representa maturidade acumulada; uma fase ruim deve reduzir velocidade, travar avanço ou exigir recuperação, mas não rebaixar a loja automaticamente.

Rebaixamento de Pedra, se existir no futuro, deve ser raro, documentado e baseado em longo histórico de deterioração.

## 10. Regras de proteção

O sistema deve proteger leituras injustas.

Regras:

- lojas pequenas podem evoluir;
- sobrevivência é evolução válida;
- não comparar lojas entre si;
- faturamento não é verdade absoluta;
- risco precisa influenciar;
- consistência deve pesar muito;
- Survival não deve ser tratado como fracasso;
- crescimento lento não deve bloquear Pedra Bruta/Quartzo;
- dados de baixa confiança não devem derrubar a loja sozinhos.

Uma loja pequena, organizada e saudável pode avançar mais que uma loja grande, desorganizada e caótica.

## 11. Índice da Pedra

Score da Temporada e Índice da Pedra são coisas diferentes.

| Leitura | Horizonte | Função |
|---|---|---|
| Score da Temporada | Curto prazo | Mede desempenho dentro de uma campanha operacional de 30 ou 90 dias. |
| Índice da Pedra | Histórico acumulado | Mede maturidade da loja ao longo do tempo. |

Pedras analisam:

- tendência;
- histórico;
- execução recorrente;
- evolução saudável;
- risco ao longo do tempo;
- consistência acumulada;
- capacidade de repetir bons ciclos.

Pedras não devem analisar apenas:

- momento atual;
- uma temporada isolada;
- faturamento bruto;
- volume de pedidos;
- uma meta salva sem execução real.

## 12. Dados permitidos para V1

Usar apenas dados com confiabilidade suficiente ou com papel auxiliar claro:

- pedidos;
- score/risco das temporadas;
- temporadas concluídas;
- temporadas abandonadas;
- recorrência;
- avaliações;
- pontos;
- Plano de Voo;
- Performance;
- financeiro normalizado.

Não usar ainda:

- estoque real;
- desperdício real;
- lucro exato por venda;
- margem real por pedido sem snapshot;
- IA como prova de execução;
- capacidade operacional real;
- horas trabalhadas;
- atribuição detalhada de campanhas.

Dados financeiros devem passar por normalização/dedupe antes de peso forte, porque há fontes diferentes como `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar` e `contas_pagar`.

## 13. Preparação para futuro

O sistema deve ser preparado para:

- snapshots próprios de maturidade;
- IA estratégica de evolução;
- análise histórica mensal;
- marcos especiais;
- eventos sazonais;
- rankings opcionais privados;
- evolução visual avançada;
- auditoria de cálculo;
- versões do algoritmo;
- explicação de cada avanço;
- histórico de travas/desaceleração.

Coleção futura sugerida, apenas como referência conceitual:

```text
business_maturity_snapshots
```

Cada snapshot futuro deveria guardar:

- `tenantId`;
- período analisado;
- Pedra atual;
- progresso inicial/final;
- índices calculados;
- pesos aplicados;
- travas aplicadas;
- cenário do Plano de Voo;
- dados de Temporadas usados;
- limitações de confiança;
- versão do cálculo.

## 14. Resultado esperado

O Sistema de Cálculo das Pedras deve deixar claro:

- como funciona a evolução das Pedras;
- quais áreas influenciam a maturidade;
- como o sistema evita premiar crescimento ruim;
- como Survival, Equilibrium, Growth e Expansion influenciam evolução;
- como funciona o progresso para a próxima Pedra;
- como o checklist automático funciona;
- como manter o sistema justo para lojas pequenas e grandes.

O resultado final deve ser uma leitura adulta de maturidade do negócio, não XP falso ou gamificação infantil. A loja evolui porque ficou mais saudável, consistente, executora e controlada.
