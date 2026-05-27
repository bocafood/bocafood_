# Mapa de Dados e Inteligência do BocaFood

Atualizado em: 2026-05-26  
Escopo: rastreio do que foi construído até agora nos módulos de operação, loja pública, financeiro, produção, estoque, marketing, performance e Plano de Voo.

## 1. Visão Geral

O BocaFood hoje funciona como um sistema multi-tenant em que cada loja trabalha com seus próprios dados via `tenantId`. A pasta publicada é `public/`, portanto os fluxos reais do Admin e da loja pública estão concentrados principalmente em:

- `public/admin.html`
- `public/index.html`
- `public/js/modules/*.js`

A inteligência do sistema é gerada principalmente pela combinação de:

- pedidos (`orders`);
- produtos, categorias, variantes e tags (`products`, `categories`, `variantGroups`, `tags`);
- clientes (`store_customers`);
- financeiro (`movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `contas_pagar`, `contas_bancarias`, `financeiro_categorias`);
- compras e fornecedores (`compras`, `itens_custo`, `fornecedores`, `compras_categorias`);
- produção (`fichasTecnicas`, `production_orders`, `production_purchase_lists`);
- estoque (`stock_movements`, `stock_settings`);
- marketing (`promotions`, `promocoes`, `coupons`, `upsellRules`, `upsellEvents`);
- fidelidade (`config/pontos_program`, `points_movements`);
- configuração da loja (`config/template`, `config/operacao`, `config/horarios`, `config/zonas`, `config/seo`, `config/financeiro`, `config/canais_venda`, `config/dinheiro`, `config/tpv`).

## 2. Navegação e Ambientes

Arquivo principal: `public/admin.html`

### Ambientes

- `Operação`: concentra a operação diária do sistema.
- `Inteligência`: concentra leitura, análise e decisão.
- `Maturidade do Negócio`: permanece como item próprio.
- `Performance`: permanece como item próprio.
- `Configurações`: permanece como item próprio.

### Plano de Voo

O acesso visual ao `Plano de Voo` está em:

- `Inteligência > Operação > Plano de Voo`

A rota real foi preservada:

- `crescimento/plano-de-voo`

Motivo: manter compatibilidade com links antigos, módulos já registrados e dados salvos em `flight_plans` e `flight_plan_month_scenarios`.

## 3. Loja Pública e Checkout

Arquivo principal: `public/index.html`

### Dados carregados

A loja pública carrega dados de:

- `config/geral`
- `config/aparencia`
- `config/template`
- `config/operacao`
- `config/horarios`
- `config/zonas`
- `config/pontos_program`
- `config/integracoes`
- `config/seo`
- `categories`
- `products`
- `variantGroups`
- `tags`
- `reviews`
- `promotions`
- `promocoes`
- `coupons`
- `upsellRules`
- `orderSlots`
- `store_customers`
- `points_movements`

### Pedido gerado pela loja pública

Coleção:

- `orders`

Campos/conceitos principais enviados:

- cliente: nome, telefone, e-mail, documento, dados complementares quando logado;
- endereço de entrega ou retirada;
- forma de pagamento;
- observação do pedido;
- itens com quantidade, preço, subtotal, escolhas/variantes, observação do item e vínculo de produto;
- desconto de promoção;
- desconto de upsell;
- desconto de cupom;
- desconto por pontos;
- frete e frete grátis por promoção/upsell;
- canal: `cardapio`;
- status inicial de cozinha;
- dados para financeiro, estoque e fiscal.

### Inteligência gerada na loja pública

- cálculo do total do carrinho;
- cálculo de promoções por produto;
- cálculo de benefícios de upsell;
- aplicação de cupom;
- resgate opcional de pontos;
- cálculo de frete por zona/CEP;
- bloqueio de checkout quando faltam dados obrigatórios;
- mensagem formatada para WhatsApp;
- criação do pedido no Admin;
- sincronização de uso de cupom;
- movimentação de pontos quando há resgate;
- preservação de endereço/telefone do cliente logado para próximas compras.

## 4. Pedidos e Cozinha

Arquivo principal: `public/js/modules/pedidos.js`

### Dados lidos

- `orders`
- `store_customers`
- `products`
- `variantGroups`
- `promotions`
- `promocoes`
- `config/financeiro`
- dados de estoque e ficha técnica quando necessário.

### Dados salvos/alterados

- `orders`
- `movimentacoes`
- `stock_movements`
- dados de checklist/status dentro do pedido.

### Inteligência operacional

- separação entre listagem de pedidos e modo cozinha;
- filtros por data, período, status e busca;
- contagem de pedidos ativos;
- status operacional do pedido;
- checklist de preparo salvo mesmo sem mudar status;
- mensagens de WhatsApp somente quando há mudança real de status;
- link de avaliação quando pedido é entregue;
- edição de itens do pedido sem editar cadastro do produto;
- edição de escolhas/variantes do item;
- integração com baixa de estoque por venda;
- retorno/perda de itens quando uma venda já baixou estoque.

### Estoque no pedido

Tipos envolvidos:

- `saida_venda`: baixa de produto vendido.
- `retorno_venda`: devolve item ao estoque.
- `perda_venda`: registra perda operacional sem duplicar baixa.

Regra atual:

- produtos com vínculo de ficha/produto produzido baixam pelo item produzido;
- produto pronto de compra pode baixar diretamente quando há vínculo próprio;
- itens sem vínculo não bloqueiam o pedido, mas não geram baixa completa.

## 5. Venda Presencial

Arquivo principal: `public/js/modules/pos.js`

### Dados lidos

- `config/tpv`
- `config/financeiro`
- `cash_sessions`
- `orders`
- `products`
- `categories`
- `variantGroups`
- `promotions`
- `promocoes`

### Dados salvos

- `orders`
- `movimentacoes`
- `cash_sessions`
- `stock_movements`
- `config/tpv`

### Regras criadas

- venda presencial cria pedido como entregue;
- pedido entra na listagem de pedidos;
- pedido pode entrar no histórico operacional;
- baixa estoque via mesma lógica de pedido entregue;
- gera entrada financeira para a conta `Caixa venda presencial`;
- usa apenas formas de pagamento cadastradas no Financeiro;
- se não houver forma de pagamento, bloqueia finalização e orienta cadastrar;
- produtos ocultos no cardápio não aparecem no POS;
- promoções ativas para Venda presencial são consideradas;
- variantes e combos precisam ser escolhidos antes de adicionar ao carrinho.

### Caixa presencial

Coleção:

- `cash_sessions`

Movimentos neutros:

- abertura;
- reforço;
- sangria;
- fechamento/conferência.

Importante:

- caixa inicial, reforço e sangria não viram receita/despesa;
- eles registram onde está o dinheiro da conta da venda presencial: físico no caixa ou na conta.

## 6. Financeiro

Arquivo principal: `public/js/modules/financeiro.js`

### Dados lidos/salvos

- `movimentacoes`
- `financeiro_entradas`
- `financeiro_saidas`
- `financeiro_apagar`
- `contas_pagar`
- `contas_bancarias`
- `financeiro_categorias`
- `fornecedores`
- `store_customers`
- `config/financeiro`

### Inteligência financeira

- visão geral de entradas, saídas e saldo;
- fluxo de caixa;
- contas a pagar;
- entradas;
- categorias financeiras;
- formas de pagamento;
- contas bancárias;
- conta automática para Venda presencial;
- transferências entre contas;
- leitura de categorias por natureza financeira:
  - receita;
  - despesa;
  - custo.
- leitura por classe:
  - direto;
  - indireto.

### Conexões

- pedidos confirmados/entregues podem gerar entrada financeira;
- compras podem gerar contas a pagar;
- venda presencial gera entrada na conta do POS;
- Plano de Voo lê dados financeiros para despesas/custos previstos;
- Performance lê financeiro para comparar previsto x realizado.

## 7. Compras, Itens e Fornecedores

Arquivo principal: `public/js/modules/compras.js`

### Dados lidos/salvos

- `compras`
- `fornecedores`
- `itens_custo`
- `unidades_medida`
- `compras_categorias`
- `contas_pagar`
- `stock_movements`
- `stock_settings`
- `config/compras`

### Inteligência operacional

- cadastro de fornecedores com dados fiscais e endereço;
- cadastro de produtos/insumos de compra;
- classe do item:
  - insumo;
  - produto pronto;
  - base de produção quando aplicável em produção;
- custo por embalagem e custo por unidade base;
- fornecedor padrão;
- mínimo/máximo de estoque na origem do item;
- registro de compra;
- recebimento total/parcial;
- bloqueios quando compra já foi recebida/cancelada;
- geração de contas a pagar;
- geração de entrada de estoque por compra.

### Estoque vindo de compra

Tipo:

- `entrada_compra`

Regra:

- uma movimentação por item comprado;
- evita duplicidade;
- compras antigas podem ter ação manual para gerar entrada.

## 8. Produção Operacional

Arquivo principal: `public/js/modules/receitas.js`

### Dados lidos/salvos

- `fichasTecnicas`
- `itens_custo`
- `production_orders`
- `production_purchase_lists`
- `stock_movements`
- `stock_settings`

### Ordens de produção

Coleção:

- `production_orders`

Campos/conceitos:

- ficha técnica escolhida;
- quantidade planejada;
- data prevista;
- observação;
- status `planejada`, `concluida` ou cancelada quando aplicável;
- snapshot da ficha técnica no momento da criação;
- ingredientes previstos;
- custo previsto;
- quantidade real produzida;
- perda real;
- custo real estimado por unidade;
- status de resultado operacional.

### Inteligência da produção

- compara planejado x produzido;
- calcula diferença de rendimento;
- calcula variação percentual;
- calcula custo real estimado por unidade;
- classifica resultado:
  - dentro do esperado;
  - rendimento menor;
  - rendimento muito menor;
  - rendimento maior.

### Movimentações da produção

Coleção:

- `stock_movements`

Tipos:

- `saida_producao`: saída de ingredientes usados na produção;
- `entrada_producao`: entrada do produto produzido.

Regra:

- usa snapshot da ordem;
- gera uma vez;
- não recalcula usando ficha técnica atual.

### Lista de Compras da Produção

Coleção:

- `production_purchase_lists`

Objetivo:

- gerar lista a partir de ordens planejadas, necessidade de produção e/ou estoque mínimo;
- separar por classe;
- permitir status de controle;
- manter lista de impressão com checkbox;
- ainda não conecta automaticamente com Compras nem altera estoque.

## 9. Estoque

Arquivo principal: `public/js/modules/estoque.js`

### Dados lidos/salvos

- `stock_movements`
- `stock_settings`
- `itens_custo`
- `fichasTecnicas`
- `products`

### Como o saldo é calculado

O saldo não é salvo como número final. Ele é calculado a partir das movimentações:

- entradas somam;
- saídas subtraem;
- perdas podem registrar histórico sem duplicar baixa quando já houve saída anterior.

### Tipos principais de movimentação

- `entrada_compra`
- `entrada_producao`
- `saida_producao`
- `saida_venda`
- `retorno_venda`
- `perda_venda`
- ajustes de inventário/contagem.

### Classes de estoque

- `insumo`
- `produto`
- `produto_pronto`
- `produto_produzido`
- `base_producao`

### Inteligência de estoque

- saldo atual por item;
- valor estimado em estoque;
- última movimentação;
- origem da movimentação;
- mínimo e máximo por item;
- alerta visual quando abaixo do mínimo ou acima do máximo;
- detalhe do item com busca e paginação de movimentações;
- ajuste de estoque por contagem;
- inventário em lote.

## 10. Plano de Voo

Arquivo principal: `public/js/modules/plano_voo.js`

### Dados lidos

- `orders`
- `movimentacoes`
- `financeiro_saidas`
- `financeiro_apagar`
- `financeiro_categorias`
- `config/geral`
- `config/dinheiro`
- `config/financeiro`
- `config/custos`
- `config/canais_venda`
- `flight_plans`
- `flight_plan_month_scenarios`

### Dados salvos

- `flight_plans`
- `flight_plan_month_scenarios`
- `contas_pagar`, quando a ação específica de gerar compromisso financeiro é usada.

### Cenários

- `Sobrevivência`: fator base `0.90`;
- `Segurança`: fator base `1.00`;
- `Crescimento`: fator base `2.00`;
- `Lucro forte`: fator base `3.00`.

### Base da rota

A rota considera:

- período automático da rota:
  - ano completo se criada em janeiro;
  - restante do ano se criada a partir de fevereiro;
- ticket médio;
- previsão por canal;
- dias trabalhados;
- feriados/dias fechados;
- sazonalidade manual mês a mês;
- custos das vendas;
- despesas diretas;
- custos diretos;
- reservas configuradas;
- histórico apenas quando existe base suficiente.

### Inteligência gerada

- faturamento necessário;
- pedidos por dia;
- lucro estimado;
- ponto de segurança;
- distribuição mensal;
- comparação entre cenários;
- alerta quando previsão de vendas não cobre custos/despesas;
- leitura de meses mais fortes/fracos;
- resumo dos cenários não escolhidos.

### Regra conceitual atual

- a usuária cria uma rota;
- escolhe um cenário;
- a rota vira ativa;
- a rota ativa não deve ser editada livremente;
- para mudar o caminho, cria uma nova rota;
- Performance acompanha a execução da rota.

## 11. Performance

Arquivo principal: `public/js/modules/performance.js`

### Dados lidos

- `orders`
- `movimentacoes`
- `financeiro_entradas`
- `financeiro_saidas`
- `financeiro_apagar`
- `financeiro_categorias`
- `flight_plans`
- `flight_plan_month_scenarios`
- `config/dinheiro`
- `config/canais_venda`

### Inteligência gerada

- status da rota no mês;
- esperado até hoje;
- vendido até hoje;
- meta do mês;
- ticket médio atual;
- falta vender;
- pedidos por dia daqui para frente;
- pedidos previstos no mês;
- pedidos já feitos;
- projeção se continuar no ritmo atual;
- leitura prática com mensagens de orientação;
- vendas por canal;
- melhor canal;
- melhor dia;
- entradas e saídas;
- saldo líquido;
- margem operacional;
- gastos por categoria comparando previsto x realizado.

### Relação com Plano de Voo

- lê a rota ativa do mês em `flight_plan_month_scenarios`;
- se não encontrar mês atual, usa `flight_plans` como fallback;
- usa `monthSeries` da rota anual para comparar somente o mês correto, evitando comparar mês contra meta anual.

## 12. Marketing, Promoções, Cupons e Upsell

Arquivo principal: `public/js/modules/marketing.js`  
Loja pública: `public/index.html`  
Venda presencial/pedidos: `public/js/modules/pos.js`, `public/js/modules/pedidos.js`

### Promoções

Coleções:

- `promotions`
- `promocoes`

Tipos tratados:

- desconto percentual;
- desconto em valor;
- preço fixo;
- leve X pague Y;
- frete grátis.

Regras importantes:

- mesmo produto não deve entrar em mais de uma promoção no mesmo período;
- data final não pode ser antes da inicial;
- promoção não deve começar antes da data atual;
- `leve` não pode ser maior que `pague`;
- canais definem onde a promoção pode aparecer;
- loja pública, pedido manual e venda presencial precisam respeitar os campos principais.

### Cupons

Coleções:

- `coupons`

Integrações:

- loja pública aplica cupom no checkout;
- cupom pode ter link com desconto automático;
- uso do cupom é sincronizado após pedido;
- pedido salva desconto, código e total.

### Upsell

Coleções:

- `upsellRules`
- `upsellEvents`

Inteligência:

- tipo de upsell;
- produto gatilho;
- produto sugerido;
- benefício;
- momento de exibição;
- análise de margem mínima;
- impacto por produto;
- vendas/conversão;
- sugestão ao cliente no modal/carrinho.

Regra de aplicação:

- upsell só deve impactar o carrinho quando o cliente aceita;
- pode oferecer benefício, desconto, brinde ou frete grátis conforme configuração;
- pedidos salvam os benefícios aplicados.

## 13. Programa de Pontos

Arquivos principais:

- `public/js/modules/marketing.js`
- `public/index.html`

### Dados lidos/salvos

- `config/pontos_program`
- `store_customers`
- `points_movements`
- `orders`

### Inteligência gerada

- pontos por valor gasto;
- pontos disponíveis;
- pontos para gerar desconto;
- mínimo para resgate;
- validade dos pontos;
- pontos a expirar;
- desconto possível no carrinho;
- opção de usar ou guardar pontos;
- histórico de movimentos;
- pedidos relacionados ao cliente.

### Regras atuais

- cliente precisa estar logado para ver/resgatar pontos;
- se não estiver logado, a loja orienta entrar ou criar acesso;
- resgate gera movimento em `points_movements`;
- pedido salva `pointsRedemption` e `pointsDiscountTotal`.

## 14. Clientes

Arquivo principal: `public/js/modules/clientes.js`  
Loja pública: `public/index.html`

### Dados lidos/salvos

- `store_customers`
- dados de pedidos quando há vínculos;
- pontos e movimentos quando necessário.

### Campos principais

- nome;
- WhatsApp;
- e-mail;
- documento;
- aniversário;
- aceite de promoções;
- preferências;
- alergias;
- observações;
- avatar;
- endereços de entrega nomeados;
- dados fiscais;
- canal principal.

### Conexões

- checkout público salva/usa cliente logado;
- pedido recebe snapshot de cliente;
- programa de pontos usa cliente;
- financeiro pode vincular entrada a cliente;
- pedidos podem ser agrupados no detalhe do cliente.

## 15. Fiscal Preparado

Arquivos principais:

- `public/js/modules/catalogo.js`
- `public/js/modules/clientes.js`
- `public/js/modules/compras.js`
- `public/js/modules/pedidos.js`
- `public/js/modules/fiscal.js`

### Estruturas adicionadas

- `fiscal` em produtos;
- `fiscal` em clientes;
- `fiscal` em fornecedores;
- `fiscal` em pedidos;
- `tenants/{tenantId}/config/fiscal`.

### Status

Preparado para futura integração fiscal/facturación/VeriFactu, sem emissão real, sem QR/hash/XML e sem provedor externo.

## 16. Canais de Venda

Coleção/config:

- `config/canais_venda`

Uso atual:

- cadastro de cliente;
- pedidos;
- Performance;
- Plano de Voo;
- promoções/upsell quando há filtro por canal.

Normalização importante:

- `template`, `loja-online`, `loja-publica` e equivalentes são tratados como `cardapio`;
- `tpv` é tratado como `venda-presencial`;
- canais configurados pela usuária têm prioridade na exibição.

## 17. Fluxos Principais Ponta a Ponta

### Pedido pela loja pública

1. Cliente escolhe produtos.
2. Loja aplica variantes, promoções, upsell, cupom, pontos e frete.
3. Pedido é salvo em `orders`.
4. Pedido aparece em Pedidos e Cozinha.
5. Quando confirmado/entregue, pode gerar financeiro e baixa de estoque.
6. Ao entregar, mensagem pode incluir link de avaliação.

### Venda presencial

1. Usuária abre caixa.
2. Escolhe produto, variantes/combo e forma de pagamento.
3. Sistema aplica promoções válidas para POS.
4. Venda cria pedido entregue.
5. Pedido entra em `orders`.
6. Entrada cai na conta `Caixa venda presencial`.
7. Estoque baixa.
8. Sessão de caixa registra conferência.

### Compra

1. Usuária registra compra.
2. Compra pode gerar financeiro.
3. Ao receber, compra gera `entrada_compra`.
4. Estoque passa a considerar entrada.
5. Produção pode usar insumos comprados.

### Produção

1. Usuária cria ordem a partir de ficha técnica.
2. Sistema salva snapshot da ficha.
3. Usuária finaliza produção.
4. Sistema calcula rendimento real.
5. Sistema gera saída de ingredientes e entrada de produto produzido.
6. Estoque passa a refletir as movimentações.

### Plano de Voo + Performance

1. Usuária cria rota no Plano de Voo.
2. Sistema salva `flight_plans` e cenário mensal em `flight_plan_month_scenarios`.
3. Performance lê a rota ativa.
4. Performance compara vendas reais, financeiro e ritmo com a rota.

## 18. Inteligências Existentes

### Operacional

- pedidos ativos;
- fila de cozinha;
- status de preparo;
- checklist de itens;
- retorno/perda;
- venda presencial com caixa;
- limites e disponibilidade de horários na loja pública.

### Comercial

- promoções aplicadas;
- benefício por produto;
- upsell aceito;
- desconto total;
- cupom usado;
- ticket médio;
- vendas por canal.

### Financeira

- entrada/saída;
- saldo líquido;
- conta financeira por canal;
- contas a pagar;
- categorias de despesa/custo;
- margem operacional;
- previsto x realizado.

### Produção e Estoque

- rendimento planejado x real;
- custo previsto x custo estimado real;
- saldo por movimentações;
- mínimo/máximo;
- necessidade de compra/produção;
- histórico por item.

### Estratégica

- rota ativa;
- cenários de faturamento/lucro;
- pedidos por dia;
- esforço operacional;
- ponto de segurança;
- acompanhamento mensal da rota.

## 19. Pontos de Atenção

- O estoque ainda é calculado por movimentações; não há saldo consolidado salvo.
- Produtos sem vínculo correto com ficha/produto pronto podem não baixar estoque na venda.
- Lista de compras da produção ainda não cria compra automaticamente.
- Facturación/VeriFactu ainda é apenas base estrutural.
- Integrações externas reais ainda não foram conectadas.
- Algumas coleções legadas coexistem com versões novas, como `promotions/promocoes` e `movimentacoes/financeiro_entradas/financeiro_saidas`.
- A leitura de canais depende de normalização para evitar mostrar valores legados como `template`.
- O Plano de Voo já usa rota anual/restante do ano, mas deve continuar sendo validado com dados reais de vários meses.

## 20. Arquivos Principais do Rastreio

- `public/admin.html`
- `public/index.html`
- `public/js/modules/catalogo.js`
- `public/js/modules/clientes.js`
- `public/js/modules/compras.js`
- `public/js/modules/configuracoes.js`
- `public/js/modules/dinheiro.js`
- `public/js/modules/estoque.js`
- `public/js/modules/financeiro.js`
- `public/js/modules/marketing.js`
- `public/js/modules/pedidos.js`
- `public/js/modules/performance.js`
- `public/js/modules/plano_voo.js`
- `public/js/modules/pos.js`
- `public/js/modules/receitas.js`

