# Solucoes que o BocaFood pode criar para a usuaria

Este documento descreve as possibilidades de solucoes que o BocaFood pode criar, montar, registrar, calcular, sugerir ou automatizar para a usuaria usar no negocio dela.

Escopo deste documento:
- Inclui Admin/Centro de Controle, loja publica, pedidos, catalogo, marketing, clientes, compras, estoque, financeiro, precos, performance, fiscal, onboarding, configuracoes e suporte.
- Nao detalha o que e gerado pelo modulo Temporadas, por decisao de produto nesta analise.
- O foco e operacional e comercial: o que a usuaria consegue transformar em acao dentro do negocio.
- O documento nao trata Master como area de criacao para a usuaria final.

## 1. Visao geral

O BocaFood pode criar solucoes para quatro grandes necessidades da operacao:

1. Vender melhor
   - loja publica;
   - catalogo e cardapio;
   - produtos, combos e escolhas;
   - cupons;
   - promocoes;
   - upsells;
   - programa de pontos;
   - links e publicacao;
   - rastreamento de campanhas;
   - avaliacoes e prova social.

2. Operar pedidos com menos perda
   - pedido manual;
   - pedido da loja publica;
   - venda presencial;
   - cozinha;
   - status do pedido;
   - edicao de pedido pendente;
   - produtos com escolhas;
   - desconto manual;
   - vinculo com cliente;
   - calculo de taxas de canal;
   - envio controlado para financeiro;
   - baixa/consumo de estoque quando aplicavel.

3. Controlar dinheiro, margem e rotina
   - entradas financeiras;
   - contas a pagar;
   - fluxo de caixa;
   - categorias financeiras;
   - contas bancarias;
   - contas recorrentes;
   - composicao de preco;
   - margem por produto;
   - simulador de preco;
   - Plano de Voo;
   - leitura de performance.

4. Dar base operacional para decisao
   - cadastro guiado;
   - diagnostico inicial;
   - dados da loja;
   - clientes;
   - fornecedores;
   - fichas tecnicas;
   - estoque;
   - compras;
   - fiscal quando habilitado;
   - suporte e documentacao interna.

## 2. Solucoes de loja publica e presenca online

### 2.1 Loja publica publicada

O sistema pode gerar uma loja publica para a conta, usando os dados configurados no Centro de Controle.

O que pode ser criado:
- pagina publica da loja;
- link publico baseado no slug;
- mapeamento do slug em `public_stores`;
- estado publicado;
- estado despublicado;
- estado reservado mas ainda nao publicado;
- visual da loja com logo, banner, cores, produtos, categorias, horarios e contato.

Para que serve:
- permitir que clientes finais vejam o cardapio;
- receber pedidos online;
- divulgar um link unico da loja;
- manter uma vitrine padronizada sem dominio proprio por tenant nesta fase.

Dados usados:
- nome da loja;
- slug publico;
- template;
- logo e banner;
- endereco e localidade atendida;
- horarios;
- canais de contato;
- formas de pagamento;
- zonas de entrega;
- produtos publicados;
- categorias;
- configuracoes de SEO basico.

Limites:
- o slug deve pertencer a uma unica loja;
- o mapeamento publico nao deve conter dados sensiveis;
- loja nao publicada nao deve parecer inexistente;
- a publicacao deve respeitar o tenant selecionado.

### 2.2 Link da loja

O sistema pode criar e salvar o link publico da loja.

O que pode ser criado:
- slug normalizado;
- URL publica;
- copia rapida do link;
- registro em `config/dominio`;
- espelho em `system_tenants/{uid}.store`;
- documento publico em `public_stores/{slug}`.

Exemplo de solucao:
- a usuaria define `minha-cozinha`;
- o sistema gera `https://bocafood.app/minha-cozinha`;
- o sistema salva o dono do slug para resolver a loja correta.

### 2.3 SEO comercial da loja

O sistema pode criar configuracoes basicas de SEO para a loja publica.

O que pode ser criado:
- titulo da loja;
- descricao;
- palavras principais;
- textos para compartilhamento;
- dados comerciais basicos para aparicao publica.

Limite:
- SEO tecnico fica sob controle do BocaFood/Master;
- a usuaria nao deve editar robots, sitemap, schema tecnico, Search Console ou `metaRobots`.

### 2.4 Rastreamento de visitas e campanhas

O sistema pode salvar integracoes de medicao e fazer a loja publica carregar rastreamento quando os IDs forem validos.

O que pode ser criado/configurado:
- GA4;
- Google Tag Manager;
- Meta Pixel;
- eventos minimos como `PageView`, `add_to_cart` e `begin_checkout`.

