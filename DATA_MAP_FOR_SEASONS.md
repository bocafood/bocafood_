# Mapa de Dados para Temporadas / Missões Operacionais

Relatório técnico para avaliar quais dados o BocaFood já gera hoje e como eles podem alimentar futuramente um módulo de **Temporadas / Missões Operacionais** sem exigir preenchimento manual da usuária.

Escopo analisado: Admin, template público, pedidos, clientes, cardápio, compras, financeiro, produção, marketing, fiscal, crescimento, performance, plano de voo e configurações. A análise foi feita por leitura estática dos arquivos, sem alterar código.

## 1. Módulos Encontrados

### Core / Tenant / Banco
- **Arquivos principais:** `js/core/auth.js`, `js/core/db.js`, `admin.html`
- **Dados criados/editados:** autenticação administrativa, perfil de tenant, acesso por papel, navegação e leitura/escrita de dados do tenant.
- **Coleções Firestore usadas:** `system_tenants/{uid}`, `tenants/{tenantId}/{collection}`, `tenants/{tenantId}/config/{docId}`, `system/config`.
- **Campos principais:** `tenantId`, `role`, `status`, `fiscalCountry`.
- **Relação com outros módulos:** todos os módulos do Admin usam `Auth.getTenantId()` e o wrapper `DB`, que aponta para `tenants/{tenantId}`. O template público usa o `tenant` da URL para ler/gravar no mesmo tenant.

