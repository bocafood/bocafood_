# Project Map

## Visão geral
Este projeto é um painel administrativo em SPA para uma operação de restaurante/food service. O admin concentra cadastro, catálogo, pedidos, cozinha, financeiro, clientes, promoções, upsell, planejamento e configuração da loja. O cliente final usa o storefront separado em `index.html`.

## Entrada principal
- `admin.html`: shell do admin, sidebar, topbar, login e rotas.
- `index.html`: storefront do cliente final.
- `master.html`: visão master/tenant.
- `review.html`: página pública de avaliações.
- `track.html`: rastreamento/consulta.
- `financeiro.html`: visão dedicada do financeiro, quando usada.

## Pastas principais
- `js/core`: serviços compartilhados do sistema.
  - `auth.js`: login, usuário e tenant.
  - `db.js`: wrapper do Firestore, schemas e helpers.
  - `router.js`: navegação por hash e resolução de rotas.
  - `ui.js`: modal, toast, loading e formatadores.
- `js/modules`: módulos funcionais da aplicação.
- `assets`: logo, favicon e imagens da marca.
- `tools`: utilitários de migração/extração.
- `firestore.rules`: regras de segurança do Firestore.

## Fluxo principal
1. O usuário autentica no admin.
2. `router.js` resolve a rota por hash e carrega o módulo correspondente.
3. O módulo busca dados no Firestore via `db.js`.
4. O módulo renderiza a interface e salva alterações no mesmo conjunto de coleções.
5. O storefront grava pedidos e eventos que alimentam pedidos, cozinha, marketing, performance e financeiro.

## Fluxo funcional
- Cadastro: `Configurações`, `Clientes`, `Compras`, `Produção`, `Cardápio`.
- Catálogo: `Catalogo` mantém produtos, categorias, variantes, tags, template e SEO da loja.
- Pedidos: `Pedidos` centraliza listagem, cozinha, clientes e avaliações vinculadas.
- Cozinha: `Pedidos > Cozinha` organiza operação, kanban e detalhe operacional.
- Financeiro: `Financeiro` e `Preços e Margem` trabalham com entradas, saídas, contas e composição.
- Clientes: `Clientes` concentra perfil, histórico, pontos e avaliações.
- Promoções e upsell: `Ações de Vendas` controla campanhas, cupons, pontos e sugestão de produto.
- WhatsApp: usado no template e nos detalhes de pedido para confirmação e atualização de status.
- Crescimento: `Plano de Voo` cria cenários e `Performance` compara previsto vs real.

## Observações de arquitetura
- O sistema é orientado a módulos independentes que compartilham `DB`, `UI` e `Router`.
- A navegação principal depende de `admin.html` + `js/core/router.js`.
- O Firestore é multi-tenant; todas as coleções vivem em `tenants/{tenantId}/...`.
