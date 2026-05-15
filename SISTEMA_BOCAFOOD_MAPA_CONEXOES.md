# Sistema BocaFood - Mapa de Conexoes

Data: 2026-05-14

## 1. Visao geral

O BocaFood esta organizado em quatro camadas principais:

- **Camada publica:** template da loja publicado em `public/index.html`, paginas auxiliares `public/review.html` e `public/track.html`, SEO e envio/contato por WhatsApp.
- **Camada Admin:** painel publicado em `public/admin.html`, autenticado por Firebase Auth e dividido em modulos carregados de `public/js/modules/*`.
- **Camada de dados:** Firestore multi-tenant em `tenants/{tenantId}` e Storage em `tenants/{tenantId}/...`.
- **Camada Master:** painel interno `master.html`, usado para tenants, configuracoes globais, Google Places, publicacao por GitHub e apoio operacional.

O Firebase Hosting publica a pasta `public/`, conforme `firebase.json`. Por isso, os fluxos publicados devem ser considerados a partir dos arquivos dentro de `public/`.

## 2. Arquivos analisados

- `AGENTS.md`
- `DATA_MAP_FOR_SEASONS.md`
- `BUSINESS_MATURITY_DATA_MAP.md`
- `ADMIN_AUDIT.md`
- `PUBLIC_SOURCE_OF_TRUTH.md`
- `firebase.json`
- `storage.rules`
- `master.html`
- `public/admin.html`
- `public/index.html`
- `public/review.html`
- `public/track.html`
- `public/js/core/auth.js`
- `public/js/core/db.js`
- `public/js/core/image-tools.js`
- `public/js/services/seasons.ai.js`
- `public/js/modules/catalogo.js`
- `public/js/modules/pedidos.js`
- `public/js/modules/clientes.js`
- `public/js/modules/compras.js`
- `public/js/modules/receitas.js`
- `public/js/modules/financeiro.js`
- `public/js/modules/marketing.js`
- `public/js/modules/plano_voo.js`
- `public/js/modules/performance.js`
- `public/js/modules/temporadas.js`
- `public/js/modules/configuracoes.js`

## 3. Modulos principais

