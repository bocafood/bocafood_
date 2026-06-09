# Documento tecnico - Como o BocaFood cria as jogadas de Temporadas

Este documento descreve, em detalhe, como o BocaFood cria as jogadas exibidas na area de Temporadas: de onde os dados saem, como o motor deterministico escolhe oportunidades, como a IA recebe o contexto, como o prompt e montado, quais regras a IA deve seguir, como a resposta e validada e como o sistema mede se a jogada funcionou.

O objetivo e deixar claro que a jogada nao deve ser uma tarefa generica. Ela deve ser uma ficha guiada e executavel dentro do BocaFood, com uma acao real, modulo real, botao real, dado faltante ou oportunidade real, motivo e proximo passo claro.

## 1. Principio central

A criacao de jogadas tem duas camadas:

1. Motor deterministico do BocaFood.
2. IA de orientacao operacional guiada.

O BocaFood entrega para a IA a leitura operacional e mensuravel do negocio, priorizando os ultimos 60 dias ou todo o historico disponivel quando a base for menor. Essa leitura inclui produtos, canais, clientes, acoes de venda existentes, problemas de cadastro, disponibilidade de botoes/rotas e estrutura interna de medicao.

O motor deterministico continua controlando:

- quantidade maxima de jogadas;
- prazo;
- janela de resultado;
- score;
- risco;
- progresso;
- status;
- sinais validados;
- oportunidades e problemas operacionais;
- estrutura de medicao;
- campos que permitem o BocaFood ler o resultado depois.

A IA nao calcula score, margem, risco, meta, progresso ou resultado. A IA nao inventa produto, cliente, cupom, promocao, upsell, margem, custo, pedido, rota, botao, tela ou resultado. A IA transforma a leitura recebida em uma jogada guiada, pratica e executavel dentro do BocaFood, respeitando os dados, modulos, botoes, acoes e medicoes disponiveis.

Em termos simples:

- o BocaFood informa o que esta acontecendo e o que o sistema consegue abrir, criar, corrigir ou medir;
- a IA transforma isso em uma ficha simples para a usuaria saber exatamente o proximo clique.

## 2. Arquivos principais

Os arquivos principais envolvidos hoje sao:

- `public/js/modules/temporadas.js`
- `public/js/services/seasons.ai.js`
- `functions/index.js`

Papel de cada um:

`public/js/modules/temporadas.js`

- calcula metricas da temporada;
- identifica sinais de venda;
- monta oportunidades de acao;
- ranqueia jogadas;
- cria o plano de execucao;
- monta `measurement`;
- monta `commercialPlay`;
- controla cache por snapshot diario;
- chama o servico de IA;
- salva recomendacao no snapshot e na temporada;
- renderiza a ficha comercial na tela.

`public/js/services/seasons.ai.js`

- contem o prompt principal (`AI_PROMPT`);
- monta o contexto compacto para IA (`buildSeasonAIContext`);
- chama o endpoint remoto (`generateSeasonActionRecommendation`);
- valida e normaliza a resposta localmente;
- cria fallback local quando a OpenAI nao esta disponivel.

`functions/index.js`

- expõe o endpoint `seasonsAiRecommendation`;
- valida autenticacao;
- carrega configuracao da OpenAI;
- envia prompt e contexto para a OpenAI;
- exige resposta em JSON;
- valida e limita os campos retornados;
- registra uso em `system_ai_usage`;
- evita salvar prompt completo ou payload grande em log.

## 3. Fluxo completo de criacao da jogada

O fluxo, em ordem, e este:

1. A temporada tem objetivo, prioridade, dificuldade, periodo e meta.
2. O BocaFood calcula metricas do periodo.
3. O BocaFood identifica sinais validados.
4. O BocaFood monta oportunidades comerciais possiveis.
5. O BocaFood ranqueia essas oportunidades.
6. O BocaFood aplica pesos de objetivo e prioridade.
7. O BocaFood escolhe de 1 a 3 jogadas conforme a dificuldade.
8. Cada jogada recebe `measurement`.
9. Cada jogada recebe `commercialPlay`.
10. O contexto compacto e montado para a IA.
11. O prompt principal e enviado como mensagem de sistema.
12. O contexto sem o campo `prompt` e enviado como mensagem de usuario.
13. A IA retorna JSON com leitura e, quando possivel, ficha comercial.
14. O backend valida e corta tamanhos.
15. O frontend salva a recomendacao no snapshot diario.
16. A tela exibe a jogada como ficha comercial.
17. O BocaFood acompanha pedidos, cupons, promocoes, upsells, canais e clientes para ler resultado.

## 4. O que a Temporada usa como entrada

A jogada nasce de dados compactos da propria operacao. O sistema nao deve inventar dado.

Entradas principais:

- objetivo da temporada;
- prioridade da temporada;
- dificuldade;
- datas de inicio e fim;
- dias passados;
- dias restantes;
- meta;
- progresso;
- risco;
- status;
- score atual;
- historico anterior;
- pedidos do periodo;
- ticket medio;
- produtos mais vendidos;
- produtos com baixa saida;
- canais de venda;
- taxas, comissoes e descontos por canal;
- cupons existentes;
- promocoes existentes;
- upsells existentes;
- programa de pontos;
- clientes recorrentes;
- sinais de recompra;
- combinacoes reais vendidas;
- cardapio/catalogo;
- historico recente de jogadas;
- tarefas abertas, expiradas ou com resultado.

O sistema tambem usa a configuracao do negocio quando disponivel:

- canais cadastrados;
- canais pouco explorados;
- produtos do cardapio;
- menus e combos;
- escolhas internas;
- produtos com preco e custo;
- margem aproximada;
- alavancas de venda disponiveis.

## 5. Objetivo, prioridade e dificuldade

### 5.1 Objetivo da Temporada

O objetivo define o resultado principal que a temporada quer puxar.

Objetivos tratados nas jogadas:

- vender mais;
- aumentar ticket;
- reter clientes;
- melhorar consistencia.

O objetivo nao cria uma trava absoluta. Ele orienta o tipo de jogada preferida.

Exemplo:

Se o objetivo e aumentar ticket, o sistema tende a preferir upsell, combo, adicional e produto complementar. Mas, se houver uma promocao validada que vendeu muito e o contexto mostrar oportunidade mais forte, o motor pode considerar essa oportunidade.

### 5.2 Prioridade da Temporada

No codigo, a prioridade pode aparecer como `build`.

Ela orienta por onde comecar a leitura:

- volume;
- melhor sobra/margem;
- retencao.