### Tela Inicial / Dashboard
- **Arquivos principais:** `js/modules/dashboard.js`
- **Dados criados/editados:** não cria dados operacionais; consolida dados existentes.
- **Coleções usadas:** `orders`, `products`, `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `contas_bancarias`, `flight_plan_month_scenarios`, `config/template`, `config/geral`, `config/operacao`.
- **Campos principais lidos:** `total`, `subtotal`, `createdAt`, `status`, `channel`, `source`, `valor`, `vencimento`, `saldo`, `summary.revenue`, `summary.profit`.
- **Relação:** já calcula vendas do mês, pedidos de hoje, ticket médio, saldo, meta do mês e ritmo versus Plano de Voo.

### Pedidos / Cozinha / Clientes
- **Arquivos principais:** `js/modules/pedidos.js`, `js/modules/clientes.js`, `track.html`
- **Dados criados/editados:** pedidos, status de cozinha, dados do cliente, itens do pedido, pagamento, pedido manual, vínculo com cliente, movimento financeiro da venda.
- **Coleções usadas:** `orders`, `store_customers`, `reviews`, `products`, `promotions`, `movimentacoes`, `config/geral`, `config/financeiro`, `config/zonas`, `config/canais_venda`.
- **Campos principais salvos em pedidos:** `customerId`, `customerName`, `customerPhone`, `customerEmail`, `items`, `subtotal`, `subtotalOriginal`, `subtotalFinal`, `promoDiscountTotal`, `discountTotal`, `shippingFee`, `deliveryFee`, `total`, `paymentMethod`, `paymentStatus`, `paidAmount`, `status`, `type`, `channel`, `source`, `deliveryDate`, `deliveryTime`, `slot`, `address`, `zone`, `createdAt`.
- **Campos principais de clientes:** `name`, `phone`, `whatsapp`, `email`, `address`, `origin`, `mainChannel`, `status`, `acceptsMarketing`, `totalOrders`, `totalSpent`, `points`, `pointsBalance`.
- **Relação:** pedidos alimentam clientes, financeiro, programa de pontos, performance, dashboard, fiscal e template público.

### Template Público da Loja
- **Arquivos principais:** `index.html`, `template-mobile-premium-fiel.html`, `preview-mobile-publico.html`, `review.html`
- **Dados criados/editados:** pedidos públicos, slots de pedido, avaliações públicas.
- **Coleções usadas:** `config/{geral,template,operacao,horarios,zonas,pontos_program,integracoes}`, `categories`, `products`, `reviews`, `promotions`, `coupons`, `orderSlots`, `orders`.
- **Campos principais salvos em pedidos públicos:** `items`, `subtotal`, `couponDiscountTotal`, `deliveryFee`, `total`, `type`, `customerName`, `customerPhone`, `address`, `postalCode`, `zone`, `deliveryZoneName`, `slotKey`, `slotLabel`, `scheduleDate`, `scheduleTime`, `payment`, `paymentMethod`, `notes`, `coupon`, `status`, `source: store`, `channel: template`, `itemCount`, `createdAt`, `updatedAt`.
- **Relação:** principal fonte de pedidos reais do cliente final. Incrementa `orderSlots` por horário.

### Cardápio / Produtos / Template / SEO
- **Arquivos principais:** `js/modules/catalogo.js`, `js/modules/loja_online.js`
- **Dados criados/editados:** produtos, categorias, produtos prontos, variantes/extras, tags, template da loja, SEO, destaques, meios de pagamento exibidos.
- **Coleções usadas:** `products`, `categories`, `produtos_prontos`, `variantGroups`, `tags`, `fichasTecnicas`, `itens_custo`, `coupons`, `promotions`, `orders`, `config/template`, `config/geral`, `config/aparencia`, `config/endereco`, `config/pagamentos`, `config/horarios`, `config/zonas`, `config/seo`.
- **Campos principais de produto:** `id`, `name`, `price`, `cost`, `custo`, `shortDesc`, `fullDesc`, `description`, `categoryId`, `menuVisible`, `type`, `unicoSource`, `fichaId`, `produtoProntoId`, `sourceItemId`, `menuItems`, `menuChoiceGroups`, `variantGroupIds`, `featured`, `popular`, `tags`, `addAlsoIds`, `seoTitle`, `seoDescription`, `slug`, `imageUrl`.
- **Relação:** produtos são usados por pedidos, promoções, upsell, produção/receitas, compras e análises de preço/margem.

### Compras / Produtos e Insumos / Fornecedores
- **Arquivos principais:** `js/modules/compras.js`
- **Dados criados/editados:** registros de compras, itens de custo/insumos, fornecedores, unidades, categorias/tipos de compra e contas a pagar geradas por compra.
- **Coleções usadas:** `compras`, `fornecedores`, `itens_custo`, `compras_tipos`, `compras_categorias`, `unidades_medida`, `financeiro_apagar`, `contas_pagar`, `movimentacoes`, `contas_bancarias`, `financeiro_categorias`, `config/compras`, `config/financeiro`.
- **Campos principais em compras:** `data`, `fornecedorId`, `statusCompra`, `numDocumento`, `observacoes`, `total`, `valorSemIva`, `ivaValor`, `ivaPct`, `itens`, `dedutivelIva`, `dedutivelIrpf`, `categoriaFiscal`, `costClass`, `gerarContaPagar`, `formaPagamento`, `dueDate`, `parcelas`, `prazoParcelas`, `categoriaFinanceiraId`, `parcelasPreview`, `contaPagarId`, `contaPagarIds`.
- **Campos principais em itens de custo:** `nome`, `classe`, `tipo`, `categoria`, `unidade_base`, `fornecedor_padrao_id`, `ativo`, `aproveitamento_padrao`, `usar_em_fichas`, `venda_habilitada`, `custo_atual`, `preco_compra`, `ultima_compra_data`, `ultima_compra_id`, `ultima_compra_total`, `ultima_compra_qtd_base`.
- **Relação:** compras atualizam custo dos insumos/produtos, podem gerar contas a pagar no financeiro e alimentam fiscal.

### Financeiro
- **Arquivos principais:** `js/modules/financeiro.js`, `financeiro.html`
- **Dados criados/editados:** entradas, saídas, contas a pagar, contas bancárias, categorias financeiras, formas de pagamento, compras simplificadas, configurações financeiras.
- **Coleções usadas:** `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `contas_pagar`, `contas_bancarias`, `financeiro_categorias`, `store_customers`, `fornecedores`, `compras`, `config/financeiro`, `config/geral`, `config/custos`.
- **Campos principais em entradas/movimentações:** `tipo`, `descricao`, `valor`, `valorTotalOriginal`, `valorParcela`, `valorRecebido`, `saldoRestante`, `data`, `categoria`, `conta_id`, `forma_pagamento`, `numeroSequencial`, `numeroDocumento`, `status`, `origem`, `pessoaTipo`, `pessoaId`, `pessoaNome`, `recorrencia`, `parcelamento`.
- **Campos principais em contas a pagar/saídas:** `descricao`, `valor`, `valorTotalOriginal`, `valorParcela`, `valorPago`, `saldoRestante`, `vencimento`, `data_pagamento`, `categoria`, `formaPagamento`, `conta_id`, `fornecedorId`, `fornecedorNome`, `status`, `recorrente`, `parcelada`, `parcelamentoId`.
- **Relação:** fonte principal para fluxo de caixa, contas recebidas/pagas, despesas e lucro operacional estimado.