Para que serve:
- acompanhar visitas;
- acompanhar carrinho;
- acompanhar inicio de checkout;
- entender origem de campanhas sem salvar dados pessoais de clientes finais nos eventos.

Limites:
- nao inventar IDs;
- nao carregar scripts duplicados;
- nao enviar dados pessoais de clientes finais.

## 3. Solucoes de catalogo, cardapio e produtos

### 3.1 Produto de cardapio

O sistema pode criar produtos vendidos na loja.

O que pode ser criado:
- produto avulso;
- produto vinculado a receita/ficha tecnica;
- produto pronto comprado;
- produto com escolhas;
- combo/menu;
- produto sob encomenda;
- produto oculto no cardapio, mas disponivel internamente;
- tags visuais;
- imagens;
- preco;
- descricao;
- categoria;
- disponibilidade;
- configuracao fiscal quando o pais fiscal permitir.

Para que serve:
- vender no cardapio;
- montar pedidos manuais;
- usar na venda presencial;
- calcular margem;
- movimentar estoque;
- participar de promocoes, cupons e upsells.

### 3.2 Combo/Menu com escolhas

O sistema pode criar produtos do tipo combo/menu com grupos de escolha.

O que pode ser criado:
- grupo de escolha;
- opcoes dentro do grupo;
- minimo e maximo de selecao;
- adicional de preco por opcao;
- vinculo com produto, receita, item pronto ou insumo;
- combinacoes reais vendidas, a partir dos pedidos;
- preservacao das escolhas no pedido.

Exemplo de uso:
- Menu 1 com escolha de salgado, bebida e sobremesa;
- pedido salva as escolhas selecionadas;
- depois o sistema consegue analisar quais combinacoes vendem, quanto custam e qual margem deixam.

### 3.3 Categorias do cardapio

O sistema pode criar categorias para organizar o catalogo.

O que pode ser criado:
- categoria;
- ordem das categorias;
- ordem dos produtos dentro das categorias;
- categoria visivel na loja;
- categoria usada para filtros e organizacao interna.

### 3.4 Produto pronto e item de custo

O sistema pode criar itens que alimentam produto, compra, estoque e margem.

O que pode ser criado:
- ingrediente;
- embalagem;
- produto pronto comprado;
- unidade de compra;
- unidade base;
- custo atual;
- fornecedor padrao;
- estoque minimo;
- estoque maximo;
- vinculo com produto do catalogo.

Para que serve:
- calcular custo;
- montar ficha tecnica;
- registrar compras;
- movimentar estoque;
- sugerir reposicao;
- calcular margem por produto.

### 3.5 Ficha tecnica / receita

O sistema pode criar fichas tecnicas para produtos produzidos.

O que pode ser criado:
- receita;
- componentes;
- ingredientes diretos;
- embalagens;
- rendimento;
- unidade de rendimento;
- custo por rendimento;
- custo por unidade;
- peso sugerido por unidade quando aplicavel;
- configuracao de estoque da receita/base produzida.

Para que serve:
- saber custo real;
- formar preco;
- controlar producao;
- baixar estoque por venda;
- analisar margem.

### 3.6 Importacao de produtos

O sistema possui fluxo para importar produtos.

O que pode ser gerado:
- rascunhos ou cadastros de produtos a partir de uma entrada em massa;
- dados iniciais de nome, preco, categoria e descricao quando disponiveis;
- produtos prontos para revisao antes de venda.

Limite:
- a importacao deve ser revisada;
- custo, margem, estoque e composicao podem precisar de complemento manual.

## 4. Solucoes de acoes de venda

### 4.1 Promocoes

O sistema pode criar promocoes para aplicar no cardapio e nos pedidos.

Tipos de promocao observados:
- percentual de desconto;
- valor fixo de desconto;
- leve/pague;
- frete gratis por valor minimo;
- promocao para todos os produtos;
- promocao para produtos selecionados;
- promocao ativa, pausada, expirada ou agendada;
- promocao duplicada para reaproveitar regra.

Campos que o sistema usa:
- nome;
- tipo;
- valor;
- produto ou lista de produtos;
- valor minimo;
- data de inicio;
- data de fim;
- regras;
- status ativo/inativo.

Para que serve:
- acelerar venda;
- testar oferta;
- reduzir atrito de compra;
- criar campanha simples;
- medir uso em pedidos.

Cuidados:
- desconto sem custo e margem confiaveis pode prejudicar resultado;
- validade e escopo precisam ser claros;
- promocoes amplas devem ser usadas com cuidado.