A prioridade ajusta pesos, mas nao bloqueia outras jogadas.

Exemplo:

Uma temporada de "vender mais" com prioridade "melhor sobra" nao deve simplesmente mandar dar desconto. Ela deve tentar vender mais preservando margem, preferindo produto forte, upsell, canal mais saudavel ou desconto pequeno calculado.

### 5.3 Dificuldade

A dificuldade controla intensidade operacional.

Seguro:

- label: `Seguro`;
- cadencia: 1 acao principal por vez;
- maximo de jogadas: 1;
- prazo de acao: 7 dias;
- janela de resultado: 15 dias;
- tolerancia maior para ajustar o caminho.

Equilibrado:

- label: `Equilibrado`;
- cadencia: ate 2 acoes praticas;
- maximo de jogadas: 2;
- prazo de acao: 5 dias;
- janela de resultado: 7 dias;
- uma acao principal e uma de apoio.

Agressivo:

- label: `Agressivo`;
- cadencia: ate 3 acoes especificas;
- maximo de jogadas: 3;
- prazo de acao: 3 dias;
- janela de resultado: 5 dias;
- acompanhamento mais proximo.

A IA nao pode aumentar nem diminuir essa quantidade. Se o motor deterministico entregou uma jogada em modo Seguro, a IA nao deve criar outras duas.

## 6. Tipos de acao de venda permitidos

A IA so pode usar as acoes de venda que o BocaFood conhece.

Tipos permitidos:

1. Cupom.
2. Promocao.
3. Upsell.
4. Combo/Menu.
5. Pontos/Reativacao de cliente.
6. Ajuste de preco/desconto saudavel.
7. Canal de venda.
8. Revisao de produto parado.
9. Criar base de leitura.

Esses tipos existem para impedir jogadas genericas como:

- "faca uma acao concreta";
- "melhore a divulgacao";
- "reforce a oferta";
- "crie uma estrategia";
- "teste uma comunicacao";
- "acompanhe os resultados".

A jogada precisa dizer explicitamente qual acao deve ser criada, ativada ou usada.

Exemplos validos:

- "Use o cupom VOLTA10 com Coxinha XL no Cardapio."
- "Ative a promocao Menu Almoco para Menu Executivo."
- "Cadastre o upsell Bebida 330ml junto de Pizza Individual."
- "Monte o combo Empanada + Bebida."
- "Chame clientes com pontos para comprar Coxinha XL."
- "Ajuste o desconto de Coxinha XL para no maximo 10%."
- "Revise o produto Brigadeiro Grande porque ele esta parado."
- "Crie base de leitura registrando produto, canal e pagamento nos proximos pedidos."

Exemplos invalidos:

- "Crie uma acao concreta."
- "Faca uma acao objetiva."
- "Transforme isso em acao."
- "Destaque o produto."
- "Reforce o canal."
- "Use melhor os clientes."

## 7. Como o motor encontra oportunidades

A funcao principal de oportunidades fica em `temporadas.js`:

- `_buildActionOpportunities`
- `_buildRankedActionOpportunities`

O sistema pega:

- produto mais forte;
- lista de produtos com sinal;
- canal mais forte;
- economia do produto;
- promocao aplicavel;
- cupom aplicavel;
- upsell aplicavel;
- complemento possivel;
- recompra;
- pontos;
- dias fracos;
- historico de promocoes, cupons e upsells;
- margem depois de desconto;
- comissao/taxa por canal quando disponivel.

Depois transforma isso em candidatos de jogada.

Cada candidato tem:

- score base;
- foco;
- produto;
- titulo;
- descricao;
- motivo;
- checklist;
- source;
- prioridade;
- measurement;
- commercialPlay.

## 8. Como o ranking funciona

O ranking nao e aleatorio. O motor cria candidatos e atribui pontos.

### 8.1 Produto forte

Para cada produto analisado, o sistema calcula uma base aproximada:

- comeca em 70;
- reduz conforme a posicao do produto na lista;
- soma pontos por quantidade vendida;
- soma pontos por receita gerada.

Isso faz um produto que vendeu mais e gerou mais receita subir no ranking.

### 8.2 Promocao ja validada

Se uma promocao ja apareceu em pedido real, ela recebe prioridade muito alta.

Pontuacao usada:

- 110 pontos.

Motivo:

- a promocao nao e apenas uma ideia;
- ela ja gerou venda real;
- repetir algo validado pode ser mais seguro do que inventar uma nova acao.

### 8.3 Promocao disponivel

Se existe promocao ativa aplicavel ao produto e ela parece saudavel:

- score base + 28.

O motor olha se a promocao pode ser usada sem destruir margem, quando ha preco/custo suficiente.

### 8.4 Upsell

Se existe upsell aplicavel:

- score base + 26 quando ja houve upsell aceito em pedido;
- score base + 18 quando existe upsell disponivel, mas ainda sem prova forte.

Regra importante:

- upsell so pode ser jogada do canal Cardapio.

Se o canal forte for outro canal que nao aceita upsell, a jogada de upsell deve ser evitada ou reinterpretada.

### 8.5 Cupom

Se existe cupom aplicavel:

- score base + 16.

O cupom deve aparecer com codigo real quando existir.

Exemplo:

- "Use o cupom VOLTA10 com Coxinha XL."

Se nao existir cupom, a IA pode dizer:

- "Crie um cupom para Coxinha XL."

Mas nao deve fingir um codigo.

### 8.6 Desconto saudavel

Se o produto tem preco e custo, o sistema pode calcular limite de desconto saudavel.

Pontuacao:

- score base + 10.

Regra:

- o desconto so deve ser recomendado se houver preco, custo, margem e limite saudavel no contexto.

Sem esses dados, a jogada nao deve mandar dar desconto.

### 8.7 Canal de venda

Se existe canal com sinal forte, o sistema cria candidato de canal.

Pontuacao:

- 76 pontos.

O canal nao deve ser escolhido apenas por volume. O prompt manda considerar:

- margem liquida;
- taxas;
- comissoes;
- descontos;
- saude do canal.

### 8.8 Recompra e pontos

Se existe recorrencia relevante, recompra ou pontos:

- 70 pontos.

Essa jogada deve falar de publico.

Exemplos:

- "Chame clientes que ja compraram antes."
- "Chame clientes com pontos."
- "Use produto X como motivo para recompra."

### 8.9 Consistencia

Se existem dias fracos:

- 64 pontos.

A jogada deve buscar preencher um buraco da operacao, mas sem usar horario como criterio principal da IA.

O prompt proibe usar horario como criterio para criar, priorizar ou explicar a jogada.