### Produção / Receitas / Insumos
- **Arquivos principais:** `js/modules/catalogo.js`, `js/modules/receitas.js`
- **Dados criados/editados:** fichas técnicas, componentes, categorias de receita, insumos, tipos/categorias de insumo, unidades.
- **Coleções usadas:** `fichasTecnicas`, `itens_custo`, `recipe_categories`, `recipe_components`, `compras_tipos`, `compras_categorias`, `unidades_medida`, `financeiro_saidas`, `financeiro_apagar`, `config/geral`.
- **Campos principais em receitas:** `name`, `category`, `yieldQuantity`, `yieldUnit`, `unitWeightGrams`, `totalProducedGrams`, `components`, `ingredients`, `ingredientCost`, `packagingCost`, `directCost`, `indirectCostPercent`, `indirectCost`, `totalCost`, `costPerYield`, `preparationMode`, `conservationType`, `shelfLifeValue`, `shelfLifeUnit`.
- **Relação:** permite estimar custo por produto/receita e margem, mas não registra produção real diária nem baixas automáticas de estoque.

### Preços e Margem
- **Arquivos principais:** `js/modules/dinheiro.js`
- **Dados criados/editados:** configurações de margem, canais de venda, atualização de preço/margem em produtos.
- **Coleções usadas:** `products`, `fichasTecnicas`, `itens_custo`, `financeiro_saidas`, `financeiro_apagar`, `config/geral`, `config/dinheiro`, `config/canais_venda`, `config/fiscal`.
- **Campos principais:** `price`, `cost`, `custo`, configuração de margem desejada/mínima, canais, custos diretos/indiretos.
- **Relação:** base para calcular margem estimada, lucro por item e risco de preço.

### Promoções / Cupons / Upsell / Programa de Pontos / Avaliações
- **Arquivos principais:** `js/modules/marketing.js`, `review.html`
- **Dados criados/editados:** promoções, cupons, regras de upsell, programa de pontos, movimentos de pontos, moderação de avaliações.
- **Coleções usadas:** `promotions`, `coupons`, `upsellRules`, `upsellEvents`, `reviews`, `points_movements`, `store_customers`, `orders`, `products`, `config/pontos_program`, `config/dinheiro`.
- **Campos principais de promoções:** `name`, `type`, `value`, `valuePercentual`, `valueDesconto`, `leveQtd`, `pagueQtd`, `minOrder`, `startDate`, `endDate`, `scope`, `applyTo`, `productIds`, `active`.
- **Campos principais de cupons:** `code`, `type`, `value`, `minOrder`, `maxUses`, `expiry`, `usesCount`.
- **Campos principais de upsell:** `name`, `type`, `benefitType`, `benefitValue`, `productIds`, `suggestedProductIds`, `triggerProductId`, `locations`, `displayMoment`, `message`, `startDate`, `endDate`, `priority`, `displayLimit`, `active`.
- **Campos principais de pontos:** config `active`, `programName`, `earnPerEuro`, `redeemRate`, `minimumPointsToUse`, `maxDiscountPct`, `pointsExpire`, `pointsExpirationDays`, `autoApply`; movimentos `type`, `pointsEarned`, `pointsUsed`, `discountValue`, `balanceBefore`, `balanceAfter`, `orderId`, `customerId`.
- **Campos principais de avaliações:** `name`, `comment`, `stars`, `productId`, `productName`, `status`, `approved`, `rejected`, `source`, `reply`, `createdAt`.
- **Relação:** marketing influencia pedidos, desconto, recompra e ticket médio. Uso real de promoções/cupons/upsell depende do pedido salvar os IDs/eventos.

