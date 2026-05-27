# Temporadas / Missões Operacionais — funcionamento e mapeamento

## 1. Objetivo do módulo

Temporadas são ciclos operacionais de 30 ou 90 dias para acompanhar a rota escolhida no Plano de Voo. A usuária escolhe foco, duração, dificuldade e estratégia para executar melhor a rota, sem criar uma meta paralela. Depois disso, o sistema calcula automaticamente progresso, score, ritmo, risco, snapshots, resultado final e impacto na Maturidade do Negócio.

Temporadas não são tarefas manuais. A usuária não informa desempenho e não marca avanço. O módulo lê pedidos, clientes e sinais operacionais do tenant atual.

### Definição operacional atual

- O Plano de Voo define a direção maior do negócio.
- A Temporada transforma essa direção em execução de curto prazo.
- A dificuldade não deve ser tratada apenas como multiplicador de meta. Ela define o quanto a usuária vai se dedicar operacionalmente naquele ciclo.
- As ações recomendadas precisam ser específicas, com produto, canal, horário, promoção, cupom, upsell ou pontos quando esses dados existirem.
- Nenhuma ação deve dar ponto por cadastro. Cupom, promoção, upsell ou pontos só entram como sinal quando aparecem em pedido válido.
- Quando não houver histórico suficiente, o sistema deve dizer isso e sugerir uma ação simples para gerar base de leitura, sem inventar produto, campanha ou resultado.

Perfis de dificuldade:

| Dificuldade | Como deve orientar a usuária | Quantidade de ações |
|---|---|---|
| Seguro | Um foco principal, menor pressão e mais tolerância a variações. | Até 1 ação principal. |
| Equilibrado | Um foco principal e um apoio, com ritmo constante durante a semana. | Até 2 ações práticas. |
| Agressivo | Mais intensidade e acompanhamento próximo, com menor tolerância a desvio. | Até 3 ações específicas. |

Padrão das tarefas:

- Devem responder exatamente o que fazer agora.
- Devem citar o dado usado: produto mais vendido, melhor canal, melhor horário, promoção usada, upsell aceito ou pontos resgatados.
- Devem explicar o motivo em linguagem simples.
- Devem ser baseadas em histórico de pedidos e sinais validados.
- Devem preservar o score auditável: IA ou texto não recalculam meta, risco, progresso ou maturidade.

### Definição da Próxima Jogada

A Próxima Jogada é a parte operacional da Temporada. Ela não deve ser uma frase genérica de incentivo. Ela deve dizer qual ação fazer, com qual produto, em qual canal/horário e por qual motivo.

Regra central:

`Plano de Voo -> Temporada -> sinais reais do tenant -> ranking de oportunidades -> próximas jogadas`

O sistema deve avaliar as possibilidades disponíveis e escolher as melhores jogadas sem repetir o mesmo foco. A dificuldade define quantas jogadas aparecem:

- `Seguro`: 1 jogada principal.
- `Equilibrado`: 2 jogadas com focos diferentes.
- `Agressivo`: 3 jogadas com focos diferentes.

Quando mais de um produto ou ação tem bom sinal, o sistema deve ranquear e escolher combinações distintas. Exemplo: uma jogada pode focar em produto forte, outra em upsell e outra em dia fraco. Não deve aparecer duas vezes a mesma ideia apenas com texto diferente.

Critérios atuais usados no ranking:

| Sinal | Como entra na decisão |
|---|---|
| Produto forte por quantidade | Ajuda a escolher produto com mais saída. |
| Produto forte por faturamento | Ajuda a escolher produto que mais puxou dinheiro. |
| Produto com preço/custo/margem | Permite decidir se cupom, promoção ou desconto é saudável. |
| Promoção usada em pedido válido | Tem prioridade porque já gerou venda real. |
| Promoção ativa aplicável ao produto | Pode virar jogada se a margem estimada continuar saudável. |
| Cupom ativo | Pode virar jogada se o desconto não derrubar a margem mínima. |
| Upsell disponível | Pode virar jogada para aumentar pedido sem reduzir preço. |
| Upsell aceito em pedido | Ganha força porque já teve resposta real. |
| Melhor canal | Ajuda a indicar onde começar a ação. |
| Melhor horário | Ajuda a indicar quando rodar a ação. |
| Pontos/recompra | Ajuda a gerar jogada de clientes que já compraram. |
| Dias fracos/consistência | Ajuda a gerar jogada para recuperar dia fraco. |

O ranking deve evitar:

- repetir o mesmo produto quando existe outra oportunidade boa;
- repetir a mesma promoção/cupom/upsell com palavras diferentes;
- criar jogadas sem dado real quando já existe histórico suficiente;
- mandar a usuária “conferir”, “medir” ou “acompanhar” como ação principal;
- indicar desconto sem preço, custo e margem;
- pontuar cupom, promoção, upsell ou programa de pontos apenas por estarem cadastrados.

Padrão de texto da jogada:

- Título: ação direta, ex: `Usar Promo X em Coxinha`.
- Descrição: o que fazer e qual resultado esperado.
- Motivo: dado medido que justifica a ação.
- Checklist: passos curtos, específicos e executáveis.

Estrutura operacional da jogada:

Cada card deve funcionar como uma meta prática, sem usar linguagem técnica de metodologia. A usuária precisa entender:

| Bloco | Pergunta que responde |
|---|---|
| `Fazer` | Qual ação concreta deve ser feita agora. |
| `Até quando` | Qual é o prazo da rodada, definido pela dificuldade. |
| `Vai valer a pena se` | Como o BocaFood vai reconhecer que a jogada deu resposta. |
| `Por que fazer` | Qual dado real justifica essa jogada. |
| `Checklist` | Passos curtos para executar sem dúvida. |

Regra obrigatória de objeto concreto:

- Se a jogada fala de promoção, deve citar a promoção existente ou abrir a criação de uma promoção específica para um produto.
- Se fala de cupom, deve citar o código do cupom ou abrir a criação de um cupom específico.
- Se fala de upsell, deve citar a regra de upsell existente ou indicar exatamente qual produto deve ser combinado com qual complemento.
- Se fala de produto forte, deve dizer produto, canal e horário quando esses sinais existirem.
- Se fala de consistência, deve dizer qual produto/canal/horário usar para puxar o período fraco.
- Se não houver dado suficiente para escolher promoção, cupom, upsell ou complemento, o card deve dizer claramente o que falta cadastrar antes de medir a jogada.
- A estratégia da temporada pode ajustar prioridade, objetivo e linguagem, mas não pode substituir uma recomendação concreta por uma frase genérica.

Exemplo:

- Fazer: `Deixar Coxinha mais visível no Cardápio e usar o horário de maior resposta.`
- Até quando: `Colocar em prática até sexta-feira.`
- Vai valer a pena se: `entrar venda pelo Cardápio perto do horário indicado.`
- Por que fazer: `Cardápio trouxe 2 pedidos e €14,40; 08:00 concentrou 3 pedidos.`
- Checklist: `deixar Coxinha em destaque`, `usar promoção leve se a margem permitir`, `divulgar o link do Cardápio`.

Exemplo de boa jogada:

> Use a promoção `Combo Noite` com `Coxinha`, porque essa combinação já trouxe venda real.
> `Combo Noite` apareceu em 8 pedidos e gerou €320,00.
> Checklist: produto `Coxinha`; promoção `Combo Noite`; canal `Cardápio`; horário perto de `20:00`.

Exemplo de jogada ruim:

> Faça uma promoção para vender mais.

Motivo: é genérica, não diz produto, não mostra dado, não sabe se a margem sustenta e não guia execução.

### Como novas possibilidades de ação devem entrar no futuro

Quando o sistema ganhar novas ações, elas devem entrar como novos candidatos no ranking, não como texto solto.

Cada nova ação precisa informar:

| Campo | Uso |
|---|---|
| `score` | Força relativa da oportunidade. |
| `focusKey` | Tipo de foco, ex: `promotion`, `upsell`, `retention`, `timing`, `consistency`. |
| `productKey` | Produto vinculado, quando houver. |
| `action` | Objeto final exibido para a usuária. |
| `source` | Origem da recomendação: produto, promoção, cupom, upsell, pontos, canal, etc. |
| `why` | Dado medido que justifica a jogada. |
| `checklist` | Lista de execução específica. |

Para jogadas de canal, evitar frases vagas como `Concentrar no canal Cardápio`. A ação deve dizer o que fazer para concentrar:

- deixar o produto mais visível no Cardápio;
- usar card de destaque, ordem do produto ou promoção leve se a margem permitir;
- divulgar o link do Cardápio quando falar com clientes em outros canais;
- executar perto do horário que respondeu melhor.

O seletor deve tentar primeiro pegar ações com foco e produto diferentes. Se não houver oportunidades suficientes, pode completar com ações do mesmo produto, desde que o objetivo seja diferente.

Exemplo futuro:

- Se o sistema identificar produto forte, cupom saudável e canal forte, pode mostrar:
  1. destacar produto forte;
  2. usar cupom saudável nesse produto;
  3. concentrar a divulgação no canal/horário que respondeu melhor.

Mas se a promoção já é a ação principal para esse produto, não deve criar uma segunda jogada dizendo a mesma coisa como “repetir promoção com cuidado”.

### Execução, prazo e check automático das jogadas

A Próxima Jogada também precisa ser acompanhada como tarefa operacional, não apenas recomendada.

Definição atual:

- Cada jogada vira uma tarefa em `actionTasks` dentro do documento da temporada.
- A tarefa é criada a partir do `executionPlan.actions`.
- O sistema preserva `createdAt`, `dueAt`, `executeDueAt`, `resultDueAt`, `status`, `completedAt`, `executionEvidence` e `evidence`.
- O check não depende de clique manual nesta fase. O sistema procura evidência real nos pedidos do período.
- Quando uma jogada é executada ou vence o prazo, ela sai das jogadas atuais e entra em `actionTaskHistory`.
- O espaço liberado deve gerar uma nova jogada, respeitando a dificuldade, até o fim da temporada.

Prazos por dificuldade:

| Dificuldade | Executar até | Medir por | Interpretação |
|---|---:|---:|---|
| Seguro | 7 dias | 15 dias | Mais tempo para colocar a ação em prática e medir com calma. |
| Equilibrado | 5 dias | 7 dias | Ritmo constante, com execução em poucos dias e leitura na semana. |
| Agressivo | 3 dias | 5 dias | Execução rápida e janela curta para confirmar resposta. |

`Executar até` é o prazo para colocar a jogada em prática, como criar cupom, ativar promoção, criar upsell, destacar produto ou acionar clientes.

`Medir por` é a janela para o BocaFood procurar resultado em pedidos reais. Quando a ação é criada dentro do BocaFood, essa janela conta a partir da criação/aplicação da ação. Se ainda não houver evidência de execução, fica como referência máxima da rodada.

Status possíveis:

| Status técnico | Texto | Quando acontece |
|---|---|---|
| `pending` | Em andamento | A jogada ainda está dentro do prazo e sem evidência suficiente. |
| `executed_with_result` | Executada com resultado | O sistema encontrou pedido compatível com a jogada. |
| `executed_without_result` | Executada sem resultado | A ação foi criada/aplicada, mas não trouxe pedido ligado dentro da janela de medição. |
| `not_executed` | Prazo vencido | O prazo de execução passou e a ação não foi criada/aplicada. |
| `manually_done` | Marcada como feita | Reservado para etapa futura com confirmação manual. |

Como o sistema identifica execução:

| Fonte da jogada | Evidência buscada |
|---|---|
| Produto | Pedido válido com o produto citado na jogada. |
| Cupom | Pedido válido com o cupom citado ou desconto de cupom. |
| Promoção | Pedido válido com a promoção citada ou desconto promocional. |
| Upsell | Pedido válido com upsell aceito ou receita adicional de upsell. |
| Canal/horário | Pedido válido no canal ou horário indicado. |
| Recompra/pontos | Pedido válido de cliente que voltou a comprar ou usou benefício. |
| Consistência | Pedido válido relacionado à jogada de recuperar dia fraco. |

Se a usuária executa a ação e isso aparece nos pedidos, a tarefa recebe check automático como `executed_with_result`.

Se a ação é criada dentro do BocaFood, mas não gera pedido compatível dentro da janela de medição, a tarefa vira `executed_without_result`.

Se a usuária não executa ou se a execução acontece fora do BocaFood sem evidência rastreável, a tarefa continua pendente até o prazo de execução. Depois desse prazo, vira `not_executed`.

Fluxo contínuo:

1. Temporada gera as jogadas atuais.
2. Cada jogada fica ativa até ter venda ligada a ela, até vencer o prazo de execução ou até encerrar a janela de medição.
3. Jogada com resultado vai para o histórico como executada.
4. Jogada criada sem venda vai para o histórico como executada sem resultado.
5. Jogada não criada/aplicada no prazo vai para o histórico como não executada.
6. A Temporada monta uma nova jogada para ocupar o espaço livre.
7. O ciclo continua até a temporada ser finalizada ou abandonada.

### Mapa de ações rastreáveis por Ações de Vendas e Pedidos

Este mapa define quais ações conseguimos rastrear sem depender da usuária marcar manualmente.

A regra é:

- criação/configuração da ação mostra intenção;
- pedido mostra execução real;
- resultado do pedido mostra se funcionou.

Não basta a ação estar cadastrada. Ela só vira aprendizado da Temporada quando aparece em venda, ou quando o próprio BocaFood executa/aplica a ação dentro do fluxo.

#### Cupom de desconto

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Criou cupom | Ações de Vendas > Cupons | `couponId`, `couponCode`, tipo, valor, período, produto/categoria/canal se houver. |
| Cupom foi usado | Pedido | `couponCode`, `couponDiscount`, `couponDiscountTotal`, total do pedido. |
| Resultado | Pedido + itens | pedidos com cupom, faturamento com cupom, desconto total, ticket médio com cupom, recompra quando houver cliente identificado. |

Leitura correta:

- Cupom criado não pontua.
- Cupom usado em venda conta como execução.
- Cupom com venda, mas desconto alto demais, deve ser lido como cuidado, não como sucesso automático.
- Cupom bom é aquele que trouxe venda sem derrubar demais ticket, margem ou valor final.

#### Promoção

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Criou promoção | Ações de Vendas > Promoções | `promotionId`, nome, tipo, benefício, produto/categoria, período, regra. |
| Promoção apareceu na venda | Pedido ou item do pedido | `promotionId`, `promotionName`, `promotionDiscount`, `promoDiscount`, item vinculado. |
| Resultado | Pedido + itens | pedidos com promoção, produto vendido, receita, desconto, quantidade vendida, ticket médio. |

Leitura correta:

- Promoção cadastrada não pontua.
- Promoção que gerou venda conta como execução.
- Promoção boa é a que vendeu mais, mas ainda preservou resultado suficiente.
- Se vendeu muito com desconto alto e ticket caiu, a leitura deve ser “vendeu, mas pesou”.

#### Upsell / Aumentar valor do pedido

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Criou regra de upsell | Ações de Vendas > Upsell | `upsellRuleId`, gatilho, produto ofertado, momento de exibição. |
| Cliente aceitou | Pedido | `upsellAccepted`, `upsellAddedRevenue`, item adicional, variação escolhida quando houver. |
| Resultado | Pedido + itens | pedidos com upsell, receita adicionada, ticket médio com/sem upsell, taxa de aceitação. |

Leitura correta:

- Upsell criado não pontua.
- Upsell aceito conta como execução.
- Upsell bom é o que aumenta valor do pedido sem depender de desconto.
- Se aparece mas não é aceito, no futuro pode indicar oferta pouco atraente.

#### Produto em destaque / selo / vitrine

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Produto destacado | Cardápio ou Template | `highlightedProductId`, selo, card de destaque, período da exposição. |
| Produto vendeu depois | Pedido item | `productId`, nome, quantidade, total. |
| Resultado | Pedido + histórico antes/depois | vendas do produto antes/depois, quantidade, receita, participação no total. |

Leitura correta:

- Só vender o produto não prova totalmente que o destaque foi executado, a menos que o BocaFood aplique o destaque.
- Se o destaque foi aplicado pelo sistema e o produto vendeu depois, pode contar como execução com resultado.
- Se a usuária destacou fora do sistema, só conseguimos inferir pelo aumento de venda.

#### Produto forte sem desconto

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Jogada recomendada | Temporada | `productId`, nome, canal/horário sugerido. |
| Produto vendeu | Pedido item | produto, quantidade, total, data/hora, canal. |
| Resultado | Pedido + comparação | vendas após a recomendação, aumento contra período anterior, ticket médio. |

Leitura correta:

- Produto indicado que vendeu depois conta como sinal de resposta.
- Sucesso melhor é vender mais do que antes, não apenas vender uma unidade.
- Quando não houver base anterior suficiente, a primeira venda já serve como evidência inicial.

#### Canal de venda

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Jogada indica canal | Temporada | canal sugerido, ex: Cardápio, Instagram, WhatsApp, venda presencial. |
| Pedido entrou pelo canal | Pedido | `channel`, `source`, `origin`, `salesChannel`. |
| Resultado | Pedido | pedidos por canal, faturamento por canal, ticket por canal. |

Leitura correta:

- Se a ação pede usar um canal e os pedidos entram por esse canal, há evidência.
- Canal bom é o que traz venda com ticket e resultado saudáveis.
- Canal só cadastrado em Configurações não conta.

Leitura com margem e impacto global:

- canal de venda não deve ser avaliado só pelo faturamento bruto;
- um marketplace pode vender muito e ainda assim pesar no resultado se tiver comissão alta;
- antes de recomendar promoção em um canal, o sistema deve olhar venda gerada, taxa/comissão, desconto aplicado e participação daquele canal no total da temporada;
- se o canal vende muito e tem taxa baixa, pode receber destaque ou promoção leve;
- se o canal vende muito, mas taxa alta e desconto alto aparecem juntos, a jogada deve sugerir reduzir ou tirar promoção antes de aumentar esforço;
- se o canal vende muito com taxa alta, a aposta deve ser com produto de boa margem e sem desconto forte;
- se o canal vende pouco e cobra caro, ele não deve virar prioridade da Próxima Jogada.

Campos usados quando disponíveis:

- pedidos por canal;
- faturamento por canal;
- participação no faturamento total da temporada;
- comissão percentual;
- taxa fixa por pedido;
- imposto/taxa sobre comissão;
- descontos de cupom, promoção e upsell ligados aos pedidos daquele canal;
- receita líquida estimada depois de taxas e descontos.

Regra específica de upsell:

- upsell só entra no canal de venda `Cardápio`;
- pedidos de marketplace, Instagram, WhatsApp, venda presencial ou outros canais não validam upsell;
- quando a jogada recomendar upsell, o card deve deixar claro que a execução é no Cardápio.

#### Horário forte

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Jogada indica horário | Temporada | hora/faixa recomendada. |
| Venda acontece no horário | Pedido | `createdAt`, `analyticsHour`, `orderTime`, `deliveryTime`, `scheduleTime`. |
| Resultado | Pedido | pedidos por horário, faturamento por horário, produto vendido naquele horário. |

Leitura correta:

- Venda no horário indicado conta como evidência.
- Sucesso melhor é aumento de vendas naquele horário ou repetição de pedidos no horário.
- Horário forte deve ser combinado com produto/canal quando possível.

#### Recompra / fidelização / pontos

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Ação de recompra | Temporada, Clientes, Programa de Pontos | cliente, benefício, pontos, cupom de retorno se houver. |
| Cliente voltou | Pedido | `customerId`, telefone, e-mail, `pointsRedemption`, `pointsDiscount`. |
| Resultado | Pedido + cliente | cliente recorrente, frequência, valor da recompra, pontos usados. |

Leitura correta:

- Cliente cadastrado não pontua.
- Pontos gerados não pontuam sozinhos.
- Cliente que volta a comprar conta como recompra.
- Pontos ou cupom de retorno usados em recompra contam como evidência forte.

#### Combo / variações / adicionais

| Etapa | Onde rastrear | O que guardar/ler |
|---|---|---|
| Combo/oferta configurada | Produto, Promoção ou Upsell | produto principal, opções, adicionais, preço. |
| Cliente comprou | Pedido item | combo, variações, adicionais, subtotal, quantidade. |
| Resultado | Pedido + item | ticket médio, itens por pedido, receita adicional, aceitação de opções. |

Leitura correta:

- Combo vendido conta como execução.
- Combo bom é o que aumenta ticket ou quantidade sem destruir margem.
- Variações/adicionais precisam ser salvos no item do pedido para análise correta.

### Resultado da jogada: execução não é sempre sucesso

A Temporada deve separar três coisas:

| Camada | Pergunta | Exemplo |
|---|---|---|
| Execução | A ação aconteceu? | O cupom foi usado, a promoção apareceu, o upsell foi aceito. |
| Resultado | Gerou venda ou resposta? | Entraram 4 pedidos com a ação. |
| Qualidade | Foi bom para o negócio? | Aumentou venda/ticket/recompra sem desconto excessivo. |

Possíveis leituras futuras:

| Status | Quando usar |
|---|---|
| `executed_with_result` | Ação apareceu em venda e gerou resposta. |
| `executed_with_weak_result` | Ação apareceu, mas vendeu pouco ou piorou ticket/margem. |
| `executed_with_bad_result` | Ação vendeu, mas gerou desconto pesado ou resultado ruim. |
| `probably_executed` | Houve venda parecida, mas sem rastro direto da ação. |
| `no_evidence` | Não houve rastro suficiente até o prazo. |

Para definir sucesso, usar a métrica ligada ao objetivo da jogada:

| Tipo de jogada | Sucesso principal |
|---|---|
| Vender mais produto | Mais pedidos, mais quantidade ou mais receita do produto. |
| Aumentar ticket | Ticket médio maior, adicional vendido, upsell aceito. |
| Cupom/promoção | Venda com desconto saudável e ticket preservado. |
| Recompra | Cliente antigo comprou de novo. |
| Canal/horário | Pedido entrou no canal/horário indicado. |
| Consistência | Dia fraco recebeu venda ou reduziu oscilação. |

Dados que precisamos garantir nos pedidos para rastrear bem:

- `productId`
- `productName`
- `quantity`
- `unitPrice`
- `lineTotal`
- `costSnapshot` ou custo do item no momento da venda
- `couponCode`
- `couponDiscountTotal`
- `promotionId`
- `promotionName`
- `promotionDiscountTotal`
- `upsellRuleId`
- `upsellAccepted`
- `upsellAddedRevenue`
- `channel`
- `createdAt`
- `customerId`, telefone ou e-mail
- `pointsRedemption`
- `pointsDiscount`

### Regra de ação existente x ação nova

A Próxima Jogada deve diferenciar quando está recomendando algo que já existe no BocaFood e quando está propondo criar algo novo.

Essa regra é importante para não depender da usuária marcar manualmente que executou.

#### Quando a ação já existe

Exemplos:

- promoção ativa já cadastrada;
- cupom ativo já cadastrado;
- upsell já configurado;
- produto já marcado como destaque;
- programa de pontos já ativo.

