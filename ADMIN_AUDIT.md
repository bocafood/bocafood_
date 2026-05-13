# Auditoria Técnica e Visual do Admin

Data: 2026-05-13

Escopo: auditoria documental do Admin local, com entrada por `admin.html`, shell `#login-screen`, `#admin-shell`, `sidebar`, `topbar`, `#app`, router hash-based em `js/core/router.js` e UI base em `js/core/ui.js`.

Esta auditoria não altera código, lógica, Firebase, rotas, permissões, Auth, DB, workflows, estrutura de dados ou layout em produção. O objetivo é preparar uma padronização visual e técnica segura.

## 1. Resumo do estado atual

O Admin está funcional e tem shell central bem definido em `admin.html`. O CSS base do Admin não está em `css/admin.css`; ele fica inline no `<style>` de `admin.html`, enquanto Temporadas usa CSS próprio em `css/modules/temporadas.css`.

O roteamento usa `Router.register(route, module)` e, quando a rota exata não existe, `js/core/router.js` tenta resolver pelo primeiro segmento da hash. Por isso várias rotas de submenu funcionam mesmo sem registro explícito, desde que a rota base esteja registrada.

O design visual tem direção geral clara: fundo branco/off-white, vermelho BocaFood, bordas claras, cards com sombra leve e botões de 10px a 12px de raio. Porém, a implementação está fragmentada entre CSS global, CSS de Temporadas, helpers por módulo e muito `style=""` inline dentro de strings HTML.

Risco principal: padronizar visual diretamente dentro dos módulos grandes pode gerar regressão. A primeira etapa deve criar tokens e componentes CSS compatíveis, sem trocar estrutura nem fluxo.

## 2. Arquivos analisados

Arquivos principais:

| Arquivo | Status | Observação |
|---|---|---|
| `admin.html` | OK funcional, inconsistente visualmente | Contém shell, menu, CSS base inline, scripts e registros de rota. |
| `css/admin.css` | Não existe | O CSS principal do Admin está inline em `admin.html`. |
| `css/modules/temporadas.css` | Carregado | CSS próprio grande para Temporadas, com padrões de modal, cards, botões e z-index próprios. |
| `js/core/ui.js` | Funcional, mas visualmente acoplado | `UI.modal`, `UI.confirm`, `toast`, `loading`, badges e subtabs usam estilos inline. |
| `js/core/router.js` | OK | Router simples por hash, com fallback por rota base. |
| `js/modules/catalogo.js` | Funcional, grande e visualmente acoplado | Muitos helpers locais de card/input e muitos modais via `UI.modal`. |
| `js/modules/pedidos.js` | Funcional, alto risco visual | Mistura `UI.modal` com overlays próprios full-screen e modais manuais. |
| `js/modules/clientes.js` | Funcional | Usa `UI.modal`, helpers locais e estilo inline. |
| `js/modules/loja_online.js` | Wrapper | Delega para `Modules.Catalogo.render(sub)`. |
| `js/modules/marketing.js` | Funcional, alto volume | Usa `UI.modal` e possui shell próprio para upsell. |
| `js/modules/financeiro.js` | Funcional, alto volume | Muitos `UI.modal`, tabelas e campos inline. |
| `js/modules/configuracoes.js` | Funcional | Usa `UI.modal`, helpers próprios e muitos blocos inline. |
| `js/modules/temporadas.js` | Funcional | Usa modais próprios com CSS em `css/modules/temporadas.css`. |
| `js/modules/crescimento.js` | Existente, não carregado no Admin atual | Parece módulo legado ou substituído por Plano de Voo/Performance/Temporadas no menu Crescimento. |
| `js/modules/operacao.js` | Existente, não carregado no Admin atual | Parece módulo preparado para operação, mas ausente do `admin.html` e do menu atual. |

## 3. Módulos carregados no `admin.html`

Referência: `admin.html:332-348`.

Carregados:

| Script | Módulo esperado |
|---|---|
| `js/modules/dashboard.js` | `Modules.Dashboard` |
| `js/modules/pedidos.js` | `Modules.Pedidos` |
| `js/modules/pos.js` | `Modules.POS` |
| `js/modules/catalogo.js` | `Modules.Catalogo` |
| `js/modules/loja_online.js` | `Modules.LojaOnline` |
| `js/modules/receitas.js` | `Modules.Receitas` |
| `js/modules/clientes.js` | `Modules.Clientes` |
| `js/modules/marketing.js` | `Modules.Marketing` |
| `js/modules/plano_voo.js` | `Modules.PlanoDeVoo` |
| `js/modules/performance.js` | `Modules.Performance` |
| `js/services/seasons.ai.js` | Serviço de IA de Temporadas |
| `js/modules/temporadas.js` | `Modules.Temporadas` |
| `js/modules/compras.js` | `Modules.Compras` |
| `js/modules/dinheiro.js` | `Modules.Dinheiro` |
| `js/modules/fiscal.js` | `Modules.Fiscal` |
| `js/modules/financeiro.js` | `Modules.Financeiro` |
| `js/modules/configuracoes.js` | `Modules.Configuracoes` |

## 4. Módulos existentes mas não carregados

Referência de arquivos existentes: `js/modules/`.

| Arquivo | Situação | Risco |
|---|---|---|
| `js/modules/crescimento.js` | Existe, mas não é carregado em `admin.html` | Parece legado. O menu atual de Crescimento aponta para Plano de Voo, Performance e Temporadas. Não padronizar antes de decidir se ainda é usado. |
| `js/modules/operacao.js` | Existe, mas não é carregado em `admin.html` | Parece módulo operacional preparado, mas não acessível pelo menu nem registrado. Não padronizar visualmente antes de confirmar se entrará no Admin. |

## 5. Rotas registradas

Referência: `admin.html:641-679`.

Rotas registradas explicitamente:

| Rota | Módulo |
|---|---|
| `dashboard` | `Modules.Dashboard` |
| `venda-presencial` | `Modules.POS` |
| `tpv` | `Modules.POS` |
| `pedidos`, `pedidos/cozinha`, `pedidos/lista`, `pedidos/avaliacoes` | `Modules.Pedidos` |
| `pedidos/clientes`, `clientes` | `Modules.Clientes` |
| `catalogo`, `catalogo/configuracoes` | `Modules.Catalogo` |
| `receitas` | `Modules.Receitas` |
| `marketing`, `marketing/avaliacoes`, `marketing/pontos` | `Modules.Marketing` |
| `loja-online`, `loja-online/template`, `loja-online/seo`, `loja-online/avaliacoes` | `Modules.LojaOnline` |
| `catalogo/seo`, `catalogo/template`, `catalogo/avaliacoes` | `Modules.LojaOnline` |
| `crescimento`, `crescimento/plano-de-voo`, `crescimento/plano-de-voo/simulacao`, `crescimento/plano-de-voo/comparacao`, `crescimento/plano-de-voo/snapshots` | `Modules.PlanoDeVoo` |
| `crescimento/performance`, `performance` | `Modules.Performance` |
| `crescimento/temporadas` | `Modules.Temporadas` |
| `plano-de-voo`, `plano-de-voo/simulacao`, `plano-de-voo/comparacao`, `plano-de-voo/snapshots` | `Modules.PlanoDeVoo` |
| `compras` | `Modules.Compras` |
| `dinheiro` | `Modules.Dinheiro` |
| `fiscal` | `Modules.Fiscal` |
| `financeiro` | `Modules.Financeiro` |
| `configuracoes` | `Modules.Configuracoes` |

Observação técnica: rotas como `financeiro/visao-geral`, `compras/registros` e `dinheiro/resumo` aparecem no menu, mas não precisam estar registradas explicitamente porque `js/core/router.js:20-23` tenta `_routes[hash]` e depois `_routes[base]`.

## 6. Rotas no menu

Referência: `admin.html:176-286`.

Rotas visíveis:

| Grupo | Rotas no menu |
|---|---|
| Início | `dashboard` |
| Pedidos | `pedidos`, `pedidos/cozinha`, `pedidos/lista`, `pedidos/clientes` |
| Venda presencial | `venda-presencial` |
| Cardápio | `catalogo`, `catalogo/produtos`, `catalogo/configuracoes` |
| Loja Online | `loja-online`, `loja-online/template`, `loja-online/seo`, `loja-online/avaliacoes` |
| Produção | `receitas`, `receitas/receitas`, `receitas/insumos`, `receitas/configuracoes` |
| Compras | `compras`, `compras/registros`, `compras/itens`, `compras/fornecedores`, `compras/configuracoes` |
| Preços e Margem | `dinheiro`, `dinheiro/resumo`, `dinheiro/precos`, `dinheiro/lista`, `dinheiro/simulador`, `dinheiro/regras` |
| Ações de Vendas | `marketing`, `marketing/promocoes`, `marketing/cupons`, `marketing/upsell`, `marketing/pontos` |
| Crescimento | `crescimento`, `crescimento/plano-de-voo`, `crescimento/performance`, `crescimento/temporadas` |
| Financeiro | `financeiro`, `financeiro/visao-geral`, `financeiro/fluxo-caixa`, `financeiro/movimentacoes`, `financeiro/contas-pagar`, `financeiro/configuracoes` |
| Fiscal | `fiscal`, `fiscal/resumo`, `fiscal/iva`, `fiscal/irpf`, `fiscal/configuracoes` |
| Configurações | `configuracoes`, `configuracoes/geral`, `configuracoes/tpv`, `configuracoes/dominio`, `configuracoes/integracoes`, `configuracoes/plano` |

## 7. Rotas registradas que não aparecem no menu

| Rota | Leitura técnica |
|---|---|
| `tpv` | Alias de `venda-presencial`. Parece compatibilidade/legado. |
| `pedidos/avaliacoes` | Registrada, mas avaliações aparecem no menu como `loja-online/avaliacoes`. Possível legado/duplicidade de responsabilidade. |
| `clientes` | Registrada, mas Clientes aparece no menu dentro de Pedidos como `pedidos/clientes`. Possível rota direta legada. |
| `marketing/avaliacoes` | Registrada, mas o menu usa `loja-online/avaliacoes`. Possível rota antiga. |
| `catalogo/seo`, `catalogo/template`, `catalogo/avaliacoes` | Registradas para `Modules.LojaOnline`, mas o menu usa `loja-online/*`. Compatibilidade com navegação antiga. |
| `plano-de-voo`, `plano-de-voo/simulacao`, `plano-de-voo/comparacao`, `plano-de-voo/snapshots` | Registradas fora do grupo `crescimento/*`. Parecem aliases legados. |
| `performance` | Registrada fora do grupo `crescimento/performance`. Alias legado provável. |

## 8. Rotas no menu que não têm registro exato

Funcionam por fallback para a base no router:

| Rota de menu | Base registrada | Observação |
|---|---|---|
| `catalogo/produtos` | `catalogo` | OK por fallback. |
| `receitas/receitas`, `receitas/insumos`, `receitas/configuracoes` | `receitas` | OK por fallback. |
| `compras/registros`, `compras/itens`, `compras/fornecedores`, `compras/configuracoes` | `compras` | OK por fallback. |
| `dinheiro/resumo`, `dinheiro/precos`, `dinheiro/lista`, `dinheiro/simulador`, `dinheiro/regras` | `dinheiro` | OK por fallback. |
| `marketing/promocoes`, `marketing/cupons`, `marketing/upsell` | `marketing` | OK por fallback. |
| `financeiro/visao-geral`, `financeiro/fluxo-caixa`, `financeiro/movimentacoes`, `financeiro/contas-pagar`, `financeiro/configuracoes` | `financeiro` | OK por fallback. |
| `fiscal/resumo`, `fiscal/iva`, `fiscal/irpf`, `fiscal/configuracoes` | `fiscal` | OK por fallback. |
| `configuracoes/geral`, `configuracoes/tpv`, `configuracoes/dominio`, `configuracoes/integracoes`, `configuracoes/plano` | `configuracoes` | OK por fallback. |

