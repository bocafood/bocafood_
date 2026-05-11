# Dependency Map

## Regras gerais
- A navegação entra por `admin.html` + `js/core/router.js`.
- A renderização é feita pelo módulo de cada rota.
- A leitura e gravação de dados passa por `js/core/db.js`.
- `UI` é compartilhado por todos os módulos para modal, toast e formatação.

## Infra Firebase
- Arquivo de entrada: configuração do projeto e deploy
- Arquivos principais: `firebase.json`, `firestore.rules`, `storage.rules`
- Leitura/gravação: regras do Firestore e Storage por tenant
- Validação: autenticação, posse do tenant, tipos de arquivo e limites de upload
- Compartilhados: `admin.html`, `js/core/image-tools.js`, módulos que fazem upload de mídia
- Riscos: abrir regra ampla demais pode expor dados ou permitir upload fora do tenant

## Imagens e Storage
- Arquivo de entrada: `admin.html -> catalogo/*`, `configuracoes/*`, `index.html`, `tools/generate-product-pages.rb`
- Renderização/processamento: `js/core/image-tools.js`, `js/modules/catalogo.js`, `js/modules/configuracoes.js`, `server.rb`
- Leitura/gravação: Firebase Storage, `products`, `config`, GitHub Raw via backend local
- Validação: formato, tamanho, tenant, variantes de imagem, caminhos de storage e publicação legada de imagem
- Compartilhados: `ImageTools`, `DB`, `Auth`, backend local de publicação
- Riscos: alterar o pipeline pode quebrar upload otimizado, publicação legada via backend, URLs derivadas e a exibição pública das imagens