Nesse caso, o card da jogada deve usar a ação existente e salvar a referência dela:

| Campo | Exemplo |
|---|---|
| `expectedActionType` | `promotion`, `coupon`, `upsell`, `highlight`, `points` |
| `expectedActionId` | id da promoção/cupom/upsell/etc. |
| `expectedActionName` | nome exibido para a usuária |
| `expectedProductId` | produto vinculado, se houver |
| `expectedSourceModule` | `sales_actions`, `storefront`, `loyalty`, etc. |

O card pode ter botões como:

- `Ver promoção`;
- `Usar nesta jogada`;
- `Ver cupom`;
- `Ver upsell`;
- `Ver destaque`.

Rastreamento:

- se a ação aparece em pedido, vira `executed_with_result`;
- se a ação estava ativa mas não aparece em venda até o prazo, pode virar `executed_without_result`;
- se a ação foi pausada/desativada antes de rodar, pode virar `not_executed` ou `not_applied`.

#### Quando a ação precisa ser criada

Exemplos:

- criar promoção para produto forte;
- criar cupom leve;
- criar upsell para aumentar ticket;
- aplicar destaque no cardápio;
- criar campanha de retorno;
- ativar oferta em produto específico.

Nesse caso, a Próxima Jogada deve abrir o modal certo a partir do próprio card, já com dados sugeridos.

Botões possíveis:

- `Criar promoção`;
- `Criar cupom`;
- `Criar upsell`;
- `Aplicar destaque`;
- `Criar ação de retorno`.

Ao criar a ação por esse botão, ela deve nascer vinculada à Temporada:

| Campo | Uso |
|---|---|
| `createdFromSeasonAction` | `true` |
| `seasonId` | temporada que originou a ação |
| `seasonActionId` | jogada específica que originou a ação |
| `expectedActionType` | tipo da ação criada |
| `expectedProductId` | produto sugerido |
| `suggestedDiscount` | desconto sugerido, se houver |
| `suggestedChannel` | canal sugerido, se houver |
| `suggestedHour` | horário sugerido, se houver |

Depois disso, a Temporada consegue separar:

| Situação | Status |
|---|---|
| Jogada sugeriu criar, mas a ação não foi criada | `not_executed` |
| Ação foi criada, mas não gerou venda até o prazo | `executed_without_result` |
| Ação foi criada e apareceu em venda | `executed_with_result` |
| Ação foi criada e vendeu, mas prejudicou ticket/margem | `executed_with_weak_result` |
| Ação foi criada e vendeu bem | `executed_with_good_result` |

#### Fluxo atual para criar ação pela jogada

Para ações de venda já suportadas, o botão da Próxima Jogada não deve apenas levar a usuária para outra tela. Ele deve abrir o cadastro correto e manter o vínculo com a temporada.

Fluxo aplicado:

1. A usuária clica em `Criar promoção`, `Criar cupom` ou `Criar upsell` no card da jogada.
2. O BocaFood salva um rascunho leve da jogada em `sessionStorage`, com `seasonId`, `seasonActionId`, tipo da ação, título, produto/foco e origem.
3. O sistema abre a aba correta em `Ações de Vendas`.
4. O módulo de Marketing lê o rascunho e abre automaticamente o modal de cadastro correspondente.
5. Ao salvar a ação, o registro criado recebe o vínculo com a Temporada.
6. A `actionTask` da temporada recebe a evidência de criação e passa a aguardar pedido real para medir resultado.

Campos gravados na ação criada:

| Campo | Uso |
|---|---|
| `createdFromSeasonAction` | indica que a ação nasceu de uma Próxima Jogada |
| `seasonId` | temporada de origem |
| `seasonActionId` | jogada que originou a ação |
| `seasonActionType` | tipo esperado: `promotion`, `coupon` ou `upsell` |
| `seasonActionTitle` | título da jogada exibida para a usuária |
| `seasonActionSource` | origem da recomendação |
| `seasonActionProductKey` | produto ligado à jogada, quando existir |
| `seasonActionFocusKey` | foco usado para evitar jogadas repetidas |

Campos atualizados na tarefa da temporada:

| Campo | Uso |
|---|---|
| `expectedActionType` | tipo da ação criada |
| `expectedActionId` | id do registro salvo em Promoções, Cupons ou Upsell |
| `expectedActionCollection` | coleção de origem da ação criada |
| `executionEvidence` | evidência de que a ação foi cadastrada a partir da jogada |
| `executionStatus` | fica como ação criada aguardando resultado |

Com isso, a Temporada consegue diferenciar:

- ação sugerida e não criada;
- ação criada sem venda no prazo;
- ação criada com venda real;
- ação criada com venda, mas com desconto ou margem ruim;
- ação criada com venda e bom resultado.

Regra específica do upsell:

- `Criar upsell` segue o mesmo fluxo de promoção e cupom;
- o modal de Upsell abre automaticamente na aba de Ações de Vendas;
- ao salvar, a regra de upsell fica ligada à `seasonActionId`;
- upsell só deve ser recomendado e validado no canal `Cardápio`;
- pedidos de marketplace, Instagram, WhatsApp, venda presencial ou outros canais não contam como resultado de upsell.

#### Regra de interface

O card da Próxima Jogada deve mudar conforme a origem:

| Tipo de jogada | Ação do card |
|---|---|
| Usa algo existente | Mostrar botão para ver/usar a ação existente. |
| Precisa criar algo novo | Mostrar botão para criar direto no card. |
| Ação aplicada pelo sistema | Mostrar status aplicado e acompanhar resultado. |
| Ação externa sem integração | Mostrar como recomendação e inferir pelo resultado, sem prometer confirmação automática. |

Exemplo:

`Repetir Promoção Combo Noite`

- Usa algo existente.
- Botões: `Ver promoção`, `Usar nesta jogada`.
- Rastreio: pedido com essa promoção.

`Criar cupom leve para Coxinha`

- Precisa criar algo novo.
- Botão: `Criar cupom agora`.
- Modal abre com produto, desconto sugerido, prazo e vínculo com a Temporada.
- Rastreio: cupom criado + pedido com cupom.

`Destacar Coxinha no cardápio`

- Pode ser aplicado pelo sistema.
- Botão: `Aplicar destaque`.
- Rastreio: destaque aplicado + venda do produto depois.

Essa regra transforma a Temporada em uma central de ação, não apenas em uma área de recomendação.

Regra importante:

- A ausência de execução não deve recalcular a meta.
- A ausência de execução pode ajudar a explicar risco, ritmo e próximas jogadas futuras.
- Uma etapa futura pode incluir botão manual `Marquei como feita`, mas o check mais confiável sempre deve vir da evidência real no pedido.

### Estrutura visual desejada da aba Próxima Jogada

A aba `Próxima Jogada` deve parecer uma orientação de gestão do dia a dia, não um relatório técnico.

Ela precisa responder sempre:

- O que eu faço agora?
- Por que isso faz sentido?
- Até quando eu faço?
- Deu resultado ou não?
- Qual é a próxima jogada?

#### 1. Cabeçalho da aba

Mostrar uma leitura simples da semana/período.

Exemplo:

> Sua temporada precisa vender mais €X até o fim do período.
> Para esta semana, foque nestas jogadas.

Regras:

- Não falar de score, cálculo, motor ou sistema.
- Não repetir informações da Visão Geral.
- Falar com a usuária sobre o negócio dela.
- Explicar o foco da semana de forma curta.

#### 2. Jogadas ativas

Cada jogada deve aparecer como um card independente.

Cada card deve ter:

| Parte do card | Função |
|---|---|
| Título claro | Nome da jogada, ex: `Vender mais Coxinha no Cardápio`. |
| Objetivo da jogada | O que essa ação tenta melhorar. |
| Por que fazer | Dado do negócio que justifica a ação. |
| O que fazer agora | Checklist prático. |
| Prazo | Data ou quantidade de dias para executar. |
| Status | Em andamento, deu resultado, sem resposta, etc. |
| Resultado | Aparece quando houver venda ou quando o prazo vencer. |
| Botões | Dependem se a ação já existe ou precisa ser criada. |