### 4.2 Cupons

O sistema pode criar cupons divulgaveis.

O que pode ser criado:
- codigo do cupom;
- cupom percentual;
- cupom de valor fixo;
- pedido minimo;
- limite maximo de usos;
- validade;
- status ativo, expirado ou esgotado;
- link/area de divulgacao do cupom;
- contador de uso.

Para que serve:
- campanha de volta;
- desconto controlado;
- divulgacao por WhatsApp, Instagram ou canal externo;
- leitura de resultado quando o pedido usa o codigo.

Exemplo:
- `VOLTA10`;
- 10%;
- minimo de 20 euros;
- validade ate domingo;
- maximo de 30 usos.

### 4.3 Upsell

O sistema pode criar regras de upsell para aumentar o valor medio do pedido.

Tipos/formatos de upsell observados:
- complemento;
- upgrade;
- combo sugerido;
- carrinho;
- valor minimo;
- oferta no detalhe do produto;
- oferta no carrinho;
- oferta orientada para WhatsApp/carrinho quando configurada.

Beneficios possiveis:
- percentual de desconto;
- valor fixo de desconto;
- preco final de combo;
- leve/pague;
- brinde;
- meta de carrinho;
- frete/beneficio por valor minimo.

Campos que o sistema usa:
- nome;
- tipo;
- produto gatilho;
- produtos sugeridos;
- beneficio;
- valor do beneficio;
- produto de brinde;
- quantidade minima;
- valor minimo do carrinho;
- mensagem;
- local de exibicao;
- prioridade;
- limite de exibicao;
- margem minima;
- periodo.

Analises que o sistema pode gerar junto:
- preco original;
- preco com beneficio;
- desconto aplicado;
- custo;
- lucro antes/depois;
- margem antes/depois;
- aviso quando a margem fica abaixo do minimo.

Para que serve:
- vender complemento;
- subir ticket;
- oferecer brinde controlado;
- criar combo com regra;
- vender mais sem depender apenas de desconto.

### 4.4 Programa de pontos

O sistema pode criar e operar um programa de pontos.

O que pode ser configurado:
- programa ativo/inativo;
- nome do programa;
- texto exibido para a loja;
- pontos ganhos por euro;
- taxa de resgate;
- minimo de pontos para usar;
- percentual maximo de desconto;
- expiracao de pontos;
- aplicacao automatica ou manual.

O que o sistema pode gerar:
- pontos ganhos quando pedido e entregue;
- desconto por pontos em pedido elegivel;
- movimentos de pontos;
- saldo antes/depois;
- historico de uso;
- atualizacao do saldo do cliente.

Para que serve:
- fidelizacao;
- recompra;
- incentivo para cliente voltar;
- beneficio sem criar cupom para todo mundo.

Limites:
- pedido precisa estar ligado a cliente;
- pedido entregue pode gerar pontos;
- desconto por pontos nao deve duplicar no mesmo pedido;
- regras de minimo e maximo precisam ser respeitadas.

### 4.5 Avaliacoes

O sistema pode gerenciar avaliacoes da loja/produtos.

O que pode ser criado/feito:
- listar avaliacoes;
- aprovar;
- rejeitar;
- responder;
- usar como prova social na loja quando aprovado;
- calcular media e quantidade.

Para que serve:
- melhorar confianca da loja publica;
- responder cliente;
- filtrar conteudo inadequado antes de exibir.

## 5. Solucoes de pedidos e cozinha

### 5.1 Pedido da loja publica

O sistema pode criar pedidos a partir do checkout publico.

O que o pedido pode conter:
- cliente;
- telefone/WhatsApp;
- endereco detalhado;
- tipo de entrega/retirada;
- data e horario;
- itens;
- escolhas/variantes;
- cupom;
- promocao;
- pontos;
- forma de pagamento;
- status de pagamento;
- origem/canal;
- aliases compativeis com o Admin;
- status inicial adequado.

Regra importante:
- se o salvamento do pedido falhar, o carrinho deve permanecer disponivel;
- pagamento Stripe pendente/falho mantem pedido como Pendente;
- pedido pendente nao deve ir ao Financeiro.

### 5.2 Pedido manual

O sistema pode criar pedido manual no Admin.

O que pode ser criado:
- pedido com cliente existente ou novo;
- pedido com produto simples;
- pedido com produto com escolhas;
- pedido com combo/menu;
- pedido com produto sob encomenda;
- canal de venda;
- conta bancaria herdada do canal;
- forma de pagamento;
- status;
- data de entrega/retirada;
- taxas do canal;
- desconto manual;
- observacoes e dados operacionais.