### Fiscal
- **Arquivos principais:** `js/modules/fiscal.js`
- **Dados criados/editados:** configuração fiscal, marcação fiscal em compras, relatórios IVA/IRPF/resumo trimestral.
- **Coleções usadas:** `config/fiscal`, `orders`, `financeiro_entradas`, `compras`, `financeiro_saidas`, `financeiro_apagar`, `fornecedores`.
- **Campos principais:** `ivaPadrao`, `irpfPadrao`, `trimestreAtual`, `usarCalculoFiscal`, mais campos fiscais de compras como `ivaValor`, `ivaPct`, `dedutivelIva`, `dedutivelIrpf`, `categoriaFiscal`.
- **Relação:** útil para análises de impostos e despesas dedutíveis, mas não deve ser a fonte principal de operação diária.

### Crescimento / Plano de Voo / Performance
- **Arquivos principais:** `js/modules/crescimento.js`, `js/modules/plano_voo.js`, `js/modules/performance.js`
- **Dados criados/editados:** metas, previsões salvas, cenário mensal selecionado, comparação previsto vs real e performance consolidada.
- **Coleções usadas:** `orders`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `movimentacoes`, `store_customers`, `promotions`, `coupons`, `flight_plans`, `flight_plan_month_scenarios`, `config/metas`, `config/dinheiro`.
- **Campos principais:** `flight_plans.summary.revenue`, `summary.costs`, `summary.profit`, `periodStart`, `periodEnd`, `monthSeries`, `scenario`, `channels`, `variableCosts`, `fixedExpenses`; `flight_plan_month_scenarios.monthKey`, `snapshotId`, `summary`.
- **Relação:** já oferece base forte para missões por meta, ritmo, receita projetada e comparação com realizado.

### Configurações da Loja
- **Arquivos principais:** `js/modules/configuracoes.js`, `js/modules/catalogo.js`, `admin.html`
- **Dados criados/editados:** dados gerais da empresa, domínio/URL, integrações, plano, canais de venda, fornecedores/unidades auxiliares.
- **Coleções usadas:** `config/geral`, `config/dominio`, `config/integracoes`, `config/plano`, `config/canais_venda`, `config/template`, `config/operacao`, `fornecedores`, `unidades_medida`.
- **Campos principais:** dados cadastrais/fiscais, país fiscal, contatos, URLs, subdomínio, canais de venda, status da loja online.
- **Relação:** configura contexto e segmentação, mas não é fonte direta de desempenho.

## 2. Dados Disponíveis para Análise Automática