Exemplo:

**Vender mais Coxinha no Cardápio**

Objetivo:

> Aumentar as vendas do produto que já mostrou melhor resposta.

Por que fazer:

> Coxinha vendeu 12 unidades e gerou €48,00 nesta temporada. O melhor horário foi perto de 20:00.

O que fazer:

- colocar Coxinha em destaque no cardápio;
- usar o canal Cardápio primeiro;
- rodar essa jogada perto de 20:00;
- manter sem desconto, se a margem estiver saudável.

Prazo:

> Até sexta-feira.

Status:

> Em andamento.

#### 3. Resultado da jogada

Quando a jogada tiver resposta, o próprio card deve mudar.

Se vendeu:

- Status: `Deu resultado`.
- Resultado: `Coxinha apareceu em 4 vendas e gerou €18,00 depois da jogada.`
- Leitura: `Vale continuar usando essa jogada ou transformar em promoção leve.`

Se a ação foi criada/aplicada, mas não vendeu:

- Status: `Feita, mas ainda sem venda`.
- Resultado: `A promoção foi criada, mas não entrou venda com ela dentro do prazo.`
- Leitura: `Trocar o foco para outro produto, canal ou oferta.`

Se não houve rastro de execução:

- Status: `Sem evidência`.
- Resultado: `Não apareceu venda nem ação ligada a essa jogada.`
- Leitura: `Essa jogada deve sair da rodada atual e abrir espaço para outra.`

#### 4. Histórico das jogadas

Abaixo das jogadas ativas, mostrar uma seção mais discreta:

> Jogadas que já passaram

Cada item deve mostrar:

- nome da jogada;
- status;
- resultado;
- aprendizado.

Exemplo:

> Cupom COXINHA10
> Vendeu €22,00, mas o desconto reduziu muito o resultado.
> Aprendizado: usar desconto menor na próxima vez.

O histórico deve ser leve e, quando crescer, colapsável.

#### 5. Nova jogada automática

Quando uma jogada sai da rodada atual:

- se funcionou, vai para histórico;
- se venceu, vai para histórico;
- se foi criada mas não vendeu, vai para histórico;
- o sistema gera outra jogada;
- a aba não fica parada até a temporada acabar.

#### 6. Separação por objetivo da Temporada

A lógica da aba deve mudar conforme o objetivo.

##### Vender Mais

Priorizar:

- produto forte;
- melhor canal;
- melhor horário;
- promoção que já vendeu;
- produto com margem para ação;
- cupom leve quando fizer sentido.

Botões possíveis:

- `Ver promoção`;
- `Criar promoção`;
- `Criar cupom`;
- `Aplicar destaque`;
- `Ver produto`.

##### Aumentar Ticket

Priorizar:

- upsell;
- combo;
- adicional;
- produto complementar;
- ticket médio antes/depois;
- oferta que aumenta valor sem desconto.

Botões possíveis:

- `Criar upsell`;
- `Ver upsell`;
- `Criar combo`;
- `Adicionar produto complementar`;
- `Ver produtos sugeridos`.

##### Fidelizar Clientes

Priorizar:

- clientes que já compraram;
- pontos;
- cupom de retorno;
- produto que a cliente costuma repetir;
- recompra;
- frequência de compra.

Botões possíveis:

- `Criar cupom de retorno`;
- `Ver clientes para chamar`;
- `Ver programa de pontos`;
- `Criar ação de retorno`.

##### Melhorar Consistência

Priorizar:

- dia fraco;
- horário fraco;
- produto que pode puxar movimento;
- canal que responde melhor;
- ação para distribuir vendas na semana.

Botões possíveis:

- `Criar promoção para dia fraco`;
- `Aplicar destaque`;
- `Criar cupom por período`;
- `Ver horários fortes`;
- `Ver dias fracos`.

#### 7. Regra de dificuldade

A dificuldade define quantas jogadas ficam ativas ao mesmo tempo:

| Dificuldade | Jogadas ativas | Regra |
|---|---:|---|
| Seguro | 1 | Uma ação principal. |
| Equilibrado | 2 | Duas ações com focos diferentes. |
| Agressivo | 3 | Três ações específicas, com maior intensidade. |

Cada jogada precisa ter foco diferente.

Exemplo correto no `Equilibrado`:

1. vender mais Coxinha;
2. testar upsell de Guaraná.

Exemplo errado:

1. vender mais Coxinha;
2. repetir promoção da Coxinha com o mesmo objetivo.

Isso é redundante e não deve acontecer.

#### 8. Blocos visuais da aba

Estrutura final desejada:

1. Leitura da semana.
2. Jogadas ativas.
3. O que aconteceu.
4. Histórico das jogadas.
5. Aprendizado da Temporada.

`O que aconteceu` deve mostrar um mini resumo:

- jogadas com resultado;
- jogadas sem resposta;
- receita gerada pelas jogadas;
- ações criadas que ainda não venderam.

`Aprendizado da Temporada` deve mostrar frases simples:

- Promoção vendeu, mas pesou no desconto.
- Upsell funcionou melhor que cupom.
- Coxinha responde melhor à noite.
- Canal Cardápio trouxe melhor resposta.
- Cupom de retorno gerou recompra.

#### O que ainda falta implementar para chegar nessa experiência

Já está documentado/encaminhado:

- cards independentes por jogada;
- prazo por dificuldade;
- histórico de jogadas;
- saída automática da rodada atual;
- diferença entre ação existente e ação nova;
- mapa de rastreio por Ações de Vendas e Pedidos.

Ainda falta implementar nas próximas fases:

- cabeçalho com leitura da semana;
- campo/área `Objetivo da jogada` dentro de cada card;
- bloco `O que aconteceu`;
- bloco `Aprendizado da Temporada`;
- botões reais para criar promoção, cupom, upsell e destaque direto da jogada;
- vínculo automático entre ação criada e `seasonActionId`;
- status `executed_without_result`, `executed_with_weak_result`, `executed_with_good_result`;
- leitura de qualidade do resultado, não apenas presença de venda;
- botões específicos por objetivo da temporada.

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
   - dificuldade;
   - estratégia operacional;
   - resumo final.
4. O sistema busca a rota do Plano de Voo para o período.
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

### Origem da meta

A Temporada não cria meta própria na V1 atual. Ela acompanha a meta definida no Plano de Voo.

| Campo técnico | Valor atual esperado | Funcionamento |
|---|---|---|
| `targetMode` | `flight_plan` | A meta vem da rota escolhida no Plano de Voo. |
| `planConnection` | objeto | Snapshot da rota/período usado para conectar a temporada ao Plano de Voo. |
| `calculatedTargetValue` | number | Mantido por compatibilidade, mas representa o valor vindo da rota. |

### Dificuldade

| Valor técnico | Nome exibido | Interpretação |
|---|---|---|
| `safe` | Seguro | Menos pressão, uma jogada principal e maior tolerância a variações. |
| `balanced` | Equilibrado | Ritmo constante, até duas jogadas diferentes. |
| `aggressive` | Agressivo | Mais intensidade, até três jogadas específicas e menor tolerância a desvio. |

### Estratégia operacional

| Valor técnico | Nome exibido | Interpretação |
|---|---|---|
| `volume` | Volume | Prioriza pedidos, frequência e movimento. |
| `margin` | Margem | Prioriza ticket, valor por pedido e produtos de maior valor. |
| `retention` | Fidelização | Prioriza recompra, recorrência e frequência. |

### Matriz de objetivo + estratégia para Próxima Jogada