## 9. Rotas legadas ou duplicadas prováveis

| Área | Rota/arquivo | Motivo |
|---|---|---|
| Crescimento | `js/modules/crescimento.js` | Arquivo existe, mas Admin atual usa `plano_voo.js`, `performance.js` e `temporadas.js`. |
| Operação | `js/modules/operacao.js` | Arquivo existe, mas não está carregado/registrado. Há sobreposição com Loja Online/Template e Configurações. |
| Avaliações | `pedidos/avaliacoes`, `marketing/avaliacoes`, `catalogo/avaliacoes`, `loja-online/avaliacoes` | Muitas portas para a mesma responsabilidade. O menu atual privilegia Loja Online. |
| Loja Online vs Catálogo | `catalogo/template`, `catalogo/seo`, `catalogo/avaliacoes` e `loja-online/*` | `loja_online.js` é wrapper de `Catalogo`, indicando transição de responsabilidade. |
| Plano de Voo | `plano-de-voo/*` e `crescimento/plano-de-voo/*` | Aliases antigos preservados. |
| TPV | `tpv` e `venda-presencial` | Alias de compatibilidade. |
| Financeiro | `financeiro/entradas`, `financeiro/saidas`, `financeiro/apagar`, `financeiro/contas-bancarias` | Tratadas internamente como legadas/aliases em `js/modules/financeiro.js:71-74`. |
| Compras | `compras/tipos`, `compras/categorias` | Tratadas internamente como rotas legadas em `js/modules/compras.js:102-105`. |

## 10. Mapa dos modais

### Modais via `UI.modal`

Base técnica: `js/core/ui.js:51-79`.

| Arquivo | Usos principais | Observação |
|---|---|---|
| `js/modules/catalogo.js` | filtros, produto, importação, categoria, produto pronto, variantes, item de custo, ficha, tag | Padrão funcional, mas conteúdo e footer usam muitos estilos inline. Exemplos: `js/modules/catalogo.js:610`, `1015`, `2398`, `4941`, `5124`, `5261`, `5430`, `5870`, `6002`, `6403`. |
| `js/modules/clientes.js` | cliente, detalhes, histórico, segmento | Usa `UI.modal`; modais grandes podem depender do `max-height:90vh` do core. Exemplos: `js/modules/clientes.js:183`, `272`, `287`, `319`. |
| `js/modules/marketing.js` | pontos, avaliação, promoção, cupom, resposta | Usa `UI.modal`; upsell tem shell próprio separado. Exemplos: `js/modules/marketing.js:775`, `1436`, `3183`, `3572`, `5903`. |
| `js/modules/financeiro.js` | entradas, saídas, bulk actions, detalhes, contas, compras, categorias, fornecedores, pagamento | Uso intenso de `UI.modal`. Exemplos: `js/modules/financeiro.js:1113`, `1535`, `1722`, `2042`, `2080`, `2472`, `2734`, `2855`, `3183`, `3384`, `3520`, `3677`, `3900`, `3975`, `4065`. |
| `js/modules/configuracoes.js` | fornecedor, unidade | Usa `UI.modal` em `js/modules/configuracoes.js:617` e `666`. |
| `js/modules/pedidos.js` | avaliações, histórico, resumo fallback | Usa `UI.modal` em alguns pontos, mas também usa overlays próprios. Exemplos: `js/modules/pedidos.js:779`, `807`, `824`, `2251`. |

### Overlays próprios