- **Faturamento:** disponível em `orders.total` e parcialmente em `movimentacoes` / `financeiro_entradas`.
- **Pedidos:** disponível em `orders`, com status, origem/canal, tipo, itens, horários e cliente.
- **Ticket médio:** calculável por `sum(orders.total) / count(orders)`.
- **Margem:** parcial; produtos possuem `price`, `cost/custo` e receitas possuem `costPerYield`, mas nem todo item vendido garante custo real salvo na linha do pedido.
- **Lucro estimado:** parcial; pode usar pedidos menos saídas/financeiro ou preço menos custo do produto.
- **Produtos mais vendidos:** calculável a partir de `orders.items`, desde que cada item tenha `id/productId/name/qty`.
- **Produtos com baixa saída:** calculável cruzando `products` com vendas em `orders.items`.
- **Clientes novos:** parcial; `store_customers.createdAt` nem sempre é garantido e pedidos sem vínculo exigem dedupe por telefone.
- **Clientes recorrentes:** calculável por telefone/customerId em `orders`.
- **Recompra:** calculável por datas de pedidos agrupadas por cliente/telefone.
- **Dias fortes/fracos:** calculável por `createdAt`, `date`, `data`, `deliveryDate` ou `scheduleDate` de pedidos.
- **Horários fortes:** parcial; há `deliveryTime`, `pickupTime`, `scheduleTime`, `slotLabel`, mas nem todo pedido manual possui horário padronizado.
- **Formas de pagamento:** parcial; pedidos usam `payment`, `paymentMethod`; financeiro usa `forma_pagamento`, `formaPagamento`.
- **Status de pagamento:** parcial; pedidos usam `paymentStatus`, `paymentState`, `paid`, `paidAmount`; financeiro usa `status`.
- **Contas a pagar:** disponível em `contas_pagar` e `financeiro_apagar`.
- **Contas recebidas:** disponível em `movimentacoes` e `financeiro_entradas`, mas há fontes legadas/duplicadas.
- **Compras por fornecedor:** calculável por `compras.fornecedorId` e/ou `fornecedorNome`.
- **Custo por produto/insumo:** disponível em `itens_custo`, `products.cost/custo`, `fichasTecnicas`.
- **Estoque/insumos:** parcial; existem insumos e compras, mas não foi encontrado controle claro de saldo/baixa de estoque por venda.
- **Desperdício/perdas:** parcial; receitas/insumos têm `lossPercent` e `aproveitamento_padrao`, mas não há registro operacional de perda real.
- **Promoções usadas:** parcial; pedidos manuais podem salvar `promoId/promoName` em itens e pedidos públicos salvam desconto/cupom, mas a presença de `promoIds` não é garantida em todos os fluxos.
- **Cupons usados:** parcial; pedido público salva `coupon` e desconto; `coupons.usesCount` existe, mas não ficou claro se é incrementado automaticamente em todos os fluxos.
- **Upsells aceitos:** parcial; há `upsellRules` e leitura de `upsellEvents`, mas não foi encontrado fluxo público consolidado salvando eventos de exposição/clique/aceite de forma completa no pedido atual.
- **Avaliações recebidas:** disponível em `reviews`, com nota, comentário, produto opcional, aprovação/rejeição e data.

## 3. Métricas Possíveis Hoje