## 9. Como objetivo e prioridade mexem no ranking

Depois de criar os candidatos, o sistema aplica pesos por objetivo e prioridade.

A funcao responsavel e:

- `_applySeasonActionStrategy`
- `_seasonActionStrategyProfile`

### 9.1 Objetivo vender mais

Boosts:

- produto: +18;
- canal: +16;
- promocao: +14;
- cupom: +8;
- upsell: +4;
- retencao: -4.

Leitura:

- o motor prefere produto forte, canal forte e promocao;
- retencao perde prioridade se o objetivo principal e volume imediato.

### 9.2 Objetivo aumentar ticket

Boosts:

- upsell: +28;
- desconto saudavel: +10;
- produto: +8;
- promocao: +2;
- cupom: -10;
- canal: +2;
- retencao: -8.

Leitura:

- upsell e principal;
- cupom perde peso, porque desconto pode subir volume mas baixar ticket/margem;
- combo e complemento fazem mais sentido que desconto forte.

### 9.3 Objetivo reter clientes

Boosts:

- retencao: +30;
- cupom: +14;
- produto: +8;
- promocao: +4;
- canal: +4;
- upsell: -6;
- source `points`: +18.

Leitura:

- recompra, pontos e cliente conhecido ganham prioridade;
- cupom pode ser usado como motivo de retorno;
- upsell perde peso porque nao e o caminho principal de recompra.

### 9.4 Objetivo melhorar consistencia

Boosts:

- consistencia: +30;
- canal: +22;
- produto: +12;
- promocao: +6;
- cupom: +2;
- retencao: +6;
- upsell: -4.

Leitura:

- foco em reduzir os buracos da operacao;
- canal e produto importam bastante;
- upsell nao e o melhor caminho para consistencia.

### 9.5 Prioridade volume

Boosts:

- produto: +10;
- canal: +8;
- promocao: +8;
- cupom: +5;
- consistencia: +5.

### 9.6 Prioridade margem

Boosts:

- upsell: +12;
- desconto saudavel: +10;
- produto: +8;
- promocao: -4;
- cupom: -8;
- retencao: -2.

Leitura:

- evita desconto pesado;
- favorece upsell, produto com boa sobra e desconto controlado.

### 9.7 Prioridade retencao

Boosts:

- retencao: +16;
- cupom: +10;
- consistencia: +6;
- produto: +3;
- promocao: -2;
- upsell: -4;
- source `points`: +12.

Leitura:

- favorece cliente conhecido, recompra, pontos e cupom de retorno.

## 10. Como o sistema evita jogadas repetidas

A selecao de jogadas evita repetir:

- mesmo id;
- mesmo foco;
- mesmo produto;
- jogadas ja concluidas ou terminais.

A funcao responsavel e:

- `_selectRankedSeasonActions`

Ela tenta selecionar em tres passagens:

1. Primeiro, exige produto diferente e foco diferente.
2. Depois, relaxa produto, mas mantem foco diferente.
3. Por fim, relaxa foco se ainda faltar jogada.

Isso e importante quando a dificuldade permite 2 ou 3 jogadas. Cada uma deve ter uma diferenca real:

- outro produto;
- outro canal;
- outro publico;
- outro mecanismo de venda;
- outra combinacao.

## 11. Quando nao existe pedido suficiente

Se a temporada ainda nao tem pedidos no periodo, o sistema nao deve fingir que existe produto vencedor.

Nesse caso, a jogada e de base:

- registrar pedidos;
- registrar produto;
- registrar canal;
- registrar forma de pagamento;
- manter a operacao rodando ate existir leitura real.

Exemplo:

"Crie base de leitura registrando os proximos pedidos com produto, canal e pagamento corretos."

Essa jogada existe porque o BocaFood so consegue recomendar com seguranca depois de ler dados reais.

## 12. Estrutura interna da jogada

A jogada criada por `_seasonAction` recebe campos basicos:

- `id`;
- `title`;
- `description`;
- `why`;
- `source`;
- `priority`;
- `checklist`.

Depois `_decorateSeasonActionMeasurement` adiciona:

- `focusKey`;
- `productKey`;
- `productName`;
- `channel`;
- `couponCode`;
- `promotionName`;
- `upsellName`;
- `customerGroup`;
- `successMetric`;
- `goalText`;
- `successText`;
- `measurable`;
- `commercialPlay`;
- `measurement`.

Isso transforma uma tarefa em uma jogada mensuravel.

## 13. Measurement: como o BocaFood mede

O campo `measurement` e a regra de leitura da jogada.

Campos possiveis:

- `type`;
- `productName`;
- `productKey`;
- `channel`;
- `hour`;
- `couponCode`;
- `promotionName`;
- `upsellName`;
- `customerGroup`;
- `successMetric`.

Tipos comuns:

- `coupon`;
- `promotion`;
- `upsell`;
- `product`;
- `channel`;
- `retention`;
- `points`;
- `healthy_discount`;
- `baseline`;
- `consistency`.

O BocaFood usa esses campos para procurar resultado em pedidos, cadastros ou historico.

Exemplos:

Cupom:

- procurar pedido com cupom X;
- produto Y se estiver definido;
- canal Z se estiver definido;
- dentro do prazo da jogada.

Promocao:

- procurar pedido com promocao X;
- produto Y se estiver definido;
- dentro do prazo.

Upsell:

- procurar pedido com extra/upsell aceito;
- canal Cardapio;
- produto de entrada se estiver definido.

Recompra:

- procurar pedido de cliente que ja comprou antes;
- ou cliente com pontos;
- ou grupo definido no `customerGroup`.

Base:

- procurar pelo menos um pedido com produto, canal e pagamento preenchidos.

## 14. CommercialPlay: a ficha comercial

A ficha comercial e o formato ideal da jogada.

Campos:

- `title`;
- `summary`;
- `actionType`;
- `actionName`;
- `productName`;
- `combinationName`;
- `channelName`;
- `customerGroup`;
- `whatToDo`;
- `whyThis`;
- `expectedResult`;
- `howBocaFoodReads`;
- `ifNoResult`.

O objetivo da ficha e responder:

- qual acao de venda usar;
- qual produto ou combinacao usar;
- em qual canal ou para qual publico;
- por que essa jogada faz sentido;
- qual resultado deve aparecer;
- como o BocaFood vai reconhecer resultado;
- o que nao repetir se nao funcionar.

Exemplo de ficha:

```json
{
  "title": "Use o cupom VOLTA10 com Coxinha XL no Cardapio",
  "actionType": "Cupom",
  "actionName": "VOLTA10",
  "productName": "Coxinha XL",
  "combinationName": "",
  "channelName": "Cardapio",
  "customerGroup": "clientes que ja compraram",
  "whatToDo": "Use o cupom VOLTA10 com Coxinha XL no Cardapio para clientes que ja compraram nos ultimos dias.",
  "whyThis": "Coxinha XL apareceu como produto forte e o Cardapio preserva melhor margem que canais com comissao.",
  "expectedResult": "Entrar pelo menos 1 pedido com Coxinha XL e cupom VOLTA10 no Cardapio dentro do prazo.",
  "howBocaFoodReads": "O BocaFood vai procurar pedidos com produto Coxinha XL, canal Cardapio e cupom VOLTA10 dentro do prazo da jogada.",
  "ifNoResult": "Se nao vender, nao repita o mesmo cupom do mesmo jeito. Troque produto, beneficio ou canal antes de tentar de novo."
}
```

## 15. Como o tipo comercial e inferido

Quando a jogada nao traz `commercialPlay` completo, o BocaFood tenta inferir.

Mapeamento por `source`:

- `coupons` vira `Cupom`;
- `promotions` vira `Promocao`;
- `upsell` vira `Upsell`;
- `points` ou `retention` vira `Pontos/Reativacao`;
- `healthy_discount` vira `Ajuste de preco`;
- `baseline` vira `Criar base de leitura`.

Tambem existe inferencia por texto:

- texto com "cupom" vira Cupom;
- texto com "promocao" vira Promocao;
- texto com "upsell", "adicional" ou "extra" vira Upsell;
- texto com "combo" ou "menu" vira Combo/Menu;
- texto com "pontos", "reativacao" ou "recompra" vira Pontos/Reativacao;
- texto com "preco", "desconto" ou "margem" vira Ajuste de preco;
- texto com "produto parado" vira Revisao de produto parado.

## 16. Como o prompt e criado

O prompt principal fica em:

- `public/js/services/seasons.ai.js`
- variavel `AI_PROMPT`

Ele e montado como uma lista de frases unidas por quebra de linha.

Estrutura:

```js
var AI_PROMPT = [
  'instrucao 1',
  'instrucao 2',
  'instrucao 3'
].join('\n');
```

Esse prompt vira a mensagem de sistema da chamada para OpenAI.

No backend, em `functions/index.js`, o endpoint usa:

- `prompt = context.prompt` quando o frontend enviou;
- um prompt fallback menor se o contexto nao trouxer prompt.

Depois envia para a OpenAI:

- mensagem `system`: o prompt;
- mensagem `user`: instrucoes curtas + contexto JSON seguro.

O campo `prompt` e removido do contexto antes de enviar o JSON como mensagem de usuario por `safeSeasonAIContext`.

Isso evita duplicar o prompt dentro do payload analisado.

## 17. O que vai no prompt

O prompt diz para a IA:

- ser copiloto operacional de pequeno negocio de comida;
- usar apenas os dados fornecidos;
- ler primeiro temporada, status, dados operacionais, plano de execucao, sinais, risco, snapshots, confianca, possibilidades do negocio e historico de jogadas;
- entender que o Plano de Voo define direcao maior;
- entender que a Temporada cria jogadas de curto prazo;
- respeitar a dificuldade;
- nao calcular score, meta, risco ou progresso;
- nao alterar quantidade de jogadas, prazos, status, resultado, score ou risco;
- transformar dados em orientacao pratica;
- nao inventar numeros, clientes, campanhas ou metricas;
- criar apenas jogadas mensuraveis;
- nao transformar em jogada algo que o BocaFood nao consegue ler;
- escolher apenas tipos permitidos de acao de venda;
- dizer explicitamente qual acao criar, ativar ou usar;
- nao usar frases genericas;
- usar nome ou codigo real de cupom, promocao ou upsell quando existir;
- dizer "Crie um cupom", "Crie uma promocao", "Cadastre um upsell", "Monte um combo", "Chame clientes com pontos" ou "Ajuste o preco/desconto" quando a acao ainda nao existir;
- preservar measurement recebido;
- nao usar horario como criterio;
- usar inteligencia comercial dos ultimos 30 dias;
- considerar canais, margem, taxas e descontos;
- usar caminhos recomendados quando existirem;
- evitar repetir jogada sem resposta;
- diferenciar jogadas quando houver mais de uma;
- usar combinacoes reais de menu quando existirem;
- nao recomendar desconto sem preco/custo/margem;
- tratar upsell apenas como Cardapio;
- retornar JSON valido;
- montar `commercialPlay` quando houver clareza suficiente.

## 18. Direcoes especificas do prompt

### 18.1 Nao inventar

A IA nao pode criar:

- nome falso de cupom;
- nome falso de promocao;
- nome falso de upsell;
- cliente especifico que nao existe;
- numero de pedidos nao informado;
- margem nao calculada;
- campanha inexistente;
- horario vencedor quando isso nao veio dos dados.

Se nao existir dado, ela deve dizer que a jogada e de aprendizado/base.

### 18.2 Usar acao real do BocaFood

A proxima jogada deve comecar com verbo explicito:

- Crie;
- Ative;
- Use;
- Cadastre;
- Monte;
- Chame;
- Ajuste;
- Revise.

Exemplo bom:

"Cadastre um upsell de Bebida 330ml junto de Pizza Individual no Cardapio."

Exemplo ruim:

"Transforme Pizza Individual em uma acao concreta."

### 18.3 Preferir objeto real quando existir

Se o contexto tem:

- cupom `VOLTA10`;
- promocao `Menu Almoco`;
- upsell `Bebida 330ml`;

a IA deve usar esses nomes.

Ela nao deve trocar por:

- "um cupom";
- "uma promocao";
- "um extra";
- "uma oferta".

### 18.4 Criar quando nao existe objeto pronto

Se nao existe cupom aplicavel, mas o melhor caminho e cupom, a IA deve dizer:

"Crie um cupom para Produto X."

Se nao existe upsell pronto, mas o objetivo e aumentar ticket, deve dizer:

"Cadastre um upsell para Produto X no Cardapio."

Isso evita a frase vaga "crie uma acao de venda".

### 18.5 Nao usar horario como recomendacao

O prompt permite que horario exista nos dados, mas proibe usar horario como criterio para criar, priorizar ou explicar jogada.

Motivo:

- horario pode ser ruidoso;
- em negocios pequenos, poucos pedidos podem distorcer a leitura;
- a jogada deve ser mais ligada a produto, canal, acao de venda e publico.

### 18.6 Desconto so com base economica