| Modulo | Papel no sistema | Arquivos principais | Colecoes / documentos usados |
|---|---|---|---|
| Master | Controle interno de tenants, configuracoes globais, publicacao e Google Places | `master.html` | `system_tenants`, `system/config`, `tenants/{tenantId}/config/*` |
| Admin | Shell autenticado, menu, rotas e carregamento de modulos | `public/admin.html`, `public/js/core/auth.js`, `public/js/core/db.js`, `public/js/core/router.js` | `system_tenants`, `tenants/{tenantId}/*`, `system/config` |
| Template publico | Loja publica, carrinho, pedido e SEO visual | `public/index.html` | `config/geral`, `config/template`, `products`, `categories`, `promotions`, `coupons`, `reviews`, `orders`, `orderSlots` |
| Firebase Auth | Login e validacao de acesso ao Admin | `public/js/core/auth.js` | `system_tenants/{uid}` |
| Firestore | Banco central multi-tenant | `public/js/core/db.js`, modulos | `tenants/{tenantId}/{collection}` e `system/*` |
| Storage | Imagens de produtos, logos, banners e assets enviados | `public/js/core/image-tools.js`, `storage.rules` | `tenants/{tenantId}/products`, `logos`, `banners`, `featured` |
| Cardapio | Produtos, categorias, variantes, receitas/fichas e template da loja | `public/js/modules/catalogo.js` | `products`, `categories`, `variantGroups`, `tags`, `fichasTecnicas`, `itens_custo`, `config/template`, `config/seo` |
| Pedidos | Pedidos, pedido manual, status, cozinha, detalhes e WhatsApp de aviso | `public/js/modules/pedidos.js` | `orders`, `store_customers`, `reviews`, `products`, `promotions`, `movimentacoes`, `points_movements` |
| Cozinha | Visao operacional dos pedidos e mudancas de status | `public/js/modules/pedidos.js` | `orders` |
| Clientes | Base de clientes, perfil, historico, segmento e recorrencia | `public/js/modules/clientes.js` | `store_customers`, `orders`, `reviews`, `points_movements`, `config/canais_venda`, `config/pontos_program` |
| Compras | Compras, fornecedores, insumos, vinculo com financeiro | `public/js/modules/compras.js` | `compras`, `fornecedores`, `itens_custo`, `compras_tipos`, `compras_categorias`, `unidades_medida`, `financeiro_apagar`, `contas_pagar`, `movimentacoes` |
| Producao | Receitas/fichas tecnicas, insumos e composicao de custos | `public/js/modules/receitas.js`, `public/js/modules/catalogo.js` | `fichasTecnicas`, `itens_custo`, `recipe_categories`, `recipe_components`, `products` |
| Financeiro | Entradas, saidas, contas a pagar, fluxo e contas bancarias | `public/js/modules/financeiro.js` | `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `contas_pagar`, `contas_bancarias`, `financeiro_categorias` |
| Acoes de Vendas / Marketing | Promocoes, cupons, upsell, pontos e avaliacoes | `public/js/modules/marketing.js` | `promotions`, `coupons`, `upsellRules`, `upsellEvents`, `points_movements`, `reviews`, `orders`, `products`, `store_customers` |
| Plano de Voo | Cenarios, metas e simulacoes | `public/js/modules/plano_voo.js` | `flight_plans`, `flight_plan_month_scenarios`, `orders`, financeiro, `config/*` |
| Performance | Indicadores historicos de vendas, clientes e canais | `public/js/modules/performance.js` | `orders`, `store_customers`, financeiro, marketing |
| Temporadas | Campanhas operacionais de curto prazo, score, risco e resultado | `public/js/modules/temporadas.js` | `seasons`, `season_metrics_snapshots`, `orders`, `store_customers`, `flight_plans`, `flight_plan_month_scenarios` |
| Maturidade / Pedras | Evolucao acumulada do negocio e progresso da Pedra | `public/js/modules/temporadas.js` | `business_maturity/current`, `business_maturity_snapshots`, `stone_upgrade_events`, `seasons`, `orders`, `store_customers`, `flight_plans` |
| Configuracoes | Dados gerais, TPV, dominio, integracoes, plano, fornecedores e unidades | `public/js/modules/configuracoes.js` | `config/geral`, `config/tpv`, `config/dominio`, `config/integracoes`, `config/plano`, `config/template`, `config/operacao`, `fornecedores`, `unidades_medida` |

## 4. Conexoes confirmadas

### Admin, Auth e Firestore

- `public/admin.html` carrega Firebase App, Firestore, Storage e Auth.
- `Auth.init()` valida o usuario em `system_tenants/{uid}`.
- `Auth.getTenantId()` define o tenant usado pelo wrapper `DB`.
- `DB.col`, `DB.getAll`, `DB.add`, `DB.update`, `DB.getDocRoot` e `DB.setDocRoot` montam caminhos em `tenants/{tenantId}`.
- `DB.getSystemConfig()` e `DB.setSystemConfig()` acessam `system/config`.

### Template publico, pedidos e WhatsApp

- `public/index.html` le configuracoes, produtos, categorias, promocoes, cupons e avaliacoes.
- O carrinho monta pedido e usa WhatsApp via `https://wa.me/...`.
- O template tambem cria pedido em Firestore em `orders` e usa `orderSlots` para capacidade.
- A origem/canal do pedido pode alimentar Pedidos, Clientes, Performance, Temporadas e Maturidade.

### Pedidos, Cozinha, Clientes e Financeiro

- Pedidos e Cozinha compartilham a colecao `orders`.
- Mudancas de status em Cozinha atualizam o pedido e podem abrir WhatsApp para avisar o cliente.
- Pedidos relaciona clientes por `customerId`, telefone, WhatsApp ou e-mail.
- Pedidos pode criar/vincular clientes em `store_customers`.
- Pedidos alimenta analises de clientes, recorrencia, performance, financeiro, temporadas e maturidade.

### Cardapio, Template e Storage

- Cardapio grava `products`, `categories`, tags, grupos de variantes e configuracoes do template.
- Imagens passam por `ImageTools`, que usa Firebase Storage e salva URLs/caminhos no Firestore.
- O template publico consome produtos, categorias, banners, logos e configuracoes visuais.
- SEO usa dados de loja, template, produtos e URLs de compartilhamento.

### Compras, Producao e Financeiro

- Compras registra `compras`, `fornecedores` e `itens_custo`.
- Compras pode gerar ou vincular contas em `financeiro_apagar`, `contas_pagar` e `movimentacoes`.
- Producao/Receitas usa `fichasTecnicas` e `itens_custo` para estimar composicao e custo.
- Custos podem apoiar Cardapio, Precos e Margem, mas estoque/desperdicio real ainda nao aparecem como fluxo consolidado.

### Marketing, Pontos e Avaliacoes

- Marketing grava promocoes, cupons e regras de upsell.
- Template e Pedidos usam promocoes/cupons/upsell para influenciar vendas.
- Programa de pontos usa `points_movements`, `orders` e `store_customers`.
- Avaliacoes usam `reviews` e aparecem em Clientes, Marketing e template publico.

### Temporadas e Maturidade

- Temporadas le pedidos, clientes, Plano de Voo e snapshots para calcular score, risco, progresso e resultado.
- Temporadas grava `seasons` e `season_metrics_snapshots`.
- Maturidade / Pedras le temporadas finalizadas/abandonadas, pedidos, clientes, Plano de Voo e performance basica.
- Maturidade grava `business_maturity/current`, `business_maturity_snapshots` e `stone_upgrade_events`.
- Temporadas alimentam a maturidade acumulada, enquanto Pedras representam evolucao historica do negocio.

### Master e integracoes globais

- `master.html` gerencia `system_tenants`, configuracoes globais em `system/config`, Google Maps/Places e publicacao por endpoints locais `/api/master/*`.
- Google Places e carregado por `BocaPlaces` quando `system/config.googleMapsKey` esta definido e `googleMapsEnabled` nao esta desativado.
- Os campos de endereco em Clientes, Compras, Configuracoes, Catalogo/Template e Pedido Manual chamam `BocaPlaces.init(...)`.

### IA / OpenAI

- `public/js/services/seasons.ai.js` prepara geracao de recomendacao de Temporadas por endpoint configuravel em `window.SeasonsAIConfig.endpoint`.
- O modulo Temporadas usa fallback quando o endpoint nao existe ou falha.
- Nao foi identificado uso direto de chave OpenAI no frontend. A conexao parece preparada para backend/proxy externo.

## 5. Fluxos de dados principais

| Origem | Destino | Dados que passam | Status |
|---|---|---|---|
| Firebase Auth | Admin | usuario autenticado e permissao por `system_tenants` | confirmado |
| Admin | Firestore | leitura/escrita por `tenantId` via `DB` | confirmado |
| Master | Firestore | tenants, configuracoes globais, SEO tecnico e Google Places | confirmado |
| Master | GitHub/API local | publicacao e backup por `/api/master/*` | preparado/local |
| Template publico | Firestore | pedidos, slots, avaliacoes e leitura de catalogo/config | confirmado |
| Template publico | WhatsApp | mensagem/link de pedido ou contato | confirmado |
| Cardapio | Template publico | produtos, categorias, imagens, template e SEO | confirmado |
| Cardapio | Storage | imagens de produtos, logos, banners e destaques | confirmado |
| Pedidos | Cozinha | pedidos e status operacional | confirmado |
| Pedidos | Clientes | dados de cliente, historico e recorrencia | confirmado |
| Pedidos | Financeiro | vendas, totais, pagamentos e movimentacoes | parcial/depende do fluxo |
| Pedidos | Temporadas | vendas, pedidos, ticket e ritmo | confirmado |
| Pedidos | Maturidade | volume, dias com venda, ticket e recorrencia | confirmado |
| Compras | Financeiro | contas a pagar, movimentacoes e status financeiro | confirmado |
| Compras | Producao | insumos, fornecedores e custos | confirmado |
| Producao | Cardapio/Precos | fichas tecnicas e custo estimado | confirmado |
| Marketing | Template/Pedidos | promocoes, cupons, upsell e pontos | confirmado |
| Avaliacoes | Clientes/Marketing/Template | reputacao e moderacao | confirmado |
| Plano de Voo | Temporadas/Maturidade | cenario `survival/equilibrium/growth/expansion` e metas | confirmado |
| Temporadas | Maturidade | resultado final, score, risco e execucao | confirmado |
| Google Places | Formularios Admin | autocomplete e normalizacao de endereco | conectado quando chave global existe |
| IA Temporadas | Temporadas | recomendacao "Proxima Jogada" por endpoint | preparado/parcial |

## 6. Riscos de dependencia

- **Fonte publicada:** Firebase Hosting publica `public/`; editar duplicatas na raiz pode nao aparecer no deploy.
- **Financeiro duplicado:** ha colecoes historicas e paralelas (`movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `contas_pagar`), exigindo normalizacao antes de calculos definitivos.
- **Clientes por telefone/e-mail:** Clientes depende de vinculo por `customerId` ou matching de telefone/e-mail; pedidos antigos podem ficar parcialmente vinculados.
- **Storage e URLs:** imagens dependem de Storage e dos campos `imageUrl`, `imageCardUrl`, `imageThumbUrl`, `logoUrl`, `bannerUrl`; falha de upload pode deixar apenas URL antiga/manual.
- **Google Places global:** depende de `system/config`; se a chave nao existir, os formularios continuam manuais.
- **IA por endpoint:** o frontend esta preparado, mas a qualidade/execucao depende de backend/proxy configurado.
- **Maturidade:** ainda depende de dados confiaveis de pedidos, clientes, temporadas e plano; margem/lucro real, estoque e capacidade operacional nao devem ser usados como verdade definitiva.

## 7. Pontos preparados ou futuros

- IA estrategica das Pedras ainda nao deve decidir upgrade automaticamente sozinha.
- Estoque real, desperdicio real e capacidade operacional aparecem como necessidades futuras, nao como fluxo consolidado confirmado.
- Snapshots de maturidade existem no conceito/implementacao recente, mas ainda precisam de validacao manual com dados reais.
- Ranking entre lojas nao deve ser usado na V1.
- Publicacao via Master usa endpoints locais `/api/master/*`; depende do servidor local/infra correspondente.
- Google Places esta conectado condicionalmente por configuracao global, nao necessariamente ativo em todos os ambientes.

## 8. Revisao manual recomendada

- Validar no navegador publicado se `public/` esta com as versoes esperadas dos modulos.
- Revisar regras de seguranca Firestore/Storage antes de abertura para usuarias reais.
- Revisar normalizacao financeira antes de usar lucro, margem e caixa em decisoes de maturidade.
- Validar se pedidos publicos sempre gravam `customerId` ou dados suficientes para reconciliar clientes.
- Confirmar backend/proxy real para `SeasonsAIConfig.endpoint`, caso IA seja ativada.