Para que serve:
- registrar venda que entrou por WhatsApp, presencial, Instagram, Glovo ou outro canal;
- manter estoque, financeiro, clientes e performance consistentes.

### 5.3 Edicao de pedido pendente

O sistema pode liberar edicao completa quando o pedido esta pendente/editavel.

O que pode ser editado:
- status;
- produtos;
- quantidade;
- escolhas;
- inclusao de produto;
- troca de produto;
- canal/origem;
- data e horario;
- desconto manual;
- forma de pagamento;
- conta bancaria;
- status de pagamento;
- valor pago, quando permitido.

Regra financeira:
- pedido pendente nao envia entrada para o Financeiro;
- se havia movimentacao financeira e o pedido volta para pendente, a movimentacao deve ser cancelada/estornada e o pedido fica marcado como `nao_enviado_pendente`.

### 5.4 Detalhe do pedido

O sistema pode criar uma ficha operacional do pedido.

O que aparece:
- resumo;
- cliente;
- contato;
- endereco;
- itens;
- escolhas;
- pagamento;
- desconto;
- taxas do canal;
- status de preparo;
- status de entrega;
- historico operacional;
- acoes de cliente;
- vinculo com estoque;
- vinculo financeiro quando existir.

### 5.5 Cozinha

O sistema pode organizar pedidos em modo cozinha.

O que pode ser criado/feito:
- lista operacional por status;
- visual de pedidos em preparo;
- filtros por data/periodo;
- alarme;
- teste de alarme;
- alteracao de status;
- detalhe rapido do pedido.

Para que serve:
- acompanhar preparo;
- evitar esquecimento;
- separar rotina operacional da lista administrativa.

### 5.6 Movimentacao de estoque por pedido

O sistema pode gerar saidas de estoque a partir de pedidos, quando o pedido chega ao status configurado.

O que pode ser criado:
- movimento de saida;
- consumo de ingredientes;
- consumo de embalagem;
- consumo de produto pronto;
- consumo de ficha tecnica;
- regularizacao automatica quando permitido;
- pendencia de regularizacao quando configurado.

Limites:
- nao deve duplicar movimento para o mesmo pedido;
- cancelamento precisa estornar/cancelar efeitos;
- venda sem saldo depende da regra de estoque.

### 5.7 Entrada financeira por pedido

O sistema pode gerar uma entrada financeira a partir do pedido quando ele nao esta pendente e cumpre as regras.

O que pode ser criado:
- movimentacao financeira de entrada;
- valor bruto;
- taxas/comissoes do canal;
- valor liquido;
- categoria financeira herdada do canal;
- conta bancaria;
- status previsto;
- vinculo ao pedido.

Regra:
- pedidos comuns entram como `previsto`, mesmo pagos, para conferencia e baixa manual;
- pedido pendente nao deve enviar ao Financeiro;
- cancelamento marca a movimentacao como cancelada/estornada.

## 6. Solucoes de venda presencial / caixa

O sistema pode criar vendas presenciais com comportamento de caixa.

O que pode ser criado:
- sessao de caixa;
- abertura de caixa;
- venda presencial;
- itens com escolhas;
- aplicacao de promocoes quando compatível;
- movimentos de caixa;
- sangria/reforco/ajuste;
- fechamento de caixa;
- movimento financeiro da venda.

Para que serve:
- registrar venda de balcao;
- separar canal presencial da loja online;
- controlar caixa do dia;
- enviar dinheiro para o Financeiro com origem correta.

Dados usados:
- configuracao TPV;
- produtos;
- formas de pagamento;
- conta bancaria/caixa;
- promocoes;
- sessao aberta.

## 7. Solucoes de clientes e relacionamento

### 7.1 Cadastro de cliente

O sistema pode criar cadastro de cliente da loja.

O que pode ser criado:
- nome;
- telefone/WhatsApp;
- e-mail;
- documento fiscal opcional;
- avatar;
- endereco;
- multiplos enderecos;
- preferencias;
- alergias;
- observacoes;
- segmento;
- canal principal;
- vinculo com pedidos.

Para que serve:
- historico;
- recompra;
- pontos;
- WhatsApp;
- pedido manual;
- atendimento.

### 7.2 Perfil do cliente

O sistema pode gerar uma visao consolidada do cliente.

O que aparece:
- dados cadastrais;
- historico de pedidos;
- total gasto;
- ticket medio;
- recorrencia;
- canal principal;
- avaliacoes;
- pontos;
- enderecos.

### 7.3 Segmentacao operacional