| Arquivo | Overlay | Linhas | Risco |
|---|---|---:|---|
| `js/core/ui.js` | `UI.confirm` | `34-45` | Overlay próprio com `z-index:8000`, acima de `UI.modal` (`7000`). OK, mas todo estilo é inline. |
| `js/modules/temporadas.js` + CSS | `.seasons-modal-backdrop`, `.seasons-modal` | JS `789`, `803`, `993`, `1231`; CSS `1421-1438` | Usa `z-index:200`, muito abaixo dos modais globais. Pode ficar atrás de elementos globais se coexistir com outros overlays. |
| `js/modules/temporadas.js` | celebrações de meta/vitória | `820-886` | Overlay visual próprio, não é modal de formulário. Checar bloqueio de clique e remoção em mobile antes de padronizar. |
| `js/modules/pedidos.js` | modo cozinha full-screen | `1533-1558` | `z-index:20000`, altera `document.body.style.overflow`. Alto risco de travar scroll se o fechamento falhar. |
| `js/modules/pedidos.js` | modal de cliente do pedido | `1767-1782` | `z-index:9100`, estilo inline, sem fechamento por clique no fundo visível no trecho analisado. |
| `js/modules/pedidos.js` | detalhe do pedido | `2227-2246` | `z-index:9000`, altera `body.style.overflow`, modal grande de 1120px. Risco mobile se conteúdo interno exceder. |
| `js/modules/pedidos.js` | pedido manual | `2590-2738` e `3586-3706` | `z-index:7000`, grid largo, max-width 1240px. Alto risco de overflow horizontal em mobile. Há versões duplicadas/semelhantes de overlay manual. |
| `js/modules/pedidos.js` | painel detalhe na cozinha | `1962-2041` | Overlay/painel absoluto dentro do modo cozinha com `z-index:20011/20012`. Não usa padrão global. |
| `js/modules/marketing.js` | shell próprio de upsell | `3790-3828` | Muito parecido com `UI.modal`, mas implementado à parte. Bom candidato para convergir depois para um modal com variantes. |
| `js/modules/dinheiro.js` | modal de preço de produto | `894-903` | Overlay próprio em módulo carregado pelo Admin, embora não estivesse na lista inicial. Usa `z-index:10000` e cor `#C4362A`. |

### Riscos de modais

- Z-index sem escala única: `200`, `7000`, `8000`, `9000`, `9100`, `10000`, `20000`.
- `body.style.overflow = 'hidden'` aparece em overlays próprios de Pedidos; precisa sempre restaurar no fechamento.
- `UI.modal` tem `max-height:90vh` e `overflow-y:auto`, mas não tem classes CSS externas para ajustes responsivos por tipo de modal.
- Alguns modais grandes usam `max-width:1120px` ou `1240px`, com grids internos largos e risco real em mobile.
- Muitos botões de fechamento usam caracteres `✕`/`×` e estilos diferentes.

## 11. Mapa do design system atual

### Cores principais encontradas

Base em `admin.html:15-18`:

| Token atual | Valor |
|---|---|
| `--red` | `#B42318` |
| `--red-dark` | `#8F1E14` |
| `--dark` | `#1F1F1F` |
| `--white` | `#fff` |
| `--off` | `#FAFAF8` |
| `--line` | `#EAE4DA` |
| `--mid` | `#D9D1C7` |
| `--muted` | `#6F6860` |
| `--gold` | `#B6925E` |
| `--green` | `#1A9E5A` |
| `--blue` | `#2563EB` |
| `--orange` | `#D97706` |
| `--shadow` | `0 12px 30px rgba(31,31,31,.06)` |

Inconsistências relevantes:

- Vermelhos misturados: `#B42318` no shell e em muitos módulos; `#C4362A` no `UI.modal`, `UI.confirm`, subtabs e partes de Configurações/Clientes/Dinheiro.
- Tons de fundo misturados: `#FAFAF8`, `#FAF8F4`, `#FBF5F3`, `#F2EDED`, `#FCEEEE`, `#FFF0EE`.
- Tons de texto secundário misturados: `#6F6860`, `#8A7E7C`, `#736B60`, `#A39B90`.

### Fontes encontradas

| Fonte | Onde aparece | Status |
|---|---|---|
| `Manrope` | Fonte base do Admin em `admin.html:21` | Padrão principal. |
| `Inter` | Fallback carregado junto com Manrope | OK como fallback. |
| `Material Icons Round` | Ícones em `admin.html:12` e `.mi` em `admin.html:23` | OK. |
| `League Spartan` | `js/core/ui.js:56`, `js/modules/clientes.js:102`, `js/modules/pedidos.js:1317`, `2256`, `2601`, `2716` | Problema: não é carregada em `admin.html`; pode cair em fallback e variar visualmente. |