A IA nao deve recomendar desconto se nao houver:

- preco;
- custo;
- margem;
- limite de desconto saudavel.

Sem isso, deve preferir:

- upsell;
- combo;
- produto forte;
- canal melhor;
- base de leitura;
- chamada para cliente;
- revisao de produto.

### 18.7 Venda ligada nao encerra jogada sozinha

O prompt deixa claro:

- venda ligada a jogada e sinal de leitura;
- nao e motivo para trocar automaticamente a jogada antes da janela de resultado.

Isso evita a criacao automatica precipitada de nova jogada.

## 19. Contexto enviado para IA

A funcao responsavel e:

- `buildSeasonAIContext`

Ela retorna um objeto com:

- `prompt`;
- `contextMode`;
- `season`;
- `status`;
- `operationalData`;
- `executionPlan`;
- `riskContext`;
- `snapshots`;
- `confidence`;
- `cache`.

### 19.1 season

Campos principais:

- `id`;
- `objective`;
- `build`;
- `priority`;
- `priorityMeaning`;
- `difficulty`;
- `durationType`;
- `targetMode`;
- `targetValue`;
- `calculatedTargetValue`;
- `baselineValue`;
- `startDate`;
- `endDate`;
- `daysElapsed`;
- `daysRemaining`.

O campo `priorityMeaning` explica para a IA que prioridade ajusta leitura, mas nao bloqueia outras jogadas.

### 19.2 status

Campos principais:

- `currentScore`;
- `currentStatus`;
- `riskLevel`;
- `progressPercent`;
- `scoreBreakdown`;
- `validatedImpactSignals`;
- `seasonReading`;
- `executionPlan`;
- `mainMetrics`;
- `auxiliaryMetrics`;
- `alerts`.

Importante:

`scoreBreakdown` e `validatedImpactSignals` sao dados para leitura. A IA nao deve recalcular.

### 19.3 operationalData

Campos principais:

- receita do periodo atual;
- receita do periodo anterior;
- pedidos do periodo atual;
- pedidos do periodo anterior;
- ticket medio;
- mudanca de ticket medio;
- dias ativos de venda;
- dias fracos;
- dias fortes;
- produtos fortes;
- produtos com baixa saida;
- clientes recorrentes;
- taxa de recompra;
- media de avaliacoes;
- uso de cupom;
- uso de promocao;
- uso de upsell;
- descontos de cupom;
- descontos de promocao;
- descontos de upsell;
- receita adicional de upsell;
- resgate de pontos;
- desconto por pontos;
- canais;
- oportunidades de acao;
- inteligencia comercial.

### 19.4 executionPlan

O `executionPlan` e a fonte principal da proxima jogada quando existe.

Ele traz:

- dificuldade;
- perfil de dificuldade;
- acoes;
- prazos;
- limites de alerta;
- origem do plano.

Cada acao pode trazer:

- titulo;
- descricao;
- motivo;
- checklist;
- source;
- prioridade;
- measurement;
- commercialPlay.

A IA deve priorizar essas acoes e melhorar clareza. Ela nao deve criar outra coisa ignorando o plano.

### 19.5 riskContext

Campos:

- nivel de risco;
- status atual;
- progresso;
- razao de progresso;
- dias restantes.

A IA usa isso para ajustar tom e urgencia, mas nao para recalcular risco.

### 19.6 snapshots

Snapshots trazem resumo diario ou agregado.

O snapshot e usado para:

- manter historico;
- cachear recomendacao;
- comparar mudanca de contexto;
- salvar recomendacao de IA ligada ao dia.

### 19.7 confidence

Campos:

- confianca da base;
- confianca dos dados;
- metricas indisponiveis.

Se a confianca e baixa, a IA deve recomendar base/aprendizado ou jogada de baixo risco, nao fingir certeza.

### 19.8 cache

Campos:

- `hash`;
- `size`;
- `triggerReason`.

O hash permite reutilizar a recomendacao quando o contexto nao mudou.

## 20. Inteligencia comercial dos ultimos 30 dias

O contexto tambem inclui `salesIntelligence`.

Ela compacta informacoes uteis para a IA:

- periodo analisado;
- receita;
- pedidos;
- ticket medio;
- dias ativos;
- top produtos;
- top canais;
- produtos com baixa saida;
- combinacoes reais de menu;
- desempenho de acoes;
- acoes disponiveis;
- possibilidades do negocio;
- historico de jogadas;
- programa de pontos;
- sinais de clientes.

O objetivo e permitir jogada mais especifica.

Sem isso, a IA tenderia a falar:

"faca uma promocao para o produto que vende melhor".

Com isso, ela pode falar:

"Use o cupom VOLTA10 com Coxinha XL no Cardapio para clientes que ja compraram."

## 21. BusinessPossibilities

`businessPossibilities` mostra o que a usuaria realmente pode usar dentro do BocaFood.

Pode incluir:

- configuracao do negocio;
- canais cadastrados;
- canais com melhor margem;
- canais pouco explorados;
- produtos do catalogo;
- produtos de menu;
- alavancas de venda disponiveis;
- caminhos recomendados.

O prompt manda a IA preferir `recommendedPaths` quando existir.

Motivo:

Esses caminhos ja combinam:

- produto;
- canal;
- margem liquida;
- acao de venda disponivel;
- motivo.

## 22. AvailableActions e AllowedTypes

Dentro da inteligencia comercial existe lista de acoes permitidas.

Ela reforca os tipos:

- Cupom;
- Promocao;
- Upsell;
- Combo/Menu;
- Pontos/Reativacao de cliente;
- Ajuste de preco/desconto saudavel;
- Canal de venda;
- Revisao de produto parado;
- Criar base de leitura.

Tambem pode trazer objetos reais:

- cupons ativos;
- promocoes ativas;
- upsells ativos;
- programa de pontos.

## 23. PlayHistory

`playHistory` ajuda a IA a nao repetir jogada ruim.

Ele pode separar:

- jogadas recentes;
- jogadas vencedoras;
- jogadas fracas ou expiradas;
- jogadas ativas ou em leitura.

Regra:

- repetir jogada so faz sentido quando teve resultado;
- se uma jogada foi criada e nao vendeu, ela e execucao sem resultado;
- nesse caso, a proxima deve mudar produto, canal, publico ou mecanismo.

Exemplo:

Se "Cupom VOLTA10 com Coxinha XL no Cardapio" nao vendeu, a proxima nao deve ser:

"Use o cupom VOLTA10 com Coxinha XL no Cardapio de novo."

Deve ser algo como:

- "Cadastre um upsell de Bebida 330ml junto de Coxinha XL no Cardapio";
- "Use Coxinha XL sem desconto para clientes recorrentes";
- "Crie uma promocao curta para outro produto com melhor margem";
- "Revise o produto se a baixa resposta continuar".

## 24. Prompt remoto no backend

O endpoint `seasonsAiRecommendation` monta a chamada assim:

- valida metodo POST;
- valida autenticacao;
- carrega configuracao OpenAI;
- pega `context.prompt`;
- remove `prompt` do contexto seguro;
- calcula tamanho do contexto;
- chama Chat Completions;
- usa temperatura baixa;
- exige `response_format: json_object`.

Mensagens enviadas:

System:

- prompt principal.

User:

- "Analise o contexto agregado da temporada abaixo."
- "A resposta deve ser pratica, especifica e curta."
- "Se houver executionPlan.actions, priorize essas jogadas e melhore a clareza sem criar acao inexistente."
- "Nao substitua a acao por frases genericas."
- "Nunca peca para a usuaria conferir dados que ja estao no contexto."
- JSON do contexto seguro.

## 25. Formato de resposta esperado da IA

A IA deve retornar exatamente JSON.

Campos obrigatorios:

- `headline`;
- `helpingSignals`;
- `blockingSignals`;
- `nextAction`.

Campo opcional:

- `commercialPlay`.

Exemplo:

```json
{
  "headline": "A temporada tem resposta em Coxinha XL, mas precisa de uma acao mensuravel no Cardapio.",
  "helpingSignals": [
    "Coxinha XL aparece entre os produtos com melhor resposta.",
    "Cardapio preserva melhor margem que canais com comissao."
  ],
  "blockingSignals": [
    "Ainda nao ha cupom validado para essa combinacao."
  ],
  "nextAction": "Crie um cupom para Coxinha XL no Cardapio e use com clientes que ja compraram.",
  "commercialPlay": {
    "title": "Crie um cupom para Coxinha XL no Cardapio",
    "actionType": "Cupom",
    "actionName": "Criar cupom",
    "productName": "Coxinha XL",
    "combinationName": "",
    "channelName": "Cardapio",
    "customerGroup": "clientes que ja compraram",
    "whatToDo": "Crie um cupom para Coxinha XL no Cardapio e envie para clientes que ja compraram.",
    "whyThis": "O produto aparece como resposta da temporada e o canal preserva melhor margem.",
    "expectedResult": "Entrar pelo menos 1 pedido com Coxinha XL e esse cupom no Cardapio dentro do prazo.",
    "howBocaFoodReads": "O BocaFood vai procurar pedidos com produto Coxinha XL, canal Cardapio e cupom dentro do prazo da jogada.",
    "ifNoResult": "Se nao vender, nao repita o mesmo cupom do mesmo jeito. Troque produto, beneficio ou canal."
  }
}
```

## 26. Validacao da resposta

No backend, `validSeasonAIReading` valida:

- `headline` obrigatorio;
- `nextAction` obrigatorio;
- arrays de sinais com no maximo 4 itens;
- texto cortado por tamanho maximo;
- `commercialPlay` apenas se for objeto;
- campos de `commercialPlay` limitados.

Limites principais:

- `headline`: 180 caracteres;
- `nextAction`: 360 caracteres;
- `commercialPlay.title`: 180;
- `summary`: 260;
- `actionType`: 80;
- `actionName`: 120;
- `productName`: 120;
- `combinationName`: 120;
- `channelName`: 80;
- `customerGroup`: 120;
- `whatToDo`: 320;
- `whyThis`: 320;
- `expectedResult`: 220;
- `howBocaFoodReads`: 220;
- `ifNoResult`: 220.

Se a resposta nao tiver `headline` e `nextAction`, ela e invalida.

## 27. Fallback local

Se a OpenAI nao estiver configurada, desativada ou falhar, o BocaFood continua funcionando.

O fallback local fica em:

- `getFallbackRecommendation`

Ele tenta usar:

1. `recommendedPaths`;
2. primeira acao do `executionPlan`;
3. fallback por objetivo.

Fallback por objetivo:

Vender mais:

- criar ou usar cupom para produto forte;
- se nao houver base, criar base de leitura.

Aumentar ticket:

- cadastrar upsell;
- montar combo;
- usar complemento.

Reter clientes:

- chamar clientes que ja compraram;
- usar pontos;
- usar cupom de recompra;
- usar produto forte como motivo.

Melhorar consistencia:

- ativar promocao curta;
- usar cupom;
- puxar produto forte em dia fraco.

Sem dados:

- criar base de leitura.

## 28. Cache e regeneracao

A IA nao deve ser chamada toda hora sem necessidade.

O sistema usa:

- snapshot diario;
- `aiContextHash`;
- tamanho do contexto;
- motivo de disparo.

A funcao principal e:

- `_ensureSnapshotAIRecommendation`

Ela:

- monta contexto;
- calcula hash;
- verifica se ja existe recomendacao para o mesmo hash;
- reutiliza se puder;
- chama IA se o contexto mudou;
- salva a recomendacao no snapshot;
- persiste resumo na temporada.

Motivos de geracao:

- `first_daily_snapshot`;
- `context_changed`;
- `remote_available_after_local_fallback`;
- `manual_or_snapshot_refresh`.

Regra importante:

Se ha tarefas abertas com a mesma assinatura, o sistema pode manter a recomendacao mesmo com pequenas mudancas de contexto. Isso evita trocar jogada enquanto ela ainda esta em janela de resultado.

## 29. Logs e privacidade

O uso remoto de IA e registrado em:

- `system_ai_usage`

Campos registrados:

- provider;
- feature;
- tenantId;
- uid;
- seasonId;
- snapshotId;
- snapshotDate;
- contextHash;
- contextMode;
- contextSize;
- triggerReason;
- model;
- status;
- erro curto, se houver;
- promptTokens;
- completionTokens;
- totalTokens;
- createdAt.

Nao deve salvar:

- prompt completo;
- payload grande;
- lista completa de pedidos;
- clientes finais em detalhe;
- tokens;
- segredos;
- dados pessoais desnecessarios.

## 30. Como a tela mostra a jogada

A tela renderiza a ficha comercial com:

Campos principais:

- Acao de venda;
- Produto ou combinacao;
- Canal ou publico.

Detalhes:

- O que fazer;
- Por que esta jogada;
- Resultado esperado;
- Como o BocaFood vai ler;
- Se nao der resultado.

Isso substitui a leitura antiga mais parecida com tarefa generica.

O objetivo visual e:

- mostrar decisao comercial;
- deixar a acao clara;
- mostrar o motivo;
- mostrar a regra de medicao;
- evitar que a usuaria precise interpretar sozinha.

## 31. Exemplos de criacao de jogadas

### 31.1 Produto forte com cupom existente

Contexto:

- produto `Coxinha XL` vendeu bem;
- canal `Cardapio` tem boa margem;
- cupom `VOLTA10` existe;
- ha clientes que ja compraram.

Jogada esperada:

"Use o cupom VOLTA10 com Coxinha XL no Cardapio para clientes que ja compraram."

Tipo:

- Cupom.

Leitura:

- pedido com Coxinha XL;
- cupom VOLTA10;
- canal Cardapio;
- dentro do prazo.

Se nao der resultado:

- nao repetir o mesmo cupom;
- trocar produto, beneficio ou canal.

### 31.2 Produto forte sem cupom existente

Contexto:

- produto `Coxinha XL` vende bem;
- nao ha cupom aplicavel;
- objetivo e vender mais.

Jogada esperada:

"Crie um cupom para Coxinha XL no Cardapio."

Tipo:

- Cupom.

Observacao:

- a IA nao inventa codigo;
- ela manda criar o cupom.

### 31.3 Aumentar ticket com upsell existente

Contexto:

- objetivo e aumentar ticket;
- produto `Pizza Individual` vende;
- upsell `Bebida 330ml` existe;
- canal e Cardapio.

Jogada esperada:

"Cadastre ou use o upsell Bebida 330ml junto de Pizza Individual no Cardapio."

Tipo:

- Upsell.

Leitura:

- pedido no Cardapio;
- Pizza Individual;
- Bebida 330ml aceita como extra;
- ticket medio ou receita adicional subindo.

### 31.4 Aumentar ticket sem upsell pronto

Contexto:

- produto de entrada vende;
- nao existe upsell pronto;
- ha produto complementar com preco/custo.

Jogada esperada:

"Cadastre um upsell no Cardapio ligando Produto A ao complemento Produto B."

Tipo:

- Upsell ou Combo/Menu.

Nao deve dizer:

"Crie uma acao concreta para aumentar ticket."

### 31.5 Recompra com pontos

Contexto:

- objetivo e reter clientes;
- programa de pontos ativo;
- clientes ja compraram antes;
- produto forte existe.

Jogada esperada:

"Chame clientes com pontos para comprar Coxinha XL."

Tipo:

- Pontos/Reativacao de cliente.

Leitura:

- cliente recorrente;
- uso de pontos, se houver;
- pedido com produto indicado;
- dentro do prazo.

### 31.6 Canal com boa margem

Contexto:

- canal Cardapio tem menos taxa;
- Glovo vende, mas tem comissao alta;
- produto forte existe.

Jogada esperada:

"Use o cupom X com Produto Y no Cardapio antes de empurrar mais volume para Glovo."

Tipo:

- Cupom ou Canal de venda.

Motivo:

- vender pelo canal com melhor margem liquida.

### 31.7 Produto parado

Contexto:

- produto tem baixa saida;
- objetivo nao deve forcar desconto sem margem;
- ha produto parado no cardapio.

Jogada esperada:

"Revise o produto Brigadeiro Grande: ajuste oferta, foto, preco ou combinacao antes de criar desconto."

Tipo:

- Revisao de produto parado.

Leitura:

- se depois da revisao entram pedidos com esse produto;
- ou se continua parado e deve sair da prioridade.

### 31.8 Sem dados suficientes

Contexto:

- temporada com poucos ou nenhum pedido;
- sem produto forte;
- sem canal dominante.

Jogada esperada:

"Crie base de leitura registrando os proximos pedidos com produto, canal e pagamento preenchidos."

Tipo:

- Criar base de leitura.

Motivo:

- o BocaFood nao pode fingir inteligencia sem base.

## 32. O que "Se nao der resultado" deve fazer

O campo `ifNoResult` e essencial.

Ele deve impedir repeticao cega.

Regras por tipo:

Cupom:

- nao repetir o mesmo cupom do mesmo jeito;
- trocar produto, beneficio ou canal.

Promocao:

- nao aumentar desconto automaticamente;
- revisar margem, produto e canal.

Upsell:

- testar outro complemento;
- testar outro produto de entrada.

Pontos/Reativacao:

- mudar grupo de clientes;
- mudar beneficio;
- mudar motivo do convite.

Canal:

- trocar acao de venda;
- testar canal com melhor margem.

Consistencia:

- mudar produto ou acao para o proximo dia fraco.

Base:

- depois dos primeiros pedidos, trocar para jogada com produto, canal ou publico real.

## 33. Regras de mensurabilidade

Uma jogada boa precisa ser mensuravel.

Ela deve ter pelo menos um destes elementos:

- produto;
- canal;
- cupom;
- promocao;
- upsell;
- pontos;
- cliente recorrente;
- pedido registrado;
- ticket medio;
- combinacao/menu;
- grupo de cliente.

Jogadas ruins sao as que o sistema nao consegue ler depois.

Exemplos ruins:

- "Melhore a comunicacao."
- "Divulgue mais."
- "Faca uma acao nas redes."
- "Organize uma campanha."
- "Crie urgencia."

O BocaFood pode ate orientar comunicacao em outro modulo no futuro, mas a jogada de Temporadas precisa estar ligada ao que o sistema consegue medir na operacao.

## 34. Regras para canal

Ao escolher canal, a IA deve considerar:

- pedidos;
- receita;
- taxas;
- comissoes;
- descontos;
- margem liquida;
- saude do canal.

Nao basta dizer:

"Glovo vende mais, use Glovo."

Se Glovo vende mais mas tira muita margem, pode fazer mais sentido:

"Use o cupom X no Cardapio para tentar puxar venda direta antes de aumentar volume no canal com comissao."

## 35. Regras para cupom

Cupom pode ser:

- usado quando ja existe;
- criado quando nao existe e faz sentido;
- evitado quando o desconto prejudica margem.

Quando existir codigo real:

- usar o codigo.

Quando nao existir:

- dizer "Crie um cupom";
- nao inventar nome/codigo.

Cupom deve vir com:

- produto ou publico;
- canal, se possivel;
- resultado esperado;
- como medir.

## 36. Regras para promocao

Promocao deve ser usada quando:

- ja existe promocao aplicavel;
- ja houve promocao validada;
- margem depois da promocao parece saudavel;
- faz sentido para o objetivo.

Promocao ja validada tem prioridade alta.

Mas a IA nao deve aumentar desconto automaticamente.