O sistema pode classificar clientes por comportamento.

Segmentos observados:
- novo;
- recorrente;
- VIP;
- inativo;
- sem pedido;
- bloqueado/inativo conforme status.

Para que serve:
- filtros;
- atendimento;
- acoes de recompra;
- uso de pontos;
- leitura de base de clientes.

## 8. Solucoes de compras e fornecedores

### 8.1 Registro de compra

O sistema pode criar compras de insumos, embalagens e produtos prontos.

O que pode ser criado:
- numero de pedido de compra;
- fornecedor;
- itens comprados;
- quantidades;
- unidades;
- custo unitario;
- total;
- status da compra;
- recebimento total ou parcial;
- parcelas/contas a pagar;
- entrada de estoque;
- vinculo fiscal quando habilitado.

Para que serve:
- controlar compras;
- atualizar custo;
- alimentar estoque;
- gerar financeiro de saidas.

### 8.2 Recebimento de compra

O sistema pode criar recebimentos totais ou parciais.

O que pode ser criado:
- quantidade recebida por item;
- pendencia de recebimento;
- movimento de entrada no estoque;
- status de recebida/parcial;
- historico de recebimento.

### 8.3 Contas a pagar a partir de compra

O sistema pode gerar contas a pagar a partir da compra.

O que pode ser criado:
- parcela unica;
- multiplas parcelas;
- vencimentos;
- categoria financeira;
- conta bancaria;
- valor por parcela;
- status pendente;
- vinculo com a compra.

Regras:
- se compra ja tem financeiro ativo, edicoes relevantes exigem sincronizacao/estorno;
- ao voltar compra para pendente, historicos financeiros e de estoque precisam ser preservados via estorno/cancelamento.

### 8.4 Fornecedores

O sistema pode criar fornecedores.

O que pode ser criado:
- nome;
- contato;
- e-mail;
- telefone/WhatsApp;
- documento;
- endereco;
- categorias;
- observacoes;
- conta bancaria/condicoes quando aplicavel;
- padroes usados em compras.

### 8.5 Categorias e unidades de compra

O sistema pode criar:
- categorias de compra;
- unidades de medida;
- categorias por classe de item;
- cadastro rapido de categoria durante criacao de item;
- cadastro rapido de fornecedor durante criacao de item.

## 9. Solucoes de estoque

### 9.1 Configuracao de regra de estoque

O sistema pode criar e salvar regras de operacao do estoque.

Possibilidades:
- bloquear venda quando zerar;
- permitir venda sem saldo;
- criar pendencia de regularizacao;
- regularizar automaticamente conforme configuracao;
- definir estoque minimo e maximo por item.

### 9.2 Movimento de estoque

O sistema pode criar movimentos de estoque.

Tipos praticos:
- entrada por compra;
- saida por venda;
- ajuste manual;
- regularizacao de venda sem saldo;
- estorno;
- inventario;
- movimento de cadeia quando ficha/producao exige consumo relacionado.

Campos importantes:
- item;
- quantidade;
- unidade;
- custo;
- origem;
- pedido ou compra vinculada;
- data;
- motivo;
- status.

### 9.3 Pendencia de regularizacao

Quando uma venda acontece sem saldo suficiente, o sistema pode criar uma pendencia.

O que pode ser criado:
- alerta de item sem saldo;
- pedido relacionado;
- custo estimado;
- acao de ignorar;
- acao de regularizar;
- movimento de entrada corretiva;
- movimento de consumo tecnico relacionado.

Para que serve:
- permitir vender sem travar a operacao, mas sem perder o rastro do estoque.

### 9.4 Inventario e ajustes

O sistema pode criar ajustes de inventario.

O que pode ser feito:
- informar quantidade real;
- gerar movimento de ajuste;
- salvar motivo;
- atualizar saldo;
- comparar saldo esperado com saldo contado.

## 10. Solucoes financeiras

### 10.1 Entrada financeira

O sistema pode criar entradas financeiras manualmente ou a partir de pedidos.

O que pode ser criado:
- entrada prevista;
- entrada recebida/baixada;
- valor bruto;
- valor liquido;
- desconto/taxa;
- categoria;
- conta bancaria;
- data;
- pedido vinculado;
- canal de venda;
- status.

### 10.2 Saida financeira / conta a pagar

O sistema pode criar saidas e contas a pagar.

O que pode ser criado:
- conta unica;
- conta recorrente;
- parcela de compra;
- vencimento;
- competencia;
- categoria;
- centro/custo direto ou indireto quando usado;
- conta bancaria;
- baixa;
- estorno;
- cancelamento.