### Botões

Padrões existentes:

- Botão primário global: `.primary-action` em `admin.html:37`.
- Botão secundário global: `.secondary-action` em `admin.html:132`.
- Botões de menu: `.nav-item`, `.nav-sub-item` em `admin.html:49-58`.
- Botões próprios por módulo: helpers como `_primaryBtn()` em `clientes.js:684`, `_configPrimaryStyle()` em `configuracoes.js:1107`, `_marketingCardStyle()`/helpers em `marketing.js:1635-1692`, `_cardStyle()`/`_inputStyle()` em `catalogo.js:2447-2449`.

Inconsistências:

- Raio varia entre 9, 10, 11, 12, 14, 16, 18, 20 e 999px.
- Primário às vezes usa `#B42318`, às vezes `#C4362A`.
- Pesos variam entre 500, 600, 700, 800 e 900 para botões similares.
- Alguns botões têm sombras fortes; outros não têm sombra.

### Cards

Padrões existentes:

- `.settings-card` em `admin.html:124`.
- `.kpi-tile` em `admin.html:134`.
- `_cardStyle()` em `catalogo.js:2449`.
- `_panel()` em `clientes.js:687`.
- `_configCardStyle()` em `configuracoes.js:1048`.
- `_cfgCardStyle()` em `financeiro.js:3802`.
- Cards próprios de Temporadas em `css/modules/temporadas.css`.

Inconsistências:

- Alguns cards usam borda + sombra; outros usam `border:none` + sombra.
- Raio padrão oscila entre 12, 14, 15, 16, 18 e 20.
- Há cards dentro de cards em módulos grandes, especialmente Catálogo, Financeiro e Configurações.

### Tabelas

Padrões encontrados:

- `class="bf-table"` em Catálogo, Pedidos e Marketing.
- Tabelas inline com `border-collapse:collapse` em Configurações e Financeiro.
- Tabelas inline com `border-collapse:separate` e `border-spacing:0` em Pedidos, Catálogo, Marketing e Financeiro.

Risco:

- Não há um padrão único para cabeçalho, densidade, hover, largura mínima e scroll horizontal.
- A padronização deve começar por classe CSS compatível com as tabelas existentes, sem alterar a montagem dos dados.

### Modais

Padrão global:

- `UI.modal` em `js/core/ui.js:51-79`.
- `UI.confirm` em `js/core/ui.js:34-45`.

Padrões alternativos:

- Temporadas usa `.seasons-modal-backdrop` e `.seasons-modal`.
- Pedidos usa vários overlays próprios.
- Marketing usa `_openUpsellShell`.
- Dinheiro usa overlay próprio.

Inconsistência principal: há pelo menos quatro famílias de modal/overlay convivendo.

## 12. Riscos reais

1. Quebra mobile por modais grandes:
   - Pedido manual (`js/modules/pedidos.js:2590-2738`, `3586-3706`) tem largura máxima alta e grid interno largo.
   - Detalhe do pedido (`js/modules/pedidos.js:2227-2246`) tem max-width de 1120px.

2. Z-index imprevisível:
   - Temporadas usa `z-index:200`.
   - UI global usa `7000/8000/9998/9999`.
   - Pedidos usa `9000/9100/20000`.
   - Dinheiro usa `10000`.

3. Fonte não carregada:
   - `League Spartan` é usada, mas não aparece no link de fontes do Admin. O link atual em `admin.html:11` carrega Manrope e Inter.

4. Duplicidade de responsabilidade:
   - Avaliações aparecem registradas em Pedidos, Marketing, Catálogo e Loja Online.
   - Operação existe como módulo, mas parte dos dados/controles está em Catálogo/Template e Configurações.
   - Loja Online é wrapper de Catálogo.

5. Dificuldade de padronização:
   - Muitos estilos são strings inline. Alterar visual em massa dentro dos módulos grandes aumenta risco de regressão funcional.

## 13. O que NÃO deve ser mexido agora