| Métrica | Fonte dos dados | Campos necessários | Calculável hoje | Observação |
|---|---|---|---|---|
| Faturamento bruto por período | `orders` | `total`, `createdAt/date/data`, `status` | Sim | Excluir cancelados. |
| Número de pedidos | `orders` | `createdAt/date/data`, `status` | Sim | Já usado em Dashboard/Performance. |
| Ticket médio | `orders` | `total`, data, status | Sim | Depende de total numérico. |
| Faturamento por canal | `orders` | `channel`, `source`, `type`, `total` | Sim | Canal pode vir como `template`, `manual`, `cardapio`, `whatsapp`. |
| Pedidos por tipo | `orders` | `type` | Sim | Delivery, pickup e similares. |
| Dias fortes/fracos | `orders` | data do pedido, `total` | Sim | Melhor padronizar uma data oficial. |
| Horários fortes | `orders`, `orderSlots` | `scheduleTime`, `deliveryTime`, `pickupTime`, `slotKey` | Parcial | Há múltiplos nomes de campo. |
| Produtos mais vendidos | `orders.items` | `id/productId/name`, `qty/quantity`, `total` | Sim | Precisa normalizar nomes dentro de `items`. |
| Produtos com baixa saída | `products` + `orders.items` | `productId`, `menuVisible`, período | Sim | Considerar produtos ativos/visíveis. |
| Receita por produto | `orders.items` | preço/total por item | Parcial | Nem todos os itens usam os mesmos campos de preço. |
| Margem por produto | `products`, `fichasTecnicas`, `itens_custo`, `orders.items` | `price`, `cost/custo`, item vendido | Parcial | Falta snapshot de custo real no momento da venda. |
| Lucro estimado operacional | `orders`, `financeiro_saidas`, `financeiro_apagar`, `movimentacoes` | vendas, saídas, status | Parcial | Já existe leitura em Performance, mas fontes financeiras duplicadas exigem dedupe. |
| Clientes novos | `store_customers`, `orders` | `createdAt`, telefone/email/customerId | Parcial | Clientes podem ser criados sem `createdAt` em alguns fluxos. |
| Clientes recorrentes | `orders` | `customerId`, `phone`, datas | Sim | Agrupar por customerId ou telefone normalizado. |
| Recompra | `orders` | cliente, datas de pedidos | Sim | Pode calcular intervalo entre pedidos. |
| Formas de pagamento | `orders`, `movimentacoes` | `paymentMethod/payment/forma_pagamento` | Parcial | Campos não padronizados. |
| Status de pagamento | `orders`, `movimentacoes`, `contas_pagar` | `paymentStatus/paymentState/paid/status` | Parcial | Nomes e valores variam. |
| Entradas recebidas | `movimentacoes`, `financeiro_entradas` | `tipo`, `valor`, `status`, `data` | Parcial | Há coleção legada e moderna. |
| Saídas pagas | `contas_pagar`, `financeiro_apagar`, `movimentacoes` | `valor`, `status`, `data_pagamento/vencimento` | Parcial | Dedupe necessário quando compra gera conta. |
| Contas a pagar vencidas | `contas_pagar`, `financeiro_apagar` | `vencimento/dueDate`, `status`, `valor` | Sim | Considerar pendentes. |
| Compras por fornecedor | `compras`, `fornecedores` | `fornecedorId`, `total`, `data` | Sim | Usar nome como fallback. |
| Custo atual por insumo | `itens_custo` | `custo_atual/preco_compra`, `ultima_compra_data` | Sim | Atualizado no salvamento de compra. |
| Evolução de custo por insumo | `compras.itens` | `itemId`, `custoAjustado`, `data` | Sim | Depende de itens salvos com `itemId`. |
| IVA estimado | `compras`, `config/fiscal` | `ivaValor`, `ivaPct`, `dedutivelIva` | Sim | Para Espanha/autônomo conforme regra atual. |
| IRPF estimado | `compras`, `config/fiscal` | `dedutivelIrpf`, categoria, totais | Parcial | Estimativa fiscal, não apuração oficial. |
| Promoções ativas | `promotions` | `active`, `startDate`, `endDate` | Sim | Não mede uso real sozinha. |
| Promoções usadas | `orders.items`, `orders` | `promoId`, `promoName`, `promoDiscountTotal` | Parcial | Nem todos os fluxos garantem IDs de promoção. |
| Cupons usados | `orders`, `coupons` | `coupon.code`, `couponDiscountTotal`, `usesCount` | Parcial | Pedido público salva cupom; contagem central precisa validação. |
| Upsell exibido/clicado/aceito | `upsellEvents`, `orders`, `upsellRules` | eventos, `upsellIds`, itens | Parcial | Estrutura existe, mas coleta real parece incompleta. |
| Pontos gerados/usados | `points_movements`, `orders`, `store_customers` | `type`, `pointsEarned`, `pointsUsed`, `discountValue` | Sim | Programa de pontos já registra movimentos. |
| Avaliação média | `reviews` | `stars`, `approved`, `createdAt` | Sim | Filtrar aprovadas. |
| Avaliações por produto | `reviews` | `productId`, `productName`, `stars` | Sim | Só quando avaliação pública informa produto. |
| Capacidade por horário | `orderSlots`, `config/template` | `count`, `maxOrdersPerSlot/ordersPerHour` | Parcial | Conta pedidos por slot, mas não mede capacidade real de produção. |
| Ritmo vs meta | `flight_plan_month_scenarios`, `orders` | `summary.revenue`, pedidos reais | Sim | Já usado em Dashboard/Performance. |

## 4. Métricas Importantes que Ainda Não Existem ou Não Estão Claras