### 10.3 Fluxo de caixa

O sistema pode gerar uma leitura de fluxo.

O que pode ser calculado:
- entradas previstas;
- entradas recebidas;
- saidas previstas;
- saidas pagas;
- saldo do periodo;
- contas a vencer;
- atraso;
- projecao por periodo.

### 10.4 Categorias financeiras

O sistema pode criar categorias financeiras.

Tipos de uso:
- categoria de entrada;
- categoria de saida;
- categoria herdada de canal de venda;
- categoria usada em compras;
- categoria usada em contas a pagar;
- natureza/custo direto/indireto quando aplicavel.

### 10.5 Contas bancarias

O sistema pode criar contas bancarias/caixas.

Para que serve:
- receber vendas;
- pagar compras;
- separar caixa presencial;
- herdar conta padrao por canal;
- rastrear origem do dinheiro.

## 11. Solucoes de precos e margem

### 11.1 Composicao de preco

O sistema pode calcular composicao de preco por produto.

O que pode ser gerado:
- custo direto;
- custo de ingredientes;
- custo de embalagem;
- custo de produto pronto;
- custo de ficha tecnica;
- margem;
- lucro estimado;
- impacto de taxas de canal;
- preco por canal;
- alerta de margem baixa.

### 11.2 Lista de precos

O sistema pode gerar uma lista de precos por produto.

O que aparece:
- preco atual;
- custo estimado;
- margem;
- situacao do preco;
- preco por canal quando ha taxas;
- produtos sem custo completo;
- produtos com risco de margem.

### 11.3 Simulador de preco

O sistema pode simular preco e margem.

O que pode ser testado:
- preco de venda;
- custo;
- taxa de canal;
- comissao;
- imposto sobre comissao;
- taxa fixa;
- margem minima;
- lucro esperado.

Para que serve:
- decidir se desconto cabe;
- ajustar preco antes de promover;
- comparar canais.

### 11.4 Regras de preco

O sistema pode salvar regras de formacao de preco.

O que pode ser configurado:
- margem minima;
- custos indiretos manuais ou automaticos;
- canais de venda;
- taxas e comissoes;
- regra de preco por canal;
- conta financeira e categoria associada ao canal quando configurado.

## 12. Solucoes de performance e leitura do negocio

O sistema pode gerar leituras de performance sem depender de uma campanha especifica.

O que pode ser calculado:
- faturamento;
- pedidos;
- ticket medio;
- produtos mais vendidos;
- produtos com baixa saida;
- canais com melhor resposta;
- dias com venda;
- dias fracos;
- comparacoes com base anterior;
- previsao quando existe historico suficiente;
- alertas de falta de base.

Cuidados:
- quando nao existe historico suficiente, o sistema deve mostrar `Sem base` ou explicar a falta de dados;
- nao deve dizer `0 pedidos por dia` como orientacao quando o problema e ausencia de base;
- leituras precisam diferenciar inicio de mes, ausencia de rota, ausencia de pedidos e performance real.

## 13. Solucoes de Plano de Voo

O sistema pode criar um plano financeiro-operacional do mes.

O que pode ser gerado:
- cenario do mes;
- meta de faturamento;
- ticket medio usado como base;
- pedidos necessarios;
- previsao de gastos;
- margem esperada;
- snapshots do plano;
- comparacao entre planejado e realizado;
- contas previstas;
- rota de venda.

Para que serve:
- dar direcao mensal;
- transformar faturamento desejado em volume necessario;
- mostrar se o negocio esta no ritmo;
- apoiar preco, compras e financeiro.

Limite:
- este documento nao detalha como Temporadas usa o Plano de Voo.

## 14. Solucoes fiscais

Quando o modulo Fiscal esta habilitado para o pais fiscal suportado, o sistema pode gerar leituras fiscais estimadas.

O que pode ser criado/calculado:
- configuracao fiscal;
- trimestre;
- resumo de IVA;
- resumo de IRPF;
- compras dedutiveis;
- classificacao fiscal de compras;
- impacto fiscal estimado;
- detalhes por item/periodo.

Para que serve:
- organizar informacao para conferencia;
- acompanhar IVA/IRPF estimado;
- separar compra dedutivel de nao dedutivel.

Limites:
- calculo e estimado;
- nao substitui contador/gestor fiscal;
- pais fiscal e controlado pelo Master;
- nesta fase, regras implementadas existem apenas para paises definidos no sistema.

## 15. Solucoes de configuracao do negocio

### 15.1 Dados gerais do negocio

O sistema pode criar e salvar dados operacionais da loja.