A Próxima Jogada não deve sugerir sempre as mesmas ações. O BocaFood deve cruzar o objetivo da temporada com a estratégia operacional escolhida para decidir quais tipos de jogada têm prioridade.

Regra geral:

- o objetivo define o resultado que a temporada quer melhorar;
- a estratégia define o caminho operacional usado para chegar lá;
- a dificuldade define quantas jogadas ficam ativas ao mesmo tempo;
- o histórico real decide quais produtos, canais, horários, cupons, promoções, upsells ou clientes entram na jogada.

Matriz atual:

| Objetivo | Estratégia | Jogadas que devem subir no ranking | Evitar como prioridade |
|---|---|---|---|
| Vender Mais | Volume | produto forte, canal/horário forte, promoção que já vendeu, promoção leve, cupom saudável | ações só de fidelização se não houver sinal de recompra |
| Vender Mais | Margem | produto forte com boa margem, destaque sem desconto, upsell quando for Cardápio, desconto pequeno calculado | cupom forte ou promoção que derrube muita margem |
| Vender Mais | Fidelização | produto forte para clientes que já compraram, cupom de retorno, pontos/recompra, canal que trouxe clientes conhecidos | ações genéricas de volume sem público definido |
| Aumentar Ticket | Volume | upsell, combo, adicional, produto complementar, produto que ajuda a subir o pedido | cupom como primeira opção, porque pode baixar ticket |
| Aumentar Ticket | Margem | upsell, produto de maior margem, adicional sem desconto, desconto pequeno só se a margem permitir | promoção agressiva e cupom forte |
| Aumentar Ticket | Fidelização | upsell para clientes recorrentes, produto complementar para quem já comprou, pontos como incentivo de retorno | campanha ampla sem vínculo com cliente conhecido |
| Fidelizar Clientes | Volume | clientes que já compraram, cupom de retorno, produto repetido por clientes, pontos/resgate | ação só de produto para público frio |
| Fidelizar Clientes | Margem | recompra com produto de boa margem, pontos com limite saudável, cupom leve para retorno | desconto alto para cliente que já compraria |
| Fidelizar Clientes | Fidelização | pontos, recompra, cliente recorrente, cupom de retorno, produto preferido do cliente | ação genérica de divulgação |
| Melhorar Consistência | Volume | recuperar dia fraco, canal/horário que responde, produto forte em dia parado | ação de margem que reduza movimento |
| Melhorar Consistência | Margem | recuperar dia fraco com produto de margem saudável, destaque sem desconto, horário forte | promoção pesada só para criar movimento |
| Melhorar Consistência | Fidelização | trazer clientes conhecidos nos dias fracos, pontos/recompra em dia parado, produto repetido por recorrentes | ação ampla sem foco em dia ou cliente |

Regra de bloqueio no modal `Nova Temporada`:

Para reduzir combinações confusas, estratégias que não combinam com o objetivo escolhido ficam bloqueadas no cadastro da temporada.

| Objetivo | Estratégia recomendada | Alternativa permitida | Estratégia bloqueada |
|---|---|---|---|
| Vender Mais | Volume | Fidelização | Margem |
| Aumentar Ticket | Margem | Fidelização | Volume |
| Fidelizar Clientes | Fidelização | Margem | Volume |
| Melhorar Consistência | Volume | Fidelização | Margem |

O bloqueio não significa que a combinação seja impossível no mundo real. Significa que, para esta V1, ela tende a gerar Próximas Jogadas menos claras. Quando houver mais inteligência e histórico, essas combinações podem voltar como modo avançado.

Isso significa que duas temporadas com o mesmo histórico podem receber jogadas diferentes:

- `Vender Mais + Volume`: tende a priorizar produto, canal, horário e promoção leve.
- `Aumentar Ticket + Margem`: tende a priorizar upsell, adicional e produto com melhor sobra.
- `Fidelizar Clientes + Fidelização`: tende a priorizar recompra, pontos e cupom de retorno.
- `Melhorar Consistência + Volume`: tende a priorizar dia fraco, horário e canal.

Essa matriz não substitui os dados reais. Ela só ajusta a ordem das oportunidades para evitar repetição e alinhar a jogada com a intenção escolhida pela usuária.

Além de reordenar, a matriz também deve mudar a leitura da própria jogada. A mesma ação pode fazer sentido por motivos diferentes:

- em `Vender Mais + Volume`, destacar Coxinha no Cardápio significa buscar mais pedidos;
- em `Aumentar Ticket + Margem`, a prioridade seria oferecer adicional ou upsell com Coxinha;
- em `Melhorar Consistência + Margem`, destacar Coxinha só faz sentido se ajudar a preencher um dia/horário fraco sem sacrificar margem;
- em `Fidelizar Clientes + Fidelização`, Coxinha deve entrar como motivo para clientes conhecidos comprarem de novo.

Por isso, cada jogada precisa adaptar:

| Parte do card | Como deve mudar |
|---|---|
| `Fazer` | Deve refletir o objetivo e a estratégia, não só a ação crua. |
| `Vai valer a pena se` | Deve medir sucesso conforme a combinação escolhida. |
| `Por que fazer` | Deve explicar por que aquela ação serve para aquele objetivo. |
| `Checklist` | Deve orientar a execução correta para a combinação. |

Exemplo:

Se a combinação for `Melhorar Consistência + Margem`, a jogada não deve dizer apenas `Dar mais destaque para Coxinha no Cardápio`.

Ela deve explicar:

- fazer: `preencher dias ou horários fracos sem sacrificar margem`;
- sucesso: `entrar venda no período fraco com desconto controlado ou sem desconto`;
- motivo: `Coxinha e Cardápio já mostraram resposta, então podem puxar movimento onde a loja oscila, sem transformar o dia fraco em venda barata`.

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
| `targetMode` | string | Hoje deve ser `flight_plan` para temporadas novas. |
| `targetValue` | number/null | Campo legado. Não deve ser usado como meta principal em temporadas novas. |
| `targetMetric` | string | Métrica principal do objetivo. |
| `planConnection` | object/null | Vínculo com a rota do Plano de Voo usada para definir meta e período. |
| `baselinePeriod` | string | Período usado no baseline, ex: `30d`. |
| `baselineValue` | number/null | Valor base da métrica principal. |
| `baselineRevenue` | number | Faturamento do baseline. |
| `baselineOrders` | number | Pedidos do baseline. |
| `baselineAverageTicket` | number | Ticket médio do baseline. |
| `baselineActiveDays` | number | Dias com venda no baseline. |
| `baselineRecurringCustomers` | number | Clientes recorrentes no baseline. |
| `baselineRepurchaseRate` | number | Taxa estimada de recompra. |
| `baselineConfidence` | string | `high`, `medium` ou `low`. |
| `calculatedTargetValue` | number/null | Valor da meta usado pelo motor, hoje vindo do Plano de Voo. |
| `initialRiskLevel` | string | Risco inicial. |
| `startDate` | ISO date string | Início planejado. |
| `endDate` | ISO date string | Fim planejado. |
| `status` | string | Estado atual. |
| `currentScore` | number | Score atual, 0 a 100. |
| `currentStatus` | string | Ritmo atual. |
| `riskLevel` | string | Chance de falha atual. |
| `progressPercent` | number | Progresso em relação à meta. Pode passar de 100. |
| `scoreBreakdown` | object | Explicação auditável do score: objetivo principal, bônus validado e penalidade de risco. |
| `validatedImpactSignals` | object | Sinais validados por pedidos reais, como cupom usado, promoção usada, upsell aceito, pontos, canal e produto forte. |
| `riskContext` | object | Contexto usado para explicar risco sem substituir o cálculo principal. |
| `seasonReading` | object | Leitura humana da temporada: chamada principal, o que ajuda, o que trava e próxima ação. |
| `executionPlan` | object | Plano operacional gerado pela dificuldade, com tarefas específicas baseadas em histórico e sinais validados. |
| `actionTasks` | array | Acompanhamento das jogadas recomendadas, com prazo, status e evidência encontrada nos pedidos. |
| `actionTaskHistory` | array | Histórico das jogadas que já saíram da rodada atual por execução ou prazo vencido. |
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
| `scoreBreakdown` | Explicação do score usada na leitura atual. |
| `validatedImpactSignals` | Sinais de impacto validados por pedidos reais. |
| `riskContext` | Contexto do risco atual da temporada. |
| `seasonReading` | Leitura humana da temporada. |
| `executionPlan` | Tarefas operacionais específicas da dificuldade escolhida. |
| `actionTasks` | Estado das jogadas recomendadas no ciclo atual. |
| `actionTaskHistory` | Histórico recente das jogadas executadas ou vencidas. |
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