- Capacidade máxima real de produção por dia.
- Capacidade máxima real por faixa horária, considerando tipo de produto.
- Horas disponíveis da usuária/equipe por dia.
- Dias bloqueados ou indisponibilidade operacional planejada.
- Meta de pedidos por semana/dia fora do Plano de Voo.
- Motivo de cancelamento do pedido.
- Tempo real de preparo por pedido.
- Tempo real entre pedido criado, aceito, preparado, saiu para entrega e entregue.
- Origem detalhada do pedido: Instagram, Google, QR code, link direto, campanha, WhatsApp manual, cliente recorrente etc.
- Cliente novo vs recorrente salvo como snapshot no pedido.
- Custo real por produto vendido no momento da venda.
- Snapshot de margem por item do pedido.
- Baixa automática de estoque/insumos por pedido.
- Saldo atual de estoque por insumo.
- Registro de perdas/desperdício real por data, item e motivo.
- Registro de produção real: lote, quantidade produzida, validade, sobra e descarte.
- Aceite real de upsell no checkout com `upsellRuleId`, etapa, valor incremental e produto aceito.
- Evento de visualização/clique de promoção.
- Evento de aplicação/rejeição de cupom.
- Motivo de não conversão no checkout abandonado.
- Custo de aquisição de cliente/campanha.
- Satisfação por pedido entregue, não apenas avaliação pública geral.
- Nível de ocupação por horário versus capacidade definida.

## 5. Recomendação Técnica

### Dados que já podem alimentar Temporadas
- Pedidos por período, status, canal, tipo, valor e itens.
- Faturamento, ticket médio, pedidos por dia e por horário.
- Produtos mais vendidos e produtos sem saída.
- Clientes recorrentes e recompra por telefone/customerId.
- Compras por fornecedor e custo atualizado de insumos.
- Contas a pagar, entradas, saídas e saldo operacional estimado.
- Avaliações e nota média.
- Pontos gerados/usados e clientes elegíveis.
- Comparação com cenário do Plano de Voo.

### Dados que precisam ser padronizados antes
- Data oficial do pedido: escolher entre `createdAt`, `date`, `data`, `deliveryDate`, `scheduleDate` conforme uso analítico.
- Valor oficial do pedido: `total` deve ser a referência; `subtotal`, `subtotalFinal`, `finalSubtotal`, `shippingFee/deliveryFee` precisam de normalizador.
- Cliente: padronizar `customerId`, `clientId`, telefone normalizado e email.
- Itens do pedido: padronizar `productId/id`, `name`, `qty/quantity`, `price`, `total`, `choices`.
- Pagamento: padronizar `paymentMethod/payment/forma_pagamento` e `paymentStatus/paymentState/paid/status`.
- Financeiro: definir fonte canônica para entradas/saídas ou manter normalizador com dedupe entre `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar` e `contas_pagar`.
- Promoção/cupom/upsell: garantir IDs no pedido e em eventos.
- Datas: usar Timestamp Firestore ou ISO de forma consistente, com timezone definido.

### Eventos recomendados
- `order_events`: criado, aceito, em preparo, pronto, saiu, entregue, cancelado, com `createdAt`, `actor`, `reason`.
- `product_sale_snapshots` ou campos dentro de `orders.items`: custo, margem, promoção aplicada, preço original e preço final no momento da venda.
- `marketing_events`: visualização/click/aplicação de promoção, cupom e upsell.
- `checkout_events`: carrinho iniciado, item adicionado, checkout aberto, pedido enviado, abandono.
- `inventory_movements`: entrada por compra, baixa por venda/produção, ajuste manual, perda/descarte.
- `production_batches`: receita, quantidade produzida, validade, custo real, sobras e descarte.
- `season_metrics_snapshots`: snapshot diário/semanal para não recalcular tudo em telas pesadas.