O que pode ser salvo:
- nome do negocio;
- cidade/localidade atendida;
- endereco publico;
- contatos;
- redes sociais;
- logo/avatar;
- idioma;
- pais/endereco quando aplicavel;
- dados sincronizados para `system_tenants`.

### 15.2 Usuario responsavel

O sistema pode criar/salvar dados do usuario responsavel pela conta.

O que pode ser salvo:
- nome completo;
- nome curto/social;
- WhatsApp do usuario;
- e-mail de acesso;
- papel/permissao;
- idioma da conta;
- acao de redefinicao de senha.

### 15.3 Canais de venda

O sistema pode criar canais de venda.

O que pode ser configurado:
- nome do canal;
- ativo/inativo;
- comissao;
- imposto sobre comissao;
- taxa fixa;
- categoria financeira de entrada;
- conta bancaria padrao;
- canal TPV/presencial quando habilitado.

Para que serve:
- calcular liquido do pedido;
- herdar categoria e conta no Financeiro;
- comparar canais;
- evitar confundir bruto com liquido.

### 15.4 Integracoes

O sistema pode salvar integracoes operacionais.

Possibilidades:
- GA4;
- GTM;
- Meta Pixel;
- contatos/redes sociais;
- configuracoes de medicao da loja publica.

## 16. Solucoes de onboarding e diagnostico inicial

O sistema pode criar uma experiencia guiada de primeiro acesso.

O que pode ser criado:
- conta inicial;
- vinculo com compra Hotmart quando encontrada;
- dados do usuario responsavel;
- dados iniciais da loja;
- diagnostico de maturidade;
- perfil do negocio em `businessProfile`;
- aceite legal;
- preferencias de comunicacao;
- e-mail transacional de cadastro concluido.

Estados que o sistema pode gerar:
- sucesso com compra ativa;
- alerta quando nao encontra compra ativa;
- modo previa;
- pendencia manual quando falta identificador suficiente;
- tenant com dados iniciais preservando billing.

Limites:
- se nao houver compra ativa, nao deve exibir sucesso;
- e-mail de boas-vindas so depois do aceite final;
- preferencias comerciais nao disparam campanhas automaticamente nesta fase.

## 17. Solucoes de suporte e documentacao

O sistema pode criar chamados e orientar a usuaria por documentacao interna.

O que pode ser criado:
- chamado de suporte;
- modulo de documentacao;
- guias por area;
- conteudo de ajuda dentro do Admin;
- rota para falar com suporte.

Para que serve:
- registrar problema;
- orientar configuracao;
- reduzir dependencia de atendimento manual;
- separar duvida operacional de bug.

## 18. Solucoes transacionais e automacoes de backend

O backend pode criar registros e acoes automaticas relacionadas a acesso, pagamento, e-mail e integracoes.

Possibilidades:
- e-mail de redefinicao de senha;
- e-mail de cadastro concluido;
- logs de e-mail;
- logs de acesso/suporte;
- vinculo de compra Hotmart;
- pendencia de Hotmart quando nao ha identificador suficiente;
- bloqueio/liberacao de conta por eventos Hotmart;
- PaymentIntent Stripe para loja publica;
- webhook Stripe atualizando pedido/pagamento;
- movimento financeiro de pagamento online quando aplicavel;
- backup Firestore administrativo;
- logs de uso de IA quando endpoint remoto for usado;
- tags transacionais de conta;
- tags CRM separadas das tags de e-mail.

Limites:
- nao salvar tokens ou payloads sensiveis em logs;
- nao misturar tenants;
- nao usar Hotmart payload completo como dado publico;
- nao apagar tenant/loja/dados por evento de pagamento;
- bloqueios devem preservar dados.

## 19. O que o sistema nao deve inventar

O BocaFood deve evitar criar solucoes sem base operacional.

Nao deve inventar:
- cliente que nao existe;
- pedido que nao foi registrado;
- produto vencedor sem pedidos suficientes;
- margem sem custo/preco;
- campanha sem canal ou acao configurada;
- desconto saudavel sem custo;
- estoque disponivel sem saldo/composicao;
- resultado de cupom/promocao/upsell sem pedido real;
- dados de outra loja;
- status financeiro sem movimentacao/vinculo;
- informacao fiscal de pais nao suportado.

Quando nao houver base:
- criar base de leitura;
- pedir cadastro minimo necessario;
- registrar pedidos corretamente;
- completar custo/preco;
- completar canal;
- completar cliente;
- mostrar estado vazio claro.

## 20. Exemplos de solucoes praticas fora de Temporadas

### Exemplo 1: Cupom de recompra