## 7. Base, rota do Plano de Voo e meta

A meta principal da Temporada vem do Plano de Voo. A Temporada deve ajudar a usuária a executar essa rota em um ciclo curto de 30 ou 90 dias.

O baseline por pedidos continua existindo como referência operacional e comparação, mas não deve virar uma meta paralela. Ele ajuda a entender o ritmo, a força dos produtos, o canal, o horário, recompra e sinais que podem orientar a Próxima Jogada.

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

### Regra atual de meta

| Situação | Comportamento esperado |
|---|---|
| Existe rota do Plano de Voo para o período | A Temporada usa a rota como meta. |
| Não existe rota do Plano de Voo | A criação deve orientar a usuária a criar a rota primeiro. |
| Existem pedidos recentes | Usados como sinais para leitura, score e jogadas, não como meta independente. |
| Existe histórico anual completo | Pode fortalecer leituras futuras, mas não substitui a rota ativa sem regra explícita. |

### Como a dificuldade atua hoje

A dificuldade não deve criar uma meta separada. Ela muda a intensidade operacional:

- quantidade de próximas jogadas;
- tolerância do ritmo;
- nível de alerta;
- pressão da execução;
- quantidade de focos em paralelo.

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
- A Próxima Jogada operacional é montada pelo motor determinístico do módulo, usando sinais reais e ranking de oportunidades.
- A IA pode explicar, resumir ou melhorar linguagem, mas não deve decidir score, meta, risco, progresso nem substituir o ranking base.

Campos do contexto enviado:

- objetivo, build, dificuldade, duração, origem da meta;
- meta, baseline, datas;
- score, status, risco, progresso;
- métricas principais e auxiliares;
- alertas;
- faturamento, pedidos, ticket, dias ativos;
- produtos fortes;
- clientes recorrentes;
- `scoreBreakdown`;
- `validatedImpactSignals`;
- `riskContext`;
- `seasonReading`;
- `actionOpportunities`;
- `executionPlan`;
- limitações dos dados.

Tipos de fallback:

| Objetivo | Recomendação local principal |
|---|---|
| `sell_more` | Reforçar melhor produto no melhor período. |
| `increase_ticket` | Criar combo com produto mais vendido. |
| `retain_customers` | Reativar clientes que já compraram. |
| `improve_consistency` | Criar ação para o dia mais fraco. |

### `validatedImpactSignals`

Sinais validados são ações que apareceram em pedido real. O cadastro sozinho não pontua.

| Sinal | Regra |
|---|---|
| Cupom | Só conta quando aparece em pedido válido. |
| Promoção | Só conta quando gerou venda em pedido válido. |
| Upsell | Só conta quando foi aceito/adicionado ao pedido. |
| Pontos | Só conta quando ajudou recompra/resgate real. |
| Canal | Conta pela resposta real em pedidos. |
| Produto | Conta por quantidade e faturamento real. |

### `actionOpportunities`

`actionOpportunities` guarda as possibilidades que o sistema pode usar para montar a Próxima Jogada.

Campos importantes:

| Campo | Descrição |
|---|---|
| `topProduct` | Produto mais forte observado no período. |
| `topProductEconomics` | Preço, custo, margem e limite de desconto saudável do produto forte. |
| `availablePromotion` | Melhor promoção ativa aplicável ao produto, se houver. |
| `availableCoupon` | Melhor cupom ativo que mantém margem saudável, se houver. |
| `availableUpsell` | Melhor upsell aplicável ao produto, se houver. |
| `recommendedAction` | Ação simples de compatibilidade com o fluxo anterior. |
| `rankedActions` | Lista ranqueada de jogadas candidatas para montar o plano por dificuldade. |

### `rankedActions`

Cada item de `rankedActions` deve ter:

| Campo | Descrição |
|---|---|
| `score` | Força da oportunidade. Maior score aparece primeiro. |
| `focusKey` | Foco da jogada. Evita repetir a mesma ideia. |
| `productKey` | Produto da jogada. Evita repetir produto quando há alternativa. |
| `action` | Ação final exibida no card da Próxima Jogada. |

Fontes candidatas atuais:

- promoção validada;
- promoção ativa aplicável;
- upsell disponível/aceito;
- cupom saudável;
- desconto pequeno saudável;
- produto forte;
- canal e horário;
- recompra/pontos;
- consistência/dia fraco.

Regra de seleção:

1. Escolher primeiro ações com foco e produto diferentes.
2. Se faltar ação para a dificuldade, permitir foco diferente no mesmo produto.
3. Se ainda faltar, completar com fallback seguro.
4. Nunca mostrar mais ações do que a dificuldade permite.
5. Antes de escolher as jogadas finais, aplicar a matriz de objetivo + estratégia para reordenar oportunidades.
6. Antes do ranking final, filtrar os tipos de jogada permitidos para a combinação escolhida.

Exemplo:

- se a temporada é `Aumentar Ticket + Margem`, uma oportunidade de upsell deve subir acima de cupom;
- se é `Vender Mais + Volume`, produto forte, canal e promoção leve podem subir;
- se é `Fidelizar Clientes + Fidelização`, recompra, pontos e cupom de retorno sobem;
- se é `Melhorar Consistência + Volume`, dia fraco e horário forte sobem.

Mapa de tipos permitidos por combinação:

| Combinação | Tipos de jogada permitidos |
|---|---|
| `Vender Mais + Volume` | produto forte, canal/horário, promoção, cupom, consistência |
| `Vender Mais + Fidelização` | recompra, cupom de retorno, produto forte, promoção, canal/horário |
| `Aumentar Ticket + Margem` | upsell, desconto saudável, produto de boa margem, promoção controlada |
| `Aumentar Ticket + Fidelização` | upsell, recompra, cupom de retorno, produto conhecido |
| `Fidelizar Clientes + Fidelização` | programa de pontos/recompra, cupom de retorno, produto preferido, promoção de retorno |
| `Fidelizar Clientes + Margem` | recompra com produto de margem, desconto saudável, produto de boa margem, cupom leve |
| `Melhorar Consistência + Volume` | dia fraco, canal/horário, produto forte, promoção leve, cupom |
| `Melhorar Consistência + Fidelização` | dia fraco, cliente recorrente, cupom de retorno, produto repetido, canal/horário |

Para `Fidelização`, o sistema deve explorar primeiro ações que criam retorno:

- programa de pontos ativo ou disponível;
- cupom de retorno;
- cliente que já comprou;
- produto que a cliente costuma repetir;
- promoção apenas quando for uma oferta de retorno, não desconto genérico.

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
- rota do Plano de Voo precisa existir para o período;
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

- rota do Plano de Voo não encontrada;
- dificuldade agressiva com baixa confiança de leitura;
- estratégia desalinhada com objetivo;
- poucos pedidos para leitura operacional;
- conflito com outra temporada no período.

## 15. O que está funcionando hoje