## Performance
- Arquivo de entrada: `admin.html -> performance`
- Renderização: `js/modules/performance.js`
- Leitura de dados: `orders`, `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `financeiro_categorias`, `flight_plans`, `flight_plan_month_scenarios`, `config/dinheiro`
- Validação: datas, cenário, canal, período e comparações
- Compartilhados: `UI`, `Router`, `DB`
- Riscos: alterar cálculo de período, cenário do mês e comparação sem validar impacto em `Plano de Voo`

## Pedidos
- Arquivo de entrada: `admin.html -> pedidos/*`
- Renderização: `js/modules/pedidos.js`
- Leitura de dados: `orders`, `store_customers`, `reviews`, `movimentacoes`, `config`
- Validação: status, total, cliente, pagamento, entrega/retirada, WhatsApp
- Compartilhados: `Clientes`, `Marketing`, `Financeiro`, `Catalogo`, `Performance`
- Riscos: é o módulo mais sensível da operação; afeta cozinha, detalhe, kanban e relatórios

## Cardápio
- Arquivo de entrada: `admin.html -> catalogo/*`
- Renderização: `js/core/image-tools.js`, `js/modules/catalogo.js`, `server.rb`
- Leitura de dados: `products`, `categories`, `variantGroups`, `tags`, `produtos_prontos`, `fichasTecnicas`, `itens_custo`, `config`
- Validação: preço, custo, tags, variantes, ficha técnica, imagem principal/card/thumb, publicação legada de imagem
- Compartilhados: `Receitas`, `Compras`, `Pedidos`, `Marketing`, `ImageTools`, backend local de publicação
- Riscos: quebra aqui afeta preço exibido, promoções, custo, imagens, a publicação para GitHub Raw e os pedidos do storefront

## Produção
- Arquivo de entrada: `admin.html -> receitas/*`
- Renderização: `js/modules/receitas.js`
- Leitura de dados: `recipe_categories`, `recipe_components`, `unidades_medida`
- Validação: componentes, quantidades e unidades
- Compartilhados: `Catalogo`, `Compras`
- Riscos: afeta custo e composição de produto

## Compras
- Arquivo de entrada: `admin.html -> compras/*`
- Renderização: `js/modules/compras.js`
- Leitura de dados: `compras`, `compras_categorias`, `compras_tipos`, `fornecedores`, `itens_custo`, `products`, `unidades_medida`, `financeiro_apagar`
- Validação: fornecedor, item, quantidade, tipo e categoria
- Compartilhados: `Financeiro`, `Cardápio`, `Produção`
- Riscos: mudanças aqui podem afetar custo e fluxo de caixa

## Preços e Margem
- Arquivo de entrada: `admin.html -> dinheiro/*`
- Renderização: `js/modules/dinheiro.js`
- Leitura de dados: `config`, `products`
- Validação: preço, margem, composição e regras
- Compartilhados: `Catalogo`, `Compras`, `Marketing`
- Riscos: qualquer ajuste altera preço apresentado em outras telas

## Ações de Vendas
- Arquivo de entrada: `admin.html -> marketing/*`
- Renderização: `js/modules/marketing.js`
- Leitura de dados: `promotions`, `coupons`, `upsellRules`, `reviews`, `points_movements`, `orders`, `store_customers`, `config`
- Validação: datas, status, produto vinculado, benefício, margem e canal
- Compartilhados: `Pedidos`, `Clientes`, `Performance`, `Catalogo`
- Riscos: promoções e upsell precisam continuar coerentes com o storefront

## Crescimento
- Arquivo de entrada: `admin.html -> crescimento` e `plano-de-voo/*`
- Renderização: `js/modules/plano_voo.js`
- Leitura de dados: `flight_plans`, `flight_plan_month_scenarios`, `contas_pagar`, `config/dinheiro`
- Validação: período, cenário, históricos e snapshot
- Compartilhados: `Performance`, `Financeiro`
- Riscos: afeta previsão e referência do mês

## Financeiro
- Arquivo de entrada: `admin.html -> financeiro/*`
- Renderização: `js/modules/financeiro.js`
- Leitura de dados: `movimentacoes`, `contas_pagar`, `contas_bancarias`, `financeiro_categorias`, `compras`, `fornecedores`, `itens_custo`, `config`
- Validação: categoria, conta, valor, recorrência e status
- Compartilhados: `Pedidos`, `Compras`, `Plano de Voo`, `Performance`
- Riscos: impacta saldos, contas e leitura de margem

## Fiscal
- Arquivo de entrada: `admin.html -> fiscal/*`
- Renderização: `js/modules/fiscal.js`
- Leitura de dados: `config`, `compras`
- Validação: campos fiscais e regras por país
- Compartilhados: `Financeiro`, `Compras`
- Riscos: alteração errada pode quebrar obrigações fiscais

## Operação
- Arquivo de entrada: `admin.html -> operacao/*`
- Renderização: `js/modules/operacao.js`
- Leitura de dados: `config`
- Validação: horários, zonas e status da loja
- Compartilhados: `Pedidos`, `Catalogo`
- Riscos: afeta disponibilidade e pedidos do cliente final

## Configurações
- Arquivo de entrada: `admin.html -> configuracoes/*`
- Renderização: `js/core/image-tools.js`, `js/modules/configuracoes.js`
- Leitura de dados: `config`, `fornecedores`, `unidades_medida`
- Validação: identidade, domínio, integrações, permissões futuras e mídia da loja
- Compartilhados: todos os módulos que leem `config`, `ImageTools`
- Riscos: mudanças aqui reverberam no painel inteiro e podem afetar logo/banner publicados

## Clientes
- Arquivo de entrada: `admin.html -> clientes` e `pedidos/clientes`
- Renderização: `js/modules/clientes.js`
- Leitura de dados: `store_customers`, `config`
- Validação: telefone, e-mail, segmentação, histórico e pontos
- Compartilhados: `Pedidos`, `Marketing`
- Riscos: impacta detalhe rico do cliente e vínculo com pedidos

## Arquivos críticos
Não alterar sem necessidade:
- `admin.html`
- `js/core/router.js`
- `js/core/db.js`
- `js/core/ui.js`
- `js/modules/pedidos.js`
- `js/modules/catalogo.js`
- `js/modules/marketing.js`
- `js/modules/financeiro.js`
- `js/modules/performance.js`
- `js/modules/plano_voo.js`

## Backup do Sistema
- Arquivo de entrada: `master.html -> backup`
- Renderização: `master.html`
- Leitura/escrita de dados: `server.rb` (`/api/master/backup/config`, `/api/master/backup/status`, `/api/master/backup/send`)
- Validação: presença de repositório privado, branch, `git status`, `git branch --show-current`, `git log -1 --oneline`, `.gitignore`
- Compartilhados: `.master-store.json` em `global_config.system_backup`, backend local e Git instalado
- Riscos: qualquer erro aqui pode impedir o backup local ou expor arquivos sensíveis se `.gitignore` estiver incorreto