- Não mexer em Firebase, Auth, DB, tenant, permissões, regras ou estrutura de dados.
- Não alterar `Router.register` nem remover aliases/rotas legadas agora.
- Não apagar `crescimento.js` ou `operacao.js`.
- Não mover responsabilidades entre módulos.
- Não refatorar `catalogo.js`, `pedidos.js`, `financeiro.js` ou `marketing.js` nesta etapa.
- Não trocar `UI.modal` por overlays próprios, nem overlays próprios por `UI.modal`, sem etapa específica de QA.
- Não alterar textos finais exibidos ao cliente público sem revisão de idioma.

## 14. Ordem recomendada de correção

1. Documentar e aprovar tokens CSS do Admin.
2. Criar uma camada visual segura, preferencialmente `css/admin.css`, carregada em `admin.html`, mantendo os tokens atuais como alias.
3. Padronizar somente elementos globais primeiro: botões, cards, inputs, tabelas, badges e modal base.
4. Ajustar `js/core/ui.js` para emitir classes CSS além dos estilos atuais, mantendo compatibilidade.
5. Padronizar z-index em tokens sem mudar fluxo.
6. Atacar módulos de baixo risco: Configurações e Clientes.
7. Depois padronizar Catálogo, Marketing e Financeiro por partes.
8. Deixar Pedidos e Temporadas para etapa dedicada, porque têm overlays, telas full-screen e estados especiais.
9. Só depois decidir o destino de `crescimento.js`, `operacao.js` e aliases de rota.

## 15. Arquivos candidatos para primeira etapa segura

Primeira etapa segura:

- `admin.html`: apenas para carregar um CSS externo do Admin e, se aprovado, retirar gradualmente CSS base inline em etapa separada.
- Novo `css/admin.css`: tokens, botões, cards, tabelas, modais e utilitários compatíveis.
- `js/core/ui.js`: apenas adicionar classes previsíveis nos elementos criados por `UI.modal`, `UI.confirm`, `toast` e `loading`, sem alterar comportamento.
- `AI_CHANGELOG.md`: registrar cada etapa.

Segunda etapa, após validação visual:

- `js/modules/clientes.js`
- `js/modules/configuracoes.js`
- partes pequenas de `js/modules/catalogo.js` ligadas a helpers visuais reutilizados.

Evitar na primeira etapa:

- `js/modules/pedidos.js`
- `js/modules/financeiro.js`
- `js/modules/marketing.js`
- `js/modules/temporadas.js`
- `css/modules/temporadas.css`

## 16. Proposta de tokens CSS padrão para o Admin

Proposta compatível com o que já existe:

```css
:root {
  --bf-color-brand: #B42318;
  --bf-color-brand-hover: #8F1E14;
  --bf-color-brand-alt: #C4362A;

  --bf-color-text: #1F1F1F;
  --bf-color-muted: #6F6860;
  --bf-color-muted-2: #8A7E7C;

  --bf-color-bg: #FFFFFF;
  --bf-color-bg-soft: #FAFAF8;
  --bf-color-bg-warm: #FAF8F4;
  --bf-color-line: #EAE4DA;
  --bf-color-line-strong: #D9D1C7;

  --bf-color-success: #1A9E5A;
  --bf-color-info: #2563EB;
  --bf-color-warning: #D97706;
  --bf-color-gold: #B6925E;

  --bf-font-sans: 'Manrope', 'Inter', sans-serif;

  --bf-radius-xs: 8px;
  --bf-radius-sm: 10px;
  --bf-radius-md: 12px;
  --bf-radius-lg: 16px;
  --bf-radius-xl: 18px;
  --bf-radius-pill: 999px;

  --bf-shadow-sm: 0 1px 2px rgba(31, 31, 31, .03);
  --bf-shadow-card: 0 12px 30px rgba(31, 31, 31, .06);
  --bf-shadow-modal: 0 24px 70px rgba(31, 31, 31, .22);
  --bf-shadow-brand: 0 8px 18px rgba(180, 35, 24, .16);

  --bf-z-dropdown: 1000;
  --bf-z-sticky: 2000;
  --bf-z-modal: 7000;
  --bf-z-confirm: 8000;
  --bf-z-overlay-high: 9000;
  --bf-z-loading: 9998;
  --bf-z-toast: 9999;
  --bf-z-fullscreen: 20000;
}
```

