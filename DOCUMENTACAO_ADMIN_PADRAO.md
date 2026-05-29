# Padrão da documentação interna do Painel BocaFood

## Objetivo

A documentação interna do Painel BocaFood deve ajudar uma usuária leiga a entender o que fazer, onde fazer, por que fazer e o que acontece depois.

Ela não deve ser apenas uma lista de funcionalidades. Também não deve ser uma explicação técnica do sistema. A documentação precisa falar com a empreendedora sobre o negócio dela, usando caminhos claros dentro do BocaFood.

## Público

A documentação deve ser escrita para uma pessoa que:

- acabou de entrar no BocaFood;
- não sabe onde clicar;
- não sabe a ordem correta de configuração;
- não entende termos técnicos de sistema;
- precisa saber por que uma ação importa para o negócio;
- fica insegura quando a tela parece técnica demais.

## Tom de voz

Use linguagem simples, direta e prática.

Preferir:

- "Aqui você cadastra o que vende para a cliente."
- "Isso ajuda o BocaFood a entender de onde vem sua venda."
- "Se esse campo ficar vazio, a venda ainda entra, mas o BocaFood perde força para mostrar margem, estoque e decisões."

Evitar:

- "Este módulo persiste entidades na coleção..."
- "Configure os parâmetros operacionais..."
- "Esta funcionalidade alimenta o motor analítico..."
- "O sistema consome dados para cálculo..."

Quando precisar explicar algo interno, transformar em linguagem de negócio.

Exemplo:

- Em vez de: "Canal é usado como dimensão de análise."
- Usar: "O canal mostra por onde a venda chegou, como Cardápio, Instagram ou balcão."

## Estrutura obrigatória de cada documentação de módulo

Cada item da documentação deve seguir esta ordem:

1. Nome claro do assunto
2. Caminho dentro do sistema
3. O que é
4. Por que isso importa
5. O que preencher ou fazer
6. O que acontece depois
7. Cuidados comuns
8. Como saber se está pronto

Nem todo item precisa ter texto longo em todas as partes, mas a estrutura deve estar presente quando ajudar o entendimento.

## Modelo base de seção

### Nome do assunto

**Caminho:** `Menu > Submenu > Tela`

Explique em uma ou duas frases o que a usuária faz ali.

**Por que isso importa**

Explique como essa ação ajuda o negócio da usuária.

**O que preencher ou fazer**

Liste os campos ou ações esperadas.

**O que acontece depois**

Explique onde essa informação aparece ou o que ela alimenta.

**Cuidados comuns**

Mostre erros simples que podem prejudicar a leitura do negócio.

**Como saber se está pronto**

Diga o resultado esperado de forma objetiva.

## Exemplo correto

### Cadastrar produtos

**Caminho:** `Cardápio > Produtos`

Aqui você cadastra tudo que vende para a cliente.

**Por que isso importa**

O produto não aparece só no cardápio. Ele também aparece nos pedidos, na cozinha, nas promoções, no upsell, no estoque, no financeiro e nas leituras de crescimento.

Se o produto estiver incompleto, a venda ainda entra, mas o BocaFood perde força para mostrar margem, estoque e decisões.

**O que preencher**

- nome;
- descrição;
- preço;
- categoria;
- imagem;
- se aparece no cardápio;
- variações, se tiver;
- adicionais, se tiver;
- ficha técnica, quando for produzido por você;
- produto pronto, quando for comprado pronto.

**O que acontece depois**

O produto passa a ser usado no cardápio público, pedidos, cozinha, promoções, upsell, estoque, produção e relatórios.

**Cuidados comuns**

- Cadastrar produto sem preço.
- Não vincular ficha técnica quando o produto é produzido.
- Não informar custo quando o produto é comprado pronto.
- Deixar produto oculto sem perceber.

**Como saber se está pronto**

O produto aparece corretamente na lista, tem preço, categoria e está marcado para aparecer no cardápio quando deve ser vendido.

## Estrutura para "Primeiros passos"

A documentação de Primeiros passos deve ser mais guiada que as outras.

Ela deve conter:

1. O que é esta etapa
2. Como o BocaFood se organiza
3. O que configurar primeiro
4. Como criar a primeira rota
5. Como criar a primeira temporada
6. Como preparar a loja online
7. Como registrar a primeira venda
8. Como compras, produção, estoque e financeiro começam a conversar
9. O que fazer no primeiro dia
10. O que deixar para depois
11. Erros comuns no começo
12. Como saber que a base inicial está boa
13. O que o BocaFood começa a entregar depois disso

Dentro de cada etapa, manter:

- explicação simples;
- caminho no sistema;
- por que isso importa;
- o que preencher ou fazer;
- o que acontece depois.

## Caminhos dentro do sistema

Sempre incluir o caminho exato quando a documentação mandar a usuária fazer algo.

Formato:

`Menu > Submenu > Tela`

Exemplos:

- `Configurações > Dados da loja`
- `Configurações > Canais de venda`
- `Cardápio > Produtos`
- `Produção > Receitas de produção`
- `Financeiro > Saídas`
- `Crescimento > Plano de Voo`
- `Crescimento > Temporadas`
- `Loja online > Template da loja`
- `Loja online > Link da loja`
- `Pedidos > Pedidos`
- `Venda presencial`

Se o caminho ainda estiver mudando no menu, usar o caminho atual do Painel BocaFood publicado.

## Profundidade esperada

Não resumir demais.

A documentação deve responder:

- O que é isso?
- Onde eu faço?
- Por que eu preciso fazer?
- O que eu preencho?
- O que acontece com essa informação?
- Onde isso aparece depois?
- O que acontece se eu não preencher?
- Como eu sei que terminei?

## Como organizar sub-seções

Quando uma seção tiver muitas ações, dividir em sub-seções.

Exemplo:

### O que configurar primeiro

#### Dados do negócio
**Caminho:** `Configurações > Dados da loja`

#### Canais de venda
**Caminho:** `Configurações > Canais de venda`

#### Formas de pagamento
**Caminho:** `Financeiro > Configurações > Formas de pagamento`

#### Produtos
**Caminho:** `Cardápio > Produtos`

Essa divisão evita blocos longos demais e ajuda a usuária encontrar rapidamente onde clicar.

## O que evitar

Evitar:

- texto curto demais que só diga "configure seus produtos";
- lista sem explicar o motivo;
- termos técnicos sem tradução para a rotina;
- excesso de foco no sistema;
- falar como manual corporativo;
- omitir caminhos;
- cortar informações importantes para economizar espaço;
- misturar muitos assuntos sem subtítulos.
- pílulas internas como "Documentado" ou "A documentar";
- termos de bastidor como "tenant", "slug", "Admin", "coleção", "entidade" e "motor", quando a usuária não precisa saber disso;
- excesso de frases com "pode" quando a ação já tem consequência clara.

## Linguagem firme, sem parecer dúvida

A documentação precisa passar segurança. Quando algo acontece de fato, escrever como consequência clara.

Preferir:

- "Quando a compra é recebida, ela entra no estoque."
- "Quando a loja está publicada, o link abre o cardápio da cliente."
- "Com o vínculo correto, a venda baixa o estoque."

Evitar:

- "A compra pode entrar no estoque."
- "O link pode abrir a loja."
- "A venda pode baixar o estoque."

Quando depender de uma configuração, explicar a condição sem deixar a frase insegura.

Exemplo:

- "Quando o controle de estoque está ativo e o produto tem vínculo correto, a venda baixa o item vendido."
- "Quando a retirada está ativa, esse endereço aparece para a cliente buscar o pedido."

## Nomes que usamos com a usuária

Usar nomes que fazem sentido para quem está operando o negócio.

- Painel BocaFood, não Admin.
- Loja, cardápio ou negócio, conforme o contexto.
- Nome do link, não slug.
- Loja selecionada, não tenant.
- Área, tela ou menu, não módulo quando a palavra deixar a leitura fria.
- Leitura do negócio, não motor analítico.

## Checklist antes de publicar uma documentação

Antes de levar a documentação para o Painel BocaFood, confirmar:

- todos os caminhos existem no menu atual;
- a linguagem está simples;
- cada ação explica por que importa;
- não há termos técnicos sem explicação;
- não há informação cortada;
- a documentação fala com a usuária sobre o negócio dela;
- os textos não prometem algo que o sistema ainda não faz;
- quando uma integração ainda é parcial, isso fica claro sem parecer erro.

## Relação com a tela de documentação do Painel BocaFood

A tela `Suporte > Documentação` deve usar este padrão para cada módulo.

Cada área pode ter um menu lateral próprio e subitens internos. O objetivo é que a usuária consiga abrir uma área, escolher um assunto e entender:

- para que serve;
- onde fica;
- como usar;
- como isso conversa com o restante do BocaFood.

## Fonte de verdade

Este documento é a referência para escrever e revisar conteúdos da documentação interna do Painel BocaFood.

Quando a documentação evoluir, atualizar este arquivo antes de alterar a tela, para manter o padrão consistente entre módulos.