- Criação de temporada por wizard.
- Meta vinculada ao Plano de Voo.
- Baseline por pedidos recentes como leitura operacional.
- Temporadas ativas e programadas.
- Promoção automática de programada para ativa quando chega a data.
- Trava de sobreposição.
- Trava de uma temporada ativa por tenant.
- Recalculo de score, progresso, ritmo e risco.
- Snapshots diário, semanal e final.
- Recomendação de Próxima Jogada com ranking de oportunidades e fallback local.
- Próximas jogadas específicas por dificuldade.
- Avaliação de produto, canal, horário, cupom, promoção, upsell, pontos e recompra com base em pedidos reais.
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
- Ampliar o ranking da Próxima Jogada com novas ações, sempre exigindo dado real ou regra segura.
- Definir como promoções, cupons e campanhas devem impactar resultado sem premiar crescimento ruim.

## 17. Recomendações objetivas

Para lançamento:

- Manter Temporadas focadas em pedidos, ticket, dias ativos, recorrência básica e score operacional.
- Tratar margem, promoções, upsell e financeiro como sinais auxiliares validados até haver dados mais confiáveis.
- Não usar estoque, desperdício ou lucro real por venda como regra principal ainda.
- Garantir que `orders.createdAt`, `orders.total`, `orders.status`, cliente e itens estejam consistentes.
- Validar manualmente os quatro resultados finais com tenants de teste.
- Ao adicionar novas possibilidades de ação, inserir no ranking de oportunidades com `focusKey`, `productKey`, `score`, `why` e `checklist`, sem criar recomendação solta.

Para próxima etapa técnica:

- Separar `Maturidade do Negócio` de `Temporadas` também em arquivos/módulos próprios.
- Extrair cálculo para serviços testáveis.
- Criar testes unitários para baseline, meta automática, score, risco, snapshots e resultado final.
- Documentar índices Firestore necessários.
- Fechar a definição de abandono de temporada.

## 18. Estrutura executada da aba Próxima Jogada

A aba `Próxima Jogada` foi organizada para trabalhar como orientação operacional, não como relatório técnico.

Estrutura aplicada:

- leitura da semana no topo, explicando quanto ainda falta ou qual foco operacional faz sentido;
- jogadas ativas em cards independentes;
- cada jogada mostra título, objetivo, por que fazer, prazo, status, checklist e resultado;
- cada jogada mostra uma estrutura prática de `Fazer`, `Até quando` e `Vai valer a pena se`, para orientar ação sem linguagem técnica;
- cada jogada possui botões de ação para levar a usuária ao módulo certo;
- resumo `O que aconteceu`, separando jogadas com resultado, sem resposta, em andamento e vendas ligadas;
- histórico `Jogadas que já passaram`, preservando aprendizado;
- bloco `Aprendizado da temporada`, com leitura simples sobre o que repetir ou mudar.

Botões disponíveis por tipo de jogada:

- promoção: abre `Ações de Vendas > Promoções`;
- cupom/desconto saudável: abre `Ações de Vendas > Cupons`;
- upsell: abre `Ações de Vendas > Upsell`;
- produto/destaque: abre `Cardápio > Produtos`;
- fidelização/pontos: abre `Clientes` ou `Programa de Pontos`;
- canal, horário ou consistência: abre `Performance`.

Ao clicar em um botão de ação, o sistema salva em `sessionStorage` um rascunho leve com:

- `seasonId`;
- `seasonActionId`;
- tipo de ação;
- origem da jogada;
- produto/foco quando existir;
- título da jogada;
- data de criação do rascunho.

Para Promoções, Cupons e Upsell, esse rascunho já é consumido pelo módulo de Marketing: o botão abre a aba correta, o modal de cadastro é aberto automaticamente e o salvamento registra o vínculo da ação criada com a jogada da Temporada. Para destaques, clientes, pontos e performance, o botão ainda funciona como navegação contextual segura.

Fluxo executado para ações de venda:

- ao clicar em `Criar promoção`, `Criar cupom` ou `Criar upsell`, o BocaFood abre a aba correta em `Ações de Vendas`;
- o módulo de Marketing lê o rascunho da jogada e abre automaticamente o modal de cadastro;
- ao salvar, o registro criado recebe `createdFromSeasonAction`, `seasonId`, `seasonActionId`, `seasonActionType`, `seasonActionTitle`, `seasonActionSource`, `seasonActionProductKey` e `seasonActionFocusKey`;
- a temporada também recebe no `actionTasks` o `expectedActionType`, `expectedActionId`, `expectedActionCollection` e uma evidência de criação;
- depois disso, a execução fica aguardando pedido real para virar resultado.

Isso separa:

- ação criada: a usuária colocou a jogada em prática;
- ação com resultado: a ação apareceu em pedido válido;
- ação sem resultado: a ação foi criada, mas não trouxe venda no prazo.

Regra mantida:

- a dificuldade continua definindo o número de jogadas ativas;
- jogadas concluídas ou vencidas saem da rodada atual;
- o histórico é preservado;
- uma nova jogada pode entrar no lugar da anterior;
- o score, risco e progresso continuam determinísticos e auditáveis.

## 19. Diretriz para uso de OpenAI nas Próximas Jogadas

A OpenAI pode ser usada para melhorar a inteligência textual e a clareza das Próximas Jogadas, mas não deve substituir o motor determinístico do BocaFood.

Regra principal:

`BocaFood calcula e limita as possibilidades -> OpenAI interpreta e escreve melhor -> BocaFood salva e acompanha`

A IA pode ajudar a:

- transformar dados calculados em uma orientação mais humana;
- escolher a melhor forma de explicar a jogada;
- reduzir copy genérica;
- montar uma ação mais específica com produto, canal, horário e motivo;
- adaptar o tom conforme objetivo, estratégia e dificuldade;
- explicar por que aquela jogada faz sentido para o momento da loja.

A IA não pode:

- calcular score;
- calcular meta;
- calcular risco;
- calcular progresso;
- inventar produto;
- inventar margem;
- inventar promoção, cupom ou upsell;
- recomendar desconto sem preço, custo e margem calculados pelo BocaFood;
- alterar Firestore diretamente;
- substituir a validação por pedidos reais.

Contexto mínimo que deve ser enviado para a IA:

- objetivo da temporada;
- estratégia operacional;
- dificuldade;
- rota do Plano de Voo;
- produto forte;
- canal forte;
- horário forte;
- dias fracos;
- margem/custo/preço do produto quando houver;
- promoções, cupons e upsells disponíveis;
- promoções, cupons e upsells que já deram resultado;
- jogadas anteriores e seus resultados;
- opções seguras já montadas pelo BocaFood.

Formato esperado da resposta:

- título da jogada;
- o que fazer;
- por que fazer;
- prazo sugerido;
- como saber se deu certo;
- checklist de execução;
- cuidado ou limite da ação, quando houver.

Essa camada deve ser tratada como apoio de linguagem e decisão assistida, não como fonte de verdade do cálculo.

Implementação segura:

- a chave da OpenAI deve ficar somente no servidor, em `OPENAI_API_KEY`;
- o navegador nunca deve receber a chave;
- no Firebase Functions, usar Secret Manager com `OPENAI_API_KEY`;
- no servidor local, usar variável de ambiente `OPENAI_API_KEY`;
- o Master pode salvar uma chave em `system_private_ai_secrets/default` para facilitar configuração operacional;
- a Function deve usar `OPENAI_API_KEY` se existir no ambiente e, se não existir, usar `system_private_ai_secrets/default.openaiApiKey`;
- o Master nunca deve devolver a chave salva para a tela, apenas o status `configurada` ou `não configurada`;
- o frontend envia apenas contexto agregado da temporada e token do usuário logado;
- a resposta precisa ser validada como JSON antes de voltar ao Admin;
- se a OpenAI falhar, o BocaFood usa fallback local sem travar a Temporada;
- a IA não escreve direto no Firestore; qualquer persistência continua passando pelo módulo de Temporadas.