O sistema pode criar:
- cupom `VOLTA10`;
- desconto percentual;
- pedido minimo;
- validade curta;
- limite de uso.

Como a usuaria usa:
- envia por WhatsApp para clientes antigos;
- acompanha uso nos pedidos;
- ve impacto em faturamento e recompra.

Como o BocaFood le:
- pedido com codigo do cupom;
- cliente vinculado;
- data dentro da validade;
- total vendido com desconto.

### Exemplo 2: Upsell de complemento

O sistema pode criar:
- regra de upsell;
- produto gatilho;
- produto sugerido;
- mensagem;
- beneficio;
- periodo.

Como a usuaria usa:
- ativa no Cardapio;
- cliente ve complemento antes de fechar pedido;
- pedido salva extra aceito.

Como o BocaFood le:
- pedido com produto principal;
- produto sugerido comprado junto;
- ticket medio;
- margem estimada.

### Exemplo 3: Pedido manual de WhatsApp

O sistema pode criar:
- pedido;
- cliente;
- produtos;
- escolhas;
- desconto manual;
- canal WhatsApp;
- data de entrega;
- status pendente.

Como a usuaria usa:
- registra venda recebida fora da loja publica;
- acompanha na cozinha;
- quando deixar de ser pendente, envia ao financeiro conforme regra.

### Exemplo 4: Compra com estoque e financeiro

O sistema pode criar:
- compra;
- itens;
- fornecedor;
- recebimento parcial;
- entrada no estoque;
- contas a pagar.

Como a usuaria usa:
- registra compra real;
- atualiza custo;
- controla pagamento;
- evita vender sem saber saldo.

### Exemplo 5: Ajuste de preco por margem

O sistema pode calcular:
- custo do produto;
- taxas do canal;
- margem atual;
- preco sugerido/simulado;
- risco de desconto.

Como a usuaria usa:
- ajusta preco antes de promover;
- decide se cabe cupom;
- compara Cardapio, Glovo, presencial ou outro canal.

### Exemplo 6: Loja publica pronta para divulgar

O sistema pode criar:
- slug;
- link publico;
- template;
- produtos publicados;
- SEO basico;
- rastreamento.

Como a usuaria usa:
- divulga link;
- recebe pedido;
- acompanha no Admin.

## 21. Matriz resumida de possibilidades

| Area | O sistema pode criar | Principal uso |
| --- | --- | --- |
| Loja Online | loja publica, slug, template, SEO, rastreamento | vender online |
| Catalogo | produtos, categorias, combos, escolhas, tags, imagens | montar cardapio |
| Receitas | fichas tecnicas, custos, rendimento | calcular margem e estoque |
| Marketing | promocoes, cupons, upsells, pontos, avaliacoes | vender e reter |
| Pedidos | pedido publico, manual, cozinha, desconto, status | operar venda |
| Clientes | cadastro, enderecos, historico, pontos, segmentos | relacionamento |
| POS | venda presencial, caixa, movimentos | vender no balcao |
| Compras | compras, fornecedores, parcelas, recebimento | abastecimento |
| Estoque | entradas, saidas, ajustes, inventario, regularizacao | controle operacional |
| Financeiro | entradas, saidas, contas, categorias, fluxo | controle de dinheiro |
| Dinheiro | preco, margem, simulacao, regras por canal | decisao de preco |
| Performance | leituras, alertas, comparacoes | entender resultado |
| Plano de Voo | meta, previsao, snapshots | direcao mensal |
| Fiscal | IVA, IRPF, compras dedutiveis | organizacao fiscal |
| Configuracoes | dados do negocio, canais, integracoes | base do sistema |
| Onboarding | conta, diagnostico, aceite, preferencias | primeiro acesso |
| Suporte | chamados e guias | ajuda operacional |

## 22. Leitura final

O BocaFood nao e apenas um cadastro de loja. Ele cria uma estrutura operacional para a usuaria vender, registrar, medir e corrigir o negocio.

As solucoes mais importantes que o sistema consegue gerar fora de Temporadas sao:
- loja publica vendavel;
- cardapio estruturado;
- produtos com custo e margem;
- promocoes;
- cupons;
- upsells;
- pontos;
- pedidos completos;
- clientes com historico;
- compras e fornecedores;
- estoque movimentado;
- financeiro conciliavel;
- preco e margem por produto/canal;
- performance legivel;
- plano mensal;
- suporte e onboarding.

A regra central para qualquer solucao gerada deve ser: a usuaria precisa conseguir executar, e o BocaFood precisa conseguir registrar ou medir depois.