Recomendação: manter `--red`, `--red-dark`, `--dark`, `--line`, `--muted` por compatibilidade e apontá-los para os novos tokens em uma etapa posterior.

## 17. Plano técnico de padronização segura

### Etapa 1: inventário e tokens

- Criar `css/admin.css` com tokens e classes novas.
- Não remover o `<style>` inline de `admin.html` ainda.
- Adicionar classes globais como `.bf-btn`, `.bf-btn-primary`, `.bf-card`, `.bf-table`, `.bf-modal`, `.bf-field`.
- Manter compatibilidade com `.primary-action`, `.secondary-action`, `.settings-card`, `.kpi-tile`, `.module-tabs`.

### Etapa 2: UI core

- Atualizar `UI.modal` para usar classes e preservar fallback inline.
- Atualizar `UI.confirm` para usar a mesma escala de modal.
- Definir z-index por token.
- Garantir fechamento por botão, fundo e Escape, se aprovado em tarefa futura.

### Etapa 3: baixo risco

- Aplicar classes em Clientes e Configurações, onde o volume é menor.
- Validar desktop/mobile.

### Etapa 4: módulos médios/grandes

- Catálogo: padronizar helpers `_inputStyle`, `_cardStyle`, botões e tabelas por blocos.
- Financeiro: padronizar tabelas e modais por bloco, sem mexer cálculos.
- Marketing: unificar `_openUpsellShell` com padrão global ou criar variante `UI.modal({ layout: 'shell' })`.

### Etapa 5: alto risco

- Pedidos: tratar overlays próprios, pedido manual, cozinha e detalhe de pedido em tarefa dedicada.
- Temporadas: alinhar z-index, modal e tokens sem perder CSS específico da experiência de temporadas.

## 18. Status atual por área

| Área | Status atual | Falta algo? | Padronização visual |
|---|---|---|---|
| Shell Admin | OK funcional | CSS externo dedicado | Parcial |
| Router | OK funcional | Mapa oficial de aliases/legados | OK técnico |
| Menu | OK funcional | Decisão sobre rotas legadas/duplicadas | Parcial |
| UI core | OK funcional | Tokens/classes e acessibilidade de modal | Parcial |
| Catálogo/Loja Online | OK funcional | Separar responsabilidades no futuro | Parcial |
| Pedidos | OK funcional | Unificar overlays e testar mobile | Baixa consistência |
| Clientes | OK funcional | Padronizar helpers visuais | Média |
| Marketing | OK funcional | Unificar shell de upsell/modal | Média |
| Financeiro | OK funcional | Padronizar tabelas e modais | Média |
| Configurações | OK funcional | Padronizar componentes | Média |
| Temporadas | OK funcional | Alinhar z-index/tokens com Admin | Visual próprio |
| Crescimento legado | Não carregado | Decidir se remover, migrar ou ignorar | Fora do Admin atual |
| Operação | Não carregado | Decidir entrada no menu/rotas | Fora do Admin atual |

## 19. Recomendação final

O Admin pode ser padronizado com segurança, mas a primeira entrega deve ser uma camada visual compatível, não uma refatoração dos módulos. O caminho mais seguro é criar tokens e classes globais, evoluir `UI.modal`/`UI.confirm`, e só depois migrar módulos por partes.

Não é recomendado começar por Pedidos, Financeiro, Marketing ou Temporadas. Pedidos tem overlays full-screen e fluxo operacional crítico; Temporadas tem CSS próprio e experiência específica; Financeiro e Marketing têm muitos formulários e tabelas.

A decisão mais importante antes de padronizar visualmente é separar o que é rota ativa, alias legado e módulo não carregado. `crescimento.js`, `operacao.js`, aliases de Plano de Voo e múltiplas rotas de Avaliações devem ser tratados como inventário técnico antes de qualquer limpeza.