Se a promocao vendeu com desconto pesado, o bloqueio deve aparecer:

- "A promocao vendeu, mas o desconto pode estar pesando demais."

## 37. Regras para upsell

Upsell deve ser usado principalmente quando:

- objetivo e aumentar ticket;
- existe produto de entrada;
- existe extra/adicional;
- canal e Cardapio;
- o objetivo e subir pedido sem baixar preco.

Upsell nao deve ser tratado como jogada de Glovo, WhatsApp ou canal externo quando o sistema nao consegue aplicar/ler o upsell ali.

## 38. Regras para combo/menu

Combo/Menu deve ser usado quando:

- existem produtos complementares;
- existem combinacoes reais vendidas;
- ha menu com escolhas internas;
- a melhor acao depende de sabor, bebida, adicional ou combinacao.

Se houver `realMenuCombinations`, a IA deve preferir combinacao real a frase generica.

Exemplo:

Melhor:

"Monte o combo Empanada de Carne + Coca 330ml."

Pior:

"Faca uma oferta com menu."

## 39. Regras para pontos e reativacao

Pontos/Reativacao deve ser usado quando:

- ha clientes recorrentes;
- ha clientes com pontos;
- ha historico de recompra;
- o objetivo e reter clientes;
- o produto forte serve como motivo de retorno.

Deve indicar publico:

- clientes que ja compraram;
- clientes com pontos;
- clientes sem recompra;
- clientes recorrentes.

Nao deve falar apenas:

"Melhore a fidelizacao."

## 40. Regras para ajuste de preco/desconto saudavel

So deve aparecer quando ha base economica.

Precisa de:

- preco;
- custo;
- margem;
- limite de desconto saudavel.

Exemplo:

"Ajuste o desconto de Coxinha XL para no maximo 10%."

Nao deve aparecer:

"Dê desconto para vender mais."

## 41. Regras para revisao de produto parado

Produto parado nao deve virar desconto automaticamente.

Antes, pode pedir:

- revisar preco;
- revisar foto;
- revisar nome;
- revisar descricao;
- combinar com outro produto;
- tirar da jogada principal se nao houver sinal;
- testar outro canal ou publico.

Tipo:

- Revisao de produto parado.

## 42. Regras para criar base de leitura

Quando faltam dados:

- nao escolher produto vencedor;
- nao escolher canal vencedor;
- nao falar "melhor horario";
- nao inventar campanha.

A jogada deve ser:

- registrar pedidos corretamente;
- manter canal real;
- manter produto real;
- preencher pagamento;
- deixar o BocaFood ler.

## 43. Como resultado e acompanhado

A jogada pode passar por estados como:

- pendente;
- em execucao;
- resultado em leitura;
- concluida;
- vencida;
- sem resposta.

Quando uma venda ligada aparece:

- a tarefa pode virar "Resultado em leitura";
- isso nao encerra automaticamente a jogada antes da janela de resultado.

Depois da janela:

- o sistema pode tratar como historico;
- a proxima jogada deve considerar se funcionou ou nao.

## 44. Quando nasce uma proxima jogada

Proxima jogada nao deve nascer automaticamente a cada venda.

Ela deve nascer quando:

- a rodada atual virou historico;
- o resultado foi fechado;
- o prazo venceu;
- a acao foi criada mas nao respondeu;
- a usuaria pediu explicitamente nova jogada;
- o contexto mudou de forma suficiente.

Isso evita troca precoce e confusao operacional.

## 45. Pontos de atencao atuais

O prompt ja proibe frases genericas como:

- "acao concreta";
- "acao objetiva";
- "acao de venda simples";
- "transforme em acao".

Mas o motor deterministico ainda pode ter textos antigos em algumas descricoes internas. A direcao correta do produto e que todas essas frases sejam substituidas por acoes explicitas do BocaFood:

- criar cupom;
- ativar promocao;
- cadastrar upsell;
- montar combo;
- chamar clientes com pontos;
- ajustar preco/desconto;
- revisar produto;
- criar base de leitura.

Ou seja: a IA ja esta instruida para nao usar o generico; a camada deterministica tambem deve seguir a mesma regra sempre que gerar texto direto.

## 46. Criterio de qualidade de uma jogada

Uma jogada esta boa quando responde claramente:

1. Qual acao de venda do BocaFood usar?
2. Essa acao ja existe ou precisa ser criada?
3. Qual produto, menu ou combinacao entra?
4. Qual canal ou publico recebe a jogada?
5. Por que essa e a decisao comercial agora?
6. O que deve acontecer para valer a pena?
7. Como o BocaFood vai ler o resultado?
8. O que mudar se nao houver resposta?

Se alguma dessas perguntas fica vaga, a jogada ainda nao esta boa.

## 47. Checklist de validacao manual

Ao revisar uma jogada gerada, verificar:

- a proxima jogada comeca com verbo explicito;
- o tipo esta entre os permitidos;
- existe produto, canal, publico ou base de leitura;
- se existe cupom/promocao/upsell no contexto, o nome real foi usado;
- se nao existe, a jogada manda criar/cadastrar/ativar sem inventar nome;
- nao ha desconto sem preco/custo/margem;
- upsell esta ligado ao Cardapio;
- a jogada nao fala de horario como decisao principal;
- `measurement` existe;
- `commercialPlay` existe ou pode ser derivado;
- `expectedResult` e mensuravel;
- `howBocaFoodReads` explica o que sera procurado;
- `ifNoResult` muda produto, canal, publico ou mecanismo;
- a jogada nao repete outra sem resposta;
- o texto nao usa "acao concreta" ou equivalente.

## 48. Resumo executivo

As jogadas de Temporadas devem ser criadas assim:

1. O BocaFood calcula dados reais.
2. O motor deterministico escolhe oportunidades.
3. O ranking considera produto, canal, cupom, promocao, upsell, margem, recompra, pontos e consistencia.
4. Objetivo e prioridade ajustam pesos, mas nao travam a decisao.
5. Dificuldade define quantidade, prazo e janela de resultado.
6. Cada jogada recebe `measurement`.
7. Cada jogada vira `commercialPlay`.
8. A IA recebe prompt fechado e contexto compacto.
9. A IA so pode usar acoes de venda permitidas.
10. A IA deve escrever a proxima jogada de forma explicita.
11. A resposta e validada.
12. O resultado e lido por pedidos, produtos, canais, cupons, promocoes, upsells, pontos e recompra.

A regra mais importante:

Uma jogada nao e uma sugestao vaga. E uma decisao comercial pronta para executar e mensurar.