### Campos novos recomendados
- Em `orders`: `canonicalDate`, `completedAt`, `cancelledAt`, `cancelReason`, `customerSnapshot`, `isNewCustomer`, `normalizedPhone`, `originDetail`, `utmSource`, `utmCampaign`.
- Em `orders.items`: `productId`, `productName`, `qty`, `unitPrice`, `lineTotal`, `unitCostSnapshot`, `marginSnapshot`, `promoId`, `couponCode`, `upsellRuleId`.
- Em `store_customers`: `firstOrderAt`, `lastOrderAt`, `ordersCount`, `totalSpent`, `averageTicket`, `lastChannel`.
- Em `products`: `active`, `menuVisible`, `costSource`, `defaultProductionCapacity`, `prepTimeMinutes`.
- Em `upsellEvents`: `eventType`, `ruleId`, `productId`, `orderId`, `cartId`, `valueIncrement`, `createdAt`.
- Em `coupons`: `usesCount`, `revenueGenerated`, `discountGenerated`, `lastUsedAt`.
- Em `promotions`: `usesCount`, `revenueGenerated`, `discountGenerated`, `lastUsedAt`.
- Em estoque/produção: `stockOnHand`, `minimumStock`, `wasteQty`, `wasteReason`, `batchId`.

### Módulos mais confiáveis hoje para análise
1. `orders` do template público e Admin, para vendas/pedidos.
2. `products` e `categories`, para catálogo e mix de produtos.
3. `compras` + `itens_custo`, para compras, fornecedores e custo atualizado.
4. `financeiro` normalizado, para fluxo de caixa, contas pagas/pendentes e saldo.
5. `flight_plan_month_scenarios` e `flight_plans`, para metas e comparação previsto vs real.
6. `points_movements`, para fidelidade.
7. `reviews`, para reputação.

## 6. Cuidados e Riscos Identificados

- **Dados duplicados:** financeiro possui coleções legadas e modernas (`movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `contas_pagar`). Performance já faz dedupe, mas Temporadas também precisará.
- **Campos com nomes diferentes:** pedidos usam `shippingFee` e `deliveryFee`; pagamento usa `payment`, `paymentMethod`, `forma_pagamento`; cliente usa `customerId`, `clientId`, `phone`, `customerPhone`, `whatsapp`.
- **Datas não totalmente padronizadas:** há Firestore Timestamp, ISO string e campos `data`, `date`, `createdAt`, `updatedAt`, `deliveryDate`, `scheduleDate`, `vencimento`.
- **Valores monetários:** muitos valores são número, mas alguns entram por parse de inputs; relatórios devem converter com normalizadores e ignorar strings inválidas.
- **Status variados:** pedidos misturam português/espanhol (`Pendente`, `Entregado`, `Cancelado`, `Listo para recoger`); financeiro usa `previsto`, `efetivado`, `pago`, `pendente`, `parcial`; fiscal usa flags.
- **Tenant respeitado:** Admin usa `DB` com `Auth.getTenantId()`. Template público usa `tenant` da URL. Para relatórios, manter sempre leitura em `tenants/{tenantId}`.
- **Dados locais:** `review.html` ainda tenta ler `localStorage` para config/produtos como fallback legado, mas avaliações são salvas em Firestore. `admin.html` usa `localStorage` apenas para estado visual da sidebar.
- **Uso real de marketing:** promoções, cupons e upsell têm cadastros ricos, mas a medição automática de uso/aceite ainda precisa ser consolidada.
- **Estoque/perdas:** existem insumos, compras e perdas teóricas de receita, mas não há evidência de estoque operacional com baixa automática e perda real.
- **Custo real de venda:** preço e custo existem, mas é recomendável salvar snapshot no item do pedido para preservar histórico quando o custo mudar depois.

## Conclusão

O BocaFood já possui dados suficientes para criar Temporadas baseadas em:
- vender mais em dias fracos;
- aumentar ticket médio;
- recuperar produtos com baixa saída;
- aumentar recompra;
- bater meta mensal do Plano de Voo;
- reduzir contas atrasadas;
- melhorar avaliação média;
- estimular fidelidade/pontos;
- controlar compras por fornecedor.

Para missões mais avançadas, como margem real por produto vendido, capacidade de produção, estoque, desperdício e eficiência operacional por horário, será necessário padronizar campos e criar eventos/snapshots específicos antes de automatizar recomendações confiáveis.
